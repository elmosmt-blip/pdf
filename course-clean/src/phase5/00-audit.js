#!/usr/bin/env node
/* =========================================================================
 * 00-audit.js — measure the text before touching it
 *
 * Phase 5 is an editorial phase, and an editorial brief without a baseline is
 * an opinion. This script produces the numbers the report quotes: paragraph
 * length distribution, the repeated formula ("X proves Y"), shared sentence
 * openers and boilerplate, and what each lesson is missing (time, prerequisites,
 * key takeaways, common mistakes).
 *
 * Usage:
 *   node src/phase5/00-audit.js            # human report
 *   node src/phase5/00-audit.js --json     # machine-readable, for the report
 * ========================================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const LESSONS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'lessons.json'), 'utf8'));

const sentences = function (t) {
  return String(t || '').split(/(?<=[.!?])\s+/).filter(function (s) { return s.trim(); });
};
const words = function (t) { return String(t || '').trim().split(/\s+/).filter(Boolean); };

const paras = [];
LESSONS.forEach(function (l) {
  /* A theory entry's p is a string, or an array of strings after the phase-5
   * split. Both are the same content; the audit measures paragraphs, so each
   * array entry counts once. */
  l.content.theory.forEach(function (t, i) {
    if (!t) return;
    const list = Array.isArray(t.p) ? t.p : (typeof t.p === 'string' ? [t.p] : []);
    list.forEach(function (p, j) {
      if (!p || !String(p).trim()) return;
      paras.push({ lessonId: l.lessonId, index: i + '.' + j, heading: t.h || '',
                   words: words(p).length, text: p });
    });
  });
});

const buckets = { '<=60': 0, '61-90': 0, '91-120': 0, '121-150': 0, '151-200': 0, '>200': 0 };
paras.forEach(function (p) {
  if (p.words <= 60) buckets['<=60']++;
  else if (p.words <= 90) buckets['61-90']++;
  else if (p.words <= 120) buckets['91-120']++;
  else if (p.words <= 150) buckets['121-150']++;
  else if (p.words <= 200) buckets['151-200']++;
  else buckets['>200']++;
});

/* "X proves Y" — the course's most repeated construction. Count it by looking
 * for a clause whose main verb is a form of prove. */
const PROVE = /\b(proves?|proved|proven)\b/i;
const DEFINES = /\b(is|are)\s+(the\s+)?(number|figure|value|limit|point)\b/i;
let proves = 0, proveParas = 0;
paras.forEach(function (p) {
  const s = sentences(p.text).filter(function (x) { return PROVE.test(x); });
  if (s.length) proveParas++;
  proves += s.length;
});

/* Shared openers: how often do paragraphs of different lessons start the same way? */
const openers = {};
paras.forEach(function (p) {
  const first = words(sentences(p.text)[0] || '').slice(0, 3).join(' ').toLowerCase();
  if (!first) return;
  openers[first] = (openers[first] || 0) + 1;
});
const topOpeners = Object.keys(openers)
  .map(function (k) { return { opener: k, n: openers[k] }; })
  .filter(function (e) { return e.n > 1; })
  .sort(function (a, b) { return b.n - a.n; });

/* Boilerplate sentences, counted verbatim. */
const sentCount = {};
paras.forEach(function (p) {
  sentences(p.text).forEach(function (s) {
    const key = s.trim();
    if (key.length < 12) return;
    sentCount[key] = (sentCount[key] || 0) + 1;
  });
});
const topSentences = Object.keys(sentCount)
  .map(function (k) { return { sentence: k, n: sentCount[k] }; })
  .filter(function (e) { return e.n > 1; })
  .sort(function (a, b) { return b.n - a.n; });

const hdr = 'usage node src/phase5/00-audit.js [--json]';
const out = {
  generatedAt: '2026-10-31',
  how: hdr,
  lessons: LESSONS.length,
  paragraphs: paras.length,
  theoryWords: paras.reduce(function (a, p) { return a + p.words; }, 0),
  buckets: buckets,
  over120: paras.filter(function (p) { return p.words > 120; }).length,
  over150: paras.filter(function (p) { return p.words > 150; }).length,
  over200: paras.filter(function (p) { return p.words > 200; }).length,
  longest: paras.slice().sort(function (a, b) { return b.words - a.words; }).slice(0, 12)
    .map(function (p) { return { lessonId: p.lessonId, heading: p.heading, words: p.words }; }),
  proves: { sentences: proves, paragraphs: proveParas },
  topOpeners: topOpeners,
  topSentences: topSentences.slice(0, 25),
  byLesson: {}
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

const pct = function (n) { return (n / out.paragraphs * 100).toFixed(1) + '%'; };
console.log('=== phase-5 audit — the text as it stands ===\n');
console.log('lessons                ' + out.lessons);
console.log('theory paragraphs      ' + out.paragraphs + '  (' + out.theoryWords + ' words)');
console.log('mean paragraph         ' + Math.round(out.theoryWords / out.paragraphs) + ' words\n');
console.log('length distribution');
Object.keys(buckets).forEach(function (k) {
  console.log('  ' + k.padEnd(8) + String(buckets[k]).padStart(4) + '  ' + pct(buckets[k]));
});
console.log('\nover 120 words         ' + out.over120 + '  (' + pct(out.over120) + ')');
console.log('over 150 words         ' + out.over150);
console.log('over 200 words         ' + out.over200);
console.log('\nlongest paragraphs');
out.longest.forEach(function (p) {
  console.log('  ' + p.words.toString().padStart(4) + '  ' + p.lessonId + '  ' + p.heading);
});
console.log('\n"X proves Y" construction');
console.log('  paragraphs using it  ' + out.proves.paragraphs + '  (' +
  pct(out.proves.paragraphs) + ' of the course)');
console.log('  occurrences          ' + out.proves.sentences);
console.log('\nrepeated paragraph openers');
topOpeners.slice(0, 15).forEach(function (e) {
  console.log('  ' + String(e.n).padStart(3) + '  ' + e.opener);
});
console.log('\nrepeated sentences (verbatim)');
topSentences.slice(0, 12).forEach(function (e) {
  console.log('  ' + String(e.n).padStart(3) + '  ' + e.sentence.slice(0, 96));
});
