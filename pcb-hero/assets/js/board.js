/* ============================================================
   OpenTrace — board generator
   Builds a procedural PCB: 45° traces, fanout, SMD parts,
   stitching vias, silkscreen. Then wires up the BGA + motion.
   ============================================================ */
(() => {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- deterministic RNG ---------- */
  const mulberry32 = (a) => () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rand = mulberry32(20261124);
  const rr = (min, max) => min + rand() * (max - min);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];

  /* ---------- tiny svg helper ---------- */
  const svgEl = (tag, attrs = {}) => {
    const node = document.createElementNS(SVG_NS, tag);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    return node;
  };

  const W = 1440;
  const H = 700;
  const CX = W / 2;
  const CY = H / 2;

  const art = document.getElementById("board-art");
  if (!art) return;

  const svg = svgEl("svg", {
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: "xMidYMid slice",
    role: "presentation",
  });

  const gPour = svgEl("g", { "aria-hidden": "true" });
  const gTraces = svgEl("g", { "aria-hidden": "true" });
  const gPads = svgEl("g", { "aria-hidden": "true" });
  const gParts = svgEl("g", { "aria-hidden": "true" });
  const gSilk = svgEl("g", { "aria-hidden": "true" });
  const gPulse = svgEl("g", { "aria-hidden": "true" });
  svg.append(gPour, gTraces, gPads, gParts, gSilk, gPulse);
  art.appendChild(svg);

  /* shared defs: soft part shadows + gradients for metal/epoxy */
  (() => {
    const defs = svgEl("defs");
    const f = svgEl("filter", { id: "partShadow", x: "-70%", y: "-70%", width: "260%", height: "260%" });
    f.appendChild(svgEl("feGaussianBlur", { stdDeviation: "1.1" }));
    defs.appendChild(f);

    // wide penumbra for the cast shadow of a lifted part
    const fs = svgEl("filter", { id: "partShadowSoft", x: "-90%", y: "-90%", width: "300%", height: "300%" });
    fs.appendChild(svgEl("feGaussianBlur", { stdDeviation: "3.4" }));
    defs.appendChild(fs);

    // glossy top-face shading: light from the top, falls into shadow at the bottom
    const gloss = svgEl("linearGradient", { id: "glossGrad", x1: "0", y1: "0", x2: "0", y2: "1" });
    [["0", "rgba(255,255,255,0.28)"], ["0.34", "rgba(255,255,255,0.06)"],
     ["0.62", "rgba(0,0,0,0.04)"], ["1", "rgba(0,0,0,0.38)"]].forEach(([o, c]) =>
      gloss.appendChild(svgEl("stop", { offset: o, "stop-color": c.startsWith("rgba(255") ? "#ffffff" : "#000000", "stop-opacity": c.match(/,([\d.]+)\)$/)[1] })));
    defs.appendChild(gloss);

    // micro grain for moulded plastic: extremely subtle, sold as texture
    const grain = svgEl("filter", { id: "grain", x: "0", y: "0", width: "100%", height: "100%" });
    grain.appendChild(svgEl("feTurbulence", { type: "fractalNoise", baseFrequency: "0.9", numOctaves: "2", result: "n" }));
    grain.appendChild(svgEl("feColorMatrix", { in: "n", type: "saturate", values: "0" }));
    const ct = svgEl("feComponentTransfer");
    ct.appendChild(svgEl("feFuncA", { type: "linear", slope: "0.42", intercept: "0" }));
    grain.appendChild(ct);
    defs.appendChild(grain);

    // specular blob from the ring light
    const spec = svgEl("radialGradient", { id: "specGrad" });
    spec.appendChild(svgEl("stop", { offset: "0", "stop-color": "#ffffff", "stop-opacity": "0.85" }));
    spec.appendChild(svgEl("stop", { offset: "0.45", "stop-color": "#ffffff", "stop-opacity": "0.28" }));
    spec.appendChild(svgEl("stop", { offset: "1", "stop-color": "#ffffff", "stop-opacity": "0" }));
    defs.appendChild(spec);

    const lin = (id, stops, v) => {
      const gd = svgEl("linearGradient", v
        ? { id, x1: "0", y1: "0", x2: "0", y2: "1" }
        : { id, x1: "0", y1: "0", x2: "1", y2: "0" });
      stops.forEach(([o, c]) => gd.appendChild(svgEl("stop", { offset: o, "stop-color": c })));
      defs.appendChild(gd);
    };
    // solder-plated termination: bright crest → dark heel
    lin("solderGrad", [["0", "#f2f5f7"], ["0.14", "#e6ecef"], ["0.4", "#cdd5da"], ["0.66", "#a7b1b8"], ["0.86", "#7d878f"], ["1", "#5a646c"]]);
    lin("metalGrad", [["0", "#f4f7f9"], ["0.18", "#dfe5e9"], ["0.5", "#b6c0c7"], ["0.78", "#8b959d"], ["1", "#4a545c"]]);
    // dark moulded epoxy body
    lin("bodyDarkGrad", [["0", "#2f3a44"], ["0.16", "#1e262d"], ["0.7", "#12181e"], ["1", "#0a0f13"]]);
    // matte moulded epoxy for large packages: almost flat, slight top light
    lin("mouldGrad", [["0", "#333e49"], ["0.28", "#29333d"], ["0.7", "#1d252d"], ["1", "#131a21"]]);
    // tan ceramic chip
    lin("bodyWarmGrad", [["0", "#c2ae8b"], ["0.35", "#a58f6d"], ["1", "#665440"]]);
    // yellow tantalum moulding
    lin("bodyTanGrad", [["0", "#dcae43"], ["0.3", "#c79433"], ["0.72", "#a97a24"], ["1", "#6d4d12"]]);
    svg.insertBefore(defs, gPour);
  })();

  /* ============================================================
     1. hatched copper pours — top & bottom margins
     ============================================================ */
  const addPourHatch = (x0, y0, x1, y1) => {
    const clipId = `pour-${Math.round(x0)}-${Math.round(y0)}`;
    const clip = svgEl("clipPath", { id: clipId });
    clip.appendChild(svgEl("rect", { x: x0, y: y0, width: x1 - x0, height: y1 - y0, rx: 10 }));
    svg.insertBefore(clip, gPour);
    const g = svgEl("g", { "clip-path": `url(#${clipId})`, opacity: "0.5" });
    const step = 11;
    for (let x = x0 - (y1 - y0); x < x1 + (y1 - y0); x += step) {
      g.appendChild(svgEl("line", {
        x1: x, y1: y1, x2: x + (y1 - y0), y2: y0,
        stroke: "rgba(226,166,104,0.10)", "stroke-width": "0.7",
      }));
    }
    g.appendChild(svgEl("rect", {
      x: x0, y: y0, width: x1 - x0, height: y1 - y0, rx: 10,
      fill: "none", stroke: "rgba(226,166,104,0.16)", "stroke-width": "0.8",
    }));
    gPour.appendChild(g);
  };
  addPourHatch(212, 18, 1228, 76);
  addPourHatch(212, 624, 1228, 682);

  /* ============================================================
     2. routing + ports
     ============================================================ */
  const ports = [];   // { x, y, layer }
  const traceMeta = []; // { path, port, outward }

  const squareEscape = (angle) => {
    const half = 176;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const scale = half / Math.max(Math.abs(cos), Math.abs(sin));
    return { x: CX + cos * scale, y: CY + sin * scale, cos, sin };
  };

  const addTrace = (points, opts = {}) => {
    if (points.length < 2) return null;
    const d = points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    const w = opts.width || 1.15;
    // copper sitting beneath the lacquer: a soft, wider halo first
    gTraces.appendChild(svgEl("path", {
      d, fill: "none",
      stroke: opts.hot ? "rgba(231,204,158,0.11)" : "rgba(146,165,185,0.055)",
      "stroke-width": (w * 3.2).toFixed(2),
      "stroke-linejoin": "round", "stroke-linecap": "round",
    }));
    const layer = opts.hot ? "tr-board tr-hot" : (opts.dim ? "tr-board tr-dim" : "tr-board");
    const p = svgEl("path", {
      d, class: layer,
      "stroke-width": w.toFixed(2),
      "stroke-linejoin": "round",
      "stroke-linecap": "round",
    });
    gTraces.appendChild(p);
    return p;
  };

  const addPad = (x, y, r = 2.6, opts = {}) => {
    // solder-mask opening, ENIG land, specular highlight
    gPads.appendChild(svgEl("circle", { cx: x, cy: y, r: r + 2.4, fill: "rgba(255,255,255,0.028)" }));
    gPads.appendChild(svgEl("circle", { cx: x, cy: y, r, class: "pad" }));
    if (!opts.quiet) {
      gPads.appendChild(svgEl("circle", { cx: x - r * 0.28, cy: y - r * 0.3, r: r * 0.45, fill: "rgba(255,255,255,0.42)" }));
    }
    if (opts.ring !== false) {
      gPads.appendChild(svgEl("circle", { cx: x, cy: y, r: r + 1.2, class: "pad-ring" }));
    }
  };

  const addVia = (x, y, r = 3.4, opts = {}) => {
    const o = opts.opacity || 0.7;
    // solder-mask opening + gold annular ring + drill
    gPads.appendChild(svgEl("circle", { cx: x, cy: y, r: r + 2.2, fill: "rgba(255,255,255,0.022)" }));
    gPads.appendChild(svgEl("circle", { cx: x, cy: y, r, fill: "rgba(231,204,158,0.5)", opacity: o }));
    gPads.appendChild(svgEl("circle", { cx: x, cy: y, r: r * 0.62, fill: "#05090c" }));
    gPads.appendChild(svgEl("circle", { cx: x, cy: y, r: r * 0.6, fill: "none", stroke: "rgba(0,0,0,0.55)", "stroke-width": "0.6" }));
    gPads.appendChild(svgEl("circle", { cx: x - r * 0.3, cy: y - r * 0.35, r: r * 0.28, fill: "rgba(255,255,255,0.45)" }));
  };

  /* route from a source near the chip out to a target port */
  const routeToPort = (angle, port, opts = {}) => {
    const esc = squareEscape(angle);
    const escapeLen = rr(20, 62);
    const p1 = { x: esc.x + esc.cos * escapeLen, y: esc.y + esc.sin * escapeLen };
    const dx = port.x - p1.x;
    const dy = port.y - p1.y;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    const points = [{ x: esc.x, y: esc.y }, p1];

    if (rand() > 0.28) {
      // 45° first, then straight into the pad
      if (adx > ady) {
        points.push({ x: p1.x + Math.sign(dx) * ady, y: port.y });
      } else {
        points.push({ x: port.x, y: p1.y + Math.sign(dy) * adx });
      }
    } else {
      // straight, then 45° into the pad
      if (adx > ady) {
        points.push({ x: port.x - Math.sign(dx) * ady, y: p1.y });
      } else {
        points.push({ x: p1.x, y: port.y - Math.sign(dy) * adx });
      }
    }
    points.push({ x: port.x, y: port.y });

    const path = addTrace(points, {
      width: rr(0.9, 1.45),
      hot: rand() > 0.62,
      dim: rand() > 0.86,
    });
    if (!path) return;
    // land under the part's termination: small, no specular, no ring
    addPad(port.x, port.y, rr(1.5, 2.1), { ring: false, quiet: true });
    traceMeta.push({ path, port, angle });
  };

  /* vertical escape channels from the BGA — like a real fan-out */
  (() => {
    const base = 152;
    for (const side of [-1, 1]) {
      const dir = side;
      for (let i = 0; i < 9; i++) {
        const x = CX + side * (base + i * 13);
        // short stub off the socket, then 45° jog up and down
        const yTop = CY - base - 8 - i * 5;
        const yBot = CY + base + 8 + i * 5;
        const stub = 26 + i * 7;
        // upward channel
        addTrace([
          { x, y: CY - base + 6 },
          { x, y: yTop - stub * 0.55 },
          { x: x + dir * stub * 0.45, y: yTop - stub },
        ], { width: 1, dim: i % 3 === 2 });
        addVia(x + dir * stub * 0.45, yTop - stub, 2.6, { opacity: 0.5 });
        // downward channel
        addTrace([
          { x, y: CY + base - 6 },
          { x, y: yBot + stub * 0.55 },
          { x: x + dir * stub * 0.45, y: yBot + stub },
        ], { width: 1, dim: i % 4 === 1 });
        addVia(x + dir * stub * 0.45, yBot + stub, 2.6, { opacity: 0.5 });
      }
    }
  })();

  /* build component positions first (they define ports) */
  const addPort = (x, y) => {
    const port = { x, y };
    ports.push(port);
    return port;
  };

  /* ============================================================
     3. components — extruded SMD parts with studio lighting
     ============================================================ */

  /* one global light: upper-left, like a bench microscope ring light */
  const LIGHT = { x: -0.62, y: -0.78 };
  const localLight = (rot) => {
    const r = (-rot * Math.PI) / 180;
    const c = Math.cos(r), sn = Math.sin(r);
    return {
      x: LIGHT.x * c - LIGHT.y * sn,
      y: LIGHT.x * sn + LIGHT.y * c,
    };
  };

  const label = (x, y, text, cls = "silk", anchor = "middle") => {
    const t = svgEl("text", { x, y, class: cls, "text-anchor": anchor });
    t.textContent = text;
    gSilk.appendChild(t);
    return t;
  };

  /* contact shadow + long cast shadow, thrown away from the light */
  const dropShadow = (g, w, h, rx, rot, spread = 3.5, lift = 1) => {
    const L = localLight(rot);
    const ox = -L.x, oy = -L.y;              // shadow falls opposite the light
    // tight ambient occlusion hugging the part
    g.appendChild(svgEl("rect", {
      x: -w / 2 - ox * (spread * 0.35) - 1, y: -h / 2 - oy * (spread * 0.35) - 1,
      width: w + 2, height: h + 2, rx: rx + 0.6,
      fill: "rgba(0,0,0,0.72)", filter: "url(#partShadow)", "pointer-events": "none",
    }));
    // long cast shadow, softer and wider the higher the part
    g.appendChild(svgEl("ellipse", {
      cx: -ox * spread * 1.15 * lift, cy: -oy * spread * 1.15 * lift,
      rx: w * 0.62 + 1.4, ry: h * 0.62 + 1.4,
      fill: "rgba(0,0,0,0.34)", filter: "url(#partShadowSoft)", "pointer-events": "none",
    }));
  };

  /* silkscreen field marks: two pin-1 bars beside the part (as on real
     two-terminal passives), never a frame around the body */
  const silkMarks = (g, x0, y0, w, h, opts = {}) => {
    const len = h * (opts.len ?? 0.72);
    const th = opts.width ?? 1.25;
    const gap = opts.gap ?? 1.5;
    const cy = y0 + h / 2;
    const col = opts.color || "rgba(238,244,250,0.62)";
    [x0 - gap, x0 + w + gap].forEach((x) => {
      g.appendChild(svgEl("rect", {
        x: x - th / 2, y: cy - len / 2, width: th, height: len, rx: th / 2,
        fill: col,
      }));
    });
  };

  /* extruded box: darker side walls facing away from the light + lit top face */
  const block3D = (g, x0, y0, w, h, rx, depth, fillTop, fillSide, L, opts = {}) => {
    // side wall: solid slab first (so it is never lost against the board),
    // then a gradient of scan-lines for the vertical falloff
    const wallX = x0 + -L.x * depth;
    const wallY = y0 + -L.y * depth;
    g.appendChild(svgEl("rect", {
      x: wallX, y: wallY, width: w, height: h, rx,
      fill: opts.sideBase || fillSide, opacity: 1,
    }));
    const steps = Math.max(6, Math.round(depth * 3));
    for (let i = 1; i <= steps; i++) {
      const t = (i / steps) * depth;
      g.appendChild(svgEl("rect", {
        x: x0 + -L.x * t, y: y0 + -L.y * t,
        width: w, height: h, rx,
        fill: fillSide,
        opacity: 0.9,
      }));
    }
    // bounce light where the wall meets the board (never pure black)
    g.appendChild(svgEl("rect", {
      x: wallX + 0.2, y: wallY + h - Math.max(0.8, h * 0.18),
      width: w - 0.4, height: Math.max(0.8, h * 0.18), rx: 0.3,
      fill: "rgba(146,165,185,0.16)",
    }));
    // top face
    g.appendChild(svgEl("rect", { x: x0, y: y0, width: w, height: h, rx, fill: fillTop }));
    if (opts.shine !== false) {
      // curved glossy reflection across the top
      g.appendChild(svgEl("rect", {
        x: x0 + 0.2, y: y0 + 0.2, width: Math.max(0.2, w - 0.4), height: Math.max(0.2, h - 0.4),
        rx: Math.max(0.2, rx - 0.25),
        fill: "url(#glossGrad)", opacity: 0.75,
      }));
      if (opts.glint) {
        // wet-looking highlight streak, like a real epoxy moulding
        g.appendChild(svgEl("rect", {
          x: x0 + w * 0.1, y: y0 + h * 0.12,
          width: w * 0.78, height: Math.max(0.7, h * 0.13), rx: 0.4,
          fill: "rgba(255,255,255,0.5)",
        }));
      }
      // narrow specular ridge: matte moulding, not chrome
      if (opts.matte !== false) {
        g.appendChild(svgEl("rect", {
          x: x0 + w * 0.06, y: y0 + h * 0.055,
          width: w * (1 - 0.12), height: Math.max(0.55, h * 0.075), rx: 0.3,
          fill: "rgba(255,255,255,0.3)",
        }));
      } else {
        g.appendChild(svgEl("ellipse", {
          cx: x0 + w * (opts.specX ?? 0.26), cy: y0 + h * (opts.specY ?? 0.24),
          rx: Math.max(1.2, w * 0.26), ry: Math.max(0.8, h * 0.2),
          fill: "url(#specGrad)", opacity: 0.55,
        }));
      }
      // bevel: separate top and bottom edges so nothing can render as a bar
      g.appendChild(svgEl("rect", {
        x: x0 + 0.45, y: y0 + 0.35,
        width: Math.max(0.3, w - 0.9), height: Math.max(0.35, h * 0.05),
        rx: 0.2, fill: "rgba(255,255,255,0.22)",
      }));
      g.appendChild(svgEl("rect", {
        x: x0 + 0.45, y: y0 + h - Math.max(0.35, h * 0.06) - 0.35,
        width: Math.max(0.3, w - 0.9), height: Math.max(0.35, h * 0.06),
        rx: 0.2, fill: "rgba(0,0,0,0.32)",
      }));
    }
  };

  /* tinned termination: metal block + solder fillet rising to the pad */
  const termination = (g, x0, y0, w, h, rot, L, opts = {}) => {
    const outward = x0 + w / 2 < 0 ? -1 : 1;   // which way the cap faces
    const r = Math.min(w, h) * 0.34;

    // 1) plated cap: flat, slightly rounded like a dipped termination
    g.appendChild(svgEl("rect", {
      x: x0, y: y0, width: w, height: h, rx: Math.min(0.55, r * 0.55),
      fill: "url(#solderGrad)",
    }));
    // 2) the lit top facet — a band, not a blob
    g.appendChild(svgEl("rect", {
      x: x0 + w * 0.1, y: y0 + h * 0.06,
      width: Math.max(0.5, w * 0.8), height: Math.max(0.6, h * 0.3),
      rx: 0.3, fill: "rgba(255,255,255,0.4)",
    }));
    // 3) solder fillet: concave meniscus rolling from the pad up the outer face
    g.appendChild(svgEl("path", {
      d: `M${x0 + (outward < 0 ? 0 : w)} ${y0 + h * 0.06}
          q${outward * 2.2} ${h * 0.44} 0 ${h * 0.88}
          L${x0 + (outward < 0 ? w : 0)} ${y0 + h * 0.94} Z`,
      fill: "rgba(178, 188, 196, 0.42)",
    }));
    // 4) soft shading on the lower third, so the cap looks cylindrical
    g.appendChild(svgEl("rect", {
      x: x0 + 0.3, y: y0 + h * 0.62,
      width: Math.max(0.4, w - 0.6), height: Math.max(0.5, h * 0.3),
      rx: 0.3, fill: "rgba(86,98,108,0.22)",
    }));
    // 4) dark crease where the cap meets the ceramic body (inboard edge)
    g.appendChild(svgEl("rect", {
      x: outward < 0 ? x0 + w - 0.9 : x0 + 0.25,
      y: y0 + 0.3, width: 0.65, height: h - 0.6,
      fill: "rgba(0,0,0,0.5)",
    }));

    // 5) occluded bottom edge
    g.appendChild(svgEl("rect", {
      x: x0 + 0.35, y: y0 + h - Math.max(0.55, h * 0.12) - 0.2,
      width: Math.max(0.4, w - 0.7), height: Math.max(0.55, h * 0.12), rx: 0.25,
      fill: "rgba(10,16,22,0.5)",
    }));

    // 6) tiny solder pimple where the fillet peaks — real joints are never flat
    g.appendChild(svgEl("circle", {
      cx: x0 + (outward < 0 ? w * 0.12 : w * 0.88), cy: y0 + h * 0.5,
      r: Math.max(0.4, Math.min(0.8, w * 0.14)),
      fill: "rgba(236,242,246,0.45)",
    }));
  };

  /* --- passives: 0402 / 0603 / 0805 with real bodies -------------- */
  const smdBody = (x, y, w, h, rot = 0, opts = {}) => {
    const g = svgEl("g", { transform: `translate(${x} ${y}) rotate(${rot})` });
    const termW = Math.max(1.9, w * 0.22);   // real 0603: caps ≈ 20% of length
    const L = localLight(rot);
    const depth = Math.max(3.4, h * 0.5);

    dropShadow(g, w + termW * 2, h, 0.9, rot, 3.4, 1.2);

    // solder-mask clearance + ENIG land + a whisker of solder wicking out
    [-1, 1].forEach((side) => {
      const out = side < 0 ? -1 : 1;
      const lx = side < 0 ? -w / 2 - termW - 2.6 : w / 2 + termW - 0.2;
      // mask opening (a real cut-out in the solder mask, just around the land)
      g.appendChild(svgEl("rect", {
        x: lx - 0.6, y: -h / 2 - 0.5, width: 3.0, height: h + 1.0, rx: 0.7,
        fill: "rgba(6,10,14,0.42)",
      }));
      // gold land
      g.appendChild(svgEl("rect", {
        x: lx, y: -h / 2 + 0.2, width: 1.9, height: h - 0.4, rx: 0.45,
        fill: "rgba(216,190,146,0.42)",
      }));
      // solder wicking onto the land
      g.appendChild(svgEl("path", {
        d: `M${lx + 0.95} ${-h / 2 + 1.4} q${out * 1.1} ${(h - 2.8) / 2} 0 ${h - 2.8}`,
        fill: "none", stroke: "rgba(232,238,242,0.4)", "stroke-width": "0.75",
        "stroke-linecap": "round",
      }));
    });

    // camera-locked shading: the light stays put while the part rotates, so the
    // top-face gradient is counter-rotated through gradientTransform
    if (rot) {
      const uid = `${Math.round(x)}_${Math.round(y)}`;
      const shadeId = `shade_${uid}`;
      const lightId = `light_${uid}`;
      const gs = svgEl("linearGradient", {
        id: shadeId, x1: "0", y1: "0", x2: "0", y2: "1",
        gradientTransform: `rotate(${(-rot).toFixed(1)} 0.5 0.5)`,
      });
      gs.appendChild(svgEl("stop", { offset: "0", "stop-color": "#ffffff", "stop-opacity": "0" }));
      gs.appendChild(svgEl("stop", { offset: "0.42", "stop-color": "#ffffff", "stop-opacity": "0.05" }));
      gs.appendChild(svgEl("stop", { offset: "1", "stop-color": "#000000", "stop-opacity": "0.42" }));
      const gl = svgEl("linearGradient", {
        id: lightId, x1: "0", y1: "0", x2: "0", y2: "1",
        gradientTransform: `rotate(${(-rot).toFixed(1)} 0.5 0.5)`,
      });
      gl.appendChild(svgEl("stop", { offset: "0", "stop-color": "#ffffff", "stop-opacity": "0.16" }));
      gl.appendChild(svgEl("stop", { offset: "0.34", "stop-color": "#ffffff", "stop-opacity": "0.03" }));
      gl.appendChild(svgEl("stop", { offset: "1", "stop-color": "#ffffff", "stop-opacity": "0" }));
      gParts.appendChild(gs);
      gParts.appendChild(gl);
      g.appendChild(svgEl("rect", {
        x: -w / 2, y: -h / 2, width: w, height: h, rx: 0.7,
        fill: `url(#${shadeId})`, style: "mix-blend-mode: multiply",
      }));
      g.appendChild(svgEl("rect", {
        x: -w / 2, y: -h / 2, width: w, height: h, rx: 0.7,
        fill: `url(#${lightId})`, style: "mix-blend-mode: screen",
      }));
    }

    // grain overlay is added after the body is drawn (see below)

    // body: matte moulded epoxy (resistor) or ceramic (MLCC)
    const bodyTop = opts.warm ? "#b9a684" : "#14191e";
    const bodySide = opts.warm ? "#6d5c45" : "#0a0e12";
    block3D(g, -w / 2, -h / 2, w, h, 0.7, depth,
      bodyTop, bodySide, L,
      { sideBase: opts.warm ? "#8a7659" : "#232b32", matte: true, glint: false });

    // micro texture: fractal noise, barely visible, kills the "vector" feel
    g.appendChild(svgEl("rect", {
      x: -w / 2 + 0.4, y: -h / 2 + 0.4, width: w - 0.8, height: h - 0.8, rx: 0.5,
      filter: "url(#grain)", opacity: opts.warm ? "0.16" : "0.2",
      style: "mix-blend-mode: overlay",
    }));

    // laser-ablated marking: pale, slightly recessed, only on resistor bodies
    if (!opts.warm && w >= 14) {
      const fs = Math.min(4.4, h * 0.5);
      const t = svgEl("text", {
        x: 0, y: fs * 0.36, "text-anchor": "middle",
        fill: "rgba(214,222,230,0.5)",
        "font-family": "var(--font-mono)", "font-size": fs,
        "letter-spacing": "0.06em",
      });
      t.textContent = "103";
      g.appendChild(t);
    }

    // MLCC: faint dielectric banding + rounded, glazed top
    if (opts.warm) {
      g.appendChild(svgEl("rect", {
        x: -w / 2 + 1.4, y: h / 2 - Math.max(1.2, h * 0.3),
        width: w - 2.8, height: Math.max(0.8, h * 0.16), rx: 0.4,
        fill: "rgba(70,54,34,0.35)",
      }));
      g.appendChild(svgEl("rect", {
        x: -w / 2 + 1.4, y: -h / 2 + 1.2,
        width: w - 2.8, height: Math.max(0.8, h * 0.18), rx: 0.4,
        fill: "rgba(255,255,255,0.16)",
      }));
    }

    // solder caps on both ends (drawn last so they sit proud of the body)
    termination(g, -w / 2 - termW, -h / 2, termW, h, rot, L);
    termination(g, w / 2, -h / 2, termW, h, rot, L);

    // pin-1 silk bars on the mask
    silkMarks(g, -w / 2 - termW * 2 - 2.8, -h / 2, w + termW * 4 + 5.6, h, { width: 1.5, gap: 0, len: 0.34 });

    gParts.appendChild(g);
    return g;
  };

  const smd = (x, y, rot, name, opts = {}) => {
    const w = opts.w || 18;
    const h = opts.h || 9;
    smdBody(x, y, w, h, rot, opts);
    if (name) {
      if (rot) {
        // vertical part: caption sits to its left, vertically centred
        label(x - h / 2 - 20, y + 2.6, name, "silk", "end");
      } else {
        label(x, y - h / 2 - 9.5, name, "silk", "middle");
      }
    }
    const halfW = w / 2 + 2.4;
    const padA = rot ? addPort(x, y - halfW) : addPort(x - halfW, y);
    return { padA };
  };

  /* --- QFN: exposed pad, gull leads, laser marking ---------------- */
  const qfn = (x, y, size, name) => {
    const g = svgEl("g", { transform: `translate(${x} ${y})` });
    const L = localLight(0);
    const half = size / 2;
    const leads = 7;
    const step = size / (leads - 1);

    dropShadow(g, size + 10, size + 10, 2.2, 0, 2.4);

    // 1) solder lands just outside the body
    for (let i = 0; i < leads; i++) {
      const t = -half + i * step;
      g.appendChild(svgEl("rect", { x: t - 1.7, y: -half - 4.1, width: 3.4, height: 4, rx: 0.5, fill: "rgba(224,190,134,0.45)" }));
      g.appendChild(svgEl("rect", { x: t - 1.7, y: half + 0.1, width: 3.4, height: 4, rx: 0.5, fill: "rgba(224,190,134,0.45)" }));
      g.appendChild(svgEl("rect", { x: -half - 4.1, y: t - 1.7, width: 4, height: 3.4, rx: 0.5, fill: "rgba(224,190,134,0.45)" }));
      g.appendChild(svgEl("rect", { x: half + 0.1, y: t - 1.7, width: 4, height: 3.4, rx: 0.5, fill: "rgba(224,190,134,0.45)" }));
    }

    // 2) exposed pads first (they sit "under" the leads)
    const tp = size * 0.4;
    g.appendChild(svgEl("rect", {
      x: -tp / 2 - 1.2, y: -tp / 2 - 1.2, width: tp + 2.4, height: tp + 2.4, rx: 1.6,
      fill: "rgba(224,190,134,0.22)",
    }));

    // 3) package body (the leads tuck under its edge)
    block3D(g, -half, -half, size, size, 1.8, size * 0.12, "url(#mouldGrad)", "#0b1218", L,
      { sideBase: "#1e2731", matte: true });

    // moulded chamfer: lit on the upper/left edges, shadowed on the lower/right
    const ch = 1.6;
    g.appendChild(svgEl("path", {
      d: `M${-half + 1} ${-half + 1} L${half - 1} ${-half + 1} L${half - 3} ${-half + ch} L${-half + 3} ${-half + ch} Z`,
      fill: "rgba(255,255,255,0.085)",
    }));
    g.appendChild(svgEl("path", {
      d: `M${-half + 1} ${-half + 1} L${-half + 1} ${half - 1} L${-half + ch} ${half - 3} L${-half + ch} ${-half + 3} Z`,
      fill: "rgba(255,255,255,0.05)",
    }));
    g.appendChild(svgEl("path", {
      d: `M${-half + 1} ${half - 1} L${half - 1} ${half - 1} L${half - 3} ${half - ch} L${-half + 3} ${half - ch} Z`,
      fill: "rgba(0,0,0,0.3)",
    }));
    g.appendChild(svgEl("path", {
      d: `M${half - 1} ${-half + 1} L${half - 1} ${half - 1} L${half - ch} ${half - 3} L${half - ch} ${-half + 3} Z`,
      fill: "rgba(0,0,0,0.26)",
    }));

    // inner shadow cast by the moulded rim onto the top face
    g.appendChild(svgEl("rect", {
      x: -half + 1.1, y: -half + 1.1, width: size - 2.2, height: size - 2.2, rx: 1.3,
      fill: "none", stroke: "rgba(0,0,0,0.55)", "stroke-width": "2.4",
    }));
    g.appendChild(svgEl("rect", {
      x: -half + 1.1, y: -half + 1.1, width: size - 2.2, height: size - 2.2, rx: 1.3,
      fill: "none", stroke: "rgba(255,255,255,0.07)", "stroke-width": "0.7",
    }));

    // 4) leads only as far as the body edge — small metal fingers
    const finger = 2.2;
    for (let i = 0; i < leads; i++) {
      const t = -half + i * step;
      [-1, 1].forEach((side) => {
        const y0 = side < 0 ? -half - finger : half;
        block3D(g, t - 1.3, y0, 2.6, finger, 0.35, 0.9, "url(#solderGrad)", "#4f5962", L, { shine: false });
        // lit toe + shaded heel, so each pin reads as metal
        g.appendChild(svgEl("rect", {
          x: t - 0.95, y: y0 + (side < 0 ? 0.25 : 0.25), width: 1.9,
          height: Math.max(0.5, finger * 0.4), rx: 0.25, fill: "rgba(255,255,255,0.46)",
        }));
        g.appendChild(svgEl("rect", {
          x: t - 0.95, y: y0 + finger - Math.max(0.35, finger * 0.22) - 0.15, width: 1.9,
          height: Math.max(0.35, finger * 0.22), rx: 0.2, fill: "rgba(0,0,0,0.4)",
        }));
      });
      [-1, 1].forEach((side) => {
        const x0 = side < 0 ? -half - finger : half;
        block3D(g, x0, t - 1.3, finger, 2.6, 0.35, 0.9, "url(#solderGrad)", "#4f5962", L, { shine: false });
        g.appendChild(svgEl("rect", {
          x: x0 + 0.25, y: t - 0.95, width: Math.max(0.5, finger * 0.4), height: 1.9,
          rx: 0.25, fill: "rgba(255,255,255,0.46)",
        }));
        g.appendChild(svgEl("rect", {
          x: x0 + finger - Math.max(0.35, finger * 0.22) - 0.15, y: t - 0.95,
          width: Math.max(0.35, finger * 0.22), height: 1.9, rx: 0.2, fill: "rgba(0,0,0,0.4)",
        }));
      });
    }

    // 5) top face detail: brushed sheen, thermal pad recess, solder fillet

    // recess: dark lip at the top edge, lit lip at the bottom edge
    g.appendChild(svgEl("rect", {
      x: -tp / 2 - 1.1, y: -tp / 2 - 1.1, width: tp + 2.2, height: tp + 2.2, rx: 1.6,
      fill: "rgba(0,0,0,0.5)",
    }));
    g.appendChild(svgEl("rect", {
      x: -tp / 2, y: -tp / 2 + 1.1, width: tp, height: tp, rx: 1,
      fill: "#222a31",
    }));
    g.appendChild(svgEl("rect", {
      x: -tp / 2, y: -tp / 2 + 1.1, width: tp, height: 1.3, rx: 0.5,
      fill: "rgba(0,0,0,0.6)",
    }));
    g.appendChild(svgEl("rect", {
      x: -tp / 2, y: -tp / 2 + tp, width: tp, height: 1.2, rx: 0.5,
      fill: "rgba(198,214,226,0.3)",
    }));
    g.appendChild(svgEl("rect", {
      x: -tp / 2 + 0.9, y: -tp / 2 + 2.2, width: tp - 1.8, height: tp - 2.4, rx: 0.6,
      fill: "none", stroke: "rgba(255,255,255,0.1)", "stroke-width": "0.55",
    }));

    // 6) pin-1 index + laser marking
    g.appendChild(svgEl("circle", { cx: -half + 3.6, cy: -half + 3.6, r: 1.5, fill: "#0a1116" }));
    g.appendChild(svgEl("circle", { cx: -half + 3.35, cy: -half + 3.35, r: 0.6, fill: "rgba(255,255,255,0.5)" }));

    const mark = (yOff, txt, fs) => {
      const t = svgEl("text", {
        x: 0, y: yOff, "text-anchor": "middle",
        fill: "rgba(214,224,232,0.32)",
        "font-family": "var(--font-mono)", "font-size": fs,
        "letter-spacing": "0.14em",
      });
      t.textContent = txt;
      g.appendChild(t);
    };
    if (size >= 30) mark(half - 2.6, "OT256", 3.2);

    gParts.appendChild(g);
    label(x - half - 4, y - half - 9, name, "silk", "start");
    for (let i = 0; i < 3; i++) addPort(x + half + 1.4, y - size / 4 + i * (size / 4));
    return g;
  };

  /* --- SOIC: chamfered body, gull-wing leads ---------------------- */
  const soic = (x, y, w, h, pins, name) => {
    const g = svgEl("g", { transform: `translate(${x} ${y})` });
    const L = localLight(0);
    const perSide = pins / 2;
    const pitch = w / perSide;

    dropShadow(g, w + 12, h + 10, 1.6, 0, 2.2);

    // gull-wing leads: flat arm out of the body, knee, foot landing on the pad
    for (let i = 0; i < perSide; i++) {
      const t = -w / 2 + (i + 0.5) * pitch;
      [-1, 1].forEach((side) => {
        const s1 = side < 0 ? -1 : 1;
        const base = s1 < 0 ? -h / 2 : h / 2;      // where the lead leaves the body
        const reach = 4.2;                         // length of the arm
        // ENIG land under the foot
        g.appendChild(svgEl("rect", {
          x: t - 1.85, y: s1 < 0 ? base - reach - 2.2 : base + reach - 1.0,
          width: 3.7, height: 3.2, rx: 0.45, fill: "rgba(226,196,142,0.42)",
        }));
        // the arm: a flat bar of metal, brighter on its upper face
        g.appendChild(svgEl("rect", {
          x: t - 1.5, y: s1 < 0 ? base - reach : base,
          width: 3.0, height: reach, fill: "#7d8894",
        }));
        g.appendChild(svgEl("rect", {
          x: t - 1.5, y: s1 < 0 ? base - reach : base,
          width: 3.0, height: Math.max(0.7, reach * 0.42), fill: "rgba(226,234,240,0.55)",
        }));
        // the foot: bent down onto the pad, drawn as a small wedge
        g.appendChild(svgEl("path", {
          d: s1 < 0
            ? `M${t - 1.5} ${base - reach} L${t + 1.5} ${base - reach} L${t + 1.5} ${base - reach - 1.9} Q${t} ${base - reach - 3} ${t - 1.5} ${base - reach - 1.9} Z`
            : `M${t - 1.5} ${base + reach} L${t + 1.5} ${base + reach} L${t + 1.5} ${base + reach + 1.9} Q${t} ${base + reach + 3} ${t - 1.5} ${base + reach + 1.9} Z`,
          fill: "#98a3ad",
        }));
        // shadow the foot drops on the board
        g.appendChild(svgEl("rect", {
          x: t - 1.6, y: s1 < 0 ? base - reach - 2.6 : base + reach + 2.6,
          width: 3.2, height: 1.0, rx: 0.3, fill: "rgba(0,0,0,0.5)",
        }));
        // contact line + a little solder fillet at the toe
        g.appendChild(svgEl("rect", {
          x: t - 1.5, y: s1 < 0 ? base - reach - 2.9 : base + reach + 2.2,
          width: 3.0, height: 0.6, fill: "rgba(208,216,222,0.35)",
        }));
      });
    }

    // body: moulded epoxy with a chamfered top edge
    block3D(g, -w / 2, -h / 2, w, h, 1.6, Math.max(5, h * 0.34),
      "url(#bodyDarkGrad)", "#0c1319", L, { sideBase: "#2a3540", matte: true });

    // top face: soft light falloff + the mould parting line
    g.appendChild(svgEl("rect", {
      x: -w / 2 + 0.9, y: -h / 2 + 0.9, width: w - 1.8, height: h - 1.8, rx: 1.2,
      fill: "url(#mouldGrad)", opacity: 0.55,
    }));
    g.appendChild(svgEl("path", {
      d: `M${-w / 2 + 1.2} ${-h / 2 + 1.4} L${w / 2 - 1.2} ${-h / 2 + 1.4}`,
      stroke: "rgba(255,255,255,0.1)", "stroke-width": "0.7", fill: "none",
    }));
    g.appendChild(svgEl("path", {
      d: `M${-w / 2 + 1.2} ${h / 2 - 1.6} L${w / 2 - 1.2} ${h / 2 - 1.6}`,
      stroke: "rgba(0,0,0,0.45)", "stroke-width": "1", fill: "none",
    }));

    // pin-1 chamfer highlight
    g.appendChild(svgEl("path", {
      d: `M${-w / 2 + 0.2} ${-h / 2 + 4.2} L${-w / 2 + 4.2} ${-h / 2 + 0.2}`,
      stroke: "rgba(255,255,255,0.18)", "stroke-width": "0.7", fill: "none",
    }));
    // pin-1 dimple
    g.appendChild(svgEl("circle", { cx: -w / 2 + 4.2, cy: -h / 2 + 3.6, r: 1.25, fill: "#0a1116" }));
    g.appendChild(svgEl("circle", { cx: -w / 2 + 3.95, cy: -h / 2 + 3.35, r: 0.5, fill: "rgba(255,255,255,0.5)" }));

    // laser marking
    if (w >= 34) {
      const t = svgEl("text", {
        x: 0, y: 1.2, "text-anchor": "middle",
        fill: "rgba(214,224,232,0.36)",
        "font-family": "var(--font-mono)", "font-size": 3.1,
        "letter-spacing": "0.16em",
      });
      t.textContent = "OT-S25Q";
      g.appendChild(t);
    }

    gParts.appendChild(g);
    label(x - w / 2 - 2, y - h / 2 - 10, name, "silk", "start");
    for (let i = 0; i < 3; i++) addPort(x + w / 2 + 1.2, y - h / 3 + i * (h / 3));
    return g;
  };

  const mountHole = (x, y, r = 11) => {
    // countersunk rim, then the barrel
    gParts.appendChild(svgEl("circle", { cx: x - 0.6, cy: y - 0.8, r: r + 4.6, fill: "rgba(0,0,0,0.5)", filter: "url(#partShadow)" }));
    gParts.appendChild(svgEl("circle", { cx: x, cy: y, r: r + 4, class: "mount-ring" }));
    gParts.appendChild(svgEl("circle", { cx: x, cy: y, r: r + 1.2, fill: "#c8b184" }));
    gParts.appendChild(svgEl("circle", { cx: x, cy: y, r: r, fill: "#0b1218" }));
    gParts.appendChild(svgEl("circle", { cx: x, cy: y, r: r, fill: "none", stroke: "rgba(0,0,0,0.75)", "stroke-width": "1.2" }));
    // bore wall catching light on one side
    gParts.appendChild(svgEl("path", {
      d: `M${x - r * 0.86} ${y - r * 0.4} A${r} ${r} 0 0 1 ${x - r * 0.1} ${y - r * 0.99}`,
      fill: "none", stroke: "rgba(200,214,226,0.45)", "stroke-width": `${Math.max(1, r * 0.16)}`,
      "stroke-linecap": "round",
    }));
    gParts.appendChild(svgEl("circle", { cx: x, cy: y, r: r * 0.52, fill: "#05090d" }));
  };

  const fiducial = (x, y, r = 5) => {
    gParts.appendChild(svgEl("circle", { cx: x - 0.5, cy: y - 0.6, r: r + 3, fill: "rgba(0,0,0,0.45)", filter: "url(#partShadow)" }));
    gParts.appendChild(svgEl("circle", { cx: x, cy: y, r: r + 2.6, class: "fiducial-ring" }));
    gParts.appendChild(svgEl("circle", { cx: x, cy: y, r, fill: "#d9b878" }));
    gParts.appendChild(svgEl("circle", { cx: x - r * 0.3, cy: y - r * 0.34, r: r * 0.42, fill: "rgba(255,255,255,0.65)" }));
  };

  const testPoint = (x, y, name) => {
    gParts.appendChild(svgEl("circle", { cx: x, cy: y, r: 5.2, fill: "none", stroke: "rgba(226,232,240,0.22)", "stroke-width": "0.8", "stroke-dasharray": "2 2.5" }));
    gParts.appendChild(svgEl("circle", { cx: x - 0.4, cy: y - 0.5, r: 3.1, fill: "rgba(0,0,0,0.5)", filter: "url(#partShadow)" }));
    gParts.appendChild(svgEl("circle", { cx: x, cy: y, r: 2.8, fill: "#d9b878" }));
    gParts.appendChild(svgEl("circle", { cx: x - 0.8, cy: y - 0.9, r: 1.1, fill: "rgba(255,255,255,0.6)" }));
    label(x, y + 10, name, "silk");
  };

  /* --- left bank -------------------------------------------------- */
  qfn(172, 244, 78, "U2 · QFN‑48");
  const lResistors = [];
  for (let i = 0; i < 6; i++) {
    const col = i % 2;
    const y = 336 + Math.floor(i / 2) * 72;
    smd(92 + col * 62, y, 90, `R${12 + i}`, { w: 44, h: 18 });
    lResistors.push(y);
  }

  const cBankY = 596;
  for (let i = 0; i < 5; i++) {
    smd(252 + i * 34, cBankY, 0, null, { w: 22, h: 13, warm: true });
  }
  label(252, cBankY + 30, "C31–C35 · 100 nF", "silk", "start");

  soic(360, 168, 82, 32, 8, "U3 · NOR‑FLASH");
  for (let i = 0; i < 3; i++) {
    addPort(300 + i * 16, 176);
  }

  // edge connector
  const gConn = svgEl("g");
  for (let i = 0; i < 6; i++) {
    const y = 306 + i * 22;
    gConn.appendChild(svgEl("rect", { x: 31, y: y - 3, width: 26, height: 8, rx: 1.4, fill: "rgba(0,0,0,0.5)" }));
    gConn.appendChild(svgEl("rect", { x: 30, y: y - 4, width: 26, height: 8, rx: 1.4, fill: "#d8b677" }));
    gConn.appendChild(svgEl("rect", { x: 30.7, y: y - 3.2, width: 24.6, height: 2.4, rx: 1, fill: "rgba(255,255,255,0.6)" }));
    gConn.appendChild(svgEl("rect", { x: 30.7, y: y + 0.9, width: 24.6, height: 2.2, rx: 0.9, fill: "rgba(90,62,20,0.4)" }));
    addPort(60, y);
  }
  gParts.appendChild(gConn);
  label(30, 276, "J1 · EDGE", "silk", "start");

  /* --- right bank ------------------------------------------------- */
  qfn(1254, 222, 78, "U4 · QFN‑48");
  for (let i = 0; i < 6; i++) {
    const col = i % 2;
    const y = 336 + Math.floor(i / 2) * 72;
    smd(1348 - col * 62, y, 90, `R${21 + i}`, { w: 44, h: 18 });
  }

  // inductor
  (() => {
    const x = 1128, y = 512;
    const g = svgEl("g");
    const L = localLight(0);
    dropShadow(g, 80, 44, 4, 0, 3);
    // pads
    g.appendChild(svgEl("rect", { x: x - 37, y: y - 13.5, width: 36, height: 27, rx: 2, fill: "rgba(224,190,134,0.4)" }));
    g.appendChild(svgEl("rect", { x: x + 1, y: y - 13.5, width: 36, height: 27, rx: 2, fill: "rgba(224,190,134,0.4)" }));
    // terminations
    termination(g, x - 36, y - 12, 7, 24, 0, L, { top: "#a6b2bc", side: "#4c565f" });
    termination(g, x + 29, y - 12, 7, 24, 0, L, { top: "#a6b2bc", side: "#4c565f" });
    // moulded housing
    block3D(g, x - 28, y - 18, 56, 36, 3.4, 4.6, "#39434c", "#151c23", L);
    g.appendChild(svgEl("rect", { x: x - 26, y: y - 16, width: 52, height: 5, rx: 2.4, fill: "rgba(255,255,255,0.055)" }));
    // winding coils on the top face
    for (let i = 0; i < 4; i++) {
      g.appendChild(svgEl("path", {
        d: `M${x - 20 + i * 11} ${y - 9} q5 9 0 18`,
        fill: "none", stroke: "rgba(214,180,126,0.6)", "stroke-width": "1.5",
        "stroke-linecap": "round",
      }));
      g.appendChild(svgEl("path", {
        d: `M${x - 20 + i * 11} ${y - 9} q5 9 0 18`,
        fill: "none", stroke: "rgba(255,255,255,0.2)", "stroke-width": "0.6",
        "stroke-linecap": "round",
        transform: `translate(-0.5 -0.6)`,
      }));
    }
    gParts.appendChild(g);
    label(x, y + 30, "L1 · 4.7 µH", "silk");
    addPort(x - 36, y);
    addPort(x + 36, y);
  })();

  // differential pair test structure
  (() => {
    const x0 = 1010, x1 = 1180, y = 330;
    const g = svgEl("g");
    g.appendChild(svgEl("path", { d: `M${x0} ${y - 4}h165`, stroke: "rgba(226,166,104,0.7)", "stroke-width": "1.4", fill: "none", "stroke-linecap": "round" }));
    g.appendChild(svgEl("path", { d: `M${x0} ${y + 4}h165`, stroke: "rgba(226,166,104,0.45)", "stroke-width": "1.4", fill: "none", "stroke-linecap": "round" }));
    g.appendChild(svgEl("circle", { cx: x1, cy: y, r: 3.4, class: "fiducial" }));
    g.appendChild(svgEl("path", { d: `M${x1} ${y} l16 -14`, stroke: "rgba(94,240,184,0.7)", "stroke-width": "1", fill: "none" }));
    gParts.appendChild(g);
    label(1096, y + 22, "J2 · 100 Ω DIFF", "silk--warm");
    addPort(x0, y - 4);
    addPort(x1, y);
  })();

  // spread a few small parts around for rhythm
  const scatter = [
    [206, 96, 0], [252, 96, 0], [1120, 96, 0], [1166, 96, 0],
    [206, 604, 0], [252, 604, 0], [1108, 604, 0], [1154, 604, 0],
    [470, 96, 0], [974, 96, 0], [470, 620, 0], [974, 620, 0],
  ];
  scatter.forEach(([x, y], i) => {
    smd(x, y, i % 3 === 0 ? 90 : 0, null, { w: 26, h: 12, warm: i % 2 === 0 });
  });

  /* --- extra realism: SOIC with pin-1 and legend, tantalums, micro silk --- */
  (() => {
    // second SOIC (op-amp) upper-left quadrant
    // tantalum caps: chamfered body + polarity bar
    const tantalum = (x, y, rot) => {
      const g = svgEl("g", { transform: `translate(${x} ${y}) rotate(${rot})` });
      const L = localLight(rot);
      dropShadow(g, 48, 30, 3, rot, 3.0, 1.5);
      // solder terminations
      termination(g, -24, -13, 5.6, 26, rot, L, { top: "#9fabb5", side: "#4d5760" });
      termination(g, 18.4, -13, 5.6, 26, rot, L, { top: "#9fabb5", side: "#4d5760" });
      // moulded body: higher than a ceramic chip, rounded shoulders
      block3D(g, -19, -13, 38, 26, 4, 10, "url(#bodyTanGrad)", "#8a6218", L, { sideBase: "#a8791f" });
      // top face lighting
      g.appendChild(svgEl("rect", { x: -17, y: -11.4, width: 34, height: 6.6, rx: 2.4, fill: "rgba(255,255,255,0.28)" }));
      g.appendChild(svgEl("rect", { x: -17, y: 4.2, width: 34, height: 5.6, rx: 2.2, fill: "rgba(0,0,0,0.2)" }));
      // polarity band
      g.appendChild(svgEl("rect", { x: 7.6, y: -12.2, width: 9.4, height: 24.4, rx: 1.8, fill: "rgba(52,32,6,0.62)" }));
      g.appendChild(svgEl("path", { d: "M9.9 -3h5M12.4 -5.5v5", stroke: "rgba(255,255,255,0.6)", "stroke-width": "1.1" }));
      gParts.appendChild(g);
    };
    tantalum(438, 596, 0);
    tantalum(502, 596, 0);
    label(438, 690, "C41 · C42 · 10 µF", "silk", "start");
    // micro silkscreen: fab panel in the free top strip
    label(760, 30, "OPENTRACE LABS · REV 3.1 · 2026‑11", "silk", "middle");
  })();

  mountHole(390, 52);
  mountHole(1050, 52);
  mountHole(390, 648);
  mountHole(1050, 648);
  fiducial(300, 648);
  fiducial(1140, 52);
  fiducial(566, 52);
  fiducial(874, 648);
  testPoint(210, 460, "TP1");
  testPoint(1230, 460, "TP2");
  testPoint(520, 626, "TP3");

  /* big silkscreen legends */
  /* vertical legends along the board edges, like real silkscreen */
  const vLabel = (x, y, text, rotate) => {
    const t = svgEl("text", {
      x, y, class: "silk silk--big",
      "text-anchor": "middle",
      transform: `rotate(${rotate} ${x} ${y})`,
    });
    t.textContent = text;
    gSilk.appendChild(t);
  };
  vLabel(64, 250, "DDR5 FANOUT", -90);
  vLabel(64, 470, "PMIC · 8‑PHASE", -90);
  vLabel(W - 64, 470, "PCIE GEN 6", 90);
  vLabel(W - 64, 250, "RF FRONT‑END · 28 GHz", 90);
  label(720, 40, "OT‑256 · ROUTER CORE", "silk silk--warm", "middle");
  label(720, 672, "SOCKET LGA‑256 · 0.80 mm · COPPER‑FILLED VIA‑IN‑PAD", "silk", "middle");

  /* ============================================================
     4. stitch vias around board edge
     ============================================================ */
  const inset = 14;
  const step = 40;
  for (let x = inset + 40; x < W - inset - 30; x += step) {
    if (x > 500 && x < 940) continue;
    addVia(x, inset, 3, { opacity: 0.4 });
    addVia(x, H - inset, 3, { opacity: 0.4 });
  }
  for (let y = inset + 24; y < H - inset - 20; y += step) {
    if (y > 260 && y < 440) continue;
    addVia(inset, y, 3, { opacity: 0.4 });
    addVia(W - inset, y, 3, { opacity: 0.4 });
  }

  /* ============================================================
     5. route every port from the package perimeter
     ============================================================ */
  /* decoupling caps arranged around the socket, with their own vias */
  (() => {
    const r = 258;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 + 0.09;
      const x = CX + Math.cos(a) * r;
      const y = CY + Math.sin(a) * r;
      if (x < 320 || x > W - 320) continue;
      if (y < 120 || y > H - 120) continue;
      const tangent = (a * 180) / Math.PI + 90;
      smdBody(x, y, 21, 11, tangent, { warm: i % 3 === 0 });
      // short stitch to a via just outside
      const vx = CX + Math.cos(a) * (r + 17);
      const vy = CY + Math.sin(a) * (r + 17);
      gTraces.appendChild(svgEl("path", {
        d: `M${x.toFixed(1)} ${y.toFixed(1)} L${vx.toFixed(1)} ${vy.toFixed(1)}`,
        fill: "none", stroke: "rgba(226,166,104,0.4)", "stroke-width": "0.8",
      }));
      if (i % 2 === 0) addVia(vx, vy, 2.6, { opacity: 0.6 });
    }
    label(CX - 258, CY + 292, "DECOUPLING · 0.1 µF ×24", "silk", "middle");
  })();

  /* socket keep-out ring around the BGA */
  (() => {
    const r = 214;
    const d = `M${CX - r} ${CY - r + 34}V${CY - r}H${CX - r + 34}` +
      `M${CX + r - 34} ${CY - r}H${CX + r}V${CY - r + 34}` +
      `M${CX - r} ${CY + r - 34}V${CY + r}H${CX - r + 34}` +
      `M${CX + r - 34} ${CY + r}H${CX + r}V${CY + r - 34}`;
    gSilk.appendChild(svgEl("path", { d, fill: "none", stroke: "rgba(238,243,236,0.22)", "stroke-width": "1.1" }));
    // alignment pins
    [[CX, CY - r - 10], [CX, CY + r + 10], [CX - r - 10, CY], [CX + r + 10, CY]].forEach(([x, y]) => {
      gParts.appendChild(svgEl("circle", { cx: x, cy: y, r: 3.2, fill: "rgba(226,166,104,0.55)", stroke: "rgba(0,0,0,.6)", "stroke-width": ".6" }));
    });
    // fiducial crosses at the four corners of the socket
    [[CX - r - 4, CY - r - 4], [CX + r + 4, CY - r - 4], [CX - r - 4, CY + r + 4], [CX + r + 4, CY + r + 4]].forEach(([x, y]) => {
      gSilk.appendChild(svgEl("path", { d: `M${x - 7} ${y}h14M${x} ${y - 7}v14`, stroke: "rgba(226,166,104,0.45)", "stroke-width": "0.9" }));
      gSilk.appendChild(svgEl("circle", { cx: x, cy: y, r: 2, fill: "none", stroke: "rgba(94,240,184,0.5)", "stroke-width": "0.8" }));
    });
  })();

  const portAngles = ports.map((p) => Math.atan2(p.y - CY, p.x - CX));
  ports.forEach((port, i) => {
    let a = portAngles[i];
    // bias the escape angle toward the port side for believable fanout
    a += rr(-0.26, 0.26);
    routeToPort(a, port);
  });

  // extra decorative escape stubs that die into vias near the package
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + rr(-0.08, 0.08);
    const esc = squareEscape(a);
    const len = rr(40, 96);
    const mid = { x: esc.x + esc.cos * len, y: esc.y + esc.sin * len };
    const end = { x: mid.x + esc.cos * rr(26, 70), y: mid.y + esc.sin * rr(26, 70) };
    addTrace([{ x: esc.x, y: esc.y }, mid, end], { width: rr(0.8, 1.2), dim: rand() > 0.6 });
    addVia(end.x, end.y, 3);
  }


  /* fanout bundles — 4 parallel traces leaving each package side */
  const bundle = (angle, count, spread, lengths) => {
    for (let i = 0; i < count; i++) {
      const a = angle + (i - (count - 1) / 2) * spread;
      const esc = squareEscape(a);
      const l1 = lengths[0] + (i % 2) * 8;
      const l2 = lengths[1] + (i % 3) * 10;
      const p1 = { x: esc.x + esc.cos * l1, y: esc.y + esc.sin * l1 };
      const p2 = { x: p1.x + esc.cos * l2, y: p1.y + esc.sin * l2 };
      const p3 = { x: p2.x + esc.cos * (lengths[2] + i * 6), y: p2.y };
      addTrace([{ x: esc.x, y: esc.y }, p1, p2, p3], { width: 1, dim: i % 3 === 1 });
      addVia(p3.x, p3.y, 3);
    }
  };
  bundle(Math.PI * 0.72, 5, 0.045, [26, 42, 60]);
  bundle(Math.PI * 1.28, 5, 0.045, [26, 40, 56]);
  bundle(-Math.PI * 0.28, 4, 0.05, [24, 36, 48]);
  bundle(Math.PI * 0.16, 3, 0.05, [22, 30, 40]);

  // wide power bus loop with 45° corners
  (() => {
    const m = 92;
    const pts = [
      { x: m, y: m + 120 }, { x: m, y: m }, { x: m + 120, y: m },
      { x: W - m - 120, y: m }, { x: W - m, y: m }, { x: W - m, y: m + 120 },
      { x: W - m, y: H - m - 120 }, { x: W - m, y: H - m },
      { x: W - m - 120, y: H - m }, { x: m + 120, y: H - m },
      { x: m, y: H - m }, { x: m, y: H - m - 120 },
    ];
    const d = pts.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");
    gTraces.appendChild(svgEl("path", { d, fill: "none", stroke: "rgba(169,106,52,0.45)", "stroke-width": "2.4", "stroke-linejoin": "round" }));
    gTraces.appendChild(svgEl("path", { d, fill: "none", stroke: "rgba(94,240,184,0.10)", "stroke-width": "5", "stroke-linejoin": "round" }));
    // tie-in vias
    pts.forEach((p, i) => { if (i % 3 === 0) addVia(p.x, p.y, 4, { opacity: 0.55 }); });
  })();

  /* silk frame + fiducial crosses */
  (() => {
    const m = 34;
    const d = `M${m} ${m + 60}V${m}H${m + 60}M${W - m - 60} ${m}H${W - m}V${m + 60}` +
      `M${m} ${H - m - 60}V${H - m}H${m + 60}M${W - m - 60} ${H - m}H${W - m}V${H - m - 60}`;
    gSilk.appendChild(svgEl("path", { d, fill: "none", stroke: "rgba(238,243,236,0.10)", "stroke-width": "1" }));
    [[m + 18, m + 18], [W - m - 18, m + 18], [m + 18, H - m - 18], [W - m - 18, H - m - 18]].forEach(([x, y]) => {
      gSilk.appendChild(svgEl("path", { d: `M${x - 5} ${y}h10M${x} ${y - 5}v10`, stroke: "rgba(238,243,236,0.16)", "stroke-width": "0.8" }));
    });
  })();

  /* ============================================================
     6. impulses
     ============================================================ */
  if (!reduced) {
    const sorted = [...traceMeta].sort((a, b) => {
      const da = Math.abs(Math.sin(a.angle)) + Math.abs(Math.cos(a.angle) - 1);
      const db = Math.abs(Math.sin(b.angle)) + Math.abs(Math.cos(b.angle) - 1);
      return da - db;
    });

    const defs = svgEl("defs");
    const glow = svgEl("filter", { id: "pulseGlow", x: "-200%", y: "-200%", width: "500%", height: "500%" });
    glow.appendChild(svgEl("feGaussianBlur", { stdDeviation: "1.4", result: "b" }));
    const merge = svgEl("feMerge");
    merge.appendChild(svgEl("feMergeNode", { in: "b" }));
    merge.appendChild(svgEl("feMergeNode", { in: "SourceGraphic" }));
    glow.appendChild(merge);
    defs.appendChild(glow);
    svg.insertBefore(defs, gPour);

    const makeRunner = (pathEl, inward, warm) => {
      const len = pathEl.getTotalLength();
      if (!len || len < 80) return;
      const d = pathEl.getAttribute("d");

      // tail: short dash that rides just behind the head
      const tail = svgEl("path", {
        d, fill: "none",
        stroke: warm ? "rgba(238,201,141,0.95)" : "rgba(120,248,196,0.92)",
        "stroke-width": warm ? "1.3" : "1.4",
        "stroke-linecap": "round",
        filter: "url(#pulseGlow)",
      });
      tail.style.strokeDasharray = `9 ${len + 60}`;
      gPulse.appendChild(tail);

      // head
      const g = svgEl("g", { filter: "url(#pulseGlow)" });
      const dot = svgEl("circle", { r: warm ? 1.9 : 2.0, fill: warm ? "#ffe6b8" : "#d8fff0", opacity: 0.95 });
      g.appendChild(dot);
      gPulse.appendChild(g);

      const dur = rr(6800, 13500);
      const delay = -rr(0, dur);
      const from = inward ? 0 : len;
      const to = inward ? len : 0;
      const easing = "linear";

      tail.animate(
        [{ strokeDashoffset: from }, { strokeDashoffset: to }],
        { duration: dur, delay, iterations: Infinity, easing }
      );
      // move the head along the path
      try {
        const motion = document.createElementNS(SVG_NS, "animateMotion");
        motion.setAttribute("dur", `${dur}ms`);
        motion.setAttribute("begin", `${delay}ms`);
        motion.setAttribute("repeatCount", "indefinite");
        motion.setAttribute("path", d);
        motion.setAttribute("keyPoints", inward ? "1;0" : "0;1");
        motion.setAttribute("keyTimes", "0;1");
        motion.setAttribute("calcMode", "linear");
        g.appendChild(motion);
      } catch (e) {
        dot.setAttribute("opacity", "0");
      }
    };

    const inwardCount = Math.min(13, sorted.length);
    for (let i = 0; i < inwardCount; i++) makeRunner(sorted[i].path, true, i % 4 === 0);
    for (let i = inwardCount; i < Math.min(sorted.length, inwardCount + 24); i += 4) {
      makeRunner(sorted[i].path, false, i % 6 === 0);
    }

    // short arcs that ring the die and always travel inward
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.25;
      const r0 = 232, r1 = 204;
      const p = svgEl("path", {
        d: `M${(CX + Math.cos(a) * r0).toFixed(1)} ${(CY + Math.sin(a) * r0).toFixed(1)} L${(CX + Math.cos(a) * r1).toFixed(1)} ${(CY + Math.sin(a) * r1).toFixed(1)}`,
        fill: "none",
        stroke: "rgba(120,248,196,0.8)",
        "stroke-width": "1.5",
        "stroke-linecap": "round",
        filter: "url(#pulseGlow)",
      });
      p.style.strokeDasharray = `9 200`;
      gPulse.appendChild(p);
      const dur = rr(2600, 4600);
      p.animate(
        [{ strokeDashoffset: 204 }, { strokeDashoffset: 0 }],
        { duration: dur, delay: -rr(0, dur), iterations: Infinity, easing: "linear" }
      );
    }
  }

  /* ============================================================
     6a. package fanout — traces from under the balls to substrate vias
     ============================================================ */
  (() => {
    const host = document.getElementById("chip-fanout");
    if (!host) return;
    const make = (tag, attrs) => {
      const n = document.createElementNS(SVG_NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      return n;
    };
    const gTrace = make("g", { stroke: "rgba(226,166,104,0.5)", "stroke-width": "0.5" });
    const gVia = make("g", {});
    const ring = 100;

    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + 0.04;
      const cos = Math.cos(a), sin = Math.sin(a);
      const r0 = 78;
      const r1 = 92;
      const x0 = ring + cos * r0, y0 = ring + sin * r0;
      const x1 = ring + cos * r1, y1 = ring + sin * r1;
      // dog-bone: radial + short lateral jog for that routed look
      const jx = x1 - sin * 2.6, jy = y1 + cos * 2.6;
      gTrace.appendChild(make("path", {
        d: `M${x0.toFixed(1)} ${y0.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)} L${jx.toFixed(1)} ${jy.toFixed(1)}`,
        fill: "none", "stroke-linecap": "round",
      }));
      gVia.appendChild(make("circle", { cx: jx.toFixed(1), cy: jy.toFixed(1), r: 1.15, fill: "rgba(226,166,104,0.85)" }));
      gVia.appendChild(make("circle", { cx: jx.toFixed(1), cy: jy.toFixed(1), r: 0.45, fill: "#04100c" }));
    }
    // outer ring of escape vias
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const x = ring + Math.cos(a) * 95.5, y = ring + Math.sin(a) * 95.5;
      gVia.appendChild(make("circle", { cx: x.toFixed(1), cy: y.toFixed(1), r: 0.75, fill: "rgba(238,243,236,0.22)" }));
    }
    host.append(gTrace, gVia);
  })();

  /* ============================================================
     6b. X-ray substrate: wire-bond fan + fanout traces
     ============================================================ */
  (() => {
    const xray = document.querySelector(".chip__xray");
    if (!xray) return;
    const NS = SVG_NS;
    const make = (tag, attrs) => {
      const n = document.createElementNS(NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      return n;
    };
    const fan = make("g", { class: "xray-fan" });
    const padsG = make("g", { class: "xray-pads" });
    const dieMin = 76, dieMax = 324, pkgMin = 52, pkgMax = 348;

    // per side: n wires from die edge out to package boundary
    const sides = [
      { axis: "y", from: dieMin, to: pkgMin, sign: -1 }, // top
      { axis: "y", from: dieMax, to: pkgMax, sign: 1 },  // bottom
      { axis: "x", from: dieMin, to: pkgMin, sign: -1 }, // left
      { axis: "x", from: dieMax, to: pkgMax, sign: 1 },  // right
    ];
    sides.forEach((side, si) => {
      const n = 10;
      for (let i = 0; i < n; i++) {
        const t = dieMin + 12 + (i * (dieMax - dieMin - 24)) / (n - 1);
        const spread = (i - (n - 1) / 2) * 1.9;
        let d, padX, padY;
        if (side.axis === "y") {
          const y0 = side.from;
          const y1 = side.from + side.sign * 62;
          d = `M${t} ${y0} C${t} ${y0 + side.sign * 16}, ${t + spread} ${y1 - side.sign * 18}, ${t + spread * 1.6} ${y1}`;
          padX = t + spread * 1.6; padY = y1;
        } else {
          const x0 = side.from;
          const x1 = side.from + side.sign * 70;
          d = `M${x0} ${t} C${x0 + side.sign * 16} ${t}, ${x1 - side.sign * 18} ${t + spread}, ${x1} ${t + spread * 1.6}`;
          padX = x1; padY = t + spread * 1.6;
        }
        fan.appendChild(make("path", { d, fill: "none" }));
        padsG.appendChild(make("circle", { cx: padX, cy: padY, r: 2.2 }));
      }
    });

    // substrate fanout stubs (short dashes heading into the package edge)
    const substrate = make("g", { class: "xray-sub" });
    for (let i = 0; i < 14; i++) {
      const y = 62 + i * 21;
      substrate.appendChild(make("path", { d: `M24 ${y} H48`, fill: "none" }));
      substrate.appendChild(make("path", { d: `M376 ${y} H352`, fill: "none" }));
    }
    for (let i = 0; i < 12; i++) {
      const x = 70 + i * 22;
      substrate.appendChild(make("path", { d: `M${x} 24 V46`, fill: "none" }));
      substrate.appendChild(make("path", { d: `M${x} 376 V354`, fill: "none" }));
    }

    xray.append(fan, padsG, substrate);
  })();

  /* ============================================================
     7. BGA-256 ball grid
     ============================================================ */
  const ballsHost = document.getElementById("chip-balls");
  if (ballsHost) {
    const frag = document.createDocumentFragment();
    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 16; col++) {
        const b = document.createElement("span");
        b.className = "ball";
        const d = Math.hypot(col - 7.5, row - 7.5);
        const isDepopulated = (row === 0 || row === 15) && (col < 2 || col > 13);
        let hot = false;
        if (!isDepopulated) {
          if (d > 2.2 && d < 6.4) hot = (row * 3 + col * 5) % 11 === 0;
          else if (d <= 2.2) hot = (row + col) % 9 === 0;
        }
        if (isDepopulated) b.classList.add("ball--off");
        else if (hot) {
          b.classList.add("ball--hot");
          b.style.setProperty("--bdur", `${rr(2.2, 4.6).toFixed(2)}s`);
          b.style.setProperty("--bdelay", `${rr(0, 3).toFixed(2)}s`);
        }
        frag.appendChild(b);
      }
    }
    ballsHost.appendChild(frag);
  }

  /* ============================================================
     7b. BGA land pattern on the board under the package
     The socket must look reflowed: 256 lands with escapes, a
     courtyard and pin-1 silk. Everything inside the body outline
     is hidden by the package, so the visible cue is the ring of
     silk, escapes and vias that spills out around it.
     ============================================================ */
  (() => {
    const host = document.getElementById("chip-footprint");
    if (!host) return;
    const make = (tag, attrs, text) => {
      const n = document.createElementNS(SVG_NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      if (text != null) n.textContent = text;
      return n;
    };
    // the element is 114% of the package; the viewBox keeps the body
    // outline exactly at 0…200 so the pads stay under the balls
    const M = 14, S = 200;
    const svg = make("svg", { viewBox: `${-M} ${-M} ${S + M * 2} ${S + M * 2}`, fill: "none", "aria-hidden": "true" });

    // ball field: 9.5% inset, 2.2% gap — mirrors .chip__balls
    const inset = S * 0.095, gapPct = 0.022;
    const field = S - inset * 2;
    const pitch = field / (16 + 15 * gapPct);
    const rLand = pitch * 0.32;
    const start = inset + pitch / 2;
    const step = pitch * (1 + gapPct);

    const gEsc = make("g", { stroke: "rgba(206,170,120,0.28)", "stroke-width": "0.55", "stroke-linecap": "round", "stroke-linejoin": "round" });
    const gLand = make("g", {});
    const gSilk = make("g", {});

    // a land under a ball is mostly hidden: keep it matte copper behind mask
    const land = (x, y, r, bright) => {
      gLand.appendChild(make("circle", { cx: x.toFixed(2), cy: y.toFixed(2), r: (r + 0.7).toFixed(2), fill: "rgba(6,10,14,0.55)" }));
      gLand.appendChild(make("circle", { cx: x.toFixed(2), cy: y.toFixed(2), r: r.toFixed(2), fill: `rgba(196,164,116,${bright})` }));
      gLand.appendChild(make("circle", { cx: (x - r * 0.22).toFixed(2), cy: (y - r * 0.28).toFixed(2), r: (r * 0.34).toFixed(2), fill: "rgba(226,206,168,0.18)" }));
    };
    const via = (x, y, rr2) => {
      gEsc.appendChild(make("circle", { cx: x.toFixed(2), cy: y.toFixed(2), r: rr2.toFixed(2), fill: "rgba(206,170,120,0.38)", stroke: "none" }));
      gEsc.appendChild(make("circle", { cx: x.toFixed(2), cy: y.toFixed(2), r: (rr2 * 0.42).toFixed(2), fill: "#05090c", stroke: "none" }));
    };

    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 16; col++) {
        const x = start + col * step;
        const y = start + row * step;
        const depopulated = (row === 0 || row === 15) && (col < 2 || col > 13);
        if (depopulated) { land(x, y, rLand * 0.5, 0.16); continue; }
        land(x, y, rLand, 0.34);

        // escape: the outer two rows fan out to vias, the rest dog-bone in place
        const dx = x - S / 2, dy = y - S / 2;
        const onEdge = Math.abs(dx) > field / 2 - pitch * 1.6 || Math.abs(dy) > field / 2 - pitch * 1.6;
        const horizontal = Math.abs(dx) >= Math.abs(dy);
        const sx = Math.sign(dx) || 1, sy = Math.sign(dy) || 1;
        if (onEdge) {
          // a short trace escaping toward the courtyard, ending in a via
          const ex = horizontal ? x + sx * pitch * 2.1 : x + sx * pitch * 0.5;
          const ey = horizontal ? y + sy * pitch * 0.5 : y + sy * pitch * 2.1;
          gEsc.appendChild(make("path", { d: `M${x.toFixed(2)} ${y.toFixed(2)}L${ex.toFixed(2)} ${ey.toFixed(2)}` }));
          via(ex, ey, 0.85);
        } else {
          const ex = x + sx * pitch * 0.62, ey = y + sy * pitch * 0.62;
          gEsc.appendChild(make("path", { d: `M${x.toFixed(2)} ${y.toFixed(2)}L${ex.toFixed(2)} ${ey.toFixed(2)}` }));
          via(ex, ey, 0.55);
        }
      }
    }

    // courtyard: the silk frame sits just outside the body, corner-broken
    const k0 = -3.6, k1 = S + 3.6, cl = 11;
    const frame = `M${k0} ${k0 + cl}V${k0}H${k0 + cl}` +
      `M${k1 - cl} ${k0}H${k1}V${k0 + cl}` +
      `M${k1} ${k1 - cl}V${k1}H${k1 - cl}` +
      `M${k0 + cl} ${k1}H${k0}V${k1 - cl}`;
    gSilk.appendChild(make("path", { d: frame, fill: "none", stroke: "rgba(240,245,250,0.46)", "stroke-width": "0.75" }));
    // body outline ghost, so the part visually "sits" in its land
    gSilk.appendChild(make("rect", {
      x: "0", y: "0", width: S, height: S, rx: "2.2",
      fill: "none", stroke: "rgba(240,245,250,0.22)", "stroke-width": "0.55",
    }));
    // pin-1 triangle at the corner of the courtyard
    gSilk.appendChild(make("path", {
      d: `M${k0 + 0.6} ${k0 - 3.2}L${k0 + 3.4} ${k0 - 3.2}L${k0 + 0.6} ${k0 - 0.4}`,
      fill: "rgba(240,245,250,0.45)", stroke: "none",
    }));
    gSilk.appendChild(make("text", { x: (k1).toFixed(2), y: (k0 - 2).toFixed(2), class: "fp-silk", "text-anchor": "end" }, "U1"));
    gSilk.appendChild(make("text", { x: (k0).toFixed(2), y: (k1 + 6.2).toFixed(2), class: "fp-silk", "text-anchor": "start" }, "U1 · SOCKET"));
    gSilk.appendChild(make("text", { x: (k1).toFixed(2), y: (k1 + 6.2).toFixed(2), class: "fp-silk fp-silk--warm", "text-anchor": "end" }, "KEEP-OUT 0.35"));

    // a faint mask wash unifies the pattern with the laminate
    const wash = make("rect", {
      x: (-M).toFixed(2), y: (-M).toFixed(2),
      width: (S + M * 2).toFixed(2), height: (S + M * 2).toFixed(2),
      fill: "rgba(10,16,22,0.22)",
    });
    svg.append(gEsc, gLand, wash, gSilk);
    host.appendChild(svg);
  })();

  /* ============================================================
     8. interaction
     ============================================================ */
  const chip = document.getElementById("chip");
  const stage = document.getElementById("stage");

  let suppressClick = false;
  if (chip) {
    let pinned = false;
    const paint = () => {
      chip.classList.toggle("is-xray", pinned || chip.matches(":hover"));
      chip.setAttribute("aria-pressed", String(pinned));
    };
    chip.addEventListener("click", () => {
      if (suppressClick) { suppressClick = false; return; }
      pinned = !pinned;
      paint();
    });
    chip.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        pinned = !pinned;
        paint();
      }
      if (e.key === "Escape" && pinned) {
        pinned = false;
        paint();
      }
    });
    chip.addEventListener("pointerenter", () => chip.classList.add("is-xray"));
    chip.addEventListener("pointerleave", () => {
      if (!pinned) chip.classList.remove("is-xray");
    });
    chip.addEventListener("focus", () => chip.classList.add("is-xray"));
    chip.addEventListener("blur", () => {
      if (!pinned) chip.classList.remove("is-xray");
    });
  }

  /* ============================================================
     8b. BGA package — drag to spin, physical shading follows the tilt
     ============================================================ */
  if (chip && !reduced) {
    const float = document.getElementById("chip-float");
    const body = document.getElementById("chip-body");
    const shadow = chip.querySelector(".chip__shadow");
    const ballEls = Array.from(chip.querySelectorAll(".ball"));
    const chipEl = chip;

    // resting pose: slightly tipped so the package reads as a solid object
    const HOME = { x: 17, y: -14 };
    let rotX = HOME.x, rotY = HOME.y;
    let velX = 0, velY = 0;
    let dragging = false;
    let lastX = 0, lastY = 0, frameT = 0;
    let raf = 0;
    let touched = false;
    let dragMoved = 0;
    let dragT = 0;

    // a flip needs the full range: the package must be able to turn over
    const clampPitch = (v) => Math.max(-180, Math.min(180, v));
    const yawLimit = 62;

    const paintBalls = () => {
      // light comes from the upper-left of the *screen*, so the highlight
      // must not travel with the package when it rotates
      const rad = (rotY * Math.PI) / 180;
      const pitch = (rotX * Math.PI) / 180;
      // approximate the light vector in the package's local frame
      const lx = -0.55, ly = -0.5;
      const cosA = Math.cos(rad), sinA = Math.sin(rad);
      let px = lx * cosA + ly * sinA;          // rotate into local space
      let py = -lx * sinA + ly * cosA;
      const cosP = Math.cos(pitch);
      py = py * cosP + 0.16;                    // flatten the highlight on tilt
      const sx = 50 + px * 30;
      const sy = 50 + py * 30;
      const spread = Math.min(1, Math.abs(Math.sin(pitch)) + 0.3);
      for (let i = 0; i < ballEls.length; i++) {
        const b = ballEls[i];
        b.style.setProperty("--lx", sx.toFixed(1) + "%");
        b.style.setProperty("--ly", sy.toFixed(1) + "%");
        b.style.setProperty("--bx", (px * 2.4 * spread).toFixed(2) + "px");
        b.style.setProperty("--by", (py * 2.4 * spread + 1).toFixed(2) + "px");
        b.style.setProperty("--bd", (spread * 2.2).toFixed(2) + "px");
        // spheres catch a little more light the flatter we look at them
        b.style.setProperty("--ball-xf", `scale(${(1 + Math.abs(Math.sin(pitch)) * 0.02).toFixed(3)})`);
      }
    };

    const paint = () => {
      if (float) float.style.transform =
        `perspective(1400px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
      if (shadow) {
        // the shadow slides opposite the tilt and softens as the part lifts
        const pitch = (rotX * Math.PI) / 180;
        const yaw = (rotY * Math.PI) / 180;
        const off = Math.sin(pitch) * 16;
        const sc = 1 + Math.abs(Math.sin(pitch)) * 0.16;
        shadow.style.transform =
          `translate(${(Math.sin(yaw) * -10).toFixed(1)}px, ${off.toFixed(1)}px) scale(${sc.toFixed(2)})`;
        shadow.style.opacity = (0.9 - Math.abs(Math.sin(pitch)) * 0.25).toFixed(2);
      }
      paintBalls();
    };

    /* ---------- idle auto-rotation ----------
       The package turns slowly on its own so the 3D form is obvious without
       any interaction. Hovering pauses it; dragging takes over; after the
       pointer leaves it eases back into the automatic turn.               */
    const AUTO = { yaw: 7.5, pitch: 4.2 };   // degrees / second
    let autoOn = true;
    let autoBlend = 1;                        // 0 = manual, 1 = full auto
    frameT = performance.now();

    const tick = (now) => {
      raf = 0;
      const t = now || performance.now();
      const dt = Math.min(48, Math.max(8, t - frameT));
      frameT = t;
      const k = dt / 1000;

      if (dragging) {
        paint();
        raf = requestAnimationFrame(tick);
        return;
      }

      // blend factor eases in/out so switching between modes never jumps
      const target = autoOn ? 1 : 0;
      autoBlend += (target - autoBlend) * Math.min(1, k * 3.2);

      // manual inertia (from a flick) decays quickly
      rotY += velY;
      rotX = clampPitch(rotX + velX);
      velY *= 0.94;
      velX *= 0.94;
      if (Math.abs(velY) < 0.02) velY = 0;
      if (Math.abs(velX) < 0.02) velX = 0;

      // automatic turn: it rolls the package over so the lid shows, then
      // carries on to the ball side. A one-way 360° would snap at the seam,
      // so the pitch is driven as a smooth triangle wave in [-180, 0].
      if (autoBlend > 0.002) {
        // s eases 0 → 1 → 0 with zero velocity at the ends, so the flip
        // lands exactly on the resting tilt and on a full 180° face-up pose
        const s01 = (1 - Math.cos(t / 9000)) / 2;
        const pitch = HOME.x + (180 - HOME.x) * s01;
        const swing = Math.sin(t / 5200) * 9;
        rotY += (HOME.y + swing - rotY) * Math.min(1, k * 1.0 * autoBlend);
        rotX += (pitch - rotX) * Math.min(1, k * 1.6 * autoBlend);
        chip.classList.add("is-spinning");
      } else {
        // settle to the resting pose when the automatic turn is off
        rotX += (HOME.x - rotX) * 0.06;
        rotY += (HOME.y - rotY) * 0.06;
        if (Math.abs(HOME.x - rotX) < 0.12 && Math.abs(HOME.y - rotY) < 0.12) {
          rotX = HOME.x; rotY = HOME.y;
          chip.classList.remove("is-spinning");
          paint();
          return;
        }
      }

      paint();
      raf = requestAnimationFrame(tick);
    };

    const kick = () => { if (!raf) { frameT = performance.now(); raf = requestAnimationFrame(tick); } };

    // pause the automatic turn while the user looks at / touches the package
    chip.addEventListener("pointerenter", () => { autoOn = false; kick(); });
    chip.addEventListener("pointerleave", () => { autoOn = true; kick(); });

    chip.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      dragging = true;
      touched = true;
      dragMoved = 0;
      autoOn = false;
      autoBlend = 0;
      lastX = e.clientX; lastY = e.clientY;
      dragT = performance.now();
      velX = 0; velY = 0;
      chip.classList.add("is-dragging");
      chip.setPointerCapture?.(e.pointerId);
      kick();
      e.preventDefault();
    });

    chip.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const now = performance.now();
      const dt = Math.max(8, now - dragT);
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY; dragT = now;
      dragMoved += Math.abs(dx) + Math.abs(dy);
      rotY = Math.max(HOME.y - 80, Math.min(HOME.y + 80, rotY + dx * 0.5));
      rotX = clampPitch(rotX - dy * 0.5);
      velY = (dx * 0.55) * (16 / dt);
      velX = (-dy * 0.45) * (16 / dt);
      paint();
    });

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      // a real drag must not toggle the x-ray pin
      if (dragMoved > 6) suppressClick = true;
      chip.classList.remove("is-dragging");
      // resume the automatic turn unless the pointer is still over the part
      autoOn = !chip.matches(":hover");
      kick();
    };
    chip.addEventListener("pointerup", endDrag);
    chip.addEventListener("pointercancel", endDrag);
    chip.addEventListener("pointerleave", endDrag);

    // keyboard: arrow keys give a deliberate turn
    chip.addEventListener("keydown", (e) => {
      const step = 6;
      if (e.key === "ArrowLeft") { rotY -= step; paint(); e.preventDefault(); }
      if (e.key === "ArrowRight") { rotY += step; paint(); e.preventDefault(); }
      if (e.key === "ArrowUp") { rotX = clampPitch(rotX - step); paint(); e.preventDefault(); }
      if (e.key === "ArrowDown") { rotX = clampPitch(rotX + step); paint(); e.preventDefault(); }
    });

    // subtle parallax while the pointer crosses the stage (desktop only)
    if (finePointer && stage) {
      let praf = 0, tx = 0, ty = 0;
      stage.addEventListener("pointermove", (e) => {
        if (dragging) return;
        const r = stage.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
        if (praf) return;
        praf = requestAnimationFrame(() => {
          praf = 0;
          svg.style.transform = `translate3d(${(tx * -10).toFixed(1)}px, ${(ty * -7).toFixed(1)}px, 0) scale(1.02)`;
          const glow = chip.querySelector(".chip__glow");
          if (glow) glow.style.background =
            `radial-gradient(circle at ${50 + tx * 12}% ${50 + ty * 12}%, rgba(94,240,184,.26) 0%, rgba(94,240,184,.08) 30%, transparent 62%)`;
        });
      });
      stage.addEventListener("pointerleave", () => {
        svg.style.transform = "";
      });
    }

    paint();
    kick();
    chip.__resetTilt = () => { rotX = HOME.x; rotY = HOME.y; velX = velY = 0; paint(); };
  }

  /* mobile menu */
  const burger = document.querySelector(".burger");
  const menu = document.getElementById("mobile-menu");
  if (burger && menu) {
    burger.addEventListener("click", () => {
      const open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      burger.setAttribute("aria-label", open ? "Открыть меню" : "Закрыть меню");
      menu.hidden = open;
    });
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        burger.setAttribute("aria-expanded", "false");
        burger.setAttribute("aria-label", "Открыть меню");
        menu.hidden = true;
      }
    });
  }

  /* "/" focuses the netlist search */
  const search = document.getElementById("netlist-search");
  if (search) {
    document.addEventListener("keydown", (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        search.focus();
        search.select();
      }
    });
  }

  /* live throughput readout */
  const pps = document.getElementById("pps");
  if (pps && !reduced) {
    let value = 1024318;
    const fmt = (n) => n.toLocaleString("ru-RU").replace(/\u00A0/g, " ");
    const tick = () => {
      value += Math.round(rr(480, 5400));
      pps.textContent = `${fmt(value)} pps`;
      window.setTimeout(tick, rr(900, 2200));
    };
    tick();
  }
})();
