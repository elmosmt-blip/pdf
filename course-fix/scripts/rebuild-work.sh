#!/usr/bin/env bash
# Rebuild the gitignored scratch tree course-fix/work/ after a sandbox reset.
#
# The remote branch always holds every commit, so nothing is ever lost — but
# course-fix/work/ is gitignored by design (it is a build tree, not a source),
# and it does not survive a reset. This rebuilds it in one command.
#
# What is tracked and therefore safe:
#   course-fix/data/*.json   the fixed course data (the canonical source)
#   course-fix/img/*.png     the 92 illustrations
#   course-fix/scripts/      the fix scripts, including this one
#   course-fix/course-fix-2026-10-31-r4.zip   the original author bundle,
#                            kept only as the rebuild seed for index.html,
#                            assets/app.js, assets/style.css and the
#                            author's own scripts/ (check-course, embed, gates)
#
# Usage:  bash course-fix/scripts/rebuild-work.sh
set -euo pipefail
cd "$(dirname "$0")/../.."          # -> repo root

WORK=course-fix/work
R4=course-fix/r4
ZIP=course-fix/course-fix-2026-10-31-r4.zip

echo "rebuild-work: rebuilding $WORK"

# 1. seed from the tracked r4 bundle
rm -rf "$WORK" "$R4"
mkdir -p "$R4"
unzip -q "$ZIP" -d "$R4"
cp -r "$R4" "$WORK"

# 2. overlay the fixed data — the tracked copy is canonical
cp course-fix/data/*.json "$WORK/data/"

# 3. re-apply the data fixes that r4 predates, in dependency order.
#    Every one of these is idempotent, so this is safe to re-run.
node course-fix/scripts/apply-sampling-fix.js      "$WORK/data"
node course-fix/scripts/apply-course-images.js     "$WORK/data"
node course-fix/scripts/apply-sources-fix.js       "$WORK/data"
node course-fix/scripts/apply-standards-verification.js "$WORK/data"
node course-fix/scripts/apply-bake-table-fix.js    "$WORK/data"
node course-fix/scripts/apply-repair-limits-fix.js "$WORK/data"

# 4. r4 predates the round-6 index.html fix, and the rebuild resurrects the
#    Cloudflare Rocket Loader artefact every single time. Mandatory.
node course-fix/scripts/apply-index-fix.js "$WORK"

# 5. regenerate the derived artefacts
node "$WORK/scripts/embed.js" "$WORK/data" "$WORK/assets/data-embed.js"
node "$WORK/scripts/check-course.js" "$WORK/data"
node "$WORK/scripts/gates.js" >/dev/null
node course-fix/scripts/verify-runtime.js "$WORK" | tail -1

# 6. confirm the fixes actually landed
fail=0
check () { # <label> <expected> <pattern>
  # grep exits 1 on zero matches; with `set -o pipefail` that would abort the
  # whole rebuild, and a zero count is exactly what several checks expect.
  local got
  got=$( { grep -o "$3" "$WORK/data/lessons.json" || true; } | wc -l )
  if [ "$got" != "$2" ]; then echo "  !! $1: expected $2, found $got"; fail=1
  else echo "  ok $1 ($got)"; fi
}
check "IPC-CC-830 UR"        1 "Polyurethane (UR)"
check "IPC-CC-830 XY"        1 "Parylene (XY)"
check "IPC-CC-830 ER gone"   0 "Polyurethane (ER)"
check "IPC-CC-830 DR gone"   0 "Parylene (DR)"
check "bake AND-indexed"     1 "indexed to package body thickness AND"
check "bake thickness-only"  0 "indexed to package body thickness, not to"
check "bake 11 days gone"    0 "11 days for 1.4 to 2.0 mm"
check "bake 38 days gone"    0 "38 days for 2.0 to 4.5 mm"
check "nonsense phrase"      0 "IPC-7525C does not exist"
check "repair 0.25mm gone"   0 "commonly cited IPC-7711/7721 laminate damage depth limit of 0.25 mm"
check "repair A600 attrib"    6 "IPC-A-600 §"
check "quiz A610 wrong"      0 "IPC-A-610 Class 3 minimum of 0.05 mm"

[ "$fail" = 0 ] && echo "rebuild-work: OK" || { echo "rebuild-work: FAILED"; exit 1; }
