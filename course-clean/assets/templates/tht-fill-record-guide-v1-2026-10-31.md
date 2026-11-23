# Through-hole fill record

v1 · 2026-10-31 · serves cx-m08-01

## What it is for

Record the barrel fill on every through-hole joint, compute it against the board thickness, and disposition it against the class that applies — without letting the thermal-plane exception become the rule.

## Why it looks like this

The m08 case is one joint at 68.75 % on a joint that earns no exception, while two neighbours at 78 % and 81 % pass. A sheet that records "looks full" cannot tell those three apart.

## How to fill it in

1. Read the **THRESHOLDS** block first. Those are the limits this sheet judges against; if your quality system specifies different ones, change them there and nowhere else.
2. Enter your numbers in the white cells only. The grey cells are formulas and are locked — that is deliberate, so a filled sheet can be checked against the arithmetic rather than trusted.
3. A limit with no source id is a course or control-plan value, not a published requirement. Say so when you quote it.
4. Nothing on the sheet is protected by a password: Review > Unprotect Sheet if you need to change its structure.

## What the worked example shows

The example variant is filled with Board X numbers from case cx-m08-01. It is there to show the shape of a complete record, not to be copied: Board X is a fictional product and its limits are the course's.

## Reference

IPC-A-610 (vertical barrel fill, and the inner-layer exception). Taught in lesson m08l05.

---

Training template. Adapt to your quality system.

Version v1, 2026-10-31.
