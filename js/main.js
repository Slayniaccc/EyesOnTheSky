
// Game Configuration
const config = {
    type: Phaser.AUTO,
    width: 900,
    height: 700,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: [IntroScene, DetectionScene, ToteBoardScene, DecisionScene, InterceptScene, ResultScene],
    scale: {
        mode: Phaser.Scale.FIT,
        // #game-container already centers the canvas via CSS flexbox (see
        // game.css). Phaser's own CENTER_BOTH does the same job with its own
        // margin math on the canvas element, and the two stacked produced
        // asymmetric offsets (canvas pinned to one edge with all the slack on
        // the other side) instead of true centering. One centering mechanism,
        // not two — CSS owns it here.
        autoCenter: Phaser.Scale.NO_CENTER
    },
    render: {
        // TODO(real-device-test): if the Tab A6 shows GPU-bound frame drops,
        // this is the cheapest thing to try disabling first — one-line
        // revert, not changed here since it can't be judged without the
        // actual hardware.
        antialias: true
    },
    // capture: true registers Phaser's touch listeners in the capture phase
    // instead of bubble — the standard fix for older Android WebViews (the
    // target Galaxy A6 tablet) occasionally swallowing the very first touch
    // on a fresh page/canvas for their own gesture recognition before it
    // reaches Phaser. No effect on desktop/mouse input.
    input: {
        touch: {
            capture: true
        }
    }
};

// Create the game instance
const game = new Phaser.Game(config);

// Initialize shared game data
game.registry.set('score', 0);
game.registry.set('raids', []);
game.registry.set('interceptSuccess', false);
game.registry.set('playerChoices', {});
