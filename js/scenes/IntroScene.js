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