#!/usr/bin/env node
/* demo-walk.js — виртуальная сборка: полный проход чек-листа NPI.
 *
 * Запуск: node demo/demo-walk.js
 *
 * Что делает: поднимает настоящий инструмент в jsdom, создаёт изделие,
 * отвечает на все 103 шага, заводит находки с фото-доказательствами и
 * собирает отчёт теми же функциями, что и интерфейс. Никаких побочных
 * путей: если бы инструмент не работал, этот скрипт бы не отработал.
 *
 * Изделие и все данные — вымышленные. Это демонстрация механики, а не
 * аудит реального производства.
 */
'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var ROOT = path.join(__dirname, '..');
var OUT = path.join(ROOT, 'demo');

/* ------------------------------------------------------------ загрузка */

var html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
var JSDOM;
try {
  // Путь задан явно: скрипт лежит в demo/, а зависимости — в корне инструмента.
  JSDOM = require(path.join(ROOT, 'node_modules', 'jsdom')).JSDOM;
} catch (e) {
  console.error('Нужен jsdom: npm install --no-save jsdom');
  process.exit(1);
}

var dom = new JSDOM(html, {
  url: 'http://127.0.0.1:8790/#/',
  runScripts: 'outside-only',
  pretendToBeVisual: true
});
var w = dom.window;
var mem = {};
Object.defineProperty(w, 'localStorage', {
  value: {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
    setItem: function (k, v) { mem[k] = String(v); },
    removeItem: function (k) { delete mem[k]; }
  }, configurable: true
});

['data.js', 'npi-core.js', 'report.js', 'store.js', 'llm.js', 'app.js'].forEach(function (f) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets', f), 'utf8'),
    dom.getInternalVMContext(), { filename: f });
});

var Store = w.Store, NPI = w.NPI, Report = w.Report, AC = w.NpiCore;

/* ------------------------------------------------------- фото-доказательства */

var PHOTO_DIR = path.join(OUT, 'photos');
var photos = {};      // id -> { dataUrl, w, h }
var photoFile = {};   // id -> имя файла
var PHOTO_DEFS = [
  ['ph-bridge', '01-solder-bridge.jpg', 1536, 1024],
  ['ph-barrel', '02-barrel-fill.jpg', 1536, 1024],
  ['ph-residue', '03-clean-residue.jpg', 1536, 1024],
  ['ph-board', '04-first-article.jpg', 1536, 1024],
  ['ph-coating', '05-coating-run.jpg', 1536, 1024]
];
PHOTO_DEFS.forEach(function (d) {
  var buf = fs.readFileSync(path.join(PHOTO_DIR, d[1]));
  photos[d[0]] = {
    dataUrl: 'data:image/jpeg;base64,' + buf.toString('base64'),
    w: d[2], h: d[3]
  };
  photoFile[d[0]] = d[1];
});

/* ------------------------------------------------------------- изделие */

var pid = Store.create({
  product: 'Плата управления ВЧ-модуля ВЧ-4412',
  pn: 'PCB-4412-B',
  rev: 'C',
  customer: 'АО «Ритм»',
  ipcClass: '3',
  alloy: 'SAC305',
  line: 'SMT-2',
  engineer: 'Технолог NPI',
  start: '2026-10-05',
  target: '2026-11-28'
});

var log = [];
function note(stepId, text, loc) {
  if (text) Store.setNote(pid, stepId, text);
  if (loc) Store.setLoc(pid, stepId, loc);
  log.push({ step: stepId, note: text || '', loc: loc || '' });
}

/* ------------------------------------------------- ответы на все шаги */

// Статус по умолчанию — ok. Ниже перечислены только исключения, и у каждого
// есть причина: неотвеченный шаг не даёт покрытия, отметка «не применимо»
// снимает шаг со знаменателя, а риск обязан быть подкреплён находкой.
var RISK = {
  'g4-04': 'мост пасты на U7',
  'g7-03': 'недостаточное заполнение отверстий на J1',
  'g8-01': 'высокая доля ложных вызовов AOI',
  'g10-02': 'унос конформного покрытия',
  'g10-03': 'следы флюса без объективных данных',
  'g11-06': 'находки опытной партии не все закрыты',
  'g12-03': 'открытая находка уровня B'
};
var NA = {
  'g6-06': 'азот не применяется: печь работает на воздухе, окно профиля достигнуто без него',
  'g7-04': 'селективная пайка не применяется: весь THT идёт на волне',
  'g8-05': 'Boundary Scan не применяется: в изделии нет ядра, граничное сканирование нецелесообразно'
};

// Замеры и заметки — то, что инженер пишет по ходу прохода.
var NOTES = {
  'g0-01': ['Ревизии сведены: чертёж C, BOM C, герберы C. Сверка по контрольной сумме набора.',
    'ведомость сверки ревизий, 1 л.'],
  'g0-06': ['MSL 3 у U7 и U9, MSL 2 у дискретных. План сушки 125 °C по таблице.',
    'план MSL, 2 стр.'],
  'g1-03': ['Мелкий шаг 0,4 мм (QFP-48) и 0,5 мм (BGA-64). Подтверждена возможность SMT-2.',
    'протокол проверки шага'],
  'g2-06': ['Отсчёт времени на воздухе с 08:00, сухой шкаф ≤5 % RH, запись по сменам.',
    'журнал сухого шкафа'],
  'g3-03': ['Отсчёт отработан на пробной партии: 30 деталей, ошибок нуля.',
    'акт тренировки'],
  'g3-04': ['Влажность 3,1–4,4 % RH за 14 смен, индикаторные карточки синие.',
    'журнал, 14 смен'],
  'g4-01': ['Уменьшение отверстия 1:0,92 от посадочного места. Правило зафиксировано.',
    'чертёж трафарета'],
  'g4-03': ['Пределы SPI выведены из Cpk 1,67 пробной серии, не назначены на глаз.',
    'отчёт SPI, 60 отпечатков'],
  'g4-04': ['Мост пасты между 3 и 4 выводами U7 на 6 платах из 30. Находка F1.',
    'SPI-скрин + фото'],
  'g5-05': ['Смещение U7 по X −0,018 мм, по Y +0,011 мм при допуске ±0,05 мм.',
    'замер, 10 плат'],
  'g6-02': ['Выдержка 92 с, подъём 2,1 °C/с. Огибающая соблюдена.',
    'профиль, 6 термопар'],
  'g6-03': ['Пик 241 °C при допустимых 245 °C для корпуса толщиной 2,1 мм.',
    'профиль, зона BGA'],
  'g6-04': ['Вторая сторона: пик 218 °C, детали нижней стороны выдерживают 230 °C. Циклов 2.',
    'профиль 2-й стороны'],
  'g7-02': ['Преднагрев 110 °C, конвейер 1,15 м/мин. Квалифицирован на 40 платах.',
    'протокол волны'],
  'g7-03': ['Заполнение отверстий J1 58 % при требовании 75 % для класса 3. Находка F2.',
    'микросрез + рентген'],
  'g8-01': ['Доля ложных вызовов 4,1 % при пороге 2 %. Находка F5.',
    'отчёт AOI, 3 смены'],
  'g8-02': ['Рентген по BGA-64: порог пустот 25 %, критерий записан.',
    'программа + эталоны'],
  'g10-01': ['Раскрой по канавкам, трещин в углах нет. Проверено на 40 платах.',
    'акт вскрытия'],
  'g10-02': ['Унос покрытия с корпуса Q1, оголена пара и одна площадка. Находка F4.',
    'фото + толщиномер'],
  'g10-03': ['Белый след флюса под C17. Объективных данных по чистоте нет. Находка F3.',
    'визуал + пробник'],
  'g10-04': ['Прогиб 0,41 % при допустимых 0,75 % для плат под SMT.',
    'замер, 12 плат'],
  'g11-02': ['Отчёт по 47 характеристикам, все в допуске кроме двух (см. F2, F4).',
    'отчёт первой партии'],
  'g11-04': ['Выход годных 91,4 %, 26 дефектов на 300 плат.',
    'журнал партии'],
  'g11-05': ['Cpk 1,42 по объёму печати, 1,61 по смещению установки.',
    'расчёт Cpk'],
  'g12-01': ['Cpk по критическим параметрам ≥1,33 подтверждён на 300 платах.',
    'сводка возможностей'],
  'g13-01': ['Усиленный контроль 30 дней: 100 % AOI + выборка рентгена.',
    'приказ по линии']
};

var stepsById = {};
NPI.gates.forEach(function (g) {
  (g.steps || []).forEach(function (s) { stepsById[s.id] = s; });
});

var answered = { ok: 0, risk: 0, na: 0 };
Object.keys(stepsById).forEach(function (id) {
  if (NA[id]) {
    Store.setStatus(pid, id, 'na');
    answered.na++;
    note(id, 'Не применимо: ' + NA[id]);
    return;
  }
  var isRisk = !!RISK[id];
  Store.setStatus(pid, id, isRisk ? 'risk' : 'ok');
  if (isRisk) answered.risk++;
  else answered.ok++;
  var n = NOTES[id];
  if (n) note(id, n[0], n[1]);
});

/* ----------------------------------------------------------- находки */

function finding(draft) {
  var f = Store.addFinding(pid, draft);
  if (!f) throw new Error('находка не добавилась: ' + draft.title);
  return f;
}

var F1 = finding({
  stepId: 'g4-04', gateId: 'g4',
  title: 'Мост пасты между выводами 3 и 4 на U7',
  desc: 'На 6 платах из 30 SPI показывает мост пасты в зазоре 0,4 мм. ' +
    'Выводы 3–4 QFP-48 U7 соединены пастой, ширина моста 0,06–0,09 мм.',
  sev: 'B', std: 'IPC-7525', clause: '§5.3',
  evidence: 'Скриншот SPI + микроснимок отпечатка + журнал 30 плат',
  photos: ['ph-bridge'],
  cause: 'Отверстие трафарета равно площадке по ширине, зазор 0,4 мм не ' +
    'удерживает разделение при текущем уменьшении 1:1.',
  containment: 'Печать остановлена, трафарет снят, партия перепечатана после ' +
    'корректировки.',
  action: 'Уменьшить отверстие до 1:0,92, ввести пределы SPI по зазору, ' +
    'добавить зазор в контрольную карту.',
  owner: 'Технолог SMT-2', due: '2026-10-19', status: 'closed',
  by: 'Технолог NPI'
});

var F2 = finding({
  stepId: 'g7-03', gateId: 'g7',
  title: 'Недостаточное заполнение отверстий на разъёме J1',
  desc: 'Микросрез 5 отверстий J1: заполнение 54–62 % при требовании 75 % ' +
    'для класса 3 по IPC-A-610. Вертикальное заполнение не достигнуто, ' +
    'в верхней трети барабана — незаполненная зона.',
  sev: 'B', std: 'IPC-A-610', clause: '§10.6.3',
  evidence: 'Микросрез 5 отверстий, рентген 30 плат, фото общего вида платы',
  photos: ['ph-barrel', 'ph-board'],
  cause: 'Преднагрев 110 °C не поднимает тепловую массу разъёма и платы до ' +
    'температы смачивания; паста в отверстии остывает раньше, чем ' +
    'поднимается волна.',
  containment: 'Партия остановлена на операции волновой пайки. Введён 100 % ' +
    'рентгеновский контроль J1 по уже пропаянным платам.',
  action: 'Переквалифицировать профиль волны: преднагрев до 125 °C, ' +
    'конвейер 1,05 м/мин. Повторный микросрез на 10 отверстиях.',
  owner: 'Технолог THT', due: '2026-11-14', status: 'open',
  by: 'Технолог NPI'
});

var F3 = finding({
  stepId: 'g10-03', gateId: 'g10',
  title: 'Следы флюса под C17 без объективных данных по чистоте',
  desc: 'После водной отмывки под корпусом C17 (0805, низкий стоячий корпус) ' +
    'виден белый налёт флюса. Данных ROSE или эквивалентного метода нет: ' +
    'требование к чистоте определено словесно, подтвердить его нечем.',
  sev: 'C', std: 'J-STD-001', clause: '§8.2',
  evidence: 'Микроснимок, результат пробника по умолчанию',
  photos: ['ph-residue'],
  cause: 'Отмывка не доведена: ополаскивание одним контуром, контроль ' +
    'чистоты словесный.',
  containment: 'Введён второй контур ополаскивания и проверка ' +
    'поверхностного сопротивления на 3 платах из лотка.',
  action: 'Определить требование к чистоте объективным методом и внести его ' +
    'в контрольную карту.',
  owner: 'Инженер по очистке', due: '2026-11-21', status: 'contained',
  by: 'Технолог NPI'
});

var F4 = finding({
  stepId: 'g10-02', gateId: 'g10',
  title: 'Унос конформного покрытия с корпуса Q1',
  desc: 'На 9 платах из 300 покрытие стекло с корпуса Q1 (SOT-23): оголены ' +
    'корпус и одна площадка, вдоль платы образовался валик. Толщина в ' +
    'валике 74 мкм при норме 25–50 мкм.',
  sev: 'C', std: 'IPC-CC-830', clause: '§3.4.2',
  evidence: 'Микроснимок, замер толщиномером по 12 точкам',
  photos: ['ph-coating'],
  cause: 'Маскирование Q1 не выдержало: клей подсох, покрытие нанесено при ' +
    'вязкости ниже рабочей.',
  containment: 'Партия рассортирована по виду, 9 плат отправлены на ' +
    'локальную переработку покрытия.',
  action: 'Заменить маскирующий клей, ввести контроль вязкости перед ' +
    'каждой партией.',
  owner: 'Технолог финишных операций', due: '2026-11-18', status: 'open',
  by: 'Технолог NPI'
});

var F5 = finding({
  stepId: 'g8-01', gateId: 'g8',
  title: 'Доля ложных вызовов AOI выше порога',
  desc: 'Первая версия программы AOI даёт 4,1 % ложных вызовов при ' +
    'согласованном пороге 2 %. Операторы теряют доверие к контролю.',
  sev: 'W', std: 'IPC-A-610', clause: '§5.2',
  evidence: 'Отчёт AOI за 3 смены, разбор 40 вызовов',
  photos: [],
  cause: 'Пороги яркости взяты с эталона другого изделия, освещение не ' +
    'подстроено под тёмную маску этой платы.',
  containment: 'Не требуется: вердикт не затронут.',
  action: 'Перенастроить освещение и пороги на этом изделии, пересчитать ' +
    'долю вызовов на 100 платах.',
  owner: 'Инженер AOI', due: '2026-11-25', status: 'open',
  by: 'Технолог NPI'
});

/* ------------------------------------------------------- проверки и отчёт */

var p = Store.get(pid);
var ex = AC.explainProject(p, NPI);
var cov = AC.computeCoverage(p, NPI);

console.log('Изделие:        ' + p.meta.product);
console.log('Обозначение:    ' + p.meta.pn + ' рев. ' + p.meta.rev);
console.log('Класс IPC:      ' + p.meta.ipcClass + ', сплав ' + p.meta.alloy +
  ', линия ' + p.meta.line);
console.log('Ответов:        ok ' + answered.ok + ', риск ' + answered.risk +
  ', не применимо ' + answered.na + ' (всего ' + cov.total + ')');
console.log('Покрытие:       ' + cov.percent + ' %');
console.log('Находок:        ' + p.findings.length + ' (открытых ' +
  AC.openFindings(p.findings).length + ')');
console.log('Вердикт:        ' + ex.verdict);
ex.reasons.forEach(function (r) { console.log('  • ' + r); });

/* ------------------------------------- перенос на другой компьютер (путь 2) */

/* В интерфейсе фото живут в IndexedDB, и exportState забирает их с собой.
 * Здесь фотографии загружаются тем же путём, каким их переносят: через
 * importJson документа экспорта. Так проверяется и обратимость переноса,
 * и то, что отчёт берёт фото из хранилища, а не изSide-списка. */
var transfer = {
  format: 'npi-checklist-project',
  version: 1,
  exported: '2026-11-02T10:00:00.000Z',
  checklistVersion: NPI.version,
  project: p,
  photos: PHOTO_DEFS.map(function (d) {
    return {
      id: d[0], name: d[1], type: 'image/jpeg', w: d[2], h: d[3],
      bytes: fs.statSync(path.join(PHOTO_DIR, d[1])).size,
      dataUrl: photos[d[0]].dataUrl
    };
  })
};

var pid2Final = null;
/* Две разные проверки на два разных документа, и путать их нельзя:
 * validateImport смотрит на документ СОСТОЯНИЯ ({ v, projects }), а
 * importJson — на документ ПЕРЕНОСА одного проекта ({ format, project,
 * photos }). Проект проверяем первым, конверт — вторым. */
var val = AC.validateImport({ v: 2, projects: { probe: transfer.project } });
if (!val.ok) {
  console.error('проект не прошёл проверку: ' + val.errors.join('; '));
  process.exit(1);
}
if (transfer.format !== 'npi-checklist-project' || transfer.version !== 1) {
  console.error('документ переноса имеет неожиданный формат');
  process.exit(1);
}
console.log('Перенос:        проект и конверт прошли проверку (' +
  transfer.photos.length + ' фото внутри)');

Store.importJson(JSON.stringify(transfer)).then(function (pid2) {
  pid2Final = pid2;
  var p2 = Store.get(pid2);
  var ex2 = AC.explainProject(p2, NPI);
  console.log('После импорта:  ' + pid2 + ', находок ' + p2.findings.length +
    ', вердикт ' + ex2.verdict);
  if (ex2.verdict !== ex.verdict) {
    console.error('  !! вердикт изменился после переноса');
    process.exit(1);
  }

  /* Фото читаем из хранилища — именно так это делает интерфейс. */
  return Store.photos().then(function (recs) {
    var storePhotos = {};
    recs.forEach(function (r) {
      storePhotos[r.id] = { dataUrl: r.dataUrl, w: r.w, h: r.h };
    });
    var missing = [];
    p2.findings.forEach(function (f) {
      (f.photos || []).forEach(function (id) {
        if (!storePhotos[id]) missing.push(id);
      });
    });
    if (missing.length) {
      console.error('  !! после переноса не хватает фото: ' + missing.join(', '));
      process.exit(1);
    }
    console.log('Фото в хранилище: ' + recs.length + ' записей, все ссылки живы');

    return Store.exportState(pid2).then(function (doc) {
      return { storePhotos: storePhotos, doc: doc };
    });
  });
}).then(function (r) {
  /* ------------------------------------------------------ сохраняем результат */

  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  var p2 = Store.get(pid2Final);
  var doc = Report.exportDocument(p2, NPI, {
    photos: r.storePhotos,
    now: new Date('2026-11-02T10:15:00Z')
  });
  fs.writeFileSync(path.join(OUT, 'report.html'), doc);
  fs.writeFileSync(path.join(OUT, 'project.json'), JSON.stringify(r.doc, null, 2));

  // Журнал прохода — что и почему отвечено.
  var walkLines = [];
  walkLines.push('# Журнал прохода чек-листа — ' + p2.meta.product);
  walkLines.push('');
  walkLines.push('Изделие: ' + p2.meta.pn + ', ревизия ' + p2.meta.rev +
    ', класс IPC ' + p2.meta.ipcClass + '.');
  walkLines.push('Вердикт по итогам прохода: **' + ex.verdict + '**.');
  walkLines.push('');
  walkLines.push('Данные вымышленные: это демонстрация механики инструмента, ' +
    'а не аудит реального производства.');
  walkLines.push('');
  var items = AC.normalizeChecklist(NPI).items;
  NPI.gates.forEach(function (g) {
    var gs = AC.gateState(p2, g.id, items, p2.findings);
    walkLines.push('## ' + g.id.toUpperCase() + ' — ' + g.name +
      '  [' + gs.verdict + ']');
    walkLines.push('');
    g.steps.forEach(function (s) {
      var st = p2.st[s.id] || '';
      var mark = st === 'ok' ? '✓' : (st === 'risk' ? '!' : (st === 'na' ? '—' : '·'));
      var rec = log.filter(function (l) { return l.step === s.id; })[0];
      walkLines.push('- ' + mark + ' **' + s.id + '** [' + s.s + '] ' + s.t);
      if (rec && rec.note) {
        walkLines.push('  - ' + (st === 'risk' ? 'Риск: ' : '') + rec.note);
      }
      if (rec && rec.loc) walkLines.push('  - Доказательство: ' + rec.loc);
    });
    walkLines.push('');
  });
  walkLines.push('## Находки');
  walkLines.push('');
  p2.findings.forEach(function (f) {
    walkLines.push('### ' + f.id + ' — ' + f.title + '  [' + f.sev + '/' + f.status + ']');
    walkLines.push('');
    walkLines.push('- Шаг: ' + f.stepId + ' (' + f.gateId + ')');
    if (f.std) walkLines.push('- Норма: ' + f.std + ' ' + (f.clause || ''));
    walkLines.push('- Что наблюдаем: ' + f.desc);
    walkLines.push('- Причина: ' + f.cause);
    walkLines.push('- Содержание: ' + f.containment);
    walkLines.push('- Действие: ' + f.action);
    walkLines.push('- Владелец: ' + f.owner + ', срок ' + f.due);
    (f.photos || []).forEach(function (ph, i) {
      walkLines.push('- Фото ' + (i + 1) + ': `demo/photos/' + photoFile[ph] + '`');
    });
    walkLines.push('');
  });
  fs.writeFileSync(path.join(OUT, 'WALKTHROUGH.md'), walkLines.join('\n'));

  var plateCount = (doc.match(/class="plate"/g) || []).length;
  console.log('');
  console.log('Отчёт:          demo/report.html (' + Math.round(doc.length / 1024) +
    ' КБ, фото-плиток ' + plateCount + ')');
  console.log('Проект:         demo/project.json (' +
    Math.round(fs.statSync(path.join(OUT, 'project.json')).size / 1024) + ' КБ)');
  console.log('Журнал:         demo/WALKTHROUGH.md');

  /* Проход по маршрутам интерфейса — убедимся, что все экраны живые. */
  var routes = ['#/', '#/p/' + pid2Final, '#/p/' + pid2Final + '/g/g0',
    '#/p/' + pid2Final + '/g/g7', '#/p/' + pid2Final + '/findings',
    '#/p/' + pid2Final + '/report', '#/p/' + pid2Final + '/settings', '#/help'];
  var broken = [];
  routes.forEach(function (h) {
    w.location.hash = h;
    w.dispatchEvent(new w.Event('hashchange'));
    var t = w.document.getElementById('app').innerHTML;
    if (t.indexOf('Ошибка отображения') !== -1 || t.length < 200) broken.push(h);
  });
  console.log('Маршруты:       ' + (broken.length ? 'СЛОМАНЫ ' + broken.join(', ')
    : 'все ' + routes.length + ' экранов строятся без ошибок'));
  process.exit(broken.length ? 1 : 0);
}, function (e) {
  console.error('сбой переноса: ' + (e && e.message));
  process.exit(1);
});
