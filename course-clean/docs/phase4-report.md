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

## Second pass: the defects the first pass left in

The first pass shipped, then the whole thing was re-verified from the files
themselves rather than from the build log. Six more defects came out, and two of
them were in numbers the templates had been publishing since the first build.

7. **The Pareto sheet was wrong in every row.** Rank, share and cumulative all
   used `$B$7:$B$14` while the table starts at row 8, so the rank range included
   the header row and the total excluded the last defect. The sheet printed a
   total of 1,640 against a true 1,700, ranked `Wrong value` as `#N/A`, and built
   the cumulative column on a wrong order. Worse, `Vital few?` compared against
   `$B$5` — the note under the threshold block — so it could never answer. The
   builder now substitutes `DATA_ROWS`/`RANK_COL` from the layout it is about to
   write, and the check recomputes every row from the sheet's own counts.
8. **Time above liquidus counted the wrong end of the cooling ramp.** The formula
   took `C18` — the 100 °C end — where it needed `B18`, the 248 °C start, which
   overstated TAL by 17 s. TAL is now a per-segment column summed by the summary,
   so it holds whatever number of segments the table has.
9. **The reflow and stencil examples were not the case's tables.** Reflow listed
   five invented intervals; the case prints six (25→150/60, 150→190/90,
   190→219/30, 219→248/65, hold 4, 248→100/40). Stencil listed six apertures of
   which two (`A-09`, `A-12`) do not exist and the rest carried other dimensions.
   Both are now the data files, cell for cell, and a new check reads the case CSV
   and requires the sheet to match it.
10. **The blank workbooks opened in `#DIV/0!` and `#N/A`.** A blank form that
    greets the user with errors is not shippable. Every formula is now wrapped so
    an empty row shows an empty cell, and a blank-sheet check requires zero error
    cells.
11. **The MSL log produced `#VALUE!` where it promised a blank.** R-4414 is MSL 1,
    which has no floor life in the threshold table, and the example note said the
    decision stays blank "by design" — it did not. `Remaining` and `Decision` now
    handle the text case explicitly.
12. **The 8D compared its lives in two different units.** D2 is DPMO (per
    opportunity, 620 a board); D7 is the agreed effectiveness metric in ppm of
    boards. The worked example carried a 31 % reduction that the case's own keys
    put at 82.5 %, and its target row mixed 1,000 ppm with a 20-per-1,000-boards
    rate. D2 and D7 now carry live `ROUND(...)` expressions, the check evaluates
    them in the engine against the m14 keys, and the reduction reads 82.5 %.

The stencil sheet also judged cooling against 6 °C/s — the J-STD-020 ramp-down
ceiling — where the course teaches a 1-4 °C/s band. Both are kept, as separate
lines, each saying which one it is.

**What the second pass changed about the checking.** 25 checks became 43, and the
sample-based ones are gone: whole-table recomputation (Pareto row by row, every
stencil aperture, every reflow segment, every reel), template-vs-case data
comparison for XLSX and DOCX, blank-sheet error scan, DOCX formula evaluation, and
a determinism check that rebuilds everything and requires byte equality. The
lesson is the one from the first pass, applied properly: a check that samples a
few cells cannot see a table that is wrong in all of them.

## Tooling and deliverables

* `scripts/build-templates.py` — writes the 18 files and `manifest.json`.
* `scripts/check-templates.py` — 43 checks: whole-table recomputation, values
  against case keys, template-vs-case data comparison for XLSX and DOCX, blank
  sheet error scan, notices, threshold blocks, hard-coded limits, cell
  protection, manifest, naming, and byte-identical rebuild.
* `scripts/templates/specs.py` — the content, in one place.
* `assets/templates/manifest.json` — what the app reads.
* The Toolkit block on every module page now carries **Download these forms** with
  the module's templates, in the brief's order, each link showing its file size.

## The other nine templates

The brief fixes the order of the first six and says "then the rest by module".
The rest are built, in module order, in the same three-variant form:

| # | slug | module | kind | what it computes |
|---|---|---|---|---|
| 7 | `spi-record` | m04 | xlsx | nominal volume, share of it, Cp and Cpk — and Cpk on each squeegee pass separately |
| 8 | `placement-record` | m05 | xlsx | rotation from the fiducial pair, and the displacement it causes at 7 mm and at the panel edge |
| 9 | `tht-fill-record` | m08 | xlsx | barrel fill against the board, with the 75 % minimum and the inner-layer exception as separate thresholds |
| 10 | `wave-run-log` | m09 | xlsx | contact time from wave width and conveyor speed, pot margin, and the verdict per window |
| 11 | `selective-program-record` | m10 | xlsx | nozzle against the joint, joint time, cycle time and throughput |
| 12 | `rework-record` | m11 | xlsx | iron time, energy, and the trace reduction against the class limit |
| 13 | `cleanliness-record` | m12 | xlsx | ROSE result after the blank, the local site, and the wet coating volume |
| 14 | `coverage-model` | m13 | xlsx | what each screen catches per defect class, escapes, and what a fourth screen buys |
| 15 | `design-feedback-pack` | m15 | xlsx | cost of poor quality from four drivers, and the payback in boards |

Two of these needed a mechanism the first six did not. `spi-record` has to state
the nominal it judges against; `design-feedback-pack` is mostly inputs. Both now
carry a **YOUR DATA** block: the plant's own numbers in unlocked cells, with the
summary computed from them by locked formulas. It is the same idea as the
threshold block, applied to data instead of limits — the sheet cannot contain a
computed number that was typed.

### What the checks caught in these nine

1. **The trace reduction was computed from the wrong base.** `rework-record`
   divided the 0.248 mm trace by the 0.300 mm it was drawn at, giving a 17.3 %
   reduction; the class limit is a share of the drawing's **minimum** width,
   0.280 mm, which makes it 11.4 %. The sheet now reads 11.4 %, the Class 2
   minimum is 0.224 mm and the Class 3 minimum is 0.252 mm — the case's own
   answers, three for three.
2. **The m12 template overstated the contamination escape.** The worked note said
   98.5 % of the class gets through the three screens; the model's own numbers
   give 83.8 %.
3. **A payback rounded up to a whole board.** 1,026.3 boards became 1,027; a
   planner reading the sheet and a report quoting the case would disagree by a
   board. It is now published at one decimal, like the case.
4. **A summary with nothing to guard it.** On a sheet whose numbers come from the
   YOUR DATA block rather than a table row, the empty-input guard looked at the
   wrong block, so the blank version of `design-feedback-pack` would have shown
   errors. The guard now tests whatever the summary actually reads.
5. **An inverted preheat test.** `wave-run-log` briefly asked for a top-side
   preheat *above* a ceiling, which passes everything. Caught by reading the
   computed row, not the formula.

The check set is now **125**, and every one of the nine new sheets is checked
three ways: its rows are recomputed from its own input cells, its rows are
compared cell-for-cell with the case's CSV, and its headline figures are compared
with the case's answer keys.

## What is not done

* All fifteen modules that carry a case now have a template. No template covers
  a module without one, and none is planned: the set follows the cases.
* The DOCX files are plain python-docx tables: correct and readable, but they have
  no page numbers or header/footer block, which a real quality system will want.
* No LibreOffice recalculation, for the reason above.
