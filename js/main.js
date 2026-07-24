
// Game Configuration
const config = {
    type: Phaser.AUTO,
    width: 900,
    height: 700,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: [IntroScene, DetectionScene, ToteBoardScene, DecisionScene, InterceptScene, ResultScene, DebugMenuScene],
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
        antialias: true
    }
};

// Create the game instance
const game = new Phaser.Game(config);

// Initialize shared game data
game.registry.set('score', 0);
game.registry.set('raids', []);
game.registry.set('interceptSuccess', false);
game.registry.set('playerChoices', {});
