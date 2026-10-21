# Grand Theft Auto: Berkeley — Browser Game Specification

## 1. Concept
A short, ridiculous, playable browser-game parody of the *Grand Theft Auto* (GTA) formula, relocated to Berkeley civic life. The player is an ordinary resident attempting an almost impossible mission: drive across town, park near Hopkins Street, and complete an errand. The true antagonists are potholes, vanishing parking spaces, performative civic bureaucracy, and traffic chaos.

**Tagline:** *In a city where everything is a priority, nothing is paved.*

**Format:** Single-player, browser-only, 2D top-down arcade game; desktop keyboard first, with optional touch controls. No installation, account, multiplayer, or server required.

**Target playtime:** 5–8 minutes per run. Fast restart; easy to share.

**Tone:** Broad, absurd, politically pointed satire. Exaggerate systems and behaviors rather than depicting or naming actual council members. No real-world violence or injury; collisions are cartoon slapstick.

## 2. How the GTA parody works
GTA's recognizable conventions are an open city, vehicle driving, missions, wanted-level escalation, dramatic on-screen announcements, and a minimap. This spoof uses all of those conventions at miniature scale, but replaces crime and police pursuit with civic inconveniences and administrative escalation.

- **Wanted stars become Bureaucracy Stars:** As the player complains or breaks increasingly absurd parking rules, inspectors, committees, and consultants appear.
- **Mission prompts:** Oversized, melodramatic text announces trivial objectives: **MISSION START: BUY ONE BAGEL.**
- **Radio:** An optional satirical talk-radio ticker offers deadpan commentary.
- **Map:** Recognizable, simplified Berkeley landmarks and streets, not a geographically exact simulation.
- **Escalation:** Every attempt to solve a simple problem generates a larger public process.

The humor should be legible to people who have never played GTA; the GTA references are an extra layer.

## 3. Main gameplay loop
1. Spawn in a battered compact car with a flashing objective: **PARK ON HOPKINS.**
2. Drive through Berkeley while dodging potholes and unpredictable cyclists.
3. Reach Hopkins and discover every former parking space has become a planter, bollard, loading zone, or interpretive sign.
4. Visit City Hall to petition for one parking space; complete a satirical bureaucracy minigame.
5. Escape down Martin Luther King Jr. Way in a ridiculous slalom challenge.
6. Reach the finale and receive a gloriously useless civic award.

The player can fail a challenge and immediately retry at its checkpoint; no lengthy resets.

## 4. Missions and set pieces

### Mission 1 — Pothole Paradise (60–90 seconds)
**Objective:** Drive toward Hopkins.

**Mechanics:** Road craters have visible outlines. Hitting one launches the car into an exaggerated bounce, spin, or brief airborne arc. Successive potholes can pinball the car across the road. A bounce meter rewards ridiculous airtime; the car always lands intact. Add wobbling suspension, comic sound effects, and a dramatic **ROAD SURFACE NOT FOUND** warning.

**Gag:** A crater has a sign: **POTHOLE DESIGNATED AS HISTORIC RESOURCE.** Another displays **REPAIR SCHEDULED: AFTER COMMUNITY INPUT.**

**Fairness:** The player can steer out of a bounce after a brief, predictable loss of control. Avoid unavoidable collision chains.

### Mission 2 — The Hopkins Parking Heist (90 seconds)
**Objective:** Find one legal parking space and buy a bagel.

**Mechanics:** Follow a minimap marker to a parking icon; on approach it transforms into a bike corral, outdoor dining platform, landscaped island, or a **15-SECOND LOADING ONLY** zone. After three disappointments, a supposedly available space appears. Parking in it triggers a pop-up: **THIS SPACE EXISTS ONLY IN THE 2019 PARKING STUDY.**

**Gag:** A countdown reads **ERRAND TIME: 2 MINUTES / PARKING SEARCH: 47 YEARS.**

**Completion:** The player gets a parking appeal form and a new mission marker at City Hall. This is intentionally a scripted joke, not an endless search.

### Mission 3 — Council of Infinite Process (90 seconds)
**Objective:** Obtain an emergency parking exemption.

**Presentation:** Fictional, unnamed council caricatures at a dais; each is represented by an absurd archetype rather than a real person. Examples: The Consultant Whisperer, The Motion-to-Table Machine, The Vision-Zero Visionary, and The Unanimous Abstainer.

**Mechanics:** A rapid-fire dialogue minigame presents three choices per round. Every answer triggers an evasive response and adds a stamp to the application: **REFERRED**, **STUDIED**, **REIMAGINED**. The trick is to click the inconspicuous **PUBLIC COMMENT: 10 SECONDS** button before the timer expires; this awards the player a ceremonial traffic cone, not a permit.

**Sample lines:**
- “We hear your concern. We have commissioned a framework for hearing it.”
- “The parking space has been converted into a pilot program.”
- “We are proud to announce a task force on the implementation of the previous task force.”
- “The motion passes unanimously, with no action authorized.”

**Satirical target:** Self-congratulatory process, not personal abuse or invented factual allegations about real officials.

### Mission 4 — MLK Slalom of Doom (60–90 seconds)
**Objective:** Drive down Martin Luther King Jr. Way through the real-life-inspired succession of center-of-road diverters, reaching the finish line without losing your bagel.

**Core mechanic — the street *is* a slalom:** The signature obstacles are the unusual physical diverters installed down the middle of MLK. At roughly block-length intervals, their placement forces the vehicle lane to bend **right, then left, then right, then left**. Model the roadway as a readable sequence of alternating lateral offsets, not a straight road sprinkled with random traffic cones. The player must anticipate the next bend, steer through the narrow open path, and straighten out in time for the next reversal. Exaggerate the rhythm and visual absurdity, but preserve this recognizable Berkeley street-design detail.

**Additional complications:** Potholes bounce the car just before a steering reversal; occasional cyclists roll through stop signs at cross streets, with conspicuous warning cues and sufficient reaction time. A badly timed pothole bounce may leave the car sideways entering the next chicane. Collision effects are slapstick spins, delays, and flying bagels; nobody is injured.

**Presentation and scoring:** A sports announcer treats the road as an Olympic slalom: **GATE ONE! HARD RIGHT! NOW HARD LEFT!** An on-screen banner reads **MLK MUNICIPAL SLALOM — NO SKI LIFT REQUIRED**. Award points for cleanly threading successive diverters, maintaining a combo through alternating bends, and near misses. Hitting a diverter breaks the combo and triggers a cartoon ricochet; it never rewards striking a person. When a cyclist sails through an intersection, the announcer yells **STOP SIGN: OPTIONAL IN THIS DIMENSION!** This is a joke about particular game characters, not all cyclists.

**Final twist:** After the player clears the last diverter, the finish line shifts one block farther down MLK because the street has been redesignated a demonstration corridor — complete with one more right-left pair.

**Implementation acceptance test:** A playtester who knows MLK should recognize the alternating centerline-diverter chicanes as the main challenge, even if every secondary hazard is switched off.

### Finale — Mission Accomplished (30 seconds)
The player arrives at a podium, still without a bagel. A fictional council announces that the trip was a resounding success because it “generated actionable learnings.” Confetti falls. The car drops into one final pothole. Display:

**MISSION PASSED!**
**PARKING SPACES FOUND: 0**
**COMMITTEES FORMED: 7**
**BAGELS ACQUIRED: 0**

Buttons: **PLAY AGAIN** and **SHARE YOUR CIVIC ACHIEVEMENT** (copy a short result string/link).

## 5. Controls
| Input | Action |
|---|---|
| Arrow keys or WASD | Accelerate, brake/reverse, steer |
| Space | Handbrake / sharp turn |
| Enter or E | Interact with mission markers |
| M | Toggle minimap |
| P or Escape | Pause |
| Mouse / tap | Dialogue choices and menus |

Use forgiving arcade handling, not a driving simulator. Clearly display the controls before play.

## 6. Art, audio, and writing
- **Visuals:** Colorful, chunky 2D cartoon sprites with intentionally overdramatic GTA-style mission banners. A fictionalized Berkeley street grid, recognizable signs for Hopkins, MLK, and City Hall, and stylized civic architecture.
- **Camera:** Top-down or slightly angled overhead, following the car. City Hall dialogue switches to a static comic-panel scene.
- **Effects:** Squash-and-stretch car suspension, exaggerated pothole launches, wobbling signs, confetti, bureaucratic stamp animations.
- **Sound:** Optional original surf/funk-inspired instrumental loop; boings, stamp thuds, bicycle bells, dramatic mission stings. Start muted until user interaction; persistent mute button.
- **Writing:** Short punchlines, usually one sentence. Never block the player with long exposition.
- **Brand/IP:** Use an original title treatment and original graphics/music; parody the genre without copying GTA assets, logos, soundtrack, characters, or dialogue.

## 7. HUD and game feedback
Top left: current objective. Top right: **BUREAUCRACY LEVEL** (0–5 stars). Bottom left: minimap with route marker. Bottom center: small bagel integrity indicator during slalom. Pop-up banners announce **MISSION START**, **PUBLIC COMMENT EXPIRED**, and **MISSION PASSED**.

Bureaucracy stars increase with scripted events; at higher levels, more orange cones and inspectors appear. The meter is comedic, not a punishment spiral.

## 8. Technical specification
- **Platform:** Modern desktop browsers (Chrome, Safari, Firefox, Edge); responsive canvas with optional on-screen mobile controls as a stretch goal.
- **Architecture:** Static HTML/CSS/JavaScript application; Canvas 2D with a lightweight game framework such as Phaser 3, or equivalent. No backend needed.
- **Hosting:** Deployable to GitHub Pages, Netlify, or any static host over HTTPS.
- **Assets:** Locally bundled original SVG/PNG sprites and compressed audio. No external API calls or location permissions.
- **State:** Simple finite-state machine: Title → Driving 1 → Hopkins → Council → Slalom → Finale. Checkpoints between missions; restart and pause supported.
- **Collision:** Simplified circle/rectangle collision; potholes trigger timed impulses and animation, not complex rigid-body physics.
- **Performance:** Target 60 FPS on ordinary laptops; acceptable at 30 FPS; avoid huge textures and particle counts.
- **Accessibility:** Keyboard playable, visible focus for menus, adjustable/mutable audio, reduced-motion option, high-contrast hazard outlines, readable text.
- **Privacy:** No analytics, accounts, tracking, or user-generated uploads required.

## 9. Minimum viable build scope
**Must ship:** One compact street map; one drivable car; pothole bouncing; Hopkins disappearing-parking sequence; Council dialogue minigame; MLK slalom with stop-sign-running cyclist hazards; final score screen; restart; sound toggle.

**Can defer:** Additional cars, pedestrians, free-roam exploration, voice acting, mobile touch controls, leaderboards, dynamic traffic, multiple endings, procedural map generation.

**Scope guardrail:** This is a short scripted arcade comedy, **not** a miniature full GTA clone. Prioritize comic timing and polished transitions over simulation complexity.

## 10. Acceptance criteria
1. A first-time player understands the goal and controls within 15 seconds.
2. A complete run takes roughly 5–8 minutes.
3. At least three pothole hits visibly toss or spin the vehicle while remaining recoverable.
4. Hopkins parking spaces visibly disappear or change designation as the player approaches.
5. Council interaction contains multiple distinct satirical responses and a clear completion trigger.
6. MLK slalom includes visibly signaled cyclist stop-sign violations and other nonviolent hazards.
7. No collision shows blood, injury, or realistic harm.
8. Game runs from a static web host without sign-in or server components.
9. Pause, restart, audio mute, and checkpoint retries function correctly.
10. End screen displays the three civic outcome counters and a replay action.

## 11. Suggested title options
**Preferred:** *Grand Theft Auto: Berkeley — Pothole City* (working parody title; avoid reproducing the franchise's distinctive logo).

Alternatives: *Grand Theft Parking: Berkeley*, *Berkeley Auto Theft: The Parking Mission*, *Grand Theft Bureaucracy*.

**Best public-facing choice:** *Grand Theft Parking: Berkeley* — unmistakably evocative, locally specific, and more distinct as an original game identity.
