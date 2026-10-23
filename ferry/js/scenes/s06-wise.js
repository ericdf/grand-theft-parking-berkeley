'use strict';
// Scene 6 — The wise people of the waterfront. Two former commissioners bring plans, a cost
// analysis and an alternative site, free. The consultant's (fictional) $200,000 invoice; "please
// stop inputting"; the PUBLIC ENGAGEMENT revolving door; the locked Waterfront Commission door and
// the reroute; microphones that retract when the talk strays from the vision.
(function () {
  const A = F.art, C = F.people, INK = A.INK;
  const FLOOR = 830;

  // four sets with wipes between them: [start, end]
  const SETS = [[0, 25.2], [25.2, 28.4], [28.4, 33], [33, 42]];
  const WIPE = 0.6;

  function room(ctx, wall = '#efe2c4') {
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, F.W, F.H);
    // tall windows with a peek of the Bay
    [260, 960, 1660].forEach((x) => {
      A.box(ctx, x - 130, 70, 260, 330, '#9fd3f5', { r: 120, lw: 6 });
      ctx.save();
      A.rr(ctx, x - 130, 70, 260, 330, 120);
      ctx.clip();
      ctx.fillStyle = '#2f84c9';
      ctx.fillRect(x - 130, 300, 260, 120);
      A.sailboat(ctx, x + 40, 320, 0.35, { t: 0 });
      ctx.restore();
      A.line(ctx, [[x, 72], [x, 398]], INK, 5);
      A.line(ctx, [[x - 128, 250], [x + 128, 250]], INK, 5);
    });
    // wood wainscot and floor
    A.box(ctx, -10, 470, F.W + 20, FLOOR - 470, '#a0703f', { r: 0, lw: 5 });
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 4;
    for (let x = 60; x < F.W; x += 160) { ctx.beginPath(); ctx.moveTo(x, 490); ctx.lineTo(x, FLOOR - 20); ctx.stroke(); }
    A.box(ctx, -10, FLOOR, F.W + 20, F.H - FLOOR + 10, '#7d5530', { r: 0, lw: 5 });
  }

  // a presentation board on an easel
  function board(ctx, x, y, title, kind, p) {
    if (p <= 0) return;
    A.at(ctx, x, y, A.popScale(p), F.wob(p * 10, 1, 0), (c) => {
      A.line(c, [[-70, 120], [-110, 360]], '#6b4f2a', 10);
      A.line(c, [[70, 120], [110, 360]], '#6b4f2a', 10);
      A.line(c, [[0, 120], [0, 340]], '#6b4f2a', 10);
      A.box(c, -130, -150, 260, 280, '#fffdf4', { r: 8, lw: 6 });
      A.text(c, title, 0, -118, { size: 22, maxW: 230 });
      if (kind === 'plans') {
        A.box(c, -100, -90, 200, 180, '#2b6cb0', { r: 4, lw: 4 });
        A.line(c, [[-80, 60], [80, 60], [80, -40], [-20, -40], [-20, 60]], '#fff', 4);
        A.line(c, [[-60, -60], [60, -60]], '#bee3f8', 3);
        A.circle(c, 40, 10, 18, null, 3);
      } else if (kind === 'cost') {
        [[-80, 70], [-30, 120], [20, 50], [70, 140]].forEach(([bx, h], i) => A.box(c, bx - 18, 100 - h, 36, h, ['#2a9d8f', '#e9c46a', '#e76f51', '#264653'][i], { r: 3, lw: 4 }));
        A.line(c, [[-110, 100], [110, 100]], INK, 4);
      } else {
        A.box(c, -100, -90, 200, 180, '#cfe8ff', { r: 4, lw: 4 });
        A.ink(c, (k) => { k.moveTo(-100, 10); k.quadraticCurveTo(-20, -40, 30, 20); k.quadraticCurveTo(60, 60, 100, 40); k.lineTo(100, 90); k.lineTo(-100, 90); k.closePath(); }, '#9bd27c', 4);
        A.circle(c, -40, -30, 14, '#e63946', 4);
        A.line(c, [[-40, -16], [-40, 4]], INK, 4);
        A.text(c, '✓', 40, -40, { size: 54, color: '#2a9d8f' });
      }
    });
  }

  function setA(ctx, t, sc) {
    room(ctx);
    // the dais
    A.box(ctx, 1240, 520, 520, 330, '#6b4f2a', { r: 10, lw: 6 });
    // commissioners walk in from the left
    const walk = F.prog(t, 0, 4, 'out');
    const c1x = F.lerp(-200, 330, walk), c2x = F.lerp(-420, 120, walk);
    const walking = t < 4 ? t * 9 : null;
    // their boards, popping up one by one as they're named
    board(ctx, 560, 300, 'ENGINEERING PLANS', 'plans', F.prog(t, 5.0, 5.6));
    board(ctx, 830, 300, 'COST ANALYSIS', 'cost', F.prog(t, 6.4, 7.0));
    board(ctx, 1100, 300, 'ALTERNATIVE SITE', 'site', F.prog(t, 7.8, 8.4));
    // "FREE" tags dangle from the boards
    const free = F.prog(t, 9.6, 10.2);
    if (free > 0) {
      [560, 830, 1100].forEach((bx, i) => {
        const sw = F.wob(t + i, 3, 0.15) * (1 - F.prog(t, 10.2, 12));
        A.at(ctx, bx + 100, 380, A.popScale(free), sw, (c) => {
          A.line(c, [[0, 0], [0, 40]], INK, 3);
          A.ink(c, (k) => { k.moveTo(-40, 40); k.lineTo(30, 40); k.lineTo(50, 70); k.lineTo(30, 100); k.lineTo(-40, 100); k.closePath(); }, '#ffd23f', 4);
          A.text(c, 'FREE', -2, 70, { size: 26 });
        });
      });
    }
    // RECEIVED. stamped across the boards during "your input has been received"
    const recv = F.prog(t, 21.4, 22.2);
    if (recv > 0) [560, 830, 1100].forEach((bx, i) => A.stamp(ctx, bx, 300, 'RECEIVED', F.prog(t, 21.4 + i * 0.25, 22.2 + i * 0.25), { size: 46, rot: -0.2 + i * 0.12, seed: i + 3 }));

    const c1talk = F.talking(sc, 'comm1', t), c2talk = F.talking(sc, 'comm2', t);
    const gesture = F.window(t, 4.4, 9.2, 0.3);
    C.person(ctx, c2x, FLOOR, 0.86, 'comm2', { face: 1, talk: c2talk, walk: walking, armR: t > 9.4 && t < 12 ? 1.9 : 0.15, hold: t < 4.4 ? C.props.papers : null });
    C.person(ctx, c1x, FLOOR, 0.86, 'comm1', { face: 1, talk: c1talk, walk: walking, armR: 0.3 + gesture * 1.6 + F.wob(t, 4, 0.2) * gesture, eyes: 'open' });

    // the official behind the dais
    const offTalk = F.talking(sc, 'official', t);
    const shock = F.window(t, 12, 15, 0.2);
    const stop = F.prog(t, 23.2, 23.8, 'outBack');
    C.person(ctx, 1420, 700, 0.9, 'official', {
      face: -1, talk: offTalk, eyes: shock > 0.5 ? 'wide' : t > 19.6 && t < 23 ? 'closed' : 'open',
      armR: stop > 0 ? 1.6 * stop : shock > 0 ? 1.0 * shock : 0.2, mouth: 'grin', brow: shock,
    });
    // dais front covers his legs
    A.box(ctx, 1240, 600, 520, 250, '#6b4f2a', { r: 10, lw: 6 });
    A.box(ctx, 1270, 630, 460, 60, '#8a6438', { r: 6, lw: 4 });
    A.text(ctx, 'CITY HALL', 1500, 661, { size: 30, color: '#f6e7c1' });
    if (shock > 0.02) A.text(ctx, '?', 1360, 230 - shock * 30, { size: 140 * shock + 1, color: '#e63946', stroke: INK, strokeW: 12 });

    // the consultant pops up beside him with an invoice
    const cIn = F.prog(t, 15, 15.8, 'outBack');
    if (cIn > 0) {
      const cx = F.lerp(F.W + 200, 1700, cIn);
      const conTalk = F.talking(sc, 'consultant', t);
      C.person(ctx, cx, FLOOR, 0.9, 'consultant', { face: -1, talk: conTalk, armR: 1.3, mouth: 'smile', eyes: t > 18.8 && t < 20 ? 'closed' : 'open' });
      const inv = F.prog(t, 16.4, 17.2);
      if (inv > 0) {
        A.invoice(ctx, cx + 20, 270, 0.95 * A.popScale(inv), { amount: '$200,000', rot: -0.12, lines: ['Explaining value', 'Valuing explanation', 'Input intake'], note: 'FICTIONAL INVOICE' });
        if (t > 18.8) A.sparkles(ctx, cx + 20, 350, 260, 120, t * 2, 8, 6, 1 - F.prog(t, 19.5, 20.5));
      }
    }
  }

  // the revolving door of public engagement
  function setB(ctx, t) {
    const lt = t - 25.2;
    room(ctx, '#e8d9b8');
    const cx = 960, top = 300, R = 230;
    // canopy
    A.box(ctx, cx - R - 40, top - 110, 2 * R + 80, 110, '#264653', { r: 14, lw: 6 });
    A.text(ctx, 'PUBLIC ENGAGEMENT', cx, top - 55, { size: 44, color: '#ffd23f' });
    // the drum
    A.box(ctx, cx - R, top, 2 * R, FLOOR - top, 'rgba(190,225,245,0.55)', { r: 6, lw: 6 });
    const spin = F.reduced ? lt * 2 : F.prog(lt, 0.6, 2.2) * 26 + lt * 0.5;
    // the commissioners: in from the left, whirl inside, flung back out to the left
    const inP = F.prog(lt, 0, 0.7, 'in');
    const outP = F.prog(lt, 2.2, 3.1, 'out');
    const dizzy = outP > 0;
    [['comm2', -60], ['comm1', 60]].forEach(([who, off], i) => {
      let x, y = FLOOR, s = 0.8, lean = 0;
      if (outP > 0) { x = F.lerp(cx, 260 + i * 220, outP); lean = -0.3 * (1 - outP); }
      else if (inP < 1) x = F.lerp(-160 + i * 120, cx - 80 + off, inP);
      else {
        const a = spin * 0.35 + i * Math.PI;
        x = cx + Math.cos(a) * 120;
        s = 0.8 * (0.85 + 0.15 * Math.sin(a));
        lean = Math.sin(a) * 0.2;
      }
      C.person(ctx, x, y, s, who, { face: outP > 0 ? -1 : 1, walk: inP < 1 ? lt * 10 : null, eyes: dizzy ? 'closed' : 'wide', mouth: 'o', lean });
      if (dizzy) for (let k = 0; k < 3; k++) {
        const a = lt * 6 + (k * Math.PI * 2) / 3;
        A.sparkle(ctx, x + Math.cos(a) * 50, y - 330 * s + Math.sin(a) * 14, 14, a, '#ffd23f');
      }
    });
    // rotating glass wings, drawn over them
    for (let k = 0; k < 4; k++) {
      const a = spin + (k * Math.PI) / 2;
      const x = cx + Math.cos(a) * R * 0.98;
      A.line(ctx, [[cx, top + 4], [cx, FLOOR - 4]], INK, 8);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      const w = x - cx;
      ctx.fillRect(Math.min(cx, x), top + 6, Math.abs(w), FLOOR - top - 12);
      A.line(ctx, [[x, top + 6], [x, FLOOR - 6]], INK, 6);
    }
    // motion lines
    if (!F.reduced && lt > 0.7 && lt < 2.3) for (let k = 0; k < 5; k++) A.ink(ctx, (c) => c.arc(cx, 560, R + 30 + k * 18, Math.PI * (1.1 + k * 0.1), Math.PI * (1.5 + k * 0.1)), null, 5);
    A.tagSmall(ctx, 'EXIT → START', cx + R + 150, 450, 26, '#fffbea');
  }

  // the locked door and the reroute
  function setC(ctx, t) {
    const lt = t - 28.4;
    ctx.fillStyle = '#d9cdb0';
    ctx.fillRect(0, 0, F.W, F.H);
    A.box(ctx, -10, FLOOR, F.W + 20, F.H - FLOOR + 10, '#8c8c8c', { r: 0, lw: 5 });
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let x = 0; x < F.W; x += 120) ctx.fillRect(x, FLOOR, 4, F.H - FLOOR);
    // left door: Waterfront Commission, chained and padlocked, rattling at 30.4
    const rat = F.window(lt, 2.0, 3.2, 0.1) * (F.reduced ? 0 : Math.sin(lt * 70) * 6);
    A.at(ctx, 420 + rat, 0, 1, 0, (c) => {
      A.box(c, -200, 240, 400, FLOOR - 240, '#7b4b2a', { r: 6, lw: 6 });
      A.box(c, -170, 270, 340, 150, '#8f5b35', { r: 6, lw: 4 });
      A.box(c, -170, 450, 340, 300, '#8f5b35', { r: 6, lw: 4 });
      A.box(c, -230, 150, 460, 80, '#1d3557', { r: 10, lw: 6 });
      A.text(c, 'WATERFRONT COMMISSION', 0, 190, { size: 32, color: '#fff', maxW: 430 });
      // chains
      A.line(c, [[-200, 420], [200, 560]], '#9aa0a6', 14);
      A.line(c, [[-200, 560], [200, 420]], '#9aa0a6', 14);
      A.box(c, -40, 470, 80, 70, '#ffd23f', { r: 10, lw: 5 });
      A.ink(c, (k) => k.arc(0, 470, 26, Math.PI, 0), null, 8);
      A.circle(c, 0, 505, 8, INK, 0);
    });
    A.tagSmall(ctx, 'LOCKED (FOR THIS ONE)', 420, 110, 26, '#ffe8a3');
    // right door: open, welcoming
    A.at(ctx, 1560, 0, 1, 0, (c) => {
      A.box(c, -200, 240, 400, FLOOR - 240, '#fff6d6', { r: 6, lw: 6 });
      A.box(c, -230, 120, 460, 110, '#2a9d8f', { r: 10, lw: 6 });
      A.text(c, 'INFRASTRUCTURE COMMISSION', 0, 158, { size: 26, color: '#fff', maxW: 430 });
      A.text(c, 'COMPLETE STREETS', 0, 198, { size: 24, color: '#ffd23f' });
      A.bike(c, 0, 600, 1.1, { t: lt, rider: false, color: '#2a9d8f' });
      A.text(c, 'WELCOME!', 0, 330, { size: 40, color: '#2a9d8f' });
    });
    // signpost in the hallway
    A.box(ctx, 950, 300, 20, FLOOR - 300, '#7b5a3c', { r: 4, lw: 4 });
    A.ink(ctx, (c) => { c.moveTo(800, 330); c.lineTo(1180, 330); c.lineTo(1230, 380); c.lineTo(1180, 430); c.lineTo(800, 430); c.closePath(); }, '#2a9d8f', 6);
    A.text(ctx, 'THIS WAY →', 1000, 380, { size: 38, color: '#fff' });
    // the big project folder takes the detour along a dotted route
    const route = [[300, 640], [600, 700], [960, 520], [1300, 660], [1560, 600]];
    ctx.setLineDash([16, 14]);
    A.line(ctx, route, 'rgba(29,26,36,0.55)', 5);
    ctx.setLineDash([]);
    const fp = F.prog(lt, 0.4, 4.2, 'inOut');
    let seg = Math.min(route.length - 2, Math.floor(fp * (route.length - 1)));
    const u = fp * (route.length - 1) - seg;
    const fx = F.lerp(route[seg][0], route[seg + 1][0], u), fy = F.lerp(route[seg][1], route[seg + 1][1], u);
    A.at(ctx, fx, fy - 40 + F.wob(t, 8, 6), 1, F.wob(t, 6, 0.1), (c) => {
      A.box(c, -90, -60, 180, 120, '#f4d58d', { r: 8, lw: 5 });
      A.box(c, -90, -76, 70, 24, '#f4d58d', { r: 6, lw: 5 });
      A.text(c, 'BIG FERRY', 0, -18, { size: 22 });
      A.text(c, 'DECISIONS', 0, 14, { size: 22 });
    });
  }

  // public comment: every voice can be heard… until the microphones retract
  function setD(ctx, t, sc) {
    const lt = t - 33;
    room(ctx, '#efe2c4');
    // THE VISION poster glowing above the dais
    A.box(ctx, 660, 60, 600, 300, '#11223f', { r: 14, lw: 6 });
    A.terminal(ctx, 960, 300, 0.75, { t, label: 'THE VISION' });
    A.sparkles(ctx, 960, 210, 560, 260, t, 10, 4, 0.8);
    // banner
    A.banner(ctx, 960, 420, 980, 'EVERY VOICE CAN BE HEARD*', { color: '#2a9d8f', size: 40, h: 80 });
    const fine = F.prog(lt, 4.2, 5);
    if (fine > 0) { ctx.globalAlpha = fine; A.text(ctx, '*PROVIDED IT DOESN’T INTERFERE WITH THE VISION', 960, 492, { size: 24, color: '#7a1f2b' }); ctx.globalAlpha = 1; }
    // a row of speakers at microphones; the mics zip down into the floor at 36
    const retract = F.prog(lt, 3.0, 3.6, 'in');
    const people = [['comm1', 380], ['comm2', 760], ['citizen', 1140], ['passenger', 1520]];
    people.forEach(([who, x], i) => {
      const mh = F.lerp(330, 0, retract);
      // the speaker
      const lean = retract > 0 ? 0.18 * retract : 0;
      C.person(ctx, x - 60, FLOOR, 0.8, who, { face: 1, talk: lt < 3 ? 0.5 + 0.5 * Math.sin(t * 20 + i) : 0, eyes: retract > 0.5 ? 'wide' : 'open', mouth: retract > 0.5 ? 'o' : 'smile', lean, armR: 0.3 + retract * 0.6 });
      if (mh > 4) {
        A.line(ctx, [[x + 40, FLOOR], [x + 40, FLOOR - mh]], INK, 9);
        A.line(ctx, [[x + 40, FLOOR - mh], [x + 10, FLOOR - mh - 20]], INK, 7);
        A.ellipse(ctx, x + 6, FLOOR - mh - 26, 12, 18, '#555', 4, -0.6);
      }
      A.ellipse(ctx, x + 40, FLOOR + 6, 40, 10, '#333', 4);
      if (retract > 0 && retract < 1 && !F.reduced) for (let k = 0; k < 3; k++) A.line(ctx, [[x + 28 + k * 12, FLOOR - mh - 40], [x + 28 + k * 12, FLOOR - mh - 120]], 'rgba(29,26,36,0.4)', 4);
    });
    if (retract >= 1) {
      const s = A.popScale(F.prog(lt, 3.6, 4.1));
      A.at(ctx, 1640, 640, s, 0.15, (c) => A.text(c, 'ZIP!', 0, 0, { size: 70, color: '#e63946', stroke: '#fff', strokeW: 10 }));
    }
    void sc;
  }

  const DRAW = [setA, setB, setC, setD];

  F.scene('wise', function (ctx, t, sc) {
    let k = SETS.findIndex(([a, b]) => t >= a && t < b);
    if (k < 0) k = SETS.length - 1;
    const [a] = SETS[k];
    const w = k > 0 ? F.prog(t, a, a + WIPE, 'inOut') : 1;
    if (w < 1 && !F.reduced) {
      ctx.save();
      ctx.translate(-w * F.W, 0);
      DRAW[k - 1](ctx, Math.min(t, SETS[k - 1][1] - 0.001), sc);
      ctx.restore();
      ctx.save();
      ctx.translate((1 - w) * F.W, 0);
      DRAW[k](ctx, t, sc);
      ctx.restore();
      // a bold stripe on the wipe edge
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect((1 - w) * F.W - 24, 0, 24, F.H);
    } else DRAW[k](ctx, t, sc);
  });
})();
