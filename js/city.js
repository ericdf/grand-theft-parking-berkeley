'use strict';
// Berkeley, from the city's own street-centerline data (see js/citymap.js).
// Hosts Mission 1 (Pothole Paradise), Mission 2 (The Hopkins Parking Heist) and the drive to the
// temporary council tent pitched in the rubble of Old City Hall.
G.scenes = G.scenes || {};
(function () {
  const M = G.CityMap;
  const R = M.refs;
  const W = M.W, H = M.H, SW = M.SW;
  const MLK = 'MARTIN LUTHER KING JR WAY';

  const RADIO = [
    "KPTH 'Talk of the Potholes': caller from Rose St. reports seeing fresh asphalt in 1994. Experts remain skeptical.",
    'TRAFFIC: Shattuck is closed for improvements to the closure. Expect delays through the heat death of the universe.',
    'WEATHER: partly cloudy with a 90% chance of public process.',
    "This hour brought to you by Bollards Unlimited. 'We'll Be Right Here.'",
    'BREAKING: a parking space has been sighted on Hopkins. A committee has been formed to verify it.',
    'CIVIC UPDATE: council meetings continue in the temporary tent. The clowns are, we are told, unrelated.',
    'REMINDER: street sweeping is every second Tuesday of any month containing a fifth Thursday.',
    "LISTENER POLL: 62% say potholes give the city 'character.' The other 38% are still inside one.",
    'SPORTS: local sedan achieves 0.8 seconds of airtime on MLK. Judges award it a 9.4 and a parking ticket.',
  ];
  // comic-strip grawlix: profane in spirit, PG on screen
  const QUIPS_CYCLIST = ['#@$%&!', '$%#@ SEDAN!', 'GET A BIKE, @#$%!', '&%$# YOUR PARKING!', 'MOTORIST!! #@$%', 'I HAVE THE RIGHT OF WAY SPIRITUALLY, @#$%!'];
  const QUIPS_HOPKINS = ['THIS IS A BIKE STREET, #@$%!', 'SLOW DOWN, @#$%&!', 'GO PARK IN 2019, #@$%!', '#@$% YOUR SIDE MIRROR!', 'I’M CALLING THE TASK FORCE, @#$%!', 'HOPKINS IS FOR @#$%ING BIKES!'];
  const QUIPS_POTHOLE = ['BOING!', 'STRUCTURALLY CHARMING!', 'THAT’S A FEATURE', 'HISTORIC AIRTIME!', 'BUDGETED FOR 2041', 'WHEEE—', 'SUSPENSION: GONE', 'NOT A BUG'];
  const QUIPS_INSPECTOR = ['NOTED.', 'FORM 8-B!', 'CITED FOR VIBES', 'NEEDS A PERMIT', 'NON-CONFORMING', 'TABLED.'];
  const QUIPS_CLOWN = ['HONK HONK!', 'MEETING’S IN THE TENT!', 'PUBLIC COMMENT? HILARIOUS.', 'I’M ON THE AGENDA!', 'SEISMICALLY CERTIFIED!'];
  const JERSEYS = ['#3cb371', '#ff6f59', '#5b8def', '#f7b801', '#c77dff', '#00b4d8'];

  // ---------- one-time world setup ----------
  M.buildScenery();
  const normal = (p) => [-p.dy, p.dx];

  // closures (barricade in the middle of the named block; routing avoids them)
  const CLOSURES = [
    { name: 'SHATTUCK AVE', at: R.closeShattuck, lines: ['ROAD CLOSED', 'DOWNTOWN STREETSCAPE', 'PHASE 7 OF 3'] },
    { name: 'KALA BAGAI WAY', at: R.closeKalaBagai, lines: ['ROAD CLOSED', 'SEE ABOVE'] },
    { name: 'MILVIA ST', at: R.closeMilvia, lines: ['ROAD CLOSED', 'BIKE BOULEVARD:', 'CARS MAY PASS IN SPIRIT ONLY'] },
    { name: 'SACRAMENTO ST', at: R.closeSacramento, lines: ['ROAD CLOSED', 'PAVING STUDY IN PROGRESS', 'SINCE 2011'] },
  ].map((c) => {
    const n = M.nearest(c.at[0], c.at[1], c.name);
    if (!n) return null;
    const r = n.road;
    r.closed = true;
    r.closureAt = r.len / 2;
    const p = M.pointAt(r, r.closureAt);
    const [nx, ny] = normal(p);
    const hw = r.hw + 4, th = 11;
    const poly = [[p.x + nx * hw - p.dx * th, p.y + ny * hw - p.dy * th], [p.x + nx * hw + p.dx * th, p.y + ny * hw + p.dy * th],
      [p.x - nx * hw + p.dx * th, p.y - ny * hw + p.dy * th], [p.x - nx * hw - p.dx * th, p.y - ny * hw - p.dy * th]];
    return Object.assign(c, { road: r, p, poly, sign: [p.x + nx * (r.hw + SW + 60), p.y + ny * (r.hw + SW + 60)] });
  }).filter(Boolean);

  // chains along real streets
  const hopkins = M.chain('HOPKINS ST', R.hopkinsSacramento, [R.hopkinsMonterey[0] - R.hopkinsSacramento[0], R.hopkinsMonterey[1] - R.hopkinsSacramento[1]]);
  const shattuck = M.chain('SHATTUCK AVE', R.spawn, [0, -1]);
  const mlkPath = M.chain(MLK, R.mlkAllston, [0, -1]);
  const sMonterey = M.pathProject(hopkins, R.hopkinsMonterey[0], R.hopkinsMonterey[1]).s;

  // the destination: Gioia, from the business-license data
  const gioia = M.stores.find((s) => s.name.startsWith('GIOIA'));
  if (gioia) gioia.hero = true;

  // The council meets in a temporary circus tent in Civic Center Park (east of MLK),
  // across the street from the earthquake rubble of Old City Hall (west of MLK).
  const tentC = M.zoneCenter(M.zones.park);
  const tentN = M.nearest(tentC[0], tentC[1], MLK);
  const towardTent = [(tentC[0] - tentN.px) / tentN.d, (tentC[1] - tentN.py) / tentN.d];
  const CH = { x: tentN.px + towardTent[0] * tentN.road.hw * 0.4, y: tentN.py + towardTent[1] * tentN.road.hw * 0.4, r: 95 };
  const TENT = (() => {
    const n = M.nearest(tentC[0], tentC[1]);
    return { x: tentC[0], y: tentC[1], r: G.clamp(n.e - SW - 10, 34, 80) };
  })();
  const RUBBLE_C = M.zoneCenter(M.zones.oldCityHall);

  // Hopkins parking spots, positioned on the real street around Monterey; nudged clear of intersections
  function clearOfJunctions(s0) {
    for (let d = 0; d < 260; d += 10) {
      for (const s of [s0 + d, s0 - d]) {
        const p = M.pathPoint(hopkins, s);
        if (!M.nodes.some((n) => n.junction && G.dist(n.x, n.y, p.x, p.y) < n.hw + 70)) return s;
      }
    }
    return s0;
  }
  function spotAt(s, side, type) {
    const p = M.pathPoint(hopkins, s);
    const n = M.nearest(p.x, p.y, 'HOPKINS ST');
    const hw = n ? n.road.hw : 54;
    const [nx, ny] = normal(p);
    const off = (hw - 19) * side;
    return { s, side, type, x: p.x + nx * off, y: p.y + ny * off, a: Math.atan2(p.dy, p.dx), w: 84, h: 34 };
  }
  const gioiaS = gioia ? M.pathProject(hopkins, gioia.x, gioia.y).s : sMonterey + 90;
  const gioiaSide = (() => {
    if (!gioia) return 1;
    const p = M.pathPoint(hopkins, gioiaS);
    const [nx, ny] = normal(p);
    return (gioia.x - p.x) * nx + (gioia.y - p.y) * ny > 0 ? 1 : -1;
  })();
  const SPOT_PLAN = [
    { s: clearOfJunctions(sMonterey + 420), side: -gioiaSide },
    { s: clearOfJunctions(sMonterey + 820), side: gioiaSide },
    { s: clearOfJunctions(Math.max(120, sMonterey - 230)), side: -gioiaSide },
    { s: gioiaS, side: gioiaSide },
  ];

  // Roosevelt Ave between Allston and Bancroft: so pitted it's now a canyon
  const CANYON = (() => {
    const r = M.roads.find((q) => q.name === 'ROOSEVELT AVE' &&
      [q.a, q.b].some((n) => M.nodes[n].roads.some((x) => x.name === 'ALLSTON WAY')) &&
      [q.a, q.b].some((n) => M.nodes[n].roads.some((x) => x.name === 'BANCROFT WAY')));
    if (!r) return null;
    r.penalty = 8; // the GPS has seen the canyon and would rather not
    const a0 = 55, a1 = r.len - 55;
    const rng = G.mulberry32(1933);
    const edge = (side) => {
      const pts = [];
      for (let s = a0; s <= a1; s += 12) {
        const p = M.pointAt(r, s);
        const w = (r.hw - 3) * (s - a0 < 30 || a1 - s < 30 ? 0.6 : 1) - rng() * 7;
        pts.push([p.x - p.dy * w * side, p.y + p.dx * w * side]);
      }
      return pts;
    };
    const left = edge(1), right = edge(-1);
    const mid = M.pointAt(r, r.len / 2);
    return { r, a0, a1, poly: left.concat(right.reverse()), mid };
  })();

  // potholes
  const potholes = [];
  const extraSigns = [];
  (function genPotholes() {
    const rng = G.mulberry32(4242);
    const add = (x, y, r, extra) => potholes.push(Object.assign({ x, y, r, shape: G.makePotholeShape(r, rng) }, extra || {}));
    const nearSpot = (x, y) => SPOT_PLAN.some((sp) => { const p = M.pathPoint(hopkins, sp.s); return G.dist(x, y, p.x, p.y) < 130; });
    for (const r of M.roads) {
      if (CANYON && r === CANYON.r) continue;
      const busy = r.cls !== 'L';
      for (let s = 70 + rng() * 60; s < r.len - 70; s += 170 + rng() * 170) {
        if (rng() < (busy ? 0.35 : 0.6)) continue;
        const p = M.pointAt(r, s);
        if (M.nodes.some((n) => n.junction && G.dist(n.x, n.y, p.x, p.y) < n.hw + 45)) continue;
        if (G.dist(p.x, p.y, CH.x, CH.y) < 180 || G.dist(p.x, p.y, R.spawn[0], R.spawn[1]) < 260 || nearSpot(p.x, p.y)) continue;
        if (CLOSURES.some((c) => G.dist(c.p.x, c.p.y, p.x, p.y) < 90)) continue;
        const rad = 15 + rng() * 10;
        const [nx, ny] = normal(p);
        const off = (rng() * 2 - 1) * (r.hw - rad - 12);
        add(p.x + nx * off, p.y + ny * off, rad);
      }
    }
    // Roosevelt Canyon: wall-to-wall craters
    if (CANYON) {
      const r = CANYON.r;
      let k = 0;
      for (let s = CANYON.a0 + 15; s < CANYON.a1 - 10; s += 30, k++) {
        const p = M.pointAt(r, s);
        for (const lat of k % 2 ? [-24, 12] : [-10, 26]) {
          const rad = 15 + rng() * 6;
          add(p.x - p.dy * (lat + (rng() - 0.5) * 6), p.y + p.dx * (lat + (rng() - 0.5) * 6), rad, { canyon: true });
        }
      }
      const ends = [M.pointAt(r, 12), M.pointAt(r, r.len - 12)];
      ends.forEach((p, i) => {
        const side = i ? 1 : -1;
        add(p.x, p.y, 0.01, {
          sign: i ? ['ROOSEVELT CANYON', 'NO RAFTING WITHOUT A PERMIT'] : ['ROOSEVELT CANYON', 'EST. BY DEFERRED MAINTENANCE', 'SCENIC OVERLOOK →'],
          plaque: true, signOnly: true, side,
        });
      });
    }
    // set pieces
    const sp = M.pathPoint(shattuck, 330);
    const [snx, sny] = normal(sp);
    add(sp.x + snx * 26, sp.y + sny * 26, 24, { sign: ['SMOOTH ROADS AHEAD*', '*RHETORICALLY'] }); // right in the spawn lane
    const onRoad = (pt, name, lateral, rad, extra) => {
      const n = M.nearest(pt[0], pt[1], name);
      if (!n) return;
      const p = M.pointAt(n.road, n.along);
      const [nx, ny] = normal(p);
      add(p.x + nx * lateral, p.y + ny * lateral, rad, extra);
      return { p, nx, ny, road: n.road, along: n.along };
    };
    onRoad(R.historicPothole, MLK, 18, 36, { sign: ['POTHOLE DESIGNATED AS', 'HISTORIC RESOURCE', 'EST. 1987 · DO NOT FILL'], plaque: true });
    const pin = M.nearest(R.pinball[0], R.pinball[1], MLK);
    if (pin) [[-70, 22], [0, -20], [70, 18]].forEach(([ds, lat], i) => {
      const p = M.pointAt(pin.road, pin.along + ds);
      const [nx, ny] = normal(p);
      add(p.x + nx * lat, p.y + ny * lat, 20 + (i % 2) * 2);
    });
    const mid = [(R.mlkAllston[0] + R.milvaAllston[0]) / 2, (R.mlkAllston[1] + R.milvaAllston[1]) / 2];
    onRoad(mid, 'ALLSTON WAY', -14, 30, { sign: ['REPAIR SCHEDULED:', 'AFTER COMMUNITY INPUT'] });
    // signs sit on the sidewalk beside their crater
    for (const p of potholes) if (p.sign && p.signOnly) {
      const n = M.nearest(p.x, p.y);
      const q = M.pointAt(n.road, n.along);
      p.sx = p.x - q.dy * (n.road.hw + SW + 70) * p.side;
      p.sy = p.y + q.dx * (n.road.hw + SW + 70) * p.side;
    }
    for (const p of potholes) if (p.sign && !p.signOnly) {
      const n = M.nearest(p.x, p.y);
      const d = n.d || 1;
      const ox = (p.x - n.px) / d || normal(M.pointAt(n.road, n.along))[0], oy = (p.y - n.py) / d || normal(M.pointAt(n.road, n.along))[1];
      p.sx = n.px + ox * (n.road.hw + SW + 50);
      p.sy = n.py + oy * (n.road.hw + SW + 50);
      if (G.dist(p.sx, p.sy, TENT.x, TENT.y) < TENT.r + 100) { p.sx = 2 * n.px - p.sx; p.sy = 2 * n.py - p.sy; } // not on the tent
    }
    for (let i = potholes.length - 1; i >= 0; i--) if (potholes[i].signOnly) extraSigns.push(potholes.splice(i, 1)[0]);
  })();

  // cones and inspectors appear as bureaucracy rises
  const clutter = (function () {
    const rng = G.mulberry32(99);
    const cones = [], inspectors = [];
    for (const r of M.roads) {
      for (let s = 60; s < r.len - 60; s += 110 + rng() * 140) {
        const p = M.pointAt(r, s);
        if (M.nodes.some((n) => n.junction && G.dist(n.x, n.y, p.x, p.y) < n.hw + 30)) continue;
        const side = rng() < 0.5 ? -1 : 1;
        const [nx, ny] = normal(p);
        if (rng() < 0.55) cones.push({ x0: p.x + nx * side * (r.hw - 12), y0: p.y + ny * side * (r.hw - 12), minStars: 2 + Math.floor(rng() * 4) });
        if (rng() < 0.12) inspectors.push({ x: p.x + nx * side * (r.hw + SW / 2), y: p.y + ny * side * (r.hw + SW / 2), minStars: 2 + Math.floor(rng() * 4), ph: rng() * 6 });
      }
    }
    return { cones, inspectors };
  })();

  // cyclists ride real streets (Milvia is the bike boulevard, naturally)
  const CYCLIST_DEFS = [
    { name: MLK, at: R.mlkUniversity, off: 30, sp: 80, amp: 18 },
    { name: MLK, at: R.mlkCenter, off: -30, sp: 95, amp: 12 },
    { name: 'MILVIA ST', at: R.milviaCenter, off: 0, sp: 85, amp: 30 },
    { name: 'MILVIA ST', at: R.milvaAllston, off: 15, sp: 75, amp: 25 },
    { name: 'HOPKINS ST', at: R.hopkinsMonterey, off: 28, sp: 70, amp: 20 },
    { name: 'HOPKINS ST', at: R.hopkinsSacramento, off: -26, sp: 90, amp: 15 },
    { name: 'HOPKINS ST', at: R.hopkinsMcgee, off: 24, sp: 65, amp: 28 },
    { name: 'HOPKINS ST', at: R.hopkinsMonterey, off: -30, sp: 85, amp: 22 },
    { name: 'ALLSTON WAY', at: R.milvaAllston, off: -20, sp: 75, amp: 16 },
    { name: 'UNIVERSITY AVE', at: R.mlkUniversity, off: 34, sp: 95, amp: 18 },
    { name: 'SHATTUCK AVE', at: R.spawn, off: 34, sp: 80, amp: 20 },
  ].map((d, k) => {
    const path = M.chain(d.name, d.at);
    return path && path.len > 200 ? Object.assign(d, { path, k }) : null;
  }).filter(Boolean);

  // minimap base layer, drawn once
  let miniCanvas = null, miniScale = 1;
  function buildMinimap(mh) {
    miniScale = mh / H;
    const mw = Math.ceil(W * miniScale);
    const c = document.createElement('canvas');
    const dpr = G.view.dpr;
    c.width = Math.ceil(mw * dpr);
    c.height = Math.ceil(mh * dpr);
    const x = c.getContext('2d');
    x.scale(dpr, dpr);
    x.fillStyle = '#2f4a2a';
    x.fillRect(0, 0, mw, mh);
    x.lineCap = 'round';
    x.lineJoin = 'round';
    for (const r of M.roads) {
      x.strokeStyle = r.cls === 'L' ? '#5d5d66' : '#8a8a96';
      x.lineWidth = Math.max(1.2, r.hw * 2 * miniScale);
      x.beginPath();
      r.pts.forEach(([px, py], i) => (i ? x.lineTo(px * miniScale, py * miniScale) : x.moveTo(px * miniScale, py * miniScale)));
      x.stroke();
    }
    const zfill = { park: '#4f8f3a', bhs: '#b08968', oldCityHall: '#e85d75' };
    for (const [k, z] of Object.entries(M.zones)) {
      x.fillStyle = zfill[k];
      x.beginPath();
      z.forEach(([px, py], i) => (i ? x.lineTo(px * miniScale, py * miniScale) : x.moveTo(px * miniScale, py * miniScale)));
      x.fill();
    }
    if (CANYON) {
      x.strokeStyle = '#7d5233';
      x.lineWidth = Math.max(2, CANYON.r.hw * 2 * miniScale);
      x.beginPath();
      M.subPath(CANYON.r, CANYON.a0, CANYON.a1).forEach(([px, py], i) => (i ? x.lineTo(px * miniScale, py * miniScale) : x.moveTo(px * miniScale, py * miniScale)));
      x.stroke();
    }
    x.strokeStyle = '#ff3b3b';
    x.lineWidth = 2;
    for (const cl of CLOSURES) {
      const cx = cl.p.x * miniScale, cy = cl.p.y * miniScale;
      x.beginPath(); x.moveTo(cx - 3, cy - 3); x.lineTo(cx + 3, cy + 3); x.moveTo(cx + 3, cy - 3); x.lineTo(cx - 3, cy + 3); x.stroke();
    }
    miniCanvas = { c, mw, mh, dpr };
  }

  // rubble layout (seeded)
  const rubble = (function () {
    const rng = G.mulberry32(1989);
    const z = M.zones.oldCityHall;
    const xs = z.map((p) => p[0]), ys = z.map((p) => p[1]);
    const out = [];
    for (let k = 0; k < 140; k++) {
      const x = Math.min(...xs) + rng() * (Math.max(...xs) - Math.min(...xs));
      const y = Math.min(...ys) + rng() * (Math.max(...ys) - Math.min(...ys));
      if (!G.pointInPoly(x, y, z) || M.nearest(x, y).e < SW + 4) continue;
      out.push({ x, y, w: 8 + rng() * 26, h: 6 + rng() * 16, rot: rng() * Math.PI, c: G.pick(['#cfc6b3', '#b7ad98', '#e9e4d6', '#9d927d', '#8a7f6b'], rng) });
    }
    return out;
  })();

  // ---------- scene ----------
  const City = {};
  G.scenes.city = City;

  City.enter = function (opts = {}) {
    this.phase = opts.phase || 'drive1';
    this.t = 0;
    this.fx = new G.Particles();
    this.floaters = new G.Floaters();
    this.route = null;
    this.routeT = 0;
    this.parkSeq = -1;
    this.lastLand = null;
    this.chEntered = false;
    this.cones = clutter.cones.map((c) => ({ x: c.x0, y: c.y0, vx: 0, vy: 0, rot: 0, vr: 0, down: false, minStars: c.minStars, scale: 0 }));
    this.inspectors = clutter.inspectors.map((p) => Object.assign({}, p, { cd: 0, scale: 0 }));
    this.cyclists = CYCLIST_DEFS.map((d) => {
      const pr = M.pathProject(d.path, d.at[0], d.at[1]);
      return Object.assign({}, d, { s: pr ? pr.s : d.path.len / 2, dir: d.k % 2 ? 1 : -1, t: d.k, wobble: 0, cd: 0, bellCd: 0, jersey: JERSEYS[d.k % JERSEYS.length] });
    });
    const rng = G.mulberry32(77);
    this.clowns = Array.from({ length: 7 }, (_, k) => ({ x: TENT.x + (rng() - 0.5) * 160, y: TENT.y + (rng() - 0.5) * 200, tx: 0, ty: 0, wait: rng() * 2, t: k, cd: 0, color: G.pick(['#ff5ea8', '#5bc0eb', '#9bc53d', '#fde74c', '#c77dff'], rng) }));
    if (!G.stats.spotTypes) G.stats.spotTypes = G.shuffle(['corral', 'dining', 'island', 'loading']).slice(0, 3);
    this.spots = SPOT_PLAN.map((p, k) => Object.assign(spotAt(p.s, p.side, k < 3 ? G.stats.spotTypes[k] : 'phantom'), { state: 'hidden', pop: 0 }));
    this.spots.forEach((s) => {
      const c = Math.cos(s.a), sn = Math.sin(s.a);
      const hw = s.w / 2, hh = s.h / 2;
      s.poly = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([lx, ly]) => [s.x + lx * c - ly * sn, s.y + lx * sn + ly * c]);
    });
    G.hud.reset();
    G.hud.setTicker(RADIO);
    G.audio.setMusic('drive');

    if (this.phase === 'drive1') {
      const p = M.pathPoint(shattuck, 90);
      this.car = new G.Car(p.x - p.dy * 26, p.y + p.dx * 26, Math.atan2(p.dx, -p.dy)); // right-hand lane
      G.hud.banner('MISSION START', 'POTHOLE PARADISE — DRIVE TO HOPKINS', { sting: 'start', dur: 3 });
      G.hud.setObjective('PARK ON HOPKINS', 'Drive to Hopkins & Monterey. Follow the yellow arrow & minimap route. Mind the craters.');
      G.hud.toast('ARROWS / WASD drive · SPACE handbrake · M map · P pause', { dur: 6, color: '#9be7ff' });
    } else if (this.phase === 'hopkins') {
      const p = M.pathPoint(hopkins, sMonterey + 70);
      this.car = new G.Car(p.x, p.y, Math.atan2(p.dx, -p.dy));
      this.startHopkins(true);
    } else if (this.phase === 'toCityHall') {
      const s = this.spots[3];
      const p = M.pathPoint(hopkins, s.s);
      this.car = new G.Car(p.x, p.y, Math.atan2(p.dx, -p.dy));
      this.spots.forEach((sp) => { sp.state = sp.type === 'phantom' ? 'gone' : 'done'; sp.pop = 1; });
      this.startCityHall(true);
    }
    this.car.onLand = (car) => this.onLand(car);
    this.camX = this.car.x;
    this.camY = this.car.y;
  };

  City.startHopkins = function (fromCheckpoint) {
    this.phase = 'hopkins';
    if (!fromCheckpoint) G.hud.banner('MISSION PASSED', 'YOU REACHED HOPKINS. THE ROAD DID NOT.', { sting: 'passed', dur: 2.6, color: '#7CFC00' });
    G.game.setCheckpoint('city', { phase: 'hopkins' });
    G.hud.banner('MISSION START', 'THE HOPKINS PARKING HEIST', { sting: 'start', dur: 2.8 });
    G.hud.setObjective('FIND ONE LEGAL PARKING SPACE. BUY ONE SLICE AT GIOIA.', 'Follow the P marker along Hopkins St.');
    G.formCommittee('Hopkins Parking Task Force');
    this.errand = 120;
    this.spotIdx = 0;
    this.nextSpotIn = 0;
    this.spots.forEach((s) => { s.state = 'hidden'; s.pop = 0; });
    this.spots[0].state = 'avail';
  };

  City.startCityHall = function (fromCheckpoint) {
    this.phase = 'toCityHall';
    this.car.locked = false;
    if (!fromCheckpoint) G.game.setCheckpoint('city', { phase: 'toCityHall' });
    G.hud.setObjective('FILE YOUR APPEAL AT THE COUNCIL TENT', 'Civic Center Park, MLK between Allston & Center — across from the rubble of Old City Hall. Stop at the marker and press E.');
    if (fromCheckpoint) G.hud.banner('CHECKPOINT', 'APPEAL FORM IN HAND. THE TENT AWAITS.', { dur: 2.2 });
  };

  City.target = function () {
    if (this.phase === 'drive1') return { x: R.hopkinsMonterey[0], y: R.hopkinsMonterey[1] };
    if (this.phase === 'hopkins') {
      const s = this.spots[this.spotIdx];
      if (!s) return null;
      const p = M.pathPoint(hopkins, s.s);
      return { x: p.x, y: p.y };
    }
    return { x: CH.x, y: CH.y };
  };

  City.onLand = function (car) {
    this.fx.burst(car.x, car.y, 10, { color: ['#8a7a66', '#6b5f50', '#aaa'], speed: 120, life: 0.6, size: 4 });
    G.hud.addShake(6);
    G.stats.maxAir = Math.max(G.stats.maxAir, car.chainAir);
    G.stats.bestChain = Math.max(G.stats.bestChain, car.chain);
    this.lastLand = { chain: car.chain, air: car.chainAir, t: 1.8 };
    if (car.chain >= 2) this.floaters.add(car.x, car.y - 30, 'POTHOLE PINBALL ×' + car.chain + '!', '#ff8fd8', 1.6, 18);
    else if (car.chainAir > 0.62) this.floaters.add(car.x, car.y - 30, 'SICK AIR!', '#9be7ff', 1.4, 16);
  };

  City.update = function (dt) {
    this.t += dt;
    const car = this.car;
    const inp = G.input;
    car.update(dt, inp);

    const hit = car.checkPotholes(potholes);
    if (hit) {
      G.stats.potholes++;
      this.floaters.add(hit.x, hit.y - 20, G.pick(QUIPS_POTHOLE), '#ffd23f');
      this.fx.burst(hit.x, hit.y, 14, { color: ['#3a332c', '#7b6d5e', '#c9b79c'], speed: 160, life: 0.7, size: 5 });
      G.hud.addShake(4);
    }

    // stay on the asphalt; bounce off barricades and anything a parking space turned into
    if (car.z < 25) {
      const hits = [];
      const rh = M.roadHit(car.x, car.y, car.r);
      if (rh) hits.push(rh);
      for (const c of CLOSURES) {
        if (Math.abs(c.p.x - car.x) > 120 || Math.abs(c.p.y - car.y) > 120) continue;
        const h = G.circlePoly(car.x, car.y, car.r, c.poly);
        if (h) hits.push(h);
      }
      for (const s of this.spots) {
        if (s.state !== 'done' || s.type === 'loading' || G.dist(s.x, s.y, car.x, car.y) > 90) continue;
        const h = G.circlePoly(car.x, car.y, car.r, s.poly);
        if (h) hits.push(h);
      }
      for (const h of hits) {
        const imp = G.resolveHit(car, h, 0.3);
        if (imp > 90) {
          G.audio.play('bonk');
          G.hud.addShake(Math.min(8, imp / 30));
          car.hitFlash = 0.12;
        }
      }
    }
    car.x = G.clamp(car.x, car.r, W - car.r);
    car.y = G.clamp(car.y, car.r, H - car.r);

    if (CANYON) {
      const n = M.nearest(car.x, car.y);
      const inCanyon = n && n.road === CANYON.r && n.along > CANYON.a0 && n.along < CANYON.a1 && n.e < 0;
      if (inCanyon && !this.inCanyon) {
        G.hud.toast('YOU HAVE ENTERED ROOSEVELT CANYON. RANGERS RECOMMEND PRAYER.', { color: '#f3dfa2', dur: 4 });
        if (!G.stats.canyonNamed) { G.stats.canyonNamed = true; G.formCommittee('Roosevelt Canyon Naming Committee'); }
      }
      this.inCanyon = inCanyon;
      if (inCanyon && !car.airborne) { car.vx *= Math.exp(-0.6 * dt); car.vy *= Math.exp(-0.6 * dt); }
    }
    this.updateClutter(dt);
    this.updateCyclists(dt);
    this.updateClowns(dt);

    if (this.phase === 'drive1') {
      const n = M.nearest(car.x, car.y);
      if (n && n.road.name === 'HOPKINS ST' && n.e < 0) this.startHopkins(false);
    } else if (this.phase === 'hopkins') {
      this.updateHopkins(dt);
    } else if (this.phase === 'toCityHall') {
      const inZone = G.dist(car.x, car.y, CH.x, CH.y) < CH.r;
      if (inZone && !this.chEntered) { this.chEntered = true; G.audio.play('blip'); }
      if (!inZone) this.chEntered = false;
      if (inZone && inp.interact()) {
        G.audio.play('select');
        G.game.go('council');
      }
    }

    this.routeT -= dt;
    const tg = this.target();
    if (tg && this.routeT <= 0) {
      this.route = M.route(car.x, car.y, tg.x, tg.y);
      this.routeT = 0.35;
    }

    const tx = car.x + car.vx * 0.45, ty = car.y + car.vy * 0.45;
    this.camX += (tx - this.camX) * Math.min(1, dt * 4);
    this.camY += (ty - this.camY) * Math.min(1, dt * 4);
    if (this.lastLand) { this.lastLand.t -= dt; if (this.lastLand.t <= 0) this.lastLand = null; }
    this.fx.update(dt);
    this.floaters.update(dt);
  };

  City.updateClutter = function (dt) {
    const car = this.car, stars = G.stats.stars;
    for (const c of this.cones) {
      const active = stars >= c.minStars;
      c.scale = G.clamp(c.scale + (active ? dt * 4 : -dt * 4), 0, 1);
      if (!active) continue;
      if (c.vx || c.vy) {
        c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.vr * dt;
        const k = Math.exp(-3 * dt);
        c.vx *= k; c.vy *= k; c.vr *= k;
        if (Math.abs(c.vx) + Math.abs(c.vy) < 2) { c.vx = 0; c.vy = 0; }
      }
      if (!c.down && car.z < 20 && Math.abs(c.x - car.x) < 25 && Math.abs(c.y - car.y) < 25 && G.dist(c.x, c.y, car.x, car.y) < car.r + 7) {
        c.down = true;
        c.vx = car.vx * 1.3 + (Math.random() - 0.5) * 80;
        c.vy = car.vy * 1.3 + (Math.random() - 0.5) * 80;
        c.vr = (Math.random() - 0.5) * 20;
        car.vx *= 0.93; car.vy *= 0.93;
        G.audio.play('cone');
      }
    }
    for (const p of this.inspectors) {
      const active = stars >= p.minStars;
      p.scale = G.clamp(p.scale + (active ? dt * 3 : -dt * 3), 0, 1);
      p.cd = Math.max(0, p.cd - dt);
      if (active && p.cd <= 0 && G.dist(p.x, p.y, car.x, car.y) < 110) {
        p.cd = 6;
        this.floaters.add(p.x, p.y - 18, G.pick(QUIPS_INSPECTOR), '#ffe08a', 1.5, 13);
      }
    }
  };

  City.cyclistPos = function (c) {
    const p = M.pathPoint(c.path, c.s);
    const off = c.off + Math.sin(c.t * 0.9) * c.amp;
    const fx = p.dx * c.dir, fy = p.dy * c.dir;
    return { x: p.x - p.dy * off, y: p.y + p.dx * off, a: Math.atan2(fx, -fy) };
  };

  City.updateCyclists = function (dt) {
    const car = this.car;
    for (const c of this.cyclists) {
      c.t += dt;
      c.cd = Math.max(0, c.cd - dt);
      c.bellCd = Math.max(0, c.bellCd - dt);
      c.wobble = Math.max(0, c.wobble - dt);
      c.s += c.dir * c.sp * dt * (c.wobble > 0 ? 0.5 : 1);
      if (c.s < 40) { c.s = 40; c.dir = 1; }
      if (c.s > c.path.len - 40) { c.s = c.path.len - 40; c.dir = -1; }
      const p = this.cyclistPos(c);
      const d = G.dist(p.x, p.y, car.x, car.y);
      if (d < 170 && c.bellCd <= 0 && car.speed > 60) { c.bellCd = 5; G.audio.play('bell'); }
      // close passes earn a curse; on Hopkins they barely need an excuse
      const onHopkins = c.name === 'HOPKINS ST';
      c.curseCd = Math.max(0, (c.curseCd || 0) - dt);
      if (c.curseCd <= 0 && d < (onHopkins ? 150 : 85) && (onHopkins || car.speed > 80)) {
        c.curseCd = onHopkins ? 2.2 : 4;
        c.wobble = Math.max(c.wobble, 0.4);
        this.floaters.add(p.x, p.y - 24, G.pick(onHopkins ? QUIPS_HOPKINS : QUIPS_CYCLIST), '#ff7b7b', 1.6, onHopkins ? 15 : 13);
      }
      if (d < car.r + 10 && c.cd <= 0 && car.z < 15) {
        c.cd = 1.2;
        c.wobble = 1.2;
        let nx = car.x - p.x, ny = car.y - p.y;
        const len = Math.hypot(nx, ny) || 1;
        nx /= len; ny /= len;
        G.resolveHit(car, { nx, ny, depth: car.r + 10 - d }, 0.5);
        car.spin += (Math.random() < 0.5 ? -1 : 1) * 4;
        car.ctrl = 0.35;
        car.hitFlash = 0.15;
        G.audio.play('bonk');
        G.audio.play('bell');
        G.hud.addShake(5);
        c.curseCd = 2;
        this.floaters.add(p.x, p.y - 22, G.pick(c.name === 'HOPKINS ST' ? QUIPS_HOPKINS : QUIPS_CYCLIST), '#ff7b7b', 1.8, 15);
      }
    }
  };

  City.updateClowns = function (dt) {
    const zs = [M.zones.park, M.zones.oldCityHall];
    const car = this.car;
    for (const c of this.clowns) {
      c.t += dt;
      c.cd = Math.max(0, c.cd - dt);
      if (c.wait > 0) { c.wait -= dt; continue; }
      if (!c.tx || G.dist(c.x, c.y, c.tx, c.ty) < 6) {
        // pick a new wander target inside the rubble, or out onto the MLK sidewalk
        for (let k = 0; k < 10; k++) {
          const tx = TENT.x + (Math.random() - 0.5) * 420 - (Math.random() < 0.3 ? 260 : 0), ty = TENT.y + (Math.random() - 0.5) * 300;
          if (zs.some((z) => G.pointInPoly(tx, ty, z)) || (M.roadHit(tx, ty, -(SW)) === null && M.nearest(tx, ty).e < SW && M.nearest(tx, ty).e > 2)) { c.tx = tx; c.ty = ty; break; }
        }
        c.wait = Math.random() * 1.5;
        continue;
      }
      const d = G.dist(c.x, c.y, c.tx, c.ty);
      c.x += ((c.tx - c.x) / d) * 30 * dt;
      c.y += ((c.ty - c.y) / d) * 30 * dt;
      if (c.cd <= 0 && G.dist(c.x, c.y, car.x, car.y) < 130) {
        c.cd = 7;
        G.audio.play('horn');
        this.floaters.add(c.x, c.y - 20, G.pick(QUIPS_CLOWN), '#ff9ad5', 1.6, 13);
      }
    }
  };

  const TRANSFORM_TEXT = {
    corral: 'BIKE CORRAL INSTALLED. EFFECTIVE IMMEDIATELY.',
    dining: 'PARKLET OPENED. NOW SERVING SMALL PLATES.',
    island: 'LANDSCAPED ISLAND. PLEASE DO NOT PARK ON THE NATIVE GRASSES.',
    loading: '15-SECOND LOADING ONLY. YOUR 15 SECONDS BEGAN IN 2019.',
  };

  // car position in a spot's local frame (x along the curb)
  const toSpot = (s, x, y) => {
    const c = Math.cos(s.a), sn = Math.sin(s.a);
    const dx = x - s.x, dy = y - s.y;
    return [dx * c + dy * sn, -dx * sn + dy * c];
  };

  City.updateHopkins = function (dt) {
    const car = this.car;
    for (const s of this.spots) if (s.state !== 'hidden') s.pop = Math.min(1, s.pop + dt * 3);
    if (this.parkSeq >= 0) { this.updateParkSeq(dt); return; }
    this.errand -= dt;
    if (this.errand <= 0) {
      this.errand = 120;
      G.hud.toast('ERRAND DEADLINE EXTENDED PER STAFF RECOMMENDATION', { color: '#ffd23f' });
    }
    const s = this.spots[this.spotIdx];
    if (s && s.state === 'hidden' && this.nextSpotIn > 0) {
      this.nextSpotIn -= dt;
      if (this.nextSpotIn <= 0) {
        s.state = 'avail';
        s.pop = 0;
        G.audio.play('blip');
        G.hud.toast(s.type === 'phantom' ? 'A GENUINE, LEGAL, AVAILABLE SPACE — RIGHT IN FRONT OF GIOIA. PROBABLY.' : 'NEW PARKING SPACE DETECTED!', { color: '#9be7ff' });
      }
    }
    if (!s || s.state !== 'avail') return;
    const d = G.dist(car.x, car.y, s.x, s.y);
    if (s.type !== 'phantom') {
      if (d < 170) {
        s.state = 'done';
        s.pop = 0;
        G.audio.play('poof');
        G.audio.play('fail');
        this.fx.burst(s.x, s.y, 26, { type: 'poof', color: ['#fff', '#eee', '#ddd'], speed: 90, life: 0.8, size: 9 });
        this.floaters.add(s.x, s.y - 30, 'DENIED!', '#ff5a5a', 1.6, 22);
        G.hud.toast(TRANSFORM_TEXT[s.type], { color: '#ffb3b3', dur: 4 });
        G.stats.parkingYears++;
        const n = this.spotIdx + 1;
        if (n === 1) G.addStar('PARKING SPACE REIMAGINED');
        if (n === 3) G.addStar('THIRD DISAPPOINTMENT ON FILE');
        this.spotIdx++;
        this.nextSpotIn = 1.3;
      }
    } else {
      const [lx, ly] = toSpot(s, car.x, car.y);
      if (Math.abs(lx) < 46 && Math.abs(ly) < 30 && car.speed < 50 && !car.airborne) {
        this.parkSeq = 0;
        this.parkEvents = 0;
        car.locked = true;
      }
    }
  };

  City.updateParkSeq = function (dt) {
    const car = this.car;
    const s = this.spots[this.spotIdx];
    this.parkSeq += dt;
    const ev = (t) => this.parkSeq >= t && this.parkEvents < t * 10 + 1 && (this.parkEvents = t * 10 + 1);
    if (ev(0)) {
      G.audio.play('score');
      this.floaters.add(car.x, car.y - 30, 'PARKED!!!', '#7CFC00', 1.4, 22);
    }
    if (ev(1.2)) {
      s.state = 'ghost';
      s.ghostT = 0;
      G.hud.banner('PARKING SPACE NOT FOUND', 'THIS SPACE EXISTS ONLY IN THE 2019 PARKING STUDY.', { sting: 'fail', dur: 3.2, color: '#ff5a5a' });
      this.fx.burst(s.x, s.y, 30, { type: 'poof', color: ['#d6f0ff', '#fff'], speed: 70, life: 1.2, size: 10 });
      G.stats.parkingYears++;
    }
    if (ev(2.0)) {
      G.addStar('PHANTOM PARKING ATTEMPT');
      G.formCommittee('2019 Parking Study Update Committee');
    }
    if (ev(4.6)) G.hud.banner('ITEM ACQUIRED', 'PARKING APPEAL FORM 27-B (14 PAGES, DOUBLE-SIDED)', { sting: 'start', dur: 2.6, color: '#9be7ff' });
    if (ev(7.2)) {
      s.state = 'gone';
      this.parkSeq = -1;
      this.spotIdx = 99;
      G.hud.toast('PIZZA STATUS: STILL UNPURCHASED. THE SMELL WAS NICE, THOUGH.', { color: '#ffd23f' });
      this.startCityHall(false);
    }
    if (s && s.state === 'ghost') s.ghostT += dt;
  };

  // ---------- rendering ----------
  City.render = function (ctx, vw, vh, dpr) {
    const zoom = (this.zoom = G.clamp(Math.min(vw, vh) / 720, 0.55, 1.5));
    const shx = (Math.random() - 0.5) * G.hud.shake, shy = (Math.random() - 0.5) * G.hud.shake;
    const cx = this.camX, cy = this.camY;
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * (vw / 2 - cx * zoom + shx), dpr * (vh / 2 - cy * zoom + shy));
    const v = { x0: cx - vw / 2 / zoom - 60, x1: cx + vw / 2 / zoom + 60, y0: cy - vh / 2 / zoom - 60, y1: cy + vh / 2 / zoom + 60 };
    const t = this.t;

    ctx.fillStyle = '#7fae5b';
    ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    this.drawZones(ctx, v);
    const vis = M.roads.filter((r) => r.bbox[0] - 90 < v.x1 && r.bbox[2] + 90 > v.x0 && r.bbox[1] - 90 < v.y1 && r.bbox[3] + 90 > v.y0);
    this.drawRoads(ctx, v, vis);
    M.chunkItems(v.x0, v.y0, v.x1, v.y1, (it) => {
      if (it.x < v.x0 - 40 || it.x > v.x1 + 40 || it.y < v.y0 - 40 || it.y > v.y1 + 40) return;
      if (it.kind === 'house') drawHouse(ctx, it);
      else if (it.kind === 'tree') G.drawTree(ctx, it.x, it.y, it.r, it.hue);
      else drawStore(ctx, it, t);
    });
    this.drawLandmarks(ctx, v);

    if (CANYON && CANYON.mid.x > v.x0 - 400 && CANYON.mid.x < v.x1 + 400 && CANYON.mid.y > v.y0 - 400 && CANYON.mid.y < v.y1 + 400) this.drawCanyon(ctx, t);
    for (const p of potholes) {
      if (p.x < v.x0 || p.x > v.x1 || p.y < v.y0 || p.y > v.y1) continue;
      G.drawPothole(ctx, p, t);
    }
    for (const c of CLOSURES) this.drawClosure(ctx, c, v);
    this.drawSpots(ctx);
    for (const c of this.cones) {
      if (c.scale <= 0 || c.x < v.x0 || c.x > v.x1 || c.y < v.y0 || c.y > v.y1) continue;
      G.drawCone(ctx, c);
    }
    for (const p of this.inspectors) {
      if (p.scale <= 0 || p.x < v.x0 || p.x > v.x1 || p.y < v.y0 || p.y > v.y1) continue;
      G.drawInspector(ctx, p.x, p.y, t + p.ph, p.scale);
    }
    for (const c of this.clowns) if (c.x > v.x0 && c.x < v.x1 && c.y > v.y0 && c.y < v.y1) G.drawClown(ctx, c.x, c.y, c.t, c.color);
    if (this.phase === 'toCityHall') this.drawCityHallMarker(ctx);
    for (const c of this.cyclists) {
      const p = this.cyclistPos(c);
      if (p.x < v.x0 || p.x > v.x1 || p.y < v.y0 || p.y > v.y1) continue;
      G.drawCyclist(ctx, p.x, p.y, p.a, c.t, c.wobble, c.jersey);
    }
    for (const p of potholes.concat(extraSigns)) if (p.sign && p.sx > v.x0 - 150 && p.sx < v.x1 + 150 && p.sy > v.y0 - 80 && p.sy < v.y1 + 80) {
      G.drawSign(ctx, p.sx, p.sy, p.sign, { bg: p.plaque ? '#5b3a1e' : '#fffbe6', color: p.plaque ? '#f3dfa2' : '#222', border: p.plaque ? '#f3dfa2' : '#222', size: 11 });
    }

    this.fx.draw(ctx);
    this.car.draw(ctx);
    if (this.route && this.route.length > 1 && this.parkSeq < 0) {
      const wp = M.pathAhead(this.route, 130);
      G.hud.drawGuideArrow(ctx, this.car, wp[0], wp[1]);
    }
    this.floaters.draw(ctx);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    G.hud.drawObjective(ctx, vw);
    G.hud.drawStars(ctx, vw);
    this.drawAirHud(ctx, vw);
    if (this.phase === 'hopkins') this.drawErrandHud(ctx, vw);
    if (this.phase === 'toCityHall' && G.dist(this.car.x, this.car.y, CH.x, CH.y) < CH.r) this.drawPrompt(ctx, vw, vh, 'PRESS E (OR ENTER) TO FILE YOUR APPEAL');
    if (this.phase === 'hopkins' && this.parkSeq < 0) {
      const s = this.spots[this.spotIdx];
      if (s && s.type === 'phantom' && s.state === 'avail' && G.dist(this.car.x, this.car.y, s.x, s.y) < 160) this.drawPrompt(ctx, vw, vh, 'STOP INSIDE THE SPACE TO PARK');
    }
    this.drawMinimap(ctx, vw, vh);
    G.hud.drawToasts(ctx, vw, vh);
    G.hud.drawTicker(ctx, vw, vh);
    G.hud.drawBanner(ctx, vw, vh);
  };

  function strokeRoad(ctx, r) {
    ctx.beginPath();
    r.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }

  City.drawRoads = function (ctx, v, vis) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#cbc5b8';
    for (const r of vis) { ctx.lineWidth = (r.hw + SW) * 2; strokeRoad(ctx, r); }
    ctx.strokeStyle = '#8f897c';
    for (const r of vis) { ctx.lineWidth = r.hw * 2 + 4; strokeRoad(ctx, r); }
    ctx.strokeStyle = '#4a4a50';
    for (const r of vis) { ctx.lineWidth = r.hw * 2; strokeRoad(ctx, r); }
    // double yellow on arterials & collectors (yellow band with an asphalt stripe down the middle)
    for (const r of vis) {
      if (r.cls === 'L') continue;
      ctx.strokeStyle = '#f2c230';
      ctx.lineWidth = 7;
      strokeRoad(ctx, r);
      ctx.strokeStyle = '#4a4a50';
      ctx.lineWidth = 2.5;
      strokeRoad(ctx, r);
    }
    ctx.lineCap = 'butt';
    // intersections: clear the paint, then crosswalks on every leg
    for (const n of M.nodes) {
      if (!n.junction || n.x < v.x0 - 100 || n.x > v.x1 + 100 || n.y < v.y0 - 100 || n.y > v.y1 + 100) continue;
      ctx.fillStyle = '#4a4a50';
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.hw + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (const r of n.roads) {
        const nb = r.a === n.i ? r.pts[1] : r.pts[r.pts.length - 2];
        const dx = nb[0] - n.x, dy = nb[1] - n.y, L = Math.hypot(dx, dy) || 1;
        if (L < n.hw + 20) continue;
        ctx.save();
        ctx.translate(n.x + (dx / L) * (n.hw + 6), n.y + (dy / L) * (n.hw + 6));
        ctx.rotate(Math.atan2(dy, dx));
        for (let k = -r.hw + 6; k < r.hw - 6; k += 13) ctx.fillRect(0, k, 13, 7);
        ctx.restore();
      }
    }
    // painted street names
    ctx.save();
    ctx.font = G.font(22);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (const r of vis) {
      if (r.len < 230 || !r.name) continue;
      const p = M.pointAt(r, r.len / 2);
      let a = Math.atan2(p.dy, p.dx);
      if (a > Math.PI / 2) a -= Math.PI;
      if (a < -Math.PI / 2) a += Math.PI;
      const label = r.name === MLK ? 'MARTIN LUTHER KING JR WAY' : r.name;
      if (ctx.measureText(label).width > r.len - 2 * r.hw - 20) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(a);
      ctx.fillText(label, 0, r.cls === 'L' ? 0 : r.hw * 0.5);
      ctx.restore();
    }
    ctx.restore();
  };

  City.drawCanyon = function (ctx, t) {
    const poly = CANYON.poly;
    const path = (scale) => {
      ctx.beginPath();
      const [mx, my] = [CANYON.mid.x, CANYON.mid.y];
      poly.forEach(([x, y], i) => {
        const px = mx + (x - mx) * 1, py = my + (y - my) * 1;
        const ax = CANYON.mid.x + (px - CANYON.mid.x), ay = CANYON.mid.y + (py - CANYON.mid.y);
        const n = M.nearest(ax, ay, 'ROOSEVELT AVE');
        const qx = n.px + (ax - n.px) * scale, qy = n.py + (ay - n.py) * scale;
        i ? ctx.lineTo(qx, qy) : ctx.moveTo(qx, qy);
      });
      ctx.closePath();
    };
    // rock strata stepping down to the canyon floor
    [[1.0, '#b8875a'], [0.86, '#9c6b43'], [0.72, '#7d5233'], [0.56, '#5b3a24'], [0.38, '#3a251a']].forEach(([sc, col]) => {
      ctx.fillStyle = col;
      path(sc);
      ctx.fill();
    });
    ctx.strokeStyle = 'rgba(255,230,190,0.35)';
    ctx.lineWidth = 1.5;
    path(0.93);
    ctx.stroke();
    // one high-contrast hazard outline for the whole gorge
    ctx.save();
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    path(1.06);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffd23f';
    ctx.setLineDash([10, 8]);
    ctx.lineDashOffset = -t * 10;
    ctx.stroke();
    ctx.restore();
    // a creek winds along the bottom
    const r = CANYON.r;
    ctx.strokeStyle = '#4aa3df';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let s = CANYON.a0 + 10; s <= CANYON.a1 - 10; s += 8) {
      const p = M.pointAt(r, s);
      const w = Math.sin(s * 0.05 + t * 0.6) * 7;
      s === CANYON.a0 + 10 ? ctx.moveTo(p.x - p.dy * w, p.y + p.dx * w) : ctx.lineTo(p.x - p.dy * w, p.y + p.dx * w);
    }
    ctx.stroke();
  };

  function drawHouse(ctx, h) {
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.a);
    const w = h.big ? h.w * 1.3 : h.w, d = h.big ? h.h * 1.2 : h.h;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(-w / 2 + 3, -d / 2 + 4, w, d);
    ctx.fillStyle = h.color;
    ctx.fillRect(-w / 2, -d / 2, w, d);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(-w / 2, -d / 2, w, d / 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-w / 2 + 2, 0); ctx.lineTo(w / 2 - 2, 0); ctx.stroke();
    ctx.restore();
  }

  function drawStore(ctx, s, t) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.a);
    // local +y faces the street
    const w = s.hero || s.big ? 70 : 46, d = s.hero || s.big ? 48 : 38;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(-w / 2 + 3, -d / 2 + 4, w, d);
    ctx.fillStyle = s.hero ? '#7b2d26' : s.roof;
    ctx.fillRect(-w / 2, -d / 2, w, d);
    for (let k = 0; k < w; k += 8) {
      ctx.fillStyle = (k / 8) % 2 ? '#fff' : s.hero ? '#2a9d8f' : s.awning;
      ctx.fillRect(-w / 2 + k, d / 2 - 2, Math.min(8, w - k), 8);
    }
    const flip = Math.cos(s.a) < 0;
    ctx.rotate(flip ? Math.PI : 0);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const words = s.name.split(' ');
    const lines = [];
    for (const wd of words) {
      if (lines.length && (lines[lines.length - 1] + ' ' + wd).length <= 11) lines[lines.length - 1] += ' ' + wd;
      else if (lines.length < 2) lines.push(wd);
    }
    ctx.font = G.font(s.hero || s.big ? 10 : 7.5, 800);
    lines.forEach((l, i) => G.outlineText(ctx, l, 0, (i - (lines.length - 1) / 2) * 9 - (s.hero ? 6 : 0), s.hero ? '#ffd23f' : '#fff', '#000', 2.5));
    if (s.hero) G.drawPizza(ctx, 0, 12, 8 + Math.sin(t * 4));
    ctx.restore();
  }

  City.drawZones = function (ctx, v) {
    const fills = { park: '#79b357', bhs: '#cfc6b4', oldCityHall: '#bdb3a0' };
    for (const [k, z] of Object.entries(M.zones)) {
      ctx.fillStyle = fills[k];
      ctx.beginPath();
      z.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fill();
    }
    void v;
  };

  City.drawLandmarks = function (ctx) {
    const t = this.t;
    // Civic Center Park
    const pk = M.zones.park, [pcx, pcy] = M.zoneCenter(pk);
    ctx.strokeStyle = '#e3d9c3';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(pk[0][0], pk[0][1]); ctx.lineTo(pk[2][0], pk[2][1]);
    ctx.moveTo(pk[1][0], pk[1][1]); ctx.lineTo(pk[3][0], pk[3][1]);
    ctx.stroke();
    pk.forEach(([x, y], i) => G.drawTree(ctx, G.lerp(x, pcx, 0.18), G.lerp(y, pcy, 0.18), 20, i % 2));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = G.font(14);
    G.outlineText(ctx, 'CIVIC CENTER PARK', pcx, pcy - TENT.r - 58, '#fff', '#2d5a1e', 4);

    // Berkeley High School: buildings to the north, the track to the south
    const bz = M.zones.bhs, [bcx, bcy] = M.zoneCenter(bz);
    const bw = Math.abs(bz[1][0] - bz[0][0]), bh = Math.abs(bz[3][1] - bz[0][1]);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(bcx - bw * 0.42 + 6, bcy - bh * 0.46 + 8, bw * 0.84, bh * 0.36);
    ctx.fillStyle = '#c47f5a';
    ctx.fillRect(bcx - bw * 0.42, bcy - bh * 0.46, bw * 0.84, bh * 0.36);
    ctx.fillStyle = '#a8673f';
    ctx.fillRect(bcx - bw * 0.3, bcy - bh * 0.4, bw * 0.6, bh * 0.08);
    ctx.fillRect(bcx - bw * 0.3, bcy - bh * 0.24, bw * 0.6, bh * 0.08);
    ctx.save();
    ctx.translate(bcx, bcy + bh * 0.22);
    ctx.fillStyle = '#b5523b';
    ctx.beginPath(); ctx.ellipse(0, 0, bw * 0.38, bh * 0.24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5aa04a';
    ctx.beginPath(); ctx.ellipse(0, 0, bw * 0.28, bh * 0.17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 0, bw * 0.33, bh * 0.205, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    ctx.font = G.font(16);
    G.outlineText(ctx, 'BERKELEY HIGH SCHOOL', bcx, bcy - bh * 0.28, '#ffd23f', '#000', 4);

    // Old City Hall, after the earthquake
    const oz = M.zones.oldCityHall;
    for (const p of rubble) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(-p.w / 2 + 2, -p.h / 2 + 3, p.w, p.h);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    // the cupola, tipped over and cracked
    const far = rubble.reduce((b, p) => (G.dist(p.x, p.y, RUBBLE_C[0], RUBBLE_C[1]) < G.dist(b.x, b.y, RUBBLE_C[0], RUBBLE_C[1]) ? p : b), rubble[0] || { x: RUBBLE_C[0], y: RUBBLE_C[1] });
    const [ox, oy] = [far.x, far.y];
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(0.6);
    ctx.fillStyle = '#7fa38a';
    ctx.beginPath(); ctx.ellipse(0, 0, 22, 17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2f3e33';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-20, -8); ctx.lineTo(-4, 2); ctx.lineTo(-10, 14); ctx.moveTo(4, -20); ctx.lineTo(10, -2); ctx.lineTo(24, 4); ctx.stroke();
    ctx.restore();
    // fallen columns
    rubble.filter((_, k) => k % 23 === 5).slice(0, 3).map((p) => [p.x, p.y, p.rot]).forEach(([x, y, a]) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.fillStyle = '#f2ede1';
      ctx.fillRect(-22, -6, 44, 12);
      ctx.strokeStyle = '#c9c1ad';
      ctx.lineWidth = 1;
      for (let k = -18; k < 22; k += 8) { ctx.beginPath(); ctx.moveTo(k, -7); ctx.lineTo(k, 7); ctx.stroke(); }
      ctx.restore();
    });
    // caution tape
    ctx.save();
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = '#ffd23f';
    ctx.beginPath();
    oz.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.stroke();
    ctx.lineDashOffset = 10;
    ctx.strokeStyle = '#111';
    ctx.stroke();
    ctx.restore();
    ctx.font = G.font(12);
    G.outlineText(ctx, 'OLD CITY HALL', RUBBLE_C[0], RUBBLE_C[1] - 30, '#fff', '#000', 3);
    G.drawSign(ctx, RUBBLE_C[0], RUBBLE_C[1] + 20, ['SEISMIC RETROFIT', 'STUDY IN PROGRESS'], { size: 8, bg: '#f26b1d', color: '#fff' });
    // the big top, in the park across the street
    drawTent(ctx, TENT.x, TENT.y, TENT.r, t);
  };

  function drawTent(ctx, x, y, r, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.arc(6, 8, r + 6, 0, Math.PI * 2); ctx.fill();
    const n = 16;
    for (let k = 0; k < n; k++) {
      ctx.fillStyle = k % 2 ? '#fff4e0' : '#d62828';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, (k / n) * Math.PI * 2, ((k + 1) / n) * Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    }
    // scalloped valance
    for (let k = 0; k < n * 2; k++) {
      const a = (k / (n * 2)) * Math.PI * 2;
      ctx.fillStyle = k % 2 ? '#ffd23f' : '#1d6fe0';
      ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 7, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d62828';
    const w = Math.sin(t * 5) * 4;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(30, -6 + w); ctx.lineTo(0, -14); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = G.font(12);
    G.outlineText(ctx, 'COUNCIL CHAMBERS', x, y + r + 20, '#ffd23f', '#000', 4);
    ctx.font = G.font(10, 800);
    G.outlineText(ctx, '(TEMPORARY)', x, y + r + 34, '#fff', '#000', 3);
  }

  City.drawClosure = function (ctx, c, v) {
    if (c.p.x < v.x0 - 150 || c.p.x > v.x1 + 150 || c.p.y < v.y0 - 150 || c.p.y > v.y1 + 150) return;
    ctx.save();
    ctx.beginPath();
    c.poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = '#f26b1d';
    ctx.fill();
    ctx.clip();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 7;
    for (let k = -200; k < 200; k += 20) { ctx.beginPath(); ctx.moveTo(c.p.x + k, c.p.y - 200); ctx.lineTo(c.p.x + k + 200, c.p.y + 200); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    c.poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.stroke();
    const on = Math.floor(this.t * 3) % 2 === 0;
    ctx.fillStyle = on ? '#ffd23f' : '#8a6d00';
    [c.poly[0], c.poly[2]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); });
    G.drawSign(ctx, c.sign[0], c.sign[1], c.lines, { bg: '#f26b1d', color: '#fff', border: '#222', size: 11 });
  };

  function backOut(t) {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  City.drawSpots = function (ctx) {
    for (const s of this.spots) {
      if (s.state === 'hidden' || s.state === 'gone') continue;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.a);
      // local: x along the curb, +y/-y across; `out` points toward the sidewalk
      const out = s.side > 0 ? -1 : 1;
      const pop = s.state === 'done' ? backOut(s.pop) : 1;
      ctx.scale(pop, pop);
      const x0 = -s.w / 2, y0 = -s.h / 2;
      if (s.state === 'avail') {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.strokeRect(x0, y0, s.w, s.h);
        ctx.fillStyle = 'rgba(80,170,255,' + (0.25 + Math.sin(this.t * 6) * 0.12) + ')';
        ctx.fillRect(x0, y0, s.w, s.h);
        ctx.rotate(-s.a);
        const bob = Math.sin(this.t * 4) * 5;
        ctx.fillStyle = '#1565c0';
        ctx.strokeStyle = '#fff';
        G.rr(ctx, -16, -62 + bob, 32, 32, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = G.font(22);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('P', 0, -45 + bob);
        ctx.font = G.font(11);
        G.outlineText(ctx, s.type === 'phantom' ? 'DEFINITELY REAL' : 'AVAILABLE!', 0, -75 + bob, '#9be7ff', '#000', 3);
      } else if (s.state === 'ghost') {
        ctx.globalAlpha = Math.max(0, 1 - s.ghostT / 2.5) * (0.5 + 0.5 * Math.sin(s.ghostT * 30));
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = '#d6f0ff';
        ctx.lineWidth = 3;
        ctx.strokeRect(x0, y0, s.w, s.h);
        ctx.setLineDash([]);
        ctx.font = G.font(10);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#d6f0ff';
        ctx.fillText('2019 STUDY', 0, 4);
      } else {
        drawTransformed(ctx, s, this.t, out);
      }
      ctx.restore();
    }
  };

  function drawTransformed(ctx, s, t, out) {
    const x0 = -s.w / 2, y0 = -s.h / 2;
    const wob = Math.sin(t * 5) * 0.05;
    const signY = out * 40;
    const sign = (lines, o) => { ctx.save(); ctx.rotate(-s.a); const c = Math.cos(s.a), sn = Math.sin(s.a); G.drawSign(ctx, -signY * sn, signY * c + 10, lines, Object.assign({ rot: wob, size: 9 }, o)); ctx.restore(); };
    if (s.type === 'corral') {
      ctx.fillStyle = '#9a9a9a';
      ctx.fillRect(x0, y0, s.w, s.h);
      ctx.strokeStyle = '#ffd23f';
      ctx.lineWidth = 3;
      ctx.strokeRect(x0, y0, s.w, s.h);
      for (let k = 0; k < 5; k++) G.drawBikeRack(ctx, x0 + 10 + k * 16, 0);
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x0 + 18 + k * 22, y0 + 4); ctx.lineTo(x0 + 18 + k * 22, y0 + s.h - 4); ctx.stroke(); }
      sign(['BIKE CORRAL'], { bg: '#1f7a3a', color: '#fff', size: 10 });
    } else if (s.type === 'dining') {
      ctx.fillStyle = '#b07a45';
      ctx.fillRect(x0, y0, s.w, s.h);
      ctx.strokeStyle = '#8a5a2b';
      ctx.lineWidth = 1;
      for (let k = 6; k < s.w; k += 7) { ctx.beginPath(); ctx.moveTo(x0 + k, y0); ctx.lineTo(x0 + k, y0 + s.h); ctx.stroke(); }
      ctx.fillStyle = '#3f8a3a';
      ctx.fillRect(x0 - 4, y0, 8, s.h);
      ctx.fillRect(x0 + s.w - 4, y0, 8, s.h);
      [['#e63946', 22], ['#2a9d8f', 58]].forEach(([c, dx]) => {
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(x0 + dx, 0, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(x0 + dx, 0, 3, 0, Math.PI * 2); ctx.fill();
      });
      sign(['PARKLET', 'SMALL PLATES $34']);
    } else if (s.type === 'island') {
      ctx.fillStyle = '#d8d2c4';
      G.rr(ctx, x0 - 3, y0 - 3, s.w + 6, s.h + 6, 16);
      ctx.fill();
      ctx.fillStyle = '#6aa84f';
      G.rr(ctx, x0, y0, s.w, s.h, 14);
      ctx.fill();
      for (let k = 0; k < 6; k++) G.drawTree(ctx, x0 + 10 + k * 13, k % 2 ? -6 : 6, 7, k % 2);
      sign(['INTERPRETIVE SIGN:', 'HERE STOOD A PARKING SPACE'], { bg: '#5b3a1e', color: '#f3dfa2' });
    } else if (s.type === 'loading') {
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(x0, out > 0 ? y0 + s.h : y0 - 4, s.w, 4);
      ctx.strokeStyle = '#ffd23f';
      ctx.lineWidth = 2;
      ctx.strokeRect(x0, y0, s.w, s.h);
      ctx.fillStyle = '#ffd23f';
      ctx.font = G.font(10);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LOADING 15 SEC', 0, 0);
      sign(['15-SECOND', 'LOADING ONLY'], { bg: '#ffd23f', size: 10 });
    }
  }

  City.drawCityHallMarker = function (ctx) {
    const pulse = 1 + Math.sin(this.t * 5) * 0.08;
    ctx.save();
    ctx.translate(CH.x, CH.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = 'rgba(255,210,63,0.22)';
    ctx.beginPath(); ctx.arc(0, 0, CH.r * 0.75, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 8]);
    ctx.lineDashOffset = -this.t * 20;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = G.font(14);
    G.outlineText(ctx, 'FILE APPEAL HERE', CH.x, CH.y - CH.r * 0.75 - 14, '#ffd23f', '#000', 4);
  };

  City.drawPrompt = function (ctx, vw, vh, text) {
    ctx.save();
    ctx.font = G.font(vw < 600 ? 13 : 17);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 30;
    const y = vh * 0.78;
    const blink = 0.75 + 0.25 * Math.sin(this.t * 8);
    ctx.fillStyle = 'rgba(0,0,0,' + 0.75 * blink + ')';
    G.rr(ctx, vw / 2 - w / 2, y - 20, w, 40, 8);
    ctx.fill();
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffd23f';
    ctx.fillText(text, vw / 2, y + 1);
    ctx.restore();
  };

  City.drawAirHud = function (ctx, vw) {
    const car = this.car;
    const air = car.airborne;
    if (!air && !this.lastLand) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const y = vw < 600 ? 120 : 92;
    if (air) {
      const on = Math.floor(this.t * 8) % 2 === 0;
      const w = Math.min(vw - 30, 380);
      ctx.fillStyle = on ? '#d62828' : '#7a0f0f';
      G.rr(ctx, vw / 2 - w / 2, y - 18, w, 36, 6);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = G.font(vw < 600 ? 14 : 18);
      ctx.fillStyle = '#fff';
      ctx.fillText('⚠ ROAD SURFACE NOT FOUND ⚠', vw / 2, y + 1);
    }
    const airTime = air ? car.chainAir : this.lastLand.air;
    const chain = air ? car.chain : this.lastLand.chain;
    const mw = 220, mx = vw / 2 - mw / 2, my = y + 26;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    G.rr(ctx, mx, my, mw, 26, 5);
    ctx.fill();
    const best = Math.max(1.2, G.stats.maxAir);
    ctx.fillStyle = '#9be7ff';
    G.rr(ctx, mx + 3, my + 3, Math.max(4, (mw - 6) * G.clamp(airTime / best, 0, 1)), 20, 4);
    ctx.fill();
    ctx.font = G.font(11);
    ctx.fillStyle = '#000';
    ctx.fillText('BOUNCE METER ' + airTime.toFixed(2) + 's' + (chain > 1 ? '  ×' + chain : ''), vw / 2, my + 14);
    ctx.restore();
  };

  City.drawErrandHud = function (ctx, vw) {
    const text = 'ERRAND TIME: ' + G.fmtTime(this.errand) + '  /  PARKING SEARCH: ' + G.stats.parkingYears + ' YEARS';
    ctx.save();
    ctx.font = G.font(vw < 700 ? 10 : 13);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 24;
    const y = vw < 700 ? 100 : 30;
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    G.rr(ctx, vw / 2 - w / 2, y - 14, w, 28, 6);
    ctx.fill();
    ctx.fillStyle = this.errand < 15 && Math.floor(this.t * 4) % 2 ? '#ff5a5a' : '#fff';
    ctx.fillText(text, vw / 2, y + 1);
    ctx.restore();
  };

  City.drawMinimap = function (ctx, vw, vh) {
    if (!G.settings.minimap) return;
    const mh = Math.round(Math.min(250, vh * 0.34));
    if (!miniCanvas || miniCanvas.mh !== mh || miniCanvas.dpr !== G.view.dpr) buildMinimap(mh);
    const sc = miniScale, mw = miniCanvas.mw;
    const x = 12, y = vh - mh - 12 - (G.settings.radio ? 24 : 0);
    ctx.save();
    ctx.fillStyle = 'rgba(15,20,30,0.82)';
    G.rr(ctx, x - 6, y - 6, mw + 12, mh + 12, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.drawImage(miniCanvas.c, x, y, mw, mh);
    ctx.beginPath();
    ctx.rect(x, y, mw, mh);
    ctx.clip();
    if (this.route && this.route.length > 1) {
      ctx.strokeStyle = '#ff4fd8';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      this.route.forEach(([px, py], i) => (i ? ctx.lineTo(x + px * sc, y + py * sc) : ctx.moveTo(x + px * sc, y + py * sc)));
      ctx.stroke();
    }
    const tg = this.target();
    if (tg) G.drawStar(ctx, x + tg.x * sc, y + tg.y * sc, 7 + Math.sin(this.t * 6) * 1.5, '#ffd23f', '#000');
    ctx.save();
    ctx.translate(x + this.car.x * sc, y + this.car.y * sc);
    ctx.rotate(this.car.a);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 5); ctx.lineTo(-5, 5); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.restore();
    ctx.save();
    ctx.font = G.font(9, 800);
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'bottom';
    ctx.fillText('N ▲   [M] MAP', x, y - 8);
    ctx.restore();
  };

  City.debug = { potholes, CLOSURES, CH, TENT, hopkins, shattuck, SPOT_PLAN, gioia, CANYON };
})();
