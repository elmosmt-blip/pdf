# MSL exposure log

v1 · 2026-10-31 · serves cx-m02-01

## What it is for

Track the clock on every moisture-sensitive reel: floor life, what has been counted against it, what is left, and what the bake decision is.

## Why it looks like this

The m02 case is a reel that is 2 h short of its budget after a cabinet that was outside its own requirement. The log has to show why the cabinet hours counted.

## How to fill it in

1. Read the **THRESHOLDS** block first. Those are the limits this sheet judges against; if your quality system specifies different ones, change them there and nowhere else.
2. Enter your numbers in the white cells only. The grey cells are formulas and are locked — that is deliberate, so a filled sheet can be checked against the arithmetic rather than trusted.
3. A limit with no source id is a course or control-plan value, not a published requirement. Say so when you quote it.
4. Nothing on the sheet is protected by a password: Review > Unprotect Sheet if you need to change its structure.

## Traps this record is built around

* The cabinet only pauses the clock when its logged RH is at or below the requirement in the threshold block. 7 % in a 5 % cabinet counts every hour.
* `Counted against floor life` is bag-open time when the cabinet did not qualify, and line exposure alone when it did. Check that distinction before you quote a remaining figure.
* A level with no floor life in the threshold block leaves the decision blank on purpose. Add the level and its floor life to the block rather than typing a number into the row.
* A 40 °C tape-and-reel bake is not interchangeable with a tray bake: the ceiling is there to protect the carrier, not the part.

## What the worked example shows

The example variant is filled with Board X numbers from case cx-m02-01. It is there to show the shape of a complete record, not to be copied: Board X is a fictional product and its limits are the course's.

## Reference

J-STD-033 (floor life, dry storage, bake). Taught in lesson m02l04.

---

Training template. Adapt to your quality system.

Version v1, 2026-10-31.
