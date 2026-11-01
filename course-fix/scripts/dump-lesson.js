#!/usr/bin/env node
/* dump-lesson.js — print a module's lessons in a readable form for manual review. */
'use strict';
var fs = require('fs');
var L = JSON.parse(fs.readFileSync(process.argv[2] || 'course-fix/work/data/lessons.json', 'utf8'));
var Q = JSON.parse(fs.readFileSync(process.argv[3] || 'course-fix/work/data/questions.json', 'utf8'));
var mod = process.argv[4] || 'm01';
var qById = {}; Q.forEach(function (q) { qById[q.questionId] = q; });

function txt(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map(txt).join(' ');
  if (typeof v === 'object') return v.text || v.label || JSON.stringify(v);
  return String(v);
}

L.filter(function (l) { return l.lessonId.indexOf(mod) === 0; }).forEach(function (l) {
  console.log('### ' + l.lessonId + ' — ' + l.title);
  console.log('sources: ' + (l.sources || []).join(', ') + '   status: ' + l.status);
  (l.content.theory || []).forEach(function (s, i) {
    var head = s.h ? ('[' + s.h + '] ') : '';
    if (s.p) console.log('  T' + i + ': ' + head + txt(s.p));
    (s.blocks || []).forEach(function (b) {
      if (b.t === 'p') console.log('  T' + i + ': ' + b.text);
      else if (b.t === 'table') console.log('  T' + i + ' TABLE: ' + JSON.stringify(b.rows || b.data));
      else if (b.t === 'figure') console.log('  T' + i + ' FIGURE: ' + (b.caption || ''));
      else if (b.t === 'image') console.log('  T' + i + ' IMAGE: ' + (b.caption || ''));
      else console.log('  T' + i + ' ' + b.t.toUpperCase() + ': ' + JSON.stringify(b).slice(0, 400));
    });
  });
  var c = l.content.calc || {};
  console.log('  CALC task: ' + txt(c.task));
  console.log('  CALC soln: ' + txt(c.solution));
  var d = l.content.defect || {};
  console.log('  DEFECT sym: ' + txt(d.symptom));
  console.log('  DEFECT cau: ' + txt(d.cause));
  console.log('  DEFECT act: ' + txt(d.action));
  (l.quiz || []).forEach(function (qid) {
    var q = qById[qid]; if (!q) return;
    console.log('  Q ' + qid + ' [' + q.type + '] ' + txt(q.prompt));
    (q.options || []).forEach(function (o) { console.log('      ' + o.id + ') ' + txt(o)); });
    console.log('      correct=' + q.correct + '  src=' + q.source);
    if (q.explanation) console.log('      why: ' + txt(q.explanation).slice(0, 400));
  });
  console.log('');
});
