
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
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
        // Scale.FIT stretches the 900x700 canvas to fill much larger tablet
        // screens; without a matching render resolution, that stretch is done
        // on an already-rasterised low-res buffer, so every text/image looks
        // soft. Rendering at the device's actual pixel ratio makes the internal
        // buffer big enough that the stretch is crisp instead of blurry.
        antialias: true,
        resolution: window.devicePixelRatio || 1
    }
};

// Create the game instance
const game = new Phaser.Game(config);

// Initialize shared game data
game.registry.set('score', 0);
game.registry.set('raids', []);
game.registry.set('interceptSuccess', false);
game.registry.set('playerChoices', {});
