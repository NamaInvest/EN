# Deep Scan Report: System-Wide Level 3 Architectural Audit
**Date:** 2026-05-14
**Type:** LEVEL 3 (Architectural Scan)
**Target:** Nama Invest ERP (Full System Core)

---

## 1. Scope
**DEEP SCAN LEVEL 3** تغطية شاملة للنظام المعماري:
- Tenant Isolation (العزل بين الشركات)
- Accounting Core (النظام المحاسبي)
- API Routes & Middleware (توجيه وحماية الـ APIs)
- Permissions (الصلاحيات)
- Event Flows & Workflows (تدفق العمليات)
- Database Schema (هيكل قاعدة البيانات)
- Desktop Sync (مزامنة الديسكتوب)
- ZATCA (هيئة الزكاة والدخل)
- Performance Risks (مخاطر الأداء)
- Security Risks (المخاطر الأمنية)

---

## 2. Files Scanned
تم إجراء مسح مجهري وتحليل للتدفق المعماري عبر الملفات المركزية:
- `prisma/schema.prisma` (ملف الـ Schema الضخم ~11,923 سطر)
- `middleware.ts` (الخط الدفاعي الأول / Next.js Edge)
- `src/lib/accounting-engine.ts` و `src/lib/auto-journal.ts`
- `src/lib/zatca/` (محركات الفوترة)
- `src/lib/bank-recon-engine.ts` و `src/lib/cash-application.ts`
- مسح كامل لـ 365 ملفاً داخل `src/lib/` (التي تمثل Business Engines)

---

## 3. Related Domains
تم تقييم التقاطعات المعمارية بين:
- **Core System**: Auth, Tenant Provisioning, Sync.
- **Financial**: Accounting, Treasury, Assets, ZATCA.
- **Operational**: Inventory, POS, Manufacturing, Sales, HR/Payroll.

---

## 4. Architecture Flow
المسار المعماري الحالي يعتمد على:
1. **Edge Middleware**: يستخرج `subdomain` من الـ Host، ويستخرج `tenantId` من الـ JWT / API Key، ويحقنها في `x-tenant-id` Headers.
2. **API Layer**: تعتمد على الـ Headers لمعرفة سياق الشركة المستأجرة (Context).
3. **Business Engines**: مئات المحركات المستقلة (Engines) في `src/lib` تستلم السياق وتنفذ الـ Logic.
4. **Database Layer**: Prisma Client يتصل بـ PostgreSQL (`schema.prisma`) ويعتمد على تمرير `tenantId` في الـ `where` clause على مستوى الـ App.

---

## 5. Root Cause Risks (المخاطر الجذرية)
- **Tenant Leakage Risk (Database Level)**: النظام يعتمد حالياً على حقن `tenantId` برمجياً في دوال Prisma (`where: { tenantId }`). لا يوجد تأكيد على استخدام PostgreSQL Row-Level Security (RLS) أو Prisma Client Extension يمنع Query بدون `tenantId`. إذا نسي مطور سطر الـ `tenantId` في أي `findMany`، سيحدث تسريب فوري للبيانات بين الشركات (Critical Risk).
- **Financial Atomicity Risk**: المحركات المحاسبية موزعة (مثلاً `auto-journal.ts` منفصل عن `inventory-engine.ts`). لا يوجد هيكل (Saga Pattern Orchestrator) واضح لضمان الـ Rollback في حالة فشل خطوة في منتصف عملية مالية طويلة (مثلاً فشل ZATCA بعد ترحيل فاتورة).

---

## 6. Secondary Risks
- **ZATCA Timeout Fallback**: عملية `cleared` لفواتير ZATCA قد تعلق إذا حدث Time-out أثناء الاتصال بمنصة ZATCA، مما يترك الفاتورة في حالة معلقة (Inconsistent State).
- **Desktop Offline Sync Conflict**: في حالة الـ Sync، إذا قام الـ Desktop بإرسال بيانات متعارضة لنفس الـ Entity التي تم تعديلها في الـ Web، لا يوجد Conflict Resolution صلب يمنع الكتابة المزدوجة بناءً على Versioning قوي (Optimistic Concurrency Control).

---

## 7. Technical Debt
- **Prisma Schema Bloat**: ملف `schema.prisma` ضخم جداً (11,900+ سطر). هذا يؤدي إلى استهلاك عالي للذاكرة أثناء تهيئة Prisma Client (Cold Starts) ويجعل صيانة الـ Migrations معقدة جداً.
- **Event Flow Spaghetti**: وجود مئات الـ Engines بدون Event Bus مركزي موحد وموثق برمجياً قد يخلق ترابطاً وثيقاً (Tight Coupling).

---

## 8. Security Risks
- **MFA Bypass Window**: في `schema.prisma`، `mfaGracePeriodEndsAt` قد يسمح للمستخدمين بتجاوز MFA لفترة طويلة إذا لم يتم تتبعها بصرامة بواسطة الـ Middleware.
- **Master Admin Access**: مسار `/api/master-panel` يمر عبر Middleware ولكن يعتمد على مفاتيح سرية (JWT_SECRET fallback) قد تكون مكشوفة أو Hardcoded.
- **Rate Limiting**: ملف `middleware.ts` لا يحتوي على Rate Limiter. الـ DDoS أو الـ Brute Force يمكن أن يضرب واجهات تسجيل الدخول والـ APIs مباشرة (استنزاف للموارد).

---

## 9. Tenant Risks
كما ذكرنا في Root Causes، بعض الفهارس في قاعدة البيانات مثل `@@index([tenantId, deletedAt])` ممتازة، ولكن وجود جداول دون `tenantId` محمي يدوياً يعرض النظام لخطر تسريب البيانات لو تم عمل Bypass للـ Middleware لأي سبب (مثل `public` endpoints أو Cron jobs).

---

## 10. Financial Risks
لقد أظهر الفحص نجاح إزالة أنواع `Float` تماماً (0 نتائج للبحث)، واستخدام `Decimal(20,4)` و `Decimal(18,8)`. هذا إنجاز عظيم.
**لكن الخطر المتبقي**: توازن القيود `Debit = Credit` يعتمد على الـ Application Logic. لا يوجد Check Constraint في الـ Database نفسها يمنع الالتزام بقيد غير متوازن، مما يفتح باباً لفساد مالي عبر أي خطأ برمجي مستقبلي.

---

## 11. Performance Risks
- **N+1 Queries**: في تقارير (Statutory Reports و Consolidation)، إذا لم تكن العمليات تعتمد على Raw SQL + Window Functions، فإن Prisma قد تنفذ المئات من الاستعلامات لاستخراج شجرة الحسابات (Account Hierarchy Engine).
- **Synchronous ZATCA XML Generation**: عمليات توقيع وتشفير ZATCA (Signing, Hashing, QR) ثقيلة پردازشياً. إذا تم إجراؤها بشكل متزامن (Synchronous) داخل رحلة بناء الفاتورة، ستؤدي إلى بطء شديد في الـ POS.

---

## 12. Suggested Fixes
1. **Tenant Prisma Extension**: إنشاء Prisma Extension يرفض أي استعلام (Query) لا يحتوي على `tenantId` (إلا في حالة `admin client`).
2. **PostgreSQL Constraints**: إضافة `CHECK (debit_total = credit_total)` كـ Trigger أو Check constraint على جدول القيود المالية.
3. **ZATCA Message Queue**: تحويل اتصال ZATCA إلى Background Job عبر الـ Queue، وإرجاع `Accepted` للـ POS فوراً.
4. **Rate Limiting**: تفعيل `rate-limiter.ts` على مستوى الـ Edge Middleware باستخدام Redis (Upstash) لحماية الـ APIs.

---

## 13. Safer Alternatives
- **للـ Tenant Isolation**: بدلاً من الـ Prisma Extension، يمكن استخدام PostgreSQL RLS (Row Level Security) عبر حقن متغير `SET app.current_tenant = ...` قبل كل استعلام، مما يجعل العزل على مستوى الـ Database Engine نفسه (يستحيل اختراقه برمجياً).

---

## 14. Required Tests
- **Cross-Tenant Leakage Test**: اختبار E2E يقوم بتهيئة Token لـ Tenant A ومحاولة الوصول إلى UUID لـ Tenant B (يجب أن يعيد 404 أو 403).
- **Zero-Sum Ledger Test**: اختبار مالي يحاول عمداً إدخال قيد بفارق `0.01` والتأكد من رفض النظام القاطع.
- **Desktop Sync Collision**: محاكاة جهازي Desktop يرفعان نفس الـ Invoice في نفس الثانية لاختبار הـ Idempotency.

---

## 15. Rollback Considerations
- أي تعديل على `schema.prisma` أو إضافة Extensions قد يكسر الاستعلامات المعقدة. يجب توفير بيئة Staging مطابقة بنسبة 100% لاختبار أي `Prisma Middleware`.
- تفعيل RLS أو Constraints مالية يجب أن يسبقه Data Scrubbing، لأن أي قيد قديم غير متوازن سيؤدي إلى فشل الـ Database Migration بالكامل.

---
**[نهاية تقرير الفحص المجهري - LEVEL 3]**
