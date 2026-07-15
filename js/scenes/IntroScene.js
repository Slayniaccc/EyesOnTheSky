class IntroScene extends Phaser.Scene {
    constructor() {
        super('IntroScene');
    }

    preload() {
        // Try to load the mascot – if it fails, we'll use the fallback
        this.load.image('waaf-mascot', 'assets/images/waaf-mascot.png');
        console.log('🔵 Preloading waaf-mascot.png...');
    }

    create() {
        const { width, height } = this.scale;

        // ---------- BACKGROUND ----------
        const bg = this.add.graphics();
        bg.fillStyle(0x0d1b2a);
        bg.fillRect(0, 0, width, height);

        // ---------- GRID ----------
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

        // ---------- TITLE ----------
        this.add.text(width / 2, 110, 'EYES ON THE SKY', {
            fontSize: '54px',
            fill: '#f5e56b',
            fontFamily: 'Courier New',
            fontStyle: 'bold',
            stroke: '#2d1b0e',
            strokeThickness: 8
        }).setOrigin(0.5);

        this.add.text(width / 2, 175, 'Battle of Britain – Plotting Table', {
            fontSize: '20px',
            fill: '#b0c4de',
            fontFamily: 'Courier New',
            letterSpacing: 2
        }).setOrigin(0.5);

        this.add.text(width / 2, 210, 'Summer 1940', {
            fontSize: '14px',
            fill: '#8a7a6a',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        // ---------- WAAF MASCOT – FORCE FALLBACK ----------
        const mascotX = width / 2;
        const mascotY = 370;

        // Check if the image loaded – if not, draw the fallback
        if (this.textures.exists('waaf-mascot')) {
            console.log('✅ Using loaded image');
            this.add.image(mascotX, mascotY, 'waaf-mascot').setScale(0.7);
        } else {
            console.log('❌ Image not loaded – drawing fallback mascot');
            const g = this.make.graphics({ add: false });
            // Head
            g.fillStyle(0xd4a373);
            g.fillCircle(0, 0, 45);
            // Body
            g.fillStyle(0x5a3a1a);
            g.fillRect(-18, 25, 36, 28);
            // Eyes
            g.fillStyle(0x3a1a0a);
            g.fillCircle(-10, -10, 6);
            g.fillCircle(10, -10, 6);
            // Hat
            g.fillStyle(0x2d4a2d);
            g.fillRect(-30, -30, 60, 10);
            g.generateTexture('waaf-mascot', 90, 90);
            g.destroy();
            this.add.image(mascotX, mascotY, 'waaf-mascot');
        }

        // ---------- DIALOGUE BUBBLE ----------
        this.add.text(mascotX + 110, mascotY - 40, '"Enemy raids plotted, sir."', {
            fontSize: '16px',
            fill: '#c8e6c9',
            fontFamily: 'Courier New',
            fontStyle: 'italic',
            backgroundColor: '#0d1b2a',
            padding: { x: 16, y: 8 },
            borderRadius: 8
        });

        // ---------- START BUTTON ----------
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x2d6a4f, 0.9);
        btnBg.fillRoundedRect(width / 2 - 100, 510, 200, 60, 12);
        btnBg.lineStyle(2, 0xf5e56b);
        btnBg.strokeRoundedRect(width / 2 - 100, 510, 200, 60, 12);

        const startBtn = this.add.text(width / 2, 540, '▶  BEGIN  ◀', {
            fontSize: '28px',
            fill: '#ffffff',
            fontFamily: 'Courier New'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        startBtn.on('pointerdown', () => {
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('DetectionScene');
            });
        });

        // ---------- FOOTER ----------
        this.add.text(15, height - 25, 'v1.0 · Historical Simulation', {
            fontSize: '11px',
            fill: '#555'
        });
        this.add.text(width - 15, height - 25, 'EyesOnTheSky', {
            fontSize: '11px',
            fill: '#555'
        }).setOrigin(1, 0);
    }
}