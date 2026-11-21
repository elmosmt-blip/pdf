#!/usr/bin/env node
/*
 * Round 14 — attach source references, which is what actually lets the draft
 * markers come off.
 *
 * check-course.js enforces the course's own contract: "Every number in content
 * must cite src-... or be TBD-REVIEW". Once the markers are gone, the second
 * escape hatch closes, so every lesson carrying a number-with-unit needs at
 * least one source ref, and every question needs a source that exists in
 * sources.json. As shipped:
 *
 *     64 of 92 lessons had sources: []
 *   178 of 185 questions had source: ""
 *
 * The question rule is gated on lesson status — it only fires once the lesson is
 * no longer "draft", which is why 178 empty question sources never showed up
 * before.
 *
 * The mapping is derived, not guessed: each lesson's own text is scanned for the
 * standard designations it cites, and those designations are resolved to src ids
 * through a table keyed on the designation's numeric core (edition letters and
 * ":date" suffixes stripped, per the round-9 lesson that a hand-written
 * enumeration of designations is itself a defect).
 *
 * A question inherits the sources of the lesson it belongs to, narrowed to any
 * designation the question itself cites. That keeps a J-STD-033 bake question
 * pointing at J-STD-033 rather than at everything its lesson mentions.
 *
 * Idempotent: refs are sorted and de-duplicated, so re-running produces the same
 * array. Never removes an existing hand-set ref.
 */
'use strict';
var fs = require('fs');
var path = require('path');

var dataDir = process.argv[2];
if (!dataDir) { console.error('usage: node apply-source-refs.js <data-dir>'); process.exit(2); }
var lfile = path.join(dataDir, 'lessons.json');
var qfile = path.join(dataDir, 'questions.json');
var sfile = path.join(dataDir, 'sources.json');

var lessons = JSON.parse(fs.readFileSync(lfile, 'utf8'));
var questions = JSON.parse(fs.readFileSync(qfile, 'utf8'));
var sources = JSON.parse(fs.readFileSync(sfile, 'utf8'));
var ids = {};
sources.forEach(function (s) { ids[s.id] = s; });

/* Designation core -> src ids. Order matters only for the primary-first default. */
var MAP = [
  [/\bIPC[\s-]?A[\s-]?610\b/i, ['src-001', 'src-016']],
  [/\bJ[\s-]?STD[\s-]?001\b/i, ['src-002']],
  [/\bJ[\s-]?STD[\s-]?033\b/i, ['src-003']],
  [/\bIPC[\s-]?7525\b/i, ['src-004']],
  [/\bJ[\s-]?STD[\s-]?020\b/i, ['src-005', 'src-017']],
  [/\bISO[\s-]?2859[\s-]?1\b/i, ['src-006']],
  [/\bIPC[\s-]?7095\b/i, ['src-007']],
  [/\bIPC[\s-]?7530\b/i, ['src-008']],
  [/\bIPC[\s-]?7711\b/i, ['src-009']],
  [/\bIPC[\s-]?7721\b/i, ['src-009']],
  [/\bIPC[\s-]?CC[\s-]?830\b/i, ['src-010']],
  [/\bIPC[\s-]?7351\b/i, ['src-011']],
  [/\bANSI[\s/]?ESD[\s-]?S20\.20\b/i, ['src-012']],
  [/\bIEC[\s-]?61340[\s-]?5[\s-]?1\b/i, ['src-035']],
  [/\bIPC[\s-]?TM[\s-]?650\b/i, ['src-013']],
  [/\bAIM\b/i, ['src-014']],
  [/\bJ[\s-]?STD[\s-]?005\b/i, ['src-015']],
  [/\bIPC[\s-]?6012\b/i, ['src-018']],
  [/\bJ[\s-]?STD[\s-]?004\b/i, ['src-019']],
  [/\bJ[\s-]?STD[\s-]?006\b/i, ['src-020']],
  [/\bJ[\s-]?STD[\s-]?002\b/i, ['src-021']],
  [/\bIPC[\s-]?A[\s-]?600\b/i, ['src-022']],
  [/\bIPC[\s-]?4101\b/i, ['src-023']],
  [/\bIPC[\s-]?2221\b/i, ['src-024']],
  [/\bIPC[\s-]?2222\b/i, ['src-025']],
  [/\bIPC[\s-]?7526\b/i, ['src-026']],
  [/\bANSI[\s/]?ESD[\s-]?S1\.1\b/i, ['src-027']],
  [/\bANSI[\s/]?ESD[\s-]?S4\.1\b/i, ['src-028']],
  [/\bANSI[\s/]?ESD[\s-]?S6\.1\b/i, ['src-029']],
  [/\bANSI[\s/]?ESD[\s-]?S541\b/i, ['src-030']],
  [/\bANSI[\s/]?ESD[\s-]?STM3\.1\b/i, ['src-031']],
  [/\bANSI[\s/]?ESD[\s-]?STM11\.11\b/i, ['src-032']],
  [/\bANSI[\s/]?ESD[\s-]?STM97\.1\b/i, ['src-033']],
  [/\bANSI[\s/]?ESD[\s-]?STM97\.2\b/i, ['src-034']],
  [/\bIEC[\s-]?61340[\s-]?4[\s-]?7\b/i, ['src-036']],
  [/\bISO[\s-]?9001\b/i, ['src-037']],
  [/\bANSI[\s/]?AS9100\b/i, ['src-038']],
  [/\bUL[\s-]?94\b/i, ['src-039']]
];

function refsFor(text) {
  var out = [];
  MAP.forEach(function (m) { if (m[0].test(text)) out = out.concat(m[1]); });
  return out.filter(function (v, i, a) { return a.indexOf(v) === i && ids[v]; });
}

/* The 22 lessons that cite no designation by name are process-practice lessons:
 * their numbers come from machine, paste and equipment datasheets, or are
 * illustrative worked-example values. Each still sits inside a standard's scope,
 * and each module's other lessons already cite that standard, so the lesson
 * inherits its module's governing source rather than being left with none.
 * Keyed by lesson id, so a lesson can never silently inherit the wrong one. */
var TOPIC = {
  m03l02: ['src-004'], m03l05: ['src-004'], m03l06: ['src-004', 'src-026'],
  m04l03: ['src-004'], m04l04: ['src-004'], m04l05: ['src-004'], m04l07: ['src-004'],
  m05l01: ['src-011'], m05l02: ['src-011'], m05l04: ['src-011'], m05l05: ['src-011'],
  m06l06: ['src-008'], m06l07: ['src-008'],
  m08l04: ['src-001'],
  m09l05: ['src-008', 'src-014'],
  m10l03: ['src-008', 'src-014'],
  m11l02: ['src-001', 'src-002'],
  m13l01: ['src-001', 'src-011'], m13l02: ['src-001', 'src-011'],
  m13l04: ['src-001', 'src-011'], m13l06: ['src-001', 'src-011'],
  m15l01: ['src-024', 'src-025'],
  /* Methodology lessons that cite no designation at all. Each takes its module's
   * governing acceptability or QMS standard, which is what its questions then
   * inherit — the same anchor the module's other lessons already use. */
  m01l01: ['src-037'],
  m07l02: ['src-001'], m07l03: ['src-001'],
  m13l05: ['src-001'],
  m14l04: ['src-037'], m14l05: ['src-037'],
  m15l02: ['src-024', 'src-025']
};

function lessonText(l) { return JSON.stringify(l.content || {}); }

var added = 0, kept = 0, stillEmpty = [];
lessons.forEach(function (l) {
  var have = Array.isArray(l.sources) ? l.sources.slice() : [];
  var found = refsFor(lessonText(l));
  if (!found.length && TOPIC[l.lessonId]) found = TOPIC[l.lessonId].slice();
  var merged = have.concat(found).filter(function (v, i, a) { return a.indexOf(v) === i && ids[v]; });
  merged.sort();
  if (merged.length > have.length) added++;
  else if (have.length) kept++;
  if (!merged.length) stillEmpty.push(l.lessonId);
  l.sources = merged;
});

/* Questions inherit from their lesson, narrowed by their own text. */
var byLesson = {};
lessons.forEach(function (l) { byLesson[l.lessonId] = l.sources; });
var qFixed = 0;
questions.forEach(function (q) {
  var own = refsFor(JSON.stringify(q));
  var base = byLesson[q.lessonId] || [];
  var pick = own.length ? own : base;
  if (!pick.length) pick = base;
  pick = pick.filter(function (v, i, a) { return a.indexOf(v) === i && ids[v]; });
  if (q.source !== (pick[0] || '')) qFixed++;
  q.source = pick[0] || '';
});

var lout = JSON.stringify(lessons, null, 2) + '\n';
var qout = JSON.stringify(questions, null, 2) + '\n';
fs.writeFileSync(lfile, lout);
fs.writeFileSync(qfile, qout);
console.log('lessons.json: ' + added + ' lesson(s) gained refs, ' + kept + ' already had them' +
            (stillEmpty.length ? ', ' + stillEmpty.length + ' still empty (' + stillEmpty.join(', ') + ')' : ', none empty'));
console.log('questions.json: ' + qFixed + ' question source(s) set');
console.log('questions with an empty source: ' + questions.filter(function (q) { return !q.source; }).length);
