class IntroScene extends Phaser.Scene {
    constructor() {
        super('IntroScene'); 
    }
    create() {
    const { width, height } = this.scale;  // Destructure screen size,gives game's width and height in pixels

    // Solid dark blue background
    const bg = this.add.graphics(); // Create a graphics object for the background
    bg.fillStyle(0x0d1b2a); //colour set to a very dark navy blue (hexadecimal color code)
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
}

}
// ---------- TITLE ----------
this.add.text(width / 2, 110, 'EYES ON THE SKY', { //also sets X and Y coordinates of the text, in this case, the center of the screen
    fontSize: '54px',
    fill: '#f5e56b',
    fontFamily: 'Courier New',
    fontStyle: 'bold',
    stroke: '#2d1b0e', //sets the colour of the outline
    strokeThickness: 8 //how thick the outline is
}).setOrigin(0.5); //anchor point moved to the center of the text, so it is centered on the screen

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
let mascotX = width / 2;
let mascotY = 370; //places the mascot 37

if (this.textures.exists('waaf-mascot')) {
    this.add.image(mascotX, mascotY, 'waaf-mascot').setScale(0.7); // sets the scale of the mascot to 70% of its original size
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
    this.add.image(mascotX, mascotY, 'waaf-mascot');
}

// ---------- DIALOGUE BUBBLE ----------
//sets dialogue bubble text to appear above the mascot, with a light green text color and a dark blue background    
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
btnBg.fillRoundedRect(width / 2 - 100, 510, 200, 60, 12); //corner radius in pixels
btnBg.lineStyle(2, 0xf5e56b);
btnBg.strokeRoundedRect(width / 2 - 100, 510, 200, 60, 12);

const startBtn = this.add.text(width / 2, 540, '▶  BEGIN  ◀', { //center,540px from the very top
    fontSize: '28px',
    fill: '#ffffff',
    fontFamily: 'Courier New'
}).setOrigin(0.5).setInteractive({ useHandCursor: true }); 

