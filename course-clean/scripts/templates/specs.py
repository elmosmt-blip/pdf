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

# --------------------------------------------------------------------------- m04
def _m04():
    deposits = [
        (1, 1, "first", 18.32), (1, 2, "first", 18.72), (1, 3, "first", 17.68),
        (1, 4, "second", 16.24), (1, 5, "second", 15.52), (1, 6, "second", 16.08),
        (2, 1, "first", 18.40), (2, 2, "first", 17.92), (2, 3, "first", 18.24),
        (2, 4, "second", 15.84), (2, 5, "second", 16.48), (2, 6, "second", 15.60),
    ]
    return dict(
        slug="spi-record",
        order=7,
        title="SPI print record",
        kind="xlsx",
        modules=["m04"],
        cases=["cx-m04-01"],
        lesson="m04l05",
        standard="IPC-7527 (solder paste printing), IPC-7525 (stencil design)",
        use="Record every deposit's volume against the nominal the stencil actually "
            "cuts, and keep the mean from hiding a print that has two humps.",
        why="The m04 case passes on the mean and fails on the split: six deposits "
            "per squeegee pass, a gap of about 2 nL between them, and a program "
            "built against the wrong foil. A record with one average per board "
            "cannot show any of that.",
        thresholds=[
            ("Volume window, low (%)", 75, None, "Board X control plan, m04l05"),
            ("Volume window, high (%)", 125, None, "Board X control plan, m04l05"),
            ("Cpk, minimum", 1.33, None, "control plan (a capability target, not a standard)"),
        ],
        columns=["Board", "Deposit", "Squeegee pass", "Volume (nL)",
                 "Nominal (nL)", "Share of nominal (%)", "Window: low (nL)",
                 "Window: high (nL)", "In window?", "Pass mean (nL)"],
        formulas={
            "Nominal (nL)": '=INPUTS[Aperture area (mm2)]*INPUTS[Foil over the region (mm)]*1000',
            "Share of nominal (%)": '=D{r}/E{r}*100',
            "Window: low (nL)": '=E{r}*[[Volume window, low (%)]]/100',
            "Window: high (nL)": '=E{r}*[[Volume window, high (%)]]/100',
            "In window?": '=IF(AND(D{r}>=G{r},D{r}<=H{r}),"yes","no")',
            "Pass mean (nL)": '=IF(C{r}="first",AVERAGEIF(COL[Squeegee pass],"first",'
                              'COL[Volume (nL)]),IF(C{r}="second",'
                              'AVERAGEIF(COL[Squeegee pass],"second",COL[Volume (nL)]),""))',
        },
        inputs=[
            ("Aperture area (mm2)", "mm2", 0.198),
            ("Foil over the region (mm)", "mm", 0.100),
            ("SPI program foil (mm)", "mm", 0.125),
        ],
        summary=[
            ("Deposits recorded", '=COUNT(COL[Volume (nL)])'),
            ("Mean volume (nL)", '=AVERAGE(COL[Volume (nL)])'),
            ("Mean as % of nominal", '=SUMMARY[Mean volume (nL)]/AVERAGE(COL[Nominal (nL)])*100'),
            ("First-pass mean (nL)", '=AVERAGEIF(COL[Squeegee pass],"first",COL[Volume (nL)])'),
            ("Second-pass mean (nL)", '=AVERAGEIF(COL[Squeegee pass],"second",COL[Volume (nL)])'),
            # The whole point of the case: the two passes are two processes.
            ("Gap between passes (nL)", '=SUMMARY[First-pass mean (nL)]-SUMMARY[Second-pass mean (nL)]'),
            ("Standard deviation (nL)", '=STDEV(COL[Volume (nL)])'),
            ("Cp against the window", '=(SUMMARY[Mean volume (nL)]/(AVERAGE(COL[Share of nominal (%)])/100)'
                                      '*([[Volume window, high (%)]]-[[Volume window, low (%)]])/100)'
                                      '/(6*SUMMARY[Standard deviation (nL)])'),
            ("Cpk (all deposits)",
             '=MIN((AVERAGE(COL[Window: high (nL)])-SUMMARY[Mean volume (nL)]),'
             '(SUMMARY[Mean volume (nL)]-AVERAGE(COL[Window: low (nL)])))/(3*SUMROW[7])'),
            ("Cpk, second pass only",
             '=MIN((AVERAGE(COL[Window: high (nL)])-SUMMARY[Second-pass mean (nL)]),'
             '(SUMMARY[Second-pass mean (nL)]-AVERAGE(COL[Window: low (nL)])))/'
             '(3*STDEV(IF(COL[Squeegee pass]="second",COL[Volume (nL)])))'),
            # The program's foil is thicker than the one the press cuts, so its
            # nominal is larger and the screen reads LOW. The correction is one
            # multiplication by program/press, and it lands on the row above.
            ("What the screen shows (%)",
             "=SUMMARY[Mean volume (nL)]/(INPUTS[Aperture area (mm2)]*"
             "INPUTS[SPI program foil (mm)]*1000)*100"),
            ("Corrected to the press foil (%)",
             "=SUMMARY[What the screen shows (%)]*INPUTS[SPI program foil (mm)]/"
             "INPUTS[Foil over the region (mm)]"),
            ("Verdict", '=IF(SUMMARY[Cpk (all deposits)]<[[Cpk, minimum]],'
                        '"the mean passes and the process does not: split the passes",'
                        '"capable")'),
        ],
        example_rows=[[b, d, p_, v, None, None, None, None, None, None]
                      for b, d, p_, v in deposits],
        example_note="Two pops, not one distribution: the first pass sits around "
                     "18.7 nL and the second around 15.9 nL. Cpk on all twelve looks "
                     "respectable; Cpk on the second pass alone is the number that "
                     "matters. The third input is the trap — the SPI program carries "
                     "the general stencil's 0.125 mm foil while the press cuts "
                     "0.100 mm, so the screen reads the print LOW: 69 % on screen, "
                     "86 % on the board, corrected by the foil ratio alone.",
    )

# --------------------------------------------------------------------------- m05
def _m05():
    audit = [(1, "A", 0.060, 0.020), (1, "B", 0.070, 0.160),
             (2, "A", 0.062, 0.024), (2, "B", 0.072, 0.158),
             (3, "A", 0.058, 0.018), (3, "B", 0.068, 0.162)]
    return dict(
        slug="placement-record",
        order=8,
        title="Placement audit record",
        kind="xlsx",
        modules=["m05"],
        cases=["cx-m05-01"],
        lesson="m05l06",
        standard="IPC-A-610 (placement and soldering criteria); machine capability "
                 "targets are the plant's, not a standard's",
        use="Turn two fiducial readings into the translation and the rotation the "
            "placement report leaves out, and carry each one out to the parts that "
            "sit furthest from the rotation centre.",
        why="The m05 case passes its 0.11 mm offset and fails the 0.80 degrees "
            "behind it: at 7 mm that rotation moves a QFP lead 0.098 mm, and at the "
            "panel edge it moves a part 0.56 mm. One average cannot show either.",
        thresholds=[
            ("Placement acceptance (mm)", 0.15, None, "cx-m05-01 placement-setup.csv, control plan"),
            ("Rotation target (deg)", 1.0, None, "m05l06 typical 0.5-1.0 deg, course value"),
        ],
        columns=["Board", "Fiducial", "dx (mm)", "dy (mm)", "Offset (mm)",
                 "Rotation (rad)", "Rotation (deg)", "Move at 40 mm (mm)",
                 "Move at 7 mm (mm)", "Within offset?"],
        formulas={
            "Offset (mm)": '=SQRT(C{r}^2+D{r}^2)',
            # The rotation comes from the pair on the same board: the difference of
            # the two vertical residuals over their separation. SUMPRODUCT picks
            # the A reading of this board out of the table.
            "Rotation (rad)":
                '=(D{r}-SUMPRODUCT((COL[Board]=A{r})*(COL[Fiducial]="A")*COL[dy (mm)]))'
                '/INPUTS[Fiducial separation (mm)]',
            "Rotation (deg)": '=DEGREES(F{r})',
            "Move at 40 mm (mm)": '=ABS(F{r})*INPUTS[Distance to panel edge (mm)]',
            "Move at 7 mm (mm)": '=ABS(F{r})*INPUTS[Distance to QFP corner (mm)]',
            "Within offset?": '=IF(E{r}<=[[Placement acceptance (mm)]],"yes","no")',
        },
        inputs=[
            ("Fiducial separation (mm)", "mm", 10.0),
            ("Distance to panel edge (mm)", "mm", 40.0),
            ("Distance to QFP corner (mm)", "mm", 7.0),
            ("Pad width (mm)", "mm", 0.30),
            ("Lead width (mm)", "mm", 0.20),
        ],
        summary=[
            ("Mean dx (mm)", '=AVERAGE(COL[dx (mm)])'),
            ("Mean dy (mm)", '=AVERAGE(COL[dy (mm)])'),
            # What the report quoted: the length of the mean residual vector.
            ("Mean offset vector (mm)", '=SQRT(SUMMARY[Mean dx (mm)]^2+SUMMARY[Mean dy (mm)]^2)'),
            ("Rotation on board 1 (deg)",
             '=SUMPRODUCT((COL[Board]=MIN(COL[Board]))*COL[Rotation (deg)])'),
            ("Move at the QFP corner on board 1 (mm)",
             '=SUMPRODUCT((COL[Board]=MIN(COL[Board]))*COL[Move at 7 mm (mm)])'),
            ("Move at the panel edge on board 1 (mm)",
             '=SUMPRODUCT((COL[Board]=MIN(COL[Board]))*COL[Move at 40 mm (mm)])'),
            ("Sideways play on the QFP pad (mm)",
             '=(INPUTS[Pad width (mm)]-INPUTS[Lead width (mm)])/2'),
            # Two independent things fail different ways: the offset is judged
            # against the acceptance, the rotation against the target and then
            # against the play a lead actually has.
            ("Verdict",
             '=IF(AND(SUMMARY[Mean offset vector (mm)]<=[[Placement acceptance (mm)]],'
             'SUMMARY[Rotation on board 1 (deg)]<=[[Rotation target (deg)]],'
             'SUMMARY[Move at the panel edge on board 1 (mm)]<=SUMMARY[Sideways play on the QFP pad (mm)]),"releasable",'
             'IF(AND(SUMMARY[Mean offset vector (mm)]<=[[Placement acceptance (mm)]],'
             'SUMMARY[Move at the QFP corner on board 1 (mm)]>SUMMARY[Sideways play on the QFP pad (mm)]),'
             '"offset passes, rotation fails: the edge parts move",'
             '"outside the acceptance"))'),
        ],
        example_rows=[[b, f, dx, dy, None, None, None, None, None, None]
                      for b, f, dx, dy in audit],
        example_note="The mean offset vector is 0.11 mm and passes the 0.15 mm "
                     "acceptance. The same readings give 0.80 degrees, which moves a "
                     "QFP lead 0.098 mm — more than the 0.05 mm of play it has — and "
                     "a part at the panel edge 0.56 mm. The offset is the average; the "
                     "rotation is the finding.",
    )

# --------------------------------------------------------------------------- m08
def _m08():
    joints = [
        ("J-01", "1.00", 0.95, 1.05, 0.60, 0.63, 1.60, 1.10, 68.75, 0),
        ("J-02", "1.00", 0.95, 1.05, 0.60, 0.63, 1.60, 1.30, 81.25, 0),
        ("J-03", "1.00", 0.95, 1.05, 0.60, 0.63, 1.60, 1.25, 78.13, 0),
    ]
    return dict(
        slug="tht-fill-record",
        order=9,
        title="Through-hole fill record",
        kind="xlsx",
        modules=["m08"],
        cases=["cx-m08-01"],
        lesson="m08l05",
        standard="IPC-A-610 (vertical barrel fill, and the inner-layer exception)",
        use="Record the barrel fill on every through-hole joint, compute it against "
            "the board thickness, and disposition it against the class that applies "
            "— without letting the thermal-plane exception become the rule.",
        why="The m08 case is one joint at 68.75 % on a joint that earns no exception, "
            "while two neighbours at 78 % and 81 % pass. A sheet that records "
            "\"looks full\" cannot tell those three apart.",
        thresholds=[
            ("Minimum vertical fill (%)", 75, "src-016", "IPC-A-610, m08l05"),
            ("Inner-layer exception fill (%)", 50, "src-016", "IPC-A-610 exception, m08l05"),
            ("Exception: leads on the part at least", 14, "src-016", "IPC-A-610 exception, m08l05"),
            ("Board thickness (mm)", 1.60, None, "Board X stackup"),
        ],
        columns=["Joint", "Part", "Class", "Hole min (mm)", "Lead max (mm)",
                 "Board (mm)", "Fill measured (mm)", "Fill (%)",
                 "Required (%)", "Short by (mm)", "Barrel on a plane?",
                 "Exception applies?", "Disposition"],
        formulas={
            "Fill (%)": '=IF(F{r}=0,"",G{r}/F{r}*100)',
            # The required figure is per joint, not per sheet: a joint whose
            # barrel ties into an internal plane and whose part has enough leads
            # may be judged against the exception, and nothing else may.
            "Required (%)":
                '=IF(AND(K{r}="yes",[[Inner-layer exception fill (%)]]>0,'
                '[[Exception: leads on the part at least]]>0),'
                '[[Inner-layer exception fill (%)]],[[Minimum vertical fill (%)]])',
            # What is missing is measured against the required percentage, not
            # against the fill the joint happens to have.
            "Short by (mm)": '=IF(F{r}=0,"",MAX(0,I{r}*F{r}/100-G{r}))',
            "Exception applies?":
                '=IF(I{r}=[[Inner-layer exception fill (%)]],"yes — plane-connected",'
                '"no — the general minimum")',
            "Disposition":
                '=IF(F{r}=0,"",IF(H{r}>=I{r},"accept","reject"))',
        },
        summary=[
            ("Joints recorded", '=COUNT(COL[Fill measured (mm)])'),
            ("Joints rejected", '=COUNTIF(COL[Disposition],"reject")'),
            ("Lowest fill (%)", '=MIN(COL[Fill (%)])'),
            ("Worst joint is short by (mm)", '=MAX(COL[Short by (mm)])'),
            ("Fill the general minimum needs (mm)",
             '=[[Board thickness (mm)]]*[[Minimum vertical fill (%)]]/100'),
            ("Verdict",
             '=IF(SUMMARY[Joints rejected]>0,'
             '"first article fails: a joint is below the minimum that applies to it",'
             '"first article passes")'),
        ],
        example_rows=[[j, part, 2, hmin, lmax, board, fill, None, None, None,
                       "yes" if plane else "no", None, None]
                      for j, part, hmin, hmax, lnom, lmax, board, fill, pct, plane
                      in joints],
        example_note="J-01 is at 68.75 % on a joint with no plane connection, so its "
                     "minimum is 75 % and it is 0.10 mm short — that is the finding. "
                     "J-02 and J-03 clear the same 75 % and pass. The exception is "
                     "for a part with 14 or more leads whose barrels tie into "
                     "internal planes; on this sheet it is a threshold pair you can "
                     "see and change, not a phrase in a report.",
    )

# --------------------------------------------------------------------------- m09
def _m09():
    return dict(
        slug="wave-run-log",
        order=10,
        title="Wave solder run log",
        kind="xlsx",
        modules=["m09"],
        cases=["cx-m09-01"],
        lesson="m09l07",
        standard="IPC-A-610 (joint acceptance); the wave windows are the machine's, "
                 "taken from the course and the equipment datasheet",
        use="Record the settings a wave run actually ran at, compute the contact time "
            "and the pot margin each one gives, and keep the findings on the same "
            "page as the record that explains them.",
        why="The m09 case has a short barrel and a bridge on the same board, and the "
            "line wants one cause. The record has to show contact time, pot margin and "
            "wave width together, or the argument is decided by who speaks last.",
        thresholds=[
            ("Contact time, minimum (s)", 2.0, None, "course text m09l07"),
            ("Contact time, maximum (s)", 4.0, None, "course text m09l07"),
            ("Pot ceiling, C", 260, None, "machine datasheet, course value"),
            ("Liquidus, SAC305 (C)", 219, "src-008", "m06l01"),
            ("Preheat, top-side min (C)", 90, None, "course value, m09l04"),
            ("Preheat, top-side max (C)", 120, None, "course value, m09l04"),
        ],
        columns=["Run", "Flux", "Preheat top (C)", "Pot (C)", "Wave width (mm)",
                 "Conveyor (m/min)", "Contact (s)", "Pot margin (C)",
                 "Contact in window?", "Preheat in window?", "Pot in window?",
                 "Run verdict"],
        formulas={
            # Contact time is the wave width over the conveyor speed, in seconds:
            # 50 mm at 1.5 m/min is 2.0 s, and that is the number the joint sees.
            "Contact (s)": '=E{r}/(F{r}*1000/60)',
            "Pot margin (C)": '=D{r}-[[Liquidus, SAC305 (C)]]',
            "Contact in window?": '=IF(AND(G{r}>=[[Contact time, minimum (s)]],'
                                  'G{r}<=[[Contact time, maximum (s)]]),"yes","no")',
            "Preheat in window?": '=IF(AND(C{r}>=[[Preheat, top-side min (C)]],'
                                  'C{r}<=[[Preheat, top-side max (C)]]),"yes","no")',
            "Pot in window?": '=IF(AND(D{r}>=[[Liquidus, SAC305 (C)]],'
                              'D{r}<=[[Pot ceiling, C]]),"yes","no")',
            "Run verdict":
                '=IF(AND(I{r}="yes",J{r}="yes",K{r}="yes"),"inside the windows",'
                'IF(G{r}<[[Contact time, minimum (s)]],'
                '"contact time is at the floor: nothing left to trade",'
                '"outside a window"))',
        },
        summary=[
            ("Runs recorded", '=COUNT(COL[Contact (s)])'),
            ("Contact time (s)", '=MIN(COL[Contact (s)])'),
            ("Pot margin over liquidus (C)", '=MIN(COL[Pot margin (C)])'),
            ("Margin to the pot ceiling (C)", '=[[Pot ceiling, C]]-MAX(COL[Pot (C)])'),
            # Widen the wave and the contact time rises: the cheapest lever that
            # does not touch the pot.
            ("Wave width for 3.0 s at this speed (mm)",
             '=3*MAX(COL[Conveyor (m/min)])*1000/60'),
            ("Verdict",
             '=IF(SUMMARY[Margin to the pot ceiling (C)]<20,'
             '"the pot is near its ceiling: the fix is contact time, not temperature",'
             '"the pot has room")'),
        ],
        example_rows=[["FA-1", "rosin mildly activated", 105, 255, 50, 1.5,
                       None, None, None, None, None, None]],
        example_note="50 mm of wave at 1.5 m/min is 2.0 s of contact — inside the "
                     "2-4 s window and sitting on its floor. The pot is at 255 C, only "
                     "5 C under the machine's ceiling, so \"raise the pot\" is not the "
                     "lever the record supports.",
    )

# --------------------------------------------------------------------------- m10
def _m10():
    return dict(
        slug="selective-program-record",
        order=11,
        title="Selective solder program record",
        kind="xlsx",
        modules=["m10"],
        cases=["cx-m10-01"],
        lesson="m10l05",
        standard="IPC-A-610 (joint acceptance), IPC-7711/7721 (rework of what the "
                 "program gets wrong)",
        use="Check the nozzle against the joint it has to fill, and put the cycle "
            "time on the sheet before anyone promises a rate.",
        why="The m10 case has a nozzle that fits and a cycle nobody accounted for: "
            "20 joints at 1.8 s dwell and 0.4 s of travel is 44 s before preheat and "
            "flux are added. A program record without the cycle cannot be quoted.",
        thresholds=[
            ("Nozzle min for the joint (mm)", 1.0, None, "course guidance, m10l03"),
            ("Nozzle max for the joint (mm)", 2.0, None, "course guidance, m10l03"),
            ("Dwell, min (s)", 1.0, None, "program value, cx-m10-01"),
            ("Dwell, max (s)", 3.0, None, "program value, cx-m10-01"),
        ],
        columns=["Joint", "Hole nominal (mm)", "Hole tolerance (mm)", "Lead max (mm)",
                 "Lead (mm)", "Gap per side (mm)", "Nozzle (mm)",
                 "Hole to lead (mm)", "Nozzle in band?"],
        formulas={
            "Gap per side (mm)": '=(B{r}-E{r})/2',
            "Hole to lead (mm)": '=B{r}-D{r}',
            "Nozzle in band?": '=IF(AND(G{r}>=[[Nozzle min for the joint (mm)]],'
                               'G{r}<=[[Nozzle max for the joint (mm)]],'
                               'G{r}>H{r}),"yes","no")',
        },
        # Only what a person reads off the machine: the inputs carry no derived
        # value, so nothing on the sheet can be typed and then disagree with its
        # own arithmetic.
        inputs=[
            ("Joints in the program", "count", 20),
            ("Dwell per joint (s)", "s", 1.8),
            ("Travel between joints (s)", "s", 0.4),
            ("Preheat (s)", "s", 25),
            ("Flux and air knife (s)", "s", 12),
        ],
        summary=[
            # The cycle is a sum of things the machine does, not a rate the
            # planner hoped for: every joint costs its dwell plus the move to it.
            ("Joint time (s)", '=INPUTS[Joints in the program]*'
                               '(INPUTS[Dwell per joint (s)]+INPUTS[Travel between joints (s)])'),
            ("Cycle time (s)", '=SUMMARY[Joint time (s)]+INPUTS[Preheat (s)]'
                               '+INPUTS[Flux and air knife (s)]'),
            ("Throughput (boards/h)", '=ROUND(3600/SUMMARY[Cycle time (s)],1)'),
            ("Dwell in window?", '=IF(AND(INPUTS[Dwell per joint (s)]>=[[Dwell, min (s)]],'
                                 'INPUTS[Dwell per joint (s)]<=[[Dwell, max (s)]]),'
                                 '"yes","no")'),
            ("Verdict", '=IF(COUNTIF(COL[Nozzle in band?],"no")>0,'
                        '"a joint is outside the nozzle band: fix the nozzle before the dwell",'
                        '"nozzle fits every joint")'),
        ],
        example_rows=[["P-01", 1.00, 0.05, 0.03, 0.60, None, 1.20, None, None]],
        example_note="The 1.20 mm nozzle sits inside the 1.0-2.0 mm band and clears the "
                     "0.40 mm hole-to-lead gap on every pin. The cycle is the finding: "
                     "44 s of joints plus 37 s of preheat and flux is 81 s, and one board "
                     "in the machine at a time makes that 44.4 boards an hour — not the "
                     "rate a plan drawn from dwell alone would promise.",
    )

# --------------------------------------------------------------------------- m11
def _m11():
    rows = [
        ("B-07", "J-01 rework", "chisel 1.2 mm", 345, 95, 3, 2.6, 0.4, 0.2, 0.300, 0.280, 0.248, 0),
        ("B-08", "J-01 rework", "chisel 1.2 mm", 345, 95, 2, 2.2, 0.1, 0.0, 0.300, 0.280, 0.280, 1),
        ("B-09", "J-01 rework", "chisel 1.2 mm", 345, 95, 1, 2.4, 0.0, 0.0, 0.300, 0.280, 0.280, 0),
    ]
    return dict(
        slug="rework-record",
        order=12,
        title="Rework and repair record",
        kind="xlsx",
        modules=["m11"],
        cases=["cx-m11-01"],
        lesson="m11l06",
        standard="IPC-7711/7721 (rework and repair method), with the width limit from "
                 "IPC-A-600 (20 % Class 2, 10 % Class 3)",
        use="Record what the repair did to the board — heat, contacts, the trace it "
            "touched — and judge the damage against the class the customer requires.",
        why="The m11 case is a repair that passes on the joint and fails on the trace: "
            "0.248 mm against a 0.280 mm minimum is 11.4 %. Under Class 2 that is "
            "inside the 20 % limit; under Class 3 it is not.",
        thresholds=[
            ("Class 2 width reduction (%)", 20, None, "IPC-A-600 §3.5.3.1, per m11l04"),
            ("Class 3 width reduction (%)", 10, None, "IPC-A-600 §3.5.3.1, per m11l04"),
            ("Iron setpoint, min (C)", 330, None, "course hand-soldering band, m11l03"),
            ("Iron setpoint, max (C)", 360, None, "course hand-soldering band, m11l03"),
            ("Contacts, maximum", 3, None, "process rule, cx-m11-01"),
            ("Iron power (W)", 45, None, "station datasheet, course value"),
        ],
        columns=["Assembly", "Operation", "Tip", "Setpoint (C)", "Preheat (C)",
                 "Contacts", "Dwell 1 (s)", "Dwell 2 (s)", "Dwell 3 (s)",
                 "Width drawn (mm)", "Width after (mm)", "Iron time (s)",
                 "Energy (J)", "Reduction (%)", "Limit (%)", "Trace verdict",
                 "Dry contact (1 = no flow)", "Drawing minimum (mm)",
                 "Setpoint in band?", "Contacts within rule?", "Drawing minimum check"],
        formulas={
            "Iron time (s)": '=G{r}+H{r}+I{r}',
            "Energy (J)": '=L{r}*[[Iron power (W)]]',
            # The class limit is a percentage of the drawing's MINIMUM width, not
            # of the drawn nominal: 0.248 against a 0.280 minimum is 11.4 %, and
            # against the 0.300 the trace was drawn at it would read 17.3 % — a
            # different answer to the same question.
            "Reduction (%)": '=(INPUTS[Drawing minimum width (mm)]-K{r})'
                             '/INPUTS[Drawing minimum width (mm)]*100',
            "Limit (%)": '=IF(INPUTS[Applicable class]="Class 3",'
                         '[[Class 3 width reduction (%)]],[[Class 2 width reduction (%)]])',
            "Trace verdict": '=IF(N{r}<=O{r},"within the class limit",'
                             '"outside the class limit")',
            # A rework record that does not judge the iron is a diary. The setpoint
            # band and the contact count are process rules in the threshold block;
            # the drawn minimum comes off the drawing, so the row compares the
            # limit the sheet computed with the one the drawing carries.
            "Setpoint in band?": '=IF(AND(D{r}>=[[Iron setpoint, min (C)]],'
                                 'D{r}<=[[Iron setpoint, max (C)]]),"in band","out of band")',
            "Contacts within rule?": '=IF(F{r}<=[[Contacts, maximum]],"within rule",'
                                     '"over the contact rule")',
            "Drawing minimum check": '=IF(R{r}<=INPUTS[Drawing minimum width (mm)],'
                                     '"drawing minimum agrees",'
                                     '"drawing carries a looser minimum than the sheet")',
        },
        inputs=[
            ("Drawing minimum width (mm)", "mm", 0.280),
            ("Applicable class", "Class 2 or 3", "Class 2"),
        ],
        summary=[
            ("Boards in the record", '=COUNT(COL[Width after (mm)])'),
            # Published to one decimal, the precision the case asks for: a sheet
            # that shows 11.428571 and a report that says 11.4 are the same
            # number quoted at two precisions, and the difference invites an
            # argument that is not about the board.
            ("Worst reduction (%)", '=ROUND(MAX(COL[Reduction (%)]),1)'),
            ("Narrowest trace this class allows (mm)",
             '=INPUTS[Drawing minimum width (mm)]*(1-[[Class 2 width reduction (%)]]/100)'),
            ("Narrowest trace Class 3 would allow (mm)",
             '=INPUTS[Drawing minimum width (mm)]*(1-[[Class 3 width reduction (%)]]/100)'),
            ("Boards with no solder flow on a contact",
             '=SUM(COL[Dry contact (1 = no flow)])'),
            ("Total iron time on the record (s)", '=SUM(COL[Iron time (s)])'),
            ("Verdict", '=IF(COUNTIF(COL[Trace verdict],"outside*")>0,'
                        '"repair is outside the class limit: scrap or request a deviation",'
                        '"repair is within the class limit")'),
            ("Rows out of the iron band", '=COUNTIF(COL[Setpoint in band?],"out of band")'),
            ("Rows over the contact rule", '=COUNTIF(COL[Contacts within rule?],"over the contact '
                                           'rule")'),
        ],
        example_rows=[[a, o, t, sp, ph, c, d1, d2, d3, drawn, wa, None, None, None,
                       None, None, dry, tmin, None, None, None]
                      for a, o, t, sp, ph, c, d1, d2, d3, drawn, tmin, wa, dry in rows],
        example_note="B-07 took 3.2 s of iron and 144 J, and it is the row that nicked "
                     "the trace: 0.248 mm against a 0.280 mm drawing minimum is an "
                     "11.4 % reduction. Class 2 allows 20 %, Class 3 allows 10 % — so "
                     "the same board passes one customer and fails the other. B-08 shows "
                     "dry_flag 1: one contact produced no solder flow, which is a fact "
                     "about the operator's technique, not about the joint.",
    )

# --------------------------------------------------------------------------- m12
def _m12():
    boards = [
        ("C-114", 412, 6, 192, 12.0, 4.0),
        ("C-118", 268, 6, 192, None, None),
        ("C-121", 171.1, 6, 192, None, None),
        ("C-124", 583, 6, 192, None, None),
        ("C-127", 96, 6, 192, None, None),
        ("C-131", 149, 6, 192, None, None),
    ]
    return dict(
        slug="cleanliness-record",
        order=13,
        title="Cleanliness and coating record",
        kind="xlsx",
        modules=["m12"],
        cases=["cx-m12-01"],
        lesson="m12l03",
        standard="IPC-TM-650 2.3.25 (ROSE); the customer's limit is a customer value, "
                 "not the reference one",
        use="Report an ionic result with the area it was divided by, the blank it was "
            "subtracted from and the local site it hides, then work out the coating "
            "volume from the film the drawing asks for.",
        why="The m12 case is a board average that passes and a site under the BGA that "
            "fails. A record with one number per board cannot show either the blank, "
            "the area or the site.",
        thresholds=[
            ("Reference limit (ug/cm2)", 1.56, "src-018", "IPC-TM-650 2.3.25, per m12l03"),
            # The customer's limit and the limit this build is judged against are
            # the same number for Board X, and one fact lives in one place: the
            # route limit reads the customer limit rather than repeating 0.5 and
            # drifting away from it the first time the customer changes a spec.
            ("Customer limit (ug/cm2)", 0.5, None, "medical customer specification"),
            # Reads the customer limit above rather than repeating it: one fact
            # lives in one place, and the build's route limit follows the spec.
            ("Route limit (ug/cm2)", "=[[Customer limit (ug/cm2)]]", None,
             "medical customer specification"),
            ("Target dry film (um)", 35, None, "customer drawing, cx-m12-01"),
            ("Coating solids (fraction)", 0.38, None, "coating datasheet, cx-m12-01"),
            ("One-sided tail z for 0.1 %", 3.0902, None, "normal distribution, course value"),

        ],
        columns=["Board", "Extracted (ug)", "Blank (ug)", "Area (cm2)",
                 "Result (ug/cm2)", "Site (ug)", "Site area (cm2)",
                 "Site result (ug/cm2)", "Board verdict", "Site verdict"],
        formulas={
            "Result (ug/cm2)": '=(B{r}-C{r})/D{r}',
            "Site result (ug/cm2)": '=IF(OR(F{r}="",G{r}=""),"",F{r}/G{r})',
            "Board verdict":
                '=IF(E{r}<=[[Route limit (ug/cm2)]],"pass",'
                'IF(E{r}<=[[Reference limit (ug/cm2)]],'
                '"pass the reference, fail the customer","fail"))',
            "Site verdict": '=IF(H{r}="","",IF(H{r}<=[[Route limit (ug/cm2)]],"pass","fail"))',
        },
        inputs=[
            ("Masked: connector (cm2)", "cm2", 16.0),
            ("Masked: test points (cm2)", "cm2", 3.0),
            ("Masked: under the BGA (cm2)", "cm2", 0.377),
            ("Board area (cm2)", "cm2", 192.0),
            ("Process sd (ug/cm2)", "ug/cm2", 0.11),
        ],
        summary=[
            ("Boards in the record", '=COUNT(COL[Result (ug/cm2)])'),
            ("Board mean (ug/cm2)", '=AVERAGE(COL[Result (ug/cm2)])'),
            ("Worst board (ug/cm2)", '=MAX(COL[Result (ug/cm2)])'),
            # Every verdict that is not a plain pass counts: "pass the reference,
            # fail the customer" is still a board over the limit this build is
            # judged against.
            ("Boards over the route limit",
             '=SUMMARY[Boards in the record]-COUNTIF(COL[Board verdict],"pass")'),
            ("Coated area (cm2)", '=INPUTS[Board area (cm2)]-INPUTS[Masked: connector (cm2)]'
                                  '-INPUTS[Masked: test points (cm2)]'
                                  '-INPUTS[Masked: under the BGA (cm2)]'),
            # A film thickness is a volume of solids per area; dividing by the
            # solids fraction turns it back into the wet volume to dispense.
            ("Wet coating to dispense (mL)",
             '=SUMMARY[Coated area (cm2)]*[[Target dry film (um)]]/10000'
             '/[[Coating solids (fraction)]]'),
            # Inverse problem: the mean that holds a 0.1 % tail under the limit.
            ("Mean that holds 0.1 % under the limit (ug/cm2)",
             '=[[Route limit (ug/cm2)]]-[[One-sided tail z for 0.1 %]]*INPUTS[Process sd (ug/cm2)]'),
            ("Verdict", '=IF(OR(SUMMARY[Boards over the route limit]>0,'
                        'COUNTIF(COL[Site verdict],"fail")>0),'
                        '"the board average is not the result: a board or a site fails",'
                        '"clean")'),
        ],
        example_rows=[[b, ex, bl, area, None, site, sarea, None, None, None]
                      for b, ex, bl, area, site, sarea in boards],
        example_note="C-114 reads 2.11 ug/cm2 against the customer's 0.5 and passes "
                     "nothing. Its 20 x 20 mm site under the connector reads 3.0 "
                     "ug/cm2 — the number the field return was about. The reference "
                     "1.56 ug/cm2 is not the limit this build is judged against, and "
                     "the route limit cell is where that gets decided.",
    )

# --------------------------------------------------------------------------- m13
def _m13():
    model = [
        ("visible open", 420, 0.95, 0.00, 0.99, 0.85),
        ("hidden open", 260, 0.05, 0.85, 0.60, 0.70),
        ("visible bridge", 310, 0.97, 0.00, 0.99, 0.90),
        ("hidden short", 90, 0.10, 0.80, 0.55, 0.60),
        ("wrong value", 60, 0.15, 0.00, 0.95, 0.50),
        ("polarity", 110, 0.90, 0.00, 0.60, 0.80),
        ("insufficient solder", 380, 0.92, 0.30, 0.35, 0.40),
        ("contamination", 70, 0.10, 0.00, 0.02, 0.05),
    ]
    return dict(
        slug="coverage-model",
        order=14,
        title="Test coverage model",
        kind="xlsx",
        modules=["m13"],
        cases=["cx-m13-01"],
        lesson="m13l05",
        standard="The plant's own defect model and screen probabilities; node coverage "
                 "is a test-program measure, not a standard's",
        use="Work out what a series of screens actually catches, class by class, "
            "instead of quoting the share of joints that carry a probe.",
        why="The m13 case is 92 % of the nodes and 70 % of the defects: a screen that "
            "touches a joint is not a screen that catches the defect at it, and one "
            "class in the model — residue under a connector — has no screen at all.",
        thresholds=[
            ("Nodes on the board", 620, None, "board fact"),
            ("Nodes with a probe or scan", 570, None, "test program, cx-m13-01"),
            ("Boards per year", 20000, None, "cx-m13-01"),
            # A share of a class that gets past every screen. Not a standard:
            # it is the line the plant draws between "watched" and "invisible".
            ("Class escape alarm (%)", 80, None, "course value: a class nothing catches"),
        ],
        columns=["Defect class", "Occurrence (ppm)", "AOI", "X-ray", "ICT", "FCT",
                 "Caught by AOI (ppm)", "Caught by all three (ppm)",
                 "Escapes the three (ppm)", "Caught with X-ray (ppm)"],
        formulas={
            "Caught by AOI (ppm)": '=B{r}*C{r}',
            # Screens in series: a class is missed only if every screen misses it,
            # so what one screen adds is the miss probability it removes.
            "Caught by all three (ppm)": '=B{r}*(1-(1-C{r})*(1-E{r})*(1-F{r}))',
            "Escapes the three (ppm)": '=B{r}*(1-C{r})*(1-E{r})*(1-F{r})',
            "Caught with X-ray (ppm)": '=B{r}*(1-(1-C{r})*(1-D{r})*(1-E{r})*(1-F{r}))',
        },
        summary=[
            ("Total defect rate (ppm)", '=SUM(COL[Occurrence (ppm)])'),
            ("Node coverage (%)", '=[[Nodes with a probe or scan]]/[[Nodes on the board]]*100'),
            ("Caught by AOI alone (ppm)", '=SUM(COL[Caught by AOI (ppm)])'),
            ("Defect coverage, AOI alone (%)",
             '=SUMMARY[Caught by AOI alone (ppm)]/SUMMARY[Total defect rate (ppm)]*100'),
            ("Caught by the three screens (ppm)", '=SUM(COL[Caught by all three (ppm)])'),
            ("Defect coverage, three screens (%)",
             '=SUMMARY[Caught by the three screens (ppm)]/SUMMARY[Total defect rate (ppm)]*100'),
            ("Escape rate (ppm)", '=SUMMARY[Total defect rate (ppm)]'
                                  '-SUMMARY[Caught by the three screens (ppm)]'),
            ("Caught with X-ray added (ppm)", '=SUM(COL[Caught with X-ray (ppm)])'),
            ("Defect coverage with X-ray (%)",
             '=SUMMARY[Caught with X-ray added (ppm)]/SUMMARY[Total defect rate (ppm)]*100'),
            # X-ray is judged on what it does to the escapes, not on the
            # coverage number it moves: 1.4 points of coverage is a third of
            # the defects that were getting out.
            ("Reduction in escapes from X-ray (%)",
             '=ROUND((SUMMARY[Escape rate (ppm)]-(SUMMARY[Total defect rate (ppm)]'
             '-SUMMARY[Caught with X-ray added (ppm)]))/SUMMARY[Escape rate (ppm)]*100,1)'),
            ("Boards a year that ship defective", '=[[Boards per year]]*SUMMARY[Escape rate (ppm)]/1000000'),
            # The headline the program quotes and the number that matters are
            # different measurements, so the sheet states both and compares them.
            ("Worst class left to the screens (%)",
             '=MAX(COL[Escapes the three (ppm)])/MAX(COL[Occurrence (ppm)])*100'),
            # A class the screens leave almost entirely alone is not a small
            # residual, it is a hole: the threshold block decides where "invisible"
            # starts, so the row names the class instead of leaving the reader to
            # divide every line by hand.
            ("Worst class", '=INDEX(COL[Defect class],MATCH(MAX(COL[Escapes the three (ppm)]),'
                            'COL[Escapes the three (ppm)],0))'),
            ("Worst class alarm",
             '=IF(SUMMARY[Worst class left to the screens (%)]'
             '>=[[Class escape alarm (%)]],"class is effectively unscreened",'
             '"class is caught by at least one screen")'),
            ("Verdict", '=IF(SUMMARY[Node coverage (%)]>SUMMARY[Defect coverage, three screens (%)],'
                        '"the node number is not the coverage: quote the defect coverage",'
                        '"the two coverage numbers agree")'),
        ],
        example_rows=[[n, occ, a, x, i, f, None, None, None, None]
                      for n, occ, a, x, i, f in model],
        example_note="The program reports 91.9 % of the nodes. The same model says the "
                     "three screens catch 93.1 % of the defects — and 83.8 % of the "
                     "contamination class gets through all three, because no screen in "
                     "the list looks at it. Adding X-ray raises coverage by 1.4 points "
                     "and cuts the escapes by more than a third; the residue needs a "
                     "process control, not a fourth screen.",
    )

# --------------------------------------------------------------------------- m15
def _m15():
    return dict(
        slug="design-feedback-pack",
        order=15,
        title="Design feedback pack",
        kind="xlsx",
        modules=["m15"],
        cases=["cx-m15-01"],
        lesson="m15l04",
        standard="The plant's own production data; the placement acceptance and the "
                 "fiducial geometry are Board X's",
        use="Turn a production result into a design ask with a number in it and a "
            "price on it, so the design team can act on the next revision.",
        why="The m15 case ends with three asks, of which one is a rule. The pack has "
            "to carry the cost of poor quality, the payback of the change, and the "
            "sample the numbers came from.",
        thresholds=[
            ("Placement acceptance (mm)", 0.15, None, "control plan, cx-m15-01"),
            ("Distance to the panel edge (mm)", 40.0, None, "panel drawing, cx-m15-01"),
            ("Effectiveness target (ppm)", 1000, None, "agreed metric, cx-m14-01"),
        ],
        columns=["Item", "Unit", "Value", "What it is used for"],
        formulas={
            "Value": '=IF(A{r}="","",VALUE(C{r}))',
        },
        inputs=[
            ("Boards started", "count", 1240),
            ("Defects confirmed", "count", 38),
            ("Boards scrapped", "count", 12),
            ("Minutes to rework one defect", "min", 9),
            ("Labour rate (USD/h)", "USD/h", 45),
            ("Board cost (USD)", "USD", 180),
            ("Inspection per board (min)", "min", 0.5),
            ("Downtime (h)", "h", 6.5),
            ("Downtime rate (USD/h)", "USD/h", 40),
            ("Change cost (USD)", "USD", 1200),
            ("Share of rework and scrap removed", "fraction", 0.6),
            # The three measured facts the asks are judged against. They are
            # inputs and not thresholds: the threshold block holds the acceptance
            # the plant must clear, these are what the plant measured.
            ("Worst fiducial residual (mm)", "mm", 0.14),
            ("Fiducial separation (mm)", "mm", 10.0),
        ],
        summary=[
            ("First-pass yield (%)",
             '=(INPUTS[Boards started]-INPUTS[Defects confirmed])/INPUTS[Boards started]*100'),
            ("Defects per 1000 boards",
             '=INPUTS[Defects confirmed]/INPUTS[Boards started]*1000'),
            ("Rework cost (USD)",
             '=INPUTS[Defects confirmed]*INPUTS[Minutes to rework one defect]/60*INPUTS[Labour rate (USD/h)]'),
            ("Scrap cost (USD)",
             '=INPUTS[Boards scrapped]*INPUTS[Board cost (USD)]'),
            ("Inspection cost (USD)",
             '=INPUTS[Boards started]*INPUTS[Inspection per board (min)]/60*INPUTS[Labour rate (USD/h)]'),
            ("Downtime cost (USD)", '=INPUTS[Downtime (h)]*INPUTS[Downtime rate (USD/h)]'),
            ("Cost of poor quality (USD)", '=SUMMARY[Rework cost (USD)]+SUMMARY[Scrap cost (USD)]'
                                           '+SUMMARY[Inspection cost (USD)]'
                                           '+SUMMARY[Downtime cost (USD)]'),
            ("Cost of poor quality per board (USD/board)",
             '=SUMMARY[Cost of poor quality (USD)]/INPUTS[Boards started]'),
            # The payback is expressed in boards, because that is the unit the
            # planner can act on: how many boards until the change has paid.
            # Two decimals, because a planner rounding 1,026.3 up to 1,050 and a
            # report saying 1,027 should be the same number.
            ("Boards to pay the change back",
             '=ROUND(INPUTS[Change cost (USD)]/((SUMMARY[Rework cost (USD)]'
             '+SUMMARY[Scrap cost (USD)])*INPUTS[Share of rework and scrap removed]'
             '/INPUTS[Boards started]),1)'),
            ("Verdict", '=IF(SUMMARY[Boards to pay the change back]<=INPUTS[Boards started],'
                        '"the change pays back inside one order",'
                        '"the change needs more than one order to pay back")'),
            # Every ask in the m15 pack is a number with a tolerance, an owner and
            # a cost. These three rows are the tolerance tests, computed from the
            # threshold block: without them the block was printed and never read,
            # which makes the sheet a poster rather than a record.
            ("Fiducial separation needed for 40 mm (mm)",
             '=ROUND(INPUTS[Worst fiducial residual (mm)]*[[Distance to the panel edge '
             '(mm)]]/[[Placement acceptance (mm)]],1)'),
            ("Separation against the panel drawing (mm)",
             '=INPUTS[Fiducial separation (mm)]'),
            ("Separation ask: passed?",
             '=IF(SUMMARY[Fiducial separation needed for 40 mm (mm)]'
             '>SUMMARY[Separation against the panel drawing (mm)],'
             '"pass: the design must move the fiducials apart",'
             '"inside the drawing as it stands")'),
            ("Defect rate against the effectiveness target (ppm)",
             '=ROUND(INPUTS[Defects confirmed]/INPUTS[Boards started]*1000000,0)'),
            ("Effectiveness ask: passed?",
             '=IF(SUMMARY[Defect rate against the effectiveness target (ppm)]'
             '<=[[Effectiveness target (ppm)]],"at or under the agreed target",'
             '"over the agreed target: quantify the ask before sending")'),
        ],
        example_rows=[],
        example_note="The four cost drivers add to 3,141.50 USD on 1,240 boards. The "
                     "1,200 USD change pays for itself in 1,026.3 boards if it removes "
                     "60 % of the rework and scrap — inside the next order, which is "
                     "what turns an opinion into a design ask.",
    )

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
                 "Remaining (h)", "Reflow planned in (h)", "Decision",
                 "Bake ceiling for the carrier (C)"],
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
            # A reel that needs a bake cannot simply be baked at the part's own
            # temperature: the tape carrier sets a much lower ceiling, so the row
            # names the ceiling the bake may use instead of leaving the reader to
            # bake at 125 C because a tray would take it. N is the Decision
            # column; check-templates recomputes this column, so a column that
            # moves without this reference moving fails the build.
            "Bake ceiling for the carrier (C)":
                '=IF(N{r}="bake or reschedule",[[Tape-and-reel bake ceiling (C)]],'
                'IF(N{r}="release","no bake",""))',
        },
        example_rows=[
            ["R-4412", "BGA-256 14x14", "FBGA", 4, 58, 7, None, 6, None, None, None, 10,
             None, None],
            ["R-4413", "QFP-64 0.5 mm", "QFP", 3, 58, 7, None, 0, None, None, None, 10,
             None, None],
            ["R-4414", "0402 100 nF", "chip", 1, 58, 7, None, 0, None, None, None, 10,
             None, None],
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
                 "Release?", "Foil recognised?"],
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
            # The two foil values in the threshold block are the two the press
            # actually carries. A row quoting a third thickness is a drawing
            # error, and the ratio computed from it would be arithmetic on a
            # stencil nobody has — so the row is judged on the foil it names and
            # the check says which of the two known foils it matches.
            "Foil recognised?": '=IF(OR(ABS(F{r}-[[Foil thickness, general (mm)]])<0.001,'
                                'ABS(F{r}-[[Foil thickness, fine pitch (mm)]])<0.001),'
                                '"known foil","not a foil this press carries")',
        },
        example_rows=[
            # cx-m03-01 aperture-table.csv, all six rows, in its order. The
            # first version of this list invented different apertures (A-09,
            # A-12), which is why the sheet disagreed with the case.
            ["A-01", "0402 passive", "rect", 0.55, 0.60, 0.125, None, None, None, None],
            ["A-02", "QFP-64 0.5 mm", "rect", 0.22, 0.90, 0.125, None, None, None, None],
            ["A-03", "QFP-48 0.4 mm (current)", "rect", 0.20, 0.80, 0.125, None, None, None,
             None],
            ["A-04", "QFP-48 0.4 mm (thin region)", "rect", 0.20, 0.80, 0.100, None, None,
             None, None],
            ["A-05", "BGA 0.8 mm", "round", 0.50, None, 0.125, None, None, None, None],
            ["A-06", "THT connector", "rect", 0.18, 0.80, 0.125, None, None, None, None],
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
            # The verdict names which limit a failing profile broke, because a
            # bare "outside window" sends the reader back to recompute the whole
            # row. The cooling is judged against both ceilings on purpose: the
            # course band (4 C/s) is the process limit and the J-STD-020
            # component ceiling (6 C/s) is the one that voids the part, and a
            # profile at 5 C/s is inside one and outside the other.
            ("Peak within band?",
             '=IF(AND(SUMROW[1]>=[[Peak, minimum (C)]],SUMROW[1]<=[[Peak, maximum (C)]]),'
             '"ok","outside")'),
            ("Time above liquidus within band?",
             '=IF(AND(SUMROW[2]>=[[Time above liquidus, min (s)]],'
             'SUMROW[2]>=[[Time above liquidus, course min (s)]],'
             'SUMROW[2]<=[[Time above liquidus, max (s)]]),"ok","outside")'),
            ("Ramp-up within limit?",
             '=IF(SUMROW[3]<=[[Ramp-up, max (C/s)]],"ok","outside")'),
            ("Cooling within the course band?",
             '=IF(SUMROW[4]<=[[Cooling rate, max (C/s)]],"ok","outside")'),
            ("Cooling within the component ceiling?",
             '=IF(SUMROW[4]<=[[Cooling, J-STD-020 ceiling (C/s)]],"ok","outside")'),
            ("Profile verdict",
             '=IF(AND(SUMMARY[Peak within band?]="ok",'
             'SUMMARY[Time above liquidus within band?]="ok",'
             'SUMMARY[Ramp-up within limit?]="ok",'
             'SUMMARY[Cooling within the course band?]="ok",'
             'SUMMARY[Cooling within the component ceiling?]="ok"),'
             '"in window","outside window")'),
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
    # ---------------------------------------------------------- design feedback
    _m15(),
    # ---------------------------------------------------------------- coverage
    _m13(),
    # ------------------------------------------------------------ cleanliness
    _m12(),
    # ----------------------------------------------------------------- rework
    _m11(),
    # ------------------------------------------------------------- selective
    _m10(),
    # ------------------------------------------------------------------ wave
    _m09(),
    # --------------------------------------------------------------- THT fill
    _m08(),
    # ------------------------------------------------------------ placement
    _m05(),
    # ------------------------------------------------------------------ SPI
    _m04(),
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
