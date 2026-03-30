// Sound effects using Web Audio API (no files needed!)
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const ctx = new AudioCtx();

function ensureAudioReady() {
  if (ctx.state === "suspended") {
    ctx.resume();
  }
}

function playWhack() {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.connect(g);
  g.connect(ctx.destination);
  o.frequency.setValueAtTime(300, ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);
  g.gain.setValueAtTime(1, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  o.start();
  o.stop(ctx.currentTime + 0.15);
}

function playBomb() {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sawtooth";
  o.connect(g);
  g.connect(ctx.destination);
  o.frequency.setValueAtTime(150, ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
  g.gain.setValueAtTime(1, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  o.start();
  o.stop(ctx.currentTime + 0.3);
}

function playMiss() {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.connect(g);
  g.connect(ctx.destination);
  o.frequency.setValueAtTime(200, ctx.currentTime);
  g.gain.setValueAtTime(0.3, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  o.start();
  o.stop(ctx.currentTime + 0.1);
}

const GAME_DURATION = 30;
const POP_MIN_MS = 650;
const POP_MAX_MS = 1150;
const BOMB_CHANCE = 0.22;

const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const playButton = document.getElementById("playButton");
const restartButton = document.getElementById("restartButton");
const homeButton = document.getElementById("homeButton");
const timeValue = document.getElementById("timeValue");
const scoreValue = document.getElementById("scoreValue");
const statusText = document.getElementById("statusText");
const overlay = document.getElementById("gameOverlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");
const hammerCursor = document.getElementById("hammerCursor");
const holes = [...document.querySelectorAll(".hole")];

const state = {
  activeHole: null,
  activeType: null,
  score: 0,
  timeLeft: GAME_DURATION,
  running: false,
  gameTimerId: null,
  popTimerId: null,
  canHit: false,
};

function createMoleMarkup() {
  return `
    <div class="mole">
      <span class="ear ear--left"></span>
      <span class="ear ear--right"></span>
      <span class="face"></span>
      <span class="eye eye--left"></span>
      <span class="eye eye--right"></span>
      <span class="nose"></span>
      <span class="tooth tooth--left"></span>
      <span class="tooth tooth--right"></span>
      <span class="arm arm--left"></span>
      <span class="arm arm--right"></span>
      <span class="claw claw--left"></span>
      <span class="claw claw--right"></span>
    </div>
  `;
}

function createBombMarkup() {
  return `
    <div class="bomb">
      <span class="bomb-mark">!</span>
    </div>
  `;
}

function setupHoles() {
  holes.forEach((hole) => {
    hole.innerHTML = `
      <span class="hole-inner"></span>
      <span class="character-wrap"></span>
    `;
  });
}

function randomPopDelay() {
  return Math.floor(Math.random() * (POP_MAX_MS - POP_MIN_MS + 1)) + POP_MIN_MS;
}

function setScreen(screenName) {
  const showStart = screenName === "start";
  startScreen.classList.toggle("active", showStart);
  gameScreen.classList.toggle("active", !showStart);
}

function updateHud() {
  timeValue.textContent = Math.max(0, state.timeLeft);
  scoreValue.textContent = state.score;
}

function clearActiveCharacter() {
  if (state.activeHole === null) {
    return;
  }

  const hole = holes[state.activeHole];
  hole.classList.remove("active", "hit");
  hole.dataset.type = "";
  hole.querySelector(".character-wrap").innerHTML = "";
  state.activeHole = null;
  state.activeType = null;
  state.canHit = false;
}

function handleHit(index) {
  if (!state.running || !state.canHit || state.activeHole !== index) {
    return;
  }

  ensureAudioReady();
  const hole = holes[index];
  const hitType = state.activeType;
  state.canHit = false;
  hole.classList.add("hit");

  if (hitType === "bomb") {
    playBomb();
    endGame("bomb");
    return;
  }

  playWhack();
  state.score += 1;
  updateHud();
  statusText.textContent = "Nice hit";
  window.clearTimeout(state.popTimerId);
  window.setTimeout(() => {
    clearActiveCharacter();
    if (state.running) {
      scheduleNextPop(180);
    }
  }, 180);
}

function chooseNextHole() {
  const nextIndex = Math.floor(Math.random() * holes.length);
  state.activeHole = nextIndex;
  state.activeType = Math.random() < BOMB_CHANCE ? "bomb" : "mole";

  const hole = holes[nextIndex];
  const characterWrap = hole.querySelector(".character-wrap");
  characterWrap.innerHTML = state.activeType === "bomb" ? createBombMarkup() : createMoleMarkup();
  hole.classList.add("active");
  hole.dataset.type = state.activeType;
  state.canHit = true;
  statusText.textContent = state.activeType === "bomb" ? "Avoid the bomb" : "Smash the mole!";

  window.clearTimeout(state.popTimerId);
  state.popTimerId = window.setTimeout(() => {
    if (state.activeType === "mole") {
      playMiss();
    }
    clearActiveCharacter();
    if (state.running) {
      scheduleNextPop(220);
    }
  }, randomPopDelay());
}

function scheduleNextPop(delay = 320) {
  window.clearTimeout(state.popTimerId);
  state.popTimerId = window.setTimeout(() => {
    if (state.running) {
      chooseNextHole();
    }
  }, delay);
}

function endGame(reason) {
  state.running = false;
  state.canHit = false;
  window.clearInterval(state.gameTimerId);
  window.clearTimeout(state.popTimerId);
  clearActiveCharacter();
  hammerCursor.classList.remove("down");
  overlayTitle.textContent = reason === "bomb" ? "Boom! You hit a bomb" : "Time's Up";
  overlayMessage.textContent = `Your score: ${state.score}`;
  overlay.classList.add("show");
  statusText.textContent = reason === "bomb" ? "Bomb exploded" : "Round finished";
}

function startGame() {
  ensureAudioReady();
  state.score = 0;
  state.timeLeft = GAME_DURATION;
  state.running = true;
  state.canHit = false;
  overlay.classList.remove("show");
  updateHud();
  statusText.textContent = "Smash the mole!";
  clearActiveCharacter();
  setScreen("game");

  window.clearInterval(state.gameTimerId);
  state.gameTimerId = window.setInterval(() => {
    state.timeLeft -= 1;
    updateHud();
    if (state.timeLeft <= 0) {
      endGame("time");
    }
  }, 1000);

  scheduleNextPop(450);
}

function goHome() {
  state.running = false;
  window.clearInterval(state.gameTimerId);
  window.clearTimeout(state.popTimerId);
  clearActiveCharacter();
  hammerCursor.classList.remove("down");
  overlay.classList.remove("show");
  setScreen("start");
}

holes.forEach((hole, index) => {
  hole.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    ensureAudioReady();
    handleHit(index);
  });
});

gameScreen.addEventListener("mousemove", (event) => {
  const bounds = gameScreen.getBoundingClientRect();
  hammerCursor.style.left = `${event.clientX - bounds.left + 18}px`;
  hammerCursor.style.top = `${event.clientY - bounds.top - 18}px`;
});

gameScreen.addEventListener("mousedown", () => {
  hammerCursor.classList.add("down");
});

gameScreen.addEventListener("mouseup", () => {
  hammerCursor.classList.remove("down");
});

gameScreen.addEventListener("mouseleave", () => {
  hammerCursor.classList.remove("down");
});

playButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
homeButton.addEventListener("click", goHome);

setupHoles();
updateHud();
setScreen("start");
