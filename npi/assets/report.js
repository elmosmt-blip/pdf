/* =========================================================================
 * NPI Checklist — assets/report.js
 *
 * Чистовой рендерер отчёта. БЕЗ LLM, БЕЗ DOM: строка на входе, HTML-строка
 * на выходе. Вердикт, покрытие, состояние гейтов и серьёзность считает
 * NpiCore, никогда — этот файл.
 *
 * CLASSIC SCRIPT ONLY (не ES-модуль): работает с file:// и внутри голого
 * VM realm в Node (см. tests/report.test.js).
 *
 * Экспортирует одну глобаль: Report
 *   Report.buildReportHtml(project, checklist, opts) -> HTML-строка (экранировано)
 *   Report.exportDocument(project, checklist, opts)  -> standalone HTML-документ
 *   Report.reportCss() / Report.printCss()           -> светлая тема + печать
 *   Report.esc(value)                                -> экранирование HTML
 *
 * Правило безопасности: каждая динамическая строка проходит через esc()
 * этого файла, прежде чем попасть в выходной HTML.
 * ========================================================================= */
(function (root) {
  'use strict';

  var ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return ESC_MAP[c];
    });
  }

  var AC = root.NpiCore;

  /* ------------------------------------------------------------ имена */

  var GATE_NAMES = {
    g0: 'Входной пакет данных', g1: 'DFM-разбор',
    g2: 'Документация и планирование процесса', g3: 'Материалы и готовность по MSL',
    g4: 'Трафарет и печать', g5: 'Монтаж компонентов',
    g6: 'Профиль оплавления', g7: 'THT: волна и селективная пайка',
    g8: 'Контроль и испытания', g9: 'Ремонт и восстановление',
    g10: 'Раскрой, покрытие, очистка', g11: 'Первая партия и опытный запуск',
    g12: 'Квалификация и выпуск в серию', g13: 'Раннее серийное сопровождение'
  };

  var SEV_LABEL = {
    B: 'B — блокирует выпуск', C: 'C — условный выпуск',
    W: 'W — наблюдение', N: 'N — информационно'
  };

  var FINDING_STATUS_LABEL = {
    open: 'открыта', contained: 'локализована', closed: 'закрыта'
  };

  var STATUS_LABEL = { ok: 'Соответствует', risk: 'Риск', na: 'Не применим' };

  var GV_LABEL = {
    'заблокирован': 'Заблокирован', 'открыт': 'Открыт',
    'условно пройден': 'Условно пройден', 'не пройден': 'Не пройден',
    'пройден': 'Пройден', 'не применим': 'Не применим'
  };

  /* ----------------------------------------------------------- помощники */

  function dash(v) {
    var s = (v == null ? '' : String(v)).trim();
    return s ? esc(s) : '—';
  }

  function fmtPct(p) { return String(Math.round(p * 10) / 10); }

  function gateName(gid) { return GATE_NAMES[gid] || gid; }

  function escAttr(v) { return esc(v); }

  function fmtDate(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    if (isNaN(d.getTime())) return '—';
    function p(n) { return n < 10 ? '0' + n : String(n); }
    return d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate()) +
      ' ' + p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + ' UTC';
  }

  /* ------------------------------------------------- чек-лист -> индекс */

  function indexChecklist(checklist) {
    var cl = AC.normalizeChecklist(checklist);
    var raw = (checklist && checklist.gates) || [];
    var stepsById = {};
    for (var i = 0; i < raw.length; i++) {
      var steps = raw[i].steps || raw[i].items || [];
      for (var j = 0; j < steps.length; j++) {
        if (steps[j] && steps[j].id) stepsById[steps[j].id] = steps[j];
      }
    }
    return { cl: cl, stepsById: stepsById };
  }

  /* ------------------------------------------------------- блоки отчёта */

  function coverBlock(project, ex, generated) {
    var m = project.meta || {};
    var rows = [
      ['Изделие', m.product], ['Обозначение (PN)', m.pn],
      ['Ревизия', m.rev], ['Заказчик', m.customer],
      ['Класс IPC', m.ipcClass], ['Припой', m.alloy],
      ['Линия', m.line], ['Инженер', m.engineer],
      ['Начало NPI', m.start], ['Целевая дата', m.target],
      ['Версия чек-листа', project.checklistVersion || (root.NPI && root.NPI.version) || ''],
      ['Отчёт сформирован', generated]
    ];
    var html = '<header class="cover">' +
      '<p class="kicker">NPI · вывод нового изделия в производство</p>' +
      '<h1>' + dash(m.product || 'Изделие без названия') + '</h1>' +
      '<p class="cover-sub">Отчёт о прохождении чек-листа NPI · SMT и THT</p>' +
      '<div class="tbl-wrap"><table class="tbl cover-meta">' +
      '<caption class="sr-only">Идентификация изделия</caption><tbody>';
    for (var i = 0; i < rows.length; i++) {
      html += '<tr><th scope="row">' + esc(rows[i][0]) + '</th><td>' + dash(rows[i][1]) + '</td></tr>';
    }
    return html + '</tbody></table></div></header>';
  }

  function verdictBlock(project, ex) {
    var v = ex.verdict;
    var cls = v === AC.VERDICT.READY ? 'vb--ok'
      : v === AC.VERDICT.CONDITIONAL ? 'vb--warn'
      : v === AC.VERDICT.NOT_RELEASED ? 'vb--risk'
      : 'vb--muted';
    var html = '<section class="verdict-banner ' + cls + '" aria-label="Итоговый вердикт">' +
      '<div class="verdict-row">' +
      '<span class="verdict-badge vb-badge--' + cls.slice(4) + '">' + esc(v) + '</span>' +
      '<span class="coverage-line">Покрытие ' + fmtPct(ex.coverage.percent) + ' % · порог ' +
      esc(ex.threshold) + ' %</span>' +
      '</div>' +
      '<div class="cov">' +
      '<div class="progress"><span style="width:' +
      Math.max(0, Math.min(100, ex.coverage.percent)) + '%"></span></div>' +
      '<p class="cov-num">' + esc(ex.coverage.answered) + ' из ' + esc(ex.coverage.total) +
      ' применимых шагов отвечено</p>' +
      '</div>';
    if (ex.reasons.length) {
      html += '<p class="verdict-why">На основании:</p><ul class="reasons">';
      for (var i = 0; i < ex.reasons.length; i++) html += '<li>' + esc(ex.reasons[i]) + '</li>';
      html += '</ul>';
    } else {
      html += '<p class="reasons-empty">Блокирующих оснований нет: все применимые шаги отвечены, ' +
        'открытых находок нет.</p>';
    }
    html += '<p class="verdict-rule">Вердикт рассчитан программой по фиксированному правилу: ' +
      'открытая находка уровня B или риск на шаге уровня B — «' + esc(AC.VERDICT.NOT_RELEASED) +
      '»; открытая находка уровня C или риск на шаге уровня C — «' + esc(AC.VERDICT.CONDITIONAL) +
      '»; покрытие ниже порога — «' + esc(AC.VERDICT.IN_PROGRESS) + '»; иначе — «' +
      esc(AC.VERDICT.READY) + '». Риск с неопределённой серьёзностью трактуется как уровень C.</p>';
    return html + '</section>';
  }

  function summaryBlock(ex) {
    var gates = ex.gates;
    var html = '<h2>Состояние гейтов</h2>' +
      '<div class="tbl-wrap"><table class="tbl gate-summary">' +
      '<caption class="sr-only">Состояние гейтов</caption>' +
      '<thead><tr><th scope="col">Гейт</th><th scope="col">Шаги</th>' +
      '<th scope="col">Открытых находок</th><th scope="col">Состояние</th></tr></thead><tbody>';
    for (var i = 0; i < gates.length; i++) {
      var g = gates[i];
      var vcls = g.verdict === 'пройден' ? 'gs--ok'
        : g.verdict === 'условно пройден' ? 'gs--warn'
        : g.verdict === 'не пройден' || g.verdict === 'заблокирован' ? 'gs--risk'
        : g.verdict === 'не применим' ? 'gs--muted' : 'gs--open';
      html += '<tr class="' + vcls + '">' +
        '<th scope="row">' + esc(gateName(g.id)) + ' <span class="gid">(' + esc(g.id) + ')</span></th>' +
        '<td>' + esc(g.answered) + ' / ' + esc(g.total) + '</td>' +
        '<td>' + (g.open.length ? esc(g.open.length) : '—') + '</td>' +
        '<td><span class="gs-badge">' + esc(GV_LABEL[g.verdict] || g.verdict) + '</span></td>' +
        '</tr>';
    }
    html += '</tbody></table></div>';
    return html;
  }

  function llmBlock(llm) {
    if (!llm || !llm.text) return '';
    return '<section class="llm-summary">' +
      '<h2>Краткое резюме</h2>' +
      '<p class="llm-tag">Сформировано локальной моделью ' + esc(llm.model || 'не указана') +
      ' · ' + esc(llm.generatedAt || '') + '</p>' +
      '<div class="llm-text">' + llmParagraphs(llm.text) + '</div>' +
      '<p class="llm-caveat">Текст резюме сгенерирован моделью и требует прочтения человеком. ' +
      'Числа, вердикт и состав находок в этом отчёте рассчитаны программой и моделью не изменялись.</p>' +
      '</section>';
  }

  function llmParagraphs(text) {
    var parts = String(text).split(/\n{2,}/);
    var out = '';
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i].trim();
      if (!p) continue;
      if (/^[-•*]\s/.test(p) || /^\d+[.)]\s/.test(p)) {
        var lines = p.split(/\n/), items = '';
        for (var j = 0; j < lines.length; j++) {
          var l = lines[j].trim();
          if (!l) continue;
          items += '<li>' + esc(l.replace(/^[-•*]\s*/, '').replace(/^\d+[.)]\s*/, '')) + '</li>';
        }
        out += '<ul>' + items + '</ul>';
      } else {
        out += '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>';
      }
    }
    return out;
  }

  /* ------------------------------------------------------ реестр находок */

  function photoPlate(photoId, photos, caption) {
    var rec = photos && photos[photoId];
    if (!rec || !rec.dataUrl) {
      return '<figure class="plate plate--missing">' +
        '<p class="plate-missing">Фото ' + esc(photoId) + ' не найдено в хранилище</p>' +
        (caption ? '<figcaption>' + esc(caption) + '</figcaption>' : '') +
        '</figure>';
    }
    return '<figure class="plate">' +
      '<img src="' + escAttr(rec.dataUrl) + '" alt="' + escAttr(caption || photoId) + '" loading="lazy">' +
      '<figcaption>' + esc(caption || photoId) +
      (rec.w ? ' <span class="plate-dim">' + esc(rec.w) + '×' + esc(rec.h) + ' px</span>' : '') +
      '</figcaption></figure>';
  }

  function findingCard(f, photos, idx) {
    var sevCls = f.sev === 'B' ? 'sev--B' : f.sev === 'C' ? 'sev--C' : 'sev--W';
    var stCls = f.status === 'closed' ? 'fs--closed'
      : f.status === 'contained' ? 'fs--contained' : 'fs--open';
    var html = '<article class="finding" id="finding-' + esc(f.id) + '">' +
      '<header class="finding-head">' +
      '<span class="finding-num">' + esc(idx) + '</span>' +
      '<h3>' + esc(f.title || 'Без названия') + '</h3>' +
      '<span class="sev ' + sevCls + '" title="' + esc(SEV_LABEL[f.sev] || f.sev) + '">' +
      esc(f.sev) + '</span>' +
      '<span class="fstatus ' + stCls + '">' + esc(FINDING_STATUS_LABEL[f.status] || f.status) + '</span>' +
      '</header>';

    var rows = [
      ['Шаг', f.stepId + ' · ' + gateName(f.gateId)],
      ['Что наблюдается', f.desc],
      ['Нормативный документ', (f.std || '—') + (f.clause ? ', ' + f.clause : '')],
      ['Доказательство', f.evidence],
      ['Причина', f.cause],
      ['Локализация', f.containment],
      ['Корректирующее действие', f.action],
      ['Владелец', f.owner],
      ['Срок', f.due],
      ['Записал', f.by + (f.ts ? ' · ' + fmtDate(f.ts) : '')]
    ];
    html += '<div class="tbl-wrap"><table class="tbl finding-fields"><tbody>';
    for (var i = 0; i < rows.length; i++) {
      if (rows[i][1] === '' || rows[i][1] == null) continue;
      html += '<tr><th scope="row">' + esc(rows[i][0]) + '</th><td>' + dash(rows[i][1]) + '</td></tr>';
    }
    html += '</tbody></table></div>';

    if (f.photos && f.photos.length) {
      html += '<div class="plates">';
      for (var p = 0; p < f.photos.length; p++) {
        html += photoPlate(f.photos[p], photos, 'Фото ' + (p + 1) + ' из ' + f.photos.length);
      }
      html += '</div>';
    }
    return html + '</article>';
  }

  function findingsRegister(project, ex, photos) {
    var findings = AC.findingsOf(project);
    if (!findings.length) {
      return '<h2>Реестр находок</h2>' +
        '<p class="muted">Находок не зафиксировано. Это не означает отсутствия проблем — ' +
        'только то, что ни одна проблема не была внесена в реестр.</p>';
    }
    var html = '<h2>Реестр находок</h2>' +
      '<p class="muted">Всего находок: ' + esc(findings.length) +
      ' · открытых: ' + esc(ex.openFindings.length) +
      ' (уровня B: ' + esc(ex.openB.length) + ', уровня C: ' + esc(ex.openC.length) +
      ', уровня W: ' + esc(ex.openW.length) + ')</p>';

    // Сортируем: серьёзность, затем статус, затем дата.
    var order = { B: 0, C: 1, W: 2, N: 3 };
    var sorted = findings.slice().sort(function (a, b) {
      if (order[a.sev] !== order[b.sev]) return order[a.sev] - order[b.sev];
      var sa = a.status === 'open' ? 0 : a.status === 'contained' ? 1 : 2;
      var sb = b.status === 'open' ? 0 : b.status === 'contained' ? 1 : 2;
      if (sa !== sb) return sa - sb;
      return (b.ts || 0) - (a.ts || 0);
    });

    for (var i = 0; i < sorted.length; i++) {
      html += findingCard(sorted[i], photos, i + 1);
    }
    return html;
  }

  /* --------------------------------------------------- сводка открытых */

  function openItemsBlock(ex) {
    var items = ex.openFindings;
    if (!items.length) {
      return '<h2>Открытые позиции</h2>' +
        '<p class="muted">Открытых находок нет.</p>';
    }
    var html = '<h2>Открытые позиции</h2>' +
      '<div class="tbl-wrap"><table class="tbl open-items">' +
      '<caption class="sr-only">Открытые позиции</caption>' +
      '<thead><tr><th scope="col">Уровень</th><th scope="col">Находка</th>' +
      '<th scope="col">Гейт</th><th scope="col">Владелец</th><th scope="col">Срок</th>' +
      '<th scope="col">Статус</th></tr></thead><tbody>';
    var order = { B: 0, C: 1, W: 2, N: 3 };
    var sorted = items.slice().sort(function (a, b) { return order[a.sev] - order[b.sev]; });
    for (var i = 0; i < sorted.length; i++) {
      var f = sorted[i];
      html += '<tr class="oi--' + esc(f.sev) + '">' +
        '<td><span class="sev sev--' + esc(f.sev) + '">' + esc(f.sev) + '</span></td>' +
        '<td>' + esc(f.title || f.id) + '</td>' +
        '<td>' + esc(f.gateId) + '</td>' +
        '<td>' + dash(f.owner) + '</td>' +
        '<td>' + dash(f.due) + '</td>' +
        '<td>' + esc(FINDING_STATUS_LABEL[f.status] || f.status) + '</td>' +
        '</tr>';
    }
    return html + '</tbody></table></div>';
  }

  /* ------------------------------------------- приложение: поэтапно */

  function appendixBlock(project, checklist, photos) {
    var ix = indexChecklist(checklist);
    var cl = ix.cl, stepsById = ix.stepsById;
    var st = project.st || {};
    var note = project.note || {};
    var loc = project.loc || {};
    var gateNA = project.gateNA || {};
    var cls = String((project.meta || {}).ipcClass || '3');

    var html = '<h2>Приложение. Поэтапный проход</h2>' +
      '<p class="muted">Каждый шаг чек-листа, его статус, критерий приёмки для класса ' +
      esc(cls) + ' и записанные при проверке данные. Это доказательство полноты прохода: ' +
      'шаг без ответа виден как неотвеченный.</p>';

    for (var gi = 0; gi < cl.gates.length; gi++) {
      var gid = cl.gates[gi].id;
      var steps = cl.gates[gi].steps;
      var isNA = !!gateNA[gid];
      html += '<section class="appendix-gate' + (isNA ? ' gate--na' : '') + '" id="appendix-' +
        esc(gid) + '"><h3>' + esc(gateName(gid)) +
        ' <span class="gid">(' + esc(gid) + ')</span>' +
        (isNA ? ' <span class="gs-badge">не применим</span>' : '') + '</h3>';

      if (!steps.length) { html += '<p class="muted">шагов нет</p></section>'; continue; }

      html += '<table class="table steps"><caption class="sr-only">Шаги гейта ' +
        esc(gid) + '</caption><thead><tr><th scope="col">Шаг</th><th scope="col">Требование</th>' +
        '<th scope="col">Критерий</th><th scope="col">Норма</th>' +
        '<th scope="col">Статус</th><th scope="col">Запись</th></tr></thead><tbody>';

      for (var si = 0; si < steps.length; si++) {
        var key = steps[si].key;
        var raw = stepsById[key] || {};
        var status = st[key];
        var statusCell;
        if (isNA) statusCell = '<span class="badge badge--muted">не применим</span>';
        else if (status === 'ok') statusCell = '<span class="badge badge--ok">Соответствует</span>';
        else if (status === 'risk') statusCell = '<span class="badge badge--risk">Риск</span>';
        else if (status === 'na') statusCell = '<span class="badge badge--muted">Не применим</span>';
        else statusCell = '<span class="badge badge--open">не отвечено</span>';

        var crit = (raw.crit && (raw.crit[cls] != null && raw.crit[cls] !== ''
          ? raw.crit[cls] : (raw.crit['2'] != null ? raw.crit['2'] : raw.crit['3']))) || '—';
        if (raw.crit && raw.crit[cls] == null && raw.crit['2'] != null && cls !== '2') {
          crit += ' <span class="muted">(критерий класса 2 — критерия класса ' +
            esc(cls) + ' в чек-листе нет)</span>';
        }

        var record = [note[key], loc[key]].filter(function (x) { return x && String(x).trim(); });
        var sevChip = raw.s ? ' <span class="sev sev--' + esc(raw.s) + '">' + esc(raw.s) + '</span>' : '';
        var unverified = raw.v !== 1 && raw.std ? ' <span class="chip chip--unreviewed">не сверено</span>' : '';

        html += '<tr class="step step--' + esc(status || 'unanswered') + '">' +
          '<td class="step-id">' + esc(key) + sevChip + unverified + '</td>' +
          '<td>' + esc(raw.t || '—') + '</td>' +
          '<td>' + esc(crit) + '</td>' +
          '<td>' + dash(raw.std) + '</td>' +
          '<td>' + statusCell + '</td>' +
          '<td>' + (record.length ? esc(record.join(' · ')) : '—') + '</td>' +
          '</tr>';
      }
      html += '</tbody></table></section>';
    }
    return html;
  }

  /* -------------------------------------------------------- подписи */

  function signoffBlock(project, generated) {
    var roles = ['Технолог процесса', 'ОТК', 'Производство', 'Инженер NPI'];
    var html = '<section class="signoff"><h2>Подписи</h2>' +
      '<div class="tbl-wrap"><table class="tbl signoff-table">' +
      '<thead><tr><th scope="col">Функция</th>' +
      '<th scope="col">Фамилия и имя</th><th scope="col">Подпись</th>' +
      '<th scope="col">Дата</th></tr></thead><tbody>';
    for (var i = 0; i < roles.length; i++) {
      html += '<tr><th scope="row">' + esc(roles[i]) + '</th>' +
        '<td class="sig-blank"></td><td class="sig-blank"></td><td class="sig-blank"></td></tr>';
    }
    html += '</tbody></table></div>' +
      '<p class="muted">Отчёт сформирован ' + esc(generated) +
      '. Вердикт и состав находок определены программой; подписи подтверждают ' +
      'ознакомление, а не пересчёт.</p></section>';
    return html;
  }

  function honestNotes() {
    return '<section class="notes"><h2>О чём этот отчёт не говорит</h2><ul>' +
      '<li>Числовой критерий, помеченный «не сверено», не проверялся по первоисточнику ' +
      'и не должен применяться как требование. Сверьте его с действующей редакцией нормы ' +
      'до подписания.</li>' +
      '<li>Отсутствие находки в реестре означает, что проблема не была внесена. ' +
      'Это не доказательство её отсутствия.</li>' +
      '<li>Статус «Соответствует» означает, что исполнитель так ответил. Доказательством ' +
      'служат приложенные фото, измерения и документы, а не сам статус.</li>' +
      '<li>Отчёт не заменяет первую партию, измерение возможности процесса и подписи ' +
      'ответственных функций.</li>' +
      '</ul></section>';
  }

  /* ------------------------------------------------------ публичный API */

  /**
   * buildReportHtml(project, checklist, opts) -> HTML-строка.
   * Чистая функция: не трогает DOM, не изменяет project/checklist.
   * opts: { threshold?:number, now?:number|Date, photos?:{id:{dataUrl,w,h}},
   *         llm?:{text,model,generatedAt} }
   */
  function buildReportHtml(project, checklist, opts) {
    if (!AC) throw new Error('report.js: NpiCore не загружен');
    if (!project || typeof project !== 'object') {
      throw new TypeError('buildReportHtml: project должен быть объектом');
    }
    opts = opts || {};
    var threshold = typeof opts.threshold === 'number' && isFinite(opts.threshold)
      ? opts.threshold : AC.DEFAULT_THRESHOLD;
    var photos = opts.photos || {};
    var now = opts.now instanceof Date ? opts.now : new Date(opts.now != null ? opts.now : Date.now());
    var generated = isNaN(now.getTime()) ? new Date().toISOString() : now.toISOString();

    var ex = AC.explainProject(project, checklist, { threshold: threshold });
    var m = project.meta || {};

    var html = '<article class="report">';
    html += coverBlock(project, ex, generated);
    html += verdictBlock(project, ex);
    html += llmBlock(opts.llm);
    html += summaryBlock(ex);
    html += openItemsBlock(ex);
    html += findingsRegister(project, ex, photos);
    html += appendixBlock(project, checklist, photos);
    html += signoffBlock(project, generated);
    html += honestNotes();
    html += '<footer class="report-foot">' +
      '<p>Чек-лист ' + esc((root.NPI && root.NPI.version) || '—') +
      ' · ' + esc(root.NPI && root.NPI.title ? root.NPI.title : '') + '</p>' +
      '</footer>';
    return html + '</article>';
  }

  /*
   * Таблица стилей отчёта. Одна на весь документ: и для предпросмотра в
   * приложении, и для exportDocument. Светлая, печатная, с одним акцентом
   * и семантическими цветами уровней. Внешних шрифтов и картинок нет —
   * документ остаётся самодостаточным.
   *
   * Порядок правил значим: сначала общее, потом частные случаи. Так цвет
   * плашки внутри тёмной обложки не зависит от того, чья специфичность
   * окажется выше, — частное правило просто идёт позже.
   */
  function reportCss() {
    return `/* ============================================================
   Оформление отчёта NPI — дизайн-система курса.

   Те же токены, что у курса: GitHub-dark navy #0D1117 + tech-grid,
   единственный сигнальный тил #53d1cc, IBM Plex Sans/Serif/Mono,
   стеклянные панели rgba(15,23,34,.78) с blur(18px), радиусы
   14/20/28, тень 0 24px 60px rgba(0,0,0,.28).

   Отчёт — отдельный документ, поэтому токены объявлены здесь заново:
   курс грузит IBM Plex с Google Fonts, а отчёт обязан работать без
   сети. Системный стек в --font даёт то же начертание там, где шрифт
   установлен, и предсказуемую замену там, где нет.

   Печать — светлая, ровно как у курса: тёмный экран, белая бумага.
   ============================================================ */

:root{
  --bg:#0D1117; --bg2:#0D1117;
  --panel:rgba(15,23,34,.78); --panel2:rgba(12,17,25,.94); --strong:rgba(12,17,25,.94);
  --line:rgba(146,165,185,.18); --line2:rgba(146,165,185,.3);
  --txt:#edf2f7; --mut:#94a3b8; --dim:#94a3b8; --body:#cbd5e1;
  --signal:#53d1cc; --signal-hover:#3fb8b4; --signal-light:#53d1cc;
  --green:#4caf50; --green-d:#3d8b40;
  --orange:#ff9800; --red:#f44336; --yellow:#ff9800;
  --shadow:0 24px 60px rgba(0,0,0,.28);
  --r-sm:14px; --r-md:20px; --r-lg:28px;
  --font:'IBM Plex Sans',-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
  --serif:'IBM Plex Serif',Georgia,'Times New Roman',serif;
  --mono:'IBM Plex Mono','SF Mono',Consolas,Menlo,monospace;
  --sh-1:0 12px 32px -10px rgba(0,0,0,.45);
  --sh-2:0 24px 60px rgba(0,0,0,.28);
  --ease:cubic-bezier(.22,.8,.3,1);
}

*{box-sizing:border-box}

body{
  margin:0;font-family:var(--font);background-color:var(--bg);color:var(--txt);
  line-height:1.65;font-size:16px;-webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
::selection{background:rgba(83,209,204,.35);color:#fff}

/* tech-grid — фирменный фон, тот же, что у курса */
main{
  max-width:1000px;margin:0 auto;padding:48px 40px 80px;
  background-image:
    linear-gradient(rgba(83,209,204,.03) 1px,transparent 1px),
    linear-gradient(90deg,rgba(83,209,204,.03) 1px,transparent 1px);
  background-size:60px 60px;
}

/* Корень документа: он же рамка предпросмотра в приложении. */
.report{display:block}

p{margin:12px 0;color:var(--body)}
a{color:var(--signal);text-decoration:none}
strong{color:#fff;font-weight:650}

.sr-only{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;
  clip:rect(0 0 0 0);white-space:nowrap;border:0}
.muted{color:var(--mut)}

/* ------------------------------------------------------ типографика */

h1{font-family:var(--serif);font-size:clamp(30px,4vw,42px);line-height:1.15;margin:12px 0 16px;
   font-weight:600;letter-spacing:-.015em;color:#fff}
h1::after{content:"";display:block;width:64px;height:3px;margin-top:20px;border-radius:2px;
  background:linear-gradient(90deg,var(--signal),transparent)}
h2{font-family:var(--serif);font-size:28px;margin:44px 0 16px;font-weight:600;
   letter-spacing:-.01em;color:#fff}
h2::before{content:"";display:block;width:44px;height:3px;margin-bottom:16px;border-radius:2px;
  background:linear-gradient(90deg,var(--signal),transparent)}
h2:first-child{margin-top:0}
h3{font-size:20px;margin:28px 0 12px;font-weight:700;letter-spacing:-.01em;color:#fff}
h4{font-size:14px;margin:24px 0 8px;color:var(--signal-light);font-weight:700;letter-spacing:.01em}
ul,ol{margin:12px 0;padding-left:24px}
li{margin:8px 0;color:var(--body)}
li::marker{color:var(--signal)}

code{font-family:var(--mono);font-size:14px;background:rgba(83,209,204,.07);
  border:1px solid var(--line);padding:2px 8px;border-radius:8px;color:var(--signal-light)}

.kicker{font-family:var(--mono);font-size:12px;font-weight:600;letter-spacing:.18em;
  text-transform:uppercase;color:var(--signal);margin:0 0 8px;display:flex;
  align-items:center;gap:12px}
.kicker::before{content:"";width:26px;height:2px;background:var(--signal);border-radius:2px}

.gid{font-family:var(--mono);font-size:12px;color:var(--mut);font-weight:400}

/* ---------------------------------------------------------- обложка */

.cover{position:relative;border-radius:var(--r-lg);overflow:hidden;border:1px solid var(--line);
  box-shadow:var(--sh-2);margin:8px 0 28px;padding:36px 36px 32px;
  background:linear-gradient(160deg,rgba(18,51,58,.55) 0%,var(--panel) 55%,var(--panel2) 100%)}
.cover::after{content:"";position:absolute;right:-70px;top:-70px;width:260px;height:260px;
  border-radius:50%;border:1px solid rgba(83,209,204,.14)}
.cover h1{margin:0}
.cover-sub{color:var(--body);font-size:16px;max-width:60ch;margin:0}

/* ---------------------------------------------- таблица (общая) */

.tbl-wrap{background:var(--panel);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
  border:1px solid var(--line);border-radius:var(--r-md);overflow:hidden;margin:24px 0;
  box-shadow:var(--sh-1)}
table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
.tbl-wrap caption{font-family:var(--mono);font-size:12px;font-weight:600;text-transform:uppercase;
  letter-spacing:.08em;color:var(--signal);text-align:left;padding:16px 20px 0}
thead th{font-family:var(--mono);font-size:12px;font-weight:600;text-transform:uppercase;
  letter-spacing:.06em;color:var(--mut);text-align:left;padding:12px 20px;
  background:rgba(83,209,204,.05);border-bottom:1px solid var(--line)}
tbody th,tbody td{font-size:14px;color:var(--body);padding:12px 20px;border-bottom:1px solid var(--line);
  text-align:left;vertical-align:top;font-weight:400}
tbody th{color:#fff;font-weight:600}
tbody tr{transition:background .15s}
tbody tr:hover{background:rgba(83,209,204,.04)}
tbody tr:last-child td,tbody tr:last-child th{border-bottom:none}

/* ------------------------------------------------ вердикт (баннер) */

.verdict-banner{border-radius:var(--r-md);padding:20px 24px;margin:24px 0;font-size:14px;
  position:relative;border:1px solid var(--line);box-shadow:var(--sh-1);overflow:hidden}
.verdict-banner::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3.5px}
.vb--ok{background:rgba(76,175,80,.07);border-color:rgba(76,175,80,.32)}
.vb--ok::before{background:var(--green)}
.vb--warn{background:rgba(255,152,0,.07);border-color:rgba(255,152,0,.32)}
.vb--warn::before{background:var(--orange)}
.vb--risk{background:rgba(244,67,54,.06);border-color:rgba(244,67,54,.3)}
.vb--risk::before{background:var(--red)}
.vb--muted{background:rgba(255,255,255,.03);border-color:var(--line2)}
.vb--muted::before{background:var(--mut)}

.verdict-row{display:flex;align-items:baseline;gap:16px;flex-wrap:wrap;margin:0 0 14px}
.verdict-badge{font-family:var(--serif);font-size:30px;font-weight:600;letter-spacing:-.015em;
  line-height:1.1;color:#fff}
.vb-badge--ok{color:var(--green)}
.vb-badge--warn{color:var(--orange)}
.vb-badge--risk{color:var(--red)}
.vb-badge--muted{color:var(--mut)}
.coverage-line{color:var(--mut);font-family:var(--mono);font-size:12px;
  font-variant-numeric:tabular-nums}

.verdict-why{display:inline-block;font-size:12px;font-weight:800;letter-spacing:.15em;
  text-transform:uppercase;margin:0 0 8px;padding:4px 12px;border-radius:99px;
  font-family:var(--mono);background:rgba(255,255,255,.06);color:var(--mut)}
.reasons{margin:0;padding-left:24px;font-size:14px}
.reasons li{margin:8px 0}
.reasons-empty{margin:0;font-size:14px;color:var(--body)}
.verdict-rule{margin:16px 0 0;font-size:12px;color:var(--dim);line-height:1.6;
  border-top:1px solid var(--line);padding-top:12px}

/* --------------------------------------------- полоса покрытия */

.cov{margin:0 0 16px}
.progress{height:8px;border-radius:99px;background:rgba(255,255,255,.07);overflow:hidden;
  border:1px solid var(--line)}
.progress span{display:block;height:100%;border-radius:99px;
  background:linear-gradient(90deg,var(--signal),var(--signal-light))}
.progress-line{font-family:var(--mono);font-size:12px;color:var(--mut);margin:20px 0 8px}
.cov-num{font-family:var(--mono);font-size:12px;color:var(--mut);margin:10px 0 0;
  font-variant-numeric:tabular-nums}

/* ---------------------------------------------------- резюме модели */

.llm-summary{border-radius:var(--r-md);padding:16px 20px;margin:24px 0;font-size:14px;
  position:relative;border:1px solid rgba(83,209,204,.3);background:rgba(83,209,204,.07);
  overflow:hidden;box-shadow:var(--sh-1)}
.llm-summary::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3.5px;
  background:var(--signal)}
.llm-tag{font-family:var(--mono);font-size:12px;color:var(--mut);margin:0 0 9px}
.llm-text p{margin:12px 0;font-size:14px}
.llm-text ul{margin:12px 0;padding-left:24px;font-size:14px}
.llm-caveat{font-size:12px;color:var(--dim);margin:12px 0 0;line-height:1.6;
  border-top:1px solid var(--line);padding-top:10px}

/* ------------------------------------------------------ плашки */

.chip{display:inline-flex;align-items:center;font-family:var(--mono);font-size:12px;font-weight:600;
  letter-spacing:.04em;padding:4px 12px;border-radius:99px;border:1px solid var(--line2);
  color:var(--mut);background:rgba(255,255,255,.03)}
.chip--unreviewed{color:var(--orange);border-color:rgba(255,152,0,.4);background:rgba(255,152,0,.08)}

.badge{font-family:var(--mono);font-size:12px;font-weight:600;padding:4px 16px;border-radius:99px;
  border:1px solid var(--line2);background:rgba(13,17,23,.55);color:var(--txt);white-space:nowrap}
.badge--ok{color:var(--green);border-color:rgba(76,175,80,.45);background:rgba(76,175,80,.08)}
.badge--risk{color:var(--red);border-color:rgba(244,67,54,.45);background:rgba(244,67,54,.08)}
.badge--muted{color:var(--mut);border-color:var(--line2);background:rgba(255,255,255,.03)}
.badge--open{color:var(--orange);border-color:rgba(255,152,0,.4);background:rgba(255,152,0,.08)}

/* серьёзность — залитый блок, читается боковым зрением в длинном реестре */
.sev{display:inline-flex;align-items:center;justify-content:center;min-width:30px;
  font-family:var(--mono);font-size:12px;font-weight:700;padding:3px 10px;border-radius:9px;
  color:#0D1117;letter-spacing:.04em;line-height:1.4}
.sev--B{background:var(--red);color:#fff}
.sev--C{background:var(--orange);color:#0D1117}
.sev--W{background:var(--line2);color:var(--txt)}

/* состояния гейтов */
.gs-badge{font-family:var(--mono);font-size:12px;font-weight:600;padding:4px 16px;
  border-radius:99px;border:1px solid var(--line2);background:rgba(13,17,23,.55);
  color:var(--txt);white-space:nowrap}
.gs--ok .gs-badge{color:var(--green);border-color:rgba(76,175,80,.45);background:rgba(76,175,80,.08)}
.gs--warn .gs-badge{color:var(--orange);border-color:rgba(255,152,0,.4);background:rgba(255,152,0,.08)}
.gs--risk .gs-badge,.gs--open .gs-badge{color:var(--red);border-color:rgba(244,67,54,.45);
  background:rgba(244,67,54,.08)}
.gs--muted .gs-badge{color:var(--mut);border-color:var(--line2);background:rgba(255,255,255,.03)}

/* строки таблиц по состоянию */
.gate-summary tbody tr.gs--ok{background:rgba(76,175,80,.05)}
.gate-summary tbody tr.gs--warn{background:rgba(255,152,0,.05)}
.gate-summary tbody tr.gs--risk,.gate-summary tbody tr.gs--open{background:rgba(244,67,54,.05)}
.gate-summary tbody tr.gs--muted{background:rgba(255,255,255,.02)}
.open-items tbody tr.oi--B{background:rgba(244,67,54,.05)}
.open-items tbody tr.oi--C{background:rgba(255,152,0,.05)}
.open-items tbody tr.oi--W,.open-items tbody tr.oi--N{background:rgba(255,255,255,.02)}
.step--unanswered td{background:rgba(255,152,0,.05)}
.step--risk td{background:rgba(244,67,54,.05)}

/* --------------------------------------------------- реестр находок */

.finding{background:var(--panel);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
  border:1px solid var(--line);border-radius:var(--r-lg);padding:24px 28px;margin:24px 0;
  box-shadow:var(--sh-2)}
.finding-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 16px}
.finding-head h3{margin:0;font-size:20px;flex:1 1 260px;color:#fff}
.finding-num{font-family:var(--mono);font-size:12px;font-weight:700;color:var(--signal);
  border:1px solid rgba(83,209,204,.35);border-radius:9px;padding:4px 10px;
  background:rgba(83,209,204,.08);flex:0 0 auto}
.fstatus{font-family:var(--mono);font-size:12px;font-weight:600;padding:4px 16px;border-radius:99px;
  border:1px solid var(--line2);background:rgba(13,17,23,.55);white-space:nowrap}
.fs--open{color:var(--red);border-color:rgba(244,67,54,.45);background:rgba(244,67,54,.08)}
.fs--contained{color:var(--orange);border-color:rgba(255,152,0,.4);background:rgba(255,152,0,.08)}
.fs--closed{color:var(--green);border-color:rgba(76,175,80,.45);background:rgba(76,175,80,.08)}

.finding-fields{margin:0;font-size:14px}
.finding-fields tbody th{width:24%;color:var(--signal);font-family:var(--mono);font-size:12px;
  font-weight:600;text-transform:uppercase;letter-spacing:.06em}

/* фото-плитки — как .fig--photo у курса */
.plates{display:flex;flex-wrap:wrap;gap:16px;margin:20px 0 0}
.plate{margin:0;flex:1 1 280px;max-width:340px}
.plate img{width:100%;height:auto;aspect-ratio:10/7;object-fit:cover;border-radius:14px;
  border:1px solid var(--line);display:block;background:rgba(255,255,255,.02)}
.plate figcaption{font-size:12px;color:var(--dim);margin-top:10px;font-family:var(--mono)}
.plate--missing{border:1px dashed rgba(244,67,54,.4);border-radius:var(--r-sm);padding:16px;
  background:rgba(244,67,54,.05)}
.plate-missing{color:var(--red);font-size:12px;margin:0;font-family:var(--mono)}

/* --------------------------------------------- приложение по гейтам */

.appendix-gate{background:var(--panel);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
  border:1px solid var(--line);border-radius:var(--r-md);overflow:hidden;margin:24px 0;
  box-shadow:var(--sh-1)}
.appendix-gate > h3{margin:0;padding:16px 20px;background:rgba(83,209,204,.05);
  border-bottom:1px solid var(--line);font-size:16px;display:flex;align-items:center;
  gap:12px;flex-wrap:wrap}
.appendix-gate.gate--na{background:rgba(255,255,255,.02)}
.appendix-gate table{margin:0}
.steps{font-size:12px}
.steps th,.steps td{padding:10px 16px}
.steps thead th{padding:12px 16px}
.step-id{font-family:var(--mono);font-size:12px;white-space:nowrap;color:var(--signal);
  font-weight:600}

/* -------------------------------------------------- подписи, примечания */

.signoff-table td.sig-blank{height:48px}
.signoff-table tbody th{width:22%;color:var(--signal);font-family:var(--mono);font-size:12px;
  font-weight:600;text-transform:uppercase;letter-spacing:.06em}

.notes{border-radius:var(--r-sm);padding:16px 20px;margin:20px 0;display:flex;gap:12px;
  border:1px solid var(--line);background:rgba(255,255,255,.02)}
.notes h2{font-size:20px;margin:0 0 8px}
.notes ul{margin:9px 0 0;padding-left:24px;font-size:14px}
.notes li{margin:8px 0;line-height:1.6}

.report-foot{margin-top:44px;padding-top:20px;border-top:1px solid var(--line);
  font-family:var(--mono);font-size:12px;color:var(--dim);display:flex;
  justify-content:space-between;gap:14px;flex-wrap:wrap}

/* ------------------------------------------------------------ печать */

/* Тёмный экран, белая бумага — тот же приём, что у курса. Все панели и
   заливки снимаются, иначе принтер рисует чёрные прямоугольники. */
@media print{
  @page{size:A4;margin:14mm 13mm}
  body{background:#fff;color:#000;font-size:11pt}
  main{max-width:none;padding:0;background-image:none}
  h1,h2,h3,.finding-head h3,tbody th,.badge,.gs-badge,.chip,.sev,.fstatus,
  .finding-num,.kicker,.cover-kicker,.step-id,.finding-fields tbody th,
  .signoff-table tbody th,.gid,.report-foot{color:#000!important}
  .cover,.verdict-banner,.llm-summary,.finding,.appendix-gate,.tbl-wrap,.notes{
    background:#fff!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
    box-shadow:none!important;border-color:#cbd5e1!important
  }
  .cover::after,.verdict-banner::before,.llm-summary::before{display:none!important}
  .cover h1::after,h2::before{background:#333!important}
  .verdict-badge{color:#000!important}
  thead th{background:#f1f5f9!important;color:#000!important;border-color:#cbd5e1!important}
  tbody th,tbody td{border-color:#dbe3ea!important;color:#000!important}
  tbody tr:hover{background:transparent!important}
  .gate-summary tbody tr.gs--ok,.gate-summary tbody tr.gs--warn,
  .gate-summary tbody tr.gs--risk,.gate-summary tbody tr.gs--open,
  .gate-summary tbody tr.gs--muted,.open-items tbody tr.oi--B,
  .open-items tbody tr.oi--C,.open-items tbody tr.oi--W,.open-items tbody tr.oi--N,
  .step--unanswered td,.step--risk td{background:transparent!important}
  .sev--B,.sev--C,.sev--W{background:#e2e8f0!important;color:#000!important;
    border:1px solid #94a3b8!important}
  .plate img{border-radius:0;aspect-ratio:auto}
  h2,h3{page-break-after:avoid;break-after:avoid}
  .finding,.plate,.appendix-gate,.verdict-banner,.llm-summary,.signoff,.notes,tr{
    page-break-inside:avoid;break-inside:avoid
  }
}`;
  }

  /** Обратная совместимость: раньше вся таблица стилей звалась printCss. */
  function printCss() { return reportCss(); }

  /**
   * exportDocument(project, checklist, opts) -> полный standalone HTML-документ.
   * Те же opts, что у buildReportHtml. Фото встроены как data URL, поэтому
   * документ самодостаточен и печатается в PDF без внешних файлов.
   */
  function exportDocument(project, checklist, opts) {
    opts = opts || {};
    var meta = (project && project.meta) || {};
    var title = (meta.product || 'Изделие') + ' — отчёт NPI';
    return '<!doctype html>\n<html lang="ru">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>' + esc(title) + '</title>\n<style>\n' + reportCss() +
      '\n</style>\n</head>\n<body>\n<main>\n' +
      buildReportHtml(project, checklist, opts) +
      '\n</main>\n</body>\n</html>\n';
  }

  root.Report = {
    esc: esc,
    buildReportHtml: buildReportHtml,
    exportDocument: exportDocument,
    reportCss: reportCss,
    printCss: printCss,
    GATE_NAMES: GATE_NAMES,
    SEV_LABEL: SEV_LABEL,
    FINDING_STATUS_LABEL: FINDING_STATUS_LABEL,
    STATUS_LABEL: STATUS_LABEL,
    GV_LABEL: GV_LABEL
  };
})(typeof globalThis !== 'undefined' ? globalThis
  : typeof window !== 'undefined' ? window
  : typeof global !== 'undefined' ? global
  : this);
