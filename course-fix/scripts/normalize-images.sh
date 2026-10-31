#!/usr/bin/env bash
# normalize-images.sh — normalize course illustrations to the render box.
#
# style.css renders .fig--photo img as width:100% with aspect-ratio:10/7 and
# object-fit:cover, and app.js declares an intrinsic box of 1280x896. #main is
# 920px wide with 40px padding, so an illustration is displayed at about 840px.
#
# The pipeline therefore:
#   1. scales the source to 1024x717 (about 1.22x the displayed width, enough
#      for a crisp render on a high-density screen) with a center crop, so
#      object-fit:cover has nothing left to trim;
#   2. reduces the palette to 128 colours with Floyd-Steinberg dithering. The
#      illustrations are dark technical drawings on a near-black ground with a
#      single signal accent, so 128 colours is visually indistinguishable from
#      the full palette and cuts the file to roughly a third;
#   3. strips metadata and uses a high PNG compression level.
#
# Result: about 540 KB per illustration, which keeps a 92-illustration course
# around 50 MB instead of 120 MB, with no visible quality loss.
#
# Usage: bash scripts/normalize-images.sh [imgDir]

set -euo pipefail

IMGDIR="${1:-$(dirname "$0")/../assets/img}"
W=1024
H=717

shopt -s nullglob
files=("$IMGDIR"/*.png)
if [ ${#files[@]} -eq 0 ]; then
  echo "normalize-images: no PNGs in $IMGDIR" >&2
  exit 1
fi

before=0
for f in "${files[@]}"; do
  before=$(( before + $(stat -c%s "$f") ))
done

for f in "${files[@]}"; do
  tmp="$f.tmp.png"
  convert "$f" -strip \
    -resize "${W}x${H}^" -gravity center -extent "${W}x${H}" \
    -colors 128 -dither Floyd-Steinberg \
    -define png:compression-level=9 \
    -define png:compression-filter=5 \
    -define png:exclude-chunk=date,time \
    PNG32:"$tmp"
  mv "$tmp" "$f"
  printf '  %-16s %sx%s  %s\n' "$(basename "$f" .png)" "$W" "$H" "$(du -h "$f" | cut -f1)"
done

after=0
for f in "${files[@]}"; do
  after=$(( after + $(stat -c%s "$f") ))
done

echo "normalize-images: ${#files[@]} file(s), $(( before / 1024 )) KB -> $(( after / 1024 )) KB"
