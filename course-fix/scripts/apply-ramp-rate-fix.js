#!/usr/bin/env node
/*
 * Round 11, defect D8 — a 4 °C/s ramp-up limit that no source supports and that
 * contradicts the lessons carrying the quizzes.
 *
 * Two quiz questions premise a "maximum ramp rate of 4 °C/s":
 *
 *   q-m06l04-02  "the cited process guidance gives a maximum ramp rate of 4 °C/s"
 *   q-m06l05-02  "process guidance: liquidus 219 °C, peak 245 °C, minimum time
 *                 above liquidus 60 s, and maximum ramp rate 4 °C/s"
 *
 * Both are wrong, and both contradict their own lesson:
 *
 *   m06l04 theory[6]  "The average ramp-up of 1-3 °C/s and the 60-150 s
 *                      time-above-liquidus window come from IPC-7530 and the
 *                      paste datasheet, not from J-STD-020."
 *   m06l05 theory[3]  "IPC-7530B gives typical guidance such as a ramp rate of
 *                      1-3 C/s"
 *
 * Every external source agrees with the lessons, not the quizzes. J-STD-020D/E/F
 * and the component datasheets that reproduce it (Bourns, Diodes, NXP, KDS,
 * WPP, ams-osram) all give "ramp-up rate (TL to TP) 3 °C/second max". No source
 * anywhere gives 4 °C/s for ramp-up.
 *
 * The likely origin is the lessons' own cooling figure — "typical cooling rates
 * are 1-4 °C/s" — read as a ramp-up limit. Cooling and ramp-up are different
 * quantities; J-STD-020 caps ramp-down at 6 °C/s and ramp-up at 3 °C/s.
 *
 * Because the quizzes build arithmetic on the premise, the options and the
 * explanations are recomputed rather than patched. With 3 °C/s:
 *
 *   q-m06l04-02  (219-150)/3 = 23 s to liquidus, + 60 s TAL = 83 s
 *                 distractor 93 s = ramp to the 250 °C classification
 *                 temperature first: (250-150)/3 = 33 s, + 60 s
 *   q-m06l05-02  (245-219)/3 = 8.7 s of the TAL spent ramping,
 *                 dwell = 60 - 8.7 = 51.3 s, about 51 s
 *
 * Idempotent: matched whole, second run finds nothing to do.
 */
'use strict';
var fs = require('fs');
var path = require('path');

var dataDir = process.argv[2];
if (!dataDir) { console.error('usage: node apply-ramp-rate-fix.js <data-dir>'); process.exit(2); }
var qfile = path.join(dataDir, 'questions.json');
var raw = fs.readFileSync(qfile, 'utf8');
var questions = JSON.parse(raw);
var n = 0;

function fix(id, fn) {
  var q = null;
  for (var i = 0; i < questions.length; i++) {
    if (questions[i].questionId === id) { q = questions[i]; break; }
  }
  if (!q) { console.error('  !! ' + id + ' not found'); return; }
  if (fn(q)) n++;
}

fix('q-m06l04-02', function (q) {
  var before = JSON.stringify(q);
  q.prompt = q.prompt.replace('a maximum ramp rate of 4 °C/s', 'a maximum ramp rate of 3 °C/s');
  q.options = [
    { id: 'a', text: '83 s' },
    { id: 'b', text: '60 s' },
    { id: 'c', text: '23 s' },
    { id: 'd', text: '93 s' }
  ];
  q.correct = 'a';
  q.explanation =
    'Time to reach liquidus is (219 °C − 150 °C) ÷ 3 °C/s = 23 s. The minimum time ' +
    'above liquidus is 60 s, so the minimum elapsed time from soak exit to the end ' +
    'of that interval is 23 s + 60 s = 83 s. The 93 s option ramps all the way to ' +
    'the 250 °C classification temperature before counting the 60 s, which ' +
    'double-counts the part of the ramp that is already above liquidus; 60 s ignores ' +
    'the time needed to reach liquidus; 23 s ignores the required time above liquidus.';
  return JSON.stringify(q) !== before;
});

fix('q-m06l05-02', function (q) {
  var before = JSON.stringify(q);
  q.prompt = q.prompt.replace('maximum ramp rate 4 °C/s', 'maximum ramp rate 3 °C/s');
  q.options = [
    { id: 'a', text: 'About 51 s' },
    { id: 'b', text: '60 s' },
    { id: 'c', text: 'About 8.7 s' },
    { id: 'd', text: 'About 69 s' }
  ];
  q.correct = 'a';
  q.explanation =
    'Time above liquidus includes the ramp from liquidus to peak plus the dwell at ' +
    'peak. Ramp time = (245 °C − 219 °C) ÷ 3 °C/s = 8.7 s. Required dwell = 60 s − ' +
    '8.7 s = 51.3 s, about 51 s. Option b ignores the ramp time already spent above ' +
    'liquidus; option c reports the ramp time itself rather than the dwell; option d ' +
    'adds the ramp time instead of subtracting it.';
  return JSON.stringify(q) !== before;
});

var out = JSON.stringify(questions, null, 2) + '\n';
if (out === raw) {
  console.log('questions.json: no change');
} else {
  fs.writeFileSync(qfile, out);
  console.log('questions.json: ' + n + ' ramp-rate question(s) corrected');
}
