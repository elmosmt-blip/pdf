# Phase 4 — downloadable templates

## What was asked

Eighteen files: six templates, each blank, filled with a case's numbers, and with a
one-page instruction. Spreadsheets as XLSX with working formulas, formulas locked,
thresholds in their own cells. Text forms as DOCX. Recalculate the formulas after
building and compare them with the generator's keys. Notice at the bottom of every
file, version and date in every file name, files in `assets/templates`, links in
the Toolkit block.

## What was built

| # | Template | Kind | Serves | Lesson |
|---|---|---|---|---|
| 1 | Incoming inspection checklist | DOCX | m01 | m01l04 |
| 2 | MSL exposure log | XLSX | m02 | m02l04 |
| 3 | Stencil inspection sheet | XLSX | m03, m04 | m03l05 |
| 4 | Reflow profile log | XLSX | m06 | m06l07 |
| 5 | 8D problem report | DOCX | m14 | m14l05 |
| 6 | Defect Pareto sheet | XLSX | m07, m14 | m14l04 |

18 files, 194 formula cells, all named `<slug>-<variant>-v1-2026-10-31.<ext>`.

The order is the brief's: incoming, MSL, stencil, reflow, 8D, Pareto. The rest of
the modules follow in later rounds on the same pattern — a spec entry in
`scripts/templates/specs.py` is the whole cost of adding one.

## The formula check, and one honest substitution

The brief asked for recalculation in LibreOffice headless. **LibreOffice cannot be
installed in this environment** — apt has no network here (`apt-get install
libreoffice-calc` returns "Unable to locate package" after a failed `apt-get
update`), and there is no local package cache. That is recorded rather than
papered over.

What was done instead: `scripts/check-templates.py` recalculates every formula
with `formulas`, an independent Python implementation of the Excel formula
language. It is a different engine from the one that wrote the files (openpyxl
writes, it does not evaluate) and it reads the saved XLSX rather than the
generator's variables, so the property being tested still holds: **a spreadsheet
engine that has never seen the generator reads the formulas and produces the
course's numbers.**

Nine formulas are compared against published case keys:

| Workbook | Cell | Must equal | Source |
|---|---|---|---|
| stencil-check | G10 | 0.64 | cx-m03-01 s1 |
| stencil-check | G12 | 0.80 | cx-m03-01 s3 |
| stencil-check | H12 | 2.0 | cx-m03-01 s4 |
| stencil-check | G13 | 0.5878 | cx-m03-01 s5 |
| reflow-profile | B24 | 2.0833 | cx-m06-01 s1 |
| reflow-profile | B25 | 3.7 | cx-m06-01 s4 |
| reflow-profile | B22 | 248 | the measured peak in the m06 data |
| msl-log | J11 | 72 | cx-m02-01 s1 |
| msl-log | I11 | 64 | cx-m02-01 s2 |
| msl-log | K11 | 8 | cx-m02-01 s3 |

If LibreOffice becomes available, the same expectations can be pointed at
`soffice --headless --convert-to csv` without changing the targets.

## Defects found while building, and what they say

Every one of these was found by the check, not by looking at the files.

1. **Formulas pointed at hand-typed row numbers.** The first stencil build linked
   "release?" to `$B$6` and `$B$7`, which are the foil thicknesses, not the area
   ratios, so every aperture was judged against the wrong limit and A-01 passed at
   0.64. Fixed structurally: formulas now name a threshold `[[Area ratio,
   minimum]]` and the builder substitutes the address. No formula in this product
   contains a hand-typed row number.
2. **`str.format` ate the threshold token.** `{{label}}` became `{label}` before
   substitution, so the first fix produced literal braces inside formulas. The
   token is `[[label]]`, which `format` leaves alone.
3. **The formula engine silently skipped every dependent cell.** `formulas`
   returns only literal cells until `.finish()` builds the dependency graph — the
   check was passing vacuously at first and now fails loudly if a cell is missing.
4. **Time above liquidus was typed as constants** (`=60+25+40*(243-219)/...`), so
   changing the alloy in the threshold block would have left a stale answer. It is
   now computed from the segment cells and the liquidus threshold.
5. **The m06 example was an invented profile** (peak 243, cooling to 95). It now
   carries the case's own numbers — 25→150 in 60 s, peak 248, cooling to 100 in
   40 s — and the check compares them with the case keys.
6. **`VLOOKUP` on the MSL table returned blank** under the independent engine.
   Replaced with explicit references to the three floor-life thresholds. An
   unverifiable formula is not worth the flexibility.

## Tooling and deliverables

* `scripts/build-templates.py` — writes the 18 files and `manifest.json`.
* `scripts/check-templates.py` — 25 checks: values, notices, threshold blocks,
  hard-coded limits, cell protection, manifest, naming.
* `scripts/templates/specs.py` — the content, in one place.
* `assets/templates/manifest.json` — what the app reads.
* The Toolkit block on every module page now carries **Download these forms** with
  the module's templates, in the brief's order, each link showing its file size.

## What is not done

* Only the six templates in the brief's order exist. The remaining modules (m04
  aperture record, m05 placement record, m08 THT fill sheet, m09 wave log, m10
  selective program, m11 rework record, m12 cleanliness record, m13 coverage
  model, m15 design feedback pack) follow the same spec format and are the natural
  next round.
* The DOCX files are plain python-docx tables: correct and readable, but they have
  no page numbers or header/footer block, which a real quality system will want.
* No LibreOffice recalculation, for the reason above.
