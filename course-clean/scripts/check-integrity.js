#!/usr/bin/env node
/* =========================================================================
 * check-integrity.js — the one check the brief asks for after every step
 *
 * Rule 6 of the brief: after each step, rebuild data-embed.js and run an
 * integrity check (question references, source references, images; embed
 * equal to the JSON) and report numbers before and after.
 *
 * This script checks, in one pass:
 *   1. every lesson.quiz id exists in questions.json
 *   2. every question.lessonId exists in lessons.json
 *   3. every question.source exists in sources.json
 *   4. every lesson.sources[] entry exists in sources.json
 *   5. every image referenced from lesson content exists in assets/img/
 *   6. every file in assets/img/ is referenced by at least one lesson (orphans)
 *   7. every lesson carries a worked calculation and a defect case
 *   8. assets/data-embed.js parses and equals the three JSON files
 *   9. no lesson claims a status it cannot support (status sanity, and no
 *      inherited "reviewed" label: a review that did not happen is a claim)
 *  10. index.html and app.js agree on the data-loading contract
 *
 * Usage:
 *   node scripts/check-integrity.js           # report, exit 1 on failure
 *   node scripts/check-integrity.js --json    # machine-readable
 *   node scripts/check-integrity.js --baseline <file>   # compare to a snapshot
 *   node scripts/check-integrity.js --snapshot <file>   # write a snapshot
 *
 * The --baseline/--snapshot pair is how the "before and after" table in the
 * Phase reports is produced without hand-copied numbers.
 * ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PATHS = {
  lessons: path.join(ROOT, 'data', 'lessons.json'),
  questions: path.join(ROOT, 'data', 'questions.json'),
  sources: path.join(ROOT, 'data', 'sources.json'),
  embed: path.join(ROOT, 'assets', 'data-embed.js'),
  images: path.join(ROOT, 'assets', 'img'),
  index: path.join(ROOT, 'index.html'),
  app: path.join(ROOT, 'assets', 'app.js')
};

function readJson(file) {
  let raw = fs.readFileSync(file, 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  return JSON.parse(raw);
}

function readEmbed(file) {
  const text = fs.readFileSync(file, 'utf8');
  const m = /^var COURSE_DATA=([\s\S]*);\s*$/.exec(text);
  if (!m) return { ok: false, reason: 'does not match "var COURSE_DATA=…;"' };
  try {
    return { ok: true, value: JSON.parse(m[1]) };
  } catch (e) {
    return { ok: false, reason: 'payload is not valid JSON: ' + e.message };
  }
}

/** Collect every string in a nested value. */
function everyString(value, out) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach(function (v) { everyString(v, out); });
  else if (value && typeof value === 'object') {
    Object.keys(value).forEach(function (k) { everyString(value[k], out); });
  }
  return out;
}

function run() {
  const problems = [];
  const info = {};
  const warn = [];

  /* ---- load ---- */
  const lessons = readJson(PATHS.lessons);
  const questions = readJson(PATHS.questions);
  const sources = readJson(PATHS.sources);

  info.counts = {
    lessons: lessons.length,
    questions: questions.length,
    sources: sources.length
  };

  const lessonIds = new Set(lessons.map(function (l) { return l.lessonId; }));
  const questionIds = new Set(questions.map(function (q) { return q.questionId; }));
  const sourceIds = new Set(sources.map(function (s) { return s.id; }));

  /* ---- 1. lesson.quiz -> questions ---- */
  let quizRefs = 0;
  const orphanQuiz = [];
  lessons.forEach(function (l) {
    (l.quiz || []).forEach(function (id) {
      quizRefs++;
      if (!questionIds.has(id)) orphanQuiz.push(l.lessonId + ' -> ' + id);
    });
  });
  info.quizRefs = quizRefs;
  if (orphanQuiz.length) problems.push({ code: 'quiz-ref', count: orphanQuiz.length, sample: orphanQuiz.slice(0, 10) });

  /* ---- 2. question.lessonId -> lessons ---- */
  const orphanLesson = [];
  let unreferencedQuestions = 0;
  questions.forEach(function (q) {
    if (!lessonIds.has(q.lessonId)) orphanLesson.push(q.questionId + ' -> ' + q.lessonId);
  });
  /* a question that no lesson points at still counts if it is in the exam pool */
  questions.forEach(function (q) {
    if (q.pool === 'exam') return;
    const owner = lessons.find(function (l) { return l.lessonId === q.lessonId; });
    if (!owner) return;
    if ((owner.quiz || []).indexOf(q.questionId) === -1) unreferencedQuestions++;
  });
  if (orphanLesson.length) problems.push({ code: 'question-lesson', count: orphanLesson.length, sample: orphanLesson.slice(0, 10) });
  if (unreferencedQuestions) {
    warn.push(unreferencedQuestions + ' lesson-pool question(s) not listed in their lesson\'s quiz array');
  }
  info.questionsOutsideQuiz = unreferencedQuestions;

  /* ---- 3. question.source -> sources ---- */
  const missingQSource = [];
  let questionsWithSource = 0;
  questions.forEach(function (q) {
    if (!q.source) return;
    if (!sourceIds.has(q.source)) missingQSource.push(q.questionId + ' -> ' + q.source);
    else questionsWithSource++;
  });
  info.questionsWithSource = questionsWithSource;
  if (missingQSource.length) problems.push({ code: 'question-source', count: missingQSource.length, sample: missingQSource.slice(0, 10) });

  /* ---- 4. lesson.sources -> sources ---- */
  const missingLSource = [];
  let lessonSourceRefs = 0;
  lessons.forEach(function (l) {
    if (!Array.isArray(l.sources) || !l.sources.length) {
      problems.push({ code: 'lesson-no-source', count: 1, sample: [l.lessonId + ' cites no source'] });
    }
    (l.sources || []).forEach(function (id) {
      lessonSourceRefs++;
      if (!sourceIds.has(id)) missingLSource.push(l.lessonId + ' -> ' + id);
    });
  });
  info.lessonSourceRefs = lessonSourceRefs;
  if (missingLSource.length) problems.push({ code: 'lesson-source', count: missingLSource.length, sample: missingLSource.slice(0, 10) });

  /* ---- 5/6. images ---- */
  const onDisk = fs.existsSync(PATHS.images) ? fs.readdirSync(PATHS.images) : [];
  const referenced = new Set();
  const missingImage = [];
  let imageRefs = 0;
  lessons.forEach(function (l) {
    everyString(l.content, []).forEach(function (s) {
      if (!/\.(webp|png|jpe?g|svg)$/i.test(s)) return;
      imageRefs++;
      const base = path.basename(s);
      referenced.add(base);
      if (onDisk.indexOf(base) === -1) missingImage.push(l.lessonId + ' -> ' + s);
    });
  });
  info.imageRefs = imageRefs;
  info.imagesOnDisk = onDisk.length;
  if (missingImage.length) problems.push({ code: 'image-missing', count: missingImage.length, sample: missingImage.slice(0, 10) });
  const orphans = onDisk.filter(function (f) { return !referenced.has(f); });
  info.imagesOrphaned = orphans.length;
  if (orphans.length) problems.push({ code: 'image-orphan', count: orphans.length, sample: orphans.slice(0, 10) });

  /* ---- 7. calc + defect present ---- */
  const noCalc = [], noDefect = [];
  lessons.forEach(function (l) {
    const c = l.content || {};
    if (!c.calc || !c.calc.task || !c.calc.solution) noCalc.push(l.lessonId);
    if (!c.defect || !c.defect.symptom || !c.defect.cause || !c.defect.action) noDefect.push(l.lessonId);
  });
  info.lessonsWithCalc = lessons.length - noCalc.length;
  info.lessonsWithDefect = lessons.length - noDefect.length;
  if (noCalc.length) problems.push({ code: 'no-calc', count: noCalc.length, sample: noCalc.slice(0, 10) });
  if (noDefect.length) problems.push({ code: 'no-defect', count: noDefect.length, sample: noDefect.slice(0, 10) });

  /* ---- 8. embed equals the JSON ---- */
  if (!fs.existsSync(PATHS.embed)) {
    problems.push({ code: 'embed-missing', count: 1, sample: [path.relative(ROOT, PATHS.embed)] });
    info.embed = { present: false };
  } else {
    const e = readEmbed(PATHS.embed);
    if (!e.ok) {
      problems.push({ code: 'embed-parse', count: 1, sample: [e.reason] });
      info.embed = { present: true, parseable: false };
    } else {
      const same = {
        lessons: JSON.stringify(e.value.lessons) === JSON.stringify(lessons),
        questions: JSON.stringify(e.value.questions) === JSON.stringify(questions),
        sources: JSON.stringify(e.value.sources) === JSON.stringify(sources)
      };
      info.embed = { present: true, parseable: true, matches: same };
      const stale = Object.keys(same).filter(function (k) { return !same[k]; });
      if (stale.length) {
        problems.push({
          code: 'embed-stale',
          count: stale.length,
          sample: ['differs from data/: ' + stale.join(', ') + ' — run node scripts/build-embed.js']
        });
      }
    }
  }

  /* ---- 9. status sanity ---- */
  const statuses = {};
  lessons.forEach(function (l) { statuses[l.status] = (statuses[l.status] || 0) + 1; });
  info.statuses = statuses;
  const bogus = lessons.filter(function (l) {
    return ['draft', 'factchecked', 'reviewed', 'published'].indexOf(l.status) === -1;
  });
  if (bogus.length) {
    problems.push({ code: 'status-unknown', count: bogus.length, sample: bogus.slice(0, 10).map(function (l) { return l.lessonId + ' -> ' + l.status; }) });
  }
  /* The source archive shipped every lesson marked "reviewed". That claim was
     inherited, not earned: nobody has re-read 92 lessons against the standards
     in this round, so the label is reset to "draft" until a technologist
     actually reviews them. The human review itself is Phase 9, the user's own
     gate, and is not something this tool can satisfy or record. */
  const inflated = lessons.filter(function (l) { return l.status === 'reviewed'; });
  if (inflated.length) {
    problems.push({
      code: 'status-unsupported',
      count: inflated.length,
      sample: inflated.slice(0, 10).map(function (l) { return l.lessonId + ' -> reviewed'; })
    });
  }

  /* ---- 10. data-loading contract ---- */
  info.contract = {};
  if (fs.existsSync(PATHS.index) && fs.existsSync(PATHS.app)) {
    const index = fs.readFileSync(PATHS.index, 'utf8');
    const app = fs.readFileSync(PATHS.app, 'utf8');
    const indexLoadsEmbed = /src="assets\/data-embed\.js/.test(index);
    const indexLoadsApp = /src="assets\/app\.js/.test(index);
    const appFetches = /fetch\(\s*['"]data\//.test(app);
    const appMentionsEmbed = /COURSE_DATA/.test(app);
    /* data-embed.js must be loaded BEFORE app.js: app.js reads the global at
       parse time through its loader, and a reversed order breaks file://.
       Only <script src> tags count — a plain indexOf() over the file also
       matches the HTML comment above the tags and reports the wrong order. */
    const srcOrder = [];
    const tagRe = /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi;
    let tm;
    while ((tm = tagRe.exec(index)) !== null) srcOrder.push(tm[1]);
    const posEmbed = srcOrder.findIndex(function (u) { return /data-embed\.js/.test(u); });
    const posApp = srcOrder.findIndex(function (u) { return /app\.js/.test(u); });
    const embedBeforeApp = posEmbed !== -1 && posApp !== -1 && posEmbed < posApp;
    info.scriptOrder = srcOrder.map(function (u) { return path.basename(u); });
    info.contract = { indexLoadsEmbed: indexLoadsEmbed, indexLoadsApp: indexLoadsApp,
      appFetchesJson: appFetches, appReadsEmbed: appMentionsEmbed, embedBeforeApp: embedBeforeApp };
    if (!indexLoadsEmbed) problems.push({ code: 'contract', count: 1, sample: ['index.html does not load assets/data-embed.js'] });
    if (!indexLoadsApp) problems.push({ code: 'contract', count: 1, sample: ['index.html does not load assets/app.js'] });
    if (!embedBeforeApp) problems.push({ code: 'contract', count: 1, sample: ['data-embed.js must load before app.js'] });
    if (!appFetches) warn.push('app.js does not fetch data/*.json — the http path may be dead');
    if (!appMentionsEmbed) warn.push('app.js never mentions COURSE_DATA');
  } else {
    warn.push('index.html or assets/app.js missing — contract not checked');
  }

  /* ---- answer-key sanity that affects grading ---- */
  let keyed = 0, badge = 0;
  questions.forEach(function (q) {
    const opts = q.options || [];
    if (opts.length && q.correct && opts.some(function (o) { return o && o.id === q.correct; })) keyed++;
    if (opts.length >= 2 && opts.length <= 5) badge++;
  });
  info.gradableQuestions = keyed;
  info.questionsWithValidOptionCount = badge;
  if (keyed !== questions.length) {
    problems.push({ code: 'key', count: questions.length - keyed, sample: ['questions whose key does not point at an option'] });
  }

  return { problems: problems, warnings: warn, info: info };
}

function render(result, baseline) {
  const L = [];
  const p = function (s) { L.push(s); };
  const i = result.info;

  p('=== course integrity check ===');
  p('');
  p('Counts');
  p('  lessons                 ' + i.counts.lessons);
  p('  questions               ' + i.counts.questions);
  p('  sources                 ' + i.counts.sources);
  p('');
  p('References');
  p('  lesson -> question ids  ' + i.quizRefs);
  p('  lesson -> source ids    ' + i.lessonSourceRefs);
  p('  question -> source ids  ' + i.questionsWithSource + ' of ' + i.counts.questions);
  p('  image references        ' + i.imageRefs + ' (' + i.imagesOnDisk + ' files on disk, ' +
    i.imagesOrphaned + ' orphaned)');
  p('  questions outside quiz  ' + i.questionsOutsideQuiz);
  p('');
  p('Lesson completeness');
  p('  with worked calc        ' + i.lessonsWithCalc + ' of ' + i.counts.lessons);
  p('  with defect case        ' + i.lessonsWithDefect + ' of ' + i.counts.lessons);
  p('  statuses                ' + Object.keys(i.statuses).map(function (k) {
    return k + ':' + i.statuses[k];
  }).join(', '));
  p('');
  p('Embedded data (assets/data-embed.js)');
  if (!i.embed || !i.embed.present) p('  MISSING');
  else if (!i.embed.parseable) p('  PRESENT BUT UNPARSEABLE');
  else {
    const m = i.embed.matches;
    p('  matches data/lessons.json    ' + (m.lessons ? 'yes' : 'NO'));
    p('  matches data/questions.json  ' + (m.questions ? 'yes' : 'NO'));
    p('  matches data/sources.json    ' + (m.sources ? 'yes' : 'NO'));
  }
  p('');
  p('Data-loading contract');
  if (i.scriptOrder) p('  script order: ' + i.scriptOrder.join(' -> '));
  Object.keys(i.contract || {}).forEach(function (k) {
    if (k === 'scriptOrder') return;
    p('  ' + k + ': ' + i.contract[k]);
  });
  p('');

  if (baseline) {
    p('Change against the baseline snapshot');
    const keys = ['lessons', 'questions', 'sources'];
    keys.forEach(function (k) {
      const a = (baseline.info.counts || {})[k];
      const b = i.counts[k];
      if (a !== undefined) p('  ' + k.padEnd(12) + String(a).padStart(5) + ' -> ' + String(b).padStart(5) +
        '  (' + (b - a >= 0 ? '+' : '') + (b - a) + ')');
    });
    ['quizRefs', 'lessonSourceRefs', 'imageRefs'].forEach(function (k) {
      const a = baseline.info[k], b = i[k];
      if (a !== undefined) p('  ' + k.padEnd(18) + String(a).padStart(5) + ' -> ' + String(b).padStart(5) +
        '  (' + (b - a >= 0 ? '+' : '') + (b - a) + ')');
    });
    p('');
  }

  if (result.warnings.length) {
    p('Notes (' + result.warnings.length + '):');
    result.warnings.forEach(function (w) { p('  * ' + w); });
    p('');
  }

  if (result.problems.length) {
    p('FAIL — ' + result.problems.length + ' problem group(s):');
    result.problems.forEach(function (pr) {
      p('  - ' + pr.code + ' (' + pr.count + ')');
      (pr.sample || []).forEach(function (s) { p('      ' + s); });
    });
  } else {
    p('OK — integrity check passed.');
  }
  return L.join('\n');
}

function main(argv) {
  const asJson = argv.indexOf('--json') !== -1;
  const snapIdx = argv.indexOf('--snapshot');
  const baseIdx = argv.indexOf('--baseline');
  const snapshotFile = snapIdx !== -1 ? path.resolve(argv[snapIdx + 1]) : null;
  const baselineFile = baseIdx !== -1 ? path.resolve(argv[baseIdx + 1]) : null;

  const result = run();

  if (snapshotFile) {
    fs.writeFileSync(snapshotFile, JSON.stringify({ info: result.info, problems: result.problems.length }, null, 2) + '\n');
  }

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    let baseline = null;
    if (baselineFile && fs.existsSync(baselineFile)) {
      baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
    }
    console.log(render(result, baseline));
  }

  return result.problems.length ? 1 : 0;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = { run: run, render: render };
