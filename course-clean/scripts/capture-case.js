#!/usr/bin/env node
/* =========================================================================
 * capture-case.js — render a case page and capture what it looks like
 *
 * Two outputs, deliberately different:
 *
 *   --outline   the REAL rendered DOM, produced by running the shipped
 *               app.js in jsdom and serialising the #main subtree. This is
 *               what a browser would lay out — same HTML, same classes, same
 *               text — and it is honest evidence that the page renders.
 *
 *   --png       a pixel screenshot. Needs a browser binary, so this path is
 *               opt-in: set CHROME_BIN (or install puppeteer/playwright) and
 *               the script shells out. In a sandbox without a browser it says
 *               so and exits 2 rather than producing a picture that was not a
 *               screenshot of the page.
 *
 * Usage:
 *   node scripts/capture-case.js cx-m03-01 --outline
 *   node scripts/capture-case.js cx-m03-01 --png docs/screenshots/cx-m03-01.png
 *   node scripts/capture-case.js --all --outline     # every case
 * ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build', 'course-clean');

function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? null : (process.argv[i + 1] && process.argv[i + 1].charAt(0) !== '-' ? process.argv[i + 1] : true);
}

/* Load the built page the same way the test suite does: the shipped index, the
 * shipped embed, the shipped app.js. Nothing is stubbed except fetch/scroll. */
function loadPage(hash) {
  let JSDOM;
  try {
    JSDOM = require(path.join(ROOT, 'node_modules', 'jsdom')).JSDOM;
  } catch (e) {
    console.error('capture: jsdom is not installed (npm install --no-save jsdom)');
    process.exit(2);
  }
  const index = fs.readFileSync(path.join(BUILD, 'index.html'), 'utf8');
  const dom = new JSDOM(index, {
    url: 'http://localhost/' + hash,
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  const win = dom.window;
  win.fetch = undefined;                    // force the embed path, no network
  win.scrollTo = function () {};
  win.eval(fs.readFileSync(path.join(BUILD, 'assets', 'data-embed.js'), 'utf8'));
  win.eval(fs.readFileSync(path.join(BUILD, 'assets', 'app.js'), 'utf8'));
  return dom;
}

function outline(dom) {
  const main = dom.window.document.getElementById('main');
  const lines = [];
  const pad = function (n) { return new Array(n + 1).join('  '); };

  (function walk(node, depth) {
    if (node.nodeType === 3) {
      const t = node.textContent.replace(/\s+/g, ' ').trim();
      if (t) lines.push(pad(depth) + '"' + t.slice(0, 110) + (t.length > 110 ? '…' : '') + '"');
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node;
    const tag = el.tagName.toLowerCase();
    if (tag === 'script' || tag === 'style') return;
    const bits = [tag];
    if (el.id) bits.push('#' + el.id);
    if (el.className && typeof el.className === 'string') {
      bits.push('.' + el.className.trim().split(/\s+/).join('.'));
    }
    ['href', 'type', 'name', 'value', 'role', 'hidden', 'data-act'].forEach(function (a) {
      if (el.hasAttribute(a)) bits.push(a + '=' + el.getAttribute(a));
    });
    const textLen = (el.textContent || '').replace(/\s+/g, ' ').trim().length;
    lines.push(pad(depth) + bits.join(' ') + (textLen ? '   [' + textLen + ' chars]' : ''));
    Array.prototype.forEach.call(el.childNodes, function (c) { walk(c, depth + 1); });
  })(main, 0);

  return lines.join('\n');
}

function png(hash, out) {
  const chrome = process.env.CHROME_BIN || which('chromium') || which('chromium-browser') ||
    which('google-chrome') || which('chrome');
  if (!chrome) {
    console.error('capture --png: no browser binary found.');
    console.error('  Tried CHROME_BIN, chromium, chromium-browser, google-chrome, chrome.');
    console.error('  A screenshot needs a real browser; install one, or run this on a machine that has it.');
    return 2;
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const url = 'file://' + path.join(BUILD, 'index.html') + hash;
  execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-sandbox',
    '--window-size=1440,1800', '--virtual-time-budget=4000',
    '--screenshot=' + out, url
  ], { stdio: ['ignore', 'ignore', 'inherit'] });
  console.log('wrote ' + path.relative(ROOT, out) + ' (' + fs.statSync(out).size + ' bytes)');
  return 0;
}

function which(bin) {
  try {
    const out = execFileSync('sh', ['-c', 'command -v ' + bin], { encoding: 'utf8' }).trim();
    return out || null;
  } catch (e) { return null; }
}

function main() {
  const target = process.argv[2] && process.argv[2].charAt(0) !== '-' ? process.argv[2] : null;
  const all = process.argv.includes('--all');
  const pngOut = arg('--png');

  const cases = JSON.parse(fs.readFileSync(path.join(BUILD, 'data', 'cases.json'), 'utf8')).cases;
  const ids = all ? cases.map(function (c) { return c.caseId; }) : (target ? [target] : null);
  if (!ids) {
    console.error('usage: capture-case.js <caseId> [--outline] | --all --outline');
    return 1;
  }

  let code = 0;
  ids.forEach(function (id) {
    if (pngOut) {
      code = Math.max(code, png('#/c/' + id, typeof pngOut === 'string' && !all
        ? pngOut : path.join(ROOT, 'docs', 'screenshots', id + '.png')));
      return;
    }
    const dom = loadPage('#/c/' + id);
    /* --solved drives the page the way a learner would: type every keyed
     * answer, click every keyed option, submit, then capture the result. */
    if (process.argv.includes('--solved')) {
      const doc = dom.window.document;
      const c = cases.filter(function (x) { return x.caseId === id; })[0];
      c.steps.forEach(function (st) {
        if (st.type === 'numeric') {
          const input = doc.querySelector('#in-' + st.id);
          input.value = String(st.answer.value);
          input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
        } else {
          doc.querySelector('input[name="c-' + st.id + '"][value="' + st.answer.value + '"]').click();
        }
      });
      doc.querySelector('form.case-form')
        .dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    }
    const text = outline(dom);
    const suffix = process.argv.includes('--solved') ? '.solved.outline.txt' : '.outline.txt';
    const out = path.join(ROOT, 'docs', 'screenshots', id + suffix);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, 'Rendered outline of #/c/' + id + '\n' +
      'Produced by scripts/capture-case.js from the built tree (build/course-clean).\n' +
      'This is the live DOM from the shipped engine, not a mock-up.\n\n' + text + '\n');
    console.log('wrote ' + path.relative(ROOT, out) + '  (' + text.split('\n').length + ' nodes)');
    dom.window.close();
  });
  return code;
}

if (require.main === module) process.exitCode = main();
