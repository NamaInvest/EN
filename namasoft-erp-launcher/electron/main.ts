import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initializeDatabase } from './database';
import { checkLicense, generateDeviceFingerprint, saveProvisionedLicense } from './licenseManager';
import { checkForUpdates } from './updater';
import { getQzTrayStatus } from './qzTraySetup';
import { processOutboxOnce, getSyncStatus } from './syncWorker';
import type { LicensePayload } from './types';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, contextIsolation: true,
    },
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  initializeDatabase();
  await createWindow();
});

ipcMain.handle('app:fingerprint', async () => generateDeviceFingerprint());
ipcMain.handle('license:verify', async (_, data: LicensePayload) => checkLicense(data));
ipcMain.handle('license:saveProvision', async (_, data: any) => saveProvisionedLicense(data));
ipcMain.handle('app:checkSubdomain', async () => {
  return { available: true };
});
ipcMain.handle('app:provisionTenant', async (_, data: any) => {
  try {
    const res = await fetch('https://namainvist.com/api/tenant/provision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (e: any) {
    return { success: false, message: e.message };
  }
});
ipcMain.handle('app:checkUpdate', async () => checkForUpdates(app.getVersion()));
ipcMain.handle('qz:status', async () => getQzTrayStatus());
ipcMain.handle('sync:runOnce', async () => processOutboxOnce());
ipcMain.handle('sync:getStatus', async () => getSyncStatus());

let workspaceWindow: BrowserWindow | null = null;
ipcMain.handle('app:openWorkspace', async (_, url: string) => {
  // Validate URL (Security Rule)
  try {
    const parsedUrl = new URL(url);
    if (!parsedUrl.hostname.endsWith('namainvist.com') && parsedUrl.hostname !== 'namainvist.com') {
      throw new Error('Invalid workspace domain');
    }
  } catch (e) {
    console.error('Invalid URL attempt:', url);
    return;
  }

  if (workspaceWindow) {
    workspaceWindow.focus();
    return;
  }

  workspaceWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    title: 'Nama Invest ERP Workspace',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    }
  });

  // Security: prevent navigation outside namainvist.com
  workspaceWindow.webContents.on('will-navigate', (event, targetUrl) => {
    try {
      const parsed = new URL(targetUrl);
      if (!parsed.hostname.endsWith('namainvist.com') && parsed.hostname !== 'namainvist.com') {
        event.preventDefault();
        console.warn('Prevented navigation to external domain:', targetUrl);
      }
    } catch {
      event.preventDefault();
    }
  });

  // Security: Handle new window attempts (e.g. window.open)
  workspaceWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    try {
      const parsed = new URL(targetUrl);
      if (parsed.hostname.endsWith('namainvist.com') || parsed.hostname === 'namainvist.com') {
        return { action: 'allow' }; // Or 'deny' and load in same window
      }
    } catch {}
    return { action: 'deny' };
  });

  workspaceWindow.on('closed', () => {
    workspaceWindow = null;
  });

  // Ensure trialToken is NOT passed in the URL (it should be handled securely, maybe injected later via session or kept strictly in Desktop)
  workspaceWindow.loadURL(url);
});
