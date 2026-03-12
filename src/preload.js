const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getApps: () => ipcRenderer.invoke('get-apps'),
  addApp: (appData) => ipcRenderer.invoke('add-app', appData),
  removeApp: (id) => ipcRenderer.invoke('remove-app', id),
  updateAppConfig: (id, changes) => ipcRenderer.invoke('update-app-config', { id, changes }),

  checkAll: () => ipcRenderer.invoke('check-all'),
  checkApp: (id) => ipcRenderer.invoke('check-app', id),
  downloadUpdate: (appId, assetName) => ipcRenderer.invoke('download-update', { appId, assetName }),
  openReleasePage: (url) => ipcRenderer.invoke('open-release-page', url),

  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  checkSelfUpdate: () => ipcRenderer.invoke('check-self-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  minimize: () => ipcRenderer.invoke('window-minimize'),
  close: () => ipcRenderer.invoke('window-close'),

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
