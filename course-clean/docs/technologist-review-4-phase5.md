# Fourth technologist review — Phase 5 content and reference pages

Scope: everything Phase 5 added or derived. 92 lessons × (3 takeaways, 3
mistakes, ≥2 terms, minutes, prerequisites); the 11 relations on the formula
sheet; all 368 glossary entries and every duplicate definition; and, because a
formula sheet points at the arithmetic, every worked calculation the lessons
and cases contain.

The method is the same as the three earlier reviews: recompute, do not re-read
and nod. Where a finding could be fixed without inventing a number it was
fixed; where fixing it needs the text of a standard that is not in this
sandbox, it is listed as open with the exact question.

## 1. Summary

| | |
|---|---|
| Arithmetic expressions re-evaluated (lessons + cases) | **167 parsed, 0 wrong** (19 parser false positives, each read by hand) |
| New numbers introduced by Phase 5 text not present in the frozen lesson | **1** — removed |
| Standard designations introduced by Phase 5 text | 2 (both J-STD-020, both correct references) |
| Technical errors in Phase 5 text | **2** — fixed |
| Technical error in frozen (pre-Phase-5) text found through the formula sheet | **1** — corrected with an audit trail |
| Formula sheet entries wrong or weakly anchored | **3** — replaced, 1 clarified |
| Glossary homonyms shown as one term | **7 terms / 13 entries** — split by sense |
| Glossary duplicates that differ only in wording | 47 terms (59 entries), left as they are and disclosed on the page |
| Prerequisites pointing forward in course order | 0 |
| Open items needing the standard's text | 3 |

## 2. Found and fixed

### 2.1 m04l03 — the kilogram band did not equal the newton band (frozen text)

> "Industry guidance clusters around 0.45 to 0.70 kg per 25 mm of blade, which
> is 0.2 to 0.6 N/mm"

0.45 kg over 25 mm is 4.4 N / 25 mm = **0.18 N/mm**; 0.70 kg is **0.27 N/mm**.
The two bands are not the same band. The lesson's own calculation (125 N on a
250 mm blade = 0.5 N/mm, "inside 0.2 to 0.6"), its defect block, and m04l07
("0.2 to 0.6 N/mm (0.5 to 1.5 kg per 25 mm)") all use 0.2–0.6 N/mm, so the
kilogram figure is the one that is wrong. 0.6 N/mm × 25 mm = 15 N = 1.5 kg.

This sentence was in the frozen baseline, and the Phase 5 import refuses any
edit that drops a number from the baseline — correctly, because that guard is
what makes the rewrite trustworthy. Rather than weaken the guard or edit the
baseline file by hand, the import now accepts a **`## Corrections`** section:

    - 0.45 -> 0.5 :: 0.45 kg per 25 mm is 0.18 N/mm, not 0.2 N/mm; …
    - 0.70 -> 1.5 :: 0.70 kg per 25 mm is 0.27 N/mm, not 0.6 N/mm; …

Each line releases exactly one occurrence of the old token, requires the new
token to be present, requires a reason of at least six words, and is carried
into the lesson record as `content.corrections`. The lesson page lists it
under "Corrected in this edition". The baseline is untouched, so the diff is
auditable forever.

### 2.2 m02l05 — a number that came from nowhere (Phase 5 text)

Mistake block: "Using a **10 % RH** cabinet or an unmonitored ionizer as a
substitute for grounding". The lesson is about ESD control; no humidity figure
appears anywhere in it, and a humidity cabinet is an MSL control, not an ESD
one. The scan for numbers present in takeaways/mistakes/terms but absent from
the frozen lesson found exactly this one. Rewritten as "Treating a dry cabinet
or an unmonitored ionizer as a substitute for grounding".

### 2.3 m10l03 — MSL defined as a thermal limit (Phase 5 text)

Term: "Moisture sensitivity level :: The J-STD-020 class that limits how much
**thermal** exposure a package may take." Wrong. MSL limits floor life
(ambient exposure before reflow); the thermal limit is the classification
temperature, a different J-STD-020 field. Replaced with a definition that says
so explicitly, so the two cannot be confused again from this page.

### 2.4 Formula sheet — three entries did not say what the lesson says

| Entry as first built | Problem | Now |
|---|---|---|
| "Defect rate in ppm = defects / opportunities × 10⁶" @ m13l05 | m13l05 does not derive that; it derives **residual escape = Σ occurrence × (1 − detection)** (610 ppm in the worked example) | residual escape rate, with the weighted-coverage corollary |
| "Escape count = boards × escape rate" @ m14l03 | m14l03 computes a **suspect quantity = rate × window** (20 boards/min × 40 min = 800) | suspect quantity for containment, with the rule for choosing the window start |
| "Shadow = height × tan(wave angle)" @ m09l05 | correct only with the angle **from vertical**, which the entry did not say | convention stated; see 2.5 |
| Cpk @ m04l05 | Cp was missing although the lesson computes both | Cp and Cpk |

Each entry's quote is now the sentence that actually states the relation
(theory first, worked calculation second); none quotes a sentence about units
or metrics in general, which two of the originals did.

### 2.5 Two lessons, one screening model, opposite angle conventions

m09l05: `shadow = h × tan(θ)`, θ = 20° **from vertical** → 10 mm part casts 3.6 mm.
m08l03: `shadow = h / tan(α)`, α = 5° **from the board surface** → 12 mm part casts **137 mm**.

Both are internally consistent, both call themselves simplified estimates, and
tan(θ) = 1/tan(90° − θ) makes them the same formula. But a reader who meets
137 mm in module 8 and 3.6 mm in module 9 for near-identical parts has no way
to know which to use, and 137 mm is not a number anyone will act on. The
formula sheet now names both conventions side by side. Changing m08l03's
worked example is a content decision (open item 1), not a correction.

### 2.6 Glossary homonyms

The glossary collapses entries by term text. Seven terms carry two genuinely
different meanings in different modules, and showing the first one as *the*
definition would be wrong:

| Term | Sense A | Sense B |
|---|---|---|
| Aspect ratio | stencil: width / foil thickness (m03, m04) | plated hole: depth / diameter (m08l02, m09l06) |
| Dewetting | solder retracting on a pad (m06) | conformal coating pulling back (m12l06) |
| Shadowing | wave blocked by geometry (m08, m09) | UV cure line-of-sight (m12l04) |
| Drainage | solder leaving the joint after the wave (m09l05) | flux / gas venting path (m08l04) |
| Skew | component rotation (m05) | directional print offset (m04l06) |
| Delamination | inside a package (m02l01) | inside the board laminate (m11l04) |
| Thermal budget | what a component tolerates (m10l05) | what a rework applies (m11l01, m11l02) |

Fixed at the source: the second sense now carries a qualifier in the term
itself ("Aspect ratio (plated through-hole)", "Thermal budget (rework)", …),
so each is its own glossary entry and they sort next to each other. The
m14l07 "Detection escape" definition was also reworded: it defined the cause
category as "the reason", which read as a different concept from m14l02/l04.

The remaining 47 duplicated terms differ in wording only (Quarantine ×3,
Containment ×3, Floor life ×3, Certificate of analysis, Void, Dross…). They
were read one by one; none contradicts another. They stay as written, because
the lesson that defines "containment" for an 8D should be allowed to say it in
8D words, and the glossary page already shows "also defined, with different
wording, in …" under each.

## 3. Checked and clean

- **Arithmetic.** Every `a op b … = c` chain in lesson theory, lesson
  calculations and case explanations was evaluated (167). Percent / ppm /
  per-mille scalings and unit words are handled; the 19 flagged lines were
  parser truncations (`(3 − 1) × 3 × 4 = 24` read as `3 × 4 = 24`, Cp/Cpk
  intermediate steps, running sums) and were confirmed by hand. **No wrong
  result.** This includes the Phase 3 case keys re-derived in review 3.
- **Numbers in new text.** Every number in a takeaway, mistake or term exists
  in the frozen lesson (theory, calculation, defect or quiz) — after 2.2.
- **Standards in new text.** Only two new designations (J-STD-020 in the MSL
  terms of m02l01 and m10l03); both correct.
- **Cross-lesson consistency of the anchor values.** SAC305 217/219 °C (7
  lessons), MSL 2 = 12 mo / 2a = 4 wk / 3 = 168 h / 4 = 72 h / 5 = 48 h / 5a =
  24 h (5 lessons, identical), TAL 60–150 s J-STD-020 vs 30–90 s typical paste
  window (kept apart correctly), ramp 1–3 °C/s, void ≤25 %, hole fill 75 %,
  ROSE 1.56 µg/cm², iron 330–360 °C — no contradiction between lessons.
- **Prerequisites.** 0 of the declared prerequisite lessons comes later in
  course order than the lesson that requires it.
- **Minutes.** 15–30 per lesson, 1720 total; the model and its inputs are in
  `docs/phase5-report.md`. The plan table is frozen in
  `src/phase5/plan-minutes.json` so the comparison is reproducible.
- **Terms with figures.** Cumulative bake "above 90 °C limited to 96 h"
  (m02l04) matches J-STD-033's wording; reference condition 30 °C / 60 % RH
  correct; sample-size code letter per ISO 2859-1 correct.

## 4. Open items (need the standard's text, which is not in this sandbox)

1. **m08l03 shadow example (2.5).** Recommend rewriting the worked example to
   the m09l05 convention (angle from vertical, result in single millimetres) or
   stating in m08l03 that the 5° "approach angle" is the conveyor incline and
   not a line-of-sight angle. Owner decision; a correction entry will carry it.
2. **≤10 % RH dry cabinet, m02l01 / m02l04.** The lessons say a 10 % RH
   cabinet "slows the clock without stopping it" and that only ≤5 % RH suspends
   floor life. The reviewer's recollection of J-STD-033D §4 is that **≤10 % RH
   stops floor-life accumulation** for MSL 2a–5a, and that ≤5 % RH additionally
   counts as drying (floor-life reset after a stated multiple of the exposure).
   If that is right, the lessons understate what a 10 % cabinet earns. Verify
   against the current J-STD-033 text before changing anything; three lessons
   and two takeaways depend on it.
3. **Wall taper "85 to 90 degrees from horizontal, IPC-7525C", m03l05.** The
   number is in the frozen text and its calculation (bottom-side opening from a
   5° wall) is arithmetically right; whether IPC-7525C states that range in
   those words should be checked against the standard before it is quoted on
   the formula sheet (it is not quoted there now).

## 5. Tooling added by this review

- `src/phase5/raw-tool.js` / `apply.js`: `## Corrections` section (2.1) —
  the only path by which a frozen number may change, always with a reason.
- `assets/app.js`: "Corrected in this edition" block on the lesson page.
- `scripts/build-reference.js`: formula patterns anchored to the stating
  sentence; `where` text now carries the angle / unit conventions.
- `tests/course.test.js`: 211 checks (+1: corrections are disclosed).

Commands: `node src/phase5/run.js && node scripts/build-reference.js &&
node scripts/build-embed.js && node scripts/build.js &&
node scripts/check-integrity.js && node tests/course.test.js`.
