/* =========================================================================
 * NPI Checklist — assets/store.js
 *
 * Хранилище состояния. Два уровня, и это осознанно:
 *
 *   1. СОСТОЯНИЕ (проекты, статусы шагов, заметки, находки) — localStorage,
 *      ключ npi-checklist-v2. Маленькое, всегда survives, работает с file://
 *      в любом браузере.
 *   2. ФОТОДОКАЗАТЕЛЬСТВА — IndexedDB, хранилище photos. Большие бинарные
 *      объекты. file:// в Chrome даёт непрозрачный origin, где IndexedDB
 *      недоступен, поэтому при отсутствии IDB store переходит в режим
 *      «фото внутри состояния» с уменьшением и предупреждением о квоте.
 *      Ничего не теряется молча: пользователь всегда видит, где лежат байты.
 *
 * Экспортирует единственную глобаль: Store
 * В Node (тесты) доступны только чистые помощники, перечисленные в
 * Store.pure — браузерных API нет, и это проверяется тестом.
 * ========================================================================= */
(function (root) {
  'use strict';

  var STATE_KEY = 'npi-checklist-v2';
  var CORRUPT_KEY = 'npi-checklist-v2.corrupt';
  var DB_NAME = 'npi-checklist';
  var DB_VERSION = 1;
  var PHOTO_STORE = 'photos';

  var hasWindow = typeof root.window !== 'undefined' && !!root.window;
  var hasLocalStorage = hasWindow && (function () {
    try { root.window.localStorage.getItem('__npi_probe__'); return true; }
    catch (e) { return false; }
  })();

  /* ------------------------------------------------------- чистые помощники */

  var SEQ_RE = /^p-(\d{4})$/;

  /** Следующий читаемый id проекта: p-0001, p-0002, … */
  function nextProjectId(existingIds, now) {
    var max = 0;
    var ids = existingIds || [];
    for (var i = 0; i < ids.length; i++) {
      var m = SEQ_RE.exec(ids[i]);
      if (m) { var n = parseInt(m[1], 10); if (n > max) max = n; }
    }
    var next = max + 1;
    // Коллизия с уже существующим «не по порядку» id — идём дальше.
    while (ids.indexOf('p-' + pad4(next)) !== -1) next++;
    return 'p-' + pad4(next);
  }

  function pad4(n) {
    var s = String(n);
    while (s.length < 4) s = '0' + s;
    return s;
  }

  /** Идентификатор фото. Префикс + счётчик по времени: уникален без сервера. */
  function makePhotoId(seed) {
    var base = typeof seed === 'number' && isFinite(seed) ? seed : Date.now();
    var s = base.toString(36);
    // Небольшая случайная часть — две фотографии в одну и ту же миллисекунду
    // не должны получить один id.
    var r = Math.floor(Math.random() * 1296).toString(36);
    while (r.length < 2) r = '0' + r;
    return 'ph-' + s + '-' + r;
  }

  /**
   * План уменьшения фото. Возвращает целевые размеры, не выходящие за исходные.
   * photoMax — наибольшая сторона в пикселях.
   */
  function fitBox(w, h, max) {
    if (!(w > 0) || !(h > 0)) return { w: 0, h: 0 };
    var m = typeof max === 'number' && max > 0 ? max : 1600;
    var scale = Math.min(1, m / Math.max(w, h));
    return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) };
  }

  /** Человекочитаемый размер. */
  function fmtBytes(n) {
    if (typeof n !== 'number' || !isFinite(n) || n < 0) return '—';
    if (n < 1024) return n + ' Б';
    if (n < 1024 * 1024) return (n / 1024).toFixed(n < 10240 ? 1 : 0) + ' КБ';
    return (n / (1024 * 1024)).toFixed(n < 10485760 ? 1 : 0) + ' МБ';
  }

  function isDataUrl(s) {
    // Не любая строка с "data:" — только настоящая встроенная ссылка:
    // data:<тип>(;base64)?,<данные>. Раньше под проверку проходило и голое
    // "data:", и тогда такое значение считалось фото и давало битую плитку.
    return typeof s === 'string' && /^data:[a-z0-9.+\/_-]*(?:;[^,]*)?,/i.test(s);
  }

  /* ------------------------------------------------------------ состояние */

  function freshState() { return { v: 2, activeId: null, projects: {} }; }

  function lsGet(key) {
    if (!hasLocalStorage) return null;
    try { return root.window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function lsSet(key, value) {
    if (!hasLocalStorage) return false;
    try { root.window.localStorage.setItem(key, value); return true; }
    catch (e) { return false; }
  }

  var AC = root.NpiCore;

  function loadState() {
    var raw = lsGet(STATE_KEY);
    if (raw == null) return freshState();
    var parsed;
    try { parsed = JSON.parse(raw); }
    catch (e) {
      lsSet(CORRUPT_KEY, raw);
      return Object.assign(freshState(), { _corrupt: raw.slice(0, 200) });
    }
    // Пустой набор проектов для нас допустим, но validateImport его отвергает.
    if (parsed && typeof parsed === 'object' && parsed.v === 2 &&
        parsed.projects && typeof parsed.projects === 'object' &&
        !Array.isArray(parsed.projects) && Object.keys(parsed.projects).length === 0) {
      return {
        v: 2,
        activeId: typeof parsed.activeId === 'string' ? parsed.activeId : null,
        projects: {}
      };
    }
    try {
      var migrated = AC.migrate(parsed);
      if (migrated.activeId === undefined) migrated.activeId = null;
      return migrated;
    } catch (e) {
      lsSet(CORRUPT_KEY, raw);
      return Object.assign(freshState(), { _corrupt: String(e.message || e).slice(0, 200) });
    }
  }

  /* ------------------------------------------------------------ IndexedDB */

  var dbRef = null;
  var dbFailed = false;      // IDB недоступен (file:// в Chrome и т.п.)
  var inlinePhotos = {};     // photoId -> dataURL, когда IDB нет

  function idbAvailable() {
    return hasWindow && typeof root.window.indexedDB !== 'undefined' && !dbFailed;
  }

  function openDb() {
    if (!idbAvailable()) return Promise.reject(new Error('IndexedDB недоступен'));
    if (dbRef) return Promise.resolve(dbRef);
    return new Promise(function (resolve, reject) {
      var req;
      try { req = root.window.indexedDB.open(DB_NAME, DB_VERSION); }
      catch (e) { dbFailed = true; return reject(e); }
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(PHOTO_STORE)) {
          db.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = function () { dbRef = req.result; resolve(dbRef); };
      req.onerror = function () { dbFailed = true; reject(req.error || new Error('IndexedDB error')); };
      req.onblocked = function () { dbFailed = true; reject(new Error('IndexedDB blocked')); };
    });
  }

  function tx(mode, fn) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var t = db.transaction(PHOTO_STORE, mode);
        var store = t.objectStore(PHOTO_STORE);
        var out = fn(store);
        t.oncomplete = function () { resolve(out && out.result !== undefined ? out.result : out); };
        t.onerror = function () { reject(t.error); };
        t.onabort = function () { reject(t.error || new Error('transaction aborted')); };
      });
    });
  }

  function putPhoto(rec) {
    if (!idbAvailable()) { inlinePhotos[rec.id] = rec.dataUrl; return Promise.resolve(rec.id); }
    return tx('readwrite', function (store) { return store.put(rec); })
      .then(function () { return rec.id; })
      .catch(function () { inlinePhotos[rec.id] = rec.dataUrl; return rec.id; });
  }

  function getPhoto(id) {
    if (!idbAvailable()) return Promise.resolve(inlinePhotos[id] ? { id: id, dataUrl: inlinePhotos[id] } : null);
    return tx('readonly', function (store) { return store.get(id); })
      .catch(function () { return inlinePhotos[id] ? { id: id, dataUrl: inlinePhotos[id] } : null; });
  }

  function deletePhoto(id) {
    delete inlinePhotos[id];
    if (!idbAvailable()) return Promise.resolve();
    return tx('readwrite', function (store) { return store.delete(id); }).catch(function () {});
  }

  function allPhotos() {
    if (!idbAvailable()) {
      var keys = Object.keys(inlinePhotos);
      return Promise.resolve(keys.map(function (k) { return { id: k, dataUrl: inlinePhotos[k] }; }));
    }
    return tx('readonly', function (store) { return store.getAll(); }).catch(function () {
      return Object.keys(inlinePhotos).map(function (k) { return { id: k, dataUrl: inlinePhotos[k] }; });
    });
  }

  /* ------------------------------------------------------------- публичное */

  // Состояние читается сразу, а не по команде init(): иначе любой
  // публичный метод падает с «Cannot read properties of null», если до
  // него не успели вызвать init(). init() остаётся — он перечитывает
  // состояние заново (например, после смены вкладки).
  var state = loadState();
  var listeners = [];
  var storageWarned = false;

  function notify() {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](state); } catch (e) { /* слушатель не должен ломать остальных */ }
    }
  }

  function persist() {
    var payload = JSON.stringify(state);
    if (!lsSet(STATE_KEY, payload)) {
      storageWarned = true;   // состояние живёт только в памяти этой вкладки
    }
  }

  function project(pid) { return state.projects[pid] || null; }

  function touch(pid) {
    var p = project(pid);
    if (p) { p.ts = Date.now(); persist(); }
  }

  var Store = {

    pure: {
      nextProjectId: nextProjectId,
      makePhotoId: makePhotoId,
      fitBox: fitBox,
      fmtBytes: fmtBytes,
      isDataUrl: isDataUrl,
      pad4: pad4
    },

    init: function () {
      state = loadState();
      return Store;
    },

    // Для отладки: прочитать состояние заново, не теряя слушателей.
    reload: function () {
      state = loadState();
      notify();
      return Store;
    },

    onChange: function (fn) { listeners.push(fn); return Store; },
    state: function () { return state; },
    get: function (pid) { return project(pid); },
    list: function () {
      return Object.keys(state.projects).sort(function (a, b) {
        return (state.projects[b].ts || 0) - (state.projects[a].ts || 0);
      });
    },
    activeId: function () {
      if (state.activeId && project(state.activeId)) return state.activeId;
      var ids = Store.list();
      return ids.length ? ids[0] : null;
    },
    corruptNotice: function () { return state && state._corrupt ? state._corrupt : null; },
    storageWarning: function () { return storageWarned; },

    setActive: function (pid) {
      if (!project(pid)) return Store;
      state.activeId = pid; persist(); notify();
      return Store;
    },

    create: function (meta) {
      var id = nextProjectId(Object.keys(state.projects));
      state.projects[id] = {
        meta: Object.assign({
          product: '', rev: '', pn: '', customer: '', ipcClass: '3',
          alloy: 'SAC305', line: '', engineer: '', start: '', target: ''
        }, meta || {}),
        st: {}, note: {}, loc: {}, gateNA: {}, findings: [],
        checklistVersion: (root.NPI && root.NPI.version) || '',
        ts: Date.now()
      };
      state.activeId = id;
      persist(); notify();
      return id;
    },

    duplicate: function (pid) {
      var src = project(pid);
      if (!src) return null;
      var id = nextProjectId(Object.keys(state.projects));
      var copy = JSON.parse(JSON.stringify(src));
      copy.meta = Object.assign({}, src.meta);
      copy.ts = Date.now();
      state.projects[id] = copy;
      state.activeId = id;
      persist(); notify();
      return id;
    },

    remove: function (pid) {
      if (!project(pid)) return Store;
      var p = project(pid);
      // Фото находок удаляем вместе с проектом — иначе они остаются сиротами.
      if (p.findings) {
        for (var i = 0; i < p.findings.length; i++) {
          var ph = p.findings[i].photos || [];
          for (var j = 0; j < ph.length; j++) deletePhoto(ph[j]);
        }
      }
      delete state.projects[pid];
      if (state.activeId === pid) {
        var ids = Store.list();
        state.activeId = ids.length ? ids[0] : null;
      }
      persist(); notify();
      return Store;
    },

    setMeta: function (pid, key, value) {
      var p = project(pid); if (!p) return Store;
      p.meta[key] = value; touch(pid); notify();
      return Store;
    },

    setStatus: function (pid, stepId, status) {
      var p = project(pid); if (!p) return Store;
      if (status === null || status === undefined || status === '') delete p.st[stepId];
      else p.st[stepId] = status;
      touch(pid); notify();
      return Store;
    },

    setNote: function (pid, stepId, text) {
      var p = project(pid); if (!p) return Store;
      if (!text) delete p.note[stepId]; else p.note[stepId] = text;
      touch(pid); notify();
      return Store;
    },

    setLoc: function (pid, stepId, text) {
      var p = project(pid); if (!p) return Store;
      if (!text) delete p.loc[stepId]; else p.loc[stepId] = text;
      touch(pid); notify();
      return Store;
    },

    setGateNA: function (pid, gateId, na) {
      var p = project(pid); if (!p) return Store;
      if (na) p.gateNA[gateId] = true; else delete p.gateNA[gateId];
      touch(pid); notify();
      return Store;
    },

    /* ------------------------------------------------------------- находки */

    addFinding: function (pid, draft) {
      var p = project(pid); if (!p) return null;
      var ACm = root.NpiCore;
      var n = p.findings.length + 1;
      var id = 'f-' + n;
      while (p.findings.some(function (f) { return f.id === id; })) {
        n++; id = 'f-' + n;
      }
      var f = ACm.normalizeFinding(Object.assign({ id: id, ts: Date.now() }, draft), n - 1);
      f.id = id;
      p.findings.push(f);
      touch(pid); notify();
      return f;
    },

    updateFinding: function (pid, findingId, patch) {
      var p = project(pid); if (!p) return null;
      for (var i = 0; i < p.findings.length; i++) {
        if (p.findings[i].id === findingId) {
          var merged = Object.assign({}, p.findings[i], patch || {});
          merged.id = findingId;
          p.findings[i] = root.NpiCore.normalizeFinding(merged, i);
          p.findings[i].id = findingId;
          touch(pid); notify();
          return p.findings[i];
        }
      }
      return null;
    },

    removeFinding: function (pid, findingId) {
      var p = project(pid); if (!p) return Store;
      for (var i = 0; i < p.findings.length; i++) {
        if (p.findings[i].id === findingId) {
          var ph = p.findings[i].photos || [];
          for (var j = 0; j < ph.length; j++) deletePhoto(ph[j]);
          p.findings.splice(i, 1);
          break;
        }
      }
      touch(pid); notify();
      return Store;
    },

    /* ---------------------------------------------------------------- фото */

    /**
     * Принять файл изображения, уменьшить и сохранить.
     * Возвращает { id, name, w, h, bytes, dataUrl }.
     * В Node нет файлового ввода — метод помечен как браузерный.
     */
    addPhoto: function (file, maxPx) {
      if (!hasWindow || typeof root.window.FileReader === 'undefined') {
        return Promise.reject(new Error('addPhoto требует браузера'));
      }
      var max = typeof maxPx === 'number' ? maxPx : 1600;
      return new Promise(function (resolve, reject) {
        var fr = new root.window.FileReader();
        fr.onerror = function () { reject(new Error('не удалось прочитать файл')); };
        fr.onload = function () {
          var dataUrl = fr.result;
          shrink(dataUrl, max).then(function (small) {
            var id = Store.pure.makePhotoId();
            var rec = {
              id: id,
              name: String(file.name || 'photo'),
              type: small.type,
              w: small.w, h: small.h,
              bytes: small.bytes,
              dataUrl: small.dataUrl
            };
            putPhoto(rec).then(function () { resolve(rec); }, reject);
          }).catch(reject);
        };
        fr.readAsDataURL(file);
      });
    },

    photo: function (id) { return getPhoto(id); },
    photos: function () { return allPhotos(); },
    deletePhoto: function (id) { return deletePhoto(id); },
    inlineMode: function () { return !idbAvailable(); },

    /* --------------------------------------------------- экспорт / импорт */

    /** JSON всего состояния. Фото — как data URL, поэтому размер честный. */
    exportState: function (pid) {
      var p = project(pid);
      if (!p) return Promise.reject(new Error('проект не найден'));
      return allPhotos().then(function (recs) {
        var byId = {};
        for (var i = 0; i < recs.length; i++) byId[recs[i].id] = recs[i];
        var used = {};
        (p.findings || []).forEach(function (f) {
          (f.photos || []).forEach(function (id) { used[id] = true; });
        });
        var photos = [];
        Object.keys(used).forEach(function (id) {
          if (byId[id]) photos.push({
            id: id, name: byId[id].name, type: byId[id].type,
            w: byId[id].w, h: byId[id].h, bytes: byId[id].bytes,
            dataUrl: byId[id].dataUrl
          });
        });
        return {
          format: 'npi-checklist-project',
          version: 1,
          exported: new Date().toISOString(),
          checklistVersion: (root.NPI && root.NPI.version) || '',
          project: p,
          photos: photos
        };
      });
    },

    exportJson: function (pid) {
      return Store.exportState(pid).then(function (doc) {
        return JSON.stringify(doc, null, 2);
      });
    },

    importJson: function (text) {
      var doc;
      try { doc = JSON.parse(text); }
      catch (e) { return Promise.reject(new Error('файл не является корректным JSON: ' + e.message)); }
      if (!doc || doc.format !== 'npi-checklist-project') {
        return Promise.reject(new Error('это не экспорт проекта NPI-чек-листа'));
      }
      if (!doc.project || typeof doc.project !== 'object') {
        return Promise.reject(new Error('в файле нет проекта'));
      }
      var id = nextProjectId(Object.keys(state.projects));
      var copy = JSON.parse(JSON.stringify(doc.project));
      copy.ts = Date.now();
      state.projects[id] = copy;
      state.activeId = id;
      persist();
      var photos = Array.isArray(doc.photos) ? doc.photos : [];
      var chain = Promise.resolve();
      photos.forEach(function (ph) {
        chain = chain.then(function () { return putPhoto(ph); });
      });
      return chain.then(function () { notify(); return id; });
    }
  };

  /* ---------------------------------------------------- уменьшение фото */

  /**
   * Уменьшить data URL до maxPx по большей стороне, перекодировав в JPEG.
   * Возвращает { dataUrl, w, h, bytes, type }.
   * Если canvas недоступен (file:// в редких случаях), возвращает исходник.
   */
  function shrink(dataUrl, max) {
    return new Promise(function (resolve) {
      var done = function (out) { resolve(out); };
      if (!hasWindow || typeof root.window.Image === 'undefined') {
        return done({ dataUrl: dataUrl, w: 0, h: 0, bytes: approxBytes(dataUrl), type: guessType(dataUrl) });
      }
      var img = new root.window.Image();
      img.onload = function () {
        var box = fitBox(img.naturalWidth, img.naturalHeight, max);
        var canvas = root.window.document.createElement('canvas');
        canvas.width = box.w; canvas.height = box.h;
        var ctx2 = canvas.getContext('2d');
        if (!ctx2) {
          return done({ dataUrl: dataUrl, w: img.naturalWidth, h: img.naturalHeight,
            bytes: approxBytes(dataUrl), type: guessType(dataUrl) });
        }
        ctx2.drawImage(img, 0, 0, box.w, box.h);
        var out = canvas.toDataURL('image/jpeg', 0.85);
        done({ dataUrl: out, w: box.w, h: box.h, bytes: approxBytes(out), type: 'image/jpeg' });
      };
      img.onerror = function () {
        done({ dataUrl: dataUrl, w: 0, h: 0, bytes: approxBytes(dataUrl), type: guessType(dataUrl) });
      };
      img.src = dataUrl;
    });
  }

  function approxBytes(dataUrl) {
    var i = String(dataUrl).indexOf(',');
    if (i < 0) return 0;
    var b64 = String(dataUrl).slice(i + 1);
    var pad = b64.indexOf('=') > 0 ? 2 : (b64.length % 4 === 2 ? 1 : (b64.length % 4 === 3 ? 2 : 0));
    return Math.max(0, Math.floor(b64.length * 3 / 4) - pad);
  }

  function guessType(dataUrl) {
    var m = /^data:([^;]+)/.exec(String(dataUrl));
    return m ? m[1] : 'image/jpeg';
  }

  root.Store = Store;
})(typeof globalThis !== 'undefined' ? globalThis
  : typeof window !== 'undefined' ? window
  : typeof global !== 'undefined' ? global
  : this);
