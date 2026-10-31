# course-fix — исправления данных курса (31.10.2026)

Зеркало файлов, залитых в проект на Google Drive (`course/`), чтобы правки были
видимы как diff в git. Описание каждой правки, источники чисел и команды
проверки — в [`../COURSE_FIXES.md`](../COURSE_FIXES.md).

| Файл | Оригинал в проекте |
|---|---|
| `scripts/apply-review-fixes.js` | `course/scripts/` (новый файл) |
| `scripts/gates.js` | `course/scripts/` (новый файл) |
| `data/lessons.fixed.json` | заменить `course/data/lessons.json` |
| `data/questions.fixed.json` | заменить `course/data/questions.json` |
| `data/sources.fixed.json` | заменить `course/data/sources.json` |
| `assets/data-embed.fixed.js` | заменить `course/assets/data-embed.js` |

Проверка прогонялась на копии проекта: `check-course.js` → OK, `gates.js` → OK,
`embed.js` → содержимое идентично `data/*.json`.
