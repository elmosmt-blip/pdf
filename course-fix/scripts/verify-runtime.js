#!/usr/bin/env node
/**
 * verify-runtime.js — prove the delivered bundle actually boots.
 *
 * The round-5 bundle shipped a course that never ran: Cloudflare's Rocket Loader
 * had rewritten the script tags in index.html with a bogus MIME type, so the
 * browser skipped app.js entirely and left the static "Loading course data..."
 * placeholder on screen. Nothing in the old verification caught it, because that
 * verification only curled the files for HTTP 200 — a 200 says the bytes are
 * there, not that the browser executes them.
 *
 * This harness closes that hole. It:
 *   1. parses index.html and pulls the external <script> tags in document order
 *   2. asserts every one of them is actually executable (this is the regression
 *      test for the Cloudflare type attribute)
 *   3. loads them in that order into a vm context with a stubbed DOM, with
 *      window.fetch removed to simulate the file:// case
 *   4. asserts the course really rendered: #toc filled, #main no longer showing
 *      the loading placeholder, and #data-source reporting the embedded snapshot
 *
 * Usage: node verify-runtime.js <dir-containing-index.html>
 */

'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var JS_TYPES = ['', 'text/javascript', 'application/javascript', 'module'];

/* Recognised-but-non-JS types a browser also honours. */
var BROWSER_TYPES = JS_TYPES.concat(['importmap', 'speculationrules']);

function fail(msg) {
  console.error('verify-runtime: FAIL — ' + msg);
  process.exit(1);
}

function tick() {
  /* loadCourse resolves through a promise chain, so give the microtask
     and macrotask queues a few turns before asserting on the DOM. */
  return new Promise(function (r) { setTimeout(r, 0); });
}

async function main() {
  var dir = process.argv[2];
  if (!dir) {
    console.error('usage: node verify-runtime.js <dir-containing-index.html>');
    process.exit(2);
  }

  var html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');

  /* ---- 1. collect external scripts in document order -------------------- */
  var scripts = [];
  var re = /<script\b([^>]*)>/gi;
  var m;
  while ((m = re.exec(html)) !== null) {
    var attrs = m[1];
    var src = (attrs.match(/\bsrc\s*=\s*("([^"]*)"|'([^']*)')/i) || [])[2];
    if (!src) continue;                                    /* inline script */
    if (/^([a-z]+:)?\/\//i.test(src)) continue;             /* remote, ignore */
    var type = (attrs.match(/\btype\s*=\s*("([^"]*)"|'([^']*)')/i) || [])[2] || '';
    scripts.push({ src: src.split('?')[0].split('#')[0], type: type.trim().toLowerCase() });
  }

  if (!scripts.length) fail('index.html has no local <script src> tags');

  /* ---- 2. every script must be executable ------------------------------- */
  console.log('verify-runtime: ' + scripts.length + ' local script(s) in index.html');
  scripts.forEach(function (s) {
    var ok = BROWSER_TYPES.indexOf(s.type) !== -1;
    console.log('  ' + (ok ? 'exec ' : 'SKIP ') + s.src +
      (s.type ? '  type="' + s.type + '"' : '  (no type)'));
    if (!ok) {
      fail('script "' + s.src + '" carries type="' + s.type + '", which no browser ' +
        'executes as JavaScript. This is the Cloudflare Rocket Loader artefact — ' +
        'the course will render a static shell and never load its data.');
    }
    if (!fs.existsSync(path.join(dir, s.src))) fail('script "' + s.src + '" is missing from the bundle');
  });

  /* ---- 3. load them in order with a stubbed DOM ------------------------- */
  var elements = {};
  function makeEl(id) {
    var el = {
      id: id,
      _html: '',
      _text: '',
      style: {},
      dataset: {},
      children: [],
      set innerHTML(v) { this._html = String(v); },
      get innerHTML() { return this._html; },
      set textContent(v) { this._text = String(v); },
      get textContent() { return this._text; },
      appendChild: function (c) { this.children.push(c); return c; },
      removeChild: function () {},
      insertBefore: function () {},
      setAttribute: function () {},
      getAttribute: function () { return null; },
      removeAttribute: function () {},
      addEventListener: function () {},
      removeEventListener: function () {},
      querySelector: function () { return null; },
      querySelectorAll: function () { return []; },
      closest: function () { return null; },
      classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } },
      focus: function () {},
      blur: function () {},
      scrollIntoView: function () {},
      getBoundingClientRect: function () { return { top: 0, left: 0, width: 0, height: 0 }; },
      click: function () {}
    };
    return el;
  }

  ['toc', 'main', 'data-source', 'side-pct', 'side-bar', 'topbar-crumb', 'app', 'topbar'].forEach(function (id) {
    elements[id] = makeEl(id);
  });

  var store = {};
  var sandbox = {
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    Promise: Promise,
    document: {
      getElementById: function (id) { return elements[id] || null; },
      querySelector: function () { return null; },
      querySelectorAll: function () { return []; },
      createElement: function () { return makeEl('created'); },
      addEventListener: function () {},
      title: 'verify'
    },
    localStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
      setItem: function (k, v) { store[k] = String(v); },
      removeItem: function (k) { delete store[k]; }
    },
    location: { hash: '', href: 'file:///index.html', pathname: '/index.html', search: '' },
    history: { pushState: function () {}, replaceState: function () {} },
    addEventListener: function () {},
    scrollTo: function () {},
    requestAnimationFrame: function (cb) { return setTimeout(cb, 0); },
    navigator: { userAgent: 'verify-runtime' }
  };

  /* window.fetch is deliberately ABSENT by default — that is the file:// case.
     Pass --fetch-ok to install a working fetch that reads data/*.json off disk,
     which exercises the HTTP branch loadCourse prefers. */
  if (process.argv.indexOf('--fetch-ok') !== -1) {
    sandbox.fetch = function (url) {
      var p = String(url).split('?')[0].replace(/^\.?\//, '');
      var full = path.join(dir, p);
      if (!fs.existsSync(full)) return Promise.reject(new Error('404 ' + url));
      var body = fs.readFileSync(full, 'utf8');
      return Promise.resolve({
        ok: true,
        status: 200,
        json: function () { return Promise.resolve(JSON.parse(body)); }
      });
    };
  }
  var fetchOk = typeof sandbox.fetch === 'function';
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;

  var ctx = vm.createContext(sandbox);
  scripts.forEach(function (s) {
    var file = path.join(dir, s.src);
    var code = fs.readFileSync(file, 'utf8');
    try {
      vm.runInContext(code, ctx, { filename: s.src });
    } catch (e) {
      fail('script "' + s.src + '" threw while loading: ' + (e && e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : e));
    }
  });

  /* ---- 4. the course must have actually rendered ------------------------ */
  for (var i = 0; i < 20; i++) await tick();

  var problems = [];

  if (!sandbox.COURSE_DATA || !Array.isArray(sandbox.COURSE_DATA.lessons)) {
    problems.push('window.COURSE_DATA is not a populated snapshot — the file:// fallback has no data');
  } else {
    console.log('  COURSE_DATA: ' + sandbox.COURSE_DATA.lessons.length + ' lessons, ' +
      sandbox.COURSE_DATA.questions.length + ' questions, ' +
      sandbox.COURSE_DATA.sources.length + ' sources');
  }

  var mainHtml = elements['main'] ? elements['main']._html : '';
  if (/Loading course data/i.test(mainHtml)) {
    problems.push('#main still shows the "Loading course data…" placeholder — app.js did not take over');
  }
  if (mainHtml.length < 200) {
    problems.push('#main was never populated (' + (mainHtml ? mainHtml.length : 0) + ' chars)');
  }

  var tocHtml = elements['toc'] ? elements['toc']._html : '';
  var tocLinks = (tocHtml.match(/href="#\/m\//g) || []).length;
  if (!tocLinks) {
    problems.push('#toc has no module links — the sidebar outline never rendered');
  } else {
    console.log('  #toc: ' + tocLinks + ' module link(s) rendered');
  }

  var note = elements['data-source'] ? elements['data-source']._text : '';
  console.log('  #data-source: "' + note + '"');
  if (/^Data: loading/i.test(note) || !note) {
    problems.push('#data-source still shows the loading placeholder — loadCourse never reported back');
  } else if (fetchOk && !/fetched/i.test(note)) {
    problems.push("#data-source reports \"" + note + "\" but a working fetch was provided, so it should have used the live JSON");
  } else if (!fetchOk && !/embedded snapshot/i.test(note)) {
    problems.push('#data-source reports "' + note + '" but fetch is unavailable, so it should have fallen back to the embedded snapshot');
  }

  if (problems.length) {
    problems.forEach(function (p) { console.error('  ! ' + p); });
    fail('the bundle does not boot from file://');
  }

  console.log('verify-runtime: OK — the course boots and renders ' + tocLinks +
    ' module(s) via ' + (fetchOk ? 'the live JSON files' : 'the embedded snapshot (file://)'));
}

main();
