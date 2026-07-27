
---

## 🔧 Remaining Issues (found in playtesting — 2026-07-27)

- [ ] **Dowding System narrator** — the 4 narrator lines for the Dowding System diagram steps aren't recorded yet (code's already wired up for them, just needs `assets/audio/dowding-narrator-lines/step1.mp3` through `step4.mp3` dropped in)
- [x] **ToteBoardScene: lock panel taps until WAAF finishes her call-out line** — fixed, panels now stay locked until she's done speaking
- [x] **DecisionScene: Keith Park's first line slightly overflows the screen** — fixed, wrap width now measured against the actual dialogue box edge
- [x] **Bug: Ludwik's "Now we're ready..." line doesn't play** — fixed, it was getting silently skipped when tapped fast (the intro line was still playing); now waits and plays right after
- [ ] **Give Ludwik a presence earlier in InterceptScene** — right now he only really shows up once it switches to the airfield view; add him to the plotting-table part too (a speech bubble off one of the planes, or a portrait near the bottom of the screen)
- [ ] **Add a kid-friendly "shot down" sound** — plays when an enemy plane gets turned back during the escort phase
- [ ] **(Idea, not committed yet) IntroScene: RAF planes flying around in the background**

---

