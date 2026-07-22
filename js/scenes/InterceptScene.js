class InterceptScene extends Phaser.Scene {
    constructor() {
        super('InterceptScene');
    }

    preload() {
        this.load.image('map', 'assets/images/mapbackground.png');
        this.load.image('ludwik', 'assets/images/ludwik.png');
        console.log('🔵 InterceptScene: preloading assets');
    }

    create() {
        const { width, height } = this.scale;

        this.createMapBackground(width, height);
        this.createGrid(width, height);
        this.createDialogueBox(width, height);
        this.createLudwikPortrait(width, height);

        // ---------- TOP BAR ----------
        this.add.text(20, 20, '◈ INTERCEPT PHASE', {
            fontSize: '18px',
            fill: '#ffd700',
            fontFamily: 'Courier New'
        });

        // ---------- DIALOGUE TEXT ----------
        this.dialogueText = this.add.text(110, height - 100, '"Park sent us up. But we don\'t fight alone, never alone. Find the others first."', {
            fontSize: '17px',
            fill: '#c8e6c9',
            fontFamily: 'Courier New',
            fontStyle: 'italic',
            wordWrap: { width: width - 140 }
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
        const plane = this.add.triangle(airfieldX, airfieldY - 5, 0, -16, -12, 10, 12, 10, 0x4488cc);
        plane.setDepth(5);
        plane.setInteractive({ useHandCursor: true });

        // Small wing markers
        const wingLeft = this.add.rectangle(airfieldX - 16, airfieldY - 5, 8, 3, 0x66aadd);
        const wingRight = this.add.rectangle(airfieldX + 16, airfieldY - 5, 8, 3, 0x66aadd);

        // "L" label on the plane
        this.add.text(airfieldX, airfieldY - 8, 'L', {
            fontSize: '10px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Store references
        this.ludwikPlane = plane;
        this.ludwikWings = [wingLeft, wingRight];
        this.airfieldX = airfieldX;
        this.airfieldY = airfieldY;
                // ---------- BOUNCY IDLE ANIMATION ----------
        const planeGroup = [plane, wingLeft, wingRight];
        this.tweens.add({
            targets: planeGroup,
            y: airfieldY - 15,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Slight rotation for extra liveliness
        this.tweens.add({
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
            const marker = this.add.triangle(sq.startX, sq.startY, 0, -14, -10, 8, 10, 8, sq.color);
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
                        this.dialogueText.setText('"Now we\'re ready. Poles, British, all of us. One formation, one mission."');
                        this.time.delayedCall(1000, () => {
                            this.formationComplete();
                        });
                    }
                }); // Closes the click handler

            }); // Closes the delayedCall

        }); // Closes the forEach loop (THIS WAS MISSING!)
    }
    // ---------- HELPER METHODS ----------
    
    createMapBackground(width, height) {
        if (this.textures.exists('map')) {
            this.add.image(width / 2, height / 2, 'map').setDisplaySize(width, height);
            console.log('✅ Using mapbackground.png');
        } else {
            console.log('❌ map not found – using drawn fallback');
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

    createLudwikPortrait(width, height) {
        const portraitX = width - 110;
        const portraitY = height - 200;

        // Circular background
        const circleBg = this.add.graphics();
        circleBg.fillStyle(0x2d1b0e, 0.9);
        circleBg.fillCircle(portraitX, portraitY, 40);
        circleBg.lineStyle(3, 0xf5e56b, 0.7);
        circleBg.strokeCircle(portraitX, portraitY, 40);

        if (this.textures.exists('ludwik')) {
            this.add.image(portraitX, portraitY, 'ludwik').setScale(0.15).setDepth(10);
        } else {
            this.add.text(portraitX, portraitY - 5, 'L', {
                fontSize: '22px',
                fill: '#f5e56b',
                fontFamily: 'Courier New',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(10);
        }
        
        
        this.add.text(portraitX, portraitY + 50, 'Ludwik', {
            fontSize: '12px',
            fill: '#f5e56b',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);
    }   


      
      
       // ---------- FORMATION COMPLETE ----------
    formationComplete() {
       console.log('✅ Formation complete!');

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
            // Sparkle burst
    for (let i = 0; i < 25; i++) {
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
        this.startInterceptPhase();
    });
    }
startInterceptPhase() {
     this.phase = 'intercept';
        this.dialogueText.setText('"Don\'t chase them, cut them off. Get between them and the city. That\'s our job."');

        const { width, height } = this.scale;

        // ---- CITY MARKER ----
        this.cityX = 720;
        this.cityY = 320;

        // City circle
        this.add.circle(this.cityX, this.cityY, 25, 0x44aa44, 0.4);
        this.add.circle(this.cityX, this.cityY, 30, 0x44aa44, 0.15);
        
        // City label
        this.add.text(this.cityX, this.cityY + 45, '🏙️ CITY', {
            fontSize: '14px',
            fill: '#88ff88',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        // Small building shapes inside the city
        for (let i = -12; i <= 12; i += 8) {
            this.add.rectangle(this.cityX + i, this.cityY + 5, 4, 10, 0x66dd66, 0.5);
        }

        // ---- ENEMY FORMATION ----
        this.enemyFormation = [];
        const enemyStartX = 850;
        const enemyStartY = 200;
        
        for (let i = 0; i < 5; i++) {
            const enemy = this.add.triangle(
                enemyStartX + i * 25,
                enemyStartY + i * 12,
                0, -14,
                -10, 8,
                10, 8,
                0x888888
            );
            enemy.setDepth(4);
            enemy.originalX = enemy.x;
            enemy.originalY = enemy.y;
            this.enemyFormation.push(enemy);
        }

        // Move enemy toward city
        this.tweens.add({
            targets: this.enemyFormation,
            x: this.cityX - 50,
            y: this.cityY - 30,
            duration: 10000,
            ease: 'Linear',
            onComplete: () => {
                // If enemy reaches city before intercept, show fail state
                if (!this.interceptDone) {
                    this.dialogueText.setText('"Too slow! The enemy reached the city."');
                }
            }
        });

        // ---- DOTTED INTERCEPT LINE ----
        const line = this.add.graphics();
        line.lineStyle(2, 0xffaa44, 0.4);
        line.setDepth(3);
        
        // Draw dashed line from formation area to intercept point
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

        // ---- INTERCEPT POINT INDICATOR ----
        this.add.circle(550, 280, 8, 0xffaa44, 0.3);
        this.add.text(550, 300, '▲ INTERCEPT', {
            fontSize: '10px',
            fill: '#ffaa44',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        // ---- PROGRESS BAR ----
        const barX = width / 2 - 150;
        const barY = height - 45;

        // Background
        this.progressBg = this.add.graphics();
        this.progressBg.fillStyle(0x333333, 0.8);
        this.progressBg.fillRoundedRect(barX, barY, 300, 22, 11);
        this.progressBg.lineStyle(1, 0x888888, 0.5);
        this.progressBg.strokeRoundedRect(barX, barY, 300, 22, 11);

        // Fill (starts at 0%)
        this.progressFill = this.add.graphics();
        this.progressFill.fillStyle(0x44ff44);
        this.progressFill.fillRoundedRect(barX + 3, barY + 3, 4, 16, 8);

        // Label
        this.progressLabel = this.add.text(width / 2, barY + 14, 'INTERCEPT: 0%', {
            fontSize: '11px',
            fill: '#ffffff',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        // ---- STORE FORMATION GROUP FOR DRAGGING ----
        this.formationGroup = [this.ludwikPlane, ...this.squadronMarkers];
        this.interceptDone = false;
}
    // ---------- ZOOM-IN TRANSITION ----------
    switchToAirfieldView() {
        console.log('🔄 Switching to real airfield view...');
        // Commit 5 will add the real airfield view
    }

}

