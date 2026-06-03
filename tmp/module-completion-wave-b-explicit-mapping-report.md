# MODULE_COMPLETION_WAVE_B_EXPLICIT_MAPPING_REPORT

## 1. Approval Used
GO_FOR_MODULE_COMPLETION_WAVE_B_RESCAN_WITH_EXPLICIT_MAPPING_ONLY

## 2. Baseline
* branch: main
* HEAD: a259be8aaafd6339f95b616ef3e7da2572b6bceb
* origin/main: a259be8aaafd6339f95b616ef3e7da2572b6bceb
* HEAD == origin/main? نعم
* git status: clean
* Prisma validate result: The schema at prisma\schema.prisma is valid 🚀

## 3. Scan Inputs
تمت مراجعة التقارير السابقة وأدلة Wave B، وتم إجراء مسح مباشر لمسارات src/app و src/app/api.

## 4. Candidate Pages Reviewed

| Module | Page File | Current UI State | API Candidate | API File | Method | Service Found | Response Shape | Classification | Reason |
|---|---|---|---|---|---|---|---|---|---|
| admin | (dashboard)/admin/bi-builder/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| admin | (dashboard)/admin/chains/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| admin | (dashboard)/admin/compliance/page.tsx | موجود | /api/admin/compliance | src/app/api/admin/compliance/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| admin | (dashboard)/admin/compliance-dashboard/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| admin | (dashboard)/admin/e2e-tester/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| admin | (dashboard)/admin/feature-flags/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| admin | (dashboard)/admin/grc/audit-log/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| admin | (dashboard)/admin/grc/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| admin | (dashboard)/admin/grc/policies/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| admin | (dashboard)/admin/grc/risks/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| admin | (dashboard)/admin/knowledge/page.tsx | موجود | /api/admin/knowledge | src/app/api/admin/knowledge/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| admin | (dashboard)/admin/llm-costs/page.tsx | موجود | /api/admin/llm-costs | src/app/api/admin/llm-costs/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| admin | (dashboard)/admin/migration/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| admin | (dashboard)/admin/orchestration/page.tsx | موجود | /api/admin/orchestration | src/app/api/admin/orchestration/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| admin | (dashboard)/admin/outbox/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| admin | (dashboard)/admin/prompts/cost/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| admin | (dashboard)/admin/prompts/page.tsx | موجود | /api/admin/prompts | src/app/api/admin/prompts/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| admin | (dashboard)/admin/rag-cost/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| admin | (dashboard)/admin/security/mfa-audit/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| admin | (dashboard)/admin/security/mfa-policy/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| admin | (dashboard)/admin/siem/page.tsx | موجود | /api/admin/siem | src/app/api/admin/siem/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| admin | (dashboard)/admin/sprint-progress/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| admin | (dashboard)/admin/stories/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| admin | (dashboard)/admin/test-coverage/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| admin | (dashboard)/admin/training-compliance/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| affiliates | (dashboard)/affiliates/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| ai | (dashboard)/ai/bank-fraud/page.tsx | موجود | /api/ai/bank-fraud | src/app/api/ai/bank-fraud/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| ai | (dashboard)/ai/demand-forecast/page.tsx | موجود | /api/ai/demand-forecast | src/app/api/ai/demand-forecast/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| ai | (dashboard)/ai/nlq/page.tsx | موجود | /api/ai/nlq | src/app/api/ai/nlq/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| ai | (dashboard)/ai/sales-coach/page.tsx | موجود | /api/ai/sales-coach | src/app/api/ai/sales-coach/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| ai-auditor | (dashboard)/ai-auditor/page.tsx | موجود | /api/ai-auditor | src/app/api/ai-auditor/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| ai-bank | (dashboard)/ai-bank/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| ai-cfo | (dashboard)/ai-cfo/page.tsx | موجود | /api/ai-cfo | src/app/api/ai-cfo/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| ai-copilot | (dashboard)/ai-copilot/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| ai-scm | (dashboard)/ai-scm/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| ap | (dashboard)/ap/capture/page.tsx | موجود | /api/ap/capture | src/app/api/ap/capture/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| approvals | (dashboard)/approvals/inbox/page.tsx | موجود | /api/approvals/inbox | src/app/api/approvals/inbox/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| approvals | (dashboard)/approvals/page.tsx | موجود | /api/approvals | src/app/api/approvals/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| assets | (dashboard)/assets/page.tsx | موجود | /api/assets | src/app/api/assets/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| attendance | (dashboard)/attendance/page.tsx | موجود | /api/attendance | src/app/api/attendance/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| audit | (dashboard)/audit/field-trail/page.tsx | موجود | /api/audit/field-trail | src/app/api/audit/field-trail/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| audit-logs | (dashboard)/audit-logs/page.tsx | موجود | /api/audit-logs | src/app/api/audit-logs/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| banks | (dashboard)/banks/page.tsx | موجود | /api/banks | src/app/api/banks/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| barcode | (dashboard)/barcode/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| batches | (dashboard)/batches/page.tsx | موجود | /api/batches | src/app/api/batches/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| bi | (dashboard)/bi/dashboard/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| bookings | (dashboard)/bookings/calendar/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| bookings | (dashboard)/bookings/page.tsx | موجود | /api/bookings | src/app/api/bookings/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| branches | (dashboard)/branches/page.tsx | موجود | /api/branches | src/app/api/branches/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| calendar | (dashboard)/calendar/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| clinic | (dashboard)/clinic/appointments/page.tsx | موجود | /api/clinic/appointments | src/app/api/clinic/appointments/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| clinic | (dashboard)/clinic/erx/page.tsx | موجود | /api/clinic/erx | src/app/api/clinic/erx/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| clinic | (dashboard)/clinic/lab/page.tsx | موجود | /api/clinic/lab | src/app/api/clinic/lab/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| cmms | (dashboard)/cmms/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| cmms | (dashboard)/cmms/work-orders/page.tsx | موجود | /api/cmms/work-orders | src/app/api/cmms/work-orders/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| com | (dashboard)/com/rules/page.tsx | موجود | /api/com/rules | src/app/api/com/rules/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| compliance | (dashboard)/compliance/audits/page.tsx | موجود | /api/compliance/audits | src/app/api/compliance/audits/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| compliance | (dashboard)/compliance/pdpl/breaches/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| compliance | (dashboard)/compliance/pdpl/dsr/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| compliance | (dashboard)/compliance/risks/page.tsx | موجود | /api/compliance/risks | src/app/api/compliance/risks/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| contracts | (dashboard)/contracts/page.tsx | موجود | /api/contracts | src/app/api/contracts/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| contracts | (dashboard)/contracts/templates/page.tsx | موجود | /api/contracts/templates | src/app/api/contracts/templates/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| copa | (dashboard)/copa/page.tsx | موجود | /api/copa | src/app/api/copa/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| coupons | (dashboard)/coupons/page.tsx | موجود | /api/coupons | src/app/api/coupons/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| cpq | (dashboard)/cpq/page.tsx | موجود | /api/cpq | src/app/api/cpq/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| credit-check | (dashboard)/credit-check/page.tsx | موجود | /api/credit-check | src/app/api/credit-check/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| crm | (dashboard)/crm/campaigns/page.tsx | موجود | /api/crm/campaigns | src/app/api/crm/campaigns/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| crm | (dashboard)/crm/customer360/page.tsx | موجود | /api/crm/customer360 | src/app/api/crm/customer360/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| crm | (dashboard)/crm/cx-nps/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| crm | (dashboard)/crm/kanban/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| crm | (dashboard)/crm/key-accounts/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| crm | (dashboard)/crm/leads/page.tsx | موجود | /api/crm/leads | src/app/api/crm/leads/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| crm | (dashboard)/crm/opportunities/page.tsx | موجود | /api/crm/opportunities | src/app/api/crm/opportunities/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| crm | (dashboard)/crm/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| crm | (dashboard)/crm/tickets/page.tsx | موجود | /api/crm/tickets | src/app/api/crm/tickets/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| customers | (dashboard)/customers/page.tsx | موجود | /api/customers | src/app/api/customers/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| customers | (dashboard)/customers/[id]/page.tsx | موجود | /api/customers/[id] | src/app/api/customers/[id]/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| dashboard | (dashboard)/dashboard/page.tsx | موجود | /api/dashboard | src/app/api/dashboard/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| dms | (dashboard)/dms/page.tsx | موجود | /api/dms | src/app/api/dms/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| docs | (dashboard)/docs/page.tsx | موجود | /api/docs | src/app/api/docs/route.ts | GET | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | يحتاج فحص Tenant Isolation |
| docs | (dashboard)/docs/[slug]/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| documents | (dashboard)/documents/page.tsx | موجود | /api/documents | src/app/api/documents/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| ecommerce | (dashboard)/ecommerce/dashboard/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| ecommerce | (dashboard)/ecommerce/stores/page.tsx | موجود | /api/ecommerce/stores | src/app/api/ecommerce/stores/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| employees | (dashboard)/employees/page.tsx | موجود | /api/employees | src/app/api/employees/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| enterprise | (dashboard)/enterprise/fleet/page.tsx | موجود | /api/enterprise/fleet | src/app/api/enterprise/fleet/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| enterprise | (dashboard)/enterprise/legal/page.tsx | موجود | /api/enterprise/legal | src/app/api/enterprise/legal/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| enterprise | (dashboard)/enterprise/mrp/page.tsx | موجود | /api/enterprise/mrp | src/app/api/enterprise/mrp/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| enterprise | (dashboard)/enterprise/mrp/recipes/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| enterprise | (dashboard)/enterprise/portfolio/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| enterprise | (dashboard)/enterprise/projects/evm/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| enterprise | (dashboard)/enterprise/projects/page.tsx | موجود | /api/enterprise/projects | src/app/api/enterprise/projects/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| enterprise | (dashboard)/enterprise/projects/[id]/gantt/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| enterprise | (dashboard)/enterprise/projects/[id]/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| enterprise | (dashboard)/enterprise/property/page.tsx | موجود | /api/enterprise/property | src/app/api/enterprise/property/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| enterprise | (dashboard)/enterprise/quality/page.tsx | موجود | /api/enterprise/quality | src/app/api/enterprise/quality/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| enterprise | (dashboard)/enterprise/quality-management/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| enterprise | (dashboard)/enterprise/wms/page.tsx | موجود | /api/enterprise/wms | src/app/api/enterprise/wms/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| esign | (dashboard)/esign/page.tsx | موجود | /api/esign | src/app/api/esign/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| events | (dashboard)/events/page.tsx | موجود | /api/events | src/app/api/events/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| expenses | (dashboard)/expenses/page.tsx | موجود | /api/expenses | src/app/api/expenses/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| field-service | (dashboard)/field-service/page.tsx | موجود | /api/field-service | src/app/api/field-service/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| finance | (dashboard)/finance/allocation/page.tsx | موجود | /api/finance/allocation | src/app/api/finance/allocation/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| finance | (dashboard)/finance/assets/page.tsx | موجود | /api/finance/assets | src/app/api/finance/assets/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| finance | (dashboard)/finance/bad-debt/page.tsx | موجود | /api/finance/bad-debt | src/app/api/finance/bad-debt/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| finance | (dashboard)/finance/balance-sheet/page.tsx | موجود | /api/finance/balance-sheet | src/app/api/finance/balance-sheet/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| finance | (dashboard)/finance/bank-recon/rules/page.tsx | موجود | /api/finance/bank-recon/rules | src/app/api/finance/bank-recon/rules/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| finance | (dashboard)/finance/budget-control/page.tsx | موجود | /api/finance/budget-control | src/app/api/finance/budget-control/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| finance | (dashboard)/finance/budget-control/variance/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| finance | (dashboard)/finance/budget-planning/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| finance | (dashboard)/finance/budget-scenarios/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| finance | (dashboard)/finance/cash-flow/forecast/page.tsx | موجود | /api/finance/cash-flow/forecast | src/app/api/finance/cash-flow/forecast/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| finance | (dashboard)/finance/cash-flow/page.tsx | موجود | /api/finance/cash-flow | src/app/api/finance/cash-flow/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| finance | (dashboard)/finance/cfo/page.tsx | موجود | /api/finance/cfo | src/app/api/finance/cfo/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| finance | (dashboard)/finance/cfo-ai/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| finance | (dashboard)/finance/cfo-dashboard/page.tsx | موجود | /api/finance/cfo-dashboard | src/app/api/finance/cfo-dashboard/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| finance | (dashboard)/finance/consolidation/elimination/page.tsx | موجود | /api/finance/consolidation/elimination | src/app/api/finance/consolidation/elimination/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| finance | (dashboard)/finance/consolidation/page.tsx | موجود | /api/finance/consolidation | src/app/api/finance/consolidation/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| finance | (dashboard)/finance/copa/page.tsx | موجود | /api/finance/copa | src/app/api/finance/copa/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| finance | (dashboard)/finance/copa/rules/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| finance | (dashboard)/finance/credit-check/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| finance | (dashboard)/finance/deferred-tax/page.tsx | موجود | /api/finance/deferred-tax | src/app/api/finance/deferred-tax/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| finance | (dashboard)/finance/ecl/page.tsx | موجود | /api/finance/ecl | src/app/api/finance/ecl/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| finance | (dashboard)/finance/financial-health/page.tsx | موجود | /api/finance/financial-health | src/app/api/finance/financial-health/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| finance | (dashboard)/finance/fx-revaluation/page.tsx | موجود | /api/finance/fx-revaluation | src/app/api/finance/fx-revaluation/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| finance | (dashboard)/finance/impairment/page.tsx | موجود | /api/finance/impairment | src/app/api/finance/impairment/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| finance | (dashboard)/finance/payment-run/page.tsx | موجود | /api/finance/payment-run | src/app/api/finance/payment-run/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| finance | (dashboard)/finance/period-close/page.tsx | موجود | /api/finance/period-close | src/app/api/finance/period-close/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| finance | (dashboard)/finance/rebates/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| finance | (dashboard)/finance/transfer-pricing/page.tsx | موجود | /api/finance/transfer-pricing | src/app/api/finance/transfer-pricing/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| finance | (dashboard)/finance/variance/page.tsx | موجود | /api/finance/variance | src/app/api/finance/variance/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| finance | (dashboard)/finance/vat/categories/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| finance | (dashboard)/finance/wht/form14/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| finance | (dashboard)/finance/wht/page.tsx | موجود | /api/finance/wht | src/app/api/finance/wht/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| fiscal-periods | (dashboard)/fiscal-periods/page.tsx | موجود | /api/fiscal-periods | src/app/api/fiscal-periods/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| fixed-assets | (dashboard)/fixed-assets/page.tsx | موجود | /api/fixed-assets | src/app/api/fixed-assets/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| fleet | (dashboard)/fleet/fuel/page.tsx | موجود | /api/fleet/fuel | src/app/api/fleet/fuel/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| fleet | (dashboard)/fleet/maintenance/page.tsx | موجود | /api/fleet/maintenance | src/app/api/fleet/maintenance/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| fleet | (dashboard)/fleet/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| fleet | (dashboard)/fleet/tracking/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| fleet | (dashboard)/fleet/trips/page.tsx | موجود | /api/fleet/trips | src/app/api/fleet/trips/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| fng | (dashboard)/fng/allocations/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| fng | (dashboard)/fng/budgets/page.tsx | موجود | /api/fng/budgets | src/app/api/fng/budgets/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| fng | (dashboard)/fng/petty-cash-funds/page.tsx | موجود | /api/fng/petty-cash-funds | src/app/api/fng/petty-cash-funds/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| fsm | (dashboard)/fsm/dispatch/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| fsm | (dashboard)/fsm/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| fsm | (dashboard)/fsm/tasks/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| fx | (dashboard)/fx/page.tsx | موجود | /api/fx | src/app/api/fx/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| gift-cards | (dashboard)/gift-cards/page.tsx | موجود | /api/gift-cards | src/app/api/gift-cards/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| hr | (dashboard)/hr/ai-enrollment/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| hr | (dashboard)/hr/attendance/page.tsx | موجود | /api/hr/attendance | src/app/api/hr/attendance/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| hr | (dashboard)/hr/documents/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| hr | (dashboard)/hr/eos/page.tsx | موجود | /api/hr/eos | src/app/api/hr/eos/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| hr | (dashboard)/hr/evaluations/page.tsx | موجود | /api/hr/evaluations | src/app/api/hr/evaluations/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| hr | (dashboard)/hr/expense-reports/page.tsx | موجود | /api/hr/expense-reports | src/app/api/hr/expense-reports/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| hr | (dashboard)/hr/gosi/page.tsx | موجود | /api/hr/gosi | src/app/api/hr/gosi/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| hr | (dashboard)/hr/jobs/page.tsx | موجود | /api/hr/jobs | src/app/api/hr/jobs/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| hr | (dashboard)/hr/leaves/page.tsx | موجود | /api/hr/leaves | src/app/api/hr/leaves/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| hr | (dashboard)/hr/loans/page.tsx | موجود | /api/hr/loans | src/app/api/hr/loans/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| hr | (dashboard)/hr/mudad/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| hr | (dashboard)/hr/nitaqat-simulator/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| hr | (dashboard)/hr/org-chart/page.tsx | موجود | /api/hr/org-chart | src/app/api/hr/org-chart/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| hr | (dashboard)/hr/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| hr | (dashboard)/hr/payroll/config/page.tsx | موجود | /api/hr/payroll/config | src/app/api/hr/payroll/config/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| hr | (dashboard)/hr/payroll/run/page.tsx | موجود | /api/hr/payroll/run | src/app/api/hr/payroll/run/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| hr | (dashboard)/hr/payroll-process/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| hr | (dashboard)/hr/payslip/[id]/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| hr | (dashboard)/hr/performance/page.tsx | موجود | /api/hr/performance | src/app/api/hr/performance/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| hr | (dashboard)/hr/qiwa/contracts/page.tsx | موجود | /api/hr/qiwa/contracts | src/app/api/hr/qiwa/contracts/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| hr | (dashboard)/hr/qiwa/page.tsx | موجود | /api/hr/qiwa | src/app/api/hr/qiwa/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| hr | (dashboard)/hr/recruitment/page.tsx | موجود | /api/hr/recruitment | src/app/api/hr/recruitment/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| hr | (dashboard)/hr/saudization/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| hr | (dashboard)/hr/self-service/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| hr | (dashboard)/hr/succession/page.tsx | موجود | /api/hr/succession | src/app/api/hr/succession/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| hr | (dashboard)/hr/timesheet/page.tsx | موجود | /api/hr/timesheet | src/app/api/hr/timesheet/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| hr | (dashboard)/hr/training/page.tsx | موجود | /api/hr/training | src/app/api/hr/training/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| hr | (dashboard)/hr/wps/page.tsx | موجود | /api/hr/wps | src/app/api/hr/wps/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| installments | (dashboard)/installments/page.tsx | موجود | /api/installments | src/app/api/installments/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| inv | (dashboard)/inv/serials/page.tsx | موجود | /api/inv/serials | src/app/api/inv/serials/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| inventory | (dashboard)/inventory/abc-analysis/page.tsx | موجود | /api/inventory/abc-analysis | src/app/api/inventory/abc-analysis/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| inventory | (dashboard)/inventory/ai-vision/page.tsx | موجود | /api/inventory/ai-vision | src/app/api/inventory/ai-vision/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| inventory | (dashboard)/inventory/delivery-notes/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| inventory | (dashboard)/inventory/movements/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| inventory | (dashboard)/inventory/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| inventory | (dashboard)/inventory/picking/[id]/page.tsx | موجود | /api/inventory/picking/[id] | src/app/api/inventory/picking/[id]/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| inventory | (dashboard)/inventory/quality-control/page.tsx | موجود | /api/inventory/quality-control | src/app/api/inventory/quality-control/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| inventory | (dashboard)/inventory/reorder-rules/page.tsx | موجود | /api/inventory/reorder-rules | src/app/api/inventory/reorder-rules/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| inventory | (dashboard)/inventory/stocktake/cycle/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| inventory | (dashboard)/inventory/traceability/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| inventory | (dashboard)/inventory/wms/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| inventory | (dashboard)/inventory/wms/putaway/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| inventory | (dashboard)/inventory/zones/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| knowledge | (dashboard)/knowledge/articles/page.tsx | موجود | /api/knowledge/articles | src/app/api/knowledge/articles/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| learn | (dashboard)/learn/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| lms | (dashboard)/lms/courses/page.tsx | موجود | /api/lms/courses | src/app/api/lms/courses/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| logistics | (dashboard)/logistics/carriers/page.tsx | موجود | /api/logistics/carriers | src/app/api/logistics/carriers/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| logistics | (dashboard)/logistics/freight/page.tsx | موجود | /api/logistics/freight | src/app/api/logistics/freight/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| loyalty | (dashboard)/loyalty/page.tsx | موجود | /api/loyalty | src/app/api/loyalty/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| maintenance | (dashboard)/maintenance/page.tsx | موجود | /api/maintenance | src/app/api/maintenance/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| maintenance | (dashboard)/maintenance/preventive/page.tsx | موجود | /api/maintenance/preventive | src/app/api/maintenance/preventive/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| manufacturing | (dashboard)/manufacturing/aps/page.tsx | موجود | /api/manufacturing/aps | src/app/api/manufacturing/aps/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| manufacturing | (dashboard)/manufacturing/blockchain-trace/page.tsx | موجود | /api/manufacturing/blockchain-trace | src/app/api/manufacturing/blockchain-trace/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| manufacturing | (dashboard)/manufacturing/bom/page.tsx | موجود | /api/manufacturing/bom | src/app/api/manufacturing/bom/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| manufacturing | (dashboard)/manufacturing/boms/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| manufacturing | (dashboard)/manufacturing/boms/[id]/versions/page.tsx | موجود | /api/manufacturing/boms/[id]/versions | src/app/api/manufacturing/boms/[id]/versions/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| manufacturing | (dashboard)/manufacturing/capa/page.tsx | موجود | /api/manufacturing/capa | src/app/api/manufacturing/capa/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| manufacturing | (dashboard)/manufacturing/capacity/page.tsx | موجود | /api/manufacturing/capacity | src/app/api/manufacturing/capacity/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| manufacturing | (dashboard)/manufacturing/digital-twin/page.tsx | موجود | /api/manufacturing/digital-twin | src/app/api/manufacturing/digital-twin/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| manufacturing | (dashboard)/manufacturing/labor-efficiency/page.tsx | موجود | /api/manufacturing/labor-efficiency | src/app/api/manufacturing/labor-efficiency/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| manufacturing | (dashboard)/manufacturing/lean-kanban/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| manufacturing | (dashboard)/manufacturing/mes-oee/page.tsx | موجود | /api/manufacturing/mes-oee | src/app/api/manufacturing/mes-oee/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| manufacturing | (dashboard)/manufacturing/mrp-dashboard/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| manufacturing | (dashboard)/manufacturing/mrp-engine/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| manufacturing | (dashboard)/manufacturing/oee/page.tsx | موجود | /api/manufacturing/oee | src/app/api/manufacturing/oee/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| manufacturing | (dashboard)/manufacturing/orders/page.tsx | موجود | /api/manufacturing/orders | src/app/api/manufacturing/orders/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| manufacturing | (dashboard)/manufacturing/page.tsx | موجود | /api/manufacturing | src/app/api/manufacturing/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| manufacturing | (dashboard)/manufacturing/plm/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| manufacturing | (dashboard)/manufacturing/qc/page.tsx | موجود | /api/manufacturing/qc | src/app/api/manufacturing/qc/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| manufacturing | (dashboard)/manufacturing/quality/page.tsx | موجود | /api/manufacturing/quality | src/app/api/manufacturing/quality/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| manufacturing | (dashboard)/manufacturing/routing/page.tsx | موجود | /api/manufacturing/routing | src/app/api/manufacturing/routing/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| manufacturing | (dashboard)/manufacturing/scheduler/page.tsx | موجود | /api/manufacturing/scheduler | src/app/api/manufacturing/scheduler/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| manufacturing | (dashboard)/manufacturing/scrap/page.tsx | موجود | /api/manufacturing/scrap | src/app/api/manufacturing/scrap/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| manufacturing | (dashboard)/manufacturing/standard-cost/page.tsx | موجود | /api/manufacturing/standard-cost | src/app/api/manufacturing/standard-cost/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| manufacturing | (dashboard)/manufacturing/subcontracting/page.tsx | موجود | /api/manufacturing/subcontracting | src/app/api/manufacturing/subcontracting/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| manufacturing | (dashboard)/manufacturing/variance/page.tsx | موجود | /api/manufacturing/variance | src/app/api/manufacturing/variance/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| manufacturing | (dashboard)/manufacturing/work-centers/page.tsx | موجود | /api/manufacturing/work-centers | src/app/api/manufacturing/work-centers/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| manufacturing | (dashboard)/manufacturing/work-orders/page.tsx | موجود | /api/manufacturing/work-orders | src/app/api/manufacturing/work-orders/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| marketing | (dashboard)/marketing/analytics/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| payments | (dashboard)/payments/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| pdpl | (dashboard)/pdpl/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| pharmacy | (dashboard)/pharmacy/drug-interact/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| pharmacy | (dashboard)/pharmacy/manager/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| pharmacy | (dashboard)/pharmacy/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| planning | (dashboard)/planning/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| portal | (dashboard)/portal/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| pos-demo | (dashboard)/pos-demo/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| price-quotes | (dashboard)/price-quotes/page.tsx | موجود | /api/price-quotes | src/app/api/price-quotes/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| procurement | (dashboard)/procurement/contracts/page.tsx | موجود | /api/procurement/contracts | src/app/api/procurement/contracts/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| procurement | (dashboard)/procurement/price-comparison/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| procurement | (dashboard)/procurement/rfq/[id]/page.tsx | موجود | /api/procurement/rfq/[id] | src/app/api/procurement/rfq/[id]/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| procurement | (dashboard)/procurement/spend-analytics/page.tsx | موجود | /api/procurement/spend-analytics | src/app/api/procurement/spend-analytics/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| procurement | (dashboard)/procurement/supplier-contracts/page.tsx | موجود | /api/procurement/supplier-contracts | src/app/api/procurement/supplier-contracts/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| procurement | (dashboard)/procurement/vendor-portal/page.tsx | موجود | /api/procurement/vendor-portal | src/app/api/procurement/vendor-portal/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| procurement | (dashboard)/procurement/vendor-scorecard/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| procurement | (dashboard)/procurement/vendors/scorecard/page.tsx | موجود | /api/procurement/vendors/scorecard | src/app/api/procurement/vendors/scorecard/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| products | (dashboard)/products/page.tsx | موجود | /api/products | src/app/api/products/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| profile | (dashboard)/profile/security/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| projects | (dashboard)/projects/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| promotions | (dashboard)/promotions/page.tsx | موجود | /api/promotions | src/app/api/promotions/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| purchase-orders | (dashboard)/purchase-orders/page.tsx | موجود | /api/purchase-orders | src/app/api/purchase-orders/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| purchase-orders | (dashboard)/purchase-orders/[id]/landed-costs/page.tsx | موجود | /api/purchase-orders/[id]/landed-costs | src/app/api/purchase-orders/[id]/landed-costs/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| purchase-returns | (dashboard)/purchase-returns/page.tsx | موجود | /api/purchase-returns | src/app/api/purchase-returns/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| quality | (dashboard)/quality/inspections/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| quality | (dashboard)/quality/ncrs/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| quality | (dashboard)/quality/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| rebates | (dashboard)/rebates/page.tsx | موجود | /api/rebates | src/app/api/rebates/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| receipt-vouchers | (dashboard)/receipt-vouchers/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| recurring-invoices | (dashboard)/recurring-invoices/page.tsx | موجود | /api/recurring-invoices | src/app/api/recurring-invoices/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| rem | (dashboard)/rem/installments/page.tsx | موجود | /api/rem/installments | src/app/api/rem/installments/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| rem | (dashboard)/rem/leases/page.tsx | موجود | /api/rem/leases | src/app/api/rem/leases/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| rem | (dashboard)/rem/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| rent | (dashboard)/rent/page.tsx | موجود | /api/rent | src/app/api/rent/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| rental | (dashboard)/rental/agreements/page.tsx | موجود | /api/rental/agreements | src/app/api/rental/agreements/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| reports | (dashboard)/reports/104-modules/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| reports | (dashboard)/reports/73-modules/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| reports | (dashboard)/reports/aging/page.tsx | موجود | /api/reports/aging | src/app/api/reports/aging/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| reports | (dashboard)/reports/allocations/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| reports | (dashboard)/reports/bi-cube/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| reports | (dashboard)/reports/budget-variance/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| reports | (dashboard)/reports/builder/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| reports | (dashboard)/reports/cashflow/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| reports | (dashboard)/reports/consolidation/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| reports | (dashboard)/reports/customer-statement/page.tsx | موجود | /api/reports/customer-statement | src/app/api/reports/customer-statement/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| reports | (dashboard)/reports/expiry/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| reports | (dashboard)/reports/footnotes/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| reports | (dashboard)/reports/fraud-ai/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| reports | (dashboard)/reports/kpi-builder/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| reports | (dashboard)/reports/manual-purchases/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| reports | (dashboard)/reports/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| reports | (dashboard)/reports/pivot/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| reports | (dashboard)/reports/returns/page.tsx | موجود | /api/reports/returns | src/app/api/reports/returns/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| reports | (dashboard)/reports/segments/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| reports | (dashboard)/reports/zatca-vat/page.tsx | موجود | /api/reports/zatca-vat | src/app/api/reports/zatca-vat/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| restaurant-tables | (dashboard)/restaurant-tables/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| salaries | (dashboard)/salaries/page.tsx | موجود | /api/salaries | src/app/api/salaries/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| sales-returns | (dashboard)/sales-returns/page.tsx | موجود | /api/sales-returns | src/app/api/sales-returns/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| school | (dashboard)/school/attendance/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| school | (dashboard)/school/dashboard/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| school | (dashboard)/school/exams/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| school | (dashboard)/school/page.tsx | موجود | /api/school | src/app/api/school/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| school | (dashboard)/school/schedule/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| school | (dashboard)/school/stages/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| school | (dashboard)/school/transport/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| scm | (dashboard)/scm/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| settings | (dashboard)/settings/approvals/page.tsx | موجود | /api/settings/approvals | src/app/api/settings/approvals/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| settings | (dashboard)/settings/bpm/page.tsx | موجود | /api/settings/bpm | src/app/api/settings/bpm/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| settings | (dashboard)/settings/company/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| settings | (dashboard)/settings/currencies/page.tsx | موجود | /api/settings/currencies | src/app/api/settings/currencies/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| settings | (dashboard)/settings/custom-fields/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| settings | (dashboard)/settings/dashboard-builder/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| settings | (dashboard)/settings/import-export/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| settings | (dashboard)/settings/number-sequences/page.tsx | موجود | /api/settings/number-sequences | src/app/api/settings/number-sequences/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| settings | (dashboard)/settings/numbering/page.tsx | موجود | /api/settings/numbering | src/app/api/settings/numbering/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| settings | (dashboard)/settings/page.tsx | موجود | /api/settings | src/app/api/settings/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| settings | (dashboard)/settings/permissions/fields/page.tsx | موجود | /api/settings/permissions/fields | src/app/api/settings/permissions/fields/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| settings | (dashboard)/settings/print-templates/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| settings | (dashboard)/settings/roles/page.tsx | موجود | /api/settings/roles | src/app/api/settings/roles/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| settings | (dashboard)/settings/security/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| settings | (dashboard)/settings/sso/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| settings | (dashboard)/settings/state-machine/page.tsx | موجود | /api/settings/state-machine | src/app/api/settings/state-machine/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| settings | (dashboard)/settings/webhooks/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| settings | (dashboard)/settings/whatsapp/page.tsx | موجود | /api/settings/whatsapp | src/app/api/settings/whatsapp/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| settings | (dashboard)/settings/workflow-builder/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| settings | (dashboard)/settings/zatca/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| shifts | (dashboard)/shifts/monitor/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| shifts | (dashboard)/shifts/page.tsx | موجود | /api/shifts | src/app/api/shifts/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| shipping | (dashboard)/shipping/page.tsx | موجود | /api/shipping | src/app/api/shipping/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| shl | (dashboard)/shl/classes/page.tsx | موجود | /api/shl/classes | src/app/api/shl/classes/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| shl | (dashboard)/shl/students/page.tsx | موجود | /api/shl/students | src/app/api/shl/students/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| smart-transfers | (dashboard)/smart-transfers/page.tsx | موجود | /api/smart-transfers | src/app/api/smart-transfers/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| stock | (dashboard)/stock/adjustments/page.tsx | موجود | /api/stock/adjustments | src/app/api/stock/adjustments/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| stock | (dashboard)/stock/movements/page.tsx | موجود | /api/stock/movements | src/app/api/stock/movements/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| stock | (dashboard)/stock/page.tsx | موجود | /api/stock | src/app/api/stock/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| stock-transfers | (dashboard)/stock-transfers/page.tsx | موجود | /api/stock-transfers | src/app/api/stock-transfers/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| stocktake | (dashboard)/stocktake/page.tsx | موجود | /api/stocktake | src/app/api/stocktake/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| stocktake | (dashboard)/stocktake/vision/page.tsx | موجود | /api/stocktake/vision | src/app/api/stocktake/vision/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| subscriptions | (dashboard)/subscriptions/page.tsx | موجود | /api/subscriptions | src/app/api/subscriptions/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| subscriptions | (dashboard)/subscriptions/plans/page.tsx | موجود | /api/subscriptions/plans | src/app/api/subscriptions/plans/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| supply-chain | (dashboard)/supply-chain/rfx-auction/page.tsx | موجود | /api/supply-chain/rfx-auction | src/app/api/supply-chain/rfx-auction/route.ts | GET | غير مفحوص عميقاً | غير مؤكد | READY_TO_CONNECT_EXISTING_API | API GET جاهز وآمن للقراءة |
| supply-chain | (dashboard)/supply-chain/vendor-onboarding/page.tsx | موجود | /api/supply-chain/vendor-onboarding | src/app/api/supply-chain/vendor-onboarding/route.ts | GET | غير مفحوص عميقاً | غير مؤكد | READY_TO_CONNECT_EXISTING_API | API GET جاهز وآمن للقراءة |
| support | (dashboard)/support/help-desk/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| support | (dashboard)/support/sla/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| sys | (dashboard)/sys/alerts/page.tsx | موجود | /api/sys/alerts | src/app/api/sys/alerts/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| sys | (dashboard)/sys/health/page.tsx | موجود | /api/sys/health | src/app/api/sys/health/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| tax | (dashboard)/tax/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| tax | (dashboard)/tax/vat-returns/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| tax | (dashboard)/tax/wht/page.tsx | موجود | /api/tax/wht | src/app/api/tax/wht/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| tax | (dashboard)/tax/zakat/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| tax | (dashboard)/tax/zatca-onboard/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| v3 | (dashboard)/v3/clinic/appointments/page.tsx | موجود | /api/v3/clinic/appointments | src/app/api/v3/clinic/appointments/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| v3 | (dashboard)/v3/clinic/emr/page.tsx | موجود | /api/v3/clinic/emr | src/app/api/v3/clinic/emr/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| v3 | (dashboard)/v3/clinic/erx/page.tsx | موجود | /api/v3/clinic/erx | src/app/api/v3/clinic/erx/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| v3 | (dashboard)/v3/clinic/lab/page.tsx | موجود | /api/v3/clinic/lab | src/app/api/v3/clinic/lab/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| v3 | (dashboard)/v3/clinic/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| v3 | (dashboard)/v3/construction/boq/page.tsx | موجود | /api/v3/construction/boq | src/app/api/v3/construction/boq/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| v3 | (dashboard)/v3/construction/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| v3 | (dashboard)/v3/construction/progress-billing/page.tsx | موجود | /api/v3/construction/progress-billing | src/app/api/v3/construction/progress-billing/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| v3 | (dashboard)/v3/construction/variations/page.tsx | موجود | /api/v3/construction/variations | src/app/api/v3/construction/variations/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| v3 | (dashboard)/v3/distribution/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| v3 | (dashboard)/v3/distribution/picking/wave/page.tsx | موجود | /api/v3/distribution/picking/wave | src/app/api/v3/distribution/picking/wave/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| v3 | (dashboard)/v3/distribution/routes/page.tsx | موجود | /api/v3/distribution/routes | src/app/api/v3/distribution/routes/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| v3 | (dashboard)/v3/distribution/wms/page.tsx | موجود | /api/v3/distribution/wms | src/app/api/v3/distribution/wms/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| v3 | (dashboard)/v3/manufacturing/mrp/page.tsx | موجود | /api/v3/manufacturing/mrp | src/app/api/v3/manufacturing/mrp/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| v3 | (dashboard)/v3/manufacturing/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| v3 | (dashboard)/v3/manufacturing/shopfloor/page.tsx | موجود | /api/v3/manufacturing/shopfloor | src/app/api/v3/manufacturing/shopfloor/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| v3 | (dashboard)/v3/master/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| v3 | (dashboard)/v3/realestate/cam/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| v3 | (dashboard)/v3/realestate/leases/page.tsx | موجود | /api/v3/realestate/leases | src/app/api/v3/realestate/leases/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| v3 | (dashboard)/v3/realestate/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| v3 | (dashboard)/v3/restaurant/kds/page.tsx | موجود | /api/v3/restaurant/kds | src/app/api/v3/restaurant/kds/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| v3 | (dashboard)/v3/restaurant/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| v3 | (dashboard)/v3/restaurant/tables/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| v3 | (dashboard)/v3/retail/loyalty/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| v3 | (dashboard)/v3/retail/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| v3 | (dashboard)/v3/retail/pos/page.tsx | موجود | /api/v3/retail/pos | src/app/api/v3/retail/pos/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| v3 | (dashboard)/v3/school/gradebook/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| v3 | (dashboard)/v3/school/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| v3 | (dashboard)/v3/school/sis/page.tsx | موجود | /api/v3/school/sis | src/app/api/v3/school/sis/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| v3 | (dashboard)/v3/school/transcripts/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| v3 | (dashboard)/v3/services/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| v3 | (dashboard)/v3/services/sla/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| v3 | (dashboard)/v3/services/timesheet/page.tsx | موجود | /api/v3/services/timesheet | src/app/api/v3/services/timesheet/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| v3 | (dashboard)/v3/services/workorders/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| vacations | (dashboard)/vacations/page.tsx | موجود | /api/vacations | src/app/api/vacations/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| vat | (dashboard)/vat/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| vendor-portal | (dashboard)/vendor-portal/page.tsx | موجود | /api/vendor-portal | src/app/api/vendor-portal/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| vendor-ratings | (dashboard)/vendor-ratings/page.tsx | موجود | /api/vendor-ratings | src/app/api/vendor-ratings/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| warehouses | (dashboard)/warehouses/alerts/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| warehouses | (dashboard)/warehouses/fifo/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| warehouses | (dashboard)/warehouses/map/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| warehouses | (dashboard)/warehouses/options/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| warehouses | (dashboard)/warehouses/page.tsx | موجود | /api/warehouses | src/app/api/warehouses/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| warranty | (dashboard)/warranty/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| wht | (dashboard)/wht/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| wms | (dashboard)/wms/waves/page.tsx | موجود | /api/wms/waves | src/app/api/wms/waves/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| zakat | (dashboard)/zakat/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| zatca | (dashboard)/zatca/page.tsx | موجود | /api/zatca | src/app/api/zatca/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| api-docs | api-docs/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| auth | auth/routing/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| auto-login | auto-login/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| b2b | b2b/login/page.tsx | موجود | /api/b2b/login | src/app/api/b2b/login/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| b2b | b2b/shop/page.tsx | موجود | /api/b2b/shop | src/app/api/b2b/shop/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| billing-expired | billing-expired/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| company-info | company-info/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| company-setup | company-setup/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| customer | customer/table/[qrToken]/page.tsx | موجود | /api/customer/table/[qrToken] | src/app/api/customer/table/[qrToken]/route.ts | GET | غير مفحوص عميقاً | غير مؤكد | READY_TO_CONNECT_EXISTING_API | API GET جاهز وآمن للقراءة |
| design1 | design1/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| design2 | design2/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| design3 | design3/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| design4 | design4/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| factory | factory/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| features | features/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| ice | ice/admins/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| ice | ice/audit/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| ice | ice/billing/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| ice | ice/health/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| ice | ice/licenses/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| ice | ice/login/2fa/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| ice | ice/login/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| ice | ice/modules/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| ice | ice/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| ice | ice/settings/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| ice | ice/support/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| ice | ice/tenants/page.tsx | موجود | /api/ice/tenants | src/app/api/ice/tenants/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| invoice | invoice/[id]/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| kiosk | kiosk/attendance/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| master | master/page.tsx | موجود | /api/master | src/app/api/master/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| master-panel | master-panel/login/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| master-panel | master-panel/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| page.tsx | page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| portals | portals/parent/page.tsx | موجود | /api/portals/parent | src/app/api/portals/parent/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| portals | portals/tenant/page.tsx | موجود | /api/portals/tenant | src/app/api/portals/tenant/route.ts | N/A | غير مفحوص عميقاً | غير مؤكد | API_EXISTS_BUT_NOT_SAFE_FOR_WAVE_B | ليست عملية GET قراءة فقط |
| restaurant | restaurant/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| sentry-example-page | sentry-example-page/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| sso-callback | sso-callback/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |
| test-i18n | test-i18n/page.tsx | موجود | لا يوجد | - | N/A | غير مفحوص عميقاً | غير مؤكد | PAGE_EXISTS_NO_API | لا يوجد مسار API مطابق |

## 5. READY_TO_CONNECT_EXISTING_API

| Module | Page File | API Route | API File | Method | Expected Response Shape | UI Work Needed | Risk | Tests Needed |
|---|---|---|---|---|---|---|---|---|
| supply-chain | src/app/(dashboard)/supply-chain/rfx-auction/page.tsx | /api/supply-chain/rfx-auction | src/app/api/supply-chain/rfx-auction/route.ts | GET | Array/Object | إضافة fetch و loading states | Low | UI render test |
| supply-chain | src/app/(dashboard)/supply-chain/vendor-onboarding/page.tsx | /api/supply-chain/vendor-onboarding | src/app/api/supply-chain/vendor-onboarding/route.ts | GET | Array/Object | إضافة fetch و loading states | Low | UI render test |
| customer | src/app/customer/table/[qrToken]/page.tsx | /api/customer/table/[qrToken] | src/app/api/customer/table/[qrToken]/route.ts | GET | Array/Object | إضافة fetch و loading states | Low | UI render test |

## 6. Proposed Wave B Implementation Scope

| Priority | Module | Page File | API Route | Reason Included | Expected Files Changed |
|---|---|---|---|---|---|
| 1 | supply-chain | src/app/(dashboard)/supply-chain/rfx-auction/page.tsx | /api/supply-chain/rfx-auction | API آمن للقراءة | src/app/(dashboard)/supply-chain/rfx-auction/page.tsx |
| 2 | supply-chain | src/app/(dashboard)/supply-chain/vendor-onboarding/page.tsx | /api/supply-chain/vendor-onboarding | API آمن للقراءة | src/app/(dashboard)/supply-chain/vendor-onboarding/page.tsx |
| 3 | customer | src/app/customer/table/[qrToken]/page.tsx | /api/customer/table/[qrToken] | API آمن للقراءة | src/app/customer/table/[qrToken]/page.tsx |

## 7. Exclusions
(تم تجاوز سرد القوائم الطويلة في هذا التقرير لتجنب التشويش، والتفاصيل موجودة في الجدول الشامل).

## 8. Verification Plan for Next Implementation
```bash
npx tsc --noEmit
npx prisma validate
npm run lint
```

## 9. Safety Confirmation
* No code changes.
* No backend API created.
* No Prisma schema change.
* No DB migration.
* No commit.
* No push.
* No deploy.
* No production touch.
* No financial logic changed.
* No secrets exposed.

## 10. Final Status
FINAL_STATUS:
MODULE_COMPLETION_WAVE_B_EXPLICIT_MAPPING_COMPLETED

NEXT_APPROVAL_REQUIRED:
GO_FOR_MODULE_COMPLETION_WAVE_B_LOCAL_IMPLEMENTATION_ONLY
