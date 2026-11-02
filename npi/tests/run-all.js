#!/usr/bin/env node
/* run-all.js — один запуск всех проверок инструмента.
 * node tests/run-all.js
 * Нет зависимостей, кроме jsdom для дымового теста интерфейса.
 */
'use strict';

var path = require('path');
var fs = require('fs');

var files = [
  'npi-core.test.js',
  'report.test.js',
  'store.test.js',
  'serve.test.js',
  'ui-smoke.test.js',
  '../scripts/check-report-style.js'   // оформление отчёта, а не его логика
];

var abspath = function (f) { return path.join(__dirname, f); };
var missing = files.filter(function (f) {
  return !fs.existsSync(abspath(f));
});
if (missing.length) {
  console.error('нет файлов тестов: ' + missing.join(', '));
  process.exit(1);
}

// jsdom ставится отдельно: без него дымовой тест не идёт.
try {
  require.resolve('jsdom');
} catch (e) {
  console.error('Не установлен jsdom — дымовой тест интерфейса не пойдёт.');
  console.error('Установка: npm install --no-save jsdom');
  process.exit(1);
}

var failed = [];
var pending = [];   // [{ file, promise }] — имя нужно, индекс врёт

files.forEach(function (f) {
  console.log('\n=== ' + f + ' ' + '='.repeat(Math.max(0, 52 - f.length)));
  try {
    var exported = require(abspath(f));
    // Набор, который отдаёт промис, сообщает о конце сам. Иначе он молча
    // продолжает считаться идущим, и его сводка убегает после итоговой.
    if (exported && typeof exported.then === 'function') {
      pending.push({ file: f, promise: exported });
      return;
    }
    if (process.exitCode === 1) failed.push(f + ': проверки не прошли');
  } catch (e) {
    failed.push(f + ': ' + (e && e.message));
    console.log('  СБОЙ ' + (e && e.message));
  }
});

// Ждём асинхронные наборы и проверяем каждый по СВОЕМУ имени. Прежняя
// версия брала files[i], где i — номер в pending, и потому списывала
// провал сервера на первый файл списка.
Promise.all(pending.map(function (x) { return x.promise; })).then(function () {
  pending.forEach(function (x) {
    if (process.exitCode === 1) failed.push(x.file + ': проверки не прошли');
  });
  summary();
});

function summary() {

  console.log('\n' + '='.repeat(60));
  if (failed.length) {
    console.log('ПРОВАЛЕНО: ' + failed.length + ' из ' + files.length);
    failed.forEach(function (f) { console.log('  - ' + f); });
    process.exit(1);
  }
  console.log('ВСЁ ЗЕЛЕНО: ' + files.length + ' наборов тестов');
}
