class DecisionScene extends Phaser.Scene {
    constructor() {
        super('DecisionScene');
    }

    create() {
        const { width, height } = this.scale;
        console.log('DecisionScene: loaded');
    }
}