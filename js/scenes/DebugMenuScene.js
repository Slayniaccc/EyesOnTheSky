// Dev-only overlay for jumping straight to any scene without playing through
// the whole game. Runs in parallel with whatever gameplay scene is active
// (registered with active:true in main.js) so the toggle is always reachable.
// Touch-friendly by design since the target device (Galaxy A6 tablet) has no
// keyboard.
class DebugMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DebugMenuScene', active: true });
    }

    create() {
        const { width } = this.scale;
        this.expanded = false;

        this.sceneList = [
            { key: 'IntroScene', label: 'Intro' },
            { key: 'DetectionScene', label: 'Detection' },
            { key: 'ToteBoardScene', label: 'Tote Board' },
            { key: 'DecisionScene', label: 'Decision' },
            { key: 'InterceptScene', label: 'Intercept' },
            { key: 'ResultScene', label: 'Result' }
        ];

        const panel = this.add.container(width - 10, 10).setDepth(1000);

        const toggleBg = this.add.graphics();
        toggleBg.fillStyle(0x1a1a2e, 0.85);
        toggleBg.fillRoundedRect(-40, 0, 40, 32, 8);
        toggleBg.lineStyle(2, 0xffd700, 0.8);
        toggleBg.strokeRoundedRect(-40, 0, 40, 32, 8);
        const toggleText = this.add.text(-20, 16, '🐞', { fontSize: '16px' }).setOrigin(0.5);
        const toggleZone = this.add.zone(-20, 16, 40, 32).setInteractive({ useHandCursor: true });
        panel.add([toggleBg, toggleText, toggleZone]);

        this.menuItems = [];
        this.sceneList.forEach((sceneInfo, i) => {
            const y = 44 + i * 38;

            const itemBg = this.add.graphics();
            itemBg.fillStyle(0x1a1a2e, 0.92);
            itemBg.fillRoundedRect(-150, y, 150, 32, 8);
            itemBg.lineStyle(1, 0x4a6a8a, 0.6);
            itemBg.strokeRoundedRect(-150, y, 150, 32, 8);

            const itemText = this.add.text(-75, y + 16, sceneInfo.label, {
                fontSize: '14px',
                fill: '#b0c4de',
                fontFamily: 'Courier New'
            }).setOrigin(0.5);

            const itemZone = this.add.zone(-75, y + 16, 150, 32).setInteractive({ useHandCursor: true });
            itemZone.on('pointerdown', () => this.jumpTo(sceneInfo.key));

            panel.add([itemBg, itemText, itemZone]);
            this.menuItems.push(itemBg, itemText, itemZone);
        });

        this.setMenuVisible(false);

        toggleZone.on('pointerdown', () => {
            this.expanded = !this.expanded;
            this.setMenuVisible(this.expanded);
        });
    }

    setMenuVisible(visible) {
        this.menuItems.forEach((item) => item.setVisible(visible));
    }

    jumpTo(targetKey) {
        this.scene.manager.getScenes(true).forEach((activeScene) => {
            if (activeScene.scene.key !== 'DebugMenuScene') {
                this.scene.stop(activeScene.scene.key);
            }
        });
        // Jumping away from InterceptScene mid-flight (before showResult()
        // stops them itself) would otherwise leave its looping engine sounds
        // droning on through whatever scene comes next. Same for IntroScene's
        // plane-flyby ambience if jumped away from before reaching DetectionScene.
        AudioManager.stopMusic(AudioManager.manifest.sfx.spitfireEngine);
        AudioManager.stopMusic(AudioManager.manifest.sfx.messerschmittEngine);
        AudioManager.stopMusic(AudioManager.manifest.music.planeFlyby);
        AudioManager.stopMusic(AudioManager.manifest.music.introTheme);
        this.scene.start(targetKey);
        this.expanded = false;
        this.setMenuVisible(false);
    }
}
