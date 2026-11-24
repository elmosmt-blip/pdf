# Phase 6 — Visual audit and regeneration: closing report

## Scope

Phase 6 audited all 92 lesson rasters (`assets/img/*.webp`) against the lesson text
(`docs/phase6-image-audit.md`, `docs/phase6-image-notes.tsv`) and fixed every image
whose content contradicted, over-specified or misrepresented its lesson.

## What was done

| Fix type | Count | Mechanism |
|---|---|---|
| Inline SVG figures (numeric content rendered from lesson data) | 9 | `src/phase6/figures/*.svg`, applied by `src/phase6/apply.js` via `src/phase6/manifest.json`; numbers verified by `scripts/check-figures.js` |
| Raster regenerated in the original "PROCESS REFERENCE SHEET" style | 56 | generated → viewed at full size → `scripts/phase6-convert.py` (1024×717, letterbox, q82) → `alt` / `imageCaption` override in the manifest |
| Raster kept as-is | 27 | audit found no content conflict |

Total rasters: 92 (unchanged count). Figures are additive (lesson section 0 gains a
`figure` block in front of the image).

### SVG figures (9)
m06l01 reflow envelope · m03l01 · m03l02 area/aspect calc · m09l01 · m09l04 wave
dwell/speed · m14l04 · m08l01 clearance calc · m12l04 coating thickness · m03l06 stencil
spec.

### Regenerated rasters (56)
P1 (10): m06l01, m03l01, m03l02, m09l01, m14l04, m09l04, m09l06, m07l05, m14l05, m15l02
P2 (3): m08l01, m12l04, m03l06
P3 (38): m01l05, m01l07, m02l01–m02l06, m03l04, m04l01, m04l03, m04l05, m04l07,
m05l01–m05l06, m06l04–m06l07, m07l04, m08l05, m09l02, m09l03, m09l07, m10l03, m10l05,
m11l03, m12l02, m12l03, m12l05, m12l06, m14l02, m14l03, m14l07
Optional extras (5): m07l06, m08l04, m11l02, m13l04, m15l03

## Acceptance rules applied to every regenerated sheet

1. Same visual language as the originals: dark-navy reference sheet, header with
   title / subtitle / DOC ID box, numbered bordered panels, one photoreal macro photo,
   LEGEND, NOTES (four bullets taken from the lesson takeaways), footer with the
   governing standard. Style approved on probe `docs/phase6-style-probe-m07l05.png`.
2. **No numeric values** (temperatures, percentages, dimensions, class codes) unless
   present in the lesson; label fields rendered blank instead.
3. **No invented technical claims** — tuning-direction tables, compatibility ratings,
   risk tiers and zone maps were either removed or forced to the lesson's own mapping.
4. Text spelled correctly, nothing cropped, no biohazard / wrong-standard glyphs.
5. `alt` and caption rewritten to describe the new sheet.

Sheets that failed a rule were regenerated (15 re-runs in total:
m01l05, m02l02, m04l03, m05l01 ×2, m06l06, m12l02, m12l06, m08l04, m07l06, plus the P1 style redo).

## Known residual notes (not fixed, judged harmless)

- m09l06: "10X TO 20X" magnification note on the inspection sheet (not in lesson, decorative).
- Header "DOC ID / REV" boxes are decorative on all sheets; some show a generated
  placeholder like `PRS-001 / A`.
- All optional audit items (m07l06, m08l04, m11l02, m13l04, m15l03) were also regenerated.

## Verification at close

- `node src/phase5/run.js` — schema OK, no number lost
- `node scripts/build-embed.js` — 92 lessons, 734 questions, 39 sources, 15 cases
- `node scripts/build.js` — 13.1 MB bundle
- `node scripts/check-integrity.js` — OK
- `node scripts/check-figures.js` — all SVG numbers match lesson text
- `node tests/course.test.js` — 211 passed, 0 failed
- `node tests/case-qa.js` — 57 passed, 0 failed

## Reproducing a regeneration

```
# 1. generate /tmp/gen/<id>.png in the reference-sheet style (see docs/phase6-style-probe-m07l05.png)
# 2. view it; reject on any of the acceptance rules above
/home/user/pdf/.venv/bin/python scripts/phase6-convert.py <id>
# 3. add/update {id, section:0, alt, imageCaption} in src/phase6/manifest.json
node src/phase5/run.js && node scripts/build-embed.js && node scripts/build.js \
  && node scripts/check-integrity.js && node tests/course.test.js
```

## Addendum — standards designations removed from all rasters

Per review, designations of standards bodies (IPC-xxxx, J-STD-xxx, IPC/JEDEC,
IEEE 1149.1, ANSI/ESD, WHMA, the IPC logo and `www.ipc.org`) were removed from every
raster image. The lesson *text* still cites standards normally; only the images were
changed.

- Detection: `rapidocr-onnxruntime` OCR at 2× over all 92 rasters → 63 hits in 56 images
  (`/tmp/std-hits.json` at run time).
- Edit: `scripts/phase6-destandard.py` fills each hit box with the local background and
  redraws a neutral replacement in the same colour/size (DejaVu Sans Mono):
  footer `REF: …` → `REF: INTERNAL PROCESS SPECIFICATION`; inline tokens →
  `STANDARD`, `CLASS LIMIT`, `CUSTOMER ACCEPTANCE LIMIT`, `CLASSIFICATION:`, etc.;
  long "REFER TO <standard>" sentences → generic guideline wording; the IPC logo on
  m03l02 blanked. Per-image overrides live in the script's `OVERRIDES` table.
- Verification: second OCR pass → 0 remaining hits; spot-checked crops and full sheets.
- Pipeline re-run green (integrity OK, course tests 211/0, case-qa 57/0).
