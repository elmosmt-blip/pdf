#!/usr/bin/env node
/* Show one lesson's theory as compact, numbered paragraphs for editing.
 *
 *   node src/phase5/show.js m01l01          # one lesson
 *   node src/phase5/show.js m01l01 m01l03   # several
 *
 * Every paragraph prints as:  [index] (words) HEADING | text
 * The editor replies with a JSON file keyed by the same index, so a paragraph
 * cannot be edited twice or dropped by accident.
 */
'use strict';
const { LESSONS_PATH, readJson, words } = require('./lib');
const lessons = readJson(LESSONS_PATH);
const want = process.argv.slice(2);
if (!want.length) { console.log('usage: node src/phase5/show.js <lessonId> [...]'); process.exit(2); }
want.forEach(function (id) {
  const l = lessons.filter(function (x) { return x.lessonId === id; })[0];
  if (!l) { console.log('!! no lesson ' + id); return; }
  console.log('\n===== ' + l.lessonId + ' | ' + l.title);
  console.log('module ' + l.moduleId + ' | sources ' + (l.sources || []).join(' '));
  console.log('goals: ' + l.goals.map(function (g) { return g.text; }).join(' / '));
  l.content.theory.forEach(function (t, i) {
    if (!t || typeof t.p !== 'string' || !t.p.trim()) return;
    console.log('[' + i + '] (' + words(t.p).length + 'w) ' + (t.h || '') + ' :: ' + t.p);
  });
  console.log('CALC TASK :: ' + l.content.calc.task);
  console.log('DEFECT :: ' + l.content.defect.symptom);
});
