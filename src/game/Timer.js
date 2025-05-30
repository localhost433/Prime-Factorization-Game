// src/game/Timer.js

export class Timer {
    constructor(displayElement) {
        this.display = displayElement;
        this.startTime = 0;
        this.timerId = null;
    }

    start() {
        this.stop();
        this.startTime = performance.now();
        this.timerId = setInterval(() => {
            const elapsed = (performance.now() - this.startTime) / 1000;
            this.display.textContent = elapsed.toFixed(2) + ' s';
        }, 50);
    }

    stop() {
        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    reset() {
        this.stop();
        this.display.textContent = '0.00 s';
    }
}
