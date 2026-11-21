#!/usr/bin/env node
/* =========================================================================
 * diagnose-longest.js — how the option-length cue is actually distributed
 *
 * The Phase-1 brief asks for the share of questions in which the longest
 * option is also the keyed answer, with a target of 25-35 %. That metric is
 * only meaningful when read together with two others:
 *
 *   exact  — the key is the strictly longest option (the case the brief names)
 *   tied   — options share the maximum length, so "longest" points at more than
 *            one option and the cue does not single out the key
 *   strict — the key is strictly LONGER than every distractor (unambiguous cue)
 *   free   — every option has exactly the same length (no cue at all)
 *
 * An option set where every length is identical scores 0 % on `exact` but is
 * the strongest possible result; an option set where the key is one character
 * longer than the rest scores 100 % and is a weak question. So the useful
 * numbers are `strict` (should be low) and `free` (should be high).
 *
 * Usage:
 *   node scripts/diagnose-longest.js                  # whole bank, per module
 *   node scripts/diagnose-longest.js --batch <regex>   # question ids matching
 *   node scripts/diagnose-longest.js --json
 * ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function load() {
  const raw = fs.readFileSync(path.join(ROOT, 'data', 'questions.json'), 'utf8');
  return JSON.parse(raw);
}

function measure(questions) {
  const rows = questions.map(function (q) {
    const lens = q.options.map(function (o) { return o.text.length; });
    const max = Math.max.apply(null, lens);
    const min = Math.min.apply(null, lens);
    const keyIdx = q.options.findIndex(function (o) { return o.id === q.correct; });
    const keyLen = lens[keyIdx];
    const maxHits = lens.filter(function (l) { return l === max; }).length;
    return {
      id: q.questionId,
      module: String(q.lessonId).slice(0, 3),
      pool: q.pool === 'exam' ? 'exam' : 'lesson',
      exact: keyLen === max && maxHits === 1,
      tied: maxHits > 1,
      strict: keyLen > Math.max.apply(null, lens.filter(function (_, i) { return i !== keyIdx; })),
      free: max === min,
      keyLen: keyLen,
      minLen: min,
      maxLen: max,
      spread: max ? (max - min) / max : 0
    };
  });

  const n = rows.length;
  const count = function (f) { return rows.filter(f).length; };
  const pct = function (x) { return n ? +(x / n * 100).toFixed(1) : 0; };

  const byModule = {};
  rows.forEach(function (r) {
    byModule[r.module] = byModule[r.module] || { n: 0, exact: 0, strict: 0, free: 0 };
    byModule[r.module].n++;
    if (r.exact) byModule[r.module].exact++;
    if (r.strict) byModule[r.module].strict++;
    if (r.free) byModule[r.module].free++;
  });
  Object.keys(byModule).forEach(function (m) {
    const b = byModule[m];
    b.exactPct = +(b.exact / b.n * 100).toFixed(1);
    b.strictPct = +(b.strict / b.n * 100).toFixed(1);
    b.freePct = +(b.free / b.n * 100).toFixed(1);
  });

  return {
    n: n,
    exact: count(function (r) { return r.exact; }),
    exactPct: pct(count(function (r) { return r.exact; })),
    tied: count(function (r) { return r.tied; }),
    tiedPct: pct(count(function (r) { return r.tied; })),
    strict: count(function (r) { return r.strict; }),
    strictPct: pct(count(function (r) { return r.strict; })),
    free: count(function (r) { return r.free; }),
    freePct: pct(count(function (r) { return r.free; })),
    meanSpreadPct: +(rows.reduce(function (a, r) { return a + r.spread; }, 0) / n * 100).toFixed(1),
    byModule: byModule,
    worst: rows.slice().sort(function (a, b) { return b.spread - a.spread; }).slice(0, 10)
  };
}

function render(m, label) {
  const L = [];
  L.push('=== option-length cue — ' + label + ' ===');
  L.push('  questions                       ' + m.n);
  L.push('  key is strictly longest (exact) ' + m.exact + '  ' + m.exactPct + ' %   <- the brief\'s metric');
  L.push('  options share the maximum (tied) ' + m.tied + '  ' + m.tiedPct + ' %');
  L.push('  key longer than every other      ' + m.strict + '  ' + m.strictPct + ' %   <- unambiguous cue, want low');
  L.push('  all options equal length (free)  ' + m.free + '  ' + m.freePct + ' %   <- no cue at all, want high');
  L.push('  mean relative length spread      ' + m.meanSpreadPct + ' %');
  L.push('');
  L.push('  per module            n   exact%  strict%   equal%');
  Object.keys(m.byModule).sort().forEach(function (k) {
    const b = m.byModule[k];
    L.push('  ' + (k + '').padEnd(18) + String(b.n).padStart(4) +
      String(b.exactPct).padStart(8) + String(b.strictPct).padStart(9) + String(b.freePct).padStart(9));
  });
  L.push('');
  L.push('  widest spreads (review first):');
  m.worst.forEach(function (r) {
    L.push('    ' + r.id.padEnd(16) + ' key ' + String(r.keyLen).padStart(4) +
      '  range ' + r.minLen + '-' + r.maxLen + '  spread ' + (r.spread * 100).toFixed(0) + ' %');
  });
  return L.join('\n');
}

function main(argv) {
  const asJson = argv.indexOf('--json') !== -1;
  const bi = argv.indexOf('--batch');
  const re = bi !== -1 && argv[bi + 1] ? new RegExp(argv[bi + 1]) : null;

  const all = load();
  const subset = re ? all.filter(function (q) { return re.test(q.questionId); }) : all;
  const m = measure(subset);

  if (asJson) console.log(JSON.stringify(m, null, 2));
  else console.log(render(m, re ? 'batch /' + re.source + '/' : 'whole bank'));
  return 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));
module.exports = { measure: measure, render: render };
