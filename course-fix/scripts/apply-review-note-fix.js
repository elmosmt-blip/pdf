#!/usr/bin/env node
/* apply-review-note-fix.js — убрать из курса ссылку на REVIEW_CHECKLIST.md.
 * Использование: node apply-review-note-fix.js <data-dir>
 *
 * Двадцать первое требование автора: из поставляемого курса убрать все
 * упоминания инструментов, которыми он делался. Поле review каждого урока
 * несло фразу «The claim-by-claim trail … is in REVIEW_CHECKLIST.md» —
 * и lessons.json, и data-embed.js. Ссылка выходила за пределы оболочки
 * курса, то есть вела студента во внутренний аудит.
 *
 * Почему отдельным скриптом, а не правкой apply-marker-removal.js: тот
 * пишет REVIEW_TEXT только когда поле review начинается с 'TBD-REVIEW'.
 * Уже записанные заметки он не трогает, поэтому идемпотентный проход
 * нужен отдельно. Скрипт рассчитан на повторный запуск.
 */
'use strict';
var fs = require('fs');
var path = require('path');

var dataDir = process.argv[2];
if (!dataDir) { console.error('usage: node apply-review-note-fix.js <data-dir>'); process.exit(2); }

var lfile = path.join(dataDir, 'lessons.json');
var raw = fs.readFileSync(lfile, 'utf8');
var lessons = JSON.parse(raw);

// Точная фраза, которую нужно убрать. Совпадение по подстроке, а не по
// регулярному выражению: правку должно быть видно в diff.
var POINTER = 'The claim-by-claim trail, with lesson id and field path, is in ' +
  'REVIEW_CHECKLIST.md.';
var POINTER_RE = /The claim-by-claim trail[^"]*REVIEW_CHECKLIST\.md\.?\s*/;

var nNote = 0;
var touched = [];

lessons.forEach(function (l) {
  if (typeof l.review !== 'string') return;
  if (l.review.indexOf('REVIEW_CHECKLIST') === -1) return;
  var before = l.review;
  var after = before.replace(POINTER_RE, '').replace(/\s+$/, '');
  if (after === before) {
    // Неизвестная форма — не молчим, иначе правка «пройдёт» и ничего
    // не изменит.
    console.error('  x ' + l.lessonId + ': заметка не совпала с ожидаемой формой');
    console.error('    ' + before);
    process.exit(1);
  }
  l.review = after;
  nNote++;
  touched.push(l.lessonId);
});

/* Запись только при изменении: повторный запуск не должен трогать файл. */
var out = JSON.stringify(lessons, null, 2) + '\n';
var changed = false;
if (nNote > 0) {
  fs.writeFileSync(lfile, out);
  changed = true;
}

console.log('apply-review-note-fix: ' + nNote + ' заметка(ок) очищена' +
  (changed ? '' : ' (нечего менять)'));
if (nNote > 0) {
  console.log('  первый: ' + touched[0] + ', последний: ' + touched[touched.length - 1]);
  console.log('  осталось вхождений REVIEW_CHECKLIST: ' +
    (fs.readFileSync(lfile, 'utf8').match(/REVIEW_CHECKLIST/g) || []).length);
}
