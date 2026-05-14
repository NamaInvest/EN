# ENTERPRISE AI AGENT GOVERNANCE RULES
# Version: Permanent
# Applies To: All AI Agents, Codex Agents, Automation Agents, Refactor Agents, Audit Agents

────────────────────────────────────────────────────────
0. CORE OPERATING PRINCIPLE
────────────────────────────────────────────────────────

هذا النظام Enterprise ERP حساس مالياً ومحاسبياً ومتعدد المستأجرين (Multi-Tenant).

أي تعديل يجب أن يحافظ على:
- Financial Integrity
- Atomicity
- Tenant Isolation
- Idempotency
- Auditability
- Production Safety

ممنوع تنفيذ أي تعديل عشوائي أو سريع أو غير موثق.

────────────────────────────────────────────────────────
1. EXECUTION FLOW (MANDATORY)
────────────────────────────────────────────────────────

أي مهمة يجب أن تمر بالمراحل التالية:

1. SCAN ONLY
2. AUDIT REPORT
3. PLAN ONLY
4. USER APPROVAL
5. IMPLEMENTATION
6. VERIFY + GIT SAFETY
7. FINAL REPORT

ممنوع القفز مباشرة للتنفيذ.

────────────────────────────────────────────────────────
2. SCOPE CONTROL
────────────────────────────────────────────────────────

- لا تعدّل أي ملف خارج النطاق المطلوب.
- لا تعمل Refactor شامل بدون طلب صريح.
- لا تغيّر naming conventions أو architecture بدون موافقة.
- لا تلمس schema.prisma إلا إذا طُلب بوضوح.
- لا تلمس frontend إذا المهمة backend فقط.
- لا تلمس APIs أخرى بحجة “التنظيف”.
- لا تبدأ Phase جديدة تلقائياً.

أي توسع خارج المطلوب = خطأ معماري.

────────────────────────────────────────────────────────
3. NO BLIND MODIFICATIONS
────────────────────────────────────────────────────────

ممنوع:
- blind string replace
- regex mass replace
- auto patch scripts غير متحقق منها
- edits بدون قراءة فعلية للكود

يجب:
- قراءة الكود الحقيقي
- فهم الـ flow
- فهم transaction boundaries
- فهم side effects

────────────────────────────────────────────────────────
4. VERIFY BEFORE CLAIMING SUCCESS
────────────────────────────────────────────────────────

ممنوع قول:
- تم بنجاح
- PASS
- Production Ready
- جاهز للإطلاق
- آمن 100%

إلا بعد أدلة حقيقية.

الحد الأدنى المطلوب:

- git diff
- git status
- prisma validate
- prisma generate
- tsc
- build
- tests عند وجودها

إذا فشل أي أمر:
- يجب كتابة FAIL بوضوح
- أو PARTIAL PASS
- مع السبب الحقيقي

OOM ليس PASS.
Skipped tests ليس PASS.
Ignored errors ليس PASS.

────────────────────────────────────────────────────────
5. REQUIRED VERIFICATION COMMANDS
────────────────────────────────────────────────────────

قبل أي Commit:

- git status
- git diff --stat
- git diff للملفات المعدلة
- npx prisma validate
- npx prisma generate
- npx tsc --noEmit
- npm run build

وعند وجود Tests:
- npm test
- أو tests المتعلقة بالنطاق

────────────────────────────────────────────────────────
6. FINANCIAL ATOMICITY RULES
────────────────────────────────────────────────────────

أي عملية مالية يجب أن تكون داخل:
prisma.$transaction واحد فقط.

يشمل:
- Invoice
- Returns
- Treasury
- Payments
- Inventory
- StockMovement
- JournalEntry
- Treasury Entry
- Outbox/EventLog

أي فشل يجب أن يعمل:
FULL ROLLBACK

────────────────────────────────────────────────────────
7. NO SPLIT-BRAIN ALLOWED
────────────────────────────────────────────────────────

ممنوع:
- فاتورة بدون قيد
- قيد بدون فاتورة
- حركة خزينة بدون GL
- تحديث مخزون بدون StockMovement
- خصم Recipe بدون Inventory Update
- Treasury بدون JournalEntry

أي احتمال Split-Brain يعتبر Critical Risk.

────────────────────────────────────────────────────────
8. NO SWALLOWED ERRORS
────────────────────────────────────────────────────────

ممنوع:

.catch(() => null)
.catch(() => {})
try/catch مع log فقط

داخل:
- inventory
- treasury
- accounting
- journal
- payments
- returns
- stock movement

مسموح فقط:
- logging غير المالي
- audit غير الحرج
- telemetry

ويجب توثيقه.

────────────────────────────────────────────────────────
9. IDEMPOTENCY RULES
────────────────────────────────────────────────────────

أي POST مالي يجب أن يستخدم:
withIdempotency

يشمل:
- Sales
- Purchases
- Sales Returns
- Purchase Returns
- Treasury
- Payments
- Apply Payment
- Stock Adjustments

يجب دعم:
- Idempotency-Key header
- body.idempotencyKey fallback
- requestHash validation
- replay response
- 409 for IN_PROGRESS
- 400 for hash mismatch

────────────────────────────────────────────────────────
10. TENANT ISOLATION
────────────────────────────────────────────────────────

كل عملية حساسة يجب أن تستخدم tenantId.

ممنوع:
- الاعتماد على branchId فقط
- قراءة invoice من tenant مختلف
- استخدام prisma مباشر بدون tenant guard

أي originalInvoiceId أو referenceId:
يجب التحقق أنه تابع لنفس tenant.

────────────────────────────────────────────────────────
11. INVENTORY INTEGRITY
────────────────────────────────────────────────────────

أي حركة مخزون يجب أن تشمل:

- product.currentStock update
- productStock update
- stockMovement create

داخل نفس transaction.

أي فشل:
ROLLBACK كامل.

────────────────────────────────────────────────────────
12. TREASURY RULES
────────────────────────────────────────────────────────

ممنوع إنشاء Treasury manual entry بدون:

- treasuryAccountId
- counterpartyAccountId
- JournalEntry

إذا الحسابات غير واضحة:
return 400

ممنوع:
- suspense accounts
- temporary accounts
- guessing GL accounts

إلا بموافقة صريحة.

────────────────────────────────────────────────────────
13. AUTO JOURNAL RULES
────────────────────────────────────────────────────────

أي postX function يجب أن:

- تدعم txClient?: any
- تمرر txClient إلى createJournalEntry
- لا تفتح transaction جديدة إذا txClient موجود
- ترمي errors واضحة
- لا تخفي الفشل

────────────────────────────────────────────────────────
14. EXTERNAL SERVICES / ZATCA
────────────────────────────────────────────────────────

ممنوع:
- استدعاء API خارجي مباشر داخل transaction مالي

استخدم:
- Outbox Pattern
- EventLog
- Queue
- Background Jobs

يشمل:
- ZATCA
- Webhooks
- Sync APIs

────────────────────────────────────────────────────────
15. MIGRATION RULES
────────────────────────────────────────────────────────

ممنوع:
- db push للإنتاج
- تعديل migration مطبق
- DROP خطير
- ALTER مدمر

يفضل:
- additive migrations
- migrate diff عند فقدان baseline
- migrate deploy للإنتاج

أي migration يجب فحصه يدوياً.

────────────────────────────────────────────────────────
16. BUILD & TYPESCRIPT RULES
────────────────────────────────────────────────────────

أي TypeScript error يعتبر Release Blocker.

أي npm run build failure يعتبر:
NOT PRODUCTION READY

ممنوع تجاهل:
- Next.js route conflicts
- duplicated paths
- Prisma typing failures
- App Router typing issues

────────────────────────────────────────────────────────
17. TESTING RULES
────────────────────────────────────────────────────────

أي تدفق مالي جديد يحتاج tests تغطي:

- rollback
- journal failure
- inventory failure
- idempotency replay
- tenant isolation
- race conditions

إذا test framework مكسور:
يجب توثيق ذلك بوضوح.

────────────────────────────────────────────────────────
18. GIT SAFETY RULES
────────────────────────────────────────────────────────

لا تعمل commit قبل:
VERIFY + GIT SAFETY

لا تعمل push قبل:
FINAL PUSH SAFETY CHECK

ممنوع:
- رفع secrets
- رفع .env
- رفع temp files
- رفع caches
- تعديل history بدون موافقة

────────────────────────────────────────────────────────
19. AI BRAIN MAINTENANCE
────────────────────────────────────────────────────────

بعد أي تنفيذ ناجح يجب تحديث:

- AI_PROJECT_MEMORY.md
- FINANCIAL_INTEGRITY.md
- WORKFLOWS.md
- CHANGELOG_AI_BRAIN.md
- API_MAP.md إذا لم يكن generated
- DATABASE_MAP.md إذا تأثر schema

إذا الملف generated:
لا تعدله يدوياً.
وثّق السبب فقط.

────────────────────────────────────────────────────────
20. REPORT FORMAT (MANDATORY)
────────────────────────────────────────────────────────

أي تقرير يجب أن يحتوي:

1. الملفات المعدلة
2. سبب كل تعديل
3. PASS / FAIL
4. أوامر التحقق
5. المخاطر المتبقية
6. هل يمكن commit؟
7. هل يمكن release؟
8. هل يوجد scope expansion؟
9. هل يوجد technical debt؟

────────────────────────────────────────────────────────
21. NO FAKE COMPLETION
────────────────────────────────────────────────────────

ممنوع الادعاء بأن:
- النظام مكتمل
- الحماية كاملة
- النظام Enterprise Ready

بدون:
- evidence
- verification
- tests
- build success

────────────────────────────────────────────────────────
22. NO SCOPE JUMPING
────────────────────────────────────────────────────────

بعد انتهاء أي مهمة:

- لا تبدأ مهمة جديدة تلقائياً
- لا تبدأ Phase جديدة
- لا تقترح Refactor شامل
- انتظر أمر المستخدم

أي دومين جديد يحتاج:
SCAN + PLAN ONLY أولاً.

────────────────────────────────────────────────────────
23. CURRENT VERIFIED ARCHITECTURAL PATTERNS
────────────────────────────────────────────────────────

الأنماط المعتمدة حالياً:

- Sales Atomicity
- Purchases Atomicity
- Sales Returns Atomicity
- Purchase Returns Atomicity
- Financial Idempotency
- Inventory Fail-Safe
- Treasury GL Binding
- Outbox Pattern
- txClient Injection Pattern

أي مسار مالي جديد يجب أن يلتزم بهذه الأنماط.

────────────────────────────────────────────────────────
24. ABSOLUTE ENTERPRISE RULE
────────────────────────────────────────────────────────

صحة القيود المحاسبية والمخزون أهم من:
- سهولة الاستخدام
- التوافق القديم
- الأداء المؤقت
- عدم إزعاج المستخدم

النظام يجب أن يكون:
Fail-Safe
وليس:
Fail-Silent

أي تعارض بين:
“نجاح العملية”
و
“سلامة البيانات”

يجب أن ينتصر:
سلامة البيانات دائماً.

────────────────────────────────────────────────────────
25. PERMANENT MEMORY RULE
────────────────────────────────────────────────────────

بعد أي Implementation مستقبلية:

يجب تحديث:
- AI_PROJECT_MEMORY.md
- docs/ai-brain/*

حتى لا يصبح Project Brain قديماً أو غير متزامن مع الكود الحقيقي.

هذا إلزام دائم.

────────────────────────────────────────────────────────
26. SAFE GIT ADD RULE
────────────────────────────────────────────────────────

ممنوع استخدام:
git add .

في المشاريع الحساسة.

يجب عمل stage للملفات المطلوبة فقط بشكل صريح لتجنب:
- رفع ملفات مؤقتة
- رفع secrets
- رفع generated artifacts
- رفع تعديلات خارج النطاق

────────────────────────────────────────────────────────
27. ENTERPRISE ARCHITECTURAL AUDIT MODE ONLY
────────────────────────────────────────────────────────

Quick Mode is permanently forbidden in this project.

Every task, even small UI or bug fixes, must follow:

1. SCAN ONLY
2. ROOT CAUSE ANALYSIS
3. IMPACT ANALYSIS
4. CROSS-DOMAIN AUDIT
5. RISK REPORT
6. PLAN ONLY
7. USER APPROVAL
8. IMPLEMENTATION
9. VERIFY + GIT SAFETY
10. FINAL REPORT

Mandatory checks:
- Financial Integrity impact
- Tenant Isolation impact
- Security impact
- API impact
- Database impact
- Workflow/Event Flow impact
- AI Brain consistency impact

Rules:
- Never write code before scan and plan.
- Never expand scope without approval.
- Never claim success without evidence.
- Never use quick fixes in financial, tenant, security, or inventory flows.
- Always update AI Brain after successful implementation.

