# Phase 5 — editorial pass, lesson time, reference pages

## What was asked

Every lesson re-read and rewritten where the paragraph did not earn its place;
every lesson given key takeaways, common mistakes and its own terms; a lesson
time that comes from the text rather than a plan; prerequisites between
lessons; and two cross-lesson pages — a glossary and a formula sheet — that a
reader can reach from anywhere.

## What was done

| Item | Result |
|---|---|
| Lessons rewritten | 92 of 92 (664 paragraphs) |
| Takeaways / mistakes / terms | 3 / 3 / ≥2 per lesson, enforced by `src/phase5/schema.js` |
| Lesson minutes | from the text, 15–30 min each, 1720 min total (plan was 2685) |
| Prerequisites | `lesson.prereqs = {lessons[], skills[]}` from `src/phase5/prereqs.json` |
| Glossary `#/g/` | 302 distinct terms, derived |
| Formula sheet `#/f/` | 11 relations, each linked to its deriving lesson |

Numbers and standard references in each lesson were checked as a multiset
before and after the rewrite (`run.js`); no value was lost.

## Lesson time

The old `LESSON_MINUTES` table in `assets/app.js` was the plan, typed before
the text existed. The published number now ships in `data/lessons.json` as
`lesson.minutes`, computed by `src/phase5/run.js`:

    theory words / 120 wpm
    + quiz questions × 60 s
    + 2 min to read the worked calculation
    + solution steps × 40 s
    + 2 min to consolidate
    rounded up to 5 min, floor 15 min

`assets/app.js` reads `lesson.minutes`; the literal table is gone and the empty
`LESSON_MINUTES` fallback renders no chip rather than an invented duration.
The plan figures are frozen in `src/phase5/plan-minutes.json` so
`src/phase5/03-time.js` can still report plan vs text. The plan over-stated the
course by about 950 minutes; the five widest gaps were m14l07 (40 → 15),
m04l05, m14l04, m13l05, m03l02 (35 → 15 each).

## Reference pages are derived, not typed

`scripts/build-reference.js` reads the lessons and writes
`data/reference.json`. `scripts/check-integrity.js` rebuilds it in memory and
fails on a stale copy; `build-embed.js` carries it into the file:// embed.

**Glossary.** 368 term entries across lessons collapse to 302 distinct terms.
Where two lessons define the same term, the first definition in course order
is shown and every defining lesson is linked. 66 of the duplicates differ in
wording (Aspect ratio ×5, Area ratio ×3, Quarantine, Floor life, Humidity
indicator card, Containment, Skew, Dewetting ×2 each…). These are disclosed
under the entry — "also defined, with different wording, in …" — not hidden.
Making the wordings agree is an editorial decision for the technologist
review, not something a script should do.

**Formula sheet.** Discovery is deliberately narrow: a fixed list of patterns
in `FORMULA_PATTERNS`, each anchored on how the lesson actually phrases the
relation, each quoting the sentence it matched. A relation the course states
some other way is simply absent, and the script reports the count of patterns
that found nothing (currently 0). Eleven relations: area ratio, aspect ratio,
squeegee pressure per blade length, Cpk, wave contact time, shadow length,
rework thermal budget index, dry-film thickness from wet film, ppm, escape
count, and the no-defect sample size.

## Where it shows

- Lesson page, in order: prerequisites → goals → theory → worked calculation →
  defect analysis → key takeaways → common mistakes → terms → quiz → sources.
- Sidebar: a "Reference" block under the modules with both pages and counts.
- Tests: `tests/course.test.js` (210 checks) renders a mid-course lesson and
  both reference pages and asserts counts against the data.

## Commands

    node src/phase5/run.js              # rewrite + minutes + prereqs → data/lessons.json
    node scripts/build-reference.js     # → data/reference.json
    node scripts/build-embed.js         # → assets/data-embed.js
    node scripts/build.js               # → build/course-clean
    node scripts/check-integrity.js
    node tests/course.test.js
