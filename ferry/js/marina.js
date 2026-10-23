'use strict';
// The Berkeley Marina as a cartoon bird's-eye view, drawn from real shapes (js/marina-geo.js):
// City street centerlines plus OpenStreetMap coastline, docks, breakwaters, parks and lots.
// A simple perspective camera hangs over the Bay looking east, so the Berkeley hills sit on the
// horizon and I-80 runs behind the Marina. Scenes move the camera and place sprites with project().
(function () {
  const A = F.art, INK = A.INK, GEO = F.GEO;
  const M = (F.marina = {});

  // Handy named spots (metres; x east, y north from the harbor origin).
  const PL = GEO.places;
  M.places = Object.assign({}, PL, {
    ssb: [420, -470],               // South Sailing Basin, open water
    ssbShore: [330, -330],          // its north shore, by Shorebird Park and the South Cove lots
    seawallLot: [110, -470],        // the waterside parking along Seawall Drive
    harbor: [40, 160],
    harborMouth: [-330, 260],
    universityI80: [1080, 70],
    terminal: [-420, -470],         // the proposed terminal site, at the foot of the old pier
    pierEnd: [-1350, -870],         // where the new 1,080-foot pier would reach (approx., for the cartoon)
  });

  // Camera: { x, y } ground focus, back (m behind focus), h (m altitude), yaw (rad; 0 looks east), fov
  M.cam = (o = {}) => Object.assign({ x: 150, y: -60, back: 1700, h: 900, yaw: 0, fov: 0.95 }, o);
  M.lerpCam = (a, b, t) => {
    const out = {};
    for (const k in a) out[k] = F.lerp(a[k], b[k] == null ? a[k] : b[k], t);
    return out;
  };

  function setup(cam) {
    const fx = Math.cos(cam.yaw), fy = Math.sin(cam.yaw);
    const rx = Math.sin(cam.yaw), ry = -Math.cos(cam.yaw); // looking east, right is south
    const cx = cam.x - fx * cam.back, cy = cam.y - fy * cam.back;
    const p = Math.atan2(cam.h, cam.back);
    const focal = F.W / 2 / Math.tan(cam.fov / 2);
    return { fx, fy, rx, ry, cx, cy, h: cam.h, cp: Math.cos(p), sp: Math.sin(p), focal };
  }
  // world → camera space (u right, v up, z depth)
  function toCam(S, x, y, z = 0) {
    const dx = x - S.cx, dy = y - S.cy;
    const d = dx * S.fx + dy * S.fy, u = dx * S.rx + dy * S.ry, v = z - S.h;
    return [u, d * S.sp + v * S.cp, d * S.cp - v * S.sp];
  }
  const NEAR = 30;
  function scr(S, c) { return [F.W / 2 + (c[0] * S.focal) / c[2], F.H / 2 - (c[1] * S.focal) / c[2]]; }
  // project a ground polyline/polygon, clipping against the near plane
  function projPts(S, pts, closed, z = 0) {
    const cs = pts.map((p) => toCam(S, p[0], p[1], p[2] == null ? z : p[2]));
    const out = [];
    const n = cs.length;
    for (let i = 0; i < n; i++) {
      const a = cs[i], b = cs[(i + 1) % n];
      if (a[2] >= NEAR) out.push(scr(S, a));
      if (!closed && i === n - 1) break;
      if ((a[2] >= NEAR) !== (b[2] >= NEAR)) {
        const t = (NEAR - a[2]) / (b[2] - a[2]);
        out.push(scr(S, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]));
      }
    }
    return out;
  }
  // Public: project a world point. Returns {x, y, s (px per metre), z (depth)} or null if behind.
  M.project = (cam, x, y, z = 0) => {
    const S = setup(cam);
    const c = toCam(S, x, y, z);
    if (c[2] < NEAR) return null;
    const [sx, sy] = scr(S, c);
    return { x: sx, y: sy, s: S.focal / c[2], z: c[2] };
  };
  M.horizonY = (cam) => {
    const S = setup(cam);
    return F.H / 2 - S.focal * (S.sp / S.cp);
  };

  const fillPoly = (ctx, pts, fill, lw, stroke) => {
    if (pts.length < 3) return;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke || INK; ctx.lineJoin = 'round'; ctx.stroke(); }
  };
  const strokeLine = (ctx, pts, color, lw) => {
    if (pts.length < 2) return;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  };

  // Palettes: 'bright' (today), 'bleak' (the imagined future; the grade does the rest)
  M.PALETTES = {
    bright: { water: '#2f84c9', water2: '#3b93d6', land: '#c9d79a', park: '#79c25a', park2: '#5da94a', lot: '#8b8d95', lotLine: '#e8e8e8', road: '#6d6f78', fwy: '#575962', bld: '#e8dcc4', bldWall: '#b7a88c', roof2: '#d8c7a6', dock: '#f4ecd8', hills: '#86ac7f', hillsFar: '#a9c2b0', city: '#d9cdb5' },
  };

  // Draw the map. o: { t, pal, lots: fn(lot) → fill override, hideNames, roadsOnly, extra: fn(ctx, cam) drawn after ground }
  M.draw = (ctx, cam, o = {}) => {
    const S = setup(cam);
    const pal = Object.assign({}, M.PALETTES.bright, o.pal);
    const t = o.t || 0;
    const hy = M.horizonY(cam);
    // sky
    A.sky(ctx, o.skyTop || '#2f7fd1', o.skyLow || '#cbe8ff', 0, Math.max(10, hy + 4));
    if (o.cirrus !== false) A.cirrus(ctx, t, 3, 0.5, Math.max(40, hy - 120));
    // water everywhere below the horizon
    ctx.fillStyle = pal.water;
    ctx.fillRect(0, hy, F.W, F.H - hy);
    // far hills and the flatlands behind the freeway (out past the data's edge)
    drawHills(ctx, S, pal);
    // water texture: wave ticks on a world grid
    waves(ctx, S, cam, t, pal);
    // land
    fillPoly(ctx, projPts(S, GEO.land, true), pal.land, 5);
    GEO.ponds.forEach((p) => fillPoly(ctx, projPts(S, p, true), pal.water2, 3));
    GEO.parks.forEach((p) => fillPoly(ctx, projPts(S, p.p, true), pal.park, 0));
    // lots
    GEO.lots.forEach((lot, i) => {
      const fill = (o.lotFill && o.lotFill(lot, i)) || pal.lot;
      fillPoly(ctx, projPts(S, lot.p, true), fill, 2.5, 'rgba(29,26,36,0.55)');
    });
    // roads: draw each segment with a width that follows depth
    const roadW = (k) => (k === 'fwy' ? 26 : k === 'art' ? 16 : k === 'ramp' ? 9 : 10);
    for (const pass of [0, 1]) {
      for (const r of GEO.roads) {
        const cs = r.p.map((p) => toCam(S, p[0], p[1], 0));
        for (let i = 0; i < cs.length - 1; i++) {
          const a = cs[i], b = cs[i + 1];
          if (a[2] < NEAR || b[2] < NEAR) continue;
          const z = (a[2] + b[2]) / 2, w = (roadW(r.k) * S.focal) / z;
          if (w < 0.6) continue;
          const pa = scr(S, a), pb = scr(S, b);
          ctx.beginPath();
          ctx.moveTo(pa[0], pa[1]);
          ctx.lineTo(pb[0], pb[1]);
          ctx.lineCap = 'round';
          ctx.lineWidth = pass ? w : w + Math.max(2, w * 0.35);
          ctx.strokeStyle = pass ? (r.k === 'fwy' ? pal.fwy : pal.road) : INK;
          ctx.stroke();
        }
      }
    }
    // docks and breakwaters
    GEO.docks.forEach((d) => {
      const pts = projPts(S, d.p, d.closed, 0.5);
      if (d.closed) fillPoly(ctx, pts, pal.dock, 1.5);
      else strokeLine(ctx, pts, pal.dock, Math.max(1.5, (2.4 * S.focal) / depthOf(S, d.p[0])));
    });
    GEO.breakwaters.forEach((b) => {
      const pts = projPts(S, b, false, 0);
      const w = Math.max(3, (9 * S.focal) / depthOf(S, b[0]));
      strokeLine(ctx, pts, INK, w + 4);
      strokeLine(ctx, pts, '#9a948c', w);
    });
    // the old Berkeley Pier (a long line out into the Bay) and Skates' deck
    GEO.piers.forEach((p) => {
      if (p.line) {
        if (o.hideOldPier) return;
        const pts = projPts(S, p.p, false, 2);
        const w = Math.max(2, (6 * S.focal) / depthOf(S, p.p[0]));
        strokeLine(ctx, pts, INK, w + 3);
        strokeLine(ctx, pts, '#c8b58f', w);
      } else fillPoly(ctx, projPts(S, p.p, true, 2), '#c8b58f', 3);
    });
    if (o.ground) o.ground(ctx, cam, S);
    // buildings, far to near, extruded
    const blds = GEO.buildings.map((b) => ({ b, z: depthOf(S, b.p[0]) })).filter((e) => e.z > NEAR).sort((a, b) => b.z - a.z);
    blds.forEach(({ b }) => building(ctx, S, b, pal, o));
    if (o.after) o.after(ctx, cam, S);
  };

  function depthOf(S, p) { return toCam(S, p[0], p[1], 0)[2]; }

  function building(ctx, S, b, pal, o) {
    const hgt = b.name && /DoubleTree|Bayview|hotel/i.test(b.name) ? 16 : b.name === 'Skates on the Bay' ? 7 : 6;
    const base = projPts(S, b.p, true, 0), roof = projPts(S, b.p, true, hgt);
    if (base.length < 3 || roof.length < 3 || base.length !== roof.length) return;
    const dark = o.dark && o.dark(b);
    // walls: quads between base and roof edges
    for (let i = 0; i < base.length; i++) {
      const j = (i + 1) % base.length;
      fillPoly(ctx, [base[i], base[j], roof[j], roof[i]], dark ? '#6f6f78' : pal.bldWall, 2);
    }
    fillPoly(ctx, roof, dark ? '#8a8a92' : pal.bld, 2.5);
  }

  function waves(ctx, S, cam, t, pal) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineCap = 'round';
    const r = F.rng(77);
    const span = 3200;
    for (let i = 0; i < 140; i++) {
      const wx = cam.x - span * 0.6 + r() * span * 1.1, wy = cam.y - span / 2 + r() * span;
      if (insideLand(wx, wy)) continue;
      const c = toCam(S, wx + Math.sin(t * 0.6 + i) * 6, wy, 0);
      if (c[2] < NEAR) continue;
      const [x, y] = scr(S, c), k = S.focal / c[2];
      const L = 14 * k;
      if (L < 2) continue;
      ctx.lineWidth = Math.max(1.2, 2.2 * k);
      ctx.beginPath();
      ctx.moveTo(x - L, y);
      ctx.quadraticCurveTo(x - L / 2, y - L * 0.35, x, y);
      ctx.quadraticCurveTo(x + L / 2, y + L * 0.35, x + L, y);
      ctx.stroke();
    }
    ctx.restore();
  }
  // point-in-land (for keeping waves and boats off the shore)
  const insideLand = (M.onLand = (x, y) => {
    const pts = GEO.land;
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  });

  function drawHills(ctx, S, pal) {
    // flatlands: a big land slab east of the data out to the hills
    const flat = projPts(S, [[1500, -6000], [9000, -6000], [9000, 6000], [1500, 6000]], true, 0);
    fillPoly(ctx, flat, pal.city, 0);
    // city blocks suggested by a regular grid of little roofs
    const r = F.rng(13);
    for (let gx = 1650; gx < 5200; gx += 140) {
      for (let gy = -2600; gy < 2600; gy += 140) {
        const c = toCam(S, gx + r() * 40, gy + r() * 40, 0);
        if (c[2] < NEAR) continue;
        const [x, y] = scr(S, c), k = S.focal / c[2];
        if (k < 0.012) continue;
        ctx.fillStyle = r() < 0.5 ? '#c7b593' : '#e6dcc6';
        ctx.fillRect(x - 30 * k, y - 18 * k, 60 * k, 22 * k);
      }
    }
    // the hills: a ridge about 5–6 km east, a few hundred metres up
    const ridge = [];
    for (let i = 0; i <= 40; i++) {
      const y = -9000 + (18000 * i) / 40;
      const hgt = 260 + 140 * Math.sin(i * 0.55 + 0.7) + 60 * Math.sin(i * 1.7);
      ridge.push([5600 + 300 * Math.sin(i * 0.4), y, hgt]);
    }
    const ridgeBack = ridge.map(([x, y, h]) => [x + 1800, y, h * 1.25]);
    const back = projPts(S, ridgeBack.concat([[11000, 9000, 0], [11000, -9000, 0]]), true);
    fillPoly(ctx, back, pal.hillsFar, 3);
    const front = projPts(S, ridge.concat([[5600, 9000, -40], [5600, -9000, -40]]), true);
    fillPoly(ctx, front, pal.hills, 4);
  }

  // A small boat/figure placed in the world: returns screen pos + scale for sprite helpers
  M.place = (cam, x, y, z = 0) => M.project(cam, x, y, z);

  // A labelled pin for a landmark (signboard on a pole), scaled with distance but kept legible.
  M.pin = (ctx, cam, x, y, text, o = {}) => {
    const p = M.project(cam, x, y, o.z || 12);
    if (!p) return;
    const s = F.clamp(p.s * (o.k || 9), 0.5, 1.1);
    A.at(ctx, p.x, p.y, s, 0, (c) => {
      A.line(c, [[0, 0], [0, -70]], INK, 6);
      c.font = A.font(28);
      const w = c.measureText(text).width + 30;
      A.box(c, -w / 2, -124, w, 54, o.bg || '#fffbea', { r: 10, lw: 5 });
      A.text(c, text, 0, -96, { size: 28, color: o.color || INK });
    });
  };
})();
