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

# 2. overlay the fixed data — the tracked copy is canonical. Only the three
#    running files: course-fix/data/ also carries a stale *.fixed.json trio
#    left over from the round-4 upload set, and a glob would copy those back
#    in and put a second, contradictory copy of the data into the work tree.
cp course-fix/data/lessons.json course-fix/data/questions.json \
   course-fix/data/sources.json "$WORK/data/"

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
node course-fix/scripts/apply-bake-quiz-fix.js    "$WORK/data"
node course-fix/scripts/apply-source-refs.js        "$WORK/data"
node course-fix/scripts/apply-source-provenance.js  "$WORK/data"
node course-fix/scripts/apply-source-editions.js    "$WORK/data"
node course-fix/scripts/apply-marker-removal.js     "$WORK/data"

# 3b. m07l06 stores 7 of its 8 theory sections as bare strings, which
#     theoryHtml() silently drops — 4,318 characters of the drill itself.
#     Fixes both the data and the renderer.
node course-fix/scripts/apply-theory-string-fix.js  "$WORK"

# 3c. three defects found by the per-lesson review: two quizzes that attribute
#     an area formula to lessons teaching a height formula (D16), a worked
#     solution whose interpretation contradicts its own arithmetic (D17), and
#     a drill that subtracts rounded intermediates (D18).
node course-fix/scripts/apply-round18-fixes.js    "$WORK"

# 4. r4 predates the round-6 index.html fix, and the rebuild resurrects the
#    Cloudflare Rocket Loader artefact every single time. Mandatory.
node course-fix/scripts/apply-index-fix.js "$WORK"

# 4b. r4 also ships the three shell-level draft markers that apply-marker-
#     removal.js cannot reach, because they live in app.js and index.html
#     rather than in the data. Mandatory.
node course-fix/scripts/apply-review-banner-fix.js "$WORK"

# 4b-2. the per-lesson Sources list goes behind a spoiler, reusing the
#        "Show worked solution" pattern the course already has. Touches both
#        app.js and style.css, both of which are re-seeded from r4.
node course-fix/scripts/apply-sources-spoiler.js "$WORK"

# 4b-3. the sidebar's "Data: …" badge comes off. It was a build diagnostic
#        wearing user-facing copy — the "Re-run node scripts/embed.js after
#        editing data" clause is an instruction to whoever maintains the
#        bundle, not to whoever is studying. The branch loadCourse took is
#        still recorded, invisibly, so verify-runtime.js keeps its proof.
node course-fix/scripts/apply-remove-data-note.js "$WORK"

# 4c. Two things the r4 seed carries that are now wrong rather than merely old:
#     the *.fixed.json trio (a round-4 migration artefact, referenced by
#     nothing, and stale — sources.fixed.json still lists 17 sources against
#     the current 39) and README.txt, which still asserts that every lesson
#     keeps its TBD-REVIEW marker. Both are replaced here so a rebuild cannot
#     ship them, and so the bundle cannot carry a second, contradictory copy of
#     the data.
rm -f "$WORK"/data/*.fixed.json
cp course-fix/README.txt "$WORK/README.txt"

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
checknode () { # <label> <expected> <node-expr over lessons.json>
  local got
  got=$( node -e "$3" )
  if [ "$got" != "$2" ]; then echo "  !! $1: expected $2, found $got"; fail=1
  else echo "  ok $1 ($got)"; fi
}

checkq "quiz ramp 4C/s gone"   0 "ramp rate of 4 °C/s"
checkq "quiz ramp 4C/s bare"   0 "ramp rate 4 °C/s"
checkq "quiz ramp 3C/s fixed"  1 "ramp rate of 3 °C/s"
checkq "quiz ramp 3C/s bare"   1 "ramp rate 3 °C/s"

# D13: the two bake quizzes still quoted the garbled secondary table.
check "bake quiz 192h gone"    0 "90 °C column gives 192 h"
check "bake quiz 9-38d gone"   0 "about 9-38 days"
check "bake quiz 8h wrong"     0 "125°C for 8 h up to 1.4 mm, 18 h for 1.4-2.0 mm"
check "bake quiz 40C range"    1 "8 to 22 days for a body up to 1.4 mm and 25 to 79 days"
checkq "bake quiz 192h q"      0 "90 °C column gives 192 h"
checkq "bake quiz 9-38d q"     0 "about 9-38 days"
checkq "bake quiz 240h q"      1 "10 days, which is 240 h"
checkq "bake quiz 7h q"        1 "125 °C gives 7 h up to 1.4 mm, 17 h for 1.4-2.0 mm"

# Round 14: source refs, source provenance, and marker removal.
checknode "lessons with no src"    0 'var L=require(process.cwd()+"/course-fix/work/data/lessons.json");console.log(L.filter(function(l){return !(l.sources||[]).length}).length)'
checknode "questions with no src"  0 'var Q=require(process.cwd()+"/course-fix/work/data/questions.json");console.log(Q.filter(function(q){return !q.source}).length)'
checknode "status still draft"     0 'var L=require(process.cwd()+"/course-fix/work/data/lessons.json");console.log(L.filter(function(l){return l.status!=="reviewed"}).length)'
checknode "TBD-REVIEW anywhere"    0 'var d=process.cwd()+"/course-fix/work/data/";var t=["lessons","questions","sources"].map(function(f){return require("fs").readFileSync(d+f+".json","utf8")}).join("");console.log(t.split("TBD-REVIEW").length-1)'
checknode "reviewed lessons"       92 'var L=require(process.cwd()+"/course-fix/work/data/lessons.json");console.log(L.filter(function(l){return l.status==="reviewed"}).length)'
checknode "edition markers left"   0 'var S=require(process.cwd()+"/course-fix/work/data/sources.json");console.log(S.filter(function(s){return String(s.edition).indexOf("TBD-REVIEW")>=0}).length)'
checknode "S4.1 superseded ref"    0 'var L=require(process.cwd()+"/course-fix/work/data/lessons.json");var n=0;L.forEach(function(l){var s=JSON.stringify(l.content||{});n+=s.split("ANSI/ESD S4.1").length-1});console.log(n)'
# The shell-level markers live in app.js / index.html, not the data, so they
# need their own greps. "Content not yet reviewed" and the footer draft line
# are what a reader actually saw; the TBD-REVIEW greps catch the fallbacks.
checknode "no draft banner"       0 'var fs=require("fs");var t=fs.readFileSync(process.cwd()+"/course-fix/work/assets/app.js","utf8")+fs.readFileSync(process.cwd()+"/course-fix/work/index.html","utf8");console.log(t.split("Content not yet reviewed").length-1)'
checknode "no draft footer"       0 'var fs=require("fs");var t=fs.readFileSync(process.cwd()+"/course-fix/work/index.html","utf8");console.log(t.split("unreviewed draft content").length-1)'
checknode "no draft meta desc"    0 'var fs=require("fs");var t=fs.readFileSync(process.cwd()+"/course-fix/work/index.html","utf8");console.log(t.split("Draft content, unreviewed").length-1)'
checknode "no shell TBD-REVIEW"   0 'var fs=require("fs");var t=fs.readFileSync(process.cwd()+"/course-fix/work/assets/app.js","utf8");console.log(t.split("TBD-REVIEW").length-1)'
checknode "no draft stat label"   0 'var fs=require("fs");var t=fs.readFileSync(process.cwd()+"/course-fix/work/assets/app.js","utf8");console.log(t.split("draft content, human review pending").length-1)'
checknode "verifiedBy fallback"   0 'var fs=require("fs");var t=fs.readFileSync(process.cwd()+"/course-fix/work/assets/app.js","utf8");console.log(t.split("verified by TBD-REVIEW").length-1)'
# D19/round-20: no stale duplicate data and no stale README may ship.
checknode "fixed.json gone"       0 'var fs=require("fs");var d=process.cwd()+"/course-fix/work/data/";console.log(fs.readdirSync(d).filter(function(f){return /\.fixed\.json$/.test(f)}).length)'
# Round 21: the review banner is off the course, and nothing in the shell or
# the README may name a language model or say how the course was made.
checknode "no review banner"      0 'var fs=require("fs");var t=fs.readFileSync(process.cwd()+"/course-fix/work/assets/app.js","utf8");console.log(t.split("banner-title\">Reviewed against").length-1)'
checknode "no audit pointer"      0 'var fs=require("fs");var t=fs.readFileSync(process.cwd()+"/course-fix/work/assets/app.js","utf8");console.log(t.split("REVIEW_CHECKLIST.md").length-1)'
checknode "no LLM in app.js"      0 'var fs=require("fs");var t=fs.readFileSync(process.cwd()+"/course-fix/work/assets/app.js","utf8");var re=/\bLLM\b|language model|ChatGPT|GPT-[0-9]|Claude|Gemini|Qwen|Kimi|Grok|OpenAI|Anthropic/i;console.log(t.split(re).length-1)'
checknode "no LLM in index.html"  0 'var fs=require("fs");var t=fs.readFileSync(process.cwd()+"/course-fix/work/index.html","utf8");var re=/\bLLM\b|language model|ChatGPT|GPT-[0-9]|Claude|Gemini|Qwen|Kimi|Grok|OpenAI|Anthropic/i;console.log(t.split(re).length-1)'
checknode "no LLM in README"      0 'var fs=require("fs");var t=fs.readFileSync(process.cwd()+"/course-fix/work/README.txt","utf8");var re=/\bLLM\b|language model|ChatGPT|GPT-[0-9]|Claude|Gemini|Qwen|Kimi|Grok|OpenAI|Anthropic/i;console.log(t.split(re).length-1)'
# Round 22: the Sources list is collapsed by default.
checknode "sources behind spoiler" 1 'var fs=require("fs");var t=fs.readFileSync(process.cwd()+"/course-fix/work/assets/app.js","utf8");console.log(t.split("<details class=\"spoiler\">").length-1)'
checknode "no plain Sources h2"    0 'var fs=require("fs");var t=fs.readFileSync(process.cwd()+"/course-fix/work/assets/app.js","utf8");console.log(t.split("<h2>Sources</h2>").length-1)'
checknode "spoiler CSS present"    1 'var fs=require("fs");var t=fs.readFileSync(process.cwd()+"/course-fix/work/assets/style.css","utf8");console.log(t.indexOf(".sources details")>=0?1:0)'
# Round 23: the sidebar data badge is gone, and the branch it reported is still
# recorded invisibly so verify-runtime.js keeps its regression proof.
checknode "no data badge in html"  0 'var fs=require("fs");var t=fs.readFileSync(process.cwd()+"/course-fix/work/index.html","utf8");console.log(t.split("data-source").length-1)'
checknode "no data note text"      0 'var fs=require("fs");var t=fs.readFileSync(process.cwd()+"/course-fix/work/assets/app.js","utf8");console.log(t.split("Data: data/lessons.json").length-1+t.split("Data: assets/data-embed.js").length-1+t.split("Data: unavailable").length-1)'
checknode "branch still recorded"  1 'var fs=require("fs");var t=fs.readFileSync(process.cwd()+"/course-fix/work/assets/app.js","utf8");console.log(t.indexOf("dataset.courseData")>=0?1:0)'
checknode "README not stale"      0 'var fs=require("fs");var t=fs.readFileSync(process.cwd()+"/course-fix/work/README.txt","utf8");console.log(t.split("keeps status").length-1)'
checknode "README sources 39"     1 'var fs=require("fs");var t=fs.readFileSync(process.cwd()+"/course-fix/work/README.txt","utf8");console.log(t.split("39 named standards").length-1)'
# m07l06's theory shape. The data must be uniform objects, and the renderer
# must handle a bare string rather than dropping it.
checknode "m07l06 sections"       8 'var L=require(process.cwd()+"/course-fix/work/data/lessons.json");var l=L.filter(function(x){return x.lessonId==="m07l06"})[0];console.log(l.content.theory.length)'
checknode "string theory left"    0 'var L=require(process.cwd()+"/course-fix/work/data/lessons.json");var n=0;L.forEach(function(l){(l.content.theory||[]).forEach(function(s){if(typeof s==="string")n++})});console.log(n)'
checknode "theory renderer safe"  1 'var t=require("fs").readFileSync(process.cwd()+"/course-fix/work/assets/app.js","utf8");var q=String.fromCharCode(39);console.log(t.indexOf("typeof t === "+q+"string"+q)>=0?1:0)'
# D16/D17/D18 guards. The area formula must not come back, the margin must
# stay at the liquidus value, and the drill must not subtract rounded numbers.
checknode "no area-fill quiz"      0 'var Q=require(process.cwd()+"/course-fix/work/data/questions.json");var n=0;Q.forEach(function(q){var t=q.prompt+" "+q.explanation;if(/1 − \(lead diameter \/ hole diameter\)²/.test(t))n++});console.log(n)'
checknode "m06l03 margin 19"       1 'var L=require(process.cwd()+"/course-fix/work/data/lessons.json");var l=L.filter(function(x){return x.lessonId==="m06l03"})[0];console.log((l.content.calc.solution.split("above liquidus by 19 °C").length-1))'
checknode "no rounded subtraction" 0 'var L=require(process.cwd()+"/course-fix/work/data/lessons.json");var n=0;L.forEach(function(l){var s=(l.content.calc&&l.content.calc.solution)||"";if(/1\.02 - 0\.31 = 0\.70/.test(s))n++});console.log(n)'
checknode "STM4.1 in place"        1 'var L=require(process.cwd()+"/course-fix/work/data/lessons.json");var n=0;L.forEach(function(l){var s=JSON.stringify(l.content||{});n+=s.split("ANSI/ESD STM4.1").length-1});console.log(n)'

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
checknode "TAL is J020 tL"       4 'var L=require(process.cwd()+"/course-fix/work/data/lessons.json");var n=0;L.forEach(function(l){var s=JSON.stringify(l.content||{});["60-150 s time-above-liquidus window is J-STD-020 tL","classification window of 60-150 s","the J-STD-020 classification window."].forEach(function(k){n+=(s.split(k).length-1)})});console.log(n)'
checknode "IPC7530 TAL 30-90"    7 'var L=require(process.cwd()+"/course-fix/work/data/lessons.json");var n=0;L.forEach(function(l){n+=(JSON.stringify(l.content||{}).split("30-90 s").length-1)});console.log(n)'
checknode "bare N C in content"  0 'var L=require(process.cwd()+"/course-fix/work/data/lessons.json");var n=0;L.forEach(function(l){var s=JSON.stringify(l.content||{});var re=/(\\d+(?:\\.\\d+)?) C(?![a-zA-Z°])(?=\\s*[^\\s0-9,.\\-]|$)/g,m;while((m=re.exec(s)))n++});console.log(n)'

# 7. render every lesson through the real app.js and assert on what a reader
#    actually gets. The JSON checks above cannot see content the renderer never
#    reads, which is how m07l06 lost 4,318 characters (D15).
node course-fix/scripts/check-calc-arithmetic.js "$WORK/data" | tail -2
node course-fix/scripts/per-lesson-audit.js "$WORK" course-fix/img | tail -3

# 7b. the README ships inside the bundle and is the first file a reader opens,
#     so its byte counts and quoted figures must match what is actually there.
#     Round 20 found it still asserting the round-4 build.
node course-fix/scripts/check-readme.js "$WORK" course-fix/img | tail -6

[ "$fail" = 0 ] && echo "rebuild-work: OK" || { echo "rebuild-work: FAILED"; exit 1; }
