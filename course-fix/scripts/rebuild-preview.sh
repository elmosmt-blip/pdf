#!/usr/bin/env bash
# rebuild-preview.sh — rebuild the local preview root from the tracked pieces.
#
# course-preview/ is gitignored, and a sandbox reset restores the repository
# from git and drops ignored files, which destroyed the preview root once.
# Everything the preview needs is tracked or derivable, so it can be rebuilt
# in one command:
#
#   course-fix/r4/            the round-4 bundle: index.html, app.js, style.css
#                             and the data with W12-W16 applied
#   course-fix/img/           the illustrations (tracked)
#   course-fix/work/data/     the live data with the illustrations wired in;
#                             rebuilt from r4/ by apply-course-images.js when
#                             it is missing
#   course-fix/scripts/       the patch, wiring, embed and validation scripts
#
# Usage: bash course-fix/scripts/rebuild-preview.sh [port]

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"
PREVIEW="$REPO/course-preview"
PORT="${1:-8080}"

echo "rebuild-preview: repo=$REPO port=$PORT"

# 1. Rebuild the scratch data tree if a reset emptied it.
if [ ! -f "$ROOT/work/data/lessons.json" ]; then
  echo "  scratch data tree missing — rebuilding from the round-4 bundle"
  mkdir -p "$ROOT/work/data" "$ROOT/work/assets" "$ROOT/work/scripts"
  cp "$ROOT/r4/data/lessons.json" "$ROOT/r4/data/questions.json" \
     "$ROOT/r4/data/sources.json" "$ROOT/work/data/"
  cp "$ROOT/r4/assets/app.js" "$ROOT/r4/assets/style.css" "$ROOT/work/assets/"
  for f in apply-review-fixes.js apply-verification-fixes.js \
           apply-audit-fixes.js apply-table-fixes.js check-course.js \
           embed.js gates.js; do
    cp "$ROOT/r4/scripts/$f" "$ROOT/work/scripts/"
  done
fi

# 2. Wire the illustrations into the data and regenerate the snapshot.
node "$ROOT/scripts/apply-course-images.js" "$ROOT/work/data"
node "$ROOT/work/scripts/embed.js" "$ROOT/work/data" "$ROOT/work/assets/data-embed.js"

# 3. Assemble the preview root.
mkdir -p "$PREVIEW/assets/img" "$PREVIEW/data"
cp "$ROOT/r4/index.html" "$PREVIEW/"
cp "$ROOT/work/assets/app.js" "$ROOT/work/assets/style.css" \
   "$ROOT/work/assets/data-embed.js" "$PREVIEW/assets/"
cp "$ROOT/img/"*.png "$PREVIEW/assets/img/"
cp "$ROOT/work/data/"*.json "$PREVIEW/data/"

echo "  $(ls "$PREVIEW/assets/img" | wc -l) illustration(s), $(du -sh "$PREVIEW/assets/img" | cut -f1)"

# 4. Validate what we just built.
node "$ROOT/work/scripts/check-course.js" "$ROOT/work/data"
node "$ROOT/work/scripts/gates.js" >/dev/null && echo "  gates: OK"

# 5. Serve it.
echo "rebuild-preview: serving $PREVIEW on 0.0.0.0:$PORT"
cd "$PREVIEW"
exec python3 -m http.server "$PORT" --bind 0.0.0.0
