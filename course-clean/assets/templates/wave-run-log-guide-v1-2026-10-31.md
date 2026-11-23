# Wave solder run log

v1 · 2026-10-31 · serves cx-m09-01

## What it is for

Record the settings a wave run actually ran at, compute the contact time and the pot margin each one gives, and keep the findings on the same page as the record that explains them.

## Why it looks like this

The m09 case has a short barrel and a bridge on the same board, and the line wants one cause. The record has to show contact time, pot margin and wave width together, or the argument is decided by who speaks last.

## How to fill it in

1. Read the **THRESHOLDS** block first. Those are the limits this sheet judges against; if your quality system specifies different ones, change them there and nowhere else.
2. Enter your numbers in the white cells only. The grey cells are formulas and are locked — that is deliberate, so a filled sheet can be checked against the arithmetic rather than trusted.
3. A limit with no source id is a course or control-plan value, not a published requirement. Say so when you quote it.
4. Nothing on the sheet is protected by a password: Review > Unprotect Sheet if you need to change its structure.

## What the worked example shows

The example variant is filled with Board X numbers from case cx-m09-01. It is there to show the shape of a complete record, not to be copied: Board X is a fictional product and its limits are the course's.

## Reference

IPC-A-610 (joint acceptance); the wave windows are the machine's, taken from the course and the equipment datasheet. Taught in lesson m09l07.

---

Training template. Adapt to your quality system.

Version v1, 2026-10-31.
