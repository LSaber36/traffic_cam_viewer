// ═══════════════════════════════════════════════════════════════
//  js/navbar.js — Navigation bar interactivity
//
//  Covers: stream size control (slider + input + ± buttons),
//          light/dark theme toggle, global play/pause all,
//          global refresh all.
//
//  Depends on: config.js, cards.js (activePlayers)
// ═══════════════════════════════════════════════════════════════

// ── DOM refs ─────────────────────────────────────────────────────
const _grid       = document.getElementById('grid');
const _sizeSlider = document.getElementById('size-slider');
const _sizeInput  = document.getElementById('size-input');
const _btnMinus   = document.getElementById('btn-size-minus');
const _btnPlus    = document.getElementById('btn-size-plus');
const _themeTrack = document.getElementById('theme-track');
const _themeLabel = document.getElementById('theme-label');
const _btnPlayAll  = document.getElementById('btn-play-all');
const _playAllIcon = document.getElementById('play-all-icon');
const _playAllLbl  = document.getElementById('play-all-label');

// ── Module state ─────────────────────────────────────────────────
let _globalPlaying = false;
let _lightMode     = false;

// ═══════════════════════════════════════════════════════════════
//  Stream Size control  (slider ↔ text input ↔ ± buttons)
// ═══════════════════════════════════════════════════════════════

/**
 * Apply n columns to the grid, clamping to [SIZE_MIN, SIZE_MAX].
 * Keeps slider, input and ± disabled states in sync.
 * @param {number} n
 */
function applySize(n) {
  n = Math.max(SIZE_MIN, Math.min(SIZE_MAX, Math.round(n)));
  _sizeSlider.value = n;
  _sizeInput.value  = n;
  _btnMinus.disabled = (n <= SIZE_MIN);
  _btnPlus.disabled  = (n >= SIZE_MAX);

  // Compute a sensible minimum card width so cards never overflow
  const minPx = Math.max(100, Math.floor((window.innerWidth - 40) / n) - 14);
  _grid.style.gridTemplateColumns = `repeat(${n}, minmax(${minPx}px, 1fr))`;
}

// Wire up controls
_sizeSlider.addEventListener('input', () => applySize(+_sizeSlider.value));

_sizeInput.addEventListener('input', () => {
  const v = parseInt(_sizeInput.value, 10);
  if (!isNaN(v)) applySize(v);
});
_sizeInput.addEventListener('blur', () => {
  let v = parseInt(_sizeInput.value, 10);
  if (isNaN(v) || v < SIZE_MIN) v = SIZE_MIN;
  if (v > SIZE_MAX)             v = SIZE_MAX;
  applySize(v);
});
_sizeInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') _sizeInput.blur();
});

_btnMinus.addEventListener('click', () => applySize(+_sizeSlider.value - 1));
_btnPlus.addEventListener('click',  () => applySize(+_sizeSlider.value + 1));

// Re-apply on window resize so minPx recalculates
window.addEventListener('resize', () => applySize(+_sizeSlider.value));

// ═══════════════════════════════════════════════════════════════
//  Theme toggle
// ═══════════════════════════════════════════════════════════════
_themeTrack.addEventListener('click', () => {
  _lightMode = !_lightMode;
  document.documentElement.setAttribute('data-theme', _lightMode ? 'light' : 'dark');
  _themeTrack.classList.toggle('light-on', _lightMode);
  _themeLabel.textContent = _lightMode ? 'Light' : 'Dark';
});

// ═══════════════════════════════════════════════════════════════
//  Global Play / Pause all
// ═══════════════════════════════════════════════════════════════
_btnPlayAll.addEventListener('click', () => {
  _globalPlaying = !_globalPlaying;

  if (_globalPlaying) {
    _btnPlayAll.classList.add('active');
    _playAllIcon.innerHTML = ICON_PAUSE;
    _playAllLbl.textContent = 'Pause All';

    document.querySelectorAll('.card').forEach(card => {
      const state = activePlayers.get(card);
      if (!state) {
        // Card not yet playing — start it
        card._startStream && card._startStream();
      } else {
        // Already in the map — just resume
        state.video.play().catch(() => {});
        state.video.dispatchEvent(new Event('playing'));   // trigger badge update
        state.playBtn.classList.add('play-active');
        state.playBtn.textContent = '\u23F8';
      }
    });
  } else {
    _btnPlayAll.classList.remove('active');
    _playAllIcon.innerHTML = ICON_PLAY;
    _playAllLbl.textContent = 'Play All';

    // Pause each active player (not stop — keep HLS alive)
    activePlayers.forEach(({ video, playBtn }, card) => {
      video.pause();
      card.querySelector('.live-badge').classList.remove('show');
      playBtn.classList.remove('play-active');
      playBtn.textContent = '\u25B6';
    });
  }
});

// ═══════════════════════════════════════════════════════════════
//  Global Refresh all
// ═══════════════════════════════════════════════════════════════
document.getElementById('btn-refresh-all').addEventListener('click', () => {
  // Refresh restarts all streams, so set state to "playing"
  _globalPlaying = true;
  _btnPlayAll.classList.add('active');
  _playAllIcon.innerHTML = ICON_PAUSE;
  _playAllLbl.textContent = 'Pause All';

  document.querySelectorAll('.card').forEach(c => {
    c._refreshStream && c._refreshStream();
  });
});

// ═══════════════════════════════════════════════════════════════
//  stopAllPlayers  (called by selector.js when Apply is clicked)
// ═══════════════════════════════════════════════════════════════
function stopAllPlayers() {
  activePlayers.forEach(({ hls }) => {
    try { hls && hls.destroy(); } catch (e) {}
  });
  activePlayers.clear();

  _globalPlaying = false;
  _btnPlayAll.classList.remove('active');
  _playAllIcon.innerHTML = ICON_PLAY;
  _playAllLbl.textContent = 'Play All';
}
