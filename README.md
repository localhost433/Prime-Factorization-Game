# Prime Factorization Game

A browser-based game where you practice breaking numbers into prime factors under a timer. Track your streaks and best times on the leaderboard! [Hosted online!](https://localhost433.github.io/Prime-Factorization-Game/)
## Quick Start

### Prereqs.
- A modern web browser (Chrome, Safari, Firefox, Edge, etc.)


### Running Locally
> Note: For `localStorage` to work reliably, serve the files via HTTP.  
> Opening `index.html` over `file://` may block storage APIs in some browsers.

1. Clone the repo
   `git clone https://github.com/localhost433/Prime-Factorization-Game.git`  
   `cd Prime-Factorization-Game`
2. Serve the files  
   - Using Python 3:  
     `python3 -m http.server 8000`  
   - Or with any static file server of your choice.
3. Open your browser and navigate to  
   `http://localhost:8000`

## How to Play
1. Choose a difficulty level (Beginner -> Extreme).  
2. Factor the displayed number by typing one prime at a time and pressing Enter.  
3. Press Enter on a blank input if the remaining number is prime or fully factorized.  
4. Keep your streak alive and try to beat your best time!

## License
MIT © 2025 Robin Chen