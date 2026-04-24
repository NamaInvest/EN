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
  
  // Offline DB & Sync
  saveOfflineProducts: (products) => ipcRenderer.invoke('offline-db-save-products', products),
  searchOfflineProducts: (query) => ipcRenderer.invoke('offline-db-search-products', query),
  clearOfflineProducts: () => ipcRenderer.invoke('offline-db-clear-products'),
  savePendingInvoice: (invoice) => ipcRenderer.invoke('offline-db-save-invoice', invoice),
  getPendingInvoices: () => ipcRenderer.invoke('offline-db-get-pending'),
  markInvoiceSynced: (uuid) => ipcRenderer.invoke('offline-db-mark-synced', uuid),
  
  // ZATCA Offline
  offlineZatcaSign: (invoiceData, settings) => ipcRenderer.invoke('offline-zatca-sign', { invoiceData, settings }),

  // WhatsApp Queue
  queueWhatsApp: (phone, message) => ipcRenderer.invoke('offline-wa-queue', { phone, message }),
  getPendingWhatsApp: () => ipcRenderer.invoke('offline-wa-get'),
  markWhatsAppSent: (id) => ipcRenderer.invoke('offline-wa-mark-sent', id),

  // Silent Printing
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  silentPrint: (options) => ipcRenderer.invoke('silent-print', options),

  // Platform detection
  isDesktop: true,
  platform: process.platform,
  version: process.versions.electron,
});
