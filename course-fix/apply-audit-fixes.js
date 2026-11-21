#!/usr/bin/env node
'use strict';
/*
 * apply-audit-fixes.js — third fix round (cross-consistency pass).
 *
 * Rounds 1 and 2 verified each lesson and each question in isolation. This
 * pass re-reads every module, lesson, question and answer and checks them
 * against each other and against the source standards, which is a different
 * class of defect: a number can be individually defensible and still
 * contradict the same number taught in a neighbouring lesson, or a citation
 * can name a standard that does not cover the subject.
 *
 * Findings addressed (see COURSE_FIXES.md for the full audit):
 *   W1  m02l01 listed "MSL 6 12 h". J-STD-020/033 give MSL 6 no floor life at
 *       all: it is mandatory bake before use, with the post-bake reflow
 *       window taken from the label. The lesson also contradicted m02l02,
 *       m02l03 and m02l04, which all say MSL 6 requires bake before use.
 *   W2  m02l06 theory quoted "125 C for 24 h" as a J-STD-033 high-temperature
 *       bake. Table 4-1 user-bake times at 125 C are indexed to package body
 *       thickness: 8 h up to 1.4 mm, 18 h for 1.4-2.0 mm, 48 h for
 *       2.0-4.5 mm. The 24 h figure is the supplier dry-pack condition
 *       (MET = 24 h), not a user bake, and it contradicted m02l04.
 *   W3  Same error inside the m02l06 worked example.
 *   W4  Same error in q-m02l06-02, which graded the learner on a 24 h bake.
 *   W5  m01l03 built an ISO 2859-1 plan as "code letter L, n = 80, Ac = 2,
 *       Re = 3". Code letter L is a sample of 200; at AQL 1.0% it is
 *       Ac = 5, Re = 6. The n = 80 / Ac = 2 / Re = 3 triple is code letter J,
 *       which is the level I letter for that lot band, not level II. The two
 *       quiz questions in module 01 (q-m01l03-02 and q-m01l07-02) already
 *       used the correct values, so the lesson was the outlier.
 *   W6  q-m03l02-02 defined aspect ratio as stencil thickness / aperture
 *       width, the inverse of the definition used in m03l02 and in
 *       q-m03l01-02, q-m03l04-02 and q-m03l05-02.
 *   W7  q-m03l01-02 judged an area ratio of 0.25 against "the rule-of-thumb
 *       release threshold of 1.5"; 1.5 is the aspect-ratio rule of thumb,
 *       the area-ratio minimum is 0.66.
 *   W8  m06l05 stated that nitrogen "does not change the SnAgCu liquidus of
 *       217 C"; the same lesson's first block correctly says solidus 217 C
 *       and liquidus 219 C.
 *   W9  m09l07 step 8 set the wave pot temperature "above the SAC305
 *       liquidus of 217 C"; 217 C is the solidus.
 *   W10 m02l05 cited "ANSI/ESD STM97.7 and ANSI/ESD STM97.8" for ionizer
 *       qualification. Those documents do not cover ionization; the ESDA /
 *       IEC equivalency chart maps ionization to ANSI/ESD STM3.1
 *       (IEC 61340-4-7), which the same sentence already names.
 *
 * Every fix is a guarded exact-string replacement: if the expected source
 * text is not found the script fails loudly, so it is safe to re-run.
 *
 * Usage: node scripts/apply-audit-fixes.js [dataDir]
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
  console.log('apply-audit-fixes: dataDir=' + dataDir);
  const lessons = readJson(FILES.lessons);
  const questions = readJson(FILES.questions);
  const sources = readJson(FILES.sources);

  // =====================================================================
  // W1 — MSL 6 has no floor life
  // =====================================================================
  const m02l01 = findLesson(lessons, 'm02l01');
  findTheory(m02l01, 'MSL rating and floor life').p = applyReplace(
    'W1 m02l01 MSL 6 floor life',
    findTheory(m02l01, 'MSL rating and floor life').p,
    'MSL 5a 24 h; MSL 6 12 h. These values are package-level limits, not a guarantee that every device will fail after the limit; they are the control limits used to prevent moisture-related reflow damage.',
    'MSL 5a 24 h; MSL 6 has no floor life and is mandatory bake before use, with the post-bake reflow window taken from the label. These values are package-level limits, not a guarantee that every device will fail after the limit; they are the control limits used to prevent moisture-related reflow damage.'
  );

  // =====================================================================
  // W2/W3 — the J-STD-033 125 C bake is indexed to body thickness
  // =====================================================================
  const m02l06 = findLesson(lessons, 'm02l06');
  findTheory(m02l06, 'Bake conditions by package type').p = applyReplace(
    'W2 m02l06 bake table',
    findTheory(m02l06, 'Bake conditions by package type').p,
    'A common high-temperature condition is 125 °C for 24 h, which may be suitable for trays, tubes, or waffle packs that can withstand the temperature. For tape and reel, IPC/JEDEC J-STD-033 also provides a lower-temperature long bake such as 40 °C for 168 h when the tape, reel, labels, or cover tape cannot tolerate higher temperature.',
    'For loose parts in trays, tubes or waffle packs whose carriers and components are rated for it, the 125 °C column of the bake table is indexed to package body thickness: 8 h for a body up to 1.4 mm, 18 h for 1.4 to 2.0 mm and 48 h for 2.0 to 4.5 mm. The 24 h figure sometimes quoted for a 125 °C bake is the supplier dry-pack condition, not a user bake, so do not use it as a production recipe. For tape and reel, IPC/JEDEC J-STD-033 also provides a lower-temperature long bake at 40 °C, roughly 9 days for a body up to 1.4 mm, 11 days for 1.4 to 2.0 mm and 38 days for 2.0 to 4.5 mm, because the tape, reel, labels and cover tape cannot tolerate higher temperature. Cumulative bake time above 90 °C is limited to 96 h unless the supplier states otherwise.'
  );
  m02l06.content.calc.solution = applyReplace(
    'W3 m02l06 calc bake step',
    m02l06.content.calc.solution,
    'If the carrier cannot withstand 125 °C, use the IPC/JEDEC J-STD-033 lower-temperature long bake of 40 °C for 168 h. If the component and carrier datasheets allow 125 °C, the IPC/JEDEC J-STD-033 high-temperature bake of 125 °C for 24 h may be used. For this case, choose 40 °C for 168 h as the conservative tape and reel condition.',
    'If the carrier cannot withstand 125 °C, use the IPC/JEDEC J-STD-033 lower-temperature long bake at 40 °C, which is roughly 9 days for a body up to 1.4 mm and therefore does not fit a short reflow window. If the component and carrier datasheets allow 125 °C, the IPC/JEDEC J-STD-033 125 °C column applies only to loose parts in trays or tubes and is indexed to body thickness: 8 h up to 1.4 mm, 18 h for 1.4 to 2.0 mm, 48 h for 2.0 to 4.5 mm. For this case, choose the 40 °C long bake as the conservative tape-and-reel condition, or de-reel, bake the loose parts at 125 °C for the thickness-indexed time and re-reel; verify the chosen route against the J-STD-033 bake table, the tape datasheet and the reflow window.'
  );

  // =====================================================================
  // W4 — q-m02l06-02 graded the learner on a 24 h bake
  // =====================================================================
  const q_m02l06 = findQuestion(questions, 'q-m02l06-02');
  q_m02l06.options[0].text = applyReplace(
    'W4a q-m02l06-02 option a',
    q_m02l06.options[0].text,
    'bake remaining unplaced components at the package-specific bake condition, e.g., 125°C for 24 h for MSL 3 plastic, then return to dry storage at ≤30°C/60%RH with desiccant/HIC.',
    'bake remaining unplaced components at the package-specific bake condition from J-STD-033 Table 4-1, e.g., 125°C for 8 h for a body up to 1.4 mm, 18 h for 1.4-2.0 mm or 48 h for 2.0-4.5 mm, or the 40 °C long bake if the carrier cannot take 125 °C, then return to dry storage at ≤30°C/60%RH with desiccant and HIC.'
  );
  q_m02l06.options[1].text = applyReplace(
    'W4b q-m02l06-02 option b',
    q_m02l06.options[1].text,
    'One full floor life over; bake at 125°C for 24 h.',
    'One full floor life over; bake at 125°C for 8 h.'
  );
  q_m02l06.explanation = applyReplace(
    'W4c q-m02l06-02 explanation',
    q_m02l06.explanation,
    'for MSL 3 plastic packages the named standard bake condition is 125°C for 24 h. Distractors misapply the floor-life subtraction or assume prior bake resets exposure.',
    'the bake condition comes from J-STD-033 Table 4-1 and is indexed to package body thickness, not to the MSL number: 125°C for 8 h up to 1.4 mm, 18 h for 1.4-2.0 mm and 48 h for 2.0-4.5 mm, with the 40 °C long bake (about 9-38 days) reserved for carriers that cannot take 125 °C. Cumulative bake time above 90 °C is limited to 96 h unless the supplier states otherwise, and the 24 h figure sometimes quoted for a 125 °C bake is the supplier dry-pack condition, not a user bake. Distractors misapply the floor-life subtraction or assume prior bake resets exposure.'
  );

  // =====================================================================
  // W5 — ISO 2859-1 code letter L is a sample of 200
  // =====================================================================
  const m01l03 = findLesson(lessons, 'm01l03');
  findTheory(m01l03, 'Build the plan from lot size, level, and AQL').p = applyReplace(
    'W5a m01l03 sampling plan theory',
    findTheory(m01l03, 'Build the plan from lot size, level, and AQL').p,
    'In ISO 2859-1, a lot of 3201 to 10000 units at general inspection level II gives code letter L, which corresponds to a sample size of 80 units. For an AQL of 1.0% defective under normal single sampling, the accept number is 2 and the reject number is 3. The plan says inspect 80 units, accept the lot if 2 or fewer defective units are found, and reject if 3 or more are found.',
    'In ISO 2859-1, a lot of 3201 to 10000 units at general inspection level II gives code letter L, which corresponds to a sample size of 200 units. For an AQL of 1.0% defective under normal single sampling, the accept number is 5 and the reject number is 6. The plan says inspect 200 units, accept the lot if 5 or fewer defective units are found, and reject if 6 or more are found. The code letter depends on the inspection level, so the same lot band gives code letter J (n = 80, Ac = 2, Re = 3 at AQL 1.0%) at level I and code letter M (n = 315) at level III; always read the level and the lot band together before looking up the sample size.'
  );
  m01l03.content.calc.solution = applyReplace(
    'W5b m01l03 calc sampling plan',
    m01l03.content.calc.solution,
    '4. Find sample size: code letter L corresponds to n = 80 boards. 5. Select AQL: 1.0% defective. 6. Read accept/reject numbers for n = 80 and AQL 1.0%: Ac = 2, Re = 3. 7. Rule: inspect 80 boards; accept if defective boards <= 2; reject if defective boards >= 3.',
    '4. Find sample size: code letter L corresponds to n = 200 boards. 5. Select AQL: 1.0% defective. 6. Read accept/reject numbers for n = 200 and AQL 1.0%: Ac = 5, Re = 6. 7. Rule: inspect 200 boards; accept if defective boards <= 5; reject if defective boards >= 6.'
  );

  // =====================================================================
  // W6/W7 — aspect-ratio definition and the 0.66 / 1.5 thresholds
  // =====================================================================
  const q_m03l02 = findQuestion(questions, 'q-m03l02-02');
  q_m03l02.prompt = applyReplace(
    'W6a q-m03l02-02 prompt aspect ratio',
    q_m03l02.prompt,
    'aspect ratio = stencil thickness / aperture width,',
    'aspect ratio = aperture width / stencil thickness,'
  );
  q_m03l02.explanation = applyReplace(
    'W6b q-m03l02-02 explanation aspect ratio',
    q_m03l02.explanation,
    'while aspect ratio = 0.12 mm / 0.10 mm = 1.2, so option d confuses aspect ratio with area ratio. By the usual rule of thumb, the low area ratio and high aspect ratio indicate poor paste release; option b inverts the area-ratio calculation and option c misplaces the decimal in volume.',
    'and aspect ratio = 0.10 mm / 0.12 mm = 0.83, so option d is neither the area ratio nor the aspect ratio. By the usual rule of thumb, both indices fail: the area ratio of 0.21 is below the 0.66 minimum and the aspect ratio of 0.83 is below the 1.5 minimum, so paste release is poor. Option b inverts the area-ratio calculation and option c misplaces the decimal in volume.'
  );
  const q_m03l01 = findQuestion(questions, 'q-m03l01-02');
  q_m03l01.explanation = applyReplace(
    'W7 q-m03l01-02 area-ratio threshold',
    q_m03l01.explanation,
    'Because the area ratio is below the rule-of-thumb release threshold of 1.5, release is inadequate;',
    'Because the area ratio is below the rule-of-thumb release minimum of 0.66 (and the aspect ratio of 1 is also below the 1.5 minimum), release is inadequate;'
  );

  // =====================================================================
  // W8 — nitrogen does not change the liquidus, and 217 C is the solidus
  // =====================================================================
  const m06l05 = findLesson(lessons, 'm06l05');
  findTheory(m06l05, 'Nitrogen changes oxidation, not the liquidus').p = applyReplace(
    'W8 m06l05 nitrogen liquidus',
    findTheory(m06l05, 'Nitrogen changes oxidation, not the liquidus').p,
    'It does not change the SnAgCu liquidus of 217 C or the SnPb liquidus of 183 C.',
    'It does not change the SnAgCu liquidus of 219 C (217 C is the solidus) or the SnPb liquidus of 183 C.'
  );

  // =====================================================================
  // W9 — m09l07 pot temperature reference
  // =====================================================================
  const m09l07 = findLesson(lessons, 'm09l07');
  m09l07.content.calc.solution = applyReplace(
    'W9 m09l07 pot temperature liquidus',
    m09l07.content.calc.solution,
    'For SAC305, use 255 °C, above the SAC305 liquidus of 217 °C, and verify against the alloy and equipment datasheet.',
    'For SAC305, use 255 °C, above the SAC305 liquidus of 219 °C (217 °C is the solidus), and verify against the alloy and equipment datasheet.'
  );

  // =====================================================================
  // W10 — ionizer qualification standard
  // =====================================================================
  const m02l05 = findLesson(lessons, 'm02l05');
  findTheory(m02l05, 'Ionization for isolated conductors and insulators').p = applyReplace(
    'W10 m02l05 ionizer standard',
    findTheory(m02l05, 'Ionization for isolated conductors and insulators').p,
    'ANSI/ESD STM3.1 covers ionization, and performance qualification can be evaluated using ANSI/ESD STM97.7 and ANSI/ESD STM97.8.',
    'ANSI/ESD STM3.1 covers ionization, and performance qualification and periodic verification are evaluated against the offset-voltage (balance) and discharge-time limits in that method, which is the ESDA counterpart of IEC 61340-4-7. Footwear and flooring systems, by contrast, are qualified under ANSI/ESD STM97.1 and STM97.2.'
  );

  // =====================================================================
  // W11 — m14l03 cited IPC-7711/7712; the rework pair used everywhere else
  // in the course is IPC-7711/7721.
  // =====================================================================
  const m14l03 = findLesson(lessons, 'm14l03');
  findTheory(m14l03, 'Closing the loop').p = applyReplace(
    'W11a m14l03 theory rework standard',
    findTheory(m14l03, 'Closing the loop').p,
    'Rework should follow IPC-7711/7712 and be documented.',
    'Rework should follow IPC-7711/7721 and be documented.'
  );
  m14l03.content.calc.solution = applyReplace(
    'W11b m14l03 calc rework standard',
    m14l03.content.calc.solution,
    'rework per IPC-7711/7712;',
    'rework per IPC-7711/7721;'
  );

  writeJson(FILES.lessons, lessons);
  writeJson(FILES.questions, questions);
  writeJson(FILES.sources, sources);
  console.log('apply-audit-fixes: done (' + log.length + ' actions).');
}

try { main(); } catch (e) {
  console.error('apply-audit-fixes: FAILED — ' + e.message);
  process.exit(1);
}
