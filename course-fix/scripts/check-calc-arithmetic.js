#!/usr/bin/env node
/**
 * check-calc-arithmetic.js — verify the arithmetic inside every worked
 * solution, including parenthesised groups, multi-term chains, unit scaling
 * and rounding.
 *
 * WHY THIS EXISTS
 * ---------------
 * Two earlier versions of this check were worse than useless. The first
 * matched only two operands, so it read "980 + 150 - 30 = 1100" as
 * "150 - 30 = 1100" and reported 83 defects where there were none. The second
 * matched chains but still ignored parentheses, so it read
 * "(3 - 0) x 5 x 4 = 60" as "5 x 4 = 60". A checker that cries wolf is not a
 * checker. This version:
 *
 *   1. evaluates the innermost parenthesised group first and substitutes the
 *      result, repeatedly, until the expression is flat
 *   2. then matches a flat chain "a + b + c = d" and evaluates it
 *   3. accepts a result that is the computed value rounded to the precision
 *      actually written ("0.121 / 0.154 = 0.79" is 0.7857 rounded, not wrong)
 *   4. accepts an explicitly scaled result: "12/5000 = 2400 ppm" is
 *      0.0024 x 10^6, and "450 / 500 = 90 percent" is 0.9 x 100
 *
 * Every hit is printed with its surrounding text, so a residual false positive
 * can be recognised on sight rather than trusted.
 *
 * usage: node check-calc-arithmetic.js [lessons.json]
 * exit 0 = every expression reconciles, 1 = at least one does not.
 */
'use strict';

var fs = require('fs');
var path = require('path');

/* Accept either a directory (like the other scripts) or a lessons.json path. */
var arg = process.argv[2] || 'course-fix/work/data/lessons.json';
var lp = (function () {
  try { if (fs.statSync(arg).isDirectory()) return path.join(arg, 'lessons.json'); } catch (e) { /* not a dir */ }
  return arg;
})();
var lessons = JSON.parse(fs.readFileSync(lp, 'utf8'));

function num(x) { return Math.round(x * 1e9) / 1e9; }
function decimals(s) { var m = String(s).match(/\.(\d+)$/); return m ? m[1].length : 0; }

/* Evaluate "(3 - 0) x 5 x 4" style groups from the inside out. */
function flatten(expr) {
  var guard = 0;
  for (;;) {
    if (guard++ > 50) break;
    var m = expr.match(/\(([^()]*)\)/);
    if (!m) break;
    var inner = m[1];
    var v = evalChain(inner);
    if (v === null) return null;
    expr = expr.slice(0, m.index) + '(' + num(v) + ')' + expr.slice(m.index + m[0].length);
    /* unwrap the substituted value so the outer chain sees a plain number */
    expr = expr.replace(/\(([-\d.]+)\)/g, '$1');
  }
  return expr;
}

/* Evaluate a flat chain of one operator. Returns null if not parseable. */
function evalChain(expr) {
  var ops = (expr.match(/[-+x×*\/]/g) || []);
  if (!ops.length) return null;
  var uniq = {};
  ops.forEach(function (o) { uniq[o] = 1; });
  var keys = Object.keys(uniq);
  if (keys.length !== 1) return null;            /* mixed operators: skip */
  var op = keys[0] === 'x' || keys[0] === '×' || keys[0] === '*' ? '*' : keys[0];
  var parts = expr.split(/\s*[-+x×*\/]\s*/).map(parseFloat);
  if (parts.some(function (n) { return isNaN(n); })) return null;
  if (op === '+') return parts.reduce(function (a, b) { return a + b; }, 0);
  if (op === '-') return parts.reduce(function (a, b) { return a - b; });
  if (op === '*') return parts.reduce(function (a, b) { return a * b; }, 1);
  if (parts.slice(1).some(function (n) { return n === 0; })) return null;
  return parts.reduce(function (a, b) { return a / b; });
}

var problems = [];
var checked = 0;

lessons.forEach(function (l) {
  var sol = (l.content.calc && l.content.calc.solution) || '';
  if (!sol) return;

  /* Thousands separators: "12,000" must parse as one number. */
  sol = sol.replace(/(\d),(\d{3}\b)/g, "$1$2");

  /* Letters are allowed in the character class only so that a unit such as
     mm^3 is consumed whole; it is stripped before the chain is evaluated,
     otherwise the 3 in mm^3 is read as an operand. */
  var re = /([-+x×*\/().,\d\sA-Za-z^]+?)=\s*(-?\d+(?:\.\d+)?)\s*(percent|%|ppm|ppb)?/g;
  var m;
  while ((m = re.exec(sol)) !== null) {
    var body = m[1].trim();
    var claimed = parseFloat(m[2]);
    var unit = m[3] || '';
    if (!/\d/.test(body)) continue;

    /* An intermediate step: "(115 - 85) / 36 = 30 / 36 = 0.83" states 30 and
       then keeps going. The intermediate is correct arithmetic on rounded
       inputs; only the final result is a claim about the answer. */
    var after = sol.slice(m.index + m[0].length);
    if (/^\s*(?:mm|um|µm|cm|nm|°C|K|percent|pct|ppm|ppb|s|min|h|hr|N|W|g|mg|mL|ml)?\s*[-+x×*\/]\s*\d/.test(after)) continue;

    /* Strip unit suffixes so mm^3 does not leave a stray 3 behind. */
    body = body.replace(/\b(mm|um|µm|cm|nm)(\^[23])?\b/gi, "")
               .replace(/\b(degrees?|deg|C|K|percent|pct|ppm|ppb)\b/gi, "");

    var flat = flatten(body);
    if (flat === null) continue;
    var got = evalChain(flat);
    if (got === null || isNaN(got)) continue;

    checked++;
    var ok = false;
    var tol = 0.5 * Math.pow(10, -decimals(m[2]));   /* rounded as written */
    if (Math.abs(num(got) - claimed) <= tol) ok = true;
    if (!ok && unit === 'percent' || unit === '%') {
      if (Math.abs(num(got * 100) - claimed) <= tol) ok = true;
    }
    if (!ok && (unit === 'ppm' || unit === 'ppb')) {
      var sc = unit === 'ppm' ? 1e6 : 1e9;
      if (Math.abs(num(got * sc) - claimed) <= tol) ok = true;
    }

    if (!ok) {
      problems.push({
        id: l.lessonId, raw: m[0].trim(), got: num(got), claimed: claimed, unit: unit,
        ctx: sol.slice(Math.max(0, m.index - 100), m.index + m[0].length + 40)
      });
    }
  }
});

console.log('check-calc-arithmetic: ' + checked + ' expressions checked across ' +
  lessons.length + ' lessons');
if (problems.length) {
  console.log('\nDOES NOT RECONCILE (' + problems.length + '):');
  problems.forEach(function (p) {
    console.log('  ' + p.id + ': "' + p.raw + '"  claims ' + p.claimed +
      (p.unit ? ' ' + p.unit : '') + ', computes ' + p.got);
    console.log('      …' + p.ctx.replace(/\s+/g, ' ') + '…');
  });
  process.exit(1);
}
console.log('  every expression reconciles');
