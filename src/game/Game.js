// src/game/Game.js

import { Timer } from './Timer.js';
import { Difficulty } from './Difficulty.js';
import { Leaderboard } from './Leaderboard.js';
import { Profile } from './Profile.js';
import { isPrime, calculateFullFactorization, generateRandomNumber } from '../utils/primes.js';
import { escapeHTML } from '../utils/dom.js';

export class Game {
    constructor() {
        this.state = {
            currentNumber: null,
            originalNumber: null,
            streak: 0,
            bestStreak: 0,
            difficultyRange: { min: 30, max: 99 },
            currentDifficulty: null,
            userId: null,
            elapsed: 0,
        };

        this.firstInputGiven = false;
        this.nextRoundTimeout = null;

        this.numberDisplay = document.getElementById('numberDisplay');
        this.userInput = document.getElementById('userInput');
        this.streakDisplay = document.getElementById('streak');
        this.bestStreakDisplay = document.getElementById('bestStreak');
        this.feedback = document.getElementById('feedback');
        this.roundTimer = document.getElementById('roundTimer');

        this.timer = new Timer(this.roundTimer);
        this.difficulty = new Difficulty(this);
        this.leaderboard = new Leaderboard(this);
        this.profile = new Profile(this);
    }

    init() {
        this.setupEventListeners();
        this.profile.load();
        this.difficulty.set('easy');
        this.leaderboard.render();
    }

    setupEventListeners() {
        this.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.handleUserInput();
        });
    }

    handleUserInput() {
        const input = this.userInput.value.trim();
        if (!this.firstInputGiven) {
            this.firstInputGiven = true;
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
                this.state.streak = 0;
            }
        } else {
            this.feedback.textContent = 'Invalid input.';
        }

        this.userInput.value = '';
        this.updateStats();
    }

    successHandler() {
        const full = calculateFullFactorization(this.state.originalNumber);
        this.feedback.innerHTML = `Full factorization: ${full}`;
        this.state.streak++;
        this.timer.stop();
        this.leaderboard.recordTime(this.state.elapsed);
        this.leaderboard.saveStreak();
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
        this.streakDisplay.textContent = this.state.streak;
        this.state.bestStreak = Math.max(this.state.bestStreak, this.state.streak);
        this.bestStreakDisplay.textContent = this.state.bestStreak;
    }
}
