/* ============================================================
   Snake & Ladder — App Logic
   ============================================================ */

// ---------- Game data ----------
const SNAKES  = { 99: 41, 89: 53, 76: 58, 66: 45, 54: 31, 43: 18, 27: 5 };
const LADDERS = { 4: 25, 13: 46, 33: 49, 42: 63, 50: 69, 62: 81, 74: 92 };

const COLORS  = ['#ff5e7e', '#4cc9f0', '#ffd166', '#06d6a0'];
const EMOJIS  = ['🦊', '🐼', '🐯', '🐰', '🐸', '🦁', '🐧', '🐶', '🐵', '🐨'];

const TOKEN_OFFSETS = [
  { x: 0.4, y: 0.4 },
  { x: 5.0, y: 0.4 },
  { x: 0.4, y: 5.0 },
  { x: 5.0, y: 5.0 }
];

// ---------- State ----------
const screens = {};
let currentScreen = 'splash';

let playerCount = 3;
let playerData = [];
let players = [];
let currentTurn = 0;
let consecutiveSixes = 0;
let isAnimating = false;
let gameOver = false;

// ============================================================
// Init / Navigation
// ============================================================
function init() {
  document.querySelectorAll('.screen').forEach(s => {
    screens[s.dataset.screen] = s;
  });
  setupNav();
  setupCountPills();
  setupStartGameBtn();
  setupDice();
  setupRestart();
  resetPlayerSetup();

  setTimeout(() => show('home'), 1900);
}

function show(name) {
  if (name === currentScreen) return;
  const cur = screens[currentScreen];
  const next = screens[name];
  if (cur) {
    cur.classList.add('exiting');
    cur.classList.remove('active');
    setTimeout(() => cur.classList.remove('exiting'), 420);
  }
  if (next) {
    next.classList.add('active');
  }
  currentScreen = name;

  if (name === 'players') resetPlayerSetup();
}

function setupNav() {
  document.querySelectorAll('[data-go]').forEach(btn => {
    btn.addEventListener('click', () => show(btn.dataset.go));
  });
}

// ============================================================
// Player Setup Screen
// ============================================================
function setupCountPills() {
  document.querySelectorAll('.count-pill').forEach(p => {
    p.addEventListener('click', () => {
      playerCount = +p.dataset.count;
      document.querySelectorAll('.count-pill').forEach(x =>
        x.classList.toggle('active', x === p)
      );
      renderPlayerList();
    });
  });
}

function resetPlayerSetup() {
  playerData = Array.from({ length: 4 }, (_, i) => ({
    name: `Player ${i + 1}`,
    color: COLORS[i],
    emoji: EMOJIS[i]
  }));
  document.querySelectorAll('.count-pill').forEach(x =>
    x.classList.toggle('active', +x.dataset.count === playerCount)
  );
  renderPlayerList();
}

function renderPlayerList() {
  const list = document.getElementById('playerList');
  list.innerHTML = '';
  for (let i = 0; i < playerCount; i++) {
    const p = playerData[i];
    const row = document.createElement('div');
    row.className = 'player-row';
    row.innerHTML = `
      <div class="player-avatar"
           style="background: linear-gradient(135deg, ${p.color}, ${shade(p.color, -0.25)});">
        ${p.emoji}
      </div>
      <input class="player-input" placeholder="Player ${i + 1}" value="${escapeHtml(p.name)}" data-i="${i}" maxlength="14" />
      <button class="player-emoji" data-i="${i}" title="Change avatar">↻</button>
    `;
    list.appendChild(row);
  }
  list.querySelectorAll('.player-input').forEach(inp => {
    inp.addEventListener('input', e => {
      const i = +e.target.dataset.i;
      playerData[i].name = e.target.value.trim() || `Player ${i + 1}`;
    });
  });
  list.querySelectorAll('.player-emoji').forEach(btn => {
    btn.addEventListener('click', e => {
      const i = +e.currentTarget.dataset.i;
      const cur = playerData[i].emoji;
      const idx = EMOJIS.indexOf(cur);
      playerData[i].emoji = EMOJIS[(idx + 1) % EMOJIS.length];
      renderPlayerList();
    });
  });
}

function setupStartGameBtn() {
  document.getElementById('startGameBtn').addEventListener('click', () => {
    startGame();
    show('game');
  });
}

// ============================================================
// Board geometry
// ============================================================
function tileCoords(n) {
  const rb  = Math.floor((n - 1) / 10);                       // row from bottom (0..9)
  const col = rb % 2 === 0 ? (n - 1) % 10 : 9 - ((n - 1) % 10);
  const vr  = 9 - rb;                                         // visual row from top
  return { col, vr };
}
function tileCenterSvg(n) {
  const { col, vr } = tileCoords(n);
  return { cx: col * 100 + 50, cy: vr * 100 + 50, col, vr };
}

function buildBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  for (let i = 0; i < 100; i++) {
    const vr  = Math.floor(i / 10);
    const col = i % 10;
    const rb  = 9 - vr;
    const tileNum = rb % 2 === 0 ? rb * 10 + col + 1 : rb * 10 + (9 - col) + 1;

    const cell = document.createElement('div');
    cell.className = 'cell' + ((vr + col) % 2 === 0 ? '' : ' alt');
    cell.dataset.n = tileNum;
    cell.innerHTML = `<span class="num">${tileNum}</span>`;
    if (tileNum === 1)   cell.classList.add('start');
    if (tileNum === 100) cell.classList.add('finish');
    board.appendChild(cell);
  }
}

// ============================================================
// Snakes & Ladders SVG
// ============================================================
function drawSnakesAndLadders() {
  const svg = document.getElementById('boardSvg');
  svg.innerHTML = `
    <defs>
      <linearGradient id="ladderGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"  stop-color="#ffd166"/>
        <stop offset="100%" stop-color="#ff8e3c"/>
      </linearGradient>
      <linearGradient id="snakeBody" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%"  stop-color="#7eea84"/>
        <stop offset="100%" stop-color="#1d8a4d"/>
      </linearGradient>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.35"/>
      </filter>
    </defs>
  `;
  Object.entries(LADDERS).forEach(([from, to]) => drawLadder(svg, +from, +to));
  Object.entries(SNAKES).forEach(([from, to])  => drawSnake(svg, +from, +to));
}

function drawLadder(svg, from, to) {
  const a = tileCenterSvg(from);
  const b = tileCenterSvg(to);
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const len = Math.hypot(dx, dy);
  const nx  = -dy / len;
  const ny  =  dx / len;
  const w   = 16;

  const r1 = { x1: a.cx + nx*w, y1: a.cy + ny*w, x2: b.cx + nx*w, y2: b.cy + ny*w };
  const r2 = { x1: a.cx - nx*w, y1: a.cy - ny*w, x2: b.cx - nx*w, y2: b.cy - ny*w };

  const railSvg = `
    <line x1="${r1.x1}" y1="${r1.y1}" x2="${r1.x2}" y2="${r1.y2}"
          stroke="url(#ladderGrad)" stroke-width="7" stroke-linecap="round" filter="url(#softShadow)"/>
    <line x1="${r2.x1}" y1="${r2.y1}" x2="${r2.x2}" y2="${r2.y2}"
          stroke="url(#ladderGrad)" stroke-width="7" stroke-linecap="round" filter="url(#softShadow)"/>
  `;
  svg.insertAdjacentHTML('beforeend', railSvg);

  const rungs = Math.max(3, Math.round(len / 55));
  for (let i = 0; i <= rungs; i++) {
    const t = i / rungs;
    const x1 = r1.x1 + (r1.x2 - r1.x1) * t;
    const y1 = r1.y1 + (r1.y2 - r1.y1) * t;
    const x2 = r2.x1 + (r2.x2 - r2.x1) * t;
    const y2 = r2.y1 + (r2.y2 - r2.y1) * t;
    svg.insertAdjacentHTML('beforeend', `
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
            stroke="#c98a2c" stroke-width="5" stroke-linecap="round" opacity="0.95"/>
    `);
  }
}

function drawSnake(svg, headTile, tailTile) {
  const a = tileCenterSvg(headTile);
  const b = tileCenterSvg(tailTile);
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;

  const midX = (a.cx + b.cx) / 2 + dy * 0.30;
  const midY = (a.cy + b.cy) / 2 - dx * 0.30;
  const path = `M ${a.cx} ${a.cy} Q ${midX} ${midY} ${b.cx} ${b.cy}`;

  svg.insertAdjacentHTML('beforeend', `
    <path d="${path}" stroke="#0d4023" stroke-width="18" fill="none"
          stroke-linecap="round" opacity="0.55" filter="url(#softShadow)"/>
    <path d="${path}" stroke="url(#snakeBody)" stroke-width="14" fill="none"
          stroke-linecap="round"/>
    <path d="${path}" stroke="#fff" stroke-width="2" stroke-dasharray="2 8"
          fill="none" stroke-linecap="round" opacity="0.55"/>
    <circle cx="${a.cx}" cy="${a.cy}" r="16" fill="#1d8a4d"
            stroke="#0d4023" stroke-width="2"/>
    <circle cx="${a.cx - 5}" cy="${a.cy - 4}" r="2.6" fill="#fff"/>
    <circle cx="${a.cx + 5}" cy="${a.cy - 4}" r="2.6" fill="#fff"/>
    <circle cx="${a.cx - 5}" cy="${a.cy - 4}" r="1.3" fill="#000"/>
    <circle cx="${a.cx + 5}" cy="${a.cy - 4}" r="1.3" fill="#000"/>
    <path d="M ${a.cx - 4} ${a.cy + 6} q 4 4 8 0" stroke="#ff5e7e" stroke-width="1.5"
          fill="none" stroke-linecap="round"/>
    <circle cx="${b.cx}" cy="${b.cy}" r="6" fill="#7eea84" stroke="#0d4023" stroke-width="1.5"/>
  `);
}

// ============================================================
// Tokens
// ============================================================
function renderTokens() {
  const layer = document.getElementById('tokens');
  layer.innerHTML = '';
  players.forEach((p, i) => {
    const token = document.createElement('div');
    token.className = 'token';
    token.id = `token-${i}`;
    token.style.background = `linear-gradient(135deg, ${p.color}, ${shade(p.color, -0.25)})`;
    token.style.color = '#fff';
    token.innerHTML = `<span style="font-size: 11px; line-height:1; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.4));">${p.emoji}</span>`;
    layer.appendChild(token);
    placeToken(p);
  });
}

function placeToken(p) {
  const tok = document.getElementById(`token-${p.idx}`);
  if (!tok) return;
  const off = TOKEN_OFFSETS[p.idx];
  const startTile = p.position === 0 ? 1 : p.position;
  const c = tileCenterSvg(startTile);
  tok.style.left = (c.col * 10 + off.x) + '%';
  tok.style.top  = (c.vr  * 10 + off.y) + '%';
  tok.style.zIndex = String(20 - p.idx);
  tok.classList.toggle('locked', p.position === 0);
}

function bounceToken(p) {
  const tok = document.getElementById(`token-${p.idx}`);
  if (!tok) return;
  tok.classList.remove('bouncing');
  void tok.offsetWidth;
  tok.classList.add('bouncing');
  setTimeout(() => tok.classList.remove('bouncing'), 360);
}

// ============================================================
// Turn UI
// ============================================================
function renderTurnStrip() {
  const strip = document.getElementById('turnStrip');
  strip.innerHTML = '';
  players.forEach((p, i) => {
    const chip = document.createElement('div');
    chip.className = 'turn-chip' + (i === currentTurn ? ' active' : '');
    const posLabel = p.position === 0 ? '🔒' : p.position;
    const posClass = p.position === 0 ? 'turn-chip-pos locked' : 'turn-chip-pos';
    chip.innerHTML = `
      <div class="turn-chip-dot"
           style="background: linear-gradient(135deg, ${p.color}, ${shade(p.color, -0.2)});">${p.emoji}</div>
      <span class="turn-chip-name">${escapeHtml(p.name)}</span>
      <span class="${posClass}">${posLabel}</span>
    `;
    strip.appendChild(chip);
  });
  document.getElementById('turnTitle').textContent = `${players[currentTurn].name}'s turn`;
}

function setStatus(html) {
  document.getElementById('statusBanner').innerHTML = html;
}

// ============================================================
// Game flow
// ============================================================
function startGame() {
  players = playerData.slice(0, playerCount).map((p, i) => ({
    ...p,
    idx: i,
    position: 0
  }));
  currentTurn = 0;
  consecutiveSixes = 0;
  isAnimating = false;
  gameOver = false;

  buildBoard();
  drawSnakesAndLadders();
  renderTokens();
  renderTurnStrip();
  setStatus(`<strong>${players[0].name}</strong>, roll a 6 to enter the board!`);
  document.getElementById('dice').classList.remove('disabled');
  setDiceFace(document.getElementById('diceFace'), 1);
}

function setupDice() {
  const dice = document.getElementById('dice');
  dice.addEventListener('click', () => {
    if (isAnimating || gameOver) return;
    rollDice();
  });
}

function rollDice() {
  isAnimating = true;
  const dice = document.getElementById('dice');
  const face = document.getElementById('diceFace');
  dice.classList.add('rolling', 'disabled');

  let ticks = 0;
  const ticker = setInterval(() => {
    setDiceFace(face, 1 + Math.floor(Math.random() * 6));
    if (++ticks >= 6) clearInterval(ticker);
  }, 90);

  setTimeout(() => {
    const value = 1 + Math.floor(Math.random() * 6);
    setDiceFace(face, value);
    dice.classList.remove('rolling');
    handleRoll(value);
  }, 620);
}

function setDiceFace(face, n) {
  const PIPS = {
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9]
  };
  face.innerHTML = '';
  for (let i = 1; i <= 9; i++) {
    const span = document.createElement('span');
    if (PIPS[n].includes(i)) span.className = 'pip';
    else span.style.visibility = 'hidden';
    face.appendChild(span);
  }
}

function handleRoll(value) {
  const p = players[currentTurn];
  setStatus(`<strong>${p.name}</strong> rolled a <strong>${value}</strong>!`);

  if (value === 6) consecutiveSixes++;
  else consecutiveSixes = 0;

  if (consecutiveSixes >= 3) {
    setStatus(`Three sixes in a row! <strong>${p.name}</strong> loses this turn.`);
    consecutiveSixes = 0;
    setTimeout(() => nextTurn(false), 900);
    return;
  }

  // ---- Locked: must roll a 6 to enter the board ----
  if (p.position === 0) {
    if (value === 6) {
      setStatus(`🎉 <strong>${p.name}</strong> unlocked! Token enters the board. Roll again!`);
      p.position = 1;
      placeToken(p);
      bounceToken(p);
      renderTurnStrip();
      setTimeout(() => nextTurn(true), 900);
    } else {
      setStatus(`🔒 <strong>${p.name}</strong> needs a <strong>6</strong> to start. Stay locked!`);
      setTimeout(() => nextTurn(false), 1000);
    }
    return;
  }

  // ---- On the board: normal movement ----
  const target = p.position + value;
  if (target > 100) {
    setStatus(`<strong>${p.name}</strong> rolled ${value} — needs an exact roll to land on 100!`);
    setTimeout(() => nextTurn(value === 6), 1100);
    return;
  }

  movePlayer(p, p.position, target, () => {
    if (LADDERS[target]) {
      setStatus(`🪜 Ladder! <strong>${p.name}</strong> climbs to ${LADDERS[target]}!`);
      setTimeout(() => {
        movePlayer(p, target, LADDERS[target], () => finishMove(p, value), true);
      }, 380);
    } else if (SNAKES[target]) {
      setStatus(`🐍 Snake! <strong>${p.name}</strong> slides down to ${SNAKES[target]}.`);
      setTimeout(() => {
        movePlayer(p, target, SNAKES[target], () => finishMove(p, value), true);
      }, 380);
    } else {
      finishMove(p, value);
    }
  });
}

function finishMove(p, value) {
  renderTurnStrip();
  if (p.position === 100) {
    setTimeout(() => win(p), 350);
    return;
  }
  setTimeout(() => nextTurn(value === 6), 320);
}

function movePlayer(p, from, to, done, jump = false) {
  if (jump) {
    p.position = to;
    placeToken(p);
    bounceToken(p);
    setTimeout(() => done(), 380);
    return;
  }
  const step = to > from ? 1 : -1;
  let pos = from;
  const tick = () => {
    if (pos === to) {
      done();
      return;
    }
    pos += step;
    p.position = pos;
    placeToken(p);
    bounceToken(p);
    setTimeout(tick, 170);
  };
  tick();
}

function nextTurn(rollAgain) {
  if (gameOver) return;
  if (!rollAgain) {
    currentTurn = (currentTurn + 1) % players.length;
    consecutiveSixes = 0;
  }
  renderTurnStrip();
  setStatus(rollAgain
    ? `🎲 Six! <strong>${players[currentTurn].name}</strong> rolls again!`
    : `<strong>${players[currentTurn].name}</strong>, tap the dice!`);
  isAnimating = false;
  document.getElementById('dice').classList.remove('disabled');
}

function win(p) {
  gameOver = true;
  document.getElementById('winnerName').textContent = p.name;
  show('win');
  launchConfetti();
}

// ============================================================
// Confetti
// ============================================================
function launchConfetti() {
  const confetti = document.getElementById('confetti');
  confetti.innerHTML = '';
  const colors = ['#ff5e7e', '#4cc9f0', '#ffd166', '#06d6a0', '#ff8e53', '#a78bfa', '#fff'];
  for (let i = 0; i < 90; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = (2 + Math.random() * 2.5) + 's';
    piece.style.animationDelay = (Math.random() * 0.8) + 's';
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    piece.style.width = (6 + Math.random() * 6) + 'px';
    piece.style.height = (10 + Math.random() * 10) + 'px';
    confetti.appendChild(piece);
  }
}

function setupRestart() {
  document.getElementById('restartBtn').addEventListener('click', () => {
    if (isAnimating) return;
    startGame();
  });
  document.getElementById('playAgainBtn').addEventListener('click', () => {
    startGame();
    show('game');
  });
}

// ============================================================
// Helpers
// ============================================================
function shade(hex, amt) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  const adj = v => Math.max(0, Math.min(255, Math.round(v + 255 * amt)));
  return `rgb(${adj(r)}, ${adj(g)}, ${adj(b)})`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', init);
