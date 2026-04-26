// ═══════════════════════════════════════════════════════════════
//  js/selector.js — Stream selector dropdown panel
//
//  Covers: open/close panel, "Select All" master checkbox,
//          per-stream checkboxes, search filter, Apply button.
//
//  Depends on: helpers.js, navbar.js (stopAllPlayers),
//              render.js (renderGrid), streams.js (STREAMS)
// ═══════════════════════════════════════════════════════════════

// ── DOM refs ─────────────────────────────────────────────────────
const _btnStreams    = document.getElementById('btn-streams');
const _selectorPanel = document.getElementById('selector-panel');
const _backdrop      = document.getElementById('backdrop');
const _selList       = document.getElementById('selector-list');
const _selSearch     = document.getElementById('sel-search');
const _selCount      = document.getElementById('sel-count');
const _selAllCb      = document.getElementById('sel-all-cb');

// ── State shared with render.js ───────────────────────────────────
// Set of STREAMS indices that are currently enabled (shown on grid)
const enabledSet = new Set();

// ═══════════════════════════════════════════════════════════════
//  Panel open / close
// ═══════════════════════════════════════════════════════════════
function openSelector() {
  // Position the panel so its left edge aligns with the button's left edge
  const btnRect = _btnStreams.getBoundingClientRect();
  const panelWidth = 290;
  const btnMid = btnRect.left + btnRect.width / 2;
  _selectorPanel.style.top   = (btnRect.bottom + 8) + 'px';
  _selectorPanel.style.left  = Math.max(8, btnMid - panelWidth / 2) + 'px';
  _selectorPanel.style.right = 'auto';

  // Cut a hole in the backdrop over the button so it stays clickable
  _backdrop.style.clipPath = `polygon(
    0% 0%,
    100% 0%,
    100% 100%,
    0% 100%,
    0% ${btnRect.top}px,
    ${btnRect.left}px ${btnRect.top}px,
    ${btnRect.left}px ${btnRect.bottom}px,
    ${btnRect.right}px ${btnRect.bottom}px,
    ${btnRect.right}px ${btnRect.top}px,
    0% ${btnRect.top}px
  )`;

  _selectorPanel.classList.add('open');
  _backdrop.classList.add('open');
  _btnStreams.classList.add('active');
  _selSearch.value = '';
  renderSelItems('');
  _selSearch.focus();
}

function closeSelector() {
  _selectorPanel.classList.remove('open');
  _backdrop.classList.remove('open');
  _backdrop.style.clipPath = '';
  _btnStreams.classList.remove('active');
}

_btnStreams.addEventListener('click', e => {
  e.stopPropagation();
  _selectorPanel.classList.contains('open') ? closeSelector() : openSelector();
});

// Close when clicking the backdrop (outside the panel)
_backdrop.addEventListener('click', closeSelector);

// ═══════════════════════════════════════════════════════════════
//  Count display
// ═══════════════════════════════════════════════════════════════
function updateSelCount() {
  _selCount.textContent = `${enabledSet.size} of ${STREAMS.length} selected`;
  _updateSelectAllState();
}

// ═══════════════════════════════════════════════════════════════
//  "Select All" master checkbox logic
// ═══════════════════════════════════════════════════════════════

/**
 * Sync the master checkbox:
 *   - all selected  → checked
 *   - anything else → unchecked
 */
function _updateSelectAllState() {
  _selAllCb.indeterminate = false;
  _selAllCb.checked = (enabledSet.size === STREAMS.length);
}

// Clicking the master checkbox → select all or deselect all
_selAllCb.addEventListener('change', () => {
  if (_selAllCb.checked) {
    STREAMS.forEach((_, i) => enabledSet.add(i));
  } else {
    enabledSet.clear();
  }
  renderSelItems(_selSearch.value.toLowerCase());
});

// Clicking the label row also toggles the master checkbox
document.getElementById('sel-all-row').addEventListener('click', e => {
  if (e.target === _selAllCb) return;  // already handled by change event
  _selAllCb.checked = !_selAllCb.checked;
  _selAllCb.dispatchEvent(new Event('change'));
});

// ═══════════════════════════════════════════════════════════════
//  Search filter
// ═══════════════════════════════════════════════════════════════
_selSearch.addEventListener('input', () =>
  renderSelItems(_selSearch.value.toLowerCase())
);

// ═══════════════════════════════════════════════════════════════
//  Render checkbox list
// ═══════════════════════════════════════════════════════════════
function renderSelItems(filter) {
  _selList.innerHTML = '';

  STREAMS.forEach((s, i) => {
    const name = s.name || 'Unnamed';
    if (filter && !name.toLowerCase().includes(filter)) return;

    const row = document.createElement('div');
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

    // Clicking the row (not the checkbox itself) also toggles
    row.addEventListener('click', e => {
      if (e.target === cb) return;
      cb.checked = !cb.checked;
      cb.checked ? enabledSet.add(i) : enabledSet.delete(i);
      updateSelCount();
    });

    _selList.appendChild(row);
  });

  updateSelCount();
}

// ═══════════════════════════════════════════════════════════════
//  Apply button
// ═══════════════════════════════════════════════════════════════
document.getElementById('sel-apply').addEventListener('click', () => {
  closeSelector();
  stopAllPlayers();   // from navbar.js
  renderGrid();       // from render.js
});
