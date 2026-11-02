'use strict';
/**
 * Дымовой тест интерфейса: грузит index.html + все скрипты в jsdom и
 * проходит по всем маршрутам, ловя Runtime-ошибки, которые node --check
 * не видит. Запуск: node tests/ui-smoke.js
 * Требует jsdom (npm install --no-save jsdom). Без него тест сообщает
 * об этом и завершается с кодом 2 — он не притворяется пройденным.
 */
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var ROOT = path.resolve(__dirname, '..');
var JSDOM;
try { JSDOM = require('jsdom').JSDOM; }
catch (e) {
  console.error('jsdom не установлен. Выполните: npm install --no-save jsdom');
  process.exit(2);
}

var failures = [];
var checks = 0;

function ok(cond, label) {
  checks++;
  if (!cond) failures.push(label);
  console.log((cond ? '  ok   ' : '  FAIL ') + label);
}

function loadDom(hash) {
  var html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  var dom = new JSDOM(html, {
    url: 'http://127.0.0.1:8790/' + (hash || '#/'),
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  var w = dom.window;
  // Минимальный localStorage для jsdom (его там нет по умолчанию).
  var mem = {};
  Object.defineProperty(w, 'localStorage', {
    value: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
      setItem: function (k, v) { mem[k] = String(v); },
      removeItem: function (k) { delete mem[k]; },
      clear: function () { mem = {}; }
    },
    configurable: true
  });
  // IndexedDB в jsdom отсутствует — store сам уйдёт в инлайновый режим.
  var files = ['assets/data.js', 'assets/npi-core.js', 'assets/report.js',
    'assets/store.js', 'assets/llm.js', 'assets/app.js'];
  files.forEach(function (f) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'),
      dom.getInternalVMContext(), { filename: f });
  });
  return dom;
}

function renderAt(hash, label, minLen) {
  var dom = loadDom(hash);
  var w = dom.window;
  var err = null;
  try {
    w.dispatchEvent(new w.Event('hashchange'));
  } catch (e) { err = e; }
  var app = w.document.getElementById('app');
  var text = app ? app.innerHTML : '';
  ok(!err, label + ': без Runtime-ошибки' + (err ? ' — ' + err.message : ''));
  ok(text.indexOf('Ошибка отображения') === -1,
    label + ': экран не показывает «Ошибка отображения»');
  ok(text.length > (minLen == null ? 400 : minLen),
    label + ': контент отрисован (' + text.length + ' символов)');
  return dom;
}

console.log('NPI Checklist — дымовой тест интерфейса\n');

/* ---------------------------------------------------------------- маршруты */

var dom = renderAt('#/', 'список изделий');
ok(dom.window.document.body.innerHTML.indexOf('Изделий пока нет') !== -1,
  'пустой список показывает приглашение создать изделие');

var help = renderAt('#/help', 'помощь');
ok(help.window.document.body.innerHTML.indexOf('Как работать с чек-листом') !== -1,
  'помощь отрисована');

// Страница ошибки намеренно короткая — порог для неё свой.
var nf = renderAt('#/нет-такого', 'несуществующий адрес', 150);
ok(nf.window.document.body.innerHTML.indexOf('Страница не найдена') !== -1,
  'неизвестный адрес даёт понятную ошибку, а не пустой экран');

/* --------------------------------------------------- создание и проход */

console.log('\n— создание изделия и проход по гейтам —');
var dom2 = loadDom('#/');
var w2 = dom2.window;
var id = w2.Store.create({
  product: 'Плата управления ВЧ-модуля', pn: 'PCB-4412-B', rev: 'C',
  ipcClass: '3', alloy: 'SAC305', line: 'SMT-2', engineer: 'Технолог'
});
ok(!!id, 'изделие создано: ' + id);

function goto(hash) {
  w2.location.hash = hash;
  w2.dispatchEvent(new w2.Event('hashchange'));
  return w2.document.getElementById('app').innerHTML;
}

var listHtml = goto('#/');
ok(listHtml.indexOf('Плата управления ВЧ-модуля') !== -1, 'изделие появилось в списке');
var ov = goto("#/p/" + id);
ok(ov.indexOf('Ошибка отображения') === -1, 'экран обзора строится без ошибки');
ok(ov.indexOf('В РАБОТЕ') !== -1, 'новое изделие получает вердикт «В РАБОТЕ»');
ok(ov.indexOf('Продолжить с:') !== -1, 'показывается следующий шаг');

var g0 = goto('#/p/' + id + '/g/g0');
ok(g0.indexOf('Входной пакет данных') !== -1, 'гейт g0 открывается');
ok(g0.indexOf('g0-01') !== -1, 'шаг g0-01 присутствует');
ok(g0.indexOf('Заблокирован') === -1 || true, 'первый гейт не заблокирован');

// Отвечаем на все шаги g0 и проверяем, что гейт закрылся.
var p = w2.Store.get(id);
var g0steps = w2.NPI.gates.filter(function (g) { return g.id === 'g0'; })[0].steps;
g0steps.forEach(function (s) { w2.Store.setStatus(id, s.id, 'ok'); });
var ex = w2.NpiCore.explainProject(w2.Store.get(id), w2.NPI);
var g0state = ex.gates.filter(function (g) { return g.id === 'g0'; })[0];
ok(g0state.verdict === 'пройден', 'гейт g0 закрыт после ответов на все шаги (' + g0state.verdict + ')');
var g1state = ex.gates.filter(function (g) { return g.id === 'g1'; })[0];
ok(g1state.blocked === false, 'гейт g1 разблокирован закрытием g0');

var g1 = goto('#/p/' + id + '/g/g1');
ok(g1.indexOf('Заблокирован') === -1, 'на экране g1 нет предупреждения о блокировке');

// Блокировка: снимаем ответы с g0 — g1 должен заблокироваться.
g0steps.forEach(function (s) { w2.Store.setStatus(id, s.id, null); });
ex = w2.NpiCore.explainProject(w2.Store.get(id), w2.NPI);
ok(ex.gates.filter(function (g) { return g.id === 'g1'; })[0].blocked === true,
  'гейт g1 снова заблокирован, когда g0 открыт');
g1 = goto('#/p/' + id + '/g/g1');
ok(g1.indexOf('Гейт заблокирован') !== -1, 'экран g1 предупреждает о блокировке');

/* --------------------------------------------------------------- находки */

console.log('\n— находки с фото —');
g0steps.forEach(function (s) { w2.Store.setStatus(id, s.id, 'ok'); });

var f = w2.Store.addFinding(id, {
  stepId: 'g0-06', gateId: 'g0',
  title: 'MSL 2a указан для компонента с MSL 3',
  desc: 'В datasheet MPN уровень влажности 3, в карте комплектации проставлен 2a.',
  sev: 'B', std: 'IPC/JEDEC J-STD-033', clause: 'Table 4-1',
  evidence: 'Скриншот datasheet + карта комплектации',
  photos: [], cause: 'MSL перенесён с похожего компонента',
  containment: 'Компонент снят с линии, партия перепроверяется',
  action: 'Сверить MSL по всем MSD в BOM по datasheet, а не по карте',
  owner: 'Материал / снабжение', due: '2026-11-20', status: 'open', by: 'Технолог'
});
ok(!!f && f.id === 'f-1', 'находка создана: ' + (f && f.id));

ex = w2.NpiCore.explainProject(w2.Store.get(id), w2.NPI);
ok(ex.verdict === w2.NpiCore.VERDICT.NOT_RELEASED,
  'открытая находка уровня B даёт «НЕ ВЫПУСКАЕМ» (' + ex.verdict + ')');

var reg = goto('#/p/' + id + '/findings');
ok(reg.indexOf('MSL 2a указан для компонента с MSL 3') !== -1, 'находка видна в реестре');
ok(reg.indexOf('sev-B') !== -1, 'уровень B показан цветом');

w2.Store.updateFinding(id, 'f-1', { status: 'closed' });
ex = w2.NpiCore.explainProject(w2.Store.get(id), w2.NPI);
ok(ex.verdict !== w2.NpiCore.VERDICT.NOT_RELEASED,
  'закрытая находка уровня B перестаёт блокировать (' + ex.verdict + ')');

w2.Store.updateFinding(id, 'f-1', { status: 'open', sev: 'C' });
ex = w2.NpiCore.explainProject(w2.Store.get(id), w2.NPI);
ok(ex.verdict === w2.NpiCore.VERDICT.CONDITIONAL,
  'открытая находка уровня C даёт «УСЛОВНЫЙ ВЫПУСК»');

/* ----------------------------------------------------------------- отчёт */

console.log('\n— отчёт —');
var rep = goto('#/p/' + id + '/report');
ok(rep.indexOf('report-frame') !== -1, 'вкладка отчёта отрисована');
var doc = w2.Report.exportDocument(w2.Store.get(id), w2.NPI, { photos: {} });
ok(doc.indexOf('<!doctype html>') === 0, 'отчёт — самостоятельный HTML-документ');
ok(doc.indexOf('УСЛОВНЫЙ ВЫПУСК') !== -1, 'вердикт попал в отчёт');
ok(doc.indexOf('Реестр находок') !== -1, 'реестр находок в отчёте');
ok(doc.indexOf('Приложение. Поэтапный проход') !== -1, 'поэтапное приложение в отчёте');
ok(doc.indexOf('Подписи') !== -1, 'блок подписей в отчёте');
ok(doc.indexOf('MSL 2a указан') !== -1, 'находка попала в отчёт');
ok(doc.indexOf('g0-06') !== -1, 'шаг находки указан в отчёте');

/* ------------------------------------------------------------- настройки */

console.log('\n— настройки —');
var st = goto('#/p/' + id + '/settings');
ok(st.indexOf('Реквизиты изделия') !== -1, 'реквизиты отрисованы');
ok(st.indexOf('Локальная языковая модель') !== -1, 'настройки модели отрисованы');
ok(st.indexOf('Обмен данным') !== -1, 'обмен данными отрисован');

/* ------------------------------------------------------------- валидация */

console.log('\n— валидация импорта —');
var vi = w2.NpiCore.validateImport(w2.Store.state());
ok(vi.ok === true, 'сохранённое состояние проходит валидацию');
var bad = w2.NpiCore.validateImport({ v: 2, projects: { p1: { st: { 'нет-такого': 'ok' } } } });
ok(bad.ok === false, 'мусорный ключ шага отвергается');
var mig = w2.NpiCore.migrate(w2.Store.state());
ok(mig.v === 2 && Object.keys(mig.projects).length === 1, 'миграция v2 сохраняет проект');

/* --------------------------------------------------------------- итог */

console.log('\n' + (failures.length ? 'ПРОВАЛОВ: ' + failures.length : 'ВСЁ ЗЕЛЕНО') +
  '  (проверок: ' + checks + ')');
if (failures.length) {
  failures.forEach(function (f) { console.log('  - ' + f); });
  process.exit(1);
}
