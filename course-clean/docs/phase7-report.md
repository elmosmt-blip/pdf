# Phase 7 — navigation and trust

## What was asked

Learning paths for three audiences (new to the line / process technologist /
quality inspector); the course version and its change log visible; a
"Report an error" link on every lesson and case that carries the page id;
print styles; a check of keyboard navigation and colour contrast.

## What was done

| Item | Where | Result |
|---|---|---|
| Learning paths | `data/paths.json`, routes `#/p/` and `#/p/<id>`, home-page block, sidebar block | 3 paths: novice 35 lessons + 2 cases (≈11 h), technologist 57 lessons + 8 cases (≈22 h), inspector 34 lessons + 7 cases. The choice is stored in progress; every lesson shows *Path · step N of M · Next in path*; a lesson outside the path says so and offers the way back. Mastery is shared with the full course (no separate scoring). |
| Version + change log | `data/meta.json` (`version`, `date`, `changelog[]`), page `#/about/`, sidebar line `v1.0.0 · 2026-10-31 · build <hash> · what changed` | Version names the content; the build hash (already present) names the files. `check-integrity` requires semver, ISO date and that the top change-log entry equals `version`. |
| Report an error | `reportLinkHtml()` in app.js; target from `meta.report` | Link at the end of every lesson and case. Form mode: `formUrl?entry.lesson=lesson m04l03&entry.version=1.0.0&entry.build=<hash>&entry.url=<page>` (parameter names configurable in `report.params`). If `formUrl` is empty and `email` is set, a `mailto:` with the same facts in subject and body is used. **The shipped `formUrl` is a placeholder** — `check-integrity` prints a note until it is replaced. |
| Print styles | `@media print` block in `style.css`; hidden `.print-meta` footer on lessons and cases | Sidebar, top bar, quiz, exam, pager, path strip, buttons and hero are dropped; the palette switches to black on white (all pairs ≥ 6.5:1); figures/tables/callouts avoid page breaks; external source links print their URL; every page carries *course · vX · lesson id · title · build*. |
| Keyboard | figures `tabindex=0 role=button aria-pressed`; Enter/Space toggles zoom, Escape closes and returns focus; case pager `<nav>` labelled | Previously the figure zoom was mouse-only. |
| Contrast | `scripts/check-a11y.js` | 26 colour pairs computed from the `:root` palette (with alpha composited over the real background) and the print palette: all ≥ WCAG AA. Two states were below or at the edge and were raised: `.opt--muted` 0.55 → 0.7 (4.53 → 6.67:1), `.toc-exam--locked` 0.75 → 0.85 (4.62 → 5.62:1); the sidebar build line lost its 0.55 opacity because it now carries links. |
| Audit script | `scripts/check-a11y.js` (ships with the build) | Contrast layer + jsdom keyboard layer over 9 routes: skip link, no inline handlers, every `<a>` has `href`, no positive tabindex, every `[data-act]` control is a native button/link/field, figures operable, images have `alt`, fields have labels, `<nav>` labelled, one `h1`, focus lands on `h1`, report link + print footer on lessons/cases. 170 checks, 0 failures. |
| Tests | `tests/course.test.js` phase-7 block | +30 assertions: paths on home/sidebar/page, follow/leave flow, strip inside/outside path, report link on all 92 lessons and 15 cases, About page entries, keyboard zoom, a11y script exit code, print block. Suite 241/0. |

## Path composition (rationale)

* **New to the line** — one lesson per concept along the whole line, first
  lesson of each module plus the defect atlas of each stage; cases: the MSL
  breach and the reflow-profile validation, both readable without
  calculation depth.
* **Process technologist** — every lesson of M03–M06, M09, M10, M14 and M15;
  from inspection modules only the metric lessons (SPI capability, AOI
  metrics, X-ray); all cases that end in a process decision.
* **Quality inspector** — all of M01 and M07; MSL evidence lessons; SPI/AOI
  reading; workmanship classes; rework acceptance; cleanliness verification;
  the three data-handling lessons of M14; cases that end in a disposition.

Paths are data, not code: edit `data/paths.json`, run `build-embed`, and
`check-integrity` verifies that every id exists and none repeats.

## Open items

* `meta.report.formUrl` must be replaced with the real form address (the
  user chose an external form; the address was not supplied). Until then the
  link renders but leads to a placeholder.
* No pixel screenshots in this sandbox (no browser binary); the print layout
  was verified by rule inspection and the palette check, not by a PDF render.
