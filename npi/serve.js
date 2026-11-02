'use strict';
/**
 * NPI Checklist — serve.js
 *
 * Нулевые зависимости. Делает две вещи:
 *
 *   1. Раздаёт статику инструмента по http://127.0.0.1 (по умолчанию 8790).
 *   2. Проксирует /v1/models и /v1/chat/completions на ЛОКАЛЬНЫЙ сервер
 *      языковой модели. Страница обращается только к своему origin, поэтому
 *      CORS не нужен, а адрес модели и ключ остаются здесь, в llm.config.json,
 *      и не утекают в браузер.
 *
 * Конфигурация модели — файл llm.config.json рядом с этим скриптом:
 *   { "baseUrl": "http://127.0.0.1:11434/v1", "model": "qwen3.8-flash-next",
 *     "apiKey": "" }
 * Переменные окружения имеют приоритет над файлом:
 *   LLM_BASE_URL, LLM_MODEL, LLM_API_KEY
 *
 * Без модели инструмент работает полностью: статика раздаётся, все расчёты
 * и отчёт считаются на клиенте. Прокси просто ответит понятной ошибкой.
 *
 * Использование:  node serve.js            (PORT env переопределяет порт)
 * Тесты:          require('./serve.js').startServer({ port, root })
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf'
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy':
    "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; " +
    "connect-src 'self'; frame-ancestors 'none'"
};

const LLM_PATHS = ['/v1/models', '/v1/chat/completions'];

/* --------------------------------------------------------------- конфиг */

function readLlmConfig(rootDir) {
  const cfg = {
    baseUrl: 'http://127.0.0.1:11434/v1',
    model: 'qwen3.8-flash-next',
    apiKey: ''
  };
  try {
    const raw = fs.readFileSync(path.join(rootDir, 'llm.config.json'), 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.baseUrl === 'string' && parsed.baseUrl) cfg.baseUrl = parsed.baseUrl;
      if (typeof parsed.model === 'string' && parsed.model) cfg.model = parsed.model;
      if (typeof parsed.apiKey === 'string') cfg.apiKey = parsed.apiKey;
    }
  } catch (e) { /* файла нет — значения по умолчанию, это нормально */ }

  if (process.env.LLM_BASE_URL) cfg.baseUrl = process.env.LLM_BASE_URL;
  if (process.env.LLM_MODEL) cfg.model = process.env.LLM_MODEL;
  if (process.env.LLM_API_KEY) cfg.apiKey = process.env.LLM_API_KEY;

  cfg.baseUrl = cfg.baseUrl.replace(/\/+$/, '');
  cfg.keyWarning = keyProblem(cfg.apiKey);
  return cfg;
}

/**
 * Причина, по которой ключ нельзя положить в заголовок Authorization.
 * Ключ с кириллицей или переводом строки не роняет сервер, а даёт внятный
 * ответ — иначе опечатка в llm.config.json убивала бы весь процесс.
 */
function keyProblem(key) {
  if (!key) return '';
  if (/[\r\n]/.test(key)) return 'в ключе есть перевод строки — уберите его';
  // Bearer-токен: печатные ASCII без пробелов.
  if (!/^[\x21-\x7e]+$/.test(key)) {
    return 'в ключе есть символы, недопустимые в заголовке Authorization ' +
      '(кириллица, пробел, управляющие символы)';
  }
  return '';
}

/* ---------------------------------------------------------------- ответы */

function sendPlain(res, status, text, extraHeaders) {
  const headers = Object.assign(
    { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    SECURITY_HEADERS,
    extraHeaders || {}
  );
  const body = Buffer.from(status + ': ' + text + '\n', 'utf8');
  headers['Content-Length'] = body.length;
  res.writeHead(status, headers);
  res.end(res.req && res.req.method === 'HEAD' ? undefined : body);
}

function sendJson(res, status, obj) {
  const body = Buffer.from(JSON.stringify(obj), 'utf8');
  const headers = Object.assign(
    { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    SECURITY_HEADERS
  );
  headers['Content-Length'] = body.length;
  res.writeHead(status, headers);
  res.end(body);
}

/* --------------------------------------------------------------- статика */

function resolveTarget(root, rawUrl) {
  let p = String(rawUrl || '/').split('#')[0].split('?')[0];
  if (p.indexOf('\\') !== -1 || p.indexOf('\0') !== -1) return { status: 400 };
  let decoded;
  try { decoded = decodeURIComponent(p); }
  catch (e) { return { status: 400 }; }
  if (decoded.indexOf('\\') !== -1 || decoded.indexOf('\0') !== -1) return { status: 400 };
  if (decoded.charAt(0) !== '/') decoded = '/' + decoded;
  const resolved = path.resolve(root, '.' + decoded);
  if (resolved !== root && resolved.indexOf(root + path.sep) !== 0) return { status: 403 };
  return { path: resolved };
}

function serveFile(req, res, root, filePath) {
  fs.stat(filePath, function (err, st) {
    if (err) return sendPlain(res, err.code === 'EACCES' ? 403 : 404, 'Not Found');
    if (st.isDirectory()) return serveFile(req, res, root, path.join(filePath, 'index.html'));
    if (!st.isFile()) return sendPlain(res, 404, 'Not Found');
    const ext = path.extname(filePath).toLowerCase();
    const headers = Object.assign(
      {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Content-Length': st.size,
        'Last-Modified': st.mtime.toUTCString(),
        'Cache-Control': ext === '.html' ? 'no-cache' : 'max-age=3600'
      },
      SECURITY_HEADERS
    );
    res.writeHead(200, headers);
    if (req.method === 'HEAD') return res.end();
    const stream = fs.createReadStream(filePath);
    stream.on('error', function () { res.destroy(); });
    stream.pipe(res);
  });
}

/* ------------------------------------------------------------ прокси LLM */

/**
 * Проксировать запрос на локальный сервер модели.
 * Тело ответа модели отдаём как есть — интерфейс сам разберёт ошибку.
 */
function proxyLlm(req, res, llmPath, cfg) {
  const chunks = [];
  let size = 0;
  req.on('data', function (c) {
    size += c.length;
    if (size > 8 * 1024 * 1024) {           // фото-доказательства бывают большими
      sendJson(res, 413, { error: 'тело запроса слишком велико' });
      req.destroy();
      return;
    }
    chunks.push(c);
  });
  req.on('error', function () { sendJson(res, 400, { error: 'ошибка чтения запроса' }); });
  req.on('end', function () {
    if (res.writableEnded) return;
    const body = Buffer.concat(chunks);
    // Нормализуем адрес здесь, а не только в readLlmConfig: конфиг можно
    // передать в startServer напрямую, и тогда завершающий слеш даёт
    // двойное /v1//models. Модели такой путь часто не принимают.
    const base = String(cfg.baseUrl || '').replace(/\/+$/, '');
    if (!base) {
      return sendJson(res, 500, {
        error: 'адрес модели не задан — проверьте baseUrl в llm.config.json'
      });
    }

    let target;
    try {
      target = new url.URL(base + llmPath.replace(/^\/v1/, ''));
    } catch (e) {
      return sendJson(res, 500, {
        error: 'некорректный адрес модели: ' + base +
          ' — проверьте baseUrl в llm.config.json'
      });
    }

    // Заголовки собираем в защищённом блоке: недопустимый символ в ключе
    // иначе бросает исключение уже после ответа клиенту и роняет процесс.
    let headers;
    try {
      headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      const problem = keyProblem(cfg.apiKey);
      if (cfg.apiKey && problem) {
        return sendJson(res, 500, {
          error: 'ключ модели в llm.config.json не годится: ' + problem
        });
      }
      if (cfg.apiKey) headers['Authorization'] = 'Bearer ' + cfg.apiKey;
      if (body.length) headers['Content-Length'] = Buffer.byteLength(body);
    } catch (e) {
      return sendJson(res, 500, {
        error: 'не удалось собрать заголовки запроса к модели: ' + e.message
      });
    }

    const upstream = http.request(
      {
        hostname: target.hostname,
        port: target.port || 80,
        path: target.pathname + (target.search || ''),
        method: req.method,
        headers: headers
      },
      function (up) {
        const bufs = [];
        up.on('data', function (c) { bufs.push(c); });
        up.on('end', function () {
          if (res.writableEnded) return;
          const out = Buffer.concat(bufs);
          const rh = Object.assign({}, SECURITY_HEADERS);
          const ct = up.headers['content-type'];
          rh['Content-Type'] = ct || 'application/json; charset=utf-8';
          rh['Content-Length'] = out.length;
          rh['Cache-Control'] = 'no-store';
          res.writeHead(up.statusCode || 502, rh);
          res.end(out);
        });
      }
    );

    upstream.on('error', function (err) {
      if (res.writableEnded) return;
      sendJson(res, 502, {
        error: 'локальный сервер модели недоступен: ' + err.message +
          ' (ожидался ' + base + '). Запустите сервер модели или ' +
          'исправьте baseUrl в llm.config.json. Сам чек-лист работает без модели.'
      });
    });
    upstream.setTimeout(120000, function () {
      upstream.destroy(new Error('таймаут ожидания модели'));
    });
    if (body.length) upstream.write(body);
    upstream.end();
  });
}

/* ---------------------------------------------------------------- сервер */

function createHandler(rootDir, llmCfg) {
  // llmCfg можно передать снаружи: так сервер встраивается в чужой код и
  // проверяется тестом. Без него конфиг читается с диска.
  const cfg = llmCfg && typeof llmCfg === 'object' ? llmCfg : readLlmConfig(rootDir);
  return function (req, res) {
    const raw = req.url || '/';
    const pathname = String(raw).split('#')[0].split('?')[0];

    if (LLM_PATHS.indexOf(pathname) !== -1) {
      if (req.method !== 'POST' && req.method !== 'GET') {
        return sendPlain(res, 405, 'Method Not Allowed', { Allow: 'GET, POST' });
      }
      return proxyLlm(req, res, pathname, cfg);
    }

    if (pathname === '/api/llm/status') {
      // Несекретная сводка: видно, куда смотрит прокси и какая модель
      // настроена, но не видно ключа.
      return sendJson(res, 200, {
        baseUrl: cfg.baseUrl,
        model: cfg.model,
        hasKey: !!cfg.apiKey
      });
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return sendPlain(res, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
    }
    const t = resolveTarget(rootDir, raw);
    if (t.status) return sendPlain(res, t.status, t.status === 403 ? 'Forbidden' : 'Bad Request');
    serveFile(req, res, rootDir, t.path);
  };
}

function startServer(portOrOpts, maybeOpts) {
  let opts = {};
  let port;
  if (portOrOpts && typeof portOrOpts === 'object') opts = portOrOpts;
  else if (typeof portOrOpts === 'number') port = portOrOpts;
  else if (typeof portOrOpts === 'string' && portOrOpts !== '') port = Number(portOrOpts);
  if (maybeOpts && typeof maybeOpts === 'object') Object.assign(opts, maybeOpts);
  if (opts.port !== undefined && opts.port !== null) port = opts.port;
  if (port === undefined || port === null || port === '') {
    port = process.env.PORT ? Number(process.env.PORT) : 8790;
  }
  const root = path.resolve(opts.root || __dirname);
  const server = http.createServer(createHandler(root, opts.llm));

  return new Promise(function (resolve, reject) {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', function () {
      server.removeListener('error', reject);
      const addr = server.address();
      resolve({
        server: server, port: addr.port, address: addr,
        close: function () {
          return new Promise(function (done) { server.close(done); });
        }
      });
    });
  });
}

module.exports = { startServer, resolveTarget, MIME, readLlmConfig, LLM_PATHS };

if (require.main === module) {
  const cfg = readLlmConfig(__dirname);
  startServer().then(function (h) {
    console.log('NPI Checklist: http://127.0.0.1:' + h.port + '/');
    console.log('Прокси модели:  ' + cfg.baseUrl + '  (модель: ' + cfg.model + ')');
    console.log('Без запущенного сервера модели чек-лист работает полностью,');
    console.log('кроме функций, которым модель нужна.');
  }).catch(function (err) {
    console.error('Не удалось запустить сервер:', err.message);
    process.exit(1);
  });
}
