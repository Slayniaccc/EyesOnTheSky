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
                // ---------- WAAF DIALOGUE BOX ----------
        const dialogueBoxX = 40;
        const dialogueBoxY = height - 130;
        const dialogueBoxWidth = width - 80;
        const dialogueBoxHeight = 100;

        // Background
        const dialogueBg = this.add.graphics();
        dialogueBg.fillStyle(0x0d1b2a, 0.92);
        dialogueBg.fillRoundedRect(dialogueBoxX, dialogueBoxY, dialogueBoxWidth, dialogueBoxHeight, 16);
        dialogueBg.lineStyle(2, 0xf5e56b, 0.4);
        dialogueBg.strokeRoundedRect(dialogueBoxX, dialogueBoxY, dialogueBoxWidth, dialogueBoxHeight, 16);

        // WAAF Portrait (above dialogue, right side)
        const portraitX = width - 110;
        const portraitY = dialogueBoxY - 60;

        if (this.textures.exists('waaf-mascot')) {
            this.add.image(portraitX, portraitY, 'waaf-mascot')
                .setScale(0.16)
                .setDepth(10);
        } else {
            this.add.text(portraitX, portraitY - 5, 'WAAF', {
                fontSize: '14px',
                fill: '#fff',
                fontFamily: 'Courier New',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(10);
        }

        // Dialogue text
        this.dialogueText = this.add.text(110, height - 100, 'Tote board live. Watch the states — squadrons don\'t just sit ready.', {
            fontSize: '17px',
            fill: '#c8e6c9',
            fontFamily: 'Courier New',
            fontStyle: 'italic',
            wordWrap: { width: width - 120 }
        });

       

              // ---------- STATE PANELS ----------
        const panelWidth = 180;
        const panelHeight = 120;
        const panelY = height / 2 - 80;
        const spacing = 40;
        const totalWidth = this.states.length * panelWidth + (this.states.length - 1) * spacing;
        const startX = (width - totalWidth) / 2;

        this.panelObjects = [];

        this.states.forEach((state, index) => {
            const x = startX + index * (panelWidth + spacing);
            const panel = this.add.graphics();
            
            // Default dark panel
            panel.fillStyle(0x1a2a3a, 0.9);
            panel.fillRoundedRect(x, panelY, panelWidth, panelHeight, 12);
            panel.lineStyle(2, 0x4a6a8a, 0.6);
            panel.strokeRoundedRect(x, panelY, panelWidth, panelHeight, 12);
            
            // State label
            const label = this.add.text(x + panelWidth/2, panelY + 50, state, {
                fontSize: '20px',
                fill: '#b0c4de',
                fontFamily: 'Courier New',
                fontStyle: 'bold',
                align: 'center'
            }).setOrigin(0.5);

            // Store references
            this.panelObjects.push({
                x: x,
                y: panelY,
                width: panelWidth,
                height: panelHeight,
                label: label,
                state: state,
                index: index,
                graphics: panel,
                isHighlighted: false
            });
        });

       
    }
        // ---------- HIGHLIGHT PANEL ----------
    highlightPanel(index) {
        const panel = this.panelObjects[index];
        if (!panel) return;

        this.clearHighlights();

        // Gold highlight
        panel.graphics.clear();
        panel.graphics.fillStyle(0x2a4a3a, 0.9);
        panel.graphics.fillRoundedRect(panel.x, panel.y, panel.width, panel.height, 12);
        panel.graphics.lineStyle(4, 0xf5e56b, 1.0);
        panel.graphics.strokeRoundedRect(panel.x, panel.y, panel.width, panel.height, 12);
        panel.label.setFill('#f5e56b');
        panel.isHighlighted = true;
    }

    // ---------- CLEAR HIGHLIGHTS ----------
    clearHighlights() {
        this.panelObjects.forEach((panel) => {
            panel.graphics.clear();
            panel.graphics.fillStyle(0x1a2a3a, 0.9);
            panel.graphics.fillRoundedRect(panel.x, panel.y, panel.width, panel.height, 12);
            panel.graphics.lineStyle(2, 0x4a6a8a, 0.6);
            panel.graphics.strokeRoundedRect(panel.x, panel.y, panel.width, panel.height, 12);
            panel.label.setFill('#b0c4de');
            panel.isHighlighted = false;
        });
    }

}