// ═══════════════════════════════════════════════════════════════
//  js/navbar.js — Navigation bar interactivity
//
//  Covers: stream size control (slider + ± buttons),
//          light/dark theme toggle, global play/pause all,
//          global refresh all.
//
//  Internally tracks COLUMNS (higher = smaller streams).
//  The − button increases size (fewer columns).
//  The + button decreases size (more columns).
//  The text input is hidden from the user.
//
//  Depends on: config.js, cards.js (activePlayers)
// ═══════════════════════════════════════════════════════════════

// ── DOM refs ─────────────────────────────────────────────────────
const _grid          = document.getElementById('grid');
const _colSlider     = document.getElementById('size-slider');
const _colInput      = document.getElementById('size-input');     // hidden internal input
const _sizeDisplay   = document.getElementById('size-display');   // visible user-facing input
const _btnDecrease   = document.getElementById('btn-size-minus');
const _btnIncrease   = document.getElementById('btn-size-plus');
const _themeTrack    = document.getElementById('theme-track');
const _themeLabel    = document.getElementById('theme-label');
const _btnPlayAll    = document.getElementById('btn-play-all');
const _playAllIcon   = document.getElementById('play-all-icon');
const _playAllLbl    = document.getElementById('play-all-label');

// ── Module state ─────────────────────────────────────────────────
let _globalPlaying = false;
let _lightMode     = false;

// ═══════════════════════════════════════════════════════════════
//  Stream size control  (slider ↔ ± buttons, input hidden)
//
//  Columns and size are inversely proportional:
//    − button → fewer columns → streams appear larger
//    + button → more columns  → streams appear smaller
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
//  Stream size control  (slider + ± buttons show streamSize;
//                        grid uses columns, which mirrors it)
//
//  streamSize = COLUMNS_RANGE - columns  (mirrors columns)
//  columns    = COLUMNS_RANGE - streamSize
//
//  Slider and buttons operate on streamSize.
//  The grid always uses the derived columns value.
// ═══════════════════════════════════════════════════════════════

function applySize(streamSize) {
  streamSize = Math.max(COLUMNS_MIN, Math.min(COLUMNS_MAX, Math.round(streamSize)));
  const columns = COLUMNS_RANGE - streamSize;

  // Sync all controls to streamSize
  _colSlider.value    = streamSize;
  _colInput.value     = streamSize;
  _sizeDisplay.value  = streamSize;

  _btnDecrease.disabled = (streamSize <= COLUMNS_MIN);
  _btnIncrease.disabled = (streamSize >= COLUMNS_MAX);

  if (columns === 1) {
    // At max size (1 column), fit the entire card (video + footer) within
    // the available vertical space so it doesn't bleed off the bottom.
    const headerH  = document.querySelector('header').offsetHeight;
    const availH   = window.innerHeight - headerH - 40; // subtract header + main padding

    // Card footer is ~50px. Video portion is the remainder at 16:9 aspect.
    const footerH  = 50;
    const videoH   = availH - footerH;
    const cardW    = Math.floor(videoH * (16 / 9));

    _grid.style.gridTemplateColumns = `minmax(0, ${cardW}px)`;
    _grid.style.justifyContent = 'center';
  } else {
    const minPx = Math.max(100, Math.floor((window.innerWidth - 40) / columns) - 14);
    _grid.style.gridTemplateColumns = `repeat(${columns}, minmax(${minPx}px, 1fr))`;
    _grid.style.justifyContent = '';
  }
}

_colSlider.addEventListener('input', () => applySize(+_colSlider.value));
_btnDecrease.addEventListener('click', () => applySize(+_colSlider.value - 1));
_btnIncrease.addEventListener('click', () => applySize(+_colSlider.value + 1));
window.addEventListener('resize', () => applySize(+_colSlider.value));

// User can type a stream size directly into the display input
_sizeDisplay.addEventListener('input', () => {
  const v = parseInt(_sizeDisplay.value, 10);
  if (!isNaN(v)) applySize(v);
});
_sizeDisplay.addEventListener('blur', () => {
  let v = parseInt(_sizeDisplay.value, 10);
  if (isNaN(v) || v < COLUMNS_MIN) v = COLUMNS_MIN;
  if (v > COLUMNS_MAX)             v = COLUMNS_MAX;
  applySize(v);
});
_sizeDisplay.addEventListener('keydown', e => {
  if (e.key === 'Enter') _sizeDisplay.blur();
});

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
