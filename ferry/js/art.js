'use strict';
// The cartoon kit: ink-outlined shapes, signs, stamps, invoices, vehicles, boats, scenery.
// Everything draws in 1920×1080 stage coordinates. Visual vocabulary for the Marina's ground-level
// sets (cypress windbreaks, red curbs, riprap, the brick roundabout, wildflower medians) comes from
// looking at the real place; all drawings are original.
(function () {
  const A = (F.art = {});
  const INK = (A.INK = '#1d1a24');
  A.DISPLAY = '"Arial Black", "Helvetica Neue", Arial, sans-serif';
  A.STORY = 'Georgia, "Times New Roman", serif';
  A.font = (px, family = A.DISPLAY, weight = 900, style = '') => `${style} ${weight} ${px}px ${family}`.trim();

  A.PAL = {
    sky: '#5aa9e6', skyTop: '#2f7fd1', skyLow: '#bfe3ff', water: '#2f84c9', waterDeep: '#1f5f9e', waterLight: '#8cc8f0',
    grass: '#6cbf4f', grassDark: '#3f8f3a', flower: '#f6d32d', asphalt: '#6d6f78', asphaltDark: '#4f5159', curb: '#d6453d',
    sand: '#e9d7a5', rock: '#8f8a84', cypress: '#2f5f3a', cypressDark: '#214429', hills: '#7aa37a', hillsFar: '#9fb8a6',
    paper: '#fbf6e8', cityGold: '#f2c14e', official: '#2e3f78', red: '#e04a3f', orange: '#f28c28', yellow: '#ffd23f',
    green: '#3fa35b', teal: '#2a9d8f', pink: '#f7a1b8', pinkDark: '#d9707f', white: '#ffffff', black: INK,
  };
  const P = A.PAL;

  // ---------- primitives ----------
  A.rr = (ctx, x, y, w, h, r) => {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  // fill + ink outline of whatever path `fn` builds
  A.ink = (ctx, fn, fill, lw = 5, stroke = INK) => {
    ctx.beginPath();
    fn(ctx);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
  };
  A.box = (ctx, x, y, w, h, fill, o = {}) => A.ink(ctx, () => A.rr(ctx, x, y, w, h, o.r == null ? 10 : o.r), fill, o.lw == null ? 5 : o.lw, o.stroke);
  A.circle = (ctx, x, y, r, fill, lw = 5) => A.ink(ctx, (c) => c.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2), fill, lw);
  A.ellipse = (ctx, x, y, rx, ry, fill, lw = 5, rot = 0) => A.ink(ctx, (c) => c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2), fill, lw);
  A.poly = (ctx, pts, fill, lw = 5, close = true) => A.ink(ctx, (c) => { pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (close) c.closePath(); }, fill, lw);
  A.line = (ctx, pts, color = INK, lw = 5) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  };

  // Text with optional ink outline; wraps to maxW if given. Returns the height used.
  A.text = (ctx, text, x, y, o = {}) => {
    const size = o.size || 40;
    ctx.font = o.font || A.font(size, o.family, o.weight, o.style);
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.baseline || 'middle';
    const lines = o.maxW ? A.wrap(ctx, text, o.maxW) : String(text).split('\n');
    const lh = size * (o.lh || 1.15);
    const y0 = y - ((lines.length - 1) * lh) / 2 * (o.baseline === 'top' ? 0 : 1);
    lines.forEach((ln, i) => {
      const yy = y0 + i * lh;
      if (o.stroke) { ctx.lineWidth = o.strokeW || size * 0.18; ctx.strokeStyle = o.stroke; ctx.lineJoin = 'round'; ctx.strokeText(ln, x, yy); }
      ctx.fillStyle = o.color || INK;
      ctx.fillText(ln, x, yy);
    });
    return lines.length * lh;
  };
  A.wrap = (ctx, text, maxW) => {
    const out = [];
    String(text).split('\n').forEach((para) => {
      let line = '';
      para.split(' ').forEach((w) => {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxW && line) { out.push(line); line = w; } else line = test;
      });
      out.push(line);
    });
    return out;
  };

  // Run fn with the canvas moved to (x, y), scaled and rotated; keeps call sites short.
  A.at = (ctx, x, y, s, rot, fn) => {
    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    if (s !== 1) ctx.scale(s, s);
    fn(ctx);
    ctx.restore();
  };
  // squash-and-stretch pop-in: scale for progress p (0..1)
  A.popScale = (p) => (p <= 0 ? 0 : F.ease.outBack(Math.min(1, p)));

  // ---------- sky, weather, light ----------
  A.sky = (ctx, top = P.skyTop, bot = P.skyLow, y0 = 0, y1 = F.H) => {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, top);
    g.addColorStop(1, bot);
    ctx.fillStyle = g;
    ctx.fillRect(0, y0, F.W, y1 - y0);
  };
  // wispy cirrus streaks, drifting
  A.cirrus = (ctx, t, seed = 3, alpha = 0.55, yMax = 420) => {
    const r = F.rng(seed);
    ctx.save();
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineCap = 'round';
    for (let i = 0; i < 14; i++) {
      const y = 40 + r() * yMax, len = 160 + r() * 320, x = ((r() * 2400 + t * (6 + r() * 6)) % 2600) - 340;
      ctx.lineWidth = 6 + r() * 12;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + len * 0.5, y - 18 - r() * 26, x + len, y - 6);
      ctx.stroke();
    }
    ctx.restore();
  };
  A.cloud = (ctx, x, y, s = 1, fill = '#fff', lw = 5) => {
    A.ink(ctx, (c) => {
      c.moveTo(x - 110 * s, y + 30 * s);
      c.arc(x - 70 * s, y + 4 * s, 42 * s, Math.PI * 0.85, Math.PI * 1.6);
      c.arc(x, y - 22 * s, 58 * s, Math.PI * 1.15, Math.PI * 1.9);
      c.arc(x + 74 * s, y + 4 * s, 44 * s, Math.PI * 1.4, Math.PI * 0.2);
      c.closePath();
    }, fill, lw);
  };
  A.sun = (ctx, x, y, r, t, color = '#ffd84a') => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(F.reduced ? 0 : t * 0.2);
    ctx.fillStyle = color;
    for (let i = 0; i < 12; i++) {
      ctx.rotate(Math.PI / 6);
      ctx.beginPath();
      ctx.moveTo(r * 1.15, -9);
      ctx.lineTo(r * 1.55, 0);
      ctx.lineTo(r * 1.15, 9);
      ctx.fill();
    }
    ctx.restore();
    A.circle(ctx, x, y, r, color, 5);
  };
  A.gull = (ctx, x, y, s, t, color = '#fff') => {
    const f = F.reduced ? 0.4 : Math.sin(t * 7) * 0.5 + 0.5;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(-26, -6 + f * 14);
    ctx.quadraticCurveTo(-12, -14 - f * 6, 0, 0);
    ctx.quadraticCurveTo(12, -14 - f * 6, 26, -6 + f * 14);
    ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke();
    ctx.lineWidth = 2.5; ctx.strokeStyle = color; ctx.stroke();
    ctx.restore();
  };
  A.sparkle = (ctx, x, y, r, rot = 0, color = '#fff6c2') => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const rr = i % 2 ? r * 0.28 : r;
      const a = (i / 8) * Math.PI * 2;
      ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  };
  A.sparkles = (ctx, cx, cy, w, h, t, n = 18, seed = 9, amt = 1) => {
    const r = F.rng(seed);
    for (let i = 0; i < n; i++) {
      const x = cx + (r() - 0.5) * w, y = cy + (r() - 0.5) * h, ph = r() * 6, sp = 2 + r() * 3;
      const tw = (Math.sin(t * sp + ph) * 0.5 + 0.5) * amt;
      if (tw > 0.05) A.sparkle(ctx, x, y, 6 + 18 * tw, t + ph);
    }
  };
  A.smoke = (ctx, x, y, t, o = {}) => {
    const n = o.n || 7, s = o.s || 1, col = o.color || 'rgba(70,70,76,0.85)';
    const r = F.rng(o.seed || 5);
    for (let i = 0; i < n; i++) {
      const ph = (t * (o.speed || 0.5) + i / n) % 1, wob = r() * 6;
      const px = x + Math.sin(ph * 4 + wob) * 18 * s + ph * (o.drift || 60) * s, py = y - ph * (o.rise || 260) * s;
      ctx.globalAlpha = (1 - ph) * (o.alpha == null ? 0.9 : o.alpha);
      A.circle(ctx, px, py, (14 + ph * 46) * s, col, 3 * s);
    }
    ctx.globalAlpha = 1;
  };

  // ---------- land and water, side view ----------
  // Berkeley hills: a soft ridge with a few bumps; deterministic per seed
  A.hills = (ctx, baseY, color = P.hills, o = {}) => {
    const r = F.rng(o.seed || 11), amp = o.amp || 120, x0 = o.x0 || -40, x1 = o.x1 || F.W + 40;
    const pts = [];
    for (let i = 0; i <= 12; i++) pts.push([F.lerp(x0, x1, i / 12), baseY - amp * (0.45 + 0.55 * Math.sin(i * 0.9 + 1.2) * 0.5 + r() * 0.35)]);
    A.ink(ctx, (c) => {
      c.moveTo(x0, baseY + 400);
      c.lineTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        const [px, py] = pts[i - 1], [qx, qy] = pts[i];
        c.quadraticCurveTo(px + (qx - px) * 0.5, Math.min(py, qy) - 18, qx, qy);
      }
      c.lineTo(x1, baseY + 400);
      c.closePath();
    }, color, o.lw == null ? 4 : o.lw);
    // the campanile, tiny, if asked
    if (o.campanile) {
      const cx = o.campanile, cy = baseY - amp * 0.35;
      A.box(ctx, cx - 6, cy - 54, 12, 56, '#efe6d2', { r: 1, lw: 2.5 });
      A.poly(ctx, [[cx - 8, cy - 54], [cx, cy - 70], [cx + 8, cy - 54]], '#9fb3a0', 2.5);
    }
  };
  // San Francisco across the water: a skyline silhouette at the horizon
  A.sfSkyline = (ctx, x, y, s = 1, color = '#8aa4c0') => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = color;
    const blds = [[-160, 26], [-140, 40], [-122, 30], [-104, 58], [-88, 44], [-70, 72], [-52, 50], [-34, 88], [-14, 64], [4, 96], [24, 70], [44, 54], [62, 80], [82, 46], [100, 36], [120, 28], [140, 22]];
    blds.forEach(([bx, h]) => ctx.fillRect(bx, -h, 17, h));
    ctx.beginPath(); // a slim pyramid-topped tower
    ctx.moveTo(-60, 0); ctx.lineTo(-52, -120); ctx.lineTo(-44, 0); ctx.fill();
    ctx.fillRect(-180, -10, 360, 10);
    ctx.restore();
  };
  A.water = (ctx, y0, t, o = {}) => {
    const y1 = o.y1 || F.H, col = o.color || P.water, light = o.light || P.waterLight;
    ctx.fillStyle = col;
    ctx.fillRect(0, y0, F.W, y1 - y0);
    ctx.save();
    ctx.strokeStyle = light;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    const r = F.rng(o.seed || 21);
    const rows = o.rows || 7;
    for (let i = 0; i < rows; i++) {
      const yy = y0 + 22 + ((y1 - y0 - 30) * i) / rows;
      for (let k = 0; k < 9; k++) {
        const x = ((r() * F.W + t * (o.speed || 30) * (i % 2 ? 1 : -0.6)) % (F.W + 200)) - 100;
        ctx.beginPath();
        ctx.moveTo(x, yy);
        ctx.quadraticCurveTo(x + 14, yy - 8, x + 28, yy);
        ctx.quadraticCurveTo(x + 42, yy + 8, x + 56, yy);
        ctx.stroke();
      }
    }
    ctx.restore();
    A.line(ctx, [[-10, y0], [F.W + 10, y0]], INK, 4);
  };
  // riprap boulders along a shoreline from x0 to x1 at baseline y
  A.riprap = (ctx, x0, x1, y, s = 1, seed = 4) => {
    const r = F.rng(seed);
    for (let x = x0; x < x1; x += 34 * s + r() * 20 * s) {
      const w = (30 + r() * 26) * s, h = (18 + r() * 16) * s;
      A.ellipse(ctx, x, y - h * 0.3, w / 2, h / 2, r() < 0.5 ? P.rock : '#a39d95', 3.5 * s, (r() - 0.5) * 0.5);
    }
  };
  // a wind-sculpted Monterey cypress: flat-topped, leaning away from the Bay
  A.cypress = (ctx, x, y, s = 1, o = {}) => {
    const lean = o.lean == null ? 1 : o.lean, col = o.color || P.cypress, dark = o.dark || P.cypressDark;
    A.at(ctx, x, y, s, 0, (c) => {
      A.poly(c, [[-10, 0], [-6 - 20 * lean, -150], [8 - 20 * lean, -150], [12, 0]], '#5a4033', 4);
      A.line(c, [[-12 * lean, -110], [-70 * lean, -160]], '#5a4033', 9);
      A.line(c, [[-4 * lean, -130], [50 * lean, -175]], '#5a4033', 8);
      [[-120, -180, 80, 34], [-30, -200, 110, 40], [80, -185, 70, 30], [-70, -225, 80, 30], [20, -238, 70, 26]].forEach(([dx, dy, rx, ry]) =>
        A.ellipse(c, dx * lean, dy, rx, ry, col, 4));
      [[-110, -192, 46, 12], [-20, -214, 64, 14], [70, -196, 40, 10]].forEach(([dx, dy, rx, ry]) =>
        A.ellipse(c, dx * lean, dy, rx, ry, dark, 0));
    });
  };
  A.bush = (ctx, x, y, s = 1, col = '#4f9a45') => {
    A.at(ctx, x, y, s, 0, (c) => {
      A.ink(c, (k) => { k.moveTo(-40, 0); k.arc(-20, -16, 22, Math.PI, Math.PI * 1.8); k.arc(10, -26, 26, Math.PI * 1.1, Math.PI * 1.95); k.arc(34, -12, 18, Math.PI * 1.4, 0.2); k.closePath(); }, col, 4);
    });
  };
  // lawn strip with yellow wildflowers
  A.lawn = (ctx, x0, x1, y0, y1, seed = 6, flowers = 1) => {
    ctx.fillStyle = P.grass;
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    const r = F.rng(seed);
    const n = Math.floor(((x1 - x0) * (y1 - y0)) / 2600 * flowers);
    ctx.fillStyle = P.flower;
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.arc(x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), 3 + r() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  // a ground-level road receding into the distance (simple one-point perspective)
  A.road = (ctx, vx, vy, w0, y0, o = {}) => {
    A.poly(ctx, [[vx - 6, vy], [vx + 6, vy], [vx + w0 / 2, y0], [vx - w0 / 2, y0]], o.color || P.asphalt, 0);
    // cracks
    const r = F.rng(o.seed || 31);
    ctx.strokeStyle = 'rgba(30,30,36,0.45)';
    ctx.lineWidth = 2;
    for (let i = 0; i < (o.cracks || 26); i++) {
      const d = 0.15 + r() * 0.85, x = vx + (r() - 0.5) * w0 * d * 0.9, y = vy + (y0 - vy) * d;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (r() - 0.5) * 60 * d, y + (r() - 0.5) * 16 * d);
      ctx.lineTo(x + (r() - 0.5) * 80 * d, y + (r() - 0.5) * 24 * d);
      ctx.stroke();
    }
    if (o.centerline !== false) {
      [-7, 7].forEach((off) => A.line(ctx, [[vx + off * 0.05, vy], [vx + off, y0]], o.lineColor || '#f3c623', 4));
    }
    if (o.curb !== false) {
      A.line(ctx, [[vx - 6, vy], [vx - w0 / 2, y0]], P.curb, 9);
      A.line(ctx, [[vx + 6, vy], [vx + w0 / 2, y0]], P.curb, 9);
    }
  };

  // ---------- civic signage ----------
  // A sign on one or two posts. lines: strings; first line is set larger.
  A.sign = (ctx, x, y, lines, o = {}) => {
    const w = o.w || 520, size = o.size || 34, pad = o.pad || 22;
    const h = o.h || pad * 2 + size * 1.25 + (lines.length - 1) * size * 0.95;
    const bg = o.bg || '#f7f3e3', fg = o.color || INK;
    A.at(ctx, x, y, o.s || 1, o.rot || 0, (c) => {
      if (o.post !== false) {
        const ph = o.postH || 140;
        [-w * 0.3, w * 0.3].forEach((px) => A.box(c, px - 8, -ph, 16, ph, o.postColor || '#7b5a3c', { r: 3, lw: 4 }));
        c.translate(0, -ph);
      }
      A.box(c, -w / 2, -h, w, h, bg, { r: o.r == null ? 12 : o.r, lw: 6 });
      if (o.border) A.box(c, -w / 2 + 9, -h + 9, w - 18, h - 18, null, { r: 8, lw: 3, stroke: o.border });
      let yy = -h + pad + size * 0.6;
      lines.forEach((ln, i) => {
        const sz = i === 0 ? size : size * 0.62;
        A.text(c, ln, 0, yy, { size: sz, color: i === 0 ? fg : o.color2 || fg, maxW: w - pad * 2 });
        yy += i === 0 ? size * 1.05 : size * 0.72;
      });
    });
  };
  // A ribbon banner that unfurls left to right with progress p.
  A.banner = (ctx, x, y, w, text, o = {}) => {
    const p = o.p == null ? 1 : o.p;
    if (p <= 0) return;
    const h = o.h || 96, col = o.color || P.red, fg = o.fg || '#fff', size = o.size || 46;
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    const ww = w * F.ease.outBack(p);
    // tails
    [-1, 1].forEach((sd) => {
      const tx = (sd * ww) / 2;
      A.poly(ctx, [[tx - sd * 10, -h * 0.3], [tx + sd * 70, -h * 0.3], [tx + sd * 46, h * 0.1], [tx + sd * 70, h * 0.5], [tx - sd * 10, h * 0.5]], o.tail || shade(col, -0.25), 5);
    });
    A.box(ctx, -ww / 2, -h / 2, ww, h, col, { r: 6, lw: 6 });
    ctx.beginPath();
    ctx.rect(-ww / 2, -h / 2, ww, h);
    ctx.clip();
    A.text(ctx, text, 0, 2, { size, color: fg, maxW: w - 60 });
    ctx.restore();
  };
  // The big rubber stamp: slams in from huge, wobbles, leaves an inky impression.
  // The big rubber stamp: slams in from huge, wobbles, leaves an inky impression. Each stamp is
  // inked once on its own canvas (so the speckle only eats the stamp, never the picture under it).
  const stampCache = new Map();
  function stampImage(text, size, col, seed) {
    const key = [text, size, col, seed].join('|');
    if (stampCache.has(key)) return stampCache.get(key);
    const m = document.createElement('canvas').getContext('2d');
    m.font = A.font(size);
    const w = m.measureText(text).width + size * 0.7, h = size * 1.35, pad = size * 0.12;
    const c = document.createElement('canvas');
    c.width = Math.ceil(w + pad * 2);
    c.height = Math.ceil(h + pad * 2);
    const k = c.getContext('2d');
    k.translate(c.width / 2, c.height / 2);
    k.lineWidth = size * 0.11;
    k.strokeStyle = col;
    A.rr(k, -w / 2, -h / 2, w, h, size * 0.16);
    k.stroke();
    k.lineWidth = size * 0.04;
    A.rr(k, -w / 2 + size * 0.14, -h / 2 + size * 0.14, w - size * 0.28, h - size * 0.28, size * 0.1);
    k.stroke();
    k.fillStyle = col;
    k.font = A.font(size);
    k.textAlign = 'center';
    k.textBaseline = 'middle';
    k.fillText(text, 0, size * 0.04);
    const r = F.rng(seed);
    k.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 40; i++) { k.beginPath(); k.arc((r() - 0.5) * w, (r() - 0.5) * h, (2 + r() * 5) * (size / 120), 0, Math.PI * 2); k.fill(); }
    stampCache.set(key, c);
    return c;
  }
  A.stamp = (ctx, x, y, text, p, o = {}) => {
    if (p <= 0) return;
    const col = o.color || '#d62828', size = o.size || 120;
    const s = p < 0.35 ? F.lerp(3.2, 1, F.ease.in(p / 0.35)) : 1 + Math.sin((p - 0.35) * 18) * 0.06 * (1 - p);
    const a = p < 0.35 ? p / 0.35 : 1;
    const img = stampImage(text, size, col, o.seed || 17);
    ctx.save();
    ctx.globalAlpha = a * (o.alpha == null ? 1 : o.alpha);
    ctx.translate(x, y);
    ctx.rotate(o.rot == null ? -0.12 : o.rot);
    ctx.scale(s, s);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  };
  // A consultant's invoice: paper with a ragged edge, line items, a huge total.
  A.invoice = (ctx, x, y, s, o = {}) => {
    A.at(ctx, x, y, s, o.rot || 0, (c) => {
      const w = 300, h = 380;
      A.ink(c, (k) => {
        k.moveTo(-w / 2, -h / 2);
        k.lineTo(w / 2, -h / 2);
        k.lineTo(w / 2, h / 2);
        for (let i = 0; i <= 10; i++) k.lineTo(w / 2 - (w * i) / 10, h / 2 + (i % 2 ? 12 : 0));
        k.closePath();
      }, '#fffdf4', 5);
      A.text(c, 'INVOICE', 0, -h / 2 + 40, { size: 36 });
      (o.lines || ['Professional services', 'Explaining value', 'Further study']).forEach((ln, i) => {
        A.text(c, ln, -w / 2 + 24, -h / 2 + 100 + i * 40, { size: 19, align: 'left', family: A.STORY, weight: 700 });
        A.line(c, [[-w / 2 + 24, -h / 2 + 116 + i * 40], [w / 2 - 24, -h / 2 + 116 + i * 40]], 'rgba(0,0,0,0.15)', 2);
      });
      A.line(c, [[-w / 2 + 20, h / 2 - 104], [w / 2 - 20, h / 2 - 104]], INK, 4);
      A.text(c, 'TOTAL', -w / 2 + 24, h / 2 - 78, { size: 20, align: 'left' });
      A.text(c, o.amount || '$200,000', 0, h / 2 - 38, { size: o.amountSize || 46, color: '#c1121f' });
      if (o.note) A.text(c, o.note, 0, h / 2 + 34, { size: 15, color: '#555', weight: 700 });
    });
  };
  // An evidence card for a sourced figure: kicker, big number, explanation, source line.
  A.evidence = (ctx, x, y, o = {}) => {
    const p = o.p == null ? 1 : o.p;
    if (p <= 0) return;
    const w = o.w || 640, s = A.popScale(p);
    A.at(ctx, x, y, s, o.rot || 0, (c) => {
      const lines = [];
      c.font = A.font(o.smallSize || 24, A.DISPLAY, 800);
      const small = o.small ? A.wrap(c, o.small, w - 60) : [];
      const h = 70 + (o.big ? (o.bigSize || 84) * 1.05 : 0) + small.length * (o.smallSize || 24) * 1.2 + (o.source ? 46 : 18);
      A.box(c, -w / 2, -h / 2, w, h, o.bg || '#fffbea', { r: 16, lw: 6 });
      A.box(c, -w / 2, -h / 2, w, 48, o.band || '#1d3557', { r: 16, lw: 6 });
      c.fillStyle = o.band || '#1d3557';
      c.fillRect(-w / 2 + 3, -h / 2 + 24, w - 6, 21);
      A.text(c, o.title || '', 0, -h / 2 + 25, { size: 22, color: '#fff' });
      let yy = -h / 2 + 60;
      if (o.big) { A.text(c, o.big, 0, yy + (o.bigSize || 84) * 0.55, { size: o.bigSize || 84, color: o.bigColor || '#c1121f' }); yy += (o.bigSize || 84) * 1.05; }
      small.forEach((ln) => { A.text(c, ln, 0, yy + 16, { size: o.smallSize || 24, weight: 800 }); yy += (o.smallSize || 24) * 1.2; });
      if (o.source) A.text(c, o.source, 0, h / 2 - 24, { size: 16, color: '#555', weight: 700, family: A.STORY, style: 'italic' });
      lines.length = 0;
    });
  };
  // A small persistent disclosure tag in a corner.
  A.tag = (ctx, text, o = {}) => {
    const size = o.size || 26;
    ctx.font = A.font(size);
    const w = ctx.measureText(text).width + 40, h = size * 1.7;
    const x = o.x == null ? 40 : o.x, y = o.y == null ? 36 : o.y;
    A.box(ctx, x, y, w, h, o.bg || '#fff3b0', { r: 10, lw: 4 });
    A.text(ctx, text, x + w / 2, y + h / 2 + 1, { size, color: o.color || INK });
  };
  A.counter = (ctx, x, y, value, o = {}) => {
    const str = typeof value === 'string' ? value : Math.round(value).toLocaleString('en-US');
    const size = o.size || 72, cw = size * 0.72;
    const w = str.length * cw + 30;
    A.box(ctx, x - w / 2, y - size * 0.75, w, size * 1.5, '#222', { r: 10, lw: 6 });
    for (let i = 0; i < str.length; i++) {
      const cx = x - w / 2 + 15 + cw * (i + 0.5);
      if (str[i] !== ',') { ctx.fillStyle = '#3a3a3a'; ctx.fillRect(cx - cw * 0.42, y - size * 0.6, cw * 0.84, size * 1.2); }
      A.text(ctx, str[i], cx, y + 2, { size, color: o.color || '#ffd23f', family: '"Courier New", monospace', weight: 900 });
    }
    if (o.label) A.text(ctx, o.label, x, y + size * 1.15, { size: o.labelSize || 30, color: o.labelColor || '#fff', stroke: INK, strokeW: 7, maxW: o.labelW || 900 });
  };
  A.coin = (ctx, x, y, r, spin = 0) => {
    const sx = Math.max(0.15, Math.abs(Math.cos(spin)));
    A.ellipse(ctx, x, y, r * sx, r, '#ffcc33', 3);
    if (sx > 0.5) A.text(ctx, '$', x, y + 1, { size: r * 1.1, color: '#b8860b' });
  };
  // A rubber hose along a path, with blobs (coins or glowing energy) travelling along it.
  A.hose = (ctx, pts, o = {}) => {
    const w = o.w || 22, col = o.color || '#3f8f3a';
    A.line(ctx, pts, INK, w + 10);
    A.line(ctx, pts, col, w);
    A.line(ctx, pts, 'rgba(255,255,255,0.25)', w * 0.3);
    if (o.flow) {
      const segs = [];
      let L = 0;
      for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(d); L += d; }
      const n = o.blobs || Math.max(2, Math.floor(L / 120));
      for (let k = 0; k < n; k++) {
        let d = (((k / n + o.flow) % 1) + 1) % 1 * L;
        let i = 0;
        while (i < segs.length - 1 && d > segs[i]) { d -= segs[i]; i++; }
        const u = d / (segs[i] || 1);
        const bx = F.lerp(pts[i][0], pts[i + 1][0], u), by = F.lerp(pts[i][1], pts[i + 1][1], u);
        if (o.blob === 'energy') { A.circle(ctx, bx, by, w * 0.42, '#c8ffb0', 0); A.circle(ctx, bx, by, w * 0.22, '#fff', 0); }
        else A.coin(ctx, bx, by, w * 0.42, k + o.flow * 20);
      }
    }
    if (o.label) {
      const m = pts[Math.floor(pts.length / 2)], m2 = pts[Math.min(pts.length - 1, Math.floor(pts.length / 2) + 1)];
      const ang = Math.atan2(m2[1] - m[1], m2[0] - m[0]);
      const flip = Math.abs(ang) > Math.PI / 2 ? Math.PI : 0;
      A.at(ctx, m[0], m[1] - w - 16, 1, 0, (c) => A.tagSmall(c, o.label, 0, 0, o.labelSize || 24));
      void flip;
    }
  };
  A.tagSmall = (ctx, text, x, y, size = 24, bg = '#fffbea') => {
    ctx.font = A.font(size);
    const w = ctx.measureText(text).width + 24, h = size * 1.5;
    A.box(ctx, x - w / 2, y - h / 2, w, h, bg, { r: 8, lw: 4 });
    A.text(ctx, text, x, y + 1, { size });
  };
  A.curtain = (ctx, x0, x1, y0, y1, p, col = '#a4161a') => {
    const half = (x1 - x0) / 2, cw = half * F.ease.inOut(p);
    [[x0, 1], [x1, -1]].forEach(([edge, dir]) => {
      if (cw < 2) return;
      A.ink(ctx, (c) => {
        c.moveTo(edge, y0);
        c.lineTo(edge + dir * cw, y0);
        c.quadraticCurveTo(edge + dir * cw * 0.85, (y0 + y1) / 2, edge + dir * cw, y1);
        c.lineTo(edge, y1);
        c.closePath();
      }, col, 5);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 6;
      for (let k = 1; k < 5; k++) { const fx = edge + dir * cw * (k / 5); ctx.beginPath(); ctx.moveTo(fx, y0 + 10); ctx.lineTo(fx - dir * 8, y1 - 10); ctx.stroke(); }
    });
    A.box(ctx, x0 - 20, y0 - 26, x1 - x0 + 40, 34, '#d4a017', { r: 8, lw: 5 });
  };

  // ---------- vehicles ----------
  // Side-view cartoon car; dir 1 faces right.
  A.car = (ctx, x, y, s = 1, o = {}) => {
    const col = o.color || '#e63946', dir = o.dir || 1, t = o.t || 0;
    const bounce = F.reduced ? 0 : Math.abs(Math.sin(t * 9 + (o.phase || 0))) * 3;
    A.at(ctx, x, y - bounce * s, s, 0, (c) => {
      c.scale(dir, 1);
      if (o.vintage) {
        A.box(c, -78, -62, 120, 40, col, { r: 8, lw: 5 });
        A.box(c, -60, -100, 74, 42, col, { r: 6, lw: 5 });
        A.box(c, -52, -92, 26, 26, '#cfe8ff', { r: 3, lw: 3 });
        A.box(c, -20, -92, 26, 26, '#cfe8ff', { r: 3, lw: 3 });
        A.box(c, 40, -56, 44, 30, col, { r: 10, lw: 5 });
        A.circle(c, 82, -46, 8, '#fff6b0', 3);
        A.line(c, [[-90, -20], [-60, -40]], INK, 5);
        A.line(c, [[60, -20], [92, -36]], INK, 5);
        [-50, 52].forEach((wx) => { A.circle(c, wx, -16, 22, '#222', 5); A.circle(c, wx, -16, 9, '#ccc', 3); });
      } else {
        A.ink(c, (k) => { k.moveTo(-90, -24); k.lineTo(-88, -58); k.quadraticCurveTo(-60, -64, -44, -64); k.lineTo(-24, -96); k.lineTo(34, -96); k.lineTo(60, -62); k.quadraticCurveTo(90, -58, 92, -40); k.lineTo(92, -24); k.closePath(); }, col, 5);
        A.poly(c, [[-34, -64], [-18, -88], [8, -88], [8, -64]], '#cfe8ff', 4);
        A.poly(c, [[16, -64], [16, -88], [30, -88], [48, -64]], '#cfe8ff', 4);
        A.circle(c, 86, -48, 6, '#fff6b0', 3);
        [-52, 56].forEach((wx) => { A.circle(c, wx, -20, 20, '#222', 5); A.circle(c, wx, -20, 8, '#bbb', 3); });
      }
      if (o.driver) A.circle(c, -4, o.vintage ? -78 : -76, 11, '#f1c27d', 3);
    });
  };
  A.bus = (ctx, x, y, s = 1, o = {}) => {
    A.at(ctx, x, y, s, 0, (c) => {
      c.scale(o.dir || 1, 1);
      A.box(c, -150, -120, 300, 100, o.color || '#2a9d8f', { r: 18, lw: 5 });
      for (let i = 0; i < 5; i++) A.box(c, -130 + i * 52, -104, 40, 36, '#cfe8ff', { r: 5, lw: 3 });
      A.text(c, o.label || 'BUS', 0, -48, { size: 22, color: '#fff' });
      [-90, 90].forEach((wx) => { A.circle(c, wx, -18, 20, '#222', 5); A.circle(c, wx, -18, 7, '#bbb', 3); });
    });
  };
  A.bike = (ctx, x, y, s = 1, o = {}) => {
    const t = o.t || 0, col = o.color || '#e63946';
    A.at(ctx, x, y, s, 0, (c) => {
      c.scale(o.dir || 1, 1);
      [-36, 36].forEach((wx) => { A.circle(c, wx, -26, 26, null, 5); A.line(c, [[wx, -26], [wx + Math.cos(t * 8) * 22, -26 + Math.sin(t * 8) * 22]], INK, 2); });
      A.line(c, [[-36, -26], [-6, -26], [24, -58], [-14, -58], [-6, -26]], col, 6);
      A.line(c, [[24, -58], [36, -26]], col, 6);
      A.line(c, [[-14, -58], [-18, -68]], INK, 5);
      A.line(c, [[24, -58], [26, -72], [34, -74]], INK, 5);
      if (o.rider !== false) {
        const legA = F.reduced ? 0 : Math.sin(t * 8) * 10;
        A.line(c, [[-10, -84], [-2, -50 + legA * 0.4], [-6, -28 + legA]], o.pants || '#264653', 9);
        A.line(c, [[-10, -84], [6, -118], [30, -76]], o.shirt || '#ffb703', 12);
        A.circle(c, 12, -134, 15, o.skin || '#c68642', 4);
        A.ink(c, (k) => k.arc(12, -138, 17, Math.PI, 0), o.helmet || '#2a9d8f', 4);
      }
    });
  };
  A.solarPanel = (ctx, x, y, s = 1) => {
    A.at(ctx, x, y, s, 0, (c) => {
      A.line(c, [[0, 0], [0, -40]], INK, 8);
      c.save();
      c.translate(0, -50);
      c.transform(1, 0, -0.35, 0.6, 0, 0);
      A.box(c, -60, -40, 120, 80, '#1d3d7a', { r: 4, lw: 5 });
      c.strokeStyle = '#7fa8ff'; c.lineWidth = 2;
      for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-60 + i * 30, -40); c.lineTo(-60 + i * 30, 40); c.stroke(); }
      c.beginPath(); c.moveTo(-60, 0); c.lineTo(60, 0); c.stroke();
      c.restore();
    });
  };

  // ---------- boats ----------
  A.sailboat = (ctx, x, y, s = 1, o = {}) => {
    const t = o.t || 0, rock = F.wob(t, 1.6 + (o.phase || 0), 0.05);
    A.at(ctx, x, y, s, rock, (c) => {
      c.scale(o.dir || 1, 1);
      A.ink(c, (k) => { k.moveTo(-70, -14); k.lineTo(70, -14); k.quadraticCurveTo(50, 14, 0, 16); k.quadraticCurveTo(-50, 14, -70, -14); k.closePath(); }, o.hull || '#fff', 5);
      A.line(c, [[0, -14], [0, -170]], INK, 5);
      A.poly(c, [[6, -162], [6, -22], [66, -22]], o.sail || '#fff', 4);
      A.poly(c, [[-6, -150], [-6, -22], [-52, -22]], o.jib || '#f1faee', 4);
    });
  };
  A.windsurfer = (ctx, x, y, s = 1, o = {}) => {
    const t = o.t || 0, lean = o.lean == null ? 0.2 : o.lean;
    A.at(ctx, x, y, s, F.wob(t, 2.2 + (o.phase || 0), 0.04), (c) => {
      c.scale(o.dir || 1, 1);
      A.ellipse(c, 0, -4, 70, 9, o.board || '#fff', 4);
      c.save();
      c.rotate(lean);
      A.poly(c, [[10, -10], [10, -190], [96, -40]], o.sail || '#ff006e', 4);
      A.line(c, [[10, -10], [10, -190]], INK, 4);
      A.line(c, [[10, -90], [70, -64]], INK, 4);
      c.restore();
      A.line(c, [[-20, -10], [-24, -50], [-30, -84]], o.suit || '#222', 10);
      A.line(c, [[-30, -80], [10, -78]], o.suit || '#222', 8);
      A.circle(c, -32, -100, 13, o.skin || '#e0ac69', 4);
    });
  };
  A.wingfoiler = (ctx, x, y, s = 1, o = {}) => {
    const t = o.t || 0, hover = o.foil === false ? 0 : 26 + F.wob(t, 3, 4);
    A.at(ctx, x, y, s, F.wob(t, 2 + (o.phase || 0), 0.05), (c) => {
      c.scale(o.dir || 1, 1);
      if (hover > 0) { A.line(c, [[0, 0], [0, -hover]], INK, 4); A.ellipse(c, 0, 0, 26, 5, '#333', 3); }
      A.ellipse(c, 0, -hover - 4, 52, 8, o.board || '#ffd23f', 4);
      A.line(c, [[-6, -hover - 10], [-4, -hover - 52], [-4, -hover - 84]], o.suit || '#222', 10);
      A.circle(c, -4, -hover - 104, 13, o.skin || '#8d5524', 4);
      // the wing: a puffy crescent held overhead
      A.ink(c, (k) => { k.moveTo(-90, -hover - 150); k.quadraticCurveTo(-10, -hover - 230, 80, -hover - 140); k.quadraticCurveTo(-4, -hover - 176, -90, -hover - 150); k.closePath(); }, o.wing || '#00b4d8', 4);
      A.line(c, [[-4, -hover - 84], [-30, -hover - 150]], INK, 4);
      A.line(c, [[-4, -hover - 84], [30, -hover - 156]], INK, 4);
    });
  };
  A.swimmer = (ctx, x, y, s = 1, o = {}) => {
    const t = o.t || 0, st = F.reduced ? 0 : t * 5;
    A.at(ctx, x, y, s, 0, (c) => {
      c.scale(o.dir || 1, 1);
      A.ellipse(c, 0, 0, 40, 10, 'rgba(255,255,255,0.4)', 0);
      A.circle(c, 22, -8, 12, o.cap || '#ff6b35', 4);
      A.line(c, [[10, -4], [-10 + Math.cos(st) * 16, -10 - Math.abs(Math.sin(st)) * 26]], o.skin || '#e0ac69', 7);
    });
  };
  // 1920s–30s automobile ferry, side view: wide car deck, pilot house, tall stack.
  A.ferryVintage = (ctx, x, y, s = 1, o = {}) => {
    const t = o.t || 0;
    A.at(ctx, x, y, s, F.wob(t, 1.2, 0.015), (c) => {
      A.ink(c, (k) => { k.moveTo(-360, -40); k.lineTo(360, -40); k.lineTo(330, 24); k.lineTo(-330, 24); k.closePath(); }, '#3b3b3b', 6);
      A.box(c, -340, -74, 680, 36, '#f2e8cf', { r: 4, lw: 5 });
      A.box(c, -60, -170, 120, 96, '#f2e8cf', { r: 8, lw: 5 });
      for (let i = 0; i < 3; i++) A.box(c, -48 + i * 36, -154, 24, 26, '#9ecbe0', { r: 3, lw: 3 });
      A.box(c, -20, -280, 40, 112, '#b23a48', { r: 4, lw: 5 });
      A.box(c, -24, -292, 48, 20, '#222', { r: 4, lw: 4 });
      A.text(c, o.label || 'BERKELEY', 0, -56, { size: 26, color: '#3b3b3b' });
      if (o.smoke !== false) A.smoke(c, 0, -300, t, { n: 6, s: 0.9, color: 'rgba(60,60,60,0.8)', seed: 3 });
    });
  };
  // A modern ferry (catamaran), side view.
  A.ferry = (ctx, x, y, s = 1, o = {}) => {
    const t = o.t || 0;
    A.at(ctx, x, y, s, F.wob(t, 1.4, 0.012) + (o.tilt || 0), (c) => {
      c.scale(o.dir || 1, 1);
      A.ink(c, (k) => { k.moveTo(-300, -30); k.lineTo(270, -30); k.quadraticCurveTo(320, -26, 330, 10); k.lineTo(-290, 10); k.closePath(); }, o.hull || '#f4f4f4', 6);
      A.box(c, -260, -110, 470, 84, o.cabin || '#fff', { r: 26, lw: 6 });
      for (let i = 0; i < 8; i++) A.box(c, -236 + i * 52, -92, 38, 34, '#1d3557', { r: 6, lw: 3 });
      A.box(c, -40, -160, 170, 54, '#fff', { r: 20, lw: 5 });
      A.box(c, -24, -148, 140, 26, '#1d3557', { r: 8, lw: 3 });
      c.fillStyle = o.stripe || '#0077b6';
      c.fillRect(-296, -26, 590, 14);
      A.text(c, o.label || 'WETA', -150, -2, { size: 26, color: o.stripe || '#0077b6' });
      if (o.empty === false) { /* passengers drawn by caller */ }
    });
  };

  // ---------- civic architecture ----------
  // A generic domed civic building with columns (not any real city hall's logo or seal).
  A.cityHall = (ctx, x, y, s = 1, o = {}) => {
    A.at(ctx, x, y, s, 0, (c) => {
      A.box(c, -260, -60, 520, 60, '#efe6d2', { r: 2, lw: 5 });
      A.box(c, -220, -250, 440, 190, '#f6efe0', { r: 2, lw: 5 });
      for (let i = 0; i < 6; i++) A.box(c, -190 + i * 72, -236, 26, 176, '#fff', { r: 3, lw: 4 });
      A.poly(c, [[-240, -250], [0, -330], [240, -250]], '#efe6d2', 5);
      A.box(c, -60, -400, 120, 80, '#f6efe0', { r: 2, lw: 5 });
      A.ink(c, (k) => k.arc(0, -400, 60, Math.PI, 0), '#c9a227', 5);
      A.line(c, [[0, -460], [0, -500]], INK, 5);
      A.poly(c, [[0, -500], [40, -488], [0, -476]], o.flag || '#e63946', 3);
      if (o.label) A.text(c, o.label, 0, -284, { size: 24 });
    });
  };
  // The glittering proposed terminal (a fantasy; drawn in the opening and the finale).
  A.terminal = (ctx, x, y, s = 1, o = {}) => {
    const p = o.p == null ? 1 : o.p, t = o.t || 0;
    if (p <= 0) return;
    A.at(ctx, x, y, s * A.popScale(p), 0, (c) => {
      A.box(c, -230, -150, 460, 150, o.dark ? '#9aa0a8' : '#dff3ff', { r: 10, lw: 6 });
      A.ink(c, (k) => { k.moveTo(-270, -150); k.quadraticCurveTo(0, -260, 270, -150); k.closePath(); }, o.dark ? '#7a8088' : '#5bc0eb', 6);
      for (let i = 0; i < 6; i++) A.box(c, -200 + i * 68, -120, 50, 90, o.dark ? '#555b63' : '#a9def9', { r: 4, lw: 3 });
      A.text(c, o.label || 'FERRY TERMINAL', 0, -184, { size: 26, color: o.dark ? '#ddd' : '#fff', stroke: INK, strokeW: 6 });
      if (!o.dark) A.sparkles(c, 0, -120, 600, 300, t, 14, 5, 1);
    });
  };
  // A grid of parking stalls (oblique), with cars in some of them.
  A.lot = (ctx, x, y, w, h, o = {}) => {
    A.box(ctx, x, y, w, h, o.color || '#5d5f67', { r: 6, lw: 5 });
    const cols = o.cols || Math.floor(w / 70);
    ctx.strokeStyle = '#f4f4f4';
    ctx.lineWidth = 4;
    for (let r2 = 0; r2 < 2; r2++) for (let i = 1; i < cols; i++) {
      const sx = x + (w * i) / cols, y0 = y + (r2 ? h / 2 + 10 : 8), y1 = y + (r2 ? h - 8 : h / 2 - 10);
      ctx.beginPath(); ctx.moveTo(sx, y0); ctx.lineTo(sx, y1); ctx.stroke();
    }
    if (o.fill) {
      const r = F.rng(o.seed || 41), cols2 = ['#e63946', '#457b9d', '#f4a261', '#2a9d8f', '#e9c46a', '#8d99ae', '#fff', '#222'];
      for (let r2 = 0; r2 < 2; r2++) for (let i = 0; i < cols; i++) {
        const k = r2 * cols + i;
        if (r() > o.fill(k)) continue;
        A.box(ctx, x + (w * (i + 0.18)) / cols, y + (r2 ? h / 2 + 18 : 16), (w / cols) * 0.64, h / 2 - 34, cols2[Math.floor(r() * cols2.length)], { r: 8, lw: 3 });
      }
    }
  };

  // ---------- film language ----------
  A.iris = (ctx, p, cx = F.W / 2, cy = F.H / 2) => {
    if (p >= 1) return;
    const R = Math.hypot(F.W, F.H) * Math.max(0, p);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, F.W, F.H);
    ctx.arc(cx, cy, R, 0, Math.PI * 2, true);
    ctx.fillStyle = '#000';
    ctx.fill('evenodd');
    ctx.restore();
  };
  A.vignette = (ctx, amt = 0.5) => {
    const g = ctx.createRadialGradient(F.W / 2, F.H / 2, F.H * 0.35, F.W / 2, F.H / 2, F.H * 0.95);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${amt})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, F.W, F.H);
  };
  // Old-newsreel grain and scratches (deterministic per frame bucket).
  A.grain = (ctx, t, amt = 1) => {
    const frame = Math.floor(t * 12), r = F.rng(frame * 7 + 1);
    ctx.save();
    ctx.globalAlpha = 0.18 * amt;
    for (let i = 0; i < 160; i++) { ctx.fillStyle = r() < 0.5 ? '#000' : '#fff'; ctx.fillRect(r() * F.W, r() * F.H, 2 + r() * 3, 2 + r() * 3); }
    ctx.globalAlpha = 0.35 * amt;
    ctx.strokeStyle = '#f5ecd0';
    ctx.lineWidth = 2;
    for (let i = 0; i < 2; i++) if (r() < 0.6) { const x = r() * F.W; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + (r() - 0.5) * 30, F.H); ctx.stroke(); }
    if (!F.reduced) { ctx.globalAlpha = 0.08 * amt * r(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, F.W, F.H); }
    ctx.restore();
  };
  // Color grade the whole frame: 'sepia', 'gray' (bleached imagined future), 'gold' (miracle glow).
  A.grade = (ctx, mode, amt = 1) => {
    if (amt <= 0) return;
    ctx.save();
    if (mode === 'sepia' || mode === 'gray') {
      ctx.globalCompositeOperation = 'saturation';
      ctx.globalAlpha = F.clamp(amt * (mode === 'gray' ? 0.75 : 1), 0, 1);
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, F.W, F.H);
      if (mode === 'sepia') {
        ctx.globalCompositeOperation = 'color';
        ctx.globalAlpha = F.clamp(amt, 0, 1) * 0.55;
        ctx.fillStyle = '#a5743a';
        ctx.fillRect(0, 0, F.W, F.H);
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = amt * 0.12;
        ctx.fillStyle = '#c9ccd1';
        ctx.fillRect(0, 0, F.W, F.H);
      }
    } else if (mode === 'gold') {
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = F.clamp(amt, 0, 1) * 0.7;
      ctx.fillStyle = '#ffb347';
      ctx.fillRect(0, 0, F.W, F.H);
    }
    ctx.restore();
  };
  // The title card, shared by the opening and the end.
  A.titleCard = (ctx, t, o = {}) => {
    const p = o.p == null ? 1 : o.p;
    ctx.fillStyle = o.bg || '#11223f';
    ctx.fillRect(0, 0, F.W, F.H);
    // sunburst
    ctx.save();
    ctx.translate(F.W / 2, F.H * 0.46);
    ctx.rotate(F.reduced ? 0 : t * 0.05);
    for (let i = 0; i < 24; i++) {
      ctx.rotate(Math.PI / 12);
      ctx.fillStyle = i % 2 ? 'rgba(255,207,63,0.10)' : 'rgba(255,207,63,0.04)';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1400, -180); ctx.lineTo(1400, 180); ctx.fill();
    }
    ctx.restore();
    const s = A.popScale(p);
    A.at(ctx, F.W / 2, F.H * 0.4, s, F.wob(t, 1.5, 0.01), (c) => {
      A.text(c, 'FIELD OF SCHEMES', 0, 0, { size: 150, color: '#ffcf3f', stroke: INK, strokeW: 22 });
    });
    const p2 = F.prog(p, 0.4, 1);
    ctx.globalAlpha = p2;
    A.text(ctx, 'A Berkeley Ferry Tale', F.W / 2, F.H * 0.4 + 120, { size: 64, family: A.STORY, weight: 700, style: 'italic', color: '#fff', stroke: INK, strokeW: 10 });
    ctx.globalAlpha = 1;
    if (o.thesis) {
      const q = o.thesisP == null ? 1 : o.thesisP;
      ctx.globalAlpha = q;
      A.text(ctx, F.THESIS[0] + ' ' + F.THESIS[1], F.W / 2, F.H * 0.66, { size: 38, family: A.STORY, weight: 700, color: '#f4efe3' });
      A.text(ctx, F.THESIS[2] + ' ' + F.THESIS[3], F.W / 2, F.H * 0.66 + 54, { size: 38, family: A.STORY, weight: 700, color: '#f4efe3' });
      ctx.globalAlpha = 1;
    }
  };

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.round(F.clamp(v + (amt < 0 ? v * amt : (255 - v) * amt), 0, 255));
    return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('');
  }
  A.shade = shade;
})();
