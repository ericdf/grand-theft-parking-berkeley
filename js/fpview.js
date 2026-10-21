'use strict';
// First-person view switch for the city. The 3D renderer (js/fp3d.js + three.js) is loaded only
// the first time it's wanted; until it's ready, or if WebGL is unavailable, the city stays top-down.
(function () {
  const base = document.currentScript && document.currentScript.src;
  const F = (G.fpView = { inst: null, loading: false, failed: false, drew: false });

  F.wanted = () => G.settings.view === 'fp';

  F.active = function () {
    if (!F.wanted() || F.failed) return false;
    if (!F.inst) { F.load(); return false; }
    return true;
  };

  F.load = function () {
    if (F.loading) return;
    F.loading = true;
    import(new URL('fp3d.js', base || location.href).href)
      .then((m) => { F.inst = m.create(); })
      .catch((e) => {
        console.error('First-person view unavailable:', e);
        F.failed = true;
        G.settings.view = 'top';
        G.hud.toast('FIRST-PERSON VIEW NEEDS WEBGL. BACK TO THE AERIAL SURVEY.', { color: '#ffb3b3', dur: 4 });
      });
  };

  F.toggle = function () {
    G.settings.view = F.wanted() ? 'top' : 'fp';
    G.saveSettings();
    G.hud.toast(F.wanted() ? 'VIEW: FIRST PERSON (V to switch)' : 'VIEW: TOP-DOWN (V to switch)', { color: '#9be7ff', dur: 2 });
  };

  F.render = function (scene, ctx, vw, vh, dpr) {
    F.drew = true;
    F.inst.render(scene, ctx, vw, vh, dpr);
  };

  // called once per frame by the main loop: hide the 3D canvas whenever this frame didn't use it
  F.endFrame = function () {
    if (F.inst) F.inst.setVisible(F.drew);
    F.drew = false;
  };
})();
