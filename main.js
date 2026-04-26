// ═══════════════════════════════════════════════════════════════
//  main.js — Caltrans D3 Stream Viewer  (logic + behaviour)
//  Depends on: streams.js (must load first), hls.js (CDN)
// ═══════════════════════════════════════════════════════════════

// ── CONSTANT ────────────────────────────────────────────────────
//  Change this to set the default number of columns on first load.
const DEFAULT_SIZE = 4;

// ── State ───────────────────────────────────────────────────────
const activePlayers = new Map();
let   globalPlaying = false;
let   enabledSet    = new Set();

// ── DOM refs ────────────────────────────────────────────────────
const grid         = document.getElementById('grid');
const sizeSlider   = document.getElementById('size-slider');
const sizeInput    = document.getElementById('size-input');
const btnMinus     = document.getElementById('btn-size-minus');
const btnPlus      = document.getElementById('btn-size-plus');
const themeTrack   = document.getElementById('theme-track');
const themeLabel   = document.getElementById('theme-label');
const btnStreams    = document.getElementById('btn-streams');
const selectorPanel= document.getElementById('selector-panel');
const backdrop     = document.getElementById('backdrop');
const selList      = document.getElementById('selector-list');
const selSearch    = document.getElementById('sel-search');
const selCount     = document.getElementById('sel-count');
const btnPlayAll   = document.getElementById('btn-play-all');
const playAllIcon  = document.getElementById('play-all-icon');
const playAllLabel = document.getElementById('play-all-label');

const ICON_PLAY  = `<polygon points="5,3 19,12 5,21"/>`;
const ICON_PAUSE = `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`;

// ═══════════════════════════════════════════════════════════════
//  Size control  (slider ↔ number input ↔ ± buttons)
// ═══════════════════════════════════════════════════════════════
function applySize(n) {
  n = Math.max(1, Math.min(10, Math.round(n)));
  sizeSlider.value = n;
  sizeInput.value  = n;
  btnMinus.disabled = (n <= 1);
  btnPlus.disabled  = (n >= 10);
  // Recalc a sensible minimum card width so cards never overflow
  const minPx = Math.max(100, Math.floor((window.innerWidth - 40) / n) - 14);
  grid.style.gridTemplateColumns = `repeat(${n}, minmax(${minPx}px, 1fr))`;
}

sizeSlider.addEventListener('input', () => applySize(+sizeSlider.value));

sizeInput.addEventListener('input', () => {
  const v = parseInt(sizeInput.value, 10);
  if (!isNaN(v)) applySize(v);
});
sizeInput.addEventListener('blur', () => {
  let v = parseInt(sizeInput.value, 10);
  if (isNaN(v) || v < 1)  v = 1;
  if (v > 10) v = 10;
  applySize(v);
});
sizeInput.addEventListener('keydown', e => { if (e.key === 'Enter') sizeInput.blur(); });

btnMinus.addEventListener('click', () => applySize(+sizeSlider.value - 1));
btnPlus.addEventListener('click',  () => applySize(+sizeSlider.value + 1));

window.addEventListener('resize', () => applySize(+sizeSlider.value));

// ═══════════════════════════════════════════════════════════════
//  Theme toggle
// ═══════════════════════════════════════════════════════════════
let lightMode = false;

themeTrack.addEventListener('click', () => {
  lightMode = !lightMode;
  document.documentElement.setAttribute('data-theme', lightMode ? 'light' : 'dark');
  themeTrack.classList.toggle('light-on', lightMode);
  themeLabel.textContent = lightMode ? 'Light' : 'Dark';
});

// ═══════════════════════════════════════════════════════════════
//  Stream Selector Panel
// ═══════════════════════════════════════════════════════════════
function openSelector() {
  selectorPanel.classList.add('open');
  backdrop.classList.add('open');
  btnStreams.classList.add('active');
  selSearch.value = '';
  renderSelItems('');
  selSearch.focus();
}

function closeSelector() {
  selectorPanel.classList.remove('open');
  backdrop.classList.remove('open');
  btnStreams.classList.remove('active');
}

btnStreams.addEventListener('click', e => {
  e.stopPropagation();
  selectorPanel.classList.contains('open') ? closeSelector() : openSelector();
});

backdrop.addEventListener('click', closeSelector);

selSearch.addEventListener('input', () => renderSelItems(selSearch.value.toLowerCase()));

document.getElementById('sel-all').addEventListener('click', () => {
  STREAMS.forEach((_, i) => enabledSet.add(i));
  renderSelItems(selSearch.value.toLowerCase());
});

document.getElementById('sel-none').addEventListener('click', () => {
  enabledSet.clear();
  renderSelItems(selSearch.value.toLowerCase());
});

document.getElementById('sel-apply').addEventListener('click', () => {
  closeSelector();
  stopAllPlayers();
  renderGrid();
});

function updateSelCount() {
  selCount.textContent = `${enabledSet.size} selected`;
}

function renderSelItems(filter) {
  selList.innerHTML = '';
  STREAMS.forEach((s, i) => {
    const name = s.name || 'Unnamed';
    if (filter && !name.toLowerCase().includes(filter)) return;

    const row  = document.createElement('div');
    row.className = 'sel-item';

    const cb = document.createElement('input');
    cb.type      = 'checkbox';
    cb.className = 'sel-checkbox';
    cb.checked   = enabledSet.has(i);
    cb.addEventListener('change', () => {
      cb.checked ? enabledSet.add(i) : enabledSet.delete(i);
      updateSelCount();
    });

    const nameEl = document.createElement('div');
    nameEl.className   = 'sel-name';
    nameEl.textContent = name;

    const sub = document.createElement('div');
    sub.className   = 'sel-sub';
    sub.textContent = s.route ? `Hwy ${s.route}` : '';

    row.appendChild(cb);
    row.appendChild(nameEl);
    row.appendChild(sub);

    row.addEventListener('click', e => {
      if (e.target === cb) return;
      cb.checked = !cb.checked;
      cb.checked ? enabledSet.add(i) : enabledSet.delete(i);
      updateSelCount();
    });

    selList.appendChild(row);
  });
  updateSelCount();
}

// ═══════════════════════════════════════════════════════════════
//  Global Play / Pause all
// ═══════════════════════════════════════════════════════════════
btnPlayAll.addEventListener('click', () => {
  globalPlaying = !globalPlaying;

  if (globalPlaying) {
    btnPlayAll.classList.add('active');
    playAllIcon.innerHTML    = ICON_PAUSE;
    playAllLabel.textContent = 'Pause All';
    document.querySelectorAll('.card').forEach(card => {
      const state = activePlayers.get(card);
      if (!state) {
        card._startStream && card._startStream();
      } else {
        state.video.play().catch(() => {});
        state.playBtn.classList.add('play-active');
        state.playBtn.textContent = '⏸';
      }
    });
  } else {
    btnPlayAll.classList.remove('active');
    playAllIcon.innerHTML    = ICON_PLAY;
    playAllLabel.textContent = 'Play All';
    activePlayers.forEach(({ video, playBtn }) => {
      video.pause();
      playBtn.classList.remove('play-active');
      playBtn.textContent = '▶';
    });
  }
});

// ═══════════════════════════════════════════════════════════════
//  Global Refresh all
// ═══════════════════════════════════════════════════════════════
document.getElementById('btn-refresh-all').addEventListener('click', () => {
  document.querySelectorAll('.card').forEach(c => c._refreshStream && c._refreshStream());
});

// ═══════════════════════════════════════════════════════════════
//  Stop all players helper
// ═══════════════════════════════════════════════════════════════
function stopAllPlayers() {
  activePlayers.forEach(({ hls }) => { try { hls && hls.destroy(); } catch (e) {} });
  activePlayers.clear();
  globalPlaying = false;
  btnPlayAll.classList.remove('active');
  playAllIcon.innerHTML    = ICON_PLAY;
  playAllLabel.textContent = 'Play All';
}

// ═══════════════════════════════════════════════════════════════
//  Render grid  (honours enabledSet)
// ═══════════════════════════════════════════════════════════════
function renderGrid() {
  grid.innerHTML = '';
  const toShow = STREAMS.filter((_, i) => enabledSet.has(i));

  if (!toShow.length) {
    grid.innerHTML = '<div id="empty" style="display:block">No streams selected. Use the Streams menu to pick cameras.</div>';
    return;
  }

  toShow.forEach((stream, i) => grid.appendChild(buildCard(stream, i)));
}

// ═══════════════════════════════════════════════════════════════
//  Build one card
// ═══════════════════════════════════════════════════════════════
function buildCard(stream, idx) {
  const name    = stream.name    || 'Unnamed';
  const url     = stream.url     || '';
  const preview = stream.preview || '';
  const nearby  = stream.nearby  || '';
  const route   = stream.route   || '';

  const card = document.createElement('div');
  card.className = 'card';
  card.style.animationDelay = `${Math.min(idx * 0.03, 0.4)}s`;

  card.innerHTML = `
    <div class="video-wrap">
      ${preview ? `<img class="preview-img" src="${escAttr(preview)}" alt="${escAttr(name)}" loading="lazy">` : ''}
      <video playsinline muted></video>
      <div class="video-placeholder">
        <div class="play-circle">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff">
            <polygon points="6,3 20,12 6,21"/>
          </svg>
        </div>
      </div>
      <div class="spinner"><div class="spin-ring"></div></div>
      <div class="live-badge"><div class="live-dot"></div>LIVE</div>
      <div class="error-overlay">
        <div class="err-icon">&#9888;</div>
        <div>Stream unavailable<br>or CORS restricted</div>
        <button class="retry-btn">Retry</button>
      </div>
    </div>
    <div class="card-info">
      <div class="card-name-block">
        <div class="stream-name">${escHtml(name)}</div>
        ${nearby ? `<div class="stream-sub">${escHtml(route ? 'Hwy ' + route + ' \u00B7 ' + nearby : nearby)}</div>` : ''}
      </div>
      <div class="card-btns">
        <button class="cbtn btn-refresh-card" title="Refresh">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
          </svg>
        </button>
        <button class="cbtn btn-play-card">&#9654;</button>
      </div>
    </div>
  `;

  const video        = card.querySelector('video');
  const previewImg   = card.querySelector('.preview-img');
  const placeholder  = card.querySelector('.video-placeholder');
  const spinner      = card.querySelector('.spinner');
  const liveBadge    = card.querySelector('.live-badge');
  const errorOverlay = card.querySelector('.error-overlay');
  const retryBtn     = card.querySelector('.retry-btn');
  const playBtn      = card.querySelector('.btn-play-card');
  const refreshBtn   = card.querySelector('.btn-refresh-card');

  let hlsInst   = null;
  let isRunning = false;

  function startStream() {
    if (isRunning) return;
    isRunning = true;
    placeholder.classList.add('hidden');
    errorOverlay.classList.remove('show');
    spinner.classList.add('active');
    if (previewImg) previewImg.classList.add('hidden');

    let hls = null;

    function onPlaying() {
      spinner.classList.remove('active');
      liveBadge.classList.add('show');
      playBtn.classList.add('play-active');
      playBtn.textContent = '\u23F8';
    }

    function onError() {
      isRunning = false;
      spinner.classList.remove('active');
      errorOverlay.classList.add('show');
      liveBadge.classList.remove('show');
      playBtn.classList.remove('play-active');
      playBtn.textContent = '\u25B6';
      if (previewImg) previewImg.classList.remove('hidden');
      if (hls) { hls.destroy(); hls = null; }
      hlsInst = null;
      activePlayers.delete(card);
    }

    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); });
      hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) onError(); });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('error', onError, { once: true });
      video.play().catch(onError);
    } else {
      onError();
      return;
    }

    video.addEventListener('playing', onPlaying, { once: true });
    hlsInst = hls;
    activePlayers.set(card, { hls, video, playBtn });
  }

  function stopStream() {
    isRunning = false;
    if (hlsInst) { hlsInst.destroy(); hlsInst = null; }
    video.pause();
    video.src = '';
    placeholder.classList.remove('hidden');
    spinner.classList.remove('active');
    liveBadge.classList.remove('show');
    errorOverlay.classList.remove('show');
    playBtn.classList.remove('play-active');
    playBtn.textContent = '\u25B6';
    if (previewImg) previewImg.classList.remove('hidden');
    activePlayers.delete(card);
  }

  function refreshStream() {
    stopStream();
    setTimeout(startStream, 80);
  }

  card._startStream   = startStream;
  card._stopStream    = stopStream;
  card._refreshStream = refreshStream;

  placeholder.addEventListener('click', startStream);
  retryBtn.addEventListener('click', () => { stopStream(); startStream(); });
  refreshBtn.addEventListener('click', refreshStream);

  playBtn.addEventListener('click', () => {
    if (!isRunning) { startStream(); return; }
    if (video.paused) {
      video.play().catch(() => {});
      playBtn.classList.add('play-active');
      playBtn.textContent = '\u23F8';
    } else {
      stopStream();
    }
  });

  return card;
}

// ═══════════════════════════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════════════════════════
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ═══════════════════════════════════════════════════════════════
//  Boot
// ═══════════════════════════════════════════════════════════════
STREAMS.forEach((_, i) => enabledSet.add(i));
updateSelCount();
applySize(DEFAULT_SIZE);
renderGrid();
