class ToteBoardScene extends Phaser.Scene {
    constructor() {
        super('ToteBoardScene');
    }

    preload() {
        // Load the tote board background image
        this.load.image('tote-board', 'assets/images/toteboard.png');
          this.load.image('waaf-mascot', 'assets/images/waaf-mascot.png');
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
        const portraitX = width - 220;
        const portraitY = dialogueBoxY - 180;

        if (this.textures.exists('waaf-mascot')) {
            this.add.image(portraitX, portraitY, 'waaf-mascot')
                .setScale(0.3)
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
             // ---- MAKE PANEL TAPPABLE ----
    panel.setInteractive(
        new Phaser.Geom.Rectangle(x, panelY, panelWidth, panelHeight),
        Phaser.Geom.Rectangle.Contains
    );
    panel.on('pointerdown', () => this.handlePanelTap(index));
            
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

               // ---------- START THE FIRST ROUND ----------
        this.currentRound = 0;
        this.startRound();

        // ---------- FALLBACK TIMEOUT ----------
        this.time.delayedCall(30000, () => {
            if (!this.gameOver) {
                console.warn('ToteBoard timed out – forcing transition to DecisionScene');
                this.scene.start('DecisionScene');
            }
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
    // ---------- START A NEW ROUND ----------
    startRound() {
        if (this.gameOver) return;

        // Choose a random state to highlight
        const randomIndex = Phaser.Math.Between(0, this.states.length - 1);
        this.targetState = this.states[randomIndex];
        this.targetIndex = randomIndex;

        // Highlight the target
        this.clearHighlights();
        this.highlightPanel(randomIndex);

        // WAAF call-out
        const waafLines = [
            `"Tap the board when it says: ${this.targetState}!"`,
            `"There, ${this.targetState}. Tap it!"`,
            `"Look sharp — ${this.targetState} now!"`,
            `"That's the one — ${this.targetState}. Go!"`
        ];
        const lineIndex = Phaser.Math.Between(0, waafLines.length - 1);
        this.dialogueText.setText(waafLines[lineIndex]);

        // Start timer
        this.isWaitingForTap = true;
        this.roundComplete = false;

        if (this.timerEvent) {
            this.timerEvent.remove();
        }

        this.timerEvent = this.time.delayedCall(this.timerDelay, () => {
            if (this.isWaitingForTap && !this.roundComplete) {
                this.handleMissedTap(); // we'll add in 4c
            }
        });

      
    }
    // ---------- HANDLE PLAYER TAP ----------
handlePanelTap(index) {
    if (!this.isWaitingForTap || this.roundComplete || this.gameOver) return;

    AudioManager.playSFX(this, AudioManager.manifest.sfx.buttonClick);

    this.roundComplete = true;
    this.isWaitingForTap = false;

    if (this.timerEvent) {
        this.timerEvent.remove();
    }

    if (index === this.targetIndex) {
        // ---- CORRECT TAP ----
        const panel = this.panelObjects[index];
        this.tweens.add({
            targets: panel.graphics,
            alpha: 0.3,
            duration: 120,
            yoyo: true,
            onStart: () => {
                panel.graphics.clear();
                panel.graphics.fillStyle(0x44ff44, 0.9);
                panel.graphics.fillRoundedRect(panel.x, panel.y, panel.width, panel.height, 12);
                panel.graphics.lineStyle(4, 0x44ff44, 1.0);
                panel.graphics.strokeRoundedRect(panel.x, panel.y, panel.width, panel.height, 12);
            }
        });
        this.dialogueText.setText('"Got it! Right on the money."');
    } else {
        // ---- WRONG PANEL TAPPED ----
        const panel = this.panelObjects[index];
        this.tweens.add({
            targets: panel.graphics,
            alpha: 0.3,
            duration: 120,
            yoyo: true,
            onStart: () => {
                panel.graphics.clear();
                panel.graphics.fillStyle(0xff4444, 0.9);
                panel.graphics.fillRoundedRect(panel.x, panel.y, panel.width, panel.height, 12);
                panel.graphics.lineStyle(4, 0xff4444, 1.0);
                panel.graphics.strokeRoundedRect(panel.x, panel.y, panel.width, panel.height, 12);
            }
        });
        this.dialogueText.setText('"Wrong board — that wasn\'t the right state."');
    }

    // Move to next round after a short delay
    this.time.delayedCall(1200, () => {
        this.currentRound++;
        if (this.currentRound >= this.maxRounds) {
            this.gameOver = true;
            this.dialogueText.setText('"Tote board complete. Well done. Now to the decision room."');
            this.time.delayedCall(2000, () => {
                this.scene.start('DecisionScene');
            });
            return;
        }
        this.timerDelay = Math.max(500, this.timerDelay - 200);
        this.startRound();
    });
}
        // ---------- HANDLE MISSED TAP ----------
    handleMissedTap() {
        if (this.roundComplete) return;
        if (this.gameOver) return;

        this.isWaitingForTap = false;

        // Flash correct panel red
        const panel = this.panelObjects[this.targetIndex];
        if (panel) {
            this.tweens.add({
                targets: panel.graphics,
                alpha: 0.3,
                duration: 150,
                yoyo: true,
                repeat: 1,
                onStart: () => {
                    panel.graphics.clear();
                    panel.graphics.fillStyle(0xff4444, 0.9);
                    panel.graphics.fillRoundedRect(panel.x, panel.y, panel.width, panel.height, 12);
                    panel.graphics.lineStyle(4, 0xff4444, 1.0);
                    panel.graphics.strokeRoundedRect(panel.x, panel.y, panel.width, panel.height, 12);
                },
                onComplete: () => {
                    this.highlightPanel(this.targetIndex);
                }
            });
        }

        this.dialogueText.setText('"Missed it. That state just changed. We\'ll catch the next one."');

        // Move to next round after delay
        this.time.delayedCall(1500, () => {
            this.currentRound++;
            if (this.currentRound >= this.maxRounds) {
                this.gameOver = true;
                this.dialogueText.setText('"Tote board complete. Well done. Now to the decision room."');
                this.time.delayedCall(2000, () => {
                    this.scene.start('DecisionScene');
                });
                return;
            }
            this.timerDelay = Math.max(500, this.timerDelay - 200);
            this.startRound();
        });
    }
}

//intro scene is 200 lines,tote board 250 lines,detection scene is 350 lines
//need to refractor the code to make it more modular and reusable, especially the panel highlighting and dialogue management.