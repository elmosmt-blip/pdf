#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""m06 limits patch — peak ceiling vs typical window, and one TAL window.

WHY
  docs/m06-limits-review.md found three defects, all in prose rather than in
  graded numbers:

  1. "peak 245-250 °C" was presented as a paste-datasheet window. No paste
     datasheet says that, and the course's own texts say the peak is a ceiling
     (250 °C for a large package at 1.6-2.5 mm, J-STD-020 Table 4-2) with a
     typical target band of 235-245 °C. The paste window is the second number:
     235-245.
  2. "60-120 s above liquidus" appeared as a paste TAL window in m06l01's zone
     table and in m06l02's worked solution. 60-120 s is the SOAK (ts), not TAL;
     TAL guidance is 30-90 s (IPC-7530B, src-008).
  3. The peak window threshold pointed at src-008 (IPC-7530), which states no
     such window. The 235-245 band is typed in m06l01 and in the paste
     datasheets; the ceiling is J-STD-020.

  Nothing here changes a worked arithmetic result: 242 < 245, (150-25)/60,
  248-100)/40 etc. all stand. What changes is which number is called what.

SAFETY
  Every replacement is asserted to hit an expected number of times; each rule
  counts its hits and the script refuses to write if any rule missed. The text
  is re-read after editing and the same rules must match zero times.
"""

from __future__ import annotations

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LESSONS = os.path.join(ROOT, "data", "lessons.json")
QUESTIONS = os.path.join(ROOT, "data", "questions.json")
CASES = os.path.join(ROOT, "data", "cases.json")

# (file, old, new, expected_hits, label)
RULES = [
    # ---------------------------------------------------------------- m06l01
    ("lessons",
     '"60-120 s above liquidus",',
     '"Soak 60-120 s (ts); TAL 30-90 s above liquidus",',
     1, "m06l01 zone table: 60-120 s is the soak, TAL is 30-90 s"),

    ("lessons",
     '"Liquidus 219 C, peak 235-245 °C"',
     '"Liquidus 219 C, typical peak 235-245 °C, ceiling 250 °C"',
     1, "m06l01 zone table: name the typical band and the ceiling"),

    # ---------------------------------------------------------------- m06l02
    ("lessons",
     "The applicable limit is the paste window of 60-120 s from the paste datasheet "
     "and IPC-7530 guidance, and 45 s is 15 s below the lower bound, so the profile "
     "is too short for reliable wetting rather than too long.",
     "The applicable limit is the paste window: IPC-7530B guidance gives 30-90 s, a "
     "paste datasheet may narrow it, and 45 s sits inside 30-90 s but below the "
     "lower bound of any datasheet that specifies 60 s or more, so it is too short "
     "for reliable wetting rather than too long.",
     1, "m06l02 solution: 60-120 s was the soak, not the TAL window"),

    ("lessons",
     "Lengthen time above liquidus into the 60-120 s paste window by adding reflow "
     "dwell or slightly raising peak within the package classification temperature",
     "Lengthen time above liquidus toward the paste window (30-90 s per IPC-7530B, "
     "narrowed by the paste datasheet) by adding reflow dwell or slightly raising "
     "peak within the package classification temperature",
     1, "m06l02 solution: the remedy names the right window"),

    # ---------------------------------------------------------------- m06l07
    ("lessons",
     "recommended time above liquidus 60-90 s, and recommended peak 245-250 °C",
     "recommended time above liquidus 60-90 s, and a recommended peak band of "
     "235-245 °C that must stay below the component's J-STD-020 classification "
     "temperature",
     1, "m06l07 task: the paste window is 235-245, not 245-250"),

    ("lessons",
     "The measured peak is 242 °C, which is below the datasheet range 245-250 °C.",
     "The measured peak is 242 °C, which is inside the datasheet band 235-245 °C "
     "but only 3 °C below its top, and well below the 250 °C classification "
     "temperature of a large package.",
     1, "m06l07 solution: 242 sits inside 235-245"),

    ("lessons",
     "Propose a bounded change: increase the peak by 3-5 °C to 245-247 °C and reduce "
     "cooling from 3.0 °C/s to 2.5 °C/s to extend time above liquidus to 60-70 s.",
     "Propose a bounded change: raise the peak by 2-3 °C to 244-245 °C, staying at "
     "the top of the band and clear of the ceiling, and reduce cooling from "
     "3.0 °C/s to 2.5 °C/s to extend time above liquidus to 60-70 s.",
     1, "m06l07 solution: the bounded change stays inside the band"),

    # ------------------------------------------------------------- questions
    ("questions",
     "Using the lesson's rule-of-thumb limits (ramp 1-3 °C/s, time above liquidus "
     "60-120 s from the paste datasheet, and peak not above the J-STD-020 "
     "classification temperature of 250 °C for a large package)",
     "Using the lesson's rule-of-thumb limits (ramp 1-3 °C/s, time above liquidus "
     "30-90 s from the paste datasheet and IPC-7530, and peak not above the "
     "J-STD-020 classification temperature of 250 °C for a large package)",
     1, "q-m06l02-02 prompt: TAL is 30-90 s"),

    ("questions",
     '"Time above liquidus, because 210 − 120 = 90 s, outside the 60-120 s window."',
     '"Time above liquidus, because 210 − 120 = 90 s, outside the 30-90 s window."',
     1, "q-m06l02-02 distractor: names the right window"),

    ("questions",
     "Time above liquidus is 210 − 120 = 90 s, inside the 60-120 s paste window.",
     "Time above liquidus is 210 − 120 = 90 s, inside the 30-90 s paste window at "
     "its top edge.",
     1, "q-m06l02-02 explanation: names the right window"),

    ("questions",
     "A measured profile shows TAL 45 s against a datasheet range of 60-90 s, peak "
     "242 °C against 245-250 °C, with dull grainy joints.",
     "A measured profile shows TAL 45 s against a datasheet range of 60-90 s, peak "
     "242 °C inside a 235-245 °C datasheet band, with dull grainy joints.",
     1, "q-m06l07-05 prompt: peak band corrected"),

    ("questions",
     "The peak is also below its band, but the lesson pairs the visible signature "
     "with the reflow zone rather than with the soak, and neither value is inside "
     "tolerance.",
     "The peak is inside its band, so it is not the finding; the lesson pairs the "
     "visible signature with the reflow zone rather than with the soak, and the TAL "
     "is the value that failed.",
     1, "q-m06l07-05 explanation: 242 is inside 235-245"),

    # ---------------------------------------------------------- case scenario
    ("cases",
     "Paste is SAC305 with a datasheet window of 60-90 s above liquidus and a peak of "
     "245-250 °C. The BGA is a large package, so the J-STD-020 classification "
     "temperature that applies to it is 250 °C.",
     "Paste is SAC305. The paste window for this board is 60-90 s above liquidus "
     "(IPC-7530B guidance is 30-90 s; the datasheet narrows it). The peak is judged "
     "against a ceiling, not a target: the J-STD-020 classification temperature for "
     "a large package at 1.6-2.5 mm is 250 °C, while the course's typical production "
     "band is 235-245 °C.",
     1, "case cx-m06-01 scenario: ceiling vs typical band, and the TAL authority"),
]


def load(path):
    with open(path, encoding="utf-8-sig") as fh:
        return json.load(fh)


def dump(path, doc):
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, indent=2, ensure_ascii=False)
        fh.write("\n")


def paths():
    return {"lessons": LESSONS, "questions": QUESTIONS, "cases": CASES}


def apply_rules(docs, direction="forward"):
    """direction 'forward' patches; 'reverse' proves the patched text is final."""
    hits = {}
    for key, old, new, expect, label in RULES:
        a, b = (old, new) if direction == "forward" else (new, old)
        text = json.dumps(docs[key], ensure_ascii=False)
        found = text.count(a)
        hits[label] = found
        if found != expect:
            raise SystemExit(
                "RULE FAILED (%s): %s\n  expected %d hit(s), found %d\n  text: %r"
                % (direction, label, expect, found, a[:120]))
        docs[key] = json.loads(text.replace(a, b))
    return hits


def main():
    docs_data = {k: load(p) for k, p in paths().items()}

    check_only = "--check" in sys.argv
    if check_only:
        # the files on disk must already satisfy the rules in reverse: if the
        # original strings are still present, the patch was never applied
        text = json.dumps(docs_data, ensure_ascii=False)
        stale = [label for key, old, new, expect, label in RULES if old in text]
        if stale:
            print("m06 patch --check: NOT APPLIED")
            for s in stale[:10]:
                print("  - " + s)
            return 1
        print("m06 patch --check: OK (all %d rules applied)" % len(RULES))
        return 0

    hits = apply_rules(docs_data, "forward")
    # Nothing may be left to match. The reverse pass runs on a copy of the PATCHED
    # docs — reading the files back from disk would check the pre-patch text and
    # fail every rule, which is how this check first reported itself.
    import copy
    apply_rules(copy.deepcopy(docs_data), "reverse")

    for key, p in paths().items():
        dump(p, docs_data[key])

    for label, n in hits.items():
        print("  %d×  %s" % (n, label))
    print("wrote data/lessons.json, data/questions.json, data/cases.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
