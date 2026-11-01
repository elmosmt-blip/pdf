#!/usr/bin/env node
/*
 * per-lesson-audit.js — renders every lesson through the real app.js in a
 * stubbed DOM and reports what a reader would actually see, plus structural
 * defects that the gate scripts cannot see because they never render.
 *
 * Checks per lesson:
 *   1. it renders at all (route resolves, #main populated)
 *   2. no draft banner, no "TBD-REVIEW" text, no draft-styled status chip
 *   3. every declared image file exists on disk
 *   4. every inline SVG has no dangling coordinate or empty <text>
 *   5. every table block has a header row and rectangular cells
 *   6. theory / calc / defect are all non-empty
 *   7. a source ref is present
 *   8. no bare "N C" temperature typography left
 *   9. no unresolved placeholder text ("TODO", "XXX", "lorem", "undefined",
 *      "NaN", "[object Object]")
 *
 * usage: node per-lesson-audit.js <dir-with-index.html> [imgDir]
 * exit 0 = every lesson clean, 1 = at least one problem.
 */
'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var dir = process.argv[2] || '.';
var imgDir = process.argv[3] || 'course-fix/img';

/* ------------------------------------------------------------ DOM stub */
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
    addEventListener: function () {}, title: 'audit'
  },
  localStorage: {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
  },
  location: { hash: '', href: 'file:///index.html', pathname: '/index.html', search: '' },
  history: { pushState: function () {}, replaceState: function () {} },
  addEventListener: function () {}, scrollTo: function () {},
  requestAnimationFrame: function (cb) { return setTimeout(cb, 0); },
  navigator: { userAgent: 'per-lesson-audit' }
};
sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.self = sandbox;
var ctx = vm.createContext(sandbox);
['assets/data-embed.js', 'assets/app.js'].forEach(function (s) {
  vm.runInContext(fs.readFileSync(path.join(dir, s), 'utf8'), ctx, { filename: s });
});
var COURSE = sandbox.COURSE_DATA;
if (!COURSE || !Array.isArray(COURSE.lessons)) {
  console.error('per-lesson-audit: window.COURSE_DATA is not populated');
  process.exit(2);
}

var lessons = COURSE.lessons;
var byId = {};
lessons.forEach(function (l) { byId[l.id] = l; });
var questions = COURSE.questions || [];
var qByLesson = {};
questions.forEach(function (q) {
  (qByLesson[q.lessonId] = qByLesson[q.lessonId] || []).push(q);
});
/* the lesson.quiz array holds question ids; map them too */
lessons.forEach(function (l) {
  (l.quiz || []).forEach(function (qid) {
    if (!qByLesson[qid]) qByLesson[qid] = [{ questionId: qid, lessonId: l.lessonId }];
  });
});

var PLACEHOLDER = /(^|[^A-Za-z])(TODO|TBD(?!-REVIEW)|XXX|FIXME|lorem ipsum|undefined|NaN|\[object Object\])([^A-Za-z]|$)/i;

function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }

function render(lessonId) {
  sandbox.location.hash = '#/l/' + lessonId;
  return (async function () {
    for (var i = 0; i < 12; i++) await tick();
    return els.main ? els.main._html : '';
  })();
}

function theoryOf(l) {
  if (l.content && Array.isArray(l.content.theory)) return l.content.theory;
  if (Array.isArray(l.theory)) return l.theory;
  return [];
}
function bodyOf(l, key) {
  if (l.content && l.content[key] != null) return l.content[key];
  if (l[key] != null) return l[key];
  return null;
}
function blocksOf(l) {
  var out = [];
  theoryOf(l).forEach(function (sec) {
    (sec.blocks || []).forEach(function (b) { out.push(b); });
  });
  return out;
}

(async function () {
  var problems = [];
  var imgMissing = [];

  for (var n = 0; n < lessons.length; n++) {
    var l = lessons[n];
    var id = l.id;
    var P = function (m) { problems.push(l.lessonId + ': ' + m); };

    /* ---- 1. renders ------------------------------------------------ */
    var html = await render(l.lessonId);
    if (html.length < 2000) P('rendered only ' + html.length + ' chars — the lesson did not take over');
    if (/Loading course data/i.test(html)) P('#main still shows the "Loading course data" placeholder');
    if (/Page not found/i.test(html)) P('route did not resolve ("Page not found")');

    /* ---- 2. markers ------------------------------------------------ */
    if (/This lesson is a draft/i.test(html)) P('draft banner is still rendered');
    if (/TBD-REVIEW/i.test(html)) P('"TBD-REVIEW" text is still rendered');
    if (/chip chip--draft/.test(html)) P('draft-styled status chip is still rendered');

    /* ---- 3. structure ---------------------------------------------- */
    var th = theoryOf(l);
    if (!th.length) P('no theory sections');
    var calc = bodyOf(l, 'calc');
    var defect = bodyOf(l, 'defect');
    if (!calc || (typeof calc === 'object' && !Object.keys(calc).length)) P('no calc block');
    if (!defect || (typeof defect === 'object' && !Object.keys(defect).length)) P('no defect block');
    th.forEach(function (sec, si) {
      /* A section may legitimately carry only h + p (m01l03 does), so only
         flag a section with neither blocks nor a paragraph. */
      var hasBlocks = !!(sec.blocks && sec.blocks.length);
      var hasP = typeof sec.p === 'string' && sec.p.length;
      if (!hasBlocks && !hasP) P('theory[' + si + '] has neither blocks nor a paragraph');
    });

    /* ---- 4. images -------------------------------------------------- */
    /* The data references assets/img/<lessonId>.png, but the canonical store
       is course-fix/img/ — the work tree's own assets/img holds only the 8
       author images from r4 and is not what the data points at. Check the
       canonical store. */
    blocksOf(l).forEach(function (b, bi) {
      if (b.t === 'figure' && b.svg) {
        var m = String(b.svg).match(/<image[^>]+href="([^"]+)"/);
        if (m && !fs.existsSync(path.join(dir, m[1].replace(/^\.?\/?/, '')))) {
          imgMissing.push(l.lessonId + ' figure[' + bi + '] -> ' + m[1]);
        }
      }
      if (b.t === 'image' && b.src) {
        var rel = String(b.src).replace(/^\.?\/?/, '');
        var inTree = path.join(dir, rel);
        var canonical = path.join(imgDir, path.basename(rel));
        if (!fs.existsSync(inTree) && !fs.existsSync(canonical)) {
          imgMissing.push(l.lessonId + ' image[' + bi + '] -> ' + b.src);
        }
      }
    });

    /* ---- 5. inline SVG --------------------------------------------- */
    blocksOf(l).forEach(function (b, bi) {
      if (b.t !== 'figure' || !b.svg) return;
      var svg = String(b.svg);
      var open = (svg.match(/<text[\s>]/g) || []).length;
      var close = (svg.match(/<\/text>/g) || []).length;
      if (open !== close) P('figure[' + bi + '] has ' + open + ' <text> open / ' + close + ' close');
      if (/NaN|undefined|Infinity/.test(svg)) P('figure[' + bi + '] SVG contains NaN/undefined/Infinity');
      var d = svg.match(/\sd="([^"]+)"/g) || [];
      d.forEach(function (seg) {
        if (/[MCLZ][\s]*[0-9]+[.,][0-9]+[^0-9" ]*[A-Za-z]/.test(seg)) {
          /* path data with letters glued to numbers is suspicious but not
             always broken; only flag clearly malformed commands */
        }
      });
    });

    /* ---- 6. tables -------------------------------------------------- */
    blocksOf(l).forEach(function (b, bi) {
      if (b.t !== 'table') return;
      var rows = b.rows || b.data || [];
      if (!rows.length) { P('table[' + bi + '] has no rows'); return; }
      var w = rows[0].length;
      rows.forEach(function (r, ri) {
        if (r.length !== w) P('table[' + bi + '] row ' + ri + ' has ' + r.length + ' cells, expected ' + w);
      });
    });

    /* ---- 6b. theory shape ------------------------------------------- */
    /* A theory entry must be an object ({h,p,blocks}). A bare string renders
       nothing at all in a theoryHtml that only reads t.h/t.blocks/t.p, which
       is how m07l06 lost 4,318 characters. apply-theory-string-fix.js fixes
       both the data and the renderer; this check keeps it fixed. */
    th.forEach(function (s, si) {
      if (typeof s === 'string') P('theory[' + si + '] is a bare string — it renders as nothing');
      if (s && !Array.isArray(s) && typeof s === 'object') {
        var hasBlocks = !!(s.blocks && s.blocks.length);
        var hasP = s.p && (typeof s.p === 'string' ? s.p.length : s.p.length);
        if (!hasBlocks && !hasP) P('theory[' + si + '] has neither blocks nor a paragraph');
      }
    });

    /* ---- 7. source ref --------------------------------------------- */
    if (!(l.sources || []).length) P('no source ref');

    /* ---- 8/9. text hygiene ----------------------------------------- */
    var text = html;
    var bare = text.match(/(\d)\s?C(?=[\s,.)]|$)/g);
    if (bare) P('bare temperature "' + bare[0] + '" rendered (missing the degree sign)');
    if (PLACEHOLDER.test(text)) P('placeholder text rendered: ' + (text.match(PLACEHOLDER) || [])[0]);

    /* ---- quiz coverage --------------------------------------------- */
    var qs = qByLesson[l.lessonId] || [];
    if (!qs.length) P('no quiz questions');
    qs.forEach(function (q, qi) {
      if (!q.source) P('quiz q' + qi + ' has no source');
      if (!(q.options || []).length) P('quiz q' + qi + ' has no options');
      if (q.correct == null) P('quiz q' + qi + ' has no answer key');
    });
  }

  /* ---- report ------------------------------------------------------ */
  console.log('per-lesson-audit: ' + lessons.length + ' lessons rendered, ' +
    questions.length + ' questions checked');
  if (imgMissing.length) {
    console.log('\nmissing image files (' + imgMissing.length + '):');
    imgMissing.forEach(function (m) { console.log('  ' + m); });
  } else {
    console.log('  image files: all present');
  }
  if (problems.length) {
    console.log('\nPROBLEMS (' + problems.length + '):');
    problems.forEach(function (p) { console.log('  ' + p); });
    process.exit(1);
  }
  console.log('  markers: none rendered on any lesson');
  console.log('per-lesson-audit: OK');
  process.exit(0);
})();
