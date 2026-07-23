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

        this.add.text(20, 20, '◈ DECISION ROOM', {
            fontSize: '18px',
            fill: '#ffd700',
            fontFamily: 'Courier New'
        });
        const { width, height } = this.scale;
          this.createMapBackground(width, height);
        this.createGrid(width, height);
          this.createDialogueBox(width, height);
        this.createKeithParkPortrait(width, height);
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
         const raids = [
            { id: 'W1', x: 680, y: 190, correctSector: 0 },
            { id: 'W2', x: 780, y: 300, correctSector: 1 }
        ];

        // 2. Define sector stations (where to drop)
        const sectors = [
            { id: 'Sector A', x: 400, y: 500 },
            { id: 'Sector B', x: 650, y: 450 }
        ];

        // 3. Draw sector stations
        this.sectorObjects = [];
        sectors.forEach((s, index) => {
            // Draw a blue diamond
            const station = this.add.graphics();
            station.fillStyle(0x3366ff, 0.9);
            station.fillTriangle(s.x - 20, s.y, s.x, s.y - 25, s.x + 20, s.y);
            station.fillTriangle(s.x - 20, s.y, s.x, s.y + 25, s.x + 20, s.y);
            station.lineStyle(2, 0x88ccff);
            station.strokeTriangle(s.x - 20, s.y, s.x, s.y - 25, s.x + 20, s.y);
            station.strokeTriangle(s.x - 20, s.y, s.x, s.y + 25, s.x + 20, s.y);
            // Label
            this.add.text(s.x, s.y + 35, s.id, {
                fontSize: '12px',
                fill: '#88ccff',
                fontFamily: 'Courier New'
            }).setOrigin(0.5);
            // Store reference
            this.sectorObjects.push({
                x: s.x,
                y: s.y,
                id: s.id,
                index: index,
                graphics: station,
                occupied: false,
                occupiedBy: null
            });
        });

        // 4. Create raid markers (draggable)
        // Start hidden – we'll show them after dialogue completes
        this.raidMarkers = [];
        raids.forEach((r, i) => {
            const marker = this.add.text(r.x, r.y, r.id, {
                fontSize: '28px',
                fill: '#ff3333',
                fontFamily: 'Courier New',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(5);

            // Make it draggable
            marker.setInteractive({ draggable: true, useHandCursor: true });

            // Store data
            marker.raidId = r.id;
            marker.correctSector = r.correctSector;
            marker.isPlaced = false;
            marker.originalX = r.x;
            marker.originalY = r.y;
            marker.setVisible(false); // Hidden initially

            // Drag events
            marker.on('drag', (pointer, dragX, dragY) => {
                marker.x = dragX;
                marker.y = dragY;
            });

            marker.on('dragend', (pointer) => {
                // Check if dropped onto a sector station
                let droppedOn = null;
                for (let s of this.sectorObjects) {
                    const dist = Phaser.Math.Distance.Between(marker.x, marker.y, s.x, s.y);
                    if (dist < 40 && !s.occupied) {
                        droppedOn = s;
                        break;
                    }
                }

                if (droppedOn) {
                    AudioManager.playSFX(this, AudioManager.manifest.sfx.buttonClick);
                    // Snap to sector
                    marker.x = droppedOn.x;
                    marker.y = droppedOn.y;
                    droppedOn.occupied = true;
                    droppedOn.occupiedBy = marker;
                    marker.isPlaced = true;
                    console.log(` ${marker.raidId} placed on ${droppedOn.id}`);
                    // Check if correct
                    const allPlaced = this.raidMarkers.every(m => m.isPlaced);
                 
                    // (We'll add outcome logic in Commit 7)
                if (allPlaced) {
                        // Disable further dragging
                        this.raidMarkers.forEach(m => m.disableInteractive());
                        this.dialogueText.setText('"Both raids assigned. Evaluating now..."');
                        // Evaluate after a short delay
                        this.time.delayedCall(1000, () => {
                            this.evaluateDecision();
                        });
                    }
                } else {
                    // Return to original position if not dropped on sector
                    if (!marker.isPlaced) {
                        marker.x = marker.originalX;
                        marker.y = marker.originalY;
                    }
                }
            });

            this.raidMarkers.push(marker);
        });


        // 4. Button click handler
        continueBtn.on('pointerdown', () => {
            AudioManager.playSFX(this, AudioManager.manifest.sfx.buttonClick);
            this.currentLineIndex++;

            if (this.currentLineIndex < this.parkLines.length) {
                this.dialogueText.setText(this.parkLines[this.currentLineIndex]);
                      } else {
                // All Park lines finished – WAAF handoff
                this.dialogueText.setText('"Two raids inbound. Drag each marker to the correct sector station."');
                this.dialogueText.setFill('#c8e6c9'); // WAAF green
                continueBtn.setVisible(false);

                // Show the raid markers
                this.raidMarkers.forEach(marker => {
                    marker.setVisible(true);
                });

                // Remind the player they can drag
                this.dialogueText.setText('"Drag each red raid marker to the correct sector station."');
            }
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
            this.add.image(portraitX, portraitY, 'keith-park').setScale(0.15).setDepth(10);
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
    }
  
  // 1. Define raid data
       

  

    evaluateDecision() {
        // Count correct placements
        let correctCount = 0;
        this.raidMarkers.forEach(marker => {
            const sector = this.sectorObjects.find(s => s.occupiedBy === marker);
            if (sector && marker.correctSector === sector.index) {
                correctCount++;
            }
        });

        let resultMessage = '';
        let resultColor = '#c8e6c9';
        let outcome = '';

        if (correctCount === 2) {
            // Full success – both raids intercepted
            resultMessage = '✅ Both raids intercepted! Squadrons scrambled!';
            resultColor = '#44ff44';
            outcome = 'success';
            // Show scramble animation (green flash over sector stations)
            this.sectorObjects.forEach(s => {
                const flash = this.add.graphics();
                flash.fillStyle(0x44ff44, 0.6);
                flash.fillCircle(s.x, s.y, 40);
                this.tweens.add({
                    targets: flash,
                    alpha: 0,
                    duration: 600,
                    onComplete: () => flash.destroy()
                });
                this.add.text(s.x, s.y - 50, '🚀 SCRAMBLED!', {
                    fontSize: '18px',
                    fill: '#44ff44',
                    fontFamily: 'Courier New',
                    fontStyle: 'bold'
                }).setOrigin(0.5);
            });
        } else if (correctCount === 1) {
            // Partial success – one raid intercepted, one got through
            resultMessage = '⚠️ One raid got through. Partial success.';
            resultColor = '#ffaa44';
            outcome = 'partial';
            // Show city hit marker for the wrong one
            this.raidMarkers.forEach(marker => {
                const sector = this.sectorObjects.find(s => s.occupiedBy === marker);
                if (!sector || marker.correctSector !== sector.index) {
                    const x = marker.x || marker.originalX;
                    const y = marker.y || marker.originalY;
                    const hit = this.add.graphics();
                    hit.fillStyle(0xff4444, 0.8);
                    hit.fillCircle(x, y, 15);
                    hit.lineStyle(3, 0xff0000);
                    hit.moveTo(x - 12, y - 12);
                    hit.lineTo(x + 12, y + 12);
                    hit.moveTo(x + 12, y - 12);
                    hit.lineTo(x - 12, y + 12);
                    hit.strokePath();
                    this.add.text(x, y - 30, '💥 CITY HIT', {
                        fontSize: '16px',
                        fill: '#ff4444',
                        fontFamily: 'Courier New',
                        fontStyle: 'bold'
                    }).setOrigin(0.5);
                }
            });
            // Also show scramble for the correct one
            this.sectorObjects.forEach(s => {
                const marker = s.occupiedBy;
                if (marker && marker.correctSector === s.index) {
                    const flash = this.add.graphics();
                    flash.fillStyle(0x44ff44, 0.6);
                    flash.fillCircle(s.x, s.y, 40);
                    this.tweens.add({
                        targets: flash,
                        alpha: 0,
                        duration: 600,
                        onComplete: () => flash.destroy()
                    });
                    this.add.text(s.x, s.y - 50, '🚀 SCRAMBLED!', {
                        fontSize: '18px',
                        fill: '#44ff44',
                        fontFamily: 'Courier New',
                        fontStyle: 'bold'
                    }).setOrigin(0.5);
                }
            });
        } else {
            // Fail – both raids got through
            resultMessage = '❌ Both raids got through. City hit.';
            resultColor = '#ff4444';
            outcome = 'fail';
            // Show city hit markers for both
            this.raidMarkers.forEach(marker => {
                const x = marker.x || marker.originalX;
                const y = marker.y || marker.originalY;
                const hit = this.add.graphics();
                hit.fillStyle(0xff4444, 0.8);
                hit.fillCircle(x, y, 15);
                hit.lineStyle(3, 0xff0000);
                hit.moveTo(x - 12, y - 12);
                hit.lineTo(x + 12, y + 12);
                hit.moveTo(x + 12, y - 12);
                hit.lineTo(x - 12, y + 12);
                hit.strokePath();
                this.add.text(x, y - 30, '💥 CITY HIT', {
                    fontSize: '16px',
                    fill: '#ff4444',
                    fontFamily: 'Courier New',
                    fontStyle: 'bold'
                }).setOrigin(0.5);
            });
        }

        // Update dialogue with final WAAF line
        this.dialogueText.setText(resultMessage);
        this.dialogueText.setFill(resultColor);

        // Store outcome for ResultScene (optional)
        this.game.registry.set('interceptOutcome', outcome);

        // Transition to InterceptScene after a delay
        this.time.delayedCall(3000, () => {
            this.scene.start('InterceptScene');
        });
    }


}