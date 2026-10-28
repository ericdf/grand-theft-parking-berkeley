'use strict';
// Road network built from G.STREETS (City of Berkeley centerlines, see tools/build-streets.py).
// Provides: nearest-road queries, keep-the-car-on-the-road collision, Dijkstra routing,
// street "chains" for things that travel along a named street, and procedural houses/storefronts.
(function () {
  const D = G.STREETS;
  const HW = { A: 64, C: 54, L: 46 }; // drawn half-widths (exaggerated vs. reality so the car fits)
  const SW = 16; // sidewalk
  const CELL = 200;

  const M = (G.CityMap = { W: D.w, H: D.h, SW, refs: D.refs });

  M.nodes = D.nodes.map(([x, y], i) => ({ i, x, y, roads: [] }));
  M.roads = D.roads.map(([ni, cls, a, b, flat, pci], i) => {
    const pts = [];
    for (let k = 0; k < flat.length; k += 2) pts.push([flat[k], flat[k + 1]]);
    const cum = [0];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let k = 0; k < pts.length; k++) {
      if (k) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
      minX = Math.min(minX, pts[k][0]); maxX = Math.max(maxX, pts[k][0]);
      minY = Math.min(minY, pts[k][1]); maxY = Math.max(maxY, pts[k][1]);
    }
    // pci: Pavement Condition Index from MTC Vital Signs (band midpoint; null where the city has no rating)
    return { i, name: D.names[ni], cls, pci: pci == null ? null : pci, hw: HW[cls], a, b, pts, cum, len: cum[cum.length - 1], bbox: [minX, minY, maxX, maxY], closed: false };
  });
  M.roads.forEach((r) => { M.nodes[r.a].roads.push(r); M.nodes[r.b].roads.push(r); });
  M.nodes.forEach((n) => { n.hw = Math.max(...n.roads.map((r) => r.hw)); n.junction = n.roads.length >= 3; });

  // ---------- spatial hash of road pieces ----------
  const grid = new Map();
  const key = (cx, cy) => cx * 100000 + cy;
  M.roads.forEach((r) => {
    for (let k = 0; k < r.pts.length - 1; k++) {
      const [ax, ay] = r.pts[k], [bx, by] = r.pts[k + 1];
      const pad = r.hw + SW + 4;
      const x0 = Math.floor((Math.min(ax, bx) - pad) / CELL), x1 = Math.floor((Math.max(ax, bx) + pad) / CELL);
      const y0 = Math.floor((Math.min(ay, by) - pad) / CELL), y1 = Math.floor((Math.max(ay, by) + pad) / CELL);
      for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) {
        const kk = key(cx, cy);
        if (!grid.has(kk)) grid.set(kk, []);
        grid.get(kk).push([r, k]);
      }
    }
  });

  function projSeg(x, y, ax, ay, bx, by) {
    const ex = bx - ax, ey = by - ay;
    const l2 = ex * ex + ey * ey || 1;
    const t = G.clamp(((x - ax) * ex + (y - ay) * ey) / l2, 0, 1);
    const px = ax + ex * t, py = ay + ey * t;
    return { t, px, py, d: Math.hypot(x - px, y - py) };
  }

  // Road whose edge is closest (min of distance - halfwidth). Optional name filter.
  M.nearest = function (x, y, name) {
    const list = grid.get(key(Math.floor(x / CELL), Math.floor(y / CELL)));
    let best = null;
    const consider = (r, k) => {
      if (name && r.name !== name) return;
      const [ax, ay] = r.pts[k], [bx, by] = r.pts[k + 1];
      const p = projSeg(x, y, ax, ay, bx, by);
      const e = p.d - r.hw;
      if (!best || e < best.e) best = { road: r, k, t: p.t, px: p.px, py: p.py, d: p.d, e, along: r.cum[k] + (r.cum[k + 1] - r.cum[k]) * p.t };
    };
    if (list) for (const [r, k] of list) consider(r, k);
    if (!best) for (const r of M.roads) for (let k = 0; k < r.pts.length - 1; k++) consider(r, k); // off-map, or named street not in this cell
    return best;
  };

  // Keep a circle of radius `rad` on the asphalt. Returns a hit for G.resolveHit, or null.
  M.roadHit = function (x, y, rad) {
    const n = M.nearest(x, y);
    if (!n) return null;
    const limit = n.road.hw - rad;
    if (n.d <= limit) return null;
    const d = n.d || 1;
    return { nx: (n.px - x) / d, ny: (n.py - y) / d, depth: n.d - limit };
  };

  M.pointAt = function (r, along) {
    along = G.clamp(along, 0, r.len);
    let k = 0;
    while (k < r.cum.length - 2 && r.cum[k + 1] < along) k++;
    const L = r.cum[k + 1] - r.cum[k] || 1;
    const t = (along - r.cum[k]) / L;
    const [ax, ay] = r.pts[k], [bx, by] = r.pts[k + 1];
    return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, dx: (bx - ax) / L, dy: (by - ay) / L };
  };

  // Points along a road between two arc positions, in travel order.
  M.subPath = function (r, a0, a1) {
    const out = [];
    const p0 = M.pointAt(r, a0);
    out.push([p0.x, p0.y]);
    if (a1 >= a0) { for (let k = 1; k < r.pts.length - 1; k++) if (r.cum[k] > a0 && r.cum[k] < a1) out.push(r.pts[k]); }
    else { for (let k = r.pts.length - 2; k >= 1; k--) if (r.cum[k] < a0 && r.cum[k] > a1) out.push(r.pts[k]); }
    const p1 = M.pointAt(r, a1);
    out.push([p1.x, p1.y]);
    return out;
  };

  M.snap = function (pt, name) {
    const n = M.nearest(pt[0], pt[1], name);
    return n;
  };

  // ---------- routing ----------
  M.route = function (cx, cy, tx, ty) {
    const cn = M.nearest(cx, cy), tn = M.nearest(tx, ty);
    if (!cn || !tn) return null;
    const blockedBetween = (r, a0, a1) => r.closed && (r.closureAt - a0) * (r.closureAt - a1) < 0;
    if (cn.road === tn.road && !blockedBetween(cn.road, cn.along, tn.along)) {
      return [[cx, cy], ...M.subPath(cn.road, cn.along, tn.along), [tx, ty]];
    }
    const N = M.nodes.length;
    const dist = new Float64Array(N).fill(Infinity);
    const via = new Array(N).fill(null);
    const done = new Uint8Array(N);
    const tr = tn.road;
    if (!blockedBetween(tr, tn.along, 0)) dist[tr.a] = tn.along;
    if (!blockedBetween(tr, tn.along, tr.len)) dist[tr.b] = tr.len - tn.along;
    // simple O(N^2) Dijkstra; ~500 nodes is fine at a few Hz
    for (;;) {
      let u = -1, du = Infinity;
      for (let k = 0; k < N; k++) if (!done[k] && dist[k] < du) { du = dist[k]; u = k; }
      if (u < 0) break;
      done[u] = 1;
      for (const r of M.nodes[u].roads) {
        if (r.closed || r === tr) continue;
        const v = r.a === u ? r.b : r.a;
        const nd = du + r.len * (r.penalty || 1);
        if (nd < dist[v]) { dist[v] = nd; via[v] = { road: r, to: u }; }
      }
    }
    const cr = cn.road;
    const opts = [];
    if (!blockedBetween(cr, cn.along, 0)) opts.push({ node: cr.a, cost: cn.along + dist[cr.a], end: 0 });
    if (!blockedBetween(cr, cn.along, cr.len)) opts.push({ node: cr.b, cost: cr.len - cn.along + dist[cr.b], end: cr.len });
    opts.sort((p, q) => p.cost - q.cost);
    if (!opts.length || !isFinite(opts[0].cost)) return null;
    const path = [[cx, cy], ...M.subPath(cr, cn.along, opts[0].end)];
    let u = opts[0].node, guard = 0;
    while (via[u] && guard++ < 400) {
      const { road, to } = via[u];
      path.push(...(road.a === u ? M.subPath(road, 0, road.len) : M.subPath(road, road.len, 0)));
      u = to;
    }
    path.push(...M.subPath(tr, u === tr.a ? 0 : tr.len, tn.along), [tx, ty]);
    return path;
  };

  // Point a given distance along a polyline path.
  M.pathAhead = function (path, dist) {
    for (let k = 0; k < path.length - 1; k++) {
      const [ax, ay] = path[k], [bx, by] = path[k + 1];
      const L = Math.hypot(bx - ax, by - ay);
      if (dist <= L) return [ax + ((bx - ax) * dist) / (L || 1), ay + ((by - ay) * dist) / (L || 1)];
      dist -= L;
    }
    return path[path.length - 1];
  };

  // ---------- street chains (for cyclists, cones, the Hopkins heist) ----------
  // Follows roads with one name from the node nearest `start`, preferring the straightest continuation.
  M.chain = function (name, start, dirHint) {
    const n0 = M.nearest(start[0], start[1], name);
    if (!n0) return null;
    let r = n0.road;
    let fromNode;
    if (dirHint) {
      const pa = M.nodes[r.a], pb = M.nodes[r.b];
      fromNode = (pb.x - pa.x) * dirHint[0] + (pb.y - pa.y) * dirHint[1] >= 0 ? r.a : r.b;
    } else fromNode = r.a;
    // walk backwards first so the chain covers the whole street through the start point
    const pts = [];
    const used = new Set();
    let node = fromNode, cur = r;
    const segs = [];
    while (cur && !used.has(cur)) {
      used.add(cur);
      const fwd = cur.a === node;
      segs.push({ r: cur, fwd });
      node = fwd ? cur.b : cur.a;
      const here = M.nodes[node];
      const last = fwd ? cur.pts[cur.pts.length - 2] : cur.pts[1];
      const inDir = [here.x - last[0], here.y - last[1]];
      let best = null, bestDot = -Infinity;
      for (const nr of here.roads) {
        if (nr.name !== name || used.has(nr)) continue;
        const nxt = nr.a === node ? nr.pts[1] : nr.pts[nr.pts.length - 2];
        const v = [nxt[0] - here.x, nxt[1] - here.y];
        const dot = (v[0] * inDir[0] + v[1] * inDir[1]) / (Math.hypot(...v) * Math.hypot(...inDir) || 1);
        if (dot > bestDot) { bestDot = dot; best = nr; }
      }
      cur = best;
    }
    segs.forEach(({ r: sr, fwd }) => {
      const p = fwd ? sr.pts : sr.pts.slice().reverse();
      p.forEach((q, k) => { if (k || !pts.length) pts.push(q); });
    });
    return M.makePath(pts);
  };

  M.makePath = function (pts) {
    const cum = [0];
    for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
    return { pts, cum, len: cum[cum.length - 1] };
  };
  M.pathPoint = function (p, s) {
    s = G.clamp(s, 0, p.len);
    let k = 0;
    while (k < p.cum.length - 2 && p.cum[k + 1] < s) k++;
    const L = p.cum[k + 1] - p.cum[k] || 1;
    const t = (s - p.cum[k]) / L;
    const [ax, ay] = p.pts[k], [bx, by] = p.pts[k + 1];
    return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, dx: (bx - ax) / L, dy: (by - ay) / L };
  };
  M.pathProject = function (p, x, y) {
    let best = null;
    for (let k = 0; k < p.pts.length - 1; k++) {
      const q = projSeg(x, y, p.pts[k][0], p.pts[k][1], p.pts[k + 1][0], p.pts[k + 1][1]);
      if (!best || q.d < best.d) best = { d: q.d, s: p.cum[k] + (p.cum[k + 1] - p.cum[k]) * q.t };
    }
    return best;
  };

  // ---------- landmark blocks (real corners from the data) ----------
  const R = D.refs;
  const shrink = (poly, by) => {
    const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length, cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
    return poly.map(([x, y]) => {
      const dx = cx - x, dy = cy - y, L = Math.hypot(dx, dy) || 1;
      return [x + (dx / L) * by, y + (dy / L) * by];
    });
  };
  const och4 = [R.mckinleyAllston[0] + (R.mlkCenter[0] - R.mlkAllston[0]), R.mckinleyAllston[1] + (R.mlkCenter[1] - R.mlkAllston[1])];
  M.zones = {
    park: shrink([R.mlkCenter, R.milviaCenter, R.milvaAllston, R.mlkAllston], 95),
    bhs: shrink([R.mlkAllston, R.milvaAllston, R.milviaChanning, R.mlkChanning], 95),
    oldCityHall: shrink([och4, R.mlkCenter, R.mlkAllston, R.mckinleyAllston], 88),
  };
  M.zoneCenter = (z) => [z.reduce((s, p) => s + p[0], 0) / z.length, z.reduce((s, p) => s + p[1], 0) / z.length];
  const inZone = (x, y, pad) => Object.values(M.zones).some((z) => G.pointInPoly(x, y, pad ? shrink(z, -pad) : z));

  // ---------- storefronts (geocoded business licenses) and houses ----------
  const CAT_ORDER = { food: 0, shop: 1, svc: 2 };
  const AWN = { food: ['#d62828', '#e85d04', '#2a9d8f'], shop: ['#264653', '#8e44ad', '#1d6fe0'], svc: ['#6c757d', '#e9c46a', '#b5838d'] };
  M.chunks = new Map();
  const CH = 512;
  const addToChunk = (item) => {
    const kk = key(Math.floor(item.x / CH), Math.floor(item.y / CH));
    if (!M.chunks.has(kk)) M.chunks.set(kk, []);
    M.chunks.get(kk).push(item);
  };
  M.chunkItems = function (x0, y0, x1, y1, fn) {
    for (let cx = Math.floor(x0 / CH) - 1; cx <= Math.floor(x1 / CH); cx++)
      for (let cy = Math.floor(y0 / CH) - 1; cy <= Math.floor(y1 / CH); cy++) {
        const list = M.chunks.get(key(cx, cy));
        if (list) for (const it of list) fn(it);
      }
  };

  M.reserve = []; // [x, y, r] spots kept clear of procedural scenery

  // ---------- Hopkins at Monterey/California, laid out by hand ----------
  // The license data puts five shops side by side on the south side of Hopkins between California and
  // McGee: too close together to survive the overlap pass below, so they are packed here as one row,
  // with signs on three of them. Across California: Monterey Market behind its corner parking lot, which
  // is full. Catty-corner, north of Hopkins: Espresso Roma (1549 Hopkins; not in the license data).
  const ROW = [
    { name: 'MAGNANIS POULTRY', w: 28, label: 'MAGNANI POULTRY' },
    { name: 'ASAKA SUSHI & BAR', w: 16, sign: false },
    { name: 'MONTEREY FISH MARKET', w: 28 },
    { name: 'HOPKINS BAKERY', w: 14, sign: false },
    { name: 'GIOIA PIZZERIA', w: 30 },
  ];
  const LOT_CARS = ['#c0392b', '#2c3e50', '#7f8c8d', '#ecf0f1', '#16a085', '#34495e', '#d35400', '#8e44ad', '#bdc3c7', '#f1c40f'];
  function layoutCorner(stores, rng) {
    const skip = new Set();
    const node = M.nodes.findIndex((n) => ['HOPKINS ST', 'CALIFORNIA ST', 'MONTEREY AVE'].every((nm) => n.roads.some((r) => r.name === nm)));
    if (node < 0) return skip;
    const N = M.nodes[node];
    const hop = M.chain('HOPKINS ST', R.hopkinsSacramento, [R.hopkinsMonterey[0] - R.hopkinsSacramento[0], R.hopkinsMonterey[1] - R.hopkinsSacramento[1]]);
    if (!hop) return skip;
    const sc = M.pathProject(hop, N.x, N.y).s;
    const east = M.pathPoint(hop, sc + 10).x > N.x ? 1 : -1, west = -east;
    // a point on Hopkins `s` px east (dir 1) or west (dir -1) of the corner, and the unit normal
    // toward `toward` (+1 south, -1 north)
    const frame = (dir, s, toward) => {
      const p = M.pathPoint(hop, sc + dir * s);
      const nx = -p.dy * Math.sign(p.dx || 1) * toward, ny = Math.abs(p.dx) * toward;
      return { x: p.x, y: p.y, nx, ny };
    };
    const at = (r, s, toward, lat) => { const f = frame(r, s, toward); return [f.x + f.nx * lat, f.y + f.ny * lat]; };
    const HW = N.roads.find((r) => r.name === 'HOPKINS ST').hw;
    const setback = () => HW + SW + 5;
    const biz = new Map(D.businesses.map((b) => [b[0], b]));
    const store = (r, s, toward, o) => {
      const f = frame(r, s, toward), off = setback(r) + o.d / 2, cat = (biz.get(o.name) || [])[5] || 'food';
      skip.add(o.name);
      if (o.label) o = Object.assign({}, o, { name: o.label });
      stores.push(Object.assign({ kind: 'store', big: false, x: f.x + f.nx * off, y: f.y + f.ny * off, a: Math.atan2(f.nx, -f.ny), nx: f.nx, ny: f.ny,
        cat, awning: G.pick(AWN[cat], rng), roof: '#9c8a7a', h: 30 }, o));
    };
    // Gioia's row, west to east from just past California
    let s = 40;
    for (const u of ROW) { store(east, s + u.w / 2, 1, Object.assign({ d: 40, h: 32 }, u)); s += u.w; }
    // Monterey Market, west of its lot; Espresso Roma across Hopkins
    store(west, 262, 1, { name: 'MONTEREY MARKET', w: 80, d: 64, h: 40, big: true, landmark: true, roof: '#8d6e63' });
    store(west, 90, -1, { name: 'ESPRESSO ROMA', w: 36, d: 38, awning: '#2a9d8f' });
    // the lot: from the market to California's sidewalk, full
    const L0 = setback() - 3, L1 = L0 + 112, LW = 218;
    // walk from the market toward the corner until California's sidewalk
    const clearOfCalifornia = (lat) => {
      for (let k = LW; k > 0; k -= 2) {
        const [x, y] = at(west, k, 1, lat), n = M.nearest(x, y, 'CALIFORNIA ST');
        if (n && n.e < SW + 2) return k + 2;
      }
      return 0;
    };
    const e0 = clearOfCalifornia(L0), e1 = clearOfCalifornia(L1);
    const lot = [at(west, e0, 1, L0), at(west, LW, 1, L0), at(west, LW, 1, L1), at(west, e1, 1, L1)];
    M.zones.lot = lot;
    M.lotLines = [];
    for (const lat of [L0 + 25, L1 - 25]) {
      for (let k = 14; k < LW; k += 28) {
        const f = frame(west, k, 1), x = f.x + f.nx * lat, y = f.y + f.ny * lat, a = Math.atan2(f.nx, -f.ny);
        const c = Math.cos(a), sn = Math.sin(a);
        const corners = [[-13, -23], [13, -23], [13, 23], [-13, 23]].map(([lx, ly]) => [x + lx * c - ly * sn, y + lx * sn + ly * c]);
        if (!corners.every(([cx, cy]) => G.pointInPoly(cx, cy, lot))) continue;
        addToChunk({ kind: 'lotcar', x, y, a, color: G.pick(LOT_CARS, rng) });
        for (const side of [-14, 14]) M.lotLines.push([at(west, k + side, 1, lat - 23), at(west, k + side, 1, lat + 23)]);
      }
    }
    M.lotSign = at(west, LW - 6, 1, L0 - 8);
    return skip;
  }

  M.buildScenery = function () {
    const rng = G.mulberry32(1906);
    M.chunks.clear();
    const stores = [];
    const handPlaced = layoutCorner(stores, rng);
    // Gioia first: it's the destination, so it must win any overlap with its neighbors
    const rank = (b) => (b[0].startsWith('GIOIA') ? -1 : CAT_ORDER[b[5]]);
    const biz = D.businesses.slice().sort((a, b) => rank(a) - rank(b));
    for (const [name, bx, by, nx, ny, cat] of biz) {
      if (handPlaced.has(name)) continue;
      const n = M.nearest(bx, by);
      if (!n) continue;
      const off = n.road.hw + SW + 24;
      const x = bx + nx * off, y = by + ny * off;
      if (inZone(x, y, 20)) continue;
      if (M.reserve.some(([rx, ry, rr]) => G.dist(x, y, rx, ry) < rr)) continue;
      if (stores.some((s) => G.dist(s.x, s.y, x, y) < 44)) continue;
      const onRoad = M.nearest(x, y);
      if (onRoad && onRoad.e < 6) continue; // corner lot spilling onto the cross street
      const big = /^(TRADER JOE|MONTEREY MARKET|BERKELEY BOWL|SAFEWAY|WHOLE FOODS|ANDRONICO)/.test(name);
      stores.push({ kind: 'store', big, x, y, a: Math.atan2(nx, -ny), nx, ny, name, cat, awning: G.pick(AWN[cat], rng), roof: G.pick(['#a9746e', '#8d6e63', '#b08968', '#7f8c8d', '#c9ada7'], rng) });
    }
    stores.forEach(addToChunk);
    M.stores = stores;
    const ROOFS = ['#b5654a', '#8d6e63', '#6d7f8c', '#a9746e', '#7b8f6a', '#9c8a7a', '#c08552', '#5f6b7a'];
    for (let y = 20; y < M.H; y += 54) {
      for (let x = 20; x < M.W; x += 54) {
        const px = x + (rng() - 0.5) * 16, py = y + (rng() - 0.5) * 16;
        const n = M.nearest(px, py);
        if (!n) continue;
        const e = n.d - n.road.hw;
        if (e < SW + 22) continue;
        if (inZone(px, py, 30)) continue;
        if (stores.some((s) => Math.abs(s.x - px) < 46 && Math.abs(s.y - py) < 46)) continue;
        if (M.reserve.some(([rx, ry, rr]) => G.dist(px, py, rx, ry) < rr)) continue;
        const k = M.pointAt(n.road, n.along);
        const a = Math.atan2(k.dy, k.dx);
        if (e < SW + 62) {
          addToChunk({ kind: 'house', x: px, y: py, a, w: 34 + rng() * 12, h: 28 + rng() * 10, color: G.pick(ROOFS, rng), big: n.road.cls === 'A' && rng() < 0.5 });
        } else if (rng() < 0.45) {
          addToChunk({ kind: 'tree', x: px, y: py, r: 12 + rng() * 10, hue: rng() < 0.5 ? 1 : 0 });
        }
      }
    }
  };
})();
