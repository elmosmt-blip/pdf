#!/usr/bin/env node
/*
 * banner-check.js — renders a lesson through the real app.js in a stubbed DOM
 * and asserts that none of the review markers are visible to the reader.
 *
 * The markers are suppressed in three independent places, so this checks all
 * three at once:
 *   - draftBannerHtml()  -> the "This lesson is a draft" banner
 *   - the "TBD-REVIEW" text suffix that apply-marker-removal.js stripped
 *   - statusChip()       -> draft-styled chip vs. green chip
 *
 * usage:  node banner-check.js <dir-with-index.html> <lessonId>
 * exit 0 = no markers visible for that lesson, 1 = markers still visible.
 */
'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var dir = process.argv[2] || '.';
var arg = String(process.argv[3] || 'm01l01');
var target = '#/l/' + arg.replace(/^#\/l\//, '');

function makeEl(id) {
  return {
    id: id, style: {}, _html: '', children: [],
    set innerHTML(v) { this._html = String(v); },
    get innerHTML() { return this._html; },
    appendChild: function () {}, setAttribute: function () {}, addEventListener: function () {},
    classList: { add: function () {}, remove: function () {}, toggle: function () {} },
    querySelector: function () { return null; }, querySelectorAll: function () { return []; }
  };
}

var els = {};
['toc', 'main', 'data-source', 'side-pct', 'side-bar', 'topbar-crumb', 'app', 'topbar'].forEach(function (i) {
  els[i] = makeEl(i);
});

var store = {};
var sandbox = {
  console: { log: function () {}, error: function () {}, warn: function () {} },
  setTimeout: setTimeout, clearTimeout: clearTimeout,
  setInterval: setInterval, clearInterval: clearInterval, Promise: Promise,
  document: {
    getElementById: function (id) { return els[id] || null; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    createElement: function () { return makeEl('c'); },
    addEventListener: function () {}, title: 'banner-check'
  },
  localStorage: {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
  },
  location: { hash: target, href: 'file:///index.html', pathname: '/index.html', search: '' },
  history: { pushState: function () {}, replaceState: function () {} },
  addEventListener: function () {}, scrollTo: function () {},
  requestAnimationFrame: function (cb) { return setTimeout(cb, 0); },
  navigator: { userAgent: 'banner-check' }
};
sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.self = sandbox;

var ctx = vm.createContext(sandbox);
['assets/data-embed.js', 'assets/app.js'].forEach(function (s) {
  vm.runInContext(fs.readFileSync(path.join(dir, s), 'utf8'), ctx, { filename: s });
});

function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }

(async function () {
  for (var i = 0; i < 25; i++) await tick();
  var html = els.main ? els.main._html : '';
  var banner = /This lesson is a draft/i.test(html);
  var tbd = /TBD-REVIEW/i.test(html);
  var draftChip = /chip chip--draft/.test(html);
  var okChip = /chip chip--ok/.test(html);

  console.log('  #main rendered            : ' + html.length + ' chars');
  console.log('  draft banner              : ' + (banner ? 'YES  <-- still a draft' : 'no'));
  console.log('  "TBD-REVIEW" text         : ' + (tbd ? 'YES  <-- marker still shown' : 'no'));
  console.log('  draft-styled status chip  : ' + (draftChip ? 'YES  <-- still flagged' : 'no'));
  console.log('  green status chip         : ' + (okChip ? 'yes' : 'no'));

  var bad = banner || tbd || draftChip;
  console.log(bad ? '\n  RESULT: markers still visible'
                  : '\n  RESULT: markers gone from the rendered page');
  process.exit(bad ? 1 : 0);
})();
