#!/usr/bin/env node
/* =========================================================================
 * raw-tool.js — import a lesson rewritten as plain text
 *
 * The structural pass is code because it is mechanical. The editorial pass is
 * prose, and prose written inside a JSON string literal is prose with every
 * quote escaped — which is how the stiffness being fixed got in. So a lesson
 * is rewritten as one ordinary Markdown file, src/phase5/raw/<lessonId>.md:
 *
 *     ## Document package at receiving
 *     First paragraph of the section.
 *
 *     Second paragraph of the section.
 *
 *     ## Key takeaways
 *     - Takeaway one.
 *     - Takeaway two.
 *     - Takeaway three.
 *
 *     ## Common mistakes
 *     - What people do :: what to do instead.
 *
 *     ## Glossary
 *     - Term :: definition.
 *
 *     ## Corrections
 *     - 0.45 -> 0.5 :: why the original number was wrong, and the source.
 *
 *     ## Solution
 *     Replacement text for the worked calculation's solution (one paragraph
 *     or several). Same guard as the theory: every number of the original
 *     solution survives or is declared under Corrections.
 *
 * A Correction is the ONLY way a number from the original may disappear. It
 * names the exact token that goes, the token that replaces it, and the reason;
 * the import still refuses any other lost number, and the correction travels
 * into the lesson record (content.corrections) so a reviewer can see what was
 * changed in this edition and why. A silent fix in the baseline is not an
 * option: the baseline is the evidence.
 *
 * Rules the import enforces, because they are the acceptance criteria:
 *   - the number of theory sections is unchanged, and each keeps its topic
 *     (the first word of the heading must match the original);
 *   - every numeric value and every standard designation in the original
 *     survives somewhere in the new text, or the import is refused with the
 *     list of what would be lost;
 *   - every paragraph stays under 120 words, and no paragraph is empty;
 *   - exactly 3 takeaways, exactly 3 mistakes, at least 2 glossary terms.
 *
 *     node src/phase5/raw-tool.js m01l02            # import + report
 *     node src/phase5/raw-tool.js m01l02 --dry      # report, write nothing
 * ========================================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const { BASELINE_PATH, readJson, words, sentences, bodies } = require('./lib');

const EDIT = path.join(__dirname, 'edit');
const RAW = path.join(__dirname, 'raw');
const MAX_WORDS = 120;

const STANDARDS = /\b(?:IPC(?:-[A-Z0-9]+)?(?:\/[A-Z0-9]+)?|J-STD-\d+[A-Z]?|JEDEC|ISO(?:\s+\d+)?|IEC(?:\s+\d+)?|ANSI|ESD\s+[A-Z]+\d*|UL|ASTM|MIL-[A-Z-]+\d*|REACH|RoHS)\b/g;

function tokensOf(text) {
  const nums = (String(text).match(/(?<![\w.-])\d+(?:[.,]\d+)?/g) || []);
  const stds = (String(text).match(STANDARDS) || []).map(function (s) { return s.replace(/\s+/g, ' ').trim(); });
  return { nums: nums, stds: stds };
}

function parseTheory(lessons, l, sections, corrections) {
  corrections = corrections || [];
  /* The theory array interleaves prose with media blocks, so the units are the
   * prose items: media keeps its place, the Nth section lands in the Nth slot. */
  const prose = [];
  l.content.theory.forEach(function (t, i) {
    if (t && (Array.isArray(t.p) || typeof t.p === 'string')) {
      prose.push({ index: i, heading: (t.h || '').trim(), paras: bodies(t) });
    }
  });
  const problems = [];
  if (sections.length !== prose.length) {
    problems.push('the file has ' + sections.length + ' theory sections, the lesson has ' + prose.length);
  }
  sections.forEach(function (s, i) {
    const o = prose[i];
    if (!o) return;
    /* A heading may be rewritten — several of them are heading echoes of the
     * paragraph below. What must survive is the topic, so the check is that at
     * least one content word is shared and the sections stay in order. */
    const STOP = ['the', 'a', 'an', 'of', 'and', 'or', 'to', 'for', 'in', 'on', 'at', 'by',
      'with', 'from', 'as', 'is', 'are', 'be', 'not', 'what', 'why', 'how', 'your', 'it',
      'this', 'that', 'into', 'than', 'then', 'so', 'but', 'up', 'per'];
    const key = function (h) {
      return String(h).toLowerCase().replace(/[^a-z0-9%\s-]/g, ' ').split(/[\s-]+/)
        .filter(function (w) { return w && STOP.indexOf(w) < 0; });
    };
    const ka = key(o.heading), kb = key(s.heading);
    const shared = kb.filter(function (w) { return ka.indexOf(w) >= 0; });
    if (ka.length && !shared.length) {
      problems.push('section ' + i + ': "' + s.heading + '" shares no topic word with "' + o.heading + '"');
    }
    s.paragraphs.forEach(function (p, j) {
      if (words(p).length > MAX_WORDS) problems.push('section ' + i + ' paragraph ' + j + ' has ' + words(p).length + ' words (max ' + MAX_WORDS + ')');
    });
  });

  /* Frozen numbers and standards. */
  const before = prose.map(function (o) { return o.paras.join(' '); }).join(' ');
  const after = sections.map(function (s) { return s.heading + ' ' + s.paragraphs.join(' '); }).join(' ');
  const tb = tokensOf(before), ta = tokensOf(after);
  const lostNums = [];
  const counts = {};
  ta.nums.forEach(function (n) { counts[n] = (counts[n] || 0) + 1; });
  /* A declared correction lets exactly one occurrence of `from` go, and
   * requires `to` to be present in the new text — otherwise the correction is
   * a deletion wearing a label. */
  const allowance = {};
  corrections.forEach(function (c) {
    allowance[c.from] = (allowance[c.from] || 0) + 1;
    if (!counts[c.to]) problems.push('correction ' + c.from + ' -> ' + c.to + ': the new value ' + c.to + ' is not in the text');
    if (tb.nums.indexOf(c.from) < 0) problems.push('correction ' + c.from + ' -> ' + c.to + ': ' + c.from + ' is not in the original');
    if (!c.why || words(c.why).length < 6) problems.push('correction ' + c.from + ' -> ' + c.to + ': give a reason of at least six words');
  });
  tb.nums.forEach(function (n) {
    if (counts[n]) { counts[n]--; return; }
    if (allowance[n]) { allowance[n]--; return; }
    if (lostNums.indexOf(n) < 0) lostNums.push(n);
  });
  if (lostNums.length) problems.push('numbers that would be lost: ' + lostNums.join(', '));
  const sb = new Set(tb.stds), sa = new Set(ta.stds);
  const lostStds = tb.stds.filter(function (s) { return !sa.has(s); });
  if (lostStds.length) problems.push('standards that would be lost: ' + Array.from(new Set(lostStds)).join(', '));

  return { prose: prose, problems: problems };
}

function main() {
  const id = process.argv[2];
  const DRY = process.argv.includes('--dry');
  const file = path.join(RAW, id + '.md');
  if (!id || !fs.existsSync(file)) { console.log('usage: node src/phase5/raw-tool.js <lessonId> [--dry]'); process.exit(2); }
  const l = readJson(BASELINE_PATH).filter(function (x) { return x.lessonId === id; })[0];
  if (!l) { console.log('!! no lesson ' + id); process.exit(2); }

  const md = fs.readFileSync(file, 'utf8');
  const chunks = md.split(/^## /m).filter(function (c) { return c.trim(); });
  const theory = [], additions = { takeaways: [], mistakes: [], terms: [], corrections: [], solution: null };
  chunks.forEach(function (chunk) {
    const lines = chunk.split('\n');
    const heading = lines.shift().trim();
    const body = lines.join('\n').trim();
    const items = body.split('\n').map(function (x) { return x.trim(); })
      .filter(function (x) { return x && x !== '-'; })
      .map(function (x) { return x.replace(/^[-*]\s+/, '').trim(); });
    if (/^key takeaways$/i.test(heading)) { additions.takeaways = items; return; }
    if (/^common mistakes$/i.test(heading)) {
      additions.mistakes = items.map(function (x) {
        const parts = x.split(/\s+::\s+/);
        return { mistake: (parts[0] || '').trim(), instead: (parts[1] || '').trim() };
      });
      return;
    }
    if (/^solution$/i.test(heading)) {
      additions.solution = body.split(/\n\s*\n/).map(function (p) {
        return p.replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
      }).filter(Boolean).join(' ');
      return;
    }
    if (/^corrections$/i.test(heading)) {
      additions.corrections = items.map(function (x) {
        const parts = x.split(/\s+::\s+/);
        const arrow = (parts[0] || '').split(/\s*->\s*/);
        return { from: (arrow[0] || '').trim(), to: (arrow[1] || '').trim(), why: (parts[1] || '').trim() };
      });
      return;
    }
    if (/^glossary$/i.test(heading)) {
      additions.terms = items.map(function (x) {
        const parts = x.split(/\s+::\s+/);
        return { term: (parts[0] || '').trim(), def: (parts[1] || '').trim() };
      });
      return;
    }
    const paragraphs = body.split(/\n\s*\n/).map(function (p) {
      return p.replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
    }).filter(Boolean);
    theory.push({ heading: heading, paragraphs: paragraphs });
  });

  const r = parseTheory(null, l, theory, additions.corrections);

  const problems = r.problems.slice();
  /* The solution override is guarded exactly like the theory: nothing numeric
   * from the original solution may vanish unless a Correction names it. */
  if (additions.solution) {
    const before = String((l.content.calc || {}).solution || '');
    const tb = tokensOf(before), ta = tokensOf(additions.solution);
    const counts = {}; ta.nums.forEach(function (n) { counts[n] = (counts[n] || 0) + 1; });
    const allowance = {}; additions.corrections.forEach(function (c) { allowance[c.from] = (allowance[c.from] || 0) + 1; });
    const lost = [];
    tb.nums.forEach(function (n) {
      if (counts[n]) { counts[n]--; return; }
      if (allowance[n]) { allowance[n]--; return; }
      if (lost.indexOf(n) < 0) lost.push(n);
    });
    if (lost.length) problems.push('solution: numbers that would be lost: ' + lost.join(', '));
    const sa = new Set(ta.stds);
    const lostStd = tb.stds.filter(function (x) { return !sa.has(x); });
    if (lostStd.length) problems.push('solution: standards that would be lost: ' + Array.from(new Set(lostStd)).join(', '));
    if (words(additions.solution).length < 40) problems.push('solution: under 40 words');
  }
  if (additions.takeaways.length !== 3) problems.push('takeaways: ' + additions.takeaways.length + ' (need 3)');
  if (additions.mistakes.length !== 3) problems.push('mistakes: ' + additions.mistakes.length + ' (need 3)');
  if (additions.terms.length < 2) problems.push('glossary: ' + additions.terms.length + ' (need 2 or more)');
  additions.mistakes.forEach(function (m, i) {
    if (!m.mistake || !m.instead) problems.push('mistake ' + i + ' is missing a half');
  });
  additions.terms.forEach(function (t, i) {
    if (!t.term || !t.def) problems.push('term ' + i + ' is missing a half');
  });

  const beforeW = r.prose.reduce(function (a, o) {
    return a + o.paras.reduce(function (b, p) { return b + words(p).length; }, 0);
  }, 0);
  const afterW = theory.reduce(function (a, s) {
    return a + s.paragraphs.reduce(function (b, p) { return b + words(p).length; }, 0);
  }, 0);
  console.log(id + ': ' + theory.length + ' sections, ' +
    theory.reduce(function (a, s) { return a + s.paragraphs.length; }, 0) + ' paragraphs, ' + afterW + ' words');
  console.log('   was: ' + r.prose.length + ' sections, ' +
    r.prose.reduce(function (a, o) { return a + o.paras.length; }, 0) + ' paragraphs, ' + beforeW + ' words');

  if (problems.length) {
    console.log('\nFAIL — ' + problems.length + ' problem(s)');
    problems.forEach(function (p) { console.log('  ' + p); });
    process.exitCode = 1;
    return;
  }
  console.log('\nOK — ' + additions.takeaways.length + ' takeaways, ' + additions.mistakes.length +
    ' mistakes, ' + additions.terms.length + ' terms; no number or standard lost' +
    (additions.corrections.length ? ' (' + additions.corrections.length + ' declared correction(s))' : '') + '.');
  if (DRY) { console.log('(dry run: nothing written)'); return; }

  fs.mkdirSync(EDIT, { recursive: true });
  /* The heading is part of the rewrite as well and the renderer prints it, so a
   * changed heading reaches the lesson instead of living only in the raw file. */
  const headings = [];
  theory.forEach(function (s, i) {
    const o = r.prose[i];
    if (o && s.heading !== o.heading) headings.push({ index: o.index, text: s.heading });
  });

  const out = [];
  r.prose.forEach(function (o, i) {
    const s = theory[i];
    out.push(o.index + ': {' + String.fromCharCode(10) +
      '  p: [' + String.fromCharCode(10) +
      s.paragraphs.map(function (p) { return '    ' + JSON.stringify(p); }).join(',' + String.fromCharCode(10)) +
      String.fromCharCode(10) + '  ]' + String.fromCharCode(10) + '}');
    
  });
  const js = [
    '/* ' + id + ' — ' + l.title,
    ' *',
    ' * Generated by src/phase5/raw-tool.js from raw/' + id + '.md.',
    ' * Edit the .md and re-import; this file is the compiled form.',
    ' */',
    'module.exports = {',
    '  headings: {',
    ind(headings.map(function (h) { return h.index + ': ' + JSON.stringify(h.text); }).join(',' + String.fromCharCode(10)), 2),
    '  },',
    '  paragraphs: {',
    ind(out.join(',\n'), 2),
    '  },',
    '  takeaways: [',
    additions.takeaways.map(function (t) { return '    ' + JSON.stringify(t); }).join(',\n'),
    '  ],',
    '  mistakes: [',
    additions.mistakes.map(function (m) {
      return '    { mistake: ' + JSON.stringify(m.mistake) + ', instead: ' + JSON.stringify(m.instead) + ' }';
    }).join(',\n'),
    '  ],',
    '  terms: [',
    additions.terms.map(function (t) {
      return '    { term: ' + JSON.stringify(t.term) + ', def: ' + JSON.stringify(t.def) + ' }';
    }).join(',\n'),
    '  ]' + (additions.corrections.length || additions.solution ? ',' : ''),
    additions.solution ? '  solution: ' + JSON.stringify(additions.solution) + (additions.corrections.length ? ',' : '') : '',
    additions.corrections.length ? '  corrections: [' : '',
    additions.corrections.map(function (c) {
      return '    { from: ' + JSON.stringify(c.from) + ', to: ' + JSON.stringify(c.to) + ', why: ' + JSON.stringify(c.why) + ' }';
    }).join(',\n'),
    additions.corrections.length ? '  ]' : '',
    '};'
  ].filter(function (line) { return line !== ''; }).join('\n');
  fs.writeFileSync(path.join(EDIT, id + '.js'), js + '\n');
  console.log('wrote src/phase5/edit/' + id + '.js');
}

/* Indent a block by n spaces, so the arithmetic sign in a join() stays a
 * join and not a second argument. */
function ind(text, n) {
  const pad = new Array(n + 1).join(' ');
  return String(text).split('\n').map(function (x) { return pad + x; }).join('\n');
}

main();
