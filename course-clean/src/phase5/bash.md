# Phase 5 authoring protocol

Each lesson: one Markdown file `src/phase5/raw/<id>.md` → `node src/phase5/raw-tool.js <id>`
→ compiled to `src/phase5/edit/<id>.js` → merged by `node src/phase5/run.js`.

The import refuses a file when a number, a standard name, a section or a heading
topic disappears, when a paragraph passes 120 words, or when the additions are
not 3/3/≥2. So the tool is the checker; write to satisfy it.

## Format

    ## <section heading, first word must match the original>
    Paragraph one.

    Paragraph two.

    ## Key takeaways
    - One sentence each, 8-34 words, ending in a full stop.

    ## Common mistakes
    - What people do :: What to do instead.

    ## Glossary
    - Term :: definition.

## Writing rules

- Active voice. Name the actor: receiving, the inspector, the printer operator,
  the process engineer. Never "it should be ensured".
- No sentence opens with It is / There is / This is / These are, and no paragraph
  opens with a heading echo ("Packing list proves…").
- Vary the openings: a verb, a condition, a number, a short claim.
- 2-4 sentences per paragraph, under 120 words. One idea per paragraph.
- Keep every number, unit and standard exactly as written, and keep the technical
  conclusion the same. Numbers are frozen; style is not.
- Do not add new technical claims that the lesson did not already make.

## Test case keywords (do not invent)

IPC-A-600 §3.5.3.1 conductor width 20 % reduction allowed, 10 % for Class 3 ·
IPC-A-610 · IPC-6012 · IPC/JEDEC J-STD-033 floor life MSL 1 unlimited, MSL 2 12 months,
MSL 3 168 h, MSL 4 72 h, MSL 5 48 h, MSL 5a 24 h, MSL 6 no floor life ·
J-STD-033 bake ceiling 40 °C for tape and reel · hand solder 330-360 °C ·
hole fill 75 % · SPI 75-125 % · QFP ±0.05…±0.10 mm, ±0.5…±1.0° ·
ROSE reference 1.56 µg/cm² NaCl equivalent, medical 0.5 µg/cm² · iron 45 W ·
SAC305 219 °C · board X 160×120 mm, 1.6 mm, 6 layers, ENIG, Tg 170.
