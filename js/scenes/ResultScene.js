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

        // Same spot InterceptScene marks as "the city" — keeps the debrief
        // pointing at the same place the player just defended, and avoids the
        // decorative cloud art mapbackground.png has baked in near the
        // (width/2, 250) area this used to sit on top of.
        this.cityX = 720;
        this.cityY = 320;

        this.buildTitle(width, data);
        this.buildCityScene(outcome);
        this.buildRestartButton(width, height);

        this.createDialogueBox(width, height);
        this.createPortraitBadge(width - 110, height - 210, {
            radius: 60,
            textureKey: 'ludwik',
            fallbackText: 'L',
            nameLabel: 'Ludwik',
            sizing: { fitToCircle: true },
            labelGap: 15
        });
        this.dialogueText = this.add.text(110, height - 100, data.message, {
            fontSize: '17px',
            fill: data.hex,
            fontFamily: 'Courier New',
            fontStyle: 'italic',
            wordWrap: { width: width - 260 }
        });
        AudioManager.playVoice(this, data.voice);
    }

    get outcomeData() {
        return {
            success: {
                title: 'MISSION SUCCESS!',
                subtitle: 'City Saved',
                message: '"Radar saw them. The Corps tracked them. Park sent us. We held the line. That\'s how Britain stayed free."',
                hex: '#44ff44',
                voice: AudioManager.manifest.voice.ludwik.resultSuccess
            },
            partial: {
                title: 'PARTIAL SUCCESS',
                subtitle: 'Some Damage Taken',
                message: '"We held most of them. The system worked — next time we\'ll be faster."',
                hex: '#e8a317',
                voice: AudioManager.manifest.voice.ludwik.resultPartial
            },
            fail: {
                title: 'MISSION FAILED',
                subtitle: 'The Raid Got Through',
                message: '"We were too slow today. But the system still tracked them. Tomorrow we\'ll be ready."',
                hex: '#c8d0d8',
                voice: AudioManager.manifest.voice.ludwik.resultFail
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

    buildCityScene(outcome) {
        // Solid backing behind the outcome icon — the map art underneath has
        // its own dense decoration (buildings, cloud illustrations), so a
        // faint marker alone gets lost in it regardless of exact position.
        this.add.circle(this.cityX, this.cityY, 34, 0x0d1b2a, 0.85);
        this.add.circle(this.cityX, this.cityY, 34, 0, 0).setStrokeStyle(2, 0xf5e56b, 0.8);
        this.add.text(this.cityX, this.cityY + 55, '🏙️ THE CITY', {
            fontSize: '14px',
            fill: '#f5e56b',
            fontFamily: 'Courier New',
            fontStyle: 'bold',
            stroke: '#0d1b2a',
            strokeThickness: 3
        }).setOrigin(0.5);

        if (outcome === 'success') {
            this.playSuccessAnimation();
        } else if (outcome === 'partial') {
            this.playPartialAnimation();
        } else {
            this.playFailAnimation();
        }
    }

    // ---------- FULL SUCCESS: pulsing shield + returning squadron ----------
    playSuccessAnimation() {
        AudioManager.playSFX(this, AudioManager.manifest.sfx.victoryCelebration);
        const ring = this.add.circle(this.cityX, this.cityY, 35, 0x44ff44, 0).setStrokeStyle(3, 0x44ff44, 0.8);
        this.tweens.add({
            targets: ring,
            radius: 60,
            alpha: 0,
            duration: 1400,
            repeat: -1,
            onUpdate: () => ring.setStrokeStyle(3, 0x44ff44, 1 - ring.radius / 60)
        });

        this.add.text(this.cityX, this.cityY - 5, '🛡️', { fontSize: '46px' }).setOrigin(0.5);

        const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffdd44, 0xff44ff, 0x44ffdd];
        for (let i = 0; i < 36; i++) {
            const confetti = this.add.rectangle(
                this.cityX + Phaser.Math.Between(-220, 220),
                this.cityY - 40 + Phaser.Math.Between(-40, 20),
                6, 10,
                colors[Phaser.Math.Between(0, colors.length - 1)]
            );
            this.tweens.add({
                targets: confetti,
                y: confetti.y + Phaser.Math.Between(120, 260),
                x: confetti.x + Phaser.Math.Between(-60, 60),
                angle: Phaser.Math.Between(0, 720),
                alpha: 0,
                duration: 1600 + Phaser.Math.Between(0, 600),
                delay: Phaser.Math.Between(0, 400),
                onComplete: () => confetti.destroy()
            });
        }

        // Squadron flying home to a rest formation near the top-left of the map.
        const homeX = 120;
        const homeY = 190;
        const usingSprite = this.textures.exists('raf-plane');
        const startPositions = [
            { x: -40, y: 100 }, { x: 950, y: 60 }, { x: 950, y: 260 }
        ];
        startPositions.forEach((start, i) => {
            const plane = usingSprite
                ? this.add.image(start.x, start.y, 'raf-plane').setScale(0.07)
                : this.add.triangle(start.x, start.y, 0, -14, -10, 8, 10, 8, 0x66ccff);
            plane.setDepth(5);
            const targetX = homeX + i * 34;
            const targetY = homeY + i * 22;
            this.tweens.add({
                targets: plane,
                x: targetX,
                y: targetY,
                duration: 1800,
                delay: i * 200,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    this.tweens.add({
                        targets: plane,
                        y: targetY - 8,
                        duration: 700,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
            });
        });
        this.add.text(homeX + 34, homeY - 45, 'HOME SAFE', {
            fontSize: '12px',
            fill: '#88ff88',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);
    }

    // ---------- PARTIAL SUCCESS: small damage marker, mild shake ----------
    playPartialAnimation() {
        const ring = this.add.circle(this.cityX, this.cityY, 35, 0xe8a317, 0).setStrokeStyle(3, 0xe8a317, 0.6);
        this.tweens.add({
            targets: ring,
            radius: 50,
            alpha: 0,
            duration: 1600,
            repeat: -1,
            onUpdate: () => ring.setStrokeStyle(3, 0xe8a317, 0.6 * (1 - ring.radius / 50))
        });

        const warning = this.add.text(this.cityX, this.cityY - 5, '⚠️', { fontSize: '40px' }).setOrigin(0.5);
        this.tweens.add({
            targets: warning,
            x: warning.x + 4,
            duration: 90,
            yoyo: true,
            repeat: 5
        });
    }

    // ---------- FAIL: shadow marker, drifting cloud ----------
    playFailAnimation() {
        const shadow = this.add.circle(this.cityX, this.cityY, 25, 0x333333, 0);
        this.tweens.add({ targets: shadow, alpha: 0.55, duration: 1200 });

        this.add.text(this.cityX, this.cityY - 5, '☁️', { fontSize: '40px' }).setOrigin(0.5);

        const cloud = this.add.text(this.cityX - 260, this.cityY - 60, '☁️', { fontSize: '32px', alpha: 0.5 });
        this.tweens.add({
            targets: cloud,
            x: this.cityX + 260,
            duration: 6000,
            repeat: -1,
            onRepeat: () => { cloud.x = this.cityX - 260; }
        });
    }

    buildRestartButton(width, height) {
        const btn = this.add.text(width / 2, 460, '▶  PLAY AGAIN  ▶', {
            fontSize: '22px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            fontStyle: 'bold',
            backgroundColor: '#1e3a5f',
            padding: { x: 26, y: 14 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerdown', () => {
            AudioManager.playSFX(this, AudioManager.manifest.sfx.buttonClick);
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.game.registry.set('score', 0);
                this.game.registry.set('raids', []);
                this.game.registry.set('interceptSuccess', false);
                this.game.registry.set('playerChoices', {});
                this.game.registry.set('interceptOutcome', null);
                this.scene.start('IntroScene');
            });
        });
    }
}
