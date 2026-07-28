# CLAUDE.md - Eyes On The Sky: Battle of Britain Game

## Project Overview
A tablet-first educational game for Y6 kids (ages 10-11), simulating the RAF plotting table during the Battle of Britain. Built with HTML, CSS, JavaScript, and Phaser 3.

## Target Platform
- **Primary Device:** Samsung Galaxy A6 Tablet
- **Resolution:** Full screen responsive (currently 900x700, needs tablet optimization)
- **Input:** Touch-first (tap, drag, swipe)

---

## 🔧 Remaining Issues (found in playtesting — 2026-07-27)

- [x] **Dowding System narrator** — the 4 narrator lines are recorded and dropped into `assets/audio/dowding-narrator-lines/step1.mp3` through `step4.mp3`
- [x] **ToteBoardScene: lock panel taps until WAAF finishes her opening line** — fixed, but scoped to just the "Tote board live..." intro before round 1 starts; each round's own call-out still allows tapping while it plays (locking every round's call-out made the reaction timer too generous — a miss became basically impossible)
- [x] **DecisionScene: Keith Park's first line slightly overflows the screen** — fixed, wrap width now measured against the actual dialogue box edge
- [x] **Bug: Ludwik's "Now we're ready..." line doesn't play** — fixed, it was getting silently skipped when tapped fast (the intro line was still playing); now waits and plays right after
- [x] **Give Ludwik a presence earlier in InterceptScene** — added a plotting-table corner portrait badge for the form-up phase, plus a speech bubble (with his portrait) that follows his plane once the scene switches to the airfield view, fading out once the escort phase starts
- [x] **Add a kid-friendly "shot down" sound** — a cartoon descending "womp" (`sfx.shotDown`), plays per-plane during the escort phase
- [x] **IntroScene: RAF planes flying around in the background** — implemented, drifting across the title/character/Dowding pages

---

## 🎯 HIGH PRIORITY TASKS

### 1. Audio Implementation
**Goal:** Add immersive voice acting and sound effects to make the game more engaging for kids.

#### Voice Characters:
- **WAAF (1940s British female):** ElevenLabs "British - Eleanor" OR real WAAF interview recordings
- **Keith Park (mature British commander):** ElevenLabs "British - Brian" OR his actual 1949 recording
- **Ludwik (Polish-accented):** ElevenLabs "Polish - Marek" OR voice actor on Voices.com
- **Dowding Narrator:** ElevenLabs "British - Brian" (documentary style)

#### Sound Effects:
- Bunker ambience: Search "WW2 Bunker" on Ambient-Mixer.com
- Plane engines: Search "Spitfire Merlin engine" or "Messerschmitt engine"
- Radar ping, radio static, button clicks

#### Implementation:
```javascript
// In preload()
this.load.audio('bunker', 'assets/audio/bunker-ambience.mp3');
this.load.audio('waaf1', 'assets/audio/waaf-line1.mp3');

// Play background loop
const bgSound = this.sound.add('bunker', { loop: true, volume: 0.3 });
bgSound.play();

// Trigger voice lines
this.sound.play('waaf1', { volume: 0.5 });
```

---

### 2. Tablet Responsiveness
**Goal:** Full-screen display on Samsung Galaxy A6 tablet.

**Actions Required:**
- [x] Adjust `main.js` scaling settings for tablet
- [ ] Test on actual Galaxy A6 device
- [x] Ensure touch events work correctly (tap, drag, swipe) — `input.touch.capture: true` handles the older-WebView first-touch-swallowed issue; every draggable/tappable element now has an explicit touch-friendly hit area
- [ ] Check UI elements are properly sized for tablet
- [x] Make buttons and interactive elements larger (min 44px for touch targets) — done across the board (ROC posts, radar blips, tote panels, DecisionScene raid markers)

**Current main.js scaling:**
```javascript
scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.NO_CENTER // #game-container's CSS flexbox owns centering instead — see main.js's comment for why
}
```

**Remaining real blocker:** none known — Phaser now loads from a local file (`js/phaser.min.js`) instead of a CDN, so the game doesn't depend on network access at all. What's left is genuinely just hands-on testing on the actual device.

---

### 3. Intro Scene Redesign
**Goal:** More visually appealing for kids, introduce characters properly.

| Change | Status |
| :--- | :--- |
| Change colour scheme (brighter, more kid-friendly) | ⏳ To Do |
| Add additional page introducing characters | ⏳ To Do |
| Remove WAAF mascot from main scene (move to character intro) | ⏳ To Do |
| Dowding System diagram: increase resolution, show one at a time with audio explanations | ⏳ To Do |

**Visual Suggestions:**
- Use warm, inviting colours (gold, cream, light blue)
- Add character cards with names and roles
- Make text larger and more readable
- Animated transitions between intro pages

---

### 4. Tote Board Scene Fix
**Status:** Fixed in an earlier session — the panel tap handler works correctly, hit areas are the full 180×120 panel (well past the touch-target minimum), and the state machine correctly advances rounds. Audio for state calls/feedback is implemented (`AudioManager.manifest.voice.waaf.tote*`).

---

### 5. Intercept Scene Enhancement
**Goal:** More realistic and visually exciting.

| Change | Status |
| :--- | :--- |
| Add actual RAF planes (Spitfires) instead of triangles | ⏳ To Do |
| Add real airfield background | ⏳ To Do |
| Add Ludwik voice lines | ⏳ To Do |
| Add plane engine sounds | ⏳ To Do |

**Plane Design Options:**
1. Coded Spitfires using Phaser Graphics (triangles with wing shapes)
2. PNG sprite sheets (more detailed)
3. Simple emoji/unicode plane symbols

---

## 🎨 MEDIUM PRIORITY TASKS

### 6. Detection Scene Improvements
**Goal:** Better visibility and interactivity.

| Change | Status |
| :--- | :--- |
| Make ROC posts bigger (easier for kids to tap) | ✅ Done |
| Add WAAF voice lines with audio | ✅ Done |
| Correctly position WAAF mascot (not too small) | ⏳ To Do |

**ROC Post Sizing:**
- Visual icon is ~1.8x the original 24x44 (`spawnROCPosts` in `DetectionScene.js`)
- Tappable hit area is a 100px-diameter circle — well past the 44px minimum

---

### 7. General Visual Polish
**Goal:** Make the game more visually appealing for kids.

- [ ] Ensure WAAF mascot is visible and appropriately sized
- [ ] Use brighter, more engaging colours (avoid dark/military palette where possible)
- [ ] Add satisfying animations and feedback (bounce, sparkle, confetti)
- [ ] Make buttons larger and easier to tap (min 44px)
- [ ] Add emojis and icons for visual interest
- [ ] Use friendly, readable fonts

---

## 📋 LOW PRIORITY TASKS

### 8. Result Scene
**Goal:** Complete final screen.

| Change | Status |
| :--- | :--- |
| Design success/partial/fail screens | ⏳ To Do |
| Add Ludwik's final voice lines | ⏳ To Do |
| Add restart/play again functionality | ⏳ To Do |

**Result Types:**
- **Full Success:** All enemies turned back → City saved, shield pulse, fly-back animation
- **Partial Success:** Most enemies turned back → Small damage marker
- **Fail:** Enemy reached city → Shadow marker, "Tomorrow we'll be ready"

---

## 🎨 Visual & Audio Assets Required

| Asset | Format | Source | Status |
| :--- | :--- | :--- | :--- |
| WAAF mascot (resized) | PNG | Existing asset | ⏳ To Do |
| Keith Park portrait | PNG | Existing asset | ✅ Done |
| Ludwik portrait | PNG | Existing asset | ✅ Done |
| RAF planes (Spitfire) | PNG/Coded | Need to create | ⏳ To Do |
| Airfield background | PNG | Need to source/create | ⏳ To Do |
| Dowding System diagrams | PNG | Need higher res | ⏳ To Do |
| Bunker ambience | MP3 | Ambient-Mixer.com | ⏳ To Do |
| Voice lines (all characters) | MP3 | ElevenLabs/Voices.com | ⏳ To Do |
| Sound effects (planes, pings, clicks) | MP3 | Free SFX sites | ⏳ To Do |

---

## 🔧 Technical Notes

### Tablet Testing
- Use Chrome DevTools device emulation for initial testing
- Test on actual Galaxy A6 tablet before final deployment
- Ensure touch events work correctly (Phaser pointer events handle this)

### Audio Integration
- All audio files should be MP3 (smaller file size)
- Keep individual files under 2MB when possible
- Preload audio in each scene's `preload()` method
- Use `volume` parameter to balance audio levels

### Touch Targets
- Minimum touch target size: 44x44px (Apple HIG) or 48x48px (Android)
- For child-friendly design, aim for 50x50px or larger

### Drag & Drop
- Phaser's `draggable: true` works on tablets
- Use `pointerdown`, `pointermove`, `pointerup` for custom drag behavior
- Test drag sensitivity on touch devices

### Colour Palette Suggestions
- **Background:** Warm cream/light blue (instead of dark military)
- **Buttons:** Bright green, gold, or blue
- **Text:** Dark on light backgrounds for readability
- **Accents:** Gold, red, RAF blue

---

## 📁 File Structure
```
EyesOnTheSky/
├── index.html
├── css/
│   └── game.css
├── js/
│   ├── main.js
│   ├── phaser.min.js         (local Phaser 3.60.0 build, not a CDN)
│   ├── audio/
│   │   └── AudioManager.js
│   └── scenes/
│       ├── BaseGameScene.js  (shared helpers: map bg, dialogue box, portrait badges, etc.)
│       ├── IntroScene.js
│       ├── DetectionScene.js
│       ├── ToteBoardScene.js
│       ├── DecisionScene.js
│       ├── InterceptScene.js
│       ├── ResultScene.js
│       └── DebugMenuScene.js (dev-only scene-jump overlay)
├── assets/
│   ├── images/
│   │   ├── keithpark.png, ludwik.png       (portraits, resized to 500px tall)
│   │   ├── waaf-mascot-bust.png
│   │   ├── mapbackground.png, toteboard.png
│   │   ├── raf-plane.png, german_plane.png
│   │   └── _originals_backup/              (pre-resize originals)
│   └── audio/
│       ├── bunker-ambience.mp3, plane-flyby-ambience.mp3
│       ├── waaf-lines/, keith-park-lines/, ludwik-lines/, dowding-narrator-lines/
│       ├── sfx/            (click, engines, formation-chime, shot-down, etc. — mostly mp3)
│       └── _originals_backup/, sfx/_originals_backup/  (pre-compression originals)
└── CLAUDE.md
```

---

## ✅ Next Session Checklist

### HIGH PRIORITY (Do First)
- [ ] Fix Tote Board click issue (always returns false)
- [ ] Set up audio files and implement in scenes
- [ ] Test tablet responsiveness on Galaxy A6
- [ ] Add RAF planes and airfield background to InterceptScene

### MEDIUM PRIORITY (Do Second)
- [ ] Redesign Intro Scene (colour scheme, character intro)
- [ ] Improve Detection Scene (ROC post size, mascot position)
- [ ] General visual polish (brighter colours, bigger buttons)

### LOW PRIORITY (Do Last)
- [ ] Complete Result Scene
- [ ] Add final voice lines
- [ ] Polish animations and transitions
