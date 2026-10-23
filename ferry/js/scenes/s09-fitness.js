'use strict';
// Scene 9 — The Waterfront Fitness Challenge (a hypothetical future). The lots by the South
// Sailing Basin fill with ferry parking; a meter springs to life; the windsurfer hauls a rig a very
// long way, the wing foiler is blown backward, the swimmer shivers at the meter, a sailor drags
// gear; the wind dies just as the windsurfer reaches the water.
// The ground-level set is the waterside lot along Seawall Drive: riprap at the water's edge, the
// SF skyline and Bay Bridge across the Bay, red curbs, cracked asphalt, cypress, wildflower lawn.
(function () {
  const A = F.art, M = F.marina, C = F.people, INK = A.INK;

  // ---------- a small kit shared with scenes 10 and 11 ----------
  const K = (F.kitC = {});
  K.bayBridge = (ctx, x, y, w, col = '#8aa4c0') => {
    ctx.save();
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = 3;
    ctx.fillRect(x, y - 6, w, 5);
    const towers = [0.12, 0.38, 0.62, 0.88];
    towers.forEach((f) => ctx.fillRect(x + w * f - 3, y - 46, 6, 46));
    for (let k = 0; k < towers.length - 1; k++) {
      const x0 = x + w * towers[k], x1 = x + w * towers[k + 1];
      ctx.beginPath();
      ctx.moveTo(x0, y - 44);
      ctx.quadraticCurveTo((x0 + x1) / 2, y - 4, x1, y - 44);
      ctx.stroke();
    }
    ctx.restore();
  };
  // A parking meter that can come alive: alive 0..1, talk 0..1, display text
  K.meter = (ctx, x, y, s, o = {}) => {
    const alive = o.alive || 0, t = o.t || 0;
    const sq = alive > 0 && alive < 1 ? F.ease.outElastic(alive) : 1;
    A.at(ctx, x, y, s, F.wob(t, 3, 0.05) * alive, (c) => {
      c.scale(1 / Math.max(0.6, sq) * 0.9 + 0.1, sq);
      A.box(c, -10, -190, 20, 190, '#8d99ae', { r: 4, lw: 5 });
      // arms
      if (alive > 0.3) {
        const wave = F.reduced ? 0 : Math.sin(t * 6) * 0.4;
        A.line(c, [[-40, -200], [-90, -250 - wave * 40], [-110, -300 - wave * 60]], INK, 9);
        A.line(c, [[-40, -200], [-90, -250 - wave * 40], [-110, -300 - wave * 60]], '#c0c6d1', 5);
        A.line(c, [[40, -200], [96, -240], [120, -220]], INK, 9);
        A.line(c, [[40, -200], [96, -240], [120, -220]], '#c0c6d1', 5);
        A.circle(c, -112, -304 - wave * 60, 11, '#fff', 4);
        A.circle(c, 122, -218, 11, '#fff', 4);
      }
      A.box(c, -52, -300, 104, 120, '#c0c6d1', { r: 30, lw: 6 });
      A.box(c, -38, -284, 76, 50, o.screen || '#b7e4c7', { r: 10, lw: 4 });
      if (alive > 0.2) {
        [-14, 14].forEach((ex) => { A.circle(c, ex, -266, 9, '#fff', 3); A.circle(c, ex + 2, -265, 4, INK, 0); });
        const talk = o.talk || 0;
        if (talk > 0.05) A.ellipse(c, 0, -246, 10, 3 + talk * 7, '#7a1f2b', 3);
        else A.ink(c, (k) => { k.moveTo(-12, -248); k.quadraticCurveTo(0, -240, 12, -248); }, null, 3);
      } else A.text(c, o.display || '$', 0, -259, { size: 26, color: '#1b4332' });
      A.box(c, -8, -222, 16, 22, '#555', { r: 3, lw: 3 }); // coin slot
    });
  };
  K.flag = (ctx, x, y, s, wind, t, col = '#e63946') => {
    A.at(ctx, x, y, s, 0, (c) => {
      A.line(c, [[0, 0], [0, -300]], INK, 9);
      A.line(c, [[0, 0], [0, -300]], '#ddd', 5);
      const flap = F.reduced ? 0 : Math.sin(t * 14) * 14 * wind;
      const droop = 1 - wind;
      const pts = [];
      for (let i = 0; i <= 6; i++) {
        const u = i / 6;
        const fx = u * 150 * (1 - droop * 0.85), fy = -300 + 10 + u * 150 * droop * 0.95 + Math.sin(u * 5 + t * 9) * flap * u;
        pts.push([fx, fy]);
      }
      const top = pts, bot = pts.map(([px, py], i) => [px - (i / 6) * 20 * droop, py + 70 - (i / 6) * 10 * droop]);
      A.poly(c, top.concat(bot.reverse()), col, 4);
    });
  };
  K.chair = (ctx, x, y, s, folded = 0, col = '#5c6370') => {
    A.at(ctx, x, y, s, 0, (c) => {
      if (folded > 0.5) { A.box(c, -10, -110, 20, 110, col, { r: 4, lw: 4 }); return; }
      A.line(c, [[-30, 0], [20, -60]], INK, 8);
      A.line(c, [[30, 0], [-20, -60]], INK, 8);
      A.box(c, -34, -66, 68, 14, col, { r: 4, lw: 4 });
      A.box(c, 18, -130, 14, 70, col, { r: 4, lw: 4 });
      A.box(c, -30, -130, 60, 14, col, { r: 4, lw: 4 });
    });
  };
  // where a character's right hand is, for drawing props after a color grade
  K.hand = (who, x, y, s, face, armR) => {
    const d = typeof who === 'string' ? C.CAST[who] : who;
    const H = 360 * d.h, bw = 116 * d.girth, by = -0.8 * H, L = 0.3 * H;
    const hx = bw / 2 - 6 + L * Math.sin(armR), hy = by + 26 + L * Math.cos(armR);
    return [x + hx * s * (face || 1), y + hy * s];
  };
  K.sweat = (ctx, x, y, s, t, n = 3) => {
    for (let i = 0; i < n; i++) {
      const ph = (t * 1.6 + i / n) % 1;
      ctx.globalAlpha = 1 - ph;
      A.ink(ctx, (k) => { const px = x + (i - 1) * 26 * s + ph * 20 * s * (i - 1), py = y + ph * 50 * s; k.moveTo(px, py - 10 * s); k.quadraticCurveTo(px + 7 * s, py, px, py + 6 * s); k.quadraticCurveTo(px - 7 * s, py, px, py - 10 * s); }, '#9be7ff', 2);
    }
    ctx.globalAlpha = 1;
  };
  // a tumbleweed rolling along a ground line
  K.tumbleweed = (ctx, x, y, s, t) => {
    const bounce = F.reduced ? 0 : Math.abs(Math.sin(t * 5)) * 26 * s;
    A.at(ctx, x, y - 30 * s - bounce, s, t * 3, (c) => {
      c.strokeStyle = '#8a6d3b';
      c.lineWidth = 4;
      for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse(0, 0, 30, 14 + i * 2, i * 0.7, 0, Math.PI * 2); c.stroke(); }
    });
  };

  // ---------- the set ----------
  const HZ = 470;               // horizon
  const SHORE = 610;            // riprap line
  const WALK = 830;             // where people's feet are
  const X_TERM = 260, X_METER = 2500, X_LAUNCH = 4650, X_FLAG = 4860, X_END = 5400;

  // The windsurfer's long march: parked far away at t=10.5, reaches the water at 27.6
  const wsX = (t) => F.lerp(700, X_LAUNCH + 170, F.prog(t, 10.5, 27.6));
  const wind = (t) => 1 - F.prog(t, 27.6, 28.8, 'out');

  function setBack(ctx, t, camX, z) {
    // sky (screen space) + far skyline, nearly no parallax
    const hz = hzS(z);
    A.sky(ctx, '#2f7fd1', '#cbe8ff', 0, hz + 4);
    A.cirrus(ctx, t, 4, 0.55, hz - 160);
    // From the South Cove lot you look south-east across the basin: Emeryville ahead under the
    // Oakland hills, the Bay Bridge off to the right, and the Marina's southern arm closing the
    // basin and hiding San Francisco.
    const px = -camX * 0.04 * z;
    A.hills(ctx, hz - 2, '#a7bcc4', { seed: 21, amp: 64, lw: 0, x0: -40 + px, x1: 1500 + px });
    emeryville(ctx, 160 + px, hz);
    K.bayBridge(ctx, 1080 + px, hz, 700, '#8aa0b4');
    marinaArm(ctx, 1560 + px * 1.6, hz, t);
  }
  // Emeryville's shoreline: a low land band and a cluster of modest mid-rises.
  function emeryville(ctx, x, hz) {
    ctx.fillStyle = '#93a8b8';
    ctx.fillRect(x - 200, hz - 8, 1300, 8);
    [[0, 22], [40, 34], [70, 28], [300, 46], [330, 62], [362, 54], [520, 30], [548, 40], [700, 24], [860, 36], [890, 26]].forEach(([dx, h]) => {
      ctx.fillRect(x + dx, hz - h, 24, h);
    });
  }
  // The Marina's southern arm on the right edge: a low green spit with wind-bent cypresses.
  // The proposed terminal sits out at its far end, by the old pier.
  function marinaArm(ctx, x, hz, t) {
    A.poly(ctx, [[x, hz + 2], [x + 60, hz - 18], [F.W + 400, hz - 34], [F.W + 400, hz + 2]], '#6f9a62', 3);
    [60, 150, 250, 330].forEach((dx, i) => A.cypress(ctx, x + dx + 60, hz - 14 - i * 3, 0.32, { lean: 1 }));
    A.terminal(ctx, x + 250, hz - 24, 0.3, { t, label: 'FERRY' });
  }

  // world → screen with zoom pivoting on the horizon
  const sx = (X, camX, z) => (X - camX) * z;
  const hzS = (z) => HZ + (1 - z) * 260; // zooming out lifts the ground into frame
  const sy = (Y, z) => hzS(z) + (Y - HZ) * z;

  function lot(ctx, t, camX, z, o = {}) {
    setBack(ctx, t, camX, z);
    const w = o.wind == null ? 1 : o.wind;
    // water
    ctx.fillStyle = '#2f84c9';
    ctx.fillRect(0, hzS(z), F.W, sy(SHORE, z) - hzS(z));
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 3;
    const r = F.rng(12);
    for (let i = 0; i < 40; i++) {
      const X = r() * X_END * 1.2 - 200, Y = HZ + 8 + r() * (SHORE - HZ - 20);
      const xx = sx(X + Math.sin(t + i) * 20 * w, camX, z), yy = sy(Y, z), L = (10 + 24 * (Y - HZ) / (SHORE - HZ)) * z;
      if (xx < -60 || xx > F.W + 60) continue;
      const amp = 6 * w * z + 0.6;
      ctx.beginPath(); ctx.moveTo(xx - L, yy); ctx.quadraticCurveTo(xx - L / 2, yy - amp, xx, yy); ctx.quadraticCurveTo(xx + L / 2, yy + amp, xx + L, yy); ctx.stroke();
    }
    ctx.restore();
    A.line(ctx, [[-10, hzS(z)], [F.W + 10, hzS(z)]], INK, 3);
    // distant sails on the basin (they vanish once the wind dies)
    if (w > 0.05) {
      [[900, 520, '#ff006e'], [1800, 500, '#ffbe0b'], [3300, 530, '#8338ec'], [4200, 512, '#06d6a0']].forEach(([X, Y, col], i) => {
        const xx = sx(X + Math.sin(t * 0.7 + i) * 60, camX, z), yy = sy(Y, z);
        ctx.globalAlpha = w;
        A.windsurfer(ctx, xx, yy, 0.22 * z, { t, phase: i, sail: col, dir: i % 2 ? 1 : -1 });
        ctx.globalAlpha = 1;
      });
    }
    // ground: lot asphalt, then curb, then lawn
    const yShore = sy(SHORE, z), yCurb = sy(905, z);
    ctx.fillStyle = '#74767f';
    ctx.fillRect(0, yShore, F.W, yCurb - yShore);
    // cracks and stall lines
    ctx.strokeStyle = 'rgba(30,30,36,0.35)';
    ctx.lineWidth = 2;
    const rr = F.rng(33);
    for (let i = 0; i < 90; i++) {
      const X = rr() * X_END, Y = SHORE + 30 + rr() * 260;
      const xx = sx(X, camX, z), yy = sy(Y, z);
      if (xx < -80 || xx > F.W + 80) continue;
      ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + (rr() - 0.5) * 70 * z, yy + (rr() - 0.5) * 12 * z); ctx.lineTo(xx + (rr() - 0.5) * 90 * z, yy + (rr() - 0.5) * 18 * z); ctx.stroke();
    }
    ctx.strokeStyle = '#f2f2f2';
    ctx.lineWidth = 4 * z;
    for (let X = 0; X < X_LAUNCH - 150; X += 150) {
      const xx = sx(X, camX, z);
      if (xx < -80 || xx > F.W + 80) continue;
      ctx.beginPath(); ctx.moveTo(xx, sy(SHORE + 30, z)); ctx.lineTo(xx + 40 * z, sy(SHORE + 150, z)); ctx.stroke();
    }
    // double yellow line down the drive aisle
    [0, 10].forEach((dy) => A.line(ctx, [[sx(0, camX, z), sy(SHORE + 225 + dy, z)], [sx(X_LAUNCH - 200, camX, z), sy(SHORE + 225 + dy, z)]], '#f3c623', 4 * z));
    // the launch: a sandy ramp at the end of the lot
    A.poly(ctx, [[sx(X_LAUNCH - 120, camX, z), yShore], [sx(X_END + 2000, camX, z), yShore], [sx(X_END + 2000, camX, z), yCurb], [sx(X_LAUNCH + 40, camX, z), yCurb]], '#e9d7a5', 0);
    // riprap along the lot's water edge (not across the launch beach)
    const rx0 = sx(-200, camX, z), rx1 = sx(X_LAUNCH - 130, camX, z);
    if (rx1 > 0 && rx0 < F.W) A.riprap(ctx, Math.max(-40, rx0), Math.min(F.W + 40, rx1), yShore + 6 * z, 0.9 * z + 0.1, 4 + Math.floor(camX / 400));
    A.line(ctx, [[0, yCurb], [F.W, yCurb]], A.PAL.curb, 10 * z);
    A.lawn(ctx, 0, F.W, yCurb + 5 * z, F.H, 6 + Math.floor(camX / 300), 1.2);
  }

  // things standing in the lot, drawn back to front: ferry terminal, signs, parked cars, flag
  function lotProps(ctx, t, camX, z, o = {}) {
    const w = o.wind == null ? 1 : o.wind;
    const vis = (X, pad = 400) => { const xx = sx(X, camX, z); return xx > -pad && xx < F.W + pad; };
    // the terminal, far end
    // parked ferry-commuter cars along the riprap, all the way down
    const cols = ['#e63946', '#f1faee', '#457b9d', '#e9c46a', '#8d99ae', '#2a9d8f', '#222'];
    const r = F.rng(51);
    for (let X = 640, k = 0; X < X_LAUNCH - 260; X += 175, k++) {
      const c = cols[Math.floor(r() * cols.length)];
      if (!vis(X)) continue;
      A.car(ctx, sx(X, camX, z), sy(SHORE + 112, z), 0.78 * z, { color: c, dir: k % 2 ? 1 : -1 });
    }
    // FERRY PARKING ONLY signs every so often
    for (let X = 900; X < X_LAUNCH - 200; X += 700) {
      if (!vis(X)) continue;
      A.sign(ctx, sx(X, camX, z), sy(SHORE + 60, z), ['FERRY PARKING', 'ONLY', 'ALL OTHERS TOWED'], { w: 330, size: 27, postH: 110, bg: '#fff', color: '#c1121f', color2: INK, s: z });
    }
    // brown wayfinding posts along the way: ever more arrows
    [[1500, 'LAUNCH →'], [2150, 'LAUNCH →→'], [3050, 'STILL LAUNCH →→→'], [3700, 'ALMOST LAUNCH →→→→']].forEach(([X, txt]) => {
      if (!vis(X)) return;
      A.sign(ctx, sx(X, camX, z), sy(SHORE + 170, z), [txt], { w: 260, size: 26, postH: 70, bg: '#6b4423', color: '#fff', s: z });
    });
    if (vis(X_FLAG)) K.flag(ctx, sx(X_FLAG, camX, z), sy(SHORE + 60, z), z, w, t);
  }

  // ---------- the cast, as positioned in the world ----------
  function windsurferWalk(ctx, t, camX, z, o = {}) {
    const X = o.X == null ? wsX(t) : o.X, s = 0.62 * z;
    const x = sx(X, camX, z), y = sy(WALK, z);
    if (x < -500 || x > F.W + 500) return;
    const walking = o.walking !== false;
    const ph = walking ? t * 7 : null;
    const dropped = o.dropped || 0;
    // sail rig over the shoulder (or lying on the sand once dropped)
    if (dropped < 1) {
      A.at(ctx, x, y, s, 0, (c) => {
        c.globalAlpha = 1;
        c.rotate(dropped * 1.2);
        A.poly(c, [[-170, -150], [210, -470], [230, -170]], '#ff006e', 5);
        A.line(c, [[-170, -150], [210, -470]], INK, 7);
        A.line(c, [[-20, -260], [180, -230]], INK, 6);
      });
    } else {
      A.at(ctx, x + 40 * s, y + 10 * s, s, 0, (c) => { A.poly(c, [[-230, -10], [260, -24], [60, -110]], '#ff006e', 5); });
    }
    const pose = { walk: ph, lean: walking ? 0.12 : -0.05, armR: 0.9, armL: 1.2, eyes: o.eyes || (walking && t > 16 ? 'half' : 'open'), mouth: o.mouth || (walking ? 'flat' : 'frown'), talk: o.talk || 0, bob: walking && !F.reduced ? Math.abs(Math.sin(t * 7)) * 6 : 0 };
    C.person(ctx, x, y, s, 'windsurfer', pose);
    // board under the arm
    if (dropped < 1) A.ellipse(ctx, x + 10 * s, y - 230 * s, 190 * s, 22 * s, '#fff', 4);
    else A.ellipse(ctx, x - 160 * s, y - 6 * s, 180 * s, 20 * s, '#fff', 4);
    if (walking && t > 13) K.sweat(ctx, x + 30 * s, y - 470 * s, s * 1.4, t);
  }

  function wingFoiler(ctx, t, camX, z, X) {
    const s = 0.6 * z, x = sx(X, camX, z), y = sy(WALK - 10, z);
    if (x < -500 || x > F.W + 500) return;
    const who = Object.assign({}, C.CAST.windsurfer, { suit: '#0b3954', skin: '#8d5524', hair: '#222' });
    const tug = F.reduced ? 0 : Math.sin(t * 9) * 0.06;
    // the wing, overhead, dragging them backward (to the left)
    A.at(ctx, x - 60 * s, y - 520 * s, s, -0.35 + tug, (c) => {
      A.ink(c, (k) => { k.moveTo(-210, 40); k.quadraticCurveTo(-30, -150, 190, 30); k.quadraticCurveTo(-20, -40, -210, 40); k.closePath(); }, '#00b4d8', 6);
      A.line(c, [[-10, -50], [-20, 40]], INK, 5);
    });
    C.person(ctx, x, y, s, who, { face: 1, lean: -0.28 + tug, armR: 2.7, armL: 2.4, eyes: 'wide', mouth: 'o', walk: F.reduced ? null : t * 12 });
    A.ellipse(ctx, x + 30 * s, y - 210 * s, 150 * s, 18 * s, '#ffd23f', 4);
    // skid puffs at the heels
    const r = F.rng(Math.floor(t * 8));
    for (let i = 0; i < 4; i++) A.circle(ctx, x + (30 + r() * 80) * s, y - r() * 30 * s, (8 + r() * 14) * s, 'rgba(240,235,220,0.8)', 2);
    // speed lines pointing the wrong way
    for (let i = 0; i < 4; i++) A.line(ctx, [[x + (140 + i * 10) * s, y - (120 + i * 70) * s], [x + (240 + i * 10) * s, y - (120 + i * 70) * s]], 'rgba(255,255,255,0.8)', 5 * s);
  }

  function swimmer(ctx, t, camX, z, X) {
    const s = 0.6 * z, x = sx(X, camX, z), y = sy(WALK, z);
    const cold = F.prog(t, 19.4, 21.5);
    const who = Object.assign({}, C.CAST.swimmer, { skin: C.mixColor('#f1c27d', '#a9cbe8', cold) });
    const shiver = F.reduced ? 0 : Math.sin(t * 55) * 4;
    C.person(ctx, x + shiver, y, s, who, { armL: 1.9, armR: 0.9, eyes: 'wide', mouth: 'flat', face: 1 });
    // chattering teeth and "brrr"
    if (cold > 0.3) {
      A.text(ctx, 'B R R R R', x + shiver + 10, y - 500 * s, { size: 34 * z, color: '#bde0fe', stroke: INK, strokeW: 6 * z });
      for (let i = 0; i < 3; i++) A.line(ctx, [[x - 90 * s + i * 8, y - (200 + i * 40) * s], [x - 120 * s + i * 8, y - (190 + i * 40) * s]], '#bde0fe', 4);
    }
  }

  function sailor(ctx, t, camX, z, X) {
    const s = 0.58 * z, x = sx(X, camX, z), y = sy(WALK + 20, z);
    if (x < -600 || x > F.W + 600) return;
    const who = Object.assign({}, C.CAST.passenger, { suit: '#f28c28', hair: '#888', hat: 'cap' });
    // the gear pile on a little sled, on a rope
    const gx = x - 330 * s;
    A.line(ctx, [[x + 40 * s, y - 210 * s], [gx + 110 * s, y - 60 * s]], INK, 4);
    A.box(ctx, gx - 120 * s, y - 40 * s, 240 * s, 30 * s, '#8b5e34', { r: 8, lw: 4 });
    A.box(ctx, gx - 110 * s, y - 120 * s, 120 * s, 80 * s, '#264653', { r: 14, lw: 4 });
    A.box(ctx, gx + 10 * s, y - 100 * s, 90 * s, 60 * s, '#e9c46a', { r: 8, lw: 4 });
    A.ellipse(ctx, gx - 20 * s, y - 150 * s, 120 * s, 26 * s, '#fff', 4, -0.15);
    A.text(ctx, 'SAILS', gx - 50 * s, y - 80 * s, { size: 22 * s, color: '#fff' });
    C.person(ctx, x, y, s, who, { walk: t * 6, lean: 0.25, armR: 1.4, eyes: 'half', mouth: 'flat' });
    K.sweat(ctx, x + 30 * s, y - 470 * s, s * 1.3, t);
  }

  // ---------- camera ----------
  // keyframes: [t, camX, zoom]; shots hold, then whip to the next over ~0.7 s
  const SHOTS = [
    [5.4, 1720, 1], [10.4, 1720, 1],
    [11.0, null, 1], [15.0, null, 1],          // tracking the windsurfer
    [15.6, 3420, 1], [19.2, 3360, 1],          // the wing foiler
    [19.8, 1840, 1], [22.4, 1840, 1],          // the swimmer at the meter
    [23.2, -40, 0.4], [27.2, -40, 0.4],        // wide: the whole gauntlet
    [27.8, 3980, 1], [38, 3980, 1],            // the shore
  ];
  function camAt(t) {
    const val = (k) => (SHOTS[k][1] == null ? wsX(t) - 760 : SHOTS[k][1]);
    for (let k = SHOTS.length - 1; k >= 0; k--) {
      if (t >= SHOTS[k][0]) {
        const nx = SHOTS[k + 1];
        if (!nx || t <= SHOTS[k][0]) return [val(k), SHOTS[k][2]];
        // hold if the next key is a hold-end of the same shot
        return [val(k), SHOTS[k][2], k];
      }
    }
    return [val(0), SHOTS[0][2]];
  }
  function cam(t) {
    // find the segment we're in and blend between consecutive keys when they differ
    for (let k = 0; k < SHOTS.length - 1; k++) {
      const [t0] = SHOTS[k], [t1] = SHOTS[k + 1];
      if (t >= t0 && t < t1) {
        const v0 = SHOTS[k][1] == null ? wsX(t) - 760 : SHOTS[k][1];
        const v1 = SHOTS[k + 1][1] == null ? wsX(t) - 760 : SHOTS[k + 1][1];
        const p = v0 === v1 && SHOTS[k][2] === SHOTS[k + 1][2] ? 0 : F.prog(t, t0, t1, 'inOut');
        return [F.lerp(v0, v1, p), F.lerp(SHOTS[k][2], SHOTS[k + 1][2], p)];
      }
    }
    return t < SHOTS[0][0] ? [SHOTS[0][1], 1] : [SHOTS[SHOTS.length - 1][1], SHOTS[SHOTS.length - 1][2]];
  }
  void camAt;

  // ---------- the establishing shot on the real map ----------
  const CAM0 = M.cam({ x: 260, y: -380, back: 1300, h: 720, yaw: 0.35, fov: 0.95 });
  const CAM1 = M.cam({ x: 250, y: -330, back: 760, h: 420, yaw: 0.25, fov: 0.95 });
  const FERRY_LOT = /South Cove|Launch|Marina Berth|Shorebird/i;
  function establishing(ctx, t) {
    const cm = M.lerpCam(CAM0, CAM1, F.prog(t, 0, 5.6, 'inOut'));
    const paint = F.prog(t, 1.2, 4.2);
    M.draw(ctx, cm, {
      t,
      lotFill: (lot) => (FERRY_LOT.test(lot.name || '') ? C.mixColor('#8b8d95', '#3a6ea5', paint) : null),
      after: (c, k) => {
        // cars flood into the ferry lots
        const r = F.rng(8);
        F.GEO.lots.forEach((lot) => {
          if (!FERRY_LOT.test(lot.name || '')) return;
          const n = Math.floor(lot.p.length * 3 * paint);
          const [x0, y0] = lot.p[0];
          const xs = lot.p.map((q) => q[0]), ys = lot.p.map((q) => q[1]);
          const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
          void x0; void y0;
          for (let i = 0; i < n * 3; i++) {
            const p = M.project(k, minX + r() * (maxX - minX), minY + r() * (maxY - minY), 1);
            if (!p) continue;
            const s = p.s * 4.2;
            A.box(c, p.x - s, p.y - s * 0.55, s * 2, s * 1.1, ['#e63946', '#f1faee', '#457b9d', '#e9c46a', '#222'][i % 5], { r: s * 0.3, lw: 1.2 });
          }
        });
        // windsurfers and wing foilers out on the basin
        [[430, -470, 'ws'], [560, -560, 'wing'], [330, -610, 'ws'], [650, -440, 'wing']].forEach(([x, y, kind], i) => {
          const p = M.project(k, x + Math.sin(t * 0.4 + i) * 25, y, 0);
          if (!p) return;
          if (kind === 'ws') A.windsurfer(c, p.x, p.y, p.s * 0.09, { t, phase: i, sail: ['#ff006e', '#ffbe0b'][i % 2] });
          else A.wingfoiler(c, p.x, p.y, p.s * 0.09, { t, phase: i });
        });
        if (paint > 0.2) {
          c.globalAlpha = F.prog(paint, 0.2, 0.6);
          const pl = M.places;
          M.pin(c, k, pl.southCoveWest[0], pl.southCoveWest[1], 'FERRY PARKING', { bg: '#cfe2ff' });
          M.pin(c, k, pl.southCoveEast[0] + 60, pl.southCoveEast[1], 'FERRY PARKING', { bg: '#cfe2ff' });
          c.globalAlpha = 1;
        }
        M.pin(c, k, M.places.ssb[0], M.places.ssb[1], 'SOUTH SAILING BASIN', { bg: '#e0f4ff' });
      },
    });
  }

  F.scene('fitness', function (ctx, t, sc) {
    if (t < 5.6) {
      establishing(ctx, t);
    } else {
      const [camX, z] = cam(t);
      const w = wind(t);
      lot(ctx, t, camX, z, { wind: w });
      lotProps(ctx, t, camX, z, { wind: w });
      // the meter
      const alive = F.prog(t, 5.8, 6.8);
      const mx = sx(X_METER, camX, z), my = sy(WALK - 10, z);
      if (mx > -300 && mx < F.W + 300) K.meter(ctx, mx, my, 1.05 * z, { alive, t, talk: F.talking(sc, 'meter', t), screen: t > 19.4 && t < 23 ? '#ffccd5' : '#b7e4c7' });
      if (t > 19.4 && t < 23 && z > 0.9) A.text(ctx, 'INSERT $$$ · FERRY PATRONS ONLY', mx, my - 360 * z, { size: 24, color: '#fff', stroke: INK, strokeW: 6 });
      // the swimmer waits by the meter from the start of the swimmer beat
      if (t > 19) swimmer(ctx, t, camX, z, X_METER + 190);
      // the sailor dragging gear (crosses during the wide shot; seen earlier in the background too)
      sailor(ctx, t, camX, z, F.lerp(400, 3300, F.prog(t, 9, 34)));
      // the wing foiler: blown backward during their beat, then still drifting left in the wide shot
      wingFoiler(ctx, t, camX, z, F.lerp(4400, 3000, F.prog(t, 15.2, 30)));
      // the windsurfer
      const arrived = t >= 27.6;
      windsurferWalk(ctx, t, camX, z, {
        walking: !arrived,
        dropped: arrived ? F.prog(t, 27.8, 28.4) >= 1 ? 1 : F.prog(t, 27.8, 28.4) : 0,
        talk: F.talking(sc, 'windsurfer', t),
        eyes: arrived ? 'half' : null,
        mouth: arrived ? 'frown' : null,
      });
      // shot captions: little checkmark cards for each "achievement"
      const card = (txt, a, b, x, y) => {
        const k = F.window(t, a, b, 0.3);
        if (k <= 0) return;
        A.at(ctx, x, y, A.popScale(k), -0.05, (c) => A.tagSmall(c, txt, 0, 0, 34, '#d8f3dc'));
      };
      card('WARM-UP ✓', 12.2, 15.2, 1500, 230);
      card('BACKWARDS SAILING ✓', 16.4, 19.4, 1450, 230);
      card('COLD ACCLIMATION ✓', 20.2, 22.6, 1450, 230);
      // the banner, over the wide shot
      const bp = F.prog(t, 23.0, 24.0);
      if (bp > 0 && t < 27.8) A.banner(ctx, F.W / 2, 150, 1500, 'ACTIVE TRANSPORTATION THROUGH MANDATORY GEAR TRANSPORTATION', { p: bp, size: 40, color: '#2a9d8f', h: 130 });
      // the wind dies: a limp-flag beat
      if (t > 28.2 && t < 29.6) A.text(ctx, '…', sx(X_FLAG, camX, z) + 120, sy(SHORE - 250, z), { size: 80, color: '#fff', stroke: INK, strokeW: 10 });
      // public-health success
      const ok = F.prog(t, 33.2, 33.9);
      if (ok > 0) {
        A.at(ctx, 1300, 300, A.popScale(ok), -0.08, (c) => {
          A.circle(c, 0, 0, 120, '#ffd23f', 7);
          A.circle(c, 0, 0, 92, null, 4);
          A.poly(c, [[-60, 90], [-90, 220], [-40, 190], [-10, 230], [0, 100]], '#e63946', 5);
          A.poly(c, [[60, 90], [90, 220], [40, 190], [10, 230], [0, 100]], '#e63946', 5);
          A.text(c, 'PUBLIC', 0, -26, { size: 34 });
          A.text(c, 'HEALTH', 0, 10, { size: 34 });
          A.text(c, 'SUCCESS!', 0, 48, { size: 28, color: '#c1121f' });
        });
      }
    }
  });
})();
