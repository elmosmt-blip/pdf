#!/usr/bin/env node
// apply-sampling-fix.js — W17: the m01l03 worked example read the wrong row of
// the ISO 2859-1 code-letter table.
//
// The lesson's own table (fixed in W12) is correct:
//   501-1200    G (32)  J (80)  K (125)
//   1201-3200   H (50)  K (125) L (200)
//   3201-10000  J (80)  L (200) M (315)
// but the calc task uses a 5000-piece lot, which sits in the 1201-3200 band,
// and the solution then looked up the 3201-10000 band. At general inspection
// level II the 1201-3200 band gives code letter K, n = 125, and at AQL 1.0%
// the normal single-sampling table gives Ac = 3, Re = 4.
//
// The lesson's own quiz q-m01l03-02 already states this correctly for a
// 1500-unit lot in the same band, so the course contradicted itself: the
// worked example said code L / n = 200 / Ac = 5 / Re = 6 while the quiz said
// code K / n = 125 / Ac = 3. Both illustrations m01l01 and m01l03 also drew
// the wrong plan, so they are regenerated.
//
// Idempotent: safe to run repeatedly.
//
// Usage: node apply-sampling-fix.js <dataDir>

'use strict';

const fs = require('fs');
const path = require('path');

const dataDir = process.argv[2];
if (!dataDir) {
  console.error('usage: node apply-sampling-fix.js <dataDir>');
  process.exit(1);
}

const lessonsPath = path.join(dataDir, 'lessons.json');
const questionsPath = path.join(dataDir, 'questions.json');
const manifestPath = path.join(__dirname, 'course-images.json');

const lessons = JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

let fixed = 0;
const note = (m) => console.log('  ' + m);

// ---------------------------------------------------------------- m01l03 text

const l03 = lessons.find((l) => l.lessonId === 'm01l03');
if (!l03) throw new Error('m01l03 not found');

const OLD_P =
  'The sampling plan is built by converting lot size and inspection level into a sample size code letter, then selecting the accept and reject numbers for the chosen AQL. In ISO 2859-1, a lot of 3201 to 10000 units at general inspection level II gives code letter L, which corresponds to a sample size of 200 units. For an AQL of 1.0% defective under normal single sampling, the accept number is 5 and the reject number is 6. The plan says inspect 200 units, accept the lot if 5 or fewer defective units are found, and reject if 6 or more are found. The code letter depends on the inspection level, so the same lot band gives code letter J (n = 80, Ac = 2, Re = 3 at AQL 1.0%) at level I and code letter M (n = 315) at level III; always read the level and the lot band together before looking up the sample size.';

const NEW_P =
  'The sampling plan is built by converting lot size and inspection level into a sample size code letter, then selecting the accept and reject numbers for the chosen AQL. In ISO 2859-1, a lot of 1201 to 3200 units at general inspection level II gives code letter K, which corresponds to a sample size of 125 units. For an AQL of 1.0% defective under normal single sampling, the accept number is 3 and the reject number is 4. The plan says inspect 125 units, accept the lot if 3 or fewer defective units are found, and reject if 4 or more are found. The code letter depends on the inspection level, so the same lot band gives code letter H (n = 50, Ac = 1, Re = 2 at AQL 1.0%) at level I and code letter L (n = 200, Ac = 5, Re = 6 at AQL 1.0%) at level III; always read the level and the lot band together before looking up the sample size. The 5000-unit lot used in the worked example below falls inside this 1201 to 3200 band, which is why it resolves to code letter K.';

const OLD_CAPTION =
  'Defining a lot and building the plan: lot size 5,000, inspection level II, AQL 1.0%, code letter L, n = 200, accept 5, reject 6';

const NEW_CAPTION =
  'Defining a lot and building the plan: lot size 5,000, inspection level II, AQL 1.0%, code letter K, n = 125, accept 3, reject 4';

let pPatched = false;
let captionPatched = false;

// A theory section carries its own `p` paragraph and may also carry a blocks
// array; patch both shapes.
const patchP = (value) => {
  if (value === OLD_P) { pPatched = true; return NEW_P; }
  return value;
};
const patchCaption = (value) => {
  if (value === OLD_CAPTION) { captionPatched = true; return NEW_CAPTION; }
  return value;
};

(l03.content.theory || []).forEach((section) => {
  if (typeof section.p === 'string') section.p = patchP(section.p);
  (section.blocks || []).forEach((b) => {
    if (b.t === 'p' && typeof b.text === 'string') b.text = patchP(b.text);
    if (b.t === 'image' && typeof b.caption === 'string') b.caption = patchCaption(b.caption);
  });
});

if (pPatched) { note('m01l03 theory paragraph rewritten for the 1201-3200 band'); fixed++; }
if (captionPatched) { note('m01l03 illustration caption corrected'); fixed++; }

// ------------------------------------------------------------------ m01l03 calc

const OLD_SOL =
  '1. Confirm lot definition: 5000 boards, same part number, revision, supplier lot, and packaging. 2. Select standard: ISO 2859-1 normal single sampling. 3. Find sample size code letter: lot size 3201 to 10000 at general inspection level II gives code letter L. 4. Find sample size: code letter L corresponds to n = 200 boards. 5. Select AQL: 1.0% defective. 6. Read accept/reject numbers for n = 200 and AQL 1.0%: Ac = 5, Re = 6. 7. Rule: inspect 200 boards; accept if defective boards <= 5; reject if defective boards >= 6. 8. If rejected, quarantine the lot and apply the documented disposition; if accepted, record the sample result and continue normal inspection unless switching rules indicate a change.';

const NEW_SOL =
  '1. Confirm lot definition: 5000 boards, same part number, revision, supplier lot, and packaging. 2. Select standard: ISO 2859-1 normal single sampling. 3. Find sample size code letter: lot size 1201 to 3200 at general inspection level II gives code letter K. 4. Find sample size: code letter K corresponds to n = 125 boards. 5. Select AQL: 1.0% defective. 6. Read accept/reject numbers for n = 125 and AQL 1.0%: Ac = 3, Re = 4. 7. Rule: inspect 125 boards; accept if defective boards <= 3; reject if defective boards >= 4. 8. If rejected, quarantine the lot and apply the documented disposition; if accepted, record the sample result and continue normal inspection unless switching rules indicate a change.';

if (l03.content.calc && l03.content.calc.solution === OLD_SOL) {
  l03.content.calc.solution = NEW_SOL;
  note('m01l03 calc solution corrected to code letter K, n = 125, Ac = 3, Re = 4');
  fixed++;
}

// ------------------------------------------------------------------- m01l01 alt

const OLD_ALT =
  'Incoming inspection sampling plan with a PCB panel grid, a lot label, counterfeit red-flag reels and an accept/reject chart for lot size 5000 at level II, AQL 1.0 percent, code letter L, n equals 200, accept 5, reject 6';

const NEW_ALT =
  'Incoming inspection sampling plan with a PCB panel grid, a lot label, counterfeit red-flag reels and an accept/reject chart for lot size 5000 at level II, AQL 1.0 percent, code letter K, n equals 125, accept 3, reject 4';

const l01 = lessons.find((l) => l.lessonId === 'm01l01');
if (!l01) throw new Error('m01l01 not found');

let altPatched = false;
(l01.content.theory || []).forEach((section) => {
  (section.blocks || []).forEach((b) => {
    if (b.t === 'image' && b.alt === OLD_ALT) {
      b.alt = NEW_ALT;
      altPatched = true;
    }
  });
});
if (altPatched) { note('m01l01 illustration alt text corrected'); fixed++; }

if (manifest['m01l01'] && manifest['m01l01'].alt === OLD_ALT) {
  manifest['m01l01'].alt = NEW_ALT;
  note('course-images.json m01l01 alt corrected');
  fixed++;
}

// ------------------------------------------------------------- quiz explanation

const q = questions.find((x) => x.questionId === 'q-m01l03-02');
if (!q) throw new Error('q-m01l03-02 not found');

const OLD_EXP =
  'ANSI/ASQ Z1.4 maps lot size 1,201\u20133,200 at inspection level II to code letter K; code K has sample size 125, and the normal single-sampling table gives Ac = 3 at AQL 1.0%. Option a is the level I code J plan, option d is the level III code L plan, and option c mixes the code K sample size with the code L acceptance number.';

const NEW_EXP =
  'ANSI/ASQ Z1.4 maps lot size 1,201\u20133,200 at inspection level II to code letter K; code K has sample size 125, and the normal single-sampling table gives Ac = 3 at AQL 1.0%. Option a is the code J plan, which is the level I code letter for the next band up (3201 to 10000) and not for this lot; option d is the level III code L plan for this band; and option c mixes the code K sample size with the code L acceptance number.';

if (q.explanation === OLD_EXP) {
  q.explanation = NEW_EXP;
  note('q-m01l03-02 explanation: distractor (a) described accurately');
  fixed++;
}

// ------------------------------------------------------------------------- write

if (fixed > 0) {
  fs.writeFileSync(lessonsPath, JSON.stringify(lessons, null, 2));
  fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2));
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('apply-sampling-fix: ' + fixed + ' item(s) corrected.');
} else {
  console.log('apply-sampling-fix: nothing to do (already applied).');
}
