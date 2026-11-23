# Cleanliness and coating record

v1 · 2026-10-31 · serves cx-m12-01

## What it is for

Report an ionic result with the area it was divided by, the blank it was subtracted from and the local site it hides, then work out the coating volume from the film the drawing asks for.

## Why it looks like this

The m12 case is a board average that passes and a site under the BGA that fails. A record with one number per board cannot show either the blank, the area or the site.

## How to fill it in

1. Read the **THRESHOLDS** block first. Those are the limits this sheet judges against; if your quality system specifies different ones, change them there and nowhere else.
2. Enter your numbers in the white cells only. The grey cells are formulas and are locked — that is deliberate, so a filled sheet can be checked against the arithmetic rather than trusted.
3. A limit with no source id is a course or control-plan value, not a published requirement. Say so when you quote it.
4. Nothing on the sheet is protected by a password: Review > Unprotect Sheet if you need to change its structure.

## What the worked example shows

The example variant is filled with Board X numbers from case cx-m12-01. It is there to show the shape of a complete record, not to be copied: Board X is a fictional product and its limits are the course's.

## Reference

IPC-TM-650 2.3.25 (ROSE); the customer's limit is a customer value, not the reference one. Taught in lesson m12l03.

---

Training template. Adapt to your quality system.

Version v1, 2026-10-31.
