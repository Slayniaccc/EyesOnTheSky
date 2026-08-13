class DetectionScene extends BaseGameScene {
    constructor() {
        super('DetectionScene');
    }

    preload() {
        this.load.image('map', 'assets/images/mapbackground.png');
        this.load.image('waaf-mascot-bust', 'assets/images/waaf-mascot-bust.png');

        AudioManager.preload(this, [
            AudioManager.manifest.music.bunkerAmbience,
            AudioManager.manifest.sfx.radarPing,
            AudioManager.manifest.sfx.buttonClick,
            AudioManager.manifest.sfx.radioStatic,
            AudioManager.manifest.voice.waaf.detectionWelcome,
            AudioManager.manifest.voice.waaf.radarComplete,
            AudioManager.manifest.voice.waaf.raidOverLand,
            AudioManager.manifest.voice.waaf.rocComplete
        ]);

        this.showLoadingProgress();
    }

    create() {
        const { width, height } = this.scale;

        // Starts here rather than IntroScene — the bright, kid-friendly title/
        // character/Dowding-explainer pages don't call for a bunker drone; this
        // is the first scene that's actually the plotting room. Phaser's
        // SoundManager is game-wide, so once started it keeps playing through
        // every later scene until something calls AudioManager.stopMusic().
        AudioManager.playMusic(this, AudioManager.manifest.music.bunkerAmbience);

        this.createMapBackground(width, height);
        this.createGrid(width, height);

        // ---------- RADAR BLIPS ----------
        const blipPositions = [
            [200, 200], [550, 150], [700, 400], [300, 500], [150, 350]
        ];
        this.totalRadarBlips = blipPositions.length;
        this.radarBlipsTapped = 0;
        blipPositions.forEach(([x, y]) => {
            const blip = this.add.circle(x, y, 8, 0x00ff00, 0.8);
            this.tweens.add({
                targets: blip,
                scale: 2.5,
                alpha: 0.1,
                duration: 800,
                yoyo: true,
                repeat: -1
            });

            // Visual blip stays small (radius 8) but the tappable area is a generous
            // fixed 48px-diameter circle, meeting the 44px min touch-target guideline
            // regardless of the pulsing scale tween's current size.
            // Circle coordinates are relative to the object's top-left bounding
            // box, not its visual center — see the DecisionScene marker comment
            // for why (0, 0) would actually decenter this. Small here since the
            // blip is only 16px across against a 48px hit circle, but centering
            // it properly costs nothing.
            blip.setInteractive({
                useHandCursor: true,
                hitArea: new Phaser.Geom.Circle(blip.width / 2, blip.height / 2, 24),
                hitAreaCallback: Phaser.Geom.Circle.Contains
            });
            blip.on('pointerdown', () => {
                if (this.detectionStage !== 'radar_blip' || blip.getData('resolved')) return;

                AudioManager.playSFX(this, AudioManager.manifest.sfx.radarPing);
                this.spawnTapRipple(blip.x, blip.y, { color: 0x00ff00 });

                blip.setData('resolved', true);
                blip.disableInteractive();
                this.tweens.killTweensOf(blip);
                blip.setVisible(false);

                this.radarBlipsTapped += 1;
                const remaining = this.totalRadarBlips - this.radarBlipsTapped;
                if (remaining > 0) {
                    this.dialogueText.setText(`"Good catch. Keep tracking the scope — ${remaining} contact${remaining === 1 ? '' : 's'} left."`);
                    return;
                }

                this.dialogueText.setText('"Radar picked up several contacts out at sea. We\'ll plot them now."');
                // Small delay so the radar ping from this same tap finishes
                // before the radio static + voice line start — otherwise they overlap.
                this.time.delayedCall(400, () => {
                    this.playWaafLine(AudioManager.manifest.voice.waaf.radarComplete);
                });
                this.detectionStage = 'raid_moving';
                // Marker's "moving inland" animation runs at least as long as this
                // line takes to say (plus the 400ms head start above), so the next
                // line (raidOverLand) never fires while this one's still talking.
                const inlandDuration = AudioManager.voiceAwareDelay(this, AudioManager.manifest.voice.waaf.radarComplete, 2000);
                this.spawnRaidMarker(inlandDuration);
            });
        });

        this.createTopBar('DETECTION PHASE');
        this.createDialogueBox(width, height);
        this.createPortraitBadge(width - 110, height - 210, {
            radius: 60,
            textureKey: 'waaf-mascot-bust',
            fallbackText: 'WAAF',
            fallbackFontSize: '18px',
            nameLabel: 'WAAF',
            sizing: { fitToCircle: true },
            labelGap: 15,
            replayable: true
        });

        this.dialogueText = this.add.text(110, height - 100, 'Welcome to Fighter Command. Tap each radar blip when it flashes.', {
            fontSize: '17px',
            fill: '#c8e6c9',
            fontFamily: 'Courier New',
            fontStyle: 'italic',
            wordWrap: { width: width - 120 }
        });
        this.playWaafLine(AudioManager.manifest.voice.waaf.detectionWelcome);

        // ---------- STATE MACHINE ----------
        this.detectionStage = 'radar_blip';
        this.rocPostsTapped = 0;
        this.totalRocPosts = 3;
    }

    spawnRaidMarker(inlandDuration = 2000) {
        // Starting position (from the last radar blip location)
        const startX = 720;
        const startY = 180;
        const endX = 540;
        const endY = 300;

        const marker = this.add.text(startX, startY, 'W', {
            fontSize: '36px',
            fill: '#ff3333',
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(5);

        this.tweens.add({
            targets: marker,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 300,
            yoyo: true,
            repeat: -1
        });

        this.tweens.add({
            targets: marker,
            x: endX,
            y: endY,
            duration: inlandDuration,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.tweens.killTweensOf(marker);
                marker.setScale(1);

                this.dialogueText.setText('"Now it\'s over land, Observer Corps\' job. Tap each post as it lights up."');
                this.playWaafLine(AudioManager.manifest.voice.waaf.raidOverLand);

                this.detectionStage = 'roc_sequence';
                this.spawnROCPosts(endX, endY);
            }
        });
    }

    spawnROCPosts(startX, startY) {
        const rocPositions = [
            { x: startX - 60, y: startY + 40, label: 'ROC 1' },
            { x: startX - 140, y: startY + 80, label: 'ROC 2' },
            { x: startX - 220, y: startY + 120, label: 'ROC 3' }
        ];

        this.rocPostObjects = [];
        rocPositions.forEach((pos, index) => {
            // Draw a tower shape — sized up from the original 24x44 texture
            // (~1.8x) so the icon itself reads clearly, not just its hit area.
            const g = this.make.graphics({ add: false });
            g.fillStyle(0x666666);
            g.fillRect(-14, -29, 29, 58);
            g.fillStyle(0x555555);
            g.fillCircle(0, -32, 18);
            g.generateTexture('roc_post_' + index, 44, 80);
            g.destroy();

            // Interactive hit area is bigger still (100px diameter) — comfortably
            // past the 44px minimum touch target for small fingers.
            const sprite = this.add.image(pos.x, pos.y, 'roc_post_' + index)
                .setDepth(6)
                .setInteractive({
                    useHandCursor: true,
                    // Same top-left-anchored hit area coordinates as the radar
                    // blips above and the DecisionScene raid markers — centering
                    // on the actual 44x80 sprite matters more here since the
                    // uncentered offset (22, 40) was nearly as large as the
                    // 50px hit radius itself.
                    hitArea: new Phaser.Geom.Circle(22, 40, 50),
                    hitAreaCallback: Phaser.Geom.Circle.Contains
                });

            sprite.tapped = false;
            sprite.lit = false;
            sprite.label = this.add.text(pos.x, pos.y + 55, pos.label, {
                fontSize: '15px',
                fill: '#999',
                fontFamily: 'Courier New',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5).setDepth(6);

            this.rocPostObjects.push(sprite);

            sprite.on('pointerdown', () => {
                if (!sprite.lit) return;
                if (sprite.tapped) return;

                AudioManager.playSFX(this, AudioManager.manifest.sfx.buttonClick);
                this.spawnTapRipple(sprite.x, sprite.y);

                sprite.tapped = true;
                this.rocPostsTapped++;

                // Stop the idle pulse before the scale-pop below — both
                // animate the same property and would otherwise fight.
                if (sprite.pulseTween) {
                    sprite.pulseTween.stop();
                    sprite.setScale(1);
                    sprite.pulseTween = null;
                }

                // Visual feedback: flash white then green
                this.tweens.add({
                    targets: sprite,
                    alpha: 0.4,
                    duration: 100,
                    yoyo: true,
                    onComplete: () => {
                        sprite.setTint(0x88ff88);
                    }
                });
                // Extra scale-pop alongside the alpha flash above, same
                // "hit" feel added to ToteBoardScene's panel taps.
                this.tweens.add({ targets: sprite, scale: sprite.scale * 1.15, duration: 100, yoyo: true });

                if (this.rocPostsTapped === this.totalRocPosts) {
                    this.clearActionHint();
                    this.dialogueText.setText('"Radar sees them coming across the Channel, but once they\'re over land, that\'s where we lose them. That\'s why we need the Observer Corps."');
                    const rocCompleteVoice = AudioManager.manifest.voice.waaf.rocComplete;
                    this.playWaafLine(rocCompleteVoice);
                    this.detectionStage = 'complete';

                    // Advance once the line's had time to finish (3s minimum).
                    this.time.delayedCall(AudioManager.voiceAwareDelay(this, rocCompleteVoice, 3000), () => {
                        this.scene.start('ToteBoardScene');
                    });
                }
            });
        });

        // ----- LIGHT THEM UP SEQUENTIALLY -----
        let currentIndex = 0;
        const lightNextPost = () => {
            if (currentIndex >= this.rocPostObjects.length) return;

            const post = this.rocPostObjects[currentIndex];
            post.lit = true;
            post.setTint(0x44ff44);
            post.label.setFill('#88ff88');

            this.tweens.add({
                targets: post,
                alpha: 0.5,
                duration: 200,
                yoyo: true,
                repeat: 2
            });

            // "Waiting for your tap" breathing pulse — stopped once tapped.
            post.pulseTween = this.addIdlePulse(post, { scaleAmount: 1.1 });

            // "TAP ME!" prompt so kids know it just became interactive
            const tapHint = this.add.text(post.x, post.y - 60, '👆 TAP!', {
                fontSize: '14px',
                fill: '#ffd700',
                fontFamily: 'Courier New',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(7);
            this.tweens.add({
                targets: tapHint,
                y: tapHint.y - 20,
                alpha: 0,
                duration: 1600,
                delay: 400,
                onComplete: () => tapHint.destroy()
            });

            currentIndex++;

            if (currentIndex < this.rocPostObjects.length) {
                this.time.delayedCall(1500, lightNextPost);
            }
        };

        this.setActionHint('👉 TAP each post as it lights up');
        this.time.delayedCall(800, lightNextPost);
    }

    // createMapBackground, createGrid, createDialogueBox, createPortraitBadge,
    // and playWaafLine now live in BaseGameScene (this class extends it).
}
