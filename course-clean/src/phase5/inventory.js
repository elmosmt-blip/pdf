#!/usr/bin/env node
/* inventory.js — every number and standard name per lesson, with counts.
 *
 * This is the guard for the editorial phase. The brief freezes numbers, units
 * and standard names; this prints what must survive, so an edit can be checked
 * against it instead of against a feeling.
 *
 *   node src/phase5/inventory.js m01l01     # one lesson
 *   node src/phase5/inventory.js --all      # counts only, for the report
 */
'use strict';
const { LESSONS_PATH, readJson } = require('./lib');

/* A number is a number; its unit is captured separately, and either way it has
 * to survive the edit. The lookbehind is what keeps "m01" from being read as a
 * distance of one metre. */
const NUM = /(?<![\w.-])[-+]?\d+(?:[.,]\d+)?/g;
const UNIT = /^\s?(%|°C|°|µm|um|mm|nm|cm|mL|nL|ppm|dppm|kg\/mm|N\/mm|C\/s|m\/min|m|s|min|h|Hz|kHz|N|J|W|V|A|g|kg|mg|µg|ug|L)\b/;
const STD = /\b(?:IPC|J-STD|JEDEC|ISO|IEC|ANSI|ESD|UL|ASTM|MIL)[-\s]?(?:TM[-\s]?)?[A-Z0-9][A-Z0-9\/.\-]*/g;

function texts(l) {
  const out = [];
  l.content.theory.forEach(function (t, i) {
    if (!t) return;
    if (typeof t.p === 'string') out.push(['theory.' + i + '.p', t.p]);
    if (Array.isArray(t.p)) t.p.forEach(function (p, j) { out.push(['theory.' + i + '.p.' + j, p]); });
    (t.blocks || []).forEach(function (b, j) {
      ['text', 'caption', 'title'].forEach(function (k) { if (b[k]) out.push(['theory.' + i + '.b' + j + '.' + k, String(b[k])]); });
      (b.items || []).forEach(function (x, k) { out.push(['theory.' + i + '.b' + j + '.i' + k, String(x)]); });
      (b.rows || []).forEach(function (r, k) {
        (Array.isArray(r) ? r : Object.values(r)).forEach(function (x, m) {
          out.push(['theory.' + i + '.b' + j + '.r' + k + '.' + m, String(x)]);
        });
      });
    });
  });
  ['calc.task', 'calc.solution', 'defect.symptom', 'defect.cause', 'defect.action'].forEach(function (k) {
    const v = k.split('.').reduce(function (o, x) { return o && o[x]; }, l.content);
    if (v) out.push([k, String(v)]);
  });
  return out;
}

function inventory(l) {
  const nums = {}, stds = {};
  texts(l).forEach(function (pair) {
    const t = pair[1];
    let m;
    const re = new RegExp(NUM.source, 'g');
    while ((m = re.exec(t)) !== null) {
      const tail = t.slice(m.index + m[0].length, m.index + m[0].length + 8);
      const u = UNIT.exec(tail);
      const k = m[0] + (u ? u[1] : '');
      nums[k] = (nums[k] || 0) + 1;
    }
    (t.match(STD) || []).forEach(function (n) { const k = n.trim(); stds[k] = (stds[k] || 0) + 1; });
  });
  return { lessonId: l.lessonId, numbers: nums, standards: stds };
}

const lessons = readJson(LESSONS_PATH);
const args = process.argv.slice(2);
if (args.includes('--all')) {
  let n = 0, s = 0;
  const unique = new Set(), uniqS = new Set();
  lessons.forEach(function (l) {
    const inv = inventory(l);
    n += Object.keys(inv.numbers).reduce(function (a, k) { return a + inv.numbers[k]; }, 0);
    s += Object.keys(inv.standards).reduce(function (a, k) { return a + inv.standards[k]; }, 0);
    Object.keys(inv.numbers).forEach(function (k) { unique.add(k); });
    Object.keys(inv.standards).forEach(function (k) { uniqS.add(k); });
  });
  console.log('numeric tokens   ' + n + ' (' + unique.size + ' distinct)');
  console.log('standard names   ' + s + ' (' + uniqS.size + ' distinct)');
  process.exit(0);
}
const ids = args.length ? args : lessons.map(function (l) { return l.lessonId; });
ids.forEach(function (id) {
  const l = lessons.filter(function (x) { return x.lessonId === id; })[0];
  if (!l) { console.log('!! no lesson ' + id); return; }
  const inv = inventory(l);
  const nums = Object.keys(inv.numbers).sort();
  console.log('\n' + id + ' :: ' + nums.length + ' distinct numbers');
  console.log('  ' + nums.join(' | '));
  console.log('  standards: ' + Object.keys(inv.standards).join(' | '));
});
