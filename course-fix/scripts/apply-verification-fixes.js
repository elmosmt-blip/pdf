#!/usr/bin/env node
'use strict';
/*
 * apply-verification-fixes.js — second fix round.
 *
 * Round 1 (apply-review-fixes.js) was built from a spot-check of about ten
 * worked examples. A later systematic pass over all 92 lessons and all 185
 * questions showed that several defects were module-wide rather than local,
 * and that a number of quiz questions grade the learner against a wrong rule
 * of thumb. This script fixes those findings.
 *
 * Findings addressed (see COURSE_FIXES.md for the full audit):
 *   V1  J-STD-020 / J-STD-033 confusion: floor life attributed to J-STD-020
 *       and quoted at 85% RH instead of the J-STD-033 reference condition
 *       of 30 C / 60% RH (m02l02, m02l06, q-m02l01-02).
 *   V2  J-STD-033 bake table values: 45 C/72 h for tape and reel and a
 *       "192 h standard bake for the highest MSL" are not table values.
 *       Bake time is indexed to package body thickness; tape and reel is
 *       limited to 40 C (m02l04, q-m02l04-02).
 *   V3  m03l04 quoted aperture area (0.121 mm^2) as a paste volume.
 *   V4  Time above liquidus attributed to J-STD-020 in five lessons and
 *       three questions. J-STD-020's own time parameter is tp, the time
 *       within 5 C of the classification temperature (30-40 s); the 60-150 s
 *       window is IPC-7530 / paste-datasheet process guidance.
 *   V5  J-STD-020 classification temperatures given as a single "245 C" or
 *       "245-250 C" figure. The standard classifies by package size:
 *       260 C small, 250 C large, 245 C very large.
 *   V6  SAC305 liquidus quoted as 217 C in several places; 217 C is the
 *       solidus, the liquidus is 219 C. One lesson had them swapped.
 *   V7  IPC-A-610 hole fill: "Class 3 minimum of 100%" is not in the
 *       standard. Class 2 and Class 3 both require 75% minimum vertical
 *       barrel fill, Class 3 with fillets on both sides.
 *   V8  Wave flux density on a mg/cm2 basis that is 20-100x the industry
 *       figure. The controlled quantity is flux solids: 500-1500 ug/in2
 *       (0.08-0.23 mg/cm2, about 0.8-2.3 g/m2). Fixed in m09l02/l03/l07 and
 *       in three questions.
 *   V9  q-m09l06-02 had an answer key that contradicted its own
 *       explanation, and a dimensionally meaningless fill rule of thumb.
 *   V10 q-m01l05-02 quoted a 95% in-range requirement for J-STD-005 Type 3
 *       powder; the requirement is 80% minimum between 25 and 45 um.
 *   V11 q-m11l04-02 used a 0.10 mm Class 3 annular ring minimum while its
 *       own lesson uses 0.05 mm.
 *   V12 Cleanliness unit basis mixed: 1.56 ug/cm2 and 1.56 ug/in2 used
 *       interchangeably (they differ by 6.45), and a "Class 2 limit of
 *       3.12 ug/cm2" that no source supports. The traditional ROSE level is
 *       1.56 ug/cm2 (about 10.06 ug/in2), quoted independently of class.
 *
 * Every fix is a guarded exact-string replacement: if the expected source
 * text is not found the script fails loudly, so it is safe to re-run.
 *
 * Usage: node scripts/apply-verification-fixes.js [dataDir]
 */

const fs = require('fs');
const path = require('path');

const dataDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, '..', 'data');
const FILES = {
  lessons: path.join(dataDir, 'lessons.json'),
  questions: path.join(dataDir, 'questions.json'),
  sources: path.join(dataDir, 'sources.json'),
};

const log = [];
function note(msg) { log.push(msg); console.log('  ' + msg); }

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}
function findLesson(lessons, id) {
  const l = lessons.find(function (x) { return x.lessonId === id; });
  if (!l) throw new Error('lesson not found: ' + id);
  return l;
}
function findTheory(lesson, heading) {
  const t = (lesson.content.theory || []).find(function (x) { return x.h === heading; });
  if (!t) throw new Error('theory block not found: ' + lesson.lessonId + ' / ' + heading);
  return t;
}
function findQuestion(questions, id) {
  const q = questions.find(function (x) { return x.questionId === id; });
  if (!q) throw new Error('question not found: ' + id);
  return q;
}
// Replaces `from` with `to` inside `subject`. Returns {text, changed, already}.
// The "already applied" test is evaluated FIRST: `from` can be a prefix of the
// already-patched text (for example when a fix appends a sentence to a
// paragraph), and a prefix match would otherwise re-append on every run.
function replaceOnce(subject, from, to) {
  if (subject.indexOf(to) !== -1) return { text: subject, changed: false, already: true };
  const i = subject.indexOf(from);
  if (i === -1) return { text: subject, changed: false, already: false };
  return { text: subject.slice(0, i) + to + subject.slice(i + from.length), changed: true };
}
function applyReplace(label, subject, from, to) {
  const r = replaceOnce(subject, from, to);
  if (r.changed) { note('FIX ' + label); return r.text; }
  if (r.already) { note('skip ' + label + ' (already applied)'); return subject; }
  throw new Error('FIX ' + label + ': expected source text not found');
}

function main() {
  console.log('apply-verification-fixes: dataDir=' + dataDir);
  const lessons = readJson(FILES.lessons);
  const questions = readJson(FILES.questions);
  const sources = readJson(FILES.sources);

  // =====================================================================
  // V1 — floor life standard and reference condition
  // =====================================================================
  const m02l02 = findLesson(lessons, 'm02l02');
  findTheory(m02l02, 'Floor life values and conditions').p = applyReplace(
    'V1a m02l02 floor life standard / RH',
    findTheory(m02l02, 'Floor life values and conditions').p,
    'J-STD-020 defines floor life at 30 °C/85% RH for common MSL ratings.',
    'IPC/JEDEC J-STD-033 defines floor life at reference conditions of 30 °C and 60% RH for common MSL ratings; J-STD-020 assigns the moisture sensitivity level itself.'
  );

  const m02l06 = findLesson(lessons, 'm02l06');
  findTheory(m02l06, 'Floor life is a clock, not a label').p = applyReplace(
    'V1b m02l06 floor life reference condition',
    findTheory(m02l06, 'Floor life is a clock, not a label').p,
    'IPC/JEDEC J-STD-033 defines floor life at reference conditions of 30 °C and 85% RH',
    'IPC/JEDEC J-STD-033 defines floor life at reference conditions of 30 °C and 60% RH'
  );
  m02l06.content.calc.solution = applyReplace(
    'V1c m02l06 calc floor life standard / RH',
    m02l06.content.calc.solution,
    'Step 1: Identify the moisture sensitivity level. The devices are MSL3 under IPC/JEDEC J-STD-020. Step 2: Compare elapsed floor life with IPC/JEDEC J-STD-033. MSL3 floor life is 168 h at 30 °C and 85% RH.',
    'Step 1: Identify the moisture sensitivity level. The devices are MSL3 under IPC/JEDEC J-STD-020, and the floor-life rules come from IPC/JEDEC J-STD-033. Step 2: Compare elapsed floor life with IPC/JEDEC J-STD-033. MSL3 floor life is 168 h at 30 °C and 60% RH.'
  );

  const q_m02l01 = findQuestion(questions, 'q-m02l01-02');
  q_m02l01.prompt = applyReplace(
    'V1d q-m02l01-02 prompt floor life standard',
    q_m02l01.prompt,
    'A device marked MSL 3 was exposed for one-third of its J-STD-020 floor life,',
    'A device marked MSL 3 was exposed for one-third of its J-STD-033 floor life,'
  );
  q_m02l01.explanation = applyReplace(
    'V1e q-m02l01-02 explanation standard',
    q_m02l01.explanation,
    'MSL 3 has a J-STD-020 floor life of 168 h under standard conditions.',
    'MSL 3 has a J-STD-033 floor life of 168 h at 30 °C/60% RH (J-STD-020 assigns the level, J-STD-033 governs handling).'
  );

  // =====================================================================
  // V2 — J-STD-033 bake table
  // =====================================================================
  const m02l04 = findLesson(lessons, 'm02l04');
  findTheory(m02l04, 'Bake conditions by package type').p = applyReplace(
    'V2a m02l04 bake table by thickness',
    findTheory(m02l04, 'Bake conditions by package type').p,
    'Tape and reel often uses a lower-temperature bake, commonly 40°C to 50°C for 48 h to 168 h, to protect carrier tape and cover tape. Trays and tubes may use 125°C for 12 h to 24 h only if the tray, tube, and component materials are rated. Verify against your paste, tape, tray, tube, and equipment datasheet, because tape can soften, trays can warp, and some coatings can blister.',
    'Bake time in J-STD-033 is indexed to package body thickness, not to the moisture sensitivity level. Tape and reel must not be baked above 40°C, because carrier tape and cover tape soften and deform; the 40°C column is therefore long — about 9 days for bodies up to 1.4 mm, 11 days for 1.4 to 2.0 mm and 38 days for 2.0 to 4.5 mm — so a 48 h or 168 h bake at 40°C will not dry a reel. Loose parts in trays or tubes can use the 125°C column: 8 h up to 1.4 mm, 18 h for 1.4 to 2.0 mm and 48 h for 2.0 to 4.5 mm, only if the tray, tube and component materials are rated. Above 90°C the cumulative bake time is limited (96 h unless the supplier states otherwise) because of intermetallic growth and solderability loss. Verify against your tape, tray, tube, and equipment datasheet, because tape can soften, trays can warp, and some coatings can blister.'
  );
  m02l04.content.calc.solution = applyReplace(
    'V2b m02l04 calc tape-and-reel bake recipe',
    m02l04.content.calc.solution,
    '5. Use a qualified tape-and-reel bake recipe, for example 45°C for 72 h, and verify against the IPC/JEDEC J-STD-033D bake table and the tape datasheet.',
    '5. A tape-and-reel bake cannot exceed 40°C, and at 40°C the J-STD-033 Table 4-1 time for a body up to 1.4 mm is about 9 days, which does not fit a 30 h window. Either move the reflow inside the remaining floor life, suspend the clock in a qualified dry cabinet at 10% RH or less, or de-reel, bake loose parts at 125°C for 8 h and re-reel; verify the chosen route against the J-STD-033D bake table, the tape datasheet and the reflow window.'
  );

  const q_m02l04 = findQuestion(questions, 'q-m02l04-02');
  q_m02l04.prompt = 'A 2.5 mm-thick package is baked at 90 °C. The J-STD-033 Table 4-1 bake time for that body thickness is 192 h. If the bake has already run for half of the bake time, how many hours remain before the bake is complete?';
  q_m02l04.options = [
    { id: 'a', text: '96 h' },
    { id: 'b', text: '192 h' },
    { id: 'c', text: '48 h' },
    { id: 'd', text: '24 h' }
  ];
  q_m02l04.correct = 'a';
  q_m02l04.explanation = 'J-STD-033 bake time is indexed to package body thickness, not to the moisture sensitivity level: for 2.0 to 4.5 mm bodies the 90 °C column gives 192 h. Half of that is 96 h, so 96 h remain. The 192 h option is the total bake time; 48 h and 24 h are floor-life values for MSL 5 and MSL 5a, not bake times. Note that the cumulative bake time above 90 °C is limited to 96 h unless the component supplier states otherwise, so a 192 h bake at 90 °C normally requires supplier approval.';
  note('FIX V2c q-m02l04-02 rewritten on the J-STD-033 thickness-indexed bake table');

  // =====================================================================
  // V3 — m03l04 aperture area quoted as a volume
  // =====================================================================
  const m03l04 = findLesson(lessons, 'm03l04');
  m03l04.content.calc.solution = applyReplace(
    'V3 m03l04 paste volume = area x foil',
    m03l04.content.calc.solution,
    '4. Check paste volume: 0.121 mm^3 per aperture.',
    '4. Check paste volume: aperture area 0.121 mm^2 multiplied by foil thickness 0.10 mm gives 0.0121 mm^3 per aperture.'
  );

  // =====================================================================
  // V4 — time above liquidus is not a J-STD-020 parameter
  // =====================================================================
  const m06l01 = findLesson(lessons, 'm06l01');
  findTheory(m06l01, 'Time above liquidus').p = applyReplace(
    'V4a m06l01 time-above-liquidus attribution',
    findTheory(m06l01, 'Time above liquidus').p,
    'J-STD-020 gives a qualification time above liquidus window of 60-150 s for many component classes; production profiles may use a different window if qualified.',
    'The time-above-liquidus window is process guidance rather than a J-STD-020 parameter: IPC-7530 and the paste datasheet typically call for 60-150 s for many assemblies. J-STD-020 has its own time figure, tp, which is the time within 5 °C of the classification temperature and is limited to 30-40 s; it is a package qualification parameter, not the paste window used to run a board. Production profiles may use a different window if qualified.'
  );

  const m06l04 = findLesson(lessons, 'm06l04');
  findTheory(m06l04, 'Use alloy liquidus and standard limits to set the profile').p = applyReplace(
    'V4b m06l04 theory limits attribution',
    findTheory(m06l04, 'Use alloy liquidus and standard limits to set the profile').p,
    'IPC/JEDEC J-STD-020 gives a screening profile with average ramp-up of 1-3 °C/s, time above liquidus of 60-150 s, and a peak limit of 245 °C for packages thicker than 1.6 mm; verify against the component datasheet and your paste supplier recommendation.',
    'The average ramp-up of 1-3 °C/s and the 60-150 s time-above-liquidus window come from IPC-7530 and the paste datasheet, not from J-STD-020. J-STD-020 supplies the classification temperatures that bound the peak: 260 °C for small packages, 250 °C for large packages and 245 °C for very large packages, each with tp, the time within 5 °C of that temperature, limited to 30-40 s. Verify the applicable package size, the component datasheet and your paste supplier recommendation.'
  );

  const m06l04NewCalc =
    '1. Confirm alloy liquidus: SAC305 solidus 217 °C and liquidus 219 °C from the paste datasheet; time above liquidus is measured from the 219 °C crossing. ' +
    '2. Apply limits: ramp 1-3 °C/s and time above liquidus 60-150 s from IPC-7530 and the paste datasheet; the peak ceiling is the J-STD-020 classification temperature for the package size, 250 °C for a large package. ' +
    '3. Calculate ramp: (219 - 150) / 37 = 1.86 °C/s. ' +
    '4. Check ramp: 1.86 °C/s is within 1-3 °C/s. ' +
    '5. Check time above liquidus: 85 s is within 60-150 s. ' +
    '6. Check peak: 238 °C is below the 250 °C classification temperature and above liquidus by 19 °C. ' +
    '7. Decision: the profile passes the cited limits, but heavy planes require pad-level confirmation; if pad temperature is low, increase soak or reduce conveyor speed and recheck peak and time above liquidus.';
  m06l04.content.calc.solution = applyReplace(
    'V4c m06l04 calc limits and liquidus basis',
    m06l04.content.calc.solution,
    '1. Confirm alloy liquidus: 217 °C from paste datasheet. 2. Apply limits: IPC/JEDEC J-STD-020 average ramp-up 1-3 °C/s, time above liquidus 60-150 s, peak not above 245 °C for the selected thickness class. 3. Calculate ramp: (217 - 150) / 37 = 1.81 °C/s. 4. Check ramp: 1.81 °C/s is within 1-3 °C/s. 5. Check time above liquidus: 85 s is within 60-150 s. 6. Check peak: 238 °C is below 245 °C and above liquidus by 21 °C. 7. Decision: the profile passes the cited limits, but heavy planes require pad-level confirmation; if pad temperature is low, increase soak or reduce conveyor speed and recheck peak and time above liquidus.',
    m06l04NewCalc
  );
  m06l04.content.calc.task = applyReplace(
    'V4d m06l04 calc task liquidus',
    m06l04.content.calc.task,
    'uses SAC305 paste with liquidus 217 °C. The component limit is 245 °C peak for the thickness class in IPC/JEDEC J-STD-020.',
    'uses SAC305 paste with solidus 217 °C and liquidus 219 °C. The component limit is the J-STD-020 classification temperature for the package size.'
  );

  // =====================================================================
  // V5 + V6 — m06l02 peak / TAL attribution and inverted verdict
  // =====================================================================
  const m06l02 = findLesson(lessons, 'm06l02');
  m06l02.content.calc.task = applyReplace(
    'V5a m06l02 calc task framing',
    m06l02.content.calc.task,
    'Check against IPC J-STD-020 limits for a large MSL 3 package and typical paste guidance.',
    'Check against the J-STD-020 classification temperature for the package size and typical paste guidance.'
  );
  m06l02.content.calc.task = applyReplace(
    'V5b m06l02 calc task TAL basis',
    m06l02.content.calc.task,
    'TAL above 217 °C = 45 s',
    'TAL above 219 °C = 45 s'
  );
  m06l02.content.calc.solution = applyReplace(
    'V5c m06l02 calc peak and TAL attribution',
    m06l02.content.calc.solution,
    '3. Peak temperature: measured 248 °C. IPC J-STD-020 for large MSL 3 packages specifies a peak of 245 °C. 248 °C exceeds the limit by 3 °C. 4. TAL above 217 °C: measured 45 s. IPC J-STD-020 for large MSL 3 packages specifies a maximum TAL of 30 s. 45 s exceeds the limit by 15 s. 5. Cooling rate: (248-100)/40 = 3.7 °C/s. Typical practice is 1 to 4 °C/s; this is within range. 6. Conclusion: the profile fails the peak and TAL limits for the large MSL 3 package. Reduce peak temperature to 245 °C or below and reduce TAL to 30 s or less, then re-measure.',
    '3. Peak temperature: measured 248 °C. J-STD-020 sets classification temperatures by package size — 260 °C small, 250 °C large, 245 °C very large. For a large package 248 °C is inside the limit; for a very large package it exceeds 245 °C by 3 °C, so the package size must be confirmed before disposition. 4. TAL above 219 °C: measured 45 s. J-STD-020 does not set a board-assembly time-above-liquidus limit; its 30 s figure is tp, the time within 5 °C of the classification temperature. The applicable limit is the paste window of 60-120 s from the paste datasheet and IPC-7530 guidance, and 45 s is 15 s below the lower bound, so the profile is too short for reliable wetting rather than too long. 5. Cooling rate: (248-100)/40 = 3.7 °C/s. Typical practice is 1 to 4 °C/s; this is within range, and the J-STD-020 classification ramp-down limit is 6 °C/s or less. 6. Conclusion: the binding failure is the too-short time above liquidus, not an excessive one. Lengthen time above liquidus into the 60-120 s paste window by adding reflow dwell or slightly raising peak within the package classification temperature, confirm the package size for the peak ceiling, then re-measure.'
  );

  // =====================================================================
  // V6 — SAC305 solidus / liquidus
  // =====================================================================
  const m06l03 = findLesson(lessons, 'm06l03');
  m06l03.content.calc.task = applyReplace(
    'V6a m06l03 calc task solidus/liquidus',
    m06l03.content.calc.task,
    'The paste datasheet gives liquidus 217 °C and solidus 219 °C.',
    'The paste datasheet gives solidus 217 °C and liquidus 219 °C.'
  );
  m06l03.content.calc.solution = applyReplace(
    'V6b m06l03 calc liquidus basis',
    m06l03.content.calc.solution,
    'First, identify the coolest peak: 238 °C. Next, identify the paste liquidus: 217 °C. Then subtract the liquidus from the coolest peak: 238 - 217 = 21 °C.',
    'First, identify the coolest peak: 238 °C. Next, identify the paste liquidus: 219 °C, because SAC305 has a solidus of 217 °C and a liquidus of 219 °C and time above liquidus is measured from the 219 °C crossing. Then subtract the liquidus from the coolest peak: 238 - 219 = 19 °C.'
  );

  const m06l05 = findLesson(lessons, 'm06l05');
  findTheory(m06l05, 'Liquidus is the profile reference').p = applyReplace(
    'V6c m06l05 liquidus source',
    findTheory(m06l05, 'Liquidus is the profile reference').p,
    'SnPb eutectic paste is commonly associated with a liquidus of 183 C, while SnAgCu is commonly associated with 217 C in IPC/JEDEC J-STD-020.',
    'SnPb eutectic paste is commonly associated with a liquidus of 183 C, while SAC305 is a near-eutectic alloy with a solidus of 217 C and a liquidus of 219 C. These values come from the alloy and paste datasheet, not from J-STD-020, which supplies classification temperatures rather than alloy melting data.'
  );
  findTheory(m06l05, 'Alloy families set different thermal budgets').p = applyReplace(
    'V6d m06l05 classification temperatures',
    findTheory(m06l05, 'Alloy families set different thermal budgets').p,
    'SnPb profiles usually use a lower peak because IPC/JEDEC J-STD-020 gives a 220 C classification temperature for SnPb eutectic, while SnAgCu profiles use a higher peak because IPC/JEDEC J-STD-020 gives a 260 C classification temperature for SnAgCu.',
    'SnPb profiles usually use a lower peak because the J-STD-020 classification temperature for SnPb eutectic is 220 C, while SAC305 profiles use a higher peak because the SAC305 classification temperatures are 260 C for small packages, 250 C for large packages and 245 C for very large packages.'
  );
  findTheory(m06l05, 'Peak temperature is a ceiling, not a target').p = applyReplace(
    'V6e m06l05 peak ceiling',
    findTheory(m06l05, 'Peak temperature is a ceiling, not a target').p,
    'A SnAgCu peak of 245 C may be acceptable if the measured board temperature stays below the IPC/JEDEC J-STD-020 classification limit of 260 C and the paste datasheet supports it.',
    'A SnAgCu peak of 245 C may be acceptable if the measured board temperature stays below the J-STD-020 classification temperature for the package size (260 C small, 250 C large, 245 C very large) and the paste datasheet supports it.'
  );
  m06l05.content.calc.task = applyReplace(
    'V6f m06l05 calc task liquidus basis',
    m06l05.content.calc.task,
    'The measured profile shows a ramp from 150 C to 217 C in 60 s, a time above 217 C of 75 s, and a peak of 245 C.',
    'The measured profile shows a ramp from 150 C to 219 C in 60 s, a time above 219 C of 75 s, and a peak of 245 C.'
  );
  m06l05.content.calc.solution = applyReplace(
    'V6g m06l05 calc liquidus source',
    m06l05.content.calc.solution,
    '1. Use the SnAgCu liquidus of 217 C from IPC/JEDEC J-STD-020 as the reference for time above liquidus.',
    '1. Use the SAC305 liquidus of 219 C from the paste datasheet as the reference for time above liquidus; 217 C is the solidus.'
  );
  m06l05.content.calc.solution = applyReplace(
    'V6h m06l05 calc ramp arithmetic',
    m06l05.content.calc.solution,
    '3. Estimate time from 150 C to 217 C: (217 - 150) / 1.1 = 61 s. This is close to the measured 60 s.',
    '3. Estimate time from 150 C to 219 C: (219 - 150) / 1.1 = 63 s. This is close to the measured 60 s.'
  );
  m06l05.content.calc.solution = applyReplace(
    'V6i m06l05 calc peak ceiling',
    m06l05.content.calc.solution,
    '6. Check peak against IPC/JEDEC J-STD-020 SnAgCu classification limit of 260 C: measured 245 C is below the limit.',
    '6. Check peak against the J-STD-020 classification temperature for the package size (260 C small, 250 C large, 245 C very large): measured 245 C is below the limit for small and large packages and exactly at the limit for very large packages, so confirm the package size.'
  );

  // =====================================================================
  // V7 — IPC-A-610 hole fill
  // =====================================================================
  const m08l05 = findLesson(lessons, 'm08l05');
  findTheory(m08l05, 'Acceptance and target').p = applyReplace(
    'V7a m08l05 hole fill classes',
    findTheory(m08l05, 'Acceptance and target').p,
    'IPC-A-610 commonly sets a minimum hole fill of 75% for Class 2 and 100% for Class 3, subject to the current revision and any product-specific qualification.',
    'IPC-A-610 sets a minimum vertical barrel fill of 75% for both Class 2 and Class 3, with Class 3 additionally requiring visible fillets on the primary and secondary sides. A documented exception allows about 50% fill, or 1.2 mm, for parts with fourteen or more leads whose barrels tie into internal thermal or conductor planes. Some customers specify 100% fill contractually, which is a customer requirement rather than an IPC-A-610 class limit.'
  );
  m08l05.content.calc.solution = applyReplace(
    'V7b m08l05 calc fill comparison',
    m08l05.content.calc.solution,
    'The 90% target is above the IPC-A-610 Class 2 minimum of 75% and below the IPC-A-610 Class 3 minimum of 100%.',
    'The 90% target is above the IPC-A-610 minimum vertical barrel fill of 75% that applies to both Class 2 and Class 3; a customer requirement for 100% fill is contractual and is not an IPC-A-610 class limit.'
  );

  // =====================================================================
  // V8 — wave flux density basis (module 09)
  // =====================================================================
  const m09l02 = findLesson(lessons, 'm09l02');
  m09l02.content.calc.solution = applyReplace(
    'V8a m09l02 calc flux amount on a solids basis',
    m09l02.content.calc.solution,
    'Then set flux amount to 1.0 mg/cm2 within a 0.8-1.2 mg/cm2 starting range, giving 20 mg total; verify against your paste/equipment datasheet. Use 2.0% solids within a 1.5-2.5% starting range to keep residue low while maintaining wetting; verify against your paste/equipment datasheet. If the fluxer output is 100 mg/min, spray time = 20 mg / 100 mg/min = 0.2 min, about 12 s.',
    'Then set flux amount as a deposition of flux solids: a starting range of 0.08-0.23 mg/cm2 of board bottom area, which is 500-1500 µg/in² of solids and about 0.8-2.3 g/m². For 20 cm2 that is 1.6-4.6 mg of solids; take the mid value 0.15 mg/cm2, giving 3.0 mg of solids. With a 2.0% solids flux within a 1.5-2.5% starting range, the solution mass is 3.0 mg / 0.02 = 150 mg. If the fluxer output is 300 mg/min of solution, spray time = 150 mg / 300 mg/min = 0.5 min, about 30 s. State the basis before comparing numbers: figures quoted per unit of liquid, for example 0.5-1.0 g/ft², are several times larger than solids-based figures. Verify the solids deposition with a fluxometer in µg/in² or by weighing a witness card, and verify the range against your flux and equipment datasheet.'
  );
  m09l02.content.calc.solution = applyReplace(
    'V8b m09l02 calc justification',
    m09l02.content.calc.solution,
    'low-to-moderate activity matches fresh finish, 1.0 mg/cm2 and 2.0% solids balance wetting and residue,',
    'low-to-moderate activity matches fresh finish, 0.15 mg/cm2 of flux solids and 2.0% solids balance wetting and residue,'
  );

  const m09l03 = findLesson(lessons, 'm09l03');
  findTheory(m09l03, 'Flux amount').p = applyReplace(
    'V8c m09l03 theory flux density basis',
    findTheory(m09l03, 'Flux amount').p,
    'For spray application, a starting flux density of 0.5-2.0 mg/cm2 of bottom area is common, with the lower end for thin boards and the higher end for heavy copper or through-hole holes.',
    'For spray application, the controlled quantity is a deposition of flux solids per unit of bottom area: a starting range of 0.08-0.23 mg/cm2, which is 500-1500 µg/in² of solids and about 0.8-2.3 g/m², with the lower end for thin boards and the higher end for heavy copper or through-hole holes. Figures quoted per unit of liquid, for example 0.5-1.0 g/ft², are several times larger and are not comparable.'
  );
  m09l03.content.calc.solution = applyReplace(
    'V8d m09l03 calc flux amount on a solids basis',
    m09l03.content.calc.solution,
    '2. Flux amount: bottom area = 100 mm x 150 mm = 15000 mm2 = 150 cm2. Use starting spray density 1.0 mg/cm2 for mixed SMT/THT with no-clean flux. Flux mass = 150 cm2 x 1.0 mg/cm2 = 150 mg. Add 10-20% for through-hole hole walls if foam/spray does not fully wet holes; target 165-180 mg. Verify by weighing a test board.',
    '2. Flux amount: bottom area = 100 mm x 150 mm = 15000 mm2 = 150 cm2. Set the target as a deposition of flux solids, 0.15 mg/cm2 within the 0.08-0.23 mg/cm2 (500-1500 µg/in²) starting range for mixed SMT/THT with no-clean flux, giving 150 cm2 x 0.15 mg/cm2 = 22.5 mg of solids. Add 10-20% for through-hole hole walls if spray does not fully wet holes; target 25-27 mg of solids. At 2.0% solids that is 1250-1350 mg of flux solution. Verify by weighing a test board or witness card before and after fluxing and converting the result to µg/in² of solids with a fluxometer.'
  );

  const m09l07 = findLesson(lessons, 'm09l07');
  findTheory(m09l07, 'Flux amount').p = applyReplace(
    'V8e m09l07 theory flux amount basis',
    findTheory(m09l07, 'Flux amount').p,
    'Flux amount is controlled as wet flux mass per unit area of the bottom side. A practical starting range is 1.5 to 3.0 mg/cm2, then verify against the flux datasheet and spray pattern.',
    'Flux amount is controlled as a deposition of flux solids per unit area of the bottom side. A practical starting range is 0.08 to 0.23 mg/cm2 of solids, which is 500-1500 µg/in² and about 0.8-2.3 g/m², then verify against the flux datasheet and spray pattern. Wet mass per unit area is several times larger because the flux is roughly 2% solids, so always state whether a figure is on a solids basis or a liquid basis before comparing it.'
  );
  m09l07.content.calc.solution = applyReplace(
    'V8f m09l07 calc flux amount on a solids basis',
    m09l07.content.calc.solution,
    'Third, set flux amount. Target 2.0 mg/cm2 wet flux on the bottom side. Bottom area is 100 mm x 150 mm = 15000 mm2 = 150 cm2. Required wet flux mass is 2.0 mg/cm2 x 150 cm2 = 300 mg per board.',
    'Third, set flux amount. Target 0.20 mg/cm2 of flux solids on the bottom side, within the 0.08-0.23 mg/cm2 (500-1500 µg/in²) starting range. Bottom area is 100 mm x 150 mm = 15000 mm2 = 150 cm2. Required flux solids is 0.20 mg/cm2 x 150 cm2 = 30 mg per board; at 2.0% solids that is about 1500 mg of flux solution. Verify the solids deposition with a fluxometer or a weighed witness card.'
  );

  const m10l02 = findLesson(lessons, 'm10l02');
  findTheory(m10l02, 'Flux-on-the-fly variables').p = applyReplace(
    'V8g m10l02 theory basis note',
    findTheory(m10l02, 'Flux-on-the-fly variables').p,
    'Flux-on-the-fly means flux is applied immediately before the solder wave or nozzle contact, so the flux is active when the joint reaches wetting temperature. The important variables are flux volume, pattern, viscosity, and solids content. A practical starting flux density is 0.05 mg/mm^2 to 0.25 mg/mm^2 on the joint area, or a joint volume of 0.5 uL to 3.0 uL for many selective soldering nozzles, but verify against your paste or flux datasheet and residue requirements. Too little flux gives poor wetting and pinholes; too much flux can cause residue, solder balls, or unstable meniscus behavior.',
    'Flux-on-the-fly means flux is applied immediately before the solder wave or nozzle contact, so the flux is active when the joint reaches wetting temperature. The important variables are flux volume, pattern, viscosity, and solids content. A practical starting flux density is 0.05 mg/mm^2 to 0.25 mg/mm^2 on the joint area, or a joint volume of 0.5 uL to 3.0 uL for many selective soldering nozzles, but verify against your paste or flux datasheet and residue requirements. Too little flux gives poor wetting and pinholes; too much flux can cause residue, solder balls, or unstable meniscus behavior. Note the basis before comparing numbers: this figure is flux per unit of joint area for selective application, whereas the wave-soldering figures in Module 09 are flux solids per unit of board bottom area, so the two numbers must not be compared directly.'
  );

  // ---- module 09 questions -------------------------------------------
  const q_m09l01 = findQuestion(questions, 'q-m09l01-02');
  q_m09l01.prompt = "Using the lesson rule of thumb that flux amount is the mass of flux solids divided by the wetted area, and that a typical no-clean wave target is 500-1500 µg/in² of solids (about 0.08-0.23 mg/cm²), a board has a wetted area of 250 cm² and a weighed witness card gains 37.5 mg of flux solids. What is the flux amount and the appropriate setting decision?";
  q_m09l01.options = [
    { id: 'a', text: '0.15 mg/cm² (about 970 µg/in²); within the typical target, so keep the flux amount.' },
    { id: 'b', text: '1.5 mg/cm²; too high, so reduce the flux amount.' },
    { id: 'c', text: '0.015 mg/cm²; too low, so increase the flux amount.' },
    { id: 'd', text: '0.06 mg/cm²; too low, because the area was divided twice.' }
  ];
  q_m09l01.correct = 'a';
  q_m09l01.explanation = '37.5 mg ÷ 250 cm² = 0.15 mg/cm². Converting the other way, 0.15 mg/cm² × 6.45 cm²/in² = 0.97 mg/in² = about 970 µg/in², which is inside the 500-1500 µg/in² target, so the setting is kept. Option b is a factor-of-ten error, option c is a factor-of-ten low error, and option d divides by the area twice. Always confirm whether a quoted figure is on a solids basis or a liquid basis: figures such as 0.5-1.0 g/ft² are quoted per unit of liquid and are several times larger.';
  note('FIX V8h q-m09l01-02 rewritten on the flux-solids basis');

  const q_m09l02 = findQuestion(questions, 'q-m09l02-02');
  q_m09l02.prompt = 'A verification card is used to check flux amount. The lesson formula is flux amount = (mass after spray − mass before spray) / wetted area. A run records a card mass of 10.000 g before spray and 10.012 g after spray over a wetted area of 80 cm². What is the measured flux amount?';
  q_m09l02.options = [
    { id: 'a', text: '0.15 mg/cm²' },
    { id: 'b', text: '0.67 mg/cm²' },
    { id: 'c', text: '1.5 mg/cm²' },
    { id: 'd', text: '120 mg/cm²' }
  ];
  q_m09l02.correct = 'a';
  q_m09l02.explanation = 'The mass difference is 10.012 g − 10.000 g = 0.012 g, which is 12 mg. Dividing by the wetted area gives 12 mg / 80 cm² = 0.15 mg/cm², which is about 970 µg/in² of solids and inside the 500-1500 µg/in² wave target. Option c is the same mass gain with a decimal error, option b inverts the ratio, and option d omits division by area. If the card captures flux solution rather than solids, multiply by the solids fraction before comparing with the target.';
  note('FIX V8i q-m09l02-02 rewritten on the flux-solids basis');

  const q_m09l07 = findQuestion(questions, 'q-m09l07-02');
  q_m09l07.prompt = "Using the lesson's rule of thumb that flux coverage should be 0.15 mg/cm² of flux solids on the board area and that the flux is 2.0% solids with a density of about 1 g/mL, calculate the flux volume for the lesson's rule-of-thumb reference board area of 100 cm².";
  q_m09l07.options = [
    { id: 'a', text: '0.75 mL' },
    { id: 'b', text: '0.075 mL' },
    { id: 'c', text: '7.5 mL' },
    { id: 'd', text: '15 mL' }
  ];
  q_m09l07.correct = 'a';
  q_m09l07.explanation = 'Flux solids = 100 cm² × 0.15 mg/cm² = 15 mg. At 2.0% solids the solution mass is 15 mg ÷ 0.02 = 750 mg, and at about 1 g/mL the volume is 750 mg ÷ 1000 mg/mL = 0.75 mL. Options b and c are factor-of-ten errors, and option d treats the solids mass as if it were the solution volume.';
  note('FIX V8j q-m09l07-02 rewritten on the flux-solids basis');

  // =====================================================================
  // V9 — q-m09l06-02 answer key contradicted its own explanation
  // =====================================================================
  const q_m09l06 = findQuestion(questions, 'q-m09l06-02');
  q_m09l06.prompt = 'A through-hole wave-soldering process uses the lesson rule of thumb that expected fill fraction = 1 − (lead diameter / hole diameter)². If the hole diameter is twice the lead diameter and the required fill is the IPC-A-610 minimum of 75% of barrel height, what is the expected fill fraction and the disposition?';
  q_m09l06.options = [
    { id: 'a', text: '75%; accept, because the calculated fill meets the minimum.' },
    { id: 'b', text: '50%; reject, because the fill is below the minimum.' },
    { id: 'c', text: '25%; reject, because the fill is below the minimum.' },
    { id: 'd', text: '100%; accept, because the lead is centred in the hole.' }
  ];
  q_m09l06.correct = 'a';
  q_m09l06.explanation = 'Expected fill = 1 − (1/2)² = 1 − 0.25 = 0.75 = 75%, which meets the IPC-A-610 minimum vertical barrel fill of 75% for Class 2 and Class 3, so the disposition is accept when the other workmanship criteria are met. Option b uses linear clearance instead of area, option c is the lead-area fraction, and option d ignores the lead volume. IPC-A-610 does not set a 100% class limit; a 100% requirement is contractual.';
  note('FIX V9 q-m09l06-02 rewritten: the previous key (b) contradicted the explanation and the arithmetic, and the old rule of thumb added two diameters to estimate a fill height');

  // =====================================================================
  // V10 — J-STD-005 Type 3 powder in-range requirement
  // =====================================================================
  const q_m01l05 = findQuestion(questions, 'q-m01l05-02');
  q_m01l05.prompt = 'IPC J-STD-005 Type 3 powder requires 80% of the powder to be between 25 and 45 µm, with no more than 10% below 25 µm and no more than 10% above 45 µm. A certificate reports that 95% passes the 45 µm sieve and 95% is retained on the 25 µm sieve. Using the lesson formula for minimum overlap, what is the minimum percentage within 25-45 µm and the appropriate disposition?';
  q_m01l05.options = [
    { id: 'a', text: '90%; accept because the certificate proves at least 90% in range, which meets the 80% requirement.' },
    { id: 'b', text: '80%; quarantine because the certificate does not prove the requirement is met.' },
    { id: 'c', text: '100%; accept because all powder is either retained on the 25 µm sieve or passes the 45 µm sieve.' },
    { id: 'd', text: '90%; reject because any excursion below 100% is automatically reject.' }
  ];
  q_m01l05.correct = 'a';
  q_m01l05.explanation = 'The minimum overlap is 95% + 95% − 100% = 90%, so the certificate proves at least 90% of the powder is within 25-45 µm. Because J-STD-005 Type 3 requires 80% minimum in range, the lot is accepted on this evidence. Option b applies the requirement as if it were the measured overlap, option c assumes no outside-size powder, and option d invents a 100% requirement that the standard does not contain.';
  note('FIX V10 q-m01l05-02 rewritten: the previous prompt quoted a 95% in-range requirement for Type 3 powder; the requirement is 80% minimum between 25 and 45 µm');

  // =====================================================================
  // V11 — q-m11l04-02 annular ring minimum
  // =====================================================================
  const q_m11l04 = findQuestion(questions, 'q-m11l04-02');
  q_m11l04.prompt = applyReplace(
    'V11a q-m11l04-02 prompt ring minimum',
    q_m11l04.prompt,
    'IPC-7711/7721 repair acceptance requires the repaired annular ring to meet the IPC-A-610 Class 3 minimum of 0.10 mm.',
    'IPC-7711/7721 repair acceptance requires the repaired annular ring to meet the IPC-A-610 Class 3 minimum of 0.05 mm.'
  );
  q_m11l04.explanation = applyReplace(
    'V11b q-m11l04-02 explanation ring minimum',
    q_m11l04.explanation,
    'Let the Class 3 minimum annular ring be 0.10 mm. The pad diameter exceeds the hole diameter by 2 × 0.10 mm = 0.20 mm. The annular ring is (0.20 mm)/2 = 0.10 mm, which meets the Class 3 minimum, so the joint is repairable with documentation.',
    'Let the Class 3 minimum annular ring be 0.05 mm. The pad diameter exceeds the hole diameter by 2 × 0.05 mm = 0.10 mm. The annular ring is (0.10 mm)/2 = 0.05 mm, which meets the Class 3 minimum, so the joint is repairable with documentation. This matches the 0.05 mm minimum used in the m11l04 worked example; confirm the value against the controlled revision and the assembly drawing.'
  );

  // =====================================================================
  // V12 — cleanliness unit basis and the invented Class 2 limit
  // =====================================================================
  const q_m12l03 = findQuestion(questions, 'q-m12l03-02');
  q_m12l03.prompt = applyReplace(
    'V12a q-m12l03-02 prompt unit basis',
    q_m12l03.prompt,
    'Using IPC-TM-650 2.3.25, a standard 100 in² test area has an acceptance limit of 1.56 µg NaCl eq/in².',
    'Using IPC-TM-650 2.3.25, a standard 100 cm² test area has an acceptance limit of 1.56 µg NaCl eq/cm² (the same level is about 10.06 µg/in²).'
  );
  q_m12l03.options[0].text = applyReplace(
    'V12b q-m12l03-02 option a unit basis',
    q_m12l03.options[0].text,
    'Pass: 156 µg ÷ 100 in² = 1.56 µg/in², which meets the limit.',
    'Pass: 156 µg ÷ 100 cm² = 1.56 µg/cm², which meets the limit.'
  );
  q_m12l03.explanation = applyReplace(
    'V12c q-m12l03-02 explanation unit basis',
    q_m12l03.explanation,
    '156 µg ÷ 100 in² = 1.56 µg/in². The IPC-TM-650 2.3.25 criterion is pass if the level is at or below 1.56 µg/in², so the board passes.',
    '156 µg ÷ 100 cm² = 1.56 µg/cm². The IPC-TM-650 2.3.25 criterion is pass if the level is at or below 1.56 µg/cm², so the board passes. Keep the unit basis straight: 1.56 µg/cm² is the same level as about 10.06 µg/in², so a limit quoted per square inch is roughly 6.45 times larger numerically than the same limit quoted per square centimetre.'
  );

  const q_m12l06 = findQuestion(questions, 'q-m12l06-02');
  q_m12l06.prompt = 'Using IPC-TM-650 2.3.25 and the traditional ROSE acceptance level of 1.56 µg NaCl eq/cm², and the lesson formula ion concentration = total NaCl-equivalent ion mass / wetted area, a board has a measured ion mass equal to that acceptance level multiplied by the wetted area. What is the calculated ion concentration and the disposition?';
  q_m12l06.options = [
    { id: 'a', text: '1.56 µg NaCl eq/cm² — meets the traditional ROSE level; record method, area, blank and units, and confirm the process with SIR evidence.' },
    { id: 'b', text: '3.12 µg NaCl eq/cm² — fails, because the area is counted twice.' },
    { id: 'c', text: '0.78 µg NaCl eq/cm² — fails, because the area is divided twice.' },
    { id: 'd', text: 'Cannot be dispositioned without the product class.' }
  ];
  q_m12l06.correct = 'a';
  q_m12l06.explanation = 'The concentration is (1.56 µg/cm² × area) / area = 1.56 µg NaCl eq/cm², which meets the traditional ROSE acceptance level. J-STD-001 no longer treats a single ROSE number as a pass/fail criterion for every product: it requires objective evidence, normally SIR data, that the specific process is clean enough for the intended life and environment, and high-reliability customers often work tighter than 1.56 µg/cm². Option b double-counts the area, option c divides by it twice, and option d is wrong because the traditional ROSE level is quoted independently of product class, although a customer or product-specific limit may be tighter.';
  note('FIX V12d q-m12l06-02 rewritten: the previous prompt invented a "Class 2 cleanliness limit of 3.12 µg/cm²" that no source supports');

  // =====================================================================
  // V13 — module 06 questions still grade the learner on the wrong
  // premises (2 °C/s ramp limit, a single "245-250 °C" or "217-227 °C"
  // peak window, a 217 °C liquidus, and a fabricated TAL formula).
  // =====================================================================
  const q_m06l02 = findQuestion(questions, 'q-m06l02-02');
  q_m06l02.prompt = "Using the lesson's rule-of-thumb limits (ramp 1-4 °C/s, time above liquidus 60-120 s from the paste datasheet, and peak not above the J-STD-020 classification temperature of 250 °C for a large package), a measured profile for SAC305 ramps from 150 °C to liquidus in 30 s, crosses liquidus upward at 120 s and downward at 210 s, and peaks at 242 °C. Which check fails?";
  q_m06l02.options = [
    { id: 'a', text: 'Ramp rate, because (219 − 150) / 30 = 2.3 °C/s, above the rule-of-thumb limit.' },
    { id: 'b', text: 'Time above liquidus, because 210 − 120 = 90 s, outside the 60-120 s window.' },
    { id: 'c', text: 'Peak, because 242 °C exceeds the classification temperature.' },
    { id: 'd', text: 'None, because all checks pass.' }
  ];
  q_m06l02.correct = 'd';
  q_m06l02.explanation = 'Ramp rate is (219 − 150) / 30 = 2.3 °C/s, inside the 1-4 °C/s range. Time above liquidus is 210 − 120 = 90 s, inside the 60-120 s paste window. Peak margin to the 250 °C classification temperature is 8 °C. All three checks pass, so no profile change is required. Re-verify if the package size changes, because the classification temperature is 260 °C for small packages and 245 °C for very large ones, and remember that the 30 s figure in J-STD-020 is tp, the time within 5 °C of the classification temperature, not the paste-window time above liquidus.';
  note('FIX V13a q-m06l02-02 rewritten: the previous 2 °C/s ramp limit contradicted the lesson and produced a false failure');

  const q_m06l03 = findQuestion(questions, 'q-m06l03-02');
  q_m06l03.prompt = 'Using the J-STD-020 classification temperatures for SAC305 (260 °C small package, 250 °C large package, 245 °C very large package) and the lesson formula minimum margin = min(classification temperature − hottest measured, coolest measured − liquidus), a survey records a coolest part peak of 246 °C and a hottest part peak of 252 °C on a large package. The SAC305 liquidus is 219 °C. What is the minimum margin and the disposition?';
  q_m06l03.options = [
    { id: 'a', text: '−2 °C; the hottest part exceeds the classification temperature, so the profile fails.' },
    { id: 'b', text: '2 °C; passes.' },
    { id: 'c', text: '27 °C; passes.' },
    { id: 'd', text: '6 °C; passes.' }
  ];
  q_m06l03.correct = 'a';
  q_m06l03.explanation = 'min(250 − 252, 246 − 219) = min(−2 °C, 27 °C) = −2 °C. The hottest location exceeds the classification temperature by 2 °C, so the profile fails regardless of the comfortable margin above liquidus at the coolest location. Option b is half the peak-to-peak spread, option c is the coolest-site margin above liquidus only, and option d is the peak spread. The classification temperature depends on package size, so confirm the size before disposition.';
  note('FIX V13b q-m06l03-02 rewritten: there is no single J-STD-020 "245-250 °C SAC305 peak window"');

  const q_m06l04 = findQuestion(questions, 'q-m06l04-02');
  q_m06l04.prompt = 'For a SAC305 board, the cited process guidance gives a maximum ramp rate of 4 °C/s, a liquidus of 219 °C, a J-STD-020 classification temperature of 250 °C for a large package, and a minimum time above liquidus of 60 s. If a heavy-plane board is ramped from the lower soak limit of 150 °C at the maximum allowed ramp rate, what is the minimum elapsed time from that soak exit to the end of the minimum time above liquidus?';
  q_m06l04.options = [
    { id: 'a', text: '77 s' },
    { id: 'b', text: '60 s' },
    { id: 'c', text: '17 s' },
    { id: 'd', text: '92 s' }
  ];
  q_m06l04.correct = 'a';
  q_m06l04.explanation = 'Time to reach liquidus is (219 °C − 150 °C) ÷ 4 °C/s = 17.25 s. The minimum time above liquidus is 60 s, so the minimum elapsed time from soak exit to the end of that interval is 17.25 s + 60 s = 77.25 s, rounded to 77 s. The 92 s option adds the full ramp to the classification temperature plus 60 s, which double-counts time already inside the above-liquidus interval; 60 s ignores the time needed to reach liquidus; 17 s ignores the required time above liquidus.';
  note('FIX V13c q-m06l04-02 rewritten: the previous "peak window of 217-227 °C" is not a real window');

  const q_m06l05 = findQuestion(questions, 'q-m06l05-02');
  q_m06l05.prompt = 'A high-thermal-mass SAC305 board is profiled using process guidance: liquidus 219 °C, peak 245 °C, minimum time above liquidus 60 s, and maximum ramp rate 4 °C/s. If the board ramps from liquidus to peak at the maximum ramp rate and then dwells at peak before cooling, calculate the minimum dwell at peak required so that the time above liquidus just meets the minimum.';
  q_m06l05.options = [
    { id: 'a', text: 'About 54 s' },
    { id: 'b', text: '60 s' },
    { id: 'c', text: 'About 40 s' },
    { id: 'd', text: 'About 88 s' }
  ];
  q_m06l05.correct = 'a';
  q_m06l05.explanation = 'Time above liquidus includes the ramp from liquidus to peak plus the dwell at peak. Ramp time = (245 °C − 219 °C) / 4 °C/s = 6.5 s. Required dwell = 60 s − 6.5 s = 53.5 s, about 54 s. Option b ignores the ramp time above liquidus; option c corresponds to using a 6.5 °C/s ramp rate; option d adds the liquidus-to-peak temperature difference to the required time instead of converting it to time.';
  note('FIX V13d q-m06l05-02 rewritten: liquidus 219 °C, ramp 4 °C/s, and the limits are process guidance not J-STD-020 parameters');

  const q_m06l06 = findQuestion(questions, 'q-m06l06-02');
  q_m06l06.prompt = 'Using the lesson rule that the cooling portion of time above liquidus is (peak temperature − liquidus temperature) / cooling rate, the SAC305 values liquidus 219 °C and peak 245 °C, the paste-window time above liquidus of 60 to 120 s, and a rule-of-thumb cooling rate of 0.2 °C/s, what is the cooling time and the bounded corrective action for a dewetting signature?';
  q_m06l06.options = [
    { id: 'a', text: '130 s; increase the cooling rate to at least 0.22 °C/s to bring time above liquidus into the paste window, then verify by thermocouple.' },
    { id: 'b', text: '26 s; no change is needed because the temperature difference is the time above liquidus, then verify by shear.' },
    { id: 'c', text: '120 s; reduce the cooling rate to the upper paste-window limit, then verify by AOI.' },
    { id: 'd', text: '60 s; raise the peak temperature to reach the lower paste-window limit, then verify by X-ray.' }
  ];
  q_m06l06.correct = 'a';
  q_m06l06.explanation = '245 − 219 = 26 °C; 26 ÷ 0.2 °C/s = 130 s of cooling time, which is longer than the 120 s upper bound of the paste window. The minimum cooling rate to reach 120 s is 26 ÷ 120 ≈ 0.22 °C/s. Option b reports a temperature difference rather than a time, option c moves in the wrong direction, and option d raises the peak, which lengthens rather than shortens the exposure. Note that time above liquidus is a measured profile quantity from IPC-7530 and the paste datasheet, not a J-STD-020 parameter.';
  note('FIX V13e q-m06l06-02 rewritten: the previous prompt presented TAL = (peak − liquidus)/cooling rate as a J-STD-020 formula');

  // =====================================================================
  // V14 — q-m08l01-02: IPC-2221 does not set hole/lead clearance, and
  // IPC-A-610 does not set a 100% Class 3 fill.
  // =====================================================================
  const q_m08l01 = findQuestion(questions, 'q-m08l01-02');
  q_m08l01.prompt = 'Using a rule-of-thumb diametral clearance of 0.30 mm between lead and plated hole and the IPC-A-610 minimum vertical barrel fill, a rule-of-thumb lead diameter of 0.50 mm is used. What plated-hole diameter and expected solder fill should be specified?';
  q_m08l01.options = [
    { id: 'a', text: '0.80 mm plated-hole diameter and at least 75% vertical barrel fill' },
    { id: 'b', text: '0.80 mm plated-hole diameter and 100% expected solder fill' },
    { id: 'c', text: '0.20 mm plated-hole diameter and at least 75% fill' },
    { id: 'd', text: '0.50 mm plated-hole diameter and at least 75% fill' }
  ];
  q_m08l01.correct = 'a';
  q_m08l01.explanation = 'Plated-hole diameter = lead diameter + diametral clearance = 0.50 mm + 0.30 mm = 0.80 mm. IPC-A-610 sets a minimum vertical barrel fill of 75% for both Class 2 and Class 3, with Class 3 additionally requiring visible fillets on both sides; 100% fill is a customer requirement, not an IPC-A-610 class limit. The 0.30 mm clearance is a design rule of thumb rather than an IPC-2221 requirement, so verify it against your drill, plating and lead tolerances.';
  note('FIX V14 q-m08l01-02 rewritten: removed the IPC-2221 attribution and the "Class 3 expects 100% fill" claim');

  // =====================================================================
  // V15 — q-m11l02-02: a "liquidus + 50 °C" tip rule contradicts both
  // m11l01 (340-360 °C) and m11l02 (330-350 °C) and uses the solidus.
  // =====================================================================
  const q_m11l02 = findQuestion(questions, 'q-m11l02-02');
  q_m11l02.prompt = 'A SAC305 lead-free through-hole joint is hand-soldered on a board preheated to 100 °C. Using the lesson rule-of-thumb margin of about 120 °C above the SAC305 liquidus of 219 °C, which places the setpoint in the 330-350 °C range taught for SAC-type solder on a preheated board, and a dwell of 2 s, what temperature-time thermal budget is applied if thermal budget = tip temperature × dwell time?';
  q_m11l02.options = [
    { id: 'a', text: '678 °C·s' },
    { id: 'b', text: '339 °C·s' },
    { id: 'c', text: '558 °C·s' },
    { id: 'd', text: '478 °C·s' }
  ];
  q_m11l02.correct = 'a';
  q_m11l02.explanation = 'Tip temperature = 219 °C + 120 °C = 339 °C, which sits inside the 330-350 °C range taught for SAC-type solder on a preheated board. Thermal budget = 339 °C × 2 s = 678 °C·s. Option b omits the dwell time, option c uses half the margin, and option d subtracts the board preheat, which is already accounted for in the tip setpoint. Note that 217 °C is the SAC305 solidus, not the liquidus.';
  note('FIX V15 q-m11l02-02 rewritten: the previous "liquidus 217 °C" and "+50 °C" tip rule contradicted m11l01 and m11l02');

  // =====================================================================
  // V16 — m06l01 still carried the single "245 °C qualified peak" and
  // attributed time above liquidus to J-STD-020 in two more blocks.
  // =====================================================================
  const m06l01x = findLesson(lessons, 'm06l01');
  findTheory(m06l01x, 'Peak temperature').p = applyReplace(
    'V16a m06l01 peak temperature classification',
    findTheory(m06l01x, 'Peak temperature').p,
    'For SAC305, J-STD-020 specifies a qualification peak temperature of 245 °C. Production peaks are often set below the qualified peak with margin, and should be verified with thermocouples on the actual board. Exceeding the qualified peak can damage components, delaminate packages, or create excessive intermetallic growth.',
    'For SAC305, J-STD-020 does not give one peak temperature: it gives classification temperatures by package size, 260 °C for small packages, 250 °C for large packages and 245 °C for very large packages, each with tp, the time within 5 °C of that temperature, limited to 30-40 s. Production peaks are often set below the classification temperature with margin, and should be verified with thermocouples on the actual board. Exceeding the classification temperature can damage components, delaminate packages, or create excessive intermetallic growth.'
  );
  findTheory(m06l01x, 'Judging against J-STD-020').p = applyReplace(
    'V16b m06l01 judging the profile',
    findTheory(m06l01x, 'Judging against J-STD-020').p,
    'To judge a measured profile against J-STD-020, compare the measured peak temperature and time above liquidus to the limits for the component and alloy in the current revision. The comparison should use the worst-case measured point, not the oven profile or a single thermocouple. If the measured peak or time above liquidus exceeds the qualified limit, the assembly is not compliant unless a separate qualification supports the exposure.',
    'To judge a measured profile, compare the measured peak against the J-STD-020 classification temperature for the package size, and the measured time above liquidus against the paste-datasheet window, typically 60-150 s under IPC-7530 guidance. The comparison should use the worst-case measured point, not the oven profile or a single thermocouple. If the measured peak exceeds the classification temperature, or the time above liquidus falls outside the datasheet window, the assembly is not compliant unless a separate qualification supports the exposure.'
  );
  m06l01x.content.calc.task = applyReplace(
    'V16c m06l01 calc task basis',
    m06l01x.content.calc.task,
    'A SAC305 paste datasheet gives liquidus 217 °C. A 1.6 mm board with 70 µm copper and a 12 mm BGA is reflowed. The target is to stay within J-STD-020 peak 245 °C and time above liquidus 60-150 s.',
    'A SAC305 paste datasheet gives a solidus of 217 °C and a liquidus of 219 °C. A 1.6 mm board with 70 µm copper and a 12 mm BGA is reflowed. The target is to stay within the J-STD-020 classification temperature for the package size and a time above liquidus of 60-150 s from the paste datasheet.'
  );
  m06l01x.content.calc.solution = applyReplace(
    'V16d m06l01 calc solution',
    m06l01x.content.calc.solution,
    '1. Confirm alloy liquidus from paste datasheet: 217 °C. 2. Set soak target from paste datasheet, e.g. 140-180 °C for 90-120 s; choose 165 °C for 90 s for this board. 3. Ramp to liquidus; measured ramp 1.5 °C/s is within typical practice, verify equipment. 4. Calculate time above liquidus from measured data: time when temperature exceeds 217 °C until it falls below 217 °C = 75 s. 5. Compare peak 242 °C to J-STD-020 qualified peak of 245 °C: pass, with 3 °C margin. 6. Compare time above liquidus 75 s to J-STD-020 window 60-150 s: pass. 7. Check cooling 2.5 °C/s against paste and equipment datasheet; if warpage or cracking is observed, slow cooling. 8. Conclusion: measured profile passes J-STD-020 peak and time above liquidus limits for this board, but production limits should be qualified and monitored.',
    '1. Confirm alloy liquidus from the paste datasheet: SAC305 has a solidus of 217 °C and a liquidus of 219 °C, so time above liquidus is measured from the 219 °C crossing. 2. Set soak target from the paste datasheet, e.g. 140-180 °C for 90-120 s; choose 165 °C for 90 s for this board. 3. Ramp to liquidus; measured ramp 1.5 °C/s is within typical practice, verify against the paste and oven datasheet. 4. Calculate time above liquidus from measured data: time when temperature exceeds 219 °C until it falls below 219 °C = 75 s. 5. Compare peak 242 °C with the J-STD-020 classification temperature for the package size: 242 °C passes for a small package (260 °C) or a large package (250 °C) and would fail for a very large package (245 °C), so confirm the package size before disposition. 6. Compare time above liquidus 75 s with the paste-datasheet window of 60-150 s: pass. This window is IPC-7530 and datasheet guidance, not a J-STD-020 parameter. 7. Check cooling 2.5 °C/s against the paste and equipment datasheet; if warpage or cracking is observed, slow cooling. The J-STD-020 classification ramp-down limit is 6 °C/s or less. 8. Conclusion: the measured profile passes the peak ceiling and the paste time-above-liquidus window for this board, but the package size must be confirmed for the peak ceiling, and production limits should be qualified and monitored.'
  );

  // =====================================================================
  // V17 — m06l07 liquidus basis
  // =====================================================================
  const m06l07 = findLesson(lessons, 'm06l07');
  m06l07.content.calc.task = applyReplace(
    'V17 m06l07 calc task liquidus',
    m06l07.content.calc.task,
    'The paste datasheet gives liquidus 217 °C, recommended time above liquidus 60-90 s, and recommended peak 245-250 °C.',
    'The paste datasheet gives a solidus of 217 °C and a liquidus of 219 °C, recommended time above liquidus 60-90 s, and recommended peak 245-250 °C.'
  );

  // =====================================================================
  // V18 — m09l03 justification sentence still on the liquid basis
  // =====================================================================
  const m09l03x = findLesson(lessons, 'm09l03');
  m09l03x.content.calc.solution = applyReplace(
    'V18 m09l03 calc justification flux density',
    m09l03x.content.calc.solution,
    'A flux density of 1.0 mg/cm2 is enough to wet pads and leads without excessive fog.',
    'A flux-solids density of 0.15 mg/cm2 is enough to wet pads and leads without excessive fog.'
  );

  // =====================================================================
  // V19 — m06l02 theory still carried "peak 245 °C with a maximum TAL of
  // 30 s" and a 217 °C liquidus.
  // =====================================================================
  const m06l02t = findLesson(lessons, 'm06l02');
  findTheory(m06l02t, 'Reflow and time above liquidus: joint formation').p = applyReplace(
    'V19a m06l02 TAL block',
    findTheory(m06l02t, 'Reflow and time above liquidus: joint formation').p,
    'For SAC305, liquidus is commonly taken as 217 °C; for SnPb, 183 °C. TAL that is too short produces insufficient intermetallic formation and weak joints; too long promotes excessive intermetallic growth, grain coarsening, and can damage component finishes. IPC J-STD-020 provides peak temperature and TAL limits by package type and moisture sensitivity level. For example, for many large MSL 3 packages the peak reflow temperature for SAC is specified as 245 °C with a maximum TAL above 217 °C of 30 seconds, but you must check the exact table for your component\'s body size and MSL.',
    'For SAC305, solidus is 217 °C and liquidus is 219 °C; for SnPb eutectic, liquidus is 183 °C. TAL that is too short produces insufficient intermetallic formation and weak joints; too long promotes excessive intermetallic growth, grain coarsening, and can damage component finishes. The TAL window is process guidance from IPC-7530 and the paste datasheet, typically 60-120 s or 60-150 s. J-STD-020 does not set a board-assembly TAL limit: its own time parameter is tp, the time within 5 °C of the classification temperature, limited to 30-40 s for large and very large packages and 40 s for small ones, and its peak figures are classification temperatures by package size, 260 °C small, 250 °C large and 245 °C very large. Check the classification temperature for your component\'s body size and MSL before comparing a measured peak.'
  );
  findTheory(m06l02t, 'Reading the profile against your hardware').p = applyReplace(
    'V19b m06l02 comparison basis',
    findTheory(m06l02t, 'Reading the profile against your hardware').p,
    'compare the measured ramp, soak, TAL, peak, and cooling against the limits from your paste datasheet and IPC J-STD-020 for the specific components.',
    'compare the measured ramp, soak, TAL, peak, and cooling against the TAL window from your paste datasheet and the J-STD-020 classification temperature for the package size, which is the peak ceiling.'
  );

  // =====================================================================
  // V20 — align q-m06l02-02 with the lesson's 1-3 °C/s ramp guidance
  // =====================================================================
  const q_m06l02x = findQuestion(questions, 'q-m06l02-02');
  q_m06l02x.prompt = applyReplace(
    'V20a q-m06l02-02 prompt ramp limit',
    q_m06l02x.prompt,
    "Using the lesson's rule-of-thumb limits (ramp 1-4 °C/s,",
    "Using the lesson's rule-of-thumb limits (ramp 1-3 °C/s,"
  );
  q_m06l02x.options[0].text = applyReplace(
    'V20b q-m06l02-02 option a',
    q_m06l02x.options[0].text,
    'above the rule-of-thumb limit.',
    'above the 1-3 °C/s rule-of-thumb limit.'
  );
  q_m06l02x.explanation = applyReplace(
    'V20c q-m06l02-02 explanation ramp limit',
    q_m06l02x.explanation,
    'Ramp rate is (219 − 150) / 30 = 2.3 °C/s, inside the 1-4 °C/s range.',
    'Ramp rate is (219 − 150) / 30 = 2.3 °C/s, inside the 1-3 °C/s range taught in the lesson.'
  );

  // =====================================================================
  // V21 — m10l02 calc sentence gains the same basis note as its theory
  // =====================================================================
  const m10l02x = findLesson(lessons, 'm10l02');
  m10l02x.content.calc.solution = applyReplace(
    'V21 m10l02 calc basis note',
    m10l02x.content.calc.solution,
    'Use flux-on-the-fly with 0.10 mg/mm^2 to 0.20 mg/mm^2 on the joint area; for the ground pad, aim near 0.20 mg/mm^2 if residue allows.',
    'Use flux-on-the-fly with 0.10 mg/mm^2 to 0.20 mg/mm^2 on the joint area (a per-joint-area basis, not the flux-solids-per-board-area basis used for wave soldering in Module 09); for the ground pad, aim near 0.20 mg/mm^2 if residue allows.'
  );

  // =====================================================================
  // V22 — m06l04 task still ramps to 217 °C (the solidus) while its own
  // solution now ramps to 219 °C.
  // =====================================================================
  const m06l04x = findLesson(lessons, 'm06l04');
  m06l04x.content.calc.task = applyReplace(
    'V22 m06l04 calc task ramp target',
    m06l04x.content.calc.task,
    'A pad-level profile shows ramp from 150 °C to 217 °C in 37 s, time above 217 °C of 85 s, and peak 238 °C.',
    'A pad-level profile shows ramp from 150 °C to 219 °C in 37 s, time above 219 °C of 85 s, and peak 238 °C.'
  );

  // =====================================================================
  // Sources added by this round
  // =====================================================================
  const NEW_SOURCES = [
    { id: 'src-015', type: 'standard', title: 'J-STD-005 Requirements for Soldering Pastes (powder size distribution, Type 3 = 25-45 µm, 80% minimum in range)', edition: 'TBD-REVIEW', section: 'TBD-REVIEW', licenseNote: 'paraphrase only', verifiedBy: 'TBD-REVIEW', verifiedOn: null },
    { id: 'src-016', type: 'standard', title: 'IPC-A-610H section 10 — through-hole solder fill (75% minimum vertical barrel fill, Class 2 and Class 3)', edition: 'TBD-REVIEW', section: 'TBD-REVIEW', licenseNote: 'paraphrase only', verifiedBy: 'TBD-REVIEW', verifiedOn: null },
    { id: 'src-017', type: 'standard', title: 'J-STD-020 classification temperatures (260/250/245 °C by package size, tp 30-40 s, ramp-down ≤ 6 °C/s)', edition: 'TBD-REVIEW', section: 'TBD-REVIEW', licenseNote: 'paraphrase only', verifiedBy: 'TBD-REVIEW', verifiedOn: null }
  ];
  let added = 0;
  NEW_SOURCES.forEach(function (s) {
    if (sources.some(function (x) { return x.id === s.id; })) return;
    sources.push(s);
    added++;
  });
  note('sources registry: ' + added + ' entries added (' + sources.length + ' total)');

  const ATTACH = {
    m02l02: ['src-003'], m02l04: ['src-003'], m02l06: ['src-003'],
    m03l04: ['src-004'], m06l01: ['src-005', 'src-008'], m06l02: ['src-005', 'src-008'],
    m06l04: ['src-005', 'src-008'], m06l05: ['src-005', 'src-008'],
    m08l05: ['src-016'], m09l02: ['src-014'], m09l03: ['src-014'],
    m09l07: ['src-014'], m10l02: ['src-014'], m11l04: ['src-009'],
    m01l05: ['src-015']
  };
  let attached = 0;
  Object.keys(ATTACH).forEach(function (lid) {
    const l = findLesson(lessons, lid);
    if (!Array.isArray(l.sources)) l.sources = [];
    ATTACH[lid].forEach(function (ref) {
      if (l.sources.indexOf(ref) === -1) { l.sources.push(ref); attached++; }
    });
  });
  note('source refs attached to lessons: ' + attached);

  // ---------------------------------------------------------------------
  backup(FILES.lessons);
  backup(FILES.questions);
  backup(FILES.sources);
  writeJson(FILES.lessons, lessons);
  writeJson(FILES.questions, questions);
  writeJson(FILES.sources, sources);

  console.log('apply-verification-fixes: done (' + log.length + ' actions).');
  console.log('  next: node scripts/embed.js && node scripts/check-course.js && node scripts/gates.js');
}

function backup(file) {
  const bak = file + '.bak2';
  if (!fs.existsSync(bak)) fs.copyFileSync(file, bak);
}

try { main(); } catch (e) {
  console.error('apply-verification-fixes: FAILED — ' + e.message);
  process.exit(1);
}
