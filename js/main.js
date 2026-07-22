
// Game Configuration
const config = {
    type: Phaser.AUTO,
    width: 900,
    height: 700,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: [IntroScene, DetectionScene, ToteBoardScene, DecisionScene, InterceptScene], 
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
  function jumpToScene(sceneKey) {
            const game = window.game;
            if (game) {
                game.scene.stopAll();
                game.scene.start(sceneKey);
            }
        }

        // Keyboard shortcuts: 1-5
        document.addEventListener('keydown', function(e) {
            const game = window.game;
            if (!game) return;
            const sceneMap = {
                '1': 'IntroScene',
                '2': 'DetectionScene',
                '3': 'ToteBoardScene',
                '4': 'DecisionScene',
                '5': 'InterceptScene'
            };
            if (e.key in sceneMap) {
                game.scene.stopAll();
                game.scene.start(sceneMap[e.key]);
                console.log('🔀 Jumped to:', sceneMap[e.key]);
            }
        });