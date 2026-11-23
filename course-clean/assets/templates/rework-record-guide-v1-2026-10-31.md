# Rework and repair record

v1 · 2026-10-31 · serves cx-m11-01

## What it is for

Record what the repair did to the board — heat, contacts, the trace it touched — and judge the damage against the class the customer requires.

## Why it looks like this

The m11 case is a repair that passes on the joint and fails on the trace: 0.248 mm against a 0.280 mm minimum is 11.4 %. Under Class 2 that is inside the 20 % limit; under Class 3 it is not.

## How to fill it in

1. Read the **THRESHOLDS** block first. Those are the limits this sheet judges against; if your quality system specifies different ones, change them there and nowhere else.
2. Enter your numbers in the white cells only. The grey cells are formulas and are locked — that is deliberate, so a filled sheet can be checked against the arithmetic rather than trusted.
3. A limit with no source id is a course or control-plan value, not a published requirement. Say so when you quote it.
4. Nothing on the sheet is protected by a password: Review > Unprotect Sheet if you need to change its structure.

## What the worked example shows

The example variant is filled with Board X numbers from case cx-m11-01. It is there to show the shape of a complete record, not to be copied: Board X is a fictional product and its limits are the course's.

## Reference

IPC-7711/7721 (rework and repair method), with the width limit from IPC-A-600 (20 % Class 2, 10 % Class 3). Taught in lesson m11l06.

---

Training template. Adapt to your quality system.

Version v1, 2026-10-31.
