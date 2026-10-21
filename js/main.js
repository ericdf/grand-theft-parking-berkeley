'use strict';
// Game shell: scene state machine (Title → City[Drive 1 → Hopkins → City Hall] → Council → Slalom → Finale),
// checkpoints, pause/options/end menus, and the main loop.
(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  G.view = { w: 0, h: 0, dpr: 1 };

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    G.view.w = window.innerWidth;
    G.view.h = window.innerHeight;
    G.view.dpr = dpr;
    canvas.width = Math.round(G.view.w * dpr);
    canvas.height = Math.round(G.view.h * dpr);
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- game / scenes ----------
  const game = (G.game = {
    scene: null,
    sceneName: '',
    playing: false,
    paused: false,
    fade: 0,
    fadeDir: 0,
    pending: null,
    checkpoint: null,
  });

  game.setCheckpoint = function (name, opts) {
    this.checkpoint = { name, opts: opts || {}, stats: G.cloneStats(G.stats) };
  };

  game.switchNow = function (name, opts) {
    if (this.scene && this.scene.exit) this.scene.exit();
    G.input.clear();
    this.sceneName = name;
    this.scene = G.scenes[name];
    this.scene.enter(opts || {});
    document.body.dataset.scene = name;
  };

  // fade out → switch → fade in
  game.go = function (name, opts) {
    if (this.pending) return;
    this.pending = { name, opts };
    this.fadeDir = 1;
  };

  game.retry = function () {
    const cp = this.checkpoint;
    if (!cp) return;
    G.stats = G.cloneStats(cp.stats);
    this.go(cp.name, cp.opts);
  };

  game.newGame = function (startAt) {
    G.stats = G.newStats();
    G.ui.hideAll();
    this.playing = true;
    this.paused = false;
    const jumps = {
      hopkins: ['city', { phase: 'hopkins' }],
      cityhall: ['city', { phase: 'toCityHall' }],
      council: ['council'],
      slalom: ['slalom'],
      finale: ['finale'],
    };
    const j = jumps[startAt];
    if (j) {
      // debug/test jumps: give the stats a plausible history
      G.stats.stars = { hopkins: 0, cityhall: 3, council: 3, slalom: 4, finale: 5 }[startAt];
      G.stats.committees = { hopkins: 0, cityhall: 2, council: 2, slalom: 5, finale: 7 }[startAt];
      this.switchNow(j[0], j[1]);
    } else {
      this.switchNow('city', { phase: 'drive1' });
    }
    this.fade = 1;
    this.fadeDir = -1;
  };

  game.setPaused = function (p) {
    if (!this.playing || this.sceneName === 'finale' && G.ui.isOpen('end')) return;
    this.paused = p;
    G.audio.setDuck(p ? 0.35 : 1);
    if (p) G.ui.show('pause');
    else G.ui.hideAll();
    G.input.clear();
  };

  // ---------- DOM UI ----------
  const $ = (id) => document.getElementById(id);
  const ui = (G.ui = { open: null, returnTo: null });

  ui.modalOpen = function () { return !!this.open; };
  ui.isOpen = function (id) { return this.open === id; };
  ui.show = function (id) {
    ['title', 'pause', 'options', 'end'].forEach((k) => { $(k).hidden = k !== id; });
    this.open = id;
    const first = $(id).querySelector('[data-autofocus]') || $(id).querySelector('button, input');
    if (first) setTimeout(() => first.focus({ preventScroll: true }), 30);
  };
  ui.hideAll = function () {
    ['title', 'pause', 'options', 'end'].forEach((k) => { $(k).hidden = true; });
    this.open = null;
    canvas.focus({ preventScroll: true });
  };
  ui.onEscape = function (e) {
    e.preventDefault();
    if (this.open === 'options') return this.closeOptions();
    if (this.open === 'pause') return game.setPaused(false);
  };
  ui.openOptions = function (from) {
    this.returnTo = from;
    syncOptions();
    this.show('options');
  };
  ui.closeOptions = function () {
    if (this.returnTo) this.show(this.returnTo);
    else this.hideAll();
  };

  ui.showEnd = function () {
    const s = G.stats;
    $('endParking').textContent = s.parkingFound;
    $('endCommittees').textContent = s.committees;
    $('endSlices').textContent = s.slices;
    $('endAir').textContent = s.maxAir.toFixed(2) + 's';
    $('endPotholes').textContent = s.potholes;
    $('endScore').textContent = (s.slalomScore || 0).toLocaleString();
    $('endStars').textContent = '★'.repeat(s.stars) + '☆'.repeat(5 - s.stars);
    const mins = Math.max(1, Math.round((Date.now() - s.startedAt) / 60000));
    $('endTime').textContent = mins + ' MIN';
    $('endCommitteeList').textContent = s.committeeNames.length ? s.committeeNames.join(' · ') : 'None, pending formation of a committee.';
    this.show('end');
  };

  function shareText() {
    const s = G.stats;
    return 'I played GRAND THEFT PARKING: BERKELEY.\n' +
      'PARKING SPACES FOUND: ' + s.parkingFound + '\nCOMMITTEES FORMED: ' + s.committees + '\nSLICES ACQUIRED: ' + s.slices + '\n' +
      'Best airtime ' + s.maxAir.toFixed(2) + 's · MLK slalom ' + (s.slalomScore || 0).toLocaleString() + ' pts.\n' +
      'In a city where everything is a priority, nothing is paved.\n' + location.href.split('?')[0];
  }

  async function share() {
    const text = shareText();
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch (e) {
      const ta = $('shareFallback');
      ta.hidden = false;
      ta.value = text;
      ta.select();
      try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
    }
    $('shareStatus').textContent = ok ? 'Copied! Paste it somewhere civic.' : 'Select the text above and copy it.';
  }

  function syncOptions() {
    const s = G.settings;
    $('optMuted').checked = s.muted;
    $('optMusic').value = Math.round(s.music * 100);
    $('optSfx').value = Math.round(s.sfx * 100);
    $('optReduced').checked = s.reducedMotion;
    $('optRadio').checked = s.radio;
    $('optHazards').checked = s.hazards;
    $('optMinimap').checked = s.minimap;
  }

  function applySettings() {
    G.saveSettings();
    G.audio.applySettings();
    const m = $('muteBtn');
    m.textContent = G.settings.muted ? '🔇' : '🔊';
    m.setAttribute('aria-label', G.settings.muted ? 'Unmute sound' : 'Mute sound');
    m.setAttribute('aria-pressed', String(G.settings.muted));
  }

  function wireUi() {
    $('startBtn').addEventListener('click', () => { G.audio.unlock(); game.newGame(); });
    $('optionsBtn').addEventListener('click', () => ui.openOptions('title'));
    $('resumeBtn').addEventListener('click', () => game.setPaused(false));
    $('retryBtn').addEventListener('click', () => { game.setPaused(false); game.retry(); });
    $('restartBtn').addEventListener('click', () => { game.setPaused(false); game.newGame(); });
    $('pauseOptionsBtn').addEventListener('click', () => ui.openOptions('pause'));
    $('quitBtn').addEventListener('click', () => {
      game.paused = false;
      game.playing = false;
      if (game.scene && game.scene.exit) game.scene.exit();
      game.scene = null;
      G.audio.setDuck(1);
      G.audio.setMusic('title');
      ui.show('title');
    });
    $('optionsDone').addEventListener('click', () => ui.closeOptions());
    $('againBtn').addEventListener('click', () => game.newGame());
    $('shareBtn').addEventListener('click', share);
    $('muteBtn').addEventListener('click', (e) => {
      G.audio.unlock();
      G.settings.muted = !G.settings.muted;
      applySettings();
      e.currentTarget.blur();
    });
    $('pauseBtn').addEventListener('click', (e) => {
      e.currentTarget.blur();
      if (game.playing) game.setPaused(!game.paused);
    });
    const bind = (id, key, conv) => $(id).addEventListener('input', (e) => {
      G.settings[key] = conv(e.target);
      applySettings();
    });
    bind('optMuted', 'muted', (el) => el.checked);
    bind('optMusic', 'music', (el) => el.value / 100);
    bind('optSfx', 'sfx', (el) => el.value / 100);
    bind('optReduced', 'reducedMotion', (el) => el.checked);
    bind('optRadio', 'radio', (el) => el.checked);
    bind('optHazards', 'hazards', (el) => el.checked);
    bind('optMinimap', 'minimap', (el) => el.checked);
    $('optSfx').addEventListener('change', () => G.audio.play('boing'));
    applySettings();
  }

  // ---------- title backdrop: a car idling in a pothole ----------
  const titleState = { t: 0 };
  function renderTitleBackdrop(dt) {
    titleState.t += dt;
    const { w, h, dpr } = G.view;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-0.25);
    ctx.fillStyle = '#2b2b33';
    ctx.fillRect(-w, -110, w * 2, 220);
    ctx.fillStyle = '#f2c230';
    for (let x = -w; x < w; x += 70) ctx.fillRect(x + ((titleState.t * 120) % 70), -3, 40, 6);
    ctx.restore();
  }

  // ---------- main loop ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const { w, h, dpr } = G.view;
    if (!game.playing || !game.scene) {
      renderTitleBackdrop(dt);
    } else {
      const inp = G.input;
      if (!ui.modalOpen() && inp.was('KeyP', 'Escape')) game.setPaused(true);
      if (!ui.modalOpen() && inp.was('KeyM')) {
        G.settings.minimap = !G.settings.minimap;
        G.saveSettings();
      }
      if (!game.paused) {
        G.hud.update(dt);
        if (!game.pending || game.fade < 1) game.scene.update(dt);
      }
      game.scene.render(ctx, w, h, dpr);
    }
    // fades
    if (game.fadeDir) {
      game.fade = G.clamp(game.fade + game.fadeDir * dt * 2.8, 0, 1);
      if (game.fade >= 1 && game.pending) {
        const p = game.pending;
        game.pending = null;
        game.switchNow(p.name, p.opts);
        game.fadeDir = -1;
      } else if (game.fade <= 0 && game.fadeDir < 0) game.fadeDir = 0;
    }
    if (game.fade > 0) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = 'rgba(0,0,0,' + game.fade + ')';
      ctx.fillRect(0, 0, w, h);
    }
    G.input.endFrame();
    requestAnimationFrame(frame);
  }

  wireUi();
  G.input.setupTouch();
  G.audio.setMusic('title');
  const startAt = G.params.get('start');
  if (startAt) game.newGame(startAt);
  else ui.show('title');
  window.addEventListener('keydown', (e) => {
    if (ui.isOpen('title') && (e.code === 'Enter' || e.code === 'NumpadEnter') && document.activeElement && document.activeElement.id !== 'optionsBtn') {
      e.preventDefault();
      G.audio.unlock();
      game.newGame();
    }
  });
  requestAnimationFrame(frame);
})();
