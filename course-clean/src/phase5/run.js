#!/usr/bin/env node
/* =========================================================================
 * run.js — the phase-5 pass, in the one order that works
 *
 * Order matters here and is not cosmetic:
 *   1. reset to the baseline captured from git HEAD, so every run produces the
 *      same file and the diff is the edit rather than the history of the edit;
 *   2. apply the per-lesson editorial books (src/phase5/edit/<lessonId>.js) —
 *      they address the ORIGINAL paragraph indices, so they must run before
 *      anything splits a paragraph;
 *   3. split paragraphs over 120 words and de-duplicate the repeated closing
 *      instruction across all 92 lessons;
 *   4. apply the register rules;
 *   5. derive minutes from the final word count, attach prerequisites, and
 *      validate every lesson against schema.js.
 *
 * Usage:
 *   node src/phase5/run.js            # writes data/lessons.json
 *   node src/phase5/run.js --dry      # reports, writes nothing
 * ========================================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const { LESSONS_PATH, readJson, writeJson } = require('./lib');
const { merge } = require('./apply');
const { normalise, stats } = require('./04-normalise');
const { tighten } = require('./05-tighten');

const DRY = process.argv.includes('--dry');
const BASELINE = path.join(__dirname, 'baseline-lessons.json');

const lessons = readJson(BASELINE);
console.log('baseline lessons            ' + lessons.length);

const m = merge(lessons);
console.log('lessons with an edit book   ' + m.edited);
console.log('paragraphs rewritten        ' + m.report.length);

const problems = normalise(lessons);
console.log('paragraphs re-split         ' + stats.split);
console.log('boilerplate replaced        ' + stats.boiler);

const t = tighten(lessons);
console.log('sentences tightened         ' + t.changes);
if (t.changes) Object.keys(t.byRule).forEach(function (k) {
  console.log('   ' + String(t.byRule[k]).padStart(3) + '  ' + k);
});

/* Word counts move with the edit, so time is computed on the finished text. */
const { checkLesson } = require('./schema');
const PREREQS = require('./prereqs.json');
const WPM = 120, QUIZ_S = 60, CALC_READ_MIN = 2, SOL_LINE_S = 40, CONSOLIDATE_MIN = 2;
function minutesOf(l) {
  const theory = l.content.theory.reduce(function (a, x) {
    if (!x) return a;
    const list = Array.isArray(x.p) ? x.p : (typeof x.p === 'string' ? [x.p] : []);
    return a + list.join(' ').trim().split(/\s+/).filter(Boolean).length;
  }, 0);
  const lines = Math.max(1, String(l.content.calc.solution || '').split(/(?=\bStep\s+[a-z0-9]+:)/i).length);
  const m2 = theory / WPM + (l.quiz || []).length * QUIZ_S / 60 + CALC_READ_MIN + lines * SOL_LINE_S / 60 + CONSOLIDATE_MIN;
  return Math.max(15, Math.ceil(m2 / 5) * 5);
}
const errors = [];
const prev = [];
lessons.forEach(function (l) {
  l.minutes = minutesOf(l);
  const pre = PREREQS[l.lessonId] || [];
  l.prereqs = {
    lessons: pre,
    skills: pre.map(function (id) {
      const src = lessons.filter(function (x) { return x.lessonId === id; })[0];
      return 'Lesson ' + id + ': ' + src.title;
    })
  };
  checkLesson(l, prev).forEach(function (e) { errors.push(e); });
  prev.push(l.lessonId);
});
problems.forEach(function (p) { errors.push(p); });

const total = lessons.reduce(function (a, l) { return a + l.minutes; }, 0);
console.log('total lesson time           ' + total + ' min (avg ' + Math.round(total / lessons.length) + ')');

if (errors.length) {
  console.log('\nFAIL — ' + errors.length + ' problem(s)');
  errors.slice(0, 20).forEach(function (e) { console.log('  ' + e); });
  const rest = errors.length - 20;
  if (rest > 0) console.log('  … and ' + rest + ' more');
  if (DRY) { console.log('\n(dry run: nothing written)'); return; }
  console.log('\nnothing written');
  process.exitCode = 1;
  return;
}
console.log('\nOK — every lesson passes the phase-5 schema and no number was lost.');
if (DRY) { console.log('(dry run: nothing written)'); return; }
writeJson(LESSONS_PATH, lessons);
console.log('wrote data/lessons.json');
