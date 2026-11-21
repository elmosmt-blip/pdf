'use strict';
/**
 * Тесты сервера и прокси к модели. Нет зависимостей.
 * Запуск: node tests/serve.test.js
 *
 * Проверяется то, из-за чего инструмент ломается на реальном полу:
 * прокси не доводит ответ, путь уводит за корень, POST обрывается 405,
 * а ключ модели не утекает в отчёт о состоянии.
 */
var http = require('http');
var path = require('path');

var srv = require(path.join(__dirname, '..', 'serve.js'));
var ROOT = path.join(__dirname, '..');

var failures = [];
var checks = 0;
function ok(cond, label) {
  checks++;
  if (!cond) { failures.push(label); console.log('  FAIL ' + label); }
}

var BS = String.fromCharCode(92);   // обратная косая черта
var APP_MARK = 'id=' + String.fromCharCode(34) + 'app' + String.fromCharCode(34);

/* ------------------------------------------- фальшивая модель (upstream) */

var upstreamCalls = [];
var upstreamStatus = 200;

var upstream = http.createServer(function (req, res) {
  upstreamCalls.push({ method: req.method, url: req.url });
  res.writeHead(upstreamStatus, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    object: 'list',
    data: [{ id: 'qwen3.8-flash-next', object: 'model' }]
  }));
});

/* --------------------------------------------------------- вспомогательное */

function start(extra) {
  return srv.startServer(Object.assign({ root: ROOT, port: 0, log: function () {} },
    extra || {}));
}

function req(baseUrl, method, urlPath, body, headers) {
  return new Promise(function (resolve, reject) {
    var data = body == null ? null :
      (typeof body === 'string' ? body : JSON.stringify(body));
    var r = http.request(baseUrl + urlPath, {
      method: method,
      headers: Object.assign(
        data ? { 'Content-Type': 'application/json' } : {},
        headers || {})
    }, function (res) {
      var buf = '';
      res.setEncoding('utf8');
      res.on('data', function (c) { buf += c; });
      res.on('end', function () {
        resolve({ status: res.statusCode, headers: res.headers, body: buf });
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

/* -------------------------------------------------------------- проверки */

var tests = [];
function t(name, fn) { tests.push({ name: name, fn: fn }); }

var baseUrl = '';
var server = null;
var upPort = 0;
var cfg = null;

t('корневой адрес отдаёт index.html', function () {
  return req(baseUrl, 'GET', '/').then(function (r) {
    ok(r.status === 200, 'статус 200, получено ' + r.status);
    ok(r.body.indexOf(APP_MARK) !== -1, 'в теле разметка #app');
    ok((r.headers['content-type'] || '').indexOf('text/html') === 0,
      'тип содержимого html');
    var csp = r.headers['content-security-policy'] || '';
    ok(csp.indexOf("default-src 'self'") === 0, 'заголовок CSP присутствует');
    ok(csp.indexOf("img-src 'self' data:") !== -1, 'CSP разрешает встроенные фото');
    ok(csp.indexOf('X-Content-Type') === -1, 'CSP не смешан с другими заголовками');
  });
});

t('data.js отдаётся как javascript', function () {
  return req(baseUrl, 'GET', '/assets/data.js').then(function (r) {
    ok(r.status === 200, 'статус 200');
    ok(r.body.indexOf('NPI') !== -1, 'в теле глобаль NPI');
    ok((r.headers['content-type'] || '').indexOf('javascript') !== -1,
      'тип содержимого javascript');
  });
});

t('app.js отдаётся как javascript', function () {
  return req(baseUrl, 'GET', '/assets/app.js').then(function (r) {
    ok(r.status === 200 && r.body.indexOf('addEventListener') !== -1,
      'app.js доходит и содержит подписки на события');
  });
});

t('style.css отдаётся как css', function () {
  return req(baseUrl, 'GET', '/assets/style.css').then(function (r) {
    ok(r.status === 200 && r.body.indexOf('#0D1117') !== -1,
      'style.css доходит и несёт фирменный фон');
  });
});

t('неизвестный файл даёт 404', function () {
  return req(baseUrl, 'GET', '/нет-такого.html').then(function (r) {
    ok(r.status === 404, 'статус 404, получено ' + r.status);
  });
});

t('POST к статике даёт 405', function () {
  return req(baseUrl, 'POST', '/', { a: 1 }).then(function (r) {
    ok(r.status === 405, 'статус 405, получено ' + r.status);
    ok(r.headers['allow'] === 'GET, HEAD', 'заголовок Allow: GET, HEAD');
  });
});

t('неизвестный метод даёт 405', function () {
  return req(baseUrl, 'DELETE', '/index.html').then(function (r) {
    ok(r.status === 405, 'статус 405, получено ' + r.status);
  });
});

// ВАЖНО. Проверить выход за корень настоящим HTTP-запросом нельзя: клиент
// Node (как и браузер) нормализует '..' и '%2e%2e' ещё до отправки, поэтому
// сервер такого пути не видит. Раньше здесь стояли два теста с '/..' + BS и
// '/%2e%2e/%2e%2e/package.json'. Они «проходили» только потому, что файла
// package.json в корне инструмента не было, а запрос на самом деле уходил
// как '/package.json'. Как только файл появился, оба теста показали 200 и
// вскрыли свою пустоту.
// Настоящая защита — resolveTarget, и она проверяется ниже напрямую.
// Здесь остаётся убедиться, что файл снаружи корня не отдаётся.
t('двойное кодирование не открывает файл снаружи корня', function () {
  // %252e%252e клиент не трогает; сервер раскодирует один раз и получает
  // '%2e%2e', который выходом за корень уже не является.
  return req(baseUrl, 'GET', '/%252e%252e/%252e%252e/package.json').then(function (r) {
    ok(r.status === 404 || r.status === 403 || r.status === 400,
      'статус 404/403/400, получено ' + r.status);
    ok(r.body.indexOf('"name"') === -1,
      'содержимое package.json не выдано');
  });
});

t('нулевой байт в кодированном виде', function () {
  return req(baseUrl, 'GET', '/index.html%2500.js').then(function (r) {
    ok(r.status === 400 || r.status === 403 || r.status === 404,
      'статус 400/403/404, получено ' + r.status);
  });
});

t('нулевой байт в пути', function () {
  return req(baseUrl, 'GET', '/index.html%00.js').then(function (r) {
    ok(r.status === 400 || r.status === 403 || r.status === 404,
      'статус 400/403/404, получено ' + r.status);
  });
});

t('каталог не отдаётся как файл', function () {
  return req(baseUrl, 'GET', '/assets').then(function (r) {
    ok(r.status === 403 || r.status === 404, 'статус 403/404, получено ' + r.status);
  });
});

t('статус модели не выдаёт ключ', function () {
  return req(baseUrl, 'GET', '/api/llm/status').then(function (r) {
    ok(r.status === 200, 'статус 200');
    var j = JSON.parse(r.body);
    ok(j.baseUrl.indexOf('127.0.0.1:' + upPort) !== -1, 'адрес модели передан');
    ok(j.model === cfg.model, 'название модели передан');
    ok(j.hasKey === true, 'наличие ключа отражено');
    ok(r.body.indexOf('sk-test-0001') === -1, 'самого ключа в ответе нет');
  });
});

t('статус модели без ключа говорит hasKey:false', function () {
  return start({ llm: { baseUrl: cfg.baseUrl, model: 'm', apiKey: '' } })
    .then(function (h) {
      var b = 'http://127.0.0.1:' + h.port;
      return req(b, 'GET', '/api/llm/status').then(function (r) {
        ok(JSON.parse(r.body).hasKey === false, 'пустой ключ -> hasKey:false');
        return h.close();
      });
    });
});

t('прокси /v1/models доходит до модели', function () {
  upstreamCalls.length = 0;
  return req(baseUrl, 'GET', '/v1/models').then(function (r) {
    ok(r.status === 200, 'статус 200, получено ' + r.status);
    ok(JSON.parse(r.body).data[0].id === 'qwen3.8-flash-next',
      'список моделей дошёл');
    ok(upstreamCalls.length === 1, 'запрос ушёл к модели один раз');
    ok(upstreamCalls[0].url.indexOf('/v1/models') === 0, 'путь сохранён');
  });
});

t('прокси /v1/chat/completions доходит до модели', function () {
  upstreamCalls.length = 0;
  return req(baseUrl, 'POST', '/v1/chat/completions', {
    model: 'qwen3.8-flash-next',
    messages: [{ role: 'user', content: 'привет' }]
  }).then(function (r) {
    ok(r.status === 200, 'статус 200, получено ' + r.status);
    ok(r.body.indexOf('qwen3.8-flash-next') !== -1, 'ответ модели дошёл');
    ok(upstreamCalls[0].method === 'POST', 'метод сохранён');
  });
});

t('неизвестный путь под /v1 не проксируется', function () {
  upstreamCalls.length = 0;
  return req(baseUrl, 'GET', '/v1/embeddings').then(function (r) {
    ok(r.status === 404, 'статус 404, получено ' + r.status);
    ok(upstreamCalls.length === 0, 'к модели не ушло ничего');
  });
});

t('сбой модели доходит как сбой, а не как 200', function () {
  var was = upstreamStatus;
  upstreamStatus = 500;
  return req(baseUrl, 'GET', '/v1/models').then(function (r) {
    upstreamStatus = was;
    ok(r.status !== 200, 'статус не 200, получено ' + r.status);
    ok(r.status === 500, 'статус модели передан как есть: ' + r.status);
  });
});

// Ключ с кириллицей раньше бросал исключение внутри обработчика и убивал
// весь процесс. Теперь он даёт понятный ответ, а сервер продолжает жить.
t('кириллица в ключе не роняет сервер', function () {
  return start({
    llm: { baseUrl: cfg.baseUrl, model: 'm', apiKey: 'ключ-по-русски' }
  }).then(function (h) {
    var b = 'http://127.0.0.1:' + h.port;
    return req(b, 'GET', '/v1/models').then(function (r) {
      ok(r.status === 500, 'статус 500, получено ' + r.status);
      ok(r.body.indexOf('не годится') !== -1, 'объяснено, что не так с ключом');
      ok(r.body.indexOf('ключ-по-русски') === -1, 'сам ключ не возвращается');
      return h.close();
    });
  });
});

t('сервер жив после отказа ключа', function () {
  return req(baseUrl, 'GET', '/').then(function (r) {
    ok(r.status === 200, 'статика отвечает после разбора ключа');
  });
});

t('недоступная модель не роняет сервер', function () {
  return start({ llm: { baseUrl: 'http://127.0.0.1:1/v1', model: 'm', apiKey: '' } })
    .then(function (h) {
      var b = 'http://127.0.0.1:' + h.port;
      return req(b, 'GET', '/v1/models').then(function (r) {
        ok(r.status === 502, 'статус 502, получено ' + r.status);
        ok(r.body.length > 0, 'в ответе есть текст ошибки');
        return h.close();
      });
    });
});

t('огромное тело отклоняется', function () {
  return req(baseUrl, 'POST', '/v1/chat/completions',
    { x: 'z'.repeat(9 * 1024 * 1024) })
    .then(function (r) {
      ok(r.status === 413, 'статус 413, получено ' + r.status);
    }, function (e) {
      ok(/socket hang up|ECONNRESET/i.test(e.message),
        'соединение оборвано, а не принято: ' + e.message);
    });
});

t('конфиг модели читается из файла', function () {
  var c = srv.readLlmConfig(ROOT);
  ok(c.baseUrl && /^https?:\/\//.test(c.baseUrl), 'адрес модели — полный URL');
  ok(typeof c.model === 'string' && c.model.length > 0, 'модель названа');
  ok(typeof c.apiKey === 'string', 'поле ключа есть');
  ok(srv.LLM_PATHS.indexOf('/v1/chat/completions') !== -1,
    'путь чата проксируется');
  ok(typeof srv.resolveTarget === 'function', 'resolveTarget экспортирован');
  ok(srv.MIME['.html'].indexOf('text/html') === 0, 'таблица типов содержит html');
});

t('переменные окружения перебивают файл конфигурации', function () {
  var prev = process.env.LLM_BASE_URL;
  process.env.LLM_BASE_URL = 'http://127.0.0.1:9999/v1';
  var c = srv.readLlmConfig(ROOT);
  if (prev === undefined) delete process.env.LLM_BASE_URL;
  else process.env.LLM_BASE_URL = prev;
  ok(c.baseUrl === 'http://127.0.0.1:9999/v1', 'окружение применилось');
});

t('разбор пути к файлу в норме', function () {
  var r = srv.resolveTarget(ROOT, '/index.html');
  ok(r.status === undefined, 'нет ошибки для нормального пути');
  ok(r.path === path.join(ROOT, 'index.html'), 'путь склеен с корнем');
});

t('разбор пути не пускает за корень', function () {
  var r = srv.resolveTarget(ROOT, '/../package.json');
  ok(r.status === 403, 'статус 403, получено ' + r.status);
});

t('разбор пути отвергает обратную косую черту', function () {
  var r = srv.resolveTarget(ROOT, '/' + BS + '..' + BS + 'package.json');
  ok(r.status === 400, 'статус 400, получено ' + r.status);
});

t('разбор пути отвергает нулевой байт', function () {
  var r = srv.resolveTarget(ROOT, '/index.html%00.js');
  ok(r.status === 400 || r.status === 403,
    'статус 400/403, получено ' + r.status);
});

t('адрес модели с завершающим слешем не удваивает /v1', function () {
  return start({ llm: { baseUrl: cfg.baseUrl + '/', model: 'm', apiKey: '' } })
    .then(function (h) {
      upstreamCalls.length = 0;
      var b = 'http://127.0.0.1:' + h.port;
      return req(b, 'GET', '/v1/models').then(function (r) {
        ok(r.status === 200, 'запрос прошёл, статус ' + r.status);
        ok(upstreamCalls[0].url.indexOf('//v1/v1') === -1,
          'путь у модели чистый: ' + upstreamCalls[0].url);
        ok(upstreamCalls[0].url === '/v1/models', 'путь ровно /v1/models');
        return h.close();
      });
    });
});

/* ---------------------------------------------------------------- запуск */

upstream.listen(0, '127.0.0.1', function () {
  upPort = upstream.address().port;
  cfg = {
    baseUrl: 'http://127.0.0.1:' + upPort + '/v1',
    model: 'qwen3.8-flash-next',
    apiKey: 'sk-test-0001'
  };
  start({ llm: cfg }).then(function (h) {
    server = h;
    baseUrl = 'http://127.0.0.1:' + h.port;
    var i = 0;
    (function next() {
      if (i >= tests.length) return finish();
      var cur = tests[i++];
      // Тесты могут быть и синхронными — Promise.resolve их уравнивает.
      Promise.resolve().then(cur.fn).then(function () {
        console.log('  ok   ' + cur.name);
        next();
      }, function (e) {
        ok(false, cur.name + ' — ' + (e && e.message));
        next();
      });
    }());
  }, function (e) {
    console.error('сервер не поднялся: ' + (e && e.message));
    process.exit(1);
  });
});

// Промис завершения: общий запуск ждёт его, чтобы сводка не убегала вперёд.
// Резолвер объявлен ДО промиса. Иначе строка `var finishResolve = null`
// ниже затирает его (var поднимается, но присваивание идёт по порядку),
// промис никогда не разрешается, и общий запуск зависает без итога.
var finishResolve = null;
var done = new Promise(function (resolve) { finishResolve = resolve; });

function finish() {
  var steps = [];
  if (server && server.close) steps.push(server.close());
  steps.push(new Promise(function (d) { upstream.close(function () { d(); }); }));
  Promise.all(steps).then(function () {
    console.log('\n' + (failures.length ? 'ПРОВАЛОВ: ' + failures.length : 'ВСЁ ЗЕЛЕНО') +
      '  (проверок: ' + checks + ')');
    if (failures.length) {
      failures.forEach(function (f) { console.log('  - ' + f); });
      process.exitCode = 1;
    }
    if (finishResolve) finishResolve();
  });
}

module.exports = done;
