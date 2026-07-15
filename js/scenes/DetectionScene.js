class DetectionScene extends Phaser.Scene {
    constructor() {
        super('DetectionScene');
        this.raidMarkers = [];
        this.radarBlips = [];
    }

    create() {
        const { width, height } = this.scale;
    }
}