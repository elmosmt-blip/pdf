#!/usr/bin/env node
/**
 * build-review-checklist.js — generate the reviewer checklist.
 *
 * The course ships a TBD-REVIEW list on every lesson, but those lists are
 * auto-extracted from the worked calculations: they flag the arithmetic of
 * hypothetical drill data, which needs no verification, and stay silent about
 * the claims that do carry risk — what the lesson asserts a standard says.
 *
 * This generator walks all 92 lessons, pulls every sentence that cites a
 * standard, and emits a checklist a human can actually work through:
 *
 *   Part A  the ~25 recurring facts that generate most of the 479 claim
 *           sentences. Verify each fact once against the standard and most of
 *           the course is covered.
 *   Part B  every distinct claim, grouped by standard, with lesson id, where it
 *           lives and the verbatim sentence.
 *   Part C  per-lesson sign-off, 92 rows, so promotion can happen lesson by
 *           lesson rather than all-or-nothing.
 *   Part D  what has already been checked automatically, and what "done" means.
 *
 * It only writes the checklist. It never touches lesson status or review fields:
 * removing the markers is a human action, and this document is the gate.
 *
 * Usage: node build-review-checklist.js <lessons.json> <sources.json> <out.md> [questions.json]
 */

'use strict';

var fs = require('fs');

/* ---------------------------------------------------------------- patterns */

var PATTERNS = [
  'IPC-TM-650', 'ANSI/ESD S20\\.20',
  'ANSI/ESD STM[0-9]+(?:\\.[0-9]+)?',
  'IEC 61340-[0-9]+(?:-[0-9]+)?',
  'J-STD-020', 'J-STD-033', 'J-STD-001', 'J-STD-004', 'J-STD-005', 'J-STD-006',
  'IPC-A-610', 'IPC-6012', 'IPC-7095', 'IPC-7351', 'IPC-7525', 'IPC-7526',
  'IPC-7530', 'IPC-7711', 'IPC-7721', 'IPC-CC-830', 'ISO 2859-1'
];
var STD_RE = new RegExp('(' + PATTERNS.join('|') + ')', 'g');

/* The facts that recur across the course. Each entry is what the reviewer must
   confirm against the standard, plus the value the course currently asserts, so
   a mismatch is visible without opening the lesson. The values recorded here
   are the ones the earlier audit rounds settled on. */
var RECURRING = [
  {
    fact: 'SAC305 phase change temperatures',
    assert: 'solidus 217 °C, liquidus 219 °C',
    verify: 'Alloy supplier datasheet / IPC J-STD-006 alloy designation tables',
    re: /solidus/i,
    note: 'The course uses 217 for solidus and 219 for liquidus throughout. An earlier draft swapped them; rounds 2-4 fixed every occurrence.'
  },
  {
    fact: 'J-STD-020 classification temperature by package size',
    assert: '260 °C small, 250 °C large, 245 °C very large',
    verify: 'J-STD-020 classification temperature tables',
    re: /classification temperature/i
  },
  {
    fact: 'J-STD-020 tp — time within 5 °C of classification temperature',
    assert: 'max 30 s for large/very large, 40 s for small',
    verify: 'J-STD-020 reflow profile requirements',
    re: /\btp\b|time within 5/i
  },
  {
    fact: 'J-STD-020 ramp-down limit',
    assert: '≤ 6 °C/s',
    verify: 'J-STD-020 reflow profile requirements',
    re: /ramp-down|ramp down|cooling rate/i
  },
  {
    fact: 'J-STD-033 bake at 125 °C by thickness',
    assert: '8 h ≤1.4 mm, 18 h >1.4-2.0 mm, 48 h >2.0-4.5 mm',
    verify: 'J-STD-033 Table 4-1 (user bake, clock resets to t=0)',
    re: /125\s*°?\s*C/i
  },
  {
    fact: 'J-STD-033 bake at 90 °C and 40 °C',
    assert: '90 °C: 25-30 h / 48 h / 96-192 h;  40 °C: 8-12 days / 11+ days / 38+ days',
    verify: 'J-STD-033 Table 4-1',
    re: /90\s*°?\s*C|40\s*°?\s*C/i
  },
  {
    fact: 'J-STD-033 cumulative bake cap',
    assert: 'cumulative time above 90 °C up to 125 °C ≤ 96 h; above 125 °C needs supplier approval',
    verify: 'J-STD-033 cumulative bake guidance',
    re: /cumulative/i
  },
  {
    fact: 'Tape-and-reel dry-pack temperature cap',
    assert: 'capped at 40 °C',
    verify: 'J-STD-033 handling guidance for tape-and-reel',
    re: /tape[- ]and[- ]reel/i
  },
  {
    fact: 'MSL 6 floor life',
    assert: 'no floor life — mandatory bake before use, then reflow within the label time limit',
    verify: 'J-STD-020 / J-STD-033 MSL definitions',
    re: /MSL\s*6|floor life/i
  },
  {
    fact: 'IPC-A-610 minimum vertical barrel fill',
    assert: '75 % for both Class 2 and Class 3',
    verify: 'IPC-A-610H section 10, through-hole solder fill',
    re: /75\s*%|barrel fill|vertical fill/i,
    note: 'The "Class 2 = 50 %, Class 3 = 75 %" split is a myth; the course states 75 % for both.'
  },
  {
    fact: 'IPC-A-610 documented hole-fill exception',
    assert: '≈50 % fill or 1.2 mm for parts with ≥14 leads tied to internal thermal or conductor planes',
    verify: 'IPC-A-610H section 10 exception clause',
    re: /1\.2\s*mm|fourteen|14 leads/i
  },
  {
    fact: 'Contractual 100 % fill',
    assert: 'a customer requirement, not an IPC-A-610 class limit',
    verify: 'IPC-A-610H section 10 and the customer contract',
    re: /100\s*%\s*fill|contractual/i
  },
  {
    fact: 'IPC-A-610 Class 3 external annular ring',
    assert: 'minimum 0.05 mm with no breakout',
    verify: 'IPC-A-610 annular ring criteria',
    re: /annular ring|0\.05\s*mm/i
  },
  {
    fact: 'ISO 2859-1 code letter to sample size',
    assert: 'A2 B3 C5 D8 E13 F20 G32 H50 J80 K125 L200 M315 N500 P800 Q1250 R2000',
    verify: 'ISO 2859-1 / ANSI-ASQ Z1.4 Table II-A',
    re: /code letter/i
  },
  {
    fact: 'ISO 2859-1 lot-size to code letter by inspection level',
    assert: '501-1200 G/J/K;  1201-3200 H/K/L;  3201-10000 J/L/M',
    verify: 'ISO 2859-1 Table I',
    re: /1201|3201|501\s*[-\u2013]\s*1200/i
  },
  {
    fact: 'ISO 2859-1 single-sampling Ac/Re at AQL 1.0 %',
    assert: 'K → n=125, Ac=3, Re=4;  L → n=200, Ac=5, Re=6',
    verify: 'ISO 2859-1 normal single-sampling plans, AQL 1.0 %',
    re: /Ac\s*=\s*\d|acceptance number|rejection number/i
  },
  {
    fact: 'IPC-7525 stencil area ratio and aspect ratio',
    assert: 'area ratio 0.66, aspect ratio 1.5;  area ratio = aperture area ÷ sidewall area',
    verify: 'IPC-7525 stencil design guidelines',
    re: /area ratio|aspect ratio/i
  },
  {
    fact: 'J-STD-004/005 solder powder Type 3',
    assert: '25-45 µm, ≥80 % between sieves, <10 % below 25 µm, <10 % in 45-60 µm, <0.5 % above 60 µm',
    verify: 'J-STD-005 powder size distribution tables',
    re: /Type 3|25\s*[-\u2013]\s*45/i
  },
  {
    fact: 'Wave flux deposition on a solids basis',
    assert: '500-1500 µg/in² of flux solids (≈0.78-2.33 g/m²)',
    verify: 'Flux supplier process window / AIM profile supplement',
    re: /µg\/in|ug\/in|flux solids|deposition/i,
    note: 'The 0.5-1.0 g/ft² figures are a liquid basis, not solids; the course states the solids basis.'
  },
  {
    fact: 'Preheat ramp rate for wave and selective',
    assert: '1-3 °C/s',
    verify: 'Equipment and paste datasheets; IPC-7530 profiling guidance',
    re: /1\s*[-\u2013]\s*3\s*°?\s*C\s*\/\s*s|ramp (?:rate )?of 1\s*[-\u2013]\s*3/i
  },
  {
    fact: 'IPC rework document numbers',
    assert: 'IPC-7711/7721 (rework, modification and repair)',
    verify: 'IPC document catalogue',
    re: /7711|7721|7712/,
    note: 'An earlier draft cited IPC-7711/7712; rounds 3-4 corrected every occurrence. 7712 does not cover this subject.'
  },
  {
    fact: 'IPC-CC-830 conformal coating type designations',
    assert: 'AR acrylic, ER polyurethane, SR silicone, DR parylene',
    verify: 'IPC-CC-830 type designation tables',
    re: /CC-830|conformal coating|acrylic|polyurethane|parylene/i
  },
  {
    fact: 'IPC-6012 bow and twist limit',
    assert: '0.75 % for boards using surface-mount components, 1.5 % for other boards',
    verify: 'IPC-6012 bow/twist requirement, measured per IPC-TM-650 2.4.22',
    re: /bow and twist|0\.75\s*%|1\.5\s*%/i
  },
  {
    fact: 'Cleanliness ionic limit',
    assert: '1.56 µg NaCl equivalent/cm² (IPC-TM-650 2.3.25)',
    verify: 'IPC-TM-650 2.3.25 and IPC-6012 cleanliness clause',
    re: /1\.56|NaCl/i
  },
  {
    fact: 'ESD programme and test-method standards',
    assert: 'ANSI/ESD S20.20 for the programme; STM3.1 → IEC 61340-4-7 ionisation; STM97.1/97.2 → IEC 61340-4-5 footwear and flooring',
    verify: 'ANSI/ESD S20.20 and the ESD Association test-method catalogue',
    re: /S20\.20|STM3\.1|STM97|ionisation|ionization/i,
    note: 'An earlier draft cited STM97.7/97.8 for ionisation; no such standards exist. Corrected in round 3.'
  }
];

/* ------------------------------------------------------------------ helpers */

function collectStrings(obj, where, out) {
  if (obj === null || obj === undefined) return;
  if (typeof obj === 'string') { out.push({ where: where, text: obj }); return; }
  if (Array.isArray(obj)) {
    obj.forEach(function (v, i) { collectStrings(v, where + '[' + i + ']', out); });
    return;
  }
  if (typeof obj === 'object') {
    Object.keys(obj).forEach(function (k) { collectStrings(obj[k], where + '.' + k, out); });
  }
}

function sentences(text) {
  return String(text).replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"(])/)
    .map(function (s) { return s.trim(); })
    .filter(function (s) { return s.length > 3; });
}

function esc(s) { return String(s).replace(/\|/g, '\\|'); }

/* --------------------------------------------------------------------- main */

function main() {
  var lessons = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  var sources = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
  /* The lesson's own quiz field is only a list of question ids; the questions
     themselves live in questions.json and carry their lessonId. Scan them, or
     every claim that appears only in a prompt or an explanation is missed. */
  var questions = process.argv[5] ? JSON.parse(fs.readFileSync(process.argv[5], 'utf8')) : [];
  var questionsByLesson = {};
  questions.forEach(function (q) {
    if (!questionsByLesson[q.lessonId]) questionsByLesson[q.lessonId] = [];
    questionsByLesson[q.lessonId].push(q);
  });

  /* --- Part B source data: every distinct claim, grouped by standard ------ */
  var byStandard = {};
  var perLesson = {};

  lessons.forEach(function (l) {
    var strings = [];
    collectStrings(l.content.theory, 'theory', strings);
    collectStrings(l.content.calc, 'calc', strings);
    collectStrings(l.content.defect, 'defect', strings);
    (questionsByLesson[l.lessonId] || []).forEach(function (q) {
      collectStrings(q, 'quiz.' + q.questionId, strings);
    });

    var seen = {};
    var stds = {};
    var count = 0;

    strings.forEach(function (s) {
      sentences(s.text).forEach(function (sent) {
        STD_RE.lastIndex = 0;
        var m;
        while ((m = STD_RE.exec(sent)) !== null) {
          var std = m[1].replace(/\\/g, '');
          var key = std + '|' + sent;
          if (seen[key]) continue;
          seen[key] = true;
          count++;
          stds[std] = 1;
          if (!byStandard[std]) byStandard[std] = [];
          byStandard[std].push({ lessonId: l.lessonId, where: s.where, sentence: sent });
        }
      });
    });

    perLesson[l.lessonId] = {
      lessonId: l.lessonId, title: l.title, status: l.status,
      count: count, standards: Object.keys(stds).sort()
    };
  });

  var totalClaims = 0;
  Object.keys(byStandard).forEach(function (k) { totalClaims += byStandard[k].length; });

  /* --- Part A source data: which lessons each recurring fact appears in ---- */
  /* Test against content AND quiz: the quiz questions and their explanations sit
     in lesson.quiz, a sibling of lesson.content, so a facts scan over content
     alone silently misses every figure that only appears in a question. */
  function lessonText(l) {
    return JSON.stringify(l.content) + JSON.stringify(questionsByLesson[l.lessonId] || []);
  }
  RECURRING.forEach(function (f) {
    f.lessons = lessons.filter(function (l) { return f.re.test(lessonText(l)); })
      .map(function (l) { return l.lessonId; });
  });
  RECURRING.sort(function (a, b) { return b.lessons.length - a.lessons.length; });

  /* ------------------------------------------------------------- render */

  var out = [];
  var w = function (s) { out.push(s); };

  w('# Review checklist — what must be checked before the draft markers come off');
  w('');
  w('This document is the gate for removing `TBD-REVIEW` from the course. It does not');
  w('remove anything itself: every lesson still carries `status: "draft"` and its');
  w('original review string, untouched. Promotion is a human action — this is the list');
  w('that makes it a decision rather than a leap.');
  w('');
  w('## Why the existing TBD-REVIEW lists are not the checklist');
  w('');
  w('Each lesson ships a list of numbers flagged as unverified. Those lists are');
  w('auto-extracted from the worked calculation, so on a calculation-drill lesson they');
  w('enumerate the drill\'s own inputs and its arithmetic results. `m14l01`, the Pareto');
  w('and measurement-integrity drill, carries 62 of them; every one was checked and all');
  w('30 arithmetic steps reconcile.');
  w('');
  w('That makes the list long where the risk is lowest and silent where the risk is');
  w('highest. `m08l05` lists 15 numbers, all geometry from the example, and none of the');
  w('standards claims in its own theory: the 75 % IPC-A-610 minimum, the 1.2 mm');
  w('exception, the contractual 100 % fill. The length of the marker tracks the size of');
  w('the worked example, not the exposure.');
  w('');
  w('So the checklist below is built from what the lessons *assert about standards*,');
  w('which is what a reviewer has to confirm before anyone treats this as a work');
  w('instruction.');
  w('');
  w('## Scope');
  w('');
  w('| | |');
  w('|---|---|');
  w('| lessons | ' + lessons.length + ' |');
  w('| modules | 15 |');
  w('| quiz questions | ' + lessons.reduce(function (a, l) { return a + (l.quiz || []).length; }, 0) + ' |');
  w('| standards cited | ' + Object.keys(byStandard).length + ' |');
  w('| distinct claim sentences | ' + totalClaims + ' |');
  w('| recurring facts in Part A | ' + RECURRING.length + ' |');
  w('| sources in the registry | ' + sources.length + ' |');
  w('');

  /* ---------------------------------------------------------------- Part A */
  w('---');
  w('');
  w('## Part A — the recurring facts');
  w('');
  w('Each fact below is asserted in several lessons in different words. Verify it once');
  w('against the standard and every lesson citing it is covered. This is the shortest');
  w('path through the course: ' + RECURRING.length + ' facts touch ' +
    (function () {
      var s = {};
      RECURRING.forEach(function (f) { f.lessons.forEach(function (l) { s[l] = 1; }); });
      return Object.keys(s).length;
    })() + ' of ' + lessons.length + ' lessons.');
  w('');
  w('The "course asserts" column is what the course currently says. If the standard');
  w('disagrees, the course is wrong and the lesson must be corrected before promotion.');
  w('');
  w('| # | Fact | Course asserts | Verify against | Lessons | OK |');
  w('|---|---|---|---|---|---|');
  RECURRING.forEach(function (f, i) {
    w('| ' + (i + 1) + ' | ' + esc(f.fact) + ' | ' + esc(f.assert) + ' | ' + esc(f.verify) +
      ' | ' + f.lessons.length + ' | ☐ |');
  });
  w('');

  RECURRING.forEach(function (f, i) {
    if (!f.note) return;
    w('> **' + f.fact + '** — ' + f.note);
    w('');
  });

  /* ---------------------------------------------------------------- Part B */
  w('---');
  w('');
  w('## Part B — every distinct claim, grouped by standard');
  w('');
  w('Every sentence in the course that cites a standard, quoted verbatim, with the');
  w('lesson and the field it lives in. Work a standard at a time: read the clause once,');
  w('then tick the claims against it.');
  w('');
  w('`where` tells you the field: `theory[i].p` is a paragraph, `theory[i].blocks[j]` a');
  w('block (`.table` for tables, `.figure` for the SVG schematics), `calc.task` and');
  w('`calc.solution` the worked example, `defect.*` the case study, `quiz[k].*` the');
  w('questions and their explanations.');
  w('');

  Object.keys(byStandard).sort(function (a, b) { return byStandard[b].length - byStandard[a].length; })
    .forEach(function (std) {
      var claims = byStandard[std];
      var src = sources.filter(function (s) {
        return s.title.indexOf(std) !== -1 || s.id === undefined && false;
      })[0];
      w('### ' + std + ' — ' + claims.length + ' claim' + (claims.length === 1 ? '' : 's'));
      w('');
      if (src) w('Registry entry: `' + src.id + '` — ' + esc(src.title));
      else w('Registry entry: **none — this standard is cited but absent from sources.json**');
      w('');
      w('| Lesson | Where | Claim (verbatim) | OK |');
      w('|---|---|---|---|');
      claims.forEach(function (c) {
        var s = c.sentence.length > 300 ? c.sentence.slice(0, 297) + '…' : c.sentence;
        w('| ' + c.lessonId + ' | `' + c.where + '` | ' + esc(s) + ' | ☐ |');
      });
      w('');
    });

  /* ---------------------------------------------------------------- Part C */
  w('---');
  w('');
  w('## Part C — per-lesson sign-off');
  w('');
  w('One row per lesson. A lesson is promotable when every Part A fact it relies on is');
  w('ticked, every Part B claim it carries is ticked, and its own arithmetic has been');
  w('checked. Ticking a row here means "I have read this lesson and its claims hold",');
  w('not that the text is well written.');
  w('');
  w('| Lesson | Title | Claims | Standards cited | Status | Reviewed |');
  w('|---|---|---|---|---|---|');
  Object.keys(perLesson).sort().forEach(function (id) {
    var p = perLesson[id];
    w('| ' + id + ' | ' + esc(p.title) + ' | ' + p.count + ' | ' +
      (p.standards.join(', ') || '—') + ' | ' + p.status + ' | ☐ |');
  });
  w('');

  /* ---------------------------------------------------------------- Part D */
  w('---');
  w('');
  w('## Part D — what has already been done, and what "done" means');
  w('');
  w('### Already checked automatically');
  w('');
  w('These were verified in audit rounds 1 to 6 and do not need redoing, though a human');
  w('should still confirm the judgement calls:');
  w('');
  w('- **Arithmetic.** Every worked calculation in all ' + lessons.length + ' lessons was read and');
  w('  recomputed. `m14l01` alone: 30 checks, all reconcile.');
  w('- **Quiz keys.** All ' + lessons.reduce(function (a, l) { return a + (l.quiz || []).length; }, 0) + ' questions were read against their own explanations;');
  w('  several keys contradicted their explanations and were corrected.');
  w('- **Internal contradictions.** Lessons teaching the same table were compared;');
  w('  `m01l03` disagreed with its own table and its own quiz and was corrected (W17).');
  w('- **Misattributed standards.** `IPC-7711/7712` → `IPC-7711/7721`; ESD `STM97.7/97.8`');
  w('  → `STM97.1/97.2`; `J-STD-020` peaks and `TAL` attribution corrected.');
  w('- **Unit-basis errors.** Wave flux density moved to a solids basis; thickness-indexed');
  w('  bake limits; powder sieve percentages.');
  w('- **Illustrations.** All 92 were reviewed by viewing them against the lesson text.');
  w('  `m08l05`\'s fill chain was wrong and was regenerated: it drew');
  w('  `F_A = A_L / A_c`, the lead-to-clearance area ratio, as the expected barrel fill,');
  w('  which reports 45 % against the lesson\'s own 90 % target.');
  w('- **The delivered bundle.** It did not run: Cloudflare Rocket Loader had rewritten');
  w('  the script tags in `index.html`, so `app.js` never executed. Fixed, and');
  w('  `scripts/verify-runtime.js` now proves the page boots.');
  w('');
  w('### Still open, and deliberately left open');
  w('');
  w('- Every lesson is `status: "draft"` with its original review string. Nothing has been');
  w('  signed off, and this checklist does not sign anything off.');
  w('- Prop-number nits in four illustrations — tray and reel dimensions, deposit');
  w('  dimensions, and similar plausible values that contradict no lesson but were not');
  w('  dictated by one. Default is to report, not to regenerate.');
  w('- Standards cited but absent from `sources.json` are flagged in Part B as');
  w('  "Registry entry: none". They should be added or the citation removed.');
  w('');
  w('### What "done" looks like');
  w('');
  w('1. Every Part A row is ticked, or the disagreement is recorded as a course defect');
  w('   and fixed.');
  w('2. Every Part B row is ticked for the lessons being promoted.');
  w('3. Every Part C row for those lessons is ticked.');
  w('4. The reviewer sets `status` to `reviewed` on those lessons. The draft banner is');
  w('   gated on status, so it disappears by itself — it cannot be removed by editing');
  w('   text, only by reviewing. That is the mechanism this checklist exists to serve.');
  w('5. The `review` string is rewritten or cleared by the reviewer, not before.');
  w('');
  w('Until step 4 happens, the footer line and the in-lesson banner stay. They are the');
  w('boundary between study notes and a work instruction, and the course has not earned');
  w('the right to cross it yet.');
  w('');

  fs.writeFileSync(process.argv[4], out.join('\n') + '\n');
  console.log('build-review-checklist: wrote ' + process.argv[4]);
  console.log('  lessons            : ' + lessons.length);
  console.log('  recurring facts    : ' + RECURRING.length);
  console.log('  distinct claims    : ' + totalClaims);
  console.log('  standards          : ' + Object.keys(byStandard).length);
  console.log('  per-lesson rows    : ' + Object.keys(perLesson).length);
  console.log('  questions scanned  : ' + questions.length);
}

main();
