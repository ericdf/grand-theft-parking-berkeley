'use strict';
// Scene 5 — The price of paradise. A cutaway of the shallow Bay: the ferry runs aground, a dredger
// digs (up to 400,000 cubic yards), waves buffet the boat until a breakwater rises, a pier reaches
// out, the engineer's list of extra costs unrolls, and the dredger is literally bogged down.
// Everything here is the PROPOSED DESIGN, not completed work.
(function () {
  const A = F.art, C = F.people, INK = A.INK;
  const WL = 520;              // waterline
  const SHORE = 1480;          // where the land starts
  const FERRY_X = 1000;        // where the ferry gets stuck
  const DREDGE_X = 470;
  const BW_X = 170;            // breakwater

  // seabed height (screen y) at x, with the dredged channel deepening over time
  function bed(x, dig) {
    const p = F.clamp((x - 150) / 1250, 0, 1);
    let y = F.lerp(1010, 540, F.ease.inOut(p));
    // the dredged trench under the ferry and its approach
    const tr = Math.exp(-Math.pow((x - (FERRY_X - 120)) / 330, 2));
    y += tr * 150 * dig;
    return Math.min(y, 1080);
  }

  function ferryPos(t) {
    // sails in, runs aground at 4.0, floats again once the channel is deep enough
    const x = t < 4 ? F.lerp(-420, FERRY_X, F.ease.out(F.prog(t, 0, 4))) : FERRY_X;
    let tilt = 0, dy = 0;
    if (t >= 4) {
      const stuck = 1 - F.prog(t, 14, 16, 'inOut');
      const jolt = t < 4.6 ? Math.sin((t - 4) * 30) * (1 - (t - 4) / 0.6) * 0.05 : 0;
      tilt = (-0.07 * stuck + jolt);
      dy = -14 * stuck;
    }
    // waves buffet it until the breakwater is up
    const storm = F.window(t, 17.4, 21.5, 0.5);
    if (storm > 0 && !F.reduced) { tilt += Math.sin(t * 7) * 0.09 * storm; dy += Math.sin(t * 7 + 1) * 18 * storm; }
    return { x, y: WL + dy, tilt };
  }

  F.scene('price', function (ctx, t, sc) {
    const dig = F.prog(t, 11, 17, 'inOut');
    // ---------- sky and far shore ----------
    A.sky(ctx, '#3b8fd9', '#cfeaff', 0, WL);
    A.cirrus(ctx, t, 8, 0.45, 220);
    A.hills(ctx, WL - 10, '#9fb8a6', { seed: 4, amp: 110, x0: 900, x1: 2000, lw: 3 });
    A.sfSkyline(ctx, 330, WL - 4, 1.1, '#9db3c9');

    // ---------- water body and seabed (cutaway) ----------
    const g = ctx.createLinearGradient(0, WL, 0, F.H);
    g.addColorStop(0, '#2f84c9');
    g.addColorStop(1, '#174a7c');
    ctx.fillStyle = g;
    ctx.fillRect(0, WL, F.W, F.H - WL);
    A.ink(ctx, (c) => {
      c.moveTo(-10, F.H + 10);
      for (let x = -10; x <= SHORE + 40; x += 20) c.lineTo(x, bed(x, dig));
      c.lineTo(SHORE + 40, F.H + 10);
      c.closePath();
    }, '#a86f3c', 5);
    // mud texture
    const r = F.rng(51);
    ctx.fillStyle = '#7d4f28';
    for (let i = 0; i < 70; i++) {
      const x = r() * SHORE, y = bed(x, dig) + 14 + r() * 80;
      if (y < F.H) { ctx.beginPath(); ctx.ellipse(x, y, 6 + r() * 10, 3 + r() * 4, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    // "SHALLOW" depth marker during the narrator's line
    const sh = F.window(t, 6.2, 10.5, 0.4);
    if (sh > 0) {
      ctx.globalAlpha = sh;
      const mx = 1260, top = WL + 8, bot = bed(mx, dig) - 6;
      A.line(ctx, [[mx, top], [mx, bot]], '#fff', 5);
      A.line(ctx, [[mx - 16, top], [mx + 16, top]], '#fff', 5);
      A.line(ctx, [[mx - 16, bot], [mx + 16, bot]], '#fff', 5);
      A.tagSmall(ctx, 'SHALLOW!', mx + 100, (top + bot) / 2, 28, '#ffe8a3');
      ctx.globalAlpha = 1;
    }

    // ---------- land on the right: the Marina shore ----------
    A.ink(ctx, (c) => {
      c.moveTo(SHORE - 30, WL + 40);
      c.lineTo(SHORE + 20, WL - 6);
      c.lineTo(F.W + 10, WL - 6);
      c.lineTo(F.W + 10, F.H + 10);
      c.lineTo(SHORE - 30, F.H + 10);
      c.closePath();
    }, '#8a6b4a', 5);
    A.lawn(ctx, SHORE + 18, F.W + 10, WL - 26, WL - 4, 3, 0.6);
    A.line(ctx, [[SHORE + 20, WL - 26], [F.W + 10, WL - 26]], INK, 4);
    A.riprap(ctx, SHORE - 60, SHORE + 40, WL + 26, 0.9, 7);
    A.cypress(ctx, F.W - 90, WL - 24, 0.75, { lean: -1 });

    // ---------- the breakwater rises from the seabed ----------
    const bwP = F.prog(t, 18, 21, 'outBack');
    if (bwP > 0) {
      const base = bed(BW_X, dig), top = F.lerp(base, WL - 46, bwP);
      A.ink(ctx, (c) => { c.moveTo(BW_X - 110, base + 20); c.lineTo(BW_X - 50, top); c.lineTo(BW_X + 50, top); c.lineTo(BW_X + 110, base + 20); c.closePath(); }, '#8f8a84', 5);
      const rr = F.rng(12);
      for (let i = 0; i < 26; i++) {
        const fy = rr(), y = F.lerp(top + 12, base, fy), half = F.lerp(50, 110, fy);
        A.ellipse(ctx, BW_X + (rr() - 0.5) * half * 1.7, y, 16 + rr() * 10, 10 + rr() * 6, rr() < 0.5 ? '#a39d95' : '#7f7a74', 3);
      }
    }

    // ---------- the dredger: barge, crane, bucket ----------
    const dIn = F.prog(t, 9, 12, 'out');
    const sink = F.prog(t, 33.4, 37, 'in');
    if (dIn > 0) {
      const dx = F.lerp(-400, DREDGE_X, dIn);
      const dy = WL + sink * (bed(dx, dig) - WL + 30);
      const working = F.window(t, 11, 17.4, 0.3);
      const swing = F.reduced ? 0.5 : (Math.sin(t * 2.6) * 0.5 + 0.5);
      A.at(ctx, dx, dy, 1, sink * 0.25, (c) => {
        // barge
        A.ink(c, (k) => { k.moveTo(-170, -36); k.lineTo(170, -36); k.lineTo(150, 26); k.lineTo(-150, 26); k.closePath(); }, '#e76f51', 5);
        A.text(c, 'DREDGER', -40, -6, { size: 26, color: '#fff' });
        // spoils pile grows on deck
        const pile = dig * (1 - sink * 0.3);
        if (pile > 0) A.ink(c, (k) => { k.moveTo(-160, -36); k.quadraticCurveTo(-100, -36 - 120 * pile, -30, -36); k.closePath(); }, '#7a5c3e', 4);
        // cabin
        A.box(c, 60, -110, 90, 74, '#f4a261', { r: 8, lw: 5 });
        A.box(c, 76, -96, 56, 30, '#bde0fe', { r: 4, lw: 3 });
        A.smoke(c, 130, -120, t, { n: 5, s: 0.6, seed: 8 });
        // crane arm toward the ferry's channel; bucket dips with the swing
        const ang = -0.9 + working * swing * 0.75;
        const ax = 40, ay = -60, L = 330;
        const ex = ax + Math.cos(ang) * L, ey = ay + Math.sin(ang) * L;
        A.line(c, [[ax, ay], [ex, ey]], INK, 18);
        A.line(c, [[ax, ay], [ex, ey]], '#ffd23f', 11);
        const bucketY = F.lerp(ey + 60, (bed(dx + ex, dig) - dy) - 10, working * swing);
        A.line(c, [[ex, ey], [ex, bucketY]], INK, 3);
        A.ink(c, (k) => { k.moveTo(ex - 28, bucketY); k.lineTo(ex + 28, bucketY); k.lineTo(ex + 18, bucketY + 34); k.lineTo(ex - 18, bucketY + 34); k.closePath(); }, '#6c757d', 4);
        if (working > 0.2 && swing < 0.35) A.ellipse(c, ex, bucketY + 6, 22, 9, '#7a5c3e', 3);
      });
      if (sink > 0) {
        // bubbles and a glorp
        const br = F.rng(3);
        for (let i = 0; i < 10; i++) {
          const ph = (t * 0.9 + br()) % 1;
          A.circle(ctx, dx + (br() - 0.5) * 220, F.lerp(dy, WL, ph), 6 + br() * 8, 'rgba(255,255,255,0.5)', 2);
        }
        if (F.window(t, 33.4, 36.5, 0.3) > 0) {
          const s = A.popScale(F.prog(t, 33.4, 34));
          A.at(ctx, dx, WL - 120, s, -0.08, (c) => A.text(c, 'GLORP.', 0, 0, { size: 84, color: '#7a5c3e', stroke: '#fff', strokeW: 12 }));
        }
      }
    }

    // ---------- the pier reaches out from shore ----------
    const pierP = F.prog(t, 21.5, 25, 'out');
    if (pierP > 0) {
      const x1 = SHORE + 10, x0 = F.lerp(x1, FERRY_X + 280, pierP), deck = WL - 46;
      for (let x = x1 - 40; x > x0; x -= 70) A.box(ctx, x - 7, deck, 14, bed(x, dig) - deck, '#6b4f2a', { r: 3, lw: 3 });
      A.box(ctx, x0, deck - 18, x1 - x0, 22, '#c8b58f', { r: 4, lw: 5 });
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 2;
      for (let x = x1 - 20; x > x0 + 10; x -= 22) { ctx.beginPath(); ctx.moveTo(x, deck - 16); ctx.lineTo(x, deck + 2); ctx.stroke(); }
    }

    // ---------- the ferry ----------
    const fp = ferryPos(t);
    A.at(ctx, fp.x, fp.y, 1, fp.tilt, (c) => {
      // catamaran pontoons under the waterline
      [-170, 170].forEach((px) => A.box(c, px - 110, 0, 220, 70, '#dfe4ea', { r: 30, lw: 5 }));
    });
    A.ferry(ctx, fp.x, fp.y, 0.85, { t, tilt: fp.tilt, label: 'WETA' });
    if (F.window(t, 4, 6.4, 0.2) > 0) {
      const s = A.popScale(F.prog(t, 4, 4.4));
      A.at(ctx, fp.x + 30, WL - 250, s, 0.1, (c) => A.text(c, 'CRUNCH!', 0, 0, { size: 96, color: '#ffd23f', stroke: INK, strokeW: 14 }));
      A.sparkles(ctx, fp.x + 80, WL + 90, 300, 60, t * 3, 8, 2, 1);
    }

    // translucent water over everything under the surface
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, WL, SHORE, F.H - WL);
    ctx.clip();
    ctx.fillStyle = 'rgba(47,132,201,0.2)';
    ctx.fillRect(0, WL, SHORE, F.H - WL);
    ctx.restore();
    A.line(ctx, [[-10, WL], [SHORE - 20, WL]], INK, 4);
    // surface ticks
    const wr = F.rng(9);
    ctx.strokeStyle = '#bfe3ff';
    ctx.lineWidth = 4;
    for (let i = 0; i < 16; i++) {
      const x = ((wr() * SHORE + t * 40) % SHORE);
      ctx.beginPath(); ctx.moveTo(x, WL + 14); ctx.quadraticCurveTo(x + 14, WL + 6, x + 28, WL + 14); ctx.stroke();
    }

    // ---------- the storm waves (17.6 →), stopped by the breakwater once it's up ----------
    const storm = F.window(t, 17.2, 22.5, 0.5);
    if (storm > 0) {
      const wall = bwP > 0.6 ? BW_X + 60 : SHORE - 100;
      for (let k = 0; k < 4; k++) {
        const ph = ((t - 17.2) * 0.55 + k * 0.25) % 1;
        let x = -200 + ph * 1700;
        if (x > wall) continue;
        const h = 120 * storm * (0.7 + 0.3 * Math.sin(k * 2));
        A.ink(ctx, (c) => {
          c.moveTo(x - 160, WL + 4);
          c.quadraticCurveTo(x - 60, WL - h * 0.2, x, WL - h);
          c.quadraticCurveTo(x + 50, WL - h - 30, x + 70, WL - h + 30);
          c.quadraticCurveTo(x + 30, WL - h + 20, x + 40, WL - h * 0.4);
          c.quadraticCurveTo(x + 60, WL - 10, x + 120, WL + 4);
          c.closePath();
        }, '#3b93d6', 5);
        A.ink(ctx, (c) => { c.moveTo(x - 10, WL - h + 6); c.quadraticCurveTo(x + 40, WL - h - 22, x + 64, WL - h + 26); }, null, 6, '#fff');
      }
      if (bwP > 0.6) {
        const s = F.prog(t, 19.4, 22.5);
        A.sparkles(ctx, BW_X, WL - 90, 160, 120, t * 2, 10, 4, (1 - s) * storm);
        for (let i = 0; i < 8; i++) {
          const ph = (t * 1.3 + i / 8) % 1;
          A.circle(ctx, BW_X - 30 + Math.cos(i) * 60 * ph, WL - 70 - ph * 140 + ph * ph * 120, 10 * (1 - ph) + 3, '#e8f6ff', 3);
        }
      }
    }

    // ---------- labels (kept out of the caption band) ----------
    if (bwP > 0) {
      ctx.globalAlpha = F.prog(t, 19, 20);
      A.tagSmall(ctx, '400-FOOT BREAKWATER', BW_X + 120, WL - 160, 30, '#ffe8a3');
      ctx.globalAlpha = 1;
    }
    if (pierP > 0) {
      ctx.globalAlpha = F.prog(t, 23, 24);
      A.tagSmall(ctx, '1,080-FOOT PIER', 1190, WL - 96, 30, '#ffe8a3');
      ctx.globalAlpha = 1;
    }
    // the dredging counter
    const cP = F.prog(t, 10.6, 11.2);
    const cFade = 1 - F.prog(t, 24.5, 25.4);
    if (cP > 0 && cFade > 0) {
      ctx.globalAlpha = Math.min(cP, cFade);
      const v = 400000 * F.prog(t, 11, 17, 'out');
      A.counter(ctx, 960, 120, Math.round(v / 1000) * 1000, { size: 66, label: 'UP TO 400,000 CUBIC YARDS DREDGED', labelSize: 34 });
      ctx.globalAlpha = 1;
    }

    // ---------- engineer and official on the shore ----------
    const castIn = F.prog(t, 24, 25.4, 'outBack');
    if (castIn > 0) {
      const off = (1 - castIn) * 500;
      const engTalk = F.talking(sc, 'engineer', t), offTalk = F.talking(sc, 'official', t);
      const shrug = F.prog(t, 31, 31.6, 'outBack');
      // the engineer's ever-longer list, unrolling down the embankment
      const listP = F.prog(t, 25.4, 30.4);
      const roll = 1 - F.prog(t, 31.4, 32.2, 'in');
      const ex = 1800 + off, ey = WL - 20;
      if (listP > 0 && roll > 0) {
        const top = ey - 170, len = F.lerp(40, 330, listP) * roll;
        A.box(ctx, ex - 210, top, 190, len, '#fffdf4', { r: 4, lw: 4 });
        A.ellipse(ctx, ex - 115, top + len, 98, 12, '#efe6d2', 4);
        const items = ['MAINTENANCE DREDGING', 'CHARGING', 'THE VESSELS', 'OPERATING SUBSIDIES', '…'];
        items.forEach((it, i) => {
          if (listP * 5.2 > i + 0.4 && 34 + i * 50 < len - 10) A.text(ctx, '✓ ' + it, ex - 115, top + 32 + i * 50, { size: 17, maxW: 170, lh: 1.0 });
        });
      }
      C.person(ctx, ex, ey, 0.8, 'engineer', { face: -1, talk: engTalk, armR: listP > 0 && roll > 0 ? 1.0 : 0.2, armL: 0.3, eyes: 'open', brow: listP > 0.7 ? 1 : 0 });
      C.person(ctx, 1400 + off, WL - 64, 0.8, 'official', {
        face: 1, talk: offTalk,
        armR: shrug > 0 ? F.lerp(0.2, 2.2, shrug) * (1 - F.prog(t, 33.2, 34)) + 0.2 : 0.2,
        armL: 0.1, mouth: 'grin', eyes: t > 31 && t < 34 ? 'closed' : 'open',
        lean: shrug > 0 && t < 34 ? -0.05 : 0,
      });
    }

  });
})();
