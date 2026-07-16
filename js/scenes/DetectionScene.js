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
    
}

}