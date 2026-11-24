"""Convert generated PNGs in /tmp/gen into 1024x717 WebP rasters in assets/img.
Usage: .venv/bin/python scripts/phase6-convert.py m07l05 m14l05 ..."""
import sys, os
from PIL import Image
SRC = '/tmp/gen'; DST = os.path.join(os.path.dirname(__file__), '..', 'assets', 'img')
for lid in sys.argv[1:]:
    im = Image.open(os.path.join(SRC, lid + '.png')).convert('RGB')
    w, h = im.size; target = 1024 / 717
    # letterbox with the image's own corner colour, never crop content
    bg = im.getpixel((3, 3))
    if abs(w / h - target) > 0.03:
        if w / h > target: nw, nh = w, int(w / target)
        else: nw, nh = int(h * target), h
        canvas = Image.new('RGB', (nw, nh), bg); canvas.paste(im, ((nw - w) // 2, (nh - h) // 2)); im = canvas
    im = im.resize((1024, 717), Image.LANCZOS)
    im.save(os.path.join(DST, lid + '.webp'), 'WEBP', quality=82, method=6)
    print(lid, 'ok', w, h)
