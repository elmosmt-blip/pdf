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

# This script is repo-relative and destructive (it rm -rf's the work tree), so
# refuse to run anywhere the expected layout is not present. A copy shipped
# inside a round bundle would otherwise cd to the bundle's parent and fail
# halfway through with a confusing message.
if [ ! -f "$ZIP" ] || [ ! -d course-fix/data ] || [ ! -d course-fix/img ]; then
  echo "rebuild-work: expected the repo layout at $(pwd) (course-fix/data, course-fix/img, $ZIP)" >&2
  echo "rebuild-work: run it from a checkout of the repository, not from an extracted bundle" >&2
  exit 2
fi

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
node course-fix/scripts/apply-ramp-rate-fix.js   "$WORK/data"
node course-fix/scripts/apply-profile-limits-fix.js "$WORK/data"

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
check "ramp 4C/s gone"       0 "maximum ramp rate of 4 °C/s"
check "ramp 4C/s bare"       0 "maximum ramp rate 4 °C/s"

# Some fixes land in questions.json, not lessons.json.
checkq () { # <label> <expected> <pattern>
  local got
  got=$( { grep -o "$3" "$WORK/data/questions.json" || true; } | wc -l )
  if [ "$got" != "$2" ]; then echo "  !! $1: expected $2, found $got"; fail=1
  else echo "  ok $1 ($got)"; fi
}
checkq "quiz ramp 4C/s gone"   0 "ramp rate of 4 °C/s"
checkq "quiz ramp 4C/s bare"   0 "ramp rate 4 °C/s"
checkq "quiz ramp 3C/s fixed"  1 "ramp rate of 3 °C/s"
checkq "quiz ramp 3C/s bare"   1 "ramp rate 3 °C/s"

# D9-D12: profile limits, J-STD-005 tails, SnPb Tc, degree symbols.
check "TAL denied to J020"   0 "window is process guidance rather than a J-STD-020 parameter"
check "TAL 60-150 IPC7530"   0 "typically call for 60-150 s for many assemblies"
check "TAL not-J020 explicit" 0 "This window is IPC-7530 and datasheet guidance, not a J-STD-020 parameter"
check "TAL not-J020 phr2"    0 "come from IPC-7530 and the paste datasheet, not from J-STD-020"
check "soak as TAL 60-120"   0 "typical guidance of 60-120 s: measured 75 s"
check "soak as TAL phr2"     0 "gives typical guidance of 60-120 s above liquidus"
check "SnPb Tc flat 220"     0 "classification temperature for SnPb eutectic is 220 C"
check "SnPb Tc 235"          1 "235 °C for a package thinner than 2.5 mm"
# Counted with node because the taught content and the TBD-REVIEW metadata must
# be checked separately: review[] deliberately quotes the original draft verbatim,
# so it still says "100 C" and must NOT be rewritten.
checknode () { # <label> <expected> <node-expr over lessons.json>
  local got
  got=$( node -e "$3" )
  if [ "$got" != "$2" ]; then echo "  !! $1: expected $2, found $got"; fail=1
  else echo "  ok $1 ($got)"; fi
}
checknode "TAL is J020 tL"       4 'var L=require(process.cwd()+"/course-fix/work/data/lessons.json");var n=0;L.forEach(function(l){var s=JSON.stringify(l.content||{});["60-150 s time-above-liquidus window is J-STD-020 tL","classification window of 60-150 s","the J-STD-020 classification window."].forEach(function(k){n+=(s.split(k).length-1)})});console.log(n)'
checknode "IPC7530 TAL 30-90"    7 'var L=require(process.cwd()+"/course-fix/work/data/lessons.json");var n=0;L.forEach(function(l){n+=(JSON.stringify(l.content||{}).split("30-90 s").length-1)});console.log(n)'
checknode "bare N C in content"  0 'var L=require(process.cwd()+"/course-fix/work/data/lessons.json");var n=0;L.forEach(function(l){var s=JSON.stringify(l.content||{});var re=/(\\d+(?:\\.\\d+)?) C(?![a-zA-Z°])(?=\\s*[^\\s0-9,.\\-]|$)/g,m;while((m=re.exec(s)))n++});console.log(n)'

[ "$fail" = 0 ] && echo "rebuild-work: OK" || { echo "rebuild-work: FAILED"; exit 1; }
