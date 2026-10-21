# Grand Theft Parking: Berkeley — Pothole City

A short, absurd, top-down browser game that parodies the GTA formula. Park on Hopkins. Buy one slice at Gioia. Survive the process.
Implements `berkeley-grand-theft-auto-spoof-spec.md`.

## Run it

It's a static site with no build step and no dependencies:

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

You can deploy it as-is to GitHub Pages, Netlify, or any static host. It makes no network calls and uses no analytics. The only browser storage is `localStorage`, which keeps audio/accessibility settings.

## Structure

| File | What |
|---|---|
| `index.html`, `css/style.css` | Shell, title / pause / options / end screens, council dialogue buttons, touch controls |
| `js/util.js` | Math and collision helpers, settings, run stats, `G.formCommittee` / `G.addStar` |
| `js/audio.js` | All sound synthesized with WebAudio (SFX plus an original surf/funk loop). Silent until the first user gesture. |
| `js/input.js` | Keyboard + touch |
| `js/draw.js` | Vector sprites (car, potholes, cones, cyclists, inspectors, signs) and particles |
| `js/hud.js` | Mission banners, objective, Bureaucracy Level stars, toasts, KPTH radio ticker |
| `js/car.js` | Arcade car handling and pothole launches (bounce / spin / arc, pinball chains, capped at 3) |
| `js/streets-data.js` | **Generated** from City of Berkeley open data by `tools/build-streets.py` (street centerlines + geocoded storefronts) |
| `js/citymap.js` | Road network: on-road collision, Dijkstra routing over real intersections, street chains, procedural houses, landmark blocks |
| `js/city.js` | Mission 1 (Pothole Paradise), Mission 2 (Hopkins Parking Heist, in front of Gioia), drive to the council tent in Civic Center Park |
| `js/council.js` | Mission 3: Council of Infinite Process, a comic-panel dialogue minigame |
| `js/slalom.js` | Mission 4: MLK Slalom of Doom |
| `js/finale.js` | Ceremony, confetti, final pothole, end screen |
| `js/main.js` | Scene state machine, checkpoints, fades, pause, main loop |

Flow: Title → City (Drive 1 → Hopkins → council tent) → Council → Slalom → Finale. A checkpoint is saved at the start of each mission. "Retry from checkpoint" (pause menu), losing the slice, and running out the council clock all restore the stats from that checkpoint.

## The MLK slalom

The slalom is based on the real street. Raised concrete islands at the crosswalks make the double-yellow centerline swerve, with yellow-painted noses and yellow keep-right diamonds. In the game the swerves alternate right/left and are exaggerated, with 100px offsets against a 100px lane bundle, so a straight line through is impossible. That rhythm is the challenge even with Options → "Slalom secondary hazards" turned off. Tuning constants (`A`, `R`, `HOLD`, `SPACING`) are at the top of `js/slalom.js`.

## Test / debug jumps

Append `?start=hopkins|cityhall|council|slalom|finale` to the URL to jump straight to a mission, or `?touch` to force the on-screen controls.

## Map data

The city is real Berkeley, from Hopkins down to Dwight and from Sacramento over to Shattuck. To regenerate `js/streets-data.js`:

```sh
python3 tools/build-streets.py Street_Centerlines.geojson Business_Licenses.csv
```

- Streets come from the City of Berkeley street-centerline GeoJSON, projected at 2.6 px/m. Road widths are exaggerated so the car fits; positions and connectivity are real.
- Storefront labels come from the business-license CSV: food, grocery, retail, salon and fitness licenses only. Each is geocoded by interpolating its street number along the centerline address ranges (left and right sides).
- Landmark blocks are built from real intersections:
  - Civic Center Park, with the temporary council tent: MLK/Milvia × Allston/Center.
  - Old City Hall, in earthquake rubble: MLK/McKinley × Allston/Center.
  - Berkeley High: MLK/Milvia × Allston/Channing. Bancroft dead-ends at MLK from the west.
- The slalom's cross streets are the real ones south of Allston (Bancroft, Channing, Haste, Dwight… Ashby), drawn only on the side(s) where they actually meet MLK.
