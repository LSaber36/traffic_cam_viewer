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

  const toShow = window.STREAMS.filter((_, i) => enabledSet.has(i));

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
(async function boot() {
  // 1. Wait for streams.js — fetches all CSVs and builds CALTRANS_DISTRICTS
  if (typeof window.streamsReady !== 'undefined') {
    await window.streamsReady;
  }

  // 2. Populate the district dropdown now that CALTRANS_DISTRICTS is ready
  _populateDistrictDropdown();   // from selector.js

  // 3. If default STREAMS failed to load, show popup
  if (!Array.isArray(window.STREAMS)) {
    showMissingFilePopup('traffic_cams.csv');
    return;
  }

  // 4. Populate _committed with the boot-loaded streams
  _committed.districtId = DEFAULT_DISTRICT;
  _committed.county     = DEFAULT_COUNTY;
  _committed.lonEnabled = DEFAULT_LONGITUDE_ENABLED;
  _committed.lonMin     = DEFAULT_LONGITUDE_MIN;
  _committed.lonMax     = DEFAULT_LONGITUDE_MAX;
  _committed.streams    = window.STREAMS;
  _committed.enabledSet.clear();
  window.STREAMS.forEach((_, i) => _committed.enabledSet.add(i));

  // 5. Sync the shared enabledSet
  enabledSet.clear();
  window.STREAMS.forEach((_, i) => enabledSet.add(i));
  updateSelCount();        // from selector.js

  // 6. Apply default column size
  applySize(DEFAULT_STREAM_SIZE); // from navbar.js

  // 7. Render the initial grid
  renderGrid();
})();
