# Phase 3 — the case system. Report

Scope: a case schema, a case engine, a generator that owns every answer key, one
fictional product ("Board X") shared by all cases, and the first four cases
(m02, m03, m06, m14). Course content stays English; this report is the
Russian-facing summary.

Artifacts:

| Path | What it is |
|---|---|
| `data/cases.json` | 4 cases, 31 steps, Board X facts, declared thresholds |
| `scripts/gen_cases.py` | generates the data **and** every key from formulae |
| `scripts/check-cases.js` | second, independent implementation that recomputes every key |
| `docs/case-keys.csv` | one row per step: formula, value, tolerance, unit, inputs |
| `scripts/capture-case.js` | renders a case in jsdom and records the DOM outline |
| `docs/screenshots/*.outline.txt` | captured render of every case, unsolved and solved |
| `assets/app.js` | case view, grading, hints, CSV export, Toolkit block |
| `tests/course.test.js` | 123 checks, was 82 |

---

## 1. Schema as built

`data/cases.json` is a document, not a bare array, so Board X and the
thresholds travel with the cases:

```
{ schemaVersion, generatedBy, generatedOn,
  thresholds: { areaRatioMin:[0.66,"src-004","m03l02"], … },
  board: { id:"board-x", name, description, facts:{…} },
  cases: [ { caseId, moduleId, title, estMinutes, level, scenario[],
             dataFiles[{name,kind,content}], steps[], rubric[], templates[],
             toolLinks[], sources[], generatedBy } ] }
```

Every field the brief names is present. Two additions, both backward
compatible (no existing field changed):

* `level` — `core` / `advanced`, used for the Toolkit list.
* `steps[].options` — only on `choice` steps, because a `choice` step has to say
  what it offers. `answer` keeps the same shape on both types:
  `{value, tolerance, unit}` for numeric, `{value:<optionId>}` for choice.

Step shape, exactly as specified plus what grading needs:

```
{ id, type:"numeric"|"choice", prompt,
  answer:{value,tolerance,unit},
  hints[2..3], feedbackCorrect, feedbackWrong, explanation }
```

Rubric: `{criterion, points, steps[]}` — `steps` ties a criterion to the steps
that earn it, so a criterion spanning two steps pays half per correct step. The
generator and the checker both refuse a rubric that does not total 100.

## 2. Board X — one product, one set of numbers

| Fact | Value |
|---|---|
| Thickness / layers / finish | 1.6 mm / 6 / ENIG (FR-4, Tg 170) |
| Stencil | 0.125 mm overall, 0.100 mm stepped region for the fine-pitch part |
| Packages | QFP-64 @ 0.5 mm, QFP-48 @ 0.4 mm, BGA-256 @ 0.8 mm, 0402, 20-pin THT |
| Paste / alloy | SAC305, Type 4, no-clean; liquidus 219 °C, solidus 217 °C |
| Batch | 1,240 boards, 620 solder opportunities per board |

The facts live once, in `BOARD_FACTS` in the generator, and are emitted into
`cases.json`. A case reads the board instead of restating it, so the 0.4 mm QFP
aperture in m03 and the fill fraction in m08 cannot drift apart. Today the cases
reference the board by id; the fill-fraction case (m08) is the first one that
will need a fact the others use, and it will read the same block.

## 3. The four cases

| Case | Module | Steps | Rubric | Est. | What it makes the learner do |
|---|---|---|---|---|---|
| `cx-m03-01` Stencil release audit | m03 | 8 (5 numeric) | 100 | 25 min | Compute area ratio for the 0.4 mm aperture at 0.125 and 0.100 mm, aspect ratio, the worst aperture on the board (0.59), the round BGA rule, deposit volume in nL, then choose a remedy that does not move the apertures already in spec |
| `cx-m02-01` Moisture breach | m02 | 6 (4 numeric) | 100 | 20 min | MSL 4 floor life, counted exposure with **no credit** for a 7 % RH cabinet, remaining life vs the schedule, tape-and-reel bake ceiling, and the route that respects it |
| `cx-m06-01` Profile validation | m06 | 7 (5 numeric) | 100 | 25 min | Ramp rate, TAL margin, peak margin against 250 °C (large package, not 245), cooling rate, disposition with margins documented, and the model-versus-measurement gap |
| `cx-m14-01` AOI over-rejection | m14 | 10 (7 numeric) | 100 | 35 min | DPMO from **confirmed** defects (49.4), false-call rate, ISO 2859-1 code K/n=125 and code L/n=200, accept-at-Ac-3 while the 8D stays open, ppm before/after, reduction, and 8D status against the agreed metric |

Every case is built so the wrong path has a number: 47 AOI calls instead of 38
gives ~61 DPMO; treating 245 °C as the BGA limit rejects a passing profile;
claiming credit for a 10 % RH cabinet turns 8 h of remaining life into "no bake
needed".

## 4. Generator and independent verification

`scripts/gen_cases.py` is the only place a key is computed. Every numeric key is
a named function (`area_ratio_rect`, `area_ratio_round`, `aspect_ratio`, `dpmo`,
`ppm`, `reduction_pct`, `floor_life_remaining`, `ramp_rate`, `margin`,
`expected_ramp`, `iso_sample`), and each step stores the formula and the inputs
it used, which is what `docs/case-keys.csv` publishes.

`scripts/check-cases.js` recomputes all 31 keys from the **case's own data file**
(aperture table, MSL log, profile, defect log) rather than from the generator's
arguments — different arithmetic, different source of truth, same answer. It
fails on any step it cannot recompute; an unverified key is treated as a
hand-typed key.

`python3 scripts/gen_cases.py --check` compares the JSON on disk with a fresh
run and names the steps that differ.

### Phase-3 control numbers — all reproduce

| Control | Result |
|---|---|
| Area ratio 0.20 x 0.80, T = 0.125 | **0.64** |
| Area ratio 0.20 x 0.80, T = 0.100 | **0.80** |
| Area ratio 0.18 x 0.80, T = 0.125 | **0.59** |
| Aspect ratio 0.20 / 0.100 | **2.0** |
| Round aperture D / (4T), D = 0.50, T = 0.125 | **1.00** |
| DPMO 38 / (1,240 x 620) x 10⁶ | **49.4** |
| ISO 2859-1 level II AQL 1.0, lot 3,000 | **code K, n = 125, Ac 3, Re 4** |
| ISO 2859-1 level II AQL 1.0, lot 5,000 | **code L, n = 200, Ac 5, Re 6** |

The 0.66 and 1.5 thresholds are not typed into the cases: they are declared in
`cases.json → thresholds` with the source id and the lesson that states them, and
the checker refuses a threshold without a live source reference.

## 5. Engine behaviour

| Requirement | Implementation |
|---|---|
| numeric step with tolerance and unit | `<input type="text" inputmode="decimal">`, parsed with comma **or** point, thin/non-breaking space and unicode minus normalised; tolerance is per step and printed next to the field |
| empty input → inline error at the field | on submit each empty or unparseable step gets its own `role="alert"` message under the field, the step is outlined, the first bad field takes focus, and **no score is produced** |
| progressive hints | "Show a hint" → "Next hint (n left)" → all shown; hints never cost rubric points and are not counted against mastery |
| case page `#/c/<caseId>` | hash route, breadcrumb, sidebar entry under the active module, `Board X` chip, scenario, collapsible board facts, each data file with its own download, rubric |
| CSV download | the learner's answers, the verdict per step, the correct value/unit/tolerance and the rubric result — UTF-8 with BOM so Excel opens it |
| mastered at rubric ≥ 80 % | per-criterion credit summed; the best result is kept in `progress.cases`, and the module Toolkit shows "best n %" / mastered state |
| Toolkit block on the module page | case list with time, steps, level and best score, plus the templates and related lessons the cases point at |

Answers are held in engine state, not read back from the DOM, so a hint repaint
cannot lose a typed value — there is a test for exactly that, because it is the
bug this design invites.

## 6. Tests

| Suite | Before | After |
|---|---|---|
| `tests/course.test.js` | 82 | **123 passed, 0 failed** |
| `check-cases.js` | — | 4 cases, 31 steps, 31/31 keys independently recomputed |
| `gen_cases.py --check` | — | cases.json matches the generator |
| `check-integrity.js` | OK | **OK** — 262 source refs, 92 images, embed equal to JSON, 4 cases / 31 steps registered |
| `check-quiz.js` | OK | OK — no structural problems |

New render-layer tests worth naming: every case route renders every step; an
empty submit shows an error on **every** step and produces no result; all-correct
scores 100 % and marks the case mastered; all-wrong does not; an answer inside
the tolerance passes; `0,64` is accepted; hints appear one at a time; a typed
answer survives a hint repaint; unknown case id renders a clean not-found.

## 7. Screenshots — what I could and could not do

This sandbox has **no browser**: Playwright's browser CDN, the Debian mirror and
the Chrome-for-Testing host are all unreachable, and `apt` cannot be used
without root. Rather than hand over a picture that was not a screenshot, I did
the honest version:

* `scripts/capture-case.js` runs the **shipped** `app.js` in jsdom against the
  built tree and serialises the real `#main` DOM — same HTML, same classes, same
  text a browser would lay out.
* `docs/screenshots/cx-*.outline.txt` — every case, as rendered (384–514 nodes).
* `docs/screenshots/cx-*.solved.outline.txt` — the same page after a full
  correct submission, showing the result block, `100 % — 100 of 100 rubric
  points`, "Mastered", and the earned-per-criterion table.
* The `--png` path exists and is one flag away: set `CHROME_BIN` and run
  `node scripts/capture-case.js cx-m03-01 --png docs/screenshots/cx-m03-01.png`.
  On this machine it exits 2 with "no browser binary found" instead of
  pretending.

When a browser is available — your machine, or a CI runner — one command
produces the real PNGs:

```
node scripts/capture-case.js --all --png
```

## 7b. Round 2 — the THT and wave cases (m08, m09)

The next two cases were named in §8 as the natural next pair, because both read
Board X facts the earlier cases already fixed. Both are now built, in the same
shape as the first four: keys computed by the generator, recomputed by a second
implementation from the case's own data files.

| Case | Module | Steps | Rubric | Est. | What it makes the learner do |
|---|---|---|---|---|---|
| `cx-m08-01` Through-hole fill | m08 | 9 (5 numeric) | 100 | 25 min | nominal and worst-case clearance from the measured extremes, radial clearance, annular volume in mm³, fill as a percentage of board thickness, shortfall in millimetres against the 75 % minimum, a per-joint disposition with the 50 % thermal-plane exception ruled out on the evidence in the sheet, and the control that matches the mechanism |
| `cx-m09-01` Wave run FA-1 | m09 | 8 (4 numeric) | 100 | 25 min | contact time from wave width and conveyor speed, pot margin over the 219 °C liquidus, the two settings that actually sit at the weak end, bridge span in pitches, one mechanism that explains a short barrel and a flooded neighbour on the same pass, one change at a time, nonconforming share on joints, and the lot decision kept apart from the process decision |

New control numbers, all reproduced by `check-cases.js`:

| Control | Result |
|---|---|
| Diametral clearance, 1.00 mm hole / 0.60 mm lead | **0.40 mm** |
| Worst case, 0.95 mm hole / 0.63 mm lead | **0.32 mm** (radial **0.16 mm**) |
| Annular volume, pi * (0.5² − 0.3²) * 1.6 | **0.80 mm³** |
| Vertical fill, 1.10 mm of 1.60 mm | **68.75 %** (short by **0.10 mm**) |
| Contact time, 50 mm wave at 1.5 m/min | **2.0 s** |
| Pot margin, 255 °C against 219 °C liquidus | **36 °C** |
| Bridge span, 3.20 mm on a 2.54 mm pitch | **1.26 pitches** |

Two things the new cases deliberately do **not** do:

* They do not average. m08's s7 is the same lesson m06 taught: a mean of
  76.04 % across three joints clears 75 % and hides a defect, so the sheet has
  to carry every joint.
* They do not invent a second cause. m09 asks for one mechanism that explains
  both findings on the same pass, because two unrelated stories is not a
  diagnosis.

Board X gained six facts (`holeFillMinPct`, `holeFillExceptionPct`,
`holeFillExceptionLeads`, `thtHoleNominalMm`, `thtHoleToleranceMm`,
`waveContactWindowS`) and the thread grew from four steps to six, so the module
page now shows the product's whole through-hole history: MSL log → stencil →
reflow → through-hole → wave → 8D.

The 75 % acceptance limit is cited to `src-016` (IPC-A-610H section 10) and was
re-checked against two independent summaries on 2026-11-31, because the 50 %
figure circulates as a "Class 2 relaxation" and is not one: it is the
documented exception for 14 or more leads tied into internal thermal planes,
which is exactly the trap m08's s6 sets.

Verification after the round: `gen_cases.py --check` OK (6 cases, 49 steps),
`check-cases.js` 49/49 keys independently recomputed, `check-integrity.js` OK,
`check-quiz.js` OK, `tests/course.test.js` **177 / 0**, `tests/case-qa.js`
**24 / 0**, pilot sheet regenerated for 6 cases / 49 steps.

## 7c. Round 3 — inspection and rework (m07, m11)

The two cases whose numbers are most often misquoted in the industry, so both
were checked against three independent summaries before being built.

| Case | Module | Steps | Rubric | Est. | What it makes the learner do |
|---|---|---|---|---|---|
| `cx-m07-01` AOI audit | m07 | 9 (5 numeric) | 100 | 30 min | verification coverage, false-call rate on verified calls, board-level escape rate, escape rate against judged defects, the audit judged on all three at once, cumulative void area per ball from measured diameters, a per-ball rejection, and the hidden-joint gap named as a coverage problem |
| `cx-m11-01` Rework record | m11 | 9 (4 numeric) | 100 | 30 min | setpoint judged against the course band, total iron time across every contact, energy in joules, conductor-width reduction against the drawing, Class 2 and Class 3 floors computed from the same number, disposition at the limit, a dry contact read as a thermal-load signal, and the record contents that make a decision re-judgeable |

New control numbers, all reproduced independently:

| Control | Result |
|---|---|
| Verification coverage, 300 of 360 calls | **83.3 %** |
| False-call rate, 90 of 300 verified | **30.0 %** |
| Escape rate, 18 of 12,000 boards | **0.15 %** |
| Escape rate against judged defects, 18 of 228 | **7.9 %** |
| Ball A1, voids 0.28 + 0.14 mm in a 0.45 mm ball | **48.4 %** (limit 25 %) |
| Ball A2, one 0.10 mm void | **4.9 %** |
| Total iron time, 2.6 + 0.4 + 0.2 s | **3.2 s** = **144 J** at 45 W |
| Conductor reduction, 0.30 → 0.24 mm | **20.0 %** (Class 2 limit 20 %, Class 3 floor 0.27 mm) |

### Two defects this round found in the product itself

1. **`[object Object]` in the board-facts table.** The new `conductorReductionPct`
   fact is keyed by class, and the renderer passed it straight to `esc()`. Every
   case page printed `[object Object]` beside the label. Fixed in `app.js` by
   spelling out non-scalar facts (`Class 1: 30 · Class 2: 20 · Class 3: 10`), and
   `tests/case-qa.js` now fails on any `[object Object]` on any case page.
2. **The generator wrote a document it could not reproduce.** Integer keys in a
   Python dict become strings in JSON, so `--check` reported a failure on every
   class key. The fix is in the generator (string keys everywhere), not in the
   file: a `--check` that is made to pass by editing the output is not a check.

### Sources, and what they do not settle

* **Void limit.** IPC-A-610 / IPC-7095 put the defect line at a cumulative
  projected void area above 25 % of the ball, applied per ball. Some vendor pages
  also quote 30 % or a 50 % thermal-pad figure; the case prints the 25 % per-ball
  limit and says class and revision must be confirmed, which is what m07l04
  already teaches.
* **Conductor reduction and annular ring.** IPC-A-600: 30/20/10 % width
  reduction by class (Class 1/2/3) and 0.050 mm minimum external annular ring at
  Class 3. Independently confirmed.
* **Hand-soldering setpoint.** This one the sources do **not** settle: IPC-7711
  procedures begin at about 315 °C and say "change as necessary", vendor tables
  quote 315-400 °C for lead-free, and the course's own m11l02 gives 330-360 °C.
  The case uses the course band, prints it as a course band with no source id,
  and the step's job is to notice that the setpoint is *inside* the band, so the
  setpoint is not the cause. No new number was invented.

Verification after round 3: `gen_cases.py --check` OK (8 cases, 67 steps),
`check-cases.js` **67/67** keys independently recomputed, `check-integrity.js`
OK, `check-quiz.js` OK, `tests/course.test.js` **181 / 0**, `tests/case-qa.js`
**36 / 0** (8 new `[object Object]` checks), pilot sheet regenerated for 8 cases
/ 67 steps.

Two test literals had to go: three checks asserted "four" cases, and the QA pass
asserted 15 template files. All four now derive their expected count from
`data/cases.json`, because a literal that has to be edited every time a case is
added is a test that will one day pass for the wrong reason.

---

## 8. Next

The remaining eleven modules get cases in the same shape, one per module, in
module order; m08 (fill fraction) and m09 (wave dwell) are the natural next two
because both read Board X facts the m03 and m06 cases already fixed. Templates
referenced from the cases (`stencil-sheet`, `msl-log`, `reflow-log`, `8d`,
`pareto`) are listed as `planned` in the Toolkit and are Phase 4 work.

---

# Phase 3b — the module/case furniture (U1)

Scope agreed with the product owner: **the frame and the UI only**. The numbers,
scenarios and rubrics of the four cases are untouched — verified by diffing every
step's answer, options, prompt, rubric and scenario against the pre-change file:
`ALL existing steps, rubrics and scenarios identical`.

## What was added

| Element | Where | Note |
|---|---|---|
| Board X thread | module page, under the progress bar | Four steps (m02 → m03 → m06 → m14). The current module is marked, mastered steps say so, each links to its case |
| Case card | module page, **after the lessons** | Time chip, CSV buttons, "Fictional data. Rubric pass mark: 80 %", best result |
| Templates in three variants | Toolkit | Blank · Example · Guide; 5 templates, 15 files, all generated |
| Exam gate | module page + sidebar + the `#/e/...` route | "Opens after all lessons are mastered"; the route refuses too, so a bookmark cannot walk around it |
| Data as a table | case page | Any CSV-shaped data file renders as a table, not a `<pre>` |
| Profile chart | case page, m06 | Inline SVG built from the same `profile.csv`: one segment per recorded interval, no smoothing, liquidus line and peak band marked |
| Spec chips | case page | Liquidus 219 °C · TAL 60–90 s · Peak window 235–250 °C, from the data, not from the engine |
| Points per step | case step heading | `Step 1 (15 points)`, derived from the rubric so it cannot disagree with the scoring |
| Score chip | case header | `Score 0 of 100` on a fresh page, moves as steps are checked |
| Per-step Check answer | every step | Marks that step, updates the chip, does **not** produce a result; an empty field still raises the inline error |

## The template example is not typed

`stencil-sheet`, `msl-log`, `reflow-log` — the example **is** the case's data file,
byte for byte. `8d` is not a reshaped defect log, so its example rows are built
from the case's own verified answers: each cell names `step:s1`, `step:s2`, … and
is filled with that answer. Both `check-cases.js` and `check-integrity.js` refuse
an example that is neither a data file nor traceable to the case's answers — this
check caught the first 8D, which was wrongly derived from `defect-log.csv`.

## Deliberate deviations from the mock-up

1. **Design stays ours** — dark `#0D1117`, teal signal, IBM Plex. The mock-up is
   light; only its structure and behaviour were taken.
2. **100-point rubrics stay.** Mastery is already a percentage of the case maximum,
   so an 8-point and a 100-point case coexist without touching the engine (the
   product owner's own point).
3. **No answer order shuffling.** The mock-up note says "answer order is shuffled
   on the live page"; ours is stable, so a reviewer can refer to "option b". Not
   changed without a decision.
4. **No hint/rubric penalty.** Hints remain free, as agreed.
5. **The peak window is the union of two course texts, and it is in tension.**
   The m06l01 zone table says `Liquidus 219 C, peak 235-245 °C`; m06l05 says the
   J-STD-020 classification temperature is `250 °C` for a large package. The m06
   case grades peak margin against **250 °C** and passes 248 °C, while the chip
   prints **235–250 °C**. Both bounds are real and sourced, but a reader can
   reasonably ask which one governs. This is the first item for the m06 review.

## Verification

| Check | Result |
|---|---|
| `tests/course.test.js` | **155 passed, 0 failed** (was 123) |
| `check-cases.js` | 31/31 keys recomputed; 5 templates, 15 files; thread 4 steps; OK |
| `check-integrity.js` | OK — cases 4 (31 steps), templates 5 (15 files), thread 4 |
| `gen_cases.py --check` | OK (4 cases, 31 steps) |
| Numbers unchanged | every existing step answer, option, prompt, rubric and scenario identical to the pre-3b file |
| Build | 141 files / 11.1 MB, embed 1,598,939 B |

Render captured from the shipped engine (no browser in this sandbox):
`docs/screenshots/module-m06.outline.txt` (thread, locked exam card, template
cards, case card), `docs/screenshots/cx-m06-01.outline.txt` (spec chips, data
table, SVG chart, points per step, Score chip), and the `.solved` variants.

## Next, in the order agreed

1. **m06 limits cross-check** — compare the mock-up's limits against the lesson
   text and sources, decide the peak window conflict above. No edits in that step.
2. **m06 decision** — keep the seven-step case, or adopt the compact one. If the
   compact one wins, the "average peak hides the spread" idea moves into ours.
3. The other three cases get the compact treatment only after 3–5 people have
   taken them.

---

# Decision on m06 (after the limits review)

Asked whether to keep the seven-step m06 case or adopt the compact mock-up
scenario, the answer was: **keep our case, add the one idea from the mock-up
that ours lacked — "the average peak hides the spread" — but on our numbers.**

What changed, and only for m06:

| | Before | After |
|---|---|---|
| Steps | 7 | **8** |
| Rubric | 100 | **100** (a new 8-point criterion; s5 20→14 and s7 15→13 rebalanced) |
| Data files | `profile.csv` | `profile.csv` + **`thermocouples.csv`** |
| Key new answer | — | **12 °C** spread, 254 − 242 |

The three sites are declared once in the generator and everything else reads
them: `TC1 BGA centre 242 °C · TC2 QFP lead 249 °C · TC3 0402 near edge 254 °C`,
offsets −6 / +1 / +6 from the 248 °C reference. So the mean is exactly the
single-point peak the rest of the case reports — which is the point of the step.
The 242 °C site is 3 °C under the paste-window top; the 254 °C site is 4 °C over
the 250 °C ceiling. Both facts now live in one number a learner can compute.

`check-cases.js` recomputes the spread from `thermocouples.csv` itself rather
than from the generator's offsets, so the key is still independently verified.

**TAL stays at 60–90 s**, the Board X paste window, as decided: it is the course's
own stated window (m06l07), not a figure taken from a named datasheet, and it is
now labelled that way in the case, the chips and the lesson text.

Tests: **159 passed, 0 failed** (two tests were updated because m06 legitimately
has two data tables and eight steps now). Integrity: 4 cases / 32 steps / 23
numeric. The other three cases are untouched.

---

# Chart bug (found by the reader, fixed)

The m06 profile chart rendered as an empty frame — axis labels and a liquidus
dashed line only, no curve. Symptoms in the screenshot: table fine, chart blank.

Cause: when the peak chips were split into "Peak window, paste 235–245" and
"Peak ceiling, large package 250", the chart's spec scan did
`if (/peak/i.test(s.label)) win = [s.value, s.to]` and the ceiling chip (no upper
bound) overwrote the real window with `[250, undefined]`. Every y coordinate then
became `NaN`, so the SVG path contained no visible geometry.

Fix, in three parts:

1. A range is only a range when both bounds are finite numbers and `to > value`;
   a single-value chip cannot overwrite one.
2. If the plot ranges are still not finite, the chart is replaced by a sentence
   saying the profile could not be drawn — an empty frame looks intentional and
   hides the fault.
3. Non-finite points are dropped before the path is built.

Test: the suite now asserts that no `NaN` appears anywhere in the chart's SVG,
that every vertex lies inside the plot area, and that the curve actually moves
(more than three distinct y values). Verified the test is real by restoring the
broken scan in a temporary copy: it fails there, passes with the fix.

Tests: **170 passed, 0 failed**.

---

# Pilot round: protocol and observer sheet

The next decision — how the other three cases should be shaped — needs data, not
taste. Two artefacts now support a 3–5 person round:

| File | What it is |
|---|---|
| `docs/pilot-protocol.md` | who to invite, the exact 30-second intro, what to record, healthy ranges, what to change when a range is missed |
| `docs/pilot-sheet.md` | one row per step: expected key, tolerance, and the plausible wrong answer — **generated** by `scripts/gen_pilot_sheet.py` from `data/cases.json` |

The sheet is generated for the same reason the keys are: a hand-typed observer
copy becomes a second, unaudited answer key. `gen_pilot_sheet.py --check` fails if
the file drifts, and the test suite runs that check.

The engine now records the two numbers the protocol asks for: **time on the case**
and **hints opened**, shown in the Result line ("This attempt took about 24 min
with 2 hints") and written into the participant's CSV as an `EFFORT` row. Nothing
is sent anywhere; it is local state and a file the participant downloads.

Rules the protocol fixes in advance, so the round cannot be re-argued afterwards:
keys are not touched (they are computed and independently verified) — what changes
is the step text, the hints and the explanations.

Tests: **171 passed, 0 failed**.
