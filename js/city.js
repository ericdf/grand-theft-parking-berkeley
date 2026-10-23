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

  // Parking spots. Hopkins itself has no parking any more (see the Hopkins Corridor Project below), so the
  // hunt runs along the real cross streets; the last "space" is painted in the cycletrack in front of Gioia.
  const HOP_HW = (M.roads.find((r) => r.name === 'HOPKINS ST') || { hw: 54 }).hw;
  function crossSpot(name, side) {
    const node = M.nodes.find((n) => n.roads.some((r) => r.name === name) && n.roads.some((r) => r.name === 'HOPKINS ST'));
    const r = node && node.roads.find((q) => q.name === name && q.len > 280);
    if (!r) return null;
    const p = M.pointAt(r, r.a === node.i ? 190 : r.len - 190);
    const [nx, ny] = normal(p);
    const off = (r.hw - 19) * side;
    return { side, x: p.x + nx * off, y: p.y + ny * off, a: Math.atan2(p.dy, p.dx) };
  }
  const gioiaS = gioia ? M.pathProject(hopkins, gioia.x, gioia.y).s : sMonterey + 90;
  const gioiaSide = (() => {
    if (!gioia) return 1;
    const p = M.pathPoint(hopkins, gioiaS);
    const [nx, ny] = normal(p);
    return (gioia.x - p.x) * nx + (gioia.y - p.y) * ny > 0 ? 1 : -1;
  })();
  const SPOT_PLAN = (() => {
    const plan = ['MCGEE AVE', 'CARLOTTA AVE', 'MONTEREY AVE', 'CALIFORNIA ST', 'COLUSA AVE']
      .map((name, k) => crossSpot(name, k % 2 ? 1 : -1)).filter(Boolean).slice(0, 3);
    const p = M.pathPoint(hopkins, gioiaS);
    const [nx, ny] = normal(p);
    const off = (HOP_HW - 19) * gioiaSide;
    plan.push({ s: gioiaS, side: gioiaSide, x: p.x + nx * off, y: p.y + ny * off, a: Math.atan2(p.dy, p.dx) });
    return plan;
  })();

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

  // Hopkins from The Alameda to Sutter: rated Failed in the MTC pavement data, so it is now a preserve
  const PRESERVE = (() => {
    const at = M.nodes.find((n) => n.roads.some((r) => r.name === 'THE ALAMEDA') && n.roads.some((r) => r.name === 'HOPKINS ST'));
    if (!at) return null;
    const s0 = M.pathProject(hopkins, at.x, at.y).s, s1 = hopkins.len;
    if (s1 - s0 < 400) return null;
    for (const r of M.roads) {
      if (r.name !== 'HOPKINS ST') continue;
      const mid = M.pointAt(r, r.len / 2), pr = M.pathProject(hopkins, mid.x, mid.y);
      if (pr.d < 5 && pr.s > s0 && pr.s < s1) r.preserve = true;
    }
    return { s0, s1 };
  })();

  // The Hopkins Corridor Project, Sacramento to The Alameda: repaved, its curbside parking removed, and
  // Class IV cycletracks (green, behind a row of flex posts) on both sides. Before the intermission it is
  // the failed street with parked cars; the intermission plays the project out (City.updateCinema).
  const PROJECT = (() => {
    const s1 = PRESERVE ? PRESERVE.s0 : Math.min(hopkins.len, 2300);
    for (const r of M.roads) {
      if (r.name !== 'HOPKINS ST' || r.preserve) continue;
      const mid = M.pointAt(r, r.len / 2), pr = M.pathProject(hopkins, mid.x, mid.y);
      if (pr.d < 5 && pr.s < s1) r.project = true;
    }
    // stretches of street between intersections
    const junctions = M.nodes.filter((n) => n.junction)
      .map((n) => ({ pr: M.pathProject(hopkins, n.x, n.y), r: n.hw + 4 }))
      .filter((j) => j.pr.d < 5).map((j) => ({ s: j.pr.s, r: j.r })).sort((a, b) => a.s - b.s);
    const runs = [];
    let a = 0;
    for (const j of junctions) {
      if (a >= s1) break;
      if (j.s - j.r > a + 10) runs.push([a, Math.min(s1, j.s - j.r)]);
      a = Math.max(a, j.s + j.r);
    }
    if (s1 - a > 10) runs.push([a, s1]);
    const rng = G.mulberry32(1300);
    const at = (s, lat) => { const p = M.pathPoint(hopkins, s); return { x: p.x - p.dy * lat, y: p.y + p.dx * lat, p }; };
    const COLORS = ['#c0392b', '#2c3e50', '#7f8c8d', '#ecf0f1', '#16a085', '#34495e', '#d35400', '#8e44ad', '#bdc3c7', '#f1c40f'];
    const parked = [], posts = [];
    for (const [sa, sb] of runs) {
      for (let s = sa + 30; s < sb - 25; s += 54) {
        [-1, 1].forEach((side) => {
          if (rng() > 0.85) return;
          const q = at(s + (rng() - 0.5) * 6, side * (HOP_HW - 15));
          const a = Math.atan2(q.p.dx, -q.p.dy) + (side < 0 ? Math.PI : 0); // parked with the traffic
          const c = Math.cos(a), sn = Math.sin(a);
          const poly = [[-13, -23], [13, -23], [13, 23], [-13, 23]].map(([lx, ly]) => [q.x + lx * c - ly * sn, q.y + lx * sn + ly * c]);
          parked.push({ s, x: q.x, y: q.y, a, color: COLORS[Math.floor(rng() * COLORS.length)], poly });
        });
      }
      for (let s = sa + 14; s < sb - 10; s += 34) {
        [-1, 1].forEach((side) => {
          if (side === gioiaSide && Math.abs(s - gioiaS) < 60) return; // the gap at the last space
          const q = at(s, side * (HOP_HW - 22));
          posts.push({ s, x0: q.x, y0: q.y });
        });
      }
    }
    return { s1, runs, parked, posts, track: HOP_HW - 10 };
  })();

  // potholes
  const potholes = [];
  const extraSigns = [];
  (function genPotholes() {
    const rng = G.mulberry32(4242);
    const add = (x, y, r, extra) => potholes.push(Object.assign({ x, y, r, shape: G.makePotholeShape(r, rng) }, extra || {}));
    const nearSpot = (x, y) => SPOT_PLAN.some((sp) => G.dist(x, y, sp.x, sp.y) < 130);
    // Density follows the real Pavement Condition Index: failed blocks are pitted every
    // car length or so, excellent ones are nearly clean. Unrated roads count as PCI 60.
    // The cross streets around Gioia are where you hunt for a space: they get a light dusting
    // whatever their rating, so the heist stays about parking. Hopkins itself is handled below.
    const parkStretch = [];
    for (let s = 0; s <= 1300; s += 100) parkStretch.push(M.pathPoint(hopkins, s));
    const nearPark = (r) => [0.25, 0.5, 0.75].some((f) => { const p = M.pointAt(r, r.len * f); return parkStretch.some((q) => G.dist(p.x, p.y, q.x, q.y) < 450); });
    for (const r of M.roads) {
      if (CANYON && r === CANYON.r || r.preserve || r.project) continue;
      const rated = r.pci == null ? 60 : r.pci;
      const pci = nearPark(r) ? Math.max(80, rated) : rated;
      const keep = Math.min(1, Math.pow(Math.max(0, 100 - pci) / 90, 1.5));
      for (let s = 70 + rng() * 60; s < r.len - 70; s += 90 + rng() * 120) {
        if (rng() >= keep) continue;
        const p = M.pointAt(r, s);
        if (M.nodes.some((n) => n.junction && G.dist(n.x, n.y, p.x, p.y) < n.hw + 45)) continue;
        if (G.dist(p.x, p.y, CH.x, CH.y) < 180 || G.dist(p.x, p.y, R.spawn[0], R.spawn[1]) < 260 || nearSpot(p.x, p.y)) continue;
        if (CLOSURES.some((c) => G.dist(c.p.x, c.p.y, p.x, p.y) < 90)) continue;
        const rad = 15 + rng() * 10 + (pci < 25 ? 5 : 0);
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
    // The project stretch at its real rating, until the paver comes through (they carry `s` along Hopkins)
    for (const [sa, sb] of PROJECT.runs) {
      for (let s = sa + 16 + rng() * 14; s < sb - 16; s += 22 + rng() * 26) {
        const p = M.pathPoint(hopkins, s);
        const n = M.nearest(p.x, p.y, 'HOPKINS ST');
        const pci = n && n.road.pci != null ? n.road.pci : 60;
        if (rng() >= Math.min(1, Math.pow((100 - pci) / 90, 1.5))) continue;
        const rad = 13 + rng() * 8;
        const [nx, ny] = normal(p);
        const off = (rng() * 2 - 1) * (HOP_HW - rad - 18);
        add(p.x + nx * off, p.y + ny * off, rad, { project: true, s });
      }
    }
    // Hopkins Pothole Preserve: rows of craters, wall to wall except for one gap that weaves
    // left, center, right, center… so a careful driver can thread it (or take the sidewalk)
    if (PRESERVE) {
      const GAP = [0, 1, 2, 1];
      let k = 0;
      for (let s = PRESERVE.s0 + 80; s < PRESERVE.s1 - 80; s += 72, k++) {
        const p = M.pathPoint(hopkins, s);
        if (M.nodes.some((n) => n.junction && G.dist(n.x, n.y, p.x, p.y) < n.hw + 30)) continue;
        const [nx, ny] = normal(p);
        [-32, 0, 32].forEach((lat, i) => {
          if (i === GAP[k % GAP.length]) return;
          const l = lat + (rng() - 0.5) * 8, a = (rng() - 0.5) * 20;
          add(p.x + nx * l + p.dx * a, p.y + ny * l + p.dy * a, 13 + rng() * 4, { preserve: true });
        });
      }
      const ends = [M.pathPoint(hopkins, PRESERVE.s0 + 45), M.pathPoint(hopkins, PRESERVE.s1 - 90)];
      ends.forEach((p, i) => add(p.x, p.y, 0.01, {
        sign: i ? ['HOPKINS POTHOLE PRESERVE', 'LEAVE ONLY TIRE TRACKS'] : ['HOPKINS POTHOLE PRESERVE', 'DAMAGING VEHICLES SINCE 2000', 'OUTSIDE PROJECT LIMITS'],
        plaque: true, signOnly: true, side: i ? -1 : 1,
      }));
    }
    // the project sign
    const bb = M.pathPoint(hopkins, Math.max(60, sMonterey - 110));
    add(bb.x, bb.y, 0.01, { sign: ['HOPKINS CORRIDOR PROJECT', 'PARKING SPACES REMOVED: 130', 'THANK YOU FOR YOUR PATIENCE'], style: { bg: '#f26b1d', color: '#fff', border: '#222' }, signOnly: true, side: -gioiaSide });
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

  // ---------- solid scenery (the car can leave the road, but not drive through a house) ----------
  const rectPoly = (x, y, a, w, d) => {
    const c = Math.cos(a), sn = Math.sin(a);
    return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([lx, ly]) => [x + lx * c - ly * sn, y + lx * sn + ly * c]);
  };
  M.chunks.forEach((list) => list.forEach((it) => {
    if (it.kind === 'house') it.poly = rectPoly(it.x, it.y, it.a, it.big ? it.w * 1.3 : it.w, it.big ? it.h * 1.2 : it.h);
    else if (it.kind === 'store') it.poly = rectPoly(it.x, it.y, it.a, it.hero || it.big ? 70 : 46, it.hero || it.big ? 48 : 38);
  }));
  const BHS_BUILDING = (() => {
    const bz = M.zones.bhs, [bcx, bcy] = M.zoneCenter(bz);
    const bw = Math.abs(bz[1][0] - bz[0][0]), bh = Math.abs(bz[3][1] - bz[0][1]);
    return rectPoly(bcx, bcy - bh * 0.28, 0, bw * 0.84, bh * 0.36);
  })();
  const TRACK_MAX = 3000;
  const QUIPS_LAWN = ['TURFED!', 'LAWN: REIMAGINED', 'NATIVE GRASSES: GONE', 'AERATION SERVICES', 'SOD OFF!', 'THAT WAS DROUGHT-TOLERANT'];

  // ---------- scene ----------
  const City = {};
  G.scenes.city = City;
  // world geometry the 3D renderer (js/fp3d.js) builds its 3D city from
  City.world = { potholes, extraSigns, closures: CLOSURES, canyon: CANYON, preserve: PRESERVE, project: PROJECT, tent: TENT, cityHall: CH, rubble, rubbleCenter: RUBBLE_C };

  City.enter = function (opts = {}) {
    this.phase = opts.phase || 'drive1';
    this.t = 0;
    this.cinema = null;
    if (this.phase === 'drive1' && G.fpView) G.fpView.ready(); // start loading 3D for the Hopkins intermission
    this.fx = new G.Particles();
    this.floaters = new G.Floaters();
    this.route = null;
    this.routeT = 0;
    this.parkSeq = -1;
    this.pilotState = null;
    this.lastLand = null;
    this.chEntered = false;
    this.tracks = [];   // tire ruts in the grass: [x0, y0, x1, y1] per wheel, newest last
    this.trackCount = 0; // total ever laid, so renderers can tell what's new
    this.lastRut = null;
    this.sodT = 0;
    this.cones = clutter.cones.map((c) => ({ x: c.x0, y: c.y0, vx: 0, vy: 0, rot: 0, vr: 0, down: false, minStars: c.minStars, scale: 0 }));
    this.inspectors = clutter.inspectors.map((p) => Object.assign({}, p, { cd: 0, scale: 0 }));
    this.cyclists = CYCLIST_DEFS.map((d) => {
      const pr = M.pathProject(d.path, d.at[0], d.at[1]);
      return Object.assign({}, d, { s: pr ? pr.s : d.path.len / 2, dir: d.k % 2 ? 1 : -1, t: d.k, wobble: 0, cd: 0, bellCd: 0, jersey: JERSEYS[d.k % JERSEYS.length] });
    });
    const rng = G.mulberry32(77);
    this.clowns = Array.from({ length: 7 }, (_, k) => ({ x: TENT.x + (rng() - 0.5) * 160, y: TENT.y + (rng() - 0.5) * 200, tx: 0, ty: 0, wait: rng() * 2, t: k, cd: 0, color: G.pick(['#ff5ea8', '#5bc0eb', '#9bc53d', '#fde74c', '#c77dff'], rng) }));
    if (!G.stats.spotTypes) G.stats.spotTypes = G.shuffle(['corral', 'dining', 'island', 'loading']).slice(0, 3);
    this.spots = SPOT_PLAN.map((p, k) => Object.assign({}, p, { type: k < 3 ? G.stats.spotTypes[k] : 'phantom', w: 84, h: 34, state: 'hidden', pop: 0 }));
    this.spots.forEach((s) => {
      const c = Math.cos(s.a), sn = Math.sin(s.a);
      const hw = s.w / 2, hh = s.h / 2;
      s.poly = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([lx, ly]) => [s.x + lx * c - ly * sn, s.y + lx * sn + ly * c]);
    });
    this.parked = PROJECT.parked.map((p) => Object.assign({}, p, { gone: false, goneAt: 0 }));
    this.posts = PROJECT.posts.map((p) => ({ s: p.s, x: p.x0, y: p.y0, vx: 0, vy: 0, rot: 0, vr: 0, down: false, scale: 0 }));
    this.setProject(this.phase !== 'drive1');
    G.hud.reset();
    G.hud.setTicker(RADIO);
    G.audio.setMusic('drive');

    if (this.phase === 'drive1') {
      const p = M.pathPoint(shattuck, 90);
      this.car = new G.Car(p.x - p.dy * 26, p.y + p.dx * 26, Math.atan2(p.dx, -p.dy)); // right-hand lane
      G.hud.banner('MISSION START', 'POTHOLE PARADISE — DRIVE TO HOPKINS', { sting: 'start', dur: 3 });
      G.hud.setObjective('PARK ON HOPKINS', 'Drive to Hopkins & Monterey. Follow the yellow arrow & minimap route. Mind the craters.');
      G.hud.toast('ARROWS / WASD drive · SPACE reset to road · SHIFT handbrake · M map · P pause', { dur: 6, color: '#9be7ff' });
    } else if (this.phase === 'hopkins') {
      const p = M.pathPoint(hopkins, sMonterey + 70);
      this.car = new G.Car(p.x, p.y, Math.atan2(p.dx, -p.dy));
      this.startHopkins(true);
    } else if (this.phase === 'toCityHall') {
      const s = this.spots[3];
      const p = M.pathPoint(hopkins, s.s);
      this.car = new G.Car(p.x, p.y, Math.atan2(p.dx, -p.dy));
      this.spots.forEach((sp) => { sp.state = 'done'; sp.pop = 1; });
      this.startCityHall(true);
    }
    this.car.onLand = (car) => this.onLand(car);
    if (opts.corridor) this.startCinema();
    this.camX = this.car.x;
    this.camY = this.car.y;
  };

  City.startHopkins = function (fromCheckpoint) {
    this.phase = 'hopkins';
    if (!fromCheckpoint) G.hud.banner('MISSION PASSED', 'YOU REACHED HOPKINS. SO DID THE PAVER.', { sting: 'passed', dur: 2.6, color: '#7CFC00' });
    G.game.setCheckpoint('city', { phase: 'hopkins' });
    G.hud.banner('MISSION START', 'THE HOPKINS PARKING HEIST', { sting: 'start', dur: 2.8 });
    G.hud.setObjective('FIND ONE LEGAL PARKING SPACE. BUY ONE SLICE AT GIOIA.', 'Hopkins has no parking now. Follow the P marker to the side streets.');
    G.formCommittee('Hopkins Parking Task Force');
    this.errand = 120;
    this.spotIdx = 0;
    this.nextSpotIn = 0;
    this.spots.forEach((s) => { s.state = 'hidden'; s.pop = 0; });
    this.spots[0].state = 'avail';
  };

  // ---------- the Hopkins Corridor Project ----------
  // paveS / trackS: how far along Hopkins the repaving and the cycletracks have got (-1 none, Infinity done)
  City.setProject = function (done) {
    this.paveS = this.trackS = done ? Infinity : -1;
    this.parked.forEach((p) => { p.gone = done; });
    this.posts.forEach((p) => { p.scale = done ? 1 : 0; });
    this.refreshPotholes();
  };
  City.refreshPotholes = function () {
    this.livePotholes = potholes.filter((p) => !(p.project && p.s < this.paveS));
  };
  // changes whenever the painted ground does (the 3D view repaints its ground texture on a change)
  City.groundKey = function () {
    const q = (v) => (v === Infinity ? 'done' : Math.floor(v / 160));
    return q(this.paveS) + '/' + q(this.trackS);
  };

  // ---------- intermission: the project, played out over the Gioia block ----------
  // One crane shot: the paver sweeps down Hopkins filling the craters, the parked cars vanish while a
  // counter runs 130 → 0, then the green cycletracks paint themselves in and the flex posts pop up.
  // Drawn by the 3D renderer when it can load (whatever the view setting), else as a top-down pan.
  const CINE = { pave: [2.2, 4.8], tow: [5.3, 8.0], track: [8.6, 11.0], dur: 14.4 };
  const SPACES = 130;
  City.startCinema = function () {
    this.cinema = { t: 0, spaces: SPACES };
    this.car.locked = true;
    // tow order: nearest the camera's subject first
    const g = M.pathPoint(hopkins, gioiaS);
    const order = this.parked.slice().sort((p, q) => G.dist(p.x, p.y, g.x, g.y) - G.dist(q.x, q.y, g.x, g.y));
    order.forEach((p, k) => { p.goneAt = G.lerp(CINE.tow[0], CINE.tow[1] - 0.3, Math.pow(k / Math.max(1, order.length - 1), 0.8)); });
    G.hud.reset();
    G.audio.play('whoosh');
    G.audio.setDuck(0.55);
  };
  City.updateCinema = function (dt) {
    const c = this.cinema;
    const before = c.t;
    c.t += dt;
    const t = c.t;
    const beat = (at) => before < at && t >= at;
    const sweep = ([t0, t1]) => (t < t0 ? -1 : t >= t1 ? Infinity : G.lerp(0, PROJECT.s1, (t - t0) / (t1 - t0)));
    // phase 1: repave
    const paveS = sweep(CINE.pave);
    if (paveS !== this.paveS) {
      let k = 0;
      for (const p of potholes) {
        if (!p.project || p.s < this.paveS || p.s >= paveS) continue;
        this.fx.burst(p.x, p.y, 8, { type: 'poof', color: ['#55555c', '#6b6b72', '#ddd'], speed: 60, life: 0.7, size: 8 });
        if (k++ % 3 === 0) G.audio.play('poof');
      }
      this.paveS = paveS;
      this.refreshPotholes();
    }
    // phase 2: the parking goes
    let left = 0;
    for (const p of this.parked) {
      if (!p.gone && t >= p.goneAt && t >= CINE.tow[0]) {
        p.gone = true;
        this.fx.burst(p.x, p.y, 10, { type: 'poof', color: ['#fff', '#eee', '#ddd'], speed: 80, life: 0.8, size: 10 });
      }
      if (!p.gone) left++;
    }
    c.spaces = Math.round((SPACES * left) / Math.max(1, this.parked.length));
    if (beat(CINE.tow[0])) G.audio.play('fail');
    // phase 3: cycletracks
    this.trackS = sweep(CINE.track);
    if (beat(CINE.track[1])) G.audio.play('score');
    if (beat(CINE.pave[0]) || beat(CINE.track[0])) G.audio.play('whoosh');
    if (beat(CINE.track[1] + 0.4)) G.audio.play('stamp');
    if (t >= CINE.dur || (t > 0.6 && (G.input.interact() || G.input.resetCar()))) {
      this.cinema = null;
      this.setProject(true);
      this.car.locked = false;
      G.audio.setDuck(1);
      this.startHopkins(false);
    }
  };
  // camera at (x, h, y) looking at (lx, lh, ly), in map px: high over the Gioia block, looking down Hopkins
  City.cinemaCam = function () {
    const e = G.smoothstep(this.cinema.t / CINE.dur);
    const p = M.pathPoint(hopkins, gioiaS + G.lerp(540, 400, e));
    const q = M.pathPoint(hopkins, gioiaS - G.lerp(160, 100, e));
    const side = -gioiaSide * G.lerp(40, 25, e);
    return { x: p.x - p.dy * side, y: p.y + p.dx * side, h: G.lerp(240, 175, e), lx: q.x, ly: q.y, lh: 0 };
  };

  // letterbox, title cards, skip hint; expects an identity (×dpr) transform
  City.drawCinema = function (ctx, vw, vh) {
    const c = this.cinema, t = c.t;
    const bar = Math.round(vh * 0.11 * G.smoothstep(Math.min(1, t / 0.5)));
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, vw, bar);
    ctx.fillRect(0, vh - bar, vw, bar);
    const fade = (a, b) => G.clamp(Math.min((t - a) / 0.4, (b - t) / 0.4), 0, 1);
    const cards = [
      [0.4, CINE.pave[0] - 0.1, { small: 'HOPKINS STREET, TODAY', big: 'PAVEMENT: POOR', sub: 'PARKING SPACES: ' + SPACES, bg: '#5b3a1e', fg: '#f3dfa2' }],
      [CINE.pave[0], CINE.tow[0] - 0.2, { small: 'HOPKINS CORRIDOR PROJECT · PHASE 1', big: 'REPAVING', sub: 'GOODBYE, POTHOLES', bg: '#f26b1d', fg: '#fff' }],
      [CINE.tow[0], CINE.track[0] - 0.2, { small: 'PHASE 2: PARKING REMOVAL', big: 'PARKING SPACES: ' + c.spaces, sub: 'NOTICE WAS POSTED (IN 2019)', bg: '#f26b1d', fg: '#fff' }],
      [CINE.track[0], CINE.track[1] + 0.3, { small: 'PHASE 3', big: 'CLASS IV CYCLETRACKS', sub: 'SEPARATED · PROTECTED · VERY GREEN', bg: '#2e8b57', fg: '#fff' }],
      [CINE.track[1] + 0.4, CINE.dur - 0.2, { small: 'WELCOME TO THE NEW', big: 'HOPKINS STREET', sub: 'SMOOTH ROADS · 0 PARKING SPACES', bg: '#ffd23f', fg: '#222' }],
    ];
    for (const [a, b, o] of cards) { const k = fade(a, b); if (k > 0) this.drawCard(ctx, vw, vh, k, o); }
    ctx.font = G.font(12);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('E TO SKIP', 16, vh - bar / 2);
  };
  City.drawCard = function (ctx, vw, vh, alpha, o) {
    const maxW = Math.min(vw - 32, 620);
    let big = 44;
    ctx.font = G.font(big);
    while (big > 16 && ctx.measureText(o.big).width > maxW - 40) { big -= 2; ctx.font = G.font(big); }
    const w = Math.min(maxW, ctx.measureText(o.big).width + 60);
    const h = big + 78, x = vw / 2 - w / 2, y = Math.max(vh * 0.12 + 8, vh * 0.27 - h / 2) - (1 - alpha) * 12;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    G.rr(ctx, x + 5, y + 6, w, h, 12);
    ctx.fill();
    ctx.fillStyle = o.bg;
    G.rr(ctx, x, y, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = o.fg;
    ctx.lineWidth = 3;
    G.rr(ctx, x + 6, y + 6, w - 12, h - 12, 8);
    ctx.stroke();
    ctx.fillStyle = o.fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = G.font(14);
    ctx.fillText(o.small, vw / 2, y + 24);
    ctx.font = G.font(big);
    ctx.fillText(o.big, vw / 2, y + 30 + big / 2 + 4);
    ctx.font = G.font(15);
    ctx.fillText(o.sub, vw / 2, y + h - 22);
    ctx.globalAlpha = 1;
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
      return s ? { x: s.x, y: s.y } : null;
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

  // ---------- autopilot ----------
  // Drives the same route the yellow arrow shows, with the same inputs a player has: pure pursuit
  // along the route, a nudge around craters, braking for corners, cyclists and the destination.
  const IDLE = { up: false, back: false, left: false, right: false, hand: false };
  City.pilot = function (dt) {
    const car = this.car, P = this.pilotState || (this.pilotState = { stuck: 0, rev: 0, file: false });
    P.file = false;
    if (car.locked || this.cinema || car.airborne) return IDLE;
    const tg = this.target();
    if (!tg || !this.route || this.route.length < 2 || (this.phase === 'hopkins' && this.parkSeq >= 0)) return Object.assign({}, IDLE, { back: car.fwd > 5 });
    const route = [[car.x, car.y], ...this.route.slice(1)];
    let left = 0;
    for (let k = 0; k < route.length - 1; k++) left += G.dist(route[k][0], route[k][1], route[k + 1][0], route[k + 1][1]);

    const spot = this.phase === 'hopkins' && this.spots[this.spotIdx];
    const parking = spot && spot.type === 'phantom' && spot.state === 'avail';
    const cityHall = this.phase === 'toCityHall';
    // arrived: hold still (and, at the tent, file the appeal)
    if (cityHall && G.dist(car.x, car.y, CH.x, CH.y) < CH.r * 0.6) {
      if (car.speed < 30) P.file = true;
      return Object.assign({}, IDLE, { back: car.fwd > 5 });
    }

    // speed: cruise, slow for the bend ahead, stop at the end of the route if there is something to stop for
    const v = Math.max(40, car.fwd);
    const look = Math.min(left, 40 + v * 0.4);
    const ahead = (d) => M.pathAhead(route, Math.min(left, d));
    const dirAt = (d) => { const a = ahead(d), b = ahead(d + 30); return Math.atan2(b[0] - a[0], -(b[1] - a[1])); };
    const bend = Math.max(Math.abs(G.wrapAngle(dirAt(60) - car.a)), Math.abs(G.wrapAngle(dirAt(150) - car.a)) * 0.8);
    let speed = G.lerp(230, 70, G.clamp(bend / 1.3, 0, 1));
    if (parking || cityHall) speed = Math.min(speed, Math.sqrt(2 * 380 * Math.max(0, left - (parking ? 4 : 40))));
    if (parking && left < 40) speed = Math.min(speed, 25);

    // aim point, nudged clear of craters near the line
    let [tx, ty] = ahead(look);
    if (!parking || left > 120) {
      const [ax, ay] = ahead(look + 30);
      const ux = (ax - tx) / 30, uy = (ay - ty) / 30;
      for (const p of this.livePotholes) {
        if (Math.abs(p.x - car.x) > look + 120 || Math.abs(p.y - car.y) > look + 120) continue;
        const rx = p.x - car.x, ry = p.y - car.y;
        const along = rx * Math.sin(car.a) - ry * Math.cos(car.a);
        if (along < 10 || along > look + 90) continue;
        const lat = (p.x - tx) * -uy + (p.y - ty) * ux;
        if (Math.abs(lat) > p.r + 22) continue;
        const shove = (lat > 0 ? -1 : 1) * (p.r + 24 - Math.abs(lat));
        tx += -uy * shove; ty += ux * shove;
        break;
      }
    }

    // let cyclists in our path get clear
    for (const c of this.cyclists) {
      const p = this.cyclistPos(c);
      const rx = p.x - car.x, ry = p.y - car.y;
      const along = rx * Math.sin(car.a) - ry * Math.cos(car.a), lat = rx * Math.cos(car.a) + ry * Math.sin(car.a);
      if (along > 0 && along < 160 && Math.abs(lat) < 30) speed = Math.min(speed, Math.max(0, along - 40) * 1.2);
    }

    const want = Math.atan2(tx - car.x, -(ty - car.y));
    let err = G.wrapAngle(want - car.a) - car.spin * 0.08;

    // wedged against something: back out, steering the other way, and give up with a reset if that fails
    const pushing = speed > 30;
    P.stuck = pushing && car.speed < 20 && P.rev <= 0 ? P.stuck + dt : Math.max(0, P.stuck - dt * 2);
    if (P.stuck > 1.2) { P.rev = 0.9; P.stuck = 0; P.revs = (P.revs || 0) + 1; }
    if (P.revs > 3) { P.revs = 0; this.resetCarToRoad(); return IDLE; }
    if (car.speed > 80) P.revs = 0;
    if (P.rev > 0) {
      P.rev -= dt;
      return { up: false, back: true, left: err > 0, right: err < 0, hand: false };
    }
    // a hairpin: brake and swing round rather than orbit the waypoint
    if (Math.abs(err) > 1.4 && car.fwd > 60) speed = 0;
    return {
      up: car.fwd < speed - 8,
      back: car.fwd > speed + 25,
      left: err < -0.05,
      right: err > 0.05,
      hand: false,
    };
  };

  City.update = function (dt) {
    this.t += dt;
    const car = this.car;
    const inp = G.input;
    if (inp.resetCar() && !car.locked) this.resetCarToRoad();
    if (inp.was('KeyO')) {
      G.settings.autopilot = !G.settings.autopilot;
      G.saveSettings();
      G.hud.toast(G.settings.autopilot ? 'AUTOPILOT ENGAGED. IT KNOWS A GUY AT THE PERMIT OFFICE.' : 'AUTOPILOT OFF. YOUR WHEEL, YOUR CRATERS.', { color: '#9be7ff', dur: 2.5 });
    }
    const pilot = G.settings.autopilot ? this.pilot(dt) : null;
    car.update(dt, pilot || inp);

    const hit = car.checkPotholes(this.livePotholes);
    if (hit) {
      G.stats.potholes++;
      this.floaters.add(hit.x, hit.y - 20, G.pick(QUIPS_POTHOLE), '#ffd23f');
      this.fx.burst(hit.x, hit.y, 14, { color: ['#3a332c', '#7b6d5e', '#c9b79c'], speed: 160, life: 0.7, size: 5 });
      G.hud.addShake(4);
    }

    // curbs, sidewalks and lawns are fair game; houses, storefronts, trees, the tent, the barricades
    // and anything a parking space turned into are not
    if (car.z < 25) {
      const hits = [];
      M.chunkItems(car.x - 80, car.y - 80, car.x + 80, car.y + 80, (it) => {
        if (Math.abs(it.x - car.x) > 70 || Math.abs(it.y - car.y) > 70) return;
        const h = it.poly ? G.circlePoly(car.x, car.y, car.r, it.poly) : G.dist(it.x, it.y, car.x, car.y) < car.r + 4 ? { nx: (car.x - it.x) / (G.dist(it.x, it.y, car.x, car.y) || 1), ny: (car.y - it.y) / (G.dist(it.x, it.y, car.x, car.y) || 1), depth: car.r + 4 - G.dist(it.x, it.y, car.x, car.y) } : null;
        if (h) hits.push(h);
      });
      const bh = G.circlePoly(car.x, car.y, car.r, BHS_BUILDING);
      if (bh) hits.push(bh);
      const td = G.dist(car.x, car.y, TENT.x, TENT.y);
      if (td < TENT.r + car.r) hits.push({ nx: (car.x - TENT.x) / (td || 1), ny: (car.y - TENT.y) / (td || 1), depth: TENT.r + car.r - td });
      for (const c of CLOSURES) {
        if (Math.abs(c.p.x - car.x) > 120 || Math.abs(c.p.y - car.y) > 120) continue;
        const h = G.circlePoly(car.x, car.y, car.r, c.poly);
        if (h) hits.push(h);
      }
      for (const p of this.parked) {
        if (p.gone || Math.abs(p.x - car.x) > 60 || Math.abs(p.y - car.y) > 60) continue;
        const h = G.circlePoly(car.x, car.y, car.r, p.poly);
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
    this.updateOffRoad(dt);

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
    this.updatePosts(dt);
    this.updateCyclists(dt);
    this.updateClowns(dt);

    if (PRESERVE) {
      const n = M.nearest(car.x, car.y);
      const inPreserve = !!(n && n.road.preserve && n.e < 0);
      if (inPreserve && !this.inPreserve) {
        G.hud.toast('WELCOME TO THE HOPKINS POTHOLE PRESERVE. PLEASE STAY ON MARKED CRATERS.', { color: '#f3dfa2', dur: 4 });
        if (!G.stats.preserveDocents) { G.stats.preserveDocents = true; G.formCommittee('Pothole Preserve Docent Council'); }
      }
      this.inPreserve = inPreserve;
    }

    if (this.cinema) {
      this.updateCinema(dt);
    } else if (this.phase === 'drive1') {
      const n = M.nearest(car.x, car.y);
      if (n && n.road.name === 'HOPKINS ST' && n.e < 0) this.startCinema();
    } else if (this.phase === 'hopkins') {
      this.updateHopkins(dt);
    } else if (this.phase === 'toCityHall') {
      const inZone = G.dist(car.x, car.y, CH.x, CH.y) < CH.r;
      if (inZone && !this.chEntered) { this.chEntered = true; G.audio.play('blip'); }
      if (!inZone) this.chEntered = false;
      if (inZone && (inp.interact() || (pilot && this.pilotState.file))) {
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

    const cam = this.cinema && this.cinemaCam();
    const tx = cam ? cam.lx : car.x + car.vx * 0.45, ty = cam ? cam.ly : car.y + car.vy * 0.45;
    const ease = cam ? 1 : Math.min(1, dt * 4); // the intermission's camera is on rails
    this.camX += (tx - this.camX) * ease;
    this.camY += (ty - this.camY) * ease;
    if (this.lastLand) { this.lastLand.t -= dt; if (this.lastLand.t <= 0) this.lastLand = null; }
    this.fx.update(dt);
    this.floaters.update(dt);
  };

  // Off the asphalt: a curb thump, a sidewalk rattle, and on grass, drag, flying sod and ruts.
  City.updateOffRoad = function (dt) {
    const car = this.car;
    const n = M.nearest(car.x, car.y);
    const e = n ? n.d - n.road.hw : 0;
    const surface = e <= 0 ? 'road' : e <= SW ? 'sidewalk' : 'grass';
    if (surface !== 'road' && this.surface === 'road' && car.speed > 60 && !car.airborne) {
      G.audio.play('bonk');
      car.wob = Math.max(car.wob, 0.5);
      car.wobT = 0;
    }
    this.surface = surface;
    if (surface !== 'grass' || car.airborne) { this.lastRut = null; return; }
    car.vx *= Math.exp(-1.1 * dt);
    car.vy *= Math.exp(-1.1 * dt);
    if (car.speed < 8) return;
    // ruts from both rear wheels
    const fx = Math.sin(car.a), fy = -Math.cos(car.a), rx = Math.cos(car.a), ry = Math.sin(car.a);
    const wheels = [-11, 11].map((o) => [car.x - fx * 14 + rx * o, car.y - fy * 14 + ry * o]);
    if (!this.lastRut) { this.lastRut = wheels; return; }
    if (G.dist(wheels[0][0], wheels[0][1], this.lastRut[0][0], this.lastRut[0][1]) < 6) return;
    wheels.forEach((w, i) => {
      this.tracks.push([this.lastRut[i][0], this.lastRut[i][1], w[0], w[1]]);
      this.trackCount++;
    });
    if (this.tracks.length > TRACK_MAX) this.tracks.splice(0, this.tracks.length - TRACK_MAX);
    this.lastRut = wheels;
    this.sodT -= dt;
    if (car.speed > 70 && this.sodT <= 0) {
      this.sodT = 0.07;
      const [wx, wy] = wheels[Math.random() < 0.5 ? 0 : 1];
      this.fx.burst(wx, wy, 3, { color: ['#4c8a3c', '#6b4a2f', '#3a7034', '#7b5a3a'], speed: 90, life: 0.6, size: 4, vz: 120 });
    }
    this.turfed = (this.turfed || 0) + car.speed * dt;
    if (this.turfed > 600) {
      this.turfed = 0;
      this.floaters.add(car.x, car.y - 30, G.pick(QUIPS_LAWN), '#9bdc6a', 1.4, 15);
      if (!G.stats.lawnCommittee) { G.stats.lawnCommittee = true; G.formCommittee('Lawn Restoration Working Group'); }
    }
  };

  City.drawTracks = function (ctx, v) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(92,64,38,0.75)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (const [x0, y0, x1, y1] of this.tracks) {
      if (x1 < v.x0 || x1 > v.x1 || y1 < v.y0 || y1 > v.y1) continue;
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
    }
    ctx.stroke();
    ctx.restore();
  };

  // Space: snap onto the nearest centerline, facing whichever way along the road is closer to the current heading.
  City.resetCarToRoad = function () {
    const car = this.car;
    const n = M.nearest(car.x, car.y);
    if (!n) return;
    const p = M.pointAt(n.road, n.along);
    let a = Math.atan2(p.dx, -p.dy);
    if (Math.abs(G.wrapAngle(a - car.a)) > Math.PI / 2) a = G.wrapAngle(a + Math.PI);
    this.fx.burst(car.x, car.y, 10, { type: 'poof', color: ['#fff', '#ddd'], speed: 60, life: 0.5, size: 7 });
    car.resetTo(p.x, p.y, a);
    G.audio.play('whoosh');
    this.floaters.add(p.x, p.y - 30, 'RE-CENTERED', '#9be7ff', 1, 13);
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

  // Flex posts along the cycletracks: they pop up as the green paint reaches them, and fold over when hit
  City.updatePosts = function (dt) {
    const car = this.car;
    for (const p of this.posts) {
      if (p.s < this.trackS) p.scale = Math.min(1, p.scale + dt * 4);
      if (p.scale < 0.5) continue;
      if (p.vx || p.vy) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        const k = Math.exp(-3 * dt);
        p.vx *= k; p.vy *= k; p.vr *= k;
        if (Math.abs(p.vx) + Math.abs(p.vy) < 2) { p.vx = 0; p.vy = 0; }
      }
      if (!p.down && car.z < 20 && Math.abs(p.x - car.x) < 22 && Math.abs(p.y - car.y) < 22 && G.dist(p.x, p.y, car.x, car.y) < car.r + 4) {
        p.down = true;
        p.vx = car.vx * 0.6; p.vy = car.vy * 0.6;
        p.vr = (Math.random() - 0.5) * 10;
        car.vx *= 0.96; car.vy *= 0.96;
        G.audio.play('cone');
        this.floaters.add(p.x, p.y - 18, G.pick(['FLEX POST: FLEXED', 'BIKEWAY BREACH!', 'NOTED.']), '#7CFC00', 1.2, 13);
        if (!G.stats.postsHit) {
          G.stats.postsHit = true;
          G.hud.toast('A CLASS IV SEPARATED BIKEWAY IS NOT A SUGGESTION.', { color: '#7CFC00', dur: 3.5 });
          G.formCommittee('Cycletrack Incursion Review Panel');
        }
      }
    }
  };

  City.cyclistPos = function (c) {
    const p = M.pathPoint(c.path, c.s);
    // on the finished Hopkins they keep to the cycletrack on their right
    const inTrack = c.name === 'HOPKINS ST' && this.trackS === Infinity;
    const off = inTrack ? c.dir * PROJECT.track + Math.sin(c.t * 0.9) * 2 : c.off + Math.sin(c.t * 0.9) * c.amp;
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
      // it was painted in the cycletrack all along: now it's a bike-only pizza parklet, and the car is in the way
      s.state = 'done';
      s.pop = 0;
      car.locked = false;
      G.hud.banner('PARKING SPACE NOT FOUND', 'IT IS NOW A BIKE-ONLY PIZZA PARKLET. SLICES FOR CYCLISTS.', { sting: 'fail', dur: 3.4, color: '#ff5a5a' });
      this.fx.burst(s.x, s.y, 30, { type: 'poof', color: ['#fff', '#eee', '#ddd'], speed: 90, life: 1, size: 10 });
      G.audio.play('poof');
      G.stats.parkingYears++;
    }
    if (ev(2.0)) {
      G.addStar('PARKING SPACE REASSIGNED TO PIZZA');
      G.formCommittee('Bike-Only Pizza Parklet Activation Committee');
    }
    if (ev(2.8)) this.floaters.add(s.x, s.y - 30, 'ONE SLICE, PLEASE! (I CAME BY BIKE)', '#7CFC00', 2, 14);
    if (ev(4.6)) G.hud.banner('ITEM ACQUIRED', 'PARKING APPEAL FORM 27-B (14 PAGES, DOUBLE-SIDED)', { sting: 'start', dur: 2.6, color: '#9be7ff' });
    if (ev(7.2)) {
      this.parkSeq = -1;
      this.spotIdx = 99;
      G.hud.toast('PIZZA STATUS: STILL UNPURCHASED. THE SMELL WAS NICE, THOUGH.', { color: '#ffd23f' });
      this.startCityHall(false);
    }
  };

  // ---------- rendering ----------
  City.render = function (ctx, vw, vh, dpr) {
    if (G.fpView && (this.cinema ? G.fpView.ready() : G.fpView.active())) { G.fpView.render(this, ctx, vw, vh, dpr); return; }
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
    this.drawTracks(ctx, v);
    M.chunkItems(v.x0, v.y0, v.x1, v.y1, (it) => {
      if (it.x < v.x0 - 40 || it.x > v.x1 + 40 || it.y < v.y0 - 40 || it.y > v.y1 + 40) return;
      if (it.kind === 'house') drawHouse(ctx, it);
      else if (it.kind === 'tree') G.drawTree(ctx, it.x, it.y, it.r, it.hue);
      else drawStore(ctx, it, t);
    });
    this.drawLandmarks(ctx, v);
    this.drawHazards(ctx, v);
    this.drawSpots(ctx);
    for (const c of this.cones) {
      if (c.scale <= 0 || c.x < v.x0 || c.x > v.x1 || c.y < v.y0 || c.y > v.y1) continue;
      G.drawCone(ctx, c);
    }
    for (const p of this.parked) if (!p.gone && p.x > v.x0 && p.x < v.x1 && p.y > v.y0 && p.y < v.y1) G.drawNpcCar(ctx, p.x, p.y, p.a, p.color);
    for (const p of this.posts) if (p.scale > 0 && p.x > v.x0 && p.x < v.x1 && p.y > v.y0 && p.y < v.y1) G.drawFlexPost(ctx, p);
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
      G.drawSign(ctx, p.sx, p.sy, p.sign, Object.assign({ size: 11 }, signStyle(p)));
    }

    this.fx.draw(ctx);
    this.car.draw(ctx);
    if (this.route && this.route.length > 1 && this.parkSeq < 0 && !this.cinema) {
      const wp = M.pathAhead(this.route, 130);
      G.hud.drawGuideArrow(ctx, this.car, wp[0], wp[1]);
    }
    this.floaters.draw(ctx);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.cinema) this.drawCinema(ctx, vw, vh);
    else this.drawHud(ctx, vw, vh);
  };

  function signStyle(p) {
    if (p.style) return p.style;
    return p.plaque ? { bg: '#5b3a1e', color: '#f3dfa2', border: '#f3dfa2' } : { bg: '#fffbe6', color: '#222', border: '#222' };
  }
  City.signStyle = signStyle;

  // Canyon, potholes and road closures: everything painted on (or dug into) the asphalt.
  City.drawHazards = function (ctx, v) {
    if (CANYON && CANYON.mid.x > v.x0 - 400 && CANYON.mid.x < v.x1 + 400 && CANYON.mid.y > v.y0 - 400 && CANYON.mid.y < v.y1 + 400) this.drawCanyon(ctx, this.t);
    this.drawProject(ctx);
    for (const p of this.livePotholes || potholes) {
      if (p.x < v.x0 || p.x > v.x1 || p.y < v.y0 || p.y > v.y1) continue;
      G.drawPothole(ctx, p, this.t);
    }
    for (const c of CLOSURES) this.drawClosure(ctx, c, v);
  };

  // Hopkins as far as the paver (fresh asphalt, centerline repainted) and the cycletracks have got
  function strokeAlong(ctx, s0, s1, lat) {
    const n = Math.max(1, Math.ceil((s1 - s0) / 12));
    ctx.beginPath();
    for (let k = 0; k <= n; k++) {
      const p = M.pathPoint(hopkins, s0 + ((s1 - s0) * k) / n);
      const x = p.x - p.dy * lat, y = p.y + p.dx * lat;
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  City.drawProject = function (ctx) {
    if (!(this.paveS >= 0)) return;
    ctx.lineCap = 'butt';
    for (const [sa, sb] of PROJECT.runs) {
      const pe = Math.min(sb, this.paveS);
      if (pe > sa) {
        ctx.strokeStyle = '#38383e';
        ctx.lineWidth = HOP_HW * 2;
        strokeAlong(ctx, sa, pe, 0);
        ctx.strokeStyle = '#f2c230';
        ctx.lineWidth = 2.5;
        [-2.5, 2.5].forEach((lat) => strokeAlong(ctx, sa, pe, lat));
      }
      const te = Math.min(sb, this.trackS);
      if (te <= sa) continue;
      [-1, 1].forEach((side) => {
        ctx.strokeStyle = '#3fa35b';
        ctx.lineWidth = 16;
        strokeAlong(ctx, sa, te, side * PROJECT.track);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        strokeAlong(ctx, sa, te, side * (PROJECT.track - 9));
      });
      // bike stencils, pointing with the traffic on each side
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let s = sa + 40; s < te - 20; s += 150) {
        [-1, 1].forEach((side) => {
          const p = M.pathPoint(hopkins, s);
          ctx.save();
          ctx.translate(p.x - p.dy * side * PROJECT.track, p.y + p.dx * side * PROJECT.track);
          ctx.rotate(Math.atan2(p.dy, p.dx) + (side < 0 ? Math.PI : 0));
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#fff';
          [-5, 5].forEach((x) => { ctx.beginPath(); ctx.arc(x, 0, 3.2, 0, Math.PI * 2); ctx.stroke(); });
          ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(0, -4); ctx.lineTo(5, 0); ctx.stroke();
          ctx.restore();
        });
      }
    }
  };

  // Screen-space HUD, shared by the top-down and 3D views. Expects an identity (×dpr) transform.
  City.drawHud = function (ctx, vw, vh) {
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
    if (G.settings.autopilot && !this.cinema) G.hud.drawAutopilot(ctx, vw, vh, this.t);
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
    } else if (s.type === 'phantom') {
      // the bike-only pizza parklet, in the cycletrack: a deck with planters, bike racks and a slice counter
      ctx.fillStyle = '#b07a45';
      ctx.fillRect(x0, y0, s.w, s.h);
      ctx.strokeStyle = '#8a5a2b';
      ctx.lineWidth = 1;
      for (let k = 6; k < s.w; k += 7) { ctx.beginPath(); ctx.moveTo(x0 + k, y0); ctx.lineTo(x0 + k, y0 + s.h); ctx.stroke(); }
      ctx.fillStyle = '#3f8a3a';
      ctx.fillRect(x0 - 4, y0, 8, s.h);
      ctx.fillRect(x0 + s.w - 4, y0, 8, s.h);
      for (let k = 0; k < 3; k++) G.drawBikeRack(ctx, x0 + 14 + k * 15, 0);
      G.drawPizza(ctx, x0 + s.w - 20, 0, 11, 0, -Math.PI / 2);
      sign(['BIKE-ONLY PIZZA PARKLET', 'SLICES FOR CYCLISTS'], { bg: '#c0392b', color: '#fff', size: 9 });
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

  City.debug = { potholes, CLOSURES, CH, TENT, hopkins, shattuck, SPOT_PLAN, gioia, CANYON, PRESERVE, PROJECT };
})();
