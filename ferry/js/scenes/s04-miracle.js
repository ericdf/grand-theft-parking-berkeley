'use strict';
// Scene 4 — The magical ferry. In a rosy-gold glow a grant cloud lowers a ferry into the Bay and
// drops a suitcase of grants and contracts at City Hall. "Who?" "The grants." A giant blueprint
// unrolls with its price tag (the 2025 construction estimate, ferries not included). Then the real
// map: I-80 stands between the waterfront and the people. "Have you considered… parking?"
// Cars pour in; 68% of projected passengers arrive by car; A GREENER TOMORROW slaps over the chart.
(function () {
  const A = F.art, P = F.people, M = F.marina, INK = A.INK;
  const GROUND = 830, SHORE = 1000;
  const CLOUD = [1280, 180];

  // ---------- part 1: the miracle (side view) ----------
  function cloudFace(ctx, t, talk) {
    const pulse = 1 + F.wob(t, 2.4, 0.03) + talk * 0.03;
    A.at(ctx, CLOUD[0], CLOUD[1], pulse, 0, (c) => {
      // glow
      const g = c.createRadialGradient(0, 0, 40, 0, 0, 420);
      g.addColorStop(0, 'rgba(255,240,180,0.9)');
      g.addColorStop(1, 'rgba(255,200,170,0)');
      c.fillStyle = g;
      c.beginPath(); c.arc(0, 0, 420, 0, Math.PI * 2); c.fill();
      A.cloud(c, -150, 20, 1.5, '#fff8e8');
      A.cloud(c, 140, 10, 1.7, '#fff8e8');
      A.cloud(c, 0, -30, 1.9, '#fffdf4');
      // a serene face
      [-50, 50].forEach((x) => A.ink(c, (k) => k.arc(x, -40, 16, Math.PI * 0.15, Math.PI * 0.85), null, 5));
      if (talk > 0.05) A.ellipse(c, 0, 10, 26, 6 + talk * 18, '#d97a8a', 5);
      else A.ink(c, (k) => k.arc(0, -4, 30, Math.PI * 0.2, Math.PI * 0.8), null, 5);
      A.text(c, 'GRANTS', 0, 70, { size: 38, color: '#c9a227', stroke: '#fff', strokeW: 6 });
    });
  }

  function miracle(ctx, t, sc) {
    // rosy gold sky
    A.sky(ctx, '#f6a6b2', '#ffe3a3', 0, 600);
    A.hills(ctx, 560, '#c9a3a8', { seed: 31, amp: 90, lw: 3 });
    // land on the left with City Hall; water on the right
    A.water(ctx, 600, t, { color: '#e39aa6', light: '#ffd1d9', rows: 5, seed: 41 });
    A.ink(ctx, (c) => { c.moveTo(-20, 600); c.lineTo(SHORE - 60, 600); c.quadraticCurveTo(SHORE + 40, 700, SHORE - 40, F.H + 20); c.lineTo(-20, F.H + 20); c.closePath(); }, '#b8d68a', 5);
    // beams from the cloud
    ctx.save();
    ctx.globalAlpha = 0.35 + F.wob(t, 3, 0.08);
    ctx.fillStyle = '#fff6c2';
    ctx.beginPath(); ctx.moveTo(CLOUD[0] - 120, CLOUD[1]); ctx.lineTo(CLOUD[0] + 120, CLOUD[1]); ctx.lineTo(CLOUD[0] + 420, 760); ctx.lineTo(CLOUD[0] - 80, 760); ctx.fill();
    ctx.restore();
    // the ferry floats down into the Bay
    const dsc = F.prog(t, 0.6, 5.4, 'inOut');
    const fy = F.lerp(CLOUD[1] + 60, 712, dsc) + (dsc >= 1 ? F.wob(t, 2, 4) : 0);
    A.ferry(ctx, 1470, fy, 0.72, { t, label: 'WETA' });
    if (t > 5.2 && t < 7) {
      const sp = F.prog(t, 5.2, 7);
      for (let i = 0; i < 8; i++) A.circle(ctx, 1470 + (i - 3.5) * 70 * (0.6 + sp), 716 - Math.sin(sp * Math.PI) * (40 + (i % 3) * 30), 12 * (1 - sp) + 2, '#ffe9f0', 3);
    }
    A.sparkles(ctx, 1470, fy - 40, 520, 260, t, 12, 3, 1 - F.prog(t, 6, 9));
    cloudFace(ctx, t, F.talking(sc, 'magic', t));

    // City Hall and its steps
    A.cityHall(ctx, 360, GROUND, 0.72, { flag: '#ffd23f' });
    // the suitcase drops from the cloud and lands with a squash
    const drop = F.prog(t, 3.6, 5.8, 'in');
    const land = F.prog(t, 5.8, 6.5);
    const sx = F.lerp(CLOUD[0] - 40, 640, drop), sy = F.lerp(CLOUD[1] + 40, GROUND - 40, drop) - Math.sin(drop * Math.PI) * 160;
    const squash = land > 0 && land < 1 ? 1 + Math.sin(land * Math.PI) * 0.35 : 1;
    const opened = F.prog(t, 13.9, 14.6);
    if (drop > 0) A.at(ctx, sx, sy, 1, (1 - drop) * 0.8, (c) => {
      c.scale(squash, 1 / squash);
      A.box(c, -110, -70, 220, 120, '#8b4513', { r: 14, lw: 6 });
      A.box(c, -36, -96, 72, 30, null, { r: 10, lw: 7 });
      A.box(c, -94, -40, 188, 50, '#fffbea', { r: 6, lw: 3 });
      A.text(c, 'GRANTS &', 0, -26, { size: 20 });
      A.text(c, 'CONTRACTS', 0, -2, { size: 20 });
      if (opened > 0) A.poly(c, [[-110, -70], [110, -70], [110 - 20 * opened, -70 - 120 * opened], [-110 + 20 * opened, -70 - 120 * opened]], '#a0522d', 6);
    });
    // grants fly out of the open suitcase
    if (opened > 0 && t < 23.5) {
      const r = F.rng(77);
      for (let i = 0; i < 14; i++) {
        const ph = F.clamp((t - 14 - r() * 1.5) / 3, 0, 1);
        if (ph <= 0) continue;
        const ang = -Math.PI / 2 + (r() - 0.5) * 2.2;
        const d = ph * (240 + r() * 260);
        A.at(ctx, 640 + Math.cos(ang) * d, GROUND - 120 + Math.sin(ang) * d + ph * ph * 160, 1, ph * 6 * (r() - 0.5), (c) => {
          A.box(c, -40, -26, 80, 52, '#fffdf4', { r: 4, lw: 4 });
          A.text(c, 'GRANT', 0, 2, { size: 16, color: '#2a9d8f' });
        });
      }
    }
    // the official
    const who = F.window(t, 11.9, 13.6, 0.15);
    const wow = t > 13.9;
    P.person(ctx, 860, GROUND + 6, 0.78, 'official', {
      face: who > 0.5 && Math.floor(t * 3) % 2 ? -1 : 1,
      talk: F.talking(sc, 'official', t), eyes: wow ? 'wide' : 'open', mouth: wow ? 'grin' : 'smile',
      armR: wow ? 2.6 + F.wob(t, 8, 0.2) : t > 8 && t < 11.6 ? 1.1 : 0.2, armL: wow ? 2.4 : 0.1, brow: who > 0.5 ? 1 : 0,
      bob: wow && !F.reduced ? Math.abs(Math.sin(t * 7)) * 14 : 0,
    });
    if (who > 0) A.text(ctx, '?', 960, GROUND - 330, { size: 90 * A.popScale(who), color: '#fff', stroke: INK, strokeW: 10 });

    // the blueprint unrolls across the sky and shoreline
    const unroll = F.prog(t, 17.2, 19.6, 'out');
    if (unroll > 0) blueprint(ctx, t, unroll);
    A.grade(ctx, 'gold', 0.5);
  }

  function blueprint(ctx, t, p) {
    const x0 = 140, x1 = 1780, y0 = 210, y1 = 580, xe = F.lerp(x0 + 40, x1, p);
    ctx.save();
    ctx.translate(0, -130); // unroll above the official's head
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0 - 10, y0 - 10, xe - x0 + 10, y1 - y0 + 20);
    ctx.clip();
    A.box(ctx, x0, y0, x1 - x0, y1 - y0, '#2b6cb0', { r: 6, lw: 6 });
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    for (let x = x0; x < x1; x += 40) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke(); }
    for (let y = y0; y < y1; y += 40) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
    A.text(ctx, 'BERKELEY FERRY TERMINAL', (x0 + x1) / 2 - 160, y0 + 54, { size: 50, color: '#fff' });
    A.text(ctx, 'PROPOSED', (x0 + x1) / 2 - 160, y0 + 100, { size: 24, color: '#bfe1ff' });
    // white line drawings: pier, terminal, breakwater, parking stalls
    const W = (pts, lw = 4) => A.line(ctx, pts, '#fff', lw);
    W([[240, 470], [980, 470]], 6);
    for (let x = 260; x < 980; x += 60) W([[x, 470], [x, 500]], 2);
    A.box(ctx, 980, 400, 180, 90, null, { r: 8, lw: 4, stroke: '#fff' });
    ctx.beginPath(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.arc(1070, 500, 150, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    for (let i = 0; i < 6; i++) A.box(ctx, 1200 + i * 46, 430, 36, 60, null, { r: 3, lw: 3, stroke: '#fff' });
    A.text(ctx, 'P', 1340, 400, { size: 34, color: '#fff' });
    ctx.restore();
    // the roll at the unrolling edge
    if (p < 1) A.box(ctx, xe - 22, y0 - 16, 44, y1 - y0 + 32, '#3d7cc9', { r: 22, lw: 6 });
    ctx.restore();
    // the price tag, swinging from a string
    const tag = F.prog(t, 20, 20.8);
    if (tag > 0) {
      const sw = F.wob(t, 2.2, 0.05) * (1 - F.prog(t, 20, 24) * 0.6);
      A.line(ctx, [[1560, 300], [1560 + sw * 400, 330]], INK, 4);
      A.evidence(ctx, 1500, 470, {
        p: tag, w: 600, rot: sw, title: 'PRICE TAG', big: '~$104 MILLION', bigSize: 76,
        small: '2025 CONSTRUCTION ESTIMATE · FERRIES NOT INCLUDED', smallSize: 24,
      });
    }
  }

  // ---------- part 2: the map (where would passengers come from?) ----------
  const CAM = M.cam({ x: 520, y: -120, back: 2300, h: 1350, yaw: 0.05, fov: 0.95 });
  const CAM2 = M.cam({ x: 360, y: -200, back: 2000, h: 1150, yaw: 0.02, fov: 0.95 });
  // University Avenue, from the flatlands across I-80 to the waterside lots (real road points)
  const ROUTE = [[3200, 220], [1510, 158], [1221, 113], [1006, 49], [587, -61], [511, -93], [489, -139], [86, -300], [-24, -324], [-200, -420], [-420, -470]];
  function along(path, u) {
    let L = 0;
    const seg = [];
    for (let i = 1; i < path.length; i++) { const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); seg.push(d); L += d; }
    let d = u * L;
    for (let i = 0; i < seg.length; i++) {
      if (d <= seg[i]) { const k = d / seg[i]; return [F.lerp(path[i][0], path[i + 1][0], k), F.lerp(path[i][1], path[i + 1][1], k)]; }
      d -= seg[i];
    }
    return path[path.length - 1];
  }

  function mapPart(ctx, t, sc) {
    const cam = M.lerpCam(CAM, CAM2, F.prog(t, 24, 34, 'inOut'));
    const park = F.prog(t, 26.6, 30, 'inOut');
    M.draw(ctx, cam, {
      t,
      skyTop: '#f2a0b0', skyLow: '#ffe3a3',
      lotFill: (lot) => (park > 0 && /South Cove|Launch|Marina Berth|N Lot|M-Dock|J & K|O lot|F G H I|DoubleTree/i.test(lot.name || '') ? A.shade('#8b8d95', -0.4 * park) : null),
      ground: (c, cm) => {
        // the barrier: I-80 glows red
        const red = F.prog(t, 23.6, 24.6);
        if (red > 0) {
          F.GEO.roads.filter((r) => r.k === 'fwy').forEach((r) => {
            const pts = r.p.map((q) => M.project(cm, q[0], q[1], 0)).filter(Boolean).map((q) => [q.x, q.y]);
            if (pts.length < 2) return;
            c.globalAlpha = red;
            A.line(c, pts, INK, 30);
            A.line(c, pts, '#e63946', 20);
            c.globalAlpha = 1;
          });
        }
        // new parking spreading over the shore lawns by the terminal site
        if (park > 0) {
          const base = M.places.terminal;
          const r = F.rng(19);
          for (let i = 0; i < 120 * park; i++) {
            const wx = base[0] + 380 + (r() - 0.3) * 760, wy = base[1] + 200 + (r() - 0.5) * 300;
            if (!M.onLand(wx, wy)) continue; // parking goes on the shore, not in the Bay
            const q = M.project(cm, wx, wy, 1);
            if (!q) continue;
            const s = q.s * 4.5;
            A.box(c, q.x - s, q.y - s * 0.55, s * 2, s * 1.1, ['#e63946', '#f1faee', '#457b9d', '#e9c46a', '#222', '#8d99ae'][i % 6], { r: s * 0.3, lw: 1.5 });
          }
        }
        // cars pour in along University Avenue
        const pour = F.prog(t, 28.2, 29.4);
        if (pour > 0) {
          for (let i = 0; i < 46; i++) {
            const u = ((t - 28.2) * 0.12 + i / 46) % 1;
            const [x, y] = along(ROUTE, u);
            const q = M.project(cm, x + (i % 2 ? 8 : -8), y, 1);
            if (!q) continue;
            const s = q.s * 5.2 * pour;
            A.box(c, q.x - s, q.y - s * 0.6, s * 2, s * 1.2, ['#e63946', '#ffd23f', '#457b9d', '#fff', '#2a9d8f'][i % 5], { r: s * 0.3, lw: 1.5 });
          }
        }
      },
      after: (c, cm) => {
        const lab = F.prog(t, 23.8, 24.6);
        if (lab > 0) {
          c.globalAlpha = lab;
          M.pin(c, cm, 1150, 640, 'I-80', { bg: '#ffd6d9', k: 14 });
          M.pin(c, cm, 1750, 120, 'WHERE PEOPLE LIVE', { bg: '#fff3b0', k: 14 });
          M.pin(c, cm, M.places.terminal[0], M.places.terminal[1], 'PROPOSED TERMINAL', { bg: '#e0f4ff', k: 14, z: 220 });
          c.globalAlpha = 1;
        }
      },
    });
    A.grade(ctx, 'gold', 0.35);
    // the official, small in the corner, studying the map
    // the evidence card, then the banner slapped over it
    const card = F.prog(t, 30, 30.8);
    if (card > 0) {
      A.evidence(ctx, 460, 330, {
        p: card, w: 620, title: 'PROJECTED ACCESS TO THE FERRY', big: '68% BY CAR', bigSize: 80,
        small: 'Drive alone, carpool, drop-off and rideshare · projection', smallSize: 24,
      });
    }
    const slap = F.prog(t, 33, 33.5);
    if (slap > 0) {
      const s = slap < 1 ? F.lerp(2.4, 1, F.ease.in(slap)) : 1 + F.wob(t, 14, 0.01);
      A.at(ctx, 460, 330, s, -0.08, (c) => A.banner(c, 0, 0, 760, 'A GREENER TOMORROW', { color: '#3fa35b', size: 54, h: 120 }));
    }
  }

  F.scene('miracle', function (ctx, t, sc) {
    if (t < 23.2) { miracle(ctx, t, sc); return; }
    mapPart(ctx, t, sc);
    // a quick wipe from the blueprint into the map
    const wipe = F.prog(t, 23.2, 23.9, 'inOut');
    if (wipe < 1) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(F.W * wipe, 0, F.W, F.H);
      ctx.clip();
      miracle(ctx, 23.2, sc);
      ctx.restore();
      A.line(ctx, [[F.W * wipe, 0], [F.W * wipe, F.H]], INK, 8);
    }
  });
})();
