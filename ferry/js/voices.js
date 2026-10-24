'use strict';
// Spoken lines from audio/voices (rendered by tools/build-voices.mjs), opt-in with ?voices while they're reviewed.
// Each clip starts when the clock crosses its cue; after a seek it picks up mid-line, so scrubbing stays in sync.
(function () {
  const V = (F.voices = { on: false });
  const buffers = {};
  const playing = new Map(); // key -> source node
  const played = new Set();  // keys already started since the last seek/pause
  let loading = false;

  V.enable = function () {
    if (V.on) return;
    V.on = true;
    const s = document.createElement('script');
    s.src = 'audio/voices/index.js';
    s.onload = () => V.load();
    document.head.appendChild(s);
  };

  // decode every clip once the audio context exists (it needs the first tap)
  V.load = function () {
    const ctx = F.sfx.ctx;
    if (loading || !ctx || !F.VOICE_LINES) return;
    loading = true;
    Object.entries(F.VOICE_LINES).forEach(([key, line]) => {
      fetch(line.src)
        .then((r) => r.arrayBuffer())
        .then((data) => new Promise((ok, fail) => ctx.decodeAudioData(data, ok, fail)))
        .then((buf) => { buffers[key] = buf; })
        .catch(() => {});
    });
  };

  function stopAll() {
    playing.forEach((src) => { try { src.stop(); } catch (e) { /* already ended */ } });
    playing.clear();
    played.clear();
  }

  V.update = function (t, isPlaying, jumped) {
    if (!V.on) return;
    if (jumped || !isPlaying) stopAll();
    if (!isPlaying || !F.VOICE_LINES) return;
    const ctx = F.sfx.ctx;
    if (!ctx) return;
    if (!loading) V.load();
    const scene = F.sceneAt(t), lt = t - scene.start;
    scene.cues.forEach((c, i) => {
      const key = scene.id + ':' + i, buf = buffers[key];
      if (!buf || played.has(key)) return;
      const off = lt - c.at;
      if (off < 0 || off > buf.duration - 0.05) return;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(F.sfx.gain);
      src.onended = () => { if (playing.get(key) === src) playing.delete(key); };
      src.start(0, off);
      playing.set(key, src);
      played.add(key);
    });
  };
})();
