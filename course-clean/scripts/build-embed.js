#!/usr/bin/env node
/* =========================================================================
 * build-embed.js — regenerate assets/data-embed.js from data/*.json
 *
 * The course must work from file:// as well as over http, so the three JSON
 * files are inlined into one classic script as `var COURSE_DATA = {...}`.
 * If you edit data/*.json and forget this step, the browser silently shows
 * the previous copy — a failure with no error message, which is why
 * scripts/check-integrity.js compares the embed against the JSON byte for
 * byte after parsing.
 *
 * Usage:
 *   node scripts/build-embed.js            # write assets/data-embed.js
 *   node scripts/build-embed.js --check    # exit 1 if the embed is stale
 *   node scripts/build-embed.js --out <f>  # write elsewhere
 *
 * Order of keys inside COURSE_DATA matters for a byte-identical rebuild, so
 * it is fixed here rather than inherited from an object literal.
 * ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const TARGET = path.join(ROOT, 'assets', 'data-embed.js');

/* Fixed order: lessons, questions, sources, then the case document. */
const FILES = [
  ['lessons', 'lessons.json'],
  ['questions', 'questions.json'],
  ['sources', 'sources.json']
];

/* cases.json is a single object, not an array, so it is loaded separately and
 * exposed as COURSE_DATA.caseDoc. A build without cases still works. */
const CASE_FILE = 'cases.json';

function readJson(file) {
  let raw = fs.readFileSync(file, 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  return JSON.parse(raw);
}

function build() {
  const payload = {};
  const counts = {};
  FILES.forEach(function (pair) {
    const key = pair[0];
    const file = path.join(DATA, pair[1]);
    if (!fs.existsSync(file)) throw new Error('missing data file: ' + file);
    const value = readJson(file);
    if (!Array.isArray(value)) throw new Error(pair[1] + ' must be a top-level array');
    payload[key] = value;
    counts[key] = value.length;
  });

  /* The case document travels inside the same embed so the course keeps
   * working from file:// with no server and no extra request. */
  const casePath = path.join(DATA, CASE_FILE);
  if (fs.existsSync(casePath)) {
    const caseDoc = readJson(casePath);
    payload.caseDoc = caseDoc;
    counts.cases = Array.isArray(caseDoc.cases) ? caseDoc.cases.length : 0;
  } else {
    counts.cases = 0;
  }

  /* Phase 4: the template manifest travels too, so the Toolkit shelf renders
     from file:// without a second request. The template FILES stay outside the
     embed — they are downloads, not data. */
  const tplPath = path.join(ROOT, 'assets', 'templates', 'manifest.json');
  if (fs.existsSync(tplPath)) {
    const tpl = readJson(tplPath);
    payload.templates = tpl;
    counts.templates = (tpl.templates || []).length;
  } else {
    counts.templates = 0;
  }

  /* Phase 5: the derived glossary / formula sheet (data/reference.json,
     written by scripts/build-reference.js) travels too, for the same file://
     reason. Optional: a build without it simply shows no reference pages. */
  const refPath = path.join(DATA, 'reference.json');
  if (fs.existsSync(refPath)) {
    const ref = readJson(refPath);
    payload.reference = ref;
    counts.terms = (ref.terms || []).length;
    counts.formulas = (ref.formulas || []).length;
  }

  /* Phase 7: course version / change log / error-report config and the
     learning paths. Both optional so an older tree still embeds. */
  [['meta', 'meta.json'], ['paths', 'paths.json']].forEach(function (pair) {
    const f = path.join(DATA, pair[1]);
    if (fs.existsSync(f)) {
      const v = readJson(f);
      payload[pair[0]] = v;
      if (pair[0] === 'paths') counts.paths = (v.paths || []).length;
      if (pair[0] === 'meta') counts.version = v.version;
    }
  });

  /* JSON.stringify with no indentation keeps the file small; the trailing
     newline is deliberate so `git diff` stays clean when only the tail moves. */
  const json = JSON.stringify(payload);
  return {
    text: 'var COURSE_DATA=' + json + ';\n',
    counts: counts,
    bytes: Buffer.byteLength(json, 'utf8')
  };
}

/** Parse an existing embed and return its payload, or null if unreadable. */
function readEmbed(text) {
  const m = /^var COURSE_DATA=([\s\S]*);\s*$/.exec(text);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch (e) { return null; }
}

function main(argv) {
  const check = argv.indexOf('--check') !== -1;
  const outIdx = argv.indexOf('--out');
  const outFile = outIdx !== -1 && argv[outIdx + 1] ? path.resolve(argv[outIdx + 1]) : TARGET;

  let built;
  try {
    built = build();
  } catch (err) {
    console.error('build-embed: ' + err.message);
    return 1;
  }

  if (check) {
    if (!fs.existsSync(outFile)) {
      console.error('build-embed --check: ' + path.relative(ROOT, outFile) + ' does not exist');
      return 1;
    }
    const current = fs.readFileSync(outFile, 'utf8');
    const parsed = readEmbed(current);
    if (!parsed) {
      console.error('build-embed --check: the embed cannot be parsed (expected "var COURSE_DATA=…;")');
      return 1;
    }
    /* Compare parsed values, not raw text: a whitespace-only difference is
       not staleness, but any content difference is. */
    const fresh = readEmbed(built.text);
    const same = JSON.stringify(parsed) === JSON.stringify(fresh);
    if (!same) {
      const counts = { lessons: 0, questions: 0, sources: 0 };
      Object.keys(counts).forEach(function (k) {
        counts[k] = (Array.isArray(parsed[k]) ? parsed[k].length : 0);
      });
      counts.cases = parsed.caseDoc && Array.isArray(parsed.caseDoc.cases) ? parsed.caseDoc.cases.length : 0;
      console.error('build-embed --check: STALE');
      console.error('  embed  lessons ' + counts.lessons + ', questions ' + counts.questions +
        ', sources ' + counts.sources + ', cases ' + counts.cases);
      console.error('  data   lessons ' + built.counts.lessons + ', questions ' + built.counts.questions +
        ', sources ' + built.counts.sources + ', cases ' + built.counts.cases);
      console.error('  run: node scripts/build-embed.js');
      return 1;
    }
    console.log('build-embed --check: OK (' + built.counts.lessons + ' lessons, ' +
      built.counts.questions + ' questions, ' + built.counts.sources + ' sources, ' +
      built.counts.cases + ' cases)');
    return 0;
  }

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, built.text, 'utf8');
  console.log('build-embed: wrote ' + path.relative(ROOT, outFile) +
    ' (' + built.bytes + ' bytes: ' + built.counts.lessons + ' lessons, ' +
    built.counts.questions + ' questions, ' + built.counts.sources + ' sources, ' +
    built.counts.cases + ' cases)');
  return 0;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = { build: build, readEmbed: readEmbed, FILES: FILES };
