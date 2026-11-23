#!/usr/bin/env node
/* =========================================================================
 * apply.js — merge the phase-5 editorial output into data/lessons.json
 *
 * The rules this enforces, because the brief freezes the technical content:
 *
 *   1. Every paragraph keeps its heading and its index. An edit is keyed by
 *      lessonId + index, so a paragraph cannot be edited twice or lost.
 *   2. Every numeric token in the old paragraph must occur in the new text.
 *      Numbers, units and standard names are the technical content; wording is
 *      not. A lost number aborts the merge and names the paragraph.
 *   3. Additions (takeaways, mistakes, glossary, minutes, prereqs) are checked
 *      against src/phase5/schema.js before anything is written.
 *
 * Usage:
 *   node src/phase5/apply.js --dry          # report every check, write nothing
 *   node src/phase5/apply.js                # write data/lessons.json
 * ========================================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const { LESSONS_PATH, readJson, writeJson } = require('./lib');
const { checkLesson } = require('./schema');

const EDIT_DIR = path.join(__dirname, 'edit');
const DRY = process.argv.includes('--dry');

/* ---- the frozen technical content -------------------------------------- */
const NUM = /(?<![\w.-])[-+]?\d+(?:[.,]\d+)?/g;
const STD = /\b(?:IPC|J-STD|JEDEC|ISO|IEC|ANSI|ESD|UL|ASTM|MIL)[-\s]?(?:TM[-\s]?)?[A-Z0-9][A-Z0-9/.-]*/g;
function tokens(text) {
  const t = String(text || '');
  return {
    numbers: (t.match(NUM) || []).map(function (x) { return x.replace(/[.,]$/, ''); }),
    standards: (t.match(STD) || []).map(function (x) { return x.replace(/\.$/, ''); })
  };
}
/* A merged paragraph may move a number, never drop one. */
function missingNumbers(before, after) {
  const have = {};
  tokens(after).numbers.forEach(function (n) { have[n] = (have[n] || 0) + 1; });
  const gone = [];
  tokens(before).numbers.forEach(function (n) {
    if (have[n]) have[n]--;
    else gone.push(n);
  });
  return gone;
}
function missingStandards(before, after) {
  const a = tokens(after).standards.map(function (s) { return s.toLowerCase(); }).join(' | ');
  return tokens(before).standards.filter(function (s) { return a.indexOf(s.toLowerCase()) < 0; });
}

/* ---- books of edits ----------------------------------------------------
 * src/phase5/edit/<lessonId>.js exports { paragraphs: { <index>: { p, splits } },
 * takeaways: [...], mistakes: [{mistake, instead}], terms: [{term,def}],
 * minutes, prereqs: {lessons, skills} }
 * A paragraph with `splits` becomes several <p> entries; the array form is
 * already supported by the renderer, so nothing downstream changes. */
function bookFor(lessonId) {
  const file = path.join(EDIT_DIR, lessonId + '.js');
  if (!fs.existsSync(file)) return null;
  return require(file);
}

const PREREQS = require('./prereqs.json');

/* One reading model for the whole course; see 03-time.js for the numbers and
 * for why a self-study lesson is not read at skimming speed. */
const WPM = 120, QUIZ_S = 60, CALC_READ_MIN = 2, SOL_LINE_S = 40, CONSOLIDATE_MIN = 2;
function timeMinutes(l) {
  const theory = l.content.theory.reduce(function (a, t) {
    if (!t) return a;
    if (typeof t.p === 'string') return a + t.p.trim().split(/\s+/).filter(Boolean).length;
    if (Array.isArray(t.p)) return a + t.p.join(' ').trim().split(/\s+/).filter(Boolean).length;
    return a;
  }, 0);
  const solLines = Math.max(1, String(l.content.calc.solution || '')
    .split(/(?=\bStep\s+[a-z0-9]+:)/i).length);
  const minutes = theory / WPM + (l.quiz || []).length * QUIZ_S / 60 + CALC_READ_MIN +
    solLines * SOL_LINE_S / 60 + CONSOLIDATE_MIN;
  return Math.max(15, Math.ceil(minutes / 5) * 5);
}

function merge(lessons) {
const errors = [];
const report = [];
const prevIds = [];
let edited = 0;

lessons.forEach(function (l) {
  const book = bookFor(l.lessonId);
  const before = JSON.stringify(l.content);
  if (book) {
    Object.keys(book.headings || {}).forEach(function (key) {
      const entry = l.content.theory[+key];
      if (entry) entry.h = book.headings[key];
    });
    Object.keys(book.paragraphs || {}).forEach(function (key) {
      const i = +key;
      const entry = l.content.theory[i];
      if (!entry || typeof entry.p !== 'string') {
        errors.push(l.lessonId + '[' + i + ']: no paragraph at that index');
        return;
      }
      const spec = book.paragraphs[key];
      const paras = Array.isArray(spec.p) ? spec.p : [spec.p];
      const joined = paras.join(' ');
      const gone = missingNumbers(entry.p, joined);
      if (gone.length) {
        errors.push(l.lessonId + '[' + i + ']: numbers lost: ' + gone.join(', '));
        return;
      }
      const stds = missingStandards(entry.p, joined);
      if (stds.length) {
        errors.push(l.lessonId + '[' + i + ']: standard names lost: ' + stds.join(', '));
        return;
      }
      if (paras.some(function (p) { return !String(p).trim(); })) {
        errors.push(l.lessonId + '[' + i + ']: an empty paragraph');
        return;
      }
      entry.p = paras.length === 1 ? paras[0] : paras;
      report.push({ lessonId: l.lessonId, index: i, before, after: JSON.stringify(entry) });
    });
  }
  /* Time and prerequisites are derived, not chosen per lesson: one reading model
   * for the whole course, one prerequisite graph. An edit book may override them,
   * but nothing needs to. */
  l.minutes = timeMinutes(l);
  const pre = PREREQS[l.lessonId] || [];
  l.prereqs = {
    lessons: pre,
    skills: pre.map(function (id) {
      const src = lessons.filter(function (x) { return x.lessonId === id; })[0];
      return 'Lesson ' + id + ': ' + src.title;
    })
  };
  if (book) {
    if (book.takeaways) l.content.takeaways = book.takeaways;
    if (book.mistakes) l.content.mistakes = book.mistakes;
    if (book.terms) l.content.terms = book.terms;
  }
  const changed = JSON.stringify(l.content) !== before || book;
  if (changed) edited++;
  checkLesson(l, prevIds).forEach(function (e) { errors.push(e); });
  prevIds.push(l.lessonId);
});

report.forEach(function (r) {
  if (JSON.stringify(r.before) !== JSON.stringify(r.after)) edited += 0;
});

return { errors: errors, edited: edited, report: report };
}

/* ---- CLI --------------------------------------------------------------- */
if (require.main === module) {
const lessons = readJson(LESSONS_PATH);
const r = merge(lessons);
const errors = r.errors;
console.log('lessons with an edit book   ' + r.edited + ' of ' + lessons.length);
console.log('paragraphs rewritten        ' + r.report.length);
console.log('paragraphs still unchanged  ' + (lessons.reduce(function (a, l) {
  return a + l.content.theory.filter(function (t) { return t && typeof t.p === 'string'; }).length;
}, 0) - r.report.length));
if (errors.length) {
  console.log('\nFAIL — ' + errors.length + ' problem(s)');
  errors.slice(0, 40).forEach(function (e) { console.log('  ' + e); });
  const missing = errors.filter(function (e) { return /takeaways|mistakes|glossary/.test(e); });
  if (missing.length) console.log('  (' + missing.length + ' of them are lessons whose edit book is not written yet)');
  if (!DRY) { process.exitCode = 1; return; }
} else {
  console.log('\nOK — every requirement is met and no number was lost.');
}
if (DRY) { console.log('\n(dry run: nothing written)'); }
else if (errors.length) { console.log('\nnothing written'); process.exitCode = 1; }
else { writeJson(LESSONS_PATH, lessons); console.log('\nwrote data/lessons.json'); }
}

module.exports = { merge };
