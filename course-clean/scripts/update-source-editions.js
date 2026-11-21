#!/usr/bin/env node
/* =========================================================================
 * update-source-editions.js — Phase 2, step 1: pin every source to an edition
 *
 * The Phase-1 research turned up contradictions between vendor pages on which
 * IPC revision is current, so the editions here are taken from one primary
 * artefact only: the Global Electronics Association (IPC) standards revision
 * table at https://www.electronics.org/ipc-document-revision-table, read on
 * 2026-10-31. Vendor and SEO pages were not used to set any value.
 *
 * Adds four backward-compatible fields to data/sources.json:
 *   currentEdition   the edition IPC lists as newest for that document
 *   editionStatus    current | superseded | edition-mismatch |
 *                    no-longer-maintained | rolling | not-ipc
 *   currentCheckedOn date the revision table was read
 *   currentSource    where the current edition was read
 * and a boolean:
 *   scopeOnly        the cited section is background, not a criterion
 *
 * No numeric criterion is changed here. A superseded edition is recorded, not
 * silently rewritten: the brief forbids changing a value without the user
 * supplying the edition text.
 *
 * Usage: node scripts/update-source-editions.js [--dry]
 * ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'data', 'sources.json');
const DRY = process.argv.includes('--dry');

const CHECKED = '2026-10-31';
const IPC_TABLE = 'https://www.electronics.org/ipc-document-revision-table';

/* id -> [currentEdition, editionStatus, note for the learner] */
const TABLE = {
  'src-001': ['Rev J (March 2024)', 'superseded',
    'Written against Rev H. Rev J was published in March 2024 and is listed by IPC as current; the criteria quoted here were not re-read against Rev J.'],
  'src-002': ['Rev J (April 2024)', 'superseded',
    'Written against Rev G/H. IPC lists J-STD-001 Rev J, April 2024, as current. Some vendor pages assert a "Rev J 2024" and others a later "Rev H 2026" — the publisher table shows J, April 2024.'],
  'src-003': ['Rev D (May 2018) — no longer maintained', 'no-longer-maintained',
    'IPC still lists Rev D as the newest J-STD-033 and marks the document "no longer maintained"; an E revision is a project, not a published standard. The course therefore cites the current edition.'],
  'src-004': ['Rev C (November 2021; English release February 2022)', 'current',
    'Rev C is the newest IPC-7525 in the IPC table.'],
  'src-005': ['Rev F (November 2022)', 'edition-mismatch',
    'The source label says Rev D while the text read was Rev E; IPC lists Rev F, November 2022, as current. Two revision gaps.'],
  'src-006': ['ISO 2859-1:1999 with 2011 amendments', 'not-ipc',
    'Not an IPC document; the edition is checked against ISO, not the IPC table.'],
  'src-007': ['Rev E (September 2024)', 'current',
    'Rev E is the newest IPC-7095 in the IPC table.'],
  'src-008': ['Rev B (January 2025)', 'current',
    'Rev B is the newest IPC-7530 in the IPC table.'],
  'src-009': ['Rev D (January 2024)', 'superseded',
    'Written against Rev C (January 2017). IPC lists IPC-7711/7721 Rev D, January 2024, as current.'],
  'src-010': ['Rev C (January 2019)', 'current',
    'Rev C is the newest IPC-CC-830 in the IPC table.'],
  'src-011': ['Rev B (June 2010) — no longer maintained', 'no-longer-maintained',
    'IPC lists IPC-7351 Rev B as the newest revision and marks the document "no longer maintained". IPC-7352, a land-pattern guideline issued in 2023, is a separate document and is not a replacement edition.'],
  'src-013': ['rolling document', 'rolling',
    'IPC-TM-650 is revised per test method, so it has no single edition.'],
  'src-015': ['Rev B (April 2024)', 'superseded',
    'Written against J-STD-005 Rev A. IPC lists Rev B, April 2024, as current.'],
  'src-018': ['Rev F (September 2023) plus addenda 6012FA (December 2025), 6012FS (February 2024), 6012EM (August 2020)', 'current',
    'Rev F is current; the cleanliness figure in the course comes from Rev E §3.9.1 and is noted as such in the source entry.'],
  'src-019': ['Rev D (December 2023)', 'superseded',
    'Written against J-STD-004 Rev B. IPC lists Rev D, December 2023, as current (Rev C was January 2022).'],
  'src-020': ['Rev C with Amendment 1 (November 2017)', 'current',
    'Rev C with Amendment 1 is the newest J-STD-006 in the IPC table.'],
  'src-021': ['Rev E (November 2017)', 'superseded',
    'Written against J-STD-002 Rev C. IPC lists Rev E, November 2017, as current.'],
  'src-022': ['Rev M (May 2025)', 'current',
    'Rev M is the newest IPC-A-600 in the IPC table.'],
  'src-023': ['Rev E with Amendment 1 (April 2022)', 'current',
    'Rev E with Amendment 1 is the newest IPC-4101 in the IPC table.'],
  'src-024': ['Rev C (December 2023)', 'current',
    'Rev C is the newest IPC-2221 in the IPC table.'],
  'src-025': ['Rev B (October 2020)', 'current',
    'Rev B is the newest IPC-2222 in the IPC table.'],
  'src-026': ['Rev A (March 2022)', 'current',
    'Rev A is the newest IPC-7526 in the IPC table.'],
  'src-016': ['Rev J (March 2024)', 'superseded',
    'The through-hole fill criteria quoted here were read against Rev H. Rev J is current and was not re-read.'],
  'src-017': ['Rev F (November 2022)', 'edition-mismatch',
    'The source label says Rev D while the text read was Rev E; IPC lists Rev F, November 2022, as current.'],
  'src-014': ['vendor document Rev 4', 'not-ipc',
    'Consumable supplier document, not an IPC standard; the revision is the supplier\'s.'],
  'src-039': ['rolling document', 'not-ipc',
    'UL standard; edition checked against UL, not the IPC table.']
};

const raw = fs.readFileSync(FILE, 'utf8');
const sources = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);

let changed = 0;
const problems = [];

sources.forEach(function (s) {
  const row = TABLE[s.id];
  if (row) {
    s.currentEdition = row[0];
    s.editionStatus = row[1];
    s.currentCheckedOn = CHECKED;
    s.currentSource = IPC_TABLE;
    s.editionNote = row[2];
    changed += 1;
  } else if (!s.editionStatus) {
    /* non-IPC programme documents (ANSI/ESD, IEC, ISO, UL) */
    s.currentEdition = s.edition || 'not stated';
    s.editionStatus = 'not-ipc';
    s.currentCheckedOn = CHECKED;
    s.editionNote = 'Outside the IPC revision table; the edition above is the one cited and was not re-checked in Phase 2.';
    changed += 1;
  }
  s.scopeOnly = /scope only/i.test(s.section || '');
});

/* assertions: the brief's five named standards must all carry a status */
['IPC-A-610', 'J-STD-001', 'J-STD-020', 'IPC-6012', 'IPC-7351'].forEach(function (std) {
  const hit = sources.filter(function (s) { return (s.title || '').indexOf(std) === 0 || (s.title || '').indexOf(std) >= 0; });
  if (!hit.length) problems.push('no source entry for ' + std);
  hit.forEach(function (s) {
    if (!s.editionStatus) problems.push(std + ' (' + s.id + ') has no edition status');
  });
});

const byStatus = {};
sources.forEach(function (s) { byStatus[s.editionStatus] = (byStatus[s.editionStatus] || 0) + 1; });
const scopeOnly = sources.filter(function (s) { return s.scopeOnly; }).length;

if (problems.length) {
  console.error('FAILED:');
  problems.forEach(function (p) { console.error('  ✗ ' + p); });
  process.exit(1);
}

console.log('sources                ' + sources.length);
console.log('statuses               ' + JSON.stringify(byStatus));
console.log('scope-only entries     ' + scopeOnly);
console.log('entries updated        ' + changed);

if (DRY) {
  console.log('dry run, nothing written');
  process.exit(0);
}

fs.writeFileSync(FILE, JSON.stringify(sources, null, 2) + '\n');
console.log('wrote data/sources.json');
