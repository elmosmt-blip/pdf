'use strict';
/* Phase 6 — illustration fixes.
 *
 * manifest.json lists, per lesson, what to do with the media blocks that the
 * baseline carries:
 *   { id, section, figure, caption, mode, alt?, imageCaption? }
 *   mode "replace-image"  : the raster block in that section becomes an inline
 *                           SVG figure (figures/<figure>.svg); the raster is
 *                           kept after it only when `keepImage` is true.
 *   mode "replace-figure" : the existing inline figure in that section is
 *                           swapped for the new SVG.
 *   alt / imageCaption    : new alt / caption for the raster that stays.
 * The SVG text is the source of truth for every number drawn, and
 * check-numbers.js verifies those numbers against the lesson prose. */
const fs = require('fs');
const path = require('path');

const MANIFEST = path.join(__dirname, 'manifest.json');
const FIG_DIR = path.join(__dirname, 'figures');

function svgOf(name) {
  const file = path.join(FIG_DIR, name + '.svg');
  return fs.readFileSync(file, 'utf8').replace(/\r?\n\s*/g, ' ').trim();
}

function applyFigures(lessons) {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const report = [];
  manifest.forEach(function (m) {
    const l = lessons.filter(function (x) { return x.lessonId === m.id; })[0];
    if (!l) throw new Error('phase6: unknown lesson ' + m.id);
    const sec = l.content.theory[m.section];
    if (!sec || !Array.isArray(sec.blocks)) throw new Error('phase6: ' + m.id + ' section ' + m.section + ' has no blocks');
    const blocks = sec.blocks;
    const img = blocks.filter(function (b) { return b.t === 'image'; })[0];
    if (m.alt && img) img.alt = m.alt;
    if (m.imageCaption && img) img.caption = m.imageCaption;
    if (!m.figure) { report.push(m.id + ': alt/caption only'); return; }
    const fig = { t: 'figure', svg: svgOf(m.figure), caption: m.caption };
    if (m.mode === 'replace-figure') {
      const i = blocks.findIndex(function (b) { return b.t === 'figure'; });
      if (i < 0) throw new Error('phase6: ' + m.id + ' has no figure to replace');
      blocks[i] = fig;
    } else {
      const i = blocks.findIndex(function (b) { return b.t === 'image'; });
      if (i < 0) throw new Error('phase6: ' + m.id + ' has no image to replace');
      if (m.keepImage) blocks.splice(i, 0, fig); else blocks[i] = fig;
    }
    report.push(m.id + ': ' + m.mode + ' <- ' + m.figure);
  });
  return report;
}

module.exports = { applyFigures: applyFigures };
