const primesUnder316 = [
        2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47,
        53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107,
        109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167,
        173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229,
        233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283,
        293, 307, 311, 313
        ];

function fnv1a32(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return ('00000000' + h.toString(16)).slice(-8);
}

function migrateProfile(oldId, newId, newName) {
    if (!oldId || oldId === newId) return;

    const lb = JSON.parse(localStorage.getItem('leaderboard') || '{}');
    const bt = JSON.parse(localStorage.getItem('bestTimes') || '{}');

    if (lb[oldId]) {
        const mergedStreak = Math.max(lb[oldId].streak, lb[newId]?.streak ?? 0);
        lb[newId] = { name: newName, streak: mergedStreak };
        delete lb[oldId];
        localStorage.setItem('leaderboard', JSON.stringify(lb));
    }

    if (bt[oldId]) {
        const mergedBest = bt[newId]
            ? Math.min(parseFloat(bt[newId].best), parseFloat(bt[oldId].best))
            : parseFloat(bt[oldId].best);
        bt[newId] = { name: newName, best: mergedBest };
        delete bt[oldId];
        localStorage.setItem('bestTimes', JSON.stringify(bt));
    }
}

async function sha256(str) {
    if (window.crypto?.subtle) {
        const buf = await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(str)
        );
        const hex = [...new Uint8Array(buf)]
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        return 'sha_' + hex;
    } else {
        return 'fnv_' + fnv1a32(str);
    }
}

class Game {
    constructor() {
        // State
        this.state = {
            currentNumber:     null,
            originalNumber:    null,
            streak:            0,
            bestStreak:        0,
            difficultyRange:   { min: 20, max: 100 },
            startTime:         0,
            timerId:           null,
            elapsed:           0,
            currentDifficulty: null
        };
        this.firstInputGiven = false;
        this.state.userId    = null;

        // DOM Elements
        this.usernameDisplay   = document.createElement("div");
        this.numberDisplay     = document.getElementById('numberDisplay');
        this.userInput         = document.getElementById('userInput');
        this.streakDisplay     = document.getElementById('streak');
        this.bestStreakDisplay = document.getElementById('bestStreak');
        this.feedback          = document.getElementById('feedback');

        this.toggleLeaderboardButton = document.getElementById('toggleLeaderboard');
        this.clearLeaderboardButton  = document.getElementById('clearLeaderboard');
        this.leaderboardList         = document.getElementById('leaderboardList');
        this.leaderboardItems        = document.getElementById('leaderboardItems');
        
        this.beginnerSwitch = document.getElementById('beginnerSwitch');
        this.easySwitch     = document.getElementById('easySwitch');
        this.mediumSwitch   = document.getElementById('mediumSwitch');
        this.hardSwitch     = document.getElementById('hardSwitch');
        this.extremeSwitch  = document.getElementById('extremeSwitch');
        this.darkModeSwitch = document.getElementById('darkModeSwitch');

        this.modal       = document.getElementById('tutorialModal');
        this.closeBtn    = document.getElementById('closeTutorial');
        this.showBtn     = document.getElementById('showTutorial');
        this.roundTimer  = document.getElementById('roundTimer');

        window.addEventListener('beforeunload', this.stopGhostTimer.bind(this));

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
                const oldId = this.state.userId;

                sha256(newName.toLowerCase()).then(newHash => {
                    migrateProfile(oldId, newHash, newName);

                    this.state.userId = newHash;
                    localStorage.setItem('userId', newHash);
                    localStorage.setItem('username', newName);

                    this.usernameDisplay.textContent = `Player: ${newName}`;
                    this.state.bestStreak = this.getBestStreak(newHash);
                    this.bestStreakDisplay.textContent = this.state.bestStreak;

                    this.updateLeaderboardDisplay();
                });
                input.replaceWith(this.usernameDisplay);
            });

            input.addEventListener("keydown", (event) => {
                if (event.key === "Enter" && !event.altKey && !event.ctrlKey && !event.metaKey) {
                    event.preventDefault();
                    input.blur();
                }
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

        const storedName = localStorage.getItem('username') || 'Anonymous';
        this.usernameDisplay.textContent = `Player: ${storedName}`;

        sha256(storedName.toLowerCase()).then(uid => {
            const lastUid = localStorage.getItem('userId');
            migrateProfile(lastUid, uid, storedName);
            this.state.userId = uid;
            localStorage.setItem('userId', uid);
            localStorage.setItem('username', storedName);

            this.state.bestStreak = this.getBestStreak(uid);
            this.bestStreakDisplay.textContent = this.state.bestStreak;
            this.updateLeaderboardDisplay();
        });

        this.updateLeaderboardDisplay();

        // Default difficulty
        this.setDifficulty('easy');
    }

    setupEventListeners() {
        this.darkModeSwitch.addEventListener('click', () => {
            const isDark = document.body.dataset.theme === 'dark';
            document.body.dataset.theme = isDark ? 'light' : 'dark';
            this.darkModeSwitch.classList.toggle('active', !isDark);
            this.darkModeSwitch.setAttribute('aria-checked', (!isDark).toString());
            this.darkModeSwitch.setAttribute('aria-pressed', (!isDark).toString());
        });

        this.userInput.addEventListener('focus', () => {
            this.userInput.scrollIntoView({ block: 'center' });
        });

        this.userInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.altKey && !event.ctrlKey && !event.metaKey) {
                event.preventDefault();
                this.handleUserInput();
            }
        });

        if (!this.leaderboardList.style.display) {
            this.leaderboardList.style.display = 'block';
        }

        this.toggleLeaderboardButton.addEventListener('click', () => {
            const isVisible = this.leaderboardList.style.display !== 'none';
            this.leaderboardList.style.display = isVisible ? 'none' : 'flex';
            this.toggleLeaderboardButton.textContent = isVisible ? 'Show Leaderboard' : 'Hide Leaderboard';
        });

        this.clearLeaderboardButton.addEventListener('click', () => {
            localStorage.removeItem('leaderboard');
            localStorage.removeItem('bestTimes');
            this.leaderboardItems.innerHTML = '';
            this.updateLeaderboardDisplay();
        });

        [this.beginnerSwitch, this.easySwitch, this.mediumSwitch, this.hardSwitch, this.extremeSwitch].forEach((switchElement, index) => {
            const levels = ['beginner', 'easy', 'medium', 'hard', 'extreme'];
            switchElement.addEventListener('click', () => this.setDifficulty(levels[index]));
            switchElement.addEventListener('keydown', (event) => {
                if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'Enter') {
                    event.preventDefault();
                    switchElement.click();
                }
            });
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

        if (!input) {
            if (this.state.currentNumber === 1) {
                const fullFactorization = this.calculateFullFactorization(this.state.originalNumber);
                this.feedback.innerHTML =
                    `Correct! Full factorization: ${fullFactorization}<br>${this.state.originalNumber} = ` +
                    fullFactorization.replace(/ × /g, ' * ');
            }
            else if (this.isPrime(this.state.currentNumber)) {
                const fullFactorization = this.calculateFullFactorization(this.state.originalNumber);
                this.feedback.innerHTML =
                    `Correct! It's a prime. Full factorization: ${fullFactorization}`;
            }
            else {
                this.feedback.textContent = "Blank entry not allowed for non-prime numbers.";
                return;
            }
            this.state.streak++;
            this.stopGhostTimer();
            this.recordTime();
            this.saveBestStreak(this.state.bestStreak);
            setTimeout(() => this.startNewRound(), this.state.currentNumber === 1 ? 1000 : 2000);
        } else {
            const match = input.match(/^\d+$/);
            if (match) {
                const factor = parseInt(input, 10);
                if (factor <= 0) {
                    this.feedback.textContent = "I have to say you are pretty creative, but not in this game.";
                    this.userInput.value = "";
                    this.updateStats();
                    return;
                }
                else if (factor == 1) {
                    this.feedback.textContent = "1 is not a prime factor-please enter a prime > 1.";
                    this.userInput.value = "";
                    this.updateStats();
                    return;
                }

                if (this.state.currentNumber % factor === 0 && this.isPrime(factor)) {
                    while (this.state.currentNumber % factor === 0) {
                        this.state.currentNumber /= factor;
                    }
                    this.updateNumberDisplay();
                    this.feedback.textContent = `Correct! Fully factorized by ${factor}.`;

                    if (this.state.currentNumber === 1) {
                        const fullFactorization = this.calculateFullFactorization(this.state.originalNumber);
                        this.feedback.innerHTML = `Correct! Full factorization: ${fullFactorization}<br>${this.state.originalNumber} = ${fullFactorization.replace(/ × /g, ' * ')}`;
                        this.state.streak++;
                        this.recordTime();
                        this.saveBestStreak(this.state.bestStreak);
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
        this.stopGhostTimer();
        this.state.elapsed = 0;
        this.roundTimer.textContent = '0.00 s';
        this.state.timerId = setInterval(() => {
            this.state.elapsed = (performance.now() - this.state.startTime) / 1000;
            this.roundTimer.textContent = this.state.elapsed.toFixed(2) + ' s';
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
        this.updateNumberDisplay();
        this.feedback.innerHTML = "Factorize the number or press 'Enter' if it's prime!";
        this.stopGhostTimer();
        this.roundTimer.textContent = '0.00 s';
        this.state.elapsed = 0;
        this.firstInputGiven = false;
    }

    updateNumberDisplay() {
        this.numberDisplay.textContent = this.state.currentNumber === 1 ? " " : this.state.currentNumber;
    }

    setDifficulty(level) {
        if (this.state.currentDifficulty === level) {
            return;
        }

        const allSwitches = [this.beginnerSwitch, this.easySwitch, this.mediumSwitch, this.hardSwitch, this.extremeSwitch];
        allSwitches.forEach(sw => {
            sw.classList.remove('active');
            sw.setAttribute('aria-pressed', 'false');
            sw.setAttribute('aria-checked', 'false');
        });

        this.state.currentDifficulty = level;

        const ranges = {
            beginner: { min: 2, max: 29 },
            easy: { min: 30, max: 99 },
            medium: { min: 100, max: 999 },
            hard: { min: 1000, max: 9999 },
            extreme: { min: 10000, max: 100000 }
        };
        this.state.difficultyRange = ranges[level];

        let switchToActivate;
        switch (level) {
            case 'beginner': switchToActivate = this.beginnerSwitch; break;
            case 'easy': switchToActivate = this.easySwitch; break;
            case 'medium': switchToActivate = this.mediumSwitch; break;
            case 'hard': switchToActivate = this.hardSwitch; break;
            case 'extreme': switchToActivate = this.extremeSwitch; break;
        }
        switchToActivate.classList.add('active');
        switchToActivate.setAttribute('aria-pressed', 'true');
        switchToActivate.setAttribute('aria-checked', 'true');
        this.startNewRound();
    }

    async updateStats() {
        this.streakDisplay.textContent = this.state.streak;
        this.state.bestStreak = Math.max(this.state.bestStreak, this.state.streak);
        this.bestStreakDisplay.textContent = this.state.bestStreak;
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

    calculateFullFactorization(n) {
        if (!Number.isInteger(n) || n < 2) return '';
        let copy = n, out = [];

        for (const p of primesUnder316) {
            if (p * p > copy) break;
            let cnt = 0;
            while (copy % p === 0) { copy /= p; ++cnt; }
            if (cnt) out.push(cnt > 1 ? `${p}^${cnt}` : `${p}`);
        }
        if (copy > 1) out.push(`${copy}`);
        return out.join(' × ');
    }

    recordTime() {
        if (!this.state.userId) return;

        const finalTime = parseFloat(this.state.elapsed.toFixed(2));
        const username = this.usernameDisplay.textContent.replace('Player: ', '') || 'Anonymous';
        const bestTimes = JSON.parse(localStorage.getItem('bestTimes') || '{}');

        let entry = bestTimes[this.state.userId];
        if (!entry) {
            entry = { name: username, best: finalTime };
        } else {
            const stored = parseFloat(entry.best);
            const currentBest = Number.isFinite(stored) ? stored : finalTime;
            if (finalTime < currentBest) {
                entry.best = finalTime;
            }
            entry.name = username;
        }

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
            const formattedTime = t.best === '—' ? '—' :
                (typeof t.best === 'number' ? t.best.toFixed(2) : t.best);
            return { name: s.name, streak: s.streak, time: formattedTime };
        })
            .sort((a, b) => b.streak - a.streak)
            .slice(0, 5);

        this.leaderboardItems.innerHTML = rows
            .map(r => `<li>${this.escapeHTML(r.name)}: ${r.streak} (Best Time: ${r.time})</li>`)
            .join('');
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    saveBestStreak(streak) {
        if (this.state.currentNumber !== 1 && !this.isPrime(this.state.originalNumber)) return;
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