'use strict';
/* Every number drawn in a phase-6 SVG must appear in the lesson text
 * (theory prose, tables, calc task/solution). Run: node scripts/check-figures.js */
const fs = require('fs'), path = require('path');
const lessons = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'lessons.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'phase6', 'manifest.json'), 'utf8'));
function nums(s) { return (String(s).match(/(?<![\w.])\d+(?:\.\d+)?/g) || []); }
function textOf(l) {
  const out = [];
  (function walk(v) { if (typeof v === 'string') out.push(v); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.keys(v).forEach(function (k) { if (k !== 'svg' && k !== 'src') walk(v[k]); }); })(l.content);
  return out.join(' ');
}
let bad = 0;
manifest.filter(function (m) { return m.figure; }).forEach(function (m) {
  const l = lessons.filter(function (x) { return x.lessonId === m.id; })[0];
  const svg = fs.readFileSync(path.join(__dirname, '..', 'src', 'phase6', 'figures', m.figure + '.svg'), 'utf8');
  const body = svg.replace(/xmlns='[^']*'/g,'').replace(/\d+(?:st|nd|rd|th)\b/g,'').replace(/<style>[\s\S]*?<\/style>/, '').replace(/\s(?:x|y|x1|x2|y1|y2|width|height|rx|font-size|stroke-width|viewBox|d|points)='[^']*'/g, '').replace(/rgba\([^)]*\)/g, '').replace(/#[0-9a-f]{3,6}/gi, '').replace(/stroke-dasharray='[^']*'/g, '');
  const have = new Set(nums(textOf(l)));
  const missing = nums(body).filter(function (n) { return !have.has(n) && !have.has(n.replace(/\.0+$/, '')); });
  const uniq = Array.from(new Set(missing));
  if (uniq.length) { bad++; console.log(m.id + ' (' + m.figure + '): numbers not in lesson -> ' + uniq.join(', ')); }
  else console.log(m.id + ' ok');
});
process.exitCode = bad ? 1 : 0;
