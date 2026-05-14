# 29 - النسخة المكتبية (Electron Desktop)

> Electron + embedded PostgreSQL + License Heartbeat + Code Protection

---

## 🖥 لماذا Desktop؟

1. **العمل بدون إنترنت** — POS لا يتوقف لو انقطع النت
2. **الأداء العالي** — بدون latency
3. **الأمان** — البيانات على الجهاز
4. **عملاء صغار** — بدون اشتراك سحابي شهري
5. **عملاء حساسون** — يفضلون البيانات محلياً

---

## 🏗 المعمارية

```
┌─────────────────────────────────────────┐
│   Electron App (NamaSoft Desktop.exe)   │
├─────────────────────────────────────────┤
│  • Next.js Standalone Server             │
│  • Embedded PostgreSQL (18-beta)         │
│  • Prisma (local)                        │
│  • UI (نفس الـ Web)                      │
│  • License Heartbeat                     │
│  • Auto-updater                          │
└─────────────────────────────────────────┘
            │
            │ Heartbeat يومي
            ▼
┌─────────────────────────────────────────┐
│   Cloud (namainvist.com)                 │
│  • License Validation                    │
│  • Feature Flags                         │
│  • Updates (latest.yml)                  │
│  • Sync (اختياري)                       │
└─────────────────────────────────────────┘
```

### الحزم:
- **electron** 42.0.1
- **electron-builder** 26.8.1
- **electron-updater** 6.8.3
- **electron-store** 11.0.2
- **embedded-postgres** 18.3.0-beta.17
- **better-sqlite3** 12.9.0 (cache محلي)

---

## 📦 الـ Build

### الأوامر:
```bash
# Development:
npm run electron:dev
# = concurrently "node scripts/start-desktop.js" "wait-on http://localhost:3500 && electron ."

# Build:
npm run electron:build
# = npm version patch + prebuild + next build + clean-standalone + protect-code + electron-builder --win

# Pack only (للاختبار):
npm run electron:pack

# Protect code only:
npm run electron:protect
```

### الـ Pipeline:
```
1. npm version patch
   → يزيد patch version في package.json

2. node scripts/prebuild.js
   → تحضير المشروع

3. cross-env ELECTRON_BUILD=1 next build
   → ينتج .next-electron/ (بدلاً من .next/)

4. node scripts/clean-standalone.js
   → ينظف standalone

5. node scripts/protect-code.js
   → obfuscation للـ JS

6. electron-builder --win
   → ينتج .exe في dist/
```

### الـ Output:
```
dist/
├── NamaSoft-Setup-2.4.8.exe
├── NamaSoft-Setup-2.4.8.exe.blockmap
├── latest.yml                   # لـ auto-update
└── win-unpacked/                # للاختبار
```

---

## 🔐 الترخيص (Licensing)

### الـ Setup الأول:
```
1. العميل يحمّل NamaSoft-Setup.exe
2. ينصب على Windows
3. أول تشغيل:
   - يطلب License Key
   - format: NMA-XXXX-XXXX-XXXX-XXXX
4. الـ App يتصل بـ namainvist.com:
   POST /api/license/verify
   { licenseKey, hardwareId, appVersion }
5. السيرفر يفحص:
   - License موجود
   - status: ACTIVE
   - hardwareId مطابق (أو first activation)
   - expiry لم يمر
6. السيرفر يرجع payload موقع:
   {
       valid: true,
       features: ['POS', 'ACCOUNTING', 'INVENTORY', ...],
       maxUsers: 5,
       expiresAt: '2027-05-14',
       signature: HMAC-SHA256(payload, secret)
   }
7. الـ App يحفظ التوكن في electron-store (encrypted)
8. ينشئ embedded PostgreSQL DB
9. يطبق Prisma schema
10. يبدأ Next.js محلياً على :3500
11. يفتح browser على localhost:3500
```

### النموذج:
```prisma
DesktopLicense {
    tenantId
    licenseKey, hardwareId
    activatedAt, expiresAt
    status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED'
    appVersion, lastHeartbeat, heartbeatCount
    features: Json
    maxUsers
    customerName, customerEmail
}
```

---

## ❤️ Heartbeat اليومي

### كل 24 ساعة:
```typescript
// في electron main process
setInterval(async () => {
    try {
        const response = await fetch('https://namainvist.com/api/license/heartbeat', {
            method: 'POST',
            body: JSON.stringify({
                licenseKey,
                hardwareId,
                appVersion,
                stats: {
                    recordCount,
                    lastActivity,
                    crashCount
                }
            })
        });
        
        const data = await response.json();
        
        if (!data.valid) {
            showLicenseError();
        }
        
        // تحديث feature flags
        updateLocalFeatureFlags(data.features);
        
        // إذا إصدار جديد
        if (data.latestVersion > appVersion) {
            notifyUserOfUpdate();
        }
    } catch (e) {
        // لا إنترنت → نسجل ونحاول لاحقاً
    }
}, 24 * 60 * 60 * 1000);
```

### إذا لم يتصل > 7 أيام:
- إنذار للمستخدم
- بعد 30 يوم: Grace Period
- بعد 60 يوم: يطلب الاتصال للتحقق
- بعد 90 يوم: يقفل الميزات الحرجة (Sales/ZATCA)

---

## 💾 Embedded PostgreSQL

### الـ Setup:
```typescript
// scripts/start-desktop.js
const EmbeddedPG = require('embedded-postgres');

const pg = new EmbeddedPG({
    databaseDir: app.getPath('userData') + '/postgres',
    port: 54321,
    user: 'namasoft_local',
    password: encryptedPasswordFromStore(), // محفوظة في electron-store
    persistent: true,
});

await pg.initialise();
await pg.start();
await pg.createDatabase('namasoft_local');

// تعيين environment للـ Next.js
process.env.DATABASE_URL = `postgresql://...localhost:54321/namasoft_local`;
process.env.DESKTOP_MODE = 'true';

// بدء Next.js
const next = require('next');
const app = next({ dev: false, dir: __dirname + '/.next-electron' });
await app.prepare();
const server = app.getRequestHandler();

http.createServer(server).listen(3500);
```

### المميزات:
- لا يحتاج تثبيت PostgreSQL منفصل
- يبدأ مع التطبيق، يتوقف عند إغلاق
- البيانات في `%APPDATA%\NamaSoft\postgres\`
- نسخ احتياطي يومي تلقائي

---

## 🔒 حماية الكود (Code Protection)

### الـ 3 طبقات:

#### 1. JavaScript Obfuscation:
```bash
# scripts/protect-code.js
javascript-obfuscator → يحول الكود لـ:
- أسماء متغيرات مشفرة (a, b, c, _0x123)
- Control flow flattening
- Dead code injection
- String encryption
```

#### 2. ASAR Encryption:
```json
// electron-builder config:
"asar": true,
"asarUnpack": ["node_modules/embedded-postgres/**"]
```
- ASAR = Archive format (مثل tar)
- يصعّب الاستخراج

#### 3. Integrity Check:
```javascript
// عند البدء:
const expectedHash = readBundledHash();
const actualHash = sha256(fs.readFileSync(asarPath));
if (expectedHash !== actualHash) {
    app.quit(); // محاولة تلاعب
}
```

### Bytecode Compilation (اختياري):
```bash
# scripts/bytecode-compile.js
bytenode → يحول .js لـ bytecode
- أصعب reverse engineering
- لكن أبطأ قليلاً
```

---

## 🔄 Auto Updates

### المكتبة: `electron-updater`

### الـ Flow:
```typescript
import { autoUpdater } from 'electron-updater';

// عند بدء التطبيق:
app.whenReady().then(() => {
    autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on('update-available', (info) => {
    // إصدار جديد متاح → التحميل في الخلفية
});

autoUpdater.on('update-downloaded', (info) => {
    // عرض رسالة للمستخدم: "إصدار جديد متاح، إعادة التشغيل؟"
    const choice = dialog.showMessageBoxSync({
        type: 'info',
        buttons: ['Restart Now', 'Later'],
        message: `Update v${info.version} is ready.`,
    });
    
    if (choice === 0) {
        autoUpdater.quitAndInstall();
    }
});
```

### Server-side:
- `https://updates.namainvist.com/win/latest.yml`
- يحتوي معلومات الإصدار الأحدث
- الـ binary على CDN

---

## 🖼 الـ UI

### Layout:
- نفس الـ Web (React + Next.js)
- لكن **بدون**:
  - subdomain (single-tenant)
  - Cloud-only features (provisioning, ICE)
  - بعض الـ integrations (تحتاج إنترنت)

### الـ DesktopBanner:
```tsx
{isDesktop && (
    <Banner>
        💻 النسخة المكتبية — v2.4.8
        🔑 License: Active until 2027-05-14
        🔄 Last Sync: 2026-05-14 10:30
    </Banner>
)}
```

### Native Menu:
- File → New / Open / Save / Export
- Edit → Cut / Copy / Paste / Undo
- View → Zoom In/Out / Fullscreen
- Help → About / Check Updates / Send Logs

---

## 🔧 Hardware Integration

### Printer (Direct):
- `qz-tray` library
- طباعة Thermal مباشرة (ESC/POS)
- بدون preview UI

### Cash Drawer:
- USB
- يفتح عند الـ POS sale
- ESC/POS commands

### Barcode Scanner:
- Keyboard wedge (يعمل تلقائياً)
- أو USB direct (`usb` library)

### Customer Display:
- Pole display (USB Serial)
- يعرض المنتجات + الإجمالي

### Scale:
- Weighing scale (Serial/USB)
- يقرأ الوزن مباشرة
- مفيد للبقالة والسوبرماركت

### Card Reader (mada):
- HSM (Hardware Security Module)
- يتعامل مع البطاقات
- تكامل مع البنوك السعودية

---

## 🔄 Sync مع السحابة (Optional)

### السيناريو:
عميل لديه Desktop + Web (نفس البيانات):

```
1. كل تعديل في Desktop:
   - يحفظ محلياً فوراً
   - يضع في queue
2. عند الاتصال بالإنترنت:
   - POST /api/sync/upload (دفعة)
   - الـ Cloud يطبق التعديلات
3. عند الاتصال:
   - GET /api/sync/download
   - يجلب التعديلات من Web
   - يطبقها محلياً
```

### Conflict Resolution:
- **Last-Write-Wins** (افتراضي)
- **User-Decides** (للحساسات)
- **Server-Wins** (للـ system data)

### الحالة: 🟡 جزئي
- Schema جاهز
- المنطق غير مستقر
- المعظم يستخدم Desktop OR Web فقط (ليس كلاهما)

---

## 📊 Crash Reporting

### النموذج:
```prisma
DesktopCrashReport {
    licenseKey, hardwareId
    appVersion, crashDate, crashType
    stackTrace, environment: Json
    submittedAt, reproducible
    fixedInVersion
}
```

### الـ Flow:
```
1. الـ Electron يلتقط uncaught exceptions
2. عند crash:
   - يحفظ stack trace محلياً
3. عند إعادة التشغيل + الاتصال:
   - POST /api/license/crash-report
4. الـ Sentry يستلم النسخة
5. الـ Dev team يصلح
```

---

## 🎨 ميزات خاصة بـ Desktop

### 1. Offline POS:
- يكمل العمل بدون إنترنت
- الفواتير في queue
- عند العودة → إرسال للـ ZATCA + Cloud

### 2. Local Backup:
- نسخ احتياطي يومي تلقائي
- إلى External Drive أو USB
- إعدادات backup retention

### 3. Local File Import:
- Excel/CSV من Desktop folder
- بدون رفع للسحابة

### 4. Local Reports:
- تصدير PDF/Excel
- يحفظ مباشرة على الجهاز

### 5. Native Notifications:
- Windows toast notifications
- للتذكيرات والـ alerts

---

## ⚠️ القيود

### لا يعمل في Desktop:
- ❌ Tenant Provisioning
- ❌ ICE Super Admin
- ❌ Master Panel
- ❌ Multi-tenant
- ❌ External Webhooks (إلا عبر Cloud)
- ❌ WhatsApp Worker (heavy Puppeteer)
- ❌ Salla/Zid (يحتاج Cloud webhook URL)

### يعمل بالكامل:
- ✅ كل ERP modules
- ✅ POS (Retail + Restaurant)
- ✅ Manufacturing
- ✅ HR + Payroll
- ✅ ZATCA Phase 2 (عند الاتصال)
- ✅ تقارير + AI (عند الاتصال)
- ✅ Print + Backup

---

## 📱 PWA (Progressive Web App)

### للموبايل:
- `next-pwa` library
- `manifest.json`
- Service Worker

### الميزات:
- "Add to Home Screen"
- Offline-first (cached pages)
- Push notifications (مستقبلاً)
- موبايل-friendly UI

### المسار:
- `manifest` route → يقدم PWA manifest

---

## 🎯 Best Practices

1. ✅ **License Heartbeat منتظم** (لا تجاوزه)
2. ✅ **Auto-update مفعّل** افتراضياً
3. ✅ **Backup يومي** تلقائي
4. ✅ **Code Protection 3 طبقات**
5. ✅ **Sentry لـ crash reporting**
6. ✅ **Embedded PG في userData** (encrypted)
7. ✅ **Hardware ID lock** لمنع التعدد
8. ✅ **Grace period** قبل الإغلاق
9. ❌ **لا تخزن License Key** بـ clear text
10. ❌ **لا تترك PG port** مفتوح للشبكة
