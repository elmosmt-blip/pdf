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
    const f = svgEl("filter", { id: "partShadow", x: "-60%", y: "-60%", width: "230%", height: "230%" });
    f.appendChild(svgEl("feGaussianBlur", { stdDeviation: "2.1" }));
    defs.appendChild(f);

    const lin = (id, stops, v) => {
      const gd = svgEl("linearGradient", v
        ? { id, x1: "0", y1: "0", x2: "0", y2: "1" }
        : { id, x1: "0", y1: "0", x2: "1", y2: "0" });
      stops.forEach(([o, c]) => gd.appendChild(svgEl("stop", { offset: o, "stop-color": c })));
      defs.appendChild(gd);
    };
    // solder-plated termination: bright crest → dark heel
    lin("metalGrad", [["0", "#fbfdfe"], ["0.2", "#e2e8ec"], ["0.52", "#aab5be"], ["0.78", "#727d87"], ["1", "#3d474f"]]);
    // dark moulded epoxy body
    lin("bodyDarkGrad", [["0", "#3d4a56"], ["0.4", "#29333d"], ["1", "#121a21"]]);
    // tan ceramic chip
    lin("bodyWarmGrad", [["0", "#cbb28d"], ["0.45", "#ab916e"], ["1", "#6a5842"]]);
    // yellow tantalum moulding
    lin("bodyTanGrad", [["0", "#dfae45"], ["0.4", "#c08a2e"], ["1", "#7a5514"]]);
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

  /* soft contact shadow, thrown away from the light */
  const dropShadow = (g, w, h, rx, rot, spread = 2.6) => {
    const L = localLight(rot);
    g.appendChild(svgEl("rect", {
      x: -w / 2 - L.x * -spread,
      y: -h / 2 - L.y * -spread,
      width: w, height: h, rx,
      fill: "rgba(0,0,0,0.62)",
      filter: "url(#partShadow)",
      "pointer-events": "none",
    }));
  };

  /* extruded box: darker side walls facing away from the light + lit top face */
  const block3D = (g, x0, y0, w, h, rx, depth, fillTop, fillSide, L, opts = {}) => {
    const steps = Math.max(2, Math.round(depth / 0.45));
    for (let i = steps; i >= 1; i--) {
      const t = (i / steps) * depth;
      g.appendChild(svgEl("rect", {
        x: x0 + -L.x * t, y: y0 + -L.y * t,
        width: w, height: h, rx,
        fill: fillSide,
        opacity: opts.sideOpacity ?? 0.95,
      }));
    }
    g.appendChild(svgEl("rect", { x: x0, y: y0, width: w, height: h, rx, fill: fillTop }));
    if (opts.shine !== false) {
      // lit rim along the upper-left edge
      g.appendChild(svgEl("rect", {
        x: x0 + 0.4, y: y0 + 0.4,
        width: w - 0.8, height: Math.min(1.15, h * 0.24),
        rx: Math.max(0.3, rx * 0.6),
        fill: "rgba(255,255,255,0.32)",
      }));
      // occluded rim along the lower-right edge
      g.appendChild(svgEl("rect", {
        x: x0 + 0.35, y: y0 + h - Math.min(1.25, h * 0.26) - 0.35,
        width: w - 0.7, height: Math.min(1.25, h * 0.26),
        rx: Math.max(0.3, rx * 0.5),
        fill: "rgba(0,0,0,0.42)",
      }));
    }
  };

  /* tinned termination: metal block + solder fillet rising to the pad */
  const termination = (g, x0, y0, w, h, rot, L, opts = {}) => {
    // NOTE: x0/y0/w/h are in the *already rotated* parent space, so the block
    // geometry is emitted unrotated while the light comes in parent-local too.
    block3D(g, x0, y0, w, h, Math.min(0.8, Math.min(w, h) * 0.26), 1.2,
      opts.top || "url(#metalGrad)", opts.side || "#4b555e", L, { shine: false });
    // specular crest (a thin, slightly inset highlight — not a full white bar)
    g.appendChild(svgEl("rect", {
      x: x0 + w * 0.16, y: y0 + h * 0.12,
      width: Math.max(0.6, w * 0.32), height: Math.max(0.6, h * 0.74),
      rx: Math.min(0.55, w * 0.2), fill: "rgba(255,255,255,0.5)",
    }));
    // dark heel toward the board shadow side
    g.appendChild(svgEl("rect", {
      x: x0 + w * 0.62, y: y0 + 0.3,
      width: Math.max(0.5, w * 0.3), height: Math.max(0.5, h - 0.6),
      rx: 0.3, fill: "rgba(24,32,38,0.4)",
    }));
  };

  /* --- passives: 0402 / 0603 / 0805 with real bodies -------------- */
  const smdBody = (x, y, w, h, rot = 0, opts = {}) => {
    const g = svgEl("g", { transform: `translate(${x} ${y}) rotate(${rot})` });
    const termW = Math.max(1.7, w * 0.19);
    const L = localLight(rot);
    const depth = Math.max(1.4, h * 0.24);

    dropShadow(g, w + termW * 2, h, 0.9, rot);

    // body sits between the terminations
    block3D(g, -w / 2, -h / 2, w, h, 0.55, depth,
      opts.warm ? "url(#bodyWarmGrad)" : "url(#bodyDarkGrad)",
      opts.warm ? "#5d4c3a" : "#111820", L);

    // ceramic dielectric sheen for MLCC (warm) — faint banding
    if (opts.warm) {
      g.appendChild(svgEl("rect", {
        x: -w / 2 + 1, y: -h / 2 + 1, width: w - 2, height: Math.max(0.7, h * 0.26),
        rx: 0.3, fill: "rgba(255,255,255,0.2)",
      }));
    }

    // solder lands just outside the metal, wetted up the termination flank
    [-1, 1].forEach((side) => {
      const x0 = side < 0 ? -w / 2 - termW - 1.5 : w / 2 + termW - 0.8;
      g.appendChild(svgEl("rect", {
        x: x0, y: -h / 2 - 0.35, width: 1.5, height: h + 0.7, rx: 0.6,
        fill: "rgba(212,182,126,0.3)",
      }));
    });

    // terminations wrap the ends
    termination(g, -w / 2 - termW, -h / 2, termW, h, rot, L);
    termination(g, w / 2, -h / 2, termW, h, rot, L);

    // laser marking on resistors (3-digit code) when there is room
    if (!opts.warm && w >= 11) {
      const t = svgEl("text", {
        x: 0, y: 0.85, "text-anchor": "middle",
        fill: "rgba(226,232,240,0.42)",
        "font-family": "var(--font-mono)", "font-size": Math.min(3.1, h * 0.42),
        "letter-spacing": "0.08em",
      });
      t.textContent = "103";
      g.appendChild(t);
    }
    gParts.appendChild(g);
    return g;
  };

  const smd = (x, y, rot, name, opts = {}) => {
    const w = opts.w || 18;
    const h = opts.h || 9;
    smdBody(x, y, w, h, rot, opts);
    const local = rot ? { x: -h / 2 - 2.5, y: 0 } : { x: 0, y: -h / 2 - 4 };
    const rad = (rot * Math.PI) / 180;
    const lx = x + local.x * Math.cos(rad) - local.y * Math.sin(rad);
    const ly = y + local.x * Math.sin(rad) + local.y * Math.cos(rad);
    if (name) label(lx, ly + 2.4, name, "silk", "middle");
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
    block3D(g, -half, -half, size, size, 1.8, 3.2, "url(#bodyDarkGrad)", "#0c1319", L);

    // 4) leads only as far as the body edge — small metal fingers
    const finger = 2.2;
    for (let i = 0; i < leads; i++) {
      const t = -half + i * step;
      [-1, 1].forEach((side) => {
        const y0 = side < 0 ? -half - finger : half;
        block3D(g, t - 1.3, y0, 2.6, finger, 0.35, 0.9, "#a9b4be", "#4f5962", L, { shine: false });
        g.appendChild(svgEl("rect", { x: t - 0.95, y: side < 0 ? y0 + 0.3 : y0 + 0.3, width: 1.9, height: Math.max(0.5, finger * 0.42), rx: 0.25, fill: "rgba(255,255,255,0.42)" }));
      });
      [-1, 1].forEach((side) => {
        const x0 = side < 0 ? -half - finger : half;
        block3D(g, x0, t - 1.3, finger, 2.6, 0.35, 0.9, "#a9b4be", "#4f5962", L, { shine: false });
        g.appendChild(svgEl("rect", { x: x0 + 0.3, y: t - 0.95, width: Math.max(0.5, finger * 0.42), height: 1.9, rx: 0.25, fill: "rgba(255,255,255,0.42)" }));
      });
    }

    // 5) top face detail: brushed sheen, thermal pad recess, solder fillet
    g.appendChild(svgEl("rect", {
      x: -half + 1.4, y: -half + 1.4, width: size - 2.8, height: size * 0.26,
      rx: 1.1, fill: "rgba(255,255,255,0.055)",
    }));
    g.appendChild(svgEl("rect", {
      x: -tp / 2, y: -tp / 2, width: tp, height: tp, rx: 1,
      fill: "#2c353d", stroke: "rgba(0,0,0,0.55)", "stroke-width": "0.6",
    }));
    g.appendChild(svgEl("rect", {
      x: -tp / 2 + 0.7, y: -tp / 2 + 0.7, width: tp - 1.4, height: tp - 1.4, rx: 0.7,
      fill: "none", stroke: "rgba(255,255,255,0.14)", "stroke-width": "0.55",
    }));
    g.appendChild(svgEl("rect", {
      x: -tp / 2 - 0.8, y: -tp / 2 - 0.8, width: tp + 1.6, height: tp + 1.6, rx: 1.4,
      fill: "none", stroke: "rgba(228,238,246,0.26)", "stroke-width": "0.85",
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
    label(x - half + 1, y - half - 6.6, name, "silk", "start");
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

    // gull-wing leads: arm out of the body, then a foot curling down to the pad
    for (let i = 0; i < perSide; i++) {
      const t = -w / 2 + (i + 0.5) * pitch;
      [-1, 1].forEach((side) => {
        // ENIG land under the foot
        g.appendChild(svgEl("rect", {
          x: t - 1.9, y: side < 0 ? -h / 2 - 5.4 : h / 2 + 2.2,
          width: 3.8, height: 3.2, rx: 0.5, fill: "rgba(226,196,142,0.4)",
        }));
        // shadow the lead casts on the board
        g.appendChild(svgEl("rect", {
          x: t - 1.55, y: side < 0 ? -h / 2 - 5.0 : h / 2 + 3.6,
          width: 3.1, height: 1.0, rx: 0.3, fill: "rgba(0,0,0,0.55)",
        }));
        // lead silhouette in one path: shoulder, knee, toe
        const s1 = side < 0 ? -1 : 1;
        const base = s1 < 0 ? -h / 2 : h / 2;
        const d = s1 < 0
          ? `M${t - 1.45} ${base} L${t - 1.45} ${base - 2.4} Q${t - 1.45} ${base - 3.5} ${t - 0.55} ${base - 3.5}
             L${t + 0.55} ${base - 3.5} Q${t + 1.45} ${base - 3.5} ${t + 1.45} ${base - 2.4} L${t + 1.45} ${base} Z`
          : `M${t - 1.45} ${base} L${t - 1.45} ${base + 2.4} Q${t - 1.45} ${base + 3.5} ${t - 0.55} ${base + 3.5}
             L${t + 0.55} ${base + 3.5} Q${t + 1.45} ${base + 3.5} ${t + 1.45} ${base + 2.4} L${t + 1.45} ${base} Z`;
        g.appendChild(svgEl("path", { d, fill: "#8f9aa4" }));
        // lit crest along the outer flank
        g.appendChild(svgEl("rect", {
          x: t - 1.45, y: s1 < 0 ? base - 3.4 : base + 1.4,
          width: 2.9, height: 1.9, rx: 0.6, fill: "rgba(255,255,255,0.45)",
        }));
        // dark contact line where the foot meets the pad
        g.appendChild(svgEl("rect", {
          x: t - 1.45, y: s1 < 0 ? base - 3.5 : base + 3.05,
          width: 2.9, height: 0.55, fill: "rgba(20,26,32,0.55)",
        }));
      });
    }

    // body
    block3D(g, -w / 2, -h / 2, w, h, 1.5, 3.0, "url(#bodyDarkGrad)", "#0d141a", L);
    // top-face sheen
    g.appendChild(svgEl("rect", {
      x: -w / 2 + 1.2, y: -h / 2 + 1.2, width: w - 2.4, height: Math.max(1.2, h * 0.3),
      rx: 1, fill: "rgba(255,255,255,0.05)",
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
    label(x, y - h / 2 - 6.6, name, "silk", "middle");
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
  qfn(168, 240, 62, "U2 · QFN‑48");
  const lResistors = [];
  for (let i = 0; i < 6; i++) {
    const col = i % 2;
    const y = 344 + Math.floor(i / 2) * 62;
    smd(96 + col * 46, y, 90, `R${12 + i}`, { w: 30, h: 12 });
    lResistors.push(y);
  }
  label(126, 316, "R12–R17 · 0603", "silk--warm", "start");

  const cBankY = 566;
  for (let i = 0; i < 5; i++) {
    smd(252 + i * 28, cBankY, 0, null, { w: 17, h: 9, warm: true });
  }
  label(252, cBankY + 24, "C31–C35 · 100 nF", "silk", "start");

  soic(344, 152, 66, 26, 8, "U3 · NOR‑FLASH");
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
  qfn(1258, 218, 62, "U4 · QFN‑48");
  for (let i = 0; i < 6; i++) {
    const col = i % 2;
    const y = 344 + Math.floor(i / 2) * 62;
    smd(1344 - col * 46, y, 90, `R${21 + i}`, { w: 30, h: 12 });
  }
  label(1318, 316, "R21–R26 · 0603", "silk--warm", "end");

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
    smd(x, y, i % 3 === 0 ? 90 : 0, null, { w: 20, h: 9, warm: i % 2 === 0 });
  });

  /* --- extra realism: SOIC with pin-1 and legend, tantalums, micro silk --- */
  (() => {
    // second SOIC (op-amp) upper-left quadrant
    label(250, 222, "U5 · OPA", "silk");
    // tiny 0402 passives hugging a QFN, like real decoupling
    for (let i = 0; i < 4; i++) {
      smdBody(126 + (i % 2) * 26, 292 + Math.floor(i / 2) * 20, 15, 8, i % 2 ? 90 : 0, { warm: i % 2 === 0 });
    }
    // tantalum caps: chamfered body + polarity bar
    const tantalum = (x, y, rot) => {
      const g = svgEl("g", { transform: `translate(${x} ${y}) rotate(${rot})` });
      const L = localLight(rot);
      dropShadow(g, 38, 22, 2.5, rot, 2.2);
      // solder terminations
      termination(g, -19, -10, 4.6, 20, rot, L, { top: "#9fabb5", side: "#4d5760" });
      termination(g, 14.4, -10, 4.6, 20, rot, L, { top: "#9fabb5", side: "#4d5760" });
      // moulded body: higher than a ceramic chip, rounded shoulders
      block3D(g, -15, -10, 30, 20, 3.4, 4.6, "url(#bodyTanGrad)", "#6d4a13", L);
      // top face lighting
      g.appendChild(svgEl("rect", { x: -13.4, y: -8.8, width: 26.8, height: 5.2, rx: 2, fill: "rgba(255,255,255,0.26)" }));
      g.appendChild(svgEl("rect", { x: -13.4, y: 3.2, width: 26.8, height: 4.4, rx: 1.8, fill: "rgba(0,0,0,0.18)" }));
      // polarity band
      g.appendChild(svgEl("rect", { x: 6, y: -9.4, width: 7.4, height: 18.8, rx: 1.6, fill: "rgba(52,32,6,0.6)" }));
      g.appendChild(svgEl("path", { d: "M7.8 -2.4h4M9.8 -4.4v4", stroke: "rgba(255,255,255,0.55)", "stroke-width": "0.9" }));
      gParts.appendChild(g);
    };
    tantalum(424, 566, 0);
    tantalum(472, 566, 0);
    label(448, 592, "C41 · C42 · 10 µF", "silk");
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
      smdBody(x, y, 16, 8, tangent, { warm: i % 3 === 0 });
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
     8. interaction
     ============================================================ */
  const chip = document.getElementById("chip");
  const stage = document.getElementById("stage");

  if (chip) {
    let pinned = false;
    const paint = () => {
      chip.classList.toggle("is-xray", pinned || chip.matches(":hover"));
      chip.setAttribute("aria-pressed", String(pinned));
    };
    chip.addEventListener("click", () => {
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

  if (finePointer && !reduced && chip && stage) {
    let raf = 0;
    let tx = 0, ty = 0;
    const float = document.getElementById("chip-float");
    stage.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (float) {
          float.style.transform = `rotateX(${(-ty * 7).toFixed(2)}deg) rotateY(${(tx * 9).toFixed(2)}deg)`;
        }
        svg.style.transform = `translate3d(${(tx * -10).toFixed(1)}px, ${(ty * -7).toFixed(1)}px, 0) scale(1.02)`;
        const glow = chip.querySelector(".chip__glow");
        if (glow) glow.style.background =
          `radial-gradient(circle at ${50 + tx * 12}% ${50 + ty * 12}%, rgba(94,240,184,.26) 0%, rgba(94,240,184,.08) 30%, transparent 62%)`;
      });
    });
    stage.addEventListener("pointerleave", () => {
      if (float) float.style.transform = "";
      svg.style.transform = "";
    });
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
