// src/game/Game.js

import { Timer } from './Timer.js';
import { Difficulty } from './Difficulty.js';
import { Leaderboard } from './Leaderboard.js';
import { Profile } from './Profile.js';
import { isPrime, calculateFullFactorization, generateRandomNumber } from '../utils/primes.js';

export class Game {
    constructor() {
        this.state = {
            currentNumber: null,
            originalNumber: null,
            streaks: {},
            bestStreaks: {},
            difficultyRange: { min: 30, max: 99 },
            currentDifficulty: null,
            userId: null,
            startTime: 0,
            elapsed: 0
        };
        this.firstInputGiven = false;
        this.nextRoundTimeout = null;

        // DOM elements
        this.numberDisplay = document.getElementById('numberDisplay');
        this.userInput = document.getElementById('userInput');
        this.streakDisplay = document.getElementById('streak');
        this.bestStreakDisplay = document.getElementById('bestStreak');
        this.feedback = document.getElementById('feedback');
        this.roundTimer = document.getElementById('roundTimer');
        this.toggleLeaderboardButton = document.getElementById('toggleLeaderboard');
        this.clearLeaderboardButton = document.getElementById('clearLeaderboard');
        this.leaderboardList = document.getElementById('leaderboardList');
        this.darkModeSwitch = document.getElementById('darkModeSwitch');
        this.modal = document.getElementById('tutorialModal');
        this.showBtn = document.getElementById('showTutorial');
        this.closeBtn = document.getElementById('closeTutorial');

        // modules
        this.timer = new Timer(this.roundTimer);
        this.leaderboard = new Leaderboard(this);
        this.profile = new Profile(this);
        this.difficulty = new Difficulty(this);
    }

    init() {
        this.setupEventListeners();
        this.profile.load();
        this.difficulty.set('easy');
        this.leaderboard.render();

        if (!localStorage.getItem('hasSeenTutorial')) {
            this.modal.classList.remove('hidden');
            localStorage.setItem('hasSeenTutorial', 'true');
        }
    }

    setupEventListeners() {
        this.userInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') this.handleUserInput();
        });

        this.darkModeSwitch.addEventListener('click', () => {
            const isDark = document.body.dataset.theme === 'dark';
            document.body.dataset.theme = isDark ? 'light' : 'dark';
            this.darkModeSwitch.classList.toggle('active', !isDark);
            this.darkModeSwitch.setAttribute('aria-checked', (!isDark).toString());
            this.darkModeSwitch.setAttribute('aria-pressed', (!isDark).toString());
        });

        this.showBtn.addEventListener('click', () => {
            this.modal.classList.remove('hidden');
        });

        this.closeBtn.addEventListener('click', () => {
            this.modal.classList.add('hidden');
        });

        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.modal.classList.add('hidden');
            }
        });

        this.toggleLeaderboardButton.addEventListener('click', () => {
            const isVisible = this.leaderboardList.style.display !== 'none';
            this.leaderboardList.style.display = isVisible ? 'none' : 'flex';
            this.toggleLeaderboardButton.textContent = isVisible ? 'Show Leaderboard' : 'Hide Leaderboard';
        });

        this.clearLeaderboardButton.addEventListener('click', () => {
            const diff = this.state.currentDifficulty;
            const boards = JSON.parse(localStorage.getItem('leaderboard') || '{}');
            const times = JSON.parse(localStorage.getItem('bestTimes') || '{}');
            if (boards[diff]) delete boards[diff];
            if (times[diff]) delete times[diff];
            localStorage.setItem('leaderboard', JSON.stringify(boards));
            localStorage.setItem('bestTimes', JSON.stringify(times));
            this.leaderboard.render();
            this.updateStats();
        });
    }

    handleUserInput() {
        const input = this.userInput.value.trim();
        const diff = this.state.currentDifficulty;

        if (!this.firstInputGiven) {
            this.firstInputGiven = true;
            this.state.startTime = performance.now();
            this.timer.start();
        }

        if (!input) {
            if (this.state.currentNumber === 1 || isPrime(this.state.currentNumber)) {
                this.successHandler();
            } else {
                this.feedback.textContent = 'Blank entry not allowed for non-primes.';
            }
        } else if (/^\d+$/.test(input)) {
            const factor = parseInt(input, 10);
            if (factor <= 1 || !isPrime(factor)) {
                this.feedback.textContent = 'Enter a valid prime > 1.';
            } else if (this.state.currentNumber % factor === 0) {
                while (this.state.currentNumber % factor === 0) {
                    this.state.currentNumber /= factor;
                }
                this.updateNumberDisplay();
                this.feedback.textContent = `Correct! Factored by ${factor}.`;
                if (this.state.currentNumber === 1) this.successHandler();
            } else {
                this.feedback.textContent = 'Incorrect. Streak reset!';
                this.state.streaks[diff] = 0;
                this.updateStats();
            }
        } else {
            this.feedback.textContent = 'Invalid input.';
        }
        this.userInput.value = '';
    }

    successHandler() {
        const diff = this.state.currentDifficulty;
        this.timer.stop();
        this.state.elapsed = (performance.now() - this.state.startTime) / 1000;

        // update streak
        this.state.streaks[diff] = (this.state.streaks[diff] || 0) + 1;
        this.updateStats();

        // record time and streak
        this.leaderboard.recordTime(this.state.elapsed);
        this.leaderboard.saveStreak();

        // show full factorization
        const full = calculateFullFactorization(this.state.originalNumber);
        this.feedback.innerHTML = `Full factorization: ${full}`;

        // next round
        this.nextRoundTimeout = setTimeout(() => this.startNewRound(), 1500);
    }

    startNewRound() {
        const { min, max } = this.state.difficultyRange;
        const number = generateRandomNumber(min, max);
        this.state.originalNumber = number;
        this.state.currentNumber = number;
        this.updateNumberDisplay();
        this.feedback.textContent = 'Factor the number!';
        this.timer.reset();
        this.firstInputGiven = false;
    }

    updateNumberDisplay() {
        this.numberDisplay.textContent = this.state.currentNumber === 1 ? '' : this.state.currentNumber;
    }

    updateStats() {
        const diff = this.state.currentDifficulty;
        const current = this.state.streaks[diff] || 0;
        const prevBest = this.state.bestStreaks[diff] || 0;
        const newBest = Math.max(prevBest, current);

        this.state.bestStreaks[diff] = newBest;
        if (newBest > prevBest) {
            this.leaderboard.saveStreak();
        }
        this.streakDisplay.textContent     = current;
        this.bestStreakDisplay.textContent = newBest;
    }

    updateDifficultyDisplay() {
        if (!this.state.userId) return;
        const diff = this.state.currentDifficulty;
        this.state.bestStreaks[diff] = this.leaderboard.getBestStreak(this.state.userId, diff) || 0;
        this.bestStreakDisplay.textContent = this.state.bestStreaks[diff];
        this.leaderboard.render();
        this.updateStats();
    }
}
