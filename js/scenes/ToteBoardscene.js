class ToteBoardScene extends Phaser.Scene {
    constructor() {
        super('ToteBoardScene');
    }

    preload() {
        // Load the tote board background image
        this.load.image('tote-board', 'assets/images/toteboard.png');
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

        // Overlay clean labels so the key board information remains readable.
        const overlay = this.add.graphics();
        overlay.fillStyle(0x0b1622, 0.88);
        overlay.lineStyle(2, 0xf5e56b, 0.45);

        // State title panel (moved to a clear, central top location).
        overlay.fillRoundedRect(width * 0.25, 14, width * 0.34, 44, 8);
        overlay.strokeRoundedRect(width * 0.25, 14, width * 0.34, 44, 8);
        this.add.text(width * 0.26, 26, 'STATE OF SQUADRON', {
            fontSize: '20px',
            fill: '#f7d774',
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        });

        // Clock panel anchored to bottom-right edge to avoid the board columns.
        const clockPanelX = width - 180;
        const clockPanelY = height - 58;
        overlay.fillRoundedRect(clockPanelX, clockPanelY, 160, 40, 8);
        overlay.strokeRoundedRect(clockPanelX, clockPanelY, 160, 40, 8);
        this.clockText = this.add.text(clockPanelX + 18, clockPanelY + 10, '', {
            fontSize: '20px',
            fill: '#f7d774',
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        });

        const updateClock = () => {
            const now = new Date();
            this.clockText.setText(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };
        updateClock();
        this.clockEvent = this.time.addEvent({ delay: 1000, loop: true, callback: updateClock });
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.clockEvent?.remove());

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