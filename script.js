let currentNumber;
let originalNumber;
let streak = 0;
let bestStreak = 0;
let difficultyRange = { min: 20, max: 100 };
let currentFactors = [];

const usernameDisplay = document.createElement("div");
usernameDisplay.textContent = "Player: Anonymous"; // Default label
usernameDisplay.style.fontSize = "1.2rem";
usernameDisplay.style.marginBottom = "10px";
usernameDisplay.style.cursor = "pointer"; // Indicate it's editable
usernameDisplay.style.borderBottom = "1px dashed transparent"; // Hover effect
usernameDisplay.style.transition = "border-bottom 0.3s";
document.querySelector(".game-container").prepend(usernameDisplay);

usernameDisplay.addEventListener("mouseenter", () => {
    usernameDisplay.style.borderBottom = "1px dashed var(--text-color)";
});

usernameDisplay.addEventListener("mouseleave", () => {
    usernameDisplay.style.borderBottom = "1px dashed transparent";
});

usernameDisplay.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = usernameDisplay.textContent.replace("Player: ", "");
    input.style.fontSize = "1.2rem";
    input.style.marginBottom = "10px";
    input.style.textAlign = "center";
    input.style.border = `1px solid var(--text-color)`;
    input.style.borderRadius = "5px";
    input.style.backgroundColor = "transparent";
    input.style.color = "var(--text-color)";
    usernameDisplay.replaceWith(input);
    input.focus();

    input.addEventListener('blur', () => {
        const newName = input.value.trim() || "Anonymous";
        usernameDisplay.textContent = `Player: ${newName}`;
        bestStreak = getBestStreak(newName);
        bestStreakDisplay.textContent = bestStreak;
        updateLeaderboardDisplay();
        input.replaceWith(usernameDisplay);
    });    
    
    input.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            input.blur();
        }
    });
});


const numberDisplay = document.getElementById('numberDisplay');
const userInput = document.getElementById('userInput');
const streakDisplay = document.getElementById('streak');
const bestStreakDisplay = document.getElementById('bestStreak');
const feedback = document.getElementById('feedback');

const toggleLeaderboardButton = document.getElementById('toggleLeaderboard');
const clearLeaderboardButton = document.getElementById('clearLeaderboard');
const leaderboardList = document.getElementById('leaderboardList');
const leaderboardItems = document.getElementById('leaderboardItems');

const beginnerSwitch = document.getElementById('beginnerSwitch');
const easySwitch = document.getElementById('easySwitch');
const mediumSwitch = document.getElementById('mediumSwitch');
const hardSwitch = document.getElementById('hardSwitch');
const extremeSwitch = document.getElementById('extremeSwitch');

const darkSwitch = document.getElementById('darkSwitch');

document.body.dataset.theme = 'light'; // Default theme

// Function to generate a random number within range
function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to check if a number is prime
function isPrime(num) {
    if (num < 2) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
    }
    return true;
}

// Function to calculate full factorization
function calculateFullFactorization(num) {
    const factors = [];
    let divisor = 2;
    while (num > 1) {
        let count = 0;
        while (num % divisor === 0) {
            num /= divisor;
            count++;
        }
        if (count > 0) factors.push(count > 1 ? `${divisor}^${count}` : `${divisor}`);
        divisor++;
    }
    return factors.join(' × ');
}

// Function to start a new round
function startNewRound() {
    originalNumber = generateRandomNumber(difficultyRange.min, difficultyRange.max);
    currentNumber = originalNumber;
    updateNumberDisplay();
    feedback.textContent = "Factorize the number or press 'Enter' if it's prime!";
}

// Update the number display
function updateNumberDisplay() {
    numberDisplay.textContent = currentNumber === 1 ? " " : currentNumber;
}

// Handle difficulty change
function setDifficulty(level) {
    const ranges = {
        beginner: { min: 2, max: 40 },
        easy: { min: 30, max: 99 },
        medium: { min: 100, max: 999 },
        hard: { min: 1000, max: 9999 },
        extreme: { min: 10000, max: 100000 }
    };
    difficultyRange = ranges[level];

    // Reset active switches
    [beginnerSwitch, easySwitch, mediumSwitch, hardSwitch, extremeSwitch].forEach(switchElement => {
        switchElement.classList.remove('active');
    });

    // Activate the selected switch
    if (level === 'beginner') beginnerSwitch.classList.add('active');
    if (level === 'easy') easySwitch.classList.add('active');
    if (level === 'medium') mediumSwitch.classList.add('active');
    if (level === 'hard') hardSwitch.classList.add('active');
    if (level === 'extreme') extremeSwitch.classList.add('active');

    startNewRound();
}

// Toggle dark mode
darkSwitch.addEventListener('click', () => {
    const isDark = document.body.dataset.theme === 'dark';
    document.body.dataset.theme = isDark ? 'light' : 'dark';
    darkSwitch.classList.toggle('active', !isDark);
});

// Handle user input
userInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const input = userInput.value.trim();

        if (!input) {
            if (isPrime(currentNumber)) {
                feedback.textContent = "Correct! It's a prime.";
                const fullFactorization = calculateFullFactorization(originalNumber);
                feedback.textContent += ` Full factorization: ${fullFactorization}`;
                streak++;
                setTimeout(startNewRound, 500);

            } else {
                feedback.textContent = "Incorrect! Streak reset.";
                streak = 0;
            }
        } else {
            const match = input.match(/^\d+$/);
            if (match) {
                const factor = parseInt(input, 10);

                if (currentNumber % factor === 0 && isPrime(factor)) {
                    // Divide by the factor till it no longer divides
                    while (currentNumber % factor === 0) {
                        currentNumber /= factor;
                    }
                    updateNumberDisplay();
                    feedback.textContent = `Correct! Fully factorized by ${factor}.`;

                    if (currentNumber === 1) {
                        const fullFactorization = calculateFullFactorization(originalNumber);
                        feedback.textContent += ` Full factorization: ${fullFactorization}`;
                        streak++;
                        setTimeout(startNewRound, 1000);
                    }

                } else {
                    feedback.textContent = "Incorrect. Streak reset!";
                    streak = 0;
                }
            } else {
                feedback.textContent = "Invalid input. Enter a prime.";
            }
        }

        userInput.value = "";
        updateStats();
    }
});

function updateLeaderboardDisplay() {
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || {};
    const sortedLeaderboard = Object.entries(leaderboard)
        .sort(([, streakA], [, streakB]) => streakB - streakA);

    leaderboardItems.innerHTML = sortedLeaderboard
        .slice(0, 5)
        .map(([user, streak]) => `<li>${user}: ${streak}</li>`)
        .join('');
}

toggleLeaderboardButton.addEventListener('click', () => {
    const isHidden = leaderboardList.style.display === 'none';
    leaderboardList.style.display = isHidden ? 'block' : 'none';
    toggleLeaderboardButton.textContent = isHidden ? 'Hide Leaderboard' : 'Show Leaderboard';
});

clearLeaderboardButton.addEventListener('click', () => {
    localStorage.removeItem('leaderboard');
    leaderboardItems.innerHTML = '';
});

function saveBestStreak(username, streak) {
    if (username === "Anonymous") return;
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || {};
    leaderboard[username] = Math.max(leaderboard[username] || 0, streak);
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    updateLeaderboardDisplay();
}

function getBestStreak(username) {
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || {};
    return leaderboard[username] || 0;
}

function updateStats() {
    streakDisplay.textContent = streak;
    const username = usernameDisplay.textContent.replace('Player: ', '') || "Anonymous";
    bestStreak = Math.max(bestStreak, streak);
    saveBestStreak(username, streak);
    bestStreakDisplay.textContent = getBestStreak(username);
}

// Event listeners for difficulty switches
beginnerSwitch.addEventListener('click', () => setDifficulty('beginner'));
easySwitch.addEventListener('click', () => setDifficulty('easy'));
mediumSwitch.addEventListener('click', () => setDifficulty('medium'));
hardSwitch.addEventListener('click', () => setDifficulty('hard'));
extremeSwitch.addEventListener('click', () => setDifficulty('extreme'));

// Start the game
updateLeaderboardDisplay();
setDifficulty('easy');
