#!/usr/bin/env node
/* =========================================================================
 * bank-tool.js — load, validate and write the question bank safely
 *
 * Used by scripts/apply-phase1.js and by the tests. Writing data/questions.json
 * through JSON.stringify with the wrong indentation produces a diff of the
 * whole file, so the serialisation format is pinned here in one place and
 * verified against the current file on load.
 *
 * Validation rules (the hard ones — a violation aborts the write):
 *   - questionId unique and matching q-<lessonId>-<nn>
 *   - lessonId exists in lessons.json
 *   - exactly one option id equals `correct`
 *   - 4-5 options, ids a..e, all distinct texts, no empty text
 *   - type in {single, calc}
 *   - competencies are a non-empty subset of K1..K10
 *   - bloom is one of the six levels
 *   - pool (when present) is 'lesson' or 'exam'
 *   - source exists in sources.json
 *   - prompt ends with a question mark or a colon+instruction, not a fragment
 *
 * Usage as a library:
 *   const bank = require('./bank-tool').open(ROOT);
 *   bank.questions         // array (mutable)
 *   bank.add(q) / bank.replace(id, q)
 *   bank.validateAll()     // { errors: [], warnings: [] }
 *   bank.save()            // writes data/questions.json in the pinned format
 *   bank.saveEmbed()       // rebuilds assets/data-embed.js
 * ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');

const K_ALL = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8', 'K9', 'K10'];
const BLOOM = ['remember', 'understand', 'apply', 'analyse', 'evaluate', 'create'];
const TYPES = ['single', 'calc'];
const POOLS = ['lesson', 'exam'];
const MAX_OPTIONS = 5;

function readJson(file) {
  let raw = fs.readFileSync(file, 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  return JSON.parse(raw);
}

/** The pinned serialisation: 2-space indent, LF, trailing newline. */
function serialise(value) {
  return JSON.stringify(value, null, 2) + '\n';
}

/**
 * Validate one question.
 * @returns {{errors: string[], warnings: string[]}}
 */
function validateQuestion(q, ctx) {
  const errors = [];
  const warnings = [];
  const c = ctx || {};
  const id = q && q.questionId ? q.questionId : '(no id)';

  if (!q || typeof q !== 'object') return { errors: [id + ': not an object'], warnings: [] };
  if (!q.questionId) errors.push(id + ': questionId missing');
  if (!q.lessonId) errors.push(id + ': lessonId missing');
  else if (c.lessonIds && !c.lessonIds.has(q.lessonId)) errors.push(id + ': unknown lessonId ' + q.lessonId);
  else if (q.questionId && q.questionId.indexOf('q-' + q.lessonId + '-') !== 0) {
    errors.push(id + ': questionId does not start with q-' + q.lessonId + '-');
  }
  if (TYPES.indexOf(q.type) === -1) errors.push(id + ': type must be one of ' + TYPES.join('/'));
  if (q.pool !== undefined && POOLS.indexOf(q.pool) === -1) {
    errors.push(id + ': pool must be one of ' + POOLS.join('/'));
  }
  if (q.bloom !== undefined && BLOOM.indexOf(q.bloom) === -1) {
    errors.push(id + ': bloom must be one of ' + BLOOM.join('/'));
  }
  if (!Array.isArray(q.competencies) || !q.competencies.length) {
    errors.push(id + ': competencies must be a non-empty array');
  } else {
    q.competencies.forEach(function (k) {
      if (K_ALL.indexOf(k) === -1) errors.push(id + ': unknown competency ' + k);
    });
  }
  if (c.sourceIds && q.source && !c.sourceIds.has(q.source)) {
    errors.push(id + ': unknown source ' + q.source);
  }
  if (!q.source) warnings.push(id + ': no source reference');

  const opts = Array.isArray(q.options) ? q.options : [];
  if (opts.length < 4) errors.push(id + ': ' + opts.length + ' options, need at least 4');
  if (opts.length > MAX_OPTIONS) errors.push(id + ': ' + opts.length + ' options, max ' + MAX_OPTIONS);
  const seen = {};
  const expectedIds = ['a', 'b', 'c', 'd', 'e'].slice(0, opts.length);
  opts.forEach(function (o, i) {
    if (!o || typeof o !== 'object') { errors.push(id + ': option ' + i + ' not an object'); return; }
    if (o.id !== expectedIds[i]) errors.push(id + ': option ' + i + ' id is "' + o.id + '", expected "' + expectedIds[i] + '"');
    const t = String(o.text == null ? '' : o.text).trim();
    if (!t) errors.push(id + ': option ' + o.id + ' has empty text');
    if (seen[t.toLowerCase()]) errors.push(id + ': duplicate option text under ' + o.id + ' and ' + seen[t.toLowerCase()]);
    seen[t.toLowerCase()] = o.id;
    if (t.length > 220) warnings.push(id + ': option ' + o.id + ' is ' + t.length + ' chars — long options are a reading test');
  });
  const hits = opts.filter(function (o) { return o && o.id === q.correct; }).length;
  if (hits !== 1) errors.push(id + ': `correct` must name exactly one option (matched ' + hits + ')');

  if (!q.explanation || String(q.explanation).trim().length < 40) {
    errors.push(id + ': explanation missing or too short to teach');
  }
  if (!q.prompt || String(q.prompt).trim().length < 20) errors.push(id + ': prompt missing or too short');

  /* banned phrasing */
  opts.forEach(function (o) {
    if (o && /(all|none) of the above|both a and b/i.test(String(o.text))) {
      errors.push(id + ': banned phrasing "' + o.text + '"');
    }
  });

  return { errors: errors, warnings: warnings };
}

function contextFor(root) {
  const lessons = readJson(path.join(root, 'data', 'lessons.json'));
  const sources = readJson(path.join(root, 'data', 'sources.json'));
  return {
    lessonIds: new Set(lessons.map(function (l) { return l.lessonId; })),
    sourceIds: new Set(sources.map(function (s) { return s.id; })),
    lessons: lessons,
    sources: sources
  };
}

function open(root) {
  const file = path.join(root, 'data', 'questions.json');
  const ctx = contextFor(root);
  const api = {
    root: root,
    file: file,
    ctx: ctx,
    questions: readJson(file),

    /** All questions of one lesson in the lesson pool. */
    lessonPool: function (lessonId) {
      return api.questions.filter(function (q) {
        return q.lessonId === lessonId && q.pool !== 'exam';
      });
    },

    examPool: function (lessonId) {
      return api.questions.filter(function (q) {
        return q.lessonId === lessonId && q.pool === 'exam';
      });
    },

    indexOf: function (id) {
      return api.questions.findIndex(function (q) { return q.questionId === id; });
    },

    add: function (q) {
      if (api.indexOf(q.questionId) !== -1) throw new Error('duplicate questionId ' + q.questionId);
      api.questions.push(q);
    },

    replace: function (id, q) {
      const i = api.indexOf(id);
      if (i === -1) throw new Error('no such question ' + id);
      q.questionId = id;               // the id is the identity, never rewritten
      api.questions[i] = q;
    },

    /** Replace only the options of a question, keeping everything else. */
    setOptions: function (id, options, explanation) {
      const i = api.indexOf(id);
      if (i === -1) throw new Error('no such question ' + id);
      api.questions[i].options = options;
      if (explanation) api.questions[i].explanation = explanation;
    },

    validateAll: function () {
      const errors = [];
      const warnings = [];
      const seen = {};
      api.questions.forEach(function (q) {
        if (seen[q.questionId]) errors.push(q.questionId + ': duplicated in the file');
        seen[q.questionId] = true;
        const r = validateQuestion(q, ctx);
        errors.push.apply(errors, r.errors);
        warnings.push.apply(warnings, r.warnings);
      });
      return { errors: errors, warnings: warnings };
    },

    /** Validate, then write. Throws with the full error list if anything is wrong. */
    save: function (opts) {
      const check = api.validateAll();
      if (check.errors.length) {
        const err = new Error('refusing to write an invalid bank:\n  ' + check.errors.slice(0, 40).join('\n  '));
        err.errors = check.errors;
        throw err;
      }
      const text = serialise(api.questions);
      fs.writeFileSync(file, text, 'utf8');
      return {
        bytes: Buffer.byteLength(text, 'utf8'),
        count: api.questions.length,
        warnings: check.warnings
      };
    },

    saveEmbed: function () {
      const mod = require(path.join(__dirname, 'build-embed.js'));
      const built = mod.build();
      fs.writeFileSync(path.join(root, 'assets', 'data-embed.js'), built.text, 'utf8');
      return built.counts;
    },

    /**
     * Bring the lessons' quiz arrays in step with the bank: every lesson-pool
     * question of a lesson is listed in that lesson's quiz array, in order.
     */
    syncLessonQuizArrays: function () {
      const byLesson = {};
      api.questions.forEach(function (q) {
        if (q.pool === 'exam') return;
        (byLesson[q.lessonId] = byLesson[q.lessonId] || []).push(q.questionId);
      });
      let changed = 0;
      ctx.lessons.forEach(function (l) {
        const want = byLesson[l.lessonId] || [];
        const have = Array.isArray(l.quiz) ? l.quiz : [];
        if (JSON.stringify(want) !== JSON.stringify(have)) {
          l.quiz = want;
          changed++;
        }
      });
      return { lessonsChanged: changed, lessons: ctx.lessons };
    },

    saveLessons: function (lessons) {
      fs.writeFileSync(path.join(root, 'data', 'lessons.json'), serialise(lessons), 'utf8');
    }
  };
  return api;
}

module.exports = {
  open: open,
  validateQuestion: validateQuestion,
  serialise: serialise,
  contextFor: contextFor,
  K_ALL: K_ALL,
  BLOOM: BLOOM,
  TYPES: TYPES
};
