# Stencil inspection sheet

v1 · 2026-10-31 · serves cx-m03-01, cx-m04-01

## What it is for

Compute the release indicators for every aperture on the board and decide which need a stepped foil, before the first print.

## Why it looks like this

Area ratio and aspect ratio are the two numbers that predict a print before the printer runs, and both are arithmetic on the aperture and the foil — which is exactly what a spreadsheet is for.

## How to fill it in

1. Read the **THRESHOLDS** block first. Those are the limits this sheet judges against; if your quality system specifies different ones, change them there and nowhere else.
2. Enter your numbers in the white cells only. The grey cells are formulas and are locked — that is deliberate, so a filled sheet can be checked against the arithmetic rather than trusted.
3. A limit with no source id is a course or control-plan value, not a published requirement. Say so when you quote it.
4. Nothing on the sheet is protected by a password: Review > Unprotect Sheet if you need to change its structure.

## Traps this record is built around

* Area ratio is aperture area divided by pad-wall area; for a round aperture that reduces to D / (4 x foil), so a round aperture has no aspect ratio and is judged on area alone.
* Aspect ratio is the smaller aperture dimension over the foil thickness. Both indicators must clear their limits for a rectangular aperture to release.
* Stepping the foil down is a local change over the fine-pitch region, not a thinner stencil everywhere: A-04 in the worked example is the same 0.20 mm aperture in 0.100 mm foil.
* Change one aperture at a time and re-run the sheet. Two changes in one step and you cannot say which one moved the print.

## What the worked example shows

The example variant is filled with Board X numbers from case cx-m03-01, cx-m04-01. It is there to show the shape of a complete record, not to be copied: Board X is a fictional product and its limits are the course's.

## Reference

IPC-7525 (area and aspect ratio), IPC-7526 (stencil cleaning). Taught in lesson m03l05.

---

Training template. Adapt to your quality system.

Version v1, 2026-10-31.
