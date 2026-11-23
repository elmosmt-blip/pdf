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

_Note (round 4): the numbers in this section describe round 3 as it stood. The
review in `docs/technologist-review-2026-11-31.md` then changed m11's denominator
(20.0 % became 11.4 %) and m07's ball A4, so the control table above is history,
not current. `docs/case-keys.csv` is the current source._

Verification after round 3 as published: `gen_cases.py --check` OK (8 cases, 67
steps), `check-cases.js` **67/67** keys independently recomputed, `check-integrity.js`
OK, `check-quiz.js` OK, `tests/course.test.js` **181 / 0**, `tests/case-qa.js`
**36 / 0** (8 new `[object Object]` checks), pilot sheet regenerated for 8 cases /
67 steps.

Two test literals had to go: three checks asserted "four" cases, and the QA pass
asserted 15 template files. All four now derive their expected count from
`data/cases.json`, because a literal that has to be edited every time a case is
added is a test that will one day pass for the wrong reason.

---

## 7d. Round 4 — incoming inspection (m01)

The thread started at m02, which meant Board X's life began after the boards were
already in the building. m01 is where a product actually starts, so the new case
sits at step 1 and the other eight moved down one.

| Case | Module | Steps | Rubric | Est. | What it makes the learner do |
|---|---|---|---|---|---|
| `cx-m01-01` Bare-board release | m01 | 9 (4 numeric) | 100 | 30 min | twist by the IPC-TM-650 2.4.22 production method, the allowed gap solved from the same ceiling, the ISO 2859-1 plan for the actual lot size, the lot re-defined across two date codes, the quantity gap quantified, a disposition that separates a passing measurement from an undefined lot, and the release record that survives the year |

Control numbers:

| Control | Result |
|---|---|
| Twist, 2.60 mm gap on a 200 mm diagonal | **0.65 %** (ceiling 0.75 %) |
| Allowed gap on the same diagonal | **3.00 mm** |
| ISO 2859-1, lot 2,800, level II, AQL 1.0 | **code K: n = 125, Ac = 3, Re = 4** |
| Same plan for 2,760 and for two lots of 1,400 | **125 pieces in every case** |
| Quantity gap, 40 of 2,800 declared | **1.4 %** |

### What this case is actually teaching

The factor of two in `gap/(2 x diagonal)` is part of the method, not a derivation
detail. Dropped, the same 2.60 mm reads 1.30 % — over the 0.75 % ceiling — and a
conforming lot is scrapped. The case is written so that both readings are in front
of the learner at once, and the disposition depends on which one is right.

The second lesson is that a sampling plan administers a *population*, and a
shipment with two date codes is two populations until someone says otherwise. The
numbers survive the split here (1,400 and 1,400 both sit in the K band), which is
exactly why the split has to be argued on traceability rather than on the sample
size — and why the explanation points at the band edge, where 1,150 boards would
have fallen to code J and 80 pieces.

### A defect the checker caught in this round

The first draft of the case computed the twist limit on the 160 mm edge while the
step asked about the diagonal, so key and derivation disagreed by a factor of 1.7.
`check-cases.js` recomputes each key from the case's own files rather than reading
it back, so it failed on the spot (`key 3 vs independent 1.2`). Three other problems
were found by reading rather than by arithmetic: the carton labels summed to 2,840
against a declared 2,800; splitting 2,800 by date code as 1,200 + 1,600 put one lot
in a different Table I band, which broke the case's own claim; and "6 %" was not
recoverable from 0.80 mm by any divisor, so the scenario could not have been written
by the person it describes. All four are fixed.

### Sources

* **Bow and twist.** IPC-6012 3.4.3: 0.75 % for boards using surface-mount
  components, 1.5 % for other boards, measured per IPC-TM-650 2.4.22. Confirmed
  against three independent summaries, one of which prints the same worked example
  (2 x diagonal x ceiling for the allowed gap). Source `src-018`, lesson m01l06.
* **Sampling.** ISO 2859-1 Table I and Table II-A: 1,201-3,200 at level II is code
  K, 125 pieces; at AQL 1.0, Ac = 3, Re = 4. Confirmed against two independent
  tables that state the same row. Source `src-006`, lesson m01l03.
* **Not used.** The case does not quote a warpage figure below 0.75 %: several
  vendor pages suggest tighter limits for fine-pitch or large boards, but no source
  in the course supports a specific tighter number, so the case uses the IPC default
  and says on the page that procurement documentation may tighten it.

Verification after round 4: `gen_cases.py --check` OK (**9 cases, 77 steps**),
`check-cases.js` **77/77**, `check-integrity.js` OK (9 cases, 77 steps, 48 numeric),
`check-quiz.js` OK, `tests/course.test.js` **183 / 0**, `tests/case-qa.js` **39 / 0**,
pilot sheet regenerated for 9 cases / 77 steps, 19 outline captures regenerated.

---

## 7e. Round 5 — SPI (m04)

m04 sits between the stencil and the profile: the print is measured, and in this
case the measurement is wrong twice over.

| Case | Module | Steps | Rubric | Est. | What it makes the learner do |
|---|---|---|---|---|---|
| `cx-m04-01` SPI review | m04 | 10 (7 numeric) | 100 | 35 min | nominal volume from aperture and foil, mean as a share of nominal, the window in the same unit, Cp and Cpk with the gap between them explained, the two squeegee passes separated and each capability computed, height derived from volume and area, the SPI program's foil figure checked against the press, and the order of the three fixes |

Control numbers:

| Control | Result |
|---|---|
| Nominal, 0.22 x 0.90 mm through 0.100 mm foil | **19.8 nL** |
| Window at 75-125 % | **14.85 - 24.75 nL** |
| Mean of twelve deposits | **17.09 nL = 86.3 %** (inside the window) |
| Cp / Cpk on the pool | **1.34 / 0.61** |
| First pass, six deposits | mean 18.21 nL, **Cpk 3.05** |
| Second pass, six deposits | mean 15.96 nL, **Cpk 0.99** |
| Height from volume and area | **0.086 mm**, 86 % of the foil |
| Program foil 0.125 mm over a 0.100 mm region | 108 % on screen = **86.4 %** on the board |

### Why this case and not another one

The obvious SPI case is "the volume is low, what do you adjust". It teaches
nothing that m03 did not already teach. This one is built on the two ways a
passing number can be wrong: a mean over two populations, and a nominal the
machine computed with the wrong foil. Both are invisible on the daily summary,
both produce a line that ships boards, and both are arithmetic the learner can do
by hand from the data file.

The 25 % foil error is deliberately of the same size as the window: it moves a
reading across the whole 75-125 % band, which is what makes it a measurement
problem rather than a rounding problem. It is also the reason the case computes
volume in nanolitres first — a volume does not care what the program believed,
and that is the lesson worth carrying to a real line.

### One defect this round, found before the tests

The first draft printed the fine-pitch apertures through 0.125 mm foil, which
contradicts m03, where the whole reason the QFP-48 releases is the 0.100 mm thin
region. `check-cases.js` caught it as four mismatched keys at once (the nominal,
the two limits and every capability built on them), because it recomputes the
nominal from the setup file rather than trusting the step. The case was rebuilt
on 0.100 mm and the numbers moved with it: 24.75 nL became 19.8 nL, the window
18.56-30.94 became 14.85-24.75, and the program error became 25 % rather than
20 %. This is the second round running where the checker earned its place.

### Sources

* **Area ratio and nominal volume.** IPC-7525 stencil guidance, `src-004`, the
  same aperture family m03 uses. Nominal is area x foil; the case does not invent
  a transfer-efficiency figure and always computes from real volumes.
* **The SPI window.** Published windows differ by source — vendor guides quote
  80-120 %, 75-125 %, and 50-150 % with an 80-150 % control band. There is no
  single standard number, so the case uses the Board X control plan's 75-125 %,
  records it in Board Facts with **no source id**, and says on the page that it
  is the plan's window rather than a standard's. A learner who meets 80-120 % at
  work should recognise the difference instead of assuming one of the two is
  wrong.
* **Cp and Cpk.** Standard capability definitions (m04l05). The case uses the
  sample sd (n-1) throughout, because capability computed from a sample of twelve
  prints with the population formula flatters every number.

Verification after round 5: `gen_cases.py --check` OK (**10 cases, 87 steps**),
`check-cases.js` **87/87**, `check-integrity.js` OK (10 cases, 87 steps, 55
numeric), `check-quiz.js` OK, `tests/course.test.js` **185 / 0**,
`tests/case-qa.js` **42 / 0**, pilot sheet regenerated for 10 cases / 87 steps,
21 outline captures regenerated.

---

## 7f. Round 6 — placement (m05)

| Case | Module | Steps | Rubric | Est. | What it makes the learner do |
|---|---|---|---|---|---|
| `cx-m05-01` Placement offset | m05 | 10 (5 numeric) | 100 | 35 min | rotation from two fiducial residuals, the same angle priced at two lever arms, the lead's lateral play as the threshold, three sigma separated from the mean, the report judged for cancelling the rotation, the cause placed in the coordinate chain, the parts ranked by lever arm and play, and a disposition that holds instead of compensating |

Control numbers:

| Control | Result |
|---|---|
| Fiducial residuals, 0.140 mm difference over a 10 mm baseline | **0.014 rad = 0.80°** |
| Same angle at the 40 mm panel edge | **0.56 mm** |
| Same angle at the 7 mm QFP-64 corner lead | **0.098 mm** |
| Lead play, 0.20 mm lead on a 0.30 mm pad | **0.05 mm per side** |
| Three sigma of ten X residuals | **0.009 mm** |

### What the case is built to break

The report number is real, the arithmetic behind it is correct, and it still
cannot fail. The magnitude of the mean of two fiducial residuals is a translation
estimate: a rotation moves the two fiducials in opposite directions and drops out
of their average. So a setup can be repeatable to 0.009 mm, wrong by 0.11 mm of
translation and 0.80° of rotation at the same time, and pass a check that measures
only the first.

The second idea is that an angular error has no size until it has a radius. 0.80°
is 0.098 mm at the QFP corner and 0.56 mm at the panel edge, and whether either is
a defect depends on the pad: 0.05 mm of play on a 0.4 mm-pitch part, more on a
0402. The case asks for the parts to be ranked by lever arm *and* play rather than
by size, because the two effects pick out different components.

### A generator defect this round exposed

The keys CSV wrote `_key["raw"]`, the full-precision intermediate, while the page
published the rounded answer. For most keys the difference is invisible; for a
figure like 0.008831760866327847 it is the difference between a reader
recomputing 0.0088 and finding a mismatch. `check-cases.js` compares the CSV with
the JSON at a 0.1 % tolerance and caught it on the last digits. The generator now
writes the published value, so the CSV and the page can never disagree about a
number the learner is told to reproduce.

### Sources

* **Courtyard and density levels.** IPC-7351B: courtyard excess 0.50 / 0.25 /
  0.10 mm per side for levels A / B / C, confirmed against three independent
  sources including the standard's own tables. The case does not use these
  numbers: Board X's 0.15 mm acceptance is the equipment/process acceptance, and
  the pad play is the arithmetic that decides a lead. The courtyard figure is
  recorded here because the next case that touches layout will need it.
* **Accuracy versus repeatability.** Standard meaning, taught in m05l01 and used
  literally here: repeatability is the spread about the mean, accuracy is the
  mean's distance from zero.
* **Placement acceptance.** No IPC number is quoted for "offset must be under X":
  the 0.15 mm is the plant's acceptance for Board X and is printed as such. m05l05
  already says the criteria come from the equipment datasheet and the plant's own
  capability, and the case follows that.

Verification after round 6: `gen_cases.py --check` OK (**11 cases, 97 steps**),
`check-cases.js` **97/97**, `check-integrity.js` OK (11 cases, 97 steps, 60
numeric), `check-quiz.js` OK, `tests/course.test.js` **187 / 0**,
`tests/case-qa.js` **45 / 0**, pilot sheet regenerated for 11 cases / 97 steps,
23 outline captures regenerated.

---

## 7g. Round 7 — selective soldering (m10)

| Case | Module | Steps | Rubric | Est. | What it makes the learner do |
|---|---|---|---|---|---|
| `cx-m10-01` Selective program | m10 | 10 (4 numeric) | 100 | 35 min | annular gap at nominal and at the worst tolerance case, a nozzle judged against this joint rather than against the lesson's range, the cycle built from every block and converted to throughput, a throughput gain priced against the air knife's function, one variable changed to match the defect mechanism, a high-mass joint given its own dwell or passes, and the record that makes a program portable |

Control numbers:

| Control | Result |
|---|---|
| 1.00 mm hole, 0.60 mm lead | **0.20 mm gap per side** |
| Worst case, 0.95 hole / 0.63 lead | **0.16 mm per side** |
| 1.20 mm nozzle on a 1.00 mm hole | **0.10 mm clearance per side** |
| 20 joints x (1.8 s dwell + 0.4 s travel) | **44 s** |
| Cycle with 25 s preheat and 12 s flux and knife | **81 s = 44.4 boards/h** |
| The same cycle without the air knife | 73 s = 49.3 boards/h, and no flux metering |

### What this case is about

Two numbers that are both inside a published range and both wrong for the joint
in front of them. The 1.20 mm nozzle sits comfortably inside the lesson's
0.8-2.0 mm starting band and still puts the meniscus on the pad edge of a 1.00 mm
hole. The 1.8 s dwell sits inside the low-mass band and is at the bottom of the
high-mass one, so the ground-plane pin on the same connector is under-heated by
the same table that serves the signal pins.

The cycle arithmetic is there to make the trade explicit: 8 s of air-knife time
is 11 % of throughput and the flux metering that keeps blowback out of the joint,
so the optimisation has a price the capacity number does not show. The case asks
for the nozzle to be changed first because the defect is positional, and the
one-variable rule is what makes the next first article attributable.

### A contradiction this case exposed in the product data

`BOARD_FACTS["thtConnector"]` described Board X's connector as a "0.8 mm finished
hole, 0.5 mm lead", while m08 measures a 1.00 ± 0.05 mm hole with a 0.60 mm lead
and m10 sizes a nozzle against that joint. The two cases that read the fact were
right and the fact was wrong. It is now 1.00 / 0.60, and the note in the source
says why — this is the sort of drift a fact table acquires when each case
restates a dimension instead of reading it.

### Sources

* **Annular gap and fill.** IPC-A-610 through-hole criteria, `src-016`, the same
  source m08 uses; the hole and lead geometry is Board X's own drawing.
* **Nozzle range, dwell bands, flux and air-knife starting ranges.** Course text
  m10l02 and m10l04, recorded in Board Facts with **no source id** because the
  lessons present them as starting points to be verified on the machine, not as
  standard limits. The case uses them the way the lessons do: to judge a program,
  never to claim what an alloy needs.
* **Not used.** No bath temperature is quoted for the selective run. The lessons
  give 250-260 °C for lead-free, but the case's questions do not depend on it, and
  adding an unused number to a page is how numbers get misquoted later.

Verification after round 7: `gen_cases.py --check` OK (**12 cases, 107 steps**),
`check-cases.js` **107/107**, `check-integrity.js` OK (12 cases, 107 steps, 65
numeric), `check-quiz.js` OK, `tests/course.test.js` **189 / 0**,
`tests/case-qa.js` **48 / 0**, pilot sheet regenerated for 12 cases / 107 steps,
25 outline captures regenerated.

---

## 7h. Round 8 — coverage (m13)

| Case | Module | Steps | Rubric | Est. | What it makes the learner do |
|---|---|---|---|---|---|
| `cx-m13-01` Coverage model | m13 | 10 (6 numeric) | 100 | 40 min | node coverage computed and distinguished from defect coverage, the defect model totalled, four series combinations computed by multiplying misses per class, two strategies with the same score separated by their uncovered classes, the residual escape attributed by class, the marginal screen priced in escapes rather than coverage points, the uncatchable class handed to a non-test control, and the model documented so it can be recomputed |

Control numbers:

| Strategy | Defect coverage | Escape |
|---|---|---|
| AOI only | **69.8 %** | 514 ppm |
| AOI + X-ray | **86.5 %** | 230 ppm |
| AOI + ICT | **86.8 %** | 224 ppm |
| AOI + ICT + FCT | **93.1 %** | 117 ppm |
| all four | **95.5 %** | 76.5 ppm |
| Fourth screen, marginal | +2.4 points | **-34.6 %** escapes |

### What the case is built on

The 92 % on the test list is node coverage: 570 of 620 joints reachable. It is a
true statement about reach and says nothing about defects, and the case computes
the difference instead of asserting it. Two strategies scoring 86.5 % and 86.8 %
are then held up side by side, because a score that close is decided by what is
left uncovered — ICT buys wrong values and hidden opens, X-ray buys hidden opens
and hidden shorts.

The ending is the part most coverage exercises skip. Contamination is detected at
2-10 % by every screen on the list, so it accounts for 59 of the 76.5 ppm a full
four-screen strategy leaves. No fifth screen fixes it; cleaning, ionic testing and
residue limits do (m12's subject). A strategy is defined by the classes it does
not catch, and the case makes the learner write those down with their control.

### Honest limits of the model

* The detection probabilities are the plant's, not a standard's. m13l05 says to
  take them from your own logs; the case follows that and prints them in the data
  file so they can be argued with.
* The arithmetic assumes the screens are independent within a class. Real AOI and
  real X-ray on the same void are correlated, so the combined coverage here is
  optimistic in some classes. The case states the assumption on the page and makes
  documenting it part of the final answer, rather than hiding it in a footnote.
* No external escape-rate table is quoted. Published vendor figures (for example
  "AOI + ICT leaves 20-50 DPMO") do not come with a defect model that could
  reproduce them, so the case builds its own and lets the learner see every input.

Verification after round 8: `gen_cases.py --check` OK (**13 cases, 117 steps**),
`check-cases.js` **117/117**, `check-integrity.js` OK (13 cases, 117 steps, 73
numeric), `check-quiz.js` OK, `tests/course.test.js` **191 / 0**,
`tests/case-qa.js` **51 / 0**, pilot sheet regenerated for 13 cases / 117 steps,
27 outline captures regenerated.

---

## 7i. Round 9 — cleanliness and coating (m12)

| Case | Module | Steps | Rubric | Est. | What it makes the learner do |
|---|---|---|---|---|---|
| `cx-m12-01` Cleanliness | m12 | 10 (5 numeric) | 100 | 40 min | ROSE computed with the blank and the area, a per-area limit converted to a total, the governing limit chosen between reference and customer, a local site computed against the board average, one measurement read against both limits, the process capability worked backwards from a target escape, a clean site and a failing average each turned into a disposition, wet-to-dry film arithmetic, the coating volume for the unmasked area, and the evidence package |

Control numbers:

| Board | extracted | blank | net | ug/cm2 | vs 0.5 customer | vs 1.56 reference |
|---|---|---|---|---|---|---|
| C-114 | 412 ug | 6 ug | 406 ug | **2.11** | fail, 4x | fail |
| C-121 | 171.1 ug | 6 ug | 165.1 ug | **0.86** | **fail, +72 %** | **pass, 45 % spare** |
| C-114 site (4 cm2) | 12 ug | — | 12 ug | **3.00** | fail | fail |
| process study | — | — | — | 1.00 ± 0.11 | **99.9997 % above** | pass |

* one board allows **96 ug** at 0.5 ug/cm2 on 192 cm2, against 299.5 ug at the reference
* to hold 0.1 % above the limit the mean would have to be **0.16 ug/cm2** — six times
  under where the line runs
* 90 um wet at 38 % solids gives **34.2 um** dry, inside a 25-130 um window
* 172.623 cm2 coated at 35 um needs **1.59 mL** of wet coating

### What the case is built on

The reference value is 1.56 ug/cm2 of sodium chloride equivalent, reported by the
m12l03 lesson for ROSE per IPC-TM-650 2.3.25, and the tightened tiers — 1.0, 0.75,
0.5 — are customer values the lesson names as customer values. The case carries
both because the whole point is that one measurement against two limits gives two
decisions, and the one written on the report is the one that governs.

The field return is the residency case m13 handed over: the m13 model put 59 of
its 76.5 ppm of residual escape on contamination, which no screen detects above
10 %, and this case measures what the other control has to hold.

### The part most cleanliness exercises skip

The average hides the pocket. C-114 is not an outlier to be written up as an
excursion — 4 cm2 out of 192 produces almost all of its 2.11, and a line that
reports only the whole-board figure would pass the next board whose site fails.
The companion board is the mirror image: the site extracts nothing, the board
extracts 198 ug, and the board still cannot be coated.

### Honest limits

* ROSE measures a conductivity equivalent, not an ion, and the case says so — it
  is why ion chromatography appears in the answer to the evidence question rather
  than as another number to compute.
* The 0.1 % target in the capability step is the case's own planning choice, not a
  standard. The step publishes the z it used so the assumption is visible.
* The coating thickness window (25-130 um) is a qualification range from the
  lesson's own text, not a product requirement; the criterion that matters is the
  minimum.

Verification after round 9: `gen_cases.py --check` OK (**14 cases, 127 steps**),
`check-cases.js` **127/127**, `check-integrity.js` OK (14 cases, 127 steps, 78
numeric), `check-quiz.js` OK, `tests/course.test.js` **193 / 0**,
`tests/case-qa.js` **54 / 0**, pilot sheet regenerated for 14 cases / 127 steps,
29 outline captures.

---

## 7j. Round 10 — design feedback (m15), and the last module closes

| Case | Module | Steps | Rubric | Est. | What it makes the learner do |
|---|---|---|---|---|---|
| `cx-m15-01` Design feedback | m15 | 10 (5 numeric) | 100 | 45 min | Solve the design rule for the dimension the designer controls, state the defect rate with its denominator twice, assemble the cost of poor quality from quantified drivers, compute payback per board, write the ask as a rule with tolerance and pass condition, judge image evidence, judge the sample window, sort asks by owner, and name what closes the change |

Control numbers:

| Figure | Value |
|---|---|
| fiducial separation for 0.14 mm residual at r = 40 mm | **37.3 mm** (Board X has 10 mm) |
| first-pass yield, 1,240 boards / 38 defects | **96.94 %** |
| defects per 1,000 boards | **30.65** |
| DPMO, 620 opportunities | 49.4 (the m14 number) |
| cost of poor quality | **3,141.50 USD** — scrap 2,160, downtime 260, inspection 465, rework 256.50 |
| payback on a 1,200 USD change | **1,026.3 boards** |

### What the case is

The only case that measures nothing new. Every input is a number an earlier case
established — the fiducial residuals from m05, the 620 opportunities and the 38
defects from m07/m14, the board facts every case reads — and the work is turning
them into the two artefacts m15 is about: a rule with a dimension in it, and a
pack whose cost arithmetic an auditor can redo.

The arithmetic has one deliberate shape. Scrap is 69 % of the cost of poor
quality and rework 8 %, so a programme that attacks rework attacks the small
number — that is the argument the case makes, and it is the one a plant usually
gets wrong because rework is the cost it sees every shift.

### Why the rule is the hard part

The fiducial ask is the case's spine, because it is the one thing on Board X that
the plant cannot fix itself. Everything else in the pack — the QFP-48 aperture,
the SPI window — has a different owner, and s9 makes the learner sort by owner
before severity. A pack that mixes the three is returned at the first item with
"not our scope" on it.

### Honest limits

* The 30-day / 1,000-board sample requirement is the lesson's, not a standard's;
  the case applies it to a 300-board week and calls the result preliminary.
* The cost drivers are Board X's own rates. The case excludes field-failure
  exposure from the sum and says why, rather than putting an estimate in a total.
* The payback is a single-order calculation. It ignores the stencil's own life
  and the requalification cost, both of which the lesson tells the writer to
  state separately.

Verification after round 10: `gen_cases.py --check` OK (**15 cases, 137 steps**),
`check-cases.js` **137/137**, `check-integrity.js` OK (15 cases, 137 steps, 83
numeric), `check-quiz.js` OK, `tests/course.test.js` **195 / 0**,
`tests/case-qa.js` **57 / 0**, pilot sheet 15 cases / 137 steps, 31 outline
captures, 18 templates (54 files), thread 15 steps.

---

## 8. Next

All fifteen modules now carry a case: 15 cases, 137 steps, 137 computed keys,
18 templates, a 15-step Board X thread. Nothing in the case set is outstanding.

What remains is not features:

* **the pilot.** Fifteen cases and 137 steps have never been read by anyone who
  did not write them. That is the largest open risk in the product and no further
  authoring closes it.
* **the standards audit.** The IPC numbers are checked against summaries, not
  against paid copies. Where a summary was ambiguous the case says so on the page.
* **m12 and m13 landed after the last full technologist review round**; the audit
  that follows this round covers them.

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

---

## 9. Second technologist review (round 8b)

A full re-audit of thirteen cases after the new rounds, written up in
`docs/technologist-review-2-2026-11-31.md`. The short version:

* 29 numeric keys recomputed from first principles in a separate script: **all 29
  agree**, including the coverage model re-entered by hand.
* Percentages and means typed into explanation text — which no key check sees —
  recomputed for four cases: one real defect, in m09, where the prose said "78-81 %"
  for joints that run 76.25-82.5 %. Fixed.
* Structural sweep: rubric totals, step coverage, CSV row widths, lesson links,
  source ids, template variants, and `[object Object]` on every rendered page. All
  clean.
* The Board X thread is deliberately not in module-number order (m07 sits after the
  solder processes, where AOI actually happens). Recorded so it is not "fixed".

Verification unchanged and green: 13 cases / 117 steps, `check-cases.js` 117/117,
`course.test.js` 191/0, `case-qa.js` 51/0.

---

## 10. Third technologist review — full product audit (round 10b)

Every case, every key, every threshold and all of the prose, written up in
`docs/technologist-review-3-2026-11-31.md`. Four findings:

1. **Precision (18 steps, fixed structurally).** Keys were published at four
   decimal places next to questions asking for one or two. Third appearance of one
   defect class, so the fix went into `step_numeric` rather than into eighteen
   cases: the key now carries exactly the precision the prompt asks for, and the
   unrounded value stays in `case-keys.csv`.
2. **Answer distribution (49 of 54 choice keys are `b`).** Always picking the
   second option scores 91 % without reading the case. Wrong-answer feedback no
   longer names option letters, which was the only place that made the imbalance
   exploitable with certainty. The distribution itself is recorded as a known open
   item with the reason, not silently rewritten.
3. **Board area carried twice** — as a fact and as a threshold. Same class as the
   connector defect of round 8; the duplicate is gone.
4. **m15 s6's worked example did not add up** (0.35 degrees where its own numbers
   give 0.22). Corrected.

Re-derivation: 38 keys recomputed from the data files in a separate script, all
agree. Rubrics, links, sources, row widths, hints and template files all clean.
