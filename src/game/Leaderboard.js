// src/game/Leaderboard.js

export class Leaderboard {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.list = document.getElementById('leaderboardItems');
    }

    recordTime(time) {
        const uid = this.game.state.userId;
        if (!uid) return;
        const username = localStorage.getItem('username') || 'Anonymous';
        const bestTimes = JSON.parse(localStorage.getItem('bestTimes') || '{}');

        let entry = bestTimes[uid];
        if (!entry) {
            entry = { name: username, best: time };
        } else {
            const prev = parseFloat(entry.best);
            if (!isNaN(prev) && time < prev) {
                entry.best = time;
            }
            entry.name = username;
        }
        bestTimes[uid] = entry;
        localStorage.setItem('bestTimes', JSON.stringify(bestTimes));
    }

    saveStreak() {
        const uid = this.game.state.userId;
        if (!uid) return;

        const lb = JSON.parse(localStorage.getItem('leaderboard') || '{}');
        const name = localStorage.getItem('username') || 'Anonymous';
        const streak = this.game.state.streak;
        const prev = lb[uid]?.streak ?? 0;

        if (streak > prev) {
            lb[uid] = { name, streak };
        } else if (lb[uid] && lb[uid].name !== name) {
            lb[uid].name = name;
        } else {
            return;
        }

        localStorage.setItem('leaderboard', JSON.stringify(lb));
        this.render();
    }

    render() {
        const streaks = JSON.parse(localStorage.getItem('leaderboard') || '{}');
        const bestTimes = JSON.parse(localStorage.getItem('bestTimes') || '{}');
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

    escape(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}
