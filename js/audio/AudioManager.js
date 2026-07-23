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
            bunkerAmbience: { key: 'bunker-ambience', path: 'assets/audio/bunker-ambience.mp3', volume: 0.3, loop: true }
        },
        sfx: {
            buttonClick: { key: 'sfx-click', path: 'assets/audio/sfx/click.mp3', volume: 0.5 },
            radarPing: { key: 'sfx-radar-ping', path: 'assets/audio/sfx/radar-ping.mp3', volume: 0.5 },
            radioStatic: { key: 'sfx-radio-static', path: 'assets/audio/sfx/radio-static.mp3', volume: 0.4 },
            spitfireEngine: { key: 'sfx-spitfire-engine', path: 'assets/audio/sfx/spitfire-engine.mp3', volume: 0.4 },
            messerschmittEngine: { key: 'sfx-messerschmitt-engine', path: 'assets/audio/sfx/messerschmitt-engine.mp3', volume: 0.4 }
        },
        // Add entries here as lines get scripted/recorded, e.g.:
        // waaf: { toteIntro: { key: 'waaf-tote-intro', path: 'assets/audio/waaf-lines/tote-intro.mp3', volume: 0.6 } }
        voice: {
            waaf: {},
            keithPark: {},
            ludwik: {},
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
