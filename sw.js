// Offline support for the tablet: this project intentionally has zero
// runtime network dependencies (Phaser is a local file, not a CDN — see
// CLAUDE.md), so once every asset has been fetched once while online, the
// game can run with no connection at all.
//
// SHELL_FILES are precached on install so the game can boot offline even on
// a visit where the player doesn't reach every scene. Everything else
// (images, audio, per-scene assets) is added to the runtime cache the first
// time it's fetched — i.e. after one full playthrough while online, the
// whole game works offline. Bump the version below after changing SHELL_FILES
// or shipping an update, so returning players get the fresh copy.
const VERSION = 'v3';
const SHELL_CACHE = `eots-shell-${VERSION}`;
const RUNTIME_CACHE = `eots-runtime-${VERSION}`;

const SHELL_FILES = [
    './',
    './index.html',
    './manifest.json',
    './css/game.css',
    './js/phaser.min.js',
    './js/main.js',
    './js/audio/AudioManager.js',
    './js/scenes/BaseGameScene.js',
    './js/scenes/IntroScene.js',
    './js/scenes/DetectionScene.js',
    './js/scenes/ToteBoardScene.js',
    './js/scenes/DecisionScene.js',
    './js/scenes/InterceptScene.js',
    './js/scenes/ResultScene.js',
    './js/scenes/DebugMenuScene.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys
                .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
                .map((key) => caches.delete(key))
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request)
                .then((response) => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, copy));
                    }
                    return response;
                })
                .catch(() => cached);
        })
    );
});
