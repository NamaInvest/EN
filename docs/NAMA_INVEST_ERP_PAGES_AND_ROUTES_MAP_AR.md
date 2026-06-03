# جدول صفحات ومسارات Nama Invest ERP


> [!WARNING]
> هذه الوثيقة مبنية على فحص ديناميكي لمسارات المشروع، وقد تشمل أقسامًا مكتملة وأقسامًا جزئية وأقسامًا خلفية أو معطلة. الغرض منها جرد شامل وسيناريوهات تشغيلية، وليست تأكيدًا بأن كل قسم جاهز تجاريًا أو إنتاجيًا.

| القسم الرئيسي | القسم الفرعي | نوع العنصر | المسار | الحالة | وصف مختصر |
| ------------- | ------------ | ---------- | ------ | ------ | --------- |
| المحاسبة | aging-report | UI Page | /accounting/aging-report | UI only (يحتاج ربط API) | صفحة مستخدم |
| المحاسبة | allocations | UI Page | /accounting/allocations/rules | مكتمل | صفحة مستخدم |
| المحاسبة | allocations | API Route | /accounting/allocations | مكتمل | نقطة نهاية برمجية |
| المحاسبة | allocations | API Route | /accounting/allocations/run | مكتمل | نقطة نهاية برمجية |
| المحاسبة | allocations | API Route | /accounting/allocations/simulate | مكتمل | نقطة نهاية برمجية |
| المحاسبة | bank-reconciliation | UI Page | /accounting/bank-reconciliation | UI only (يحتاج ربط API) | صفحة مستخدم |
| المحاسبة | banks | UI Page | /accounting/banks/imports | مكتمل | صفحة مستخدم |
| المحاسبة | banks | UI Page | /accounting/banks | مكتمل | صفحة مستخدم |
| المحاسبة | banks | UI Page | /accounting/banks/recon | مكتمل | صفحة مستخدم |
| المحاسبة | banks | UI Page | /accounting/banks/[id] | مكتمل | صفحة مستخدم |
| المحاسبة | banks | API Route | /accounting/banks/imports | مكتمل | نقطة نهاية برمجية |
| المحاسبة | banks | API Route | /accounting/banks/recon/create-je | مكتمل | نقطة نهاية برمجية |
| المحاسبة | banks | API Route | /accounting/banks/recon/match | مكتمل | نقطة نهاية برمجية |
| المحاسبة | collection-workflow | UI Page | /accounting/collection-workflow | مكتمل | صفحة مستخدم |
| المحاسبة | collection-workflow | API Route | /accounting/collection-workflow | مكتمل | نقطة نهاية برمجية |
| المحاسبة | customer-statements | UI Page | /accounting/customer-statements/bulk | مكتمل | صفحة مستخدم |
| المحاسبة | customer-statements | UI Page | /accounting/customer-statements | مكتمل | صفحة مستخدم |
| المحاسبة | customer-statements | UI Page | /accounting/customer-statements/templates | مكتمل | صفحة مستخدم |
| المحاسبة | customer-statements | API Route | /accounting/customer-statements/bulk/history | مكتمل | نقطة نهاية برمجية |
| المحاسبة | customer-statements | API Route | /accounting/customer-statements/bulk/preview | مكتمل | نقطة نهاية برمجية |
| المحاسبة | customer-statements | API Route | /accounting/customer-statements/bulk/run | مكتمل | نقطة نهاية برمجية |
| المحاسبة | customer-statements | API Route | /accounting/customer-statements/generate-pdf | مكتمل | نقطة نهاية برمجية |
| المحاسبة | customer-statements | API Route | /accounting/customer-statements/preview | مكتمل | نقطة نهاية برمجية |
| المحاسبة | customer-statements | API Route | /accounting/customer-statements/send-email | مكتمل | نقطة نهاية برمجية |
| المحاسبة | customer-statements | API Route | /accounting/customer-statements/templates | مكتمل | نقطة نهاية برمجية |
| المحاسبة | customer-statements | API Route | /accounting/customer-statements/templates/[id] | مكتمل | نقطة نهاية برمجية |
| المحاسبة | deferred | UI Page | /accounting/deferred | مكتمل | صفحة مستخدم |
| المحاسبة | deferred | API Route | /accounting/deferred | مكتمل | نقطة نهاية برمجية |
| المحاسبة | dunning | UI Page | /accounting/dunning/letters | مكتمل | صفحة مستخدم |
| المحاسبة | dunning | UI Page | /accounting/dunning | مكتمل | صفحة مستخدم |
| المحاسبة | dunning | UI Page | /accounting/dunning/promises | مكتمل | صفحة مستخدم |
| المحاسبة | dunning | API Route | /accounting/dunning/daily-run | مكتمل | نقطة نهاية برمجية |
| المحاسبة | dunning | API Route | /accounting/dunning/promise-to-pay | مكتمل | نقطة نهاية برمجية |
| المحاسبة | financial-close | UI Page | /accounting/financial-close | مكتمل | صفحة مستخدم |
| المحاسبة | financial-close | API Route | /accounting/financial-close | مكتمل | نقطة نهاية برمجية |
| المحاسبة | fixed-assets | UI Page | /accounting/fixed-assets | مكتمل | صفحة مستخدم |
| المحاسبة | fixed-assets | API Route | /accounting/fixed-assets/depreciate | مكتمل | نقطة نهاية برمجية |
| المحاسبة | fixed-assets | API Route | /accounting/fixed-assets | مكتمل | نقطة نهاية برمجية |
| المحاسبة | inter-company | UI Page | /accounting/inter-company | مكتمل | صفحة مستخدم |
| المحاسبة | inter-company | API Route | /accounting/inter-company | مكتمل | نقطة نهاية برمجية |
| المحاسبة | journal | UI Page | /accounting/journal/new | مكتمل | صفحة مستخدم |
| المحاسبة | journal | UI Page | /accounting/journal | مكتمل | صفحة مستخدم |
| المحاسبة | journal | API Route | /accounting/journal | مكتمل | نقطة نهاية برمجية |
| المحاسبة | journal | API Route | /accounting/journal/[id] | مكتمل | نقطة نهاية برمجية |
| المحاسبة | lc | UI Page | /accounting/lc | مكتمل | صفحة مستخدم |
| المحاسبة | lc | API Route | /accounting/lc | مكتمل | نقطة نهاية برمجية |
| المحاسبة | leases | UI Page | /accounting/leases | مكتمل | صفحة مستخدم |
| المحاسبة | leases | API Route | /accounting/leases/amortize | مكتمل | نقطة نهاية برمجية |
| المحاسبة | leases | API Route | /accounting/leases | مكتمل | نقطة نهاية برمجية |
| المحاسبة | multi-book | UI Page | /accounting/multi-book | مكتمل | صفحة مستخدم |
| المحاسبة | multi-book | API Route | /accounting/multi-book/adjustments | مكتمل | نقطة نهاية برمجية |
| المحاسبة | open-items | UI Page | /accounting/open-items | مكتمل | صفحة مستخدم |
| المحاسبة | open-items | API Route | /accounting/open-items/apply-payment | مكتمل | نقطة نهاية برمجية |
| المحاسبة | open-items | API Route | /accounting/open-items/auto-clear | مكتمل | نقطة نهاية برمجية |
| المحاسبة | open-items | API Route | /accounting/open-items/disputes | مكتمل | نقطة نهاية برمجية |
| المحاسبة | open-items | API Route | /accounting/open-items/promise-to-pay | مكتمل | نقطة نهاية برمجية |
| المحاسبة | open-items | API Route | /accounting/open-items | مكتمل | نقطة نهاية برمجية |
| المحاسبة | main | UI Page | /accounting | UI only (يحتاج ربط API) | صفحة مستخدم |
| المحاسبة | main | Service/Engine | allocation.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| المحاسبة | main | Service/Engine | consolidation.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| المحاسبة | main | Service/Engine | financial-period.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| المحاسبة | main | Service/Engine | fx-revaluation.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| المحاسبة | main | Service/Engine | journal.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| المحاسبة | main | Service/Engine | lease-accounting.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| المحاسبة | main | Service/Engine | period-close.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| المحاسبة | main | Service/Engine | recurring-je.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| المحاسبة | main | Service/Engine | recurring-journal.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| المحاسبة | main | Service/Engine | revenue-recognition.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| المحاسبة | payment-runs | UI Page | /accounting/payment-runs/create | مكتمل | صفحة مستخدم |
| المحاسبة | payment-runs | UI Page | /accounting/payment-runs | مكتمل | صفحة مستخدم |
| المحاسبة | payment-runs | API Route | /accounting/payment-runs/propose | مكتمل | نقطة نهاية برمجية |
| المحاسبة | payment-runs | API Route | /accounting/payment-runs/[id]/approve | مكتمل | نقطة نهاية برمجية |
| المحاسبة | payment-runs | API Route | /accounting/payment-runs/[id]/generate-files | مكتمل | نقطة نهاية برمجية |
| المحاسبة | payment-runs | API Route | /accounting/payment-runs/[id]/post-journal | مكتمل | نقطة نهاية برمجية |
| المحاسبة | payment-runs | API Route | /accounting/payment-runs/[id]/submit-for-approval | مكتمل | نقطة نهاية برمجية |
| المحاسبة | payment-runs | API Route | /accounting/payment-runs/[id]/upload-confirmation | مكتمل | نقطة نهاية برمجية |
| المحاسبة | period-close | UI Page | /accounting/period-close | مكتمل | صفحة مستخدم |
| المحاسبة | period-close | API Route | /accounting/period-close | مكتمل | نقطة نهاية برمجية |
| المحاسبة | period-lock | UI Page | /accounting/period-lock | مكتمل | صفحة مستخدم |
| المحاسبة | period-lock | API Route | /accounting/period-lock | مكتمل | نقطة نهاية برمجية |
| المحاسبة | prepayments | UI Page | /accounting/prepayments | مكتمل | صفحة مستخدم |
| المحاسبة | prepayments | API Route | /accounting/prepayments | مكتمل | نقطة نهاية برمجية |
| المحاسبة | profit-centers | UI Page | /accounting/profit-centers | مكتمل | صفحة مستخدم |
| المحاسبة | profit-centers | API Route | /accounting/profit-centers | مكتمل | نقطة نهاية برمجية |
| المحاسبة | profit-loss | UI Page | /accounting/profit-loss | مكتمل | صفحة مستخدم |
| المحاسبة | profit-loss | API Route | /accounting/profit-loss | مكتمل | نقطة نهاية برمجية |
| المحاسبة | revenue-recognition | UI Page | /accounting/revenue-recognition | مكتمل | صفحة مستخدم |
| المحاسبة | revenue-recognition | API Route | /accounting/revenue-recognition/amortize | مكتمل | نقطة نهاية برمجية |
| المحاسبة | revenue-recognition | API Route | /accounting/revenue-recognition | مكتمل | نقطة نهاية برمجية |
| المحاسبة | segments | UI Page | /accounting/segments | مكتمل | صفحة مستخدم |
| المحاسبة | segments | API Route | /accounting/segments | مكتمل | نقطة نهاية برمجية |
| المحاسبة | trial-balance | UI Page | /accounting/trial-balance | مكتمل | صفحة مستخدم |
| المحاسبة | trial-balance | API Route | /accounting/trial-balance | مكتمل | نقطة نهاية برمجية |
| المحاسبة | vat-return | UI Page | /accounting/vat-return | مكتمل | صفحة مستخدم |
| المحاسبة | vat-return | API Route | /accounting/vat-return | مكتمل | نقطة نهاية برمجية |
| المحاسبة | vendor-statements | UI Page | /accounting/vendor-statements/bulk | UI only (يحتاج ربط API) | صفحة مستخدم |
| المحاسبة | vendor-statements | UI Page | /accounting/vendor-statements | UI only (يحتاج ربط API) | صفحة مستخدم |
| المحاسبة | year-end-close | UI Page | /accounting/year-end-close | مكتمل | صفحة مستخدم |
| المحاسبة | year-end-close | API Route | /accounting/year-end-close/close-period | مكتمل | نقطة نهاية برمجية |
| المحاسبة | year-end-close | API Route | /accounting/year-end-close | مكتمل | نقطة نهاية برمجية |
| المحاسبة | consolidation | UI Page | /accounting/consolidation | مكتمل | صفحة مستخدم |
| المحاسبة | consolidation | API Route | /accounting/consolidation/commit | مكتمل | نقطة نهاية برمجية |
| المحاسبة | consolidation | API Route | /accounting/consolidation/eliminations/dry-run | مكتمل | نقطة نهاية برمجية |
| المحاسبة | consolidation | API Route | /accounting/consolidation/eliminations/requests | مكتمل | نقطة نهاية برمجية |
| المحاسبة | consolidation | API Route | /accounting/consolidation/eliminations/requests/[id]/approve | مكتمل | نقطة نهاية برمجية |
| المحاسبة | consolidation | API Route | /accounting/consolidation/eliminations/requests/[id]/post | مكتمل | نقطة نهاية برمجية |
| المحاسبة | consolidation | API Route | /accounting/consolidation/eliminations/requests/[id]/posting-preview | مكتمل | نقطة نهاية برمجية |
| المحاسبة | consolidation | API Route | /accounting/consolidation/eliminations/requests/[id]/reject | مكتمل | نقطة نهاية برمجية |
| المحاسبة | consolidation | API Route | /accounting/consolidation/eliminations/requests/[id]/reverse | مكتمل | نقطة نهاية برمجية |
| المحاسبة | consolidation | API Route | /accounting/consolidation/preview | مكتمل | نقطة نهاية برمجية |
| المحاسبة | consolidation | API Route | /accounting/consolidation/run | مكتمل | نقطة نهاية برمجية |
| المحاسبة | financial-report-audit | UI Page | /accounting/financial-report-audit | مكتمل | صفحة مستخدم |
| المحاسبة | financial-report-audit | API Route | /accounting/financial-report-audit | مكتمل | نقطة نهاية برمجية |
| المحاسبة | accounts | API Route | /accounting/accounts/init | Backend only | نقطة نهاية برمجية |
| المحاسبة | accounts | API Route | /accounting/accounts | Backend only | نقطة نهاية برمجية |
| المحاسبة | accruals | API Route | /accounting/accruals | Backend only | نقطة نهاية برمجية |
| المحاسبة | aging | API Route | /accounting/aging | Backend only | نقطة نهاية برمجية |
| المحاسبة | audit-export | API Route | /accounting/audit-export | Backend only | نقطة نهاية برمجية |
| المحاسبة | balance-sheet | API Route | /accounting/balance-sheet | Backend only | نقطة نهاية برمجية |
| المحاسبة | bank-feed | API Route | /accounting/bank-feed | Backend only | نقطة نهاية برمجية |
| المحاسبة | bank-recon | API Route | /accounting/bank-recon/auto-match | Backend only | نقطة نهاية برمجية |
| المحاسبة | bank-recon | API Route | /accounting/bank-recon | Backend only | نقطة نهاية برمجية |
| المحاسبة | bank-statements | API Route | /accounting/bank-statements | Backend only | نقطة نهاية برمجية |
| المحاسبة | bank-statements | API Route | /accounting/bank-statements/upload | Backend only | نقطة نهاية برمجية |
| المحاسبة | books | API Route | /accounting/books | Backend only | نقطة نهاية برمجية |
| المحاسبة | budget | API Route | /accounting/budget/check | Backend only | نقطة نهاية برمجية |
| المحاسبة | budget | API Route | /accounting/budget/variance | Backend only | نقطة نهاية برمجية |
| المحاسبة | cashflow | API Route | /accounting/cashflow/forecast | Backend only | نقطة نهاية برمجية |
| المحاسبة | chart-of-accounts-import | API Route | /accounting/chart-of-accounts-import | Backend only | نقطة نهاية برمجية |
| المحاسبة | closing | API Route | /accounting/closing | Backend only | نقطة نهاية برمجية |
| المحاسبة | coa | API Route | /accounting/coa/reset-to-socpa | Backend only | نقطة نهاية برمجية |
| المحاسبة | cost-center-report | API Route | /accounting/cost-center-report | Backend only | نقطة نهاية برمجية |
| المحاسبة | cost-centers | API Route | /accounting/cost-centers | Backend only | نقطة نهاية برمجية |
| المحاسبة | customers | API Route | /accounting/customers/[id]/statement | Backend only | نقطة نهاية برمجية |
| المحاسبة | deferred-tax | API Route | /accounting/deferred-tax | Backend only | نقطة نهاية برمجية |
| المحاسبة | depreciation | API Route | /accounting/depreciation | Backend only | نقطة نهاية برمجية |
| المحاسبة | ecl | API Route | /accounting/ecl/run | Backend only | نقطة نهاية برمجية |
| المحاسبة | financial-statements | API Route | /accounting/financial-statements | Backend only | نقطة نهاية برمجية |
| المحاسبة | fiscal-periods | API Route | /accounting/fiscal-periods | Backend only | نقطة نهاية برمجية |
| المحاسبة | fiscal-years | API Route | /accounting/fiscal-years | Backend only | نقطة نهاية برمجية |
| المحاسبة | fx-revaluation | API Route | /accounting/fx-revaluation/bank/post | Backend only | نقطة نهاية برمجية |
| المحاسبة | fx-revaluation | API Route | /accounting/fx-revaluation/bank/preview | Backend only | نقطة نهاية برمجية |
| المحاسبة | fx-revaluation | API Route | /accounting/fx-revaluation/post | Backend only | نقطة نهاية برمجية |
| المحاسبة | fx-revaluation | API Route | /accounting/fx-revaluation/preview | Backend only | نقطة نهاية برمجية |
| المحاسبة | fx-revaluation | API Route | /accounting/fx-revaluation/run | Backend only | نقطة نهاية برمجية |
| المحاسبة | governance-violations | API Route | /accounting/governance-violations | Backend only | نقطة نهاية برمجية |
| المحاسبة | gr-ir-clearing | API Route | /accounting/gr-ir-clearing | Backend only | نقطة نهاية برمجية |
| المحاسبة | income-statement | API Route | /accounting/income-statement | Backend only | نقطة نهاية برمجية |
| المحاسبة | intercompany | API Route | /accounting/intercompany | Backend only | نقطة نهاية برمجية |
| المحاسبة | inventory-valuation-snapshot | API Route | /accounting/inventory-valuation-snapshot | Backend only | نقطة نهاية برمجية |
| المحاسبة | ledger | API Route | /accounting/ledger | Backend only | نقطة نهاية برمجية |
| المحاسبة | month-end-close | API Route | /accounting/month-end-close | Backend only | نقطة نهاية برمجية |
| المحاسبة | opening-balances | API Route | /accounting/opening-balances | Backend only | نقطة نهاية برمجية |
| المحاسبة | payroll-gl | API Route | /accounting/payroll-gl | Backend only | نقطة نهاية برمجية |
| المحاسبة | reversal | API Route | /accounting/reversal | Backend only | نقطة نهاية برمجية |
| المحاسبة | statement | API Route | /accounting/statement | Backend only | نقطة نهاية برمجية |
| المحاسبة | year-end | API Route | /accounting/year-end/initiate | Backend only | نقطة نهاية برمجية |
| المحاسبة | year-end | API Route | /accounting/year-end/reopen | Backend only | نقطة نهاية برمجية |
| المحاسبة | year-end | API Route | /accounting/year-end/[runId]/finalize | Backend only | نقطة نهاية برمجية |
| المحاسبة | year-end | API Route | /accounting/year-end/[runId]/reports | Backend only | نقطة نهاية برمجية |
| المحاسبة | year-end | API Route | /accounting/year-end/[runId]/tasks | Backend only | نقطة نهاية برمجية |
| المحاسبة | year-end | API Route | /accounting/year-end/[runId]/tasks/[taskCode]/complete | Backend only | نقطة نهاية برمجية |
| المحاسبة | year-end | API Route | /accounting/year-end/[runId]/tasks/[taskCode]/execute | Backend only | نقطة نهاية برمجية |
| الإدارة العامة | bi-builder | UI Page | /admin/bi-builder | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإدارة العامة | chains | UI Page | /admin/chains | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإدارة العامة | compliance | UI Page | /admin/compliance | مكتمل | صفحة مستخدم |
| الإدارة العامة | compliance | API Route | /admin/compliance | مكتمل | نقطة نهاية برمجية |
| الإدارة العامة | compliance-dashboard | UI Page | /admin/compliance-dashboard | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإدارة العامة | e2e-tester | UI Page | /admin/e2e-tester | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإدارة العامة | feature-flags | UI Page | /admin/feature-flags | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإدارة العامة | grc | UI Page | /admin/grc/audit-log | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإدارة العامة | grc | UI Page | /admin/grc | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإدارة العامة | grc | UI Page | /admin/grc/policies | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإدارة العامة | grc | UI Page | /admin/grc/risks | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإدارة العامة | knowledge | UI Page | /admin/knowledge | مكتمل | صفحة مستخدم |
| الإدارة العامة | knowledge | API Route | /admin/knowledge | مكتمل | نقطة نهاية برمجية |
| الإدارة العامة | llm-costs | UI Page | /admin/llm-costs | مكتمل | صفحة مستخدم |
| الإدارة العامة | llm-costs | API Route | /admin/llm-costs | مكتمل | نقطة نهاية برمجية |
| الإدارة العامة | migration | UI Page | /admin/migration | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإدارة العامة | orchestration | UI Page | /admin/orchestration | مكتمل | صفحة مستخدم |
| الإدارة العامة | orchestration | API Route | /admin/orchestration | مكتمل | نقطة نهاية برمجية |
| الإدارة العامة | outbox | UI Page | /admin/outbox | مكتمل | صفحة مستخدم |
| الإدارة العامة | outbox | API Route | /admin/outbox/diagnostics | مكتمل | نقطة نهاية برمجية |
| الإدارة العامة | prompts | UI Page | /admin/prompts/cost | مكتمل | صفحة مستخدم |
| الإدارة العامة | prompts | UI Page | /admin/prompts | مكتمل | صفحة مستخدم |
| الإدارة العامة | prompts | API Route | /admin/prompts | مكتمل | نقطة نهاية برمجية |
| الإدارة العامة | rag-cost | UI Page | /admin/rag-cost | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإدارة العامة | security | UI Page | /admin/security/mfa-audit | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإدارة العامة | security | UI Page | /admin/security/mfa-policy | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإدارة العامة | siem | UI Page | /admin/siem | مكتمل | صفحة مستخدم |
| الإدارة العامة | siem | API Route | /admin/siem | مكتمل | نقطة نهاية برمجية |
| الإدارة العامة | sprint-progress | UI Page | /admin/sprint-progress | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإدارة العامة | stories | UI Page | /admin/stories | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإدارة العامة | test-coverage | UI Page | /admin/test-coverage | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإدارة العامة | training-compliance | UI Page | /admin/training-compliance | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإدارة العامة | audit-logs | API Route | /admin/audit-logs | Backend only | نقطة نهاية برمجية |
| الإدارة العامة | backups | API Route | /admin/backups | Backend only | نقطة نهاية برمجية |
| الإدارة العامة | bi | API Route | /admin/bi/query | Backend only | نقطة نهاية برمجية |
| الإدارة العامة | e2e-test | API Route | /admin/e2e-test | Backend only | نقطة نهاية برمجية |
| الإدارة العامة | nodes | API Route | /admin/nodes/backup | Backend only | نقطة نهاية برمجية |
| الإدارة العامة | nodes | API Route | /admin/nodes/billing | Backend only | نقطة نهاية برمجية |
| الإدارة العامة | nodes | API Route | /admin/nodes | Backend only | نقطة نهاية برمجية |
| الإدارة العامة | nodes | API Route | /admin/nodes/sync | Backend only | نقطة نهاية برمجية |
| الإدارة العامة | system-audit | API Route | /admin/system-audit | Backend only | نقطة نهاية برمجية |
| affiliates | main | UI Page | /affiliates | UI only (يحتاج ربط API) | صفحة مستخدم |
| ai | bank-fraud | UI Page | /ai/bank-fraud | مكتمل | صفحة مستخدم |
| ai | bank-fraud | API Route | /ai/bank-fraud | مكتمل | نقطة نهاية برمجية |
| ai | demand-forecast | UI Page | /ai/demand-forecast | مكتمل | صفحة مستخدم |
| ai | demand-forecast | API Route | /ai/demand-forecast | مكتمل | نقطة نهاية برمجية |
| ai | nlq | UI Page | /ai/nlq | مكتمل | صفحة مستخدم |
| ai | nlq | API Route | /ai/nlq | مكتمل | نقطة نهاية برمجية |
| ai | sales-coach | UI Page | /ai/sales-coach | مكتمل | صفحة مستخدم |
| ai | sales-coach | API Route | /ai/sales-coach | مكتمل | نقطة نهاية برمجية |
| ai | bank-reconciliation | API Route | /ai/bank-reconciliation | Backend only | نقطة نهاية برمجية |
| ai | cfo | API Route | /ai/cfo | Backend only | نقطة نهاية برمجية |
| ai | chat | API Route | /ai/chat | Backend only | نقطة نهاية برمجية |
| ai | copilot | API Route | /ai/copilot/chat | Backend only | نقطة نهاية برمجية |
| ai | copilot | API Route | /ai/copilot | Backend only | نقطة نهاية برمجية |
| ai | fraud-monitoring | API Route | /ai/fraud-monitoring | Backend only | نقطة نهاية برمجية |
| ai | ingest | API Route | /ai/ingest | Backend only | نقطة نهاية برمجية |
| ai | predictive-scm | API Route | /ai/predictive-scm | Backend only | نقطة نهاية برمجية |
| ai | rag | API Route | /ai/rag | Backend only | نقطة نهاية برمجية |
| ai-auditor | main | UI Page | /ai-auditor | مكتمل | صفحة مستخدم |
| ai-auditor | main | API Route | /ai-auditor | مكتمل | نقطة نهاية برمجية |
| ai-bank | main | UI Page | /ai-bank | UI only (يحتاج ربط API) | صفحة مستخدم |
| ai-cfo | main | UI Page | /ai-cfo | مكتمل | صفحة مستخدم |
| ai-cfo | main | API Route | /ai-cfo | مكتمل | نقطة نهاية برمجية |
| ai-cfo | report | API Route | /ai-cfo/report | Backend only | نقطة نهاية برمجية |
| ai-copilot | main | UI Page | /ai-copilot | UI only (يحتاج ربط API) | صفحة مستخدم |
| ai-scm | main | UI Page | /ai-scm | UI only (يحتاج ربط API) | صفحة مستخدم |
| ap | capture | UI Page | /ap/capture | مكتمل | صفحة مستخدم |
| ap | capture | API Route | /ap/capture | مكتمل | نقطة نهاية برمجية |
| ap | match | API Route | /ap/match | Backend only | نقطة نهاية برمجية |
| ap | three-way-match | API Route | /ap/three-way-match | Backend only | نقطة نهاية برمجية |
| ap | main | Service/Engine | payment-run.service.ts | Service only | خدمة خلفية |
| ap | main | Service/Engine | three-way-match.service.ts | Service only | خدمة خلفية |
| approvals | inbox | UI Page | /approvals/inbox | مكتمل | صفحة مستخدم |
| approvals | inbox | API Route | /approvals/inbox | مكتمل | نقطة نهاية برمجية |
| approvals | main | UI Page | /approvals | مكتمل | صفحة مستخدم |
| approvals | main | API Route | /approvals | مكتمل | نقطة نهاية برمجية |
| approvals | [id] | API Route | /approvals/[id]/approve | Backend only | نقطة نهاية برمجية |
| approvals | [id] | API Route | /approvals/[id]/reject | Backend only | نقطة نهاية برمجية |
| approvals | [id] | API Route | /approvals/[id] | Backend only | نقطة نهاية برمجية |
| assets | main | UI Page | /assets | مكتمل | صفحة مستخدم |
| assets | main | API Route | /assets | مكتمل | نقطة نهاية برمجية |
| assets | main | Service/Engine | fixed-asset-depreciation.service.ts | مكتمل | خدمة خلفية |
| assets | main | Service/Engine | impairment.service.ts | مكتمل | خدمة خلفية |
| assets | main | Service/Engine | lease.service.ts | مكتمل | خدمة خلفية |
| assets | main | Service/Engine | lifecycle.service.ts | مكتمل | خدمة خلفية |
| assets | main | Service/Engine | maintenance.service.ts | مكتمل | خدمة خلفية |
| assets | main | Service/Engine | revaluation.service.ts | مكتمل | خدمة خلفية |
| assets | main | Service/Engine | verification.service.ts | مكتمل | خدمة خلفية |
| assets | depreciate | API Route | /assets/depreciate | Backend only | نقطة نهاية برمجية |
| assets | leases | API Route | /assets/leases/post-monthly | Backend only | نقطة نهاية برمجية |
| assets | leases | API Route | /assets/leases/[id]/post-inception | Backend only | نقطة نهاية برمجية |
| attendance | main | UI Page | /attendance | مكتمل | صفحة مستخدم |
| attendance | main | API Route | /attendance | مكتمل | نقطة نهاية برمجية |
| attendance | face-id | API Route | /attendance/face-id | Backend only | نقطة نهاية برمجية |
| audit | field-trail | UI Page | /audit/field-trail | مكتمل | صفحة مستخدم |
| audit | field-trail | API Route | /audit/field-trail | مكتمل | نقطة نهاية برمجية |
| audit-logs | main | UI Page | /audit-logs | مكتمل | صفحة مستخدم |
| audit-logs | main | API Route | /audit-logs | مكتمل | نقطة نهاية برمجية |
| banks | main | UI Page | /banks | مكتمل | صفحة مستخدم |
| banks | main | API Route | /banks | مكتمل | نقطة نهاية برمجية |
| banks | import | API Route | /banks/import | Backend only | نقطة نهاية برمجية |
| banks | reconciliation | API Route | /banks/reconciliation | Backend only | نقطة نهاية برمجية |
| banks | [id] | API Route | /banks/[id] | Backend only | نقطة نهاية برمجية |
| banks | [id] | API Route | /banks/[id]/transactions | Backend only | نقطة نهاية برمجية |
| barcode | main | UI Page | /barcode | UI only (يحتاج ربط API) | صفحة مستخدم |
| batches | main | UI Page | /batches | مكتمل | صفحة مستخدم |
| batches | main | API Route | /batches | مكتمل | نقطة نهاية برمجية |
| batches | expiry | API Route | /batches/expiry | Backend only | نقطة نهاية برمجية |
| batches | [id] | API Route | /batches/[id] | Backend only | نقطة نهاية برمجية |
| bi | dashboard | UI Page | /bi/dashboard | UI only (يحتاج ربط API) | صفحة مستخدم |
| bi | budget-variance | API Route | /bi/budget-variance | Backend only | نقطة نهاية برمجية |
| bi | cube | API Route | /bi/cube | Backend only | نقطة نهاية برمجية |
| bi | kpis | API Route | /bi/kpis | Backend only | نقطة نهاية برمجية |
| bookings | calendar | UI Page | /bookings/calendar | UI only (يحتاج ربط API) | صفحة مستخدم |
| bookings | main | UI Page | /bookings | مكتمل | صفحة مستخدم |
| bookings | main | API Route | /bookings | مكتمل | نقطة نهاية برمجية |
| bookings | invoice | API Route | /bookings/invoice | Backend only | نقطة نهاية برمجية |
| branches | main | UI Page | /branches | مكتمل | صفحة مستخدم |
| branches | main | API Route | /branches | مكتمل | نقطة نهاية برمجية |
| calendar | main | UI Page | /calendar | UI only (يحتاج ربط API) | صفحة مستخدم |
| clinic | appointments | UI Page | /clinic/appointments | مكتمل | صفحة مستخدم |
| clinic | appointments | API Route | /clinic/appointments | مكتمل | نقطة نهاية برمجية |
| clinic | erx | UI Page | /clinic/erx | مكتمل | صفحة مستخدم |
| clinic | erx | API Route | /clinic/erx | مكتمل | نقطة نهاية برمجية |
| clinic | lab | UI Page | /clinic/lab | مكتمل | صفحة مستخدم |
| clinic | lab | API Route | /clinic/lab | مكتمل | نقطة نهاية برمجية |
| cmms | main | UI Page | /cmms | UI only (يحتاج ربط API) | صفحة مستخدم |
| cmms | work-orders | UI Page | /cmms/work-orders | مكتمل | صفحة مستخدم |
| cmms | work-orders | API Route | /cmms/work-orders | مكتمل | نقطة نهاية برمجية |
| cmms | schedules | API Route | /cmms/schedules | Backend only | نقطة نهاية برمجية |
| com | rules | UI Page | /com/rules | مكتمل | صفحة مستخدم |
| com | rules | API Route | /com/rules | مكتمل | نقطة نهاية برمجية |
| compliance | audits | UI Page | /compliance/audits | مكتمل | صفحة مستخدم |
| compliance | audits | API Route | /compliance/audits | مكتمل | نقطة نهاية برمجية |
| compliance | pdpl | UI Page | /compliance/pdpl/breaches | UI only (يحتاج ربط API) | صفحة مستخدم |
| compliance | pdpl | UI Page | /compliance/pdpl/dsr | UI only (يحتاج ربط API) | صفحة مستخدم |
| compliance | risks | UI Page | /compliance/risks | مكتمل | صفحة مستخدم |
| compliance | risks | API Route | /compliance/risks | مكتمل | نقطة نهاية برمجية |
| compliance | rules | API Route | /compliance/rules | Backend only | نقطة نهاية برمجية |
| contracts | main | UI Page | /contracts | مكتمل | صفحة مستخدم |
| contracts | main | API Route | /contracts | مكتمل | نقطة نهاية برمجية |
| contracts | templates | UI Page | /contracts/templates | مكتمل | صفحة مستخدم |
| contracts | templates | API Route | /contracts/templates | مكتمل | نقطة نهاية برمجية |
| contracts | alerts | API Route | /contracts/alerts | Backend only | نقطة نهاية برمجية |
| contracts | renewals | API Route | /contracts/renewals | Backend only | نقطة نهاية برمجية |
| copa | main | UI Page | /copa | مكتمل | صفحة مستخدم |
| copa | main | API Route | /copa | مكتمل | نقطة نهاية برمجية |
| copa | allocations | API Route | /copa/allocations | Backend only | نقطة نهاية برمجية |
| copa | characteristics | API Route | /copa/characteristics | Backend only | نقطة نهاية برمجية |
| copa | value-fields | API Route | /copa/value-fields | Backend only | نقطة نهاية برمجية |
| coupons | main | UI Page | /coupons | مكتمل | صفحة مستخدم |
| coupons | main | API Route | /coupons | مكتمل | نقطة نهاية برمجية |
| coupons | validate | API Route | /coupons/validate | Backend only | نقطة نهاية برمجية |
| coupons | [id] | API Route | /coupons/[id] | Backend only | نقطة نهاية برمجية |
| cpq | main | UI Page | /cpq | مكتمل | صفحة مستخدم |
| cpq | main | API Route | /cpq | مكتمل | نقطة نهاية برمجية |
| credit-check | main | UI Page | /credit-check | مكتمل | صفحة مستخدم |
| credit-check | main | API Route | /credit-check | مكتمل | نقطة نهاية برمجية |
| crm | campaigns | UI Page | /crm/campaigns | مكتمل | صفحة مستخدم |
| crm | campaigns | API Route | /crm/campaigns | مكتمل | نقطة نهاية برمجية |
| crm | customer360 | UI Page | /crm/customer360 | مكتمل | صفحة مستخدم |
| crm | customer360 | API Route | /crm/customer360 | مكتمل | نقطة نهاية برمجية |
| crm | cx-nps | UI Page | /crm/cx-nps | UI only (يحتاج ربط API) | صفحة مستخدم |
| crm | kanban | UI Page | /crm/kanban | UI only (يحتاج ربط API) | صفحة مستخدم |
| crm | key-accounts | UI Page | /crm/key-accounts | UI only (يحتاج ربط API) | صفحة مستخدم |
| crm | leads | UI Page | /crm/leads | مكتمل | صفحة مستخدم |
| crm | leads | API Route | /crm/leads | مكتمل | نقطة نهاية برمجية |
| crm | leads | API Route | /crm/leads/[id]/convert | مكتمل | نقطة نهاية برمجية |
| crm | opportunities | UI Page | /crm/opportunities | مكتمل | صفحة مستخدم |
| crm | opportunities | API Route | /crm/opportunities | مكتمل | نقطة نهاية برمجية |
| crm | opportunities | API Route | /crm/opportunities/[id]/win | مكتمل | نقطة نهاية برمجية |
| crm | main | UI Page | /crm | UI only (يحتاج ربط API) | صفحة مستخدم |
| crm | tickets | UI Page | /crm/tickets | مكتمل | صفحة مستخدم |
| crm | tickets | API Route | /crm/tickets | مكتمل | نقطة نهاية برمجية |
| crm | accounts | API Route | /crm/accounts | Backend only | نقطة نهاية برمجية |
| crm | activities | API Route | /crm/activities | Backend only | نقطة نهاية برمجية |
| crm | customer-health | API Route | /crm/customer-health | Backend only | نقطة نهاية برمجية |
| crm | forecast | API Route | /crm/forecast | Backend only | نقطة نهاية برمجية |
| crm | help-desk | API Route | /crm/help-desk | Backend only | نقطة نهاية برمجية |
| crm | kb | API Route | /crm/kb | Backend only | نقطة نهاية برمجية |
| crm | marketing | API Route | /crm/marketing | Backend only | نقطة نهاية برمجية |
| crm | omnichannel | API Route | /crm/omnichannel | Backend only | نقطة نهاية برمجية |
| crm | portal | API Route | /crm/portal | Backend only | نقطة نهاية برمجية |
| crm | sla | API Route | /crm/sla | Backend only | نقطة نهاية برمجية |
| crm | surveys | API Route | /crm/surveys | Backend only | نقطة نهاية برمجية |
| crm | territory | API Route | /crm/territory | Backend only | نقطة نهاية برمجية |
| crm | whatsapp | API Route | /crm/whatsapp/broadcast | Backend only | نقطة نهاية برمجية |
| crm | whatsapp | API Route | /crm/whatsapp | Backend only | نقطة نهاية برمجية |
| crm | whatsapp | API Route | /crm/whatsapp/sessions | Backend only | نقطة نهاية برمجية |
| crm | whatsapp | API Route | /crm/whatsapp/webhook | Backend only | نقطة نهاية برمجية |
| customers | main | UI Page | /customers | مكتمل | صفحة مستخدم |
| customers | main | API Route | /customers | مكتمل | نقطة نهاية برمجية |
| customers | [id] | UI Page | /customers/[id] | مكتمل | صفحة مستخدم |
| customers | [id] | API Route | /customers/[id]/credit | مكتمل | نقطة نهاية برمجية |
| customers | [id] | API Route | /customers/[id]/gdpr-delete | مكتمل | نقطة نهاية برمجية |
| customers | [id] | API Route | /customers/[id]/hold | مكتمل | نقطة نهاية برمجية |
| customers | [id] | API Route | /customers/[id] | مكتمل | نقطة نهاية برمجية |
| customers | [id] | API Route | /customers/[id]/statement | مكتمل | نقطة نهاية برمجية |
| لوحة التحكم | main | UI Page | /dashboard | مكتمل | صفحة مستخدم |
| لوحة التحكم | main | API Route | /dashboard | مكتمل | نقطة نهاية برمجية |
| dms | main | UI Page | /dms | مكتمل | صفحة مستخدم |
| dms | main | API Route | /dms | مكتمل | نقطة نهاية برمجية |
| docs | main | UI Page | /docs | مكتمل | صفحة مستخدم |
| docs | main | API Route | /docs | مكتمل | نقطة نهاية برمجية |
| docs | [slug] | UI Page | /docs/[slug] | UI only (يحتاج ربط API) | صفحة مستخدم |
| docs | openapi.json | API Route | /docs/openapi.json | Backend only | نقطة نهاية برمجية |
| documents | main | UI Page | /documents | مكتمل | صفحة مستخدم |
| documents | main | API Route | /documents | مكتمل | نقطة نهاية برمجية |
| documents | transition | API Route | /documents/transition | Backend only | نقطة نهاية برمجية |
| documents | [id] | API Route | /documents/[id] | Backend only | نقطة نهاية برمجية |
| ecommerce | dashboard | UI Page | /ecommerce/dashboard | UI only (يحتاج ربط API) | صفحة مستخدم |
| ecommerce | stores | UI Page | /ecommerce/stores | مكتمل | صفحة مستخدم |
| ecommerce | stores | API Route | /ecommerce/stores | مكتمل | نقطة نهاية برمجية |
| ecommerce | orders | API Route | /ecommerce/orders | Backend only | نقطة نهاية برمجية |
| ecommerce | sync | API Route | /ecommerce/sync | Backend only | نقطة نهاية برمجية |
| employees | main | UI Page | /employees | مكتمل | صفحة مستخدم |
| employees | main | API Route | /employees | مكتمل | نقطة نهاية برمجية |
| employees | [id] | API Route | /employees/[id] | Backend only | نقطة نهاية برمجية |
| enterprise | fleet | UI Page | /enterprise/fleet | مكتمل | صفحة مستخدم |
| enterprise | fleet | API Route | /enterprise/fleet | مكتمل | نقطة نهاية برمجية |
| enterprise | legal | UI Page | /enterprise/legal | مكتمل | صفحة مستخدم |
| enterprise | legal | API Route | /enterprise/legal | مكتمل | نقطة نهاية برمجية |
| enterprise | mrp | UI Page | /enterprise/mrp | مكتمل | صفحة مستخدم |
| enterprise | mrp | UI Page | /enterprise/mrp/recipes | مكتمل | صفحة مستخدم |
| enterprise | mrp | API Route | /enterprise/mrp | مكتمل | نقطة نهاية برمجية |
| enterprise | portfolio | UI Page | /enterprise/portfolio | UI only (يحتاج ربط API) | صفحة مستخدم |
| enterprise | projects | UI Page | /enterprise/projects/evm | مكتمل | صفحة مستخدم |
| enterprise | projects | UI Page | /enterprise/projects | مكتمل | صفحة مستخدم |
| enterprise | projects | UI Page | /enterprise/projects/[id]/gantt | مكتمل | صفحة مستخدم |
| enterprise | projects | UI Page | /enterprise/projects/[id] | مكتمل | صفحة مستخدم |
| enterprise | projects | API Route | /enterprise/projects/budget | مكتمل | نقطة نهاية برمجية |
| enterprise | projects | API Route | /enterprise/projects | مكتمل | نقطة نهاية برمجية |
| enterprise | projects | API Route | /enterprise/projects/tasks | مكتمل | نقطة نهاية برمجية |
| enterprise | property | UI Page | /enterprise/property | مكتمل | صفحة مستخدم |
| enterprise | property | API Route | /enterprise/property | مكتمل | نقطة نهاية برمجية |
| enterprise | quality | UI Page | /enterprise/quality | مكتمل | صفحة مستخدم |
| enterprise | quality | API Route | /enterprise/quality | مكتمل | نقطة نهاية برمجية |
| enterprise | quality-management | UI Page | /enterprise/quality-management | UI only (يحتاج ربط API) | صفحة مستخدم |
| enterprise | wms | UI Page | /enterprise/wms | مكتمل | صفحة مستخدم |
| enterprise | wms | API Route | /enterprise/wms | مكتمل | نقطة نهاية برمجية |
| esign | main | UI Page | /esign | مكتمل | صفحة مستخدم |
| esign | main | API Route | /esign | مكتمل | نقطة نهاية برمجية |
| events | main | UI Page | /events | مكتمل | صفحة مستخدم |
| events | main | API Route | /events | مكتمل | نقطة نهاية برمجية |
| events | registrations | API Route | /events/registrations | Backend only | نقطة نهاية برمجية |
| expenses | main | UI Page | /expenses | مكتمل | صفحة مستخدم |
| expenses | main | API Route | /expenses | مكتمل | نقطة نهاية برمجية |
| field-service | main | UI Page | /field-service | مكتمل | صفحة مستخدم |
| field-service | main | API Route | /field-service | مكتمل | نقطة نهاية برمجية |
| field-service | orders | API Route | /field-service/orders | Backend only | نقطة نهاية برمجية |
| finance | allocation | UI Page | /finance/allocation | مكتمل | صفحة مستخدم |
| finance | allocation | API Route | /finance/allocation | مكتمل | نقطة نهاية برمجية |
| finance | assets | UI Page | /finance/assets | مكتمل | صفحة مستخدم |
| finance | assets | API Route | /finance/assets | مكتمل | نقطة نهاية برمجية |
| finance | bad-debt | UI Page | /finance/bad-debt | مكتمل | صفحة مستخدم |
| finance | bad-debt | API Route | /finance/bad-debt | مكتمل | نقطة نهاية برمجية |
| finance | balance-sheet | UI Page | /finance/balance-sheet | مكتمل | صفحة مستخدم |
| finance | balance-sheet | API Route | /finance/balance-sheet | مكتمل | نقطة نهاية برمجية |
| finance | bank-recon | UI Page | /finance/bank-recon/rules | مكتمل | صفحة مستخدم |
| finance | bank-recon | API Route | /finance/bank-recon/rules | مكتمل | نقطة نهاية برمجية |
| finance | bank-recon | API Route | /finance/bank-recon/rules/simulate | مكتمل | نقطة نهاية برمجية |
| finance | budget-control | UI Page | /finance/budget-control | مكتمل | صفحة مستخدم |
| finance | budget-control | UI Page | /finance/budget-control/variance | مكتمل | صفحة مستخدم |
| finance | budget-control | API Route | /finance/budget-control | مكتمل | نقطة نهاية برمجية |
| finance | budget-planning | UI Page | /finance/budget-planning | UI only (يحتاج ربط API) | صفحة مستخدم |
| finance | budget-scenarios | UI Page | /finance/budget-scenarios | UI only (يحتاج ربط API) | صفحة مستخدم |
| finance | cash-flow | UI Page | /finance/cash-flow/forecast | مكتمل | صفحة مستخدم |
| finance | cash-flow | UI Page | /finance/cash-flow | مكتمل | صفحة مستخدم |
| finance | cash-flow | API Route | /finance/cash-flow/forecast | مكتمل | نقطة نهاية برمجية |
| finance | cash-flow | API Route | /finance/cash-flow | مكتمل | نقطة نهاية برمجية |
| finance | cfo | UI Page | /finance/cfo | مكتمل | صفحة مستخدم |
| finance | cfo | API Route | /finance/cfo | مكتمل | نقطة نهاية برمجية |
| finance | cfo-ai | UI Page | /finance/cfo-ai | UI only (يحتاج ربط API) | صفحة مستخدم |
| finance | cfo-dashboard | UI Page | /finance/cfo-dashboard | مكتمل | صفحة مستخدم |
| finance | cfo-dashboard | API Route | /finance/cfo-dashboard | مكتمل | نقطة نهاية برمجية |
| finance | consolidation | UI Page | /finance/consolidation/elimination | مكتمل | صفحة مستخدم |
| finance | consolidation | UI Page | /finance/consolidation | مكتمل | صفحة مستخدم |
| finance | consolidation | API Route | /finance/consolidation/elimination | مكتمل | نقطة نهاية برمجية |
| finance | consolidation | API Route | /finance/consolidation | مكتمل | نقطة نهاية برمجية |
| finance | copa | UI Page | /finance/copa | مكتمل | صفحة مستخدم |
| finance | copa | UI Page | /finance/copa/rules | مكتمل | صفحة مستخدم |
| finance | copa | API Route | /finance/copa | مكتمل | نقطة نهاية برمجية |
| finance | credit-check | UI Page | /finance/credit-check | UI only (يحتاج ربط API) | صفحة مستخدم |
| finance | deferred-tax | UI Page | /finance/deferred-tax | مكتمل | صفحة مستخدم |
| finance | deferred-tax | API Route | /finance/deferred-tax | مكتمل | نقطة نهاية برمجية |
| finance | ecl | UI Page | /finance/ecl | مكتمل | صفحة مستخدم |
| finance | ecl | API Route | /finance/ecl | مكتمل | نقطة نهاية برمجية |
| finance | financial-health | UI Page | /finance/financial-health | مكتمل | صفحة مستخدم |
| finance | financial-health | API Route | /finance/financial-health | مكتمل | نقطة نهاية برمجية |
| finance | fx-revaluation | UI Page | /finance/fx-revaluation | مكتمل | صفحة مستخدم |
| finance | fx-revaluation | API Route | /finance/fx-revaluation | مكتمل | نقطة نهاية برمجية |
| finance | impairment | UI Page | /finance/impairment | مكتمل | صفحة مستخدم |
| finance | impairment | API Route | /finance/impairment | مكتمل | نقطة نهاية برمجية |
| finance | payment-run | UI Page | /finance/payment-run | مكتمل | صفحة مستخدم |
| finance | payment-run | API Route | /finance/payment-run/propose | مكتمل | نقطة نهاية برمجية |
| finance | payment-run | API Route | /finance/payment-run | مكتمل | نقطة نهاية برمجية |
| finance | payment-run | API Route | /finance/payment-run/[id]/approve | مكتمل | نقطة نهاية برمجية |
| finance | payment-run | API Route | /finance/payment-run/[id]/confirm | مكتمل | نقطة نهاية برمجية |
| finance | payment-run | API Route | /finance/payment-run/[id] | مكتمل | نقطة نهاية برمجية |
| finance | payment-run | API Route | /finance/payment-run/[id]/send-bank | مكتمل | نقطة نهاية برمجية |
| finance | period-close | UI Page | /finance/period-close | مكتمل | صفحة مستخدم |
| finance | period-close | API Route | /finance/period-close | مكتمل | نقطة نهاية برمجية |
| finance | period-close | API Route | /finance/period-close/[id]/step | مكتمل | نقطة نهاية برمجية |
| finance | rebates | UI Page | /finance/rebates | UI only (يحتاج ربط API) | صفحة مستخدم |
| finance | transfer-pricing | UI Page | /finance/transfer-pricing | مكتمل | صفحة مستخدم |
| finance | transfer-pricing | API Route | /finance/transfer-pricing | مكتمل | نقطة نهاية برمجية |
| finance | variance | UI Page | /finance/variance | مكتمل | صفحة مستخدم |
| finance | variance | API Route | /finance/variance | مكتمل | نقطة نهاية برمجية |
| finance | vat | UI Page | /finance/vat/categories | UI only (يحتاج ربط API) | صفحة مستخدم |
| finance | wht | UI Page | /finance/wht/form14 | مكتمل | صفحة مستخدم |
| finance | wht | UI Page | /finance/wht | مكتمل | صفحة مستخدم |
| finance | wht | API Route | /finance/wht | مكتمل | نقطة نهاية برمجية |
| finance | aging | API Route | /finance/aging | Backend only | نقطة نهاية برمجية |
| finance | ap-aging | API Route | /finance/ap-aging | Backend only | نقطة نهاية برمجية |
| finance | aro | API Route | /finance/aro | Backend only | نقطة نهاية برمجية |
| finance | asset-lifecycle | API Route | /finance/asset-lifecycle | Backend only | نقطة نهاية برمجية |
| finance | auto-ecl | API Route | /finance/auto-ecl | Backend only | نقطة نهاية برمجية |
| finance | budget | API Route | /finance/budget | Backend only | نقطة نهاية برمجية |
| finance | budget | API Route | /finance/budget/variance | Backend only | نقطة نهاية برمجية |
| finance | budget-upload | API Route | /finance/budget-upload | Backend only | نقطة نهاية برمجية |
| finance | cash-flow-forecast | API Route | /finance/cash-flow-forecast | Backend only | نقطة نهاية برمجية |
| finance | cash-flow-indirect | API Route | /finance/cash-flow-indirect | Backend only | نقطة نهاية برمجية |
| finance | cashflow | API Route | /finance/cashflow | Backend only | نقطة نهاية برمجية |
| finance | checks | API Route | /finance/checks | Backend only | نقطة نهاية برمجية |
| finance | checks | API Route | /finance/checks/[id]/process | Backend only | نقطة نهاية برمجية |
| finance | commitments | API Route | /finance/commitments | Backend only | نقطة نهاية برمجية |
| finance | contract-assets | API Route | /finance/contract-assets | Backend only | نقطة نهاية برمجية |
| finance | controls | API Route | /finance/controls | Backend only | نقطة نهاية برمجية |
| finance | dunning | API Route | /finance/dunning/history | Backend only | نقطة نهاية برمجية |
| finance | dunning | API Route | /finance/dunning | Backend only | نقطة نهاية برمجية |
| finance | dunning | API Route | /finance/dunning/run | Backend only | نقطة نهاية برمجية |
| finance | equity-statement | API Route | /finance/equity-statement | Backend only | نقطة نهاية برمجية |
| finance | fs-notes | API Route | /finance/fs-notes | Backend only | نقطة نهاية برمجية |
| finance | hedge | API Route | /finance/hedge | Backend only | نقطة نهاية برمجية |
| finance | ifrs16 | API Route | /finance/ifrs16 | Backend only | نقطة نهاية برمجية |
| finance | ifrs16-lease | API Route | /finance/ifrs16-lease | Backend only | نقطة نهاية برمجية |
| finance | match | API Route | /finance/match/queue | Backend only | نقطة نهاية برمجية |
| finance | match | API Route | /finance/match/[id]/resolve | Backend only | نقطة نهاية برمجية |
| finance | multi-gaap | API Route | /finance/multi-gaap | Backend only | نقطة نهاية برمجية |
| finance | notes-to-fs | API Route | /finance/notes-to-fs | Backend only | نقطة نهاية برمجية |
| finance | payment-runs | API Route | /finance/payment-runs/propose | Backend only | نقطة نهاية برمجية |
| finance | payment-runs | API Route | /finance/payment-runs | Backend only | نقطة نهاية برمجية |
| finance | payment-runs | API Route | /finance/payment-runs/[id]/approve | Backend only | نقطة نهاية برمجية |
| finance | payment-runs | API Route | /finance/payment-runs/[id]/execute | Backend only | نقطة نهاية برمجية |
| finance | payment-runs | API Route | /finance/payment-runs/[id]/submit-for-approval | Backend only | نقطة نهاية برمجية |
| finance | payment-schedule | API Route | /finance/payment-schedule | Backend only | نقطة نهاية برمجية |
| finance | period-reports | API Route | /finance/period-reports | Backend only | نقطة نهاية برمجية |
| finance | petty-cash | API Route | /finance/petty-cash | Backend only | نقطة نهاية برمجية |
| finance | petty-cash | API Route | /finance/petty-cash/[id]/process | Backend only | نقطة نهاية برمجية |
| finance | reconciliations | API Route | /finance/reconciliations | Backend only | نقطة نهاية برمجية |
| finance | reconciliations | API Route | /finance/reconciliations/[id] | Backend only | نقطة نهاية برمجية |
| finance | rolling-forecast | API Route | /finance/rolling-forecast | Backend only | نقطة نهاية برمجية |
| finance | segments | API Route | /finance/segments | Backend only | نقطة نهاية برمجية |
| finance | treasury | API Route | /finance/treasury | Backend only | نقطة نهاية برمجية |
| fiscal-periods | main | UI Page | /fiscal-periods | مكتمل | صفحة مستخدم |
| fiscal-periods | main | API Route | /fiscal-periods | مكتمل | نقطة نهاية برمجية |
| fixed-assets | main | UI Page | /fixed-assets | مكتمل | صفحة مستخدم |
| fixed-assets | main | API Route | /fixed-assets | مكتمل | نقطة نهاية برمجية |
| fixed-assets | [id] | API Route | /fixed-assets/[id]/depreciate | Backend only | نقطة نهاية برمجية |
| fixed-assets | [id] | API Route | /fixed-assets/[id] | Backend only | نقطة نهاية برمجية |
| fleet | fuel | UI Page | /fleet/fuel | مكتمل | صفحة مستخدم |
| fleet | fuel | API Route | /fleet/fuel | مكتمل | نقطة نهاية برمجية |
| fleet | maintenance | UI Page | /fleet/maintenance | مكتمل | صفحة مستخدم |
| fleet | maintenance | API Route | /fleet/maintenance | مكتمل | نقطة نهاية برمجية |
| fleet | main | UI Page | /fleet | UI only (يحتاج ربط API) | صفحة مستخدم |
| fleet | tracking | UI Page | /fleet/tracking | UI only (يحتاج ربط API) | صفحة مستخدم |
| fleet | trips | UI Page | /fleet/trips | مكتمل | صفحة مستخدم |
| fleet | trips | API Route | /fleet/trips | مكتمل | نقطة نهاية برمجية |
| fleet | advanced | API Route | /fleet/advanced | Backend only | نقطة نهاية برمجية |
| fng | allocations | UI Page | /fng/allocations | UI only (يحتاج ربط API) | صفحة مستخدم |
| fng | budgets | UI Page | /fng/budgets | مكتمل | صفحة مستخدم |
| fng | budgets | API Route | /fng/budgets | مكتمل | نقطة نهاية برمجية |
| fng | petty-cash-funds | UI Page | /fng/petty-cash-funds | مكتمل | صفحة مستخدم |
| fng | petty-cash-funds | API Route | /fng/petty-cash-funds | مكتمل | نقطة نهاية برمجية |
| fsm | dispatch | UI Page | /fsm/dispatch | UI only (يحتاج ربط API) | صفحة مستخدم |
| fsm | main | UI Page | /fsm | UI only (يحتاج ربط API) | صفحة مستخدم |
| fsm | tasks | UI Page | /fsm/tasks | UI only (يحتاج ربط API) | صفحة مستخدم |
| fsm | complete | API Route | /fsm/complete | Backend only | نقطة نهاية برمجية |
| fsm | tickets | API Route | /fsm/tickets | Backend only | نقطة نهاية برمجية |
| fx | main | UI Page | /fx | مكتمل | صفحة مستخدم |
| fx | main | API Route | /fx | مكتمل | نقطة نهاية برمجية |
| gift-cards | main | UI Page | /gift-cards | مكتمل | صفحة مستخدم |
| gift-cards | main | API Route | /gift-cards | مكتمل | نقطة نهاية برمجية |
| gift-cards | [id] | API Route | /gift-cards/[id] | Backend only | نقطة نهاية برمجية |
| الموارد البشرية | ai-enrollment | UI Page | /hr/ai-enrollment | UI only (يحتاج ربط API) | صفحة مستخدم |
| الموارد البشرية | attendance | UI Page | /hr/attendance | مكتمل | صفحة مستخدم |
| الموارد البشرية | attendance | API Route | /hr/attendance/punch | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | attendance | API Route | /hr/attendance | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | documents | UI Page | /hr/documents | مكتمل | صفحة مستخدم |
| الموارد البشرية | documents | API Route | /hr/documents/expiry | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | documents | API Route | /hr/documents/expiry/[id] | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | eos | UI Page | /hr/eos | مكتمل | صفحة مستخدم |
| الموارد البشرية | eos | API Route | /hr/eos | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | eos | API Route | /hr/eos/[id] | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | evaluations | UI Page | /hr/evaluations | مكتمل | صفحة مستخدم |
| الموارد البشرية | evaluations | API Route | /hr/evaluations | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | expense-reports | UI Page | /hr/expense-reports | مكتمل | صفحة مستخدم |
| الموارد البشرية | expense-reports | API Route | /hr/expense-reports | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | gosi | UI Page | /hr/gosi | مكتمل | صفحة مستخدم |
| الموارد البشرية | gosi | API Route | /hr/gosi/calculate | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | gosi | API Route | /hr/gosi/file | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | gosi | API Route | /hr/gosi/file/submit | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | gosi | API Route | /hr/gosi | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | jobs | UI Page | /hr/jobs | مكتمل | صفحة مستخدم |
| الموارد البشرية | jobs | API Route | /hr/jobs | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | leaves | UI Page | /hr/leaves | مكتمل | صفحة مستخدم |
| الموارد البشرية | leaves | API Route | /hr/leaves/accrual | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | leaves | API Route | /hr/leaves/balance | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | leaves | API Route | /hr/leaves | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | leaves | API Route | /hr/leaves/[id] | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | loans | UI Page | /hr/loans | مكتمل | صفحة مستخدم |
| الموارد البشرية | loans | API Route | /hr/loans | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | mudad | UI Page | /hr/mudad | مكتمل | صفحة مستخدم |
| الموارد البشرية | mudad | API Route | /hr/mudad/compliance | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | mudad | API Route | /hr/mudad/wps/submit/[batchId] | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | nitaqat-simulator | UI Page | /hr/nitaqat-simulator | UI only (يحتاج ربط API) | صفحة مستخدم |
| الموارد البشرية | org-chart | UI Page | /hr/org-chart | مكتمل | صفحة مستخدم |
| الموارد البشرية | org-chart | API Route | /hr/org-chart | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | main | UI Page | /hr | UI only (يحتاج ربط API) | صفحة مستخدم |
| الموارد البشرية | main | Service/Engine | leave.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| الموارد البشرية | main | Service/Engine | onboarding.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| الموارد البشرية | main | Service/Engine | payroll.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| الموارد البشرية | main | Service/Engine | performance.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| الموارد البشرية | main | Service/Engine | recruitment.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| الموارد البشرية | main | Service/Engine | saudization.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| الموارد البشرية | main | Service/Engine | time-attendance.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| الموارد البشرية | payroll | UI Page | /hr/payroll/config | مكتمل | صفحة مستخدم |
| الموارد البشرية | payroll | UI Page | /hr/payroll/run | مكتمل | صفحة مستخدم |
| الموارد البشرية | payroll | API Route | /hr/payroll/calculate | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | payroll | API Route | /hr/payroll/config | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | payroll | API Route | /hr/payroll/generate | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | payroll | API Route | /hr/payroll/multi-country | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | payroll | API Route | /hr/payroll/run | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | payroll-process | UI Page | /hr/payroll-process | UI only (يحتاج ربط API) | صفحة مستخدم |
| الموارد البشرية | payslip | UI Page | /hr/payslip/[id] | UI only (يحتاج ربط API) | صفحة مستخدم |
| الموارد البشرية | performance | UI Page | /hr/performance | مكتمل | صفحة مستخدم |
| الموارد البشرية | performance | API Route | /hr/performance | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | qiwa | UI Page | /hr/qiwa/contracts | مكتمل | صفحة مستخدم |
| الموارد البشرية | qiwa | UI Page | /hr/qiwa | مكتمل | صفحة مستخدم |
| الموارد البشرية | qiwa | API Route | /hr/qiwa/contracts | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | qiwa | API Route | /hr/qiwa | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | recruitment | UI Page | /hr/recruitment | مكتمل | صفحة مستخدم |
| الموارد البشرية | recruitment | API Route | /hr/recruitment | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | saudization | UI Page | /hr/saudization | UI only (يحتاج ربط API) | صفحة مستخدم |
| الموارد البشرية | self-service | UI Page | /hr/self-service | UI only (يحتاج ربط API) | صفحة مستخدم |
| الموارد البشرية | succession | UI Page | /hr/succession | مكتمل | صفحة مستخدم |
| الموارد البشرية | succession | API Route | /hr/succession | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | timesheet | UI Page | /hr/timesheet | مكتمل | صفحة مستخدم |
| الموارد البشرية | timesheet | API Route | /hr/timesheet | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | training | UI Page | /hr/training | مكتمل | صفحة مستخدم |
| الموارد البشرية | training | API Route | /hr/training | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | wps | UI Page | /hr/wps | مكتمل | صفحة مستخدم |
| الموارد البشرية | wps | API Route | /hr/wps | مكتمل | نقطة نهاية برمجية |
| الموارد البشرية | comp-review | API Route | /hr/comp-review | Backend only | نقطة نهاية برمجية |
| الموارد البشرية | competency | API Route | /hr/competency | Backend only | نقطة نهاية برمجية |
| الموارد البشرية | employees | API Route | /hr/employees | Backend only | نقطة نهاية برمجية |
| الموارد البشرية | ess | API Route | /hr/ess | Backend only | نقطة نهاية برمجية |
| الموارد البشرية | lms | API Route | /hr/lms | Backend only | نقطة نهاية برمجية |
| الموارد البشرية | okrs | API Route | /hr/okrs | Backend only | نقطة نهاية برمجية |
| الموارد البشرية | safety | API Route | /hr/safety | Backend only | نقطة نهاية برمجية |
| installments | main | UI Page | /installments | مكتمل | صفحة مستخدم |
| installments | main | API Route | /installments | مكتمل | نقطة نهاية برمجية |
| inv | serials | UI Page | /inv/serials | مكتمل | صفحة مستخدم |
| inv | serials | API Route | /inv/serials | مكتمل | نقطة نهاية برمجية |
| المخزون | abc-analysis | UI Page | /inventory/abc-analysis | مكتمل | صفحة مستخدم |
| المخزون | abc-analysis | API Route | /inventory/abc-analysis | مكتمل | نقطة نهاية برمجية |
| المخزون | ai-vision | UI Page | /inventory/ai-vision | مكتمل | صفحة مستخدم |
| المخزون | ai-vision | API Route | /inventory/ai-vision | مكتمل | نقطة نهاية برمجية |
| المخزون | delivery-notes | UI Page | /inventory/delivery-notes | UI only (يحتاج ربط API) | صفحة مستخدم |
| المخزون | movements | UI Page | /inventory/movements | UI only (يحتاج ربط API) | صفحة مستخدم |
| المخزون | main | UI Page | /inventory | UI only (يحتاج ربط API) | صفحة مستخدم |
| المخزون | main | Service/Engine | cycle-count.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| المخزون | main | Service/Engine | demand-forecast.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| المخزون | main | Service/Engine | inventory-analytics.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| المخزون | main | Service/Engine | landed-cost.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| المخزون | main | Service/Engine | lot-serial.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| المخزون | main | Service/Engine | quality-inspection.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| المخزون | main | Service/Engine | reorder.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| المخزون | main | Service/Engine | warehouse-transfer.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| المخزون | picking | UI Page | /inventory/picking/[id] | مكتمل | صفحة مستخدم |
| المخزون | picking | API Route | /inventory/picking/[id]/confirm | مكتمل | نقطة نهاية برمجية |
| المخزون | picking | API Route | /inventory/picking/[id] | مكتمل | نقطة نهاية برمجية |
| المخزون | quality-control | UI Page | /inventory/quality-control | مكتمل | صفحة مستخدم |
| المخزون | quality-control | API Route | /inventory/quality-control | مكتمل | نقطة نهاية برمجية |
| المخزون | reorder-rules | UI Page | /inventory/reorder-rules | مكتمل | صفحة مستخدم |
| المخزون | reorder-rules | API Route | /inventory/reorder-rules | مكتمل | نقطة نهاية برمجية |
| المخزون | stocktake | UI Page | /inventory/stocktake/cycle | مكتمل | صفحة مستخدم |
| المخزون | stocktake | API Route | /inventory/stocktake | مكتمل | نقطة نهاية برمجية |
| المخزون | stocktake | API Route | /inventory/stocktake/[id]/approve | مكتمل | نقطة نهاية برمجية |
| المخزون | traceability | UI Page | /inventory/traceability | UI only (يحتاج ربط API) | صفحة مستخدم |
| المخزون | wms | UI Page | /inventory/wms | UI only (يحتاج ربط API) | صفحة مستخدم |
| المخزون | wms | UI Page | /inventory/wms/putaway | UI only (يحتاج ربط API) | صفحة مستخدم |
| المخزون | zones | UI Page | /inventory/zones | UI only (يحتاج ربط API) | صفحة مستخدم |
| المخزون | analytics | API Route | /inventory/analytics | Backend only | نقطة نهاية برمجية |
| المخزون | batches | API Route | /inventory/batches/expiring | Backend only | نقطة نهاية برمجية |
| المخزون | batches | API Route | /inventory/batches/[id]/quarantine | Backend only | نقطة نهاية برمجية |
| المخزون | batches | API Route | /inventory/batches/[id]/recall | Backend only | نقطة نهاية برمجية |
| المخزون | batches | API Route | /inventory/batches/[id]/release | Backend only | نقطة نهاية برمجية |
| المخزون | clear-all | API Route | /inventory/clear-all | Backend only | نقطة نهاية برمجية |
| المخزون | costing | API Route | /inventory/costing | Backend only | نقطة نهاية برمجية |
| المخزون | products | API Route | /inventory/products/[id]/variants | Backend only | نقطة نهاية برمجية |
| المخزون | putaway | API Route | /inventory/putaway/suggest | Backend only | نقطة نهاية برمجية |
| المخزون | reorder | API Route | /inventory/reorder | Backend only | نقطة نهاية برمجية |
| knowledge | articles | UI Page | /knowledge/articles | مكتمل | صفحة مستخدم |
| knowledge | articles | API Route | /knowledge/articles | مكتمل | نقطة نهاية برمجية |
| knowledge | categories | API Route | /knowledge/categories | Backend only | نقطة نهاية برمجية |
| learn | main | UI Page | /learn | UI only (يحتاج ربط API) | صفحة مستخدم |
| learn | courses | API Route | /learn/courses | Backend only | نقطة نهاية برمجية |
| lms | courses | UI Page | /lms/courses | مكتمل | صفحة مستخدم |
| lms | courses | API Route | /lms/courses | مكتمل | نقطة نهاية برمجية |
| logistics | carriers | UI Page | /logistics/carriers | مكتمل | صفحة مستخدم |
| logistics | carriers | API Route | /logistics/carriers | مكتمل | نقطة نهاية برمجية |
| logistics | freight | UI Page | /logistics/freight | مكتمل | صفحة مستخدم |
| logistics | freight | API Route | /logistics/freight | مكتمل | نقطة نهاية برمجية |
| loyalty | main | UI Page | /loyalty | مكتمل | صفحة مستخدم |
| loyalty | main | API Route | /loyalty | مكتمل | نقطة نهاية برمجية |
| loyalty | [customerId] | API Route | /loyalty/[customerId]/transactions | Backend only | نقطة نهاية برمجية |
| maintenance | main | UI Page | /maintenance | مكتمل | صفحة مستخدم |
| maintenance | main | API Route | /maintenance | مكتمل | نقطة نهاية برمجية |
| maintenance | preventive | UI Page | /maintenance/preventive | مكتمل | صفحة مستخدم |
| maintenance | preventive | API Route | /maintenance/preventive | مكتمل | نقطة نهاية برمجية |
| manufacturing | aps | UI Page | /manufacturing/aps | مكتمل | صفحة مستخدم |
| manufacturing | aps | API Route | /manufacturing/aps | مكتمل | نقطة نهاية برمجية |
| manufacturing | blockchain-trace | UI Page | /manufacturing/blockchain-trace | مكتمل | صفحة مستخدم |
| manufacturing | blockchain-trace | API Route | /manufacturing/blockchain-trace | مكتمل | نقطة نهاية برمجية |
| manufacturing | bom | UI Page | /manufacturing/bom | مكتمل | صفحة مستخدم |
| manufacturing | bom | API Route | /manufacturing/bom | مكتمل | نقطة نهاية برمجية |
| manufacturing | boms | UI Page | /manufacturing/boms | مكتمل | صفحة مستخدم |
| manufacturing | boms | UI Page | /manufacturing/boms/[id]/versions | مكتمل | صفحة مستخدم |
| manufacturing | boms | API Route | /manufacturing/boms/versions/[versionId]/activate | مكتمل | نقطة نهاية برمجية |
| manufacturing | boms | API Route | /manufacturing/boms/[id]/versions | مكتمل | نقطة نهاية برمجية |
| manufacturing | capa | UI Page | /manufacturing/capa | مكتمل | صفحة مستخدم |
| manufacturing | capa | API Route | /manufacturing/capa | مكتمل | نقطة نهاية برمجية |
| manufacturing | capacity | UI Page | /manufacturing/capacity | مكتمل | صفحة مستخدم |
| manufacturing | capacity | API Route | /manufacturing/capacity | مكتمل | نقطة نهاية برمجية |
| manufacturing | digital-twin | UI Page | /manufacturing/digital-twin | مكتمل | صفحة مستخدم |
| manufacturing | digital-twin | API Route | /manufacturing/digital-twin | مكتمل | نقطة نهاية برمجية |
| manufacturing | labor-efficiency | UI Page | /manufacturing/labor-efficiency | مكتمل | صفحة مستخدم |
| manufacturing | labor-efficiency | API Route | /manufacturing/labor-efficiency | مكتمل | نقطة نهاية برمجية |
| manufacturing | lean-kanban | UI Page | /manufacturing/lean-kanban | UI only (يحتاج ربط API) | صفحة مستخدم |
| manufacturing | mes-oee | UI Page | /manufacturing/mes-oee | مكتمل | صفحة مستخدم |
| manufacturing | mes-oee | API Route | /manufacturing/mes-oee | مكتمل | نقطة نهاية برمجية |
| manufacturing | mrp-dashboard | UI Page | /manufacturing/mrp-dashboard | UI only (يحتاج ربط API) | صفحة مستخدم |
| manufacturing | mrp-engine | UI Page | /manufacturing/mrp-engine | UI only (يحتاج ربط API) | صفحة مستخدم |
| manufacturing | oee | UI Page | /manufacturing/oee | مكتمل | صفحة مستخدم |
| manufacturing | oee | API Route | /manufacturing/oee | مكتمل | نقطة نهاية برمجية |
| manufacturing | orders | UI Page | /manufacturing/orders | مكتمل | صفحة مستخدم |
| manufacturing | orders | API Route | /manufacturing/orders | مكتمل | نقطة نهاية برمجية |
| manufacturing | orders | API Route | /manufacturing/orders/[id] | مكتمل | نقطة نهاية برمجية |
| manufacturing | orders | API Route | /manufacturing/orders/[id]/schedule | مكتمل | نقطة نهاية برمجية |
| manufacturing | main | UI Page | /manufacturing | مكتمل | صفحة مستخدم |
| manufacturing | main | API Route | /manufacturing | مكتمل | نقطة نهاية برمجية |
| manufacturing | main | Service/Engine | bom.service.ts | مكتمل | خدمة خلفية |
| manufacturing | main | Service/Engine | capacity-planning.service.ts | مكتمل | خدمة خلفية |
| manufacturing | main | Service/Engine | mrp.service.ts | مكتمل | خدمة خلفية |
| manufacturing | main | Service/Engine | routing.service.ts | مكتمل | خدمة خلفية |
| manufacturing | main | Service/Engine | shop-floor.service.ts | مكتمل | خدمة خلفية |
| manufacturing | main | Service/Engine | subcontracting.service.ts | مكتمل | خدمة خلفية |
| manufacturing | main | Service/Engine | wip.service.ts | مكتمل | خدمة خلفية |
| manufacturing | main | Service/Engine | yield.service.ts | مكتمل | خدمة خلفية |
| manufacturing | plm | UI Page | /manufacturing/plm | UI only (يحتاج ربط API) | صفحة مستخدم |
| manufacturing | qc | UI Page | /manufacturing/qc | مكتمل | صفحة مستخدم |
| manufacturing | qc | API Route | /manufacturing/qc | مكتمل | نقطة نهاية برمجية |
| manufacturing | quality | UI Page | /manufacturing/quality | مكتمل | صفحة مستخدم |
| manufacturing | quality | API Route | /manufacturing/quality | مكتمل | نقطة نهاية برمجية |
| manufacturing | routing | UI Page | /manufacturing/routing | مكتمل | صفحة مستخدم |
| manufacturing | routing | API Route | /manufacturing/routing | مكتمل | نقطة نهاية برمجية |
| manufacturing | scheduler | UI Page | /manufacturing/scheduler | مكتمل | صفحة مستخدم |
| manufacturing | scheduler | API Route | /manufacturing/scheduler | مكتمل | نقطة نهاية برمجية |
| manufacturing | scrap | UI Page | /manufacturing/scrap | مكتمل | صفحة مستخدم |
| manufacturing | scrap | API Route | /manufacturing/scrap | مكتمل | نقطة نهاية برمجية |
| manufacturing | standard-cost | UI Page | /manufacturing/standard-cost | مكتمل | صفحة مستخدم |
| manufacturing | standard-cost | API Route | /manufacturing/standard-cost | مكتمل | نقطة نهاية برمجية |
| manufacturing | subcontracting | UI Page | /manufacturing/subcontracting | مكتمل | صفحة مستخدم |
| manufacturing | subcontracting | API Route | /manufacturing/subcontracting | مكتمل | نقطة نهاية برمجية |
| manufacturing | variance | UI Page | /manufacturing/variance | مكتمل | صفحة مستخدم |
| manufacturing | variance | API Route | /manufacturing/variance | مكتمل | نقطة نهاية برمجية |
| manufacturing | work-centers | UI Page | /manufacturing/work-centers | مكتمل | صفحة مستخدم |
| manufacturing | work-centers | API Route | /manufacturing/work-centers | مكتمل | نقطة نهاية برمجية |
| manufacturing | work-orders | UI Page | /manufacturing/work-orders | مكتمل | صفحة مستخدم |
| manufacturing | work-orders | API Route | /manufacturing/work-orders | مكتمل | نقطة نهاية برمجية |
| manufacturing | eco | API Route | /manufacturing/eco | Backend only | نقطة نهاية برمجية |
| manufacturing | kanban | API Route | /manufacturing/kanban | Backend only | نقطة نهاية برمجية |
| manufacturing | mes | API Route | /manufacturing/mes | Backend only | نقطة نهاية برمجية |
| manufacturing | mps | API Route | /manufacturing/mps/generate | Backend only | نقطة نهاية برمجية |
| manufacturing | mrp | API Route | /manufacturing/mrp | Backend only | نقطة نهاية برمجية |
| manufacturing | mrp-run | API Route | /manufacturing/mrp-run | Backend only | نقطة نهاية برمجية |
| manufacturing | quality-control | API Route | /manufacturing/quality-control | Backend only | نقطة نهاية برمجية |
| manufacturing | quality-management | API Route | /manufacturing/quality-management | Backend only | نقطة نهاية برمجية |
| manufacturing | recipes | API Route | /manufacturing/recipes | Backend only | نقطة نهاية برمجية |
| manufacturing | recipes | API Route | /manufacturing/recipes/[id] | Backend only | نقطة نهاية برمجية |
| manufacturing | shopfloor | API Route | /manufacturing/shopfloor | Backend only | نقطة نهاية برمجية |
| manufacturing | sop | API Route | /manufacturing/sop | Backend only | نقطة نهاية برمجية |
| manufacturing | spc | API Route | /manufacturing/spc | Backend only | نقطة نهاية برمجية |
| manufacturing | stats | API Route | /manufacturing/stats | Backend only | نقطة نهاية برمجية |
| manufacturing | wip-valuation | API Route | /manufacturing/wip-valuation | Backend only | نقطة نهاية برمجية |
| marketing | analytics | UI Page | /marketing/analytics | UI only (يحتاج ربط API) | صفحة مستخدم |
| payments | main | UI Page | /payments | UI only (يحتاج ربط API) | صفحة مستخدم |
| payments | charge | API Route | /payments/charge | Backend only | نقطة نهاية برمجية |
| payroll | main | UI Page | /payroll | مكتمل | صفحة مستخدم |
| payroll | main | API Route | /payroll | مكتمل | نقطة نهاية برمجية |
| payroll | main | Service/Engine | advances.service.ts | مكتمل | خدمة خلفية |
| payroll | main | Service/Engine | loans.service.ts | مكتمل | خدمة خلفية |
| payroll | main | Service/Engine | multi-bank-wps.service.ts | مكتمل | خدمة خلفية |
| payroll | main | Service/Engine | payroll-posting.service.ts | مكتمل | خدمة خلفية |
| payroll | main | Service/Engine | payslip.service.ts | مكتمل | خدمة خلفية |
| payroll | main | Service/Engine | provisions.service.ts | مكتمل | خدمة خلفية |
| payroll | main | Service/Engine | reconciliation.service.ts | مكتمل | خدمة خلفية |
| payroll | main | Service/Engine | salary-structure.service.ts | مكتمل | خدمة خلفية |
| payroll | main | Service/Engine | variable-pay.service.ts | مكتمل | خدمة خلفية |
| payroll | wps | UI Page | /payroll/wps | مكتمل | صفحة مستخدم |
| payroll | wps | API Route | /payroll/wps/generate | مكتمل | نقطة نهاية برمجية |
| payroll | wps | API Route | /payroll/wps/history | مكتمل | نقطة نهاية برمجية |
| payroll | wps | API Route | /payroll/wps | مكتمل | نقطة نهاية برمجية |
| payroll | wps | API Route | /payroll/wps/[batchId]/download | مكتمل | نقطة نهاية برمجية |
| payroll | wps | API Route | /payroll/wps/[batchId]/mark-uploaded | مكتمل | نقطة نهاية برمجية |
| payroll | calculate | API Route | /payroll/calculate | Backend only | نقطة نهاية برمجية |
| payroll | provisions | API Route | /payroll/provisions/run | Backend only | نقطة نهاية برمجية |
| payroll | runs | API Route | /payroll/runs/[id]/post | Backend only | نقطة نهاية برمجية |
| payroll | [id] | API Route | /payroll/[id] | Backend only | نقطة نهاية برمجية |
| pdpl | main | UI Page | /pdpl | UI only (يحتاج ربط API) | صفحة مستخدم |
| pdpl | breach | API Route | /pdpl/breach | Backend only | نقطة نهاية برمجية |
| pdpl | breach | API Route | /pdpl/breach/[id] | Backend only | نقطة نهاية برمجية |
| pdpl | dsr | API Route | /pdpl/dsr | Backend only | نقطة نهاية برمجية |
| pdpl | dsr | API Route | /pdpl/dsr/[id]/fulfill | Backend only | نقطة نهاية برمجية |
| pdpl | dsr | API Route | /pdpl/dsr/[id] | Backend only | نقطة نهاية برمجية |
| pharmacy | drug-interact | UI Page | /pharmacy/drug-interact | UI only (يحتاج ربط API) | صفحة مستخدم |
| pharmacy | manager | UI Page | /pharmacy/manager | UI only (يحتاج ربط API) | صفحة مستخدم |
| pharmacy | main | UI Page | /pharmacy | UI only (يحتاج ربط API) | صفحة مستخدم |
| pharmacy | drug-interactions | API Route | /pharmacy/drug-interactions | Backend only | نقطة نهاية برمجية |
| pharmacy | drugs | API Route | /pharmacy/drugs | Backend only | نقطة نهاية برمجية |
| pharmacy | insurance | API Route | /pharmacy/insurance/journal | Backend only | نقطة نهاية برمجية |
| pharmacy | insurance | API Route | /pharmacy/insurance | Backend only | نقطة نهاية برمجية |
| pharmacy | patients | API Route | /pharmacy/patients | Backend only | نقطة نهاية برمجية |
| pharmacy | prescriptions | API Route | /pharmacy/prescriptions | Backend only | نقطة نهاية برمجية |
| planning | main | UI Page | /planning | UI only (يحتاج ربط API) | صفحة مستخدم |
| planning | slots | API Route | /planning/slots | Backend only | نقطة نهاية برمجية |
| portal | main | UI Page | /portal | UI only (يحتاج ربط API) | صفحة مستخدم |
| portal | customer | API Route | /portal/customer | Backend only | نقطة نهاية برمجية |
| portal | messages | API Route | /portal/messages | Backend only | نقطة نهاية برمجية |
| portal | users | API Route | /portal/users | Backend only | نقطة نهاية برمجية |
| portal | vendor | API Route | /portal/vendor/rfq/[id]/bid | Backend only | نقطة نهاية برمجية |
| نقاط البيع | accountant | UI Page | /pos/accountant | مكتمل | صفحة مستخدم |
| نقاط البيع | accountant | API Route | /pos/accountant | مكتمل | نقطة نهاية برمجية |
| نقاط البيع | offline | UI Page | /pos/offline | UI only (يحتاج ربط API) | صفحة مستخدم |
| نقاط البيع | main | UI Page | /pos | مكتمل | صفحة مستخدم |
| نقاط البيع | main | API Route | /pos | مكتمل | نقطة نهاية برمجية |
| نقاط البيع | bnpl | API Route | /pos/bnpl | Backend only | نقطة نهاية برمجية |
| نقاط البيع | bnpl | API Route | /pos/bnpl/status | Backend only | نقطة نهاية برمجية |
| نقاط البيع | checkout | API Route | /pos/checkout | Backend only | نقطة نهاية برمجية |
| نقاط البيع | pending-orders | API Route | /pos/pending-orders | Backend only | نقطة نهاية برمجية |
| نقاط البيع | products | API Route | /pos/products | Backend only | نقطة نهاية برمجية |
| نقاط البيع | restaurant | API Route | /pos/restaurant/floor | Backend only | نقطة نهاية برمجية |
| نقاط البيع | restaurant | API Route | /pos/restaurant/kds | Backend only | نقطة نهاية برمجية |
| نقاط البيع | restaurant | API Route | /pos/restaurant/tables | Backend only | نقطة نهاية برمجية |
| نقاط البيع | sessions | API Route | /pos/sessions/close | Backend only | نقطة نهاية برمجية |
| نقاط البيع | sessions | API Route | /pos/sessions/movement | Backend only | نقطة نهاية برمجية |
| نقاط البيع | sessions | API Route | /pos/sessions/open | Backend only | نقطة نهاية برمجية |
| نقاط البيع | sync | API Route | /pos/sync | Backend only | نقطة نهاية برمجية |
| pos-dashboard | main | UI Page | /pos-dashboard | UI only (يحتاج ربط API) | صفحة مستخدم |
| pos-demo | main | UI Page | /pos-demo | UI only (يحتاج ربط API) | صفحة مستخدم |
| price-quotes | main | UI Page | /price-quotes | مكتمل | صفحة مستخدم |
| price-quotes | main | API Route | /price-quotes | مكتمل | نقطة نهاية برمجية |
| procurement | contracts | UI Page | /procurement/contracts | مكتمل | صفحة مستخدم |
| procurement | contracts | API Route | /procurement/contracts | مكتمل | نقطة نهاية برمجية |
| procurement | price-comparison | UI Page | /procurement/price-comparison | UI only (يحتاج ربط API) | صفحة مستخدم |
| procurement | rfq | UI Page | /procurement/rfq/[id] | مكتمل | صفحة مستخدم |
| procurement | rfq | API Route | /procurement/rfq/[id]/award | مكتمل | نقطة نهاية برمجية |
| procurement | rfq | API Route | /procurement/rfq/[id]/comparison | مكتمل | نقطة نهاية برمجية |
| procurement | rfq | API Route | /procurement/rfq/[id]/invite | مكتمل | نقطة نهاية برمجية |
| procurement | rfq | API Route | /procurement/rfq/[id] | مكتمل | نقطة نهاية برمجية |
| procurement | spend-analytics | UI Page | /procurement/spend-analytics | مكتمل | صفحة مستخدم |
| procurement | spend-analytics | API Route | /procurement/spend-analytics | مكتمل | نقطة نهاية برمجية |
| procurement | supplier-contracts | UI Page | /procurement/supplier-contracts | مكتمل | صفحة مستخدم |
| procurement | supplier-contracts | API Route | /procurement/supplier-contracts | مكتمل | نقطة نهاية برمجية |
| procurement | vendor-portal | UI Page | /procurement/vendor-portal | مكتمل | صفحة مستخدم |
| procurement | vendor-portal | API Route | /procurement/vendor-portal | مكتمل | نقطة نهاية برمجية |
| procurement | vendor-scorecard | UI Page | /procurement/vendor-scorecard | UI only (يحتاج ربط API) | صفحة مستخدم |
| procurement | vendors | UI Page | /procurement/vendors/scorecard | مكتمل | صفحة مستخدم |
| procurement | vendors | API Route | /procurement/vendors/scorecard | مكتمل | نقطة نهاية برمجية |
| procurement | ap-ocr | API Route | /procurement/ap-ocr | Backend only | نقطة نهاية برمجية |
| procurement | auto-draft | API Route | /procurement/auto-draft | Backend only | نقطة نهاية برمجية |
| procurement | blanket-po | API Route | /procurement/blanket-po | Backend only | نقطة نهاية برمجية |
| procurement | dropship | API Route | /procurement/dropship | Backend only | نقطة نهاية برمجية |
| procurement | reverse-auction | API Route | /procurement/reverse-auction | Backend only | نقطة نهاية برمجية |
| procurement | rma | API Route | /procurement/rma | Backend only | نقطة نهاية برمجية |
| procurement | supplier-portal | API Route | /procurement/supplier-portal | Backend only | نقطة نهاية برمجية |
| procurement | vendor-onboarding | API Route | /procurement/vendor-onboarding | Backend only | نقطة نهاية برمجية |
| products | main | UI Page | /products | مكتمل | صفحة مستخدم |
| products | main | API Route | /products | مكتمل | نقطة نهاية برمجية |
| products | export | API Route | /products/export | Backend only | نقطة نهاية برمجية |
| products | import | API Route | /products/import | Backend only | نقطة نهاية برمجية |
| products | [id] | API Route | /products/[id] | Backend only | نقطة نهاية برمجية |
| profile | security | UI Page | /profile/security | UI only (يحتاج ربط API) | صفحة مستخدم |
| projects | main | UI Page | /projects | UI only (يحتاج ربط API) | صفحة مستخدم |
| projects | main | Service/Engine | construction.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| projects | main | Service/Engine | costing.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| projects | main | Service/Engine | profitability.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| projects | main | Service/Engine | resource.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| projects | main | Service/Engine | revenue.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| projects | main | Service/Engine | timesheet.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| projects | main | Service/Engine | wbs.service.ts | UI only (يحتاج ربط API) | خدمة خلفية |
| projects | advanced | API Route | /projects/advanced | Backend only | نقطة نهاية برمجية |
| projects | evm | API Route | /projects/evm | Backend only | نقطة نهاية برمجية |
| projects | milestones | API Route | /projects/milestones | Backend only | نقطة نهاية برمجية |
| projects | phases | API Route | /projects/phases | Backend only | نقطة نهاية برمجية |
| projects | resources | API Route | /projects/resources | Backend only | نقطة نهاية برمجية |
| projects | risks | API Route | /projects/risks | Backend only | نقطة نهاية برمجية |
| projects | time-entries | API Route | /projects/time-entries | Backend only | نقطة نهاية برمجية |
| promotions | main | UI Page | /promotions | مكتمل | صفحة مستخدم |
| promotions | main | API Route | /promotions | مكتمل | نقطة نهاية برمجية |
| purchase-orders | main | UI Page | /purchase-orders | مكتمل | صفحة مستخدم |
| purchase-orders | main | API Route | /purchase-orders | مكتمل | نقطة نهاية برمجية |
| purchase-orders | [id] | UI Page | /purchase-orders/[id]/landed-costs | مكتمل | صفحة مستخدم |
| purchase-orders | [id] | API Route | /purchase-orders/[id]/landed-costs | مكتمل | نقطة نهاية برمجية |
| purchase-orders | [id] | API Route | /purchase-orders/[id] | مكتمل | نقطة نهاية برمجية |
| purchase-returns | main | UI Page | /purchase-returns | مكتمل | صفحة مستخدم |
| purchase-returns | main | API Route | /purchase-returns | مكتمل | نقطة نهاية برمجية |
| المشتريات | grn | UI Page | /purchases/grn | مكتمل | صفحة مستخدم |
| المشتريات | grn | API Route | /purchases/grn | مكتمل | نقطة نهاية برمجية |
| المشتريات | landed-cost | UI Page | /purchases/landed-cost/[poId] | UI only (يحتاج ربط API) | صفحة مستخدم |
| المشتريات | letters-of-credit | UI Page | /purchases/letters-of-credit | مكتمل | صفحة مستخدم |
| المشتريات | letters-of-credit | API Route | /purchases/letters-of-credit/landed-costs | مكتمل | نقطة نهاية برمجية |
| المشتريات | letters-of-credit | API Route | /purchases/letters-of-credit | مكتمل | نقطة نهاية برمجية |
| المشتريات | letters-of-credit | API Route | /purchases/letters-of-credit/[id] | مكتمل | نقطة نهاية برمجية |
| المشتريات | matching | UI Page | /purchases/matching | مكتمل | صفحة مستخدم |
| المشتريات | matching | API Route | /purchases/matching | مكتمل | نقطة نهاية برمجية |
| المشتريات | matching | API Route | /purchases/matching/[id]/resolve | مكتمل | نقطة نهاية برمجية |
| المشتريات | options | UI Page | /purchases/options | UI only (يحتاج ربط API) | صفحة مستخدم |
| المشتريات | orders | UI Page | /purchases/orders | UI only (يحتاج ربط API) | صفحة مستخدم |
| المشتريات | main | UI Page | /purchases | مكتمل | صفحة مستخدم |
| المشتريات | main | API Route | /purchases | مكتمل | نقطة نهاية برمجية |
| المشتريات | main | Service/Engine | catalog.service.ts | مكتمل | خدمة خلفية |
| المشتريات | main | Service/Engine | contract.service.ts | مكتمل | خدمة خلفية |
| المشتريات | main | Service/Engine | p2p.service.ts | مكتمل | خدمة خلفية |
| المشتريات | main | Service/Engine | rfq.service.ts | مكتمل | خدمة خلفية |
| المشتريات | main | Service/Engine | spend-analysis.service.ts | مكتمل | خدمة خلفية |
| المشتريات | main | Service/Engine | vendor-scorecard.service.ts | مكتمل | خدمة خلفية |
| المشتريات | requisitions | UI Page | /purchases/requisitions | مكتمل | صفحة مستخدم |
| المشتريات | requisitions | API Route | /purchases/requisitions | مكتمل | نقطة نهاية برمجية |
| المشتريات | rfq | UI Page | /purchases/rfq | مكتمل | صفحة مستخدم |
| المشتريات | rfq | API Route | /purchases/rfq | مكتمل | نقطة نهاية برمجية |
| المشتريات | three-way-match | UI Page | /purchases/three-way-match | مكتمل | صفحة مستخدم |
| المشتريات | three-way-match | API Route | /purchases/three-way-match | مكتمل | نقطة نهاية برمجية |
| المشتريات | drop-ship | API Route | /purchases/drop-ship | Backend only | نقطة نهاية برمجية |
| المشتريات | gr-ir-clear | API Route | /purchases/gr-ir-clear/preview | Backend only | نقطة نهاية برمجية |
| المشتريات | ocr | API Route | /purchases/ocr | Backend only | نقطة نهاية برمجية |
| المشتريات | po | API Route | /purchases/po/[id]/landed-costs | Backend only | نقطة نهاية برمجية |
| المشتريات | po | API Route | /purchases/po/[id]/landed-costs/[costId]/allocate | Backend only | نقطة نهاية برمجية |
| المشتريات | po | API Route | /purchases/po/[id] | Backend only | نقطة نهاية برمجية |
| المشتريات | [id] | API Route | /purchases/[id]/receive | Backend only | نقطة نهاية برمجية |
| quality | inspections | UI Page | /quality/inspections | UI only (يحتاج ربط API) | صفحة مستخدم |
| quality | ncrs | UI Page | /quality/ncrs | UI only (يحتاج ربط API) | صفحة مستخدم |
| quality | main | UI Page | /quality | UI only (يحتاج ربط API) | صفحة مستخدم |
| quality | calibration | API Route | /quality/calibration | Backend only | نقطة نهاية برمجية |
| quality | stats | API Route | /quality/stats | Backend only | نقطة نهاية برمجية |
| rebates | main | UI Page | /rebates | مكتمل | صفحة مستخدم |
| rebates | main | API Route | /rebates | مكتمل | نقطة نهاية برمجية |
| receipt-vouchers | main | UI Page | /receipt-vouchers | UI only (يحتاج ربط API) | صفحة مستخدم |
| recurring-invoices | main | UI Page | /recurring-invoices | مكتمل | صفحة مستخدم |
| recurring-invoices | main | API Route | /recurring-invoices | مكتمل | نقطة نهاية برمجية |
| rem | installments | UI Page | /rem/installments | مكتمل | صفحة مستخدم |
| rem | installments | API Route | /rem/installments | مكتمل | نقطة نهاية برمجية |
| rem | leases | UI Page | /rem/leases | مكتمل | صفحة مستخدم |
| rem | leases | API Route | /rem/leases | مكتمل | نقطة نهاية برمجية |
| rem | main | UI Page | /rem | UI only (يحتاج ربط API) | صفحة مستخدم |
| rent | main | UI Page | /rent | مكتمل | صفحة مستخدم |
| rent | main | API Route | /rent | مكتمل | نقطة نهاية برمجية |
| rental | agreements | UI Page | /rental/agreements | مكتمل | صفحة مستخدم |
| rental | agreements | API Route | /rental/agreements | مكتمل | نقطة نهاية برمجية |
| rental | returns | API Route | /rental/returns | Backend only | نقطة نهاية برمجية |
| التقارير | 104-modules | UI Page | /reports/104-modules | UI only (يحتاج ربط API) | صفحة مستخدم |
| التقارير | 73-modules | UI Page | /reports/73-modules | UI only (يحتاج ربط API) | صفحة مستخدم |
| التقارير | aging | UI Page | /reports/aging | مكتمل | صفحة مستخدم |
| التقارير | aging | API Route | /reports/aging | مكتمل | نقطة نهاية برمجية |
| التقارير | allocations | UI Page | /reports/allocations | UI only (يحتاج ربط API) | صفحة مستخدم |
| التقارير | bi-cube | UI Page | /reports/bi-cube | UI only (يحتاج ربط API) | صفحة مستخدم |
| التقارير | budget-variance | UI Page | /reports/budget-variance | UI only (يحتاج ربط API) | صفحة مستخدم |
| التقارير | builder | UI Page | /reports/builder | UI only (يحتاج ربط API) | صفحة مستخدم |
| التقارير | cashflow | UI Page | /reports/cashflow | UI only (يحتاج ربط API) | صفحة مستخدم |
| التقارير | consolidation | UI Page | /reports/consolidation | UI only (يحتاج ربط API) | صفحة مستخدم |
| التقارير | customer-statement | UI Page | /reports/customer-statement | مكتمل | صفحة مستخدم |
| التقارير | customer-statement | API Route | /reports/customer-statement | مكتمل | نقطة نهاية برمجية |
| التقارير | expiry | UI Page | /reports/expiry | UI only (يحتاج ربط API) | صفحة مستخدم |
| التقارير | footnotes | UI Page | /reports/footnotes | UI only (يحتاج ربط API) | صفحة مستخدم |
| التقارير | fraud-ai | UI Page | /reports/fraud-ai | UI only (يحتاج ربط API) | صفحة مستخدم |
| التقارير | kpi-builder | UI Page | /reports/kpi-builder | UI only (يحتاج ربط API) | صفحة مستخدم |
| التقارير | manual-purchases | UI Page | /reports/manual-purchases | UI only (يحتاج ربط API) | صفحة مستخدم |
| التقارير | main | UI Page | /reports | UI only (يحتاج ربط API) | صفحة مستخدم |
| التقارير | pivot | UI Page | /reports/pivot | UI only (يحتاج ربط API) | صفحة مستخدم |
| التقارير | returns | UI Page | /reports/returns | مكتمل | صفحة مستخدم |
| التقارير | returns | API Route | /reports/returns | مكتمل | نقطة نهاية برمجية |
| التقارير | segments | UI Page | /reports/segments | UI only (يحتاج ربط API) | صفحة مستخدم |
| التقارير | zatca-vat | UI Page | /reports/zatca-vat | مكتمل | صفحة مستخدم |
| التقارير | zatca-vat | API Route | /reports/zatca-vat | مكتمل | نقطة نهاية برمجية |
| التقارير | bi-export | API Route | /reports/bi-export | Backend only | نقطة نهاية برمجية |
| التقارير | cash-flow | API Route | /reports/cash-flow | Backend only | نقطة نهاية برمجية |
| التقارير | dimensional-gl | API Route | /reports/dimensional-gl | Backend only | نقطة نهاية برمجية |
| التقارير | export | API Route | /reports/export | Backend only | نقطة نهاية برمجية |
| التقارير | financial-statements | API Route | /reports/financial-statements/generate | Backend only | نقطة نهاية برمجية |
| التقارير | what-if | API Route | /reports/what-if | Backend only | نقطة نهاية برمجية |
| التقارير | [type] | API Route | /reports/[type] | Backend only | نقطة نهاية برمجية |
| restaurant-pos | main | UI Page | /restaurant-pos | UI only (يحتاج ربط API) | صفحة مستخدم |
| restaurant-tables | main | UI Page | /restaurant-tables | UI only (يحتاج ربط API) | صفحة مستخدم |
| salaries | main | UI Page | /salaries | مكتمل | صفحة مستخدم |
| salaries | main | API Route | /salaries | مكتمل | نقطة نهاية برمجية |
| المبيعات | analytics | UI Page | /sales/analytics | UI only (يحتاج ربط API) | صفحة مستخدم |
| المبيعات | atp-simulator | UI Page | /sales/atp-simulator | UI only (يحتاج ربط API) | صفحة مستخدم |
| المبيعات | cash-application | UI Page | /sales/cash-application | UI only (يحتاج ربط API) | صفحة مستخدم |
| المبيعات | commissions | UI Page | /sales/commissions | مكتمل | صفحة مستخدم |
| المبيعات | commissions | API Route | /sales/commissions/calculate | مكتمل | نقطة نهاية برمجية |
| المبيعات | commissions | API Route | /sales/commissions | مكتمل | نقطة نهاية برمجية |
| المبيعات | commissions | API Route | /sales/commissions/rules | مكتمل | نقطة نهاية برمجية |
| المبيعات | commissions | API Route | /sales/commissions/run | مكتمل | نقطة نهاية برمجية |
| المبيعات | cpq | UI Page | /sales/cpq | UI only (يحتاج ربط API) | صفحة مستخدم |
| المبيعات | debit-notes | UI Page | /sales/debit-notes | UI only (يحتاج ربط API) | صفحة مستخدم |
| المبيعات | delivery-notes | UI Page | /sales/delivery-notes | مكتمل | صفحة مستخدم |
| المبيعات | delivery-notes | API Route | /sales/delivery-notes | مكتمل | نقطة نهاية برمجية |
| المبيعات | forecast | UI Page | /sales/forecast | مكتمل | صفحة مستخدم |
| المبيعات | forecast | API Route | /sales/forecast | مكتمل | نقطة نهاية برمجية |
| المبيعات | history | UI Page | /sales/history | UI only (يحتاج ربط API) | صفحة مستخدم |
| المبيعات | options | UI Page | /sales/options | UI only (يحتاج ربط API) | صفحة مستخدم |
| المبيعات | orders | UI Page | /sales/orders/create | UI only (يحتاج ربط API) | صفحة مستخدم |
| المبيعات | orders | UI Page | /sales/orders | UI only (يحتاج ربط API) | صفحة مستخدم |
| المبيعات | main | UI Page | /sales | مكتمل | صفحة مستخدم |
| المبيعات | main | API Route | /sales | مكتمل | نقطة نهاية برمجية |
| المبيعات | main | Service/Engine | commission.service.ts | مكتمل | خدمة خلفية |
| المبيعات | main | Service/Engine | commissions.service.ts | مكتمل | خدمة خلفية |
| المبيعات | main | Service/Engine | crm.service.ts | مكتمل | خدمة خلفية |
| المبيعات | main | Service/Engine | invoice.service.ts | مكتمل | خدمة خلفية |
| المبيعات | main | Service/Engine | loyalty.service.ts | مكتمل | خدمة خلفية |
| المبيعات | main | Service/Engine | multi-store.service.ts | مكتمل | خدمة خلفية |
| المبيعات | main | Service/Engine | pos.service.ts | مكتمل | خدمة خلفية |
| المبيعات | main | Service/Engine | pricing.service.ts | مكتمل | خدمة خلفية |
| المبيعات | main | Service/Engine | promotions.service.ts | مكتمل | خدمة خلفية |
| المبيعات | main | Service/Engine | quote-to-cash.service.ts | مكتمل | خدمة خلفية |
| المبيعات | main | Service/Engine | returns.service.ts | مكتمل | خدمة خلفية |
| المبيعات | pricing | UI Page | /sales/pricing | مكتمل | صفحة مستخدم |
| المبيعات | pricing | API Route | /sales/pricing/calculate | مكتمل | نقطة نهاية برمجية |
| المبيعات | pricing | API Route | /sales/pricing | مكتمل | نقطة نهاية برمجية |
| المبيعات | returns | UI Page | /sales/returns/rma | مكتمل | صفحة مستخدم |
| المبيعات | returns | API Route | /sales/returns | مكتمل | نقطة نهاية برمجية |
| المبيعات | returns | API Route | /sales/returns/[id]/[action] | مكتمل | نقطة نهاية برمجية |
| المبيعات | routes | UI Page | /sales/routes | مكتمل | صفحة مستخدم |
| المبيعات | routes | API Route | /sales/routes | مكتمل | نقطة نهاية برمجية |
| المبيعات | smart-map | UI Page | /sales/smart-map | UI only (يحتاج ربط API) | صفحة مستخدم |
| المبيعات | statements | UI Page | /sales/statements | مكتمل | صفحة مستخدم |
| المبيعات | statements | API Route | /sales/statements/bulk | مكتمل | نقطة نهاية برمجية |
| المبيعات | targets | UI Page | /sales/targets | مكتمل | صفحة مستخدم |
| المبيعات | targets | API Route | /sales/targets | مكتمل | نقطة نهاية برمجية |
| المبيعات | terminal | UI Page | /sales/terminal | UI only (يحتاج ربط API) | صفحة مستخدم |
| المبيعات | atp | API Route | /sales/atp/check | Backend only | نقطة نهاية برمجية |
| المبيعات | invoices | API Route | /sales/invoices | Backend only | نقطة نهاية برمجية |
| المبيعات | quotes | API Route | /sales/quotes/[id]/accept | Backend only | نقطة نهاية برمجية |
| المبيعات | quotes | API Route | /sales/quotes/[id]/convert-to-so | Backend only | نقطة نهاية برمجية |
| المبيعات | quotes | API Route | /sales/quotes/[id]/revise | Backend only | نقطة نهاية برمجية |
| المبيعات | rma | API Route | /sales/rma | Backend only | نقطة نهاية برمجية |
| المبيعات | rma | API Route | /sales/rma/[id]/approve | Backend only | نقطة نهاية برمجية |
| sales-returns | main | UI Page | /sales-returns | مكتمل | صفحة مستخدم |
| sales-returns | main | API Route | /sales-returns | مكتمل | نقطة نهاية برمجية |
| school | attendance | UI Page | /school/attendance | UI only (يحتاج ربط API) | صفحة مستخدم |
| school | dashboard | UI Page | /school/dashboard | UI only (يحتاج ربط API) | صفحة مستخدم |
| school | exams | UI Page | /school/exams | UI only (يحتاج ربط API) | صفحة مستخدم |
| school | main | UI Page | /school | مكتمل | صفحة مستخدم |
| school | main | API Route | /school | مكتمل | نقطة نهاية برمجية |
| school | schedule | UI Page | /school/schedule | UI only (يحتاج ربط API) | صفحة مستخدم |
| school | stages | UI Page | /school/stages | UI only (يحتاج ربط API) | صفحة مستخدم |
| school | transport | UI Page | /school/transport | UI only (يحتاج ربط API) | صفحة مستخدم |
| scm | main | UI Page | /scm | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإعدادات | approvals | UI Page | /settings/approvals | مكتمل | صفحة مستخدم |
| الإعدادات | approvals | API Route | /settings/approvals | مكتمل | نقطة نهاية برمجية |
| الإعدادات | approvals | API Route | /settings/approvals/[id] | مكتمل | نقطة نهاية برمجية |
| الإعدادات | bpm | UI Page | /settings/bpm | مكتمل | صفحة مستخدم |
| الإعدادات | bpm | API Route | /settings/bpm | مكتمل | نقطة نهاية برمجية |
| الإعدادات | company | UI Page | /settings/company | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإعدادات | currencies | UI Page | /settings/currencies | مكتمل | صفحة مستخدم |
| الإعدادات | currencies | API Route | /settings/currencies | مكتمل | نقطة نهاية برمجية |
| الإعدادات | currencies | API Route | /settings/currencies/[id] | مكتمل | نقطة نهاية برمجية |
| الإعدادات | custom-fields | UI Page | /settings/custom-fields | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإعدادات | dashboard-builder | UI Page | /settings/dashboard-builder | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإعدادات | import-export | UI Page | /settings/import-export | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإعدادات | number-sequences | UI Page | /settings/number-sequences | مكتمل | صفحة مستخدم |
| الإعدادات | number-sequences | API Route | /settings/number-sequences | مكتمل | نقطة نهاية برمجية |
| الإعدادات | numbering | UI Page | /settings/numbering | مكتمل | صفحة مستخدم |
| الإعدادات | numbering | API Route | /settings/numbering | مكتمل | نقطة نهاية برمجية |
| الإعدادات | main | UI Page | /settings | مكتمل | صفحة مستخدم |
| الإعدادات | main | API Route | /settings | مكتمل | نقطة نهاية برمجية |
| الإعدادات | permissions | UI Page | /settings/permissions/fields | مكتمل | صفحة مستخدم |
| الإعدادات | permissions | API Route | /settings/permissions/fields | مكتمل | نقطة نهاية برمجية |
| الإعدادات | print-templates | UI Page | /settings/print-templates | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإعدادات | roles | UI Page | /settings/roles | مكتمل | صفحة مستخدم |
| الإعدادات | roles | API Route | /settings/roles | مكتمل | نقطة نهاية برمجية |
| الإعدادات | security | UI Page | /settings/security | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإعدادات | sso | UI Page | /settings/sso | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإعدادات | state-machine | UI Page | /settings/state-machine | مكتمل | صفحة مستخدم |
| الإعدادات | state-machine | API Route | /settings/state-machine | مكتمل | نقطة نهاية برمجية |
| الإعدادات | webhooks | UI Page | /settings/webhooks | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإعدادات | whatsapp | UI Page | /settings/whatsapp | مكتمل | صفحة مستخدم |
| الإعدادات | whatsapp | API Route | /settings/whatsapp | مكتمل | نقطة نهاية برمجية |
| الإعدادات | workflow-builder | UI Page | /settings/workflow-builder | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإعدادات | zatca | UI Page | /settings/zatca | UI only (يحتاج ربط API) | صفحة مستخدم |
| الإعدادات | api-keys | API Route | /settings/api-keys | Backend only | نقطة نهاية برمجية |
| الإعدادات | api-keys | API Route | /settings/api-keys/[id] | Backend only | نقطة نهاية برمجية |
| الإعدادات | email-templates | API Route | /settings/email-templates | Backend only | نقطة نهاية برمجية |
| الإعدادات | exchange-rates | API Route | /settings/exchange-rates | Backend only | نقطة نهاية برمجية |
| الإعدادات | exchange-rates | API Route | /settings/exchange-rates/[id] | Backend only | نقطة نهاية برمجية |
| الإعدادات | generate-barcode | API Route | /settings/generate-barcode | Backend only | نقطة نهاية برمجية |
| الإعدادات | generate-keys | API Route | /settings/generate-keys | Backend only | نقطة نهاية برمجية |
| الإعدادات | scheduled-actions | API Route | /settings/scheduled-actions | Backend only | نقطة نهاية برمجية |
| الإعدادات | upload-logo | API Route | /settings/upload-logo | Backend only | نقطة نهاية برمجية |
| الإعدادات | zatca-onboard | API Route | /settings/zatca-onboard | Backend only | نقطة نهاية برمجية |
| الإعدادات | [key] | API Route | /settings/[key] | Backend only | نقطة نهاية برمجية |
| shifts | monitor | UI Page | /shifts/monitor | UI only (يحتاج ربط API) | صفحة مستخدم |
| shifts | main | UI Page | /shifts | مكتمل | صفحة مستخدم |
| shifts | main | API Route | /shifts | مكتمل | نقطة نهاية برمجية |
| shipping | main | UI Page | /shipping | مكتمل | صفحة مستخدم |
| shipping | main | API Route | /shipping | مكتمل | نقطة نهاية برمجية |
| shl | classes | UI Page | /shl/classes | مكتمل | صفحة مستخدم |
| shl | classes | API Route | /shl/classes | مكتمل | نقطة نهاية برمجية |
| shl | students | UI Page | /shl/students | مكتمل | صفحة مستخدم |
| shl | students | API Route | /shl/students | مكتمل | نقطة نهاية برمجية |
| shopfloor | main | UI Page | /shopfloor | UI only (يحتاج ربط API) | صفحة مستخدم |
| smart-transfers | main | UI Page | /smart-transfers | مكتمل | صفحة مستخدم |
| smart-transfers | main | API Route | /smart-transfers | مكتمل | نقطة نهاية برمجية |
| stock | adjustments | UI Page | /stock/adjustments | مكتمل | صفحة مستخدم |
| stock | adjustments | API Route | /stock/adjustments | مكتمل | نقطة نهاية برمجية |
| stock | movements | UI Page | /stock/movements | مكتمل | صفحة مستخدم |
| stock | movements | API Route | /stock/movements | مكتمل | نقطة نهاية برمجية |
| stock | main | UI Page | /stock | مكتمل | صفحة مستخدم |
| stock | main | API Route | /stock | مكتمل | نقطة نهاية برمجية |
| stock-transfers | main | UI Page | /stock-transfers | مكتمل | صفحة مستخدم |
| stock-transfers | main | API Route | /stock-transfers | مكتمل | نقطة نهاية برمجية |
| stocktake | main | UI Page | /stocktake | مكتمل | صفحة مستخدم |
| stocktake | main | API Route | /stocktake | مكتمل | نقطة نهاية برمجية |
| stocktake | vision | UI Page | /stocktake/vision | مكتمل | صفحة مستخدم |
| stocktake | vision | API Route | /stocktake/vision | مكتمل | نقطة نهاية برمجية |
| subscriptions | main | UI Page | /subscriptions | مكتمل | صفحة مستخدم |
| subscriptions | main | API Route | /subscriptions | مكتمل | نقطة نهاية برمجية |
| subscriptions | plans | UI Page | /subscriptions/plans | مكتمل | صفحة مستخدم |
| subscriptions | plans | API Route | /subscriptions/plans | مكتمل | نقطة نهاية برمجية |
| subscriptions | cancel | API Route | /subscriptions/cancel | Backend only | نقطة نهاية برمجية |
| subscriptions | process-renewals | API Route | /subscriptions/process-renewals | Backend only | نقطة نهاية برمجية |
| subscriptions | subscribe | API Route | /subscriptions/subscribe | Backend only | نقطة نهاية برمجية |
| supply-chain | rfx-auction | UI Page | /supply-chain/rfx-auction | مكتمل | صفحة مستخدم |
| supply-chain | rfx-auction | API Route | /supply-chain/rfx-auction | مكتمل | نقطة نهاية برمجية |
| supply-chain | vendor-onboarding | UI Page | /supply-chain/vendor-onboarding | مكتمل | صفحة مستخدم |
| supply-chain | vendor-onboarding | API Route | /supply-chain/vendor-onboarding | مكتمل | نقطة نهاية برمجية |
| support | help-desk | UI Page | /support/help-desk | UI only (يحتاج ربط API) | صفحة مستخدم |
| support | sla | UI Page | /support/sla | UI only (يحتاج ربط API) | صفحة مستخدم |
| sys | alerts | UI Page | /sys/alerts | مكتمل | صفحة مستخدم |
| sys | alerts | API Route | /sys/alerts | مكتمل | نقطة نهاية برمجية |
| sys | health | UI Page | /sys/health | مكتمل | صفحة مستخدم |
| sys | health | API Route | /sys/health | مكتمل | نقطة نهاية برمجية |
| sys | desktop-crash | API Route | /sys/desktop-crash | Backend only | نقطة نهاية برمجية |
| tax | main | UI Page | /tax | UI only (يحتاج ربط API) | صفحة مستخدم |
| tax | vat-returns | UI Page | /tax/vat-returns | UI only (يحتاج ربط API) | صفحة مستخدم |
| tax | wht | UI Page | /tax/wht | مكتمل | صفحة مستخدم |
| tax | wht | API Route | /tax/wht | مكتمل | نقطة نهاية برمجية |
| tax | zakat | UI Page | /tax/zakat | UI only (يحتاج ربط API) | صفحة مستخدم |
| tax | zatca-onboard | UI Page | /tax/zatca-onboard | UI only (يحتاج ربط API) | صفحة مستخدم |
| treasury | bank-recon | UI Page | /treasury/bank-recon | مكتمل | صفحة مستخدم |
| treasury | bank-recon | API Route | /treasury/bank-recon | مكتمل | نقطة نهاية برمجية |
| treasury | bank-reconciliation | UI Page | /treasury/bank-reconciliation | UI only (يحتاج ربط API) | صفحة مستخدم |
| treasury | cash-flow | UI Page | /treasury/cash-flow | UI only (يحتاج ربط API) | صفحة مستخدم |
| treasury | cash-forecast | UI Page | /treasury/cash-forecast | مكتمل | صفحة مستخدم |
| treasury | cash-forecast | API Route | /treasury/cash-forecast | مكتمل | نقطة نهاية برمجية |
| treasury | cash-position | UI Page | /treasury/cash-position | مكتمل | صفحة مستخدم |
| treasury | cash-position | API Route | /treasury/cash-position | مكتمل | نقطة نهاية برمجية |
| treasury | cash-position | API Route | /treasury/cash-position/snapshot | مكتمل | نقطة نهاية برمجية |
| treasury | checks | UI Page | /treasury/checks | UI only (يحتاج ربط API) | صفحة مستخدم |
| treasury | liquidity | UI Page | /treasury/liquidity | مكتمل | صفحة مستخدم |
| treasury | liquidity | API Route | /treasury/liquidity/forecast/generate | مكتمل | نقطة نهاية برمجية |
| treasury | liquidity | API Route | /treasury/liquidity/forecast | مكتمل | نقطة نهاية برمجية |
| treasury | main | UI Page | /treasury | مكتمل | صفحة مستخدم |
| treasury | main | API Route | /treasury | مكتمل | نقطة نهاية برمجية |
| treasury | main | Service/Engine | bank-reconciliation.service.ts | مكتمل | خدمة خلفية |
| treasury | main | Service/Engine | cash-flow-forecast.service.ts | مكتمل | خدمة خلفية |
| treasury | main | Service/Engine | cash-flow.service.ts | مكتمل | خدمة خلفية |
| treasury | main | Service/Engine | cash-pooling.service.ts | مكتمل | خدمة خلفية |
| treasury | main | Service/Engine | cheque.service.ts | مكتمل | خدمة خلفية |
| treasury | main | Service/Engine | lc-bg.service.ts | مكتمل | خدمة خلفية |
| treasury | main | Service/Engine | statement-import.service.ts | مكتمل | خدمة خلفية |
| treasury | petty-cash | UI Page | /treasury/petty-cash | UI only (يحتاج ربط API) | صفحة مستخدم |
| treasury | balance | API Route | /treasury/balance | Backend only | نقطة نهاية برمجية |
| treasury | bank-import | API Route | /treasury/bank-import | Backend only | نقطة نهاية برمجية |
| treasury | bank-statement | API Route | /treasury/bank-statement | Backend only | نقطة نهاية برمجية |
| treasury | bank-statements | API Route | /treasury/bank-statements | Backend only | نقطة نهاية برمجية |
| treasury | dashboard | API Route | /treasury/dashboard | Backend only | نقطة نهاية برمجية |
| treasury | recon-exceptions | API Route | /treasury/recon-exceptions | Backend only | نقطة نهاية برمجية |
| v3 | clinic | UI Page | /v3/clinic/appointments | مكتمل | صفحة مستخدم |
| v3 | clinic | UI Page | /v3/clinic/emr | مكتمل | صفحة مستخدم |
| v3 | clinic | UI Page | /v3/clinic/erx | مكتمل | صفحة مستخدم |
| v3 | clinic | UI Page | /v3/clinic/lab | مكتمل | صفحة مستخدم |
| v3 | clinic | UI Page | /v3/clinic | مكتمل | صفحة مستخدم |
| v3 | clinic | API Route | /v3/clinic/appointments | مكتمل | نقطة نهاية برمجية |
| v3 | clinic | API Route | /v3/clinic/emr | مكتمل | نقطة نهاية برمجية |
| v3 | clinic | API Route | /v3/clinic/erx | مكتمل | نقطة نهاية برمجية |
| v3 | clinic | API Route | /v3/clinic/lab | مكتمل | نقطة نهاية برمجية |
| v3 | construction | UI Page | /v3/construction/boq | مكتمل | صفحة مستخدم |
| v3 | construction | UI Page | /v3/construction | مكتمل | صفحة مستخدم |
| v3 | construction | UI Page | /v3/construction/progress-billing | مكتمل | صفحة مستخدم |
| v3 | construction | UI Page | /v3/construction/variations | مكتمل | صفحة مستخدم |
| v3 | construction | API Route | /v3/construction/boq | مكتمل | نقطة نهاية برمجية |
| v3 | construction | API Route | /v3/construction/progress-billing | مكتمل | نقطة نهاية برمجية |
| v3 | construction | API Route | /v3/construction/variations | مكتمل | نقطة نهاية برمجية |
| v3 | distribution | UI Page | /v3/distribution | مكتمل | صفحة مستخدم |
| v3 | distribution | UI Page | /v3/distribution/picking/wave | مكتمل | صفحة مستخدم |
| v3 | distribution | UI Page | /v3/distribution/routes | مكتمل | صفحة مستخدم |
| v3 | distribution | UI Page | /v3/distribution/wms | مكتمل | صفحة مستخدم |
| v3 | distribution | API Route | /v3/distribution/picking/wave | مكتمل | نقطة نهاية برمجية |
| v3 | distribution | API Route | /v3/distribution/routes | مكتمل | نقطة نهاية برمجية |
| v3 | distribution | API Route | /v3/distribution/wms | مكتمل | نقطة نهاية برمجية |
| v3 | manufacturing | UI Page | /v3/manufacturing/mrp | مكتمل | صفحة مستخدم |
| v3 | manufacturing | UI Page | /v3/manufacturing | مكتمل | صفحة مستخدم |
| v3 | manufacturing | UI Page | /v3/manufacturing/shopfloor | مكتمل | صفحة مستخدم |
| v3 | manufacturing | API Route | /v3/manufacturing/mrp | مكتمل | نقطة نهاية برمجية |
| v3 | manufacturing | API Route | /v3/manufacturing/shopfloor | مكتمل | نقطة نهاية برمجية |
| v3 | master | UI Page | /v3/master | UI only (يحتاج ربط API) | صفحة مستخدم |
| v3 | realestate | UI Page | /v3/realestate/cam | مكتمل | صفحة مستخدم |
| v3 | realestate | UI Page | /v3/realestate/leases | مكتمل | صفحة مستخدم |
| v3 | realestate | UI Page | /v3/realestate | مكتمل | صفحة مستخدم |
| v3 | realestate | API Route | /v3/realestate/leases | مكتمل | نقطة نهاية برمجية |
| v3 | restaurant | UI Page | /v3/restaurant/kds | مكتمل | صفحة مستخدم |
| v3 | restaurant | UI Page | /v3/restaurant | مكتمل | صفحة مستخدم |
| v3 | restaurant | UI Page | /v3/restaurant/tables | مكتمل | صفحة مستخدم |
| v3 | restaurant | API Route | /v3/restaurant/kds | مكتمل | نقطة نهاية برمجية |
| v3 | retail | UI Page | /v3/retail/loyalty | مكتمل | صفحة مستخدم |
| v3 | retail | UI Page | /v3/retail | مكتمل | صفحة مستخدم |
| v3 | retail | UI Page | /v3/retail/pos | مكتمل | صفحة مستخدم |
| v3 | retail | API Route | /v3/retail/pos | مكتمل | نقطة نهاية برمجية |
| v3 | school | UI Page | /v3/school/gradebook | مكتمل | صفحة مستخدم |
| v3 | school | UI Page | /v3/school | مكتمل | صفحة مستخدم |
| v3 | school | UI Page | /v3/school/sis | مكتمل | صفحة مستخدم |
| v3 | school | UI Page | /v3/school/transcripts | مكتمل | صفحة مستخدم |
| v3 | school | API Route | /v3/school/sis | مكتمل | نقطة نهاية برمجية |
| v3 | services | UI Page | /v3/services | مكتمل | صفحة مستخدم |
| v3 | services | UI Page | /v3/services/sla | مكتمل | صفحة مستخدم |
| v3 | services | UI Page | /v3/services/timesheet | مكتمل | صفحة مستخدم |
| v3 | services | UI Page | /v3/services/workorders | مكتمل | صفحة مستخدم |
| v3 | services | API Route | /v3/services/timesheet | مكتمل | نقطة نهاية برمجية |
| vacations | main | UI Page | /vacations | مكتمل | صفحة مستخدم |
| vacations | main | API Route | /vacations | مكتمل | نقطة نهاية برمجية |
| vat | main | UI Page | /vat | UI only (يحتاج ربط API) | صفحة مستخدم |
| vat | categories | API Route | /vat/categories | Backend only | نقطة نهاية برمجية |
| vendor-portal | main | UI Page | /vendor-portal | مكتمل | صفحة مستخدم |
| vendor-portal | main | API Route | /vendor-portal | مكتمل | نقطة نهاية برمجية |
| vendor-ratings | main | UI Page | /vendor-ratings | مكتمل | صفحة مستخدم |
| vendor-ratings | main | API Route | /vendor-ratings | مكتمل | نقطة نهاية برمجية |
| warehouses | alerts | UI Page | /warehouses/alerts | UI only (يحتاج ربط API) | صفحة مستخدم |
| warehouses | fifo | UI Page | /warehouses/fifo | UI only (يحتاج ربط API) | صفحة مستخدم |
| warehouses | map | UI Page | /warehouses/map | UI only (يحتاج ربط API) | صفحة مستخدم |
| warehouses | options | UI Page | /warehouses/options | UI only (يحتاج ربط API) | صفحة مستخدم |
| warehouses | main | UI Page | /warehouses | مكتمل | صفحة مستخدم |
| warehouses | main | API Route | /warehouses | مكتمل | نقطة نهاية برمجية |
| warehouses | analytics | API Route | /warehouses/analytics | Backend only | نقطة نهاية برمجية |
| warehouses | wms | API Route | /warehouses/wms | Backend only | نقطة نهاية برمجية |
| warehouses | [id] | API Route | /warehouses/[id] | Backend only | نقطة نهاية برمجية |
| warranty | main | UI Page | /warranty | UI only (يحتاج ربط API) | صفحة مستخدم |
| warranty | check | API Route | /warranty/check | Backend only | نقطة نهاية برمجية |
| whatsapp-hub | main | UI Page | /whatsapp-hub | UI only (يحتاج ربط API) | صفحة مستخدم |
| wht | main | UI Page | /wht | UI only (يحتاج ربط API) | صفحة مستخدم |
| wht | calculate | API Route | /wht/calculate | Backend only | نقطة نهاية برمجية |
| wht | form14 | API Route | /wht/form14/generate | Backend only | نقطة نهاية برمجية |
| wht | form14 | API Route | /wht/form14 | Backend only | نقطة نهاية برمجية |
| wms | waves | UI Page | /wms/waves | مكتمل | صفحة مستخدم |
| wms | waves | API Route | /wms/waves | مكتمل | نقطة نهاية برمجية |
| zakat | main | UI Page | /zakat | UI only (يحتاج ربط API) | صفحة مستخدم |
| zakat | assessments | API Route | /zakat/assessments | Backend only | نقطة نهاية برمجية |
| zakat | assessments | API Route | /zakat/assessments/[id]/adjustments | Backend only | نقطة نهاية برمجية |
| zakat | assessments | API Route | /zakat/assessments/[id]/file | Backend only | نقطة نهاية برمجية |
| zakat | assessments | API Route | /zakat/assessments/[id]/finalize | Backend only | نقطة نهاية برمجية |
| zakat | assessments | API Route | /zakat/assessments/[id] | Backend only | نقطة نهاية برمجية |
| ZATCA | main | UI Page | /zatca | مكتمل | صفحة مستخدم |
| ZATCA | main | API Route | /zatca | مكتمل | نقطة نهاية برمجية |
| ZATCA | main | Service/Engine | archive.service.ts | مكتمل | خدمة خلفية |
| ZATCA | main | Service/Engine | certificate-renewal.service.ts | مكتمل | خدمة خلفية |
| ZATCA | main | Service/Engine | compliance-test.service.ts | مكتمل | خدمة خلفية |
| ZATCA | main | Service/Engine | icv-chain.service.ts | مكتمل | خدمة خلفية |
| ZATCA | main | Service/Engine | late-submissions.service.ts | مكتمل | خدمة خلفية |
| ZATCA | main | Service/Engine | onboarding.service.ts | مكتمل | خدمة خلفية |
| ZATCA | main | Service/Engine | phase2-mode.service.ts | مكتمل | خدمة خلفية |
| ZATCA | main | Service/Engine | qr-validation.service.ts | مكتمل | خدمة خلفية |
| ZATCA | generate-request | API Route | /zatca/generate-request | Backend only | نقطة نهاية برمجية |
| ZATCA | late-submissions | API Route | /zatca/late-submissions | Backend only | نقطة نهاية برمجية |
| ZATCA | onboard | API Route | /zatca/onboard | Backend only | نقطة نهاية برمجية |
| ZATCA | qr | API Route | /zatca/qr | Backend only | نقطة نهاية برمجية |
| ZATCA | reverse-charge | API Route | /zatca/reverse-charge | Backend only | نقطة نهاية برمجية |
| ZATCA | test | API Route | /zatca/test | Backend only | نقطة نهاية برمجية |
| ZATCA | xml | API Route | /zatca/xml | Backend only | نقطة نهاية برمجية |
| _ice_archive | main | UI Page | /_ice_archive | UI only (يحتاج ربط API) | صفحة مستخدم |
| accounts | main | API Route | /accounts | Backend only | نقطة نهاية برمجية |
| adjustments | main | API Route | /adjustments | Backend only | نقطة نهاية برمجية |
| ar | credit | API Route | /ar/credit | Backend only | نقطة نهاية برمجية |
| ar | dunning | API Route | /ar/dunning | Backend only | نقطة نهاية برمجية |
| ar | main | Service/Engine | credit-management.service.ts | Service only | خدمة خلفية |
| المصادقة | 2fa | API Route | /auth/2fa/backup-codes | Backend only | نقطة نهاية برمجية |
| المصادقة | 2fa | API Route | /auth/2fa/login | Backend only | نقطة نهاية برمجية |
| المصادقة | 2fa | API Route | /auth/2fa/setup | Backend only | نقطة نهاية برمجية |
| المصادقة | 2fa | API Route | /auth/2fa/verify | Backend only | نقطة نهاية برمجية |
| المصادقة | auto-login | API Route | /auth/auto-login | Backend only | نقطة نهاية برمجية |
| المصادقة | find-tenant-by-email | API Route | /auth/find-tenant-by-email | Backend only | نقطة نهاية برمجية |
| المصادقة | login | API Route | /auth/login | Backend only | نقطة نهاية برمجية |
| المصادقة | login-by-email | API Route | /auth/login-by-email | Backend only | نقطة نهاية برمجية |
| المصادقة | me | API Route | /auth/me | Backend only | نقطة نهاية برمجية |
| المصادقة | mfa | API Route | /auth/mfa/audit-log | Backend only | نقطة نهاية برمجية |
| المصادقة | mfa | API Route | /auth/mfa/backup-verify | Backend only | نقطة نهاية برمجية |
| المصادقة | mfa | API Route | /auth/mfa/confirm | Backend only | نقطة نهاية برمجية |
| المصادقة | mfa | API Route | /auth/mfa/disable | Backend only | نقطة نهاية برمجية |
| المصادقة | mfa | API Route | /auth/mfa/enroll | Backend only | نقطة نهاية برمجية |
| المصادقة | mfa | API Route | /auth/mfa/qr-code | Backend only | نقطة نهاية برمجية |
| المصادقة | mfa | API Route | /auth/mfa/recovery | Backend only | نقطة نهاية برمجية |
| المصادقة | mfa | API Route | /auth/mfa/regenerate-codes | Backend only | نقطة نهاية برمجية |
| المصادقة | mfa | API Route | /auth/mfa/status | Backend only | نقطة نهاية برمجية |
| المصادقة | mfa | API Route | /auth/mfa/trust-device | Backend only | نقطة نهاية برمجية |
| المصادقة | mfa | API Route | /auth/mfa/trusted-devices/[id] | Backend only | نقطة نهاية برمجية |
| المصادقة | mfa | API Route | /auth/mfa/verify | Backend only | نقطة نهاية برمجية |
| المصادقة | sso | API Route | /auth/sso | Backend only | نقطة نهاية برمجية |
| المصادقة | sso-redirect | API Route | /auth/sso-redirect | Backend only | نقطة نهاية برمجية |
| المصادقة | sync | API Route | /auth/sync | Backend only | نقطة نهاية برمجية |
| المصادقة | routing | UI Page | /auth/routing | UI only (يحتاج ربط API) | صفحة مستخدم |
| b2b | checkout | API Route | /b2b/checkout | Backend only | نقطة نهاية برمجية |
| b2b | login | UI Page | /b2b/login | مكتمل | صفحة مستخدم |
| b2b | login | API Route | /b2b/login | مكتمل | نقطة نهاية برمجية |
| b2b | shop | UI Page | /b2b/shop | مكتمل | صفحة مستخدم |
| b2b | shop | API Route | /b2b/shop | مكتمل | نقطة نهاية برمجية |
| bnpl | create-session | API Route | /bnpl/create-session | Backend only | نقطة نهاية برمجية |
| bnpl | status | API Route | /bnpl/status | Backend only | نقطة نهاية برمجية |
| bnpl | tabby | API Route | /bnpl/tabby | Backend only | نقطة نهاية برمجية |
| bnpl | tamara | API Route | /bnpl/tamara | Backend only | نقطة نهاية برمجية |
| budgeting | encumbrance | API Route | /budgeting/encumbrance | Backend only | نقطة نهاية برمجية |
| budgeting | variance | API Route | /budgeting/variance | Backend only | نقطة نهاية برمجية |
| budgets | main | API Route | /budgets | Backend only | نقطة نهاية برمجية |
| budgets | scenarios | API Route | /budgets/scenarios | Backend only | نقطة نهاية برمجية |
| categories | main | API Route | /categories | Backend only | نقطة نهاية برمجية |
| categories | [id] | API Route | /categories/[id] | Backend only | نقطة نهاية برمجية |
| chains | [chain] | API Route | /chains/[chain] | Backend only | نقطة نهاية برمجية |
| check-env | main | API Route | /check-env | Backend only | نقطة نهاية برمجية |
| cron | approval-sla | API Route | /cron/approval-sla | Backend only | نقطة نهاية برمجية |
| cron | ar-collection-dunning | API Route | /cron/ar-collection-dunning | Backend only | نقطة نهاية برمجية |
| cron | backup | API Route | /cron/backup | Backend only | نقطة نهاية برمجية |
| cron | contract-expiry | API Route | /cron/contract-expiry | Backend only | نقطة نهاية برمجية |
| cron | contracts | API Route | /cron/contracts | Backend only | نقطة نهاية برمجية |
| cron | cycle-count | API Route | /cron/cycle-count | Backend only | نقطة نهاية برمجية |
| cron | daily-audit | API Route | /cron/daily-audit | Backend only | نقطة نهاية برمجية |
| cron | debts | API Route | /cron/debts | Backend only | نقطة نهاية برمجية |
| cron | depreciation-monthly | API Route | /cron/depreciation-monthly | Backend only | نقطة نهاية برمجية |
| cron | document-expiry | API Route | /cron/document-expiry | Backend only | نقطة نهاية برمجية |
| cron | ecl | API Route | /cron/ecl | Backend only | نقطة نهاية برمجية |
| cron | fx-revaluation | API Route | /cron/fx-revaluation | Backend only | نقطة نهاية برمجية |
| cron | hr | API Route | /cron/hr | Backend only | نقطة نهاية برمجية |
| cron | ifrs16-monthly | API Route | /cron/ifrs16-monthly | Backend only | نقطة نهاية برمجية |
| cron | payment-reminders | API Route | /cron/payment-reminders | Backend only | نقطة نهاية برمجية |
| cron | payroll-monthly | API Route | /cron/payroll-monthly | Backend only | نقطة نهاية برمجية |
| cron | predictive-po | API Route | /cron/predictive-po | Backend only | نقطة نهاية برمجية |
| cron | prepayments-amortization | API Route | /cron/prepayments-amortization | Backend only | نقطة نهاية برمجية |
| cron | rag-reindex | API Route | /cron/rag-reindex | Backend only | نقطة نهاية برمجية |
| cron | recurring-billing | API Route | /cron/recurring-billing | Backend only | نقطة نهاية برمجية |
| cron | rem-leases | API Route | /cron/rem-leases | Backend only | نقطة نهاية برمجية |
| cron | reorder-alerts | API Route | /cron/reorder-alerts | Backend only | نقطة نهاية برمجية |
| cron | scheduled-reports | API Route | /cron/scheduled-reports | Backend only | نقطة نهاية برمجية |
| cron | self-healer | API Route | /cron/self-healer | Backend only | نقطة نهاية برمجية |
| cron | shifts | API Route | /cron/shifts | Backend only | نقطة نهاية برمجية |
| cron | trigger-invoices | API Route | /cron/trigger-invoices | Backend only | نقطة نهاية برمجية |
| cron | vat-return-reminder | API Route | /cron/vat-return-reminder | Backend only | نقطة نهاية برمجية |
| cron | vendor-scoring | API Route | /cron/vendor-scoring | Backend only | نقطة نهاية برمجية |
| cron | zatca-batch-submit | API Route | /cron/zatca-batch-submit | Backend only | نقطة نهاية برمجية |
| cron | zatca-worker | API Route | /cron/zatca-worker | Backend only | نقطة نهاية برمجية |
| customer | table | UI Page | /customer/table/[qrToken] | مكتمل | صفحة مستخدم |
| customer | table | API Route | /customer/table/[qrToken] | مكتمل | نقطة نهاية برمجية |
| delivery-platforms | main | API Route | /delivery-platforms | Backend only | نقطة نهاية برمجية |
| desktop | trial | API Route | /desktop/trial/verify | Backend only | نقطة نهاية برمجية |
| desktop | verify-license | API Route | /desktop/verify-license | Backend only | نقطة نهاية برمجية |
| email | main | API Route | /email | Backend only | نقطة نهاية برمجية |
| explain | main | API Route | /explain | Backend only | نقطة نهاية برمجية |
| gaps | abc-costing | API Route | /gaps/abc-costing | Backend only | نقطة نهاية برمجية |
| gaps | anomaly | API Route | /gaps/anomaly | Backend only | نقطة نهاية برمجية |
| gaps | esg | API Route | /gaps/esg | Backend only | نقطة نهاية برمجية |
| gaps | evm | API Route | /gaps/evm | Backend only | نقطة نهاية برمجية |
| gaps | forecast-v2 | API Route | /gaps/forecast-v2 | Backend only | نقطة نهاية برمجية |
| grn | main | API Route | /grn | Backend only | نقطة نهاية برمجية |
| health | main | API Route | /health | Backend only | نقطة نهاية برمجية |
| help | main | API Route | /help | Backend only | نقطة نهاية برمجية |
| ice | admin | API Route | /ice/admin/2fa/disable | Backend only | نقطة نهاية برمجية |
| ice | admin | API Route | /ice/admin/2fa/enable | Backend only | نقطة نهاية برمجية |
| ice | admin | API Route | /ice/admin/2fa/generate | Backend only | نقطة نهاية برمجية |
| ice | auth | API Route | /ice/auth/2fa/verify | Backend only | نقطة نهاية برمجية |
| ice | auth | API Route | /ice/auth/login | Backend only | نقطة نهاية برمجية |
| ice | auth | API Route | /ice/auth | Backend only | نقطة نهاية برمجية |
| ice | backup | API Route | /ice/backup/download | Backend only | نقطة نهاية برمجية |
| ice | backup | API Route | /ice/backup/list | Backend only | نقطة نهاية برمجية |
| ice | backup | API Route | /ice/backup/upload | Backend only | نقطة نهاية برمجية |
| ice | desktop-licenses | API Route | /ice/desktop-licenses | Backend only | نقطة نهاية برمجية |
| ice | desktop-register | API Route | /ice/desktop-register | Backend only | نقطة نهاية برمجية |
| ice | license | API Route | /ice/license/verify | Backend only | نقطة نهاية برمجية |
| ice | subscriptions | API Route | /ice/subscriptions | Backend only | نقطة نهاية برمجية |
| ice | tenant-features | API Route | /ice/tenant-features | Backend only | نقطة نهاية برمجية |
| ice | tenants | UI Page | /ice/tenants | مكتمل | صفحة مستخدم |
| ice | tenants | API Route | /ice/tenants | مكتمل | نقطة نهاية برمجية |
| ice | toggle | API Route | /ice/toggle | Backend only | نقطة نهاية برمجية |
| ice | admins | UI Page | /ice/admins | UI only (يحتاج ربط API) | صفحة مستخدم |
| ice | audit | UI Page | /ice/audit | UI only (يحتاج ربط API) | صفحة مستخدم |
| ice | billing | UI Page | /ice/billing | UI only (يحتاج ربط API) | صفحة مستخدم |
| ice | health | UI Page | /ice/health | UI only (يحتاج ربط API) | صفحة مستخدم |
| ice | licenses | UI Page | /ice/licenses | UI only (يحتاج ربط API) | صفحة مستخدم |
| ice | login | UI Page | /ice/login/2fa | UI only (يحتاج ربط API) | صفحة مستخدم |
| ice | login | UI Page | /ice/login | UI only (يحتاج ربط API) | صفحة مستخدم |
| ice | modules | UI Page | /ice/modules | UI only (يحتاج ربط API) | صفحة مستخدم |
| ice | main | UI Page | /ice | UI only (يحتاج ربط API) | صفحة مستخدم |
| ice | settings | UI Page | /ice/settings | UI only (يحتاج ربط API) | صفحة مستخدم |
| ice | support | UI Page | /ice/support | UI only (يحتاج ربط API) | صفحة مستخدم |
| integrations | mudad | API Route | /integrations/mudad | Backend only | نقطة نهاية برمجية |
| license | verify | API Route | /license/verify | Backend only | نقطة نهاية برمجية |
| manifest | main | API Route | /manifest | Backend only | نقطة نهاية برمجية |
| master | main | UI Page | /master | مكتمل | صفحة مستخدم |
| master | main | API Route | /master | مكتمل | نقطة نهاية برمجية |
| master-panel | auth | API Route | /master-panel/auth | Backend only | نقطة نهاية برمجية |
| master-panel | deploy | API Route | /master-panel/deploy | Backend only | نقطة نهاية برمجية |
| master-panel | licenses | API Route | /master-panel/licenses | Backend only | نقطة نهاية برمجية |
| master-panel | servers | API Route | /master-panel/servers | Backend only | نقطة نهاية برمجية |
| master-panel | login | UI Page | /master-panel/login | UI only (يحتاج ربط API) | صفحة مستخدم |
| master-panel | main | UI Page | /master-panel | UI only (يحتاج ربط API) | صفحة مستخدم |
| master-panel-data | main | API Route | /master-panel-data | Backend only | نقطة نهاية برمجية |
| metrics | main | API Route | /metrics | Backend only | نقطة نهاية برمجية |
| migration | start | API Route | /migration/start | Backend only | نقطة نهاية برمجية |
| notifications | stream | API Route | /notifications/stream | Backend only | نقطة نهاية برمجية |
| open-items | allocate | API Route | /open-items/allocate/customer-allocation | Backend only | نقطة نهاية برمجية |
| open-items | allocate | API Route | /open-items/allocate/reversal | Backend only | نقطة نهاية برمجية |
| open-items | allocate | API Route | /open-items/allocate/supplier-allocation | Backend only | نقطة نهاية برمجية |
| open-items | preview | API Route | /open-items/preview/customer-allocation | Backend only | نقطة نهاية برمجية |
| open-items | preview | API Route | /open-items/preview/reversal | Backend only | نقطة نهاية برمجية |
| open-items | preview | API Route | /open-items/preview/supplier-allocation | Backend only | نقطة نهاية برمجية |
| open-items | main | API Route | /open-items | Backend only | نقطة نهاية برمجية |
| openapi | main | API Route | /openapi | Backend only | نقطة نهاية برمجية |
| packaging-units | main | API Route | /packaging-units | Backend only | نقطة نهاية برمجية |
| platform | dms | API Route | /platform/dms | Backend only | نقطة نهاية برمجية |
| platform | encryption | API Route | /platform/encryption | Backend only | نقطة نهاية برمجية |
| platform | esignature | API Route | /platform/esignature | Backend only | نقطة نهاية برمجية |
| platform | forms | API Route | /platform/forms | Backend only | نقطة نهاية برمجية |
| platform | ipaas | API Route | /platform/ipaas | Backend only | نقطة نهاية برمجية |
| platform | localization | API Route | /platform/localization | Backend only | نقطة نهاية برمجية |
| platform | reports | API Route | /platform/reports | Backend only | نقطة نهاية برمجية |
| platform | sso | API Route | /platform/sso | Backend only | نقطة نهاية برمجية |
| platform | webhooks | API Route | /platform/webhooks | Backend only | نقطة نهاية برمجية |
| portals | parent | UI Page | /portals/parent | مكتمل | صفحة مستخدم |
| portals | parent | API Route | /portals/parent | مكتمل | نقطة نهاية برمجية |
| portals | tenant | UI Page | /portals/tenant | مكتمل | صفحة مستخدم |
| portals | tenant | API Route | /portals/tenant | مكتمل | نقطة نهاية برمجية |
| product-stocks | location | API Route | /product-stocks/location | Backend only | نقطة نهاية برمجية |
| public | call-waiter | API Route | /public/call-waiter | Backend only | نقطة نهاية برمجية |
| public | menu | API Route | /public/menu | Backend only | نقطة نهاية برمجية |
| public | order | API Route | /public/order | Backend only | نقطة نهاية برمجية |
| public | table | API Route | /public/table | Backend only | نقطة نهاية برمجية |
| purchasing | three-way-match | API Route | /purchasing/three-way-match | Backend only | نقطة نهاية برمجية |
| restaurant | pos | API Route | /restaurant/pos/resolve | Backend only | نقطة نهاية برمجية |
| restaurant | pos | API Route | /restaurant/pos/status | Backend only | نقطة نهاية برمجية |
| restaurant | table | API Route | /restaurant/table/call | Backend only | نقطة نهاية برمجية |
| restaurant | table | API Route | /restaurant/table/info | Backend only | نقطة نهاية برمجية |
| restaurant | main | UI Page | /restaurant | UI only (يحتاج ربط API) | صفحة مستخدم |
| sales-orders | main | API Route | /sales-orders | Backend only | نقطة نهاية برمجية |
| sales-orders | [id] | API Route | /sales-orders/[id]/process | Backend only | نقطة نهاية برمجية |
| saudi | mudad | API Route | /saudi/mudad/compliance | Backend only | نقطة نهاية برمجية |
| saudi | nitaqat | API Route | /saudi/nitaqat/projection | Backend only | نقطة نهاية برمجية |
| saudi | qiwa | API Route | /saudi/qiwa/contracts/[employeeId] | Backend only | نقطة نهاية برمجية |
| saudi | qiwa | API Route | /saudi/qiwa/sync | Backend only | نقطة نهاية برمجية |
| saudi | saudization | API Route | /saudi/saudization/snapshot | Backend only | نقطة نهاية برمجية |
| search | semantic | API Route | /search/semantic | Backend only | نقطة نهاية برمجية |
| service | sla | API Route | /service/sla | Backend only | نقطة نهاية برمجية |
| shipments | delivery-notes | API Route | /shipments/delivery-notes | Backend only | نقطة نهاية برمجية |
| shipments | main | API Route | /shipments | Backend only | نقطة نهاية برمجية |
| stock-movements | main | API Route | /stock-movements | Backend only | نقطة نهاية برمجية |
| subscription-status | main | API Route | /subscription-status | Backend only | نقطة نهاية برمجية |
| system | comments | API Route | /system/comments | Backend only | نقطة نهاية برمجية |
| system | dashboard-builder | API Route | /system/dashboard-builder | Backend only | نقطة نهاية برمجية |
| system | dms | API Route | /system/dms | Backend only | نقطة نهاية برمجية |
| system | import-export | API Route | /system/import-export | Backend only | نقطة نهاية برمجية |
| system | kanban | API Route | /system/kanban | Backend only | نقطة نهاية برمجية |
| system | notifications | API Route | /system/notifications | Backend only | نقطة نهاية برمجية |
| system | numbering | API Route | /system/numbering | Backend only | نقطة نهاية برمجية |
| system | pivot | API Route | /system/pivot | Backend only | نقطة نهاية برمجية |
| system | print-templates | API Route | /system/print-templates | Backend only | نقطة نهاية برمجية |
| system | reset | API Route | /system/reset | Backend only | نقطة نهاية برمجية |
| system | search | API Route | /system/search | Backend only | نقطة نهاية برمجية |
| system | workflow | API Route | /system/workflow | Backend only | نقطة نهاية برمجية |
| telegram | process | API Route | /telegram/process | Backend only | نقطة نهاية برمجية |
| telegram | webhook | API Route | /telegram/webhook | Backend only | نقطة نهاية برمجية |
| tenant | check-status | API Route | /tenant/check-status | Backend only | نقطة نهاية برمجية |
| tenant | create | API Route | /tenant/create | Backend only | نقطة نهاية برمجية |
| tenant | hidden-modules | API Route | /tenant/hidden-modules | Backend only | نقطة نهاية برمجية |
| tenant | provision | API Route | /tenant/provision | Backend only | نقطة نهاية برمجية |
| tenant | seed-company | API Route | /tenant/seed-company | Backend only | نقطة نهاية برمجية |
| tenant | status | API Route | /tenant/status | Backend only | نقطة نهاية برمجية |
| tenant | trial-status | API Route | /tenant/trial-status | Backend only | نقطة نهاية برمجية |
| test | main | API Route | /test | Backend only | نقطة نهاية برمجية |
| test-runs | main | API Route | /test-runs | Backend only | نقطة نهاية برمجية |
| test-tenant | main | API Route | /test-tenant | Backend only | نقطة نهاية برمجية |
| test-translation | main | API Route | /test-translation | Backend only | نقطة نهاية برمجية |
| translate | main | API Route | /translate | Backend only | نقطة نهاية برمجية |
| transliterate | main | API Route | /transliterate | Backend only | نقطة نهاية برمجية |
| units | main | API Route | /units | Backend only | نقطة نهاية برمجية |
| upload | main | API Route | /upload | Backend only | نقطة نهاية برمجية |
| المستخدمون والصلاحيات | main | API Route | /users | Backend only | نقطة نهاية برمجية |
| v2 | sales | API Route | /v2/sales/invoices | Backend only | نقطة نهاية برمجية |
| vendors | scorecard | API Route | /vendors/scorecard | Backend only | نقطة نهاية برمجية |
| vendors | [id] | API Route | /vendors/[id]/statement | Backend only | نقطة نهاية برمجية |
| version | main | API Route | /version | Backend only | نقطة نهاية برمجية |
| warehouse | cross-dock | API Route | /warehouse/cross-dock | Backend only | نقطة نهاية برمجية |
| warehouse | slotting | API Route | /warehouse/slotting | Backend only | نقطة نهاية برمجية |
| webhooks | main | API Route | /webhooks | Backend only | نقطة نهاية برمجية |
| webhooks | main | Service/Engine | manager.ts | Backend only | خدمة خلفية |
| webhooks | salla | API Route | /webhooks/salla | Backend only | نقطة نهاية برمجية |
| webhooks | zid | API Route | /webhooks/zid | Backend only | نقطة نهاية برمجية |
| webhooks | [id] | API Route | /webhooks/[id]/rotate-secret | Backend only | نقطة نهاية برمجية |
| webhooks | [id] | API Route | /webhooks/[id] | Backend only | نقطة نهاية برمجية |
| whatsapp | interactive | API Route | /whatsapp/interactive | Backend only | نقطة نهاية برمجية |
| work-shifts | main | API Route | /work-shifts | Backend only | نقطة نهاية برمجية |
| api-docs | main | UI Page | /api-docs | UI only (يحتاج ربط API) | صفحة مستخدم |
| auto-login | main | UI Page | /auto-login | UI only (يحتاج ربط API) | صفحة مستخدم |
| billing-expired | main | UI Page | /billing-expired | UI only (يحتاج ربط API) | صفحة مستخدم |
| company-info | main | UI Page | /company-info | UI only (يحتاج ربط API) | صفحة مستخدم |
| company-setup | main | UI Page | /company-setup | UI only (يحتاج ربط API) | صفحة مستخدم |
| design1 | main | UI Page | /design1 | UI only (يحتاج ربط API) | صفحة مستخدم |
| design2 | main | UI Page | /design2 | UI only (يحتاج ربط API) | صفحة مستخدم |
| design3 | main | UI Page | /design3 | UI only (يحتاج ربط API) | صفحة مستخدم |
| design4 | main | UI Page | /design4 | UI only (يحتاج ربط API) | صفحة مستخدم |
| factory | main | UI Page | /factory | UI only (يحتاج ربط API) | صفحة مستخدم |
| features | main | UI Page | /features | UI only (يحتاج ربط API) | صفحة مستخدم |
| invoice | [id] | UI Page | /invoice/[id] | UI only (يحتاج ربط API) | صفحة مستخدم |
| kiosk | attendance | UI Page | /kiosk/attendance | UI only (يحتاج ربط API) | صفحة مستخدم |
| login | main | UI Page | /login | UI only (يحتاج ربط API) | صفحة مستخدم |
| menu | [tableId] | UI Page | /menu/[tableId] | UI only (يحتاج ربط API) | صفحة مستخدم |
| home | main | UI Page | / | UI only (يحتاج ربط API) | صفحة مستخدم |
| pricing | main | UI Page | /pricing | UI only (يحتاج ربط API) | صفحة مستخدم |
| qr-menu | [token] | UI Page | /qr-menu/[token] | UI only (يحتاج ربط API) | صفحة مستخدم |
| retail | main | UI Page | /retail | UI only (يحتاج ربط API) | صفحة مستخدم |
| sentry-example-page | main | UI Page | /sentry-example-page | UI only (يحتاج ربط API) | صفحة مستخدم |
| shop | main | UI Page | /shop | UI only (يحتاج ربط API) | صفحة مستخدم |
| sign-in | [[...sign-in]] | UI Page | /sign-in/[[...sign-in]] | UI only (يحتاج ربط API) | صفحة مستخدم |
| sign-up | [[...sign-up]] | UI Page | /sign-up/[[...sign-up]] | UI only (يحتاج ربط API) | صفحة مستخدم |
| sso-callback | main | UI Page | /sso-callback | UI only (يحتاج ربط API) | صفحة مستخدم |
| test-i18n | main | UI Page | /test-i18n | UI only (يحتاج ربط API) | صفحة مستخدم |
| trust | main | UI Page | /trust | UI only (يحتاج ربط API) | صفحة مستخدم |
| ~offline | main | UI Page | /~offline | UI only (يحتاج ربط API) | صفحة مستخدم |
| fa | main | Service/Engine | fixed-asset.service.ts | Service only | خدمة خلفية |
| gl | main | Service/Engine | account-determination.service.ts | Service only | خدمة خلفية |
| gosi | main | Service/Engine | api.service.ts | Service only | خدمة خلفية |
| gosi | main | Service/Engine | onboarding.service.ts | Service only | خدمة خلفية |
| gosi | main | Service/Engine | rates-calculator.service.ts | Service only | خدمة خلفية |
| gosi | main | Service/Engine | reconciliation.service.ts | Service only | خدمة خلفية |
| index | main | Service/Engine | index.ts | Service only | خدمة خلفية |
| payables | main | Service/Engine | payment-run.service.ts | Service only | خدمة خلفية |
| payables | main | Service/Engine | ppv-analysis.service.ts | Service only | خدمة خلفية |
| payables | main | Service/Engine | three-way-match.service.ts | Service only | خدمة خلفية |
| payables | main | Service/Engine | vendor-aging.service.ts | Service only | خدمة خلفية |
| payables | main | Service/Engine | wht.service.ts | Service only | خدمة خلفية |
| receivables | main | Service/Engine | aging-dunning.service.ts | Service only | خدمة خلفية |
| receivables | main | Service/Engine | auto-cash-application.service.ts | Service only | خدمة خلفية |
| receivables | main | Service/Engine | bad-debt.service.ts | Service only | خدمة خلفية |
| receivables | main | Service/Engine | credit-management.service.ts | Service only | خدمة خلفية |
| receivables | main | Service/Engine | customer-statement.service.ts | Service only | خدمة خلفية |
| reporting | main | Service/Engine | budget-vs-actual.service.ts | Service only | خدمة خلفية |
| reporting | main | Service/Engine | budget.service.ts | Service only | خدمة خلفية |
| reporting | main | Service/Engine | cashflow-indirect.service.ts | Service only | خدمة خلفية |
| reporting | main | Service/Engine | comparative.service.ts | Service only | خدمة خلفية |
| reporting | main | Service/Engine | custom-builder.service.ts | Service only | خدمة خلفية |
| reporting | main | Service/Engine | equity-changes.service.ts | Service only | خدمة خلفية |
| reporting | main | Service/Engine | notes-fs.service.ts | Service only | خدمة خلفية |
| reporting | main | Service/Engine | scheduled.service.ts | Service only | خدمة خلفية |
| reporting | main | Service/Engine | segment.service.ts | Service only | خدمة خلفية |
| reporting | main | Service/Engine | vat-return.service.ts | Service only | خدمة خلفية |
| reporting | main | Service/Engine | xbrl.service.ts | Service only | خدمة خلفية |
| reporting | main | Service/Engine | zakat-calculator.service.ts | Service only | خدمة خلفية |
| shared | main | Service/Engine | base.service.ts | Service only | خدمة خلفية |
| shared | main | Service/Engine | event-bus.service.ts | Service only | خدمة خلفية |
| shared | main | Service/Engine | pdpl.service.ts | Service only | خدمة خلفية |
