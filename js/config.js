// ═══════════════════════════════════════════════════════════════
//  js/config.js — App-wide constants
//  Edit values here to change default behaviour across the app.
// ═══════════════════════════════════════════════════════════════

// Default stream size on first load (1 = smallest, 5 = largest).
// Columns are derived as COLUMNS_RANGE - DEFAULT_STREAM_SIZE.
const DEFAULT_STREAM_SIZE = 3;

// Min / max column bounds
const COLUMNS_MIN = 1;
const COLUMNS_MAX = 5;

// Range length — size and columns always sum to COLUMNS_RANGE + 1
// so they mirror each other within the same range.
// e.g. with MAX=5, MIN=1: size=1 → columns=5, size=5 → columns=1
const COLUMNS_RANGE = COLUMNS_MAX + COLUMNS_MIN; // = 6

// Milliseconds to wait before re-starting a stream after refresh
const REFRESH_DELAY_MS = 80;

// SVG inner paths for the global play/pause button icon
const ICON_PLAY  = `<polygon points="5,3 19,12 5,21"/>`;
const ICON_PAUSE = `<rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>`;
