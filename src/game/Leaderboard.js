// src/game/Leaderboard.js

export class Leaderboard {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.list = document.getElementById('leaderboardItems');
    }

    getCurrentKey() {
        return this.game.state.currentDifficulty || 'easy';
    }

    recordTime(time) {
        const uid = this.game.state.userId;
        if (!uid) return;
        const difficulty = this.getCurrentKey();
        const username = localStorage.getItem('username') || 'Anonymous';

        const allTimes = JSON.parse(localStorage.getItem('bestTimes') || '{}');
        if (!allTimes[difficulty]) allTimes[difficulty] = {};

        let entry = allTimes[difficulty][uid];
        if (!entry) {
            entry = { name: username, best: time };
        } else {
            const prev = parseFloat(entry.best);
            if (!isNaN(prev) && time < prev) {
                entry.best = time;
            }
            entry.name = username;
        }

        allTimes[difficulty][uid] = entry;
        localStorage.setItem('bestTimes', JSON.stringify(allTimes));
    }

    saveStreak() {
        const uid = this.game.state.userId;
        if (!uid) return;
        const difficulty = this.getCurrentKey();

        const allBoards = JSON.parse(localStorage.getItem('leaderboard') || '{}');
        if (!allBoards[difficulty]) allBoards[difficulty] = {};

        const name = localStorage.getItem('username') || 'Anonymous';
        const streak = this.game.state.streak;
        const prev = allBoards[difficulty][uid]?.streak ?? 0;

        if (streak > prev) {
            allBoards[difficulty][uid] = { name, streak };
        } else if (allBoards[difficulty][uid] && allBoards[difficulty][uid].name !== name) {
            allBoards[difficulty][uid].name = name;
        } else {
            return;
        }

        localStorage.setItem('leaderboard', JSON.stringify(allBoards));
        this.render();
    }

    render() {
        const difficulty = this.getCurrentKey();
        const streaks = JSON.parse(localStorage.getItem('leaderboard') || '{}')[difficulty] || {};
        const bestTimes = JSON.parse(localStorage.getItem('bestTimes') || '{}')[difficulty] || {};

        const allIds = new Set([...Object.keys(streaks), ...Object.keys(bestTimes)]);

        const entries = [...allIds].map(id => {
            const s = streaks[id] ?? { name: bestTimes[id]?.name ?? 'Anonymous', streak: 0 };
            const t = bestTimes[id] ?? { name: s.name, best: '—' };
            const time = typeof t.best === 'number' ? t.best.toFixed(2) : t.best;
            return { name: s.name, streak: s.streak, time };
        })
            .sort((a, b) => b.streak - a.streak)
            .slice(0, 5);

        this.list.innerHTML = entries.map(e =>
            `<li>${this.escape(e.name)}: ${e.streak} (Best Time: ${e.time})</li>`
        ).join('');
    }

    getBestStreak(userId) {
        const difficulty = this.getCurrentKey();
        const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '{}');
        return leaderboard[difficulty]?.[userId]?.streak ?? 0;
    }

    escape(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}
