#!/usr/bin/env node
/*
 * Round 11, defect D7 — IPC-7711/7721 quoted for figures it does not carry.
 *
 * m11l04 attributes three numbers to IPC-7711/7721:
 *
 *   - conductor width reduction shall not exceed 20 % of original width
 *   - minimum annular ring 0.05 mm on a repaired hole
 *   - laminate damage depth limit 0.25 mm
 *
 * None of the three is an IPC-7711/7721 figure.
 *
 *   20 %  — IPC-A-600 §3.5.3.1 (and IPC-6012): "Allowable reduction of the
 *           minimum conductor width (specified or derived) due to
 *           misregistration or isolated defects ... shall not exceed 20 % of
 *           the minimum conductor width". IPC-7711/7721's own conductor-repair
 *           procedures only require that "conductor widths, spacing and
 *           current carrying capacity must not be reduced below allowable
 *           tolerances" — they defer to the drawing and to IPC-A-600, they do
 *           not set the number. EPTAC's IPC-A-600 webinar deck and AtlasPCB's
 *           class table both put the 20 % / 10 % split on the bare-board
 *           standards.
 *
 *   0.05 mm — IPC-A-600 §2.10.3: "Acceptable – Class 3: holes are not centred
 *           in the lands, but the annular ring measures 0.050 mm [0.0020 in] or
 *           more", with up to 20 % local reduction for pits, dents, nicks,
 *           pinholes or splay. Same split appears in IPC-6012 and IPC-7351.
 *
 *   0.25 mm — does not exist. The only 0.25 mm anywhere in IPC-7721 is the
 *           width of a milled channel for a foil jumper beside a BGA pad
 *           ("tight spacing may restrict the width of the channel to 0.25 mm
 *           [0.010 in] or less"). There is no laminate-damage depth limit in
 *           IPC-7721, and calling a number "commonly cited" when it is not
 *           cited anywhere is how a fabricated figure enters a course.
 *
 * The mis-attribution matters for the same reason the barrel-fill one did: a
 * reader who checks IPC-7711/7721 and does not find the figure concludes the
 * standard is wrong, when in fact they are reading the wrong document.
 *
 * IPC-7711/7721 remains the right document for what it does carry — the
 * procedures, the heat and force limits, the cure times, the inspection
 * checkpoints, and the requirement that the finished repair meet the class
 * criteria. Those claims are untouched.
 *
 * Idempotent: matched whole, second run finds nothing to do.
 */
'use strict';
var fs = require('fs');
var path = require('path');

var dataDir = process.argv[2];
if (!dataDir) { console.error('usage: node apply-repair-limits-fix.js <data-dir>'); process.exit(2); }
var file = path.join(dataDir, 'lessons.json');
var qfile = path.join(dataDir, 'questions.json');
var raw = fs.readFileSync(file, 'utf8');
var qraw = fs.readFileSync(qfile, 'utf8');
var data = JSON.parse(raw);
var questions = JSON.parse(qraw);
var n = 0;

function replaceIn(lesson, field, from, to) {
  var obj = lesson;
  var parts = field.split('.');
  for (var i = 0; i < parts.length - 1; i++) {
    obj = obj && obj[parts[i]];
    if (!obj) return false;
  }
  var key = parts[parts.length - 1];
  if (typeof obj[key] !== 'string') return false;
  if (obj[key].indexOf(from) === -1) return false;
  obj[key] = obj[key].replace(from, to);
  return true;
}

data.forEach(function (lesson) {
  if (lesson.lessonId !== 'm11l04') return;

  // theory[3] — conductor width reduction: the 20 % belongs to IPC-A-600.
  n += replaceIn(lesson, 'content.theory.3.p',
    'IPC-7711/7721 expresses the repair limit as a percentage of original width; ' +
    'a commonly used limit is that conductor width reduction shall not exceed 20% ' +
    'of original width, but the controlled revision and customer specification ' +
    'must be verified.',
    'IPC-7711/7721 does not set the number itself: its conductor-repair procedures ' +
    'require only that conductor width, spacing and current-carrying capacity are ' +
    'not reduced below the allowable tolerances, and leave the limit to the drawing ' +
    'and to the bare-board standards. The figure comes from IPC-A-600 §3.5.3.1, ' +
    'which caps the reduction of the minimum conductor width at 20 % for Class 2 ' +
    'and 10 % for Class 3; the controlled revision and the customer specification ' +
    'must still be verified.') ? 1 : 0;
  n += replaceIn(lesson, 'content.theory.3.p',
    'If the reduction exceeds the applicable IPC-7711/7721 limit, the repair is not ' +
    'acceptable unless the customer authorizes a deviation.',
    'If the reduction exceeds the applicable IPC-A-600 limit for the class, the ' +
    'repair is not acceptable unless the customer authorizes a deviation.') ? 1 : 0;

  // theory[4] — annular ring: the 0.05 mm belongs to IPC-A-600.
  n += replaceIn(lesson, 'content.theory.4.p',
    'IPC-7711/7721 requires the repaired hole to retain a minimum annular ring; ' +
    'a commonly cited minimum is 0.05 mm, but the controlled revision and product ' +
    'specification must be checked.',
    'IPC-7711/7721 requires the repaired hole to retain the annular ring the class ' +
    'calls for, but the number comes from IPC-A-600 §2.10.3: 0.050 mm [0.0020 in] ' +
    'minimum external annular ring at Class 3, with up to 20 % local reduction for ' +
    'pits, dents, nicks, pinholes or splay. The controlled revision and product ' +
    'specification must still be checked.') ? 1 : 0;
  n += replaceIn(lesson, 'content.theory.4.p',
    'If the measured annular ring is below the applicable IPC-7711/7721 limit, the ' +
    'hole is normally scrap unless a qualified repair restores the required copper ' +
    'geometry.',
    'If the measured annular ring is below the applicable IPC-A-600 limit for the ' +
    'class, the hole is normally scrap unless a qualified repair restores the ' +
    'required copper geometry.') ? 1 : 0;

  // theory[5] — laminate depth: the figure does not exist.
  n += replaceIn(lesson, 'content.theory.5.p',
    'Where a laminate damage depth limit is specified, use the controlled ' +
    'IPC-7711/7721 revision and the customer specification; a commonly cited depth ' +
    'limit is 0.25 mm, but this must be verified.',
    'IPC-7721 sets no laminate-damage depth limit. Its laminate-repair procedures ' +
    '(epoxy and film-adhesive methods) are judged on the condition they restore: ' +
    'insulation and electrical clearance maintained, no epoxy in the hole or on the ' +
    'internal pad walls, no reduction in hole diameter, and no exposed adjacent ' +
    'circuitry. Where a depth limit is needed, take it from the controlled ' +
    'IPC-A-600 or IPC-6012 revision and the customer specification, not from ' +
    'IPC-7721.') ? 1 : 0;

  // calc.solution — same attribution, inside the worked example.
  n += replaceIn(lesson, 'content.calc.solution',
    '0.06 mm is greater than the commonly cited IPC-7711/7721 minimum of 0.05 mm, so ' +
    'the hole is acceptable if the controlled revision confirms 0.05 mm for Class 2.',
    '0.06 mm is greater than the IPC-A-600 §2.10.3 Class 3 minimum of 0.050 mm, so ' +
    'the hole is acceptable if the controlled revision confirms that minimum for ' +
    'the class.') ? 1 : 0;

  // calc.solution Step 3 — the conductor limit is IPC-A-600's, not 7711/7721's.
  n += replaceIn(lesson, 'content.calc.solution',
    'Step 3: Compare with the IPC-7711/7721 conductor width reduction limit. If the ' +
    'applicable IPC-7711/7721 limit is 20%, the trace is at the limit and acceptable ' +
    'only if the controlled revision and customer specification allow 20% for Class 2.',
    'Step 3: Compare with the IPC-A-600 §3.5.3.1 conductor width reduction limit for ' +
    'Class 2, which is 20% of the minimum conductor width. The trace is exactly at ' +
    'the limit and acceptable only if the controlled revision and customer ' +
    'specification allow 20% for Class 2.') ? 1 : 0;

  // calc.solution Step 5 — the 0.25 mm depth limit does not exist, so the
  // worked example cannot compare against it. The measured depth is kept as a
  // recorded value; the disposition rests on the prohibited conditions instead.
  n += replaceIn(lesson, 'content.calc.solution',
    'Step 5: Evaluate laminate damage: the scratch is 0.08 mm deep, which is less ' +
    'than the commonly cited IPC-7711/7721 laminate damage depth limit of 0.25 mm, ' +
    'and there is no delamination, blistering, separation, or exposed conductor.',
    'Step 5: Evaluate laminate damage: the scratch is 0.08 mm deep with no ' +
    'delamination, blistering, separation or exposed conductor, so no prohibited ' +
    'condition exists. IPC-7721 sets no depth limit; a shallow cosmetic scratch is ' +
    'repairable if a qualified repair restores insulation and electrical clearance.') ? 1 : 0;

  n += replaceIn(lesson, 'content.calc.solution',
    'Basis: IPC-7711/7721 Class 2 conductor width reduction at or below the ' +
    'applicable limit, annular ring above the applicable minimum, and laminate ' +
    'damage without prohibited defects.',
    'Basis: conductor width reduction at the IPC-A-600 §3.5.3.1 Class 2 limit of ' +
    '20%, annular ring above the IPC-A-600 §2.10.3 minimum, and laminate damage ' +
    'without prohibited defects.') ? 1 : 0;

  // defect.action — the limits being checked against are IPC-A-600's.
  n += replaceIn(lesson, 'content.defect.action',
    'Measure the annular ring and trace width, compare them with the applicable ' +
    'IPC-7711/7721 class limits, and record the result. If the annular ring or ' +
    'conductor width reduction is outside the IPC-7711/7721 limit, scrap the ' +
    'assembly or request a customer deviation.',
    'Measure the annular ring and trace width, compare them with the applicable ' +
    'IPC-A-600 class limits, and record the result. If the annular ring or ' +
    'conductor width reduction is outside the IPC-A-600 limit, scrap the assembly ' +
    'or request a customer deviation.') ? 1 : 0;
});

// The two quiz prompts attribute the numbers to the wrong documents as well:
// q-m11l04-02 says IPC-A-610, and the 0.05 mm Class 3 external annular ring
// criterion is IPC-A-600 / IPC-6012 (bare board), not the assembly standard.
// That is the same mis-attribution the barrel-fill question turned on.
questions.forEach(function (q) {
  if (q.lessonId !== 'm11l04') return;
  n += replaceIn(q, 'prompt',
    'where the annular ring still meets IPC-7711/7721 Class 3 minimum',
    'where the annular ring still meets the IPC-A-600 Class 3 minimum') ? 1 : 0;
  n += replaceIn(q, 'prompt',
    'requires the repaired annular ring to meet the IPC-A-610 Class 3 minimum of ' +
    '0.05 mm',
    'requires the repaired annular ring to meet the IPC-A-600 Class 3 minimum of ' +
    '0.05 mm') ? 1 : 0;
});

var out = JSON.stringify(data, null, 2) + '\n';
var qout = JSON.stringify(questions, null, 2) + '\n';
if (out === raw && qout === qraw) {
  console.log('lessons.json: no change');
  console.log('questions.json: no change');
} else {
  if (out !== raw) fs.writeFileSync(file, out);
  if (qout !== qraw) fs.writeFileSync(qfile, qout);
  console.log('lessons.json + questions.json: ' + n + ' repair-limit correction(s) applied');
}
