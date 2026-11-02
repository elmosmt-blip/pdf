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
      '<p class="cover-kicker">NPI · вывод нового изделия в производство</p>' +
      '<h1>' + dash(m.product || 'Изделие без названия') + '</h1>' +
      '<p class="cover-sub">Отчёт о прохождении чек-листа NPI · SMT и THT</p>' +
      '<table class="table cover-meta"><caption class="sr-only">Идентификация изделия</caption><tbody>';
    for (var i = 0; i < rows.length; i++) {
      html += '<tr><th scope="row">' + esc(rows[i][0]) + '</th><td>' + dash(rows[i][1]) + '</td></tr>';
    }
    return html + '</tbody></table></header>';
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
      '<div class="cov-track"><div class="cov-fill" style="width:' +
      Math.max(0, Math.min(100, ex.coverage.percent)) + '%"></div></div>' +
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
      '<table class="table gate-summary"><caption class="sr-only">Состояние гейтов</caption>' +
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
    html += '</tbody></table>';
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
    html += '<table class="table finding-fields"><tbody>';
    for (var i = 0; i < rows.length; i++) {
      if (rows[i][1] === '' || rows[i][1] == null) continue;
      html += '<tr><th scope="row">' + esc(rows[i][0]) + '</th><td>' + dash(rows[i][1]) + '</td></tr>';
    }
    html += '</tbody></table>';

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
      '<table class="table open-items"><caption class="sr-only">Открытые позиции</caption>' +
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
    return html + '</tbody></table>';
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
      '<table class="table signoff-table"><thead><tr><th scope="col">Функция</th>' +
      '<th scope="col">Фамилия и имя</th><th scope="col">Подпись</th>' +
      '<th scope="col">Дата</th></tr></thead><tbody>';
    for (var i = 0; i < roles.length; i++) {
      html += '<tr><th scope="row">' + esc(roles[i]) + '</th>' +
        '<td class="sig-blank"></td><td class="sig-blank"></td><td class="sig-blank"></td></tr>';
    }
    html += '</tbody></table>' +
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
   Оформление отчёта NPI.

   Светлое, печатное. Один акцент и семантические цвета уровней.
   Внешних шрифтов и картинок нет — документ самодостаточен.

   Порядок правил имеет значение: сначала общее, потом частные случаи.
   Так плашка внутри тёмной обложки не зависит от того, чья специфичность
   окажется выше, — частное правило просто идёт позже.
   ============================================================ */

*{box-sizing:border-box}

:root{
  --ink:#0b1f2d; --ink-2:#1c3242; --body:#35485a;
  --muted:#6d8090; --faint:#94a5b2;
  --hair:#dbe3ea;
  --tint:#f5f8fa; --surf:#ffffff;
  --acc:#0d6b7c; --acc-d:#095260;
  --b:#a51d1d; --b-bg:#fdf2f2; --b-br:#ecc4c4;
  --c:#8a5a08; --c-bg:#fdf8ec; --c-br:#ecd9ac;
  --w:#55697a; --w-bg:#f3f6f8; --w-br:#d5dee5;
  --ok:#166f3c; --ok-bg:#eef8f2; --ok-br:#b6d9c3;
  --mono:ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,"Liberation Mono",monospace;
}

/* ------------------------------------------------------------- основа */

body{
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  font-size:14px;line-height:1.5;color:var(--body);background:#eef2f5;margin:0;
  -webkit-font-smoothing:antialiased;
}

main{max-width:1000px;margin:0 auto;padding:34px 30px 48px;background:var(--surf);
     box-shadow:0 1px 3px rgba(11,31,45,.06),0 18px 48px rgba(11,31,45,.07)}

/* Корень документа: он же рамка предпросмотра в приложении. */
.report{display:block}

p{margin:0 0 10px}
a{color:var(--acc);text-decoration:none}
strong{color:var(--ink-2)}

.sr-only{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;
  clip:rect(0 0 0 0);white-space:nowrap;border:0}
.muted{color:var(--muted)}
.gid{color:var(--faint);font-weight:400;font-size:.86em;font-family:var(--mono)}

/* ---------------------------------------------------- общее: заголовки */

h2{font-size:17px;font-weight:700;color:var(--ink);letter-spacing:-.012em;
   margin:36px 0 14px;padding-bottom:9px;border-bottom:1px solid var(--hair);position:relative}
h2::after{content:"";position:absolute;left:0;bottom:-1px;width:48px;height:2px;background:var(--acc)}
h2:first-child{margin-top:0}
h3{font-size:13.5px;font-weight:700;color:var(--ink-2);margin:22px 0 9px;letter-spacing:-.005em}

/* ------------------------------------------------------ общее: таблицы */

table{width:100%;border-collapse:collapse;margin:0 0 18px;font-size:12.5px;
      font-variant-numeric:tabular-nums}

thead th{
  background:var(--acc);color:#fff;font-weight:600;font-size:10.5px;text-align:left;
  text-transform:uppercase;letter-spacing:.075em;padding:9px 11px;border:1px solid var(--acc-d);
  vertical-align:bottom;
}
tbody th,tbody td{border:1px solid var(--hair);padding:7px 11px;text-align:left;vertical-align:top}
tbody th{font-weight:600;color:var(--ink-2);background:var(--tint);width:26%}
tbody tr:nth-child(even) td{background:#fbfcfd}

/* ------------------------------------------------ общее: плашки статуса */

.badge{display:inline-block;padding:2px 9px;font-size:10.5px;font-weight:600;border-radius:3px;
       white-space:nowrap;letter-spacing:.01em}
.badge--ok{color:var(--ok);background:var(--ok-bg)}
.badge--risk{color:var(--b);background:var(--b-bg)}
.badge--muted{color:var(--w);background:var(--w-bg)}
.badge--open{color:var(--c);background:var(--c-bg)}

.sev{display:inline-block;min-width:24px;text-align:center;padding:2px 7px;font-size:11px;
     font-weight:800;border-radius:3px;color:#fff;letter-spacing:.05em;line-height:1.35}
.sev--B{background:var(--b)}
.sev--C{background:var(--c)}
.sev--W{background:var(--w)}

.chip{display:inline-block;padding:1px 7px;font-size:10px;border-radius:3px;color:var(--c);
      background:var(--c-bg);font-weight:600;letter-spacing:.02em}

/* ------------------------------------------------------------- обложка */

.cover{
  background:linear-gradient(135deg,#073d49 0%,#0a5666 48%,#0f7386 100%);
  color:#fff;border-radius:5px;padding:30px 34px 26px;position:relative;overflow:hidden;
}
.cover::after{
  content:"";position:absolute;right:-60px;top:-60px;width:230px;height:230px;
  border-radius:50%;background:rgba(255,255,255,.05);
}
.cover-kicker{
  text-transform:uppercase;letter-spacing:.16em;font-size:10.5px;font-weight:600;
  color:rgba(255,255,255,.72);margin:0 0 10px;
}
.cover h1{margin:0 0 4px;font-size:29px;font-weight:700;letter-spacing:-.022em;line-height:1.15}
.cover-sub{margin:0;color:rgba(255,255,255,.8);font-size:13.5px}

.cover-meta{margin:20px 0 0;font-size:12.5px;border-collapse:collapse;width:100%;
            font-variant-numeric:tabular-nums}
.cover-meta tbody tr:nth-child(even) td{background:transparent}
.cover-meta th,.cover-meta td{
  border:0;border-top:1px solid rgba(255,255,255,.15);padding:7px 10px;width:auto;
  background:transparent;color:#fff;font-weight:500;text-align:left;vertical-align:top;
}
.cover-meta th{width:29%;background:rgba(255,255,255,.07);color:rgba(255,255,255,.66)}

/* -------------------------------------------------------------- вердикт */

.verdict-banner{
  border:1px solid var(--w-br);border-left:5px solid var(--w);
  background:var(--w-bg);border-radius:5px;padding:20px 22px 18px;margin:22px 0 0;
}
/* Варианты раскрыты явно, без косвенных переменных: вердикт — самый важный
   элемент документа, и его цвет не должен зависеть от каскада переменных. */
.vb--ok{border-color:var(--ok-br);border-left-color:var(--ok);background:var(--ok-bg)}
.vb--warn{border-color:var(--c-br);border-left-color:var(--c);background:var(--c-bg)}
.vb--risk{border-color:var(--b-br);border-left-color:var(--b);background:var(--b-bg)}
.vb--muted{border-color:var(--w-br);border-left-color:var(--w);background:var(--w-bg)}

.verdict-row{display:flex;align-items:baseline;gap:16px;flex-wrap:wrap;margin:0 0 12px}
.verdict-badge{font-size:23px;font-weight:800;letter-spacing:-.015em;color:var(--ink-2);
               line-height:1.1}
.vb-badge--ok{color:var(--ok)}.vb-badge--warn{color:var(--c)}
.vb-badge--risk{color:var(--b)}.vb-badge--muted{color:var(--w)}
.coverage-line{color:var(--ink-2);font-size:12.5px;font-variant-numeric:tabular-nums}

.cov{margin:0 0 14px}
.cov-track{height:9px;background:rgba(11,31,45,.09);border-radius:99px;overflow:hidden}
.cov-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--acc-d),#1596ab)}
.cov-num{font-size:11px;color:var(--muted);margin:6px 0 0;font-variant-numeric:tabular-nums;
         letter-spacing:.02em}

.verdict-why{margin:0 0 6px;font-weight:700;font-size:12px;color:var(--ink-2);
             text-transform:uppercase;letter-spacing:.07em}
.reasons{margin:0;padding-left:20px;font-size:13px}
.reasons li{margin:0 0 4px}
.reasons-empty{margin:0;font-size:13px;color:var(--ink-2)}
.verdict-rule{margin:16px 0 0;font-size:11.5px;color:var(--muted);line-height:1.55;
              border-top:1px solid var(--hair);padding-top:11px}

/* -------------------------------------------------------- резюме модели */

.llm-summary{border:1px solid var(--hair);border-left:4px solid var(--acc);border-radius:5px;
             padding:15px 17px;margin:20px 0 0;background:var(--tint)}
.llm-tag{font-family:var(--mono);font-size:10.5px;color:var(--muted);margin:0 0 9px;
         letter-spacing:.01em}
.llm-text p{margin:0 0 9px;font-size:13px}
.llm-text ul{margin:0 0 9px;padding-left:20px;font-size:13px}
.llm-caveat{font-size:11.5px;color:var(--muted);margin:11px 0 0;line-height:1.55;
            border-top:1px solid var(--hair);padding-top:10px}

/* -------------------------------------------- частные случаи: таблицы */

.gate-summary tbody tr.gs--ok{background:var(--ok-bg)}
.gate-summary tbody tr.gs--warn{background:var(--c-bg)}
.gate-summary tbody tr.gs--risk,.gate-summary tbody tr.gs--open{background:var(--b-bg)}
.gate-summary tbody tr.gs--muted{background:var(--w-bg)}
.gs-badge{display:inline-block;padding:2px 10px;font-size:11px;font-weight:600;border-radius:99px;
          white-space:nowrap;letter-spacing:.01em;background:#fff}
.gs--ok .gs-badge{color:var(--ok);box-shadow:inset 0 0 0 1px var(--ok-br)}
.gs--warn .gs-badge{color:var(--c);box-shadow:inset 0 0 0 1px var(--c-br)}
.gs--risk .gs-badge,.gs--open .gs-badge{color:var(--b);box-shadow:inset 0 0 0 1px var(--b-br)}
.gs--muted .gs-badge{color:var(--w);box-shadow:inset 0 0 0 1px var(--w-br)}

.open-items tbody tr.oi--B{background:var(--b-bg)}
.open-items tbody tr.oi--C{background:var(--c-bg)}
.open-items tbody tr.oi--W,.open-items tbody tr.oi--N{background:var(--w-bg)}

.finding-fields tbody th{width:24%}
.finding-fields tbody tr:nth-child(even) td{background:transparent}

/* ------------------------------------------------------- реестр находок */

.finding{border:1px solid var(--hair);border-radius:5px;margin:0 0 18px;overflow:hidden;
         background:var(--surf);box-shadow:0 1px 2px rgba(11,31,45,.04)}
.finding-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:11px 15px;
              background:var(--tint);border-bottom:1px solid var(--hair)}
.finding-head h3{margin:0;font-size:14px;flex:1 1 240px;color:var(--ink);letter-spacing:-.008em}
.finding-num{font-family:var(--mono);font-size:10.5px;color:var(--muted);background:var(--surf);
             border:1px solid var(--hair);border-radius:3px;padding:1px 7px;font-weight:600}
.fstatus{font-size:10.5px;padding:2px 10px;border-radius:99px;font-weight:600;white-space:nowrap;
         letter-spacing:.02em}
.fs--open{color:var(--b);border:1px solid var(--b-br);background:var(--b-bg)}
.fs--contained{color:var(--c);border:1px solid var(--c-br);background:var(--c-bg)}
.fs--closed{color:var(--ok);border:1px solid var(--ok-br);background:var(--ok-bg)}
.finding-fields{margin:0;font-size:12.5px}

.plates{display:flex;flex-wrap:wrap;gap:13px;padding:14px 15px 4px}
.plate{margin:0;flex:1 1 250px;max-width:320px}
.plate img{width:100%;height:auto;display:block;border:1px solid var(--hair);border-radius:3px;
           background:#fff}
.plate figcaption{font-size:10.5px;color:var(--muted);margin-top:6px;
                  font-variant-numeric:tabular-nums}
.plate--missing{border:1px dashed var(--b-br);border-radius:3px;padding:12px;background:var(--b-bg)}
.plate-missing{color:var(--b);font-size:11.5px;margin:0}

/* ------------------------------------------------- приложение по гейтам */

.appendix-gate{border:1px solid var(--hair);border-radius:5px;margin:0 0 16px;overflow:hidden}
.appendix-gate > h3{margin:0;padding:9px 13px;background:var(--tint);
                    border-bottom:1px solid var(--hair);font-size:13px;
                    display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.appendix-gate.gate--na{background:var(--w-bg)}
.appendix-gate table{margin:0;border:0}
.appendix-gate thead th{background:var(--ink-2);border-color:var(--ink)}

.steps{font-size:11.5px}
.steps th,.steps td{padding:5px 9px}
.steps thead th{padding:7px 9px}
.step-id{font-family:var(--mono);font-size:10.5px;white-space:nowrap;color:var(--ink-2)}
.step--unanswered td{background:var(--c-bg)}
.step--risk td{background:var(--b-bg)}

/* -------------------------------------------------- подписи и примечания */

.signoff-table td.sig-blank{height:42px;background:#fcfdfe}
.signoff-table tbody th{width:22%}

.notes{border:1px solid var(--hair);border-radius:5px;padding:15px 17px;background:var(--tint)}
.notes h2{margin-top:0}
.notes ul{margin:9px 0 0;padding-left:20px;font-size:12.5px}
.notes li{margin:0 0 6px;line-height:1.55}

.report-foot{margin-top:36px;padding-top:13px;border-top:2px solid var(--hair);
             font-size:11px;color:var(--muted);display:flex;justify-content:space-between;
             gap:14px;flex-wrap:wrap;letter-spacing:.01em}

/* ---------------------------------------------------------------- печать */

@media print{
  @page{size:A4;margin:14mm 13mm}
  body{background:#fff;font-size:11pt}
  main{max-width:none;padding:0;box-shadow:none}
  .cover,.cover::after,thead th,.gs-badge,.badge,.sev,.cov-fill{
    -webkit-print-color-adjust:exact;print-color-adjust:exact
  }
  h2,h3{page-break-after:avoid;break-after:avoid}
  .finding,.plate,.appendix-gate,.verdict-banner,.llm-summary,.signoff,.notes,tr{
    page-break-inside:avoid;break-inside:avoid
  }
  .finding{box-shadow:none}
  a{color:var(--ink);text-decoration:none}
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
