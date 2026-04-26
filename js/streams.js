// ═══════════════════════════════════════════════════════════════
//  js/streams.js — Caltrans district/county map + CSV loader
//
//  On startup, all 12 district CSVs are fetched in parallel.
//  The county list for each district is derived directly from
//  the live CSV data, not from a static map.
//  Parsed CSV rows are cached per district so loadCounty()
//  filters from cache without re-fetching.
//
//  Exposes:
//    window.CALTRANS_DISTRICTS  — built from live CSV data
//    window.loadCounty(districtId, countyName, lonFilter)
//    window.streamsReady        — Promise resolving after boot
//
//  Depends on: config.js (DEFAULT_DISTRICT, DEFAULT_COUNTY,
//              DEFAULT_LONGITUDE_ENABLED/MIN/MAX)
// ═══════════════════════════════════════════════════════════════

// ── District IDs and CSV URL pattern ─────────────────────────────
const DISTRICT_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function _csvUrl(districtId) {
  const pad = String(districtId).padStart(2, '0');
  return `https://cwwp2.dot.ca.gov/data/d${districtId}/cctv/cctvStatusD${pad}.csv`;
}

// ── Column mapping ────────────────────────────────────────────────
const CSV_COLUMNS = {
  locationName:      'name',
  streamingVideoURL: 'url',
  currentImageURL:   'preview',
  longitude:         'longitude',
  latitude:          'latitude',
  nearbyPlace:       'nearby',
  route:             'route',
  county:            'county',
};

// ── Sort ──────────────────────────────────────────────────────────
const SORT_BY        = 'longitude';
const SORT_ASCENDING = true;

// ── Per-district row cache ────────────────────────────────────────
// Populated during boot. Keys are district IDs (numbers).
// Values are arrays of raw parsed row objects.
const _districtRowCache = {};

// ─────────────────────────────────────────────────────────────────
//  CSV parser — handles quoted fields
// ─────────────────────────────────────────────────────────────────
function _parseCSV(text) {
  const rows = [];
  const lines = [];
  let current = '';
  let inQuote = false;

  // Strip BOM if present
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') { inQuote = !inQuote; current += ch; }
    else if ((ch === '\n' || ch === '\r') && !inQuote) {
      if (current.trim()) lines.push(current);
      current = '';
      // skip \r\n second char
      if (ch === '\r' && text[i + 1] === '\n') i++;
    }
    else { current += ch; }
  }
  if (current.trim()) lines.push(current);

  function parseLine(line) {
    const fields = [];
    let field = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { field += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === ',' && !inQ) {
        fields.push(field.trim()); field = '';
      } else { field += ch; }
    }
    fields.push(field.trim());
    return fields;
  }

  const nonEmpty = lines.filter(l => l.trim().length > 0);
  if (!nonEmpty.length) return rows;

  // Normalise headers: strip whitespace and any invisible chars
  const headers = parseLine(nonEmpty[0]).map(h =>
    h.replace(/^\uFEFF/, '').trim()
  );

  for (let i = 1; i < nonEmpty.length; i++) {
    const values = parseLine(nonEmpty[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h] = (values[idx] || '').trim(); });
    rows.push(row);
  }
  return rows;
}

function _rowToStream(row) {
  const entry = {};
  for (const [csvKey, streamKey] of Object.entries(CSV_COLUMNS)) {
    const raw = row[csvKey] !== undefined ? String(row[csvKey]).trim() : '';
    entry[streamKey] = (csvKey === 'longitude' || csvKey === 'latitude')
      ? parseFloat(raw) || 0
      : raw;
  }
  return entry;
}

// ─────────────────────────────────────────────────────────────────
//  Fetch and cache one district's CSV rows.
//  Throws a descriptive error so boot's catch shows the right message.
// ─────────────────────────────────────────────────────────────────
async function _fetchDistrictRows(districtId) {
  const id = +districtId;
  if (_districtRowCache[id]) return _districtRowCache[id];

  try {
    const res = await fetch(_csvUrl(id));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const rows = _parseCSV(text);
    _districtRowCache[id] = rows;
    return rows;
  } catch (err) {
    console.warn(`[streams.js] District ${id} CSV unavailable:`, err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
//  Extract sorted unique county names from a row array.
//  Only includes counties that have at least one row with a
//  streaming URL — prevents empty county entries in the dropdown.
// ─────────────────────────────────────────────────────────────────
function _extractCounties(rows, districtId) {
  const seen = new Set();
  rows.forEach(row => {
    let c = (row.county || '').trim();
    if (!c) {
      const key = Object.keys(row).find(k => k.toLowerCase().trim() === 'county');
      if (key) c = (row[key] || '').trim();
    }
    if (c) seen.add(c);
  });
  const result = [...seen].sort();
  console.log(`[streams.js] D${districtId} raw counties (${result.length}):`, result);
  return result;
}

// ─────────────────────────────────────────────────────────────────
//  loadCounty(districtId, countyName, lonFilter)
//  Filters the cached district rows to the given county,
//  applies optional longitude filter, sorts, and sets window.STREAMS.
// ─────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────
//  loadCounty(districtId, countyName, lonFilter, sortFilter)
//  lonFilter:  { enabled, min, max }
//  sortFilter: { enabled, column } — column is a stream key e.g. 'nearby'
// ─────────────────────────────────────────────────────────────────
async function loadCounty(districtId, countyName, lonFilter, sortFilter) {
  const id = +districtId;

  let rows = _districtRowCache[id];
  if (!rows) {
    rows = await _fetchDistrictRows(id);
  }

  if (!rows) {
    console.error(`[streams.js] No data for District ${id}`);
    window.STREAMS = [];
    throw new Error(`No data for District ${id}`);
  }

  let streams = rows
    .filter(row => (row.county || '').trim().toLowerCase() === countyName.toLowerCase())
    .map(_rowToStream);

  if (lonFilter && lonFilter.enabled) {
    streams = streams.filter(s =>
      s.longitude >= lonFilter.min && s.longitude <= lonFilter.max
    );
  }

  // Sort — use sortFilter if enabled, otherwise default to 'nearby'
  const sortKey = (sortFilter && sortFilter.enabled && sortFilter.column)
    ? sortFilter.column
    : 'nearby';

  streams.sort((a, b) => {
    const av = a[sortKey] || '';
    const bv = b[sortKey] || '';
    return typeof av === 'number'
      ? av - bv
      : String(av).localeCompare(String(bv));
  });

  window.STREAMS = streams;
  console.log(`[streams.js] ${streams.length} streams — ${countyName}, District ${id}, sorted by ${sortKey}`);
  return streams;
}

// ─────────────────────────────────────────────────────────────────
//  Boot — fetch all district CSVs in parallel, build
//  CALTRANS_DISTRICTS from live county data, then load the default.
// ─────────────────────────────────────────────────────────────────
window.streamsReady = (async function boot() {
  console.log('[streams.js] Fetching all district CSVs in parallel…');

  // Fetch all districts — throws if any district fetch fails
  const results = await Promise.all(
    DISTRICT_IDS.map(async id => ({ id, rows: await _fetchDistrictRows(id) }))
  );

  window.CALTRANS_DISTRICTS = results
    .filter(({ rows }) => rows && rows.length > 0)
    .map(({ id, rows }) => {
      const counties = _extractCounties(rows, id);
      console.log(`[streams.js] D${id}: ${counties.length} counties —`, counties);
      return { id, counties, label: counties.join('/'), csvUrl: _csvUrl(id) };
    });

  console.log(`[streams.js] Districts ready:`,
    window.CALTRANS_DISTRICTS.map(d => `D${d.id}(${d.counties.length})`).join(', '));

  const defaultDistrict = window.CALTRANS_DISTRICTS.find(d => d.id === DEFAULT_DISTRICT);
  if (
    defaultDistrict &&
    defaultDistrict.counties.some(c => c.toLowerCase() === DEFAULT_COUNTY.toLowerCase())
  ) {
    await loadCounty(DEFAULT_DISTRICT, DEFAULT_COUNTY, {
      enabled: DEFAULT_LONGITUDE_ENABLED,
      min:     DEFAULT_LONGITUDE_MIN,
      max:     DEFAULT_LONGITUDE_MAX,
    });
  } else {
    console.warn(`[streams.js] Default county "${DEFAULT_COUNTY}" not found in District ${DEFAULT_DISTRICT}.`);
    window.STREAMS = [];
  }
})();
