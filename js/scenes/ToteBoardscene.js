class ToteBoardScene extends Phaser.Scene {
    constructor() {
        super('ToteBoardScene');
    }

    preload() {
        // Load the tote board background image
        this.load.image('tote-board', 'assets/images/tote-board.png');
        console.log('ToteBoardScene: preloading tote-board.png');
    }

    create() {
        const { width, height } = this.scale;

        // ---------- BACKGROUND ----------
        if (this.textures.exists('tote-board')) {
            this.add.image(width / 2, height / 2, 'tote-board').setDisplaySize(width, height);
            console.log('Using tote-board.png');
        } else {
            // Fallback: dark background with a simple border
            const bg = this.add.graphics();
            bg.fillStyle(0x0d1b2a);
            bg.fillRect(0, 0, width, height);
            bg.lineStyle(2, 0xf5e56b, 0.3);
            bg.strokeRoundedRect(40, 40, width - 80, height - 80, 16);
        }

        // ---------- TOP BAR UI ----------
        this.add.text(20, 20, '◈ TOTE BOARD', {
            fontSize: '18px',
            fill: '#ffd700',
            fontFamily: 'Courier New'
        });

        // ---------- STATE MACHINE VARIABLES ----------
        this.states = ['Available', 'Ordered to Readiness', 'Left Ground'];
        this.currentStateIndex = 0;          // Which state is currently highlighted
        this.targetState = '';               // The state the player must tap
        this.round = 0;
        this.maxRounds = 5;
        this.baseTimerDelay = 2000;          // Starts at 2 seconds
        this.timerDelay = this.baseTimerDelay;
        this.timerEvent = null;
        this.isWaitingForTap = false;
        this.gameOver = false;

        // ---------- PLACEHOLDER FOR COMMIT 2-5 ----------
        //add dialogue, panels, and logic here

        console.log('ToteBoardScene: initialised');
    }
}