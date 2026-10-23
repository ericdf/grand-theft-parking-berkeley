'use strict';
// Mission 4 — MLK Slalom of Doom.
// Modeled on the real street: raised concrete islands at intersections make the double-yellow
// centerline (and the two travel lanes) swerve. Here the swerves alternate right/left and are
// exaggerated so far that you cannot drive straight through — that rhythm IS the level.
// World: x across the street, y = -s where s is distance traveled "down" MLK (up the screen).
(function () {
  const BASE = 56;   // lane bundle center on straights
  const HW = 50;     // half-width of our two-lane bundle
  const A = 100;     // lateral swerve at each diverter (exaggerated)
  const R = 170;     // taper length
  const HOLD = 100;  // island length at the intersection
  const SPACING = 570;
  const CURB_R = 270, CURB_L = -270, BUFFER = BASE + HW; // hatched buffer edge on straights
  const N_GATES = 12;
  // Real cross streets heading south on MLK from Allston, and which side(s) they meet MLK on.
  // Heading south (up the screen), west is on the right. Bancroft T's in from the west; Berkeley High fills the east.
  const CROSS = (G.STREETS && G.STREETS.slalomCross) || [];
  const CYCLIST_GATES = [1, 3, 6, 8, 10, 12];
  const WALL_LINES = ['OOF! THE DIVERTER WINS THIS ROUND!', 'CONCRETE: 1. SEDAN: 0.', 'A BOLD LINE THROUGH THE LANDSCAPING!', 'THE JUDGES ARE CONSULTING A FRAMEWORK!'];
  const RADIO = [
    "LIVE: KPTH's coverage of the MLK Municipal Slalom continues. Conditions: concrete.",
    "Our analyst says the key is 'commitment through the island, then immediate regret.'",
    'Reminder to competitors: the diverters were here first.',
    'Officials confirm the finish line is final. Officials are reviewing that confirmation.',
    'Sponsored by Yellow Paint Monthly — "We Go Around Things."',
  ];

  function bump(t) {
    if (t <= -R || t >= HOLD + R) return 0;
    if (t < 0) return G.smoothstep((t + R) / R);
    if (t <= HOLD) return 1;
    return 1 - G.smoothstep((t - HOLD) / R);
  }

  const S = {};
  G.scenes.slalom = S;

  S.enter = function () {
    G.game.setCheckpoint('slalom');
    this.t = 0;
    this.fx = new G.Particles();
    this.floaters = new G.Floaters();
    this.hazards = G.settings.hazards;
    this.gates = [];
    for (let k = 0; k < N_GATES; k++) this.gates.push({ s: 600 + k * SPACING, dir: k % 2 ? -1 : 1, active: true, scale: 1, n: k + 1 });
    const last = this.gates[N_GATES - 1].s;
    this.finishOrig = last + HOLD + R + 380;
    this.finishS = this.finishOrig;
    this.gates.push({ s: this.finishOrig + 260, dir: 1, active: false, scale: 0, bonus: true, n: 13 });
    this.gates.push({ s: this.finishOrig + 260 + SPACING, dir: -1, active: false, scale: 0, bonus: true, n: 14 });
    this.finishNew = this.gates[N_GATES + 1].s + HOLD + R + 330;
    this.cross = this.gates.map((g, k) => {
      const c = CROSS[k] || ['', 'EW'];
      return { s: g.s + HOLD / 2, name: c[0], right: c[1].includes('W'), left: c[1].includes('E') };
    });
    this.bhsEnd = this.cross[1] ? this.cross[1].s - 60 : 900; // Berkeley High runs Allston → Channing

    const rng = G.mulberry32(2024);
    this.potholes = [];
    this.cyclists = [];
    this.cones = [];
    if (this.hazards) {
      this.gates.forEach((g, k) => {
        if (k % 3 === 2 || k === 0) return;
        const s = g.s - R - 55; // just before the next steering reversal
        const side = rng() < 0.5 ? -1 : 1;
        const r = 15 + rng() * 4;
        this.potholes.push({ s, side, r, x: 0, y: -s, shape: G.makePotholeShape(r, rng), bonus: g.bonus });
      });
      CYCLIST_GATES.forEach((k, i) => this.cyclists.push({ cs: this.cross[k].s, fromRight: this.cross[k].right && (!this.cross[k].left || i % 2 === 0), state: 'wait', x: 0, t: 0, wobble: 0, jersey: G.pick(['#3cb371', '#ff6f59', '#5b8def', '#c77dff'], rng), bonus: this.gates[k].bonus }));
      this.gates.forEach((g) => {
        // cones on the island noses (they multiply with bureaucracy)
        for (let c = 0; c < 2; c++) this.cones.push({ s: g.s - R * 0.35 + c * (HOLD + R * 0.7), gate: g, down: false, vx: 0, vy: 0, rot: 0, vr: 0, dx: 0, dy: 0 });
      });
    }
    // parked cars, houses
    this.parked = [];
    for (let s = 60; s < this.finishNew + 600; s += 62 + rng() * 14) {
      const nearCross = this.cross.some((c) => Math.abs(c.s - s) < 85) || Math.abs(s + 40) < 85;
      if (nearCross) continue;
      const colors = ['#c0392b', '#2c3e50', '#7f8c8d', '#ecf0f1', '#16a085', '#34495e', '#d35400', '#8e44ad', '#bdc3c7'];
      const redCurb = this.gates.some((g) => g.dir > 0 && s > g.s - R - 40 && s < g.s + HOLD + R + 40);
      if (rng() < 0.8 && !redCurb) this.parked.push({ s, x: 238, a: rng() < 0.5 ? 0 : Math.PI, c: G.pick(colors, rng) });
      if (rng() < 0.7) this.parked.push({ s, x: -238, a: Math.PI, c: G.pick(colors, rng) });
    }
    this.houses = [];
    for (let s = -400; s < this.finishNew + 900; s += 120) {
      [-1, 1].forEach((side) => {
        if (this.cross.some((c) => Math.abs(c.s - s) < 110 && (side > 0 ? c.right : c.left))) return;
        if (s < 40) return; // Old City Hall / Civic Center Park behind the start line
        if (side < 0 && s < this.bhsEnd + 60) return; // Berkeley High
        this.houses.push({ s: s + rng() * 20, side, w: 70 + rng() * 40, h: 80 + rng() * 25, color: G.pick(['#b5654a', '#8d6e63', '#6d7f8c', '#a9746e', '#7b8f6a', '#c08552'], rng), tree: rng() < 0.6 });
      });
    }
    this.oncoming = [];
    this.oncomingT = 1.5;
    this.clowns = [0, 1, 2].map((k) => ({ x: CURB_L - 150 - k * 70, s: -200 - k * 90, t: k * 2, color: ['#ff5ea8', '#9bc53d', '#5bc0eb'][k] }));

    this.car = new G.Car(BASE, 0, 0);
    this.car.slice = true;
    this.car.locked = true;
    this.car.onLand = () => this.onLand();
    this.slice = 100;
    this.score = 0;
    this.combo = 0;
    this.gateState = this.gates.map(() => ({ called: false, hit: false, minClear: Infinity, done: false }));
    this.wallCd = 0;
    this.callout = null;
    this.warning = null;
    this.twist = false;
    this.twistT = 0;
    this.state = 'countdown';
    this.cd = 0;
    this.camY = -200;
    G.hud.reset();
    G.hud.setTicker(RADIO);
    G.hud.banner('MISSION START', 'MLK MUNICIPAL SLALOM — NO SKI LIFT REQUIRED', { sting: 'start', dur: 2.6 });
    G.hud.setObjective('ESCAPE DOWN MLK. PROTECT THE SLICE.', 'Thread the diverters: right, left, right, left. Clean gates build combos.');
    G.formCommittee('Slalom Oversight Board');
    G.audio.setMusic('slalom');
  };

  S.offset = function (s) {
    let o = 0;
    for (const g of this.gates) {
      if (!g.active) continue;
      const t = s - g.s;
      if (t > -R && t < HOLD + R) o += g.dir * A * bump(t) * g.scale;
    }
    return o;
  };
  S.leftWall = function (s) { return BASE + this.offset(s) - HW; };
  S.rightWall = function (s) { return BASE + this.offset(s) + HW; };

  S.say = function (text, color = '#ffd23f', dur = 1.6) {
    this.callout = { text, color, t: 0, dur };
  };

  S.onLand = function () {
    this.fx.burst(this.car.x, this.car.y, 10, { color: ['#8a7a66', '#aaa'], speed: 110, life: 0.5, size: 4 });
    G.hud.addShake(5);
    G.stats.maxAir = Math.max(G.stats.maxAir, this.car.chainAir);
  };

  S.damageSlice = function (amount, why) {
    this.slice = Math.max(0, this.slice - amount);
    for (let k = 0; k < 3; k++) {
      this.fx.add({ type: 'slice', x: this.car.x, y: this.car.y, vx: (Math.random() - 0.5) * 260, vy: (Math.random() - 0.5) * 260, vr: 10, size: 4 + Math.random() * 2, life: 0.9, drag: 1.5 });
    }
    this.floaters.add(this.car.x, this.car.y - 34, '-' + amount + '% SLICE', '#ffb36b', 1.2, 14);
    if (why) this.say(why, '#ff8a5b', 1.8);
    if (this.slice <= 0 && this.state === 'race') this.fail();
  };

  S.fail = function () {
    this.state = 'failed';
    this.car.locked = true;
    this.cd = 0;
    G.hud.banner('SLICE LOST', 'THE PROVISIONAL SLICE HAS BEEN RECLAIMED BY THE STREET. RETRYING…', { sting: 'fail', dur: 3, color: '#ff5a5a' });
    if (!G.settings.autopilot) G.hud.toast('STUCK? PRESS O (OR PAUSE → OPTIONS) AND LET THE AUTOPILOT DRIVE', { color: '#9be7ff', dur: 6 });
  };

  // ---------- autopilot ----------
  // Drives the car with the same inputs a player has: aims at the lane center a little way ahead,
  // dodges to the far side of potholes, and eases off to let crossing cyclists clear the lane.
  const PILOT_SPEED = 185;
  S.pilot = function () {
    const car = this.car, s = -car.y, v = Math.max(60, car.fwd);
    const look = 55 + v * 0.35;
    let tx = BASE + this.offset(s + look);
    for (const p of this.potholes) {
      if (p.bonus && !this.twist) continue;
      if (p.s > s - 30 && p.s < s + look + 90) tx = BASE + this.offset(p.s) - p.side * 20;
    }
    const want = Math.atan2(tx - car.x, look);
    const err = G.wrapAngle(want - car.a) - car.spin * 0.08;
    let speed = PILOT_SPEED;
    for (const c of this.cyclists) {
      if (c.state !== 'go') continue;
      const cs = -c.y, ahead = cs - s;
      if (ahead < 0 || ahead > 420) continue;
      const dir = c.fromRight ? -1 : 1;
      const behind = dir * (car.x - c.x); // > 0 while the cyclist has yet to cross our line
      if (behind < -45) continue;
      const clearIn = (behind + 45) / 150 + 0.25;
      speed = Math.min(speed, Math.max(0, ahead - 45) / clearIn);
    }
    return {
      up: car.fwd < speed - 8,
      back: car.fwd > speed + 30,
      left: err < -0.035,
      right: err > 0.035,
      hand: false,
    };
  };

  S.update = function (dt) {
    this.t += dt;
    const car = this.car;
    if (this.callout) { this.callout.t += dt; if (this.callout.t > this.callout.dur) this.callout = null; }
    if (this.warning) { this.warning.t -= dt; if (this.warning.t <= 0) this.warning = null; }

    if (this.state === 'countdown') {
      this.cd += dt;
      const marks = [1.0, 1.8, 2.6];
      marks.forEach((m, i) => { if (this.cd >= m && this.cd - dt < m) { G.audio.play('beep'); this.say(String(3 - i), '#fff', 0.75); } });
      if (this.cd >= 3.4) {
        G.audio.play('go');
        this.say('GO! (GENTLY.)', '#7CFC00', 1);
        car.locked = false;
        this.state = 'race';
      }
    } else if (this.state === 'failed') {
      this.cd += dt;
      if (this.cd > 3.2) G.game.retry();
    } else if (this.state === 'done') {
      this.cd += dt;
      if (this.cd > 4.2) G.game.go('finale');
    }

    if (G.input.resetCar() && this.state === 'race') {
      // back onto the lane center, pointed down MLK
      const rs = -car.y;
      car.resetTo(BASE + this.offset(rs), car.y, 0);
      G.audio.play('whoosh');
      this.floaters.add(car.x, car.y - 30, 'RE-CENTERED', '#9be7ff', 1, 13);
    }
    if (G.input.was('KeyO') && this.state !== 'done') {
      G.settings.autopilot = !G.settings.autopilot;
      G.saveSettings();
      G.hud.toast(G.settings.autopilot ? 'AUTOPILOT ENGAGED. SIT BACK AND GUARD THE SLICE.' : 'AUTOPILOT OFF. YOUR WHEEL, YOUR SLICE.', { color: '#9be7ff', dur: 2.5 });
    }
    car.update(dt, G.settings.autopilot && this.state === 'race' ? this.pilot() : G.input);
    const s = -car.y;

    // walls
    this.wallCd = Math.max(0, this.wallCd - dt);
    if (car.z < 30) {
      const r = 12;
      const off = this.offset(s);
      const slope = (this.offset(s + 2) - this.offset(s - 2)) / 4;
      const len = Math.hypot(1, slope);
      const L = BASE + off - HW, Rw = BASE + off + HW;
      let hit = null;
      if (car.x - r < L) hit = { nx: 1 / len, ny: slope / len, depth: (L - (car.x - r)) / len };
      else if (car.x + r > Rw) hit = { nx: -1 / len, ny: -slope / len, depth: (car.x + r - Rw) / len };
      if (hit) {
        const imp = G.resolveHit(car, hit, 0.55);
        const gi = this.currentGate(s);
        if (imp > 25 && gi >= 0) this.gateState[gi].hit = true;
        if (imp > 70 && this.wallCd <= 0 && this.state === 'race') {
          this.wallCd = 0.6;
          car.spin += (hit.nx > 0 ? 1 : -1) * (2 + imp / 80);
          car.ctrl = 0.5;
          car.hitFlash = 0.15;
          G.audio.play('bonk');
          G.hud.addShake(Math.min(10, imp / 25));
          if (this.combo > 1) this.floaters.add(car.x, car.y - 50, 'COMBO BROKEN', '#ff5a5a', 1.2, 13);
          this.combo = 0;
          this.damageSlice(8, G.pick(WALL_LINES));
        }
      }
    }
    if (car.y > 60) { car.y = 60; car.vy = Math.min(0, car.vy); }

    // potholes
    for (const p of this.potholes) {
      if (p.bonus && !this.twist) continue;
      p.y = -p.s;
      p.x = BASE + this.offset(p.s) + p.side * 22;
    }
    const ph = car.checkPotholes(this.potholes.filter((p) => !p.bonus || this.twist));
    if (ph) {
      G.stats.potholes++;
      this.floaters.add(ph.x, ph.y - 20, G.pick(['BOING!', 'AIRBORNE BEFORE THE TURN!', 'HISTORIC AIR!']), '#ffd23f');
      this.fx.burst(ph.x, ph.y, 12, { color: ['#3a332c', '#7b6d5e'], speed: 150, life: 0.6, size: 5 });
      if (this.state === 'race') this.damageSlice(5);
    }

    this.updateGates(s, dt);
    this.updateCyclists(dt, s);
    this.updateCones(dt);
    this.updateOncoming(dt, s);

    // twist + finish
    if (this.state === 'race' && !this.twist && s > this.finishOrig - 240) this.startTwist();
    if (this.twist && this.twistT < 1) {
      this.twistT = Math.min(1, this.twistT + dt / 1.3);
      const e = G.smoothstep(this.twistT);
      this.finishS = G.lerp(this.finishOrig, this.finishNew, e);
      this.gates.forEach((g) => { if (g.bonus) g.scale = Math.min(1, this.twistT * 1.6); });
    }
    if (this.state === 'race' && this.twist && this.twistT >= 1 && s > this.finishS) this.finish();

    // camera
    const zoom = this.zoom || 1;
    const vh = (G.view.h / zoom);
    const targetY = car.y - vh * 0.2 + Math.min(0, car.vy) * 0.25;
    this.camY += (targetY - this.camY) * Math.min(1, dt * 5);
    this.fx.update(dt);
    this.floaters.update(dt);
  };

  S.currentGate = function (s) {
    for (let i = 0; i < this.gates.length; i++) {
      const g = this.gates[i];
      if (g.active && s > g.s - R && s < g.s + HOLD + R) return i;
    }
    return -1;
  };

  S.updateGates = function (s) {
    const car = this.car;
    this.gates.forEach((g, i) => {
      if (!g.active || g.scale < 1) return;
      const st = this.gateState[i];
      if (!st.called && s > g.s - R - 280 && this.state === 'race') {
        st.called = true;
        const dirTxt = g.dir > 0 ? (i === 0 ? 'HARD RIGHT!' : 'NOW HARD RIGHT!') : 'NOW HARD LEFT!';
        this.say((g.bonus ? 'BONUS GATE! ' : 'GATE ' + G.numberWord(g.n) + '! ') + dirTxt, g.dir > 0 ? '#ff6b6b' : '#6bb8ff', 1.6);
        G.audio.play('blip');
      }
      if (s > g.s - R && s < g.s + HOLD + R) {
        const clear = Math.min(car.x - 12 - this.leftWall(s), this.rightWall(s) - car.x - 12);
        st.minClear = Math.min(st.minClear, clear);
      }
      if (!st.done && s > g.s + HOLD + R) {
        st.done = true;
        if (this.state !== 'race') return;
        if (!st.hit) {
          this.combo++;
          const pts = 100 * this.combo;
          this.score += pts;
          G.audio.play('score');
          this.floaters.add(car.x, car.y - 40, 'CLEAN! +' + pts + (this.combo > 1 ? '  ×' + this.combo : ''), '#7CFC00', 1.3, 16);
          if (st.minClear < 9) {
            this.score += 50;
            this.floaters.add(car.x, car.y - 64, 'NEAR MISS +50', '#9be7ff', 1.3, 14);
            if (!this.callout) this.say('NEAR MISS! THE CROWD GASPS POLITELY!', '#9be7ff', 1.4);
          }
        }
      }
    });
  };

  S.updateCyclists = function (dt, s) {
    const car = this.car;
    for (const c of this.cyclists) {
      if (c.bonus && !this.twist) continue;
      const y = -(c.cs + (c.fromRight ? -22 : 22));
      if (c.state === 'wait') {
        if (this.state === 'race' && s > c.cs - 650) {
          c.state = 'go';
          c.x = c.fromRight ? 470 : -470;
          this.warning = { t: 2.2, fromRight: c.fromRight };
          G.audio.play('bell');
        }
        continue;
      }
      if (c.state !== 'go') continue;
      c.t += dt;
      c.wobble = Math.max(0, c.wobble - dt);
      const dir = c.fromRight ? -1 : 1;
      const prevX = c.x;
      c.x += dir * 150 * dt * (c.wobble > 0 ? 0.6 : 1);
      const stopX = c.fromRight ? CURB_R + 20 : CURB_L - 20;
      if ((prevX - stopX) * (c.x - stopX) <= 0) {
        this.say('STOP SIGN: OPTIONAL IN THIS DIMENSION!', '#9bff9b', 2);
        G.audio.play('bell');
        this.floaters.add(stopX, y - 30, 'ROLLING STOP!', '#9bff9b', 1.4, 13);
      }
      if (Math.abs(c.x) > 520) c.state = 'gone';
      c.y = y;
      if (c.hitCd > 0) c.hitCd -= dt;
      if (car.z < 15 && !(c.hitCd > 0) && Math.abs(car.x - c.x) < 27 && Math.abs(car.y - y) < 19) {
        c.hitCd = 1.5;
        c.wobble = 1.2;
        const ny = car.y > y ? 1 : -1;
        G.resolveHit(car, { nx: 0, ny, depth: 19 - Math.abs(car.y - y) }, 0.5);
        car.spin += (Math.random() < 0.5 ? -1 : 1) * 4;
        car.ctrl = 0.35;
        car.hitFlash = 0.15;
        G.audio.play('bonk');
        G.hud.addShake(6);
        this.floaters.add(c.x, y - 26, G.pick(['UNBOTHERED.', 'RUDE!', 'I HAD MOMENTUM!']), '#9bff9b', 1.5, 14);
        if (this.combo > 1) this.floaters.add(car.x, car.y - 50, 'COMBO BROKEN', '#ff5a5a', 1.2, 13);
        this.combo = 0;
        if (this.state === 'race') this.damageSlice(20, 'A CYCLIST REMAINS UNBOTHERED. YOUR SLICE DOES NOT.');
      }
    }
  };

  S.updateCones = function (dt) {
    const car = this.car;
    const extra = G.stats.stars >= 4;
    for (const c of this.cones) {
      if (c.gate.bonus && !this.twist) continue;
      if (!extra) continue;
      if (!c.down) {
        // cones sit on the inside edge of the swerve, where you'll want to cut the corner
        const s = c.s;
        const wallX = c.gate.dir > 0 ? this.leftWall(s) + 9 : this.rightWall(s) - 9;
        c.x = wallX;
        c.y = -s;
      } else {
        c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.vr * dt;
        const k = Math.exp(-3 * dt);
        c.vx *= k; c.vy *= k; c.vr *= k;
      }
      if (!c.down && car.z < 20 && G.dist(c.x, c.y, car.x, car.y) < car.r + 6) {
        c.down = true;
        c.vx = car.vx * 1.3 + (Math.random() - 0.5) * 80;
        c.vy = car.vy * 1.3;
        c.vr = 14;
        car.vx *= 0.95; car.vy *= 0.95;
        G.audio.play('cone');
      }
    }
  };

  S.updateOncoming = function (dt, s) {
    if (!this.hazards) return;
    this.oncomingT -= dt;
    if (this.oncomingT <= 0 && this.state === 'race') {
      this.oncomingT = 1.8 + Math.random() * 2.5;
      this.oncoming.push({ s: s + 1100, c: G.pick(['#2c3e50', '#c0392b', '#ecf0f1', '#16a085', '#7f8c8d']) });
    }
    for (const o of this.oncoming) o.s -= 230 * dt;
    this.oncoming = this.oncoming.filter((o) => o.s > s - 700);
  };

  S.startTwist = function () {
    this.twist = true;
    this.twistT = 0;
    this.gates.forEach((g) => { if (g.bonus) g.active = true; });
    G.audio.play('whoosh');
    G.audio.play('poof');
    G.hud.banner('FINISH LINE RELOCATED', 'MLK HAS BEEN REDESIGNATED A DEMONSTRATION CORRIDOR. ONE MORE PAIR, PLEASE.', { sting: 'fail', dur: 3.2, color: '#ff8fd8' });
    G.addStar('DEMONSTRATION CORRIDOR DESIGNATED');
    G.formCommittee('Demonstration Corridor Steering Committee');
    this.gates.forEach((g) => {
      if (!g.bonus) return;
      for (let k = 0; k < 4; k++) this.fx.burst(BASE + g.dir * A * 0.5, -(g.s + HOLD / 2) + (k - 2) * 40, 8, { type: 'poof', color: ['#fff', '#ddd'], speed: 80, life: 1, size: 12 });
    });
  };

  S.finish = function () {
    this.state = 'done';
    this.cd = 0;
    this.car.locked = true;
    G.stats.slalomScore = this.score;
    G.stats.sliceIntegrity = Math.round(this.slice);
    G.hud.banner('MISSION PASSED', 'MLK MUNICIPAL SLALOM COMPLETE — SCORE ' + this.score.toLocaleString() + ' · SLICE ' + Math.round(this.slice) + '%', { sting: 'passed', dur: 3.6, color: '#7CFC00' });
    G.audio.play('applause');
    for (let k = 0; k < 60; k++) this.fx.add({ type: 'confetti', x: this.car.x + (Math.random() - 0.5) * 300, y: this.car.y - 250 - Math.random() * 100, vx: (Math.random() - 0.5) * 60, vy: 60 + Math.random() * 80, g: 40, drag: 0.5, rot: Math.random() * 6, vr: 6, size: 8, life: 3, color: G.pick(['#ff6b6b', '#ffd23f', '#6bb8ff', '#7CFC00', '#ff8fd8']) });
  };

  // ---------- rendering ----------
  S.render = function (ctx, vw, vh, dpr) {
    const zoom = (this.zoom = G.clamp(Math.min(vw / 620, vh / 760), 0.5, 1.6));
    const camX = 0 + (this.car.x - BASE) * 0.3;
    const sh = G.hud.shake;
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * (vw / 2 - camX * zoom + (Math.random() - 0.5) * sh), dpr * (vh / 2 - this.camY * zoom + (Math.random() - 0.5) * sh));
    const x0 = camX - vw / 2 / zoom - 20, x1 = camX + vw / 2 / zoom + 20;
    const y0 = this.camY - vh / 2 / zoom - 40, y1 = this.camY + vh / 2 / zoom + 40;
    const s0 = -y1, s1 = -y0;
    const t = this.t;

    // yards + houses
    ctx.fillStyle = '#7fae5b';
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (const h of this.houses) {
      if (h.s < s0 - 150 || h.s > s1 + 150) continue;
      const hx = h.side > 0 ? CURB_R + 70 : CURB_L - 70 - h.w;
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(hx + 4, -h.s + 5, h.w, h.h);
      ctx.fillStyle = h.color;
      ctx.fillRect(hx, -h.s, h.w, h.h);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(hx + h.w / 2, -h.s + 2); ctx.lineTo(hx + h.w / 2, -h.s + h.h - 2); ctx.stroke();
      if (h.tree) G.drawTree(ctx, h.side > 0 ? CURB_R + 45 : CURB_L - 45, -h.s - 20, 20);
    }
    this.drawLandmarks(ctx, s0, s1);
    // sidewalks
    ctx.fillStyle = '#cbc5b8';
    ctx.fillRect(CURB_R, y0, 40, y1 - y0);
    ctx.fillRect(CURB_L - 40, y0, 40, y1 - y0);
    // road + cross streets
    ctx.fillStyle = '#4a4a50';
    ctx.fillRect(CURB_L, y0, CURB_R - CURB_L, y1 - y0);
    for (const c of [{ s: -40, name: 'ALLSTON WAY', left: true, right: true }, ...this.cross]) {
      if (c.s < s0 - 80 || c.s > s1 + 80) continue;
      ctx.fillStyle = '#4a4a50';
      ctx.fillRect(c.left ? x0 : CURB_L - 1, -c.s - 50, (c.right ? x1 : CURB_R + 1) - (c.left ? x0 : CURB_L - 1), 100);
      // crosswalks across MLK
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let x = CURB_L + 6; x < CURB_R - 6; x += 22) {
        ctx.fillRect(x, -c.s - 70, 12, 16);
        ctx.fillRect(x, -c.s + 54, 12, 16);
      }
      ctx.font = G.font(16);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      if (c.right) { ctx.fillText(c.name, CURB_R + 150, -c.s + 2); G.drawStopSign(ctx, CURB_R + 22, -c.s - 60, 12); }
      if (c.left) { ctx.fillText(c.name, CURB_L - 150, -c.s + 2); G.drawStopSign(ctx, CURB_L - 22, -c.s + 60, 12); }
    }
    // red curbs where the lanes swing into the parking lane
    for (let s = Math.floor(s0 / 10) * 10; s < s1; s += 10) {
      if (this.rightWall(s) > CURB_R - 75) { ctx.fillStyle = '#d62828'; ctx.fillRect(CURB_R - 5, -s - 10, 5, 10); }
    }
    ctx.fillStyle = '#9a958a';
    ctx.fillRect(CURB_R - 2, y0, 3, y1 - y0);
    ctx.fillRect(CURB_L - 1, y0, 3, y1 - y0);
    // hatched buffer on straights
    ctx.save();
    ctx.beginPath();
    for (let s = s0; s <= s1; s += 10) ctx.lineTo(Math.max(this.rightWall(s), BUFFER), -s);
    for (let s = s1; s >= s0; s -= 10) ctx.lineTo(CURB_R - 75, -s);
    ctx.closePath();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 3;
    for (let y = Math.floor(y0 / 30) * 30; y < y1 + 200; y += 30) { ctx.beginPath(); ctx.moveTo(BUFFER, y); ctx.lineTo(CURB_R, y - 120); ctx.stroke(); }
    ctx.restore();

    this.drawLanes(ctx, s0, s1);
    this.drawIslands(ctx, s0, s1);

    // stencils (straight from the real street, slightly more insistent)
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const g of this.gates) {
      const s = g.s - R - 130;
      if (s < s0 - 100 || s > s1 + 100) continue;
      const cx = BASE + this.offset(s);
      ctx.font = G.font(20);
      ctx.fillText('25', cx, -s);
      ctx.save();
      ctx.translate(cx, -s - 60);
      ctx.rotate(g.dir * 0.5);
      ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(12, -4); ctx.lineTo(4, -4); ctx.lineTo(4, 18); ctx.lineTo(-4, 18); ctx.lineTo(-4, -4); ctx.lineTo(-12, -4); ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // start banner and finish lines
    this.drawOverhead(ctx, 160, 'MLK MUNICIPAL SLALOM — NO SKI LIFT REQUIRED', '#1d3557');
    this.drawFinish(ctx, this.finishS, false);
    if (this.twist) {
      ctx.globalAlpha = 0.45;
      this.drawFinish(ctx, this.finishOrig, true);
      ctx.globalAlpha = 1;
    }

    for (const p of this.parked) if (p.s > s0 - 40 && p.s < s1 + 40) G.drawNpcCar(ctx, p.x, -p.s, p.a, p.c);
    for (const o of this.oncoming) if (o.s > s0 - 40 && o.s < s1 + 40) G.drawNpcCar(ctx, -175, -o.s, Math.PI, o.c);
    for (const p of this.potholes) if ((!p.bonus || this.twist) && p.s > s0 - 40 && p.s < s1 + 40) G.drawPothole(ctx, p, t);
    for (const c of this.cones) if ((!c.gate.bonus || this.twist) && G.stats.stars >= 4 && c.x !== undefined && -c.y > s0 - 30 && -c.y < s1 + 30) G.drawCone(ctx, c);
    if (G.stats.stars >= 4) {
      for (const c of this.cross) {
        if (c.s < s0 - 80 || c.s > s1 + 80) continue;
        G.drawInspector(ctx, CURB_R + 20, -c.s + 80, t + c.s, 1);
        G.drawInspector(ctx, CURB_L - 20, -c.s - 80, t + c.s * 2, 1);
      }
    }
    for (const c of this.cyclists) {
      if (c.state !== 'go') continue;
      G.drawCyclist(ctx, c.x, c.y, c.fromRight ? -Math.PI / 2 : Math.PI / 2, c.t, c.wobble, c.jersey);
    }
    this.fx.draw(ctx);
    this.car.draw(ctx);
    this.floaters.draw(ctx);

    // ----- HUD -----
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    G.hud.drawObjective(ctx, vw);
    G.hud.drawStars(ctx, vw);
    this.drawScore(ctx, vw);
    this.drawSliceHud(ctx, vw, vh);
    this.drawProgress(ctx, vw, vh);
    this.drawWarning(ctx, vw, vh);
    this.drawCallout(ctx, vw, vh);
    if (G.settings.autopilot) G.hud.drawAutopilot(ctx, vw, vh, this.t);
    G.hud.drawToasts(ctx, vw, vh);
    G.hud.drawTicker(ctx, vw, vh);
    G.hud.drawBanner(ctx, vw, vh);
  };

  S.drawLandmarks = function (ctx, s0, s1) {
    const t = this.t;
    // Berkeley High School on the east (left) side from Allston to Channing
    if (s0 < this.bhsEnd && s1 > 0) {
      ctx.fillStyle = '#cfc6b4';
      ctx.fillRect(CURB_L - 700, -this.bhsEnd, 660, this.bhsEnd + 20);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(CURB_L - 430 + 8, -this.bhsEnd + 70, 330, this.bhsEnd - 150);
      ctx.fillStyle = '#c47f5a';
      ctx.fillRect(CURB_L - 430, -this.bhsEnd + 60, 330, this.bhsEnd - 150);
      ctx.fillStyle = '#a8673f';
      for (let y = -this.bhsEnd + 100; y < -120; y += 120) ctx.fillRect(CURB_L - 400, y, 270, 40);
      ctx.save();
      ctx.translate(CURB_L - 265, -this.bhsEnd / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.font = G.font(26);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      G.outlineText(ctx, 'BERKELEY HIGH SCHOOL', 0, 0, '#ffd23f', '#000', 5);
      ctx.restore();
    }
    if (s0 < -60) {
      // behind the start: Civic Center Park (east) and the rubble of Old City Hall (west)
      ctx.fillStyle = '#79b357';
      ctx.fillRect(CURB_L - 700, 100, 660, 700);
      G.drawTree(ctx, CURB_L - 160, 260, 26);
      G.drawTree(ctx, CURB_L - 330, 420, 30, 1);
      ctx.fillStyle = '#bdb3a0';
      ctx.fillRect(CURB_R + 40, 100, 660, 700);
      const rng = G.mulberry32(7);
      for (let k = 0; k < 60; k++) {
        const x = CURB_R + 60 + rng() * 600, y = 120 + rng() * 660;
                ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rng() * 3);
        ctx.fillStyle = G.pick(['#cfc6b3', '#b7ad98', '#e9e4d6', '#9d927d'], rng);
        ctx.fillRect(-10, -6, 8 + rng() * 22, 6 + rng() * 12);
        ctx.restore();
      }
      ctx.save();
      ctx.translate(CURB_L - 260, 360);
      for (let k = 0; k < 16; k++) {
        ctx.fillStyle = k % 2 ? '#fff4e0' : '#d62828';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 85, (k / 16) * Math.PI * 2, ((k + 1) / 16) * Math.PI * 2); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.font = G.font(13);
      ctx.textAlign = 'center';
      G.outlineText(ctx, 'COUNCIL CHAMBERS (TEMPORARY)', CURB_L - 260, 470, '#ffd23f', '#000', 4);
      G.outlineText(ctx, 'OLD CITY HALL (RUBBLE)', CURB_R + 300, 300, '#fff', '#000', 4);
      for (const c of this.clowns) G.drawClown(ctx, c.x + Math.sin(t * 0.8 + c.t) * 40, -c.s, t + c.t, c.color);
    }
  };

  S.drawLanes = function (ctx, s0, s1) {
    const step = 8;
    // double yellow hugs the left edge of our lanes (it swerves around the islands like the real thing)
    ctx.strokeStyle = '#f2c230';
    ctx.lineWidth = 3;
    [-9, -3].forEach((d) => {
      ctx.beginPath();
      for (let s = s0; s <= s1; s += step) {
        const L = this.leftWall(s);
        ctx.lineTo(Math.min(L, 6) + d, -s);
      }
      ctx.stroke();
    });
    // dashed lane divider between our two lanes
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 3;
    ctx.setLineDash([22, 26]);
    ctx.beginPath();
    for (let s = s0; s <= s1; s += step) ctx.lineTo(BASE + this.offset(s), -s);
    ctx.stroke();
    // oncoming lane divider
    ctx.beginPath();
    for (let s = s0; s <= s1; s += step) ctx.lineTo((Math.min(this.leftWall(s), 6) + CURB_L) / 2 - 20, -s);
    ctx.stroke();
    ctx.setLineDash([]);
    // flexible delineator posts wherever the edge isn't a concrete island
    for (let s = Math.ceil(s0 / 34) * 34; s < s1; s += 34) {
      const L = this.leftWall(s), Rw = this.rightWall(s);
      if (L <= 8) post(ctx, L - 6, -s);
      if (Rw >= BUFFER - 4 && Rw < CURB_R - 80) post(ctx, Rw + 5, -s);
    }
    function post(c, x, y) {
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(x, y, 3.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#f26b1d';
      c.beginPath(); c.arc(x, y, 1.8, 0, Math.PI * 2); c.fill();
    }
  };

  S.drawIslands = function (ctx, s0, s1) {
    for (const g of this.gates) {
      if (!g.active || g.s + HOLD + R < s0 || g.s - R > s1) continue;
      const pts = [];
      const a = g.s - R, b = g.s + HOLD + R;
      if (g.dir > 0) {
        // center island pushes us right
        for (let s = a; s <= b; s += 6) { const L = this.leftWall(s); if (L > 8) pts.push([L - 3, -s]); }
        if (pts.length < 2) continue;
        const back = pts.slice().reverse().map(([, y]) => [-3, y]);
        this.drawIsland(ctx, pts.concat(back), g, pts);
      } else {
        // curb-side diverter pushes us left
        for (let s = a; s <= b; s += 6) { const Rw = this.rightWall(s); if (Rw < BUFFER - 8) pts.push([Rw + 3, -s]); }
        if (pts.length < 2) continue;
        const back = pts.slice().reverse().map(([, y]) => [BUFFER + 4, y]);
        this.drawIsland(ctx, pts.concat(back), g, pts);
      }
    }
  };

  S.drawIsland = function (ctx, poly, g, edge) {
    const sc = g.scale;
    ctx.save();
    ctx.globalAlpha = Math.min(1, sc * 1.5);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    poly.forEach(([x, y], i) => (i ? ctx.lineTo(x + 3, y + 4) : ctx.moveTo(x + 3, y + 4)));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d8d2c4';
    ctx.beginPath();
    poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
    // yellow-painted curb face on the traffic side
    ctx.strokeStyle = '#f2c230';
    ctx.lineWidth = 4;
    ctx.beginPath();
    edge.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    // planting in the fat part
    const mid = edge[Math.floor(edge.length / 2)];
    const innerX = g.dir > 0 ? (mid[0] - 3) / 2 : (mid[0] + BUFFER) / 2;
    for (let k = -2; k <= 2; k++) G.drawTree(ctx, innerX + (k % 2) * 6, mid[1] + k * 22, 8, k % 2);
    // yellow "keep right/left" diamonds at both noses + a slalom gate flag at the apex
    const first = edge[0], last = edge[edge.length - 1];
    [first, last].forEach(([x, y]) => keepSign(ctx, x + (g.dir > 0 ? -8 : 8), y, g.dir));
    ctx.fillStyle = '#555';
    ctx.fillRect(mid[0] - 1.5, mid[1] - 2, 3, 4);
    ctx.fillStyle = g.dir > 0 ? '#e63946' : '#1d6fe0';
    const wave = Math.sin(this.t * 6 + g.s) * 3;
    ctx.beginPath();
    ctx.moveTo(mid[0], mid[1]);
    ctx.lineTo(mid[0] + (g.dir > 0 ? -20 : 20), mid[1] - 18 + wave);
    ctx.lineTo(mid[0], mid[1] - 28);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  function keepSign(ctx, x, y, dir) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#555';
    ctx.fillRect(-1.5, -1.5, 3, 3);
    ctx.translate(0, -12);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(-8, -8, 16, 16);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-8, -8, 16, 16);
    ctx.rotate(-Math.PI / 4);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-dir * 4, -5); ctx.lineTo(dir * 4, 4); ctx.moveTo(dir * 4, 4); ctx.lineTo(dir * 4, -1); ctx.moveTo(dir * 4, 4); ctx.lineTo(dir * -1, 4);
    ctx.stroke();
    ctx.restore();
  }

  S.drawOverhead = function (ctx, s, text, color) {
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.arc(CURB_L - 10, -s, 6, 0, Math.PI * 2); ctx.arc(CURB_R + 10, -s, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color;
    ctx.fillRect(CURB_L - 10, -s - 16, CURB_R - CURB_L + 20, 32);
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 3;
    ctx.strokeRect(CURB_L - 10, -s - 16, CURB_R - CURB_L + 20, 32);
    ctx.fillStyle = '#fff';
    ctx.font = G.font(15);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, -s + 1);
  };

  S.drawFinish = function (ctx, s, old) {
    const y = -s;
    for (let x = CURB_L; x < CURB_R; x += 14) {
      for (let r = 0; r < 2; r++) {
        ctx.fillStyle = ((x - CURB_L) / 14 + r) % 2 ? '#111' : '#fff';
        ctx.fillRect(x, y - 14 + r * 14, 14, 14);
      }
    }
    this.drawOverhead(ctx, s + 60, old ? 'FINISH (FORMERLY) — NOW A DEMONSTRATION CORRIDOR' : 'FINISH', old ? '#7b2cbf' : '#15803d');
  };

  S.drawScore = function (ctx, vw) {
    const text = 'SLALOM SCORE ' + this.score.toLocaleString() + (this.combo > 1 ? '   COMBO ×' + this.combo : '');
    ctx.save();
    ctx.font = G.font(vw < 700 ? 12 : 16);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 26;
    const y = vw < 700 ? 104 : 30;
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    G.rr(ctx, vw / 2 - w / 2, y - 15, w, 30, 6);
    ctx.fill();
    ctx.fillStyle = this.combo > 2 ? '#7CFC00' : '#fff';
    ctx.fillText(text, vw / 2, y + 1);
    ctx.restore();
  };

  S.drawSliceHud = function (ctx, vw, vh) {
    const y = vh - (G.settings.radio ? 24 : 0) - 46;
    const w = 210;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    G.rr(ctx, vw / 2 - w / 2, y - 22, w, 44, 10);
    ctx.fill();
    G.drawPizza(ctx, vw / 2 - w / 2 + 24, y, 15, Math.min(3, Math.floor((100 - this.slice) / 25)), Math.PI);
    ctx.fillStyle = '#333';
    ctx.fillRect(vw / 2 - w / 2 + 48, y + 2, 150, 10);
    ctx.fillStyle = this.slice > 50 ? '#e8b56b' : this.slice > 25 ? '#f4a261' : '#ff5a5a';
    ctx.fillRect(vw / 2 - w / 2 + 48, y + 2, 150 * (this.slice / 100), 10);
    ctx.font = G.font(10);
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'middle';
    ctx.fillText('SLICE INTEGRITY ' + Math.round(this.slice) + '%', vw / 2 - w / 2 + 48, y - 8);
    ctx.restore();
  };

  S.drawProgress = function (ctx, vw, vh) {
    if (!G.settings.minimap) return;
    const h = Math.min(260, vh * 0.4), x = vw - 30, y = vh / 2 - h / 2;
    const total = this.finishS;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    G.rr(ctx, x - 8, y - 8, 16, h + 16, 8);
    ctx.fill();
    for (const g of this.gates) {
      if (!g.active) continue;
      const gy = y + h - (g.s / total) * h;
      if (gy < y - 2) continue;
      ctx.fillStyle = g.dir > 0 ? '#e63946' : '#1d6fe0';
      ctx.fillRect(x - 5, gy - 2, 10, 4);
    }
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 7, y - 3, 14, 3);
    const py = y + h - G.clamp(-this.car.y / total, 0, 1) * h;
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); ctx.arc(x, py, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };

  S.drawWarning = function (ctx, vw, vh) {
    if (!this.warning) return;
    if (Math.floor(this.t * 6) % 2) return;
    const x = this.warning.fromRight ? vw - 120 : 120;
    const y = vh * 0.42;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(-40, -40, 80, 80);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 5;
    ctx.strokeRect(-36, -36, 72, 72);
    ctx.rotate(-Math.PI / 4);
    G.drawCyclist(ctx, 0, 4, this.warning.fromRight ? -Math.PI / 2 : Math.PI / 2, 0, 0, '#111');
    ctx.restore();
    ctx.save();
    ctx.font = G.font(13);
    ctx.textAlign = 'center';
    G.outlineText(ctx, 'CYCLIST AT STOP SIGN', x, y + 76, '#ffd23f', '#000', 4);
    G.outlineText(ctx, '(STOPPING: UNLIKELY)', x, y + 94, '#fff', '#000', 4);
    ctx.restore();
  };

  S.drawCallout = function (ctx, vw, vh) {
    const c = this.callout;
    if (!c) return;
    const a = Math.min(1, c.t / 0.12, (c.dur - c.t) / 0.25);
    const sc = G.settings.reducedMotion ? 1 : 1 + Math.max(0, 0.3 - c.t) * 1.5;
    ctx.save();
    ctx.globalAlpha = G.clamp(a, 0, 1);
    ctx.translate(vw / 2, vh * 0.2 + (vw < 700 ? 50 : 30));
    ctx.scale(sc, sc);
    ctx.rotate(-0.04);
    let fs = Math.min(46, vw / 14);
    ctx.font = G.condensed(fs);
    const w = ctx.measureText(c.text).width;
    if (w > vw * 0.9) { fs = (fs * vw * 0.9) / w; ctx.font = G.condensed(fs); }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    G.outlineText(ctx, c.text, 0, 0, c.color, '#000', Math.max(4, fs / 8));
    ctx.restore();
  };
})();
