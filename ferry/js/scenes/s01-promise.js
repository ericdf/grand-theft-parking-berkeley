'use strict';
// Scene 1 — The promise / headline. The thriving Marina; a magic voice; a terminal and parking
// bloom while recreation vanishes (an imagined future, labeled); the thesis lands by 0:15; title;
// rewind to today; "once upon a time…"
(function () {
  const A = F.art, M = F.marina, INK = A.INK;

  // Recreation on and around the water, in world metres. kind, x, y, phase
  const FUN = [
    ['windsurfer', 380, -430, 0], ['windsurfer', 520, -560, 1.3], ['wing', 300, -600, 2.1], ['wing', 610, -420, 0.6],
    ['windsurfer', 700, -650, 2.8], ['swim', 250, -360, 0.2], ['swim', 290, -372, 1.1], ['swim', 330, -366, 2.4],
    ['sail', -520, 120, 0], ['sail', -760, -40, 1.6], ['sail', -620, 420, 0.8], ['sail', -980, 260, 2.2], ['sail', -880, -320, 1.1],
    ['kite', -160, 820, 0], ['kite', -60, 640, 1.4], ['kite', -280, 640, 2.7],
  ];

  // The bird's-eye glide: from out over the Bay toward the South Sailing Basin.
  const CAM_A = M.cam({ x: 60, y: -160, back: 2100, h: 1150, yaw: 0.12, fov: 0.95 });
  const CAM_B = M.cam({ x: 180, y: -330, back: 1500, h: 760, yaw: 0.02, fov: 0.95 });

  // the imagined future's progress at local time t (0 = today, 1 = paved), rewound at 19.5–21.3
  function doom(t) {
    if (t < 19.5) return F.prog(t, 3.2, 8.5, 'inOut');
    if (t < 21.3) return 1 - F.prog(t, 19.5, 21.3, 'inOut');
    return 0;
  }
  function camAt(t) {
    if (t < 19.5) return M.lerpCam(CAM_A, CAB(t), 1);
    return M.lerpCam(CAM_B, CAM_A, F.prog(t, 19.5, 21.3, 'inOut'));
  }
  function CAB(t) { return M.lerpCam(CAM_A, CAM_B, F.prog(t, 0, 14, 'inOut')); }

  F.marinaScene = function (ctx, t, cam, o = {}) {
    const d = o.doom || 0;
    const ter = M.places.terminal;
    M.draw(ctx, cam, {
      t,
      lotFill: (lot) => (d > 0 && /South Cove|Seawall|Launch|Marina Berth|N Lot|M-Dock|J & K|O lot|F G H I/i.test(lot.name || '') ? A.shade('#8b8d95', -0.35 * d) : null),
      ground: (c, cm) => {
        // the parking flood: a dark slab spreading from the terminal over the shore lawns
        if (d > 0) {
          const R = 40 + d * 380;
          const pts = [];
          for (let i = 0; i < 48; i++) {
            const a = (i / 48) * Math.PI * 2, rr = R * (0.93 + 0.07 * Math.sin(a * 3 + 0.5));
            pts.push([ter[0] + 260 + Math.cos(a) * rr * 1.5, ter[1] + 120 + Math.sin(a) * rr * 0.6]);
          }
          const scr = pts.map((p) => M.project(cm, p[0], p[1])).filter(Boolean);
          if (scr.length > 3) A.poly(c, scr.map((p) => [p.x, p.y]), '#55575f', 3);
          // stall stripes and cars
          const r = F.rng(5);
          for (let i = 0; i < 140 * d; i++) {
            const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * R * 0.9;
            const p = M.project(cm, ter[0] + 260 + Math.cos(a) * rr * 1.5, ter[1] + 120 + Math.sin(a) * rr * 0.6, 1);
            if (!p) continue;
            const s = p.s * 4.5;
            const cols = ['#e63946', '#f1faee', '#457b9d', '#e9c46a', '#222', '#8d99ae'];
            A.box(c, p.x - s, p.y - s * 0.55, s * 2, s * 1.1, cols[i % cols.length], { r: s * 0.3, lw: 1.5 });
          }
        }
      },
      after: (c, cm) => {
        // recreation fades and poofs away as the future arrives
        const keep = 1 - F.prog(d, 0.35, 0.85);
        FUN.forEach(([kind, x, y, ph], i) => {
          const wx = x + Math.sin(t * 0.3 + ph) * 30, wy = y + Math.cos(t * 0.25 + ph) * 16;
          const p = M.project(cm, wx, wy, 0);
          if (!p) return;
          const s = p.s * (kind === 'kite' ? 0.12 : 0.085) * keep;
          if (keep < 1 && keep > 0) A.circle(c, p.x, p.y - 20 * p.s * 0.1, (1 - keep) * 30 * p.s * 0.1, 'rgba(255,255,255,0.7)', 0);
          if (s <= 0.002) return;
          if (kind === 'windsurfer') A.windsurfer(c, p.x, p.y, s, { t, phase: ph, dir: i % 2 ? 1 : -1, sail: ['#ff006e', '#ffbe0b', '#8338ec'][i % 3] });
          else if (kind === 'wing') A.wingfoiler(c, p.x, p.y, s, { t, phase: ph, dir: i % 2 ? -1 : 1, wing: ['#00b4d8', '#ff5d8f'][i % 2] });
          else if (kind === 'swim') A.swimmer(c, p.x, p.y, s * 1.2, { t: t + ph, cap: ['#ff6b35', '#ffd23f', '#06d6a0'][i % 3] });
          else if (kind === 'sail') A.sailboat(c, p.x, p.y, s, { t, phase: ph, dir: i % 2 ? 1 : -1, sail: i % 3 ? '#fff' : '#ffd6a5' });
          else if (kind === 'kite') {
            const q = M.project(cm, wx, wy, 60);
            if (!q) return;
            A.line(c, [[p.x, p.y], [q.x, q.y]], 'rgba(29,26,36,0.6)', 1.5);
            A.poly(c, [[q.x, q.y - 22 * s * 8], [q.x + 14 * s * 8, q.y], [q.x, q.y + 22 * s * 8], [q.x - 14 * s * 8, q.y]], ['#ff006e', '#ffbe0b', '#3a86ff'][i % 3], 2.5);
          }
        });
        // the terminal itself
        if (d > 0) {
          const p = M.project(cm, ter[0] + 60, ter[1] + 40, 0);
          if (p) A.terminal(c, p.x, p.y, p.s * 0.55, { p: F.prog(d, 0, 0.5), t });
        }
        if (o.labels) o.labels(c, cm);
      },
    });
  };

  F.scene('promise', function (ctx, t, sc) {
    const d = doom(t);
    if (t < 14.4 || t >= 19.5) {
      const cam = camAt(t);
      F.marinaScene(ctx, t, cam, { doom: d });
      A.grade(ctx, 'gray', F.prog(t, 8, 13) * (t < 19.5 ? 1 : 1 - F.prog(t, 19.5, 21)));
      // landmark pins while all is well
      const pinA = F.window(t, 0.6, 6.4, 0.5) + F.window(t, 22, 27.2, 0.6);
      if (pinA > 0) {
        ctx.globalAlpha = pinA;
        const pl = M.places;
        M.pin(ctx, cam, pl.ssb[0], pl.ssb[1], 'SOUTH SAILING BASIN', { bg: '#e0f4ff' });
        M.pin(ctx, cam, pl.chavez[0], pl.chavez[1], 'CÉSAR CHÁVEZ PARK', { bg: '#e8ffe0' });
        M.pin(ctx, cam, pl.doubletree[0], pl.doubletree[1], 'DOUBLETREE');
        M.pin(ctx, cam, pl.skates[0], pl.skates[1], 'SKATES ON THE BAY');
        M.pin(ctx, cam, 1150, -40, 'I-80', { bg: '#ffe8a3' });
        ctx.globalAlpha = 1;
      }
      // the magical glitter during the promise
      const glow = F.window(t, 2, 6.5, 0.6);
      if (glow > 0) A.sparkles(ctx, F.W * 0.4, F.H * 0.55, F.W * 0.7, F.H * 0.5, t, 26, 8, glow);
      // the thesis, line by line, while the dry voice says it
      const lines = [['If you build it, they will come.', 2.0], ["Unless they don't.", 8.0], ["And you've ruined the Marina forever.", 10.1], ['For nothing.', 12.8]];
      if (t < 14.4) {
        lines.forEach(([txt, at], i) => {
          const a = F.prog(t, at, at + 0.4);
          if (a <= 0) return;
          const y = 150 + i * 72;
          ctx.globalAlpha = a;
          A.text(ctx, txt, F.W / 2, y, { size: i === 0 ? 50 : 56, family: A.STORY, weight: 700, style: i === 0 ? 'italic' : '', color: i === 0 ? '#fff6c2' : '#fff', stroke: INK, strokeW: 10 });
          ctx.globalAlpha = 1;
        });
      }
      // rewind
      if (t >= 19.5 && t < 21.4) {
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        for (let y = (t * 900) % 8; y < F.H; y += 8) ctx.fillRect(0, y, F.W, 3);
        const jitter = F.reduced ? 0 : Math.sin(t * 90) * 6;
        A.text(ctx, '◀◀ REWIND', 60 + jitter, 170, { size: 64, align: 'left', color: '#fff', stroke: INK, strokeW: 10 });
        A.text(ctx, "THAT WAS ONE IMAGINED FUTURE. LET'S GO BACK.", F.W / 2, F.H * 0.42, { size: 44, color: '#fff', stroke: INK, strokeW: 10 });
      }
      // storybook frame closing in for "once upon a time"
      const book = F.prog(t, 24.5, 27);
      if (book > 0) {
        ctx.fillStyle = `rgba(243,232,205,${book})`;
        const m = 140 * book;
        ctx.fillRect(0, 0, F.W, m); ctx.fillRect(0, F.H - m, F.W, m); ctx.fillRect(0, 0, m, F.H); ctx.fillRect(F.W - m, 0, m, F.H);
        A.grade(ctx, 'sepia', book);
      }
    } else {
      // the title card, with the thesis restated beneath it
      const p = F.prog(t, 14.4, 15.4);
      A.titleCard(ctx, t, { p, thesis: true, thesisP: F.prog(t, 15.4, 16.2) });
    }
  });
})();
