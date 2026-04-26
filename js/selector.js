// ═══════════════════════════════════════════════════════════════
//  js/selector.js — Stream selector panel
//
//  Key behaviour:
//  - On open:  snapshot current committed state
//  - On close (backdrop / button): revert to snapshot
//  - On Apply: commit pending state, re-fetch if needed, render
//
//  Depends on: config.js, streams.js (window.CALTRANS_DISTRICTS,
//              loadCounty), navbar.js (stopAllPlayers),
//              render.js (renderGrid)
// ═══════════════════════════════════════════════════════════════

// ── DOM refs ─────────────────────────────────────────────────────
const _btnStreams    = document.getElementById('btn-streams');
const _selectorPanel = document.getElementById('selector-panel');
const _backdrop      = document.getElementById('backdrop');
const _selList       = document.getElementById('selector-list');
const _selSearch     = document.getElementById('sel-search');
const _selCount      = document.getElementById('sel-count');
const _selAllCb      = document.getElementById('sel-all-cb');
const _selDistrict   = document.getElementById('sel-district');
const _selCounty     = document.getElementById('sel-county');
const _selLonEnabled = document.getElementById('sel-lon-enabled');
const _selLonMin     = document.getElementById('sel-lon-min');
const _selLonMax     = document.getElementById('sel-lon-max');

// ── Committed state (what's actually applied to the grid) ─────────
// This is what survives a cancel. Only updated on Apply.
let _committed = {
  districtId:  DEFAULT_DISTRICT,
  county:      DEFAULT_COUNTY,
  lonEnabled:  DEFAULT_LONGITUDE_ENABLED,
  lonMin:      DEFAULT_LONGITUDE_MIN,
  lonMax:      DEFAULT_LONGITUDE_MAX,
  enabledSet:  new Set(),   // indices into window.STREAMS
  streams:     null,        // reference to window.STREAMS at last Apply
};

// ── Shared enabledSet (used by render.js) ─────────────────────────
// This always mirrors _committed.enabledSet between opens.
const enabledSet = _committed.enabledSet;

// ── Pending state (what's shown while panel is open) ──────────────
// Tracks what's been fetched/changed during the current open session.
let _pending = {
  districtId: DEFAULT_DISTRICT,
  county:     DEFAULT_COUNTY,
  lonEnabled: DEFAULT_LONGITUDE_ENABLED,
  lonMin:     DEFAULT_LONGITUDE_MIN,
  lonMax:     DEFAULT_LONGITUDE_MAX,
  streams:    null,   // window.STREAMS after a pending fetch
  enabledSet: new Set(),
};

let _isLoadingCounty = false;

// ─────────────────────────────────────────────────────────────────
//  Snapshot helpers
// ─────────────────────────────────────────────────────────────────

// Save current UI + pending state into a snapshot object
function _snapshotFromCommitted() {
  _pending.districtId = _committed.districtId;
  _pending.county     = _committed.county;
  _pending.lonEnabled = _committed.lonEnabled;
  _pending.lonMin     = _committed.lonMin;
  _pending.lonMax     = _committed.lonMax;
  _pending.streams    = _committed.streams;
  _pending.enabledSet = new Set(_committed.enabledSet);
}

// Restore UI controls to match the committed snapshot
function _revertUIToCommitted() {
  // District dropdown
  _selDistrict.value = _committed.districtId;
  _populateCountyDropdown(_committed.districtId);
  _selCounty.value = _committed.county;

  // Longitude
  _selLonEnabled.checked = _committed.lonEnabled;
  _selLonMin.value       = _committed.lonMin;
  _selLonMax.value       = _committed.lonMax;
  _updateLonInputState();

  // Restore pending to match committed
  _snapshotFromCommitted();

  // Restore window.STREAMS to what was committed
  window.STREAMS = _committed.streams;
}

// ═══════════════════════════════════════════════════════════════
//  Panel open / close
// ═══════════════════════════════════════════════════════════════
function openSelector() {
  // Position under the button
  const btnRect    = _btnStreams.getBoundingClientRect();
  const panelWidth = 290;
  const btnMid     = btnRect.left + btnRect.width / 2;
  _selectorPanel.style.top   = (btnRect.bottom + 8) + 'px';
  _selectorPanel.style.left  = Math.max(8, btnMid - panelWidth / 2) + 'px';
  _selectorPanel.style.right = 'auto';

  _backdrop.style.clipPath = `polygon(
    0% 0%, 100% 0%, 100% 100%, 0% 100%,
    0% ${btnRect.top}px,
    ${btnRect.left}px ${btnRect.top}px,
    ${btnRect.left}px ${btnRect.bottom}px,
    ${btnRect.right}px ${btnRect.bottom}px,
    ${btnRect.right}px ${btnRect.top}px,
    0% ${btnRect.top}px
  )`;

  // Snapshot committed state so we can revert on cancel
  _snapshotFromCommitted();

  // Restore UI to committed state
  _revertUIToCommitted();

  _selectorPanel.classList.add('open');
  _backdrop.classList.add('open');
  _btnStreams.classList.add('active');
  _selSearch.value = '';
  renderSelItems('');
}

function closeSelector(revert) {
  if (revert !== false) {
    // Cancel — revert UI and window.STREAMS to committed state
    _revertUIToCommitted();
  }
  _selectorPanel.classList.remove('open');
  _backdrop.classList.remove('open');
  _backdrop.style.clipPath = '';
  _btnStreams.classList.remove('active');
}

_btnStreams.addEventListener('click', e => {
  e.stopPropagation();
  _selectorPanel.classList.contains('open') ? closeSelector() : openSelector();
});

// Backdrop click = cancel
_backdrop.addEventListener('click', () => closeSelector());

// ═══════════════════════════════════════════════════════════════
//  District dropdown
// ═══════════════════════════════════════════════════════════════
function _populateDistrictDropdown() {
  _selDistrict.innerHTML = '';
  window.CALTRANS_DISTRICTS.forEach(d => {
    const opt = document.createElement('option');
    opt.value       = d.id;
    opt.textContent = `District ${d.id} — ${d.label}`;
    if (d.id === DEFAULT_DISTRICT) opt.selected = true;
    _selDistrict.appendChild(opt);
  });
  _populateCountyDropdown(DEFAULT_DISTRICT);
}

// ═══════════════════════════════════════════════════════════════
//  County dropdown
// ═══════════════════════════════════════════════════════════════
function _populateCountyDropdown(districtId) {
  const district = window.CALTRANS_DISTRICTS.find(d => d.id === +districtId);
  _selCounty.innerHTML = '';
  if (!district) {
    const opt = document.createElement('option');
    opt.value = ''; opt.textContent = '— select district first —';
    _selCounty.appendChild(opt);
    return;
  }
  district.counties.forEach(county => {
    const opt = document.createElement('option');
    opt.value = county; opt.textContent = county;
    _selCounty.appendChild(opt);
  });
}

// District change → repopulate county, clear list (pending only)
// NOTE: suppress the county change event during repopulation to avoid
// auto-fetching the first county when the user hasn't chosen one yet.
let _suppressCountyChange = false;

_selDistrict.addEventListener('change', async () => {
  _suppressCountyChange = true;
  _populateCountyDropdown(+_selDistrict.value);
  _suppressCountyChange = false;
  _selList.innerHTML = '';
  _pending.streams    = null;
  _pending.enabledSet = new Set();
  window.STREAMS      = null;

  // Reset longitude filter when district changes
  _selLonEnabled.checked = false;
  _updateLonInputState();

  updateSelCount();

  // Auto-fetch the first county in the newly populated list
  const firstCounty = _selCounty.value;
  if (firstCounty) {
    await _fetchPending(+_selDistrict.value, firstCounty, { resetFilters: false });
  }
});

// County change → fetch pending streams (not committed until Apply)
_selCounty.addEventListener('change', async () => {
  if (_suppressCountyChange) return;
  const districtId = +_selDistrict.value;
  const county     = _selCounty.value;
  if (!county) return;
  await _fetchPending(districtId, county, { resetFilters: true });
});

// ═══════════════════════════════════════════════════════════════
//  Fetch pending — loads streams into _pending, not committed yet
//  opts.resetFilters: if true, uncheck longitude
// ═══════════════════════════════════════════════════════════════
async function _fetchPending(districtId, county, opts = {}) {
  if (_isLoadingCounty) return;
  _isLoadingCounty = true;

  // Reset longitude filter when district/county changes
  if (opts.resetFilters) {
    _selLonEnabled.checked = false;
    _updateLonInputState();
  }

  // Show loading state inside the list only
  _selList.innerHTML = `
    <div style="padding:16px 14px; font-family:'Space Mono',monospace;
                font-size:10px; color:var(--muted); display:flex;
                align-items:center; gap:8px;">
      <div class="sel-loading-ring" style="display:block"></div>
      Loading cameras…
    </div>`;
  _pending.enabledSet   = new Set();
  _selCounty.disabled   = true;
  _selDistrict.disabled = true;

  try {
    const lonFilter = _getLonFilter();
    const streams   = await loadCounty(districtId, county, lonFilter);

    _pending.districtId = districtId;
    _pending.county     = county;
    _pending.lonEnabled = lonFilter.enabled;
    _pending.lonMin     = lonFilter.min;
    _pending.lonMax     = lonFilter.max;
    _pending.streams    = Array.isArray(streams) ? streams : [];

    window.STREAMS = _pending.streams;

    // Auto-enable all loaded streams
    _pending.streams.forEach((_, i) => _pending.enabledSet.add(i));

    _selSearch.value = '';
    renderSelItems('');
    _syncSelectAll();

  } catch (err) {
    console.error('[selector] _fetchPending error:', err);
    _selList.innerHTML = `
      <div style="padding:16px 14px; font-family:'Space Mono',monospace;
                  font-size:10px; color:var(--muted);">
        Failed to load cameras. Please try again.
      </div>`;
  } finally {
    _isLoadingCounty      = false;
    _selCounty.disabled   = false;
    _selDistrict.disabled = false;
  }
}

// ═══════════════════════════════════════════════════════════════
//  Longitude filter
// ═══════════════════════════════════════════════════════════════
function _updateLonInputState() {
  const enabled = _selLonEnabled.checked;
  _selLonMin.disabled = !enabled;
  _selLonMax.disabled = !enabled;
  _selLonMin.classList.toggle('sel-lon-disabled', !enabled);
  _selLonMax.classList.toggle('sel-lon-disabled', !enabled);
}

_selLonEnabled.addEventListener('change', async () => {
  _updateLonInputState();
  const county = _selCounty.value;
  if (county) {
    await _fetchPending(+_selDistrict.value, county);
  }
});

function _getLonFilter() {
  return {
    enabled: _selLonEnabled.checked,
    min:     parseFloat(_selLonMin.value),
    max:     parseFloat(_selLonMax.value),
  };
}

// ═══════════════════════════════════════════════════════════════
//  Count + Select All
// ═══════════════════════════════════════════════════════════════

/** Force the select-all checkbox to reflect pending enabledSet. */
function _syncSelectAll() {
  const total = Array.isArray(window.STREAMS) ? window.STREAMS.length : 0;
  _selAllCb.indeterminate = false;
  _selAllCb.checked = total > 0 && _pending.enabledSet.size === total;
  _selCount.textContent = `${_pending.enabledSet.size} of ${total} selected`;
}

function updateSelCount() {
  const panelOpen = _selectorPanel.classList.contains('open');
  const active    = panelOpen ? _pending.enabledSet : _committed.enabledSet;
  const streams   = panelOpen ? window.STREAMS : _committed.streams;
  const total     = Array.isArray(streams) ? streams.length : 0;
  _selCount.textContent   = `${active.size} of ${total} selected`;
  _selAllCb.indeterminate = false;
  _selAllCb.checked       = total > 0 && active.size === total;
}

_selAllCb.addEventListener('change', () => {
  const active = _pending.enabledSet;
  if (_selAllCb.checked && Array.isArray(window.STREAMS)) {
    window.STREAMS.forEach((_, i) => active.add(i));
  } else {
    active.clear();
  }
  renderSelItems(_selSearch.value.toLowerCase());
});

document.getElementById('sel-all-row').addEventListener('click', e => {
  if (e.target === _selAllCb) return;
  _selAllCb.checked = !_selAllCb.checked;
  _selAllCb.dispatchEvent(new Event('change'));
});

// ═══════════════════════════════════════════════════════════════
//  Search
// ═══════════════════════════════════════════════════════════════
_selSearch.addEventListener('input', () =>
  renderSelItems(_selSearch.value.toLowerCase())
);

// ═══════════════════════════════════════════════════════════════
//  Render checkbox list
// ═══════════════════════════════════════════════════════════════
function renderSelItems(filter) {
  _selList.innerHTML = '';

  if (!Array.isArray(window.STREAMS) || window.STREAMS.length === 0) {
    _selList.innerHTML = `<div style="padding:16px 14px;
      font-family:'Space Mono',monospace; font-size:10px;
      color:var(--muted);">Select a county to load cameras.</div>`;
    updateSelCount();
    return;
  }

  const active = _pending.enabledSet;

  window.STREAMS.forEach((s, i) => {
    const name   = s.name   || '';
    const nearby = s.nearby || '';
    const route  = s.route  || '';

    if (filter) {
      const haystack = [name, nearby, `hwy ${route}`].join(' ').toLowerCase();
      if (!haystack.includes(filter)) return;
    }

    const row = document.createElement('div');
    row.className = 'sel-item';

    const cb = document.createElement('input');
    cb.type      = 'checkbox';
    cb.className = 'sel-checkbox';
    cb.checked   = active.has(i);
    cb.addEventListener('change', () => {
      cb.checked ? active.add(i) : active.delete(i);
      updateSelCount();
    });

    const nameEl = document.createElement('div');
    nameEl.className   = 'sel-name';
    nameEl.textContent = name || 'Unnamed';

    const sub = document.createElement('div');
    sub.className   = 'sel-sub';
    sub.textContent = nearby;

    row.appendChild(cb);
    row.appendChild(nameEl);
    row.appendChild(sub);

    row.addEventListener('click', e => {
      if (e.target === cb) return;
      cb.checked = !cb.checked;
      cb.checked ? active.add(i) : active.delete(i);
      updateSelCount();
    });

    _selList.appendChild(row);
  });

  updateSelCount();
}

// ═══════════════════════════════════════════════════════════════
//  Apply button — commit pending state
// ═══════════════════════════════════════════════════════════════
document.getElementById('sel-apply').addEventListener('click', async () => {
  // If district/county/lon filter changed, re-fetch with current UI values
  const districtId = +_selDistrict.value;
  const county     = _selCounty.value;
  const lonFilter  = _getLonFilter();

  const districtChanged = districtId !== _committed.districtId || county !== _committed.county;
  const lonChanged      = lonFilter.enabled  !== _committed.lonEnabled
                       || lonFilter.min      !== _committed.lonMin
                       || lonFilter.max      !== _committed.lonMax;

  if ((districtChanged || lonChanged) && _pending.streams === null || lonChanged) {
    await _fetchPending(districtId, county);
  }

  // Commit
  _committed.districtId = districtId;
  _committed.county     = county;
  _committed.lonEnabled = lonFilter.enabled;
  _committed.lonMin     = lonFilter.min;
  _committed.lonMax     = lonFilter.max;
  _committed.streams    = window.STREAMS;
  _committed.enabledSet = new Set(_pending.enabledSet);

  // Sync the shared enabledSet (used by renderGrid)
  enabledSet.clear();
  _committed.enabledSet.forEach(i => enabledSet.add(i));

  closeSelector(false);  // close without reverting
  stopAllPlayers();
  renderGrid();
});

// ═══════════════════════════════════════════════════════════════
//  Init — longitude defaults only.
//  _populateDistrictDropdown() is called by render.js after
//  streamsReady resolves and CALTRANS_DISTRICTS is built.
// ═══════════════════════════════════════════════════════════════
_selLonEnabled.checked = DEFAULT_LONGITUDE_ENABLED;
_selLonMin.value       = DEFAULT_LONGITUDE_MIN;
_selLonMax.value       = DEFAULT_LONGITUDE_MAX;
_updateLonInputState();
