'use strict';
/**
 * Модульные тесты ядра решений. Нет зависимостей.
 * Запуск: node tests/npi-core.test.js
 *
 * Каждый негативный случай здесь когда-то был настоящим дефектом или
 * близко к нему. В частности, тест на три написания имени поля серьёзности
 * существует потому, что находка с sev:'B' молча превращалась в 'C' —
 * и блокирующая находка переставала блокировать выпуск.
 */
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var ctx = vm.createContext({ console: console });
['data.js', 'npi-core.js'].forEach(function (f) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'assets', f), 'utf8'),
    ctx, { filename: f });
});
var NPI = ctx.NPI, NC = ctx.NpiCore;

var failures = [];
var checks = 0;

function ok(cond, label) {
  checks++;
  if (!cond) failures.push(label);
  if (!cond) console.log('  FAIL ' + label);
}
function group(name) { console.log('\n' + name); }
function throws(fn, label) {
  var threw = false;
  try { fn(); } catch (e) { threw = true; }
  ok(threw, label);
}
function noThrow(fn, label) {
  try { fn(); ok(true, label); }
  catch (e) { ok(false, label + ' — исключение: ' + e.message); }
}

function fresh() {
  return { meta: { product: 'ТЕСТ', ipcClass: '3' }, st: {}, note: {}, loc: {},
    gateNA: {}, findings: [], checklistVersion: NPI.version, ts: 0 };
}
function allOk() {
  var p = fresh();
  NPI.gates.forEach(function (g) {
    (g.steps || []).forEach(function (s) { p.st[s.id] = 'ok'; });
  });
  return p;
}

/* ===================================================== содержание данных */

group('Содержание чек-листа');
ok(NPI.gates.length === 14, 'гейтов 14, получено ' + NPI.gates.length);
var totalSteps = 0;
NPI.gates.forEach(function (g) { totalSteps += (g.steps || []).length; });
ok(totalSteps === 103, 'шагов 103, получено ' + totalSteps);
var ids = {};
NPI.gates.forEach(function (g) { (g.steps || []).forEach(function (s) { ids[s.id] = 1; }); });
ok(Object.keys(ids).length === totalSteps, 'все id шагов уникальны');
ok(NPI.gates[0].id === 'g0', 'первый гейт g0');
ok(NPI.gates[NPI.gates.length - 1].id === 'g13', 'последний гейт g13');

/* ================================================= нормализация чек-листа */

group('Нормализация чек-листа — пять эквивалентных форм');
var clA = NC.normalizeChecklist(NPI);
ok(clA.items.length === totalSteps, 'форма A (data.js): ' + clA.items.length);
ok(clA.items[0].key === 'g0-01', 'первый ключ g0-01, получено ' + clA.items[0].key);
ok(clA.items[0].gate === 'g0', 'гейт первого шага g0');

var mapB = {};
clA.gates.forEach(function (g) { mapB[g.id] = g.steps; });
ok(NC.normalizeChecklist(mapB).items.length === totalSteps, 'форма B (карта гейтов)');

var mapBshort = {};
clA.gates.forEach(function (g) {
  mapBshort[g.id] = g.steps.map(function (s) { return { id: s.id.split('-')[1], s: s.s }; });
});
ok(NC.normalizeChecklist(mapBshort).items.length === totalSteps,
  'форма B с коротким id (только цифры)');
ok(NC.normalizeChecklist(mapBshort).items[0].key === 'g0-01',
  'короткий id получает префикс гейта');

var mapD = {};
clA.items.forEach(function (i) { mapD[i.key] = i.s; });
ok(NC.normalizeChecklist(mapD).items.length === totalSteps, 'форма D (карта серьёзностей)');

var flat = clA.items.map(function (i) { return { gate: i.gate, id: i.id, s: i.s }; });
ok(NC.normalizeChecklist(flat).items.length === totalSteps, 'форма C (плоский список)');

var mapE = {};
clA.items.forEach(function (i) { mapE[i.key] = { s: i.s }; });
ok(NC.normalizeChecklist(mapE).items.length === totalSteps, 'форма E (карта объектов)');

/* ============================================== три написания серьёзности */

group('Серьёзность: три написания имени поля');
ok(NC.normalizeFinding({ sev: 'B' }, 0).sev === 'B', 'sev: B');
ok(NC.normalizeFinding({ s: 'B' }, 0).sev === 'B', 's: B');
ok(NC.normalizeFinding({ severity: 'B' }, 0).sev === 'B', 'severity: B');
ok(NC.normalizeFinding({ sev: 'b' }, 0).sev === 'B', 'регистр приводится: b -> B');
ok(NC.normalizeFinding({ sev: 'W' }, 0).sev === 'W', 'sev: W');
ok(NC.normalizeFinding({ sev: 'X' }, 0).sev === 'C',
  'неизвестная серьёзность -> значение по умолчанию C, а не пустая строка');
ok(NC.normalizeFinding({}, 0).sev === 'C', 'отсутствующая серьёзность -> C');
ok(NC.normalizeFinding({ sev: 'C' }, 0).sev === 'C', 'sev: C сохраняется');

/* ==================================================== негативная проверка */

group('Негативная проверка нормализации');
throws(function () { NC.normalizeChecklist('нет'); }, 'строка вместо чек-листа');
throws(function () { NC.normalizeChecklist({ g0: 'нет' }); }, 'не массив и не объект в гейте');
throws(function () { NC.normalizeChecklist({ g0: [{ id: 'x0-01' }] }); }, 'недопустимый id шага');
throws(function () { NC.normalizeChecklist({ '__proto__': {} }); }, 'ключ __proto__');
throws(function () { NC.normalizeChecklist({ 'constructor': {} }); }, 'ключ constructor');
throws(function () { NC.normalizeChecklist({ g0: [{ id: 'g0-01' }, 'нет'] }); }, 'не-объект в списке шагов');
throws(function () { NC.normalizeItems([{ gate: 'нет', id: 'g0-01' }]); }, 'недопустимый гейт в плоском списке');
noThrow(function () { NC.normalizeChecklist(null); }, 'null -> пустой список');
noThrow(function () { NC.normalizeChecklist({}); }, 'пустой объект -> пустой список');

/* ============================================================ покрытие */

group('Покрытие');
var p0 = fresh();
var cov0 = NC.computeCoverage(p0, NPI);
ok(cov0.answered === 0 && cov0.total === totalSteps, 'новый проект: 0 из ' + totalSteps);
ok(cov0.percent === 0, 'новый проект: покрытие 0 %');
var pAll = allOk();
var covAll = NC.computeCoverage(pAll, NPI);
ok(covAll.percent === 100, 'все ответы ok: покрытие 100 %');
var pNA = allOk();
pNA.gateNA = { g0: true, g1: true };
var covNA = NC.computeCoverage(pNA, NPI);
ok(covNA.total === totalSteps - clA.byGate['g0'].length - clA.byGate['g1'].length,
  'гейты N/A выбывают из знаменателя');
ok(covNA.excluded === clA.byGate['g0'].length + clA.byGate['g1'].length,
  'исключено столько шагов, сколько в двух гейтах');
ok(covNA.percent === 100, 'при всех ответах и двух N/A гейтах покрытие 100 %');

// Регресс: computeCoverage получала полный объект чек-листа и падала на
// служебном ключе `version`, считая его картой серьёзностей.
noThrow(function () { NC.computeCoverage(fresh(), NPI); },
  'computeCoverage принимает полный объект чек-листа');
ok(NC.computeCoverage(allOk(), NPI).percent === 100,
  'computeCoverage с полным чек-листом даёт 100 %');
noThrow(function () { NC.gateStates(fresh(), NPI, []); },
  'gateStates принимает полный объект чек-листа');
noThrow(function () { NC.explainProject(allOk(), NPI); },
  'explainProject принимает полный объект чек-листа');

/* ============================================================ вердикт */

group('Вердикт изделия');
ok(NC.explainProject(fresh(), NPI).verdict === NC.VERDICT.IN_PROGRESS,
  'пустой проект -> В РАБОТЕ');
ok(NC.explainProject(allOk(), NPI).verdict === NC.VERDICT.READY,
  'все шаги ok -> ГОТОВ К СЕРИИ');

var pB = allOk();
pB.findings = [{ id: 'f-1', stepId: 'g4-04', gateId: 'g4', title: 'Мост пасты',
  sev: 'B', status: 'open', photos: [] }];
ok(NC.explainProject(pB, NPI).verdict === NC.VERDICT.NOT_RELEASED,
  'открытая находка B -> НЕ ВЫПУСКАЕМ');
ok(NC.explainProject(pB, NPI).reasons[0].indexOf('уровня B') !== -1,
  'причина называет уровень B');
pB.findings[0].status = 'closed';
ok(NC.explainProject(pB, NPI).verdict === NC.VERDICT.READY,
  'закрытая находка B -> снова ГОТОВ К СЕРИИ');

var pC = allOk();
pC.findings = [{ id: 'f-1', stepId: 'g4-04', gateId: 'g4', title: 'Нет записи',
  sev: 'C', status: 'open', photos: [] }];
ok(NC.explainProject(pC, NPI).verdict === NC.VERDICT.CONDITIONAL,
  'открытая находка C -> УСЛОВНЫЙ ВЫПУСК');

var pW = allOk();
pW.findings = [{ id: 'f-1', stepId: 'g4-04', gateId: 'g4', title: 'Наблюдение',
  sev: 'W', status: 'open', photos: [] }];
ok(NC.explainProject(pW, NPI).verdict === NC.VERDICT.READY,
  'открытая находка W не меняет вердикт');
ok(NC.explainProject(pW, NPI).reasons.join(' ').indexOf('наблюдение') !== -1,
  'но попадает в основания как наблюдение');

var pRB = allOk(); pRB.st['g6-03'] = 'risk';
ok(NC.explainProject(pRB, NPI).verdict === NC.VERDICT.NOT_RELEASED,
  'риск на шаге уровня B -> НЕ ВЫПУСКАЕМ');
var pRC = allOk(); pRC.st['g1-02'] = 'risk';
ok(NC.explainProject(pRC, NPI).verdict === NC.VERDICT.CONDITIONAL,
  'риск на шаге уровня C -> УСЛОВНЫЙ ВЫПУСК');
var pRW = allOk(); pRW.st['g0-11'] = 'risk';
ok(NC.explainProject(pRW, NPI).verdict === NC.VERDICT.READY,
  'риск на шаге уровня W не блокирует');

// Риск на шаге, которого нет в чек-листе, не имеет права кончиться выпуском.
var pUnk = allOk(); pUnk.st['g0-99'] = 'risk';
ok(NC.explainProject(pUnk, NPI).verdict === NC.VERDICT.CONDITIONAL,
  'риск с неопределённой серьёзностью трактуется как уровень C');

// Порог покрытия настраивается.
ok(NC.explainProject(fresh(), NPI, { threshold: 0 }).verdict === NC.VERDICT.READY,
  'порог 0 % на пустом проекте даёт ГОТОВ К СЕРИИ');
ok(NC.explainProject(allOk(), NPI, { threshold: 100 }).verdict === NC.VERDICT.READY,
  'порог по умолчанию 100 %');

/* ======================================================= состояние гейтов */

group('Состояние и блокировка гейтов');
var gsFresh = NC.gateStates(fresh(), NPI, []);
ok(gsFresh[0].blocked === false, 'первый гейт никогда не заблокирован');
ok(gsFresh[1].blocked === true, 'второй гейт заблокирован на пустом проекте');
ok(gsFresh[0].verdict === 'открыт', 'пустой гейт открыт');

var gsAll = NC.gateStates(allOk(), NPI, []);
ok(gsAll.every(function (g) { return g.verdict === 'пройден'; }),
  'при всех ответах все гейты пройдены');
ok(gsAll.every(function (g) { return g.blocked === false; }), 'и ни один не заблокирован');

// Гейт, отмеченный N/A, не мешает следующему.
var pNA2 = fresh();
pNA2.gateNA = { g0: true };
var gsNA = NC.gateStates(pNA2, NPI, []);
ok(gsNA[0].verdict === 'не применим', 'гейт g0 не применим');
ok(gsNA[1].blocked === false, 'гейт g1 разблокирован отметкой N/A предыдущего');

// N/A убирает шаг из покрытия, но не стирает наблюдаемый риск.
var pRiskNA = fresh();
pRiskNA.gateNA = { g0: true };
pRiskNA.st['g0-01'] = 'risk';
ok(NC.explainProject(pRiskNA, NPI).reasons.join(' ').indexOf('g0-01') !== -1,
  'риск на шаге N/A-гейта всё равно учитывается');

// Открытая находка уровня B закрывает гейт как непройденный.
var pGB = fresh();
pGB.findings = [{ id: 'f-1', stepId: 'g0-01', gateId: 'g0', title: 'X', sev: 'B',
  status: 'open', photos: [] }];
var gsGB = NC.gateStates(pGB, NPI, []);
ok(gsGB[0].verdict === 'не пройден', 'открытая находка B делает гейт непройденным');
ok(gsGB[1].blocked === true, 'и блокирует следующий гейт');

/* ============================================================ находки */

group('Нормализация находок');
var nf = NC.normalizeFinding({ stepId: 'g0-01', title: 'Тест', sev: 'B' }, 4);
ok(nf.id === 'f-5', 'id по умолчанию из индекса: f-5');
ok(nf.gateId === 'g0', 'гейт выводится из id шага');
ok(nf.status === 'open', 'статус по умолчанию open');
ok(nf.photos.length === 0, 'фото по умолчанию пустой массив');
ok(NC.normalizeFinding({ id: 'f-9', stepId: 'g0-01', title: 'Т' }, 0).id === 'f-9',
  'собственный id сохраняется');
ok(NC.normalizeFinding({ stepId: 'g0-01', title: 'Т', photos: ['a', 5, null] }, 0)
  .photos.length === 1, 'из photos остаются только строки');
ok(NC.normalizeFinding({ stepId: 'g0-01', title: 'Т', status: 'чушь' }, 0).status === 'open',
  'недопустимый статус -> open');
ok(NC.findingsForGate([{ gateId: 'g4' }, { gateId: 'g5' }], 'g4').length === 1,
  'отбор находок по гейту');
ok(NC.openFindings([{ status: 'open' }, { status: 'closed' }, { status: 'contained' }])
  .length === 2, 'открытыми считаются open и contained');

/* ======================================================= валидация и migrate */

group('Валидация и миграция');
var v1 = NC.validateImport({ v: 2, projects: { p1: fresh() } });
ok(v1.ok === true, 'корректный документ проходит: ' + v1.errors.join('; '));
ok(NC.validateImport({ v: 1, projects: {} }).ok === false, 'неверная версия отвергается');
ok(NC.validateImport('нет').ok === false, 'не объект отвергается');
ok(NC.validateImport({ v: 2 }).ok === false, 'отсутствие projects отвергается');
ok(NC.validateImport({ v: 2, projects: { p1: { meta: {}, st: { 'нет': 'ok' } } } })
  .ok === false, 'мусорный ключ шага отвергается');
ok(NC.validateImport({ v: 2, projects: { p1: { meta: {}, st: { 'g0-01': 'может' } } } })
  .ok === false, 'мусорный статус отвергается');
ok(NC.validateImport({ v: 2, projects: { p1: { meta: {}, st: { 'g0-01': 'ok' }, лишнее: 1 } } })
  .ok === false, 'неизвестный ключ отвергается');
ok(NC.validateImport({ v: 2, projects: { p1: { meta: {}, st: {},
  findings: [{ id: 'f-1', stepId: 'g0-01', gateId: 'g5', title: 'т', sev: 'B',
    status: 'open' }] } } }).ok === false,
  'находка с несоответствующим гейтом отвергается');

var mig = NC.migrate({ v: 2, projects: { p1: fresh() } });
ok(mig.v === 2 && Object.keys(mig.projects).length === 1, 'миграция v2 сохраняет проект');
ok(mig.projects.p1.meta.product === 'ТЕСТ', 'метаданные сохраняются');
throws(function () { NC.migrate({ v: 99 }); }, 'неизвестная версия -> исключение');

// Миграция из формата аудитора v1: <этап>_<пункт>.
var legacy = {
  v: 1, activeId: 'a1',
  audits: { a1: { meta: { product: 'Старое' }, st: { 'g0_g0-01': 'ok', 'print_pr-04': 'ok' },
    stageNA: { g0: true } } }
};
var ml = NC.migrate(legacy);
ok(Object.keys(ml.projects).length === 1, 'миграция v1 создаёт проект');
ok(ml.projects.a1.st['g0-01'] === 'ok', 'ключ <гейт>_<шаг> приведён к <гейт>-<шаг>');
ok(!Object.prototype.hasOwnProperty.call(ml.projects.a1.st, 'print_pr-04'),
  'ключ несуществующего гейта отброшен');
ok(ml.projects.a1.gateNA.g0 === true, 'отметка N/A гейта сохраняется');

/* ==================================================== иммутабельность */

group('Чистота функций');
var src = allOk();
var before = JSON.stringify(src);
NC.explainProject(src, NPI);
NC.computeCoverage(src, NPI);
NC.gateStates(src, NPI, []);
ok(JSON.stringify(src) === before, 'вычисления не изменяют входной проект');
var mig2 = NC.migrate({ v: 2, projects: { p1: allOk() } });
ok(mig2.projects.p1 !== allOk(), 'миграция возвращает новые объекты');

/* ================================================================= итог */

console.log('\n' + (failures.length ? 'ПРОВАЛОВ: ' + failures.length : 'ВСЁ ЗЕЛЕНО') +
  '  (проверок: ' + checks + ')');
if (failures.length) {
  failures.forEach(function (f) { console.log('  - ' + f); });
  process.exit(1);
}
