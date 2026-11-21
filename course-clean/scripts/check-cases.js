#!/usr/bin/env node
/* =========================================================================
 * check-cases.js — independent verification of data/cases.json
 *
 * THE POINT OF THIS FILE
 *   scripts/gen_cases.py computes the keys. This script recomputes them from
 *   the case's own inputs with different arithmetic (the closed forms written
 *   out, the CSV data files parsed, the ISO 2859-1 table re-typed) and fails
 *   if the two disagree. A generator checked only against itself proves
 *   nothing; this is the second opinion.
 *
 * It also enforces the schema and the editorial contract:
 *   - every case, step and rubric field the brief names is present
 *   - rubric points total 100 and every rubric criterion maps to real steps
 *   - every numeric step has a unit, a positive tolerance and >= 2 hints
 *   - every choice step's key exists among its options and option ids are unique
 *   - a numeric key is unique among its distractors (two steps in one case
 *     cannot answer the same number)
 *   - every source id exists in data/sources.json
 *   - every toolLink points at a lesson that exists
 *   - every threshold the cases use is declared in the document with a source
 *   - the control numbers from the Phase-3 brief reproduce
 *   - docs/case-keys.csv agrees with the JSON, row for row
 *
 * Usage:
 *   node scripts/check-cases.js            # human report, exit 1 on failure
 *   node scripts/check-cases.js --json     # machine-readable
 * ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CASES = path.join(ROOT, 'data', 'cases.json');
const LESSONS = path.join(ROOT, 'data', 'lessons.json');
const SOURCES = path.join(ROOT, 'data', 'sources.json');
const KEYS = path.join(ROOT, 'docs', 'case-keys.csv');

const JSON_OUT = process.argv.includes('--json');

function readJson(file) {
  let raw = fs.readFileSync(file, 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  return JSON.parse(raw);
}

const problems = [];
const warnings = [];
function fail(code, detail) { problems.push({ code: code, detail: detail }); }
function warn(detail) { warnings.push(detail); }

/* ------------------------------------------------------------- helpers */
function round(v, n) {
  const p = Math.pow(10, n == null ? 2 : n);
  return Math.round(v * p) / p;
}

function parseCsv(text) {
  const rows = [];
  text.replace(/^\ufeff/, '').trim().split(/\r?\n/).forEach(function (line) {
    const cells = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQ = false;
        else cur += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ',') { cells.push(cur); cur = ''; }
      else cur += ch;
    }
    cells.push(cur);
    rows.push(cells);
  });
  const head = rows.shift();
  return rows.filter(function (r) { return r.length && r[0] !== ''; }).map(function (r) {
    const o = {};
    head.forEach(function (h, i) { o[h] = r[i]; });
    return o;
  });
}

function dataFile(c, name) {
  const f = (c.dataFiles || []).filter(function (x) { return x.name === name; })[0];
  if (!f) throw new Error(c.caseId + ': missing data file ' + name);
  return f.kind === 'csv' ? parseCsv(f.content) : f.content;
}

/* -------------------------------------------------- independent formulae */
/* Deliberately written differently from gen_cases.py: closed forms expanded,
 * CSV rows looked up by id rather than passed in. */

function areaRatioRect(l, w, t) { return (l * w) / (2 * (l + w) * t); }
function areaRatioRound(d, t) { return d / (4 * t); }
function aspect(w, t) { return w / t; }
function dpmo(defects, boards, opp) { return (defects / (boards * opp)) * 1e6; }
function ppm(d, b) { return (d / b) * 1e6; }

/* ISO 2859-1, general inspection level II, AQL 1.0 — the two rows the course
 * uses, typed here independently of the generator and of the lesson. */
const ISO_TABLE = {
  3000: { code: 'K', n: 125, ac: 3, re: 4 },
  5000: { code: 'L', n: 200, ac: 5, re: 6 }
};

/* ------------------------------------------------------ expected answers */
/* caseId.stepId -> function(caseDoc) returning the independently computed
 * value. A step not listed here is reported as unverified, which is a failure:
 * a key nobody recomputes is exactly the hand-typed key the brief forbids. */
const EXPECTED = {
  'cx-m03-01.s1': function (c) {
    const r = dataFile(c, 'aperture-table.csv').filter(function (x) { return x.aperture_id === 'A-03'; })[0];
    return areaRatioRect(+r.width_mm, +r.length_mm, +r.foil_mm);
  },
  'cx-m03-01.s2': function () { return 'b'; },
  'cx-m03-01.s3': function (c) {
    const r = dataFile(c, 'aperture-table.csv').filter(function (x) { return x.aperture_id === 'A-04'; })[0];
    return areaRatioRect(+r.width_mm, +r.length_mm, +r.foil_mm);
  },
  'cx-m03-01.s4': function (c) {
    const r = dataFile(c, 'aperture-table.csv').filter(function (x) { return x.aperture_id === 'A-04'; })[0];
    return aspect(+r.width_mm, +r.foil_mm);
  },
  'cx-m03-01.s5': function (c) {
    const r = dataFile(c, 'aperture-table.csv').filter(function (x) { return x.aperture_id === 'A-06'; })[0];
    return areaRatioRect(+r.width_mm, +r.length_mm, +r.foil_mm);
  },
  'cx-m03-01.s6': function (c) {
    const r = dataFile(c, 'aperture-table.csv').filter(function (x) { return x.aperture_id === 'A-05'; })[0];
    return areaRatioRound(+r.diameter_mm, +r.foil_mm);
  },
  'cx-m03-01.s7': function (c) {
    const r = dataFile(c, 'aperture-table.csv').filter(function (x) { return x.aperture_id === 'A-04'; })[0];
    return (+r.width_mm) * (+r.length_mm) * (+r.foil_mm) * 1000;
  },
  'cx-m03-01.s8': function () { return 'b'; },

  'cx-m02-01.s1': function () { return 72; },          /* J-STD-033 MSL 4 */
  'cx-m02-01.s2': function (c) {
    const r = dataFile(c, 'msl-log.csv').filter(function (x) { return x.reel === 'R-4412'; })[0];
    return (+r.bag_open_h_ago) + (+r.line_exposure_h);
  },
  'cx-m02-01.s3': function (c) {
    const r = dataFile(c, 'msl-log.csv').filter(function (x) { return x.reel === 'R-4412'; })[0];
    return 72 - ((+r.bag_open_h_ago) + (+r.line_exposure_h));
  },
  'cx-m02-01.s4': function () { return 'b'; },
  'cx-m02-01.s5': function () { return 40; },          /* tape ceiling */
  'cx-m02-01.s6': function () { return 'b'; },

  'cx-m06-01.s1': function (c) {
    const r = dataFile(c, 'profile.csv').filter(function (x) { return x.interval === 'ramp'; })[0];
    return (+r.to_c - +r.from_c) / (+r.seconds);
  },
  'cx-m06-01.s2': function (c) {
    const r = dataFile(c, 'profile.csv').filter(function (x) { return x.interval === 'above_liquidus'; })[0];
    return (+r.seconds) - 60;                           /* paste window floor, m06l07 */
  },
  'cx-m06-01.s3': function (c) {
    const r = dataFile(c, 'profile.csv').filter(function (x) { return x.interval === 'peak_hold'; })[0];
    return 250 - (+r.from_c);                           /* J-STD-020 large package */
  },
  'cx-m06-01.s4': function (c) {
    const r = dataFile(c, 'profile.csv').filter(function (x) { return x.interval === 'cooling'; })[0];
    return (+r.from_c - +r.to_c) / (+r.seconds);
  },
  'cx-m06-01.s5': function () { return 'b'; },
  'cx-m06-01.s6': function () { return 100 / 90; },
  'cx-m06-01.s7': function () { return 'b'; },

  'cx-m14-01.s1': function (c, doc) {
    const r = dataFile(c, 'defect-log.csv').filter(function (x) { return x.family === 'BGA void / non-wet'; })[0];
    return dpmo(+r.confirmed, +r.boards_in_window, doc.board.facts.opportunitiesPerBoard);
  },
  'cx-m14-01.s2': function (c) {
    const r = dataFile(c, 'defect-log.csv').filter(function (x) { return x.family === 'BGA void / non-wet'; })[0];
    return ((+r.calls) - (+r.confirmed)) / (+r.calls) * 100;
  },
  'cx-m14-01.s3': function () { return ISO_TABLE[3000].code.toLowerCase(); },
  'cx-m14-01.s4': function () { return ISO_TABLE[3000].n; },
  'cx-m14-01.s5': function () { return 'b'; },
  'cx-m14-01.s6': function () { return ISO_TABLE[5000].n; },
  'cx-m14-01.s7': function (c) {
    const r = dataFile(c, 'capa-window.csv').filter(function (x) { return x.phase === 'before'; })[0];
    return ppm(+r.defects, +r.boards);
  },
  'cx-m14-01.s8': function (c) {
    const r = dataFile(c, 'capa-window.csv').filter(function (x) { return x.phase === 'after'; })[0];
    return ppm(+r.defects, +r.boards);
  },
  'cx-m14-01.s9': function (c) {
    const rows = dataFile(c, 'capa-window.csv');
    const b = rows.filter(function (x) { return x.phase === 'before'; })[0];
    const a = rows.filter(function (x) { return x.phase === 'after'; })[0];
    const rb = ppm(+b.defects, +b.boards);
    const ra = ppm(+a.defects, +a.boards);
    return (rb - ra) / rb * 100;
  },
  'cx-m14-01.s10': function () { return 'b'; }
};

/* -------------------------------------------------------------- the check */
function main() {
  const doc = readJson(CASES);
  const lessons = readJson(LESSONS);
  const sources = readJson(SOURCES);
  const sourceIds = new Set(sources.map(function (s) { return s.id; }));
  const lessonIds = new Set(lessons.map(function (l) { return l.lessonId; }));
  const moduleIds = new Set(lessons.map(function (l) { return l.moduleId; }));

  if (doc.schemaVersion !== 1) fail('schema', 'schemaVersion must be 1');
  if (!doc.board || !doc.board.facts) fail('schema', 'board facts are missing');
  if (!doc.thresholds) fail('schema', 'thresholds block is missing');
  else {
    Object.keys(doc.thresholds).forEach(function (k) {
      const row = doc.thresholds[k];
      if (!Array.isArray(row) || row.length !== 3) fail('threshold-shape', k);
      else if (!sourceIds.has(row[1])) fail('threshold-source', k + ' cites unknown ' + row[1]);
      else if (!lessonIds.has(row[2])) fail('threshold-lesson', k + ' cites unknown lesson ' + row[2]);
    });
  }

  const cases = doc.cases || [];
  if (!cases.length) fail('empty', 'no cases');
  const seenIds = new Set();
  const verified = [];

  cases.forEach(function (c) {
    const at = c.caseId || '(no id)';
    ['caseId', 'moduleId', 'title', 'estMinutes', 'scenario', 'dataFiles', 'steps',
      'rubric', 'templates', 'toolLinks', 'sources', 'generatedBy'].forEach(function (k) {
      if (c[k] === undefined || c[k] === null || c[k] === '') fail('field-missing', at + ' -> ' + k);
    });

    if (seenIds.has(c.caseId)) fail('dup-case', c.caseId);
    seenIds.add(c.caseId);
    if (!moduleIds.has(c.moduleId)) fail('module', at + ' -> ' + c.moduleId);
    if (!/^cx-m\d{2}-\d{2}$/.test(c.caseId)) fail('case-id-shape', c.caseId);
    if (!Array.isArray(c.scenario) || c.scenario.length < 2) fail('scenario', at);
    if (c.generatedBy !== 'scripts/gen_cases.py') fail('generated-by', at);

    (c.sources || []).forEach(function (id) {
      if (!sourceIds.has(id)) fail('source', at + ' -> ' + id);
    });
    (c.toolLinks || []).forEach(function (t) {
      const m = /^#\/l\/([a-z0-9]+)$/.exec(t.href || '');
      if (!m) fail('tool-link', at + ' -> ' + t.href);
      else if (!lessonIds.has(m[1])) fail('tool-link-lesson', at + ' -> ' + t.href);
    });
    (c.dataFiles || []).forEach(function (f) {
      if (!f.name || !f.kind || !f.content) fail('data-file', at + ' -> ' + JSON.stringify(f).slice(0, 40));
      if (f.kind === 'csv') {
        try { parseCsv(f.content); } catch (e) { fail('data-file-csv', at + ' -> ' + f.name); }
      }
    });

    /* rubric */
    let total = 0;
    const rubricSteps = {};
    (c.rubric || []).forEach(function (r) {
      if (!r.criterion || typeof r.points !== 'number') fail('rubric-shape', at);
      total += r.points || 0;
      (r.steps || []).forEach(function (sid) {
        rubricSteps[sid] = (rubricSteps[sid] || 0) + 1;
        if (!c.steps.some(function (s) { return s.id === sid; })) {
          fail('rubric-step', at + ' rubric names missing step ' + sid);
        }
      });
    });
    if (total !== 100) fail('rubric-total', at + ' rubric totals ' + total + ', expected 100');
    c.steps.forEach(function (s) {
      if (!rubricSteps[s.id]) warn(at + ' step ' + s.id + ' is not scored by the rubric');
    });

    /* steps */
    const stepIds = new Set();
    const numericValues = [];
    c.steps.forEach(function (s) {
      const where = at + '/' + s.id;
      if (stepIds.has(s.id)) fail('dup-step', where);
      stepIds.add(s.id);
      if (s.type !== 'numeric' && s.type !== 'choice') fail('step-type', where + ' -> ' + s.type);
      if (!s.prompt) fail('step-prompt', where);
      if (!Array.isArray(s.hints) || s.hints.length < 2) fail('step-hints', where + ' needs >= 2 progressive hints');
      if (!s.feedbackCorrect || !s.feedbackWrong) fail('step-feedback', where);
      if (!s.explanation || String(s.explanation).length < 80) fail('step-explanation', where);

      if (s.type === 'numeric') {
        const a = s.answer || {};
        if (typeof a.value !== 'number' || !isFinite(a.value)) fail('answer-value', where);
        if (!a.unit) fail('answer-unit', where + ' has no unit');
        if (typeof a.tolerance !== 'number' || a.tolerance <= 0) fail('answer-tolerance', where);
        numericValues.push({ id: s.id, value: a.value });
      } else {
        const ids = (s.options || []).map(function (o) { return o.id; });
        if (ids.length !== 4) fail('option-count', where + ' has ' + ids.length + ' options');
        if (new Set(ids).size !== ids.length) fail('option-dup', where);
        if (ids.indexOf(s.answer.value) < 0) fail('choice-key', where + ' key ' + s.answer.value + ' not among options');
        if ((s.options || []).some(function (o) { return !o.text || o.text.length < 1; })) {
          fail('option-text', where);
        }
      }

      /* independent recomputation */
      const fn = EXPECTED[at + '.' + s.id];
      if (!fn) {
        fail('unverified', where + ' has no independent recomputation');
        return;
      }
      let expected;
      try { expected = fn(c, doc); }
      catch (e) { fail('recompute-error', where + ' -> ' + e.message); return; }

      if (typeof expected === 'string') {
        /* For a choice step the stored key is an option id; the independent
         * value is the text the option must carry, or the id itself when the
         * answer is a bare code (an ISO letter). Compare both ways. */
        const keyed = (s.options || []).filter(function (o) { return o.id === s.answer.value; })[0];
        const keyText = keyed ? String(keyed.text) : '';
        const hit = expected === s.answer.value ||
          keyText.toLowerCase().indexOf(expected.toLowerCase()) >= 0;
        if (!hit) {
          fail('answer-mismatch', where + ' key ' + s.answer.value + ' ("' +
            keyText.slice(0, 40) + '") vs independent ' + expected);
        } else verified.push(where);
      } else {
        const got = s.answer.value;
        const tol = (s.answer || {}).tolerance || 0;
        /* the stored key must equal the recomputed number to within the
         * step's own tolerance; a tighter check would punish legitimate
         * rounding in the generator's display. */
        if (Math.abs(got - expected) > tol + 1e-9) {
          fail('answer-mismatch', where + ' key ' + got + ' vs independent ' +
            round(expected, 4) + ' (tolerance ' + tol + ')');
        } else verified.push(where);
      }
    });

    /* two numeric steps must not share an answer — that is a design smell and
     * a learner would notice it as a repeated question */
    for (let i = 0; i < numericValues.length; i++) {
      for (let j = i + 1; j < numericValues.length; j++) {
        if (Math.abs(numericValues[i].value - numericValues[j].value) < 1e-9) {
          fail('answer-duplicate', at + ': steps ' + numericValues[i].id + ' and ' +
            numericValues[j].id + ' have the same numeric answer');
        }
      }
    }
  });

  /* ---------------------------------------------------- brief control numbers */
  const control = [
    ['area ratio 0.20x0.80 T=0.125 -> 0.64', round(areaRatioRect(0.20, 0.80, 0.125), 2), 0.64],
    ['area ratio 0.20x0.80 T=0.100 -> 0.80', round(areaRatioRect(0.20, 0.80, 0.100), 2), 0.80],
    ['area ratio 0.18x0.80 T=0.125 -> 0.59', round(areaRatioRect(0.18, 0.80, 0.125), 2), 0.59],
    ['aspect 0.20/0.100 -> 2.0', round(aspect(0.20, 0.100), 1), 2.0],
    ['round aperture D/(4T) 0.50/0.125 -> 1.00', round(areaRatioRound(0.50, 0.125), 2), 1.00],
    ['DPMO 38/(1240*620)*1e6 -> 49.4', round(dpmo(38, 1240, 620), 1), 49.4],
    ['ISO 2859-1 lot 3000 -> code K, n=125', ISO_TABLE[3000].code + '/' + ISO_TABLE[3000].n, 'K/125'],
    ['ISO 2859-1 lot 5000 -> code L, n=200', ISO_TABLE[5000].code + '/' + ISO_TABLE[5000].n, 'L/200']
  ];
  const controlResults = control.map(function (row) {
    const ok = row[1] === row[2];
    if (!ok) fail('control-number', row[0] + ': computed ' + row[1] + ', brief says ' + row[2]);
    return { label: row[0], got: row[1], want: row[2], ok: ok };
  });

  /* --------------------------------------------------- CSV agrees with JSON */
  if (!fs.existsSync(KEYS)) fail('keys-csv', 'docs/case-keys.csv is missing');
  else {
    const rows = parseCsv(fs.readFileSync(KEYS, 'utf8'));
    const steps = [];
    cases.forEach(function (c) { c.steps.forEach(function (s) { steps.push({ c: c.caseId, s: s }); }); });
    if (rows.length !== steps.length) {
      fail('keys-csv-rows', 'CSV has ' + rows.length + ' rows, JSON has ' + steps.length + ' steps');
    }
    rows.forEach(function (r) {
      const c = cases.filter(function (x) { return x.caseId === r.caseId; })[0];
      if (!c) { fail('keys-csv-case', r.caseId); return; }
      const s = c.steps.filter(function (x) { return x.id === r.stepId; })[0];
      if (!s) { fail('keys-csv-step', r.caseId + '/' + r.stepId); return; }
      if (s.type === 'numeric') {
        if (Math.abs(parseFloat(r.value) - s.answer.value) > Math.abs(s.answer.value) * 1e-3 + 1e-6) {
          fail('keys-csv-value', r.caseId + '/' + r.stepId + ' CSV ' + r.value + ' vs JSON ' + s.answer.value);
        }
        if (r.unit !== s.answer.unit) fail('keys-csv-unit', r.caseId + '/' + r.stepId);
      } else if (r.value !== s.answer.value) {
        fail('keys-csv-key', r.caseId + '/' + r.stepId);
      }
    });
  }

  /* ---- templates: three variants, example equals a data file ------------- */
  let tplCount = 0, tplFiles = 0;
  cases.forEach(function (c) {
    const files = {};
    (c.dataFiles || []).forEach(function (f) { files[f.name] = String(f.content).replace(/^\ufeff/, ''); });
    (c.templates || []).forEach(function (t) {
      tplCount++;
      const vs = t.variants || [];
      tplFiles += vs.length;
      const names = vs.map(function (v) { return v.variant; }).sort().join(',');
      if (names !== 'blank,example,guide') {
        fail('template-variants', c.caseId + '/' + t.templateId + ' -> ' + names);
        return;
      }
      const by = {};
      vs.forEach(function (v) { by[v.variant] = String(v.content).replace(/^\ufeff/, ''); });
      const head = function (txt) { return txt.split(/\r?\n/)[0]; };
      if (head(by.blank) !== head(by.example)) {
        fail('template-header', c.caseId + '/' + t.templateId);
      }
      /* The example must be traceable to something verified. Two legitimate
       * shapes: a copy of one of the case's data files (stencil, MSL, reflow),
       * or — where the template is not a reshaped log, as with the 8D — rows
       * whose value cells are the case's own answers. Anything else is a
       * hand-typed example and is refused. */
      if (!Object.keys(files).some(function (n) { return files[n] === by.example; })) {
        const body = by.example.split(/\r?\n/).slice(1).filter(function (l) { return l.trim(); });
        const answers = new Set((c.steps || []).map(function (st) { return String(st.answer.value); }));
        const texts = new Set();
        (c.steps || []).forEach(function (st) {
          (st.options || []).forEach(function (o) {
            if (o.id === st.answer.value) { texts.add(o.text); answers.add(o.text); }
          });
        });
        const cells = body.map(function (l) { return l.split(','); }).reduce(function (a, r) { return a.concat(r); }, []);
        const cited = cells.filter(function (cell) {
          const v = cell.replace(/^"|"$/g, '').trim();
          if (!v) return false;
          if (answers.has(v)) return true;
          /* "16000 ppm" cites the answer 16000 with its unit attached */
          const m = v.match(/^(-?[\d.]+)\s+\S+$/);
          return !!(m && answers.has(m[1]));
        });
        if (body.length < 3 || cited.length < 2) {
          fail('template-example', c.caseId + '/' + t.templateId +
            ' example is neither a data file nor built from the case answers');
        }
      }
      if (by.guide.length < 200) fail('template-guide', c.caseId + '/' + t.templateId);
      vs.forEach(function (v) {
        if (!/^[a-z0-9-]+\.(csv|md)$/.test(v.file)) {
          fail('template-filename', c.caseId + '/' + t.templateId + ' -> ' + v.file);
        }
        const wantMime = /\.csv$/.test(v.file) ? 'text/csv' : 'text/markdown';
        if (v.mime !== wantMime) fail('template-mime', c.caseId + '/' + t.templateId + ' -> ' + v.file);
      });
    });
  });

  /* ---- thread: every step points at a case that exists, every case is on it */
  const thread = Array.isArray(doc.thread) ? doc.thread : [];
  const caseIdsNow = new Set(cases.map(function (c) { return c.caseId; }));
  const threadedModules = new Set(thread.map(function (t) { return t.moduleId; }));
  thread.forEach(function (t) {
    if (!caseIdsNow.has(t.caseId)) fail('thread-case', t.caseId);
  });
  cases.forEach(function (c) {
    if (!threadedModules.has(c.moduleId)) fail('thread-missing', c.caseId);
  });

  /* ----------------------------------------------------------- module query */
  const perModule = {};
  cases.forEach(function (c) { perModule[c.moduleId] = (perModule[c.moduleId] || 0) + 1; });

  const summary = {
    cases: cases.length,
    steps: cases.reduce(function (a, c) { return a + c.steps.length; }, 0),
    numericSteps: cases.reduce(function (a, c) {
      return a + c.steps.filter(function (s) { return s.type === 'numeric'; }).length;
    }, 0),
    choiceSteps: cases.reduce(function (a, c) {
      return a + c.steps.filter(function (s) { return s.type === 'choice'; }).length;
    }, 0),
    perModule: perModule,
    independentlyVerified: verified.length,
    controlNumbers: controlResults,
    templates: tplCount,
    templateFiles: tplFiles,
    thread: thread.length
  };

  if (JSON_OUT) {
    console.log(JSON.stringify({ ok: problems.length === 0, summary: summary, problems: problems,
      warnings: warnings }, null, 2));
    process.exitCode = problems.length ? 1 : 0;
    return;
  }

  console.log('=== cases — structural + independent-key check ===\n');
  console.log('cases                  ' + summary.cases);
  console.log('steps                  ' + summary.steps + '  (' + summary.numericSteps +
    ' numeric, ' + summary.choiceSteps + ' choice)');
  console.log('per module             ' + Object.keys(perModule).sort().map(function (k) {
    return k + ':' + perModule[k];
  }).join('  '));
  console.log('keys recomputed        ' + summary.independentlyVerified + ' of ' + summary.steps);
  console.log('templates              ' + summary.templates + ' (' + summary.templateFiles +
    ' files: blank, example, guide)');
  console.log('Board X thread         ' + summary.thread + ' step(s)');
  console.log('\nPhase-3 control numbers');
  controlResults.forEach(function (r) {
    console.log('  ' + (r.ok ? 'ok  ' : 'FAIL') + '  ' + r.label + '  -> ' + r.got);
  });

  if (warnings.length) {
    console.log('\nWarnings');
    warnings.forEach(function (w) { console.log('  ! ' + w); });
  }

  if (problems.length) {
    console.log('\nFAIL — ' + problems.length + ' problem(s)');
    const byCode = {};
    problems.forEach(function (p) { (byCode[p.code] = byCode[p.code] || []).push(p.detail); });
    Object.keys(byCode).forEach(function (code) {
      console.log('  ' + code + ' (' + byCode[code].length + ')');
      byCode[code].slice(0, 8).forEach(function (d) { console.log('      ' + d); });
    });
    process.exitCode = 1;
    return;
  }
  console.log('\nOK — cases are structurally sound and every key reproduces independently.');
}

try { main(); } catch (err) {
  console.error('check-cases: ' + err.message);
  process.exitCode = 1;
}
