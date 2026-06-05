# سجل وجرد الصفحات الكامل للـ ERP (Full Page Inventory)

يحتوي هذا الملف على حصر شامل ودقيق لكافة الصفحات الرسومية وواجهات المستخدم في نظام نما إنفست ERP، مع تحديد متطلبات المصادقة وعزل المستأجرين.

| Module | Section | Subsection | Route | File | Purpose | APIs | Auth | RBAC | Tenant | Status | Missing |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| المحاسبة | aging-report | aging-report | /accounting/aging-report | src/app/(dashboard)/accounting/aging-report/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المحاسبة | allocations | allocations | /accounting/allocations/rules | src/app/(dashboard)/accounting/allocations/rules/page.tsx | صفحة مستخدم | /accounting/allocations, /accounting/allocations/run, /accounting/allocations/simulate | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | bank-reconciliation | bank-reconciliation | /accounting/bank-reconciliation | src/app/(dashboard)/accounting/bank-reconciliation/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المحاسبة | banks | banks | /accounting/banks/imports | src/app/(dashboard)/accounting/banks/imports/page.tsx | صفحة مستخدم | /accounting/banks/imports, /accounting/banks/recon/create-je, /accounting/banks/recon/match | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | banks | banks | /accounting/banks | src/app/(dashboard)/accounting/banks/page.tsx | صفحة مستخدم | /accounting/banks/imports, /accounting/banks/recon/create-je, /accounting/banks/recon/match | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | banks | banks | /accounting/banks/recon | src/app/(dashboard)/accounting/banks/recon/page.tsx | صفحة مستخدم | /accounting/banks/imports, /accounting/banks/recon/create-je, /accounting/banks/recon/match | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | banks | banks | /accounting/banks/[id] | src/app/(dashboard)/accounting/banks/[id]/page.tsx | صفحة مستخدم | /accounting/banks/imports, /accounting/banks/recon/create-je, /accounting/banks/recon/match | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | collection-workflow | collection-workflow | /accounting/collection-workflow | src/app/(dashboard)/accounting/collection-workflow/page.tsx | صفحة مستخدم | /accounting/collection-workflow | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | customer-statements | customer-statements | /accounting/customer-statements/bulk | src/app/(dashboard)/accounting/customer-statements/bulk/page.tsx | صفحة مستخدم | /accounting/customer-statements/bulk/history, /accounting/customer-statements/bulk/preview, /accounting/customer-statements/bulk/run | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | customer-statements | customer-statements | /accounting/customer-statements | src/app/(dashboard)/accounting/customer-statements/page.tsx | صفحة مستخدم | /accounting/customer-statements/bulk/history, /accounting/customer-statements/bulk/preview, /accounting/customer-statements/bulk/run | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | customer-statements | customer-statements | /accounting/customer-statements/templates | src/app/(dashboard)/accounting/customer-statements/templates/page.tsx | صفحة مستخدم | /accounting/customer-statements/bulk/history, /accounting/customer-statements/bulk/preview, /accounting/customer-statements/bulk/run | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | deferred | deferred | /accounting/deferred | src/app/(dashboard)/accounting/deferred/page.tsx | صفحة مستخدم | /accounting/deferred | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | dunning | dunning | /accounting/dunning/letters | src/app/(dashboard)/accounting/dunning/letters/page.tsx | صفحة مستخدم | /accounting/dunning/daily-run, /accounting/dunning/promise-to-pay | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | dunning | dunning | /accounting/dunning | src/app/(dashboard)/accounting/dunning/page.tsx | صفحة مستخدم | /accounting/dunning/daily-run, /accounting/dunning/promise-to-pay | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | dunning | dunning | /accounting/dunning/promises | src/app/(dashboard)/accounting/dunning/promises/page.tsx | صفحة مستخدم | /accounting/dunning/daily-run, /accounting/dunning/promise-to-pay | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | financial-close | financial-close | /accounting/financial-close | src/app/(dashboard)/accounting/financial-close/page.tsx | صفحة مستخدم | /accounting/financial-close | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | fixed-assets | fixed-assets | /accounting/fixed-assets | src/app/(dashboard)/accounting/fixed-assets/page.tsx | صفحة مستخدم | /accounting/fixed-assets/depreciate, /accounting/fixed-assets | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | inter-company | inter-company | /accounting/inter-company | src/app/(dashboard)/accounting/inter-company/page.tsx | صفحة مستخدم | /accounting/inter-company | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | journal | journal | /accounting/journal/new | src/app/(dashboard)/accounting/journal/new/page.tsx | صفحة مستخدم | /accounting/journal, /accounting/journal/[id] | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | journal | journal | /accounting/journal | src/app/(dashboard)/accounting/journal/page.tsx | صفحة مستخدم | /accounting/journal, /accounting/journal/[id] | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | lc | lc | /accounting/lc | src/app/(dashboard)/accounting/lc/page.tsx | صفحة مستخدم | /accounting/lc | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | leases | leases | /accounting/leases | src/app/(dashboard)/accounting/leases/page.tsx | صفحة مستخدم | /accounting/leases/amortize, /accounting/leases | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | multi-book | multi-book | /accounting/multi-book | src/app/(dashboard)/accounting/multi-book/page.tsx | صفحة مستخدم | /accounting/multi-book/adjustments | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | open-items | open-items | /accounting/open-items | src/app/(dashboard)/accounting/open-items/page.tsx | صفحة مستخدم | /accounting/open-items/apply-payment, /accounting/open-items/auto-clear, /accounting/open-items/disputes | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | main | main | /accounting | src/app/(dashboard)/accounting/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المحاسبة | payment-runs | payment-runs | /accounting/payment-runs/create | src/app/(dashboard)/accounting/payment-runs/create/page.tsx | صفحة مستخدم | /accounting/payment-runs/propose, /accounting/payment-runs/[id]/approve, /accounting/payment-runs/[id]/generate-files | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | payment-runs | payment-runs | /accounting/payment-runs | src/app/(dashboard)/accounting/payment-runs/page.tsx | صفحة مستخدم | /accounting/payment-runs/propose, /accounting/payment-runs/[id]/approve, /accounting/payment-runs/[id]/generate-files | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | period-close | period-close | /accounting/period-close | src/app/(dashboard)/accounting/period-close/page.tsx | صفحة مستخدم | /accounting/period-close | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | period-lock | period-lock | /accounting/period-lock | src/app/(dashboard)/accounting/period-lock/page.tsx | صفحة مستخدم | /accounting/period-lock | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | prepayments | prepayments | /accounting/prepayments | src/app/(dashboard)/accounting/prepayments/page.tsx | صفحة مستخدم | /accounting/prepayments | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | profit-centers | profit-centers | /accounting/profit-centers | src/app/(dashboard)/accounting/profit-centers/page.tsx | صفحة مستخدم | /accounting/profit-centers | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | profit-loss | profit-loss | /accounting/profit-loss | src/app/(dashboard)/accounting/profit-loss/page.tsx | صفحة مستخدم | /accounting/profit-loss | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | revenue-recognition | revenue-recognition | /accounting/revenue-recognition | src/app/(dashboard)/accounting/revenue-recognition/page.tsx | صفحة مستخدم | /accounting/revenue-recognition/amortize, /accounting/revenue-recognition | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | segments | segments | /accounting/segments | src/app/(dashboard)/accounting/segments/page.tsx | صفحة مستخدم | /accounting/segments | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | trial-balance | trial-balance | /accounting/trial-balance | src/app/(dashboard)/accounting/trial-balance/page.tsx | صفحة مستخدم | /accounting/trial-balance | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | vat-return | vat-return | /accounting/vat-return | src/app/(dashboard)/accounting/vat-return/page.tsx | صفحة مستخدم | /accounting/vat-return | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | vendor-statements | vendor-statements | /accounting/vendor-statements/bulk | src/app/(dashboard)/accounting/vendor-statements/bulk/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المحاسبة | vendor-statements | vendor-statements | /accounting/vendor-statements | src/app/(dashboard)/accounting/vendor-statements/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المحاسبة | year-end-close | year-end-close | /accounting/year-end-close | src/app/(dashboard)/accounting/year-end-close/page.tsx | صفحة مستخدم | /accounting/year-end-close/close-period, /accounting/year-end-close | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | consolidation | consolidation | /accounting/consolidation | src/app/(dashboard)/accounting/consolidation/page.tsx | صفحة مستخدم | /accounting/consolidation/commit, /accounting/consolidation/eliminations/dry-run, /accounting/consolidation/eliminations/requests | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المحاسبة | financial-report-audit | financial-report-audit | /accounting/financial-report-audit | src/app/(dashboard)/accounting/financial-report-audit/page.tsx | صفحة مستخدم | /accounting/financial-report-audit | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الإدارة العامة | bi-builder | bi-builder | /admin/bi-builder | src/app/(dashboard)/admin/bi-builder/page.tsx | صفحة مستخدم | None | نعم | SuperAdmin/Admin | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإدارة العامة | chains | chains | /admin/chains | src/app/(dashboard)/admin/chains/page.tsx | صفحة مستخدم | None | نعم | SuperAdmin/Admin | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإدارة العامة | compliance | compliance | /admin/compliance | src/app/(dashboard)/admin/compliance/page.tsx | صفحة مستخدم | /admin/compliance | نعم | SuperAdmin/Admin | نعم | مكتمل | لا يوجد |
| الإدارة العامة | compliance-dashboard | compliance-dashboard | /admin/compliance-dashboard | src/app/(dashboard)/admin/compliance-dashboard/page.tsx | صفحة مستخدم | None | نعم | SuperAdmin/Admin | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإدارة العامة | e2e-tester | e2e-tester | /admin/e2e-tester | src/app/(dashboard)/admin/e2e-tester/page.tsx | صفحة مستخدم | None | نعم | SuperAdmin/Admin | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإدارة العامة | feature-flags | feature-flags | /admin/feature-flags | src/app/(dashboard)/admin/feature-flags/page.tsx | صفحة مستخدم | None | نعم | SuperAdmin/Admin | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإدارة العامة | grc | grc | /admin/grc/audit-log | src/app/(dashboard)/admin/grc/audit-log/page.tsx | صفحة مستخدم | None | نعم | SuperAdmin/Admin | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإدارة العامة | grc | grc | /admin/grc | src/app/(dashboard)/admin/grc/page.tsx | صفحة مستخدم | None | نعم | SuperAdmin/Admin | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإدارة العامة | grc | grc | /admin/grc/policies | src/app/(dashboard)/admin/grc/policies/page.tsx | صفحة مستخدم | None | نعم | SuperAdmin/Admin | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإدارة العامة | grc | grc | /admin/grc/risks | src/app/(dashboard)/admin/grc/risks/page.tsx | صفحة مستخدم | None | نعم | SuperAdmin/Admin | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإدارة العامة | knowledge | knowledge | /admin/knowledge | src/app/(dashboard)/admin/knowledge/page.tsx | صفحة مستخدم | /admin/knowledge | نعم | SuperAdmin/Admin | نعم | مكتمل | لا يوجد |
| الإدارة العامة | llm-costs | llm-costs | /admin/llm-costs | src/app/(dashboard)/admin/llm-costs/page.tsx | صفحة مستخدم | /admin/llm-costs | نعم | SuperAdmin/Admin | نعم | مكتمل | لا يوجد |
| الإدارة العامة | migration | migration | /admin/migration | src/app/(dashboard)/admin/migration/page.tsx | صفحة مستخدم | None | نعم | SuperAdmin/Admin | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإدارة العامة | orchestration | orchestration | /admin/orchestration | src/app/(dashboard)/admin/orchestration/page.tsx | صفحة مستخدم | /admin/orchestration | نعم | SuperAdmin/Admin | نعم | مكتمل | لا يوجد |
| الإدارة العامة | outbox | outbox | /admin/outbox | src/app/(dashboard)/admin/outbox/page.tsx | صفحة مستخدم | /admin/outbox/diagnostics | نعم | SuperAdmin/Admin | نعم | مكتمل | لا يوجد |
| الإدارة العامة | prompts | prompts | /admin/prompts/cost | src/app/(dashboard)/admin/prompts/cost/page.tsx | صفحة مستخدم | /admin/prompts | نعم | SuperAdmin/Admin | نعم | مكتمل | لا يوجد |
| الإدارة العامة | prompts | prompts | /admin/prompts | src/app/(dashboard)/admin/prompts/page.tsx | صفحة مستخدم | /admin/prompts | نعم | SuperAdmin/Admin | نعم | مكتمل | لا يوجد |
| الإدارة العامة | rag-cost | rag-cost | /admin/rag-cost | src/app/(dashboard)/admin/rag-cost/page.tsx | صفحة مستخدم | None | نعم | SuperAdmin/Admin | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإدارة العامة | security | security | /admin/security/mfa-audit | src/app/(dashboard)/admin/security/mfa-audit/page.tsx | صفحة مستخدم | None | نعم | SuperAdmin/Admin | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإدارة العامة | security | security | /admin/security/mfa-policy | src/app/(dashboard)/admin/security/mfa-policy/page.tsx | صفحة مستخدم | None | نعم | SuperAdmin/Admin | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإدارة العامة | siem | siem | /admin/siem | src/app/(dashboard)/admin/siem/page.tsx | صفحة مستخدم | /admin/siem | نعم | SuperAdmin/Admin | نعم | مكتمل | لا يوجد |
| الإدارة العامة | sprint-progress | sprint-progress | /admin/sprint-progress | src/app/(dashboard)/admin/sprint-progress/page.tsx | صفحة مستخدم | None | نعم | SuperAdmin/Admin | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإدارة العامة | stories | stories | /admin/stories | src/app/(dashboard)/admin/stories/page.tsx | صفحة مستخدم | None | نعم | SuperAdmin/Admin | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإدارة العامة | test-coverage | test-coverage | /admin/test-coverage | src/app/(dashboard)/admin/test-coverage/page.tsx | صفحة مستخدم | None | نعم | SuperAdmin/Admin | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإدارة العامة | training-compliance | training-compliance | /admin/training-compliance | src/app/(dashboard)/admin/training-compliance/page.tsx | صفحة مستخدم | None | نعم | SuperAdmin/Admin | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| affiliates | main | main | /affiliates | src/app/(dashboard)/affiliates/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| ai | bank-fraud | bank-fraud | /ai/bank-fraud | src/app/(dashboard)/ai/bank-fraud/page.tsx | صفحة مستخدم | /ai/bank-fraud | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| ai | demand-forecast | demand-forecast | /ai/demand-forecast | src/app/(dashboard)/ai/demand-forecast/page.tsx | صفحة مستخدم | /ai/demand-forecast | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| ai | nlq | nlq | /ai/nlq | src/app/(dashboard)/ai/nlq/page.tsx | صفحة مستخدم | /ai/nlq | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| ai | sales-coach | sales-coach | /ai/sales-coach | src/app/(dashboard)/ai/sales-coach/page.tsx | صفحة مستخدم | /ai/sales-coach | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| ai-auditor | main | main | /ai-auditor | src/app/(dashboard)/ai-auditor/page.tsx | صفحة مستخدم | /ai-auditor | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| ai-bank | main | main | /ai-bank | src/app/(dashboard)/ai-bank/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| ai-cfo | main | main | /ai-cfo | src/app/(dashboard)/ai-cfo/page.tsx | صفحة مستخدم | /ai-cfo | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| ai-copilot | main | main | /ai-copilot | src/app/(dashboard)/ai-copilot/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| ai-scm | main | main | /ai-scm | src/app/(dashboard)/ai-scm/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| ap | capture | capture | /ap/capture | src/app/(dashboard)/ap/capture/page.tsx | صفحة مستخدم | /ap/capture | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| approvals | inbox | inbox | /approvals/inbox | src/app/(dashboard)/approvals/inbox/page.tsx | صفحة مستخدم | /approvals/inbox | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| approvals | main | main | /approvals | src/app/(dashboard)/approvals/page.tsx | صفحة مستخدم | /approvals | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| assets | main | main | /assets | src/app/(dashboard)/assets/page.tsx | صفحة مستخدم | /assets | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| attendance | main | main | /attendance | src/app/(dashboard)/attendance/page.tsx | صفحة مستخدم | /attendance | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| audit | field-trail | field-trail | /audit/field-trail | src/app/(dashboard)/audit/field-trail/page.tsx | صفحة مستخدم | /audit/field-trail | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| audit-logs | main | main | /audit-logs | src/app/(dashboard)/audit-logs/page.tsx | صفحة مستخدم | /audit-logs | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| banks | main | main | /banks | src/app/(dashboard)/banks/page.tsx | صفحة مستخدم | /banks | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| barcode | main | main | /barcode | src/app/(dashboard)/barcode/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| batches | main | main | /batches | src/app/(dashboard)/batches/page.tsx | صفحة مستخدم | /batches | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| bi | dashboard | dashboard | /bi/dashboard | src/app/(dashboard)/bi/dashboard/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| bookings | calendar | calendar | /bookings/calendar | src/app/(dashboard)/bookings/calendar/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| bookings | main | main | /bookings | src/app/(dashboard)/bookings/page.tsx | صفحة مستخدم | /bookings | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| branches | main | main | /branches | src/app/(dashboard)/branches/page.tsx | صفحة مستخدم | /branches | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| calendar | main | main | /calendar | src/app/(dashboard)/calendar/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| clinic | appointments | appointments | /clinic/appointments | src/app/(dashboard)/clinic/appointments/page.tsx | صفحة مستخدم | /clinic/appointments | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| clinic | erx | erx | /clinic/erx | src/app/(dashboard)/clinic/erx/page.tsx | صفحة مستخدم | /clinic/erx | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| clinic | lab | lab | /clinic/lab | src/app/(dashboard)/clinic/lab/page.tsx | صفحة مستخدم | /clinic/lab | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| cmms | main | main | /cmms | src/app/(dashboard)/cmms/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| cmms | work-orders | work-orders | /cmms/work-orders | src/app/(dashboard)/cmms/work-orders/page.tsx | صفحة مستخدم | /cmms/work-orders | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| com | rules | rules | /com/rules | src/app/(dashboard)/com/rules/page.tsx | صفحة مستخدم | /com/rules | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| compliance | audits | audits | /compliance/audits | src/app/(dashboard)/compliance/audits/page.tsx | صفحة مستخدم | /compliance/audits | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| compliance | pdpl | pdpl | /compliance/pdpl/breaches | src/app/(dashboard)/compliance/pdpl/breaches/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| compliance | pdpl | pdpl | /compliance/pdpl/dsr | src/app/(dashboard)/compliance/pdpl/dsr/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| compliance | risks | risks | /compliance/risks | src/app/(dashboard)/compliance/risks/page.tsx | صفحة مستخدم | /compliance/risks | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| contracts | main | main | /contracts | src/app/(dashboard)/contracts/page.tsx | صفحة مستخدم | /contracts | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| contracts | templates | templates | /contracts/templates | src/app/(dashboard)/contracts/templates/page.tsx | صفحة مستخدم | /contracts/templates | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| copa | main | main | /copa | src/app/(dashboard)/copa/page.tsx | صفحة مستخدم | /copa | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| coupons | main | main | /coupons | src/app/(dashboard)/coupons/page.tsx | صفحة مستخدم | /coupons | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| cpq | main | main | /cpq | src/app/(dashboard)/cpq/page.tsx | صفحة مستخدم | /cpq | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| credit-check | main | main | /credit-check | src/app/(dashboard)/credit-check/page.tsx | صفحة مستخدم | /credit-check | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| crm | campaigns | campaigns | /crm/campaigns | src/app/(dashboard)/crm/campaigns/page.tsx | صفحة مستخدم | /crm/campaigns | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| crm | customer360 | customer360 | /crm/customer360 | src/app/(dashboard)/crm/customer360/page.tsx | صفحة مستخدم | /crm/customer360 | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| crm | cx-nps | cx-nps | /crm/cx-nps | src/app/(dashboard)/crm/cx-nps/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| crm | kanban | kanban | /crm/kanban | src/app/(dashboard)/crm/kanban/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| crm | key-accounts | key-accounts | /crm/key-accounts | src/app/(dashboard)/crm/key-accounts/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| crm | leads | leads | /crm/leads | src/app/(dashboard)/crm/leads/page.tsx | صفحة مستخدم | /crm/leads, /crm/leads/[id]/convert | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| crm | opportunities | opportunities | /crm/opportunities | src/app/(dashboard)/crm/opportunities/page.tsx | صفحة مستخدم | /crm/opportunities, /crm/opportunities/[id]/win | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| crm | main | main | /crm | src/app/(dashboard)/crm/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| crm | tickets | tickets | /crm/tickets | src/app/(dashboard)/crm/tickets/page.tsx | صفحة مستخدم | /crm/tickets | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| customers | main | main | /customers | src/app/(dashboard)/customers/page.tsx | صفحة مستخدم | /customers | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| customers | [id] | [id] | /customers/[id] | src/app/(dashboard)/customers/[id]/page.tsx | صفحة مستخدم | /customers/[id]/credit, /customers/[id]/gdpr-delete, /customers/[id]/hold | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| لوحة التحكم | main | main | /dashboard | src/app/(dashboard)/dashboard/page.tsx | صفحة مستخدم | /dashboard | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| dms | main | main | /dms | src/app/(dashboard)/dms/page.tsx | صفحة مستخدم | /dms | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| docs | main | main | /docs | src/app/(dashboard)/docs/page.tsx | صفحة مستخدم | /docs | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| docs | [slug] | [slug] | /docs/[slug] | src/app/(dashboard)/docs/[slug]/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| documents | main | main | /documents | src/app/(dashboard)/documents/page.tsx | صفحة مستخدم | /documents | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| ecommerce | dashboard | dashboard | /ecommerce/dashboard | src/app/(dashboard)/ecommerce/dashboard/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| ecommerce | stores | stores | /ecommerce/stores | src/app/(dashboard)/ecommerce/stores/page.tsx | صفحة مستخدم | /ecommerce/stores | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| employees | main | main | /employees | src/app/(dashboard)/employees/page.tsx | صفحة مستخدم | /employees | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| enterprise | fleet | fleet | /enterprise/fleet | src/app/(dashboard)/enterprise/fleet/page.tsx | صفحة مستخدم | /enterprise/fleet | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| enterprise | legal | legal | /enterprise/legal | src/app/(dashboard)/enterprise/legal/page.tsx | صفحة مستخدم | /enterprise/legal | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| enterprise | mrp | mrp | /enterprise/mrp | src/app/(dashboard)/enterprise/mrp/page.tsx | صفحة مستخدم | /enterprise/mrp | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| enterprise | mrp | mrp | /enterprise/mrp/recipes | src/app/(dashboard)/enterprise/mrp/recipes/page.tsx | صفحة مستخدم | /enterprise/mrp | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| enterprise | portfolio | portfolio | /enterprise/portfolio | src/app/(dashboard)/enterprise/portfolio/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| enterprise | projects | projects | /enterprise/projects/evm | src/app/(dashboard)/enterprise/projects/evm/page.tsx | صفحة مستخدم | /enterprise/projects/budget, /enterprise/projects, /enterprise/projects/tasks | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| enterprise | projects | projects | /enterprise/projects | src/app/(dashboard)/enterprise/projects/page.tsx | صفحة مستخدم | /enterprise/projects/budget, /enterprise/projects, /enterprise/projects/tasks | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| enterprise | projects | projects | /enterprise/projects/[id]/gantt | src/app/(dashboard)/enterprise/projects/[id]/gantt/page.tsx | صفحة مستخدم | /enterprise/projects/budget, /enterprise/projects, /enterprise/projects/tasks | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| enterprise | projects | projects | /enterprise/projects/[id] | src/app/(dashboard)/enterprise/projects/[id]/page.tsx | صفحة مستخدم | /enterprise/projects/budget, /enterprise/projects, /enterprise/projects/tasks | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| enterprise | property | property | /enterprise/property | src/app/(dashboard)/enterprise/property/page.tsx | صفحة مستخدم | /enterprise/property | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| enterprise | quality | quality | /enterprise/quality | src/app/(dashboard)/enterprise/quality/page.tsx | صفحة مستخدم | /enterprise/quality | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| enterprise | quality-management | quality-management | /enterprise/quality-management | src/app/(dashboard)/enterprise/quality-management/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| enterprise | wms | wms | /enterprise/wms | src/app/(dashboard)/enterprise/wms/page.tsx | صفحة مستخدم | /enterprise/wms | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| esign | main | main | /esign | src/app/(dashboard)/esign/page.tsx | صفحة مستخدم | /esign | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| events | main | main | /events | src/app/(dashboard)/events/page.tsx | صفحة مستخدم | /events | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| expenses | main | main | /expenses | src/app/(dashboard)/expenses/page.tsx | صفحة مستخدم | /expenses | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| field-service | main | main | /field-service | src/app/(dashboard)/field-service/page.tsx | صفحة مستخدم | /field-service | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | allocation | allocation | /finance/allocation | src/app/(dashboard)/finance/allocation/page.tsx | صفحة مستخدم | /finance/allocation | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | assets | assets | /finance/assets | src/app/(dashboard)/finance/assets/page.tsx | صفحة مستخدم | /finance/assets | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | bad-debt | bad-debt | /finance/bad-debt | src/app/(dashboard)/finance/bad-debt/page.tsx | صفحة مستخدم | /finance/bad-debt | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | balance-sheet | balance-sheet | /finance/balance-sheet | src/app/(dashboard)/finance/balance-sheet/page.tsx | صفحة مستخدم | /finance/balance-sheet | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | bank-recon | bank-recon | /finance/bank-recon/rules | src/app/(dashboard)/finance/bank-recon/rules/page.tsx | صفحة مستخدم | /finance/bank-recon/rules, /finance/bank-recon/rules/simulate | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | budget-control | budget-control | /finance/budget-control | src/app/(dashboard)/finance/budget-control/page.tsx | صفحة مستخدم | /finance/budget-control | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | budget-control | budget-control | /finance/budget-control/variance | src/app/(dashboard)/finance/budget-control/variance/page.tsx | صفحة مستخدم | /finance/budget-control | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | budget-planning | budget-planning | /finance/budget-planning | src/app/(dashboard)/finance/budget-planning/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| finance | budget-scenarios | budget-scenarios | /finance/budget-scenarios | src/app/(dashboard)/finance/budget-scenarios/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| finance | cash-flow | cash-flow | /finance/cash-flow/forecast | src/app/(dashboard)/finance/cash-flow/forecast/page.tsx | صفحة مستخدم | /finance/cash-flow/forecast, /finance/cash-flow | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | cash-flow | cash-flow | /finance/cash-flow | src/app/(dashboard)/finance/cash-flow/page.tsx | صفحة مستخدم | /finance/cash-flow/forecast, /finance/cash-flow | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | cfo | cfo | /finance/cfo | src/app/(dashboard)/finance/cfo/page.tsx | صفحة مستخدم | /finance/cfo | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | cfo-ai | cfo-ai | /finance/cfo-ai | src/app/(dashboard)/finance/cfo-ai/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| finance | cfo-dashboard | cfo-dashboard | /finance/cfo-dashboard | src/app/(dashboard)/finance/cfo-dashboard/page.tsx | صفحة مستخدم | /finance/cfo-dashboard | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | consolidation | consolidation | /finance/consolidation/elimination | src/app/(dashboard)/finance/consolidation/elimination/page.tsx | صفحة مستخدم | /finance/consolidation/elimination, /finance/consolidation | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | consolidation | consolidation | /finance/consolidation | src/app/(dashboard)/finance/consolidation/page.tsx | صفحة مستخدم | /finance/consolidation/elimination, /finance/consolidation | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | copa | copa | /finance/copa | src/app/(dashboard)/finance/copa/page.tsx | صفحة مستخدم | /finance/copa | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | copa | copa | /finance/copa/rules | src/app/(dashboard)/finance/copa/rules/page.tsx | صفحة مستخدم | /finance/copa | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | credit-check | credit-check | /finance/credit-check | src/app/(dashboard)/finance/credit-check/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| finance | deferred-tax | deferred-tax | /finance/deferred-tax | src/app/(dashboard)/finance/deferred-tax/page.tsx | صفحة مستخدم | /finance/deferred-tax | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | ecl | ecl | /finance/ecl | src/app/(dashboard)/finance/ecl/page.tsx | صفحة مستخدم | /finance/ecl | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | financial-health | financial-health | /finance/financial-health | src/app/(dashboard)/finance/financial-health/page.tsx | صفحة مستخدم | /finance/financial-health | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | fx-revaluation | fx-revaluation | /finance/fx-revaluation | src/app/(dashboard)/finance/fx-revaluation/page.tsx | صفحة مستخدم | /finance/fx-revaluation | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | impairment | impairment | /finance/impairment | src/app/(dashboard)/finance/impairment/page.tsx | صفحة مستخدم | /finance/impairment | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | payment-run | payment-run | /finance/payment-run | src/app/(dashboard)/finance/payment-run/page.tsx | صفحة مستخدم | /finance/payment-run/propose, /finance/payment-run, /finance/payment-run/[id]/approve | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | period-close | period-close | /finance/period-close | src/app/(dashboard)/finance/period-close/page.tsx | صفحة مستخدم | /finance/period-close, /finance/period-close/[id]/step | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | rebates | rebates | /finance/rebates | src/app/(dashboard)/finance/rebates/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| finance | transfer-pricing | transfer-pricing | /finance/transfer-pricing | src/app/(dashboard)/finance/transfer-pricing/page.tsx | صفحة مستخدم | /finance/transfer-pricing | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | variance | variance | /finance/variance | src/app/(dashboard)/finance/variance/page.tsx | صفحة مستخدم | /finance/variance | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | vat | vat | /finance/vat/categories | src/app/(dashboard)/finance/vat/categories/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| finance | wht | wht | /finance/wht/form14 | src/app/(dashboard)/finance/wht/form14/page.tsx | صفحة مستخدم | /finance/wht | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| finance | wht | wht | /finance/wht | src/app/(dashboard)/finance/wht/page.tsx | صفحة مستخدم | /finance/wht | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| fiscal-periods | main | main | /fiscal-periods | src/app/(dashboard)/fiscal-periods/page.tsx | صفحة مستخدم | /fiscal-periods | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| fixed-assets | main | main | /fixed-assets | src/app/(dashboard)/fixed-assets/page.tsx | صفحة مستخدم | /fixed-assets | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| fleet | fuel | fuel | /fleet/fuel | src/app/(dashboard)/fleet/fuel/page.tsx | صفحة مستخدم | /fleet/fuel | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| fleet | maintenance | maintenance | /fleet/maintenance | src/app/(dashboard)/fleet/maintenance/page.tsx | صفحة مستخدم | /fleet/maintenance | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| fleet | main | main | /fleet | src/app/(dashboard)/fleet/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| fleet | tracking | tracking | /fleet/tracking | src/app/(dashboard)/fleet/tracking/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| fleet | trips | trips | /fleet/trips | src/app/(dashboard)/fleet/trips/page.tsx | صفحة مستخدم | /fleet/trips | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| fng | allocations | allocations | /fng/allocations | src/app/(dashboard)/fng/allocations/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| fng | budgets | budgets | /fng/budgets | src/app/(dashboard)/fng/budgets/page.tsx | صفحة مستخدم | /fng/budgets | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| fng | petty-cash-funds | petty-cash-funds | /fng/petty-cash-funds | src/app/(dashboard)/fng/petty-cash-funds/page.tsx | صفحة مستخدم | /fng/petty-cash-funds | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| fsm | dispatch | dispatch | /fsm/dispatch | src/app/(dashboard)/fsm/dispatch/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| fsm | main | main | /fsm | src/app/(dashboard)/fsm/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| fsm | tasks | tasks | /fsm/tasks | src/app/(dashboard)/fsm/tasks/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| fx | main | main | /fx | src/app/(dashboard)/fx/page.tsx | صفحة مستخدم | /fx | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| gift-cards | main | main | /gift-cards | src/app/(dashboard)/gift-cards/page.tsx | صفحة مستخدم | /gift-cards | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الموارد البشرية | ai-enrollment | ai-enrollment | /hr/ai-enrollment | src/app/(dashboard)/hr/ai-enrollment/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الموارد البشرية | attendance | attendance | /hr/attendance | src/app/(dashboard)/hr/attendance/page.tsx | صفحة مستخدم | /hr/attendance/punch, /hr/attendance | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الموارد البشرية | documents | documents | /hr/documents | src/app/(dashboard)/hr/documents/page.tsx | صفحة مستخدم | /hr/documents/expiry, /hr/documents/expiry/[id] | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الموارد البشرية | eos | eos | /hr/eos | src/app/(dashboard)/hr/eos/page.tsx | صفحة مستخدم | /hr/eos, /hr/eos/[id] | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الموارد البشرية | evaluations | evaluations | /hr/evaluations | src/app/(dashboard)/hr/evaluations/page.tsx | صفحة مستخدم | /hr/evaluations | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الموارد البشرية | expense-reports | expense-reports | /hr/expense-reports | src/app/(dashboard)/hr/expense-reports/page.tsx | صفحة مستخدم | /hr/expense-reports | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الموارد البشرية | gosi | gosi | /hr/gosi | src/app/(dashboard)/hr/gosi/page.tsx | صفحة مستخدم | /hr/gosi/calculate, /hr/gosi/file, /hr/gosi/file/submit | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الموارد البشرية | jobs | jobs | /hr/jobs | src/app/(dashboard)/hr/jobs/page.tsx | صفحة مستخدم | /hr/jobs | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الموارد البشرية | leaves | leaves | /hr/leaves | src/app/(dashboard)/hr/leaves/page.tsx | صفحة مستخدم | /hr/leaves/accrual, /hr/leaves/balance, /hr/leaves | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الموارد البشرية | loans | loans | /hr/loans | src/app/(dashboard)/hr/loans/page.tsx | صفحة مستخدم | /hr/loans | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الموارد البشرية | mudad | mudad | /hr/mudad | src/app/(dashboard)/hr/mudad/page.tsx | صفحة مستخدم | /hr/mudad/compliance, /hr/mudad/wps/submit/[batchId] | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الموارد البشرية | nitaqat-simulator | nitaqat-simulator | /hr/nitaqat-simulator | src/app/(dashboard)/hr/nitaqat-simulator/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الموارد البشرية | org-chart | org-chart | /hr/org-chart | src/app/(dashboard)/hr/org-chart/page.tsx | صفحة مستخدم | /hr/org-chart | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الموارد البشرية | main | main | /hr | src/app/(dashboard)/hr/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الموارد البشرية | payroll | payroll | /hr/payroll/config | src/app/(dashboard)/hr/payroll/config/page.tsx | صفحة مستخدم | /hr/payroll/calculate, /hr/payroll/config, /hr/payroll/generate | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الموارد البشرية | payroll | payroll | /hr/payroll/run | src/app/(dashboard)/hr/payroll/run/page.tsx | صفحة مستخدم | /hr/payroll/calculate, /hr/payroll/config, /hr/payroll/generate | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الموارد البشرية | payroll-process | payroll-process | /hr/payroll-process | src/app/(dashboard)/hr/payroll-process/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الموارد البشرية | payslip | payslip | /hr/payslip/[id] | src/app/(dashboard)/hr/payslip/[id]/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الموارد البشرية | performance | performance | /hr/performance | src/app/(dashboard)/hr/performance/page.tsx | صفحة مستخدم | /hr/performance | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الموارد البشرية | qiwa | qiwa | /hr/qiwa/contracts | src/app/(dashboard)/hr/qiwa/contracts/page.tsx | صفحة مستخدم | /hr/qiwa/contracts, /hr/qiwa | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الموارد البشرية | qiwa | qiwa | /hr/qiwa | src/app/(dashboard)/hr/qiwa/page.tsx | صفحة مستخدم | /hr/qiwa/contracts, /hr/qiwa | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الموارد البشرية | recruitment | recruitment | /hr/recruitment | src/app/(dashboard)/hr/recruitment/page.tsx | صفحة مستخدم | /hr/recruitment | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الموارد البشرية | saudization | saudization | /hr/saudization | src/app/(dashboard)/hr/saudization/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الموارد البشرية | self-service | self-service | /hr/self-service | src/app/(dashboard)/hr/self-service/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الموارد البشرية | succession | succession | /hr/succession | src/app/(dashboard)/hr/succession/page.tsx | صفحة مستخدم | /hr/succession | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الموارد البشرية | timesheet | timesheet | /hr/timesheet | src/app/(dashboard)/hr/timesheet/page.tsx | صفحة مستخدم | /hr/timesheet | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الموارد البشرية | training | training | /hr/training | src/app/(dashboard)/hr/training/page.tsx | صفحة مستخدم | /hr/training | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الموارد البشرية | wps | wps | /hr/wps | src/app/(dashboard)/hr/wps/page.tsx | صفحة مستخدم | /hr/wps | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| installments | main | main | /installments | src/app/(dashboard)/installments/page.tsx | صفحة مستخدم | /installments | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| inv | serials | serials | /inv/serials | src/app/(dashboard)/inv/serials/page.tsx | صفحة مستخدم | /inv/serials | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المخزون | abc-analysis | abc-analysis | /inventory/abc-analysis | src/app/(dashboard)/inventory/abc-analysis/page.tsx | صفحة مستخدم | /inventory/abc-analysis | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المخزون | ai-vision | ai-vision | /inventory/ai-vision | src/app/(dashboard)/inventory/ai-vision/page.tsx | صفحة مستخدم | /inventory/ai-vision | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المخزون | delivery-notes | delivery-notes | /inventory/delivery-notes | src/app/(dashboard)/inventory/delivery-notes/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المخزون | movements | movements | /inventory/movements | src/app/(dashboard)/inventory/movements/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المخزون | main | main | /inventory | src/app/(dashboard)/inventory/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المخزون | picking | picking | /inventory/picking/[id] | src/app/(dashboard)/inventory/picking/[id]/page.tsx | صفحة مستخدم | /inventory/picking/[id]/confirm, /inventory/picking/[id] | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المخزون | quality-control | quality-control | /inventory/quality-control | src/app/(dashboard)/inventory/quality-control/page.tsx | صفحة مستخدم | /inventory/quality-control | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المخزون | reorder-rules | reorder-rules | /inventory/reorder-rules | src/app/(dashboard)/inventory/reorder-rules/page.tsx | صفحة مستخدم | /inventory/reorder-rules | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المخزون | stocktake | stocktake | /inventory/stocktake/cycle | src/app/(dashboard)/inventory/stocktake/cycle/page.tsx | صفحة مستخدم | /inventory/stocktake, /inventory/stocktake/[id]/approve | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المخزون | traceability | traceability | /inventory/traceability | src/app/(dashboard)/inventory/traceability/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المخزون | wms | wms | /inventory/wms | src/app/(dashboard)/inventory/wms/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المخزون | wms | wms | /inventory/wms/putaway | src/app/(dashboard)/inventory/wms/putaway/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المخزون | zones | zones | /inventory/zones | src/app/(dashboard)/inventory/zones/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| knowledge | articles | articles | /knowledge/articles | src/app/(dashboard)/knowledge/articles/page.tsx | صفحة مستخدم | /knowledge/articles | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| learn | main | main | /learn | src/app/(dashboard)/learn/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| lms | courses | courses | /lms/courses | src/app/(dashboard)/lms/courses/page.tsx | صفحة مستخدم | /lms/courses | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| logistics | carriers | carriers | /logistics/carriers | src/app/(dashboard)/logistics/carriers/page.tsx | صفحة مستخدم | /logistics/carriers | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| logistics | freight | freight | /logistics/freight | src/app/(dashboard)/logistics/freight/page.tsx | صفحة مستخدم | /logistics/freight | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| loyalty | main | main | /loyalty | src/app/(dashboard)/loyalty/page.tsx | صفحة مستخدم | /loyalty | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| maintenance | main | main | /maintenance | src/app/(dashboard)/maintenance/page.tsx | صفحة مستخدم | /maintenance | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| maintenance | preventive | preventive | /maintenance/preventive | src/app/(dashboard)/maintenance/preventive/page.tsx | صفحة مستخدم | /maintenance/preventive | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| manufacturing | aps | aps | /manufacturing/aps | src/app/(dashboard)/manufacturing/aps/page.tsx | صفحة مستخدم | /manufacturing/aps | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| manufacturing | blockchain-trace | blockchain-trace | /manufacturing/blockchain-trace | src/app/(dashboard)/manufacturing/blockchain-trace/page.tsx | صفحة مستخدم | /manufacturing/blockchain-trace | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| manufacturing | bom | bom | /manufacturing/bom | src/app/(dashboard)/manufacturing/bom/page.tsx | صفحة مستخدم | /manufacturing/bom | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| manufacturing | boms | boms | /manufacturing/boms | src/app/(dashboard)/manufacturing/boms/page.tsx | صفحة مستخدم | /manufacturing/boms/versions/[versionId]/activate, /manufacturing/boms/[id]/versions | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| manufacturing | boms | boms | /manufacturing/boms/[id]/versions | src/app/(dashboard)/manufacturing/boms/[id]/versions/page.tsx | صفحة مستخدم | /manufacturing/boms/versions/[versionId]/activate, /manufacturing/boms/[id]/versions | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| manufacturing | capa | capa | /manufacturing/capa | src/app/(dashboard)/manufacturing/capa/page.tsx | صفحة مستخدم | /manufacturing/capa | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| manufacturing | capacity | capacity | /manufacturing/capacity | src/app/(dashboard)/manufacturing/capacity/page.tsx | صفحة مستخدم | /manufacturing/capacity | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| manufacturing | digital-twin | digital-twin | /manufacturing/digital-twin | src/app/(dashboard)/manufacturing/digital-twin/page.tsx | صفحة مستخدم | /manufacturing/digital-twin | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| manufacturing | labor-efficiency | labor-efficiency | /manufacturing/labor-efficiency | src/app/(dashboard)/manufacturing/labor-efficiency/page.tsx | صفحة مستخدم | /manufacturing/labor-efficiency | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| manufacturing | lean-kanban | lean-kanban | /manufacturing/lean-kanban | src/app/(dashboard)/manufacturing/lean-kanban/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| manufacturing | mes-oee | mes-oee | /manufacturing/mes-oee | src/app/(dashboard)/manufacturing/mes-oee/page.tsx | صفحة مستخدم | /manufacturing/mes-oee | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| manufacturing | mrp-dashboard | mrp-dashboard | /manufacturing/mrp-dashboard | src/app/(dashboard)/manufacturing/mrp-dashboard/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| manufacturing | mrp-engine | mrp-engine | /manufacturing/mrp-engine | src/app/(dashboard)/manufacturing/mrp-engine/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| manufacturing | oee | oee | /manufacturing/oee | src/app/(dashboard)/manufacturing/oee/page.tsx | صفحة مستخدم | /manufacturing/oee | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| manufacturing | orders | orders | /manufacturing/orders | src/app/(dashboard)/manufacturing/orders/page.tsx | صفحة مستخدم | /manufacturing/orders, /manufacturing/orders/[id], /manufacturing/orders/[id]/schedule | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| manufacturing | main | main | /manufacturing | src/app/(dashboard)/manufacturing/page.tsx | صفحة مستخدم | /manufacturing | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| manufacturing | plm | plm | /manufacturing/plm | src/app/(dashboard)/manufacturing/plm/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| manufacturing | qc | qc | /manufacturing/qc | src/app/(dashboard)/manufacturing/qc/page.tsx | صفحة مستخدم | /manufacturing/qc | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| manufacturing | quality | quality | /manufacturing/quality | src/app/(dashboard)/manufacturing/quality/page.tsx | صفحة مستخدم | /manufacturing/quality | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| manufacturing | routing | routing | /manufacturing/routing | src/app/(dashboard)/manufacturing/routing/page.tsx | صفحة مستخدم | /manufacturing/routing | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| manufacturing | scheduler | scheduler | /manufacturing/scheduler | src/app/(dashboard)/manufacturing/scheduler/page.tsx | صفحة مستخدم | /manufacturing/scheduler | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| manufacturing | scrap | scrap | /manufacturing/scrap | src/app/(dashboard)/manufacturing/scrap/page.tsx | صفحة مستخدم | /manufacturing/scrap | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| manufacturing | standard-cost | standard-cost | /manufacturing/standard-cost | src/app/(dashboard)/manufacturing/standard-cost/page.tsx | صفحة مستخدم | /manufacturing/standard-cost | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| manufacturing | subcontracting | subcontracting | /manufacturing/subcontracting | src/app/(dashboard)/manufacturing/subcontracting/page.tsx | صفحة مستخدم | /manufacturing/subcontracting | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| manufacturing | variance | variance | /manufacturing/variance | src/app/(dashboard)/manufacturing/variance/page.tsx | صفحة مستخدم | /manufacturing/variance | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| manufacturing | work-centers | work-centers | /manufacturing/work-centers | src/app/(dashboard)/manufacturing/work-centers/page.tsx | صفحة مستخدم | /manufacturing/work-centers | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| manufacturing | work-orders | work-orders | /manufacturing/work-orders | src/app/(dashboard)/manufacturing/work-orders/page.tsx | صفحة مستخدم | /manufacturing/work-orders | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| marketing | analytics | analytics | /marketing/analytics | src/app/(dashboard)/marketing/analytics/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| payments | main | main | /payments | src/app/(dashboard)/payments/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| payroll | main | main | /payroll | src/app/(dashboard)/payroll/page.tsx | صفحة مستخدم | /payroll | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| payroll | wps | wps | /payroll/wps | src/app/(dashboard)/payroll/wps/page.tsx | صفحة مستخدم | /payroll/wps/generate, /payroll/wps/history, /payroll/wps | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| pdpl | main | main | /pdpl | src/app/(dashboard)/pdpl/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| pharmacy | drug-interact | drug-interact | /pharmacy/drug-interact | src/app/(dashboard)/pharmacy/drug-interact/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| pharmacy | manager | manager | /pharmacy/manager | src/app/(dashboard)/pharmacy/manager/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| pharmacy | main | main | /pharmacy | src/app/(dashboard)/pharmacy/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| planning | main | main | /planning | src/app/(dashboard)/planning/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| portal | main | main | /portal | src/app/(dashboard)/portal/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| نقاط البيع | accountant | accountant | /pos/accountant | src/app/(dashboard)/pos/accountant/page.tsx | صفحة مستخدم | /pos/accountant | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| نقاط البيع | offline | offline | /pos/offline | src/app/(dashboard)/pos/offline/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| نقاط البيع | main | main | /pos | src/app/(dashboard)/pos/page.tsx | صفحة مستخدم | /pos | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| pos-dashboard | main | main | /pos-dashboard | src/app/(dashboard)/pos-dashboard/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| pos-demo | main | main | /pos-demo | src/app/(dashboard)/pos-demo/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| price-quotes | main | main | /price-quotes | src/app/(dashboard)/price-quotes/page.tsx | صفحة مستخدم | /price-quotes | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| procurement | contracts | contracts | /procurement/contracts | src/app/(dashboard)/procurement/contracts/page.tsx | صفحة مستخدم | /procurement/contracts | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| procurement | price-comparison | price-comparison | /procurement/price-comparison | src/app/(dashboard)/procurement/price-comparison/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| procurement | rfq | rfq | /procurement/rfq/[id] | src/app/(dashboard)/procurement/rfq/[id]/page.tsx | صفحة مستخدم | /procurement/rfq/[id]/award, /procurement/rfq/[id]/comparison, /procurement/rfq/[id]/invite | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| procurement | spend-analytics | spend-analytics | /procurement/spend-analytics | src/app/(dashboard)/procurement/spend-analytics/page.tsx | صفحة مستخدم | /procurement/spend-analytics | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| procurement | supplier-contracts | supplier-contracts | /procurement/supplier-contracts | src/app/(dashboard)/procurement/supplier-contracts/page.tsx | صفحة مستخدم | /procurement/supplier-contracts | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| procurement | vendor-portal | vendor-portal | /procurement/vendor-portal | src/app/(dashboard)/procurement/vendor-portal/page.tsx | صفحة مستخدم | /procurement/vendor-portal | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| procurement | vendor-scorecard | vendor-scorecard | /procurement/vendor-scorecard | src/app/(dashboard)/procurement/vendor-scorecard/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| procurement | vendors | vendors | /procurement/vendors/scorecard | src/app/(dashboard)/procurement/vendors/scorecard/page.tsx | صفحة مستخدم | /procurement/vendors/scorecard | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| products | main | main | /products | src/app/(dashboard)/products/page.tsx | صفحة مستخدم | /products | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| profile | security | security | /profile/security | src/app/(dashboard)/profile/security/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| projects | main | main | /projects | src/app/(dashboard)/projects/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| promotions | main | main | /promotions | src/app/(dashboard)/promotions/page.tsx | صفحة مستخدم | /promotions | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| purchase-orders | main | main | /purchase-orders | src/app/(dashboard)/purchase-orders/page.tsx | صفحة مستخدم | /purchase-orders | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| purchase-orders | [id] | [id] | /purchase-orders/[id]/landed-costs | src/app/(dashboard)/purchase-orders/[id]/landed-costs/page.tsx | صفحة مستخدم | /purchase-orders/[id]/landed-costs, /purchase-orders/[id] | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| purchase-returns | main | main | /purchase-returns | src/app/(dashboard)/purchase-returns/page.tsx | صفحة مستخدم | /purchase-returns | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المشتريات | grn | grn | /purchases/grn | src/app/(dashboard)/purchases/grn/page.tsx | صفحة مستخدم | /purchases/grn | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المشتريات | landed-cost | landed-cost | /purchases/landed-cost/[poId] | src/app/(dashboard)/purchases/landed-cost/[poId]/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المشتريات | letters-of-credit | letters-of-credit | /purchases/letters-of-credit | src/app/(dashboard)/purchases/letters-of-credit/page.tsx | صفحة مستخدم | /purchases/letters-of-credit/landed-costs, /purchases/letters-of-credit, /purchases/letters-of-credit/[id] | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المشتريات | matching | matching | /purchases/matching | src/app/(dashboard)/purchases/matching/page.tsx | صفحة مستخدم | /purchases/matching, /purchases/matching/[id]/resolve | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المشتريات | options | options | /purchases/options | src/app/(dashboard)/purchases/options/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المشتريات | orders | orders | /purchases/orders | src/app/(dashboard)/purchases/orders/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المشتريات | main | main | /purchases | src/app/(dashboard)/purchases/page.tsx | صفحة مستخدم | /purchases | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المشتريات | requisitions | requisitions | /purchases/requisitions | src/app/(dashboard)/purchases/requisitions/page.tsx | صفحة مستخدم | /purchases/requisitions | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المشتريات | rfq | rfq | /purchases/rfq | src/app/(dashboard)/purchases/rfq/page.tsx | صفحة مستخدم | /purchases/rfq | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المشتريات | three-way-match | three-way-match | /purchases/three-way-match | src/app/(dashboard)/purchases/three-way-match/page.tsx | صفحة مستخدم | /purchases/three-way-match | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| quality | inspections | inspections | /quality/inspections | src/app/(dashboard)/quality/inspections/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| quality | ncrs | ncrs | /quality/ncrs | src/app/(dashboard)/quality/ncrs/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| quality | main | main | /quality | src/app/(dashboard)/quality/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| rebates | main | main | /rebates | src/app/(dashboard)/rebates/page.tsx | صفحة مستخدم | /rebates | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| receipt-vouchers | main | main | /receipt-vouchers | src/app/(dashboard)/receipt-vouchers/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| recurring-invoices | main | main | /recurring-invoices | src/app/(dashboard)/recurring-invoices/page.tsx | صفحة مستخدم | /recurring-invoices | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| rem | installments | installments | /rem/installments | src/app/(dashboard)/rem/installments/page.tsx | صفحة مستخدم | /rem/installments | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| rem | leases | leases | /rem/leases | src/app/(dashboard)/rem/leases/page.tsx | صفحة مستخدم | /rem/leases | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| rem | main | main | /rem | src/app/(dashboard)/rem/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| rent | main | main | /rent | src/app/(dashboard)/rent/page.tsx | صفحة مستخدم | /rent | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| rental | agreements | agreements | /rental/agreements | src/app/(dashboard)/rental/agreements/page.tsx | صفحة مستخدم | /rental/agreements | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| التقارير | 104-modules | 104-modules | /reports/104-modules | src/app/(dashboard)/reports/104-modules/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| التقارير | 73-modules | 73-modules | /reports/73-modules | src/app/(dashboard)/reports/73-modules/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| التقارير | aging | aging | /reports/aging | src/app/(dashboard)/reports/aging/page.tsx | صفحة مستخدم | /reports/aging | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| التقارير | allocations | allocations | /reports/allocations | src/app/(dashboard)/reports/allocations/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| التقارير | bi-cube | bi-cube | /reports/bi-cube | src/app/(dashboard)/reports/bi-cube/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| التقارير | budget-variance | budget-variance | /reports/budget-variance | src/app/(dashboard)/reports/budget-variance/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| التقارير | builder | builder | /reports/builder | src/app/(dashboard)/reports/builder/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| التقارير | cashflow | cashflow | /reports/cashflow | src/app/(dashboard)/reports/cashflow/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| التقارير | consolidation | consolidation | /reports/consolidation | src/app/(dashboard)/reports/consolidation/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| التقارير | customer-statement | customer-statement | /reports/customer-statement | src/app/(dashboard)/reports/customer-statement/page.tsx | صفحة مستخدم | /reports/customer-statement | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| التقارير | expiry | expiry | /reports/expiry | src/app/(dashboard)/reports/expiry/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| التقارير | footnotes | footnotes | /reports/footnotes | src/app/(dashboard)/reports/footnotes/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| التقارير | fraud-ai | fraud-ai | /reports/fraud-ai | src/app/(dashboard)/reports/fraud-ai/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| التقارير | kpi-builder | kpi-builder | /reports/kpi-builder | src/app/(dashboard)/reports/kpi-builder/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| التقارير | manual-purchases | manual-purchases | /reports/manual-purchases | src/app/(dashboard)/reports/manual-purchases/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| التقارير | main | main | /reports | src/app/(dashboard)/reports/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| التقارير | pivot | pivot | /reports/pivot | src/app/(dashboard)/reports/pivot/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| التقارير | returns | returns | /reports/returns | src/app/(dashboard)/reports/returns/page.tsx | صفحة مستخدم | /reports/returns | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| التقارير | segments | segments | /reports/segments | src/app/(dashboard)/reports/segments/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| التقارير | zatca-vat | zatca-vat | /reports/zatca-vat | src/app/(dashboard)/reports/zatca-vat/page.tsx | صفحة مستخدم | /reports/zatca-vat | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| restaurant-pos | main | main | /restaurant-pos | src/app/(dashboard)/restaurant-pos/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| restaurant-tables | main | main | /restaurant-tables | src/app/(dashboard)/restaurant-tables/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| salaries | main | main | /salaries | src/app/(dashboard)/salaries/page.tsx | صفحة مستخدم | /salaries | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المبيعات | analytics | analytics | /sales/analytics | src/app/(dashboard)/sales/analytics/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المبيعات | atp-simulator | atp-simulator | /sales/atp-simulator | src/app/(dashboard)/sales/atp-simulator/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المبيعات | cash-application | cash-application | /sales/cash-application | src/app/(dashboard)/sales/cash-application/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المبيعات | commissions | commissions | /sales/commissions | src/app/(dashboard)/sales/commissions/page.tsx | صفحة مستخدم | /sales/commissions/calculate, /sales/commissions, /sales/commissions/rules | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المبيعات | cpq | cpq | /sales/cpq | src/app/(dashboard)/sales/cpq/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المبيعات | debit-notes | debit-notes | /sales/debit-notes | src/app/(dashboard)/sales/debit-notes/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المبيعات | delivery-notes | delivery-notes | /sales/delivery-notes | src/app/(dashboard)/sales/delivery-notes/page.tsx | صفحة مستخدم | /sales/delivery-notes | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المبيعات | forecast | forecast | /sales/forecast | src/app/(dashboard)/sales/forecast/page.tsx | صفحة مستخدم | /sales/forecast | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المبيعات | history | history | /sales/history | src/app/(dashboard)/sales/history/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المبيعات | options | options | /sales/options | src/app/(dashboard)/sales/options/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المبيعات | orders | orders | /sales/orders/create | src/app/(dashboard)/sales/orders/create/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المبيعات | orders | orders | /sales/orders | src/app/(dashboard)/sales/orders/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المبيعات | main | main | /sales | src/app/(dashboard)/sales/page.tsx | صفحة مستخدم | /sales | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المبيعات | pricing | pricing | /sales/pricing | src/app/(dashboard)/sales/pricing/page.tsx | صفحة مستخدم | /sales/pricing/calculate, /sales/pricing | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المبيعات | returns | returns | /sales/returns/rma | src/app/(dashboard)/sales/returns/rma/page.tsx | صفحة مستخدم | /sales/returns, /sales/returns/[id]/[action] | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المبيعات | routes | routes | /sales/routes | src/app/(dashboard)/sales/routes/page.tsx | صفحة مستخدم | /sales/routes | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المبيعات | smart-map | smart-map | /sales/smart-map | src/app/(dashboard)/sales/smart-map/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المبيعات | statements | statements | /sales/statements | src/app/(dashboard)/sales/statements/page.tsx | صفحة مستخدم | /sales/statements/bulk | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المبيعات | targets | targets | /sales/targets | src/app/(dashboard)/sales/targets/page.tsx | صفحة مستخدم | /sales/targets | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| المبيعات | terminal | terminal | /sales/terminal | src/app/(dashboard)/sales/terminal/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| sales-returns | main | main | /sales-returns | src/app/(dashboard)/sales-returns/page.tsx | صفحة مستخدم | /sales-returns | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| school | attendance | attendance | /school/attendance | src/app/(dashboard)/school/attendance/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| school | dashboard | dashboard | /school/dashboard | src/app/(dashboard)/school/dashboard/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| school | exams | exams | /school/exams | src/app/(dashboard)/school/exams/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| school | main | main | /school | src/app/(dashboard)/school/page.tsx | صفحة مستخدم | /school | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| school | schedule | schedule | /school/schedule | src/app/(dashboard)/school/schedule/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| school | stages | stages | /school/stages | src/app/(dashboard)/school/stages/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| school | transport | transport | /school/transport | src/app/(dashboard)/school/transport/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| scm | main | main | /scm | src/app/(dashboard)/scm/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإعدادات | approvals | approvals | /settings/approvals | src/app/(dashboard)/settings/approvals/page.tsx | صفحة مستخدم | /settings/approvals, /settings/approvals/[id] | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الإعدادات | bpm | bpm | /settings/bpm | src/app/(dashboard)/settings/bpm/page.tsx | صفحة مستخدم | /settings/bpm | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الإعدادات | company | company | /settings/company | src/app/(dashboard)/settings/company/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإعدادات | currencies | currencies | /settings/currencies | src/app/(dashboard)/settings/currencies/page.tsx | صفحة مستخدم | /settings/currencies, /settings/currencies/[id] | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الإعدادات | custom-fields | custom-fields | /settings/custom-fields | src/app/(dashboard)/settings/custom-fields/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإعدادات | dashboard-builder | dashboard-builder | /settings/dashboard-builder | src/app/(dashboard)/settings/dashboard-builder/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإعدادات | import-export | import-export | /settings/import-export | src/app/(dashboard)/settings/import-export/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإعدادات | number-sequences | number-sequences | /settings/number-sequences | src/app/(dashboard)/settings/number-sequences/page.tsx | صفحة مستخدم | /settings/number-sequences | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الإعدادات | numbering | numbering | /settings/numbering | src/app/(dashboard)/settings/numbering/page.tsx | صفحة مستخدم | /settings/numbering | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الإعدادات | main | main | /settings | src/app/(dashboard)/settings/page.tsx | صفحة مستخدم | /settings | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الإعدادات | permissions | permissions | /settings/permissions/fields | src/app/(dashboard)/settings/permissions/fields/page.tsx | صفحة مستخدم | /settings/permissions/fields | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الإعدادات | print-templates | print-templates | /settings/print-templates | src/app/(dashboard)/settings/print-templates/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإعدادات | roles | roles | /settings/roles | src/app/(dashboard)/settings/roles/page.tsx | صفحة مستخدم | /settings/roles | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الإعدادات | security | security | /settings/security | src/app/(dashboard)/settings/security/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإعدادات | sso | sso | /settings/sso | src/app/(dashboard)/settings/sso/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإعدادات | state-machine | state-machine | /settings/state-machine | src/app/(dashboard)/settings/state-machine/page.tsx | صفحة مستخدم | /settings/state-machine | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الإعدادات | webhooks | webhooks | /settings/webhooks | src/app/(dashboard)/settings/webhooks/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإعدادات | whatsapp | whatsapp | /settings/whatsapp | src/app/(dashboard)/settings/whatsapp/page.tsx | صفحة مستخدم | /settings/whatsapp | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| الإعدادات | workflow-builder | workflow-builder | /settings/workflow-builder | src/app/(dashboard)/settings/workflow-builder/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| الإعدادات | zatca | zatca | /settings/zatca | src/app/(dashboard)/settings/zatca/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| shifts | monitor | monitor | /shifts/monitor | src/app/(dashboard)/shifts/monitor/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| shifts | main | main | /shifts | src/app/(dashboard)/shifts/page.tsx | صفحة مستخدم | /shifts | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| shipping | main | main | /shipping | src/app/(dashboard)/shipping/page.tsx | صفحة مستخدم | /shipping | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| shl | classes | classes | /shl/classes | src/app/(dashboard)/shl/classes/page.tsx | صفحة مستخدم | /shl/classes | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| shl | students | students | /shl/students | src/app/(dashboard)/shl/students/page.tsx | صفحة مستخدم | /shl/students | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| shopfloor | main | main | /shopfloor | src/app/(dashboard)/shopfloor/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| smart-transfers | main | main | /smart-transfers | src/app/(dashboard)/smart-transfers/page.tsx | صفحة مستخدم | /smart-transfers | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| stock | adjustments | adjustments | /stock/adjustments | src/app/(dashboard)/stock/adjustments/page.tsx | صفحة مستخدم | /stock/adjustments | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| stock | movements | movements | /stock/movements | src/app/(dashboard)/stock/movements/page.tsx | صفحة مستخدم | /stock/movements | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| stock | main | main | /stock | src/app/(dashboard)/stock/page.tsx | صفحة مستخدم | /stock | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| stock-transfers | main | main | /stock-transfers | src/app/(dashboard)/stock-transfers/page.tsx | صفحة مستخدم | /stock-transfers | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| stocktake | main | main | /stocktake | src/app/(dashboard)/stocktake/page.tsx | صفحة مستخدم | /stocktake | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| stocktake | vision | vision | /stocktake/vision | src/app/(dashboard)/stocktake/vision/page.tsx | صفحة مستخدم | /stocktake/vision | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| subscriptions | main | main | /subscriptions | src/app/(dashboard)/subscriptions/page.tsx | صفحة مستخدم | /subscriptions | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| subscriptions | plans | plans | /subscriptions/plans | src/app/(dashboard)/subscriptions/plans/page.tsx | صفحة مستخدم | /subscriptions/plans | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| supply-chain | rfx-auction | rfx-auction | /supply-chain/rfx-auction | src/app/(dashboard)/supply-chain/rfx-auction/page.tsx | صفحة مستخدم | /supply-chain/rfx-auction | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| supply-chain | vendor-onboarding | vendor-onboarding | /supply-chain/vendor-onboarding | src/app/(dashboard)/supply-chain/vendor-onboarding/page.tsx | صفحة مستخدم | /supply-chain/vendor-onboarding | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| support | help-desk | help-desk | /support/help-desk | src/app/(dashboard)/support/help-desk/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| support | sla | sla | /support/sla | src/app/(dashboard)/support/sla/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| sys | alerts | alerts | /sys/alerts | src/app/(dashboard)/sys/alerts/page.tsx | صفحة مستخدم | /sys/alerts | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| sys | health | health | /sys/health | src/app/(dashboard)/sys/health/page.tsx | صفحة مستخدم | /sys/health | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| tax | main | main | /tax | src/app/(dashboard)/tax/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| tax | vat-returns | vat-returns | /tax/vat-returns | src/app/(dashboard)/tax/vat-returns/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| tax | wht | wht | /tax/wht | src/app/(dashboard)/tax/wht/page.tsx | صفحة مستخدم | /tax/wht | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| tax | zakat | zakat | /tax/zakat | src/app/(dashboard)/tax/zakat/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| tax | zatca-onboard | zatca-onboard | /tax/zatca-onboard | src/app/(dashboard)/tax/zatca-onboard/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| treasury | bank-recon | bank-recon | /treasury/bank-recon | src/app/(dashboard)/treasury/bank-recon/page.tsx | صفحة مستخدم | /treasury/bank-recon | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| treasury | bank-reconciliation | bank-reconciliation | /treasury/bank-reconciliation | src/app/(dashboard)/treasury/bank-reconciliation/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| treasury | cash-flow | cash-flow | /treasury/cash-flow | src/app/(dashboard)/treasury/cash-flow/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| treasury | cash-forecast | cash-forecast | /treasury/cash-forecast | src/app/(dashboard)/treasury/cash-forecast/page.tsx | صفحة مستخدم | /treasury/cash-forecast | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| treasury | cash-position | cash-position | /treasury/cash-position | src/app/(dashboard)/treasury/cash-position/page.tsx | صفحة مستخدم | /treasury/cash-position, /treasury/cash-position/snapshot | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| treasury | checks | checks | /treasury/checks | src/app/(dashboard)/treasury/checks/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| treasury | liquidity | liquidity | /treasury/liquidity | src/app/(dashboard)/treasury/liquidity/page.tsx | صفحة مستخدم | /treasury/liquidity/forecast/generate, /treasury/liquidity/forecast | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| treasury | main | main | /treasury | src/app/(dashboard)/treasury/page.tsx | صفحة مستخدم | /treasury | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| treasury | petty-cash | petty-cash | /treasury/petty-cash | src/app/(dashboard)/treasury/petty-cash/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| v3 | clinic | clinic | /v3/clinic/appointments | src/app/(dashboard)/v3/clinic/appointments/page.tsx | صفحة مستخدم | /v3/clinic/appointments, /v3/clinic/emr, /v3/clinic/erx | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | clinic | clinic | /v3/clinic/emr | src/app/(dashboard)/v3/clinic/emr/page.tsx | صفحة مستخدم | /v3/clinic/appointments, /v3/clinic/emr, /v3/clinic/erx | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | clinic | clinic | /v3/clinic/erx | src/app/(dashboard)/v3/clinic/erx/page.tsx | صفحة مستخدم | /v3/clinic/appointments, /v3/clinic/emr, /v3/clinic/erx | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | clinic | clinic | /v3/clinic/lab | src/app/(dashboard)/v3/clinic/lab/page.tsx | صفحة مستخدم | /v3/clinic/appointments, /v3/clinic/emr, /v3/clinic/erx | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | clinic | clinic | /v3/clinic | src/app/(dashboard)/v3/clinic/page.tsx | صفحة مستخدم | /v3/clinic/appointments, /v3/clinic/emr, /v3/clinic/erx | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | construction | construction | /v3/construction/boq | src/app/(dashboard)/v3/construction/boq/page.tsx | صفحة مستخدم | /v3/construction/boq, /v3/construction/progress-billing, /v3/construction/variations | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | construction | construction | /v3/construction | src/app/(dashboard)/v3/construction/page.tsx | صفحة مستخدم | /v3/construction/boq, /v3/construction/progress-billing, /v3/construction/variations | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | construction | construction | /v3/construction/progress-billing | src/app/(dashboard)/v3/construction/progress-billing/page.tsx | صفحة مستخدم | /v3/construction/boq, /v3/construction/progress-billing, /v3/construction/variations | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | construction | construction | /v3/construction/variations | src/app/(dashboard)/v3/construction/variations/page.tsx | صفحة مستخدم | /v3/construction/boq, /v3/construction/progress-billing, /v3/construction/variations | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | distribution | distribution | /v3/distribution | src/app/(dashboard)/v3/distribution/page.tsx | صفحة مستخدم | /v3/distribution/picking/wave, /v3/distribution/routes, /v3/distribution/wms | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | distribution | distribution | /v3/distribution/picking/wave | src/app/(dashboard)/v3/distribution/picking/wave/page.tsx | صفحة مستخدم | /v3/distribution/picking/wave, /v3/distribution/routes, /v3/distribution/wms | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | distribution | distribution | /v3/distribution/routes | src/app/(dashboard)/v3/distribution/routes/page.tsx | صفحة مستخدم | /v3/distribution/picking/wave, /v3/distribution/routes, /v3/distribution/wms | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | distribution | distribution | /v3/distribution/wms | src/app/(dashboard)/v3/distribution/wms/page.tsx | صفحة مستخدم | /v3/distribution/picking/wave, /v3/distribution/routes, /v3/distribution/wms | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | manufacturing | manufacturing | /v3/manufacturing/mrp | src/app/(dashboard)/v3/manufacturing/mrp/page.tsx | صفحة مستخدم | /v3/manufacturing/mrp, /v3/manufacturing/shopfloor | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | manufacturing | manufacturing | /v3/manufacturing | src/app/(dashboard)/v3/manufacturing/page.tsx | صفحة مستخدم | /v3/manufacturing/mrp, /v3/manufacturing/shopfloor | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | manufacturing | manufacturing | /v3/manufacturing/shopfloor | src/app/(dashboard)/v3/manufacturing/shopfloor/page.tsx | صفحة مستخدم | /v3/manufacturing/mrp, /v3/manufacturing/shopfloor | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | master | master | /v3/master | src/app/(dashboard)/v3/master/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| v3 | realestate | realestate | /v3/realestate/cam | src/app/(dashboard)/v3/realestate/cam/page.tsx | صفحة مستخدم | /v3/realestate/leases | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | realestate | realestate | /v3/realestate/leases | src/app/(dashboard)/v3/realestate/leases/page.tsx | صفحة مستخدم | /v3/realestate/leases | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | realestate | realestate | /v3/realestate | src/app/(dashboard)/v3/realestate/page.tsx | صفحة مستخدم | /v3/realestate/leases | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | restaurant | restaurant | /v3/restaurant/kds | src/app/(dashboard)/v3/restaurant/kds/page.tsx | صفحة مستخدم | /v3/restaurant/kds | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | restaurant | restaurant | /v3/restaurant | src/app/(dashboard)/v3/restaurant/page.tsx | صفحة مستخدم | /v3/restaurant/kds | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | restaurant | restaurant | /v3/restaurant/tables | src/app/(dashboard)/v3/restaurant/tables/page.tsx | صفحة مستخدم | /v3/restaurant/kds | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | retail | retail | /v3/retail/loyalty | src/app/(dashboard)/v3/retail/loyalty/page.tsx | صفحة مستخدم | /v3/retail/pos | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | retail | retail | /v3/retail | src/app/(dashboard)/v3/retail/page.tsx | صفحة مستخدم | /v3/retail/pos | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | retail | retail | /v3/retail/pos | src/app/(dashboard)/v3/retail/pos/page.tsx | صفحة مستخدم | /v3/retail/pos | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | school | school | /v3/school/gradebook | src/app/(dashboard)/v3/school/gradebook/page.tsx | صفحة مستخدم | /v3/school/sis | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | school | school | /v3/school | src/app/(dashboard)/v3/school/page.tsx | صفحة مستخدم | /v3/school/sis | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | school | school | /v3/school/sis | src/app/(dashboard)/v3/school/sis/page.tsx | صفحة مستخدم | /v3/school/sis | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | school | school | /v3/school/transcripts | src/app/(dashboard)/v3/school/transcripts/page.tsx | صفحة مستخدم | /v3/school/sis | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | services | services | /v3/services | src/app/(dashboard)/v3/services/page.tsx | صفحة مستخدم | /v3/services/timesheet | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | services | services | /v3/services/sla | src/app/(dashboard)/v3/services/sla/page.tsx | صفحة مستخدم | /v3/services/timesheet | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | services | services | /v3/services/timesheet | src/app/(dashboard)/v3/services/timesheet/page.tsx | صفحة مستخدم | /v3/services/timesheet | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| v3 | services | services | /v3/services/workorders | src/app/(dashboard)/v3/services/workorders/page.tsx | صفحة مستخدم | /v3/services/timesheet | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| vacations | main | main | /vacations | src/app/(dashboard)/vacations/page.tsx | صفحة مستخدم | /vacations | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| vat | main | main | /vat | src/app/(dashboard)/vat/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| vendor-portal | main | main | /vendor-portal | src/app/(dashboard)/vendor-portal/page.tsx | صفحة مستخدم | /vendor-portal | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| vendor-ratings | main | main | /vendor-ratings | src/app/(dashboard)/vendor-ratings/page.tsx | صفحة مستخدم | /vendor-ratings | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| warehouses | alerts | alerts | /warehouses/alerts | src/app/(dashboard)/warehouses/alerts/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| warehouses | fifo | fifo | /warehouses/fifo | src/app/(dashboard)/warehouses/fifo/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| warehouses | map | map | /warehouses/map | src/app/(dashboard)/warehouses/map/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| warehouses | options | options | /warehouses/options | src/app/(dashboard)/warehouses/options/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| warehouses | main | main | /warehouses | src/app/(dashboard)/warehouses/page.tsx | صفحة مستخدم | /warehouses | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| warranty | main | main | /warranty | src/app/(dashboard)/warranty/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| whatsapp-hub | main | main | /whatsapp-hub | src/app/(dashboard)/whatsapp-hub/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| wht | main | main | /wht | src/app/(dashboard)/wht/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| wms | waves | waves | /wms/waves | src/app/(dashboard)/wms/waves/page.tsx | صفحة مستخدم | /wms/waves | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| zakat | main | main | /zakat | src/app/(dashboard)/zakat/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| ZATCA | main | main | /zatca | src/app/(dashboard)/zatca/page.tsx | صفحة مستخدم | /zatca | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| _ice_archive | main | main | /_ice_archive | src/app/(dashboard)/_ice_archive/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| المصادقة | routing | routing | /auth/routing | src/app/(dashboard)/auth/routing/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| b2b | login | login | /b2b/login | src/app/(dashboard)/b2b/login/page.tsx | صفحة مستخدم | /b2b/login | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| b2b | shop | shop | /b2b/shop | src/app/(dashboard)/b2b/shop/page.tsx | صفحة مستخدم | /b2b/shop | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| customer | table | table | /customer/table/[qrToken] | src/app/(dashboard)/customer/table/[qrToken]/page.tsx | صفحة مستخدم | /customer/table/[qrToken] | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| ice | tenants | tenants | /ice/tenants | src/app/(dashboard)/ice/tenants/page.tsx | صفحة مستخدم | /ice/tenants | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| ice | admins | admins | /ice/admins | src/app/(dashboard)/ice/admins/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| ice | audit | audit | /ice/audit | src/app/(dashboard)/ice/audit/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| ice | billing | billing | /ice/billing | src/app/(dashboard)/ice/billing/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| ice | health | health | /ice/health | src/app/(dashboard)/ice/health/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| ice | licenses | licenses | /ice/licenses | src/app/(dashboard)/ice/licenses/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| ice | login | login | /ice/login/2fa | src/app/(dashboard)/ice/login/2fa/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| ice | login | login | /ice/login | src/app/(dashboard)/ice/login/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| ice | modules | modules | /ice/modules | src/app/(dashboard)/ice/modules/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| ice | main | main | /ice | src/app/(dashboard)/ice/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| ice | settings | settings | /ice/settings | src/app/(dashboard)/ice/settings/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| ice | support | support | /ice/support | src/app/(dashboard)/ice/support/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| master | main | main | /master | src/app/(dashboard)/master/page.tsx | صفحة مستخدم | /master | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| master-panel | login | login | /master-panel/login | src/app/(dashboard)/master-panel/login/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| master-panel | main | main | /master-panel | src/app/(dashboard)/master-panel/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| portals | parent | parent | /portals/parent | src/app/(dashboard)/portals/parent/page.tsx | صفحة مستخدم | /portals/parent | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| portals | tenant | tenant | /portals/tenant | src/app/(dashboard)/portals/tenant/page.tsx | صفحة مستخدم | /portals/tenant | نعم | User/Accountant | نعم | مكتمل | لا يوجد |
| restaurant | main | main | /restaurant | src/app/(dashboard)/restaurant/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| api-docs | main | main | /api-docs | src/app/(dashboard)/api-docs/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| auto-login | main | main | /auto-login | src/app/(dashboard)/auto-login/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| billing-expired | main | main | /billing-expired | src/app/(dashboard)/billing-expired/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| company-info | main | main | /company-info | src/app/(dashboard)/company-info/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| company-setup | main | main | /company-setup | src/app/company-setup/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| design1 | main | main | /design1 | src/app/(dashboard)/design1/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| design2 | main | main | /design2 | src/app/(dashboard)/design2/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| design3 | main | main | /design3 | src/app/(dashboard)/design3/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| design4 | main | main | /design4 | src/app/(dashboard)/design4/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| factory | main | main | /factory | src/app/(dashboard)/factory/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| features | main | main | /features | src/app/(dashboard)/features/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| invoice | [id] | [id] | /invoice/[id] | src/app/(dashboard)/invoice/[id]/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| kiosk | attendance | attendance | /kiosk/attendance | src/app/(dashboard)/kiosk/attendance/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| login | main | main | /login | src/app/login/page.tsx | صفحة مستخدم | None | لا | جميع الأدوار | لا | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| menu | [tableId] | [tableId] | /menu/[tableId] | src/app/(dashboard)/menu/[tableId]/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| home | main | main | / | src/app/(dashboard)//page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| pricing | main | main | /pricing | src/app/(dashboard)/pricing/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| qr-menu | [token] | [token] | /qr-menu/[token] | src/app/(dashboard)/qr-menu/[token]/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| retail | main | main | /retail | src/app/(dashboard)/retail/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| sentry-example-page | main | main | /sentry-example-page | src/app/(dashboard)/sentry-example-page/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| shop | main | main | /shop | src/app/(dashboard)/shop/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| sign-in | [[...sign-in]] | [[...sign-in]] | /sign-in/[[...sign-in]] | src/app/(dashboard)/sign-in/[[...sign-in]]/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| sign-up | [[...sign-up]] | [[...sign-up]] | /sign-up/[[...sign-up]] | src/app/(dashboard)/sign-up/[[...sign-up]]/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| sso-callback | main | main | /sso-callback | src/app/(dashboard)/sso-callback/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| test-i18n | main | main | /test-i18n | src/app/(dashboard)/test-i18n/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| trust | main | main | /trust | src/app/(dashboard)/trust/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
| ~offline | main | main | /~offline | src/app/(dashboard)/~offline/page.tsx | صفحة مستخدم | None | نعم | User/Accountant | نعم | UI only (يحتاج ربط API) | ربط الواجهات الخلفية (APIs) |
