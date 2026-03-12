const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const fetch = require('node-fetch');

let Store;
let store;

let mainWindow = null;
let tray = null;
let checkInterval = null;
let autoUpdateInterval = null;
let isChecking = false;
const CONFIG_PATH = path.join(app.getPath('userData'), 'apps.json');
const UPDATER_REPO = 'Alowster/github-updater';

async function initStore() {
  const StoreModule = await import('electron-store');
  Store = StoreModule.default;
  store = new Store({
    defaults: {
      githubToken: '',
      checkIntervalMinutes: 60,
      startWithWindows: false,
      minimizeToTray: true,
      apps: []
    }
  });
}

async function getLatestRelease(repoFullName, token) {
  const headers = { 'User-Agent': 'github-updater-app' };
  if (token) headers['Authorization'] = `token ${token}`;

  try {
    const res = await fetch(`https://api.github.com/repos/${repoFullName}/releases/latest`, { headers });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`GitHub API error: ${res.status}`);
    }
    const data = await res.json();
    return {
      version: data.tag_name,
      name: data.name,
      body: data.body,
      publishedAt: data.published_at,
      assets: data.assets.map(a => ({
        name: a.name,
        downloadUrl: a.browser_download_url,
        size: a.size
      })),
      htmlUrl: data.html_url
    };
  } catch (err) {
    console.error(`Error fetching release for ${repoFullName}:`, err.message);
    return null;
  }
}

function compareVersions(v1, v2) {
  const clean = v => v.replace(/^v/, '').split('.').map(Number);
  const [a, b] = [clean(v1), clean(v2)];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (b[i] || 0) - (a[i] || 0);
    if (diff !== 0) return diff > 0;
  }
  return false;
}

async function checkAllApps() {
  if (isChecking) return [];
  isChecking = true;
  const apps = store.get('apps', []);
  const token = store.get('githubToken', '');
  const updated = [];

  for (let app of apps) {
    if (!app.repo) continue;
    const latest = await getLatestRelease(app.repo, token);
    if (!latest) continue;

    const wasOutdated = app.isOutdated;
    app.latestVersion = latest.version;
    app.latestRelease = latest;
    app.isOutdated = app.currentVersion
      ? compareVersions(app.currentVersion, latest.version)
      : false;
    app.lastChecked = new Date().toISOString();
    updated.push(app);

    if (!wasOutdated && app.isOutdated && Notification.isSupported()) {
      new Notification({
        title: `Update available: ${app.name}`,
        body: `Version ${latest.version} is available`
      }).show();
    }
  }

  store.set('apps', updated);
  isChecking = false;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('apps-updated', updated);
  }
  updateTrayIcon(updated);
  return updated;
}

function updateTrayIcon(apps) {
  if (!tray) return;
  const outdatedCount = apps.filter(a => a.isOutdated).length;
  tray.setToolTip(outdatedCount > 0
    ? `GitHub Updater - ${outdatedCount} update(s) available`
    : 'GitHub Updater - All apps up to date');
}

function startCheckInterval() {
  if (checkInterval) clearInterval(checkInterval);
  const minutes = store.get('checkIntervalMinutes', 60);
  checkInterval = setInterval(checkAllApps, minutes * 60 * 1000);
}

async function checkSelfUpdate() {
  const token = store.get('githubToken', '');
  const latest = await getLatestRelease(UPDATER_REPO, token);
  if (!latest) return null;

  const currentVersion = app.getVersion();
  if (compareVersions(currentVersion, latest.version)) {
    return latest;
  }
  return null;
}

async function downloadAsset(url, destPath, token, progressCallback) {
  const headers = { 'User-Agent': 'github-updater-app' };
  if (token) headers['Authorization'] = `token ${token}`;
  headers['Accept'] = 'application/octet-stream';

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);

  const totalSize = parseInt(res.headers.get('content-length') || '0');
  let downloaded = 0;

  const dest = fs.createWriteStream(destPath);

  return new Promise((resolve, reject) => {
    res.body.on('data', chunk => {
      downloaded += chunk.length;
      if (progressCallback && totalSize > 0) {
        progressCallback(Math.round((downloaded / totalSize) * 100));
      }
    });
    res.body.pipe(dest);
    res.body.on('error', reject);
    dest.on('finish', resolve);
    dest.on('error', reject);
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 640,
    minWidth: 380,
    minHeight: 500,
    resizable: true,
    frame: false,
    transparent: false,
    backgroundColor: '#0d1117',
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    titleBarStyle: 'hidden'
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (e) => {
    if (store.get('minimizeToTray', true)) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function createTray() {
  const iconPath = path.join(__dirname, '../assets/tray-icon.png');
  let trayIcon;

  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath);
  } else {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('GitHub Updater');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open GitHub Updater', click: () => showWindow() },
    { label: 'Check for updates now', click: () => checkAllApps() },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => showWindow());
}

function showWindow() {
  if (!mainWindow) {
    createMainWindow();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

function setupIPC() {
  ipcMain.handle('get-apps', () => store.get('apps', []));

  ipcMain.handle('get-settings', () => ({
    githubToken: store.get('githubToken', ''),
    checkIntervalMinutes: store.get('checkIntervalMinutes', 60),
    startWithWindows: store.get('startWithWindows', false),
    minimizeToTray: store.get('minimizeToTray', true)
  }));

  ipcMain.handle('save-settings', (_, settings) => {
    store.set('githubToken', settings.githubToken || '');
    store.set('checkIntervalMinutes', settings.checkIntervalMinutes || 60);
    store.set('minimizeToTray', settings.minimizeToTray !== false);

    if (settings.startWithWindows !== undefined) {
      store.set('startWithWindows', settings.startWithWindows);
      app.setLoginItemSettings({ openAtLogin: settings.startWithWindows });
    }

    startCheckInterval();
    return true;
  });

  ipcMain.handle('add-app', (_, appData) => {
    const apps = store.get('apps', []);
    const newApp = {
      id: randomUUID(),
      name: appData.name,
      repo: appData.repo,
      currentVersion: appData.currentVersion || '',
      installPath: appData.installPath || '',
      autoUpdate: appData.autoUpdate || false,
      icon: appData.icon || null,
      latestVersion: null,
      latestRelease: null,
      isOutdated: false,
      lastChecked: null
    };
    apps.push(newApp);
    store.set('apps', apps);
    return newApp;
  });

  ipcMain.handle('remove-app', (_, appId) => {
    const apps = store.get('apps', []).filter(a => a.id !== appId);
    store.set('apps', apps);
    return true;
  });

  ipcMain.handle('update-app-config', (_, { id, changes }) => {
    const apps = store.get('apps', []);
    const idx = apps.findIndex(a => a.id === id);
    if (idx === -1) return false;
    apps[idx] = { ...apps[idx], ...changes };
    store.set('apps', apps);
    return apps[idx];
  });

  ipcMain.handle('check-all', async () => {
    return await checkAllApps();
  });

  ipcMain.handle('check-app', async (_, appId) => {
    const apps = store.get('apps', []);
    const app = apps.find(a => a.id === appId);
    if (!app) return null;

    const token = store.get('githubToken', '');
    const latest = await getLatestRelease(app.repo, token);
    if (!latest) return null;

    app.latestVersion = latest.version;
    app.latestRelease = latest;
    app.isOutdated = app.currentVersion
      ? compareVersions(app.currentVersion, latest.version)
      : false;
    app.lastChecked = new Date().toISOString();

    const updatedApps = apps.map(a => a.id === appId ? app : a);
    store.set('apps', updatedApps);
    return app;
  });

  ipcMain.handle('download-update', async (event, { appId, assetName }) => {
    const apps = store.get('apps', []);
    const appData = apps.find(a => a.id === appId);
    if (!appData || !appData.latestRelease) return { success: false, error: 'App not found' };

    const asset = assetName
      ? appData.latestRelease.assets.find(a => a.name === assetName)
      : appData.latestRelease.assets[0];

    if (!asset) {
      shell.openExternal(appData.latestRelease.htmlUrl);
      return { success: true, openedBrowser: true };
    }

    const token = store.get('githubToken', '');
    const downloadsPath = app.getPath('downloads');
    const destPath = path.join(downloadsPath, asset.name);

    try {
      await downloadAsset(asset.downloadUrl, destPath, token, (progress) => {
        event.sender.send('download-progress', { appId, progress });
      });

      const updatedApps = apps.map(a => {
        if (a.id === appId) {
          return { ...a, currentVersion: a.latestVersion, isOutdated: false };
        }
        return a;
      });
      store.set('apps', updatedApps);

      shell.showItemInFolder(destPath);
      return { success: true, path: destPath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('open-release-page', (_, url) => {
    shell.openExternal(url);
    return true;
  });

  ipcMain.handle('check-self-update', async () => {
    return await checkSelfUpdate();
  });

  ipcMain.handle('get-app-version', () => app.getVersion());

  ipcMain.handle('window-minimize', () => mainWindow?.minimize());
  ipcMain.handle('window-close', () => {
    if (store.get('minimizeToTray', true)) {
      mainWindow?.hide();
    } else {
      app.isQuitting = true;
      app.quit();
    }
  });
}

app.whenReady().then(async () => {
  await initStore();
  setupIPC();
  createTray();
  createMainWindow();

  setTimeout(checkAllApps, 3000);
  startCheckInterval();

  autoUpdateInterval = setInterval(async () => {
    const apps = store.get('apps', []);
    for (const appData of apps.filter(a => a.autoUpdate && a.isOutdated)) {
      const asset = appData.latestRelease?.assets?.[0];
      if (!asset) continue;

      const token = store.get('githubToken', '');
      const downloadsPath = app.getPath('downloads');
      const destPath = path.join(downloadsPath, asset.name);

      try {
        await downloadAsset(asset.downloadUrl, destPath, token, null);
        const updatedApps = store.get('apps', []).map(a => {
          if (a.id === appData.id) return { ...a, currentVersion: a.latestVersion, isOutdated: false };
          return a;
        });
        store.set('apps', updatedApps);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('apps-updated', updatedApps);
        }
        if (Notification.isSupported()) {
          new Notification({
            title: `${appData.name} updated!`,
            body: `Updated to ${appData.latestVersion}. Check your Downloads folder.`
          }).show();
        }
      } catch (err) {
        console.error(`Auto-update failed for ${appData.name}:`, err.message);
      }
    }
  }, 5 * 60 * 1000);
});

app.on('window-all-closed', () => {});

app.on('before-quit', () => {
  app.isQuitting = true;
  if (checkInterval) clearInterval(checkInterval);
  if (autoUpdateInterval) clearInterval(autoUpdateInterval);
});

app.on('activate', () => {
  if (!mainWindow) createMainWindow();
});
