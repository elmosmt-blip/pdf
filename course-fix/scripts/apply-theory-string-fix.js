#!/usr/bin/env node
/**
 * apply-theory-string-fix.js — stop m07l06 from silently dropping 4,318
 * characters of its own theory text.
 *
 * WHY THIS EXISTS
 * ---------------
 * A theory section is documented as an object: `{h, p, blocks}`, where `p` is
 * a string or an array of strings and `blocks` is an array of app blocks.
 *
 * m07l06 ("Classification drill: print, placement, reflow and THT images")
 * does not follow that. Its `content.theory` is:
 *
 *     [ {blocks:[…]}, "In an AOI classification drill, …",
 *                     "Classify the defect by the physical condition, …",
 *                     "For print defects, …", … 7 strings in total ]
 *
 * theory[0] is a proper section; theory[1..7] are bare paragraph strings.
 *
 * theoryHtml() only ever looks at `t.h`, `t.blocks` and `t.p`. For a string
 * entry all three are `undefined`, so the loop body does nothing and the
 * entry vanishes. Nothing errors, nothing warns, check-course.js passes, and
 * the page renders — it just renders without seven paragraphs of the lesson.
 *
 * Those seven paragraphs are not padding: they are the drill itself, the
 * classification vocabulary, the per-stage inspection method, and the
 * disposition record format. The lesson teaches an AOI classification drill
 * and never tells the reader how to classify anything.
 *
 * WHAT THIS DOES
 * --------------
 *  1. normalises the data — each bare string becomes `{p: <string>}`, which is
 *     the documented shape, so every other tool that walks `theory` sees the
 *     content instead of skipping it
 *  2. hardens theoryHtml() so a bare string renders as a paragraph rather than
 *     disappearing. This is the part that matters: the data fix repairs today's
 *     lesson, the renderer fix means the next string entry cannot fail
 *     silently the same way
 *
 * Idempotent: the data pass is guarded on the entry still being a string, and
 * the app.js pass is guarded on the old code still being present.
 *
 * Usage: node apply-theory-string-fix.js <dir-containing-data-and-assets>
 */

'use strict';

var fs = require('fs');
var path = require('path');

var dir = process.argv[2] || '.';
var DATA = path.join(dir, 'data');
var APP = path.join(dir, 'assets', 'app.js');

/* ---------------------------------------------------------------- 1. data */
var lp = path.join(DATA, 'lessons.json');
var lessons = JSON.parse(fs.readFileSync(lp, 'utf8'));

var fixed = 0, chars = 0, ids = [];
lessons.forEach(function (l) {
  var th = l.content && Array.isArray(l.content.theory) ? l.content.theory : null;
  if (!th) return;
  var hit = false;
  for (var i = 0; i < th.length; i++) {
    if (typeof th[i] === 'string' && th[i].trim().length) {
      chars += th[i].length;
      th[i] = { p: th[i] };
      hit = true;
    }
  }
  if (hit) { fixed++; ids.push(l.lessonId + ' (' + th.length + ' sections)'); }
});

if (fixed) {
  fs.writeFileSync(lp, JSON.stringify(lessons, null, 2) + '\n');
  console.log('  ok lessons.json: ' + fixed + ' lesson(s) normalised, ' + chars + ' chars restored');
  ids.forEach(function (s) { console.log('       ' + s); });
} else {
  console.log('  -- lessons.json: no string theory entries left');
}

/* --------------------------------------------------------------- 2. app.js */
var OLD =
  "    theory.forEach(function (t) {\n" +
  "      if (!t) return;\n" +
  "      if (t.h) html += '<h3>' + esc(t.h) + '</h3>';\n";

var NEW =
  "    theory.forEach(function (t) {\n" +
  "      if (!t) return;\n" +
  "      // A theory entry may be a bare paragraph string. Rendering it as a\n" +
  "      // paragraph is deliberate: the alternative is that it silently\n" +
  "      // disappears, which is exactly what happened to m07l06.\n" +
  "      if (typeof t === 'string') { html += '<p>' + esc(t) + '</p>'; return; }\n" +
  "      if (t.h) html += '<h3>' + esc(t.h) + '</h3>';\n";

var app = fs.readFileSync(APP, 'utf8');
var n = app.split(OLD).length - 1;
if (n === 0) {
  console.log('  -- app.js: theoryHtml already handles a bare string');
} else if (n > 1) {
  console.error('  !! app.js: ' + n + ' matches for the theory.forEach prologue, expected 1');
  process.exit(1);
} else {
  fs.writeFileSync(APP, app.replace(OLD, NEW));
  console.log('  ok app.js: theoryHtml renders a bare string theory entry');
}

/* ------------------------------------------------------------- 3. verify */
var bad = [];
var after = JSON.parse(fs.readFileSync(lp, 'utf8'));
after.forEach(function (l) {
  var th = l.content && Array.isArray(l.content.theory) ? l.content.theory : [];
  th.forEach(function (s, i) {
    if (typeof s === 'string' && s.trim().length) {
      bad.push(l.lessonId + ' theory[' + i + '] is still a string');
    }
  });
});
if (bad.length) {
  console.error('  !! string theory entries remain:');
  bad.forEach(function (b) { console.error('     ' + b); });
  process.exit(1);
}
console.log('  ok no string theory entries remain');
