class InterceptScene extends BaseGameScene {
    constructor() {
        super('InterceptScene');
    }

    preload() {
        this.load.image('map', 'assets/images/mapbackground.png');
        this.load.image('ludwik', 'assets/images/ludwik.png');
        this.load.image('raf-plane', 'assets/images/raf-plane.png');
        this.load.image('german-plane', 'assets/images/german_plane.png');
        // Not on disk yet — drop a real photo/illustration here and it's used automatically,
        // falling back to the drawn scene in drawAirfieldBackgroundFallback() until then.
        this.load.image('airfield-bg', 'assets/images/airfield-bg.png');
        console.log('🔵 InterceptScene: preloading assets');
    }

    create() {
        const { width, height } = this.scale;

        // No-op if already playing (started back in DetectionScene) — this is
        // just a safety net for jumping straight into InterceptScene via the
        // debug menu, which would otherwise skip it entirely.
        AudioManager.playMusic(this, AudioManager.manifest.music.bunkerAmbience);

        this.createMapBackground(width, height);
        this.createGrid(width, height);
        this.createDialogueBox(width, height);
        // Plotting-table-only presence, matching every other scene's corner
        // badge — the plane-scene speech bubble (buildAirfieldView) is a
        // separate treatment for later phases, not a replacement for this one.
        // Naturally cleared by switchToAirfieldView()'s existing sweep of
        // Graphics/Image children, same as the grid and coastlines.
        this.createPortraitBadge(width - 110, height - 200, {
            radius: 60,
            textureKey: 'ludwik',
            fallbackText: 'L',
            nameLabel: 'Ludwik',
            sizing: { fitToCircle: true }
        });

        // ---------- TOP BAR ----------
        this.createTopBar('INTERCEPT PHASE');

        // ---------- DIALOGUE TEXT ----------
        this.dialogueText = this.add.text(110, height - 100, '', {
            fontSize: '17px',
            fill: '#c8e6c9',
            fontFamily: 'Courier New',
            fontStyle: 'italic',
            wordWrap: { width: width - 140 }
        });
        // formationComplete() (triggered whenever the player finishes tapping
        // all 3 squadrons — user-paced, so it can land before this line is
        // done) needs to know when this line actually finishes rather than
        // just firing formationReady and having it silently skipped by the
        // single-voice-at-a-time rule.
        this.introVoiceDone = false;
        this._introFinishedCallback = null;
        AudioManager.playVoice(this, AudioManager.manifest.voice.ludwik.intro, {}, () => {
            this.introVoiceDone = true;
            if (this._introFinishedCallback) {
                const callback = this._introFinishedCallback;
                this._introFinishedCallback = null;
                callback();
            }
        });

        console.log('✅ InterceptScene: initialised');
                    // ---------- AIRFIELD MARKER ----------
        const airfieldX = 200;
        const airfieldY = 400;

        // Blue square marker (like a wooden block on the table)
        const marker = this.add.graphics();
        marker.fillStyle(0x2266cc, 0.8);
        marker.fillRoundedRect(airfieldX - 25, airfieldY - 25, 50, 50, 6);
        marker.lineStyle(2, 0x88ccff, 0.8);
        marker.strokeRoundedRect(airfieldX - 25, airfieldY - 25, 50, 50, 6);

        // "RAF" label inside the marker
        this.add.text(airfieldX, airfieldY - 4, 'RAF', {
            fontSize: '14px',
            fill: '#88ccff',
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Runway symbol (small white lines inside)
        for (let i = -15; i <= 15; i += 10) {
            this.add.rectangle(airfieldX + i, airfieldY + 12, 4, 4, 0x88ccff, 0.5);
        }

        // Label under the marker
        this.add.text(airfieldX, airfieldY + 40, 'AIRFIELD', {
            fontSize: '10px',
            fill: '#88ccff',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);
                // ---------- LUDWIK'S PLANE MARKER ----------
        this.usingPlaneSprite = this.textures.exists('raf-plane');
        // Was 0.05 (~40px) — bumped up for better visibility on the plotting
        // table. This also scales the German planes (see enemyOffsets below),
        // which intentionally share this constant so both sides stay the same
        // size on the map.
        this.rafPlaneMapScale = 0.07;
        this.rafPlaneAirfieldScale = 0.14;

        let plane, wingLeft, wingRight;
        if (this.usingPlaneSprite) {
            plane = this.add.image(airfieldX, airfieldY - 5, 'raf-plane').setScale(this.rafPlaneMapScale);
        } else {
            plane = this.add.triangle(airfieldX, airfieldY - 5, 0, -16, -12, 10, 12, 10, 0x4488cc);
            // Small wing markers (fallback only — the sprite already has wings painted on)
            wingLeft = this.add.rectangle(airfieldX - 16, airfieldY - 5, 8, 3, 0x66aadd);
            wingRight = this.add.rectangle(airfieldX + 16, airfieldY - 5, 8, 3, 0x66aadd);
        }
        // Higher than the squadron markers' depth(5) below, so Ludwik's plane
        // always renders in front of/on top of his wingmen wherever they
        // overlap — he's the flight lead, not just another marker in the pack.
        plane.setDepth(6);
        plane.setInteractive({ useHandCursor: true });

        // "L" label on the plane
        this.add.text(airfieldX, airfieldY - 8, 'L', {
            fontSize: '10px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(7);

        // Store references
        this.ludwikPlane = plane;
        this.ludwikWings = wingLeft ? [wingLeft, wingRight] : [];
        this.airfieldX = airfieldX;
        this.airfieldY = airfieldY;

        // The speech bubble itself isn't created until buildAirfieldView() —
        // scoped to the zoomed-in "plane scene" (intercept/escort), not the
        // small-map plotting-table part. setLudwikLine() below is still safe
        // to call this early: it no-ops on the bubble half until it exists.
        this.setLudwikLine('"Park sent us up. But we don\'t fight alone, never alone. Find the others first."');

                // ---------- BOUNCY IDLE ANIMATION ----------
        // Plotting-table-only flourish — stopped in formationComplete() below.
        // Left running, these repeat:-1 tweens keep fighting over the plane's
        // y/angle forever, silently undoing every later reposition (the V
        // formation lock, the airfield-view row, formation dragging) and
        // making Ludwik's plane drift away from the group on its own.
        const planeGroup = [plane, ...this.ludwikWings];
        this.ludwikIdleBounceTween = this.tweens.add({
            targets: planeGroup,
            y: airfieldY - 15,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Slight rotation for extra liveliness
        this.ludwikIdleRotateTween = this.tweens.add({
            targets: planeGroup,
            angle: 3,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
                // ---------- PHASE STATE ----------
        this.phase = 'form_up';
        this.collectedCount = 0;
        this.totalSquadrons = 3;
        this.isAirfieldView = false;
                // ---------- COUNTER ----------
    
        this.counterText = this.add.text(20, 50, '✈️ 0/' + this.totalSquadrons + ' joined', {
            fontSize: '16px',
            fill: '#ffd700',
            fontFamily: 'Courier New'
        });
                // ---------- SQUADRON MARKERS ----------
        const squadrons = [
            { label: '303 Squadron', startX: 60, startY: 120, color: 0x66ccff, delay: 1000 },
            { label: 'No. 1 Squadron RAF', startX: 700, startY: 100, color: 0x66ddff, delay: 2500 },
            { label: 'No. 19 Squadron RAF', startX: 600, startY: 450, color: 0x66eeff, delay: 4000 }
        ];

        this.squadronMarkers = [];

             squadrons.forEach((sq, index) => {
            const marker = this.usingPlaneSprite
                ? this.add.image(sq.startX, sq.startY, 'raf-plane').setScale(this.rafPlaneMapScale)
                : this.add.triangle(sq.startX, sq.startY, 0, -14, -10, 8, 10, 8, sq.color);
            marker.setDepth(5);
            marker.setVisible(false);
            marker.setInteractive({ useHandCursor: true });
            marker.label = sq.label;
            marker.collected = false;
            marker.arrived = false;
            marker.index = index;
            this.squadronMarkers.push(marker);

            // ---------- ARRIVAL ANIMATION ----------
            this.time.delayedCall(sq.delay, () => {
                marker.setVisible(true);
                marker.arrived = true;

                // "TAP ME!" label
                const tapLabel = this.add.text(marker.x, marker.y - 30, '👆 TAP ME!', {
                    fontSize: '14px',
                    fill: '#ffd700',
                    fontFamily: 'Courier New',
                    fontStyle: 'bold'
                }).setOrigin(0.5);
                this.tweens.add({
                    targets: tapLabel,
                    alpha: 0,
                    duration: 2000,
                    onComplete: () => tapLabel.destroy()
                });

                // ---------- CLICK HANDLER ----------
                marker.on('pointerdown', () => {
                    if (marker.collected || !marker.arrived) return;
                    AudioManager.playSFX(this, AudioManager.manifest.sfx.buttonClick);
                    marker.collected = true;
                    this.collectedCount++;

                    // Calculate formation position
                    const offsetX = -80 + (this.collectedCount - 1) * 80;
                    const offsetY = -30 + (this.collectedCount - 1) * 30;

                    // Swoosh trail
                    const swoosh = this.add.graphics();
                    swoosh.lineStyle(3, 0xffd700, 0.6);
                    swoosh.beginPath();
                    swoosh.moveTo(marker.x, marker.y);
                    swoosh.lineTo(this.airfieldX + offsetX, this.airfieldY + offsetY);
                    swoosh.strokePath();
                    this.tweens.add({
                        targets: swoosh,
                        alpha: 0,
                        duration: 600,
                        onComplete: () => swoosh.destroy()
                    });

                    // "JOINED!" flash label
                    const joinedLabel = this.add.text(marker.x, marker.y - 40, sq.label + ' JOINED! ✅', {
                        fontSize: '14px',
                        fill: '#44ff44',
                        fontFamily: 'Courier New',
                        fontStyle: 'bold'
                    }).setOrigin(0.5);
                    this.tweens.add({
                        targets: joinedLabel,
                        y: marker.y - 80,
                        alpha: 0,
                        duration: 1200,
                        onComplete: () => joinedLabel.destroy()
                    });

                    // Move to formation (V shape)
                    this.tweens.add({
                        targets: marker,
                        x: this.airfieldX + offsetX,
                        y: this.airfieldY + offsetY,
                        duration: 600,
                        ease: 'Back.easeOut'
                    });

                    // Update counter with bounce
                    this.counterText.setText('✈️ ' + this.collectedCount + '/' + this.totalSquadrons + ' joined');
                    this.tweens.add({
                        targets: this.counterText,
                        scaleX: 1.3,
                        scaleY: 1.3,
                        duration: 100,
                        yoyo: true
                    });

                    // Check if all collected
                    if (this.collectedCount === this.totalSquadrons) {
                        this.setLudwikLine('"Now we\'re ready. Poles, British, all of us. One formation, one mission."');
                        const formationVoice = AudioManager.manifest.voice.ludwik.formationReady;
                        const playFormationLine = () => {
                            AudioManager.playVoice(this, formationVoice);
                            this.time.delayedCall(AudioManager.voiceAwareDelay(this, formationVoice, 1000), () => {
                                this.formationComplete();
                            });
                        };
                        // A fast player can tap all 3 squadrons before the
                        // scene-opening intro line finishes — wait for it
                        // instead of losing this line to the busy voice channel.
                        if (this.introVoiceDone) {
                            playFormationLine();
                        } else {
                            this._introFinishedCallback = playFormationLine;
                        }
                    }
                }); // Closes the click handler

            }); // Closes the delayedCall

        }); // Closes the forEach loop (THIS WAS MISSING!)
    }
    // ---------- HELPER METHODS ----------
    // createMapBackground, createGrid, createDialogueBox, and the Ludwik
    // portrait badge now live in BaseGameScene (this class extends it).

    // ---------- LUDWIK SPEECH BUBBLE ----------
    // A comic-style callout (small portrait + line of dialogue) that follows
    // his plane around the plotting table/airfield, instead of a fixed
    // corner badge — repositioned every frame in update() since the plane
    // itself moves constantly (idle bounce, formation drag, fly-back).
    createLudwikSpeechBubble() {
        const container = this.add.container(0, 0).setDepth(60);

        const bg = this.add.graphics();
        const portraitBg = this.add.graphics();
        container.add([bg, portraitBg]);

        let portraitImg = null;
        if (this.textures.exists('ludwik')) {
            portraitImg = this.add.image(0, 0, 'ludwik');
            // Crop to a centered square in source-texture space (not screen
            // space), so it stays correct no matter where the bubble moves —
            // unlike a mask, setCrop's coordinates aren't affected by the
            // container's transform. A "cover" crop like this reads far
            // sharper at thumbnail size than letterboxing the full
            // portrait-orientation source (1414x2000) inside a small square.
            const side = Math.min(portraitImg.width, portraitImg.height);
            portraitImg.setCrop((portraitImg.width - side) / 2, (portraitImg.height - side) / 2, side, side);
            this.ludwikPortraitCropSide = side;
            container.add(portraitImg);
        }

        const text = this.add.text(0, 0, '', {
            fontSize: '12px',
            fill: '#2d1b0e',
            fontFamily: 'Courier New',
            wordWrap: { width: 160 }
        });
        container.add(text);

        this.ludwikBubble = container;
        this.ludwikBubbleBg = bg;
        this.ludwikBubblePortraitBg = portraitBg;
        this.ludwikBubblePortraitImg = portraitImg;
        this.ludwikBubbleText = text;
    }

    // Redraws the bubble background/portrait around whatever the text
    // currently needs — called whenever the line changes since the box has
    // to grow/shrink with it (the bg is Graphics, so it can't just resize
    // like a nine-slice image; easiest to clear and redraw at the new size).
    _redrawLudwikBubble() {
        if (!this.ludwikBubble) return;

        const padding = 10;
        const portraitSize = 40;
        const gap = 8;
        const textWrapWidth = 160;
        const tailH = 14;

        const text = this.ludwikBubbleText;
        text.setWordWrapWidth(textWrapWidth);

        const contentHeight = Math.max(portraitSize, text.height);
        const boxWidth = padding * 2 + portraitSize + gap + textWrapWidth;
        const boxHeight = padding * 2 + contentHeight;

        const boxBottom = -tailH;
        const boxTop = boxBottom - boxHeight;
        const boxLeft = -boxWidth / 2;

        this.ludwikBubbleBg.clear();
        this.ludwikBubbleBg.fillStyle(0xfff8e7, 0.97);
        this.ludwikBubbleBg.fillRoundedRect(boxLeft, boxTop, boxWidth, boxHeight, 12);
        this.ludwikBubbleBg.fillTriangle(-9, boxBottom, 9, boxBottom, 0, 0);
        this.ludwikBubbleBg.lineStyle(2, 0xcc3333, 0.9);
        this.ludwikBubbleBg.strokeRoundedRect(boxLeft, boxTop, boxWidth, boxHeight, 12);

        const portraitX = boxLeft + padding;
        const portraitY = boxTop + (boxHeight - portraitSize) / 2;
        this.ludwikBubblePortraitBg.clear();
        this.ludwikBubblePortraitBg.fillStyle(0x2d1b0e, 0.9);
        this.ludwikBubblePortraitBg.fillRoundedRect(portraitX, portraitY, portraitSize, portraitSize, 6);

        if (this.ludwikBubblePortraitImg) {
            const img = this.ludwikBubblePortraitImg;
            img.setScale(portraitSize / this.ludwikPortraitCropSide);
            img.setPosition(portraitX + portraitSize / 2, portraitY + portraitSize / 2);
        }

        text.setPosition(portraitX + portraitSize + gap, boxTop + padding);
    }

    // Every place in this scene that used to do this.dialogueText.setText(...)
    // now routes through here so the bubble always mirrors the bottom
    // dialogue box instead of drifting out of sync with it.
    setLudwikLine(text, color) {
        this.dialogueText.setText(text);
        if (color) this.dialogueText.setColor(color);
        if (this.ludwikBubbleText) {
            this.ludwikBubbleText.setText(text);
            this._redrawLudwikBubble();
        }
    }

    // Fades the bubble out once its job (narrating the intercept chase) is
    // done. References are cleared immediately, not after the fade — so a
    // setLudwikLine() call landing mid-fade (e.g. interceptSuccessful()'s own
    // "Hold the line" line) just quietly skips the bubble instead of updating
    // text on an object that's on its way out.
    hideLudwikBubble() {
        if (!this.ludwikBubble) return;
        const bubble = this.ludwikBubble;
        this.ludwikBubble = null;
        this.ludwikBubbleBg = null;
        this.ludwikBubblePortraitBg = null;
        this.ludwikBubblePortraitImg = null;
        this.ludwikBubbleText = null;
        this.tweens.add({
            targets: bubble,
            alpha: 0,
            duration: 250,
            onComplete: () => bubble.destroy()
        });
    }

    update() {
        if (!this.ludwikBubble || !this.ludwikPlane) return;
        const { width } = this.scale;
        // The airfield-view plane sprite is scaled up (rafPlaneAirfieldScale)
        // and sits lower on screen than on the plotting table, so it needs a
        // bigger gap to clear the plane itself.
        const offset = this.isAirfieldView ? 85 : 45;
        const anchorX = Phaser.Math.Clamp(this.ludwikPlane.x, 140, width - 140);
        // Clamped so the bubble (drawn upward from its anchor) never gets
        // clipped off the top of the canvas, e.g. during showResult()'s
        // fly-back animation when the plane ends up near y=50.
        const anchorY = Math.max(this.ludwikPlane.y - offset, 130);
        this.ludwikBubble.setPosition(anchorX, anchorY);
    }


      
      
       // ---------- FORMATION COMPLETE ----------
    formationComplete() {
       console.log('✅ Formation complete!');

    // Stop the idle bounce/rotation — otherwise they keep overriding
    // ludwikPlane's y/angle forever, undoing the V-formation lock below and
    // every reposition after it (airfield view, formation dragging).
    if (this.ludwikIdleBounceTween) this.ludwikIdleBounceTween.stop();
    if (this.ludwikIdleRotateTween) this.ludwikIdleRotateTween.stop();
    this.ludwikPlane.setAngle(0);

    // Lock planes into V formation
    const formationGroup = [this.ludwikPlane, ...this.squadronMarkers];
    const vicPositions = [
        { x: 0, y: 0 },      // Lead (Ludwik)
        { x: -80, y: 40 },   // Left wing
        { x: 80, y: 40 },    // Right wing
        { x: -140, y: 80 },  // Far left
        { x: 140, y: 80 }    // Far right
    ];

    formationGroup.forEach((plane, i) => {
        this.tweens.add({
            targets: plane,
            x: this.airfieldX + vicPositions[i].x,
            y: this.airfieldY + vicPositions[i].y,
            duration: 500,
            delay: i * 100,
            ease: 'Back.easeOut'
        });
        });
            // Sparkle burst — trimmed from 25 (cheap GPU headroom on weaker
    // tablets; still reads as a full burst).
    AudioManager.playSFX(this, AudioManager.manifest.sfx.formationChime);
    for (let i = 0; i < 18; i++) {
        const spark = this.add.circle(
            this.airfieldX + Phaser.Math.Between(-60, 60),
            this.airfieldY + Phaser.Math.Between(-60, 60),
            3,
            0xffd700,
            0.9
        );
        this.tweens.add({
            targets: spark,
            x: spark.x + Phaser.Math.Between(-80, 80),
            y: spark.y + Phaser.Math.Between(-80, 80),
            alpha: 0,
            scale: 3,
            duration: 700,
            onComplete: () => spark.destroy()
        });
    }
 
        // "FORMATION COMPLETE!" overlay
    const overlay = this.add.text(
        this.airfieldX,
        this.airfieldY - 100,
        '✨ FORMATION COMPLETE! ✨',
        {
            fontSize: '26px',
            fill: '#ffd700',
            fontFamily: 'Courier New',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }
    ).setOrigin(0.5);

    this.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: 1800,
        delay: 1200,
        onComplete: () => overlay.destroy()
    });

    // Trigger Phase 2
    this.time.delayedCall(2800, () => {
        this.switchToAirfieldView();
    });
    }
startInterceptPhase() {

    console.log('🔄 Starting Phase 2 - Intercept...');
    this.phase = 'intercept';
    // Hand off from RAF to enemy engine rather than layering both — they're
    // deliberately the same class of sound, so playing together just reads
    // as noise, not "two sides in the air at once."
    AudioManager.stopMusic(AudioManager.manifest.sfx.spitfireEngine);
    AudioManager.playMusic(this, AudioManager.manifest.sfx.messerschmittEngine);
     this.interceptDone = false;
    this.setLudwikLine('"Don\'t chase them, cut them off. Get between them and the city. That\'s our job."');
    AudioManager.playVoice(this, AudioManager.manifest.voice.ludwik.interceptStart);

    const { width, height } = this.scale;

    // ---- CITY MARKER ----
    this.cityX = 720;
    this.cityY = 320;

            this.cityGraphics = this.add.circle(this.cityX, this.cityY, 25, 0x44aa44, 0.4);
    this.add.circle(this.cityX, this.cityY, 30, 0x44aa44, 0.15);
    this.add.text(this.cityX, this.cityY + 45, '🏙️ CITY', {
        fontSize: '14px',
        fill: '#88ff88',
        fontFamily: 'Courier New'
    }).setOrigin(0.5);

    for (let i = -12; i <= 12; i += 8) {
        this.add.rectangle(this.cityX + i, this.cityY + 5, 4, 10, 0x66dd66, 0.5);
    }

    // ---- ENEMY FORMATION ----
    this.enemyFormation = [];
    this.usingEnemySprite = this.textures.exists('german-plane');
    const enemyStartX = 850;
    const enemyStartY = 200;
    // Loose gaggle formation, spread wide enough that 40px sprites don't
    // overlap (the old 25/12px-per-plane spacing was tighter than the planes
    // themselves).
    const enemyOffsets = [
        { x: 0, y: 0 },
        { x: 70, y: 30 },
        { x: -70, y: 30 },
        { x: 130, y: 60 },
        { x: -130, y: 60 }
    ];

    enemyOffsets.forEach((offset) => {
        const x = enemyStartX + offset.x;
        const y = enemyStartY + offset.y;
        let enemy;
        if (this.usingEnemySprite) {
            // Same map-view scale as the RAF planes so both sides read as the
            // same "size" of marker on the plotting table.
            enemy = this.add.image(x, y, 'german-plane').setScale(this.rafPlaneMapScale);
        } else {
            enemy = this.add.triangle(x, y, 0, -14, -10, 8, 10, 8, 0x888888);
        }
        enemy.setDepth(4);
        this.enemyFormation.push(enemy);
    });

    console.log('👾 Enemy formation created:', this.enemyFormation.length, 'planes');

    // Move enemy toward city as a group. A Phaser tween on an array target
    // sends every target to the SAME absolute x/y — it doesn't preserve each
    // plane's offset — so tweening this.enemyFormation directly collapsed all
    // 5 planes onto one point over the 10s approach, turning the readable
    // sprites into an overlapping tangle. Instead, tween a single "leader"
    // point and re-apply each plane's original offset from it every frame.
    const enemyLeader = { x: enemyStartX, y: enemyStartY };
    this.enemyApproachTween = this.tweens.add({
        targets: enemyLeader,
        x: this.cityX - 50,
        y: this.cityY - 30,
        duration: 10000,
        ease: 'Linear',
        onUpdate: () => {
            this.enemyFormation.forEach((enemy, i) => {
                enemy.x = enemyLeader.x + enemyOffsets[i].x;
                enemy.y = enemyLeader.y + enemyOffsets[i].y;
            });
        },
        onComplete: () => {
            if (!this.interceptDone) {
                this.setLudwikLine('"Too slow! The enemy reached the city."');
                const tooSlowVoice = AudioManager.manifest.voice.ludwik.tooSlow;
                AudioManager.playVoice(this, tooSlowVoice);
                this.time.delayedCall(AudioManager.voiceAwareDelay(this, tooSlowVoice, 1500), () => this.showResult());
            }
        }
    });
    // ---- DOTTED INTERCEPT LINE ----
    const line = this.add.graphics();
    line.lineStyle(2, 0xffaa44, 0.4);
    line.setDepth(3);
    
    for (let i = 0; i < 20; i++) {
        const t = i / 20;
        const x = 300 + t * 350;
        const y = 300 - t * 50;
        if (i % 2 === 0) {
            line.moveTo(x, y);
            line.lineTo(x + 12, y - 6);
        }
    }
    line.strokePath();

    this.add.circle(550, 280, 8, 0xffaa44, 0.3);
    this.add.text(550, 300, '▲ INTERCEPT', {
        fontSize: '10px',
        fill: '#ffaa44',
        fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // ---- PROGRESS BAR ----
    const barX = width / 2 - 150;
    const barY = height - 45;

    this.progressBg = this.add.graphics();
    this.progressBg.fillStyle(0x333333, 0.8);
    this.progressBg.fillRoundedRect(barX, barY, 300, 22, 11);
    this.progressBg.lineStyle(1, 0x888888, 0.5);
    this.progressBg.strokeRoundedRect(barX, barY, 300, 22, 11);

    this.progressFill = this.add.graphics();
    this.progressFill.fillStyle(0x44ff44);
    this.progressFill.fillRoundedRect(barX + 3, barY + 3, 4, 16, 8);

    this.progressLabel = this.add.text(width / 2, barY + 14, 'INTERCEPT: 0%', {
        fontSize: '11px',
        fill: '#ffffff',
        fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // ---- STORE FORMATION GROUP ----
    this.formationGroup = [this.ludwikPlane, ...this.squadronMarkers];

    // ---- MAKE FORMATION DRAGGABLE ----
  // ---- STORE FORMATION GROUP ----
    this.formationGroup = [this.ludwikPlane, ...this.squadronMarkers];

    // Disable individual plane input so only the drag zone responds
    this.formationGroup.forEach(p => p.disableInteractive());

    // ---- MAKE FORMATION DRAGGABLE (single zone for whole formation) ----
    const avgX = this.formationGroup.reduce((sum, p) => sum + p.x, 0) / this.formationGroup.length;
    const avgY = this.formationGroup.reduce((sum, p) => sum + p.y, 0) / this.formationGroup.length;

    this.formationDragZone = this.add.zone(avgX, avgY, 260, 160)
        .setInteractive({ draggable: true, useHandCursor: true });

    this.formationDragZone.on('drag', (pointer, dragX, dragY) => {
        const dx = dragX - this.formationDragZone.x;
        const dy = dragY - this.formationDragZone.y;

        this.formationDragZone.x = dragX;
        this.formationDragZone.y = dragY;

        this.formationGroup.forEach(p => {
            p.x += dx;
            p.y += dy;
        });

        this.updateInterceptProgress();
    });
}
   


    // ---------- ZOOM-IN TRANSITION ----------
    switchToAirfieldView() {
        // ---- FADE OUT PLOTTING TABLE ----
        this.cameras.main.fadeOut(800, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            // ---- CLEAR PLOTTING TABLE ELEMENTS ----
            // Hide the grid, coastlines, and plotting-table markers
            this.children.list.forEach(child => {
                if (this.enemyFormation && this.enemyFormation.includes(child)) return;
                  if (child === this.cityGraphics) return;
                if (child.type === 'Graphics' || child.type === 'Image') {
                    child.setVisible(false);
                }
            });

            // ---- BUILD AIRFIELD VIEW ----
            this.buildAirfieldView();

            // ---- FADE IN ----
            this.cameras.main.fadeIn(800);
        });
    }

    buildAirfieldView() {
        const { width, height } = this.scale;

        // Starts here, not scene start — this is the zoomed-in airfield view
        // where the planes are actually the visual focus, not the earlier
        // plotting-table phase where they're small markers on a busy map.
        // The bunker drone doesn't belong once we're up in the air with it —
        // cut it here rather than letting it run under the engine loops.
        AudioManager.stopMusic(AudioManager.manifest.music.bunkerAmbience);
        AudioManager.playMusic(this, AudioManager.manifest.sfx.spitfireEngine);
        this.isAirfieldView = true;

        // ---- BACKGROUND ----
        if (this.textures.exists('airfield-bg')) {
            this.add.image(width / 2, height / 2, 'airfield-bg').setDisplaySize(width, height);
        } else {
            this.drawAirfieldBackgroundFallback(width, height);
        }

        // ---- LUDWIK SPEECH BUBBLE ----
        // Only exists from here on — the "plane scene" part of this scene —
        // not during the earlier plotting-table view.
        this.createLudwikSpeechBubble();
        this.setLudwikLine(this.dialogueText.text);

        // ---- AIRFIELD LABEL ----
        this.add.text(width / 2, height - 140, '🛩️ AIRFIELD', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

              this.ludwikPlane.setVisible(true);
        if (!this.usingPlaneSprite) this.ludwikPlane.setFillStyle(0x4488cc);
        this.ludwikPlane.setScale(this.usingPlaneSprite ? this.rafPlaneAirfieldScale : 1.5);
        // Front of the row (rightmost, away from the hangar/taxiway toward
        // the open runway) and a touch higher than the trailing squadrons —
        // he's the flight lead, so he sits ahead of the pack here too, not
        // just at a higher render depth.
        this.ludwikPlane.x = width / 2 - 100 + 3 * 50;
        this.ludwikPlane.y = height - 110;
        this.ludwikPlane.setInteractive({ draggable: true, useHandCursor: true }); // <-- ADD THIS

        this.squadronMarkers.forEach((marker, i) => {
            marker.setVisible(true);
            if (!this.usingPlaneSprite) marker.setFillStyle(0x66ccff);
            marker.setScale(this.usingPlaneSprite ? this.rafPlaneAirfieldScale : 1.5);
            marker.x = width / 2 - 100 + i * 50;
            marker.y = height - 100 + (i + 1) * 10;
            marker.setInteractive({ draggable: true, useHandCursor: true }); // <-- ADD THIS
        });
                // ---- UPDATE FORMATION GROUP ----
        this.formationGroup = [this.ludwikPlane, ...this.squadronMarkers];

              // ---- CONTINUE TO PHASE 2 ----
        this.time.delayedCall(1000, () => {
            this.setLudwikLine('"Now we\'re in the air. Let\'s find those enemy planes."');
            // startInterceptPhase() plays its own line immediately, which would
            // otherwise be skipped (still busy) while this one's talking — wait
            // for it to finish first (fires instantly if there's no audio yet).
            AudioManager.playVoice(this, AudioManager.manifest.voice.ludwik.airfieldReady, {}, () => {
                this.startInterceptPhase();
            });
        });
    }

    // Drawn airfield scene used until a real assets/images/airfield-bg.png is added.
    drawAirfieldBackgroundFallback(width, height) {
        const fieldTop = height - 150;

        // ---- SKY (gradient) ----
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x4a90d9, 0x4a90d9, 0xbfe3f5, 0xbfe3f5, 1);
        sky.fillRect(0, 0, width, fieldTop);

        // ---- SUN ----
        this.add.circle(60, 55, 35, 0xffdd44, 0.5);

        // ---- CLOUDS ----
        for (let i = 0; i < 4; i++) {
            const cloud = this.add.graphics();
            cloud.fillStyle(0xffffff, 0.75);
            cloud.fillCircle(100 + i * 200, 60 + i * 30, 40 + i * 10);
            cloud.fillCircle(130 + i * 200, 50 + i * 30, 30 + i * 10);
            cloud.fillCircle(80 + i * 200, 70 + i * 30, 30 + i * 10);
        }

        // ---- DISTANT TREE LINE ----
        const treeLine = this.add.graphics();
        treeLine.fillStyle(0x2d5a2d, 0.85);
        for (let x = -20, i = 0; x <= width + 20; x += 55, i++) {
            const h = 26 + (i % 3) * 8;
            treeLine.fillTriangle(x, fieldTop, x - 26, fieldTop + h, x + 26, fieldTop + h);
        }

        // ---- GRASS FIELD (mowed stripes) ----
        const grass = this.add.graphics();
        grass.fillStyle(0x4a8a3a);
        grass.fillRect(0, fieldTop, width, 150);
        grass.fillStyle(0x53964a, 0.4);
        for (let x = 0; x < width; x += 60) {
            grass.fillRect(x, fieldTop, 30, 150);
        }

        // ---- TAXIWAY (hangar to runway) ----
        const taxiway = this.add.graphics();
        taxiway.fillStyle(0x555555);
        taxiway.fillRoundedRect(70, fieldTop, 60, 100, 4);

        // ---- HANGAR ----
        const hangar = this.add.graphics();
        hangar.fillStyle(0x8a7a6a);
        hangar.fillRect(20, fieldTop - 80, 130, 90);
        hangar.fillStyle(0x6a5a4a);
        hangar.beginPath();
        hangar.arc(85, fieldTop - 80, 65, Math.PI, 0, false);
        hangar.fillPath();
        hangar.lineStyle(2, 0x3a2a1a, 0.5);
        hangar.strokeRect(20, fieldTop - 80, 130, 90);
        for (let x = 40; x < 140; x += 20) {
            hangar.beginPath();
            hangar.moveTo(x, fieldTop - 80);
            hangar.lineTo(x, fieldTop + 10);
            hangar.strokePath();
        }
        // RAF roundel on the hangar face
        this.add.circle(85, fieldTop - 40, 14, 0x1e3a8a);
        this.add.circle(85, fieldTop - 40, 9, 0xffffff);
        this.add.circle(85, fieldTop - 40, 4, 0xcc2222);

        // ---- CONTROL TOWER ----
        const tower = this.add.graphics();
        tower.fillStyle(0xd9cdb8);
        tower.fillRect(width - 110, fieldTop - 110, 45, 110);
        tower.fillStyle(0x8a2020);
        tower.fillTriangle(width - 118, fieldTop - 110, width - 87, fieldTop - 130, width - 57, fieldTop - 110);
        tower.fillStyle(0x88ccee, 0.85);
        tower.fillRect(width - 102, fieldTop - 85, 29, 16);

        // ---- WINDSOCK ----
        this.add.rectangle(width - 150, fieldTop - 30, 3, 60, 0x555555);
        this.add.triangle(width - 148, fieldTop - 35, -14, -6, -14, 6, 14, 0).setFillStyle(0xff6633, 0.85);

        // ---- RUNWAY ----
        const runway = this.add.graphics();
        runway.fillStyle(0x555555);
        runway.fillRoundedRect(width / 2 - 200, height - 100, 400, 40, 5);
        runway.lineStyle(2, 0x777777);
        runway.strokeRoundedRect(width / 2 - 200, height - 100, 400, 40, 5);

        // Runway centreline dashes
        for (let x = width / 2 - 180; x <= width / 2 + 180; x += 40) {
            this.add.rectangle(x, height - 80, 16, 4, 0xffffff, 0.9);
        }
    }

        updateInterceptProgress() {
        const { width, height } = this.scale;
        
        // Calculate average position of formation
        const avgX = this.formationGroup.reduce((sum, p) => sum + p.x, 0) / this.formationGroup.length;
        const avgY = this.formationGroup.reduce((sum, p) => sum + p.y, 0) / this.formationGroup.length;
        
        // Calculate progress based on distance to intercept point (550, 280)
        const distToIntercept = Phaser.Math.Distance.Between(avgX, avgY, 550, 280);
        const maxDist = 400;
        const progress = Phaser.Math.Clamp(1 - (distToIntercept / maxDist), 0, 1);
        const progressPercent = Math.round(progress * 100);
        
        // Update progress bar
        this.progressFill.clear();
        const fillWidth = 4 + progress * 292;
        this.progressFill.fillStyle(progress > 0.7 ? 0x44ff44 : progress > 0.4 ? 0xffaa44 : 0xff4444);
        this.progressFill.fillRoundedRect(width/2 - 147, height - 42, fillWidth, 16, 8);
        
        this.progressLabel.setText('INTERCEPT: ' + progressPercent + '%');
        
        // Check if intercept is successful
        if (progress > 0.85 && !this.interceptDone) {
            this.interceptSuccessful();
        }
        }
    interceptSuccessful() {
        if (this.interceptDone) return;
        this.interceptDone = true;

        // Formation's in place and the escort phase (enemies getting turned
        // back one by one) is about to take over as the visual focus — the
        // bubble's job (narrating the chase) is done.
        this.hideLudwikBubble();

        if (this.enemyApproachTween) {
            this.enemyApproachTween.stop();
        }

        if (this.formationDragZone) {
            this.formationDragZone.destroy();
            this.formationDragZone = null;
        }
        // ---- SHIELD OVER CITY ----
        const shield = this.add.graphics();
        shield.fillStyle(0x44ff44, 0.2);
        shield.fillCircle(this.cityX, this.cityY, 50);
        shield.lineStyle(4, 0x44ff44, 0.8);
        shield.strokeCircle(this.cityX, this.cityY, 35);
        
        // Shield icon
        this.add.text(this.cityX, this.cityY - 5, '🛡️', {
            fontSize: '50px'
        }).setOrigin(0.5);
        
        // ---- CHEERING PARTICLES ---- (trimmed from 30 for weaker-tablet headroom)
        for (let i = 0; i < 20; i++) {
            const particle = this.add.circle(
                this.cityX + Phaser.Math.Between(-60, 60),
                this.cityY + Phaser.Math.Between(-60, 60),
                4,
                0x44ff44,
                0.8
            );
            this.tweens.add({
                targets: particle,
                y: particle.y - Phaser.Math.Between(60, 150),
                x: particle.x + Phaser.Math.Between(-40, 40),
                alpha: 0,
                duration: 1000 + Phaser.Math.Between(0, 500),
                onComplete: () => particle.destroy()
            });
        }
        
        // ---- UPDATE DIALOGUE ----
        this.setLudwikLine('"Hold the line. They know we\'re here, make them think twice about coming through."');
        const holdLineVoice = AudioManager.manifest.voice.ludwik.holdLine;
        AudioManager.playVoice(this, holdLineVoice);

        // ---- PROCEED TO PHASE 3 ----
        this.phase = 'escort';
        this.time.delayedCall(AudioManager.voiceAwareDelay(this, holdLineVoice, 2500), () => {
            this.startEscortPhase();
        });
    }
           startEscortPhase() {
    console.log('🔄 Starting Phase 3 - Escort...');
    this.phase = 'escort';
    this.turnedBack = 0;
    this.totalEnemies = this.enemyFormation.length;

    // ---- TALLY COUNTER ----
    this.tallyText = this.add.text(20, 50, '🚫 TURNED BACK: 0/' + this.totalEnemies, {
        fontSize: '16px',
        fill: '#ffd700',
        fontFamily: 'Courier New'
    });

    this.setLudwikLine('"Hold the line. They know we\'re here, make them think twice about coming through."');

    let turnIndex = 0;
    const turnNext = () => {
        if (turnIndex >= this.enemyFormation.length) {
            // All enemies turned back!
            AudioManager.playSFX(this, AudioManager.manifest.sfx.formationChime);
            this.setLudwikLine('"All enemy planes turned back! Mission complete!"');
            const allTurnedBackVoice = AudioManager.manifest.voice.ludwik.allTurnedBack;
            AudioManager.playVoice(this, allTurnedBackVoice);

            // ---- CONFETTI CELEBRATION ----
            const { width, height } = this.scale;
            const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffdd44, 0xff44ff, 0x44ffdd];
            // Trimmed from 40 for weaker-tablet headroom — still a full burst.
            for (let i = 0; i < 25; i++) {
                const confetti = this.add.rectangle(
                    width / 2 + Phaser.Math.Between(-200, 200),
                    height / 2 + Phaser.Math.Between(-100, 100),
                    6, 10,
                    colors[Phaser.Math.Between(0, colors.length - 1)]
                );
                this.tweens.add({
                    targets: confetti,
                    y: confetti.y + Phaser.Math.Between(100, 300),
                    x: confetti.x + Phaser.Math.Between(-100, 100),
                    angle: Phaser.Math.Between(0, 720),
                    alpha: 0,
                    duration: 1500 + Phaser.Math.Between(0, 500),
                    onComplete: () => confetti.destroy()
                });
            }

            this.time.delayedCall(AudioManager.voiceAwareDelay(this, allTurnedBackVoice, 2000), () => {
                this.showResult();
            });
            return;
        }

        const enemy = this.enemyFormation[turnIndex];

        // ---- RETREAT ARROW ----
        const arrow = this.add.graphics();
        arrow.lineStyle(3, 0xff4444, 0.8);
        arrow.moveTo(enemy.x, enemy.y);
        arrow.lineTo(enemy.x - 80, enemy.y - 40);
        arrow.strokePath();
        this.tweens.add({
            targets: arrow,
            alpha: 0,
            duration: 1000,
            onComplete: () => arrow.destroy()
        });

        // ---- TURN ENEMY AROUND ----
        this.tweens.add({
            targets: enemy,
            x: enemy.x - 250,
            y: enemy.y + 100,
            angle: 180,
            duration: 1500,
            ease: 'Sine.easeOut',
            onStart: () => {
                AudioManager.playSFX(this, AudioManager.manifest.sfx.shotDown);
                if (this.usingEnemySprite) {
                    enemy.setTint(0x444466);
                } else {
                    enemy.setFillStyle(0x444466);
                }
            },
            onComplete: () => {
                this.turnedBack++;
                this.tallyText.setText('🚫 TURNED BACK: ' + this.turnedBack + '/' + this.totalEnemies);

                // Bounce the tally
                this.tweens.add({
                    targets: this.tallyText,
                    scaleX: 1.3,
                    scaleY: 1.3,
                    duration: 100,
                    yoyo: true
                });

                turnIndex++;
                this.time.delayedCall(600, turnNext);
            }
        });
    };

    this.time.delayedCall(1000, turnNext);
}
        showResult() {
        const successRate = this.turnedBack / this.totalEnemies;
        let resultMessage = '';
        let resultColor = '';
        let outcome = '';

        if (successRate === 1) {
            // ---- FULL SUCCESS ----
            outcome = 'success';
            resultMessage = '"Radar saw them. The Corps tracked them. Park sent us. We held the line. That\'s how Britain stayed free."';
            resultColor = '#44ff44';

            // City saved animation (pulsing shield)
            this.tweens.add({
                targets: this.add.circle(this.cityX, this.cityY, 40, 0x44ff44, 0.3),
                scale: 2,
                alpha: 0,
                duration: 800,
                repeat: 2
            });

            // Fly back animation for formation
            this.formationGroup.forEach((plane, i) => {
                this.tweens.add({
                    targets: plane,
                    x: 50 + i * 30,
                    y: 50 + i * 10,
                    duration: 1500,
                    delay: i * 150,
                    ease: 'Sine.easeInOut'
                });
            });

        } else if (successRate >= 0.5) {
            // ---- PARTIAL SUCCESS ----
            outcome = 'partial';
            resultMessage = '"We held most of them. The system worked, next time we\'ll be faster."';
            resultColor = '#ffaa44';

            // Small damage marker
            this.add.text(this.cityX, this.cityY - 5, '⚠️', { fontSize: '40px' }).setOrigin(0.5);

        } else {
            // ---- FAIL ----
            outcome = 'fail';
            resultMessage = '"We were too slow today. But the system still tracked them. Tomorrow we\'ll be ready."';
            resultColor = '#ff4444';

            // Shadow marker over city
            this.add.circle(this.cityX, this.cityY, 25, 0x444444, 0.6);
            this.add.text(this.cityX, this.cityY - 5, '?', { fontSize: '30px', fill: '#666' }).setOrigin(0.5);
        }

        // Update dialogue
       this.setLudwikLine(resultMessage, resultColor);

        // Store outcome for ResultScene
        this.game.registry.set('interceptOutcome', outcome);

        // Both engine loops started earlier in this scene (form_up / intercept
        // phases) — Phaser's SoundManager is game-wide, so they'd otherwise
        // keep droning on through ResultScene and beyond.
        AudioManager.stopMusic(AudioManager.manifest.sfx.spitfireEngine);
        AudioManager.stopMusic(AudioManager.manifest.sfx.messerschmittEngine);

        // Transition to ResultScene
        this.time.delayedCall(4000, () => {
            this.scene.start('ResultScene');
        });
        }
    


    }