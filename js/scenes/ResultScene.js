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
        const outcome = this.game.registry.get('interceptOutcome') || 'fail';
        const data = this.outcomeData[outcome];

        this.createMapBackground(width, height);
        this.createGrid(width, height);
        this.createTopBar('DEBRIEF');

        this.cityX = width / 2;
        this.cityY = 250;

        this.buildTitle(width, data);
    }

    get outcomeData() {
        return {
            success: {
                title: 'MISSION SUCCESS!',
                subtitle: 'City Saved',
                message: '"Radar saw them. The Corps tracked them. Park sent us. We held the line. That\'s how Britain stayed free."',
                hex: '#44ff44'
            },
            partial: {
                title: 'PARTIAL SUCCESS',
                subtitle: 'Some Damage Taken',
                message: '"We held most of them. The system worked — next time we\'ll be faster."',
                hex: '#e8a317'
            },
            fail: {
                title: 'MISSION FAILED',
                subtitle: 'The Raid Got Through',
                message: '"We were too slow today. But the system still tracked them. Tomorrow we\'ll be ready."',
                hex: '#c8d0d8'
            }
        };
    }

    buildTitle(width, data) {
        this.add.text(width / 2, 95, data.title, {
            fontSize: '40px',
            fill: data.hex,
            fontFamily: 'Courier New',
            fontStyle: 'bold',
            stroke: '#0d1b2a',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(width / 2, 140, data.subtitle, {
            fontSize: '18px',
            fill: '#f5e56b',
            fontFamily: 'Courier New',
            letterSpacing: 2
        }).setOrigin(0.5);
    }
}
