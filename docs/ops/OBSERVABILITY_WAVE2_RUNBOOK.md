# دليل تشغيل المراقبة - الموجة الثانية (Observability Wave 2 Runbook)
## Nama Invest SaaS ERP - Advanced Observability & Incident Runbook

يوفر هذا الدليل التعليمات الخاصة بتوليد تقارير الأداء والصحة اليومية وكيفية تشخيص الأخطاء والمشاكل التشغيلية.

---

## 1. تشغيل وتوليد تقارير الأداء اليومية (Daily Operations Reporting)

### أ. تقرير التلخيص اليومي للأخطاء (Daily Observability Summary)
* **الأمر:**
  ```bash
  node scripts/ops/daily-observability-summary.js
  ```
* **الوصف:** يحلل سجلات PM2 ويحدد حالة النظام الإجمالية (HEALTHY, WARNINGS_DETECTED, DEGRADED) ويلخص الأخطاء النشطة.

### ب. تقرير فشل التأسيس (Failed Provisioning Summary)
* **الأمر:**
  ```bash
  node scripts/ops/failed-provisioning-summary.js
  ```
* **الوصف:** يمسح السجلات ويرصد أي فشل أو أخطاء في طابور التأسيس الخلفي للمستأجرين الجدد.

### ج. تقرير حالة سياسة التسجيل (GA Policy Status Summary)
* **الأمر:**
  ```bash
  node scripts/ops/ga-policy-status-summary.js
  ```
* **الوصف:** يتأكد من تفعيل جدار حماية التسجيل (Invite-Code + Admin-Approval) وحظر التسجيل المفتوح.

### د. التقرير اليومي الشامل (Operations Master Daily Report)
* **الأمر:**
  ```bash
  node scripts/ops/ops-master-daily-report.js
  ```
* **الوصف:** يدمج كافة تقارير الصحة والمراقبة والنسخ والسياسات في تقرير واحد مع تعمية كاملة للمقاطع الحساسة.

---

## 2. تشخيص المشاكل والتعامل مع الأخطاء (Incident Troubleshooting)

### أ. في حال رصد حالة DEGRADED أو WARNINGS_DETECTED
1. افتح التقرير اليومي وحدد الخدمة المتأثرة من خلال المخرجات.
2. قم بفحص سجلات الأخطاء التفصيلية للخدمة المعنية:
   ```bash
   node scripts/ops/pm2-log-health-scan.js
   ```
3. إذا تكررت أخطاء `PrismaClientInitializationError` أو `TypeError` قم بمراجعة اتصالات قاعدة البيانات ومساحة الذاكرة.

### ب. التعامل مع فشل التأسيس المتكرر (Onboarding Provisioning Failures)
1. تحقق من سجل الأخطاء لمعرفة خطوة الفشل (Step VALIDATE_REQUEST, CREATE_DB, etc.).
2. تأكد من عدم تكرار النطاق الفرعي (Subdomain) المطلوب.
3. لا تقم أبداً بإعادة محاولة التأسيس إنتاجياً بشكل مباشر إذا كان هناك شك بتلف البيانات.

---

## 3. التدابير الأمنية وخصوصية البيانات (Security Controls)
* يجب تشغيل كافة التقارير بصيغة قراءة فقط دون أي تعديل على إعدادات PM2 أو قواعد البيانات.
* في حال رصد أي قيمة مكشوفة لكلمة مرور أو DATABASE_URL في التقارير، يعتبر الحادث ثغرة أمنية تتطلب إيقاف التشغيل وتدوير المفاتيح فوراً.
