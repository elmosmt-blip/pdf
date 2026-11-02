'use strict';
/**
 * Тесты хранилища. Чистая часть проверяется напрямую, браузерная — через
 * jsdom-подобную заглушку, чтобы не зависеть от настоящего браузера.
 * Запуск: node tests/store.test.js
 */
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var ctx = vm.createContext({ console: console });
['npi-core.js', 'store.js'].forEach(function (f) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'assets', f), 'utf8'),
    ctx, { filename: f });
});
var P = ctx.Store.pure;

var failures = [];
var checks = 0;
function ok(cond, label) {
  checks++;
  if (!cond) { failures.push(label); console.log('  FAIL ' + label); }
}

console.log('Хранилище — тесты\n');

/* --------------------------------------------------- порядковые номера */

ok(P.nextProjectId([]) === 'p-0001', 'пустой список -> p-0001');
ok(P.nextProjectId(['p-0001', 'p-0002']) === 'p-0003', 'два проекта -> p-0003');
ok(P.nextProjectId(['p-0001', 'p-0009', 'p-abc']) === 'p-0010',
  'пропуск в нумерации -> следующий по порядку');
ok(P.nextProjectId(['p-0001', 'p-0002', 'p-0002']) === 'p-0003', 'повторы не мешают');
ok(P.nextProjectId(null) === 'p-0001', 'null -> p-0001');
ok(P.nextProjectId(['просто', 'ещё']) === 'p-0001', 'строки без номера игнорируются');
ok(P.nextProjectId(['p-9999']) === 'p-10000', 'номер растёт дальше четырёх знаков');

/* ---------------------------------------------------------- фото-плашки */

var f1 = P.fitBox(4000, 3000, 1600);
ok(f1.w === 1600 && f1.h === 1200, '4000x3000 -> 1600x1200');
var f2 = P.fitBox(800, 600, 1600);
ok(f2.w === 800 && f2.h === 600, 'маленькое фото не растягивается');
var f3 = P.fitBox(0, 0, 1600);
ok(f3.w === 0 && f3.h === 0, 'нулевые размеры не дают деления на ноль');
var f4 = P.fitBox(300, 4000, 1600);
ok(f4.w === 120 && f4.h === 1600,
  'портрет масштабируется по длинной стороне: 300x4000 -> 120x1600');
var f5 = P.fitBox(1000, 1000, 1600);
ok(f5.w === 1000 && f5.h === 1000, 'квадрат не искажается');

/* ------------------------------------------------------------ размеры */

ok(P.fmtBytes(0) === '0 Б', 'ноль байт');
ok(P.fmtBytes(512) === '512 Б', 'меньше килобайта');
ok(P.fmtBytes(2048) === '2.0 КБ', 'килобайты');
ok(P.fmtBytes(1048576) === '1.0 МБ', 'мегабайты');
ok(P.fmtBytes(10 * 1024 * 1024) === '10 МБ', 'круглые мегабайты без дробей');
ok(P.fmtBytes(100 * 1024 * 1024) === '100 МБ', 'сотня мегабайт');
ok(P.fmtBytes(-5) === '—', 'отрицательный размер даёт прочерк, а не «0 Б»');
ok(P.fmtBytes('нет') === '—', 'не число тоже даёт прочерк');

/* -------------------------------------------------------- опознание ссылки */

ok(P.isDataUrl('data:image/jpeg;base64,/9j/4AAQ') === true, 'data-URL опознан');
ok(P.isDataUrl('http://x/y.png') === false, 'http-ссылка не data-URL');
ok(P.isDataUrl(null) === false, 'null безопасен');
ok(P.isDataUrl('') === false, 'пустая строка безопасна');
ok(P.isDataUrl('data:') === false, 'голое data: не считается ссылкой');
ok(P.isDataUrl('data:image/jpeg;base64') === false,
  'обрывок без запятой тоже не ссылка');
ok(P.isDataUrl('data:,hi') === true, 'data: с запятой считается ссылкой');
ok(P.isDataUrl('data:;base64,xxx') === true, 'data: без типа считается ссылкой');

/* --------------------------------------------------------- номера фото */

var ids = [];
for (var i = 0; i < 5; i++) ids.push(P.makePhotoId());
ok(ids.every(function (x) { return typeof x === 'string' && x.indexOf('ph-') === 0; }),
  'идентификаторы фото имеют префикс ph-');
ok(new Set(ids).size === 5, 'идентификаторы фото не повторяются');
ok(P.makePhotoId().indexOf('ph-') === 0, 'идентификатор начинается с ph-');

/* --------------------------------------------------------- дополнение */

ok(P.pad4(1) === '0001', 'pad4(1)');
ok(P.pad4(42) === '0042', 'pad4(42)');
ok(P.pad4(1234) === '1234', 'pad4(1234)');
ok(P.pad4(12345) === '12345', 'pad4 не обрезает');

/* --------------------------------------------------- поведение хранилища */

// Заглушка браузера: только то, что нужно store.js.
function makeRoot() {
  var mem = {};
  var root = {
    console: console,
    Promise: Promise,
    JSON: JSON,
    Object: Object,
    Array: Array,
    Date: Date,
    Error: Error,
    String: String,
    Number: Number,
    encodeURIComponent: encodeURIComponent,
    decodeURIComponent: decodeURIComponent,
    Math: Math,
    isFinite: isFinite,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    RegExp: RegExp,
    Blob: function () {},
    FileReader: function () {},
    Image: function () {},
    document: { createElement: function () { return { getContext: function () { return null; } }; } },
    indexedDB: undefined,
    localStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
      setItem: function (k, v) { mem[k] = String(v); },
      removeItem: function (k) { delete mem[k]; },
      clear: function () { mem = {}; }
    }
  };
  return root;
}

var root = makeRoot();
vm.runInContext(
  '(function(root){ window = root; globalThis = root; })(this);',
  ctx);
// Переоткрываем store.js в контексте с window/localStorage.
var ctx2 = vm.createContext(makeRoot());
vm.runInContext(
  fs.readFileSync(path.join(__dirname, '..', 'assets', 'npi-core.js'), 'utf8'),
  ctx2, { filename: 'npi-core.js' });
vm.runInContext(
  'var window = globalThis;' +
  fs.readFileSync(path.join(__dirname, '..', 'assets', 'store.js'), 'utf8'),
  ctx2, { filename: 'store.js' });
var S = ctx2.Store;

ok(typeof S === 'object', 'глобаль Store определена');
ok(typeof S.create === 'function', 'есть create');
ok(typeof S.setStatus === 'function', 'есть setStatus');
ok(typeof S.addFinding === 'function', 'есть addFinding');
ok(typeof S.get === 'function', 'есть get');
ok(typeof S.list === 'function', 'есть list');
ok(typeof S.inlineMode === 'function', 'есть inlineMode');
S.init();
ok(S.inlineMode() === true,
  'без IndexedDB хранилище переходит на встроенные фото, а не падает');

var id = S.create({ product: 'Тестовая плата', ipcClass: '3' });
ok(/^p-\d{4}$/.test(id), 'созданное изделие получает номер: ' + id);
ok(S.get(id) !== null, 'изделие читается обратно');
ok(S.get(id).meta.product === 'Тестовая плата', 'реквизиты сохранились');
ok(S.get(id).st && typeof S.get(id).st === 'object', 'состояние шагов инициализировано');
ok(S.get(id).findings && S.get(id).findings.length === 0, 'находок пока нет');
ok(S.list().length === 1, 'в списке одно изделие');

var id2 = S.create({ product: 'Второе изделие' });
ok(id2 !== id, 'второе изделие получает другой номер');
ok(S.list().length === 2, 'в списке два изделия');

S.remove(id);
ok(S.get(id) === null, 'удаление работает');
ok(S.list().length === 1, 'в списке осталось одно');

/* ------------------------------------------- повреждённое состояние */

var ls = makeRoot().localStorage;
ls.setItem('npi-checklist-v2', '{это не json');
var root2 = makeRoot();
root2.localStorage = ls;
var ctx3 = vm.createContext(root2);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'assets', 'npi-core.js'),
  'utf8'), ctx3, { filename: 'npi-core.js' });
vm.runInContext('var window = globalThis;' +
  fs.readFileSync(path.join(__dirname, '..', 'assets', 'store.js'), 'utf8'),
  ctx3, { filename: 'store.js' });
ok(ls.getItem('npi-checklist-v2.corrupt') !== null,
  'испорченное состояние отложено в сторону, а не потеряно');
ok(ctx3.Store.list().length === 0,
  'после порчи хранилище отдаёт чистый список, а не падает');

/* ------------------------------------------------------------------ итог */

console.log('\n' + (failures.length ? 'ПРОВАЛОВ: ' + failures.length : 'ВСЁ ЗЕЛЕНО') +
  '  (проверок: ' + checks + ')');
if (failures.length) {
  failures.forEach(function (f) { console.log('  - ' + f); });
  process.exit(1);
}
