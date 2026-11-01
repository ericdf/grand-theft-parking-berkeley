'use strict';
// Finale — Mission Accomplished. A ceremony in the Ashby BART lot (no parking), confetti, and one final pothole.
// On the cargo e-bike the lot has no charging stations either, and the battery goes up instead.
(function () {
  const F = {};
  G.scenes.finale = F;

  const LINES = [
    [1, 'On behalf of the city, congratulations on a resounding success.'],
    [2, 'Welcome to the Ashby BART parking lot. Please do not park.'],
    [0, 'We have formed a committee to celebrate them.'],
    [3, 'I abstain from applauding, but in a supportive way.'],
  ];
  const LINES_EBIKE = [
    [1, 'On behalf of the city, congratulations on a resounding success.'],
    [2, 'Welcome to the Ashby BART lot. There are no charging stations. Please do not charge.'],
    [0, 'We have formed a committee to celebrate them.'],
    [3, 'I abstain from applauding, but in a supportive way.'],
  ];
  const MX = [540, 380, 740, 900]; // the chair (member 1) presides from the left
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
    this.bike = G.isBike();
    this.fire = 0; // seconds the battery has been burning
    this.tip = 0; // 0 upright … 1 on its side
    this.rider = null; // the rider, once they've bailed out
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
    if (this.t < 3) this.carY = G.lerp(860, this.bike ? 676 : 640, G.smoothstep(this.t / 3)); // the bike stops short of the crater
    (this.bike ? LINES_EBIKE : LINES).forEach(([m, text], i) => {
      if (this.once('l' + i, 3 + i * 3.1 + (i >= 3 ? 2.6 : 0))) this.bubble = { m, text };
    });
    if (this.once('ceremony', 6)) G.formCommittee('Ceremony Planning Committee');
    if (this.once('confetti', 6.2)) G.audio.play('applause');
    if (this.t > 6.2 && this.t < 15 && Math.random() < dt * 30) this.confetti();
    // the last pothole
    if (this.once('roll', 12.2)) this.bubble = null;
    if (this.bike) this.updateBattery(dt);
    else if (this.t > 12.2 && this.t < 13.2) this.carY = G.lerp(640, PIT.y + 6, G.smoothstep((this.t - 12.2) / 1));
    if (!this.bike && this.once('plop', 13.2)) {
      G.audio.play('plop');
      G.hud.addShake(10);
      this.sliceFly = { t: 0 };
      this.fx.burst(PIT.x, PIT.y, 20, { color: ['#3a332c', '#7b6d5e', '#c9b79c'], speed: 180, life: 0.8, size: 6 });
    }
    if (this.t > 13.2 && !this.bike) this.sink = Math.min(1, this.sink + dt * 2.5);
    if (this.sliceFly) this.sliceFly.t += dt;
    if (this.once('sign', 14.4)) { this.sign = 0.01; G.audio.play('stamp'); }
    if (this.sign > 0) this.sign = Math.min(1, this.sign + dt * 3);
    if (this.once('review', 15.6)) G.formCommittee('Committee to Review This Ceremony');
    if (this.once('end', 18)) this.showEnd();
    this.fx.update(dt);
  };

  // The e-bike doesn't reach the pothole: the battery on the rear rack bursts into flames first,
  // and the slice is launched out of the cargo box into the crater anyway.
  const BAIL = 12.6, TIP = 13.0, IGNITE = 13.3;
  const FALL = 34; // how far left the bike ends up when it tips over
  F.batteryAt = function () {
    if (this.tip < 1) return [this.carX, this.carY + 14 * 1.6];
    const [x, y] = G.CARGO_BATTERY_SIDE;
    return [this.carX - FALL + x * 1.6, this.carY + y * 1.6];
  };
  F.updateBattery = function (dt) {
    const [bx, by] = this.batteryAt();
    if (this.once('smoke', 12.2)) G.audio.play('beep');
    // the rider sees the smoke and jumps clear, off to the right
    if (this.once('bail', BAIL)) {
      this.rider = { t: 0, x0: this.carX, y0: this.carY, x1: this.carX + 130, y1: this.carY + 20 };
      G.audio.play('whoosh');
      this.bubble = null;
    }
    if (this.rider) this.rider.t += dt;
    // the riderless bike tips over to the left
    if (this.t > TIP) {
      const was = this.tip;
      this.tip = Math.min(1, (this.t - TIP) / 0.3);
      if (was < 1 && this.tip >= 1) { G.audio.play('bonk'); G.hud.addShake(5); }
    }
    if (this.t > 12.2 && this.t < IGNITE && Math.random() < dt * 14) {
      this.fx.add({ type: 'poof', x: bx + (Math.random() - 0.5) * 8, y: by, vx: (Math.random() - 0.5) * 20, vy: -50, drag: 0.5, size: 6, life: 1.2, color: '#9a9a9a' });
    }
    if (this.once('plop', IGNITE)) {
      G.audio.play('pop');
      G.audio.play('whoosh');
      G.hud.addShake(12);
      this.fire = 0.01;
      this.sliceFly = { t: 0 };
      this.fx.burst(bx, by, 24, { type: 'poof', color: ['#ffd23f', '#ff9f1c', '#ff5a1f', '#fff3b0'], speed: 220, life: 0.6, size: 8 });
      this.bubble = { m: 2, text: 'Ah. That is why we don’t have charging stations.' };
      G.formCommittee('Lithium-Ion Fire Safety Task Force');
    }
    if (this.fire > 0) {
      this.fire += dt;
      const calm = G.settings.reducedMotion ? 0.4 : 1;
      if (Math.random() < dt * 40 * calm) {
        this.fx.add({ type: 'poof', x: bx + (Math.random() - 0.5) * 18, y: by + (Math.random() - 0.5) * 8, vx: (Math.random() - 0.5) * 30, vy: -90 - Math.random() * 70, drag: 0.8,
          size: 3 + Math.random() * 4, life: 0.4 + Math.random() * 0.35, color: G.pick(['#ffd23f', '#ff9f1c', '#ff5a1f', '#ff3b1f']) });
      }
      if (Math.random() < dt * 12 * calm) {
        this.fx.add({ type: 'poof', x: bx - 10, y: by - 14, vx: -35 - Math.random() * 25, vy: -25, drag: 0.4, size: 9, life: 1.6, color: G.pick(['#555', '#6b6b6b', '#444']) });
      }
      if (Math.random() < dt * 3) G.audio.play('pop');
    }
    if (this.once('nocharge', 16.6)) this.bubble = { m: 1, text: 'Motion to study charging stations. After the fire is out. Or before. Tabled.' };
  };

  // Tipping over reads, from above, as the top view narrowing to nothing and the side profile widening out.
  F.drawFallingBike = function (ctx) {
    const k = this.tip;
    ctx.save();
    ctx.translate((-FALL * G.smoothstep(k)) / 1.6, 0);
    if (k < 0.5) {
      ctx.scale(1 - k * 2, 1);
      G.drawCargoBike(ctx, { slice: !this.sliceFly, burnt: this.fire > 0, noRider: true });
    } else {
      ctx.scale(k * 2 - 1, 1);
      G.drawCargoBikeSide(ctx, { burnt: this.fire > 0 });
    }
    ctx.restore();
  };

  // the rider's leap: an arc (bigger at the top of it), then standing well back, arms going
  F.drawRider = function (ctx) {
    const r = this.rider, k = Math.min(1, r.t / 0.55);
    const x = G.lerp(r.x0, r.x1, G.smoothstep(k)), y = G.lerp(r.y0, r.y1, k);
    const hop = Math.sin(k * Math.PI);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(x, y + 10, 14, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.translate(x, y - hop * 40);
    ctx.scale(1.6 * (1 + hop * 0.35), 1.6 * (1 + hop * 0.35));
    ctx.rotate(k < 1 ? hop * 0.6 : Math.sin(this.t * 7) * 0.08);
    G.drawCargoRider(ctx, { flail: r.t });
    ctx.restore();
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
    // the Ashby BART lot: every stall striped, coned and closed
    ctx.fillStyle = '#5c5c62';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 3;
    for (const [x0, x1] of [[0, 230], [1050, 1280]]) {
      for (let y = 110; y <= 720; y += 62) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
      for (let y = 110; y < 700; y += 62) {
        for (const cx of [x0 + 70, x1 - 70]) {
          ctx.fillStyle = '#f26b1d';
          ctx.beginPath(); ctx.arc(cx, y + 31, 10, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(cx, y + 31, 4, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = G.font(26);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    [[115, this.bike ? 'NO CHARGING' : 'NO PARKING'], [1165, 'FUTURE HOUSING']].forEach(([x, txt]) => {
      ctx.save();
      ctx.translate(x, 420);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(txt, 0, 0);
      ctx.restore();
    });
    ctx.fillStyle = '#a4161a';
    ctx.fillRect(560, 300, 160, 420);
    // station sign and the fence notice
    ctx.save();
    ctx.translate(1165, 120);
    ctx.fillStyle = '#0d4ea6';
    G.rr(ctx, -95, -34, 190, 68, 10);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = G.font(30);
    ctx.fillText('ASHBY', 0, -10);
    ctx.font = G.font(16);
    ctx.fillText('BART STATION', 0, 18);
    ctx.restore();
    ctx.fillStyle = '#1d3557';
    ctx.fillRect(10, 112, 210, 52);
    ctx.fillStyle = '#fff';
    ctx.font = G.font(14);
    ctx.fillText('LOT CLOSED', 115, 128);
    ctx.fillText('FUTURE HOUSING SITE', 115, 148);
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
    if (this.bike) ctx.font = G.font(19);
    ctx.fillText(this.bike ? 'CIVIC ACHIEVEMENT CEREMONY — ASHBY BART LOT (NO CHARGING STATIONS)' : 'CIVIC ACHIEVEMENT CEREMONY — ASHBY BART LOT (NO PARKING)', 640, 57);
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
    if (this.bike && (this.rider || this.tip > 0)) this.drawFallingBike(ctx);
    else G.drawCarBody(ctx, { slice: !this.sliceFly, burnt: this.fire > 0 });
    ctx.restore();
    if (this.rider) this.drawRider(ctx);
    if (this.sliceFly) {
      const bt = Math.min(1, this.sliceFly.t / 1.1);
      const bx = G.lerp(this.carX, PIT.x + 70, bt);
      const by = G.lerp(this.carY - (this.bike ? 26 : 10), PIT.y + 12, bt) - Math.sin(bt * Math.PI) * 160;
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
