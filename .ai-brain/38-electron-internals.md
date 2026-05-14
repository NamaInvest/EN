# 38 - تفاصيل Electron (Electron Internals)

> main.js + preload.js + offline-db.js + ZATCA SDK + Native APIs

---

## 📂 هيكل مجلد `electron/`

```
electron/
├── main.js              ← Electron main process
├── preload.js           ← Bridge بين main و renderer
├── offline-db.js        ← Embedded PostgreSQL setup
├── backup-sync.js       ← المزامنة مع Cloud
├── zatca-offline.js     ← ZATCA logic للوضع offline
├── assets/              ← أيقونات، vcredist
│   ├── icon.ico
│   ├── icon.png
│   └── vcredist_x64.exe
└── zatca-sdk/           ← Java SDK رسمي من ZATCA
    ├── Apps/            ← التطبيقات
    ├── Configuration/   ← الإعدادات
    ├── Data/            ← البيانات
    ├── Lib/             ← المكتبات
    ├── LICENSE.txt
    ├── Readme
    ├── install.bat      ← Windows installer
    └── install.sh       ← Linux installer
```

---

## 🎬 main.js (Electron Main Process)

### المسؤوليات:
1. إنشاء BrowserWindow
2. تشغيل Next.js standalone server
3. تشغيل embedded PostgreSQL
4. إدارة الـ License heartbeat
5. Auto-update
6. Native menu
7. Tray icon
8. Protocol handler

### الـ Flow:
```javascript
const { app, BrowserWindow, Menu, Tray } = require('electron');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let tray;
let nextServerPort;

app.whenReady().then(async () => {
    // 1. تشغيل embedded PostgreSQL
    await startEmbeddedPostgres();
    
    // 2. التحقق من License
    const licenseValid = await checkLicense();
    if (!licenseValid) {
        await showLicenseActivation();
    }
    
    // 3. تشغيل Next.js
    nextServerPort = await startNextServer();
    
    // 4. إنشاء الـ Main Window
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        icon: path.join(__dirname, 'assets/icon.png')
    });
    
    // 5. تحميل الـ URL
    mainWindow.loadURL(`http://localhost:${nextServerPort}`);
    
    // 6. Native Menu
    setupNativeMenu();
    
    // 7. Tray icon
    setupTray();
    
    // 8. Auto-update check
    autoUpdater.checkForUpdatesAndNotify();
    
    // 9. License heartbeat
    startLicenseHeartbeat();
});

// IPC handlers
ipcMain.handle('print-receipt', async (event, data) => {
    return printToThermalPrinter(data);
});

ipcMain.handle('scan-barcode', async () => {
    return await readBarcodeFromScanner();
});

ipcMain.handle('open-cash-drawer', async () => {
    return await openCashDrawer();
});
```

---

## 🌉 preload.js (Bridge)

### الغرض:
- يربط بين الـ main process و الـ renderer (UI)
- يكشف APIs محددة آمنة فقط

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // Printer
    printReceipt: (data) => ipcRenderer.invoke('print-receipt', data),
    
    // Scanner
    scanBarcode: () => ipcRenderer.invoke('scan-barcode'),
    
    // Cash Drawer
    openCashDrawer: () => ipcRenderer.invoke('open-cash-drawer'),
    
    // Scale (Weighing)
    readScale: () => ipcRenderer.invoke('read-scale'),
    
    // System
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    getHardwareId: () => ipcRenderer.invoke('get-hardware-id'),
    
    // License
    getLicenseStatus: () => ipcRenderer.invoke('get-license-status'),
    activateLicense: (key) => ipcRenderer.invoke('activate-license', key),
    
    // Backup
    triggerBackup: () => ipcRenderer.invoke('trigger-backup'),
    restoreBackup: (file) => ipcRenderer.invoke('restore-backup', file),
    
    // File System (محدود)
    saveFile: (data, suggestedName) => ipcRenderer.invoke('save-file', data, suggestedName),
    openFile: (filters) => ipcRenderer.invoke('open-file', filters),
    
    // Notifications
    showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
});
```

### الاستخدام في React:
```typescript
// في الـ POS UI:
const handlePrintReceipt = async () => {
    if (window.electron) {
        await window.electron.printReceipt({
            items: cart,
            total: cartTotal,
            invoiceNo: 'INV-1234'
        });
    } else {
        // Web fallback
        window.print();
    }
};
```

---

## 🗄 offline-db.js (Embedded PostgreSQL)

### الـ Setup:
```javascript
const EmbeddedPG = require('embedded-postgres');
const path = require('path');
const electron = require('electron');

let pgInstance;

async function startEmbeddedPostgres() {
    const userDataPath = electron.app.getPath('userData');
    
    pgInstance = new EmbeddedPG({
        databaseDir: path.join(userDataPath, 'postgres'),
        port: 54321,
        user: 'namasoft_local',
        password: await getOrCreatePassword(),
        persistent: true,
        initdbFlags: ['--encoding=UTF8', '--locale=ar_SA.UTF-8']
    });
    
    await pgInstance.initialise();
    await pgInstance.start();
    
    // إنشاء قاعدة البيانات إذا أول مرة
    try {
        await pgInstance.createDatabase('namasoft_local');
    } catch (e) {
        // Database already exists
    }
    
    // تطبيق Prisma migrations (أول مرة فقط)
    if (await isFirstRun()) {
        await runPrismaMigrations();
    }
    
    // تعيين DATABASE_URL لـ Next.js
    const password = await getOrCreatePassword();
    process.env.DATABASE_URL = `postgresql://namasoft_local:${password}@localhost:54321/namasoft_local`;
    process.env.DESKTOP_MODE = 'true';
    
    return pgInstance;
}

async function stopEmbeddedPostgres() {
    if (pgInstance) {
        await pgInstance.stop();
    }
}

// عند إغلاق التطبيق:
electron.app.on('before-quit', async () => {
    await stopEmbeddedPostgres();
});
```

### الـ Password Management:
```javascript
const Store = require('electron-store');
const store = new Store({
    encryptionKey: 'random-32-byte-key-from-machine-id'
});

async function getOrCreatePassword() {
    let password = store.get('pg-password');
    if (!password) {
        password = crypto.randomBytes(32).toString('hex');
        store.set('pg-password', password);
    }
    return password;
}
```

---

## 🔄 backup-sync.js (Cloud Sync)

### الـ Backup المحلي:
```javascript
async function localBackup() {
    const date = format(new Date(), 'yyyy-MM-dd');
    const backupPath = path.join(
        app.getPath('userData'),
        'backups',
        `backup-${date}.sql.gz`
    );
    
    // pg_dump
    const dump = await pgInstance.dump('namasoft_local');
    
    // Compress
    const compressed = await gzip(dump);
    
    // Save
    await fs.writeFile(backupPath, compressed);
    
    // تنظيف backups أقدم من 30 يوم
    await cleanOldBackups(30);
}
```

### الـ Cloud Sync (اختياري):
```javascript
async function syncToCloud() {
    if (!await isInternetAvailable()) return;
    
    // 1. الحصول على التغييرات منذ آخر sync
    const lastSync = store.get('last-sync-timestamp');
    const changes = await getChangesSince(lastSync);
    
    // 2. رفع للـ Cloud
    const response = await fetch('https://namainvist.com/api/sync/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${licenseToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ changes })
    });
    
    if (response.ok) {
        store.set('last-sync-timestamp', new Date().toISOString());
    }
    
    // 3. جلب التغييرات من الـ Cloud
    const remoteChanges = await fetch(
        `https://namainvist.com/api/sync/download?since=${lastSync}`,
        { headers: { 'Authorization': `Bearer ${licenseToken}` } }
    ).then(r => r.json());
    
    // 4. تطبيق محلياً
    await applyRemoteChanges(remoteChanges);
}

// كل ساعة (إذا online):
setInterval(syncToCloud, 60 * 60 * 1000);
```

### Conflict Resolution:
```javascript
// إذا نفس السجل تعدّل في Desktop و Cloud:
function resolveConflict(local, remote) {
    if (local.updatedAt > remote.updatedAt) {
        return local;  // Last Write Wins
    } else if (local.updatedAt < remote.updatedAt) {
        return remote;
    } else {
        // tie: cloud wins (للأمان)
        return remote;
    }
}
```

---

## 🇸🇦 zatca-offline.js (ZATCA Offline)

### الفكرة:
- في حالة انقطاع الإنترنت، يجب أن تستمر إصدار الفواتير
- يولّد QR + Hash + Signature محلياً
- يضع الفواتير في queue
- عند العودة → يرسلها للـ ZATCA

### الـ Flow:
```javascript
async function processInvoiceOffline(invoice) {
    // 1. توليد XML
    const xml = generateUBL21XML(invoice);
    
    // 2. ICV (من DB المحلية)
    const icv = await getLocalIcv();
    await incrementLocalIcv();
    
    // 3. PIH (من DB المحلية)
    const pih = await getLastLocalPih();
    
    // 4. توقيع باستخدام Production CSID المحفوظ
    const csid = await getStoredCSID();
    const signedXml = await sign(xml, csid);
    
    // 5. حساب hash
    const hash = sha256(signedXml);
    await setLastLocalPih(hash);
    
    // 6. QR Code
    const qr = generateQR(invoice, hash, ...);
    
    // 7. حفظ محلياً
    await saveInvoice({
        ...invoice,
        zatcaStatus: 'pending-sync',  // غير 'cleared'
        zatcaHash: hash,
        zatcaQr: qr,
        zatcaSignedXml: signedXml,
        zatcaIcv: icv,
        zatcaPih: pih
    });
    
    // 8. إضافة لـ queue
    await addToSyncQueue(invoice.id);
    
    // 9. العميل يستلم الفاتورة (مع QR)
    return { success: true, qr, hash };
}
```

### عند العودة للإنترنت:
```javascript
async function syncOfflineInvoices() {
    const queued = await getQueuedInvoices();
    
    for (const invoice of queued) {
        try {
            // إرسال للـ ZATCA
            const response = await zatcaSubmit(invoice);
            
            if (response.cleared || response.reported) {
                invoice.zatcaStatus = response.cleared ? 'cleared' : 'reported';
                invoice.clearanceUuid = response.uuid;
                await invoice.save();
                await removeFromSyncQueue(invoice.id);
            }
        } catch (e) {
            invoice.zatcaRetries++;
            invoice.zatcaLastError = e.message;
        }
    }
}
```

---

## 📦 zatca-sdk/ (Java SDK رسمي)

### المحتويات:
- **Apps:** التطبيقات التنفيذية (JAR files)
- **Configuration:** إعدادات
- **Data:** بيانات مرجعية
- **Lib:** Java libraries
- **install.bat / install.sh:** المُثبت

### الاستخدام:
```javascript
const { execSync } = require('child_process');

function callZatcaSDK(command, args) {
    const sdkPath = path.join(__dirname, 'zatca-sdk');
    const cmd = `java -jar ${sdkPath}/Apps/zatca-sdk.jar ${command} ${args.join(' ')}`;
    
    return execSync(cmd, { encoding: 'utf8' });
}

// مثال:
const result = callZatcaSDK('sign-invoice', [
    '--input', 'invoice.xml',
    '--cert', 'cert.pem',
    '--key', 'key.pem',
    '--output', 'signed.xml'
]);
```

### المزايا على TypeScript implementation:
- ✅ Official ZATCA support
- ✅ Updates مع تغييرات ZATCA
- ✅ Validated by ZATCA

### العيوب:
- ❌ يحتاج Java runtime
- ❌ أبطأ من JS
- ❌ أحجم أكبر للـ Electron bundle

---

## 🖨 Native APIs

### Printer Integration:
```javascript
const { print } = require('pdf-to-printer');

async function printToThermalPrinter(data) {
    // 1. توليد PDF من البيانات
    const pdf = await generateReceiptPDF(data);
    
    // 2. حفظ مؤقت
    const tempPath = path.join(os.tmpdir(), `receipt-${Date.now()}.pdf`);
    await fs.writeFile(tempPath, pdf);
    
    // 3. الطباعة
    await print(tempPath, {
        printer: 'Receipt Printer',  // اسم الطابعة
        scale: 'fit',
        silent: true  // بدون preview
    });
    
    // 4. حذف الملف المؤقت
    await fs.unlink(tempPath);
}
```

### Barcode Scanner:
```javascript
// USB scanner يعمل كـ keyboard wedge تلقائياً
// لـ direct USB access:
const HID = require('node-hid');

async function readBarcodeFromScanner() {
    const devices = HID.devices();
    const scanner = devices.find(d => d.productId === 0x1234);
    
    if (!scanner) throw new Error('No scanner found');
    
    return new Promise((resolve) => {
        const device = new HID.HID(scanner.path);
        let buffer = '';
        
        device.on('data', (data) => {
            buffer += parseScanData(data);
            if (buffer.endsWith('\n')) {
                device.close();
                resolve(buffer.trim());
            }
        });
    });
}
```

### Cash Drawer:
```javascript
async function openCashDrawer() {
    // معظم الـ thermal printers يفتحون الـ drawer
    // عبر ESC/POS command:
    const ESC_OPEN_DRAWER = Buffer.from([0x1B, 0x70, 0x00, 0x32, 0x96]);
    
    // إرسال للطابعة (التي تتحكم بالـ drawer)
    await sendToPrinter(ESC_OPEN_DRAWER);
}
```

### Hardware ID:
```javascript
const machineId = require('node-machine-id');

async function getHardwareId() {
    // فريد لكل جهاز
    return await machineId.machineId();
}
```

---

## 🔐 Code Protection (3 طبقات)

### 1. JavaScript Obfuscation:
```bash
# scripts/protect-code.js
node_modules/.bin/javascript-obfuscator \
    .next-electron \
    --output .next-electron-obfuscated \
    --compact true \
    --control-flow-flattening true \
    --dead-code-injection true \
    --string-array true \
    --string-array-encoding base64 \
    --string-array-threshold 0.75
```

### 2. ASAR Encryption:
```json
// electron-builder config:
{
    "asar": true,
    "asarUnpack": ["**/*.node", "node_modules/embedded-postgres/**"]
}
```

### 3. Integrity Check:
```javascript
// عند البدء:
const expectedAsarHash = '...stored at build time...';
const actualHash = sha256(fs.readFileSync('app.asar'));

if (expectedAsarHash !== actualHash) {
    dialog.showErrorBox('Error', 'Application integrity check failed');
    app.quit();
}
```

---

## 🎨 الواجهة الـ Native

### Menu:
```javascript
const menu = Menu.buildFromTemplate([
    {
        label: 'ملف',
        submenu: [
            { label: 'فاتورة جديدة', click: () => mainWindow.webContents.send('new-invoice') },
            { label: 'تصدير', click: handleExport },
            { type: 'separator' },
            { label: 'خروج', role: 'quit' }
        ]
    },
    {
        label: 'تعديل',
        submenu: [
            { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
            { role: 'cut' }, { role: 'copy' }, { role: 'paste' }
        ]
    },
    {
        label: 'عرض',
        submenu: [
            { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'resetZoom' },
            { role: 'togglefullscreen' }
        ]
    },
    {
        label: 'مساعدة',
        submenu: [
            { label: 'حول', click: showAboutDialog },
            { label: 'فحص التحديثات', click: () => autoUpdater.checkForUpdates() },
            { label: 'إرسال السجلات', click: sendLogsToSupport }
        ]
    }
]);

Menu.setApplicationMenu(menu);
```

### System Tray:
```javascript
tray = new Tray(path.join(__dirname, 'assets/icon.png'));
tray.setToolTip('NamaSoft ERP');

const contextMenu = Menu.buildFromTemplate([
    { label: 'فتح', click: () => mainWindow.show() },
    { label: 'POS سريع', click: () => mainWindow.webContents.send('open-pos') },
    { type: 'separator' },
    { label: 'النسخ الاحتياطي', click: triggerBackup },
    { type: 'separator' },
    { label: 'خروج', click: () => app.quit() }
]);

tray.setContextMenu(contextMenu);
```

---

## 📊 Updates

### electron-updater Configuration:
```javascript
// في main.js:
autoUpdater.setFeedURL({
    provider: 'generic',
    url: 'https://updates.namainvist.com/win',
    publishAutoUpdate: true
});

autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox({
        type: 'info',
        title: 'تحديث متاح',
        message: `إصدار جديد ${info.version} متاح. هل تريد التحميل الآن؟`,
        buttons: ['نعم', 'لاحقاً']
    }).then((result) => {
        if (result.response === 0) {
            autoUpdater.downloadUpdate();
        }
    });
});

autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
        type: 'info',
        title: 'التحديث جاهز',
        message: 'تم تنزيل التحديث. سيُطبق عند إعادة التشغيل.',
        buttons: ['إعادة التشغيل الآن', 'لاحقاً']
    }).then((result) => {
        if (result.response === 0) {
            autoUpdater.quitAndInstall();
        }
    });
});
```

---

## 🎯 Best Practices

1. ✅ **contextIsolation: true** دائماً
2. ✅ **nodeIntegration: false**
3. ✅ **preload.js** للـ APIs الآمنة
4. ✅ **CSP headers** في Electron أيضاً
5. ✅ **Auto-updater مُفعّل**
6. ✅ **Code signing** للـ .exe (Windows)
7. ✅ **Sentry للـ crash reporting**
8. ❌ **لا تكشف Node APIs** للـ renderer مباشرة
9. ❌ **لا تشغل remote URLs** بدون CSP
10. ✅ **License check** عند البدء + heartbeat
