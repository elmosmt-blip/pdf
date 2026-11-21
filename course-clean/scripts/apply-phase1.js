#!/usr/bin/env node
/* =========================================================================
 * apply-phase1.js — write question-bank content modules into the course
 *
 * Usage:
 *   node scripts/apply-phase1.js scripts/content/phase1-m01.js
 *   node scripts/apply-phase1.js scripts/content/phase1-m01.js --dry-run
 *   node scripts/apply-phase1.js scripts/content/*.js        # whole bank
 *
 * What it does, in order:
 *   1. loads the bank through scripts/bank-tool.js (which pins the file format)
 *   2. validates every incoming question before touching anything
 *   3. rotates the options so the keyed answer is not always in the same slot
 *      (see below), updating `correct` to match
 *   4. adds or replaces questions by id
 *   5. re-syncs each touched lesson's `quiz` array
 *   6. writes data/questions.json, rebuilds assets/data-embed.js, and runs the
 *      integrity check so the caller sees the numbers before/after
 *
 * Why the rotation is code and not hand placement:
 *   Content is written with the keyed answer first because that is the order in
 *   which an author reasons about a question (answer, then the mistakes that
 *   lead elsewhere). Leaving it there would put 80 % of keys in slot 0 in the
 *   stored file — the defect this phase exists to fix. The rotation is
 *   deterministic (sorted by question id, positions taken round-robin), so a
 *   re-run produces the identical file and the distribution is uniform by
 *   construction rather than by luck.
 *
 * The engine shuffles options again at display time, so the stored order is
 * not what a learner sees; a balanced stored order still matters because it
 * keeps the data honest for export, for the PDF/print path and for anyone who
 * reads the JSON.
 * ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const bankTool = require(path.join(__dirname, 'bank-tool.js'));

function letter(i) { return 'abcdef'[i]; }

/**
 * Rotate one question's options so the keyed answer lands on `targetIndex`.
 * Returns a new question object; the input is not modified.
 */
function rotate(q, targetIndex) {
  const opts = q.options;
  const keyIndex = opts.findIndex(function (o) { return o.id === q.correct; });
  if (keyIndex < 0) throw new Error(q.questionId + ': keyed answer is not among the options');
  const moved = opts[keyIndex];
  const rest = opts.filter(function (_, i) { return i !== keyIndex; });
  const out = rest.slice();
  out.splice(Math.min(targetIndex, out.length), 0, moved);
  /* Re-letter a,b,c,d,e in the new order and point `correct` at the key. */
  const relabelled = out.map(function (o, i) { return { id: letter(i), text: o.text }; });
  const copy = Object.assign({}, q, { options: relabelled });
  copy.correct = relabelled[out.indexOf(moved)].id;
  return copy;
}

function main(argv) {
  const files = argv.filter(function (a) { return a.charAt(0) !== '-'; });
  const dryRun = argv.indexOf('--dry-run') !== -1;
  if (!files.length) {
    console.error('usage: node scripts/apply-phase1.js <content-module.js> [--dry-run]');
    return 2;
  }

  const bank = bankTool.open(ROOT);

  /* ---- 1. collect and validate the incoming questions ---- */
  const incoming = [];
  const seen = {};
  files.forEach(function (file) {
    const abs = path.resolve(process.cwd(), file);
    if (!fs.existsSync(abs)) throw new Error('no such content module: ' + file);
    delete require.cache[abs];
    const items = require(abs);
    if (!Array.isArray(items)) throw new Error(file + ' must export an array');
    items.forEach(function (q) {
      if (seen[q.questionId]) throw new Error('duplicate id in the content modules: ' + q.questionId);
      seen[q.questionId] = true;
      const check = bankTool.validateQuestion(q, bank.ctx);
      if (check.errors.length) {
        throw new Error('invalid question in ' + path.basename(file) + ':\n  ' + check.errors.join('\n  '));
      }
      incoming.push(q);
    });
  });

  /* ---- 2. rotation plan: even distribution across slots 0..3 ---- */
  const byId = incoming.slice().sort(function (a, b) {
    return a.questionId < b.questionId ? -1 : a.questionId > b.questionId ? 1 : 0;
  });
  const rotated = byId.map(function (q, i) {
    const slots = Math.min(4, q.options.length);
    return rotate(q, i % slots);
  });

  /* ---- 3. add or replace ---- */
  let added = 0, replaced = 0;
  rotated.forEach(function (q) {
    if (bank.indexOf(q.questionId) === -1) { bank.add(q); added++; }
    else { bank.replace(q.questionId, q); replaced++; }
  });

  /* ---- 4. sync the lesson quiz arrays ---- */
  const sync = bank.syncLessonQuizArrays();

  /* ---- 5. report before writing ---- */
  const after = bank.validateAll();
  console.log('apply-phase1: ' + files.join(', '));
  console.log('  incoming questions      ' + incoming.length);
  console.log('  added                   ' + added);
  console.log('  replaced                ' + replaced);
  console.log('  bank size               ' + bank.questions.length);
  console.log('  lesson quiz arrays      ' + sync.lessonsChanged + ' changed');
  console.log('  validation errors       ' + after.errors.length);
  if (after.errors.length) {
    after.errors.slice(0, 20).forEach(function (e) { console.log('    - ' + e); });
    return 1;
  }

  const keyDist = { a: 0, b: 0, c: 0, d: 0, e: 0 };
  rotated.forEach(function (q) { keyDist[q.correct]++; });
  console.log('  key slots (this batch)  ' + Object.keys(keyDist).map(function (k) {
    return k + ':' + keyDist[k];
  }).join(' '));

  if (dryRun) {
    console.log('  dry run — nothing written');
    return 0;
  }

  /* ---- 6. write everything ---- */
  const wrote = bank.save();
  console.log('  wrote data/questions.json  ' + wrote.bytes + ' bytes, ' + wrote.count + ' questions');
  bank.saveLessons(sync.lessons);
  console.log('  wrote data/lessons.json    (quiz arrays re-synced)');
  const counts = bank.saveEmbed();
  console.log('  rebuilt data-embed.js      ' + counts.lessons + ' lessons / ' +
    counts.questions + ' questions / ' + counts.sources + ' sources');

  const integrity = require(path.join(__dirname, 'check-integrity.js')).run();
  console.log('  integrity check            ' + (integrity.problems.length
    ? 'FAIL (' + integrity.problems.length + ' group(s))'
    : 'OK'));
  integrity.problems.forEach(function (p) {
    console.log('    - ' + p.code + ' (' + p.count + ')');
  });
  return integrity.problems.length ? 1 : 0;
}

if (require.main === module) {
  let code;
  try {
    code = main(process.argv.slice(2));
  } catch (err) {
    console.error('apply-phase1: ' + err.message);
    code = 1;
  }
  process.exitCode = code;
}

module.exports = { rotate: rotate };
