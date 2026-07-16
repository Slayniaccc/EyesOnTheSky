
// Game Configuration
const config = {
    type: Phaser.AUTO,
    width: 900,
    height: 700,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: [IntroScene, DetectionScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// Create the game instance
const game = new Phaser.Game(config);

// Initialize shared game data
game.registry.set('score', 0);
game.registry.set('raids', []);
game.registry.set('interceptSuccess', false);
game.registry.set('playerChoices', {});