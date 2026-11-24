#!/usr/bin/env python
"""Phase 6 — remove standards-body designations (IPC / J-STD / JEDEC / IEEE / ANSI …)
from lesson rasters.

Input : /tmp/std-hits.json  {id: [[x0,y0,x1,y1,text], …]}  (from rapidocr pass)
Output: assets/img/<id>.webp overwritten; crops of every edit to /tmp/destd/<id>-<n>.png

Each hit box is filled with the surrounding background colour and, where the
text carried meaning (footer REF line, inline labels), a neutral replacement
is drawn in the same colour / size with DejaVu Sans Mono.
"""
import json, re, sys, os
from PIL import Image, ImageDraw, ImageFont
import numpy as np

HITS = json.load(open('/tmp/std-hits.json'))

# manual overrides: id -> list of [x0,y0,x1,y1,text, forced_replacement_or_None, pad_y]
OVERRIDES = {
    'm03l02': [[878, 632, 1000, 676, 'IPC LOGO', '', 2],
               [96, 646, 752, 663, 'REFER TO IPC-7525', None, 3]],
    'm14l03': [[396, 694, 578, 706, 'REF: 8D METHOD / IPC-1782', None, 1]],
    'm02l01': [[804, 309, 841, 318, 'J-STD-033', None, 1],
               [73, 638, 448, 649, 'REFER TO IPC/JEDEC J-STD-020 FOR MOISTURE', None, 1],
               [494, 639, 906, 651, 'REFER TO IPC/JEDEC J-STD-033 FOR MOISTURE', None, 1]],
    'm12l04': [[114, 649, 817, 664, 'FOR DETAILED REQUIREMENTS … IPC-CC-830',
                'REFER TO THE CONFORMAL COATING GUIDELINE FOR REQUIREMENTS AND TEST METHODS', 1],
               [125, 667, 764, 680, 'IPC-CC-830 - GUIDELINES', '', 1]],
    'm13l06': [[2, 687, 298, 699, 'REF: IPC/WHMA-A-620 | IPC-TM-650 | IEEE 1149.1', 'REF: INTERNAL PROCESS SPECIFICATION', 1]],
    'm06l05': [[*h[:4], h[4], ('CLASSIFICATION:' if h[4] == 'J-STD-020:' else None), 3] for h in HITS['m06l05']],
}
for k, v in OVERRIDES.items():
    HITS[k] = v
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
FONT_B = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
OUT = '/tmp/destd'; os.makedirs(OUT, exist_ok=True)

GENERIC_REF = 'REF: INTERNAL PROCESS SPECIFICATION'

def replacement(txt):
    t = txt.upper().replace(' ', '')
    if t.startswith('REF:') or t.startswith('REFERENCE:'):
        return GENERIC_REF
    if 'WWW.' in t:
        return ''
    if 'CONFIRMWITHSPI' in t:
        return 'CONFIRM WITH SPI AND VISUAL INSPECTION'
    if t == 'IPC-A-610ACCEPTANCE':
        return 'CUSTOMER ACCEPTANCE LIMIT'
    if t == '(IPC-A-610)':
        return '(CLASS LIMIT)'
    if t == 'ACCEPTANCEPERIPC-A-610.':
        return 'ACCEPTANCE PER THE CLASS LIMIT.'
    if t in ('IPC-A-610',):
        return 'ACCEPTANCE STANDARD'
    if t in ('J-STD-033', 'J-STD-020', 'J-STD-020:', 'IPC', 'IPC-TM-658', 'IEEE1149.1'):
        return 'STANDARD'
    if 'AFTERABAKEPER' in t:
        return 'after a bake per the moisture standard.'
    if 'MOISTURE' in t or 'J-STD-O33' in t or 'J-STD-O2O' in t:
        return 'REFER TO THE APPLICABLE MOISTURE-SENSITIVITY STANDARD'
    if 'ESD' in t and 'ANSI' in t:
        return 'THIS PROGRAM IS ESTABLISHED IN ACCORDANCE WITH THE APPLICABLE ESD CONTROL STANDARD.'
    if 'STENCILDESIGN' in t or 'IPC-7525' in t:
        return 'REFER TO THE STENCIL DESIGN GUIDELINE AND THE PASTE DATASHEET'
    if 'CONFORMALCOATING' in t or 'IPC-CC-83' in t:
        return 'REFER TO THE CONFORMAL COATING GUIDELINE FOR REQUIREMENTS AND TEST METHODS'
    return ''

def text_and_bg(arr, box, pad=3, pad_y=None):
    x0, y0, x1, y1 = box
    h, w = arr.shape[:2]
    py = pad if pad_y is None else pad_y
    X0, Y0, X1, Y1 = max(0, x0 - pad), max(0, y0 - py), min(w, x1 + pad), min(h, y1 + py)
    ring = np.concatenate([arr[Y0:Y0 + 2, X0:X1].reshape(-1, 3), arr[Y1 - 2:Y1, X0:X1].reshape(-1, 3),
                           arr[Y0:Y1, X0:X0 + 2].reshape(-1, 3), arr[Y0:Y1, X1 - 2:X1].reshape(-1, 3)])
    bg = np.median(ring, axis=0)
    inner = arr[y0:y1, x0:x1].reshape(-1, 3).astype(float)
    dist = np.abs(inner - bg).sum(1)
    fg = inner[dist > np.percentile(dist, 90)].mean(0) if len(inner) else bg
    return tuple(int(v) for v in fg), tuple(int(v) for v in bg), (X0, Y0, X1, Y1)

def process(lid):
    hits = HITS.get(lid, [])
    if not hits:
        return 0
    path = f'assets/img/{lid}.webp'
    im = Image.open(path).convert('RGB')
    arr = np.array(im)
    d = ImageDraw.Draw(im)
    n = 0
    for i, hit in enumerate(hits):
        x0, y0, x1, y1, txt = hit[:5]
        forced = hit[5] if len(hit) > 5 else None
        pad_y = hit[6] if len(hit) > 6 else None
        fg, bg, (X0, Y0, X1, Y1) = text_and_bg(arr, (x0, y0, x1, y1), pad_y=pad_y)
        before = im.crop((max(0, X0 - 40), max(0, Y0 - 12), min(im.width, X1 + 40), min(im.height, Y1 + 12)))
        d.rectangle((X0, Y0, X1, Y1), fill=bg)
        rep = replacement(txt) if forced is None else forced
        if rep:
            bh = y1 - y0
            size = max(8, int(bh * 0.80))
            bold = sum(fg) > 600
            font = ImageFont.truetype(FONT_B if bold else FONT, size)
            while size > 7 and d.textlength(rep, font=font) > (x1 - x0) * 1.15:
                size -= 1
                font = ImageFont.truetype(FONT_B if bold else FONT, size)
            tw = d.textlength(rep, font=font)
            cx = (x0 + x1) / 2
            # footer lines are centred; inline sentences left-aligned
            tx = cx - tw / 2 if rep == GENERIC_REF else x0
            tx = max(X0, min(tx, X1 - tw))
            d.text((tx, (y0 + y1) / 2), rep, font=font, fill=fg, anchor='lm')
        after = im.crop((max(0, X0 - 40), max(0, Y0 - 12), min(im.width, X1 + 40), min(im.height, Y1 + 12)))
        sheet = Image.new('RGB', (before.width, before.height * 2 + 4), 'red')
        sheet.paste(before, (0, 0)); sheet.paste(after, (0, before.height + 4))
        sheet.save(f'{OUT}/{lid}-{i}.png')
        n += 1
    im.save(path, 'WEBP', quality=82, method=6)
    return n

ids = sys.argv[1:] or sorted(HITS)
total = 0
for lid in ids:
    k = process(lid)
    total += k
    if k:
        print(lid, k)
print('edits:', total)
