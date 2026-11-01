#!/usr/bin/env node
/*
 * Round 14 — fill in source provenance, the last of the markers.
 *
 * Every entry in sources.json shipped with section "TBD-REVIEW",
 * verifiedBy "TBD-REVIEW" and verifiedOn null — 117 markers. Filling them in is
 * what lets check-course.js's own contract hold without the escape hatch.
 *
 * Two honesty rules, applied entry by entry:
 *
 *   READ      — primary text for the relevant clauses was actually read during
 *               rounds 10 to 14. The record names what was read and what it
 *               settled.
 *   SCOPE     — only the designation, title and scope were confirmed. The clause
 *               text was not read. The record says so plainly, so a reader can
 *               see which claims rest on a clause nobody has opened.
 *
 * verifiedBy is set to a factual description of the work, never to a person's
 * name: attributing this to a human reviewer would be a fabrication. verifiedOn
 * is the date the provenance check was made.
 *
 * check-course.js only enforces this for status "published", which is not what
 * the lessons are set to — "reviewed" means a reviewer went through the content,
 * "published" would assert customer sign-off. But the fields are still markers,
 * and a false "verified" is worse than an honest "scope only".
 *
 * Idempotent: entries are replaced wholesale, keyed by id.
 */
'use strict';
var fs = require('fs');
var path = require('path');

var dataDir = process.argv[2];
if (!dataDir) { console.error('usage: node apply-source-provenance.js <data-dir>'); process.exit(2); }
var sfile = path.join(dataDir, 'sources.json');
var raw = fs.readFileSync(sfile, 'utf8');
var sources = JSON.parse(raw);

var DATE = '2026-11-01';

/* id -> [section, verifiedBy] */
var P = {
  'src-001': ['§10 through-hole solder fill — vertical barrel fill minimums by class (75 % for Class 2 and Class 3)',
    'READ. Primary IPC-A-610D fragments read: "Class 2, fill to 75% but with exception for inner layer connections" and "All other solder joints remain according to IPC-A-610 Class 2". Settled the round-10 contradiction — 75 % is the minimum for both classes; the 50 % figure belongs to IPC-6012 Rev F (bare board).'],
  'src-002': ['§8 cleanliness — objective evidence in place of the single ROSE limit',
    'READ. Amendment 1 to Rev G (2018) and Rev H (September 2020) confirmed from IPC\'s own site and three independent reproductions: the 1.56 µg/cm² ROSE pass/fail was removed and replaced by objective evidence — SIR per IPC-TM-650 2.6.3.7, ion chromatography per 2.3.28, temperature-humidity-bias, or documented field history.'],
  'src-003': ['Table 4-1 (user bake) and Table 4-2 (supplier dry-pack); Table 5-1 floor life; §4.2.7.1 cumulative bake',
    'READ. Primary J-STD-033B.1 and Rev D text read. The full Table 4-1 matrix was recovered — thickness × MSL level × whether floor life was exceeded by more or less than 72 h. Table 4-2 is the supplier dry-pack bake at a fixed 24 h maximum exposure. Cumulative bake above 90 °C and up to 125 °C limited to 96 h; at 90 °C or below there is no limit.'],
  'src-004': ['§1.1.2 area ratio; §1.1.3 aspect ratio',
    'READ. Primary IPC-7525B §1.1.2 and §1.1.3 read verbatim. Revision history confirmed independently: 7525 May 2000, A February 2007, B October 2011, C November 2021 (current). IPC-7525D does not exist. Caveat that still stands: the 0.66 and 1.5 FIGURES are carried only by convergent secondary sources and have not been confirmed against the standard body text.'],
  'src-005': ['Table 4-1 and Table 4-2 classification temperatures; Table 5-2 classification reflow profile',
    'READ. Primary J-STD-020E text read. Table 4-2 (Pb-free) is thickness × volume: below 1.6 mm every volume 260 °C; 1.6-2.5 mm 260/250/245; above 2.5 mm 250/245/245. Table 4-1 (SnPb) 235 °C for thickness below 2.5 mm and volume below 350 mm³, 220 °C otherwise. Profile parameters: tL 60-150 s, ts 60-120 s, ramp-up 3 °C/s max, ramp-down 6 °C/s max, tp 20 s SnPb / 30 s Pb-free.'],
  'src-006': ['Table I sample size code letters; Table II-A single sampling plans',
    'READ. A hosted copy of ISO 2859-1 itself was read, and the tables confirmed against three independent reproductions. Code letters A 2 through R 2000 (S 3150 omitted by the course); level II gives 501-1200 → J(80), 1201-3200 → K(125), 3201-10000 → L(200); at AQL 1.0 % K → Ac 3 / Re 4 and L → Ac 5 / Re 6.'],
  'src-007': ['BGA design and assembly process implementation — scope only',
    'SCOPE. Designation and scope confirmed from published references; the clause text was not read. Any clause-level claim resting on this source is unverified.'],
  'src-008': ['Reflow and wave profile guidance — ramp, soak, time above liquidus, cooling',
    'READ via the AIM Solder profile supplement, which reproduces the IPC/JEDEC classification profile table verbatim: time above liquidus 30-90 s, soak zone 150-200 °C, ramp up rate below 3 °C/sec with 1-3 °C/sec as the recommended starting point, cooling below 4 °C/sec. The IPC-7530A industry draft note that component suppliers often recommend a more conservative 2-4 °C/s was also read.'],
  'src-009': ['Rework and repair procedures; acceptable rework and repair methods',
    'READ from two independent renderings of the primary text. IPC-7711 is Rework, IPC-7721 is Repair and Modification, published together as IPC-7711/7721. IPC-7721 judges laminate repair on the restored condition — insulation and clearance maintained, no epoxy in the hole or on internal pad walls, no reduction in hole diameter, no exposed adjacent circuitry — and sets no damage depth limit. The only 0.25 mm in IPC-7721 is the width of a milled channel for a foil jumper.'],
  'src-010': ['§1.3.1 coating type designations; qualification and performance requirements',
    'READ from two independent renderings. Type AR acrylic, Type ER EPOXY, Type SR silicone, Type UR POLYURETHANE, Type XY PARAXYLYLENE, Type UT ultra-thin, Type SC styrene block co-polymer. There is no Type DR. The course had ER as polyurethane and invented DR for parylene.'],
  'src-011': ['Surface mount design and land pattern requirements — scope only',
    'SCOPE. Designation and scope confirmed from published references; the clause text was not read. Any clause-level claim resting on this source is unverified.'],
  'src-012': ['ESD control programme — grounded personnel, protective packaging, verified work surfaces, controlled handling',
    'READ from the ESD Association\'s own IEC-equivalency chart and endorsed-standards page. ANSI/ESD S20.20-2021 is the programme standard, technically equivalent to IEC 61340-5-1.'],
  'src-013': ['Method 2.3.25 (ROSE, soluble ionic contamination) and method 2.3.28 (ion chromatography)',
    'READ. Method numbers and titles confirmed. 2.3.25 measures soluble ionic contamination as sodium chloride equivalent; 2.3.28 is ion chromatography, used to confirm the specific ions. Unit conversion cross-checked: 1.56 µg/cm² = 10.06 µg/in².'],
  'src-014': ['Reflow and wave profile supplement — flux deposition, ramp, soak, time above liquidus, cooling',
    'READ. The AIM Solder supplement reproduces the IPC/JEDEC profile table and states flux deposition of 500-1500 µg/in² of flux solids, which converts to 0.775-2.325 g/m² — the course\'s 0.78-2.33 g/m² is exact. Also the source for the 30-90 s time-above-liquidus window.'],
  'src-015': ['Table 3-2 solder powder size distribution',
    'READ. The AIM Solder test report reproduces the standard\'s own Table 3-2 header and Type 3 row verbatim, confirmed independently by two further sources: none larger than 50 µm, less than 1 % larger than 45 µm, 80 % minimum between 25-45 µm, 10 % maximum smaller than 20 µm. Some older renderings of the table show a different layout, which is where the course\'s wrong tails came from.'],
  'src-016': ['§10 through-hole solder fill — 75 % minimum vertical barrel fill',
    'READ. Same primary IPC-A-610D fragments as src-001. Note for the record: IPC-A-610J removed the "Target" condition entirely, so in the current revision 100 % fill cannot be expressed as a target — it can only be a contractual requirement.'],
  'src-017': ['Classification temperatures by package thickness and volume; tp, tL, ts, ramp limits',
    'READ. Primary J-STD-020E text read, cross-checked against the same table reproduced in the Texas Instruments, Microchip and Abracon handling notes. The course\'s original "260 small / 250 large / 245 very large" was the 1.6-2.5 mm row only.'],
  'src-018': ['§3.9.1 ionic contamination for bare boards; bow and twist limits',
    'PARTLY READ. The 1.56 µg/cm² NaCl-equivalent limit is cited directly as IPC-6012E §3.9.1 and confirmed. Bow and twist confirmed through a quotation of IPC-6012 itself — 0.75 % for boards using surface mount components, 1.5 % for all others, measured per IPC-TM-650 2.4.22, with the same split in IPC-A-600 §2.11. The rest of the document was not read.'],
  'src-019': ['Flux classification by residue type and activity; residue requirements',
    'READ. Classification by residue type and activity confirmed; low activity for clean fresh finishes, higher activity for oxidised or high-thermal-mass joints. Clause numbers not read — the classification scheme itself is what the course relies on.'],
  'src-020': ['Soft solder alloys — scope only',
    'SCOPE. Designation and scope confirmed from published references; the clause text was not read. Any clause-level claim resting on this source is unverified.'],
  'src-021': ['Solderability tests for component leads and terminations — scope only',
    'SCOPE. Designation and scope confirmed from published references; the clause text was not read. Any clause-level claim resting on this source is unverified.'],
  'src-022': ['§2.10.3 annular ring; §3.5.3.1 conductor width reduction',
    'READ. IPC-A-600 §2.10.3: "Acceptable — Class 3: holes are not centered in the lands, but the annular ring measures 0.050 mm [0.0020 in] or more", with up to 20 % local reduction for pits, dents, nicks, pinholes or splay. §3.5.3.1: allowable reduction of the minimum conductor width due to misregistration or isolated defects shall not exceed 20 % of the minimum conductor width (10 % at Class 3). These are bare-board criteria — the course had been attaching them to IPC-A-610 and IPC-7711/7721.'],
  'src-023': ['Base materials for rigid and multilayer printed boards — scope only',
    'SCOPE. Designation and scope confirmed from published references; the clause text was not read. Any clause-level claim resting on this source is unverified.'],
  'src-024': ['Generic standard on printed board design — scope only',
    'SCOPE. Designation and scope confirmed from published references; the clause text was not read. Any clause-level claim resting on this source is unverified.'],
  'src-025': ['Sectional design standard for rigid organic printed boards — scope only',
    'SCOPE. Designation and scope confirmed from published references; the clause text was not read. Any clause-level claim resting on this source is unverified.'],
  'src-026': ['Stencil and misprinted board cleaning — scope only',
    'SCOPE. Designation and scope confirmed from published references; the clause text was not read. Any clause-level claim resting on this source is unverified.'],
  'src-027': ['Wrist straps — scope only',
    'SCOPE. Designation and scope confirmed from the ESD Association\'s published standards list; the method text was not read. Any clause-level claim resting on this source is unverified.'],
  'src-028': ['Worksurfaces — resistance measurements — scope only',
    'SCOPE. Designation and scope confirmed from the ESD Association\'s published standards list; the method text was not read. Any clause-level claim resting on this source is unverified.'],
  'src-029': ['Grounding — equipotential bonding of racks, carts, shelving, tables and floor systems',
    'SCOPE. Designation and scope confirmed from the ESD Association\'s published standards list; the method text was not read. The course\'s claim is a scope statement, not a clause citation.'],
  'src-030': ['Packaging materials for ESD sensitive items — shielding bags, conductive containers, closure methods',
    'SCOPE. Designation and scope confirmed from the ESD Association\'s published standards list; the method text was not read. The course\'s claim is a scope statement, not a clause citation.'],
  'src-031': ['Ionization — offset voltage (balance) and discharge time',
    'READ. Confirmed from the ESD Association\'s own IEC-equivalency chart: "ANSI/ESD STM3.1 | IEC 61340-4-7 | Ionization". This also settled the earlier draft\'s error — no STM97.7 or 97.8 covers ionization.'],
  'src-032': ['Surface resistance measurements of static dissipative planar materials — scope only',
    'SCOPE. Designation and scope confirmed from the ESD Association\'s published standards list; the method text was not read. Any clause-level claim resting on this source is unverified.'],
  'src-033': ['Floor materials and footwear — resistance measurement',
    'READ. Confirmed from the ESD Association\'s own IEC-equivalency chart: "ANSI/ESD STM97.1 & ANSI/ESD STM97.2 | IEC 61340-4-5 | Footwear and Flooring Systems". Both STM97.1-2015 and STM97.2-2016 are technically equivalent to IEC 61340-4-5.'],
  'src-034': ['Footwear/flooring system — voltage measurement in combination with a person',
    'READ. Confirmed from the ESD Association\'s own IEC-equivalency chart, paired with STM97.1 as the IEC 61340-4-5 equivalent.'],
  'src-035': ['Protection of electronic devices from electrostatic phenomena — requirements',
    'READ. Confirmed from the ESD Association\'s equivalency material that ANSI/ESD S20.20 is technically equivalent to IEC 61340-5-1. The equivalence is what the course claims, not the clause text.'],
  'src-036': ['Standard test methods for specific applications — ionization tests',
    'READ. Confirmed from the ESD Association\'s own IEC-equivalency chart as the IEC counterpart of ANSI/ESD STM3.1.'],
  'src-037': ['Clause 8.4 control of externally provided processes, products and services; nonconforming output',
    'READ. Clause 8.4 (control of externally provided processes, products and services) confirmed. The course uses it to justify recording the evidence behind an accept, quarantine or reject decision at goods-in.'],
  'src-038': ['Quality management systems requirements for aviation, space and defence — nonconforming output',
    'READ. Scope confirmed: control and documentation of nonconforming output. The course cites it alongside ISO 9001 as an example QMS under which a disposition must be documented.'],
  'src-039': ['Tests for flammability of plastic materials for parts in devices and appliances',
    'SCOPE. Designation and scope confirmed from published references; the clause text was not read. The course references it only as the flammability basis a material declaration may cite.']
};

var n = 0, missing = [];
sources.forEach(function (s) {
  if (!P[s.id]) { missing.push(s.id); return; }
  s.section = P[s.id][0];
  s.verifiedBy = P[s.id][1];
  s.verifiedOn = DATE;
  n++;
});

var out = JSON.stringify(sources, null, 2) + '\n';
if (out !== raw) fs.writeFileSync(sfile, out);
console.log('sources.json: ' + n + ' entr' + (n === 1 ? 'y' : 'ies') + ' given section, verifiedBy and verifiedOn');
if (missing.length) console.error('  !! no provenance record for: ' + missing.join(', '));

var left = 0;
sources.forEach(function (s) {
  ['section', 'verifiedBy'].forEach(function (k) { if (String(s[k]).indexOf('TBD-REVIEW') >= 0) left++; });
  if (s.verifiedOn === null || s.verifiedOn === undefined) left++;
});
if (left) { console.error('  !! ' + left + ' marker(s) remain in sources.json'); process.exit(1); }
console.log('verified: 0 TBD-REVIEW markers and 0 null verifiedOn in sources.json');
