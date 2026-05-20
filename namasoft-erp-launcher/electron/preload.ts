import { contextBridge, ipcRenderer } from 'electron';
import type { LicensePayload } from './types';

contextBridge.exposeInMainWorld('electronAPI', {
  getFingerprint: () => ipcRenderer.invoke('app:fingerprint'),
  checkLicense: (data: LicensePayload) => ipcRenderer.invoke('license:verify', data),
  checkUpdates: () => ipcRenderer.invoke('app:checkUpdate'),
  getQzStatus: () => ipcRenderer.invoke('qz:status'),
  runSync: () => ipcRenderer.invoke('sync:runOnce'),
  getSyncStatus: () => ipcRenderer.invoke('sync:getStatus'),
  openWorkspace: (url: string) => ipcRenderer.invoke('app:openWorkspace', url),
  saveProvision: (data: any) => ipcRenderer.invoke('license:saveProvision', data)
});
