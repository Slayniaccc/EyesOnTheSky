class IntroScene extends Phaser.Scene {
    constructor() {
        super('IntroScene');
    }

    preload() {
        this.load.image('waaf-mascot-bust', 'assets/images/waaf-mascot-bust.png');
        this.load.image('keith-park', 'assets/images/keithpark.png');
        this.load.image('ludwik', 'assets/images/ludwik.png');
        this.load.image('raf-plane', 'assets/images/raf-plane.png');
        this.load.image('german-plane', 'assets/images/german_plane.png');

        // Only what this scene itself plays — the drifting-engine music, the
        // button-click SFX every page uses, and the Dowding step narration.
        // Everything else loads in the scene that actually needs it (see
        // AudioManager.preload's comment).
        AudioManager.preload(this, [
            AudioManager.manifest.music.planeFlyby,
            AudioManager.manifest.sfx.buttonClick,
            AudioManager.manifest.voice.dowdingNarrator
        ]);

        this._showLoadingProgress();
    }

    // Even the trimmed IntroScene load can take a moment on a slow/first
    // offline run — a blank canvas during that reads as a frozen page, so
    // show a simple progress bar instead of nothing. Drawn directly against
    // the canvas since no scene assets are guaranteed loaded yet.
    _showLoadingProgress() {
        const { width, height } = this.scale;
        const barWidth = 300;
        const barHeight = 22;
        const x = width / 2 - barWidth / 2;
        const y = height / 2 - barHeight / 2;

        const box = this.add.graphics();
        box.fillStyle(0x0d1b2a, 0.9);
        box.fillRoundedRect(x - 4, y - 4, barWidth + 8, barHeight + 8, 8);

        const bar = this.add.graphics();

        const label = this.add.text(width / 2, y - 24, 'Loading…', {
            fontSize: '16px',
            fill: '#3a2210',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            bar.clear();
            bar.fillStyle(0xe8a317, 1);
            bar.fillRoundedRect(x, y, barWidth * value, barHeight, 6);
        });

        this.load.on('complete', () => {
            box.destroy();
            bar.destroy();
            label.destroy();
        });
    }

    create() {
        const { width, height } = this.scale;

        AudioManager.playMusic(this, AudioManager.manifest.music.planeFlyby);

        this.createBackground(width, height);
        this.createBackgroundPlanes(width, height);
        this.createFooter(width, height);

        this.titlePage = this.createTitlePage(width, height);
        this.characterPage = this.createCharacterPage(width, height);
        this.dowdingPage = this.createDowdingPage(width, height);

        this.characterPage.setVisible(false).setAlpha(0);
        this.dowdingPage.setVisible(false).setAlpha(0);
    }

    createBackground(width, height) {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x8fd0ea, 0x8fd0ea, 0xfff2cf, 0xfff2cf, 1);
        bg.fillRect(0, 0, width, height);

        const grid = this.add.graphics();
        grid.lineStyle(1, 0xd9b98a, 0.25);
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

    // Faint plane silhouettes drifting across the title/character/Dowding
    // pages — added behind every other element in create() (drawn first =
    // rendered furthest back), low-alpha so they read as ambient motion, not
    // a focal point. Mostly RAF planes left-to-right; a couple of German
    // silhouettes drift the opposite way, tinted grey and dimmer, for a
    // hazy "distant dogfight" feel that doesn't compete with the RAF planes
    // as the dominant motion.
    createBackgroundPlanes(width, height) {
        const paths = [
            { y: height * 0.12, scale: 0.05, alpha: 0.28, duration: 14000, delay: 0, texture: 'raf-plane', tint: 0x3a6ea5 },
            { y: height * 0.22, scale: 0.04, alpha: 0.22, duration: 18000, delay: 4000, texture: 'raf-plane', tint: 0x3a6ea5 },
            { y: height * 0.08, scale: 0.045, alpha: 0.25, duration: 16000, delay: 9000, texture: 'raf-plane', tint: 0x3a6ea5 },
            { y: height * 0.17, scale: 0.038, alpha: 0.20, duration: 20000, delay: 2000, texture: 'raf-plane', tint: 0x3a6ea5 },
            { y: height * 0.28, scale: 0.055, alpha: 0.24, duration: 13000, delay: 12000, texture: 'raf-plane', tint: 0x3a6ea5 },
            { y: height * 0.15, scale: 0.04, alpha: 0.15, duration: 17000, delay: 6000, texture: 'german-plane', tint: 0x999999, reverse: true },
            { y: height * 0.25, scale: 0.035, alpha: 0.13, duration: 19000, delay: 15000, texture: 'german-plane', tint: 0x999999, reverse: true }
        ];

        paths.forEach((p) => {
            const textureKey = p.texture || 'raf-plane';
            if (!this.textures.exists(textureKey)) return;

            const startX = p.reverse ? width + 60 : -60;
            const endX = p.reverse ? -60 : width + 60;

            const plane = this.add.image(startX, p.y, textureKey)
                .setScale(p.scale)
                .setAlpha(p.alpha)
                .setTint(p.tint || 0x3a6ea5)
                .setFlipX(!!p.reverse);

            const flyAcross = () => {
                plane.x = startX;
                plane.y = p.y + Phaser.Math.Between(-15, 15);
                this.tweens.add({
                    targets: plane,
                    x: endX,
                    duration: p.duration,
                    ease: 'Linear',
                    onComplete: flyAcross
                });
            };

            this.time.delayedCall(p.delay, flyAcross);
        });
    }

    createFooter(width, height) {
        this.add.text(15, height - 25, 'v1.0 · Historical Simulation', {
            fontSize: '11px',
            fill: '#4a4a4a'
        });
        this.add.text(width - 15, height - 25, 'EyesOnTheSky', {
            fontSize: '11px',
            fill: '#4a4a4a'
        }).setOrigin(1, 0);
    }

    createButton(x, y, label, color, opts = {}) {
        const w = opts.width || 220;
        const h = opts.height || 60;
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
        bg.lineStyle(3, 0x3a2210, 0.6);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);

        const text = this.add.text(0, 0, label, {
            fontSize: opts.fontSize || '20px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const hitZone = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });

        container.add([bg, text, hitZone]);
        container.hitZone = hitZone;
        container.label = text;
        return container;
    }

    // Scales an image to fit inside a box while keeping its native aspect ratio
    // (avoids the stretched/squashed look of forcing an exact display size).
    fitToBox(image, maxW, maxH) {
        const scale = Math.min(maxW / image.width, maxH / image.height);
        image.setScale(scale);
        return image;
    }

    // Drawn natively instead of loading assets/images/dowdingsystemexplanation.png —
    // that source PNG has soft/blurry text baked into it at the pixel level (confirmed
    // by inspecting the raw file), so no amount of in-game scaling could ever make it
    // crisp. Phaser text/graphics render sharp at any size, so this row list replaces it.
    buildDowdingDiagram(width) {
        const rows = [
            { icon: '📡', title: 'CHAIN HOME RADAR', caption: 'Spots raids out at sea' },
            { icon: '👀', title: 'OBSERVER CORPS', caption: 'Tracks raids over land' },
            { icon: '🗂️', title: 'FILTER ROOM & FIGHTER COMMAND HQ', caption: 'Clears reports, sees the big picture at Bentley Priory' },
            { icon: '🏠', title: 'GROUP HQ (11 GROUP)', caption: 'This bunker — Uxbridge' },
            { icon: '🎯', title: 'SECTOR STATIONS', caption: 'Local airfield control' },
            { icon: '✈️', title: 'SQUADRONS', caption: 'Pilots scramble to intercept' }
        ];

        const boxW = 760;
        const boxX = width / 2 - boxW / 2;
        const boxY = 90;
        const rowH = 42;
        const rowGap = 4;
        const boxH = rows.length * (rowH + rowGap) - rowGap + 20;

        const container = this.add.container(0, 0);

        const bg = this.add.graphics();
        bg.fillStyle(0x0d1b2a, 0.95);
        bg.fillRoundedRect(boxX, boxY, boxW, boxH, 14);
        bg.lineStyle(2, 0xf5e56b, 0.5);
        bg.strokeRoundedRect(boxX, boxY, boxW, boxH, 14);
        container.add(bg);

        rows.forEach((row, i) => {
            const rowY = boxY + 10 + i * (rowH + rowGap);

            const rowBg = this.add.graphics();
            rowBg.fillStyle(0x16283d, 0.9);
            rowBg.fillRoundedRect(boxX + 14, rowY, boxW - 28, rowH, 8);
            container.add(rowBg);

            container.add(this.add.text(boxX + 34, rowY + rowH / 2, row.icon, {
                fontSize: '20px'
            }).setOrigin(0.5));

            container.add(this.add.text(boxX + 60, rowY + 11, row.title, {
                fontSize: '13px',
                fill: '#f5e56b',
                fontFamily: 'Courier New',
                fontStyle: 'bold'
            }));

            container.add(this.add.text(boxX + 60, rowY + 26, row.caption, {
                fontSize: '11px',
                fill: '#a8b8c8',
                fontFamily: 'Courier New'
            }));

            container.add(this.add.text(boxX + boxW - 40, rowY + rowH / 2, String(i + 1), {
                fontSize: '13px',
                fill: '#f5e56b',
                fontFamily: 'Courier New'
            }).setOrigin(0.5));
        });

        return container;
    }

    goToPage(fromPage, toPage, onComplete) {
        AudioManager.playSFX(this, AudioManager.manifest.sfx.buttonClick);
        this.tweens.add({
            targets: fromPage,
            alpha: 0,
            duration: 220,
            onComplete: () => {
                fromPage.setVisible(false);
                toPage.setVisible(true);
                toPage.setAlpha(0);
                this.tweens.add({
                    targets: toPage,
                    alpha: 1,
                    duration: 320,
                    onComplete: () => { if (onComplete) onComplete(); }
                });
            }
        });
    }

    createTitlePage(width, height) {
        const page = this.add.container(0, 0);

        const title = this.add.text(width / 2, 150, 'EYES ON THE SKY', {
            fontSize: '58px',
            fill: '#e8a317',
            fontFamily: 'Courier New',
            fontStyle: 'bold',
            stroke: '#3a2210',
            strokeThickness: 8
        }).setOrigin(0.5);

        const subtitle = this.add.text(width / 2, 215, 'Battle of Britain – Plotting Table', {
            fontSize: '22px',
            fill: '#2d4a6a',
            fontFamily: 'Courier New',
            letterSpacing: 2
        }).setOrigin(0.5);

        const dateText = this.add.text(width / 2, 250, 'Summer 1940', {
            fontSize: '16px',
            fill: '#7a5a3a',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        const prompt = this.add.text(width / 2, height / 2 + 60, 'A game for young plotters', {
            fontSize: '18px',
            fill: '#3a2210',
            fontFamily: 'Courier New',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        const nextBtn = this.createButton(width / 2, height - 110, '▶  NEXT  ▶', 0x2ecc71);
        nextBtn.hitZone.on('pointerdown', () => {
            this.goToPage(page, this.characterPage);
        });

        page.add([title, subtitle, dateText, prompt, nextBtn]);
        return page;
    }

    createCharacterPage(width, height) {
        const page = this.add.container(0, 0);

        const heading = this.add.text(width / 2, 55, 'MEET THE TEAM', {
            fontSize: '32px',
            fill: '#e8a317',
            fontFamily: 'Courier New',
            fontStyle: 'bold',
            stroke: '#3a2210',
            strokeThickness: 6
        }).setOrigin(0.5);
        page.add(heading);

        const characters = [
            {
                key: 'waaf-mascot-bust',
                name: 'WAAF Plotter',
                role: 'Moves the markers on the table, tracking every raid Fighter Command needs to see.',
                accent: 0x3a7bd5
            },
            {
                key: 'keith-park',
                name: 'Keith Park',
                role: 'Air Vice-Marshal, 11 Group. Commands the squadrons defending London from this bunker.',
                accent: 0x2d6a4f,
                // These portraits have a lot of headroom/whitespace around the
                // face compared to WAAF's tight bust crop, so fitting the whole
                // image inside the circle (like WAAF) leaves them looking much
                // smaller. Cover-scale + crop to the circle instead.
                coverFit: true
            },
            {
                key: 'ludwik',
                name: 'Ludwik',
                role: 'A Polish fighter pilot flying with the RAF, ready to scramble the moment the board calls.',
                accent: 0xcc3333,
                coverFit: true
            }
        ];

        const cardWidth = 270;
        const cardHeight = 385;
        const gap = 22;
        const totalWidth = characters.length * cardWidth + (characters.length - 1) * gap;
        const startX = width / 2 - totalWidth / 2 + cardWidth / 2;
        const cardY = height / 2 - 30;

        characters.forEach((char, i) => {
            const cardX = startX + i * (cardWidth + gap);
            page.add(this.buildCharacterCard(cardX, cardY, cardWidth, cardHeight, char));
        });

        const backBtn = this.createButton(width / 2 - 130, height - 55, '◀ BACK', 0x8a8a8a, { width: 180 });
        backBtn.hitZone.on('pointerdown', () => this.goToPage(page, this.titlePage));

        const nextBtn = this.createButton(width / 2 + 130, height - 55, 'NEXT ▶', 0x2ecc71, { width: 180 });
        nextBtn.hitZone.on('pointerdown', () => {
            this.dowdingStepIndex = 0;
            this.updateDowdingStepDisplay();
            this.goToPage(page, this.dowdingPage, () => this.announceDowdingStep());
        });

        page.add([backBtn, nextBtn]);
        return page;
    }

    buildCharacterCard(x, y, w, h, char) {
        const card = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.fillStyle(0xfff8e7, 0.95);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
        bg.lineStyle(3, char.accent, 0.9);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
        card.add(bg);

        const portraitY = -h / 2 + 105;
        const badge = this.add.graphics();
        badge.fillStyle(char.accent, 0.15);
        badge.fillCircle(0, portraitY, 78);
        card.add(badge);

        if (this.textures.exists(char.key)) {
            const img = this.add.image(0, portraitY, char.key);
            if (char.coverFit) {
                const fitSize = 156; // matches the badge circle's diameter (radius 78)
                img.setScale(Math.max(fitSize / img.width, fitSize / img.height));
            } else {
                this.fitToBox(img, 145, 145);
            }
            // Clip to the circle regardless of scaling mode — fitToBox only
            // guarantees the image fits inside a bounding *square*, so a
            // rectangular source image (any of these three) can still poke
            // past the circle's round edge at the corners without this.
            // GeometryMask doesn't inherit a parent Container's transform, so
            // masking with `badge` (nested in `card`) crops against its
            // *local* (0, portraitY) coordinates instead of where it actually
            // renders on screen. Build the mask shape at the card's real
            // world position instead, invisible, not added to the container.
            const maskShape = this.add.graphics().setVisible(false);
            maskShape.fillCircle(x, y + portraitY, 78);
            img.setMask(maskShape.createGeometryMask());
            card.add(img);
        } else {
            const circle = this.add.graphics();
            circle.fillStyle(char.accent, 1);
            circle.fillCircle(0, portraitY, 70);
            card.add(circle);
            const initial = this.add.text(0, portraitY, char.name[0], {
                fontSize: '50px',
                fill: '#ffffff',
                fontFamily: 'Courier New',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            card.add(initial);
        }

        const nameText = this.add.text(0, -h / 2 + 200, char.name, {
            fontSize: '20px',
            fill: '#2d2210',
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        card.add(nameText);

        const roleText = this.add.text(0, -h / 2 + 232, char.role, {
            fontSize: '13px',
            fill: '#4a3a2a',
            fontFamily: 'Courier New',
            align: 'center',
            wordWrap: { width: w - 30 }
        }).setOrigin(0.5, 0);
        card.add(roleText);

        return card;
    }

    createDowdingPage(width, height) {
        const page = this.add.container(0, 0);

        const heading = this.add.text(width / 2, 45, 'THE DOWDING SYSTEM', {
            fontSize: '30px',
            fill: '#e8a317',
            fontFamily: 'Courier New',
            fontStyle: 'bold',
            stroke: '#3a2210',
            strokeThickness: 6
        }).setOrigin(0.5);
        page.add(heading);

        this.dowdingSteps = [
            {
                title: '1. RADAR',
                caption: 'Chain Home radar stations spot enemy aircraft crossing the Channel and radio it straight to Fighter Command HQ.',
                voice: 'step1'
            },
            {
                title: '2. OBSERVER CORPS',
                caption: 'Once a raid crosses the coast, radar loses it — the Royal Observer Corps tracks it by eye and reports it onto the Tote Board.',
                voice: 'step2'
            },
            {
                title: '3. SECTOR STATIONS',
                caption: 'Sector Stations read the board and decide which squadrons to scramble to meet the raid.',
                voice: 'step3'
            },
            {
                title: '4. INTERCEPT!',
                caption: 'Squadrons climb to meet the raid before it reaches its target — the whole system, working together.',
                voice: 'step4'
            }
        ];
        this.dowdingStepIndex = 0;

        page.add(this.buildDowdingDiagram(width));

        const stepTitle = this.add.text(width / 2, 435, '', {
            fontSize: '22px',
            fill: '#2d4a6a',
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        page.add(stepTitle);

        const stepCaption = this.add.text(width / 2, stepTitle.y + 36, '', {
            fontSize: '16px',
            fill: '#3a2210',
            fontFamily: 'Courier New',
            align: 'center',
            wordWrap: { width: width - 160 }
        }).setOrigin(0.5, 0);
        page.add(stepCaption);

        const dotsY = 590;
        const dots = this.dowdingSteps.map((_, i) => {
            const dot = this.add.circle(width / 2 - 45 + i * 30, dotsY, 6, 0xcccccc, 1);
            page.add(dot);
            return dot;
        });

        this.stepTitleText = stepTitle;
        this.stepCaptionText = stepCaption;
        this.stepDots = dots;

        const backBtn = this.createButton(width / 2 - 130, height - 55, '◀ BACK', 0x8a8a8a, { width: 180 });
        const nextBtn = this.createButton(width / 2 + 130, height - 55, 'NEXT ▶', 0x2ecc71, { width: 180 });
        this.dowdingNextLabel = nextBtn.label;

        backBtn.hitZone.on('pointerdown', () => {
            if (this.dowdingStepIndex === 0) {
                this.goToPage(page, this.characterPage);
            } else {
                if (this.dowdingLineLocked) return;
                AudioManager.playSFX(this, AudioManager.manifest.sfx.buttonClick);
                this.dowdingStepIndex--;
                this.updateDowdingStepDisplay();
                this.announceDowdingStep();
            }
        });

        nextBtn.hitZone.on('pointerdown', () => {
            if (this.dowdingStepIndex >= this.dowdingSteps.length - 1) {
                AudioManager.playSFX(this, AudioManager.manifest.sfx.buttonClick);
                AudioManager.stopMusic(AudioManager.manifest.music.planeFlyby);
                // The narrator's last line can still be talking when BEGIN is
                // tapped (unlike Back/Next, this button isn't gated by
                // dowdingLineLocked) — cut it here so it doesn't keep playing
                // over DetectionScene's own bunker ambience and WAAF welcome line.
                AudioManager.stopVoice();
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('DetectionScene');
                });
            } else {
                if (this.dowdingLineLocked) return;
                AudioManager.playSFX(this, AudioManager.manifest.sfx.buttonClick);
                this.dowdingStepIndex++;
                this.updateDowdingStepDisplay();
                this.announceDowdingStep();
            }
        });

        page.add([backBtn, nextBtn]);

        // Initialise step 0's text/dots now — the voice line only plays once the
        // player actually reaches this page (see announceDowdingStep callers).
        this.updateDowdingStepDisplay();

        return page;
    }

    updateDowdingStepDisplay() {
        const step = this.dowdingSteps[this.dowdingStepIndex];
        this.stepTitleText.setText(step.title);
        this.stepCaptionText.setText(step.caption);
        this.stepTitleText.setAlpha(0);
        this.stepCaptionText.setAlpha(0);
        this.tweens.add({
            targets: [this.stepTitleText, this.stepCaptionText],
            alpha: 1,
            duration: 250
        });

        this.stepDots.forEach((dot, i) => {
            dot.setFillStyle(i === this.dowdingStepIndex ? 0xe8a317 : 0xcccccc);
        });

        const isLast = this.dowdingStepIndex === this.dowdingSteps.length - 1;
        this.dowdingNextLabel.setText(isLast ? '▶ BEGIN ▶' : 'NEXT ▶');
    }

    announceDowdingStep() {
        const step = this.dowdingSteps[this.dowdingStepIndex];
        // Locked while the narrator is still speaking so mashing Back/Next
        // can't cut a step's line off partway through — unlocked by
        // playVoice's onComplete, which fires immediately if that step has
        // no audio file yet, so playback without narration isn't slowed.
        this.dowdingLineLocked = true;
        AudioManager.playVoice(this, AudioManager.manifest.voice.dowdingNarrator[step.voice], {}, () => {
            this.dowdingLineLocked = false;
        });
    }
}
