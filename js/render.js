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
(function boot() {
  // 1. Detect missing streams.js — STREAMS will be undefined
  if (typeof STREAMS === 'undefined' || !Array.isArray(STREAMS)) {
    showMissingFilePopup('streams.js');
    return;
  }

  // 2. Enable all streams by default
  STREAMS.forEach((_, i) => enabledSet.add(i));
  updateSelCount();        // from selector.js

  // 3. Apply default column size
  applySize(DEFAULT_SIZE); // from navbar.js

  // 4. Render the initial grid
  renderGrid();
})();
