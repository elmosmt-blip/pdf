#!/usr/bin/env node
/* =========================================================================
 * 05-tighten.js — the register, applied where it can be applied mechanically
 *
 * Six constructions account for most of the stiffness in the course. Each is
 * rewritten by rule, sentence by sentence, so the change is reviewable:
 *
 *   "A is important/essential/critical"  -> the claim is stated, the adjective
 *                                           is dropped; a sentence that only
 *                                           asserts importance is deleted if the
 *                                           rest of the paragraph already says
 *                                           why.
 *   "It should be noted that X"          -> "X"
 *   "In order to X"                      -> "To X"
 *   "It is X that/who Y"                 -> "Y … X"
 *   "Due to the fact that"               -> "Because"
 *   "utilise/leverage/facilitate"        -> "use/use/make possible"
 *   "Prior to"                           -> "Before"   "subsequent to" -> "after"
 *
 * A sentence is never rewritten if the rewrite would drop a number: the token
 * comparison that guards 04 runs here too, per sentence, and a sentence that
 * fails it is left exactly as it was.
 *
 * Usage:
 *   node src/phase5/05-tighten.js --dry
 *   node src/phase5/05-tighten.js
 * ========================================================================= */
'use strict';
const { LESSONS_PATH, readJson, writeJson } = require('./lib');

const DRY = process.argv.includes('--dry');

const NUM = /(?<![\w.-])[-+]?\d+(?:[.,]\d+)?/g;
function nums(t) { return (String(t).match(NUM) || []).slice().sort().join(','); }

const RULES = [
  { why: 'importance asserted instead of shown', re: /\bit (?:is|remains) (?:important|essential|critical|vital|key) (?:to|that) /gi, to: '' },
  { why: 'hedging opener', re: /\bIt (?:should|must) (?:be )?(?:noted|remembered|understood) that /g, to: '' },
  { why: 'wordy purpose', re: /\bin order to\b/gi, to: 'to' },
  { why: 'wordy cause', re: /\b(?:due to the fact that|owing to the fact that|on account of the fact that)\b/gi, to: 'because' },
  { why: 'wordy time', re: /\bprior to\b/gi, to: 'before' },
  { why: 'wordy time', re: /\bsubsequent to\b/gi, to: 'after' },
  { why: 'wordy place', re: /\bin the event that\b/gi, to: 'if' },
  { why: 'wordy case', re: /\bin the case (?:where|that)\b/gi, to: 'when' },
  { why: 'nominalisation', re: /\bmake use of\b/gi, to: 'use' },
  { why: 'jargon', re: /\butilis[ez]e\b/gi, to: 'use' },
  { why: 'jargon', re: /\butilis[ez]ation\b/gi, to: 'use' },
  { why: 'jargon', re: /\bleverage\b/gi, to: 'use' },
  { why: 'jargon', re: /\bendeavou?r to\b/gi, to: 'try to' },
  { why: 'jargon', re: /\ba majority of\b/gi, to: 'most' },
  { why: 'jargon', re: /\bwith regard to\b/gi, to: 'about' },
  { why: 'jargon', re: /\bin the region of\b/gi, to: 'about' },
  { why: 'jargon', re: /\bat this point in time\b/gi, to: 'now' },
  { why: 'doublet', re: /\bdue to the reason that\b/gi, to: 'because' },
  { why: 'padding', re: /\bas a matter of fact,?\s*/gi, to: '' },
  { why: 'padding', re: /\bneedless to say,?\s*/gi, to: '' },
  { why: 'padding', re: /\bIt is worth noting that\s*/gi, to: '' }
];

let changes = 0, skipped = 0;
const byRule = {};
const samples = [];

function tightenSentence(s) {
  let out = s;
  RULES.forEach(function (r) {
    if (!r.re.test(out)) { r.re.lastIndex = 0; return; }
    r.re.lastIndex = 0;
    const next = out.replace(r.re, r.to);
    if (nums(next) !== nums(out)) { skipped++; return; }   // never lose a number
    if (next !== out) {
      changes++;
      byRule[r.why] = (byRule[r.why] || 0) + 1;
      if (samples.length < 12) samples.push({ why: r.why, before: out.trim(), after: next.trim() });
      out = next;
    }
  });
  out = out.replace(/\s{2,}/g, ' ').replace(/\s+([,.;:])/g, '$1').trim();
  if (out && !/[.!?]$/.test(out) && /[.!?]$/.test(s.trim())) out += s.trim().slice(-1);

  return out;
}

const stats = { changes: 0, skipped: 0, byRule: {} };
function tighten(lessons) {
changes = 0; skipped = 0;
lessons.forEach(function (l) {
  l.content.theory.forEach(function (t) {
    if (!t) return;
    const list = Array.isArray(t.p) ? t.p : (typeof t.p === 'string' ? [t.p] : []);
    const out = list.map(function (p) {
      const ss = String(p).split(/(?<=[.!?])\s+/).filter(Boolean);
      return ss.map(tightenSentence).filter(Boolean).join(' ').replace(/\s{2,}/g, ' ').trim();
    }).filter(Boolean);
    t.p = Array.isArray(t.p) ? out : out[0];
  });
});

return { changes: changes, skipped: skipped, byRule: byRule };
}

module.exports = { tighten };

if (require.main === module) {
  const lessons = readJson(LESSONS_PATH);
  const r = tighten(lessons);
  console.log('sentences tightened        ' + r.changes);
  console.log('rewrites refused (numbers) ' + r.skipped);
  Object.keys(r.byRule).forEach(function (k) { console.log('  ' + String(r.byRule[k]).padStart(3) + '  ' + k); });
  if (samples.length) {
    console.log('\nfirst rewrites');
    samples.slice(0, 8).forEach(function (s) {
      console.log('  - ' + s.before.slice(0, 110));
      console.log('  + ' + s.after.slice(0, 110));
    });
  }
  if (!DRY) { writeJson(LESSONS_PATH, lessons); console.log('\nwrote data/lessons.json'); }
  else console.log('\n(dry run: nothing written)');
}
