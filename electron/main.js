const { app, BrowserWindow, Tray, Menu, nativeImage, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');
const fs = require('fs');

// ──────────────────────────────────────────────────────────────────────────────
// Nama Invest ERP — Electron Main Process
// ──────────────────────────────────────────────────────────────────────────────

const APP_NAME = 'Nama Invest ERP';
const INTERNAL_PORT = 3500;
const isDev = !app.isPackaged;

let mainWindow = null;
let tray = null;
let nextProcess = null;
let isQuitting = false;
let localPg = null;

// ── Paths ────────────────────────────────────────────────────────────────────
function getAppPath(...segments) {
  const base = isDev ? path.join(__dirname, '..') : path.join(process.resourcesPath, 'app');
  return path.join(base, ...segments);
}

function getDataPath(...segments) {
  return path.join(app.getPath('userData'), ...segments);
}

// ── License Manager ──────────────────────────────────────────────────────────
let store;
try {
  const ElectronStore = require('electron-store');
  const StoreClass = ElectronStore.default || ElectronStore;
  store = new StoreClass({
    encryptionKey: 'nama-invest-2026-secure-key',
    name: 'nama-config',
  });
} catch (e) {
  console.error('Store init error:', e.message);
  store = { get: () => null, set: () => {}, delete: () => {} };
}

function isLicenseValid() {
  const license = store.get('license');
  if (!license) return false;
  const lastVerified = store.get('lastLicenseVerify') || 0;
  const daysSinceVerify = (Date.now() - lastVerified) / (1000 * 60 * 60 * 24);
  return daysSinceVerify < 30;
}

async function verifyLicenseOnline(key) {
  try {
    const https = require('https');
    return new Promise((resolve) => {
      const req = https.get(
        `https://namainvist.com/api/ice/license/verify?key=${encodeURIComponent(key)}`,
        (res) => {
          let data = '';
          res.on('data', (d) => (data += d));
          res.on('end', () => {
            try { resolve(JSON.parse(data)); }
            catch { resolve({ valid: false }); }
          });
        }
      );
      req.on('error', () => resolve({ valid: false, offline: true }));
      req.setTimeout(10000, () => { req.destroy(); resolve({ valid: false, offline: true }); });
    });
  } catch {
    return { valid: false, offline: true };
  }
}

// ── Port Check ───────────────────────────────────────────────────────────────
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => { server.close(); resolve(true); });
    server.listen(port);
  });
}

async function waitForServer(port, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const available = await isPortAvailable(port);
      if (!available) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

// ── Start Local PostgreSQL ───────────────────────────────────────────────────
async function startLocalDatabase() {
  try {
    const { LocalPostgres } = require('./db/local-postgres');
    localPg = new LocalPostgres();

    const started = await localPg.start();
    if (!started) {
      console.log('⚠️ Embedded PostgreSQL failed, falling back to .env DATABASE_URL');
      return null;
    }

    // Run migrations
    await localPg.runMigrations();

    // Seed defaults
    await localPg.seedDefaults();

    return localPg;
  } catch (err) {
    console.error('⚠️ Local DB setup error:', err.message);
    console.log('📌 Falling back to .env DATABASE_URL');
    return null;
  }
}

// ── Start Next.js Server ─────────────────────────────────────────────────────
async function startNextServer(dbEnv) {
  const available = await isPortAvailable(INTERNAL_PORT);
  if (!available) {
    console.log(`Port ${INTERNAL_PORT} already in use, connecting...`);
    return;
  }

  // Merge environment: Desktop overrides cloud settings
  const desktopEnv = {
    ...process.env,
    ...dbEnv,
    PORT: INTERNAL_PORT.toString(),
    DESKTOP_MODE: 'true',
    // Disable Clerk in desktop mode
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: '',
    CLERK_SECRET_KEY: '',
  };

  if (isDev) {
    console.log('🔧 Starting Next.js dev server...');
    nextProcess = spawn('npx', ['next', 'dev', '-p', INTERNAL_PORT.toString()], {
      cwd: path.join(__dirname, '..'),
      shell: true,
      env: desktopEnv,
    });
  } else {
    console.log('🚀 Starting Next.js standalone server...');
    const serverPath = path.join(process.resourcesPath, 'standalone', 'server.js');
    nextProcess = spawn(process.execPath, [serverPath], {
      cwd: path.join(process.resourcesPath, 'standalone'),
      env: { ...desktopEnv, HOSTNAME: 'localhost', NODE_ENV: 'production' },
    });
  }

  nextProcess.stdout?.on('data', (data) => console.log(`[NEXT] ${data}`));
  nextProcess.stderr?.on('data', (data) => console.error(`[NEXT ERR] ${data}`));
  nextProcess.on('close', (code) => {
    console.log(`[NEXT] Process exited with code ${code}`);
    if (!isQuitting) {
      dialog.showErrorBox('خطأ', 'توقف السيرفر المحلي. سيتم إعادة التشغيل.');
      app.relaunch();
      app.exit(0);
    }
  });

  console.log('⏳ Waiting for server...');
  const ready = await waitForServer(INTERNAL_PORT, 60000);
  if (!ready) {
    dialog.showErrorBox('خطأ', 'لم يتمكن النظام من التشغيل. حاول مرة أخرى.');
    app.exit(1);
  }
  console.log('✅ Server is ready!');
}

// ── Create Window ────────────────────────────────────────────────────────────
function createWindow() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: iconPath,
    title: APP_NAME,
    show: false,
    backgroundColor: '#0B0E14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(`http://localhost:${INTERNAL_PORT}/login`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools();
  });

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── System Tray ──────────────────────────────────────────────────────────────
function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 24, height: 24 });
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: '🖥️ فتح نما إنفست', click: () => { if (mainWindow) mainWindow.show(); } },
    { type: 'separator' },
    {
      label: '💾 حالة النسخ الاحتياطي',
      click: () => {
        const lastBackup = store.get('lastBackupTime');
        const msg = lastBackup
          ? `آخر نسخة احتياطية: ${new Date(lastBackup).toLocaleString('ar-SA')}`
          : 'لم يتم إنشاء نسخة احتياطية بعد';
        dialog.showMessageBox({ type: 'info', title: 'النسخ الاحتياطي', message: msg });
      },
    },
    {
      label: '📋 معلومات الرخصة',
      click: () => {
        const license = store.get('license');
        const msg = license
          ? `الرخصة: ${license.key}\nالحالة: مفعّلة ✅\nالشركة: ${license.company || '-'}`
          : 'لم يتم تفعيل البرنامج';
        dialog.showMessageBox({ type: 'info', title: 'معلومات الرخصة', message: msg });
      },
    },
    { type: 'separator' },
    { label: '🔄 إعادة تشغيل', click: () => { app.relaunch(); app.exit(0); } },
    {
      label: '❌ إغلاق البرنامج',
      click: () => { isQuitting = true; app.quit(); },
    },
  ]);

  tray.setToolTip(APP_NAME);
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => { if (mainWindow) mainWindow.show(); });
}

// ── Backup Sync ──────────────────────────────────────────────────────────────
const BackupSync = require('./backup-sync');
let backupSync = null;

// ── IPC Handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('get-license', () => store.get('license'));
ipcMain.handle('get-app-info', () => ({
  version: app.getVersion(),
  name: APP_NAME,
  dataPath: app.getPath('userData'),
  isPackaged: app.isPackaged,
  dbPort: localPg ? 5433 : null,
}));
ipcMain.handle('activate-license', async (_, key) => {
  const result = await verifyLicenseOnline(key);
  if (result.valid) {
    store.set('license', { key, ...result.data, activatedAt: Date.now() });
    store.set('lastLicenseVerify', Date.now());
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error || 'مفتاح غير صالح' };
});
ipcMain.handle('get-backup-status', () => ({
  lastBackup: store.get('lastBackupTime'),
  lastSize: store.get('lastBackupSize'),
  pending: store.get('backupPending'),
}));
ipcMain.handle('trigger-backup', async () => {
  if (backupSync) {
    await backupSync.check();
    return { success: true };
  }
  return { success: false };
});

// ── App Lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  console.log(`\n🚀 ${APP_NAME} v${app.getVersion()}`);
  console.log(`📂 Data: ${app.getPath('userData')}`);

  // 1. Start local PostgreSQL
  const pg = await startLocalDatabase();
  const dbEnv = pg ? pg.getEnvVars() : {};

  // 2. Start Next.js server with local DB
  await startNextServer(dbEnv);

  // 3. Create window & tray
  createWindow();
  createTray();

  // 4. Start backup sync
  try {
    backupSync = new BackupSync(store);
    backupSync.start();
  } catch (e) {
    console.error('Backup sync error:', e.message);
  }

  // 5. Periodic license verification (every 7 days)
  setInterval(async () => {
    const license = store.get('license');
    if (license?.key) {
      const result = await verifyLicenseOnline(license.key);
      if (result.valid) {
        store.set('lastLicenseVerify', Date.now());
      } else if (!result.offline) {
        store.delete('license');
        dialog.showMessageBox({
          type: 'warning',
          title: 'تم إلغاء الرخصة',
          message: 'تم إلغاء رخصة البرنامج. تواصل مع الدعم الفني.',
        });
      }
    }
  }, 7 * 24 * 60 * 60 * 1000);
});

app.on('window-all-closed', () => {
  // Stay in tray, don't quit
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
  else mainWindow.show();
});

app.on('before-quit', async () => {
  isQuitting = true;
  if (nextProcess) { nextProcess.kill(); nextProcess = null; }
  if (backupSync) { backupSync.stop(); }
  if (localPg) { await localPg.stop(); }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}
