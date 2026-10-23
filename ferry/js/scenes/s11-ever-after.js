'use strict';
// Scene 11 — Happily ever after (an imagined future, labeled for its whole length). A bleached,
// deserted Marina; the too-high fishing pier; the freeway jammed while the Marina sits empty; the
// empty-chair ribbon cutting and the Golden Shovel; "Put it on consent."; the end card.
(function () {
  const A = F.art, C = F.people, K = F.kitC, M = F.marina, INK = A.INK;
  const GRADE = 0.85;

  // ---------- 1. the deserted Marina, a slow pan (0–12) ----------
  const ROAD = 770, SHORE_X = 1820;
  function deserted(ctx, t) {
    const camX = F.lerp(0, 1650, F.prog(t, 0.4, 11.6, 'inOut'));
    const X = (x) => x - camX;
    A.sky(ctx, '#9fb3c8', '#e3e8ee', 0, 560);
    A.hills(ctx, 560, '#9aa79c', { seed: 6, amp: 120, x0: -60 - camX * 0.1, x1: 2400 - camX * 0.1 });
    // water beyond the shore, out to the horizon
    A.water(ctx, 560, t, { color: '#5f87a8', light: '#9bb7cc', rows: 6, speed: 8 });
    // the land: everything up to the shore
    const sx = X(SHORE_X);
    ctx.fillStyle = '#b9c49a';
    ctx.fillRect(-10, 560, Math.max(0, sx + 10), F.H - 560);
    A.ink(ctx, (c) => { c.rect(-10, 560, Math.max(0, sx + 10), F.H); }, null, 4);
    if (sx > -100) A.riprap(ctx, sx - 40, sx + 30, 600, 1, 3);
    // the road, cracked, empty
    ctx.fillStyle = '#7d7f86';
    ctx.fillRect(-10, ROAD - 70, sx + 10, 120);
    [0, 10].forEach((dy) => A.line(ctx, [[-10, ROAD - 12 + dy], [sx - 20, ROAD - 12 + dy]], '#d9c36a', 4));
    A.line(ctx, [[-10, ROAD + 50], [sx, ROAD + 50]], A.PAL.curb, 9);
    const r = F.rng(19);
    ctx.strokeStyle = 'rgba(30,30,36,0.4)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 30; i++) { const x = r() * 1900, y = ROAD - 60 + r() * 100; if (X(x) > sx) continue; ctx.beginPath(); ctx.moveTo(X(x), y); ctx.lineTo(X(x) + 40, y + 6); ctx.lineTo(X(x) + 70, y - 4); ctx.stroke(); }
    // the hotel: dark windows, a CLOSED banner (imagined)
    const hx = X(560);
    A.box(ctx, hx, 300, 520, 400, '#c9c3b6', { r: 6, lw: 6 });
    for (let row = 0; row < 5; row++) for (let col = 0; col < 7; col++) A.box(ctx, hx + 30 + col * 70, 330 + row * 66, 44, 42, '#3d4250', { r: 4, lw: 3 });
    A.box(ctx, hx + 200, 620, 120, 80, '#3d4250', { r: 4, lw: 4 });
    A.box(ctx, hx + 110, 252, 300, 54, '#e9e4d8', { r: 8, lw: 5 });
    A.text(ctx, 'DOUBLETREE', hx + 260, 280, { size: 34, color: '#777' });
    A.at(ctx, hx + 260, 470, 1, -0.08, (c) => A.tagSmall(c, 'CLOSED', 0, 0, 54, '#f1dede'));
    // the empty paid lot
    const lx = X(1150);
    ctx.fillStyle = '#8b8d95';
    ctx.fillRect(lx, 600, 600, 100);
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 4;
    for (let i = 0; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(lx + i * 100, 606); ctx.lineTo(lx + i * 100 - 20, 696); ctx.stroke(); }
    for (let i = 0; i < 6; i++) K.meter(ctx, lx + 50 + i * 100, 700, 0.42, { display: '$$' });
    A.sign(ctx, lx + 300, 600, ['PAID PARKING', '$$$ PER HOUR · ENFORCED 24/7'], { w: 420, size: 34, postH: 150, bg: '#fff' });
    // Skates on the Bay, boarded up, on pilings over the water
    const kx = X(1900);
    for (let i = 0; i < 6; i++) A.box(ctx, kx + 20 + i * 90, 560, 20, 140, '#6b5b4b', { r: 3, lw: 4 });
    A.box(ctx, kx, 380, 500, 190, '#b5ab9b', { r: 8, lw: 6 });
    A.poly(ctx, [[kx - 20, 390], [kx + 250, 310], [kx + 520, 390]], '#8e8578', 6);
    for (let i = 0; i < 4; i++) {
      const wx = kx + 40 + i * 115;
      A.box(ctx, wx, 420, 80, 90, '#3d4250', { r: 3, lw: 3 });
      A.line(ctx, [[wx - 6, 424], [wx + 86, 506]], '#a47148', 12);
      A.line(ctx, [[wx + 86, 424], [wx - 6, 506]], '#a47148', 12);
    }
    A.box(ctx, kx + 110, 330, 280, 40, '#e9e4d8', { r: 6, lw: 4 });
    A.text(ctx, 'SKATES ON THE BAY', kx + 250, 351, { size: 22, color: '#777' });
    // the terminal and its lonely ferry
    const tx = X(2700);
    A.terminal(ctx, tx, 640, 0.95, { dark: true, label: 'FERRY TERMINAL' });
    A.box(ctx, tx - 300, 630, 1100, 30, '#9a9a9a', { r: 4, lw: 5 });
    A.ferry(ctx, tx + 520, 700, 0.8, { t, label: 'WETA', hull: '#dcdcdc', cabin: '#e8e8e8', stripe: '#7a8a99' });
    // the departure board
    const bx = tx - 60, by = 300;
    A.line(ctx, [[bx - 140, by + 110], [bx - 140, 630]], INK, 8);
    A.line(ctx, [[bx + 140, by + 110], [bx + 140, 630]], INK, 8);
    A.box(ctx, bx - 220, by - 60, 440, 170, '#1d1d24', { r: 10, lw: 6 });
    A.text(ctx, 'NEXT DEPARTURE:', bx, by - 20, { size: 30, color: '#ffd23f', family: '"Courier New", monospace' });
    const flip = F.reduced ? 1 : F.prog(t, 8.6, 10.4);
    const msg = 'TO BE DETERMINED';
    const shown = msg.split('').map((ch, i) => (flip * msg.length > i ? ch : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(t * 30 + i * 7) % 26])).join('');
    A.text(ctx, shown, bx, by + 40, { size: 36, color: '#ffd23f', family: '"Courier New", monospace' });
    // a tumbleweed bowls down the empty road
    if (t > 8.6) K.tumbleweed(ctx, F.lerp(-120, 1500, F.prog(t, 8.6, 12)), ROAD - 10, 1.1, t);
    // one gull
    A.gull(ctx, 1500 - t * 40, 200 + Math.sin(t) * 20, 1.2, t);
  }

  // ---------- 2. the fishing pier (12–32) ----------
  // Vertical world: the deck is at Y=0 and the water a long way down at Y=1500 (exaggerated).
  const WATER_Y = 1500;
  function pierCam(t) {
    let camY = 0, z = 1;
    if (t < 20) camY = F.lerp(0, WATER_Y, F.prog(t, 17.4, 19.2, 'inOut'));
    if (t >= 19.2) camY = F.lerp(WATER_Y, 0, F.prog(t, 19.6, 21.2, 'inOut'));
    if (t >= 26.6) { const k = F.prog(t, 26.6, 28.4, 'inOut'); camY = F.lerp(0, 760, k); z = F.lerp(1, 0.36, k); }
    return { camY, z };
  }
  function pier(ctx, t, sc) {
    const { camY, z } = pierCam(t);
    const pivotX = 900;
    const SY = (Y) => 560 + (Y - camY) * z;
    const SX = (x) => pivotX + (x - pivotX) * z;
    // sky: deep at deck height (we are very high up), bay and skyline far below
    const skyTop = SY(-900), horizon = SY(1380);
    A.sky(ctx, '#a9bccf', '#e5ebf0', Math.min(0, skyTop), Math.max(10, horizon));
    // clouds drifting past at deck level
    [[300, -240], [1300, -120], [1700, 260], [500, 520]].forEach(([x, Y], i) => A.cloud(ctx, SX(x + ((t * 18 + i * 300) % 400) - 200), SY(Y), 0.9 * z, '#f4f6f8', 4));
    // a gull flying *below* the deck
    A.gull(ctx, SX(1500 - ((t - 12) * 60) % 1400), SY(380), 1.3 * z, t, '#eee');
    // the far bay band and the skyline at the horizon
    ctx.fillStyle = '#6f93b0';
    ctx.fillRect(0, horizon, F.W, Math.max(0, SY(WATER_Y) - horizon));
    A.sfSkyline(ctx, SX(400), horizon, 0.8 * z + 0.2, '#9fb0c0');
    K.bayBridge(ctx, SX(700), horizon, 700 * z + 100, '#9fb0c0');
    // the near water surface
    A.water(ctx, SY(WATER_Y), t, { color: '#5f87a8', light: '#a8c3d6', rows: 7, speed: 10 });
    // the fish, looking up
    [[700, 0], [1050, 1.7], [1300, 0.9]].forEach(([x, ph]) => {
      const bob = F.wob(t + ph, 2.4, 6);
      A.at(ctx, SX(x), SY(WATER_Y) + bob * z, z * 1.1, 0, (c) => {
        A.ellipse(c, 0, 0, 46, 30, '#e07a5f', 5);
        A.poly(c, [[-40, 0], [-80, -26], [-80, 26]], '#e07a5f', 5);
        A.circle(c, 20, -12, 11, '#fff', 3);
        A.circle(c, 22, -18, 4.5, INK, 0);
        A.ellipse(c, 38, 8, 6, 4, '#7a1f2b', 2);
      });
    });
    // pilings: very, very tall
    for (let x = 160; x < 2400; x += 230) A.box(ctx, SX(x), SY(14), Math.max(6, 34 * z), SY(WATER_Y + 40) - SY(14), '#8e8578', { r: 3, lw: 5 });
    // cross bracing
    for (let x = 160; x < 2200; x += 230) for (let Y = 200; Y < WATER_Y - 100; Y += 380) A.line(ctx, [[SX(x + 17), SY(Y)], [SX(x + 247), SY(Y + 300)]], '#8e8578', Math.max(2, 10 * z));
    // the deck and railing
    A.box(ctx, SX(100), SY(-4), (2400) * z, Math.max(8, 30 * z), '#d6d0c4', { r: 4, lw: 5 });
    A.line(ctx, [[SX(100), SY(-90)], [SX(2600), SY(-90)]], INK, Math.max(3, 8 * z));
    for (let x = 140; x < 2500; x += 120) A.line(ctx, [[SX(x), SY(-4)], [SX(x), SY(-90)]], INK, Math.max(2, 6 * z));
    // the sign
    A.sign(ctx, SX(330), SY(-4), ['PUBLIC FISHING', 'ACCESS RESTORED!'], { w: 560, size: 40, postH: 140, bg: '#fffbea', border: '#2a9d8f', s: z });
    // bunting on the railing
    for (let i = 0; i < 14; i++) A.poly(ctx, [[SX(560 + i * 90), SY(-90)], [SX(605 + i * 90), SY(-90)], [SX(582 + i * 90), SY(-50)]], ['#e63946', '#ffd23f', '#2a9d8f'][i % 3], Math.max(1, 3 * z));
    // the fisherman: walks on, sets his chair, peers over, casts, gives up, folds, leaves
    const walkIn = F.prog(t, 12.2, 15.6), leave = F.prog(t, 31.2, 32);
    const fx = t < 31.2 ? F.lerp(-200, 900, walkIn) : F.lerp(900, -300, leave);
    const walking = (t > 12.2 && t < 15.6) || t > 31.2;
    const peer = t > 16.2 && t < 17.6;
    const casting = F.prog(t, 21.4, 22.2);
    const folded = t > 30.6;
    // the chair, set out at the rail
    if (t > 15.8) K.chair(ctx, SX(t < 31.2 ? 790 : fx - 70), SY(-4), 0.9 * z, folded ? 1 : 0);
    const rodAng = t < 21.4 ? 0.9 : t < 22.2 ? F.lerp(2.6, 1.2, casting) : 1.2;
    const pose = {
      walk: walking ? t * 7 : null,
      face: t > 31.2 ? -1 : 1,
      lean: peer ? 0.32 : 0,
      armR: walking ? 0.3 : rodAng,
      eyes: t > 23 && t < 31 ? 'half' : peer ? 'wide' : 'open',
      mouth: t > 23 ? 'frown' : 'smile',
      hold: walking && t < 16 ? C.props.rod : null,
    };
    C.person(ctx, SX(fx), SY(-4), 0.75 * z, 'fisherman', pose);
    // rod and line, drawn in world space so the line can blow around
    if (t > 15.6 && t < 31.2) {
      const [hx, hy] = K.hand('fisherman', SX(fx), SY(-4), 0.75 * z, 1, rodAng);
      const tipX = hx + 210 * z, tipY = hy - 150 * z + (t < 21.4 ? 0 : 40 * z);
      A.line(ctx, [[hx, hy], [tipX, tipY]], '#5a4033', Math.max(2, 7 * z));
      if (t > 21.4) {
        // the line: never reaches. It swings in the wind, high above the water.
        const out = F.prog(t, 21.4, 22.6, 'out');
        const sway = F.reduced ? 0.4 : Math.sin(t * 1.6) * 0.9 + Math.sin(t * 3.7) * 0.25;
        const len = 560 * out;
        const hookX = tipX + (110 + sway * 160) * z * out, hookY = tipY + len * z * (0.85 - Math.abs(sway) * 0.25);
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.quadraticCurveTo(tipX + (60 + sway * 220) * z, tipY + len * 0.35 * z, hookX, hookY);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = Math.max(1.2, 2.5 * z);
        ctx.stroke();
        A.ink(ctx, (c) => c.arc(hookX, hookY + 8 * z, 8 * z, 0, Math.PI), null, Math.max(1.5, 3 * z));
        A.circle(ctx, hookX, hookY - 30 * z, 9 * z, '#e63946', 2.5);
        // in the wide shot, a dotted drop from the dangling hook to the fish
        if (z < 0.6) {
          ctx.save();
          ctx.setLineDash([10, 12]);
          A.line(ctx, [[hookX, hookY + 20 * z], [hookX, SY(WATER_Y - 40)]], 'rgba(29,26,36,0.5)', 3);
          ctx.restore();
        }
      }
    }
    // wind streaks while the line flaps
    if (t > 22.5 && t < 30 && z > 0.5) for (let i = 0; i < 4; i++) { const yy = 520 + i * 70, xx = ((t * 600 + i * 400) % 2200) - 200; A.line(ctx, [[xx, yy], [xx + 140, yy - 6]], 'rgba(255,255,255,0.8)', 5); }
  }

  // ---------- 3. the freeway jams; the Marina sits empty (32–38) ----------
  const JAM_CAM_A = M.cam({ x: 560, y: 40, back: 1450, h: 780, yaw: 0.05, fov: 0.95 });
  const JAM_CAM_B = M.cam({ x: 680, y: 60, back: 1150, h: 620, yaw: 0.1, fov: 0.95 });
  function jam(ctx, t) {
    const cm = M.lerpCam(JAM_CAM_A, JAM_CAM_B, F.prog(t, 32, 38, 'inOut'));
    M.draw(ctx, cm, {
      t,
      hideOldPier: false,
      after: (c, k) => {
        const cols = ['#e63946', '#f1faee', '#457b9d', '#e9c46a', '#2a9d8f', '#222', '#8d99ae'];
        let n = 0;
        F.GEO.roads.forEach((r) => {
          const busy = r.k === 'fwy' || r.k === 'ramp' || (/UNIVERSITY/.test(r.n) && r.p[0][0] > 900);
          if (!busy) return;
          for (let i = 0; i < r.p.length - 1; i++) {
            const [ax, ay] = r.p[i], [bx, by] = r.p[i + 1];
            const L = Math.hypot(bx - ax, by - ay), step = r.k === 'fwy' ? 11 : 13;
            for (let d = 0; d < L; d += step) {
              const u = d / L, wx = ax + (bx - ax) * u, wy = ay + (by - ay) * u;
              const p = M.project(k, wx, wy, 1);
              if (!p) continue;
              const s = Math.max(2.5, p.s * 4.2);
              A.box(c, p.x - s, p.y - s * 0.6, s * 2, s * 1.2, cols[n++ % cols.length], { r: s * 0.3, lw: 1 });
            }
          }
        });
        const pl = M.places;
        M.pin(c, k, 1150, 120, 'I-80 & UNIVERSITY: JAMMED', { bg: '#ffccd5' });
        M.pin(c, k, pl.harbor[0], pl.harbor[1], 'THE MARINA: EMPTY', { bg: '#e8eef4', z: 60 });
      },
    });
    // honks
    const r = F.rng(Math.floor(t * 2));
    for (let i = 0; i < 3; i++) {
      const k = (t * 2 + i / 3) % 1;
      ctx.globalAlpha = 1 - k;
      A.text(ctx, 'HONK!', 1200 + r() * 600, 260 + r() * 200 - k * 40, { size: 40, color: '#fff', stroke: INK, strokeW: 8 });
    }
    ctx.globalAlpha = 1;
  }

  // ---------- 4. the ceremony (38–62.6) ----------
  const OFF = { x: 900, y: 790 }, CONS = { x: 1180, y: 790 };
  function ceremony(ctx, t, sc) {
    // two-shot push-in after the award
    const k = F.prog(t, 47.4, 48.6, 'inOut');
    const zoom = F.lerp(1, 1.45, k);
    ctx.save();
    ctx.translate(1040, 480);
    ctx.scale(zoom, zoom);
    ctx.translate(-1040, -480);
    A.sky(ctx, '#a9bccf', '#e5ebf0', -200, 560);
    A.water(ctx, 520, t, { color: '#5f87a8', light: '#9bb7cc', rows: 4, speed: 6, y1: 640 });
    A.ferry(ctx, 1600, 600, 0.75, { t, hull: '#dcdcdc', cabin: '#e8e8e8', stripe: '#7a8a99' });
    // the plaza
    ctx.fillStyle = '#c9c6bd';
    ctx.fillRect(-300, 620, F.W + 600, 700);
    A.line(ctx, [[-300, 620], [F.W + 300, 620]], INK, 5);
    // the banner on two poles
    [440, 1640].forEach((x) => A.line(ctx, [[x, 640], [x, 190]], INK, 10));
    A.banner(ctx, 1040, 220, 1100, 'MISSION ACCOMPLISHED', { p: F.prog(t, 38, 39), size: 64, color: '#e63946', h: 110 });
    // empty folding chairs, rows of them
    for (let row = 0; row < 3; row++) for (let i = 0; i < 9; i++) {
      const x = 160 + i * 210 + (row % 2) * 60, y = 900 + row * 70;
      K.chair(ctx, x, y, 0.75 + row * 0.08, 0, '#8d8d94');
    }
    // the ribbon (cut at 38.6)
    const cut = F.prog(t, 38.6, 39.4, 'out');
    if (cut < 1 || t < 38.6) {
      A.line(ctx, [[640, 640], [1040 - 20, 660 + cut * 160]], '#e63946', 14);
      A.line(ctx, [[1440, 640], [1040 + 20, 660 + cut * 160]], '#e63946', 14);
    } else {
      A.line(ctx, [[640, 640], [700, 790]], '#e63946', 14);
      A.line(ctx, [[1440, 640], [1380, 790]], '#e63946', 14);
    }
    [640, 1440].forEach((x) => A.box(ctx, x - 14, 610, 28, 180, '#ffd23f', { r: 6, lw: 4 }));
    // the party horn
    if (t > 38.4 && t < 40.4) {
      const p = F.prog(t, 38.4, 39.2);
      A.at(ctx, 1320, 470, 1, -0.4, (c) => { A.poly(c, [[0, -10], [70 + p * 40, -24], [70 + p * 40, 24], [0, 10]], '#c77dff', 4); A.text(c, 'pfff…', 160, -30, { size: 30, family: A.STORY, style: 'italic' }); });
    }
    // the cast
    const hasShovel = t > 41.2;
    const oArm = t < 39.4 ? 1.4 : hasShovel && t < 51.4 ? 2.75 : t > 51.6 && t < 53.6 ? 2.3 : t > 57.6 && t < 59.8 ? 1.2 : 0.2;
    C.person(ctx, OFF.x, OFF.y, 0.82, 'official', {
      talk: F.talking(sc, 'official', t),
      armR: oArm,
      armL: t > 51.6 && t < 53.6 ? 0.5 : 0.15,
      eyes: t > 51.6 && t < 53.6 ? 'wide' : t > 57.6 && t < 60 ? 'half' : 'open',
      mouth: t > 51.6 && t < 54 ? 'o' : 'grin',
      hold: t < 39.4 ? (c) => { A.line(c, [[0, 0], [70, -60]], '#bbb', 10); A.line(c, [[0, 0], [80, -30]], '#bbb', 10); A.circle(c, -8, 8, 14, null, 5); } : null,
      face: t > 51.6 && t < 52.6 ? -1 : 1,
    });
    C.person(ctx, CONS.x, CONS.y, 0.82, 'consultant', {
      face: -1,
      talk: F.talking(sc, 'consultant', t),
      armR: t > 54 && t < 58 ? 1.5 : 0.25,
      hold: t > 54 && t < 60 ? (c) => { c.scale(-1, 1); C.props.invoice('$$$$$$')(c); } : C.props.clipboard, // un-mirror the paper
      mouth: 'smile',
    });
    // magic sparkles drift over the empty chairs for the last promise
    const glow = F.window(t, 47.8, 51.2, 0.5);
    if (glow > 0) A.sparkles(ctx, 1000, 900, 1600, 220, t, 22, 4, glow);
    if (t > 48 && t < 53) K.tumbleweed(ctx, F.lerp(-150, 2100, F.prog(t, 48, 53)), 1010, 1, t);
    ctx.restore();
    return { zoom, shovel: hasShovel ? oArm : null };
  }

  F.scene('ever-after', function (ctx, t, sc) {
    if (t >= 62.6) {
      const p = F.prog(t, 62.6, 63.6);
      A.titleCard(ctx, t, { p, thesis: true, thesisP: F.prog(t, 63.6, 64.4) });
      return;
    }
    let shovelArm = null, zoom = 1;
    if (t < 12) deserted(ctx, t);
    else if (t < 32) pier(ctx, t, sc);
    else if (t < 38) jam(ctx, t);
    else { const r = ceremony(ctx, t, sc); shovelArm = r.shovel; zoom = r.zoom; }
    // the bleached imagined future
    A.grade(ctx, 'gray', GRADE);
    // the Golden Shovel keeps its gold (drawn after the grade)
    if (shovelArm != null && t < 51.4) {
      const [hx, hy] = K.hand('official', OFF.x, OFF.y, 0.82, 1, shovelArm);
      const zx = 1040 + (hx - 1040) * zoom, zy = 480 + (hy - 480) * zoom;
      const rise = A.popScale(F.prog(t, 41.2, 41.9));
      A.at(ctx, zx, zy, 0.82 * zoom * rise, 0, (c) => C.props.shovel(c));
      A.sparkles(ctx, zx, zy - 200 * zoom, 260, 260, t, 8, 2, 1);
      // the plaque
      const pk = F.window(t, 41.6, 47.6, 0.4);
      if (pk > 0) {
        A.at(ctx, F.W / 2, 150, A.popScale(pk), 0, (c) => {
          A.box(c, -560, -80, 1120, 160, '#fff8dc', { r: 18, lw: 6 });
          A.box(c, -546, -66, 1092, 132, null, { r: 12, lw: 3, stroke: '#c9a227' });
          A.text(c, 'THE GOLDEN SHOVEL', 0, -24, { size: 54, color: '#a67c00' });
          A.text(c, 'For Excellence in Transformational Waterfront Management', 0, 34, { size: 30, family: A.STORY, weight: 700, style: 'italic' });
        });
      }
    }
    // the final stamp, in red
    const sp = F.prog(t, 60.0, 61.0);
    if (sp > 0) A.stamp(ctx, F.W / 2, F.H * 0.42, 'APPROVED', sp, { size: 220, rot: -0.14 });
  });
})();
