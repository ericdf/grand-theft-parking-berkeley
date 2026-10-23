'use strict';
// The recurring cast as simple puppet rigs, plus the two living piggy banks.
// All characters are original generic archetypes; none depicts a real person.
(function () {
  const A = F.art, INK = A.INK;
  const C = (F.people = {});

  // Character designs. Keep these stable: the cast must read the same in every scene.
  C.CAST = {
    official:   { suit: '#2e3f78', tie: '#e63946', skin: '#f1c27d', hair: '#6b4f2a', hairStyle: 'combover', mouth: 'grin', h: 1.0, girth: 1.12 },
    consultant: { suit: '#5c6370', tie: '#ffd23f', skin: '#e0ac69', hair: '#222', hairStyle: 'slick', glasses: true, h: 1.04, girth: 0.92 },
    state:      { suit: '#8a7d55', tie: '#2a4d69', skin: '#c68642', hair: '#333', hairStyle: 'short', hat: 'ranger', h: 0.98, girth: 1.0 },
    engineer:   { suit: '#f28c28', tie: null, skin: '#8d5524', hair: '#111', hairStyle: 'short', hat: 'hardhat', vest: true, h: 1.0, girth: 1.0 },
    captain:    { suit: '#1d3557', tie: null, skin: '#e0ac69', hair: '#ddd', hairStyle: 'beard', hat: 'captain', h: 1.02, girth: 1.06 },
    comm1:      { suit: '#3a7d44', tie: null, skin: '#f1c27d', hair: '#bbb', hairStyle: 'bun', hat: null, windbreaker: true, h: 0.96, girth: 0.96 },
    comm2:      { suit: '#c44536', tie: null, skin: '#8d5524', hair: '#eee', hairStyle: 'beard', hat: 'cap', windbreaker: true, h: 1.0, girth: 1.0 },
    clerk:      { suit: '#6d597a', tie: null, skin: '#e0ac69', hair: '#3b2a20', hairStyle: 'bob', glasses: true, h: 0.94, girth: 0.95 },
    member:     { suit: '#264653', tie: '#e9c46a', skin: '#c68642', hair: '#222', hairStyle: 'short', h: 1.0, girth: 1.0 },
    citizen:    { suit: '#e9c46a', tie: null, skin: '#f1c27d', hair: '#a0522d', hairStyle: 'curly', h: 0.95, girth: 0.98 },
    fisherman:  { suit: '#5b7c99', tie: null, skin: '#c68642', hair: '#777', hairStyle: 'short', hat: 'bucket', h: 0.98, girth: 1.05 },
    windsurfer: { suit: '#222', tie: null, skin: '#e0ac69', hair: '#d4a373', hairStyle: 'short', wetsuit: true, h: 1.0, girth: 0.95 },
    swimmer:    { suit: '#ff6b35', tie: null, skin: '#f1c27d', hair: '#ff6b35', hairStyle: 'swimcap', swimsuit: true, h: 0.96, girth: 0.95 },
    passenger:  { suit: '#8ecae6', tie: null, skin: '#f1c27d', hair: '#5a3825', hairStyle: 'short', h: 0.95, girth: 0.95 },
  };

  // Draw a character standing with feet at (x, y). s ≈ 1 is about 360 px tall.
  // pose: { talk 0..1, face -1|1, armL/armR (radians; 0 = down, + = forward/up), eyes, mouth, brow, bob, lean, walk (phase), hold (fn(ctx) at right hand) }
  C.person = (ctx, x, y, s, who, pose = {}) => {
    const d = typeof who === 'string' ? C.CAST[who] : who;
    const face = pose.face || 1;
    const H = 360 * d.h, gw = d.girth;
    const bob = pose.bob || 0;
    ctx.save();
    ctx.translate(x, y - bob);
    ctx.scale(s * face, s);
    if (pose.lean) ctx.rotate(pose.lean);
    const walk = pose.walk == null ? null : pose.walk;
    // legs
    const legSwing = walk == null || F.reduced ? 0 : Math.sin(walk) * 0.45;
    const pant = d.swimsuit ? d.skin : d.wetsuit ? d.suit : A.shade(d.suit, -0.35);
    [[-22, legSwing], [22, -legSwing]].forEach(([lx, sw]) => {
      ctx.save();
      ctx.translate(lx * gw, -H * 0.44);
      ctx.rotate(sw);
      A.box(ctx, -13, 0, 26, H * 0.42, pant, { r: 8, lw: 5 });
      A.ellipse(ctx, 8, H * 0.43, 22, 11, '#222', 4);
      ctx.restore();
    });
    // body
    const bw = 116 * gw, bh = H * 0.36;
    const by = -H * 0.44 - bh;
    A.box(ctx, -bw / 2, by, bw, bh + 16, d.swimsuit ? d.suit : d.suit, { r: 34, lw: 5 });
    if (d.swimsuit) A.box(ctx, -bw / 2 + 6, by, bw - 12, bh * 0.45, d.skin, { r: 26, lw: 0 });
    if (d.vest) {
      A.box(ctx, -bw / 2 + 6, by + 6, bw - 12, bh, '#ffd23f', { r: 26, lw: 4 });
      ctx.fillStyle = '#e0e0e0'; ctx.fillRect(-bw / 2 + 8, by + bh * 0.45, bw - 16, 10);
    }
    if (d.tie) {
      A.poly(ctx, [[-12, by + 4], [0, by + 18], [12, by + 4]], '#fff', 3);
      A.poly(ctx, [[0, by + 16], [-9, by + 30], [0, by + bh * 0.75], [9, by + 30]], d.tie, 3);
    }
    if (d.windbreaker) A.line(ctx, [[0, by + 8], [0, by + bh]], '#eee', 4);
    // arms: shoulder pivots; angle 0 hangs down, positive swings forward/up
    const armLen = H * 0.3;
    const armC = d.swimsuit ? d.skin : d.vest ? d.suit : d.suit;
    const arm = (sx, ang, front) => {
      ctx.save();
      ctx.translate(sx, by + 26);
      ctx.rotate(-ang);
      A.box(ctx, -12, -6, 24, armLen, armC, { r: 11, lw: 5 });
      A.circle(ctx, 0, armLen, 13, d.skin, 4);
      if (front && pose.hold) { ctx.translate(0, armLen); ctx.rotate(ang); pose.hold(ctx); }
      ctx.restore();
    };
    const swingA = walk == null || F.reduced ? 0 : Math.sin(walk) * 0.4;
    arm(-bw / 2 + 6, (pose.armL == null ? 0.12 : pose.armL) - swingA, false);
    // head
    const hy = by - 58;
    ctx.save();
    ctx.translate(0, hy);
    if (pose.tilt) ctx.rotate(pose.tilt);
    C.head(ctx, d, pose);
    ctx.restore();
    arm(bw / 2 - 6, (pose.armR == null ? 0.12 : pose.armR) + swingA, true);
    ctx.restore();
  };

  C.head = (ctx, d, pose) => {
    const R = 54;
    // hair behind
    if (d.hairStyle === 'bun') A.circle(ctx, -40, -40, 22, d.hair, 4);
    if (d.hairStyle === 'bob') A.ink(ctx, (k) => { k.arc(0, -4, R + 8, Math.PI * 0.95, Math.PI * 2.05); k.lineTo(R + 8, 30); k.lineTo(-R - 8, 30); k.closePath(); }, d.hair, 4);
    if (d.hairStyle === 'curly') for (let i = 0; i < 7; i++) A.circle(ctx, -50 + i * 17, -40 - Math.sin(i) * 8, 20, d.hair, 4);
    A.circle(ctx, 0, 0, R, d.skin, 5);
    // ear
    A.ellipse(ctx, -R + 6, 4, 10, 15, d.skin, 4);
    // hair on top
    if (d.hairStyle === 'combover') A.ink(ctx, (k) => { k.moveTo(-R + 4, -14); k.quadraticCurveTo(-20, -R - 16, R - 2, -22); k.quadraticCurveTo(0, -R + 12, -R + 4, -14); }, d.hair, 4);
    if (d.hairStyle === 'slick') A.ink(ctx, (k) => { k.arc(0, -6, R, Math.PI * 1.05, Math.PI * 1.95); k.quadraticCurveTo(10, -26, -R + 2, -14); }, d.hair, 4);
    if (d.hairStyle === 'short') A.ink(ctx, (k) => { k.arc(0, -4, R + 2, Math.PI * 1.02, Math.PI * 1.98); k.quadraticCurveTo(0, -36, -R, -10); }, d.hair, 4);
    if (d.hairStyle === 'swimcap') A.ink(ctx, (k) => { k.arc(0, -2, R + 3, Math.PI * 0.98, Math.PI * 2.02); k.closePath(); }, d.hair, 4);
    if (d.hairStyle === 'bob' || d.hairStyle === 'bun' || d.hairStyle === 'curly') A.ink(ctx, (k) => { k.arc(0, -4, R + 2, Math.PI * 1.02, Math.PI * 1.98); k.quadraticCurveTo(10, -30, -R, -6); }, d.hair, 4);
    if (d.hairStyle === 'beard') A.ink(ctx, (k) => { k.moveTo(-R + 6, 6); k.quadraticCurveTo(-30, R + 26, 20, R + 10); k.quadraticCurveTo(R, 30, R - 4, 10); k.quadraticCurveTo(14, 34, -R + 6, 6); }, d.hair, 4);
    // face (looks right; the body flips for face = -1)
    const eyes = pose.eyes || 'open';
    const ex = [10, 36], ey = -8;
    ex.forEach((x) => {
      if (eyes === 'closed') A.line(ctx, [[x - 8, ey], [x + 8, ey]], INK, 4);
      else if (eyes === 'half') { A.ink(ctx, (k) => k.arc(x, ey, 9, 0, Math.PI), '#fff', 3); A.circle(ctx, x + 2, ey + 4, 3.5, INK, 0); A.line(ctx, [[x - 10, ey], [x + 10, ey]], INK, 4); }
      else { const r = eyes === 'wide' ? 13 : 9; A.circle(ctx, x, ey, r, '#fff', 3); A.circle(ctx, x + 3, ey + 1, eyes === 'wide' ? 4 : 4.5, INK, 0); }
    });
    if (d.glasses) { ex.forEach((x) => A.circle(ctx, x, ey, 15, null, 3.5)); A.line(ctx, [[25, ey], [21, ey]], INK, 3); }
    const brow = pose.brow || 0;
    A.line(ctx, [[2, -26 - brow * 6], [18, -28 + brow * 4]], INK, 4);
    A.line(ctx, [[28, -28 + brow * 4], [44, -26 - brow * 6]], INK, 4);
    // nose
    A.ink(ctx, (k) => { k.moveTo(46, 0); k.quadraticCurveTo(64, 12, 44, 18); }, d.skin, 4);
    // mouth
    const talk = pose.talk || 0, mouth = pose.mouth || d.mouth || 'smile';
    const mx = 30, my = 30;
    if (talk > 0.05) A.ellipse(ctx, mx, my, 12, 3 + talk * 11, '#7a1f2b', 3.5);
    else if (mouth === 'grin') A.ink(ctx, (k) => { k.moveTo(mx - 18, my - 4); k.quadraticCurveTo(mx, my + 16, mx + 18, my - 4); k.closePath(); }, '#fff', 3.5);
    else if (mouth === 'smile') A.ink(ctx, (k) => { k.moveTo(mx - 14, my - 2); k.quadraticCurveTo(mx, my + 10, mx + 14, my - 2); }, null, 4);
    else if (mouth === 'frown') A.ink(ctx, (k) => { k.moveTo(mx - 14, my + 6); k.quadraticCurveTo(mx, my - 6, mx + 14, my + 6); }, null, 4);
    else if (mouth === 'o') A.ellipse(ctx, mx, my, 7, 9, '#7a1f2b', 3.5);
    else A.line(ctx, [[mx - 12, my], [mx + 12, my]], INK, 4);
    // hats
    if (d.hat === 'hardhat') { A.ink(ctx, (k) => k.arc(0, -16, R + 4, Math.PI, 0), '#ffd23f', 4); A.box(ctx, -R - 14, -20, 2 * R + 28, 12, '#ffd23f', { r: 5, lw: 4 }); }
    if (d.hat === 'ranger') { A.ellipse(ctx, 0, -30, R + 26, 11, '#6b5b3e', 4); A.poly(ctx, [[-34, -34], [-22, -84], [22, -84], [34, -34]], '#7d6b48', 4); }
    if (d.hat === 'captain') { A.box(ctx, -R - 4, -50, 2 * R + 8, 28, '#fff', { r: 10, lw: 4 }); A.box(ctx, -R + 2, -28, 2 * R + 10, 12, '#1d3557', { r: 5, lw: 4 }); A.circle(ctx, 8, -38, 8, '#ffd23f', 3); }
    if (d.hat === 'cap') { A.ink(ctx, (k) => k.arc(0, -20, R, Math.PI, 0), '#1d3557', 4); A.box(ctx, 20, -24, 60, 10, '#1d3557', { r: 5, lw: 4 }); }
    if (d.hat === 'bucket') { A.poly(ctx, [[-R - 12, -24], [-R + 4, -66], [R - 4, -66], [R + 12, -24]], '#a3b18a', 4); }
  };

  // Hands-props for pose.hold
  C.props = {
    invoice: (amount = '$200,000') => (ctx) => A.invoice(ctx, 50, -40, 0.32, { amount, rot: -0.2 }),
    clipboard: (ctx) => { A.box(ctx, -10, -70, 70, 90, '#c9a66b', { r: 6, lw: 4 }); A.box(ctx, -2, -60, 54, 70, '#fff', { r: 3, lw: 3 }); },
    papers: (ctx) => { A.box(ctx, 0, -60, 80, 60, '#fff', { r: 4, lw: 4 }); A.box(ctx, 10, -70, 80, 60, '#fffbea', { r: 4, lw: 4 }); },
    blueprint: (ctx) => { A.box(ctx, -10, -50, 120, 70, '#2b6cb0', { r: 4, lw: 4 }); A.line(ctx, [[4, -30], [90, -30], [90, 0]], '#fff', 3); },
    sign: (text) => (ctx) => { A.line(ctx, [[0, 10], [0, -140]], '#7b5a3c', 8); A.box(ctx, -150, -260, 300, 130, '#fffbea', { r: 10, lw: 5 }); A.text(ctx, text, 0, -195, { size: 24, maxW: 270 }); },
    rod: (ctx) => A.line(ctx, [[0, 0], [160, -160]], '#5a4033', 6),
    mic: (ctx) => { A.box(ctx, -6, -30, 12, 34, '#333', { r: 4, lw: 3 }); A.circle(ctx, 0, -38, 12, '#555', 3); },
    shovel: (ctx) => { A.line(ctx, [[0, 30], [0, -200]], '#c9a227', 10); A.ink(ctx, (k) => { k.moveTo(-30, -200); k.lineTo(30, -200); k.lineTo(20, -270); k.quadraticCurveTo(0, -290, -20, -270); k.closePath(); }, '#ffd700', 5); },
  };

  // ---------- the living piggy banks ----------
  // opts: fullness 0..1 (gaunt → round), sick 0..1 (pale, droopy, shaky), eyes, mouth, ears 0..1 (droop),
  // t (seconds), talk, label, cough (0..1 spasm), dir
  C.pig = (ctx, x, y, s, o = {}) => {
    const full = o.fullness == null ? 1 : o.fullness, sick = o.sick || 0, t = o.t || 0;
    const shake = F.reduced ? 0 : Math.sin(t * 38) * 3 * sick + (o.cough ? Math.sin(t * 60) * 6 * o.cough : 0);
    const pink = mixColor('#f7a1b8', '#e6d9d4', sick);
    const pinkDark = mixColor('#d9707f', '#bfaaa5', sick);
    const rx = F.lerp(150, 225, full), ry = F.lerp(108, 150, full);
    ctx.save();
    ctx.translate(x + shake, y);
    ctx.scale(s * (o.dir || 1), s * (1 - (o.cough || 0) * 0.06));
    // legs (shaky when sick)
    const legY = ry * 0.55;
    [-0.55, -0.2, 0.2, 0.55].forEach((f, i) => {
      const wob = F.reduced ? 0 : Math.sin(t * 30 + i) * 4 * sick;
      A.box(ctx, f * rx - 18 + wob, legY, 36, 74 - full * 8, pink, { r: 12, lw: 5 });
      A.box(ctx, f * rx - 18 + wob, legY + 54 - full * 8, 36, 20, pinkDark, { r: 8, lw: 5 });
    });
    // tail
    A.ink(ctx, (k) => { k.moveTo(-rx + 6, -10); k.bezierCurveTo(-rx - 50, -40, -rx - 10, -80, -rx - 34, -50); }, null, 6);
    // body
    A.ellipse(ctx, 0, 0, rx, ry, pink, 6);
    if (full < 0.6) { // ribs when gaunt
      ctx.globalAlpha = (0.6 - full) * 1.6;
      for (let i = 0; i < 4; i++) A.ink(ctx, (k) => k.arc(-30 + i * 26, 20, 40, Math.PI * 1.15, Math.PI * 1.55), null, 4, pinkDark);
      ctx.globalAlpha = 1;
    }
    // highlight
    A.ellipse(ctx, -rx * 0.3, -ry * 0.5, rx * 0.28, ry * 0.14, 'rgba(255,255,255,0.45)', 0, -0.2);
    // coin slot
    A.box(ctx, -40, -ry + 10, 80, 14, '#5a2a35', { r: 6, lw: 4 });
    // ears
    const droop = o.ears == null ? sick : o.ears;
    [[rx * 0.38, 0], [rx * 0.64, 1]].forEach(([ex, i]) => {
      ctx.save();
      ctx.translate(ex, -ry * 0.78);
      ctx.rotate(-0.3 + droop * 1.6 + i * 0.2);
      A.poly(ctx, [[-22, 6], [0, -50], [24, 6]], pink, 5);
      A.poly(ctx, [[-10, 2], [0, -30], [12, 2]], pinkDark, 0);
      ctx.restore();
    });
    // snout and face, toward +x
    const fx = rx * 0.86, fy = -ry * 0.12;
    A.ellipse(ctx, fx + 30, fy + 14, 42, 34, pinkDark, 5);
    A.ellipse(ctx, fx + 22, fy + 12, 6, 11, '#5a2a35', 0);
    A.ellipse(ctx, fx + 42, fy + 12, 6, 11, '#5a2a35', 0);
    const eyes = o.eyes || (sick > 0.5 ? 'half' : 'open');
    [fx - 40, fx - 6].forEach((exx) => {
      const ey = fy - 40;
      if (eyes === 'closed') A.line(ctx, [[exx - 9, ey], [exx + 9, ey]], INK, 4);
      else if (eyes === 'half') {
        A.ink(ctx, (k) => k.arc(exx, ey, 11, 0, Math.PI), '#fff', 3);
        A.circle(ctx, exx + 2, ey + 4, 4, INK, 0);
        A.line(ctx, [[exx - 12, ey], [exx + 12, ey]], INK, 4);
        if (sick > 0.5) A.ink(ctx, (k) => k.arc(exx, ey + 16, 10, Math.PI * 0.1, Math.PI * 0.9), null, 3, 'rgba(90,70,110,0.7)'); // tired rings
      } else if (eyes === 'happy') A.ink(ctx, (k) => k.arc(exx, ey + 4, 10, Math.PI * 1.1, Math.PI * 1.9), null, 4);
      else { A.circle(ctx, exx, ey, eyes === 'wide' ? 15 : 11, '#fff', 3); A.circle(ctx, exx + 3, ey + 1, 5, INK, 0); }
    });
    const mouth = o.mouth || (sick > 0.5 ? 'frown' : full > 0.7 ? 'smile' : 'flat');
    const mx = fx + 4, my = fy + 46, talk = o.talk || 0;
    if (talk > 0.05) A.ellipse(ctx, mx, my, 12, 4 + talk * 10, '#7a1f2b', 3.5);
    else if (mouth === 'smile') A.ink(ctx, (k) => { k.moveTo(mx - 16, my - 4); k.quadraticCurveTo(mx, my + 10, mx + 16, my - 4); }, null, 4);
    else if (mouth === 'frown') A.ink(ctx, (k) => { k.moveTo(mx - 14, my + 6); k.quadraticCurveTo(mx, my - 6, mx + 14, my + 6); }, null, 4);
    else if (mouth === 'o') A.ellipse(ctx, mx, my, 8, 10, '#7a1f2b', 3.5);
    else A.line(ctx, [[mx - 12, my], [mx + 12, my]], INK, 4);
    // a sickly sheen
    if (sick > 0.3) { ctx.globalAlpha = sick * 0.5; A.text(ctx, '~', fx - 70, fy - 96, { size: 40, color: '#7fb069' }); ctx.globalAlpha = 1; }
    ctx.restore();
    // label (not flipped)
    if (o.label) {
      const ly = y + (ry * 0.55 + 70) * s + 40 * s;
      ctx.font = A.font(30 * s);
      const w = ctx.measureText(o.label).width + 34 * s;
      A.box(ctx, x - w / 2, ly - 24 * s, w, 48 * s, '#fffbea', { r: 10 * s, lw: 4 });
      A.text(ctx, o.label, x, ly + 1, { size: 30 * s });
    }
  };

  function mixColor(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (sh) => Math.round(F.lerp((pa >> sh) & 255, (pb >> sh) & 255, F.clamp(t, 0, 1)));
    return '#' + [16, 8, 0].map((sh) => ch(sh).toString(16).padStart(2, '0')).join('');
  }
  C.mixColor = mixColor;
})();
