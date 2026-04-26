# CA CCTV Viewer

A browser-based viewer for California's public Caltrans traffic cameras, sourced live from the Caltrans CCTV data feeds. View multiple HLS streams simultaneously, filter by district and county, and browse camera previews — all in one place.

🔗 **[Open the viewer](https://lsaber36.github.io/traffic_cam_viewer/)**

---

## Features

### 📡 Live Stream Playback
- Plays Caltrans HLS (HTTP Live Streaming) camera feeds directly in the browser
- Per-card play, pause, and refresh controls
- Global **Play All**, **Pause All**, and **Refresh All** buttons in the nav bar
- Automatic watchdog timer detects stalled streams and silently restarts them

### 🗂️ District & County Filtering
- All 12 Caltrans districts are loaded at site startup using CSV data fetched from their website
- County lists are derived directly from each district's fetched CSV, which makes sure to only use counties that are actually in the lists
   - There is another Caltrans link that relates counties to districts, but is is not up-to-date with the CSV files 
- Selecting a district loads the counties for that district, and also loads the first county in that district into the camera list
- Any time a filter is changed, the camera list updates

### 🔤 Sort By
- Sort the camera list by nearby place, camera name, longitude, latitude, or route
- Sorting is applied from cached data

### 📏 Longitude Filter
- Optional longitude range filter (min/max) to narrow cameras to a specific geographic corridor
- Updates the camera list in real time as you type (150ms debounce)
- Disabled and reset automatically when a new district or county is selected
- Default range configured in `js/config.js`

### 🔍 Camera Search & Selection
- Search cameras by name, nearby place, or highway route number
- Select all / deselect all cameras in the current filtered list
- Per-camera checkboxes — apply selection changes with the **Apply** button
- Changes to the streams menu are staged and only committed when Apply is pressed; closing without applying discards any filter changes

### 🖼️ Image-Only Cameras
- Cameras without a streaming URL are displayed as image-only cards
- Clearly labelled with an **Image Only / Stream Not Available** badge
- Excluded from Play All, Pause All, and Refresh All actions

### 📐 Stream Size Control
- Slider and ± buttons adjust the stream size, which then affects the column count in the card grid
- Stream size and column count are inversely proportional — larger size = fewer columns
- At maximum size (1 column), card height is constrained to fit within the viewport
- Numeric input allows typing a size value directly

### 🌙 Dark / Light Mode
- Toggle between dark and light themes from the nav bar
- Theme-aware CSS variables used throughout — buttons, text, backgrounds all adapt

### 🗺️ Caltrans Map Link
- Nav bar includes a direct link to the [Caltrans CCTV open data map](https://gisdata-caltrans.opendata.arcgis.com/datasets/450df5bed93c4558a7264b7ef64187e6_0/explore?location=37.273970%2C-119.846170%2C6) for geographic reference

### ⚠️ Error Handling
The app checks for errors in priority order and shows a descriptive popup for each:
1. **Device offline** — detected via `navigator.onLine` before any fetches
2. **CSV fetch failure** — shown if district/county data cannot be loaded from Caltrans
3. **Preview image failure** — checked before each card is built; popup shown if a camera preview is unreachable
4. **Unexpected error** — catch-all fallback in the boot sequence

---

## Project Structure

```
project/
├── index.html                  — Entry point
├── README.md                   — Hey, that's this file!
├── css/
│   ├── base.css                — Theme tokens, reset, popup styles
│   ├── header.css              — Nav bar, size control, buttons
│   ├── selector.css            — Stream selector dropdown panel
│   ├── grid.css                — Main grid layout
│   └── card.css                — Stream card, badges, overlays
└── js/
    ├── config.js               — App-wide constants and defaults
    ├── stream_loader.js        — Fetches all district CSVs and builds internal lists
    │                           builds CALTRANS_DISTRICTS, exposes loadCounty()
    ├── stream_card.js          — buildCard(), HLS playback, watchdog
    ├── nav_bar.js              — Size control, theme toggle, global play/pause/refresh
    ├── stream_selector.js      — Selector panel, district/county cascade, filters, enabledSet
    └── main.js                 — renderGrid(), showErrorPopup(), boot sequence
```

---

## Data Source

All camera data is fetched live from the [Caltrans CCTV open data feeds](https://cwwp2.dot.ca.gov/closed-circuit-television-cameras.html):

One CSV per district (D1–D12) is fetched in parallel at startup. Parsed rows are cached in memory — no repeat network requests are made when switching counties or adjusting filters.

---

## Configuration

Key defaults can be changed in `js/config.js`:

| Constant | Default | Description |
|---|---|---|
| `DEFAULT_DISTRICT` | `3` | District loaded on startup |
| `DEFAULT_COUNTY` | `'El Dorado'` | County loaded on startup |
| `DEFAULT_LONGITUDE_ENABLED` | `true` | Whether longitude filter is active by default |
| `DEFAULT_LONGITUDE_MIN` | `-120.68` | Default longitude filter minimum |
| `DEFAULT_LONGITUDE_MAX` | `-120.02` | Default longitude filter maximum |
| `DEFAULT_STREAM_SIZE` | `3` | Default stream size (1 = smallest, 5 = largest) |
| `WATCHDOG_INTERVAL_MS` | `8000` | How often to check for stalled streams |
| `WATCHDOG_STALL_MS` | `8000` | Time without progress before a stream is restarted |

---

## Running Locally

Since the app is a static HTML page and only fetches live data from Caltrans, it can be run directly in a browser by running index.html.
