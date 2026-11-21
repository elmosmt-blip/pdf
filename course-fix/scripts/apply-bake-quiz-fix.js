#!/usr/bin/env node
/*
 * Round 14, defect D13 — two bake quizzes still quote the garbled table that D6
 * removed from the lessons.
 *
 * D6 (round 11) corrected the theory and the worked examples in m02l04 and
 * m02l06. The quizzes of the same two lessons were missed, and they carry the
 * exact model D6 was written to remove, plus two numbers that exist nowhere in
 * the standard.
 *
 * q-m02l04-02  "for 2.0 to 4.5 mm bodies the 90 °C column gives 192 h"
 *              and "bake time is indexed to package body thickness, not to the
 *              moisture sensitivity level".
 *
 * q-m02l06-02  "125°C for 8 h up to 1.4 mm, 18 h for 1.4-2.0 mm and 48 h for
 *              2.0-4.5 mm" and "the 40 °C long bake (about 9-38 days)".
 *
 * Where the bad numbers came from. PCBSync's J-STD-033 page carries a collapsed
 * table — "2.0-4.5 mm · 2-5a · 48 hrs · 192 hrs · 38 days" — that flattens the
 * thickness × MSL × exceedance matrix into one row per thickness and drops the
 * MSL dimension. The primary text says otherwise.
 *
 * J-STD-033B.1 Table 4-1 (user bake), read from the standard itself:
 *
 *   >2.0 mm <=4.5 mm, 90 °C, floor life exceeded >72 h .... 10 days  (not 192 h)
 *   >1.4 mm <=2.0 mm, 125 °C ............................. 18-48 h
 *   >1.4 mm <=2.0 mm, 40 °C .............................. 25-79 days
 *   <=1.4 mm, 125 °C, MSL 3, exceedance <=72 h .......... 7 h   (not 8 h)
 *   <=1.4 mm, 125 °C, MSL 3, exceedance >72 h ........... 9 h
 *   <=1.4 mm, 40 °C, MSL 2 to 5a ........................ 8-22 days (not 9-38)
 *
 * "8 h" is the >72 h column value for MSL 2a; the lot in q-m02l06-02 is MSL 3
 * with a 24 h exceedance, so it belongs in the <=72 h column and the time is 7 h.
 *
 * One more thing the standard says that the old explanation got backwards: the
 * 96 h cumulative bake limit applies to temperatures GREATER than 90 °C. At
 * 90 °C or below there is no cumulative limit. The old explanation said a 192 h
 * bake at 90 °C "normally requires supplier approval", which is wrong — and the
 * real 240 h bake at 90 °C is permitted for exactly that reason.
 *
 * Idempotent: whole-question replacement, so runs 2 and 3 are byte-identical.
 */
'use strict';
var fs = require('fs');
var path = require('path');

var dataDir = process.argv[2];
if (!dataDir) { console.error('usage: node apply-bake-quiz-fix.js <data-dir>'); process.exit(2); }
var qfile = path.join(dataDir, 'questions.json');
var raw = fs.readFileSync(qfile, 'utf8');
var questions = JSON.parse(raw);
var n = 0;

function replace(id, fn) {
  var q = null;
  for (var i = 0; i < questions.length; i++) if (questions[i].questionId === id) { q = questions[i]; break; }
  if (!q) { console.error('  !! ' + id + ' not found'); return; }
  var before = JSON.stringify(q);
  fn(q);
  if (JSON.stringify(q) !== before) n++;
}

replace('q-m02l04-02', function (q) {
  q.prompt =
    'A 2.5 mm-thick package is baked at 90 °C with floor life exceeded by more ' +
    'than 72 h. The J-STD-033 Table 4-1 bake time for that body thickness is ' +
    '10 days. If the bake has already run for half of the bake time, how many ' +
    'hours remain before the bake is complete?';
  q.options = [
    { id: 'a', text: '120 h' },
    { id: 'b', text: '240 h' },
    { id: 'c', text: '48 h' },
    { id: 'd', text: '96 h' }
  ];
  q.correct = 'a';
  q.explanation =
    'J-STD-033 bake time is indexed to package body thickness, the moisture ' +
    'sensitivity level and whether floor life was exceeded by more than 72 h or ' +
    'by 72 h or less, so all three must be read off the table before a time is ' +
    'quoted. For a body in the >2.0 to 4.5 mm band at 90 °C, the >72 h column ' +
    'gives 10 days, which is 240 h. Half of that is 120 h, so 120 h remain. The ' +
    '240 h option is the total bake time; 48 h is the 125 °C bake time for the ' +
    'same thickness band, not a 90 °C time; 96 h is the cumulative bake limit, ' +
    'which applies only above 90 °C — at 90 °C or below there is no cumulative ' +
    'limit, which is precisely why a 240 h bake at 90 °C is permitted at all.';
});

replace('q-m02l06-02', function (q) {
  q.options[0] = {
    id: 'a',
    text: 'One standard 24 h interval over floor life; bake remaining unplaced ' +
      'components at the package-specific bake condition from J-STD-033 Table ' +
      '4-1 — for this MSL 3 lot with the exceedance inside 72 h, 125 °C for 7 h ' +
      'up to 1.4 mm, 17 h for 1.4-2.0 mm or 48 h for 2.0-4.5 mm, or the 40 °C ' +
      'long bake if the carrier cannot take 125 °C — then return to dry storage ' +
      'at ≤30°C/60%RH with desiccant and HIC.'
  };
  q.options[1] = { id: 'b', text: 'One full floor life over; bake at 125°C for 8 h.' };
  q.explanation =
    '168 h + 24 h = 192 h cumulative exposure; 192 h − 168 h = 24 h over floor ' +
    'life. Because cumulative exposure exceeds floor life, remaining unplaced ' +
    'components must be baked. The bake condition comes from J-STD-033 Table 4-1 ' +
    'and is indexed to package body thickness, the MSL level and the size of the ' +
    'exceedance: for this MSL 3 lot with a 24 h exceedance, inside the ≤72 h ' +
    'column, 125 °C gives 7 h up to 1.4 mm, 17 h for 1.4-2.0 mm and 48 h for ' +
    '2.0-4.5 mm. The 40 °C long bake runs 8 to 22 days for a body up to 1.4 mm ' +
    'and 25 to 79 days for 1.4 to 2.0 mm, again by MSL level, and is reserved ' +
    'for carriers that cannot take 125 °C. The 8 h in option b is the >72 h ' +
    'column value for MSL 2a, not the ≤72 h value for MSL 3. Cumulative bake ' +
    'time above 90 °C is limited to 96 h unless the supplier states otherwise, ' +
    'and the 24 h figure sometimes quoted for a 125 °C bake is the supplier ' +
    'dry-pack condition from Table 4-2, not a user bake. Distractors misapply ' +
    'the floor-life subtraction or assume a prior bake resets exposure.';
});

var out = JSON.stringify(questions, null, 2) + '\n';
if (out === raw) {
  console.log('questions.json: no change');
} else {
  fs.writeFileSync(qfile, out);
  console.log('questions.json: ' + n + ' bake question(s) corrected');
}
