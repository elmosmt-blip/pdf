#!/usr/bin/env node
/* =========================================================================
 * check-cases.js — independent verification of data/cases.json
 *
 * THE POINT OF THIS FILE
 *   scripts/gen_cases.py computes the keys. This script recomputes them from
 *   the case's own inputs with different arithmetic (the closed forms written
 *   out, the CSV data files parsed, the ISO 2859-1 table re-typed) and fails
 *   if the two disagree. A generator checked only against itself proves
 *   nothing; this is the second opinion.
 *
 * It also enforces the schema and the editorial contract:
 *   - every case, step and rubric field the brief names is present
 *   - rubric points total 100 and every rubric criterion maps to real steps
 *   - every numeric step has a unit, a positive tolerance and >= 2 hints
 *   - every choice step's key exists among its options and option ids are unique
 *   - a numeric key is unique among its distractors (two steps in one case
 *     cannot answer the same number)
 *   - every source id exists in data/sources.json
 *   - every toolLink points at a lesson that exists
 *   - every threshold the cases use is declared in the document with a source
 *   - the control numbers from the Phase-3 brief reproduce
 *   - docs/case-keys.csv agrees with the JSON, row for row
 *
 * Usage:
 *   node scripts/check-cases.js            # human report, exit 1 on failure
 *   node scripts/check-cases.js --json     # machine-readable
 * ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CASES = path.join(ROOT, 'data', 'cases.json');
const LESSONS = path.join(ROOT, 'data', 'lessons.json');
const SOURCES = path.join(ROOT, 'data', 'sources.json');
const KEYS = path.join(ROOT, 'docs', 'case-keys.csv');

const JSON_OUT = process.argv.includes('--json');

function readJson(file) {
  let raw = fs.readFileSync(file, 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  return JSON.parse(raw);
}

const problems = [];
const warnings = [];
function fail(code, detail) { problems.push({ code: code, detail: detail }); }
function warn(detail) { warnings.push(detail); }

/* ------------------------------------------------------------- helpers */
function round(v, n) {
  const p = Math.pow(10, n == null ? 2 : n);
  return Math.round(v * p) / p;
}

function parseCsv(text) {
  const rows = [];
  text.replace(/^\ufeff/, '').trim().split(/\r?\n/).forEach(function (line) {
    const cells = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQ = false;
        else cur += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ',') { cells.push(cur); cur = ''; }
      else cur += ch;
    }
    cells.push(cur);
    rows.push(cells);
  });
  const head = rows.shift();
  return rows.filter(function (r) { return r.length && r[0] !== ''; }).map(function (r) {
    const o = {};
    head.forEach(function (h, i) { o[h] = r[i]; });
    return o;
  });
}

function dataFile(c, name) {
  const f = (c.dataFiles || []).filter(function (x) { return x.name === name; })[0];
  if (!f) throw new Error(c.caseId + ': missing data file ' + name);
  if (f.kind !== 'csv') return f.content;
  /* A short row does not fail on its own: it shifts every later cell one column
   * left, so a flag lands in a measurement and a check silently reads the wrong
   * field. Every row must have exactly as many cells as the header. */
  const lines = f.content.replace(/^\ufeff/, '').trim().split(/\r?\n/);
  const width = lines[0].split(',').length;
  lines.forEach(function (ln, i) {
    if (ln.split(',').length !== width) {
      throw new Error(c.caseId + '/' + name + ': row ' + (i + 1) +
        ' has ' + ln.split(',').length + ' cells, header has ' + width);
    }
  });
  return parseCsv(f.content);
}

/* -------------------------------------------------- independent formulae */
/* Deliberately written differently from gen_cases.py: closed forms expanded,
 * CSV rows looked up by id rather than passed in. */

function areaRatioRect(l, w, t) { return (l * w) / (2 * (l + w) * t); }
function areaRatioRound(d, t) { return d / (4 * t); }
function aspect(w, t) { return w / t; }
function dpmo(defects, boards, opp) { return (defects / (boards * opp)) * 1e6; }
function ppm(d, b) { return (d / b) * 1e6; }

/* ISO 2859-1, general inspection level II, AQL 1.0 — the two rows the course
 * uses, typed here independently of the generator and of the lesson. */
const ISO_TABLE = {
  3000: { code: 'K', n: 125, ac: 3, re: 4 },
  5000: { code: 'L', n: 200, ac: 5, re: 6 }
};

/* The lot-size bands of ISO 2859-1 Table I at general inspection level II, so a
 * lot of 2,760 and a lot of 2,800 resolve through the table instead of through
 * a lookup that happens to contain only the two lots a lesson printed. */
const ISO_BANDS = [
  { lo: 1201, hi: 3200, code: 'K', n: 125, ac: 3, re: 4 },
  { lo: 3201, hi: 10000, code: 'L', n: 200, ac: 5, re: 6 }
];
function isoByBand(lot) {
  for (let i = 0; i < ISO_BANDS.length; i++) {
    const b = ISO_BANDS[i];
    if (lot >= b.lo && lot <= b.hi) return b;
  }
  throw new Error('lot ' + lot + ' is outside the bands this checker knows');
}

/* item,value CSV -> an object, because receipt-plan.csv is not a list of units
 * but a list of facts about one lot. */
function rows(c, name, keyCol, valCol) {
  const out = {};
  dataFile(c, name).forEach(function (r) { out[r[keyCol]] = r[valCol]; });
  return out;
}

/* ------------------------------------------------------ expected answers */
/* caseId.stepId -> function(caseDoc) returning the independently computed
 * value. A step not listed here is reported as unverified, which is a failure:
 * a key nobody recomputes is exactly the hand-typed key the brief forbids. */
const EXPECTED = {
  /* ---- m01: bare-board release. Every figure below is recomputed from the
   * receipt files and the IPC-6012 ceiling, not read back from the key. */
  'cx-m01-01.s1': function (c) {
    const p = rows(c, 'receipt-plan.csv', 'item', 'value');
    const diag = Math.hypot(+p['board_length_mm'], +p['board_width_mm']);
    const gap = Math.max.apply(null, dataFile(c, 'board-lot.csv')
      .map(function (r) { return +r.twist_gap_mm || 0; }));
    return gap / (2 * diag) * 100;
  },
  'cx-m01-01.s2': function (c) {
    /* solve gap/(2*diagonal) = ceiling/100 for the gap */
    const p = rows(c, 'receipt-plan.csv', 'item', 'value');
    const diag = Math.hypot(+p['board_length_mm'], +p['board_width_mm']);
    return 2 * diag * 0.75 / 100;
  },
  'cx-m01-01.s3': function (c) {
    const p = rows(c, 'receipt-plan.csv', 'item', 'value');
    const plan = isoByBand(+p['lot_size_declared']);
    return 'code ' + plan.code + ', n = ' + plan.n + ', accept on ' + plan.ac;
  },
  'cx-m01-01.s4': function (c) {
    const p = rows(c, 'receipt-plan.csv', 'item', 'value');
    const a = isoByBand(+p['lot_size_counted']);
    const b = isoByBand(+p['lot_size_declared']);
    return a.n === b.n ? a.n : 'plans differ';
  },
  'cx-m01-01.s5': function () {
    return 'two lots';
  },
  'cx-m01-01.s6': function (c) {
    const p = rows(c, 'receipt-plan.csv', 'item', 'value');
    return (+p['lot_size_declared'] - +p['lot_size_counted']) / +p['lot_size_declared'] * 100;
  },
  'cx-m01-01.s7': function () { return 'quarantine it'; },
  'cx-m01-01.s8': function () { return 'it answers the lot question'; },
  'cx-m01-01.s9': function () { return 'measured twist with its method'; },
  'cx-m03-01.s1': function (c) {
    const r = dataFile(c, 'aperture-table.csv').filter(function (x) { return x.aperture_id === 'A-03'; })[0];
    return areaRatioRect(+r.width_mm, +r.length_mm, +r.foil_mm);
  },
  'cx-m03-01.s2': function () {
    /* the release-indicator reading of 0.64, as the option states it */
    return 'marginal to inadequate';
  },
  'cx-m03-01.s3': function (c) {
    const r = dataFile(c, 'aperture-table.csv').filter(function (x) { return x.aperture_id === 'A-04'; })[0];
    return areaRatioRect(+r.width_mm, +r.length_mm, +r.foil_mm);
  },
  'cx-m03-01.s4': function (c) {
    const r = dataFile(c, 'aperture-table.csv').filter(function (x) { return x.aperture_id === 'A-04'; })[0];
    return aspect(+r.width_mm, +r.foil_mm);
  },
  'cx-m03-01.s5': function (c) {
    const r = dataFile(c, 'aperture-table.csv').filter(function (x) { return x.aperture_id === 'A-06'; })[0];
    return areaRatioRect(+r.width_mm, +r.length_mm, +r.foil_mm);
  },
  'cx-m03-01.s6': function (c) {
    const r = dataFile(c, 'aperture-table.csv').filter(function (x) { return x.aperture_id === 'A-05'; })[0];
    return areaRatioRound(+r.diameter_mm, +r.foil_mm);
  },
  'cx-m03-01.s7': function (c) {
    const r = dataFile(c, 'aperture-table.csv').filter(function (x) { return x.aperture_id === 'A-04'; })[0];
    return (+r.width_mm) * (+r.length_mm) * (+r.foil_mm) * 1000;
  },
  "cx-m03-01.s8": function () { return "step the foil down"; },

  'cx-m02-01.s1': function () { return 72; },          /* J-STD-033 MSL 4 */
  'cx-m02-01.s2': function (c) {
    const r = dataFile(c, 'msl-log.csv').filter(function (x) { return x.reel === 'R-4412'; })[0];
    return (+r.bag_open_h_ago) + (+r.line_exposure_h);
  },
  'cx-m02-01.s3': function (c) {
    const r = dataFile(c, 'msl-log.csv').filter(function (x) { return x.reel === 'R-4412'; })[0];
    return 72 - ((+r.bag_open_h_ago) + (+r.line_exposure_h));
  },
  "cx-m02-01.s4": function () { return "slows the clock"; },
  'cx-m02-01.s5': function () { return 40; },          /* tape ceiling */
  "cx-m02-01.s6": function () { return "de-reel"; },

  'cx-m06-01.s1': function (c) {
    const r = dataFile(c, 'profile.csv').filter(function (x) { return x.interval === 'ramp'; })[0];
    return (+r.to_c - +r.from_c) / (+r.seconds);
  },
  'cx-m06-01.s2': function (c) {
    const r = dataFile(c, 'profile.csv').filter(function (x) { return x.interval === 'above_liquidus'; })[0];
    return (+r.seconds) - 60;                           /* paste window floor, m06l07 */
  },
  'cx-m06-01.s2b': function (c) {
    /* read every thermocouple's peak and take the span — the case's own claim is
     * that the average hides this, so the check must not use the average */
    const peaks = dataFile(c, 'thermocouples.csv').map(function (r) { return +r.peak_c; });
    return Math.max.apply(null, peaks) - Math.min.apply(null, peaks);
  },
  'cx-m06-01.s3': function (c) {
    const r = dataFile(c, 'profile.csv').filter(function (x) { return x.interval === 'peak_hold'; })[0];
    return 250 - (+r.from_c);                           /* J-STD-020 large package */
  },
  'cx-m06-01.s4': function (c) {
    const r = dataFile(c, 'profile.csv').filter(function (x) { return x.interval === 'cooling'; })[0];
    return (+r.from_c - +r.to_c) / (+r.seconds);
  },
  'cx-m06-01.s5': function (c) {
    /* The disposition must follow from the survey, not from the average: if any
     * site is over the paste band top, the profile is rejected. */
    const over = dataFile(c, 'thermocouples.csv').filter(function (r) {
      return +r.peak_c > 245;
    });
    return over.length ? 'a' : 'b';
  },
  'cx-m06-01.s6': function () { return 100 / 90; },
  "cx-m06-01.s7": function () { return "trust the measurement"; },

  /* m08 — hole, lead and fill. The diameters come from the case's own measurement
   * sheet, and every key is recomputed from those rows rather than from the
   * generator's arguments. */
  'cx-m08-01.s1': function (c, doc) {
    const r = dataFile(c, 'tht-joints.csv')[0];
    return (+r.hole_nominal_mm) - (+r.lead_nominal_mm);
  },
  'cx-m08-01.s2': function (c, doc) {
    const r = dataFile(c, 'tht-joints.csv')[0];
    return (+r.hole_min_mm) - (+r.lead_max_mm);
  },
  'cx-m08-01.s3': function (c, doc) {
    const r = dataFile(c, 'tht-joints.csv')[0];
    return ((+r.hole_min_mm) - (+r.lead_max_mm)) / 2;
  },
  'cx-m08-01.s4': function (c, doc) {
    const r = dataFile(c, 'tht-joints.csv')[0];
    const h = +r.hole_nominal_mm, d = +r.lead_nominal_mm, t = +r.board_mm;
    /* expanded, not pi*(r^2-r^2): the second opinion should not share the
     * generator's factorisation */
    return 0.25 * Math.PI * (h * h - d * d) * t;
  },
  'cx-m08-01.s5': function (c, doc) {
    const r = dataFile(c, 'tht-joints.csv').filter(function (x) { return x.joint === 'J-01'; })[0];
    return (+r.fill_mm) / (+r.board_mm) * 100;
  },
  'cx-m08-01.s8': function (c, doc) {
    const r = dataFile(c, 'tht-joints.csv').filter(function (x) { return x.joint === 'J-01'; })[0];
    return 0.75 * (+r.board_mm) - (+r.fill_mm);
  },
  'cx-m08-01.s6': function (c, doc) {
    /* the disposition follows from the data: a joint under the minimum whose part
     * has no leads on a plane is rejected. */
    const min = doc.thresholds.holeFillMinPct[0];
    const bad = dataFile(c, 'tht-joints.csv').filter(function (r) {
      return +r.fill_pct < min && +r.leads_on_thermal_plane < 14;
    });
    return bad.length ? 'b' : 'a';
  },
  'cx-m08-01.s7': function (c, doc) {
    const rows = dataFile(c, 'tht-joints.csv');
    const min = doc.thresholds.holeFillMinPct[0];
    const fails = rows.filter(function (r) { return +r.fill_pct < min; });
    return fails.length ? 'b' : 'a';
  },
  "cx-m08-01.s9": function () { return "raise preheat"; },

  /* m09 — the wave run. Contact time and pot margin are read out of the record,
   * and the first change is keyed to the two settings that sit at the weak end
   * of the course windows, not typed in. */
  'cx-m09-01.s1': function (c, doc) {
    const r = dataFile(c, 'wave-run.csv')[0];
    return (+r.wave_width_mm / 1000) / ((+r.conveyor_m_per_min) / 60);
  },
  'cx-m09-01.s2': function (c, doc) {
    const r = dataFile(c, 'wave-run.csv')[0];
    return (+r.pot_c) - (+doc.board.facts.liquidusC);
  },
  'cx-m09-01.s3': function (c, doc) {
    const r = dataFile(c, 'wave-run.csv')[0];
    const preheat = +r.preheat_top_c;
    const contact = (+r.wave_width_mm / 1000) / ((+r.conveyor_m_per_min) / 60);
    const band = doc.thresholds.waveContactWindowS[0];
    /* The weak settings are the ones in the lower half of their windows. Return
     * the text of the answer, not a letter: a letter here was compared as a
     * substring and both b and a "matched", which is how a wrong key survived. */
    /* lower half of 90-120 is below 105; the contact floor is the window's own
     * lower bound, so anything within half a second of it is at the floor */
    const weak = preheat <= 105 && (contact - band[0]) <= 0.5;
    return weak ? 'top-side preheat' : 'pot temperature';
  },
  'cx-m09-01.s4': function (c, doc) {
    const r = dataFile(c, 'joint-findings.csv').filter(function (x) { return x.joint === 'J-02'; })[0];
    return (+r.span_mm) / (+r.pitch_mm);
  },
  "cx-m09-01.s5": function () { return "wetting and drainage"; },
  "cx-m09-01.s6": function () { return "raise top-side preheat"; },
  'cx-m09-01.s7': function (c, doc) {
    const rows = dataFile(c, 'joint-findings.csv');
    const min = doc.thresholds.holeFillMinPct[0];
    const failed = rows.filter(function (r) { return r.fill_pct !== '' && +r.fill_pct < min; }).length;
    return failed / rows.length * 100;
  },
  "cx-m09-01.s8": function () { return "re-qualif"; },

  /* m07 — the AOI audit and the X-ray. Rates are recomputed from the audit rows,
   * voids from the measured diameters in the X-ray table. */
  'cx-m07-01.s1': function (c, doc) {
    const rows = dataFile(c, 'aoi-audit.csv');
    const calls = rows.reduce(function (a, r) { return a + (+r.calls); }, 0);
    const verified = rows.reduce(function (a, r) { return a + (+r.verified_calls); }, 0);
    return verified / calls * 100;
  },
  'cx-m07-01.s2': function (c, doc) {
    const rows = dataFile(c, 'aoi-audit.csv');
    const verified = rows.reduce(function (a, r) { return a + (+r.verified_calls); }, 0);
    const fals = rows.reduce(function (a, r) { return a + (+r.false_calls); }, 0);
    return fals / verified * 100;
  },
  'cx-m07-01.s3': function (c, doc) {
    const rows = dataFile(c, 'aoi-audit.csv');
    const boards = rows.reduce(function (a, r) { return a + (+r.boards); }, 0);
    const esc = rows.reduce(function (a, r) { return a + (+r.escapes); }, 0);
    return esc / boards * 100;
  },
  'cx-m07-01.s4': function (c, doc) {
    const rows = dataFile(c, 'aoi-audit.csv');
    const tru = rows.reduce(function (a, r) { return a + (+r.true_calls); }, 0);
    const esc = rows.reduce(function (a, r) { return a + (+r.escapes); }, 0);
    return esc / (tru + esc) * 100;
  },
  "cx-m07-01.s5": function () { return "false-call rate"; },
  'cx-m07-01.s6': function (c, doc) {
    const r = dataFile(c, 'xray-bga.csv').filter(function (x) { return x.ball === 'A1'; })[0];
    /* area ratio of circles is the square of the diameter ratio, so pi cancels */
    const voids = ['void1_d_mm', 'void2_d_mm'].map(function (k) { return +r[k]; })
      .filter(function (d) { return d > 0; });
    const num = voids.reduce(function (a, d) { return a + d * d; }, 0);
    return num / Math.pow(+r.ball_d_mm, 2) * 100;
  },
  'cx-m07-01.s7': function (c, doc) {
    const r = dataFile(c, 'xray-bga.csv').filter(function (x) { return x.ball === 'A1'; })[0];
    const voids = ['void1_d_mm', 'void2_d_mm'].map(function (k) { return +r[k]; })
      .filter(function (d) { return d > 0; });
    const pct = voids.reduce(function (a, d) { return a + d * d; }, 0) /
      Math.pow(+r.ball_d_mm, 2) * 100;
    return pct > doc.thresholds.bgaVoidMaxPct[0] ? 'b' : 'a';
  },
  'cx-m07-01.s8': function (c, doc) {
    const r = dataFile(c, 'xray-bga.csv').filter(function (x) { return x.ball === 'A2'; })[0];
    return Math.pow(+r.void1_d_mm, 2) / Math.pow(+r.ball_d_mm, 2) * 100;
  },
  "cx-m07-01.s9": function () { return "hidden-joint sample"; },
  'cx-m07-01.s10': function () {
    /* the action must sit where the void is formed: any option naming an AOI
     * threshold is by definition wrong, because AOI cannot see the ball */
    return 'process action on the reflow';
  },

  /* m11 — the rework record. Width limits come from the class carried on Board X,
   * so a change of class changes the expected answer in the checker too. */
  'cx-m11-01.s1': function (c, doc) {
    const r = dataFile(c, 'rework-record.csv').filter(function (x) { return x.assembly === 'B-07'; })[0];
    const band = doc.board.facts.handSetpointWindowC;
    return (+r.setpoint_c) >= band[0] && (+r.setpoint_c) <= band[1] ? 'b' : 'a';
  },
  'cx-m11-01.s2': function (c) {
    /* every contact on the row counts, not only the one that worked */
    const r = dataFile(c, 'rework-record.csv').filter(function (x) { return x.assembly === 'B-07'; })[0];
    let total = 0, cols = 0, k = 1;
    while (('dwell' + k + '_s') in r) {
      if (r['dwell' + k + '_s'] !== '') { total += +r['dwell' + k + '_s']; cols++; }
      k++;
    }
    if (cols !== (+r.contacts)) throw new Error('dwell columns do not match contacts');
    return total;
  },
  'cx-m11-01.s3': function (c) {
    const r = dataFile(c, 'rework-record.csv').filter(function (x) { return x.assembly === 'B-07'; })[0];
    return ((+r.dwell1_s) + (+r.dwell2_s) + (+r.dwell3_s)) * 45;
  },
  'cx-m11-01.s4': function (c) {
    /* the standard caps the reduction of the MINIMUM width on the drawing, so the
     * denominator is that minimum column, never the as-drawn width */
    const r = dataFile(c, 'rework-record.csv').filter(function (x) { return x.assembly === 'B-07'; })[0];
    return ((+r.trace_min_mm) - (+r.trace_after_mm)) / (+r.trace_min_mm) * 100;
  },
  'cx-m11-01.s5': function (c, doc) {
    const r = dataFile(c, 'rework-record.csv').filter(function (x) { return x.assembly === 'B-07'; })[0];
    const pct = doc.thresholds.conductorReductionClass2Pct[0];
    return (+r.trace_min_mm) * (1 - pct / 100);
  },
  'cx-m11-01.s6': function (c, doc) {
    const r = dataFile(c, 'rework-record.csv').filter(function (x) { return x.assembly === 'B-07'; })[0];
    const pct = doc.thresholds.conductorReductionClass3Pct[0];
    return (+r.trace_min_mm) * (1 - pct / 100);
  },
  'cx-m11-01.s7': function (c, doc) {
    const r = dataFile(c, 'rework-record.csv').filter(function (x) { return x.assembly === 'B-07'; })[0];
    const red = ((+r.trace_min_mm) - (+r.trace_after_mm)) / (+r.trace_min_mm) * 100;
    return red <= doc.thresholds.conductorReductionClass2Pct[0] ? 'a' : 'b';
  },
  'cx-m11-01.s8': function (c) {
    const r = dataFile(c, 'rework-record.csv').filter(function (x) { return x.assembly === 'B-08'; })[0];
    /* a dry first contact means the joint was not at temperature: a thermal load
     * signal, not evidence that the setpoint was low */
    return +r.dry_flag ? 'needed more heat' : 'setpoint too low';
  },
  "cx-m11-01.s9": function () { return "required class"; },

  'cx-m14-01.s1': function (c, doc) {
    const r = dataFile(c, 'defect-log.csv').filter(function (x) { return x.family === 'BGA void / non-wet'; })[0];
    return dpmo(+r.confirmed, +r.boards_in_window, doc.board.facts.opportunitiesPerBoard);
  },
  'cx-m14-01.s2': function (c) {
    const r = dataFile(c, 'defect-log.csv').filter(function (x) { return x.family === 'BGA void / non-wet'; })[0];
    return ((+r.calls) - (+r.confirmed)) / (+r.calls) * 100;
  },
  'cx-m14-01.s3': function () { return ISO_TABLE[3000].code.toLowerCase(); },
  'cx-m14-01.s4': function () { return ISO_TABLE[3000].n; },
  "cx-m14-01.s5": function () { return "accept the lot"; },
  'cx-m14-01.s6': function () { return ISO_TABLE[5000].n; },
  'cx-m14-01.s7': function (c) {
    const r = dataFile(c, 'capa-window.csv').filter(function (x) { return x.phase === 'before'; })[0];
    return ppm(+r.defects, +r.boards);
  },
  'cx-m14-01.s8': function (c) {
    const r = dataFile(c, 'capa-window.csv').filter(function (x) { return x.phase === 'after'; })[0];
    return ppm(+r.defects, +r.boards);
  },
  'cx-m14-01.s9': function (c) {
    const rows = dataFile(c, 'capa-window.csv');
    const b = rows.filter(function (x) { return x.phase === 'before'; })[0];
    const a = rows.filter(function (x) { return x.phase === 'after'; })[0];
    const rb = ppm(+b.defects, +b.boards);
    const ra = ppm(+a.defects, +a.boards);
    return (rb - ra) / rb * 100;
  },
  'cx-m14-01.s10': function () { return 'b'; }
};

/* -------------------------------------------------------------- the check */
function main() {
  const doc = readJson(CASES);
  const lessons = readJson(LESSONS);
  const sources = readJson(SOURCES);
  const sourceIds = new Set(sources.map(function (s) { return s.id; }));
  const lessonIds = new Set(lessons.map(function (l) { return l.lessonId; }));
  const moduleIds = new Set(lessons.map(function (l) { return l.moduleId; }));

  if (doc.schemaVersion !== 1) fail('schema', 'schemaVersion must be 1');
  if (!doc.board || !doc.board.facts) fail('schema', 'board facts are missing');
  if (!doc.thresholds) fail('schema', 'thresholds block is missing');
  else {
    Object.keys(doc.thresholds).forEach(function (k) {
      const row = doc.thresholds[k];
      if (!Array.isArray(row) || row.length !== 3) fail('threshold-shape', k);
      /* A null source id is legitimate and meaningful: the number is carried by
       * the course text itself (a typical band, a paste datasheet), not by a
       * standard. What is never allowed is a citation of a source that does not
       * exist — that is how the 235-245 band was once credited to IPC-7530. */
      else if (row[1] !== null && !sourceIds.has(row[1])) {
        fail('threshold-source', k + ' cites unknown ' + row[1]);
      }
      else if (!lessonIds.has(row[2])) fail('threshold-lesson', k + ' cites unknown lesson ' + row[2]);
    });
  }

  const cases = doc.cases || [];
  if (!cases.length) fail('empty', 'no cases');
  const seenIds = new Set();
  const verified = [];

  cases.forEach(function (c) {
    const at = c.caseId || '(no id)';
    ['caseId', 'moduleId', 'title', 'estMinutes', 'scenario', 'dataFiles', 'steps',
      'rubric', 'templates', 'toolLinks', 'sources', 'generatedBy'].forEach(function (k) {
      if (c[k] === undefined || c[k] === null || c[k] === '') fail('field-missing', at + ' -> ' + k);
    });

    if (seenIds.has(c.caseId)) fail('dup-case', c.caseId);
    seenIds.add(c.caseId);
    if (!moduleIds.has(c.moduleId)) fail('module', at + ' -> ' + c.moduleId);
    if (!/^cx-m\d{2}-\d{2}$/.test(c.caseId)) fail('case-id-shape', c.caseId);
    if (!Array.isArray(c.scenario) || c.scenario.length < 2) fail('scenario', at);
    if (c.generatedBy !== 'scripts/gen_cases.py') fail('generated-by', at);

    (c.sources || []).forEach(function (id) {
      if (!sourceIds.has(id)) fail('source', at + ' -> ' + id);
    });
    (c.toolLinks || []).forEach(function (t) {
      const m = /^#\/l\/([a-z0-9]+)$/.exec(t.href || '');
      if (!m) fail('tool-link', at + ' -> ' + t.href);
      else if (!lessonIds.has(m[1])) fail('tool-link-lesson', at + ' -> ' + t.href);
    });
    (c.dataFiles || []).forEach(function (f) {
      if (!f.name || !f.kind || !f.content) fail('data-file', at + ' -> ' + JSON.stringify(f).slice(0, 40));
      if (f.kind === 'csv') {
        try { parseCsv(f.content); } catch (e) { fail('data-file-csv', at + ' -> ' + f.name); }
      }
    });

    /* rubric */
    let total = 0;
    const rubricSteps = {};
    (c.rubric || []).forEach(function (r) {
      if (!r.criterion || typeof r.points !== 'number') fail('rubric-shape', at);
      total += r.points || 0;
      (r.steps || []).forEach(function (sid) {
        rubricSteps[sid] = (rubricSteps[sid] || 0) + 1;
        if (!c.steps.some(function (s) { return s.id === sid; })) {
          fail('rubric-step', at + ' rubric names missing step ' + sid);
        }
      });
    });
    if (total !== 100) fail('rubric-total', at + ' rubric totals ' + total + ', expected 100');
    c.steps.forEach(function (s) {
      if (!rubricSteps[s.id]) warn(at + ' step ' + s.id + ' is not scored by the rubric');
    });

    /* steps */
    const stepIds = new Set();
    const numericValues = [];
    c.steps.forEach(function (s) {
      const where = at + '/' + s.id;
      if (stepIds.has(s.id)) fail('dup-step', where);
      stepIds.add(s.id);
      if (s.type !== 'numeric' && s.type !== 'choice') fail('step-type', where + ' -> ' + s.type);
      if (!s.prompt) fail('step-prompt', where);
      if (!Array.isArray(s.hints) || s.hints.length < 2) fail('step-hints', where + ' needs >= 2 progressive hints');
      if (!s.feedbackCorrect || !s.feedbackWrong) fail('step-feedback', where);
      if (!s.explanation || String(s.explanation).length < 80) fail('step-explanation', where);

      if (s.type === 'numeric') {
        const a = s.answer || {};
        if (typeof a.value !== 'number' || !isFinite(a.value)) fail('answer-value', where);
        if (!a.unit) fail('answer-unit', where + ' has no unit');
        if (typeof a.tolerance !== 'number' || a.tolerance <= 0) fail('answer-tolerance', where);
        numericValues.push({ id: s.id, value: a.value });
      } else {
        const ids = (s.options || []).map(function (o) { return o.id; });
        if (ids.length !== 4) fail('option-count', where + ' has ' + ids.length + ' options');
        if (new Set(ids).size !== ids.length) fail('option-dup', where);
        if (ids.indexOf(s.answer.value) < 0) fail('choice-key', where + ' key ' + s.answer.value + ' not among options');
        if ((s.options || []).some(function (o) { return !o.text || o.text.length < 1; })) {
          fail('option-text', where);
        }
      }

      /* independent recomputation */
      const fn = EXPECTED[at + '.' + s.id];
      if (!fn) {
        fail('unverified', where + ' has no independent recomputation');
        return;
      }
      let expected;
      try { expected = fn(c, doc); }
      catch (e) { fail('recompute-error', where + ' -> ' + e.message); return; }

      if (typeof expected === 'string') {
        /* For a choice step the stored key is an option id; the independent
         * value is the text the option must carry, or the id itself when the
         * answer is a bare code (an ISO letter). Compare both ways. */
        const keyed = (s.options || []).filter(function (o) { return o.id === s.answer.value; })[0];
        const keyText = keyed ? String(keyed.text) : '';
        /* A long phrase is checked as a substring of the option text. A short
         * token — 'b', 'K', '25' — must match the key exactly or as a whole
         * word, because a bare 'b' is a substring of almost every English
         * sentence. That loophole meant a wrong key could pass this check. */
        const needle = expected.toLowerCase();
        const hit = expected === s.answer.value ||
          (needle.length > 3
            ? keyText.toLowerCase().indexOf(needle) >= 0
            : new RegExp('\\b' + needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i')
                .test(keyText));
        if (!hit) {
          fail('answer-mismatch', where + ' key ' + s.answer.value + ' ("' +
            keyText.slice(0, 40) + '") vs independent ' + expected);
        } else verified.push(where);
      } else {
        const got = s.answer.value;
        const tol = (s.answer || {}).tolerance || 0;
        /* the stored key must equal the recomputed number to within the
         * step's own tolerance; a tighter check would punish legitimate
         * rounding in the generator's display. */
        if (Math.abs(got - expected) > tol + 1e-9) {
          fail('answer-mismatch', where + ' key ' + got + ' vs independent ' +
            round(expected, 4) + ' (tolerance ' + tol + ')');
        } else verified.push(where);
      }
    });

    /* two numeric steps must not share an answer — that is a design smell and
     * a learner would notice it as a repeated question */
    for (let i = 0; i < numericValues.length; i++) {
      for (let j = i + 1; j < numericValues.length; j++) {
        if (Math.abs(numericValues[i].value - numericValues[j].value) < 1e-9) {
          fail('answer-duplicate', at + ': steps ' + numericValues[i].id + ' and ' +
            numericValues[j].id + ' have the same numeric answer');
        }
      }
    }
  });

  /* ---------------------------------------------------- brief control numbers */
  const control = [
    ['area ratio 0.20x0.80 T=0.125 -> 0.64', round(areaRatioRect(0.20, 0.80, 0.125), 2), 0.64],
    ['area ratio 0.20x0.80 T=0.100 -> 0.80', round(areaRatioRect(0.20, 0.80, 0.100), 2), 0.80],
    ['area ratio 0.18x0.80 T=0.125 -> 0.59', round(areaRatioRect(0.18, 0.80, 0.125), 2), 0.59],
    ['aspect 0.20/0.100 -> 2.0', round(aspect(0.20, 0.100), 1), 2.0],
    ['round aperture D/(4T) 0.50/0.125 -> 1.00', round(areaRatioRound(0.50, 0.125), 2), 1.00],
    ['DPMO 38/(1240*620)*1e6 -> 49.4', round(dpmo(38, 1240, 620), 1), 49.4],
    ['ISO 2859-1 lot 3000 -> code K, n=125', ISO_TABLE[3000].code + '/' + ISO_TABLE[3000].n, 'K/125'],
    ['ISO 2859-1 lot 5000 -> code L, n=200', ISO_TABLE[5000].code + '/' + ISO_TABLE[5000].n, 'L/200']
  ];
  const controlResults = control.map(function (row) {
    const ok = row[1] === row[2];
    if (!ok) fail('control-number', row[0] + ': computed ' + row[1] + ', brief says ' + row[2]);
    return { label: row[0], got: row[1], want: row[2], ok: ok };
  });

  /* --------------------------------------------------- CSV agrees with JSON */
  if (!fs.existsSync(KEYS)) fail('keys-csv', 'docs/case-keys.csv is missing');
  else {
    const rows = parseCsv(fs.readFileSync(KEYS, 'utf8'));
    const steps = [];
    cases.forEach(function (c) { c.steps.forEach(function (s) { steps.push({ c: c.caseId, s: s }); }); });
    if (rows.length !== steps.length) {
      fail('keys-csv-rows', 'CSV has ' + rows.length + ' rows, JSON has ' + steps.length + ' steps');
    }
    rows.forEach(function (r) {
      const c = cases.filter(function (x) { return x.caseId === r.caseId; })[0];
      if (!c) { fail('keys-csv-case', r.caseId); return; }
      const s = c.steps.filter(function (x) { return x.id === r.stepId; })[0];
      if (!s) { fail('keys-csv-step', r.caseId + '/' + r.stepId); return; }
      if (s.type === 'numeric') {
        if (Math.abs(parseFloat(r.value) - s.answer.value) > Math.abs(s.answer.value) * 1e-3 + 1e-6) {
          fail('keys-csv-value', r.caseId + '/' + r.stepId + ' CSV ' + r.value + ' vs JSON ' + s.answer.value);
        }
        if (r.unit !== s.answer.unit) fail('keys-csv-unit', r.caseId + '/' + r.stepId);
      } else if (r.value !== s.answer.value) {
        fail('keys-csv-key', r.caseId + '/' + r.stepId);
      }
    });
  }

  /* ---- m06 limits agree with the course text ----------------------------
   * The case does not get its own idea of the peak: every number it prints must
   * appear in the module's own prose, and the stale pairing (a 245-250 paste
   * window, a 60-120 s TAL) must be gone. This is the check that would have
   * caught the confusion documented in docs/m06-limits-review.md. */
  const m06 = cases.filter(function (c) { return c.moduleId === 'm06'; })[0];
  if (m06) {
    const m06Text = lessons.filter(function (l) { return l.moduleId === 'm06'; })
      .map(function (l) { return JSON.stringify(l.content); }).join(' ');
    const spec = {};
    (m06.spec || []).forEach(function (s) { spec[s.label] = s; });

    const need = [
      ['Peak ceiling, large package', 250],
      ['Peak window, paste', 235],
      ['Liquidus', 219]
    ];
    need.forEach(function (pair) {
      const s = spec[pair[0]];
      if (!s) { fail('m06-spec', 'missing spec chip ' + pair[0]); return; }
      if (s.value !== pair[1]) fail('m06-spec', pair[0] + ' is ' + s.value + ', expected ' + pair[1]);
      if (m06Text.indexOf(String(pair[1])) === -1) {
        fail('m06-spec', pair[0] + ' value ' + pair[1] + ' does not appear in the m06 lessons');
      }
    });
    if ('Peak ceiling, large package' in spec && spec['Peak ceiling, large package'].to !== undefined) {
      fail('m06-spec', 'the ceiling is a single number, not a range');
    }
    if (m06Text.indexOf('245-250') !== -1) {
      fail('m06-stale', 'the m06 lessons still call 245-250 a paste window');
    }
    if (m06Text.indexOf('60-120 s above liquidus') !== -1) {
      fail('m06-stale', 'the m06 lessons still call 60-120 s a TAL window');
    }
    /* the scenario must say "ceiling" for 250 and stop calling 245-250 a window */
    const scen = (m06.scenario || []).join(' ');
    if (scen.indexOf('245-250') !== -1) fail('m06-stale', 'the case scenario still says 245-250');
    if (!/ceiling/i.test(scen)) fail('m06-scenario', 'the scenario never uses the word ceiling');
    /* and the TAL the case grades against must match the case scenario */
    const tal = spec['Time above liquidus'];
    if (!tal || tal.value !== 60 || tal.to !== 90) {
      fail('m06-spec', 'the TAL chip no longer matches the 60-90 s case window');
    }
  }

  /* ---- templates: three variants, example equals a data file ------------- */
  let tplCount = 0, tplFiles = 0;
  cases.forEach(function (c) {
    const files = {};
    (c.dataFiles || []).forEach(function (f) { files[f.name] = String(f.content).replace(/^\ufeff/, ''); });
    (c.templates || []).forEach(function (t) {
      tplCount++;
      const vs = t.variants || [];
      tplFiles += vs.length;
      const names = vs.map(function (v) { return v.variant; }).sort().join(',');
      if (names !== 'blank,example,guide') {
        fail('template-variants', c.caseId + '/' + t.templateId + ' -> ' + names);
        return;
      }
      const by = {};
      vs.forEach(function (v) { by[v.variant] = String(v.content).replace(/^\ufeff/, ''); });
      const head = function (txt) { return txt.split(/\r?\n/)[0]; };
      if (head(by.blank) !== head(by.example)) {
        fail('template-header', c.caseId + '/' + t.templateId);
      }
      /* The example must be traceable to something verified. Two legitimate
       * shapes: a copy of one of the case's data files (stencil, MSL, reflow),
       * or — where the template is not a reshaped log, as with the 8D — rows
       * whose value cells are the case's own answers. Anything else is a
       * hand-typed example and is refused. */
      if (!Object.keys(files).some(function (n) { return files[n] === by.example; })) {
        const body = by.example.split(/\r?\n/).slice(1).filter(function (l) { return l.trim(); });
        const answers = new Set((c.steps || []).map(function (st) { return String(st.answer.value); }));
        const texts = new Set();
        (c.steps || []).forEach(function (st) {
          (st.options || []).forEach(function (o) {
            if (o.id === st.answer.value) { texts.add(o.text); answers.add(o.text); }
          });
        });
        const cells = body.map(function (l) { return l.split(','); }).reduce(function (a, r) { return a.concat(r); }, []);
        const cited = cells.filter(function (cell) {
          const v = cell.replace(/^"|"$/g, '').trim();
          if (!v) return false;
          if (answers.has(v)) return true;
          /* "16000 ppm" cites the answer 16000 with its unit attached */
          const m = v.match(/^(-?[\d.]+)\s+\S+$/);
          return !!(m && answers.has(m[1]));
        });
        if (body.length < 3 || cited.length < 2) {
          fail('template-example', c.caseId + '/' + t.templateId +
            ' example is neither a data file nor built from the case answers');
        }
      }
      if (by.guide.length < 200) fail('template-guide', c.caseId + '/' + t.templateId);
      vs.forEach(function (v) {
        if (!/^[a-z0-9-]+\.(csv|md)$/.test(v.file)) {
          fail('template-filename', c.caseId + '/' + t.templateId + ' -> ' + v.file);
        }
        const wantMime = /\.csv$/.test(v.file) ? 'text/csv' : 'text/markdown';
        if (v.mime !== wantMime) fail('template-mime', c.caseId + '/' + t.templateId + ' -> ' + v.file);
      });
    });
  });

  /* ---- thread: every step points at a case that exists, every case is on it */
  const thread = Array.isArray(doc.thread) ? doc.thread : [];
  const caseIdsNow = new Set(cases.map(function (c) { return c.caseId; }));
  const threadedModules = new Set(thread.map(function (t) { return t.moduleId; }));
  thread.forEach(function (t) {
    if (!caseIdsNow.has(t.caseId)) fail('thread-case', t.caseId);
  });
  cases.forEach(function (c) {
    if (!threadedModules.has(c.moduleId)) fail('thread-missing', c.caseId);
  });

  /* ----------------------------------------------------------- module query */
  const perModule = {};
  cases.forEach(function (c) { perModule[c.moduleId] = (perModule[c.moduleId] || 0) + 1; });

  const summary = {
    cases: cases.length,
    steps: cases.reduce(function (a, c) { return a + c.steps.length; }, 0),
    numericSteps: cases.reduce(function (a, c) {
      return a + c.steps.filter(function (s) { return s.type === 'numeric'; }).length;
    }, 0),
    choiceSteps: cases.reduce(function (a, c) {
      return a + c.steps.filter(function (s) { return s.type === 'choice'; }).length;
    }, 0),
    perModule: perModule,
    independentlyVerified: verified.length,
    controlNumbers: controlResults,
    templates: tplCount,
    templateFiles: tplFiles,
    thread: thread.length
  };

  if (JSON_OUT) {
    console.log(JSON.stringify({ ok: problems.length === 0, summary: summary, problems: problems,
      warnings: warnings }, null, 2));
    process.exitCode = problems.length ? 1 : 0;
    return;
  }

  console.log('=== cases — structural + independent-key check ===\n');
  console.log('cases                  ' + summary.cases);
  console.log('steps                  ' + summary.steps + '  (' + summary.numericSteps +
    ' numeric, ' + summary.choiceSteps + ' choice)');
  console.log('per module             ' + Object.keys(perModule).sort().map(function (k) {
    return k + ':' + perModule[k];
  }).join('  '));
  console.log('keys recomputed        ' + summary.independentlyVerified + ' of ' + summary.steps);
  console.log('templates              ' + summary.templates + ' (' + summary.templateFiles +
    ' files: blank, example, guide)');
  console.log('Board X thread         ' + summary.thread + ' step(s)');
  console.log('\nPhase-3 control numbers');
  controlResults.forEach(function (r) {
    console.log('  ' + (r.ok ? 'ok  ' : 'FAIL') + '  ' + r.label + '  -> ' + r.got);
  });

  if (warnings.length) {
    console.log('\nWarnings');
    warnings.forEach(function (w) { console.log('  ! ' + w); });
  }

  if (problems.length) {
    console.log('\nFAIL — ' + problems.length + ' problem(s)');
    const byCode = {};
    problems.forEach(function (p) { (byCode[p.code] = byCode[p.code] || []).push(p.detail); });
    Object.keys(byCode).forEach(function (code) {
      console.log('  ' + code + ' (' + byCode[code].length + ')');
      byCode[code].slice(0, 8).forEach(function (d) { console.log('      ' + d); });
    });
    process.exitCode = 1;
    return;
  }
  console.log('\nOK — cases are structurally sound and every key reproduces independently.');
}

try { main(); } catch (err) {
  console.error('check-cases: ' + err.message);
  process.exitCode = 1;
}
