#!/usr/bin/env node
/* =========================================================================
 * check-quiz.js — quality gate for data/questions.json
 *
 * Usage:
 *   node scripts/check-quiz.js                     # default paths, human report
 *   node scripts/check-quiz.js <questions.json>    # explicit file
 *   node scripts/check-quiz.js --json              # machine-readable metrics
 *   node scripts/check-quiz.js --quiet             # only failures + summary
 *
 * Reports (the numbers the Phase-1 brief asks for):
 *   - questions per lesson, and how many lessons are below the 4-question goal
 *   - share of questions whose keyed answer is the longest option (goal 25-35 %)
 *   - distribution of the keyed answer's position (tolerance +-10 pp of uniform)
 *   - option-count distribution (goal 4-5), "all/none of the above" detection
 *   - duplicate prompts (exact and near), duplicate options inside a question
 *   - distractor length parity: each wrong option against the keyed answer
 *   - competency coverage K1-K10 against the agreed weights, Bloom distribution
 *   - exam bank depth: exam-pool questions per lesson (target 2-3)
 *   - structural integrity: ids, unique options, key points at an existing option
 *
 * Exit code: 0 when every hard check passes, 1 otherwise. The hard checks are
 * structural (a question that cannot be graded correctly); the statistical
 * goals are reported as measured values with a PASS/FAIL marker because they
 * are editorial targets, not correctness guarantees.
 * ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULTS = {
  questions: path.join(ROOT, 'data', 'questions.json'),
  lessons: path.join(ROOT, 'data', 'lessons.json')
};

/* Editorial targets from the Phase-1 brief. */
const TARGET = {
  perLessonMin: 4,
  perLessonMax: 5,
  longestShareMin: 0.25,
  longestShareMax: 0.35,
  positionTolerancePP: 10,      // percentage points away from uniform
  lengthRatioMin: 0.75,         // distractor length / keyed length
  lengthRatioMax: 1.35,
  examPerLessonMin: 2,          // exam-bank depth per LESSON (agreed target)
  examPerLessonMinTop: 3        // the band the brief allowed: 2-3 per lesson
};

const K_ALL = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8', 'K9', 'K10'];

/* The brief asks for K6 ~32 % and K4/K8 ~6 %; the remaining competencies share
   the rest evenly. Even coverage across all ten was the earlier, simpler
   reading and it is wrong for this course: inspection, metrology and process
   diagnosis are the spine of the material, so a checker that wanted 10 % each
   would file a true statement about the course as a defect. */
const COMP_WEIGHT = {
  K1: 0.09, K2: 0.05, K3: 0.11, K4: 0.06, K5: 0.11,
  K6: 0.32, K7: 0.05, K8: 0.06, K9: 0.12, K10: 0.03
};
const BLOOM_ALL = ['remember', 'understand', 'apply', 'analyse', 'analyze', 'evaluate', 'create'];

/* -------------------------------------------------------------- utilities */

function readJson(file) {
  let raw = fs.readFileSync(file, 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);   // BOM-tolerant
  return JSON.parse(raw);
}

/** Words of a prompt with numbers and punctuation folded, for near-duplicates. */
function tokens(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s.%]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function jaccard(a, b) {
  const A = new Set(a), B = new Set(b);
  if (!A.size || !B.size) return 0;
  let shared = 0;
  A.forEach(function (t) { if (B.has(t)) shared++; });
  return shared / (A.size + B.size - shared);
}

/* The engine (assets/app.js) shows options in a seeded order that depends on
 * the question id and the attempt number, so the stored key position is not
 * what a learner sees. These two helpers mirror displayOptions() exactly; if
 * the engine's shuffle changes, this copy must change with it, otherwise the
 * report measures a distribution nobody is exposed to. */
function strHash(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function seededShuffle(list, seed) {
  const out = list.slice();
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    const t = out[i];
    out[i] = out[j];
    out[j] = t;
  }
  return out;
}

function pct(x) { return (x * 100).toFixed(1) + '%'; }

function uniq(arr) {
  const seen = {}, out = [];
  arr.forEach(function (v) { if (!seen[v]) { seen[v] = 1; out.push(v); } });
  return out;
}

/* ---------------------------------------------------------------- loading */

function load(questionsFile, lessonsFile) {
  const questions = readJson(questionsFile);
  let lessons = [];
  if (fs.existsSync(lessonsFile)) lessons = readJson(lessonsFile);
  if (!Array.isArray(questions)) throw new Error('questions.json must be a top-level array');
  if (!Array.isArray(lessons)) lessons = [];
  return { questions, lessons };
}

/* ----------------------------------------------------------------- metrics */

function analyse(questions, lessons) {
  const hard = [];     // structural failures
  const soft = [];     // editorial misses worth naming in the report

  const ids = {};
  const missingBloom = [];
  const missingCompetency = [];
  const lessonIds = uniq(lessons.map(function (l) { return l.lessonId; }).filter(Boolean));

  /* ---- structural integrity ---- */
  questions.forEach(function (q, i) {
    const where = 'questions[' + i + ']' + (q && q.questionId ? ' (' + q.questionId + ')' : '');
    if (!q || typeof q !== 'object') { hard.push(where + ': not an object'); return; }
    if (!q.questionId) hard.push(where + ': missing questionId');
    else if (ids[q.questionId]) hard.push(where + ': duplicate questionId');
    else ids[q.questionId] = true;

    if (!q.lessonId) hard.push(where + ': missing lessonId');
    else if (lessonIds.length && lessonIds.indexOf(q.lessonId) === -1) {
      hard.push(where + ': lessonId "' + q.lessonId + '" is not in lessons.json');
    }
    if (!q.prompt || !String(q.prompt).trim()) hard.push(where + ': empty prompt');

    const opts = Array.isArray(q.options) ? q.options : [];
    if (opts.length < 2) hard.push(where + ': fewer than 2 options');
    const seenOpt = {};
    opts.forEach(function (o, k) {
      if (!o || typeof o !== 'object') { hard.push(where + ': option ' + k + ' is not an object'); return; }
      if (!o.id) hard.push(where + ': option ' + k + ' has no id');
      if (typeof o.text !== 'string' || !o.text.trim()) hard.push(where + ': option ' + o.id + ' is empty');
      const key = String(o.text || '').trim().toLowerCase();
      if (key && seenOpt[key]) hard.push(where + ': duplicate option text "' + o.text + '"');
      seenOpt[key] = true;
    });
    if (!q.correct) hard.push(where + ': missing correct');
    else if (!opts.some(function (o) { return o && o.id === q.correct; })) {
      hard.push(where + ': correct "' + q.correct + '" is not an option id');
    }
    /* Missing editorial fields are counted, not listed one line per question:
       185 identical lines hide the finding instead of reporting it. */
    if (!Array.isArray(q.competencies) || !q.competencies.length) {
      missingCompetency.push(q.questionId);
    } else {
      q.competencies.forEach(function (c) {
        if (K_ALL.indexOf(c) === -1) hard.push(where + ': unknown competency "' + c + '"');
      });
    }
    if (!q.bloom) {
      missingBloom.push(q.questionId);
    } else if (BLOOM_ALL.indexOf(String(q.bloom).toLowerCase()) === -1) {
      hard.push(where + ': unknown bloom level "' + q.bloom + '"');
    }
  });

  /* ---- split lesson pool vs exam pool ---- */
  const isExam = function (q) { return q && q.pool === 'exam'; };
  const lessonQs = questions.filter(function (q) { return !isExam(q); });
  const examQs = questions.filter(isExam);

  /* ---- per-lesson question counts ---- */
  const perLesson = {};
  lessonIds.forEach(function (id) { perLesson[id] = 0; });
  lessonQs.forEach(function (q) { perLesson[q.lessonId] = (perLesson[q.lessonId] || 0) + 1; });
  const countHist = {};
  Object.keys(perLesson).forEach(function (id) {
    const n = perLesson[id];
    countHist[n] = (countHist[n] || 0) + 1;
  });
  const countValues = Object.keys(perLesson).map(function (k) { return perLesson[k]; });
  const belowGoal = Object.keys(perLesson).filter(function (id) {
    return perLesson[id] < TARGET.perLessonMin;
  });
  const aboveGoal = Object.keys(perLesson).filter(function (id) {
    return perLesson[id] > TARGET.perLessonMax;
  });

  /* ---- key position ---- */
  const position = {};
  let positionN = 0;
  lessonQs.forEach(function (q) {
    const i = (q.options || []).findIndex(function (o) { return o && o.id === q.correct; });
    if (i < 0) return;
    position[i] = (position[i] || 0) + 1;
    positionN++;
  });
  const optionCountMax = Math.max.apply(null, Object.keys(position).map(Number).concat([0])) + 1;
  const positionShare = [];
  for (let i = 0; i < Math.max(optionCountMax, 2); i++) {
    positionShare.push(positionN ? (position[i] || 0) / positionN : 0);
  }

  /* ---- key position as DISPLAYED (engine shuffle, 5 attempts) ---- */
  const shown = {};
  let shownN = 0;
  const ATTEMPTS = 5;
  lessonQs.forEach(function (q) {
    const opts = q.options || [];
    if (opts.length < 2) return;
    for (let a = 1; a <= ATTEMPTS; a++) {
      const order = seededShuffle(opts, strHash(q.questionId + '#' + a));
      const i = order.findIndex(function (o) { return o && o.id === q.correct; });
      if (i < 0) continue;
      shown[i] = (shown[i] || 0) + 1;
      shownN++;
    }
  });
  const shownShares = [];
  const shownWidth = Math.max(Math.max.apply(null, Object.keys(shown).map(Number).concat([0])) + 1, 2);
  for (let i = 0; i < shownWidth; i++) shownShares.push(shownN ? (shown[i] || 0) / shownN : 0);
  const shownWorst = shownShares.length
    ? Math.max.apply(null, shownShares.map(function (s) { return Math.abs(s - 1 / shownShares.length) * 100; }))
    : 0;

  /* ---- longest-option-is-correct ---- */
  let longestCorrect = 0, longestN = 0, longestTies = 0;
  const lengthRatios = [];
  lessonQs.forEach(function (q) {
    const opts = q.options || [];
    const lens = opts.map(function (o) { return String(o.text || '').length; });
    if (lens.length < 2) return;
    const max = Math.max.apply(null, lens);
    const idx = opts.findIndex(function (o) { return o && o.id === q.correct; });
    if (idx < 0) return;
    const tied = lens.filter(function (l) { return l === max; }).length > 1;
    if (tied) { longestTies++; }
    else {
      longestN++;
      if (lens[idx] === max) longestCorrect++;
    }
    /* distractor parity: compare each wrong option to the keyed answer */
    const keyLen = lens[idx] || 1;
    lens.forEach(function (l, i) {
      if (i === idx) return;
      lengthRatios.push({ q: q.questionId, ratio: l / keyLen, len: l, key: keyLen });
    });
  });
  const longestShare = longestN ? longestCorrect / longestN : 0;

  /* ---- option counts ---- */
  const optHist = {};
  lessonQs.forEach(function (q) {
    const n = (q.options || []).length;
    optHist[n] = (optHist[n] || 0) + 1;
  });

  /* ---- banned phrasings ---- */
  const BANNED = /(all|none) of the above|both a and b|a and b above|^all of these|^none of these/i;
  const banned = [];
  questions.forEach(function (q) {
    (q.options || []).forEach(function (o) {
      if (o && BANNED.test(String(o.text || '').trim())) {
        banned.push(q.questionId + ': "' + o.text + '"');
      }
    });
  });

  /* ---- duplicates ---- */
  const exactDup = [];
  const byPrompt = {};
  questions.forEach(function (q) {
    const k = String(q.prompt || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (!k) return;
    if (byPrompt[k]) exactDup.push(byPrompt[k] + ' = ' + q.questionId);
    else byPrompt[k] = q.questionId;
  });

  /* near-duplicates: same lesson, Jaccard >= 0.72 on prompt tokens */
  const nearDup = [];
  const tokMap = questions.map(function (q) {
    return { id: q.questionId, lesson: q.lessonId, exam: isExam(q), t: tokens(q.prompt) };
  });
  for (let i = 0; i < tokMap.length; i++) {
    for (let j = i + 1; j < tokMap.length; j++) {
      if (tokMap[i].lesson !== tokMap[j].lesson) continue;
      const s = jaccard(tokMap[i].t, tokMap[j].t);
      if (s >= 0.72) nearDup.push({ a: tokMap[i].id, b: tokMap[j].id, score: +s.toFixed(2) });
    }
  }

  /* ---- an exam question must not repeat a lesson question ---- */
  const lessonPromptKeys = {};
  lessonQs.forEach(function (q) {
    lessonPromptKeys[String(q.prompt || '').toLowerCase().replace(/\s+/g, ' ').trim()] = q.questionId;
  });
  const examRepeats = [];
  examQs.forEach(function (q) {
    const k = String(q.prompt || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (lessonPromptKeys[k]) examRepeats.push(q.questionId + ' repeats ' + lessonPromptKeys[k]);
  });

  /* ---- competency and bloom coverage ---- */
  const comp = {}, bloom = {};
  lessonQs.forEach(function (q) {
    (q.competencies || []).forEach(function (c) { comp[c] = (comp[c] || 0) + 1; });
    if (q.bloom) bloom[q.bloom] = (bloom[q.bloom] || 0) + 1;
  });
  const compTotal = Object.keys(comp).reduce(function (a, k) { return a + comp[k]; }, 0);
  const compShare = {};
  K_ALL.forEach(function (k) { compShare[k] = compTotal ? (comp[k] || 0) / compTotal : 0; });
  const compOff = K_ALL.filter(function (k) {
    return Math.abs(compShare[k] - COMP_WEIGHT[k]) > 0.08;
  });

  /* ---- exam bank depth ---- */
  const examPerLesson = {};
  examQs.forEach(function (q) { examPerLesson[q.lessonId] = (examPerLesson[q.lessonId] || 0) + 1; });
  let depthWorst = null;
  const depthByModule = {};
  const moduleOf = {};
  lessons.forEach(function (l) { moduleOf[l.lessonId] = l.moduleId; });
  Object.keys(perLesson).forEach(function (id) {
    const lessonQ = perLesson[id] || 0;
    const examQ = examPerLesson[id] || 0;
    if (!lessonQ) return;
    const ratio = examQ / lessonQ;
    if (depthWorst === null || ratio < depthWorst.ratio) {
      depthWorst = {
        lesson: id,
        lessonQ: lessonQ,
        examQ: examQ,
        ratio: ratio,
        perLesson: examQ / 1          // one lesson, so per-lesson depth is examQ
      };
    }
    const m = moduleOf[id] || '?';
    depthByModule[m] = depthByModule[m] || { lessonQ: 0, examQ: 0, lessons: 0 };
    depthByModule[m].lessonQ += lessonQ;
    depthByModule[m].examQ += examQ;
    depthByModule[m].lessons++;
  });

  /* ---- editorial soft flags ---- */
  const shortDistractor = lengthRatios.filter(function (r) { return r.ratio < TARGET.lengthRatioMin; });
  const longDistractor = lengthRatios.filter(function (r) { return r.ratio > TARGET.lengthRatioMax; });

  if (exactDup.length) hard.push(exactDup.length + ' duplicate prompt(s)');
  if (examRepeats.length) hard.push(examRepeats.length + ' exam question(s) repeat a lesson question');

  if (belowGoal.length) {
    soft.push(belowGoal.length + ' lesson(s) below ' + TARGET.perLessonMin + ' questions');
  }
  if (aboveGoal.length) {
    soft.push(aboveGoal.length + ' lesson(s) above ' + TARGET.perLessonMax + ' questions');
  }
  if (longestShare > TARGET.longestShareMax || longestShare < TARGET.longestShareMin) {
    soft.push('longest-option-is-correct ' + pct(longestShare) +
      ' is outside ' + pct(TARGET.longestShareMin) + '-' + pct(TARGET.longestShareMax));
  }
  /* The tolerance is applied to what the learner sees, not to the stored order:
     the engine reshuffles per attempt, so a stored skew is only a bias if it
     survives the shuffle. Both numbers are reported either way. */
  shownShares.forEach(function (s, i) {
    if (Math.abs(s - 1 / shownShares.length) > TARGET.positionTolerancePP / 100) {
      soft.push('displayed key position ' + i + ' holds ' + pct(s) +
        ', more than ' + TARGET.positionTolerancePP + ' pp from uniform');
    }
  });
  if (banned.length) soft.push(banned.length + ' "all/none of the above" option(s)');
  if (nearDup.length) soft.push(nearDup.length + ' near-duplicate prompt pair(s)');
  if (compOff.length) soft.push('competencies more than 8 pp from their target: ' + compOff.join(', '));
  if (missingBloom.length) soft.push(missingBloom.length + ' question(s) carry no bloom level');
  if (missingCompetency.length) soft.push(missingCompetency.length + ' question(s) carry no competency tag');
  /* Depth is judged per lesson against the agreed band of 2-3 exam questions,
     not per lesson question: a lesson with 5 lesson questions and 2 exam
     questions is inside the brief, and a ratio rule would flag it. */
  if (depthWorst && depthWorst.perLesson < TARGET.examPerLessonMin) {
    soft.push('exam bank below ' + TARGET.examPerLessonMin +
      ' per lesson at ' + depthWorst.lesson + ' (' + depthWorst.examQ +
      ' exam for ' + depthWorst.lessonQ + ' lesson)');
  }

  /* Per-module depth against the agreed target of 2-3 exam questions per LESSON
     (the brief's wording was per lesson question; the author chose per lesson
     to keep the module exam a near-exhaustive draw from its bank). */
  const depthByModuleRatio = {};
  Object.keys(depthByModule).forEach(function (m) {
    const r = depthByModule[m];
    depthByModuleRatio[m] = r.lessons ? +(r.examQ / r.lessons).toFixed(2) : 0;
  });
  const modulesShort = Object.keys(depthByModuleRatio).filter(function (m) {
    return depthByModuleRatio[m] < TARGET.examPerLessonMin;
  });

  return {
    totals: {
      questions: questions.length,
      lessonPool: lessonQs.length,
      examPool: examQs.length,
      lessons: lessonIds.length
    },
    perLesson: {
      histogram: countHist,
      belowGoal: belowGoal,
      aboveGoal: aboveGoal,
      perLessonCounts: perLesson,
      min: countValues.length ? Math.min.apply(null, countValues) : 0,
      max: countValues.length ? Math.max.apply(null, countValues) : 0
    },
    keyPosition: {
      counts: position,
      shares: positionShare,
      tolerancePP: TARGET.positionTolerancePP,
      worstDeviationPP: positionShare.length
        ? Math.max.apply(null, positionShare.map(function (s) { return Math.abs(s - 1 / positionShare.length) * 100; }))
        : 0
    },
    keyPositionShown: {
      attempts: ATTEMPTS,
      counts: shown,
      shares: shownShares,
      worstDeviationPP: shownWorst
    },
    longest: {
      correct: longestCorrect,
      considered: longestN,
      tiesExcluded: longestTies,
      share: longestShare,
      avgLengthDeltaChars: lengthRatios.length
        ? lengthRatios.reduce(function (a, r) { return a + (r.ratio - 1); }, 0) / lengthRatios.length
        : 0
    },
    options: { histogram: optHist },
    banned: banned,
    duplicates: { exact: exactDup, near: nearDup, examRepeats: examRepeats },
    districts: {
      comparables: lengthRatios.length,
      tooShort: shortDistractor.length,
      tooLong: longDistractor.length
    },
    competencies: { counts: comp, shares: compShare, offEven: compOff },
    bloom: bloom,
    missing: { bloom: missingBloom, competencies: missingCompetency },
    examBank: {
      byModule: depthByModule,
      perLessonByModule: depthByModuleRatio,
      modulesMeetingTarget: Object.keys(depthByModuleRatio).length - modulesShort.length,
      modulesShort: modulesShort,
      worst: depthWorst
    },
    failures: hard,
    warnings: soft
  };
}

/* ------------------------------------------------------------------ report */

function render(m, opts) {
  const L = [];
  const push = function (s) { L.push(s); };

  push('=== SMT & THT course — quiz quality report ===');
  push('');
  push('Totals');
  push('  questions                 ' + m.totals.questions);
  push('    lesson pool             ' + m.totals.lessonPool);
  push('    exam pool               ' + m.totals.examPool);
  push('  lessons                   ' + m.totals.lessons);
  push('');
  push('Questions per lesson (goal ' + TARGET.perLessonMin + '-' + TARGET.perLessonMax + ')');
  Object.keys(m.perLesson.histogram).sort(function (a, b) { return a - b; }).forEach(function (n) {
    push('  ' + n + ' question(s): ' + m.perLesson.histogram[n] + ' lesson(s)');
  });
  push('  range                     ' + m.perLesson.min + '..' + m.perLesson.max);
  push('  below goal                ' + m.perLesson.belowGoal.length +
    (m.perLesson.belowGoal.length > 8
      ? ' (' + m.perLesson.belowGoal.slice(0, 8).join(', ') + ', …)'
      : (m.perLesson.belowGoal.length ? ' (' + m.perLesson.belowGoal.join(', ') + ')' : '')));
  push('');
  push('Keyed answer position (uniform = ' + (100 / m.keyPosition.shares.length).toFixed(1) + '% per slot)');
  m.keyPosition.shares.forEach(function (s, i) {
    push('  slot ' + i + '  ' + String((m.keyPosition.counts[i] || 0)).padStart(4) + '  ' + pct(s).padStart(6));
  });
  push('  worst deviation from uniform  ' + m.keyPosition.worstDeviationPP.toFixed(1) + ' pp (storage order)');
  push('');
  push('Keyed answer position AS DISPLAYED (engine shuffle, ' + m.keyPositionShown.attempts + ' attempts)');
  m.keyPositionShown.shares.forEach(function (s, i) {
    push('  slot ' + i + '  ' + String((m.keyPositionShown.counts[i] || 0)).padStart(4) + '  ' + pct(s).padStart(6));
  });
  push('  worst deviation from uniform  ' + m.keyPositionShown.worstDeviationPP.toFixed(1) +
    ' pp (tolerance ' + TARGET.positionTolerancePP + ', this is the number that counts)');
  push('');
  push('Longest option is the keyed answer (goal ' + pct(TARGET.longestShareMin) + '-' + pct(TARGET.longestShareMax) + ')');
  push('  ' + m.longest.correct + ' of ' + m.longest.considered + ' = ' + pct(m.longest.share) +
    '   (ties excluded: ' + m.longest.tiesExcluded + ')');
  push('  mean distractor length vs answer  ' + (m.longest.avgLengthDeltaChars * 100).toFixed(1) + ' %');
  push('');
  push('Option count per question');
  Object.keys(m.options.histogram).sort().forEach(function (n) {
    push('  ' + n + ' options: ' + m.options.histogram[n]);
  });
  push('');
  push('Distractor length parity (' + pct(TARGET.lengthRatioMin) + '-' + pct(TARGET.lengthRatioMax) + ' of the answer)');
  push('  compared                  ' + m.districts.comparables);
  push('  shorter than the band     ' + m.districts.tooShort);
  push('  longer than the band      ' + m.districts.tooLong);
  push('');
  push('Competency coverage (K6 target 320/1000, K4 and K8 60/1000, others even)');
  K_ALL.forEach(function (k) {
    const want = COMP_WEIGHT[k];
    const delta = (m.competencies.shares[k] - want) * 100;
    push('  ' + k.padEnd(4) + String(m.competencies.counts[k] || 0).padStart(4) + '  ' +
      pct(m.competencies.shares[k]).padStart(7) +
      '   target ' + pct(want).padStart(6) +
      '   ' + (delta >= 0 ? '+' : '') + delta.toFixed(1) + ' pp');
  });
  push('');
  push('Bloom levels');
  const bloomKeys = Object.keys(m.bloom);
  if (!bloomKeys.length) push('  (none tagged)');
  else bloomKeys.sort().forEach(function (b) { push('  ' + b.padEnd(12) + m.bloom[b]); });
  push('');
  push('Exam bank (target ' + TARGET.examPerLessonMin + '-3 per lesson)');
  Object.keys(m.examBank.byModule).sort().forEach(function (mid) {
    const r = m.examBank.byModule[mid];
    push('  ' + mid + '  lessons ' + String(r.lessons).padStart(2) +
      '  lesson Q ' + String(r.lessonQ).padStart(3) +
      '  exam Q ' + String(r.examQ).padStart(3) +
      '  per lesson ' + String(m.examBank.perLessonByModule[mid]).padStart(5) +
      '  ' + (m.examBank.perLessonByModule[mid] >= TARGET.examPerLessonMin ? 'ok' : 'SHORT'));
  });
  push('');
  push('Banned phrasings ("all/none of the above")   ' + m.banned.length);
  m.banned.slice(0, 10).forEach(function (b) { push('  ' + b); });
  push('Duplicate prompts (exact)                    ' + m.duplicates.exact.length);
  m.duplicates.exact.slice(0, 10).forEach(function (d) { push('  ' + d); });
  push('Near-duplicate prompt pairs (>=0.72)          ' + m.duplicates.near.length);
  m.duplicates.near.slice(0, 10).forEach(function (d) {
    push('  ' + d.a + ' ~ ' + d.b + '  ' + d.score);
  });
  push('Exam questions repeating a lesson question    ' + m.duplicates.examRepeats.length);
  m.duplicates.examRepeats.slice(0, 10).forEach(function (d) { push('  ' + d); });
  push('');

  if (m.failures.length) {
    push('FAIL — ' + m.failures.length + ' structural problem(s):');
    m.failures.forEach(function (f) { push('  - ' + f); });
  } else {
    push('OK — no structural problems.');
  }
  if (m.warnings.length) {
    push('');
    push('Editorial gaps (' + m.warnings.length + '):');
    m.warnings.forEach(function (w) { push('  * ' + w); });
  }
  return L.join('\n');
}

/* -------------------------------------------------------------------- main */

function main(argv) {
  const asJson = argv.indexOf('--json') !== -1;
  const quiet = argv.indexOf('--quiet') !== -1;
  const positional = argv.filter(function (a) { return a.charAt(0) !== '-'; });
  const questionsFile = positional[0] ? path.resolve(positional[0]) : DEFAULTS.questions;
  const lessonsFile = positional[1] ? path.resolve(positional[1]) : DEFAULTS.lessons;

  if (!fs.existsSync(questionsFile)) {
    console.error('check-quiz: no such file: ' + questionsFile);
    return 1;
  }

  const loaded = load(questionsFile, lessonsFile);
  const m = analyse(loaded.questions, loaded.lessons);

  if (asJson) {
    console.log(JSON.stringify(m, null, 2));
  } else if (quiet) {
    if (m.failures.length) {
      console.log('FAIL — ' + m.failures.length + ' structural problem(s)');
      m.failures.forEach(function (f) { console.log('  - ' + f); });
    } else {
      console.log('OK — ' + m.totals.questions + ' questions, ' + m.totals.examPool + ' in the exam pool, ' +
        'no structural problems (' + m.warnings.length + ' editorial gap(s)).');
    }
  } else {
    console.log(render(m));
  }

  return m.failures.length ? 1 : 0;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = { analyse: analyse, render: render, TARGET: TARGET, K_ALL: K_ALL };
