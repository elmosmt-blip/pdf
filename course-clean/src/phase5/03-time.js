#!/usr/bin/env node
/* =========================================================================
 * 03-time.js — how long a lesson actually takes
 *
 * The minutes in assets/app.js were typed from a lesson plan before the text
 * existed. They are kept as the "planned" figure; this script computes the
 * "as written" figure so the two can be compared, and so adding 1,400 words of
 * takeaways and glossary does not silently make every lesson 10 minutes longer.
 *
 * The model, stated so it can be argued with. It is a self-study model, not a
 * reading-speed test:
 *   theory      120 words per minute. Technical prose read once, with the
 *               numbers checked on paper as they go by. A native reader skims
 *               at twice this; a learner taking notes at half.
 *   quiz        60 s per question — read four options, decide, read the
 *               explanation and reconcile it with the choice.
 *   calculation 2 min to read the task and attempt it, plus 40 s per step of
 *               the worked solution when it is revealed.
 *   consolidation  2 min for the takeaways, the common mistakes and the
 *               glossary terms at the end of the lesson.
 *   rounding    up to the next 5 min, floor 15.
 *
 * A lesson that the plan says 35 min and the text says 19 min is a finding, not
 * a rounding error: the plan is what the schedule was built on. The published
 * number is the computed one; the plan stays in this report as the earlier
 * claim, with the gap named.
 *
 * Usage:
 *   node src/phase5/03-time.js              # table + summary
 *   node src/phase5/03-time.js --json       # { lessonId: minutes }
 * ========================================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, readJson, LESSONS_PATH, words } = require('./lib');

const WPM = 120, QUIZ_S = 60, CALC_READ_MIN = 2, SOL_LINE_S = 40, CONSOLIDATE_MIN = 2;

/* The planned minutes used to live in assets/app.js as LESSON_MINUTES. Phase 5
 * moved the published number into the lesson record, and the plan table with
 * it, because app.js no longer carries a second copy of the same figure. The
 * plan is now read from the frozen snapshot kept beside this script, so the
 * comparison this report exists for still works. */
const plan = require('./plan-minutes.json');

const lessons = readJson(LESSONS_PATH);
const rows = [];
lessons.forEach(function (l) {
  /* A theory paragraph may be a string or an array of strings: the editorial
   * pass re-splits long paragraphs, so counting only the string form silently
   * under-reports the body by half. */
  const theory = l.content.theory.reduce(function (a, t) {
    if (!t) return a;
    const list = Array.isArray(t.p) ? t.p : (typeof t.p === 'string' ? [t.p] : []);
    return a + words(list.join(' ')).length;
  }, 0);
  const quiz = (l.quiz || []).length;
  const sol = String(l.content.calc.solution || '');
  const solLines = Math.max(1, sol.split(/(?=\bStep\s+[a-z0-9]+:)/i).length);
  const minutes = theory / WPM + quiz * QUIZ_S / 60 + CALC_READ_MIN +
    solLines * SOL_LINE_S / 60 + CONSOLIDATE_MIN;
  rows.push({
    lessonId: l.lessonId, plan: plan[l.lessonId], theory: theory, quiz: quiz,
    solutionLines: solLines, computed: Math.round(minutes * 10) / 10,
    rounded: Math.max(15, Math.ceil(minutes / 5) * 5)
  });
});

if (process.argv.includes('--json')) {
  const out = {};
  rows.forEach(function (r) { out[r.lessonId] = { plan: r.plan, computed: r.computed, minutes: r.rounded }; });
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

const planTotal = rows.reduce(function (a, r) { return a + (r.plan || 0); }, 0);
const compTotal = rows.reduce(function (a, r) { return a + r.computed; }, 0);
const over = rows.filter(function (r) { return r.plan && r.rounded > r.plan; });
const under = rows.filter(function (r) { return r.plan && r.rounded < r.plan; });

console.log('=== lesson time: plan vs text ===\n');
console.log('lessons           ' + rows.length);
console.log('planned total     ' + planTotal + ' min');
console.log('text total        ' + Math.round(compTotal) + ' min');
console.log('over the plan     ' + over.length + ' lessons');
console.log('under the plan    ' + under.length + ' lessons\n');

const byLesson = rows.slice().sort(function (a, b) { return (b.computed - b.plan) - (a.computed - a.plan); });
console.log('largest gaps (text − plan), minutes');
byLesson.slice(0, 10).forEach(function (r) {
  console.log('  ' + r.lessonId + '  plan ' + String(r.plan).padStart(2) + '  text ' +
    String(r.computed.toFixed(1)).padStart(5) + '  -> publish ' + r.rounded +
    '   (' + (r.rounded - r.plan > 0 ? '+' : '') + (r.rounded - r.plan) + ')');
});
console.log('\ntightest (text − plan), minutes');
byLesson.slice(-5).forEach(function (r) {
  console.log('  ' + r.lessonId + '  plan ' + String(r.plan).padStart(2) + '  text ' +
    String(r.computed.toFixed(1)).padStart(5) + '  -> publish ' + r.rounded +
    '   (' + (r.rounded - r.plan > 0 ? '+' : '') + (r.rounded - r.plan) + ')');
});
