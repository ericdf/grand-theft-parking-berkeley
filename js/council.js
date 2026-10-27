'use strict';
// Mission 3 — Council of Infinite Process. A static comic-panel scene with a dialogue minigame.
// Every member is a fictional archetype; the satire targets process, not people.
(function () {
  const MEMBERS = [
    { title: ['THE CONSULTANT', 'WHISPERER'], suit: '#1d3557', skin: '#e0ac69', hair: '#a8a8a8', acc: 'headset' },
    { title: ['THE MOTION-TO-TABLE', 'MACHINE'], suit: '#4f5b66', skin: '#8d5524', hair: '#2b1d12', acc: 'gavel' },
    { title: ['THE VISION-ZERO', 'VISIONARY'], suit: '#2a9d8f', skin: '#c68642', hair: '#1a1a1a', acc: 'helmet' },
    { title: ['THE UNANIMOUS', 'ABSTAINER'], suit: '#7b2d26', skin: '#f1c27d', hair: '#b5651d', acc: 'shrug' },
  ];
  G.COUNCIL = MEMBERS;
  const MX = [270, 515, 765, 1010];

  const PLAYER_LINES = [
    'I would like one (1) parking space.',
    'Could someone fill the pothole on Hopkins?',
    'Is there a form to request the form?',
    "I'm double-parked right now, actually.",
    'What if we just… paved it?',
    'My pizza is getting cold. Hypothetically.',
    'Can I appeal the appeal?',
    'Has anyone here tried asphalt?',
    'I brought Form 27-B. All 14 pages.',
    'I support the plan. Which plan? Any plan.',
  ];
  // the way out: a plain request, in the same list, from the second round on
  const PLAIN_LINE = 'Hi. I just want to park on Hopkins and buy one slice at Gioia.';

  const RESPONSES = [
    { m: 0, text: 'We hear your concern. We have commissioned a framework for hearing it.', stamp: 'STUDIED' },
    { m: 2, text: 'The parking space has been converted into a pilot program.', stamp: 'REIMAGINED' },
    { m: 0, text: 'We are proud to announce a task force on the implementation of the previous task force.', stamp: 'REFERRED', committee: 'Task Force on Task Force Implementation' },
    { m: 1, text: 'Motion to table. Seconded. Tabled. Next speaker.', stamp: 'TABLED' },
    { m: 3, text: 'I abstain, in solidarity with everyone.', stamp: 'ABSTAINED' },
    { m: 2, text: "In the future there will be no cars, and therefore no parking problem. You're welcome.", stamp: 'REIMAGINED' },
    { m: 0, text: 'Our consultants recommend hiring consultants to recommend consultants.', stamp: 'STUDIED', committee: 'Consultant Selection Advisory Panel' },
    { m: 1, text: 'This item is referred to the Subcommittee on Referrals.', stamp: 'REFERRED', committee: 'Subcommittee on Referrals' },
    { m: 3, text: "I'd like to thank staff, the public, and the concept of time.", stamp: 'ACKNOWLEDGED' },
    { m: 2, text: "We'll paint a parking space on Hopkins as a temporary art installation.", stamp: 'REIMAGINED' },
    { m: 1, text: "Let's continue this to a meeting yet to be scheduled by a committee yet to be formed.", stamp: 'CONTINUED', committee: 'Committee to Schedule the Meeting' },
    { m: 3, text: 'I support this in principle and oppose it in practice.', stamp: 'NOTED' },
    { m: 1, text: 'Please direct questions about the tent to the Tent Subcommittee. It meets in a smaller tent.', stamp: 'REFERRED', committee: 'Tent Subcommittee' },
    { m: 0, text: 'Our seismic consultant recommends we keep studying the rubble until it feels heard.', stamp: 'STUDIED' },
    { m: 0, text: 'Good news: the 2019 parking study now has its own parking study.', stamp: 'STUDIED' },
    { m: 2, text: 'Have you considered simply being a bicycle?', stamp: 'REIMAGINED' },
  ];
  const SILENCE = { m: 1, text: 'The chair interprets your silence as support for further study.', stamp: 'STUDIED' };

  const STAMP_COLORS = {
    REFERRED: '#c1121f', STUDIED: '#1d4ed8', REIMAGINED: '#7b2cbf', TABLED: '#7f4f24', CONTINUED: '#e85d04',
    ABSTAINED: '#555', ACKNOWLEDGED: '#0f766e', NOTED: '#111', 'APPROVED*': '#15803d',
  };

  // ---------- front-view caricature (shared with the finale) ----------
  G.drawCouncilMember = function (ctx, m, x, y, t, speaking, o = {}) {
    const bob = speaking ? Math.sin(t * 9) * 4 : Math.sin(t * 1.5 + x) * 1.2;
    ctx.save();
    ctx.translate(x, y + bob);
    // shoulders
    ctx.fillStyle = m.suit;
    G.rr(ctx, -58, 18, 116, 110, 30);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(-16, 18); ctx.lineTo(0, 52); ctx.lineTo(16, 18); ctx.fill();
    ctx.fillStyle = m.acc === 'helmet' ? '#ffd23f' : '#c1121f';
    ctx.beginPath(); ctx.moveTo(-4, 24); ctx.lineTo(4, 24); ctx.lineTo(6, 50); ctx.lineTo(0, 56); ctx.lineTo(-6, 50); ctx.fill();
    // neck + head
    ctx.fillStyle = m.skin;
    ctx.fillRect(-9, 4, 18, 18);
    ctx.beginPath(); ctx.ellipse(0, -18, 30, 34, 0, 0, Math.PI * 2); ctx.fill();
    // hair
    ctx.fillStyle = m.hair;
    if (m.acc === 'headset') {
      ctx.beginPath(); ctx.ellipse(0, -42, 30, 14, 0, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillRect(-30, -44, 60, 6);
    } else if (m.acc === 'gavel') {
      ctx.beginPath(); ctx.ellipse(0, -36, 33, 22, 0, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillRect(-33, -38, 8, 30);
      ctx.fillRect(25, -38, 8, 30);
    } else if (m.acc === 'shrug') {
      for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.arc(k * 9, -46 + Math.abs(k) * 3, 10, 0, Math.PI * 2); ctx.fill(); }
    }
    // eyes / brows / mouth
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(-11, -20, 3.2, 0, Math.PI * 2); ctx.arc(11, -20, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = m.acc === 'shrug' ? 4 : 2.5;
    ctx.beginPath();
    const brow = m.acc === 'shrug' ? -6 : 0;
    ctx.moveTo(-18, -29 + brow); ctx.lineTo(-5, -31 + brow * 0.3);
    ctx.moveTo(5, -31 + brow * 0.3); ctx.lineTo(18, -29 + brow);
    ctx.stroke();
    if (speaking) {
      const open = 2 + Math.abs(Math.sin(t * 16)) * 7;
      ctx.fillStyle = '#5a1a1a';
      ctx.beginPath(); ctx.ellipse(0, -4, 8, open, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (m.acc === 'shrug') { ctx.moveTo(-8, -4); ctx.lineTo(8, -6); }
      else ctx.arc(0, -10, 9, 0.25 * Math.PI, 0.75 * Math.PI);
      ctx.stroke();
    }
    // accessories
    if (m.acc === 'headset') {
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, -22, 34, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-31, -16); ctx.quadraticCurveTo(-28, 0, -10, 0); ctx.stroke();
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(-9, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e9c46a';
      ctx.save();
      ctx.translate(40, 70);
      ctx.rotate(-0.2);
      ctx.fillRect(-18, -24, 36, 46);
      ctx.fillStyle = '#111';
      ctx.font = G.font(7);
      ctx.textAlign = 'center';
      ctx.fillText('FRAME-', 0, -6);
      ctx.fillText('WORK v9', 0, 4);
      ctx.restore();
    } else if (m.acc === 'gavel') {
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 3;
      ctx.strokeRect(-20, -26, 16, 11);
      ctx.strokeRect(4, -26, 16, 11);
      ctx.beginPath(); ctx.moveTo(-4, -21); ctx.lineTo(4, -21); ctx.stroke();
      const swing = speaking || o.gavel ? Math.sin(t * 14) * 0.6 : 0;
      ctx.save();
      ctx.translate(58, 40);
      ctx.rotate(-0.6 + swing);
      ctx.fillStyle = '#6d4c41';
      ctx.fillRect(-3, -40, 6, 40);
      ctx.fillStyle = '#8d6e63';
      G.rr(ctx, -16, -52, 32, 16, 4);
      ctx.fill();
      ctx.restore();
    } else if (m.acc === 'helmet') {
      ctx.fillStyle = '#ff6f59';
      ctx.beginPath(); ctx.ellipse(0, -40, 36, 22, 0, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd6cc';
      for (let k = -2; k <= 2; k++) ctx.fillRect(k * 11 - 3, -58, 6, 14);
      ctx.fillStyle = 'rgba(80,200,255,0.75)';
      G.rr(ctx, -26, -28, 52, 16, 7);
      ctx.fill();
      ctx.strokeStyle = '#0a3d62';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (m.acc === 'shrug') {
      ctx.fillStyle = m.skin;
      const lift = Math.sin(t * 2) * 4;
      [[-1, 1], [1, 1]].forEach(([s]) => {
        ctx.beginPath(); ctx.ellipse(s * 72, 4 + lift, 12, 10, 0, 0, Math.PI * 2); ctx.fill();
      });
      ctx.strokeStyle = m.suit;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(-50, 40); ctx.lineTo(-70, 12 + lift);
      ctx.moveTo(50, 40); ctx.lineTo(70, 12 + lift);
      ctx.stroke();
    }
    if (o.vote) {
      ctx.fillStyle = m.skin;
      ctx.beginPath(); ctx.ellipse(-62, -40, 11, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = m.suit;
      ctx.lineWidth = 12;
      ctx.beginPath(); ctx.moveTo(-50, 30); ctx.lineTo(-62, -30); ctx.stroke();
    }
    ctx.restore();
  };

  G.drawSpeech = function (ctx, x, y, text, o = {}) {
    const maxW = o.maxW || 360;
    const fs = o.size || 19;
    ctx.save();
    ctx.font = G.font(fs, 800);
    const lines = G.wrapText(ctx, text, maxW);
    const w = Math.min(maxW, Math.max(...lines.map((l) => ctx.measureText(l).width))) + 30;
    const h = lines.length * (fs + 6) + 22;
    let bx = G.clamp(x - w / 2, 14, (o.vw || 1280) - w - 14);
    const by = o.below ? y : y - h;
    ctx.fillStyle = o.bg || '#fff';
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 3;
    G.rr(ctx, bx, by, w, h, 14);
    ctx.fill();
    ctx.stroke();
    // tail
    const tx = G.clamp(x, bx + 20, bx + w - 20);
    ctx.beginPath();
    if (o.below) { ctx.moveTo(tx - 10, by + 1); ctx.lineTo(tx, by - 16); ctx.lineTo(tx + 10, by + 1); }
    else { ctx.moveTo(tx - 10, by + h - 1); ctx.lineTo(tx, by + h + 16); ctx.lineTo(tx + 10, by + h - 1); }
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = o.color || '#111';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, bx + w / 2, by + 11 + (fs + 6) * (i + 0.5)));
    ctx.restore();
  };

  // ---------- scene ----------
  const C = {};
  G.scenes.council = C;

  C.enter = function () {
    G.game.setCheckpoint('council');
    this.t = 0;
    this.state = 'intro';
    this.st = 0;
    this.meeting = 95;
    this.round = 0;
    this.stamps = [];
    this.bubble = null;
    this.playerBubble = null;
    this.speaking = -1;
    this.deck = G.shuffle(RESPONSES);
    this.deckIdx = 0;
    this.card = null;
    this.shake = 0;
    this.events = {};
    G.hud.reset();
    G.hud.setTicker(null);
    G.hud.banner('MISSION START', 'COUNCIL OF INFINITE PROCESS', { sting: 'start', dur: 2.6 });
    G.hud.setObjective('OBTAIN AN EMERGENCY PARKING EXEMPTION', 'Choose what to say (1/2/3) before the meeting adjourns.');
    G.hud.toast('COUNCIL NOW MEETING IN TEMPORARY CHAMBERS. CLOWNS ARE NOT COUNCIL MEMBERS (PENDING REVIEW).', { color: '#ff9ad5', dur: 5 });
    G.audio.setMusic('council');
    G.audio.play('crowd');
    this.setupDom();
    this.ui.hidden = false;
    this.showChoices(false);
  };

  C.exit = function () {
    if (this.ui) this.ui.hidden = true;
  };

  C.setupDom = function () {
    if (this.ui) return;
    this.ui = document.getElementById('council-ui');
    this.choiceBtns = [...this.ui.querySelectorAll('.choice')];
    this.timerBar = document.getElementById('choiceTimer');
    this.choiceBtns.forEach((b, i) => b.addEventListener('click', () => this.choose(i)));
  };

  C.showChoices = function (on) {
    this.ui.querySelector('#choices').hidden = !on;
  };

  C.say = function (m, text) {
    this.speaking = m;
    this.bubble = { m, text };
  };

  C.toState = function (s) {
    this.state = s;
    this.st = 0;
    this.events = {};
  };
  C.once = function (key, at) {
    if (this.st >= at && !this.events[key]) { this.events[key] = true; return true; }
    return false;
  };

  C.addStamp = function (text) {
    const k = this.stamps.length;
    this.stamps.push({
      text,
      color: STAMP_COLORS[text] || '#c1121f',
      x: 95 + (k % 2) * 92 + Math.random() * 20,
      y: 500 + (Math.floor(k / 2) % 4) * 42 + Math.random() * 10,
      rot: (Math.random() - 0.5) * 0.6,
      t: 0,
    });
    G.audio.play('stamp');
    this.shake = 6;
  };

  C.openChoices = function () {
    this.toState('choose');
    this.chooseT = 9;
    this.options = G.shuffle(PLAYER_LINES).slice(0, 3);
    if (this.round > 0) this.options[Math.floor(Math.random() * 3)] = PLAIN_LINE;
    this.choiceBtns.forEach((b, i) => {
      b.textContent = i + 1 + ' · ' + this.options[i];
      b.classList.remove('picked');
    });
    this.showChoices(true);
    this.choiceBtns[0].focus({ preventScroll: true });
  };

  // autopilot (WATCH): two rounds of clever lines, then the plain request
  C.autoChoice = function () {
    const plain = this.options.indexOf(PLAIN_LINE);
    return this.round >= 2 && plain >= 0 ? plain : this.options.findIndex((o) => o !== PLAIN_LINE);
  };

  C.choose = function (i) {
    if (this.state !== 'choose') return;
    G.audio.play('select');
    this.showChoices(false);
    this.speaking = -1;
    this.bubble = null;
    this.playerBubble = this.options[i];
    this.toState(this.options[i] === PLAIN_LINE ? 'pc' : 'player');
  };

  C.update = function (dt) {
    this.t += dt;
    this.st += dt;
    this.shake *= Math.exp(-10 * dt);
    for (const s of this.stamps) s.t += dt;
    const inp = G.input;

    if (this.state === 'choose') {
      if (inp.was('Digit1', 'Numpad1')) this.choose(0);
      else if (inp.was('Digit2', 'Numpad2')) this.choose(1);
      else if (inp.was('Digit3', 'Numpad3')) this.choose(2);
    }
    if (inp.was('KeyO')) {
      G.settings.autopilot = !G.settings.autopilot;
      G.saveSettings();
      G.hud.toast(G.settings.autopilot ? 'AUTOPILOT ENGAGED. IT HAS SAT THROUGH WORSE MEETINGS.' : 'AUTOPILOT OFF. THE FLOOR IS YOURS.', { color: '#9be7ff', dur: 2.5 });
      if (!G.settings.autopilot) this.choiceBtns.forEach((b) => b.classList.remove('picked'));
    }

    const meetingRuns = ['choose', 'player', 'response'].includes(this.state);
    if (meetingRuns) {
      this.meeting -= dt;
      if (this.meeting <= 0) this.adjourn();
    }

    switch (this.state) {
      case 'intro':
        if (this.once('chair', 1.4)) { this.say(1, 'The chair recognizes a member of the public. Briefly.'); G.audio.play('gavel'); }
        if (this.st > 4.2) this.openChoices();
        break;
      case 'choose':
        this.chooseT -= dt;
        this.timerBar.style.width = Math.max(0, (this.chooseT / 9) * 100) + '%';
        if (G.settings.autopilot) {
          // hover on the pick long enough to read it, then say it
          const pick = this.autoChoice();
          if (this.st > 2.2) this.choiceBtns[pick].classList.add('picked');
          if (this.st > 3.2) { this.choose(pick); break; }
        }
        if (this.chooseT <= 0) {
          this.showChoices(false);
          this.playerBubble = '…';
          this.forced = SILENCE;
          this.toState('player');
        }
        break;
      case 'player':
        if (this.st > 1.3) {
          const r = this.forced || this.deck[this.deckIdx++ % this.deck.length];
          this.forced = null;
          this.current = r;
          this.playerBubble = null;
          this.say(r.m, r.text);
          if (r.stamp === 'TABLED') G.audio.play('gavel');
          this.toState('response');
        }
        break;
      case 'response':
        if (this.once('stamp', 1.0)) {
          this.addStamp(this.current.stamp);
          if (this.current.committee) G.formCommittee(this.current.committee);
        }
        if (this.st > 3.2) {
          this.round++;
          this.openChoices();
        }
        break;
      case 'pc':
        this.updatePublicComment(dt);
        break;
      case 'adjourned':
        if (this.st > 3.6) G.game.retry();
        break;
    }
  };

  C.updatePublicComment = function (dt) {
    if (this.once('buzz', 3.0)) {
      G.audio.play('buzzer');
      this.playerBubble = null;
      this.say(1, 'Thank you. Your comment has been entered into the record, and also into a different record.');
    }
    if (this.once('vote', 6.4)) {
      G.audio.play('gavel');
      this.say(1, 'The motion passes unanimously, with no action authorized.');
      this.voting = true;
    }
    if (this.once('approved', 7.4)) this.addStamp('APPROVED*');
    if (this.once('cone', 10)) {
      this.voting = false;
      this.speaking = -1;
      this.bubble = null;
      this.card = { kind: 'cone', t: 0, title: 'YOU RECEIVED', text: 'ONE (1) CEREMONIAL TRAFFIC CONE' };
      G.stats.cones = 1;
      G.audio.play('score');
      G.formCommittee('Ad Hoc Subcommittee on Ceremonial Cones');
      G.addStar('PUBLIC COMMENT ENTERED INTO THE RECORD');
    }
    if (this.once('passed', 12.6)) {
      G.hud.banner('MISSION PASSED', 'EXEMPTION DENIED. CONE GRANTED.', { sting: 'passed', dur: 2.8, color: '#7CFC00' });
    }
    if (this.once('slice', 15.6)) {
      this.card = { kind: 'slice', t: 0, title: 'OUTSIDE THE TENT…', text: 'A PILOT-PROGRAM PIZZA CART ISSUES YOU ONE (1) PROVISIONAL SLICE' };
      G.audio.play('select');
    }
    if (this.once('go', 19.6)) G.game.go('slalom');
    if (this.card) this.card.t += dt;
  };

  C.adjourn = function () {
    if (this.state === 'adjourned') return;
    this.showChoices(false);
    this.say(1, 'We are out of time. This item is continued to a future meeting.');
    G.audio.play('gavel');
    G.hud.banner('MEETING ADJOURNED', 'ITEM CONTINUED TO A FUTURE MEETING. RETRYING FROM CHECKPOINT…', { sting: 'fail', dur: 3.4, color: '#ff5a5a' });
    this.toState('adjourned');
  };

  // ---------- rendering ----------
  C.render = function (ctx, vw, vh, dpr) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, vw, vh);
    const s = Math.min(vw / 1280, vh / 720);
    const ox = (vw - 1280 * s) / 2;
    const oy = Math.max(0, (vh - 720 * s) / 2 - (vh > 720 * s + 120 ? 60 : 0));
    const sh = G.settings.reducedMotion ? 0 : this.shake;
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * (ox + (Math.random() - 0.5) * sh), dpr * (oy + (Math.random() - 0.5) * sh));
    this.drawRoom(ctx);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    G.hud.drawObjective(ctx, vw);
    G.hud.drawStars(ctx, vw);
    if (G.settings.autopilot && this.state === 'choose') G.hud.drawAutopilot(ctx, vw, vh - 200, this.t);
    G.hud.drawToasts(ctx, vw, vh);
    G.hud.drawBanner(ctx, vw, vh);
  };

  C.drawRoom = function (ctx) {
    const t = this.t;
    // inside the temporary big top: striped canvas converging on the center pole
    ctx.fillStyle = '#fff4e0';
    ctx.fillRect(0, 0, 1280, 400);
    for (let k = -8; k < 9; k++) {
      if (k % 2) continue;
      ctx.fillStyle = '#c1121f';
      ctx.beginPath();
      ctx.moveTo(640 + k * 22, -40);
      ctx.lineTo(640 + (k + 1) * 22, -40);
      ctx.lineTo(640 + (k + 1) * 150, 400);
      ctx.lineTo(640 + k * 150, 400);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, 0, 1280, 400);
    // tent poles and bunting
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(116, 0, 14, 400);
    ctx.fillRect(1150, 0, 14, 400);
    for (let k = 0; k < 24; k++) {
      ctx.fillStyle = ['#ffd23f', '#1d6fe0', '#2a9d8f', '#ff5ea8'][k % 4];
      const bx = 130 + k * 42;
      const by = 12 + Math.sin((k / 23) * Math.PI) * 30;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 30, by + 2); ctx.lineTo(bx + 15, by + 22); ctx.closePath(); ctx.fill();
    }
    // a clown peeks in from behind the dais, every so often
    const peek = Math.max(0, Math.sin(t * 0.7)) ** 6;
    if (peek > 0.02) G.drawClownFace(ctx, 1210, 300 - peek * 70, 0.9);
    // seal
    ctx.save();
    ctx.translate(640, 100);
    ctx.fillStyle = '#1d3557';
    ctx.beginPath(); ctx.arc(0, 0, 74, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e9c46a';
    ctx.beginPath(); ctx.arc(0, 0, 60, 0, Math.PI * 2); ctx.fill();
    G.drawConeIcon(ctx, 0, 6, 1.1);
    ctx.fillStyle = '#e9c46a';
    ctx.font = G.font(10);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SEAL OF PERPETUAL PROCESS', 0, -66 + 0.5);
    ctx.fillStyle = '#1d3557';
    ctx.fillText('EST. TBD', 0, -38);
    ctx.restore();
    // banner + clock
    ctx.fillStyle = '#1d3557';
    ctx.fillRect(1062, 172, 210, 34);
    ctx.fillStyle = '#fff';
    ctx.font = G.font(13);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AGENDA ITEM 47(c)(ii)(b)', 1167, 190);
    ctx.save();
    ctx.translate(1170, 80);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(t * 6) * 30, Math.sin(t * 6) * 30); ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(t * 0.5) * 20, Math.sin(t * 0.5) * 20); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = this.meeting < 15 ? '#ff5a5a' : '#fff';
    ctx.font = G.font(14);
    ctx.fillText('ADJOURNS IN ' + G.fmtTime(this.meeting), 1170, 145);

    // members
    MEMBERS.forEach((m, i) => G.drawCouncilMember(ctx, m, MX[i], 240, t, this.speaking === i, { vote: this.voting && i !== 3, gavel: this.voting && i === 1 }));
    // dais
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(120, 300, 1040, 100);
    ctx.fillStyle = '#a9713c';
    ctx.fillRect(110, 292, 1060, 16);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    for (let x = 200; x < 1160; x += 120) { ctx.beginPath(); ctx.moveTo(x, 310); ctx.lineTo(x, 400); ctx.stroke(); }
    MEMBERS.forEach((m, i) => {
      ctx.fillStyle = '#222';
      ctx.fillRect(MX[i] - 30, 270, 4, 26);
      ctx.beginPath(); ctx.arc(MX[i] - 28, 268, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f8f4e3';
      ctx.fillRect(MX[i] - 95, 318, 190, 44);
      ctx.strokeStyle = '#3b2410';
      ctx.strokeRect(MX[i] - 95, 318, 190, 44);
      ctx.fillStyle = '#222';
      ctx.font = G.font(13);
      m.title.forEach((l, k) => ctx.fillText(l, MX[i], 332 + k * 17));
    });
    // carpet
    ctx.fillStyle = '#d9b77e';
    ctx.fillRect(0, 400, 1280, 320);
    ctx.fillStyle = 'rgba(120,80,30,0.18)';
    for (let k = 0; k < 160; k++) ctx.fillRect((k * 367) % 1280, 405 + ((k * 211) % 310), 6, 2);
    ctx.strokeStyle = '#c1121f';
    ctx.lineWidth = 14;
    ctx.beginPath(); ctx.ellipse(640, 760, 560, 300, 0, Math.PI, Math.PI * 2); ctx.stroke();
    // application form
    ctx.save();
    ctx.translate(60, 420);
    ctx.rotate(-0.04);
    ctx.fillStyle = '#fdfdf7';
    ctx.fillRect(0, 0, 250, 270);
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    for (let y = 70; y < 260; y += 16) { ctx.beginPath(); ctx.moveTo(14, y); ctx.lineTo(236, y); ctx.stroke(); }
    ctx.fillStyle = '#111';
    ctx.font = G.font(12);
    ctx.textAlign = 'left';
    ctx.fillText('EMERGENCY PARKING', 14, 22);
    ctx.fillText('EXEMPTION — FORM 27-B', 14, 40);
    ctx.font = G.font(9, 700);
    ctx.fillText('Page 1 of 14 (double-sided)', 14, 56);
    ctx.restore();
    for (const st of this.stamps) {
      const sc = G.settings.reducedMotion ? 1 : 1 + 2 * (1 - G.smoothstep(st.t / 0.15));
      ctx.save();
      ctx.translate(st.x + 30, st.y);
      ctx.rotate(st.rot);
      ctx.scale(sc, sc);
      ctx.globalAlpha = Math.min(1, st.t / 0.1 + 0.2) * 0.9;
      ctx.font = G.condensed(20);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const w = ctx.measureText(st.text).width + 16;
      ctx.strokeStyle = st.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(-w / 2, -15, w, 30);
      ctx.fillStyle = st.color;
      ctx.fillText(st.text, 0, 1);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    // podium + player
    ctx.fillStyle = '#3b2410';
    ctx.beginPath();
    ctx.moveTo(560, 720); ctx.lineTo(580, 600); ctx.lineTo(700, 600); ctx.lineTo(720, 720);
    ctx.fill();
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(570, 592, 140, 14);
    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(636, 560, 6, 36);
    ctx.fillStyle = '#4a7bd0';
    G.rr(ctx, 590, 560, 100, 90, 30);
    ctx.fill();
    ctx.fillStyle = '#3a2518';
    ctx.beginPath(); ctx.ellipse(640, 530, 30, 34, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fdfdf7';
    ctx.save();
    ctx.translate(700, 590);
    ctx.rotate(0.3);
    ctx.fillRect(-14, -18, 28, 36);
    ctx.restore();
    if (this.state === 'pc' && this.st < 3.2) {
      const n = Math.max(0, 10 - Math.floor(this.st * 3.4));
      ctx.font = G.condensed(64);
      ctx.textAlign = 'center';
      G.outlineText(ctx, n + 's', 900, 560, n <= 3 ? '#ff5a5a' : '#ffd23f', '#000', 6);
      ctx.font = G.font(14);
      G.outlineText(ctx, 'PUBLIC COMMENT', 900, 506, '#fff', '#000', 4);
    }

    if (this.playerBubble) G.drawSpeech(ctx, 640, 480, this.playerBubble, { maxW: 380, size: 18, bg: '#fffbe6' });
    if (this.bubble) G.drawSpeech(ctx, MX[this.bubble.m], 180, this.bubble.text, { maxW: 400, size: 18 });

    if (this.state === 'intro' && this.st < 3.6) {
      ctx.fillStyle = '#ffd23f';
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 4;
      ctx.fillRect(24, 96, 380, 48);
      ctx.strokeRect(24, 96, 380, 48);
      ctx.fillStyle = '#111';
      ctx.font = G.font(20);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('MEANWHILE, UNDER THE BIG TOP…', 38, 121);
    }
    if (this.card) this.drawCard(ctx, this.card);
    // panel frame
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 1268, 708);
  };

  C.drawCard = function (ctx, c) {
    const a = G.clamp(c.t / 0.25, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(640, 380);
    const sc = G.settings.reducedMotion ? 1 : 0.7 + 0.3 * G.smoothstep(a);
    ctx.scale(sc, sc);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(-640, -380, 1280, 720);
    ctx.fillStyle = '#fffbe6';
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 6;
    G.rr(ctx, -300, -150, 600, 300, 20);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1d3557';
    ctx.font = G.font(20);
    ctx.fillText(c.title, 0, -112);
    if (c.kind === 'cone') G.drawConeIcon(ctx, 0, -20, 2.2);
    else G.drawPizza(ctx, 0, -25, 55);
    ctx.fillStyle = '#111';
    ctx.font = G.font(20);
    G.wrapText(ctx, c.text, 520).forEach((l, i) => ctx.fillText(l, 0, 70 + i * 26));
    ctx.restore();
  };

  // side-view cone icon for cards/seal
  G.drawConeIcon = function (ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = '#b44a12';
    ctx.fillRect(-26, 22, 52, 8);
    ctx.fillStyle = '#f26b1d';
    ctx.beginPath(); ctx.moveTo(-20, 22); ctx.lineTo(-5, -30); ctx.lineTo(5, -30); ctx.lineTo(20, 22); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(-14, 2); ctx.lineTo(-9, -14); ctx.lineTo(9, -14); ctx.lineTo(14, 2); ctx.fill();
    ctx.restore();
  };
})();
