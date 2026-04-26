// ═══════════════════════════════════════════════════════════════
//  js/render.js — Grid rendering and application boot
//
//  Covers: renderGrid, missing-file popup,
//          detecting missing streams.js, boot sequence.
//
//  Depends on: config.js, cards.js, navbar.js,
//              selector.js, streams.js (STREAMS)
// ═══════════════════════════════════════════════════════════════

// ── Helpers ──────────────────────────────────────────────────────

/** Show the missing-file popup with a custom filename. */
function showMissingFilePopup(filename) {
  const overlay = document.getElementById('popup-overlay');
  const fileEl  = document.getElementById('popup-filename');
  if (overlay) {
    if (fileEl) fileEl.textContent = filename;
    overlay.classList.add('show');
  }
}

// ── Grid ─────────────────────────────────────────────────────────

const _gridEl = document.getElementById('grid');

// ═══════════════════════════════════════════════════════════════
//  renderGrid
//  Rebuilds the card grid using only the streams in enabledSet.
// ═══════════════════════════════════════════════════════════════
function renderGrid() {
  _gridEl.innerHTML = '';

  const toShow = STREAMS.filter((_, i) => enabledSet.has(i));

  if (!toShow.length) {
    _gridEl.innerHTML =
      '<div id="empty" style="display:block">' +
        'No streams selected.<br>Use the <strong>Streams</strong> menu to pick cameras.' +
      '</div>';
    return;
  }

  toShow.forEach((stream, i) => _gridEl.appendChild(buildCard(stream, i)));
}

// ═══════════════════════════════════════════════════════════════
//  Boot
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
//  Boot
// ═══════════════════════════════════════════════════════════════
(async function boot() {
  // 1. Wait for PapaParse to finish loading traffic_cams.csv
  if (typeof window.streamsReady !== 'undefined') {
    await window.streamsReady;
  }

  // 2. If STREAMS failed to build, show the missing file popup
  if (!Array.isArray(window.STREAMS)) {
    showMissingFilePopup('traffic_cams.csv');
    return;
  }

  // 3. Enable all streams by default
  STREAMS.forEach((_, i) => enabledSet.add(i));
  updateSelCount();        // from selector.js

  // 4. Apply default column size
  applySize(DEFAULT_STREAM_SIZE); // from navbar.js

  // 5. Render the initial grid
  renderGrid();
})();
