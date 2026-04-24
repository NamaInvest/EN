const { app, BrowserWindow, Tray, Menu, nativeImage, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

// ── Safe Console ─────────────────────────────────────────────────────────────
// Prevent EPIPE errors when writing to closed standard output in packaged builds
['log', 'error', 'warn', 'info'].forEach((method) => {
  const original = console[method];
  console[method] = function (...args) {
    try {
      original.apply(console, args);
    } catch (err) {
      // Ignore broken pipe errors
    }
  };
});

process.on('uncaughtException', (err) => {
  if (err.code === 'EPIPE') return;
  // Use the original console.error if possible, or just ignore if it fails
  try { console.error('Uncaught Exception:', err); } catch (e) {}
});

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
let offlineDb = null;

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
        `https://namainvist.com/api/ice/desktop-licenses?key=${encodeURIComponent(key)}`,
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

async function syncFeaturesToLocalDb(allowedFeatures) {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: 'postgresql://nama:NamaLocal2026!@localhost:5433/nama_local', max: 2 });
    
    // We get "allowed features", we need to convert to "hidden modules"
    const ALL_MODULES = ['Sales','POS','Purchases','Inventory','Finance','HR','Manufacturing','CRM','Enterprise','AI','Reports','Settings'];
    const hiddenModules = ALL_MODULES.filter(m => !allowedFeatures.includes(m));

    await pool.query(`CREATE TABLE IF NOT EXISTS "Setting" (key TEXT PRIMARY KEY, value TEXT DEFAULT '')`);
    await pool.query(`
        INSERT INTO "Setting" (key, value) VALUES ('hidden_modules', $1)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `, [JSON.stringify(hiddenModules)]);
    await pool.end();
  } catch (e) {
    console.error('Local feature sync error:', e.message);
  }
}

// Heartbeat: sends license check every 5 min to keep "online" status green
let heartbeatTimer = null;
function startHeartbeat() {
  const key = store.get('license')?.key;
  if (!key) return;

  const doHeartbeat = async () => {
    try {
      const result = await verifyLicenseOnline(key);
      if (result.valid) {
        store.set('lastLicenseVerify', Date.now());
        store.set('licenseStatus', result.data?.status || 'active');
        if (result.data?.features) {
            store.set('tenantFeatures', result.data.features);
            syncFeaturesToLocalDb(result.data.features);
        }
      } else if (!result.offline) {
        // License is invalid — check why
        const status = result.status || '';
        const error = result.error || '';
        
        if (status === 'suspended' || status === 'revoked') {
          console.log(`⛔ License ${status}: blocking access`);
          store.set('licenseStatus', status);
          
          if (mainWindow) {
            // Show blocking page
            mainWindow.loadURL(`http://localhost:${PORT}/login`);
          }
          
          const statusMsg = status === 'suspended' ? 'معلّق' : 'ملغي';
          dialog.showMessageBox(mainWindow, {
            type: 'error',
            title: `⛔ الحساب ${statusMsg}`,
            message: `تم تعطيل حساب الشركة.\n\n${error}\n\nالرجاء التواصل مع الدعم الفني:\n📞 0531206654\n📧 support@namainvist.com`,
            buttons: ['حسناً'],
          });
        } else if (status === 'trial_expired' || status === 'expired') {
          console.log('⏰ License expired');
          store.set('licenseStatus', 'expired');

          dialog.showMessageBox(mainWindow, {
            type: 'warning',
            title: '⏰ انتهت الصلاحية',
            message: `انتهت صلاحية الترخيص.\n\nالرجاء التواصل مع الدعم الفني لتجديد الاشتراك:\n📞 0531206654\n📧 support@namainvist.com`,
            buttons: ['حسناً'],
          });
        }
      }
    } catch {}
  };

  doHeartbeat(); // run immediately
  heartbeatTimer = setInterval(doHeartbeat, 5 * 60 * 1000); // every 5 min
}

// Sync: send company data to cloud on startup (works with or without stored license)
async function syncLicenseToCloud() {
  // Wait 10s for DB to be ready
  await new Promise(r => setTimeout(r, 10000));
  
  try {
    // Read company settings from local DB (key-value format)
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: 'postgresql://nama:NamaLocal2026!@localhost:5433/nama_local', max: 2 });
    let settings = {};
    try {
      const result = await pool.query('SELECT key, value FROM settings');
      for (const row of result.rows) {
        settings[row.key] = row.value;
      }
      await pool.end();
    } catch (e) {
      console.log('☁️ Cloud sync: no local settings yet —', e.message);
      try { await pool.end(); } catch {}
      return;
    }

    const companyName = settings.company_name || '';
    if (!companyName || companyName === 'اسم المنشأة') {
      console.log('☁️ Cloud sync: no company data yet — skipping');
      return;
    }

    const os = require('os');
    const license = store.get('license') || {};
    const hardwareId = license.hardwareId || `${os.hostname()}-${os.platform()}-${os.arch()}`;
    
    const payload = {
      companyNameAr: companyName,
      companyNameEn: settings.company_name_en || '',
      businessDomain: settings.business_domain || '',
      mobile: settings.phone || settings.company_phone || '',
      vatNumber: settings.vat_number || settings.tax_number || '',
      crnNumber: settings.cr_number || '',
      city: settings.city || '',
      district: settings.district || '',
      streetName: settings.street || '',
      buildingNo: settings.building_number || '',
      postalCode: settings.postal_code || '',
      hardwareId: hardwareId,
      deviceName: os.hostname(),
      appVersion: app.getVersion(),
    };

    // If we have a stored license key, send it for sync
    if (license.key) {
      payload.licenseKey = license.key;
    }

    console.log(`☁️ Cloud sync: sending data for "${companyName}" ...`);

    const https = require('https');
    const data = JSON.stringify(payload);
    const req = https.request({
      hostname: 'namainvist.com',
      path: '/api/ice/desktop-register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      let body = '';
      res.on('data', (d) => body += d);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.success) {
            // Save the license key to electron store
            store.set('license', {
              key: result.license_key,
              hardwareId: hardwareId,
              status: result.status,
              company: companyName,
              syncedAt: Date.now(),
            });
            store.set('lastLicenseVerify', Date.now());
            
            // Start heartbeat now that we have a key
            if (!heartbeatTimer) startHeartbeat();
            
            const action = result.synced ? 'synced ✅' : result.re_registered ? 're-registered 🔄' : result.already_registered ? 'already exists ✅' : 'registered 🆕';
            console.log(`☁️ Cloud sync: ${action} — key: ${result.license_key}`);
          } else {
            console.log(`☁️ Cloud sync: failed — ${result.message}`);
          }
        } catch (e) {
          console.log('☁️ Cloud sync: parse error —', e.message);
        }
      });
    });
    req.on('error', (e) => console.log('☁️ Cloud sync: offline —', e.message));
    req.setTimeout(15000, () => { req.destroy(); console.log('☁️ Cloud sync: timeout'); });
    req.write(data);
    req.end();
  } catch (e) {
    console.log('☁️ Cloud sync error:', e.message);
  }
}

// ── Port Check ───────────────────────────────────────────────────────────────
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => { server.close(); resolve(true); });
    server.listen(port, '127.0.0.1');
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
    ELECTRON_RUN_AS_NODE: '1',
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
    fullscreen: true,
    backgroundColor: '#0B0E14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Set Content-Security-Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' http://localhost:* https://namainvist.com https://*.namainvist.com https://fonts.googleapis.com https://fonts.gstatic.com; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:*; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "font-src 'self' https://fonts.gstatic.com data:; " +
          "img-src 'self' data: blob: http://localhost:* https:; " +
          "connect-src 'self' http://localhost:* https://namainvist.com https://*.namainvist.com https://*.zatca.gov.sa wss://localhost:*;"
        ],
      },
    });
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(`http://localhost:${INTERNAL_PORT}/login`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
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

// ── Offline DB Handlers ──────────────────────────────────────────────────────
const OfflineDB = require('./offline-db');

ipcMain.handle('offline-db-save-products', (_, products) => OfflineDB.saveLocalProducts(products));
ipcMain.handle('offline-db-search-products', (_, query) => OfflineDB.searchLocalProducts(query));
ipcMain.handle('offline-db-clear-products', () => OfflineDB.clearLocalProducts());
ipcMain.handle('offline-db-save-invoice', (_, invoice) => OfflineDB.savePendingInvoice(invoice));
ipcMain.handle('offline-db-get-pending', () => OfflineDB.getPendingInvoices());
ipcMain.handle('offline-db-mark-synced', (_, uuid) => OfflineDB.markInvoiceSynced(uuid));
ipcMain.handle('offline-db-increment-retry', (_, uuid) => OfflineDB.incrementInvoiceRetry(uuid));
ipcMain.handle('offline-db-delete-synced', () => OfflineDB.deleteSyncedInvoices());

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
    if (result.data?.features) {
        store.set('tenantFeatures', result.data.features);
        syncFeaturesToLocalDb(result.data.features);
    }
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

  // 1.5 Start Offline SQLite DB
  const isOfflineDbReady = OfflineDB.initDB(app.getPath('userData'));
  if (isOfflineDbReady) {
      console.log('✅ Offline Database is ready to use');
  } else {
      console.log('⚠️ Offline Database failed to start');
  }

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

  // 5. Start heartbeat (license verify every 5 min for online status)
  startHeartbeat();

  // 6. Sync company data to cloud (re-register if deleted)
  syncLicenseToCloud();

  // 7. Auto Updater setup
  if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();

      autoUpdater.on('update-available', () => {
          console.log('Update available.');
          if (mainWindow) {
              mainWindow.webContents.send('update_available');
          }
      });

      autoUpdater.on('update-downloaded', () => {
          console.log('Update downloaded.');
          if (mainWindow) {
              mainWindow.webContents.send('update_downloaded');
          }
          dialog.showMessageBox({
              type: 'info',
              title: 'تحديث متاح',
              message: 'تم تحميل تحديث جديد للتطبيق. هل تريد تثبيت التحديث وإعادة التشغيل الآن؟',
              buttons: ['نعم، إعادة التشغيل', 'لاحقاً']
          }).then(result => {
              if (result.response === 0) {
                  isQuitting = true;
                  autoUpdater.quitAndInstall();
              }
          });
      });

      autoUpdater.on('error', (err) => {
          console.error('Error in auto-updater.', err);
      });
  }
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
