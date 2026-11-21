#!/usr/bin/env node
/*
 * Round 11, defect D5 — J-STD-033 bake table misrepresented.
 *
 * Two lessons (m02l04 theory[4] and m02l05 theory[3]) told the reader that
 * "bake time in J-STD-033 is indexed to package body thickness, not to the
 * moisture sensitivity level", and then quoted single times per thickness
 * band: 8 h / 18 h / 48 h at 125 °C and 9 / 11 / 38 days at 40 °C.
 *
 * J-STD-033 Table 4-1 ("Reference Conditions for Drying Mounted or Unmounted
 * SMD Packages", user bake — floor life begins counting at time = 0 after
 * bake) is a three-variable table:
 *
 *   - package body thickness (outer grouping)
 *   - moisture sensitivity level 2, 2a, 3, 4, 5, 5a (rows)
 *   - bake temperature 125 / 90 / 40 °C, each split by "exceeding floor life
 *     by >72 h" and "by ≤72 h"
 *
 * The numbers the course quoted were a mix of Table 4-1 rows and Table 4-2
 * (supplier dry-pack, MET = 24 h) rows, presented as if thickness alone set
 * the time. Verified against the standard text reproduced at
 * ez.analog.com/.../attachment.pdf, sg-micro.com, monolithicpower.com and
 * TI AN-2029, which agree cell for cell.
 *
 * Table 4-1, 125 °C, floor life exceeded by >72 h (≤72 h in parentheses):
 *   ≤1.4 mm    2: 5 (3)  2a: 7 (5)   3: 9 (7)   4: 11 (7)   5: 12 (7)   5a: 16 (10)
 *   >1.4–2.0   2: 18 (15) 2a: 21 (16) 3: 27 (17) 4: 34 (20) 5: 40 (25) 5a: 48 (40)
 *   >2.0–4.5   all levels: 48 (48)
 * Table 4-1, 40 °C, >72 h (≤72 h):
 *   ≤1.4 mm    2: 8 (5)  2a: 9 (7)   3: 13 (9)  4: 15 (9)  5: 17 (10)  5a: 22 (10) days
 *   >1.4–2.0   2: 25 (20) 2a: 29 (22) 3: 37 (23) 4: 47 (28) 5: 57 (35) 5a: 79 (56) days
 *   >2.0–4.5   all levels: 79 (67) days
 * Table 4-2, supplier bake, MET = 24 h, 125 °C (150 °C):
 *   ≤1.4 mm    2: 7 (3)  2a: 8 (4)   3: 16 (8)  4: 21 (10)  5: 24 (12)  5a: 28 (14) h
 *   >1.4–2.0   2: 18 (9) 2a: 23 (11) 3: 43 (21) 4: 48 (24)  5: 48 (24)  5a: 48 (24) h
 *   >2.0–4.5   all levels: 48 (24) h
 *
 * The m02l04 worked example was also wrong by one row: it asks for an MSL 4
 * part whose floor life will be exceeded by 8 h, so the ≤72 h column applies
 * and 125 °C gives 7 h, not 8 h. Its 40 °C figure of "about 9 days" was
 * already right for that column and is left alone.
 *
 * Idempotent: the replacements are matched whole, and a second run finds
 * nothing to do.
 */
'use strict';
var fs = require('fs');
var path = require('path');

var dataDir = process.argv[2];
if (!dataDir) { console.error('usage: node apply-bake-table-fix.js <data-dir>'); process.exit(2); }
var file = path.join(dataDir, 'lessons.json');
var raw = fs.readFileSync(file, 'utf8');
var data = JSON.parse(raw);

var T4_NEW =
  'Use the bake table in IPC/JEDEC J-STD-033D for the package type and the component or tape datasheet. ' +
  'Bake time in J-STD-033 Table 4-1 is indexed to package body thickness AND to the moisture sensitivity ' +
  'level, with separate columns for floor life exceeded by more than 72 h and by 72 h or less, so all three ' +
  'variables must be read off the table before a time is quoted. Tape and reel must not be baked above ' +
  '40°C, because carrier tape and cover tape soften and deform; the 40°C column is therefore long — for ' +
  'bodies up to 1.4 mm it runs 8 days at MSL 2 up to 22 days at MSL 5a, and for 1.4 to 2.0 mm 25 to 79 days — ' +
  'so a 48 h or 168 h bake at 40°C will not dry a reel. Loose parts in trays or tubes can use the 125°C ' +
  'column, again by thickness and MSL: 5 to 16 h up to 1.4 mm, 18 to 48 h at 1.4 to 2.0 mm and 48 h at 2.0 to ' +
  '4.5 mm, only if the tray, tube and component materials are rated. Table 4-2 is a different table: it is ' +
  'the supplier dry-pack bake before packing, at a fixed 24 h maximum exposure time, and its 125°C figures — ' +
  '7 to 28 h up to 1.4 mm and 18 to 48 h above that — must not be quoted as a user rebake recipe. Above 90°C ' +
  'the cumulative bake time is limited (96 h unless the supplier states otherwise) because of intermetallic ' +
  'growth and solderability loss. Verify against your tape, tray, tube, and equipment datasheet, because tape ' +
  'can soften, trays can warp, and some coatings can blister.';

var T5_NEW =
  'For moisture-sensitive devices, IPC/JEDEC J-STD-033 provides bake conditions that depend on the carrier, ' +
  'the package body thickness, the moisture sensitivity level and the maximum temperature allowed by the ' +
  'component. For loose parts in trays, tubes or waffle packs whose carriers and components are rated for it, ' +
  'the 125 °C column of Table 4-1 is indexed to both thickness and MSL: 5 to 16 h for a body up to 1.4 mm, ' +
  '18 to 48 h for 1.4 to 2.0 mm and 48 h for 2.0 to 4.5 mm, with the longer times at the higher MSL levels and ' +
  'when floor life was exceeded by more than 72 h. The 24 h figure sometimes quoted for a 125 °C bake is the ' +
  'supplier dry-pack condition from Table 4-2, not a user bake, so do not use it as a production recipe. For ' +
  'tape and reel, IPC/JEDEC J-STD-033 also provides a lower-temperature long bake at 40 °C — 8 to 22 days for ' +
  'a body up to 1.4 mm and 25 to 79 days for 1.4 to 2.0 mm, again by MSL level — because the tape, reel, ' +
  'labels and cover tape cannot tolerate higher temperature. Cumulative bake time above 90 °C is limited to ' +
  '96 h unless the supplier states otherwise. Justify the condition by package type: polymer tape and reels ' +
  'can deform, labels can lift, and cover tape can shift at high temperature. Verify the chosen condition ' +
  'against the component datasheet, carrier datasheet, and oven capability.';

// [lessonId, theoryIndex, oldPrefix, newText]
var FIXES = [
  ['m02l04', 4,
    'Use the bake table in IPC/JEDEC J-STD-033D for the package type',
    T4_NEW],
  ['m02l06', 3,
    'For moisture-sensitive devices, IPC/JEDEC J-STD-033 provides bake conditions',
    T5_NEW],
];

var counters = { bakeTable: 0, calcStep: 0 };

data.forEach(function (lesson) {
  FIXES.forEach(function (fix) {
    var id = fix[0], idx = fix[1], prefix = fix[2], replacement = fix[3];
    if (lesson.lessonId !== id) return;
    var sec = lesson.content && lesson.content.theory && lesson.content.theory[idx];
    if (!sec || typeof sec.p !== 'string') {
      console.error('  !! ' + id + ' theory[' + idx + '] has no .p string');
      return;
    }
    if (sec.p.indexOf(prefix) !== 0) {
      // Already rewritten — the new text starts differently.
      if (sec.p.indexOf('Table 4-1 is indexed to package body thickness AND') !== -1) return;
      console.error('  !! ' + id + ' theory[' + idx + '] does not start with the expected text');
      return;
    }
    sec.p = replacement;
    counters.bakeTable++;
  });

  // m02l04 worked example: MSL 4, ≤1.4 mm, floor life exceeded by 8 h → the
  // ≤72 h column → 7 h at 125 °C, not 8 h.
  if (lesson.lessonId === 'm02l04' && lesson.content && lesson.content.calc) {
    var sol = lesson.content.calc.solution;
    var before = sol;
    sol = sol.replace(
      'de-reel, bake loose parts at 125°C for 8 h and re-reel',
      'de-reel, bake loose parts at 125°C for 7 h and re-reel');
    if (sol !== before) { lesson.content.calc.solution = sol; counters.calcStep++; }
  }

  // m02l06 worked example: MSL 3, floor life exceeded by 32 h → the ≤72 h
  // column. 125 °C gives 7 / 17 / 48 h by thickness band, not a single
  // 8 / 18 / 48 h chain. The 40 °C figure of 9 days is correct for MSL 3 at
  // ≤1.4 mm and is kept, only made MSL-explicit.
  if (lesson.lessonId === 'm02l06' && lesson.content && lesson.content.calc) {
    var sol2 = lesson.content.calc.solution;
    var before2 = sol2;
    sol2 = sol2.replace(
      'which is roughly 9 days for a body up to 1.4 mm and therefore does not fit a short reflow window',
      'which for an MSL 3 body up to 1.4 mm is 9 days and therefore does not fit a short reflow window');
    sol2 = sol2.replace(
      'is indexed to body thickness: 8 h up to 1.4 mm, 18 h for 1.4 to 2.0 mm, 48 h for 2.0 to 4.5 mm',
      'is indexed to both body thickness and MSL level: for this MSL 3 lot with floor life exceeded by 32 h, ' +
      '7 h up to 1.4 mm, 17 h at 1.4 to 2.0 mm and 48 h at 2.0 to 4.5 mm, with longer times at higher MSL ' +
      'levels and when the exceedance is greater than 72 h');
    if (sol2 !== before2) { lesson.content.calc.solution = sol2; counters.calcStep++; }
  }
});

var out = JSON.stringify(data, null, 2) + '\n';
if (out === raw) {
  console.log('lessons.json: no change');
} else {
  fs.writeFileSync(file, out);
  console.log('lessons.json: ' + counters.bakeTable + ' bake-table paragraph(s) rewritten, ' +
    counters.calcStep + ' worked-example step corrected');
}
