#!/usr/bin/env python3
"""office_normalise.py — make OOXML files reproducible.

## Why this exists

The Phase 4 templates were checked for the wrong thing. `check-templates.py`
verified that every formula recomputed to the course's number, but it never asked
whether the *file* was reproducible. Rebuilding the same spec twice produced
different bytes, because:

  * openpyxl and python-docx stamp `dcterms:created` / `dcterms:modified` with the
    current time in `docProps/core.xml`;
  * the ZIP container stores the build clock in every entry's local header.

That matters beyond tidiness. A build that is not reproducible cannot be
diffed, so a reviewer cannot see what a change to a template actually changed;
and a file whose metadata says "created 21:29" while its name says "v1
2026-10-31" is lying about its own age.

## What this does

Rewrites an .xlsx/.docx in place so that:

  * `dcterms:created` and `dcterms:modified` are the release date;
  * every ZIP entry carries that same date;
  * entries are written in a fixed order with fixed compression.

The result is byte-identical across rebuilds, on any machine, at any time —
which is what `build-templates.py` can then guarantee and `check-templates.py`
can test.
"""

from __future__ import annotations

import os
import re
import zipfile

# The release date, matching the file names. Fixed on purpose: a template does
# not become newer because it was rebuilt.
STAMP = (2026, 10, 31, 0, 0, 0)
STAMP_ISO = "2026-10-31T00:00:00Z"


def _normalise_core(xml: bytes) -> bytes:
    text = xml.decode("utf-8")
    # Both the timestamp and the timezone form are pinned.
    text = re.sub(r"(<dcterms:created[^>]*>)[^<]*(</dcterms:created>)",
                  r"\g<1>" + STAMP_ISO + r"\g<2>", text)
    text = re.sub(r"(<dcterms:modified[^>]*>)[^<]*(</dcterms:modified>)",
                  r"\g<1>" + STAMP_ISO + r"\g<2>", text)
    # A lastModifiedBy of "openpyxl" is metadata about the tool, not the file.
    # It is left alone: it is honest.
    return text.encode("utf-8")


def normalise(path: str) -> bool:
    """Rewrite one OOXML file deterministically. Returns True if it changed."""
    with zipfile.ZipFile(path) as z:
        entries = [(i.filename, z.read(i.filename)) for i in z.infolist()]

    out = []
    for name, data in entries:
        if name == "docProps/core.xml":
            data = _normalise_core(data)
        out.append((name, data))

    # Fixed order: [Content_Types].xml first is conventional, the rest sorted by
    # name. A ZIP is a sequence, so the order is part of the bytes.
    head = [e for e in out if e[0] == "[Content_Types].xml"]
    rest = sorted([e for e in out if e[0] != "[Content_Types].xml"], key=lambda e: e[0])
    ordered = head + rest

    tmp = path + ".tmp"
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for name, data in ordered:
            info = zipfile.ZipInfo(name, date_time=STAMP)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o600 << 16
            z.writestr(info, data)

    same = os.path.getsize(tmp) == os.path.getsize(path)
    if same:
        with open(tmp, "rb") as a, open(path, "rb") as b:
            same = a.read() == b.read()
    os.replace(tmp, path)
    return not same


def main(argv):
    paths = argv or []
    if not paths:
        print("usage: office_normalise.py <file.xlsx|file.docx> ...")
        return 1
    changed = sum(1 for p in paths if normalise(p))
    print("normalised %d file(s), %d changed" % (len(paths), changed))
    return 0


if __name__ == "__main__":
    import sys
    raise SystemExit(main(sys.argv[1:]))
