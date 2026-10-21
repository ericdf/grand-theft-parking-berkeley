'use strict';
// Shared namespace, math helpers, collision helpers, settings and run stats.
const G = (window.G = window.G || {});

G.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
G.lerp = (a, b, t) => a + (b - a) * t;
G.smoothstep = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
G.dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
G.wrapAngle = (a) => {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};
G.mulberry32 = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
G.pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
G.shuffle = (arr, r = Math.random) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
G.fmtTime = (s) => {
  s = Math.max(0, Math.ceil(s));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};
G.numberWord = (n) =>
  ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN',
    'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN'][n] || String(n);

// ---------- collision ----------
// Circle vs axis-aligned rect. Returns {nx, ny, depth} pushing the circle out, or null.
G.circleRect = (cx, cy, r, rx, ry, rw, rh) => {
  const px = G.clamp(cx, rx, rx + rw);
  const py = G.clamp(cy, ry, ry + rh);
  const dx = cx - px, dy = cy - py;
  const d2 = dx * dx + dy * dy;
  if (d2 > r * r) return null;
  if (d2 > 1e-6) {
    const d = Math.sqrt(d2);
    return { nx: dx / d, ny: dy / d, depth: r - d };
  }
  const l = cx - rx, rr = rx + rw - cx, t = cy - ry, b = ry + rh - cy;
  const m = Math.min(l, rr, t, b);
  if (m === l) return { nx: -1, ny: 0, depth: l + r };
  if (m === rr) return { nx: 1, ny: 0, depth: rr + r };
  if (m === t) return { nx: 0, ny: -1, depth: t + r };
  return { nx: 0, ny: 1, depth: b + r };
};

G.pointInPoly = (x, y, pts) => {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

// Circle vs simple polygon ([[x,y],...]).
G.circlePoly = (cx, cy, r, pts) => {
  let best = Infinity, bx = 0, by = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const ex = b[0] - a[0], ey = b[1] - a[1];
    const len2 = ex * ex + ey * ey || 1;
    const t = G.clamp(((cx - a[0]) * ex + (cy - a[1]) * ey) / len2, 0, 1);
    const px = a[0] + ex * t, py = a[1] + ey * t;
    const d2 = (cx - px) ** 2 + (cy - py) ** 2;
    if (d2 < best) { best = d2; bx = px; by = py; }
  }
  const inside = G.pointInPoly(cx, cy, pts);
  const d = Math.sqrt(best);
  if (!inside && d >= r) return null;
  let nx = cx - bx, ny = cy - by;
  const len = Math.hypot(nx, ny) || 1;
  nx /= len; ny /= len;
  if (inside) return { nx: -nx, ny: -ny, depth: d + r };
  return { nx, ny, depth: r - d };
};

// Push a body out of a contact and bounce its velocity. Returns impact speed.
G.resolveHit = (body, hit, restitution = 0.35) => {
  body.x += hit.nx * hit.depth;
  body.y += hit.ny * hit.depth;
  const vn = body.vx * hit.nx + body.vy * hit.ny;
  if (vn < 0) {
    body.vx -= (1 + restitution) * vn * hit.nx;
    body.vy -= (1 + restitution) * vn * hit.ny;
    body.vx *= 0.92;
    body.vy *= 0.92;
    return -vn;
  }
  return 0;
};

// ---------- settings (per-viewer conveniences only) ----------
const SETTINGS_KEY = 'gtpb-settings-v1';
const prefersReduced = (() => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
})();
G.settings = {
  muted: false,
  music: 0.5,
  sfx: 0.8,
  reducedMotion: prefersReduced,
  radio: true,
  hazards: true,
  minimap: true,
  view: 'top', // 'top' or 'fp' (first person, city only)
};
try {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (raw) Object.assign(G.settings, JSON.parse(raw));
} catch (e) { /* storage unavailable: defaults are fine */ }
G.saveSettings = () => {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(G.settings)); } catch (e) { /* ignore */ }
};

// ---------- run stats ----------
G.newStats = () => ({
  committees: 0,
  committeeNames: [],
  parkingFound: 0,
  slices: 0,
  potholes: 0,
  maxAir: 0,
  bestChain: 0,
  slalomScore: 0,
  stars: 0,
  cones: 0,
  parkingYears: 47,
  startedAt: Date.now(),
});
G.cloneStats = (s) => JSON.parse(JSON.stringify(s));
G.stats = G.newStats();

G.formCommittee = (name) => {
  G.stats.committees++;
  G.stats.committeeNames.push(name);
  G.hud.toast('COMMITTEE FORMED: ' + name, { color: '#9be7ff', icon: 'committee' });
};

G.addStar = (reason) => {
  if (G.stats.stars >= 5) return;
  G.stats.stars++;
  G.hud.starsFlash = 2;
  G.hud.toast('BUREAUCRACY LEVEL UP — ' + reason, { color: '#ffd23f' });
  G.audio.play('stamp');
};

G.params = new URLSearchParams(location.search);
if (G.params.get('view') === 'fp' || G.params.get('view') === 'top') G.settings.view = G.params.get('view');
