class IntroScene extends Phaser.Scene {
    constructor() {
        super('IntroScene'); 
    }
     preload() {
        // Load your mascot image
        this.load.image('waaf-mascot', 'assets/images/waaf-mascot.png');
         this.load.image('dowding-diagram', 'assets/images/dowdingsystemexplanation.png');
        
       
    }
    create() {
    const { width, height } = this.scale; 

    // Solid dark blue background
    const bg = this.add.graphics(); 
    bg.fillStyle(0x0d1b2a); 
    bg.fillRect(0, 0, width, height);

    // Plotting-table grid overlay
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

// ---------- WAAF MASCOT ----------
let mascotX = width / 2 + 90;
let mascotY = 370; 

if (this.textures.exists('waaf-mascot')) {
    this.add.image(mascotX, mascotY, 'waaf-mascot').setScale(0.55); 
} else {
    // Fallback: draw a simple mascot using graphics
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xd4a373);
    g.fillCircle(0, 0, 45); //X,Y,radius format
    g.fillStyle(0x5a3a1a);
    g.fillRect(-18, 25, 36, 28);
    g.fillStyle(0x3a1a0a);
    g.fillCircle(-10, -10, 6);
    g.fillCircle(10, -10, 6);
    g.fillStyle(0x2d4a2d);
    g.fillRect(-30, -30, 60, 10);
    g.generateTexture('waaf-mascot', 90, 90);
    g.destroy();
    this.add.image(mascotX, mascotY, 'waaf-mascot').setScale(0.9);
}
  
                // ---------- DOWDING SYSTEM OVERLAY (container) ----------
        const overlayContainer = this.add.container(0, 0);
        overlayContainer.setDepth(20);
        overlayContainer.setVisible(false);

        // Dark backdrop
        const overlayBg = this.add.graphics();
        overlayBg.fillStyle(0x000000, 0.92);
        overlayBg.fillRect(0, 0, width, height);
        overlayContainer.add(overlayBg);

       
        let diagramImage = null;
        if (this.textures.exists('dowding-diagram')) {
            diagramImage = this.add.image(width / 2, height / 2 - 10, 'dowding-diagram')
                .setDisplaySize(Math.min(width - 80, 700), Math.min(height - 180, 500));
                } else {
         
            const fallbackContainer = this.add.container(0, 0);
            
            const fallbackBg = this.add.graphics();
            fallbackBg.fillStyle(0x1a2a3a);
            fallbackBg.fillRoundedRect(0, 0, 700, 380, 12);
            fallbackBg.lineStyle(2, 0xf5e56b, 0.3);
            fallbackBg.strokeRoundedRect(0, 0, 700, 380, 12);
            fallbackContainer.add(fallbackBg);

            const lines = [
                'THE DOWDING SYSTEM', '',
                'Radar (Chain Home)   →   Fighter Command HQ',
                '         ↓                      ↓',
                'Royal Observer Corps   →   Tote Board',
                '         ↓                      ↓',
                'Sector Stations   →   Squadrons Scrambled',
                '         ↓',
                'INTERCEPT!'
            ];
            lines.forEach((line, i) => {
                const isTitle = i === 0;
                const text = this.add.text(350, 20 + i * 30, line, {
                    fontSize: isTitle ? '26px' : '16px',
                    fill: isTitle ? '#f5e56b' : '#b0c4de',
                    fontFamily: 'Courier New',
                    fontStyle: isTitle ? 'bold' : 'normal',
                    align: 'center'
                }).setOrigin(0.5);
                fallbackContainer.add(text);
            });

            fallbackContainer.x = width / 2 - 350;
            fallbackContainer.y = height / 2 - 190;
            diagramImage = fallbackContainer;
        }
        if (diagramImage) overlayContainer.add(diagramImage);
             
                // ---------- TAP-TO-DISMISS ZONE ----------
        const dismissZone = this.add.zone(0, 0, width, height)
            .setInteractive({ useHandCursor: true })
            .setDepth(22);
        dismissZone.setVisible(false);
        overlayContainer.add(dismissZone);

        dismissZone.on('pointerdown', () => {
            overlayContainer.setVisible(false);
            dismissZone.setVisible(false);
            startBtn.setVisible(true);
            btnBg.setVisible(true);
        });

        this.time.delayedCall(2000, () => {
            overlayContainer.setVisible(true);
            dismissZone.setVisible(true);
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
startBtn.setVisible(false);
btnBg.setVisible(false);
// ---------- BUTTON CLICK ----------
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
}).setOrigin(1, 0); //anchor point moved to the right edge of the text, so it aligns with the right edge of the screen
}

}