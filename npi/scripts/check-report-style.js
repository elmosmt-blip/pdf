#!/usr/bin/env node
/* check-report-style.js — проверка оформления отчёта.
 *
 * node scripts/check-report-style.js [файл.html]
 *
 * Без аргумента строит отчёт по образцу (включая неотвеченные шаги и открытую
 * находку B) и проверяет его. С аргументом проверяет готовый файл.
 *
 * Зачем отдельно от report.test.js: тот проверяет содержимое и экранирование,
 * а этот — что таблица стилей действительно применяется. jsdom не вычисляет
 * var(--…) и не разворачивает shorthand-ы, поэтому переменные здесь
 * разворачиваются вручную по :root, и только потом стили сдаются в jsdom.
 * Так проверяются настоящие цвета, а не их текстовые заглушки.
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

var COVW = (html.match(/cov-fill" style="width:([^"]+)"/) || [])[1] || '0%';
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
  checks.push([got === want, name + ' [' + sel + ' ' + prop + '] → ' + JSON.stringify(got) +
    (got === want ? '' : '  ЖДАЛИ ' + JSON.stringify(want))]);
}
function rule(name, selector) {
  checks.push([flat.indexOf(selector) !== -1,
    name + ' — правило ' + selector + (flat.indexOf(selector) !== -1 ? ' есть' : ' ОТСУТСТВУЕТ')]);
}

/* ------------------------------------------------ обложка */
chk('обложка: тёмный градиент', '.cover', 'background-image',
  'linear-gradient(135deg,#073d49 0%,#0a5666 48%,#0f7386 100%)');
chk('обложка: белый текст', '.cover', 'color', 'rgb(255, 255, 255)');
chk('обложка: заголовок 29px', '.cover h1', 'font-size', '29px');
chk('обложка: трекинг кикшапки', '.cover-kicker', 'letter-spacing', '.16em');
chk('обложка: мета-подпись', '.cover-meta th', 'color', 'rgba(255, 255, 255, 0.66)');
chk('обложка: мета-фон', '.cover-meta th', 'background-color', 'rgba(255, 255, 255, 0.07)');

/* ------------------------------------------------ шапка таблицы */
chk('шапка: акцентный фон', 'thead th', 'background-color', 'rgb(13, 107, 124)');
chk('шапка: белый текст', 'thead th', 'color', 'rgb(255, 255, 255)');
chk('шапка: капитель', 'thead th', 'text-transform', 'uppercase');
chk('шапка: трекинг', 'thead th', 'letter-spacing', '.075em');

/* ------------------------------------------------ вердикт */
chk('вердикт: 23px', '.verdict-badge', 'font-size', '23px');
chk('вердикт: жирность 800', '.verdict-badge', 'font-weight', '800');
chk('вердикт: красная полоса', '.verdict-banner', 'border-left-color', 'rgb(165, 29, 29)');
chk('вердикт: красная подложка', '.verdict-banner', 'background-color', 'rgb(253, 242, 242)');
chk('вердикт: цвет плашки', '.verdict-badge', 'color', 'rgb(165, 29, 29)');
chk('вердикт: ширина полосы 5px', '.verdict-banner', 'border-left-style', 'solid');

/* ------------------------------------------------ полоса покрытия */
chk('покрытие: трек 9px', '.cov-track', 'height', '9px');
chk('покрытие: заливка', '.cov-fill', 'width', COVW);
chk('покрытие: пилюля', '.cov-track', 'border-radius', '99px');

/* ------------------------------------------------ серьёзность */
chk('B: залитый фон', '.sev--B', 'background-color', 'rgb(165, 29, 29)');
chk('B: белый текст', '.sev--B', 'color', 'rgb(255, 255, 255)');
chk('C: залитый фон', '.sev--C', 'background-color', 'rgb(138, 90, 8)');
chk('W: залитый фон', '.sev--W', 'background-color', 'rgb(85, 105, 122)');

/* ------------------------------------------------ карточка находки */
chk('находка: шапка-подложка', '.finding-head', 'background-color', 'rgb(245, 248, 250)');
chk('находка: заголовок 14px', '.finding-head h3', 'font-size', '14px');
chk('находка: статус открыт', '.fs--open', 'color', 'rgb(165, 29, 29)');
chk('находка: статус закрыт', '.fs--closed', 'color', 'rgb(22, 111, 60)');
chk('находка: статус локализован', '.fs--contained', 'color', 'rgb(138, 90, 8)');

/* ------------------------------------------------ фото */
chk('фото: рамка сверху', '.plate img', 'border-top-width', '1px');
chk('фото: цвет рамки', '.plate img', 'border-top-color', 'rgb(219, 227, 234)');
chk('фото: подпись 10.5px', '.plate figcaption', 'font-size', '10.5px');

/* ------------------------------------------------ приложение */
chk('гейт: шапка-подложка', '.appendix-gate > h3', 'background-color', 'rgb(245, 248, 250)');
chk('шаги: 11.5px', '.steps', 'font-size', '11.5px');
chk('шаги: моно id', '.step-id', 'font-family',
  'ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, "Liberation Mono", monospace');
chk('шаги: риск подсвечен', '.step--risk td', 'background-color', 'rgb(253, 242, 242)');
chk('шаги: неотвеченный', '.step--unanswered td', 'background-color', 'rgb(253, 248, 236)');

/* ------------------------------------------------ разделы */
chk('раздел: 17px', 'h2', 'font-size', '17px');
chk('раздел: линия снизу', 'h2', 'border-bottom-color', 'rgb(219, 227, 234)');
chk('раздел: акцентная черта', 'h2', 'border-bottom-style', 'solid');

/* ------------------------------------------------ прочее */
chk('подписи: ячейка 42px', '.signoff-table td.sig-blank', 'height', '42px');
chk('примечания: подложка', '.notes', 'background-color', 'rgb(245, 248, 250)');
chk('гейт-бейдж пройден', '.gs--ok .gs-badge', 'color', 'rgb(22, 111, 60)');
chk('гейт-бейдж не пройден', '.gs--risk .gs-badge', 'color', 'rgb(165, 29, 29)');
chk('гейт-бейдж условно', '.gs--warn .gs-badge', 'color', 'rgb(138, 90, 8)');
chk('гейт-бейдж не применим', '.gs--muted .gs-badge', 'color', 'rgb(85, 105, 122)');
chk('бейдж соответствует', '.badge--ok', 'color', 'rgb(22, 111, 60)');
chk('бейдж риск', '.badge--risk', 'color', 'rgb(165, 29, 29)');

/* ------------------------------------------------ печать */
rule('печать: А4', '@page{size:A4');
rule('печать: без разрыва карточки', '.finding,.plate,.appendix-gate');
rule('печать: цвет не выцветает', 'print-color-adjust:exact');

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
