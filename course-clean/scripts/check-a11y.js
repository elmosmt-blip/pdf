#!/usr/bin/env node
/* =========================================================================
 * check-a11y.js — keyboard reachability and colour contrast (Phase 7)
 *
 * Two layers, both deterministic and offline:
 *
 *  1. CONTRAST — reads the :root palette from assets/style.css, composites
 *     translucent colours over the page background, and checks every
 *     text/background pair the stylesheet actually uses against WCAG 2.1 AA
 *     (4.5:1 for body text, 3:1 for large text and UI chrome). The print
 *     palette is checked the same way against white.
 *
 *  2. KEYBOARD — renders the home page, a lesson, a case, a path and the
 *     about page in jsdom and asserts:
 *       - a skip link exists and targets #main;
 *       - no element with a click behaviour is unreachable: every
 *         [data-act] control is a <button> or <a href>, every figure that
 *         zooms has tabindex="0" + role="button", nothing positive-tabindex;
 *       - every <img> has an alt attribute; every form field has a label;
 *       - every <a> has a non-empty href; no inline on* handlers;
 *       - Enter on a focused figure toggles its zoom and Escape closes it;
 *       - focus lands on the page <h1> after a route change.
 *
 * Exit 1 on any failure. Usage: node scripts/check-a11y.js
 * ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build', 'course-clean');

let pass = 0, fail = 0;
function ok(cond, label, detail) {
  if (cond) { pass++; return; }
  fail++;
  console.log('   FAIL ' + label + (detail ? ' — ' + detail : ''));
}

/* ------------------------------------------------------------ colour math */

function parseColor(str) {
  str = String(str).trim();
  let m;
  if ((m = str.match(/^#([0-9a-f]{3})$/i))) {
    return { r: parseInt(m[1][0] + m[1][0], 16), g: parseInt(m[1][1] + m[1][1], 16), b: parseInt(m[1][2] + m[1][2], 16), a: 1 };
  }
  if ((m = str.match(/^#([0-9a-f]{6})$/i))) {
    return { r: parseInt(m[1].slice(0, 2), 16), g: parseInt(m[1].slice(2, 4), 16), b: parseInt(m[1].slice(4, 6), 16), a: 1 };
  }
  if ((m = str.match(/^rgba?\(([^)]+)\)$/i))) {
    const p = m[1].split(',').map(function (x) { return parseFloat(x); });
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  const named = { white: '#ffffff', black: '#000000', transparent: 'rgba(0,0,0,0)' };
  if (named[str.toLowerCase()]) return parseColor(named[str.toLowerCase()]);
  return null;
}

function over(fg, bg) { // composite fg (with alpha) over opaque bg
  const a = fg.a == null ? 1 : fg.a;
  return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
}

function lum(c) {
  function ch(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
}

function ratio(fg, bg) {
  const l1 = lum(fg), l2 = lum(bg);
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

function opacityOf(css, selector) {
  const re = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\{[^}]*opacity:(\\.?[0-9.]+)');
  const m = css.match(re);
  return m ? parseFloat(m[1]) : 1;
}
function withAlpha(colorStr, a) {
  const c = parseColor(colorStr);
  return c ? { r: c.r, g: c.g, b: c.b, a: a } : null;
}

function readPalette(css, blockStart) {
  const i = css.indexOf(blockStart);
  if (i === -1) return null;
  const j = css.indexOf('}', i);
  const vars = {};
  css.slice(i, j).replace(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi, function (_, k, v) { vars[k] = v.trim(); return _; });
  return vars;
}

function contrastLayer() {
  console.log('-- contrast (WCAG 2.1 AA)');
  const css = fs.readFileSync(path.join(ROOT, 'assets', 'style.css'), 'utf8');

  /* screen palette */
  const v = readPalette(css, ':root{');
  ok(!!v, 'style.css has a :root palette');
  if (!v) return;
  const bg = parseColor(v.bg);
  const panel = over(parseColor(v.panel), bg);
  const strong = over(parseColor(v.strong), bg);
  const signalBg = over(parseColor('rgba(83,209,204,.08)'), bg); // chip / active row tint
  const white = parseColor('#ffffff');

  /* [label, foreground var or literal, background, minimum ratio] */
  const pairs = [
    ['body text on page', v.body, bg, 4.5],
    ['body text on panel', v.body, panel, 4.5],
    ['primary text on page', v.txt, bg, 4.5],
    ['headings (#fff) on page', '#ffffff', bg, 4.5],
    ['muted text on page', v.mut, bg, 4.5],
    ['muted text on panel', v.mut, panel, 4.5],
    ['muted text on sidebar', v.mut, strong, 4.5],
    ['dim text on page', v.dim, bg, 4.5],
    ['signal links on page', v.signal, bg, 4.5],
    ['signal links on panel', v.signal, panel, 4.5],
    ['signal text on signal tint (chips, active rows)', v.signal, signalBg, 4.5],
    ['primary button text on signal', '#0D1117', v.signal, 4.5],
    ['green status on page', v.green, bg, 3.0],
    ['orange warning text on page', v.orange, bg, 4.5],
    ['red error text on page', v.red, bg, 3.0],
    ['figure caption (#94a3b8) on panel', '#94a3b8', panel, 4.5],
    ['selection text (#fff) on selection tint', '#ffffff', over(parseColor('rgba(83,209,204,.35)'), bg), 4.5],
    ['focus ring (signal) against page', v.signal, bg, 3.0],
    ['panel border (line2) against page', v.line2, bg, 1.2], // decorative; must at least be visible
    /* dimmed states are opacity on top of a colour: composite them the way the browser does */
    ['dimmed quiz option (.opt--muted, body at ' + opacityOf(css, '.opt--muted') + ')', withAlpha(v.body, opacityOf(css, '.opt--muted')), bg, 4.5],
    ['locked exam row (.toc-exam--locked, mut at ' + opacityOf(css, '.toc-exam--locked') + ')', withAlpha(v.mut, opacityOf(css, '.toc-exam--locked')), strong, 4.5],
    ['sidebar build / version line', v.mut, strong, 4.5]
  ];
  pairs.forEach(function (p) {
    const fg = typeof p[1] === 'string' ? parseColor(p[1]) : p[1];
    const b = typeof p[2] === 'string' ? parseColor(p[2]) : p[2];
    if (!fg || !b) { ok(false, p[0], 'unparseable colour'); return; }
    const r = ratio(over(fg, b), b);
    ok(r >= p[3], p[0] + ' ≥ ' + p[3] + ':1', r.toFixed(2) + ':1');
    console.log('   ' + (r >= p[3] ? 'ok  ' : 'LOW ') + r.toFixed(2).padStart(6) + ':1  ' + p[0]);
  });

  /* print palette: everything on white */
  const pv = readPalette(css.slice(css.indexOf('@media print')), ':root{');
  ok(!!pv, 'print stylesheet redefines the palette for white paper');
  if (pv) {
    [['print body', pv.body], ['print muted', pv.mut], ['print dim', pv.dim], ['print links/signal', pv.signal],
      ['print green', pv.green], ['print orange', pv.orange], ['print red', pv.red]].forEach(function (p) {
      const fg = parseColor(p[1]);
      const r = fg ? ratio(fg, white) : 0;
      ok(r >= 4.5, p[0] + ' on white ≥ 4.5:1', r.toFixed(2) + ':1');
      console.log('   ' + (r >= 4.5 ? 'ok  ' : 'LOW ') + r.toFixed(2).padStart(6) + ':1  ' + p[0] + ' on white');
    });
  }

  /* :focus-visible rule must exist and must not be suppressed except on
     programmatic targets (h1/h2 after navigation) */
  ok(/:focus-visible\{outline:2px solid/.test(css), 'a visible focus ring is defined');
  const suppressed = css.match(/([^{}]+)\{outline:none\}/g) || [];
  const allowed = suppressed.every(function (rule) { return /^h1|^h2|,h1|,h2/.test(rule.replace(/\s/g, '')); });
  ok(allowed, 'outline:none is used only on programmatic focus targets', suppressed.join(' | '));
}

/* ------------------------------------------------------------- keyboard */

function keyboardLayer() {
  console.log('-- keyboard (jsdom)');
  let JSDOM;
  try { JSDOM = require(path.join(ROOT, 'node_modules', 'jsdom')).JSDOM; }
  catch (e) { console.log('   SKIP: jsdom is not installed'); return; }
  if (!fs.existsSync(path.join(BUILD, 'index.html'))) {
    console.log('   SKIP: build/course-clean missing — run node scripts/build.js');
    return;
  }

  function load(hash, seed) {
    const index = fs.readFileSync(path.join(BUILD, 'index.html'), 'utf8');
    const dom = new JSDOM(index, { url: 'http://localhost/' + hash, runScripts: 'outside-only', pretendToBeVisual: true });
    const w = dom.window;
    if (seed) w.localStorage.setItem('dfm-course-progress-v1', JSON.stringify(seed));
    w.fetch = undefined;
    w.scrollTo = function () {};
    w.eval(fs.readFileSync(path.join(BUILD, 'assets', 'data-embed.js'), 'utf8'));
    w.eval(fs.readFileSync(path.join(BUILD, 'assets', 'app.js'), 'utf8'));
    return dom;
  }

  const lessons = JSON.parse(fs.readFileSync(path.join(BUILD, 'data', 'lessons.json'), 'utf8'));
  const withImage = lessons.filter(function (l) {
    return JSON.stringify(l.content || {}).indexOf('"t":"image"') !== -1;
  })[0];
  const withFigure = lessons.filter(function (l) {
    return JSON.stringify(l.content || {}).indexOf('"t":"figure"') !== -1;
  })[0];

  const routes = ['#/', '#/l/' + (withImage ? withImage.lessonId : 'm01l01'),
    '#/l/' + (withFigure ? withFigure.lessonId : 'm06l02'), '#/c/cx-m06-01', '#/p/', '#/p/technologist', '#/about/', '#/g/', '#/f/'];

  routes.forEach(function (h) {
    const dom = load(h, { v: 1, visited: {}, quiz: {}, exams: {}, cases: {}, path: 'technologist' });
    const d = dom.window.document;
    const label = 'route ' + h;

    const skip = d.querySelector('a.skip-link');
    ok(!!skip && skip.getAttribute('href') === '#main', label + ': skip link targets #main');
    ok(!!d.getElementById('main'), label + ': #main exists');

    /* no inline handlers anywhere */
    ok(!d.querySelector('[onclick],[onkeydown],[onkeyup],[onchange],[onsubmit],[onerror],[onload]'),
      label + ': no inline event handlers');

    /* links need hrefs, buttons need a type, nothing has a positive tabindex */
    const badLinks = Array.prototype.filter.call(d.querySelectorAll('a'), function (a) {
      return !a.getAttribute('href');
    });
    ok(badLinks.length === 0, label + ': every <a> has an href', badLinks.length + ' without');
    const posTab = d.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])');
    ok(posTab.length === 0, label + ': no positive tabindex', String(posTab.length));
    const minusTab = Array.prototype.filter.call(d.querySelectorAll('[tabindex="-1"]'), function (el) {
      return ['H1', 'H2', 'MAIN'].indexOf(el.tagName) === -1;
    });
    ok(minusTab.length === 0, label + ': tabindex=-1 only on programmatic focus targets',
      minusTab.map(function (e) { return e.tagName + '.' + e.className; }).join(','));

    /* every data-act control is a native focusable element */
    const acts = Array.prototype.filter.call(d.querySelectorAll('[data-act]'), function (el) {
      return !(el.tagName === 'BUTTON' || (el.tagName === 'A' && el.getAttribute('href')) ||
        el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'SUMMARY');
    });
    ok(acts.length === 0, label + ': every [data-act] control is a button, link or field',
      acts.map(function (e) { return e.tagName + '[' + e.getAttribute('data-act') + ']'; }).join(','));

    /* zoomable figures are keyboard operable */
    const figs = d.querySelectorAll('.fig--photo, .fig--zoomable');
    const badFigs = Array.prototype.filter.call(figs, function (f) {
      return f.getAttribute('tabindex') !== '0' || f.getAttribute('role') !== 'button';
    });
    ok(badFigs.length === 0, label + ': zoomable figures have tabindex=0 and role=button', String(badFigs.length));

    /* images carry alt, fields carry labels */
    const noAlt = Array.prototype.filter.call(d.querySelectorAll('#main img'), function (im) { return !im.hasAttribute('alt'); });
    ok(noAlt.length === 0, label + ': every image has an alt attribute', String(noAlt.length));
    const unlabeled = Array.prototype.filter.call(d.querySelectorAll('#main input, #main select, #main textarea'), function (f) {
      if (f.type === 'hidden' || f.type === 'submit') return false;
      if (f.getAttribute('aria-label') || f.getAttribute('aria-labelledby')) return false;
      if (f.closest('label')) return false;
      return !(f.id && d.querySelector('label[for="' + f.id + '"]'));
    });
    ok(unlabeled.length === 0, label + ': every form field has a label', String(unlabeled.length));

    /* nav landmarks are labelled; the page has exactly one h1 */
    const navs = Array.prototype.filter.call(d.querySelectorAll('nav'), function (n) { return !n.getAttribute('aria-label'); });
    ok(navs.length === 0, label + ': every <nav> has an aria-label', String(navs.length));
    ok(d.querySelectorAll('#main h1').length === 1, label + ': exactly one h1 in main', String(d.querySelectorAll('#main h1').length));

    /* focus moved to the h1 on render */
    ok(d.activeElement && d.activeElement.tagName === 'H1', label + ': focus lands on the h1 after navigation',
      d.activeElement ? d.activeElement.tagName : 'none');

    /* the report link exists on lessons and cases and carries the id */
    if (/^#\/[lc]\//.test(h)) {
      const rl = d.querySelector('.report-link');
      ok(!!rl, label + ': has a Report an error link');
      if (rl) {
        const id = h.split('/').pop();
        ok(rl.getAttribute('href').indexOf(encodeURIComponent(id)) !== -1 || rl.getAttribute('href').indexOf(id) !== -1,
          label + ': report link carries the page id');
      }
      ok(!!d.querySelector('.print-meta'), label + ': has the print footer');
    }

    /* keyboard zoom: Enter toggles, Escape closes, focus returns */
    if (figs.length) {
      const f = figs[0];
      const w = dom.window;
      f.focus();
      f.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      ok(f.classList.contains('is-zoomed') && f.getAttribute('aria-pressed') === 'true', label + ': Enter zooms the focused figure');
      d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      ok(!f.classList.contains('is-zoomed') && f.getAttribute('aria-pressed') === 'false', label + ': Escape closes the zoom');
      f.dispatchEvent(new w.KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      ok(f.classList.contains('is-zoomed'), label + ': Space zooms too');
      f.dispatchEvent(new w.KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      ok(!f.classList.contains('is-zoomed'), label + ': Space again closes');
    }
    dom.window.close();
  });

  /* sidebar: every TOC entry is a real link; version line links to the change log */
  const home = load('#/');
  const hd = home.window.document;
  const tocNonLinks = hd.querySelectorAll('#toc [data-act], #toc [role="button"]');
  ok(tocNonLinks.length === 0, 'sidebar uses only links for navigation');
  ok(!!hd.querySelector('#side-build a[href="#/about/"]'), 'sidebar version links to the About page');
  ok(hd.querySelectorAll('.toc-paths a').length >= 3, 'sidebar lists the learning paths');
  home.window.close();
}

function main() {
  contrastLayer();
  keyboardLayer();
  console.log('\ncheck-a11y: ' + pass + ' passed, ' + fail + ' failed');
  return fail ? 1 : 0;
}

if (require.main === module) process.exitCode = main();
module.exports = { main: main, ratio: ratio, parseColor: parseColor };
