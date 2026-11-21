#!/usr/bin/env node
'use strict';
/*
 * apply-review-fixes.js — applies the reviewer fixes documented in
 * COURSE_FIXES.md to the three course data files.
 *
 * Every fix is a guarded, exact-string replacement: if the expected source
 * text is not found the script fails loudly instead of silently skipping, so
 * it is safe to re-run and safe to review as a diff.
 *
 * Idempotent: a second run reports "already applied" for every fix and exits 0.
 *
 * Usage:
 *   node scripts/apply-review-fixes.js [dataDir]
 *
 * dataDir defaults to ../data relative to this script.
 * Backups: <file>.bak is written next to each modified file on the first run.
 *
 * After running this script, regenerate the embedded copy:
 *   node scripts/embed.js            (writes assets/data-embed.js)
 * and re-validate:
 *   node scripts/check-course.js && node scripts/gates.js
 */

const fs = require('fs');
const path = require('path');

const dataDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, '..', 'data');
const FILES = {
  lessons: path.join(dataDir, 'lessons.json'),
  questions: path.join(dataDir, 'questions.json'),
  sources: path.join(dataDir, 'sources.json'),
};

const COMPETENCIES = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8', 'K9', 'K10'];

const log = [];
function note(msg) { log.push(msg); console.log('  ' + msg); }

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}
function backup(file) {
  const bak = file + '.bak';
  if (!fs.existsSync(bak)) fs.copyFileSync(file, bak);
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
// Replaces `from` with `to` inside `subject`. Returns {text, changed}.
function replaceOnce(subject, from, to) {
  const i = subject.indexOf(from);
  if (i === -1) return { text: subject, changed: false, already: subject.indexOf(to) !== -1 };
  return { text: subject.slice(0, i) + to + subject.slice(i + from.length), changed: true };
}
function applyReplace(label, subject, from, to) {
  const r = replaceOnce(subject, from, to);
  if (r.changed) { note('FIX ' + label); return r.text; }
  if (r.already) { note('skip ' + label + ' (already applied)'); return subject; }
  throw new Error('FIX ' + label + ': expected source text not found');
}

function main() {
  console.log('apply-review-fixes: dataDir=' + dataDir);
  const lessons = readJson(FILES.lessons);
  const questions = readJson(FILES.questions);
  const sources = readJson(FILES.sources);

  // ---------------------------------------------------------------------
  // FIX 1 — competency alignment (audit finding D3)
  // Rule, taken from the project's own metadata: a question may only carry
  // competencies that its lesson declares in goals[].competencies. Where the
  // current tag is not declared by the lesson, the lesson's goal set is used.
  // ---------------------------------------------------------------------
  const lessonById = {};
  lessons.forEach(function (l) { lessonById[l.lessonId] = l; });
  let retagged = 0;
  const distBefore = {}, distAfter = {};
  questions.forEach(function (q) {
    const l = lessonById[q.lessonId];
    if (!l) throw new Error('question references unknown lesson: ' + q.lessonId);
    const goals = [];
    (l.goals || []).forEach(function (g) {
      (g.competencies || []).forEach(function (c) { if (goals.indexOf(c) === -1) goals.push(c); });
    });
    const before = q.competencies.slice();
    before.forEach(function (k) { distBefore[k] = (distBefore[k] || 0) + 1; });
    const kept = before.filter(function (k) { return goals.indexOf(k) !== -1; });
    const after = kept.length ? kept : goals.slice();
    after.forEach(function (k) { distAfter[k] = (distAfter[k] || 0) + 1; });
    if (JSON.stringify(after) !== JSON.stringify(before)) {
      q.competencies = after;
      retagged++;
    }
  });
  note('FIX D3 competency alignment: ' + retagged + ' of ' + questions.length + ' question tag sets corrected');
  COMPETENCIES.forEach(function (k) {
    note('     ' + k + ': ' + (distBefore[k] || 0) + ' -> ' + (distAfter[k] || 0) + ' questions');
  });

  // ---------------------------------------------------------------------
  // FIX 2 — wave flux density (audit finding D1): 15-25 g/m2 was an order of
  // magnitude above the industry figure. Replaced with the sourced values.
  // ---------------------------------------------------------------------
  const m09l04 = findLesson(lessons, 'm09l04');
  const fluxBlock = findTheory(m09l04, 'Flux type and amount');
  fluxBlock.p = applyReplace(
    'D1a m09l04 theory flux amount',
    fluxBlock.p,
    'Flux amount is usually set by spray density and pattern; a starting range of 15-25 g/m² is common, but verify against your paste/equipment datasheet.',
    'Flux amount is specified by the flux supplier, normally as a deposition of flux solids in micrograms per square inch (µg/in²) measured with a fluxometer; a typical recommended range is 500 to 1500 µg/in² of solids, which is about 0.8 to 2.3 g/m² (1 in² = 6.45 cm², 1 m² = 1550 in²). Always state the basis before comparing numbers: figures quoted per unit of liquid, for example 0.5 to 1.0 g/ft², are not comparable with solids-based figures and are several times larger. Take the range from the flux datasheet and verify it against your equipment datasheet.'
  );
  m09l04.content.calc.solution = applyReplace(
    'D1b m09l04 calc flux setting',
    m09l04.content.calc.solution,
    'Set spray density to 18-22 g/m² to wet pads and hole walls without excessive residue; verify against your paste/equipment datasheet.',
    'Set spray density from the flux datasheet range, for example 500-1500 µg/in² of flux solids (about 0.8-2.3 g/m²), measured with a fluxometer by the wet or dry method; adjust tank pressure and traversing speed, then verify coverage and residue against your flux and equipment datasheet.'
  );

  // ---------------------------------------------------------------------
  // FIX 3 — reflow cooling rate (audit finding D8): upper bound unsourced.
  // ---------------------------------------------------------------------
  const m06l02 = findLesson(lessons, 'm06l02');
  const coolBlock = findTheory(m06l02, 'Cooling: solidification and residual stress');
  coolBlock.p = applyReplace(
    'D8 m06l02 cooling rate window',
    coolBlock.p,
    'Typical cooling rates are in the range of 2 to 6 °C/s',
    'Typical cooling rates are in the range of 1 to 4 °C/s'
  );
  m06l02.content.calc.solution = applyReplace(
    'D8 m06l02 calc cooling rate window',
    m06l02.content.calc.solution,
    'Typical practice is 2 to 6 °C/s',
    'Typical practice is 1 to 4 °C/s'
  );

  // ---------------------------------------------------------------------
  // FIX 4 — cleanliness acceptance numbers (audit finding D2): the worked
  // examples used internal specification values but never told the learner
  // where real acceptance numbers come from. Added the published reference
  // values, their basis, and the current move to objective evidence.
  // ---------------------------------------------------------------------
  const m12l03 = findLesson(lessons, 'm12l03');
  const hasRef = (m12l03.content.theory || []).some(function (t) { return t.h === 'Where the acceptance numbers come from'; });
  if (!hasRef) {
    m12l03.content.theory.push({
      h: 'Where the acceptance numbers come from',
      p: 'A cleanliness criterion is never invented at the test bench: it is taken from the customer specification, the product reliability plan, or a published reference. The most widely used reference value is 1.56 microgram NaCl equivalent per square centimeter, reported per IPC-TM-650 method 2.3.25 (ROSE) and historically applied to assembled boards through IPC J-STD-001 and to bare boards through IPC-6012. Many high-reliability customers tighten it: about 1.0 microgram per square centimeter for high-impedance analog and telecom hardware, about 0.75 for aerospace and military, and about 0.5 for medical assemblies, with ion chromatography per IPC-TM-650 method 2.3.28 used to confirm the specific ions. Two cautions matter in practice. First, ROSE reports a conductivity equivalent rather than a named ion, so two boards with the same ROSE value can carry very different corrosion risk; that is why the ion-specific test exists. Second, the current revision of J-STD-001 has moved away from a single fixed limit towards objective evidence: the assembly must be demonstrably clean enough for its intended life and environment, and the limit is then set and justified for that specific process and product rather than copied from a table. The practical rule for an engineer is to quote the method, the unit, the sampled area and the source of every limit used, and to expect an internal specification to be tighter than the published reference rather than looser.'
    });
    note('FIX D2a m12l03: added "Where the acceptance numbers come from" reference block');
  } else {
    note('skip D2a (already applied)');
  }

  const m12l01 = findLesson(lessons, 'm12l01');
  m12l01.content.calc.solution = applyReplace(
    'D2b m12l01 calc reference basis',
    m12l01.content.calc.solution,
    'Step 4: Apply the cleanliness criterion. ROSE 0.82 µg NaCl/cm² is below the 1.00 µg NaCl/cm² limit, so ROSE passes.',
    'Step 4: Apply the cleanliness criterion. The 1.00 µg NaCl/cm² value here is a product-specific limit; the widely used published reference is 1.56 µg NaCl/cm² per IPC-TM-650 method 2.3.25, and high-reliability customers often work tighter. ROSE 0.82 µg NaCl/cm² is below the 1.00 µg NaCl/cm² limit, so ROSE passes.'
  );

  // ---------------------------------------------------------------------
  // FIX 5 — source registry (audit finding D5): five entries for fifteen
  // modules, none verified, most lessons uncited. Added the standards the
  // lessons already name, and attached them to the lessons that cite them.
  // ---------------------------------------------------------------------
  const NEW_SOURCES = [
    { id: 'src-006', type: 'standard', title: 'ISO 2859-1 Sampling procedures for inspection by attributes', edition: 'TBD-REVIEW', section: 'TBD-REVIEW', licenseNote: 'paraphrase only', verifiedBy: 'TBD-REVIEW', verifiedOn: null },
    { id: 'src-007', type: 'standard', title: 'IPC-7095 Design and Assembly Process Implementation for BGAs', edition: 'TBD-REVIEW', section: 'TBD-REVIEW', licenseNote: 'paraphrase only', verifiedBy: 'TBD-REVIEW', verifiedOn: null },
    { id: 'src-008', type: 'standard', title: 'IPC-7530 Guidelines for Temperature Profiling for Mass Soldering Processes', edition: 'TBD-REVIEW', section: 'TBD-REVIEW', licenseNote: 'paraphrase only', verifiedBy: 'TBD-REVIEW', verifiedOn: null },
    { id: 'src-009', type: 'standard', title: 'IPC-7711/7721 Rework, Modification and Repair of Electronic Assemblies', edition: 'TBD-REVIEW', section: 'TBD-REVIEW', licenseNote: 'paraphrase only', verifiedBy: 'TBD-REVIEW', verifiedOn: null },
    { id: 'src-010', type: 'standard', title: 'IPC-CC-830 Qualification and Performance of Electrical Insulating Compound for Conformal Coating', edition: 'TBD-REVIEW', section: 'TBD-REVIEW', licenseNote: 'paraphrase only', verifiedBy: 'TBD-REVIEW', verifiedOn: null },
    { id: 'src-011', type: 'standard', title: 'IPC-7351 Generic Requirements for Surface Mount Design and Land Pattern Standard', edition: 'TBD-REVIEW', section: 'TBD-REVIEW', licenseNote: 'paraphrase only', verifiedBy: 'TBD-REVIEW', verifiedOn: null },
    { id: 'src-012', type: 'standard', title: 'ANSI/ESD S20.20 Development of an Electrostatic Discharge Control Program', edition: 'TBD-REVIEW', section: 'TBD-REVIEW', licenseNote: 'paraphrase only', verifiedBy: 'TBD-REVIEW', verifiedOn: null },
    { id: 'src-013', type: 'standard', title: 'IPC-TM-650 method 2.3.25 (ROSE) and 2.3.28 (ion chromatography)', edition: 'TBD-REVIEW', section: 'TBD-REVIEW', licenseNote: 'paraphrase only', verifiedBy: 'TBD-REVIEW', verifiedOn: null },
    { id: 'src-014', type: 'vendor-doc', title: 'AIM Solder — Profile Supplement for Wave Soldering Process (flux deposition 500-1500 µg/in²)', edition: 'Rev 4', section: 'TBD-REVIEW', licenseNote: 'public vendor document; confirm current revision before publication', verifiedBy: 'TBD-REVIEW', verifiedOn: null, url: 'https://www.aimsolder.com/wp-content/uploads/wave_solder_profile_supplement.pdf' }
  ];
  let added = 0;
  NEW_SOURCES.forEach(function (s) {
    if (sources.some(function (x) { return x.id === s.id; })) return;
    sources.push(s);
    added++;
  });
  note('FIX D5a sources registry: ' + added + ' entries added (' + sources.length + ' total)');

  const ATTACH = {
    'm01l03': ['src-006'],
    'm06l03': ['src-008'],
    'm07l04': ['src-007'],
    'm09l04': ['src-014'],
    'm11l03': ['src-009'],
    'm11l04': ['src-009'],
    'm12l01': ['src-013'],
    'm12l03': ['src-013'],
    'm12l04': ['src-010'],
    'm15l04': ['src-011'],
    'm02l05': ['src-012']
  };
  let attached = 0;
  Object.keys(ATTACH).forEach(function (lid) {
    const l = findLesson(lessons, lid);
    if (!Array.isArray(l.sources)) l.sources = [];
    ATTACH[lid].forEach(function (ref) {
      if (l.sources.indexOf(ref) === -1) { l.sources.push(ref); attached++; }
    });
  });
  note('FIX D5b source refs attached to lessons: ' + attached);

  // ---------------------------------------------------------------------
  // FIX 6 — m12l01 had no quiz questions at all (audit finding D4).
  // ---------------------------------------------------------------------
  const NEW_QUESTIONS = [
    {
      questionId: 'q-m12l01-01',
      type: 'single',
      competencies: ['K1', 'K6'],
      lessonId: 'm12l01',
      prompt: 'An assembly passes ROSE at 0.82 µg NaCl/cm² against a 1.00 µg NaCl/cm² limit, but its SIR result is 8.5 × 10^7 Ω against a 1.0 × 10^8 Ω requirement. Which criterion governs the disposition, and why?',
      options: [
        { id: 'a', text: 'SIR governs, because it measures the failure mechanism (leakage and electrochemical migration under bias and humidity) that the residue can actually cause' },
        { id: 'b', text: 'ROSE governs, because it is the industry-standard cleanliness test and is measured first' },
        { id: 'c', text: 'Neither governs; the assembly is accepted because both results are within an order of magnitude of their limits' },
        { id: 'd', text: 'Visual inspection governs, because a board with no visible residue is by definition clean' }
      ],
      correct: 'a',
      explanation: 'ROSE and SIR answer different questions. ROSE reports a conductivity equivalent of extracted ionic residue and is a process-control tool; SIR puts the residue under the bias and humidity that cause leakage, dendritic growth and electrochemical migration, so it is the closer proxy for the reliability requirement. When the two disagree, the criterion that models the failure mechanism governs: rework the assembly and address the rinse, not the ROSE reading.',
      source: 'src-013'
    },
    {
      questionId: 'q-m12l01-02',
      type: 'calc',
      competencies: ['K1', 'K6'],
      lessonId: 'm12l01',
      prompt: 'A ROSE test on a cleaned area reads 0.95 µg NaCl/cm² with a blank of 0.12 µg NaCl/cm². The product limit is 1.00 µg NaCl/cm². What is the blank-corrected result and the disposition?',
      options: [
        { id: 'a', text: '0.83 µg NaCl/cm² — passes' },
        { id: 'b', text: '1.07 µg NaCl/cm² — fails' },
        { id: 'c', text: '0.95 µg NaCl/cm² — passes' },
        { id: 'd', text: '0.83 µg NaCl/cm² — fails' }
      ],
      correct: 'a',
      explanation: 'The blank is the contamination contributed by the solvent, container and handling, and it is subtracted from the reading: 0.95 − 0.12 = 0.83 µg NaCl/cm². Compared with the 1.00 µg NaCl/cm² limit, 0.83 passes. Reporting the uncorrected reading overstates the board contamination and can trigger rework that is not needed; skipping the blank does the opposite. Record method, area, blank and units with the result.',
      source: 'src-013'
    },
    {
      questionId: 'q-m12l01-03',
      type: 'single',
      competencies: ['K1', 'K6'],
      lessonId: 'm12l01',
      prompt: 'A no-clean assembly passes ROSE and visual inspection, yet shows intermittent contact failures at edge-card connectors after conformal coating. What is the most consistent explanation?',
      options: [
        { id: 'a', text: 'Hydrophobic no-clean residue is trapped under the connector contacts where the aqueous rinse cannot reach, and the coating sealed it in' },
        { id: 'b', text: 'The ROSE limit was set too loosely for this product class' },
        { id: 'c', text: 'The coating was applied too thinly to protect the contacts' },
        { id: 'd', text: 'The board was cleaned with the wrong solvent temperature, which raised the ROSE reading' }
      ],
      correct: 'a',
      explanation: 'ROSE extracts what the solvent can reach and reports a conductivity equivalent; it does not see non-ionic hydrophobic film trapped under a component, and averaging over a large sampled area hides a local residue pocket. Coating then seals the residue in place. The correct response is to re-clean with a chemistry and process qualified for the connector geometry, test the connector area separately with ion chromatography and local ROSE, and re-qualify the cleaning step rather than tightening the global limit.',
      source: 'src-013'
    }
  ];
  let qAdded = 0;
  NEW_QUESTIONS.forEach(function (q) {
    if (questions.some(function (x) { return x.questionId === q.questionId; })) return;
    questions.push(q);
    qAdded++;
  });
  note('FIX D4a m12l01 quiz questions added: ' + qAdded);
  const m12l01L = findLesson(lessons, 'm12l01');
  NEW_QUESTIONS.forEach(function (q) {
    if (Array.isArray(m12l01L.quiz) && m12l01L.quiz.indexOf(q.questionId) === -1) m12l01L.quiz.push(q.questionId);
  });
  note('FIX D4b m12l01 quiz now references ' + m12l01L.quiz.length + ' questions');

  // ---------------------------------------------------------------------
  backup(FILES.lessons);
  backup(FILES.questions);
  backup(FILES.sources);
  writeJson(FILES.lessons, lessons);
  writeJson(FILES.questions, questions);
  writeJson(FILES.sources, sources);

  const noQuiz = lessons.filter(function (l) { return !l.quiz || l.quiz.length === 0; }).map(function (l) { return l.lessonId; });
  console.log('apply-review-fixes: done.');
  console.log('  lessons without quiz questions: ' + (noQuiz.length ? noQuiz.join(', ') : 'none'));
  console.log('  next: node scripts/embed.js && node scripts/check-course.js && node scripts/gates.js');
}

try { main(); } catch (e) {
  console.error('apply-review-fixes: FAILED — ' + e.message);
  process.exit(1);
}
