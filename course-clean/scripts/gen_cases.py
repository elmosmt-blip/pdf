#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_cases.py — Phase 3. Case data, Board X, and every answer key.

WHY THIS SCRIPT EXISTS
  The brief forbids hand-typed keys: "все числа кейсов и ключи генерируются
  скриптом и проверяются тестами". So this file is the single place where a
  case answer is *computed*. data/cases.json carries the computed value and
  docs/case-keys.csv carries the formula that produced it, so a reviewer can
  re-derive any key by hand.

  Comparison is done by tests/cases.test.js, which recomputes every numeric key
  from the inputs with its own arithmetic instead of importing this file. Two
  independent implementations that agree are evidence; one implementation
  checked against itself is not.

BOARD X
  One fictional product runs through the whole course. Its facts live in
  BOARD_FACTS and are emitted into data/cases.json under "board", so a case can
  never quietly use a different board thickness than its neighbour.

USAGE
  python3 scripts/gen_cases.py            # write data/cases.json + keys CSV
  python3 scripts/gen_cases.py --check    # recompute and compare to the file
  python3 scripts/gen_cases.py --keys     # print the keys table only
"""

from __future__ import annotations

import argparse
import json
import math
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CASES_PATH = os.path.join(ROOT, "data", "cases.json")
KEYS_PATH = os.path.join(ROOT, "docs", "case-keys.csv")
CHECKED_ON = "2026-10-31"

# --------------------------------------------------------------------------
# Board X — the fictional product. Every number below is used by at least one
# case, and the cases never restate them.
# --------------------------------------------------------------------------
BOARD_FACTS = {
    "boardThicknessMm": 1.6,
    "layers": 6,
    "surfaceFinish": "ENIG",
    "baseMaterial": "FR-4, Tg 170",
    "stencilThicknessMm": 0.125,
    "finePitchStencilThicknessMm": 0.100,
    "paste": "SAC305, Type 4, no-clean",
    "qfpPitchMm": 0.5,
    "qfpPins": 64,
    "finePitchPpm": 0.4,
    "bgaBallPitchMm": 0.8,
    "bgaBalls": 256,
    "passive": "0402",
    "thtConnector": "20-pin, 2.54 mm pitch, 0.8 mm finished hole, 0.5 mm lead",
    "lotSize": 1240,
    "opportunitiesPerBoard": 620,
    "reflowAlloy": "SAC305",
    "liquidusC": 219,
    "solidusC": 217,
}

# Human labels for the Board Facts. They live beside the facts so the page never
# has to invent a name for a key it was not told about.
BOARD_FACT_LABELS = {
    "boardThicknessMm": "Board thickness (mm)",
    "layers": "Layers",
    "surfaceFinish": "Surface finish",
    "baseMaterial": "Base material",
    "stencilThicknessMm": "Stencil (mm)",
    "finePitchStencilThicknessMm": "Stencil, fine-pitch region (mm)",
    "paste": "Solder paste",
    "qfpPitchMm": "QFP-64 pitch (mm)",
    "qfpPins": "QFP-64 pins",
    "finePitchPpm": "QFP-48 pitch (mm)",
    "bgaBallPitchMm": "BGA ball pitch (mm)",
    "bgaBalls": "BGA balls",
    "passive": "Smallest passive",
    "thtConnector": "THT connector",
    "lotSize": "Lot size (boards)",
    "opportunitiesPerBoard": "Solder joints per board",
    "reflowAlloy": "Alloy",
    "liquidusC": "Liquidus (°C)",
    "solidusC": "Solidus (°C)",
    "talWindowS": "Time above liquidus (s)",
    "pastePeakWindowC": "Peak window, paste (°C)",
    "typicalPeakBandC": "Typical production peak (°C)",
    "peakClassificationLargeC": "Peak ceiling, large package (°C)",
    "holeFillMinPct": "Minimum barrel fill, IPC-A-610 (%)",
    "holeFillExceptionPct": "Thermal-plane exception fill (%)",
    "holeFillExceptionLeads": "Leads before the exception applies",
    "thtHoleNominalMm": "THT hole, finished (mm)",
    "thtHoleToleranceMm": "THT hole tolerance (± mm)",
    "waveContactWindowS": "Wave contact time (s)",
    "bgaVoidMaxPct": "Void limit per BGA ball (%)",
    "conductorReductionPct": "Conductor width reduction by class (%)",
    "annularRingMinMm": "Annular ring, Class 3 external (mm)",
    "handSetpointWindowC": "Hand-soldering setpoint (°C)",
    "bowTwistSmtPct": "Bow and twist, SMT board, IPC-6012 (%)",
    "bowTwistOtherPct": "Bow and twist, other boards, IPC-6012 (%)",
}

BOARD = {
    "id": "board-x",
    "name": "Board X",
    "note": "Fictional product used by every case in this course. The numbers are "
            "consistent across modules; nothing here describes a real customer board.",
    "description": "6-layer 1.6 mm FR-4 controller board: QFP-64 at 0.5 mm pitch, "
                   "QFP-48 at 0.4 mm pitch, one 256-ball BGA at 0.8 mm, 0402 passives, "
                   "and one 20-pin THT connector.",
    "facts": BOARD_FACTS,
    "labels": BOARD_FACT_LABELS,
}

# The Board X through-line. One row per module that carries a case; the module
# page draws it as a strip so the learner can see where the case sits in the
# product's life. The label is what the page shows, the case is what it links to.
BOARD_THREAD = [
    {"step": 1, "moduleId": "m01", "label": "Incoming release", "asset": "Incoming release record",
     "caseId": "cx-m01-01"},
    {"step": 2, "moduleId": "m02", "label": "MSL log", "asset": "MSL exposure log",
     "caseId": "cx-m02-01"},
    {"step": 3, "moduleId": "m03", "label": "Stencil", "asset": "Stencil data sheet",
     "caseId": "cx-m03-01"},
    {"step": 4, "moduleId": "m06", "label": "Reflow profile", "asset": "Reflow profile log",
     "caseId": "cx-m06-01"},
    {"step": 5, "moduleId": "m08", "label": "Through-hole", "asset": "Hole and lead measurement sheet",
     "caseId": "cx-m08-01"},
    {"step": 6, "moduleId": "m09", "label": "Wave", "asset": "Wave solder process record",
     "caseId": "cx-m09-01"},
    {"step": 7, "moduleId": "m07", "label": "AOI audit", "asset": "AOI and X-ray audit",
     "caseId": "cx-m07-01"},
    {"step": 8, "moduleId": "m11", "label": "Rework", "asset": "Rework and repair record",
     "caseId": "cx-m11-01"},
    {"step": 9, "moduleId": "m14", "label": "8D report", "asset": "8D problem report",
     "caseId": "cx-m14-01"},
]

# Thresholds used by the cases. Each one is taken from the course text or from a
# cited source — never invented here. check-cases.js verifies the citation.
AREA_RATIO_MIN = 0.66      # m03l02, m03l05, m04l01 (IPC-7525 guidance)
ASPECT_RATIO_MIN = 1.5     # m03l05 (IPC-7525 guidance)
TAPE_BAKE_MAX_C = 40       # m02l04 (J-STD-033 tape-and-reel limit)
DRY_CABINET_MAX_RH = 5     # m02l04 (J-STD-033 dry storage)
JSTD020_LARGE_PACKAGE_C = 250   # m06l02/l05 — classification temperature, large package
# Through-hole vertical fill. IPC-A-610 sets 75 % for Class 2 AND Class 3 (m08l05);
# the 50 % / 1.2 mm figure is a documented exception for parts with 14 or more leads
# tied into internal thermal planes, NOT a Class 2 relaxation. Sources re-checked
# 2026-11-31: pcbsync.com/ipc-a-610-guide, wevolver.com IPC-A-610 overview.
HOLE_FILL_MIN_PCT = 75          # src-016, m08l05
HOLE_FILL_EXCEPTION_PCT = 50     # src-016, m08l05 — thermal-plane exception
HOLE_FILL_EXCEPTION_LEADS = 14   # src-016, m08l05 — "fourteen or more leads"
# Inspection and rework limits, re-checked 2026-11-31 against three independent
# summaries because these numbers are widely misquoted: a BGA ball is a defect
# when the cumulative projected void area exceeds 25 % of the ball area (and the
# limit is per ball, never averaged over the array); a conductor may not lose
# more than 20 % of its width at Class 2 or 10 % at Class 3; a Class 3 external
# annular ring is 0.050 mm minimum.
BGA_VOID_MAX_PCT = 25           # src-007 / src-001, m07l04
CONDUCTOR_REDUCTION_PCT = {1: 30, 2: 20, 3: 10}   # src-022, m11l04
ANNULAR_RING_MIN_MM = 0.050     # src-022, m11l04
# The course's own hand-soldering setpoint band (m11l02). Published sources
# differ here — IPC-7711 procedures start near 315 °C and say "change as
# necessary", vendor tables quote 315-400 °C for lead-free — so the case uses
# the course band and prints the caveat instead of inventing a tighter one.
HAND_SETPOINT_MIN_C = 330       # None source: course text, m11l02
HAND_SETPOINT_MAX_C = 360
# Wave solder contact time the course teaches (m09l07): 2-4 s for many boards.
WAVE_CONTACT_MIN_S = 2.0         # None source: course text, m09l07
WAVE_CONTACT_MAX_S = 4.0
# The typical production band, not a window and not a ceiling: m06l01's zone table
# and SAC305 paste datasheets put the optimum at 235-245 °C, about 15-25 °C above
# the 219 °C liquidus.
TYPICAL_PEAK_MIN_C = 235
TYPICAL_PEAK_MAX_C = 245
# The paste window a case is judged against. A paste datasheet may narrow IPC-7530B
# guidance (30-90 s, m06l05); Board X's paste states 60-90 s (m06l07).
PASTE_PEAK_MIN_C = 235
PASTE_PEAK_MAX_C = 245
TAL_MIN_S = 60             # m06l07 paste datasheet window 60-90 s
TAL_MAX_S = 90
SOAK_TIME_S = (60, 120)    # m06l02 paste window

# The peak window a case is judged against is the paste-table window, and it is
# derived, not restated: the lower bound comes from the lesson table, the upper
# bound is the package ceiling. Board Facts carry the margin to the classification
# temperature, so the two never drift apart.
PEAK_WINDOW_C = (PASTE_PEAK_MIN_C, PASTE_PEAK_MAX_C)

# The windows the cases are judged against join the Board Facts, so the case page
# can print them without the engine holding a private copy of any threshold.
BOARD_FACTS["talWindowS"] = [TAL_MIN_S, TAL_MAX_S]
BOARD_FACTS["pastePeakWindowC"] = [PASTE_PEAK_MIN_C, PASTE_PEAK_MAX_C]
BOARD_FACTS["typicalPeakBandC"] = [TYPICAL_PEAK_MIN_C, TYPICAL_PEAK_MAX_C]
BOARD_FACTS["peakClassificationLargeC"] = JSTD020_LARGE_PACKAGE_C
BOARD_FACTS["holeFillMinPct"] = HOLE_FILL_MIN_PCT
BOARD_FACTS["holeFillExceptionPct"] = HOLE_FILL_EXCEPTION_PCT
BOARD_FACTS["holeFillExceptionLeads"] = HOLE_FILL_EXCEPTION_LEADS
BOARD_FACTS["thtHoleNominalMm"] = 1.00
BOARD_FACTS["thtHoleToleranceMm"] = 0.05
BOARD_FACTS["waveContactWindowS"] = [WAVE_CONTACT_MIN_S, WAVE_CONTACT_MAX_S]
BOARD_FACTS["bgaVoidMaxPct"] = BGA_VOID_MAX_PCT
# JSON object keys are strings; storing the class numbers as ints here made the
# written file differ from a fresh build, which --check reported as a failure on
# every key. The classes are strings in the document, ints in the table above.
BOARD_FACTS["conductorReductionPct"] = {str(k): v for k, v in CONDUCTOR_REDUCTION_PCT.items()}
BOARD_FACTS["annularRingMinMm"] = ANNULAR_RING_MIN_MM
BOARD_FACTS["handSetpointWindowC"] = [HAND_SETPOINT_MIN_C, HAND_SETPOINT_MAX_C]
# Bow and twist, IPC-6012 (3.4.3, measured per IPC-TM-650 method 2.4.22): 0.75 %
# for a board that carries surface-mount parts, 1.5 % for anything else. The
# percentage is of the direction being measured — for twist the denominator is
# the diagonal and the measured gap is divided by twice the diagonal, which is
# the single most misread number in this standard.
BOW_TWIST_SMT_PCT = 0.75
BOW_TWIST_OTHER_PCT = 1.5
BOARD_FACTS["bowTwistSmtPct"] = BOW_TWIST_SMT_PCT
BOARD_FACTS["bowTwistOtherPct"] = BOW_TWIST_OTHER_PCT


# --------------------------------------------------------------------------
# Formulae — each returns (value, unit, formula, inputs) so the key CSV can
# show the arithmetic rather than a naked number.
# --------------------------------------------------------------------------
def area_ratio_rect(l_mm: float, w_mm: float, t_mm: float):
    """Rectangular aperture area ratio: (L*W) / (2*(L+W)*T)."""
    value = (l_mm * w_mm) / (2.0 * (l_mm + w_mm) * t_mm)
    return (value, "dimensionless",
            "(%g*%g)/(2*(%g+%g)*%g)" % (l_mm, w_mm, l_mm, w_mm, t_mm),
            {"l_mm": l_mm, "w_mm": w_mm, "t_mm": t_mm})


def area_ratio_round(d_mm: float, t_mm: float):
    """Round aperture area ratio: D / (4*T)."""
    value = d_mm / (4.0 * t_mm)
    return (value, "dimensionless", "%g/(4*%g)" % (d_mm, t_mm),
            {"d_mm": d_mm, "t_mm": t_mm})


def aspect_ratio(w_mm: float, t_mm: float):
    """Aspect ratio: smallest aperture dimension / foil thickness."""
    value = w_mm / t_mm
    return (value, "dimensionless", "%g/%g" % (w_mm, t_mm),
            {"w_mm": w_mm, "t_mm": t_mm})


def dpmo(defects: int, boards: int, opportunities: int):
    """DPMO = defects / (boards * opportunities) * 1e6."""
    value = defects / (boards * opportunities) * 1e6
    return (value, "DPMO",
            "%d/(%d*%d)*1e6" % (defects, boards, opportunities),
            {"defects": defects, "boards": boards, "opportunities": opportunities})


def ppm(defects: int, boards: int):
    """Defect rate in ppm."""
    value = defects / boards * 1e6
    return (value, "ppm", "%d/%d*1e6" % (defects, boards),
            {"defects": defects, "boards": boards})


def reduction_pct(before: float, after: float):
    """Relative reduction between two rates, in percent."""
    value = (before - after) / before * 100.0
    return (value, "%", "(%g-%g)/%g*100" % (before, after, before),
            {"before": before, "after": after})


def pct(part: float, whole: float):
    value = part / whole * 100.0
    return (value, "%", "%g/%g*100" % (part, whole),
            {"part": part, "whole": whole})


def floor_life_remaining(floor_life_h: float, exposure_h: float):
    value = floor_life_h - exposure_h
    return (value, "h", "%g-%g" % (floor_life_h, exposure_h),
            {"floor_life_h": floor_life_h, "exposure_h": exposure_h})


def ramp_rate(t1_c: float, t2_c: float, seconds: float):
    value = (t2_c - t1_c) / seconds
    return (value, "°C/s", "(%g-%g)/%g" % (t2_c, t1_c, seconds),
            {"t1_c": t1_c, "t2_c": t2_c, "seconds": seconds})


def spread(peaks):
    """Peak-to-peak spread across the board's thermocouples."""
    if len(peaks) < 2:
        raise ValueError("a spread needs at least two thermocouples")
    return (max(peaks) - min(peaks), "°C", "max(tc)-min(tc)", {"tc_peaks": peaks})


def margin(limit: float, measured: float):
    value = limit - measured
    return (value, "°C", "%g-%g" % (limit, measured),
            {"limit": limit, "measured": measured})


def expected_ramp(power_w: float, thermal_mass_j_per_k: float):
    value = power_w / thermal_mass_j_per_k
    return (value, "°C/s", "%g/%g" % (power_w, thermal_mass_j_per_k),
            {"power_w": power_w, "thermal_mass_j_per_k": thermal_mass_j_per_k})


def clearance(hole_d_mm: float, lead_d_mm: float):
    """Diametral clearance: finished hole minus lead, in mm."""
    value = hole_d_mm - lead_d_mm
    return (value, "mm", "%g-%g" % (hole_d_mm, lead_d_mm),
            {"hole_d_mm": hole_d_mm, "lead_d_mm": lead_d_mm})


def cylinder_volume_mm3(d_mm: float, h_mm: float):
    """Volume of a cylinder in mm^3 — a hole, or a lead inside it."""
    value = math.pi * (d_mm / 2.0) ** 2 * h_mm
    return (value, "mm3", "pi*(%g/2)^2*%g" % (d_mm, h_mm),
            {"d_mm": d_mm, "h_mm": h_mm})


def annular_volume_mm3(hole_d_mm: float, lead_d_mm: float, h_mm: float):
    """Solder-filled annulus between barrel and lead, in mm^3."""
    value = math.pi * ((hole_d_mm / 2.0) ** 2 - (lead_d_mm / 2.0) ** 2) * h_mm
    return (value, "mm3", "pi*((%g/2)^2-(%g/2)^2)*%g" % (hole_d_mm, lead_d_mm, h_mm),
            {"hole_d_mm": hole_d_mm, "lead_d_mm": lead_d_mm, "h_mm": h_mm})


def share_of(part: float, whole: float):
    """A part as a percentage of the whole."""
    value = part / whole * 100.0
    return (value, "%", "%g/%g*100" % (part, whole), {"part": part, "whole": whole})


def twist_pct(gap_mm: float, diagonal_mm: float):
    """Twist by the IPC-TM-650 2.4.22 production method: the gap under the raised
    corner over twice the diagonal. The factor of two is part of the method —
    dropping it doubles the answer and turns a passing board into scrap."""
    value = gap_mm / (2.0 * diagonal_mm) * 100.0
    return (value, "%", "gap/(2*diagonal)*100",
            {"gap_mm": gap_mm, "diagonal_mm": diagonal_mm})


def iso_sample(lot_size: int, code: str, n: int, ac: int, re_: int):
    """ISO 2859-1, general inspection level II, AQL 1.0 — table lookup, not
    arithmetic. Returned as a numeric step (n) plus a choice step (the code)."""
    return (n, "pieces", "ISO 2859-1 level II, AQL 1.0, lot %d -> code %s: n=%d, Ac=%d, Re=%d"
            % (lot_size, code, n, ac, re_),
            {"lot_size": lot_size, "code": code, "n": n, "ac": ac, "re": re_})


# --------------------------------------------------------------------------
# Case definitions. Values are computed here; the JSON only ever receives the
# result of a computation performed above in this file.
# --------------------------------------------------------------------------
def step_numeric(sid, prompt, computed, tolerance, hints, ok, bad, explanation,
                 display=None):
    value, unit, formula, inputs = computed
    return {
        "id": sid,
        "type": "numeric",
        "prompt": prompt,
        "answer": {
            "value": round(value, 4) if display is None else round(value, 4),
            "tolerance": tolerance,
            "unit": unit,
        },
        "hints": hints,
        "feedbackCorrect": ok,
        "feedbackWrong": bad,
        "explanation": explanation,
        "_key": {"formula": formula, "inputs": inputs, "raw": value},
    }


def step_choice(sid, prompt, options, correct_id, hints, ok, bad, explanation):
    return {
        "id": sid,
        "type": "choice",
        "prompt": prompt,
        "options": [{"id": oid, "text": text} for oid, text in options],
        "answer": {"value": correct_id},
        "hints": hints,
        "feedbackCorrect": ok,
        "feedbackWrong": bad,
        "explanation": explanation,
        "_key": {"formula": "choice key = " + correct_id, "inputs": {}, "raw": correct_id},
    }


# --------------------------------------------------------------------------
# Templates. A template is shipped in three variants — blank, example, guide —
# because a tool the learner cannot fill in is a picture, not a tool. The blank
# variant is derived from the case's own data file (header row only), the example
# is the data file filled in, and the guide is generated from the step and rubric
# text. No number here is typed by hand.
# --------------------------------------------------------------------------
TEMPLATE_DEFS = {
    "incoming-release": {
        "name": "Incoming release record",
        "kind": "csv",
        "sourceFile": "board-lot.csv",
        "lesson": "m01l07",
        "use": "Record the lot as received, the plan it was judged against, the "
               "measurement with its method, and what closed the hold — so a release "
               "can be defended when the product class or the standard moves.",
        "rowNoun": "lot or carton",
    },
    "stencil-sheet": {
        "name": "Stencil data sheet",
        "kind": "csv",
        "sourceFile": "aperture-table.csv",
        "lesson": "m03l05",
        "use": "Record every aperture, its foil thickness and its area ratio before the "
               "stencil is ordered.",
        "rowNoun": "aperture",
    },
    "msl-log": {
        "name": "MSL exposure log",
        "kind": "csv",
        "sourceFile": "msl-log.csv",
        "lesson": "m02l04",
        "use": "Track bag-open time, cabinet humidity and line exposure against each "
               "package's floor life.",
        "rowNoun": "reel",
    },
    "reflow-log": {
        "name": "Reflow profile log",
        "kind": "csv",
        "sourceFile": "profile.csv",
        "lesson": "m06l07",
        "use": "Record the measured interval, its rate and where each thermocouple sat "
               "before a profile is released.",
        "rowNoun": "interval or thermocouple",
    },
    "tht-measure": {
        "name": "Hole and lead measurement sheet",
        "kind": "csv",
        "sourceFile": "tht-joints.csv",
        "lesson": "m08l05",
        "use": "Record finished hole, measured lead diameter and fill percentage for every "
               "through-hole part before the first article is signed off.",
        "rowNoun": "through-hole joint",
    },
    "wave-record": {
        "name": "Wave solder process record",
        "kind": "csv",
        "sourceFile": "wave-run.csv",
        "lesson": "m09l07",
        "use": "Log flux, preheat, wave height, conveyor speed and pot temperature for the "
               "run, so a later defect can be traced to a setting instead of a memory.",
        "rowNoun": "run or setting",
    },
    "aoi-audit": {
        "name": "AOI and X-ray audit log",
        "kind": "csv",
        "sourceFile": "aoi-audit.csv",
        "lesson": "m07l03",
        "use": "Record calls, verified calls, true defects, false calls and escapes for one "
               "window, so the three rates are computed from one consistent denominator.",
        "rowNoun": "audit window",
    },
    "xray-void": {
        "name": "X-ray void record",
        "kind": "csv",
        "sourceFile": "xray-bga.csv",
        "lesson": "m07l04",
        "use": "Record measured ball and void diameters per ball so the void percentage is a "
               "calculation, not an impression from a greyscale image.",
        "rowNoun": "ball",
    },
    "rework-record": {
        "name": "Rework and repair record",
        "kind": "csv",
        "sourceFile": "rework-record.csv",
        "lesson": "m11l05",
        "use": "Log setpoint, tip, preheat, dwell, number of contacts and the measured result "
               "against the class limit, so a repair can be defended a year later.",
        "rowNoun": "rework operation",
    },
    "pareto": {
        "name": "Defect Pareto",
        "kind": "csv",
        "sourceFile": "defect-log.csv",
        "lesson": "m14l01",
        "use": "Rank defect families by count so the largest loss gets the first action, "
               "and keep the ranking next to the 8D it justified.",
    },
    "8d": {
        "name": "8D problem report",
        "kind": "csv",
        "lesson": "m14l05",
        "use": "Carry a defect from containment through root cause to a verified action "
               "and a closed-out escape check.",
        "rowNoun": "8D report",
        # An 8D is not a reshaped defect log, so its columns are its own. The
        # example row is not typed either: each cell names a step of this case and
        # is filled with that step's verified answer.
        "columns": ["d", "title", "content", "evidence", "owner", "status"],
        "exampleFromSteps": [
            ("D2", "Describe the problem", "step:s1", "AOI/BGA void family, Board X lot"),
            ("D4", "Root cause verified", "step:s1", "false-call audit"),
            ("D6", "Action implemented and measured", "step:s7", "before-window count"),
            ("D7", "Action verified in a second window", "step:s8", "after-window count"),
            ("D8", "Effectiveness against the target", "step:s10", "agreed metric"),
        ],
    },
}


def _csv_header(text):
    """First line of a CSV, with the BOM and line ending removed."""
    first = text.splitlines()[0] if text else ""
    return first.lstrip("\ufeff")


def _csv_rows(text):
    lines = [ln for ln in text.splitlines() if ln.strip()]
    return lines[0].lstrip("\ufeff"), lines[1:]


def csv_quote(cell):
    """Quote a cell only when it has to be quoted, so the files stay readable."""
    s = str(cell)
    return '"' + s.replace('"', '""') + '"' if any(ch in s for ch in ',"\r\n') else s


def _plain(v):
    """A number as a person writes it: 16000, not 16000.0; 49.4277, not 49.427700."""
    if isinstance(v, float):
        if v == int(v):
            return str(int(v))
        return ("%.4f" % v).rstrip("0").rstrip(".")
    return str(v)


def answer_text(step):
    """The human-readable answer of a step, for filling in an example row."""
    if step["type"] == "numeric":
        unit = step["answer"].get("unit", "")
        return _plain(step["answer"]["value"]) + ("" if unit in ("", "dimensionless") else " " + unit)
    opts = step.get("options", [])
    chosen = [o["text"] for o in opts if o["id"] == step["answer"]["value"]]
    return chosen[0] if chosen else str(step["answer"]["value"])


def example_from_steps(tdef, c):
    """Build the example from the case's verified answers, not from prose.

    Each cell that names "step:<id>" is filled with that step's answer, so the
    example cannot disagree with the key the case grades against.
    """
    by_id = {st["id"]: st for st in c["steps"]}
    header = ",".join(tdef["columns"])
    rows = [header]
    for letter, title, ref, evidence in tdef["exampleFromSteps"]:
        if not ref.startswith("step:"):
            raise ValueError("example cell must cite a step: " + ref)
        sid = ref[5:]
        if sid not in by_id:
            raise ValueError("template %s cites missing step %s" % (tdef["name"], sid))
        rows.append(",".join(csv_quote(x) for x in
                             [letter, title, answer_text(by_id[sid]), evidence,
                              "process engineer", "open"]))
    return "\r\n".join(rows) + "\r\n"


def template_variants(tid, tdef, c, base_name=None):
    """Blank, example and guide for one template — all derived from case data."""
    name = tdef["name"]
    derived = base_name is not None
    header = _csv_header(base_name) if derived else ",".join(tdef["columns"])
    example = base_name.replace("\ufeff", "") if derived else example_from_steps(tdef, c)
    usage = tdef["use"]
    noun = tdef.get("rowNoun", "item")

    guide = [
        "# " + name,
        "",
        "## What this template is for",
        usage,
        "",
        "## How to fill it in",
        "1. Copy one row per " + noun + ". Do not merge rows: one aperture, one reel, "
        "one interval or one 8D discipline per line.",
        "2. Keep the column order. The columns below are the ones the course's own "
        "worked examples use.",
        "3. Leave a cell blank rather than writing a guess. A blank cell is a question "
        "for the engineer; a guessed number is a defect in the record.",
        "",
        "## Columns",
    ]
    for col in header.split(","):
        guide.append("- `" + col.strip() + "`")
    guide += [
        "",
        "## Worked example",
        "The example variant of this file is the data file from case " + c["caseId"] +
        " (" + c["title"] + "), filled in with Board X numbers.",
        "",
        "## Where the numbers come from",
        "Every value in the example is produced by scripts/gen_cases.py and checked by "
        "scripts/check-cases.js. If you change a number in the example, the checker "
        "fails: that is deliberate.",
        "",
        "## Course link",
        "See lesson " + tdef["lesson"] + " for the reasoning behind each column.",
        "",
    ]

    blank_lines = [header] + [",".join([""] * len(header.split(","))) for _ in range(3)]
    return [
        {"variant": "blank", "file": tid + "-blank.csv",
         "mime": "text/csv", "label": "Blank", "content": "\r\n".join(blank_lines) + "\r\n"},
        {"variant": "example", "file": tid + "-example.csv",
         "mime": "text/csv", "label": "Example", "content": example},
        {"variant": "guide", "file": tid + "-guide.md",
         "mime": "text/markdown", "label": "Guide", "content": "\n".join(guide)},
    ]


def attach_templates(case):
    """Replace the planned-template stubs with generated three-variant templates."""
    base_by_file = {f["name"]: f["content"] for f in case["dataFiles"]}
    out = []
    for stub in case.get("templates", []):
        tdef = TEMPLATE_DEFS[stub["templateId"]]
        base = base_by_file.get(tdef.get("sourceFile"))
        if base is None and "columns" not in tdef:
            raise SystemExit(
                "template %s on case %s has neither %s in its data files nor its own columns"
                % (stub["templateId"], case["caseId"], tdef.get("sourceFile")))
        out.append({
            "templateId": stub["templateId"],
            "name": tdef["name"],
            "status": "available",
            "use": tdef["use"],
            "lesson": tdef["lesson"],
            "variants": template_variants(stub["templateId"], tdef, case, base),
        })
    case["templates"] = out


def build_cases():
    cases = []
    keys = []

    def add_step(case, step):
        keys.append({
            "caseId": case["caseId"], "stepId": step["id"], "type": step["type"],
            "formula": step["_key"]["formula"], "value": step["_key"]["raw"],
            "tolerance": step["answer"].get("tolerance", 0),
            "unit": step["answer"].get("unit", ""),
            "inputs": json.dumps(step["_key"]["inputs"], sort_keys=True),
        })
        clean = dict(step)
        clean.pop("_key")
        case["steps"].append(clean)

    # =====================================================================
    # m03 — stencil release audit
    # =====================================================================
    ar_qfp125 = area_ratio_rect(0.20, 0.80, 0.125)
    ar_qfp100 = area_ratio_rect(0.20, 0.80, 0.100)
    aspect_qfp100 = aspect_ratio(0.20, 0.100)
    ar_conn = area_ratio_rect(0.18, 0.80, 0.125)
    ar_bga = area_ratio_round(0.50, 0.125)
    ar_qfp50 = area_ratio_rect(0.22, 0.90, 0.125)
    vol_qfp100 = (0.20 * 0.80 * 0.100) * 1000.0   # mm^3 -> nL

    c = {
        "caseId": "cx-m03-01",
        "moduleId": "m03",
        "title": "Stencil release audit: the QFP-48 apertures will not release",
        "estMinutes": 25,
        "level": "core",
        "scenario": [
            "Board X goes to a new stencil supplier. The first article prints clean on the "
            "0402 passives and on the 0.5 mm QFP-64, but the 0.4 mm QFP-48 pads come up short "
            "in SPI: low volume on the inner rows, no offset, no bridging.",
            "The stencil drawing issued to the supplier carries a single foil thickness of "
            "0.125 mm and apertures of 0.20 mm x 0.80 mm on the fine-pitch part. Before you "
            "blame the printer, check whether the aperture geometry can release paste at all, "
            "and what the cheapest geometry change is that fixes it without touching the "
            "0.5 mm part or the passives.",
            "Work through the release indicators in the order the course uses them: area ratio, "
            "aspect ratio, then the aperture change. Use the aperture table in the data file.",
        ],
        "dataFiles": [
            {
                "name": "aperture-table.csv",
                "kind": "csv",
                "content": (
                    "aperture_id,component,shape,width_mm,length_mm,diameter_mm,foil_mm,pitch_mm\n"
                    "A-01,0402 passive,rect,0.55,0.60,,0.125,0.50\n"
                    "A-02,QFP-64 0.5 mm,rect,0.22,0.90,,0.125,0.50\n"
                    "A-03,QFP-48 0.4 mm (current),rect,0.20,0.80,,0.125,0.40\n"
                    "A-04,QFP-48 0.4 mm (thin region),rect,0.20,0.80,,0.100,0.40\n"
                    "A-05,BGA 0.8 mm,round,,,0.50,0.125,0.80\n"
                    "A-06,THT connector,rect,0.18,0.80,,0.125,2.54\n"
                ),
            }
        ],
        "steps": [],
        "rubric": [],
        "templates": [
            {"templateId": "stencil-sheet", "name": "Stencil data sheet", "status": "planned"}
        ],
        "toolLinks": [
            {"label": "Aperture calculator (lesson m03l05)", "href": "#/l/m03l05"},
            {"label": "Area ratio and aspect ratio (lesson m03l02)", "href": "#/l/m03l02"},
        ],
        "sources": ["src-004", "src-001"],
        "generatedBy": "scripts/gen_cases.py",
    }

    add_step(c, step_numeric(
        "s1",
        "Aperture A-03 (QFP-48, 0.20 mm x 0.80 mm, 0.125 mm foil). Area ratio = "
        "(L x W) / (2 x (L + W) x T). Give the value to two decimals — the next step "
        "compares it with the release indicator the course uses.",
        ar_qfp125, 0.005,
        ["The wall area is the perimeter times the foil thickness, and the perimeter of a "
         "rectangle is 2 x (L + W).",
         "Numerator 0.20 x 0.80 = 0.160 mm². Denominator 2 x (0.20 + 0.80) x 0.125 = 0.250 mm².",
         "0.160 / 0.250 = 0.64. Below the 0.66 release indicator the course uses."],
        "0.64 — below the 0.66 release indicator, so the aperture is the first suspect.",
        "Check the order of operations: area on top, perimeter times thickness underneath.",
        "Area ratio is (L x W) / (2 x (L + W) x T). For 0.20 x 0.80 at T = 0.125 the numerator "
        "is 0.160 mm² and the denominator 0.250 mm², giving 0.64. That is below the 0.66 "
        "guidance the course takes from IPC-7525, which is why release fails before any "
        "printer setting is touched."))

    add_step(c, step_choice(
        "s2",
        "Against the release indicator the course uses, what does 0.64 mean for A-03?",
        [("a", "Acceptable: it is above 0.60, the practical floor for a laser-cut foil."),
         ("b", "Marginal to inadequate: it is below the 0.66 guidance, so release depends on "
               "paste rheology and SPI evidence, not on geometry alone."),
         ("c", "Acceptable, because area ratio only matters below 0.5."),
         ("d", "Irrelevant, because aspect ratio is the only release indicator.")],
        "b",
        ["The lesson treats 0.66 as guidance rather than a wall, and asks what supports a "
         "marginal aperture.",
         "0.64 is 0.02 under the indicator — close enough that some pastes will run it, which "
         "is exactly why it is called marginal."],
        "Marginal — 0.64 sits just under the 0.66 guidance, so release is not guaranteed by "
        "geometry.",
        "Re-read the lesson's wording: it gives a guidance value and then says what evidence "
        "can support an aperture below it.",
        "The course calls apertures below 0.66 marginal to inadequate: they may run with a "
        "favourable paste and a well-cut wall, but the release is then supported by SPI data "
        "and paste evidence rather than by geometry. 0.60 is not a floor the course states, "
        "and area ratio is not the only indicator — aspect ratio is its partner."))

    add_step(c, step_numeric(
        "s3",
        "Same aperture printed through the 0.100 mm stepped region (A-04). What is the area "
        "ratio now?",
        ar_qfp100, 0.005,
        ["The perimeter does not change when the foil gets thinner; only the denominator's "
         "second factor changes.",
         "Denominator becomes 2 x (0.20 + 0.80) x 0.100 = 0.200 mm².",
         "0.160 / 0.200 = 0.80."],
        "0.80 — comfortably clear of the 0.66 indicator.",
        "Only the foil thickness changed: keep the numerator at 0.160 mm² and redo the "
        "denominator.",
        "At 0.100 mm the wall area drops to 0.200 mm², so the ratio rises to 0.80. That is the "
        "step-stencil remedy: thin the foil only over the fine-pitch region, because the "
        "reduction in wall contact is what buys the release."))

    add_step(c, step_numeric(
        "s4",
        "For that same 0.20 mm aperture in 0.100 mm foil, what is the aspect ratio?",
        aspect_qfp100, 0.05,
        ["Aspect ratio uses the smallest aperture dimension, not the length.",
         "Aspect ratio = aperture width / foil thickness.",
         "0.20 / 0.100 = 2.0."],
        "2.0 — above the 1.5 indicator as well.",
        "Use the narrow dimension (0.20 mm), divided by the foil thickness.",
        "Aspect ratio = smallest dimension / foil thickness = 0.20 / 0.100 = 2.0, above the "
        "1.5 guidance. Both indicators now pass, so the geometry argument for the step "
        "stencil is complete."))

    add_step(c, step_numeric(
        "s5",
        "The THT connector aperture A-06 is 0.18 mm x 0.80 mm in 0.125 mm foil. What is its "
        "area ratio?",
        ar_conn, 0.005,
        ["Same formula as before; the narrow dimension drives the result.",
         "Numerator 0.18 x 0.80 = 0.144 mm², denominator 2 x (0.18 + 0.80) x 0.125 = 0.245 mm².",
         "0.144 / 0.245 = 0.588, which rounds to 0.59."],
        "0.59 — the worst aperture on the board.",
        "Recompute both the area and the perimeter for the narrower aperture.",
        "0.144 / 0.245 = 0.588, so 0.59. It is the lowest ratio on Board X and would be the "
        "second candidate for a step-down region if the connector pads show short deposits."))

    add_step(c, step_numeric(
        "s6",
        "The BGA aperture A-05 is a round 0.50 mm opening in 0.125 mm foil. For a circle the "
        "area ratio is D / (4 x T). What is it?",
        ar_bga, 0.02,
        ["For a circle the perimeter is pi x D and the area is pi x D² / 4, so pi cancels.",
         "What is left is D / (4 x T).",
         "0.50 / (4 x 0.125) = 0.50 / 0.50 = 1.00."],
        "1.00 — a comfortable margin, as the round aperture should give.",
        "Use D / (4 x T) directly; do not square the diameter.",
        "Area ratio for a round aperture is D / (4 x T) = 0.50 / 0.500 = 1.00. The pi terms "
        "cancel between the circular area and the circular wall, which is why round BGA "
        "openings tolerate a thicker foil than a narrow rectangle at the same dimension."))

    add_step(c, step_numeric(
        "s7",
        "How much paste does the 0.20 x 0.80 mm aperture hold in 0.100 mm foil, in "
        "nanolithres? (1 mm³ = 1000 nL)",
        (vol_qfp100, "nL", "0.20*0.80*0.100*1000", {"l": 0.20, "w": 0.80, "t": 0.100}), 0.5,
        ["Nominal volume is aperture area times foil thickness.",
         "0.20 x 0.80 = 0.160 mm²; times 0.100 mm = 0.016 mm³.",
         "0.016 mm³ x 1000 nL/mm³ = 16 nL."],
        "16 nL of nominal volume per aperture.",
        "Watch the unit: the volume in mm³ is smaller than the number in nL by a factor of "
        "1000.",
        "Aperture area 0.160 mm² times foil 0.100 mm gives 0.016 mm³, which is 16 nL. Compare "
        "that with the joint requirement before choosing foil: thinner foil fixes release but "
        "reduces volume, which is why the two checks are a loop."))

    add_step(c, step_choice(
        "s8",
        "Which change fixes A-03 without disturbing the 0.5 mm QFP-64 and the passives?",
        [("a", "Reduce the whole stencil to 0.100 mm."),
         ("b", "Step the foil down to 0.100 mm over the QFP-48 region only."),
         ("c", "Raise squeegee pressure until the apertures fill."),
         ("d", "Reduce the aperture width to 0.18 mm to lower the wall contact.")],
        "b",
        ["Which parts of the board are already printing inside the indicators?",
         "A-01 and A-02 sit comfortably above 0.66 at 0.125 mm, so a global change would move "
         "them for no reason.",
         "The course's step-stencil lesson: put the transition away from fine-pitch features "
         "and keep each region at its own thickness."],
        "A stepped region at 0.100 mm over the fine-pitch part only.",
        "Check the ratios of the other apertures at 0.125 mm before choosing a global change.",
        "A-01 (0402) and A-02 (QFP-64 at 0.22 x 0.90) already pass at 0.125 mm, so thinning the "
        "whole foil would cut their paste volume for nothing and can cause its own defects. A "
        "stepped foil gives the QFP-48 the 0.80 it needs while leaving the rest of the board "
        "where it printed well. Pressure cannot repair a wall-dominated release, and a "
        "narrower aperture lowers the ratio further."))

    c["rubric"] = [
        {"criterion": "Area ratio of the current fine-pitch aperture computed correctly", "points": 15, "steps": ["s1"]},
        {"criterion": "Result judged against the release indicator, not against intuition", "points": 10, "steps": ["s2"]},
        {"criterion": "Thinned-foil area ratio recomputed from geometry", "points": 15, "steps": ["s3"]},
        {"criterion": "Aspect ratio computed with the narrow dimension", "points": 10, "steps": ["s4"]},
        {"criterion": "Second-worst aperture identified and quantified", "points": 10, "steps": ["s5"]},
        {"criterion": "Round-aperture rule applied, not the rectangle formula", "points": 10, "steps": ["s6"]},
        {"criterion": "Nominal volume converted to nanolithres without a factor error", "points": 10, "steps": ["s7"]},
        {"criterion": "Remedy chosen that does not move the apertures already in spec", "points": 20, "steps": ["s8"]},
    ]
    cases.append(c)

    # =====================================================================
    # m01 — incoming release of the bare-board lot
    # =====================================================================
    # Board X is 160 x 120 mm. The lot in the door is 2,800 boards, so the plan
    # is decided by arithmetic and a table, not by how many the inspector has
    # time for.
    bw_l, bw_w = 160.0, 120.0
    bw_diag = math.hypot(bw_l, bw_w)                   # exactly 200 mm
    twist_gap = 2.60                                   # worst carton, production method
    twist_right = twist_pct(twist_gap, bw_diag)        # 0.65 %
    twist_allowed_gap = (2.0 * bw_diag * BOW_TWIST_SMT_PCT / 100.0, "mm",
                         "2*diagonal*ceiling/100",
                         {"diagonal_mm": bw_diag, "ceiling_pct": BOW_TWIST_SMT_PCT})
    n_lot = iso_sample(2800, "K", 125, 3, 4)
    n_sharp = iso_sample(1520, "K", 125, 3, 4)

    c = {
        "caseId": "cx-m01-01",
        "moduleId": "m01",
        "title": "Bare-board release: a twist figure that is out by a factor of two",
        "estMinutes": 30,
        "level": "core",
        "scenario": [
            "The bare-board lot for the next Board X build is on the dock: 2,800 pieces, "
            "160 x 120 mm, ENIG finish, one supplier lot number on the box. The receiving "
            "inspector has already done part of the job and left two numbers that do not "
            "agree with each other.",
            "The flatness check reports 2.60 mm under one raised corner by the production "
            "method, on a 160 x 120 mm board — a 200 mm diagonal. She wrote it up as "
            "1.3 % and put the carton on hold. The certificate of conformance is present "
            "for the whole lot, the humidity indicator card is blue and the packaging is "
            "intact, except that the cartons carry two different date codes and the counts "
            "on the labels do not match what is in the boxes.",
            "Decide what this lot is: accepted, quarantined or rejected. Then decide how "
            "many boards should have been pulled, because the answer changes whether the "
            "twist reading is even a defect.",
        ],
        "dataFiles": [
            {
                "name": "board-lot.csv",
                "kind": "csv",
                "content": (
                    "carton,labelled_date_code,boards_on_label,boards_in_box,"
                    "twist_gap_mm,humi_card\n"
                    "1,D2418,700,700,1.10,blue\n"
                    "2,D2418,700,700,1.35,blue\n"
                    "3,D2511,700,660,2.60,blue\n"
                    "4,D2511,700,700,1.05,blue\n"
                ),
                "note": "One row per carton. The twist gap is the measured height "
                        "under the raised corner, production method, on the boards "
                        "sampled from that carton.",
            },
            {
                "name": "receipt-plan.csv",
                "kind": "csv",
                "content": (
                    "item,value\n"
                    "lot_size_declared,2800\n"
                    "lot_size_counted,2760\n"
                    "board_length_mm,160\n"
                    "board_width_mm,120\n"
                    "sample_taken,20\n"
                    "inspection_level,II\n"
                    "aql,1.0\n"
                ),
            },
        ],
        "steps": [],
        "rubric": [],
        "templates": [
            {"templateId": "incoming-release", "name": "Incoming release record",
             "status": "planned"}
        ],
        "toolLinks": [
            {"label": "Sampling a lot (lesson m01l03)", "href": "#/l/m01l03"},
            {"label": "Bare PCB receipt (lesson m01l06)", "href": "#/l/m01l06"},
            {"label": "Nonconforming material at dock (lesson m01l07)", "href": "#/l/m01l07"},
        ],
        "sources": ["src-018", "src-006", "src-037"],
        "generatedBy": "scripts/gen_cases.py",
    }

    add_step(c, step_numeric(
        "s1",
        "The raised corner measures 2.60 mm and the board diagonal is 200 mm. What is the "
        "twist by the IPC-TM-650 2.4.22 production method, in percent?",
        twist_right, 0.03,
        ["The method divides the gap by twice the diagonal, not by the diagonal.",
         "2.60 / (2 x 200) = 0.0065, and that is a fraction.",
         "2.60 / 400 x 100 = 0.65 %."],
        "0.65 % — inside 0.75 %. The 1.3 % on the receiving sheet is the same gap "
        "divided by the diagonal once.",
        "Check the divisor: the production method uses twice the diagonal.",
        "2.60 / (2 x 200.0) = 0.0065 = 0.65 %. On a board that carries surface-mount "
        "parts the IPC-6012 default ceiling is 0.75 %, so this carton passes — while the "
        "1.3 % on the sheet is over the limit and would have scrapped it. Dropping the "
        "factor of two is not a rounding error here, it is a disposition: the same 2.60 mm "
        "decides whether the lot ships. That is why IPC-TM-650 2.4.22 names the divisor "
        "explicitly rather than leaving it to a percentage formula."))

    add_step(c, step_numeric(
        "s2",
        "Turned around: at the same 0.75 % ceiling, what is the largest gap, in mm, that "
        "this board's diagonal may show?",
        twist_allowed_gap, 0.02,
        ["The gap is twice the diagonal times the percentage.",
         "2 x 200 x 0.0075.",
         "3.00 mm."],
        "3.00 mm allowed on the diagonal; the worst carton shows 2.60 mm.",
        "Solve gap/(2 x diagonal) = 0.0075 for the gap.",
        "2 x 200 x 0.75 % = 3.00 mm, and the worst carton measures 2.60 mm, which is the "
        "0.65 % of the previous step seen from the other end. Doing it this way is what "
        "lets an inspector carry a ruler instead of a calculator: the allowed gap is a "
        "number on the drawing, and the percentage is a number in the record. Note that "
        "this is a limit for the gap, not for the board — a bow measured along the 160 mm "
        "edge is judged against 1.20 mm instead, because the percentage applies to the "
        "direction being measured."))

    add_step(c, step_choice(
        "s3",
        "The lot is 2,800 boards and the quality plan requires ISO 2859-1 general "
        "inspection level II at AQL 1.0. What sampling plan applies?",
        [("a", "Code J, n = 80, accept on 2 or fewer defectives."),
         ("b", "Code K, n = 125, accept on 3 or fewer defectives, reject on 4."),
         ("c", "Code K, n = 200, accept on 5 or fewer defectives."),
         ("d", "Inspect every board, because 2,800 is a large lot.")],
        "b",
        ["2,800 falls in the 1,201-3,200 band of Table I.",
         "That band at level II gives code K.",
         "Code K at AQL 1.0 gives n = 125, Ac = 3, Re = 4."],
        "Code K: 125 boards, accept at 3 defectives, reject at 4.",
        "Find the lot-size band first, then the code letter, then the AQL column.",
        "A lot of 1,201 to 3,200 at general level II is code K, and code K at AQL 1.0 is "
        "125 pieces with Ac = 3, Re = 4. The inspector pulled 20. Twenty is not a plan, "
        "it is a look: at 20 pieces you cannot see enough of even a 2 % defect rate to "
        "tell it from a 5 % one, and the acceptance number that would go with it comes "
        "from a band this lot is not in. Re = Ac + 1 in single sampling, which is why "
        "the plan in option c cannot exist: 200 pieces is code L, and that plan's "
        "numbers belong to a different lot size."))

    add_step(c, step_numeric(
        "s4",
        "The count on the box does not match the labels: 2,760 boards instead of 2,800. "
        "The whole shipment is one supplier lot. What sample size, in pieces, was required "
        "for each lot size?",
        n_lot, 0.5,
        ["Both 2,760 and 2,800 sit in the same Table I band.",
         "The 1,201-3,200 band at level II is code K.",
         "Code K is 125 pieces, and the shortfall does not change the band."],
        "125 in both cases — 40 boards do not move the lot to another band.",
        "Compare the two counts with the band edges before re-deriving anything.",
        "2,760 and 2,800 both fall in 1,201-3,200, so both are code K and both call for "
        "125 pieces. That is the useful part of a table over an intuition: a 40-piece "
        "shortfall is a shortage to report, not a sampling change. The number that should "
        "bother the inspector is different — that the box and the labels disagree about "
        "what was shipped."))

    add_step(c, step_choice(
        "s5",
        "The two date codes split this shipment into lots of 1,400 and 1,400. Both would "
        "still call for the same 125 pieces. Why does that matter here?",
        [("a", "It does not; 1,400 is a different lot size and needs its own plan."),
         ("b", "The two date codes may be two lots, and a lot is the population the plan "
               "applies to. Splitting leaves two lots of 1,400, and both sit in the "
               "1,201-3,200 band, so the plan holds either way."),
         ("c", "It means the sample can be pulled from whichever carton is nearest."),
         ("d", "It means the AQL should be halved to keep the same protection.")],
        "b",
        ["A lot is one part number, revision, supplier lot and date code — not one shipment.",
         "Split the boxes by date code and look at the two lot sizes.",
         "Both fall in 1,201-3,200, so both keep code K and 125 pieces."],
        "Split into two lots by date code; the plan is unchanged, and the split is what "
        "the word 'lot' was always doing.",
        "Which quantity does the sampling plan actually apply to?",
        "The plan protects a population, and the population is the lot as defined: one "
        "part, one revision, one date code. A shipment carrying two date codes is two "
        "lots unless the quality plan says the difference does not affect the inspected "
        "characteristic. Here it does not change the numbers — two lots of 1,400 sit "
        "comfortably inside the K band — but the band is coarse, and a split near an edge "
        "does change it: a lot of 1,200 is code K only because the band starts at 1,201, "
        "and 1,150 would fall to code J and a sample of 80. The split also decides what a "
        "reject gets attributed to, which supplier explanation gets tested, and whether "
        "the 40 missing boards came from one lot or two."))

    add_step(c, step_numeric(
        "s6",
        "The shipping paperwork and the box disagree by how many percent, counting the "
        "2,760 boards in the boxes against the 2,800 on the labels?",
        share_of(2800 - 2760, 2800), 0.1,
        ["The gap is 40 boards.",
         "Divide the gap by the declared quantity, not by the counted one.",
         "40 / 2,800 x 100 = 1.4 %."],
        "1.4 % of the declared quantity is missing.",
        "Part over whole: the whole here is what the labels promised.",
        "40 / 2,800 = 1.4 %. Small enough to wave through, and not a cosmetic matter: "
        "the counts feed the build plan, the lot traceability and any later return of "
        "affected boards, and a carton whose label and contents disagree is a carton "
        "nobody can trace. This is the kind of finding that belongs in the record even "
        "when the product itself measures fine."))

    add_step(c, step_choice(
        "s7",
        "On the evidence in the two files, what is the disposition of this shipment?",
        [("a", "Accept it: the twist is inside the limit and the humidity card is blue."),
         ("b", "Reject it: the boards are out of flatness by a factor of eight."),
         ("c", "Quarantine it: the product measurements pass, but the date codes and the "
               "counts do not let the lots be defined or traced until the supplier "
               "explains them."),
         ("d", "Accept the good cartons and reject carton 3.")],
        "c",
        ["Separate what was measured from what cannot be established.",
         "Nothing measured is a defect; what is missing is identity and quantity.",
         "Quarantine holds material whose status is unclear, and this is that."],
        "Quarantine: nothing measured fails, and nothing about the lot can be established.",
        "Which of the findings could be dispositioned today, and which one needs the supplier?",
        "The twist is 0.20 % against a 0.75 % ceiling and the humidity indicator is blue, "
        "so the product side of this lot is fine — a rejection on flatness would be "
        "wrong, and it is what the 6 % reading would have produced. But two date codes "
        "in one shipment and 40 boards missing from the boxes leave the lot undefined: "
        "you cannot say which boards came from which manufacturing lot, so you cannot "
        "contain, return or trace them if one lot turns out bad. Quarantine is the "
        "disposition for 'evidence incomplete', and it is reversible once the supplier "
        "answers. Rejecting the lot would be a claim about the product that the data "
        "does not support."))

    add_step(c, step_choice(
        "s8",
        "The supplier replies that both date codes come from the same lamination batch and "
        "the count difference is a labelling error. What does that reply change?",
        [("a", "Everything: with one batch the shipment is one lot and can be released."),
         ("b", "It answers the lot question, so the 125-piece sample can be pulled across "
               "the whole shipment and dispositioned as one lot; the 40 missing boards "
               "remain an open quantity issue with the supplier."),
         ("c", "Nothing, because a supplier statement is never used at the dock."),
         ("d", "It means the sample can be reduced to 20 pieces as originally taken.")],
        "b",
        ["Which of the two findings does the statement address?",
         "It addresses identity (one lamination batch), not quantity.",
         "Release follows the sample, and the quantity gap stays open."],
        "The lot question is closed and the sample can cover the shipment; the 40 boards "
        "stay open.",
        "Take the statement one finding at a time: which does it resolve?",
        "A supplier statement about one lamination batch can define the lot, provided it "
        "is recorded and traceable to the paperwork — that is what supplier "
        "documentation is for, and refusing to ever use it would quarantine every lot "
        "that arrives with a letter. It does not create 40 boards. So the sample proceeds "
        "at 125 pieces against the whole shipment, the plan still administers the "
        "product, and the shortage is closed separately with a debit or a replacement. "
        "Conflating the two is how a lot gets released while the traceability hole moves "
        "into the build."))

    add_step(c, step_choice(
        "s9",
        "What makes this release record usable six months from now?",
        [("a", "A statement that the lot was inspected and released."),
         ("b", "The inspector's name and the date."),
         ("c", "The two lot sizes and the date codes as received, the plan and AQL with the "
               "sample size and the accept number, the measured twist with its method and "
               "the limit it was compared with, the humidity card reading, the 40-board "
               "quantity gap with its closure, the quarantine and its release, and the "
               "supplier's statement."),
         ("d", "A photograph of the carton labels.")],
        "c",
        ["A record is judged by whether someone else could re-take the same decision.",
         "The method matters as much as the measurement: 0.20 % and 6 % describe the "
         "same board.",
         "Identity, plan, measurement with method, quantity, disposition, closure."],
        "Identity, plan and AQL, the twist with its method and limit, the humidity "
        "reading, the shortage and its closure, the hold and its release.",
        "Which of these would let another engineer reach the same disposition without you?",
        "Which of these would fail if the lot were questioned a year later, or if the "
        "product class changed? A record that says 'released' cannot answer either. The "
        "twist figure without its method is actively misleading, because 0.20 % and 6 % "
        "are the same 0.80 mm; the plan without its AQL cannot show whether 3 defectives "
        "was a pass; and the quarantine without its release leaves a permanent question "
        "mark over boards that are already assembled. A photo of a carton label is "
        "evidence for one of these facts, not a record of the decision."))

    c["rubric"] = [
        {"criterion": "Twist computed by the production method, with the factor of two",
         "points": 20, "steps": ["s1"]},
        {"criterion": "Bow limit derived for the measured direction", "points": 10,
         "steps": ["s2"]},
        {"criterion": "ISO 2859-1 plan read off the table for the actual lot size",
         "points": 15, "steps": ["s3", "s4"]},
        {"criterion": "Lot defined before sampling, and the split shown not to change the "
                       "plan", "points": 15, "steps": ["s5"]},
        {"criterion": "Quantity gap quantified against the declared quantity",
         "points": 10, "steps": ["s6"]},
        {"criterion": "Disposition separates a passing measurement from an undefined lot",
         "points": 20, "steps": ["s7", "s8"]},
        {"criterion": "Release record carries the method, the limit and the closure",
         "points": 10, "steps": ["s9"]},
    ]
    cases.append(c)

    # =====================================================================
    # m02 — moisture breach
    # =====================================================================
    fl_msl4 = 72.0           # J-STD-033 floor life, MSL 4 (lesson m02l04)
    exposure = 58.0 + 6.0    # bag open 58 h + 6 h on an open feeder
    remaining = floor_life_remaining(fl_msl4, exposure)

    c = {
        "caseId": "cx-m02-01",
        "moduleId": "m02",
        "title": "Moisture breach: the BGA reel sat in a 7 % RH cabinet",
        "estMinutes": 20,
        "level": "core",
        "scenario": [
            "Board X's 256-ball BGA comes in on MSL 4 tape and reel. The reel was opened "
            "58 h ago and went straight into the storage dry cabinet. The cabinet log shows "
            "7 % RH for the whole period; the setpoint in the procedure is 5 %.",
            "During the second shift a feeder was loaded and the reel sat on the machine for "
            "6 h before the line went down. Reflow of that build is planned 10 h from now.",
            "Decide the disposition. The lesson is explicit that a cabinet above the dry-storage "
            "requirement does not stop the clock, and that a tape-and-reel bake has a hard "
            "temperature ceiling.",
        ],
        "dataFiles": [
            {
                "name": "msl-log.csv",
                "kind": "csv",
                "content": (
                    "reel,part,package,msl,bag_open_h_ago,cabinet_rh_pct,line_exposure_h,reflow_in_h\n"
                    "R-4412,BGA-256 14x14,FBGA,4,58,7,6,10\n"
                    "R-4413,QFP-64 0.5 mm,QFP,3,58,7,0,10\n"
                    "R-4414,0402 100 nF,chip,1,58,7,0,10\n"
                ),
            }
        ],
        "steps": [],
        "rubric": [],
        "templates": [
            {"templateId": "msl-log", "name": "MSL exposure log", "status": "planned"}
        ],
        "toolLinks": [
            {"label": "Baking and dry cabinets (lesson m02l04)", "href": "#/l/m02l04"},
            {"label": "Floor-life accounting (lesson m02l03)", "href": "#/l/m02l03"},
        ],
        "sources": ["src-003", "src-005"],
        "generatedBy": "scripts/gen_cases.py",
    }

    add_step(c, step_numeric(
        "s1",
        "What is the J-STD-033 floor life for MSL 4, in hours at the reference condition?",
        (fl_msl4, "h", "J-STD-033 Table 5-1, MSL 4", {"msl": 4}), 0.5,
        ["The values in the course run 168 h, 72 h, 48 h, 24 h down the levels.",
         "MSL 4 is the third value in that sequence.",
         "MSL 4 = 72 h."],
        "72 h — the number the whole disposition hangs on.",
        "This is a table lookup, not an arithmetic result: MSL 4 is 72 h.",
        "MSL 4 has 72 h of floor life at 30 °C / 60 % RH. MSL 3 is 168 h and MSL 5 is 48 h, "
        "which is why the levels are always quoted with their value."))

    add_step(c, step_numeric(
        "s2",
        "How many hours count against that floor life? Add the bag-open period and the time "
        "on the open feeder.",
        (exposure, "h", "58+6", {"bag_open_h": 58, "line_h": 6}), 0.5,
        ["A 7 % RH cabinet is above the 5 % requirement, so the cabinet time is not suspended.",
         "The 6 h on the feeder is outside the cabinet entirely.",
         "58 + 6 = 64 h."],
        "64 h counted — the cabinet gave no credit at 7 % RH.",
        "Every hour counts here: the cabinet was not compliant, so nothing is discounted.",
        "A cabinet at 7 % RH is above the 5 % dry-storage requirement, so exposure keeps "
        "accumulating; the 6 h on the open feeder adds on top. 58 + 6 = 64 h of a 72 h budget."))

    add_step(c, step_numeric(
        "s3",
        "How much floor life is left for the BGA reel, in hours?",
        remaining, 0.5,
        ["Subtract the counted exposure from the floor life.",
         "72 h minus 64 h.",
         "8 h remain, against a reflow planned in 10 h."],
        "8 h left, and the reflow is 10 h away — the reel cannot simply proceed.",
        "Floor life minus counted exposure, in hours.",
        "72 - 64 = 8 h remain, but the planned reflow is 10 h away. The batch is 2 h short, so "
        "the decision is bake or reschedule, not release."))

    add_step(c, step_choice(
        "s4",
        "The cabinet logged 7 % RH against a 5 % requirement. What does the course say that "
        "does to the clock?",
        [("a", "It suspends the clock, because any dry cabinet below 10 % RH is equivalent to "
               "sealed dry pack."),
         ("b", "It slows the clock, but 5 % RH or less is the condition that suspends it, so "
               "this storage gave no credit."),
         ("c", "It resets the clock, because the parts were dry when they went in."),
         ("d", "It has no effect either way; only the bag seal matters.")],
        "b",
        ["The lesson was corrected on exactly this point: 10 % RH is not the requirement.",
         "5 % RH or less is what stops moisture uptake; above it the budget keeps shrinking, "
         "just more slowly."],
        "7 % RH slows the clock but does not suspend it, so no credit was given.",
        "Look at which relative humidity the lesson calls the requirement, not which is common "
        "on a cheap cabinet.",
        "Below 5 % RH the device stops gaining moisture, so the exposure clock is suspended. A "
        "10 % cabinet is common and slows the clock rather than stopping it; at 7 % the parts "
        "were outside the requirement, so the full 64 h counts. The 10 % form is a mitigation "
        "for devices with budget to spare, never a substitute for the requirement."))

    add_step(c, step_numeric(
        "s5",
        "The reel needs a bake. What is the maximum temperature the tape and reel may see, "
        "in °C?",
        (TAPE_BAKE_MAX_C, "°C", "J-STD-033 tape-and-reel ceiling", {"limit": TAPE_BAKE_MAX_C}), 0.5,
        ["Carrier tape and cover tape soften and deform when they get hot.",
         "The lesson gives a fixed ceiling for tape and reel, not a range.",
         "40 °C."],
        "40 °C — and at 40 °C the bake takes days, not hours.",
        "The value is a fixed ceiling in the lesson, well below the 125 °C tray bake.",
        "Tape and reel must not be baked above 40 °C because the carrier and cover tape deform. "
        "At that temperature the table runs to days for a thin body, which is why the 40 °C "
        "route does not fit a 10 h window."))

    add_step(c, step_choice(
        "s6",
        "The reflow is 10 h away and a 40 °C bake will not finish in time. Which route does "
        "the lesson support?",
        [("a", "Bake the reel at 125 °C now and accept some tape deformation."),
         ("b", "De-reel into trays, bake the loose parts at the permitted higher temperature, "
               "then re-reel; or move the build inside the remaining floor life."),
         ("c", "Skip the bake and raise the reflow peak by 10 °C to drive the moisture out."),
         ("d", "Run the reel as-is and inspect the BGA after reflow.")],
        "b",
        ["Which constraint is physical and which is scheduling?",
         "The tape ceiling is a material limit; the schedule is not. The lesson offers "
         "de-reeling and rescheduling.",
         "De-reel to a carrier that tolerates 125 °C, or move the reflow inside the 8 h."],
        "De-reel and bake at the higher temperature, or move the build inside the remaining "
        "floor life.",
        "The lesson never trades a material limit for a schedule.",
        "Baking a reel at 125 °C destroys the carrier tape, and raising the peak adds thermal "
        "stress without removing moisture. The two supported routes are de-reeling to a "
        "carrier rated for the 125 °C bake, or rescheduling the build inside the 8 h that "
        "remain. Reflowing an unbaked MSL 4 batch and inspecting afterwards turns a known risk "
        "into a detection gamble."))

    c["rubric"] = [
        {"criterion": "Floor life for MSL 4 taken from the table, not guessed", "points": 15, "steps": ["s1"]},
        {"criterion": "Exposure counted with no credit for a non-compliant cabinet", "points": 20, "steps": ["s2"]},
        {"criterion": "Remaining life computed and compared with the reflow schedule", "points": 20, "steps": ["s3"]},
        {"criterion": "7 % RH judged against the 5 % requirement", "points": 15, "steps": ["s4"]},
        {"criterion": "Tape-and-reel bake ceiling known", "points": 10, "steps": ["s5"]},
        {"criterion": "Route chosen that respects the material limit", "points": 20, "steps": ["s6"]},
    ]
    cases.append(c)

    # =====================================================================
    # m06 — reflow profile validation
    # =====================================================================
    ramp = ramp_rate(25, 150, 60)
    tal_margin = (65.0 - TAL_MIN_S, "s", "65-60", {"tal_s": 65, "min_s": TAL_MIN_S})
    # The survey ran three thermocouples. Their offsets from the reference site are
    # the one place the spread is declared; the data file, the step and the
    # explanation all read them from here.
    PROFILE_PEAK_C = 248.0
    TC_SITES = [(-6, "TC1", "BGA centre joint", 60),
                (1, "TC2", "QFP lead board edge", 65),
                (6, "TC3", "0402 chip near edge", 70)]
    tc_peaks = [PROFILE_PEAK_C + off for off, _, _, _ in TC_SITES]
    peak_spread = spread(tc_peaks)
    peak_margin = margin(JSTD020_LARGE_PACKAGE_C, PROFILE_PEAK_C)
    cooling_rate = (248 - 100) / 40.0
    model_ramp = expected_ramp(100, 90)

    c = {
        "caseId": "cx-m06-01",
        "moduleId": "m06",
        "title": "Profile validation: Board X runs a 248 °C peak",
        "estMinutes": 25,
        "level": "core",
        "scenario": [
            "Board X is a 1.6 mm six-layer board with heavy ground planes and a large BGA. "
            "The thermal survey from the worst-case site gives the profile in the data file: "
            "25 to 150 °C in 60 s, soak 150 to 190 °C for 90 s, 65 s above 219 °C, peak 248 °C, "
            "and cooling from 248 to 100 °C in 40 s.",
            "Paste is SAC305. The paste window for this board is 60-90 s above liquidus "
            "(IPC-7530B guidance is 30-90 s; the datasheet narrows it). The peak is judged "
            "against a ceiling, not a target: the J-STD-020 classification temperature for "
            "a large package at 1.6-2.5 mm is 250 °C, while the course's typical production "
            "band is 235-245 °C.",
            "Validate the profile, compute the margins, and decide whether it can be released "
            "with a documentation note or must be changed.",
        ],
        "dataFiles": [
            {
                "name": "profile.csv",
                "kind": "csv",
                "content": (
                    "interval,from_c,to_c,seconds,rate_c_per_s\n"
                    "ramp,25,150,60,\n"
                    "soak,150,190,90,\n"
                    "approach,190,219,30,\n"
                    "above_liquidus,219,248,65,\n"
                    "peak_hold,248,248,4,\n"
                    "cooling,248,100,40,\n"
                ),
            },
            {
                "name": "thermocouples.csv",
                "kind": "csv",
                "note": "One profile, three sites. The middle column is the peak at "
                        "that thermocouple; the offsets are why a single-point profile "
                        "flatters the board.",
                "content": ("site,location,peak_c,tal_s,offset_from_reference_c,"
                            "within_paste_band\n" +
                            "".join("%s,%s,%d,%d,%+d,%s\n" % (
                                sid, name, PROFILE_PEAK_C + off, tal, off,
                                "no (over the 245 C top)" if PROFILE_PEAK_C + off > PASTE_PEAK_MAX_C
                                else "no (under the 235 C floor)" if PROFILE_PEAK_C + off < PASTE_PEAK_MIN_C
                                else "yes")
                                for off, sid, name, tal in TC_SITES)),
            },
        ],
        "steps": [],
        "rubric": [],
        "templates": [
            {"templateId": "reflow-log", "name": "Reflow profile log", "status": "planned"}
        ],
        "toolLinks": [
            {"label": "Profile anatomy (lesson m06l02)", "href": "#/l/m06l02"},
            {"label": "Alloy systems and profile families (lesson m06l05)", "href": "#/l/m06l05"},
        ],
        "sources": ["src-008", "src-005"],
        "generatedBy": "scripts/gen_cases.py",
    }

    add_step(c, step_numeric(
        "s1",
        "What is the ramp rate from 25 °C to 150 °C, in °C/s?",
        ramp, 0.05,
        ["Rate is a temperature difference over a time.",
         "(150 - 25) = 125 °C over 60 s.",
         "125 / 60 = 2.08 °C/s."],
        "2.08 °C/s — inside the 1-3 °C/s guidance.",
        "Divide the rise by the seconds, not the other way round.",
        "125 °C in 60 s gives 2.08 °C/s, which sits inside the 1-3 °C/s guidance the course "
        "takes from IPC-7530. This is the figure the m06 lesson works, and it matters because "
        "a ramp that is too fast drives tombstoning on the 0402s."))

    add_step(c, step_numeric(
        "s2",
        "The profile gives 65 s above 219 °C. Against the paste datasheet window of 60-90 s, "
        "how many seconds of margin are there at the lower end?",
        tal_margin, 0.5,
        ["The window opens at 60 s.",
         "65 s minus 60 s.",
         "5 s of margin."],
        "5 s above the lower bound — inside the window, with little margin.",
        "Subtract the window minimum from the measured time above liquidus.",
        "65 s clears the 60 s floor of the paste window by 5 s. The course treats that as "
        "passing but thin: a slower line or a colder zone could drop the board below the "
        "window without anyone changing the recipe."))

    add_step(c, step_numeric(
        "s2b",
        "The survey ran three thermocouples. Using thermocouples.csv, what is the "
        "peak-to-peak spread across the board, in °C?",
        peak_spread, 0.5,
        ["Spread is the hottest site minus the coldest, not a distance to a limit.",
         "Hottest is the 0402 near the edge, coldest is the BGA centre joint.",
         "%d - %d." % (max(tc_peaks), min(tc_peaks))],
        "12 °C across the board — and the mean of the three is the 248 °C the "
        "single-point profile reported.",
        "Subtract the coldest peak from the hottest; ignore the middle site.",
        "254 - 242 = 12 °C. The mean of the three sites is 248 °C, exactly the peak "
        "the single-point profile reported, which is why one thermocouple makes a "
        "graded board look uniform. The spread is the finding: 242 °C at the BGA "
        "centre is 3 °C under the paste band top, and 254 °C at the 0402 near the "
        "edge is 9 °C over it and 4 °C over the 250 °C classification ceiling for a "
        "large package. The single average of 248 °C sits inside the band and hides "
        "both facts, which is why the record has to carry the spread and not the "
        "average."))

    add_step(c, step_numeric(
        "s3",
        "Peak is 248 °C and the large-package classification temperature is 250 °C. What "
        "margin is left, in °C?",
        peak_margin, 0.5,
        ["Margin is limit minus measured, not measured minus limit.",
         "250 - 248.",
         "2 °C."],
        "2 °C of margin to the classification limit.",
        "The limit is the upper number; subtract the measurement from it.",
        "250 - 248 leaves 2 °C. The classification temperature is a ceiling for the package, "
        "so a 2 °C margin means any zone drift or heavier board can push the peak over it — "
        "worth a note in the profile record even though the profile passes."))

    add_step(c, step_numeric(
        "s4",
        "Cooling runs from 248 °C to 100 °C in 40 s. What is the cooling rate in °C/s?",
        (cooling_rate, "°C/s", "(248-100)/40", {"t1": 248, "t2": 100, "s": 40}), 0.05,
        ["Same rate formula, with the drop as the temperature difference.",
         "248 - 100 = 148 °C.",
         "148 / 40 = 3.7 °C/s."],
        "3.7 °C/s — fast cooling, good for grain structure but hard on large components.",
        "Use the drop (148 °C) over the 40 s cooling window.",
        "148 °C in 40 s is 3.7 °C/s. The course notes that cooling that fast is good for fine "
        "grain but raises the thermal gradient across a large BGA, so it is a parameter to "
        "record and watch rather than a defect."))

    add_step(c, step_choice(
        "s5",
        "Which disposition does the three-site survey earn?",
        [("a", "Reject: the 0402 near the edge peaks over the paste band and over the "
               "package ceiling, so the profile cannot be released as measured."),
         ("b", "Accept and document: the average peak and the time above liquidus are "
               "inside their windows, so the spread is recorded as a note only."),
         ("c", "Accept without comment: a profile only fails if the joints look wrong."),
         ("d", "Reject: time above liquidus must always exceed 90 s on a heavy board.")],
        "a",
        ["The average is not the finding: look at the hottest and the coldest site.",
         "254 °C at the 0402 near the edge is above both the paste band top (245 °C) and "
         "the large-package ceiling (250 °C).",
         "A profile is judged on the worst measured point, not on the mean, so it cannot "
         "be released as measured."],
        "Reject and change: the hot corner exceeds the paste band and the package ceiling.",
        "Averaging the three sites hides the one that fails. Judge the worst point.",
        "254 °C at the 0402 near the edge is 9 °C over the paste band top and 4 °C over the "
        "J-STD-020 ceiling for a large package, so the profile fails at that point however "
        "good the 248 °C average looks. Time above liquidus is inside its window at every "
        "site, and the BGA centre at 242 °C is fine, which is exactly why the failing corner "
        "has to be found from the survey rather than from a single thermocouple. This is the "
        "lesson the case is built on: a mean is not a measurement of the worst case."))

    add_step(c, step_numeric(
        "s6",
        "A first-principles check: the oven delivers about 100 W and the board's measured "
        "thermal mass is 90 J/K. What ramp rate does that predict, in °C/s?",
        model_ramp, 0.05,
        ["Ramp rate from heat input is power divided by thermal mass.",
         "100 W / 90 J/K.",
         "1.1 °C/s."],
        "1.1 °C/s predicted, against 2.08 °C/s measured.",
        "Power over thermal mass; the units work out to °C/s directly.",
        "100 / 90 = 1.1 °C/s, roughly half the measured ramp. The model is a sanity check, not "
        "an oracle: the real oven adds zone power and the board receives radiated heat, so a "
        "measured rate above the model is expected — but a factor of two is worth checking "
        "before the model is used to set a recipe."))

    # The peak window this case is judged against is the same window the lesson
    # table quotes, carried on the case so the page can print it without the
    # engine holding a copy of it.
    c["spec"] = [
        {"label": "Liquidus", "value": BOARD_FACTS["liquidusC"], "unit": "°C"},
        {"label": "Time above liquidus",
         "value": BOARD_FACTS["talWindowS"][0], "to": BOARD_FACTS["talWindowS"][1], "unit": "s",
         "note": "Board X paste window (m06l07); IPC-7530B guidance is 30-90 s (m06l05)"},
        {"label": "Peak window, paste",
         "value": PEAK_WINDOW_C[0], "to": PEAK_WINDOW_C[1], "unit": "°C",
         "note": "Typical SAC305 band, m06l01 and the paste datasheet"},
        {"label": "Peak ceiling, large package",
         "value": JSTD020_LARGE_PACKAGE_C, "unit": "°C",
         "note": "J-STD-020 Table 4-2, 1.6-2.5 mm, large package (m06l05)"},
    ]

    add_step(c, step_choice(
        "s7",
        "What should be done with the factor-of-two gap between the model and the measurement?",
        [("a", "Trust the model: the measured thermocouple must be wrong."),
         ("b", "Trust the measurement and record the model's assumptions as unvalidated for "
               "this board; re-measure a second worst-case site before using the model to "
               "predict zone settings."),
         ("c", "Average the two values and use that as the ramp rate."),
         ("d", "Ignore both and use the paste datasheet ramp figure.")],
        "b",
        ["A thermocouple on the worst-case site is direct evidence; a lumped model is an "
         "estimate.",
         "The lesson's own wording is to treat the model as an estimate and verify against "
         "measurement.",
         "Keep the measurement, flag the model, and take a second site."],
        "Keep the measurement, mark the model unvalidated for Board X, and check a second "
        "worst-case site.",
        "The question is which number is evidence and which is an assumption.",
        "The thermocouple is direct evidence; the 100 W / 90 J/K model is a lumped estimate "
        "that ignores radiation, zone coupling and board mass distribution. Averaging an "
        "estimate with a measurement produces a number with no physical meaning, and the "
        "datasheet ramp is a paste guideline, not this board's behaviour. Record the gap and "
        "re-measure a second site before the model is trusted."))

    c["rubric"] = [
        {"criterion": "Ramp rate computed from the recorded interval", "points": 15, "steps": ["s1"]},
        {"criterion": "Time above liquidus compared with the paste window", "points": 15, "steps": ["s2"]},
        {"criterion": "Peak margin taken against the correct package class", "points": 15, "steps": ["s3"]},
        {"criterion": "Spread read from the three-site survey, not from the average peak",
         "points": 8, "steps": ["s2b"]},
        {"criterion": "Cooling rate computed and interpreted", "points": 10, "steps": ["s4"]},
        {"criterion": "Disposition judged on the worst site, not on the average", "points": 14, "steps": ["s5"]},
        {"criterion": "Model-versus-measurement check performed", "points": 10, "steps": ["s6"]},
        {"criterion": "Evidence ranked above the estimate", "points": 13, "steps": ["s7"]},
    ]
    cases.append(c)


    # =====================================================================
    # m08 — through-hole fill after the wave
    # =====================================================================
    # Board X's 20-pin THT connector. The hole and lead values are the ones the
    # m08l05 calculation drill already works (1.00 mm finished hole, 0.60 mm lead),
    # carried here so the case and the lesson cannot disagree. Both ends of the
    # tolerance are kept, because the point of the case is that the mean joint and
    # the worst joint are not the same joint.
    THT_HOLE_NOM = BOARD_FACTS["thtHoleNominalMm"]
    THT_HOLE_TOL = BOARD_FACTS["thtHoleToleranceMm"]
    THT_LEAD_NOM = 0.60
    THT_LEAD_TOL = 0.03
    THT_BOARD_MM = BOARD_FACTS["boardThicknessMm"]
    tht_hole_min = THT_HOLE_NOM - THT_HOLE_TOL
    tht_lead_max = THT_LEAD_NOM + THT_LEAD_TOL
    clr_nom = clearance(THT_HOLE_NOM, THT_LEAD_NOM)
    clr_worst = clearance(tht_hole_min, tht_lead_max)
    rad_worst = ((tht_hole_min - tht_lead_max) / 2.0, "mm",
                 "(%g-%g)/2" % (tht_hole_min, tht_lead_max),
                 {"hole_min_mm": tht_hole_min, "lead_max_mm": tht_lead_max})
    annulus_vol = annular_volume_mm3(THT_HOLE_NOM, THT_LEAD_NOM, THT_BOARD_MM)
    # The joint that failed at first article: same hole and lead, fill measured by
    # cross-section. 68.75 % is also what the m09l06 atlas drill computes.
    FILL_MEASURED_MM = 1.10
    fill_share = (FILL_MEASURED_MM / THT_BOARD_MM * 100.0, "%",
                  "%g/%g*100" % (FILL_MEASURED_MM, THT_BOARD_MM),
                  {"fill_mm": FILL_MEASURED_MM, "board_mm": THT_BOARD_MM})
    fill_required_mm = HOLE_FILL_MIN_PCT / 100.0 * THT_BOARD_MM
    fill_short_mm = (fill_required_mm - FILL_MEASURED_MM, "mm",
                     "0.75*%g-%g" % (THT_BOARD_MM, FILL_MEASURED_MM),
                     {"required_mm": fill_required_mm, "fill_mm": FILL_MEASURED_MM})

    c = {
        "caseId": "cx-m08-01",
        "moduleId": "m08",
        "title": "Through-hole fill: a connector joint measures 1.10 mm of 1.60 mm",
        "estMinutes": 25,
        "level": "core",
        "scenario": [
            "Board X carries one 20-pin THT connector on a 1.6 mm board. The land pattern "
            "calls for a 1.00 mm finished hole with a tolerance of 0.05 mm; the connector "
            "datasheet gives a 0.60 mm lead with a tolerance of 0.03 mm.",
            "First article after the wave shows the joint in the measurement sheet at 1.10 mm "
            "of vertical fill. The operator reports that most joints look full and asks for "
            "the build to be released.",
            "Decide the disposition against the applicable IPC-A-610 class, and say what the "
            "measurement sheet has to record so that the answer stops being a matter of who "
            "looked at the board.",
        ],
        "dataFiles": [
            {
                "name": "tht-joints.csv",
                "kind": "csv",
                "note": "Hole and lead diameters are the measured extremes on this build, not "
                        "the drawing nominals. Fill is the vertical barrel fill from "
                        "cross-section, as a share of the 1.6 mm board.",
                "content": (
                    "joint,part,hole_nominal_mm,hole_min_mm,hole_max_mm,"
                    "lead_nominal_mm,lead_max_mm,board_mm,fill_mm,fill_pct,"
                    "leads_on_thermal_plane\n"
                    "J-01,THT-20 pin connector,1.00,0.95,1.05,0.60,0.63,1.60,1.10,68.75,0\n"
                    "J-02,THT-20 pin connector,1.00,0.95,1.05,0.60,0.63,1.60,1.30,81.25,0\n"
                    "J-03,THT-20 pin connector,1.00,0.95,1.05,0.60,0.63,1.60,1.25,78.13,0\n"
                ),
            },
            {
                "name": "wave-run.csv",
                "kind": "csv",
                "note": "The settings the first article ran at. Contact time is the wave "
                        "width divided by conveyor speed.",
                "content": (
                    "run,flux,preheat_top_c,pot_c,wave_width_mm,conveyor_m_per_min,"
                    "contact_s,board_dir\n"
                    "FA-1,rosin mildly activated,105,255,50,1.5,2.0,connector upstream\n"
                ),
            },
        ],
        "steps": [],
        "rubric": [],
        "templates": [
            {"templateId": "tht-measure", "name": "Hole and lead measurement sheet",
             "status": "planned"},
            {"templateId": "wave-record", "name": "Wave solder process record",
             "status": "planned"},
        ],
        "toolLinks": [
            {"label": "Hole, lead and percent fill (lesson m08l02)", "href": "#/l/m08l02"},
            {"label": "Calculation drill: clearance and fill (lesson m08l05)", "href": "#/l/m08l05"},
            {"label": "Insufficient-fill diagnosis (lesson m09l06)", "href": "#/l/m09l06"},
        ],
        "sources": ["src-016", "src-001"],
        "generatedBy": "scripts/gen_cases.py",
    }

    add_step(c, step_numeric(
        "s1",
        "Using the measurement sheet, what is the nominal diametral clearance on J-01, "
        "in mm?",
        clr_nom, 0.005,
        ["Diametral clearance is the hole diameter minus the lead diameter.",
         "Nominal hole 1.00 mm, nominal lead 0.60 mm.",
         "1.00 - 0.60 = 0.40 mm."],
        "0.40 mm nominal, and the worst case is not that number.",
        "Take the finished hole diameter, not the drill diameter, then subtract the lead.",
        "1.00 - 0.60 = 0.40 mm of diametral clearance. The radial clearance is half of that, "
        "0.20 mm, which is the gap the solder has to climb through. The nominal case is the "
        "one the drawing shows; the joint that fails is rarely the nominal one."))

    add_step(c, step_numeric(
        "s2",
        "What is the worst-case tight diametral clearance, in mm: smallest finished hole "
        "against largest lead?",
        clr_worst, 0.005,
        ["Tight means the smallest hole against the largest lead.",
         "Hole 1.00 - 0.05 = 0.95 mm; lead 0.60 + 0.03 = 0.63 mm.",
         "0.95 - 0.63 = 0.32 mm."],
        "0.32 mm in the worst case, against 0.40 mm nominal.",
        "Both tolerances have to be used in their worst direction at the same time.",
        "A 0.95 mm hole with a 0.63 mm lead leaves 0.32 mm diametral, or 0.16 mm radial. The "
        "0.08 mm of clearance lost to tolerance is a fifth of the nominal gap, and it is what "
        "separates a full barrel from a stalled one on a cold joint."))

    add_step(c, step_numeric(
        "s3",
        "What is that worst-case radial clearance, in mm?",
        rad_worst, 0.005,
        ["Radial clearance is half the diametral clearance.",
         "0.32 / 2.",
         "0.16 mm."],
        "0.16 mm radially: the gap the solder draws through.",
        "Halve the diametral figure rather than repeating the subtraction.",
        "0.32 / 2 = 0.16 mm radially. That is the capillary gap: wide enough to fill when hole "
        "and lead are clean and hot, narrow enough that a low top-side temperature stops the "
        "flow before the barrel fills."))

    add_step(c, step_numeric(
        "s4",
        "At nominal diameters, what is the annular volume the solder has to fill through the "
        "1.6 mm board, in mm3? Use pi = 3.14159 and give two decimals.",
        annulus_vol, 0.01,
        ["The annulus is the hole cylinder minus the lead cylinder.",
         "pi * (0.5^2 - 0.3^2) * 1.6.",
         "pi * 0.16 * 1.6 = 0.80 mm3."],
        "0.80 mm3 of annulus; the 75 % minimum asks for 0.60 mm3 of solder in it.",
        "Subtract the lead cross-section from the hole cross-section before multiplying by "
        "thickness.",
        "The hole holds pi * 0.5^2 * 1.6 = 1.26 mm3 and the lead takes pi * 0.3^2 * 1.6 = "
        "0.45 mm3, leaving 0.80 mm3 of annulus. At the 75 % acceptance minimum the joint has "
        "to show 0.60 mm3 of solder to be acceptable at all."))

    add_step(c, step_numeric(
        "s5",
        "Cross-section shows 1.10 mm of fill on a 1.60 mm board. What is the vertical fill as "
        "a percentage? One decimal place.",
        fill_share, 0.2,
        ["Fill percentage is filled depth divided by board thickness.",
         "1.10 / 1.60.",
         "68.75 %."],
        "68.75 %, under the 75 % minimum.",
        "Divide the filled depth by the full board thickness and scale to percent.",
        "1.10 / 1.60 = 0.6875, so 68.75 %. The number matters because IPC-A-610 sets the "
        "minimum vertical barrel fill at 75 % for Class 2 and Class 3 alike; 68.75 % is a "
        "defect, not a cosmetic shortfall."))

    # s8 is the millimetre shortfall and is asked before the disposition (s6/s7): a
    # step added after them would sit below in the page order, and the numbering
    # would no longer follow the reading order. The ids are kept as first published
    # so a key CSV and a pilot sheet already in circulation stay valid.
    add_step(c, step_numeric(
        "s8",
        "The minimum is 75 % of the 1.60 mm board. How many millimetres of fill is J-01 "
        "short, in mm?",
        fill_short_mm, 0.01,
        ["Turn the percentage minimum into a depth first: 0.75 x 1.60 mm.",
         "1.20 mm required, 1.10 mm measured.",
         "0.10 mm short."],
        "0.10 mm short: a tenth of a millimetre, on a joint the operator called full.",
        "Convert the percentage to a depth before subtracting the measurement.",
        "The minimum depth is 0.75 * 1.60 = 1.20 mm and the joint has 1.10 mm, so it is "
        "0.10 mm short. Ten hundredths of a millimetre decide between a released build and a "
        "rework, which is why fill is measured on a cross-section rather than judged from the "
        "solder-side fillet."))

    add_step(c, step_choice(
        "s6",
        "What is the correct disposition of J-01?",
        [("a", "Accept it: 68.75 % is close to 75 % and the joint is electrically connected."),
         ("b", "Reject it against the 75 % minimum and rework it; every other joint in the "
               "sheet is judged on its own."),
         ("c", "Accept it under the thermal-plane exception for 14 or more leads."),
         ("d", "Accept it and raise the pot temperature by 10 °C so the next board fills "
               "further.")],
        "b",
        ["The minimum for Class 2 and Class 3 is the same number; which is it?",
         "The exception is for parts with 14 or more leads tied into internal thermal planes. "
         "The sheet records zero leads on a plane for this connector.",
         "68.75 % is below 75 %, so the joint fails."],
        "Reject J-01 and rework it: the 75 % minimum has no near-miss band.",
        "Which column in the sheet says whether this joint is acceptable?",
        "IPC-A-610 sets a 75 % minimum vertical fill for Class 2 and Class 3, and 68.75 % is "
        "below it. The 50 % / 1.2 mm figure is a documented exception for parts with fourteen "
        "or more leads tied into internal thermal planes; the sheet records zero leads on a "
        "plane, so the exception does not apply. Raising the pot temperature to rescue one "
        "joint changes every other joint on the board and leaves the mechanism in place."))

    add_step(c, step_choice(
        "s7",
        "The other joints read 81.25 % and 78.13 %. What is the defensible reading of the "
        "sheet?",
        [("a", "The build passes: the mean of the three joints is 76.04 %, above 75 %."),
         ("b", "The build fails on J-01, and the sheet has to record each joint so the failing "
               "one cannot be averaged away."),
         ("c", "The build passes because two joints out of three are above the minimum."),
         ("d", "The build passes once J-01 is re-inspected by a second operator.")],
        "b",
        ["Averaging is exactly the mistake this sheet exists to prevent.",
         "One joint below the minimum is a defect on that joint, whatever the mean is.",
         "Judge every joint: the average of acceptable and unacceptable is unacceptable."],
        "Judge joint by joint. J-01 fails, and a mean cannot repair it.",
        "Ask what the average would hide if the sheet recorded only a mean.",
        "The mean of 68.75, 81.25 and 78.13 is 76.04 %, which clears 75 % and hides the defect. "
        "Acceptance in IPC-A-610 is per joint, so the sheet must carry every joint; a summary "
        "that reports only an average cannot show which barrel is short. It is the same "
        "mistake as judging a reflow profile by its mean peak."))

    add_step(c, step_choice(
        "s9",
        "What control actually addresses the short fill, given the wave record?",
        [("a", "Raise the conveyor speed so the board spends less time in the wave."),
         ("b", "Raise preheat so the top side of the hole reaches a temperature that lets the "
               "solder climb, and verify dwell and contact time against the equipment limits."),
         ("c", "Add flux by hand at the connector before the wave."),
         ("d", "Accept the fill and add 100 % X-ray inspection.")],
        "b",
        ["Look at the wave record: contact time is 2.0 s, the bottom of the 2-4 s window the "
         "course teaches.",
         "A short fill on a clean, wetted joint points at the thermal side of the process, not "
         "at solder volume.",
         "Preheat and dwell decide whether the barrel fills; inspection only finds it later."],
        "Raise preheat and check dwell against the equipment limits. Inspection after the fact "
        "does not fill a barrel.",
        "Which setting in wave-run.csv sits at the edge of its window?",
        "Contact time is 2.0 s, the very bottom of the 2-4 s window, and top-side preheat is "
        "105 °C in a 90-120 °C band: both at the weak end for a connector that acts as a heat "
        "sink. Raising preheat and lengthening contact inside equipment limits addresses the "
        "mechanism. Speeding the conveyor shortens contact and makes it worse, and adding "
        "X-ray only proves the defect exists on every board after the cost is sunk."))

    c["spec"] = [
        {"label": "Minimum barrel fill", "value": HOLE_FILL_MIN_PCT, "unit": "%",
         "note": "IPC-A-610, Class 2 and Class 3 alike (m08l05)"},
        {"label": "Thermal-plane exception", "value": HOLE_FILL_EXCEPTION_PCT, "unit": "%",
         "note": "Documented exception for 14 or more leads in internal planes (m08l05)"},
        {"label": "Contact time", "value": WAVE_CONTACT_MIN_S, "to": WAVE_CONTACT_MAX_S,
         "unit": "s", "note": "Course window for wave contact (m09l07)"},
    ]

    c["rubric"] = [
        {"criterion": "Nominal clearance computed from finished diameters, not from the drill",
         "points": 10, "steps": ["s1"]},
        {"criterion": "Worst-case clearance built from both tolerances at once",
         "points": 15, "steps": ["s2"]},
        {"criterion": "Radial clearance derived from the diametral figure", "points": 10,
         "steps": ["s3"]},
        {"criterion": "Annular volume computed as hole minus lead, in the right unit",
         "points": 15, "steps": ["s4"]},
        {"criterion": "Fill percentage computed against the board thickness", "points": 10,
         "steps": ["s5"]},
        {"criterion": "Shortfall in millimetres derived from the percentage minimum",
         "points": 10, "steps": ["s8"]},
        {"criterion": "Joint judged against 75 %, with the exception ruled out on evidence",
         "points": 15, "steps": ["s6"]},
        {"criterion": "Each joint judged on its own, not on the average", "points": 10,
         "steps": ["s7"]},
        {"criterion": "Control chosen that matches the mechanism, not the inspection",
         "points": 5, "steps": ["s9"]},
    ]
    cases.append(c)


    # =====================================================================
    # m09 — the wave run that produced the short fill
    # =====================================================================
    # The same first article the m08 case judges, read from the process side:
    # what the record says, what the pot temperature means for SAC305, and what
    # the bridge on the connector says about volume rather than wetting.
    WAVE_POT_C = 255.0
    WAVE_PREHEAT_C = 105.0
    WAVE_WAVE_MM = 50.0
    WAVE_SPEED_MPM = 1.5
    wave_contact = ((WAVE_WAVE_MM / 1000.0) / (WAVE_SPEED_MPM / 60.0), "s",
                    "(%g/1000)/(%g/60)" % (WAVE_WAVE_MM, WAVE_SPEED_MPM),
                    {"wave_mm": WAVE_WAVE_MM, "speed_m_per_min": WAVE_SPEED_MPM})
    wave_margin = ((WAVE_POT_C - BOARD_FACTS["liquidusC"], "°C",
                    "%g-%g" % (WAVE_POT_C, BOARD_FACTS["liquidusC"]),
                    {"pot_c": WAVE_POT_C, "liquidus_c": BOARD_FACTS["liquidusC"]}))
    # A bridge on the 20-pin connector: 3.2 mm of solder bridging 2.54 mm of pitch.
    # The other eighteen pins of the first article, as cross-sections read them.
    # Declared as pairs so the file and any check of it read the same numbers.
    WAVE_PASSING_FILL = [
        (3, 78.13), (4, 80.00), (5, 81.25), (6, 79.38), (7, 76.88), (8, 82.50),
        (9, 78.75), (10, 80.63), (11, 77.50), (12, 79.38), (13, 81.88), (14, 78.13),
        (15, 80.00), (16, 76.25), (17, 79.38), (18, 81.25), (19, 77.50), (20, 80.63),
    ]
    BRIDGE_SPAN_MM = 3.2
    BRIDGE_PITCH_MM = 2.54
    bridge_ratio = (BRIDGE_SPAN_MM / BRIDGE_PITCH_MM, "dimensionless",
                    "%g/%g" % (BRIDGE_SPAN_MM, BRIDGE_PITCH_MM),
                    {"span_mm": BRIDGE_SPAN_MM, "pitch_mm": BRIDGE_PITCH_MM})

    c = {
        "caseId": "cx-m09-01",
        "moduleId": "m09",
        "title": "Wave run FA-1: a short barrel on one joint and a bridge on another",
        "estMinutes": 25,
        "level": "core",
        "scenario": [
            "The wave run that produced the m08 first article is recorded in wave-run.csv: "
            "rosin mildly activated flux, 105 °C top-side preheat, a 255 °C pot, a 50 mm wave "
            "and 1.5 m/min conveyor on a single-wave machine. The connector ran upstream.",
            "Two findings came off the same board. J-01 is short of fill at 1.10 mm of a "
            "1.60 mm barrel. On the neighbouring pin a 3.2 mm solder bridge spans a 2.54 mm "
            "pitch. The line wants one explanation for both, and the fastest one is 'the "
            "solder pot is too cold'.",
            "Check the record against the course's wave windows, then decide what to change "
            "and in what order.",
        ],
        "dataFiles": [
            {
                "name": "wave-run.csv",
                "kind": "csv",
                "note": "One board, one pass. contact_s is the wave width divided by the "
                        "conveyor speed; the course window for contact time is 2-4 s.",
                "content": (
                    "run,flux,preheat_top_c,pot_c,wave_width_mm,conveyor_m_per_min,"
                    "contact_s,board_dir\n"
                    "FA-1,rosin mildly activated,105,255,50,1.5,2.0,connector upstream\n"
                ),
            },
            {
                "name": "joint-findings.csv",
                "kind": "csv",
                "note": "The whole connector, one row per pin: all 20 joints of the first "
                        "article, not only the two that failed. Fill is vertical barrel fill "
                        "from cross-section; span and pitch are filled in only where a "
                        "bridge was measured.",
                "content": (
                    "joint,defect,fill_pct,span_mm,pitch_mm,side\n"
                    "J-01,insufficient fill,68.75,,,solder side\n"
                    "J-02,bridge,,3.20,2.54,solder side\n"
                    + "".join("J-%02d,,%.2f,,,solder side\n" % (n, fill)
                              for n, fill in WAVE_PASSING_FILL)) ,
            },
        ],
        "steps": [],
        "rubric": [],
        "templates": [
            {"templateId": "wave-record", "name": "Wave solder process record",
             "status": "planned"},
        ],
        "toolLinks": [
            {"label": "Wave process control (lesson m09l07)", "href": "#/l/m09l07"},
            {"label": "Wave defect atlas (lesson m09l06)", "href": "#/l/m09l06"},
            {"label": "Preparing the board for the wave (lesson m08l04)", "href": "#/l/m08l04"},
        ],
        "sources": ["src-001", "src-016"],
        "generatedBy": "scripts/gen_cases.py",
    }

    add_step(c, step_numeric(
        "s1",
        "The wave is 50 mm wide and the conveyor runs at 1.5 m/min. What is the contact "
        "time, in seconds?",
        wave_contact, 0.1,
        ["Convert both lengths to the same unit before dividing.",
         "50 mm = 0.050 m; 1.5 m/min = 0.025 m/s.",
         "0.050 / 0.025 = 2.0 s."],
        "2.0 s: inside the 2-4 s window, but at the bottom of it.",
        "Divide the wave width in metres by the conveyor speed in metres per second.",
        "0.050 m of wave over 0.025 m/s of board travel gives 2.0 s of contact. The course "
        "window is 2-4 s, so the run is legal, and the board passes through in the shortest "
        "time the window allows. For a connector that acts as a heat sink that is the first "
        "thing to look at, not the pot temperature."))

    add_step(c, step_numeric(
        "s2",
        "The pot runs at 255 °C. What is that above the SAC305 liquidus of 219 °C, in °C?",
        wave_margin, 0.5,
        ["Liquidus is the temperature the alloy must exceed, not a target.",
         "255 - 219.",
         "36 °C above liquidus."],
        "36 °C above liquidus: the pot is hot, not cold.",
        "Subtract the liquidus from the pot temperature, not the other way round.",
        "255 - 219 = 36 °C. The course's own window for SAC305 pots is 250-260 °C, so the pot "
        "sits in the middle of it. The hypothesis that a cold pot explains the short fill is "
        "contradicted by the record before anyone touches a knob."))

    add_step(c, step_choice(
        "s3",
        "The record is inside every window: pot 255 °C, contact 2.0 s, flux correct. Which "
        "pair of settings is actually weak for a heat-sinking connector?",
        [("a", "The pot temperature and the flux type."),
         ("b", "The top-side preheat, at 105 °C, and the contact time, at the floor of its "
               "window."),
         ("c", "The conveyor speed, which is far too slow."),
         ("d", "Nothing: the settings are fine and the defect must be incoming material.")],
        "b",
        ["The course's preheat range is 90-120 °C top side; where in that band is 105 °C?",
         "A connector pulls heat out of the joint, so the thermal side needs margin, not the "
         "bare minimum.",
         "Preheat and contact time carry the fill, and both are at the weak end."],
        "Top-side preheat (105 °C) and contact time (2.0 s) are the weak settings.",
        "Which two numbers in the record sit at the bottom of their windows?",
        "Pot temperature is mid-window and flux is the right family for this board, so neither "
        "explains anything. Preheat at 105 °C is in the lower half of the 90-120 °C band and "
        "contact time is at the 2.0 s floor, on a part that conducts heat away from the joint. "
        "A theory that needs a defect in the material ignores two settings that are already at "
        "the weak end of the only windows the course gives."))

    add_step(c, step_numeric(
        "s4",
        "The bridge on J-02 spans 3.20 mm across a 2.54 mm pitch. How many pitches does the "
        "bridge cover? Two decimals.",
        bridge_ratio, 0.02,
        ["One pitch is the centre-to-centre distance between adjacent pins.",
         "3.20 / 2.54.",
         "1.26 pitches: it reaches past the neighbour."],
        "1.26 pitches: the bridge is not a whisker, it is a pool.",
        "Divide the span by the pitch; the units cancel.",
        "3.20 / 2.54 = 1.26. A bridge that covers more than one pitch is a volume and drainage "
        "problem, not a fine-pitch whisker: solder sat on the board long enough to pool between "
        "two pads. On the same board, one joint is short and the neighbour is flooded, which "
        "is what uneven wetting and drainage looks like."))

    add_step(c, step_choice(
        "s5",
        "One joint is short and its neighbour is flooded on the same pass. What does that "
        "pair of findings point to?",
        [("a", "A single cause: the pot is too cold, so some joints do not fill and some "
               "flood."),
         ("b", "A wetting and drainage problem around one component: the joint that did not "
               "reach temperature stayed short, and solder pooled where drainage was poor."),
         ("c", "Two unrelated random defects; no action is possible."),
         ("d", "A bad batch of connectors, since both findings are on the same part.")],
        "b",
        ["A cold pot would make every joint worse, and the record says the pot is not cold.",
         "Short fill and a pool on the same connector come from an uneven thermal and flow "
         "field, not from the solder temperature.",
         "The mechanism has to explain both findings at once, or it is not the mechanism."],
        "An uneven thermal and drainage field around one component: one pin too cold to fill, "
        "its neighbour with nowhere to drain.",
        "Which explanation accounts for a short barrel and a flooded neighbour at the same "
        "time?",
        "A cold pot affects the whole board, and the other joints on this board fill to 78-81 %. "
        "Two findings two pins apart on the same part are a local thermal and flow problem: "
        "the connector shields the wave and pulls heat from its own joints, so one barrel "
        "stalls while solder pools where it cannot drain. Naming one mechanism that explains "
        "both findings is the difference between a fix and an experiment."))

    add_step(c, step_choice(
        "s6",
        "Which single change should be made first, so that its effect can be measured?",
        [("a", "Raise the pot temperature from 255 to 270 °C and shorten the contact time."),
         ("b", "Raise top-side preheat within the 90-120 °C band and lengthen contact toward "
               "the middle of the 2-4 s window, then re-run one board and re-measure."),
         ("c", "Change the flux to water-soluble and keep every other setting."),
         ("d", "Add a pallet and keep every setting, so the board is supported better.")],
        "b",
        ["One change at a time is what makes the next measurement mean something.",
         "The two weak settings are thermal: preheat and contact time.",
         "Raise preheat, lengthen contact inside the window, re-run one board."],
        "Raise preheat and lengthen contact inside their windows, one board, then re-measure.",
        "Which change touches the settings the record already flags as weak?",
        "Preheat and contact time are the two settings at the weak end and they act on the same "
        "mechanism: heat in the barrel and time for solder to climb. Changing flux, pallet and "
        "pot at once makes the result unattributable, and 270 °C is above the course's 250-260 °C "
        "SAC305 window with no evidence that heat is the binding constraint. One change, one "
        "board, one measurement is how a wave process is qualified."))

    add_step(c, step_numeric(
        "s7",
        "The first-article sheet covers every pin of the connector. What percentage of its "
        "joints is nonconforming against the 75 % minimum? One decimal.",
        (1.0 / 20.0 * 100.0, "%", "1/20*100", {"failed": 1, "joints": 20}), 0.1,
        ["The denominator is every joint on the sheet, not only the ones that failed.",
         "Count the rows first: the connector has twenty joints.",
         "1 / 20 = 5.0 %."],
        "5.0 % of the connector's joints: one pin in twenty.",
        "Divide the failing joints by the joints inspected.",
        "1 / 20 = 5.0 %. On a sample this small a single joint is five percent, which is why "
        "first-article acceptance is per joint and why a run of three boards is not a process "
        "capability study. The number is small and the joint is still a defect."))

    add_step(c, step_choice(
        "s8",
        "The supplier asks whether the whole lot should be rejected. What does the record "
        "support?",
        [("a", "Reject the lot: one nonconforming joint condemns every board."),
         ("b", "Contain the boards that have run, fix the process settings, re-qualify with a "
               "first article, and judge the lot against the re-qualified process rather than "
               "against one joint."),
         ("c", "Release the lot: 5 % of one connector is trivial."),
         ("d", "Release the lot and inspect 100 % by eye, since the defect is visible.")],
        "b",
        ["A single joint is evidence about the process, not a measurement of the lot.",
         "Containment first, then a process fix, then re-qualification: the same order as an "
         "8D.",
         "The lot is judged against the corrected process, not against the finding that "
         "started the investigation."],
        "Contain what has run, fix the settings, re-qualify the process, then judge the lot.",
        "Which decision does one joint actually support: a lot verdict, or a process verdict?",
        "One joint on a three-board first article is a process signal. Containment holds the "
        "boards that ran, the settings get corrected and proven on a first article, and only "
        "then does the lot get judged. Rejecting everything on one joint is as unjustified as "
        "releasing everything on 5 %, and a 100 % visual check cannot measure barrel fill: the "
        "short barrel is on the underside of the joint."))

    c["spec"] = [
        {"label": "Pot temperature, SAC305", "value": 250, "to": 260, "unit": "°C",
         "note": "Course window for wave pots (m09l07)"},
        {"label": "Contact time", "value": WAVE_CONTACT_MIN_S, "to": WAVE_CONTACT_MAX_S,
         "unit": "s", "note": "Course window (m09l07)"},
        {"label": "Top-side preheat", "value": 90, "to": 120, "unit": "°C",
         "note": "Course band (m09l07)"},
    ]

    c["rubric"] = [
        {"criterion": "Contact time computed from wave width and conveyor speed",
         "points": 15, "steps": ["s1"]},
        {"criterion": "Pot margin over liquidus computed and judged against the SAC305 window",
         "points": 10, "steps": ["s2"]},
        {"criterion": "Weak settings identified from the record, not assumed",
         "points": 15, "steps": ["s3"]},
        {"criterion": "Bridge span expressed in pitches", "points": 10, "steps": ["s4"]},
        {"criterion": "One mechanism named that explains both findings", "points": 15,
         "steps": ["s5"]},
        {"criterion": "One change at a time, inside the published windows", "points": 15,
         "steps": ["s6"]},
        {"criterion": "Nonconforming share computed on joints, not boards", "points": 10,
         "steps": ["s7"]},
        {"criterion": "Lot decision separated from the process decision", "points": 10,
         "steps": ["s8"]},
    ]
    cases.append(c)


    # =====================================================================
    # m07 — the AOI audit and the X-ray it sent to the bench
    # =====================================================================
    # The audit numbers are the m07l03 drill's, so the lesson and the case cannot
    # drift: 12,000 boards, 360 rejects, 300 verified (210 true, 90 false) and 18
    # escapes. The X-ray rows carry the m07l04 drill's 0.45 mm ball plus the
    # balls around it, so the void percentage is a calculation over a table.
    AOI_BOARDS = 12000
    AOI_CALLS = 360
    AOI_VERIFIED = 300
    AOI_FALSE = 90
    AOI_TRUE = 210
    AOI_ESCAPES = 18
    # Rows of aoi-audit.csv: (window, boards, calls, verified, true, false, escapes).
    # The totals below are derived from these rows, and the rows are checked
    # against the drill's arithmetic before anything is computed from them: a
    # typo in a table like this would otherwise become a passing key.
    AOI_WINDOWS = [("W-36", 3000, 90, 75, 53, 22, 5),
                   ("W-37", 3000, 90, 75, 53, 22, 4),
                   ("W-38", 3000, 90, 75, 52, 23, 5),
                   ("W-39", 3000, 90, 75, 52, 23, 4)]
    for _w in AOI_WINDOWS:
        assert _w[4] + _w[5] == _w[3], "true + false calls must equal verified calls"
        assert _w[3] <= _w[2], "verified calls cannot exceed calls raised"
    _tot = lambda i: sum(r[i] for r in AOI_WINDOWS)
    assert _tot(1) == AOI_BOARDS, "audit rows do not cover 12,000 boards"
    assert _tot(2) == AOI_CALLS, "audit calls do not add up"
    assert _tot(3) == AOI_VERIFIED, "verified calls do not add up"
    assert _tot(4) == AOI_TRUE, "true calls do not add up"
    assert _tot(5) == AOI_FALSE, "false calls do not add up"
    assert _tot(6) == AOI_ESCAPES, "escapes do not add up"

    aoi_coverage = share_of(AOI_VERIFIED, AOI_CALLS)
    aoi_false_rate = share_of(AOI_FALSE, AOI_VERIFIED)
    aoi_escape_rate = share_of(AOI_ESCAPES, AOI_BOARDS)
    aoi_escape_rate_verified = share_of(AOI_ESCAPES, AOI_TRUE + AOI_ESCAPES)
    # One board carries the worst ball on the panel: 0.45 mm ball, a 0.28 mm void
    # and a second 0.14 mm void. Cumulative area, exactly as the criterion reads.
    BALL_MM = 0.45
    VOIDS_MM = [0.28, 0.14]
    ball_area = math.pi * (BALL_MM / 2.0) ** 2
    void_area = sum(math.pi * (d / 2.0) ** 2 for d in VOIDS_MM)
    void_pct = (void_area / ball_area * 100.0, "%",
                "sum(pi*(d/2)^2)/ (pi*(%g/2)^2)*100" % BALL_MM,
                {"ball_mm": BALL_MM, "voids_mm": VOIDS_MM})

    c = {
        "caseId": "cx-m07-01",
        "moduleId": "m07",
        "title": "AOI audit: a 70 % true-call rate that still let 18 defects through",
        "estMinutes": 30,
        "level": "advanced",
        "scenario": [
            "Board X ran twelve thousand boards through AOI. The audit log for four windows is "
            "in aoi-audit.csv: boards inspected, calls raised, calls verified, true defects, "
            "false calls and the defects found later by test, X-ray and visual audit.",
            "The line reads the numbers optimistically: most of the calls were real, so the "
            "program is good. Quality has the opposite worry: eighteen defects left the line "
            "after AOI, and one of the X-ray follow-ups on a BGA ball looks bad.",
            "Compute the three rates that matter, say what they do and do not prove, and judge "
            "the ball in xray-bga.csv against the applicable limit.",
        ],
        "dataFiles": [
            {
                "name": "aoi-audit.csv",
                "kind": "csv",
                "note": "One row per review window. true_calls + false_calls = "
                        "verified_calls, and verified calls are a subset of the calls raised; "
                        "escapes are defects AOI did not call that were found later.",
                "content": (
                    "window,boards,calls,verified_calls,true_calls,false_calls,escapes\n" +
                    "".join("%s,%d,%d,%d,%d,%d,%d\n" % w for w in AOI_WINDOWS)
                ),
            },
            {
                "name": "xray-bga.csv",
                "kind": "csv",
                "note": "Measured diameters from the X-ray image, one row per ball, as projected "
                        "areas on the image. A ball may carry more than one void: the criterion "
                        "counts their cumulative area, not the largest one. Diameters are "
                        "read as equivalent-circle diameters.",
                "content": (
                    "ball,ball_d_mm,void1_d_mm,void2_d_mm,location\n"
                    "A1,0.45,0.28,0.14,edge\n"
                    "A2,0.45,0.10,,centre\n"
                    "A3,0.45,0.12,0.06,centre\n"
                    "A4,0.45,0.32,,edge\n"
                ),
            },
        ],
        "steps": [],
        "rubric": [],
        "templates": [
            {"templateId": "aoi-audit", "name": "AOI and X-ray audit log", "status": "planned"},
            {"templateId": "xray-void", "name": "X-ray void record", "status": "planned"},
        ],
        "toolLinks": [
            {"label": "AOI metrics and verification (lesson m07l03)", "href": "#/l/m07l03"},
            {"label": "X-ray interpretation (lesson m07l04)", "href": "#/l/m07l04"},
            {"label": "False calls and escapes are linked (lesson m07l02)", "href": "#/l/m07l02"},
        ],
        "sources": ["src-001", "src-007"],
        "generatedBy": "scripts/gen_cases.py",
    }

    add_step(c, step_numeric(
        "s1",
        "What was the verification coverage, in percent: verified calls over the calls AOI "
        "raised? One decimal.",
        aoi_coverage, 0.2,
        ["Coverage is about the calls that were reviewed, not about the boards.",
         "Add the verified_calls column and divide by the calls column.",
         "300 / 360 = 83.3 %."],
        "83.3 % of the calls were verified; the remaining 60 were never looked at.",
        "Verified calls over total calls, from the columns in the audit log.",
        "300 of 360 calls were verified, so coverage is 83.3 %. That number matters more than "
        "it looks: every rate computed from the verified subset is an estimate for the whole "
        "population, and the 60 unverified calls are an unknown. A false-call rate quoted "
        "without its coverage is a number with no error bar."))

    add_step(c, step_numeric(
        "s2",
        "What is the false-call rate among verified calls, in percent? One decimal.",
        aoi_false_rate, 0.2,
        ["The denominator is the calls that were verified, not the calls raised.",
         "90 / 300.",
         "30.0 %."],
        "30.0 % of verified calls were good boards.",
        "False calls over verified calls; the raised calls belong in coverage, not here.",
        "90 of 300 verified calls were false, so 30.0 %. Not 25 % (that would divide by the "
        "360 raised) and not 0.75 % (that would divide by the boards). Three different "
        "denominators give three different-looking programs out of the same week, which is why "
        "the definition has to travel with the number."))

    add_step(c, step_numeric(
        "s3",
        "What is the escape rate at board level, in percent? Give two decimals.",
        aoi_escape_rate, 0.02,
        ["Escape rate is defects found after AOI over the units inspected.",
         "18 / 12000.",
         "0.15 %."],
        "0.15 % of boards carried a defect AOI did not call.",
        "Defects found later, over boards inspected: not over the calls.",
        "18 / 12,000 = 0.15 %. That is the number a customer will ask for, and it is a board "
        "rate: it says nothing about which joint failed. The same 18 defects could sit in 18 "
        "boards at one joint each, or in one board at 18 joints, and a joint-level escape rate "
        "would answer a different question."))

    add_step(c, step_numeric(
        "s4",
        "Quality wants the escape rate against the defects AOI actually caught. Using verified "
        "true calls and escapes, what is that rate, in percent? One decimal.",
        aoi_escape_rate_verified, 0.2,
        ["The denominator is the opportunities AOI judged: true calls plus escapes.",
         "210 true calls, 18 escapes.",
         "18 / 228 = 7.9 %."],
        "7.9 % of the judged defects escaped AOI.",
        "True calls are the verified calls minus the false calls; add the escapes to them.",
        "210 true calls plus 18 escapes is 228 found defects, so 18 / 228 = 7.9 %. This is the "
        "share of defects that AOI missed, and it is two orders of magnitude larger than the "
        "board-level rate. Both are true; they answer different questions, and reporting only "
        "the flattering one is how an escape problem stays invisible."))

    add_step(c, step_choice(
        "s5",
        "Using the audit rows, 210 of the 300 verified calls were real defects and 90 were not. "
        "What is the correct reading of that result?",
        [("a", "Accept the program: a 70 % true-call rate is a good result on its own."),
         ("b", "The program still has a 30 % false-call rate that costs review capacity and a "
               "7.9 % escape rate on judged defects; the true-call rate alone proves neither "
               "capacity nor coverage."),
         ("c", "Reject the program: any escape means AOI is not fit for purpose."),
         ("d", "Tighten every threshold until the escape rate is zero.")],
        "b",
        ["A true-call rate is one ratio; the cost of review and the cost of escapes are two "
         "others.",
         "False calls consume operator attention, and attention is what makes a 30 % rate "
         "dangerous.",
         "Judge the program on false calls, escapes and coverage together, not on the "
         "flattering ratio."],
        "Only 70 % of verified calls were real defects, 90 false calls burn reviewer attention, "
        "and 7.9 % of judged defects escaped.",
        "Which two costs does the true-call rate leave out?",
        "A 70 % true-call rate is arithmetic, not a verdict. The same week produced 90 false "
        "calls that had to be reviewed by hand and 18 defects that left the line. False calls "
        "are not free: they train operators to clear calls quickly, which is exactly how the "
        "next escape happens. Tightening every threshold to chase zero escapes moves the cost "
        "to review capacity and, at some point, to people dismissing calls without looking. "
        "The program is judged on all three rates and on what the customer needs."))

    add_step(c, step_numeric(
        "s6",
        "Ball A1 measures 0.45 mm and carries two voids, 0.28 mm and 0.14 mm. What is the "
        "cumulative void area as a percentage of the ball area? One decimal.",
        void_pct, 0.2,
        ["Area scales with the square of the diameter, so two voids do not add as diameters.",
         "Sum the void areas first, then divide by the ball area.",
         "(0.28^2 + 0.14^2) / 0.45^2 = 48.4 %."],
        "48.4 % of the ball area — nearly double the limit.",
        "Sum the void areas, not the diameters, and divide by the full ball area.",
        "The voids have radii 0.14 mm and 0.07 mm, so their areas are pi*0.0196 = 0.0616 mm2 "
        "and pi*0.0049 = 0.0154 mm2, 0.0770 mm2 together. The ball has radius 0.225 mm and an "
        "area of pi*0.0506 = 0.1590 mm2. 0.0770 / 0.1590 = 48.4 %, which is nearly twice the "
        "25 % limit. The arithmetic shortcut is to divide squares of diameters, since pi "
        "cancels: (0.28^2 + 0.14^2) / 0.45^2 gives the same 48.4 %. What the step is really "
        "testing is that two voids add as areas: adding the diameters would give a plausible "
        "and wrong 42 %."))

    add_step(c, step_choice(
        "s7",
        "Against the 25 % per-ball criterion, what is the disposition of ball A1?",
        [("a", "Accept: the largest single void is 0.28 mm, which is under half the ball."),
         ("b", "Reject the ball: the cumulative void area is far above 25 % of the ball area, "
               "and the criterion counts cumulative area per ball, not the largest void."),
         ("c", "Accept: voids at the ball edge drain better than central voids."),
         ("d", "Accept and average the four balls: the array as a whole is under 25 %.")],
        "b",
        ["The criterion is cumulative projected area per ball, in an X-ray image.",
         "Two voids both count; the diameter of the larger one is not the measure.",
         "A ball over the limit fails on its own, whatever the rest of the array reads."],
        "Reject the ball: cumulative void area is well over 25 %, and the limit is per ball.",
        "Which of the four numbers in the sentence is the criterion written against?",
        "The limit is cumulative projected void area against ball area, per ball, and A1 is far "
        "over it. Comparing one void's diameter with the ball's diameter is a different "
        "calculation that happens to look reassuring. Edge location is a reliability concern "
        "on top of the area, not a credit against it, and averaging across the array would let "
        "a failing ball hide behind three good ones — the same averaging error as in m06 and "
        "m08."))

    add_step(c, step_numeric(
        "s8",
        "Ball A2 carries one 0.10 mm void in a 0.45 mm ball. What is its void percentage? "
        "One decimal.",
        (math.pi * 0.05 ** 2 / (math.pi * 0.225 ** 2) * 100.0, "%", "(0.10/0.45)^2*100",
         {"ball_mm": 0.45, "void_mm": 0.10}), 0.1,
        ["With circular voids in one ball, the area ratio is the square of the diameter ratio.",
         "(0.10 / 0.45)^2 x 100.",
         "4.9 %."],
        "4.9 %: a void this size is inside the limit, not a defect.",
        "Square the diameter ratio; the pi cancels.",
        "(0.10 / 0.45)^2 = 0.0494, so 4.9 %. Small central voids are common and the criterion "
        "is not a zero-void rule: chasing a void-free joint costs rework and heat cycles and "
        "buys nothing the standard asks for. The judgement is A1 fails and A2 passes, on the "
        "same board, which is what per-ball criteria are for."))

    add_step(c, step_choice(
        "s9",
        "What does the X-ray finding change about the AOI program?",
        [("a", "Nothing: voids under a BGA are invisible to AOI, so it is a separate issue."),
         ("b", "It confirms the escape question: AOI cannot see under the package, so the "
               "hidden-joint sample has to be defined in the program rather than assumed to be "
               "covered by the AOI call rate."),
         ("c", "It means AOI should be replaced by X-ray on every board."),
         ("d", "It means the AOI thresholds were too loose and must be tightened.")],
        "b",
        ["Ask what AOI can physically see: component presence, fillet shape, exposed joints.",
         "A BGA ball is behind the package, so no AOI threshold reaches it.",
         "The program's coverage claim has to name the method that covers each defect class."],
        "It defines a gap in coverage: hidden joints need their own sample, not a tighter AOI "
        "threshold.",
        "Which defect classes in this case could AOI never have called?",
        "AOI sees what the camera sees, and a BGA ball is under the package. The 18 escapes and "
        "the failed ball are the same lesson from two directions: the program's coverage claim "
        "has to be written per defect class, with X-ray or another method named for the hidden "
        "ones. Tightening AOI thresholds cannot find a void under an opaque package, and "
        "X-raying every board is a cost decision, not a threshold decision."))

    add_step(c, step_choice(
        "s10",
        "The failing ball is on the same Board X assembly that already carries the 8D from the "
        "AOI case. What belongs in that 8D, on this evidence?",
        [("a", "An action to tighten the AOI void threshold, since AOI is the inspection step."),
         ("b", "A containment of the affected boards plus a process action on the reflow and "
               "paste side, with the X-ray sample defined so the escape is measured rather than "
               "assumed."),
         ("c", "A note that voids are normal and no action is needed."),
         ("d", "An action to reject the whole lot on one ball.")],
        "b",
        ["An AOI threshold cannot see a void under the package, so it cannot be the action.",
         "The 8D needs containment, a cause on the process, and a measurement that will show "
         "whether the action worked.",
         "Contain, act on the process, define the X-ray sample that measures the escape."],
        "Containment, a process action on reflow and paste, and an X-ray sample that measures "
        "the escape.",
        "Which of these actions could actually change the void percentage?",
        "A void forms inside the joint during reflow: paste chemistry, profile and the escape "
        "path for volatiles decide its size, so the process action lives on that side. AOI "
        "cannot see it at all, so a tighter AOI threshold changes nothing. Containment holds "
        "the boards already built, and the X-ray sample is what turns 'we re-inspected' into a "
        "number the 8D can be closed against — the same rule m14 applies when it refuses to "
        "close an 8D on an improvement instead of the agreed metric."))

    c["spec"] = [
        {"label": "Void limit per BGA ball", "value": BGA_VOID_MAX_PCT, "unit": "%",
         "note": "Cumulative projected area, per ball, X-ray image (m07l04)"},
        {"label": "Verification coverage", "value": round(AOI_VERIFIED / AOI_CALLS * 100, 1),
         "unit": "%", "note": "Verified calls over calls raised, this window"},
        {"label": "Escape rate", "value": round(aoi_escape_rate[0], 2), "unit": "%",
         "note": "Defects found later over boards inspected"},
    ]

    c["rubric"] = [
        {"criterion": "Coverage computed on calls, with its consequence stated", "points": 10,
         "steps": ["s1"]},
        {"criterion": "False-call rate computed on verified calls, not on raised calls",
         "points": 10, "steps": ["s2"]},
        {"criterion": "Board-level escape rate computed on boards", "points": 10, "steps": ["s3"]},
        {"criterion": "Escape rate against judged defects computed on a matching denominator",
         "points": 15, "steps": ["s4"]},
        {"criterion": "Program judged on false calls, escapes and coverage together",
         "points": 15, "steps": ["s5"]},
        {"criterion": "Cumulative void area computed per ball, not from the largest void",
         "points": 15, "steps": ["s6", "s8"]},
        {"criterion": "Ball rejected on the per-ball criterion, not averaged over the array",
         "points": 10, "steps": ["s7"]},
        {"criterion": "Hidden-joint gap named as a coverage problem, not a threshold problem",
         "points": 5, "steps": ["s9"]},
        {"criterion": "8D action placed on the process, with a sample that measures the escape",
         "points": 10, "steps": ["s10"]},
    ]
    cases.append(c)


    # =====================================================================
    # m11 — the rework the m08 and m09 cases made necessary
    # =====================================================================
    # J-01 from the m08 case is reworked by hand, a trace was nicked during the
    # removal, and the board is a Class 2 board. Every limit here is a standard
    # number the generator does not own: 20 % conductor reduction and 0.050 mm
    # annular ring for Class 3 come from IPC-A-600 (src-022) and are carried on
    # Board X, so the case reads the class rather than remembering a figure.
    # One row per assembly: (assembly, operation, tip, setpoint, preheat, contacts,
    # dwells, trace mm, dry flag). The dwells are one column each, so the total iron
    # time is a sum over the row and not a number beside it.
    RW_ROWS = [
        ("B-07", "J-01 rework", "chisel 1.2 mm", 345, 95, 3, (2.6, 0.4, 0.2),
         (0.300, 0.280, 0.248), 0),
        ("B-08", "J-01 rework", "chisel 1.2 mm", 345, 95, 2, (2.2, 0.1, 0.0),
         (0.300, 0.280, 0.280), 1),
        ("B-09", "J-01 rework", "chisel 1.2 mm", 345, 95, 1, (2.4, 0.0, 0.0),
         (0.300, 0.280, 0.280), 0),
    ]
    # Three dwell columns on every row, so the CSV never has a short row: a short
    # row shifts the next cell left and a check silently reads the wrong field.
    for _r in RW_ROWS:
        assert len(_r[6]) == 3, "every row needs three dwell columns for " + _r[0]
        assert _r[5] == len([d for d in _r[6] if d > 0]), \
            "contacts must equal the non-zero dwells for " + _r[0]
    RW_DWELLS = list(RW_ROWS[0][6])
    RW_SECONDS = sum(RW_DWELLS)
    RW_WATTS = 45.0
    rw_thermal = (RW_SECONDS * RW_WATTS, "J",
                  "(%s)*%g W" % ("+".join("%g" % d for d in RW_DWELLS), RW_WATTS),
                  {"dwells_s": RW_DWELLS, "watts": RW_WATTS})
    # The conductor the rework nicked. IPC-A-600 caps the reduction of the
    # MINIMUM conductor width the drawing sets, so the band works from that floor
    # and not from the as-drawn width: dividing by the nominal would flatter the
    # repair by three points and still pass.
    TRACE_MIN_MM = 0.280
    TRACE_AFTER_MM = 0.248
    trace_reduction = share_of(TRACE_MIN_MM - TRACE_AFTER_MM, TRACE_MIN_MM)
    # the smallest width the class allows before the repair itself is a defect
    trace_floor_c2 = (TRACE_MIN_MM * (1 - CONDUCTOR_REDUCTION_PCT[2] / 100.0), "mm",
                      "%g*(1-%d/100)" % (TRACE_MIN_MM, CONDUCTOR_REDUCTION_PCT[2]),
                      {"min_mm": TRACE_MIN_MM, "pct": CONDUCTOR_REDUCTION_PCT[2]})
    trace_floor_c3 = (TRACE_MIN_MM * (1 - CONDUCTOR_REDUCTION_PCT[3] / 100.0), "mm",
                      "%g*(1-%d/100)" % (TRACE_MIN_MM, CONDUCTOR_REDUCTION_PCT[3]),
                      {"min_mm": TRACE_MIN_MM, "pct": CONDUCTOR_REDUCTION_PCT[3]})

    c = {
        "caseId": "cx-m11-01",
        "moduleId": "m11",
        "title": "Rework record: a connector joint, a nicked trace and a hand-held iron",
        "estMinutes": 30,
        "level": "advanced",
        "scenario": [
            "The short-filled J-01 from the wave case is reworked by hand on a Class 2 Board X "
            "assembly. The record in rework-record.csv carries the setpoint, the preheat, the "
            "dwell of each contact and what the operator measured afterwards: one trace nicked "
            "while the connector came off, and one joint that needed three contacts.",
            "Two decisions are waiting. The first is the trace: the drawing sets a minimum "
            "width of 0.280 mm, and the trace measures 0.248 mm after the nick. The second is "
            "the thermal budget: three contacts on one joint, and a row where the first contact "
            "produced no solder flow at all.",
            "Judge the repair against the class, then say what the record has to contain so "
            "the next engineer can reproduce the result.",
        ],
        "dataFiles": [
            {
                "name": "rework-record.csv",
                "kind": "csv",
                "note": "One row per assembly. There is one dwell column per contact, so the "
                        "total iron time is a sum over the row; dry_flag marks a contact that "
                        "produced no solder flow.",
                "content": (
                    "assembly,operation,tip,setpoint_c,preheat_c,contacts,"
                    "dwell1_s,dwell2_s,dwell3_s,trace_drawn_mm,trace_min_mm,"
                    "trace_after_mm,dry_flag\n" +
                    "".join(
                        "%s,%s,%s,%d,%d,%d,%s,%.3f,%.3f,%.3f,%d\n" % (
                            r[0], r[1], r[2], r[3], r[4], r[5],
                            ",".join("%.1f" % d for d in r[6]),
                            r[7][0], r[7][1], r[7][2], r[8])
                        for r in RW_ROWS)
                ),
            },
        ],
        "steps": [],
        "rubric": [],
        "templates": [
            {"templateId": "rework-record", "name": "Rework and repair record", "status": "planned"},
        ],
        "toolLinks": [
            {"label": "Thermal budget (lesson m11l02)", "href": "#/l/m11l02"},
            {"label": "Repair limits and classes (lesson m11l04)", "href": "#/l/m11l04"},
            {"label": "Acceptance of rework (lesson m11l05)", "href": "#/l/m11l05"},
        ],
        "sources": ["src-009", "src-022", "src-001"],
        "generatedBy": "scripts/gen_cases.py",
    }

    add_step(c, step_choice(
        "s1",
        "B-07 ran at a 345 °C setpoint. Against the course's hand-soldering band of 330-360 °C, "
        "how does that setpoint read?",
        [("a", "Too cold for lead-free and a likely cause of the cold joint."),
         ("b", "Inside the band, near its middle: the setpoint is defensible, so the cause of "
               "the short fill is elsewhere in the budget."),
         ("c", "Too hot, and above every published limit for SAC305."),
         ("d", "Irrelevant, because only the measured joint temperature matters.")],
        "b",
        ["The course band for hand soldering lead-free is 330-360 °C, and J-STD-001 does not fix "
         "one number for every joint.",
         "345 sits between 330 and 360.",
         "The setpoint is inside the band, so it is not the defect."],
        "345 °C is inside the 330-360 °C band: the setpoint is not what went wrong.",
        "Compare the setpoint with the band the lesson gives, not with a number from memory.",
        "345 °C sits in the middle of the course's 330-360 °C band, and published sources are "
        "looser still: IPC-7711 procedures start at about 315 °C and say to change it as "
        "necessary, vendor tables quote up to 400 °C for lead-free. So the setpoint is not the "
        "defect, and 'raise the temperature' is not a diagnosis. The setpoint is also only half "
        "the budget: contact time, preheat and how many times the joint is heated decide the "
        "outcome."))

    add_step(c, step_numeric(
        "s2",
        "B-07 was heated for dwells of 2.6, 0.4 and 0.2 s. What is the total iron time on the "
        "board, in seconds? One decimal.",
        (RW_SECONDS, "s", "+".join("%g" % d for d in RW_DWELLS), {"dwells_s": RW_DWELLS}), 0.1,
        ["The budget counts every contact, not only the successful one.",
         "2.6 + 0.4 + 0.2.",
         "3.2 s."],
        "3.2 s in total: the successful contact plus two more the record kept.",
        "Add every dwell in the row, including the ones that produced nothing.",
        "2.6 + 0.4 + 0.2 = 3.2 s. A single 2.6 s contact is unremarkable; 3.2 s across three "
        "contacts means the joint was brought to temperature, lost it, and was brought up "
        "again. Repeated heating grows the intermetallic layer and stresses the pad, which is "
        "why the count of contacts belongs in the record next to the dwell."))

    add_step(c, step_numeric(
        "s3",
        "The iron delivers about 45 W during contact. How much energy went into the board on "
        "B-07, in joules?",
        rw_thermal, 2.0,
        ["Energy is power times time.",
         "45 W x 3.2 s.",
         "144 J."],
        "144 J of iron time on one joint.",
        "Multiply the total seconds by the power; J = W x s.",
        "45 W for 3.2 s is 144 J. This is the number to put in the record beside the setpoint: "
        "a joint that took 144 J is a joint with a thermal problem — a ground plane, a cold "
        "preheat, or a tip too small for the pad — and not a joint that needed a hotter "
        "setpoint. It becomes the baseline for the next board, which is the whole point of "
        "recording a thermal budget."))

    add_step(c, step_numeric(
        "s4",
        "The drawing sets a minimum conductor width of 0.280 mm. The nicked trace measures "
        "0.248 mm. What is the width reduction against that minimum, in percent? One decimal.",
        trace_reduction, 0.2,
        ["The limit is written against the minimum width on the drawing, not the as-drawn "
         "width.",
         "(0.280 - 0.248) / 0.280.",
         "11.4 %."],
        "11.4 %: inside Class 2, outside Class 3.",
        "The loss over the minimum width: 0.032 mm on a 0.280 mm trace.",
        "0.032 / 0.280 = 11.4 %. The denominator matters more than the numerator. The same "
        "0.248 mm trace passes a Class 2 limit of 20 % and fails a Class 3 limit of 10 %, "
        "because IPC-A-600 caps the reduction of the minimum conductor width the drawing "
        "already fixes. Dividing by the as-drawn 0.300 mm would give a flattering 17.3 % and "
        "still pass Class 2, which is exactly why the standard names the minimum and not the "
        "nominal."))

    add_step(c, step_numeric(
        "s5",
        "What is the narrowest that trace may become and still meet the Class 2 limit, "
        "in mm?",
        trace_floor_c2, 0.005,
        ["Turn the percentage into a width: the limit is 20 % of the 0.280 mm minimum.",
         "0.280 x 0.80.",
         "0.224 mm."],
        "0.224 mm is the floor for Class 2 on this drawing.",
        "Subtract the allowed loss from the minimum width, or multiply by (1 - 20 %).",
        "0.280 mm less 20 % is 0.224 mm. The board measures 0.248 mm, so it passes with "
        "0.024 mm to spare, a real margin rather than a rounding one. That margin is what the "
        "record protects: a repair judged by eye as slightly thinner has no way of saying "
        "whether it sits 0.024 mm inside the limit or 0.024 mm outside it."))

    add_step(c, step_numeric(
        "s6",
        "The same repair on a Class 3 board would be judged against 10 %. What is the "
        "narrowest acceptable width there, in mm?",
        trace_floor_c3, 0.005,
        ["Class 3 allows a tenth of the minimum width, not a fifth.",
         "0.280 x 0.90.",
         "0.252 mm."],
        "0.252 mm on Class 3: the same 0.248 mm trace would fail there.",
        "Multiply the minimum width by (1 - 10 %).",
        "0.280 x 0.90 = 0.252 mm. At 0.248 mm the trace is 0.004 mm under the Class 3 floor, "
        "so the identical physical repair passes Class 2 and fails Class 3 by four microns. "
        "That is why the class has to be on the record before the repair: it is set by the "
        "product, not by how bad the nick looks, and at this margin nothing but the number "
        "separates the two answers."))

    add_step(c, step_choice(
        "s7",
        "What is the disposition of the trace on B-07, a Class 2 board?",
        [("a", "Accept: 20 % is at the limit, not over it, and the record shows the "
               "measurement."),
         ("b", "Reject the board: any nick during rework is a repair and repairs are not "
               "allowed."),
         ("c", "Accept and do not record it, since the board still works."),
         ("d", "Accept on Class 3 limits, which are looser.")],
        "a",
        ["The limit is a maximum reduction, so anything under it passes.",
         "Class 2 allows 20 %; the board measured 11.4 %.",
         "Accept, and record the measurement, the denominator and the class it was judged "
         "against."],
        "Accept: 11.4 % is inside the 20 % limit, and both numbers go in the record.",
        "Is the measured reduction over the limit for the class this board actually is?",
        "11.4 % against a 20 % limit passes with margin. Recording it is what makes the "
        "acceptance durable: a year later the board either has a line that says '0.248 mm "
        "against a 0.280 mm minimum, 11.4 %, Class 2 limit 20 %' or it has nothing, and "
        "'it still works' is not a record. Class 3 would have made the same measurement a "
        "defect at 0.252 mm, so the class is part of the finding and not a detail of the "
        "paperwork."))

    add_step(c, step_choice(
        "s8",
        "B-08 shows dry_flag 1 on its first contact and two contacts in total. What does that "
        "row say about the process, rather than about the operator?",
        [("a", "Nothing: a dry contact is an operator error and is not a process signal."),
         ("b", "The joint needed more heat than one contact could deliver, so the preheat, tip "
               "size or board support is loading the joint beyond the budget — the same "
               "thermal question the wave case raised."),
         ("c", "The setpoint was too low and should be raised for every joint."),
         ("d", "The solder wire was the wrong diameter.")],
        "b",
        ["A contact that produced no flow means the joint was not at temperature.",
         "Two contacts on the same joint is a repeat of the m08 finding: the thermal path is "
         "the constraint.",
         "Fix the heat path, not the setpoint for every joint on the line."],
        "The joint is thermally loaded: preheat, tip size or support, not a global setpoint "
        "change.",
        "What is the difference between 'this joint is hard to heat' and 'the iron is too "
        "cold'?",
        "A dry contact is the record's way of saying the joint was not at wetting temperature, "
        "and the second contact is the recovery. Raising the setpoint for the whole line would "
        "overheat every easy joint to rescue one hard one; the m08 case reached the same "
        "conclusion from the wave side. The fix is in the heat path — preheat the board, use a "
        "tip that matches the pad, support the board — and the record is what shows the fix "
        "worked on the next one."))

    add_step(c, step_choice(
        "s9",
        "What has to be in the rework record for the next engineer to reproduce this result?",
        [("a", "The pass/fail verdict and the operator's initials."),
         ("b", "Required class, setpoint, tip, preheat, dwells and number of contacts, measured "
               "trace width with the limit it was judged against, and the inspection result."),
         ("c", "The serial number and the date, because the process is standard."),
         ("d", "A photograph of the joint, since numbers cannot describe solder.")],
        "b",
        ["Reproducing a result needs the settings, the measurements and the standard they were "
         "judged against.",
         "A verdict without the numbers cannot be re-judged when the class or the standard "
         "changes.",
         "Class, settings, measurements, limits, result."],
        "Class, settings, measurements, the limit each was judged against, and the result.",
        "Which of these could another engineer use to reach the same decision without asking "
        "you?",
        "A record that says 'passed' cannot be re-judged when the product class changes or the "
        "standard moves from Rev C to Rev D, and that is exactly what happened to this course's "
        "own source. Class, setpoint, tip, preheat, dwells, contact count, the measured width "
        "against the minimum it was compared with, and the inspection result make the decision "
        "reproducible. A photo is useful evidence and not a substitute for the numbers."))

    c["spec"] = [
        {"label": "Hand-soldering setpoint", "value": HAND_SETPOINT_MIN_C,
         "to": HAND_SETPOINT_MAX_C, "unit": "°C", "note": "Course band (m11l02)"},
        {"label": "Conductor reduction, Class 2", "value": CONDUCTOR_REDUCTION_PCT[2],
         "unit": "%", "note": "IPC-A-600 (m11l04)"},
        {"label": "Conductor reduction, Class 3", "value": CONDUCTOR_REDUCTION_PCT[3],
         "unit": "%", "note": "IPC-A-600 (m11l04)"},
        {"label": "Annular ring, Class 3 external", "value": ANNULAR_RING_MIN_MM, "unit": "mm",
         "note": "IPC-A-600 (m11l04)"},
    ]

    c["rubric"] = [
        {"criterion": "Setpoint judged against the band, not against a remembered number",
         "points": 10, "steps": ["s1"]},
        {"criterion": "Thermal budget counted over every contact", "points": 15, "steps": ["s2"]},
        {"criterion": "Energy in joules derived from power and time", "points": 10,
         "steps": ["s3"]},
        {"criterion": "Conductor reduction measured against the drawing width", "points": 15,
         "steps": ["s4"]},
        {"criterion": "Class 2 width floor computed from the percentage limit", "points": 10,
         "steps": ["s5"]},
        {"criterion": "Class 3 floor computed and the same repair shown to fail there",
         "points": 10, "steps": ["s6"]},
        {"criterion": "Disposition at the limit accepted with the measurement recorded",
         "points": 15, "steps": ["s7"]},
        {"criterion": "Dry contact read as a thermal-load signal, not as a setpoint problem",
         "points": 10, "steps": ["s8"]},
        {"criterion": "Record contents named so the decision can be re-judged", "points": 5,
         "steps": ["s9"]},
    ]
    cases.append(c)

    # =====================================================================
    # m14 — DPMO, sampling, 8D effectiveness
    # =====================================================================
    d = dpmo(38, BOARD_FACTS["lotSize"], BOARD_FACTS["opportunitiesPerBoard"])
    fcr = pct(47 - 38, 47)
    n_3000 = iso_sample(3000, "K", 125, 3, 4)
    before_ppm = ppm(96, 6000)
    after_ppm = ppm(21, 7500)
    red = reduction_pct(before_ppm[0], after_ppm[0])
    n_3000 = iso_sample(3000, "K", 125, 3, 4)
    n_5000 = iso_sample(5000, "L", 200, 5, 6)

    c = {
        "caseId": "cx-m14-01",
        "moduleId": "m14",
        "title": "AOI over-rejection on Board X: DPMO, sampling scope and an 8D that is not closed",
        "estMinutes": 35,
        "level": "advanced",
        "scenario": [
            "Board X runs 1,240 boards a day with 620 solder opportunities per board. Last "
            "week AOI raised 47 calls against the BGA and the fine-pitch QFP; the defect "
            "review confirmed 38 of them and threw 9 out as false calls.",
            "The 8D team contained the suspect lot and needs a sampling plan for the "
            "retroactive search: one lot is 3,000 boards, another is 5,000. The control plan "
            "requires ISO 2859-1 general inspection level II at AQL 1.0.",
            "A corrective action has been running for six weeks on a different defect family: "
            "96 defects in 6,000 boards before, 21 defects in 7,500 boards after. The agreed "
            "effectiveness target is 1,000 ppm.",
            "Compute the metrics the 8D needs, and be honest about what the numbers do and do "
            "not prove.",
        ],
        "dataFiles": [
            {
                "name": "defect-log.csv",
                "kind": "csv",
                "content": (
                    "family,calls,confirmed,false_calls,boards_in_window\n"
                    "BGA void / non-wet,47,38,9,1240\n"
                    "QFP bridging,0,0,0,1240\n"
                ),
            },
            {
                "name": "capa-window.csv",
                "kind": "csv",
                "content": (
                    "phase,defects,boards,ppm\n"
                    "before,96,6000,\n"
                    "after,21,7500,\n"
                    "target,,,1000\n"
                ),
            },
        ],
        "steps": [],
        "rubric": [],
        "templates": [
            {"templateId": "8d", "name": "8D report", "status": "planned"},
            {"templateId": "pareto", "name": "Pareto worksheet", "status": "planned"}
        ],
        "toolLinks": [
            {"label": "Defect data before opinions (lesson m14l01)", "href": "#/l/m14l01"},
            {"label": "Corrective vs preventive action (lesson m14l05)", "href": "#/l/m14l05"},
            {"label": "8D workshop (lesson m14l07)", "href": "#/l/m14l07"},
        ],
        "sources": ["src-006", "src-001"],
        "generatedBy": "scripts/gen_cases.py",
    }

    add_step(c, step_numeric(
        "s1",
        "Compute DPMO for Board X from the confirmed defects. DPMO = defects / (boards x "
        "opportunities per board) x 1,000,000. One decimal.",
        d, 0.3,
        ["Use confirmed defects, not AOI calls.",
         "38 / (1,240 x 620) = 38 / 768,800.",
         "38 / 768,800 x 1e6 = 49.4."],
        "49.4 DPMO — computed from confirmed defects only.",
        "Multiply boards by opportunities first, then divide, then scale to a million.",
        "38 / (1,240 x 620) = 38 / 768,800 = 4.94 x 10^-5, which is 49.4 defects per million "
        "opportunities. Using the 47 AOI calls instead would inflate the number to about 61 "
        "DPMO and turn an inspection problem into a process problem."))

    add_step(c, step_numeric(
        "s2",
        "AOI raised 47 calls of which 38 were confirmed. What is the false-call rate, in "
        "percent? One decimal.",
        fcr, 0.3,
        ["The false calls are the calls that did not survive review.",
         "47 - 38 = 9 false calls out of 47 calls.",
         "9 / 47 = 19.1 %."],
        "19.1 % false calls — an inspection capability issue, not a solder issue.",
        "Divide the false calls by the total calls, not by the confirmed defects.",
        "9 / 47 = 19.1 %. The course treats false calls as a separate metric from escape "
        "rate: a high false-call rate costs review time and erodes trust in the station, but "
        "it does not put a bad board in the field the way an escape does."))

    add_step(c, step_choice(
        "s3",
        "For a lot of 3,000 boards, what is the ISO 2859-1 code letter at general inspection "
        "level II?",
        [("a", "J"), ("b", "K"), ("c", "L"), ("d", "M")],
        "b",
        ["The lot-size ranges for level II step at 1,200 and at 3,200.",
         "3,000 falls in the 1,201-3,200 band.",
         "That band is code K: n = 125 at AQL 1.0."],
        "Code K for 3,000 boards: sample 125, Ac 3, Re 4.",
        "Find the lot-size band first; the letter follows from the band, not from the count.",
        "At general inspection level II a lot of 3,000 sits in the 1,201-3,200 band, which is "
        "code K: 125 pieces sampled, accept at 3, reject at 4 for AQL 1.0. Code L belongs to "
        "the next band (3,201-10,000) and code J to the one below (501-1,200)."))

    add_step(c, step_numeric(
        "s4",
        "For that 3,000-board lot at code K, AQL 1.0, how many pieces are sampled?",
        n_3000, 0.5,
        ["Code K fixes the sample size.",
         "It is the n column for K, not a percentage of the lot.",
         "n = 125."],
        "125 pieces sampled.",
        "This is a table lookup for code K at AQL 1.0.",
        "Code K samples 125 pieces. The accept number is 3 and the reject number 4, so finding "
        "3 or fewer nonconforming units accepts the lot and 4 rejects it — the plan is not a "
        "zero-defect rule."))

    add_step(c, step_choice(
        "s5",
        "The retroactive search on the 3,000-board lot finds 3 nonconforming boards. What does "
        "the plan say?",
        [("a", "Reject the lot: any nonconformity in a containment sample fails it."),
         ("b", "Accept the lot against this plan (Ac = 3) — acceptance sampling qualifies "
               "the lot, not the process, so the 8D stays open until the ppm target is met."),
         ("c", "Accept the lot and close the 8D."),
         ("d", "Reject and double the sample until zero defects are found.")],
        "b",
        ["Ac is the acceptance number for the plan, and it is not zero.",
         "Ac = 3 means 3 or fewer accepts; Re = 4 is the reject threshold.",
         "Accepting the lot on the sampling plan does not close the 8D."],
        "Accept against Ac = 3, and keep the 8D open — sampling says nothing about the cause.",
        "Separate the sampling decision from the corrective-action decision.",
        "At AQL 1.0 code K the acceptance number is 3, so three nonconforming boards accept "
        "the lot. That is a statement about the lot against an agreed quality level, not "
        "evidence that the cause is fixed: acceptance sampling with Ac > 0 always passes some "
        "nonconforming units, which is why the 8D is closed on the effectiveness metric, not "
        "on the sample."))

    add_step(c, step_numeric(
        "s6",
        "The second lot is 5,000 boards at the same level and AQL. How many pieces does the "
        "plan sample?",
        n_5000, 0.5,
        ["5,000 falls in the 3,201-10,000 band.",
         "That band is code L.",
         "Code L samples 200 pieces: Ac 5, Re 6."],
        "200 pieces at code L (Ac 5, Re 6).",
        "Find the band for 5,000 first, then read n for that code.",
        "5,000 boards is code L, which samples 200 pieces with Ac 5 and Re 6 at AQL 1.0. Note "
        "that the sample grows far more slowly than the lot: doubling the lot from 3,000 to "
        "5,000 raises the sample from 125 to 200, which is why sampling alone cannot bound a "
        "large escape."))

    add_step(c, step_numeric(
        "s7",
        "Corrective-action window: 96 defects in 6,000 boards. What is that rate in ppm?",
        before_ppm, 30,
        ["ppm is defects per million boards.",
         "96 / 6,000 = 0.016.",
         "0.016 x 1e6 = 16,000 ppm."],
        "16,000 ppm before the action.",
        "Divide defects by boards, then multiply by a million.",
        "96 / 6,000 = 0.016, which is 16,000 defects per million boards. Stating it in ppm "
        "rather than percent keeps the comparison with the 1,000 ppm target in one scale."))

    add_step(c, step_numeric(
        "s8",
        "After the action: 21 defects in 7,500 boards. What is the rate in ppm?",
        after_ppm, 30,
        ["Same conversion as the before figure.",
         "21 / 7,500 = 0.0028.",
         "0.0028 x 1e6 = 2,800 ppm."],
        "2,800 ppm after the action.",
        "Defects over boards, then scale to a million.",
        "21 / 7,500 = 0.0028, so 2,800 ppm. The two windows are different lengths, which is "
        "exactly why the comparison is made on a rate and not on a defect count."))

    add_step(c, step_numeric(
        "s9",
        "What is the reduction between the two rates, in percent? One decimal.",
        red, 0.5,
        ["Reduction is measured against the before rate.",
         "(16,000 - 2,800) / 16,000.",
         "13,200 / 16,000 = 82.5 %."],
        "82.5 % reduction — a real improvement, and still not the target.",
        "Divide the improvement by the before rate, then multiply by 100.",
        "(16,000 - 2,800) / 16,000 = 82.5 %. An 82.5 % reduction sounds like success until it "
        "is put against the target: 2,800 ppm is still nearly three times the agreed 1,000 ppm, "
        "so by the metric the course uses the action is not yet effective."))

    add_step(c, step_choice(
        "s10",
        "The effectiveness target is 1,000 ppm and the after rate is 2,800 ppm. What is the "
        "correct 8D status?",
        [("a", "Close the 8D: an 82.5 % reduction is a passing result."),
         ("b", "Keep the 8D open: the action improved the rate but did not reach the agreed "
               "metric, so effectiveness is not demonstrated."),
         ("c", "Close the 8D and open a new one for the residual 2,800 ppm."),
         ("d", "Change the target to 3,000 ppm so the action passes.")],
        "b",
        ["Effectiveness is judged against the metric agreed before the action.",
         "2,800 is above 1,000.",
         "The course closes an 8D on the metric, not on the improvement."],
        "Keep it open — the improvement is real, the target is not met.",
        "Which number was agreed before the action started?",
        "An 82.5 % improvement with a residual rate nearly three times the target is a partial "
        "result. The course's rule is that the 8D stays open until the effectiveness metric is "
        "met with evidence; renegotiating the target after the fact destroys the point of "
        "having one, and opening a second 8D for the same cause just moves the paperwork."))

    c["rubric"] = [
        {"criterion": "DPMO computed from confirmed defects with the right denominator", "points": 10, "steps": ["s1"]},
        {"criterion": "False-call rate computed separately from defect rate", "points": 10, "steps": ["s2"]},
        {"criterion": "Correct ISO 2859-1 code letter for the lot size", "points": 10, "steps": ["s3"]},
        {"criterion": "Sample size read for the code, not guessed", "points": 10, "steps": ["s4"]},
        {"criterion": "Accept/reject decision separated from cause and closure", "points": 15, "steps": ["s5"]},
        {"criterion": "Second lot handled with its own code and sample", "points": 10, "steps": ["s6"]},
        {"criterion": "Before and after rates expressed in the same unit", "points": 10, "steps": ["s7"]},
        {"criterion": "After rate computed on its own window", "points": 10, "steps": ["s8"]},
        {"criterion": "Reduction computed against the before rate", "points": 5, "steps": ["s9"]},
        {"criterion": "8D status judged on the agreed metric, not on the improvement", "points": 10, "steps": ["s10"]},
    ]
    cases.append(c)

    return cases, keys


def build_document():
    cases, keys = build_cases()
    for c in cases:
        attach_templates(c)
    # every case in the thread must exist, and every case with a module in the
    # thread must be reachable from it — a dangling strip link is worse than none
    known = {c["caseId"] for c in cases}
    for item in BOARD_THREAD:
        if item["caseId"] not in known:
            raise SystemExit("thread points at missing case " + item["caseId"])
    for c in cases:
        if not any(t["moduleId"] == c["moduleId"] for t in BOARD_THREAD):
            raise SystemExit("case " + c["caseId"] + " is missing from the Board X thread")
    return {
        "schemaVersion": 1,
        "generatedBy": "scripts/gen_cases.py",
        "generatedOn": CHECKED_ON,
        "thresholds": {
            "areaRatioMin": [AREA_RATIO_MIN, "src-004", "m03l02"],
            "aspectRatioMin": [ASPECT_RATIO_MIN, "src-004", "m03l05"],
            "tapeBakeMaxC": [TAPE_BAKE_MAX_C, "src-003", "m02l04"],
            "dryCabinetMaxRhPct": [DRY_CABINET_MAX_RH, "src-003", "m02l04"],
            "jstd020LargePackageC": [JSTD020_LARGE_PACKAGE_C, "src-005", "m06l02"],
            "talWindowS": [[TAL_MIN_S, TAL_MAX_S], "src-008", "m06l07"],
            # 235-245 is a typical production band, stated in the m06l01 zone table
            # and in SAC305 paste datasheets; it is NOT an IPC-7530 number, which is
            # why it carries no source id.
            "typicalPeakBandC": [[TYPICAL_PEAK_MIN_C, TYPICAL_PEAK_MAX_C], None, "m06l01"],
            "pastePeakWindowC": [[PASTE_PEAK_MIN_C, PASTE_PEAK_MAX_C], None, "m06l07"],
            "talWindowIpcs": [[30, 90], "src-008", "m06l05"],
            "peakClassificationLargeC": [JSTD020_LARGE_PACKAGE_C, "src-005", "m06l05"],
            "holeFillMinPct": [HOLE_FILL_MIN_PCT, "src-016", "m08l05"],
            "holeFillExceptionPct": [HOLE_FILL_EXCEPTION_PCT, "src-016", "m08l05"],
            "waveContactWindowS": [[WAVE_CONTACT_MIN_S, WAVE_CONTACT_MAX_S], None, "m09l07"],
            "bgaVoidMaxPct": [BGA_VOID_MAX_PCT, "src-007", "m07l04"],
            "conductorReductionClass2Pct": [CONDUCTOR_REDUCTION_PCT[2], "src-022", "m11l04"],
            "conductorReductionClass3Pct": [CONDUCTOR_REDUCTION_PCT[3], "src-022", "m11l04"],
            "annularRingMinMm": [ANNULAR_RING_MIN_MM, "src-022", "m11l04"],
            "handSetpointWindowC": [[HAND_SETPOINT_MIN_C, HAND_SETPOINT_MAX_C], None, "m11l02"],
            "bowTwistSmtPct": [BOW_TWIST_SMT_PCT, "src-018", "m01l06"],
        },
        "thread": BOARD_THREAD,
        "board": BOARD,
        "cases": cases,
    }, keys


def keys_csv(keys):
    cols = ["caseId", "stepId", "type", "formula", "value", "tolerance", "unit", "inputs"]
    lines = [",".join(cols)]

    def cell(v):
        s = str(v)
        return '"' + s.replace('"', '""') + '"' if any(c in s for c in ',"') else s

    for k in keys:
        lines.append(",".join(cell(k[c]) for c in cols))
    return "\ufeff" + "\r\n".join(lines) + "\r\n"


def main(argv=None):
    ap = argparse.ArgumentParser(description="Generate case data and answer keys.")
    ap.add_argument("--check", action="store_true", help="verify data/cases.json matches this generator")
    ap.add_argument("--keys", action="store_true", help="print the keys table")
    args = ap.parse_args(argv)

    doc, keys = build_document()

    if args.keys:
        print(keys_csv(keys))
        return 0

    if args.check:
        if not os.path.exists(CASES_PATH):
            print("MISSING: " + CASES_PATH, file=sys.stderr)
            return 1
        with open(CASES_PATH, encoding="utf-8-sig") as fh:
            on_disk = json.load(fh)
        if on_disk == doc:
            print("gen_cases --check: OK (%d cases, %d steps)" % (len(doc["cases"]), len(keys)))
            return 0
        # say what differs, don't just fail
        want = {(c["caseId"], s["id"]): s for c in doc["cases"] for s in c["steps"]}
        have = {(c["caseId"], s["id"]): s for c in on_disk.get("cases", []) for s in c["steps"]}
        problems = []
        for key, step in want.items():
            if key not in have:
                problems.append("missing step %s/%s" % key)
            elif have[key] != step:
                problems.append("step %s/%s differs from the generator" % key)
        for key in have:
            if key not in want:
                problems.append("step %s/%s is in the file but not in the generator" % key)
        print("gen_cases --check: FAIL", file=sys.stderr)
        for p in problems[:20]:
            print("  - " + p, file=sys.stderr)
        return 1

    os.makedirs(os.path.dirname(CASES_PATH), exist_ok=True)
    with open(CASES_PATH, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    os.makedirs(os.path.dirname(KEYS_PATH), exist_ok=True)
    with open(KEYS_PATH, "w", encoding="utf-8") as fh:
        fh.write(keys_csv(keys))

    steps = sum(len(c["steps"]) for c in doc["cases"])
    print("wrote data/cases.json — %d cases, %d steps" % (len(doc["cases"]), steps))
    print("wrote docs/case-keys.csv — %d keys" % len(keys))
    return 0


if __name__ == "__main__":
    sys.exit(main())
