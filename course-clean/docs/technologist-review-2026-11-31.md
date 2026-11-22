# Review of the case system — 2026-11-31

The brief was to look at the eight cases as a process technologist, not as the
person who wrote them. So this is a read-through of the content, then a
recomputation of every key by hand, then a check of the checks themselves. Three
of the defects below were found by the third pass, in the tooling that was
supposed to catch the first two.

## 1. What was wrong, in the order it matters

### 1.1 The checker could pass a wrong answer (fixed)

`check-cases.js` compared a choice key to the option's text. When the second
opinion returned a bare letter, it checked `keyText.indexOf('b')` — and almost
every English sentence contains a `b`. So a key of `a` "verified" against an
option reading "The top-side preheat…", and it had done so since the first four
cases.

The rule now: a token longer than three characters is matched as a substring; a
short token must match as a whole word. Once that was in place two keys fell
over immediately — m09 s3 and m11 s8 — and twelve more were rewritten to return
the phrase the option actually carries, so the checker compares meaning and not
a letter.

### 1.2 A CSV row could silently shift a column (fixed)

`rework-record.csv` had a header with eleven columns and two rows with ten. The
parser did not complain, it just shifted every later cell one to the left, so
`dry_flag` landed in `trace_nick_mm`. The check that read it was therefore
reading the wrong field and still passing. `dataFile()` now rejects any row whose
cell count differs from the header, and the generator asserts the same before it
writes.

### 1.3 m11 judged the trace against the wrong denominator (fixed)

The case divided the nick by the **as-drawn** 0.30 mm and got exactly 20 %, the
Class 2 limit. IPC-A-600 caps the reduction of the **minimum** conductor width,
so the denominator is the floor the drawing sets. The case now carries a
`trace_min_mm` of 0.280 mm and measures 0.248 mm: 11.4 %, inside Class 2 and
outside Class 3, which is the real lesson and a much sharper one. The old
arithmetic was not wrong, it was answering a different question than the one the
standard asks.

### 1.4 m07 stated a true-call rate that contradicted its own data (fixed)

The scenario said "ninety percent of the calls were real". The audit log says
210 true calls out of 300 verified: **70 %**. The title carried the same 91 %
claim. Both were corrected from the table, and the step's wording now reads the
ratio out of the audit rather than asserting it.

### 1.5 m11's scenario described "four and a half minutes" of iron time (fixed)

The record totals 3.2 s. The sentence was written to sound dramatic and was
simply false; it now says what the row shows — three contacts, one of them dry.

### 1.6 A passing and a failing ball were indistinguishable in m07 (fixed)

Ball A4 (0.20 and 0.12 mm voids) came out at 23.3 %, under the 25 % limit, and
looked exactly like the failure the case is about. It is now a single 0.32 mm
void at 50.5 %, so the table has two failing balls and one passing one, and the
outcome matches the story.

### 1.7 Small wording defects (fixed)

* m08 s4 said "only about two thirds of it is asked for". The 75 % minimum is a
  depth, not a volume, so the two-thirds claim was invented. It now states the
  requirement in the same unit as the answer (0.60 mm³ of the 0.80 mm³).
* m07 s8 called a 4.9 % void "a process indicator", which the sources do not
  support. It is now "inside the limit".
* m11 s9 listed the measured width "with its limit" instead of "against the
  minimum it was compared with", which is what the rest of the case now does.

## 2. Recomputation by hand

Forty numeric keys were recomputed with a calculator and an independent script,
straight from the case's own inputs, and compared with `data/cases.json`: **40 of
40 agree** within each step's tolerance.

| Case | Keys checked | Result |
|---|---|---|
| m03 | 6 | 0.64 · 0.80 · 2.0 · 0.588 · 1.00 · 16 nL |
| m02 | 2 | 64 h · 8 h |
| m06 | 6 | 2.083 · 5 s · 12 °C · 2 °C · 3.7 · 1.111 |
| m08 | 6 | 0.40 · 0.32 · 0.16 · 0.804 · 68.75 · 0.10 |
| m09 | 4 | 2.0 s · 36 °C · 1.26 · 5.0 % |
| m07 | 6 | 83.3 · 30.0 · 0.15 · 7.9 · 48.4 · 4.9 |
| m11 | 5 | 3.2 s · 144 J · 11.4 · 0.224 · 0.252 |
| m14 | 5 | 49.43 · 19.15 · 16000 · 2800 · 82.5 |

Every percentage claim in a feedback line was also checked against the data it
describes (the 76.04 % mean in m08, the four microns in m11, the three AOI
rates), because a wrong number in prose is invisible to a key check.

## 3. What I checked against the standards

| Number the cases use | Where it comes from | Status |
|---|---|---|
| 75 % barrel fill, Class 2 and Class 3 | IPC-A-610 (§10), src-016 | confirmed, three sources |
| 50 % / 1.2 mm exception for 14+ leads on planes | IPC-A-610, src-016 | confirmed, and m08 rules it out on the sheet's own data |
| 25 % cumulative void area per ball | IPC-A-610 / IPC-7095, src-007 | confirmed; 30 % also circulates, the case says the class and revision must be confirmed |
| 30 / 20 / 10 % conductor reduction | IPC-A-600, src-022 | confirmed |
| 0.050 mm external annular ring, Class 3 | IPC-A-600 §2.10.3, src-022 | confirmed |
| 2–4 s wave contact, 250–260 °C SAC305 pot | course text m09l07, no source id | course value, printed as such |
| 330–360 °C hand-soldering setpoint | course text m11l02, no source id | **not settled by the sources** (IPC-7711 starts near 315 °C and says "change as necessary"; vendor tables reach 400 °C). The case uses the course band and its step only asks whether 345 °C is inside it |

## 4. What this review did not do

* No pilot has been run, so nothing here says whether the tasks are *understandable*
  to another engineer. That is still the one thing only a real reader can answer.
* The cases were checked against summaries of the standards, not against paid
  copies of IPC-A-610J, IPC-A-600, IPC-7711D or IPC-7095. Where a summary was
  ambiguous the case says so in the text instead of picking the convenient number.
* Six modules still have no case: m01, m04, m05, m10, m12, m13, m15.

## 5. Verification after the fixes

`gen_cases.py --check` OK (8 cases, 68 steps) · `check-cases.js` **68/68** keys
recomputed · `check-integrity.js` OK · `check-quiz.js` OK · `tests/course.test.js`
**181 / 0** · `tests/case-qa.js` **36 / 0** · pilot sheet regenerated.

## 6. Where the build is published

`https://drive.google.com/file/d/1Tq3PWJYvZ6W8aNo8V8f_lIgFCxZi12ug/view`
(8,804,783 bytes, the zip now has `index.html` at its root, so it opens from a
double click instead of requiring the `build/course-clean/` path). The previous
copy in that slot was zero bytes and was trashed.
