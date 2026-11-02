/* =========================================================================
 * NPI Checklist — assets/llm.js
 *
 * Адаптер локальной языковой модели. Работает через собственный прокси
 * serve.js (/api/llm/*), поэтому:
 *   - страница обращается только к своему origin — CORS не нужен;
 *   - адрес и модель живут в llm.config.json или в настройках интерфейса,
 *     а не в коде. Модель подключается заменой конфига, а не правкой скрипта.
 *   - инструмент целиком работоспособен без модели: любой вызов возвращает
 *     { ok:false, error } и интерфейс честно это показывает.
 *
 * Совместим с любым сервером, говорящим на OpenAI-совместимом API
 * (/v1/chat/completions): vLLM, llama.cpp server, Ollama, LM Studio.
 * Мультимодальность — через части содержимого типа image_url.
 *
 * ГЛАВНОЕ ПРАВИЛО. Модель НИКОГДА не выставляет статус шагу, не назначает
 * серьёзность находке и не принимает решение о выпуске. Всё, что она
 * возвращает, — черновик текста в поле, которое человек обязан прочитать
 * и отредактировать. Вердикт, покрытие и блокировка гейтов считает NpiCore.
 *
 * Экспортирует одну глобаль: Llm
 * ========================================================================= */
(function (root) {
  'use strict';

  var DEFAULTS = {
    // '/v1' — собственный origin, проксируется serve.js. Так страница никогда
    // не обращается к чужому origin (CORS не нужен), а адрес модели и ключ
    // остаются на стороне сервера в llm.config.json. Запустите serve.js —
    // и этот адрес работает без изменений. Указать другой сервер можно
    // в настройках интерфейса или строкой ?llm=http://127.0.0.1:11434/v1
    baseUrl: '/v1',
    // Имя модели — то, что отдаёт /v1/models вашего сервера. Проверьте его
    // кнопкой «Проверить связь»; неверное имя — самая частая причина ошибки.
    model: 'qwen3.8-flash-next',
    apiKey: '',
    temperature: 0.2,
    maxTokens: 1200,
    timeoutMs: 60000
  };

  var cfg = {};
  var lastError = null;
  var lastCall = null;

  function load() {
    cfg = {};
    for (var k in DEFAULTS) if (Object.prototype.hasOwnProperty.call(DEFAULTS, k)) cfg[k] = DEFAULTS[k];
    // Параметр адреса в строке запроса полезен при запуске сервера на другом
    // порту: ?llm=http://127.0.0.1:8080/v1
    if (root.location && root.location.search) {
      try {
        var q = new root.URLSearchParams(root.location.search);
        var u = q.get('llm');
        if (u) cfg.baseUrl = u;
        var m = q.get('model');
        if (m) cfg.model = m;
      } catch (e) { /* location.search недоступен — не беда */ }
    }
    return cfg;
  }

  function get() {
    if (!cfg.baseUrl) load();
    return cfg;
  }

  function set(patch) {
    load();
    for (var k in patch) if (Object.prototype.hasOwnProperty.call(cfg, k)) cfg[k] = patch[k];
    lastError = null;
    return cfg;
  }

  /* ------------------------------------------------------------ транспорт */

  function call(path, body, timeoutMs) {
    var c = get();
    var url = c.baseUrl.replace(/\/+$/, '') + path;
    var headers = { 'Content-Type': 'application/json' };
    if (c.apiKey) headers['Authorization'] = 'Bearer ' + c.apiKey;

    var opts = { method: 'POST', headers: headers, body: JSON.stringify(body || {}) };
    if (typeof root.AbortController === 'function') {
      var ac = new root.AbortController();
      opts.signal = ac.signal;
      setTimeout(function () { ac.abort(); }, timeoutMs || c.timeoutMs);
    }
    return root.fetch(url, opts);
  }

  function hasFetch() {
    return typeof root.fetch === 'function';
  }

  function noFetchError() {
    return {
      ok: false,
      error: 'браузер не даёт fetch (или страница открыта с file://). ' +
        'Запустите инструмент через node serve.js — модель работает только так.'
    };
  }

  /**
   * health() -> Promise<{ ok, models[], error? }>
   * Спрашивает у сервера список моделей. Это первое, что нужно сделать при
   * настройке: если модель не в списке, чат не пойдёт.
   */
  function health() {
    if (!hasFetch()) return Promise.resolve(noFetchError());
    var c = get();
    var url = c.baseUrl.replace(/\/+$/, '') + '/models';
    var headers = {};
    if (c.apiKey) headers['Authorization'] = 'Bearer ' + c.apiKey;
    var opts = { method: 'GET', headers: headers };
    if (typeof root.AbortController === 'function') {
      var ac = new root.AbortController();
      opts.signal = ac.signal;
      setTimeout(function () { ac.abort(); }, 8000);
    }
    return root.fetch(url, opts).then(function (r) {
      if (!r.ok) throw new Error('сервер ответил ' + r.status);
      return r.json();
    }).then(function (j) {
      var models = (j && j.data ? j.data : []).map(function (m) { return m && m.id; })
        .filter(Boolean);
      return { ok: true, models: models, configured: c.model, inList: models.indexOf(c.model) >= 0 };
    }).catch(function (e) {
      return { ok: false, models: [], configured: c.model, inList: false,
        error: String(e && e.message || e) };
    });
  }

  /**
   * chat(messages, opts) -> Promise<{ ok, text, raw, ms, model, error? }>
   * messages — массив в формате OpenAI. Мультимодальные части вида
   * { type:'image_url', image_url:{ url:'data:image/jpeg;base64,…' } }
   * поддерживаются, если модель мультимодальная.
   */
  function chat(messages, opts) {
    opts = opts || {};
    if (!hasFetch()) return Promise.resolve(noFetchError());
    var c = get();
    var body = {
      model: opts.model || c.model,
      messages: messages,
      temperature: typeof opts.temperature === 'number' ? opts.temperature : c.temperature,
      max_tokens: typeof opts.maxTokens === 'number' ? opts.maxTokens : c.maxTokens,
      stream: false
    };
    if (opts.json) body.response_format = { type: 'json_object' };

    var t0 = (root.Date ? Date.now() : 0);
    return call('/chat/completions', body, opts.timeoutMs).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (t) {
          throw new Error('сервер ответил ' + r.status + ': ' + String(t).slice(0, 300));
        });
      }
      return r.json();
    }).then(function (j) {
      var choice = j && j.choices && j.choices[0];
      var text = choice && choice.message && typeof choice.message.content === 'string'
        ? choice.message.content : '';
      var ms = (root.Date ? Date.now() : 0) - t0;
      lastCall = { ms: ms, model: body.model, at: new Date().toISOString() };
      return { ok: true, text: text, raw: j, ms: ms, model: body.model };
    }).catch(function (e) {
      lastError = String(e && e.message || e);
      return { ok: false, text: '', error: lastError };
    });
  }

  /* -------------------------------------------------------- разбор ответа */

  /**
   * Достать JSON из ответа модели. Модели охотно оборачивают JSON в
   * markdown-ограды и добавляют пояснение — снимаем и то, и другое.
   */
  function parseJson(text) {
    if (!text) return null;
    var s = String(text).trim();
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    var start = s.indexOf('{');
    var end = s.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try { return JSON.parse(s.slice(start, end + 1)); } catch (e) { /* пробуем дальше */ }
    }
    try { return JSON.parse(s); } catch (e) { return null; }
  }

  /* ------------------------------------------------------- системные роли */

  var SYS = {
    base: 'Ты — инженер-технолог по SMT и THT с производственным опытом. ' +
      'Отвечай по-русски, кратко и по делу, в терминах производства. ' +
      'Нормативные документы называй по обозначению (IPC-A-610, J-STD-001, ' +
      'IPC/JEDEC J-STD-033 и так далее), но НЕ цитируй их текст и НЕ приводи ' +
      'числовые значения, если не уверен в них — в этом случае прямо скажи, ' +
      'что значение нужно сверить с действующей редакцией. ' +
      'Не выдумывай номера пунктов. Если данных недостаточно, скажи какие ' +
      'именно нужны. Никогда не выдавай догадку за измерение.',

    finding: 'Ты помогаешь технологу оформить находку по результатам проверки ' +
      'шага чек-листа NPI. Тебе дают требование шага, критерий приёмки, ' +
      'нормативный документ, заметку исполнителя и, возможно, фотографии ' +
      'доказательств. Верни СТРОГО объект JSON с полями: title (до 90 символов, ' +
      'суть находки), desc (что наблюдается, 1–3 предложения), cause ' +
      '(наиболее вероятная причина, если её можно предположить; иначе пустая ' +
      'строка), containment (чем локализовать прямо сейчас), action ' +
      '(корректирующее действие), std (обозначение нормы, если применима, ' +
      'иначе пустая строка). Не придумывай измерения: если на фото не видно ' +
      'размеров, не называй чисел. Пиши как технолог, а не как консультант.',

    review: 'Ты проверяешь заметку технолога к шагу чек-листа NPI на полноту. ' +
      'Верни СТРОГО объект JSON: { missing: [строка, …], ok: true|false }, ' +
      'где missing — список того, чего не хватает для приёмки шага ' +
      '(измеренное значение, номер партии, серийный номер, ссылка на документ ' +
      'и так далее). Если заметка достаточна, missing — пустой массив, ok — true. ' +
      'Не более 5 пунктов. Не добавляй того, что шаг не требует.',

    summary: 'Ты пишешь краткое резюме отчёта NPI для руководства. Тебе дают ' +
      'машиночитаемую сводку: вердикт, покрытие, состояние гейтов, реестр ' +
      'находок. Верни 4–7 коротких абзацев: что за изделие и на каком этапе, ' +
      'что мешает выпуску и почему, что уже локализовано, что нужно решить и ' +
      'к какому сроку. Не перечисляй находки по номерам — говори о смысле. ' +
      'Не придумывай чисел: используй только переданные. Не ставь диагнозов, ' +
      'которых нет в данных.'
  };

  /* ------------------------------------------------------------ задания */

  /**
   * draftFinding({ step, note, photos }) -> Promise<{ ok, draft?, error? }>
   * step — исходный объект шага из чек-листа (id, t, how, crit, std).
   * photos — массив data URL изображений-доказательств.
   * Возвращает ЧЕРНОВИК. Интерфейс обязан показать его в редактируемых
   * полях, а не применить молча.
   */
  function draftFinding(args) {
    var step = args.step || {};
    var cls = args.ipcClass || '3';
    var crit = (step.crit && (step.crit[cls] || step.crit['2'] || step.crit['3'])) || '';
    var prompt =
      'Шаг чек-листа: ' + (step.id || '?') + ' — ' + (step.t || '') + '\n' +
      'Как проверять: ' + (step.how || 'не указано') + '\n' +
      'Критерий приёмки (класс ' + cls + '): ' + crit + '\n' +
      'Нормативный документ: ' + (step.std || 'не указан') + '\n' +
      'Заметка исполнителя: ' + (args.note || 'пусто') + '\n' +
      'Измеренное значение / место: ' + (args.loc || 'не указано') + '\n' +
      'Фотографий доказательств приложено: ' + ((args.photos && args.photos.length) || 0) + '.';
    return chatWithSystem(SYS.finding, prompt, args.photos, { json: true, temperature: 0.15 })
      .then(function (res) {
        if (!res.ok) return res;
        var j = parseJson(res.text);
        if (!j) return { ok: false, error: 'модель вернула не JSON: ' + String(res.text).slice(0, 200) };
        return { ok: true, draft: j, raw: res.text, ms: res.ms, model: res.model };
      });
  }

  /**
   * reviewNote({ step, note, ipcClass }) -> Promise<{ ok, missing?, okFlag?, error? }>
   */
  function reviewNote(args) {
    var step = args.step || {};
    var cls = args.ipcClass || '3';
    var crit = (step.crit && (step.crit[cls] || step.crit['2'] || step.crit['3'])) || '';
    var prompt =
      'Шаг чек-листа: ' + (step.id || '?') + ' — ' + (step.t || '') + '\n' +
      'Как проверять: ' + (step.how || '') + '\n' +
      'Критерий приёмки (класс ' + cls + '): ' + crit + '\n' +
      'Требуемое доказательство: ' + (step.ev || 'не указано') + '\n' +
      'Заметка исполнителя: "' + (args.note || '') + '"';
    return chatWithSystem(SYS.review, prompt, [], { json: true, temperature: 0.1 })
      .then(function (res) {
        if (!res.ok) return res;
        var j = parseJson(res.text);
        if (!j) return { ok: false, error: 'модель вернула не JSON: ' + String(res.text).slice(0, 200) };
        return {
          ok: true,
          missing: Array.isArray(j.missing) ? j.missing.filter(function (x) { return typeof x === 'string'; }) : [],
          okFlag: j.ok === true,
          raw: res.text, ms: res.ms, model: res.model
        };
      });
  }

  /**
   * summarize(context) -> Promise<{ ok, text?, error? }>
   * context — машиночитаемая сводка (см. app.js buildLlmContext).
   */
  function summarize(context) {
    var prompt = 'Сводка отчёта NPI (JSON):\n' + JSON.stringify(context, null, 1);
    return chatWithSystem(SYS.summary, prompt, [], { temperature: 0.3, maxTokens: 900 })
      .then(function (res) {
        if (!res.ok) return res;
        return { ok: true, text: res.text.trim(), ms: res.ms, model: res.model };
      });
  }

  /**
   * ask(question, context) -> свободный вопрос по чек-листу и находкам.
   * Контекст ограничивает ответ: модель видит состояние конкретного изделия.
   */
  function ask(question, context) {
    var prompt =
      'Состояние чек-листа NPI по изделию (JSON):\n' + JSON.stringify(context, null, 1) +
      '\n\nВопрос технолога: ' + question;
    return chatWithSystem(SYS.base, prompt, [], { temperature: 0.2, maxTokens: 1000 })
      .then(function (res) {
        if (!res.ok) return res;
        return { ok: true, text: res.text.trim(), ms: res.ms, model: res.model };
      });
  }

  function chatWithSystem(system, prompt, images, opts) {
    var content;
    if (images && images.length) {
      content = [{ type: 'text', text: prompt }];
      for (var i = 0; i < images.length; i++) {
        content.push({ type: 'image_url', image_url: { url: images[i] } });
      }
    } else {
      content = prompt;
    }
    return chat([{ role: 'system', content: system }, { role: 'user', content: content }], opts);
  }

  var Llm = {
    DEFAULTS: DEFAULTS,
    configure: set,
    config: get,
    health: health,
    chat: chat,
    parseJson: parseJson,
    draftFinding: draftFinding,
    reviewNote: reviewNote,
    summarize: summarize,
    ask: ask,
    lastError: function () { return lastError; },
    lastCall: function () { return lastCall; },
    SYS: SYS
  };

  root.Llm = Llm;
})(typeof globalThis !== 'undefined' ? globalThis
  : typeof window !== 'undefined' ? window
  : typeof global !== 'undefined' ? global
  : this);
