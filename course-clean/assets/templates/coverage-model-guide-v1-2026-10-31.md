# Test coverage model

v1 · 2026-10-31 · serves cx-m13-01

## What it is for

Work out what a series of screens actually catches, class by class, instead of quoting the share of joints that carry a probe.

## Why it looks like this

The m13 case is 92 % of the nodes and 70 % of the defects: a screen that touches a joint is not a screen that catches the defect at it, and one class in the model — residue under a connector — has no screen at all.

## How to fill it in

1. Read the **THRESHOLDS** block first. Those are the limits this sheet judges against; if your quality system specifies different ones, change them there and nowhere else.
2. Enter your numbers in the white cells only. The grey cells are formulas and are locked — that is deliberate, so a filled sheet can be checked against the arithmetic rather than trusted.
3. A limit with no source id is a course or control-plan value, not a published requirement. Say so when you quote it.
4. Nothing on the sheet is protected by a password: Review > Unprotect Sheet if you need to change its structure.

## What the worked example shows

The example variant is filled with Board X numbers from case cx-m13-01. It is there to show the shape of a complete record, not to be copied: Board X is a fictional product and its limits are the course's.

## Reference

The plant's own defect model and screen probabilities; node coverage is a test-program measure, not a standard's. Taught in lesson m13l05.

---

Training template. Adapt to your quality system.

Version v1, 2026-10-31.
