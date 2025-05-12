
async function sha256(str) {
    if (!window.crypto?.subtle) return str;
    const data = new TextEncoder().encode(str);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)]
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

class Game {
    constructor() {
        // State
        this.state = {
            currentNumber: null,
            originalNumber: null,
            streak: 0,
            bestStreak: 0,
            difficultyRange: { min: 20, max: 100 },
            startTime: 0,
            timerId: null,
            elapsed: 0
        };
        this.state.currentDifficulty = null;
        this.state.userId = null;

        // DOM Elements
        this.usernameDisplay = document.createElement("div");
        this.numberDisplay = document.getElementById('numberDisplay');
        this.userInput = document.getElementById('userInput');
        this.streakDisplay = document.getElementById('streak');
        this.bestStreakDisplay = document.getElementById('bestStreak');
        this.feedback = document.getElementById('feedback');
        this.toggleLeaderboardButton = document.getElementById('toggleLeaderboard');
        this.clearLeaderboardButton = document.getElementById('clearLeaderboard');
        this.leaderboardList = document.getElementById('leaderboardList');
        this.leaderboardItems = document.getElementById('leaderboardItems');
        this.switchButtons = Array.from(document.querySelectorAll('.switch > button'));
        [this.beginnerSwitch,
            this.easySwitch,
            this.mediumSwitch,
            this.hardSwitch,
            this.extremeSwitch,
            this.darkSwitch] = this.switchButtons;
        this.modal = document.getElementById('tutorialModal');
        this.closeBtn = document.getElementById('closeTutorial');
        this.showBtn = document.getElementById('showTutorial');
        this.roundTimer = document.getElementById('roundTimer');

        // Username Element Setup
        this.setupUsernameDisplay();

        // Insert username display
        document.querySelector(".game-container").prepend(this.usernameDisplay);
    }

    setupUsernameDisplay() {
        this.usernameDisplay.textContent = "Player: Anonymous";
        this.usernameDisplay.style.fontSize = "1.2rem";
        this.usernameDisplay.style.marginBottom = "10px";
        this.usernameDisplay.style.cursor = "pointer";
        this.usernameDisplay.style.borderBottom = "1px dashed transparent";
        this.usernameDisplay.style.transition = "border-bottom 0.3s";

        this.usernameDisplay.addEventListener("mouseenter", () => {
            this.usernameDisplay.style.borderBottom = "1px dashed var(--text-color)";
        });

        this.usernameDisplay.addEventListener("mouseleave", () => {
            this.usernameDisplay.style.borderBottom = "1px dashed transparent";
        });

        this.usernameDisplay.addEventListener("click", () => {
            const input = document.createElement("input");
            input.type = "text";
            input.value = this.usernameDisplay.textContent.replace("Player: ", "");
            input.style.fontSize = "1.2rem";
            input.style.marginBottom = "10px";
            input.style.textAlign = "center";
            input.style.border = `1px solid var(--text-color)`;
            input.style.borderRadius = "5px";
            input.style.backgroundColor = "transparent";
            input.style.color = "var(--text-color)";
            this.usernameDisplay.replaceWith(input);
            input.focus();

            input.addEventListener('blur', () => {
                const newName = input.value.trim() || "Anonymous";
                sha256(newName.toLowerCase()).then(hash => {
                    this.state.userId = hash;
                    this.usernameDisplay.textContent = `Player: ${newName}`;
                    this.state.bestStreak = this.getBestStreak(hash);
                    this.bestStreakDisplay.textContent = this.state.bestStreak;
                    this.updateLeaderboardDisplay();
                });
                input.replaceWith(this.usernameDisplay);
            });

            input.addEventListener("keypress", (event) => {
                if (event.key === "Enter") input.blur();
            });
        });
    }

    init() {
        // Default theme
        document.body.dataset.theme = 'light';

        // Event listeners
        this.setupEventListeners();

        // Show tutorial on first visit
        if (!localStorage.getItem('hasSeenTutorial')) {
            this.modal.classList.remove('hidden');
            localStorage.setItem('hasSeenTutorial', 'true');
        }

        // Initialize scoreboard
        this.updateLeaderboardDisplay();

        // Default difficulty
        this.setDifficulty('easy');
    }

    setupEventListeners() {
        const darkSwitch = this.switchButtons.at(-1);
        darkSwitch.addEventListener('click', () => {
            const isDark = document.body.dataset.theme === 'dark';
            document.body.dataset.theme = isDark ? 'light' : 'dark';
            this.darkSwitch.classList.toggle('active', !isDark);
        });

        this.userInput.addEventListener('focus', () => {
            this.userInput.scrollIntoView({ block: 'center' });
        });

        this.userInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                this.handleUserInput();
            }
        });

        this.toggleLeaderboardButton.addEventListener('click', () => {
            const isHidden = this.leaderboardList.style.display === 'none';
            this.leaderboardList.style.display = isHidden ? 'block' : 'none';
            this.toggleLeaderboardButton.textContent = isHidden ? 'Hide Leaderboard' : 'Show Leaderboard';
        });

        this.clearLeaderboardButton.addEventListener('click', () => {
            localStorage.removeItem('leaderboard');
            this.leaderboardItems.innerHTML = '';
        });

        [this.beginnerSwitch, this.easySwitch, this.mediumSwitch, this.hardSwitch, this.extremeSwitch].forEach((switchElement, index) => {
            const levels = ['beginner', 'easy', 'medium', 'hard', 'extreme'];
            switchElement.addEventListener('click', () => this.setDifficulty(levels[index]));
        });

        this.showBtn.addEventListener('click', () => this.modal.classList.remove('hidden'));
        this.closeBtn.addEventListener('click', () => this.modal.classList.add('hidden'));
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) this.modal.classList.add('hidden');
        });
    }

    handleUserInput() {
        if (!this.firstInputGiven) {
            this.firstInputGiven = true;
            this.state.startTime = performance.now();
            this.startGhostTimer();
        }
        
        const input = this.userInput.value.trim();

        // Disallow blank submissions unless the current number is 1 or prime
        if (!input) {
            if (this.state.currentNumber === 1 || this.isPrime(this.state.currentNumber)) {
                this.feedback.textContent = "Correct! It's a prime.";
                const fullFactorization = this.calculateFullFactorization(this.state.originalNumber);
                this.feedback.textContent += ` Full factorization: ${fullFactorization}<br>${this.state.originalNumber} = ${fullFactorization.replace(/ × /g, ' * ')}`;
                this.state.streak++;
                this.recordTime();
                this.stopGhostTimer();
                setTimeout(() => this.startNewRound(), 500);
            } else {
                this.feedback.textContent = "Blank entry not allowed for non-prime numbers.";
                return;
            }
        } else {
            const match = input.match(/^\d+$/);
            if (match) {
                const factor = parseInt(input, 10);
                if (this.state.currentNumber % factor === 0 && this.isPrime(factor)) {
                    while (this.state.currentNumber % factor === 0) {
                        this.state.currentNumber /= factor;
                    }
                    this.updateNumberDisplay();
                    this.feedback.textContent = `Correct! Fully factorized by ${factor}.`;

                    if (this.state.currentNumber === 1) {
                        const fullFactorization = this.calculateFullFactorization(this.state.originalNumber);
                        this.feedback.textContent += ` Full factorization: ${fullFactorization}<br>${this.state.originalNumber} = ${fullFactorization.replace(/ × /g, ' * ')}`;
                        this.state.streak++;
                        this.recordTime();
                        this.stopGhostTimer();
                        setTimeout(() => this.startNewRound(), 1000);
                    }
                } else {
                    this.feedback.textContent = "Incorrect. Streak reset!";
                    this.state.streak = 0;
                }
            } else {
                this.feedback.textContent = "Invalid input. Enter a prime.";
            }
        }

        this.userInput.value = "";
        this.updateStats();
    }

    startGhostTimer() {
        this.state.elapsed = 0;
        this.roundTimer.textContent = '0.00 s';
        this.state.timerId = setInterval(() => {
            this.state.elapsed = (performance.now() - this.state.startTime) / 1000;
            this.roundTimer.textContent = this.state.elapsed.toFixed(2) + ' s';
        }, 50);
    }

    stopGhostTimer() {
        if (this.state.timerId !== null) {
            clearInterval(this.state.timerId);
            this.state.timerId = null;
        }
    }

    resetGhostTimer() {
        this.stopGhostTimer();
        this.startGhostTimer();
    }

    startNewRound() {
        const { min, max } = this.state.difficultyRange;
        this.state.originalNumber = this.generateRandomNumber(min, max);
        this.state.currentNumber = this.state.originalNumber;
        this.state.startTime = 0;
        this.updateNumberDisplay();
        this.feedback.innerHTML = "Factorize the number or press 'Enter' if it's prime!";
        this.firstInputGiven = false;
    }

    updateNumberDisplay() {
        this.numberDisplay.textContent = this.state.currentNumber === 1 ? " " : this.state.currentNumber;
    }

    setDifficulty(level) {
        if (this.state.currentDifficulty === level) {
            this.state.currentDifficulty = null;

            [this.beginnerSwitch, this.easySwitch, this.mediumSwitch, this.hardSwitch, this.extremeSwitch].forEach(switchElement => {
                switchElement.classList.remove('active');
                switchElement.setAttribute('aria-pressed', false);
            });
            return;
        }

        this.state.currentDifficulty = level;

        [this.beginnerSwitch, this.easySwitch, this.mediumSwitch, this.hardSwitch, this.extremeSwitch].forEach(switchElement => {
            switchElement.classList.remove('active');
            switchElement.setAttribute('aria-pressed', false);
        });

        // Difficulty ranges
        const ranges = {
            beginner: { min: 2, max: 29 },
            easy: { min: 30, max: 99 },
            medium: { min: 100, max: 999 },
            hard: { min: 1000, max: 9999 },
            extreme: { min: 10000, max: 100000 }
        };
        this.state.difficultyRange = ranges[level];

        switch (level) {
            case 'beginner':
                this.beginnerSwitch.classList.add('active');
                this.beginnerSwitch.setAttribute('aria-pressed', true);
                break;
            case 'easy':
                this.easySwitch.classList.add('active');
                this.easySwitch.setAttribute('aria-pressed', true);
                break;
            case 'medium':
                this.mediumSwitch.classList.add('active');
                this.mediumSwitch.setAttribute('aria-pressed', true);
                break;
            case 'hard':
                this.hardSwitch.classList.add('active');
                this.hardSwitch.setAttribute('aria-pressed', true);
                break;
            case 'extreme':
                this.extremeSwitch.classList.add('active');
                this.extremeSwitch.setAttribute('aria-pressed', true);
                break;
        }

        this.startNewRound();
    }

    async updateStats() {
        this.streakDisplay.textContent = this.state.streak;
        const username = this.usernameDisplay.textContent.replace('Player: ', '') || "Anonymous";
        this.state.bestStreak = Math.max(this.state.bestStreak, this.state.streak);
        this.saveBestStreak(this.state.streak);
        this.bestStreakDisplay.textContent = this.getBestStreak(this.state.userId);
    }

    generateRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    isPrime(num) {
        if (num < 2) return false;
        for (let i = 2; i <= Math.sqrt(num); i++) {
            if (num % i === 0) return false;
        }
        return true;
    }

    calculateFullFactorization(num) {
        let copy = num;
        const factors = [];
        let divisor = 2;

        while (copy > 1) {
            let count = 0;
            while (copy % divisor === 0) {
                copy /= divisor;
                count++;
            }
            if (count > 0) factors.push(count > 1 ? `${divisor}^${count}` : `${divisor}`);
            divisor++;
        }

        return factors.join(' × ');
    }

    recordTime() {
        if (!this.state.userId) return;

        const finalTime = this.state.elapsed.toFixed(2);
        const username = this.usernameDisplay.textContent.replace('Player: ', '') || 'Anonymous';

        const bestTimes = JSON.parse(localStorage.getItem('bestTimes') || '{}');

        const entry = bestTimes[this.state.userId] || { name: username, best: Infinity };
        if (finalTime < entry.best) entry.best = finalTime;
        entry.name = username;

        bestTimes[this.state.userId] = entry;
        localStorage.setItem('bestTimes', JSON.stringify(bestTimes));
    }

    updateLeaderboardDisplay() {
        const streaks = JSON.parse(localStorage.getItem('leaderboard') || '{}'); // { userId : { name, streak } }
        const bestTimes = JSON.parse(localStorage.getItem('bestTimes') || '{}'); // { userId : { name, best  } }

        const allIds = new Set([...Object.keys(streaks), ...Object.keys(bestTimes)]);

        const rows = [...allIds].map(id => {
            const s = streaks[id] ?? { name: bestTimes[id]?.name ?? 'Anonymous', streak: 0 };
            const t = bestTimes[id] ?? { name: s.name, best: '—' };
            return { name: s.name, streak: s.streak, time: t.best };
        })
            .sort((a, b) => b.streak - a.streak)
            .slice(0, 5);

        this.leaderboardItems.innerHTML = rows
            .map(r => `<li>${this.escapeHTML(r.name)}: ${r.streak} (Best Time: ${r.time})</li>`)
            .join('');
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    saveBestStreak(streak) {
        // Only accept if the current number has truly been reduced to 1
        if (this.state.currentNumber !== 1) return;

        // No saving for anonymous users
        if (!this.state.userId) return;

        const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '{}');

        // Each entry is { name, streak }
        const current = leaderboard[this.state.userId]?.streak ?? 0;
        const playerName = this.usernameDisplay.textContent.replace('Player: ', '');
        leaderboard[this.state.userId] = { name: playerName, streak: Math.max(current, streak) };

        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
        this.updateLeaderboardDisplay();
    }

    getBestStreak(userId) {
        const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '{}');
        return leaderboard[userId]?.streak ?? 0;
    }
}

// Create and start the game
const game = new Game();
game.init();