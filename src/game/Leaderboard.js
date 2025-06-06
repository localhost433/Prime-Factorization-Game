import { supabase, LEADERBOARD_TABLE } from '../utils/supabase.js';

export class Leaderboard {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.list = document.getElementById('leaderboardItems');
        if (!this.list) {
            console.warn('Leaderboard element with id "leaderboardItems" not found.');
        }
    }

    getCurrentKey() {
        return this.game.state.currentDifficulty || 'easy';
    }

    async recordTime(rawTime) {
        const difficulty = this.getCurrentKey();
        const user_id = this.game.state.userId;
        if (!user_id) return;

        const name = localStorage.getItem('username') || 'Anonymous';
        const best_time = parseFloat(rawTime.toFixed(2));

        await supabase
            .from(LEADERBOARD_TABLE)
            .upsert(
                { user_id, difficulty, name, best_time },
                { onConflict: ['user_id', 'name'] }
            );
    }

    async saveStreak() {
        const difficulty = this.getCurrentKey();
        const user_id = this.game.state.userId;
        if (!user_id) return;

        const name = localStorage.getItem('username') || 'Anonymous';
        const streak = this.game.state.streaks?.[difficulty] || 0;

        await supabase
            .from(LEADERBOARD_TABLE)
            .upsert(
                { user_id, difficulty, name, streak },
                { onConflict: ['user_id', 'name'] }
            );
    }

    async render() {
        const difficulty = this.getCurrentKey();
        const { data, error } = await supabase
            .from(LEADERBOARD_TABLE)
            .select('name, streak, best_time')
            .eq('difficulty', difficulty)
            .order('streak', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Error loading leaderboard:', error);
            return;
        }

        if (this.list) {
            this.list.innerHTML = data
                .map(e =>
                    `<li>${this.escape(e.name)}: ${e.streak} (Best Time: ${e.best_time?.toFixed(2) ?? '—'})</li>`
                )
                .join('');
        }
    }

    async getBestStreak(userId) {
        const difficulty = this.getCurrentKey();
        const { data, error } = await supabase
            .from(LEADERBOARD_TABLE)
            .select('streak')
            .eq('user_id', userId)
            .eq('difficulty', difficulty)
            .maybeSingle();

        if (error || !data) {
            if (error) {
                console.error('Error fetching best streak:', error);
            }
            return 0;
        }
        return data.streak ?? 0;
    }

    escape(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}