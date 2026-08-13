class DecisionScene extends BaseGameScene {
    constructor() {
        super('DecisionScene');
    }
    preload() {
        this.load.image('map', 'assets/images/mapbackground.png');
        this.load.image('keith-park', 'assets/images/keithpark.png');
        this.load.image('waaf-mascot-bust', 'assets/images/waaf-mascot-bust.png');

        AudioManager.preload(this, [
            AudioManager.manifest.sfx.buttonClick,
            AudioManager.manifest.sfx.formationChime,
            AudioManager.manifest.sfx.radioStatic,
            AudioManager.manifest.voice.keithPark,
            AudioManager.manifest.voice.waaf.decisionInstruction,
            AudioManager.manifest.voice.waaf.decisionEvaluating
        ]);

        this.showLoadingProgress();
    }
    create() {
        const { width, height } = this.scale;

        this.createTopBar('DECISION ROOM');
        this.createMapBackground(width, height);
        this.createGrid(width, height);
        this.createDialogueBox(width, height);
        const badgeX = width - 110;
        // height-210 + labelGap:15, same as every other scene's badge — the
        // old height-200 + default labelGap:10 put the name label right on
        // top of the dialogue box's border, cutting through the text.
        const badgeY = height - 210;
        this.parkBadge = this.createPortraitBadge(badgeX, badgeY, {
            radius: 60,
            textureKey: 'keith-park',
            fallbackText: 'KP',
            nameLabel: 'Keith Park',
            sizing: { fitToCircle: true },
            labelGap: 15,
            replayable: true
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
            labelGap: 15,
            startHidden: true,
            replayable: true
        });

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

        const continueBtn = this.add.text(width / 2, height - 160, '▶  CONTINUE  ◀', {
            fontSize: '24px',
            fill: '#ffffff',
            backgroundColor: '#1e3a5f',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        // Gold accent border — same navy fill as before, just a visible ring
        // so it reads clearly as tappable against the dark UI (matches the
        // gold-ring language already used on every portrait badge).
        const continueBtnBorder = this.add.graphics();
        continueBtnBorder.lineStyle(3, 0xf5e56b, 0.9);
        continueBtnBorder.strokeRoundedRect(
            continueBtn.x - continueBtn.width / 2,
            continueBtn.y - continueBtn.height / 2,
            continueBtn.width,
            continueBtn.height,
            8
        );

        const raids = [
            { id: 'W1', x: 680, y: 190, correctSector: 0 },
            { id: 'W2', x: 780, y: 300, correctSector: 1 }
        ];

        const sectors = [
            { id: 'Sector A', x: 400, y: 500 },
            { id: 'Sector B', x: 650, y: 450 }
        ];

        this.sectorObjects = [];
        sectors.forEach((s, index) => {
            const station = this.add.graphics();
            station.fillStyle(0x3366ff, 0.9);
            station.fillTriangle(s.x - 20, s.y, s.x, s.y - 25, s.x + 20, s.y);
            station.fillTriangle(s.x - 20, s.y, s.x, s.y + 25, s.x + 20, s.y);
            station.lineStyle(2, 0x88ccff);
            station.strokeTriangle(s.x - 20, s.y, s.x, s.y - 25, s.x + 20, s.y);
            station.strokeTriangle(s.x - 20, s.y, s.x, s.y + 25, s.x + 20, s.y);
            this.add.text(s.x, s.y + 35, s.id, {
                fontSize: '12px',
                fill: '#88ccff',
                fontFamily: 'Courier New'
            }).setOrigin(0.5);
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

        // Start hidden – we'll show them after dialogue completes
        this.raidMarkers = [];
        raids.forEach((r, i) => {
            const marker = this.add.text(r.x, r.y, r.id, {
                fontSize: '28px',
                fill: '#ff3333',
                fontFamily: 'Courier New',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(5);

            // Make it draggable — explicit 52px-diameter hit circle rather
            // than the default text-bounding-box hit area (the "W1"/"W2"
            // label alone is well under the 44px min touch target), same fix
            // already applied to DetectionScene's radar blips/ROC posts.
            //
            // The circle's own coordinates are relative to the object's
            // top-left bounding box, NOT its visual center — Phaser adds
            // displayOriginX/Y to the pointer's local position before testing
            // it against the hit area (see pointWithinHitArea in phaser.min.js),
            // which shifts a Circle(0, 0, r) up-and-left of a setOrigin(0.5)
            // object by half its width/height instead of centering it. For
            // this ~34x34px label that left barely 2px of margin on the
            // near side, so plenty of taps square on the visible "W1"/"W2"
            // text (or slightly below/right of it, which is how a finger
            // naturally lands since it covers the label from above) missed
            // the drag start entirely. Centering the circle on the actual
            // bounding box fixes that.
            marker.setInteractive({
                draggable: true,
                useHandCursor: true,
                hitArea: new Phaser.Geom.Circle(marker.width / 2, marker.height / 2, 26),
                hitAreaCallback: Phaser.Geom.Circle.Contains
            });

            marker.raidId = r.id;
            marker.correctSector = r.correctSector;
            marker.isPlaced = false;
            marker.originalX = r.x;
            marker.originalY = r.y;
            marker.setVisible(false);

            // "Waiting for your drag" breathing pulse — stopped once placed.
            marker.pulseTween = this.addIdlePulse(marker, { scaleAmount: 1.12 });

            // Drag events. On touch, a finger sitting right on top of the
            // marker hides both the marker and the sector it's headed for —
            // felt "clunky" in tablet playtesting. Lifting the marker above
            // the fingertip while dragging (and scaling it up a touch) fixes
            // that; the real drag position is tracked separately in
            // marker.dragX/dragY since marker.x/y now hold the lifted
            // on-screen position instead.
            marker.on('dragstart', () => {
                if (marker.pulseTween) {
                    marker.pulseTween.stop();
                    marker.pulseTween = null;
                }
                this.tweens.add({ targets: marker, scale: 1.25, duration: 120, ease: 'Back.easeOut' });
            });

            marker.on('drag', (pointer, dragX, dragY) => {
                marker.dragX = dragX;
                marker.dragY = dragY;
                marker.x = dragX;
                marker.y = dragY - 45;
            });

            marker.on('dragend', (pointer) => {
                // Check if dropped onto a sector station (using the real
                // drag position, not the lifted on-screen one)
                let droppedOn = null;
                for (let s of this.sectorObjects) {
                    const dist = Phaser.Math.Distance.Between(marker.dragX, marker.dragY, s.x, s.y);
                    if (dist < 50 && !s.occupied) {
                        droppedOn = s;
                        break;
                    }
                }

                if (droppedOn) {
                    AudioManager.playSFX(this, AudioManager.manifest.sfx.buttonClick);
                    this.spawnTapRipple(droppedOn.x, droppedOn.y);
                    marker.x = droppedOn.x;
                    marker.y = droppedOn.y;
                    droppedOn.occupied = true;
                    droppedOn.occupiedBy = marker;
                    marker.isPlaced = true;
                    marker.setScale(1);

                    const allPlaced = this.raidMarkers.every(m => m.isPlaced);

                    if (allPlaced) {
                        this.raidMarkers.forEach(m => m.disableInteractive());
                        this.clearActionHint();
                        this.dialogueText.setText('"Both raids assigned. Evaluating now..."');
                        const evaluatingVoice = AudioManager.manifest.voice.waaf.decisionEvaluating;
                        this.playWaafLine(evaluatingVoice);
                        // Evaluate once the line's had time to finish (1s minimum).
                        this.time.delayedCall(AudioManager.voiceAwareDelay(this, evaluatingVoice, 1000), () => {
                            this.evaluateDecision();
                        });
                    }
                } else {
                    if (!marker.isPlaced) {
                        marker.x = marker.originalX;
                        marker.y = marker.originalY;
                        marker.setScale(1);
                        marker.pulseTween = this.addIdlePulse(marker, { scaleAmount: 1.12 });
                    }
                }
            });

            this.raidMarkers.push(marker);
        });

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
                this.dialogueText.setFill('#c8e6c9');
                continueBtn.setVisible(false);
                continueBtnBorder.setVisible(false);

                this.raidMarkers.forEach(marker => {
                    marker.setVisible(true);
                });

                this.dialogueText.setText('"Drag each red raid marker to the correct sector station."');
                this.setActionHint('👉 DRAG each marker to a sector station');
                this.playWaafLine(AudioManager.manifest.voice.waaf.decisionInstruction, () => { this.lineLocked = false; });
            }
        });
    }

    // createMapBackground, createGrid, createDialogueBox, and
    // createPortraitBadge now live in BaseGameScene (this class extends it).

    // Red X + "CITY HIT" label over a raid marker's position — used for any
    // raid that got through undefended.
    showCityHit(x, y) {
        const hit = this.add.graphics();
        hit.fillStyle(0xff4444, 0.8);
        hit.fillCircle(x, y, 15);
        hit.lineStyle(3, 0xff0000);
        hit.moveTo(x - 12, y - 12);
        hit.lineTo(x + 12, y + 12);
        hit.moveTo(x + 12, y - 12);
        hit.lineTo(x - 12, y + 12);
        hit.strokePath();
        const label = this.add.text(x, y - 30, '💥 CITY HIT', {
            fontSize: '16px',
            fill: '#ff4444',
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScale(0);
        this.tweens.add({ targets: label, scale: 1, duration: 300, ease: 'Back.easeOut' });
    }

    // Green flash + "SCRAMBLED!" text over a sector station — used for any
    // raid correctly intercepted. Visual only — the formationChime SFX stays
    // called once per outcome in evaluateDecision() below, not in here,
    // since the full-success branch calls this twice (once per sector) and
    // the chime should only play once.
    showScrambled(x, y) {
        const flash = this.add.graphics();
        flash.fillStyle(0x44ff44, 0.6);
        flash.fillCircle(x, y, 40);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 600,
            onComplete: () => flash.destroy()
        });
        const label = this.add.text(x, y - 50, '🚀 SCRAMBLED!', {
            fontSize: '18px',
            fill: '#44ff44',
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScale(0);
        this.tweens.add({ targets: label, scale: 1, duration: 300, ease: 'Back.easeOut' });
    }

    evaluateDecision() {
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
            resultMessage = '✅ Both raids intercepted! Squadrons scrambled!';
            resultColor = '#44ff44';
            outcome = 'success';
            // Same chime as InterceptScene's formation-complete/all-turned-back
            // beats — once here, not once per sector below, since both flashes
            // land together and the chime would just double up on itself.
            AudioManager.playSFX(this, AudioManager.manifest.sfx.formationChime);
            this.sectorObjects.forEach(s => this.showScrambled(s.x, s.y));
        } else if (correctCount === 1) {
            resultMessage = '⚠️ One raid got through. Partial success.';
            resultColor = '#ffaa44';
            outcome = 'partial';
            this.raidMarkers.forEach(marker => {
                const sector = this.sectorObjects.find(s => s.occupiedBy === marker);
                if (!sector || marker.correctSector !== sector.index) {
                    this.showCityHit(marker.x || marker.originalX, marker.y || marker.originalY);
                }
            });
            AudioManager.playSFX(this, AudioManager.manifest.sfx.formationChime);
            this.sectorObjects.forEach(s => {
                const marker = s.occupiedBy;
                if (marker && marker.correctSector === s.index) {
                    this.showScrambled(s.x, s.y);
                }
            });
        } else {
            resultMessage = '❌ Both raids got through. City hit.';
            resultColor = '#ff4444';
            outcome = 'fail';
            this.raidMarkers.forEach(marker => {
                this.showCityHit(marker.x || marker.originalX, marker.y || marker.originalY);
            });
        }

        this.dialogueText.setText(resultMessage);
        this.dialogueText.setFill(resultColor);
        this.game.registry.set('interceptOutcome', outcome);

        this.time.delayedCall(3000, () => {
            this.scene.start('InterceptScene');
        });
    }
}
