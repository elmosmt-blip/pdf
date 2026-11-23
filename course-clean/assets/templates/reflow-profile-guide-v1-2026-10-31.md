# Reflow profile log

v1 · 2026-10-31 · serves cx-m06-01

## What it is for

Record the thermocouple readings, compute the ramp rates and the time above liquidus, and decide whether the profile is inside the window.

## Why it looks like this

The m06 case fails a profile on the cooling rate, not on the peak — the sheet has to compute every segment or it misses the one that fails.

## How to fill it in

1. Read the **THRESHOLDS** block first. Those are the limits this sheet judges against; if your quality system specifies different ones, change them there and nowhere else.
2. Enter your numbers in the white cells only. The grey cells are formulas and are locked — that is deliberate, so a filled sheet can be checked against the arithmetic rather than trusted.
3. A limit with no source id is a course or control-plan value, not a published requirement. Say so when you quote it.
4. Nothing on the sheet is protected by a password: Review > Unprotect Sheet if you need to change its structure.

## Traps this record is built around

* Enter each interval's start temperature, end temperature and duration. The sheet derives every rate from those three numbers, so do not type a rate.
* Time above liquidus is a share of every segment, not just the dwell: the ramp up through 219 °C and the cooling ramp back down through it both count, and a hold at 248 °C counts in full.
* The cooling limit in the threshold block is the course's 1-4 °C/s band. The J-STD-020 6 °C/s ramp-down ceiling is carried as its own line — quote the one your procedure names.
* A profile is judged on the worst measured point, not the mean of the thermocouples. A single average can sit inside the window while the hot corner is outside it.

## What the worked example shows

The example variant is filled with Board X numbers from case cx-m06-01. It is there to show the shape of a complete record, not to be copied: Board X is a fictional product and its limits are the course's.

## Reference

IPC-7530 (profiling), J-STD-020 (classification temperatures). Taught in lesson m06l07.

---

Training template. Adapt to your quality system.

Version v1, 2026-10-31.
