// Shared building blocks for the "plotting table" scenes (DetectionScene,
// DecisionScene, InterceptScene, ToteBoardScene). Each of these was
// reimplementing the same map background, grid, dialogue box, top-bar label,
// and character portrait badge by copy-paste; this pulls that into one place
// so a layout tweak only needs to happen once. IntroScene and DebugMenuScene
// intentionally don't extend this — their layouts aren't part of this
// duplicated pattern.
class BaseGameScene extends Phaser.Scene {
    createMapBackground(width, height, imageKey = 'map') {
        if (this.textures.exists(imageKey)) {
            this.add.image(width / 2, height / 2, imageKey).setDisplaySize(width, height);
            console.log('✅ Using mapbackground.png');
        } else {
            console.log('❌ map not found – using drawn fallback');
            const bg = this.add.graphics();
            bg.fillStyle(0x0d1b2a);
            bg.fillRect(0, 0, width, height);

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

            coast.lineStyle(2, 0x6a4a3a, 0.3);
            coast.beginPath();
            coast.moveTo(0, 500);
            coast.lineTo(200, 520);
            coast.lineTo(400, 490);
            coast.lineTo(600, 510);
            coast.lineTo(900, 480);
            coast.strokePath();
        }
    }

    createGrid(width, height) {
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

    createDialogueBox(width, height) {
        this.dialogueBoxX = 40;
        this.dialogueBoxY = height - 130;
        this.dialogueBoxWidth = width - 80;
        this.dialogueBoxHeight = 100;

        const dialogueBg = this.add.graphics();
        dialogueBg.fillStyle(0x0d1b2a, 0.92);
        dialogueBg.fillRoundedRect(this.dialogueBoxX, this.dialogueBoxY, this.dialogueBoxWidth, this.dialogueBoxHeight, 16);
        dialogueBg.lineStyle(2, 0xf5e56b, 0.4);
        dialogueBg.strokeRoundedRect(this.dialogueBoxX, this.dialogueBoxY, this.dialogueBoxWidth, this.dialogueBoxHeight, 16);
    }

    createTopBar(label) {
        this.add.text(20, 20, '◈ ' + label, {
            fontSize: '18px',
            fill: '#ffd700',
            fontFamily: 'Courier New'
        });
    }

    // Circular badge + character portrait + name label, used for every
    // speaking character (Keith Park, Ludwik, WAAF) across scenes. `sizing`
    // picks one of the three modes actually in use:
    //   { scale: N }        — fixed scale (Keith Park/Ludwik's 0.15)
    //   { fitToCircle: true } — scaled to fit fully inside the circle
    //   { matchWidth: N }   — scaled to match another portrait's rendered width
    // Returns the created elements (circle + image/fallback + label) so
    // callers that need to show/hide the whole badge (e.g. DecisionScene's
    // Keith Park -> WAAF handoff) can toggle them as a group.
    createPortraitBadge(x, y, config) {
        const {
            radius = 40,
            textureKey,
            fallbackText,
            fallbackFontSize = '22px',
            fallbackFill = '#f5e56b',
            nameLabel,
            sizing = { scale: 0.15 },
            labelGap = 10,
            startHidden = false
        } = config;

        const elements = [];

        const circleBg = this.add.graphics();
        circleBg.fillStyle(0x2d1b0e, 0.9);
        circleBg.fillCircle(x, y, radius);
        circleBg.lineStyle(3, 0xf5e56b, 0.7);
        circleBg.strokeCircle(x, y, radius);
        elements.push(circleBg);

        if (textureKey && this.textures.exists(textureKey)) {
            const portrait = this.add.image(x, y, textureKey).setDepth(10);
            if (sizing.fitToCircle) {
                const fitSize = radius * 2;
                portrait.setScale(Math.min(fitSize / portrait.width, fitSize / portrait.height));
            } else if (sizing.matchWidth) {
                portrait.setScale(sizing.matchWidth / portrait.width);
            } else {
                portrait.setScale(sizing.scale != null ? sizing.scale : 0.15);
            }
            elements.push(portrait);
        } else {
            elements.push(this.add.text(x, y - 5, fallbackText, {
                fontSize: fallbackFontSize,
                fill: fallbackFill,
                fontFamily: 'Courier New',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(10));
        }

        if (nameLabel) {
            elements.push(this.add.text(x, y + radius + labelGap, nameLabel, {
                fontSize: '12px',
                fill: '#f5e56b',
                fontFamily: 'Courier New'
            }).setOrigin(0.5));
        }

        if (startHidden) {
            elements.forEach((el) => el.setVisible(false));
        }

        return elements;
    }
}
