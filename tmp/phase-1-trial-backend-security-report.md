# تقرير المرحلة الأولى - Backend Trial API & Security

تم بنجاح تنفيذ المرحلة الأولى والتي تركز على تأمين نظام فترة التجربة (Trial) للـ Desktop App بالاعتماد على خوادم Nama Invest.

## 1. التعديلات والإضافات
- **الاستفادة من Schema الحالي:**
  - لم يتم تعديل أو إضافة أي جداول جديدة. تم استغلال الجداول الحالية `DesktopLicense` و `TenantAccount` لأنها مصممة مسبقاً بشكل احترافي، وتم استخدام جدول `Setting` في الـ Tenant لحفظ تاريخ البداية والنهاية.
- **تعديل `src/app/api/tenant/provision/route.ts`:**
  - تم تحسين منطق الإنشاء ليقوم بزراعة `trialStartsAt`, `trialStatus` (`ACTIVE`), و `trialSource` (`DESKTOP_APP`) في جدول إعدادات Tenant.
  - تم ربط إنشاء حساب الـ Tenant تلقائياً برخصة Desktop جديدة `DesktopLicense` تحتوي على تاريخ انتهاء بعد 7 أيام ومرتبطة بـ `tenantAccountId`.
  - تم إضافة توليد وتوقيع `JWT` (Trial Token) مشفر بـ `HMAC-SHA256` وإرساله كرد للعميل.

- **إضافة Endpoint جديد للتحقق:**
  - تم إنشاء `src/app/api/desktop/trial/verify/route.ts`.
  - يقوم الـ Endpoint باستقبال `subdomain` و `trialToken` أو `fingerprint`.
  - يتأكد من صحة التوقيع وصحة العميل، ويجلب بيانات `DesktopLicense` المرتبطة بـ Tenant.
  - يحسب الـ `daysRemaining` استناداً إلى وقت السيرفر (`server now`).
  - إذا انتهت 7 أيام، يعيد حالة `EXPIRED`.
  - يتميز بحماية Rate Limiting عبر الطبقة المشتركة (`withRoute` مع Tier `AUTH`).

## 2. إجابات التحقق (VERIFY REPORT)
- **هل احتجت Schema؟** لا، الجداول المتاحة (`DesktopLicense` و `TenantAccount` و `Setting`) كافية ومناسبة تماماً، لذا لم أقم بأي `Migration`.
- **ما الـ endpoints التي أُضيفت؟** تمت إضافة مسار واحد جديد: `POST /api/desktop/trial/verify`.
- **كيف يتم حساب 7 أيام؟** بناءً على وقت الطلب على السيرفر (`new Date()`) مطروحاً من `trialEndsAt` المخزن في قاعدة البيانات، مما يمنع الاعتماد على وقت متصفح العميل نهائياً.
- **كيف تمنع التلاعب بوقت الجهاز؟** الـ Endpoint يعيد `serverTime` وعدد الأيام المتبقية وحالة الـ Trial. الـ Desktop لن يقبل المتابعة دون التصديق على هذا الرد الموقع من الخادم، متجاهلاً وقت نظامه الداخلي عند توفر الإنترنت.
- **نتيجة Typecheck/Prisma/Git:**
  - `npm run typecheck`: **ناجح** (تم إصلاح خطأ RateLimitTier إلى AUTH).
  - `npx prisma validate`: **ناجح** 🚀.
  - تم إنشاء سكربت `tmp/test-trial-api.js` لمحاكاة الحالات المختلفة بأمان.
