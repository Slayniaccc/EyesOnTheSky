class DecisionScene extends Phaser.Scene {
    constructor() {
        super('DecisionScene');
    }
    preload() {
        this.load.image('map', 'assets/images/mapbackground.png');
        this.load.image('keith-park', 'assets/images/keithpark.png');
        console.log('🔵 DecisionScene: preloading assets');
    }
    create() {
        const { width, height } = this.scale;
          this.createMapBackground(width, height);
        this.createGrid(width, height);
          this.createDialogueBox(width, height);
        this.createKeithParkPortrait(width, height);
 this.add.text(20, 20, '◈ DECISION ROOM', {
            fontSize: '18px',
            fill: '#ffd700',
            fontFamily: 'Courier New'
        });
    }
    
    createMapBackground(width, height) {
        if (this.textures.exists('map')) {
            this.add.image(width / 2, height / 2, 'map').setDisplaySize(width, height);
            console.log('using mapbackground.png');
        } else {
            console.log('map not found – using drawn fallback');
            const bg = this.add.graphics();
            bg.fillStyle(0x0d1b2a);
            bg.fillRect(0, 0, width, height);

            const coast = this.add.graphics();
            coast.lineStyle(2, 0x4a6a8a, 0.4);
            coast.beginPath();
            coast.moveTo(0, 350);
            coast.lineTo(200, 320);
            coast.lineTo(350, 340);
            coast.lineTo(500, 300);
            coast.lineTo(650, 330);
            coast.lineTo(800, 290);
            coast.lineTo(900, 310);
            coast.strokePath();

            coast.lineStyle(2, 0x6a4a3a, 0.3);
            coast.beginPath();
            coast.moveTo(0, 500);
            coast.lineTo(200, 520);
            coast.lineTo(400, 490);
            coast.lineTo(600, 510);
            coast.lineTo(900, 480);
            coast.strokePath();
        }
    }

    createGrid(width, height) {
        const grid = this.add.graphics();
        grid.lineStyle(0.5, 0x3a2a1a, 0.3);
        for (let x = 0; x <= width; x += 50) {
            grid.moveTo(x, 0);
            grid.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += 40) {
            grid.moveTo(0, y);
            grid.lineTo(width, y);
        }
        grid.strokePath();
    }
        createDialogueBox(width, height) {
        const dialogueBoxX = 40;
        const dialogueBoxY = height - 130;
        const dialogueBoxWidth = width - 80;
        const dialogueBoxHeight = 100;

        const dialogueBg = this.add.graphics();
        dialogueBg.fillStyle(0x0d1b2a, 0.92);
        dialogueBg.fillRoundedRect(dialogueBoxX, dialogueBoxY, dialogueBoxWidth, dialogueBoxHeight, 16);
        dialogueBg.lineStyle(2, 0xf5e56b, 0.4);
        dialogueBg.strokeRoundedRect(dialogueBoxX, dialogueBoxY, dialogueBoxWidth, dialogueBoxHeight, 16);
    }

    createKeithParkPortrait(width, height) {
        const portraitX = width - 110;
        const portraitY = height - 200;

        // Circular background
        const circleBg = this.add.graphics();
        circleBg.fillStyle(0x2d1b0e, 0.9);
        circleBg.fillCircle(portraitX, portraitY, 40);
        circleBg.lineStyle(3, 0xf5e56b, 0.7);
        circleBg.strokeCircle(portraitX, portraitY, 40);

        if (this.textures.exists('keith-park')) {
            this.add.image(portraitX, portraitY, 'keith-park').setScale(0.4).setDepth(10);
        } else {
            this.add.text(portraitX, portraitY - 5, 'KP', {
                fontSize: '22px',
                fill: '#f5e56b',
                fontFamily: 'Courier New',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(10);
        }

        this.add.text(portraitX, portraitY + 50, 'Keith Park', {
            fontSize: '12px',
            fill: '#f5e56b',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        //dialogue logic
          this.parkLines = [
            '"Air Vice-Marshal Keith Park here. Fighter Command split Britain into four groups, 10, 11, 12, 13. Mine is 11 Group: London and the south-east."',
            '"Closest to the coast, first in the fight. Squadrons controlled from this bunker accounted for most of the enemy aircraft shot down in the whole battle."',
            '"Two raids inbound. We can\'t cover both fully. Where do we commit?"',
            '"That\'s the job. Never enough squadrons, never enough certainty."'
        ];
        this.currentLineIndex = 0;

        // 2. Create the dialogue text (on top of the dialogue box background)
        this.dialogueText = this.add.text(110, height - 100, this.parkLines[0], {
            fontSize: '17px',
            fill: '#f5e56b',
            fontFamily: 'Courier New',
            fontStyle: 'italic',
            wordWrap: { width: width - 140 }
        });

        // 3. Create the "Continue" button
        const continueBtn = this.add.text(width / 2, height - 160, '▶  CONTINUE  ◀', {
            fontSize: '24px',
            fill: '#ffffff',
            backgroundColor: '#1e3a5f',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // 4. Button click handler
        continueBtn.on('pointerdown', () => {
            this.currentLineIndex++;

            if (this.currentLineIndex < this.parkLines.length) {
                this.dialogueText.setText(this.parkLines[this.currentLineIndex]);
            } else {
                // All Park lines finished – WAAF handoff
                this.dialogueText.setText('"Squadrons scrambled. Now it\'s down to the pilots."');
                this.dialogueText.setFill('#c8e6c9'); // WAAF green
                continueBtn.setVisible(false);

                // Transition to InterceptScene after a pause
                this.time.delayedCall(2500, () => {
                    this.scene.start('InterceptScene');
                });
            }
        });

    }


}