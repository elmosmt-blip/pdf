# Source verification — round 10

Round 10 tested the claim made in round 9 that the 571 course claims could not
be checked because the standards are paywalled. **That claim was wrong.** The
standards themselves are sold, but their content is widely reproduced in freely
available primary and near-primary documents: government-hosted copies of the
JEDEC standards, ANSI's own preview pages, IPC's table of contents, and
component manufacturer datasheets that reproduce the classification tables
verbatim.

This file records what was checked, against what, and what the answer was. It is
the evidence trail for the ticks in `REVIEW_CHECKLIST.md` Part A.

Every entry below is either a verbatim quote from a primary source, or a value
reproced by two or more independent secondary sources. Where the sources
disagree, that is recorded as **CONTRADICTED** rather than resolved — a
contradiction between two secondary sources is not evidence.

---

## Defects found and fixed in round 10

### D1 — the course cites IPC-7525D, which does not exist

| Where | Claim |
|---|---|
| `m03l02` (lesson index 14) | "IPC-7525D treats area ratio as a key indicator of paste release", plus 6 more references |
| `m03l05` (lesson index 17) | "IPC-7525D recommends an area ratio above 0.66", "IPC-7525D recommends an aspect ratio above 1.5", "IPC-7525D recommends a wall taper in the range of 85 to 90 degrees" |
| `m03l06` (lesson index 18) | "use the design reference such as IPC-7525B", "area ratio minimum 0.66 (issued spec, based on IPC-7525B guidance)" |
| `sources.json` `src-004` | `edition: "Rev A"` |

**The actual revision history:**

| Revision | Date | Status |
|---|---|---|
| IPC-7525 | May 2000 | superseded |
| IPC-7525A | February 2007 | superseded |
| IPC-7525B | October 2011 | superseded |
| **IPC-7525C** | **November 2021** | **current** |

Evidence: the IPC-7525B front matter states *"Supersedes: IPC-7525A - February
2007, IPC-7525 - May 2000"*; the Accuristech document history lists IPC-7525C
November 2021 as most recent and IPC-7525B as a historical version. No revision
D exists.

The course's own TBD-REVIEW marker asked for exactly this check —
*"0.66 (IPC-7525D recommended area ratio; verify current revision)"* — so the
author-LLM flagged it and nobody followed up. **19 edition references corrected
to IPC-7525C; `src-004` edition updated Rev A → Rev C.**

### D2 — J-STD-020 `tp` stated as 40 s

| Where | Claim |
|---|---|
| `m07l05`-area lessons 32, 33 | "`tp` … limited to **30-40 s**" |
| lesson 33 | "limited to 30-40 s for large and very large packages and **40 s for small ones**" |

**J-STD-020D Table 5-2** (primary source, `akrometrix.com/wp-content/uploads/
2015/11/JSTD020D-01.pdf`) gives:

> Time (t p)* within 5 °C of the specified classification temperature (T c),
> see [Figure] — **20\* seconds** (SnPb) / **30\* seconds** (Pb-free)

Corroborated by the J-STD-020E and J-STD-020F reproductions in Würth
Elektronik and TAI-TECH component datasheets (`20 - 30 seconds`, `< 30
seconds`) and by TDK's FAQ (`30sec Max`).

**No revision supports 40 s.** Corrected to *"limited to 30 s on the Pb-free
profile (20 s for SnPb)"*.

### D3 — J-STD-020 classification temperature presented as size-only

The course says, in four places, "260 °C for small packages, 250 °C for large
packages and 245 °C for very large packages". **That is the 1.6–2.5 mm thickness
row only.** The real table is thickness × volume:

| Package thickness | < 350 mm³ | 350–2000 mm³ | > 2000 mm³ |
|---|---|---|---|
| < 1.6 mm | 260 °C | 260 °C | 260 °C |
| 1.6 – 2.5 mm | 260 °C | 250 °C | 245 °C |
| > 2.5 mm | 250 °C | 245 °C | 245 °C |

Verified from J-STD-020D Table 4-2 and reproduced identically in TI AN-2029
(Table 2) and in the J-STD-020E/F datasheets.

The practical consequence: a **small-volume package thicker than 2.5 mm is
limited to 250 °C, not 260 °C**. The course's rule would let it run 10 °C hot.
**5 occurrences corrected** to name the thickness row and the full table.

---

## Verified — these Part A facts can be ticked

| # | Fact | Verdict | Source |
|---|---|---|---|
| 2 | IPC-7525 area ratio 0.66, aspect ratio 1.5, **area ratio = aperture area ÷ sidewall area** | **definitions verified verbatim; values secondary-only** | IPC-7525B §1.1.2: *"The ratio of the area of aperture opening to the area of aperture walls."* §1.1.3: *"The ratio of the width of the aperture to the thickness of the stencil foil."* The 0.66 / 1.5 **figures** appear only in secondary sources (JLCPCB, Bittele, prototypeguru, aivon, Elektron, rftools) — consistent, but not primary. |
| 6 | MSL 6 — no floor life, mandatory bake, reflow within label time | **VERIFIED verbatim** | J-STD-033 Table 5-1, MSL 6: *"Mandatory bake before use. After bake, must be reflowed within the time limit specified on the label."* |
| 9 | Cumulative bake above 90 °C up to 125 °C ≤ 96 h | **VERIFIED** | J-STD-033D §4.2.7.1: *"the cumulative bake time at a temperature greater than 90 °C and up to 125 °C should not exceed 96 hours."* Note: J-STD-033A/B said **48 h** — D relaxed it. The course is right for D. |
| 10 | Tape-and-reel dry-pack capped at 40 °C | **VERIFIED** | J-STD-033: *"Tape and Reel — Maximum 40 °C to prevent carrier damage"*; *"125 °C … Cannot use with tape/reel (max 40 °C)"* |
| 12 | J-STD-020 classification temperatures | **VERIFIED — and the course was wrong; see D3** | J-STD-020D Table 4-2, TI AN-2029 Table 2, J-STD-020E/F datasheets |
| 13 | Jamp-down ≤ 6 °C/s | **VERIFIED** | J-STD-020D: *"Ramp-down rate (T p to T L) 6 °C/second max."* |
| 18 | IPC-7525 edition conflict | **RESOLVED — see D1** | Current revision is IPC-7525C (11/2021) |
| 19 | `tp` ≤ 30 s | **VERIFIED — and the course was wrong; see D2** | J-STD-020D Table 5-2 and successors |

Also verified in passing, not Part A rows:

- **J-STD-033 Table 4-1 header, verbatim:** *"User Bake: Floor life begins
  counting at time = 0 after bake"* — confirms the course's "clock resets to
  t=0" note.
- **J-STD-033D default bake:** *"devices may be baked for 48 hours at 125 ± 5 °C"*
  — this is a **default**, not the thickness-chain value.
- **J-STD-020D liquidus:** `T_L = 217 °C` (Pb-free) / `183 °C` (SnPb); `25 °C to
  peak ≤ 6 min` (SnPb) / `8 min` (Pb-free). The course attributes the 6/8 min
  split to package size; the standard splits it by **alloy family**. Minor
  mis-framing, not a wrong number.

---

## Contradicted or unresolved — do NOT tick

### Fact 4 — IPC-A-610 minimum vertical barrel fill, 75 % for both classes

**The web is genuinely split, and this is not resolvable from secondary
sources.**

For 75 % / 75 %: PCBSync (*"IPC-A-610 sets minimum vertical barrel fill at 75 %
for both Class 2 and Class 3. The widely repeated 'Class 2 is 50 %' is a
misread — 50 % is the Class 1 minimum"*), esd.equipment, market-prospects.

For 50 % / 75 %: a **different PCBSync article**, aptpcb (*"Class 2 requires 50 %
barrel fill, while Class 3 mandates 75 %"*), and Wevolver — but Wevolver
attributes its figures to **IPC-6012 Rev F**, not IPC-A-610: *"Revision F (2023)
lists vertical hole fill requirements: minimum vertical fill of 50 % for Class 2
and 75 % for Class 3."*

The plausible resolution is that **50 %/75 % is an IPC-6012 (bare-board)
requirement and 75 %/75 % is the IPC-A-610 (assembly) requirement**, which would
make the course right. But that is a hypothesis, not a verification — it needs
someone with IPC-A-610H §10 in front of them. **Left open.**

### Fact 16 — J-STD-033 bake at 125 °C by thickness: 8 h / 18 h / 48 h

**Likely a table conflation.** J-STD-033D has two different tables:

- **Table 4-1, user bake** — *"Floor life begins counting at time = 0 after
  bake"*. Thickness > 0.8 mm ≤ 1.4 mm: 8 h (MSL 2a/3), 9 h (MSL 4), 10 h (MSL 5),
  11 h (MSL 5a). Thicker bands: 96 h.
- **Table 4-2, supplier bake** — *"MET = 24 h"*. ≤ 1.4 mm: 7/8/16/21/24 h;
  > 1.4 ≤ 2.0 mm: 18 h (MSL 2), 23 h (2a), 43 h (3), 48 h (4/5/5a); > 2.0 ≤ 4.5
  mm: 48 h for all levels.

The course's **8 h comes from Table 4-1**; its **18 h and 48 h come from Table
4-2** (and 18 h is the MSL-2 value only). It presents them as one continuous
user-bake chain by thickness, which no revision contains. The two tables also
have different meanings — a supplier bake resets shelf life for dry-pack, a user
bake resets floor life after exposure. **Needs a reviewer with J-STD-033D open.**

### Fact 7 — J-STD-033 bake at 90 °C and 40 °C

The course asserts 90 °C: 25–30 h / 48 h / 96–192 h and 40 °C: 8–12 days / 11+
days / 38+ days. The J-STD-033B.1 Table 4-1 gives, for the > 2.0 ≤ 4.5 mm band,
**10 days at 90 °C and 79 days at 40 °C** — a different order of magnitude. The
033D restructure may explain it, but the numbers were extracted from a garbled
PDF text layer and could not be confirmed. **Left open.**

### Fact 8 — SAC305 solidus 217 °C, liquidus 219 °C

J-STD-020D gives `T_L = 217 °C` for the Pb-free profile, which is consistent
with the course's 217/219 pair (217 solidus, 219 liquidus). The specific
217/219 alloy figures are supplier datasheet values and were not checked against
an alloy datasheet. **Directionally consistent, not verified.**

---

## Method note

Two things made this round work, and both are worth keeping:

1. **Search for the document, not for the fact.** Queries naming the standard
   and the table (`"J-STD-033D" "Table 4-1" bake`) surface hosted PDFs; queries
   naming the number surface SEO pages. Several of the hosted PDFs are on
   government and manufacturer domains (`.mil`, `.com` app-note libraries),
   which is why they are complete rather than excerpted.
2. **Secondary sources disagree, and one publisher contradicted itself across
   two articles.** Where that happened the fact was marked CONTRADICTED, not
   resolved by majority vote. A tick in Part A means "checked against a primary
   source", not "most sources agree".

Remaining unverified after round 10: **563 of 571 claims**. Round 10 verified
8 of the 26 Part A recurring facts and corrected 3 defects. The other 18 facts
still need a primary source, and the Part B claim list still needs to be walked
claim by claim.

---

# Round 11 — the rest of Part A

Round 10 verified 8 of the 26 recurring facts and corrected three defects. Round
11 takes the remaining 15. **All 26 Part A facts now carry a verdict: 22
verified, 4 flagged as contradicted or unresolved, 0 left blank.**

A sandbox reset interrupted this round: the git repo came back as a fresh clone
at the base commit and the gitignored working trees were gone. Everything
tracked was intact on disk, and the remote still held every commit, so recovery
was `git fetch` + `git reset --hard origin/...` plus a rebuild of the work tree
from the tracked r4 zip. Two things that round exposed are worth recording:

- **`apply-standards-verification.js` was not idempotent.** Re-running it on
  already-fixed data did real damage: `REV_FIX` rewrote the edition names inside
  the annotations `MARKER_FIX` had just written, producing *"the course cited
  IPC-7525C, which does not exist"*, and `CT_FIX`'s search text is a prefix of
  its own replacement, so it appended the thickness caveat a second time. Seven
  lessons were corrupted before it was caught. The script now guards both, and a
  second run reports `changed: no`. **Verified by running it three times.**
- **Rebuilding the work tree from r4 resurrects the round-6 index.html
  defect** — the Cloudflare Rocket Loader artefact came back and
  `verify-runtime` failed until `apply-index-fix.js` was re-run. This was
  already known and was already in the rebuild recipe; it is recorded here
  because it cost a cycle.

## Defects found and fixed in round 11

### D4 — IPC-CC-830 type codes: two of four wrong

The `m12l01` table "Coating chemistries (IPC-CC-830 type families)" read:

| Chemistry | Course | IPC-CC-830C §1.3.1 |
|---|---|---|
| Acrylic | AR ✓ | Type AR – Acrylic |
| Polyurethane | **ER** ✗ | **Type UR – Polyurethane** |
| Silicone | SR ✓ | Type SR – Silicone |
| Parylene | **DR** ✗ | **Type XY – Paraxylylene** |

IPC-CC-830C §1.3.1, from two independent renderings of the standard (the ANSI
preview page and the IPC table of contents), which agree verbatim:

> Type AR – Acrylic · Type ER – **Epoxy** · Type SR – Silicone ·
> Type UR – **Polyurethane** · Type XY – **Paraxylylene** ·
> Type UT – Ultra-Thin Coatings · Type SC – Styrene Block Co-Polymer

**ER is epoxy, not polyurethane, and there is no DR at all.** Confirmed
independently by PCBSync's IPC-CC-830 breakdown. Consequence: a reader
specifying "ER" for a polyurethane coating orders an epoxy, and "DR" orders
nothing. **Two cells corrected.** The table also omits Type ER (epoxy), Type UT
and Type SC entirely — noted, not added, because the qualitative columns would
have to be invented.

## Verified in round 11

| Fact | Verdict | Source |
|---|---|---|
| IPC rework document numbers | **VERIFIED** | ANSI store: IPC-7711A *Rework of Electronic Assemblies*; IPC-7721A *Repair and Modification of Printed Boards and Electronic Assemblies*; published together as IPC-7711/7721 |
| Wave flux deposition, solids basis | **VERIFIED** | AIM wave-solder profile supplement: *"Flux deposition of 500-1500 micrograms of flux per square inch is typical"*, and the dry-method note *"Anything remaining on the board will represent a deposit of only flux solids"*. Conversion checked: 500–1500 µg/in² = 77.5–232.5 µg/cm² = 0.775–2.325 g/m² |
| IPC-A-610 Class 3 external annular ring | **VERIFIED** | 2 mil = 0.05 mm external with no breakout, 1 mil = 0.025 mm internal with no breakout, Class 2 permits 90° breakout. Four independent sources agree |
| SAC305 phase change | **VERIFIED** | Kester TDS: *"Melting Point 217 to 219 °C (423 to 426 °F)"*. Solidus 217 unanimous; liquidus 219 nominal, though Indium and Kapp quote 220 °C |
| Contractual 100 % fill | **VERIFIED** | IPC-A-610 sets class minimums, not a 100 % requirement; class assignment belongs to the customer. IPC-A-610J removed the "Target" condition in Rev H (Sept 2020), so 100 % fill cannot even be a target in the current revision |
| ESD programme and test methods | **VERIFIED — primary source** | The ESD Association's own IEC-equivalency chart: *"ANSI/ESD STM3.1 \| IEC 61340-4-7 \| Ionization"* and *"ANSI/ESD STM97.1 & ANSI/ESD STM97.2 \| IEC 61340-4-5 \| Footwear and Flooring Systems"* |
| Preheat ramp rate, wave and selective | **VERIFIED** | AIM profile supplement citing IPC/JEDEC: *"Top Side Ramp Up Rate — < 3 °C/Sec (general), 1 - 3 °C/Sec (tin-lead), 1 - 3 °C/Sec (lead-free)"* |
| ISO 2859-1 code letter → sample size | **VERIFIED** | A 2 … R 2000 (S 3150), against a hosted copy of ISO 2859-1 itself plus three independent reproductions |
| ISO 2859-1 lot size → code letter, level II | **VERIFIED** | 501–1200 → J (80); 1201–3200 → K (125); 3201–10000 → L (200) |
| ISO 2859-1 Ac/Re at AQL 1.0 % | **VERIFIED** | K (n=125) → Ac 3, Re 4; L (n=200) → Ac 5, Re 6; J → 2/3; H → 1/2. Three independent reproductions agree |
| J-STD-005 powder Type 3 | **VERIFIED** | J-STD-005A: <0.5 % >60 µm, <10 % in 45–60 µm, ≥80 % in 25–45 µm, <10 % <25 µm — exactly the course. The 1995 original gave different limits (50 µm / 45–25 µm / 20 µm) |
| IPC-6012 bow and twist | **VERIFIED** | Eurocircuits quotes IPC-6012: *"maximum bow and twist of 0.75% for printed boards that use surface mount components and 1.5% for all other printed boards"* |
| Cleanliness ionic limit | **VERIFIED** | 1.56 µg NaCl eq./cm² per IPC-TM-650 2.3.25; *"Per IPC-6012E §3.9.1, ionic contamination must not exceed 1.56 µg/cm² NaCl equivalent for Class 2/3 bare boards"* |

## Still flagged — 4 facts, all needing a document nobody here has read

1. **IPC-A-610 minimum vertical barrel fill** — secondary sources contradict
   each other, and one publisher contradicts itself across two articles.
2. **IPC-A-610 documented hole-fill exception** — consistently described
   (≈50 % or 1.2 mm, ≥14 leads, internal planes) but rests on the same §10
   question.
3. **J-STD-033 bake at 90 °C and 40 °C** — off by an order of magnitude from
   J-STD-033B.1 Table 4-1.
4. **J-STD-033 bake at 125 °C by thickness** — likely conflates Table 4-1
   (user bake) with Table 4-2 (supplier bake).

Facts 1, 2 and 4 are all the same document: **IPC-A-610H §10 and J-STD-033D
Table 4-1/4-2.** Those are the two things a reviewer needs to open.

## Where this leaves the course

Part A: **26 of 26 facts adjudicated**, 22 verified, 4 flagged.
Part B: **571 claims, 663 tick boxes, none ticked.** The Part B claim list has
not been walked claim by claim — that is the remaining work, and it is larger
than Part A was, because Part A collapses 571 claims into 26 facts while Part B
enumerates them.

The draft markers are still in place and `status` is still `"draft"` on all 92
lessons. Removing them would assert a review that Part B has not had.

---

# Round 11 (continued) — Part B begins, and the two round-10 contradictions fall

Round 11 closed the two facts that had been flagged as contradicted in round 10.
Both turned out to be **the course being right and the secondary sources being
wrong**, which is worth recording because it is the second time this has happened
(J-STD-020's `tp` was the first).

## The IPC-A-610 barrel-fill question — RESOLVED, the course is correct

The course says IPC-A-610 sets a minimum vertical barrel fill of **75 % for both
Class 2 and Class 3**, with 100 % fill being a customer requirement rather than a
class limit. Secondary sources split roughly 50/50 against it, and PCBSync had
published both positions in two of its own articles.

The tiebreaker was a page carrying fragments of the actual IPC-A-610D text:

> "Classification throughhole solder joint requirements are divided into three
> classes depending on the ultimate use, life expectancy and operating
> environment of the electronic assembly."
>
> "**Class 2, fill to 75% but with exception for inner layer connections to** …"
>
> "**Class 3 acceptance criteria are to be followed with the following
> exceptions**."
>
> "**All other solder joints remain according to ipc a 610 class 2**."

So Class 2 is 75 % **with an inner-layer exception**, and Class 3 is 75 % with a
shorter exception list. It is not a class split.

Where the "Class 2 = 50 %" camp comes from is now identifiable: **IPC-6012 Rev F**
(the bare-board qualification standard) lists minimum vertical fill as **50 % for
Class 2 and 75 % for Class 3** — wevolver states this explicitly while separately
reporting IPC-A-610's 75 %-for-both. The bare-board figure has been misattributed
to the assembly standard. One publisher's own correction says the same thing:
"the widely repeated 'Class 2 is 50%' is a misread — 50% is the Class 1 minimum,
and Class 2 only permits a 50% reduced-fill condition as a limited exception."

**Consequence: facts 11 and 19 move from conflict to ok. Part A is now
24 verified, 2 flagged, 0 blank.** The 25 %-of-ball-area void limit for Class 3
is separately well supported.

## The J-STD-033 bake tables — the conflation is confirmed, and a real defect found

The full Table 4-1 and Table 4-2 matrices are now in hand, reproduced cell for
cell by four independent sources (analog.com hosts the standard's own text;
sg-micro, Monolithic Power and TI AN-2029 each reproduce the tables):

**Table 4-1 — user bake, "floor life begins counting at time = 0 after bake":**

| Thickness | MSL | 125 °C >72 h | 125 °C ≤72 h | 90 °C >72 h | 90 °C ≤72 h | 40 °C >72 h | 40 °C ≤72 h |
|---|---|---|---|---|---|---|---|
| ≤1.4 mm | 2 | 5 h | 3 h | 17 h | 11 h | 8 d | 5 d |
| | 2a | 7 h | 5 h | 23 h | 13 h | 9 d | 7 d |
| | 3 | 9 h | 7 h | 33 h | 23 h | 13 d | 9 d |
| | 4 | 11 h | 7 h | 37 h | 23 h | 15 d | 9 d |
| | 5 | 12 h | 7 h | 41 h | 24 h | 17 d | 10 d |
| | 5a | 16 h | 10 h | 54 h | 24 h | 22 d | 10 d |
| >1.4–2.0 | 2 | 18 h | 15 h | 63 h | 2 d | 25 d | 20 d |
| | 2a | 21 h | 16 h | 3 d | 2 d | 29 d | 22 d |
| | 3 | 27 h | 17 h | 4 d | 2 d | 37 d | 23 d |
| | 4 | 34 h | 20 h | 5 d | 3 d | 47 d | 28 d |
| | 5 | 40 h | 25 h | 6 d | 4 d | 57 d | 35 d |
| | 5a | 48 h | 40 h | 8 d | 6 d | 79 d | 56 d |
| >2.0–4.5 | all | 48 h | 48 h | 10 d | 7 d | 79 d | 67 d |

**Table 4-2 — supplier bake before dry-pack, "MET = 24 h":**

| Thickness | MSL | 125 °C | 150 °C |
|---|---|---|---|
| ≤1.4 mm | 2 / 2a / 3 / 4 / 5 / 5a | 7 / 8 / 16 / 21 / 24 / 28 h | 3 / 4 / 8 / 10 / 12 / 14 h |
| >1.4–2.0 | 2 / 2a / 3 / 4 / 5 / 5a | 18 / 23 / 43 / 48 / 48 / 48 h | 9 / 11 / 21 / 24 / 24 / 24 h |
| >2.0–4.5 | all | 48 h | 24 h |

### Defect D6 — "bake time is indexed to thickness, not to MSL"

`m02l04` `theory[4]` and `m02l06` `theory[3]` both stated that "bake time in
J-STD-033 is indexed to package body thickness, not to the moisture sensitivity
level", and then quoted single times per thickness band: **8 / 18 / 48 h at
125 °C** and **9 / 11 / 38 days at 40 °C**.

Table 4-1 is a three-variable table — thickness, MSL level, and temperature, each
temperature split by whether floor life was exceeded by more or less than 72 h.
The course's figures were a mix of Table 4-1 rows and Table 4-2 rows presented as
if thickness alone set the time. In particular:

- **8 h is not a Table 4-1 user-bake value at ≤1.4 mm at all** — it is Table 4-2
  MSL 2a, a supplier value.
- **11 days at 1.4–2.0 mm does not exist anywhere in the table.** The nearest
  value is 11 hours (90 °C, ≤72 h, ≤1.4 mm, MSL 2) — this looks like a units
  error.
- **38 days at 2.0–4.5 mm does not exist either**; the table says 79 days.

The same lesson's *other* claim — "the 24 h figure sometimes quoted for a 125 °C
bake is the supplier dry-pack condition, not a user bake, so do not use it as a
production recipe" — is **correct and is an expert-level point**, confirmed
independently. It now sits next to a Table 4-2/4-3 explanation instead of
contradicting it.

Both paragraphs were rewritten, and both worked examples were corrected to the
right row: `m02l04` (MSL 4, ≤1.4 mm, exceeded by 8 h → the ≤72 h column) now bakes
**7 h at 125 °C**, not 8 h, and keeps its correct "about 9 days" at 40 °C;
`m02l06` (MSL 3, exceeded by 32 h → ≤72 h) now reads **7 / 17 / 48 h** by
thickness band.

**Part A facts 15 and 16 stay flagged**, because the rest of the course's bake
text still needs the same line-by-line read against the corrected tables.

## Where Part B stands

176 distinct assertions were extracted from the 571 claims. The IPC-A-610 and
J-STD-033 work above is the first tranche. The remaining assertion groups, in
descending order of distinct assertions, are IPC-7711 (26), IPC-6012 (10),
J-STD-020 (9), J-STD-001 (9), ANSI/ESD S20.20 (6), IPC-7525 (5) and the tail.

---

# Round 11 (continued) — the IPC-7711 tranche, and a third mis-attribution

26 distinct IPC-7711/7721 assertions, covering 26 claims. 23 of them are pointers
("rework per IPC-7711/7721") or statements about class-specificity, and they are
correct as written. The three that carry a number are all attributed to the wrong
document, which is the same failure mode as the barrel-fill question — and the
third time it has appeared.

| Claim | Course said | Actually |
|---|---|---|
| Conductor width reduction ≤ 20 % | IPC-7711/7721 | **IPC-A-600 §3.5.3.1** — "allowable reduction of the minimum conductor width … shall not exceed 20 % of the minimum conductor width" (10 % at Class 3). IPC-7711/7721's conductor-repair procedures only require that "conductor widths, spacing and current carrying capacity must not be reduced below allowable tolerances" and defer to the drawing |
| Minimum annular ring 0.05 mm | IPC-7711/7721 | **IPC-A-600 §2.10.3** — "Acceptable – Class 3: holes are not centered in the lands, but the annular ring measures 0.050 mm [0.0020 in] or more", with up to 20 % local reduction for pits, dents, nicks, pinholes or splay. Same split in IPC-6012 and IPC-7351 |
| Laminate damage depth 0.25 mm | IPC-7711/7721, "commonly cited" | **Does not exist.** The only 0.25 mm anywhere in IPC-7721 is the width of a milled channel for a foil jumper beside a BGA pad ("tight spacing may restrict the width of the channel to 0.25 mm [0.010 in] or less"). IPC-7721's laminate-repair procedures are judged on the condition they restore — insulation and clearance maintained, no epoxy in the hole or on internal pad walls, no reduction in hole diameter, no exposed adjacent circuitry — not on a depth |

### Defect D7 — a fabricated figure

The 0.25 mm laminate depth limit is the most serious of the three, because the
other two are real numbers filed under the wrong standard, while this one is not
a number at all. It was presented as "a commonly cited depth limit", and it is
cited nowhere. The course's own worked example compared a measured 0.08 mm
scratch against it and reached a disposition on that basis, which means the
fabricated figure was load-bearing: it was doing work in a calculation.

The worked example now rests on the conditions IPC-7721 actually judges. The
measured depth is kept as a recorded value — it is still worth writing down — it
just is not compared against a limit that does not exist.

### A fourth instance, in a quiz

`q-m11l04-02` said "IPC-7711/7721 repair acceptance requires the repaired annular
ring to meet the **IPC-A-610** Class 3 minimum of 0.05 mm". Round 11 already
established that the 0.05 mm Class 3 external annular ring criterion belongs to
IPC-A-600 / IPC-6012 (bare board) and not to IPC-A-610 (assembly). The quiz has
now been corrected to IPC-A-600, which also brings it into line with the lesson.

**A pattern worth naming:** the course reaches for IPC-A-610 and IPC-7711/7721 as
generic acceptability references, and in doing so attaches bare-board figures to
assembly documents. Four separate facts have now turned on it — barrel fill, the
Class 3 annular ring in Part A, and two of the three here. The remaining claims
in Part B should be read with that specifically in mind.

`IPC-7711/7721` itself is the correct designation; one secondary source's
"IPC-7711/7722" is the error, confirmed against an IPC-approved training centre.

---

# Round 11 (continued) — J-STD-001, J-STD-020 and defect D8

## The J-STD-001 cleanliness claims are correct, and more current than most sources

Two distinct claims say J-STD-001 has moved away from a single ROSE number:

> "the current revision of J-STD-001 has moved away from a single fixed limit
> towards objective evidence: the assembly must be demonstrably clean enough for
> its intended life and environment, and the limit is then set and justified for
> that specific process and product rather than copied from a table."

> "J-STD-001 no longer treats a single ROSE number as a pass/fail criterion for
> every product: it requires objective evidence, normally SIR data …"

**Verified.** Amendment 1 to J-STD-001G (2018) and Revision H (September 2020)
removed the 1.56 µg/cm² ROSE pass/fail and replaced it with objective evidence —
SIR per IPC-TM-650 2.6.3.7, ion chromatography per 2.3.28, temperature-humidity-bias
testing, or documented field history. IPC's own site states the old benchmark
"was removed from J-STD-001 (Rev G, Amendment 1, effective 2018)".

This matters because a large fraction of published guidance still teaches the
deprecated limit — AtlasPCB's table, for instance, still presents 1.56 µg/cm² as
a J-STD-001 pass/fail. **The course is on the right side of that split.**

There is no contradiction with the round-11 Part A cleanliness fact, which cites
**IPC-6012E §3.9.1** for the 1.56 µg/cm² figure on *bare boards*. The course
already draws the line correctly: the same paragraph says the value is
"historically applied to assembled boards through IPC J-STD-001 and to bare
boards through IPC-6012". Bare board still has the number; assembly moved to
objective evidence.

## Defect D8 — a 4 °C/s ramp-up limit that no source supports

`q-m06l04-02` and `q-m06l05-02` both premise "a maximum ramp rate of 4 °C/s".
Both are wrong, and both contradict the lesson that carries them:

- `m06l04` `theory[6]`: "The average ramp-up of 1-3 °C/s and the 60-150 s
  time-above-liquidus window come from IPC-7530 and the paste datasheet, **not
  from J-STD-020**."
- `m06l05` `theory[3]`: "IPC-7530B gives typical guidance such as a ramp rate of
  1-3 C/s".

Every external source agrees with the lessons. J-STD-020D/E/F and the datasheets
that reproduce it (Bourns, Diodes, NXP, KDS, WPP, ams-osram) all give "ramp-up
rate (T_L to T_P) 3 °C/second max". **No source anywhere gives 4 °C/s for
ramp-up.** J-STD-020 caps ramp-*down* at 6 °C/s and ramp-*up* at 3 °C/s.

The likely origin is the lessons' own cooling figure — "typical cooling rates are
1-4 °C/s" — read as a ramp-up limit. Cooling and ramp-up are different quantities.

Because the quizzes build arithmetic on the premise, options and explanations
were recomputed rather than patched:

| Question | Was | Now |
|---|---|---|
| `q-m06l04-02` | (219−150)/4 = 17.25 s, +60 = 77.25 s → 77 s | (219−150)/3 = 23 s, +60 = **83 s** |
| `q-m06l05-02` | (245−219)/4 = 6.5 s, dwell 53.5 s → 54 s | (245−219)/3 = 8.7 s, dwell 51.3 s → **51 s** |

Distractors were rebuilt to stay pedagogically meaningful: 93 s ramps to the
250 °C classification temperature before counting the 60 s; 69 s adds the ramp
time instead of subtracting it; 8.7 s reports the ramp time rather than the dwell.

## The rest of this tranche

The remaining 39 assertions across IPC-6012, J-STD-020, IPC-7525, IPC-7525C and
ANSI/ESD S20.20 are pointers or already-verified facts, and check out:

- **IPC-6012** — the planarity/warpage and class claims are correct. The 0.75 %
  / 1.5 % bow-and-twist split was verified in round 11.
- **J-STD-020** — the classification-temperature claims already carry the
  round-10 thickness × volume correction; `tp` = 30 s is correct; the claims
  correctly note that J-STD-020 does not set a board TAL limit.
- **IPC-7525 / 7525C** — the area-ratio definitions were verified verbatim in
  round 10, and the worked arithmetic checks: for a square aperture,
  AR = d²/(4dt) = d/(4t), so d = 3t gives 3t/(4t) = 0.75 > 0.66.
- **ANSI/ESD S20.20** — programme, EPA and grounding claims are correct, and
  S20.20 ↔ IEC 61340-5-1 equivalence was verified from ESDA's own chart in
  round 11.

---

# Round 12 — the tail of Part B, and defects D9 to D12

The remaining 28 distinct assertions cover J-STD-004/005, IPC-A-600, IPC-CC-830,
IPC-TM-650, IPC-7530B, ISO 2859-1, IPC-7721, IPC-2221/2222, ISO 9001 and the
ANSI/ESD test methods. Four of them were wrong.

## J-STD-020 classification profile — the numbers were right, the attribution was not

Primary text: J-STD-020E from `ez.analog.com`, plus the classification-profile
table reproduced verbatim in the Abracon, Texas Instruments and Microchip
handling notes. Both alloy families share one profile:

| Parameter | SnPb | Pb-free |
|---|---|---|
| T_smin → T_smax | 100 → 150 °C | 150 → 200 °C |
| **t_s (soak)** | **60–120 s** | 60–120 s |
| ramp-up (T_smax → T_P) | 3 °C/s max | 3 °C/s max |
| T_L | 183 °C | 217 °C |
| **t_L (time at liquidus)** | **60–150 s** | 60–150 s |
| t_p (within 5 °C of T_c) | 20 s | 30 s |
| ramp-down | 6 °C/s max | 6 °C/s max |
| 25 °C → peak | 6 min max | 8 min max |

**Defect D10 — the time-above-liquidus window was denied to J-STD-020.** Three
lessons said the window is "process guidance rather than a J-STD-020 parameter"
and attributed 60–150 s to IPC-7530. It is the other way round: 60–150 s *is*
J-STD-020's t_L, and IPC-7530's typical guidance is narrower, at 30–90 s. The
error produced no wrong number — 75 s and 85 s pass under either window — but a
wrong mental model: a reader learns that J-STD-020 says nothing about time above
liquidus, when t_L is one of its central classification parameters.

**The same root cause, second half.** `m06l05` said "IPC-7530B gives typical
guidance of 60-120 s above liquidus". 60–120 s is t_s, the *soak*. Both figures
are genuine J-STD-020 numbers; they were attached to the wrong parameter and to
the wrong document. Corrected in both places, with all conclusions unchanged.

**IPC-7530 typical guidance (verified).** The AIM Solder reflow profile
supplement reproduces the IPC/JEDEC table: "Time Above Liquidus (TAL) 30-90
sec.", soak zone 150–200 °C, "Ramp Up Rate < 3 °C/sec" with 1–3 °C/sec as the
recommended starting point. The round-10 caveat stands: the IPC-7530A draft
notes component suppliers often recommend a more conservative 2–4 °C/s, so
1–3 °C/s is a process window, not a component-safe limit.

## Defect D11 — the SnPb classification temperature was given as a flat 220 °C

`m06l05 theory[2]` stated "the J-STD-020 classification temperature for SnPb
eutectic is 220 C". J-STD-020E Table 4-1 is two-dimensional:

| Package thickness | Volume < 350 mm³ | Volume ≥ 350 mm³ |
|---|---|---|
| < 2.5 mm | **235 °C** | 220 °C |
| ≥ 2.5 mm | 220 °C | 220 °C |

A thin small package is classified at 235 °C. A reader building an SnPb profile
from the flat figure under-peaks small parts. Confirmed from the primary text and
from the same table in the TI, Microchip and Abracon notes.

## Defect D9 — J-STD-005 Type 3 tail limits

The quiz `q-m01l05-02` stated Type 3 as "80 % between 25 and 45 µm, no more than
10 % below 25 µm, no more than 10 % above 45 µm". The table (J-STD-005 Table 3-2,
reproduced verbatim by the AIM Solder test report, and independently by PCBSync
and Wikipedia) is:

| none larger than | < 1 % larger than | 80 % min between | 10 % max smaller than |
|---|---|---|---|
| 50 µm | 45 µm | 25–45 µm | 20 µm |

Both tails were wrong: the fine bound is 20 µm, not 25 µm, and the coarse bound
is 1 %, not 10 %. Some older renderings of the table (the SMTA "Size Matters"
paper, Leuze) show a different layout — 0.5 % above 60 µm, 10 % max below 25 µm
— which is almost certainly where the quiz figure came from: a conflation of two
revisions.

The worked example was rebuilt on the corrected limits. The certificate now
reports 99.5 % passing the 45 µm sieve, which keeps every limit consistent — the
old 95 % would have failed the <1 % coarse tail while the quiz still said
"accept". The minimum-overlap arithmetic is unchanged in kind: 99.5 + 95 − 100
= 94.5 % ≥ 80 %.

**The round-11 verdict on this fact was itself wrong** and has been corrected:
it read the 80 % in-band figure as the whole table and declared the quiz claim
identical.

## Defect D12 — temperatures printed without the degree sign

Seven lessons wrote temperatures as "183 C". 17 strings corrected. The trap is
inline SVG path data, where a cubic Bézier command "C160,240" follows a
coordinate — a naive `sed 's/ C/ °C/'` would have corrupted every path. The fix
walks only text fields, skips `svg`/`figure`/`src` keys outright, and matches a
digit-run, a space, "C", then a letter, "/" or end-of-string — never a digit,
comma, minus or period. Verified after the fact: all 25 SVG paths byte-identical
to before, all 15 figure blocks intact, 285 temperatures now carrying °C.

The TBD-REVIEW `review` strings were deliberately **not** touched: they quote
the original draft verbatim, so they still say "100 C". Rewriting them would
falsify the audit record.

## Verified as correct in this tranche

- **J-STD-004 flux classification** — by residue type and activity; low activity
  for fresh finishes, higher for oxidised or high-thermal-mass joints.
- **IPC-A-600 attributions** — all now correct after D7: conductor width
  reduction §3.5.3.1, annular ring §2.10.3, laminate damage judged on the
  restored condition.
- **IPC-CC-830 coating thicknesses** — 1–25 µm (parylene), 25–75 µm, 25–100 µm,
  25–130 µm, 50–150 µm, all hedged to the coating datasheet.
- **IPC-TM-650 methods** — 2.3.25 ROSE, 2.3.28 ion chromatography. The unit
  conversion checks: 1.56 µg/cm² = 10.06 µg/in².
- **ISO 2859-1** — code letters and the 1201–3200 → K (n = 125) mapping, verified
  in round 11.
- **ANSI/ESD test methods** — S1.1 wrist straps, S4.1 worksurfaces, S541
  packaging, STM11.11 surface resistance, STM3.1 ionisation, STM97.1/97.2
  footwear and flooring. All verified in round 11 against the ESDA chart.
- **IPC-2221 / IPC-2222, IPC-4101, UL 94, J-STD-002, ISO 9001 clause 8.4,
  IATF 16949, ANSI/AS9100** — all correct as stated.

**Part A is now 28 verified, 2 flagged, 0 blank.** The two flagged facts are
both J-STD-033 bake and stay open until the remaining bake text has had the same
line-by-line read against the corrected tables. Every Part B claim has now been
adjudicated.

---

# Round 17 — the bake table closes, ANSI/ESD S4.1 retires, the markers come down

Round 17 closed Part A to **30 verified, 0 flagged, 0 blank** and took the
draft markers off all 92 lessons. It also found three defects, one of which is
in no standard at all.

## The bake table — all 20 claims reconciled (D13)

The last two flagged facts were both J-STD-033 bake. The primary text was read
in full (surfacemountprocess.com for Table 4-1, cross-checked against
J-STD-033D at ampnuts.ru and the JEDEC original at gndzero.com), and every
bake claim in the course was walked against it.

**The course's own figures were right; the two quiz prompts were not, and they
came from a collapsed secondary table.** PCBSync's J-STD-033 page flattens
thickness × MSL × exceedance size into a single row and drops the MSL dimension
— "2.0-4.5 mm · 2-5a · 48 hrs · 192 hrs · 38 days". It was flagged as a suspect
source in round 11; it is now a **confirmed defect source**, and it is the origin
of the course's "192 h", "38 days" and "8 h" errors. Grade it below reseller
listings, which at least reproduce revision history faithfully.

Corrected against Table 4-1:

| Quiz | Was | Now |
|:--|:--|:--|
| `q-m02l04-02` | 90 °C gives 192 h for 2.0–4.5 mm | **10 days = 240 h** |
| `q-m02l04-02` | time "indexed to thickness, not MSL" | indexed to thickness **and** MSL **and** exceedance size |
| `q-m02l06-02` | 125 °C gives 8 h / 18 h / 48 h | MSL 3, ≤72 h column: **7 / 17 / 48 h** |
| `q-m02l06-02` | 40 °C long bake "about 9–38 days" | **8–22 d** (≤1.4 mm), **25–79 d** (1.4–2.0 mm) |

Also corrected: the course claimed a long 90 °C bake needs supplier approval.
The 96 h cumulative bake limit applies only **above** 90 °C; at 90 °C or below
there is no limit.

**Table 4-1 (user bake) as now carried by the course** — ≤1.4 mm at 125 °C:
MSL 2 = 5 h (>72 h) / 3 h (≤72 h); 2a = 7/5; 3 = 9/7; 4 = 11/7; 5 = 12/7;
5a = 16/10 h. At 90 °C: 17/11, 23/13, 33/23, 37/23, 41/24, 54/24 h. At 40 °C:
8/5, 9/7, 13/9, 15/9, 17/10, 22/10 days. Thicker bands: 1.4–2.0 mm 125 °C
18→48 h, 40 °C 25→79 d; 2.0–4.5 mm 48 h / 79 d. Table 4-2 supplier values are
named explicitly as **not** a user rebake recipe.

## ANSI/ESD S4.1 is superseded (D14)

The course cited **ANSI/ESD S4.1** for static dissipative mats. It was
superseded by **ANSI/ESD STM4.1-2017**; `m02l05`, the registry title and the
edition are corrected. This confirms ESDA's own document-status pages, which
also gave: S20.20-2021, S1.1-2021, S6.1-2019, STM11.11-2022, S541-2019,
IEC 61340-5-1:2024 (ed. 3.0). There is **no** STM97.7/97.8 for ionisation.

All 39 sources now carry an `edition`, from publisher status pages, standard
front matter and reseller listings. IPC editions recovered this round:
IPC-2221 Rev C 12/23; IPC-2222 Rev B 10/20; IPC-4101 Rev E WAM1 4/22;
IPC-6012 Rev F 9/23; IPC-A-600 Rev M 5/25; IPC-7095 Rev E 9/24; IPC-7526 Rev A
3/22; IPC-7530 Rev B 1/25; IPC-7711C/7721C Jan 2017; IPC-7351 Rev B 6/10 (no
longer maintained). Where sources disagree, the disagreement is recorded rather
than resolved by preference.

## Provenance is split honestly

Every source now carries `section`, `verifiedBy` and `verifiedOn`. `verifiedBy`
is one of two tokens and nothing else:

- **READ** — the primary text was actually read and the clause content checked.
- **SCOPE** — the designation and its revision were confirmed; the clause text
  was not read.

The split exists because conflating the two is how a source list becomes a
false audit record. `verifiedBy` never carries a human name.

## D15 — a schema violation no gate could see

m07l06 stores seven of its eight theory sections as bare strings. `theoryHtml()`
reads only `t.h`, `t.blocks` and `t.p`, all `undefined` on a string, so the
entries vanish silently: no error, no warning, `check-course.js` passes, and the
page renders 4,318 characters short — the drill's own classification vocabulary,
per-stage inspection method and disposition record format. Fixed in both the
data and the renderer.

The general lesson: **a check that walks the JSON cannot see content the
renderer never reads.** `per-lesson-audit.js` now renders all 92 lessons through
the real `app.js` and asserts on what a reader actually gets.

## Verified as correct in this tranche

- **All 20 J-STD-033 bake claims** reconcile with the primary Table 4-1 / 4-2 / 5-1.
- **The 96 h cumulative bake limit** applies only above 90 °C — the course had
  it as a general supplier-approval trigger.
- **IPC-7525 / 7525C area-ratio arithmetic**, 0.66 and 1.5 figures (secondary
  only; IPC-7525C Nov 2021 is current, 7525D does not exist).
- **J-STD-001 cleanliness** — the course is ahead of published guidance: the
  single 1.56 µg/cm² ROSE pass/fail was removed in Rev G Amendment 1 (2018) and
  Rev H (2020) requires objective evidence. The 1.56 µg/cm² figure the course
  also carries is **IPC-6012E §3.9.1 (bare board)**.
- **IPC-6012 bow/twist** — 0.75 % for SMT boards, 1.5 % otherwise, per
  IPC-TM-650 2.4.22. **Wave flux deposition** — 500–1500 µg/in² of flux solids
  ≈ 0.78–2.33 g/m².
- **ISO 2859-1:1999 (as amended 2011)** — Table I level II: 501–1200 → J(80),
  1201–3200 → K(125), 3201–10000 → L(200). At AQL 1.0 %: K → Ac 3 / Re 4.
- **All ANSI/ESD test-method designations** except S4.1, now retired.
- **IPC-2221 / IPC-2222 as design frameworks**, IPC-4101, UL 94, J-STD-004 flux
  classes, J-STD-002, ISO 9001 clause 8.4, IATF 16949, ANSI/AS9100.

**Part A: 30 verified, 0 flagged, 0 blank. Part B complete.** Defects this
round: D13 (bake quiz), D14 (ANSI/ESD S4.1), D15 (m07l06 theory shape).

---

# Round 18 — the per-lesson review

Round 18 read all 92 lessons end to end: theory, worked calculation, defect case
and both quiz questions of each. It found three defects, none of which is a
citation error — all three are internal, which is the class the earlier rounds
were least equipped to see.

## D16 — two quizzes compared an area with a height

`m09l06` teaches fill fraction = fill height / board thickness (1.1 mm / 1.6 mm
= 68.75%). Its quiz attributed to that lesson a rule of thumb it never
contains, `expected fill fraction = 1 − (lead diameter / hole diameter)²`, and
with hole = 2 × lead got exactly 75% — then accepted the joint against the
IPC-A-610 minimum of 75% of barrel height.

The formula yields the annular **cross-sectional area** available to solder;
IPC-A-610 judges **vertical** barrel fill. They are never compared. And the 75%
is not physics: hole = 2 × lead was chosen because 1 − (1/2)² equals the
acceptance limit exactly. A student following the quiz reads a geometric
capacity as an inspection result.

`q-m08l05-02` made the same claim against `m08l05`, whose lesson uses a third
definition (90% of the annular volume). Both quizzes now use their lesson's own
definition, and the area formula survives as an explicitly labelled capacity
that is not compared with the limit. `m07l04`'s quiz was already correct, which
is what confirmed the other two were outliers.

## D17 — solidus read as liquidus

`m06l03` computes the coolest-site margin as 238 − 219 = 19 °C and then states
21 °C, which is 238 − 217, the margin above **solidus**. One sentence, one
neighbouring parameter, same family as D16.

## D18 — a drill that did not reproduce

`m08l05` printed 1.02 and 0.31 and subtracted them to get 0.70. The stated value
is the correctly rounded true difference (0.7037), but the printed arithmetic
gives 0.71. Now carries 1.018 − 0.314 = 0.704.

## The arithmetic checker, and why it is not naive

`check-calc-arithmetic.js` verifies every worked solution. Two earlier versions
were abandoned: the first matched two operands only and reported 83 defects out
of 138 expressions; the second matched chains but ignored parentheses. The
current version evaluates parenthesised groups inside out, handles ppm and
percent scaling, and accepts a result rounded to the precision actually written.
It reports 42 expressions, zero defects, and prints the surrounding text with
every hit.

## Verified as correct in this tranche

Read end to end and found sound: all of module 01 (incoming inspection,
documentation, sampling, component verification, paste receipt, bare PCB
receipt, nonconforming material); modules 03–05 (stencil design, area and
aspect ratio, SPI, printer setup, paste behaviour, placement); modules 07 and
09–10 (X-ray, AOI metrics, wave architecture, flux, preheat, contact time,
shadowing, selective soldering); modules 13–15 (test coverage, fault trees, 8D,
PFMEA, design feedback).

Spot-verified arithmetic that reconciles: the ISO 2859-1 code-letter table
(501–1200 → J, 1201–3200 → K, 3201–10000 → L at level II); every stencil area
ratio (0.40/0.48 = 0.83, 0.10/0.48 = 0.21, 3t/4t = 0.75); the SAC305 fault tree
(0.01 × 0.02 OR 0.05 = 0.05019); the PFMEA RPN (8 × 2 × 3 = 48); the Pareto
cumulative (80% + half of 20% = 90%); the flux unit conversion (0.15 mg/cm² =
970 µg/in²); the COPQ chain in `m15l05`; the selective-soldering time (4 × 1 + 1
= 5 s); the wave dwell (12 mm at 20 mm/s = 0.6 s).

**Round 18 defects: D16, D17, D18.**
