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
    {"step": 1, "moduleId": "m02", "label": "MSL log", "asset": "MSL exposure log",
     "caseId": "cx-m02-01"},
    {"step": 2, "moduleId": "m03", "label": "Stencil", "asset": "Stencil data sheet",
     "caseId": "cx-m03-01"},
    {"step": 3, "moduleId": "m06", "label": "Reflow profile", "asset": "Reflow profile log",
     "caseId": "cx-m06-01"},
    {"step": 4, "moduleId": "m14", "label": "8D report", "asset": "8D problem report",
     "caseId": "cx-m14-01"},
]

# Thresholds used by the cases. Each one is taken from the course text or from a
# cited source — never invented here. check-cases.js verifies the citation.
AREA_RATIO_MIN = 0.66      # m03l02, m03l05, m04l01 (IPC-7525 guidance)
ASPECT_RATIO_MIN = 1.5     # m03l05 (IPC-7525 guidance)
TAPE_BAKE_MAX_C = 40       # m02l04 (J-STD-033 tape-and-reel limit)
DRY_CABINET_MAX_RH = 5     # m02l04 (J-STD-033 dry storage)
JSTD020_LARGE_PACKAGE_C = 250   # m06l02/l05 — classification temperature, large package
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


def margin(limit: float, measured: float):
    value = limit - measured
    return (value, "°C", "%g-%g" % (limit, measured),
            {"limit": limit, "measured": measured})


def expected_ramp(power_w: float, thermal_mass_j_per_k: float):
    value = power_w / thermal_mass_j_per_k
    return (value, "°C/s", "%g/%g" % (power_w, thermal_mass_j_per_k),
            {"power_w": power_w, "thermal_mass_j_per_k": thermal_mass_j_per_k})


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
        "(L x W) / (2 x (L + W) x T). Give the value to two decimals.",
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
        "Correct — 7 % RH slows the clock but does not suspend it, so no credit was given.",
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
        [("a", "Bake the reel at 125 °C for 7 h and accept some tape deformation."),
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
    peak_margin = margin(JSTD020_LARGE_PACKAGE_C, 248)
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
            }
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
        "Which disposition does the profile earn?",
        [("a", "Reject and change the profile: the peak is over the 245 °C limit."),
         ("b", "Accept and document: peak and time above liquidus are inside their windows, "
               "with 2 °C and 5 s of margin noted in the profile record."),
         ("c", "Reject: time above liquidus must always exceed 90 s on a heavy board."),
         ("d", "Accept without comment: a profile only fails if the joints look wrong.")],
        "b",
        ["Which limit applies to a large package — 245 °C or 250 °C?",
         "The 245 °C figure belongs to the very large package class; the course lists 250 °C "
         "for a large one.",
         "Peak and TAL both pass with thin margins, so the record carries the margins."],
        "Accept and document, with both thin margins written into the profile record.",
        "Check which package class Board X's BGA falls in before comparing against 245 °C.",
        "For a large package the classification temperature is 250 °C, so 248 °C passes with "
        "2 °C to spare; the 245 °C limit belongs to the very large class the course describes "
        "separately. Time above liquidus 65 s is inside the 60-90 s paste window. The honest "
        "disposition is accept-and-document, because the margins are thin enough that the "
        "record has to carry them."))

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
        {"criterion": "Cooling rate computed and interpreted", "points": 10, "steps": ["s4"]},
        {"criterion": "Disposition states the margins rather than just 'pass'", "points": 20, "steps": ["s5"]},
        {"criterion": "Model-versus-measurement check performed", "points": 10, "steps": ["s6"]},
        {"criterion": "Evidence ranked above the estimate", "points": 15, "steps": ["s7"]},
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
         ("b", "Accept the lot against this plan (Ac = 3), while the 8D still has to explain "
               "the three units found."),
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
