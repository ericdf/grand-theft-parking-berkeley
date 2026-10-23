'use strict';
// Scene 2 — Once upon a ferry. A sepia newsreel: period cars roll onto Berkeley's automobile ferry,
// the horn sounds, the Bay Bridge rises (1936) and the old service steams away. Color blooms into
// today's green Berkeley (bikes, buses, solar; no wind turbines)… "Sometimes." Then a parade of
// cars heads for a proposed terminal and its spreading parking. A page turns back to the waterfront.
(function () {
  const A = F.art, P = F.people, INK = A.INK;
  const HZ = 520;          // horizon (sepia section)
  const DECK = 566;        // pier deck / ferry car deck height
  const FERRY_X = 1180;

  // period passengers: cap-and-coat figures
  const FOLK = [
    { suit: '#5b4636', tie: '#8a2b2b', skin: '#e0ac69', hair: '#3b2a20', hairStyle: 'short', hat: 'cap', h: 1, girth: 1 },
    { suit: '#3d4a5c', tie: null, skin: '#f1c27d', hair: '#6b4f2a', hairStyle: 'bob', hat: null, h: 0.94, girth: 0.95 },
    { suit: '#6d5a3f', tie: '#2a4d69', skin: '#c68642', hair: '#222', hairStyle: 'short', hat: 'cap', h: 1.02, girth: 1.05 },
  ];
  const CAR_COLS = ['#2b2b2b', '#5a3e2b', '#3c4f3a', '#6b2d2d', '#2b3a55'];

  // when each period car drives aboard and where it parks on the deck (relative to ferry center)
  const BOARD = [
    { go: 5.2, slot: 230 }, { go: 6.4, slot: 90 }, { go: 7.6, slot: -50 }, { go: 8.8, slot: -190 },
  ];

  function ferryX(t) { return FERRY_X + F.prog(t, 11.2, 17.5, 'in') * 1500; }

  function sepiaPart(ctx, t) {
    // sky and far shore (San Francisco hills, softly)
    A.sky(ctx, '#d9c9a3', '#f2e6c8', 0, HZ);
    A.hills(ctx, HZ + 8, '#cbb88f', { seed: 4, amp: 70, lw: 3 });
    // the Bay Bridge rises out of the water, 1936
    const rise = F.prog(t, 12, 15.6, 'outBack');
    if (rise > 0) bayBridge(ctx, 1240, HZ + 6, 0.9, rise);
    A.water(ctx, HZ, t, { color: '#9fb0b5', light: '#cfd8d6', rows: 6, speed: 18, seed: 5 });
    // the Berkeley pier: deck on pilings, from the left edge
    for (let x = 30; x < 780; x += 70) A.box(ctx, x - 9, DECK, 18, 160, '#6e5a44', { r: 3, lw: 4 });
    A.box(ctx, -20, DECK - 6, 820, 34, '#8a7356', { r: 4, lw: 5 });
    for (let x = 0; x < 800; x += 40) A.line(ctx, [[x, DECK - 4], [x, DECK + 26]], 'rgba(0,0,0,0.25)', 2);
    // ticket shed
    A.box(ctx, 90, DECK - 150, 190, 146, '#e8dcc0', { r: 4, lw: 5 });
    A.poly(ctx, [[70, DECK - 150], [185, DECK - 210], [300, DECK - 150]], '#8a5a44', 5);
    A.text(ctx, 'AUTO FERRY', 185, DECK - 112, { size: 26 });
    A.text(ctx, 'TICKETS', 185, DECK - 76, { size: 20, family: A.STORY });
    // folks waving on the pier
    FOLK.forEach((d, i) => {
      const wave = F.reduced ? 0.9 : 0.9 + Math.sin(t * 6 + i * 2) * 0.5;
      P.person(ctx, 380 + i * 90, DECK - 6, 0.36, d, { armR: t > 10.5 ? wave * 2.2 : 0.2, face: 1, mouth: 'smile' });
    });

    // the ferry, then its cars riding along
    const fx = ferryX(t);
    A.ferryVintage(ctx, fx, DECK + 74 + 10, 1, { t, label: 'BERKELEY' });
    BOARD.forEach((b, i) => {
      const p = F.prog(t, b.go, b.go + 2.4, 'inOut');
      let x;
      if (p < 1) x = F.lerp(-200 - i * 40, FERRY_X + b.slot, p);
      else x = fx + b.slot;
      A.car(ctx, x, DECK - 2 + (x > 800 ? 10 * F.prog(x, 800, 840) : 0), 0.62, { vintage: true, color: CAR_COLS[i % CAR_COLS.length], t: p > 0 && p < 1 ? t : 0, phase: i, driver: true });
    });
    // the gangway ramp between pier and ferry while boarding
    if (t < 11.2) A.poly(ctx, [[790, DECK - 4], [FERRY_X - 330, DECK + 6], [FERRY_X - 330, DECK + 18], [790, DECK + 10]], '#a08a68', 4);
    // a late car arrives as the boat leaves: comic beat
    if (t > 12.5 && t < 16.4) {
      const p = F.prog(t, 12.5, 14.2, 'out');
      A.car(ctx, F.lerp(-200, 690, p), DECK - 2, 0.62, { vintage: true, color: '#4a4a4a', t: p < 1 ? t : 0, driver: true });
      if (p >= 1) A.text(ctx, '!', 740, DECK - 120, { size: 60, color: '#fff', stroke: INK, strokeW: 8 });
    }
    // newsreel title band (top, clear of captions)
    const title = F.window(t, 0.3, 5.8, 0.5);
    if (title > 0) {
      ctx.globalAlpha = title;
      A.box(ctx, F.W / 2 - 420, 60, 840, 120, '#1a1712', { r: 8, lw: 6, stroke: '#e8dcc0' });
      A.text(ctx, 'THE BERKELEY AUTO FERRY', F.W / 2, 104, { size: 46, color: '#f2e6c8', family: A.STORY, weight: 700 });
      A.text(ctx, '★ BEFORE THE BRIDGE ★', F.W / 2, 150, { size: 24, color: '#cbb88f' });
      ctx.globalAlpha = 1;
    }
    const lab = F.window(t, 14.6, 20.4, 0.4);
    if (lab > 0) {
      ctx.globalAlpha = lab;
      A.tagSmall(ctx, 'BAY BRIDGE OPENS — 1936', 1240, 250, 34, '#f2e6c8');
      ctx.globalAlpha = 1;
    }
    // "nearly a century ago": calendar pages flying off
    const cal = F.prog(t, 17, 20.6);
    if (cal > 0 && cal < 1) {
      const yr = Math.round(F.lerp(1930, 2026, F.ease.in(cal)));
      A.at(ctx, 360, 300, 1, -0.06, (c) => {
        A.box(c, -120, -110, 240, 220, '#fffdf4', { r: 10, lw: 6 });
        A.box(c, -120, -110, 240, 56, '#a4161a', { r: 10, lw: 6 });
        A.text(c, String(yr), 0, 20, { size: 84 });
      });
      const r = F.rng(Math.floor(t * 8));
      for (let i = 0; i < 3; i++) A.at(ctx, 360 + r() * 400 + cal * 300, 300 - r() * 200, 0.4, r() * 2, (c) => A.box(c, -120, -110, 240, 220, '#fffdf4', { r: 10, lw: 6 }));
    }
    A.grade(ctx, 'sepia', 1);
    A.grain(ctx, t, 1);
    A.vignette(ctx, 0.55);
  }

  function bayBridge(ctx, cx, base, s, rise) {
    ctx.save();
    ctx.translate(cx, base);
    ctx.scale(s, s * rise);
    ctx.strokeStyle = '#6f6a63';
    ctx.fillStyle = '#6f6a63';
    // towers
    [-420, -140, 140, 420].forEach((x) => { ctx.fillRect(x - 10, -230, 20, 230); ctx.fillRect(x - 22, -232, 44, 10); });
    // cables
    ctx.lineWidth = 4;
    for (let k = 0; k < 3; k++) {
      const x0 = [-560, -140, 140][k], x1 = [-140, 140, 560][k];
      ctx.beginPath();
      ctx.moveTo(x0, k === 0 ? -40 : -226);
      ctx.quadraticCurveTo((x0 + x1) / 2, -40, x1, k === 2 ? -40 : -226);
      ctx.stroke();
    }
    ctx.fillRect(-640, -46, 1280, 12);
    ctx.restore();
  }

  // ---------- today, in color ----------
  const GROUND = 760;
  function colorPart(ctx, t) {
    A.sky(ctx, '#3d8fe0', '#cfeaff', 0, GROUND);
    A.cirrus(ctx, t, 8, 0.5, 260);
    A.sun(ctx, 1700, 170, 60, t);
    A.hills(ctx, 560, '#86ac7f', { seed: 12, amp: 150, campanile: 640 });
    // buildings with solar panels on their roofs
    const r = F.rng(31);
    for (let i = 0; i < 9; i++) {
      const x = 40 + i * 215, w = 170 + r() * 30, h = 150 + r() * 120;
      const col = ['#f4d6a0', '#f7c8b4', '#cfe3c8', '#e9e2f5', '#ffe8a3'][i % 5];
      A.box(ctx, x, GROUND - 90 - h, w, h, col, { r: 6, lw: 5 });
      for (let k = 0; k < 2; k++) for (let j = 0; j < 2; j++) A.box(ctx, x + 22 + k * (w / 2 - 6), GROUND - 70 - h + j * 60, 46, 38, '#bfe1ff', { r: 4, lw: 3 });
      A.solarPanel(ctx, x + w * 0.5, GROUND - 90 - h, 0.55);
    }
    // street: sidewalk, bike lane (green), road
    ctx.fillStyle = '#d8d4c8'; ctx.fillRect(0, GROUND - 92, F.W, 40);
    ctx.fillStyle = '#3fa35b'; ctx.fillRect(0, GROUND - 52, F.W, 46);
    ctx.fillStyle = '#6d6f78'; ctx.fillRect(0, GROUND - 6, F.W, F.H - GROUND + 6);
    A.line(ctx, [[0, GROUND - 52], [F.W, GROUND - 52]], INK, 4);
    A.line(ctx, [[0, GROUND - 6], [F.W, GROUND - 6]], INK, 4);
    for (let x = ((-t * 120) % 140) - 140; x < F.W; x += 140) { ctx.fillStyle = '#f3c623'; ctx.fillRect(x, GROUND + 90, 70, 10); }

    const jam = F.prog(t, 31.6, 33.6);
    // bikes stream along their lane (and get nudged off by the parade)
    for (let i = 0; i < 5; i++) {
      // when the parade arrives the bikes pedal for their lives, off the left edge
      const x = ((t - 20) * 170 + i * 420) % (F.W + 300) - 150 - F.ease.in(jam) * 2400;
      const y = GROUND - 14;
      if (x < -200) continue;
      A.bike(ctx, x, y, 0.62, { t, color: ['#e63946', '#ffb703', '#8338ec', '#06d6a0', '#3a86ff'][i], shirt: ['#ffb703', '#2a9d8f', '#ef476f', '#118ab2', '#ffd166'][i] });
    }
    // a bus, proudly
    if (t < 32) {
      const bx = F.lerp(-260, 2200, F.prog(t, 21, 31));
      A.bus(ctx, bx, GROUND + 130, 0.9, { label: 'ELECTRIC BUS' });
    }
    // banner
    const bannerP = F.prog(t, 22.4, 23.6);
    const sag = F.prog(t, 30.1, 30.6, 'outBounce');
    if (t < 31.8) A.banner(ctx, F.W / 2, 150 + sag * 40, 1560, 'BERKELEY — LEADING THE FIGHT AGAINST GREENHOUSE GASES', { p: bannerP, color: '#2a9d8f', size: 36, rot: sag * 0.09 });

    // the parade: cars pour in toward a proposed terminal; the parking spreads
    if (jam > 0) {
      const lotW = 120 + F.prog(t, 32.4, 36.4, 'out') * 820;
      A.lot(ctx, F.W - 40 - lotW, GROUND + 20, lotW, 230, { cols: Math.max(2, Math.floor(lotW / 70)), fill: () => 0.85, seed: 3 });
      A.terminal(ctx, F.W - 300, GROUND - 40, 0.7, { p: F.prog(t, 31.8, 33), t, label: 'PROPOSED FERRY TERMINAL' });
      for (let i = 0; i < 14; i++) {
        const x = F.lerp(-200, F.W - 520, ((t - 31.6) * 0.35 + i / 14) % 1);
        A.car(ctx, x, GROUND + (i % 2 ? 140 : 250), 0.75, { color: CAR_COLS.concat(['#e63946', '#457b9d', '#f4a261'])[i % 8], t, phase: i });
      }
      A.banner(ctx, F.W / 2, 150, 1400, 'THE FUTURE OF SUSTAINABLE TRANSPORTATION', { p: F.prog(t, 33, 34.2), color: '#e04a3f', size: 44 });
    }
    // "Sometimes.": the whole street holds its breath (a little sweat drop on the sun)
    const hold = F.window(t, 28.4, 32, 0.3);
    if (hold > 0) {
      ctx.globalAlpha = hold;
      A.ink(ctx, (c) => { c.moveTo(1760, 120); c.quadraticCurveTo(1782, 150, 1770, 166); c.quadraticCurveTo(1748, 156, 1760, 120); }, '#9be7ff', 3);
      ctx.globalAlpha = 1;
    }
  }

  // ---------- back to the waterfront (storybook page) ----------
  function waterfrontPage(ctx, t) {
    A.sky(ctx, '#3d8fe0', '#d6efff', 0, 600);
    A.cirrus(ctx, t, 4, 0.5, 300);
    A.hills(ctx, 560, '#86ac7f', { seed: 7, amp: 110 });
    A.water(ctx, 600, t, { rows: 6, seed: 9 });
    // docks and boats
    for (let i = 0; i < 4; i++) {
      const x = 240 + i * 330;
      A.box(ctx, x - 140, 700, 280, 22, '#c8b58f', { r: 4, lw: 4 });
      A.sailboat(ctx, x - 60, 690, 0.8, { t, phase: i, sail: i % 2 ? '#fff' : '#ffd6a5' });
    }
    A.windsurfer(ctx, 1540, 650, 0.8, { t, sail: '#ff006e' });
    A.wingfoiler(ctx, 1760, 680, 0.7, { t, wing: '#00b4d8' });
    // the treasury, peeking in, worried; a coin slips out of a crack
    const pop = F.prog(t, 41.4, 42.2);
    if (pop > 0) {
      P.pig(ctx, 1000, 760, 0.55 * A.popScale(pop), { t, fullness: 0.75, eyes: 'wide', mouth: 'o', ears: 0.3 });
      const drip = ((t - 41.6) % 1.2) / 1.2;
      A.coin(ctx, 1080, 790 + drip * 120, 14, t * 6);
    }
  }

  F.scene('ferry', function (ctx, t) {
    if (t < 21.2) {
      sepiaPart(ctx, t);
      // color blooms through an expanding circle
      const bloom = F.prog(t, 20.4, 21.2, 'in');
      if (bloom > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(F.W / 2, F.H / 2, bloom * 1200, 0, Math.PI * 2);
        ctx.clip();
        colorPart(ctx, t);
        ctx.restore();
      }
    } else if (t < 37.4) {
      colorPart(ctx, t);
    } else {
      // a page turns back to the waterfront
      const turn = F.prog(t, 37.4, 38.6, 'inOut');
      waterfrontPage(ctx, t);
      if (turn < 1) {
        const x = F.W * turn;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(F.W, 0); ctx.lineTo(F.W, F.H); ctx.lineTo(x - 200, F.H); ctx.closePath();
        ctx.clip();
        colorPart(ctx, t);
        ctx.restore();
        A.poly(ctx, [[x, 0], [x + 120 * (1 - turn), 0], [x - 120 - 80 * (1 - turn), F.H], [x - 200, F.H]], '#f3e8cd', 5);
      }
      // storybook border
      ctx.strokeStyle = '#f3e8cd';
      ctx.lineWidth = 40;
      ctx.strokeRect(20, 20, F.W - 40, F.H - 40);
      A.line(ctx, [[40, 40], [F.W - 40, 40], [F.W - 40, F.H - 40], [40, F.H - 40], [40, 40]], '#c9a227', 5);
    }
  });
})();
