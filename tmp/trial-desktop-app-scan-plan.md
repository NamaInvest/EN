# تقرير فحص وتخطيط تطبيق Nama Invest Desktop Trial
(SCAN & PLAN Report - 7 Days Offline-Capable Launcher)

## 1. الوضع الحالي للمشروع (Current State)
تم فحص الكود الحالي للمشروع وتبين التالي:
- **يوجد مشروع Desktop Launcher سابق:** نعم، يوجد في مجلد `namasoft-erp-launcher/`.
- **التقنيات المستخدمة:** يستخدم `Electron`, `React`, `Vite`, `TypeScript` بالفعل.
- **الشاشات المتوفرة:** توجد الشاشات المطلوبة في `src/components/`:
  - `ExistingCompanyScreen.tsx`
  - `NewCompanyProvisionScreen.tsx`
  - `OfflineDashboard.tsx` (تحتوي بداخلها على Sync Monitor).
- **واجهة برمجة إنشاء الشركة (Provisioning API):** نعم، موجودة في `src/app/api/tenant/provision/route.ts`، وتقوم بإنشاء قاعدة البيانات عبر SSH، وزرع البيانات الأولية (Seed)، وتوليد Subdomain، وتفعيل إعدادات الـ Trial.
- **نظام الرخص (License/Trial System):**
  - في الـ Backend: توجد إعدادات `trialActive` و `trialEndsAt` تُزرع في جدول `Setting`.
  - في الـ Desktop: توجد دوال في `licenseManager.ts` لكنها **Mocked** حالياً (تعيد `valid: true` دائماً).
- **قاعدة البيانات المحلية:** نعم، يستخدم `sql.js` (بدون Native compilation) في `electron/database.ts`، وتتضمن جداول: `cached_license`, `cached_company`, `local_outbox`, `sync_history` وغيرها.
- **آلية المزامنة (Sync Queue):** نعم، توجد جداول `local_outbox` و `dead_letter_queue` وملف `electron/syncWorker.ts`.
- **نافذة عرض النظام (WebView/BrowserWindow):** **غير مكتملة**. `main.ts` يفتح فقط واجهة الـ Dashboard المحلية. زر `openWorkspace` يطبع `console.log` فقط ولا يفتح النظام الفعلي (Subdomain).

---

## 2. النواقص (Gaps & Missing Features)
1. **API التحقق من الرخصة:** لا يوجد API مخصص لإصدار "توقيع مشفر" بمدة الـ Trial ليعتمد عليه تطبيق الـ Desktop.
2. **منع التلاعب بالوقت:** تطبيق الـ Desktop حالياً لا يملك آلية (Monotonic Clock أو Last Seen Time) لمنع التلاعب بوقت الجهاز.
3. **التشغيل الفعلي للنظام (Workspace):** ينقصنا إنشاء `BrowserView` أو `BrowserWindow` مدمج داخل Electron لفتح رابط الـ Subdomain مع حقن بيانات الدخول التلقائي (SSO Token).
4. **Offline Business Logic:** لا يوجد مسار واضح لضمان أن الحركات المالية التي تتم Offline تُسجل كـ `Draft` ولا تضرب قيود المحاسبة.
5. **Rate Limiting & Abuse Protection:** الـ Provision API الحالي يعتمد على توليد اسم النطاق الفرعي عبر SSH Loop دون حماية قوية (Captcha/Rate Limiting).

---

## 3. خطة التنفيذ المقترحة (Implementation Plan)

### المرحلة الأولى: Backend Trial API & Security
- تحديث `/api/tenant/provision` لإضافة Rate Limiter للـ IP.
- إنشاء مسار جديد `/api/tenant/verify-trial` يستقبل الـ Fingerprint ويعيد JWT موقّع يحتوي على: `subdomain`, `tenantId`, `trialEndsAt`.

### المرحلة الثانية: Electron License Enforcer (Anti-Tamper)
- تحديث `licenseManager.ts` ليقوم بحفظ الـ JWT في `cached_license`.
- لمنع التلاعب بتأخير تاريخ الجهاز: يتم حفظ `last_seen_time` مشفر في قاعدة البيانات المحلية. إذا كان تاريخ الجهاز الحالي أقدم من `last_seen_time`، يتم إغلاق النظام (Time Tampering Detected).
- إذا كان النظام Online، يلتزم بوقت السيرفر (عبر API).

### المرحلة الثالثة: Desktop Workspace View
- تعديل `main.ts` وتفعيل حدث (IPC) عند الضغط على `openWorkspace` في `OfflineDashboard`.
- الحدث سيقوم بإنشاء نافذة متصفح (`BrowserWindow` أو `BrowserView`) مخفية شريط العناوين موجهة إلى `https://[subdomain].namainvist.com/login?token=[ssoToken]`.

### المرحلة الرابعة: Offline Fallback & Sync Rules
- في حالة غياب الإنترنت، يتم توجيه הـ Workspace لخدمة واجهات React مبسطة (مترجمة محلياً) تقبل المبيعات كحالة `Draft` فقط.
- تحويل هذه البيانات إلى `local_outbox`.
- `syncWorker.ts` يقوم بإرسال الـ Queue عند عودة الإنترنت لمعالجتها واعتمادها من الـ Backend (Idempotent API).

---

## 4. الإجابة على الأسئلة المعمارية
- **هل نحتاج Schema جديد؟** لا، يمكن الاعتماد على جدول `Setting` في الـ Tenant للتواريخ، وجدول `TenantAccount` في الـ Master لتسجيل ربط الـ Fingerprint بالرخصة. قد نحتاج إضافة حقل `deviceFingerprint` للرخصة فقط.
- **هل نحتاج API جديد؟** نعم، `/api/tenant/verify-trial` لإصدار JWT للعميل المكتبي.
- **هل نحتاج حماية subdomain uniqueness؟** نعم، مع أنه يُفحص عبر SSH، يجب إضافة Rate Limit وحماية ضد الإزعاج.
- **هل نحتاج ربط trial expiry بالـ backend وليس فقط بالعميل؟** بالتأكيد، العميل يعتمد على الـ JWT الموقّع من السيرفر كمرجع وحيد، والسيرفر يرفض أي عمليات بعد انقضاء المدة بغض النظر عن حالة العميل.

---

## 5. قائمة الأمان (Security Checklist)
- [ ] لا يتم حفظ كلمة المرور نهائياً في الكود المحلي (استخدام JWT/SSO Tokens).
- [ ] توقيع تواريخ الرخصة باستخدام HMAC/RSA-SHA256 (JWT).
- [ ] استخدام `Monotonic Clock` أو إجبار تحديث `last_seen_time` محلياً لمنع خدعة تغيير تاريخ نظام التشغيل.
- [ ] تقييد إرسال البيانات المجمعة Offline بحدود معينة لمنع إغراق السيرفر (Payload Limit).
- [ ] العمليات المالية التي تُرسل عبر Sync Queue لا يتم اعتمادها (Posted) مباشرة، بل تمر بدورة حياة النظام.
