// js/main.js

// Create a minimal temporary scene just to test the engine
class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        const { width, height } = this.scale;
        
        // simple title to prove Phaser is running
        this.add.text(width / 2, height / 2, 'Eyes On The Sky\n(Phaser Loaded!)', {
            fontSize: '48px',
            fill: '#f5e56b',
            fontFamily: 'Courier New',
            fontStyle: 'bold',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Log to the browser console
        console.log('Phaser is running!');
    }
}

// Game Configuration
const config = {
    type: Phaser.AUTO,
    width: 900,
    height: 700,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: [BootScene], // Just this one scene for now
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