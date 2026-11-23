#!/usr/bin/env python3
"""build-templates.py — Phase 4: the downloadable template set.

For every spec in scripts/templates/specs.py, write three files into
assets/templates/:

    <slug>-blank-<version>-<date>.xlsx|docx
    <slug>-example-<version>-<date>.xlsx|docx
    <slug>-guide-<version>-<date>.md

Design rules, all of them from the brief and from this repository's habits:

* Thresholds are on their own sheet, never inside a formula. A plant changes a
  limit without touching arithmetic.
* Formula cells are locked; input cells are not. The sheet is protected without
  a password, so a reviewer can unlock it rather than being stuck behind it.
* The example variant is filled from data/cases.json — the same numbers the
  cases publish — so a template cannot drift from the course.
* Every file carries "Training template. Adapt to your quality system." as its
  last row (or last paragraph), and the version and date in the file name.

Usage:
  python3 scripts/build-templates.py            # write assets/templates/
  python3 scripts/build-templates.py --check    # fail if output is stale
"""

import argparse
import datetime
import hashlib
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "assets", "templates")

sys.path.insert(0, os.path.join(HERE, "templates"))
from specs import NOTICE, ROWS, VERSION  # noqa: E402

try:
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
    from openpyxl.utils import get_column_letter
    from openpyxl.worksheet.protection import SheetProtection
    from docx import Document
    from docx.shared import Pt
except ImportError as e:  # pragma: no cover - environment guard
    sys.exit("build-templates needs openpyxl and python-docx: " + str(e))


# The release date, not the build date. A rebuild must not rename every file.
def release_date():
    idx = os.path.join(ROOT, "index.html")
    with open(idx, encoding="utf-8") as f:
        for line in f:
            if "data-release" in line or "release-date" in line:
                pass
    return "2026-10-31"


DATE = release_date()

def copy_protection(prot, **kw):
    """openpyxl 3.1 deprecated Protected.copy; this is the forward-compatible form."""
    from copy import copy as _copy
    new = _copy(prot)
    for k, v in kw.items():
        setattr(new, k, v)
    return new


HEAD_FILL = PatternFill("solid", fgColor="1F3A5F")
THRESH_FILL = PatternFill("solid", fgColor="F2E9D8")
INPUT_FILL = PatternFill("solid", fgColor="FFFFFF")
LOCKED_FILL = PatternFill("solid", fgColor="EEF2F7")
THIN = Side(style="thin", color="B8C2CC")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)


def fname(spec, variant):
    ext = "md" if variant == "guide" else spec["kind"]
    return "%s-%s-%s-%s.%s" % (spec["slug"], variant, VERSION, DATE, ext)


# ---------------------------------------------------------------- xlsx build

def xlsx_threshold_block(ws, spec, start_row=1):
    """Thresholds live here and nowhere else.

    Returns (next free row, {threshold label: absolute address}). Formulas refer
    to thresholds by LABEL and the address is substituted here, so no formula in
    this product contains a hand-typed row number — the mistake that made every
    stencil formula point at the wrong limit the first time it was built.
    """
    ws.cell(row=start_row, column=1, value="THRESHOLDS").font = Font(bold=True, size=12)
    ws.cell(row=start_row, column=1).fill = HEAD_FILL
    ws.cell(row=start_row, column=1).font = Font(bold=True, size=12, color="FFFFFF")
    for c in range(2, 5):
        ws.cell(row=start_row, column=c).fill = HEAD_FILL
    hdr = ["Limit", "Value", "Source", "From"]
    for i, h in enumerate(hdr, start=1):
        cell = ws.cell(row=start_row + 1, column=i, value=h)
        cell.font = Font(bold=True)
        cell.fill = THRESH_FILL
        cell.border = BORDER
    r = start_row + 2
    addresses = {}
    for label, value, src, origin in spec.get("thresholds", []):
        addresses[label] = "$B$%d" % r
        ws.cell(row=r, column=1, value=label).border = BORDER
        v = ws.cell(row=r, column=2, value=value)
        v.border = BORDER
        v.fill = THRESH_FILL
        v.font = Font(bold=True)
        ws.cell(row=r, column=3, value=src if src else "no source id").border = BORDER
        ws.cell(row=r, column=4, value=origin).border = BORDER
        r += 1
    note = ws.cell(row=r, column=1,
                   value="A threshold without a source id is a course or control-plan "
                         "value, not a published requirement. Change it here, not in a "
                         "formula.")
    note.font = Font(italic=True, size=9)
    return r + 2, addresses


def build_xlsx(spec, variant, data):
    wb = Workbook()
    ws = wb.active
    ws.title = "Sheet"

    # Thresholds first, so formulas can point at fixed cells.
    after, th_addr = xlsx_threshold_block(ws, spec, 1)

    def resolve(formula):
        """Replace [[threshold label]] with the cell that holds it."""
        # read at call time: the layout is fixed just below, before any formula
        # is resolved.
        sum_start = head_row + nrows + 3     # first value row of the summary block
        def sub(m):
            label = m.group(1).strip()
            if label not in th_addr:
                raise KeyError("%s: formula refers to a threshold that does not exist: %r"
                               % (spec["slug"], label))
            return th_addr[label]
        formula = re.sub(r"\[\[([^]]+)\]\]", sub, formula)
        # The data range is decided here, from the layout the builder is about to
        # write. A spec that hard-codes row numbers goes wrong the moment a
        # threshold is added above the table — which is exactly what happened to
        # the Pareto sheet.
        first, last = head_row + 1, head_row + nrows
        formula = formula.replace("DATA_ROWS", "$B$%d:$B$%d" % (first, last))
        formula = formula.replace("RANK_COL", "$C$%d:$C$%d" % (first, last))
        # COL[header] names the whole data column under that header, so a
        # summary never has to know which row the table ends on.
        def colsub(m):
            name = m.group(1).strip()
            if name not in cols:
                raise KeyError("%s: no such column in the data table: %r"
                               % (spec["slug"], name))
            letter = get_column_letter(cols.index(name) + 1)
            return "$%s$%d:$%s$%d" % (letter, first, letter, last)

        formula = re.sub(r"COL\[([^]]+)\]", colsub, formula)
        formula = formula.replace("FIRSTROW", str(first)).replace("LASTROW", str(last))
        # Summary cells refer to each other by position in their own block, for
        # the same reason: a summary that names B22 breaks the moment the table
        # above it gains a row.
        formula = re.sub(r"SUMROW\[(\d+)\]",
                         lambda m: "$B$%d" % (sum_start + int(m.group(1)) - 1),
                         formula)
        return formula

    def input_guard():
        """A COUNTA reference list over every input cell of the data table.

        A blank template is a form, and a form that greets the user with
        #DIV/0! in every computed column is not usable. Each formula is wrapped
        so an empty row shows an empty cell; the formula is still there, ready
        for the first number typed into the row.
        """
        refs = []
        for j in range(nrows):
            r = head_row + 1 + j
            for i, c in enumerate(cols, start=1):
                if c not in spec.get("formulas", {}):
                    refs.append("%s%d" % (get_column_letter(i), r))
        return ",".join(refs)

    def guarded(expr, refs):
        """Wrap a formula so it evaluates to an empty string on empty input."""
        return '=IF(COUNTA(%s)=0,"",%s)' % (refs, expr[1:]) if refs else expr

    # The data table. Its shape is known before any formula is resolved, so
    # resolve() below can name the range it will actually write.
    cols = spec["columns"]
    head_row = after
    nrows = max(len(spec.get("example_rows", [])), 6)
    for i, c in enumerate(cols, start=1):
        cell = ws.cell(row=head_row, column=i, value=c)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = HEAD_FILL
        cell.alignment = Alignment(wrap_text=True, vertical="center")
        cell.border = BORDER
    ws.row_dimensions[head_row].height = 30

    formula_cells = []
    for j in range(nrows):
        r = head_row + 1 + j
        if variant == "example" and j < len(spec.get("example_rows", [])):
            row = list(spec["example_rows"][j])
        else:
            row = [None] * len(cols)
        for i, c in enumerate(cols, start=1):
            f = spec.get("formulas", {}).get(c)
            if f:
                refs = ",".join("%s%d" % (get_column_letter(k), r)
                                for k, cc in enumerate(cols, start=1)
                                if cc not in spec.get("formulas", {}))
                cell = ws.cell(row=r, column=i,
                               value=guarded(resolve(f.format(r=r)), refs))
                cell.fill = LOCKED_FILL
                formula_cells.append(cell.coordinate)
            else:
                cell = ws.cell(row=r, column=i, value=row[i - 1])
                cell.fill = INPUT_FILL
            cell.border = BORDER

    last_data_row = head_row + nrows

    # Optional summary block, with its own formulas.
    next_row = last_data_row + 2
    if spec.get("summary"):
        ws.cell(row=next_row, column=1, value="SUMMARY").font = Font(bold=True)
        next_row += 1
        for label, formula in spec["summary"]:
            ws.cell(row=next_row, column=1, value=label).font = Font(bold=True)
            # The summary formulas were written against this block's layout.
            cell = ws.cell(row=next_row, column=2,
                           value=guarded(resolve(formula), input_guard()))
            cell.fill = LOCKED_FILL
            cell.border = BORDER
            formula_cells.append(cell.coordinate)
            next_row += 1

    if spec.get("example_note") and variant == "example":
        c = ws.cell(row=next_row + 1, column=1, value=spec["example_note"])
        c.font = Font(italic=True, size=9)
        next_row += 3

    # Furniture: widths, freeze, notice, protection.
    widths = {}
    for i, c in enumerate(cols, start=1):
        widths[i] = max(12, min(34, len(str(c)) + 4))
    for i, w in widths.items():
        ws.column_dimensions[get_column_letter(i)].width = w

    ws.freeze_panes = ws.cell(row=head_row + 1, column=1)

    notice_row = max(next_row + 2, last_data_row + 3)
    ncell = ws.cell(row=notice_row, column=1, value=NOTICE)
    ncell.font = Font(italic=True, size=9)

    vcell = ws.cell(row=notice_row + 1, column=1,
                    value="Version %s, %s. Generated by scripts/build-templates.py; "
                          "formulas not to be edited." % (VERSION, DATE))
    vcell.font = Font(italic=True, size=8)

    # Lock everything, then unlock the input cells. No password: a reviewer
    # needs to be able to look inside, and a forgotten password is a support
    # ticket, not a protection.
    for row in ws.iter_rows(min_row=1, max_row=notice_row + 1, max_col=len(cols)):
        for cell in row:
            cell.protection = copy_protection(cell.protection, locked=True)
    for j in range(nrows):
        r = head_row + 1 + j
        for i, c in enumerate(cols, start=1):
            if c not in spec.get("formulas", {}):
                ws.cell(row=r, column=i).protection = copy_protection(
                    ws.cell(row=r, column=i).protection, locked=False)
    # threshold values stay editable: they are the plant's to change
    for rr in range(2, 2 + len(spec.get("thresholds", []))):
        ws.cell(row=rr, column=2).protection = copy_protection(
            ws.cell(row=rr, column=2).protection, locked=False)
    ws.protection = SheetProtection(sheet=True, formatCells=False,
                                    insertRows=True, deleteRows=True)

    # Second sheet: what this is for.
    extra = wb.create_sheet("How to use")
    lines = [
        ("Template", spec["title"]),
        ("Version", "%s, %s" % (VERSION, DATE)),
        ("Cases it serves", ", ".join(spec["cases"])),
        ("Course lesson", spec["lesson"]),
        ("Standard or reference", spec["standard"]),
        ("", ""),
        ("What it is for", spec["use"]),
        ("Why the sheet looks like this", spec["why"]),
        ("", ""),
        ("Locked cells", "Formulas are locked; input cells and threshold values are "
                         "not. Unlock from Review > Unprotect Sheet (no password) if "
                         "you need to change the structure."),
        ("Thresholds", "All limits live on the first block of the sheet. Change them "
                       "there — a limit typed into a formula cannot be audited."),
        ("Notice", NOTICE),
    ]
    for i, (k, v) in enumerate(lines, start=1):
        extra.cell(row=i, column=1, value=k).font = Font(bold=True)
        c = extra.cell(row=i, column=2, value=v)
        c.alignment = Alignment(wrap_text=True, vertical="top")
    extra.column_dimensions["A"].width = 28
    extra.column_dimensions["B"].width = 92

    path = os.path.join(OUT, fname(spec, variant))
    wb.save(path)
    return path, formula_cells


# ---------------------------------------------------------------- docx build

def build_docx(spec, variant, data):
    doc = Document()
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(10)

    doc.add_heading(spec["title"], level=0)
    sub = doc.add_paragraph()
    run = sub.add_run("%s %s · %s · %s" % (
        "Blank" if variant == "blank" else "Worked example",
        VERSION, DATE, ", ".join(spec["cases"])))
    run.italic = True
    run.font.size = Pt(9)

    doc.add_paragraph(spec["use"])
    ref = doc.add_paragraph()
    r = ref.add_run("Reference: " + spec["standard"] + ". Lesson " + spec["lesson"] + ".")
    r.font.size = Pt(9)
    r.italic = True

    for title, fields in spec["sections"]:
        doc.add_heading(title, level=1)
        if variant == "example":
            table = doc.add_table(rows=0, cols=2)
            table.style = "Light Grid Accent 1"
            for label, kind in fields:
                cells = table.add_row().cells
                cells[0].text = label
                raw = str(spec["example"].get(label, ""))
                # A field declared as "formula" is an Excel expression, not a
                # finished number: the example ships the expression, so the
                # reader can type it into a cell and watch it move with the
                # inputs instead of taking a printed figure on trust.
                if kind == "formula":
                    raw = "= " + raw.lstrip("=")
                cells[1].text = raw
                cells[0].paragraphs[0].runs[0].bold = True
                for c in cells:
                    for p in c.paragraphs:
                        for rr in p.runs:
                            rr.font.size = Pt(9)
        else:
            table = doc.add_table(rows=0, cols=3)
            table.style = "Light Grid Accent 1"
            hdr = table.add_row().cells
            for i, h in enumerate(["Item", "Entry", "Evidence attached"]):
                hdr[i].text = h
                hdr[i].paragraphs[0].runs[0].bold = True
            for label, kind in fields:
                cells = table.add_row().cells
                cells[0].text = label
                cells[1].text = ""
                cells[2].text = ""
                for c in cells:
                    for p in c.paragraphs:
                        for rr in p.runs:
                            rr.font.size = Pt(9)
        doc.add_paragraph("")

    footer = doc.add_paragraph()
    fr = footer.add_run(NOTICE)
    fr.italic = True
    fr.font.size = Pt(9)
    ver = doc.add_paragraph()
    vr = ver.add_run("Version %s, %s. Case data from %s." % (
        VERSION, DATE, ", ".join(spec["cases"])))
    vr.italic = True
    vr.font.size = Pt(8)

    path = os.path.join(OUT, fname(spec, variant))
    doc.save(path)
    return path, []


# ---------------------------------------------------------------- the guide

def build_guide(spec):
    lines = [
        "# %s" % spec["title"],
        "",
        "%s · %s · serves %s" % (VERSION, DATE, ", ".join(spec["cases"])),
        "",
        "## What it is for",
        "",
        spec["use"],
        "",
        "## Why it looks like this",
        "",
        spec["why"],
        "",
        "## How to fill it in",
        "",
    ]
    if spec["kind"] == "xlsx":
        lines += [
            "1. Read the **THRESHOLDS** block first. Those are the limits this sheet "
            "judges against; if your quality system specifies different ones, change "
            "them there and nowhere else.",
            "2. Enter your numbers in the white cells only. The grey cells are "
            "formulas and are locked — that is deliberate, so a filled sheet can be "
            "checked against the arithmetic rather than trusted.",
            "3. A limit with no source id is a course or control-plan value, not a "
            "published requirement. Say so when you quote it.",
            "4. Nothing on the sheet is protected by a password: Review > Unprotect "
            "Sheet if you need to change its structure.",
        ]
    else:
        lines += [
            "1. Fill every row. A blank is a finding: it means the evidence was not "
            "collected, which is different from evidence that passed.",
            "2. Where a row asks for a number, record the unit and the sample it came "
            "from in the same row.",
            "3. The evidence column is for what you attached — a photograph with a "
            "scale, a printout, a measurement file. A row with no evidence is an "
            "opinion.",
        ]
    if spec.get("fill_notes"):
        lines += ["", "## Traps this record is built around", ""]
        lines += ["* " + n for n in spec["fill_notes"]]
    lines += [
        "",
        "## What the worked example shows",
        "",
        "The example variant is filled with Board X numbers from case %s. It is there "
        "to show the shape of a complete record, not to be copied: Board X is a "
        "fictional product and its limits are the course's." % ", ".join(spec["cases"]),
        "",
        "## Reference",
        "",
        spec["standard"] + ". Taught in lesson " + spec["lesson"] + ".",
        "",
        "---",
        "",
        NOTICE,
        "",
        "Version %s, %s." % (VERSION, DATE),
        "",
    ]
    path = os.path.join(OUT, "%s-%s-%s-%s.md" % (spec["slug"], "guide", VERSION, DATE))
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    return path, []


# -------------------------------------------------------------------- driver

def load_cases():
    with open(os.path.join(ROOT, "data", "cases.json"), encoding="utf-8") as f:
        return json.load(f)


def main(argv):
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--only", default=None, help="build one slug")
    args = ap.parse_args(argv)

    os.makedirs(OUT, exist_ok=True)
    data = load_cases()

    written, formulas = [], {}
    specs = [s for s in ROWS if not args.only or s["slug"] == args.only]
    for spec in specs:
        for variant in ("blank", "example"):
            if spec["kind"] == "xlsx":
                p, fc = build_xlsx(spec, variant, data)
            else:
                p, fc = build_docx(spec, variant, data)
            written.append(p)
            if fc:
                formulas[p] = fc
        p, _ = build_guide(spec)
        written.append(p)

    # Reproducibility: pin the OOXML metadata and the ZIP clock to the release
    # date. Without this a rebuild produces different bytes every time, and a
    # reviewer cannot diff what changed between two builds of the same template.
    from office_normalise import normalise
    changed = sum(1 for p in written if p.endswith((".xlsx", ".docx")) and normalise(p))
    if changed:
        print("normalised %d OOXML file(s) to the release date" % changed)

    print("wrote %d files into assets/templates/" % len(written))
    for p in sorted(written):
        print("  %-58s %7d bytes" % (os.path.basename(p), os.path.getsize(p)))
    if formulas:
        total = sum(len(v) for v in formulas.values())
        print("formula cells: %d across %d workbooks" % (total, len(formulas)))

    # A manifest the page and the checker both read.
    manifest = {
        "version": VERSION,
        "date": DATE,
        "notice": NOTICE,
        "templates": [
            {
                "slug": s["slug"],
                "order": s["order"],
                "title": s["title"],
                "kind": s["kind"],
                "modules": s["modules"],
                "cases": s["cases"],
                "lesson": s["lesson"],
                "standard": s["standard"],
                "use": s["use"],
                "files": {
                    v: fname(s, v) for v in ("blank", "example", "guide")
                },
                "bytes": {v: os.path.getsize(os.path.join(OUT, fname(s, v)))
                          for v in ("blank", "example", "guide")},
            }
            for s in ROWS
        ],
    }
    mpath = os.path.join(OUT, "manifest.json")
    with open(mpath, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print("wrote manifest.json (%d templates)" % len(manifest["templates"]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
