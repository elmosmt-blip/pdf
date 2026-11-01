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
