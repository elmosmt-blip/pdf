#!/usr/bin/env node
/*
 * banner-check.js — renders a route through the real app.js in a stubbed DOM
 * and asserts that none of the review markers are visible to the reader.
 *
 * The markers are suppressed in three independent places, so this checks all
 * three at once:
 *   - draftBannerHtml()  -> the "This lesson is a draft" banner
 *   - the "TBD-REVIEW" text suffix that apply-marker-removal.js stripped
 *   - statusChip()       -> draft-styled chip vs. green chip
 *
 * It also renders the module index, which is where the round-18 review banner
 * used to live. That banner was deleted in round 21 at the author's request,
 * and a render-level assertion is the only way to prove it is really gone: the
 * greps in rebuild-work.sh read the source, and the source is not what a
 * reader sees.
 *
 * usage:  node banner-check.js <dir-with-index.html> [lessonId]
 * exit 0 = no markers visible on either route, 1 = markers still visible.
 */
'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var dir = process.argv[2] || '.';
var arg = String(process.argv[3] || 'm01l01');

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

/* Render one route in a fresh context and return #main's innerHTML. */
function render(hash) {
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
    location: { hash: hash, href: 'file:///index.html', pathname: '/index.html', search: '' },
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
  return els.main ? els.main._html : '';
}

function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }

/* Anything that names a language model, or that points at the audit record
   from inside the course, is out of scope for the shipped product. */
var LLM = /\bLLM\b|language model|ChatGPT|GPT-[0-9]|Claude|Gemini|Qwen|Kimi|Grok|OpenAI|Anthropic/i;

(async function () {
  var problems = [];

  /* ---- route 1: a lesson ------------------------------------------------ */
  var lessonHtml = render('#/l/' + arg.replace(/^#\/l\//, ''));
  for (var i = 0; i < 25; i++) await tick();
  lessonHtml = render('#/l/' + arg.replace(/^#\/l\//, ''));
  for (var i = 0; i < 25; i++) await tick();

  var banner = /This lesson is a draft/i.test(lessonHtml);
  var tbd = /TBD-REVIEW/i.test(lessonHtml);
  var draftChip = /chip chip--draft/.test(lessonHtml);
  var okChip = /chip chip--ok/.test(lessonHtml);

  console.log('  lesson route  ' + arg);
  console.log('    #main rendered            : ' + lessonHtml.length + ' chars');
  console.log('    draft banner              : ' + (banner ? 'YES  <-- still a draft' : 'no'));
  console.log('    "TBD-REVIEW" text         : ' + (tbd ? 'YES  <-- marker still shown' : 'no'));
  console.log('    draft-styled status chip  : ' + (draftChip ? 'YES  <-- still flagged' : 'no'));
  console.log('    green status chip         : ' + (okChip ? 'yes' : 'no'));
  if (banner) problems.push('lesson route: draft banner still rendered');
  if (tbd) problems.push('lesson route: TBD-REVIEW still rendered');
  if (draftChip) problems.push('lesson route: draft chip still rendered');
  if (LLM.test(lessonHtml)) problems.push('lesson route: names a language model');

  /* ---- route 2: the module index, where the review banner lived --------- */
  var indexHtml = render('');
  for (var i = 0; i < 25; i++) await tick();

  var reviewBanner = /banner-title">Reviewed against/.test(indexHtml);
  var auditPointer = /REVIEW_CHECKLIST\.md/.test(indexHtml);
  var llmStat = /never by an LLM/i.test(indexHtml);

  console.log('  index route  #/');
  console.log('    #main rendered            : ' + indexHtml.length + ' chars');
  console.log('    review banner             : ' + (reviewBanner ? 'YES  <-- still on the page' : 'no'));
  console.log('    audit-record pointer      : ' + (auditPointer ? 'YES  <-- still on the page' : 'no'));
  console.log('    LLM in a stat card        : ' + (llmStat ? 'YES  <-- still on the page' : 'no'));
  if (reviewBanner) problems.push('index route: review banner still rendered');
  if (auditPointer) problems.push('index route: audit-record pointer still rendered');
  if (llmStat) problems.push('index route: LLM mention still rendered');
  if (LLM.test(indexHtml)) problems.push('index route: names a language model');

  if (problems.length) {
    console.log('\n  RESULT: markers still visible');
    problems.forEach(function (p) { console.log('    - ' + p); });
    process.exit(1);
  }
  console.log('\n  RESULT: markers gone from the rendered page');
  process.exit(0);
})();
