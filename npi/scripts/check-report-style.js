#!/usr/bin/env node
/* check-report-style.js — проверка оформления отчёта.
 *
 * node scripts/check-report-style.js [файл.html]
 *
 * Без аргумента строит отчёт по образцу (включая неотвеченные шаги и находки
 * всех трёх статусов) и проверяет его. С аргументом проверяет готовый файл.
 *
 * Зачем отдельно от report.test.js: тот проверяет содержимое и экранирование,
 * а этот — что таблица стилей действительно применяется. jsdom не вычисляет
 * var(--…) и не разворачивает shorthand-ы, поэтому переменные здесь
 * разворачиваются вручную по :root, и только потом стили сдаются в jsdom.
 * Так проверяются настоящие цвета, а не их текстовые заглушки.
 *
 * Ожидания сверены с дизайн-системой курса (course-fix/work/assets/style.css):
 * #0D1117, tech-grid 60px, сигнальный тил #53d1cc, стеклянные панели,
 * IBM Plex, радиусы 14/20/28. Если токены курса изменятся — меняются и эти
 * числа, иначе проверка начнёт защищать не тот дизайн.
 */
'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var ROOT = path.join(__dirname, '..');
var JSDOM = require(path.join(ROOT, 'node_modules', 'jsdom')).JSDOM;

var html;

if (process.argv[2]) {
  html = fs.readFileSync(process.argv[2], 'utf8');
} else {
  var ctx = vm.createContext({ console: console });
  ['data.js', 'npi-core.js', 'report.js'].forEach(function (f) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets', f), 'utf8'), ctx,
      { filename: f });
  });
  var NPI = ctx.NPI, R = ctx.Report;

  var p = {
    meta: { product: 'Плата управления ВЧ-модуля ВЧ-4412', pn: 'PCB-4412-B',
      rev: 'C', customer: 'АО «Ритм»', ipcClass: '3', alloy: 'SAC305',
      line: 'SMT-2', engineer: 'Технолог NPI', start: '2026-10-05',
      target: '2026-11-28' },
    st: {}, note: {}, loc: {}, gateNA: {}, findings: [],
    checklistVersion: NPI.version, ts: 0
  };
  // Все шаги отвечены, кроме нескольких — чтобы в документе оказались и
  // неотвеченные строки, и строка риска, и гейт «не применим».
  var ids = [];
  NPI.gates.forEach(function (g) { (g.steps || []).forEach(function (s) { ids.push(s.id); }); });
  ids.forEach(function (id, i) { p.st[id] = i % 37 === 0 ? 'risk' : 'ok'; });
  delete p.st['g6-06'];
  delete p.st['g13-01'];
  p.gateNA['g6'] = true;
  p.note['g5-05'] = 'Смещение −0,018 / +0,011 мм';
  p.findings = [{
    id: 'f-2', stepId: 'g8-02', gateId: 'g8',
    title: 'Недостаточное заполнение отверстий разъёма J1',
    desc: 'Заливка 54–62 % по 12 отверстиям на 5 платах.', sev: 'B',
    std: 'IPC-A-610', clause: '§10.6.3', evidence: 'Микрошлиф + фото',
    photos: ['ph-1'], cause: 'Низкий прогрев', containment: 'Партия остановлена',
    action: 'Поднять прогрев до 125 °C', owner: 'Технолог', due: '2026-11-20',
    status: 'open', by: 'Иванов', ts: Date.UTC(2026, 10, 1, 8, 0, 0)
  }, {
    id: 'f-1', stepId: 'g4-04', gateId: 'g4',
    title: 'Мост пасты между отпечатками на 0.4 мм шаге',
    desc: 'На 6 платах из 30 обнаружены мосты на U7.', sev: 'B',
    std: 'IPC-7525', clause: '§5.3', evidence: 'Фото отпечатка + запись SPI',
    cause: 'Отверстие равно площадке', containment: 'Трафарет заменён',
    action: 'Уменьшить отверстия до 1:0,92', owner: 'Технолог SMT-2',
    due: '2026-11-15', status: 'closed', by: 'Иванов',
    ts: Date.UTC(2026, 9, 20, 8, 0, 0)
  }, {
    id: 'f-3', stepId: 'g0-03', gateId: 'g0',
    title: 'Остатки флюса под корпусом C17',
    desc: 'Визуально различимые белые остатки в 3 зонах.', sev: 'C',
    std: 'J-STD-001', clause: '§8.2', evidence: 'Фото под увеличением',
    cause: 'Недостаточная промывка', containment: 'Введён контроль ROSE',
    action: 'Перенастроить профиль промывки', owner: 'Технолог',
    due: '2026-11-25', status: 'contained', by: 'Петров',
    ts: Date.UTC(2026, 10, 3, 9, 0, 0)
  }];

  html = R.exportDocument(p, NPI, {
    now: new Date('2026-11-02T10:15:00Z'),
    photos: { 'ph-1': { dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==', w: 1600, h: 1200 } }
  });
}

var a = html.indexOf('<style>'), b = html.indexOf('</style>');
if (a === -1 || b === -1) { console.error('в документе нет таблицы стилей'); process.exit(1); }
var css = html.slice(a + 7, b);

/* ---- разворачиваем var() по :root ---- */
var root = {};
css.replace(/:root\{([^}]*)\}/, function (_, blk) {
  blk.split(';').forEach(function (d) {
    var i = d.indexOf(':');
    if (i < 0) return;
    root[d.slice(0, i).trim()] = d.slice(i + 1).trim();
  });
  return _;
});
var flat = css.replace(/var\((--[-_a-zA-Z0-9]+)\)/g, function (_, n) {
  if (!(n in root)) throw new Error('неопределённая переменная ' + n);
  return root[n];
});
var leftover = (flat.match(/var\(/g) || []).length;

var doc = '<!doctype html><html><head><meta charset="utf-8"><style>' + flat +
  '</style></head><body>' + html.slice(html.indexOf('</style>') + 8) + '</body></html>';
var dom = new JSDOM(doc, { pretendToBeVisual: true });
var win = dom.window;

var checks = [];
var notes = [];
// На внешнем файле состояние документа может просто не содержать нужного
// случая (нет неотвеченных шагов, нет условно пройденного гейта). Это не
// провал оформления, поэтому вне образца отсутствие элемента — примечание.
var strict = !process.argv[2];
function chk(name, sel, prop, want) {
  var el = win.document.querySelector(sel);
  if (!el) {
    var msg = name + ' — элемента ' + sel + ' нет в документе';
    if (strict) checks.push([false, msg]); else notes.push(msg);
    return;
  }
  var got = String(win.getComputedStyle(el).getPropertyValue(prop)).replace(/\s+/g, ' ').trim();
  // Список шрифтов jsdom квотирует иначе, чем написано в таблице стилей.
  // Сравниваем нормализованно: без кавычек и пробелов вокруг запятых.
  var norm = function (v) {
    return String(v).replace(/['"]/g, '').replace(/\s*,\s*/g, ',').trim();
  };
  var ok = got === want || norm(got) === norm(want);
  checks.push([ok, name + ' [' + sel + ' ' + prop + '] → ' + JSON.stringify(got) +
    (ok ? '' : '  ЖДАЛИ ' + JSON.stringify(want))]);
}
function rule(name, needle) {
  checks.push([flat.indexOf(needle) !== -1,
    name + ' — ' + (flat.indexOf(needle) !== -1 ? 'есть' : 'ОТСУТСТВУЕТ') + ': ' + needle]);
}

/* ------------------------------------------------ основа: токены курса */
rule('tech-grid 60px', 'background-size:60px 60px');
rule('сигнальный тил', '--signal:#53d1cc');
rule('фон #0D1117', '--bg:#0D1117');
rule('стеклянная панель', '--panel:rgba(15,23,34,.78)');
rule('радиус 28', '--r-lg:28px');
rule('тень курса', '--sh-2:0 24px 60px rgba(0,0,0,.28)');
rule('IBM Plex Sans', "--font:'IBM Plex Sans'");
rule('IBM Plex Serif', "--serif:'IBM Plex Serif'");
rule('IBM Plex Mono', "--mono:'IBM Plex Mono'");
chk('фон документа', 'body', 'background-color', 'rgb(13, 17, 23)');
chk('цвет текста', 'body', 'color', 'rgb(237, 242, 247)');
chk('межстрочный', 'body', 'line-height', '1.65');

/* ------------------------------------------------------------- обложка */
chk('обложка: градиент панели', '.cover', 'background-image',
  'linear-gradient(160deg,rgba(18,51,58,.55) 0%,rgba(15,23,34,.78) 55%,rgba(12,17,25,.94) 100%)');
chk('обложка: радиус 28', '.cover', 'border-radius', '28px');
chk('обложка: тень курса', '.cover', 'box-shadow', '0 24px 60px rgba(0,0,0,.28)');
chk('обложка: рамка', '.cover', 'border-top-color', 'rgba(146, 165, 185, 0.18)');
chk('обложка: заголовок серифным', '.cover h1', 'font-family',
  '\'IBM Plex Serif\',Georgia,\'Times New Roman\',serif');
chk('обложка: подзаголовок', '.cover-sub', 'color', 'rgb(203, 213, 225)');
chk('обложка: трекинг кикшапки', '.kicker', 'letter-spacing', '.18em');
chk('обложка: цвет кикшапки', '.kicker', 'color', 'rgb(83, 209, 204)');
chk('обложка: регистр кикшапки', '.kicker', 'text-transform', 'uppercase');
chk('обложка: мета-подпись', '.cover-meta th', 'color', 'rgb(255, 255, 255)');
chk('обложка: панель меты', '.cover-meta', 'font-variant-numeric', 'tabular-nums');

/* --------------------------------------------------- панель таблицы */
chk('панель: фон', '.tbl-wrap', 'background-color', 'rgba(15, 23, 34, 0.78)');
rule('панель: размытие 18px', 'backdrop-filter:blur(18px)');
chk('панель: радиус 20', '.tbl-wrap', 'border-radius', '20px');
chk('панель: тень', '.tbl-wrap', 'box-shadow',
  '0 12px 32px -10px rgba(0,0,0,.45)');
rule('панель: обрезка', 'overflow:hidden');

/* -------------------------------------------------------- шапка таблицы */
chk('шапка: подложка тил', 'thead th', 'background-color', 'rgba(83, 209, 204, 0.05)');
chk('шапка: цвет #94a3b8', 'thead th', 'color', 'rgb(148, 163, 184)');
chk('шапка: моно', 'thead th', 'font-family',
  '\'IBM Plex Mono\',\'SF Mono\',Consolas,Menlo,monospace');
chk('шапка: капитель', 'thead th', 'text-transform', 'uppercase');
chk('шапка: трекинг', 'thead th', 'letter-spacing', '.06em');
chk('шапка: линия снизу', 'thead th', 'border-bottom-color', 'rgba(146, 165, 185, 0.18)');
chk('ячейка: цвет #cbd5e1', 'tbody td', 'color', 'rgb(203, 213, 225)');
chk('ячейка: подписи белые', 'tbody th', 'color', 'rgb(255, 255, 255)');
chk('таблица: числа столбцом', 'table', 'font-variant-numeric', 'tabular-nums');

/* -------------------------------------------------------------- вердикт */
chk('вердикт: серифный 30px', '.verdict-badge', 'font-size', '30px');
chk('вердикт: серифный шрифт', '.verdict-badge', 'font-family',
  "'IBM Plex Serif',Georgia,'Times New Roman',serif");
chk('вердикт: жирность 600', '.verdict-badge', 'font-weight', '600');
chk('вердикт: радиус 20', '.verdict-banner', 'border-radius', '20px');
chk('вердикт: красная подложка', '.verdict-banner', 'background-color', 'rgba(244, 67, 54, 0.06)');
chk('вердикт: цвет плашки', '.vb-badge--risk', 'color', 'rgb(244, 67, 54)');
rule('вердикт: зелёный вариант', '.vb-badge--ok{color:#4caf50}');
rule('вердикт: оранжевый вариант', '.vb-badge--warn{color:#ff9800}');
chk('вердикт: строка покрытия моно', '.coverage-line', 'font-family',
  "'IBM Plex Mono','SF Mono',Consolas,Menlo,monospace");
chk('вердикт: «на основании» капителью', '.verdict-why', 'text-transform', 'uppercase');
chk('вердикт: трекинг «на основании»', '.verdict-why', 'letter-spacing', '.15em');

/* ------------------------------------------------------ полоса покрытия */
chk('покрытие: трек 8px', '.progress', 'height', '8px');
chk('покрытие: пилюля', '.progress', 'border-radius', '99px');
chk('покрытие: трек-подложка', '.progress', 'background-color', 'rgba(255, 255, 255, 0.07)');
chk('покрытие: градиент заливки', '.progress span', 'background-image',
  'linear-gradient(90deg,#53d1cc,#53d1cc)');
chk('покрытие: подпись моно', '.cov-num', 'font-family',
  "'IBM Plex Mono','SF Mono',Consolas,Menlo,monospace");

/* ---------------------------------------------------- резюме модели */
rule('резюме: тиловая подложка', '.llm-summary{border-radius:20px;padding:16px 20px');

/* ------------------------------------------------------------ плашки */
chk('чип: моно 12px', '.chip', 'font-family',
  "'IBM Plex Mono','SF Mono',Consolas,Menlo,monospace");
chk('чип: пилюля', '.chip', 'border-radius', '99px');
chk('чип не сверено: оранжевый', '.chip--unreviewed', 'color', 'rgb(255, 152, 0)');
chk('бейдж: зелёный', '.badge--ok', 'color', 'rgb(76, 175, 80)');
chk('бейдж: красный', '.badge--risk', 'color', 'rgb(244, 67, 54)');
chk('бейдж: оранжевый', '.badge--open', 'color', 'rgb(255, 152, 0)');
chk('бейдж: пилюля', '.badge', 'border-radius', '99px');
chk('гейт пройден: зелёный', '.gs--ok .gs-badge', 'color', 'rgb(76, 175, 80)');
chk('гейт условно: оранжевый', '.gs--warn .gs-badge', 'color', 'rgb(255, 152, 0)');
chk('гейт непройден: красный', '.gs--risk .gs-badge', 'color', 'rgb(244, 67, 54)');
chk('гейт не применим: серый', '.gs--muted .gs-badge', 'color', 'rgb(148, 163, 184)');

/* --------------------------------------------------- серьёзность находки */
chk('B: красная заливка', '.sev--B', 'background-color', 'rgb(244, 67, 54)');
chk('B: белый текст', '.sev--B', 'color', 'rgb(255, 255, 255)');
chk('C: оранжевая заливка', '.sev--C', 'background-color', 'rgb(255, 152, 0)');
chk('C: тёмный текст', '.sev--C', 'color', 'rgb(13, 17, 23)');
chk('W: серая заливка', '.sev--W', 'background-color', 'rgba(146, 165, 185, 0.3)');
chk('серьёзность: моно', '.sev', 'font-family',
  "'IBM Plex Mono','SF Mono',Consolas,Menlo,monospace");

/* ----------------------------------------------------- реестр находок */
chk('находка: панель', '.finding', 'background-color', 'rgba(15, 23, 34, 0.78)');
chk('находка: радиус 28', '.finding', 'border-radius', '28px');
chk('находка: тень курса', '.finding', 'box-shadow', '0 24px 60px rgba(0,0,0,.28)');
rule('находка: размытие 18px', '.finding{background:rgba(15,23,34,.78);backdrop-filter:blur(18px)');
chk('находка: номер тилом', '.finding-num', 'color', 'rgb(83, 209, 204)');
chk('находка: статус открыт красный', '.fs--open', 'color', 'rgb(244, 67, 54)');
chk('находка: статус локализован', '.fs--contained', 'color', 'rgb(255, 152, 0)');
chk('находка: статус закрыт зелёный', '.fs--closed', 'color', 'rgb(76, 175, 80)');
chk('находка: подписи полей тилом', '.finding-fields tbody th', 'color', 'rgb(83, 209, 204)');
chk('находка: подписи полей моно', '.finding-fields tbody th', 'font-family',
  "'IBM Plex Mono','SF Mono',Consolas,Menlo,monospace");
chk('находка: подписи полей капителью', '.finding-fields tbody th',
  'text-transform', 'uppercase');

/* ---------------------------------------------------------------- фото */
chk('фото: скругление 14', '.plate img', 'border-radius', '14px');
chk('фото: рамка', '.plate img', 'border-top-color', 'rgba(146, 165, 185, 0.18)');
chk('фото: подпись моно', '.plate figcaption', 'font-family',
  "'IBM Plex Mono','SF Mono',Consolas,Menlo,monospace");
chk('фото: подпись серая', '.plate figcaption', 'color', 'rgb(148, 163, 184)');

/* ------------------------------------------------------ приложение */
chk('гейт: панель', '.appendix-gate', 'background-color', 'rgba(15, 23, 34, 0.78)');
chk('гейт: радиус 20', '.appendix-gate', 'border-radius', '20px');
chk('гейт: шапка тиловая', '.appendix-gate > h3', 'background-color', 'rgba(83, 209, 204, 0.05)');
chk('гейт: id шага тилом', '.step-id', 'color', 'rgb(83, 209, 204)');
chk('шаги: неотвеченный оранжевый', '.step--unanswered td', 'background-color',
  'rgba(255, 152, 0, 0.05)');
chk('шаги: риск красный', '.step--risk td', 'background-color', 'rgba(244, 67, 54, 0.05)');

/* ------------------------------------------------------------ разделы */
chk('раздел: серифный 28px', 'h2', 'font-family',
  "'IBM Plex Serif',Georgia,'Times New Roman',serif");
chk('раздел: размер 28', 'h2', 'font-size', '28px');
chk('раздел: белый', 'h2', 'color', 'rgb(255, 255, 255)');
rule('раздел: тиловая черта 44px', 'width:44px;height:3px');

/* ------------------------------------------------------ подписи, прочее */
chk('подписи: подписи полей тилом', '.signoff-table tbody th', 'color', 'rgb(83, 209, 204)');
chk('подписи: высота ячейки', '.signoff-table td.sig-blank', 'height', '48px');
chk('примечания: подложка', '.notes', 'background-color', 'rgba(255, 255, 255, 0.02)');
chk('примечания: радиус 14', '.notes', 'border-radius', '14px');
chk('подвал: моно', '.report-foot', 'font-family',
  "'IBM Plex Mono','SF Mono',Consolas,Menlo,monospace");
chk('подвал: серый', '.report-foot', 'color', 'rgb(148, 163, 184)');

/* --------------------------------------------------------------- печать */
rule('печать: А4', '@page{size:A4');
rule('печать: белая бумага', 'body{background:#fff;color:#000');
rule('печать: панели снимаются', 'background:#fff!important');
rule('печать: без разрыва карточки', '.finding,.plate,.appendix-gate');
rule('печать: без разрыва строки', 'tr{');

var bad = checks.filter(function (c) { return !c[0]; });
checks.forEach(function (c) { console.log((c[0] ? '  ok   ' : '  ПЛОХО ') + c[1]); });
notes.forEach(function (m) { console.log('  прим. ' + m + ' (в этом документе такого случая нет)'); });
console.log('');
console.log('неразвернувшихся var(): ' + leftover);
console.log(bad.length ? 'ПРОВАЛЕНО: ' + bad.length + ' из ' + checks.length
  : 'ВСЁ ПРИМЕНЯЕТСЯ: ' + checks.length + ' вычисленных стилей подтверждены');
// Выход только при провале: файл подключается и из tests/run-all.js, где
// process.exit(0) оборвал бы весь прогон на полпути.
if (bad.length || leftover) process.exit(1);
