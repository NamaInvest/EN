import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initializeDatabase } from './database';
import { checkLicense, generateDeviceFingerprint } from './licenseManager';
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
ipcMain.handle('app:checkUpdate', async () => checkForUpdates(app.getVersion()));
ipcMain.handle('qz:status', async () => getQzTrayStatus());
ipcMain.handle('sync:runOnce', async () => processOutboxOnce());
ipcMain.handle('sync:getStatus', async () => getSyncStatus());
