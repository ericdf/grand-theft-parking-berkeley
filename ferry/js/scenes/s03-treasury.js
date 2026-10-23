'use strict';
// Scene 3 — The kingdom and its treasury. The Marina Enterprise Fund pig eats coins from slips,
// leases and operations; hoses drain it to PARKS / LANDSCAPING / PUBLIC SERVICES while the docks
// age. The State boating official objects. "We have another fund": the sickly Workers' Comp pig,
// already drained by hoses running offscreen, wheels in. "It's a very healthy fund." A new hose; the
// Marina pig perks up, briefly. Applause. PIER CLOSED — 2015. Then a rosy glow: a miracle arrives.
//
// The Workers' Comp pig's illness and its other hoses are a comic metaphor, not a claim about that
// fund's finances or about where its money goes.
(function () {
  const A = F.art, P = F.people, INK = A.INK;
  const GROUND = 790;
  const MP = { x: 560, y: 640, s: 0.85 };     // Marina pig
  const WP = { x: 1330, y: 660, s: 0.72 };    // Workers' Comp pig (on its dolly)

  // ---------- helpers ----------
  // draw only the first fraction `p` of a polyline (for hoses being attached)
  function partial(pts, p) {
    if (p >= 1) return pts;
    let L = 0;
    const seg = [];
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
    let want = L * p;
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      if (want >= seg[i - 1]) { out.push(pts[i]); want -= seg[i - 1]; continue; }
      const u = want / seg[i - 1];
      out.push([F.lerp(pts[i - 1][0], pts[i][0], u), F.lerp(pts[i - 1][1], pts[i][1], u)]);
      break;
    }
    return out;
  }
  // a smooth curve sampled into points
  function curve(a, c1, c2, b, n = 18) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, v = 1 - u;
      out.push([v * v * v * a[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * b[0], v * v * v * a[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * b[1]]);
    }
    return out;
  }

  // the Marina pig's state over time
  function marinaFull(t) {
    let f = 1 - F.prog(t, 12, 20, 'inOut') * 0.78;          // drained to ~0.22
    f += F.prog(t, 39, 41, 'outBack') * 0.42;                 // the loan arrives
    f -= F.prog(t, 42, 45.5, 'inOut') * 0.44;                 // and drains right back out
    return F.clamp(f, 0.12, 1.05);
  }

  // ---------- the set: marina deck in front, docks on the water behind ----------
  function set(ctx, t, decay) {
    A.sky(ctx, '#3d8fe0', '#d6efff', 0, 520);
    A.cirrus(ctx, t, 14, 0.5, 260);
    A.hills(ctx, 500, '#86ac7f', { seed: 21, amp: 100 });
    A.water(ctx, 520, t, { rows: 5, seed: 13 });
    // background docks with boats; they sag and crack as the money drains
    for (let i = 0; i < 5; i++) {
      const x = 120 + i * 400, tilt = decay * (i % 2 ? 0.08 : -0.06);
      A.at(ctx, x, 600, 1, tilt, (c) => {
        for (let k = -1; k <= 1; k++) A.box(c, k * 110 - 8, -10 + (k === 1 ? decay * 26 : 0), 16, 70, '#6e5a44', { r: 3, lw: 3 });
        A.box(c, -150, -16, 300, 18, '#c8b58f', { r: 3, lw: 4 });
        if (decay > 0.3) {
          A.line(c, [[-40, -16], [-30, -6], [-44, 2]], INK, 3);
          c.fillStyle = '#2f84c9';
          c.fillRect(40, -15, 40 * decay, 16);
        }
      });
      A.sailboat(ctx, x - 40, 586 + decay * 18, 0.55, { t, phase: i, sail: i % 2 ? '#fff' : '#ffd6a5', dir: i % 2 ? 1 : -1 });
    }
    // the deck where the cast stands
    A.box(ctx, -20, GROUND - 40, F.W + 40, F.H - GROUND + 60, '#b99b6b', { r: 0, lw: 5 });
    for (let x = 0; x < F.W; x += 90) A.line(ctx, [[x, GROUND - 38], [x - 40, F.H]], 'rgba(0,0,0,0.18)', 3);
  }

  function coinsIn(ctx, t) {
    // three coin sources on the left: slips, leases, operations
    const SRC = [['BOAT SLIPS', 300], ['LEASES', 430], ['OPERATIONS', 560]];
    const on = F.prog(t, 4.8, 5.4);
    if (on <= 0) return;
    const slot = [MP.x + 0, MP.y - 150 * MP.s];
    const rate = 1 - F.prog(t, 16, 20) * 0.6;
    SRC.forEach(([label, y], k) => {
      A.at(ctx, 110, y, A.popScale(F.prog(t, 4.8 + k * 0.3, 5.4 + k * 0.3)), 0, (c) => {
        A.box(c, -90, -36, 180, 72, ['#ffd23f', '#9be7ff', '#c7f9cc'][k], { r: 14, lw: 5 });
        A.text(c, label, 0, 2, { size: 24 });
      });
      for (let i = 0; i < 3; i++) {
        const ph = ((t * 0.9 + i / 3 + k * 0.21) % 1);
        if (ph * rate > 0.92) continue;
        const cx = F.lerp(200, slot[0], ph), cy = F.lerp(y, slot[1], ph) - Math.sin(ph * Math.PI) * 140;
        A.coin(ctx, cx, cy, 16, t * 6 + i);
      }
    });
  }

  // drain hoses from the Marina pig up and out the top of the frame
  const DRAINS = [
    ['PARKS', [MP.x - 60, MP.y - 60], [300, -40], 10.2],
    ['LANDSCAPING', [MP.x + 10, MP.y - 80], [640, -40], 11.0],
    ['PUBLIC SERVICES', [MP.x + 80, MP.y - 60], [980, -40], 11.8],
  ];
  function drainPath(d) {
    const [, a, b] = d;
    return curve(a, [a[0], a[1] - 220], [b[0], b[1] + 260], b);
  }
  function drains(ctx, t) {
    DRAINS.forEach((d, k) => {
      const p = F.prog(t, d[3], d[3] + 1.1, 'out');
      if (p <= 0) return;
      const pts = partial(drainPath(d), p);
      A.hose(ctx, pts, { color: ['#3f8f3a', '#2a9d8f', '#8338ec'][k], flow: t > 12 ? -t * 0.45 : 0, w: 20, blobs: 5 });
      if (p >= 1) {
        const lp = drainPath(d)[13];
        A.tagSmall(ctx, d[0], lp[0] + (k === 0 ? -40 : 40), lp[1], 26);
      }
    });
  }

  // the Workers' Comp pig's preexisting hoses: leave the frame; deliberately unlabeled
  const WC_OUT = [
    [[WP.x + 120, WP.y - 70], [1640, 340], [1820, 260], [1990, 200]],
    [[WP.x + 140, WP.y + 10], [1700, 560], [1860, 720], [1990, 760]],
    [[WP.x + 40, WP.y - 120], [1420, 300], [1560, 60], [1640, -60]],
  ];
  function wcHoses(ctx, t, wx) {
    WC_OUT.forEach((h, k) => {
      const pts = curve([h[0][0] + wx, h[0][1]], h[1], h[2], h[3]);
      A.hose(ctx, pts, { color: ['#7f8c8d', '#95a5a6', '#6c7a89'][k], flow: -t * 0.3 - k * 0.2, w: 16, blob: 'energy', blobs: 4 });
    });
  }

  function stage(ctx, t) {
    const decay = F.prog(t, 16, 20.6, 'inOut') * 0.7 + F.prog(t, 42, 46) * 0.3;
    set(ctx, t, decay);
    coinsIn(ctx, t);

    // Workers' Comp pig rolls in on a dolly (28.4–31), pushed by the official
    const roll = F.prog(t, 28.4, 31, 'out');
    const wx = (1 - roll) * 900;
    if (roll > 0) {
      wcHoses(ctx, t, wx);
    }
    drains(ctx, t);

    // the Marina pig
    const mf = marinaFull(t);
    const perk = F.window(t, 39, 42.4, 0.4);
    const squeak = F.window(t, 14.4, 15.4, 0.2);
    // a drained pig also shrinks a little, so the loss reads at a glance
    const shrink = 0.72 + 0.28 * F.clamp(mf, 0, 1);
    P.pig(ctx, MP.x, MP.y + (1 - shrink) * 120, MP.s * shrink, {
      t, fullness: mf, ears: perk > 0.5 ? 0 : F.prog(t, 13, 19) * 0.9 + F.prog(t, 42, 45) * 0.1,
      eyes: perk > 0.5 ? 'happy' : t > 44 ? 'half' : squeak > 0.3 ? 'wide' : t < 9 ? 'happy' : 'open',
      mouth: perk > 0.5 ? 'smile' : squeak > 0.3 ? 'o' : t > 13 ? 'frown' : 'smile',
      cough: 0,
    });
    A.tagSmall(ctx, 'MARINA ENTERPRISE FUND', MP.x, MP.y + 205 * MP.s - 290, 26, '#ffe3ea');

    // the loan: a new hose from the Workers' Comp pig to the Marina pig, pulsing with energy
    const attach = F.prog(t, 37.2, 38.4, 'out');
    if (attach > 0) {
      const pts = curve([WP.x - 150, WP.y - 20], [1150, 420], [800, 420], [MP.x + 150, MP.y - 30]);
      A.hose(ctx, partial(pts, attach), { color: '#f28c28', w: 24, flow: attach >= 1 ? t * 0.5 : 0, blob: 'energy', blobs: 6 });
    }

    // the Workers' Comp pig, on its dolly
    if (roll > 0) {
      const cough = F.window(t, 30.4, 31.2, 0.1) + F.window(t, 35.4, 36.1, 0.1);
      const sick = 0.85 + F.prog(t, 38.4, 44) * 0.15;
      A.at(ctx, WP.x + wx, 0, 1, 0, (c) => {
        A.box(c, -170, 790, 340, 22, '#7b7b85', { r: 6, lw: 4 });
        A.circle(c, -120, 820, 20, '#333', 4);
        A.circle(c, 120, 820, 20, '#333', 4);
        A.line(c, [[160, 790], [210, 560]], '#7b7b85', 10);
      });
      P.pig(ctx, WP.x + wx, WP.y, WP.s, { t, fullness: 0.42 - F.prog(t, 38.4, 44) * 0.18, sick, cough, eyes: t > 43 ? 'closed' : 'half' });
      if (roll >= 1) A.tagSmall(ctx, "WORKERS' COMPENSATION FUND", WP.x, WP.y - 190, 26, '#eef2f0');
    }
  }

  function cast(ctx, t, sc) {
    // the official: attaches hoses, reassures, pushes the dolly, congratulates
    const ox = t < 9.5 ? F.lerp(2100, 980, F.prog(t, 7.6, 9.6, 'out'))
      : t < 28.2 ? 980 + (t > 14.6 && t < 21 ? 0 : 0)
        : t < 31.2 ? F.lerp(2300, 1560, F.prog(t, 28.4, 31, 'out')) : t < 44 ? 1560 : F.lerp(1560, 1150, F.prog(t, 44, 44.8, 'out'));
    const attaching = (t > 10 && t < 13.2);
    const talk = F.talking(sc, 'official', t);
    const wave = F.reduced ? 0 : Math.sin(t * 10) * 0.3;
    P.person(ctx, ox, GROUND + 10, 0.8, 'official', {
      face: -1, talk,
      armR: attaching ? 1.9 + wave : t > 32.4 && t < 34.8 ? 1.2 : t > 44.4 ? 1.2 : 0.2,
      armL: t > 25.6 && t < 28.2 ? 2.4 : 0.1,
      walk: (t > 7.6 && t < 9.6) || (t > 28.4 && t < 31) || (t > 44 && t < 44.8) ? t * 9 : null,
      eyes: t > 32.4 && t < 37 ? 'closed' : 'open',
    });
    // the State boating official with a sign
    const sIn = F.prog(t, 19.8, 21.2, 'out'), sOut = F.prog(t, 26.6, 28, 'in');
    if (sIn > 0 && sOut < 1) {
      const sx = F.lerp(2150, 1520, sIn) + sOut * 700;
      P.person(ctx, sx, GROUND + 10, 0.8, 'state', {
        face: -1, talk: F.talking(sc, 'state', t), armR: 2.6, brow: 1, mouth: 'frown',
        walk: (sIn < 1 || sOut > 0) ? t * 9 : null,
        hold: (c) => A.at(c, 0, 0, 1.35, 0, (k) => {
          k.scale(-1, 1); // the body faces left; keep the lettering readable
          A.line(k, [[0, 10], [0, -120]], '#7b5a3c', 8);
          A.box(k, -170, -300, 340, 190, '#fffbea', { r: 12, lw: 6 });
          A.text(k, 'THIS IS NOT HOW ENTERPRISE FUNDS ARE TYPICALLY USED.', 0, -205, { size: 30, maxW: 300 });
        }),
      });
    }
    // a second official for the congratulations
    if (t > 43.6) {
      const mx = F.lerp(-200, 820, F.prog(t, 43.6, 44.6, 'out'));
      P.person(ctx, mx, GROUND + 10, 0.8, 'member', { face: 1, armR: 1.2, mouth: 'grin', walk: t < 44.6 ? t * 9 : null });
      if (t > 44.6) {
        const r = F.rng(Math.floor(t * 10));
        for (let i = 0; i < 26; i++) {
          const ph = ((t - 44.6) * 0.8 + r()) % 1;
          ctx.fillStyle = ['#ffd23f', '#ef476f', '#06d6a0', '#118ab2'][i % 4];
          ctx.fillRect(700 + r() * 700, 200 + ph * 500, 12, 18);
        }
      }
    }
  }

  // ---------- the pier, closed ----------
  function pierClosed(ctx, t) {
    const glow = F.prog(t, 52.6, 55.4);
    A.sky(ctx, glow > 0 ? A.shade('#3d8fe0', 0) : '#3d8fe0', '#d6efff', 0, 560);
    A.cirrus(ctx, t, 2, 0.5, 260);
    A.water(ctx, 560, t, { rows: 6, seed: 3 });
    // the old pier receding toward the horizon
    A.poly(ctx, [[0, 690], [0, 760], [1500, 576], [1500, 566]], '#c8b58f', 5);
    for (let i = 0; i < 16; i++) {
      const u = i / 16, x = F.lerp(40, 1460, u), y = F.lerp(760, 576, u), h = F.lerp(170, 18, u);
      A.box(ctx, x - F.lerp(10, 2, u), y, F.lerp(20, 4, u), h, '#6e5a44', { r: 2, lw: F.lerp(4, 1.5, u) });
    }
    // a gap where the deck has failed
    A.poly(ctx, [[820, 652], [900, 642], [930, 640], [850, 650]], '#2f84c9', 3);
    // the gate and its sign
    A.box(ctx, 160, 520, 300, 220, null, { r: 4, lw: 6 });
    ctx.strokeStyle = 'rgba(29,26,36,0.6)';
    ctx.lineWidth = 2;
    for (let k = 0; k < 14; k++) { ctx.beginPath(); ctx.moveTo(160 + k * 22, 520); ctx.lineTo(160 + k * 22 + 60, 740); ctx.stroke(); ctx.beginPath(); ctx.moveTo(460 - k * 22, 520); ctx.lineTo(400 - k * 22, 740); ctx.stroke(); }
    A.at(ctx, 310, 560, A.popScale(F.prog(t, 46.4, 47.2)), F.wob(t, 2, 0.03), (c) => {
      A.box(c, -230, -110, 460, 150, '#d62828', { r: 14, lw: 6 });
      A.text(c, 'PIER CLOSED', 0, -60, { size: 56, color: '#fff' });
      A.text(c, '2015', 0, 2, { size: 46, color: '#fff' });
    });
    // NEEDS WORK tags: docks, seawalls, then nearly everything
    const tags = [[1120, 620, 49.0], [600, 840, 50.4], [1400, 360, 51.2], [1700, 640, 51.5], [900, 300, 51.8], [1650, 170, 52.0], [250, 300, 52.2], [1300, 800, 52.4]];
    tags.forEach(([x, y, at], i) => {
      const p = F.prog(t, at, at + 0.4);
      if (p <= 0) return;
      A.at(ctx, x, Math.min(y, 800), A.popScale(p), (i % 2 ? 0.08 : -0.08), (c) => A.tagSmall(c, i === 0 ? 'DOCKS: NEEDS WORK' : i === 1 ? 'SEAWALLS: NEEDS WORK' : 'NEEDS WORK', 0, 0, 26, '#fff3b0'));
    });
    A.gull(ctx, 1500 + Math.sin(t) * 40, 260, 1.4, t);
    // the miracle approaches: a rosy light from above
    if (glow > 0) {
      A.grade(ctx, 'gold', glow);
      ctx.save();
      ctx.globalAlpha = glow * 0.55;
      const g = ctx.createLinearGradient(1300, 0, 1000, 900);
      g.addColorStop(0, '#fff2c4');
      g.addColorStop(1, 'rgba(255,190,200,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(1150, 0); ctx.lineTo(1500, 0); ctx.lineTo(1400, 900); ctx.lineTo(800, 900); ctx.closePath(); ctx.fill();
      ctx.restore();
      A.sparkles(ctx, 1250, 300, 500, 500, t, 18, 4, glow);
    }
  }

  F.scene('treasury', function (ctx, t, sc) {
    if (t >= 46) { pierClosed(ctx, t); return; }
    // the close-up on "It's a very healthy fund."
    const zoom = F.prog(t, 32.2, 33, 'inOut') * (1 - F.prog(t, 36.6, 37.3, 'inOut'));
    ctx.save();
    if (zoom > 0) {
      const fx = WP.x + 60, fy = WP.y - 30, z = 1 + zoom * 1.25;
      ctx.translate(F.W / 2, F.H * 0.42);
      ctx.scale(z, z);
      ctx.translate(-F.lerp(F.W / 2, fx, zoom), -F.lerp(F.H * 0.42, fy, zoom));
    }
    stage(ctx, t);
    cast(ctx, t, sc);
    ctx.restore();
  });
})();
