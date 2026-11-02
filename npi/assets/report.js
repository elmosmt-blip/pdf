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
 *   Report.printCss()                                -> светлая тема + печать
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
      '<span class="verdict-badge vb-badge--' + cls.slice(3) + '">' + esc(v) + '</span>' +
      '<span class="coverage-line">Покрытие ' + fmtPct(ex.coverage.percent) + ' % (' +
      esc(ex.coverage.answered) + ' из ' + esc(ex.coverage.total) + ' применимых шагов)' +
      ' · порог ' + esc(ex.threshold) + ' %</span>' +
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

  function printCss() {
    return [
      'body{font-family:"Segoe UI","Helvetica Neue",Arial,sans-serif;color:#111;background:#fff;margin:0;line-height:1.45}',
      'main{max-width:960px;margin:0 auto;padding:24px}',
      'h1{font-size:1.6rem;margin:0 0 6px}h2{font-size:1.2rem;margin:28px 0 10px;padding-bottom:4px;border-bottom:2px solid #111}',
      'h3{font-size:1rem;margin:22px 0 8px}',
      'a{color:#000;text-decoration:none}',
      '.sr-only{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}',
      '.muted{color:#555}.gid{color:#777;font-weight:400;font-size:.85em}',
      'table{border-collapse:collapse;width:100%;margin:0 0 16px;font-size:.86rem}',
      'th,td{border:1px solid #999;padding:6px 8px;text-align:left;vertical-align:top}',
      'thead th{background:#f2f2f2}',
      '.cover{border:1px solid #111;border-radius:4px;padding:18px 20px;margin:0 0 20px}',
      '.cover-kicker{text-transform:uppercase;letter-spacing:.14em;font-size:.72rem;color:#555;margin:0 0 6px}',
      '.cover h1{margin:0 0 2px}.cover-sub{margin:0 0 14px;color:#444;font-size:.92rem}',
      '.cover-meta th{width:34%;background:#fafafa;font-weight:600}',
      '.verdict-banner{border:1px solid #999;border-left:6px solid #555;border-radius:4px;padding:14px 16px;margin:0 0 20px}',
      '.vb--ok{border-left-color:#1a7f37}.vb--warn{border-left-color:#9a6700}',
      '.vb--risk{border-left-color:#b62324}.vb--muted{border-left-color:#57606a}',
      '.verdict-row{display:flex;align-items:center;gap:14px;flex-wrap:wrap}',
      '.verdict-badge{font-size:1.15rem;font-weight:700;letter-spacing:.02em}',
      '.vb-badge--ok{color:#1a7f37}.vb-badge--warn{color:#9a6700}',
      '.vb-badge--risk{color:#b62324}.vb-badge--muted{color:#57606a}',
      '.coverage-line{color:#444;font-size:.9rem}',
      '.verdict-why{margin:12px 0 4px;font-weight:600;font-size:.88rem}',
      '.reasons{margin:6px 0 0;padding-left:22px;font-size:.88rem}',
      '.verdict-rule{margin:12px 0 0;font-size:.78rem;color:#555;border-top:1px dotted #999;padding-top:8px}',
      '.llm-summary{border:1px dashed #999;border-radius:4px;padding:12px 14px;margin:0 0 20px}',
      '.llm-tag{font-size:.76rem;color:#555;margin:0 0 8px;font-family:ui-monospace,Menlo,Consolas,monospace}',
      '.llm-text p{margin:0 0 8px}.llm-text ul{margin:0 0 8px;padding-left:22px}',
      '.llm-caveat{font-size:.78rem;color:#555;margin:8px 0 0;border-top:1px dotted #999;padding-top:8px}',
      '.gate-summary tbody tr.gs--ok{background:#f2fbf3}',
      '.gate-summary tbody tr.gs--warn{background:#fffaf0}',
      '.gate-summary tbody tr.gs--risk,.gate-summary tbody tr.gs--open{background:#fff5f5}',
      '.gate-summary tbody tr.gs--muted{background:#f6f8fa;color:#555}',
      '.gs-badge{display:inline-block;border:1px solid #555;border-radius:999px;padding:1px 9px;font-size:.76rem;font-weight:600;white-space:nowrap}',
      '.gs--ok .gs-badge{border-color:#1a7f37;color:#1a7f37}',
      '.gs--warn .gs-badge{border-color:#9a6700;color:#9a6700}',
      '.gs--risk .gs-badge{border-color:#b62324;color:#b62324}',
      '.gs--muted .gs-badge{border-color:#57606a;color:#57606a}',
      '.open-items tbody tr.oi--B{background:#fff5f5}.open-items tbody tr.oi--C{background:#fffaf0}',
      '.badge{display:inline-block;border:1px solid #555;border-radius:999px;padding:1px 9px;font-size:.76rem;font-weight:600;white-space:nowrap}',
      '.badge--ok{border-color:#1a7f37;color:#1a7f37}.badge--risk{border-color:#b62324;color:#b62324}',
      '.badge--muted{border-color:#57606a;color:#57606a}.badge--open{border-style:dashed;border-color:#9a6700;color:#9a6700}',
      '.sev{display:inline-block;border:1px solid #555;border-radius:4px;padding:0 6px;font-size:.74rem;font-weight:700;margin-left:4px}',
      '.sev--B{border-color:#b62324;color:#b62324}.sev--C{border-color:#9a6700;color:#9a6700}',
      '.sev--W{border-color:#57606a;color:#57606a}',
      '.chip{display:inline-block;border:1px solid #999;border-radius:999px;padding:0 8px;font-size:.7rem;color:#444}',
      '.chip--unreviewed{color:#9a6700;border-color:#9a6700}',
      '.finding{border:1px solid #999;border-radius:4px;padding:12px 14px;margin:0 0 14px}',
      '.finding-head{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin:0 0 8px}',
      '.finding-head h3{margin:0;font-size:1rem;flex:1 1 260px}',
      '.finding-num{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.8rem;color:#555}',
      '.fstatus{font-size:.76rem;border:1px solid #999;border-radius:999px;padding:1px 9px;color:#444}',
      '.fs--open{border-color:#b62324;color:#b62324}.fs--contained{border-color:#9a6700;color:#9a6700}',
      '.fs--closed{border-color:#1a7f37;color:#1a7f37}',
      '.finding-fields th{width:26%;background:#fafafa;font-weight:600}',
      '.plates{display:flex;flex-wrap:wrap;gap:10px;margin:10px 0 0}',
      '.plate{margin:0;flex:1 1 300px;max-width:340px}',
      '.plate img{width:100%;height:auto;border:1px solid #999;border-radius:3px;display:block}',
      '.plate figcaption{font-size:.74rem;color:#555;margin-top:4px}',
      '.plate--missing{border:1px dashed #b62324;padding:10px}',
      '.plate-missing{color:#b62324;font-size:.8rem;margin:0}',
      '.appendix-gate{border:1px solid #ddd;border-radius:4px;padding:10px 12px;margin:0 0 14px}',
      '.appendix-gate.gate--na{background:#f6f8fa}',
      '.steps{font-size:.78rem}',
      '.steps td,.steps th{padding:4px 6px}',
      '.step--unanswered td{background:#fffaf0}',
      '.step--risk td{background:#fff5f5}',
      '.step-id{white-space:nowrap;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.72rem}',
      '.signoff-table td.sig-blank{height:34px}',
      '.notes{border:1px solid #999;border-radius:4px;padding:12px 14px;background:#fafafa}',
      '.notes ul{margin:8px 0 0;padding-left:22px;font-size:.84rem}',
      '.report-foot{margin-top:24px;border-top:1px solid #999;padding-top:8px;font-size:.76rem;color:#555}',
      '@media print{@page{size:A4;margin:14mm 12mm}main{max-width:none;padding:0}',
      'h2,h3{page-break-after:avoid}.finding,.plate,.appendix-gate,tr,.verdict-banner,.llm-summary{page-break-inside:avoid;break-inside:avoid}',
      'a{color:#000;text-decoration:none}.notes{background:#fff}}'
    ].join('\n');
  }

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
      '<title>' + esc(title) + '</title>\n<style>\n' + printCss() +
      '\n</style>\n</head>\n<body>\n<main>\n' +
      buildReportHtml(project, checklist, opts) +
      '\n</main>\n</body>\n</html>\n';
  }

  root.Report = {
    esc: esc,
    buildReportHtml: buildReportHtml,
    exportDocument: exportDocument,
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
