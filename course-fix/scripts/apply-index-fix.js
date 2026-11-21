#!/usr/bin/env node
/**
 * apply-index-fix.js — strip the Cloudflare Rocket Loader artefacts out of index.html.
 *
 * WHY THIS EXISTS
 * ---------------
 * The project on Drive was saved out of a Cloudflare-proxied page. Cloudflare's
 * Rocket Loader rewrites every inline script's MIME type to
 * `type="<hash>-text/javascript"` and appends its own loader:
 *
 *     <script src="assets/app.js?v=..." type="e3fd181901d15fcf324e36dc-text/javascript"></script>
 *     <script src="/cdn-cgi/scripts/.../rocket-loader.min.js" data-cf-settings="..." defer></script>
 *
 * A browser only executes a <script> whose type is a recognised JavaScript MIME
 * type (or "module"). `e3fd181901d15fcf324e36dc-text/javascript` is not one, so
 * the script becomes a data block and is skipped. app.js and data-embed.js
 * therefore never ran at all: the static shell rendered, #toc stayed empty, and
 * #main kept its literal "Loading course data..." placeholder forever.
 *
 * The rocket-loader line is dead weight on top of that. It points at an absolute
 * /cdn-cgi/ path, so it 404s over any local server and fails outright on file://,
 * and even when it did load it would try to re-execute scripts that no longer
 * carry its marker.
 *
 * WHAT THIS DOES
 * --------------
 *  1. deletes the rocket-loader <script> tag entirely
 *  2. strips the type attribute from every <script> whose type is not a
 *     recognised JavaScript MIME type
 *  3. leaves the ?v= cache-busting query strings alone
 *  4. verifies that every remaining <script src> resolves to a real file
 *
 * Idempotent: running it twice changes nothing the second time.
 *
 * Usage: node apply-index-fix.js <dir-containing-index.html>
 */

'use strict';

var fs = require('fs');
var path = require('path');

/* MIME types a browser will actually execute as JavaScript. */
var JS_TYPES = [
  'text/javascript',
  'application/javascript',
  'module',
  'text/ecmascript',
  'application/ecmascript',
  'importmap',
  'speculationrules'
];

function main() {
  var dir = process.argv[2];
  if (!dir) {
    console.error('usage: node apply-index-fix.js <dir-containing-index.html>');
    process.exit(2);
  }

  var file = path.join(dir, 'index.html');
  if (!fs.existsSync(file)) {
    console.error('apply-index-fix: ' + file + ' not found');
    process.exit(2);
  }

  var html = fs.readFileSync(file, 'utf8');
  var before = html;
  var removed = [];
  var stripped = [];

  /* 1. drop the rocket-loader tag, including any whitespace it leaves behind */
  html = html.replace(/[ \t]*<script\b[^>]*rocket-loader\.min\.js[^>]*>\s*<\/script>[ \t]*\n?/gi, function (m) {
    removed.push(m.trim());
    return '';
  });

  /* 2. strip type attributes that are not executable JavaScript */
  html = html.replace(/<script\b([^>]*)>/gi, function (whole, attrs) {
    var m = attrs.match(/\s+type\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (!m) return whole;
    var value = (m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : m[4]) || '').trim().toLowerCase();
    if (JS_TYPES.indexOf(value) !== -1) return whole;          /* already fine */
    var clean = attrs.replace(/\s+type\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i, '');
    stripped.push(value);
    return '<script' + clean + '>';
  });

  /* 3. any leftover Cloudflare marker attribute */
  html = html.replace(/\s+data-cf-settings\s*=\s*("[^"]*"|'[^']*')/gi, '');

  var changed = html !== before;
  if (changed) fs.writeFileSync(file, html);

  /* 4. every remaining external script must exist on disk */
  var missing = [];
  var refs = html.match(/<script\b[^>]*\bsrc\s*=\s*("([^"]*)"|'([^']*)')/gi) || [];
  refs.forEach(function (tag) {
    var m = tag.match(/\bsrc\s*=\s*("([^"]*)"|'([^']*)')/i);
    if (!m) return;
    var src = (m[2] !== undefined ? m[2] : m[3] || '').split('?')[0].split('#')[0];
    if (!src || /^([a-z]+:)?\/\//i.test(src)) return;          /* skip absolute URLs */
    if (!fs.existsSync(path.join(dir, src))) missing.push(src);
  });

  console.log('apply-index-fix: ' + file);
  console.log('  rocket-loader tags removed : ' + removed.length);
  removed.forEach(function (t) { console.log('    - ' + t); });
  console.log('  non-executable types stripped: ' + stripped.length);
  stripped.forEach(function (t) { console.log('    - type="' + t + '"'); });
  console.log('  changed                    : ' + (changed ? 'yes' : 'no (already clean)'));

  if (missing.length) {
    console.log('  MISSING script files       : ' + missing.join(', '));
    console.error('apply-index-fix: index.html references files that are not in the bundle');
    process.exit(1);
  }
  console.log('  all script src resolve     : yes');
  console.log('apply-index-fix: OK');
}

main();
