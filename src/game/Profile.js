// src/game/Profile.js

import { sha256 } from '../utils/hash.js';

export class Profile {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.display = document.createElement('div');
        this.display.style.fontSize = '1.2rem';
        this.display.style.marginBottom = '10px';
        this.display.style.cursor = 'pointer';
        this.display.style.borderBottom = '1px dashed transparent';
        this.display.style.transition = 'border-bottom 0.3s';

        this.attachEvents();
    }

    attachEvents() {
        this.display.addEventListener('mouseenter', () => {
            this.display.style.borderBottom = '1px dashed var(--text-color)';
        });
        this.display.addEventListener('mouseleave', () => {
            this.display.style.borderBottom = '1px dashed transparent';
        });
        this.display.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = this.display.textContent.replace('Player: ', '');
            input.style.fontSize = '1.2rem';
            input.style.textAlign = 'center';
            input.style.border = `1px solid var(--text-color)`;
            input.style.borderRadius = '5px';
            input.style.backgroundColor = 'transparent';
            input.style.color = 'var(--text-color)';
            this.display.replaceWith(input);
            input.focus();

            input.addEventListener('blur', () => {
                const newName = input.value.trim() || 'Anonymous';
                this.setUsername(newName);
                input.replaceWith(this.display);
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') input.blur();
            });
        });
    }

    async setUsername(name) {
        const oldId = this.game.state.userId;
        const newId = await sha256(name.toLowerCase());

        this.migrateProfile(oldId, newId, name);

        this.display.textContent = `Player: ${name}`;
        this.game.state.userId = newId;
        localStorage.setItem('userId', newId);
        localStorage.setItem('username', name);

        this.game.state.bestStreak = await this.game.leaderboard.getBestStreak(newId);
        this.game.bestStreakDisplay.textContent = this.game.state.bestStreak;
        this.game.leaderboard.render();
    }

    migrateProfile(oldId, newId, name) {
        if (!oldId || oldId === newId) return;

        const allBoards = JSON.parse(localStorage.getItem('leaderboard') || '{}');
        const allTimes = JSON.parse(localStorage.getItem('bestTimes') || '{}');

        for (const diff in allBoards) {
            if (allBoards[diff][oldId]) {
                const oldStreak = allBoards[diff][oldId].streak;
                const newStreak = allBoards[diff][newId]?.streak ?? 0;
                allBoards[diff][newId] = { name, streak: Math.max(oldStreak, newStreak) };
                delete allBoards[diff][oldId];
            }
        }

        for (const diff in allTimes) {
            if (allTimes[diff][oldId]) {
                const oldTime = parseFloat(allTimes[diff][oldId].best);
                const newTime = parseFloat(allTimes[diff][newId]?.best ?? Infinity);
                allTimes[diff][newId] = { name, best: Math.min(oldTime, newTime) };
                delete allTimes[diff][oldId];
            }
        }

        localStorage.setItem('leaderboard', JSON.stringify(allBoards));
        localStorage.setItem('bestTimes', JSON.stringify(allTimes));
    }

    load() {
        const name = localStorage.getItem('username') || 'Anonymous';
        this.display.textContent = `Player: ${name}`;

        sha256(name.toLowerCase()).then(async (id) => {
            const oldId = localStorage.getItem('userId');
            this.migrateProfile(oldId, id, name);
            this.game.state.userId = id;
            localStorage.setItem('userId', id);
            localStorage.setItem('username', name);

            this.game.state.bestStreak = await this.game.leaderboard.getBestStreak(id);
            this.game.bestStreakDisplay.textContent = this.game.state.bestStreak;
        });

        document.querySelector('.game-container').prepend(this.display);
    }
}
