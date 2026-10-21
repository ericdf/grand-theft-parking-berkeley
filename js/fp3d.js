// 3D chase-camera view of the city: the same street grid, scenery and game state as the top-down
// view, rendered from just behind the car with three.js. Loaded on demand by js/fpview.js.
//
// World mapping: map (x, y) in px → three (x, height, y). Heading `a` (0 = north, clockwise)
// becomes rotation.y = -a for anything modeled facing -z.
//
// The asphalt is not modeled: the top-down painter (City.drawZones / drawRoads / drawHazards /
// drawSpots) draws into two ground textures, so lane paint, crosswalks, potholes and the canyon
// look exactly as they do from above. A coarse layer covers the whole map once; a sharp layer
// around the car is repainted as it moves. Buildings, trees, people and props are 3D on top.
import * as THREE from '../vendor/three.module.min.js';

const G = window.G;
const M = G.CityMap;
const W = M.W, H = M.H, SW = M.SW;

const NEAR_SPAN = 1600;  // world px covered by the sharp ground layer
const NEAR_TEX = 2048;
const FAR_SCALE = 0.4;   // texels per world px on the whole-map layer
const FOG = '#cfe6f2';

export function create() {
  const City = G.scenes.city;
  const world = City.world;

  // ---------- renderer ----------
  const canvas = document.createElement('canvas');
  canvas.id = 'game3d';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(canvas, document.getElementById('game'));
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    canvas.remove();
    throw e;
  }
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#8fcbeb');
  scene.fog = new THREE.Fog(FOG, 500, 1900);
  const camera = new THREE.PerspectiveCamera(72, 1, 2, 2600);
  camera.rotation.order = 'YXZ';
  scene.add(camera);
  scene.add(new THREE.HemisphereLight('#eaf6ff', '#55703c', 1.1));
  const sun = new THREE.DirectionalLight('#fff6e0', 1.2);
  sun.position.set(0.45, 1, 0.3);
  scene.add(sun);

  const lambert = (color, o) => new THREE.MeshLambertMaterial(Object.assign({ color }, o || {}));
  const basic = (color, o) => new THREE.MeshBasicMaterial(Object.assign({ color }, o || {}));
  const canvasTex = (c) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    return t;
  };
  // geometry with its base on y = 0
  const boxBase = () => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const place = (obj, x, y, h, a) => { obj.position.set(x, h || 0, y); if (a !== undefined) obj.rotation.y = -a; return obj; };

  // ---------- ground ----------
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(40000, 40000).rotateX(-Math.PI / 2), basic('#6f9d4f'));
  grass.position.set(W / 2, -1.2, H / 2);
  scene.add(grass);

  const allView = { x0: -200, y0: -200, x1: W + 200, y1: H + 200 };
  function paintGround(ctx, v, sharp) {
    ctx.fillStyle = '#7fae5b';
    ctx.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    City.drawZones(ctx, v);
    const vis = M.roads.filter((r) => r.bbox[0] - 90 < v.x1 && r.bbox[2] + 90 > v.x0 && r.bbox[1] - 90 < v.y1 && r.bbox[3] + 90 > v.y0);
    City.drawRoads(ctx, v, vis);
    City.drawLandmarks(ctx, v);
    City.drawHazards(ctx, v);
    if (sharp) City.drawSpots(ctx);
  }

  const farCanvas = document.createElement('canvas');
  farCanvas.width = Math.ceil(W * FAR_SCALE);
  farCanvas.height = Math.ceil(H * FAR_SCALE);
  const farCtx = farCanvas.getContext('2d');
  farCtx.setTransform(FAR_SCALE, 0, 0, FAR_SCALE, 0, 0);
  paintGround(farCtx, allView, false);
  const farMesh = new THREE.Mesh(new THREE.PlaneGeometry(farCanvas.width / FAR_SCALE, farCanvas.height / FAR_SCALE).rotateX(-Math.PI / 2), basic('#fff', { map: canvasTex(farCanvas) }));
  farMesh.position.set(farCanvas.width / FAR_SCALE / 2, -0.6, farCanvas.height / FAR_SCALE / 2);
  scene.add(farMesh);
  // the whole-map layer is repainted only when the Hopkins Corridor Project finishes or is undone
  let farProject = City.groundKey();
  function refreshFar() {
    farCtx.setTransform(FAR_SCALE, 0, 0, FAR_SCALE, 0, 0);
    paintGround(farCtx, allView, false);
    farMesh.material.map.needsUpdate = true;
    farProject = City.groundKey();
  }

  const nearCanvas = document.createElement('canvas');
  nearCanvas.width = nearCanvas.height = NEAR_TEX;
  const nearCtx = nearCanvas.getContext('2d');
  const nearTex = canvasTex(nearCanvas);
  const nearMesh = new THREE.Mesh(new THREE.PlaneGeometry(NEAR_SPAN, NEAR_SPAN).rotateX(-Math.PI / 2), basic('#fff', { map: nearTex }));
  scene.add(nearMesh);
  const near = { x: -1e9, y: -1e9, key: '' };
  const spotKey = () => City.spots.map((s) => s.state).join() + '|' + City.groundKey();
  function refreshNear(cx, cy) {
    const sc = NEAR_TEX / NEAR_SPAN;
    const v = { x0: cx - NEAR_SPAN / 2, y0: cy - NEAR_SPAN / 2, x1: cx + NEAR_SPAN / 2, y1: cy + NEAR_SPAN / 2 };
    nearCtx.setTransform(sc, 0, 0, sc, -v.x0 * sc, -v.y0 * sc);
    paintGround(nearCtx, v, true);
    nearTex.needsUpdate = true;
    nearMesh.position.set(cx, 0, cy);
    near.x = cx; near.y = cy; near.key = spotKey();
  }

  // ---------- text on boards ----------
  function textCanvas(lines, o) {
    o = o || {};
    const fs = (o.size || 11) * 4;
    const c = document.createElement('canvas');
    const x = c.getContext('2d');
    x.font = G.font(fs);
    const w = Math.ceil(Math.max(...lines.map((l) => x.measureText(l).width)) + fs * 1.3);
    const h = Math.ceil(lines.length * fs * 1.25 + fs * 0.9);
    c.width = w; c.height = h;
    x.fillStyle = o.bg || '#fffbe6';
    x.fillRect(0, 0, w, h);
    if (o.border !== null) {
      x.lineWidth = fs * 0.16;
      x.strokeStyle = o.border || '#222';
      x.strokeRect(x.lineWidth / 2, x.lineWidth / 2, w - x.lineWidth, h - x.lineWidth);
    }
    x.font = G.font(fs);
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillStyle = o.color || '#222';
    lines.forEach((l, i) => x.fillText(l, w / 2, fs * 0.45 + fs * 1.25 * (i + 0.5)));
    return c;
  }
  // a two-faced board (readable from both sides) of world height `bh`
  function board(lines, o, bh) {
    const c = textCanvas(lines, o);
    const tex = canvasTex(c);
    const bw = (bh * c.width) / c.height;
    const geo = new THREE.PlaneGeometry(bw, bh);
    const mat = basic('#fff', { map: tex });
    const g = new THREE.Group();
    const f = new THREE.Mesh(geo, mat);
    const b = new THREE.Mesh(geo, mat);
    b.rotation.y = Math.PI;
    f.position.z = 0.15; b.position.z = -0.15;
    g.add(f, b);
    g.userData.w = bw;
    return g;
  }
  function label(text, color, size, outline) {
    const fs = 64;
    const c = document.createElement('canvas');
    const x = c.getContext('2d');
    x.font = G.font(fs);
    c.width = Math.ceil(x.measureText(text).width + 30);
    c.height = fs + 30;
    x.font = G.font(fs);
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    G.outlineText(x, text, c.width / 2, c.height / 2, color || '#fff', outline || '#000', 12);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(c), fog: false, depthWrite: false }));
    s.scale.set((size * c.width) / c.height, size, 1);
    return s;
  }
  const postGeo = new THREE.CylinderGeometry(1, 1, 1, 6).translate(0, 0.5, 0);
  const postMat = lambert('#6b6b6b');
  function signOnPost(lines, o, x, y, faceA, bh, height) {
    const g = new THREE.Group();
    const b = board(lines, o, bh);
    b.position.y = height + bh / 2;
    g.add(b);
    const p = new THREE.Mesh(postGeo, postMat);
    p.scale.set(1.2, height, 1.2);
    g.add(p);
    return place(g, x, y, 0, faceA);
  }
  // the heading at which a board at (x, y) faces the nearest road
  const faceRoad = (x, y) => {
    const n = M.nearest(x, y);
    return n ? Math.atan2(x - n.px, -(y - n.py)) + Math.PI : 0;
  };

  // ---------- facade textures ----------
  function windowTex(kind) {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = '#fff';
    x.fillRect(0, 0, 128, 128);
    if (kind === 'house') {
      x.fillStyle = '#3c4a5a';
      [[18, 40], [76, 40]].forEach(([wx, wy]) => { x.fillRect(wx, wy, 34, 38); });
      x.fillStyle = '#fff';
      [[18, 40], [76, 40]].forEach(([wx, wy]) => { x.fillRect(wx + 15, wy, 4, 38); x.fillRect(wx, wy + 17, 34, 4); });
      x.fillStyle = '#d9d2c5';
      x.fillRect(0, 118, 128, 10);
    } else {
      x.fillStyle = '#41505e';
      for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) x.fillRect(10 + k * 30, 14 + r * 38, 20, 24);
    }
    const t = canvasTex(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }

  // ---------- houses, stores, trees (instanced; static) ----------
  const rng = G.mulberry32(2718);
  const houses = [], trees = [];
  M.chunks.forEach((list) => list.forEach((it) => { if (it.kind === 'house') houses.push(it); else if (it.kind === 'tree') trees.push(it); }));
  const WALLS = ['#efe6d8', '#e8d8c3', '#d9e4ec', '#f3e3c3', '#e4d2d8', '#d6e2cf', '#f0efe9', '#e9d6b5', '#cfd8dc'];
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3(), tmpC = new THREE.Color();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const setInst = (mesh, i, x, h, y, a, sx, sy, sz) => {
    tmpQ.setFromAxisAngle(yAxis, -a);
    tmpM.compose(tmpP.set(x, h, y), tmpQ, tmpS.set(sx, sy, sz));
    mesh.setMatrixAt(i, tmpM);
  };
  // gable roof: a triangular prism, ridge along x, base on y = 0, 1 × 1 × 1
  const gable = (() => {
    const g = new THREE.BufferGeometry();
    const v = [
      -0.5, 0, 0.5, 0.5, 0, 0.5, 0.5, 1, 0, -0.5, 0, 0.5, 0.5, 1, 0, -0.5, 1, 0, // south slope
      0.5, 0, -0.5, -0.5, 0, -0.5, -0.5, 1, 0, 0.5, 0, -0.5, -0.5, 1, 0, 0.5, 1, 0, // north slope
      -0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 1, 0, // west gable
      0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 1, 0, // east gable
    ];
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    g.computeVertexNormals();
    return g;
  })();
  {
    const wallMesh = new THREE.InstancedMesh(boxBase(), lambert('#fff', { map: windowTex('house') }), houses.length);
    const roofMesh = new THREE.InstancedMesh(gable, lambert('#fff'), houses.length);
    houses.forEach((h, i) => {
      const w = h.big ? h.w * 1.3 : h.w, d = h.big ? h.h * 1.2 : h.h;
      const ht = (h.big ? 34 : 22) + rng() * 10;
      setInst(wallMesh, i, h.x, 0, h.y, h.a, w, ht, d);
      setInst(roofMesh, i, h.x, ht, h.y, h.a, w + 4, 9 + rng() * 6, d + 4);
      wallMesh.setColorAt(i, tmpC.set(G.pick(WALLS, rng)));
      roofMesh.setColorAt(i, tmpC.set(h.color));
    });
    scene.add(wallMesh, roofMesh);
  }
  {
    const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.4, 2, 1, 6).translate(0, 0.5, 0), lambert('#6b4a2f'), trees.length + 4);
    const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), lambert('#fff', { flatShading: true }), trees.length + 4);
    const pk = M.zones.park, pc = M.zoneCenter(pk);
    const all = trees.concat(pk.map(([x, y], i) => ({ x: G.lerp(x, pc[0], 0.18), y: G.lerp(y, pc[1], 0.18), r: 20, hue: i % 2 })));
    all.forEach((t, i) => {
      const th = 10 + t.r * 0.5;
      setInst(trunk, i, t.x, 0, t.y, 0, 1, th, 1);
      setInst(crown, i, t.x, th + t.r * 0.55, t.y, rng() * 6, t.r * 1.05, t.r * 1.15, t.r * 1.05);
      crown.setColorAt(i, tmpC.set(t.hue ? '#4c8a3c' : '#3a7034'));
    });
    trunk.count = crown.count = all.length;
    scene.add(trunk, crown);
  }
  // storefronts: a box, a glass front, an awning, and (near the car) a name board
  const stores = M.stores;
  const storeDims = (s) => ({ w: s.hero || s.big ? 70 : 46, d: s.hero || s.big ? 48 : 38, h: s.hero || s.big ? 40 : 30 });
  {
    const walls = lambert('#fff', { map: windowTex('store') }), flat = lambert('#d9d4cc');
    const body = new THREE.InstancedMesh(boxBase(), [walls, walls, flat, flat, walls, walls], stores.length);
    const glass = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0), lambert('#2f4c63', { emissive: '#132433' }), stores.length);
    const awning = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).rotateX(-0.45), lambert('#fff'), stores.length);
    const local = new THREE.Vector3();
    stores.forEach((s, i) => {
      const { w, d, h } = storeDims(s);
      setInst(body, i, s.x, 0, s.y, s.a, w, h, d);
      body.setColorAt(i, tmpC.set(s.hero ? '#7b2d26' : s.roof).lerp(new THREE.Color('#fff'), 0.35));
      // local +z (2D local +y) faces the street
      const off = (dz, dy) => { local.set(0, 0, dz).applyAxisAngle(yAxis, -s.a); return [s.x + local.x, s.y + local.z, dy]; };
      const [gx, gy] = off(d / 2 + 0.3);
      setInst(glass, i, gx, 2, gy, s.a, w * 0.8, 14, 1);
      const [ax, ay] = off(d / 2 + 4);
      setInst(awning, i, ax, 19, ay, s.a, w, 1.6, 10);
      awning.setColorAt(i, tmpC.set(s.hero ? '#2a9d8f' : s.awning));
    });
    scene.add(body, glass, awning);
  }
  const storeSigns = new Map();
  function storeSign(s) {
    const { d, h } = storeDims(s);
    const words = s.name.split(' ');
    const lines = [];
    for (const wd of words) {
      if (lines.length && (lines[lines.length - 1] + ' ' + wd).length <= 14) lines[lines.length - 1] += ' ' + wd;
      else if (lines.length < 2) lines.push(wd);
    }
    const g = board(lines, { bg: s.hero ? '#7b2d26' : '#1d1d24', color: s.hero ? '#ffd23f' : '#fff', border: s.hero ? '#ffd23f' : null, size: 11 }, s.hero ? 14 : 9);
    const holder = new THREE.Group();
    g.position.set(0, h - (s.hero ? 3 : 5), d / 2 + 0.6);
    holder.add(g);
    if (s.hero) {
      const tag = label(s.name, '#ffd23f', 12);
      tag.position.set(0, h + 18, 0);
      holder.add(tag);
    }
    return place(holder, s.x, s.y, 0, s.a);
  }
  let signBudgetT = 0;
  function updateStoreSigns(car) {
    signBudgetT -= 1;
    if (signBudgetT > 0) return;
    signBudgetT = 10;
    let made = 0;
    for (const s of stores) {
      const d = G.dist(s.x, s.y, car.x, car.y);
      const have = storeSigns.get(s);
      if (d < 750 && !have && made < 6) { const g = storeSign(s); scene.add(g); storeSigns.set(s, g); made++; }
      else if (d > 950 && have && !s.hero) {
        scene.remove(have);
        have.traverse((o) => { if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } if (o.geometry && o.geometry !== postGeo) o.geometry.dispose(); });
        storeSigns.delete(s);
      }
    }
  }

  // ---------- landmarks ----------
  {
    // Berkeley High: the main building north of the track
    const bz = M.zones.bhs, [bcx, bcy] = M.zoneCenter(bz);
    const bw = Math.abs(bz[1][0] - bz[0][0]), bh = Math.abs(bz[3][1] - bz[0][1]);
    const bhsTex = windowTex('store');
    bhsTex.repeat.set(6, 2);
    const bhsWall = lambert('#c47f5a', { map: bhsTex }), bhsRoof = lambert('#8f5a3e');
    const bhs = new THREE.Mesh(boxBase(), [bhsWall, bhsWall, bhsRoof, bhsRoof, bhsWall, bhsWall]);
    bhs.scale.set(bw * 0.84, 56, bh * 0.36);
    place(bhs, bcx, bcy - bh * 0.46 + bh * 0.18, 0);
    scene.add(bhs);
    const bl = label('BERKELEY HIGH SCHOOL', '#ffd23f', 16);
    place(bl, bcx, bcy - bh * 0.28, 76);
    scene.add(bl);
    // Old City Hall: rubble, a toppled cupola, fallen columns, and a sign that is very sure of itself
    const rub = world.rubble;
    const rubMesh = new THREE.InstancedMesh(boxBase(), lambert('#fff', { flatShading: true }), rub.length);
    rub.forEach((p, i) => {
      setInst(rubMesh, i, p.x, 0, p.y, p.rot, p.w, 3 + rng() * 10, p.h);
      rubMesh.setColorAt(i, tmpC.set(p.c));
    });
    scene.add(rubMesh);
    const rc = world.rubbleCenter;
    const cupola = new THREE.Mesh(new THREE.SphereGeometry(20, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), lambert('#7fa38a', { flatShading: true }));
    place(cupola, rc[0] + 18, rc[1] - 12, 0);
    cupola.rotation.set(1.1, 0.4, 0.3);
    scene.add(cupola);
    rub.filter((_, k) => k % 23 === 5).slice(0, 3).forEach((p) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 44, 10), lambert('#f2ede1'));
      col.rotation.set(0, -p.rot, Math.PI / 2, 'YXZ'); // lying on its side
      scene.add(place(col, p.x, p.y, 6));
    });
    scene.add(place(label('OLD CITY HALL', '#fff', 11), rc[0], rc[1], 40));
    scene.add(signOnPost(['SEISMIC RETROFIT', 'STUDY IN PROGRESS'], { size: 8, bg: '#f26b1d', color: '#fff' }, rc[0], rc[1] + 20, faceRoad(rc[0], rc[1] + 20), 14, 8));
    // the big top
    const T = world.tent;
    const stripes = (() => {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 8;
      const x = c.getContext('2d');
      for (let k = 0; k < 16; k++) { x.fillStyle = k % 2 ? '#fff4e0' : '#d62828'; x.fillRect(k * 16, 0, 16, 8); }
      return canvasTex(c);
    })();
    const tent = new THREE.Group();
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(T.r, T.r, 26, 32, 1, true).translate(0, 13, 0), lambert('#fff', { map: stripes, side: THREE.DoubleSide }));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(T.r + 8, 44, 32, 1, true).translate(0, 26 + 22, 0), lambert('#fff', { map: stripes, side: THREE.DoubleSide }));
    const pole = new THREE.Mesh(postGeo, lambert('#ffd23f'));
    pole.scale.set(1.5, 84, 1.5);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(22, 10).translate(11, 0, 0), lambert('#d62828', { side: THREE.DoubleSide }));
    flag.position.y = 80;
    tent.add(wall, roof, pole, flag);
    tent.userData.flag = flag;
    scene.add(place(tent, T.x, T.y, 0));
    world.tentFlag = flag;
    const tl = label('COUNCIL CHAMBERS (TEMPORARY)', '#ffd23f', 12);
    scene.add(place(tl, T.x, T.y, 104));
    scene.add(place(label('CIVIC CENTER PARK', '#fff', 11, '#2d5a1e'), M.zoneCenter(M.zones.park)[0], M.zoneCenter(M.zones.park)[1] - T.r - 58, 30));
  }

  // ---------- closures and roadside signs ----------
  const flashers = [];
  {
    const stripeTex = (() => {
      const c = document.createElement('canvas');
      c.width = 128; c.height = 16;
      const x = c.getContext('2d');
      x.fillStyle = '#f26b1d';
      x.fillRect(0, 0, 128, 16);
      x.fillStyle = '#fff';
      for (let k = -16; k < 128; k += 24) { x.beginPath(); x.moveTo(k, 16); x.lineTo(k + 12, 0); x.lineTo(k + 24, 0); x.lineTo(k + 12, 16); x.fill(); }
      const t = canvasTex(c);
      t.wrapS = THREE.RepeatWrapping;
      return t;
    })();
    const flashGeo = new THREE.SphereGeometry(2.4, 8, 6);
    for (const c of world.closures) {
      const len = 2 * (c.road.hw + 4);
      const a = Math.atan2(c.p.dy, c.p.dx);
      const g = new THREE.Group();
      const tex = stripeTex.clone();
      tex.repeat.set(len / 40, 1);
      tex.needsUpdate = true;
      [5, 11].forEach((hgt) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(3, 4, len), lambert('#fff', { map: tex }));
        rail.position.y = hgt;
        g.add(rail);
      });
      for (let k = -1; k <= 1; k++) {
        const leg = new THREE.Mesh(boxBase(), lambert('#ddd'));
        leg.scale.set(2, 13, 2);
        leg.position.z = (k * len) / 2.2;
        g.add(leg);
        if (k) {
          const f = new THREE.Mesh(flashGeo, basic('#ffd23f'));
          f.position.set(0, 15.5, (k * len) / 2.2);
          g.add(f);
          flashers.push(f);
        }
      }
      scene.add(place(g, c.p.x, c.p.y, 0, a)); // rails run along local z, i.e. across the road
      scene.add(signOnPost(c.lines, { bg: '#f26b1d', color: '#fff', border: '#222', size: 11 }, c.sign[0], c.sign[1], faceRoad(c.sign[0], c.sign[1]), 10 + 6 * c.lines.length, 10));
    }
    for (const p of world.potholes.concat(world.extraSigns)) {
      if (!p.sign) continue;
      const o = Object.assign({ size: 11 }, City.signStyle(p));
      scene.add(signOnPost(p.sign, o, p.sx, p.sy, faceRoad(p.sx, p.sy), 8 + 6 * p.sign.length, 10));
    }
  }

  // ---------- cones and inspectors (instanced; dynamic) ----------
  // Hopkins before the project: parked cars along both curbs. After it: flex posts along the cycletracks.
  const MAX_PARKED = City.world.project.parked.length || 1, MAX_POSTS = City.world.project.posts.length || 1;
  const parkedBody = new THREE.InstancedMesh(boxBase(), lambert('#fff'), MAX_PARKED);
  const parkedCab = new THREE.InstancedMesh(boxBase(), lambert('#2b3d52'), MAX_PARKED);
  City.world.project.parked.forEach((p, i) => parkedBody.setColorAt(i, tmpC.set(p.color)));
  const postMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(2.2, 2.2, 18, 8).translate(0, 9, 0), lambert('#f4f4f4'), MAX_POSTS);
  const postBand = new THREE.InstancedMesh(new THREE.CylinderGeometry(2.4, 2.4, 3, 8).translate(0, 14, 0), basic('#e03030'), MAX_POSTS);
  scene.add(parkedBody, parkedCab, postMesh, postBand);
  const coneMesh = new THREE.InstancedMesh(new THREE.ConeGeometry(4, 12, 10).translate(0, 6, 0), lambert('#ff7a1a'), City.cones ? City.cones.length : 2000);
  coneMesh.frustumCulled = false;
  scene.add(coneMesh);
  const inspBody = new THREE.InstancedMesh(new THREE.CylinderGeometry(3, 3.6, 14, 8).translate(0, 7, 0), lambert('#c8e03c'), 2000);
  const inspHead = new THREE.InstancedMesh(new THREE.SphereGeometry(3, 10, 8), lambert('#e0b08a'), 2000);
  const inspHat = new THREE.InstancedMesh(new THREE.CylinderGeometry(3.4, 3.4, 2.4, 10), lambert('#2b3a55'), 2000);
  const inspBoard = new THREE.InstancedMesh(new THREE.BoxGeometry(5, 6, 0.8), lambert('#a0763c'), 2000);
  [inspBody, inspHead, inspHat, inspBoard].forEach((m) => { m.frustumCulled = false; scene.add(m); });
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const local = new THREE.Vector3();

  // ---------- people ----------
  function makeClown(color) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ConeGeometry(6, 16, 10).translate(0, 8, 0), lambert(color));
    const head = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 10), lambert('#fff'));
    head.position.y = 19;
    const nose = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 6), basic('#ff1f1f'));
    nose.position.set(0, 19, -4);
    const hair = new THREE.Mesh(new THREE.TorusGeometry(4, 1.8, 6, 12), lambert('#ff5ea8'));
    hair.position.y = 21;
    hair.rotation.x = Math.PI / 2;
    const hat = new THREE.Mesh(new THREE.ConeGeometry(2.6, 8, 8).translate(0, 4, 0), lambert('#ffd23f'));
    hat.position.y = 22;
    g.add(body, head, nose, hair, hat);
    return g;
  }
  function makeCyclist(jersey) {
    const g = new THREE.Group();
    const dark = lambert('#222');
    [-6, 6].forEach((z) => {
      const w = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.8, 6, 16), dark);
      w.rotation.y = Math.PI / 2;
      w.position.set(0, 4.6, z);
      g.add(w);
    });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 12), lambert('#c0c0c0'));
    frame.position.y = 7;
    const rider = new THREE.Mesh(new THREE.BoxGeometry(5, 9, 5), lambert(jersey));
    rider.position.set(0, 13, 1);
    rider.rotation.x = -0.5;
    const head = new THREE.Mesh(new THREE.SphereGeometry(2.6, 10, 8), lambert('#e0b08a'));
    head.position.set(0, 18, -1.5);
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), lambert(jersey));
    helmet.position.set(0, 18.4, -1.5);
    const legs = new THREE.Mesh(new THREE.BoxGeometry(4, 7, 2.4), lambert('#1b1b1b'));
    legs.position.set(0, 8.5, 1);
    g.add(frame, rider, head, helmet, legs);
    return g;
  }
  const clownObjs = new Map(), cyclistObjs = new Map();

  // ---------- parking spots ----------
  let spotsFor = null;
  const spotObjs = [];
  const pTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = '#1565c0';
    G.rr(x, 8, 8, 112, 112, 20);
    x.fill();
    x.lineWidth = 8;
    x.strokeStyle = '#fff';
    x.stroke();
    x.fillStyle = '#fff';
    x.font = G.font(84);
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText('P', 64, 70);
    return canvasTex(c);
  })();
  function buildSpot(s) {
    const root = place(new THREE.Group(), s.x, s.y, 0, s.a);
    const out = s.side > 0 ? -1 : 1; // local z toward the sidewalk
    // available: a beacon you can see from down the block
    const avail = new THREE.Group();
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(26, 26, 70, 24, 1, true).translate(0, 35, 0),
      basic('#50aaff', { transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
    const icon = new THREE.Sprite(new THREE.SpriteMaterial({ map: pTex, depthWrite: false }));
    icon.scale.set(20, 20, 1);
    icon.position.y = 52;
    const tag = label(s.type === 'phantom' ? 'DEFINITELY REAL' : 'AVAILABLE!', '#9be7ff', 7);
    tag.position.y = 70;
    avail.add(beam, icon, tag);
    avail.userData.icon = icon;
    root.add(avail);
    // what the space becomes
    const done = new THREE.Group();
    const sign = (lines, o) => {
      const b = board(lines, Object.assign({ size: 10 }, o), 6 + 5 * lines.length);
      b.position.set(0, 16, out * (s.h / 2 + 4));
      const p = new THREE.Mesh(postGeo, postMat);
      p.scale.set(1, 16, 1);
      p.position.set(0, 0, out * (s.h / 2 + 4));
      done.add(b, p);
    };
    if (s.type === 'corral') {
      const slab = new THREE.Mesh(boxBase(), lambert('#9a9a9a'));
      slab.scale.set(s.w, 1.5, s.h);
      done.add(slab);
      for (let k = 0; k < 5; k++) {
        const hoop = new THREE.Mesh(new THREE.TorusGeometry(5, 0.8, 6, 12, Math.PI), lambert('#c0c0c0'));
        hoop.position.set(-s.w / 2 + 10 + k * 16, 1.5, 0);
        hoop.rotation.y = Math.PI / 2;
        done.add(hoop);
      }
      sign(['BIKE CORRAL'], { bg: '#1f7a3a', color: '#fff' });
    } else if (s.type === 'dining') {
      const deck = new THREE.Mesh(boxBase(), lambert('#b07a45'));
      deck.scale.set(s.w, 3, s.h);
      done.add(deck);
      [-1, 1].forEach((e) => {
        const pl = new THREE.Mesh(boxBase(), lambert('#3f8a3a'));
        pl.scale.set(6, 8, s.h);
        pl.position.x = (e * (s.w - 6)) / 2;
        done.add(pl);
      });
      [['#e63946', -18], ['#2a9d8f', 18]].forEach(([col, dx]) => {
        const um = new THREE.Mesh(new THREE.ConeGeometry(13, 6, 12).translate(0, 3, 0), lambert(col));
        um.position.set(dx, 20, 0);
        const st = new THREE.Mesh(postGeo, postMat);
        st.scale.set(0.8, 20, 0.8);
        st.position.set(dx, 3, 0);
        done.add(um, st);
      });
      sign(['PARKLET', 'SMALL PLATES $34']);
    } else if (s.type === 'island') {
      const curb = new THREE.Mesh(boxBase(), lambert('#d8d2c4'));
      curb.scale.set(s.w + 6, 3, s.h + 6);
      const turf = new THREE.Mesh(boxBase(), lambert('#6aa84f'));
      turf.scale.set(s.w, 3.6, s.h);
      done.add(curb, turf);
      for (let k = 0; k < 6; k++) {
        const sh = new THREE.Mesh(new THREE.IcosahedronGeometry(5, 0), lambert(k % 2 ? '#4c8a3c' : '#3a7034', { flatShading: true }));
        sh.position.set(-s.w / 2 + 10 + k * 13, 7, k % 2 ? -6 : 6);
        done.add(sh);
      }
      sign(['INTERPRETIVE SIGN:', 'HERE STOOD A PARKING SPACE'], { bg: '#5b3a1e', color: '#f3dfa2' });
    } else if (s.type === 'loading') {
      sign(['15-SECOND', 'LOADING ONLY'], { bg: '#ffd23f' });
    } else if (s.type === 'phantom') {
      // the bike-only pizza parklet: deck, planters at the ends, bike racks
      const deck = new THREE.Mesh(boxBase(), lambert('#b07a45'));
      deck.scale.set(s.w, 3, s.h);
      done.add(deck);
      [-1, 1].forEach((e) => {
        const pl = new THREE.Mesh(boxBase(), lambert('#3f8a3a'));
        pl.scale.set(6, 8, s.h);
        pl.position.x = (e * (s.w - 6)) / 2;
        done.add(pl);
      });
      for (let k = 0; k < 3; k++) {
        const hoop = new THREE.Mesh(new THREE.TorusGeometry(5, 0.8, 6, 12, Math.PI), lambert('#c0c0c0'));
        hoop.position.set(-s.w / 2 + 16 + k * 15, 3, 0);
        hoop.rotation.y = Math.PI / 2;
        done.add(hoop);
      }
      sign(['BIKE-ONLY PIZZA PARKLET', 'SLICES FOR CYCLISTS'], { bg: '#c0392b', color: '#fff' });
    }
    root.add(done);
    scene.add(root);
    return { s, root, avail, done };
  }
  const backOut = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  function updateSpots(t) {
    if (spotsFor !== City.spots) {
      spotObjs.forEach((o) => scene.remove(o.root));
      spotObjs.length = 0;
      City.spots.forEach((s) => spotObjs.push(buildSpot(s)));
      spotsFor = City.spots;
    }
    for (const o of spotObjs) {
      const st = o.s.state;
      o.avail.visible = st === 'avail';
      o.done.visible = st === 'done';
      if (st === 'avail') o.avail.userData.icon.position.y = 52 + Math.sin(t * 4) * 4;
      if (st === 'done') { const k = Math.max(0.01, backOut(o.s.pop)); o.done.scale.set(k, k, k); }
    }
  }

  // ---------- the council-tent marker ----------
  const CH = world.cityHall;
  const chMarker = new THREE.Group();
  chMarker.add(new THREE.Mesh(new THREE.CylinderGeometry(CH.r * 0.75, CH.r * 0.75, 50, 32, 1, true).translate(0, 25, 0),
    basic('#ffd23f', { transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false })));
  const chLabel = label('FILE APPEAL HERE', '#ffd23f', 12);
  chLabel.position.y = 64;
  chMarker.add(chLabel);
  scene.add(place(chMarker, CH.x, CH.y, 0));

  // ---------- tire ruts in the lawns (a ring buffer of quads, appended as City.tracks grows) ----------
  const RUTS = 3000;
  const rutPos = new Float32Array(RUTS * 18);
  const rutGeo = new THREE.BufferGeometry();
  rutGeo.setAttribute('position', new THREE.BufferAttribute(rutPos, 3));
  const rutMesh = new THREE.Mesh(rutGeo, basic('#5c4026', { transparent: true, opacity: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  rutMesh.frustumCulled = false;
  scene.add(rutMesh);
  let rutsFor = null, rutsDrawn = 0;
  function updateRuts(C) {
    if (rutsFor !== C.tracks) { rutsFor = C.tracks; rutsDrawn = 0; rutPos.fill(0); rutGeo.attributes.position.needsUpdate = true; }
    const fresh = Math.min(C.trackCount - rutsDrawn, C.tracks.length);
    if (fresh <= 0) return;
    const hw = 2.5;
    for (let k = C.tracks.length - fresh; k < C.tracks.length; k++) {
      const [ax, ay, bx, by] = C.tracks[k];
      const L = Math.hypot(bx - ax, by - ay) || 1;
      const nx = (-(by - ay) / L) * hw, ny = ((bx - ax) / L) * hw;
      rutPos.set([ax + nx, 0.25, ay + ny, bx + nx, 0.25, by + ny, bx - nx, 0.25, by - ny, ax + nx, 0.25, ay + ny, bx - nx, 0.25, by - ny, ax - nx, 0.25, ay - ny], (rutsDrawn % RUTS) * 18);
      rutsDrawn++;
    }
    rutsDrawn = Math.max(rutsDrawn, C.trackCount);
    rutGeo.setDrawRange(0, Math.min(rutsDrawn, RUTS) * 6);
    rutGeo.attributes.position.needsUpdate = true;
  }

  // ---------- the GPS route, laid on the road like a racing line ----------
  const routeMesh = new THREE.Mesh(new THREE.BufferGeometry(), basic('#ffd23f', { transparent: true, opacity: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
  routeMesh.frustumCulled = false;
  scene.add(routeMesh);
  let routeFor = null;
  function updateRouteLine(C) {
    routeMesh.visible = !!(C.route && C.route.length > 1 && C.parkSeq < 0);
    if (!routeMesh.visible || routeFor === C.route) return;
    routeFor = C.route;
    const pts = C.route.filter((p, i, a) => !i || G.dist(p[0], p[1], a[i - 1][0], a[i - 1][1]) > 1);
    const pos = [];
    const hw = 6;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      const L = Math.hypot(bx - ax, by - ay) || 1;
      const nx = (-(by - ay) / L) * hw, ny = ((bx - ax) / L) * hw;
      pos.push(ax + nx, 0.4, ay + ny, bx + nx, 0.4, by + ny, bx - nx, 0.4, by - ny, ax + nx, 0.4, ay + ny, bx - nx, 0.4, by - ny, ax - nx, 0.4, ay - ny);
    }
    routeMesh.geometry.dispose();
    routeMesh.geometry = new THREE.BufferGeometry();
    routeMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  }

  // ---------- the player's car (forward = -z), as battered as its top-down sprite ----------
  const PLATE = 'PCI 0'; // Pavement Condition Index: zero means failed
  const plateTex = (() => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = '#1b1b1b';
    G.rr(x, 0, 0, 256, 128, 14);
    x.fill();
    x.fillStyle = '#f7f7f2';
    G.rr(x, 8, 8, 240, 112, 10);
    x.fill();
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillStyle = '#c8102e';
    x.font = 'italic 700 22px Georgia, "Times New Roman", serif';
    x.fillText('California', 128, 24);
    x.fillStyle = '#1a2a6c';
    x.font = G.condensed(62);
    x.fillText(PLATE, 128, 72);
    x.fillStyle = '#fff';
    x.font = G.font(11, 800);
    x.fillText('BERKELEY · A NUCLEAR-FREE ZONE', 128, 120);
    return canvasTex(c);
  })();
  const stickerTex = canvasTex(textCanvas(['I BRAKE FOR', 'PUBLIC COMMENT'], { bg: '#2a9d8f', color: '#fff', border: null, size: 9 }));
  const bodyMat = lambert('#c3ccd2'); // Prius silver
  const carObj = new THREE.Group();
  const carBody = new THREE.Group(); // squashes and tilts; the shadow stays on the ground
  carObj.add(carBody);
  {
    // Prius wedge: side profiles in (f = forward, height), extruded across the car's width.
    // f runs +23 (nose) to -23 (Kamm tail); world z = -f after the rotation.
    const glass = lambert('#26415e', { emissive: '#0c1622' });
    const trim = lambert('#2b2b2b');
    const side = (pts, width, mat) => {
      const sh = new THREE.Shape(pts.map(([f, y]) => new THREE.Vector2(f, y)));
      const g = new THREE.ExtrudeGeometry(sh, { depth: width - 2, bevelEnabled: true, bevelThickness: 1, bevelSize: 0.8, bevelSegments: 2, curveSegments: 4 });
      g.translate(0, 0, -(width - 2) / 2).rotateY(Math.PI / 2);
      return new THREE.Mesh(g, mat);
    };
    // lower body: low nose, long sloping hood, beltline rising to a cut-off tail with a spoiler lip
    const lower = side([[23, 3.5], [23.8, 6], [23.2, 8.4], [17, 10.8], [9, 12.7], [-12, 13.8], [-19.5, 14.6], [-22.6, 16.6], [-23.4, 14], [-23.4, 6], [-22.8, 3.5]], 26, bodyMat);
    // greenhouse: the raked windshield runs straight into a roof that peaks just behind the driver,
    // then a long hatch slope down to the spoiler
    const house = side([[9.4, 12.6], [-1.5, 22.8], [-4.5, 23.2], [-19.6, 16.4], [-19.6, 14.2]], 22, glass);
    const roof = side([[-0.6, 22.6], [-1.8, 23.7], [-4.6, 24.1], [-12.5, 20.4], [-12.3, 19.7], [-4.6, 23.3], [-1.8, 22.9]], 22.6, bodyMat);
    const bPillar = new THREE.Mesh(new THREE.BoxGeometry(22.4, 9.8, 1.4), bodyMat);
    bPillar.position.set(0, 17.7, 1.6);
    bPillar.rotation.x = 0.12;
    const aPillars = [-1, 1].map((sx) => {
      const pl = new THREE.Mesh(new THREE.BoxGeometry(1, 0.9, 15), bodyMat);
      pl.position.set(sx * 10.8, 17.7, -3.95);
      pl.rotation.x = -Math.atan2(10.2, 10.9); // along the windshield rake
      return pl;
    });
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.6, 7.5, 13), lambert('#4fa3c7')); // mismatched replacement door
    door.position.set(-13.2, 8.6, -2);
    carBody.add(lower, house, roof, bPillar, ...aPillars, door);
    // rust: two spots on the hood, one on the roof
    [[6, 14, 11.3, 1.8, -0.21], [-5, 18, 10.3, 1.4, -0.34], [4, -8, 22.6, 1.3, 0.42]].forEach(([rx, f, y, r, tilt]) => {
      const spot = new THREE.Mesh(new THREE.CircleGeometry(r, 10).rotateX(-Math.PI / 2), lambert('#a5561f'));
      spot.position.set(rx, y + 0.9, -f);
      spot.rotation.x = tilt;
      carBody.add(spot);
    });
    const crack = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.4), basic('#cfe6ff', { side: THREE.DoubleSide }));
    crack.position.set(-4, 18.2, -4.4);
    crack.rotation.set(-0.9, Math.PI, 0.6, 'YXZ');
    carBody.add(crack);
    // the tail: a wide light bar across the hatch, the little lower window, and that high spoiler
    const lightBar = new THREE.Mesh(new THREE.BoxGeometry(24, 2, 0.6), basic('#d62828'));
    lightBar.position.set(0, 14, 24.3);
    const lowerGlass = new THREE.Mesh(new THREE.BoxGeometry(16, 2.2, 0.5), glass);
    lowerGlass.position.set(0, 11.5, 24.3);
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(24, 0.8, 3), trim);
    spoiler.position.set(0, 16.8, 21.6);
    carBody.add(lightBar, lowerGlass, spoiler);
    // swept headlights
    [-1, 1].forEach((sx) => {
      const head = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.8, 3.5), basic('#fff6c8'));
      head.position.set(sx * 9, 9.2, -21);
      head.rotation.set(0.35, sx * -0.25, 0);
      carBody.add(head);
    });
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(26.5, 2.4, 2), trim);
    bumper.position.set(0, 4.6, 23.2);
    carBody.add(bumper);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), basic('#fff', { map: plateTex }));
    plate.position.set(0, 8.2, 24.45);
    const sticker = new THREE.Mesh(new THREE.PlaneGeometry(7, 2.6), basic('#fff', { map: stickerTex }));
    sticker.position.set(-8.5, 4.6, 24.25);
    carBody.add(plate, sticker);
  }
  const wheels = [];
  {
    const tire = new THREE.CylinderGeometry(4.5, 4.5, 4, 14).rotateZ(Math.PI / 2);
    const tireMat = lambert('#1b1b1b');
    const hubMat = lambert('#9a9a9a');
    [[-12, -14, true], [12, -14, true], [-12, 14, false], [12, 14, false]].forEach(([wx, wz, front]) => {
      const w = new THREE.Group();
      const tr = new THREE.Group();
      tr.add(new THREE.Mesh(tire, tireMat));
      const hub = new THREE.Mesh(new THREE.BoxGeometry(4.2, 5, 1.2), hubMat);
      tr.add(hub);
      w.add(tr);
      w.position.set(wx, 4.5, wz);
      w.userData = { front, roll: tr };
      carBody.add(w);
      wheels.push(w);
    });
  }
  const shadowTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 4, 32, 32, 32);
    g.addColorStop(0, 'rgba(0,0,0,0.55)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    return canvasTex(c);
  })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(40, 60).rotateX(-Math.PI / 2), basic('#fff', { map: shadowTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }));
  scene.add(carObj, shadow);

  // ---------- per-frame ----------
  const proj = new THREE.Vector3();
  let lastW = 0, lastH = 0, lastDpr = 0;
  let smoothSteer = 0, camYaw = null, lastT = 0, wheelRoll = 0;
  const CHASE_BACK = 88, CHASE_UP = 34;
  function project(x, h, y, vw, vh) {
    proj.set(x, h, y).project(camera);
    if (proj.z > 1 || proj.z < -1) return null;
    return { sx: (proj.x + 1) / 2 * vw, sy: (1 - proj.y) / 2 * vh, d: camera.position.distanceTo(tmpP.set(x, h, y)) };
  }

  function render(C, ctx, vw, vh, dpr) {
    const car = C.car, t = C.t;
    if (vw !== lastW || vh !== lastH || dpr !== lastDpr) {
      renderer.setPixelRatio(Math.min(dpr, 1.5));
      renderer.setSize(vw, vh, false);
      camera.aspect = vw / vh;
      camera.fov = vw < vh ? 82 : 70;
      camera.updateProjectionMatrix();
      lastW = vw; lastH = vh; lastDpr = dpr;
    }
    const calm = G.settings.reducedMotion ? 0.25 : 1;

    const now = performance.now() / 1000;
    const dt = G.clamp(now - (lastT || now), 0, 0.1);
    lastT = now;
    const fx = Math.sin(car.a), fy = -Math.cos(car.a);

    // the car: pothole launches lift it, landings squash it, collisions flash it
    const wob = car.wob * Math.sin(car.wobT * 28);
    const steer = (G.input.right ? 1 : 0) - (G.input.left ? 1 : 0);
    smoothSteer += (steer - smoothSteer) * Math.min(1, dt * 12);
    place(carObj, car.x, car.y, car.z, car.a);
    carBody.rotation.x = G.clamp(car.vz * 0.0009, -0.3, 0.3);
    carBody.scale.set(1 + wob * 0.08, 1 - wob * 0.12, 1);
    bodyMat.color.set(car.hitFlash > 0 ? '#ffb3b3' : '#c3ccd2');
    wheelRoll -= (car.fwd * dt) / 4.5;
    wheels.forEach((w) => { w.rotation.y = w.userData.front ? -smoothSteer * 0.45 : 0; w.userData.roll.rotation.x = wheelRoll; });
    shadow.position.set(car.x, 0.5, car.y);
    shadow.rotation.y = -car.a;
    const sh = 1 + car.z / 90;
    shadow.scale.set(sh, 1, sh);
    shadow.material.opacity = 1 / sh;

    // intermission: a scripted camera (see City.cinemaCam)
    const cine = C.cinema ? C.cinemaCam() : null;
    if (cine) {
      camYaw = null;
      camera.position.set(cine.x, cine.h, cine.y);
      camera.lookAt(cine.lx, cine.lh, cine.ly);
    } else {
      // chase camera: behind and above, swinging round after the car rather than locked to it
      if (camYaw === null || G.game.fade >= 1) camYaw = car.a;
      camYaw += G.wrapAngle(car.a - camYaw) * Math.min(1, dt * (car.airborne ? 1.2 : 3.5));
      const cfx = Math.sin(camYaw), cfy = -Math.cos(camYaw);
      const shake = G.hud.shake * calm * 0.35;
      camera.position.set(
        car.x - cfx * CHASE_BACK + (Math.random() - 0.5) * shake,
        CHASE_UP + car.z * 0.6 + (Math.random() - 0.5) * shake,
        car.y - cfy * CHASE_BACK);
      camera.lookAt(car.x + cfx * 90, 6 + car.z * 0.8, car.y + cfy * 90);
    }
    const focus = cine ? { x: cine.lx, y: cine.ly } : car;

    // sharp ground layer, centered ahead of the car (or on what the intermission is looking at)
    const ncx = cine ? cine.lx : car.x + fx * 420, ncy = cine ? cine.ly : car.y + fy * 420;
    if (G.dist(ncx, ncy, near.x, near.y) > 240 || near.key !== spotKey()) refreshNear(ncx, ncy);
    if (!C.cinema && farProject !== C.groundKey()) refreshFar();
    updateRouteLine(C);
    updateRuts(C);

    updateStoreSigns(focus);
    updateSpots(t);
    chMarker.visible = C.phase === 'toCityHall';
    if (chMarker.visible) chMarker.children[0].scale.setScalar(1 + Math.sin(t * 5) * 0.06);
    if (world.tentFlag) world.tentFlag.rotation.y = Math.sin(t * 5) * 0.3;
    const flashOn = Math.floor(t * 3) % 2 === 0;
    flashers.forEach((f) => f.material.color.set(flashOn ? '#ffd23f' : '#5a4a00'));

    // cones: standing, or knocked flat and tumbling
    let n = 0;
    for (const c of C.cones) {
      if (c.scale <= 0 || Math.abs(c.x - focus.x) > 1900 || Math.abs(c.y - focus.y) > 1900) continue;
      euler.set(c.down ? Math.PI / 2 : 0, -c.rot, 0, 'YXZ');
      tmpQ.setFromEuler(euler);
      tmpM.compose(tmpP.set(c.x, c.down ? 4 : 0, c.y), tmpQ, tmpS.setScalar(c.scale));
      coneMesh.setMatrixAt(n++, tmpM);
    }
    coneMesh.count = n;
    coneMesh.instanceMatrix.needsUpdate = true;
    // parked cars keep their instance slot (and color); gone ones shrink to nothing
    C.parked.forEach((p, i) => {
      const k = p.gone ? 0 : 1;
      setInst(parkedBody, i, p.x, 0, p.y, p.a, 24 * k, 11 * k, 44 * k);
      setInst(parkedCab, i, p.x, 11, p.y, p.a, 20 * k, 8 * k, 22 * k);
    });
    [parkedBody, parkedCab].forEach((m) => { m.count = C.parked.length; m.instanceMatrix.needsUpdate = true; });
    n = 0;
    for (const p of C.posts) {
      if (p.scale <= 0 || Math.abs(p.x - focus.x) > 1900 || Math.abs(p.y - focus.y) > 1900) continue;
      euler.set(p.down ? Math.PI / 2 : 0, -p.rot, 0, 'YXZ');
      tmpQ.setFromEuler(euler);
      tmpM.compose(tmpP.set(p.x, p.down ? 1.6 : 0, p.y), tmpQ, tmpS.set(1, G.smoothstep(p.scale), 1));
      postMesh.setMatrixAt(n, tmpM);
      postBand.setMatrixAt(n, tmpM);
      n++;
    }
    [postMesh, postBand].forEach((m) => { m.count = n; m.instanceMatrix.needsUpdate = true; });
    n = 0;
    for (const p of C.inspectors) {
      if (n >= 2000) break;
      if (p.scale <= 0 || Math.abs(p.x - focus.x) > 1900 || Math.abs(p.y - focus.y) > 1900) continue;
      const k = p.scale, bob = Math.abs(Math.sin((t + p.ph) * 3)) * 1.5;
      const face = Math.atan2(car.x - p.x, -(car.y - p.y)); // inspectors watch you
      setInst(inspBody, n, p.x, bob, p.y, face, k, k, k);
      setInst(inspHead, n, p.x, bob + 17 * k, p.y, face, k, k, k);
      setInst(inspHat, n, p.x, bob + 20 * k, p.y, face, k, k, k);
      local.set(0, 0, -4 * k).applyAxisAngle(yAxis, -face);
      setInst(inspBoard, n, p.x + local.x, bob + 9 * k, p.y + local.z, face, k, k, k);
      n++;
    }
    [inspBody, inspHead, inspHat, inspBoard].forEach((m) => { m.count = n; m.instanceMatrix.needsUpdate = true; });

    C.clowns.forEach((c, i) => {
      let o = clownObjs.get(i);
      if (!o) { o = makeClown(c.color); scene.add(o); clownObjs.set(i, o); }
      const face = c.tx ? Math.atan2(c.tx - c.x, -(c.ty - c.y)) : 0;
      place(o, c.x, c.y, Math.abs(Math.sin(c.t * 6)) * 3, face);
    });
    C.cyclists.forEach((c, i) => {
      let o = cyclistObjs.get(i);
      if (!o) { o = makeCyclist(c.jersey); scene.add(o); cyclistObjs.set(i, o); }
      const p = C.cyclistPos(c);
      place(o, p.x, p.y, 0, p.a);
      o.rotation.z = c.wobble > 0 ? Math.sin(c.t * 18) * 0.25 * Math.min(1, c.wobble) : 0;
    });

    renderer.render(scene, camera);

    // ---------- 2D overlay: particles, floaters, windshield, gauges, HUD ----------
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);
    for (const p of C.fx.list) {
      const q = project(p.x, 3 + p.z, p.y, vw, vh);
      if (!q) continue;
      const a = G.clamp(p.life / p.max, 0, 1);
      const sz = G.clamp((p.size * 260) / q.d, 0.5, 60);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color || '#8a7a66';
      if (p.type === 'poof') { ctx.beginPath(); ctx.arc(q.sx, q.sy, sz * (1.6 - a * 0.6), 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(q.sx - sz / 2, q.sy - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of C.floaters.list) {
      const q = project(f.x, 26 + f.t * 14, f.y, vw, vh);
      if (!q) continue;
      ctx.globalAlpha = G.clamp((f.dur - f.t) / 0.4, 0, 1);
      ctx.font = G.font(Math.round(f.size * G.clamp(220 / q.d, 0.7, 1.5)));
      G.outlineText(ctx, f.text, q.sx, q.sy, f.color, '#000', 4);
    }
    ctx.globalAlpha = 1;
    if (cine) { C.drawCinema(ctx, vw, vh); return; }
    drawSpeedo(ctx, vw, vh, car);
    drawGuide(ctx, vw, vh, C);
    C.drawHud(ctx, vw, vh);
  }

  // GPS arrow at the top of the screen: straight up means straight ahead
  function drawGuide(ctx, vw, vh, C) {
    if (!C.route || C.route.length < 2 || C.parkSeq >= 0) return;
    const car = C.car;
    const wp = M.pathAhead(C.route, 130);
    if (G.dist(car.x, car.y, wp[0], wp[1]) < 70) return;
    const rel = G.wrapAngle(Math.atan2(wp[0] - car.x, -(wp[1] - car.y)) - car.a);
    ctx.save();
    ctx.translate(vw / 2, 86);
    ctx.fillStyle = 'rgba(15,20,30,0.6)';
    ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fill();
    ctx.rotate(rel);
    ctx.fillStyle = '#ffd23f';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -18); ctx.lineTo(13, 10); ctx.lineTo(0, 3); ctx.lineTo(-13, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawSpeedo(ctx, vw, vh, car) {
    // speedometer
    const mph = Math.round(car.speed * 0.21);
    let gx = vw / 2, gy = vh - 14 - (G.settings.radio ? 24 : 0);
    if (G.settings.minimap && vw < 640) {
      // narrow screens: the minimap spans the bottom, so the gauge sits on top of it
      const mh = Math.round(Math.min(250, vh * 0.34));
      gx = 12 + Math.max(52, (mh * W) / H / 2);
      gy -= mh + 24;
    }
    ctx.fillStyle = 'rgba(15,20,30,0.82)';
    G.rr(ctx, gx - 52, gy - 36, 104, 34, 8);
    ctx.fill();
    ctx.font = G.font(20);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    G.outlineText(ctx, mph + ' MPH', gx, gy - 19, mph > 45 ? '#ff7b7b' : '#fff', '#000', 3);
  }
  return {
    render,
    setVisible(v) { canvas.style.display = v ? 'block' : 'none'; },
  };
}
