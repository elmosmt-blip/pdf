# SPI print record

v1 · 2026-10-31 · serves cx-m04-01

## What it is for

Record every deposit's volume against the nominal the stencil actually cuts, and keep the mean from hiding a print that has two humps.

## Why it looks like this

The m04 case passes on the mean and fails on the split: six deposits per squeegee pass, a gap of about 2 nL between them, and a program built against the wrong foil. A record with one average per board cannot show any of that.

## How to fill it in

1. Read the **THRESHOLDS** block first. Those are the limits this sheet judges against; if your quality system specifies different ones, change them there and nowhere else.
2. Enter your numbers in the white cells only. The grey cells are formulas and are locked — that is deliberate, so a filled sheet can be checked against the arithmetic rather than trusted.
3. A limit with no source id is a course or control-plan value, not a published requirement. Say so when you quote it.
4. Nothing on the sheet is protected by a password: Review > Unprotect Sheet if you need to change its structure.

## What the worked example shows

The example variant is filled with Board X numbers from case cx-m04-01. It is there to show the shape of a complete record, not to be copied: Board X is a fictional product and its limits are the course's.

## Reference

IPC-7527 (solder paste printing), IPC-7525 (stencil design). Taught in lesson m04l05.

---

Training template. Adapt to your quality system.

Version v1, 2026-10-31.
