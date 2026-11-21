/* =========================================================================
 * NPI Checklist — assets/app.js
 *
 * Слой интерфейса. CLASSIC SCRIPT ONLY (не ES-модуль): работает с file://
 * и через serve.js. Зависит от глобальных NPI, NpiCore, Report, Store, Llm.
 *
 * Правила безопасности (как в аудиторе и в курсе):
 *   - каждая динамическая строка проходит через esc() перед innerHTML;
 *   - никаких инлайновых обработчиков (CSP serve.js их запрещает) — только
 *     addEventListener и делегирование;
 *   - вердикт, серьёзность, покрытие и блокировка гейтов считает NpiCore.
 *     Этот файл их только отображает.
 *
 * Правило работы с моделью: Llm возвращает ЧЕРНОВИК. Черновик попадает в
 * редактируемое поле. Молча применить его нельзя — для этого нет кода.
 * ========================================================================= */
(function () {
  'use strict';

  var AC = window.NpiCore;
  var Report = window.Report;
  var Store = window.Store;
  var Llm = window.Llm;
  var NPI = window.NPI;
  var app = document.getElementById('app');
  var llmState = document.getElementById('llm-state');

  if (!AC || !NPI) {
    if (app) app.innerHTML = '<div class="panel"><h1>Не загрузились данные</h1>' +
      '<p>Проверьте, что файлы <code>assets/data.js</code> и ' +
      '<code>assets/npi-core.js</code> лежат рядом с <code>index.html</code>.</p></div>';
    return;
  }

  /* ------------------------------------------------------------------- esc */

  var ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ESC_MAP[c]; });
  }
  function dash(v) { var s = (v == null ? '' : String(v)).trim(); return s ? esc(s) : '—'; }
  function fmtBytes(n) { return Store.pure.fmtBytes(n); }
  function fmtTs(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    if (isNaN(d.getTime())) return '—';
    function p(n) { return n < 10 ? '0' + n : String(n); }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
      ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  /* --------------------------------------------------------- индекс данных */

  var GATE_NAMES = Report.GATE_NAMES;
  var SEV_LABEL = Report.SEV_LABEL;
  var FINDING_STATUS_LABEL = Report.FINDING_STATUS_LABEL;
  var GV_LABEL = Report.GV_LABEL;

  var GATES = NPI.gates;
  var STEPS_BY_ID = {};
  (function () {
    for (var i = 0; i < GATES.length; i++) {
      var steps = GATES[i].steps || [];
      for (var j = 0; j < steps.length; j++) STEPS_BY_ID[steps[j].id] = steps[j];
    }
  })();
  var GATE_BY_ID = {};
  GATES.forEach(function (g) { GATE_BY_ID[g.id] = g; });

  function gateName(gid) { return GATE_NAMES[gid] || gid; }
  function gateShort(gid) { return gid; }

  function critFor(item, cls) {
    var c = (item && item.crit) || {};
    if (c[cls] != null && c[cls] !== '') return c[cls];
    if (c['2'] != null) return c['2'] + ' (показан критерий класса 2 — критерия класса ' + cls + ' в чек-листе нет)';
    if (c['3'] != null) return c['3'] + ' (показан критерий класса 3 — критерия класса ' + cls + ' в чек-листе нет)';
    return '—';
  }

  function stepCount(gid) {
    var g = GATE_BY_ID[gid];
    return g && g.steps ? g.steps.length : 0;
  }

  /* ---------------------------------------------------------------- роутер */

  var route = { view: 'list' };

  function safeDecode(s) { try { return decodeURIComponent(s); } catch (e) { return s; } }

  function parseHash() {
    var h = window.location.hash || '#/';
    if (h === '#/' || h === '#' || h === '') return { view: 'list' };
    var m;
    if ((m = /^#\/help\/?$/.exec(h))) return { view: 'help' };
    if ((m = /^#\/p\/([^/]+)\/g\/([^/]+)\/?$/.exec(h))) {
      return { view: 'gate', id: safeDecode(m[1]), gid: safeDecode(m[2]) };
    }
    if ((m = /^#\/p\/([^/]+)\/findings\/?$/.exec(h))) {
      return { view: 'findings', id: safeDecode(m[1]) };
    }
    if ((m = /^#\/p\/([^/]+)\/report\/?$/.exec(h))) {
      return { view: 'report', id: safeDecode(m[1]) };
    }
    if ((m = /^#\/p\/([^/]+)\/settings\/?$/.exec(h))) {
      return { view: 'settings', id: safeDecode(m[1]) };
    }
    if ((m = /^#\/p\/([^/]+)\/?$/.exec(h))) {
      return { view: 'project', id: safeDecode(m[1]) };
    }
    return { view: 'notfound', hash: h };
  }

  function notFound(title, detail) {
    return '<div class="panel"><h1>' + esc(title) + '</h1><p>' + esc(detail) + '</p>' +
      '<p><a class="btn" href="#/">← К списку изделий</a></p></div>';
  }

  /* ------------------------------------------------------- хранилище: обёртки */

  Store.init();

  function state() { return Store.state(); }
  function proj() { return Store.get(route.id) || Store.get(Store.activeId()); }
  function pid() { return proj() ? (proj().__pid || route.id) : null; }

  function activeProject() {
    var p = Store.get(route.id);
    if (p) return p;
    var aid = Store.activeId();
    return aid ? Store.get(aid) : null;
  }

  /* ===================================================================== *
   * ПРЕДСТАВЛЕНИЕ: список изделий
   * ===================================================================== */

  function renderList() {
    var ids = Store.list();
    var html = '<div class="row row--between" style="margin-bottom:18px">' +
      '<div><h1 style="margin:0">Изделия в проходе NPI</h1>' +
      '<p class="muted" style="margin:4px 0 0">Чек-лист ' + esc(NPI.version) +
      ' · ' + esc(GATES.length) + ' гейтов · ' + esc(countSteps()) + ' шагов</p></div>' +
      '<div class="row">' +
      '<button class="btn" data-act="import" type="button">Импорт проекта</button>' +
      '<button class="btn btn--primary" data-act="new" type="button">+ Новое изделие</button>' +
      '</div></div>';

    if (Store.corruptNotice()) {
      html += '<div class="banner banner--warn" role="status">Сохранённое состояние ' +
        'не прочитано и было отложено в сторону: ' + esc(Store.corruptNotice()) +
        ' Начато новое рабочее пространство.</div>';
    }
    if (Store.storageWarning()) {
      html += '<div class="banner banner--warn" role="status">Хранилище браузера недоступно ' +
        '(приватный режим или ограничения файлового доступа). Изменения живут только ' +
        'в памяти этой вкладки и пропадут при закрытии. Сохраняйте отчётом.</div>';
    }
    if (Store.inlineMode()) {
      html += '<div class="banner banner--info" role="status">IndexedDB недоступен ' +
        '(открыто через <code>file://</code>). Фото-доказательства хранятся внутри ' +
        'состояния в уменьшенном виде. Запустите <code>node serve.js</code>, чтобы ' +
        'фото лежали в отдельном хранилище.</div>';
    }

    if (!ids.length) {
      html += '<div class="empty-state"><h2>Изделий пока нет</h2>' +
        '<p>Создайте первое — откроется входной пакет данных, и проход пойдёт ' +
        'по гейтам от начала и до выпуска в серию.</p>' +
        '<p><button class="btn btn--primary" data-act="new" type="button">Создать первое изделие</button></p></div>';
      return html;
    }

    html += '<div class="grid grid--3">';
    ids.forEach(function (id) {
      var p = Store.get(id);
      var ex = AC.explainProject(p, NPI);
      var open = ex.openFindings.length;
      var vcls = ex.verdict === AC.VERDICT.READY ? 'chip--ok'
        : ex.verdict === AC.VERDICT.CONDITIONAL ? 'chip--warn'
        : ex.verdict === AC.VERDICT.NOT_RELEASED ? 'chip--risk' : '';
      html += '<a class="proj-card" href="#/p/' + encodeURIComponent(id) + '">' +
        '<h3>' + dash(p.meta.product || 'Без названия') + '</h3>' +
        '<div class="pc-meta">' + dash(p.meta.pn) + ' · рев. ' + dash(p.meta.rev) +
        ' · класс ' + dash(p.meta.ipcClass) + '</div>' +
        '<div class="pc-foot">' +
        '<span class="chip ' + vcls + '">' + esc(ex.verdict) + '</span>' +
        '<span class="chip">покрытие ' + esc(ex.coverage.percent) + ' %</span>' +
        '<span class="chip">находок: ' + esc(p.findings.length) +
        (open ? ' (' + esc(open) + ' откр.)' : '') + '</span>' +
        '</div></a>';
    });
    return html + '</div>';
  }

  function countSteps() {
    var n = 0;
    GATES.forEach(function (g) { n += (g.steps || []).length; });
    return n;
  }

  /* ===================================================================== *
   * ПРЕДСТАВЛЕНИЕ: проект — обзор
   * ===================================================================== */

  function renderProject() {
    var p = activeProject();
    if (!p) return notFound('Изделие не найдено', 'Возможно, оно было удалено в другой вкладке.');
    var ex = AC.explainProject(p, NPI);
    var cls = String(p.meta.ipcClass || '3');
    var html = projectTabs(p, 'overview');

    html += '<div class="panel"><div class="row row--between">' +
      '<div><h1 style="margin:0">' + dash(p.meta.product || 'Без названия') + '</h1>' +
      '<div class="muted mono" style="font-size:.8rem;margin-top:4px">' +
      dash(p.meta.pn) + ' · рев. ' + dash(p.meta.rev) + ' · заказчик ' + dash(p.meta.customer) +
      ' · класс ' + esc(cls) + ' · ' + dash(p.meta.alloy) + ' · линия ' + dash(p.meta.line) +
      ' · инженер ' + dash(p.meta.engineer) + '</div></div>' +
      '<div class="row">' +
      '<a class="btn" href="#/p/' + encodeURIComponent(route.id) + '/settings">Реквизиты</a> ' +
      '<button class="btn" data-act="dup" type="button">Дублировать</button> ' +
      '<button class="btn btn--danger" data-act="del" type="button">Удалить</button>' +
      '</div></div></div>';

    html += verdictPanel(ex);

    // Следующий шаг — то, с чего продолжается работа после перерыва.
    var next = nextOpenStep(p);
    if (next) {
      html += '<div class="banner banner--info" role="status">' +
        '<b>Продолжить с:</b> ' + esc(next.gid) + ' · ' + esc(next.id) + ' — ' +
        esc(next.t) + ' <a href="#/p/' + encodeURIComponent(route.id) + '/g/' +
        encodeURIComponent(next.gid) + '">перейти к гейту →</a></div>';
    } else if (ex.verdict === AC.VERDICT.READY) {
      html += '<div class="banner banner--info" role="status">Все применимые шаги отвечены, ' +
        'открытых находок нет. Следующий шаг — сформировать отчёт и получить подписи.</div>';
    }

    html += '<div class="grid grid--side">';
    html += '<div class="panel"><h2>Состояние гейтов</h2>' + gateTable(ex) + '</div>';

    html += '<div class="panel"><h2>Находки</h2>';
    if (!p.findings.length) {
      html += '<p class="muted">Находок нет. Зафиксируйте первую из шага гейта — ' +
        'с фото, измерением и корректирующим действием.</p>';
    } else {
      var open = ex.openFindings;
      html += '<div class="kv"><dt>Всего</dt><dd>' + esc(p.findings.length) + '</dd>' +
        '<dt>Открытых</dt><dd>' + esc(open.length) + '</dd>' +
        '<dt>Уровня B</dt><dd>' + esc(ex.openB.length) + '</dd>' +
        '<dt>Уровня C</dt><dd>' + esc(ex.openC.length) + '</dd>' +
        '<dt>Уровня W</dt><dd>' + esc(ex.openW.length) + '</dd></div>';
    }
    html += '<p style="margin-top:12px"><a class="btn" href="#/p/' + encodeURIComponent(route.id) +
      '/findings">Открыть реестр находок →</a></p></div>';
    html += '</div>';

    html += '<div class="panel"><h2>Как пройти чек-лист</h2>' +
      '<p>Гейты идут строго по порядку: следующий открывается, когда закрыт предыдущий. ' +
      'Гейт закрыт, когда на все его применимые шаги дан ответ и нет открытых находок.</p>' +
      gateRail(p, ex) + '</div>';

    return html;
  }

  function verdictPanel(ex) {
    var v = ex.verdict;
    var cls = v === AC.VERDICT.READY ? 'vb--ok'
      : v === AC.VERDICT.CONDITIONAL ? 'vb--warn'
      : v === AC.VERDICT.NOT_RELEASED ? 'vb--risk' : 'vb--muted';
    var html = '<section class="verdict-banner ' + cls + '" aria-label="Итоговый вердикт">' +
      '<div class="verdict-row">' +
      '<span class="verdict-badge vb-badge--' + cls.slice(3) + '">' + esc(v) + '</span>' +
      '<span class="coverage-line">покрытие ' + esc(ex.coverage.percent) + ' % (' +
      esc(ex.coverage.answered) + ' из ' + esc(ex.coverage.total) + ' применимых шагов)' +
      ' · порог ' + esc(ex.threshold) + ' %</span>' +
      '</div>';
    if (ex.reasons.length) {
      html += '<p class="verdict-why">На основании:</p><ul class="reasons">';
      for (var i = 0; i < ex.reasons.length; i++) html += '<li>' + esc(ex.reasons[i]) + '</li>';
    } else {
      html += '<p class="reasons-empty">Блокирующих оснований нет.</p>';
    }
    html += '<p class="verdict-rule">Вердикт считает программа по фиксированному правилу: ' +
      'открытая находка уровня B или риск на шаге уровня B — «' + esc(AC.VERDICT.NOT_RELEASED) +
      '»; открытая находка уровня C или риск на шаге уровня C — «' + esc(AC.VERDICT.CONDITIONAL) +
      '»; покрытие ниже порога — «' + esc(AC.VERDICT.IN_PROGRESS) + '»; иначе — «' +
      esc(AC.VERDICT.READY) + '». Риск с неопределённой серьёзностью трактуется как уровень C.</p>';
    return html + '</section>';
  }

  function gateTable(ex) {
    var html = '<table class="table gate-summary"><caption class="sr-only">Состояние гейтов</caption>' +
      '<thead><tr><th scope="col">Гейт</th><th scope="col">Шаги</th>' +
      '<th scope="col">Открытых находок</th><th scope="col">Состояние</th></tr></thead><tbody>';
    ex.gates.forEach(function (g) {
      var c = g.verdict === 'пройден' ? 'is-ok'
        : g.verdict === 'условно пройден' ? 'is-warn'
        : g.verdict === 'не пройден' || g.verdict === 'заблокирован' ? 'is-risk'
        : g.verdict === 'не применим' ? 'is-muted' : '';
      html += '<tr class="' + c + '">' +
        '<th scope="row"><a href="#/p/' + encodeURIComponent(route.id) + '/g/' +
        encodeURIComponent(g.id) + '">' + esc(gateName(g.id)) + '</a> ' +
        '<span class="muted mono">(' + esc(g.id) + ')</span></th>' +
        '<td>' + esc(g.answered) + ' / ' + esc(g.total) + '</td>' +
        '<td>' + (g.open.length ? esc(g.open.length) : '—') + '</td>' +
        '<td><span class="gs-badge">' + esc(GV_LABEL[g.verdict] || g.verdict) + '</span></td>' +
        '</tr>';
    });
    return html + '</tbody></table>';
  }

  function gateRail(p, ex) {
    var byId = {};
    ex.gates.forEach(function (g) { byId[g.id] = g; });
    var html = '<div class="gate-rail">';
    GATES.forEach(function (g) {
      var st = byId[g.id] || {};
      var na = !!(p.gateNA && p.gateNA[g.id]);
      var scls = na ? 's-na'
        : st.verdict === 'пройден' ? 's-ok'
        : st.verdict === 'условно пройден' ? 's-warn'
        : st.verdict === 'не пройден' || st.verdict === 'заблокирован' ? 's-risk'
        : 's-open';
      var cur = route.view === 'gate' && route.gid === g.id;
      html += '<a class="gate-rail-item' + (cur ? ' is-current' : '') +
        (st.blocked ? ' is-blocked' : '') + (na ? ' is-na' : '') +
        '" href="#/p/' + encodeURIComponent(route.id) + '/g/' + encodeURIComponent(g.id) + '">' +
        '<span class="gate-num">' + esc(g.id.toUpperCase()) + '</span>' +
        '<span>' + esc(gateName(g.id)) + '</span>' +
        '<span class="gate-rail-state ' + scls + '">' +
        (na ? 'не применим' : esc(GV_LABEL[st.verdict] || st.verdict || 'открыт')) +
        '</span></a>';
    });
    return html + '</div>';
  }

  function nextOpenStep(p) {
    var gateNA = p.gateNA || {};
    for (var i = 0; i < GATES.length; i++) {
      var g = GATES[i];
      if (gateNA[g.id]) continue;
      var steps = g.steps || [];
      for (var j = 0; j < steps.length; j++) {
        if (!AC.isStatus(p.st[steps[j].id])) {
          return { gid: g.id, id: steps[j].id, t: steps[j].t };
        }
      }
    }
    return null;
  }

  function projectTabs(p, current) {
    var id = encodeURIComponent(route.id);
    function tab(key, label, href) {
      var on = current === key;
      return '<a class="btn' + (on ? ' btn--primary' : '') + '" href="' + href + '">' +
        esc(label) + '</a>';
    }
    return '<nav class="row" style="margin-bottom:18px" aria-label="Разделы изделия">' +
      tab('overview', 'Обзор', '#/p/' + id) +
      tab('gate', 'Проход по гейтам', '#/p/' + id + '/g/' + encodeURIComponent(firstOpenGate(p))) +
      tab('findings', 'Находки (' + esc(p.findings.length) + ')', '#/p/' + id + '/findings') +
      tab('report', 'Отчёт', '#/p/' + id + '/report') +
      tab('settings', 'Настройки', '#/p/' + id + '/settings') +
      '</nav>';
  }

  function firstOpenGate(p) {
    var ex = AC.explainProject(p, NPI);
    for (var i = 0; i < ex.gates.length; i++) {
      if (ex.gates[i].verdict !== 'пройден' && ex.gates[i].verdict !== 'не применим') {
        return ex.gates[i].id;
      }
    }
    return GATES[0].id;
  }

  /* ===================================================================== *
   * ПРЕДСТАВЛЕНИЕ: гейт — пошаговый проход
   * ===================================================================== */

  function renderGate() {
    var p = activeProject();
    if (!p) return notFound('Изделие не найдено', '');
    var gid = route.gid;
    var g = GATE_BY_ID[gid];
    if (!g) return notFound('Гейт не найден', 'Гейт «' + gid + '» отсутствует в чек-листе.');

    var ex = AC.explainProject(p, NPI);
    var gs = null;
    ex.gates.forEach(function (x) { if (x.id === gid) gs = x; });
    var cls = String(p.meta.ipcClass || '3');
    var na = !!(p.gateNA && p.gateNA[gid]);

    var html = projectTabs(p, 'gate');
    html += '<div class="panel">' +
      '<div class="row row--between">' +
      '<div><h1 style="margin:0">' + esc(gateName(gid)) + ' <span class="muted mono">(' + esc(gid) + ')</span></h1>' +
      '<p class="muted" style="margin:6px 0 0;max-width:70ch">' + esc(g.t || '') + '</p></div>' +
      '<div class="row">' +
      '<span class="chip">шагов ' + esc((g.steps || []).length) + '</span>' +
      (gs ? '<span class="chip">отвечено ' + esc(gs.answered) + ' / ' + esc(gs.total) + '</span>' : '') +
      (gs && gs.open.length ? '<span class="chip chip--risk">открытых находок ' + esc(gs.open.length) + '</span>' : '') +
      '</div></div>';

    if (gs && gs.blocked) {
      html += '<div class="banner banner--warn" role="status">Гейт заблокирован: предыдущий ' +
        'не закрыт. Пройдите его — и этот откроется. Блокировка снимается только ' +
        'закрытием предыдущего гейта, а не отметкой «не применим» на этом.</div>';
    }

    html += '<div class="row" style="margin-top:14px">' +
      gateNav(gid, p) +
      '<button class="btn' + (na ? ' btn--primary' : '') + '" data-act="gate-na" data-gid="' +
      esc(gid) + '" type="button">' + (na ? 'Гейт применим' : 'Гейт не применим') + '</button>' +
      '</div></div>';

    var steps = g.steps || [];
    for (var i = 0; i < steps.length; i++) {
      html += stepHtml(p, gid, steps[i], cls, na);
    }
    return html;
  }

  function gateNav(gid, p) {
    var idx = -1;
    for (var i = 0; i < GATES.length; i++) if (GATES[i].id === gid) idx = i;
    var out = '';
    if (idx > 0) {
      out += '<a class="btn" href="#/p/' + encodeURIComponent(route.id) + '/g/' +
        encodeURIComponent(GATES[idx - 1].id) + '">← ' + esc(gateShort(GATES[idx - 1].id)) + '</a> ';
    } else {
      out += '<a class="btn" href="#/p/' + encodeURIComponent(route.id) + '">← Обзор</a> ';
    }
    out += '<a class="btn" href="#/p/' + encodeURIComponent(route.id) + '/g/' +
      encodeURIComponent(gid) + '">Обновить</a> ';
    if (idx < GATES.length - 1) {
      out += '<a class="btn" href="#/p/' + encodeURIComponent(route.id) + '/g/' +
        encodeURIComponent(GATES[idx + 1].id) + '">' + esc(gateShort(GATES[idx + 1].id)) + ' →</a>';
    }
    return out;
  }

  function stepHtml(p, gid, step, cls, gateNA) {
    var key = step.id;
    var st = p.st[key];
    var note = p.note[key] || '';
    var loc = p.loc[key] || '';
    var findings = p.findings.filter(function (f) { return f.stepId === key; });
    var open = findings.filter(function (f) { return f.status !== 'closed'; });

    var cls2 = gateNA ? 'is-na'
      : st === 'ok' ? 'is-ok'
      : st === 'risk' ? 'is-risk'
      : st === 'na' ? 'is-na'
      : 'is-unanswered';

    var html = '<article class="step ' + cls2 + '" data-step="' + esc(key) + '">' +
      '<div class="step-head">' +
      '<span class="step-id">' + esc(key) + '</span>' +
      '<span class="step-title">' + esc(step.t) + '</span>' +
      (step.s ? '<span class="sev sev--' + esc(step.s) + '" title="' + esc(SEV_LABEL[step.s]) + '">' +
        esc(step.s) + '</span>' : '') +
      '</div>';

    if (step.how) html += '<p class="step-how"><b>Как проверять:</b> ' + esc(step.how) + '</p>';

    html += '<div class="step-crit"><span class="crit-label">Критерий приёмки · класс ' +
      esc(cls) + '</span>' + esc(critFor(step, cls)) + '</div>';

    html += '<div class="step-chips">';
    if (step.owner) html += '<span class="chip">исполнитель: ' + esc(NPI.roles[step.owner] || step.owner) + '</span>';
    if (step.std) html += '<span class="chip chip--teal">норма: ' + esc(step.std) + '</span>';
    if (step.ev) html += '<span class="chip">доказательство: ' + esc(NPI.evidence[step.ev] || step.ev) + '</span>';
    if (step.v !== 1 && step.std) {
      html += '<span class="chip chip--unreviewed" title="Числовой критерий не сверялся с первоисточником">не сверено</span>';
    }
    if (open.length) {
      html += '<span class="chip chip--risk">открытых находок: ' + esc(open.length) + '</span>';
    }
    html += '</div>';

    // Статус — три взаимоисключающих варианта. Отсутствие ответа ≠ OK.
    html += '<div class="step-actions">' +
      '<div><span class="muted" style="font-size:.72rem;display:block;margin-bottom:4px">Статус</span>' +
      '<div class="btn-group status-pick" role="group" aria-label="Статус шага">' +
      pickBtn(key, 'ok', 'Соответствует', st, gateNA) +
      pickBtn(key, 'risk', 'Риск', st, gateNA) +
      pickBtn(key, 'na', 'Не применим', st, gateNA) +
      '</div></div>' +
      '<label class="field"><span>Замечание / что сделано</span>' +
      '<textarea data-note="' + esc(key) + '" placeholder="Что проверено, чем, на какой выборке">' +
      esc(note) + '</textarea></label>' +
      '<label class="field"><span>Измеренное значение / место</span>' +
      '<input type="text" data-loc="' + esc(key) + '" value="' + esc(loc) + '" placeholder="28 Н/см · трафарет 0.12 мм">' +
      '</label>' +
      '<button class="btn" data-act="finding" data-step="' + esc(key) + '" type="button"' +
      (gateNA ? ' aria-disabled="true" disabled' : '') + '>+ Находка</button>' +
      '</div>';

    if (findings.length) {
      html += '<div class="muted" style="font-size:.76rem;margin-top:8px">Находки по шагу: ' +
        findings.map(function (f) {
          return '<a href="#/p/' + encodeURIComponent(route.id) + '/findings#' + esc(f.id) + '">' +
            esc(f.id) + '</a>';
        }).join(', ') + '</div>';
    }

    if (step.f && step.f.length) {
      html += '<details class="step-fails"><summary>Типовые способы сломаться (' +
        esc(step.f.length) + ')</summary><ul>' +
        step.f.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') +
        '</ul></details>';
    }

    return html + '</article>';
  }

  function pickBtn(key, val, label, current, disabled) {
    var on = current === val;
    return '<button type="button" data-status="' + esc(key) + '" data-val="' + esc(val) + '"' +
      ' aria-pressed="' + (on ? 'true' : 'false') + '"' +
      (disabled ? ' aria-disabled="true" disabled' : '') + '>' + esc(label) + '</button>';
  }

  /* ===================================================================== *
   * ПРЕДСТАВЛЕНИЕ: реестр находок
   * ===================================================================== */

  function renderFindings() {
    var p = activeProject();
    if (!p) return notFound('Изделие не найдено', '');
    var html = projectTabs(p, 'findings');
    html += '<div class="panel"><div class="row row--between">' +
      '<div><h1 style="margin:0">Реестр находок</h1>' +
      '<p class="muted" style="margin:4px 0 0">Каждая находка привязана к шагу чек-листа ' +
      'и несёт фото-доказательства, причину, локализацию и корректирующее действие.</p></div>' +
      '<button class="btn btn--primary" data-act="finding" type="button">+ Новая находка</button>' +
      '</div></div>';

    if (!p.findings.length) {
      html += '<div class="empty-state"><h2>Находок нет</h2>' +
        '<p>Зафиксируйте находку из шага гейта — кнопка «+ Находка» в проходе.</p></div>';
      return html;
    }

    var order = { B: 0, C: 1, W: 2, N: 3 };
    var sorted = p.findings.slice().sort(function (a, b) {
      if (order[a.sev] !== order[b.sev]) return order[a.sev] - order[b.sev];
      var sa = a.status === 'open' ? 0 : a.status === 'contained' ? 1 : 2;
      var sb = b.status === 'open' ? 0 : b.status === 'contained' ? 1 : 2;
      if (sa !== sb) return sa - sb;
      return (b.ts || 0) - (a.ts || 0);
    });

    sorted.forEach(function (f) { html += findingCard(p, f); });
    return html;
  }

  function findingCard(p, f) {
    var step = STEPS_BY_ID[f.stepId];
    var photos = f.photos || [];
    var html = '<article class="finding-card sev-' + esc(f.sev) + '" id="' + esc(f.id) + '">' +
      '<div class="finding-head">' +
      '<span class="finding-num">' + esc(f.id) + '</span>' +
      '<h4>' + esc(f.title || 'Без названия') + '</h4>' +
      '<span class="sev sev--' + esc(f.sev) + '" title="' + esc(SEV_LABEL[f.sev]) + '">' +
      esc(f.sev) + '</span>' +
      '<span class="fstatus ' + esc(f.status) + '">' + esc(FINDING_STATUS_LABEL[f.status]) + '</span>' +
      '</div>' +
      '<div class="muted mono" style="font-size:.75rem">шаг ' + esc(f.stepId) +
      ' · ' + esc(gateName(f.gateId)) + ' · записал ' + dash(f.by) + ' ' + esc(fmtTs(f.ts)) + '</div>' +
      '<dl class="finding-fields">' +
      dlRow('Что наблюдается', f.desc) +
      dlRow('Нормативный документ', (f.std ? f.std : '') + (f.clause ? ', ' + f.clause : '')) +
      dlRow('Доказательство', f.evidence) +
      dlRow('Причина', f.cause) +
      dlRow('Локализация', f.containment) +
      dlRow('Корректирующее действие', f.action) +
      dlRow('Владелец', f.owner) +
      dlRow('Срок', f.due) +
      '</dl>';

    html += '<div class="plates" data-plates="' + esc(f.id) + '">' +
      (photos.length ? '' : '<p class="muted" style="font-size:.8rem;margin:0">Фото-доказательств нет.</p>') +
      '</div>';

    html += '<div class="row" style="margin-top:12px">' +
      '<button class="btn btn--sm" data-act="fedit" data-fid="' + esc(f.id) + '" type="button">Изменить</button> ' +
      '<button class="btn btn--sm" data-act="fstatus" data-fid="' + esc(f.id) +
      '" data-val="open" type="button" aria-pressed="' + (f.status === 'open') + '">Открыта</button> ' +
      '<button class="btn btn--sm" data-act="fstatus" data-fid="' + esc(f.id) +
      '" data-val="contained" type="button" aria-pressed="' + (f.status === 'contained') + '">Локализована</button> ' +
      '<button class="btn btn--sm" data-act="fstatus" data-fid="' + esc(f.id) +
      '" data-val="closed" type="button" aria-pressed="' + (f.status === 'closed') + '">Закрыта</button> ' +
      '<button class="btn btn--sm btn--danger" data-act="fdel" data-fid="' + esc(f.id) +
      '" type="button">Удалить</button>' +
      '</div>';
    return html + '</article>';
  }

  function dlRow(label, value) {
    return '<dt>' + esc(label) + '</dt><dd>' + dash(value) + '</dd>';
  }

  /* ===================================================================== *
   * ПРЕДСТАВЛЕНИЕ: настройки (реквизиты изделия + связь с моделью)
   * ===================================================================== */

  function renderSettings() {
    var p = activeProject();
    if (!p) return notFound('Изделие не найдено', '');
    var m = p.meta;
    var html = projectTabs(p, 'settings');

    html += '<div class="grid grid--2">';

    html += '<div class="panel"><h2>Реквизиты изделия</h2>' +
      '<p class="muted" style="font-size:.82rem">Эти поля попадают в отчёт. ' +
      'Пустые поля отчёт покажет как прочерк — заполните до формирования.</p>' +
      '<div class="stack" style="margin-top:12px">' +
      textField('product', 'Наименование изделия', m.product, 'Плата управления ВЧ-модуля') +
      textField('pn', 'Обозначение (PN)', m.pn, 'PCB-4412-B') +
      textField('rev', 'Ревизия', m.rev, 'C') +
      textField('customer', 'Заказчик', m.customer, '') +
      '<label class="field"><span>Класс IPC</span>' +
      '<select data-meta="ipcClass">' +
      ['1', '2', '3'].map(function (c) {
        return '<option value="' + c + '"' + (String(m.ipcClass) === c ? ' selected' : '') +
          '>Класс ' + c + '</option>';
      }).join('') + '</select></label>' +
      textField('alloy', 'Припой', m.alloy, 'SAC305') +
      textField('line', 'Линия', m.line, 'SMT-2') +
      textField('engineer', 'Инженер', m.engineer, '') +
      '<label class="field"><span>Начало NPI</span>' +
      '<input type="date" data-meta="start" value="' + esc(m.start) + '"></label>' +
      '<label class="field"><span>Целевая дата</span>' +
      '<input type="date" data-meta="target" value="' + esc(m.target) + '"></label>' +
      '</div></div>';

    html += '<div class="panel"><h2>Локальная языковая модель</h2>' +
      '<p class="muted" style="font-size:.82rem">Страница обращается только к своему ' +
      'origin: запросы идут через прокси <code>serve.js</code>, а адрес модели и ключ ' +
      'лежат в <code>llm.config.json</code> рядом с сервером. Без запущенного сервера ' +
      'модели чек-лист, находки и отчёт работают полностью.</p>' +
      '<div class="stack" style="margin-top:12px">' +
      '<label class="field"><span>Адрес (базовый URL)</span>' +
      '<input type="text" data-llm="baseUrl" value="' + esc(Llm.config().baseUrl) + '"></label>' +
      '<label class="field"><span>Модель</span>' +
      '<input type="text" data-llm="model" value="' + esc(Llm.config().model) + '"></label>' +
      '<label class="field"><span>Температура</span>' +
      '<input type="number" step="0.05" min="0" max="1" data-llm="temperature" value="' +
      esc(Llm.config().temperature) + '"></label>' +
      '<label class="field"><span>Предел токенов ответа</span>' +
      '<input type="number" step="50" min="100" max="8000" data-llm="maxTokens" value="' +
      esc(Llm.config().maxTokens) + '"></label>' +
      '</div>' +
      '<div class="row" style="margin-top:12px">' +
      '<button class="btn" data-act="llm-test" type="button">Проверить связь</button> ' +
      '<span class="muted" style="font-size:.78rem" id="llm-test-out"></span></div>' +
      '<div class="llm-note" style="margin-top:14px">' +
      'Модель не выставляет статус шагу, не назначает серьёзность находке и не принимает ' +
      'решение о выпуске. Всё, что она возвращает, — черновик текста в поле, которое ' +
      'нужно прочитать и отредактировать. Вердикт, покрытие и блокировка гейтов считает ' +
      'программа.</div>' +
      '</div>';

    html += '</div>';

    html += '<div class="panel"><h2>Обмен данным</h2>' +
      '<p class="muted" style="font-size:.82rem">Экспорт сохраняет проект вместе с ' +
      'фото-доказательствами в одном файле — это резервная копия и способ передать ' +
      'дело другому инженеру.</p>' +
      '<div class="row" style="margin-top:10px">' +
      '<button class="btn" data-act="export-json" type="button">Экспорт проекта (JSON)</button> ' +
      '<button class="btn" data-act="export-report" type="button">Экспорт отчёта (HTML)</button> ' +
      '<button class="btn" data-act="import" type="button">Импорт проекта</button>' +
      '</div></div>';

    return html;
  }

  function textField(key, label, value, ph) {
    return '<label class="field"><span>' + esc(label) + '</span>' +
      '<input type="text" data-meta="' + esc(key) + '" value="' + esc(value) + '"' +
      (ph ? ' placeholder="' + esc(ph) + '"' : '') + '></label>';
  }

  /* ===================================================================== *
   * ПРЕДСТАВЛЕНИЕ: отчёт
   * ===================================================================== */

  function renderReport() {
    var p = activeProject();
    if (!p) return notFound('Изделие не найдено', '');
    var html = projectTabs(p, 'report');
    html += '<div class="panel"><h1 style="margin:0 0 4px">Отчёт</h1>' +
      '<p class="muted" style="margin:0 0 14px">Отчёт считается в браузере из состояния ' +
      'проекта. Фото-доказательства встраиваются в документ, поэтому файл ' +
      'самодостаточен и печатается в PDF без внешних зависимостей.</p>' +
      '<div class="report-actions">' +
      '<button class="btn btn--primary" data-act="report-build" type="button">Сформировать отчёт</button> ' +
      '<button class="btn" data-act="report-open" type="button" id="btn-open-report">Открыть в новой вкладке</button> ' +
      '<button class="btn" data-act="report-print" type="button">Печать / PDF</button> ' +
      '<button class="btn" data-act="llm-summary" type="button">Краткое резюме моделью</button> ' +
      '</div>' +
      '<div id="llm-summary-out"></div>' +
      '<iframe class="report-frame" id="report-frame" title="Отчёт по изделию"></iframe>' +
      '</div>';
    return html;
  }

  /* ------------------------------------------------------- контекст для LLM */

  function buildLlmContext(p) {
    var ex = AC.explainProject(p, NPI);
    return {
      изделие: p.meta,
      вердикт: ex.verdict,
      покрытие: ex.coverage,
      порог: ex.threshold,
      гейты: ex.gates.map(function (g) {
        return { гейт: g.id, название: gateName(g.id), состояние: g.verdict,
          отвечено: g.answered, всего: g.total, открытыхНаходок: g.open.length };
      }),
      находки: AC.findingsOf(p).map(function (f) {
        return { id: f.id, шаг: f.stepId, гейт: f.gateId, уровень: f.sev,
          статус: f.status, название: f.title, наблюдается: f.desc,
          причина: f.cause, локализация: f.containment, действие: f.action,
          владелец: f.owner, срок: f.due, фотографий: (f.photos || []).length };
      }),
      основания: ex.reasons
    };
  }

  /* ===================================================================== *
   * ПРЕДСТАВЛЕНИЕ: помощь
   * ===================================================================== */

  function renderHelp() {
    return '<div class="panel"><h1>Как работать с чек-листом</h1>' +
      '<p>Инструмент проводит новое изделие по NPI от входного пакета данных до раннего ' +
      'серийного сопровождения. Четырнадцать гейтов, ' + esc(countSteps()) +
      ' шагов. Гейты идут строго по порядку: следующий открывается, когда закрыт предыдущий.</p>' +

      '<h2>Что означает каждый статус шага</h2>' +
      '<ul class="help-list">' +
      '<li><b>Соответствует</b> — требование выполнено, доказательство приложено или ' +
      'записано. Отсутствие ответа не равно «Соответствует»: неотвеченный шаг виден ' +
      'в отчёте как неотвеченный.</li>' +
      '<li><b>Риск</b> — требование не выполнено или выполнено с оговоркой. Шаг уровня B ' +
      'с риском останавливает выпуск.</li>' +
      '<li><b>Не применим</b> — шаг не относится к этому изделию. Он выбывает из ' +
      'покрытия, но причина должна быть записана в замечании.</li>' +
      '</ul>' +

      '<h2>Как закрывается гейт</h2>' +
      '<ul class="help-list">' +
      '<li>На все применимые шаги дан ответ.</li>' +
      '<li>Нет открытых находок по шагам этого гейта.</li>' +
      '<li>Отметка «Гейт не применим» закрывает гейт и разблокирует следующий — ' +
      'используйте её осознанно, причина пишется в замечании к шагам.</li>' +
      '</ul>' +

      '<h2>Как оформляется находка</h2>' +
      '<ul class="help-list">' +
      '<li>Находка создаётся из шага: кнопка «+ Находка» в проходе. Замечание и ' +
      'измеренное значение переносятся в неё автоматически.</li>' +
      '<li>Фото-доказательства прикрепляются кнопкой или прямо с камеры телефона ' +
      '(<code>accept="image/*" capture</code>). Фото уменьшаются до 1600 px по ' +
      'большей стороне и хранятся в IndexedDB.</li>' +
      '<li>Уровень <b>B</b> блокирует выпуск, <b>C</b> даёт условный выпуск, ' +
      '<b>W</b> — наблюдение и на вердикт не влияет.</li>' +
      '<li>Находка закрывается, когда выполнено корректирующее действие и проверена ' +
      'его результативность, а доказательство приложено.</li>' +
      '</ul>' +

      '<h2>Зачем здесь локальная модель</h2>' +
      '<ul class="help-list">' +
      '<li><b>Черновик находки по фото</b> — модель смотрит на снимок и на требование ' +
      'шага и предлагает формулировки. Это черновик: он попадает в редактируемые поля.</li>' +
      '<li><b>Проверка заметки на полноту</b> — что забыто указать для приёмки шага.</li>' +
      '<li><b>Краткое резюме</b> — текст для руководства поверх машинной сводки.</li>' +
      '</ul>' +
      '<p>Модель <b>не</b> выставляет статус шагу, <b>не</b> назначает серьёзность и ' +
      '<b>не</b> принимает решение о выпуске. Вердикт, покрытие и блокировка гейтов ' +
      'считает программа по фиксированному правилу, и в отчёте это правило напечатано.</p>' +

      '<h2>Как подключить модель</h2>' +
      '<ol class="help-list">' +
      '<li>Запустите сервер модели локально (любой, говорящий на OpenAI-совместимом ' +
      'API: vLLM, llama.cpp server, Ollama, LM Studio).</li>' +
      '<li>Пропишите адрес и имя модели в <code>llm.config.json</code> рядом с ' +
      '<code>serve.js</code> — или в переменных <code>LLM_BASE_URL</code> и ' +
      '<code>LLM_MODEL</code>.</li>' +
      '<li>Запустите <code>node serve.js</code> и откройте ' +
      '<code>http://127.0.0.1:8790/</code>.</li>' +
      '<li>Нажмите «Проверить связь» в настройках изделия. Если модель не в списке — ' +
      'чат не пойдёт; имя модели должно в точности совпадать с тем, что отдаёт ' +
      '<code>/v1/models</code>.</li>' +
      '</ol>' +
      '<p>Открытый через <code>file://</code>, инструмент работает полностью, кроме ' +
      'функций модели: браузер не даёт странице с файловой системы обращаться к ' +
      'локальному серверу.</p>' +

      '<h2>Про числовые критерии</h2>' +
      '<p>Критерий, помеченный «не сверено», не проверялся по первоисточнику и не должен ' +
      'применяться как требование. Сверьте его с действующей редакцией нормы до ' +
      'подписания отчёта. Нормы называются по обозначению и не цитируются.</p>' +

      '<p style="margin-top:20px"><a class="btn btn--primary" href="#/">К изделиям →</a></p>' +
      '</div>';
  }

  /* ===================================================================== *
   * РЕНДЕР
   * ===================================================================== */

  function render() {
    route = parseHash();
    var html;
    try {
      if (route.view === 'list') html = renderList();
      else if (route.view === 'help') html = renderHelp();
      else if (route.view === 'project') html = renderProject();
      else if (route.view === 'gate') html = renderGate();
      else if (route.view === 'findings') html = renderFindings();
      else if (route.view === 'report') html = renderReport();
      else if (route.view === 'settings') html = renderSettings();
      else html = notFound('Страница не найдена', 'Адрес «' + (route.hash || '') + '» не соответствует ни одному разделу.');
    } catch (e) {
      html = '<div class="panel"><h1>Ошибка отображения</h1>' +
        '<p>Раздел не удалось построить: ' + esc(e && e.message ? e.message : e) + '</p>' +
        '<p><a class="btn" href="#/">← К списку изделий</a></p></div>';
    }
    app.innerHTML = html;
    afterRender();
    var h1 = app.querySelector('h1');
    if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    window.scrollTo(0, 0);
  }

  /* --------------------------------------------------- что сделать после рендера */

  var photoCache = {};

  function afterRender() {
    // Плитки находок подгружаются асинхронно: фото лежат в IndexedDB.
    var plates = app.querySelectorAll('[data-plates]');
    for (var i = 0; i < plates.length; i++) loadPlates(plates[i]);

    // Автосохранение заметок и измерений — по выходу из поля.
    bindAutosave();

    // Отчёт пересобираем при переходе на вкладку, если там что-то уже было.
    if (route.view === 'report') {
      var frame = document.getElementById('report-frame');
      if (frame && !frame.dataset.built) buildReport();
    }
  }

  function bindAutosave() {
    var areas = app.querySelectorAll('textarea[data-note], input[data-loc]');
    for (var i = 0; i < areas.length; i++) {
      areas[i].addEventListener('change', onFieldChange);
    }
    var metas = app.querySelectorAll('[data-meta]');
    for (var j = 0; j < metas.length; j++) metas[j].addEventListener('change', onMetaChange);
    var llms = app.querySelectorAll('[data-llm]');
    for (var k = 0; k < llms.length; k++) llms[k].addEventListener('change', onLlmChange);
  }

  function currentPid() { return route.id; }

  function onFieldChange(e) {
    var el = e.target;
    var pid = currentPid();
    if (!Store.get(pid)) return;
    var key = el.getAttribute('data-note') || el.getAttribute('data-loc');
    var isNote = !!el.getAttribute('data-note');
    if (isNote) Store.setNote(pid, key, el.value);
    else Store.setLoc(pid, key, el.value);
  }

  function onMetaChange(e) {
    var el = e.target;
    var pid = currentPid();
    if (!Store.get(pid)) return;
    Store.setMeta(pid, el.getAttribute('data-meta'), el.value);
  }

  function onLlmChange(e) {
    var el = e.target;
    var key = el.getAttribute('data-llm');
    var raw = el.value;
    var val = raw;
    if (key === 'temperature') val = parseFloat(raw);
    if (key === 'maxTokens') val = parseInt(raw, 10);
    Llm.configure((function () { var o = {}; o[key] = val; return o; })());
    refreshLlmState();
  }

  /* ------------------------------------------------------------- фото */

  function loadPlates(box) {
    var fid = box.getAttribute('data-plates');
    var p = activeProject();
    if (!p) return;
    var f = null;
    for (var i = 0; i < p.findings.length; i++) if (p.findings[i].id === fid) f = p.findings[i];
    if (!f || !f.photos || !f.photos.length) return;

    var html = '';
    var pending = f.photos.length;
    f.photos.forEach(function (phId, idx) {
      Store.photo(phId).then(function (rec) {
        if (!rec || !rec.dataUrl) {
          html += '<figure class="plate plate--missing"><p>Фото ' + esc(phId) +
            ' не найдено в хранилище</p></figure>';
        } else {
          html += '<figure class="plate"><img src="' + esc(rec.dataUrl) +
            '" alt="Фото-доказательство ' + esc(idx + 1) + ' по находке ' + esc(fid) + '">' +
            '<figcaption>Фото ' + esc(idx + 1) + ' из ' + esc(f.photos.length) +
            (rec.w ? ' · ' + esc(rec.w) + '×' + esc(rec.h) + ' px' : '') +
            (rec.bytes ? ' · ' + esc(fmtBytes(rec.bytes)) : '') + '</figcaption></figure>';
        }
      }).catch(function () {
        html += '<figure class="plate plate--missing"><p>Фото ' + esc(phId) +
          ' не прочитано</p></figure>';
      }).then(function () {
        if (--pending === 0) box.innerHTML = html;
      });
    });
  }

  /* ===================================================================== *
   * ДЕЙСТВИЯ
   * ===================================================================== */

  function actNew() {
    var id = Store.create({});
    window.location.hash = '#/p/' + encodeURIComponent(id) + '/settings';
  }

  function actDuplicate() {
    var id = Store.duplicate(route.id);
    if (id) window.location.hash = '#/p/' + encodeURIComponent(id);
  }

  function actDelete() {
    var p = Store.get(route.id);
    if (!p) return;
    var ok = window.confirm('Удалить изделие «' + (p.meta.product || route.id) +
      '» вместе с находками и фото-доказательствами? Действие необратимо.');
    if (!ok) return;
    Store.remove(route.id);
    window.location.hash = '#/';
  }

  function actSetStatus(btn) {
    var pid = currentPid();
    var key = btn.getAttribute('data-status');
    var val = btn.getAttribute('data-val');
    var cur = Store.get(pid).st[key];
    // Повторное нажатие снимает ответ — так исправляется ошибочный клик.
    Store.setStatus(pid, key, cur === val ? null : val);
    var step = app.querySelector('[data-step="' + key + '"]');
    if (step) {
      step.className = 'step ' + (Store.get(pid).st[key] === 'ok' ? 'is-ok'
        : Store.get(pid).st[key] === 'risk' ? 'is-risk'
        : Store.get(pid).st[key] === 'na' ? 'is-na' : 'is-unanswered');
    }
    // Состояние гейта и вердикт живут на других экранах — отметим кнопки заново.
    var group = btn.parentNode;
    var btns = group.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed',
        btns[i].getAttribute('data-status') === key &&
        Store.get(pid).st[key] === btns[i].getAttribute('data-val') ? 'true' : 'false');
    }
  }

  function actGateNA(btn) {
    var pid = currentPid();
    var gid = btn.getAttribute('data-gid');
    Store.setGateNA(pid, gid, !Store.get(pid).gateNA[gid]);
    render();
  }

  /* ------------------------------------------------------- редактор находки */

  var editorFindingId = null;

  function openFindingEditor(stepId) {
    var p = activeProject();
    if (!p) return;
    var step = STEPS_BY_ID[stepId];
    var f = editorFindingId ? findFinding(p, editorFindingId) : null;

    var sev = f ? f.sev : (step && step.s === 'N' ? 'W' : (step ? step.s : 'C'));
    var html = '<div class="panel"><h2>' + (f ? 'Изменить находку ' + esc(f.id) : 'Новая находка') + '</h2>';

    if (step) {
      html += '<div class="banner banner--info" role="note">Привязка к шагу ' +
        '<b>' + esc(step.id) + '</b> — ' + esc(step.t) + '<br>' +
        '<span class="muted">Критерий приёмки: ' + esc(critFor(step, String(p.meta.ipcClass || '3'))) +
        '</span></div>';
    }

    html += '<div class="stack">' +
      '<label class="field"><span>Суть находки (до 90 символов)</span>' +
      '<input type="text" id="f-title" maxlength="120" value="' + esc(f ? f.title : '') +
      '" placeholder="Мост пасты между отпечатками на 0.4 мм шаге"></label>' +

      '<label class="field"><span>Что наблюдается</span>' +
      '<textarea id="f-desc" placeholder="Факт, место, на какой выборке, чем измерено">' +
      esc(f ? f.desc : '') + '</textarea></label>' +

      '<div class="row">' +
      '<label class="field" style="flex:0 0 150px"><span>Уровень</span>' +
      '<select id="f-sev">' +
      ['B', 'C', 'W'].map(function (s) {
        return '<option value="' + s + '"' + (sev === s ? ' selected' : '') + '>' +
          esc(s) + ' — ' + esc(NPI.severities[s]) + '</option>';
      }).join('') + '</select></label>' +

      '<label class="field" style="flex:1 1 160px"><span>Нормативный документ</span>' +
      '<input type="text" id="f-std" value="' + esc(f ? f.std : (step && step.std ? step.std : '')) +
      '" placeholder="IPC-A-610"></label>' +

      '<label class="field" style="flex:0 0 130px"><span>Пункт</span>' +
      '<input type="text" id="f-clause" value="' + esc(f ? f.clause : '') +
      '" placeholder="§8.3.1"></label>' +
      '</div>' +

      '<label class="field"><span>Доказательство (чем подтверждается)</span>' +
      '<input type="text" id="f-evidence" value="' + esc(f ? f.evidence : '') +
      '" placeholder="Фото отпечатка + запись измерения натяжения"></label>' +

      '<label class="field"><span>Причина</span>' +
      '<textarea id="f-cause" placeholder="Наиболее вероятная причина; если неизвестна — оставьте пустым">' +
      esc(f ? f.cause : '') + '</textarea></label>' +

      '<label class="field"><span>Локализация (что сделано прямо сейчас)</span>' +
      '<textarea id="f-containment">' + esc(f ? f.containment : '') + '</textarea></label>' +

      '<label class="field"><span>Корректирующее действие</span>' +
      '<textarea id="f-action">' + esc(f ? f.action : '') + '</textarea></label>' +

      '<div class="row">' +
      '<label class="field" style="flex:1 1 160px"><span>Владелец</span>' +
      '<input type="text" id="f-owner" value="' + esc(f ? f.owner : '') + '" placeholder="Технолог SMT-2"></label>' +
      '<label class="field" style="flex:0 0 160px"><span>Срок</span>' +
      '<input type="date" id="f-due" value="' + esc(f ? f.due : '') + '"></label>' +
      '<label class="field" style="flex:0 0 170px"><span>Статус</span>' +
      '<select id="f-status">' +
      ['open', 'contained', 'closed'].map(function (s) {
        return '<option value="' + s + '"' + ((f ? f.status : 'open') === s ? ' selected' : '') +
          '>' + esc(FINDING_STATUS_LABEL[s]) + '</option>';
      }).join('') + '</select></label>' +
      '</div>' +

      '<label class="field"><span>Кто фиксирует</span>' +
      '<input type="text" id="f-by" value="' + esc(f ? f.by : '') + '" placeholder="Фамилия"></label>' +
      '</div>';

    // Фото-доказательства
    html += '<h3 style="margin-top:18px">Фото-доказательства</h3>' +
      '<div class="row">' +
      '<label class="btn" style="cursor:pointer">' +
      'Прикрепить фото<input type="file" id="f-photos" accept="image/*" multiple style="display:none">' +
      '</label>' +
      '<label class="btn" style="cursor:pointer">' +
      'Снять с камеры<input type="file" id="f-camera" accept="image/*" capture="environment" style="display:none">' +
      '</label>' +
      '<span class="muted" style="font-size:.78rem">Фото уменьшается до 1600 px и ' +
      'хранится локально в браузере. В отчёт попадает встроенным.</span>' +
      '</div>' +
      '<div class="plates" id="f-plate-box"></div>';

    // Модель
    html += '<div class="llm-box" style="margin-top:18px">' +
      '<h4><span class="chip chip--teal">модель</span> Черновик находки</h4>' +
      '<p class="muted" style="font-size:.8rem;margin:0">Модель получит требование шага, ' +
      'замечание, измеренное значение и приложенные фото, и предложит формулировки. ' +
      'Результат — черновик в полях выше. Прочитайте и поправьте перед сохранением.</p>' +
      '<div class="row" style="margin-top:10px">' +
      '<button class="btn" data-act="llm-draft" type="button">Предложить черновик</button> ' +
      '<span class="muted" style="font-size:.78rem" id="llm-draft-out"></span></div>' +
      '<div id="llm-draft-box"></div>' +
      '</div>';

    html += '<div class="row row--end" style="margin-top:18px">' +
      '<button class="btn" data-act="fedit-cancel" type="button">Отмена</button> ' +
      '<button class="btn btn--primary" data-act="fedit-save" type="button">Сохранить находку</button>' +
      '</div></div>';

    var host = document.getElementById('finding-editor') || (function () {
      var d = document.createElement('div');
      d.id = 'finding-editor';
      app.appendChild(d);
      return d;
    })();
    host.innerHTML = html;
    host.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (f) loadEditorPlates(f);
    var ph = document.getElementById('f-photos');
    var cam = document.getElementById('f-camera');
    if (ph) ph.addEventListener('change', onPhotosPicked);
    if (cam) cam.addEventListener('change', onPhotosPicked);
  }

  function findFinding(p, fid) {
    for (var i = 0; i < p.findings.length; i++) if (p.findings[i].id === fid) return p.findings[i];
    return null;
  }

  var editorPhotos = [];

  function loadEditorPlates(f) {
    editorPhotos = (f.photos || []).slice();
    renderEditorPlates();
  }

  function renderEditorPlates() {
    var box = document.getElementById('f-plate-box');
    if (!box) return;
    if (!editorPhotos.length) {
      box.innerHTML = '<p class="muted" style="font-size:.8rem;margin:0">Фото не приложены.</p>';
      return;
    }
    var html = '';
    var pending = editorPhotos.length;
    editorPhotos.forEach(function (phId, idx) {
      Store.photo(phId).then(function (rec) {
        html += '<figure class="plate"><img src="' + esc(rec && rec.dataUrl ? rec.dataUrl : '') +
          '" alt="Фото-доказательство ' + esc(idx + 1) + '">' +
          '<figcaption>Фото ' + esc(idx + 1) + ' · ' + esc(phId) +
          ' <button class="btn btn--sm btn--danger" data-act="fphoto-del" data-ph="' +
          esc(phId) + '" type="button">убрать</button></figcaption></figure>';
      }).catch(function () {
        html += '<figure class="plate plate--missing"><p>Фото ' + esc(phId) + ' не прочитано</p></figure>';
      }).then(function () { if (--pending === 0) box.innerHTML = html; });
    });
  }

  function onPhotosPicked(e) {
    var files = e.target.files;
    if (!files || !files.length) return;
    var out = document.getElementById('llm-draft-out');
    if (out) out.textContent = 'Обработка фото…';
    var chain = Promise.resolve();
    for (var i = 0; i < files.length; i++) {
      (function (file) {
        chain = chain.then(function () {
          return Store.addPhoto(file).then(function (rec) {
            editorPhotos.push(rec.id);
            if (out) out.textContent = 'Приложено фото: ' + rec.name + ' (' + fmtBytes(rec.bytes) + ')';
          });
        });
      })(files[i]);
    }
    chain.then(function () { renderEditorPlates(); e.target.value = ''; });
  }

  function actFindingPhotoDel(btn) {
    var phId = btn.getAttribute('data-ph');
    editorPhotos = editorPhotos.filter(function (x) { return x !== phId; });
    Store.deletePhoto(phId);
    renderEditorPlates();
  }

  function actSaveFinding() {
    var p = activeProject();
    if (!p) return;
    var stepId = null;
    var stepSel = app.querySelector('[data-finding-for]');
    if (editorFindingId) {
      var f = findFinding(p, editorFindingId);
      stepId = f ? f.stepId : null;
    } else if (stepSel) {
      stepId = stepSel.getAttribute('data-finding-for');
    }
    var step = stepId ? STEPS_BY_ID[stepId] : null;
    if (!stepId) {
      window.alert('Находка должна быть привязана к шагу чек-листа. Создавайте её из шага гейта.');
      return;
    }

    var title = val('f-title');
    if (!title || title.length < 3) {
      window.alert('Суть находки не короче 3 символов — иначе в реестре будет непонятно, о чём речь.');
      document.getElementById('f-title').focus();
      return;
    }

    var draft = {
      stepId: stepId,
      gateId: AC.gateOfStepId(stepId),
      title: title,
      desc: val('f-desc'),
      sev: val('f-sev'),
      std: val('f-std'),
      clause: val('f-clause'),
      evidence: val('f-evidence'),
      cause: val('f-cause'),
      containment: val('f-containment'),
      action: val('f-action'),
      owner: val('f-owner'),
      due: val('f-due'),
      status: val('f-status'),
      by: val('f-by'),
      photos: editorPhotos.slice()
    };

    if (editorFindingId) Store.updateFinding(route.id, editorFindingId, draft);
    else Store.addFinding(route.id, draft);

    closeEditor();
    render();
  }

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function closeEditor() {
    editorFindingId = null;
    editorPhotos = [];
    var host = document.getElementById('finding-editor');
    if (host) host.innerHTML = '';
  }

  /* ------------------------------------------------------------ действия LLM */

  function refreshLlmState() {
    if (!llmState) return;
    llmState.textContent = 'модель: ' + Llm.config().model;
    llmState.className = 'brand-llm';
  }

  function actLlmTest() {
    var out = document.getElementById('llm-test-out');
    if (out) out.innerHTML = '<span class="spinner"></span> проверка…';
    Llm.health().then(function (h) {
      if (!out) return;
      if (!h.ok) {
        out.innerHTML = '<span style="color:var(--risk)">связи нет: ' + esc(h.error) + '</span>';
      } else if (h.models.length && !h.inList) {
        out.innerHTML = '<span style="color:var(--warn)">сервер ответил, но модели «' +
          esc(h.configured) + '» в списке нет. Доступны: ' +
          esc(h.models.join(', ')) + '</span>';
      } else {
        out.innerHTML = '<span style="color:var(--ok)">связь есть, модель ' +
          esc(h.configured) + ' отвечает</span>';
      }
    });
  }

  function actLlmDraft() {
    var p = activeProject();
    if (!p) return;
    var stepId = null;
    var sel = app.querySelector('[data-finding-for]');
    if (sel) stepId = sel.getAttribute('data-finding-for');
    if (editorFindingId) {
      var f = findFinding(p, editorFindingId);
      if (f) stepId = f.stepId;
    }
    var step = stepId ? STEPS_BY_ID[stepId] : null;
    var out = document.getElementById('llm-draft-out');
    var box = document.getElementById('llm-draft-box');
    if (!step) {
      if (out) out.innerHTML = '<span style="color:var(--warn)">находка не привязана к шагу</span>';
      return;
    }
    if (out) out.innerHTML = '<span class="spinner"></span> модель думает…';
    if (box) box.innerHTML = '';

    // Фото из редактора отдаём модели как данные — она мультимодальная.
    var imgs = [];
    var chain = Promise.resolve();
    editorPhotos.forEach(function (phId) {
      chain = chain.then(function () {
        return Store.photo(phId).then(function (rec) {
          if (rec && rec.dataUrl) imgs.push(rec.dataUrl);
        });
      });
    });

    chain.then(function () {
      return Llm.draftFinding({
        step: step,
        note: val('f-desc') || (stepId && p.note[stepId]) || '',
        loc: stepId && p.loc[stepId] ? p.loc[stepId] : '',
        ipcClass: String(p.meta.ipcClass || '3'),
        photos: imgs
      });
    }).then(function (res) {
      if (!out) return;
      if (!res.ok) {
        out.innerHTML = '<span style="color:var(--risk)">' + esc(res.error) + '</span>';
        return;
      }
      out.innerHTML = '<span style="color:var(--ok)">черновик готов за ' + esc(res.ms) +
        ' мс · ' + esc(res.model) + '</span>';
      var d = res.draft || {};
      var lines = [];
      if (d.title) lines.push(['Суть', d.title]);
      if (d.desc) lines.push(['Наблюдается', d.desc]);
      if (d.cause) lines.push(['Причина', d.cause]);
      if (d.containment) lines.push(['Локализация', d.containment]);
      if (d.action) lines.push(['Действие', d.action]);
      if (d.std) lines.push(['Норма', d.std]);
      if (!lines.length) lines.push(['Ответ', res.raw]);
      var html = '<dl class="finding-fields">';
      lines.forEach(function (l) { html += '<dt>' + esc(l[0]) + '</dt><dd>' + esc(l[1]) + '</dd>'; });
      html += '</dl><div class="row" style="margin-top:10px">' +
        '<button class="btn btn--sm btn--primary" data-act="llm-apply" type="button">' +
        'Перенести в поля находки</button> ' +
        '<span class="muted" style="font-size:.76rem">черновик не сохраняется, пока вы не нажали «Сохранить находку»</span></div>';
      if (box) box.innerHTML = html;
      window.__llmDraft = d;
    });
  }

  function actLlmApply() {
    var d = window.__llmDraft;
    if (!d) return;
    function set(id, v) { var el = document.getElementById(id); if (el && v) el.value = v; }
    set('f-title', d.title); set('f-desc', d.desc); set('f-cause', d.cause);
    set('f-containment', d.containment); set('f-action', d.action);
    set('f-std', d.std);
    var out = document.getElementById('llm-draft-out');
    if (out) out.innerHTML = '<span style="color:var(--ok)">перенесено в поля — проверьте и сохраните</span>';
  }

  function actLlmSummary() {
    var p = activeProject();
    if (!p) return;
    var box = document.getElementById('llm-summary-out');
    if (!box) return;
    box.innerHTML = '<div class="llm-box"><h4><span class="spinner"></span> модель пишет резюме…</h4></div>';
    Llm.summarize(buildLlmContext(p)).then(function (res) {
      if (!res.ok) {
        box.innerHTML = '<div class="llm-box"><h4>Резюме не получено</h4>' +
          '<div class="llm-out is-error">' + esc(res.error) + '</div>' +
          '<p class="llm-note">Отчёт формируется и без резюме: вердикт, состояние гейтов ' +
          'и реестр находок считает программа.</p></div>';
        return;
      }
      box.innerHTML = '<div class="llm-box"><h4>Краткое резюме</h4>' +
        '<div class="llm-out">' + esc(res.text) + '</div>' +
        '<p class="llm-tag">модель ' + esc(res.model) + ' · ' + esc(res.ms) + ' мс</p>' +
        '<p class="llm-note">Текст сгенерирован моделью и требует прочтения человеком. ' +
        'Числа, вердикт и состав находок рассчитаны программой.</p></div>';
    });
  }

  /* ------------------------------------------------------------- отчёт */

  var lastReportDoc = null;

  function buildReport() {
    var p = activeProject();
    if (!p) return;
    var frame = document.getElementById('report-frame');
    if (frame) frame.dataset.built = '1';
    Store.photos().then(function (recs) {
      var photos = {};
      for (var i = 0; i < recs.length; i++) {
        photos[recs[i].id] = { dataUrl: recs[i].dataUrl, w: recs[i].w, h: recs[i].h };
      }
      var doc = Report.exportDocument(p, NPI, { photos: photos });
      lastReportDoc = doc;
      // URL.createObjectURL есть во всех браузерах, но его отсутствие не должно
      // молча ронять построение: документ уже готов, не покажем только
      // предпросмотр.
      if (frame && typeof URL !== 'undefined' &&
          typeof URL.createObjectURL === 'function') {
        var blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
        frame.src = URL.createObjectURL(blob);
      }
    });
  }

  function actReportOpen() {
    if (!lastReportDoc) buildReport();
    setTimeout(function () {
      if (!lastReportDoc) return;
      var blob = new Blob([lastReportDoc], { type: 'text/html;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
    }, 400);
  }

  function actReportPrint() {
    var frame = document.getElementById('report-frame');
    if (frame && frame.contentWindow) {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    }
  }

  function download(name, text, mime) {
    var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function safeName(p) {
    var base = (p && p.meta && p.meta.product) || 'izdelie';
    return base.replace(/[^\wа-яА-ЯёЁ.-]+/gi, '_').replace(/^_+|_+$/g, '') || 'izdelie';
  }

  function actExportJson() {
    var p = activeProject();
    if (!p) return;
    Store.exportJson(route.id).then(function (json) {
      download(safeName(p) + '-npi-' + NPI.version + '.json', json, 'application/json');
    }).catch(function (e) {
      window.alert('Не удалось выгрузить проект: ' + e.message);
    });
  }

  function actExportReport() {
    var p = activeProject();
    if (!p) return;
    if (!lastReportDoc) { buildReport(); }
    setTimeout(function () {
      var doc = lastReportDoc || Report.exportDocument(p, NPI, { photos: {} });
      download(safeName(p) + '-NPI-отчёт.html', doc, 'text/html;charset=utf-8');
    }, 500);
  }

  function actImport() {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'application/json,.json';
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        Store.importJson(String(fr.result)).then(function (id) {
          window.location.hash = '#/p/' + encodeURIComponent(id);
        }).catch(function (e) {
          window.alert('Импорт не удался: ' + e.message);
        });
      };
      fr.readAsText(f);
    });
    inp.click();
  }

  /* ===================================================================== *
   * СОБЫТИЯ
   * ===================================================================== */

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;

    var statusBtn = t.closest ? t.closest('button[data-status]') : null;
    if (statusBtn) { actSetStatus(statusBtn); return; }

    var act = t.getAttribute('data-act');
    if (!act) return;

    switch (act) {
      case 'new': actNew(); break;
      case 'dup': actDuplicate(); break;
      case 'del': actDelete(); break;
      case 'gate-na': actGateNA(t); break;
      case 'finding': openFindingEditorFor(t); break;
      case 'fedit': editorFindingId = t.getAttribute('data-fid'); openFindingEditor(null); break;
      case 'fdel': actDeleteFinding(t.getAttribute('data-fid')); break;
      case 'fstatus': actFindingStatus(t.getAttribute('data-fid'), t.getAttribute('data-val')); break;
      case 'fedit-save': actSaveFinding(); break;
      case 'fedit-cancel': closeEditor(); render(); break;
      case 'fphoto-del': actFindingPhotoDel(t); break;
      case 'llm-test': actLlmTest(); break;
      case 'llm-draft': actLlmDraft(); break;
      case 'llm-apply': actLlmApply(); break;
      case 'llm-summary': actLlmSummary(); break;
      case 'report-build': buildReport(); break;
      case 'report-open': actReportOpen(); break;
      case 'report-print': actReportPrint(); break;
      case 'export-json': actExportJson(); break;
      case 'export-report': actExportReport(); break;
      case 'import': actImport(); break;
      default: break;
    }
  });

  function openFindingEditorFor(btn) {
    var stepId = btn.getAttribute('data-step');
    editorFindingId = null;
    editorPhotos = [];
    var p = activeProject();
    if (!p) return;
    // Редактор рисуем внутри текущего представления: гейт уже показан,
    // поэтому привязка к шагу видна и не теряется при перерисовке.
    var host = document.getElementById('finding-editor');
    if (!host) {
      host = document.createElement('div');
      host.id = 'finding-editor';
      app.appendChild(host);
    }
    host.innerHTML = '<div class="panel" data-finding-for="' + esc(stepId || '') +
      '" id="finding-anchor"></div>';
    openFindingEditor(stepId);
  }

  function actDeleteFinding(fid) {
    var p = activeProject();
    if (!p) return;
    var f = findFinding(p, fid);
    if (!f) return;
    var ok = window.confirm('Удалить находку ' + fid + ' «' + (f.title || '') +
      '» вместе с фото-доказательствами?');
    if (!ok) return;
    Store.removeFinding(route.id, fid);
    render();
  }

  function actFindingStatus(fid, val) {
    Store.updateFinding(route.id, fid, { status: val });
    render();
  }

  window.addEventListener('hashchange', render);

  /* ------------------------------------------------------------- запуск */

  refreshLlmState();
  render();
  Llm.health().then(function () { refreshLlmState(); });

  // Состояние могло измениться в другой вкладке — подхватываем.
  window.addEventListener('storage', function (e) {
    if (e.key === 'npi-checklist-v2') { Store.init(); render(); }
  });
})();
