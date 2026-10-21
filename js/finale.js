'use strict';
// Finale — Mission Accomplished. A ceremony, confetti, and one final pothole.
(function () {
  const F = {};
  G.scenes.finale = F;

  const LINES = [
    [0, 'On behalf of the city, congratulations on a resounding success.'],
    [2, 'Your trip generated actionable learnings.'],
    [1, 'We have formed a committee to celebrate them.'],
    [3, 'I abstain from applauding, but in a supportive way.'],
  ];
  const MX = [380, 540, 740, 900];
  const PIT = { x: 640, y: 560 };

  F.enter = function () {
    G.game.setCheckpoint('finale');
    this.t = 0;
    this.fx = new G.Particles();
    this.bubble = null;
    this.events = {};
    this.carY = 860;
    this.carX = 640;
    this.sink = 0;
    this.sliceFly = null;
    this.sign = 0;
    this.shown = false;
    G.hud.reset();
    G.hud.setTicker(null);
    G.hud.banner('FINALE', 'MISSION ACCOMPLISHED (TERMS AND CONDITIONS APPLY)', { sting: 'start', dur: 2.4 });
    G.hud.setObjective('ACCEPT YOUR CIVIC AWARD', 'Press Enter to skip ahead.');
    G.audio.setMusic('finale');
  };

  F.once = function (k, at) {
    if (this.t >= at && !this.events[k]) { this.events[k] = true; return true; }
    return false;
  };

  F.update = function (dt) {
    this.t += dt;
    if (G.input.interact() && !this.shown && this.t > 1) this.t = Math.max(this.t, 17.5);
    // roll in
    if (this.t < 3) this.carY = G.lerp(860, 640, G.smoothstep(this.t / 3));
    LINES.forEach(([m, text], i) => {
      if (this.once('l' + i, 3 + i * 3.1 + (i >= 3 ? 2.6 : 0))) this.bubble = { m, text };
    });
    if (this.once('ceremony', 6)) G.formCommittee('Ceremony Planning Committee');
    if (this.once('confetti', 6.2)) G.audio.play('applause');
    if (this.t > 6.2 && this.t < 15 && Math.random() < dt * 30) this.confetti();
    // the last pothole
    if (this.once('roll', 12.2)) this.bubble = null;
    if (this.t > 12.2 && this.t < 13.2) this.carY = G.lerp(640, PIT.y + 6, G.smoothstep((this.t - 12.2) / 1));
    if (this.once('plop', 13.2)) {
      G.audio.play('plop');
      G.hud.addShake(10);
      this.sliceFly = { t: 0 };
      this.fx.burst(PIT.x, PIT.y, 20, { color: ['#3a332c', '#7b6d5e', '#c9b79c'], speed: 180, life: 0.8, size: 6 });
    }
    if (this.t > 13.2) this.sink = Math.min(1, this.sink + dt * 2.5);
    if (this.sliceFly) this.sliceFly.t += dt;
    if (this.once('sign', 14.4)) { this.sign = 0.01; G.audio.play('stamp'); }
    if (this.sign > 0) this.sign = Math.min(1, this.sign + dt * 3);
    if (this.once('review', 15.6)) G.formCommittee('Committee to Review This Ceremony');
    if (this.once('end', 18)) this.showEnd();
    this.fx.update(dt);
  };

  F.confetti = function () {
    this.fx.add({
      type: 'confetti', x: 200 + Math.random() * 880, y: -20, vx: (Math.random() - 0.5) * 40, vy: 80 + Math.random() * 60,
      g: 30, drag: 0.4, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10, size: G.settings.reducedMotion ? 6 : 9, life: 6,
      color: G.pick(['#ff6b6b', '#ffd23f', '#6bb8ff', '#7CFC00', '#ff8fd8', '#fff']),
    });
  };

  F.showEnd = function () {
    if (this.shown) return;
    this.shown = true;
    G.stats.slices = 0;
    G.audio.play('passed');
    G.ui.showEnd();
  };

  F.render = function (ctx, vw, vh, dpr) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#1b2a1b';
    ctx.fillRect(0, 0, vw, vh);
    const s = Math.min(vw / 1280, vh / 720);
    const ox = (vw - 1280 * s) / 2, oy = (vh - 720 * s) / 2;
    const sh = G.hud.shake;
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * (ox + (Math.random() - 0.5) * sh), dpr * (oy + (Math.random() - 0.5) * sh));
    const t = this.t;
    // plaza
    ctx.fillStyle = '#d9d2c3';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.strokeStyle = 'rgba(0,0,0,0.07)';
    ctx.lineWidth = 2;
    for (let x = 0; x < 1280; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 720); ctx.stroke(); }
    for (let y = 0; y < 720; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1280, y); ctx.stroke(); }
    ctx.fillStyle = '#a4161a';
    ctx.fillRect(560, 300, 160, 420);
    // banner
    ctx.fillStyle = '#1d3557';
    ctx.fillRect(170, 26, 940, 60);
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 4;
    ctx.strokeRect(170, 26, 940, 60);
    ctx.fillStyle = '#fff';
    ctx.font = G.font(24);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CIVIC ACHIEVEMENT CEREMONY — THANK YOU FOR YOUR PATIENCE', 640, 57);
    // council on stage
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(250, 140, 780, 30);
    G.COUNCIL.forEach((m, i) => G.drawCouncilMember(ctx, m, MX[i], 210, t, this.bubble && this.bubble.m === i, { vote: t > 6.2 && t < 12 && i !== 3 }));
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(250, 280, 780, 40);
    ctx.fillStyle = '#a9713c';
    ctx.fillRect(240, 272, 800, 12);
    // podium with the award
    ctx.fillStyle = '#3b2410';
    ctx.fillRect(600, 250, 80, 60);
    G.drawConeIcon(ctx, 640, 230, 0.8);
    ctx.fillStyle = '#ffd23f';
    ctx.font = G.font(10);
    ctx.fillText('GOLDEN CONE', 640, 296);

    // the final pothole, with the obligatory hazard ring
    G.drawPothole(ctx, { x: PIT.x, y: PIT.y, r: 46, shape: this.pitShape || (this.pitShape = G.makePotholeShape(46, G.mulberry32(5))) }, t);
    // car
    ctx.save();
    ctx.translate(this.carX, this.carY);
    const sk = 1 - this.sink * 0.35;
    ctx.scale(1.6 * sk, 1.6 * sk);
    ctx.rotate(this.sink * 0.35);
    if (this.sink > 0) ctx.globalAlpha = 1 - this.sink * 0.25;
    G.drawCarBody(ctx, { slice: !this.sliceFly });
    ctx.restore();
    if (this.sliceFly) {
      const bt = Math.min(1, this.sliceFly.t / 1.1);
      const bx = G.lerp(this.carX, PIT.x + 70, bt);
      const by = G.lerp(this.carY - 10, PIT.y + 12, bt) - Math.sin(bt * Math.PI) * 160;
      const br = bt < 1 ? 14 : 14 * Math.max(0, 1 - (this.sliceFly.t - 1.1) * 2);
      if (br > 0) G.drawPizza(ctx, bx, by, br, 0, bt * 8);
    }
    if (this.sign > 0) {
      ctx.save();
      ctx.translate(PIT.x + 170, PIT.y - 10);
      const sc = G.settings.reducedMotion ? 1 : 0.4 + 0.6 * this.sign;
      ctx.scale(sc, sc);
      G.drawSign(ctx, 0, 0, ['SLICE DESIGNATED AS', 'HISTORIC RESOURCE', 'DO NOT DISTURB'], { bg: '#5b3a1e', color: '#f3dfa2', border: '#f3dfa2', size: 14, rot: Math.sin(t * 4) * 0.05 });
      ctx.restore();
    }
    this.fx.draw(ctx);
    if (this.bubble) G.drawSpeech(ctx, MX[this.bubble.m], 340, this.bubble.text, { maxW: 380, size: 18, below: true });

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!this.shown) G.hud.drawObjective(ctx, vw);
    G.hud.drawStars(ctx, vw);
    G.hud.drawToasts(ctx, vw, vh);
    G.hud.drawBanner(ctx, vw, vh);
  };
})();
