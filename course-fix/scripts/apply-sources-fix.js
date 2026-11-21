#!/usr/bin/env node
/**
 * apply-sources-fix.js — register the standards the course cites but omits.
 *
 * The course cites 42 distinct standard designations. sources.json recorded 17,
 * and a scan found 22 designations that the course leans on with no registry
 * entry at all. The largest was IPC-6012 with 17 mentions; the ESD and IEC
 * test-method standards were cited by m02l05 alone and registered nowhere.
 *
 * Each new entry follows the convention the existing descriptive entries use
 * (src-015 to src-017): a title that names the standard and records what the
 * course actually claims it says, so the registry doubles as a claim log. Every
 * entry is marked edition TBD-REVIEW, verifiedBy TBD-REVIEW and verifiedOn null,
 * exactly like the entries that were already there.
 *
 * This closes the registry gap. It does not verify anything: a registry entry
 * saying "the course asserts X" is not a statement that X is correct, and the
 * entries are marked accordingly. Verification is what REVIEW_CHECKLIST.md Part
 * B is for.
 *
 * Two things are deliberately NOT done here:
 *
 *   1. IPC-7721 gets no entry. src-009 already covers it as "IPC-7711/7721";
 *      adding a second entry would duplicate a standard the registry already
 *      has. A substring scan reports it as a gap only because the combined
 *      title does not contain the literal string "IPC-7721".
 *
 *   2. The IPC-7525 edition conflict is left alone. The registry says Rev A,
 *      m03l06 cites IPC-7525B and m03l02 cites IPC-7525D. Picking a winner is a
 *      judgement about a document nobody here has read, so the conflict is
 *      recorded in COURSE_FIXES.md and in REVIEW_CHECKLIST.md Part A instead.
 *
 * Usage: node apply-sources-fix.js <dataDir>
 */

'use strict';

var fs = require('fs');
var path = require('path');

/* designation -> what the course claims, used to build the descriptive title. */
var ADDITIONS = [
  ['IPC-6012',
    'Qualification and Performance Specification for Rigid Printed Boards ' +
    '(qualification and performance requirements for bare boards)'],
  ['J-STD-004', 'Requirements for Soldering Fluxes (paste CoA specification reference)'],
  ['J-STD-006',
    'Soft Solder Alloys and Fluxed or Non-Fluxed Solid Solders for Electronic ' +
    'Soldering Applications (powder solder, other than paste)'],
  ['J-STD-002', 'Solderability Tests for Component Leads, Terminations, Lugs, Terminals and Wires'],
  ['IPC-A-600', 'Acceptability of Printed Boards (visual and dimensional criteria)'],
  ['IPC-4101', 'Specification for Base Materials for Rigid and Multilayer Printed Boards'],
  ['IPC-2221', 'Generic Standard on Printed Board Design'],
  ['IPC-2222', 'Sectional Design Standard for Rigid Organic Printed Boards'],
  ['IPC-7526', 'Stencil and Misprinted Board Cleaning Handbook'],
  ['ANSI/ESD S1.1', 'Wrist Straps'],
  ['ANSI/ESD S4.1', 'Worksurfaces — Resistance Measurements'],
  ['ANSI/ESD S6.1', 'Grounding (equipotential bonding of racks, carts, shelving and tables)'],
  ['ANSI/ESD S541', 'Packaging Materials for ESD Sensitive Items'],
  ['ANSI/ESD STM3.1', 'Ionization (offset voltage and discharge time)'],
  ['ANSI/ESD STM11.11', 'Surface Resistance Measurements of Static Dissipative Planar Materials'],
  ['ANSI/ESD STM97.1', 'Floor Materials and Footwear — Resistance Measurement in Combination with a Person'],
  ['ANSI/ESD STM97.2', 'Footwear/Flooring System — Voltage Measurement in Combination with a Person'],
  ['IEC 61340-5-1', 'Protection of Electronic Devices from Electrostatic Phenomena — General Requirements'],
  ['IEC 61340-4-7', 'Standard Test Methods for Specific Applications — Ionization'],
  ['ISO 9001', 'Quality Management Systems — Requirements (control of externally provided product)'],
  ['ANSI/AS9100', 'Quality Management Systems — Requirements for Aviation, Space and Defense Organizations'],
  ['UL 94', 'Tests for Flammability of Plastic Materials for Parts in Devices and Appliances']
];

/* Deliberately excluded, with the reason recorded in the header. */
var EXCLUDED = {
  'IPC-7721': 'covered by src-009, "IPC-7711/7721 Rework, Modification and Repair of Electronic Assemblies"',
  'ANSI/AS': 'scan artefact, the truncated head of "ANSI/AS9100"',
  'ISO 9001:2015': 'dated form of ISO 9001, registered once'
};

function main() {
  var dataDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, '..', 'data');
  var file = path.join(dataDir, 'sources.json');
  if (!fs.existsSync(file)) {
    console.error('apply-sources-fix: ' + file + ' not found');
    process.exit(2);
  }

  var sources = JSON.parse(fs.readFileSync(file, 'utf8'));
  var before = JSON.stringify(sources);

  var nextNum = sources.reduce(function (max, s) {
    var m = /^src-(\d+)$/.exec(s.id || '');
    return m ? Math.max(max, parseInt(m[1], 10)) : max;
  }, 0) + 1;

  var added = [];
  var already = [];

  ADDITIONS.forEach(function (pair) {
    var designation = pair[0];
    var title = designation + ' ' + pair[1];

    /* Skip if the registry already names this designation anywhere. */
    var present = sources.some(function (s) {
      if (s.title.indexOf(designation) !== -1) return true;
      return s.title.split(/[\/,;|]/).some(function (p) { return p.indexOf(designation) !== -1; });
    });
    if (present) { already.push(designation); return; }

    sources.push({
      id: 'src-' + String(nextNum).padStart(3, '0'),
      type: 'standard',
      title: title,
      edition: 'TBD-REVIEW',
      section: 'TBD-REVIEW',
      licenseNote: 'paraphrase only',
      verifiedBy: 'TBD-REVIEW',
      verifiedOn: null
    });
    nextNum++;
    added.push(designation);
  });

  var changed = JSON.stringify(sources) !== before;
  if (changed) fs.writeFileSync(file, JSON.stringify(sources, null, 2) + '\n', 'utf8');

  console.log('apply-sources-fix: ' + file);
  console.log('  entries before      : ' + JSON.parse(before).length);
  console.log('  added               : ' + added.length);
  added.forEach(function (d) { console.log('    + ' + d); });
  console.log('  already registered  : ' + (already.length ? already.join(', ') : 'none'));
  console.log('  deliberately skipped:');
  Object.keys(EXCLUDED).forEach(function (k) {
    console.log('    - ' + k + ' — ' + EXCLUDED[k]);
  });
  console.log('  entries after       : ' + sources.length);
  console.log('  changed             : ' + (changed ? 'yes' : 'no (already complete)'));
  console.log('apply-sources-fix: OK');
}

main();
