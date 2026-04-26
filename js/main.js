// ═══════════════════════════════════════════════════════════════
//  js/render.js — Grid rendering and application boot
//
//  Depends on: config.js, cards.js, navbar.js,
//              selector.js, streams.js (STREAMS)
// ═══════════════════════════════════════════════════════════════

// ── Helpers ──────────────────────────────────────────────────────

/** Show the fetch-error popup with a specific message. */
function showErrorPopup(message) {
  const overlay = document.getElementById('popup-overlay');
  const msgEl   = document.getElementById('popup-message');
  if (overlay) {
    if (msgEl && message) msgEl.textContent = message;
    overlay.classList.add('show');
  }
}

// ── Grid ─────────────────────────────────────────────────────────

const _gridEl = document.getElementById('grid');

// ═══════════════════════════════════════════════════════════════
//  renderGrid
//  Rebuilds the card grid using only the streams in enabledSet.
// ═══════════════════════════════════════════════════════════════
async function renderGrid() {
  _gridEl.innerHTML = '';

  const toShow = window.STREAMS.filter((_, i) => enabledSet.has(i));

  if (!toShow.length) {
    _gridEl.innerHTML =
      '<div id="empty" style="display:block">' +
        'No streams selected.<br>Use the <strong>Streams</strong> menu to pick cameras.' +
      '</div>';
    return;
  }

  for (let i = 0; i < toShow.length; i++) {
    const stream = toShow[i];

    // Check 3: probe preview image before building the card.
    // Caught independently — does not bubble up to boot's catch.
    if (stream.preview) {
      try {
        const res = await fetch(stream.preview, { method: 'HEAD' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        console.warn(`[renderGrid] Preview unavailable for "${stream.name}":`, err.message);
        showErrorPopup('A camera preview could not be loaded. The Caltrans server may be temporarily unavailable.');
        return;
      }
    }

    _gridEl.appendChild(buildCard(stream, i));
  }
}

// ═══════════════════════════════════════════════════════════════
//  Boot
// ═══════════════════════════════════════════════════════════════
(async function boot() {
  try {
    // Check 1: internet connectivity — direct showErrorPopup call
    if (!navigator.onLine) {
      showErrorPopup('Your device appears to be offline. Please check your internet connection and try again.');
      return;
    }

    // Wait for streams.js to finish fetching all CSVs
    if (typeof window.streamsReady !== 'undefined') {
      await window.streamsReady;
    }

    // Check 2: CSV fetch failed — direct showErrorPopup call
    if (!Array.isArray(window.CALTRANS_DISTRICTS) || window.CALTRANS_DISTRICTS.length === 0) {
      showErrorPopup('District and county data could not be loaded. The Caltrans server may be temporarily unavailable.');
      return;
    }

    // Populate the district dropdown
    _populateDistrictDropdown();

    // Populate _committed with the boot-loaded streams
    _committed.districtId = DEFAULT_DISTRICT;
    _committed.county     = DEFAULT_COUNTY;
    _committed.lonEnabled = DEFAULT_LONGITUDE_ENABLED;
    _committed.lonMin     = DEFAULT_LONGITUDE_MIN;
    _committed.lonMax     = DEFAULT_LONGITUDE_MAX;
    _committed.streams    = window.STREAMS || [];
    _committed.enabledSet.clear();
    (window.STREAMS || []).forEach((_, i) => _committed.enabledSet.add(i));

    // Sync the shared enabledSet
    enabledSet.clear();
    (window.STREAMS || []).forEach((_, i) => enabledSet.add(i));
    updateSelCount();

    // Apply default column size
    applySize(DEFAULT_STREAM_SIZE);

    // Render the initial grid (check 3 — preview — is inside renderGrid)
    await renderGrid();

  } catch (err) {
    // Check 4: fallback for any unexpected error
    console.error('[render.js] Unexpected boot error:', err);
    showErrorPopup('An unexpected error occurred. Please refresh the page and try again.');
  }
})();
