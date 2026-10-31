#!/usr/bin/env node
'use strict';
/*
 * gates.js — additional publication gates for the course data.
 *
 * check-course.js validates the CONTRACT.md schema. This script adds the
 * review gates that the schema cannot express, so that a lesson cannot reach
 * `factchecked`/`reviewed`/`published` while its assessment is unattributable:
 *
 *   G-COMP  every question carries only canonical competencies (K1..K10) AND
 *           only competencies its own lesson declares in goals[]
 *   G-QUIZ  every lesson has at least one question
 *   G-SRC   every source ref exists; lessons that contain numbers cite a
 *           source or carry a TBD-REVIEW marker (report only)
 *   G-TBD   burn-down report of numbers still awaiting verification
 *   G-STAGE report of lessons with no auditor stage (m14/m15)
 *
 * G-COMP and G-QUIZ are hard gates (exit 1). The rest are reports.
 *
 * Usage:
 *   node scripts/gates.js [dataDir]
 *
 * Zero dependencies, classic CommonJS — same constraints as check-course.js.
 */

const fs = require('fs');
const path = require('path');

const dataDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, '..', 'data');
const COMPETENCIES = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8', 'K9', 'K10'];
const STAGE_IDS = [
  'incoming', 'storage', 'stencil', 'print', 'placement', 'reflow', 'aoi',
  'tht-prep', 'wave', 'selective', 'manual-rework', 'coating-esd', 'test',
  'shipping', 'capability'
];

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf8'));
}

function main() {
  const lessons = readJson('lessons.json');
  const questions = readJson('questions.json');
  const sources = readJson('sources.json');
  const errors = [];
  const lessonById = {};
  lessons.forEach(function (l) { lessonById[l.lessonId] = l; });

  // --- G-COMP ---------------------------------------------------------------
  let compOk = 0;
  questions.forEach(function (q) {
    const l = lessonById[q.lessonId];
    if (!l) { errors.push('G-COMP ' + q.questionId + ': unknown lesson ' + q.lessonId); return; }
    const goals = [];
    (l.goals || []).forEach(function (g) {
      (g.competencies || []).forEach(function (c) { if (goals.indexOf(c) === -1) goals.push(c); });
    });
    (q.competencies || []).forEach(function (k) {
      if (COMPETENCIES.indexOf(k) === -1) {
        errors.push('G-COMP ' + q.questionId + ': competency "' + k + '" is not in K1..K10');
      } else if (goals.indexOf(k) === -1) {
        errors.push('G-COMP ' + q.questionId + ': competency ' + k + ' is not declared by lesson ' + q.lessonId +
          ' goals (' + (goals.join(',') || 'none') + ')');
      }
    });
    if (!q.competencies || q.competencies.length === 0) {
      errors.push('G-COMP ' + q.questionId + ': no competencies');
    }
    compOk++;
  });

  // --- G-QUIZ ---------------------------------------------------------------
  const noQuiz = lessons.filter(function (l) { return !l.quiz || l.quiz.length === 0; });
  noQuiz.forEach(function (l) { errors.push('G-QUIZ ' + l.lessonId + ': lesson has no quiz questions'); });

  // --- G-SRC (report) -------------------------------------------------------
  const sourceIds = {};
  sources.forEach(function (s) { sourceIds[s.id] = s; });
  const unverifiedSources = sources.filter(function (s) {
    return !s.verifiedBy || s.verifiedBy === 'TBD-REVIEW' || !s.verifiedOn;
  });
  const dangling = [];
  lessons.forEach(function (l) {
    (l.sources || []).forEach(function (r) { if (!sourceIds[r]) dangling.push(l.lessonId + ' -> ' + r); });
  });
  const uncitedWithNumbers = [];
  lessons.forEach(function (l) {
    const blob = JSON.stringify(l);
    const hasTbd = /unverified: \[".+"\]/.test(l.review || '');
    const hasNumber = /\d/.test(blob);
    if (hasNumber && (!l.sources || l.sources.length === 0) && !hasTbd) uncitedWithNumbers.push(l.lessonId);
  });

  // --- G-TBD burn-down (report) --------------------------------------------
  let flagged = 0;
  const tbdByModule = {};
  lessons.forEach(function (l) {
    const m = /unverified: \[(.*)\]/.exec(l.review || '');
    const n = m && m[1].trim() ? m[1].split(',').length : 0;
    flagged += n;
    const mod = l.lessonId.slice(0, 3);
    tbdByModule[mod] = (tbdByModule[mod] || 0) + n;
  });

  // --- G-STAGE (report) ----------------------------------------------------
  const noStage = lessons.filter(function (l) { return !l.stageId; }).map(function (l) { return l.lessonId; });
  const stagesCovered = {};
  lessons.forEach(function (l) { if (l.stageId) stagesCovered[l.stageId] = true; });
  const uncoveredStages = STAGE_IDS.filter(function (s) { return !stagesCovered[s]; });

  // --- report ---------------------------------------------------------------
  const dist = {};
  questions.forEach(function (q) {
    (q.competencies || []).forEach(function (k) { dist[k] = (dist[k] || 0) + 1; });
  });
  console.log('gates: ' + questions.length + ' questions, ' + lessons.length + ' lessons, ' + sources.length + ' sources');
  console.log('  G-COMP questions checked: ' + compOk);
  COMPETENCIES.forEach(function (k) {
    const n = dist[k] || 0;
    const flag = n === 0 ? '  <-- NO QUESTIONS' : (n < 5 ? '  <-- thin' : '');
    console.log('    ' + k + ': ' + n + ' questions' + flag);
  });
  console.log('  G-QUIZ lessons without questions: ' + (noQuiz.length ? noQuiz.join(', ') : 'none'));
  console.log('  G-SRC  sources not yet human-verified: ' + unverifiedSources.length + '/' + sources.length);
  console.log('  G-SRC  dangling source refs: ' + (dangling.length ? dangling.join(', ') : 'none'));
  console.log('  G-SRC  lessons with numbers, no source and no TBD marker: ' +
    (uncitedWithNumbers.length ? uncitedWithNumbers.join(', ') : 'none'));
  console.log('  G-TBD  numbers still flagged TBD-REVIEW: ' + flagged);
  Object.keys(tbdByModule).sort().forEach(function (m) {
    console.log('          ' + m + ': ' + tbdByModule[m]);
  });
  console.log('  G-STAGE lessons with no auditor stage: ' + (noStage.length ? noStage.join(', ') : 'none'));
  console.log('  G-STAGE contract stages with no course module: ' +
    (uncoveredStages.length ? uncoveredStages.join(', ') : 'none'));

  if (errors.length) {
    console.log('');
    errors.forEach(function (e) { console.log('FAIL ' + e); });
    console.log('gates: ' + errors.length + ' error(s)');
    process.exit(1);
  }
  console.log('gates: OK (G-COMP and G-QUIZ passed)');
}

try { main(); } catch (e) {
  console.error('gates: FAILED — ' + e.message);
  process.exit(1);
}
