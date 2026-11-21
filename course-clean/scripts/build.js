#!/usr/bin/env node
/* =========================================================================
 * build.js — assemble the deliverable tree in build/course-clean/
 *
 * The published course is a static directory. This script copies exactly the
 * files that belong in it, so an editor scratch file or a node_modules folder
 * can never leak into the release by accident.
 *
 * Included:
 *   index.html, README.txt, assets/ (js, css, fonts, img), data/, scripts/,
 *   REVIEW_CHECKLIST.md
 * Excluded:
 *   node_modules/, build/, docs/ (internal reports), *.bak, dotfiles
 *
 * Usage:
 *   node scripts/build.js             # build into build/
 *   node scripts/build.js --out DIR   # build elsewhere
 * ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const INCLUDE = [
  'index.html',
  'README.txt',
  'REVIEW_CHECKLIST.md',
  'assets/app.js',
  'assets/style.css',
  'assets/fonts.css',
  'assets/data-embed.js',
  'data/lessons.json',
  'data/questions.json',
  'data/sources.json',
  'data/cases.json'
];

function copyDir(from, to, filter) {
  fs.mkdirSync(to, { recursive: true });
  let n = 0;
  fs.readdirSync(from, { withFileTypes: true }).forEach(function (e) {
    const src = path.join(from, e.name);
    const dst = path.join(to, e.name);
    if (e.isDirectory()) { n += copyDir(src, dst, filter); return; }
    if (filter && !filter(e.name)) return;
    fs.copyFileSync(src, dst);
    n++;
  });
  return n;
}

function main(argv) {
  const oi = argv.indexOf('--out');
  const out = oi !== -1 && argv[oi + 1] ? path.resolve(argv[oi + 1]) : path.join(ROOT, 'build', 'course-clean');

  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  let files = 0;
  INCLUDE.forEach(function (rel) {
    const src = path.join(ROOT, rel);
    if (!fs.existsSync(src)) throw new Error('missing required file: ' + rel);
    const dst = path.join(out, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    files++;
  });

  /* Cache-busting by content, not by date.

   * The ?v= stamp in index.html was a DATE, so it stayed identical across builds
     within a day. A browser that had cached app.js then kept serving the old one
     after a rebuild — which is exactly how a reader ended up looking at a home
     page that did not contain the Toolkit cases block. The stamp is now a hash of
     the file's own bytes: change the file and the URL changes with it. */
  const crypto = require('crypto');
  const idxPath = path.join(out, 'index.html');
  let idx = fs.readFileSync(idxPath, 'utf8');

  function hashOf(rel) {
    const f = path.join(out, rel);
    if (!fs.existsSync(f)) return '0';
    return crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex').slice(0, 8);
  }

  let stamped = 0;
  idx = idx.replace(/(assets\/[a-z0-9-]+\.(?:js|css))\?v=[0-9a-f]*/gi, function (m, rel) {
    stamped++;
    return rel + '?v=' + hashOf(rel);
  });
  fs.writeFileSync(idxPath, idx);
  if (stamped < 3) {
    throw new Error('cache-busting rewrite matched ' + stamped + ' asset URLs; expected the ' +
      'font, style, embed and app links to carry ?v=');
  }

  /* fonts and images are whole directories */
  files += copyDir(path.join(ROOT, 'assets', 'fonts'), path.join(out, 'assets', 'fonts'));
  files += copyDir(path.join(ROOT, 'assets', 'img'), path.join(out, 'assets', 'img'),
    function (n) { return /\.(webp|png|svg|jpe?g)$/i.test(n); });

  /* the checks ship with the course so a recipient can re-run them */
  files += copyDir(path.join(ROOT, 'scripts'), path.join(out, 'scripts'),
    function (n) { return /\.js$/.test(n) && n.charAt(0) !== '_'; });
  /* scripts/content/ is editing source, not part of the deliverable */
  fs.rmSync(path.join(out, 'scripts', 'content'), { recursive: true, force: true });
  fs.rmSync(path.join(out, 'scripts', 'build.js'), { force: true });

  let bytes = 0;
  (function walk(d) {
    fs.readdirSync(d, { withFileTypes: true }).forEach(function (e) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else bytes += fs.statSync(p).size;
    });
  })(out);

  console.log('build: ' + path.relative(ROOT, out));
  console.log('  files ' + files);
  console.log('  bytes ' + bytes + ' (' + (bytes / 1048576).toFixed(1) + ' MB)');
  return 0;
}

if (require.main === module) {
  try { process.exitCode = main(process.argv.slice(2)); }
  catch (err) { console.error('build: ' + err.message); process.exitCode = 1; }
}

module.exports = { main: main, INCLUDE: INCLUDE };
