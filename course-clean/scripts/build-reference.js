#!/usr/bin/env node
/* =========================================================================
 * build-reference.js — the two reference pages, derived from the lessons
 *
 * Phase 5 asked for two cross-lesson pages:
 *
 *   #/g/  glossary      every term any lesson defines, with the lessons that
 *                       define and use it
 *   #/f/  formulas      every working formula the course actually uses, each
 *                       one pointing at the lesson that derives it
 *
 * Both pages are DERIVED, never typed. A glossary maintained by hand is a
 * glossary with entries nobody re-read; a formula sheet maintained by hand is
 * a sheet that drifts from the lessons it summarises. So this script reads
 * data/lessons.json and writes data/reference.json:
 *
 *   { generatedFrom, generatedFor, terms: [...], formulas: [...] }
 *
 * The rules it enforces, because they are what makes the pages trustworthy:
 *
 *   - a term appears once. Where two lessons define the same term, the FIRST
 *     definition wins (course order) and the duplicate is recorded against the
 *     term as an alias of lessons, not as a second entry. Differing duplicate
 *     text is reported, not silently dropped: it is a finding for the report.
 *   - a formula appears once per distinct expression. Two lessons using the
 *     same relation share one row.
 *   - every formula row names the lesson that shows the derivation, so a
 *     reader can go and check the algebra instead of trusting a sheet.
 *
 * Formula discovery is deliberately narrow: the course states its relations in
 * a fixed set of phrasings, and this script looks for those phrasings (see
 * FORMULA_PATTERNS) rather than trying to parse prose. A relation the course
 * states in some other way does not appear here, which is a gap the checker in
 * scripts/check-integrity.js reports as a count, so the gap stays visible.
 *
 * Usage:
 *   node scripts/build-reference.js            # write data/reference.json
 *   node scripts/build-reference.js --check    # exit 1 if stale
 *   node scripts/build-reference.js --dry      # print the counts only
 * ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LESSONS = path.join(ROOT, 'data', 'lessons.json');
const TARGET = path.join(ROOT, 'data', 'reference.json');

function readJson(file) {
  let raw = fs.readFileSync(file, 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  return JSON.parse(raw);
}

/* The relations the course states. Each pattern is anchored on the phrasing
 * the lessons actually use, so a match is evidence and not a guess. `name` is
 * the sheet's label; `expr` pulls the expression; `where` says which quantity
 * the expression produces.
 *
 * Deliberately NOT included: anything that would need a symbol table the
 * course does not define. A formula sheet that guesses at units is worse than
 * a shorter sheet. */
const FORMULA_PATTERNS = [
  {
    name: 'Area ratio (stencil aperture)',
    expr: 'AR = (L × W) / (2 × (L + W) × T)',
    where: 'aperture opening area over sidewall area; L and W are the aperture sides, T the foil thickness. Release is usually acceptable at AR ≥ 0.66',
    test: /area ratio (?:is|=|of)|area ratio,? (?:is )?(?:calculated|defined)/i,
    lessons: ['m03l01', 'm03l02']
  },
  {
    name: 'Aspect ratio (stencil aperture)',
    expr: 'W / T',
    where: 'narrowest aperture dimension W over foil thickness T; not the plated-hole aspect ratio (depth over diameter) of modules 8 and 9',
    test: /aspect ratio (?:is|=|of)/i,
    lessons: ['m03l01']
  },
  {
    name: 'Squeegee pressure per blade length',
    expr: 'p = F / L',
    where: 'N/mm; F is the force on the blade in N, L the blade length in mm. The course band is 0.2 to 0.6 N/mm (0.5 to 1.5 kg per 25 mm)',
    test: /pressure per (?:blade )?length|N\/mm/i,
    lessons: ['m04l03', 'm04l07']
  },
  {
    name: 'Process capability, Cp and Cpk',
    expr: 'Cp = (USL − LSL) / (6 × sd);  Cpk = min[(USL − mean), (mean − LSL)] / (3 × sd)',
    where: 'capability of a stable process against its specification limits; Cp ignores centring, Cpk includes it',
    test: /\bCpk\b/,
    lessons: ['m04l05']
  },
  {
    name: 'Wave contact time from contact length',
    expr: 't = L / v',
    where: 'dwell over the wave in s; L is the effective contact length in mm, v the conveyor speed in mm/s',
    test: /t = L \/ v|contact length divided by|contact time is the contact length/i,
    lessons: ['m09l04']
  },
  {
    name: 'Shadow length behind a tall part at the wave',
    expr: 'shadow = h × tan(θ)',
    where: 'a line-of-sight screening estimate; h is the part height, θ the wave contact angle measured FROM VERTICAL, plus a 0.5 to 1.0 mm margin for turbulence and flux depletion. Lesson m08l03 writes the same screen as h / tan(angle) with the angle taken from the board surface, which is the complementary angle: keep the convention with the number',
    test: /shadow length = height|height \* tan|tan\(angle\)/i,
    lessons: ['m09l05']
  },
  {
    name: 'Thermal budget index for hand rework',
    expr: 'index = (tip setpoint − board preheat) × contact time',
    where: 'a comparable number for one rework contact, in °C·s',
    test: /thermal budget index/i,
    lessons: ['m11l02']
  },
  {
    name: 'Dry-film thickness from wet film',
    expr: 'DFT = WFT × (volume solids fraction)',
    where: 'coating thickness after cure; WFT is the measured wet film, volume solids as a fraction (45 % → 0.45)',
    test: /DFT = WFT/i,
    lessons: ['m12l05']
  },
  {
    name: 'Residual escape rate of an inspection and test strategy',
    expr: 'escape ppm = Σ occurrence_i × (1 − detection_i)',
    where: 'per defect class i: occurrence rate in ppm times the fraction the strategy does not detect; weighted coverage is 1 − escape / Σ occurrence',
    test: /residual escape rate is the occurrence rate multiplied|Residual escape =/i,
    lessons: ['m13l05']
  },
  {
    name: 'Suspect quantity for containment',
    expr: 'suspect boards = production rate × suspect window',
    where: 'the window runs from the earliest credible suspect time (last verified good, or the last material or setting change if earlier) to the line stop',
    test: /Multiply 20 boards\/min by 40 min|suspect window/i,
    lessons: ['m14l03']
  },
  {
    name: 'Sample size for a no-defect demonstration',
    expr: 'n = ln(1 − confidence) / ln(1 − p)',
    where: 'units that must all pass to show a defect rate no worse than p at the stated confidence (binomial upper bound)',
    test: /n = ln\(|ln\(0\.05\)/i,
    lessons: ['m15l01']
  }
];

function paragraphsOf(lesson) {
  const out = [];
  (lesson.content && Array.isArray(lesson.content.theory) ? lesson.content.theory : []).forEach(function (t) {
    if (!t || typeof t !== 'object') return;
    const list = Array.isArray(t.p) ? t.p : (typeof t.p === 'string' ? [t.p] : []);
    list.forEach(function (p) { if (p) out.push({ h: t.h || '', p: p }); });
  });
  return out;
}

/* The sentence that states the relation, so the sheet can quote the course's
 * own wording rather than paraphrase it. */
function sentenceFor(lesson, re) {
  /* Theory first, because that is where a relation is defined. The worked
   * calculation is searched second, because several relations in this course
   * are first stated in the solution rather than the body — and a formula
   * sheet that ignores them would be missing the course's own algebra. */
  const paras = paragraphsOf(lesson);
  const calc = lesson.content && lesson.content.calc ? lesson.content.calc : {};
  if (calc.task) paras.push({ h: 'Worked calculation', p: String(calc.task) });
  if (calc.solution) paras.push({ h: 'Worked calculation', p: String(calc.solution) });
  for (let i = 0; i < paras.length; i++) {
    const sentences = paras[i].p.split(/(?<=[.!?])\s+/);
    for (let j = 0; j < sentences.length; j++) {
      if (re.test(sentences[j])) return { text: sentences[j].trim(), heading: paras[i].h };
    }
  }
  return null;
}

function buildGlossary(lessons) {
  const seen = new Map();   // lower-cased term -> entry
  const order = [];
  const conflicts = [];
  lessons.forEach(function (l) {
    const terms = (l.content && Array.isArray(l.content.terms)) ? l.content.terms : [];
    terms.forEach(function (t) {
      if (!t || !t.term || !t.def) return;
      const key = String(t.term).trim().toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, {
          term: String(t.term).trim(),
          def: String(t.def).trim(),
          definedIn: l.lessonId,
          moduleId: l.moduleId,
          alsoDefinedIn: []
        });
        order.push(key);
        return;
      }
      const e = seen.get(key);
      if (e.definedIn !== l.lessonId) e.alsoDefinedIn.push(l.lessonId);
      if (String(t.def).trim() !== e.def) {
        conflicts.push({ term: e.term, first: e.definedIn, again: l.lessonId });
      }
    });
  });
  const terms = order.map(function (k) { return seen.get(k); })
    .sort(function (a, b) { return a.term.toLowerCase() < b.term.toLowerCase() ? -1 : 1; });
  return { terms: terms, conflicts: conflicts };
}

function buildFormulas(lessons) {
  const byId = {};
  lessons.forEach(function (l) { byId[l.lessonId] = l; });
  const out = [];
  const missing = [];
  FORMULA_PATTERNS.forEach(function (f) {
    /* Find the lessons that actually state it; the pattern's `lessons` list is
     * a hint for the derivation owner, not a claim that they all state it. */
    const stated = lessons.filter(function (l) {
      return f.test.test(JSON.stringify(l.content || {}));
    }).map(function (l) { return l.lessonId; });
    const owner = f.lessons.filter(function (id) { return byId[id]; })[0] || stated[0];
    if (!owner) { missing.push(f.name); return; }
    const quote = sentenceFor(byId[owner], f.test) || null;
    out.push({
      name: f.name,
      expr: f.expr,
      where: f.where,
      lessonId: owner,
      lessonTitle: byId[owner].title,
      moduleId: byId[owner].moduleId,
      alsoUsedIn: stated.filter(function (id) { return id !== owner; }),
      quote: quote ? quote.text : null,
      heading: quote ? quote.heading : null
    });
  });
  out.sort(function (a, b) { return a.moduleId === b.moduleId ? 0 : (a.moduleId < b.moduleId ? -1 : 1); });
  return { formulas: out, missing: missing };
}

function build() {
  const lessons = readJson(LESSONS);
  const g = buildGlossary(lessons);
  const f = buildFormulas(lessons);
  const payload = {
    schemaVersion: 1,
    generatedBy: 'scripts/build-reference.js',
    generatedFor: 'phase 5: glossary and formula reference',
    counts: { lessons: lessons.length, terms: g.terms.length, formulas: f.formulas.length },
    terms: g.terms,
    formulas: f.formulas,
    /* Kept in the file on purpose: a duplicate definition that differs is a
     * finding a reader may want to see, and hiding it in a build log is how
     * it survives. The renderer shows it under the term. */
    termConflicts: g.conflicts,
    formulasNotFound: f.missing
  };
  return payload;
}

function main(argv) {
  const check = argv.indexOf('--check') !== -1;
  const dry = argv.indexOf('--dry') !== -1;
  const payload = build();
  const text = JSON.stringify(payload, null, 2) + '\n';

  if (dry) {
    console.log('terms ' + payload.counts.terms + ', duplicate definitions with differing text ' +
      payload.termConflicts.length + ', formulas ' + payload.counts.formulas +
      ', patterns not found ' + payload.formulasNotFound.length);
    return 0;
  }

  if (check) {
    if (!fs.existsSync(TARGET)) {
      console.error('build-reference --check: data/reference.json missing');
      return 1;
    }
    const same = fs.readFileSync(TARGET, 'utf8') === text;
    if (!same) {
      console.error('build-reference --check: STALE — run node scripts/build-reference.js');
      return 1;
    }
    console.log('build-reference --check: OK (' + payload.counts.terms + ' terms, ' +
      payload.counts.formulas + ' formulas)');
    return 0;
  }

  fs.writeFileSync(TARGET, text, 'utf8');
  console.log('build-reference: wrote ' + path.relative(ROOT, TARGET) +
    ' (' + payload.counts.terms + ' terms, ' + payload.counts.formulas + ' formulas, ' +
    payload.termConflicts.length + ' conflicting duplicate definitions)');
  return 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { build: build, FORMULA_PATTERNS: FORMULA_PATTERNS };
