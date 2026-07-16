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
        const { width, height } = this.scale; //borrows existing width and height values
    
}
create() {
    const { width, height } = this.scale;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0d1b2a);
    bg.fillRect(0, 0, width, height);

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
    
}

}