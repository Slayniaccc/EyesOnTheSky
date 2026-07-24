// Final debrief screen. Reads game.registry.get('interceptOutcome'), which
// both DecisionScene (if both raids miss their sector) and InterceptScene
// (based on turnedBack/totalEnemies) can set — whichever ran last wins, and
// since InterceptScene always runs after DecisionScene in the normal flow,
// its value is what actually reaches this scene.
class ResultScene extends BaseGameScene {
    constructor() {
        super('ResultScene');
    }

    preload() {
        this.load.image('map', 'assets/images/mapbackground.png');
        this.load.image('ludwik', 'assets/images/ludwik.png');
        this.load.image('raf-plane', 'assets/images/raf-plane.png');
    }

    create() {
        const { width, height } = this.scale;

        this.createMapBackground(width, height);
        this.createGrid(width, height);
        this.createTopBar('DEBRIEF');
    }
}
