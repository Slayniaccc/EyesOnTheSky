class DecisionScene extends BaseGameScene {
    constructor() {
        super('DecisionScene');
    }
    preload() {
        this.load.image('map', 'assets/images/mapbackground.png');
        this.load.image('keith-park', 'assets/images/keithpark.png');
        this.load.image('waaf-mascot-bust', 'assets/images/waaf-mascot-bust.png');
        console.log('🔵 DecisionScene: preloading assets');
    }
    create() {

        this.createTopBar('DECISION ROOM');
        const { width, height } = this.scale;
          this.createMapBackground(width, height);
        this.createGrid(width, height);
          this.createDialogueBox(width, height);
        const badgeX = width - 110;
        const badgeY = height - 200;
        this.parkBadge = this.createPortraitBadge(badgeX, badgeY, {
            radius: 60,
            textureKey: 'keith-park',
            fallbackText: 'KP',
            nameLabel: 'Keith Park',
            sizing: { fitToCircle: true }
        });
        // Same spot as Keith Park's badge — hidden until his handoff line, so
        // the swap reads as one badge changing rather than a new one appearing.
        this.waafBadge = this.createPortraitBadge(badgeX, badgeY, {
            radius: 60,
            textureKey: 'waaf-mascot-bust',
            fallbackText: 'WAAF',
            fallbackFontSize: '18px',
            nameLabel: 'WAAF',
            sizing: { fitToCircle: true },
            startHidden: true
        });
         //dialogue logic
          this.parkLines = [
            '"Air Vice-Marshal Keith Park here. Fighter Command split Britain into four groups, 10, 11, 12, 13. Mine is 11 Group: London and the south-east."',
            '"Closest to the coast, first in the fight. Squadrons controlled from this bunker accounted for most of the enemy aircraft shot down in the whole battle."',
            '"Two raids inbound. We can\'t cover both fully. Where do we commit?"',
            '"That\'s the job. Never enough squadrons, never enough certainty."'
        ];
        // Parallel to parkLines — same index plays the matching voice line.
        this.parkVoices = [
            AudioManager.manifest.voice.keithPark.introGroups,
            AudioManager.manifest.voice.keithPark.introElevenGroup,
            AudioManager.manifest.voice.keithPark.raidsInbound,
            AudioManager.manifest.voice.keithPark.neverEnough
        ];
        this.currentLineIndex = 0;

        // 2. Create the dialogue text (on top of the dialogue box background)
        // Wrap width is measured against the actual dialogue box's right edge
        // (with a 20px margin) rather than a flat width-140 — that flat value
        // let long lines like Keith Park's first one run a few px past the
        // box border.
        const dialogueTextX = 110;
        this.dialogueText = this.add.text(dialogueTextX, height - 100, this.parkLines[0], {
            fontSize: '17px',
            fill: '#f5e56b',
            fontFamily: 'Courier New',
            fontStyle: 'italic',
            wordWrap: { width: (this.dialogueBoxX + this.dialogueBoxWidth) - dialogueTextX - 20 }
        });
        // Locked while a line's voice is still playing so mashing Continue
        // can't cut a character's line off partway through — unlocked by
        // playVoice's onComplete, which fires immediately if that line has
        // no audio file yet, so playback without voice acting isn't slowed.
        this.lineLocked = true;
        AudioManager.playVoice(this, this.parkVoices[0], {}, () => { this.lineLocked = false; });

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
                        const evaluatingVoice = AudioManager.manifest.voice.waaf.decisionEvaluating;
                        this.playWaafLine(evaluatingVoice);
                        // Evaluate once the line's had time to finish (1s minimum).
                        this.time.delayedCall(AudioManager.voiceAwareDelay(this, evaluatingVoice, 1000), () => {
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
            if (this.lineLocked) return;
            AudioManager.playSFX(this, AudioManager.manifest.sfx.buttonClick);
            this.currentLineIndex++;
            this.lineLocked = true;

            if (this.currentLineIndex < this.parkLines.length) {
                this.dialogueText.setText(this.parkLines[this.currentLineIndex]);
                AudioManager.playVoice(this, this.parkVoices[this.currentLineIndex], {}, () => { this.lineLocked = false; });
                      } else {
                // All Park lines finished – WAAF handoff, portrait badge swaps
                // to match who's actually speaking for the rest of the scene.
                this.parkBadge.forEach((el) => el.setVisible(false));
                this.waafBadge.forEach((el) => el.setVisible(true));
                this.dialogueText.setText('"Two raids inbound. Drag each marker to the correct sector station."');
                this.dialogueText.setFill('#c8e6c9'); // WAAF green
                continueBtn.setVisible(false);

                // Show the raid markers
                this.raidMarkers.forEach(marker => {
                    marker.setVisible(true);
                });

                // Remind the player they can drag
                this.dialogueText.setText('"Drag each red raid marker to the correct sector station."');
                this.playWaafLine(AudioManager.manifest.voice.waaf.decisionInstruction, () => { this.lineLocked = false; });
            }
        });
    }
        
    // createMapBackground, createGrid, createDialogueBox, and
    // createPortraitBadge now live in BaseGameScene (this class extends it).

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
            // Same chime as InterceptScene's formation-complete/all-turned-back
            // beats — once here, not once per sector below, since both flashes
            // land together and the chime would just double up on itself.
            AudioManager.playSFX(this, AudioManager.manifest.sfx.formationChime);
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
            AudioManager.playSFX(this, AudioManager.manifest.sfx.formationChime);
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