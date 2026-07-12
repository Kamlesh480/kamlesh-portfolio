/* ============================================================
   CHARCOAL ENGINE
   A tiny canvas brush that builds marks the way charcoal does:
   thousands of grainy, semi-transparent stamps layered until
   darkness emerges. Everything here is monochrome graphite on
   warm paper — no pure black, no digital edges.
   ============================================================ */

(function () {
  "use strict";

  /* --- seeded RNG so the figure is identical across reloads/resizes --- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* warm charcoal tones — never #000 */
  const TONE = {
    deep:  [22, 20, 17],
    dark:  [38, 35, 30],
    mid:   [70, 66, 59],
    soft:  [120, 114, 104],
    paper: [232, 228, 219],
    light: [244, 241, 234],
  };

  /* Build a soft, grainy circular brush as an alpha mask.
     hardness 0 = feathered smudge, 1 = crisp dry line. */
  function makeBrushMask(size, rng, hardness) {
    hardness = hardness || 0;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const x = c.getContext("2d");
    const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    if (hardness >= 1) {
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(0.62, "rgba(0,0,0,0.92)");
      g.addColorStop(0.9, "rgba(0,0,0,0.35)");
      g.addColorStop(1, "rgba(0,0,0,0)");
    } else if (hardness >= 0.5) {
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(0.5, "rgba(0,0,0,0.8)");
      g.addColorStop(0.85, "rgba(0,0,0,0.28)");
      g.addColorStop(1, "rgba(0,0,0,0)");
    } else {
      g.addColorStop(0, "rgba(0,0,0,0.95)");
      g.addColorStop(0.45, "rgba(0,0,0,0.55)");
      g.addColorStop(1, "rgba(0,0,0,0)");
    }
    x.fillStyle = g;
    x.fillRect(0, 0, size, size);
    // poke grain "tooth" into the dab so it never looks like a smooth blob
    x.globalCompositeOperation = "destination-out";
    const n = Math.floor(size * size * (hardness >= 1 ? 0.16 : hardness >= 0.5 ? 0.18 : 0.22));
    for (let i = 0; i < n; i++) {
      const px = rng() * size, py = rng() * size;
      const r = rng() * 1.5;
      x.globalAlpha = rng() * 0.55;
      x.beginPath();
      x.arc(px, py, r, 0, 7);
      x.fill();
    }
    return c;
  }

  /* Tint an alpha mask into a colored brush once, reuse forever. */
  function tintBrush(mask, rgb) {
    const c = document.createElement("canvas");
    c.width = mask.width; c.height = mask.height;
    const x = c.getContext("2d");
    x.fillStyle = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
    x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = "destination-in";
    x.drawImage(mask, 0, 0);
    return c;
  }

  /* ---- A "stamp" is one dab; a "stroke" is an ordered run of dabs ---- */

  function makeStrokeDabs(opts, rng) {
    // opts: x0,y0 (start, normalized 0..1), angle, length, width, tone, alpha, curve
    const dabs = [];
    const steps = Math.max(2, Math.floor(opts.length / (opts.spacing || 0.004)));
    const curve = opts.curve || 0;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const a = opts.angle + Math.sin(t * Math.PI) * curve;
      const dist = opts.length * t;
      const x = opts.x0 + Math.cos(a) * dist + (rng() - 0.5) * opts.width * 0.4;
      const y = opts.y0 + Math.sin(a) * dist + (rng() - 0.5) * opts.width * 0.4;
      // taper alpha & size at the ends of the stroke (dry charcoal lift-off)
      const taper = Math.sin(t * Math.PI) * 0.7 + 0.3;
      dabs.push({
        x: x, y: y,
        size: opts.width * (0.7 + rng() * 0.6),
        alpha: opts.alpha * taper * (0.65 + rng() * 0.5),
        tone: opts.tone,
        b: opts.b || (opts.hard ? "hard" : "soft"),
        rot: rng() * Math.PI,
      });
    }
    return dabs;
  }

  /* ============================================================
     FIGURE — an abstract charcoal bust built from a density field
     (head + neck + shoulders metaballs). Strokes are sampled where
     the field is dark; light is carved back in with paper-toned
     marks and a few eraser scrapes.
     ============================================================ */

  function buildFigure(rng) {
    // ---- explicit BUST silhouette: round head, thin neck, wide flat
    //      shoulders, cropped like a portrait. half-width as a function
    //      of height reads far more like a figure than blobby metaballs. ----
    function hw(y) {
      if (y < 0.055 || y > 0.85) return 0;
      if (y <= 0.34) {                    // head (ellipse)
        const cy = 0.20, ry = 0.165, rx = 0.128;
        const u = (y - cy) / ry;
        if (Math.abs(u) >= 1) return 0.05;
        return Math.max(0.058, rx * Math.sqrt(1 - u * u));
      }
      if (y <= 0.46) return 0.066;        // neck
      if (y <= 0.63) return 0.066 + (0.405 - 0.066) * ((y - 0.46) / 0.17); // flare
      if (y <= 0.80) return 0.405 + (y - 0.63) * 0.18;                     // shoulders
      const k = (0.85 - y) / 0.05;        // crop taper
      return 0.44 * Math.max(0, k);
    }
    function inside(x, y) { return Math.abs(x - 0.5) <= hw(y); }
    function ss(a, b, x) { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); }
    // 0 (light) .. 1 (near-black). Mostly-dark mass with light carved only
    // along the right edge (the lit side), like the reference.
    function darkness(x, y) {
      const w = hw(y); if (w <= 0) return 0;
      const t = (x - 0.5) / w;            // -1 left .. +1 right
      let d;
      if (y < 0.36) d = 1.0 - 0.55 * ss(0.10, 1.0, t);  // head
      else d = 1.0 - 0.92 * ss(0.25, 1.05, t);          // body
      d *= 1 - Math.pow(Math.max(0, -t), 4) * 0.22;      // soft rim on shadow edge
      if (y > 0.78) d *= (0.85 - y) / 0.07;              // fade the cropped base
      return Math.max(0, Math.min(1, d));
    }
    function flow(x, y) {
      if (y < 0.36) return null;          // head — scribbled, multidirectional
      if (y < 0.50) return Math.PI / 2;   // neck — vertical
      return 0;                            // shoulders — horizontal
    }
    function angleAt(x, y, jitter) {
      const f = flow(x, y);
      if (f === null) return rng() * Math.PI * 2;
      return f + (rng() - 0.5) * jitter;
    }

    const strokes = [];
    function push(opts) { strokes.push({ dabs: makeStrokeDabs(opts, rng) }); }
    function pushDab(x, y, size, alpha, tone, b) {
      strokes.push({ dabs: [{ x: x, y: y, size: size, alpha: alpha, tone: tone, b: b || "soft", rot: rng() * Math.PI }] });
    }
    function sampleInside(minD) {
      for (let tries = 0; tries < 40; tries++) {
        const x = 0.10 + rng() * 0.80;
        const y = 0.05 + rng() * 0.80;
        if (!inside(x, y)) continue;
        const d = darkness(x, y);
        if (d > minD && rng() < d + 0.15) return { x, y, d };
      }
      return null;
    }

    // 0. smooth mass — heavy layered SOFT dabs (no hard edge) blend into a
    //    continuous tonal smear; many layers drive the shadow side dark
    for (let i = 0; i < 5200; i++) {
      const x = 0.10 + rng() * 0.80, y = 0.05 + rng() * 0.80;
      if (!inside(x, y)) continue;
      const d = darkness(x, y);
      if (d < 0.10 || rng() > d + 0.16) continue;
      const tone = d > 0.5 ? "dark" : "mid";
      pushDab(x, y, 0.018 + rng() * 0.022, 0.06 + d * 0.14, tone, "soft");
    }
    // 0b. deep core — soft layers that take head + left/spine to near-black
    for (let i = 0; i < 2600; i++) {
      const p = sampleInside(0.5); if (!p) continue;
      pushDab(p.x, p.y, 0.014 + rng() * 0.02, 0.08 + p.d * 0.15, "deep", "soft");
    }
    // 0c. tooth — fine MED grain on top for charcoal texture
    for (let i = 0; i < 4200; i++) {
      const x = 0.10 + rng() * 0.80, y = 0.05 + rng() * 0.80;
      if (!inside(x, y)) continue;
      const d = darkness(x, y);
      if (d < 0.12 || rng() > d + 0.05) continue;
      const tone = d > 0.55 ? "deep" : d > 0.34 ? "dark" : "mid";
      pushDab(x, y, 0.004 + rng() * 0.006, 0.06 + d * 0.10, tone, "med");
    }
    // 1. head — dense soft layers + grain for a heavy, near-black head
    for (let i = 0; i < 1400; i++) {
      const a = rng() * Math.PI * 2;
      const r = Math.pow(rng(), 0.6);
      const x = 0.50 + Math.cos(a) * r * 0.118;
      const y = 0.205 + Math.sin(a) * r * 0.150;
      const small = rng() < 0.5;
      pushDab(x, y, small ? 0.005 + rng() * 0.008 : 0.016 + rng() * 0.016,
              0.06 + (1 - r) * 0.12, "deep", small ? "med" : "soft");
    }
    // 2. tooth/texture strokes that follow the form
    for (let i = 0; i < 340; i++) {
      const p = sampleInside(0.16); if (!p) continue;
      push({
        x0: p.x, y0: p.y, angle: angleAt(p.x, p.y, 0.85),
        length: 0.022 + rng() * 0.055, width: 0.012 + rng() * 0.015,
        curve: (rng() - 0.5) * 0.35,
        tone: rng() < 0.45 ? "mid" : "dark",
        alpha: 0.05 + p.d * 0.10,
      });
    }
    // 3. core black — the heavy heart (head + left/spine shadow)
    for (let i = 0; i < 170; i++) {
      const p = sampleInside(0.58); if (!p) continue;
      push({
        x0: p.x, y0: p.y, angle: angleAt(p.x, p.y, 0.6),
        length: 0.03 + rng() * 0.05, width: 0.012 + rng() * 0.013,
        curve: (rng() - 0.5) * 0.25,
        tone: "deep",
        alpha: 0.14 + p.d * 0.14,
      });
    }
    // 4. spine — a vertical shadow down the back/neck
    for (let i = 0; i < 80; i++) {
      const x = 0.50 + (rng() - 0.5) * 0.07;
      const y = 0.40 + rng() * 0.36;
      if (!inside(x, y)) continue;
      push({
        x0: x, y0: y, angle: Math.PI / 2 + (rng() - 0.5) * 0.3,
        length: 0.05 + rng() * 0.08, width: 0.009 + rng() * 0.012,
        curve: (rng() - 0.5) * 0.25,
        tone: "deep", hard: rng() < 0.4,
        alpha: 0.14 + rng() * 0.14,
      });
    }
    // 5. light carving — lift the right shoulder/back ridge into light
    for (let i = 0; i < 80; i++) {
      const x = 0.54 + rng() * 0.24;
      const y = 0.42 + rng() * 0.36;
      if (!inside(x, y)) continue;
      push({
        x0: x, y0: y, angle: (rng() - 0.5) * 0.6,
        length: 0.03 + rng() * 0.07, width: 0.014 + rng() * 0.016,
        curve: (rng() - 0.5) * 0.3,
        tone: rng() < 0.6 ? "paper" : "light",
        alpha: 0.05 + rng() * 0.06,
      });
    }
    // 6. crown fuzz — a soft, slightly broken hairline (kept tight & round)
    for (let i = 0; i < 30; i++) {
      const a = -Math.PI / 2 + (rng() - 0.5) * 1.7;
      const x = 0.50 + Math.cos(a) * 0.122;
      const y = 0.205 + Math.sin(a) * 0.150;
      push({
        x0: x, y0: y, angle: a + (rng() - 0.5) * 0.5,
        length: 0.012 + rng() * 0.022, width: 0.004 + rng() * 0.006,
        curve: (rng() - 0.5) * 0.6,
        tone: rng() < 0.5 ? "deep" : "dark", hard: true,
        alpha: 0.13 + rng() * 0.13,
      });
    }
    // 7. breakout gestures — sharp diagonal slashes from the sides
    for (let i = 0; i < 8; i++) {
      const left = rng() < 0.5;
      const x0 = left ? 0.30 + rng() * 0.08 : 0.62 + rng() * 0.08;
      const y0 = 0.42 + rng() * 0.32;
      const out = left ? Math.PI : 0;
      const a = out + (rng() < 0.5 ? 1 : -1) * (0.35 + rng() * 0.8);
      push({
        x0: x0, y0: y0, angle: a,
        length: 0.10 + rng() * 0.20, width: 0.0035 + rng() * 0.004,
        spacing: 0.003, curve: (rng() - 0.5) * 0.16,
        tone: "deep", hard: true,
        alpha: 0.30 + rng() * 0.34,
      });
    }
    // 8. eraser highlights — bright scrapes on the lit ridge
    for (let i = 0; i < 14; i++) {
      const x = 0.58 + rng() * 0.13;
      const y = 0.30 + rng() * 0.42;
      if (!inside(x, y)) continue;
      push({
        x0: x, y0: y, angle: (rng() - 0.5) * 0.6,
        length: 0.03 + rng() * 0.05, width: 0.006 + rng() * 0.008,
        tone: "light", hard: true,
        alpha: 0.10 + rng() * 0.12,
      });
    }

    return strokes;
  }

  /* ============================================================
     RENDERER + DRAW-ON ANIMATION
     ============================================================ */

  function FigureCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0, dpr = 1;
    let brushes = null, strokes = null, allDabs = null, drawn = 0;
    const rngSeed = 0x9e3779b1;

    function buildBrushes() {
      const rng = mulberry32(12345);
      const maskSoft = makeBrushMask(64, rng, 0);
      const maskMed = makeBrushMask(64, rng, 0.5);
      const maskHard = makeBrushMask(64, rng, 1);
      brushes = { soft: {}, med: {}, hard: {} };
      for (const k in TONE) {
        brushes.soft[k] = tintBrush(maskSoft, TONE[k]);
        brushes.med[k] = tintBrush(maskMed, TONE[k]);
        brushes.hard[k] = tintBrush(maskHard, TONE[k]);
      }
    }

    function flatten() {
      allDabs = [];
      for (const s of strokes) for (const d of s.dabs) allDabs.push(d);
    }

    function drawDab(d) {
      const b = (brushes[d.b] || brushes.soft)[d.tone];
      const sz = d.size * Math.min(W, H);
      const px = d.x * W, py = d.y * H;
      ctx.globalAlpha = d.alpha;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(d.rot);
      ctx.drawImage(b, -sz / 2, -sz / 2, sz, sz);
      ctx.restore();
    }

    function renderRange(from, to) {
      for (let i = from; i < to; i++) drawDab(allDabs[i]);
      ctx.globalAlpha = 1;
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = rect.width; H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (drawn >= (allDabs ? allDabs.length : 0)) {
        // already finished — just re-render instantly
        if (allDabs) renderRange(0, allDabs.length);
      }
    }

    function generate() {
      if (!brushes) buildBrushes();
      strokes = buildFigure(mulberry32(rngSeed));
      flatten();
      drawn = 0;
    }

    let raf = 0;
    function animateIn(done) {
      const total = allDabs.length;
      const perFrame = Math.ceil(total / 90); // ~1.5s @60fps
      function step() {
        const next = Math.min(total, drawn + perFrame);
        renderRange(drawn, next);
        drawn = next;
        if (drawn < total) raf = requestAnimationFrame(step);
        else if (done) done();
      }
      raf = requestAnimationFrame(step);
    }

    function renderAll() {
      ctx.clearRect(0, 0, W, H);
      renderRange(0, allDabs.length);
      drawn = allDabs.length;
    }

    return {
      init(animate) {
        resize();
        generate();
        if (animate) animateIn();
        else renderAll();
      },
      resize() {
        cancelAnimationFrame(raf);
        const wasDone = drawn >= (allDabs ? allDabs.length : 1);
        resize();
        generate();
        if (wasDone) renderAll(); else animateIn();
      },
    };
  }

  /* ============================================================
     DUST — slow-drifting grain specks over the whole page
     ============================================================ */
  function Dust(canvas) {
    const ctx = canvas.getContext("2d");
    let W, H, dpr, parts = [];
    const rng = mulberry32(777);
    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!parts.length) {
        const N = Math.floor((W * H) / 14000);
        for (let i = 0; i < N; i++) {
          parts.push({
            x: rng() * W, y: rng() * H,
            r: rng() * 1.6 + 0.3,
            a: rng() * 0.05 + 0.015,
            dark: rng() < 0.6,
            ph: rng() * Math.PI * 2,
            sp: rng() * 0.3 + 0.05,
          });
        }
      }
    }
    let t = 0;
    function frame() {
      t += 0.006;
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        const x = p.x + Math.cos(t * p.sp + p.ph) * 8;
        const y = p.y + Math.sin(t * p.sp * 0.8 + p.ph) * 8;
        ctx.globalAlpha = p.a;
        ctx.fillStyle = p.dark ? "rgb(30,28,24)" : "rgb(245,242,235)";
        ctx.beginPath(); ctx.arc(x, y, p.r, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }
    resize();
    window.addEventListener("resize", function () { parts = []; resize(); });
    requestAnimationFrame(frame);
  }

  window.Charcoal = { FigureCanvas: FigureCanvas, Dust: Dust };
})();

// Marks this file as an ES module for TypeScript (`import()` call sites are
// typed .ts/.tsx) — no effect on runtime behavior, the IIFE above is unchanged.
export {};
