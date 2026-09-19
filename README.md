# Snake Chase - Chrome Extension

A living, realistic snake crawls across any webpage, continuously chasing a small animated rat that replaces your mouse cursor. Purely visual - the page remains fully usable.

![Snake Chase](icons/icon128.png)

## What it does

- Hides the normal cursor while enabled and shows a cute animated **rat** at the cursor position
- Spawns a segmented **snake** that smoothly chases the rat with natural acceleration, turning, and S-shaped undulation
- Both creatures are procedurally drawn on a single `canvas` overlay (`pointer-events: none`, `z-index: 2147483645`)
- Rat faces movement direction, wags tail, twitches ears, does idle bobbing and escape jumps
- Snake features tapered body, head with eyes and flicking forked tongue, body texture, subtle shadows, and a "near catch" escape animation with cooldown
- Runs at ~60 FPS via `requestAnimationFrame`, pauses when tab is hidden, delta-time independent

## Installation (Developer Mode)

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (toggle top-right)
3. Click **Load unpacked**
4. Select the `snake-chase` folder (this directory containing `manifest.json`)
5. Pin the extension to your toolbar if desired

## How to Enable / Disable

- **Popup:** Click the extension icon → toggle **Chase ON/OFF**
- **Keyboard shortcut:** `Alt + Shift + S` (toggle)
  - If shortcut conflicts, change it at `chrome://extensions/shortcuts`
- **Badge:** Green `ON` badge indicates active state

## Settings (Popup)

- **Snake size** `0.5 – 2.0` - scales width, length, speed and catch distance
- **Snake speed** `120 – 500` - base px/sec, auto-modulates (faster when far, slower when near)
- **Body segments** `6 – 28` - more segments = longer, smoother snake
- **Rat size** `0.5 – 1.8` - visual size of cursor rat
- **Reset** - restores all defaults

Settings are persisted via `chrome.storage.sync` (falls back to `local`) and applied live without reload.

## Architecture

```
snake-chase/
├── manifest.json              # MV3, permissions: storage, host_permissions http/https
├── background/
│   └── service-worker.js      # badge, Alt+Shift+S command, storage sync
├── content/
│   ├── content.js             # lifecycle, mouse/scroll/resize/visibility/SPA handling, settings sync
│   ├── snake.js               # Snake class - historical path following, undulation, catch cooldown
│   ├── rat.js                 # Rat class - cursor following, direction facing, foot/ear/tail animation
│   ├── renderer.js            # Canvas overlay, DPI scaling, RAF loop, drawing (snake+rat)
│   └── styles.css             # #snake-chase-overlay fixed overlay + cursor:none
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js               # controls, live preview, storage messaging
└── icons/                     # 16/32/48/128 PNGs
```

Separation:
- **Input:** `content.js` tracks `clientX/clientY` (viewport), scroll, leave/enter, resize, fullscreen, SPA navigation
- **Physics:** `snake.js` / `rat.js`
- **Rendering:** `renderer.js` (single canvas)
- **Settings/Extension:** `popup/*` + `background/service-worker.js`

## Permissions

- `storage` - save settings
- `host_permissions: http://*/*, https://*/*` - inject only on regular webpages
- No `cookies`, `history`, `webRequest`, `tabs` (only `tabs.query` for shortcut notification in background)

Injection is declared for `http://*/*` and `https://*/*` only. Will not run on `chrome://`, `chrome-extension://`, Web Store (prohibited), or settings pages.

## Privacy

- Everything runs locally. No backend, no auth, no analytics.
- Mouse coordinates never leave the browser. No external API calls. No telemetry.
- Overlay is `pointer-events: none` - does not intercept clicks, scrolling, selection, typing, or links.

## Known Limitations

- Web Store, `chrome://`, and `chrome-extension://` pages cannot be injected (Chrome restriction)
- On pages with strict CSP, inline styles still work because CSS is via `content_scripts.css`; canvas not affected
- Browser zoom and high-DPI are handled via `devicePixelRatio` canvas scaling and `clientX/clientY` viewport coords
- `iframe` content: snake renders only in top frame, not inside cross-origin iframes (extension not injected there unless matching)
- Fullscreen video: overlay remains fixed to viewport; may be hidden behind fullscreen element in some browsers
- Very small viewports (<200px) work but snake may appear large; use Snake size slider

## Testing Checklist (manually verified structure)

- Snake follows rat, rat follows cursor, cursor hidden only when enabled
- Clicking links / typing / selecting text / scrolling still works
- Animation pauses when tab hidden, resumes when visible
- Resize / scroll / SPA navigation survives
- Mouse leaving viewport pauses chase, entering resumes
- Settings sliders and ON/OFF and Reset and shortcut

## Development

No build step. Edit files and reload extension at `chrome://extensions`.

## License

Original procedural graphics only, no copyrighted assets.
