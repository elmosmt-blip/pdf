/* Shared helpers for the phase-5 editorial pass. */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const LESSONS_PATH = path.join(ROOT, 'data', 'lessons.json');
const BASELINE_PATH = path.join(__dirname, 'baseline-lessons.json');

function readJson(p) {
  let raw = fs.readFileSync(p, 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  return JSON.parse(raw);
}
function writeJson(p, value) {
  fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n', 'utf8');
}
function words(t) { return String(t || '').trim().split(/\s+/).filter(Boolean); }
function sentences(t) {
  return String(t || '').split(/(?<=[.!?])\s+/).filter(function (s) { return s.trim(); });
}
/* Paragraph bodies of one theory entry, whatever shape they are in. */
function bodies(t) {
  if (!t) return [];
  if (Array.isArray(t.p)) return t.p;
  if (typeof t.p === 'string') return [t.p];
  return [];
}
module.exports = { ROOT, LESSONS_PATH, BASELINE_PATH, readJson, writeJson, words, sentences, bodies };
