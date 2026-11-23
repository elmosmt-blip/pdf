# Defect Pareto sheet

v1 · 2026-10-31 · serves cx-m07-01, cx-m14-01

## What it is for

Rank defect types by count, carry the cumulative share, and show which few types account for most of the loss.

## Why it looks like this

Pareto is arithmetic that is easy to do wrong by hand: the cumulative column has to be built from a sorted list, and a sheet that sorts the input but not the running total is a common and invisible error.

## How to fill it in

1. Read the **THRESHOLDS** block first. Those are the limits this sheet judges against; if your quality system specifies different ones, change them there and nowhere else.
2. Enter your numbers in the white cells only. The grey cells are formulas and are locked — that is deliberate, so a filled sheet can be checked against the arithmetic rather than trusted.
3. A limit with no source id is a course or control-plan value, not a published requirement. Say so when you quote it.
4. Nothing on the sheet is protected by a password: Review > Unprotect Sheet if you need to change its structure.

## Traps this record is built around

* Type the counts; the sheet ranks them. Do not sort the input by hand — the cumulative column follows the rank, not the row order.
* The 80 % line is a threshold cell. Change it there if your plant uses a different split, and the vital-few column follows.
* Counts from different windows are not one Pareto. Put the denominator (boards, or opportunities) beside the counts.
* Pareto ranks frequency, not cost. A low-count defect that stops the line belongs in the action list whatever its rank.

## What the worked example shows

The example variant is filled with Board X numbers from case cx-m07-01, cx-m14-01. It is there to show the shape of a complete record, not to be copied: Board X is a fictional product and its limits are the course's.

## Reference

Pareto analysis; defect classification per IPC-A-610 class. Taught in lesson m14l04.

---

Training template. Adapt to your quality system.

Version v1, 2026-10-31.
