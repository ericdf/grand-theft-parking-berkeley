'use strict';
// The film player: a single clock drives everything. Rendering is a pure function of the clock,
// so play, pause, scrub, scene jumps and replay all land on the same picture.
//
// URL options (handy for previews and screenshots):
//   ?t=95        start at 95 seconds          ?scene=consent   start at a scene
//   ?still       render that frame and stay paused (no splash)
(function () {
  const $ = (id) => document.getElementById(id);
  const canvas = $('stage'), ctx = canvas.getContext('2d');
  const params = new URLSearchParams(location.search);
  const state = { t: 0, playing: false, captions: true, last: 0, lastSfxT: 0 };
  let lastScene = null;
  F.state = state;

  try { F.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { F.reduced = false; }
  if (params.has('reduced')) F.reduced = true;

  const hasNarration = !!F.AUDIO_FILM || Object.keys(F.AUDIO_TRACKS || {}).length > 0;
  state.captions = !hasNarration; // captions on by default unless narration is supplied

  // ---------- rendering ----------
  function render() {
    const scene = F.sceneAt(state.t);
    const lt = state.t - scene.start;
    const draw = F.renderers[scene.id];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, F.W, F.H);
    ctx.save();
    try {
      if (draw) draw(ctx, lt, scene);
      else placeholder(scene, lt);
    } catch (e) {
      console.error(e);
    }
    ctx.restore();
    // scene-to-scene dip: a quick iris at each boundary (skipped for reduced motion)
    const into = lt, outOf = scene.dur - lt;
    const k = Math.min(into, outOf);
    if (k < 0.35 && !F.reduced && scene.index > 0 && into < 0.35) F.art.iris(ctx, k / 0.35);
    else if (k < 0.35 && !F.reduced && scene.index < F.SCRIPT.length - 1 && outOf < 0.35) F.art.iris(ctx, k / 0.35);
    renderCaptions(scene, lt);
    updateUi(scene);
  }
  function placeholder(scene, lt) {
    ctx.fillStyle = '#223';
    ctx.fillRect(0, 0, F.W, F.H);
    F.art.text(ctx, scene.title, F.W / 2, F.H / 2, { size: 80, color: '#fff' });
    F.art.text(ctx, lt.toFixed(1), F.W / 2, F.H / 2 + 100, { size: 40, color: '#aaa' });
  }

  // ---------- captions ----------
  const capEl = $('captions');
  let capKey = '';
  function renderCaptions(scene, lt) {
    capEl.classList.toggle('off', !state.captions);
    if (!state.captions) return;
    const live = scene.cues.filter((c) => lt >= c.at && lt < c.at + c.dur && (c.kind !== 'sfx' || c.text));
    // speech first, then at most one sound effect
    const speech = live.filter((c) => c.kind !== 'sfx').slice(-2);
    const fx = live.filter((c) => c.kind === 'sfx').slice(-1);
    const show = speech.length ? speech.concat(speech.length < 2 ? fx : []) : fx;
    const key = scene.id + show.map((c) => c.at).join(',');
    if (key === capKey) return;
    capKey = key;
    capEl.innerHTML = '';
    show.forEach((c) => {
      const div = document.createElement('div');
      const cap = document.createElement('span');
      cap.className = 'cap ' + c.kind;
      if (c.kind === 'sfx') {
        cap.innerHTML = '<span class="sfx"></span>';
        cap.firstChild.textContent = '[' + c.text + ']';
      } else {
        const who = document.createElement('span');
        who.className = 'who';
        who.textContent = F.SPEAKERS[c.who] || c.who.toUpperCase();
        const line = document.createElement('span');
        line.className = 'line';
        line.textContent = c.text;
        cap.appendChild(who);
        cap.appendChild(line);
      }
      div.appendChild(cap);
      capEl.appendChild(div);
    });
  }

  // ---------- sound: effects on cue crossings, optional narration ----------
  function fireSfx(from, to) {
    if (to <= from || to - from > 0.5) return; // only during smooth forward play
    for (const s of F.SCRIPT) {
      if (s.start > to || s.start + s.dur < from) continue;
      for (const c of s.cues) {
        const at = s.start + c.at;
        if (c.snd && at > from && at <= to) F.sfx.play(c.snd);
      }
    }
  }
  const narr = new Audio();
  narr.preload = 'auto';
  let narrSrc = '';
  function syncNarration(force) {
    if (!hasNarration) return;
    let src, offset;
    if (F.AUDIO_FILM) { src = F.AUDIO_FILM; offset = state.t; }
    else {
      const scene = F.sceneAt(state.t);
      src = F.AUDIO_TRACKS[scene.id];
      offset = state.t - scene.start;
    }
    if (!src) { narr.pause(); narrSrc = ''; return; }
    if (src !== narrSrc) { narr.src = src; narrSrc = src; force = true; }
    if (force || Math.abs(narr.currentTime - offset) > 0.3) { try { narr.currentTime = offset; } catch (e) { /* not loaded yet */ } }
    narr.volume = F.sfx.muted ? 0 : F.sfx.volume;
    if (state.playing && narr.paused) narr.play().catch(() => {});
    if (!state.playing && !narr.paused) narr.pause();
  }

  // ---------- clock ----------
  function frame(now) {
    const dt = Math.min(0.1, (now - (state.last || now)) / 1000);
    state.last = now;
    if (state.playing) {
      const prev = state.t;
      state.t = Math.min(F.TOTAL, state.t + dt);
      fireSfx(prev, state.t);
      if (state.t >= F.TOTAL) setPlaying(false);
    }
    syncNarration(false);
    render();
    requestAnimationFrame(frame);
  }
  function seek(t) {
    state.t = F.clamp(t, 0, F.TOTAL - 0.01);
    syncNarration(true);
    render();
  }
  function setPlaying(p) {
    if (p && state.t >= F.TOTAL - 0.05) state.t = 0;
    state.playing = p;
    if (p) { F.sfx.unlock(); $('splash').classList.add('hidden'); }
    playBtn.textContent = p ? '❚❚' : '▶';
    playBtn.setAttribute('aria-label', p ? 'Pause' : 'Play');
    syncNarration(true);
  }

  // ---------- controls ----------
  const playBtn = $('playBtn'), scrub = $('scrub'), timeEl = $('time');
  scrub.max = F.TOTAL;
  let scrubbing = false;
  playBtn.addEventListener('click', () => setPlaying(!state.playing));
  $('bigPlay').addEventListener('click', () => setPlaying(true));
  $('replayBtn').addEventListener('click', () => { seek(0); setPlaying(true); });
  scrub.addEventListener('input', () => { scrubbing = true; seek(+scrub.value); });
  scrub.addEventListener('change', () => { scrubbing = false; });
  const muteBtn = $('muteBtn'), vol = $('vol'), ccBtn = $('ccBtn');
  function setMuted(m) {
    F.sfx.muted = m;
    F.sfx.apply();
    muteBtn.textContent = m ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-label', m ? 'Unmute' : 'Mute');
    syncNarration(false);
  }
  muteBtn.addEventListener('click', () => setMuted(!F.sfx.muted));
  vol.addEventListener('input', () => { F.sfx.volume = +vol.value; F.sfx.apply(); if (F.sfx.muted && +vol.value > 0) setMuted(false); });
  function setCaptions(on) {
    state.captions = on;
    ccBtn.classList.toggle('on', on);
    ccBtn.setAttribute('aria-pressed', String(on));
    ccBtn.setAttribute('aria-label', on ? 'Captions on' : 'Captions off');
    capKey = '';
    render();
  }
  ccBtn.addEventListener('click', () => setCaptions(!state.captions));
  setCaptions(state.captions);

  // scene ticks on the scrubber, and the scene menu
  const ticks = $('ticks');
  F.SCRIPT.forEach((s) => {
    if (!s.index) return;
    const i = document.createElement('i');
    i.style.left = (s.start / F.TOTAL) * 100 + '%';
    ticks.appendChild(i);
  });
  const list = $('sceneList');
  F.SCRIPT.forEach((s) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.innerHTML = '<span><span class="n"></span><span class="title"></span></span><span class="t"></span>';
    b.querySelector('.n').textContent = s.index + 1;
    b.querySelector('.title').textContent = s.title;
    b.querySelector('.t').textContent = F.fmt(s.start);
    b.addEventListener('click', () => { seek(s.start + 0.01); $('scenesPanel').close(); setPlaying(true); });
    s.btn = b;
    li.appendChild(b);
    list.appendChild(li);
  });
  $('scenesBtn').addEventListener('click', () => $('scenesPanel').showModal());

  document.querySelectorAll('.panel .close').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));
  document.querySelectorAll('.panel').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));

  // keyboard
  window.addEventListener('keydown', (e) => {
    if (document.querySelector('dialog[open]')) return;
    if (e.target && (e.target.tagName === 'INPUT' && e.target.type !== 'range')) return;
    if (e.code === 'Space' || e.code === 'KeyK') { e.preventDefault(); setPlaying(!state.playing); }
    else if (e.code === 'ArrowLeft') { e.preventDefault(); seek(state.t - (e.shiftKey ? 15 : 5)); }
    else if (e.code === 'ArrowRight') { e.preventDefault(); seek(state.t + (e.shiftKey ? 15 : 5)); }
    else if (e.code === 'KeyM') setMuted(!F.sfx.muted);
    else if (e.code === 'KeyC') setCaptions(!state.captions);
    else if (e.code === 'Home') seek(0);
    else if (e.code === 'End') seek(F.TOTAL - 0.05);
    else if (e.code === 'PageDown' || e.code === 'KeyN') { const s = F.sceneAt(state.t); const n = F.SCRIPT[s.index + 1]; if (n) seek(n.start + 0.01); }
    else if (e.code === 'PageUp' || e.code === 'KeyP') { const s = F.sceneAt(state.t); const lt = state.t - s.start; const p = lt > 2 ? s : F.SCRIPT[s.index - 1] || s; seek(p.start + 0.01); }
  });

  function updateUi(scene) {
    if (!scrubbing) scrub.value = state.t;
    timeEl.textContent = F.fmt(state.t) + ' / ' + F.fmt(F.TOTAL);
    if (scene !== lastScene) {
      F.SCRIPT.forEach((s) => s.btn && s.btn.classList.toggle('current', s === scene));
      lastScene = scene;
    }
  }

  // start
  if (params.has('scene')) { const s = F.SCRIPT.find((x) => x.id === params.get('scene')); if (s) state.t = s.start + 0.01; }
  if (params.has('t')) state.t = F.clamp(+params.get('t') || 0, 0, F.TOTAL - 0.01);
  if (params.has('still')) $('splash').classList.add('hidden');
  render();
  requestAnimationFrame(frame);
})();
