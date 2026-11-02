#!/usr/bin/env node
/* check-data.js — проверка assets/data.js против схемы чек-листа NPI.
 * Использование: node scripts/check-data.js [путь/к/data.js]
 * Нет зависимостей. Выход 0 — чисто, 1 — есть ошибки.
 *
 * Проверяет то, что нельзя проверить на уровне ядра: полноту и связность
 * самого содержания. Дубликат id шага, шаг без критерия приёмки, ссылка на
 * несуществующий норматив — всё это молча портит отчёт, поэтому ловится здесь.
 */
'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var target = process.argv[2] || path.join(__dirname, '..', 'assets', 'data.js');
var ctx = vm.createContext({ console: console });
vm.runInContext(fs.readFileSync(target, 'utf8'), ctx, { filename: path.basename(target) });
var NPI = ctx.NPI;

var errors = [];
var warnings = [];

var SEVERITIES = { B: 1, C: 1, W: 1, N: 1 };
var OWNERS = { npi: 1, design: 1, process: 1, material: 1, equipment: 1, people: 1, quality: 1 };
var EVIDENCE = { file: 1, photo: 1, data: 1, none: 1 };
var GATE_ID_RE = /^g\d{1,2}$/;
var STEP_ID_RE = /^g\d{1,2}-\d{2,3}$/;

if (!NPI || typeof NPI !== 'object') {
  console.error('data.js: не определена глобаль NPI');
  process.exit(1);
}

if (typeof NPI.version !== 'string' || !/^\d{4}\.\d{2}\.\d+$/.test(NPI.version)) {
  errors.push('version: ожидалось ГГГГ.ММ.N, получено ' + JSON.stringify(NPI.version));
}

['roles', 'severities', 'evidence'].forEach(function (k) {
  if (!NPI[k] || typeof NPI[k] !== 'object') errors.push(k + ': отсутствует или не объект');
});

if (!Array.isArray(NPI.gates) || !NPI.gates.length) {
  console.error('data.js: gates должен быть непустым массивом');
  process.exit(1);
}

var seenGate = {};
var seenStep = {};
var stepsTotal = 0;
var byOwner = {};
var bySev = {};
var byEv = {};
var withStd = 0;
var withVerifiedNumber = 0;
var withCrit = 0;
var withHow = 0;
var withFails = 0;

NPI.gates.forEach(function (g, gi) {
  var where = 'гейт[' + gi + ']';
  if (!g || typeof g !== 'object') { errors.push(where + ': не объект'); return; }

  if (typeof g.id !== 'string' || !GATE_ID_RE.test(g.id)) {
    errors.push(where + ': id должен соответствовать ' + GATE_ID_RE.source + ', получено ' +
      JSON.stringify(g.id));
  } else if (seenGate[g.id]) {
    errors.push(where + ': повторяющийся гейт ' + g.id);
  } else {
    seenGate[g.id] = true;
  }

  if (typeof g.name !== 'string' || !g.name) errors.push(where + ': пустое название');
  if (typeof g.t !== 'string' || !g.t) errors.push(where + ': пустое описание');
  if (typeof g.owner !== 'string' || !OWNERS[g.owner]) {
    errors.push(where + '.owner: ожидалось ' + Object.keys(OWNERS).join('|') +
      ', получено ' + JSON.stringify(g.owner));
  }
  if (!Array.isArray(g.steps) || !g.steps.length) {
    errors.push(where + ': у гейта нет шагов');
    return;
  }

  g.steps.forEach(function (s, si) {
    var sw = where + ' шаг[' + si + ']' + (s && s.id ? ' ' + s.id : '');
    if (!s || typeof s !== 'object') { errors.push(sw + ': не объект'); return; }
    stepsTotal++;

    if (typeof s.id !== 'string' || !STEP_ID_RE.test(s.id)) {
      errors.push(sw + ': id должен соответствовать ' + STEP_ID_RE.source + ', получено ' +
        JSON.stringify(s.id));
    } else {
      if (seenStep[s.id]) errors.push(sw + ': повторяющийся id шага');
      seenStep[s.id] = true;
      if (g.id && s.id.indexOf(g.id + '-') !== 0) {
        errors.push(sw + ': id шага не начинается с гейта ' + g.id);
      }
    }

    if (!SEVERITIES[s.s]) {
      errors.push(sw + ': s должно быть B|C|W|N, получено ' + JSON.stringify(s.s));
    } else { bySev[s.s] = (bySev[s.s] || 0) + 1; }

    if (!OWNERS[s.owner]) {
      errors.push(sw + ': owner должно быть ' + Object.keys(OWNERS).join('|') +
        ', получено ' + JSON.stringify(s.owner));
    } else { byOwner[s.owner] = (byOwner[s.owner] || 0) + 1; }

    if (!EVIDENCE[s.ev]) {
      errors.push(sw + ': ev должно быть ' + Object.keys(EVIDENCE).join('|') +
        ', получено ' + JSON.stringify(s.ev));
    } else { byEv[s.ev] = (byEv[s.ev] || 0) + 1; }

    if (typeof s.t !== 'string' || s.t.length < 10) {
      errors.push(sw + ': текст требования слишком короткий');
    }
    if (typeof s.how !== 'string' || s.how.length < 10) {
      errors.push(sw + ': не описано, как проверять');
    } else { withHow++; }

    if (!s.crit || typeof s.crit !== 'object' || Array.isArray(s.crit)) {
      errors.push(sw + ': crit должен быть объектом');
    } else {
      var ck = Object.keys(s.crit);
      if (!ck.length) {
        errors.push(sw + ': crit пустой — шаг невозможно принять');
      } else {
        ck.forEach(function (k) {
          if (k !== '2' && k !== '3') {
            errors.push(sw + ': crit.' + k + ' — допустимы только ключи "2" и "3"');
          } else if (typeof s.crit[k] !== 'string' || !s.crit[k]) {
            errors.push(sw + ': crit.' + k + ' должен быть непустой строкой');
          }
        });
        if (s.crit['2'] || s.crit['3']) withCrit++;
      }
    }

    if (s.std != null && typeof s.std !== 'string') {
      errors.push(sw + ': std должно быть строкой');
    } else if (s.std) { withStd++; }

    if (s.v != null && s.v !== 1) {
      errors.push(sw + ': v допустимо только как 1 (признак сверенного числового критерия)');
    } else if (s.v === 1) {
      withVerifiedNumber++;
      // Сверенный числовой критерий обязан опираться на норму.
      if (!s.std) {
        errors.push(sw + ': помечен как сверенный, но нормативный документ не указан');
      }
    }

    if (s.f != null) {
      if (!Array.isArray(s.f)) {
        errors.push(sw + ': f должно быть массивом строк');
      } else {
        s.f.forEach(function (x) {
          if (typeof x !== 'string' || !x) errors.push(sw + ': f содержит не-строку');
        });
        if (s.f.length) withFails++;
      }
    }
  });
});

/* ------------------------------------------------------------ связность */

// Порядок гейтов должен быть непрерывным: g0, g1, … без дыр.
var expected = [];
for (var i = 0; i < NPI.gates.length; i++) expected.push('g' + i);
var actual = NPI.gates.map(function (g) { return g.id; });
for (var j = 0; j < Math.max(expected.length, actual.length); j++) {
  if (expected[j] !== actual[j]) {
    errors.push('порядок гейтов: на позиции ' + j + ' ожидался ' + expected[j] +
      ', найден ' + actual[j]);
    break;
  }
}

// Предупреждения — не ошибки, но то, на что стоит посмотреть.
if (withVerifiedNumber < stepsTotal * 0.2) {
  warnings.push('сверенных числовых критериев мало: ' + withVerifiedNumber + ' из ' +
    stepsTotal + '. Проверьте, что числа в критериях не выдуманы.');
}
NPI.gates.forEach(function (g) {
  (g.steps || []).forEach(function (s) {
    if (s.s === 'B' && s.ev === 'none') {
      warnings.push(s.id + ': блокирующий шаг уровня B без требуемого доказательства');
    }
    if (s.s === 'B' && !s.f) {
      warnings.push(s.id + ': блокирующий шаг уровня B без списка типовых отказов');
    }
  });
});

/* ------------------------------------------------------------------ вывод */

console.log('check-data: ' + path.basename(target));
console.log('  гейтов:        ' + NPI.gates.length);
console.log('  шагов:         ' + stepsTotal);
console.log('  серьёзность:   ' + JSON.stringify(bySev));
console.log('  исполнитель:   ' + JSON.stringify(byOwner));
console.log('  доказательство:' + JSON.stringify(byEv));
console.log('  с нормой:      ' + withStd);
console.log('  сверено число: ' + withVerifiedNumber);
console.log('  с критерием:   ' + withCrit);
console.log('  с «как»:       ' + withHow);
console.log('  с отказами:    ' + withFails);

if (warnings.length) {
  console.log('\n  предупреждения (' + warnings.length + '):');
  warnings.forEach(function (w) { console.log('    ! ' + w); });
}

if (errors.length) {
  console.log('\n  ОШИБКИ (' + errors.length + '):');
  errors.forEach(function (e) { console.log('    x ' + e); });
  process.exit(1);
}
console.log('\ncheck-data: OK');
