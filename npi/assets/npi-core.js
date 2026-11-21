/* =========================================================================
 * NPI Checklist — assets/npi-core.js
 *
 * Чистая логика решений для модели состояния NPI. БЕЗ DOM, БЕЗ Node API,
 * БЕЗ браузерных API — запускается одинаково с file:// в браузере и внутри
 * голого VM realm в Node (см. tests/npi-core.test.js).
 *
 * Экспортирует единственную глобаль: NpiCore
 *
 * ГЛАВНОЕ ПРАВИЛО, унаследованное от аудитора и проверенное на практике:
 * вердикт, серьёзность, покрытие и блокировка гейта считает КОД. LLM никогда
 * не выставляет статус шагу, не назначает серьёзность и не принимает решение
 * о выпуске. LLM выдаёт только черновик текста, который человек правит.
 * ========================================================================= */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------- константы */

  var DEFAULT_THRESHOLD = 100;   // для выпуска в серию отвечены все применимые шаги

  var VERDICT = Object.freeze({
    NOT_RELEASED: 'НЕ ВЫПУСКАЕМ',
    CONDITIONAL: 'УСЛОВНЫЙ ВЫПУСК',
    IN_PROGRESS: 'В РАБОТЕ',
    READY: 'ГОТОВ К СЕРИИ'
  });

  // Вердикт одного гейта
  var GATE_VERDICT = Object.freeze({
    BLOCKED: 'заблокирован',
    OPEN: 'открыт',
    CONDITIONAL: 'условно пройден',
    NOT_RELEASED: 'не пройден',
    RELEASED: 'пройден',
    NA: 'не применим'
  });

  var STATUSES = Object.freeze(['ok', 'risk', 'na']);   // отсутствие ключа = не отвечено
  var SEVERITIES = Object.freeze(['B', 'C', 'W', 'N']);
  var FINDING_STATUS = Object.freeze(['open', 'contained', 'closed']);
  var ROLES = Object.freeze(['npi', 'design', 'process', 'material', 'equipment', 'people', 'quality']);
  var EVIDENCE = Object.freeze(['file', 'photo', 'data', 'none']);

  var GATE_ID_RE = /^g\d{1,2}$/;
  var STEP_ID_RE = /^g\d{1,2}-\d{2,3}$/;
  var FINDING_ID_RE = /^f-\d{1,9}$/;
  var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  var TOP_KEYS = ['v', 'activeId', 'projects'];
  var PROJECT_KEYS = ['meta', 'gateNA', 'st', 'note', 'loc', 'findings', 'checklistVersion', 'ts'];
  var META_KEYS = ['product', 'rev', 'pn', 'customer', 'ipcClass', 'alloy', 'line',
    'engineer', 'start', 'target'];
  var FINDING_KEYS = ['id', 'stepId', 'gateId', 'title', 'desc', 'sev', 'std', 'clause',
    'evidence', 'photos', 'cause', 'containment', 'action', 'owner', 'due', 'status',
    'by', 'ts'];

  /* ---------------------------------------------------------------- helpers */

  var proto = Object.prototype;

  function hasOwn(obj, key) { return proto.hasOwnProperty.call(obj, key); }
  function ownKeys(obj) { return Object.keys(obj); }
  function isArray(v) { return Array.isArray(v); }

  function isPlainObject(v) {
    if (v === null || typeof v !== 'object' || isArray(v)) return false;
    var p = Object.getPrototypeOf(v);
    if (p === null || p === proto) return true;
    return Object.getPrototypeOf(p) === null;
  }

  // Отсекаем вектор загрязнения прототипа и не-имена ключей.
  function isSafeKey(key) {
    if (typeof key !== 'string' || key === '') return false;
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return false;
    if (key.indexOf('__') === 0) return false;
    return true;
  }

  function isStatus(v) { return v === 'ok' || v === 'risk' || v === 'na'; }
  function isFiniteNumber(v) { return typeof v === 'number' && isFinite(v); }

  function describeVal(v) {
    if (v === null) return 'null';
    if (isArray(v)) return 'array';
    if (typeof v === 'string') return JSON.stringify(v);
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (typeof v === 'undefined') return 'undefined';
    return typeof v;
  }

  function inList(list, v) {
    for (var i = 0; i < list.length; i++) if (list[i] === v) return true;
    return false;
  }

  function gateOfStepId(stepId) {
    if (typeof stepId !== 'string') return null;
    var i = stepId.indexOf('-');
    return i > 0 ? stepId.slice(0, i) : null;
  }

  /* ------------------------------------------------------- нормализация чек-листа
   *
   * Принимает чек-лист в любом из эквивалентных видов и приводит к
   * [{ key, gate, id, s }]:
   *   A. { gates: [ { id:'g0', steps:[{id:'g0-01', s:'B'}] } ] }   (data.js / NPI)
   *   B. { g0: [{ id:'g0-01', s:'B' }] }                            (карта гейтов)
   *   C. [ { gate:'g0', id:'g0-01', s:'B' } ]                       (плоский список)
   *   D. { 'g0-01': 'B' }                                           (карта серьёзностей)
   *   E. { 'g0-01': { s:'B' } }                                     (карта объектов)
   * Серьёзность может быть написана как `s` или как `severity`.
   */
  /**
   * Серьёзность шага или находки. Принимает три написания имени поля:
   * `s` (как в данных чек-листа), `sev` (как в находках) и `severity`.
   * Неизвестное или отсутствующее значение -> '' (зовите с собственным
   * значением по умолчанию, если оно нужно).
   *
   * ПОЧЕМУ ТРИ ИМЕНИ: находки исторически писались как `sev`, а шаги
   * чек-листа — как `s`. Пока нормализатор знал только `s` и `severity`,
   * находка с `sev:'B'` молча превращалась в значение по умолчанию 'C' —
   * блокирующая находка становилась условной, и вердикт не менялся.
   * Тихие промахи приведения — самый дорогой класс дефектов здесь.
   */
  function severityOf(raw) {
    var s = raw.s != null ? raw.s : (raw.sev != null ? raw.sev : raw.severity);
    if (typeof s !== 'string') return '';
    s = s.charAt(0).toUpperCase();
    return inList(SEVERITIES, s) ? s : '';
  }

  var SHORT_ID_RE = /^\d{2,3}$/;

  function pushItem(out, gate, id, rawItem, explicitKey) {
    var raw = rawItem || {};
    var key = explicitKey != null ? explicitKey
      : (typeof raw.key === 'string' ? raw.key : null);
    var s = severityOf(raw);
    var rawId = id;

    if (key != null) {
      if (typeof key !== 'string' || !STEP_ID_RE.test(key)) {
        throw new TypeError('шаги чек-листа: недопустимый ключ шага ' + describeVal(key) +
          ' (ожидается ' + STEP_ID_RE.source + ')');
      }
      if (gate == null) gate = gateOfStepId(key);
      if (id == null) id = key;
    } else {
      if (typeof gate !== 'string' || !GATE_ID_RE.test(gate)) {
        throw new TypeError('шаги чек-листа: недопустимый гейт ' + describeVal(gate));
      }
      // Короткий id (только цифры) допустим, когда гейт известен явно:
      // карта гейтов { g0: [{ id:'01' }] } — удобная форма для импорта.
      if (typeof id === 'string' && SHORT_ID_RE.test(id)) {
        id = gate + '-' + id;
      }
      if (typeof id !== 'string' || !STEP_ID_RE.test(id)) {
        throw new TypeError('шаги чек-листа: недопустимый id шага ' + describeVal(rawId) +
          ' (ожидается ' + STEP_ID_RE.source + ' или ' + SHORT_ID_RE.source + ')');
      }
      // Карта гейтов вида { g0: [{ id:'g0-01' }] } даёт уже полный id —
      // не склеиваем префикс второго раза.
      if (id.indexOf(gate + '-') !== 0) id = gate + '-' + id;
      key = id;
    }
    out.push({ key: key, gate: gate, id: id, s: s });
  }

  function normalizeItems(src) {
    var out = [];
    if (src == null || src === false) return out;

    if (isArray(src)) {
      for (var i = 0; i < src.length; i++) {
        var el = src[i];
        if (!isPlainObject(el)) {
          throw new TypeError('шаги чек-листа[' + i + ']: ожидался объект, получено ' + describeVal(el));
        }
        pushItem(out, el.gate != null ? el.gate : el.gateId, el.id, el);
      }
      return dedupeItems(out);
    }

    if (isPlainObject(src)) {
      var keys = ownKeys(src);
      for (var k = 0; k < keys.length; k++) {
        var key = keys[k];
        if (!isSafeKey(key)) {
          throw new TypeError('шаги чек-листа: небезопасный ключ ' + describeVal(key));
        }
        var val = src[key];
        if (typeof val === 'string') {
          pushItem(out, null, null, { s: val }, key);
        } else if (isArray(val)) {
          for (var m = 0; m < val.length; m++) {
            var mi = val[m];
            if (!isPlainObject(mi)) {
              throw new TypeError('шаги чек-листа[' + key + '][' + m + ']: ожидался объект');
            }
            pushItem(out, key, mi.id, mi);
          }
        } else if (isPlainObject(val)) {
          if (STEP_ID_RE.test(key) && val.id == null) {
            pushItem(out, null, null, val, key);
          } else {
            pushItem(out, key, val.id, val);
          }
        } else {
          throw new TypeError('шаги чек-листа[' + key + ']: неподдерживаемая запись ' + describeVal(val));
        }
      }
      return dedupeItems(out);
    }

    throw new TypeError('шаги чек-листа: ожидался массив или объект, получено ' + describeVal(src));
  }

  /**
   * Собрать шаги одной группы гейта в плоский список с проставленным гейтом.
   * Шаг в данных несёт только `id`; гейт приходит из родительской группы.
   */
  function stepsWithGate(gateId, steps) {
    var out = [];
    if (!isArray(steps)) {
      throw new TypeError('шаги чек-листа гейта ' + describeVal(gateId) +
        ': ожидался массив шагов, получено ' + describeVal(steps));
    }
    for (var i = 0; i < steps.length; i++) {
      var el = steps[i];
      if (!isPlainObject(el)) {
        throw new TypeError('шаги чек-листа гейта ' + describeVal(gateId) +
          '[' + i + ']: ожидался объект, получено ' + describeVal(el));
      }
      out.push({
        gate: gateId,
        gateId: gateId,
        id: el.id,
        s: el.s != null ? el.s : el.severity,
        key: el.key
      });
    }
    return normalizeItems(out);
  }

  function dedupeItems(items) {
    var seen = {}, out = [];
    for (var i = 0; i < items.length; i++) {
      if (hasOwn(seen, items[i].key)) out[seen[items[i].key]] = items[i];
      else { seen[items[i].key] = out.length; out.push(items[i]); }
    }
    return out;
  }

  /**
   * Единая точка входа для «мне нужны шаги чек-листа».
   *
   * Вызывающий код постоянно передаёт сюда и полный объект чек-листа
   * ({ version, title, roles, gates }), и карту гейтов, и плоский список.
   * Пока нормализация получала объект как есть, она считала его картой
   * серьёзностей и падала на служебном ключе `version` — computeCoverage
   * с полным чек-листом просто не работал. Поэтому раскрытие `.gates`
   * живёт здесь, а не в каждом вызывающем.
   */
  function itemsOf(src) {
    if (src && isPlainObject(src) && isArray(src.gates)) {
      return normalizeChecklist(src).items;
    }
    return normalizeItems(src);
  }

  /**
   * normalizeChecklist(checklist) -> { gates:[{id, steps:[{key,gate,id,s}]}],
   *                                    items:[...], byGate:{gid:[...]} }
   * Принимает как NPI (data.js), так и любую эквивалентную форму.
   */
  function normalizeChecklist(checklist) {
    var raw = checklist;
    if (raw && isPlainObject(raw) && isArray(raw.gates)) {
      var gates = [];
      for (var i = 0; i < raw.gates.length; i++) {
        var g = raw.gates[i];
        if (!isPlainObject(g)) {
          throw new TypeError('checklist.gates[' + i + ']: ожидался объект');
        }
        var gid = g.id != null ? g.id : g.gateId;
        if (typeof gid !== 'string' || !GATE_ID_RE.test(gid)) {
          throw new TypeError('checklist.gates[' + i + ']: недопустимый гейт ' + describeVal(gid));
        }
        gates.push({ id: gid, steps: stepsWithGate(gid, g.steps != null ? g.steps : g.items) });
      }
      return indexGates(gates);
    }
    // Карта гейтов или плоский список — собираем через normalizeItems.
    var items = normalizeItems(raw);
    var byGate = {};
    for (var j = 0; j < items.length; j++) {
      var it = items[j];
      if (!hasOwn(byGate, it.gate)) byGate[it.gate] = [];
      byGate[it.gate].push(it);
    }
    var glist = [];
    var gids = ownKeys(byGate).sort();
    for (var q = 0; q < gids.length; q++) glist.push({ id: gids[q], steps: byGate[gids[q]] });
    return indexGates(glist);
  }

  function indexGates(gates) {
    var byGate = {};
    var items = [];
    for (var i = 0; i < gates.length; i++) {
      byGate[gates[i].id] = gates[i].steps;
      for (var j = 0; j < gates[i].steps.length; j++) items.push(gates[i].steps[j]);
    }
    return { gates: gates, items: items, byGate: byGate };
  }

  /* ----------------------------------------------------------------- findings */

  function normalizeFinding(f, idx) {
    var out = {
      id: typeof f.id === 'string' ? f.id : '',
      stepId: typeof f.stepId === 'string' ? f.stepId : '',
      gateId: typeof f.gateId === 'string' ? f.gateId : gateOfStepId(f.stepId),
      title: typeof f.title === 'string' ? f.title : '',
      desc: typeof f.desc === 'string' ? f.desc : '',
      sev: severityOf(f) || 'C',
      std: typeof f.std === 'string' ? f.std : '',
      clause: typeof f.clause === 'string' ? f.clause : '',
      evidence: typeof f.evidence === 'string' ? f.evidence : '',
      photos: isArray(f.photos) ? f.photos.filter(function (p) { return typeof p === 'string'; }) : [],
      cause: typeof f.cause === 'string' ? f.cause : '',
      containment: typeof f.containment === 'string' ? f.containment : '',
      action: typeof f.action === 'string' ? f.action : '',
      owner: typeof f.owner === 'string' ? f.owner : '',
      due: typeof f.due === 'string' ? f.due : '',
      status: inList(FINDING_STATUS, f.status) ? f.status : 'open',
      by: typeof f.by === 'string' ? f.by : '',
      ts: isFiniteNumber(f.ts) ? f.ts : 0
    };
    if (!out.id) out.id = 'f-' + String(idx + 1);
    return out;
  }

  function findingsOf(project) {
    var src = (project && project.findings) || [];
    if (!isArray(src)) return [];
    var out = [];
    for (var i = 0; i < src.length; i++) {
      if (!isPlainObject(src[i])) continue;
      out.push(normalizeFinding(src[i], i));
    }
    return out;
  }

  function openFindings(findings) {
    return findings.filter(function (f) { return f.status !== 'closed'; });
  }

  function findingsForGate(findings, gateId) {
    return findings.filter(function (f) { return f.gateId === gateId; });
  }

  /* ---------------------------------------------------------------- покрытие */

  /**
   * coverageOf(project, items) -> { answered, total, percent, excluded }
   * total считает только шаги, чей гейт не отмечен N/A в project.gateNA.
   * percent с одной десятичной, без раздувания.
   */
  function coverageOf(project, items) {
    var st = (project && project.st) || {};
    var gateNA = (project && project.gateNA) || {};
    var total = 0, answered = 0, excluded = 0;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.gate && gateNA[it.gate]) { excluded++; continue; }
      total++;
      if (isStatus(st[it.key])) answered++;
    }
    var percent = total > 0 ? Math.floor((answered / total) * 1000) / 10
      : (items.length > 0 ? 100 : 0);
    return { answered: answered, total: total, percent: percent, excluded: excluded };
  }

  function computeCoverage(project, stageItems) {
    return coverageOf(project, itemsOf(stageItems));
  }

  /* ------------------------------------------------------------ состояние гейта */

  /**
   * gateState(project, gateId, items, findings) ->
   *   { id, answered, total, percent, open, openB, openC, openW,
   *     blocked, verdict, done }
   *
   * blocked — предыдущий применимый гейт не пройден и не условно пройден.
   * done    — гейт можно считать закрытым и разблокировать следующий.
   */
  function gateState(project, gateId, items, findings) {
    var gateItems = [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].gate === gateId) gateItems.push(items[i]);
    }
    var gateNA = (project && project.gateNA) || {};
    var cov = coverageOf(project, gateItems);
    var gf = findingsForGate(findings, gateId);
    var open = openFindings(gf);
    var openB = open.filter(function (f) { return f.sev === 'B'; });
    var openC = open.filter(function (f) { return f.sev === 'C'; });
    var openW = open.filter(function (f) { return f.sev === 'W'; });

    var verdict, blocked = false, done = false;

    if (gateNA[gateId]) {
      verdict = GATE_VERDICT.NA;
      done = true;
    } else if (openB.length > 0) {
      // Блокирующая находка: гейт непройден, и он запирает все следующие.
      verdict = GATE_VERDICT.NOT_RELEASED;
    } else if (cov.percent < 100) {
      // Проход неполон: гейт открыт, следующий не начинается.
      verdict = GATE_VERDICT.OPEN;
    } else if (openC.length > 0) {
      // Проход полон, блокирующих находок нет, но есть открытая уровня C.
      // Гейт пройден условно: следующий начинается, выпуск — нет.
      // Наблюдения уровня W на вердикт гейта не влияют, ровно как и на
      // вердикт по изделию.
      verdict = GATE_VERDICT.CONDITIONAL;
    } else {
      verdict = GATE_VERDICT.RELEASED;
    }

    if (verdict === GATE_VERDICT.RELEASED || verdict === GATE_VERDICT.NA ||
        verdict === GATE_VERDICT.CONDITIONAL) {
      done = true;
    }

    return {
      id: gateId, answered: cov.answered, total: cov.total, percent: cov.percent,
      open: open, openB: openB, openC: openC, openW: openW,
      blocked: blocked, verdict: verdict, done: done
    };
  }

  /**
   * gateStates(project, checklist) -> [{ id, ...gateState, blocked }]
   *
   * Принимает ПРОЕКТ, а не массив находок: находки извлекаются здесь же.
   * Так сделано намеренно. Пока сигнатура требовала массив, вызывающий код
   * передавал `[]` — и все находки молча выпадали из состояния гейтов, а
   * вердикт гейта не менялся. Тихие промахи из-за неверного аргумента —
   * самый дорогой класс дефектов здесь, поэтому лишний аргумент убран.
   *
   * Блокировка считается по порядку гейтов в чек-листе: гейт заблокирован,
   * если предыдущий применимый гейт не закрыт.
   */
  function gateStates(project, checklist) {
    var cl = normalizeChecklist(checklist);
    var findings = findingsOf(project);
    var out = [];
    var prevDone = true;   // первый гейт никогда не заблокирован
    for (var i = 0; i < cl.gates.length; i++) {
      var gid = cl.gates[i].id;
      var st = gateState(project, gid, cl.items, findings);
      if (!prevDone) {
        st.blocked = true;
        if (st.verdict === GATE_VERDICT.RELEASED) st.verdict = GATE_VERDICT.BLOCKED;
        else if (st.verdict !== GATE_VERDICT.NA) st.verdict = GATE_VERDICT.BLOCKED;
      }
      if (st.verdict === GATE_VERDICT.BLOCKED) st.done = false;
      out.push(st);
      // Гейт, отмеченный N/A, не мешает следующему.
      prevDone = st.verdict === GATE_VERDICT.NA ? true : st.done;
    }
    return out;
  }

  /* ------------------------------------------------------- вердикт по изделию */

  /**
   * explainProject(project, checklist, opts) ->
   *   { verdict, threshold, coverage, gates, openFindings, bRisks, cRisks,
   *     unknownRisks, reasons }
   *
   * Порядок решений (жёстко, без исключений):
   *   1. открытая находка уровня B или риск на шаге уровня B  -> НЕ ВЫПУСКАЕМ
   *   2. открытая находка уровня C или риск на шаге уровня C  -> УСЛОВНЫЙ ВЫПУСК
   *   3. покрытие ниже порога                                 -> В РАБОТЕ
   *   4. иначе                                                -> ГОТОВ К СЕРИИ
   *
   * Риск на шаге, которого нет в чек-листе, трактуется как уровень C:
   * неклассифицированный риск не имеет права закончиться выпуском.
   * Риск на гейте, отмеченном N/A, всё равно считается: N/A убирает шаг из
   * покрытия, но не стирает наблюдаемый риск.
   */
  function explainProject(project, checklist, opts) {
    opts = opts || {};
    var threshold = isFiniteNumber(opts.threshold) ? opts.threshold : DEFAULT_THRESHOLD;
    var cl = normalizeChecklist(checklist);
    var findings = findingsOf(project);
    var cov = coverageOf(project, cl.items);

    var sev = {};
    for (var i = 0; i < cl.items.length; i++) sev[cl.items[i].key] = cl.items[i].s;

    var st = (project && project.st) || {};
    var bRisks = [], cRisks = [], wRisks = [], unknownRisks = [];
    var keys = ownKeys(st);
    for (var k = 0; k < keys.length; k++) {
      if (st[keys[k]] !== 'risk') continue;
      var s = sev[keys[k]];
      if (s === 'B') bRisks.push(keys[k]);
      else if (s === 'C') cRisks.push(keys[k]);
      else if (s === 'W') wRisks.push(keys[k]);
      else unknownRisks.push(keys[k]);
    }

    var open = openFindings(findings);
    var openB = open.filter(function (f) { return f.sev === 'B'; });
    var openC = open.filter(function (f) { return f.sev === 'C'; });
    var openW = open.filter(function (f) { return f.sev === 'W'; });

    var reasons = [];
    if (openB.length) {
      reasons.push('открытая находка уровня B: ' + openB.map(fTitle).join('; '));
    }
    if (bRisks.length) reasons.push('риск на шаге уровня B: ' + bRisks.join(', '));
    if (openC.length) {
      reasons.push('открытая находка уровня C: ' + openC.map(fTitle).join('; '));
    }
    if (cRisks.length) reasons.push('риск на шаге уровня C: ' + cRisks.join(', '));
    if (unknownRisks.length) {
      reasons.push('риск с неопределённой серьёзностью: ' + unknownRisks.join(', '));
    }
    if (wRisks.length) {
      reasons.push('наблюдение (не блокирует): ' + wRisks.join(', '));
    }
    if (openW.length) {
      reasons.push('открытая находка уровня W (наблюдение, не блокирует): ' +
        openW.map(fTitle).join('; '));
    }
    if (cov.percent < threshold) {
      reasons.push('покрытие ' + cov.percent + ' % ниже порога ' + threshold + ' %');
    }

    var verdict;
    if (openB.length || bRisks.length) verdict = VERDICT.NOT_RELEASED;
    else if (openC.length || cRisks.length || unknownRisks.length) verdict = VERDICT.CONDITIONAL;
    else if (cov.percent < threshold) verdict = VERDICT.IN_PROGRESS;
    else verdict = VERDICT.READY;

    return {
      verdict: verdict,
      threshold: threshold,
      coverage: cov,
      gates: gateStates(project, checklist),
      openFindings: open,
      openB: openB, openC: openC, openW: openW,
      bRisks: bRisks, cRisks: cRisks, wRisks: wRisks, unknownRisks: unknownRisks,
      reasons: reasons
    };
  }

  function fTitle(f) {
    var t = (f && f.title) || (f && f.stepId) || '';
    return t ? t : String(f && f.id);
  }

  function computeVerdict(project, checklist, opts) {
    return explainProject(project, checklist, opts).verdict;
  }

  /* --------------------------------------------------------------- валидация */

  function checkObject(errors, path, value, required) {
    if (value === undefined) {
      if (required) errors.push(path + ': отсутствует');
      return null;
    }
    if (!isPlainObject(value)) {
      errors.push(path + ': ожидался объект, получено ' + describeVal(value));
      return null;
    }
    return value;
  }

  function checkItemMap(errors, path, obj, valueKind) {
    var keys = ownKeys(obj);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (!isSafeKey(key) || !STEP_ID_RE.test(key)) {
        errors.push(path + ': недопустимый ключ шага ' + describeVal(key));
        continue;
      }
      var v = obj[key];
      if (valueKind === 'status') {
        if (!isStatus(v)) errors.push(path + '.' + key + ': недопустимый статус ' + describeVal(v));
      } else if (typeof v !== 'string' && typeof v !== 'number') {
        errors.push(path + '.' + key + ': ожидалась строка, получено ' + describeVal(v));
      }
    }
  }

  function checkGateMap(errors, path, obj, kind) {
    var keys = ownKeys(obj);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (!isSafeKey(key) || !GATE_ID_RE.test(key)) {
        errors.push(path + ': неизвестный гейт ' + describeVal(key));
        continue;
      }
      var v = obj[key];
      if (kind === 'bool') {
        if (typeof v !== 'boolean') {
          errors.push(path + '.' + key + ': ожидалось логическое значение, получено ' + describeVal(v));
        }
      } else if (typeof v !== 'string' || (v !== '' && !DATE_RE.test(v))) {
        errors.push(path + '.' + key + ': ожидалась дата ГГГГ-ММ-ДД, получено ' + describeVal(v));
      }
    }
  }

  function checkUnknownKeys(errors, path, obj, allowed) {
    var keys = ownKeys(obj);
    for (var i = 0; i < keys.length; i++) {
      if (!isSafeKey(keys[i])) errors.push(path + ': небезопасный ключ ' + describeVal(keys[i]));
      else if (!inList(allowed, keys[i])) errors.push(path + ': неизвестный ключ ' + describeVal(keys[i]));
    }
  }

  function validateFinding(errors, path, f) {
    checkUnknownKeys(errors, path, f, FINDING_KEYS);
    if (!isPlainObject(f)) return;
    if (typeof f.id !== 'string' || !FINDING_ID_RE.test(f.id)) {
      errors.push(path + '.id: ожидалось ^' + FINDING_ID_RE.source + '$, получено ' + describeVal(f.id));
    }
    if (typeof f.stepId !== 'string' || !STEP_ID_RE.test(f.stepId)) {
      errors.push(path + '.stepId: ожидалось ^' + STEP_ID_RE.source + '$, получено ' + describeVal(f.stepId));
    }
    if (typeof f.gateId !== 'string' || !GATE_ID_RE.test(f.gateId)) {
      errors.push(path + '.gateId: ожидалось ^' + GATE_ID_RE.source + '$, получено ' + describeVal(f.gateId));
    }
    if (f.gateId && f.stepId && gateOfStepId(f.stepId) !== f.gateId) {
      errors.push(path + '.gateId: гейт ' + describeVal(f.gateId) +
        ' не соответствует шагу ' + describeVal(f.stepId));
    }
    if (!inList(SEVERITIES, f.sev)) {
      errors.push(path + '.sev: ожидалось B|C|W|N, получено ' + describeVal(f.sev));
    }
    if (!inList(FINDING_STATUS, f.status)) {
      errors.push(path + '.status: ожидалось open|contained|closed, получено ' + describeVal(f.status));
    }
    if (typeof f.title !== 'string' || f.title.length < 2) {
      errors.push(path + '.title: не короче 2 символов');
    }
    if (!isArray(f.photos)) errors.push(path + '.photos: ожидался массив');
    if (f.due !== '' && !DATE_RE.test(f.due)) {
      errors.push(path + '.due: ожидалась дата ГГГГ-ММ-ДД или пустая строка, получено ' + describeVal(f.due));
    }
    if (f.ts !== undefined && (!isFiniteNumber(f.ts) || f.ts < 0)) {
      errors.push(path + '.ts: ожидалось неотрицательное число');
    }
  }

  function validateProject(pid, p, errors) {
    var path = 'projects.' + pid;
    if (!isSafeKey(pid)) errors.push(path + ': небезопасный ключ проекта');
    checkUnknownKeys(errors, path, p, PROJECT_KEYS);

    var meta = checkObject(errors, path + '.meta', p.meta, true);
    if (meta) {
      var mk = ownKeys(meta);
      for (var i = 0; i < mk.length; i++) {
        if (!isSafeKey(mk[i]) || !inList(META_KEYS, mk[i])) {
          errors.push(path + '.meta: неизвестный ключ ' + describeVal(mk[i]));
          continue;
        }
        var mv = meta[mk[i]];
        var tv = typeof mv;
        if (mv !== null && tv !== 'string' && tv !== 'number' && tv !== 'boolean') {
          errors.push(path + '.meta.' + mk[i] + ': ожидалась строка, получено ' + describeVal(mv));
        }
      }
    }

    var st = checkObject(errors, path + '.st', p.st, false);
    if (st) checkItemMap(errors, path + '.st', st, 'status');

    var note = checkObject(errors, path + '.note', p.note, false);
    if (note) checkItemMap(errors, path + '.note', note, 'text');

    var loc = checkObject(errors, path + '.loc', p.loc, false);
    if (loc) checkItemMap(errors, path + '.loc', loc, 'text');

    var gateNA = checkObject(errors, path + '.gateNA', p.gateNA, false);
    if (gateNA) checkGateMap(errors, path + '.gateNA', gateNA, 'bool');

    if (p.findings !== undefined) {
      if (!isArray(p.findings)) {
        errors.push(path + '.findings: ожидался массив');
      } else {
        var seenIds = {};
        for (var j = 0; j < p.findings.length; j++) {
          if (!isPlainObject(p.findings[j])) {
            errors.push(path + '.findings[' + j + ']: ожидался объект');
            continue;
          }
          validateFinding(errors, path + '.findings[' + j + ']', p.findings[j]);
          if (seenIds[p.findings[j].id]) {
            errors.push(path + '.findings[' + j + ']: повторяющийся id ' + describeVal(p.findings[j].id));
          }
          seenIds[p.findings[j].id] = true;
        }
      }
    }

    if (p.checklistVersion !== undefined && typeof p.checklistVersion !== 'string') {
      errors.push(path + '.checklistVersion: ожидалась строка');
    }
    if (p.ts !== undefined && (!isFiniteNumber(p.ts) || p.ts < 0)) {
      errors.push(path + '.ts: ожидалось неотрицательное число');
    }
  }

  /**
   * validateImport(obj) -> { ok:boolean, errors:string[] }
   * Строгая проверка всего документа хранения ({ v:2, activeId, projects }).
   * Неизвестные ключи, не-объекты и ключи загрязнения прототипа — отказ.
   * Входные данные не изменяются.
   */
  function validateImport(obj) {
    var errors = [];
    if (!isPlainObject(obj)) {
      return { ok: false, errors: ['корень: ожидался объект, получено ' + describeVal(obj)] };
    }
    checkUnknownKeys(errors, 'корень', obj, TOP_KEYS);
    if (!hasOwn(obj, 'v')) errors.push('v: отсутствует');
    else if (obj.v !== 2) errors.push('v: ожидалось 2, получено ' + describeVal(obj.v));

    if (obj.activeId !== undefined && typeof obj.activeId !== 'string') {
      errors.push('activeId: ожидалась строка');
    }
    var projects = checkObject(errors, 'projects', obj.projects, true);
    if (projects) {
      var ids = ownKeys(projects);
      if (ids.length === 0) errors.push('projects: пусто');
      for (var i = 0; i < ids.length; i++) {
        if (!isPlainObject(projects[ids[i]])) {
          errors.push('projects.' + ids[i] + ': ожидался объект');
          continue;
        }
        validateProject(ids[i], projects[ids[i]], errors);
      }
    }
    return { ok: errors.length === 0, errors: errors };
  }

  /* ----------------------------------------------------------------- migrate */

  function safeCopy(src, filter) {
    var out = {};
    if (!isPlainObject(src)) return out;
    var keys = ownKeys(src);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (!isSafeKey(k)) continue;
      if (filter && !inList(filter, k)) continue;
      var v = src[k];
      if (v === null || typeof v !== 'object') out[k] = v;
    }
    return out;
  }

  function cloneProject(p) {
    var out = {
      meta: safeCopy(p.meta, META_KEYS),
      st: safeCopy(p.st),
      note: safeCopy(p.note),
      loc: safeCopy(p.loc),
      gateNA: safeCopy(p.gateNA),
      findings: []
    };
    if (isArray(p.findings)) {
      for (var i = 0; i < p.findings.length; i++) {
        if (!isPlainObject(p.findings[i])) continue;
        out.findings.push(normalizeFinding(p.findings[i], i));
      }
    }
    if (typeof p.checklistVersion === 'string') out.checklistVersion = p.checklistVersion;
    if (isFiniteNumber(p.ts)) out.ts = p.ts;
    return out;
  }

  function cloneV2(raw) {
    var out = { v: 2, projects: {} };
    if (typeof raw.activeId === 'string') out.activeId = raw.activeId;
    var ids = ownKeys(raw.projects);
    for (var i = 0; i < ids.length; i++) out.projects[ids[i]] = cloneProject(raw.projects[ids[i]]);
    return out;
  }

  /**
   * migrate(raw) -> документ хранения v2 (новые объекты, входные данные
   * не изменяются). Принимает v2 (проверка + клонирование) или v1 аудитора:
   *   { v:1, activeId, audits:{ <id>: { meta, st:{'print_pr-04':'ok'}, ... } } }
   * Ключи шагов аудитора формата <stage>_<item> приводятся к <gate>-<item>,
   * если stage похож на гейт; иначе шаг отбрасывается с сохранением находок.
   * На всё остальное — исключение.
   */
  function migrate(raw) {
    if (!isPlainObject(raw)) {
      throw new TypeError('migrate: ожидался объект, получено ' + describeVal(raw));
    }
    var version = raw.v;
    if (version === undefined && hasOwn(raw, 'audits')) version = 1;

    if (version === 2) {
      var check = validateImport(raw);
      if (!check.ok) throw new Error('migrate: некорректный документ v2: ' + check.errors.join('; '));
      return cloneV2(raw);
    }

    if (version === 1) {
      var audits = raw.audits;
      if (!isPlainObject(audits)) {
        throw new TypeError('migrate v1: ожидался объект audits');
      }
      var out = { v: 2, projects: {} };
      if (typeof raw.activeId === 'string') out.activeId = raw.activeId;
      var ids = ownKeys(audits);
      for (var i = 0; i < ids.length; i++) {
        var a = audits[ids[i]];
        if (!isPlainObject(a)) continue;
        var st = {}, skeys = ownKeys(a.st || {});
        for (var j = 0; j < skeys.length; j++) {
          var key = skeys[j];
          var u = key.indexOf('_');
          if (u < 1) continue;
          var gate = key.slice(0, u), item = key.slice(u + 1);
          if (!GATE_ID_RE.test(gate)) continue;              // этап аудитора — не гейт
          // Ключ аудитора вида g0_g0-01 уже несёт полный id шага — не удваиваем
          // префикс, иначе получится g0-g0-01 и шаг молча отбросится.
          var full = item.indexOf(gate + '-') === 0 ? item : gate + '-' + item;
          if (!STEP_ID_RE.test(full)) continue;
          if (!isStatus(a.st[key])) continue;
          st[full] = a.st[key];
        }
        // Аудитор называл поле stageNA — принимаем оба написания.
        var na = a.gateNA != null ? a.gateNA : a.stageNA;
        var p = {
          meta: safeCopy(a.meta, META_KEYS),
          st: st,
          note: safeCopy(a.note),
          loc: safeCopy(a.loc),
          gateNA: safeCopy(na),
          findings: [],
          ts: isFiniteNumber(a.ts) ? a.ts : 0
        };
        if (typeof a.checklistVersion === 'string') p.checklistVersion = a.checklistVersion;
        out.projects[ids[i]] = p;
      }
      var checkOut = validateImport(out);
      if (!checkOut.ok) {
        // Пустой набор проектов для migrate допустим, но validateImport его
        // отвергает — приводим к виду, который валиден.
        if (ownKeys(out.projects).length === 0) {
          out.projects = {};
          out.activeId = typeof raw.activeId === 'string' ? raw.activeId : null;
          return out;
        }
        throw new Error('migrate v1: получен некорректный документ: ' + checkOut.errors.join('; '));
      }
      if (out.activeId === undefined) out.activeId = null;
      return out;
    }

    throw new Error('migrate: неизвестная версия ' + describeVal(raw.v));
  }

  /* ------------------------------------------------------------------ экспорт */

  var NpiCore = {
    VERDICT: VERDICT,
    GATE_VERDICT: GATE_VERDICT,
    STATUSES: STATUSES,
    SEVERITIES: SEVERITIES,
    FINDING_STATUS: FINDING_STATUS,
    ROLES: ROLES,
    EVIDENCE: EVIDENCE,
    DEFAULT_THRESHOLD: DEFAULT_THRESHOLD,
    GATE_ID_RE: GATE_ID_RE,
    STEP_ID_RE: STEP_ID_RE,
    FINDING_ID_RE: FINDING_ID_RE,
    DATE_RE: DATE_RE,

    normalizeChecklist: normalizeChecklist,
    normalizeItems: normalizeItems,
    normalizeFinding: normalizeFinding,
    findingsOf: findingsOf,
    openFindings: openFindings,
    findingsForGate: findingsForGate,
    gateOfStepId: gateOfStepId,
    isStatus: isStatus,

    computeCoverage: computeCoverage,
    gateState: gateState,
    gateStates: gateStates,
    explainProject: explainProject,
    computeVerdict: computeVerdict,
    validateImport: validateImport,
    migrate: migrate
  };

  root.NpiCore = NpiCore;
})(typeof globalThis !== 'undefined' ? globalThis
  : typeof window !== 'undefined' ? window
  : typeof global !== 'undefined' ? global
  : this);
