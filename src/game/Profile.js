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

        this.game.state.bestStreak = this.getBestStreak(newId);
        this.game.bestStreakDisplay.textContent = this.game.state.bestStreak;
        this.game.leaderboard.render();
    }

    migrateProfile(oldId, newId, name) {
        if (!oldId || oldId === newId) return;

        const lb = JSON.parse(localStorage.getItem('leaderboard') || '{}');
        const bt = JSON.parse(localStorage.getItem('bestTimes') || '{}');

        if (lb[oldId]) {
            lb[newId] = {
                name,
                streak: Math.max(lb[oldId].streak, lb[newId]?.streak ?? 0)
            };
            delete lb[oldId];
            localStorage.setItem('leaderboard', JSON.stringify(lb));
        }

        if (bt[oldId]) {
            const oldTime = parseFloat(bt[oldId].best);
            const newTime = parseFloat(bt[newId]?.best ?? Infinity);
            bt[newId] = {
                name,
                best: Math.min(oldTime, newTime)
            };
            delete bt[oldId];
            localStorage.setItem('bestTimes', JSON.stringify(bt));
        }
    }

    load() {
        const name = localStorage.getItem('username') || 'Anonymous';
        this.display.textContent = `Player: ${name}`;

        sha256(name.toLowerCase()).then((id) => {
            const oldId = localStorage.getItem('userId');
            this.migrateProfile(oldId, id, name);
            this.game.state.userId = id;
            localStorage.setItem('userId', id);
            localStorage.setItem('username', name);

            this.game.state.bestStreak = this.getBestStreak(id);
            this.game.bestStreakDisplay.textContent = this.game.state.bestStreak;
        });

        document.querySelector('.game-container').prepend(this.display);
    }

    getBestStreak(userId) {
        const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '{}');
        return leaderboard[userId]?.streak ?? 0;
    }
}
