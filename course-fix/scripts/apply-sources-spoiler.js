#!/usr/bin/env node
/**
 * apply-sources-spoiler.js — put the per-lesson Sources list under a spoiler.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every lesson ends with a Sources section: one card per cited source, each
 * carrying the edition, the clause, the licence and who verified it and when.
 * It is the provenance trail, and it is the longest thing on the page.
 *
 * The author asked for it to be collapsed by default. The reader who wants the
 * trail opens it; the reader who is working through the method is not made to
 * scroll past nine provenance cards to reach the next lesson.
 *
 * The course already has a spoiler pattern — "Show worked solution" in the calc
 * block uses `<details><summary>…</summary><div class="details-body">…</div>
 * </details>`. This reuses it exactly, so the Sources section looks and behaves
 * like something the course already does rather than a new invention.
 *
 * WHAT THIS DOES
 * --------------
 * 1. app.js, sourcesHtml(): the `<h2>Sources</h2>` heading becomes a
 *    `<summary>`, the count is folded into it, and the `<ul>` moves inside
 *    `<details><div class="details-body">`.
 * 2. style.css: `.sources details` drops the outer panel and border that the
 *    generic `details` rule gives it, because the source cards inside already
 *    carry their own panel — otherwise it renders as a box inside a box.
 *
 * Idempotent: every substitution is guarded on the presence of its old text,
 * and the CSS append is guarded on the absence of its marker.
 *
 * Usage: node apply-sources-spoiler.js <dir-containing-assets>
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
var CSS = 'assets/style.css';

/* 1. the opening: heading becomes a summary, the list moves inside details. */
sub('sources spoiler — opening', APP,
    "    var html = '<section class=\"sources\"><h2>Sources</h2>';\n" +
    "    if (!refs.length) {\n" +
    "      return html + '<p class=\"muted flush\">No source is cited for this lesson yet. ' +\n" +
    "        'Contract rule: every number must cite a <code>src-\u2026</code> entry.</p></section>';\n" +
    "    }\n" +
    "    html += '<ul>';\n",
    "    var html = '<section class=\"sources\"><details class=\"spoiler\">' +\n" +
    "      '<summary>Sources' + (refs.length ? ' \u2014 ' + refs.length : '') + '</summary>' +\n" +
    "      '<div class=\"details-body\">';\n" +
    "    if (!refs.length) {\n" +
    "      return html + '<p class=\"muted flush\">No source is cited for this lesson yet. ' +\n" +
    "        'Contract rule: every number must cite a <code>src-\u2026</code> entry.</p>' +\n" +
    "        '</div></details></section>';\n" +
    "    }\n" +
    "    html += '<ul>';\n");

/* 2. the closing: close the wrapper the opening opened. */
sub('sources spoiler — closing', APP,
    "    return html + '</ul></section>';\n",
    "    return html + '</ul></div></details></section>';\n");

/* 3. the CSS. The generic `details` rule gives every details element a panel
     background, a border and 12px/20px padding. The source cards inside
     already have their own panel, so an outer one renders as a box inside a
     box — this strips it and leaves the summary as the only chrome. */
var css = read(CSS);
if (css.indexOf('.sources details') >= 0) {
  console.log('  -- sources spoiler CSS: already applied');
} else {
  write(CSS, css + [
    '',
    '/* ---------- sources spoiler ----------',
    ' * The source cards carry their own panel, so the generic `details` panel',
    ' * above would render as a box inside a box. Strip it and leave the summary',
    ' * as the only chrome, matching the "Show worked solution" spoiler. */',
    '.sources details{border:0;padding:0;margin:0;background:none}',
    '.sources summary{padding:0 0 12px;font-size:15px}',
    '.sources .details-body{padding:0}',
    ''
  ].join('\n'));
  console.log('  ok sources spoiler CSS');
}

/* ---- verify it landed ---------------------------------------------------- */
var app = read(APP);
var bad = [];
if (app.indexOf('<h2>Sources</h2>') >= 0) bad.push('app.js: the Sources heading is still a plain h2');
if (app.indexOf('<details class="spoiler">') < 0) bad.push('app.js: no spoiler wrapper');
if (app.split('</ul></div></details></section>').length - 1 !== 1) bad.push('app.js: the spoiler is not closed exactly once');
if (read(CSS).indexOf('.sources details') < 0) bad.push('style.css: no sources spoiler rule');
if (bad.length) {
  console.error('  !! the spoiler did not land:');
  bad.forEach(function (b) { console.error('     ' + b); });
  process.exit(1);
}
console.log('  ok sources are behind a spoiler');
