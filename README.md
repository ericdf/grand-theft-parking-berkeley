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
| `js/slalom.js` | Mission 4, the final challenge: deliver the slice down MLK to Ashby BART |
| `js/finale.js` | Ceremony in the Ashby BART lot, confetti, final pothole, end screen |
| `js/main.js` | Scene state machine, checkpoints, fades, pause, main loop |

Flow: Title → City (Drive 1 → Hopkins → council tent) → Council → Slalom → Finale. After the council hands over the provisional slice, a full-screen stamp (`G.hud.stamp`) announces the final challenge: deliver it to Ashby BART. The run down MLK ends beside the Ashby BART lot, which is coned off as a future housing site, and the ceremony happens in that lot. There's no parking there either. A checkpoint is saved at the start of each mission. "Retry from checkpoint" (pause menu), losing the slice, and running out the council clock all restore the stats from that checkpoint.

## Off-road

The car can jump the curb and drive on sidewalks and lawns. Houses, storefronts, trees, Berkeley High, the council tent, barricades and transformed parking spaces still stop it. Grass drags the car down and throws sod, and every lawn crossing leaves tire ruts (the last 3,000 segments, in both views). Turf enough of them and the Lawn Restoration Working Group convenes.

## 3D chase view

The city missions (Drive 1, Hopkins, the drive to the council tent) can be played in 3D from just behind the car, GTA-style: the **3D chase view** checkbox on the title screen, **V** while driving, the Options checkbox, or `?view=fp` in the URL. It is the same game, not a port: car physics, collisions, potholes, cyclists, parking spaces and routing are all the top-down code, and only the camera changes.

- The road surface is the top-down painter itself. `City.drawZones/drawRoads/drawHazards/drawSpots` draw into two ground textures: a coarse one of the whole map, painted once, and a sharp 1600 px patch ahead of the car that is repainted as you drive. Lane paint, crosswalks, potholes and Roosevelt Canyon therefore match the aerial view exactly.
- Houses, storefronts (with license-data names on their signboards), trees, Berkeley High, the rubble of Old City Hall, the council tent, closures, signs, cones, inspectors, clowns and cyclists are 3D, placed from the same data.
- The car is a battered silver Prius: the wedge nose, hump roof and Kamm tail with its light bar and spoiler, plus the top-down sprite's rust spots, mismatched blue replacement door and cracked windshield. Its California plate reads `PCI 0` (a Pavement Condition Index of zero: failed pavement), in a `BERKELEY · A NUCLEAR-FREE ZONE` frame, beside an `I BRAKE FOR PUBLIC COMMENT` bumper sticker. Pothole launches lift it off its shadow; the camera swings round after it rather than locking on.
- Navigation: the GPS route is laid on the road, the arrow at the top of the screen points at the next waypoint, and the minimap stays on.
- The council, slalom and finale stay top-down. If WebGL is unavailable the city falls back to top-down.

## The MLK slalom

The slalom is based on the real street. Raised concrete islands at the crosswalks make the double-yellow centerline swerve, with yellow-painted noses and yellow keep-right diamonds. In the game the swerves alternate right/left and are exaggerated, with 100px offsets against a 100px lane bundle, so a straight line through is impossible. That rhythm is the challenge even with Options → "Slalom secondary hazards" turned off. Tuning constants (`A`, `R`, `HOLD`, `SPACING`) are at the top of `js/slalom.js`.

## Hopkins: the Corridor Project and the Pothole Preserve

Hopkins from Sacramento to The Alameda is the Hopkins Corridor Project. On the drive there it is the failed street, with real-rated potholes and parked cars along both curbs. The first time you reach Hopkins, a ~14 s letterboxed intermission plays the project out in one crane shot over the Gioia block:

1. "HOPKINS STREET, TODAY · PARKING SPACES: 130"
2. Phase 1, repaving: the paver sweeps down the street and the craters fill in.
3. Phase 2, parking removal: the parked cars vanish as a counter runs 130 → 0.
4. Phase 3, Class IV cycletracks: green bikeways paint themselves in on both sides and flex posts pop up.
5. "WELCOME TO THE NEW HOPKINS STREET · SMOOTH ROADS · 0 PARKING SPACES"

E skips it. It uses the 3D renderer even in the top-down view (three.js starts loading at the start of Drive 1); without WebGL it falls back to a top-down pan. Timing is `CINE` and the camera is `City.cinemaCam` in `js/city.js`.

Afterwards Hopkins is smooth and has no parking. Cyclists ride in the cycletracks, and knocking down a flex post forms the Cycletrack Incursion Review Panel. The space hunt moves to the real cross streets (McGee, Carlotta, Monterey), where each space still turns into a bike corral, parklet, island or loading zone. The last "space" is painted in the cycletrack in front of Gioia. Stop in it and it becomes a Bike-Only Pizza Parklet (slices for cyclists), which nudges your car out.

East of The Alameda, Hopkins to Sutter is rated Failed in the MTC pavement data and is outside project limits: the Hopkins Pothole Preserve ("DAMAGING VEHICLES SINCE 2000"). It has rows of craters wall to wall, except for one gap that weaves left, center, right, so a careful driver can thread it (or take the sidewalk).

## Play or watch

The title screen offers **PLAY** and **WATCH**. WATCH runs the whole game on autopilot, start to finish, for anyone who would rather see it than drive it. `?watch` in the URL lands on the title with WATCH focused, so Enter or a tap starts it.

## Autopilot

**WATCH** on the title screen, Options → "Autopilot", **O** at any time (the **AUTO** button on touch screens), or `?autopilot` in the URL. The car then drives itself with the same inputs a player has. PLAY turns it off.

- **Slalom:** it aims at the lane center a little way ahead, swerves to the far side of potholes, and eases off to let crossing cyclists clear. It finishes with every gate clean. The fail banner points stuck players at it.
- **City missions:** it follows the yellow-arrow route with pure pursuit. It nudges around craters near its line, slows for bends and for cyclists in its path, stops inside the Gioia space, and files the appeal at the council tent. If it gets wedged, it backs out, and after repeated failures it resets to the road. From Shattuck to the tent takes about two minutes, with the Hopkins movie included. In the 3D chase view it cruises at under half its top-down speed (`SIGHTSEEING` in `js/city.js`), so street names and storefront signs stay readable, and at half that again on Hopkins and through the space hunt (`SIGHTSEEING_HOPKINS`). In every view it pulls up short of each space and waits while it is reimagined (`WATCH_SPOT`), so a watcher sees it vanish.

- **Council hearing:** it reads each set of choices for a few seconds, says two clever lines, then picks the plain request.

The finale plays itself either way.

## Test / debug jumps

Append `?start=corridor|hopkins|cityhall|council|slalom|finale` to the URL to jump straight to a mission, `?view=fp` for the 3D chase view, or `?touch` to force the on-screen controls.

## Map data

The city is real Berkeley, from Hopkins down to Dwight and from Sacramento over to Shattuck. To regenerate `js/streets-data.js`:

```sh
python3 tools/build-streets.py Street_Centerlines.geojson Business_Licenses.csv Street_Pavement_Condition.geojson
```

- Streets come from the City of Berkeley street-centerline GeoJSON, projected at 2.6 px/m. Road widths are exaggerated so the car fits; positions and connectivity are real.
- Pothole density follows the real Pavement Condition Index (PCI), from MTC's Vital Signs "Street Pavement Condition – Streets and Roads" GeoJSON. Each centerline is matched to the nearest rated pavement section, with a preference for one with the same street name. That data only gives a category (Excellent … Failed), so the road stores the midpoint of that category's PCI band. A Failed block gets a crater every car length or so, with bigger craters. Excellent blocks are nearly clean. Roads with no rating (mostly campus roads) count as PCI 60. The streets within about a block of the Gioia stretch are capped at a light density (PCI 80 or better) so the parking hunt stays about parking. Roosevelt Canyon sits on a block rated Failed. On the drive to the council tent, the GPS takes the scenic route: east along Bancroft to the canyon's mouth. The autopilot stops there long enough to read the sign, the driver says what anyone would say, and the route carries on up Bancroft. A player only has to drive past.
- Storefront labels come from the business-license CSV: food, grocery, retail, salon and fitness licenses only. Each is geocoded by interpolating its street number along the centerline address ranges (left and right sides).
- The corner of Hopkins, Monterey and California is laid out by hand (`layoutCorner` in `js/citymap.js`), because its shops sit too close together in the license data to survive the overlap pass. Gioia's row fills the south side of Hopkins from California's sidewalk to McGee's: Magnani Poultry, Asaka, Monterey Fish Market and Hopkins Bakery, then Gioia two-thirds of the way along heading east, then unsigned storefronts to McGee. Only Magnani, Monterey Fish and Gioia have signs; from above, the narrow ones read like blade signs. Across California, Monterey Market sits behind its corner parking lot, which is full. Espresso Roma (1549 Hopkins, not in the license data) is catty-corner, north of Hopkins. The game's roads are drawn much wider than real ones, so the spacing is compressed; the order and the sides of the street are real.
- Landmark blocks are built from real intersections:
  - Civic Center Park, with the temporary council tent: MLK/Milvia × Allston/Center.
  - Old City Hall, in earthquake rubble: MLK/McKinley × Allston/Center.
  - Berkeley High: MLK/Milvia × Allston/Channing. Bancroft dead-ends at MLK from the west.
- The slalom's cross streets are the real ones south of Allston (Bancroft, Channing, Haste, Dwight… Ashby), drawn only on the side(s) where they actually meet MLK.
