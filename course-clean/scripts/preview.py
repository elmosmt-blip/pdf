#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""preview.py — static server for build/course-clean with caching turned off.

WHY THIS EXISTS
  A reader was shown a home page without the Toolkit cases block while the build
  on disk did contain it. The cause was browser caching: index.html was served
  with a validator, the ?v= stamp in index.html was a DATE that did not change
  between builds, and app.js therefore stayed cached. The build now stamps by
  content hash (scripts/build.js), and this server additionally sends
  Cache-Control: no-store for every response, so a reload always shows the code
  that is actually on disk.

  Port 8080 is deliberately chosen by the caller; the platform preview layer
  proxies it. Bind to 0.0.0.0 so the proxied host can reach it.

USAGE
  python3 scripts/preview.py [--port 8080] [--dir build/course-clean]
"""

from __future__ import annotations

import argparse
import functools
import http.server
import os
import socketserver
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    """Plain static handler that refuses to let anything be cached."""

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        # the ?v= hash is the real cache key, but a shared cache must not reuse
        self.send_header("Vary", "Accept-Encoding")
        super().end_headers()

    def log_message(self, fmt, *args):   # keep the preview log short
        if "/assets/img/" in (args[0] if args else ""):
            return
        super().log_message(fmt, *args)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Serve the built course with caching disabled.")
    ap.add_argument("--port", type=int, default=8080)
    ap.add_argument("--dir", default=os.path.join("build", "course-clean"))
    args = ap.parse_args(argv)

    directory = args.dir if os.path.isabs(args.dir) else os.path.join(ROOT, args.dir)
    if not os.path.isdir(directory):
        print("preview: no such directory " + directory + " — run node scripts/build.js first",
              file=sys.stderr)
        return 1

    handler = functools.partial(NoCacheHandler, directory=directory)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("0.0.0.0", args.port), handler) as httpd:
        print("preview: serving %s on 0.0.0.0:%d (no-store)" % (directory, args.port))
        print("preview: open the root, then pick a case from the home page")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
