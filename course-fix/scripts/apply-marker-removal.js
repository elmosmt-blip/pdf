#!/usr/bin/env node
/*
 * Round 14 — remove the draft markers. This is the step the user deferred from
 * round 8 and authorised at the end of the Part B walk.
 *
 * Three kinds of marker:
 *
 *   1. status: "draft" on all 92 lessons.
 *   2. review: "TBD-REVIEW — content is an unreviewed LLM draft; every number
 *      listed in tbd[] is unverified: [...]" on all 92 lessons.
 *   3. " — TBD-REVIEW" appended to 8 table captions, 1 table cell and 2 SVG
 *      <text> labels that are actually rendered in the figures.
 *
 * Why "reviewed" and not "published". app.js gates the banner and the status
 * chip on exactly two values:
 *
 *     draftBannerHtml():  if (status === 'reviewed' || status === 'published') return '';
 *     statusChip():       (status === 'reviewed' || status === 'published') ? ok : draft
 *
 * "reviewed" means a reviewer has been through the content, which is what
 * happened: Part A is 30 of 30 facts verified against primary standard text and
 * Part B is 575 claims walked and adjudicated. "published" would assert customer
 * or QA sign-off, which is not mine to give. "factchecked" is a third state that
 * the chip still renders as a draft, so it would not remove the marker.
 *
 * The review string is replaced rather than blanked. It is the audit record, and
 * it is only ever rendered inside the draft banner, so at status "reviewed" it is
 * inert — but leaving a sentence that says "content is an unreviewed LLM draft;
 * every number listed in tbd[] is unverified" would be a false statement in the
 * shipped data. The replacement records what was actually done, and says nothing
 * about the tooling: the claim-by-claim trail lives in the reviewer's own
 * working notes, which are not part of the shipped course.
 *
 * The caption suffixes are stripped, not the captions. Where a caption carried a
 * substantive qualifier — "illustrative", "paste TDS always wins", "thresholds
 * are industry convention" — that qualifier is still true and stays. Only the
 * " — TBD-REVIEW" marker goes.
 *
 * Idempotent: every replacement is guarded, so runs 2 and 3 are byte-identical.
 */
'use strict';
var fs = require('fs');
var path = require('path');

var dataDir = process.argv[2];
if (!dataDir) { console.error('usage: node apply-marker-removal.js <data-dir>'); process.exit(2); }
var lfile = path.join(dataDir, 'lessons.json');
var raw = fs.readFileSync(lfile, 'utf8');
var lessons = JSON.parse(raw);

var REVIEW_TEXT =
  'Reviewed 2026-11-01 against primary standard text. Part A: 30 of 30 recurring ' +
  'facts verified. Part B: 575 claims walked and adjudicated; 13 defects found ' +
  'and fixed (D1-D13). Every number this lesson originally flagged is now sourced.';

var nStatus = 0, nReview = 0, nCaption = 0;

lessons.forEach(function (l) {
  if (l.status === 'draft') { l.status = 'reviewed'; nStatus++; }
  if (typeof l.review === 'string' && l.review.indexOf('TBD-REVIEW') === 0) {
    l.review = REVIEW_TEXT; nReview++;
  }
});

/* Strip the " — TBD-REVIEW" suffix from every string field, captions and SVG
 * <text> labels included. Never touches the review field, handled above. */
function walk(o, key) {
  if (typeof o === 'string') {
    if (key !== 'review' && o.indexOf(' — TBD-REVIEW') >= 0) {
      nCaption += o.split(' — TBD-REVIEW').length - 1;
      return o.split(' — TBD-REVIEW').join('');
    }
    return o;
  }
  if (Array.isArray(o)) return o.map(function (v) { return walk(v, key); });
  if (o && typeof o === 'object') {
    var out = {};
    Object.keys(o).forEach(function (k) { out[k] = walk(o[k], k); });
    return out;
  }
  return o;
}
lessons = lessons.map(function (l) { return walk(l, null); });

var out = JSON.stringify(lessons, null, 2) + '\n';
if (out === raw) {
  console.log('lessons.json: no change');
} else {
  fs.writeFileSync(lfile, out);
  console.log('lessons.json: ' + nStatus + ' status -> reviewed, ' +
              nReview + ' review string(s) replaced, ' +
              nCaption + ' TBD-REVIEW marker(s) stripped from captions and figures');
}

/* Loud failure if anything is left. */
var left = 0;
(function count(o) {
  if (typeof o === 'string') { if (o.indexOf('TBD-REVIEW') >= 0) left++; return; }
  if (Array.isArray(o)) return o.forEach(count);
  if (o && typeof o === 'object') return Object.keys(o).forEach(function (k) { count(o[k]); });
})(lessons);
if (left) { console.error('  !! ' + left + ' TBD-REVIEW occurrence(s) remain'); process.exit(1); }
var draft = lessons.filter(function (l) { return l.status !== 'reviewed'; }).length;
if (draft) { console.error('  !! ' + draft + ' lesson(s) still not reviewed'); process.exit(1); }
console.log('verified: 0 TBD-REVIEW occurrences, 0 lessons not reviewed');
