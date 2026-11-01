# Review checklist — what must be checked before the draft markers come off

This document is the gate for removing `TBD-REVIEW` from the course. It does not
remove anything itself: every lesson still carries `status: "draft"` and its
original review string, untouched. Promotion is a human action — this is the list
that makes it a decision rather than a leap.

## Why the existing TBD-REVIEW lists are not the checklist

Each lesson ships a list of numbers flagged as unverified. Those lists are
auto-extracted from the worked calculation, so on a calculation-drill lesson they
enumerate the drill's own inputs and its arithmetic results. `m14l01`, the Pareto
and measurement-integrity drill, carries 62 of them; every one was checked and all
30 arithmetic steps reconcile.

That makes the list long where the risk is lowest and silent where the risk is
highest. `m08l05` lists 15 numbers, all geometry from the example, and none of the
standards claims in its own theory: the 75 % IPC-A-610 minimum, the 1.2 mm
exception, the contractual 100 % fill. The length of the marker tracks the size of
the worked example, not the exposure.

So the checklist below is built from what the lessons *assert about standards*,
which is what a reviewer has to confirm before anyone treats this as a work
instruction.

## Scope

| | |
|---|---|
| lessons | 92 |
| modules | 15 |
| quiz questions | 185 |
| standards cited | 40 |
| distinct claim sentences | 571 |
| recurring facts in Part A | 26 |
| sources in the registry | 39 |

---

## Part A — the recurring facts

Each fact below is asserted in several lessons in different words. Verify it once
against the standard and every lesson citing it is covered. This is the shortest
path through the course: 26 facts touch 81 of 92 lessons.

The "course asserts" column is what the course currently says. If the standard
disagrees, the course is wrong and the lesson must be corrected before promotion.

| # | Fact | Course asserts | Verify against | Lessons | OK |
|---|---|---|---|---|---|
| 1 | IPC rework document numbers | IPC-7711/7721 (rework, modification and repair) | IPC document catalogue | 16 | ☑ |
| 2 | IPC-7525 stencil area ratio and aspect ratio | area ratio 0.66, aspect ratio 1.5;  area ratio = aperture area ÷ sidewall area | IPC-7525 stencil design guidelines | 15 | ☑ |
| 3 | Wave flux deposition on a solids basis | 500-1500 µg/in² of flux solids (≈0.78-2.33 g/m²) | Flux supplier process window / AIM profile supplement | 15 | ☑ |
| 4 | IPC-A-610 minimum vertical barrel fill | 75 % for both Class 2 and Class 3 | IPC-A-610H section 10, through-hole solder fill | 13 | ⚠ |
| 5 | IPC-A-610 Class 3 external annular ring | minimum 0.05 mm with no breakout | IPC-A-610 annular ring criteria | 13 | ☑ |
| 6 | MSL 6 floor life | no floor life — mandatory bake before use, then reflow within the label time limit | J-STD-020 / J-STD-033 MSL definitions | 12 | ☑ |
| 7 | J-STD-033 bake at 90 °C and 40 °C | 90 °C: 25-30 h / 48 h / 96-192 h;  40 °C: 8-12 days / 11+ days / 38+ days | J-STD-033 Table 4-1 | 11 | ⚠ |
| 8 | SAC305 phase change temperatures | solidus 217 °C, liquidus 219 °C | Alloy supplier datasheet / IPC J-STD-006 alloy designation tables | 8 | ☑ |
| 9 | J-STD-033 cumulative bake cap | cumulative time above 90 °C up to 125 °C ≤ 96 h; above 125 °C needs supplier approval | J-STD-033 cumulative bake guidance | 8 | ☑ |
| 10 | Tape-and-reel dry-pack temperature cap | capped at 40 °C | J-STD-033 handling guidance for tape-and-reel | 8 | ☑ |
| 11 | IPC-CC-830 conformal coating type designations | AR acrylic, ER polyurethane, SR silicone, DR parylene | IPC-CC-830 type designation tables | 7 | ☑ |
| 12 | J-STD-020 classification temperature by package size | 260 °C small, 250 °C large, 245 °C very large | J-STD-020 classification temperature tables | 5 | ☑ |
| 13 | J-STD-020 ramp-down limit | ≤ 6 °C/s | J-STD-020 reflow profile requirements | 5 | ☑ |
| 14 | Contractual 100 % fill | a customer requirement, not an IPC-A-610 class limit | IPC-A-610H section 10 and the customer contract | 5 | ☑ |
| 15 | ESD programme and test-method standards | ANSI/ESD S20.20 for the programme; STM3.1 → IEC 61340-4-7 ionisation; STM97.1/97.2 → IEC 61340-4-5 footwear and flooring | ANSI/ESD S20.20 and the ESD Association test-method catalogue | 5 | ☑ |
| 16 | J-STD-033 bake at 125 °C by thickness | 8 h ≤1.4 mm, 18 h >1.4-2.0 mm, 48 h >2.0-4.5 mm | J-STD-033 Table 4-1 (user bake, clock resets to t=0) | 4 | ⚠ |
| 17 | Preheat ramp rate for wave and selective | 1-3 °C/s | Equipment and paste datasheets; IPC-7530 profiling guidance | 4 | ☑ |
| 18 | J-STD-020 tp — time within 5 °C of classification temperature | max 30 s for large/very large, 40 s for small | J-STD-020 reflow profile requirements | 3 | ☑ |
| 19 | IPC-A-610 documented hole-fill exception | ≈50 % fill or 1.2 mm for parts with ≥14 leads tied to internal thermal or conductor planes | IPC-A-610H section 10 exception clause | 3 | ⚠ |
| 20 | ISO 2859-1 single-sampling Ac/Re at AQL 1.0 % | K → n=125, Ac=3, Re=4;  L → n=200, Ac=5, Re=6 | ISO 2859-1 normal single-sampling plans, AQL 1.0 % | 3 | ☑ |
| 21 | IPC-6012 bow and twist limit | 0.75 % for boards using surface-mount components, 1.5 % for other boards | IPC-6012 bow/twist requirement, measured per IPC-TM-650 2.4.22 | 3 | ☑ |
| 22 | Cleanliness ionic limit | 1.56 µg NaCl equivalent/cm² (IPC-TM-650 2.3.25) | IPC-TM-650 2.3.25 and IPC-6012 cleanliness clause | 3 | ☑ |
| 23 | ISO 2859-1 code letter to sample size | A2 B3 C5 D8 E13 F20 G32 H50 J80 K125 L200 M315 N500 P800 Q1250 R2000 | ISO 2859-1 / ANSI-ASQ Z1.4 Table II-A | 2 | ☑ |
| 24 | ISO 2859-1 lot-size to code letter by inspection level | 501-1200 G/J/K;  1201-3200 H/K/L;  3201-10000 J/L/M | ISO 2859-1 Table I | 1 | ☑ |
| 25 | J-STD-004/005 solder powder Type 3 | 25-45 µm, ≥80 % between sieves, <10 % below 25 µm, <10 % in 45-60 µm, <0.5 % above 60 µm | J-STD-005 powder size distribution tables | 1 | ☑ |
| 26 | IPC-7525 edition | the course cites IPC-7525B (m03l06) and IPC-7525D (m03l02); registry src-004 says Rev A | IPC-7525 revision history — which revision is current, and whether both citations can be right | 0 | ☑ |

> **IPC rework document numbers** — VERIFIED (round 11). IPC-7711 = Rework of Electronic Assemblies; IPC-7721 = Repair and Modification of Printed Boards and Electronic Assemblies; published together as IPC-7711/7721. The numbers are correct. The earlier draft’s "IPC-7711/7712" was indeed wrong — 7712 does not cover this subject.

> **IPC-7525 stencil area ratio and aspect ratio** — DEFINITIONS VERIFIED VERBATIM from IPC-7525B §1.1.2 and §1.1.3 (round 10). The 0.66 and 1.5 FIGURES are still carried only by convergent secondary sources and remain unverified against the standard body text.

> **Wave flux deposition on a solids basis** — VERIFIED (round 11). AIM wave-solder profile supplement: "Flux deposition of 500-1500 micrograms of flux per square inch is typical", and the dry-method note "Anything remaining on the board will represent a deposit of only flux solids" — so the range is a solids basis, as the course states. The unit conversion also checks: 500–1500 µg/in² = 77.5–232.5 µg/cm² = 0.775–2.325 g/m², i.e. the course’s 0.78–2.33 g/m².

> **IPC-A-610 minimum vertical barrel fill** — CONTRADICTED — left open. Secondary sources split, and one publisher contradicts itself across two of its own articles. The 50 % figure may belong to IPC-6012 (bare board) rather than IPC-A-610 (assembly), which would make the course right, but that is a hypothesis. Needs IPC-A-610H §10 in front of a reviewer. See SOURCES_VERIFIED.md.

> **IPC-A-610 Class 3 external annular ring** — VERIFIED (round 11). Class 3 external annular ring minimum 2 mil = 0.05 mm with no breakout; internal 1 mil = 0.025 mm with no breakout; Class 2 permits up to 90° breakout. Agreed by four independent sources. Caveat: the criterion is documented in IPC-A-600 / IPC-6012 (bare board), not IPC-A-610 (assembly) — the checklist’s "verify against" names the wrong document.

> **MSL 6 floor life** — VERIFIED VERBATIM from J-STD-033 Table 5-1 (round 10): "Mandatory bake before use. After bake, must be reflowed within the time limit specified on the label."

> **J-STD-033 bake at 90 °C and 40 °C** — LEFT OPEN. The J-STD-033B.1 Table 4-1 gives 10 days at 90 °C and 79 days at 40 °C for the >2.0 to 4.5 mm band, a different order of magnitude from the course’s figures. The revision-D restructure may explain it; the numbers came out of a garbled PDF text layer and could not be confirmed.

> **SAC305 phase change temperatures** — VERIFIED (round 11). Kester SAC305 technical data sheet: "Melting Point 217 to 219 °C (423 to 426 °F)" — exactly the course’s pair. Solidus 217 °C is unanimous across suppliers; liquidus is 219 °C nominal (EasySpheres, Kester) though Indium and Kapp Alloy quote 220 °C. The course uses 217 as solidus and 219 as liquidus throughout, which is correct.

> **J-STD-033 cumulative bake cap** — VERIFIED for revision D (round 10). J-STD-033D §4.2.7.1: "the cumulative bake time at a temperature greater than 90 °C and up to 125 °C should not exceed 96 hours." J-STD-033A and B said 48 hours — D relaxed it, so the course is right only if it means D.

> **Tape-and-reel dry-pack temperature cap** — VERIFIED (round 10). J-STD-033: tape and reel maximum 40 °C to prevent carrier damage; the 125 °C option cannot be used with tape/reel.

> **IPC-CC-830 conformal coating type designations** — THE COURSE WAS WRONG — CORRECTED in round 11. The m12l01 table gave "Polyurethane (ER)" and "Parylene (DR)". IPC-CC-830C §1.3.1 lists Type AR acrylic, Type ER EPOXY, Type SR silicone, Type UR POLYURETHANE, Type XY PARAXYLYLENE (parylene), Type UT ultra-thin, Type SC styrene block co-polymer. ER is epoxy, not polyurethane, and there is no DR at all. Confirmed from two independent renderings of the standard. Consequence: a reader specifying "ER" for a polyurethane coating orders an epoxy, and "DR" orders nothing. Two cells corrected.

> **J-STD-020 classification temperature by package size** — THE COURSE WAS WRONG — CORRECTED in round 10. "260 small / 250 large / 245 very large" is the 1.6–2.5 mm thickness row only. The table is thickness × volume: below 1.6 mm every volume is 260 °C, and above 2.5 mm the limits fall to 250 °C small and 245 °C large and very large. A small-volume package thicker than 2.5 mm is limited to 250 °C, not 260 °C. Five occurrences corrected.

> **J-STD-020 ramp-down limit** — VERIFIED (round 10). J-STD-020D: "Ramp-down rate (Tp to TL) 6 °C/second max."

> **Contractual 100 % fill** — VERIFIED (round 11). IPC-A-610 sets acceptance criteria and class minimums, not a 100 % fill requirement; class assignment belongs to the customer, and customer requirements supersede the industry standard. Note that IPC-A-610J removed the "Target" condition entirely (it left the standard in Rev H, September 2020), so in the current revision 100 % fill cannot even be expressed as a target condition — it can only be a contractual requirement.

> **ESD programme and test-method standards** — VERIFIED (round 11) from the ESD Association’s own IEC-equivalency chart: "ANSI/ESD STM3.1 | IEC 61340-4-7 | Ionization" and "ANSI/ESD STM97.1 & ANSI/ESD STM97.2 | IEC 61340-4-5 | Footwear and Flooring Systems". The ESDA endorsed-standards page confirms STM97.1-2015 and STM97.2-2016 are each technically equivalent to IEC 61340-4-5. This also confirms the earlier draft’s error: no STM97.7 or 97.8 covers ionization. ANSI/ESD S20.20 is the programme standard, technically equivalent to IEC 61340-5-1.

> **J-STD-033 bake at 125 °C by thickness** — LIKELY A TABLE CONFLATION — left open. The course’s 8 h comes from J-STD-033D Table 4-1 (user bake), but its 18 h and 48 h come from Table 4-2 (supplier bake, MET = 24 h), and 18 h is the MSL-2 value only. No revision contains that chain, and the two tables mean different things.

> **Preheat ramp rate for wave and selective** — VERIFIED (round 11). AIM profile supplement, citing IPC/JEDEC: "Top Side Ramp Up Rate — < 3 °C/Sec (general), 1 - 3 °C/Sec (tin-lead), 1 - 3 °C/Sec (lead-free)". Caveat: the IPC-7530A industry draft notes component suppliers often recommend a more conservative 2–4 °C/s to avoid thermal shock, so 1–3 °C/s is the process window, not a component-safe limit.

> **J-STD-020 tp — time within 5 °C of classification temperature** — THE COURSE WAS WRONG — CORRECTED in round 10. No revision supports 40 s. J-STD-020D Table 5-2 gives tp = 30 s on the Pb-free profile and 20 s for SnPb; J-STD-020E and F datasheets reproduce 20–30 s and <30 s. Four occurrences corrected.

> **IPC-A-610 documented hole-fill exception** — CONSISTENTLY DESCRIBED but rests on the same unresolved §10 question as the barrel-fill fact. Secondary sources agree on "≈50 % fill or 1.2 mm for parts with 14 or more leads tied into internal thermal or conductor planes", but the publisher that states it also contradicts itself on the base 75 % figure. Not ticked until §10 is read.

> **ISO 2859-1 single-sampling Ac/Re at AQL 1.0 %** — VERIFIED (round 11). K (n=125) → Ac 3, Re 4; L (n=200) → Ac 5, Re 6; J (n=80) → Ac 2, Re 3; H (n=50) → Ac 1, Re 2. Three independent reproductions of ISO 2859-1 Table II-A agree. This is the table behind the W17 correction of m01l03.

> **IPC-6012 bow and twist limit** — VERIFIED (round 11). Eurocircuits quotes IPC-6012 directly: "maximum bow and twist of 0.75% for printed boards that use surface mount components and 1.5% for all other printed boards". IPC-A-600 §2.11 carries the same split, measured per IPC-TM-650 2.4.22. Agreed by four independent sources.

> **Cleanliness ionic limit** — VERIFIED (round 11). 1.56 µg NaCl equivalent/cm² tested per IPC-TM-650 2.3.25, and the clause is named exactly as the course names it: "Per IPC-6012E §3.9.1, ionic contamination must not exceed 1.56 µg/cm² NaCl equivalent for Class 2/3 bare boards". Useful cross-check the course could carry: 1.56 µg/cm² = 10.06 µg/in². IPC-5704 lists the same 1.56 total ionic figure with per-ion limits of chloride 0.25, bromide 0.25, sulfate 0.50, weak organic acids 1.0.

> **ISO 2859-1 code letter to sample size** — VERIFIED (round 11). A 2, B 3, C 5, D 8, E 13, F 20, G 32, H 50, J 80, K 125, L 200, M 315, N 500, P 800, Q 1250, R 2000 (S 3150). Matches the course exactly; confirmed against a hosted copy of ISO 2859-1 itself and three independent reproductions.

> **ISO 2859-1 lot-size to code letter by inspection level** — VERIFIED (round 11) for general inspection level II: 501–1200 → J (80), 1201–3200 → K (125), 3201–10000 → L (200). The course’s middle value of each triple is level II, which is the level used in the m01l03 sampling lesson fixed in W17.

> **J-STD-004/005 solder powder Type 3** — VERIFIED (round 11) against J-STD-005A, reproduced verbatim by AIM and by the Journal of Welding and Joining: <0.5 % larger than 60 µm, <10 % in the 45–60 µm band, ≥80 % between 25–45 µm, <10 % smaller than 25 µm. That is exactly the course’s claim. Note the original J-STD-005 (January 1995) Table 2A gave different limits — none larger than 50 µm, 80 % between 45–25 µm, 10 % max below 20 µm — so the course is right only for revision A and later.

> **IPC-7525 edition** — RESOLVED in round 10. The current revision is IPC-7525C (November 2021); IPC-7525D does not exist, IPC-7525B (10/2011) is superseded, and src-004 said Rev A. 19 edition references corrected, src-004 Rev A to Rev C. The course’s own TBD-REVIEW marker had asked for exactly this check.

---

## Part B — every distinct claim, grouped by standard

Every sentence in the course that cites a standard, quoted verbatim, with the
lesson and the field it lives in. Work a standard at a time: read the clause once,
then tick the claims against it.

`where` tells you the field: `theory[i].p` is a paragraph, `theory[i].blocks[j]` a
block (`.table` for tables, `.figure` for the SVG schematics), `calc.task` and
`calc.solution` the worked example, `defect.*` the case study, `quiz[k].*` the
questions and their explanations.

### IPC-A-610 — 130 claims

Registry entry: `src-001` — IPC-A-610 Acceptability of Electronic Assemblies

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m03l04 | `theory[7].p` | Use IPC-A-610 acceptance criteria for solder joint inspection, and use paste volume measurement or two-dimensional or three-dimensional inspection to confirm that the printed deposit matches the intended aperture volume. | ☐ |
| m03l04 | `calc.solution` | Inspect first article per IPC-A-610 and measure printed volume; adjust if bridges or opens appear. | ☐ |
| m03l04 | `defect.action` | Reduce foil to 0.10 mm, reduce aperture width to 0.22 mm, use rounded or trapezoidal apertures, verify area ratio of at least 0.66 against IPC-7525, adjust paste viscosity and squeegee pressure, re-run first article and inspect per IPC-A-610. | ☐ |
| m04l02 | `theory[3].p` | Spec limits may come from customer drawings, IPC-A-610 acceptability requirements, or a product-specific validated window. | ☐ |
| m04l02 | `theory[7].p` | A common starting point is a volume window around the validated nominal value, with height and area limits checked against stencil thickness and aperture area; verify the final limits against your paste and equipment datasheet and against IPC-A-610 acceptability for the required product class. | ☐ |
| m04l06 | `theory[1].p` | For acceptability limits, use your product specification and the relevant IPC-A-610 class requirements, then verify against your paste, stencil, and printer datasheets. | ☐ |
| m05l03 | `theory[5].p` | Verify the acceptable rotation limit against the assembly drawing, IPC-A-610 class requirements, and the component footprint geometry. | ☐ |
| m05l06 | `theory[2].p` | For fine-pitch QFPs, typical placement tolerance targets are often in the range of ±0.05 mm to ±0.10 mm for centre position and ±0.5° to ±1.0° for angle, but verify against your placement machine datasheet, component datasheet, and IPC-A-610 class requirements. | ☐ |
| m05l06 | `theory[8].p` | IPC-A-610 provides acceptability criteria for component placement and soldering, but it does not replace machine capability targets or design-specific limits. | ☐ |
| m07l01 | `theory[0].p` | It is useful for gross assembly errors and cosmetic acceptability under IPC-A-610 Acceptability Requirements for Electronic Assemblies. | ☐ |
| m07l01 | `theory[6].p` | Acceptance should follow the customer-specified IPC-A-610 Acceptability Requirements for Electronic Assemblies class and relevant design guidance such as IPC-7351 Land Pattern Design Data Standard for Surface Mount and IPC-7525 Stencil Design Guidelines. | ☐ |
| m07l01 | `calc.solution` | Verify resolution and test coverage against your equipment datasheet and the customer-specified IPC-A-610 Acceptability Requirements for Electronic Assemblies class. | ☐ |
| m07l01 | `defect.action` | Verify ball coplanarity and land pattern, then re-run a qualification lot and accept results against the customer-specified IPC-A-610 Acceptability Requirements for Electronic Assemblies class. | ☐ |
| m07l04 | `theory[3].p` | IPC-A-610 includes acceptability criteria for voids in solder balls; for many Class 3 applications, voids are commonly evaluated against a limit such as 25% of the ball area, but the exact class, revision, and customer requirement must be checked against IPC-A-610 and the applicable contract. | ☐ |
| m07l04 | `theory[5].p` | IPC-A-610 includes criteria for through-hole solder fill and voids; for many Class 3 applications, voids are commonly evaluated against a limit such as 25% of the hole circumference, but the exact class, revision, and customer requirement must be checked against IPC-A-610 and the applicable contr… | ☐ |
| m07l04 | `theory[7].p` | Accept when the measured defect is within the applicable IPC-A-610 class and customer requirement. | ☐ |
| m07l04 | `calc.task` | Assume the applicable requirement is IPC-A-610 Class 3, voids in solder balls shall not exceed 25% of the ball area, and verify the exact class and revision against the contract. | ☐ |
| m07l04 | `calc.solution` | Compare with IPC-A-610 Class 3 criterion: 23.9% is less than 25%. | ☐ |
| m07l04 | `calc.solution` | Disposition: accept, provided the void location and any additional voids are also within the applicable IPC-A-610 class and customer requirement. | ☐ |
| m07l04 | `quiz.q-m07l04-02.prompt` | Using the lesson formula fill fraction = solder height / hole depth and the IPC-A-610 Class 3 minimum fill criterion, what is the disposition? | ☐ |
| m07l04 | `quiz.q-m07l04-02.options[0].text` | Accept: fill is 66.7%, which meets IPC-A-610 Class 3 minimum fill. | ☐ |
| m07l04 | `quiz.q-m07l04-02.options[1].text` | Reject: fill is 66.7%, which is below IPC-A-610 Class 3 minimum fill. | ☐ |
| m07l04 | `quiz.q-m07l04-02.options[2].text` | Rework: fill is 33.3%, which is below IPC-A-610 Class 3 minimum fill. | ☐ |
| m07l04 | `quiz.q-m07l04-02.options[3].text` | Accept: fill is 150%, which is above IPC-A-610 Class 3 minimum fill. | ☐ |
| m07l04 | `quiz.q-m07l04-02.explanation` | IPC-A-610 Class 3 requires at least 75% fill, so the joint is reject. | ☐ |
| m07l05 | `theory[2].p` | A class is the product or workmanship level, commonly IPC-A-610 Class 1, Class 2, or Class 3, which sets the acceptance threshold for the same condition. | ☐ |
| m07l05 | `theory[4].p` | For example: 'U7 pin 12: suspected insufficient solder fillet; AOI fillet height 0.18 mm; verify against IPC-A-610 Class 2 and paste deposit data.' This gives the second engineer the location, the measured evidence, the applicable class, and the next step. | ☐ |
| m07l05 | `theory[5].p` | IPC-A-610 Class 1, Class 2, and Class 3 describe increasing workmanship requirements; the same solder fillet, component tilt, or solder ball may be dispositioned differently. | ☐ |
| m07l05 | `calc.task` | The assembly is IPC-A-610 Class 2. | ☐ |
| m07l05 | `calc.solution` | Use manual inspection, microscopy, or a calibrated AOI re-run; if the confirmed fillet is below the applicable IPC-A-610 Class 2 criterion and the internal minimum, reject or rework per IPC-7711/7721; if confirmed at or above the criterion, accept. | ☐ |
| m07l05 | `calc.solution` | 5) Standardized finding: 'Q1 pin 3: suspected insufficient solder fillet; AOI height 0.18 mm ±0.05 mm; internal process minimum 0.20 mm; verify against IPC-A-610 Class 2 before disposition.' | ☐ |
| m07l05 | `quiz.q-m07l05-02.prompt` | Using the lesson formula Defect Rate = Defects / Inspected Units × 100, and the rule of thumb that a lot is dispositioned as a defect only when the defect rate exceeds the IPC-A-610 class number percent, a Class 3 lot has defects equal to the class number and inspected units equal to one hundred. | ☐ |
| m07l05 | `quiz.q-m07l05-02.explanation` | The IPC-A-610 Class 3 number is 3, so defects = 3 and inspected units = 100. | ☐ |
| m07l06 | `theory[5]` | For reflow defects, judge the solder joint against the applicable workmanship standard, commonly IPC-A-610, and against the design intent. | ☐ |
| m07l06 | `theory[6]` | IPC-A-610 provides acceptability criteria for hole fill, wetting angle, excess solder, icicles, solder balls, and lifted leads, but the exact acceptance limits depend on product class and current revision, so cite the standard and revision in the finding. | ☐ |
| m07l06 | `calc.solution` | For the paste deposit outside the intended aperture, classify it as bridging or smearing; rework the print process and remove the affected boards unless paste contamination or board damage makes the board unusable; cite the stencil aperture, paste datasheet, and IPC-A-610 joint acceptability afte… | ☐ |
| m07l06 | `calc.solution` | For the lifted termination before reflow, classify it as lifted termination or misalignment; rework placement if the component and pad are undamaged; reject if the pad is lifted or the component is damaged; cite IPC-A-610 placement and solder joint acceptability. | ☐ |
| m07l06 | `calc.solution` | For the reflowed bridge, classify it as bridging; rework if the pads and traces are intact; reject if pad lifting or substrate damage is visible; cite IPC-A-610 solder joint acceptability. | ☐ |
| m07l06 | `calc.solution` | For the THT dull non-wetted joint, classify it as cold solder or insufficient wetting; rework per IPC-7711/7721 if the hole wall and lead are sound; reject if hole wall damage or non-repairable contamination is present; cite IPC-A-610 THT solder joint acceptability. | ☐ |
| m07l06 | `quiz.q-m07l06-01.prompt` | Using IPC-A-610 workmanship vocabulary, what defect type and disposition should be recorded? | ☐ |
| m07l06 | `quiz.q-m07l06-01.options[1].text` | Insufficient solder paste; rework by cleaning and reprinting because paste coverage does not meet the IPC-A-610 print criterion. | ☐ |
| m07l06 | `quiz.q-m07l06-01.explanation` | IPC-A-610 requires adequate paste coverage to form an acceptable solder joint, so the board should be reworked by cleaning and reprinting before reflow. | ☐ |
| m07l06 | `quiz.q-m07l06-02.prompt` | A THT through-hole joint is inspected and the solder fills the hole to exactly the IPC-A-610 minimum hole-fill fraction. | ☐ |
| m07l06 | `quiz.q-m07l06-02.prompt` | Using fill percentage = fill fraction x 100 and disposition = accept when fill percentage is at least the IPC-A-610 minimum, what disposition is supported if all other workmanship criteria are met? | ☐ |
| m07l06 | `quiz.q-m07l06-02.options[0].text` | Accept, because the calculated fill percentage meets the IPC-A-610 minimum. | ☐ |
| m07l06 | `quiz.q-m07l06-02.explanation` | IPC-A-610 minimum hole fill is three-quarters of the hole depth, so fill percentage = 3/4 x 100 = 75%. | ☐ |
| m08l01 | `theory[6].p` | Use IPC-A-610 acceptance for your product class as the pass/fail reference, but treat calculated fill as a prediction that must be confirmed by measurement. | ☐ |
| m08l01 | `calc.solution` | Step 9: Compare the measured fill height and wetting to IPC-A-610 acceptance for your product class, and verify the process against your paste, flux, and equipment datasheet. | ☐ |
| m08l01 | `quiz.q-m08l01-02.prompt` | Using a rule-of-thumb diametral clearance of 0.30 mm between lead and plated hole and the IPC-A-610 minimum vertical barrel fill, a rule-of-thumb lead diameter of 0.50 mm is used. | ☐ |
| m08l01 | `quiz.q-m08l01-02.explanation` | IPC-A-610 sets a minimum vertical barrel fill of 75% for both Class 2 and Class 3, with Class 3 additionally requiring visible fillets on both sides; 100% fill is a customer requirement, not an IPC-A-610 class limit. | ☐ |
| m08l02 | `theory[5].p` | For production, use the IPC-A-610 acceptance criteria for the applicable product class and verify the actual fill with cross-sections or X-ray where required. | ☐ |
| m08l02 | `calc.solution` | Verify the actual expected fill against the IPC-A-610 acceptance criteria for the applicable product class and against pilot-build cross-sections. | ☐ |
| m08l02 | `quiz.q-m08l02-02.prompt` | IPC-A-610 Class 2 requires a minimum hole fill of 75%. | ☐ |
| m08l03 | `defect.action` | Run a trial board and inspect the joint against IPC-A-610 acceptance criteria and your wave solder process specification. | ☐ |
| m08l05 | `theory[6].p` | Acceptance of hole fill is defined by the applicable IPC-A-610 class. | ☐ |
| m08l05 | `theory[6].p` | IPC-A-610 sets a minimum vertical barrel fill of 75% for both Class 2 and Class 3, with Class 3 additionally requiring visible fillets on the primary and secondary sides. | ☐ |
| m08l05 | `theory[6].p` | Some customers specify 100% fill contractually, which is a customer requirement rather than an IPC-A-610 class limit. | ☐ |
| m08l05 | `calc.task` | Compare the expected fill with IPC-A-610 minimum hole fill for the applicable class. | ☐ |
| m08l05 | `calc.solution` | The 90% target is above the IPC-A-610 minimum vertical barrel fill of 75% that applies to both Class 2 and Class 3; a customer requirement for 100% fill is contractual and is not an IPC-A-610 class limit. | ☐ |
| m08l05 | `defect.symptom` | X-ray or cross-section shows hole fill below the applicable IPC-A-610 minimum, with dull solder at the exit side and occasional open at the lead shoulder. | ☐ |
| m09l01 | `theory[6].p` | Use IPC-A-610 acceptance criteria for evaluation. | ☐ |
| m09l02 | `theory[7].p` | IPC J-STD-001 and IPC-A-610 provide acceptance criteria for soldered assemblies; use them with your internal limits for flux residue and cleaning. | ☐ |
| m09l03 | `theory[7].p` | Use IPC-A-610 acceptability criteria for the required product class, and document the flux type, flux density, preheat setpoints, wave height, conveyor speed, and wave temperature. | ☐ |
| m09l03 | `calc.solution` | Verify all settings with thermocouple data, flux weight, and IPC-A-610 inspection. | ☐ |
| m09l04 | `theory[7].p` | Inspect the coupon against IPC-A-610 acceptability criteria and record the settings. | ☐ |
| m09l04 | `defect.action` | Increase dwell by reducing conveyor speed or increasing effective contact length; raise wave height or reduce board clearance within machine limits; verify flux coverage and preheat; re-run a coupon and inspect against IPC-A-610 acceptability criteria. | ☐ |
| m09l06 | `theory[1].p` | Acceptance limits are defined in IPC-A-610; verify the applicable class and revision before judging a joint. | ☐ |
| m09l06 | `theory[7].p` | Verify preheat ramp, dwell, and board bake requirements against your paste/equipment datasheet and the applicable IPC-A-610 acceptance criteria. | ☐ |
| m09l06 | `calc.solution` | Compare with the acceptance limit in IPC-A-610 for the applicable class; if the limit is higher, the joint fails. | ☐ |
| m09l06 | `quiz.q-m09l06-02.prompt` | If the hole diameter is twice the lead diameter and the required fill is the IPC-A-610 minimum of 75% of barrel height, what is the expected fill fraction and the disposition? | ☐ |
| m09l06 | `quiz.q-m09l06-02.explanation` | Expected fill = 1 − (1/2)² = 1 − 0.25 = 0.75 = 75%, which meets the IPC-A-610 minimum vertical barrel fill of 75% for Class 2 and Class 3, so the disposition is accept when the other workmanship criteria are met. | ☐ |
| m09l06 | `quiz.q-m09l06-02.explanation` | IPC-A-610 does not set a 100% class limit; a 100% requirement is contractual. | ☐ |
| m09l07 | `theory[8].p` | For first article, run the board, inspect the solder side against IPC-A-610 Class 2/3 acceptance, measure hole fill, and keep a solder-side image. | ☐ |
| m10l01 | `theory[0].p` | IPC-A-610 acceptance classes should be agreed before the trial, because the same visual defect may be acceptable in one class and unacceptable in another. | ☐ |
| m10l01 | `theory[5].p` | IPC-A-610 acceptance should be used to confirm the joint, and IPC-7711/7721 should guide any rework. | ☐ |
| m10l01 | `theory[7].p` | For acceptance, use the agreed IPC-A-610 class and the relevant IPC J-STD-001 requirements for materials and workmanship. | ☐ |
| m10l01 | `calc.solution` | Confirm acceptance against IPC-A-610 and rework any defective joint according to IPC-7711/7721. | ☐ |
| m10l01 | `defect.action` | Re-inspect against IPC-A-610. | ☐ |
| m10l04 | `theory[7].p` | Verification should include first-article inspection, thermocouple measurement at representative joints, cross-sections for critical joints, and acceptance review against IPC-A-610. | ☐ |
| m10l04 | `defect.action` | Qualify the change with cross-sections and acceptance review against IPC-A-610. | ☐ |
| m10l05 | `theory[1].p` | Use IPC-A-610 for visual acceptance, IPC-7711/7721 for rework and repair guidance, and IPC-7530 for thermal process control where applicable. | ☐ |
| m10l05 | `theory[5].p` | Use IPC-A-610 for acceptance and IPC-7711/7721 for repair guidance. | ☐ |
| m11l01 | `theory[6].p` | IPC-A-610 provides visual acceptance criteria for electronic assemblies, while IPC J-STD-001 covers workmanship and repair practices. | ☐ |
| m11l01 | `calc.solution` | Step 8: Inspect the joint for wetting, fillet, lifted pad, and laminate damage, using IPC-A-610 and IPC J-STD-001 as the workmanship references. | ☐ |
| m11l01 | `defect.action` | Reduce the setpoint within the paste and iron datasheet range, use a larger or better-tinned tip to improve heat transfer, shorten contact time, pre-tin the pad, and inspect the board with IPC-A-610. | ☐ |
| m11l03 | `theory[6].p` | IPC-A-610 provides visual acceptance criteria for electronic assemblies; use the class and acceptance criteria defined by the contract. | ☐ |
| m11l04 | `quiz.q-m11l04-02.prompt` | IPC-7711/7721 repair acceptance requires the repaired annular ring to meet the IPC-A-610 Class 3 minimum of 0.05 mm. | ☐ |
| m11l05 | `theory[1].p` | IPC-7711/7721 Acceptability of Rework, Modifications, and Repairs for Electronic Assemblies provides acceptability criteria for reworked and repaired assemblies, while IPC-A-610 Acceptability of Electronic Assemblies provides the baseline visual and construction acceptability criteria for the ori… | ☐ |
| m11l05 | `theory[2].p` | IPC-7711/7721 Acceptability of Rework, Modifications, and Repairs for Electronic Assemblies is the primary standard for judging whether a reworked or repaired joint is acceptable, but the product specification may also require IPC-A-610 Acceptability of Electronic Assemblies and IPC J-STD-001 Req… | ☐ |
| m11l05 | `theory[3].p` | IPC-A-610 Acceptability of Electronic Assemblies and IPC-7711/7721 Acceptability of Rework, Modifications, and Repairs for Electronic Assemblies use class-based criteria, commonly Class 1, Class 2, and Class 3, with Class 3 generally applying to high-reliability products where defects have greate… | ☐ |
| m11l05 | `theory[4].p` | IPC-7711/7721 Acceptability of Rework, Modifications, and Repairs for Electronic Assemblies provides repairability and acceptability guidance, while IPC-A-610 Acceptability of Electronic Assemblies provides the visual acceptability baseline. | ☐ |
| m11l05 | `theory[7].p` | In practice, the inspector should first confirm the required class, then inspect the repaired area against IPC-A-610 Acceptability of Electronic Assemblies and IPC-7711/7721 Acceptability of Rework, Modifications, and Repairs for Electronic Assemblies. | ☐ |
| m11l05 | `calc.task` | The product specification requires IPC-A-610 Acceptability of Electronic Assemblies Class 3 and IPC-7711/7721 Acceptability of Rework, Modifications, and Repairs for Electronic Assemblies Class 3. | ☐ |
| m11l05 | `calc.solution` | In this case, the required class is IPC-A-610 Acceptability of Electronic Assemblies Class 3 and IPC-7711/7721 Acceptability of Rework, Modifications, and Repairs for Electronic Assemblies Class 3. | ☐ |
| m11l05 | `calc.solution` | Step 3: Compare the condition against IPC-A-610 Acceptability of Electronic Assemblies Class 3. | ☐ |
| m11l05 | `defect.action` | Stop the repair, inspect the pad, trace, and adjacent joints, and compare the condition against IPC-A-610 Acceptability of Electronic Assemblies and IPC-7711/7721 Acceptability of Rework, Modifications, and Repairs for Electronic Assemblies. | ☐ |
| m11l06 | `theory[1].p` | The product owner normally states the required IPC-A-610 class, such as Class 2, and the reworked joint must meet that class unless an approved deviation exists. | ☐ |
| m11l06 | `theory[5].p` | The record should state the required IPC-A-610 class and whether the joint meets IPC-7711/7721 rework or repair acceptance for that class. | ☐ |
| m11l06 | `theory[6].p` | Inspect the joint against the relevant IPC-A-610 acceptance criteria for the required class, then confirm that the rework or repair method is acceptable under IPC-7711/7721. | ☐ |
| m11l06 | `theory[7].p` | Each failure mode should be recorded with evidence and dispositioned against IPC-7711/7721 and IPC-A-610. | ☐ |
| m11l06 | `calc.task` | A product requires IPC-A-610 Class 2. | ☐ |
| m11l06 | `calc.solution` | Record preheat 150 °C, hot-gas peak 248 °C for 8 s, iron tip 350 °C for 2 s, total cycles 2, materials used, inspection result, IPC-7711/7721 rework acceptance, and the required IPC-A-610 Class 2 disposition. | ☐ |
| m11l06 | `defect.action` | If a repair is approved and the joint can meet IPC-A-610 Class 2, perform the approved repair and document it; otherwise scrap or route for engineering disposition. | ☐ |
| m12l04 | `theory[8].p` | Finally, verify the selected coating against IPC-CC-830 qualification data, IPC-A-610 inspection requirements, IPC-7711/7721 rework guidance, and the assembly cleaning process. | ☐ |
| m12l04 | `calc.solution` | This range is verified against the coating datasheet and IPC-A-610 inspection requirements for coating coverage and thickness. | ☐ |
| m12l04 | `calc.solution` | The 1.0 mm margin is a process example and should be verified against the coating viscosity, application method, and IPC-A-610 inspection criteria. | ☐ |
| m12l04 | `defect.action` | Add a post-cure inspection step for shadowed regions and requalify the coating process against IPC-CC-830 and IPC-A-610 requirements. | ☐ |
| m12l05 | `theory[4].p` | Check that the coating does not creep into connector contacts or under component terminations where IPC-A-610 class requirements for cleanliness and solder joint visibility apply. | ☐ |
| m12l05 | `theory[6].p` | Too thin a coating may not meet IPC-CC-830 qualification or IPC-A-610 acceptability for the intended class; too thick a coating can trap solvent, crack during thermal cycling, or interfere with connectors and test probes. | ☐ |
| m12l05 | `theory[8].p` | After coating, inspection should check for pinholes, bridging, voids, peeling, contamination, and coverage of exposed copper, using IPC-A-610 acceptability criteria for the applicable class. | ☐ |
| m12l05 | `calc.solution` | If the qualified IPC-CC-830 coating system or IPC-A-610 inspection class requires a different thickness range, adjust the spray parameters and re-measure. | ☐ |
| m12l06 | `theory[3].p` | For example, a board may pass if no visible residue is present under the magnification required by IPC-A-610 for the applicable product class, and if ionic contamination is below the limit agreed for the assembly and coating system. | ☐ |
| m13l03 | `theory[7].p` | Probe marks should be evaluated against IPC-A-610 acceptability criteria and your product quality requirements. | ☐ |
| m13l03 | `defect.action` | Clean the board and probe tips, verify probe force and dwell against the tester datasheet, inspect pad finish and probe marks against IPC-A-610 acceptability criteria, and re-run the program with a contact-resistance check or calibration standard before releasing the lot. | ☐ |
| m14l01 | `theory[2].p` | For visual and workmanship decisions, IPC-A-610 provides acceptance criteria for electronic assemblies, and IPC-7711/7721 provides guidance for rework and repair. | ☐ |
| m14l01 | `defect.symptom` | AOI reports a high number of reflow-stage solder defects, especially insufficient solder and bridging, but repair confirmation shows that many boards pass IPC-A-610 acceptance or are repaired without a confirmed process defect. | ☐ |
| m14l01 | `defect.cause` | The defect database is counting AOI calls as confirmed defects without separating false calls, and the AOI program has not been audited against IPC-A-610 acceptance conditions or a seeded defect library. | ☐ |
| m14l01 | `defect.action` | Freeze the current Pareto, rebuild the defect table with separate fields for AOI call, confirmed defect, false call, escape, disposition, and IPC-A-610 acceptance decision. | ☐ |
| m14l02 | `theory[6].p` | The detection escape is addressed by inspection or test coverage, such as AOI program limits, X-ray sampling, functional test coverage, or IPC-A-610 visual acceptability criteria. | ☐ |
| m14l02 | `theory[6].p` | The contract class and IPC-A-610 requirements determine what is acceptable; verify against the applicable class. | ☐ |
| m14l02 | `theory[7].p` | Avoid absolute language; standards and contracts may allow exceptions, so record the applicable IPC-A-610 class, IPC/JEDEC J-STD-001 requirements, and any approved deviation. | ☐ |
| m14l03 | `theory[7].p` | Soldering acceptance should be checked against IPC-A-610 and IPC/JEDEC J-STD-001 where applicable. | ☐ |
| m14l06 | `theory[7].p` | IPC-A-610 Acceptability of Electronic Assemblies provides acceptance classes and visual criteria for solder joints, components, and cleanliness. | ☐ |
| m14l07 | `defect.cause` | Root cause is a preheat temperature setpoint drift in degrees Celsius that reduced flux activation; contributing causes are board loading density and conveyor speed variation in millimetres per second; detection escape is that final visual inspection did not include a hole fill check aligned with… | ☐ |
| m14l07 | `defect.action` | Corrective action: restore preheat setpoint, add a logged preheat check, and update inspection to include hole fill criteria from IPC-A-610; owner: wave solder process engineer; date: corrective action due before next monthly review. | ☐ |
| m15l03 | `theory[2].p` | Where acceptance criteria are needed, cite IPC-A-610 and verify the applicable class against the product qualification and customer drawing. | ☐ |
| m15l03 | `theory[7].p` | For solder joints, use cross-section or X-ray inspection against IPC-A-610 where required. | ☐ |
| m15l04 | `calc.solution` | Acceptance window: SPI paste height 0.10 mm to 0.13 mm, no bridging at 0.4 mm pitch, and package seating confirmed by X-ray or cross-section per IPC-A-610. | ☐ |
| m15l04 | `defect.action` | Reduce thermal-pad aperture to 58% to 62% area, split into 4 sub-apertures with 0.10 mm gaps, re-run SPI with height window 0.10 mm to 0.13 mm, and verify seating by X-ray per IPC-A-610. | ☐ |
| m15l05 | `theory[2].p` | For defect classification, use the acceptability class required by contract under IPC-A-610, and record whether defects were detected by SPI, AOI, X-ray, ICT, or functional test. | ☐ |

### J-STD-033 — 84 claims

Registry entry: `src-003` — J-STD-033 Handling, Packing, Shipping and Use of Moisture, Heat and ESD Sensitive Surface Mount Devices

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m01l02 | `theory[4].p` | The MSL label identifies the moisture sensitivity level and the floor life assigned under IPC/JEDEC J-STD-033. | ☐ |
| m01l02 | `calc.task` | A dry pack label states a floor life of 168 h per IPC/JEDEC J-STD-033. | ☐ |
| m01l02 | `calc.solution` | Finally, disposition: do not place the components without a qualified re-bake or other approved action under IPC/JEDEC J-STD-033; quarantine and record the exceedance. | ☐ |
| m01l02 | `defect.action` | Quarantine the lot, record the label and card status, inspect for oxidation or coplanarity issues, and follow IPC/JEDEC J-STD-033 bake and re-bag requirements if the lot is to be used; notify the supplier with photos and lot traceability. | ☐ |
| m01l02 | `quiz.q-m01l02-02.prompt` | Per IPC/JEDEC J-STD-033, the floor life for MSL 3 is 168 h. | ☐ |
| m01l03 | `defect.action` | Quarantine the lot, increase sample size for solderability and coplanarity checks, verify moisture sensitivity level and floor life against J-STD-033, review the feeder setup and reflow profile against your paste/equipment datasheet, and revise the incoming inspection plan if the characteristic s… | ☐ |
| m01l04 | `theory[2].p` | For moisture-sensitive devices, the package should include a moisture barrier bag, desiccant, humidity indicator card, and a moisture sensitivity level label consistent with IPC/JEDEC J-STD-033, Handling, Packing, Shipping and Use of Moisture-, Heat-, and Electrostatic-Sensitive Surface Mount Dev… | ☐ |
| m01l05 | `theory[2].p` | The moisture-sensitive device label and humidity indicator card, when used under J-STD-033, show whether the lot was packaged for moisture control and whether the indicator has changed state. | ☐ |
| m01l05 | `theory[7].p` | For moisture-sensitive components, check the packaging, humidity indicator card, and floor-life clock under J-STD-033. | ☐ |
| m01l06 | `theory[4].p` | IPC/JEDEC J-STD-033 is commonly used for handling, packing, shipping, and use of moisture-sensitive devices, and it can be referenced for moisture control practice even when the item is a bare board rather than a component. | ☐ |
| m01l06 | `theory[5].p` | For moisture-sensitive assemblies and components, IPC/JEDEC J-STD-033 provides the framework for moisture sensitivity level, floor life, and reconditioning. | ☐ |
| m01l07 | `theory[6].p` | For electronic components, moisture-sensitive device status should be recorded and verified against the device datasheet and IPC/JEDEC J-STD-033; process limits should be verified against your paste/equipment datasheet. | ☐ |
| m01l07 | `calc.solution` | Step 6: Classify the moisture indicator exceedance on 1 reel as quarantine pending MRB; verify the device datasheet and IPC/JEDEC J-STD-033 before any bake, reflow, or release decision. | ☐ |
| m02l01 | `theory[0].blocks[0].svg` | <svg viewBox='0 0 900 220' xmlns='http://www.w3.org/2000/svg' role='img' aria-label='MSL floor life lifecycle'><style>text{font-family:'IBM Plex Mono',monospace}</style><rect x='40' y='90' width='150' height='44' rx='10' fill='rgba(83,209,204,.06)' stroke='rgba(83,209,204,.35)' stroke-width='1.5'… | ☐ |
| m02l01 | `theory[0].blocks[0].caption` | Floor-life values per J-STD-033 — see table below | ☐ |
| m02l01 | `theory[3].p` | Under IPC/JEDEC J-STD-033, typical floor lives are: MSL 1 unlimited; MSL 2 12 months; MSL 3 168 h; MSL 4 72 h; MSL 5 48 h; MSL 5a 24 h; MSL 6 has no floor life and is mandatory bake before use, with the post-bake reflow window taken from the label. | ☐ |
| m02l01 | `theory[3].blocks[0].caption` | J-STD-033 floor life at <=30 C / 60% RH — TBD-REVIEW | ☐ |
| m02l01 | `theory[4].p` | The humidity indicator card threshold is card-specific and should be verified against the card datasheet and IPC/JEDEC J-STD-033. | ☐ |
| m02l01 | `theory[5].p` | Under IPC/JEDEC J-STD-033, a qualifying reflow completed within the remaining floor life resets the floor life. | ☐ |
| m02l01 | `theory[5].p` | Some programs also limit the number of reflows or require special handling after multiple reflows; verify against the package qualification, customer procedure, and IPC/JEDEC J-STD-033. | ☐ |
| m02l01 | `theory[6].p` | Bake conditions, cabinet setpoints, and reflow profiles should be verified against IPC/JEDEC J-STD-033, the package datasheet, and your paste and equipment datasheets. | ☐ |
| m02l01 | `calc.solution` | Use the IPC/JEDEC J-STD-033 floor life for MSL 3: 168 h. | ☐ |
| m02l01 | `calc.solution` | Under IPC/JEDEC J-STD-033, a qualifying reflow within the floor life resets the floor life. | ☐ |
| m02l01 | `defect.action` | Verify MSL markings, bag opening time, humidity indicator card status, desiccant condition, reflow time, and bake records against IPC/JEDEC J-STD-033. | ☐ |
| m02l01 | `quiz.q-m02l01-02.prompt` | A device marked MSL 3 was exposed for one-third of its J-STD-033 floor life, reflowed while still within floor life, and has since been exposed for one-quarter of its floor life. | ☐ |
| m02l01 | `quiz.q-m02l01-02.explanation` | MSL 3 has a J-STD-033 floor life of 168 h at 30 °C/60% RH (J-STD-020 assigns the level, J-STD-033 governs handling). | ☐ |
| m02l02 | `theory[2].p` | J-STD-033 handling practice commonly uses a moisture barrier bag with a label that identifies the MSL, floor life, date, and bake or exposure information when applicable. | ☐ |
| m02l02 | `theory[3].p` | IPC/JEDEC J-STD-033 defines floor life at reference conditions of 30 °C and 60% RH for common MSL ratings; J-STD-020 assigns the moisture sensitivity level itself. | ☐ |
| m02l02 | `theory[4].p` | J-STD-033 commonly uses a desiccant and a humidity indicator card (HIC) to show whether the bag interior is still within the intended humidity range. | ☐ |
| m02l02 | `theory[5].p` | A completed bake per J-STD-033 can restart the clock if your procedure accepts the bake record; otherwise, continue counting exposure from the original open time. | ☐ |
| m02l02 | `calc.solution` | If E has reached or passed F, the floor life expired before the second reflow; bake per J-STD-033 or your approved procedure before reflow. | ☐ |
| m02l02 | `defect.action` | Quarantine the lot, verify the MSL label, bag open time, HIC, and reflow records, bake per J-STD-033 or the manufacturer's limits, then reflow a sample and inspect. | ☐ |
| m02l02 | `quiz.q-m02l02-02.prompt` | According to J-STD-033, its floor life is 168 h. | ☐ |
| m02l02 | `quiz.q-m02l02-02.prompt` | A dry-pack log shows it was exposed for a duration equal to the J-STD-033 floor life of MSL 4, and the reflow history shows no reflow. | ☐ |
| m02l02 | `quiz.q-m02l02-02.explanation` | J-STD-033 gives MSL 3 a floor life of 168 h and MSL 4 a floor life of 72 h. | ☐ |
| m02l03 | `theory[1].p` | Floor life is the cumulative time a moisture-sensitive device may remain outside its moisture barrier bag while exposed to factory conditions that J-STD-033 treats as no more than 30°C and no more than 60%RH. | ☐ |
| m02l03 | `theory[2].p` | J-STD-033 assigns floor life values by MSL: MSL 1 has unlimited floor life under the standard's storage condition, MSL 2 is 12 months, MSL 2a is 4 weeks, MSL 3 is 168 h, MSL 4 is 72 h, MSL 5 is 48 h, MSL 5a is 24 h, and MSL 6 requires bake before use. | ☐ |
| m02l03 | `theory[4].p` | Floor life accumulates whenever the device is outside a compliant moisture barrier bag under conditions covered by J-STD-033. | ☐ |
| m02l03 | `theory[4].p` | If the storage environment is hotter or more humid than the J-STD-033 reference condition, the simple floor-life table may not be sufficient; use the device datasheet, supplier guidance, and your facility's controlled storage limits. | ☐ |
| m02l03 | `theory[5].p` | J-STD-033 allows reset after a qualifying bake performed according to the applicable bake table for the package and MSL, followed by appropriate repacking with desiccant and a humidity indicator card where required. | ☐ |
| m02l03 | `theory[5].p` | If the bake is not performed to the applicable J-STD-033 condition, or if the package has already exceeded its allowed exposure in a way that requires evaluation, the floor life should not be reset. | ☐ |
| m02l03 | `theory[6].p` | If the storage area is not controlled to the J-STD-033 reference condition, the record should show the actual conditions and the basis used for any adjustment or quarantine decision. | ☐ |
| m02l03 | `theory[7].p` | The basic calculation is: remaining floor life equals the MSL floor life from J-STD-033 minus cumulative open-air time already accumulated. | ☐ |
| m02l03 | `theory[8].p` | Verify the applicable J-STD-033 revision, the device datasheet, and your facility's controlled storage limits, because practice-based handling times and storage conditions vary by site and product. | ☐ |
| m02l03 | `calc.task` | Storage remained within the J-STD-033 reference condition of no more than 30°C and no more than 60%RH. | ☐ |
| m02l03 | `calc.solution` | J-STD-033 gives 168 h for MSL 3. | ☐ |
| m02l03 | `defect.cause` | Storage time, feeder time, and reflow handling time were not added to the cumulative exposure, so the lot was reflowed after its J-STD-033 floor life had already been consumed. | ☐ |
| m02l03 | `quiz.q-m02l03-02.prompt` | J-STD-033 gives MSL 3 a floor life of 168 h. | ☐ |
| m02l04 | `theory[2].p` | For plastic packages, IPC/JEDEC J-STD-033D assigns moisture sensitivity levels and floor life. | ☐ |
| m02l04 | `theory[3].p` | IPC/JEDEC J-STD-033D recognizes dry storage at 10% RH or less for eligible devices. | ☐ |
| m02l04 | `theory[4].p` | Use the bake table in IPC/JEDEC J-STD-033D for the package type and the component or tape datasheet. | ☐ |
| m02l04 | `theory[4].p` | Bake time in J-STD-033 is indexed to package body thickness, not to the moisture sensitivity level. | ☐ |
| m02l04 | `calc.task` | A batch of IPC/JEDEC J-STD-033D MSL 4 ICs in tape and reel was opened 50 h ago. | ☐ |
| m02l04 | `calc.solution` | Use IPC/JEDEC J-STD-033D floor life for MSL 4: 72 h. | ☐ |
| m02l04 | `calc.solution` | A tape-and-reel bake cannot exceed 40°C, and at 40°C the J-STD-033 Table 4-1 time for a body up to 1.4 mm is about 9 days, which does not fit a 30 h window. | ☐ |
| m02l04 | `calc.solution` | Either move the reflow inside the remaining floor life, suspend the clock in a qualified dry cabinet at 10% RH or less, or de-reel, bake loose parts at 125°C for 8 h and re-reel; verify the chosen route against the J-STD-033D bake table, the tape datasheet and the reflow window. | ☐ |
| m02l04 | `defect.cause` | The IPC/JEDEC J-STD-033D MSL 4 floor life was exceeded because the dry cabinet excursion was not treated as exposure; moisture in the package flashed during reflow. | ☐ |
| m02l04 | `quiz.q-m02l04-02.prompt` | The J-STD-033 Table 4-1 bake time for that body thickness is 192 h. | ☐ |
| m02l04 | `quiz.q-m02l04-02.explanation` | J-STD-033 bake time is indexed to package body thickness, not to the moisture sensitivity level: for 2.0 to 4.5 mm bodies the 90 °C column gives 192 h. | ☐ |
| m02l06 | `theory[1].p` | The clock is governed by the moisture sensitivity level assigned under IPC/JEDEC J-STD-020 and the handling rules in IPC/JEDEC J-STD-033. | ☐ |
| m02l06 | `theory[1].p` | IPC/JEDEC J-STD-033 defines floor life at reference conditions of 30 °C and 60% RH, so a hot, humid storage area can consume the clock faster than a controlled dry cabinet. | ☐ |
| m02l06 | `theory[2].p` | Compare elapsed floor life with the floor life for the device level in IPC/JEDEC J-STD-033. | ☐ |
| m02l06 | `theory[2].p` | If dry storage is used, IPC/JEDEC J-STD-033 uses a dry storage target of 5% RH or less; if the cabinet runs above that, treat the devices as exposed and recalculate floor life. | ☐ |
| m02l06 | `theory[3].p` | For moisture-sensitive devices, IPC/JEDEC J-STD-033 provides bake conditions that depend on the carrier and the maximum temperature allowed by the component. | ☐ |
| m02l06 | `theory[3].p` | For tape and reel, IPC/JEDEC J-STD-033 also provides a lower-temperature long bake at 40 °C, roughly 9 days for a body up to 1.4 mm, 11 days for 1.4 to 2.0 mm and 38 days for 2.0 to 4.5 mm, because the tape, reel, labels and cover tape cannot tolerate higher temperature. | ☐ |
| m02l06 | `theory[4].p` | After baking, store the batch in a dry cabinet at 5% RH or less under IPC/JEDEC J-STD-033, or repackage it in a moisture barrier bag with desiccant and a humidity indicator card. | ☐ |
| m02l06 | `calc.solution` | The devices are MSL3 under IPC/JEDEC J-STD-020, and the floor-life rules come from IPC/JEDEC J-STD-033. | ☐ |
| m02l06 | `calc.solution` | Step 2: Compare elapsed floor life with IPC/JEDEC J-STD-033. | ☐ |
| m02l06 | `calc.solution` | IPC/JEDEC J-STD-033 uses a dry storage target of 5% RH or less. | ☐ |
| m02l06 | `calc.solution` | If the carrier cannot withstand 125 °C, use the IPC/JEDEC J-STD-033 lower-temperature long bake at 40 °C, which is roughly 9 days for a body up to 1.4 mm and therefore does not fit a short reflow window. | ☐ |
| m02l06 | `calc.solution` | If the component and carrier datasheets allow 125 °C, the IPC/JEDEC J-STD-033 125 °C column applies only to loose parts in trays or tubes and is indexed to body thickness: 8 h up to 1.4 mm, 18 h for 1.4 to 2.0 mm, 48 h for 2.0 to 4.5 mm. | ☐ |
| m02l06 | `calc.solution` | For this case, choose the 40 °C long bake as the conservative tape-and-reel condition, or de-reel, bake the loose parts at 125 °C for the thickness-indexed time and re-reel; verify the chosen route against the J-STD-033 bake table, the tape datasheet and the reflow window. | ☐ |
| m02l06 | `calc.solution` | Store at 5% RH or less under IPC/JEDEC J-STD-033, or repackage in a moisture barrier bag with desiccant and a humidity indicator card. | ☐ |
| m02l06 | `defect.cause` | MSL3 tape and reel devices exceeded IPC/JEDEC J-STD-033 floor life, the dry cabinet ran above the 5% RH target, and the batch was fed to placement without a bake decision or traceability containment. | ☐ |
| m02l06 | `defect.action` | Bake the unreflowed devices using an IPC/JEDEC J-STD-033 condition allowed by the tape and reel carrier, then store at 5% RH or less or repackage with desiccant and a humidity indicator card. | ☐ |
| m02l06 | `quiz.q-m02l06-02.prompt` | Using J-STD-033, an MSL 3 plastic package has a floor life of 168 h at ≤30°C/60%RH. | ☐ |
| m02l06 | `quiz.q-m02l06-02.options[0].text` | One standard 24 h interval over floor life; bake remaining unplaced components at the package-specific bake condition from J-STD-033 Table 4-1, e.g., 125°C for 8 h for a body up to 1.4 mm, 18 h for 1.4-2.0 mm or 48 h for 2.0-4.5 mm, or the 40 °C long bake if the carrier cannot take 125 °C, then r… | ☐ |
| m02l06 | `quiz.q-m02l06-02.explanation` | Because cumulative exposure exceeds floor life, remaining unplaced components must be baked; the bake condition comes from J-STD-033 Table 4-1 and is indexed to package body thickness, not to the MSL number: 125°C for 8 h up to 1.4 mm, 18 h for 1.4-2.0 mm and 48 h for 2.0-4.5 mm, with the 40 °C l… | ☐ |
| m11l03 | `theory[5].p` | If the component is moisture-sensitive, follow the applicable moisture-sensitive device handling standard, IPC/JEDEC J-STD-033, and record floor-life status before rework. | ☐ |
| m12l01 | `theory[5].p` | If an assembly has been exposed beyond the floor life assigned by IPC/JEDEC J-STD-033, bake it before reflow or rework according to the applicable MSL level and product specification. | ☐ |
| m12l01 | `calc.solution` | MSL 3 requires moisture control per IPC/JEDEC J-STD-033; if floor life is exceeded, bake before rework. | ☐ |
| m12l01 | `defect.action` | Control MSL exposure per IPC/JEDEC J-STD-033 and ESD handling per ANSI/ESD S20.20 or IEC 61340-5-1. | ☐ |
| m12l02 | `theory[7].p` | Moisture sensitivity level constraints are governed by the applicable MSL classification and floor-life rules, commonly referenced through IPC/JEDEC J-STD-033. | ☐ |
| m12l02 | `calc.solution` | MSL 3 floor-life rules are governed by IPC/JEDEC J-STD-033, so the actual floor life must be taken from the component specification and the current exposure record. | ☐ |

### IPC-7711 — 83 claims

Registry entry: `src-009` — IPC-7711/7721 Rework, Modification and Repair of Electronic Assemblies

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m07l05 | `theory[6].p` | Rework and repair activities should follow IPC-7711/7721 or the customer-approved equivalent, and the finding should state whether rework is proposed or already performed. | ☐ |
| m07l05 | `calc.solution` | Use manual inspection, microscopy, or a calibrated AOI re-run; if the confirmed fillet is below the applicable IPC-A-610 Class 2 criterion and the internal minimum, reject or rework per IPC-7711/7721; if confirmed at or above the criterion, accept. | ☐ |
| m07l05 | `defect.action` | Quarantine the affected panel, verify the bridge with microscopy or X-ray if needed, adjust the printer or stencil process, rework confirmed bridges per IPC-7711/7721, then reinspect with AOI and record the disposition using the same workmanship vocabulary. | ☐ |
| m07l06 | `theory[7]` | Rework means the condition is repairable under IPC-7711/7721 or an approved repair procedure, and the board can be re-inspected. | ☐ |
| m07l06 | `calc.solution` | For the THT dull non-wetted joint, classify it as cold solder or insufficient wetting; rework per IPC-7711/7721 if the hole wall and lead are sound; reject if hole wall damage or non-repairable contamination is present; cite IPC-A-610 THT solder joint acceptability. | ☐ |
| m07l06 | `defect.action` | Quarantine the board, inspect adjacent joints, rework per IPC-7711/7721 if the hole wall and lead are sound, verify solderability and reflow profile against equipment datasheet, and update incoming inspection if contamination is confirmed. | ☐ |
| m10l01 | `theory[5].p` | IPC-A-610 acceptance should be used to confirm the joint, and IPC-7711/7721 should guide any rework. | ☐ |
| m10l01 | `theory[7].p` | If a joint fails, rework it according to IPC-7711/7721 and update the process window if the failure indicates a systematic nozzle or flux mismatch. | ☐ |
| m10l01 | `calc.solution` | Confirm acceptance against IPC-A-610 and rework any defective joint according to IPC-7711/7721. | ☐ |
| m10l01 | `defect.action` | Re-profile the joint group with a higher preheat and longer dwell, verify board surface temperature at the connector, confirm flux volume and nozzle standoff against the equipment datasheet, and rework affected joints according to IPC-7711/7721. | ☐ |
| m10l04 | `theory[7].p` | If rework is required, follow the limits and methods in IPC-7711/7721 rather than improvising additional heat cycles. | ☐ |
| m10l05 | `theory[1].p` | Use IPC-A-610 for visual acceptance, IPC-7711/7721 for rework and repair guidance, and IPC-7530 for thermal process control where applicable. | ☐ |
| m10l05 | `theory[5].p` | Use IPC-A-610 for acceptance and IPC-7711/7721 for repair guidance. | ☐ |
| m11l04 | `theory[0].blocks[0].caption` | Repair limits: IPC-7711/7721 classes, conductor cut, annular ring and laminate damage | ☐ |
| m11l04 | `theory[1].p` | This lesson covers repair limits for reworked or repaired electronic assemblies using IPC-7711/7721 Class 1, IPC-7711/7721 Class 2, and IPC-7711/7721 Class 3 acceptance criteria. | ☐ |
| m11l04 | `theory[1].p` | A Class 1 product may tolerate a cosmetic laminate scratch that would be unacceptable on a Class 3 product, so the first step is to record the required IPC-7711/7721 class before inspecting the damage. | ☐ |
| m11l04 | `theory[2].p` | A joint or board area is repairable when the damage is within the applicable IPC-7711/7721 limits, the repair method is qualified for the materials and thermal exposure, and the repaired area can be inspected and documented. | ☐ |
| m11l04 | `theory[2].p` | It is scrap when the damage violates IPC-7711/7721 acceptance, when the repair would require unqualified materials or processes, or when the residual risk cannot be accepted by the product owner. | ☐ |
| m11l04 | `theory[2].p` | The disposition record should state the measured condition, the IPC-7711/7721 class used, the repair method, and the residual risk such as thermal fatigue, insulation degradation, or mechanical weakness. | ☐ |
| m11l04 | `theory[3].p` | IPC-7711/7721 expresses the repair limit as a percentage of original width; a commonly used limit is that conductor width reduction shall not exceed 20% of original width, but the controlled revision and customer specification must be verified. | ☐ |
| m11l04 | `theory[3].p` | If the reduction exceeds the applicable IPC-7711/7721 limit, the repair is not acceptable unless the customer authorizes a deviation. | ☐ |
| m11l04 | `theory[4].p` | IPC-7711/7721 requires the repaired hole to retain a minimum annular ring; a commonly cited minimum is 0.05 mm, but the controlled revision and product specification must be checked. | ☐ |
| m11l04 | `theory[4].p` | If the measured annular ring is below the applicable IPC-7711/7721 limit, the hole is normally scrap unless a qualified repair restores the required copper geometry. | ☐ |
| m11l04 | `theory[5].p` | IPC-7711/7721 does not accept laminate damage that creates delamination, blistering, separation, or exposed conductors. | ☐ |
| m11l04 | `theory[5].p` | Where a laminate damage depth limit is specified, use the controlled IPC-7711/7721 revision and the customer specification; a commonly cited depth limit is 0.25 mm, but this must be verified. | ☐ |
| m11l04 | `theory[6].p` | A repair that meets IPC-7711/7721 geometry limits can still be rejected if the process causes blistering, delamination, solder mask lifting, component damage, or contamination that cannot be removed. | ☐ |
| m11l04 | `theory[7].p` | It should include the IPC-7711/7721 class, measured conductor width reduction, measured annular ring, laminate condition, repair method, inspection result, and residual risk. | ☐ |
| m11l04 | `calc.task` | A Class 2 assembly requires IPC-7711/7721 Class 2. | ☐ |
| m11l04 | `calc.solution` | Step 1: Confirm the required class is IPC-7711/7721 Class 2. | ☐ |
| m11l04 | `calc.solution` | Step 3: Compare with the IPC-7711/7721 conductor width reduction limit. | ☐ |
| m11l04 | `calc.solution` | If the applicable IPC-7711/7721 limit is 20%, the trace is at the limit and acceptable only if the controlled revision and customer specification allow 20% for Class 2. | ☐ |
| m11l04 | `calc.solution` | Step 4: Compare annular ring: 0.06 mm is greater than the commonly cited IPC-7711/7721 minimum of 0.05 mm, so the hole is acceptable if the controlled revision confirms 0.05 mm for Class 2. | ☐ |
| m11l04 | `calc.solution` | Step 5: Evaluate laminate damage: the scratch is 0.08 mm deep, which is less than the commonly cited IPC-7711/7721 laminate damage depth limit of 0.25 mm, and there is no delamination, blistering, separation, or exposed conductor. | ☐ |
| m11l04 | `calc.solution` | Basis: IPC-7711/7721 Class 2 conductor width reduction at or below the applicable limit, annular ring above the applicable minimum, and laminate damage without prohibited defects. | ☐ |
| m11l04 | `defect.action` | Measure the annular ring and trace width, compare them with the applicable IPC-7711/7721 class limits, and record the result. | ☐ |
| m11l04 | `defect.action` | If the annular ring or conductor width reduction is outside the IPC-7711/7721 limit, scrap the assembly or request a customer deviation. | ☐ |
| m11l04 | `quiz.q-m11l04-01.prompt` | A Class 3 product has a repaired through-hole joint where the annular ring still meets IPC-7711/7721 Class 3 minimum, laminate is not exposed, and no conductor is cut. | ☐ |
| m11l04 | `quiz.q-m11l04-01.explanation` | IPC-7711/7721 permits repair when the repaired joint meets the required class criteria, and Class 3 requires documented repair basis and residual risk. | ☐ |
| m11l04 | `quiz.q-m11l04-02.prompt` | IPC-7711/7721 repair acceptance requires the repaired annular ring to meet the IPC-A-610 Class 3 minimum of 0.05 mm. | ☐ |
| m11l05 | `theory[1].p` | IPC-7711/7721 Acceptability of Rework, Modifications, and Repairs for Electronic Assemblies provides acceptability criteria for reworked and repaired assemblies, while IPC-A-610 Acceptability of Electronic Assemblies provides the baseline visual and construction acceptability criteria for the ori… | ☐ |
| m11l05 | `theory[2].p` | IPC-7711/7721 Acceptability of Rework, Modifications, and Repairs for Electronic Assemblies is the primary standard for judging whether a reworked or repaired joint is acceptable, but the product specification may also require IPC-A-610 Acceptability of Electronic Assemblies and IPC J-STD-001 Req… | ☐ |
| m11l05 | `theory[3].p` | IPC-A-610 Acceptability of Electronic Assemblies and IPC-7711/7721 Acceptability of Rework, Modifications, and Repairs for Electronic Assemblies use class-based criteria, commonly Class 1, Class 2, and Class 3, with Class 3 generally applying to high-reliability products where defects have greate… | ☐ |
| m11l05 | `theory[4].p` | IPC-7711/7721 Acceptability of Rework, Modifications, and Repairs for Electronic Assemblies provides repairability and acceptability guidance, while IPC-A-610 Acceptability of Electronic Assemblies provides the visual acceptability baseline. | ☐ |
| m11l05 | `theory[5].p` | IPC-7711/7721 Acceptability of Rework, Modifications, and Repairs for Electronic Assemblies supports repairability decisions based on the defect type, component type, board condition, and required class. | ☐ |
| m11l05 | `theory[6].p` | IPC-7711/7721 Acceptability of Rework, Modifications, and Repairs for Electronic Assemblies supports documentation of the repair operation, but the organization's quality system should define the exact record format and approval route. | ☐ |
| m11l05 | `theory[7].p` | In practice, the inspector should first confirm the required class, then inspect the repaired area against IPC-A-610 Acceptability of Electronic Assemblies and IPC-7711/7721 Acceptability of Rework, Modifications, and Repairs for Electronic Assemblies. | ☐ |
| m11l05 | `calc.task` | The product specification requires IPC-A-610 Acceptability of Electronic Assemblies Class 3 and IPC-7711/7721 Acceptability of Rework, Modifications, and Repairs for Electronic Assemblies Class 3. | ☐ |
| m11l05 | `calc.solution` | In this case, the required class is IPC-A-610 Acceptability of Electronic Assemblies Class 3 and IPC-7711/7721 Acceptability of Rework, Modifications, and Repairs for Electronic Assemblies Class 3. | ☐ |
| m11l05 | `calc.solution` | Step 4: Compare the condition against IPC-7711/7721 Acceptability of Rework, Modifications, and Repairs for Electronic Assemblies Class 3. | ☐ |
| m11l05 | `defect.action` | Stop the repair, inspect the pad, trace, and adjacent joints, and compare the condition against IPC-A-610 Acceptability of Electronic Assemblies and IPC-7711/7721 Acceptability of Rework, Modifications, and Repairs for Electronic Assemblies. | ☐ |
| m11l05 | `quiz.q-m11l05-01.prompt` | A reworked solder joint is judged acceptable under IPC-7711/7721 Class 2 criteria. | ☐ |
| m11l05 | `quiz.q-m11l05-01.explanation` | IPC-7711/7721 acceptance is class-specific, so a Class 3 product must meet Class 3 rework or repair criteria. | ☐ |
| m11l06 | `theory[1].p` | This practice asks you to rework a solder joint, then document the operation and classify the result against IPC-7711/7721 rework and repair requirements and the acceptance class specified for the product. | ☐ |
| m11l06 | `theory[2].p` | Before touching the joint, record the allowed rework cycles, peak temperature, dwell time, preheat temperature, and cooling method from the product specification, IPC-7711/7721, and the paste, component, and equipment datasheets. | ☐ |
| m11l06 | `theory[3].p` | If damage is present, stop and evaluate a repair under IPC-7711/7721 rather than continuing rework. | ☐ |
| m11l06 | `theory[5].p` | The record should state the required IPC-A-610 class and whether the joint meets IPC-7711/7721 rework or repair acceptance for that class. | ☐ |
| m11l06 | `theory[6].p` | Inspect the joint against the relevant IPC-A-610 acceptance criteria for the required class, then confirm that the rework or repair method is acceptable under IPC-7711/7721. | ☐ |
| m11l06 | `theory[7].p` | Each failure mode should be recorded with evidence and dispositioned against IPC-7711/7721 and IPC-A-610. | ☐ |
| m11l06 | `calc.task` | Determine whether the operation is within the stated budget and what must be recorded for IPC-7711/7721 documentation. | ☐ |
| m11l06 | `calc.solution` | Record preheat 150 °C, hot-gas peak 248 °C for 8 s, iron tip 350 °C for 2 s, total cycles 2, materials used, inspection result, IPC-7711/7721 rework acceptance, and the required IPC-A-610 Class 2 disposition. | ☐ |
| m11l06 | `defect.action` | Stop further rework, quarantine the assembly, and evaluate the condition under IPC-7711/7721. | ☐ |
| m11l06 | `quiz.q-m11l06-01.prompt` | A joint needs rework on an assembly that must meet IPC-7711/7721 class criteria. | ☐ |
| m11l06 | `quiz.q-m11l06-01.options[0].text` | Perform the rework only if the remaining allowed cycles and thermal budget are sufficient, then record the method, thermal exposure, cycles used, and the IPC-7711/7721 class criteria applied. | ☐ |
| m11l06 | `quiz.q-m11l06-01.options[3].text` | Any reworked joint automatically meets the product's IPC-7711/7721 class if it passes electrical test. | ☐ |
| m11l06 | `quiz.q-m11l06-01.explanation` | Correct because IPC-7711/7721 rework acceptance is process-controlled: the remaining cycle count and thermal budget must be checked before rework, and the record must show what was applied and which class criteria were used. | ☐ |
| m11l06 | `quiz.q-m11l06-02.prompt` | Using the lesson's rule of thumb for IPC-7711/7721 Class 2 (allowed thermal budget = two units; one rework cycle consumes one unit), a Class 2 joint has already consumed one unit. | ☐ |
| m12l01 | `theory[6].p` | If rework requires component rework, follow IPC-7711/7721 and re-evaluate MSL exposure. | ☐ |
| m12l01 | `defect.action` | If component rework is needed, follow IPC-7711/7721. | ☐ |
| m12l04 | `theory[7].p` | IPC-7711/7721 provides guidance for rework and repair, and the selected coating removal method should be qualified against the board finish, component package, and solder alloy. | ☐ |
| m12l04 | `theory[8].p` | Finally, verify the selected coating against IPC-CC-830 qualification data, IPC-A-610 inspection requirements, IPC-7711/7721 rework guidance, and the assembly cleaning process. | ☐ |
| m12l04 | `calc.solution` | Removal is checked against IPC-7711/7721 guidance for damage to pads, solder joints, and adjacent components. | ☐ |
| m12l04 | `calc.solution` | The selected strategy is urethane coating at 50 micrometers nominal, masked from the gold-plated edge connector with a 1.0 mm boundary margin, applied by selective coating, and qualified for rework according to IPC-7711/7721. | ☐ |
| m12l04 | `defect.action` | Remove the coating from the affected area using a qualified rework method that does not damage the pads or adjacent components, following IPC-7711/7721 guidance. | ☐ |
| m12l05 | `theory[7].p` | For rework and repair, follow IPC-7711 and IPC-7721 guidance for acceptable rework and repair methods, including preheat, temperature control, and post-rework inspection. | ☐ |
| m12l05 | `defect.action` | Remove the assembly from the line and clean or replace affected connectors according to IPC-7711 and IPC-7721 rework and repair guidance. | ☐ |
| m14l01 | `theory[2].p` | For visual and workmanship decisions, IPC-A-610 provides acceptance criteria for electronic assemblies, and IPC-7711/7721 provides guidance for rework and repair. | ☐ |
| m14l01 | `theory[5].p` | Verify actual parameter ranges against your paste datasheet, stencil design, printer datasheet, oven profile, wave or selective solder machine datasheet, and IPC-7525, IPC-7526, IPC-7530, or IPC-7711/7721 guidance where applicable. | ☐ |
| m14l03 | `theory[7].p` | Rework should follow IPC-7711/7721 and be documented. | ☐ |
| m14l03 | `calc.solution` | Corrective action: verify flux density, preheat temperature, conveyor speed, and solder pot temperature against your equipment datasheet; rework per IPC-7711/7721; add an initial-article check after changeover. | ☐ |
| m14l03 | `defect.action` | Quarantine product back to the last verified good inspection, rework per IPC-7711/7721, adjust flux density and preheat within the equipment datasheet range, and add an initial-article check after each changeover. | ☐ |
| m14l06 | `theory[7].p` | IPC-7711/7721 Rework, Modification and Repair of Electronic Assemblies provides guidance for rework and repair methods. | ☐ |
| m15l03 | `theory[6].p` | For rework and repair limits, cite IPC-7711/7721. | ☐ |
| m15l05 | `theory[3].p` | Use IPC-7711/7721 for rework and repair limits only when discussing repairability, not as a substitute for design change data. | ☐ |

### J-STD-020 — 45 claims

Registry entry: `src-005` — J-STD-020 Classification of Moisture Sensitivity for Non-Hermetic Sealing Solid State Surface Mount Devices

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m02l01 | `quiz.q-m02l01-02.explanation` | MSL 3 has a J-STD-033 floor life of 168 h at 30 °C/60% RH (J-STD-020 assigns the level, J-STD-033 governs handling). | ☐ |
| m02l02 | `theory[1].p` | J-STD-020 classifies non-hermetic surface mount devices by moisture sensitivity level (MSL). | ☐ |
| m02l02 | `theory[1].p` | Read the MSL code from the supplier label, bag, or device marking, then use the matching floor-life rule from J-STD-020 or the label. | ☐ |
| m02l02 | `theory[3].p` | IPC/JEDEC J-STD-033 defines floor life at reference conditions of 30 °C and 60% RH for common MSL ratings; J-STD-020 assigns the moisture sensitivity level itself. | ☐ |
| m02l02 | `theory[3].p` | Use the value printed on the label when it is more restrictive, and verify the current revision of J-STD-020 because tables can be updated. | ☐ |
| m02l02 | `theory[7].p` | To determine remaining floor life, combine the MSL rating, the floor-life value from J-STD-020 or the label, the bag open date and time, the HIC condition, and the reflow or bake records. | ☐ |
| m02l02 | `calc.task` | A bag label states MSL 3 with a floor life of 168 h per J-STD-020. | ☐ |
| m02l02 | `calc.solution` | Confirm the floor life F from the label or J-STD-020; here F = 168 h. | ☐ |
| m02l06 | `theory[1].p` | The clock is governed by the moisture sensitivity level assigned under IPC/JEDEC J-STD-020 and the handling rules in IPC/JEDEC J-STD-033. | ☐ |
| m02l06 | `theory[2].p` | If the device is classified as the lowest moisture sensitivity level under IPC/JEDEC J-STD-020, baking is usually not required unless contamination, handling damage, or a customer requirement says otherwise. | ☐ |
| m02l06 | `calc.solution` | The devices are MSL3 under IPC/JEDEC J-STD-020, and the floor-life rules come from IPC/JEDEC J-STD-033. | ☐ |
| m06l01 | `theory[2].p` | The time-above-liquidus window is process guidance rather than a J-STD-020 parameter: IPC-7530 and the paste datasheet typically call for 60-150 s for many assemblies. | ☐ |
| m06l01 | `theory[2].p` | J-STD-020 has its own time figure, tp, which is the time within 5 °C of the classification temperature and is limited to 30 s on the Pb-free profile (20 s for SnPb); it is a package qualification parameter, not the paste window used to run a board. | ☐ |
| m06l01 | `theory[3].p` | For SAC305, J-STD-020 does not give one peak temperature: it gives classification temperatures by package size, 260 °C for small packages, 250 °C for large packages and 245 °C for very large packages at 1.6-2.5 mm thickness (the full J-STD-020 table is thickness x volume: below 1.6 mm every volum… | ☐ |
| m06l01 | `theory[6].h` | Judging against J-STD-020 | ☐ |
| m06l01 | `theory[6].p` | To judge a measured profile, compare the measured peak against the J-STD-020 classification temperature for the package size, and the measured time above liquidus against the paste-datasheet window, typically 60-150 s under IPC-7530 guidance. | ☐ |
| m06l01 | `theory[6].p` | Moisture sensitivity level, floor life, and bake requirements from J-STD-020 also affect whether the component can tolerate the reflow exposure. | ☐ |
| m06l01 | `calc.task` | The target is to stay within the J-STD-020 classification temperature for the package size and a time above liquidus of 60-150 s from the paste datasheet. | ☐ |
| m06l01 | `calc.solution` | Compare peak 242 °C with the J-STD-020 classification temperature for the package size: 242 °C passes for a small package (260 °C) or a large package (250 °C) and would fail for a very large package (245 °C), so confirm the package size before disposition. | ☐ |
| m06l01 | `calc.solution` | This window is IPC-7530 and datasheet guidance, not a J-STD-020 parameter. | ☐ |
| m06l01 | `calc.solution` | The J-STD-020 classification ramp-down limit is 6 °C/s or less. | ☐ |
| m06l02 | `theory[2].p` | IPC J-STD-020 gives moisture sensitivity level (MSL) related preheat guidance for components, not a universal ramp rate for the whole profile. | ☐ |
| m06l02 | `theory[4].p` | J-STD-020 does not set a board-assembly TAL limit: its own time parameter is tp, the time within 5 °C of the classification temperature, limited to 30 s, and its peak figures are classification temperatures by package thickness and volume, not by size alone: 260 °C for a thin package at any volum… | ☐ |
| m06l02 | `theory[5].p` | Peak temperature is usually set 10 to 25 °C above liquidus for common alloys, but the governing limit is the component's rated peak temperature from its datasheet or IPC J-STD-020. | ☐ |
| m06l02 | `theory[7].p` | Always measure with thermocouples on the actual product, not just a test coupon, and compare the measured ramp, soak, TAL, peak, and cooling against the TAL window from your paste datasheet and the J-STD-020 classification temperature for the package size, which is the peak ceiling. | ☐ |
| m06l02 | `calc.task` | Check against the J-STD-020 classification temperature for the package size and typical paste guidance. | ☐ |
| m06l02 | `calc.solution` | J-STD-020 sets classification temperatures by package size — 260 °C small, 250 °C large, 245 °C very large (1.6-2.5 mm row; above 2.5 mm thickness the limits fall to 250 °C small and 245 °C large and very large). | ☐ |
| m06l02 | `calc.solution` | J-STD-020 does not set a board-assembly time-above-liquidus limit; its 30 s figure is tp, the time within 5 °C of the classification temperature. | ☐ |
| m06l02 | `calc.solution` | Typical practice is 1 to 4 °C/s; this is within range, and the J-STD-020 classification ramp-down limit is 6 °C/s or less. | ☐ |
| m06l02 | `quiz.q-m06l02-02.prompt` | Using the lesson's rule-of-thumb limits (ramp 1-3 °C/s, time above liquidus 60-120 s from the paste datasheet, and peak not above the J-STD-020 classification temperature of 250 °C for a large package), a measured profile for SAC305 ramps from 150 °C to liquidus in 30 s, crosses liquidus upward a… | ☐ |
| m06l02 | `quiz.q-m06l02-02.explanation` | Re-verify if the package size changes, because the classification temperature is 260 °C for small packages and 245 °C for very large ones, and remember that the 30 s figure in J-STD-020 is tp, the time within 5 °C of the classification temperature, not the paste-window time above liquidus. | ☐ |
| m06l03 | `theory[5].p` | For component qualification, peak-temperature limits are often referenced to IPC/JEDEC J-STD-020, but the component datasheet and the applicable moisture sensitivity level control the final limit. | ☐ |
| m06l03 | `quiz.q-m06l03-02.prompt` | Using the J-STD-020 classification temperatures for SAC305 (260 °C small package, 250 °C large package, 245 °C very large package) and the lesson formula minimum margin = min(classification temperature − hottest measured, coolest measured − liquidus), a survey records a coolest part peak of 246 °… | ☐ |
| m06l04 | `theory[6].p` | The average ramp-up of 1-3 °C/s and the 60-150 s time-above-liquidus window come from IPC-7530 and the paste datasheet, not from J-STD-020. | ☐ |
| m06l04 | `theory[6].p` | J-STD-020 supplies the classification temperatures that bound the peak: 260 °C for small packages, 250 °C for large packages and 245 °C for very large packages at 1.6-2.5 mm thickness (the full J-STD-020 table is thickness x volume: below 1.6 mm every volume is 260 °C, and above 2.5 mm the limits… | ☐ |
| m06l04 | `calc.task` | The component limit is the J-STD-020 classification temperature for the package size. | ☐ |
| m06l04 | `calc.solution` | Apply limits: ramp 1-3 °C/s and time above liquidus 60-150 s from IPC-7530 and the paste datasheet; the peak ceiling is the J-STD-020 classification temperature for the package size, 250 °C for a large package. | ☐ |
| m06l04 | `quiz.q-m06l04-02.prompt` | For a SAC305 board, the cited process guidance gives a maximum ramp rate of 4 °C/s, a liquidus of 219 °C, a J-STD-020 classification temperature of 250 °C for a large package, and a minimum time above liquidus of 60 s. | ☐ |
| m06l05 | `theory[1].p` | These values come from the alloy and paste datasheet, not from J-STD-020, which supplies classification temperatures rather than alloy melting data. | ☐ |
| m06l05 | `theory[2].p` | SnPb profiles usually use a lower peak because the J-STD-020 classification temperature for SnPb eutectic is 220 C, while SAC305 profiles use a higher peak because the SAC305 classification temperatures are 260 C for small packages, 250 C for large packages and 245 C for very large packages. | ☐ |
| m06l05 | `theory[5].p` | A SnAgCu peak of 245 C may be acceptable if the measured board temperature stays below the J-STD-020 classification temperature for the package size (260 C small, 250 C large, 245 C very large (1.6-2.5 mm row; above 2.5 mm thickness the limits fall to 250 C small and 245 C large and very large)) … | ☐ |
| m06l05 | `theory[7].p` | Compare the measured values with IPC-7530B guidance and IPC/JEDEC J-STD-020 classification limits, then adjust zones until the coldest joint meets wetting requirements without exceeding the hottest joint limit. | ☐ |
| m06l05 | `calc.task` | Build the expected ramp from thermal mass and check ramp, time above liquidus, and peak against IPC-7530B guidance and IPC/JEDEC J-STD-020 limits. | ☐ |
| m06l05 | `calc.solution` | Check peak against the J-STD-020 classification temperature for the package size (260 C small, 250 C large, 245 C very large (1.6-2.5 mm row; above 2.5 mm thickness the limits fall to 250 C small and 245 C large and very large)): measured 245 C is below the limit for small and large packages and … | ☐ |
| m06l06 | `quiz.q-m06l06-02.explanation` | Note that time above liquidus is a measured profile quantity from IPC-7530 and the paste datasheet, not a J-STD-020 parameter. | ☐ |

### IPC-7525 — 44 claims

Registry entry: `src-004` — IPC-7525C Stencil Design Guidelines (stencil design guidance: area ratio, aspect ratio, aperture sizing)

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m03l01 | `theory[1].p` | IPC-7525 stencil design guidelines are commonly referenced for release indicators; a common working target is an area ratio above about 0.66, but verify against your paste and equipment datasheet. | ☐ |
| m03l01 | `theory[2].p` | IPC-7525 stencil design guidelines are commonly referenced for release indicators; a common working target is an aspect ratio above about 1.5, but verify against your paste and equipment datasheet. | ☐ |
| m03l01 | `calc.task` | State whether release is adequate using the IPC-7525 release indicators. | ☐ |
| m03l03 | `theory[2].p` | Area ratio is aperture area divided by the product of aperture perimeter and foil thickness; IPC-7525 commonly uses a minimum area ratio of 0.66 for reliable paste release. | ☐ |
| m03l03 | `theory[2].p` | Aspect ratio is aperture width divided by foil thickness; IPC-7525 commonly uses a minimum aspect ratio of 1.5. | ☐ |
| m03l03 | `theory[7].p` | A practical sequence is: identify the tightest pitch and paste-volume requirements; choose a base foil thickness; size apertures to meet IPC-7525 area-ratio and aspect-ratio guidelines while controlling paste volume; add a step only when a single thickness cannot meet fine-pitch and large-pad nee… | ☐ |
| m03l03 | `calc.task` | Select a base foil thickness and aperture size for the fine-pitch pads, select a local step thickness for the thermal pad, and check the IPC-7525 area-ratio and aspect-ratio guidelines. | ☐ |
| m03l03 | `calc.solution` | This is above the IPC-7525 guideline of 0.66. | ☐ |
| m03l03 | `calc.solution` | This is above the IPC-7525 guideline of 1.5. | ☐ |
| m03l03 | `calc.solution` | Check the thermal pad area ratio: area = 0.95 mm x 0.95 mm = 0.9025 mm^2; perimeter = 3.80 mm; area ratio = 0.9025 mm^2 / (3.80 mm x 0.150 mm) = 1.58, above the IPC-7525 guideline of 0.66. | ☐ |
| m03l03 | `calc.solution` | Aspect ratio = 0.95 mm / 0.150 mm = 6.33, above the IPC-7525 guideline of 1.5. | ☐ |
| m03l03 | `defect.action` | Recheck area ratio and aspect ratio against IPC-7525, request a smoother wall finish or verified taper from the stencil maker, and rerun SPI to confirm the change. | ☐ |
| m03l03 | `quiz.q-m03l03-02.prompt` | Using IPC-7525 area-ratio guidance, a square aperture is specified as 0.40 mm on a side with 0.12 mm foil. | ☐ |
| m03l03 | `quiz.q-m03l03-02.options[0].text` | 0.83, acceptable because it is above the IPC-7525 minimum area ratio. | ☐ |
| m03l03 | `quiz.q-m03l03-02.options[1].text` | 0.66, acceptable because it equals the IPC-7525 minimum area ratio. | ☐ |
| m03l03 | `quiz.q-m03l03-02.options[3].text` | 0.42, unacceptable because it is below the IPC-7525 minimum area ratio. | ☐ |
| m03l03 | `quiz.q-m03l03-02.explanation` | This is above the IPC-7525 minimum area ratio, so the aperture is acceptable for paste release; the other values result from misapplying the formula or confusing the calculated ratio with the minimum threshold. | ☐ |
| m03l04 | `theory[1].p` | IPC-7525 provides stencil design guidance for thickness, aperture area, and sidewall finish. | ☐ |
| m03l04 | `theory[2].p` | For the smallest chip components, aperture width may be 0.10 mm to 0.15 mm and length 0.20 mm to 0.30 mm, but final values should be verified against IPC-7525, land pattern data from IPC-7351, and paste release behavior. | ☐ |
| m03l04 | `theory[3].p` | Area ratio, defined as aperture opening area divided by aperture wall area, is a useful control; IPC-7525 discusses area-ratio effects on paste release. | ☐ |
| m03l04 | `theory[3].p` | For pitches below 0.5 mm, reduce aperture width relative to pad width, use trapezoidal or rounded apertures, and verify against IPC-7525 and paste datasheet to prevent bridging. | ☐ |
| m03l04 | `theory[4].p` | A common approach is to divide the thermal pad into multiple small apertures with 0.10 mm to 0.20 mm spacing between segments, or to use a reduced-area pattern, and verify against IPC-7525 and the package land pattern guidance in IPC-7351. | ☐ |
| m03l04 | `theory[6].p` | When the board contains both fine-pitch and large components, consider a step stencil or local thickness change, and verify the transition location against IPC-7525 and stencil fabrication capability. | ☐ |
| m03l04 | `calc.solution` | Use IPC-7525 area-ratio guidance and choose a thin foil, 0.10 mm, to reduce paste volume and bridging risk. | ☐ |
| m03l04 | `calc.solution` | This is above the practical target of 0.66 associated with IPC-7525 area-ratio guidance, so release should be acceptable if sidewall finish and paste viscosity are verified. | ☐ |
| m03l04 | `defect.action` | Reduce foil to 0.10 mm, reduce aperture width to 0.22 mm, use rounded or trapezoidal apertures, verify area ratio of at least 0.66 against IPC-7525, adjust paste viscosity and squeegee pressure, re-run first article and inspect per IPC-A-610. | ☐ |
| m03l04 | `quiz.q-m03l04-02.explanation` | With d = 3t, area ratio = 3t/(4t) = 0.75, which exceeds the IPC-7525 minimum of 0.66. | ☐ |
| m03l06 | `quiz.q-m03l06-02.prompt` | The issued specification adopts the IPC-7525 minimum area ratio. | ☐ |
| m03l06 | `quiz.q-m03l06-02.explanation` | The current area is 1.98 - 0.88 = 1.10 x perimeter x thickness, giving an area ratio of 1.10, which is above the IPC-7525 minimum, so the stencil remains in service. | ☐ |
| m04l01 | `theory[2].p` | IPC-7525 stencil design guidelines commonly use an area ratio target of 0.66 or higher for good paste release. | ☐ |
| m04l01 | `theory[3].p` | IPC-7525 stencil design guidelines commonly use an aspect ratio target of 1.5 or higher. | ☐ |
| m04l01 | `theory[7].p` | If either value is below the IPC-7525 guideline, adjust the aperture size within the pad boundary or reduce foil thickness. | ☐ |
| m04l01 | `calc.task` | If the area ratio is low, specify a foil thickness that meets IPC-7525 release targets while keeping paste volume practical. | ☐ |
| m04l01 | `calc.solution` | Step eight: compare with IPC-7525 stencil design guidelines. | ☐ |
| m04l01 | `defect.cause` | The aperture area reduction combined with 0.12 mm foil produced an area ratio below the IPC-7525 guideline of 0.66, reducing paste release from the aperture. | ☐ |
| m04l01 | `defect.action` | Recalculate area ratio and aspect ratio, confirm they meet IPC-7525 targets of 0.66 and 1.5, and verify with paste inspection and reflow cross-sections. | ☐ |
| m04l02 | `theory[2].p` | IPC-7525 provides stencil design guidance for area ratio and related aperture behaviour, and low area ratio apertures may need modified paste, stencil, or printer settings. | ☐ |
| m05l06 | `theory[8].p` | IPC-7525 and related stencil guidance can be used to evaluate paste print capability, but exact stencil aperture and paste volume targets should be verified against your paste, stencil, and printer datasheets. | ☐ |
| m07l01 | `theory[6].p` | Acceptance should follow the customer-specified IPC-A-610 Acceptability Requirements for Electronic Assemblies class and relevant design guidance such as IPC-7351 Land Pattern Design Data Standard for Surface Mount and IPC-7525 Stencil Design Guidelines. | ☐ |
| m07l01 | `defect.cause` | Land pattern and stencil design may not match IPC-7351 Land Pattern Design Data Standard for Surface Mount and IPC-7525 Stencil Design Guidelines. | ☐ |
| m07l01 | `defect.action` | Review stencil aperture area ratio, paste type, print pressure, squeegee speed, and reflow profile against IPC-7525 Stencil Design Guidelines and IPC-7095 Design and Assembly Process Implementation for BGAs. | ☐ |
| m14l01 | `theory[5].p` | Verify actual parameter ranges against your paste datasheet, stencil design, printer datasheet, oven profile, wave or selective solder machine datasheet, and IPC-7525, IPC-7526, IPC-7530, or IPC-7711/7721 guidance where applicable. | ☐ |
| m14l01 | `defect.action` | If the corrected paste print Pareto rises, review stencil condition, aperture design, paste rheology, squeegee settings, and SPI data against IPC-7525, IPC-7526, and IPC-7530 guidance and your equipment datasheets. | ☐ |
| m15l04 | `theory[2].p` | Land pattern design can be framed with IPC-7351, while paste aperture changes should be checked against IPC-7525 and verified with your paste and printer datasheet. | ☐ |

### J-STD-001 — 20 claims

Registry entry: `src-002` — J-STD-001 Requirements for Soldered Electrical and Electronic Assemblies

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m09l02 | `theory[7].p` | IPC J-STD-001 and IPC-A-610 provide acceptance criteria for soldered assemblies; use them with your internal limits for flux residue and cleaning. | ☐ |
| m10l01 | `theory[4].p` | If the neighbour is a plastic connector, electrolytic capacitor, or small-signal device, verify its maximum temperature and time against the component datasheet and IPC J-STD-001 guidance for thermal exposure. | ☐ |
| m10l01 | `theory[7].p` | For acceptance, use the agreed IPC-A-610 class and the relevant IPC J-STD-001 requirements for materials and workmanship. | ☐ |
| m11l01 | `theory[0].p` | IPC J-STD-001 expects workmanship that does not damage the base material, so the station must be controlled, clean, and grounded. | ☐ |
| m11l01 | `theory[3].p` | IPC J-STD-001 requires joints to be mechanically sound and wetted without excessive heat damage, so the budget should be validated on scrap or test coupons. | ☐ |
| m11l01 | `theory[6].p` | IPC-A-610 provides visual acceptance criteria for electronic assemblies, while IPC J-STD-001 covers workmanship and repair practices. | ☐ |
| m11l01 | `calc.solution` | Step 8: Inspect the joint for wetting, fillet, lifted pad, and laminate damage, using IPC-A-610 and IPC J-STD-001 as the workmanship references. | ☐ |
| m11l01 | `defect.action` | If laminate damage is visible, reject or rework according to IPC J-STD-001 and record the corrected thermal budget. | ☐ |
| m11l03 | `theory[3].p` | IPC J-STD-001 provides general soldering requirements; apply the qualified method and record the material used. | ☐ |
| m11l05 | `theory[1].p` | IPC J-STD-001 Requirements for Soldered Electronic Assemblies supports the process requirements for materials, cleanliness, solderability, and thermal stress. | ☐ |
| m11l05 | `theory[2].p` | IPC-7711/7721 Acceptability of Rework, Modifications, and Repairs for Electronic Assemblies is the primary standard for judging whether a reworked or repaired joint is acceptable, but the product specification may also require IPC-A-610 Acceptability of Electronic Assemblies and IPC J-STD-001 Req… | ☐ |
| m11l05 | `theory[5].p` | IPC J-STD-001 Requirements for Soldered Electronic Assemblies supports the process controls needed to avoid introducing new defects during the repair. | ☐ |
| m12l01 | `theory[1].p` | ROSE tests measure soluble ionic contamination as sodium chloride equivalent, usually using IPC-TM-650 methods and cleanliness requirements referenced by IPC J-STD-001. | ☐ |
| m12l01 | `theory[6].p` | The criterion may come from IPC J-STD-001, a customer specification, a product reliability plan, or an IPC-TM-650 test method applied to a coupon or assembly. | ☐ |
| m12l03 | `theory[8].p` | The most widely used reference value is 1.56 microgram NaCl equivalent per square centimeter, reported per IPC-TM-650 method 2.3.25 (ROSE) and historically applied to assembled boards through IPC J-STD-001 and to bare boards through IPC-6012. | ☐ |
| m12l03 | `theory[8].p` | Second, the current revision of J-STD-001 has moved away from a single fixed limit towards objective evidence: the assembly must be demonstrably clean enough for its intended life and environment, and the limit is then set and justified for that specific process and product rather than copied fro… | ☐ |
| m12l06 | `quiz.q-m12l06-02.explanation` | J-STD-001 no longer treats a single ROSE number as a pass/fail criterion for every product: it requires objective evidence, normally SIR data, that the specific process is clean enough for the intended life and environment, and high-reliability customers often work tighter than 1.56 µg/cm². | ☐ |
| m14l02 | `theory[7].p` | Avoid absolute language; standards and contracts may allow exceptions, so record the applicable IPC-A-610 class, IPC/JEDEC J-STD-001 requirements, and any approved deviation. | ☐ |
| m14l03 | `theory[7].p` | Soldering acceptance should be checked against IPC-A-610 and IPC/JEDEC J-STD-001 where applicable. | ☐ |
| m15l03 | `theory[6].p` | For soldering process qualification, cite IPC J-STD-001. | ☐ |

### IPC-6012 — 17 claims

Registry entry: `src-018` — IPC-6012 Qualification and Performance Specification for Rigid Printed Boards (qualification and performance requirements for bare boards)

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m01l02 | `theory[3].p` | For bare PCBs, a CoC or CoA may prove laminate material, copper weight, plating type, plating thickness, and acceptance against IPC-A-600 or IPC-6012, depending on the contract. | ☐ |
| m01l02 | `theory[6].p` | Acceptance may be referenced to IPC-A-600 for visual and dimensional criteria, while IPC-6012 may be used for qualification and performance requirements. | ☐ |
| m01l04 | `theory[4].p` | A typical package includes a packing list, certificate of conformance, and, when required by contract, qualification or performance evidence against IPC-6012, Qualification and Performance Specification for Rigid Printed Boards. | ☐ |
| m01l06 | `theory[2].p` | For plated finishes, a report may cite IPC-4101 for base material and finish requirements and IPC-6012 for qualified product performance. | ☐ |
| m01l06 | `theory[2].p` | For solderability, IPC/JEDEC J-STD-002 can be used for component solderability, while bare board solderability is commonly specified against IPC-6012 and the customer drawing. | ☐ |
| m01l06 | `theory[3].p` | Planarity and warpage are usually specified on the board drawing or in IPC-6012, which gives acceptance limits for flatness and twist depending on board class and whether the board is rectangular or irregular. | ☐ |
| m01l06 | `theory[3].p` | For fine-pitch components, press-fit connectors, or large area arrays, the assembly process may require tighter limits than the generic IPC-6012 limits. | ☐ |
| m01l06 | `theory[7].p` | For example, instead of writing “boards are bent,” write “Lot 4471, 12 of 250 boards measured with twist above the drawing limit of IPC-6012 Class 3; requested action: return affected boards, provide root cause, and submit corrected flatness data for the next three lots.” This format gives the su… | ☐ |
| m01l06 | `calc.task` | A lot of 500 bare PCBs is received with a drawing requirement that the surface finish be organic solderability preservative and that flatness meet IPC-6012 Class 3. | ☐ |
| m01l06 | `calc.solution` | The purchase order requires organic solderability preservative finish, IPC-6012 Class 3 flatness, intact moisture barrier packaging, and a certificate of conformance. | ☐ |
| m01l06 | `calc.solution` | State purchase order, lot identifier, quantity received, quantity affected, measured result, IPC-6012 Class 3 reference, packaging failure, missing certificate of conformance, and requested actions: return or disposition the 18 boards, provide root cause for flatness, provide corrected flatness d… | ☐ |
| m01l06 | `quiz.q-m01l06-02.prompt` | IPC-6012 Class 3 bow/twist limit is 0.75% of the longer dimension. | ☐ |
| m01l06 | `quiz.q-m01l06-02.options[0].text` | 0.80%; reject because it exceeds the IPC-6012 Class 3 limit | ☐ |
| m01l06 | `quiz.q-m01l06-02.options[1].text` | 0.75%; accept because it meets the IPC-6012 Class 3 limit | ☐ |
| m01l06 | `quiz.q-m01l06-02.options[2].text` | 1.50%; quarantine because it is within the IPC-6012 Class 2 limit | ☐ |
| m01l06 | `quiz.q-m01l06-02.explanation` | IPC-6012 Class 3 allows 0.75%, so 0.8% exceeds the limit and the finding should be recorded as reject. | ☐ |
| m12l03 | `theory[8].p` | The most widely used reference value is 1.56 microgram NaCl equivalent per square centimeter, reported per IPC-TM-650 method 2.3.25 (ROSE) and historically applied to assembled boards through IPC J-STD-001 and to bare boards through IPC-6012. | ☐ |

### IPC-7530 — 17 claims

Registry entry: `src-008` — IPC-7530 Guidelines for Temperature Profiling for Mass Soldering Processes

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m06l01 | `theory[2].p` | The time-above-liquidus window is process guidance rather than a J-STD-020 parameter: IPC-7530 and the paste datasheet typically call for 60-150 s for many assemblies. | ☐ |
| m06l01 | `theory[6].p` | To judge a measured profile, compare the measured peak against the J-STD-020 classification temperature for the package size, and the measured time above liquidus against the paste-datasheet window, typically 60-150 s under IPC-7530 guidance. | ☐ |
| m06l01 | `calc.solution` | This window is IPC-7530 and datasheet guidance, not a J-STD-020 parameter. | ☐ |
| m06l02 | `theory[4].p` | The TAL window is process guidance from IPC-7530 and the paste datasheet, typically 60-120 s or 60-150 s. | ☐ |
| m06l02 | `calc.solution` | The applicable limit is the paste window of 60-120 s from the paste datasheet and IPC-7530 guidance, and 45 s is 15 s below the lower bound, so the profile is too short for reliable wetting rather than too long. | ☐ |
| m06l04 | `theory[6].p` | The average ramp-up of 1-3 °C/s and the 60-150 s time-above-liquidus window come from IPC-7530 and the paste datasheet, not from J-STD-020. | ☐ |
| m06l04 | `calc.solution` | Apply limits: ramp 1-3 °C/s and time above liquidus 60-150 s from IPC-7530 and the paste datasheet; the peak ceiling is the J-STD-020 classification temperature for the package size, 250 °C for a large package. | ☐ |
| m06l06 | `quiz.q-m06l06-02.explanation` | Note that time above liquidus is a measured profile quantity from IPC-7530 and the paste datasheet, not a J-STD-020 parameter. | ☐ |
| m09l01 | `theory[1].p` | Use thermocouples on heavy ground planes and small pads, and follow IPC-7530 for profiling. | ☐ |
| m09l03 | `theory[4].p` | Use a thermocouple profile consistent with IPC-7530 guidance and adjust until hole fill and wetting are stable. | ☐ |
| m10l05 | `theory[1].p` | Use IPC-A-610 for visual acceptance, IPC-7711/7721 for rework and repair guidance, and IPC-7530 for thermal process control where applicable. | ☐ |
| m11l03 | `theory[4].p` | IPC-7530 provides guidance for rework, modification, and repair; use it with your process qualification and work instruction. | ☐ |
| m14l01 | `theory[5].p` | Verify actual parameter ranges against your paste datasheet, stencil design, printer datasheet, oven profile, wave or selective solder machine datasheet, and IPC-7525, IPC-7526, IPC-7530, or IPC-7711/7721 guidance where applicable. | ☐ |
| m14l01 | `defect.action` | If the corrected paste print Pareto rises, review stencil condition, aperture design, paste rheology, squeegee settings, and SPI data against IPC-7525, IPC-7526, and IPC-7530 guidance and your equipment datasheets. | ☐ |
| m14l06 | `theory[2].p` | For example, a change in peak reflow temperature or dwell time above the liquidus can affect solder joint microstructure and should be reviewed against the paste and component datasheets and against IPC-7530 Guidelines for Convection Reflow Soldering where applicable. | ☐ |
| m14l06 | `defect.action` | Requalify the stencil aperture and reflow profile using the new paste datasheet and verify against IPC-7530 Guidelines for Convection Reflow Soldering where applicable. | ☐ |
| m15l05 | `theory[1].p` | Include the current controlled documents: drawing revision, IPC-7351 land pattern revision, stencil thickness, paste type, feeder map, AOI program, and IPC-7530 reflow profile. | ☐ |

### IPC-CC-830 — 15 claims

Registry entry: `src-010` — IPC-CC-830 Qualification and Performance of Electrical Insulating Compound for Conformal Coating

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m12l01 | `theory[6].blocks[0].caption` | Coating chemistries (IPC-CC-830 type families) | ☐ |
| m12l04 | `theory[2].p` | Typical dry-film thickness is often in the range of 25 to 75 micrometers, but the target should be verified against the coating datasheet and the IPC-CC-830 qualification for the specific product. | ☐ |
| m12l04 | `theory[3].p` | Typical dry-film thickness may be around 25 to 100 micrometers depending on the product and application method, but the process window should be verified against the coating datasheet and IPC-CC-830 test data. | ☐ |
| m12l04 | `theory[4].p` | Typical dry-film thickness is often around 25 to 100 micrometers, but the exact range should be verified against the coating datasheet and IPC-CC-830 qualification. | ☐ |
| m12l04 | `theory[5].p` | Typical thicknesses are often in the range of 1 to 25 micrometers, with many applications using 5 to 15 micrometers, but the required thickness should be verified against the coating specification and IPC-CC-830 or equivalent qualification data. | ☐ |
| m12l04 | `theory[6].p` | Typical dry-film thickness may be around 25 to 75 micrometers, but the process should be verified against the coating datasheet and IPC-CC-830 qualification. | ☐ |
| m12l04 | `theory[8].p` | Finally, verify the selected coating against IPC-CC-830 qualification data, IPC-A-610 inspection requirements, IPC-7711/7721 rework guidance, and the assembly cleaning process. | ☐ |
| m12l04 | `calc.solution` | The coating datasheet and IPC-CC-830 qualification data are checked. | ☐ |
| m12l04 | `defect.action` | Add a post-cure inspection step for shadowed regions and requalify the coating process against IPC-CC-830 and IPC-A-610 requirements. | ☐ |
| m12l05 | `theory[1].p` | Use IPC-CC-830 as the qualification framework for electrical insulation, thermal shock, humidity, and chemical resistance, and confirm the selected material against the paste, solder mask, laminate, and component datasheets. | ☐ |
| m12l05 | `theory[2].p` | Measure wet film thickness with a wet film comb or gauge, then confirm dry film thickness after cure; target values are commonly 25 to 130 µm depending on the coating class and IPC-CC-830 qualification, but the final range should match the qualified coating system. | ☐ |
| m12l05 | `theory[3].p` | Viscosity, temperature, and withdrawal speed determine wet film thickness; a typical process may aim for 50 to 150 µm dry film thickness, but this must be verified against the coating datasheet and IPC-CC-830 qualification. | ☐ |
| m12l05 | `theory[5].p` | If cleaning is required after coating, confirm that the cleaning solvent does not swell, soften, or craze the coating; IPC-CC-830 includes chemical resistance testing, but production cleaning should still be validated on the actual assembly. | ☐ |
| m12l05 | `theory[6].p` | Too thin a coating may not meet IPC-CC-830 qualification or IPC-A-610 acceptability for the intended class; too thick a coating can trap solvent, crack during thermal cycling, or interfere with connectors and test probes. | ☐ |
| m12l05 | `calc.solution` | If the qualified IPC-CC-830 coating system or IPC-A-610 inspection class requires a different thickness range, adjust the spray parameters and re-measure. | ☐ |

### IPC-7525C — 13 claims

Registry entry: `src-004` — IPC-7525C Stencil Design Guidelines (stencil design guidance: area ratio, aspect ratio, aperture sizing)

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m03l02 | `theory[1].p` | IPC-7525C treats area ratio as a key indicator of paste release because the paste must separate from the sidewalls and transfer to the pad. | ☐ |
| m03l02 | `theory[2].p` | IPC-7525C provides area-ratio guidance for stencil design, but the practical release limit depends on paste rheology, stencil wall finish, print speed, snap-off distance, and squeegee pressure; verify against your paste and equipment datasheet. | ☐ |
| m03l02 | `theory[3].p` | IPC-7525C discusses aspect ratio as a stencil geometry parameter related to paste release and aperture wall effects. | ☐ |
| m03l02 | `theory[7].p` | If area ratio is near or below the IPC-7525C guidance range, or if expected volume is close to the minimum needed for the component and pad, the design should be reviewed for foil thickness, aperture size within the pad, wall finish, paste selection, and print parameters. | ☐ |
| m03l02 | `calc.task` | State whether the aperture is expected to release paste adequately according to common IPC-7525C area-ratio guidance. | ☐ |
| m03l02 | `calc.solution` | The area ratio is 0.625, which is below the commonly cited IPC-7525C area-ratio guidance value of 0.66. | ☐ |
| m03l02 | `defect.action` | Review the aperture area ratio and aspect ratio against IPC-7525C guidance and your paste/equipment datasheet. | ☐ |
| m03l05 | `theory[2].p` | IPC-7525C recommends an area ratio above 0.66 for reliable paste release. | ☐ |
| m03l05 | `theory[3].p` | IPC-7525C recommends an aspect ratio above 1.5. | ☐ |
| m03l05 | `theory[4].p` | IPC-7525C recommends a wall taper in the range of 85 to 90 degrees, measured from the horizontal plane, because a slight taper reduces the effective wall area. | ☐ |
| m03l05 | `calc.solution` | The nominal area ratio 0.625 is below the IPC-7525C recommended value of 0.66, so paste release may be inadequate unless qualified by paste and equipment testing. | ☐ |
| m03l06 | `theory[2].p` | Where the specification is silent, use the design reference such as IPC-7525C and the paste or equipment datasheet, then document the accepted limit before release. | ☐ |
| m03l06 | `calc.task` | Issued specification: foil thickness 0.120 mm +/-0.010 mm; aperture width 0.400 mm +/-0.025 mm; area ratio minimum 0.66 (issued spec, based on IPC-7525C guidance); wall taper minimum 85 deg; tension 25-35 N/cm; step depth 0.050 mm +/-0.010 mm. | ☐ |

### IPC-7351 — 11 claims

Registry entry: `src-011` — IPC-7351 Generic Requirements for Surface Mount Design and Land Pattern Standard

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m03l04 | `theory[2].p` | For the smallest chip components, aperture width may be 0.10 mm to 0.15 mm and length 0.20 mm to 0.30 mm, but final values should be verified against IPC-7525, land pattern data from IPC-7351, and paste release behavior. | ☐ |
| m03l04 | `theory[4].p` | A common approach is to divide the thermal pad into multiple small apertures with 0.10 mm to 0.20 mm spacing between segments, or to use a reduced-area pattern, and verify against IPC-7525 and the package land pattern guidance in IPC-7351. | ☐ |
| m05l06 | `theory[8].p` | IPC-7351 provides land pattern and package data that can be used to calculate pad-to-lead relationships. | ☐ |
| m07l01 | `theory[6].p` | Acceptance should follow the customer-specified IPC-A-610 Acceptability Requirements for Electronic Assemblies class and relevant design guidance such as IPC-7351 Land Pattern Design Data Standard for Surface Mount and IPC-7525 Stencil Design Guidelines. | ☐ |
| m07l01 | `defect.cause` | Land pattern and stencil design may not match IPC-7351 Land Pattern Design Data Standard for Surface Mount and IPC-7525 Stencil Design Guidelines. | ☐ |
| m08l05 | `theory[2].p` | IPC-7351 provides land-pattern and hole-size guidance, but the final value needs to match the fabrication process. | ☐ |
| m13l03 | `theory[3].p` | Verify probe reach, probe force, and minimum pad size against the tester datasheet and IPC-7351 land-pattern guidance. | ☐ |
| m15l03 | `theory[3].p` | For a land pattern change, cite IPC-7351 for footprint geometry and IPC-7095 for BGA if applicable. | ☐ |
| m15l04 | `theory[2].p` | Land pattern design can be framed with IPC-7351, while paste aperture changes should be checked against IPC-7525 and verified with your paste and printer datasheet. | ☐ |
| m15l05 | `theory[1].p` | Include the current controlled documents: drawing revision, IPC-7351 land pattern revision, stencil thickness, paste type, feeder map, AOI program, and IPC-7530 reflow profile. | ☐ |
| m15l05 | `calc.task` | Proposed ECN changes land pattern to IPC-7351 nominal and reduces stencil aperture from 0.30 mm x 0.30 mm to 0.25 mm x 0.25 mm; verify against paste datasheet. | ☐ |

### IPC-TM-650 — 11 claims

Registry entry: `src-013` — IPC-TM-650 method 2.3.25 (ROSE) and 2.3.28 (ion chromatography)

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m12l01 | `theory[1].p` | ROSE tests measure soluble ionic contamination as sodium chloride equivalent, usually using IPC-TM-650 methods and cleanliness requirements referenced by IPC J-STD-001. | ☐ |
| m12l01 | `theory[2].p` | It is commonly evaluated with IPC-TM-650 methods. | ☐ |
| m12l01 | `theory[2].p` | CAF is usually screened with IPC-TM-650 CAF methods. | ☐ |
| m12l01 | `theory[6].p` | The criterion may come from IPC J-STD-001, a customer specification, a product reliability plan, or an IPC-TM-650 test method applied to a coupon or assembly. | ☐ |
| m12l01 | `calc.solution` | The 1.00 µg NaCl/cm² value here is a product-specific limit; the widely used published reference is 1.56 µg NaCl/cm² per IPC-TM-650 method 2.3.25, and high-reliability customers often work tighter. | ☐ |
| m12l01 | `defect.action` | Verify cleanliness with IPC-TM-650 methods and contact resistance or SIR testing. | ☐ |
| m12l03 | `theory[8].p` | The most widely used reference value is 1.56 microgram NaCl equivalent per square centimeter, reported per IPC-TM-650 method 2.3.25 (ROSE) and historically applied to assembled boards through IPC J-STD-001 and to bare boards through IPC-6012. | ☐ |
| m12l03 | `theory[8].p` | Many high-reliability customers tighten it: about 1.0 microgram per square centimeter for high-impedance analog and telecom hardware, about 0.75 for aerospace and military, and about 0.5 for medical assemblies, with ion chromatography per IPC-TM-650 method 2.3.28 used to confirm the specific ions. | ☐ |
| m12l03 | `quiz.q-m12l03-02.prompt` | Using IPC-TM-650 2.3.25, a standard 100 cm² test area has an acceptance limit of 1.56 µg NaCl eq/cm² (the same level is about 10.06 µg/in²). | ☐ |
| m12l03 | `quiz.q-m12l03-02.explanation` | The IPC-TM-650 2.3.25 criterion is pass if the level is at or below 1.56 µg/cm², so the board passes. | ☐ |
| m12l06 | `quiz.q-m12l06-02.prompt` | Using IPC-TM-650 2.3.25 and the traditional ROSE acceptance level of 1.56 µg NaCl eq/cm², and the lesson formula ion concentration = total NaCl-equivalent ion mass / wetted area, a board has a measured ion mass equal to that acceptance level multiplied by the wetted area. | ☐ |

### ANSI/ESD S20.20 — 9 claims

Registry entry: `src-012` — ANSI/ESD S20.20 Development of an Electrostatic Discharge Control Program

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m02l05 | `theory[1].p` | ANSI/ESD S20.20 and IEC 61340-5-1 both require a documented program with written procedures, training, qualification, and periodic audit. | ☐ |
| m02l06 | `theory[6].p` | ANSI/ESD S20.20 and IEC 61340-5-1 require an EPA with controls such as grounded personnel, ESD protective packaging, verified work surfaces, and controlled handling. | ☐ |
| m11l01 | `theory[4].p` | ANSI/ESD S20.20 and IEC 61340-5-1 describe requirements for grounded equipment, personnel grounding, conductive or dissipative work surfaces, and verification. | ☐ |
| m12l01 | `theory[3].p` | For ESD-sensitive assemblies, cleaning and handling must follow ANSI/ESD S20.20 or IEC 61340-5-1 controls, because a clean board can still be damaged by uncontrolled charge transfer. | ☐ |
| m12l01 | `theory[5].p` | For ESD-sensitive work, use grounded work surfaces, wrist straps, ionizers, and ESD-safe containers as required by ANSI/ESD S20.20 or IEC 61340-5-1. | ☐ |
| m12l01 | `calc.solution` | ESD controls must follow ANSI/ESD S20.20 or IEC 61340-5-1. | ☐ |
| m12l01 | `defect.action` | Control MSL exposure per IPC/JEDEC J-STD-033 and ESD handling per ANSI/ESD S20.20 or IEC 61340-5-1. | ☐ |
| m12l02 | `theory[8].p` | Assemblies containing ESD-sensitive components should be handled in an EPA or ESD-controlled area consistent with ANSI/ESD S20.20, using grounded work surfaces, wrist straps where appropriate, ESD-safe containers, and controlled handling. | ☐ |
| m12l02 | `calc.solution` | Handle the assembly in an ESD-controlled area consistent with ANSI/ESD S20.20, using grounded surfaces and ESD-safe containers during cleaning, drying, and coating. | ☐ |

### J-STD-004 — 8 claims

Registry entry: `src-019` — J-STD-004 Requirements for Soldering Fluxes (paste CoA specification reference)

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m01l02 | `theory[3].p` | For solder paste, a CoA commonly reports metal content, viscosity, or other paste properties against the specification, often referencing IPC J-STD-004, and may include shelf-life information. | ☐ |
| m01l02 | `theory[5].p` | The CoA or CoC proves that the paste was manufactured and tested against the agreed specification, often IPC J-STD-004, and may include shelf-life information. | ☐ |
| m01l05 | `theory[3].p` | The alloy and powder type prove the paste matches the process requirement, using classifications such as those in IPC J-STD-005 for paste, IPC J-STD-006 for powder, and IPC J-STD-004 for flux. | ☐ |
| m09l02 | `theory[1].p` | IPC J-STD-004 provides flux classification by residue type and activity; use the datasheet to confirm compatibility with the finish and cleaning process. | ☐ |
| m09l02 | `theory[3].p` | IPC J-STD-004 activity classes can guide selection: use low activity for clean, fresh finishes and higher activity for oxidized or high-thermal-mass joints, then verify by wetting and residue tests. | ☐ |
| m09l02 | `calc.solution` | Next, select no-clean organic flux with low-to-moderate activity per IPC J-STD-004 because the finish is fresh and residue must remain acceptable without cleaning. | ☐ |
| m09l03 | `theory[2].p` | Use the flux classification and residue requirements from IPC J-STD-004 and confirm compatibility with the board finish and cleaning process. | ☐ |
| m09l03 | `calc.solution` | Flux type: choose no-clean low-residue flux because cleaning is not available; verify flux activity and residue against IPC J-STD-004 and supplier datasheet. | ☐ |

### IPC-7095 — 8 claims

Registry entry: `src-007` — IPC-7095 Design and Assembly Process Implementation for BGAs

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m03l04 | `theory[5].p` | IPC-7095 provides BGA design and assembly guidance, including paste deposition and land pattern considerations. | ☐ |
| m03l04 | `calc.solution` | For the 0.5 mm pitch BGA, verify that the same foil does not create insufficient paste; if needed, use a step stencil or local thickness change, and verify against IPC-7095 and paste datasheet. | ☐ |
| m07l01 | `theory[3].p` | It can also support IPC-7095 Design and Assembly Process Implementation for BGAs guidance on hidden BGA features. | ☐ |
| m07l01 | `defect.action` | Review stencil aperture area ratio, paste type, print pressure, squeegee speed, and reflow profile against IPC-7525 Stencil Design Guidelines and IPC-7095 Design and Assembly Process Implementation for BGAs. | ☐ |
| m07l04 | `theory[2].p` | For BGA land and paste design, IPC-7095 provides guidance on land pattern and paste printing design; verify the specific land size, paste aperture, and volume against the component datasheet and your paste/equipment datasheet. | ☐ |
| m07l04 | `theory[4].p` | IPC-7095 provides design guidance for BGA land patterns and paste apertures; verify paste aperture size, pitch, and stencil thickness against your paste and stencil datasheet. | ☐ |
| m07l04 | `defect.cause` | IPC-7095 provides BGA land and paste design guidance; verify paste aperture size, stencil thickness, and release behavior against the paste and stencil datasheet. | ☐ |
| m15l03 | `theory[3].p` | For a land pattern change, cite IPC-7351 for footprint geometry and IPC-7095 for BGA if applicable. | ☐ |

### IEC 61340-5-1 — 7 claims

Registry entry: `src-035` — IEC 61340-5-1 Protection of Electronic Devices from Electrostatic Phenomena — General Requirements

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m02l05 | `theory[1].p` | ANSI/ESD S20.20 and IEC 61340-5-1 both require a documented program with written procedures, training, qualification, and periodic audit. | ☐ |
| m02l06 | `theory[6].p` | ANSI/ESD S20.20 and IEC 61340-5-1 require an EPA with controls such as grounded personnel, ESD protective packaging, verified work surfaces, and controlled handling. | ☐ |
| m11l01 | `theory[4].p` | ANSI/ESD S20.20 and IEC 61340-5-1 describe requirements for grounded equipment, personnel grounding, conductive or dissipative work surfaces, and verification. | ☐ |
| m12l01 | `theory[3].p` | For ESD-sensitive assemblies, cleaning and handling must follow ANSI/ESD S20.20 or IEC 61340-5-1 controls, because a clean board can still be damaged by uncontrolled charge transfer. | ☐ |
| m12l01 | `theory[5].p` | For ESD-sensitive work, use grounded work surfaces, wrist straps, ionizers, and ESD-safe containers as required by ANSI/ESD S20.20 or IEC 61340-5-1. | ☐ |
| m12l01 | `calc.solution` | ESD controls must follow ANSI/ESD S20.20 or IEC 61340-5-1. | ☐ |
| m12l01 | `defect.action` | Control MSL exposure per IPC/JEDEC J-STD-033 and ESD handling per ANSI/ESD S20.20 or IEC 61340-5-1. | ☐ |

### IPC-7530B — 7 claims

Registry entry: `src-008` — IPC-7530 Guidelines for Temperature Profiling for Mass Soldering Processes

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m06l05 | `theory[3].p` | IPC-7530B gives typical guidance such as a ramp rate of 1-3 C/s and a soak that reduces thermal gradients. | ☐ |
| m06l05 | `theory[4].p` | IPC-7530B gives typical guidance of 60-120 s above liquidus. | ☐ |
| m06l05 | `theory[7].p` | Compare the measured values with IPC-7530B guidance and IPC/JEDEC J-STD-020 classification limits, then adjust zones until the coldest joint meets wetting requirements without exceeding the hottest joint limit. | ☐ |
| m06l05 | `calc.task` | Build the expected ramp from thermal mass and check ramp, time above liquidus, and peak against IPC-7530B guidance and IPC/JEDEC J-STD-020 limits. | ☐ |
| m06l05 | `calc.solution` | Check ramp against IPC-7530B typical guidance of 1-3 C/s: 1.1 C/s is within the guidance. | ☐ |
| m06l05 | `calc.solution` | Check time above liquidus against IPC-7530B typical guidance of 60-120 s: measured 75 s is within the guidance. | ☐ |
| m06l05 | `defect.action` | Reduce the ramp rate toward IPC-7530B guidance, extend the soak, verify thermocouple placement on the heavy area, and re-run the profile while checking the paste datasheet for recommended ramp and soak limits. | ☐ |

### ISO 2859-1 — 6 claims

Registry entry: `src-006` — ISO 2859-1 Sampling procedures for inspection by attributes

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m01l03 | `theory[1].p` | ISO 2859-1 provides general inspection levels and special inspection levels for destructive or expensive tests. | ☐ |
| m01l03 | `theory[2].p` | ISO 2859-1 lists preferred AQL values; common incoming choices are 0.65%, 1.0%, and 2.5% defective, selected by defect class and risk. | ☐ |
| m01l03 | `theory[4].p` | In ISO 2859-1, a lot of 1201 to 3200 units at general inspection level II gives code letter K, which corresponds to a sample size of 125 units. | ☐ |
| m01l03 | `theory[4].blocks[1].caption` | General inspection levels — sample size code letters (ISO 2859-1 / ANSI/ASQ Z1.4 Table I) — TBD-REVIEW | ☐ |
| m01l03 | `calc.task` | Use ISO 2859-1 general inspection level II and an AQL of 1.0% defective. | ☐ |
| m01l03 | `calc.solution` | Select standard: ISO 2859-1 normal single sampling. | ☐ |

### IPC-A-600 — 5 claims

Registry entry: `src-022` — IPC-A-600 Acceptability of Printed Boards (visual and dimensional criteria)

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m01l02 | `theory[3].p` | For bare PCBs, a CoC or CoA may prove laminate material, copper weight, plating type, plating thickness, and acceptance against IPC-A-600 or IPC-6012, depending on the contract. | ☐ |
| m01l02 | `theory[6].p` | Acceptance may be referenced to IPC-A-600 for visual and dimensional criteria, while IPC-6012 may be used for qualification and performance requirements. | ☐ |
| m01l04 | `theory[4].p` | Acceptability of visual and dimensional features is commonly judged against IPC-A-600, Acceptability of Printed Boards, but the purchase order may impose tighter limits. | ☐ |
| m01l05 | `theory[4].p` | For bare PCBs, request the packing list, certificate of conformance, IPC-A-600 class or purchase-order class, bare-board test report, finish type and thickness report, impedance report if controlled, material declaration, and moisture barrier packaging with humidity indicator card when required. | ☐ |
| m01l05 | `theory[4].p` | The IPC-A-600 class statement proves the visual and dimensional acceptance level intended for the board. | ☐ |

### J-STD-005 — 3 claims

Registry entry: `src-015` — J-STD-005 Requirements for Soldering Pastes (powder size distribution, Type 3 = 25-45 µm, 80% minimum in range)

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m01l05 | `theory[3].p` | The alloy and powder type prove the paste matches the process requirement, using classifications such as those in IPC J-STD-005 for paste, IPC J-STD-006 for powder, and IPC J-STD-004 for flux. | ☐ |
| m01l05 | `quiz.q-m01l05-02.prompt` | IPC J-STD-005 Type 3 powder requires 80% of the powder to be between 25 and 45 µm, with no more than 10% below 25 µm and no more than 10% above 45 µm. | ☐ |
| m01l05 | `quiz.q-m01l05-02.explanation` | Because J-STD-005 Type 3 requires 80% minimum in range, the lot is accepted on this evidence. | ☐ |

### IPC-2221 — 3 claims

Registry entry: `src-024` — IPC-2221 Generic Standard on Printed Board Design

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m08l01 | `quiz.q-m08l01-02.explanation` | The 0.30 mm clearance is a design rule of thumb rather than an IPC-2221 requirement, so verify it against your drill, plating and lead tolerances. | ☐ |
| m15l04 | `theory[4].p` | IPC-2221 and IPC-2222 provide generic and organic-board design frameworks, but the final spacing should also reflect your placement accuracy, feeder clearance, and inspection optics. | ☐ |
| m15l04 | `theory[8].p` | IPC-2221 and IPC-2222 provide design frameworks, but the final hole size should be checked against drill tolerance, plating thickness, and lead diameter variation. | ☐ |

### IPC-4101 — 2 claims

Registry entry: `src-023` — IPC-4101 Specification for Base Materials for Rigid and Multilayer Printed Boards

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m01l04 | `theory[4].p` | Material declarations may reference IPC-4101, Specification for Base Materials for Rigid and Multilayer Printed Boards, and flammability may reference UL 94, Standard for Safety of Flammability of Plastic Materials. | ☐ |
| m01l06 | `theory[2].p` | For plated finishes, a report may cite IPC-4101 for base material and finish requirements and IPC-6012 for qualified product performance. | ☐ |

### ISO 9001 — 2 claims

Registry entry: `src-037` — ISO 9001 Quality Management Systems — Requirements (control of externally provided product)

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m01l04 | `theory[7].p` | The disposition should follow the quality management system, for example ISO 9001, Quality management systems, or ANSI/AS9100, Quality Management Systems—Requirements for Aviation, Space, and Defense Organizations, where nonconforming output must be controlled and documented. | ☐ |
| m14l03 | `theory[1].p` | When the scope is too narrow, the escape can continue downstream, and the company may need to notify the customer under the applicable requirement in ISO 9001 or IATF 16949. | ☐ |

### ANSI/ESD STM97.1 — 2 claims

Registry entry: `src-033` — ANSI/ESD STM97.1 Floor Materials and Footwear — Resistance Measurement in Combination with a Person

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m02l05 | `theory[3].p` | Wrist straps are governed by ANSI/ESD S1.1 and are typically used at static controlled workstations; footwear/floor systems are qualified using ANSI/ESD STM97.1 and ANSI/ESD STM97.2. | ☐ |
| m02l05 | `theory[5].p` | Footwear and flooring systems, by contrast, are qualified under ANSI/ESD STM97.1 and STM97.2. | ☐ |

### IPC-7721 — 2 claims

Registry entry: `src-009` — IPC-7711/7721 Rework, Modification and Repair of Electronic Assemblies

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m12l05 | `theory[7].p` | For rework and repair, follow IPC-7711 and IPC-7721 guidance for acceptable rework and repair methods, including preheat, temperature control, and post-rework inspection. | ☐ |
| m12l05 | `defect.action` | Remove the assembly from the line and clean or replace affected connectors according to IPC-7711 and IPC-7721 rework and repair guidance. | ☐ |

### IPC-7526 — 2 claims

Registry entry: `src-026` — IPC-7526 Stencil and Misprinted Board Cleaning Handbook

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m14l01 | `theory[5].p` | Verify actual parameter ranges against your paste datasheet, stencil design, printer datasheet, oven profile, wave or selective solder machine datasheet, and IPC-7525, IPC-7526, IPC-7530, or IPC-7711/7721 guidance where applicable. | ☐ |
| m14l01 | `defect.action` | If the corrected paste print Pareto rises, review stencil condition, aperture design, paste rheology, squeegee settings, and SPI data against IPC-7525, IPC-7526, and IPC-7530 guidance and your equipment datasheets. | ☐ |

### IPC-2222 — 2 claims

Registry entry: `src-025` — IPC-2222 Sectional Design Standard for Rigid Organic Printed Boards

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m15l04 | `theory[4].p` | IPC-2221 and IPC-2222 provide generic and organic-board design frameworks, but the final spacing should also reflect your placement accuracy, feeder clearance, and inspection optics. | ☐ |
| m15l04 | `theory[8].p` | IPC-2221 and IPC-2222 provide design frameworks, but the final hole size should be checked against drill tolerance, plating thickness, and lead diameter variation. | ☐ |

### UL 94 — 1 claim

Registry entry: `src-039` — UL 94 Tests for Flammability of Plastic Materials for Parts in Devices and Appliances

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m01l04 | `theory[4].p` | Material declarations may reference IPC-4101, Specification for Base Materials for Rigid and Multilayer Printed Boards, and flammability may reference UL 94, Standard for Safety of Flammability of Plastic Materials. | ☐ |

### ANSI/AS9100 — 1 claim

Registry entry: `src-038` — ANSI/AS9100 Quality Management Systems — Requirements for Aviation, Space and Defense Organizations

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m01l04 | `theory[7].p` | The disposition should follow the quality management system, for example ISO 9001, Quality management systems, or ANSI/AS9100, Quality Management Systems—Requirements for Aviation, Space, and Defense Organizations, where nonconforming output must be controlled and documented. | ☐ |

### J-STD-006 — 1 claim

Registry entry: `src-020` — J-STD-006 Soft Solder Alloys and Fluxed or Non-Fluxed Solid Solders for Electronic Soldering Applications (powder solder, other than paste)

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m01l05 | `theory[3].p` | The alloy and powder type prove the paste matches the process requirement, using classifications such as those in IPC J-STD-005 for paste, IPC J-STD-006 for powder, and IPC J-STD-004 for flux. | ☐ |

### J-STD-002 — 1 claim

Registry entry: `src-021` — J-STD-002 Solderability Tests for Component Leads, Terminations, Lugs, Terminals and Wires

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m01l06 | `theory[2].p` | For solderability, IPC/JEDEC J-STD-002 can be used for component solderability, while bare board solderability is commonly specified against IPC-6012 and the customer drawing. | ☐ |

### ISO 9001:2015 — 1 claim

Registry entry: `src-037` — ISO 9001 Quality Management Systems — Requirements (control of externally provided product)

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m01l07 | `theory[1].p` | ISO 9001:2015 requires control of externally provided processes, products, and services, so the dock record should show the evidence used to accept, quarantine, or reject the lot. | ☐ |

### ANSI/ESD S6.1 — 1 claim

Registry entry: `src-029` — ANSI/ESD S6.1 Grounding (equipotential bonding of racks, carts, shelving and tables)

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m02l05 | `theory[2].p` | ANSI/ESD S6.1 addresses grounding and equipotential bonding; use it to verify that racks, carts, shelving, tables, and floor systems are bonded as required by the control plan. | ☐ |

### ANSI/ESD S1.1 — 1 claim

Registry entry: `src-027` — ANSI/ESD S1.1 Wrist Straps

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m02l05 | `theory[3].p` | Wrist straps are governed by ANSI/ESD S1.1 and are typically used at static controlled workstations; footwear/floor systems are qualified using ANSI/ESD STM97.1 and ANSI/ESD STM97.2. | ☐ |

### ANSI/ESD STM97.2 — 1 claim

Registry entry: `src-034` — ANSI/ESD STM97.2 Footwear/Flooring System — Voltage Measurement in Combination with a Person

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m02l05 | `theory[3].p` | Wrist straps are governed by ANSI/ESD S1.1 and are typically used at static controlled workstations; footwear/floor systems are qualified using ANSI/ESD STM97.1 and ANSI/ESD STM97.2. | ☐ |

### ANSI/ESD S4.1 — 1 claim

Registry entry: `src-028` — ANSI/ESD S4.1 Worksurfaces — Resistance Measurements

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m02l05 | `theory[4].p` | ANSI/ESD S4.1 covers static dissipative mats, and surface resistance or resistivity can be characterized using ANSI/ESD STM11.11. | ☐ |

### ANSI/ESD STM11.11 — 1 claim

Registry entry: `src-032` — ANSI/ESD STM11.11 Surface Resistance Measurements of Static Dissipative Planar Materials

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m02l05 | `theory[4].p` | ANSI/ESD S4.1 covers static dissipative mats, and surface resistance or resistivity can be characterized using ANSI/ESD STM11.11. | ☐ |

### ANSI/ESD STM3.1 — 1 claim

Registry entry: `src-031` — ANSI/ESD STM3.1 Ionization (offset voltage and discharge time)

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m02l05 | `theory[5].p` | ANSI/ESD STM3.1 covers ionization, and performance qualification and periodic verification are evaluated against the offset-voltage (balance) and discharge-time limits in that method, which is the ESDA counterpart of IEC 61340-4-7. | ☐ |

### IEC 61340-4-7 — 1 claim

Registry entry: `src-036` — IEC 61340-4-7 Standard Test Methods for Specific Applications — Ionization

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m02l05 | `theory[5].p` | ANSI/ESD STM3.1 covers ionization, and performance qualification and periodic verification are evaluated against the offset-voltage (balance) and discharge-time limits in that method, which is the ESDA counterpart of IEC 61340-4-7. | ☐ |

### ANSI/ESD S541 — 1 claim

Registry entry: `src-030` — ANSI/ESD S541 Packaging Materials for ESD Sensitive Items

| Lesson | Where | Claim (verbatim) | OK |
|---|---|---|---|
| m02l05 | `theory[6].p` | ANSI/ESD S541 covers ESD packaging, including shielding bags, conductive containers, and closure methods. | ☐ |

---

## Part C — per-lesson sign-off

One row per lesson. A lesson is promotable when every Part A fact it relies on is
ticked, every Part B claim it carries is ticked, and its own arithmetic has been
checked. Ticking a row here means "I have read this lesson and its claims hold",
not that the text is well written.

| Lesson | Title | Claims | Standards cited | Status | Reviewed |
|---|---|---|---|---|---|
| m01l01 | What incoming inspection protects: defect cost by stage | 0 | — | draft | ☐ |
| m01l02 | The documentation package: CoC/CoA, packing list, MSL label, declarations | 11 | IPC-6012, IPC-A-600, J-STD-004, J-STD-033 | draft | ☐ |
| m01l03 | Sampling a lot: lot definition, sample size, inspection level, AQL concept | 7 | ISO 2859-1, J-STD-033 | draft | ☐ |
| m01l04 | Component verification: part number, date code, package, counterfeit red flags | 7 | ANSI/AS9100, IPC-4101, IPC-6012, IPC-A-600, ISO 9001, J-STD-033, UL 94 | draft | ☐ |
| m01l05 | Solder paste, flux and adhesive receipt: alloy, powder, expiry, cold chain | 9 | IPC-A-600, J-STD-004, J-STD-005, J-STD-006, J-STD-033 | draft | ☐ |
| m01l06 | Bare PCB receipt: surface finish, planarity and warpage, packaging, shelf life | 17 | IPC-4101, IPC-6012, J-STD-002, J-STD-033 | draft | ☐ |
| m01l07 | Nonconforming material at dock: quarantine, MRB, supplier notification | 3 | ISO 9001:2015, J-STD-033 | draft | ☐ |
| m02l01 | Moisture inside a package: what happens during reflow and why | 14 | J-STD-020, J-STD-033 | draft | ☐ |
| m02l02 | Reading MSL reality: J-STD-033 / J-STD-020 markings, barrier bag, HIC | 16 | J-STD-020, J-STD-033 | draft | ☐ |
| m02l03 | Floor-life accounting: clock start, accumulation, reset rules | 13 | J-STD-033 | draft | ☐ |
| m02l04 | Baking and dry cabinets: when required, conditions by package, records | 11 | J-STD-033 | draft | ☐ |
| m02l05 | The ESD control program: EPA, grounding, straps, mats, ionizers, packaging | 12 | ANSI/ESD S1.1, ANSI/ESD S20.20, ANSI/ESD S4.1, ANSI/ESD S541, ANSI/ESD S6.1, ANSI/ESD STM11.11, ANSI/ESD STM3.1, ANSI/ESD STM97.1, ANSI/ESD STM97.2, IEC 61340-4-7, IEC 61340-5-1 | draft | ☐ |
| m02l06 | Case: expired floor life found mid-lot | 24 | ANSI/ESD S20.20, IEC 61340-5-1, J-STD-020, J-STD-033 | draft | ☐ |
| m03l01 | The paste volume budget: what the joint needs before the aperture is drawn | 3 | IPC-7525 | draft | ☐ |
| m03l02 | Area ratio and aspect ratio: definitions, calculation, fine-pitch consequences | 7 | IPC-7525C | draft | ☐ |
| m03l03 | Foil, thickness, step stencils, laser cut and wall finish | 14 | IPC-7525 | draft | ☐ |
| m03l04 | Aperture geometry by component: chip, QFP fine pitch, QFN/LGA, BGA | 17 | IPC-7095, IPC-7351, IPC-7525, IPC-A-610 | draft | ☐ |
| m03l05 | Aperture calculator and drawing review | 4 | IPC-7525C | draft | ☐ |
| m03l06 | Stencil acceptance, cleaning regime and lifetime tracking | 4 | IPC-7525, IPC-7525C | draft | ☐ |
| m04l01 | From aperture to deposit: how stencil geometry becomes paste volume | 7 | IPC-7525 | draft | ☐ |
| m04l02 | Reading SPI data: measurement principle, volume/height/area/offset, artifacts | 3 | IPC-7525, IPC-A-610 | draft | ☐ |
| m04l03 | Printer setup: squeegee pressure and speed, snap-off, separation, wipe cycle | 0 | — | draft | ☐ |
| m04l04 | Paste behaviour: viscosity, thixotropy, metal load, slump, handling and life | 0 | — | draft | ☐ |
| m04l05 | SPI as process evidence: mean, spread, capability, stop/adjust decisions | 0 | — | draft | ☐ |
| m04l06 | Print defect atlas: under-fill, excess, bridging, skew, smearing, slumping | 1 | IPC-A-610 | draft | ☐ |
| m04l07 | Print troubleshooting logic and one-variable-at-a-time experiments | 0 | — | draft | ☐ |
| m05l01 | Machine types and what accuracy, repeatability and throughput really mean | 0 | — | draft | ☐ |
| m05l02 | Feeders, nozzles, pick height and placement force limits by component | 0 | — | draft | ☐ |
| m05l03 | Fiducials, board recognition, vision calibration, measuring placement offset | 1 | IPC-A-610 | draft | ☐ |
| m05l04 | Placement defect atlas: tombstone, skew, tilt, missing, wrong part, polarity | 0 | — | draft | ☐ |
| m05l05 | Component library setup, program verification and first-article check | 0 | — | draft | ☐ |
| m05l06 | Case: shift and skew on a fine-pitch QFP | 4 | IPC-7351, IPC-7525, IPC-A-610 | draft | ☐ |
| m06l01 | Heat transfer in the oven: convection, conduction, radiation, zone structure | 13 | IPC-7530, J-STD-020 | draft | ☐ |
| m06l02 | Profile anatomy: ramp, soak, time above liquidus, peak, cooling — what each controls | 12 | IPC-7530, J-STD-020 | draft | ☐ |
| m06l03 | Running a thermal survey: thermocouple attachment, test coupon, worst-case site | 2 | J-STD-020 | draft | ☐ |
| m06l04 | Board thermal mass and layout: heavy planes, thermal relief, mixed population, dense vs sparse | 7 | IPC-7530, J-STD-020 | draft | ☐ |
| m06l05 | Alloy systems and profile families: SnAgCu vs SnPb, liquidus basis, nitrogen vs air | 13 | IPC-7530B, J-STD-020 | draft | ☐ |
| m06l06 | Reflow defect atlas: tombstone, balling, beading, dewetting, voids, distortion | 2 | IPC-7530, J-STD-020 | draft | ☐ |
| m06l07 | Profile validation, documentation and change control | 0 | — | draft | ☐ |
| m07l01 | What each method can see: visual, AOI, 2D X-ray, laminar/3D, boundary scan | 11 | IPC-7095, IPC-7351, IPC-7525, IPC-A-610 | draft | ☐ |
| m07l02 | AOI program setup: windows, lighting, thresholds, the false-call/escape trade-off | 0 | — | draft | ☐ |
| m07l03 | AOI metrics: escape rate, false calls, first-pass yield, verification workflow | 0 | — | draft | ☐ |
| m07l04 | X-ray interpretation: BGA ball size and voiding, bridging, through-hole fill | 15 | IPC-7095, IPC-A-610 | draft | ☐ |
| m07l05 | Disposition language: defect, condition and class in workmanship terms | 11 | IPC-7711, IPC-A-610 | draft | ☐ |
| m07l06 | Classification drill: print, placement, reflow and THT images | 16 | IPC-7711, IPC-A-610 | draft | ☐ |
| m08l01 | What stays through-hole and why: connectors, mechanical load, power | 5 | IPC-2221, IPC-A-610 | draft | ☐ |
| m08l02 | Hole and lead: diameters, tolerance stack-up, placement tolerance, percent fill | 3 | IPC-A-610 | draft | ☐ |
| m08l03 | Insertion: seating, stand-off, polarity, clinch, insertion damage | 1 | IPC-A-610 | draft | ☐ |
| m08l04 | Preparing the board for wave: carriers, pallets, masking, taping, orientation | 0 | — | draft | ☐ |
| m08l05 | Calculation drill: clearance and expected fill for a real BOM subset | 7 | IPC-7351, IPC-A-610 | draft | ☐ |
| m09l01 | Wave architecture: flux, preheat, wave types (single/dual, lambda, micro-wave) | 2 | IPC-7530, IPC-A-610 | draft | ☐ |
| m09l02 | Flux selection and application: solids, activity, amount, pattern, verification | 5 | IPC-A-610, J-STD-001, J-STD-004 | draft | ☐ |
| m09l03 | Preheat: board top vs bottom temperature, flux activation, thermal limits | 5 | IPC-7530, IPC-A-610, J-STD-004 | draft | ☐ |
| m09l04 | Contact time and fog height: dwell calculation, wave height vs board clearance | 2 | IPC-A-610 | draft | ☐ |
| m09l05 | Shadowing and orientation: shading, pallets, board direction, lead geometry | 0 | — | draft | ☐ |
| m09l06 | Wave defect atlas: bridging, balling, insufficient fill, bypass, lifted lead, blowholes | 6 | IPC-A-610 | draft | ☐ |
| m09l07 | Wave process control: bath contamination, tin consumption, records, first article | 1 | IPC-A-610 | draft | ☐ |
| m10l01 | Where selective beats wave: mixed assembly, heat-sensitive neighbours, throughput | 11 | IPC-7711, IPC-A-610, J-STD-001 | draft | ☐ |
| m10l02 | Nozzle strategy: size and shape, flux-on-the-fly, dwell per joint, multi-pass | 0 | — | draft | ☐ |
| m10l03 | Thermal budget of the neighbours: heat spread, monitoring, sensitive parts | 0 | — | draft | ☐ |
| m10l04 | Programming a run: path, order, fixtures, air knife, cycle time | 3 | IPC-7711, IPC-A-610 | draft | ☐ |
| m10l05 | Selective defects and validation: cross-section, pull test, documentation | 5 | IPC-7530, IPC-7711, IPC-A-610 | draft | ☐ |
| m11l01 | The hand soldering station: tip selection, temperature setting, ESD and fume control | 10 | ANSI/ESD S20.20, IEC 61340-5-1, IPC-A-610, J-STD-001 | draft | ☐ |
| m11l02 | Technique: contact order, dwell, feed, lead-free discipline, technique defects | 0 | — | draft | ☐ |
| m11l03 | Rework: hot air, preheat, paste-in-pad, BGA/QFN removal and replacement | 4 | IPC-7530, IPC-A-610, J-STD-001, J-STD-033 | draft | ☐ |
| m11l04 | Repair limits: IPC-7711/7721 classes, conductor cut, annular ring, laminate damage | 27 | IPC-7711, IPC-A-610 | draft | ☐ |
| m11l05 | Acceptance and re-inspection of rework and repair; documenting the operation | 25 | IPC-7711, IPC-A-610, J-STD-001 | draft | ☐ |
| m11l06 | Practice: rework one joint and document it against criteria | 21 | IPC-7711, IPC-A-610 | draft | ☐ |
| m12l01 | What residue is and why it matters: ionic residue, SIR, CAF, contact failure | 22 | ANSI/ESD S20.20, IEC 61340-5-1, IPC-7711, IPC-CC-830, IPC-TM-650, J-STD-001, J-STD-033 | draft | ☐ |
| m12l02 | Cleaning methods: aqueous, semi-aqueous, solvent, ultrasonic; material compatibility | 4 | ANSI/ESD S20.20, J-STD-033 | draft | ☐ |
| m12l03 | Cleanliness verification: ROSE, ion chromatography, particle count, visual | 7 | IPC-6012, IPC-TM-650, J-STD-001 | draft | ☐ |
| m12l04 | Coating types and selection: acrylic, urethane, silicone, parylene, UV cure | 17 | IPC-7711, IPC-A-610, IPC-CC-830 | draft | ☐ |
| m12l05 | Application and masking: spray, dip, selective, thickness, cure, repairability | 14 | IPC-7711, IPC-7721, IPC-A-610, IPC-CC-830 | draft | ☐ |
| m12l06 | Contamination and coating defect cases: residue, white residue, corrosion, fish-eye, dewetting | 3 | IPC-A-610, IPC-TM-650, J-STD-001 | draft | ☐ |
| m13l01 | Test levels and what each catches: ICT, flying probe, boundary scan, functional | 0 | — | draft | ☐ |
| m13l02 | In-circuit test: fixture, node access, test-point design, analog limits | 0 | — | draft | ☐ |
| m13l03 | Flying probe: when it wins, throughput ceiling, program effort | 3 | IPC-7351, IPC-A-610 | draft | ☐ |
| m13l04 | Boundary scan / JTAG: BGA access, structure, what it cannot find | 0 | — | draft | ☐ |
| m13l05 | Coverage math: node vs defect coverage, escape risk, where inspection ends and test starts | 0 | — | draft | ☐ |
| m13l06 | Choosing a strategy for a product mix: volume, complexity, cost, rework loop | 0 | — | draft | ☐ |
| m14l01 | Defect data before opinions: taxonomy, Pareto by stage, measurement integrity | 12 | IPC-7525, IPC-7526, IPC-7530, IPC-7711, IPC-A-610 | draft | ☐ |
| m14l02 | Cause analysis tools: 5-Why, fishbone, fault tree, change-point analysis | 4 | IPC-A-610, J-STD-001 | draft | ☐ |
| m14l03 | Containment and traceability: quarantine scope, lot trace, retroactive search | 6 | IPC-7711, IPC-A-610, ISO 9001, J-STD-001 | draft | ☐ |
| m14l04 | 8D discipline: D1–D8 content and where 8D reports fail | 0 | — | draft | ☐ |
| m14l05 | Corrective vs preventive action and effectiveness verification | 0 | — | draft | ☐ |
| m14l06 | Closing the loop: PFMEA, control plan, auditor checklist, change control | 4 | IPC-7530, IPC-7711, IPC-A-610 | draft | ☐ |
| m14l07 | 8D workshop: full case from symptom to closure | 2 | IPC-A-610 | draft | ☐ |
| m15l01 | How designers read process feedback: language, format, what gets acted on | 0 | — | draft | ☐ |
| m15l02 | The evidence pack: measured data, images with scale, defect rate, cost of poor quality | 0 | — | draft | ☐ |
| m15l03 | Writing the change request: problem, impact, proposal, alternatives, risk, verification | 6 | IPC-7095, IPC-7351, IPC-7711, IPC-A-610, J-STD-001 | draft | ☐ |
| m15l04 | DFM/DFT asks that work: pad geometry, paste relief, spacing, test points, fiducials, panelization, hole/lead spec | 8 | IPC-2221, IPC-2222, IPC-7351, IPC-7525, IPC-A-610 | draft | ☐ |
| m15l05 | Negotiation, version control and closure with post-change data | 5 | IPC-7351, IPC-7530, IPC-7711, IPC-A-610 | draft | ☐ |

---

## Part D — what has already been done, and what "done" means

### Already checked automatically

These were verified in audit rounds 1 to 6 and do not need redoing, though a human
should still confirm the judgement calls:

- **Arithmetic.** Every worked calculation in all 92 lessons was read and
  recomputed. `m14l01` alone: 30 checks, all reconcile.
- **Quiz keys.** All 185 questions were read against their own explanations;
  several keys contradicted their explanations and were corrected.
- **Internal contradictions.** Lessons teaching the same table were compared;
  `m01l03` disagreed with its own table and its own quiz and was corrected (W17).
- **Misattributed standards.** `IPC-7711/7712` → `IPC-7711/7721`; ESD `STM97.7/97.8`
  → `STM97.1/97.2`; `J-STD-020` peaks and `TAL` attribution corrected.
- **Unit-basis errors.** Wave flux density moved to a solids basis; thickness-indexed
  bake limits; powder sieve percentages.
- **Illustrations.** All 92 were reviewed by viewing them against the lesson text.
  `m08l05`'s fill chain was wrong and was regenerated: it drew
  `F_A = A_L / A_c`, the lead-to-clearance area ratio, as the expected barrel fill,
  which reports 45 % against the lesson's own 90 % target.
- **The delivered bundle.** It did not run: Cloudflare Rocket Loader had rewritten
  the script tags in `index.html`, so `app.js` never executed. Fixed, and
  `scripts/verify-runtime.js` now proves the page boots.

### Still open, and deliberately left open

- Every lesson is `status: "draft"` with its original review string. Nothing has been
  signed off, and this checklist does not sign anything off.
- Prop-number nits in four illustrations — tray and reel dimensions, deposit
  dimensions, and similar plausible values that contradict no lesson but were not
  dictated by one. Default is to report, not to regenerate.
- Standards cited but absent from `sources.json` are flagged in Part B as
  "Registry entry: none". They should be added or the citation removed.

### What "done" looks like

1. Every Part A row is ticked, or the disagreement is recorded as a course defect
   and fixed.
2. Every Part B row is ticked for the lessons being promoted.
3. Every Part C row for those lessons is ticked.
4. The reviewer sets `status` to `reviewed` on those lessons. The draft banner is
   gated on status, so it disappears by itself — it cannot be removed by editing
   text, only by reviewing. That is the mechanism this checklist exists to serve.
5. The `review` string is rewritten or cleared by the reviewer, not before.

Until step 4 happens, the footer line and the in-lesson banner stay. They are the
boundary between study notes and a work instruction, and the course has not earned
the right to cross it yet.

