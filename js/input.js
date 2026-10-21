'use strict';
// Keyboard + optional touch input. `down` is held state; `pressed` is edge-triggered for one frame.
(function () {
  const I = (G.input = {
    down: {},
    pressed: {},
    touch: { up: false, down: false, left: false, right: false, hand: false },
    enabled: true,
  });

  const GAME_KEYS = new Set([
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space',
    'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'Enter', 'KeyM', 'KeyP', 'Escape',
    'Digit1', 'Digit2', 'Digit3', 'KeyC', 'Numpad1', 'Numpad2', 'Numpad3', 'NumpadEnter',
  ]);

  Object.defineProperties(I, {
    up: { get() { return !!(this.down.ArrowUp || this.down.KeyW || this.touch.up); } },
    back: { get() { return !!(this.down.ArrowDown || this.down.KeyS || this.touch.down); } },
    left: { get() { return !!(this.down.ArrowLeft || this.down.KeyA || this.touch.left); } },
    right: { get() { return !!(this.down.ArrowRight || this.down.KeyD || this.touch.right); } },
    hand: { get() { return !!(this.down.Space || this.touch.hand); } },
  });

  I.was = function (...codes) {
    return codes.some((c) => this.pressed[c]);
  };
  I.interact = function () { return this.was('Enter', 'KeyE', 'NumpadEnter'); };
  I.endFrame = function () { this.pressed = {}; };
  I.clear = function () {
    this.down = {};
    this.pressed = {};
    for (const k in this.touch) this.touch[k] = false;
  };

  window.addEventListener('keydown', (e) => {
    G.audio.unlock();
    const modal = G.ui && G.ui.modalOpen();
    const ae = document.activeElement;
    const onButton = ae && (ae.tagName === 'BUTTON' || ae.tagName === 'INPUT' || ae.tagName === 'A');
    if (modal) {
      // Menus are ordinary DOM: let the browser handle Tab/Enter/Space; we only care about Escape.
      if (e.code === 'Escape' || e.code === 'KeyP') G.ui.onEscape(e);
      return;
    }
    const inCouncilUi = onButton && ae.closest && ae.closest('#council-ui');
    if (inCouncilUi && (e.code === 'Enter' || e.code === 'Space')) return; // activate the focused choice
    if (onButton && !inCouncilUi && GAME_KEYS.has(e.code)) ae.blur(); // HUD buttons must not eat driving keys
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    if (!e.repeat) I.pressed[e.code] = true;
    I.down[e.code] = true;
  });
  window.addEventListener('keyup', (e) => { I.down[e.code] = false; });
  window.addEventListener('blur', () => I.clear());
  window.addEventListener('pointerdown', () => G.audio.unlock(), { capture: true });

  // ---------- touch controls ----------
  I.setupTouch = function () {
    const wrap = document.getElementById('touch');
    if (!wrap) return;
    const coarse = (() => { try { return matchMedia('(pointer: coarse)').matches; } catch (e) { return false; } })();
    if (coarse || G.params.has('touch')) document.body.classList.add('has-touch');
    wrap.querySelectorAll('[data-t]').forEach((btn) => {
      const k = btn.dataset.t;
      const on = (ev) => {
        ev.preventDefault();
        G.audio.unlock();
        if (k === 'interact') { I.pressed.KeyE = true; return; }
        if (k === 'map') { I.pressed.KeyM = true; return; }
        I.touch[k] = true;
        btn.classList.add('on');
      };
      const off = (ev) => {
        ev.preventDefault();
        if (k in I.touch) I.touch[k] = false;
        btn.classList.remove('on');
      };
      btn.addEventListener('pointerdown', on);
      btn.addEventListener('pointerup', off);
      btn.addEventListener('pointercancel', off);
      btn.addEventListener('pointerleave', off);
    });
  };
})();
