#!/usr/bin/env node
/* =========================================================================
 * 04-normalise.js — the structural half of the edit, applied to every lesson
 *
 * Two defects are mechanical and appear in all fifteen modules, so they are
 * fixed mechanically rather than by hand — and every change is checked against
 * the frozen numbers before it is kept.
 *
 * 1. Paragraphs over ~120 words. The course has 139 of them, 13 over 200. Each
 *    is split at sentence boundaries into paragraphs of 60-110 words, keeping
 *    the sentences in order. Nothing is reworded here, so no number can move.
 *
 * 2. The same closing instruction, 75 times: "…, but verify against your
 *    paste/equipment datasheet." It is true, it is necessary, and repeating it
 *    verbatim after every list teaches the reader to skip it. It is replaced by
 *    the shortest of four variants that fits the sentence it follows, and where
 *    the same lesson already carries the instruction, it is dropped entirely —
 *    one lesson, one reminder.
 *
 * Both rules are reversible and both are re-checked: the script compares the
 * numeric inventory of the lesson before and after, and refuses to write the
 * file if a single number or standard name disappeared.
 *
 * Usage:
 *   node src/phase5/04-normalise.js --dry
 *   node src/phase5/04-normalise.js          # writes data/lessons.json
 * ========================================================================= */
'use strict';
const { LESSONS_PATH, readJson, writeJson } = require('./lib');

const DRY = process.argv.includes('--dry');

const NUM = /(?<![\w.-])[-+]?\d+(?:[.,]\d+)?/g;
const STD = /\b(?:IPC|J-STD|JEDEC|ISO|IEC|ANSI|ESD|UL|ASTM|MIL)[-\s]?(?:TM[-\s]?)?[A-Z0-9][A-Z0-9/.-]*/g;
function tokens(t) {
  return {
    n: (String(t).match(NUM) || []).slice().sort(),
    s: (String(t).match(STD) || []).map(function (x) { return x.replace(/\.$/, ''); }).sort()
  };
}
function lost(before, after) {
  const a = tokens(before), b = tokens(after);
  const have = {};
  b.n.forEach(function (x) { have[x] = (have[x] || 0) + 1; });
  const gone = [];
  a.n.forEach(function (x) { if (have[x]) have[x]--; else gone.push(x); });
  const as = b.s.map(function (x) { return x.toLowerCase(); }).join('|');
  a.s.forEach(function (x) { if (as.indexOf(x.toLowerCase()) < 0 && gone.indexOf(x) < 0) gone.push(x); });
  return gone;
}

const words = function (t) { return String(t).trim().split(/\s+/).filter(Boolean); };
const sentences = function (t) {
  return String(t).trim().split(/(?<=[.!?])\s+(?=[A-Z0-9"“(\u201c])/).filter(Boolean);
};

/* ---- rule 1: split long paragraphs ------------------------------------- */
const TARGET = 105;   // aim a little under the 120-word ceiling
function splitParagraph(text) {
  const ss = sentences(text);
  if (ss.length < 2 || words(text).length <= 120) return [text];
  const out = [];
  let cur = [];
  ss.forEach(function (s) {
    const joinable = cur.length && words(cur.concat([s]).join(' ')).length <= TARGET;
    if (joinable) { cur.push(s); return; }
    if (cur.length) out.push(cur.join(' '));
    cur = [s];
  });
  if (cur.length) out.push(cur.join(' '));
  /* A reflow split can leave a two-word tail ("It is."); merge it back. */
  for (let i = out.length - 1; i > 0; i--) {
    if (words(out[i]).length < 25) { out[i - 1] = out[i - 1] + ' ' + out[i]; out.splice(i, 1); }
  }
  return out;
}

/* ---- rule 2: the repeated closing instruction --------------------------- */
/* The repeated instruction, in the two shapes it takes in this course: a trailing
 * clause after a comma, and a sentence of its own. A match that carries a
 * standard name is never touched — "verify against IPC/JEDEC J-STD-033" is a
 * citation, not boilerplate. */
const STD_IN = /\b(?:IPC|J-STD|JEDEC|ISO|IEC|ANSI|ESD|UL|ASTM|MIL)[-\s]?/;
const BOILER_TAIL = /,?\s+but (?:verify|check|confirm)(?: this| them| it)? against (?:your|the|the supplier's) [^.]*?(?:datasheet|data sheet|specification|procedure|control plan|drawing)[^.]*\./gi;
const BOILER_SENT = /(?:^|(?<=[.!?]\s))(?:That said, |Also, )?(?:Verify|Check|Confirm)(?: this| them| it)? against (?:your|the|the supplier's) [^.]*?(?:datasheet|data sheet|specification|procedure|control plan|drawing)[^.]*\.\s?/g;
const VARIANTS = [
  ' Take the limits from your own process documentation.',
  ' Your datasheets and process plan hold the numbers.',
  ' Check the figure against your own documentation.',
  ' Confirm the limit against your process plan.'
];
let boilerHits = 0;  // reset at the start of normalise()

function deBoilerplate(text, seen) {
  const keep = function (m) { return STD_IN.test(m) ? m : null; };
  let out = text.replace(BOILER_TAIL, function (m) {
    if (keep(m)) return m;
    boilerHits++;
    if (seen.value) return '.';
    seen.value = true;
    return VARIANTS[Math.abs(hash(text)) % VARIANTS.length];
  });
  out = out.replace(BOILER_SENT, function (m) {
    if (keep(m)) return m;
    boilerHits++;
    if (seen.value) return '';
    seen.value = true;
    return VARIANTS[Math.abs(hash(text) + 7) % VARIANTS.length] + ' ';
  });
  return out;
}
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/* ---- apply ------------------------------------------------------------- */
const problems = [];
const stats = { split: 0, boiler: 0, refused: 0 };
function handBook(id) {
  return require('fs').existsSync(require('path').join(__dirname, 'edit', id + '.js'));
}
function normalise(lessons) {
const fs = require('fs');
const path = require('path');
problems.length = 0;
stats.split = 0; stats.boiler = 0; boilerHits = 0;
lessons.forEach(function (l) {
  /* A lesson with an editorial book has been rewritten by hand: it is already
   * short-paragraphed and free of the repeated closing instruction, so the
   * mechanical pass skips it rather than second-guessing the writer. */
  if (handBook(l.lessonId)) return;
  /* `seen` tracks whether the closing instruction has already appeared once in
   * this lesson; the second and later copies are the repetition being removed. */
  const seen = { value: false };
  l.content.theory.forEach(function (t) {
    if (!t || typeof t.p !== 'string') return;
    const orig = t.p;
    let text = deBoilerplate(orig, seen);
    text = text.replace(/\s+\./g, '.').replace(/\s{2,}/g, ' ').trim();
    const parts = splitParagraph(text);
    if (parts.length > 1) stats.split++;
    const gone = lost(orig, parts.join(' '));
    if (gone.length) {
      problems.push(l.lessonId + ' "' + (t.h || '') + '": lost ' + gone.join(', '));
      return;
    }
    t.p = parts.length === 1 ? parts[0] : parts;
  });
});
stats.boiler = boilerHits;
return problems;
}

module.exports = { normalise, stats };

/* ---- CLI: run alone against the current file --------------------------- */
if (require.main === module) {
  const lessons = readJson(LESSONS_PATH);
  const problems = normalise(lessons);
  console.log('paragraphs re-split        ' + stats.split);
  console.log('boilerplate replacements   ' + stats.boiler);
  if (problems.length) {
    console.log('\nFAIL — ' + problems.length + ' paragraph(s) would lose a number:');
    problems.slice(0, 20).forEach(function (p) { console.log('  ' + p); });
    process.exitCode = 1;
  } else {
    console.log('\nOK — every number and standard name survives the structural pass.');
  }
  if (DRY) { console.log('(dry run: nothing written)'); }
  else if (problems.length) { console.log('nothing written'); }
  else { writeJson(LESSONS_PATH, lessons); console.log('wrote data/lessons.json'); }
}
