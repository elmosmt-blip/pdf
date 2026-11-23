/* =========================================================================
 * schema.js — what a phase-5 lesson addition must contain
 *
 * The brief asks for four things per lesson. Each gets a field, and each field
 * has a shape a checker can test, because "added key takeaways" that nobody can
 * verify is how a placeholder survives to publication.
 *
 *   minutes      integer, 10..60, taken from 03-time.js (see that file for the
 *                reading model; the number is computed, never chosen).
 *   prereqs      { lessons: [lessonId,…], skills: [string,…] }
 *                lessons must exist and must come earlier in the course; a
 *                prerequisite on a later lesson is a cycle and is rejected.
 *   takeaways    exactly 3 strings, each a claim the lesson body supports,
 *                8..34 words, each a sentence.
 *   mistakes     exactly 3 { mistake, instead } — the wrong belief as a learner
 *                would phrase it, and what the lesson says to do instead.
 *   terms        [{ term, def }] — glossary entries defined BY this lesson.
 *                Aggregated into data/glossary.json; a term may not be defined
 *                twice with different text.
 * ========================================================================= */
'use strict';

function words(t) { return String(t || '').trim().split(/\s+/).filter(Boolean); }

function checkLesson(l, prevIds) {
  const e = [];
  const id = l.lessonId;
  if (!Number.isInteger(l.minutes) || l.minutes < 10 || l.minutes > 60) {
    e.push(id + ': minutes must be an integer 10..60, got ' + l.minutes);
  }
  const p = l.prereqs;
  if (!p || !Array.isArray(p.lessons) || !Array.isArray(p.skills)) {
    e.push(id + ': prereqs must be { lessons: [], skills: [] }');
  } else {
    p.lessons.forEach(function (x) {
      if (x === id) e.push(id + ': is its own prerequisite');
      else if (prevIds.indexOf(x) === -1) {
        e.push(id + ': prerequisite ' + x + ' is not an earlier lesson');
      }
    });
    if (new Set(p.lessons).size !== p.lessons.length) e.push(id + ': duplicate prerequisites');
    p.skills.forEach(function (s) {
      if (words(s).length < 2) e.push(id + ': prerequisite skill too short: ' + s);
    });
  }
  const c = l.content || {};
  const tk = c.takeaways;
  if (!Array.isArray(tk) || tk.length !== 3) e.push(id + ': exactly 3 takeaways required');
  else tk.forEach(function (t) {
    const n = words(t).length;
    if (n < 8 || n > 34) e.push(id + ': takeaway is ' + n + ' words (want 8..34): ' + t);
    else if (!/[.!?]$/.test(String(t).trim())) e.push(id + ': takeaway must be a sentence: ' + t);
  });
  const mk = c.mistakes;
  if (!Array.isArray(mk) || mk.length !== 3) e.push(id + ': exactly 3 mistakes required');
  else mk.forEach(function (m) {
    if (!m || !m.mistake || !m.instead) e.push(id + ': a mistake is missing its text');
    else {
      if (words(m.mistake).length < 6) e.push(id + ': mistake too short: ' + m.mistake);
      if (words(m.instead).length < 6) e.push(id + ': remedy too short: ' + m.instead);
    }
  });
  const terms = c.terms;
  if (!Array.isArray(terms) || terms.length < 2) e.push(id + ': at least 2 glossary terms required');
  else terms.forEach(function (t) {
    if (!t || !t.term || !t.def) e.push(id + ': a glossary term is incomplete');
    else if (words(t.def).length < 6) e.push(id + ': term definition too short: ' + t.term);
  });
  return e;
}

module.exports = { checkLesson, words };
