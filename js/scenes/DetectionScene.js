class DetectionScene extends Phaser.Scene {
    constructor() {
        super('DetectionScene');
        this.raidMarkers = [];
        this.radarBlips = [];
    }
preload() {
    // Try to load the detailed map image
    this.load.image('map', 'assets/images/mapbackground.png');
    console.log('🔵 DetectionScene: preloading mapbackground.png');
}
    
create() {
    const { width, height } = this.scale;

  // ---------- MAP BACKGROUND (with fallback) ----------
if (this.textures.exists('map')) {
    //if the map image is found, use it as the background
    this.add.image(width / 2, height / 2, 'map').setDisplaySize(width, height);
    console.log('Using mapbackground.png');
} else {
    //  Image missing – fallback to drawn background + rough coastlines
    console.log(' map not found – using drawn fallback');
    const bg = this.add.graphics();
    bg.fillStyle(0x0d1b2a);
    bg.fillRect(0, 0, width, height);

    // Rough UK south coast
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

    // Rough French coast
    coast.lineStyle(2, 0x6a4a3a, 0.3);
    coast.beginPath();
    coast.moveTo(0, 500);
    coast.lineTo(200, 520);
    coast.lineTo(400, 490);
    coast.lineTo(600, 510);
    coast.lineTo(900, 480);
    coast.strokePath();
}

    // Grid
    const grid = this.add.graphics();
    grid.lineStyle(0.5, 0x3a2a1a, 0.3); //width,colour,opacity
    for (let x = 0; x <= width; x += 50) {
        grid.moveTo(x, 0);
        grid.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += 40) {
        grid.moveTo(0, y);
        grid.lineTo(width, y);
    }
    grid.strokePath(); //draws all the mapped out lines at once

            // ---------- RADAR BLIPS ----------
        const blipPositions = [
            [200, 200], [550, 150], [700, 400], [300, 500], [150, 350] //xy
        ];
        this.totalRadarBlips = blipPositions.length;
        this.radarBlipsTapped = 0;
        blipPositions.forEach(([x, y]) => {
            const blip = this.add.circle(x, y, 8, 0x00ff00, 0.8); //loops through each pair of coordinates in that lsit and draws a shape
            this.tweens.add({
            targets: blip,
            scale: 2.5,
            alpha: 0.1,
            duration: 800,
            yoyo: true,
            repeat: -1
            });

            blip.setInteractive({ useHandCursor: true });
            blip.on('pointerdown', () => {
            if (this.detectionStage !== 'radar_blip' || blip.getData('resolved')) return;

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
            this.detectionStage = 'raid_moving';
            this.spawnRaidMarker();
            });

            this.radarBlips.push(blip);
        });
             
                   //top bar ui
        this.add.text(20, 20, '◈ DETECTION PHASE', {
            fontSize: '18px',
            fill: '#ffd700',
            fontFamily: 'Courier New'
        });
                    // ---------- WAAF DIALOGUE BOX (NEW - BOTTOM OF SCREEN) ----------
        const dialogueBoxX = 40;
        const dialogueBoxY = height - 130;
        const dialogueBoxWidth = width - 80;
        const dialogueBoxHeight = 100;
        const dialogueBg = this.add.graphics();
        dialogueBg.fillStyle(0x0d1b2a, 0.92);
        dialogueBg.fillRoundedRect(dialogueBoxX, dialogueBoxY, dialogueBoxWidth, dialogueBoxHeight, 16);
        dialogueBg.lineStyle(2, 0xf5e56b, 0.4);
        dialogueBg.strokeRoundedRect(dialogueBoxX, dialogueBoxY, dialogueBoxWidth, dialogueBoxHeight, 16);
        // ---------- WAAF PORTRAIT (above dialogue, right side) ----------
        const portraitX = width - 110;
        const portraitY = dialogueBoxY - 60;

        // Place the mascot image inside the circle
        if (this.textures.exists('waaf-mascot')) {
            this.add.image(portraitX, portraitY, 'waaf-mascot')
                .setScale(0.16)
                .setDepth(10);
        } else {
            this.add.text(portraitX, portraitY - 5, 'WAAF', { // X and Y coordinates of the text, in this case, the center of the screen
                fontSize: '14px',
                fill: '#fff',
                fontFamily: 'Courier New',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(10);
        }
        this.dialogueText = this.add.text(110, height - 100, 'Welcome to Fighter Command. Tap each radar blip when it flashes.', {
            fontSize: '17px',
            fill: '#c8e6c9',
            fontFamily: 'Courier New',
            fontStyle: 'italic',
            wordWrap: { width: width - 120 }
        });

        // ---------- STATE MACHINE (NEW) ----------
        this.detectionStage = 'radar_blip';
        this.rocPostsTapped = 0;
        this.totalRocPosts = 3;  
    
}
    spawnRaidMarker() {
         // Starting position (from the last radar blip location)
        const startX = 720;
        const startY = 180;
        const endX = 540;
        const endY = 300;

        // Create the "W" marker
        const marker = this.add.text(startX, startY, 'W', {
            fontSize: '36px',
            fill: '#ff3333',
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(5);

        // Add a pulsing glow to the marker while it moves
        this.tweens.add({
            targets: marker,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 300,
            yoyo: true,
            repeat: -1
        });

        // Animate it moving inland
        this.tweens.add({
            targets: marker,
            x: endX,
            y: endY,
            duration: 2000,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                // Stop the pulsing glow
                this.tweens.killTweensOf(marker);
                marker.setScale(1);

                // Update dialogue to WAAF line 2
                this.dialogueText.setText('"Now it\'s over land, Observer Corps\' job. Watch the posts light up."');

                // Move to next stage
                this.detectionStage = 'roc_sequence';

                // Spawn ROC posts (Commit 4)
                this.spawnROCPosts(endX, endY);
            }
        });

        // Store reference
        this.raidMarker = marker;
          
    }
         spawnROCPosts(startX, startY) {
        // Define 3 ROC post positions along the raid path
        const rocPositions = [
            { x: startX - 60, y: startY + 40, label: 'ROC 1' },
            { x: startX - 140, y: startY + 80, label: 'ROC 2' },
            { x: startX - 220, y: startY + 120, label: 'ROC 3' }
        ];

        // Create unlit ROC posts
        this.rocPostObjects = [];
        rocPositions.forEach((pos, index) => {
            // Draw a small tower shape
            const g = this.make.graphics({ add: false });
            g.fillStyle(0x444444);
            g.fillRect(-8, -16, 16, 32);
            g.fillStyle(0x333333);
            g.fillCircle(0, -18, 10);
            g.generateTexture('roc_post_' + index, 24, 44);
            g.destroy();

            // Create the sprite with a larger interactive hit area
            const sprite = this.add.image(pos.x, pos.y, 'roc_post_' + index)
                .setDepth(6)
                .setInteractive({
                    useHandCursor: true,
                    hitArea: new Phaser.Geom.Circle(0, 0, 28),
                    hitAreaCallback: Phaser.Geom.Circle.Contains
                });

            // Store data
            sprite.isLit = false;
            sprite.index = index;
            sprite.tapped = false;
            sprite.lit = false;
            sprite.label = this.add.text(pos.x, pos.y + 30, pos.label, {
                fontSize: '10px',
                fill: '#666',
                fontFamily: 'Courier New'
            }).setOrigin(0.5);

            this.rocPostObjects.push(sprite);

            // Click handler
            sprite.on('pointerdown', () => {
                if (!sprite.lit) return;
                if (sprite.tapped) return;

                sprite.tapped = true;
                this.rocPostsTapped++;

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

                // Check if all tapped
                if (this.rocPostsTapped === this.totalRocPosts) {
                    this.dialogueText.setText('"Radar sees them coming across the Channel, but once they\'re over land, that\'s where we lose them. That\'s why we need the Observer Corps."');
                    this.detectionStage = 'complete';
                    
                    // Advance after 3 seconds
                    this.time.delayedCall(3000, () => {
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

            // Flash animation
            this.tweens.add({
                targets: post,
                alpha: 0.5,
                duration: 200,
                yoyo: true,
                repeat: 2
            });

            currentIndex++;

            // Light the next one after 1.5 seconds
            if (currentIndex < this.rocPostObjects.length) {
                this.time.delayedCall(1500, lightNextPost);
            }
        };

        // Start the sequence after a short delay
        this.time.delayedCall(800, lightNextPost);
    }
}