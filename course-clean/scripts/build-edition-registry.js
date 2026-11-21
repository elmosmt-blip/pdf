#!/usr/bin/env node
/* =========================================================================
 * build-edition-registry.js — Phase 2, step 2: the registry of
 * edition-dependent claims, as data and as CSV
 *
 * Every numeric or categorical claim in the course that comes from a standard
 * which is revised on a cycle gets a row. A row is a claim a reader could
 * check against a copy of the standard, so it is the unit a technologist would
 * want to re-verify before publication.
 *
 * Inputs
 *   data/lessons.json   claim.cue is matched against each lesson; a cue that
 *                       does not appear in its lesson is a hard failure, so the
 *                       registry cannot quietly list a claim the course dropped
 *                       (this is the "never grep for a claim you remember"
 *                       rule from Phase 1, enforced by the build)
 *   data/sources.json   edition in course, current edition, status
 *
 * Outputs
 *   data/edition-registry.json   the same rows, for the UI and tests
 *   docs/edition-registry.csv    the deliverable
 *
 * Machine-assigned status (never hand-written):
 *   current            course edition == current edition, no mismatch
 *   superseded         a newer edition exists; the claim was read against the
 *                      older text and has NOT been re-read
 *   edition-mismatch   the source's own label disagrees with the text read
 *   no-longer-maintained  the document is frozen at the cited edition
 *   not-edition-bound  not an IPC-style revisioned standard
 * plus a human-gated column:
 *   recheckRequired   true when status is superseded or edition-mismatch
 *
 * Nothing here changes a number. The registry exists so that the change, when
 * it comes, is the user's decision with the edition text in hand.
 *
 * Usage: node scripts/build-edition-registry.js [--csv path] [--json]
 * ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LESSONS = path.join(ROOT, 'data', 'lessons.json');
const SOURCES = path.join(ROOT, 'data', 'sources.json');
const OUT_JSON = path.join(ROOT, 'data', 'edition-registry.json');
const OUT_CSV = path.join(ROOT, 'docs', 'edition-registry.csv');
const DRY = process.argv.includes('--dry');

/* ------------------------------------------------------------------ claims */
/* cue   : a literal string that must exist in the lesson (proof of presence)
 * claim : what the lesson asserts, in the reviewer's words
 * value : the exact figure or category the course states
 * section: the section of the standard that governs it (paraphrased locator)
 * risk  : why re-reading matters — the arithmetic the number feeds
 */
const CLAIMS = [
  /* ---- IPC-A-610: the acceptance standard the whole course judges against */
  { lessonId: 'm08l05', source: 'src-001', cue: 'minimum vertical barrel fill of 75%',
    claim: 'Minimum vertical barrel fill for through-hole joints, Class 2 and Class 3',
    value: '75 % of board thickness', standard: 'IPC-A-610', section: '§10 through-hole fill',
    risk: 'Every fill-fraction disposition in m08l05, m09l06 and the THT module compares against this one number.' },
  { lessonId: 'm08l05', source: 'src-001', cue: 'documented exception allows about 50',
    claim: 'Documented exception to the vertical fill minimum',
    value: 'about 50 % under a documented exception', standard: 'IPC-A-610', section: '§10 through-hole fill, exception',
    risk: 'Decides whether a partially filled barrel is a disposition or a rework.' },
  { lessonId: 'm09l06', source: 'src-016', cue: 'Compare with the acceptance limit in IPC-A-610',
    claim: 'A 69 % fill fraction is judged against the class minimum, not against 100 %',
    value: '75 % minimum; 100 % would be contractual', standard: 'IPC-A-610', section: '§10 through-hole fill',
    risk: 'Determines whether a customer asking for 100 % is asking for a deviation.' },
  { lessonId: 'm09l06', source: 'src-001', cue: 'Acceptance limits are defined in IPC-A-610',
    claim: 'Wave-soldered joints are judged against IPC-A-610 class criteria',
    value: 'class-based visual acceptance', standard: 'IPC-A-610', section: 'scope and classes',
    risk: 'Supplies the class vocabulary used by the wave, rework and inspection modules.' },
  { lessonId: 'm07l05', source: 'src-001', cue: 'defect',
    claim: 'Disposition language: defect, condition and process indicator by class',
    value: 'class-dependent disposition terms', standard: 'IPC-A-610', section: 'defect definitions',
    risk: 'The whole disposition vocabulary of module 7 rests on the current class definitions.' },
  { lessonId: 'm12l05', source: 'src-001', cue: 'cleanliness and solder joint visibility',
    claim: 'Coating must not obscure joints the class criteria require to be visible',
    value: 'class-based visibility requirement', standard: 'IPC-A-610', section: 'coating and visibility',
    risk: 'Sets the masking map for coated assemblies.' },

  /* ---- J-STD-001: process requirements ---------------------------------- */
  { lessonId: 'm12l01', source: 'src-002', cue: '1.56',
    claim: 'The 1.56 µg NaCl/cm² ROSE figure is a published reference, not a J-STD-001 pass/fail',
    value: '1.56 µg NaCl/cm² per IPC-TM-650 2.3.25; product limit 1.00', standard: 'J-STD-001', section: '§8 cleanliness (objective evidence)',
    risk: 'J-STD-001 removed the ROSE pass/fail; a lesson treating 1.56 as the requirement would misstate the standard.' },
  { lessonId: 'm12l03', source: 'src-002', cue: 'historically applied to assembled boards',
    claim: 'ROSE reference value used with objective evidence rather than alone',
    value: '1.56 µg NaCl/cm² reference, evidence-based release', standard: 'J-STD-001', section: '§8 cleanliness',
    risk: 'Same rule as m12l01 from the opposite direction: what replaces the single limit.' },

  /* ---- J-STD-020 / J-STD-033: moisture --------------------------------- */
  { lessonId: 'm02l02', source: 'src-005', cue: 'MSL 1 unlimited',
    claim: 'MSL classes and their floor life at the reference condition',
    value: 'MSL 1 unlimited, MSL 2 one year, MSL 2a four weeks', standard: 'J-STD-020', section: 'classification table',
    risk: 'Feeds every floor-life number in m02 and the m02 case.' },
  { lessonId: 'm02l03', source: 'src-003', cue: 'MSL 2 is 12 months',
    claim: 'Floor life by MSL at 30 °C / 60 % RH',
    value: 'MSL 2 = 12 months, MSL 2a = 4 weeks', standard: 'J-STD-033', section: 'Table 5-1 floor life',
    risk: 'The clock-start and reset rules are applied to these values in every MSL case.' },
  { lessonId: 'm02l04', source: 'src-003', cue: 'MSL 3 has 168 h',
    claim: 'Floor life by MSL at reference conditions 30 °C / 60 % RH',
    value: 'MSL 3 = 168 h, MSL 4 = 72 h, MSL 5 = 48 h, MSL 5a = 24 h', standard: 'J-STD-033', section: 'Table 5-1 floor life',
    risk: 'The m02l04 and m02l06 cases are decided by subtracting these numbers.' },
  { lessonId: 'm02l04', source: 'src-003', cue: 'dry storage at 5% RH or less',
    claim: 'Dry storage suspends the clock at 5 % RH or less',
    value: '≤5 % RH suspends; 10 % RH only slows', standard: 'J-STD-033', section: 'dry storage / dry pack',
    risk: 'Corrected in this pass from 10 % to 5 %; the 10 % form is retained only as a caveat.' },
  { lessonId: 'm02l04', source: 'src-003', cue: 'indexed to package body thickness',
    claim: 'User bake is indexed to body thickness AND MSL, split at 72 h of exceedance',
    value: 'Table 4-1 matrix; 125 °C column 5-16 h up to 1.4 mm', standard: 'J-STD-033', section: 'Table 4-1 user bake',
    risk: 'A bake recipe quoted from the wrong column either under-dries or damages the part.' },
  { lessonId: 'm02l04', source: 'src-003', cue: 'must not be baked above 40',
    claim: 'Carrier tape temperature ceiling for tape-and-reel bake',
    value: '40 °C, giving multi-day bake times', standard: 'J-STD-033', section: 'Table 4-1, 40 °C column',
    risk: 'The "9 days at 40 °C" figure drives the m02l04 and m02l06 scheduling answers.' },
  { lessonId: 'm02l06', source: 'src-003', cue: 'dry storage target of 5% RH or less',
    claim: 'A 7 % RH cabinet is not compliant dry storage',
    value: '5 % RH requirement', standard: 'J-STD-033', section: 'dry storage',
    risk: 'The case turns on 7 % being above the requirement rather than inside a 5-10 % band.' },
  { lessonId: 'm06l01', source: 'src-005', cue: 'as 60-150 s',
    claim: 'Classification profile time above liquidus (tL)',
    value: '60-150 s for both alloy families', standard: 'J-STD-020', section: 'classification profile',
    risk: 'm06l01 and m06l05 contrast this with the 30-90 s IPC-7530 guidance and the 60-120 s paste window.' },
  { lessonId: 'm06l01', source: 'src-017', cue: 'time within 5 °C',
    claim: 'Time within 5 °C of peak (tp) is limited in the classification profile',
    value: 'tp limit from the classification profile', standard: 'J-STD-020', section: 'Table 4-1 classification temperatures',
    risk: 'Caps peak dwell as well as peak temperature.' },
  { lessonId: 'm06l05', source: 'src-005', cue: 'J-STD-020',
    claim: 'Package peak-temperature ceiling by thickness and volume',
    value: '260 / 250 / 245 °C by package class', standard: 'J-STD-020', section: 'Table 4-1 classification temperatures',
    risk: 'Caps every peak temperature the reflow module sets.' },

  /* ---- IPC-7525: stencil geometry -------------------------------------- */
  { lessonId: 'm03l02', source: 'src-004', cue: '0.66',
    claim: 'Minimum area ratio for reliable paste release',
    value: '0.66', standard: 'IPC-7525', section: '§1.1.2 area ratio',
    risk: 'Every aperture in m03, m04l01 and the m03l02 calculation is judged against 0.66.' },
  { lessonId: 'm03l05', source: 'src-004', cue: 'aspect ratio above 1.5',
    claim: 'Minimum aspect ratio (aperture width / foil thickness)',
    value: '1.5', standard: 'IPC-7525', section: '§1.1.3 aspect ratio',
    risk: 'Paired with area ratio on the stencil drawing review.' },
  { lessonId: 'm03l05', source: 'src-004', cue: '85 to 90 degrees',
    claim: 'Recommended aperture wall taper',
    value: '85-90°', standard: 'IPC-7525', section: 'aperture wall geometry',
    risk: 'A drawing-review acceptance item in m03l05 and m03l06.' },
  { lessonId: 'm03l06', source: 'src-004', cue: 'area ratio minimum 0.66',
    claim: 'Stencil purchase specification repeats the release criteria',
    value: '0.66 area ratio, 85° taper, 25-35 N/cm tension', standard: 'IPC-7525', section: 'design guidance used as spec',
    risk: 'The lesson marks these as "based on guidance"; the tension band is supplier practice, not a standard value.' },
  { lessonId: 'm04l01', source: 'src-004', cue: 'area ratio target of 0.66',
    claim: 'Area-ratio target applied to chip and QFP apertures',
    value: '0.66', standard: 'IPC-7525', section: '§1.1.2 area ratio',
    risk: 'The m04l01 calculation reduces a 0.30 mm pad by 10 % and tests it against this number.' },

  /* ---- J-STD-004/005/006: materials ----------------------------------- */
  { lessonId: 'm09l04', source: 'src-019', cue: '500 to 1500 µg/in²',
    claim: 'Flux solids deposition range for wave soldering',
    value: '500-1500 µg/in² (0.8-2.3 g/m²)', standard: 'J-STD-004', section: 'flux classification; deposition is supplier data',
    risk: 'Quoted as a range with a unit-conversion trap; the classification, not the deposition, comes from J-STD-004.' },
  { lessonId: 'm01l05', source: 'src-015', cue: 'J-STD-005',
    claim: 'Solder powder size classes by type number',
    value: 'Type 3 / 4 / 5 particle ranges', standard: 'J-STD-005', section: 'Table 3-2 powder size',
    risk: 'Sets which paste type the fine-pitch lessons call for.' },

  /* ---- IPC-6012: bare-board acceptance --------------------------------- */
  { lessonId: 'm01l06', source: 'src-018', cue: 'acceptance limits for flatness and twist',
    claim: 'Bow and twist limits come from IPC-6012 by board class',
    value: 'class-based flatness and twist limits', standard: 'IPC-6012', section: 'bow and twist',
    risk: 'The course cites Rev E §3.9.1 for cleanliness while Rev F is current — the exact case the registry exists for.' },

  /* ---- IPC-7351: land patterns ----------------------------------------- */
  { lessonId: 'm03l04', source: 'src-011', cue: 'land pattern data from IPC-7351',
    claim: 'Final aperture values are verified against IPC-7351 land patterns',
    value: 'density levels A/B/C', standard: 'IPC-7351', section: 'land pattern density',
    risk: 'IPC lists 7351 Rev B as current and "no longer maintained"; IPC-7352 (2023) is a separate guideline.' },

  /* ---- IPC-7530: reflow profile --------------------------------------- */
  { lessonId: 'm06l02', source: 'src-008', cue: '60-120 s',
    claim: 'Time above liquidus window for a lead-free profile',
    value: '60-120 s (paste datasheet governs)', standard: 'IPC-7530', section: 'reflow profile guidance',
    risk: 'The m06 profiles are judged against this band; IPC-7530 itself gives a wider 30-90 s guidance window.' },

  /* ---- IPC-7711/7721: rework ------------------------------------------- */
  { lessonId: 'm11l04', source: 'src-009', cue: 'annular ring',
    claim: 'Repair limits: conductor cut, annular ring and laminate damage by class',
    value: 'procedure classes with a permitted-conditions table', standard: 'IPC-7711/7721', section: 'rework and repair procedures',
    risk: 'Written against Rev C (2017); Rev D (January 2024) is current and was not re-read.' },
  { lessonId: 'm07l05', source: 'src-009', cue: 'IPC-7711',
    claim: 'Repair-versus-rework boundary used in disposition',
    value: 'rework / repair / modification', standard: 'IPC-7711/7721', section: 'scope of rework and repair',
    risk: 'A disposition that calls a repair "rework" hides a documented deviation.' },

  /* ---- IPC-CC-830: conformal coating ---------------------------------- */
  { lessonId: 'm12l05', source: 'src-010', cue: 'IPC-CC-830',
    claim: 'Coating types by cured chemistry and their qualification tests',
    value: 'Types AR/ER/SR/UR/XY/UT/SC', standard: 'IPC-CC-830', section: '§1.3.1 types',
    risk: 'Rev C (2019) is current; type UT and SC only exist from Rev C onwards.' }
];


/* --------------------------------------------------------------- assemble */
function readJson(file) {
  let raw = fs.readFileSync(file, 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  return JSON.parse(raw);
}

const lessons = readJson(LESSONS);
const sources = readJson(SOURCES);
const byLesson = new Map(lessons.map(function (l) { return [l.lessonId, l]; }));
const bySource = new Map(sources.map(function (s) { return [s.id, s]; }));

const failures = [];
const rows = [];

CLAIMS.forEach(function (c, i) {
  const lesson = byLesson.get(c.lessonId);
  if (!lesson) { failures.push(c.lessonId + ': lesson does not exist'); return; }
  const body = JSON.stringify(lesson.content) + JSON.stringify(lesson.goals);
  if (body.indexOf(c.cue) < 0) {
    failures.push(c.lessonId + ': cue not found in the lesson -> "' + c.cue + '"');
    return;
  }
  const source = bySource.get(c.source);
  if (!source) { failures.push(c.lessonId + ': source ' + c.source + ' does not exist'); return; }

  const status = source.editionStatus;
  rows.push({
    claimId: 'ed-' + String(i + 1).padStart(3, '0'),
    lessonId: c.lessonId,
    moduleId: lesson.moduleId,
    lessonTitle: lesson.title,
    claim: c.claim,
    valueInCourse: c.value,
    standard: c.standard,
    section: c.section,
    sourceId: c.source,
    editionInCourse: source.edition || 'not stated',
    currentEdition: source.currentEdition || 'not recorded',
    editionStatus: status,
    recheckRequired: status === 'superseded' || status === 'edition-mismatch',
    riskIfWrong: c.risk,
    checkedOn: source.currentCheckedOn || '',
    checkedAgainst: source.currentSource || ''
  });
});

/* one lesson must not be cited twice with the same source and value */
const seen = new Set();
rows.forEach(function (r) {
  const k = r.lessonId + '|' + r.sourceId + '|' + r.valueInCourse;
  if (seen.has(k)) failures.push('duplicate registry row: ' + k);
  seen.add(k);
});

if (failures.length) {
  console.error('FAILED — registry not written:');
  failures.forEach(function (f) { console.error('  ✗ ' + f); });
  process.exit(1);
}

/* ------------------------------------------------------------------- CSV */
/* RFC 4180 quoting; UTF-8 with BOM so Excel opens the Cyrillic-free but
 * umlaut-and-degree-bearing text without mangling it. */
const COLUMNS = [
  ['claimId', 'Claim ID'],
  ['lessonId', 'Lesson'],
  ['moduleId', 'Module'],
  ['lessonTitle', 'Lesson title'],
  ['claim', 'Claim'],
  ['valueInCourse', 'Value in course'],
  ['standard', 'Standard'],
  ['section', 'Section'],
  ['sourceId', 'Source ID'],
  ['editionInCourse', 'Edition in course'],
  ['currentEdition', 'Current edition'],
  ['editionStatus', 'Status'],
  ['recheckRequired', 'Recheck required'],
  ['riskIfWrong', 'What breaks if wrong'],
  ['checkedOn', 'Checked on'],
  ['checkedAgainst', 'Checked against']
];

function csvCell(v) {
  const s = String(v === undefined || v === null ? '' : v);
  return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

const csv = '\ufeff' + [COLUMNS.map(function (c) { return csvCell(c[1]); }).join(',')]
  .concat(rows.map(function (r) {
    return COLUMNS.map(function (c) {
      const v = r[c[0]];
      if (typeof v === 'boolean') return v ? 'yes' : 'no';
      return csvCell(v);
    }).join(',');
  })).join('\r\n') + '\r\n';

/* ------------------------------------------------------------- summary */
const byStatus = {};
rows.forEach(function (r) { byStatus[r.editionStatus] = (byStatus[r.editionStatus] || 0) + 1; });
const standards = new Set(rows.map(function (r) { return r.standard; }));
const modules = new Set(rows.map(function (r) { return r.moduleId; }));
const recheck = rows.filter(function (r) { return r.recheckRequired; });

console.log('registry rows         ' + rows.length);
console.log('lessons covered       ' + new Set(rows.map(function (r) { return r.lessonId; })).size);
console.log('modules covered       ' + modules.size);
console.log('standards covered     ' + standards.size + ' — ' + Array.from(standards).join(', '));
console.log('by status             ' + JSON.stringify(byStatus));
console.log('recheck required      ' + recheck.length + ' rows (' +
  Array.from(new Set(recheck.map(function (r) { return r.standard; }))).join(', ') + ')');

if (DRY) { console.log('dry run, nothing written'); process.exit(0); }

fs.writeFileSync(OUT_JSON, JSON.stringify({
  generatedOn: '2026-10-31',
  generatedBy: 'scripts/build-edition-registry.js',
  columns: COLUMNS.map(function (c) { return c[0]; }),
  rows: rows
}, null, 2) + '\n');
fs.writeFileSync(OUT_CSV, csv);
console.log('wrote data/edition-registry.json and docs/edition-registry.csv');
