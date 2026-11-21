#!/usr/bin/env node
/* =========================================================================
 * fix-conflicts.js — the three numeric conflicts found in Phase 1
 *
 * Every replacement below is asserted: the script exits non-zero if a target
 * string is not found exactly once. That is the lesson from the Phase-1
 * authoring passes — a silent no-op is worse than a crash.
 *
 *   1. m02l04  dry-cabinet threshold 10 % RH  ->  <=5 % RH (J-STD-033D),
 *              10 % RH kept only as a partial-protection caveat
 *   2. m04l03 / m04l07  squeegee pressure: one normalised band
 *              0.2-0.6 N/mm of blade length (0.5-1.5 kg / 25 mm), stated
 *              with the blade length; the absolute 5-15 N form is dropped
 *   3. m09l04  dwell window 6-12 s -> 2-5 s (3-5 s lead-free), worked
 *              example recomputed, evidence links 2-4 s / 2-5 s
 *
 * The affected questions are edited in the same pass so the lesson text and
 * the quiz cannot drift apart.
 *
 * Usage: node scripts/fix-conflicts.js [--dry]
 * ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');
const LESSONS = path.join(ROOT, 'data', 'lessons.json');
const QUESTIONS = path.join(ROOT, 'data', 'questions.json');

function readJson(file) {
  let raw = fs.readFileSync(file, 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  return JSON.parse(raw);
}

let applied = 0;
let failures = [];

function rep(container, key, from, to, label) {
  const value = container[key];
  if (typeof value !== 'string') {
    failures.push(label + ': field "' + key + '" is not a string');
    return;
  }
  const first = value.indexOf(from);
  if (first < 0) {
    failures.push(label + ': NOT FOUND -> ' + from.slice(0, 70));
    return;
  }
  if (value.indexOf(from, first + 1) >= 0) {
    failures.push(label + ': found more than once -> ' + from.slice(0, 70));
    return;
  }
  container[key] = value.split(from).join(to);
  applied += 1;
  console.log('  ok  ' + label + '  (' + from.slice(0, 48).replace(/\s+/g, ' ') + ' …)');
}

function lesson(L, id) {
  const l = L.find(function (x) { return x.lessonId === id; });
  if (!l) throw new Error('lesson not found: ' + id);
  return l;
}

function question(Q, id) {
  const q = Q.find(function (x) { return x.questionId === id; });
  if (!q) throw new Error('question not found: ' + id);
  return q;
}

function setOption(q, id, text) {
  const o = q.options.find(function (x) { return x.id === id; });
  if (!o) throw new Error('option not found: ' + q.questionId + '/' + id);
  if (o.text === text) { failures.push(q.questionId + '/' + id + ': option already has that text'); return; }
  o.text = text;
  applied += 1;
  console.log('  ok  ' + q.questionId + '/' + id + '  (option rewritten)');
}

const L = readJson(LESSONS);
const Q = readJson(QUESTIONS);

/* ===================================================================== */
console.log('\n[1] m02l04 — dry storage at 5 % RH, not 10 %');
{
  const l = lesson(L, 'm02l04');

  rep(l.content.theory[3], 'p',
    'IPC/JEDEC J-STD-033D recognizes dry storage at 10% RH or less for eligible devices. A dry cabinet should be calibrated, alarmed, and logged; setpoints of 5% to 10% RH are common, but the qualified limit is the one in your procedure. If the cabinet is out of range, the time in the cabinet may count as floor life.',
    'IPC/JEDEC J-STD-033D recognizes dry storage at 5% RH or less as the condition that suspends the floor-life clock: below that humidity the device is not gaining moisture, so the exposure no longer accumulates. A common 10% RH cabinet is not equivalent. It slows the clock rather than stopping it, and parts stored in it stay on a shortened budget, so 10% RH is a lower-cost mitigation for devices with budget to spare, never a substitute for the 5% RH requirement. A dry cabinet should be calibrated, alarmed, and logged, and the qualified limit is the one written in your procedure. If the cabinet is out of range, the time in the cabinet counts as floor life.',
    'm02l04 theory[3]');

  rep(l.content.calc, 'solution',
    'suspend the clock in a qualified dry cabinet at 10% RH or less',
    'suspend the clock in a qualified dry cabinet at 5% RH or less',
    'm02l04 calc.solution');

  rep(l.content.defect,
    'symptom',
    'the lot had been stored in a dry cabinet with a logged RH of 18% while the setpoint was 10%.',
    'the lot had been stored in a dry cabinet with a logged RH of 12% while the setpoint was 5%.',
    'm02l04 defect.symptom');

  /* the matching question: it must not offer 10 % RH as the suspension rule */
  const q = question(Q, 'q-m02l06-04');
  rep(q, 'explanation',
    'The 10 % RH defence belongs to a different threshold statement and does not apply here;',
    'A 10 % RH cabinet is not a suspension condition at any point in this course: it only slows the clock, and the lesson requires 5 % RH or less before exposure is discounted;',
    'q-m02l06-04 explanation');
}

/* ===================================================================== */
console.log('\n[2] m04l03 / m04l07 — squeegee pressure per unit blade length');
{
  const l3 = lesson(L, 'm04l03');

  rep(l3.content.theory[2], 'p',
    'Squeegee pressure is the force applied by the blade to the stencil, often expressed as force per blade length. Low pressure can leave apertures underfilled, especially on small apertures or high aspect ratio stencils. High pressure can cause paste bleed under the stencil, blade wear, stencil deformation, and paste roll disturbance. A common starting range is 0.5 to 1.5 N/mm of blade length, but verify against your paste/equipment datasheet.',
    'Squeegee pressure is the force applied by the blade to the stencil, expressed per unit of blade length — never as a bare force, because the same 100 N is a light touch on a 400 mm blade and a crushing load on a 100 mm blade. Low pressure can leave apertures underfilled, especially on small apertures or high aspect ratio stencils. High pressure can cause paste bleed under the stencil, blade wear, stencil deformation, and paste roll disturbance. Industry guidance clusters around 0.45 to 0.70 kg per 25 mm of blade, which is 0.2 to 0.6 N/mm; work in N/mm and state the blade length with every setting, because 0.2 N/mm on a 250 mm blade is 50 N and 0.6 N/mm is 150 N. The starting point is the lower end, raised until the stencil is wiped clean; verify the final value against your paste and equipment datasheet and the printed deposit.',
    'm04l03 theory[2]');

  rep(l3.content.calc, 'task',
    'The paste datasheet recommends 0.8 to 1.2 N/mm. Calculate the current pressure per blade length, decide whether it is in range, and state the first predicted adjustment.',
    'The paste datasheet recommends 0.2 to 0.6 N/mm of blade length. Calculate the current pressure per blade length, decide whether it is in range, and state the first predicted adjustment.',
    'm04l03 calc.task');

  rep(l3.content.calc, 'solution',
    'Step 2: Compare with the recommended range: 0.5 N/mm is below 0.8 to 1.2 N/mm. Step 3: Increase pressure into the recommended range. For a 250 mm blade, 0.8 N/mm requires 200 N and 1.2 N/mm requires 300 N.',
    'Step 2: Compare with the recommended range: 0.5 N/mm is inside 0.2 to 0.6 N/mm, at the upper end, so pressure is not the limiting factor and the diagnosis moves on. Step 3: Keep the force at 125 N and note the band for this blade — 0.2 N/mm is 50 N and 0.6 N/mm is 150 N — so the setting has room in both directions if a later experiment calls for it.',
    'm04l03 calc.solution');

  rep(l3.content.calc, 'solution',
    'Step 4: If insufficient fill persists after pressure correction, reduce print speed from 45 mm/s to 30 mm/s to increase fill time.',
    'Step 4: Since aperture fill is the symptom and pressure is already high in its band, the first predicted adjustment is a slower print stroke: reduce speed from 45 mm/s to 30 mm/s to give the paste more time to fill 0.35 mm apertures.',
    'm04l03 calc.solution (order)');

  rep(l3.content.defect,
    'cause',
    'Squeegee pressure is too low, print speed is too high for the aperture fill time, and separation may be too large for stable paste transfer.',
    'Print speed is too high for the aperture fill time at 0.35 mm apertures, while squeegee pressure at 0.5 N/mm already sits in the upper half of its band, so pressure is not the first lever; separation may also be too large for stable paste transfer.',
    'm04l03 defect.cause');

  rep(l3.content.defect,
    'action',
    'Increase squeegee pressure to 0.8 to 1.2 N/mm, reduce print speed to 30 mm/s, reduce separation to 1.0 mm if it is above the recommended range, and verify against your paste/equipment datasheet.',
    'Reduce print speed to 30 mm/s first, keep squeegee pressure inside 0.2 to 0.6 N/mm of blade length (50 to 150 N on this 250 mm blade) and move it only if the slower stroke does not close the gap, reduce separation to 1.0 mm if it is above the recommended range, and verify against your paste/equipment datasheet.',
    'm04l03 defect.action');

  /* questions attached to m04l03 */
  {
    const q2 = question(Q, 'q-m04l03-02');
    rep(q2, 'prompt',
      'a rule-of-thumb setup applies 200 N to a 100 mm blade. What pressure is set?',
      'a rule-of-thumb setup applies 60 N to a 100 mm blade. What pressure is set?',
      'q-m04l03-02 prompt');
    setOption(q2, 'a', '0.6 N/mm');
    setOption(q2, 'b', '6 N/mm');
    setOption(q2, 'c', '60 N/mm');
    setOption(q2, 'd', '600 N/mm');
    q2.correct = 'a';
    rep(q2, 'explanation',
      '200 N / 100 mm = 2 N/mm. Converting to N/cm: 2 N/mm × 10 mm/cm = 20 N/cm. Option a omits the mm-to-cm conversion; c treats the force as pressure; d multiplies by 100 instead of 10.',
      '60 N / 100 mm = 0.6 N/mm of blade length, the top of the usual band, and 0.6 N/mm on a 100 mm blade is 60 N. The other options each drop or shift a decimal: 6 N/mm treats the blade as 10 mm long, 60 N/mm reports the force as pressure, and 600 N/mm divides by 0.1 instead of 100. State the blade length with any per-length figure or it means nothing.',
      'q-m04l03-02 explanation');

    const q5 = question(Q, 'q-m04l03-05');
    rep(q5, 'prompt',
      'A 250 mm blade is loaded with 125 N against a recommended 0.8 to 1.2 N/mm. What force range does that recommend for this blade?',
      'A 250 mm blade is loaded with 125 N. Against a recommended 0.2 to 0.6 N/mm of blade length, what force range does that recommend for this blade?',
      'q-m04l03-05 prompt');
    setOption(q5, 'a', '50 N to 150 N, against a current 0.5 N/mm');
    setOption(q5, 'b', '20 N to 60 N, against a current 0.5 N/mm');
    setOption(q5, 'c', '200 N to 600 N, against a current 0.5 N/mm');
    setOption(q5, 'd', '500 N to 1,500 N, against a current 5.0 N/mm');
    q5.correct = 'a';
    rep(q5, 'explanation',
      '0.8 x 250 = 200 N and 1.2 x 250 = 300 N, so the current 125 N is 0.5 N/mm and sits below the band. The 100-150 N answer applies the band to the force rather than to the per-length value, 125-188 N divides instead of multiplying, and 800-1200 N treats the blade length as 1000 mm.',
      '0.2 x 250 = 50 N and 0.6 x 250 = 150 N, so the 125 N setting is 0.5 N/mm and sits near the top of the band. The 20-60 N answer forgets that the band is per length and applies it to a 100 mm blade, 200-600 N multiplies by 1,000 mm of blade, and 500-1,500 N reads the band as N/cm on a 250 mm blade.',
      'q-m04l03-05 explanation');
  }

  /* m04l07: the absolute 5-15 N form is removed */
  const l7 = lesson(L, 'm04l07');
  rep(l7.content.theory[2], 'p',
    'Typical pressure ranges are 5 N to 15 N, but verify against your paste and equipment datasheet. Squeegee speed affects shear thinning and fill time. Typical speeds are 10 mm/s to 50 mm/s.',
    'Pressure is set per unit of blade length, around 0.2 to 0.6 N/mm (0.5 to 1.5 kg per 25 mm), so the force to dial in depends on the blade: 50 to 150 N on a 250 mm blade. A bare force figure cannot be checked without the blade length, and a 5 to 15 N setting would be far too light for any production blade. Verify against your paste and equipment datasheet. Squeegee speed affects shear thinning and fill time. Typical speeds are 10 mm/s to 50 mm/s.',
    'm04l07 theory[2]');

  rep(l7.content.calc, 'task',
    'Baseline settings are squeegee pressure 8 N, squeegee speed 25 mm/s, snap-off distance 1.5 mm, and wipe every 3 prints.',
    'Baseline settings are squeegee pressure 100 N on the 250 mm blade (0.4 N/mm), squeegee speed 25 mm/s, snap-off distance 1.5 mm, and wipe every 3 prints.',
    'm04l07 calc.task');

  rep(l7.content.calc, 'solution',
    'If volume does not change, revert to 1.5 mm and test a single next variable, such as reducing squeegee speed to 20 mm/s or increasing pressure by 1 N.',
    'If volume does not change, revert to 1.5 mm and test a single next variable, such as reducing squeegee speed to 20 mm/s or raising pressure by 0.1 N/mm (25 N on this blade), recording each result separately.',
    'm04l07 calc.solution');
}

/* ===================================================================== */
console.log('\n[3] m09l04 / m09l06 — wave dwell inside the published windows');
{
  const l = lesson(L, 'm09l04');

  rep(l.content.theory[3], 'p',
    'Dwell windows are machine-, flux-, and board-specific. Typical single-wave dwell may be around 4-10 s, and dual-wave total dwell may be around 6-15 s, but verify against your paste/equipment datasheet and trial results.',
    'Dwell windows are machine-, flux-, and board-specific, but published practice is narrower than folklore suggests. A typical window is 2 to 4 s, lead-free processes commonly run 3 to 5 s, and only heavy boards or a chip-wave-plus-main-wave pair push contact beyond that, up to about 6 s. A single-wave window of 6 to 12 s would overheat thin boards and burn off flux long before it filled a barrel, so treat any figure above 6 s as something your own trial data has to justify. Verify against your flux and equipment datasheet and your trial results.',
    'm09l04 theory[3]');

  rep(l.content.calc, 'task',
    'The paste/flux datasheet gives a dwell window of 6-12 s.',
    'The flux datasheet gives a dwell window of 2-5 s for this lead-free process.',
    'm09l04 calc.task');

  rep(l.content.calc, 'solution',
    '3. Judge: 10.8 s is inside the 6-12 s window, but near the upper end. If hole fill is good and thermal stress is acceptable, keep the speed. If icicles or poor fill appear, first check wave height and clearance before increasing dwell. If overheating or flux burn-off appears, reduce dwell by increasing speed; for a target of 8 s, set v = 180 mm / 8 s = 22.5 mm/s = 1.35 m/min.',
    'Step 3: Judge: 10.8 s is far above the 2-5 s window, more than twice its upper bound, so the line is running too slowly whatever the hole fill looks like. Raise conveyor speed to bring dwell into the window: the 180 mm contact length at 1.0 m/min is an over-long contact zone, and the window is reached at v = 180 mm / 4 s = 45 mm/s = 2.7 m/min for the top of the window or 180 mm / 3 s = 60 mm/s = 3.6 m/min for a mid-window 3 s. Pair the faster line with a check of wave height and clearance, because contact that long also means the board is riding deeper into the wave than intended.',
    'm09l04 calc.solution');

  rep(l.content.calc, 'solution',
    '7. Validate: run a coupon, inspect hole fill, wetting, residue, and component damage, then adjust speed, wave height, or clearance in small steps.',
    '7. Validate: run a coupon at the new speed, inspect hole fill, wetting, residue, and component damage, then adjust speed, wave height, or clearance in small steps; a 3 s dwell that fills the barrels has replaced the 10.8 s dwell that also overheated the board.',
    'm09l04 calc.solution (validate)');

  rep(l.content.defect,
    'cause',
    'Dwell time is too short, or wave height is too low and board clearance is too large, so the wave does not penetrate the holes; flux coverage may also be low.',
    'Wave height is too low and board clearance too large, so the wave never penetrates the holes; flux coverage may also be low, and the conveyor speed has to be checked against the 2-5 s window at the same time.',
    'm09l04 defect.cause');

  /* the matching questions */
  {
    const q5 = question(Q, 'q-m09l04-05');
    setOption(q5, 'a', 'Roughly 10.8 s of dwell — outside the 2-5 s window');
    setOption(q5, 'b', 'About 1.8 s of dwell — inside the window');
    setOption(q5, 'c', 'About 18 s of dwell — far above the window');
    setOption(q5, 'd', 'About 3.0 s of dwell — inside the window');
    q5.correct = 'a';
    rep(q5, 'explanation',
      '1.0 m/min is 16.7 mm/s, and 180 / 16.7 = 10.8 s — inside the datasheet window but near its top. The 1.8 s answer slips a decimal, 18 s divides by 10 instead of by 16.7, and 3.0 s corresponds to a much faster line.',
      '1.0 m/min is 16.7 mm/s, and 180 / 16.7 = 10.8 s — more than twice the upper bound of the 2-5 s window, so the arithmetic is right and the line is wrong. The 1.8 s answer slips a decimal, 18 s divides by 10 instead of by 16.7, and 3.0 s is a correct mid-window dwell on a much faster line, not this one.',
      'q-m09l04-05 explanation');

    const q3 = question(Q, 'q-m09l04-e3');
    rep(q3, 'prompt',
      'The same 180 mm contact length should give 8 s of dwell. What speed does that need?',
      'The same 180 mm contact length should give 3 s of dwell at mid-window. What speed does that need?',
      'q-m09l04-e3 prompt');
    setOption(q3, 'a', 'About 0.90 m/min');
    setOption(q3, 'b', 'About 0.17 m/min');
    setOption(q3, 'c', 'About 60 m/min');
    setOption(q3, 'd', 'About 3.6 m/min');
    q3.correct = 'd';
    rep(q3, 'explanation',
      '180 / 8 = 22.5 mm/s, which is 1.35 m/min — the lesson\'s own target-setting example. The 2.25 m/min answer slips a decimal, 0.68 m/min inverts the calculation, and 22.5 m/min leaves the seconds-to-minutes step out.',
      '180 mm / 3 s = 60 mm/s, which is 3.6 m/min — the lesson\'s own target-setting example, and a speed that puts the board through the wave inside the 2-5 s window. The 0.90 m/min answer divides 180 by 200 s, 0.17 m/min inverts the calculation, and 60 m/min leaves the seconds-to-minutes step out.',
      'q-m09l04-e3 explanation');
  }

  const l6 = lesson(L, 'm09l06');
  rep(l6.content.theory[4], 'p',
    'Typical preheat ramp rates are 1.0 to 3.0 °C/s and dwell times are 3 to 6 s, but verify against your paste/equipment datasheet.',
    'Typical preheat ramp rates are 1.0 to 3.0 °C/s and dwell times are 2 to 5 s (3 to 5 s for lead-free), but verify against your flux and equipment datasheet.',
    'm09l06 theory[4]');

  rep(l6.content.calc, 'solution',
    'and dwell 2.5 s is below the 3 to 6 s range often used.',
    'and dwell 2.5 s is inside the 2 to 5 s window but short of the 3 to 5 s lead-free band.',
    'm09l06 calc.solution');
}

/* ===================================================================== */
if (failures.length) {
  console.error('\nFAILED — nothing written:');
  failures.forEach(function (f) { console.error('  ✗ ' + f); });
  process.exit(1);
}

if (DRY) {
  console.log('\nDry run: ' + applied + ' replacements validated, nothing written.');
  process.exit(0);
}

fs.writeFileSync(LESSONS, JSON.stringify(L, null, 2) + '\n');
fs.writeFileSync(QUESTIONS, JSON.stringify(Q, null, 2) + '\n');
console.log('\nWrote data/lessons.json and data/questions.json — ' + applied + ' replacements.');
