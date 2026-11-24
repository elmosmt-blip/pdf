# Фаза 6 — аудит иллюстраций (92 растра `assets/img/*.webp`)

Дата: 2026-10-31. Проверены все 92 файла (1024×717, стиль «blueprint reference sheet»), каждый открыт в полном размере и сверен с текстом урока в `data/lessons.json`. Сырые заметки — `docs/phase6-image-notes.tsv`.

## Глобальные выводы

1. **Английский текст внутри растра — у всех 92 изображений.** Это свойство всего набора, а не отдельных файлов; в таблице ниже не повторяется. Решение — либо перегенерация всего набора, либо принять как «технический английский» (подписи `caption`/`alt` в курсе уже на языке курса).
2. **Обрезка текста по краям — 35 изображений** (кадр 1024×717 режет первые/последние символы заголовков и легенд). В 2 случаях (m09l04, m09l06) обрезан ключевой контент (формула, крайние плитки атласа).
3. **Содержательные ошибки — 8 изображений** (числа/подписи расходятся с уроком или стандартом, либо фото не из электроники).
4. **`alt` проверен у всех 92** — описывает то, что реально на картинке; расхождений не найдено. Там, где картинка ошибочна, `alt` остаётся корректным (он описывает намерение, а не ошибку), поэтому после переделки править `alt` не потребуется.
5. Даты/REV/DOC-ID в шапках листов — декоративные заполнители («2025-05-24», «YYYY-MM-DD»), к контенту урока не относятся.

Сводка по статусам: ok — 41, cropped — 34, minor — 4, ERROR — 8, numbers-not-in-text — 1, SEVERE-CROP — 2, wrong-label — 2.

## Приоритеты переделки

### P1 — переделать обязательно (содержание противоречит уроку или нечитаемо)

| id | Урок | Проблема |
|---|---|---|
| m03l01 | The paste volume budget: what the joint needs before the aperture is drawn | right panel labels low-AR case as "OVER-THICK APERTURE / OVER-THICK DEPOSIT" — thick foil + small aperture gives insufficient release, not an oversize deposit; numbers 0.66/1.5/0.30 mm ✓ |
| m03l02 | Area ratio and aspect ratio: definitions, calculation, fine-pitch consequences | low-AR case labelled "HIGH ASPECT RATIO" — thick foil with narrow aperture is LOW aspect ratio; numbers 0.66/1.5/0.30 ✓ |
| m06l01 | Heat transfer in the oven: convection, conduction, radiation, zone structure | TAL 30-60 s vs lesson 30-90 s; curve peak drawn ≈265 °C while labelled 245 °C (above the 250 °C ceiling the lesson states); soak 150-180 °C not in lesson; cooling 1-4 C/s vs lesson "≥2 °C/s"; axis 0-360 s; priority remake |
| m07l05 | Disposition language: defect, condition and class in workmanship terms | "real joint under evaluation" photo is a WELD bead on steel, not a solder joint — wrong domain; alt check |
| m09l01 | Wave architecture: flux, preheat, wave types (single/dual, lambda, micro-wave) | dual wave labelled "FIRST WAVE LAMINAR / SECOND WAVE TURBULENT" — reversed (first = turbulent chip wave, second = laminar); "lambda/micro-wave" descriptions invented; alt check |
| m09l04 | Contact time and fog height: dwell calculation, wave height vs board clearance | left title "NG: CONTACT TIME & FOG HEIGHT", right panel formula "t = L /" cut at "/", legend cut — the key formula is unreadable; priority remake (formula image) |
| m09l06 | Wave defect atlas: bridging, balling, insufficient fill, bypass, lifted lead, blowholes | title "LDERING DEFECT ATLAS", first and last defect tiles cut ("NT", "BLO…"), notes cut; priority remake |
| m14l04 | 8D discipline: D1–D8 content and where 8D reports fail | 8D steps mislabelled vs lesson: image D1 "emergency response", D3 "problem description", D4 "root cause", D5 "corrective action"; lesson: D3 containment, D4 root cause, D7 prevention, D8 closure — D2/D3 shifted; priority remake; alt generic ✓ |
| m14l05 | Corrective vs preventive action and effectiveness verification | "REWORKED JOINT" photo is a pipe WELD, not electronics — wrong domain; left "NONCONFORMITY" cut; alt check |
| m15l02 | The evidence pack: measured data, images with scale, defect rate, cost of poor quality | "ACTUAL DEFECT (MACRO PHOTOGRAPH)" is a hole in a steel plate — not electronics; tofu boxes "□□□□" everywhere (placeholder glyphs); priority remake / replace |

### P2 — переделать во вторую очередь (неверные подписи/лишние числа)

| id | Урок | Проблема |
|---|---|---|
| m08l01 | What stays through-hole and why: connectors, mechanical load, power | 75 % fill ✓; "external annular ring ≥0.05 mm, Class 3" is not in the lesson (lesson 0.05 mm is radial lead clearance) — a reader will conflate the two; alt ✓ |
| m12l04 | Coating types and selection: acrylic, urethane, silicone, parylene, UV cure | IPC-CC-830 type codes wrong: polyurethane "(ER)" should be UR, parylene "(DR)" should be XY (ER = epoxy); lesson uses no codes, so image invents wrong ones; alt ✓ |
| m03l06 | Stencil inspection and acceptance | несуществующий стандарт «IPC-9191» в растре (в уроке только IPC-7525 / IPC-A-610); плюс обрезка «SC» |

### P3 — косметика (обрезка краёв, опечатки); чинится общей перегенерацией с полями

m01l05, m01l07, m02l01, m02l02, m02l03, m02l04, m02l05, m02l06, m03l04, m04l01, m04l03, m04l05, m04l07, m05l01, m05l02, m05l03, m05l04, m05l05, m05l06, m06l04, m06l05, m06l06, m06l07, m07l04, m08l05, m09l02, m09l03, m09l07, m10l03, m10l05, m11l03, m12l02, m12l03, m12l05, m12l06, m14l02, m14l03, m14l07.

## Полная таблица

| id | Статус | Класс проблемы | Приоритет | alt | Замечание |
|---|---|---|---|---|---|
| m01l01 | ok | без замечаний | — | ✓ | numbers ✓ (3000/II/1.0%/K/125/3/4); fragment sentence "THAT ESCALATION GROWS…" in raster; alt ✓ |
| m01l02 | ok | без замечаний | — | ✓ | alt ✓; no numbers |
| m01l03 | ok | без замечаний | — | ✓ | numbers ✓ (501-1200 J, 1201-3200 K, 3201-10000 L; n=125; Ac3/Re4); alt ✓ |
| m01l04 | ok | без замечаний | — | ✓ | placeholder markings XXX/YYWW; alt ✓ |
| m01l05 | cropped | обрезан текст по краю | P3 | ✓ | left-edge labels cut: "EMPERATURE", "EFRIGERATED", "UMIDITY WARE", "CCESS"; no numbers; alt ✓ |
| m01l06 | ok | без замечаний | — | ✓ | alt ✓ |
| m01l07 | minor | мелочь (опечатка/иконка) | P3 | ✓ | biohazard symbol on quarantine cage (wrong icon); legend text micro; alt ✓ (four branches) |
| m02l01 | cropped | обрезан текст по краю | P3 | ✓ | title cut "OISTURE INSIDE…"; numbers ✓ MSL 3 168 h, 30 C/60% RH; alt ✓ |
| m02l02 | minor | мелочь (опечатка/иконка) | P3 | ✓ | HIC spots unlabelled (lesson uses 5/10/60 %); placeholder "◇–△"; alt ✓ |
| m02l03 | cropped | обрезан текст по краю | P3 | ✓ | title "OR-LIFE ACCOUNTING", left labels, right "EVENT LE…", key "BAKE EVENT (RESETS T" all cut; no numbers; alt ✓ |
| m02l04 | minor | мелочь (опечатка/иконка) | P3 | ✓ | "HH%" placeholder; typo "QUALITS"; no numbers; alt ✓ |
| m02l05 | cropped | обрезан текст по краю | P3 | ✓ | left edge "LAN VIEW", "ISSIPATIVE ORK SURFACE" cut; alt ✓ |
| m02l06 | minor | мелочь (опечатка/иконка) | P3 | ✓ | HIC text garbled ("LEVEL SENSITIVE / BAKE REQUIRED / CHECK IMMEDIATELY"); footer "EF: … J-STD-033" cut; "CONFIDENTIAL" filler |
| m03l01 | ERROR | содержательная ошибка | P1 | ✓ | right panel labels low-AR case as "OVER-THICK APERTURE / OVER-THICK DEPOSIT" — thick foil + small aperture gives insufficient release, not an oversize deposit; numbers 0.66/1.5/0.30 mm ✓ |
| m03l02 | ERROR | содержательная ошибка | P1 | ✓ | low-AR case labelled "HIGH ASPECT RATIO" — thick foil with narrow aperture is LOW aspect ratio; numbers 0.66/1.5/0.30 ✓ |
| m03l03 | ok | без замечаний | — | ✓ | no numbers; title slightly tight at left; alt ✓ |
| m03l04 | cropped | обрезан текст по краю | P3 | ✓ | left column "COMPONENT FAMILY" cut; right notes cut ("process robustness", "REV. A"); no numbers; alt ✓ |
| m03l05 | ok | без замечаний | — | ✓ | placeholders only (no numbers) — lesson has 0.66/1.5/0.120 mm/0.30 mm; image generic; alt ✓ |
| m03l06 | wrong-label | неверная подпись/код | P2 | ✓ | top-right "SC" cut; stray "IPC-9191" (does not exist — should be IPC-7525/IPC-A-610 only); tiny micro-text |
| m04l01 | cropped | обрезан текст по краю | P3 | ✓ | left labels "QUEEGEE", "ASTE ROLL", "PERTURE", "CB / BOARD", "UPPORT" cut; right input boxes cut; no numbers; alt ✓ |
| m04l02 | ok | без замечаний | — | ✓ | right panel slightly cut ("REACTING"); no numbers; alt ✓ |
| m04l03 | cropped | обрезан текст по краю | P3 | ✓ | left labels "TENCIL", "NAP-OFF GAP", "EPARATION", "CB", "UPPORT PINS" cut; right notes cut; no numbers (lesson has 0.2-0.6 N/mm, 20-80 mm/s); alt ✓ |
| m04l04 | ok | без замечаний | — | ✓ | no numbers; alt ✓ |
| m04l05 | cropped | обрезан текст по краю | P3 | ✓ | left axis labels "EPOSIT VOLUME", "EPOSIT UNDER INSPECTION" cut; chart ok (trend to upper limit matches lesson); no numbers; alt ✓ |
| m04l06 | ok | без замечаний | — | ✓ | defect names consistent with lesson (under-fill/excess/bridging/skew/smear); alt ✓ |
| m04l07 | cropped | обрезан текст по краю | P3 | ✓ | left "XAMPLE DEFECT", "YMBOL LEGEND", "RINT SYSTEM" cut; right column cut mid-word; no numbers; alt ✓ |
| m05l01 | cropped | обрезан текст по краю | P3 | ✓ | left "PICK-AND-PLACE" partially; spec values placeholders "[—]"; alt ✓ |
| m05l02 | cropped | обрезан текст по краю | P3 | ✓ | title "LACEMENT PROCESS…" cut left; no numbers; alt ✓ |
| m05l03 | cropped | обрезан текст по краю | P3 | ✓ | title left cut "FIDUCIALS" tight; no numbers; alt ✓ |
| m05l04 | cropped | обрезан текст по краю | P3 | ✓ | left column "CORRECT" cut, right "POLARITY" cut; defects consistent; alt ✓ |
| m05l05 | cropped | обрезан текст по краю | P3 | ✓ | title "OMPONENT LIBRARY", right edge "SHEE", "OP-◇" cut; no numbers; alt ✓ |
| m05l06 | cropped | обрезан текст по краю | P3 | ✓ | title "SHIFT AND SKEW" cut left; no numbers; alt ✓ |
| m06l01 | ERROR | содержательная ошибка | P1 | ✓ | TAL 30-60 s vs lesson 30-90 s; curve peak drawn ≈265 °C while labelled 245 °C (above the 250 °C ceiling the lesson states); soak 150-180 °C not in lesson; cooling 1-4 C/s vs lesson "≥2 °C/s"; axis 0-360 s; priority remake |
| m06l02 | ok | без замечаний | — | ✓ | no numbers; date "2025-05-21" filler; alt ✓ |
| m06l03 | ok | без замечаний | — | ✓ | no numbers; alt ✓ |
| m06l04 | cropped | обрезан текст по краю | P3 | ✓ | title "OARD THERMAL MASS", "MPACT" cut; no numbers; alt ✓ |
| m06l05 | cropped | обрезан текст по краю | P3 | ✓ | title "LLOY SYSTEMS" cut; numbers 219/217/183 ✓; alt ✓ |
| m06l06 | cropped | обрезан текст по краю | P3 | ✓ | title "EFLOW DEFECT ATLAS", caption "ood wetting and filet" cut; typo "filet"; defects match lesson; alt ✓ |
| m06l07 | cropped | обрезан текст по краю | P3 | ✓ | title "EFLOW PROFILE…", left "EGEND" cut; micro-text unreadable; no numbers; alt ✓ |
| m07l01 | ok | без замечаний | — | ✓ | no text issues; alt ✓ |
| m07l02 | ok | без замечаний | — | ✓ | no numbers; alt ✓ |
| m07l03 | ok | без замечаний | — | ✓ | bars unlabelled (no numbers, lesson has 90 %/66.7 %); date filler; alt ✓ |
| m07l04 | cropped | обрезан текст по краю | P3 | ✓ | right legend "BALL / PLATIN", "BOARD / PACKAG" cut; no numbers; alt ✓ |
| m07l05 | ERROR | содержательная ошибка | P1 | ✓ | "real joint under evaluation" photo is a WELD bead on steel, not a solder joint — wrong domain; alt check |
| m07l06 | ok | без замечаний | — | ✓ | classes A/B/C "symbolic" (IPC uses Class 1/2/3 — misleading next to IPC-A-610 citation); alt ✓ |
| m08l01 | numbers-not-in-text | числа, которых нет в уроке | P2 | ✓ | 75 % fill ✓; "external annular ring ≥0.05 mm, Class 3" is not in the lesson (lesson 0.05 mm is radial lead clearance) — a reader will conflate the two; alt ✓ |
| m08l02 | ok | без замечаний | — | ✓ | C=(DH−DL)/2 ✓ matches lesson; alt ✓ |
| m08l03 | ok | без замечаний | — | ✓ | no numbers; alt ✓ |
| m08l04 | ok | без замечаний | — | ✓ | typo "EBFORE"; right legend cut; alt ✓ |
| m08l05 | cropped | обрезан текст по краю | P3 | ✓ | all worked-example numbers ✓ (0.90/0.50/1.60 → Cr 0.20, Cd 0.40, 0.30/0.45, Vc 0.70, 0.63, Ac 0.44, 0.45, 0.40); left column cut ("LATED", "ALCULATION", "ORKED", "ILL OF MATERIALS"); dense micro-text |
| m09l01 | ERROR | содержательная ошибка | P1 | ✓ | dual wave labelled "FIRST WAVE LAMINAR / SECOND WAVE TURBULENT" — reversed (first = turbulent chip wave, second = laminar); "lambda/micro-wave" descriptions invented; alt check |
| m09l02 | cropped | обрезан текст по краю | P3 | ✓ | title "WAVE SOLDERING", "APPLY" cut left; no numbers; alt ✓ |
| m09l03 | cropped | обрезан текст по краю | P3 | ✓ | left "ROSS-SECTION", "REHEAT TEMPERATURE PROFILE" cut; no numbers (lesson has preheat ranges); alt ✓ |
| m09l04 | SEVERE-CROP | сильная обрезка ключевого текста | P1 | ✓ | left title "NG: CONTACT TIME & FOG HEIGHT", right panel formula "t = L /" cut at "/", legend cut — the key formula is unreadable; priority remake (formula image) |
| m09l05 | ok | без замечаний | — | ✓ | shadow model shown qualitatively; alt ✓ |
| m09l06 | SEVERE-CROP | сильная обрезка ключевого текста | P1 | ✓ | title "LDERING DEFECT ATLAS", first and last defect tiles cut ("NT", "BLO…"), notes cut; priority remake |
| m09l07 | cropped | обрезан текст по краю | P3 | ✓ | left "SOLDER POT", "LEGEND" tight; "CARBIDES / NITRIDES" as bath contaminants is nonsense (should be Cu, Fe, Pb, Au dissolution); alt ✓ |
| m10l01 | ok | без замечаний | — | ✓ | no numbers; alt ✓ |
| m10l02 | ok | без замечаний | — | ✓ | nozzle types qualitative; alt ✓ |
| m10l03 | cropped | обрезан текст по краю | P3 | ✓ | left "A] THERMAL FIELD", "TOP SIDE", "EMP" cut; no numbers; alt ✓ |
| m10l04 | ok | без замечаний | — | ✓ | date filler 2024-05-24; sequence numbering has two "9"; alt ✓ |
| m10l05 | cropped | обрезан текст по краю | P3 | ✓ | left "JOINT CROSS-SECTION", "COMMON", "LEGEND" cut; typo "SOLERR"; alt ✓ |
| m11l01 | ok | без замечаний | — | ✓ | left "TIP SELECTION" slightly cut; no temperatures (lesson 330–360 °C) — fine; alt ✓ |
| m11l02 | ok | без замечаний | — | ✓ | typo "DOLL SURFACE" (dull); alt ✓ |
| m11l03 | cropped | обрезан текст по краю | P3 | ✓ | left "HOT-AIR REWORK", "LEGEND", "NOZZLE" cut; no numbers; alt ✓ |
| m11l04 | ok | без замечаний | — | ✓ | left labels slightly cut ("REPAIRED", "ANNULAR"); class table empty (symbolic ◇○△□ — not IPC 1/2/3); alt ✓ |
| m11l05 | ok | без замечаний | — | ✓ | no numbers; alt ✓ |
| m11l06 | ok | без замечаний | — | ✓ | no numbers; alt ✓ |
| m12l01 | ok | без замечаний | — | ✓ | no numbers; CAF between two plated holes ✓; alt ✓ |
| m12l02 | cropped | обрезан текст по краю | P3 | ✓ | right notes column cut ("COMPATIBILIT", "COMMITTING", "CLEANLINESS"), left "FLOW DIRECTION" cut; alt ✓ |
| m12l03 | cropped | обрезан текст по краю | P3 | ✓ | left title "LEANLINESS", right notes cut; refs J-STD-001/IPC-TM-650 ✓; no ROSE limit shown; alt ✓ |
| m12l04 | wrong-label | неверная подпись/код | P2 | ✓ | IPC-CC-830 type codes wrong: polyurethane "(ER)" should be UR, parylene "(DR)" should be XY (ER = epoxy); lesson uses no codes, so image invents wrong ones; alt ✓ |
| m12l05 | cropped | обрезан текст по краю | P3 | ✓ | left "COATING LINE", "LEGEND"; right "REPAIRABILITY" cut; alt ✓ |
| m12l06 | cropped | обрезан текст по краю | P3 | ✓ | left "CONFORMAL COATING / DEFECT ATLAS", first tile "SOUND COATING" cut; alt ✓ |
| m13l01 | ok | без замечаний | — | ✓ | cost/coverage match lesson table (ICT low, FCT medium, burn-in high); flying probe row "LOW / circuit-dependent" added by artist — lesson table has no flying-probe row (minor); alt ✓ |
| m13l02 | ok | без замечаний | — | ✓ | left title cut "IN-CIRCUIT"; no numbers; alt ✓ |
| m13l03 | ok | без замечаний | — | ✓ | left "SYSTEM SCHEMATIC" cut; values intentionally omitted; alt ✓ |
| m13l04 | ok | без замечаний | — | ✓ | IEEE 1149.x ✓; photo labelled "BGA package" but shows a QFP (leaded) — wrong label; alt ✓ |
| m13l05 | ok | без замечаний | — | ✓ | no numbers; alt ✓ |
| m13l06 | ok | без замечаний | — | ✓ | refs IPC/WHMA-A-620 odd for test strategy (minor); alt ✓ |
| m14l01 | ok | без замечаний | — | ✓ | left "PARETO", "LEGEND" tight; no numbers; alt ✓ |
| m14l02 | cropped | обрезан текст по краю | P3 | ✓ | left title "AUSE ANALYSIS / TOOLS REFERENCE" cut; alt ✓ |
| m14l03 | cropped | обрезан текст по краю | P3 | ✓ | left "CONTAINMENT", "PROTECT", "LEGEND" cut; alt ✓ |
| m14l04 | ERROR | содержательная ошибка | P1 | ✓ | 8D steps mislabelled vs lesson: image D1 "emergency response", D3 "problem description", D4 "root cause", D5 "corrective action"; lesson: D3 containment, D4 root cause, D7 prevention, D8 closure — D2/D3 shifted; priority remake; alt generic ✓ |
| m14l05 | ERROR | содержательная ошибка | P1 | ✓ | "REWORKED JOINT" photo is a pipe WELD, not electronics — wrong domain; left "NONCONFORMITY" cut; alt check |
| m14l06 | ok | без замечаний | — | ✓ | left "PFMEA", "PROCESS STEP" cut; alt ✓ |
| m14l07 | cropped | обрезан текст по краю | P3 | ✓ | title "IGHT-DISCIPLINE WORKSHOP", "BSERVED DEFECT" cut; 8D names here standard ✓ (inconsistent with m14l04); defect photo = metal plate dent, not PCB — minor; alt check |
| m15l01 | ok | без замечаний | — | ✓ | no numbers; alt ✓ |
| m15l02 | ERROR | содержательная ошибка | P1 | ✓ | "ACTUAL DEFECT (MACRO PHOTOGRAPH)" is a hole in a steel plate — not electronics; tofu boxes "□□□□" everywhere (placeholder glyphs); priority remake / replace |
| m15l03 | ok | без замечаний | — | ✓ | typos "captuers", "betweee"; alt ✓ |
| m15l04 | ok | без замечаний | — | ✓ | no numbers; alt ✓ |
| m15l05 | ok | без замечаний | — | ✓ | left title "AGREEMENT" slightly cut; alt ✓ |

## Рекомендуемый способ переделки

Генеративные картинки с точными числами ненадёжны (именно так появились 30–60 с, 265 °C и «IPC-9191»). Поэтому:

- **P1/P2 с числами и схемами** (m06l01, m03l01, m03l02, m09l01, m09l04, m14l04, m08l01, m12l04) — заменить растровый блок на inline-`figure` (SVG), где все числа берутся из текста урока и проверяются `check-integrity`; растр можно оставить как декоративный второй блок без чисел или удалить.
- **Фото «не из электроники»** (m07l05 сварной шов, m14l05 сварная труба, m15l02 дырка в стали) и m09l06 (атлас) — перегенерация изображения с кадрированием внутри безопасных полей.
- **m03l06 «IPC-9191»** — перегенерация или SVG; число/стандарт в растре не должно появляться.
- **P3** — массовая перегенерация с отступом ≥5 % от края, в один проход, без ручной работы.
