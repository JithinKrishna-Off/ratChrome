console.log("[SnakeChase] CONTENT SCRIPT LOADED", location.href);

/**
 * Content script - orchestration, input handling, settings, lifecycle
 */
(() => {
  if (window.__snakeChaseInjected) {
    return;
  }
  window.__snakeChaseInjected = true;

  const DEFAULT_SETTINGS = {
    enabled: false,
    snakeSize: 1.0,
    snakeSpeed: 280,
    turnSpeed: 2.2,
    segmentCount: 16,
    segmentSpacing: 18,
    snakeWidth: 14,
    ratSize: 1.0,
    catchDistance: 34
  };

  let settings = { ...DEFAULT_SETTINGS };
  let renderer = null;
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let mouseInside = true;
  let isInitialized = false;

  function loadSettings() {
    return new Promise(resolve => {
      try {
        chrome.storage.sync.get(DEFAULT_SETTINGS, (stored) => {
          if (chrome.runtime.lastError) {
            // fallback to local
            chrome.storage.local.get(DEFAULT_SETTINGS, (stored2) => {
              settings = { ...DEFAULT_SETTINGS, ...stored2 };
              resolve(settings);
            });
            return;
          }
          settings = { ...DEFAULT_SETTINGS, ...stored };
          resolve(settings);
        });
      } catch (e) {
        settings = { ...DEFAULT_SETTINGS };
        resolve(settings);
      }
    });
  }

  function saveSettings(newSettings) {
    settings = { ...settings, ...newSettings };
    try {
      chrome.storage.sync.set(settings, () => {
        if (chrome.runtime.lastError) {
          chrome.storage.local.set(settings);
        }
      });
    } catch (e) {
      try { chrome.storage.local.set(settings); } catch (_) {}
    }
    applyEnabledState(settings.enabled);
    if (renderer) renderer.updateSettings(settings);
  }

  function enable() {
    if (renderer) return;
    console.log("[SnakeChase] CHASE ENABLED");
    renderer = new SnakeChaseRenderer(settings);
    renderer.init();
    renderer.setMousePosition(mouseX, mouseY, mouseInside);
    attachMouseListeners();
  }

  function disable() {
    detachMouseListeners();
    if (renderer) {
      console.log("[SnakeChase] CHASE DISABLED");
      renderer.destroy();
      renderer = null;
    }
  }

  function applyEnabledState(enabled) {
    if (enabled && !renderer) enable();
    else if (!enabled && renderer) disable();
    else if (enabled && renderer) renderer.updateSettings(settings);
  }

  // Mouse handling - viewport coordinates
  function onMouseMove(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
    mouseInside = true;
    if (renderer) renderer.setMousePosition(mouseX, mouseY, true);
  }

  function onMouseLeave(e) {
    // Check if truly outside viewport
    mouseInside = false;
    if (renderer) renderer.setMousePosition(mouseX, mouseY, false);
  }

  function onMouseEnter(e) {
    mouseInside = true;
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (renderer) renderer.setMousePosition(mouseX, mouseY, true);
  }

  function onScroll() {
    // clientX/Y already viewport, no action needed but ensure renderer size updated
  }

  let mouseListenersAttached = false;
  function attachMouseListeners() {
    if (mouseListenersAttached) return;
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave, { passive: true });
    document.addEventListener('mouseenter', onMouseEnter, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    mouseListenersAttached = true;
  }

  function detachMouseListeners() {
    if (!mouseListenersAttached) return;
    window.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseleave', onMouseLeave);
    document.removeEventListener('mouseenter', onMouseEnter);
    window.removeEventListener('scroll', onScroll);
    mouseListenersAttached = false;
  }

  // Handle messages from popup / background
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'GET_SETTINGS') {
      sendResponse({ settings });
      return true;
    }
    if (msg.type === 'SET_SETTINGS') {
      settings = { ...settings, ...msg.settings };
      applyEnabledState(settings.enabled);
      if (renderer) renderer.updateSettings(settings);
      sendResponse({ ok: true, settings });
      return true;
    }
    if (msg.type === 'TOGGLE') {
      const newEnabled = msg.enabled != null ? msg.enabled : !settings.enabled;
      settings = { ...settings, enabled: newEnabled };
      applyEnabledState(newEnabled);
      if (renderer) renderer.updateSettings(settings);
      sendResponse({ ok: true, enabled: newEnabled, settings });
      return true;
    }
    if (msg.type === 'PING') {
      sendResponse({ ok: true });
      return true;
    }
  });

  // Storage changes (from popup)
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync' && area !== 'local') return;
      let changed = false;
      for (const k in changes) {
        if (k in settings) {
          settings[k] = changes[k].newValue;
          changed = true;
        }
      }
      if (changed) {
        applyEnabledState(settings.enabled);
        if (renderer) renderer.updateSettings(settings);
      }
    });
  } catch (_) {}

  // SPA navigation handling - MutationObserver for URL changes
  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      // Re-apply overlay if enabled (overlay may remain, but ensure it exists)
      if (settings.enabled) {
        // small delay to let DOM settle
        setTimeout(() => {
          if (settings.enabled && !renderer) enable();
          else if (renderer && !document.getElementById('snake-chase-overlay')) {
            // re-create if removed by SPA
            renderer.destroy();
            renderer = null;
            enable();
          }
        }, 300);
      }
    }
  });
  observer.observe(document, { subtree: true, childList: true });

  // Handle page visibility already in renderer; also handle fullscreen
  document.addEventListener('fullscreenchange', () => {
    if (renderer) renderer.resize();
  });

  // Init
  loadSettings().then(() => {
    isInitialized = true;
    console.log("[SnakeChase] SETTINGS LOADED", settings);
    if (settings.enabled) enable();
  });

  // Expose for debugging (optional)
  window.__snakeChase = {
    getSettings: () => settings,
    saveSettings,
    enable,
    disable
  };
})();
