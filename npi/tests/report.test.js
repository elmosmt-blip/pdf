'use strict';
/**
 * Тесты движка отчёта. Чистая функция: состояние + чек-лист -> HTML.
 * Нет зависимостей. Запуск: node tests/report.test.js
 */
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var ctx = vm.createContext({ console: console });
['data.js', 'npi-core.js', 'report.js'].forEach(function (f) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'assets', f), 'utf8'),
    ctx, { filename: f });
});
var NPI = ctx.NPI, NC = ctx.NpiCore, R = ctx.Report;

var failures = [];
var checks = 0;
function ok(cond, label) {
  checks++;
  if (!cond) { failures.push(label); console.log('  FAIL ' + label); }
}

var NOW = new Date('2026-11-02T09:30:00Z');

function base() {
  var p = {
    meta: { product: 'Плата управления ВЧ-модуля', pn: 'PCB-4412-B', rev: 'C',
      customer: 'АО Ритм', ipcClass: '3', alloy: 'SAC305', line: 'SMT-2',
      engineer: 'Вадim П.', start: '2026-10-01', target: '2026-12-15' },
    st: {}, note: {}, loc: {}, gateNA: {}, findings: [],
    checklistVersion: NPI.version, ts: 0
  };
  NPI.gates.forEach(function (g) { (g.steps || []).forEach(function (s) { p.st[s.id] = 'ok'; }); });
  return p;
}

function withFinding(patch) {
  var f = {
    id: 'f-1', stepId: 'g4-04', gateId: 'g4',
    title: 'Мост пасты между отпечатками на 0.4 мм шаге',
    desc: 'На 6 платах из 30 обнаружены мосты на U7. Шаг 0.4 мм, QFP-48.',
    sev: 'B', std: 'IPC-7525', clause: '§5.3',
    evidence: 'Фото отпечатка + запись измерения SPI',
    photos: ['ph-1', 'ph-2'],
    cause: 'Отверстие равно площадке, паста не отделяется',
    containment: 'Партия остановлена, трафарет заменён',
    action: 'Пересчитать уменьшение отверстий, ввести учёт отпечатков',
    owner: 'Технолог SMT-2', due: '2026-11-20', status: 'open', by: 'Иванов',
    ts: Date.UTC(2026, 10, 1, 8, 0, 0)
  };
  for (var k in patch) f[k] = patch[k];
  return f;
}

var PHOTOS = {
  'ph-1': { dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==', w: 1600, h: 1200 },
  'ph-2': { dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==', w: 1600, h: 1200 }
};

console.log('Отчёт — тесты\n');

/* ------------------------------------------------------------- структура */

var p = base();
var html = R.buildReportHtml(p, NPI, { now: NOW, photos: PHOTOS });
ok(html.indexOf('Плата управления ВЧ-модуля') !== -1, 'название изделия в отчёте');
ok(html.indexOf('PCB-4412-B') !== -1, 'обозначение в отчёте');
ok(html.indexOf('Класс IPC') !== -1, 'класс IPC в отчёте');
ok(html.indexOf('ГОТОВ К СЕРИИ') !== -1, 'вердикт в отчёте');
ok(html.indexOf('Покрытие 100 %') !== -1, 'покрытие в отчёте');
ok(html.indexOf('Состояние гейтов') !== -1, 'таблица гейтов');
ok(html.indexOf('Приложение. Поэтапный проход') !== -1, 'поэтапное приложение');
ok(html.indexOf('Подписи') !== -1, 'блок подписей');
ok(html.indexOf('О чём этот отчёт не говорит') !== -1, 'честный блок ограничений');
ok(html.indexOf('2026-11-02T09:30:00.000Z') !== -1, 'время формирования');
ok(html.indexOf('Версия чек-листа') !== -1, 'версия чек-листа');

/* ------------------------------------------------------------ вердикты */

var pB = base(); pB.findings = [withFinding()];
var hB = R.buildReportHtml(pB, NPI, { now: NOW, photos: PHOTOS });
ok(hB.indexOf('НЕ ВЫПУСКАЕМ') !== -1, 'находка B даёт НЕ ВЫПУСКАЕМ');
ok(hB.indexOf('открытая находка уровня B') !== -1, 'причина названа');
ok(hB.indexOf('Мост пасты между отпечатками') !== -1, 'находка в реестре');
ok(hB.indexOf('IPC-7525') !== -1, 'нормативный документ находки');
ok(hB.indexOf('Пересчитать уменьшение отверстий') !== -1, 'корректирующее действие');
ok(hB.indexOf('Технолог SMT-2') !== -1, 'владелец');
ok(hB.indexOf('2026-11-20') !== -1, 'срок');
ok(hB.indexOf('data:image/jpeg;base64,/9j/4AAQSkZJRg==') !== -1, 'фото встроено в отчёт');
ok((hB.match(/class="plate"/g) || []).length === 2, 'две фото-плитки');

var pC = base(); pC.findings = [withFinding({ sev: 'C' })];
ok(R.buildReportHtml(pC, NPI, { now: NOW }).indexOf('УСЛОВНЫЙ ВЫПУСК') !== -1,
  'находка C даёт УСЛОВНЫЙ ВЫПУСК');

var pClosed = base(); pClosed.findings = [withFinding({ status: 'closed' })];
ok(R.buildReportHtml(pClosed, NPI, { now: NOW }).indexOf('ГОТОВ К СЕРИИ') !== -1,
  'закрытая находка не блокирует');

/* ------------------------------------------------------------- приложение */

var pPart = base(); delete pPart.st['g6-03']; delete pPart.st['g1-02'];
var hPart = R.buildReportHtml(pPart, NPI, { now: NOW });
ok(hPart.indexOf('не отвечено') !== -1, 'неотвеченный шаг виден как неотвеченный');
ok((hPart.match(/badge--open/g) || []).length === 2, 'два неотвеченных шага');

var pNA = base(); pNA.gateNA = { g0: true };
var hNA = R.buildReportHtml(pNA, NPI, { now: NOW });
ok(hNA.indexOf('не применим') !== -1, 'гейт N/A помечен');
ok(hNA.indexOf('Покрытие 100 %') !== -1, 'N/A-гейт не портит покрытие при полных ответах');

/* ------------------------------------------------------------ экранирование */

var pEvil = base();
pEvil.findings = [withFinding({
  title: '<script>alert(1)</' + 'script>',
  desc: '<img src=x onerror=alert(2)>',
  cause: '"><b>жирный</b>'
})];
var hEvil = R.buildReportHtml(pEvil, NPI, { now: NOW });
ok(hEvil.indexOf('<script>alert(1)') === -1, 'тег script в заголовке нейтрализован');
ok(hEvil.indexOf('<img src=x') === -1, 'тег img с onerror нейтрализован');
ok(hEvil.indexOf('&lt;script&gt;') !== -1, 'нормализованный текст на месте');
ok(hEvil.indexOf('&lt;img src=x') !== -1, 'img показан как текст');
// Единственное вхождение 'onerror' — внутри экранированного текста.
ok((hEvil.match(/onerror/g) || []).length === 1, 'onerror встречается только как текст');

var pEvilMeta = base();
pEvilMeta.meta.product = '<svg onload=alert(3)>';
ok(R.buildReportHtml(pEvilMeta, NPI, { now: NOW }).indexOf('<svg onload') === -1,
  'метаданные тоже экранируются');

/* --------------------------------------------------------------- резюме */

var pLlm = base();
pLlm.findings = [withFinding({ sev: 'C' })];
var hLlm = R.buildReportHtml(pLlm, NPI, {
  now: NOW, photos: PHOTOS,
  llm: { text: 'Изделие на этапе квалификации.\n\n- первая строка\n- вторая строка',
    model: 'qwen3.8-flash-next', generatedAt: '2026-11-02T09:31:00Z' }
});
ok(hLlm.indexOf('Краткое резюме') !== -1, 'блок резюме присутствует');
ok(hLlm.indexOf('qwen3.8-flash-next') !== -1, 'модель названа');
ok(hLlm.indexOf('Текст резюме сгенерирован моделью') !== -1,
  'резюме честно помечено как сгенерированное');
ok(hLlm.indexOf('<li>первая строка</li>') !== -1, 'список в резюме разобран');
ok(hLlm.indexOf('<p>Изделие на этапе квалификации.</p>') !== -1, 'абзац в резюме разобран');

/* ------------------------------------------------------ документ и стили */

var doc = R.exportDocument(pB, NPI, { now: NOW, photos: PHOTOS });
ok(doc.indexOf('<!doctype html>') === 0, 'документ начинается с doctype');
ok(doc.indexOf('</html>') !== -1, 'документ закрыт');
ok(doc.indexOf('<style>') !== -1, 'стили встроены');
ok(doc.indexOf('@media print') !== -1, 'есть печатные стили');
ok(doc.indexOf('size:A4') !== -1, 'формат A4');
ok(doc.indexOf('lang="ru"') !== -1, 'язык документа ru');
ok(doc.length > html.length, 'документ длиннее фрагмента (обёртка)');

var css = R.printCss();
ok(css.indexOf('page-break-inside:avoid') !== -1, 'карточки не рвутся между страницами');
ok(css.indexOf('.plate img') !== -1, 'фото получают стиль');

/* --------------------------------------------------------- иммутабельность */

var before = JSON.stringify(p);
R.buildReportHtml(p, NPI, { now: NOW, photos: PHOTOS });
ok(JSON.stringify(p) === before, 'отчёт не изменяет проект');

/* ------------------------------------------------------------ негатив */

var threw = false;
try { R.buildReportHtml(null, NPI, {}); } catch (e) { threw = true; }
ok(threw, 'null вместо проекта -> исключение, а не пустой отчёт');

/* ------------------------------------------------------------------ итог */

console.log('\n' + (failures.length ? 'ПРОВАЛОВ: ' + failures.length : 'ВСЁ ЗЕЛЕНО') +
  '  (проверок: ' + checks + ')');
if (failures.length) {
  failures.forEach(function (f) { console.log('  - ' + f); });
  process.exit(1);
}
