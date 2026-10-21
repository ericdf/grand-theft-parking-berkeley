'use strict';
// Original vector "sprites" drawn with Canvas 2D. Top-down unless noted.
(function () {
  G.rr = (ctx, x, y, w, h, r) => {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  G.font = (px, weight = 900) => `${weight} ${px}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  G.condensed = (px) => `900 ${px}px Impact, "Haettenschweiler", "Arial Narrow Bold", "Arial Black", sans-serif`;

  G.outlineText = (ctx, str, x, y, fill, stroke = '#000', lw = 4) => {
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    if (lw > 0) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.strokeText(str, x, y);
    }
    ctx.fillStyle = fill;
    ctx.fillText(str, x, y);
  };

  G.wrapText = (ctx, text, maxW) => {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  };

  // ---------- the car (local coords, nose toward -y) ----------
  G.drawCarBody = (ctx, o = {}) => {
    // tires
    ctx.fillStyle = '#1b1b1b';
    [[-15, -17], [11, -17], [-15, 9], [11, 9]].forEach(([x, y]) => {
      G.rr(ctx, x, y, 4, 10, 1.5);
      ctx.fill();
    });
    // body
    ctx.fillStyle = o.flash ? '#fff' : '#c3ccd2'; // Prius silver
    G.rr(ctx, -13, -23, 26, 46, 7);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#3b2410';
    ctx.stroke();
    // mismatched replacement door
    ctx.fillStyle = '#4fa3c7';
    ctx.fillRect(-13, -6, 4, 14);
    // hood scuffs + rust
    ctx.fillStyle = '#a5561f';
    [[6, -17, 2.5], [-6, 15, 2], [8, 12, 1.6], [-4, -19, 1.4]].forEach(([x, y, r]) => {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    });
    // windshield
    ctx.fillStyle = '#26415e';
    G.rr(ctx, -10, -11, 20, 8, 2.5);
    ctx.fill();
    // crack
    ctx.strokeStyle = '#cfe6ff';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(-2, -7); ctx.lineTo(-4, -4.5); ctx.stroke();
    // roof
    ctx.fillStyle = o.flash ? '#fff' : '#f4c26a';
    G.rr(ctx, -10, -3, 20, 14, 3);
    ctx.fill();
    // rear window
    ctx.fillStyle = '#26415e';
    G.rr(ctx, -9, 12, 18, 5, 2);
    ctx.fill();
    // lights
    ctx.fillStyle = '#fff6b0';
    ctx.fillRect(-11, -23, 5, 2.5);
    ctx.fillRect(6, -23, 5, 2.5);
    ctx.fillStyle = '#e23b3b';
    ctx.fillRect(-11, 20.5, 5, 2.5);
    ctx.fillRect(6, 20.5, 5, 2.5);
    // one crooked bumper sticker
    ctx.save();
    ctx.translate(0, 19);
    ctx.rotate(0.15);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-5, -1.5, 10, 3);
    ctx.restore();
    if (o.slice) {
      ctx.save();
      ctx.translate(0, 4);
      G.drawPizza(ctx, 0, 0, 7);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.stroke(); // bungee cord
      ctx.restore();
    }
  };

  // Background traffic / parked cars: tidy, unlike the player's.
  G.drawNpcCar = (ctx, x, y, a, color) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    G.rr(ctx, -12, -21, 28, 46, 7);
    ctx.fill();
    ctx.fillStyle = color;
    G.rr(ctx, -13, -23, 26, 46, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#2b3d52';
    G.rr(ctx, -10, -11, 20, 8, 2.5);
    ctx.fill();
    G.rr(ctx, -9, 12, 18, 5, 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    G.rr(ctx, -10, -3, 20, 14, 3);
    ctx.fill();
    ctx.restore();
  };

  // A slice of pizza, point toward +y. `bite` (0-3) removes chunks as integrity drops.
  G.drawPizza = (ctx, x, y, r, bite = 0, rot = 0) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    const tri = () => {
      ctx.beginPath();
      ctx.moveTo(0, r * 1.1);
      ctx.lineTo(-r * 0.85, -r * 0.6);
      ctx.quadraticCurveTo(0, -r * 0.95, r * 0.85, -r * 0.6);
      ctx.closePath();
    };
    ctx.fillStyle = '#c98b3d'; // crust
    tri();
    ctx.fill();
    ctx.fillStyle = '#ffcc4d'; // cheese
    ctx.save();
    ctx.scale(0.86, 0.86);
    ctx.translate(0, r * 0.1);
    tri();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#c0392b'; // pepperoni
    [[-0.25, -0.2], [0.28, -0.25], [0, 0.25]].forEach(([px, py]) => {
      ctx.beginPath(); ctx.arc(px * r, py * r, r * 0.16, 0, Math.PI * 2); ctx.fill();
    });
    if (bite > 0) {
      ctx.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < bite; i++) {
        ctx.beginPath();
        ctx.arc((i % 2 ? 1 : -1) * r * 0.55, -r * 0.5 + i * r * 0.5, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  };

  // Top-down clown: rainbow wig, red nose, enormous shoes.
  G.drawClown = (ctx, x, y, t, color = '#ff5ea8') => {
    ctx.save();
    ctx.translate(x, y);
    const step = Math.sin(t * 8) * 3;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(2, 4, 12, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d62828'; // shoes
    ctx.beginPath(); ctx.ellipse(-6, 8 + step, 5, 8, 0, 0, Math.PI * 2); ctx.ellipse(6, 8 - step, 5, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color; // baggy suit
    ctx.beginPath(); ctx.ellipse(0, 0, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    [[-5, -2], [4, 2], [0, -4]].forEach(([px, py]) => { ctx.beginPath(); ctx.arc(px, py, 1.6, 0, Math.PI * 2); ctx.fill(); });
    ['#e63946', '#f7b801', '#3cb371', '#5b8def'].forEach((c, i) => { // wig
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(Math.cos(i * 1.6) * 6, -3 + Math.sin(i * 1.6) * 6, 4.5, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = '#fde2c4';
    ctx.beginPath(); ctx.arc(0, -3, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff1f1f';
    ctx.beginPath(); ctx.arc(0, -6, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };

  G.drawBagel = (ctx, x, y, r, bite = 0) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#c98b3d';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8b56b';
    ctx.beginPath();
    ctx.arc(-r * 0.15, -r * 0.2, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6b4320';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff8e0';
    for (let i = 0; i < 6; i++) {
      const a = i * 1.1;
      ctx.fillRect(Math.cos(a) * r * 0.62 - 0.6, Math.sin(a) * r * 0.62 - 0.6, 1.2, 1.2);
    }
    if (bite > 0) {
      ctx.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < bite; i++) {
        const a = -0.6 + i * 1.3;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r, Math.sin(a) * r, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  };

  // ---------- hazards ----------
  G.makePotholeShape = (r, rng) => {
    const pts = [];
    const n = 11;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rad = r * (0.72 + rng() * 0.38);
      pts.push([Math.cos(a) * rad, Math.sin(a) * rad]);
    }
    return pts;
  };

  G.drawPothole = (ctx, p, t) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.canyon) {
      // inside Roosevelt Canyon the whole gorge carries one hazard outline; craters are just dark pits
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#1d1410';
      ctx.beginPath();
      p.shape.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return;
    }
    // high-contrast hazard ring
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.beginPath();
    ctx.arc(0, 0, p.r + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffd23f';
    ctx.setLineDash([7, 6]);
    ctx.lineDashOffset = -t * 10;
    ctx.stroke();
    ctx.setLineDash([]);
    // crater
    ctx.fillStyle = '#5a534c';
    ctx.beginPath();
    p.shape.forEach(([x, y], i) => (i ? ctx.lineTo(x * 1.12, y * 1.12) : ctx.moveTo(x * 1.12, y * 1.12)));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1d1a17';
    ctx.beginPath();
    p.shape.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2f2a25';
    ctx.beginPath();
    ctx.ellipse(-p.r * 0.2, -p.r * 0.2, p.r * 0.45, p.r * 0.3, 0.5, 0, Math.PI * 2);
    ctx.fill();
    // cracks
    ctx.strokeStyle = '#2a2622';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = i * 1.7 + p.r;
      ctx.moveTo(Math.cos(a) * p.r, Math.sin(a) * p.r);
      ctx.lineTo(Math.cos(a + 0.2) * p.r * 1.45, Math.sin(a + 0.2) * p.r * 1.45);
    }
    ctx.stroke();
    ctx.restore();
  };

  G.drawCone = (ctx, c) => {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot || 0);
    const s = c.scale == null ? 1 : c.scale;
    ctx.scale(s, s);
    if (c.down) {
      ctx.fillStyle = '#f26b1d';
      ctx.beginPath();
      ctx.moveTo(-9, -5); ctx.lineTo(9, -2); ctx.lineTo(9, 2); ctx.lineTo(-9, 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(-1, -3.5, 4, 7);
    } else {
      ctx.fillStyle = '#b44a12';
      ctx.fillRect(-8, -8, 16, 16);
      ctx.fillStyle = '#f26b1d';
      ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ffd0a8';
      ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };

  // A white flex post with a red reflective band, standing or knocked flat
  G.drawFlexPost = (ctx, p) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot || 0);
    ctx.scale(p.scale, p.scale);
    if (p.down) {
      ctx.fillStyle = '#f4f4f4';
      ctx.fillRect(-8, -2, 16, 4);
      ctx.fillStyle = '#d62828';
      ctx.fillRect(3, -2, 3, 4);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.arc(1.5, 1.5, 3.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f4f4f4';
      ctx.beginPath(); ctx.arc(0, 0, 3.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d62828';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  };

  G.drawCyclist = (ctx, x, y, a, t, wobble = 0, jersey = '#3cb371') => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a + Math.sin(t * 25) * wobble * 0.5);
    // bike
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(0, 15); ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-7, -9); ctx.lineTo(7, -9); ctx.stroke(); // handlebars
    // rider
    ctx.fillStyle = jersey;
    ctx.beginPath(); ctx.ellipse(0, 1, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = jersey;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-7, -9); ctx.moveTo(5, 0); ctx.lineTo(7, -9); ctx.stroke();
    // helmet
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, -3, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e63946';
    ctx.fillRect(-1, -7.5, 2, 9);
    ctx.restore();
  };

  G.drawInspector = (ctx, x, y, t, s = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    const bob = Math.sin(t * 3) * 0.8;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(2, 3, 10, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9b26f'; // trench coat
    ctx.beginPath(); ctx.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b4f2a'; // hat
    ctx.beginPath(); ctx.arc(0, -1 + bob, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3d2c17';
    ctx.beginPath(); ctx.arc(0, -1 + bob, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; // clipboard
    ctx.fillRect(-4, 5, 8, 6);
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 1;
    ctx.strokeRect(-4, 5, 8, 6);
    ctx.restore();
  };

  // A sign board on a post. lines: array of strings.
  G.drawSign = (ctx, x, y, lines, o = {}) => {
    const fs = o.size || 11;
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    ctx.font = G.font(fs);
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 14;
    const h = lines.length * (fs + 3) + 10;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-w / 2 + 3, -h + 3, w, h);
    ctx.fillStyle = '#555';
    ctx.fillRect(-2, -4, 4, 8);
    ctx.fillStyle = o.bg || '#fffbe6';
    ctx.fillRect(-w / 2, -h, w, h);
    ctx.lineWidth = 2;
    ctx.strokeStyle = o.border || '#222';
    ctx.strokeRect(-w / 2, -h, w, h);
    ctx.fillStyle = o.color || '#222';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, 0, -h + 5 + (fs + 3) * (i + 0.5) + 1));
    ctx.restore();
  };

  G.drawStopSign = (ctx, x, y, r = 11) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#555';
    ctx.fillRect(-1.5, 0, 3, 6);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = Math.PI / 8 + (i * Math.PI) / 4;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = '#d62828';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = G.font(r * 0.55);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('STOP', 0, 0.5);
    ctx.restore();
  };

  G.drawTree = (ctx, x, y, r, hue = 0) => {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.arc(x + 4, y + 5, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hue ? '#4c9a44' : '#3f8a3a';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5fb352';
    ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.55, 0, Math.PI * 2); ctx.fill();
  };

  G.drawStar = (ctx, x, y, r, fill, stroke) => {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 ? r * 0.45 : r;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  };

  G.drawBikeRack = (ctx, x, y) => {
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 6); ctx.lineTo(x - 5, y - 4); ctx.arc(x, y - 4, 5, Math.PI, 0); ctx.lineTo(x + 5, y + 6);
    ctx.stroke();
  };

  // ---------- particles ----------
  class Particles {
    constructor() { this.list = []; }
    add(p) {
      if (this.list.length > 400) this.list.shift();
      this.list.push(Object.assign({ vx: 0, vy: 0, life: 1, max: 1, rot: 0, vr: 0, size: 4, g: 0, drag: 2, z: 0, vz: 0 }, p, { max: p.life || 1 }));
    }
    burst(x, y, n, o) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (o.speed || 100) * (0.4 + Math.random() * 0.8);
        this.add(Object.assign({}, o, {
          x, y,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12,
          life: (o.life || 0.8) * (0.6 + Math.random() * 0.6),
          color: Array.isArray(o.color) ? G.pick(o.color) : o.color,
        }));
      }
    }
    update(dt) {
      for (const p of this.list) {
        p.life -= dt;
        p.vx *= Math.exp(-p.drag * dt);
        p.vy *= Math.exp(-p.drag * dt);
        p.vy += p.g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (p.vz || p.z) {
          p.vz -= 700 * dt;
          p.z = Math.max(0, p.z + p.vz * dt);
        }
      }
      this.list = this.list.filter((p) => p.life > 0);
    }
    draw(ctx) {
      for (const p of this.list) {
        const a = G.clamp(p.life / p.max, 0, 1);
        ctx.globalAlpha = p.type === 'confetti' ? 1 : a;
        ctx.save();
        ctx.translate(p.x, p.y - p.z);
        ctx.rotate(p.rot);
        if (p.type === 'confetti') {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, (p.size / 2) * Math.abs(Math.cos(p.rot * 2)) + 1);
        } else if (p.type === 'slice') {
          G.drawPizza(ctx, 0, 0, p.size);
        } else if (p.type === 'poof') {
          ctx.fillStyle = p.color || '#eee';
          ctx.beginPath();
          ctx.arc(0, 0, p.size * (1.6 - a * 0.6), 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = p.color || '#8a7a66';
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  }
  G.Particles = Particles;
})();

// Front-view clown face for the council tent.
G.drawClownFace = (ctx, x, y, s = 1) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ['#e63946', '#f7b801', '#3cb371', '#5b8def', '#c77dff'].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(Math.cos(Math.PI + (i / 4) * Math.PI) * 34, -6 + Math.sin(Math.PI + (i / 4) * Math.PI) * 26, 16, 0, Math.PI * 2); ctx.fill();
  });
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(0, 0, 30, 34, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(-11, -8, 3.5, 0, Math.PI * 2); ctx.arc(11, -8, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#5b8def';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-11, -18); ctx.lineTo(-11, -2); ctx.moveTo(11, -18); ctx.lineTo(11, -2); ctx.stroke();
  ctx.fillStyle = '#ff1f1f';
  ctx.beginPath(); ctx.arc(0, 4, 7, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d62828';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(0, 10, 13, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  ctx.restore();
};
