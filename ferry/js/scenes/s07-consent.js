'use strict';
// Scene 7 — The Consent Calendar Express. A toy train rolls across a giant Council agenda,
// "All aboard!", APPROVED. Six of seven traced milestones rode it. A citizen's question goes into
// the TRANSPARENCY tube and comes out in a locked cabinet. The train halts at the gap where
// construction funding should be; another study is coupled on, APPROVED.
// (Consent votes are lawful; the joke is about how little deliberation they get.)
(function () {
  const A = F.art, C = F.people, INK = A.INK;
  const TRACK = 600;
  const GAP0 = 1470, GAP1 = 1650;
  const CAR_GAP = 210;

  function engineX(t) {
    if (t < 5) return F.lerp(-420, 760, F.ease.out(F.prog(t, 0, 5)));
    if (t < 21) return 760;
    return F.lerp(760, GAP0 - 150, F.ease.inOut(F.prog(t, 21, 28.6)));
  }

  function agenda(ctx, t) {
    // desk
    ctx.fillStyle = '#7d5530';
    ctx.fillRect(0, 0, F.W, F.H);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 30; y < F.H; y += 70) ctx.fillRect(0, y, F.W, 5);
    // the agenda sheet
    A.ink(ctx, (c) => {
      c.moveTo(110, 30); c.lineTo(1810, 30); c.lineTo(1810, 860);
      c.lineTo(GAP1 + 6, 860); c.lineTo(GAP1 - 20, 700); c.lineTo(GAP1 + 10, 560); c.lineTo(GAP1 - 10, 440);
      c.lineTo(GAP0 + 10, 440); c.lineTo(GAP0 - 14, 560); c.lineTo(GAP0 + 12, 700); c.lineTo(GAP0 - 6, 860);
      c.lineTo(110, 860); c.closePath();
    }, '#fbf6e8', 6);
    A.text(ctx, 'CITY COUNCIL AGENDA', 790, 84, { size: 44 });
    A.line(ctx, [[150, 120], [1430, 120]], INK, 4);
    // action calendar: short
    A.text(ctx, 'ACTION CALENDAR', 160, 160, { size: 22, align: 'left', color: '#1d3557' });
    ctx.fillStyle = 'rgba(29,26,36,0.18)';
    [190, 214].forEach((y) => ctx.fillRect(170, y, 520, 12));
    // consent calendar: long, long, long
    A.text(ctx, 'CONSENT CALENDAR', 160, 262, { size: 22, align: 'left', color: '#2a9d8f' });
    for (let i = 0; i < 9; i++) {
      const y = 292 + i * 26;
      if (y > 520) break;
      ctx.fillStyle = 'rgba(29,26,36,0.15)';
      ctx.fillRect(170, y, 380 + ((i * 97) % 520), 12);
      A.text(ctx, String(i + 1) + '.', 150, y + 6, { size: 14, align: 'right', color: '#666' });
    }
    // the pit where the paper is torn away
    ctx.fillStyle = '#3a2614';
    ctx.beginPath();
    ctx.moveTo(GAP0 + 10, 440); ctx.lineTo(GAP1 - 10, 440); ctx.lineTo(GAP1 + 10, 560); ctx.lineTo(GAP1 - 20, 700); ctx.lineTo(GAP1 + 6, 860);
    ctx.lineTo(GAP0 - 6, 860); ctx.lineTo(GAP0 + 12, 700); ctx.lineTo(GAP0 - 14, 560); ctx.closePath();
    ctx.fill();
    // tracks
    const tie = (x) => A.box(ctx, x - 9, TRACK - 6, 18, 30, '#8b5a2b', { r: 2, lw: 2.5 });
    for (let x = -20; x < F.W + 40; x += 46) if (x < GAP0 - 10 || x > GAP1 + 10) tie(x);
    [TRACK, TRACK + 16].forEach((y) => {
      A.line(ctx, [[-20, y], [GAP0 - 4, y]], '#9aa0a6', 7);
      A.line(ctx, [[GAP1 + 4, y], [F.W + 20, y]], '#9aa0a6', 7);
    });
    // broken rail ends drooping into the gap
    A.line(ctx, [[GAP0 - 4, TRACK], [GAP0 + 30, TRACK + 40]], '#9aa0a6', 7);
    A.line(ctx, [[GAP1 + 4, TRACK + 16], [GAP1 - 26, TRACK + 60]], '#9aa0a6', 7);
    void t;
  }

  function engine(ctx, x, t, moving) {
    const wheel = moving ? x / 30 : 0;
    A.at(ctx, x, TRACK, 1, 0, (c) => {
      // cowcatcher
      A.poly(c, [[110, -10], [150, -10], [118, -44]], '#e63946', 4);
      // boiler
      A.box(c, -60, -110, 180, 76, '#2a9d8f', { r: 30, lw: 5 });
      A.box(c, -130, -170, 90, 136, '#264653', { r: 10, lw: 5 });
      A.box(c, -118, -156, 66, 44, '#cfe8ff', { r: 6, lw: 4 });
      A.box(c, -142, -186, 114, 24, '#e63946', { r: 6, lw: 4 });
      A.box(c, 70, -160, 30, 52, '#264653', { r: 4, lw: 4 });
      A.ink(c, (k) => { k.moveTo(60, -160); k.lineTo(110, -160); k.lineTo(100, -178); k.lineTo(70, -178); k.closePath(); }, '#264653', 4);
      A.circle(c, 128, -76, 12, '#fff6b0', 4);
      A.text(c, 'CONSENT', 30, -72, { size: 20, color: '#fff' });
      [-100, -20, 70].forEach((wx, i) => {
        A.circle(c, wx, -14, i === 0 ? 30 : 24, '#e63946', 5);
        A.line(c, [[wx, -14], [wx + Math.cos(wheel) * 20, -14 + Math.sin(wheel) * 20]], INK, 4);
      });
      if (moving) A.smoke(c, 85, -186, t, { n: 6, s: 0.7, color: 'rgba(255,255,255,0.9)', drift: -140, rise: 200, seed: 2 });
    });
  }

  function car(ctx, x, label, col, t, moving, o = {}) {
    const wheel = moving ? x / 26 : 0;
    A.at(ctx, x, TRACK + (o.dy || 0), o.s || 1, o.rot || 0, (c) => {
      A.box(c, -90, -120, 180, 94, col, { r: 10, lw: 5 });
      A.box(c, -74, -104, 148, 58, '#fffdf4', { r: 6, lw: 3 });
      A.text(c, label, 0, -76, { size: label.length > 10 ? 15 : 19, maxW: 140 });
      A.line(c, [[-100, -40], [-120, -40]], INK, 5);
      [-50, 50].forEach((wx) => {
        A.circle(c, wx, -16, 20, '#333', 5);
        A.line(c, [[wx, -16], [wx + Math.cos(wheel) * 14, -16 + Math.sin(wheel) * 14]], '#ccc', 3);
      });
    });
  }

  const CARGO = [['CONTRACT', '#f4a261'], ['GRANT', '#e9c46a'], ['MILESTONE', '#8ecae6'], ['AMENDMENT', '#f4a261'], ['GRANT', '#e9c46a'], ['MILESTONE', '#8ecae6']];

  F.scene('consent', function (ctx, t, sc) {
    agenda(ctx, t);
    const ex = engineX(t);
    const moving = t < 5 || (t > 21 && t < 28.6);
    // the study car slots in behind the engine at 33–35: the rest of the train shuffles back
    const slot = F.prog(t, 32.6, 33.6, 'inOut');
    CARGO.forEach(([label, col], i) => car(ctx, ex - CAR_GAP * (i + 1) - slot * CAR_GAP, label, col, t, moving || (slot > 0 && slot < 1)));
    const drop = F.prog(t, 33.2, 34.4, 'outBounce');
    if (drop > 0) {
      car(ctx, ex - CAR_GAP, 'ANOTHER STUDY', '#c77dff', t, false, { dy: F.lerp(-700, 0, drop) });
      if (t > 34.4) A.at(ctx, ex - CAR_GAP, TRACK - 210, 1, 0, (c) => A.tagSmall(c, 'CONSULTANT', 0, 0, 22, '#f3e8ff'));
    }
    engine(ctx, ex, t, moving);

    // headboard banner riding with the train on its way in
    const hb = F.window(t, 0.6, 11.2, 0.5);
    if (hb > 0) {
      ctx.globalAlpha = hb;
      A.banner(ctx, Math.max(380, ex - 300), TRACK - 300, 700, 'CONSENT CALENDAR EXPRESS', { color: '#e63946', size: 40, h: 84, p: F.prog(t, 0.6, 1.6) });
      ctx.globalAlpha = 1;
    }

    // the clerk (left) and a councilmember (right)
    const clerkIn = F.window(t, 2.2, 14.6, 0.6);
    if (clerkIn > 0) C.person(ctx, F.lerp(-220, 230, clerkIn), 860, 0.78, 'clerk', { face: 1, talk: F.talking(sc, 'clerk', t), hold: C.props.clipboard, armR: 0.8 });
    const memIn = F.window(t, 6.6, 14.6, 0.6);
    if (memIn > 0) {
      const cheer = F.prog(t, 11.8, 12.3, 'outBack');
      C.person(ctx, F.lerp(F.W + 220, 1700, memIn), 860, 0.8, 'member', { face: -1, talk: F.talking(sc, 'member', t), armR: 0.2 + cheer * 2.6, armL: 0.2 + cheer * 2.4, mouth: cheer > 0.5 ? 'grin' : 'smile', eyes: t > 7.4 && t < 9.4 ? 'half' : 'open' });
    }
    // APPROVED, across the agenda
    if (t < 20.98) A.stamp(ctx, 980, 330, 'APPROVED', F.prog(t, 13.1, 14.2), { size: 130, rot: -0.14, alpha: 1 - F.prog(t, 20.2, 21) });

    // six of seven: a row of milestone tickets, six punched CONSENT, one discussed
    const sv = F.window(t, 14.8, 20.8, 0.5);
    if (sv > 0) {
      ctx.globalAlpha = sv;
      A.box(ctx, 170, 70, 1580, 300, 'rgba(255,253,244,0.97)', { r: 18, lw: 6 });
      A.text(ctx, '6 OF 7 KEY PROJECT MILESTONES', 960, 120, { size: 52, color: '#1d3557' });
      for (let i = 0; i < 7; i++) {
        const x = 300 + i * 220, y = 250;
        const pop = A.popScale(F.prog(t, 15.2 + i * 0.25, 15.6 + i * 0.25));
        A.at(ctx, x, y, pop, 0, (c) => {
          A.box(c, -86, -60, 172, 120, '#f1e3c6', { r: 10, lw: 4 });
          A.text(c, 'MILESTONE', 0, -30, { size: 18 });
          A.text(c, String(i + 1), 0, 10, { size: 40 });
        });
        const debated = i === 4; // one of the seven got a discussion
        const sp = debated ? F.prog(t, 18.6, 19.0) : F.prog(t, 16.4 + i * 0.3, 16.8 + i * 0.3);
        if (sp > 0) {
          const sc2 = sp < 1 ? F.lerp(2.4, 1, F.ease.in(sp)) : 1;
          A.at(ctx, x, y + 34, sc2, debated ? 0.12 : -0.16, (c) => {
            c.globalAlpha = sv * Math.min(1, sp * 2);
            A.box(c, -78, -20, 156, 40, debated ? '#1d3557' : '#2a9d8f', { r: 8, lw: 4 });
            A.text(c, debated ? 'DEBATED' : 'CONSENT ✓', 0, 1, { size: 22, color: '#fff' });
          });
          ctx.globalAlpha = sv;
        }
      }
      A.text(ctx, 'ON THE CONSENT CALENDAR · decisions traced in the research', 960, 340, { size: 20, family: A.STORY, style: 'italic', weight: 700, color: '#555' });
      ctx.globalAlpha = 1;
    }

    // the citizen's question: into the TRANSPARENCY tube, out into a locked cabinet
    const citIn = F.window(t, 20.4, 28.6, 0.6);
    const tube = [[340, 560], [340, 170], [560, 120], [800, 120], [860, 170]];
    const tubeShow = F.window(t, 20.6, 28.6, 0.4);
    if (tubeShow > 0) {
      ctx.globalAlpha = tubeShow;
      A.line(ctx, tube, INK, 52);
      A.line(ctx, tube, '#bfe3ff', 40);
      A.line(ctx, tube, 'rgba(255,255,255,0.6)', 10);
      A.tagSmall(ctx, 'TRANSPARENCY', 580, 72, 28, '#e0f4ff');
      // the cabinet
      const cx = 860, cy = 190;
      A.box(ctx, cx - 90, cy, 180, 300, '#9aa0a6', { r: 8, lw: 5 });
      [0, 1, 2].forEach((k) => { A.box(ctx, cx - 74, cy + 16 + k * 94, 148, 80, '#b8bec4', { r: 6, lw: 4 }); A.box(ctx, cx - 24, cy + 46 + k * 94, 48, 12, '#666', { r: 4, lw: 3 }); });
      const lock = F.prog(t, 27, 27.4, 'outBack');
      if (lock > 0) A.at(ctx, cx + 60, cy + 30, A.popScale(lock), 0, (c) => { A.box(c, -24, -10, 48, 40, '#ffd23f', { r: 8, lw: 4 }); A.ink(c, (k) => k.arc(0, -10, 16, Math.PI, 0), null, 6); });
      if (lock > 0) A.tagSmall(ctx, 'FILED. LOCKED.', cx + 200, cy + 60, 26, '#fffbea');
      ctx.globalAlpha = 1;
      // the letter travelling the tube
      const lp = F.prog(t, 24.2, 26.8, 'inOut');
      if (lp > 0 && lp < 1) {
        const L = tube.length - 1, seg = Math.min(L - 1, Math.floor(lp * L)), u = lp * L - seg;
        const lx = F.lerp(tube[seg][0], tube[seg + 1][0], u), ly = F.lerp(tube[seg][1], tube[seg + 1][1], u);
        A.at(ctx, lx, ly, 1, lp * 12, (c) => { A.box(c, -26, -18, 52, 36, '#fff', { r: 3, lw: 3 }); A.line(c, [[-26, -18], [0, 2], [26, -18]], INK, 3); });
      }
    }
    if (citIn > 0) {
      const holding = t < 24.2;
      C.person(ctx, F.lerp(-200, 220, citIn), 860, 0.78, 'citizen', {
        face: 1, talk: F.talking(sc, 'citizen', t), armR: holding ? 1.2 : 0.3,
        hold: holding ? (c) => { A.box(c, -6, -40, 52, 36, '#fff', { r: 3, lw: 3 }); A.line(c, [[-6, -40], [20, -20], [46, -40]], INK, 3); } : null,
        eyes: t > 27 ? 'wide' : 'open', mouth: t > 27 ? 'o' : 'smile',
      });
    }

    // the gap
    const gp = F.prog(t, 28.2, 28.8, 'outBack');
    if (gp > 0) {
      A.at(ctx, (GAP0 + GAP1) / 2, 360, A.popScale(gp), F.wob(t, 2, 0.03), (c) => {
        A.line(c, [[0, 40], [0, 200]], '#7b5a3c', 12);
        A.box(c, -170, -90, 340, 140, '#ffd23f', { r: 10, lw: 6 });
        A.box(c, -158, -78, 316, 116, null, { r: 6, lw: 3 });
        A.text(c, 'CONSTRUCTION FUNDING NOT IDENTIFIED', 0, -18, { size: 28, maxW: 300 });
      });
      if (t < 29.4 && !F.reduced) A.sparkles(ctx, ex + 140, TRACK - 10, 80, 30, t * 4, 6, 4, 1);
    }
    // the official: "No. We need another study."
    const offIn = F.window(t, 29.6, 38.5, 0.6);
    if (offIn > 0) C.person(ctx, F.lerp(F.W + 220, 1790, offIn), 860, 0.8, 'official', { face: -1, talk: F.talking(sc, 'official', t), armR: t > 30.4 && t < 33 ? 2.0 : 0.3, mouth: 'grin' });
    // APPROVED, again
    A.stamp(ctx, ex - CAR_GAP, TRACK - 70, 'APPROVED', F.prog(t, 35.1, 36.0), { size: 70, rot: 0.12, seed: 9 });
  });
})();
