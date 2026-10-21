# Grand Theft Parking: Berkeley — Pothole City

A short, absurd, top-down browser game that parodies the GTA formula. Park on Hopkins. Buy one slice at Gioia. Survive the process.
Implements `berkeley-grand-theft-auto-spoof-spec.md`.

## Run it

It's a static site with no build step. The only dependency is three.js, vendored in `vendor/` and loaded only for the 3D view:

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
| `js/fpview.js` | Top-down / 3D chase-view switch for the city; lazy-loads the 3D renderer on first use |
| `js/fp3d.js` | 3D chase-view renderer (three.js): the same street grid, scenery and game state, from just behind the car |
| `vendor/three.module.min.js` | three.js r170 (MIT, see `vendor/three.LICENSE`) |
| `js/council.js` | Mission 3: Council of Infinite Process, a comic-panel dialogue minigame |
| `js/slalom.js` | Mission 4: MLK Slalom of Doom |
| `js/finale.js` | Ceremony, confetti, final pothole, end screen |
| `js/main.js` | Scene state machine, checkpoints, fades, pause, main loop |

Flow: Title → City (Drive 1 → Hopkins → council tent) → Council → Slalom → Finale. A checkpoint is saved at the start of each mission. "Retry from checkpoint" (pause menu), losing the slice, and running out the council clock all restore the stats from that checkpoint.

## 3D chase view

The city missions (Drive 1, Hopkins, the drive to the council tent) can be played in 3D from just behind the car, GTA-style: **3D VIEW** on the title screen, **V** while driving, the Options checkbox, or `?view=fp` in the URL. It is the same game, not a port: car physics, collisions, potholes, cyclists, parking spaces and routing are all the top-down code, and only the camera changes.

- The road surface is the top-down painter itself. `City.drawZones/drawRoads/drawHazards/drawSpots` draw into two ground textures: a coarse one of the whole map, painted once, and a sharp 1600 px patch ahead of the car that is repainted as you drive. Lane paint, crosswalks, potholes and Roosevelt Canyon therefore match the aerial view exactly.
- Houses, storefronts (with license-data names on their signboards), trees, Berkeley High, the rubble of Old City Hall, the council tent, closures, signs, cones, inspectors, clowns and cyclists are 3D, placed from the same data.
- The car is modeled after its top-down sprite: orange, rust spots, the mismatched blue replacement door, a cracked windshield. Its California plate reads `PCI 0` (a Pavement Condition Index of zero: failed pavement), in a `BERKELEY · A NUCLEAR-FREE ZONE` frame, beside an `I BRAKE FOR PUBLIC COMMENT` bumper sticker. Pothole launches lift it off its shadow; the camera swings round after it rather than locking on.
- Navigation: the GPS route is laid on the road, the arrow at the top of the screen points at the next waypoint, and the minimap stays on.
- The council, slalom and finale stay top-down. If WebGL is unavailable the city falls back to top-down.

## The MLK slalom

The slalom is based on the real street. Raised concrete islands at the crosswalks make the double-yellow centerline swerve, with yellow-painted noses and yellow keep-right diamonds. In the game the swerves alternate right/left and are exaggerated, with 100px offsets against a 100px lane bundle, so a straight line through is impossible. That rhythm is the challenge even with Options → "Slalom secondary hazards" turned off. Tuning constants (`A`, `R`, `HOLD`, `SPACING`) are at the top of `js/slalom.js`.

## Test / debug jumps

Append `?start=hopkins|cityhall|council|slalom|finale` to the URL to jump straight to a mission, `?view=fp` for the 3D chase view, or `?touch` to force the on-screen controls.

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
