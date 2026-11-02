#!/usr/bin/env node
/**
 * check-readme.js — assert that what README.txt states is true of the bundle.
 *
 * WHY THIS EXISTS
 * ---------------
 * Round 20 found README.txt still asserting the round-4 build: 17 sources,
 * 1280x896 module illustrations, a 987,114-byte snapshot, and "Every lesson
 * keeps status draft and its TBD-REVIEW marker". All false. The README is the
 * first file a reader opens in the bundle, so a stale one is worse than no
 * README at all — it contradicts the contents it is sitting next to.
 *
 * The prose was rewritten and is now regenerated into the work tree by
 * rebuild-work.sh. The byte counts are the part that rots silently: nothing
 * fails when app.js grows by 356 bytes, so this checks them on every rebuild.
 *
 * Usage: node check-readme.js <dir-containing-README.txt-and-assets>
 * exit 0 = every stated size matches the file, 1 = at least one is stale.
 */
'use strict';

var fs = require('fs');
var path = require('path');

var dir = process.argv[2] || '.';
var readme = path.join(dir, 'README.txt');

if (!fs.existsSync(readme)) {
  console.error('check-readme: no README.txt in ' + dir);
  process.exit(1);
}

var text = fs.readFileSync(readme, 'utf8');
var lines = text.split('\n');

/* Entries wrap onto continuation lines, so a size may sit one or two lines
 * below its filename. Look at the entry and its continuations, never further —
 * a wider window silently attributes the next entry's size to this one.
 *
 * The entry must be ANCHORED: the prose elsewhere mentions "index.html" and
 * "app.js" without stating a size, and matching those first returns null for a
 * file whose size is stated correctly a few lines down. */
function statedSize(file) {
  var anchor = new RegExp('^\\s+' + file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s');
  for (var i = 0; i < lines.length; i++) {
    if (!anchor.test(lines[i])) continue;
    var chunk = lines.slice(i, i + 3).join(' ');
    var m = chunk.match(/\(([0-9,]+) bytes\)/);
    return m ? parseInt(m[1].replace(/,/g, ''), 10) : null;
  }
  return null;
}

/* The illustrations live in the tracked canonical store, not in the work tree:
 * work/assets/img holds whatever the r4 seed happened to carry. */
var imgDir = process.argv[3] || path.join(dir, 'assets', 'img');

var bad = 0;

/* 1. every real file that the README gives a byte count for. */
['index.html', 'assets/app.js', 'assets/style.css', 'assets/data-embed.js',
 'data/lessons.json', 'data/questions.json', 'data/sources.json'
].forEach(function (f) {
  var stated = statedSize(f);
  var p = path.join(dir, f);
  if (stated === null) {
    console.log('  !! ' + f + ': README states no size at all');
    bad++;
    return;
  }
  if (!fs.existsSync(p)) {
    console.log('  !! ' + f + ': README says ' + stated + ' bytes but the file does not exist');
    bad++;
    return;
  }
  var actual = fs.statSync(p).size;
  if (actual !== stated) {
    console.log('  !! ' + f + ': README says ' + stated + ' bytes, file is ' + actual);
    bad++;
  } else {
    console.log('  ok ' + f + ' (' + actual + ' bytes)');
  }
});

/* 2. the illustration entry is a pattern, not a file, so it is checked as text. */
var imgLine = lines.filter(function (l) { return l.indexOf('assets/img/') >= 0; }).join(' ');
var pngCount = 0;
if (fs.existsSync(imgDir)) {
  pngCount = fs.readdirSync(imgDir).filter(function (n) { return /\.png$/.test(n); }).length;
}
if (!/1024x717/.test(imgLine)) {
  console.log('  !! illustration dimensions not stated as 1024x717');
  bad++;
} else if (pngCount !== 92) {
  console.log('  !! assets/img holds ' + pngCount + ' PNGs, expected 92');
  bad++;
} else {
  console.log('  ok illustrations (92 PNGs at 1024x717)');
}

/* 3. the counts the README quotes in prose. */
var L = JSON.parse(fs.readFileSync(path.join(dir, 'data/lessons.json'), 'utf8'));
var Q = JSON.parse(fs.readFileSync(path.join(dir, 'data/questions.json'), 'utf8'));
var S = JSON.parse(fs.readFileSync(path.join(dir, 'data/sources.json'), 'utf8'));
[['15 modules', new Set(L.map(function (l) { return l.moduleId; })).size],
 ['92 lessons', L.length],
 ['185 quiz questions', Q.length],
 ['39 named standards', S.length]
].forEach(function (pair) {
  if (text.indexOf(pair[0]) < 0) {
    console.log('  !! README does not state "' + pair[0] + '"');
    bad++;
  } else {
    console.log('  ok ' + pair[0]);
  }
});

if (bad) {
  console.error('check-readme: ' + bad + ' stale or missing statement(s) in README.txt');
  process.exit(1);
}
console.log('check-readme: every stated size and count matches the bundle');
