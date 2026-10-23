'use strict';
// Scene 8 — The subsidy machine. The FERRY FINANCIAL FEASIBILITY ENHANCER: a rider pays $7.28,
// tiny taxpayers convey $7.62 more (WETA 2035 business-plan projection, not today's fares).
// Warning lights ask who pays; the official draws the curtains. The captain: "We'll see."
// A partnership built on trust, and (mostly) concrete.
(function () {
  const A = F.art, C = F.people, INK = A.INK;
  const FLOOR = 840;
  const MX0 = 500, MX1 = 1260, MY0 = 190, MY1 = 790;

  function gear(ctx, x, y, r, a, col) {
    A.at(ctx, x, y, 1, a, (c) => {
      A.ink(c, (k) => {
        const n = 10;
        for (let i = 0; i < n * 2; i++) {
          const ang = (i / (n * 2)) * Math.PI * 2, rr = i % 2 ? r : r * 1.2;
          k[i ? 'lineTo' : 'moveTo'](Math.cos(ang) * rr, Math.sin(ang) * rr);
        }
        k.closePath();
      }, col, 5);
      A.circle(c, 0, 0, r * 0.35, '#fffbea', 4);
    });
  }

  function machine(ctx, t, shake) {
    const sx = F.reduced ? 0 : Math.sin(t * 40) * shake * 4;
    ctx.save();
    ctx.translate(sx, 0);
    // pipes
    A.line(ctx, [[MX0, 300], [MX0 - 90, 300], [MX0 - 90, 150]], INK, 30);
    A.line(ctx, [[MX0, 300], [MX0 - 90, 300], [MX0 - 90, 150]], '#9aa0a6', 20);
    A.smoke(ctx, MX0 - 90, 140, t, { n: 4, s: 0.5, color: 'rgba(255,255,255,0.8)', drift: -40, rise: 100, seed: 4 });
    // body
    A.box(ctx, MX0, MY0, MX1 - MX0, MY1 - MY0, '#7bdcb5', { r: 24, lw: 7 });
    A.box(ctx, MX0 + 30, MY0 + 24, MX1 - MX0 - 60, 92, '#1d3557', { r: 12, lw: 5 });
    A.text(ctx, 'FERRY FINANCIAL', (MX0 + MX1) / 2, MY0 + 52, { size: 34, color: '#ffd23f' });
    A.text(ctx, 'FEASIBILITY ENHANCER', (MX0 + MX1) / 2, MY0 + 90, { size: 34, color: '#ffd23f' });
    // gears in a window
    A.box(ctx, MX0 + 60, MY0 + 150, 330, 250, '#cdeee2', { r: 14, lw: 5 });
    ctx.save();
    A.rr(ctx, MX0 + 60, MY0 + 150, 330, 250, 14);
    ctx.clip();
    const sp = F.reduced ? 0.3 : 1.6;
    gear(ctx, MX0 + 160, MY0 + 260, 70, t * sp, '#f4a261');
    gear(ctx, MX0 + 290, MY0 + 320, 52, -t * sp * 1.35 + 0.2, '#e9c46a');
    gear(ctx, MX0 + 300, MY0 + 190, 40, -t * sp * 1.8, '#8ecae6');
    ctx.restore();
    // a dial whose needle swings to "FEASIBLE" (with help)
    const dx = MX0 + 560, dy = MY0 + 290;
    A.ink(ctx, (k) => k.arc(dx, dy, 120, Math.PI, 0), '#fffbea', 5);
    A.line(ctx, [[dx - 120, dy], [dx + 120, dy]], INK, 5);
    A.text(ctx, 'NOT', dx - 80, dy - 30, { size: 18, color: '#e63946' });
    A.text(ctx, 'FEASIBLE', dx + 66, dy - 30, { size: 18, color: '#2a9d8f' });
    const boost = F.prog(t, 7, 10, 'outElastic');
    const ang = Math.PI * (1.15 + 0.7 * boost) + F.wob(t, 9, 0.03);
    A.line(ctx, [[dx, dy], [dx + Math.cos(ang) * 100, dy + Math.sin(ang) * 100]], '#e63946', 8);
    A.circle(ctx, dx, dy, 12, INK, 0);
    // coin slot (left) and ticket chute (right)
    A.box(ctx, MX0 - 20, 470, 50, 120, '#1d3557', { r: 10, lw: 5 });
    A.box(ctx, MX0 - 6, 490, 22, 80, '#000', { r: 6, lw: 0 });
    A.box(ctx, MX1 - 30, 560, 70, 110, '#1d3557', { r: 10, lw: 5 });
    // hopper where the taxpayers' coins arrive
    A.poly(ctx, [[MX1 - 10, 690], [MX1 + 90, 640], [MX1 + 90, 780], [MX1 - 10, 780]], '#5fbf9a', 5);
    ctx.restore();
  }

  function lamp(ctx, x, y, on, label, show) {
    A.box(ctx, x - 26, y + 10, 52, 30, '#555', { r: 6, lw: 4 });
    A.ink(ctx, (k) => k.arc(x, y + 12, 34, Math.PI, 0), on ? '#ff3b30' : '#7a2a2a', 5);
    if (on && !F.reduced) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      A.circle(ctx, x, y - 4, 70, '#ff6b6b', 0);
      ctx.restore();
    }
    if (show > 0) {
      ctx.globalAlpha = show;
      A.at(ctx, x, y - 70, A.popScale(show), 0, (c) => {
        c.font = A.font(22);
        A.box(c, -120, -34, 240, 68, '#fffbea', { r: 10, lw: 4 });
        A.text(c, label, 0, 0, { size: 21, maxW: 220, color: '#c1121f', lh: 1.05 });
      });
      ctx.globalAlpha = 1;
    }
  }

  function dashboard(ctx, t) {
    const show = F.prog(t, 4.6, 5.2);
    if (show <= 0) return;
    const x = 1300, y = 30, w = 590, h = 330;
    A.at(ctx, x + w / 2, y + h / 2, A.popScale(show), 0, (c) => {
      c.translate(-w / 2, -h / 2);
      A.box(c, 0, 0, w, h, '#0f1b2d', { r: 16, lw: 6 });
      A.box(c, 0, 0, w, 56, '#ffd23f', { r: 16, lw: 6 });
      c.fillStyle = '#ffd23f';
      c.fillRect(3, 30, w - 6, 24);
      A.text(c, 'WETA 2035 BUSINESS PLAN PROJECTION', w / 2, 30, { size: 25 });
      const rows = [['FARE PAID PER BOARDING', '$7.28', 5.2, '#7bdcb5'], ['PUBLIC SUBSIDY PER BOARDING', '$7.62', 7.4, '#ffd23f'], ['ANNUAL OPERATING GAP', '≈ $5.59M', 9.0, '#ff8fa3']];
      rows.forEach(([k, v, at, col], i) => {
        const a = F.prog(t, at, at + 0.4);
        if (a <= 0) return;
        c.globalAlpha = a;
        const ry = 100 + i * 70;
        A.text(c, k, 24, ry, { size: 22, align: 'left', color: '#dfe7f2' });
        A.text(c, v, w - 24, ry, { size: 40, align: 'right', color: col, family: '"Courier New", monospace' });
        c.globalAlpha = 1;
      });
      A.text(c, 'A projection for 2035, not current fares or costs.', w / 2, h - 26, { size: 17, color: '#a9b0bf', family: A.STORY, style: 'italic', weight: 700 });
    });
  }

  F.scene('subsidy', function (ctx, t, sc) {
    // fluorescent administrative backdrop
    ctx.fillStyle = '#e4f7ec';
    ctx.fillRect(0, 0, F.W, F.H);
    ctx.strokeStyle = 'rgba(42,157,143,0.15)';
    ctx.lineWidth = 3;
    for (let x = 0; x < F.W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, FLOOR); ctx.stroke(); }
    for (let y = 0; y < FLOOR; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(F.W, y); ctx.stroke(); }
    // fluorescent tubes
    [300, 960, 1620].forEach((x) => { A.box(ctx, x - 140, -10, 280, 26, '#fffde0', { r: 10, lw: 4 }); });
    A.box(ctx, -10, FLOOR, F.W + 20, F.H - FLOOR + 10, '#9aa7a0', { r: 0, lw: 5 });

    const alarm = F.window(t, 17, 22.8, 0.2);
    // the conveyor of tiny taxpayers (bottom right), feeding the hopper
    const beltY = 790;
    A.box(ctx, MX1 + 60, beltY, F.W - MX1 + 20, 34, '#555', { r: 16, lw: 5 });
    for (let x = MX1 + 80; x < F.W; x += 60) A.circle(ctx, x, beltY + 17, 10, '#888', 3);
    const tp = F.prog(t, 6.6, 7.2);
    if (tp > 0) {
      for (let i = 0; i < 9; i++) {
        const ph = ((t * 0.09 + i / 9) % 1);
        const x = F.W + 40 - ph * (F.W - MX1 - 40);
        if (x < MX1 + 70) continue;
        const who = ['passenger', 'citizen', 'clerk', 'member'][i % 4];
        ctx.globalAlpha = tp;
        C.person(ctx, x, beltY, 0.26, who, { face: -1, walk: t * 9 + i, armR: 2.6, armL: 2.6, hold: (c) => A.coin(c, 0, -26, 24, t * 4 + i) });
        ctx.globalAlpha = 1;
      }
    }

    machine(ctx, t, alarm + F.window(t, 7, 10, 0.3) * 0.6);
    if (tp > 0) A.at(ctx, 1590, 660, A.popScale(F.prog(t, 7.2, 7.8)), -0.03, (c) => A.tagSmall(c, '+ $7.62 PER BOARDING · FROM THE PUBLIC', 0, 0, 24, '#fff3b0'));
    // warning lights over the machine
    const flash = alarm > 0 && (F.reduced || Math.floor(t * 4) % 2 === 0);
    lamp(ctx, 640, 140, flash, 'WHO PAYS THE OPERATING GAP?', F.prog(t, 17.2, 17.7) * (1 - F.prog(t, 22.8, 23.4)));
    lamp(ctx, 880, 140, flash, 'WHO PAYS FOR THE VESSELS?', F.prog(t, 18.0, 18.5) * (1 - F.prog(t, 22.8, 23.4)));
    lamp(ctx, 1120, 140, flash, 'WHO PAYS FOR MAINTENANCE?', F.prog(t, 18.8, 19.3) * (1 - F.prog(t, 22.8, 23.4)));
    dashboard(ctx, t);

    // the rider: pays $7.28, gets a ticket, beams, leaves
    const riderIn = F.window(t, 1.5, 16.5, 0.8);
    if (riderIn > 0) {
      const x = F.lerp(-200, 330, riderIn);
      const paying = F.window(t, 3.8, 5.2, 0.3);
      C.person(ctx, x, FLOOR, 0.82, 'passenger', {
        face: 1, walk: riderIn < 1 ? t * 9 : null, armR: 0.2 + paying * 1.3, mouth: t > 6.6 ? 'grin' : 'smile',
        hold: t < 5 ? (c) => { A.box(c, -6, -26, 60, 32, '#85bb65', { r: 4, lw: 3 }); A.text(c, '$', 24, -10, { size: 20, color: '#2d5a27' }); } : t > 6.8 ? (c) => { A.box(c, -6, -30, 70, 40, '#fff', { r: 4, lw: 3 }); A.text(c, 'TICKET', 29, -10, { size: 13 }); } : null,
      });
      const tag = F.window(t, 4.2, 9.8, 0.4);
      if (tag > 0) { ctx.globalAlpha = tag; A.tagSmall(ctx, 'RIDER PAYS $7.28', x + 30, 470, 26, '#e0f4ff'); ctx.globalAlpha = 1; }
    }
    // the ticket popping out of the chute
    const tk = F.prog(t, 5.6, 6.4, 'outBack');
    if (tk > 0 && t < 6.9) A.at(ctx, MX1 + 30 + tk * 60, 600 - tk * 40, 1, 0.3 * tk, (c) => { A.box(c, -35, -20, 70, 40, '#fff', { r: 4, lw: 3 }); A.text(c, 'TICKET', 0, 1, { size: 13 }); });
    // ding
    if (F.window(t, 5, 6.2, 0.1) > 0) A.at(ctx, MX0 - 120, 380, A.popScale(F.prog(t, 5, 5.3)), -0.1, (c) => A.text(c, 'DING!', 0, 0, { size: 60, color: '#ffd23f', stroke: INK, strokeW: 10 }));

    // the curtains close over the whole contraption
    const cur = F.prog(t, 23, 24.4);
    if (cur > 0) A.curtain(ctx, MX0 - 140, MX1 + 30, 40, FLOOR, cur, '#a4161a');
    if (cur >= 1) A.tagSmall(ctx, 'DETERMINED LATER', (MX0 + MX1) / 2 - 55, 300, 30, '#fffbea');

    // the official, pulling the cord
    const offIn = F.window(t, 21.2, 41.9, 0.8);
    const shake = F.prog(t, 34, 35.4, 'inOut');
    const cap = F.window(t, 26.4, 41.9, 0.8);
    const offX = shake > 0 ? F.lerp(300, 805, shake) : F.lerp(-200, 300, offIn);
    const capX = shake > 0 ? F.lerp(1560, 1115, shake) : F.lerp(F.W + 220, 1560, cap);
    if (offIn > 0) {
      const pull = F.window(t, 22.6, 24.6, 0.3);
      if (pull > 0 && cur < 1) A.line(ctx, [[offX + 90, 240], [offX + 90, 560 + 40 * pull]], '#ffd23f', 6);
      C.person(ctx, offX, FLOOR, 0.9, 'official', {
        face: 1, talk: F.talking(sc, 'official', t), mouth: 'grin',
        armR: shake > 0 ? 1.45 : pull > 0 ? 2.6 - pull * 0.5 : t > 27.4 && t < 30.4 ? 1.1 : 0.2,
        walk: (offIn < 1 || (shake > 0 && shake < 1)) ? t * 8 : null,
      });
    }
    if (cap > 0) {
      const weSee = F.window(t, 31, 33.6, 0.2);
      C.person(ctx, capX, FLOOR, 0.92, 'captain', {
        face: -1, talk: F.talking(sc, 'captain', t), eyes: weSee > 0.5 ? 'half' : 'open', mouth: weSee > 0.5 ? 'flat' : 'smile',
        armR: shake > 0 ? 1.45 : weSee > 0 ? 0.9 : 0.2, armL: weSee > 0 ? 0.9 : 0.2, tilt: weSee * 0.12,
        walk: (cap < 1 || (shake > 0 && shake < 1)) ? t * 8 : null,
      });
      if (weSee > 0) { ctx.globalAlpha = weSee; A.tagSmall(ctx, 'WETA', capX, FLOOR - 440, 26, '#e0f4ff'); ctx.globalAlpha = 1; }
    }

    // concrete: a chute pours onto the handshake, then sets around both of them
    const pour = F.prog(t, 35.6, 37.6);
    if (pour > 0) {
      const hx = 960, hy = 612;
      const chute = F.window(t, 35.4, 39.6, 0.4);
      if (chute > 0) {
        A.poly(ctx, [[hx - 300, -10], [hx - 200, -10], [hx - 20, 250 * chute], [hx - 120, 250 * chute]], '#9aa0a6', 5);
        if (t < 38.6) {
          const top = 250 * chute;
          A.ink(ctx, (k) => { k.moveTo(hx - 90, top); k.quadraticCurveTo(hx - 70, (top + hy) / 2, hx - 30, hy - 40); k.lineTo(hx + 30, hy - 40); k.quadraticCurveTo(hx - 10, (top + hy) / 2, hx - 40, top); k.closePath(); }, '#b0b3b8', 4);
        }
      }
      const set = F.prog(t, 37.4, 38.4, 'outBack');
      const w = F.lerp(120, 520, set) * Math.min(1, pour * 1.6), top = F.lerp(hy - 50, 592, set), bot = F.lerp(hy + 60, FLOOR, set);
      A.ink(ctx, (k) => {
        k.moveTo(hx - w / 2, bot);
        k.lineTo(hx - w / 2 + 8, top + 12);
        for (let i = 0; i <= 6; i++) k.lineTo(hx - w / 2 + (w * i) / 6, top + (i % 2 ? -10 : 8));
        k.lineTo(hx + w / 2, bot);
        k.closePath();
      }, '#b0b3b8', 6);
      const r = F.rng(31);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      for (let i = 0; i < 30; i++) { ctx.beginPath(); ctx.arc(hx + (r() - 0.5) * w * 0.9, F.lerp(top + 20, bot - 10, r()), 2 + r() * 4, 0, Math.PI * 2); ctx.fill(); }
      if (set > 0.6) {
        A.text(ctx, 'PARTNERSHIP', hx, F.lerp(top, bot, 0.32), { size: 40, color: '#5c5f66' });
        const mc = F.prog(t, 38, 38.5);
        if (mc > 0) A.at(ctx, hx, F.lerp(top, bot, 0.62), A.popScale(mc), -0.05, (c) => A.text(c, '(MOSTLY CONCRETE)', 0, 0, { size: 30, color: '#1d1a24' }));
      }
    }
  });
})();
