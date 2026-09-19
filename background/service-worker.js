/**
 * Background service worker - handles keyboard shortcut and icon state
 */
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

async function getSettings() {
  return new Promise(resolve => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (stored) => {
      if (chrome.runtime.lastError) {
        chrome.storage.local.get(DEFAULT_SETTINGS, (stored2) => {
          resolve({ ...DEFAULT_SETTINGS, ...stored2 });
        });
        return;
      }
      resolve({ ...DEFAULT_SETTINGS, ...stored });
    });
  });
}

async function setSettings(partial) {
  const current = await getSettings();
  const updated = { ...current, ...partial };
  return new Promise(resolve => {
    chrome.storage.sync.set(updated, () => {
      if (chrome.runtime.lastError) {
        chrome.storage.local.set(updated, () => resolve(updated));
        return;
      }
      resolve(updated);
    });
  });
}

async function toggleEnabled() {
  const s = await getSettings();
  const updated = await setSettings({ enabled: !s.enabled });
  // Notify active tabs
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  for (const tab of tabs) {
    if (!tab.id || !tab.url) continue;
    if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) continue;
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE', enabled: updated.enabled });
    } catch (_) {
      if (updated.enabled) {
        try {
          await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['content/styles.css'] });
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content/snake.js', 'content/rat.js', 'content/renderer.js', 'content/content.js']
          });
          await chrome.tabs.sendMessage(tab.id, { type: 'SET_SETTINGS', settings: updated });
        } catch (_) {}
      }
    }
  }
  await updateBadge(updated.enabled);
  return updated.enabled;
}

async function updateBadge(enabled) {
  const text = enabled ? 'ON' : '';
  try {
    await chrome.action.setBadgeText({ text });
    await chrome.action.setBadgeBackgroundColor({ color: '#2e7d32' });
    await chrome.action.setTitle({ title: enabled ? 'Snake Chase - ON (Alt+Shift+S to toggle)' : 'Snake Chase - OFF (Alt+Shift+S to toggle)' });
  } catch (_) {}
}

chrome.runtime.onInstalled.addListener(async () => {
  const s = await getSettings();
  await updateBadge(s.enabled);
  // Inject content scripts into already-open tabs on install/update
  try {
    const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });
    for (const tab of tabs) {
      if (!tab.id) continue;
      chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content/styles.css']
      }).catch(() => {});
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [
          'content/snake.js',
          'content/rat.js',
          'content/renderer.js',
          'content/content.js'
        ]
      }).catch(() => {});
    }
  } catch (_) {}
});

chrome.runtime.onStartup.addListener(async () => {
  const s = await getSettings();
  await updateBadge(s.enabled);
});

// Storage change -> badge
chrome.storage.onChanged.addListener((changes, area) => {
  if (changes.enabled) {
    updateBadge(changes.enabled.newValue);
  }
});

// Command shortcut Alt+Shift+S
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-snake') {
    await toggleEnabled();
  }
});

// Messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'UPDATE_BADGE') {
    updateBadge(msg.enabled).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg.type === 'TOGGLE_BACKGROUND') {
    toggleEnabled().then(enabled => sendResponse({ enabled }));
    return true;
  }
  if (msg.type === 'GET_SETTINGS_BG') {
    getSettings().then(s => sendResponse({ settings: s }));
    return true;
  }
});
