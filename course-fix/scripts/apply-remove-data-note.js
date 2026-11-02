#!/usr/bin/env node
/**
 * apply-remove-data-note.js — take the "Data: …" badge off the sidebar.
 *
 * WHY THIS EXISTS
 * ---------------
 * The sidebar footer carried a line telling the reader where the course data
 * came from: the live JSON over http, or the embedded snapshot over file://.
 * It was a build/runtime diagnostic wearing the costume of user-facing copy —
 * the reader does not care, and the "Re-run `node scripts/embed.js` after
 * editing data" clause is an instruction to whoever maintains the bundle, not
 * to whoever is studying. The author asked for it to go.
 *
 * WHAT THIS DOES
 * --------------
 * 1. index.html — deletes the `<p id="data-source">` placeholder outright.
 * 2. app.js — setDataNote() no longer writes text. It still records which
 *    branch loadCourse took, but invisibly, as `data-course-data` on #app.
 *
 * That second half is the load-bearing part. verify-runtime.js asserts on the
 * branch: it is the only proof that loadCourse reported back at all, and which
 * path it took. That proof is what caught the round-5 bundle — Cloudflare's
 * Rocket Loader had rewritten the script tags, so app.js never executed and
 * nothing ever reported back. Deleting the badge without preserving the signal
 * would have quietly disabled the regression test for the worst defect this
 * course has had. `data-course-data` is invisible to a reader and trivially
 * readable by the harness.
 *
 * The error path is unaffected: when the data cannot be loaded at all,
 * #main already renders "Course data not found" with the reason. The badge was
 * never the thing that told the reader the course was broken.
 *
 * Idempotent: both substitutions are guarded on the presence of their old text.
 *
 * Usage: node apply-remove-data-note.js <dir-containing-index.html-and-assets>
 */

'use strict';

var fs = require('fs');
var path = require('path');

var dir = process.argv[2] || '.';

function read(p) { return fs.readFileSync(path.join(dir, p), 'utf8'); }
function write(p, s) { fs.writeFileSync(path.join(dir, p), s); }

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

/* 1. the placeholder line in the sidebar footer. */
sub('sidebar data badge', IDX,
    '      <p id="data-source" class="muted">Data: loading\u2026</p>\n',
    '');

/* 2. the writer. Same information, no reader-facing text. */
sub('setDataNote', APP,
    "  function setDataNote(via, reason) {\n" +
    "    var el = document.getElementById('data-source');\n" +
    "    if (!el) return;\n" +
    "    if (via === 'fetch') {\n" +
    "      el.textContent = 'Data: data/lessons.json + questions.json + sources.json (fetched).';\n" +
    "    } else if (via === 'embed') {\n" +
    "      el.textContent = 'Data: assets/data-embed.js (embedded snapshot, ' + reason +\n" +
    "        '). Re-run `node scripts/embed.js` after editing data.';\n" +
    "    } else {\n" +
    "      el.textContent = 'Data: unavailable \u2014 ' + reason;\n" +
    "    }\n" +
    "  }\n",
    "  /* The reader-facing \"Data: \u2026\" badge is gone. The branch loadCourse took is\n" +
    "     still recorded, invisibly, because verify-runtime.js asserts on it: it is\n" +
    "     the only proof that loadCourse reported back and which path it took, and\n" +
    "     that proof is what caught the round-5 bundle that never ran at all. */\n" +
    "  function setDataNote(via, reason) {\n" +
    "    var el = document.getElementById('app');\n" +
    "    if (el && el.dataset) el.dataset.courseData = via;\n" +
    "  }\n");

/* ---- verify it landed ---------------------------------------------------- */
var bad = [];
if (read(IDX).indexOf('data-source') >= 0) bad.push('index.html: the badge element is still there');
if (read(APP).indexOf('Data: data/lessons.json') >= 0) bad.push('app.js: the fetch note text survives');
if (read(APP).indexOf('Data: assets/data-embed.js') >= 0) bad.push('app.js: the embed note text survives');
if (read(APP).indexOf('Data: unavailable') >= 0) bad.push('app.js: the unavailable note text survives');
if (read(APP).indexOf('dataset.courseData') < 0) bad.push('app.js: no invisible branch record');
if (bad.length) {
  console.error('  !! the badge did not come off cleanly:');
  bad.forEach(function (b) { console.error('     ' + b); });
  process.exit(1);
}
console.log('  ok the data badge is gone and the branch is still recorded');
