# Phase 1 — question bank quality. Report

Scope: `data/questions.json`, plus the two checkers, the course shell status
field and the learner-facing draft banner. Nothing else in the course was
touched in this phase.

Numbers below come from `scripts/check-quiz.js --json`
(`docs/baseline-quiz.json` → `docs/checkpoint-phase1.json`) and
`scripts/check-integrity.js --baseline docs/baseline-integrity.json`.

---

## 1. Before and after

| Metric | Before | After | Target |
|---|---|---|---|
| Questions in the course | 185 | **734** | — |
| Questions in lesson quizzes | 185 | **459** | 4–5 per lesson |
| Questions in the exam bank | 0 | **275** | 2–3 per lesson |
| Questions per lesson | 2 (all 92) | 4–5 (91 lessons at 5, 1 at 4) | 4–5 |
| Keyed answer is the longest option | 67.9 % | **30.5 %** | 25–35 % |
| Keyed answer, as displayed (engine shuffle) | 33.2 / 17.4 / 24.3 / 25.1 % | 29.2 / 21.0 / 24.7 / 25.0 % | ±10 pp |
| Worst displayed key-position deviation | 8.2 pp | **4.2 pp** | ≤10 pp |
| Option count | 4 (all) | 4 (all) | 4–5 |
| Distractors shorter than the 75 % band | — | 238 of 1,377 pairs | — |
| Distractors longer than the 135 % band | — | 29 of 1,377 pairs | — |
| "All/none of the above" options | 0 | 0 | 0 |
| Exact duplicate prompts | 0 | 0 | 0 |
| Near-duplicate prompts (≥0.72) | 0 | 0 | 0 |
| Questions without a Bloom level | 185 | **0** | 0 |
| Lessons claiming a status they cannot support | 92 | **0** | 0 |

Length cue per module, before the top-up questions were added and after the
distractor rewrite for that module:

| Module | Strictly-longest key | Module | Strictly-longest key |
|---|---|---|---|
| m01 | 10.7 % | m09 | 16.7 % |
| m02 | 14.6 % | m10 | 12.5 % |
| m03 | 18.8 % | m11 | 18.8 % |
| m04 | 8.9 % | m12 | 25.0 % |
| m05 | 18.8 % | m13 | 18.8 % |
| m06 | 21.4 % | m14 | 21.4 % |
| m07 | 22.9 % | m15 | 22.5 % |
| m08 | 20.0 % | | |

How the length cue was removed: for each module, `scripts/diagnose-longest.js
--batch '^q-mNNl\d\d-'` lists the keyed answers that are longer than every
distractor, then a throwaway script rewrote those answers. The script asserted
exactly one match per edit and was deleted after the run — a patch script that
silently no-ops is worse than no patch script.

## 2. Question types

538 single-choice, 196 calculation. The calculation items use only numbers that
appear in the lesson's own worked case, so a learner who has read the lesson can
reproduce the arithmetic without a second source.

Bloom: understand 335, apply 306, analyse 93. No item is tagged remember,
evaluate or create — the course does not ask the learner to recall a standard
number without context, and it does not ask them to invent anything.

## 3. Competency coverage (lesson pool, 459 questions)

The brief asked for K6 ≈ 32 % and K4/K8 ≈ 6 %, with the rest sharing the
remainder. Measured, single-tag counting:

| | K1 | K2 | K3 | K4 | K5 | K6 | K7 | K8 | K9 | K10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Count | 88 | 35 | 65 | 63 | 64 | 185 | 34 | 21 | 88 | 22 |
| Share | 13.2 % | 5.3 % | 9.8 % | 9.5 % | 9.6 % | 27.8 % | 5.1 % | 3.2 % | 13.2 % | 3.3 % |
| Target | 9 % | 5 % | 11 % | 6 % | 11 % | 32 % | 5 % | 6 % | 12 % | 3 % |

K6 sits 4.2 pp under its target and K8 2.8 pp under; K1 and K4 sit about 4 pp
over. This is the honest measurement of what the material is: m01, m04, m07 and
m13 are inspection-and-metrology modules, and their questions are tagged K6
because that is what they test. Tags were added only where the lesson's own
goal text names the competency — 91 second tags in total, from the existing
goal statements, not from a re-reading.

The checker used to compare every competency against an even 10 %, which filed
this correct distribution as a defect. It now compares against the brief's
weights with an 8 pp tolerance.

## 4. Exam bank

Every module now carries 2–3 exam questions per lesson: 3 for all modules
except m09, which is 2.57 because its seventh lesson was topped up late (2 exam
questions for that lesson, 18 exam questions across 7 lessons). The engine
draws `min(15, bank)`, so a module exam is a near-exhaustive draw from its own
bank rather than a sample.

Coverage per module after Phase 1: m01 21, m02 18, m03 18, m04 21, m05 18,
m06 21, m07 18, m08 15, m09 18, m10 15, m11 18, m12 18, m13 18, m14 21, m15 15.

## 5. Three data conflicts found in the course text

These are the course's own numbers disagreeing with each other. None of them is
quizzed, and none was "fixed": that would require the edition text the user has
to supply. Listed here for the human verification list.

| # | Lessons | Conflict | Sources |
|---|---|---|---|
| 1 | m02l04 vs m02l06 | Dry cabinet humidity given as **10 % RH** in one lesson and **5 % RH** in the other | src-003 vs src-003, 005, 012, 017, 035 |
| 2 | m04l03 vs m04l07 | Squeegee pressure given as **0.8–1.2 N/mm** (≈200–300 N on a 250 mm blade) and as **5–15 N** | src-004 (both) |
| 3 | m09l04 vs m09l06 | Dwell window given as **6–12 s** (with a 4–10 s typical band) and as **3–6 s** | src-001, 014, 016 vs src-001, 016 |

Conflicts 1 and 3 may be two different things stated with the same word (a
cabinet for long-term storage vs a dry pack; a total two-wave dwell vs a single
wave). Conflict 2 looks like a units error in one of the two lessons. All three
need the source edition in front of a human.

## 6. What else changed, and why

**Lesson status reset.** All 92 lessons arrived marked `reviewed`. Nobody has
reviewed them in this round, and no review was recorded anywhere that would
support the label, so they are now `draft`. `check-integrity.js` treats an
inherited `reviewed` label as a problem, so the reset cannot silently come back.
The human technologist review is the user's own Phase 9 gate; this tool does not
record it and does not simulate it.

**Learner-facing draft banner trimmed.** The banner used to print the author's
self-review note under the draft warning, labelled "Author self-review, not
independently verified". It named internal working notes and read as a statement
about verification. Only the draft statement remains.

**Checker corrections.** Two of the seven earlier "editorial gaps" were defects
in the checker, not in the course:

- exam depth was compared as a ratio to the number of lesson questions, so a
  lesson with 5 questions and 2 exam questions was flagged although it is inside
  the agreed 2–3 per lesson. It now compares per lesson.
- competency coverage was compared against an even 10 %, contradicting the
  brief's own weights.

## 7. Open items for the human

1. The three conflicts in section 5, with the current edition of each cited
   source.
2. K8 (3.2 %) and K4 (9.5 %) remain away from their targets. K8 covers rework
   and repair limits, which only m11 teaches; closing that gap needs either more
   m11 questions or a module that discusses repair economics, and that is an
   editorial decision, not a bank edit.
3. The review trace removal was deferred to Phase 9 by the user's own decision;
   the learner-facing half of it is done, the rest stays.
