class ToteBoardScene extends BaseGameScene {
    constructor() {
        super('ToteBoardScene');
    }

    preload() {
        // Load the tote board background image
        this.load.image('tote-board', 'assets/images/toteboard.png');
        this.load.image('waaf-mascot-bust', 'assets/images/waaf-mascot-bust.png');
    }

    create() {
        const { width, height } = this.scale;

        // ---------- BACKGROUND ----------
        this.createMapBackground(width, height, 'tote-board', (w, h) => {
            const bg = this.add.graphics();
            bg.fillStyle(0x0d1b2a);
            bg.fillRect(0, 0, w, h);
            bg.lineStyle(2, 0xf5e56b, 0.3);
            bg.strokeRoundedRect(40, 40, w - 80, h - 80, 16);
        });

        // ---------- TOP BAR UI ----------
        this.createTopBar('TOTE BOARD');

        // ---------- STATE MACHINE VARIABLES ----------
        this.states = ['Available', 'Ordered to Readiness', 'Left Ground'];
        // Maps each state to the suffix used in the recorded call-out voice
        // keys (e.g. 'Ordered to Readiness' -> toteTapReadiness).
        this.stateVoiceSuffix = {
            'Available': 'Available',
            'Ordered to Readiness': 'Readiness',
            'Left Ground': 'LeftGround'
        };
        this.currentStateIndex = 0;          // Which state is currently highlighted
        this.targetState = '';               // The state the player must tap
        this.maxRounds = 5;
        this.baseTimerDelay = 2000;          // Starts at 2 seconds
        this.timerDelay = this.baseTimerDelay;
        this.timerEvent = null;
        this.isWaitingForTap = false;
        this.gameOver = false;

        // ---------- WAAF DIALOGUE BOX ----------
        this.createDialogueBox(width, height);

        // WAAF Portrait — same standard corner badge as Keith Park/Ludwik/
        // DetectionScene, nudged up slightly (height-210) to keep the label
        // clear of the dialogue box now that the circle is bigger (radius 60,
        // was 40). The state panels end at x:760, y:390 at this canvas size,
        // so this spot is clear of them.
        this.createPortraitBadge(width - 110, height - 210, {
            radius: 60,
            textureKey: 'waaf-mascot-bust',
            fallbackText: 'WAAF',
            fallbackFontSize: '14px',
            fallbackFill: '#fff',
            nameLabel: 'WAAF',
            sizing: { fitToCircle: true },
            labelGap: 15
        });

        // Dialogue text
        this.dialogueText = this.add.text(110, height - 100, 'Tote board live. Watch the states — squadrons don\'t just sit ready.', {
            fontSize: '17px',
            fill: '#c8e6c9',
            fontFamily: 'Courier New',
            fontStyle: 'italic',
            wordWrap: { width: width - 120 }
        });

        // ---------- STATE PANELS ----------
        const panelWidth = 180;
        const panelHeight = 120;
        const panelY = height / 2 - 80;
        const spacing = 40;
        const totalWidth = this.states.length * panelWidth + (this.states.length - 1) * spacing;
        const startX = (width - totalWidth) / 2;

        this.panelObjects = [];

        this.states.forEach((state, index) => {
            const x = startX + index * (panelWidth + spacing);
            const panel = this.add.graphics();

            // Default dark panel
            panel.fillStyle(0x1a2a3a, 0.9);
            panel.fillRoundedRect(x, panelY, panelWidth, panelHeight, 12);
            panel.lineStyle(2, 0x4a6a8a, 0.6);
            panel.strokeRoundedRect(x, panelY, panelWidth, panelHeight, 12);

            // ---- MAKE PANEL TAPPABLE ----
            panel.setInteractive(
                new Phaser.Geom.Rectangle(x, panelY, panelWidth, panelHeight),
                Phaser.Geom.Rectangle.Contains
            );
            panel.on('pointerdown', () => this.handlePanelTap(index));

            // State label
            const label = this.add.text(x + panelWidth / 2, panelY + 50, state, {
                fontSize: '20px',
                fill: '#b0c4de',
                fontFamily: 'Courier New',
                fontStyle: 'bold',
                align: 'center',
                wordWrap: { width: panelWidth - 24 }
            }).setOrigin(0.5);

            // Store references
            this.panelObjects.push({
                x: x,
                y: panelY,
                width: panelWidth,
                height: panelHeight,
                label: label,
                state: state,
                index: index,
                graphics: panel,
                isHighlighted: false
            });
        });

        // ---------- START THE FIRST ROUND ----------
        // Wait for the intro line to finish before round 1's own call-out
        // starts — only one voice line plays at a time, so starting the
        // round immediately could silently skip its call-out (still busy
        // with the intro) and open up tapping before any state's announced.
        this.currentRound = 0;
        this.playWaafLine(AudioManager.manifest.voice.waaf.toteIntro, () => this.startRound());

        // ---------- FALLBACK TIMEOUT ----------
        this.time.delayedCall(30000, () => {
            if (!this.gameOver) {
                console.warn('ToteBoard timed out – forcing transition to DecisionScene');
                this.scene.start('DecisionScene');
            }
        });
    }

    // Shared panel-redraw for every state (default/highlighted/correct/wrong/
    // missed) — only the fill/stroke color and alpha actually differ between
    // call sites, this used to be a 5-statement copy-paste block at each one.
    redrawPanel(panel, { fillColor, fillAlpha = 0.9, strokeColor, strokeWidth = 2, strokeAlpha = 1.0 }) {
        panel.graphics.clear();
        panel.graphics.fillStyle(fillColor, fillAlpha);
        panel.graphics.fillRoundedRect(panel.x, panel.y, panel.width, panel.height, 12);
        panel.graphics.lineStyle(strokeWidth, strokeColor, strokeAlpha);
        panel.graphics.strokeRoundedRect(panel.x, panel.y, panel.width, panel.height, 12);
    }

    // ---------- HIGHLIGHT PANEL ----------
    highlightPanel(index) {
        const panel = this.panelObjects[index];
        if (!panel) return;

        this.clearHighlights();

        this.redrawPanel(panel, { fillColor: 0x2a4a3a, strokeColor: 0xf5e56b, strokeWidth: 4 });
        panel.label.setFill('#f5e56b');
        panel.isHighlighted = true;
    }

    // ---------- CLEAR HIGHLIGHTS ----------
    clearHighlights() {
        this.panelObjects.forEach((panel) => {
            this.redrawPanel(panel, { fillColor: 0x1a2a3a, strokeColor: 0x4a6a8a, strokeWidth: 2, strokeAlpha: 0.6 });
            panel.label.setFill('#b0c4de');
            panel.isHighlighted = false;
        });
    }

    // ---------- START A NEW ROUND ----------
    startRound() {
        if (this.gameOver) return;

        // Choose a random state to highlight
        const randomIndex = Phaser.Math.Between(0, this.states.length - 1);
        this.targetState = this.states[randomIndex];
        this.targetIndex = randomIndex;

        // Highlight the target
        this.clearHighlights();
        this.highlightPanel(randomIndex);

        // WAAF call-out — each phrasing has its own recording per state (no
        // state name spliced into audio), so the text and voice key both key
        // off the same phrasing/state pair.
        const callPhrasings = [
            { voiceKey: 'Tap', text: `"Tap the board when it says: ${this.targetState}!"` },
            { voiceKey: 'There', text: `"There, ${this.targetState}. Tap it!"` },
            { voiceKey: 'Sharp', text: `"Look sharp — ${this.targetState} now!"` },
            { voiceKey: 'Thats', text: `"That's the one — ${this.targetState}. Go!"` }
        ];
        const phrasing = callPhrasings[Phaser.Math.Between(0, callPhrasings.length - 1)];
        this.dialogueText.setText(phrasing.text);
        const voiceEntry = AudioManager.manifest.voice.waaf['tote' + phrasing.voiceKey + this.stateVoiceSuffix[this.targetState]];
        this.playWaafLine(voiceEntry);

        // Tappable immediately, same as her line playing — only the opening
        // "Tote board live..." line gates anything (see create()'s call into
        // this for round 1). Waiting for every round's own call-out to finish
        // before opening tapping made the reaction timer start fresh right
        // after she stopped talking every time, which made a miss/wrong tap
        // basically impossible.
        this.isWaitingForTap = true;
        this.roundComplete = false;

        if (this.timerEvent) {
            this.timerEvent.remove();
        }

        // The difficulty ramp (this.timerDelay shrinking each round) still
        // applies, but a round never runs shorter than the call-out actually
        // takes to say — otherwise the timer could expire mid-line.
        const roundDelay = AudioManager.voiceAwareDelay(this, voiceEntry, this.timerDelay);
        this.timerEvent = this.time.delayedCall(roundDelay, () => {
            if (this.isWaitingForTap && !this.roundComplete) {
                this.handleMissedTap();
            }
        });
    }

    // Shared "what happens after a round resolves" — called once the
    // correct/wrong-tap reaction line (handlePanelTap) or the missed-tap
    // line (handleMissedTap) has had time to finish.
    advanceRound() {
        this.currentRound++;
        if (this.currentRound >= this.maxRounds) {
            this.gameOver = true;
            this.dialogueText.setText('"Tote board complete. Well done. Now to the decision room."');
            const completeVoice = AudioManager.manifest.voice.waaf.toteComplete;
            this.playWaafLine(completeVoice);
            this.time.delayedCall(AudioManager.voiceAwareDelay(this, completeVoice, 2000), () => {
                this.scene.start('DecisionScene');
            });
            return;
        }
        this.timerDelay = Math.max(500, this.timerDelay - 200);
        this.startRound();
    }

    // ---------- HANDLE PLAYER TAP ----------
    handlePanelTap(index) {
        if (!this.isWaitingForTap || this.roundComplete || this.gameOver) return;

        AudioManager.playSFX(this, AudioManager.manifest.sfx.buttonClick);

        this.roundComplete = true;
        this.isWaitingForTap = false;

        if (this.timerEvent) {
            this.timerEvent.remove();
        }

        let reactionVoice;
        const panel = this.panelObjects[index];
        // Extra bit of juice on top of the panel color flash below — a quick
        // scale-pop on the label reads as more of a "hit" than a flat color
        // change alone.
        this.tweens.add({ targets: panel.label, scale: 1.15, duration: 120, yoyo: true });
        if (index === this.targetIndex) {
            // ---- CORRECT TAP ----
            this.tweens.add({
                targets: panel.graphics,
                alpha: 0.3,
                duration: 120,
                yoyo: true,
                onStart: () => this.redrawPanel(panel, { fillColor: 0x44ff44, strokeColor: 0x44ff44, strokeWidth: 4 })
            });
            this.dialogueText.setText('"Got it! Right on the money."');
            reactionVoice = AudioManager.manifest.voice.waaf.toteCorrect;
            this.playWaafLine(reactionVoice);
        } else {
            // ---- WRONG PANEL TAPPED ----
            this.tweens.add({
                targets: panel.graphics,
                alpha: 0.3,
                duration: 120,
                yoyo: true,
                onStart: () => this.redrawPanel(panel, { fillColor: 0xff4444, strokeColor: 0xff4444, strokeWidth: 4 })
            });
            this.dialogueText.setText('"Wrong board — that wasn\'t the right state."');
            reactionVoice = AudioManager.manifest.voice.waaf.toteWrong;
            this.playWaafLine(reactionVoice);
        }

        // Move to next round once the reaction line has had time to finish.
        this.time.delayedCall(AudioManager.voiceAwareDelay(this, reactionVoice, 1200), () => {
            this.advanceRound();
        });
    }

    // ---------- HANDLE MISSED TAP ----------
    handleMissedTap() {
        if (this.roundComplete) return;
        if (this.gameOver) return;

        this.isWaitingForTap = false;

        // Flash correct panel red
        const panel = this.panelObjects[this.targetIndex];
        if (panel) {
            this.tweens.add({
                targets: panel.graphics,
                alpha: 0.3,
                duration: 150,
                yoyo: true,
                repeat: 1,
                onStart: () => this.redrawPanel(panel, { fillColor: 0xff4444, strokeColor: 0xff4444, strokeWidth: 4 }),
                onComplete: () => {
                    this.highlightPanel(this.targetIndex);
                }
            });
        }

        this.dialogueText.setText('"Missed it. That state just changed. We\'ll catch the next one."');
        const missedVoice = AudioManager.manifest.voice.waaf.toteMissed;
        this.playWaafLine(missedVoice);

        // Move to next round once the "missed it" line has had time to finish.
        this.time.delayedCall(AudioManager.voiceAwareDelay(this, missedVoice, 1500), () => {
            this.advanceRound();
        });
    }
}
