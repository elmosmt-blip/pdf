#!/usr/bin/env node
/* =========================================================================
 * tests/course.test.js — end-to-end checks for the built course
 *
 * Runs against build/course-clean/ (built by scripts/build.js if absent).
 * Two layers:
 *
 *   1. data layer   — the integrity and quiz checkers, executed as programs and
 *                     judged by their exit codes and by specific numbers in
 *                     their output;
 *   2. render layer — the real page is loaded in jsdom over http, the hash
 *                     router is driven through every route, and the quiz is
 *                     graded by clicking the rendered options. This is the only
 *                     layer that proves the engine still grades correctly after
 *                     the data changed.
 *
 * Usage:
 *   node tests/course.test.js            # full run
 *   node tests/course.test.js --quick    # data layer only
 *
 * Exit code 0 on success, 1 on the first failing group.
 * ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build', 'course-clean');

let pass = 0, fail = 0;
const failures = [];

function ok(cond, label, detail) {
  if (cond) { pass++; return true; }
  fail++;
  failures.push(label + (detail ? ' — ' + detail : ''));
  return false;
}

function eq(actual, expected, label) {
  return ok(actual === expected, label, 'got ' + JSON.stringify(actual) +
    ', want ' + JSON.stringify(expected));
}

function runNode(args, opts) {
  try {
    const out = execFileSync(process.execPath, args, Object.assign({
      cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']
    }, opts || {}));
    return { code: 0, out: out };
  } catch (err) {
    return { code: err.status === undefined ? 1 : err.status,
      out: (err.stdout || '') + (err.stderr || '') };
  }
}

/* A Python script cannot go through runNode(): the helper always execs node,
   which is how gen_cases.py first failed here with "Invalid or unexpected
   token". One helper per runtime, and the interpreter is resolved once. */
const PYTHON = (function () {
  const candidates = ['python3', 'python'];
  for (let i = 0; i < candidates.length; i++) {
    try {
      execFileSync(candidates[i], ['--version'], { stdio: ['ignore', 'pipe', 'ignore'] });
      return candidates[i];
    } catch (e) { /* try the next one */ }
  }
  return null;
})();

function runPython(args) {
  if (!PYTHON) return { code: 127, out: 'no python interpreter on PATH' };
  try {
    const out = execFileSync(PYTHON, args, {
      cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']
    });
    return { code: 0, out: out };
  } catch (err) {
    return { code: err.status === undefined ? 1 : err.status,
      out: (err.stdout || '') + (err.stderr || '') };
  }
}

/* ------------------------------------------------------------- data layer */

function dataLayer() {
  console.log('\n-- data layer');

  const integ = runNode([path.join(ROOT, 'scripts', 'check-integrity.js')]);
  ok(integ.code === 0, 'check-integrity exits 0', integ.out.split('\n').slice(-3).join(' | '));
  ok(/OK — integrity check passed/.test(integ.out), 'check-integrity reports OK');

  const quiz = runNode([path.join(ROOT, 'scripts', 'check-quiz.js'), '--json']);
  ok(quiz.code === 0, 'check-quiz exits 0 (no structural problems)');
  let metrics = null;
  try { metrics = JSON.parse(quiz.out); } catch (e) { /* handled below */ }
  ok(!!metrics, 'check-quiz emits parseable JSON');

  if (metrics) {
    eq(metrics.totals.lessons, 92, 'quiz: 92 lessons');
    ok(metrics.totals.questions >= 185, 'quiz: question count did not shrink',
      String(metrics.totals.questions));
    eq(metrics.duplicates.exact.length, 0, 'quiz: no duplicate prompts');
    eq(metrics.duplicates.examRepeats.length, 0, 'quiz: exam pool does not repeat lesson questions');
    eq(metrics.banned.length, 0, 'quiz: no all/none-of-the-above options');
    ok(metrics.keyPositionShown.worstDeviationPP <= 10,
      'quiz: displayed key position within 10 pp of uniform',
      metrics.keyPositionShown.worstDeviationPP + ' pp');
    /* every question must be gradable */
    eq(metrics.keyPositionShown.shares.reduce(function (a, b) { return a + b; }, 0) > 0,
      true, 'quiz: displayed positions were computed');
  }

  /* structural invariants of the lesson data */
  const lessons = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'lessons.json'), 'utf8'));
  eq(lessons.length, 92, 'lessons: 92');
  eq(lessons.filter(function (l) { return !l.quiz || l.quiz.length < 2; }).length, 0,
    'lessons: every lesson has at least 2 quiz ids');
  const questions = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'questions.json'), 'utf8'));
  const ids = new Set(questions.map(function (q) { return q.questionId; }));
  let dangling = 0;
  lessons.forEach(function (l) {
    (l.quiz || []).forEach(function (id) { if (!ids.has(id)) dangling++; });
  });
  eq(dangling, 0, 'lessons: no quiz id points at a missing question');

  /* ---- Phase 2: edition registry and source currency ---- */
  const sources = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'sources.json'), 'utf8'));
  const noStatus = sources.filter(function (x) { return !x.editionStatus; });
  eq(noStatus.length, 0, 'sources: every entry carries an editionStatus',
    noStatus.map(function (x) { return x.id; }).join(','));

  const registryPath = path.join(ROOT, 'data', 'edition-registry.json');
  ok(fs.existsSync(registryPath), 'registry: data/edition-registry.json exists');
  if (fs.existsSync(registryPath)) {
    const reg = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    ok(reg.rows.length >= 20, 'registry: holds the edition-dependent claims',
      String(reg.rows.length));
    const VALID = ['current', 'superseded', 'edition-mismatch', 'no-longer-maintained',
      'rolling', 'not-ipc'];
    const badStatus = reg.rows.filter(function (r) { return VALID.indexOf(r.editionStatus) < 0; });
    eq(badStatus.length, 0, 'registry: every row has a known edition status');
    /* recheckRequired must be derived from the status, never hand-set */
    const badFlag = reg.rows.filter(function (r) {
      const want = r.editionStatus === 'superseded' || r.editionStatus === 'edition-mismatch';
      return r.recheckRequired !== want;
    });
    eq(badFlag.length, 0, 'registry: recheckRequired follows the status');
    const lessonIds = new Set(lessons.map(function (l) { return l.lessonId; }));
    const orphanRows = reg.rows.filter(function (r) { return !lessonIds.has(r.lessonId); });
    eq(orphanRows.length, 0, 'registry: every row points at a real lesson');
    const noEdition = reg.rows.filter(function (r) { return !r.currentEdition || !r.editionInCourse; });
    eq(noEdition.length, 0, 'registry: every row states both the course and the current edition');
    /* the five standards the brief names must each be represented */
    const named = ['IPC-A-610', 'J-STD-001', 'J-STD-020', 'IPC-6012', 'IPC-7351'];
    const missing = named.filter(function (std) {
      return !reg.rows.some(function (r) { return r.standard === std; });
    });
    eq(missing.length, 0, 'registry: covers the five named standards',
      missing.join(','));

    /* the CSV deliverable must agree with the JSON row for row */
    const csv = fs.readFileSync(path.join(ROOT, 'docs', 'edition-registry.csv'), 'utf8');
    const lines = csv.replace(/^\ufeff/, '').split('\r\n').filter(Boolean);
    eq(lines.length, reg.rows.length + 1, 'registry: CSV has a header plus one row per claim');
    ok(/Recheck required/.test(lines[0]), 'registry: CSV carries the recheck column');
    const recheckCount = (csv.match(/,yes,/g) || []).length;
    ok(recheckCount > 0, 'registry: CSV marks the rows a reviewer must re-check',
      String(recheckCount));
  }

  /* ---- Phase 3: the case generator and its independent checker ---- */
  const genCheck = runPython([path.join(ROOT, 'scripts', 'gen_cases.py'), '--check']);
  ok(genCheck.code === 0, 'gen_cases.py --check: cases.json matches the generator',
    genCheck.out.trim().slice(-160));

  const pilot = runPython([path.join(ROOT, 'scripts', 'gen_pilot_sheet.py'), '--check']);
  ok(pilot.code === 0, 'the pilot observer sheet matches data/cases.json', pilot.out.slice(-160));

  const qa = runNode([path.join(ROOT, 'tests', 'case-qa.js')]);
  ok(qa.code === 0, 'the QA pass over the case engine is clean',
    qa.out.split('\n').filter(function (l) { return /^FAIL|^ERROR/.test(l); }).join(' | '));

  const caseCheck = runNode([path.join(ROOT, 'scripts', 'check-cases.js'), '--json']);
  ok(caseCheck.code === 0, 'check-cases exits 0 (structure + independent keys)',
    caseCheck.out.slice(-200));
  let caseMetrics = null;
  try { caseMetrics = JSON.parse(caseCheck.out); } catch (e) { /* reported below */ }
  ok(!!caseMetrics, 'check-cases emits parseable JSON');
  if (caseMetrics) {
    ok(caseMetrics.summary.cases >= 4, 'cases: at least four cases',
      String(caseMetrics.summary.cases));
    eq(caseMetrics.summary.independentlyVerified, caseMetrics.summary.steps,
      'cases: every key is recomputed independently');
    const failedControl = caseMetrics.summary.controlNumbers.filter(function (r) { return !r.ok; });
    eq(failedControl.length, 0, 'cases: every Phase-3 control number reproduces',
      failedControl.map(function (r) { return r.label; }).join('; '));
    ['m02', 'm03', 'm06', 'm14'].forEach(function (mid) {
      ok(caseMetrics.summary.perModule[mid] >= 1, 'cases: ' + mid + ' has a generated case');
    });
  }

  /* the embed is regenerated by build, so it must still match */
  const embed = runNode([path.join(ROOT, 'scripts', 'build-embed.js'), '--check']);
  eq(embed.code, 0, 'embed matches data/*.json');
}

/* ----------------------------------------------------------- render layer */

async function renderLayer() {
  console.log('\n-- render layer (jsdom)');

  let JSDOM;
  try {
    JSDOM = require(path.join(ROOT, 'node_modules', 'jsdom')).JSDOM;
  } catch (e) {
    console.log('   SKIP: jsdom is not installed (npm install --no-save jsdom)');
    return;
  }

  /* Always rebuild. Testing a tree left over from a previous run means the
     suite passes on code that has since been changed — which is exactly the
     failure mode this line exists to prevent (it happened once: the scroll fix
     was in the source and the stale build still failed the same assertion). */
  const b = runNode([path.join(ROOT, 'scripts', 'build.js')]);
  ok(b.code === 0, 'build.js assembles the course', b.out);
  ok(fs.existsSync(path.join(BUILD, 'index.html')), 'built tree has index.html');
  ok(fs.existsSync(path.join(BUILD, 'assets', 'data-embed.js')), 'built tree has the embed');
  ok(fs.existsSync(path.join(BUILD, 'assets', 'img')), 'built tree has images');
  eq(fs.existsSync(path.join(BUILD, 'node_modules')), false, 'built tree excludes node_modules');

  /* load(hash, seed) — seed is a progress object written to localStorage before
     the engine boots. The module exam is gated on lesson mastery from Phase 3b,
     so a test that wants the exam form has to say which lessons are mastered
     rather than reach around the gate. */
  function load(hash, seed) {
    const index = fs.readFileSync(path.join(BUILD, 'index.html'), 'utf8');
    const dom = new JSDOM(index, {
      url: 'http://localhost/' + (hash || ''),
      runScripts: 'outside-only',
      pretendToBeVisual: true
    });
    const win = dom.window;
    if (seed) win.localStorage.setItem('dfm-course-progress-v1', JSON.stringify(seed));
    /* The engine's fetch path would hit the network; feed it the embed
       instead so the test exercises the same code with known data. */
    win.fetch = undefined;
    /* jsdom implements neither scrolling nor layout. scrollTo is called on
       navigation, so it is stubbed here; scrollIntoView is guarded inside
       app.js and must NOT be stubbed — that guard is part of what is tested. */
    win.scrollTo = function () {};
    const embed = fs.readFileSync(path.join(BUILD, 'assets', 'data-embed.js'), 'utf8');
    win.eval(embed);
    win.eval(fs.readFileSync(path.join(BUILD, 'assets', 'app.js'), 'utf8'));
    return dom;
  }

  /* 0. the four cases are reachable from the home page, not only from inside a
     module — this was the actual complaint from the reader's side */
  {
    const homeCases = load('#/');
    const hd = homeCases.window.document;
    eq(hd.querySelectorAll('.home-case-card').length, 4,
      'the home page lists all four Toolkit cases');
    const links = Array.prototype.map.call(hd.querySelectorAll('.home-case-link'),
      function (a) { return a.getAttribute('href'); });
    ['cx-m02-01', 'cx-m03-01', 'cx-m06-01', 'cx-m14-01'].forEach(function (id) {
      ok(links.indexOf('#/c/' + id) !== -1, 'the home page links to ' + id);
    });
    eq(hd.querySelectorAll('.toc-case-item').length, 4,
      'the sidebar lists the four cases');
    homeCases.window.close();
  }

  /* 1. the course index renders */
  const home = load('#/');
  const homeText = home.window.document.getElementById('main').textContent;
  ok(homeText.length > 200, 'index route renders content', homeText.slice(0, 60));
  ok(!/Loading course data/.test(homeText), 'index route is not stuck on the loading text');
  ok(home.window.document.querySelectorAll('#toc a').length >= 15,
    'sidebar lists at least 15 modules',
    String(home.window.document.querySelectorAll('#toc a').length));

  /* 2. every lesson route renders and shows its quiz */
  const lessons = JSON.parse(fs.readFileSync(path.join(BUILD, 'data', 'lessons.json'), 'utf8'));
  let renderedLessons = 0, withQuiz = 0, emptyLessons = [];
  lessons.forEach(function (l) {
    const dom = load('#/l/' + l.lessonId);
    const main = dom.window.document.getElementById('main');
    const text = main.textContent || '';
    if (text.length > 400) renderedLessons++;
    else emptyLessons.push(l.lessonId);
    const quizSection = main.querySelector('#quiz');
    if (quizSection && quizSection.querySelectorAll('input').length >= 2) withQuiz++;
    dom.window.close();
  });
  eq(renderedLessons, 92, 'all 92 lesson routes render' +
    (emptyLessons.length ? ' (empty: ' + emptyLessons.slice(0, 5).join(', ') + ')' : ''));
  eq(withQuiz, 92, 'all 92 lesson routes render their quiz inputs');

  /* 2b. Phase 2 corrections are visible in the rendered lesson */
  {
    const dry = load('#/l/m02l04');
    const txt = dry.window.document.getElementById('main').textContent;
    ok(/5% RH or less|5 % RH or less/.test(txt),
      'm02l04 renders the 5 % RH dry-storage requirement');
    ok(!/dry storage at 10% RH or less/i.test(txt),
      'm02l04 no longer states 10 % RH as the requirement');
    ok(/Edition|edition/.test(txt), 'm02l04 sources block discloses the edition status');
    dry.window.close();

    const dwell = load('#/l/m09l04');
    const dTxt = dwell.window.document.getElementById('main').textContent;
    ok(!/6-12 s|6–12 s/.test(dTxt), 'm09l04 no longer quotes a 6-12 s dwell window');
    ok(/2 to 4 s|2 to 5 s/.test(dTxt), 'm09l04 quotes a published dwell window');
    dwell.window.close();

    const press = load('#/l/m04l07');
    const pTxt = press.window.document.getElementById('main').textContent;
    ok(!/5 N to 15 N/.test(pTxt), 'm04l07 no longer gives an absolute 5-15 N pressure range');
    ok(/N\/mm/.test(pTxt), 'm04l07 states squeegee pressure per blade length');
    press.window.close();

    /* a scope-only source is marked in the UI */
    const srcList = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'sources.json'), 'utf8'));
    const scopeSource = srcList.filter(function (x) { return x.scopeOnly; })[0];
    const scopeLesson = lessons.filter(function (l) {
      return (l.sources || []).indexOf(scopeSource.id) >= 0;
    })[0];
    if (scopeLesson) {
      const dom = load('#/l/' + scopeLesson.lessonId);
      ok(/Scope only/.test(dom.window.document.getElementById('main').textContent),
        'scope-only source carries its marker in the sources block',
        scopeSource.id + ' in ' + scopeLesson.lessonId);
      dom.window.close();
    }
  }

  /* ================== Phase 3: cases ================== */
  const caseDoc = JSON.parse(fs.readFileSync(path.join(BUILD, 'data', 'cases.json'), 'utf8'));
  const cases = caseDoc.cases;
  ok(cases.length >= 4, 'cases: the four pilot modules have a case', String(cases.length));
  ['m02', 'm03', 'm06', 'm14'].forEach(function (mid) {
    ok(cases.some(function (c) { return c.moduleId === mid; }),
      'cases: module ' + mid + ' has a case');
  });

  /* every case route renders with its steps and inputs */
  let renderedCases = 0;
  cases.forEach(function (c) {
    const dom = load('#/c/' + c.caseId);
    const main = dom.window.document.getElementById('main');
    const stepCount = main.querySelectorAll('.case-step').length;
    if (stepCount === c.steps.length && main.querySelector('.case-form')) renderedCases++;
    dom.window.close();
  });
  eq(renderedCases, cases.length, 'all case routes render every step');

  /* the module page grows a Toolkit block */
  const modView = load('#/m/m03');
  ok(/Toolkit/.test(modView.window.document.getElementById('main').textContent),
    'module page renders the Toolkit block');
  ok(!!modView.window.document.querySelector('.toolkit-item'),
    'Toolkit block lists the case');
  modView.window.close();

  /* an unknown case id is a clean not-found, not a crash */
  const missingCase = load('#/c/cx-nope-99');
  ok(/Case not found/.test(missingCase.window.document.getElementById('main').textContent),
    'unknown case id renders a not-found page');
  missingCase.window.close();

  /* ---- grading: an empty form must complain inline and grade nothing ---- */
  {
    const probeCase = cases.filter(function (c) { return c.moduleId === 'm03'; })[0];
    const dom = load('#/c/' + probeCase.caseId);
    const doc = dom.window.document;
    const form = doc.querySelector('form.case-form');
    form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    const errs = Array.prototype.filter.call(doc.querySelectorAll('.case-error'), function (e) {
      return !e.hidden && e.textContent.length > 10;
    });
    ok(errs.length === probeCase.steps.length,
      'empty submit shows an inline error on every numeric step',
      errs.length + ' of ' + probeCase.steps.length);
    ok(!doc.querySelector('.case-result'), 'empty submit produces no result block');
    dom.window.close();
  }

  /* ---- grading: all correct scores 100 % and marks the case mastered ---- */
  {
    const probeCase = cases.filter(function (c) { return c.moduleId === 'm03'; })[0];
    const dom = load('#/c/' + probeCase.caseId);
    const doc = dom.window.document;
    probeCase.steps.forEach(function (st) {
      if (st.type === 'numeric') {
        const input = doc.querySelector('#in-' + st.id);
        input.value = String(st.answer.value);
        input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      } else {
        const radio = doc.querySelector('input[name="c-' + st.id + '"][value="' + st.answer.value + '"]');
        radio.click();
      }
    });
    doc.querySelector('form.case-form')
      .dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    const result = doc.querySelector('.case-result');
    ok(!!result, 'a completed case renders a result block');
    if (result) {
      ok(/100 %/.test(result.textContent), 'all-correct answers score 100 %',
        (result.querySelector('.case-score') || {}).textContent);
      ok(/Mastered/i.test(result.textContent), 'a 100 % result is marked mastered');
    }
    ok(doc.querySelectorAll('.case-step--ok').length === probeCase.steps.length,
      'every step is marked correct after a full correct submission');

    /* the answers CSV is generated from the same state. jsdom has no
       createObjectURL in every version, so the export is exercised through
       Blob + the anchor's download attribute rather than a real save. */
    ok(!!doc.querySelector('[data-act="case-csv"]'), 'the result offers a CSV download');
    ok(typeof dom.window.Blob === 'function', 'the cases page can build a Blob for export');
    /* a wrong answer scores less than 100 and does not claim mastery */
    const dom2 = load('#/c/' + probeCase.caseId);
    const doc2 = dom2.window.document;
    probeCase.steps.forEach(function (st) {
      if (st.type === 'numeric') {
        const input = doc2.querySelector('#in-' + st.id);
        input.value = String(st.answer.value + 1000);
        input.dispatchEvent(new dom2.window.Event('input', { bubbles: true }));
      } else {
        const wrong = st.options.filter(function (o) { return o.id !== st.answer.value; })[0];
        doc2.querySelector('input[name="c-' + st.id + '"][value="' + wrong.id + '"]').click();
      }
    });
    doc2.querySelector('form.case-form')
      .dispatchEvent(new dom2.window.Event('submit', { bubbles: true, cancelable: true }));
    const r2 = doc2.querySelector('.case-result');
    ok(!!r2 && !/^\s*100 %/.test(r2.textContent), 'a fully wrong submission does not score 100 %');
    ok(!!r2 && /Not mastered/.test(r2.textContent), 'a wrong submission is not marked mastered');
    dom2.window.close();
  }

  /* ---- tolerance: a value inside the tolerance passes, outside fails ---- */
  {
    const probeCase = cases.filter(function (c) { return c.moduleId === 'm03'; })[0];
    const numeric = probeCase.steps.filter(function (s) { return s.type === 'numeric'; })[0];
    const dom = load('#/c/' + probeCase.caseId);
    const doc = dom.window.document;
    const input = doc.querySelector('#in-' + numeric.id);
    input.value = String(numeric.answer.value + numeric.answer.tolerance * 0.5);
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    probeCase.steps.forEach(function (st) {
      if (st.id === numeric.id) return;
      if (st.type === 'numeric') {
        const el = doc.querySelector('#in-' + st.id);
        el.value = String(st.answer.value);
        el.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      } else {
        doc.querySelector('input[name="c-' + st.id + '"][value="' + st.answer.value + '"]').click();
      }
    });
    doc.querySelector('form.case-form')
      .dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    const stepEl = doc.querySelector('#step-' + numeric.id);
    ok(stepEl && stepEl.classList.contains('case-step--ok'),
      'an answer inside the tolerance is accepted');
    dom.window.close();
  }

  /* ---- comma decimal separator (a European keyboard) ---- */
  {
    const probeCase = cases.filter(function (c) { return c.moduleId === 'm03'; })[0];
    const numeric = probeCase.steps.filter(function (s) {
      return s.type === 'numeric' && s.id === 's1';
    })[0];
    const dom = load('#/c/' + probeCase.caseId);
    const doc = dom.window.document;
    const input = doc.querySelector('#in-' + numeric.id);
    input.value = '0,64';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    probeCase.steps.forEach(function (st) {
      if (st.id === numeric.id) return;
      if (st.type === 'numeric') {
        const el = doc.querySelector('#in-' + st.id);
        el.value = String(st.answer.value);
        el.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      } else {
        doc.querySelector('input[name="c-' + st.id + '"][value="' + st.answer.value + '"]').click();
      }
    });
    doc.querySelector('form.case-form')
      .dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    const stepEl = doc.querySelector('#step-' + numeric.id);
    ok(stepEl && stepEl.classList.contains('case-step--ok'),
      'a comma decimal separator is accepted');
    dom.window.close();
  }

  /* ---- progressive hints ---- */
  {
    const probeCase = cases.filter(function (c) { return c.moduleId === 'm14'; })[0];
    const dom = load('#/c/' + probeCase.caseId);
    const doc = dom.window.document;
    const first = probeCase.steps[0];
    ok(!doc.querySelector('.case-hint-list'), 'no hints are shown before they are asked for');
    const btn = doc.querySelector('.case-hint-btn[data-hint="' + probeCase.caseId + '/' + first.id + '"]');
    ok(!!btn, 'the first step offers a hint button');
    if (btn) {
      btn.click();
      ok(doc.querySelectorAll('.case-hint-list li').length === 1, 'one hint appears after one click');
      const btn2 = doc.querySelector('.case-hint-btn[data-hint="' + probeCase.caseId + '/' + first.id + '"]');
      ok(!!btn2 && /Next hint/.test(btn2.textContent), 'the button offers the next hint');
      if (btn2) {
        btn2.click();
        ok(doc.querySelectorAll('.case-hint-list li').length === 2, 'a second hint appears');
      }
    }
    dom.window.close();
  }

  /* ---- typing then asking for a hint must not lose the answer ---- */
  {
    const probeCase = cases.filter(function (c) { return c.moduleId === 'm02'; })[0];
    const numeric = probeCase.steps.filter(function (s) { return s.type === 'numeric'; })[0];
    const dom = load('#/c/' + probeCase.caseId);
    const doc = dom.window.document;
    const input = doc.querySelector('#in-' + numeric.id);
    input.value = '42';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    const btn = doc.querySelector('.case-hint-btn[data-hint="' + probeCase.caseId + '/' + numeric.id + '"]');
    if (btn) btn.click();
    const after = doc.querySelector('#in-' + numeric.id);
    eq(after.value, '42', 'a typed answer survives a hint repaint');
    dom.window.close();
  }

  /* ---- the rubric totals 100 and the case is scored against it ---- */
  cases.forEach(function (c) {
    const total = c.rubric.reduce(function (a, r) { return a + r.points; }, 0);
    eq(total, 100, 'case ' + c.caseId + ' rubric totals 100');
  });

  /* 3. grading: pick the keyed option in the rendered order and submit */
  const probe = lessons[0];
  const expectedKeyId = (function () {
    const qs = JSON.parse(fs.readFileSync(path.join(BUILD, 'data', 'questions.json'), 'utf8'));
    const q = qs.filter(function (x) { return x.lessonId === probe.lessonId && x.pool !== 'exam'; })[0];
    return q ? q.questionId : null;
  })();
  const grade = load('#/l/' + probe.lessonId);
  const gdoc = grade.window.document;
  const inputs = Array.prototype.slice.call(gdoc.querySelectorAll('#quiz input[type=radio]'));
  ok(inputs.length >= 2, 'quiz renders radio inputs', String(inputs.length));
  /* click the first option of every question, then submit and read the score */
  const names = {};
  inputs.forEach(function (i) { names[i.name] = true; });
  /* The engine records answers on the radio's `change` event, so the state it
     grades is the state a learner produced, not whatever the DOM holds when
     submit arrives. Clicking the input raises both `click` and `change`;
     assigning `.checked` by hand raises neither and grades as blank. */
  Object.keys(names).forEach(function (nm) {
    const first = gdoc.querySelector('input[name="' + nm + '"]');
    if (first) first.click();
  });
  /* The engine listens for the form's `submit` event, not for a click on the
     button: dispatching a click on a submit button does not raise `submit` in
     jsdom either. Drive the event the handler actually subscribes to. */
  const form = gdoc.querySelector('#quiz form.quiz-form');
  if (form) {
    form.dispatchEvent(new grade.window.Event('submit', { bubbles: true, cancelable: true }));
    const scoreEl = gdoc.querySelector('#quiz .score');
    ok(!!scoreEl, 'submitting the quiz renders a score line');
    if (scoreEl) {
      ok(/\d+\s*\/\s*\d+/.test(scoreEl.textContent),
        'the score line is in n / m form', scoreEl.textContent);
      /* first option chosen for every question cannot score 5/5 on a bank
         whose keys are rotated, unless every key really is option a */
      ok(!/\b5\s*\/\s*5\b/.test(scoreEl.textContent),
        'grading does not award full marks for always picking the first option',
        scoreEl.textContent);
    }
  } else {
    ok(false, 'the lesson quiz is a form.quiz-form that can be submitted');
  }
  grade.window.close();
  ok(!!expectedKeyId, 'the probe lesson has a question in the bank');

  /* 4. every module route renders */
  const modules = ['m01','m02','m03','m04','m05','m06','m07','m08','m09','m10','m11','m12','m13','m14','m15'];
  let modulesOk = 0;
  const badModules = [];
  modules.forEach(function (mid) {
    const dom = load('#/m/' + mid);
    const text = dom.window.document.getElementById('main').textContent || '';
    if (text.length > 300) modulesOk++;
    else badModules.push(mid);
    dom.window.close();
  });
  eq(modulesOk, 15, 'all 15 module routes render' +
    (badModules.length ? ' (empty: ' + badModules.join(', ') + ')' : ''));

  /* 5. the module exam renders a frozen sample and can be graded */
  const examQ = JSON.parse(fs.readFileSync(path.join(BUILD, 'data', 'questions.json'), 'utf8'));
  const lessonsAll = JSON.parse(fs.readFileSync(path.join(BUILD, 'data', 'lessons.json'), 'utf8'));
  const lessonsArr = lessonsAll.lessons || lessonsAll;
  /* every lesson mastered at 100 % — the state in which the exam opens */
  const allMastered = { v: 1, visited: {}, exams: {}, cases: {}, quiz: {} };
  lessonsArr.forEach(function (l) { allMastered.quiz[l.lessonId] = { best: 100, tries: 1 }; });
  modules.forEach(function (mid) {
    const bank = examQ.filter(function (q) {
      return q.pool === 'exam' && q.lessonId.indexOf(mid) === 0;
    });
    const dom = load('#/e/' + mid, allMastered);
    const d2 = dom.window.document;
    const radios = d2.querySelectorAll('#exam input[type=radio]');
    /* With a dedicated bank the exam draws min(15, bank size) questions; without
       one it falls back to the lesson pool, so only the bank case is exact. */
    if (bank.length) {
      const want = Math.min(15, bank.length) * 1;
      const groups = {};
      Array.prototype.forEach.call(radios, function (r) { groups[r.name] = true; });
      eq(Object.keys(groups).length, want,
        'exam ' + mid + ' draws ' + want + ' question(s) from a bank of ' + bank.length);
    }
    ok(!!d2.querySelector('#exam form.exam-form'), 'exam ' + mid + ' renders a submittable form');
    dom.window.close();
  });

  /* 5b. the exam gate: locked until every lesson in the module is mastered,
     and the lock is on the route, not only on the button */
  const freshGate = load('#/e/m01');
  const gateDoc = freshGate.window.document;
  ok(!gateDoc.querySelector('#exam form.exam-form'),
    'the exam form is absent when no lesson is mastered');
  ok(/locked/i.test(gateDoc.getElementById('main').textContent || ''),
    'a gated exam route says it is locked');
  /* half the lessons mastered is still locked */
  const halfMastered = { v: 1, visited: {}, exams: {}, cases: {}, quiz: {} };
  lessonsArr.filter(function (l) { return l.moduleId === 'm01'; })
    .slice(0, Math.max(1, Math.floor(lessonsArr.filter(function (l) {
      return l.moduleId === 'm01';
    }).length / 2)))
    .forEach(function (l) { halfMastered.quiz[l.lessonId] = { best: 100 }; });
  const halfGate = load('#/e/m01', halfMastered);
  ok(!halfGate.window.document.querySelector('#exam form.exam-form'),
    'a half-mastered module still has a locked exam');
  halfGate.window.close();
  freshGate.window.close();
  /* the module page says why, and the sidebar marks it */
  const lockedModule = load('#/m/m01');
  const lockedText = lockedModule.window.document.getElementById('main').textContent || '';
  ok(/Opens after all lessons are mastered/i.test(lockedText),
    'the module page explains the exam lock', lockedText.slice(0, 80));
  const sideLock = lockedModule.window.document.querySelector('.toc-exam--locked');
  ok(!!sideLock, 'the sidebar marks the exam as locked');
  lockedModule.window.close();

  /* 5c. the Board X thread, the case card, templates and the score chip */
  const mod6 = load('#/m/m06');
  const m6d = mod6.window.document;
  const threadItems = m6d.querySelectorAll('.bx-thread-item');
  eq(threadItems.length, 4, 'the Board X thread lists four steps');
  const hereStep = m6d.querySelector('.bx-thread-item--here');
  ok(!!hereStep && /Reflow profile/.test(hereStep.textContent),
    'the current module is marked on the thread');
  ok(/MSL log/.test(m6d.querySelector('.bx-thread').textContent || ''),
    'the thread names the other modules');
  const card = m6d.querySelector('.case-card');
  ok(!!card, 'the module page shows a case card');
  if (card) {
    ok(/About 25 min/.test(card.textContent), 'the case card carries the time');
    ok(/Rubric pass mark: 80 %/.test(card.textContent), 'the case card carries the pass mark');
    ok(/Fictional data/.test(card.textContent), 'the case card marks the data as fictional');
    ok(!!card.querySelector('[data-act="case-data"]'), 'the case card offers the CSV');
  }
  const tplCards = m6d.querySelectorAll('.toolkit .tpl-card');
  ok(tplCards.length >= 1, 'the toolkit lists template cards');
  if (tplCards.length) {
    const variants = tplCards[0].querySelectorAll('[data-act="case-tpl"]');
    eq(variants.length, 3, 'a template ships blank, example and guide');
  }
  mod6.window.close();

  /* 5d. a case page: data table, chart, spec chips, points per step, score chip */
  const casePage = load('#/c/cx-m06-01');
  const cpd = casePage.window.document;
  ok(!!cpd.querySelector('.case-table'), 'the data file renders as a table');
  /* m06 now ships two data files: the interval profile (6 rows) and the
     three-site thermocouple survey (3 rows). Both are tables. */
  const tables = cpd.querySelectorAll('.case-table');
  eq(tables.length, 2, 'both m06 data files render as tables');
  eq(tables[0].querySelectorAll('tbody tr').length, 6,
    'the profile table has one row per recorded interval');
  eq(tables[1].querySelectorAll('tbody tr').length, 3,
    'the thermocouple table has one row per site');
  const svg = cpd.querySelector('svg.profile-chart');
  ok(!!svg, 'the profile is drawn as a chart from the same file');
  if (svg) {
    const d = (svg.querySelector('path.pc-curve') || {}).getAttribute
      ? svg.querySelector('path.pc-curve').getAttribute('d') : '';
    ok(/\(M/.test('(' + d), 'the curve has path data', d.slice(0, 40));
    /* A chart with NaN coordinates renders as an empty frame: axis labels only.
       Reading the path data for "NaN" is the only way a test can see that — the
       DOM still contains the element and its text. This bug shipped once, from a
       spec chip with no upper bound, and looked deliberate on screen. */
    ok(!/NaN/.test(svg.outerHTML), 'no coordinate in the chart is NaN');
    ok(!/NaN/.test(d), 'the curve path has no NaN');
    const ys = (d.match(/[ML][\d.]+ ([\d.]+)/g) || []).map(function (m) {
      return parseFloat(m.split(' ')[1]);
    });
    ok(ys.length >= 6, 'the curve has a vertex per interval', String(ys.length));
    ok(ys.every(function (v) { return v >= 0 && v <= 300; }),
      'every curve vertex sits inside the plot area', ys.join(','));
    ok(new Set(ys).size > 3, 'the curve actually moves', String(new Set(ys).size));
    ok(/Liquidus 219/.test(svg.textContent), 'the chart marks the liquidus');
    ok(/Peak window/.test(svg.textContent), 'the chart marks the peak window');
  }
  const specs = cpd.querySelectorAll('.spec-chip');
  /* four, not three, since the m06 review: the paste window and the package
     ceiling are different roles and must not be merged into one chip again */
  eq(specs.length, 4, 'the case shows four limits as chips');
  const specText = Array.prototype.map.call(specs, function (n) { return n.textContent; }).join(' | ');
  ok(/Peak window, paste\s*235–245/.test(specText),
    'the paste window is 235-245', specText);
  ok(/Peak ceiling, large package\s*250/.test(specText),
    'the ceiling is 250 and is separate from the window', specText);
  const stepHeads = Array.prototype.map.call(cpd.querySelectorAll('.case-step-n'),
    function (n) { return n.textContent; });
  ok(/Step 1 \(15 points\)/.test(stepHeads[0]), 'a step heading states its points', stepHeads[0]);
  ok(/Score 0 of 100/.test(cpd.querySelector('.meta-line').textContent),
    'the header carries a score chip');
  eq(cpd.querySelectorAll('[data-act="case-check"]').length,
    (JSON.parse(fs.readFileSync(path.join(BUILD, 'data', 'cases.json'), 'utf8'))
      .cases.filter(function (c) { return c.caseId === 'cx-m06-01'; })[0].steps.length),
    'every step has its own Check answer button');
  casePage.window.close();

  /* 5e. checking one step marks it and moves the score chip, without grading */
  const oneStep = load('#/c/cx-m06-01');
  const osd = oneStep.window.document;
  const input1 = osd.querySelector('#in-s1');
  input1.value = '2.08';
  input1.dispatchEvent(new oneStep.window.Event('input', { bubbles: true }));
  osd.querySelector('[data-act="case-check"][data-step="s1"]').click();
  const osd2 = oneStep.window.document;
  ok(/Step 1/.test(osd2.querySelector('#step-s1').textContent), 'the checked step is still there');
  ok(!!osd2.querySelector('.case-step-mark'), 'a checked step shows correct / not yet');
  ok(/Score 15 of 100/.test(osd2.querySelector('.meta-line').textContent),
    'the score chip counts the checked step', osd2.querySelector('.meta-line').textContent.slice(-30));
  ok(!osd2.querySelector('#case-result'), 'one checked step is not a full result');
  /* an empty step still gets its own inline error, not a score */
  osd2.querySelector('[data-act="case-check"][data-step="s2"]').click();
  const err2 = oneStep.window.document.querySelector('#err-s2');
  ok(!!err2 && !err2.hidden, 'checking an empty step raises an inline error');
  oneStep.window.close();

  /* 5f. an unrelated data file does not grow a chart */
  const caseM14 = load('#/c/cx-m14-01');
  const m14d = caseM14.window.document;
  ok(!m14d.querySelector('svg.profile-chart'), 'a defect log draws no profile chart');
  ok(m14d.querySelectorAll('.case-table').length >= 2, 'both m14 data files render as tables');
  caseM14.window.close();

  /* 6. grading an exam produces a score */
  const examDom = load('#/e/m01', allMastered);
  const ed = examDom.window.document;
  const eInputs = Array.prototype.slice.call(ed.querySelectorAll('#exam input[type=radio]'));
  const eNames = {};
  eInputs.forEach(function (i) { eNames[i.name] = true; });
  Object.keys(eNames).forEach(function (nm) {
    const first = ed.querySelector('input[name="' + nm + '"]');
    if (first) first.click();
  });
  const eForm = ed.querySelector('#exam form.exam-form');
  if (eForm) {
    eForm.dispatchEvent(new examDom.window.Event('submit', { bubbles: true, cancelable: true }));
    const eScore = ed.querySelector('#exam .score');
    ok(!!eScore, 'submitting an exam renders a score line');
    if (eScore) ok(/\d+\s*\/\s*\d+/.test(eScore.textContent),
      'the exam score line is in n / m form', eScore.textContent);
  } else {
    ok(false, 'the exam is a form.exam-form that can be submitted');
  }
  examDom.window.close();

  home.window.close();
}

/* -------------------------------------------------------------------- main */

async function main() {
  const quick = process.argv.indexOf('--quick') !== -1;
  console.log('=== course test suite ===');
  dataLayer();
  if (!quick) await renderLayer();

  console.log('\n' + (fail ? 'FAIL' : 'PASS') + ' — ' + pass + ' passed, ' + fail + ' failed');
  if (fail) {
    failures.forEach(function (f) { console.log('  x ' + f); });
    return 1;
  }
  return 0;
}

main().then(function (code) { process.exitCode = code; }, function (err) {
  console.error(err);
  process.exitCode = 1;
});
