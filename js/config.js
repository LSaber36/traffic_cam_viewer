// ═══════════════════════════════════════════════════════════════
//  js/config.js — App-wide constants
//  Edit values here to change default behaviour across the app.
// ═══════════════════════════════════════════════════════════════

// Default number of columns shown on first load (1–5)
const DEFAULT_SIZE = 3;

// Min / max slider bounds
const SIZE_MIN = 1;
const SIZE_MAX = 5;

// Milliseconds to wait before re-starting a stream after refresh
const REFRESH_DELAY_MS = 80;

// SVG inner paths for the global play/pause button icon
const ICON_PLAY  = `<polygon points="5,3 19,12 5,21"/>`;
const ICON_PAUSE = `<rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>`;
