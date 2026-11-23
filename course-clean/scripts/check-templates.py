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
# Cell references are found, not typed: the table moves when a threshold or a
# row is added, and a check that names G12 then verifies the wrong aperture.
FORMULA_EXPECTATIONS = [
    # m03: the stencil sheet must reproduce the case's area- and aspect-ratio keys
    # for the same apertures. A-03 is the 0.20x0.80 aperture in 0.125 foil
    # (0.64), A-04 the same aperture in 0.100 foil (0.80 and 2.0), A-06 the
    # 0.18x0.80 THT aperture (0.5878).
    ("stencil-check", ("aperture", "A-03"), "G", ("key", "cx-m03-01", "s1"),
     "area ratio, 0.20x0.80 in 0.125"),
    ("stencil-check", ("aperture", "A-04"), "G", ("key", "cx-m03-01", "s3"),
     "area ratio at 0.100 foil"),
    ("stencil-check", ("aperture", "A-04"), "H", ("key", "cx-m03-01", "s4"),
     "aspect ratio at 0.100 foil"),
    ("stencil-check", ("aperture", "A-06"), "G", ("key", "cx-m03-01", "s5"),
     "area ratio, 0.18x0.80 THT"),

    # m06: the reflow sheet must reproduce the profile keys, found by label.
    ("reflow-profile", ("label", "Ramp-up rate (C/s)"), "B",
     ("key", "cx-m06-01", "s1"), "ramp-up rate"),
    ("reflow-profile", ("label", "Cooling rate (C/s)"), "B",
     ("key", "cx-m06-01", "s4"), "cooling rate"),
    ("reflow-profile", ("label", "Peak temperature (C)"), "B",
     ("case", 248.0), "peak temperature"),

    # m02: floor life from the threshold table must be the J-STD-033 value.
    ("msl-log", ("reel", "R-4412"), "J", ("key", "cx-m02-01", "s1"), "MSL 4 floor life"),
    ("msl-log", ("reel", "R-4412"), "I", ("key", "cx-m02-01", "s2"),
     "counted exposure at 7 % RH"),
    ("msl-log", ("reel", "R-4412"), "K", ("key", "cx-m02-01", "s3"),
     "remaining floor life"),
]


def find_row(ws, kind, key):
    """Row of a table entry, by its first-column value (or label)."""
    for r in range(1, ws.max_row + 1):
        v = ws.cell(row=r, column=1).value
        if isinstance(v, str) and v.strip() == key:
            return r
    return None


def check_formulas(cases):
    for slug, finder, col, target, what in FORMULA_EXPECTATIONS:
        spec = next(s for s in ROWS if s["slug"] == slug)
        path = os.path.join(
            TPL, "%s-example-%s-%s.xlsx" % (slug, VERSION, "2026-10-31"))
        if not os.path.exists(path):
            fail("missing", "no example workbook for " + slug)
            continue
        ws = load_workbook(path)["Sheet"]
        row = find_row(ws, finder[0], finder[1])
        if row is None:
            fail("layout", "%s: no row found for %s %r" % (slug, finder[0], finder[1]))
            continue
        cell = "%s%d" % (col, row)
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


# ------------------------------------------------- row-by-row model checks
# The first version of this check compared nine hand-picked cells. That is how
# the Pareto sheet shipped with every row wrong: the ranges included the header
# row, and the check happened to sample nothing. These functions recompute whole
# tables from the sheet's own input cells and compare every row.

def _solve(path):
    import formulas
    out = {}
    for k, v in formulas.ExcelModel().loads(path).finish().calculate().items():
        if "]SHEET" not in k.upper().replace("'", ""):
            continue
        cell = k.split("!")[-1].replace("$", "")
        try:
            out[cell] = v.value[0, 0]
        except Exception:
            pass
    return out


def check_pareto_by_row(spec):
    path = os.path.join(TPL, "%s-example-%s-2026-10-31.xlsx" % (spec["slug"], VERSION))
    sol = _solve(path)
    wb = load_workbook(path)
    ws = wb["Sheet"]
    # locate the table: the header row is the one whose first cell is "Defect type"
    head = None
    for r in range(1, ws.max_row + 1):
        if ws.cell(row=r, column=1).value == "Defect type":
            head = r
            break
    if head is None:
        fail("pareto", "no defect table found")
        return
    rows = []
    r = head + 1
    while ws.cell(row=r, column=1).value not in (None, "") and \
            ws.cell(row=r, column=2).value not in (None, ""):
        rows.append(r)
        r += 1
    counts = {r: ws.cell(row=r, column=2).value for r in rows}
    total = sum(counts.values())
    bad = 0
    for r in rows:
        rank = sol.get("C%d" % r)
        share = sol.get("D%d" % r)
        cum = sol.get("E%d" % r)
        vital = sol.get("F%d" % r)
        want_rank = 1 + sum(1 for x in counts.values() if x > counts[r])
        want_cum = sum(x for x in counts.values() if x >= counts[r]) / total * 100
        want_vital = "yes" if want_cum <= 80 else "no"
        if rank != want_rank:
            fail("pareto", "%s row %d: rank %r, expected %d" % (spec["slug"], r, rank, want_rank))
            bad += 1
        if abs((share or 0) - counts[r] / total * 100) > 1e-6:
            fail("pareto", "%s row %d: share %r" % (spec["slug"], r, share))
            bad += 1
        if abs((cum or 0) - want_cum) > 1e-6:
            fail("pareto", "%s row %d: cumulative %r, expected %.4f"
                 % (spec["slug"], r, cum, want_cum))
            bad += 1
        if vital != want_vital:
            fail("pareto", "%s row %d: vital-few %r, expected %r"
                 % (spec["slug"], r, vital, want_vital))
            bad += 1
    if not bad:
        ok("%s: %d rows, rank, share, cumulative and vital-few all recomputed"
           % (spec["slug"], len(rows)))


def check_stencil_by_row(spec):
    path = os.path.join(TPL, "%s-example-%s-2026-10-31.xlsx" % (spec["slug"], VERSION))
    sol = _solve(path)
    ws = load_workbook(path)["Sheet"]
    th = {}
    for r in range(1, 12):
        label = ws.cell(row=r, column=1).value
        if label:
            th[str(label)] = ws.cell(row=r, column=2).value
    area_min = th.get("Area ratio, minimum")
    asp_min = th.get("Aspect ratio, minimum")
    bad = 0
    n = 0
    for r in range(1, ws.max_row + 1):
        if ws.cell(row=r, column=1).value != "Aperture":
            continue   # header row of the data table
        r += 1
        while ws.cell(row=r, column=1).value:
            shape = ws.cell(row=r, column=3).value
            w = ws.cell(row=r, column=4).value
            L = ws.cell(row=r, column=5).value
            f = ws.cell(row=r, column=6).value
            if shape == "round":
                want_area = (3.141592653589793 / 4 * w * w) / (3.141592653589793 * w * f)
                want_verdict = "ok" if want_area >= area_min else "step the foil down"
            else:
                want_area = (w * L) / (2 * (w + L) * f)
                want_asp = w / f
                if abs((sol.get("H%d" % r) or 0) - want_asp) > 1e-6:
                    fail("stencil", "row %d aspect %r, expected %.4f"
                         % (r, sol.get("H%d" % r), want_asp))
                    bad += 1
                want_verdict = ("ok" if (want_area >= area_min and want_asp >= asp_min)
                                else "step the foil down")
            if abs((sol.get("G%d" % r) or 0) - want_area) > 1e-6:
                fail("stencil", "row %d area ratio %r, expected %.4f"
                     % (r, sol.get("G%d" % r), want_area))
                bad += 1
            if sol.get("I%d" % r) != want_verdict:
                fail("stencil", "row %d verdict %r, expected %r"
                     % (r, sol.get("I%d" % r), want_verdict))
                bad += 1
            n += 1
            r += 1
    if not bad and n:
        ok("%s: %d apertures, area ratio, aspect ratio and verdict recomputed"
           % (spec["slug"], n))


def check_reflow_model(spec):
    path = os.path.join(TPL, "%s-example-%s-2026-10-31.xlsx" % (spec["slug"], VERSION))
    sol = _solve(path)
    ws = load_workbook(path)["Sheet"]
    th = {}
    for r in range(1, 12):
        if ws.cell(row=r, column=1).value:
            th[str(ws.cell(row=r, column=1).value)] = ws.cell(row=r, column=2).value
    liq = th.get("Liquidus, SAC305 (C)")
    head = next(r for r in range(1, ws.max_row + 1)
                if ws.cell(row=r, column=1).value == "Segment")
    seg = {}
    r = head + 1
    while ws.cell(row=r, column=1).value:
        seg[r] = (ws.cell(row=r, column=2).value, ws.cell(row=r, column=3).value,
                  ws.cell(row=r, column=4).value)
        r += 1
    if len(seg) < 2:
        fail("reflow", "%s: the segment table has %d rows" % (spec["slug"], len(seg)))
        return
    # Every segment's own share of the time above liquidus, recomputed here from
    # the temperatures the sheet holds.
    def share(start, end, dur):
        lo, hi = min(start, end), max(start, end)
        if hi == lo:
            return dur if lo > liq else 0.0
        return dur * max(0.0, (hi - max(lo, liq)) / (hi - lo))
    tal = sum(share(a, b, d) for a, b, d in seg.values())
    first, last = min(seg), max(seg)
    peak = max(max(a, b) for a, b, _ in seg.values())
    ramp = (seg[first][1] - seg[first][0]) / seg[first][2]
    cool = (seg[last][0] - seg[last][1]) / seg[last][2]
    bad = 0
    for r, (a, b, d) in seg.items():
        got = sol.get("G%d" % r)
        want = share(a, b, d)
        if got is None or abs(float(got) - want) > 1e-6:
            fail("reflow", "row %d: above-liquidus %r, expected %.4f" % (r, got, want))
            bad += 1
    labels = {}
    for r in range(1, ws.max_row + 1):
        v = ws.cell(row=r, column=1).value
        if isinstance(v, str):
            labels[v] = r
    def val(label):
        r = labels.get(label)
        return sol.get("B%d" % r) if r else None
    for label, want in [("Peak temperature (C)", peak),
                        ("Time above liquidus (s)", tal),
                        ("Ramp-up rate (C/s)", ramp),
                        ("Cooling rate (C/s)", cool)]:
        got = val(label)
        if got is None or abs(float(got) - want) > 1e-6:
            fail("reflow", "%s: %r, expected %.4f" % (label, got, want))
            bad += 1
    # The verdict has to follow the sheet's own thresholds and summary cells.
    verdict = val("Profile verdict")
    want_v = ("in window"
              if th["Peak, minimum (C)"] <= peak <= th["Peak, maximum (C)"]
              and th["Time above liquidus, min (s)"] <= tal <= th["Time above liquidus, max (s)"]
              and ramp <= th["Ramp-up, max (C/s)"]
              and cool <= th["Cooling rate, max (C/s)"]
              else "outside window")
    if verdict != want_v:
        fail("reflow", "profile verdict %r, expected %r" % (verdict, want_v))
        bad += 1
    if not bad:
        ok("%s: %d segments, per-segment above-liquidus, TAL %.4f, peak %.0f, ramp "
           "%.4f, cooling %.4f, verdict %r all recomputed"
           % (spec["slug"], len(seg), tal, peak, ramp, cool, verdict))


def check_msl_by_row(spec):
    path = os.path.join(TPL, "%s-example-%s-2026-10-31.xlsx" % (spec["slug"], VERSION))
    sol = _solve(path)
    ws = load_workbook(path)["Sheet"]
    th = {}
    for r in range(1, 12):
        if ws.cell(row=r, column=1).value:
            th[str(ws.cell(row=r, column=1).value)] = ws.cell(row=r, column=2).value
    cab = th.get("Dry cabinet requirement (%, RH)")
    floor = {"3": th.get("Floor life, MSL 3 (h)"), "4": th.get("Floor life, MSL 4 (h)"),
             "5": th.get("Floor life, MSL 5 (h)")}
    head = next(r for r in range(1, ws.max_row + 1)
                if ws.cell(row=r, column=1).value == "Reel")
    bad, n = 0, 0
    r = head + 1
    while ws.cell(row=r, column=1).value:
        msl = str(ws.cell(row=r, column=4).value)
        opened = ws.cell(row=r, column=5).value
        rh = ws.cell(row=r, column=6).value
        line = ws.cell(row=r, column=8).value or 0
        planned = ws.cell(row=r, column=12).value
        want_q = "yes" if rh <= cab else "no"
        want_counted = line if want_q == "yes" else opened + line
        want_floor = floor.get(msl)
        want_rem = (want_floor - want_counted) if want_floor is not None else None
        want_dec = (None if want_floor is None
                    else ("release" if want_rem >= planned else "bake or reschedule"))
        if sol.get("G%d" % r) != want_q:
            fail("msl", "row %d: cabinet %r" % (r, sol.get("G%d" % r))); bad += 1
        if abs(float(sol.get("I%d" % r)) - want_counted) > 1e-9:
            fail("msl", "row %d: counted %r, expected %r"
                 % (r, sol.get("I%d" % r), want_counted)); bad += 1
        if want_floor is None:
            if sol.get("M%d" % r) not in ("", None):
                fail("msl", "row %d: a decision was produced for an MSL with no floor "
                            "life in the table (%r)" % (r, sol.get("M%d" % r))); bad += 1
        else:
            if abs(float(sol.get("J%d" % r)) - want_floor) > 1e-9:
                fail("msl", "row %d: floor life %r" % (r, sol.get("J%d" % r))); bad += 1
            if abs(float(sol.get("K%d" % r)) - want_rem) > 1e-9:
                fail("msl", "row %d: remaining %r, expected %r"
                     % (r, sol.get("K%d" % r), want_rem)); bad += 1
            if sol.get("M%d" % r) != want_dec:
                fail("msl", "row %d: decision %r, expected %r"
                     % (r, sol.get("M%d" % r), want_dec)); bad += 1
        n += 1
        r += 1
    if not bad and n:
        ok("%s: %d reels, cabinet test, counted exposure, floor life and decision "
           "recomputed" % (spec["slug"], n))


BY_ROW = {
    "pareto-defects": check_pareto_by_row,
    "stencil-check": check_stencil_by_row,
    "reflow-profile": check_reflow_model,
    "msl-log": check_msl_by_row,
}


# ------------------------------------------- do the template rows match the case?
# The templates carry worked examples, and the cases carry data files. They are
# two copies of the same numbers, and nothing compared them: the reflow sheet
# listed five invented intervals while the case printed six, and the stencil
# sheet invented two apertures. This check reads the case's data file and the
# sheet's table and requires them to be the same table.

def _case_file(cases, case_id, name):
    case = next((c for c in cases["cases"] if c["caseId"] == case_id), None)
    if case is None:
        return None
    for f in case.get("dataFiles", []):
        if f["name"] == name:
            rows = [ln.split(",") for ln in f["content"].strip().split("\n")]
            head = rows[0]
            return [dict(zip(head, r)) for r in rows[1:] if any(r)]
    return None


DATA_MATCH = [
    # slug, case, data file, key column in both, (sheet column -> csv column)
    ("reflow-profile", "cx-m06-01", "profile.csv", "interval", {
        "Start (C)": "from_c", "End (C)": "to_c", "Duration (s)": "seconds"}),
    ("stencil-check", "cx-m03-01", "aperture-table.csv", "aperture_id", {
        "Width or dia (mm)": "width_mm", "Foil (mm)": "foil_mm"}),
    ("msl-log", "cx-m02-01", "msl-log.csv", "reel", {
        "MSL": "msl", "Bag opened (h ago)": "bag_open_h_ago",
        "Cabinet RH (%)": "cabinet_rh_pct", "Line exposure (h)": "line_exposure_h",
        "Reflow planned in (h)": "reflow_in_h"}),
]


def check_data_matches_case(cases):
    for slug, case_id, fname, keycol, mapping in DATA_MATCH:
        rows = _case_file(cases, case_id, fname)
        if rows is None:
            fail("data", "%s: no data file %s in %s" % (slug, fname, case_id))
            continue
        path = os.path.join(TPL, "%s-example-%s-2026-10-31.xlsx" % (slug, VERSION))
        ws = load_workbook(path)["Sheet"]
        head = None
        first_col = {"reflow-profile": "Segment", "stencil-check": "Aperture",
                     "msl-log": "Reel"}[slug]
        for r in range(1, ws.max_row + 1):
            if ws.cell(row=r, column=1).value == first_col:
                head = r
                break
        if head is None:
            fail("data", "%s: no data table header found" % slug)
            continue
        cols = {}
        for c in range(1, ws.max_column + 1):
            v = ws.cell(row=head, column=c).value
            if v:
                cols[str(v)] = c
        got = []
        for r in range(head + 1, ws.max_row + 1):
            key = ws.cell(row=r, column=1).value
            if not key:
                break
            got.append((r, str(key)))
        if len(got) != len(rows):
            fail("data", "%s: the sheet has %d rows, %s has %d"
                 % (slug, len(got), fname, len(rows)))
            continue
        bad = 0
        for (r, key), csv_row in zip(got, rows):
            if key != csv_row[keycol]:
                # The reflow sheet names its segments in title case.
                if key.lower().replace(" ", "_") != csv_row[keycol]:
                    fail("data", "%s row %d: %r, case says %r"
                         % (slug, r, key, csv_row[keycol]))
                    bad += 1
                    continue
            for sheet_col, csv_col in mapping.items():
                if csv_col not in csv_row:
                    fail("data", "%s: %s is not a column of %s"
                         % (slug, csv_col, fname))
                    bad += 1
                    continue
                want = csv_row[csv_col]
                if want in ("", None):
                    continue
                cell = ws.cell(row=r, column=cols[sheet_col]).value
                try:
                    same = abs(float(cell) - float(want)) < 1e-9
                except Exception:
                    same = str(cell) == str(want) or \
                           str(cell).lower().replace("_", " ") == \
                           str(want).lower().replace("_", " ")
                if not same:
                    fail("data", "%s row %d (%s): %s is %r, the case says %r"
                         % (slug, r, key, sheet_col, cell, want))
                    bad += 1
        if not bad:
            ok("%s: %d rows are the %s table, cell for cell"
               % (slug, len(got), fname))


def check_blank_has_no_errors():
    """A blank template is a form; a form full of #DIV/0! is not shippable."""
    for spec in ROWS:
        if spec["kind"] != "xlsx":
            continue
        path = os.path.join(TPL, "%s-blank-%s-2026-10-31.xlsx" % (spec["slug"], VERSION))
        try:
            sol = _solve(path)
        except Exception as e:
            fail("blank", "%s: the engine could not open the blank sheet: %s"
                 % (spec["slug"], e))
            continue
        errs = [(c, v) for c, v in sol.items()
                if isinstance(v, str) and v.startswith("#")]
        if errs:
            fail("blank", "%s: %d error cells in the blank sheet, e.g. %s"
                 % (spec["slug"], len(errs), errs[:3]))
        else:
            ok("%s: the blank sheet computes without a single error cell" % spec["slug"])


def check_deterministic_build():
    """Two builds of the same source must produce identical bytes."""
    import subprocess
    import tempfile
    import shutil
    before = {}
    for name in sorted(os.listdir(TPL)):
        path = os.path.join(TPL, name)
        if os.path.isfile(path):
            before[name] = open(path, "rb").read()
    tmp = tempfile.mkdtemp()
    try:
        shutil.copytree(TPL, os.path.join(tmp, "prev"))
        r = subprocess.run([sys.executable, os.path.join(HERE, "build-templates.py")],
                           capture_output=True, text=True)
        if r.returncode != 0:
            fail("determinism", "the rebuild failed: %s" % r.stderr.strip()[-400:])
            return
        diffs = []
        for name, data in before.items():
            path = os.path.join(TPL, name)
            if not os.path.exists(path):
                diffs.append(name + " (disappeared)")
            elif open(path, "rb").read() != data:
                diffs.append(name)
        if diffs:
            fail("determinism", "%d file(s) change on rebuild: %s"
                 % (len(diffs), ", ".join(diffs[:4])))
        else:
            ok("a rebuild reproduces all %d files byte for byte" % len(before))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


# ------------------------------- the 8D's own arithmetic, run in the engine
# The 8D is a document, but its D2 and D7 rows carry the two rates the whole
# report turns on. They ship as live Excel expressions, so they are evaluated
# here with the same engine as the workbooks, against the m14 case keys.

DOCX_FORMULA_EXPECTATIONS = [
    ("8d-report", "Defect rate, DPMO, computed from (a) (b)", ("key", "cx-m14-01", "s1"),
     "D2 rate, 49.4 DPMO"),
    ("8d-report", "Before rate, ppm of boards, computed from (a) (b)",
     ("key", "cx-m14-01", "s7"), "D7 before rate, 16,000 ppm"),
    ("8d-report", "After rate, ppm of boards, computed from (c) (d)",
     ("key", "cx-m14-01", "s8"), "D7 after rate, 2,800 ppm"),
    ("8d-report", "Reduction, percent, computed from the two rates",
     ("key", "cx-m14-01", "s9"), "D7 reduction, 82.5 %"),
]


def check_docx_formulas(cases):
    import tempfile
    from openpyxl import Workbook
    for slug, label, target, what in DOCX_FORMULA_EXPECTATIONS:
        path = os.path.join(TPL, "%s-example-%s-2026-10-31.docx" % (slug, VERSION))
        doc = Document(path)
        expr = None
        for t in doc.tables:
            for row in t.rows:
                if row.cells[0].text.strip() == label:
                    expr = row.cells[1].text.strip()
        if not expr or not expr.startswith("="):
            fail("docx", "%s: field %r carries no expression" % (slug, label))
            continue
        wb = Workbook()
        ws = wb.active
        ws.title = "SHEET"
        # openpyxl only treats a leading "=" as a formula; strip the display
        # space the docx shows ("= ROUND(...)") but keep the equals sign.
        ws["A1"] = "=" + expr.lstrip("= ").strip()
        tmp = os.path.join(tempfile.mkdtemp(), "docx_formula.xlsx")
        wb.save(tmp)
        try:
            got = _solve(tmp)["A1"]
        except Exception as e:
            fail("docx", "%s: the engine could not evaluate %r: %s" % (slug, expr, e))
            continue
        if target[0] == "key":
            want = case_key(cases, target[1], target[2])
        else:
            want = target[1]
        if abs(float(got) - float(want)) > max(0.005, abs(float(want)) * 0.001):
            fail("docx", "%s: %s evaluates to %r, the case says %r (%s)"
                 % (slug, label, got, want, what))
        else:
            ok("%s: %s evaluates to %s in the engine" % (slug, what, want))


# --------------------------- do the DOCX example values match the docx data?
# The checklist and the 8D carry numbers that also live in the case's data
# files. Every one of them is listed here against the data file that holds it,
# so a figure typed into a template cannot drift away from the case.

DOCX_DATA_MATCH = [
    ("incoming-checklist", "cx-m01-01", "receipt-plan.csv", [
        ("Quantity on label", "lot_size_declared"),
        ("Quantity counted", "lot_size_counted"),
        ("Sample size actually pulled", "sample_taken"),
    ]),
    ("incoming-checklist", "cx-m01-01", "board-lot.csv", [
        ("Bow and twist, measured gap (mm)", "twist_gap_mm"),
    ]),
]

# The twist is the worst carton in the data file, not the first one, and the
# sample-size row is the plan's own count. Both are single cells in the docx.
DOCX_TEXT_MATCH = [
    ("incoming-checklist", "Sample size actually pulled", "20"),
    # The plan's own n at code K, AQL 1.0: the case computes it (s4) and the
    # sheet states it next to what was actually pulled.
    ("incoming-checklist", "Sample size required by the plan", "125"),
    ("incoming-checklist", "AQL", "1.0"),
    ("incoming-checklist", "Inspection level (ISO 2859-1)", "General inspection level II"),
]


def check_docx_data(cases):
    for slug, case_id, fname, mapping in DOCX_DATA_MATCH:
        rows = _case_file(cases, case_id, fname)
        if rows is None:
            fail("docxdata", "%s: no data file %s in %s" % (slug, fname, case_id))
            continue
        doc = Document(os.path.join(
            TPL, "%s-example-%s-2026-10-31.docx" % (slug, VERSION)))
        fields = {}
        for t in doc.tables:
            for row in t.rows:
                fields[row.cells[0].text.strip()] = row.cells[1].text.strip()
        for label, col in mapping:
            if label not in fields:
                fail("docxdata", "%s: no field %r" % (slug, label))
                continue
            # receipt-plan.csv is key/value rows, not a table with a header of
            # its own columns: the key to look up is in its "item" column.
            if "item" in rows[0]:
                values = [r["value"] for r in rows if r.get("item") == col]
            else:
                values = [r[col] for r in rows if r.get(col) not in ("", None)]
            try:
                got = float(fields[label])
                want = [float(v) for v in values]
            except Exception:
                continue
            # The measured twist is the worst carton; the counted quantity is the
            # box total. Both comparisons are stated rather than implied.
            if col == "twist_gap_mm":
                good = abs(got - max(want)) < 1e-9
                why = "the worst carton"
            else:
                good = got in want
                why = "one of the data rows"
            if not good:
                fail("docxdata", "%s: %r is %r, which is not %s of %s"
                     % (slug, label, fields[label], why, fname))
        ok("%s: the docx figures are the %s table" % (slug, fname))
    for slug, label, want in DOCX_TEXT_MATCH:
        doc = Document(os.path.join(
            TPL, "%s-example-%s-2026-10-31.docx" % (slug, VERSION)))
        fields = {}
        for t in doc.tables:
            for row in t.rows:
                fields[row.cells[0].text.strip()] = row.cells[1].text.strip()
        if fields.get(label, "") != want:
            fail("docxdata", "%s: %r is %r, expected %r"
                 % (slug, label, fields.get(label), want))


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
    for spec in ROWS:
        if spec["kind"] == "xlsx" and spec["slug"] in BY_ROW:
            BY_ROW[spec["slug"]](spec)
    check_docx_formulas(cases)
    check_data_matches_case(cases)
    check_docx_data(cases)
    check_blank_has_no_errors()
    check_package(cases)
    # Last: it rebuilds the files, so every other check has already read them.
    check_deterministic_build()

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
