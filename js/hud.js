'use strict';
// Screen-space HUD: objective, bureaucracy stars, mission banners, toasts, radio ticker.
(function () {
  const H = (G.hud = {
    banners: [],
    cur: null,
    toasts: [],
    objective: '',
    objectiveSub: '',
    objFlash: 0,
    starsFlash: 0,
    ticker: null,
    tickerX: 0,
    tickerIdx: 0,
    shake: 0,
    time: 0,
  });

  H.reset = function () {
    this.banners = [];
    this.cur = null;
    this.toasts = [];
    this.objective = '';
    this.objectiveSub = '';
  };

  // Big GTA-style announcement. Queued so they never overlap.
  H.banner = function (title, sub, o = {}) {
    this.banners.push({ title, sub, dur: o.dur || 2.6, color: o.color || '#ffd23f', sting: o.sting, t: 0 });
  };
  H.bannerBusy = function () { return !!this.cur || this.banners.length > 0; };

  H.toast = function (text, o = {}) {
    this.toasts.push({ text, t: 0, dur: o.dur || 3.4, color: o.color || '#fff' });
    if (this.toasts.length > 4) this.toasts.shift();
  };

  H.setObjective = function (text, sub = '') {
    this.objective = text;
    this.objectiveSub = sub;
    this.objFlash = 3;
  };

  H.setTicker = function (lines) {
    this.ticker = lines;
    this.tickerIdx = 0;
    this.tickerX = null;
  };

  H.addShake = function (v) {
    if (!G.settings.reducedMotion) this.shake = Math.max(this.shake, v);
  };

  H.update = function (dt) {
    this.time += dt;
    this.objFlash = Math.max(0, this.objFlash - dt);
    this.starsFlash = Math.max(0, this.starsFlash - dt);
    this.shake *= Math.exp(-8 * dt);
    if (!this.cur && this.banners.length) {
      this.cur = this.banners.shift();
      if (this.cur.sting) G.audio.play(this.cur.sting);
    }
    if (this.cur) {
      this.cur.t += dt;
      if (this.cur.t >= this.cur.dur) this.cur = null;
    }
    for (const t of this.toasts) t.t += dt;
    this.toasts = this.toasts.filter((t) => t.t < t.dur);
    if (this.ticker && this.tickerX !== null) this.tickerX -= dt * 70;
  };

  H.drawBanner = function (ctx, w, h) {
    const b = this.cur;
    if (!b) return;
    const rm = G.settings.reducedMotion;
    const tin = G.clamp(b.t / 0.25, 0, 1);
    const tout = G.clamp((b.dur - b.t) / 0.3, 0, 1);
    const a = Math.min(tin, tout);
    const scale = rm ? 1 : 1 + (1 - G.smoothstep(tin)) * 0.8;
    const big = Math.min(76, w / 11);
    ctx.save();
    ctx.globalAlpha = a;
    // letterbox bar
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    const barH = big * 2.5;
    ctx.fillRect(0, h * 0.36 - barH / 2, w, barH);
    ctx.translate(w / 2, h * 0.36);
    ctx.scale(scale, scale);
    ctx.rotate(-0.03);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = G.condensed(big);
    let tw = ctx.measureText(b.title).width;
    if (tw > w * 0.92) {
      ctx.font = G.condensed((big * w * 0.92) / tw);
      tw = w * 0.92;
    }
    G.outlineText(ctx, b.title, 3, -big * 0.25 + 4, '#000', '#000', 0);
    G.outlineText(ctx, b.title, 0, -big * 0.25, b.color, '#1a1a1a', Math.max(4, big / 10));
    if (b.sub) {
      const sfz = Math.min(26, w / 26);
      ctx.font = G.font(sfz);
      const lines = G.wrapText(ctx, b.sub, w * 0.85);
      lines.forEach((l, i) => G.outlineText(ctx, l, 0, big * 0.55 + i * (sfz + 6), '#fff', '#000', 4));
    }
    ctx.restore();
  };

  H.drawObjective = function (ctx, w) {
    if (!this.objective) return;
    const fs = w < 600 ? 13 : 16;
    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = G.font(fs);
    const maxW = Math.min(w * 0.55, 420);
    const lines = G.wrapText(ctx, this.objective, maxW);
    ctx.font = G.font(fs - 4, 700);
    const sub = this.objectiveSub ? G.wrapText(ctx, this.objectiveSub, maxW) : [];
    const bw = maxW + 24;
    const bh = 30 + lines.length * (fs + 4) + sub.length * fs;
    ctx.fillStyle = 'rgba(10,10,20,0.72)';
    G.rr(ctx, 12, 12, bw, bh, 8);
    ctx.fill();
    const flash = this.objFlash > 0 && Math.floor(this.objFlash * 4) % 2 === 0;
    ctx.strokeStyle = flash ? '#ffd23f' : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#9be7ff';
    ctx.font = G.font(10, 800);
    ctx.textBaseline = 'top';
    ctx.fillText('OBJECTIVE', 24, 20);
    ctx.font = G.font(fs);
    ctx.fillStyle = flash ? '#fff' : '#ffd23f';
    lines.forEach((l, i) => ctx.fillText(l, 24, 34 + i * (fs + 4)));
    ctx.font = G.font(fs - 4, 700);
    ctx.fillStyle = '#ddd';
    sub.forEach((l, i) => ctx.fillText(l, 24, 36 + lines.length * (fs + 4) + i * fs));
    ctx.restore();
  };

  H.drawStars = function (ctx, w) {
    const n = G.stats.stars;
    const r = w < 600 ? 9 : 12;
    const gap = r * 2.3;
    const x0 = w - 16 - gap * 5 + r;
    const y = 40;
    ctx.save();
    ctx.font = G.font(w < 600 ? 9 : 11, 800);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    G.outlineText(ctx, 'BUREAUCRACY LEVEL', w - 16, 14, '#fff', '#000', 3);
    for (let i = 0; i < 5; i++) {
      const on = i < n;
      const pulse = on && this.starsFlash > 0 && i === n - 1 ? 1 + Math.sin(this.time * 20) * 0.25 : 1;
      G.drawStar(ctx, x0 + i * gap, y + r, r * pulse, on ? '#ffd23f' : 'rgba(255,255,255,0.12)', on ? '#5a3d00' : 'rgba(255,255,255,0.5)');
    }
    ctx.restore();
  };

  H.drawToasts = function (ctx, w, h, bottomPad = 0) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fs = w < 600 ? 11 : 14;
    ctx.font = G.font(fs, 800);
    let y = h * 0.62;
    for (const t of this.toasts) {
      const a = Math.min(1, t.t / 0.2, (t.dur - t.t) / 0.4);
      ctx.globalAlpha = G.clamp(a, 0, 1);
      const lines = G.wrapText(ctx, t.text, Math.min(w - 40, 560));
      const bh = lines.length * (fs + 5) + 12;
      const bw = Math.min(w - 24, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 28);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      G.rr(ctx, w / 2 - bw / 2, y, bw, bh, 6);
      ctx.fill();
      ctx.fillStyle = t.color;
      lines.forEach((l, i) => ctx.fillText(l, w / 2, y + 6 + (fs + 5) * (i + 0.5)));
      y += bh + 6;
    }
    ctx.restore();
  };

  H.drawTicker = function (ctx, w, h) {
    if (!this.ticker || !G.settings.radio) return;
    const bh = 24;
    const y = h - bh;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, y, w, bh);
    ctx.font = G.font(12, 700);
    ctx.textBaseline = 'middle';
    const label = 'KPTH 87.9 FM ▸';
    const lw = ctx.measureText(label).width + 20;
    const line = this.ticker[this.tickerIdx % this.ticker.length];
    const tw = ctx.measureText(line).width;
    if (this.tickerX === null) this.tickerX = w;
    if (this.tickerX < lw - tw - 40) {
      this.tickerIdx++;
      this.tickerX = w;
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(lw, y, w - lw, bh);
    ctx.clip();
    ctx.fillStyle = '#e8e8e8';
    ctx.fillText(line, this.tickerX, y + bh / 2 + 1);
    ctx.restore();
    ctx.fillStyle = '#d62828';
    ctx.fillRect(0, y, lw - 8, bh);
    ctx.fillStyle = '#fff';
    ctx.fillText(label, 8, y + bh / 2 + 1);
    ctx.restore();
  };

  // A world-space marker arrow drawn around the car pointing at (tx, ty).
  H.drawGuideArrow = function (ctx, car, tx, ty) {
    const a = Math.atan2(ty - car.y, tx - car.x);
    const d = G.dist(car.x, car.y, tx, ty);
    if (d < 70) return;
    const r = 42;
    ctx.save();
    ctx.translate(car.x + Math.cos(a) * r, car.y + Math.sin(a) * r);
    ctx.rotate(a);
    ctx.fillStyle = '#ffd23f';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-6, -8);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-6, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  // Floating world-space text that drifts up (pothole quips, "NOTED.", etc.)
  G.Floaters = class {
    constructor() { this.list = []; }
    add(x, y, text, color = '#fff', dur = 1.6, size = 16) { this.list.push({ x, y, text, color, t: 0, dur, size }); }
    update(dt) {
      for (const f of this.list) f.t += dt;
      this.list = this.list.filter((f) => f.t < f.dur);
    }
    draw(ctx) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const f of this.list) {
        ctx.globalAlpha = G.clamp((f.dur - f.t) / 0.4, 0, 1);
        ctx.font = G.font(f.size);
        G.outlineText(ctx, f.text, f.x, f.y - f.t * 30, f.color, '#000', 4);
      }
      ctx.restore();
    }
  };
})();
