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

const els = {
  toggle: document.getElementById('toggleEnabled'),
  toggleState: document.getElementById('toggleState'),
  snakeSize: document.getElementById('snakeSize'),
  snakeSpeed: document.getElementById('snakeSpeed'),
  segmentCount: document.getElementById('segmentCount'),
  ratSize: document.getElementById('ratSize'),
  valSnakeSize: document.getElementById('valSnakeSize'),
  valSnakeSpeed: document.getElementById('valSnakeSpeed'),
  valSegmentCount: document.getElementById('valSegmentCount'),
  valRatSize: document.getElementById('valRatSize'),
  btnReset: document.getElementById('btnReset'),
  btnToggle: document.getElementById('btnToggle'),
  statusMsg: document.getElementById('statusMsg')
};

let settings = { ...DEFAULT_SETTINGS };
let saveTimer = null;

function getStorage() {
  return new Promise(resolve => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (s) => {
      if (chrome.runtime.lastError) {
        chrome.storage.local.get(DEFAULT_SETTINGS, (s2) => resolve({ ...DEFAULT_SETTINGS, ...s2 }));
        return;
      }
      resolve({ ...DEFAULT_SETTINGS, ...s });
    });
  });
}

function setStorage(partial) {
  return new Promise(resolve => {
    chrome.storage.sync.set(partial, () => {
      if (chrome.runtime.lastError) {
        chrome.storage.local.set(partial, () => resolve());
        return;
      }
      resolve();
    });
  });
}

async function notifyContent(settingsToSend) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return false;
    const url = tab.url || '';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      showStatus('Cannot inject on this page', true);
      return false;
    }

    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'SET_SETTINGS', settings: settingsToSend });
      return true;
    } catch (err) {
      // Content script not yet injected (tab was open before extension install/reload)
      try {
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['content/styles.css']
        });
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: [
            'content/snake.js',
            'content/rat.js',
            'content/renderer.js',
            'content/content.js'
          ]
        });
        await chrome.tabs.sendMessage(tab.id, { type: 'SET_SETTINGS', settings: settingsToSend });
        return true;
      } catch (injectErr) {
        console.warn('[SnakeChase] Failed to inject content script:', injectErr);
        showStatus('Reload page to apply', true);
        return false;
      }
    }
  } catch (e) {
    console.warn('[SnakeChase] notifyContent error:', e);
    return false;
  }
}

function showStatus(msg, isError = false) {
  els.statusMsg.textContent = msg;
  els.statusMsg.className = isError ? 'status-msg error' : 'status-msg';
  setTimeout(() => { els.statusMsg.textContent = ''; }, 2500);
}

function updateUI() {
  els.toggle.checked = settings.enabled;
  els.toggleState.textContent = settings.enabled ? 'ON' : 'OFF';
  els.toggleState.className = settings.enabled ? 'toggle-state on' : 'toggle-state off';
  els.btnToggle.textContent = settings.enabled ? 'Turn OFF' : 'Turn ON';
  els.btnToggle.className = settings.enabled ? 'btn btn-primary off' : 'btn btn-primary';

  els.snakeSize.value = settings.snakeSize;
  els.snakeSpeed.value = settings.snakeSpeed;
  els.segmentCount.value = settings.segmentCount;
  els.ratSize.value = settings.ratSize;

  els.valSnakeSize.textContent = Number(settings.snakeSize).toFixed(1);
  els.valSnakeSpeed.textContent = String(settings.snakeSpeed);
  els.valSegmentCount.textContent = String(settings.segmentCount);
  els.valRatSize.textContent = Number(settings.ratSize).toFixed(1);
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    await setStorage(settings);
    const ok = await notifyContent(settings);
    if (ok) showStatus('Saved');
  }, 180);
}

async function init() {
  settings = await getStorage();
  updateUI();

  els.toggle.addEventListener('change', async () => {
    settings.enabled = els.toggle.checked;
    await setStorage({ enabled: settings.enabled });
    updateUI();
    const ok = await notifyContent(settings);
    chrome.runtime.sendMessage({ type: 'UPDATE_BADGE', enabled: settings.enabled }).catch(() => {});
    if (ok) {
      showStatus(settings.enabled ? 'Chase enabled!' : 'Chase disabled');
    }
  });

  els.btnToggle.addEventListener('click', async () => {
    settings.enabled = !settings.enabled;
    await setStorage({ enabled: settings.enabled });
    updateUI();
    const ok = await notifyContent(settings);
    chrome.runtime.sendMessage({ type: 'UPDATE_BADGE', enabled: settings.enabled }).catch(() => {});
    if (ok) {
      showStatus(settings.enabled ? 'Chase enabled!' : 'Chase disabled');
    }
  });

  const bindRange = (el, key, parse) => {
    el.addEventListener('input', () => {
      settings[key] = parse(el.value);
      updateUI();
      scheduleSave();
    });
  };
  bindRange(els.snakeSize, 'snakeSize', parseFloat);
  bindRange(els.snakeSpeed, 'snakeSpeed', v => parseInt(v, 10));
  bindRange(els.segmentCount, 'segmentCount', v => parseInt(v, 10));
  bindRange(els.ratSize, 'ratSize', parseFloat);

  els.btnReset.addEventListener('click', async () => {
    settings = { ...DEFAULT_SETTINGS };
    await setStorage(settings);
    updateUI();
    const ok = await notifyContent(settings);
    chrome.runtime.sendMessage({ type: 'UPDATE_BADGE', enabled: settings.enabled }).catch(() => {});
    if (ok) showStatus('Reset to defaults');
  });

  // Listen for storage changes to stay in sync if background toggles via shortcut
  chrome.storage.onChanged.addListener((changes, area) => {
    let needUpdate = false;
    for (const k in changes) {
      if (k in settings) {
        settings[k] = changes[k].newValue;
        needUpdate = true;
      }
    }
    if (needUpdate) updateUI();
  });
}

init();
