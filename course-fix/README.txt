SMT & THT PROCESS ENGINEER — SELF-STUDY COURSE
Round 21 build (2026-11-02). Static HTML/CSS/JS: no framework, no build step.

WHAT THIS BUNDLE IS
-------------------
A full, running copy of the course — not a patch pack. Drop it in place as-is:
open index.html from a web server, or straight from the filesystem.

The course has been audited end to end. Every lesson was read, every worked
calculation recomputed, every quiz answer checked against the standard it cites,
and every one of the 92 illustrations reviewed against the lesson text it
belongs to. Nineteen defects were found and fixed; they are recorded in
docs/COURSE_FIXES.md with the source text that settled each one.

CONTENTS
--------
  15 modules, 92 lessons, 185 quiz questions, 39 named standards
  13 process stages, each linked to the Process Auditor

  Every lesson carries:
    - theory prose, with 15 SVG schematics and 10 tables where a picture or a
      grid beats a paragraph
    - a worked calculation with the arithmetic shown
    - a real defect, with symptom, cause and the action that clears it
    - a source reference naming the standard or document it rests on

  Every one of the 92 lessons has a generated illustration, drawn in the course
  design system (background #0D1117, single signal teal #53d1cc, slate
  hairlines, translucent glass panels, IBM Plex Mono labels) at 1024x717.

  Quizzes are graded in the page by code. 94
  single-answer and 91 calculation questions, exactly 4 options each.

  Standards are named, never quoted: the course teaches the method and cites
  where the method comes from. It is a training course, not a work instruction.

FILES
-----
  index.html                    entry point (3,218 bytes)
  assets/app.js                 renderer and router (51,078 bytes)
  assets/style.css              design system (24,727 bytes)
  assets/data-embed.js          embedded snapshot for the file:// runtime
                                 (1,034,636 bytes) — MUST be replaced together
                                 with the JSON files or the offline runtime
                                 serves stale content
  assets/img/mNNlNN.png         one illustration per lesson, 1024x717, 92 files
  data/lessons.json             92 lessons (890,273 bytes)
  data/questions.json           185 questions (236,232 bytes)
  data/sources.json             39 sources with provenance and edition
                                 (24,343 bytes)
  scripts/                      the audit and fix toolchain — see below
  docs/                         the audit record — see below

REVIEW STATE
------------
  All 92 lessons: status "reviewed". No TBD-REVIEW marker survives anywhere —
  not in the data, not in the shell, not in a caption, not in an SVG label, and
  not in the page's meta description. Every lesson and every question carries a
  source reference.

  docs/REVIEW_CHECKLIST.md is the audit record. Part A lists 30 recurring facts
  and how each was settled; Part B lists every distinct claim in the course,
  grouped by the standard it cites, with the lesson and field path; Part C is
  the per-lesson sign-off, 92 of 92. Regenerate it with
  `node scripts/build-review-checklist.js data/lessons.json data/sources.json
  REVIEW_CHECKLIST.md data/questions.json` — it is deterministic and
  byte-identical on re-run.

SCRIPTS
-------
  Apply and verify:

    check-course.js              schema and referential integrity
    gates.js                     coverage gates (G-COMP, G-QUIZ)
    verify-runtime.js            boots the real app.js in a stubbed DOM and
                                 asserts on what a reader actually gets;
                                 add --fetch-ok to exercise the HTTP branch
    per-lesson-audit.js          renders all 92 lessons, checks images and
                                 asserts no marker renders on any lesson
    check-calc-arithmetic.js     evaluates every worked calculation's chain,
                                 including parenthesised groups and unit
                                 scaling, and accepts a result rounded to the
                                 precision actually written
    build-review-checklist.js    regenerates the audit record, deterministically
    banner-check.js              render-level assertion that no draft banner
                                 reaches #main

  Fixes (all idempotent, all guarded on exact source text, all fail loudly if
  the expected text is not found — re-running reports "already applied"):

    apply-index-fix.js           the Cloudflare Rocket Loader defect that
                                 stopped app.js from executing at all
    apply-marker-removal.js      per-lesson draft markers and TBD-REVIEW
    apply-review-banner-fix.js   the four shell-level markers, including the
                                 one that hid in a <meta> tag
    apply-theory-string-fix.js   m07l06 stored 7 of 8 theory sections as bare
                                 strings, which the renderer silently dropped
    apply-round18-fixes.js       D16/D17/D18
    apply-bake-quiz-fix.js, apply-source-editions.js, apply-source-refs.js,
    apply-source-provenance.js, apply-sampling-fix.js,
    apply-standards-verification.js, apply-sources-fix.js,
    apply-course-images.js, apply-table-fixes.js, apply-audit-fixes.js,
    apply-review-fixes.js, apply-verification-fixes.js

  Maintenance:

    rebuild-work.sh              rebuilds the work tree from the round-4 seed
                                 and re-applies every fix in dependency order.
                                 Refuses to run outside the repository layout.
    normalize-images.sh          normalises an illustration to 1024x717
    dump-lesson.js               readable per-lesson dump
    extract-partb.js             pulls the claim list out of the checklist

DOCS
----
  PROJECT_ANALYSIS.md     the first audit: what the course is and what was wrong
  COURSE_REVIEW.md        the early review pass
  COURSE_AUDIT_FULL.md    the full audit
  COURSE_FIXES.md         defects D1-D19, each with the evidence that settled it
  REVIEW_CHECKLIST.md     the audit record (Part A/B/C/D)
  SOURCES_VERIFIED.md     every source, its edition, and how it was verified

HOW TO APPLY
------------
  1. Copy the whole bundle over course/ — index.html, assets/ and data/.
  2. If you keep the JSON files separate from the app instead, run
     `node scripts/embed.js` to regenerate assets/data-embed.js from whatever
     JSON files are in place. The snapshot in this bundle already matches the
     bundled JSON.
  3. Run `node scripts/check-course.js data` and `node scripts/gates.js`.
     Expected: check-course OK; gates OK with 185 questions, 92 lessons,
     39 sources and G-COMP/G-QUIZ passed.
  4. Run `node scripts/verify-runtime.js .` and again with `--fetch-ok`.
     Expected: OK in both modes, 15 modules rendered.

KNOWN, DELIBERATELY LEFT OPEN
-----------------------------
  - gates.js reports 12 lessons in modules 14 and 15 with a null stageId, and
    two auditor stages (shipping, capability) with no course module. That is a
    contract gap between the course and the auditor, not a course defect. It is
    reported on every run rather than hidden.
  - Four illustrations carry plausible prop numbers — tray and reel dimensions,
    deposit dimensions — that contradict no lesson but were not dictated by one.
    Reported, not regenerated: the default is to flag, not to invent.

WHAT WAS FIXED, IN BRIEF
------------------------
  D1-D3   wrong numbers in theory, worked examples and quizzes
  D4      IPC-CC-830 chemistry designations that do not exist
  D5      a non-idempotent fixer that corrupted already-patched data
  D6      a bake table indexed to the wrong dimension
  D7      IPC-7711/7721 mis-attribution and an invented 0.25 mm limit
  D8      a reflow ramp rate no source supports
  D9      J-STD-005 powder sieve tails, wrong on both ends
  D10     time-above-liquidus attributed to the wrong standard
  D11     SnPb classification temperature taught as one flat figure
  D12     degree symbols, including inside inline SVG path data
  D13     a bake quiz quoting a collapsed secondary table
  D14     ANSI/ESD S4.1, superseded by STM4.1-2017
  D15     4,318 characters of a lesson silently dropped by its own renderer
  D16     two quizzes comparing a cross-sectional area with a fill height
  D17     a worked solution contradicting its own arithmetic
  D18     a calculation drill subtracting rounded intermediates
  D19     a draft marker hiding in the page's meta description

Round 21, on the author's instruction, took the review banner off the course
and removed every mention of how it was made:

  D20     the review banner itself, deleted from the module index
  D21     five places that named the tooling the course was built with, two of
          them invisible to every earlier sweep (a code comment and the README)

Plus two defects the sandbox reset exposed in the toolchain rather than the
course: `rebuild-preview.sh` was copying the unfixed round-4 `index.html` into
the preview, resurrecting the round-6 Rocket Loader delivery defect, and
`rebuild-work.sh` was globbing a stale `*.fixed.json` trio back into the work
tree on every rebuild.
