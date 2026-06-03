# Agent Scan Report - Tenant Provisioning Duplicate Guard (Phase 4A)

> **TRACK ID**: `CUSTOMER_ONBOARDING_PHASE4A_BACKEND_DUPLICATE_GUARD_END_TO_END`
> **STATUS**: `SCAN_COMPLETED`
> **DATE**: 2026-06-03

---

## 1. الملفات التي قرأتها (Files Scanned)
1. `tmp/customer-onboarding-phase4-provisioning-safety-scan-plan-report.md`
2. `src/app/api/tenant/provision/route.ts`
3. `src/lib/tenant/reserved-subdomains.ts`
4. `src/lib/tenant/provisioning-guard.ts`
5. `.ai-brain/00-index.md`
6. `.ai-brain/01-architecture.md`
7. `.ai-brain/02-database.md`
8. `.ai-brain/05-business-logic.md`
9. `.ai-brain/14-modules-map.md`
10. `.ai-brain/17-gap-analysis.md`
11. `.ai-brain/19-claude-rules.md`
12. `project-governance/05-TENANT_ISOLATION_RULES.md`
13. `project-ops/10-PRODUCTION_DEPLOYMENT.md`

---

## 2. الملفات المرشحة للتعديل (Candidate Files to Modify)
1. `src/app/api/tenant/provision/route.ts` (API route modifying to include duplicate guard check and lock)
2. `src/lib/tenant/provisioning-guard.ts` (contains process-local lock logic)
3. `src/lib/__tests__/provisioning-guard.test.ts` (new test file)
4. `src/__tests__/tenant-provision-duplicate-guard.test.ts` (new test file)
5. `tmp/customer-onboarding-phase4a-backend-duplicate-guard-end-to-end-report.md` (new phase report)

---

## 3. الدومينات المتأثرة (Affected Domains)
- **Tenant Provisioning / Master SaaS Routing**
- **Database Safety & Connection Pooling**
- **Security & Secret Leakage Prevention**

---

## 4. المخاطر والحلول (Risks & Mitigations)
- **خطر التكرار والطلبات المتزامنة (Concurrent Requests Risk)**: قد يتم حجز نفس الـ Subdomain لطلبين متزامنين.
  - *الحل*: استخدام in-memory locksRegistry لمنع التزامن في نفس خادم Node.js.
- **خطر العمليات غير المكتملة وتكلفة خادم SSH**: تكرار استدعاء SSH للتحقق من المجلد وإنشاء قواعد بيانات مكررة قبل الفحص النهائي.
  - *الحل*: التحقق المبكر عبر قاعدة بيانات الماستر (`tenant_accounts`) من خلو السجل مسبقاً قبل أي خطوة SSH.
- **خطر كشف أسرار النظام في مخرجات الأخطاء (Secrets Leakage Risk)**: إرجاع stack trace أو SSH logs يحتوي على DATABASE_URL أو أسرار.
  - *الحل*: تعقيم كامل لمخرجات الأخطاء في route handler وإرجاع رمز الخطأ والرسالة العربية/الإنجليزية العامة الآمنة للمستخدم.

---

## 5. خطة التنفيذ (Implementation Plan - Phase 4A Local Implementation Only)
1. **Normalized Subdomain**: التحقق من Subdomain المدخل باستخدام الفحص والتوطين الموجودين في `reserved-subdomains.ts` بعد Normalize.
2. **Master DB Verification**: استخدام PrismaClient الخاص بالماستر للتحقق من عدم وجود `subdomain` أو `userEmail`/`clerkUserId` مسبقاً في `tenant_accounts`.
3. **In-memory short-term lock**: حيازة القفل (acquire lock) للـ subdomain المنظّم في بداية route handler وتحريره (release lock) في `finally`.
4. **Sanitize Errors**: صياغة ردود الأخطاء لترجع رموز خطأ معرفة `SUBDOMAIN_ALREADY_EXISTS` أو `PROVISIONING_FAILED` ووقف كشف stack trace.
5. **No Migration**: التغيير برمجي تماماً بدون تعديل schema أو prisma db push.

---

## 6. خطة الاختبار (Testing Plan)
- كتابة اختبارات unit tests مخصصة باستخدام Jest لملف `provisioning-guard.test.ts`.
- محاكاة طلبات متطابقة متزامنة وتأكيد حظر الطلب الثاني بـ `PROVISIONING_IN_PROGRESS`.
- التحقق من معالجة حالة الأحرف (Case-insensitive Lock).
- تشغيل `npm run typecheck` و `npx prisma validate`.
- تشغيل الفحص اليدوي للتأكد من خلو الملفات من أية كلمات سرية أو أسرار حساسة.
