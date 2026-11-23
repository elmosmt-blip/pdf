# Selective solder program record

v1 · 2026-10-31 · serves cx-m10-01

## What it is for

Check the nozzle against the joint it has to fill, and put the cycle time on the sheet before anyone promises a rate.

## Why it looks like this

The m10 case has a nozzle that fits and a cycle nobody accounted for: 20 joints at 1.8 s dwell and 0.4 s of travel is 44 s before preheat and flux are added. A program record without the cycle cannot be quoted.

## How to fill it in

1. Read the **THRESHOLDS** block first. Those are the limits this sheet judges against; if your quality system specifies different ones, change them there and nowhere else.
2. Enter your numbers in the white cells only. The grey cells are formulas and are locked — that is deliberate, so a filled sheet can be checked against the arithmetic rather than trusted.
3. A limit with no source id is a course or control-plan value, not a published requirement. Say so when you quote it.
4. Nothing on the sheet is protected by a password: Review > Unprotect Sheet if you need to change its structure.

## What the worked example shows

The example variant is filled with Board X numbers from case cx-m10-01. It is there to show the shape of a complete record, not to be copied: Board X is a fictional product and its limits are the course's.

## Reference

IPC-A-610 (joint acceptance), IPC-7711/7721 (rework of what the program gets wrong). Taught in lesson m10l05.

---

Training template. Adapt to your quality system.

Version v1, 2026-10-31.
