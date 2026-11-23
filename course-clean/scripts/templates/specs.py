#!/usr/bin/env python3
"""templates/specs.py — what each downloadable template is.

Phase 4. One entry here produces three files:

    <slug>-blank-<version>.xlsx|docx    empty, with formulas and thresholds
    <slug>-example-<version>.xlsx|docx  the same, filled with Board X data
    <slug>-guide-<version>.md           one page, how to fill it in

Two rules run through all of them:

* **A number that the course computes is never typed into a template.** The
  example variant is built from the same generator output the cases use, and
  scripts/check-templates.py recomputes every formula against case-keys.csv.
* **Thresholds live in their own cells**, on a Thresholds sheet or in a clearly
  named block, so a plant can change a limit without editing a formula. A
  threshold that is a published requirement carries its source id in the cell
  beside it; one that is a course or control-plan value says so.

Every file ends with the line "Training template. Adapt to your quality system."
"""

NOTICE = "Training template. Adapt to your quality system."

# The version stamp goes into every file name, as the brief asks: version and
# date. The date is the course release date (index.html), not the build date, so
# a rebuild on a later day does not silently produce differently-named files.
VERSION = "v1"

ROWS = [
    # ---------------------------------------------------------------- incoming
    dict(
        slug="incoming-checklist",
        order=1,
        title="Incoming inspection checklist",
        modules=["m01"],
        cases=["cx-m01-01"],
        kind="docx",
        lesson="m01l04",
        standard="ISO 2859-1 (sampling), IPC-6012 (bare-board acceptability)",
        use="Record what was checked on the dock, what was sampled, which lot the "
            "sample came from, and what the disposition is — so a quarantine can be "
            "explained a year later.",
        why="The m01 case turns on a lot that measures fine and cannot be traced: "
            "two date codes, labels that do not match the boxes. A checklist that "
            "only records measurements would have passed it.",
        sections=[
            ("Identification", [
                ("Part number / description", "text"),
                ("Supplier and lot number on the box", "text"),
                ("Date codes present", "text"),
                ("Quantity on label", "number"),
                ("Quantity counted", "number"),
            ]),
            ("Sampling", [
                ("Inspection level (ISO 2859-1)", "text"),
                ("AQL", "number"),
                ("Lot size band and code letter", "text"),
                ("Sample size pulled", "number"),
                ("Accept / reject numbers (Ac / Re)", "text"),
            ]),
            ("Measurements", [
                ("Bow and twist, measured gap (mm)", "number"),
                ("Board length x width (mm)", "text"),
                ("Twist as a percentage of the diagonal", "number"),
                ("Limit applied (%) and its source", "text"),
                ("Humidity indicator card", "text"),
                ("Packaging condition", "text"),
            ]),
            ("Disposition", [
                ("Result (accept / quarantine / reject)", "text"),
                ("Reason, in one sentence", "text"),
                ("Who decided, and when", "text"),
                ("Certificate of conformance attached?", "text"),
            ]),
        ],
        example={
            "Part number / description": "PCB-4471 Board X bare board, 6 layer ENIG",
            "Supplier and lot number on the box": "SUP-2210, lot D2418 / D2511 (two)",
            "Date codes present": "D2418 and D2511",
            "Quantity on label": 2800,
            "Quantity counted": 2760,
            "Inspection level (ISO 2859-1)": "General inspection level II",
            "AQL": 1.0,
            "Lot size band and code letter": "1,201-3,200 = code K",
            "Sample size pulled": 20,
            "Accept / reject numbers (Ac / Re)": "Ac 3 / Re 4 (required n = 125)",
            "Bow and twist, measured gap (mm)": 2.60,
            "Board length x width (mm)": "160 x 120 (diagonal 200 mm)",
            "Twist as a percentage of the diagonal": 0.65,
            "Limit applied (%) and its source": "0.75 % for SMT boards, IPC-6012",
            "Humidity indicator card": "Blue",
            "Packaging condition": "Intact",
            "Result (accept / quarantine / reject)": "Quarantine",
            "Reason, in one sentence":
                "Nothing measured is a defect; the lot cannot be defined or traced "
                "until the supplier explains two date codes and a 40-board shortfall.",
            "Who decided, and when": "Quality engineer, 2026-09-14",
            "Certificate of conformance attached?": "Yes, for the declared lot only",
        },
    ),
    # ------------------------------------------------------------------- MSL
    dict(
        slug="msl-log",
        order=2,
        title="MSL exposure log",
        modules=["m02"],
        cases=["cx-m02-01"],
        kind="xlsx",
        lesson="m02l04",
        standard="J-STD-033 (floor life, dry storage, bake)",
        use="Track the clock on every moisture-sensitive reel: floor life, what has "
            "been counted against it, what is left, and what the bake decision is.",
        why="The m02 case is a reel that is 2 h short of its budget after a cabinet "
            "that was outside its own requirement. The log has to show why the "
            "cabinet hours counted.",
        thresholds=[
            ("Floor life, MSL 3 (h)", 168, "src-003", "m02l04"),
            ("Floor life, MSL 4 (h)", 72, "src-003", "m02l04"),
            ("Floor life, MSL 5 (h)", 48, "src-003", "m02l04"),
            ("Dry cabinet requirement (%, RH)", 5, "src-003", "m02l04"),
            ("Tape-and-reel bake ceiling (C)", 40, "src-003", "m02l04"),
        ],
        columns=["Reel", "Part", "Package", "MSL", "Bag opened (h ago)",
                 "Cabinet RH (%)", "Cabinet qualifies?", "Line exposure (h)",
                 "Counted against floor life (h)", "Floor life (h)",
                 "Remaining (h)", "Reflow planned in (h)", "Decision"],
        formulas={
            "Cabinet qualifies?": '=IF(F{r}<=[[Dry cabinet requirement (%, RH)]],"yes","no")',
            "Counted against floor life (h)": '=IF(G{r}="yes",H{r},E{r}+H{r})',
            # Direct cell references rather than a lookup: the independent
            # formula engine used by check-templates cannot evaluate VLOOKUP
            # against this layout, and an unverifiable formula is not worth the
            # flexibility. Three levels, three references.
            "Floor life (h)": '=IF(D{r}=3,[[Floor life, MSL 3 (h)]],'
                              'IF(D{r}=4,[[Floor life, MSL 4 (h)]],'
                              'IF(D{r}=5,[[Floor life, MSL 5 (h)]],"not in this table")))',
            "Remaining (h)": '=J{r}-I{r}',
            "Decision": '=IF(K{r}>=L{r},"release","bake or reschedule")',
        },
        example_rows=[
            ["R-4412", "BGA-256 14x14", "FBGA", 4, 58, 7, None, 6, None, None, None, 10, None],
            ["R-4413", "QFP-64 0.5 mm", "QFP", 3, 58, 7, None, 0, None, None, None, 10, None],
            ["R-4414", "0402 100 nF", "chip", 1, 58, 7, None, 0, None, None, None, 10, None],
        ],
        example_note="R-4414 at MSL 1 has no floor-life limit in this table, so the "
                     "decision column stays blank by design — the sheet is asking for "
                     "a value it was not given rather than inventing one.",
    ),
    # ---------------------------------------------------------------- stencil
    dict(
        slug="stencil-check",
        order=3,
        title="Stencil inspection sheet",
        modules=["m03", "m04"],
        cases=["cx-m03-01", "cx-m04-01"],
        kind="xlsx",
        lesson="m03l05",
        standard="IPC-7525 (area and aspect ratio), IPC-7526 (stencil cleaning)",
        use="Compute the release indicators for every aperture on the board and "
            "decide which need a stepped foil, before the first print.",
        why="Area ratio and aspect ratio are the two numbers that predict a print "
            "before the printer runs, and both are arithmetic on the aperture and "
            "the foil — which is exactly what a spreadsheet is for.",
        thresholds=[
            ("Area ratio, minimum", 0.66, None, "m03l05 (course guidance)"),
            ("Aspect ratio, minimum", 1.5, None, "m03l05 (course guidance)"),
            ("Foil thickness, general (mm)", 0.125, "src-004", "m03l03"),
            ("Foil thickness, fine pitch (mm)", 0.100, "src-004", "m03l03"),
        ],
        columns=["Aperture", "Component", "Shape", "Width (mm)", "Length (mm)",
                 "Foil (mm)", "Area ratio", "Aspect ratio", "Release?"],
        formulas={
            "Area ratio": '=IF(C{r}="round",(PI()/4*D{r}^2)/(PI()*D{r}*F{r}),'
                          '(D{r}*E{r})/(2*(D{r}+E{r})*F{r}))',
            "Aspect ratio": '=IF(C{r}="round","n/a (round aperture)",D{r}/F{r})',
            "Release?": '=IF(AND(G{r}>=[[Area ratio, minimum]],H{r}>=[[Aspect ratio, minimum]]),"ok","step the foil down")',
        },
        example_rows=[
            ["A-01", "QFP-64 0.5 mm", "rect", 0.20, 0.80, 0.125, None, None, None],
            ["A-03", "QFP-48 0.4 mm", "rect", 0.20, 0.80, 0.125, None, None, None],
            ["A-04", "QFP-48 0.4 mm, stepped", "rect", 0.20, 0.80, 0.100, None, None, None],
            ["A-06", "THT connector", "rect", 0.18, 0.80, 0.125, None, None, None],
            ["A-09", "0402 passive", "rect", 0.50, 0.60, 0.125, None, None, None],
            ["A-12", "Test point", "round", 1.00, None, 0.125, None, None, None],
        ],
    ),
    # ---------------------------------------------------------------- reflow
    dict(
        slug="reflow-profile",
        order=4,
        title="Reflow profile log",
        modules=["m06"],
        cases=["cx-m06-01"],
        kind="xlsx",
        lesson="m06l07",
        standard="IPC-7530 (profiling), J-STD-020 (classification temperatures)",
        use="Record the thermocouple readings, compute the ramp rates and the time "
            "above liquidus, and decide whether the profile is inside the window.",
        why="The m06 case fails a profile on the cooling rate, not on the peak — the "
            "sheet has to compute every segment or it misses the one that fails.",
        thresholds=[
            ("Liquidus, SAC305 (C)", 219, "src-008", "m06l01"),
            ("Time above liquidus, min (s)", 60, "src-008", "m06l07"),
            ("Time above liquidus, max (s)", 90, "src-008", "m06l07"),
            ("Peak, minimum (C)", 235, None, "m06l01 typical band"),
            ("Peak, maximum (C)", 245, None, "m06l01 typical band"),
            ("Ramp-up, max (C/s)", 3.0, "src-008", "m06l03"),
            ("Cooling rate, max (C/s)", 6.0, "src-008", "m06l03"),
            ("Time above 217 C, min (s)", 30, None, "J-STD-020 window, course text"),
        ],
        columns=["Segment", "Start (C)", "End (C)", "Duration (s)",
                 "Rate (C/s)", "Within limit?"],
        formulas={
            "Rate (C/s)": '=(C{r}-B{r})/D{r}',
            "Within limit?": '=IF(ABS(E{r})<=IF(C{r}>B{r},[[Ramp-up, max (C/s)]],[[Cooling rate, max (C/s)]]),"ok","out of limit")',
        },
        example_rows=[
            # The m06 profile, not an invented one: 25 -> 150 C in 60 s is the
            # case's ramp (2.0833 C/s), the peak is 248 C, and the cooling runs
            # 248 -> 100 C in 40 s (3.7 C/s). If these numbers change here, the
            # template stops agreeing with the case and check-templates fails.
            ["Preheat", 25, 150, 60, None, None],
            ["Soak", 150, 183, 60, None, None],
            ["Ramp to reflow", 183, 248, 45, None, None],
            ["Reflow", 248, 248, 25, None, None],
            ["Cooling", 248, 100, 40, None, None],
        ],
        summary=[
            ("Peak temperature (C)", '=MAX(C14:C18)'),
            # Time above liquidus is not one segment: it is the part of the ramp
            # still above the liquidus, plus the reflow dwell, plus the part of
            # the cooling ramp still above it. Every term is a cell and the
            # liquidus comes from the threshold block, so changing the alloy
            # moves the answer instead of leaving a stale constant behind.
            ("Time above liquidus (s)",
             '=D16*(C16-[[Liquidus, SAC305 (C)]])/(C16-B16)+D17'
             '+D18*(C18-[[Liquidus, SAC305 (C)]])/(C18-B18)'),
            ("Ramp-up rate (C/s)", '=(C14-B14)/D14'),
            ("Cooling rate (C/s)", '=(B18-C18)/D18'),
            ("Profile verdict",
             '=IF(AND(B22>=[[Peak, minimum (C)]],B22<=[[Peak, maximum (C)]],'
             'B23>=[[Time above liquidus, min (s)]],'
             'B23<=[[Time above liquidus, max (s)]],'
             'B24<=[[Ramp-up, max (C/s)]],'
             'B25<=[[Cooling rate, max (C/s)]]),"in window","outside window")'),
        ],
        example_note="The time above liquidus is computed from the cooling ramp, not "
                     "measured, because the log records temperatures at segment ends. "
                     "The case's own numbers are in the m06 data file.",
    ),
    # -------------------------------------------------------------------- 8D
    dict(
        slug="8d-report",
        order=5,
        title="8D problem report",
        modules=["m14"],
        cases=["cx-m14-01"],
        kind="docx",
        lesson="m14l05",
        standard="8D discipline; IATF 16949 / AS9100 corrective-action expectations",
        use="Take a defect from containment to closure in the standard eight "
            "disciplines, with the numbers that prove each one.",
        why="The m14 case keeps an 8D open because the action improved the rate and "
            "did not reach the agreed metric. A report that cannot state its metric "
            "cannot be closed either.",
        sections=[
            ("D1 — Team", [
                ("Champion", "text"),
                ("Leader", "text"),
                ("Members and functions", "text"),
            ]),
            ("D2 — Problem statement", [
                ("What is wrong, in measurable terms", "text"),
                ("Where it was found (line, station, shift)", "text"),
                ("Quantity affected, and the denominator", "text"),
                ("Defect rate and its unit", "text"),
            ]),
            ("D3 — Containment", [
                ("Containment action", "text"),
                ("Stock, WIP and field cleared?", "text"),
                ("Expiry condition of the containment", "text"),
            ]),
            ("D4 — Root cause", [
                ("Occurrence root cause, with evidence", "text"),
                ("Detection root cause (why the screen missed it)", "text"),
                ("Is the cause verified by a test, or only argued?", "text"),
            ]),
            ("D5 — Corrective action chosen", [
                ("Permanent action", "text"),
                ("Alternatives considered and why rejected", "text"),
                ("Verified date and owner", "text"),
            ]),
            ("D6 — Implementation", [
                ("Documents changed (revision numbers)", "text"),
                ("Training and date", "text"),
            ]),
            ("D7 — Effectiveness", [
                ("Metric and its agreed target", "text"),
                ("Before and after figures with sample size", "text"),
                ("Reached the target?", "text"),
            ]),
            ("D8 — Closure", [
                ("Read-across to other products", "text"),
                ("Standard or design rule updated?", "text"),
                ("Close, or stay open and why", "text"),
            ]),
        ],
        example={
            "Champion": "Quality manager",
            "Leader": "Process engineer, SMT",
            "Members and functions": "AOI operator, test engineer, design liaison",
            "What is wrong, in measurable terms":
                "Confirmed defects on Board X, detected at AOI and confirmed at ICT",
            "Where it was found (line, station, shift)": "Line 2, AOI, both shifts",
            "Quantity affected, and the denominator":
                "38 defects in 1,240 boards; 620 opportunities per board",
            "Defect rate and its unit": "49.4 DPMO, or 30.6 defects per 1000 boards",
            "Containment action": "100 % AOI review with a second operator on the "
                                  "affected part numbers",
            "Stock, WIP and field cleared?": "Stock and WIP cleared; field not affected",
            "Expiry condition of the containment": "Ends when two consecutive orders "
                                                   "run below the target rate",
            "Occurrence root cause, with evidence":
                "Paste deposit volume low on the inner rows: mean 17.09 nL against a "
                "19.8 nL nominal, Cpk 0.61 over twelve deposits",
            "Detection root cause (why the screen missed it)":
                "SPI window was set to the reference band rather than the process one, "
                "so low-volume deposits passed",
            "Is the cause verified by a test, or only argued?":
                "Verified: the twelve-deposit study and the SPI records agree",
            "Permanent action": "Stepped foil over the fine-pitch region; SPI window "
                                "recentred on the measured mean",
            "Alternatives considered and why rejected":
                "Slower squeegee speed was rejected: it moved the mean without the "
                "spread",
            "Verified date and owner": "2026-10-02, process engineer",
            "Documents changed (revision numbers)":
                "Stencil drawing rev C to rev D; SPI program rev 4; control plan rev 7",
            "Training and date": "Line 2 operators briefed 2026-10-03",
            "Metric and its agreed target": "Defect rate, target 20 per 1000 boards",
            "Before and after figures with sample size":
                "Before 30.6 per 1000 over 1,240 boards; after 21 per 1000 over 7,500 "
                "boards in the m14 data set",
            "Reached the target?": "No — 21 against 20",
            "Read-across to other products": "Same stencil design on PROD-3110, "
                                             "scheduled for next revision",
            "Standard or design rule updated?":
                "Design rule DR-14 added: fiducials and paste relief for fine pitch",
            "Close, or stay open and why":
                "Stay open: the action improved the rate by 31 % and did not reach the "
                "agreed metric, so effectiveness is not demonstrated",
        },
    ),
    # ---------------------------------------------------------------- pareto
    dict(
        slug="pareto-defects",
        order=6,
        title="Defect Pareto sheet",
        modules=["m07", "m14"],
        cases=["cx-m07-01", "cx-m14-01"],
        kind="xlsx",
        lesson="m14l04",
        standard="Pareto analysis; defect classification per IPC-A-610 class",
        use="Rank defect types by count, carry the cumulative share, and show which "
            "few types account for most of the loss.",
        why="Pareto is arithmetic that is easy to do wrong by hand: the cumulative "
            "column has to be built from a sorted list, and a sheet that sorts the "
            "input but not the running total is a common and invisible error.",
        thresholds=[
            ("Vital few, cumulative share (%)", 80, None, "course convention"),
            ("Classification", "per contract class", "src-001", "IPC-A-610"),
        ],
        columns=["Defect type", "Count", "Rank", "Share (%)", "Cumulative (%)",
                 "Vital few?"],
        formulas={
            "Rank": '=RANK(B{r},$B$7:$B$14)',
            "Share (%)": '=B{r}/SUM($B$7:$B$14)*100',
            "Cumulative (%)": '=SUMIF($C$7:$C$14,"<="&C{r},$B$7:$B$14)/SUM($B$7:$B$14)*100',
            "Vital few?": '=IF(E{r}<=$B$5,"yes","no")',
        },
        example_rows=[
            ["Insufficient solder", 380, None, None, None, None],
            ["Visible open", 420, None, None, None, None],
            ["Visible bridge", 310, None, None, None, None],
            ["Hidden open", 260, None, None, None, None],
            ["Polarity", 110, None, None, None, None],
            ["Hidden short", 90, None, None, None, None],
            ["Contamination", 70, None, None, None, None],
            ["Wrong value", 60, None, None, None, None],
        ],
        example_note="Counts are the m13 coverage model's occurrence column, so the "
                     "sheet and the coverage case disagree about nothing. Without "
                     "sorting, the cumulative column is arithmetic on the wrong order "
                     "— which is the reason this template sorts by rank rather than "
                     "trusting the rows to be entered in order.",
    ),
]
