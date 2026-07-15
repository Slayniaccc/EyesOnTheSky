class IntroScene extends Phaser.Scene {
    constructor() {
        super('IntroScene'); 
    }
    create() {
    const { width, height } = this.scale;  // Destructure screen size

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
}

}