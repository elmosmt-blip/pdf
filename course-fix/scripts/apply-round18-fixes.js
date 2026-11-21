#!/usr/bin/env node
/**
 * apply-round18-fixes.js — three defects found by the per-lesson review.
 *
 * D16  Two quiz prompts attribute a formula to their lessons that the lessons
 *      never contain, and the formula measures a different quantity from the
 *      one the acceptance criterion is expressed in.
 *
 *      m09l06 teaches fill fraction = fill height / board thickness and works
 *      it as 1.1 mm / 1.6 mm = 68.75%. q-m09l06-02 said "the lesson rule of
 *      thumb that expected fill fraction = 1 − (lead diameter / hole
 *      diameter)²" and, with hole = 2 × lead, got exactly 75% — then accepted
 *      the joint against "the IPC-A-610 minimum of 75% of barrel height".
 *
 *      That is a dimension error, and it is the fourth of its kind in this
 *      course. The formula yields the annular *cross-sectional area* available
 *      to solder; IPC-A-610 judges *vertical* barrel fill. The two are never
 *      compared. Worse, the 75% is not physics but arithmetic arranged to land
 *      on the threshold: choosing hole = 2 × lead makes 1 − (1/2)² equal the
 *      acceptance limit exactly. A student who learns "expected fill =
 *      1 − (d_L/d_h)², compare to 75%" will read a geometric capacity as an
 *      inspection result.
 *
 *      q-m08l05-02 made the same claim against m08l05, whose lesson computes
 *      expected fill volume as 90% of the annular volume.
 *
 *      Both quizzes are rewritten to use the definition their lesson actually
 *      teaches, and both keep the area formula as an explicitly labelled
 *      capacity that is *not* compared with the limit — so the distinction is
 *      taught rather than merely avoided. m07l04's own quiz already does this
 *      correctly (fill height / hole depth, 66.7% < 75%, reject), which is what
 *      confirmed these two were the outliers.
 *
 * D17  m06l03's worked solution computes the coolest-site margin above liquidus
 *      as 238 − 219 = 19 °C, then its own interpretation sentence said 21 °C.
 *      21 °C is the margin above *solidus* (238 − 217). The lesson and the quiz
 *      both use liquidus; only this one sentence had drifted.
 *
 * D18  m08l05's worked solution printed rounded intermediates and then
 *      subtracted them: 1.02 − 0.31 = 0.70. The stated 0.70 is the correctly
 *      rounded true difference (0.7037), but a student following the printed
 *      numbers gets 0.71. On a calculation-drill lesson the arithmetic has to
 *      reproduce. Carrying one more decimal fixes it: 1.018 − 0.314 = 0.704.
 *
 * The data files are pretty-printed with two-space indent and a trailing
 * newline, and the option objects are written one key per line:
 *
 *       {
 *         "id": "a",
 *         "text": "…"
 *       },
 *
 * so the needles below are multi-line to match. `patch()` asserts exactly one
 * match before writing, so a formatting change fails loudly rather than
 * silently doing nothing — which is how the first version of this script
 * "succeeded" while leaving all four options untouched.
 *
 * Idempotent: every substitution is guarded on the presence of its old text.
 *
 * Usage: node apply-round18-fixes.js <dir-containing-data>
 */
'use strict';

var fs = require('fs');
var path = require('path');

var dir = process.argv[2] || '.';
var lp = path.join(dir, 'data', 'lessons.json');
var qp = path.join(dir, 'data', 'questions.json');

function patch(file, label, oldText, newText) {
  var s = fs.readFileSync(file, 'utf8');
  var n = s.split(oldText).length - 1;
  if (n === 0) { console.log('  -- ' + label + ': already applied'); return; }
  if (n > 1) { console.error('  !! ' + label + ': ' + n + ' matches, expected 1'); process.exit(1); }
  fs.writeFileSync(file, s.replace(oldText, newText));
  console.log('  ok ' + label);
}

/* ---------------------------------------------------------------- D17 */
patch(lp, 'D17 m06l03 margin above liquidus',
  'Interpretation: the coolest site is above liquidus by 21 °C,',
  'Interpretation: the coolest site is above liquidus by 19 °C,');

/* ---------------------------------------------------------------- D18 */
patch(lp, 'D18 m08l05 rounded intermediates',
  'Nominal hole volume: pi * 0.45 * 0.45 * 1.60 = 1.02 cubic millimetres. ' +
  'Nominal lead volume: pi * 0.25 * 0.25 * 1.60 = 0.31 cubic millimetres. ' +
  'Nominal annular volume: 1.02 - 0.31 = 0.70 cubic millimetres. ' +
  'Expected fill volume at 90% target: 90% of 0.70 = 0.63 cubic millimetres.',
  'Nominal hole volume: pi * 0.45 * 0.45 * 1.60 = 1.018 cubic millimetres. ' +
  'Nominal lead volume: pi * 0.25 * 0.25 * 1.60 = 0.314 cubic millimetres. ' +
  'Nominal annular volume: 1.018 - 0.314 = 0.704, which rounds to 0.70 cubic ' +
  'millimetres. Expected fill volume at 90% target: 90% of 0.704 = 0.63 cubic ' +
  'millimetres.');

/* ---------------------------------------------------------------- D16 */
/* ---- q-m09l06-02 ---- */
patch(qp, 'D16 q-m09l06-02 prompt',
  'A through-hole wave-soldering process uses the lesson rule of thumb that expected fill fraction = 1 − (lead diameter / hole diameter)². If the hole diameter is twice the lead diameter and the required fill is the IPC-A-610 minimum of 75% of barrel height, what is the expected fill fraction and the disposition?',
  'A wave-soldered through-hole has a board thickness of 1.6 mm and the solder column reaches 1.3 mm from the primary side. Using the lesson formula fill fraction = fill height / board thickness, and comparing with the IPC-A-610 minimum vertical barrel fill of 75%, what is the fill fraction and the disposition?');

patch(qp, 'D16 q-m09l06-02 option a',
  '        "text": "75%; accept, because the calculated fill meets the minimum."',
  '        "text": "81.25%; accept, because the calculated vertical fill meets the IPC-A-610 minimum."');

patch(qp, 'D16 q-m09l06-02 option b',
  '        "text": "50%; reject, because the fill is below the minimum."',
  '        "text": "68.75%; reject, because it is below the minimum."');

patch(qp, 'D16 q-m09l06-02 option c',
  '        "text": "25%; reject, because the fill is below the minimum."',
  '        "text": "81.25%; reject, because the annular area fraction is the quantity that is judged."');

patch(qp, 'D16 q-m09l06-02 option d',
  '        "text": "100%; accept, because the lead is centred in the hole."',
  '        "text": "43.75%; reject, because the lead occupies more than half of the hole area."');

patch(qp, 'D16 q-m09l06-02 explanation',
  'Expected fill = 1 − (1/2)² = 1 − 0.25 = 0.75 = 75%, which meets the IPC-A-610 minimum vertical barrel fill of 75% for Class 2 and Class 3, so the disposition is accept when the other workmanship criteria are met. Option b uses linear clearance instead of area, option c is the lead-area fraction, and option d ignores the lead volume. IPC-A-610 does not set a 100% class limit; a 100% requirement is contractual.',
  'Fill fraction is measured vertically: fill height divided by board thickness, so 1.3 mm / 1.6 mm = 0.8125 = 81.25%, which is above the 75% minimum vertical barrel fill that IPC-A-610 sets for both Class 2 and Class 3. The disposition is accept when the other workmanship criteria are met. Option b is the height ratio for a 1.1 mm column — the lesson\u2019s own worked example, not this one. Option c confuses vertical fill with annular area capacity, which is a geometric property of the hole and lead and is never compared with the acceptance limit. Option d is that capacity for a lead three-quarters of the hole diameter. IPC-A-610 does not set a 100% class limit; a 100% requirement is contractual.');

/* ---- q-m08l05-02 ---- */
patch(qp, 'D16 q-m08l05-02 prompt',
  'Using the lesson formula for expected solder fill, calculate the expected solder fill percentage when a rule of thumb sets the lead diameter at three-quarters of the plated-hole diameter.',
  'A through-hole joint has a lead diameter equal to three-quarters of the plated-hole diameter. The annular cross-section available to solder is the hole area minus the lead area. What fraction of the hole cross-section can solder occupy, and how should that fraction be used?');

patch(qp, 'D16 q-m08l05-02 option a',
  '        "text": "43.75%"',
  '        "text": "43.75%; it is the annular capacity, a geometric property of the hole and lead — it is not an inspection result and is not compared with the IPC-A-610 vertical fill minimum."');

patch(qp, 'D16 q-m08l05-02 option b',
  '        "text": "25.00%"',
  '        "text": "43.75%; it is the expected vertical barrel fill, so it must be compared with the IPC-A-610 75% minimum and the joint rejected."');

patch(qp, 'D16 q-m08l05-02 option c',
  '        "text": "50.00%"',
  '        "text": "56.25%; it is the expected vertical barrel fill, so it must be compared with the IPC-A-610 75% minimum and the joint rejected."');

patch(qp, 'D16 q-m08l05-02 option d',
  '        "text": "75.00%"',
  '        "text": "75.00%; it is the expected vertical barrel fill, so it meets the IPC-A-610 minimum and the joint is accepted."');

patch(qp, 'D16 q-m08l05-02 explanation',
  'Expected fill equals the hole area minus the lead area divided by the hole area, or one minus the square of the lead-to-hole diameter ratio. With a lead-to-hole ratio of three-quarters, the calculation is one minus three-quarters squared, which is one minus nine-sixteenths, or seven-sixteenths, equal to 43.75%. The other options confuse diameter clearance with area fill or use the lead fraction directly.',
  'The annulus occupies 1 − (0.75)² = 1 − 0.5625 = 0.4375, so solder can occupy 43.75% of the hole cross-section. That number is a geometric capacity: it depends only on the hole and lead diameters and says nothing about how far up the barrel the solder actually climbed. IPC-A-610 judges vertical barrel fill — fill height against board or barrel height — so the two are never compared. Option b makes exactly that category error, option c takes the lead\u2019s own area fraction and then makes it too, and option d is the coincidence of choosing the diameters so the area fraction equals the acceptance limit. A 100% requirement is contractual, not an IPC-A-610 class limit.');

/* An earlier run wrote the escape sequence literally instead of the character. */
patch(qp, 'D16 literal \\u2019 in explanations',
  'lesson\\u2019s',
  'lesson\u2019s');

/* ---------------------------------------------------------------- verify */
var Q = JSON.parse(fs.readFileSync(qp, 'utf8'));
var L = JSON.parse(fs.readFileSync(lp, 'utf8'));
var bad = [];
Q.forEach(function (q) {
  var t = q.prompt + ' ' + q.explanation;
  if (/1 − \(lead diameter \/ hole diameter\)²/.test(t)) bad.push(q.questionId + ' still uses the area formula');
  if (/expected fill fraction = 1 −/.test(t)) bad.push(q.questionId + ' still uses the area formula');
  if (/\\u2019/.test(t)) bad.push(q.questionId + ' still has a literal \\u2019');
  var corr = (q.options || []).filter(function (o) { return o.id === q.correct; })[0];
  if (!corr) bad.push(q.questionId + ' has no option for its answer key');
});
L.forEach(function (l) {
  var s = (l.content.calc && l.content.calc.solution) || '';
  if (/above liquidus by 21 °C/.test(s)) bad.push(l.lessonId + ' still says 21 °C');
  if (/1\.02 - 0\.31 = 0\.70/.test(s)) bad.push(l.lessonId + ' still subtracts rounded intermediates');
});
if (bad.length) {
  console.error('  !! problems remain:');
  bad.forEach(function (b) { console.error('     ' + b); });
  process.exit(1);
}
console.log('  ok no area-formula prompts, no 21 °C margin, no rounded subtraction');
