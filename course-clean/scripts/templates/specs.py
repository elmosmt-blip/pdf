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
                ("Sample size required by the plan", "number"),
                ("Sample size actually pulled", "number"),
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
            # The plan asks for 125 pieces at code K; this is what was actually
            # pulled from the two cartons, and the shortfall is the finding.
            "Sample size required by the plan": 125,
            "Sample size actually pulled": 20,
            "Accept / reject numbers (Ac / Re)": "Ac 3 / Re 4",
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
        fill_notes=[
            'Record the sample size the plan **required** next to the one you actually pulled. A shortfall is a finding about the inspection, not about the lot.',
            'Write the unit and the source beside every measurement. `2.60` alone cannot be checked in six months; `2.60 mm, carton 3, calipers` can.',
            'The disposition is a decision, not a summary: name who decided and when, and attach the certificate of conformance you relied on.',
            'A lot can measure clean and still be quarantined. Two date codes on one shipment is a traceability defect even when every board passes.',
        ],
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
            # A level with no floor life in the table produces text in J, and
            # an error is not a decision: leave the cell empty instead.
            "Remaining (h)": '=IFERROR(J{r}-I{r},"")',
            "Decision": '=IF(OR(K{r}="",L{r}=""),"",IF(K{r}>=L{r},"release",'
                        '"bake or reschedule"))',
        },
        example_rows=[
            ["R-4412", "BGA-256 14x14", "FBGA", 4, 58, 7, None, 6, None, None, None, 10, None],
            ["R-4413", "QFP-64 0.5 mm", "QFP", 3, 58, 7, None, 0, None, None, None, 10, None],
            ["R-4414", "0402 100 nF", "chip", 1, 58, 7, None, 0, None, None, None, 10, None],
        ],
        fill_notes=[
            'The cabinet only pauses the clock when its logged RH is at or below the requirement in the threshold block. 7 % in a 5 % cabinet counts every hour.',
            '`Counted against floor life` is bag-open time when the cabinet did not qualify, and line exposure alone when it did. Check that distinction before you quote a remaining figure.',
            'A level with no floor life in the threshold block leaves the decision blank on purpose. Add the level and its floor life to the block rather than typing a number into the row.',
            'A 40 °C tape-and-reel bake is not interchangeable with a tray bake: the ceiling is there to protect the carrier, not the part.',
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
        columns=["Aperture", "Component", "Shape", "Width or dia (mm)",
                 "Length (mm)", "Foil (mm)", "Area ratio", "Aspect ratio",
                 "Release?"],
        formulas={
            # A round aperture carries its diameter in the width/diameter
            # column; its area ratio is D/(4T) and it has no aspect ratio, so
            # the release rule for a round aperture is the area ratio alone.
            "Area ratio": '=IF(C{r}="round",D{r}/(4*F{r}),'
                          '(D{r}*E{r})/(2*(D{r}+E{r})*F{r}))',
            "Aspect ratio": '=IF(C{r}="round","n/a (round aperture)",D{r}/F{r})',
            "Release?": '=IF(IF(C{r}="round",G{r}>=[[Area ratio, minimum]],'
                        'AND(G{r}>=[[Area ratio, minimum]],'
                        'H{r}>=[[Aspect ratio, minimum]])),"ok","step the foil down")',
        },
        example_rows=[
            # cx-m03-01 aperture-table.csv, all six rows, in its order. The
            # first version of this list invented different apertures (A-09,
            # A-12), which is why the sheet disagreed with the case.
            ["A-01", "0402 passive", "rect", 0.55, 0.60, 0.125, None, None, None],
            ["A-02", "QFP-64 0.5 mm", "rect", 0.22, 0.90, 0.125, None, None, None],
            ["A-03", "QFP-48 0.4 mm (current)", "rect", 0.20, 0.80, 0.125, None, None, None],
            ["A-04", "QFP-48 0.4 mm (thin region)", "rect", 0.20, 0.80, 0.100, None, None, None],
            ["A-05", "BGA 0.8 mm", "round", 0.50, None, 0.125, None, None, None],
            ["A-06", "THT connector", "rect", 0.18, 0.80, 0.125, None, None, None],
        ],
        fill_notes=[
            'Area ratio is aperture area divided by pad-wall area; for a round aperture that reduces to D / (4 x foil), so a round aperture has no aspect ratio and is judged on area alone.',
            'Aspect ratio is the smaller aperture dimension over the foil thickness. Both indicators must clear their limits for a rectangular aperture to release.',
            'Stepping the foil down is a local change over the fine-pitch region, not a thinner stencil everywhere: A-04 in the worked example is the same 0.20 mm aperture in 0.100 mm foil.',
            'Change one aperture at a time and re-run the sheet. Two changes in one step and you cannot say which one moved the print.',
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
            # The course teaches a 1-4 C/s cooling band (m06l01/m06l02 and the
            # m06 quiz); 6 C/s is the J-STD-020 ramp-down ceiling for the
            # component and is carried below as its own line. Judging a profile
            # against 6 here would pass the case's 3.7 C/s as if it were the
            # course limit, which is not what the lesson says.
            ("Cooling rate, max (C/s)", 4.0, "src-008", "m06l02 cooling band 1-4"),
            ("Cooling, J-STD-020 ceiling (C/s)", 6.0, None, "J-STD-020 ramp-down ceiling"),
            ("Time above liquidus, course min (s)", 30, None, "IPC-7530B 30-90 s, course text"),
        ],
        columns=["Segment", "Start (C)", "End (C)", "Duration (s)",
                 "Rate (C/s)", "Within limit?", "Above liquidus (s)"],
        formulas={
            "Rate (C/s)": '=(C{r}-B{r})/D{r}',
            "Within limit?": '=IF(ABS(E{r})<=IF(C{r}>B{r},[[Ramp-up, max (C/s)]],[[Cooling rate, max (C/s)]]),"ok","out of limit")',
            # Each segment reports its own share of the time above liquidus, so
            # the summary is a SUM of cells rather than one long expression that
            # has to be re-indexed whenever a segment is added. A hold (start =
            # end) counts its full duration when it sits above the liquidus.
            "Above liquidus (s)":
                '=IF(MAX(B{r},C{r})=MIN(B{r},C{r}),IF(B{r}>[[Liquidus, SAC305 (C)]],D{r},0),'
                'D{r}*MAX(0,(MAX(B{r},C{r})-MAX(MIN(B{r},C{r}),[[Liquidus, SAC305 (C)]]))'
                '/(MAX(B{r},C{r})-MIN(B{r},C{r}))))',
        },
        example_rows=[
            # The six intervals of cx-m06-01 profile.csv, in that order and with
            # those numbers. Earlier this list carried five invented rows, which
            # is why the sheet's time above liquidus disagreed with the case:
            # 25->150 in 60 s, soak to 190 in 90 s, 190->219 in 30 s, 65 s
            # printed as above 219, a 4 s hold and 248->100 in 40 s.
            ["Ramp", 25, 150, 60, None, None, None],
            ["Soak", 150, 190, 90, None, None, None],
            ["Approach", 190, 219, 30, None, None, None],
            ["Above liquidus", 219, 248, 65, None, None, None],
            ["Peak hold", 248, 248, 4, None, None, None],
            ["Cooling", 248, 100, 40, None, None, None],
        ],
        summary=[
            ("Peak temperature (C)", '=MAX(COL[End (C)])'),
            # Time above liquidus is not one segment: it is the part of the ramp
            # still above the liquidus, plus the reflow dwell, plus the part of
            # the cooling ramp still above it. Every term is a cell and the
            # liquidus comes from the threshold block, so changing the alloy
            # moves the answer instead of leaving a stale constant behind.
            # The cooling segment starts at B18 and ends at C18, so the part of
            # it still above the liquidus is (B18 - liquidus) / (B18 - C18). The
            # first version used C18 in the numerator — the 100 C end of the
            # ramp — and overstated time above liquidus by 17 s.
            ("Time above liquidus (s)", '=SUM(COL[Above liquidus (s)])'),
            # First and last segment of the table, by position: the ramp is the
            # first row and the cooling is the last, whatever the table length.
            ("Ramp-up rate (C/s)", '=(CFIRSTROW-BFIRSTROW)/DFIRSTROW'),
            ("Cooling rate (C/s)", '=(BLASTROW-CLASTROW)/DLASTROW'),
            ("Profile verdict",
             '=IF(AND(SUMROW[1]>=[[Peak, minimum (C)]],SUMROW[1]<=[[Peak, maximum (C)]],'
             'SUMROW[2]>=[[Time above liquidus, min (s)]],'
             'SUMROW[2]<=[[Time above liquidus, max (s)]],'
             'SUMROW[3]<=[[Ramp-up, max (C/s)]],'
             'SUMROW[4]<=[[Cooling rate, max (C/s)]]),"in window","outside window")'),
        ],
        fill_notes=[
            "Enter each interval's start temperature, end temperature and duration. The sheet derives every rate from those three numbers, so do not type a rate.",
            'Time above liquidus is a share of every segment, not just the dwell: the ramp up through 219 °C and the cooling ramp back down through it both count, and a hold at 248 °C counts in full.',
            "The cooling limit in the threshold block is the course's 1-4 °C/s band. The J-STD-020 6 °C/s ramp-down ceiling is carried as its own line — quote the one your procedure names.",
            'A profile is judged on the worst measured point, not the mean of the thermocouples. A single average can sit inside the window while the hot corner is outside it.',
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
                ("Quantity affected, and the denominator (a)", "number"),
                ("Defect rate and its unit", "text"),
                ("Defect rate, DPMO, computed from (a) (b)", "formula"),
                ("Opportunities per board in the denominator (b)", "text"),
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
            # D2 is measured in DPMO (defects per million opportunities, 620
            # per board); D7 is measured in ppm of boards, because the agreed
            # effectiveness metric is per board. The two denominators are
            # different on purpose and the report says which is which.
            ("D7 — Effectiveness", [
                ("Defects in the before window (a)", "number"),
                ("Boards in the before window (b)", "number"),
                ("Before rate, ppm of boards, computed from (a) (b)", "formula"),
                ("Defects in the after window (c)", "number"),
                ("Boards in the after window (d)", "number"),
                ("After rate, ppm of boards, computed from (c) (d)", "formula"),
                ("Reduction, percent, computed from the two rates", "formula"),
                ("Metric and its agreed target", "text"),
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
            "Quantity affected, and the denominator (a)":
                "38 defects in 1,240 boards",
            "Defect rate and its unit":
                "DPMO — defects per million opportunities; the opportunity count is "
                "620 per board, not one per board",
            "Defect rate, DPMO, computed from (a) (b)":
                "=ROUND(38/(1240*620)*1000000,1)",
            "Opportunities per board in the denominator (b)": 620,
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
            "Defects in the before window (a)": 96,
            "Boards in the before window (b)": 6000,
            "Before rate, ppm of boards, computed from (a) (b)":
                "=ROUND(96/6000*1000000,1)",
            "Defects in the after window (c)": 21,
            "Boards in the after window (d)": 7500,
            "After rate, ppm of boards, computed from (c) (d)":
                "=ROUND(21/7500*1000000,1)",
            "Reduction, percent, computed from the two rates":
                "=ROUND((16000-2800)/16000*100,1)",
            "Metric and its agreed target":
                "Defects per million boards on the AOI-confirmed windows; agreed "
                "target 1,000 ppm (course/control-plan value, m14l05)",
            "Reached the target?": "No — 2,800 ppm against the 1,000 ppm target",
            "Read-across to other products": "Same stencil design on PROD-3110, "
                                             "scheduled for next revision",
            "Standard or design rule updated?":
                "Design rule DR-14 added: fiducials and paste relief for fine pitch",
            "Close, or stay open and why":
                "Stay open: the action cut the rate by 82.5 % and did not reach the "
                "agreed metric, so effectiveness is not demonstrated",
        },
        fill_notes=[
            'D2 and D7 are where an 8D usually goes wrong: state the denominator. DPMO counts opportunities (620 per board here); the effectiveness metric counts boards.',
            'D7 must compare the measured rate with the **agreed** target. An action that cuts the rate by 82.5 % and still sits at 2,800 ppm against a 1,000 ppm target is not effective.',
            'D5 is a choice: record the alternatives you rejected and why. An 8D with one option considered did not investigate.',
            'Keep the report open while the metric is unmet. Closing an 8D on the improvement rather than the target is the commonest way a corrective action is lost.',
        ],
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
            # The data range is substituted by the builder from the layout it
            # is about to write (DATA_ROWS / RANK_COL). The first version
            # hard-coded 7:14 while the table starts at row 8, so the rank
            # range included the header and the cumulative column was built on
            # a wrong order — every row in the sheet was wrong, including
            # which defect counted as the vital few.
            "Rank": '=RANK(B{r},DATA_ROWS)',
            "Share (%)": '=B{r}/SUM(DATA_ROWS)*100',
            "Cumulative (%)": '=SUMIF(RANK_COL,"<="&C{r},DATA_ROWS)/SUM(DATA_ROWS)*100',
            "Vital few?": '=IF(E{r}<=[[Vital few, cumulative share (%)]],"yes","no")',
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
        fill_notes=[
            'Type the counts; the sheet ranks them. Do not sort the input by hand — the cumulative column follows the rank, not the row order.',
            'The 80 % line is a threshold cell. Change it there if your plant uses a different split, and the vital-few column follows.',
            'Counts from different windows are not one Pareto. Put the denominator (boards, or opportunities) beside the counts.',
            'Pareto ranks frequency, not cost. A low-count defect that stops the line belongs in the action list whatever its rank.',
        ],
        example_note="Counts are the m13 coverage model's occurrence column, so the "
                     "sheet and the coverage case disagree about nothing. Without "
                     "sorting, the cumulative column is arithmetic on the wrong order "
                     "— which is the reason this template sorts by rank rather than "
                     "trusting the rows to be entered in order.",
    ),
]
