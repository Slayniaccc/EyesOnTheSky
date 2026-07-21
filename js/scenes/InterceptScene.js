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
        
    }
}