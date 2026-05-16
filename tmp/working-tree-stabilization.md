# Phase 3.1.3b — Working Tree Stabilization

## الهدف
تصنيف وفصل الملفات المعدلة في الـ Working Tree الحالي لمنع تداخل الاهتمامات (Mixed Concerns) مثل Tenant Isolation، Outbox، التصنيع، والموارد البشرية في Commit واحد. 

## 1. تصنيف الملفات الحالية

### A. Governance / Tenant Isolation
- `src/lib/api/with-route.ts`
- `src/scripts/setup-db-triggers.ts` (Untracked)
- `project-governance/06-GOVERNANCE_SDK.md` (Untracked)
- `project-governance/PROJECT_MEMORY.md` (Untracked)

### B. Outbox / Reliability
- `src/lib/queue/index.ts`
- `src/workers/audit/reconciliation.worker.ts`
- `src/workers/outbox/` (Untracked)

### C. Manufacturing & Inventory
- `src/app/api/manufacturing/orders/route.ts`
- `src/app/api/manufacturing/routing/route.ts`
- `src/app/api/manufacturing/scrap/route.ts`
- `src/app/api/manufacturing/boms/versions/[versionId]/activate/route.ts`
- `src/app/api/grn/route.ts`
- `src/app/api/batches/[id]/route.ts`
- `src/app/api/categories/route.ts`
- `src/app/api/products/[id]/route.ts`
- `src/app/api/documents/transition/route.ts`

### D. Payroll / HR & Assets
- `src/app/api/hr/payroll/generate/route.ts`
- `src/app/api/hr/payroll/run/route.ts`
- `src/app/api/fixed-assets/[id]/depreciate/route.ts`

### E. Financial Core & Accounting
- `src/lib/auto-journal.ts`
- `src/lib/services/treasury-posting.service.ts`
- `src/app/api/finance/auto-ecl/route.ts`
- `src/app/api/finance/period-close/route.ts`
- `src/app/api/banks/[id]/transactions/route.ts`
- `src/app/api/sales-orders/[id]/process/route.ts`
- `prisma/schema.prisma`

### F. Docs / Brain
- `.ai-brain/07-all-api-endpoints.md`
- `.ai-brain/08-database-models-full.md`
- `.ai-brain/09-core-libraries.md`
- `docs/ai-brain/CHANGELOG_AI_BRAIN.md`
- `docs/ai-brain/ENTERPRISE_UPGRADE_ROADMAP.md` (Untracked)
- `docs/ai-brain/ERP_GAP_ANALYSIS.md` (Untracked)
- `tmp/final-enterprise-hardening-report.md`

### G. Other (Mixed/External Integrations)
- `src/app/api/pharmacy/prescriptions/route.ts`
- `src/app/api/webhooks/salla/route.ts`
- `package.json`

## 2. تقييم الـ Commits (Is It Possible to Isolate?)
- **Docs & Brain (F):** جاهزة ويمكن عمل Commit مستقل ومباشر لها.
- **Outbox (B):** يمكن عزلها بسهولة.
- **Manufacturing (C) & HR (D):** يمكن عزلهما في Commits منفصلة أو فروع مستقلة (Branches)، لكن يجب التأكد من توافق الـ Schema الجديد معها.
- **Financial Core (E):** تحتوي على تحديثات مرتبطة بـ `prisma/schema.prisma` و `auto-journal.ts` والتي ستؤثر مباشرة على جميع الدومينات الأخرى وتعتبر القاعدة.

## 3. ملفات خطرة تحتاج إلى مراجعة يدوية
- `prisma/schema.prisma`: تعديل الـ Schema يؤثر على جميع الـ Domains ويجب أن يراجع جيدًا مع باقي التحديثات للتأكد من عدم وجود Breaking Changes.
- `src/lib/auto-journal.ts`: يؤثر على قلب النظام المحاسبي بالكامل، أي خطأ قد يسبب فشل في تسجيل القيود في كافة الأنظمة.
- `src/lib/api/with-route.ts`: تعديله يمس استقرار جميع نقاط الـ API (Middlewares/Guards).
- `package.json`: تغييرات الاعتماديات (Dependencies) قد تكسر بيئة البناء أو سيرفر التشغيل.

## 4. ملفات تحتوي على Mixed Concerns
- `src/app/api/webhooks/salla/route.ts`: تحتوي على إنشاء قيود مالية ومخزنية معاً مع مزامنة خارجية (External API calls and state mutation).
- `src/app/api/manufacturing/orders/route.ts`: تتضمن عمليات المخزون والمحاسبة وتسجيل الأحداث (Idempotency, Routing, Outbox).

## 5. حالة النظام (TypeScript)
- تم تشغيل أمر `npx tsc --noEmit` للتحقق من خلو الملفات المعدلة من أخطاء الـ TypeScript.
- **النتيجة:** لا توجد أخطاء (Zero-Error State). النظام سليم من حيث الـ Types.
