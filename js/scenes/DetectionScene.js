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
            this.radarBlips.push(blip);
        });
                // ---------- RAID MARKERS ----------
        const raidData = [
            { x: 680, y: 190, label: 'W1' },
            { x: 730, y: 220, label: 'W2' },
            { x: 620, y: 270, label: 'W3' },
            { x: 780, y: 300, label: 'W4' }
        ];
        const raidsRegistry = []
        raidData.forEach((r, i) => {
            const marker = this.add.text(r.x, r.y, 'W', {
                fontSize: '28px',
                fill: '#ff3333',
                fontFamily: 'Courier New',
                fontStyle: 'bold'
            }).setOrigin(0.5); //anchored to the center of the text, so it is centered on the screen
            this.tweens.add({ //makes radar blips and "W' markers pulse"
                targets: marker,
                scaleX: 1.4,
                scaleY: 1.4,
                duration: 600,
                yoyo: true,
                repeat: -1,
                delay: i * 200
            });
            this.raidMarkers.push(marker);
            raidsRegistry.push({
                id: 'Raid ' + (i + 1), //creating a register of the enemy air raids
                height: 15000 + i * 2000, //flying altitude of enemy planes in ft
                speed: 280 + i * 15,
                heading: 220 - i * 5,
                size: 30 + i * 10
            });
            //detection arrow pointing to the marker
            const arrow = this.add.graphics();
            arrow.lineStyle(3, 0xff4444);
            arrow.moveTo(r.x + 30, r.y + 20); //positioned directly relative to each raid's marker position
            arrow.lineTo(r.x - 20, r.y - 30);
            arrow.strokePath();
        });
        this.game.registry.set('raids', raidsRegistry);
                   //top bar ui
        this.add.text(20, 20, '◈ DETECTION PHASE', {
            fontSize: '18px',
            fill: '#ffd700',
            fontFamily: 'Courier New'
        });
                    // ---------- WAAF DIALOGUE BOX (NEW - BOTTOM OF SCREEN) ----------
        const dialogueBg = this.add.graphics();
        dialogueBg.fillStyle(0x0d1b2a, 0.92);
        dialogueBg.fillRoundedRect(40, height - 130, width - 80, 100, 16);
        dialogueBg.lineStyle(2, 0xf5e56b, 0.4);
        dialogueBg.strokeRoundedRect(40, height - 130, width - 80, 100, 16);

        this.dialogueText = this.add.text(60, height - 100, 'Welcome to Fighter Command. Tap the radar blip when it flashes.', {
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

}