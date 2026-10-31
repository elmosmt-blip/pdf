#!/usr/bin/env node
'use strict';
/*
 * apply-course-images.js — attach one generated illustration per lesson.
 *
 * The course renders an undocumented-but-supported content block
 *   { t:'image', src:'assets/img/<lessonId>.png', alt, caption }
 * as a <figure class="fig fig--photo"><img width=1280 height=896>. The
 * validator knows the type and the renderer hides the figure if the file is
 * missing, so a lesson whose image has not been generated yet simply renders
 * without one.
 *
 * Only 15 of the 92 lessons carry an SVG figure and only 10 carry a table,
 * so most lessons have no visual at all. This script attaches one generated
 * illustration to every lesson that has an entry in scripts/course-images.json,
 * placed immediately after the lesson's SVG schematic when it has one, or at
 * the head of the first theory section's block list when it does not.
 *
 * Every illustration is drawn in the course design system extracted from
 * assets/style.css: background #0D1117, single signal teal #53d1cc, slate
 * hairlines, translucent dark glass panels, IBM Plex Mono labels, 1280x896.
 * The manifest records what each illustration was reviewed against; where a
 * lesson carries numeric limits the values are dictated in the generation
 * prompt and recorded in the manifest caption or alt text.
 *
 * Usage: node scripts/apply-course-images.js [dataDir]
 */

const fs = require('fs');
const path = require('path');

const dataDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, '..', 'data');
const LESSONS_FILE = path.join(dataDir, 'lessons.json');
const MANIFEST = path.join(__dirname, 'course-images.json');

function note(msg) { console.log('  ' + msg); }

function main() {
  console.log('apply-course-images: dataDir=' + dataDir);
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const ids = Object.keys(manifest).filter(function (k) { return k.indexOf('_') !== 0; });
  const lessons = JSON.parse(fs.readFileSync(LESSONS_FILE, 'utf8'));
  let attached = 0;
  let skipped = 0;
  let cleaned = 0;

  for (const lessonId of ids) {
    const lesson = lessons.find(function (l) { return l.lessonId === lessonId; });
    if (!lesson) throw new Error('lesson not found: ' + lessonId);
    const meta = manifest[lessonId];
    const src = 'assets/img/' + lessonId + '.png';
    const file = path.join(dataDir, '..', 'assets', 'img', lessonId + '.png');
    if (!fs.existsSync(file)) throw new Error('missing image file: ' + file);

    const block = { t: 'image', src: src, alt: meta.alt, caption: meta.caption };

    // Find the theory section that carries the lesson's SVG figure, else the
    // first theory section that already holds blocks.
    let section = null;
    for (const t of (lesson.content.theory || [])) {
      if (t && typeof t === 'object' && Array.isArray(t.blocks) &&
          t.blocks.some(function (b) { return b && b.t === 'figure'; })) {
        section = t;
        break;
      }
    }
    if (!section) {
      for (const t of (lesson.content.theory || [])) {
        if (t && typeof t === 'object' && Array.isArray(t.blocks) && t.blocks.length) {
          section = t;
          break;
        }
      }
    }
    if (!section) {
      // No block-bearing section: the renderer draws blocks before the
      // paragraphs of the same theory entry, so a block-only entry puts the
      // illustration at the head of the Theory section with no heading.
      lesson.content.theory.unshift({ blocks: [] });
      section = lesson.content.theory[0];
      note('created a block-only theory entry for ' + lessonId);
    }

    // Drop the heading an earlier version of this script added for the same
    // purpose: the illustration needs no heading of its own.
    if (section.h === 'Illustration' && section.p === undefined) {
      delete section.h;
      cleaned++;
    }

    const existing = section.blocks.findIndex(function (b) { return b && b.t === 'image'; });
    if (existing !== -1) {
      if (section.blocks[existing].src === src) {
        skipped++;
        continue;
      }
      section.blocks.splice(existing, 1, block);
      note('replace ' + src + ' -> ' + lessonId);
      attached++;
      continue;
    }

    const figIndex = section.blocks.findIndex(function (b) { return b && b.t === 'figure'; });
    const at = figIndex === -1 ? 0 : figIndex + 1;
    section.blocks.splice(at, 0, block);
    note('attach ' + src + ' -> ' + lessonId +
      ' theory[' + (lesson.content.theory.indexOf(section)) + '].blocks[' + at + ']');
    attached++;
  }

  if (attached === 0 && cleaned === 0) {
    note('nothing to do — ' + skipped + ' image(s) already attached');
    return;
  }
  fs.writeFileSync(LESSONS_FILE, JSON.stringify(lessons, null, 2) + '\n', 'utf8');
  console.log('apply-course-images: attached ' + attached + ' image(s), ' +
    skipped + ' already present, ' + cleaned + ' stray heading(s) removed.');
}

try { main(); } catch (e) {
  console.error('apply-course-images: FAILED — ' + e.message);
  process.exit(1);
}
