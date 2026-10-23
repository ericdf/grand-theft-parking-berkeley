'use strict';
// The screenplay, as data. Each scene has a duration and timed cues; times are seconds from the
// start of that scene. Revise a line or its timing here; the renderers in js/scenes/ only read
// the clock and (for mouth flaps) who is speaking.
//
// cue kinds:
//   vo     the narrator (warm storybook / municipal PR announcer)
//   dry    the second, dry voice
//   magic  the glittering whisper ("If you build it…")
//   say    an on-screen character; `who` names them (matches the renderer's character id)
//   sfx    a sound effect; captioned in brackets, and played by js/sfx.js if `snd` is set
// `hold: true` marks a deliberate comedic pause after the line (documentation for voice talent).
(function () {
  const vo = (at, dur, text, o) => Object.assign({ kind: 'vo', who: 'narrator', at, dur, text }, o);
  const dry = (at, dur, text, o) => Object.assign({ kind: 'dry', who: 'dry', at, dur, text }, o);
  const magic = (at, dur, text, o) => Object.assign({ kind: 'magic', who: 'magic', at, dur, text }, o);
  const say = (who, at, dur, text, o) => Object.assign({ kind: 'say', who, at, dur, text }, o);
  const sfx = (at, text, snd, dur = 1.6) => ({ kind: 'sfx', at, dur, text, snd });

  F.SPEAKERS = {
    narrator: 'NARRATOR',
    dry: 'ANOTHER VOICE',
    magic: 'A MAGICAL VOICE',
    official: 'CITY OFFICIAL',
    consultant: 'CONSULTANT',
    state: 'STATE BOATING OFFICIAL',
    engineer: 'ENGINEER',
    captain: 'FERRY CAPTAIN',
    comm1: 'WATERFRONT COMMISSIONER',
    comm2: 'WATERFRONT COMMISSIONER',
    clerk: 'CLERK',
    member: 'COUNCILMEMBER',
    citizen: 'CITIZEN',
    meter: 'PARKING METER',
    windsurfer: 'WINDSURFER',
  };

  F.SCRIPT = [
    {
      id: 'promise', title: 'The Promise', dur: 27,
      cues: [
        sfx(0.3, 'gulls, wind, happy splashing', 'gulls', 2),
        magic(2.0, 3.0, 'If you build it, they will come.'),
        sfx(3.2, 'sparkle', 'sparkle'),
        dry(8.0, 1.9, "Unless they don't."),
        dry(10.1, 2.5, "And you've ruined the Marina forever."),
        dry(12.8, 1.6, 'For nothing.', { hold: true }),
        sfx(14.6, 'brass fanfare', 'fanfare'),
        sfx(19.6, 'tape rewinding', 'rewind'),
        vo(21.4, 5.0, 'How did we get here? Well, once upon a time, in a city by the Bay…'),
      ],
    },
    {
      id: 'ferry', title: 'Once Upon a Ferry', dur: 44,
      cues: [
        sfx(0.2, 'projector clatter', 'projector', 2),
        vo(1.0, 5.0, 'Once upon a time, before there was a Bay Bridge, Berkeley had an automobile ferry.'),
        vo(6.2, 4.3, 'People drove to the waterfront, boarded a boat, and crossed the Bay.'),
        sfx(10.8, 'ferry horn', 'horn'),
        vo(16.4, 4.4, "But that was nearly a century ago. We've learned a great deal since then."),
        vo(21.8, 6.4, 'Today, Berkeley is committed to fighting climate change, reducing automobile dependence, and protecting our environment.'),
        vo(30.0, 1.4, 'Sometimes.', { hold: true }),
        sfx(32.0, 'traffic, honking', 'honk'),
        vo(37.2, 6.2, "But we're getting ahead of our story. First, there was a beautiful waterfront. And a treasury with a problem."),
      ],
    },
    {
      id: 'treasury', title: 'The Kingdom and Its Treasury', dur: 56,
      cues: [
        vo(0.5, 4.3, "The Marina had a piggy bank all its own: the Marina Enterprise Fund."),
        vo(5.0, 3.6, 'Boat slips, leases and operations kept it fed.'),
        sfx(5.4, 'coins clinking', 'coins'),
        vo(9.0, 2.6, 'And it was very useful.'),
        sfx(12.0, 'slurp', 'slurp'),
        sfx(14.6, 'tiny piggy squeak', 'squeak'),
        vo(16.0, 4.6, 'Meanwhile, the docks, the seawalls and the pilings kept getting older.'),
        say('state', 21.0, 4.0, 'This is not how enterprise funds are typically used.'),
        say('official', 25.6, 2.6, "Don't worry. We have another fund."),
        sfx(30.4, 'cough cough', 'cough'),
        say('official', 32.6, 2.2, "It's a very healthy fund.", { hold: true }),
        sfx(35.4, 'weak cough', 'cough'),
        vo(37.2, 3.8, "So the Marina borrowed from the City's Workers' Compensation Fund."),
        vo(41.4, 2.6, 'The Marina pig felt better. Briefly.'),
        sfx(44.4, 'polite applause', 'applause'),
        vo(46.0, 6.2, 'The old Berkeley Pier closed in 2015. The docks needed work. The seawalls needed work. Nearly everything needed work.'),
        vo(52.6, 3.0, 'And then, one day, a miracle arrived.'),
      ],
    },
    {
      id: 'miracle', title: 'The Magical Ferry', dur: 41,
      cues: [
        sfx(0.6, 'harp glissando', 'harp', 2.4),
        sfx(5.8, 'thump', 'thump'),
        magic(8.4, 3.0, 'If you build it, they will come.'),
        say('official', 12.0, 1.2, 'Who?'),
        magic(13.8, 1.6, 'The grants.', { hold: true }),
        sfx(17.2, 'paper unrolling', 'unroll'),
        say('official', 22.0, 3.0, 'But where will the passengers come from?'),
        magic(25.6, 2.8, 'Have you considered… parking?'),
        sfx(28.4, 'traffic pouring in', 'honk'),
        vo(33.6, 6.4, 'Proving, once again, that the best way to get people out of their cars is to give motorists an exciting new place to drive.'),
      ],
    },
    {
      id: 'price', title: 'The Price of Paradise', dur: 38,
      cues: [
        vo(0.5, 3.0, 'Of course, every fairy tale has a few obstacles.'),
        sfx(4.0, 'crunch', 'crunch'),
        vo(6.4, 2.6, 'The Bay here is rather shallow.'),
        sfx(9.4, 'chugga-chugga', 'chug', 2),
        sfx(17.6, 'waves crashing', 'splash'),
        say('engineer', 25.4, 5.4, "We'll also need maintenance dredging, charging, the vessels themselves, operating subsidies—"),
        say('official', 31.0, 2.8, "Let's not get bogged down in details."),
        sfx(33.4, 'glorp', 'glorp'),
      ],
    },
    {
      id: 'wise', title: 'The Wise People of the Waterfront', dur: 42,
      cues: [
        vo(0.5, 3.6, 'Now, the kingdom had wise people of the waterfront.'),
        say('comm1', 4.4, 4.6, "We've drawn up plans, a cost analysis, and an alternative site."),
        say('comm2', 9.4, 2.2, "And we'll do it for free."),
        say('official', 12.0, 2.9, "Free? But how will we know it's valuable?"),
        say('consultant', 15.4, 3.4, 'I can explain that for two hundred thousand dollars.'),
        sfx(18.8, 'cha-ching', 'ching'),
        say('official', 19.6, 5.2, 'We value your input. Your input has been received. Please stop inputting.'),
        sfx(25.2, 'revolving door', 'whoosh'),
        vo(28.4, 4.0, 'For the big decisions, the project took a different route.'),
        sfx(30.4, 'door rattle', 'rattle'),
        vo(33.0, 3.0, 'In Berkeley, every voice can be heard…'),
        sfx(36.0, 'microphones retracting', 'zip'),
        vo(37.2, 3.4, "…provided it doesn't interfere with the vision."),
      ],
    },
    {
      id: 'consent', title: 'The Consent Calendar Express', dur: 38,
      cues: [
        sfx(0.4, 'toy train whistle', 'whistle'),
        say('clerk', 3.0, 3.8, 'Next item: another major waterfront project decision.'),
        say('member', 7.4, 1.9, 'Does it require discussion?'),
        say('clerk', 9.8, 1.6, "It's on consent."),
        say('member', 11.8, 1.5, 'All aboard!'),
        sfx(13.4, 'STAMP', 'stamp'),
        vo(15.0, 5.4, 'Six of the seven key project milestones we traced rode the Consent Calendar Express.'),
        say('citizen', 21.0, 2.9, 'Do we know what the whole project will cost?'),
        sfx(24.2, 'pneumatic whoosh', 'whoosh'),
        sfx(27.0, 'drawer locks', 'clunk'),
        sfx(28.2, 'brakes squeal', 'brakes'),
        say('official', 30.4, 2.4, 'No. We need another study.'),
        sfx(35.4, 'STAMP', 'stamp'),
      ],
    },
    {
      id: 'subsidy', title: 'The Subsidy Machine', dur: 42,
      cues: [
        sfx(0.3, 'machinery whirring', 'machine', 2.4),
        vo(1.0, 2.6, 'Then there was the small matter of the fare.'),
        sfx(5.0, 'ding', 'ding'),
        vo(10.0, 2.8, 'The ferry would be remarkably affordable.'),
        vo(13.8, 2.6, 'Especially for the people riding it.', { hold: true }),
        sfx(17.0, 'alarm', 'alarm', 2.4),
        say('official', 22.6, 3.0, "We'll determine that later."),
        say('official', 27.4, 3.0, "But you'll keep running the boats, right?"),
        say('captain', 31.0, 1.4, "We'll see.", { hold: true }),
        vo(34.0, 3.4, 'A partnership built on trust. And concrete.'),
        vo(38.0, 1.8, 'Mostly concrete.'),
      ],
    },
    {
      id: 'fitness', title: 'The Waterfront Fitness Challenge', dur: 38,
      cues: [
        vo(0.5, 5.2, 'In one possible future, the lots by the South Sailing Basin fill up with ferry parking.'),
        sfx(5.8, 'boing', 'boing'),
        say('meter', 6.2, 3.4, 'Welcome to the Berkeley Waterfront Fitness Challenge!'),
        vo(11.4, 3.2, 'Windsurfers enjoyed a scenic warm-up.'),
        vo(15.6, 3.0, 'Wing foilers practiced sailing. Backwards.'),
        vo(19.6, 2.6, 'Swimmers acclimated early.'),
        sfx(22.6, 'kazoo fanfare', 'kazoo'),
        sfx(27.6, 'the wind dies', 'wind', 2),
        say('windsurfer', 29.4, 2.6, 'Well, that was my workout.'),
        vo(33.0, 2.8, 'Another public-health success!'),
      ],
    },
    {
      id: 'resilience', title: 'The Resilience Miracle', dur: 36,
      cues: [
        vo(0.5, 3.8, 'And in an emergency, the ferry would be ready to save the day.'),
        sfx(5.0, 'sirens', 'siren', 2),
        sfx(7.6, 'power-down', 'powerdown'),
        sfx(10.4, 'sad click… click…', 'click'),
        say('official', 13.4, 2.4, 'Can we get some electricity?'),
        say('engineer', 16.4, 2.4, "That's what the emergency is.", { hold: true }),
        sfx(21.0, 'generators chugging', 'chug', 2.4),
        vo(29.0, 4.6, 'Resilience: powered by optimism. And a little diesel.'),
      ],
    },
    {
      id: 'ever-after', title: 'Happily Ever After', dur: 76,
      cues: [
        sfx(0.2, 'one lonely gull', 'gull1'),
        vo(1.0, 4.6, 'And so, in this imagined future, the Marina lived happily ever after.'),
        sfx(9.0, 'tumbleweed', 'wind', 2),
        vo(24.0, 3.4, 'And Berkeley had even restored its beloved fishing pier.'),
        vo(28.0, 2.8, 'Just a little farther from the fish.', { hold: true }),
        sfx(33.0, 'honking, gridlock', 'honk'),
        vo(33.6, 3.6, 'Everyone was still driving. Just not here.'),
        sfx(38.4, 'one sad party horn', 'kazoo'),
        vo(41.0, 6.0, 'The City received the Golden Shovel, for Excellence in Transformational Waterfront Management.'),
        magic(48.0, 3.0, 'If you build it, they will come.'),
        say('official', 51.6, 2.0, 'Where is everybody?'),
        say('consultant', 54.0, 2.8, "We'd be happy to study that."),
        sfx(56.8, 'cha-ching', 'ching'),
        say('official', 57.6, 2.0, 'Put it on consent.', { hold: true }),
        sfx(60.0, 'STAMP', 'stamp'),
        sfx(62.6, 'brass fanfare', 'fanfare'),
      ],
    },
  ];

  // global start times
  let t = 0;
  F.SCRIPT.forEach((s, i) => { s.index = i; s.start = t; t += s.dur; });
  F.TOTAL = t;
  F.sceneAt = (gt) => {
    for (let i = F.SCRIPT.length - 1; i >= 0; i--) if (gt >= F.SCRIPT[i].start) return F.SCRIPT[i];
    return F.SCRIPT[0];
  };

  F.THESIS = ["If you build it, they will come.", "Unless they don't.", "And you've ruined the Marina forever.", 'For nothing.'];
})();
