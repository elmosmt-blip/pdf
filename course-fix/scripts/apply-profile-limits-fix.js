#!/usr/bin/env node
/*
 * Round 12 — defects D9 to D12, found while walking the tail of Part B.
 *
 * D9  J-STD-005 Type 3 tail limits stated wrongly.
 * D10 The time-above-liquidus window is attributed to IPC-7530 and explicitly
 *     denied to J-STD-020, in three lessons. The 60-150 s figure IS J-STD-020's
 *     tL. In m06l05 the 60-120 s figure is labelled "above liquidus" when it is
 *     the soak, ts. Both numbers are correct J-STD-020 classification-profile
 *     parameters; they are simply attached to the wrong document and, in one
 *     case, to the wrong parameter.
 * D11 The SnPb eutectic classification temperature is given as a flat 220 °C.
 *     J-STD-020E Table 4-1 gives 235 °C for a package thinner than 2.5 mm with
 *     a volume below 350 mm³.
 * D12 Seven lessons print temperatures as "183 C" instead of "183 °C".
 *
 * Sources. J-STD-020E primary text from ez.analog.com (the same rendering used
 * to verify J-STD-033) gives Table 4-1 and the classification reflow profile
 * parameters; the profile table is also reproduced verbatim in the Abracon,
 * Texas Instruments and Microchip handling notes. IPC-7530's typical window
 * comes from the AIM Solder reflow profile supplement, which reproduces the
 * IPC/JEDEC profile table.
 *
 * J-STD-020 classification reflow profile, both alloy families:
 *     Tsmin -> Tsmax      100->150 °C (SnPb)  150->200 °C (Pb-free)
 *     ts  (soak)          60-120 s            <- NOT the time above liquidus
 *     ramp-up             3 °C/s max
 *     TL                  183 °C (SnPb)       217 °C (Pb-free)
 *     tL (time at liquidus) 60-150 s           <- the time-above-liquidus window
 *     tp (within 5 °C of Tc) 20 s (SnPb)      30 s (Pb-free)
 *     ramp-down           6 °C/s max
 *     25 °C to peak       6 min (SnPb)        8 min (Pb-free)
 *
 * J-STD-020E Table 4-1, SnPb classification temperatures:
 *     thickness < 2.5 mm, volume <  350 mm³ -> 235 °C
 *     thickness < 2.5 mm, volume >= 350 mm³ -> 220 °C
 *     thickness >= 2.5 mm, any volume       -> 220 °C
 *
 * IPC-7530 typical guidance: ramp 1-3 °C/s, soak 150-200 °C for 60-120 s,
 * time above liquidus 30-90 s.
 *
 * Idempotent: every replacement is matched whole and guarded, so runs 2 and 3
 * are byte-identical no-ops.
 */
'use strict';
var fs = require('fs');
var path = require('path');

var dataDir = process.argv[2];
if (!dataDir) { console.error('usage: node apply-profile-limits-fix.js <data-dir>'); process.exit(2); }
var lfile = path.join(dataDir, 'lessons.json');
var qfile = path.join(dataDir, 'questions.json');
var lraw = fs.readFileSync(lfile, 'utf8');
var qraw = fs.readFileSync(qfile, 'utf8');
var lessons = JSON.parse(lraw);
var questions = JSON.parse(qraw);
var nL = 0, nQ = 0;

function lesson(id) {
  for (var i = 0; i < lessons.length; i++) if (lessons[i].lessonId === id) return lessons[i];
  console.error('  !! lesson ' + id + ' not found');
  return null;
}
/* Replace one exact substring inside a lesson's content. Distinguishes "already
 * applied" from "not found": a needle that is absent but whose replacement is
 * present means the fix has already run, which is not an error. A needle that is
 * absent with no replacement present means the source text moved, which is. */
function sub(id, needle, repl, why) {
  var l = lesson(id); if (!l) return;
  var before = JSON.stringify(l.content);
  var count = before.split(needle).length - 1;
  if (count !== 1) {
    if (count === 0 && before.indexOf(repl) >= 0) return;   /* already applied */
    console.error('  !! ' + id + ' [' + why + ']: needle occurs ' + count + ' times, expected 1');
    return;
  }
  l.content = JSON.parse(before.split(needle).join(repl));
  nL++;
}

/* ------------------------------------------------------------------ D10 --- */

sub('m06l01',
  'The time-above-liquidus window is process guidance rather than a J-STD-020 parameter: IPC-7530 and the paste datasheet typically call for 60-150 s for many assemblies.',
  'The time-above-liquidus window is bounded by J-STD-020, whose classification profile specifies tL, the time at liquidus, as 60-150 s for both alloy families. IPC-7530 and the paste datasheet narrow that into a working window: IPC-7530 typically calls for 30-90 s above liquidus, and the paste datasheet is the authority for the board being run.',
  'theory[2] TAL attribution');

sub('m06l01',
  'the measured time above liquidus against the paste-datasheet window, typically 60-150 s under IPC-7530 guidance.',
  'the measured time above liquidus against the J-STD-020 classification window of 60-150 s, narrowed by IPC-7530 typical guidance of 30-90 s and by the paste datasheet.',
  'theory[6] TAL attribution');

sub('m06l01',
  'a time above liquidus of 60-150 s from the paste datasheet.',
  'a time above liquidus of 60-150 s, the J-STD-020 classification window.',
  'calc.task');

sub('m06l01',
  '6. Compare time above liquidus 75 s with the paste-datasheet window of 60-150 s: pass. This window is IPC-7530 and datasheet guidance, not a J-STD-020 parameter.',
  '6. Compare time above liquidus 75 s with the J-STD-020 classification window of 60-150 s: pass. IPC-7530 typical guidance is 30-90 s, so 75 s also sits inside the usual process window; the paste datasheet remains the authority for this board.',
  'calc.solution step 6');

sub('m06l04',
  'The average ramp-up of 1-3 °C/s and the 60-150 s time-above-liquidus window come from IPC-7530 and the paste datasheet, not from J-STD-020.',
  'The average ramp-up of 1-3 °C/s comes from IPC-7530 and the paste datasheet; the 60-150 s time-above-liquidus window is J-STD-020 tL, and IPC-7530 typically narrows it to 30-90 s.',
  'theory[6] TAL attribution');

sub('m06l04',
  '2. Apply limits: ramp 1-3 °C/s and time above liquidus 60-150 s from IPC-7530 and the paste datasheet; the peak ceiling is the J-STD-020 classification temperature for the package size, 250 °C for a large package.',
  '2. Apply limits: ramp 1-3 °C/s from IPC-7530 and the paste datasheet; time above liquidus 60-150 s as the J-STD-020 classification window, narrowed to IPC-7530 typical guidance of 30-90 s; the peak ceiling is the J-STD-020 classification temperature for the package size, 250 °C for a large package.',
  'calc.solution step 2');

sub('m06l05',
  'IPC-7530B gives typical guidance of 60-120 s above liquidus. This window allows wetting and intermetallic formation',
  'IPC-7530B gives typical guidance of 30-90 s above liquidus. (The 60-120 s figure often quoted beside it is the soak, ts, the time from Tsmin to Tsmax in the J-STD-020 classification profile, not the time above liquidus.) This window allows wetting and intermetallic formation',
  'theory[4] soak mislabelled as TAL');

sub('m06l05',
  '5. Check time above liquidus against IPC-7530B typical guidance of 60-120 s: measured 75 s is within the guidance.',
  '5. Check time above liquidus against IPC-7530B typical guidance of 30-90 s: measured 75 s is within the guidance and clears the J-STD-020 tL minimum of 60 s.',
  'calc.solution step 5');

/* ------------------------------------------------------------------ D11 --- */

sub('m06l05',
  'the J-STD-020 classification temperature for SnPb eutectic is 220 C, while',
  'the J-STD-020 classification temperature for SnPb eutectic is 235 °C for a package thinner than 2.5 mm with a volume below 350 mm³ and 220 °C for every other case, while',
  'theory[2] SnPb Tc');

/* ------------------------------------------------------------------- D9 --- */

(function fixPowder() {
  var q = null;
  for (var i = 0; i < questions.length; i++) if (questions[i].questionId === 'q-m01l05-02') { q = questions[i]; break; }
  if (!q) { console.error('  !! q-m01l05-02 not found'); return; }
  var before = JSON.stringify(q);

  q.prompt =
    'IPC J-STD-005 Type 3 powder requires 80% of the powder to be between 25 and 45 µm, ' +
    'with no more than 10% below 20 µm and less than 1% above 45 µm. A certificate reports ' +
    'that 99.5% passes the 45 µm sieve and 95% is retained on the 25 µm sieve. Using the ' +
    'lesson formula for minimum overlap, what is the minimum percentage within 25-45 µm and ' +
    'the appropriate disposition?';

  q.options = [
    { id: 'a', text: '94.5%; accept because the certificate proves at least 94.5% in range, which meets the 80% requirement.' },
    { id: 'b', text: '80%; quarantine because the certificate does not prove the requirement is met.' },
    { id: 'c', text: '99.5%; accept because the two sieve results are additive.' },
    { id: 'd', text: '94.5%; reject because any excursion below 100% is automatically reject.' }
  ];
  q.correct = 'a';

  q.explanation =
    'The minimum overlap is 99.5% + 95% − 100% = 94.5%, so the certificate proves at least ' +
    '94.5% of the powder is within 25-45 µm. Because J-STD-005 Type 3 requires 80% minimum ' +
    'in range, the lot meets the in-band requirement. The tail limits are met as well: at ' +
    'most 0.5% is above 45 µm against the less-than-1% limit, and at most 5% is below 25 µm, ' +
    'which bounds the below-20 µm fraction at 5% against the 10% limit. Option b applies the ' +
    'requirement as if it were the measured overlap, option c adds the two sieve results ' +
    'instead of taking their minimum overlap, and option d invents a 100% requirement that ' +
    'the standard does not contain.';

  if (JSON.stringify(q) !== before) nQ++;
})();

/* ------------------------------------------------------------------ D12 --- */

/* Temperatures printed as "183 C". The trap is inline SVG path data, where a
 * cubic Bézier command "C160,240" follows a coordinate. A temperature is a
 * digit-run, a space, "C", then either a letter, "/", or the end of the string
 * -- never a digit, comma, minus or period, with or without intervening space.
 * SVG strings and figure blocks are skipped outright. */
function addDegree(s) {
  if (/<svg|path d=|<figure/.test(s)) return s;
  var re = /(\d+(?:\.\d+)?) C(?![a-zA-Z°])(?=\s*[^\s0-9,.\-]|$)/g;
  return s.replace(re, '$1 °C');
}
(function fixDegrees() {
  var n = 0;
  function walk(o) {
    if (typeof o === 'string') { var f = addDegree(o); if (f !== o) { n++; return f; } return o; }
    if (Array.isArray(o)) return o.map(walk);
    if (o && typeof o === 'object') {
      var out = {};
      Object.keys(o).forEach(function (k) {
        if (k === 'svg' || k === 'figure' || k === 'src') { out[k] = o[k]; return; }
        out[k] = walk(o[k]);
      });
      return out;
    }
    return o;
  }
  var fixed = lessons.map(function (l) { return l.lessonId === undefined ? l : Object.assign({}, l, { content: walk(l.content) }); });
  var changed = 0;
  for (var i = 0; i < lessons.length; i++) {
    if (JSON.stringify(fixed[i]) !== JSON.stringify(lessons[i])) { lessons[i] = fixed[i]; changed++; }
  }
  if (changed) nL += changed;
  console.log('degree symbols: ' + n + ' string(s) in ' + changed + ' lesson(s)');
})();

/* --------------------------------------------------------------- output --- */

var lout = JSON.stringify(lessons, null, 2) + '\n';
var qout = JSON.stringify(questions, null, 2) + '\n';
var did = 0;
if (lout !== lraw) { fs.writeFileSync(lfile, lout); did++; }
if (qout !== qraw) { fs.writeFileSync(qfile, qout); did++; }
console.log('lessons.json: ' + nL + ' lesson(s) corrected');
console.log('questions.json: ' + nQ + ' question(s) corrected');
if (did === 0) console.log('no change');
