'use strict';
// Tiny original sound effects synthesized with WebAudio (no samples, no licensed music).
// Played only during forward playback when the clock crosses an sfx cue that names a `snd`.
(function () {
  const S = (F.sfx = { ctx: null, gain: null, volume: 0.8, muted: false });

  S.unlock = () => {
    // iPhone: play through the ring/silent switch, like a video would
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* older Safari */ }
    if (S.ctx) { if (S.ctx.state === 'suspended') S.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    S.ctx = new AC();
    S.gain = S.ctx.createGain();
    S.gain.connect(S.ctx.destination);
    S.apply();
    // a silent blip inside the tap that unlocked us keeps older iOS from staying muted
    const src = S.ctx.createBufferSource();
    src.buffer = S.ctx.createBuffer(1, 1, 22050);
    src.connect(S.ctx.destination);
    src.start(0);
  };
  S.apply = () => { if (S.gain) S.gain.gain.value = S.muted ? 0 : S.volume * 0.5; };

  const tone = (freq, dur, o = {}) => {
    const c = S.ctx, t0 = c.currentTime + (o.delay || 0);
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.3, t0 + (o.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(S.gain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  };
  const noise = (dur, o = {}) => {
    const c = S.ctx, t0 = c.currentTime + (o.delay || 0);
    const len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
    src.buffer = buf;
    f.type = o.filter || 'lowpass';
    f.frequency.value = o.freq || 1200;
    g.gain.setValueAtTime(o.vol || 0.25, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(S.gain);
    src.start(t0);
  };

  const SOUNDS = {
    stamp: () => { noise(0.25, { freq: 300, vol: 0.6 }); tone(70, 0.3, { type: 'sine', vol: 0.6 }); },
    thump: () => { tone(90, 0.35, { to: 40, vol: 0.5 }); noise(0.15, { freq: 400, vol: 0.3 }); },
    sparkle: () => [0, 0.06, 0.12, 0.18, 0.24].forEach((d, i) => tone(1800 + i * 300, 0.25, { delay: d, vol: 0.08, type: 'triangle' })),
    harp: () => [0, 2, 4, 7, 9, 12, 14, 16].forEach((n, i) => tone(392 * Math.pow(2, n / 12), 0.9, { delay: i * 0.08, vol: 0.12, type: 'triangle' })),
    fanfare: () => [[523, 0], [659, 0.14], [784, 0.28], [1047, 0.46]].forEach(([f, d]) => tone(f, d === 0.46 ? 0.7 : 0.18, { delay: d, vol: 0.14, type: 'square' })),
    horn: () => { tone(110, 1.2, { type: 'sawtooth', vol: 0.18, attack: 0.08 }); tone(138, 1.2, { type: 'sawtooth', vol: 0.12, attack: 0.08 }); },
    whistle: () => { tone(880, 0.35, { type: 'square', vol: 0.08 }); tone(1100, 0.45, { type: 'square', vol: 0.08, delay: 0.3 }); },
    honk: () => [0, 0.25, 0.6].forEach((d, i) => tone(i % 2 ? 330 : 392, 0.18, { delay: d, type: 'square', vol: 0.1 })),
    coins: () => [0, 0.08, 0.15, 0.24].forEach((d) => tone(2200 + Math.random() * 600, 0.12, { delay: d, vol: 0.08, type: 'triangle' })),
    ching: () => { tone(1568, 0.5, { type: 'triangle', vol: 0.15 }); tone(2093, 0.6, { type: 'triangle', vol: 0.12, delay: 0.08 }); },
    slurp: () => tone(500, 0.5, { to: 120, type: 'sawtooth', vol: 0.08 }),
    squeak: () => tone(1400, 0.18, { to: 2000, type: 'triangle', vol: 0.12 }),
    cough: () => [0, 0.28].forEach((d) => noise(0.16, { freq: 900, vol: 0.35, delay: d })),
    applause: () => { for (let i = 0; i < 14; i++) noise(0.05, { freq: 2500, filter: 'bandpass', vol: 0.12, delay: i * 0.07 + Math.random() * 0.04 }); },
    unroll: () => noise(0.9, { freq: 3000, filter: 'highpass', vol: 0.08 }),
    crunch: () => { noise(0.5, { freq: 700, vol: 0.5 }); tone(60, 0.5, { vol: 0.4 }); },
    chug: () => [0, 0.25, 0.5, 0.75].forEach((d) => noise(0.12, { freq: 500, vol: 0.25, delay: d })),
    splash: () => noise(0.8, { freq: 1500, vol: 0.3 }),
    glorp: () => tone(220, 0.8, { to: 55, type: 'sine', vol: 0.4 }),
    whoosh: () => noise(0.6, { freq: 1800, filter: 'bandpass', vol: 0.25 }),
    rattle: () => [0, 0.07, 0.14, 0.21].forEach((d) => noise(0.05, { freq: 1500, vol: 0.3, delay: d })),
    zip: () => tone(1200, 0.4, { to: 200, type: 'sawtooth', vol: 0.06 }),
    clunk: () => { tone(140, 0.2, { vol: 0.4 }); noise(0.1, { freq: 600, vol: 0.3 }); },
    brakes: () => tone(2400, 0.6, { to: 1800, type: 'sawtooth', vol: 0.04 }),
    machine: () => [0, 0.2, 0.4, 0.6, 0.8].forEach((d) => tone(150, 0.12, { delay: d, type: 'square', vol: 0.06 })),
    ding: () => tone(1318, 0.6, { type: 'triangle', vol: 0.15 }),
    alarm: () => [0, 0.4, 0.8, 1.2].forEach((d) => tone(880, 0.3, { delay: d, type: 'square', vol: 0.07, to: 660 })),
    boing: () => tone(180, 0.5, { to: 600, type: 'sine', vol: 0.3 }),
    kazoo: () => [0, 0.18, 0.36].forEach((d, i) => tone([392, 440, 523][i], 0.2, { delay: d, type: 'sawtooth', vol: 0.06 })),
    wind: () => noise(1.6, { freq: 500, vol: 0.12 }),
    siren: () => [0, 0.5, 1.0].forEach((d) => tone(700, 0.45, { delay: d, to: 1000, type: 'triangle', vol: 0.08 })),
    powerdown: () => tone(600, 1.2, { to: 40, type: 'sawtooth', vol: 0.1 }),
    click: () => [0, 0.6].forEach((d) => tone(2000, 0.04, { delay: d, type: 'square', vol: 0.1 })),
    gulls: () => [0, 0.5].forEach((d) => tone(1500, 0.3, { delay: d, to: 1100, type: 'triangle', vol: 0.05 })),
    gull1: () => tone(1500, 0.4, { to: 1000, type: 'triangle', vol: 0.05 }),
    rewind: () => tone(300, 1.4, { to: 1800, type: 'sawtooth', vol: 0.05 }),
    projector: () => { for (let i = 0; i < 16; i++) noise(0.03, { freq: 2000, vol: 0.1, delay: i * 0.1 }); },
  };

  S.play = (name) => {
    if (!S.ctx || S.muted || !SOUNDS[name]) return;
    try { SOUNDS[name](); } catch (e) { /* audio is optional */ }
  };
})();
