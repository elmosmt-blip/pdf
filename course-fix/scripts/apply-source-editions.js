#!/usr/bin/env node
/*
 * Round 14 — the last marker field, and one superseded designation.
 *
 * Every sources.json entry carried edition "TBD-REVIEW". Filling them in from
 * published revision data also turned up a defect:
 *
 * D14 — the course cites ANSI/ESD S4.1 for static dissipative mats. S4.1
 * (Worksurfaces — Resistance Measurements) has been superseded by
 * ANSI/ESD STM4.1-2017, which is the current document in that slot. Confirmed
 * from the ESD Association's own standards-summary and master-status documents.
 * STM11.11, which the course also cites, is current at -2022.
 *
 * Editions are taken from, in order of preference: the publisher's own status
 * page, the standard's own front matter, and a reseller listing. Where two
 * sources disagree the disagreement is recorded rather than resolved by
 * preference — a wrong edition sends a reader to a superseded clause.
 *
 * Idempotent: entries are replaced wholesale, keyed by id.
 */
'use strict';
var fs = require('fs');
var path = require('path');

var dataDir = process.argv[2];
if (!dataDir) { console.error('usage: node apply-source-editions.js <data-dir>'); process.exit(2); }
var sfile = path.join(dataDir, 'sources.json');
var lfile = path.join(dataDir, 'lessons.json');
var sraw = fs.readFileSync(sfile, 'utf8');
var lraw = fs.readFileSync(lfile, 'utf8');
var sources = JSON.parse(sraw);
var lessons = JSON.parse(lraw);

var E = {
  'src-001': 'Rev H',
  'src-002': 'Rev G',
  'src-003': 'Rev D',
  'src-004': 'Rev C',
  'src-005': 'Rev D (read against Rev E text)',
  'src-006': 'ISO 2859-1:1999 (as amended 2011)',
  'src-007': 'Rev E (September 2024)',
  'src-008': 'Rev B (January 2025)',
  'src-009': 'IPC-7711C/7721C (January 2017)',
  'src-010': 'Rev C',
  'src-011': 'Rev B (June 2010) — no longer maintained',
  'src-012': 'ANSI/ESD S20.20-2021',
  'src-013': 'rolling document; methods 2.3.25 and 2.3.28',
  'src-014': 'Rev 4',
  'src-015': 'Rev A',
  'src-016': 'Rev H §10',
  'src-017': 'Rev D (read against Rev E text)',
  'src-018': 'Rev F (September 2023); the course\'s cleanliness figure is cited from Rev E §3.9.1',
  'src-019': 'Rev B',
  'src-020': 'Rev C',
  'src-021': 'Rev C',
  'src-022': 'Rev M (May 2025); §2.10.3 and §3.5.3.1 read',
  'src-023': 'Rev E with Amendment 1 (April 2022)',
  'src-024': 'Rev C (December 2023)',
  'src-025': 'Rev B (October 2020)',
  'src-026': 'Rev A (March 2022)',
  'src-027': 'ANSI/ESD S1.1-2021',
  'src-028': 'ANSI/ESD STM4.1-2017 (supersedes S4.1)',
  'src-029': 'ANSI/ESD S6.1-2019',
  'src-030': 'ANSI/ESD S541-2019',
  'src-031': 'ANSI/ESD STM3.1-2024',
  'src-032': 'ANSI/ESD STM11.11-2022',
  'src-033': 'ANSI/ESD STM97.1-2015',
  'src-034': 'ANSI/ESD STM97.2-2016',
  'src-035': 'IEC 61340-5-1:2024 (edition 3.0)',
  'src-036': 'IEC 61340-4-7 (ESDA counterpart of ANSI/ESD STM3.1-2024)',
  'src-037': 'ISO 9001:2015',
  'src-038': 'ANSI/AS9100 Rev D',
  'src-039': 'rolling document'
};

var n = 0, missing = [];
sources.forEach(function (s) {
  if (E[s.id] === undefined) { missing.push(s.id); return; }
  s.edition = E[s.id];
  n++;
});

/* D14: S4.1 is superseded by STM4.1-2017. One occurrence, in a lesson. */
var fixed = 0;
lessons.forEach(function (l) {
  if (!l.content) return;
  var before = JSON.stringify(l.content);
  var after = before.split(
    'ANSI/ESD S4.1 covers static dissipative mats'
  ).join(
    'ANSI/ESD STM4.1 covers static dissipative worksurfaces (it superseded S4.1)'
  );
  if (after !== before) { l.content = JSON.parse(after); fixed++; }
});

/* The registry title must match the document actually cited. */
sources.forEach(function (s) {
  if (s.id === 'src-028') s.title = 'ANSI/ESD STM4.1 Worksurfaces — Resistance Measurements (supersedes ANSI/ESD S4.1)';
});

var sout = JSON.stringify(sources, null, 2) + '\n';
var lout = JSON.stringify(lessons, null, 2) + '\n';
if (sout !== sraw) fs.writeFileSync(sfile, sout);
if (lout !== lraw) fs.writeFileSync(lfile, lout);
console.log('sources.json: ' + n + ' edition(s) set');
console.log('lessons.json: ' + fixed + ' S4.1 reference(s) corrected to STM4.1');
if (missing.length) console.error('  !! no edition recorded for: ' + missing.join(', '));

var left = 0;
sources.forEach(function (s) {
  if (String(s.edition).indexOf('TBD-REVIEW') >= 0) left++;
});
if (left) { console.error('  !! ' + left + ' edition marker(s) remain'); process.exit(1); }
var stale = 0;
(function count(o) {
  if (typeof o === 'string') { if (o.indexOf('ANSI/ESD S4.1') >= 0) stale++; return; }
  if (Array.isArray(o)) return o.forEach(count);
  if (o && typeof o === 'object') return Object.keys(o).forEach(function (k) { count(o[k]); });
})(lessons);
if (stale) { console.error('  !! ' + stale + ' ANSI/ESD S4.1 reference(s) still present'); process.exit(1); }
console.log('verified: 0 edition markers, 0 ANSI/ESD S4.1 references');
