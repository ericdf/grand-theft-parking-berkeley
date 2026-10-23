'use strict';
// Field of Schemes — shared namespace, timing math and the scene registry.
// Every scene renders as a pure function of its local time, so scrubbing and
// scene jumps always land on the right picture.
const F = (window.F = window.F || {});

F.W = 1920;
F.H = 1080;

F.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
F.lerp = (a, b, t) => a + (b - a) * t;
F.mix = (a, b, t) => a + (b - a) * F.clamp(t, 0, 1);

// ---------- easing ----------
F.ease = {
  linear: (t) => t,
  in: (t) => t * t,
  out: (t) => 1 - (1 - t) * (1 - t),
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  outBack: (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  outElastic: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
  outBounce: (t) => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  },
};

// 0..1 progress of t through [a, b], eased.
F.prog = (t, a, b, ease) => {
  const p = F.clamp((t - a) / (b - a || 1e-6), 0, 1);
  return ease ? (typeof ease === 'string' ? F.ease[ease] : ease)(p) : p;
};
// 0..1 up over [a, a+fade], hold, back down over [b-fade, b].
F.window = (t, a, b, fade = 0.4) => Math.min(F.prog(t, a, a + fade), 1 - F.prog(t, b - fade, b));
F.on = (t, a, b) => t >= a && (b === undefined || t < b);
// a periodic wobble that respects reduced motion
F.wob = (t, speed = 1, amt = 1) => (F.reduced ? 0 : Math.sin(t * speed) * amt);
// seeded randomness, reseeded every frame so pictures never flicker
F.rng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
  return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
};
F.fmt = (s) => {
  s = Math.max(0, Math.floor(s));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};

// ---------- scenes ----------
// F.SCRIPT (js/script.js) holds the words and timings; renderers register here by id.
F.renderers = {};
F.scene = (id, draw) => { F.renderers[id] = draw; };

// Who is talking at local time t in a scene: returns 0..1 mouth-flap amount.
F.talking = (scene, who, t) => {
  for (const c of scene.cues) {
    if (c.who !== who || !('text' in c) || c.kind === 'sfx') continue;
    if (t >= c.at && t < c.at + c.dur) return F.reduced ? 0.5 : 0.5 + 0.5 * Math.sin(t * 22 + c.at);
  }
  return 0;
};
