'use strict';
// The player's battered compact: forgiving arcade handling plus cartoon pothole launches.
// Heading `a`: 0 = north (screen up), increasing clockwise. forward = (sin a, -cos a).
(function () {
  const GRAV = 900;

  class Car {
    constructor(x, y, a) {
      this.x = x; this.y = y; this.a = a || 0;
      this.vx = 0; this.vy = 0;
      this.spin = 0;          // angular velocity (rad/s)
      this.z = 0; this.vz = 0; // height for pothole launches
      this.ctrl = 1;          // 0..1 steering authority (drops briefly after landing)
      this.r = 14;            // collision radius
      this.wob = 0;           // suspension wobble amplitude
      this.wobT = 0;
      this.airT = 0;          // current airtime
      this.chain = 0;         // consecutive pothole launches
      this.chainAir = 0;
      this.immune = 0;        // pothole immunity after a long chain
      this.locked = false;    // scripted moments
      this.maxSpeed = 290;
      this.slice = false;     // a pizza slice bungee-corded to the roof (slalom)
      this.hitFlash = 0;
      this.onLand = null;
    }

    get airborne() { return this.z > 0 || this.vz > 0; }
    get speed() { return Math.hypot(this.vx, this.vy); }
    get fwd() { return this.vx * Math.sin(this.a) - this.vy * Math.cos(this.a); }

    update(dt, inp) {
      const air = this.airborne;
      if (!air) {
        let fx = Math.sin(this.a), fy = -Math.cos(this.a);
        let rx = Math.cos(this.a), ry = Math.sin(this.a);
        let f = this.vx * fx + this.vy * fy;
        let l = this.vx * rx + this.vy * ry;
        const c = this.ctrl;
        const up = !this.locked && inp.up, back = !this.locked && inp.back;
        const hand = !this.locked && inp.hand;
        const steer = this.locked ? 0 : (inp.right ? 1 : 0) - (inp.left ? 1 : 0);

        if (up) {
          if (f < 0) f += 900 * dt;
          else f += 430 * dt * (0.35 + 0.65 * c) * (1 - 0.45 * (f / this.maxSpeed));
          f = Math.min(f, this.maxSpeed);
        } else if (back) {
          if (f > 15) f -= 720 * dt;
          else f = Math.max(-130, f - 300 * dt);
        } else {
          f -= Math.sign(f) * Math.min(Math.abs(f), (this.locked ? 500 : 110) * dt);
        }
        if (hand) f -= Math.sign(f) * Math.min(Math.abs(f), 260 * dt);

        const grip = (hand ? 2.2 : 9) * (0.35 + 0.65 * c);
        l *= Math.exp(-grip * dt);

        // arcade pivot: some steering even when stopped (reversing still steers the other way)
        const sf = f < -10 ? G.clamp(f / 110, -1, -0.6) : G.clamp(f / 110, 0.6, 1);
        const target = steer * 2.7 * (hand ? 1.6 : 1) * sf;
        const blend = c < 0.95 ? 2.5 + 8 * c : 14;
        this.spin += (target - this.spin) * Math.min(1, dt * blend);
        this.a += this.spin * dt;

        fx = Math.sin(this.a); fy = -Math.cos(this.a);
        rx = Math.cos(this.a); ry = Math.sin(this.a);
        this.vx = f * fx + l * rx;
        this.vy = f * fy + l * ry;
      } else {
        this.a += this.spin * dt;
        this.vx *= Math.exp(-0.25 * dt);
        this.vy *= Math.exp(-0.25 * dt);
        this.airT += dt;
        this.vz -= GRAV * dt;
        this.z += this.vz * dt;
        if (this.z <= 0) {
          this.z = 0; this.vz = 0;
          this.ctrl = 0.2;
          this.wob = 1;
          this.wobT = 0;
          G.audio.play('land');
          if (this.onLand) this.onLand(this);
        }
      }
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.ctrl = Math.min(1, this.ctrl + dt * 1.5);
      this.immune = Math.max(0, this.immune - dt);
      this.wob *= Math.exp(-3.2 * dt);
      this.wobT += dt;
      this.hitFlash = Math.max(0, this.hitFlash - dt);
      if (!this.airborne && this.ctrl >= 1 && this.chain) { this.chain = 0; this.chainAir = 0; }
    }

    // Send the car into a pothole launch. Returns airtime in seconds.
    launch(px, py) {
      const sp = this.speed;
      const kinds = ['bounce', 'spin', 'arc'];
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      let vz = kind === 'spin' ? 150 + sp * 0.35 : 190 + sp * 0.55;
      vz = Math.min(vz, 360);
      const T = (2 * vz) / GRAV;
      const dir = Math.random() < 0.5 ? -1 : 1;
      // spins are tuned to land roughly aligned so the player isn't punished for the gag
      if (kind === 'spin') this.spin = (dir * Math.PI * 2) / T;
      else if (kind === 'arc') this.spin = (dir * Math.PI * 0.35) / T;
      else this.spin = dir * 0.8;
      this.vz = vz;
      this.z = 0.01;
      // pinball shove away from the crater
      let nx = this.x - px, ny = this.y - py;
      const len = Math.hypot(nx, ny) || 1;
      nx /= len; ny /= len;
      this.vx = this.vx * 0.82 + nx * 70;
      this.vy = this.vy * 0.82 + ny * 70;
      this.airT = 0;
      this.chain++;
      this.chainAir += T;
      if (this.chain >= 3) this.immune = T + 1.2; // no endless pinball
      G.audio.play('boing');
      return T;
    }

    // Shared pothole check. Returns the pothole hit, if any.
    checkPotholes(list) {
      if (this.airborne || this.immune > 0 || this.locked) return null;
      if (this.speed < 35) return null;
      for (const p of list) {
        if (Math.abs(p.x - this.x) > 60 || Math.abs(p.y - this.y) > 60) continue;
        if (G.dist(p.x, p.y, this.x, this.y) < p.r * 0.85 + 5) {
          this.launch(p.x, p.y);
          return p;
        }
      }
      return null;
    }

    draw(ctx) {
      // shadow grows apart from the car with height
      ctx.save();
      ctx.translate(this.x + this.z * 0.3, this.y + this.z * 0.55);
      ctx.rotate(this.a);
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      G.rr(ctx, -14, -24, 28, 48, 8);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(this.x, this.y - this.z * 0.6);
      ctx.rotate(this.a);
      const s = 1 + this.z / 140;
      const w = this.wob * Math.sin(this.wobT * 28);
      ctx.scale(s * (1 + w * 0.16), s * (1 - w * 0.12));
      G.drawCarBody(ctx, { flash: this.hitFlash > 0, slice: this.slice });
      ctx.restore();
    }
  }

  G.Car = Car;
})();
