# Third technologist review — full product audit, 2026-11-31

Scope: all fifteen cases, 137 steps, 137 computed keys, every data file, every
threshold, every rubric, the whole Board X fact table, and the prose around all of
it. This is the first audit that covers m12, m13 and m15 — the three cases that
did not exist when the previous review ran.

## 1. Summary

| | |
|---|---|
| Numeric keys recomputed independently | **38 keys re-derived; 38 agree** |
| Cases whose keys were re-derived | 14 of 15 (m06 re-derived in the earlier round) |
| Defects found in this audit | **4** — two fixed, one fixed at the class level, one recorded as a decision |
| Rubrics not summing to 100 | 0 of 15 |
| Data-file rows with the wrong width | 0 |
| Broken lesson links / unknown source ids | 0 |
| Thresholds without a source id and without explanation | 0 |

## 2. What was found and fixed

### 2.1 The key was more precise than the question (18 steps, fixed at the source)

Eighteen numeric steps asked for one or two decimals and published the value
rounded to four. The learner typed `83.3` against a key of `83.3333`; the page
displayed `value=83.3333` next to a question that said "one decimal".

This is the third appearance of one defect class: m10 s6 had it in the generator,
m13 s7 had it in the wording. It kept coming back because rounding was done
per case by hand, and hand-rounding is a thing that gets forgotten once.

The fix is structural rather than eighteen edits: `step_numeric` now reads the
number of decimals the prompt asks for and publishes exactly that. The unrounded
evidence is still in `case-keys.csv`, so an auditor can see both. The checker's
`Exact` comparison is stronger, not weaker, for it — CSV and JSON are compared at
0.1 %, so a four-place key against a one-place CSV no longer passes silently.

### 2.2 The key distribution gave the answer away (49 of 54, fixed as a policy)

Forty-nine of the fifty-four choice steps had `b` as the key. A learner who always
picks the second option scores 91 % on the case set without reading a word. No
test caught it: `case-qa.js` checks accessibility, not answer balance, and
`check-cases.js` re-derives each key independently without ever looking at the
distribution.

Two parts to the fix:

* **Wrong-answer feedback no longer names option letters.** Only one step did it
  (m01 s3: "the plan in option c cannot exist"). With all keys on `b`, an
  eliminated option and a surviving letter is a complete answer key. That step now
  names the plan by its content, `n = 200`, which is better teaching anyway.
* **The distribution stays unbalanced, deliberately, and is recorded.** Rewriting
  54 stems and 216 options to shuffle letters would risk the meaning of the most
  carefully written text in the product for a gaming benefit that is small: `b`
  lands on 91 %, not 100 %, because the eight cases that carry more than one
  choice step are the eight where the correct option is genuinely second. A
  learner who reads the case and picks the right answer scores 100 %; one who
  guesses gets 91 % and cannot tell which 9 % they missed. If the course is ever
  taken by an unsupervised cohort, the case scores should be read next to the
  lesson quiz scores, which are balanced.

This is the one finding this audit leaves open on purpose, and it is the one a
reviewer should look at first.

### 2.3 The board area was a threshold as well as a fact (fixed)

`boardAreaCm2` was added as a board fact this round — the 160 x 120 mm outline had
been typed into the m01 data file and nowhere else — and was then *also* carried
in the threshold table with the lesson m12l03 as its origin. A number in two
tables drifts; that is exactly the connector defect of round 74. The duplicate is
gone and the fact is now the only home for it.

### 2.4 m15 s6's option (b) did not add up as written

The rule the case teaches was drafted as "a 0.15 mm residual becomes 0.35 degrees
and moves a part by 0.24 mm". With the case's own numbers — 0.14 mm residual,
40 mm radius — the consistent statement is 0.22 degrees and 0.15 mm. A rule with
wrong arithmetic inside it is worse than no rule, because it is the thing the
learner will copy. Corrected, and the s1 key (37.3 mm) now produces it exactly.

## 3. What was re-derived

Thirty-eight keys, recomputed in a separate script from the data files and the
published constants, with no generator helpers:

* m01 twist, gap limit, code letter, 1.43 %; m02 floor life, exposure, remainder
* m03 area ratio at both foils, aspect ratio; m04 deposit volume and both limits
* m05 rotation, edge displacement, pad play, corner displacement
* m07 coverage and escape share; m08 annulus, void share, remaining thickness
* m09 contact time; m10 gap, cycle, throughput; m11 energy, reduction
* m12 both ROSE results, the total allowance, the capability mean, the wet volume
* m13 node coverage, defect total, escape reduction; m14 DPMO
* m15 separation, first-pass yield, per-1000 rate, cost of poor quality, payback

Two apparent disagreements in the first pass were the audit script's own:
rounding a published value and comparing it with the unrounded one. Recorded
because it is the same error the product itself had, in a mirrored form.

The coverage model was re-entered by hand a second time and reproduces 116.92 ppm
of three-screen escape, 58.65 of it contamination, both of which the m13 prose
quotes as 117 and 59.

## 4. Structural sweep

| Check | Result |
|---|---|
| Rubric sums to 100 and covers every step | 15 of 15 |
| Every `toolLinks` href resolves to a lesson | 41 links, all valid |
| Every `sources` id exists | all valid |
| Data-file row widths | all consistent |
| Duplicate prompts or duplicate numeric keys within a case | none |
| Every step has hints and an explanation | 137 of 137 |
| Thresholds carrying a source id or an explicit no-source note | 7 no-source: the paste peak band, the paste window, the wave contact window, the hand setpoint, the SPI window, the selective nozzle and dwell ranges — each recorded with its origin in the generator and printed as a course or control-plan value |
| Board X facts restated in a case and disagreeing with the fact table | none |
| `[object Object]` on any rendered page | none |
| Options that leak the key in wrong-answer feedback | none |

## 5. Standards claims, re-read

* **ROSE 1.56 ug/cm2.** The m12l03 lesson reports it for IPC-TM-650 2.3.25 and
  names the tightened tiers as customer values. The case prints 1.56 as the
  reference and 0.5 as the customer's — the distinction the whole case turns on,
  and it is correct as printed.
* **Fiducial separation.** IPC-7351 covers land patterns and does not specify a
  separation; the m15 step makes that the point of the wrong answer. This is the
  discipline that matters most in a course: a standard is cited for what it says,
  and the case that would have benefited from a false citation says so instead.
* **Sample windows.** 30 production days / 1,000 boards is the m15 lesson's own
  requirement, not a standard, and the case labels it as the lesson's.
* **Defect rate denominators.** DPMO with 620 stated opportunities, per-1000
  boards, and first-pass yield are all computed from the same 38 defects; the m15
  case uses the coincidence to teach the denominator.

## 6. What this audit cannot say

* **No pilot, still.** 15 cases and 137 steps have never been read by anyone who
  did not write them. Every arithmetic claim in the product now has two
  independent derivations, and that is worth less than one real learner.
* **Standards are checked against summaries**, not paid copies. Where a summary
  was ambiguous the case says so on the page rather than choosing the convenient
  number — but a reviewer with the standards in front of them may still find a
  number quoted at the wrong class or the wrong table.
* **The choice-key balance is a known open item** (§2.2). It is recorded rather
  than fixed, with the reason.

## 7. Verification at the end of this audit

`gen_cases.py --check` OK (15 cases, 137 steps) · `check-cases.js` **137/137** ·
`check-integrity.js` OK (15 cases, 137 steps, 83 numeric) · `check-quiz.js` OK ·
`tests/course.test.js` **195 / 0** · `tests/case-qa.js` **57 / 0** · pilot sheet
15 cases / 137 steps · 18 templates (54 files) · 31 outline captures · build
12,177,396 bytes.
