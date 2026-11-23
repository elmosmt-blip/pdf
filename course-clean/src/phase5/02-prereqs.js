#!/usr/bin/env node
/* =========================================================================
 * 02-prereqs.js — decide each lesson's prerequisites from the curriculum graph
 *
 * A prerequisite is not a matter of taste once the curriculum is fixed: the
 * module graph in data/curriculum is already declared (m04 needs m03, m06 needs
 * m04, and so on), and inside a module the lessons are ordered. So the rule is:
 *
 *   - the previous lesson in the same module, when it exists;
 *   - plus, for the FIRST lesson of a module, the last lesson of every module
 *     the curriculum declares as a prerequisite;
 *   - plus the specific lessons a lesson actually leans on, named by hand in
 *     `extra` below and justified in the report, never invented by a script.
 *
 * The declared module graph is read from assets/app.js (the MODULES literal is
 * the only place it exists) so this file cannot drift from what the site shows.
 *
 * Usage:
 *   node src/phase5/02-prereqs.js --dry     # print the graph
 * ========================================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, readJson, LESSONS_PATH } = require('./lib');

const app = fs.readFileSync(path.join(ROOT, 'assets', 'app.js'), 'utf8');
const MODULES = [];
app.replace(/\{ id: '(m\d\d)'[^}]*?prereq: '([^']*)'/g, function (_, id, prereq) {
  MODULES.push({ id: id, prereq: prereq === '—' ? [] : prereq.split(/,\s*/) });
  return _;
});
if (MODULES.length !== 15) throw new Error('expected 15 modules, read ' + MODULES.length);

const lessons = readJson(LESSONS_PATH);
const byModule = {};
lessons.forEach(function (l) { (byModule[l.moduleId] = byModule[l.moduleId] || []).push(l.lessonId); });
const lastOf = function (m) {
  const ids = byModule[m];
  return ids ? ids[ids.length - 1] : null;
};

/* Lessons that lean on one specific earlier lesson that is neither the previous
 * lesson nor a module head. Each entry carries the reason; a bare entry would be
 * an opinion the report cannot defend. */
const EXTRA = {
  'm04l02': [['m03l02', 'SPI volume percentages are shares of a nominal the aperture geometry sets, so the area-ratio arithmetic comes first.']],
  'm04l05': [['m04l02', 'The capability numbers read out of SPI are computed here on top of the reading rules there.']],
  'm06l05': [['m03l05', 'The profile that fixes a paste defect is chosen against the same release indicators the stencil sheet uses.']],
  'm07l04': [['m06l07', 'The X-ray sample is drawn from the profile that was qualified, so the qualification step precedes it.']],
  'm09l06': [['m08l05', 'The fill fractions the wave case judges are computed in the THT fill drill.']],
  'm11l04': [['m06l02', 'The hand-solder width limit is read against the same acceptance class the reflow decisions use.']],
  'm12l03': [['m06l07', 'Ionic contamination is judged against a process that was already qualified, not a profile in flux.']],
  'm13l04': [['m07l02', 'The escape model is built from the AOI false-call and escape rates measured there.']],
  'm14l02': [['m13l04', 'Pareto of the escapes needs the escape model as its denominator.']],
  'm15l02': [['m14l03', 'The design ask is priced from the containment and quarantine costs the 8D walk recorded.']]
};

const out = {};
lessons.forEach(function (l) {
  const idx = lessons.findIndex(function (x) { return x.lessonId === l.lessonId; });
  const before = lessons.slice(0, idx).map(function (x) { return x.lessonId; });
  const ids = [];
  const push = function (id) {
    if (id && before.indexOf(id) >= 0 && ids.indexOf(id) === -1) ids.push(id);
  };
  const inModule = byModule[l.moduleId] || [];
  const pos = inModule.indexOf(l.lessonId);
  if (pos > 0) push(inModule[pos - 1]);
  else MODULES.filter(function (m) { return m.id === l.moduleId; })[0].prereq
    .forEach(function (m) { push(lastOf(m)); });
  (EXTRA[l.lessonId] || []).forEach(function (pair) { push(pair[0]); });
  out[l.lessonId] = ids;
});

const skills = {};
lessons.forEach(function (l) {
  /* What a learner must already be able to do. It is derived from the module
   * the course itself says comes first, not invented per lesson. */
  out[l.lessonId].forEach(function (id) {
    const src = lessons.filter(function (x) { return x.lessonId === id; })[0];
    (skills[l.lessonId] = skills[l.lessonId] || []).push('Lesson ' + id + ': ' + src.title);
  });
});

const empty = Object.keys(out).filter(function (k) { return !out[k].length; });
console.log('lessons with no prerequisite: ' + empty.length + (empty.length ? ' — ' + empty.join(', ') : ''));
console.log('edges: ' + Object.keys(out).reduce(function (a, k) { return a + out[k].length; }, 0));
const fan = {};
Object.keys(out).forEach(function (k) { out[k].forEach(function (id) { fan[id] = (fan[id] || 0) + 1; }); });
console.log('most required lessons:');
Object.keys(fan).sort(function (a, b) { return fan[b] - fan[a]; }).slice(0, 8)
  .forEach(function (id) { console.log('  ' + fan[id] + '  ' + id); });
fs.writeFileSync(path.join(__dirname, 'prereqs.json'), JSON.stringify(out, null, 2) + '\n');
console.log('wrote src/phase5/prereqs.json');
