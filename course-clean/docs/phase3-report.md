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
