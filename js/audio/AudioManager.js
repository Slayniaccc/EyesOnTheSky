// Central audio loading/playback helper.
//
// Files listed in the manifest below don't exist on disk yet — drop MP3s into
// the matching assets/audio/ path and everything here starts working with no
// further code changes. Phaser skips any manifest entry that 404s during
// preload (it just never enters scene.cache.audio), and every play*() call
// checks the cache first, so missing files are always a silent no-op rather
// than a console error or a crash.
//
// Usage:
//   AudioManager.preloadAll(this);                                  // once, in IntroScene.preload()
//   AudioManager.playMusic(this, AudioManager.manifest.music.bunkerAmbience);
//   AudioManager.playSFX(this, AudioManager.manifest.sfx.buttonClick);
//   AudioManager.playVoice(this, AudioManager.manifest.voice.waaf.someLine, {}, () => next());
const AudioManager = {
    manifest: {
        music: {
            bunkerAmbience: { key: 'bunker-ambience', path: 'assets/audio/bunker-ambience.mp3', volume: 0.3, loop: true },
            // Faint, distant engine drone under IntroScene — kept deliberately
            // quiet (this is for kids, and it plays under narration/dialogue
            // for the whole intro) rather than a foreground effect like the
            // InterceptScene engine loops.
            planeFlyby: { key: 'plane-flyby-ambience', path: 'assets/audio/plane-flyby-ambience.wav', volume: 0.08, loop: true }
        },
        sfx: {
            buttonClick: { key: 'sfx-click', path: 'assets/audio/sfx/click.wav', volume: 0.5 },
            radarPing: { key: 'sfx-radar-ping', path: 'assets/audio/sfx/radar-blip.flac', volume: 0.5 },
            radioStatic: { key: 'sfx-radio-static', path: 'assets/audio/sfx/radio-static.wav', volume: 0.12 },
            // loop: true so playMusic/stopMusic (not playSFX) can be reused for
            // these — they represent continuous engine drone for as long as
            // the planes are the visual focus (airfield view onward), not a
            // one-shot effect. Volume dropped twice now (0.35 -> 0.15 -> 0.05)
            // — still startling a Y6 audience at 0.15 since this loops
            // continuously rather than playing once.
            spitfireEngine: { key: 'sfx-spitfire-engine', path: 'assets/audio/sfx/merlin-engine.wav', volume: 0.05, loop: true },
            messerschmittEngine: { key: 'sfx-messerschmitt-engine', path: 'assets/audio/sfx/messerschmitt-engine.flac', volume: 0.05, loop: true },
            victoryCelebration: { key: 'sfx-victory-celebration', path: 'assets/audio/sfx/victory-celebration.wav', volume: 0.3 }
        },
        // Add entries here as lines get scripted/recorded, e.g.:
        // waaf: { toteIntro: { key: 'waaf-tote-intro', path: 'assets/audio/waaf-lines/tote-intro.mp3', volume: 0.6 } }
        voice: {
            // Static (non-interpolated) WAAF lines from DetectionScene, ToteBoardScene
            // and DecisionScene's dialogue boxes.
            waaf: {
                detectionWelcome: { key: 'waaf-detection-welcome', path: 'assets/audio/waaf-lines/detection-welcome.mp3', volume: 0.6 },
                radarComplete: { key: 'waaf-radar-complete', path: 'assets/audio/waaf-lines/radar-complete.mp3', volume: 0.6 },
                raidOverLand: { key: 'waaf-raid-over-land', path: 'assets/audio/waaf-lines/raid-over-land.mp3', volume: 0.6 },
                rocComplete: { key: 'waaf-roc-complete', path: 'assets/audio/waaf-lines/roc-complete.mp3', volume: 0.6 },
                // DecisionScene's Keith Park -> WAAF handoff line.
                decisionHandoff: { key: 'waaf-decision-handoff', path: 'assets/audio/waaf-lines/decision-handoff.mp3', volume: 0.6 },
                // ToteBoardScene's randomised call-out (one of four, picked per round).
                toteCall1: { key: 'waaf-tote-call-1', path: 'assets/audio/waaf-lines/tote-call-1.mp3', volume: 0.6 },
                toteCall2: { key: 'waaf-tote-call-2', path: 'assets/audio/waaf-lines/tote-call-2.mp3', volume: 0.6 },
                toteCall3: { key: 'waaf-tote-call-3', path: 'assets/audio/waaf-lines/tote-call-3.mp3', volume: 0.6 },
                toteCall4: { key: 'waaf-tote-call-4', path: 'assets/audio/waaf-lines/tote-call-4.mp3', volume: 0.6 },
                toteCorrect: { key: 'waaf-tote-correct', path: 'assets/audio/waaf-lines/tote-correct.mp3', volume: 0.6 },
                toteWrong: { key: 'waaf-tote-wrong', path: 'assets/audio/waaf-lines/tote-wrong.mp3', volume: 0.6 },
                toteMissed: { key: 'waaf-tote-missed', path: 'assets/audio/waaf-lines/tote-missed.mp3', volume: 0.6 },
                toteComplete: { key: 'waaf-tote-complete', path: 'assets/audio/waaf-lines/tote-complete.mp3', volume: 0.6 }
            },
            // DecisionScene's briefing, in the order parkLines[0..3] plays them.
            keithPark: {
                introGroups: { key: 'keith-park-intro-groups', path: 'assets/audio/keith-park-lines/intro-groups.mp3', volume: 0.6 },
                introElevenGroup: { key: 'keith-park-intro-eleven-group', path: 'assets/audio/keith-park-lines/intro-eleven-group.mp3', volume: 0.6 },
                raidsInbound: { key: 'keith-park-raids-inbound', path: 'assets/audio/keith-park-lines/raids-inbound.mp3', volume: 0.6 },
                neverEnough: { key: 'keith-park-never-enough', path: 'assets/audio/keith-park-lines/never-enough.mp3', volume: 0.6 }
            },
            // InterceptScene (form-up/intercept/escort phases) and ResultScene
            // (final debrief, one of the three outcome lines).
            ludwik: {
                intro: { key: 'ludwik-intro', path: 'assets/audio/ludwik-lines/intro.mp3', volume: 0.6 },
                formationReady: { key: 'ludwik-formation-ready', path: 'assets/audio/ludwik-lines/formation-ready.mp3', volume: 0.6 },
                airfieldReady: { key: 'ludwik-airfield-ready', path: 'assets/audio/ludwik-lines/airfield-ready.mp3', volume: 0.6 },
                interceptStart: { key: 'ludwik-intercept-start', path: 'assets/audio/ludwik-lines/intercept-start.mp3', volume: 0.6 },
                tooSlow: { key: 'ludwik-too-slow', path: 'assets/audio/ludwik-lines/too-slow.mp3', volume: 0.6 },
                holdLine: { key: 'ludwik-hold-line', path: 'assets/audio/ludwik-lines/hold-line.mp3', volume: 0.6 },
                allTurnedBack: { key: 'ludwik-all-turned-back', path: 'assets/audio/ludwik-lines/all-turned-back.mp3', volume: 0.6 },
                resultSuccess: { key: 'ludwik-result-success', path: 'assets/audio/ludwik-lines/result-success.mp3', volume: 0.6 },
                resultPartial: { key: 'ludwik-result-partial', path: 'assets/audio/ludwik-lines/result-partial.mp3', volume: 0.6 },
                resultFail: { key: 'ludwik-result-fail', path: 'assets/audio/ludwik-lines/result-fail.mp3', volume: 0.6 }
            },
            // Narrates the four Dowding System steps on IntroScene's diagram page.
            dowdingNarrator: {
                step1: { key: 'dowding-step1', path: 'assets/audio/dowding-narrator-lines/step1.mp3', volume: 0.7 },
                step2: { key: 'dowding-step2', path: 'assets/audio/dowding-narrator-lines/step2.mp3', volume: 0.7 },
                step3: { key: 'dowding-step3', path: 'assets/audio/dowding-narrator-lines/step3.mp3', volume: 0.7 },
                step4: { key: 'dowding-step4', path: 'assets/audio/dowding-narrator-lines/step4.mp3', volume: 0.7 }
            }
        }
    },

    _music: {},

    // Call once, from the first scene's preload() — Phaser's audio cache is
    // shared game-wide, so every later scene can just play by key.
    preloadAll(scene) {
        this._walk(this.manifest, (entry) => scene.load.audio(entry.key, entry.path));
    },

    _walk(node, fn) {
        Object.values(node).forEach((value) => {
            if (value && typeof value.key === 'string' && typeof value.path === 'string') {
                fn(value);
            } else if (value && typeof value === 'object') {
                this._walk(value, fn);
            }
        });
    },

    has(scene, entry) {
        return !!entry && scene.cache.audio.exists(entry.key);
    },

    playSFX(scene, entry, config) {
        if (!this.has(scene, entry)) return null;
        return scene.sound.play(entry.key, Object.assign({ volume: entry.volume }, config));
    },

    playVoice(scene, entry, config, onComplete) {
        if (!this.has(scene, entry)) {
            if (onComplete) onComplete();
            return null;
        }
        const sound = scene.sound.add(entry.key, Object.assign({ volume: entry.volume != null ? entry.volume : 0.6 }, config));
        if (onComplete) sound.once('complete', onComplete);
        sound.play();
        return sound;
    },

    // Phaser's SoundManager is global to the game, not per-scene, so music
    // started in one scene keeps playing through scene.start() transitions
    // until stopMusic() is called.
    playMusic(scene, entry, config) {
        if (!this.has(scene, entry)) return null;
        const existing = this._music[entry.key];
        if (existing && existing.isPlaying) return existing;
        const sound = scene.sound.add(entry.key, Object.assign({ volume: entry.volume, loop: entry.loop !== false }, config));
        sound.play();
        this._music[entry.key] = sound;
        return sound;
    },

    stopMusic(entry) {
        const sound = entry && this._music[entry.key];
        if (sound) sound.stop();
    },

    setMuted(scene, muted) {
        scene.sound.mute = muted;
    }
};
