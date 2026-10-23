'use strict';
// Scene 10 — The resilience miracle (a satirical scenario, labeled). The heroic electric ferry;
// the bridge and BART close; the grid fails; the ferry can't charge; "That's what the emergency
// is."; diesel generators roll in under a ZERO-EMISSION banner.
(function () {
  const A = F.art, C = F.people, K = F.kitC, INK = A.INK;
  const DECK = 742, WATER = 790;

  function skyFor(ctx, dark, y1 = WATER) {
    const top = C.mixColor('#2f7fd1', '#1b1f3b', dark), low = C.mixColor('#cbe8ff', '#6d5a7a', dark);
    A.sky(ctx, top, low, 0, y1);
  }

  // the dock, the ferry, the charger; dark 0..1 dims the world; power 0..1 lights the ferry back up
  function dock(ctx, t, o) {
    const dark = o.dark || 0;
    skyFor(ctx, dark);
    if (dark < 0.6) A.cirrus(ctx, t, 7, 0.5 * (1 - dark), 300);
    A.sfSkyline(ctx, 1500, WATER - 30, 0.9, C.mixColor('#8aa4c0', '#3a4560', dark));
    A.water(ctx, WATER - 30, t, { color: C.mixColor('#2f84c9', '#1d3b5c', dark), light: C.mixColor('#8cc8f0', '#4d6d8f', dark), rows: 6 });
    // the ferry, moored
    const fx = 1380, fy = WATER + 10;
    A.ferry(ctx, fx, fy, 1.25, { t, label: 'WETA', stripe: '#0077b6' });
    // lightning-bolt decal: it's electric
    A.at(ctx, fx + 170, fy - 75, 1.25, 0, (c) => A.poly(c, [[0, -30], [-18, 4], [-2, 4], [-12, 32], [18, -6], [2, -6], [12, -30]], '#ffd23f', 4));
    // the dock
    A.box(ctx, -40, DECK, 980, 30, '#a47148', { r: 4, lw: 5 });
    for (let x = 0; x < 940; x += 120) A.box(ctx, x, DECK + 26, 26, 140, '#7b5a3c', { r: 3, lw: 4 });
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 3;
    for (let x = 20; x < 940; x += 46) { ctx.beginPath(); ctx.moveTo(x, DECK + 3); ctx.lineTo(x, DECK + 27); ctx.stroke(); }
    // dim the world for the blackout, before the things that glow
    if (dark > 0) { ctx.fillStyle = `rgba(12,16,40,${0.42 * dark})`; ctx.fillRect(0, 0, F.W, F.H); }
    // ferry windows glow when powered
    if (o.power > 0) {
      ctx.globalAlpha = o.power;
      for (let i = 0; i < 8; i++) A.box(ctx, fx + (-236 + i * 52) * 1.25, fy + (-92) * 1.25, 38 * 1.25, 34 * 1.25, '#ffe066', { r: 6, lw: 3 });
      ctx.globalAlpha = 1;
    }
    // the charger, its screen, its cable to the ferry
    const cx = 880;
    A.line(ctx, [[cx + 30, DECK - 150], [cx + 140, DECK - 60], [cx + 230, DECK - 120], [fx - 250, fy - 70]], INK, 12);
    A.line(ctx, [[cx + 30, DECK - 150], [cx + 140, DECK - 60], [cx + 230, DECK - 120], [fx - 250, fy - 70]], '#3a3a3a', 7);
    A.box(ctx, cx - 50, DECK - 230, 100, 230, '#e9ecef', { r: 14, lw: 6 });
    A.box(ctx, cx - 38, DECK - 212, 76, 60, o.screenBg || '#1b263b', { r: 8, lw: 4 });
    A.text(ctx, o.pct || '100%', cx, DECK - 182, { size: 28, color: o.screenColor || '#7CFC00' });
    if (o.screen) A.at(ctx, cx, DECK - 300, 1, -0.03, (c) => A.tagSmall(c, o.screen, 0, 0, 36, o.screenTag || '#fffbea'));
    A.at(ctx, cx, DECK - 120, 1, 0, (c) => A.poly(c, [[0, -18], [-12, 3], [-1, 3], [-8, 20], [12, -4], [1, -4], [8, -18]], '#ffd23f', 3));
  }

  // diesel generator trailer
  function generator(ctx, x, y, s, t, seed, running) {
    A.at(ctx, x, y, s, 0, (c) => {
      const jig = running && !F.reduced ? Math.sin(t * 40 + seed) * 2 : 0;
      c.translate(0, jig);
      A.box(c, -130, -150, 260, 120, '#f2c14e', { r: 12, lw: 6 });
      A.box(c, -112, -134, 140, 40, '#fff', { r: 6, lw: 4 });
      A.text(c, 'DIESEL', -42, -122, { size: 18 });
      A.text(c, 'GENERATOR', -42, -102, { size: 14 });
      for (let i = 0; i < 4; i++) A.line(c, [[50 + i * 16, -130], [50 + i * 16, -60]], INK, 4);
      A.box(c, 70, -210, 26, 64, '#555', { r: 4, lw: 4 });
      [-80, 80].forEach((wx) => { A.circle(c, wx, -26, 26, '#222', 5); A.circle(c, wx, -26, 9, '#bbb', 3); });
      A.line(c, [[-130, -60], [-190, -40]], INK, 6);
    });
    if (running) A.smoke(ctx, x + 83 * s, y - 214 * s, t, { n: 9, s: s * 1.5, color: 'rgba(52,52,58,0.9)', seed, rise: 380, drift: 120, speed: 0.4 });
  }

  // the Bay Bridge up close, closed
  function bridgeShot(ctx, t) {
    skyFor(ctx, 0.25, 640);
    A.cirrus(ctx, t, 9, 0.4, 300);
    A.water(ctx, 640, t, { rows: 6 });
    // towers and cables
    const deckY = 560;
    [[-60, 300], [420, 1000], [1000, 1580], [1580, 2160]].forEach(([x0, x1]) => {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(x0, 170); ctx.quadraticCurveTo((x0 + x1) / 2, 540, x1, 170); ctx.stroke();
      ctx.strokeStyle = '#b0bec5';
      ctx.lineWidth = 5;
      ctx.stroke();
      for (let k = 1; k < 9; k++) {
        const u = k / 9, xx = F.lerp(x0, x1, u), yy = 170 + (540 - 170) * (1 - Math.pow(2 * u - 1, 2)) * 0.98;
        A.line(ctx, [[xx, yy], [xx, deckY]], '#90a4ae', 3);
      }
    });
    [300, 1000, 1580].forEach((x) => { A.box(ctx, x - 30, 140, 60, 520, '#b0bec5', { r: 4, lw: 6 }); A.box(ctx, x - 36, 300, 72, 18, '#90a4ae', { r: 3, lw: 4 }); });
    A.box(ctx, -40, deckY, F.W + 80, 46, '#90a4ae', { r: 4, lw: 6 });
    // barricades and signs in the foreground (on the approach)
    const pop = (a) => A.popScale(F.prog(t, a, a + 0.5));
    A.at(ctx, 620, 760, pop(4.8), -0.04, (c) => {
      A.box(c, -260, -60, 520, 40, '#fff', { r: 6, lw: 5 });
      for (let i = 0; i < 6; i++) A.poly(c, [[-250 + i * 90, -60], [-210 + i * 90, -60], [-250 + i * 90 + 40, -20], [-250 + i * 90, -20]], '#e63946', 0);
      [-200, 200].forEach((lx) => { A.line(c, [[lx, -20], [lx - 40, 70]], INK, 8); A.line(c, [[lx, -20], [lx + 40, 70]], INK, 8); });
      A.sign(c, 0, -60, ['BAY BRIDGE', 'CLOSED'], { w: 560, size: 50, post: false, bg: '#ffd23f' });
    });
    A.at(ctx, 1380, 740, pop(5.6), 0.05, (c) => A.sign(c, 0, 0, ['BART', 'CLOSED'], { w: 300, size: 54, postH: 120, bg: '#fff', color: '#c1121f' }));
    // flashing emergency lights
    const flash = F.reduced ? 0.5 : Math.sin(t * 12) > 0 ? 1 : 0;
    ctx.fillStyle = flash ? 'rgba(230,57,70,0.18)' : 'rgba(58,134,255,0.18)';
    ctx.fillRect(0, 0, F.W, F.H);
  }

  // Berkeley at dusk, its lights going out
  function cityShot(ctx, t) {
    const out = F.prog(t, 7.6, 9.4);
    skyFor(ctx, 0.75 + 0.25 * out, 760);
    A.hills(ctx, 560, C.mixColor('#5e7a6e', '#2b3540', out), { seed: 4, amp: 170, campanile: 1080 });
    ctx.fillStyle = C.mixColor('#4a5568', '#232838', out);
    ctx.fillRect(0, 560, F.W, F.H - 560);
    const r = F.rng(44);
    for (let row = 0; row < 4; row++) {
      for (let x = -40 + row * 30; x < F.W + 60; x += 120 + row * 10) {
        const h = 70 + r() * 90 - row * 6, w = 100 + r() * 30, y = 600 + row * 120;
        A.box(ctx, x, y - h, w, h, C.mixColor('#7a8699', '#353b4d', out), { r: 4, lw: 4 });
        A.poly(ctx, [[x - 8, y - h], [x + w / 2, y - h - 40], [x + w + 8, y - h]], C.mixColor('#9c6644', '#4a3a36', out), 4);
        const off = t > 7.6 + (x / F.W) * 1.6 + r() * 0.3;
        for (let k = 0; k < 2; k++) A.box(ctx, x + 18 + k * 44, y - h + 22, 26, 26, off ? '#1b2033' : '#ffe066', { r: 3, lw: 3 });
      }
    }
    if (out > 0.6) {
      const k = F.prog(t, 9.0, 9.5);
      A.at(ctx, F.W / 2, 260, A.popScale(k), -0.04, (c) => A.tagSmall(c, 'REGIONAL GRID: DOWN', 0, 0, 56, '#ffccd5'));
    }
  }

  F.scene('resilience', function (ctx, t, sc) {
    if (t < 4.6) {
      // the hero shot: ready to save the day
      dock(ctx, t, { dark: 0, power: 1, pct: '100%' });
      const glint = F.window(t, 0.6, 4.4, 0.4);
      A.sparkles(ctx, 1380, 640, 900, 260, t, 16, 3, glint);
      const k = F.prog(t, 0.8, 1.4);
      A.banner(ctx, F.W / 2, 170, 1100, 'EMERGENCY READY!', { p: k, size: 64, color: '#0077b6' });
      C.person(ctx, 360, DECK, 0.7, 'official', { armR: 2.9, armL: 0.3, mouth: 'grin', eyes: 'happy' });
    } else if (t < 7.4) {
      bridgeShot(ctx, t);
    } else if (t < 10.2) {
      cityShot(ctx, t);
    } else {
      const gens = F.prog(t, 21.0, 25.0, 'out');
      const running = t > 23.6;
      const charge = t < 24 ? 0 : Math.min(3, Math.floor((t - 24) / 3) + 1);
      const tries = t > 10.4 && t < 13 && Math.floor(t * 1.7) % 2 === 0;
      dock(ctx, t, {
        dark: 1,
        power: running ? F.prog(t, 23.8, 24.6) : 0,
        screen: t < 24 ? (tries ? 'CHARGING…' : 'CHARGING… 0%') : `CHARGING… ${charge}%`,
        screenTag: t < 24 ? '#ffccd5' : '#fff3b0',
        pct: t < 24 ? '0%' : charge + '%',
        screenColor: t < 24 ? '#ff6b6b' : '#ffd23f',
      });
      // the generators roll in along the back of the dock
      [[-520, 150, 11], [-760, 420, 23], [-1000, 690, 37]].forEach(([x0, x1, seed], i) => {
        const x = F.lerp(x0, x1, F.prog(gens, i * 0.12, 0.7 + i * 0.1, 'out'));
        if (x > -300) generator(ctx, x, DECK - 6, 0.8, t, seed, running);
      });
      // a few extra smoke clouds fill the sky as the generators keep going
      const fill = F.prog(t, 25, 34);
      if (fill > 0) {
        const r = F.rng(71);
        for (let i = 0; i < 9; i++) {
          const k = F.prog(fill, i / 12, i / 12 + 0.25);
          if (k <= 0) continue;
          A.circle(ctx, 160 + r() * 1600, 120 + r() * 260, (60 + r() * 70) * k, 'rgba(70,70,78,0.75)', 4);
        }
      }
      // the official and the engineer
      const cough = t > 30 && t < 34 && Math.floor(t * 2) % 3 === 0;
      const held = t > 18.8 && t < 21;
      C.person(ctx, 300, DECK, 0.72, 'official', {
        talk: F.talking(sc, 'official', t),
        armR: t > 13.4 && t < 15.8 ? 1.3 : t > 26 ? 2.6 : 0.2,
        eyes: held ? 'wide' : cough ? 'closed' : 'open',
        mouth: held ? 'flat' : t > 26 ? 'grin' : 'smile',
        hold: t > 26 ? (c) => { A.circle(c, 0, -8, 16, '#f1c27d', 4); A.box(c, -6, -46, 12, 34, '#f1c27d', { r: 6, lw: 4 }); } : null,
        bob: cough && !F.reduced ? 6 : 0,
      });
      C.person(ctx, 600, DECK, 0.72, 'engineer', {
        face: -1,
        talk: F.talking(sc, 'engineer', t),
        armR: t > 16.4 && t < 18.8 ? 1.0 : 0.2,
        eyes: held ? 'half' : 'open',
        mouth: 'flat',
        hold: C.props.clipboard,
      });
      // the held beat: crickets
      if (held) A.text(ctx, 'chirp…', 460, 300, { size: 40, family: A.STORY, style: 'italic', color: '#dfe7fd' });
      if (cough) A.text(ctx, 'KOFF!', 360, 380, { size: 44, color: '#fff', stroke: INK, strokeW: 8 });
      // the banner and its small print
      const bp = F.prog(t, 22.6, 23.6);
      if (bp > 0) {
        A.banner(ctx, F.W / 2, 160, 1560, "BERKELEY'S ZERO-EMISSION EMERGENCY RESPONSE SYSTEM", { p: bp, size: 46, color: '#2a9d8f', h: 110 });
        ctx.globalAlpha = F.prog(t, 24.4, 25);
        A.at(ctx, F.W / 2, 252, 1, 0, (c) => A.tagSmall(c, '*SOME EMISSIONS MAY APPLY', 0, 0, 22, '#fffbea'));
        ctx.globalAlpha = 1;
      }
    }
  });
})();
