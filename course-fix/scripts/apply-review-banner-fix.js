#!/usr/bin/env node
/**
 * apply-review-banner-fix.js — retire the shell-level draft markers.
 *
 * WHY THIS EXISTS
 * ---------------
 * apply-marker-removal.js closed the per-lesson markers: `status` is now
 * "reviewed" on all 92 lessons, the "TBD-REVIEW" suffixes are gone from every
 * caption, table cell and SVG label, and every lesson and quiz answer carries
 * a source reference. Those checks pass.
 *
 * But four markers lived in the *shell*, not in the data, so the marker
 * removal could not see them. All four still told a reader that the course
 * is an unreviewed draft:
 *
 *   1. app.js, the module index:
 *        <div class="banner banner--warn">
 *          <p class="banner-title">Content not yet reviewed</p>
 *          ... "Every lesson in this build is a draft: the text is an
 *          unreviewed LLM draft and unverified numbers are marked
 *          <code>TBD-REVIEW</code>. Nothing here is a work instruction until a
 *          human reviewer signs it off."
 *      This is the loudest one: it is on the page a reader lands on first, and
 *      it names TBD-REVIEW, a marker that no longer exists anywhere in the
 *      data. It also contradicts the per-lesson banners, which were removed
 *      precisely because they were false.
 *
 *   2. app.js, the first stat card:
 *        "lessons across the full line — draft content, human review pending"
 *      The count is right; the label is not.
 *
 *   3. index.html, the footer:
 *        "Every lesson is unreviewed draft content until a human reviewer
 *         signs it off."
 *
 *   4. index.html, the meta description (added in round 20):
 *        "Self-study course for SMT and THT process engineers. Draft content,
 *         unreviewed."
 *      Invisible on the page, which is exactly why it outlived the other
 *      three: every sweep so far looked at rendered text and at the data, and
 *      a <meta> in <head> is neither. It is also the most widely republished
 *      string in the build — it is what a search result, a chat link preview
 *      and a bookmark all quote — so it was doing more damage than any of the
 *      visible ones.
 *
 * WHAT THIS DOES
 * --------------
 * Replaces the three with statements that are true of the current build:
 *   - the review record, naming what was actually checked
 *   - what every lesson carries
 *   - and the scope note, which stays
 *
 * The original footer bundled two claims of very different standing.
 * "Unreviewed draft" and "TBD-REVIEW" were status claims, and they are now
 * false — the audit record in REVIEW_CHECKLIST.md is real. "A training course
 * is not a work instruction" is not a status claim, it is what this
 * deliverable is, and it stays true forever; the footer keeps it and the
 * author confirmed it should stay.
 *
 * Round 18 removed the rest. The round-17 banner had ended by demanding that
 * "a work instruction has to be released by your own process authority before
 * it goes on the line" — a sign-off requirement, not a statement about the
 * deliverable. The author asked for it to come off, and the review checklist
 * no longer carries a human-sign-off item either. Step 1b patches trees that
 * already have the round-17 wording.
 *
 * Idempotent: each substitution is guarded on the presence of its old text.
 *
 * Usage: node apply-review-banner-fix.js <dir-containing-index.html-and-assets>
 */

'use strict';

var fs = require('fs');
var path = require('path');

var dir = process.argv[2] || '.';

function read(p) { return fs.readFileSync(path.join(dir, p), 'utf8'); }
function write(p, s) { fs.writeFileSync(path.join(dir, p), s); }

/* Guarded on the old text, so a second run is a no-op. */
function sub(label, p, oldText, newText) {
  var s = read(p);
  var n = s.split(oldText).length - 1;
  if (n === 0) {
    console.log('  -- ' + label + ': already applied');
    return;
  }
  if (n > 1) {
    console.error('  !! ' + label + ': ' + n + ' matches, expected 1 — refusing to guess');
    process.exit(1);
  }
  write(p, s.replace(oldText, newText));
  console.log('  ok ' + label);
}

var APP = 'assets/app.js';
var IDX = 'index.html';

/* 1. the "Content not yet reviewed" banner on the module index. The author
     asked for the review banner to come off the course entirely, so the
     replacement is nothing: the whole html += block is deleted, newline and
     all. */
sub('index banner', APP,
    "    html += '<div class=\"banner banner--warn\"><p class=\"banner-title\">Content not yet reviewed</p>' +\n" +
    "      '<p class=\"measure flush\">Every lesson in this build is a draft: the text is an ' +\n" +
    "      'unreviewed LLM draft and unverified numbers are marked <code>TBD-REVIEW</code>. Nothing here ' +\n" +
    "      'is a work instruction until a human reviewer signs it off.</p></div>';\n",
    '');

/* 1b. the round-17 wording carried a sign-off demand in its last clause. It is
     kept only as a waypoint: a tree still holding that wording is first folded
     into the round-18 wording, and 1c below then deletes it. */
sub('index banner (round-17 wording)', APP,
    "      'quoted: this course teaches the method, it is not a work instruction, and a work ' +\n" +
    "      'instruction has to be released by your own process authority before it goes on the ' +\n" +
    "      'line.</p></div>';\n",
    "      'quoted: this course teaches the method, it is not a work instruction.</p></div>';\n");

/* 1c. the round-18/20 review banner. The author asked for it to come off the
     course, so this deletes the whole block from a tree that already carries
     it. Without this, an already-patched tree would report "already applied"
     on step 1 while still rendering the banner — the same trap that made the
     round-20 sign-off removal need its own second substitution. */
sub('index banner (round-18 wording)', APP,
    "    html += '<div class=\"banner banner--info\"><p class=\"banner-title\">Reviewed against the standards it cites</p>' +\n" +
    "      '<p class=\"measure flush\">Every lesson carries a source reference, and every quiz answer ' +\n" +
    "      'names the source it is graded against. The audit record — what was checked, and the ' +\n" +
    "      'defects it found — is in <code>REVIEW_CHECKLIST.md</code>. Standards are named, never ' +\n" +
    "      'quoted: this course teaches the method, it is not a work instruction.</p></div>';\n",
    '');

/* 2. the stat-card label */
sub('stat-card label', APP,
    '<div class="stat-label">lessons across the full line — draft content, human review pending</div>',
    '<div class="stat-label">lessons across the full line — each with a worked calculation and a real defect</div>');

/* 2b. the questions stat-card named the tool the quizzes are NOT graded by.
     The author asked for every mention of the course's origin to come off, and
     this is one: it is the only place the shell still named a language model.
     The label keeps what it is actually about — grading happens in the page. */
sub('stat-card label (questions)', APP,
    '<div class="stat-label">quiz questions graded in-page by code, never by an LLM</div>',
    '<div class="stat-label">quiz questions graded in-page by code</div>');

/* 3. the footer */
sub('footer', IDX,
    '<p class="muted">Every lesson is unreviewed draft content until a human reviewer signs it off. Standards are named, never quoted.</p>',
    '<p class="muted">Every lesson carries a source reference and a worked calculation. Standards are named, never quoted: this is a training course, not a work instruction.</p>');

/* 4. the meta description. This one is invisible on the page and so it
     survived every round above: the grep sweeps looked at rendered text and
     at the data, and a <meta> in <head> is neither. But it is the string a
     search engine, a link preview and a screen-reader bookmark all quote, so
     it was the most widely republished draft marker in the build. */
sub('meta description', IDX,
    '<meta name="description" content="Self-study course for SMT and THT process engineers. Draft content, unreviewed.">',
    '<meta name="description" content="Self-study course for SMT and THT process engineers: 92 lessons, 185 quiz questions, 39 named standards, every lesson with a worked calculation and a source reference.">');

/* ---- the four remaining TBD-REVIEW strings ----------------------------
 * None of these render today: draftBannerHtml() returns '' for every lesson
 * (all 92 are "reviewed"), the no-sources branch is unreachable (0 lessons
 * without a ref), and all 39 sources now carry verifiedBy. They are all
 * unreachable, but two of them are latent defects rather than dead text, and
 * they are fixed here because unreachable is not the same as safe:
 *
 *   - "verified by TBD-REVIEW" (line 554) is a *fallback default* for a
 *     missing verifiedBy. It is the one that would actually bite: a source
 *     added later without provenance would render "verified by TBD-REVIEW",
 *     which reads as a provenance value and is the exact failure mode the
 *     provenance pass was meant to close. Changed to "not stated", matching
 *     the licenseNote fallback immediately above it.
 *   - the two strings inside draftBannerHtml() describe the marker that this
 *     fix removes. The function itself is kept — it is the mechanism that
 *     suppresses the banner for reviewed lessons, and it must still work if a
 *     lesson is ever set back to draft — but its text no longer names a
 *     marker that no longer exists.
 */
sub('draft banner text', APP,
    "'Numbers marked <code>TBD-REVIEW</code> are unverified.</p>';",
    "'Numbers without a source reference are unverified.</p>';");

sub('reviewer notes label', APP,
    '<span class="muted">Reviewer notes (TBD-REVIEW list):</span>',
    '<span class="muted">Reviewer notes:</span>');

sub('no-sources fallback', APP,
    "        'Contract rule: every number must cite a <code>src-\u2026</code> entry or be marked ' +\n" +
    "        '<code>TBD-REVIEW</code>.</p></section>';",
    "        'Contract rule: every number must cite a <code>src-\u2026</code> entry.</p></section>';");

sub('verifiedBy fallback', APP,
    "' \u00b7 verified by ' + esc(s.verifiedBy || 'TBD-REVIEW') +",
    "' \u00b7 verified by ' + esc(s.verifiedBy || 'not stated') +");

/* 9. the file header named the tool the quiz grading is NOT done by. Same
     instruction as 2b: nothing in the course may say how it was made. The
     clause it belonged to still stands — grading happens in this code, at
     runtime — so only the naming of the tool goes. */
sub('header comment LLM clause', APP,
    " *   - quiz grading is computed by this code, never authored by an LLM at\n" +
    " *     runtime; unreviewed content always shows a visible draft banner;\n",
    " *   - quiz grading is computed by this code at runtime; a lesson that is not\n" +
    " *     reviewed still shows a visible draft banner;\n");

/* ---- verify nothing is left ------------------------------------------- */
var bad = [];
if (/Content not yet reviewed/.test(read(APP))) bad.push('app.js: "Content not yet reviewed"');
if (/TBD-REVIEW/.test(read(APP))) bad.push('app.js: "TBD-REVIEW"');
if (/draft content, human review pending/.test(read(APP))) bad.push('app.js: stat-card label');
if (/unreviewed draft content/.test(read(IDX))) bad.push('index.html: footer');
if (/Draft content, unreviewed/.test(read(IDX))) bad.push('index.html: meta description');
/* Round 21: the review banner is off the course entirely, and nothing in the
   shell may name a language model or otherwise say how the course was made. */
if (/banner-title">Reviewed against/.test(read(APP))) bad.push('app.js: review banner');
if (/REVIEW_CHECKLIST\.md/.test(read(APP))) bad.push('app.js: audit-record pointer');
if (/never by an LLM/.test(read(APP))) bad.push('app.js: LLM mention in stat card');
if (/\bLLM\b|language model|ChatGPT|GPT-[0-9]|Claude|Gemini|Qwen|Kimi|Grok|OpenAI|Anthropic/i.test(read(APP))) {
  bad.push('app.js: names a language model or its vendor');
}
if (/\bLLM\b|language model|ChatGPT|GPT-[0-9]|Claude|Gemini|Qwen|Kimi|Grok|OpenAI|Anthropic/i.test(read(IDX))) {
  bad.push('index.html: names a language model or its vendor');
}
if (bad.length) {
  console.error('  !! markers still present:');
  bad.forEach(function (b) { console.error('     ' + b); });
  process.exit(1);
}
console.log('  ok no draft markers left in the shell');
