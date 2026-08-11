// Shared building blocks for the "plotting table" scenes (DetectionScene,
// DecisionScene, InterceptScene, ToteBoardScene). Each of these was
// reimplementing the same map background, grid, dialogue box, top-bar label,
// and character portrait badge by copy-paste; this pulls that into one place
// so a layout tweak only needs to happen once. IntroScene and DebugMenuScene
// intentionally don't extend this — their layouts aren't part of this
// duplicated pattern.
class BaseGameScene extends Phaser.Scene {
    // `fallbackRenderer(width, height)` lets a caller supply its own fallback
    // art (e.g. ToteBoardScene's plain dark panel) instead of the default
    // coastline sketch below, while still sharing the texture-exists check.
    createMapBackground(width, height, imageKey = 'map', fallbackRenderer) {
        if (this.textures.exists(imageKey)) {
            this.add.image(width / 2, height / 2, imageKey).setDisplaySize(width, height);
            console.log('✅ Using mapbackground.png');
        } else {
            console.log('❌ map not found – using drawn fallback');
            if (fallbackRenderer) {
                fallbackRenderer(width, height);
                return;
            }
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
            startHidden = false,
            replayable = false
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
                // "Cover" the circle's bounding box (like CSS object-fit:cover)
                // rather than fitting inside it — otherwise a source image
                // whose content doesn't fill its own frame symmetrically (most
                // of these portraits) leaves visible gaps on one axis. The
                // geometry mask below then crops the excess to a clean circle
                // instead of showing the image's square corners past the ring.
                const fitSize = radius * 2;
                portrait.setScale(Math.max(fitSize / portrait.width, fitSize / portrait.height));
            } else if (sizing.matchWidth) {
                portrait.setScale(sizing.matchWidth / portrait.width);
            } else {
                portrait.setScale(sizing.scale != null ? sizing.scale : 0.15);
            }
            // Clip to the badge circle exactly — without this, any portrait
            // bigger than the circle (which "cover" sizing guarantees, and
            // fixed/matchWidth scales often are too) just overlaps the ring
            // as a visible rectangle instead of sitting inside it.
            //
            // Masking against circleBg itself (rather than a dedicated shape)
            // used to let the portrait peek ~1.5px past the true radius —
            // circleBg's stroke is centred ON the radius, so its outer edge
            // (and therefore the masked-in region) actually sits at
            // radius + half the line width, not at radius. A separate,
            // fill-only, exactly-radius shape closes that gap.
            const maskShape = this.add.graphics().setVisible(false);
            maskShape.fillCircle(x, y, radius);
            portrait.setMask(maskShape.createGeometryMask());
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

        // Tap the badge to hear that character's last line again — a plain
        // invisible zone rather than making the circle/portrait/label each
        // interactive individually.
        if (replayable) {
            const tapZone = this.add.zone(x, y, radius * 2, radius * 2)
                .setInteractive({
                    useHandCursor: true,
                    // Zone's hit-area coordinate space is top-left-relative
                    // (0,0)-(width,height), unlike Image/Arc which are
                    // origin-relative — Circle(0,0,radius) here would center
                    // the hit circle on the zone's top-left CORNER instead of
                    // its middle, creating a huge, wrongly-placed dead zone
                    // that silently swallows clicks elsewhere on screen.
                    // Circle(radius,radius,radius) centers it correctly since
                    // the zone is exactly radius*2 wide/tall.
                    hitArea: new Phaser.Geom.Circle(radius, radius, radius),
                    hitAreaCallback: Phaser.Geom.Circle.Contains
                });
            tapZone.on('pointerdown', () => AudioManager.replayLast(this));
            elements.push(tapZone);
        }

        return elements;
    }

    // Subtle "waiting for your tap" breathing pulse — a scale tween on any
    // center-origin display object. Returns the Tween so callers can stop it
    // once the element's been interacted with.
    //
    // scaleAmount is relative to the target's current scale, not absolute —
    // every other caller sits at scale 1 so this was invisible, but
    // InterceptScene's formation planes start at ~0.11 and an absolute
    // target of 1.06 was blowing them up toward full native sprite size
    // (nearly 10x) every pulse cycle instead of a gentle breathing effect.
    addIdlePulse(target, { scaleAmount = 1.08, duration = 650 } = {}) {
        const first = Array.isArray(target) ? target[0] : target;
        const baseScale = first.scale;
        return this.tweens.add({
            targets: target,
            scale: baseScale * scaleAmount,
            duration,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // Expanding, fading ring at (x, y) — generic "you tapped here"
    // acknowledgment. Self-destroys via the tween's onComplete.
    spawnTapRipple(x, y, { color = 0xf5e56b, startRadius = 8, endRadius = 32, duration = 400 } = {}) {
        const ring = this.add.circle(x, y, startRadius, color, 0).setStrokeStyle(3, color, 0.8);
        this.tweens.add({
            targets: ring,
            radius: endRadius,
            alpha: 0,
            duration,
            onUpdate: () => ring.setStrokeStyle(3, color, 0.8 * (1 - (ring.radius - startRadius) / (endRadius - startRadius))),
            onComplete: () => ring.destroy()
        });
    }

    // Persistent "what do I do" hint — separate from character dialogue, so
    // the instruction doesn't depend on a kid catching a transient floating
    // label (e.g. the "TAP ME!" text that fades after ~2s) or parsing it out
    // of in-character flavor text. Stays up until the caller clears it once
    // the expected action actually happens. Centered top so it never
    // collides with the top-left top-bar label or the left-corner counter
    // texts InterceptScene uses.
    setActionHint(text) {
        const { width } = this.scale;
        if (!this.actionHintText) {
            this.actionHintText = this.add.text(width / 2, 52, '', {
                fontSize: '15px',
                fill: '#0d1b2a',
                backgroundColor: '#ffd700',
                fontFamily: 'Courier New',
                fontStyle: 'bold',
                padding: { x: 12, y: 6 }
            }).setOrigin(0.5).setDepth(20);
        }
        this.actionHintText.setText(text).setVisible(true);
    }

    clearActionHint() {
        if (this.actionHintText) this.actionHintText.setVisible(false);
    }

    // Quick radio-crackle burst ahead of every WAAF line — she's heard "over
    // the radio," not just narrating, so each line opens with the same
    // static hit real radio dialogue has. Shared by every scene with a WAAF
    // dialogue box (DetectionScene, ToteBoardScene, DecisionScene's handoff).
    playWaafLine(entry, onComplete) {
        AudioManager.playRadioStatic(this);
        AudioManager.playVoice(this, entry, {}, onComplete);
    }
}
