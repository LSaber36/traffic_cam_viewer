// ═══════════════════════════════════════════════════════════════
//  js/cards.js — Stream card construction and playback control
//
//  Depends on: config.js
//  Exports (globals): activePlayers, buildCard, escHtml, escAttr
// ═══════════════════════════════════════════════════════════════

// ── Helpers ──────────────────────────────────────────────────────

/** Escape a string for safe insertion as HTML text content. */
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Escape a string for safe use inside an HTML attribute value. */
function escAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── State ─────────────────────────────────────────────────────────

// Shared map: card element → { hls, video, playBtn }
const activePlayers = new Map();

// ─────────────────────────────────────────────────────────────
//  buildCard
// ─────────────────────────────────────────────────────────────
/**
 * Build and return a fully-wired .card DOM element for one stream.
 *
 * @param {object} stream  — entry from STREAMS array
 * @param {number} idx     — position index (for stagger animation)
 * @returns {HTMLElement}
 */
function buildCard(stream, idx) {
  const name    = stream.name    || 'Unnamed';
  const url     = stream.url     || '';
  const preview = stream.preview || '';
  const nearby  = stream.nearby  || '';
  const route   = stream.route   || '';

  // ── Build card element with inline HTML ──
  const previewHtml = preview
    ? `<img class="preview-img" src="${escAttr(preview)}" alt="${escAttr(name)}" loading="lazy">`
    : '';

  const subHtml = (route || nearby)
    ? `<div class="stream-sub">
         ${route  ? `<div class="stream-sub-route">Hwy ${escHtml(route)}</div>`   : ''}
         ${(route && nearby) ? `<div class="stream-sub-bullet">&middot;</div>` : ''}
         ${nearby ? `<div class="stream-sub-nearby">${escHtml(nearby)}</div>` : ''}
       </div>`
    : '';

  const card = document.createElement('div');
  card.className = 'card';
  card.style.animationDelay = `${Math.min(idx * 0.03, 0.4)}s`;

  card.innerHTML = `
    <div class="video-wrap">
      ${previewHtml}
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
        ${subHtml}
      </div>
      <div class="card-btns">
        <button class="cbtn btn-refresh-card" title="Refresh this stream">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
          </svg>
        </button>
        <button class="cbtn btn-play-card">&#9654;</button>
      </div>
    </div>
  `;

  // ── Query inner elements ──
  const video        = card.querySelector('video');
  const previewImg   = card.querySelector('.preview-img');
  const placeholder  = card.querySelector('.video-placeholder');
  const spinner      = card.querySelector('.spinner');
  const liveBadge    = card.querySelector('.live-badge');
  const errorOverlay = card.querySelector('.error-overlay');
  const retryBtn     = card.querySelector('.retry-btn');
  const playBtn      = card.querySelector('.btn-play-card');
  const refreshBtn   = card.querySelector('.btn-refresh-card');

  let hlsInst      = null;
  let isRunning    = false;
  let watchdogTimer = null;
  let lastTime      = null;
  let lastTimeStamp = null;

  // ── Watchdog ──────────────────────────────────────────────────
  // Periodically checks whether the video's currentTime is advancing.
  // If it hasn't moved within WATCHDOG_STALL_MS, the stream is silently
  // refreshed.

  function startWatchdog() {
    stopWatchdog();
    lastTime      = null;
    lastTimeStamp = null;
    watchdogTimer = setInterval(() => {
      // Only check if we're supposed to be playing
      if (!isRunning || video.paused) return;

      const now = Date.now();
      const ct  = video.currentTime;

      if (lastTime === null) {
        lastTime      = ct;
        lastTimeStamp = now;
        return;
      }

      const timeSinceCheck = now - lastTimeStamp;
      const timeAdvanced   = ct - lastTime;

      if (timeSinceCheck >= WATCHDOG_STALL_MS && timeAdvanced < 0.1) {
        // Stream appears stalled — auto-refresh silently
        console.warn(`[watchdog] Stream stalled: "${stream.name}" — refreshing`);
        refreshStream();
      } else {
        lastTime      = ct;
        lastTimeStamp = now;
      }
    }, WATCHDOG_INTERVAL_MS);
  }

  function stopWatchdog() {
    if (watchdogTimer !== null) {
      clearInterval(watchdogTimer);
      watchdogTimer = null;
    }
    lastTime      = null;
    lastTimeStamp = null;
  }

  // ── startStream ──────────────────────────────────────────────
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
      playBtn.textContent = '\u23F8';   // ⏸
      startWatchdog();
    }

    function onError() {
      isRunning = false;
      stopWatchdog();
      spinner.classList.remove('active');
      errorOverlay.classList.add('show');
      liveBadge.classList.remove('show');
      playBtn.classList.remove('play-active');
      playBtn.textContent = '\u25B6';   // ▶
      if (previewImg) previewImg.classList.remove('hidden');
      if (hls) { hls.destroy(); hls = null; }
      hlsInst = null;
      activePlayers.delete(card);
    }

    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); });
      hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) onError(); });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
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

  // ── pauseStream ──────────────────────────────────────────────
  function pauseStream() {
    stopWatchdog();
    video.pause();
    liveBadge.classList.remove('show');
    playBtn.classList.remove('play-active');
    playBtn.textContent = '\u25B6';      // ▶
  }

  // ── stopStream ───────────────────────────────────────────────
  function stopStream() {
    isRunning = false;
    stopWatchdog();
    if (hlsInst) { hlsInst.destroy(); hlsInst = null; }
    video.pause();
    video.src = '';
    placeholder.classList.remove('hidden');
    spinner.classList.remove('active');
    liveBadge.classList.remove('show');
    errorOverlay.classList.remove('show');
    playBtn.classList.remove('play-active');
    playBtn.textContent = '\u25B6';      // ▶
    if (previewImg) previewImg.classList.remove('hidden');
    activePlayers.delete(card);
  }

  // ── refreshStream ────────────────────────────────────────────
  function refreshStream() {
    stopStream();
    setTimeout(startStream, REFRESH_DELAY_MS);
  }

  // ── Attach handles used by navbar.js / render.js ─────────────
  card._startStream   = startStream;
  card._pauseStream   = pauseStream;
  card._stopStream    = stopStream;
  card._refreshStream = refreshStream;

  // ── Event listeners ──────────────────────────────────────────
  placeholder.addEventListener('click', startStream);
  retryBtn.addEventListener('click', () => { stopStream(); startStream(); });
  refreshBtn.addEventListener('click', refreshStream);

  playBtn.addEventListener('click', () => {
    if (!isRunning) {
      startStream();
      return;
    }
    if (video.paused) {
      video.play().catch(() => {});
      liveBadge.classList.add('show');
      playBtn.classList.add('play-active');
      playBtn.textContent = '\u23F8';   // ⏸
    } else {
      pauseStream();
    }
  });

  return card;
}
