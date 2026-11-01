#!/usr/bin/env node
/*
 * apply-standards-verification.js
 *
 * Round 10. Two defects found by verifying course claims against the primary
 * source documents, which ARE freely available:
 *
 *   1. The course cites IPC-7525D. That revision does not exist. The current
 *      revision is IPC-7525C (November 2021); IPC-7525B (October 2011)
 *      superseded IPC-7525A (February 2007) and IPC-7525 (May 2000).
 *      Evidence: IPC-7525B front matter ("Supersedes: IPC-7525A - February
 *      2007, IPC-7525 - May 2000") plus the Accuristech document history
 *      listing IPC-7525C November 2021 as most recent and 7525B as
 *      historical. The course's own TBD-REVIEW marker asked for exactly this
 *      check ("verify current revision").
 *
 *   2. The course states J-STD-020 tp as "30-40 s" and "40 s for small
 *      packages". No revision supports 40 s. J-STD-020D Table 5-2 gives
 *      tp = 30 s for the Pb-free profile and 20 s for SnPb; J-STD-020E and
 *      J-STD-020F component datasheets reproduce tp <= 30 s (E: 20-30 s).
 *
 * Also updates sources.json src-004, whose edition was "Rev A" - superseded
 * twice over.
 *
 * Idempotent. Does NOT touch `status` or remove any TBD-REVIEW marker: the
 * rest of each lesson is still unreviewed. It annotates the specific marker
 * entries that this pass actually resolved.
 *
 * Usage: node apply-standards-verification.js <dataDir>
 */
'use strict';

const fs = require('fs');
const path = require('path');

const dataDir = process.argv[2];
if (!dataDir) {
  console.error('usage: node apply-standards-verification.js <dataDir>');
  process.exit(2);
}

const VDATE = '2026-11-01';

/* ---------------------------------------------------------------- fixes --- */

// 1. IPC-7525D does not exist; the current revision is C.
const REV_FIX = [
  ['IPC-7525D', 'IPC-7525C'],
  ['IPC-7525B', 'IPC-7525C'],
];

// 2. J-STD-020 tp: 30 s max (Pb-free). Rewritten to keep the sentence
//    grammatical and to keep the "package qualification parameter, not the
//    paste window" distinction the lesson already makes correctly.
const TP_FIX = [
  [
    'is the time within 5 °C of the classification temperature and is limited to 30-40 s; it is a package qualification parameter, not the paste window used to run a board.',
    'is the time within 5 °C of the classification temperature and is limited to 30 s on the Pb-free profile (20 s for SnPb); it is a package qualification parameter, not the paste window used to run a board.',
  ],
  [
    'each with tp, the time within 5 °C of that temperature, limited to 30-40 s.',
    'each with tp, the time within 5 °C of that temperature, limited to 30 s.',
  ],
  [
    'limited to 30-40 s for large and very large packages and 40 s for small ones, and its peak figures are classification temperatures by package size, 260 °C small, 250 °C large and 245 °C very large.',
    'limited to 30 s, and its peak figures are classification temperatures by package thickness and volume, not by size alone: 260 °C for a thin package at any volume, 260/250/245 °C across small/large/very large at 1.6-2.5 mm thickness, and 250/245/245 °C above 2.5 mm.',
  ],
];

// 3. The course states the J-STD-020 classification temperatures as a function
//    of package SIZE alone. The real table is thickness x volume: the
//    260/250/245 row is the 1.6-2.5 mm thickness band only. Below 1.6 mm every
//    volume is 260 C; above 2.5 mm the limits fall to 250/245/245. Teaching
//    "260 C for a small package" lets a thick small-volume part run 10 C hot.
//    Evidence: J-STD-020D Table 4-2, reproduced in TI AN-2029 and in the
//    J-STD-020E/F component datasheets.
const CT_FIX = [
  [
    '260 °C for small packages, 250 °C for large packages and 245 °C for very large packages',
    '260 °C for small packages, 250 °C for large packages and 245 °C for very large packages at 1.6-2.5 mm thickness (the full J-STD-020 table is thickness x volume: below 1.6 mm every volume is 260 °C, and above 2.5 mm the limits fall to 250 °C small and 245 °C large and very large)',
  ],
  [
    '260 °C small, 250 °C large, 245 °C very large',
    '260 °C small, 250 °C large, 245 °C very large (1.6-2.5 mm row; above 2.5 mm thickness the limits fall to 250 °C small and 245 °C large and very large)',
  ],
  [
    '260 C small, 250 C large, 245 C very large',
    '260 C small, 250 C large, 245 C very large (1.6-2.5 mm row; above 2.5 mm thickness the limits fall to 250 C small and 245 C large and very large)',
  ],
];

// Marker entries this pass resolved. Patterns are written in the POST-REV_FIX
// form (IPC-7525C): REV_FIX runs first and rewrites the edition inside the
// original marker text, so matching on IPC-7525D here would never fire and
// writing IPC-7525D into the replacement would be mangled in turn.
const MARKER_FIX = [
  [
    '"0.66 area-ratio guidance value cited as commonly associated with IPC-7525C; verify against the applicable IPC-7525C edition and your paste/equipment datasheet"',
    '"0.66 area-ratio guidance value: EDITION RESOLVED ' + VDATE + ' - the course cited IPC-7525D, which does not exist; the current revision is IPC-7525C (11/2021), and IPC-7525B §1.1.2 defines area ratio verbatim as the ratio of the area of aperture opening to the area of aperture walls. The 0.66 figure itself is still carried only by convergent secondary sources and remains unverified."',
  ],
  [
    '"0.66 (IPC-7525C recommended area ratio; verify current revision)"',
    '"0.66 (IPC-7525C recommended area ratio; edition resolved ' + VDATE + ' - the cited IPC-7525D does not exist, current is 7525C 11/2021; the 0.66 figure itself remains unverified against the standard body text)"',
  ],
  [
    '"1.5 (IPC-7525C recommended aspect ratio; verify current revision)"',
    '"1.5 (IPC-7525C recommended aspect ratio; edition resolved ' + VDATE + ' - IPC-7525B §1.1.3 defines aspect ratio verbatim as the ratio of the width of the aperture to the thickness of the stencil foil; the 1.5 figure itself remains unverified against the standard body text)"',
  ],
];

/* ------------------------------------------------------------- apply ------ */

function fixString(s, counters, label) {
  let out = s;
  REV_FIX.forEach(([from, to]) => {
    if (out.indexOf(from) !== -1) {
      counters.rev += out.split(from).length - 1;
      out = out.split(from).join(to);
    }
  });
  TP_FIX.forEach(([from, to]) => {
    if (out.indexOf(from) !== -1) {
      counters.tp += 1;
      out = out.replace(from, to);
    }
  });
  CT_FIX.forEach(([from, to]) => {
    if (out.indexOf(from) !== -1) {
      counters.ct += out.split(from).length - 1;
      out = out.split(from).join(to);
    }
  });
  MARKER_FIX.forEach(([from, to]) => {
    if (out.indexOf(from) !== -1) {
      counters.marker += 1;
      out = out.replace(from, to);
    }
  });
  if (out !== s) counters.strings += 1;
  return out;
}

function walk(node, counters, file) {
  if (typeof node === 'string') return fixString(node, counters, file);
  if (Array.isArray(node)) return node.map((n) => walk(n, counters, file));
  if (node && typeof node === 'object') {
    const out = {};
    Object.keys(node).forEach((k) => { out[k] = walk(node[k], counters, file); });
    return out;
  }
  return node;
}

const counters = { rev: 0, tp: 0, ct: 0, marker: 0, strings: 0 };
const report = [];

['lessons.json', 'questions.json'].forEach((f) => {
  const p = path.join(dataDir, f);
  const raw = fs.readFileSync(p, 'utf8');
  const data = JSON.parse(raw);
  const fixed = walk(data, counters, f);
  const out = JSON.stringify(fixed, null, 2) + '\n';
  if (out !== raw) {
    fs.writeFileSync(p, out);
    report.push(f + ': rewritten');
  } else {
    report.push(f + ': no change');
  }
});

// sources.json: src-004 edition Rev A -> Rev C, and the descriptive title.
{
  const p = path.join(dataDir, 'sources.json');
  const raw = fs.readFileSync(p, 'utf8');
  const src = JSON.parse(raw);
  let n = 0;
  src.forEach((e) => {
    if (/7525/.test(e.title) && e.edition === 'Rev A') {
      e.edition = 'Rev C';
      e.title = 'IPC-7525C Stencil Design Guidelines (stencil design guidance: area ratio, aspect ratio, aperture sizing)';
      n += 1;
    }
  });
  const out = JSON.stringify(src, null, 2) + '\n';
  if (out !== raw) { fs.writeFileSync(p, out); }
  report.push('sources.json: ' + n + ' registry entr(ies) updated (Rev A -> Rev C)');
}

console.log('apply-standards-verification:');
report.forEach((r) => console.log('  ' + r));
console.log('  IPC-7525 edition references corrected: ' + counters.rev);
console.log('  J-STD-020 tp statements corrected:     ' + counters.tp);
console.log('  J-STD-020 classification-temp rows fixed: ' + counters.ct);
console.log('  TBD-REVIEW marker entries annotated:   ' + counters.marker);
console.log('  strings changed:                       ' + counters.strings);
