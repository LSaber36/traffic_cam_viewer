// ═══════════════════════════════════════════════════════════════
//  js/streams.js — Fetches and parses the Caltrans CCTV CSV,
//                  filters rows, and builds window.STREAMS.
//
//  Exposes: window.STREAMS, window.streamsReady (Promise)
// ═══════════════════════════════════════════════════════════════

// ── Source URL ────────────────────────────────────────────────────
const CSV_URL = 'https://cwwp2.dot.ca.gov/data/d3/cctv/cctvStatusD03.csv';

// ── Column mapping ────────────────────────────────────────────────
//  Keys are exact CSV header names.
//  Values are the property names used throughout the app.
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

// ── Sort configuration ────────────────────────────────────────────
const SORT_BY        = 'longitude';   // must be a key in CSV_COLUMNS
const SORT_ASCENDING = true;

// ── Filters ───────────────────────────────────────────────────────
//  Only rows that pass ALL active filters are included in STREAMS.
//  Filters are applied in order: county first, then longitude.

// County whitelist — only rows whose county matches one of these are included.
// Set to null to disable and allow all counties.
const FILTER_COUNTIES = ['El Dorado'];

// Longitude range — applied after the county filter.
const FILTER_LONGITUDE_MIN = -120.68;
const FILTER_LONGITUDE_MAX = -120.02;

// ─────────────────────────────────────────────────────────────────
//  CSV parser — handles quoted fields (commas/newlines inside quotes)
// ─────────────────────────────────────────────────────────────────
function _parseCSV(text) {
  const rows = [];

  // Split into lines, collapsing quoted newlines
  const lines = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuote = !inQuote;
      current += ch;
    } else if (ch === '\n' && !inQuote) {
      lines.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);

  // Parse a single line into fields
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
        fields.push(field.trim());
        field = '';
      } else {
        field += ch;
      }
    }
    fields.push(field.trim());
    return fields;
  }

  const nonEmpty = lines.filter(l => l.trim().length > 0);
  if (!nonEmpty.length) return rows;

  const headers = parseLine(nonEmpty[0]);

  for (let i = 1; i < nonEmpty.length; i++) {
    const values = parseLine(nonEmpty[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h.trim()] = (values[idx] || '').trim(); });
    rows.push(row);
  }

  return rows;
}

// ─────────────────────────────────────────────────────────────────
//  Apply filters to a parsed row — returns true if row passes all
// ─────────────────────────────────────────────────────────────────
function _passesFilters(row) {
  // 1. County whitelist filter
  if (FILTER_COUNTIES !== null) {
    const county = (row.county || '').trim();
    if (!FILTER_COUNTIES.some(c => c.toLowerCase() === county.toLowerCase())) {
      return false;
    }
  }

  // 2. Longitude range filter
  const lon = parseFloat(row.longitude);
  if (isNaN(lon) || lon < FILTER_LONGITUDE_MIN || lon > FILTER_LONGITUDE_MAX) {
    return false;
  }

  return true;
}

// ─────────────────────────────────────────────────────────────────
//  Map a filtered CSV row to a STREAMS entry via CSV_COLUMNS
// ─────────────────────────────────────────────────────────────────
function _rowToStream(row) {
  const entry = {};
  for (const [csvKey, streamKey] of Object.entries(CSV_COLUMNS)) {
    const raw = row[csvKey] !== undefined ? String(row[csvKey]).trim() : '';
    if (csvKey === 'longitude' || csvKey === 'latitude') {
      entry[streamKey] = parseFloat(raw) || 0;
    } else {
      entry[streamKey] = raw;
    }
  }
  return entry;
}

// ─────────────────────────────────────────────────────────────────
//  Fetch → parse → filter → sort → expose as window.STREAMS
// ─────────────────────────────────────────────────────────────────
window.streamsReady = (async function loadStreams() {
  try {
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    const rows = _parseCSV(text);

    let streams = rows
      .filter(_passesFilters)
      .map(_rowToStream)
      .filter(s => s.url && s.url.length > 0);

    // Sort
    const sortKey = CSV_COLUMNS[SORT_BY] || SORT_BY;
    streams.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const result = typeof av === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv));
      return SORT_ASCENDING ? result : -result;
    });

    window.STREAMS = streams;
    console.log(`[streams.js] Loaded ${streams.length} streams from ${CSV_URL}`);
    return streams;

  } catch (err) {
    console.error('[streams.js] Failed to load CSV:', err);
    window.STREAMS = undefined;
    return undefined;
  }
})();
