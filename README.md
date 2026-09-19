# 🐍 Snake Chase

A realistic animated snake crawls across webpages chasing a rat that replaces your cursor.

Snake Chase is a lightweight, zero-dependency Chrome extension built using pure procedural canvas graphics. When activated, it seamlessly swaps your cursor for an animated rat that scurries, turns, wags its tail, and leaps to escape an undulating segmented snake pursuing it across your screen. The webpage underneath remains 100% interactive and fully functional.

---

## ✨ Features

- **Procedural Canvas Rendering**: High-performance, delta-time compensated animation running at a smooth 60 FPS via `requestAnimationFrame`.
- **Interactive Cursor Replacement**: The default mouse cursor is cleanly hidden while active, replaced by a responsive rat facing your direction of travel with dynamic footsteps, tail wagging, and ear twitching.
- **Realistic Snake Mechanics**: Features a segmented multi-jointed body following the head's historical motion path with natural S-curve undulation, dynamic acceleration, and deceleration.
- **Escape Dynamics**: Moving your mouse rapidly allows the rat to evade the snake. If the snake closes within catching distance, the rat performs an emergency jump leap and the snake triggers a brief cooldown.
- **Completely Non-Intrusive**: The animation runs on a non-blocking `pointer-events: none` overlay. You can still click buttons, select text, scroll, type in inputs, and navigate links without interference.
- **Instant Configuration**: Adjust snake size, crawl speed, segment count, and rat scale in real time via the extension popup.
- **Zero Network Activity**: 100% offline, local execution. No telemetry, tracking, or external server calls.

---

## 🛠️ How It Works

Snake Chase operates by creating a transparent fullscreen `<canvas>` element anchored over the viewport (`z-index: 2147483645`).
- The canvas coordinates are mapped to the viewport (`clientX`/`clientY`) and dynamically scaled to match the display's `devicePixelRatio` for razor-sharp rendering on Retina and 4K monitors.
- When enabled, CSS hides the standard cursor (`cursor: none !important`), and the custom rat entity tracks mouse input.
- A service worker maintains badge state and listens for global keyboard commands, while content scripts handle physics simulation and overlay rendering.
- When switching tabs or minimizing the browser, animation loops automatically halt to conserve battery and CPU resources.

---

## 📦 Installation Instructions (Chrome)

Follow these steps to install Snake Chase on Google Chrome (or Chromium-based browsers like Brave, Edge, and Opera):

1. **Download the latest release**:
   - Download the latest `snake-chase-v1.0.0.zip` from the **[Releases](../../releases)** section on GitHub.

2. **Extract the ZIP archive**:
   - Extract `snake-chase-v1.0.0.zip` to a regular folder on your computer (e.g., in your Documents or Projects folder). Make sure the extracted folder contains `manifest.json` directly inside it.

3. **Open Chrome Extensions page**:
   - In Chrome's address bar, navigate to:
     ```text
     chrome://extensions
     ```

4. **Enable Developer Mode**:
   - In the top-right corner of the Extensions page, toggle the **Developer mode** switch to **ON**.

5. **Load the extension**:
   - In the top-left corner, click the **Load unpacked** button.

6. **Select the folder**:
   - Browse to and select the extracted Snake Chase folder containing `manifest.json`.

7. **Pin the extension (Optional)**:
   - Click the puzzle icon (Extensions) in your Chrome toolbar and click the pin icon next to **Snake Chase** for quick access.

---

## 🎮 How to Enable / Disable

- **Via Popup**: Click the Snake Chase extension icon in your toolbar, then toggle the **Chase** switch or click **Turn ON / Turn OFF**.
- **Via Keyboard Shortcut**: Press `Alt + Shift + S` (macOS: `Option + Shift + S`) on any open webpage to toggle the chase immediately.
  - You can customize this shortcut anytime at `chrome://extensions/shortcuts`.
- **Badge Indicator**: When active, the extension icon displays a green **ON** badge.

---

## ⚙️ Settings Explanation

Open the extension popup to customize the behavior in real time:

| Setting | Range | Default | Description |
| :--- | :---: | :---: | :--- |
| **Snake size** | `0.5` – `2.0` | `1.0` | Scales the overall length, body thickness, head size, and strike distance of the snake. |
| **Snake speed** | `120` – `500` | `280` | Sets base crawling speed (pixels per second). Automatically accelerates when far and slows during approach. |
| **Body segments** | `6` – `28` | `16` | Adjusts segment count. Higher values yield a longer, more flexible snake; lower values create a shorter, agile snake. |
| **Rat size** | `0.5` – `1.8` | `1.0` | Adjusts the visual scale of the cursor rat. |
| **Reset** | — | — | Restores all settings and sliders to their factory default values. |

Settings are automatically saved across browser sessions using `chrome.storage.sync` (with automatic fallback to `chrome.storage.local`).

---

## 🌐 Supported Websites

- Works on standard `http://` and `https://` websites (search engines, news, blogs, social media, shopping sites, documentation, web apps).
- Automatically adapts to single-page application (SPA) client-side navigation (e.g., YouTube, GitHub, Twitter/X).
- Fully supports window resizing, page scrolling, and high-DPI zoom levels.

---

## ⚠️ Known Limitations

- **Browser-Protected Pages**: Chrome strictly prohibits extensions from executing scripts on internal browser URLs (`chrome://`, `chrome-extension://`), the Chrome Web Store, and Edge/Brave system settings pages.
- **Cross-Origin Iframes**: The overlay renders in the main document context. Moving your mouse over cross-origin embedded `<iframe>` elements temporarily surrenders coordinate tracking until the pointer returns to the main page.
- **Fullscreen Native Video**: In specific browser environments, hardware-accelerated fullscreen video elements (like native fullscreen video players) may layer above the canvas overlay.

---

## 🔒 Privacy Statement

Snake Chase was built with strict privacy principles:
- **100% Local**: All code, animations, and math execute locally inside your browser sandbox.
- **No External Network Calls**: The extension makes zero API calls, carries no tracking pixels, and contains no analytics scripts or external libraries.
- **No Data Collection**: Mouse positions, URLs, browsing history, and keystrokes are never logged, stored, or transmitted.
- **Transparent Open Source**: You can inspect every line of code directly in this repository.

---

## 🔧 Troubleshooting

- **Nothing happens when enabling on an open tab**:
  - If a webpage was already open before you installed or reloaded the extension, reload that tab once (`F5` or `Ctrl+R`) so Chrome can initialize the environment.
- **Shortcut does not activate**:
  - Check `chrome://extensions/shortcuts` to ensure `Alt + Shift + S` isn't in conflict with another extension or system hotkey.
- **Cursor disappeared after disabling**:
  - The extension automatically restores standard cursors upon disabling. If a site's stylesheet interferes, click anywhere on the page or switch tabs to reset cursor focus.

---

## 🗑️ Uninstall Instructions

If you wish to remove Snake Chase:
1. Right-click the **Snake Chase** icon in your Chrome toolbar.
2. Select **Remove from Chrome...**.
3. Confirm by clicking **Remove**.
   - Alternatively, navigate to `chrome://extensions`, locate **Snake Chase**, and click **Remove**.

---

## 📄 License

MIT License. Free to use, modify, and distribute.
