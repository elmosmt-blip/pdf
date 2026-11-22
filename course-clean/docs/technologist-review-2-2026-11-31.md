# Second technologist review — 2026-11-31 (after m01, m04, m05, m10, m13)

Same brief as the first review: read the product as a process engineer, not as the
person who wrote it. This pass covers thirteen cases, 117 steps, and — for the
first time — the parts of the product that are *prose about numbers*: explanation
text, feedback lines and the fact table. The first review found seven defects in
eight cases. This one found one.

## 1. What was found

### 1.1 m09 stated a fill range the data does not support (fixed)

The m09 explanation said "the other joints on this board fill to 78-81 %". The
sheet says 76.25 % to 82.50 %, and one joint on it (J-01 at 68.75 %) is the
failing one the case is about. The sentence now reads 76.3-82.5 %.

This is a small error with a specific cause worth recording: the range was
reconstructed from memory of the table rather than read from it, and no checker
compares prose against a column. It survived the first review, four case rounds
and 191 passing tests.

### 1.2 Everything else recomputed cleanly

Twenty-nine numeric keys were recomputed from first principles in a separate
script with its own constants — no generator helpers, the coverage model re-entered
by hand, the statistics recomputed with the sample formula — and all twenty-nine
agree with `data/cases.json`.

## 2. What was verified, not just re-run

| Check | Result |
|---|---|
| Numeric keys recomputed independently | **29 of 29 agree** |
| Percentages and means typed into explanations (m04, m10, m13) | **24 of 26 agree**; the two "failures" were my audit script slicing the m04 data by board instead of by squeegee pass — corrected, the case is right (18.21 / 15.96, Cpk 3.05 / 0.99) |
| m01 carton labels vs box counts | labels sum to 2,800, boxes to 2,760, split 1,400 / 1,400 |
| m13 escapes recomputed from the model | 117 ppm and 76.5 ppm confirmed; contamination residual 58.65 ppm |
| Every `toolLinks` href resolves to a real lesson | 39 links, all valid |
| Every `sources` id exists in `sources.json` | all valid |
| Every rubric sums to 100 and covers every step | 13 of 13 |
| Every data-file row has the same width as its header | all files |
| Every template variant non-empty; template lessons exist | 16 templates, 48 files |
| `[object Object]` on any case page | none; new list facts render as `0.8–2.5` |
| Units asked for in the prompt | all; the flag script's 28 hits were plain English ("in percent", "in joules") |

## 3. The structural finding nobody likes

The Board X thread is **not** in module-number order: m07 (AOI) sits after m09 and
m10 in the process, so the strip reads m01 … m06, m08, m09, m10, m07, m11, m13,
m14. That is correct as a *process* and confusing as a *numbering*. An audit script
flagging "thread order" will keep flagging it, and a reader scanning the strip will
see 07 after 10.

I left it as it is. The strip's job is to show where a case sits in the product's
life, and AOI happens after the solder processes; renumbering the modules is not
mine to do. The fact is recorded here so the next person does not "fix" it.

## 4. Claims I re-read against their sources

* **m01 twist.** IPC-TM-650 2.4.22 divides the gap by twice the diagonal. The case
  says so in the prompt, the hint, the explanation and the record requirement. No
  change.
* **m01 sampling.** ISO 2859-1 band 1,201-3,200 at level II is code K, 125 pieces,
  Ac 3 / Re 4. The case teaches the band edge (1,200 vs 1,150 falling to code J)
  which is the part a reader actually gets wrong.
* **m04 window.** Board X's control plan, 75-125 %, no source id, stated on the
  page as the plan's window. Published vendor windows differ (80-120 %, 50-150 %);
  the case says so rather than pretending to a standard.
* **m05 acceptance.** 0.15 mm is the plant's acceptance, printed as such. IPC-7351B
  courtyard figures are recorded in the report but deliberately not used as a
  placement tolerance, because they are not one.
* **m10 ranges.** Nozzle 0.8-2.0 mm, dwell 0.8-2.5 s / 1.5-4.0 s are course text,
  no source id, and the case uses them to judge a program — never as a claim about
  what an alloy needs. No bath temperature is quoted, because nothing in the case
  depends on it.
* **m13 probabilities.** The plant's own, in the data file, with the independence
  assumption stated on the page and made part of the required record. No vendor
  escape-rate table is quoted: none comes with a model that could reproduce it.

## 5. What this review cannot say

* Still no pilot. Thirteen cases and 117 steps have never been read by anyone who
  did not write them, and that remains the largest open risk — larger than any
  arithmetic here, all of which now has two independent derivations.
* The standards are checked against summaries, not against paid copies. Where a
  summary was ambiguous, the case says so on the page instead of choosing the
  convenient number.
* Two modules still have no case: m12 and m15.

## 6. Verification after the fixes

`gen_cases.py --check` OK (13 cases, 117 steps) · `check-cases.js` **117/117** keys
· `check-integrity.js` OK · `check-quiz.js` OK · `tests/course.test.js` **191 / 0** ·
`tests/case-qa.js` **51 / 0** · pilot sheet 13 cases / 117 steps · 27 outline
captures regenerated.
