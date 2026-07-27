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
            radioStatic: { key: 'sfx-radio-static', path: 'assets/audio/sfx/radio-static.wav', volume: 0.05 },
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
                detectionWelcome: { key: 'waaf-detection-welcome', path: 'assets/audio/waaf-lines/detection-welcome.mp3', volume: 0.85 },
                radarComplete: { key: 'waaf-radar-complete', path: 'assets/audio/waaf-lines/radar-complete.mp3', volume: 0.85 },
                raidOverLand: { key: 'waaf-raid-over-land', path: 'assets/audio/waaf-lines/raid-over-land.mp3', volume: 0.85 },
                rocComplete: { key: 'waaf-roc-complete', path: 'assets/audio/waaf-lines/roc-complete.mp3', volume: 0.85 },
                // DecisionScene's Keith Park -> WAAF handoff, and the "evaluating" line
                // while the player's raid placements are being scored.
                decisionInstruction: { key: 'waaf-decision-instruction', path: 'assets/audio/waaf-lines/decision-instruction.mp3', volume: 0.85 },
                decisionEvaluating: { key: 'waaf-decision-evaluating', path: 'assets/audio/waaf-lines/decision-evaluating.mp3', volume: 0.85 },
                // ToteBoardScene's opening line, plus one recording per
                // (phrasing x state) combo so the state name is never spliced in —
                // 4 phrasings (Tap/There/Sharp/Thats) x 3 states (Available/
                // Readiness/LeftGround) = 12 lines, picked by ToteBoardScene.startRound().
                toteIntro: { key: 'waaf-tote-intro', path: 'assets/audio/waaf-lines/tote-intro.mp3', volume: 0.85 },
                toteTapAvailable: { key: 'waaf-tote-tap-available', path: 'assets/audio/waaf-lines/tote-tap-available.mp3', volume: 0.85 },
                toteTapReadiness: { key: 'waaf-tote-tap-readiness', path: 'assets/audio/waaf-lines/tote-tap-readiness.mp3', volume: 0.85 },
                toteTapLeftGround: { key: 'waaf-tote-tap-left-ground', path: 'assets/audio/waaf-lines/tote-tap-left-ground.mp3', volume: 0.85 },
                toteThereAvailable: { key: 'waaf-tote-there-available', path: 'assets/audio/waaf-lines/tote-there-available.mp3', volume: 0.85 },
                toteThereReadiness: { key: 'waaf-tote-there-readiness', path: 'assets/audio/waaf-lines/tote-there-readiness.mp3', volume: 0.85 },
                toteThereLeftGround: { key: 'waaf-tote-there-left-ground', path: 'assets/audio/waaf-lines/tote-there-left-ground.mp3', volume: 0.85 },
                toteSharpAvailable: { key: 'waaf-tote-sharp-available', path: 'assets/audio/waaf-lines/tote-sharp-available.mp3', volume: 0.85 },
                toteSharpReadiness: { key: 'waaf-tote-sharp-readiness', path: 'assets/audio/waaf-lines/tote-sharp-readiness.mp3', volume: 0.85 },
                toteSharpLeftGround: { key: 'waaf-tote-sharp-left-ground', path: 'assets/audio/waaf-lines/tote-sharp-left-ground.mp3', volume: 0.85 },
                toteThatsAvailable: { key: 'waaf-tote-thats-available', path: 'assets/audio/waaf-lines/tote-thats-available.mp3', volume: 0.85 },
                toteThatsReadiness: { key: 'waaf-tote-thats-readiness', path: 'assets/audio/waaf-lines/tote-thats-readiness.mp3', volume: 0.85 },
                toteThatsLeftGround: { key: 'waaf-tote-thats-left-ground', path: 'assets/audio/waaf-lines/tote-thats-left-ground.mp3', volume: 0.85 },
                toteCorrect: { key: 'waaf-tote-correct', path: 'assets/audio/waaf-lines/tote-correct.mp3', volume: 0.85 },
                toteWrong: { key: 'waaf-tote-wrong', path: 'assets/audio/waaf-lines/tote-wrong.mp3', volume: 0.85 },
                toteMissed: { key: 'waaf-tote-missed', path: 'assets/audio/waaf-lines/tote-missed.mp3', volume: 0.85 },
                toteComplete: { key: 'waaf-tote-complete', path: 'assets/audio/waaf-lines/tote-complete.mp3', volume: 0.85 }
            },
            // DecisionScene's briefing, in the order parkLines[0..3] plays them.
            keithPark: {
                introGroups: { key: 'keith-park-intro-groups', path: 'assets/audio/keith-park-lines/intro-groups.mp3', volume: 0.85 },
                introElevenGroup: { key: 'keith-park-intro-eleven-group', path: 'assets/audio/keith-park-lines/intro-eleven-group.mp3', volume: 0.85 },
                raidsInbound: { key: 'keith-park-raids-inbound', path: 'assets/audio/keith-park-lines/raids-inbound.mp3', volume: 0.85 },
                neverEnough: { key: 'keith-park-never-enough', path: 'assets/audio/keith-park-lines/never-enough.mp3', volume: 0.85 }
            },
            // InterceptScene (form-up/intercept/escort phases) and ResultScene
            // (final debrief, one of the three outcome lines).
            ludwik: {
                intro: { key: 'ludwik-intro', path: 'assets/audio/ludwik-lines/intro.mp3', volume: 0.85 },
                formationReady: { key: 'ludwik-formation-ready', path: 'assets/audio/ludwik-lines/formation-ready.mp3', volume: 0.85 },
                airfieldReady: { key: 'ludwik-airfield-ready', path: 'assets/audio/ludwik-lines/airfield-ready.mp3', volume: 0.85 },
                interceptStart: { key: 'ludwik-intercept-start', path: 'assets/audio/ludwik-lines/intercept-start.mp3', volume: 0.85 },
                tooSlow: { key: 'ludwik-too-slow', path: 'assets/audio/ludwik-lines/too-slow.mp3', volume: 0.85 },
                holdLine: { key: 'ludwik-hold-line', path: 'assets/audio/ludwik-lines/hold-line.mp3', volume: 0.85 },
                allTurnedBack: { key: 'ludwik-all-turned-back', path: 'assets/audio/ludwik-lines/all-turned-back.mp3', volume: 0.85 },
                resultSuccess: { key: 'ludwik-result-success', path: 'assets/audio/ludwik-lines/result-success.mp3', volume: 0.85 },
                resultPartial: { key: 'ludwik-result-partial', path: 'assets/audio/ludwik-lines/result-partial.mp3', volume: 0.85 },
                resultFail: { key: 'ludwik-result-fail', path: 'assets/audio/ludwik-lines/result-fail.mp3', volume: 0.85 }
            },
            // Narrates the four Dowding System steps on IntroScene's diagram page.
            dowdingNarrator: {
                step1: { key: 'dowding-step1', path: 'assets/audio/dowding-narrator-lines/step1.mp3', volume: 0.85 },
                step2: { key: 'dowding-step2', path: 'assets/audio/dowding-narrator-lines/step2.mp3', volume: 0.85 },
                step3: { key: 'dowding-step3', path: 'assets/audio/dowding-narrator-lines/step3.mp3', volume: 0.85 },
                step4: { key: 'dowding-step4', path: 'assets/audio/dowding-narrator-lines/step4.mp3', volume: 0.85 }
            }
        }
    },

    _music: {},
    _currentVoice: null,
    _currentStatic: null,
    _duckedMusic: [],

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

    // Actual length of a loaded clip, in ms — 0 if it's not loaded (missing
    // file). Reads straight from the decoded cache entry rather than an
    // active Sound instance, so it works before the clip has ever played.
    getDurationMs(scene, entry) {
        if (!this.has(scene, entry)) return 0;
        const source = scene.cache.audio.get(entry.key);
        const el = Array.isArray(source) ? source[0] : source;
        return (el && el.duration ? el.duration : 0) * 1000;
    },

    // How long a scene should wait after firing `entry` before moving on —
    // at least minMs (the old fixed-delay value, used verbatim when the line
    // isn't recorded yet), or the clip's real length plus a reading/reaction
    // buffer when it is. Callers pass their existing hardcoded delay as minMs
    // so nothing gets faster than before, only slower when a line needs it.
    voiceAwareDelay(scene, entry, minMs, bufferMs) {
        const buffer = bufferMs != null ? bufferMs : 500;
        const duration = this.getDurationMs(scene, entry);
        return duration ? Math.max(minMs, duration + buffer) : minMs;
    },

    playSFX(scene, entry, config) {
        if (!this.has(scene, entry)) return null;
        return scene.sound.play(entry.key, Object.assign({ volume: entry.volume }, config));
    },

    // The radio-crackle bed (see BaseGameScene.playWaafLine) is a multi-second
    // clip fired at the start of every WAAF line — if two lines start close
    // together, a second crackle used to layer on top of the still-playing
    // first one. Track the single active instance so a new one waits instead.
    playRadioStatic(scene) {
        if (this._currentStatic && this._currentStatic.isPlaying) return null;
        const entry = this.manifest.sfx.radioStatic;
        if (!this.has(scene, entry)) return null;
        const sound = scene.sound.add(entry.key, { volume: entry.volume });
        this._currentStatic = sound;
        sound.play();
        return sound;
    },

    // Ducks whatever's in _music (bunker ambience, engine loops, ...) so a
    // spoken line stays audible over it instead of getting buried, and
    // restores it once the line ends.
    _duckMusic() {
        Object.values(this._music).forEach((sound) => {
            if (sound && sound.isPlaying) {
                this._duckedMusic.push({ sound, original: sound.volume });
                sound.setVolume(sound.volume * 0.35);
            }
        });
    },

    _restoreMusic() {
        this._duckedMusic.forEach(({ sound, original }) => {
            if (sound) sound.setVolume(original);
        });
        this._duckedMusic = [];
    },

    // Only one spoken line — WAAF, Keith Park, Ludwik, or the narrator — should
    // ever be audible at once. Dialogue in most scenes advances faster than a
    // full line takes to read out (ToteBoardScene's rounds especially, down to
    // 500ms between calls), so a new line while one's still playing is simply
    // skipped rather than cutting the current one off mid-sentence or layering
    // on top of it — the caller's onComplete still fires immediately so
    // anything gating on it (e.g. DecisionScene's Continue-button lock) isn't
    // stuck waiting on a line that was never going to play.
    playVoice(scene, entry, config, onComplete) {
        if (!this.has(scene, entry)) {
            if (onComplete) onComplete();
            return null;
        }
        if (this._currentVoice && this._currentVoice.isPlaying) {
            if (onComplete) onComplete();
            return null;
        }
        this._duckMusic();
        const sound = scene.sound.add(entry.key, Object.assign({ volume: entry.volume != null ? entry.volume : 0.85 }, config));
        const finish = () => {
            this._restoreMusic();
            if (onComplete) onComplete();
        };
        sound.once('complete', finish);
        this._currentVoice = sound;
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
