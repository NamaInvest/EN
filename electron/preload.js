const { contextBridge, ipcRenderer } = require('electron');

// ──────────────────────────────────────────────────────────────────────────────
// Nama Invest — Preload Script (Secure Context Bridge)
// ──────────────────────────────────────────────────────────────────────────────

contextBridge.exposeInMainWorld('namaDesktop', {
  // App info
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // License
  getLicense: () => ipcRenderer.invoke('get-license'),
  activateLicense: (key) => ipcRenderer.invoke('activate-license', key),
  
  // Backup
  getBackupStatus: () => ipcRenderer.invoke('get-backup-status'),
  triggerBackup: () => ipcRenderer.invoke('trigger-backup'),
  
  // Platform detection
  isDesktop: true,
  platform: process.platform,
  version: process.versions.electron,
});
