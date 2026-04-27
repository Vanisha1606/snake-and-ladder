# 🐍🪜 Snakes & Ladders — Mobile App Style

A polished, mobile-app-styled Snakes & Ladders game built with **Node.js + Express** on the backend and **vanilla JS / HTML / CSS** on the frontend.

The whole game is presented inside a phone-frame UI with smooth screen transitions — splash → home → player setup → game → win screen — just like a real mobile app.

## ✨ Features

- 📱 Phone-frame UI with status bar, notch, and rounded corners
- 🎬 Animated splash screen with loading bar
- 🏠 Home menu with floating game emojis
- 👥 Setup screen for **2 to 4 players** with custom names + tap-to-cycle avatars
- 🎲 3D-rolling animated dice (tap to roll)
- 🐍 Snakes drawn as curved SVG with eyes & forked tongues
- 🪜 Ladders drawn as parallel rails with rungs
- 🪙 Color-coded player tokens that animate one tile at a time
- ✨ "Roll a 6, go again" rule (3 sixes resets your turn)
- 🎯 Exact-100-to-win rule
- 🏆 Win screen with confetti rain
- 🎨 Glassmorphic, gradient, mobile-first design with smooth transitions

## 🚀 Getting Started

```bash
npm install
npm start
```

Then open: **http://localhost:3000**

## 📁 Project Structure

```
Snake_and_ladder/
├── package.json
├── server.js              # Tiny Express server serving the static app
└── public/
    ├── index.html         # All app screens (splash, home, players, game, win, info)
    ├── css/style.css      # Phone-frame + screen styling
    └── js/app.js          # Game logic, board rendering, animations
```

## 🎮 How to Play

1. Choose 2, 3, or 4 players. Edit names and tap the ↻ button to change avatars.
2. Tap **Start Game**.
3. On your turn, tap the dice. Your token moves automatically.
4. Land on a ladder bottom 🪜 → climb up.
5. Land on a snake head 🐍 → slide down.
6. Roll a **6** to roll again. Three sixes in a row = lose your turn.
7. First to land **exactly** on tile 100 wins!

## 🛠️ Tech Stack

- **Backend:** Node.js, Express 4
- **Frontend:** Vanilla HTML5 / CSS3 / ES6 — no build step
- **Graphics:** CSS Grid for the board, inline SVG for snakes/ladders, CSS animations for everything else

## 📜 License

MIT
