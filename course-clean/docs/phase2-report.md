# Phase 2 — source currency. Report

Scope: the three numeric conflicts found in Phase 1, and a registry of every
edition-dependent claim in the course. Course content stays English; this
report is the Russian-facing summary and lives outside `build/`.

Sources of truth used for editions: **one primary artefact only** — the Global
Electronics Association (IPC) standards revision table,
<https://www.electronics.org/ipc-document-revision-table>, read on 2026-10-31.
Vendor and SEO pages were used for *practice* figures (dry storage, squeegee
pressure, wave dwell) but **not** for edition facts: they contradict each
other, and one of the contradictions is real (see §5).

---

## 1. The three conflicts — what changed

| # | Lesson | Was | Now | Basis |
|---|---|---|---|---|
| 1 | m02l04 | dry storage "10 % RH or less" as the requirement | **5 % RH or less** is the requirement; 10 % RH kept **only** as a lower-cost mitigation that slows the clock without stopping it | J-STD-033 dry-storage condition; industry MSL guides agree that a 10 % cabinet gives partial protection only |
| 2 | m04l03 / m04l07 | 0.8–1.2 N/mm (m04l03) and an absolute **5–15 N** (m04l07) | one normalised band, **0.2–0.6 N/mm of blade length** (= 0.5–1.5 kg / 25 mm), always quoted **with the blade length**; the absolute range is gone | AIM Solder and printer-setting guides: 1–1.5 lb/in (0.45–0.70 kg/25 mm); fine-pitch guidance 0.3–0.5 kg/25 mm. 0.8–1.2 N/mm was 2–6× too high; a bare 5–15 N cannot be checked without a blade length |
| 3 | m09l04 | dwell window "6–12 s", worked example 10.8 s "inside the window" | window **2–5 s** (3–5 s lead-free, up to ~6 s only for heavy boards or dual wave); the 10.8 s example is now **outside** the window and the solution raises the line speed | Published wave practice: 2–4 s typical, 3–5 s lead-free. 6–12 s appears in no source |

Consequential edits so the lessons stay internally consistent:

- **m04l03** — the calc no longer "fixes" a pressure that was in range all
  along; 0.5 N/mm is now correctly *inside* the band, so the first adjustment
  becomes the slower print stroke, which is what the defect case actually
  describes. The defect `cause` and `action` were rewritten to match.
- **m04l07** — baseline pressure 8 N → 100 N on the 250 mm blade (0.4 N/mm);
  the "increase pressure by 1 N" step is now a per-length step (0.1 N/mm = 25 N).
- **m09l04** — solution steps 1–3 recomputed (10.8 s → 2.7–3.6 m/min to reach
  the window), the defect cause now names wave height first and the speed second.
- **m09l06** — "3 to 6 s" → "2 to 5 s (3 to 5 s lead-free)"; the 2.5 s case
  value is now described as *inside the window but short of the lead-free band*
  instead of below a range.
- **6 questions** rewritten with them: `q-m04l03-02`, `q-m04l03-05`,
  `q-m09l04-05`, `q-m09l04-e3` (options and keys recomputed), plus the two
  explanations that carried the old numbers.

## 2. Source editions — current state

Five statuses, assigned by script from the IPC table, never by hand:

| Status | Entries | Meaning |
|---|---|---|
| current | 11 | course edition == publisher edition |
| superseded | 7 | newer edition exists, course claims were **not** re-read |
| edition-mismatch | 2 | the entry's own label disagrees with the text that was read |
| no-longer-maintained | 2 | document frozen at the cited edition |
| not-ipc / rolling | 17 | ANSI/ESD, IEC, ISO, UL, IPC-TM-650, supplier docs |

Edition facts now recorded per source (`data/sources.json`):
`currentEdition`, `editionStatus`, `currentCheckedOn`, `currentSource`,
`editionNote`, and `scopeOnly`.

| Document | In course | Publisher lists today |
|---|---|---|
| IPC-A-610 | Rev H | **Rev J** (March 2024) |
| J-STD-001 | Rev G | **Rev J** (April 2024) |
| J-STD-020 | Rev D (text read = E) | **Rev F** (November 2022) |
| J-STD-033 | Rev D | Rev D — **no longer maintained** (E is a project, not published) |
| IPC-7525 | Rev C | Rev C (November 2021 / English February 2022) — current |
| IPC-6012 | Rev F + Rev E figure | Rev F (September 2023) + addenda FA/FS/EM |
| IPC-7351 | Rev B | Rev B (June 2010) — **no longer maintained**; IPC-7352 (2023) is a separate guideline |
| IPC-7711/7721 | Rev C | **Rev D** (January 2024) |
| J-STD-004 | Rev B | **Rev D** (December 2023) |
| J-STD-005 | Rev A | **Rev B** (April 2024) |
| J-STD-002 | Rev C | **Rev E** (November 2017) |

## 3. The registry

`docs/edition-registry.csv` — 31 rows, 16 columns, UTF-8 with BOM so Excel
opens it cleanly. Columns: Claim ID, Lesson, Module, Lesson title, Claim, Value
in course, Standard, Section, Source ID, **Edition in course**, **Current
edition**, **Status**, **Recheck required**, What breaks if wrong, Checked on,
Checked against.

| Standard | Rows | Of which need a re-check |
|---|---|---|
| IPC-A-610 | 6 | 6 |
| J-STD-033 | 6 | 0 |
| IPC-7525 | 5 | 0 |
| J-STD-020 | 4 | 4 |
| J-STD-001 | 2 | 2 |
| IPC-7711/7721 | 2 | 2 |
| J-STD-004 / 005, IPC-6012, IPC-7351, IPC-7530, IPC-CC-830 | 6 | 2 |

**16 of 31 rows require a human re-read** before publication (superseded or
mismatched edition). They are concentrated in IPC-A-610 (the acceptance
standard the whole course judges against), J-STD-020 (peak-temperature
ceilings) and J-STD-001 (cleanliness release).

The registry is **generated**, not typed: each row carries a `cue` that must
literally occur in that lesson, so a row cannot survive a claim the course
dropped. `scripts/build-edition-registry.js` fails the build if a cue is
missing.

## 4. What the learner now sees

The per-lesson Sources block was extended, not replaced:

- **Edition status on every source** — "Current edition", "Superseded edition
  · publisher lists Rev J (March 2024)", "Edition mismatch", "Document no
  longer maintained", with a one-line note saying what that means for the
  lesson.
- **Scope only — no limit taken** badge on the 11 sources that are cited for
  background and vocabulary (IPC-7095, IPC-2221, the ESD programme documents),
  so a reader cannot mistake them for the source of an acceptance number.
- The old `currency` note is still rendered where it exists; the new block is
  the structured form of the same disclosure.

Styling uses the existing design tokens (`--panel`, `--line2`, `--mut`,
`--dim`, green for current) — no new palette.

## 5. The contradiction worth recording

Secondary sources disagree about J-STD-001: several 2026-dated vendor pages
assert a "Rev J 2024" while others assert a "Rev H, February 2026, replacing
G/2020". The publisher's own revision table lists **Rev J, April 2024** as the
latest and Rev H (September 2020) as its predecessor. The course therefore
records J as current and treats the "H 2026" claim as unsourced. This is the
concrete reason the registry exists: no number in the course is changed on the
strength of a blog.

## 6. Checks run

| Check | Result |
|---|---|
| `scripts/fix-conflicts.js` | 43 asserted replacements, 0 unmatched |
| `scripts/update-source-editions.js` | 39/39 sources updated, 6 statuses assigned |
| `scripts/build-edition-registry.js` | 31 rows, 22 lessons, 10 modules, 12 standards |
| `node scripts/build-embed.js` | 92 lessons / 734 questions / 39 sources |
| `node scripts/check-integrity.js --baseline docs/baseline-integrity.json` | **OK** — refs unchanged (262 source refs, 92 images), embed equal to JSON |
| `node scripts/check-quiz.js` | no structural problems; keyed-longest 30.6 %, displayed key position 4.2 pp worst |
| `node scripts/build.js` | 136 files, 10.9 MB |
| `node tests/course.test.js` | **PASS 82/82** (was 63; +19 for Phase 2) |

## 7. Open items for the technologist

1. **16 registry rows** need the actual Rev J / Rev F text: IPC-A-610 §10 fill
   minimums and exception, J-STD-020 classification temperatures and tL/tp,
   J-STD-001 §8 cleanliness, J-STD-004 flux classes, J-STD-005 powder table,
   IPC-7711/7721 Rev D repair limits. No figure is changed until that text is
   in hand.
2. **IPC-7351** stays at Rev B with a "no longer maintained" disclosure; if the
   course should follow the 2023 IPC-7352 guideline instead, that is an
   editorial decision, not an edition bump.
3. **Squeegee band** 0.2–0.6 N/mm is an industry cluster, not a standard value —
   pick the house band your printers run and the lessons follow it.
4. **Wave dwell** 2–5 s is likewise practice; the lead-free band 3–5 s is worth
   confirming against your own flux and machine datasheets before release.
