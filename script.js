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
  window.setTimeout(() => {
    clearActiveCharacter();
    if (state.running) {
      scheduleNextPop(180);
    }
  }, 180);
}