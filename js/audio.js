'use strict';
// All sound is synthesized with WebAudio: no audio files, no licensing questions.
// Nothing plays until the first user gesture (browsers require it anyway).
(function () {
  const A = (G.audio = {
    ctx: null,
    master: null,
    sfxBus: null,
    musicBus: null,
    noiseBuf: null,
    mode: 'off',
    step: 0,
    nextTime: 0,
    timer: null,
    duck: 1,
  });

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  A.init = function () {
    if (this.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { this.ctx = new AC(); } catch (e) { return false; }
    const c = this.ctx;
    this.master = c.createGain();
    this.master.connect(c.destination);
    this.sfxBus = c.createGain();
    this.sfxBus.connect(this.master);
    this.musicBus = c.createGain();
    this.musicBus.connect(this.master);
    // a touch of "spring reverb" for the surf lead
    this.delay = c.createDelay(1);
    this.delay.delayTime.value = 0.17;
    this.fb = c.createGain();
    this.fb.gain.value = 0.32;
    this.delay.connect(this.fb);
    this.fb.connect(this.delay);
    this.delay.connect(this.musicBus);
    const len = c.sampleRate;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.applySettings();
    return true;
  };

  A.unlock = function () {
    if (!this.init()) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.wantMode && this.mode !== this.wantMode) this.setMusic(this.wantMode);
  };

  A.applySettings = function () {
    if (!this.ctx) return;
    const s = G.settings;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(s.muted ? 0 : 1, t, 0.02);
    this.sfxBus.gain.setTargetAtTime(s.sfx, t, 0.02);
    this.musicBus.gain.setTargetAtTime(s.music * 0.55 * this.duck, t, 0.05);
  };

  A.setDuck = function (v) {
    this.duck = v;
    this.applySettings();
  };

  // ---------- primitives ----------
  function env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  A.tone = function (freq, dur, o = {}) {
    if (!this.ctx) return;
    const c = this.ctx;
    const t = c.currentTime + (o.delay || 0) + (o.at ? o.at - c.currentTime : 0);
    const osc = c.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t + (o.slideTime || dur));
    if (o.vibrato) {
      const lfo = c.createOscillator();
      const lg = c.createGain();
      lfo.frequency.value = o.vibrato;
      lg.gain.value = o.vibDepth || freq * 0.03;
      lfo.connect(lg);
      lg.connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.05);
    }
    const g = c.createGain();
    env(g, t, o.attack || 0.005, o.vol || 0.3, dur);
    let node = osc;
    if (o.filter) {
      const f = c.createBiquadFilter();
      f.type = o.filterType || 'lowpass';
      f.frequency.setValueAtTime(o.filter, t);
      if (o.filterTo) f.frequency.exponentialRampToValueAtTime(o.filterTo, t + dur);
      f.Q.value = o.q || 1;
      osc.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(o.dest || this.sfxBus);
    if (o.send) g.connect(this.delay);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  };

  A.noise = function (dur, o = {}) {
    if (!this.ctx) return;
    const c = this.ctx;
    const t = c.currentTime + (o.delay || 0) + (o.at ? o.at - c.currentTime : 0);
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = o.type || 'bandpass';
    f.frequency.setValueAtTime(o.freq || 1000, t);
    if (o.freqTo) f.frequency.exponentialRampToValueAtTime(o.freqTo, t + dur);
    f.Q.value = o.q || 1;
    const g = c.createGain();
    env(g, t, o.attack || 0.003, o.vol || 0.3, dur);
    src.connect(f);
    f.connect(g);
    g.connect(o.dest || this.sfxBus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  };

  // ---------- sound effects ----------
  const lastPlayed = {};
  A.play = function (name, opt = {}) {
    if (!this.ctx || G.settings.muted) return;
    const now = this.ctx.currentTime;
    const minGap = { boing: 0.08, bonk: 0.09, cone: 0.05, blip: 0.03, bell: 0.3 }[name] || 0;
    if (lastPlayed[name] && now - lastPlayed[name] < minGap) return;
    lastPlayed[name] = now;
    switch (name) {
      case 'boing':
        this.tone(140, 0.42, { type: 'sine', slideTo: 620, slideTime: 0.12, vol: 0.45, vibrato: 28, vibDepth: 60 });
        this.tone(620, 0.3, { type: 'triangle', slideTo: 220, delay: 0.12, vol: 0.25 });
        break;
      case 'land':
        this.tone(130, 0.18, { slideTo: 45, vol: 0.5 });
        this.noise(0.1, { type: 'lowpass', freq: 500, vol: 0.35 });
        break;
      case 'stamp':
        this.noise(0.12, { type: 'lowpass', freq: 600, vol: 0.7 });
        this.tone(75, 0.22, { slideTo: 40, vol: 0.6 });
        this.noise(0.02, { type: 'highpass', freq: 3000, vol: 0.2 });
        break;
      case 'gavel':
        [0, 0.22].forEach((d) => {
          this.tone(320, 0.09, { type: 'triangle', vol: 0.45, delay: d, slideTo: 200 });
          this.noise(0.05, { type: 'bandpass', freq: 1200, q: 3, vol: 0.4, delay: d });
        });
        break;
      case 'bell':
        [0, 0.17].forEach((d) => {
          this.tone(2093, 0.55, { vol: 0.16, delay: d });
          this.tone(2637, 0.45, { vol: 0.1, delay: d });
          this.tone(4186, 0.2, { vol: 0.04, delay: d });
        });
        break;
      case 'bonk':
        this.noise(0.16, { type: 'bandpass', freq: 700, q: 1.5, vol: 0.55 });
        this.tone(95, 0.18, { slideTo: 50, vol: 0.5 });
        break;
      case 'cone':
        this.tone(520, 0.12, { type: 'triangle', slideTo: 260, vol: 0.35 });
        break;
      case 'poof':
        this.noise(0.4, { type: 'bandpass', freq: 300, freqTo: 2400, q: 0.8, vol: 0.45 });
        break;
      case 'blip':
        this.tone(880, 0.06, { type: 'square', vol: 0.08 });
        break;
      case 'select':
        this.tone(660, 0.07, { type: 'square', vol: 0.08 });
        this.tone(990, 0.08, { type: 'square', vol: 0.08, delay: 0.06 });
        break;
      case 'beep':
        this.tone(660, 0.16, { type: 'square', vol: 0.12, filter: 2000 });
        break;
      case 'go':
        this.tone(990, 0.45, { type: 'square', vol: 0.14, filter: 2500 });
        break;
      case 'horn':
        this.tone(349, 0.32, { type: 'square', vol: 0.12, filter: 1400 });
        this.tone(440, 0.32, { type: 'square', vol: 0.12, filter: 1400 });
        break;
      case 'plop':
        this.tone(700, 0.5, { slideTo: 55, vol: 0.5 });
        this.noise(0.3, { type: 'lowpass', freq: 400, vol: 0.4, delay: 0.15 });
        break;
      case 'score':
        this.tone(1046, 0.08, { type: 'square', vol: 0.07 });
        this.tone(1568, 0.12, { type: 'square', vol: 0.07, delay: 0.07 });
        break;
      case 'whoosh':
        this.noise(0.5, { type: 'bandpass', freq: 2500, freqTo: 300, q: 1.2, vol: 0.35 });
        break;
      case 'start': { // dun-dun-DUNNN mission sting
        const chords = [[40, 47, 52], [40, 47, 52], [41, 48, 53, 57]];
        chords.forEach((ch, k) => {
          const d = k * 0.16, len = k === 2 ? 0.9 : 0.12;
          ch.forEach((m) => this.tone(mtof(m + 12), len, { type: 'sawtooth', vol: 0.09, delay: d, filter: 600, filterTo: 3500 }));
        });
        this.noise(0.6, { type: 'lowpass', freq: 200, vol: 0.4, delay: 0.32 });
        break;
      }
      case 'passed': {
        const seq = [60, 64, 67, 72, 67, 72];
        const times = [0, 0.1, 0.2, 0.3, 0.48, 0.58];
        seq.forEach((m, i) => {
          const len = i === seq.length - 1 ? 0.8 : 0.12;
          this.tone(mtof(m), len, { type: 'square', vol: 0.08, delay: times[i], filter: 3000 });
          this.tone(mtof(m - 12), len, { type: 'triangle', vol: 0.12, delay: times[i] });
        });
        break;
      }
      case 'fail': // sad trombone
        [70, 69, 68].forEach((m, i) => this.tone(mtof(m - 12), 0.32, { type: 'sawtooth', vol: 0.12, delay: i * 0.34, filter: 1100 }));
        this.tone(mtof(55), 1.1, { type: 'sawtooth', vol: 0.12, delay: 1.02, filter: 1000, vibrato: 6, vibDepth: 6 });
        break;
      case 'buzzer':
        this.tone(110, 0.5, { type: 'sawtooth', vol: 0.15, filter: 900 });
        this.tone(116, 0.5, { type: 'sawtooth', vol: 0.15, filter: 900 });
        break;
      case 'applause':
        for (let i = 0; i < 40; i++) this.noise(0.05, { type: 'bandpass', freq: 1500 + Math.random() * 2500, q: 2, vol: 0.12 + Math.random() * 0.1, delay: Math.random() * 1.8 });
        break;
      case 'pop':
        this.noise(0.06, { type: 'highpass', freq: 1500, vol: 0.3 });
        break;
      case 'crowd': // polite murmur
        this.noise(1.2, { type: 'bandpass', freq: 500, q: 0.7, vol: 0.12, attack: 0.3 });
        break;
    }
  };

  // ---------- music: an original surf/funk loop ----------
  // 32 sixteenth-note steps (2 bars). Keys are step indices.
  const KICK = [0, 6, 10, 16, 22, 26, 29];
  const SNARE = [4, 12, 20, 28];
  const BASS = { 0: 40, 3: 40, 6: 43, 8: 45, 10: 40, 11: 52, 14: 47, 16: 40, 19: 40, 22: 43, 24: 45, 26: 47, 28: 50, 30: 47 };
  const LEAD = [ // [step, midi, length, tremolo]
    [0, 64, 2], [2, 67, 2], [4, 69, 1], [5, 71, 3], [8, 74, 2], [10, 71, 2], [12, 69, 2], [14, 67, 2],
    [16, 76, 4, true], [20, 74, 2], [22, 71, 2], [24, 69, 4, true], [28, 67, 2], [30, 64, 2],
  ];
  const STABS = [3, 7, 11, 15, 19, 23, 27];
  const MODES = {
    title: { bpm: 108, drums: 0.6, bass: 0.8, lead: 0.5, stabs: 1 },
    drive: { bpm: 112, drums: 1, bass: 1, lead: 0.7, stabs: 1 },
    council: { bpm: 84, drums: 0.25, bass: 0.6, lead: 0, stabs: 0.6, vibes: true },
    slalom: { bpm: 132, drums: 1.1, bass: 1, lead: 0.8, stabs: 1 },
    finale: { bpm: 116, drums: 0.9, bass: 0.9, lead: 0.9, stabs: 1 },
  };

  A.setMusic = function (mode) {
    this.wantMode = mode;
    if (!this.ctx) return;
    if (mode === this.mode) return;
    this.mode = mode;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (mode === 'off' || !MODES[mode]) return;
    this.step = 0;
    this.cycle = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    this.timer = setInterval(() => this._schedule(), 25);
  };

  A._schedule = function () {
    const c = this.ctx;
    const m = MODES[this.mode];
    if (!m) return;
    const stepDur = 60 / m.bpm / 4;
    while (this.nextTime < c.currentTime + 0.12) {
      this._playStep(this.step, this.nextTime, m, stepDur);
      this.nextTime += stepDur;
      this.step = (this.step + 1) % 32;
      if (this.step === 0) this.cycle++;
    }
  };

  A._playStep = function (s, t, m, sd) {
    const dest = this.musicBus;
    const transpose = this.cycle % 4 === 3 ? 5 : 0;
    if (m.drums) {
      if (KICK.includes(s)) this.tone(110, 0.16, { slideTo: 40, vol: 0.55 * m.drums, at: t, dest });
      if (SNARE.includes(s)) this.noise(0.12, { type: 'highpass', freq: 1200, vol: 0.3 * m.drums, at: t, dest });
      if (s % 2 === 0) this.noise(0.03, { type: 'highpass', freq: 7000, vol: 0.09 * m.drums, at: t, dest });
      if (s === 14 || s === 30) this.noise(0.12, { type: 'highpass', freq: 6000, vol: 0.08 * m.drums, at: t, dest });
    }
    if (m.bass && BASS[s] !== undefined) {
      const f = mtof(BASS[s] + transpose);
      this.tone(f, sd * 1.6, { type: 'square', vol: 0.12 * m.bass, at: t, filter: 520, dest });
      this.tone(f, sd * 1.8, { type: 'sine', vol: 0.22 * m.bass, at: t, dest });
    }
    if (m.stabs && this.cycle % 2 === 0 && STABS.includes(s)) {
      [64, 67, 71, 74].forEach((n) => this.tone(mtof(n + transpose - 12), 0.07, { type: 'square', vol: 0.025 * m.stabs, at: t, filter: 1800, dest }));
    }
    if (m.vibes && s % 8 === 0) {
      [64, 67, 71, 74].forEach((n, i) => this.tone(mtof(n), 0.9, { type: 'triangle', vol: 0.04, at: t + i * 0.02, dest }));
    }
    if (m.lead && this.cycle % 2 === 1) {
      for (const [st, note, len, trem] of LEAD) {
        if (st !== s) continue;
        const f = mtof(note + transpose);
        if (trem) {
          const n = len * 2;
          for (let k = 0; k < n; k++) this.tone(f, sd * 0.45, { type: 'sawtooth', vol: 0.045 * m.lead, at: t + (k * sd) / 2, filter: 2200, dest, send: true });
        } else {
          this.tone(f, sd * len * 0.95, { type: 'sawtooth', vol: 0.05 * m.lead, at: t, filter: 2400, filterTo: 900, dest, send: true });
        }
      }
    }
  };
})();
