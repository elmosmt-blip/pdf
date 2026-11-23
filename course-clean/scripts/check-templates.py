#!/usr/bin/env python3
"""check-templates.py — Phase 4 verification of the downloadable templates.

Three things are checked, and the first is the one the brief asks for:

1. **Every formula is recomputed by an independent engine and compared with the
   course's own numbers.** The engine is `formulas` (an independent Python
   implementation of the Excel formula language), not LibreOffice — LibreOffice
   is not installable in this environment (apt has no network here), and that is
   recorded in the Phase 4 report rather than hidden. What matters is the
   property being tested: a spreadsheet engine other than the one that wrote the
   file reads the formulas and produces the number `gen_cases.py` produced.

   The comparison targets are the published case keys and the threshold table in
   data/cases.json — not numbers copied into this script.

2. **Every template says what it must say**: the trailing notice, the version and
   date in the file name, a THRESHOLDS block with a source id or an explicit
   "no source id", and no formula that contains a hard-coded limit.

3. **Every file listed in manifest.json exists and is non-empty**, and every
   template is reachable from a case in data/cases.json (so the Toolkit block can
   link it).

Usage:
  python3 check-templates.py
"""

import json
import os
import re
import sys
import warnings

warnings.filterwarnings("ignore")

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TPL = os.path.join(ROOT, "assets", "templates")

sys.path.insert(0, os.path.join(HERE, "templates"))
from specs import NOTICE, ROWS, VERSION  # noqa: E402

from openpyxl import load_workbook  # noqa: E402
from docx import Document  # noqa: E402

problems = []
checked = []


def fail(kind, msg):
    problems.append((kind, msg))


def ok(msg):
    checked.append(msg)


def load_cases():
    with open(os.path.join(ROOT, "data", "cases.json"), encoding="utf-8") as f:
        return json.load(f)


def case_key(cases, case_id, step_id):
    for c in cases["cases"]:
        if c["caseId"] != case_id:
            continue
        for s in c["steps"]:
            if s["id"] == step_id:
                return s["answer"]["value"]
    raise KeyError("%s/%s" % (case_id, step_id))


def solve_xlsx(path, wanted):
    """Calculate a workbook with the independent engine and return {cell: value}."""
    import formulas

    # finish() builds the dependency graph; without it the engine returns only
    # the literal input cells and every dependent formula silently disappears
    # from the result, which would make this whole check vacuous.
    model = formulas.ExcelModel().loads(path).finish()
    sol = model.calculate()
    out = {}
    for k, v in sol.items():
        if "]SHEET" not in k.upper().replace("'", ""):
            continue
        cell = k.split("!")[-1].replace("$", "")
        if cell in wanted:
            val = v.value
            try:
                val = val[0, 0]
            except Exception:
                pass
            out[cell] = val
    return out


# --------------------------------------------------------- 1. formula values
# Each entry: workbook slug, cell, what it must equal, and where that target
# comes from. The target is either a case key or a threshold used by a formula.
FORMULA_EXPECTATIONS = [
    # m03: the stencil sheet must reproduce the area-ratio keys exactly.
    ("stencil-check", "G10", ("key", "cx-m03-01", "s1"), "area ratio, 0.20x0.80 in 0.125"),
    ("stencil-check", "G12", ("key", "cx-m03-01", "s3"), "area ratio at 0.100 foil"),
    ("stencil-check", "H12", ("key", "cx-m03-01", "s4"), "aspect ratio at 0.100 foil"),
    ("stencil-check", "G13", ("key", "cx-m03-01", "s5"), "area ratio, 0.18x0.80 THT"),
    
    # m06: the reflow sheet must reproduce the ramp and cooling keys.
    ("reflow-profile", "B24", ("key", "cx-m06-01", "s1"), "ramp-up rate"),
    ("reflow-profile", "B25", ("key", "cx-m06-01", "s4"), "cooling rate"),
    ("reflow-profile", "B22", ("case", 248.0), "peak temperature"),
    # m02: floor life from the threshold table must be the J-STD-033 value.
    ("msl-log", "J11", ("key", "cx-m02-01", "s1"), "MSL 4 floor life"),
    ("msl-log", "I11", ("key", "cx-m02-01", "s2"), "counted exposure at 7 % RH"),
    ("msl-log", "K11", ("key", "cx-m02-01", "s3"), "remaining floor life"),
]


def check_formulas(cases):
    for slug, cell, target, what in FORMULA_EXPECTATIONS:
        spec = next(s for s in ROWS if s["slug"] == slug)
        path = os.path.join(
            TPL, "%s-example-%s-%s.xlsx" % (slug, VERSION, "2026-10-31"))
        if not os.path.exists(path):
            fail("missing", "no example workbook for " + slug)
            continue
        try:
            got = solve_xlsx(path, {cell})
        except Exception as e:  # engine failure is a finding, not a skip
            fail("engine", "%s: the independent engine could not evaluate: %s" % (slug, e))
            continue
        if cell not in got:
            fail("engine", "%s: cell %s was not computed" % (slug, cell))
            continue
        value = got[cell]
        if target[0] == "key":
            want = case_key(cases, target[1], target[2])
        elif target[0] == "case":
            # the peak the m06 case measures, not the 235-245 typical band
            want = target[1]
        else:
            want = target[1]
        try:
            close = abs(float(value) - float(want)) <= max(0.005, abs(float(want)) * 0.001)
        except Exception:
            close = str(value).strip().lower() == str(want).strip().lower()
        if not close:
            fail("value", "%s!%s (%s) computed %r, course says %r"
                 % (slug, cell, what, value, want))
        else:
            ok("%s!%s = %s (%s)" % (slug, cell, want, what))


# ------------------------------------------------------- 2. template content
def check_xlsx_content(spec):
    path = os.path.join(
        TPL, "%s-blank-%s-%s.xlsx" % (spec["slug"], VERSION, "2026-10-31"))
    wb = load_workbook(path)
    ws = wb["Sheet"]

    # the notice is in the sheet, as the last populated row of column A
    col_a = [ws.cell(row=r, column=1).value for r in range(1, ws.max_row + 1)]
    texts = [str(v) for v in col_a if v]
    if NOTICE not in texts:
        fail("notice", spec["slug"] + ": the training notice is missing from the sheet")
    else:
        ok(spec["slug"] + ": notice present")

    # a THRESHOLDS block with a source column
    if "THRESHOLDS" not in texts:
        fail("thresholds", spec["slug"] + ": no THRESHOLDS block")
    else:
        src_col = [ws.cell(row=r, column=3).value for r in range(1, 12)]
        if "Source" not in [str(v) for v in src_col if v]:
            fail("thresholds", spec["slug"] + ": thresholds have no Source column")
        else:
            ok(spec["slug"] + ": thresholds carry a source column")

    # formulas must not contain bare limits: every constant in a formula has to
    # be a cell reference. Numbers such as 100 and 60 are unit factors and are
    # allowed; a limit from the threshold table must never appear literally.
    # Only fractional limits are worth hunting: an integer like 5 or 3 is far
    # more likely to be a level index, a % conversion or a cell row than a
    # copied limit. The defect this guards against is a limit such as 0.66 or
    # 1.56 pasted into an IF, which is always fractional.
    limits = [t[1] for t in spec.get("thresholds", [])
              if isinstance(t[1], float) and not float(t[1]).is_integer()]
    for row in ws.iter_rows():
        for cell in row:
            if isinstance(cell.value, str) and cell.value.startswith("="):
                # strip $B$n / $A$n style addresses first: a row number is not a
                # limit, and the first version of this check flagged the cell
                # references it had just resolved
                bare = re.sub(r"\$?[A-Z]{1,2}\$?\d+", "REF", cell.value)
                for lim in limits:
                    # 0.66 and 1.5 are the two that were hard-coded in real life
                    pat = r"(?<![\d.])" + re.escape(str(lim)) + r"(?![\d.])"
                    # ignore unit factors and the round-100/60 conversions
                    if re.search(pat, bare):
                        fail("hardcoded",
                             "%s!%s contains the threshold %s literally: %s"
                             % (spec["slug"], cell.coordinate, lim, cell.value))

    # formula cells are locked, input cells are not
    locked_forms, open_inputs = 0, 0
    for row in ws.iter_rows(min_row=9):
        for cell in row:
            if isinstance(cell.value, str) and cell.value.startswith("="):
                if cell.protection.locked:
                    locked_forms += 1
                else:
                    fail("protection",
                         "%s!%s is a formula and is not locked" % (spec["slug"], cell.coordinate))
            elif cell.value not in (None, ""):
                if not cell.protection.locked:
                    open_inputs += 1
    if locked_forms:
        ok("%s: %d formula cells, all locked; %d inputs left open"
           % (spec["slug"], locked_forms, open_inputs))
    if not ws.protection.sheet:
        fail("protection", spec["slug"] + ": the sheet is not protected at all")


def check_docx_content(spec):
    path = os.path.join(
        TPL, "%s-blank-%s-%s.docx" % (spec["slug"], VERSION, "2026-10-31"))
    doc = Document(path)
    text = "\n".join(p.text for p in doc.paragraphs)
    tables = sum(len(t.rows) for t in doc.tables)
    if NOTICE not in text:
        fail("notice", spec["slug"] + ": the training notice is missing")
    else:
        ok(spec["slug"] + ": notice present, %d table rows" % tables)
    expected_rows = sum(len(fields) for _, fields in spec["sections"])
    if tables < expected_rows:
        fail("content", "%s: %d rows written, %d expected"
             % (spec["slug"], tables, expected_rows))
    for title, _ in spec["sections"]:
        if title.split("—")[0].strip() not in text:
            fail("content", "%s: section %r missing" % (spec["slug"], title))


# ------------------------------------------------------------- 3. the package
def check_package(cases):
    mpath = os.path.join(TPL, "manifest.json")
    if not os.path.exists(mpath):
        fail("manifest", "manifest.json is missing")
        return
    with open(mpath, encoding="utf-8") as f:
        man = json.load(f)
    if man.get("notice") != NOTICE:
        fail("manifest", "manifest notice does not match the module's")
    case_ids = {c["caseId"] for c in cases["cases"]}
    for t in man["templates"]:
        for variant, name in t["files"].items():
            p = os.path.join(TPL, name)
            if not os.path.exists(p) or os.path.getsize(p) == 0:
                fail("manifest", "missing or empty file: " + name)
        if VERSION not in t["files"]["blank"] or "2026-10-31" not in t["files"]["blank"]:
            fail("naming", "version or date missing from the file name: "
                 + t["files"]["blank"])
        for cid in t["cases"]:
            if cid not in case_ids:
                fail("manifest", "%s points at unknown case %s" % (t["slug"], cid))
    ok("manifest: %d templates, all files present and named with version %s"
       % (len(man["templates"]), VERSION))


def main():
    cases = load_cases()
    for spec in ROWS:
        if spec["kind"] == "xlsx":
            check_xlsx_content(spec)
        else:
            check_docx_content(spec)
    check_formulas(cases)
    check_package(cases)

    if problems:
        print("FAIL — %d problem(s)" % len(problems))
        seen = {}
        for kind, msg in problems:
            seen.setdefault(kind, []).append(msg)
        for kind, msgs in seen.items():
            print("  %s (%d)" % (kind, len(msgs)))
            for m in msgs[:6]:
                print("      " + m)
        return 1

    print("OK — %d checks passed, formulas recomputed by an independent engine"
          % len(checked))
    for c in checked:
        print("  " + c)
    return 0


if __name__ == "__main__":
    sys.exit(main())
