function handleHit(index) {
  if (!state.running || !state.canHit || state.activeHole !== index) {
    return;
  }
  
  // Add check for active character presence
  const hole = holes[index];
  const characterWrap = hole.querySelector('.character-wrap');
  if (!characterWrap || !characterWrap.firstChild) {
    return;
  }
  
  ensureAudioReady();
  const hitType = state.activeType;
  state.canHit = false;
  hole.classList.add('hit');

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
  
  // Define game duration in seconds
  const GAME_DURATION = 60; // 1 minute = 60 seconds
  
  // Calculate remaining time
  const remainingTime = GAME_DURATION - Math.floor(Date.now() / 1000);
  
  // Set a countdown timer
  window.setTimeout(() => {
    clearActiveCharacter();
    if (state.running && remainingTime > 0) {
      scheduleNextPop(180);
    } else if (state.running) {
      endGame("time");
    }
  }, 180);
}