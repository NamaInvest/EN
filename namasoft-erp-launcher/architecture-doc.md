# 🏗️ Namasoft ERP Desktop Launcher Enterprise (v2.4.8)

تم الانتهاء من بناء الهيكل الأساسي (Architecture Skeleton) للتطبيق ليكون تطبيق سطح مكتب مستقل تماماً باستخدام (Electron, React, Vite, SQLite, TypeScript).

---

## 📂 1. شجرة المشروع (Project Tree)

\`\`\`text
namasoft-erp-launcher/
├── package.json               # إعدادات المكتبات وأوامر التشغيل
├── tsconfig.json              # إعدادات TypeScript الصارمة (بدون any)
├── vite.config.ts             # إعدادات Vite مع إضافة Electron plugin
├── electron-builder.yml       # إعدادات بناء الـ EXE وخصائص التثبيت (NSIS)
├── tailwind.config.js         # إعدادات TailwindCSS
├── index.html                 # مدخل الـ React
├── electron/                  # 🖥️ ملفات الخلفية (Main Process)
│   ├── main.ts                # نقطة البداية، إدارة النوافذ، الـ IPC
│   ├── preload.ts             # جسر التواصل الآمن (Context Bridge)
│   ├── database.ts            # تهيئة SQLite وإنشاء جداول الأوفلاين
│   └── licenseManager.ts      # توليد الـ Fingerprint والتحقق من التراخيص
└── src/                       # 🎨 ملفات الواجهة (Renderer Process)
    ├── main.tsx               # نقطة بداية React
    ├── App.tsx                # مكون التطبيق الرئيسي (شاشة الترحيب)
    └── index.css              # ملف الـ CSS الأساسي
\`\`\`

---

## 📄 2. الملفات التي تم إنشاؤها

1. **`electron/database.ts`**: لإنشاء SQLite Database (بواسطة `better-sqlite3`) وبناء جداول `cached_license` و `local_outbox`.
2. **`electron/licenseManager.ts`**: لإنشاء بصمة الجهاز `Device Fingerprint` استناداً إلى الـ Hardware.
3. **`electron/main.ts`**: الـ Entry point لـ Electron ومُعالج رسائل `ipcMain`.
4. **`electron/preload.ts`**: يوفر واجهة `window.electronAPI` للواجهة الأمامية بأمان.
5. **`electron-builder.yml`**: ملف إعداد الـ Installer `NSIS` الصامت ليثبت كـ User-level.
6. **ملفات واجهة React** (`App.tsx`, `main.tsx`, `index.css`) مدعومة بـ Tailwind.

---

## 🛠️ 3. طريقة تشغيل التطوير (Development)

افتح سطر الأوامر داخل المجلد `namasoft-erp-launcher`:

\`\`\`bash
# 1. تثبيت الحزم والمكتبات
npm install

# 2. تشغيل التطبيق في وضع التطوير (Hot-reload)
npm run dev
\`\`\`

---

## 🏗️ 4. طريقة الـ Build وإنشاء الـ EXE

لإصدار نسخة جاهزة للعميل:

\`\`\`bash
# يقوم هذا الأمر بتشغيل (TypeScript Check) ثم (Vite Build) للواجهات، 
# ثم يجمع التطبيق بواسطة electron-builder
npm run build
\`\`\`

النتيجة النهائية ستكون في مجلد `release/2.4.8/` بصيغة:
**`NamasoftERPLauncher Setup 2.4.8.exe`**

---

## 🔐 5. طريقة التوقيع الرقمي (Code Signing)

لإزالة تحذير Windows SmartScreen، يجب توقيع التطبيق. أضف هذه المتغيرات في البيئة لديك (أو في `.env`) قبل تشغيل أمر الـ Build:

\`\`\`bash
# إذا كان لديك شهادة بصيغة pfx:
export CSC_LINK="file://path/to/certificate.pfx"
export CSC_KEY_PASSWORD="كلمة_مرور_الشهادة"

# ثم قم بتشغيل:
npm run build
\`\`\`
*(يقوم `electron-builder` بالتقاط هذه المتغيرات وتوقيع الـ EXE تلقائياً).*

---

## 📍 6. أماكن تخزين البيانات الحساسة

### مكان ملفات SQLite
قاعدة البيانات تسمى `namasoft_offline.sqlite`، يتم إنشاؤها تلقائياً في المسار الخاص بالويندوز (حتى لا تُحذف عند التحديث):
\`C:\\Users\\[Username]\\AppData\\Roaming\\NamasoftERPLauncher\\namasoft_offline.sqlite\`

### مكان Config Files
إعدادات المستخدم تُحفظ في المجلد نفسه:
\`C:\\Users\\[Username]\\AppData\\Roaming\\NamasoftERPLauncher\\config.json\` (أو داخل SQLite كـ Key/Value).

### مكان Offline Queue (طابور العمليات غير المتصلة)
داخل قاعدة بيانات SQLite في الجدول المسمى `local_outbox`. جميع العمليات تُحفظ هنا مع `idempotency_key` و `status='PENDING'`. عند رجوع الإنترنت، يقوم الـ Sync Worker بقراءة هذا الجدول وإرسال البيانات تباعاً.

---

## 🧩 7. شرح Architecture كامل (بنية النظام)

تم تصميم البنية لتكون **Local-First (مستقلة وتعمل بدون إنترنت أساساً)** مع **Cloud-Sync**:

1. **الـ Installer (NSIS)**: 
   لا يحتاج لـ Admin (إلا إذا أردت تثبيت QZ Tray كخدمة). يُنزّل ملفات Electron فقط والمكتبات المدمجة، ولا يحتاج Node.js أو PostgreSQL.
2. **الـ Main Process (Node.js/Electron)**: 
   مسؤول عن الاتصال بالـ Hardware (الطابعات عبر QZ Tray)، قراءة الـ Machine ID، وإدارة `better-sqlite3`. لا يُسمح للواجهة (Renderer) بالوصول المباشر لقاعدة البيانات لضمان الأمان.
3. **Device Binding (ربط الجهاز)**: 
   يتم دمج `hwid` + `hostname` + `username` + `salt` وتحويلها عبر `SHA-256` لضمان أن الترخيص يعمل على هذا الجهاز فقط. لا يُحفظ הـ License Key صريحاً، بل يُرسل للـ API للتحقق ثم تُحفظ النتيجة المشفرة محلياً.
4. **الـ Renderer Process (React/Vite)**: 
   الواجهة الأمامية خفيفة وسريعة، وتتصل بالنظام الخلفي عبر `window.electronAPI` (Preload Bridge).
5. **Sync Engine (محرك المزامنة)**:
   - **Offline**: أي حركة تُخزن كـ JSON داخل جدول `local_outbox`.
   - **Online**: عندما ترصد الشبكة اتصالاً (`navigator.onLine` أو Ping Server)، يبدأ سحب صف العمليات `FIFO` ويرسلها للـ `POST /api/sync/push`. لا يتم الحذف إلا بعد تلقي تأكيد بالنجاح `POST /api/sync/ack`. أي خطأ نهائي ينتقل لـ `dead_letter_queue` ليراجعه المدير.
6. **Updates Engine**: 
   يقوم بإرسال `GET /api/app/latest-version`. إذا توفر إصدار `2.4.9` وكان `mandatory: true`، يقوم بتحميل الملف، فحص הـ `sha256`، ثم استبدال النسخة الحالية تلقائياً.
