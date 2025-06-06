// src/game/Difficulty.js

export class Difficulty {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.ranges = {
            beginner: { min: 2, max: 29 },
            easy:     { min: 30, max: 99 },
            medium:   { min: 100, max: 999 },
            hard:     { min: 1000, max: 9999 },
            extreme:  { min: 10000, max: 100000 }
        };

        this.buttons = {
            beginner: document.getElementById('beginnerSwitch'),
            easy:     document.getElementById('easySwitch'),
            medium:   document.getElementById('mediumSwitch'),
            hard:     document.getElementById('hardSwitch'),
            extreme:  document.getElementById('extremeSwitch')
        };

        this.attachEvents();
    }

    attachEvents() {
        Object.entries(this.buttons).forEach(([level, btn]) => {
            btn.addEventListener('click', () => this.set(level));
            btn.addEventListener('keydown', (e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    this.set(level);
                }
            });
        });
    }

    async set(level) {
        if (this.game.state.currentDifficulty === level) return;

        // Reset all switches
        Object.values(this.buttons).forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-checked', 'false');
            btn.setAttribute('aria-pressed', 'false');
        });

        // Activate selected
        const btn = this.buttons[level];
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');
        btn.setAttribute('aria-pressed', 'true');

        // Update game state
        this.game.state.currentDifficulty   = level;
        this.game.state.difficultyRange     = this.ranges[level];

        // Refresh leaderboard and best streak for this difficulty
        await this.game.updateDifficultyDisplay();

        // Start a new round with the updated range
        this.game.startNewRound();
    }
}
