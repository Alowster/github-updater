const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Apps
  getApps: () => ipcRenderer.invoke('get-apps'),
  addApp: (appData) => ipcRenderer.invoke('add-app', appData),
  removeApp: (id) => ipcRenderer.invoke('remove-app', id),
  updateAppConfig: (id, changes) => ipcRenderer.invoke('update-app-config', { id, changes }),

  // Checking & updating
  checkAll: () => ipcRenderer.invoke('check-all'),
  checkApp: (id) => ipcRenderer.invoke('check-app', id),
  downloadUpdate: (appId, assetName) => ipcRenderer.invoke('download-update', { appId, assetName }),
  openReleasePage: (url) => ipcRenderer.invoke('open-release-page', url),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  // Self
  checkSelfUpdate: () => ipcRenderer.invoke('check-self-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  close: () => ipcRenderer.invoke('window-close'),

  // Events
  onAppsUpdated: (cb) => {
    const handler = (_, data) => cb(data);
    ipcRenderer.on('apps-updated', handler);
    return () => ipcRenderer.removeListener('apps-updated', handler);
  },
  onDownloadProgress: (cb) => {
    const handler = (_, data) => cb(data);
    ipcRenderer.on('download-progress', handler);
    return () => ipcRenderer.removeListener('download-progress', handler);
  }
});
