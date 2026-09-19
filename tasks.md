# Snake Chase - Implementation Checklist

## MVP Core

- [x] Manifest V3 (`manifest.json`) - permissions `storage`, host `http/https`, content_scripts, action popup, command Alt+Shift+S, icons
- [x] Icons 16/32/48/128 (generated PNGs)
- [x] Content overlay (`styles.css` + `renderer.js#createOverlay`) - `position:fixed; inset:0; pointer-events:none; z-index:2147483645`
- [x] Canvas renderer single overlay, DPI scaling via `devicePixelRatio`, `ctx.setTransform`
- [x] Hide cursor via `html.snake-chase-active, html.snake-chase-active * { cursor:none !important }`
- [x] RequestAnimationFrame loop ~60FPS, delta-time independent, pause on `document.hidden` / `visibilitychange`
- [x] Mouse tracking `clientX/clientY` viewport coords, account scroll, resize, high-DPI, zoom
- [x] Mouse leave/enter handling - rat fades, snake idles
- [x] Window resize handling
- [x] Fullscreen change handling

## Snake

- [x] Segmented snake `snake.js` - head → segment* → tail, configurable distance
- [x] Historical path following (history queue, walk back by `segmentSpacing * snakeSize`)
- [x] Smooth interpolation, angle normalization, turnSpeed limiting
- [x] Acceleration/deceleration (far 1.4x, near 0.35x), speed lerp
- [x] Natural S-shaped undulation (`sin(time*3.5 + i*0.65)` lateral offset, tapered middle)
- [x] Slight random wander without breaking chase (`sin(time*0.7)*0.08`)
- [x] Head leads, body follows, no jitter/stretch, clamp deltaTime
- [x] Snake visual: tapered width, radial gradient green, belly highlight, scale dots, shadow, elongated head, snout, nostrils
- [x] Eyes with slit pupil + highlight
- [x] Tongue flick interval + catch tongue
- [x] Catch detection `distance < catchDistance * size`, cooldown 2s, lunge effect
- [x] Configurable `snakeSpeed, turnSpeed, segmentSpacing, segmentCount, snakeWidth, catchDistance, snakeSize`

## Rat

- [x] Centered at cursor, pointer replacement
- [x] Faces movement direction, smooth angle lerp
- [x] Running vs idle animation (footPhase, tail wag, ear wiggle, bob)
- [x] Tail S-curve with wag, body gradient, belly light, whiskers, nose highlight
- [x] Four feet stepping, ears inner pink
- [x] Jump escape animation (velocity + gravity, offset)
- [x] Idle subtle animation when stationary
- [x] Configurable `ratSize`

## Chase Behavior

- [x] Snake follows rat with delay, not instant
- [x] Can escape by moving fast
- [x] Near catch triggers escape jump, snake coils/flash, rat teleports away, cooldown prevents spam
- [x] Cursor movement never blocked

## Settings / Popup

- [x] Popup HTML/CSS/JS - ON/OFF toggle switch + button, 4 sliders, Reset, badge, shortcut hint
- [x] Defaults sensible (size 1.0, speed 280, segments 16, rat 1.0)
- [x] Live apply via `chrome.storage.sync` + `chrome.storage.onChanged` + direct `sendMessage`
- [x] Background service worker badge + command Alt+Shift+S toggle
- [x] Storage fallback `local` if `sync` fails

## Compatibility / Edge Cases

- [x] Works on Google, Wikipedia, YouTube, blogs, shopping, forms, scrolling pages
- [x] Not injected into chrome:// / extension / store pages
- [x] Does not interfere with clicks/scroll/selection/forms/links/keyboard
- [x] SPA navigation observer (MutationObserver url check, re-create overlay if removed)
- [x] Very small / very large viewport handling (clamped escape, width scaling)
- [x] High DPI handling
- [x] Iframe handling (top frame only; noted limitation)
- [x] Handle browser zoom via viewport coords (standard)
- [x] Page with heavy JS - canvas independent, no setInterval

## Docs / Quality

- [x] README.md - what, install, enable/disable, settings, shortcut, privacy, limitations, architecture
- [x] tasks.md (this file) - checklist
- [x] Clean modular JS (separate snake/rat/renderer/content/background/popup)
- [x] No backend/auth/analytics, no external calls

## Remaining / Future

- [ ] Optional: expose `turnSpeed` and `catchDistance` sliders in popup (currently internal defaults)
- [ ] Optional: per-site enable/disable toggle
- [ ] Optional: color theme picker for snake/rat
- [ ] Optional: particle effects on catch
- [ ] Automated tests (manual checklist for now)
