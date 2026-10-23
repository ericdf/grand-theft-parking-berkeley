# FIELD OF SCHEMES — A Berkeley Ferry Tale

An animated satirical cartoon, about eight minutes long, that plays in the browser. Press Play and watch: there's nothing to steer and nothing to score. It's a warning about a proposed ferry terminal at the Berkeley Marina, told as a deceptively upbeat municipal fairy tale.

> "If you build it, they will come. Unless they don't. And you've ruined the Marina forever. For nothing."

The thesis is on screen and in the captions within the first 15 seconds. The ten scenes after it supply the evidence and the jokes.

## Run it

No dependencies, accounts, keys or network requests.

```sh
npm run dev       # http://localhost:5173/  (Node 18+, built-ins only)
npm run build     # copies the film into dist/ for any static host
npm run preview   # serves dist/
```

Any static server works too: `python3 -m http.server`, then open `/ferry/`. There's no build step; the browser runs the files as written, like the game next door.

### Deploy

Upload `dist/` (or this folder) to any static host. The page carries `<meta name="robots" content="noindex">` so it can live at an unlisted URL before it's announced. Delete that line when it goes public.

## Watching

| Control | Keys |
|---|---|
| Play / pause | Space or K |
| Seek ±5 s (±15 s with Shift) | ← → |
| Previous / next scene | P / N (or Page Up / Page Down) |
| Mute | M |
| Captions | C |
| Start / end | Home / End |

The scrubber has a tick at each scene boundary, and **Scenes** opens a menu of all eleven scenes. Captions are on by default because the film ships without recorded narration. Large captions sit low on the picture. On a phone held upright they move below the picture so they never cover it. With `prefers-reduced-motion`, wobbles, iris wipes and shakes switch off. You can also force that with `?reduced`.

Preview URLs: `?t=95` starts at 95 s, `?scene=consent` starts at a scene, and `&still` renders that frame paused with no splash. `tools/frames.sh OUTDIR 12 40 300` saves stills with headless Chrome while a local server runs on :8000.

## Architecture

```
index.html            player shell: stage canvas, captions, controls, scene menu
css/film.css          player styling (responsive; portrait phones put captions under the picture)
js/core.js            F namespace: easing, progress windows, seeded RNG, scene registry, F.talking()
js/script.js          THE SCREENPLAY AS DATA: scenes, durations, timed cues (narrator, voices,
                      characters, sound effects) and the thesis
js/marina-geo.js      generated real Marina geometry (see "Map data")
js/art.js             the cartoon kit: ink shapes, signs, banners, stamps, invoices, evidence
                      cards, hoses, vehicles, boats, windsurfers, cypresses, riprap, grades, iris
js/people.js          the recurring cast as puppet rigs, and the two living piggy banks
js/marina.js          perspective bird's-eye renderer for the real Marina, with project()/pin()
js/scenes/sNN-*.js    one renderer per scene: F.scene(id, (ctx, t, scene) => …)
js/sfx.js             small original sound effects synthesized with WebAudio
audio/manifest.js     hook for recorded narration
js/player.js          the clock, playback, scrubbing, captions, keyboard, narration sync
tools/                build-marina.py, serve.mjs, build.mjs, frames.sh
```

**Deterministic by design.** Every renderer is a pure function of its scene's local time. Randomness is seeded (`F.rng`), and nothing carries state from one frame to the next. Scrubbing backward, jumping scenes and replaying always produce the same picture as straight playback. Sound effects fire only when the clock crosses a cue during smooth forward play.

**Revising a joke** usually means editing `js/script.js`: change a line's text, move its `at`, or stretch its `dur`, without touching animation code. A renderer reads those times only where a visual beat must land on a line (for example, the stamp on "Put it on consent."). Mouth flaps come from `F.talking(scene, who, t)`, so a character's lips follow the cue data automatically.

## Replacing art

Everything is original vector-style drawing on a 1920×1080 canvas. To swap in illustrated assets, put images in `assets/`, load them once (e.g. `const img = new Image(); img.src = 'assets/pig.png'`), and draw them in the scene renderer in place of the kit call, such as `F.people.pig`. Positions and timings stay where they are. Keep the recurring designs consistent: the cast is defined in one place (`F.people.CAST`).

## Adding voiceover

Record the lines in `js/script.js`. The `hold: true` cues mark deliberate comedic pauses: "Sometimes.", "It's a very healthy fund.", "The grants.", "That's what the emergency is." and "Put it on consent." Then map the files in `audio/manifest.js`, either one file per scene (`F.AUDIO_TRACKS`) or one for the whole film (`F.AUDIO_FILM`). The player keeps narration in sync through play, pause and scrubbing. When narration is present, captions start off, and viewers can turn them on with C.

## Map data

The Marina's shapes are real. Roads, I-80 and its ramps come from the **City of Berkeley street centerlines**. The coastline, docks, breakwaters, the old pier, parks, parking lots and building footprints come from **OpenStreetMap** (© OpenStreetMap contributors, ODbL). To rebuild:

```sh
curl -o berkeley-marina.osm "https://api.openstreetmap.org/api/0.6/map?bbox=-122.332,37.856,-122.296,37.880"
python3 ferry/tools/build-marina.py berkeley-marina.osm Street_Centerlines.geojson
```

The ground-level sets are original drawings, informed by looking at the real place: the waterside lot along Seawall Drive by the South Sailing Basin, cypress windbreaks, red curbs, riprap, the brick roundabout and the wildflower median on University. The South Sailing Basin shore by Shorebird Park and the South Cove lots is where swimmers, windsurfers and wing foilers park and launch.

## Sources

The film carries no on-screen sourcing or disclaimers: it's satire, and sourcing is communicated separately. The figures come from the Berkeley Decision Project reports [*Funding a Ferry With More Questions Than Answers*](https://ericdf.github.io/berkeley-decision-project/pier-ferry.html) and [*A Financial Riptide Is Threatening to Reshape Berkeley's Waterfront*](https://ericdf.github.io/berkeley-decision-project/waterfront-fund.html). The cast is generic cartoon archetypes, and the film carries no City or agency logos or seals.

## Known limitations and open questions

- There's no recorded narration yet; captions carry the film. The sound effects are simple synthesized blips, and there's no music score.
- Figures checked against *Funding a Ferry With More Questions Than Answers*: $103,639,467 preliminary construction estimate, excluding vessels (City project update, 24 Oct 2025); 68% of passengers reaching the terminal by car (31% drive alone, 15% carpool, 15% dropped off, plus rideshare); the 1,080-foot pier and 400-foot breakwater (BCDC Design Review Board, 3 Nov 2025); 400,000 cubic yards of dredging; WETA 2035 fare $7.28, subsidy $7.62 per boarding, operating gap $5,589,288; six of the seven decisions on consent; pier closed 2015. The film adds no figures of its own.
- The old Berkeley Pier and the proposed pier's position on the bird's-eye map are approximate, drawn for the cartoon.
