# Release Notes - Snake Chase v1.0.0

## Version 1.0.0 - Initial Public Release

Welcome to the initial public release of **Snake Chase**, a lightweight Chrome extension that replaces your cursor with an animated rat being pursued by a procedural slithering snake.

---

## 📦 What's Included

- **Procedural Canvas Animation Engine**:
  - Full-screen high-DPI canvas overlay with automatic scaling for Retina/4K displays.
  - Smooth 60 FPS animation loop with delta-time compensation.
  - Automatic pausing when switching tabs or minimizing to minimize CPU/battery usage.

- **Dynamic Cursor-Rat**:
  - Smooth directional steering facing the velocity vector of the mouse pointer.
  - Footstep pacing, animated ears, and S-curve tail wagging.
  - Emergency escape jump animation triggered when the snake lunges.

- **Segmented Physics Snake**:
  - Historical position follow path with natural S-curve body undulation.
  - Tapered segments, scale textures, realistic head with vertical slit eyes and forked flicking tongue.
  - Intelligent speed modulation (accelerates when distant, stalks when close).

- **Interactive Popup & Controls**:
  - Instant ON/OFF toggle and button with live active badge.
  - Customizable sliders for:
    - **Snake size** (0.5x – 2.0x)
    - **Snake speed** (120 – 500 px/sec)
    - **Body segments** (6 – 28 segments)
    - **Rat size** (0.5x – 1.8x)
  - One-click **Reset** to defaults.

- **Keyboard Shortcut Support**:
  - Toggle Chase anytime with `Alt + Shift + S` (macOS: `Option + Shift + S`).

- **Non-blocking UI**:
  - Pointer events pass through transparently (`pointer-events: none`). Webpages remain 100% interactive.

- **Strict Privacy**:
  - Completely offline. Zero external network requests, zero telemetry, zero analytics, zero data collection.

---

## 🚀 Installation Instructions

To install the extension from this release:

1. Download **`snake-chase-v1.0.0.zip`** from the Assets section below.
2. Extract the downloaded ZIP file to a permanent folder on your computer.
3. Open Google Chrome and navigate to `chrome://extensions`.
4. Enable **Developer mode** using the toggle in the upper-right corner.
5. Click the **Load unpacked** button in the upper-left corner.
6. In the file dialog, select the extracted folder (the directory containing `manifest.json`).
7. (Optional) Click the puzzle icon in Chrome's toolbar and pin **Snake Chase** for easy access.

---

## ⚠️ Known Limitations

- **Restricted Browser Pages**: Extensions cannot inject scripts into internal Chrome pages (`chrome://`, `chrome-extension://`) or the Chrome Web Store.
- **Cross-Origin Iframes**: When moving the cursor over a third-party iframe (e.g., cross-origin embedded video player or widget), cursor tracking temporarily pauses until the mouse moves back onto the main document.
- **Hardware-Accelerated Fullscreen Video**: In certain browser setups, fullscreen video players may render in front of the extension canvas overlay.
