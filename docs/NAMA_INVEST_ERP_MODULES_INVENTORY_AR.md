# جرد الأقسام الرئيسية والفرعية في نظام Nama Invest ERP


> [!WARNING]
> هذه الوثيقة مبنية على فحص ديناميكي لمسارات المشروع، وقد تشمل أقسامًا مكتملة وأقسامًا جزئية وأقسامًا خلفية أو معطلة. الغرض منها جرد شامل وسيناريوهات تشغيلية، وليست تأكيدًا بأن كل قسم جاهز تجاريًا أو إنتاجيًا.

## قسم: المحاسبة (accounting)
- **الهدف العام:** إدارة قسم المحاسبة وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### aging-report
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /accounting/aging-report
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### allocations
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/allocations/rules
- **مسارات API:** /accounting/allocations, /accounting/allocations/run, /accounting/allocations/simulate
- **خدمات / Engines:** لا يوجد

#### bank-reconciliation
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /accounting/bank-reconciliation
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### banks
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/banks/imports, /accounting/banks, /accounting/banks/recon, /accounting/banks/[id]
- **مسارات API:** /accounting/banks/imports, /accounting/banks/recon/create-je, /accounting/banks/recon/match
- **خدمات / Engines:** لا يوجد

#### collection-workflow
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/collection-workflow
- **مسارات API:** /accounting/collection-workflow
- **خدمات / Engines:** لا يوجد

#### customer-statements
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/customer-statements/bulk, /accounting/customer-statements, /accounting/customer-statements/templates
- **مسارات API:** /accounting/customer-statements/bulk/history, /accounting/customer-statements/bulk/preview, /accounting/customer-statements/bulk/run, /accounting/customer-statements/generate-pdf, /accounting/customer-statements/preview, /accounting/customer-statements/send-email, /accounting/customer-statements/templates, /accounting/customer-statements/templates/[id]
- **خدمات / Engines:** لا يوجد

#### deferred
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/deferred
- **مسارات API:** /accounting/deferred
- **خدمات / Engines:** لا يوجد

#### dunning
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/dunning/letters, /accounting/dunning, /accounting/dunning/promises
- **مسارات API:** /accounting/dunning/daily-run, /accounting/dunning/promise-to-pay
- **خدمات / Engines:** لا يوجد

#### financial-close
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/financial-close
- **مسارات API:** /accounting/financial-close
- **خدمات / Engines:** لا يوجد

#### fixed-assets
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/fixed-assets
- **مسارات API:** /accounting/fixed-assets/depreciate, /accounting/fixed-assets
- **خدمات / Engines:** لا يوجد

#### inter-company
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/inter-company
- **مسارات API:** /accounting/inter-company
- **خدمات / Engines:** لا يوجد

#### journal
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/journal/new, /accounting/journal
- **مسارات API:** /accounting/journal, /accounting/journal/[id]
- **خدمات / Engines:** لا يوجد

#### lc
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/lc
- **مسارات API:** /accounting/lc
- **خدمات / Engines:** لا يوجد

#### leases
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/leases
- **مسارات API:** /accounting/leases/amortize, /accounting/leases
- **خدمات / Engines:** لا يوجد

#### multi-book
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/multi-book
- **مسارات API:** /accounting/multi-book/adjustments
- **خدمات / Engines:** لا يوجد

#### open-items
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/open-items
- **مسارات API:** /accounting/open-items/apply-payment, /accounting/open-items/auto-clear, /accounting/open-items/disputes, /accounting/open-items/promise-to-pay, /accounting/open-items
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /accounting
- **مسارات API:** لا يوجد
- **خدمات / Engines:** allocation.service.ts, consolidation.service.ts, financial-period.service.ts, fx-revaluation.service.ts, journal.service.ts, lease-accounting.service.ts, period-close.service.ts, recurring-je.service.ts, recurring-journal.service.ts, revenue-recognition.service.ts

#### payment-runs
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/payment-runs/create, /accounting/payment-runs
- **مسارات API:** /accounting/payment-runs/propose, /accounting/payment-runs/[id]/approve, /accounting/payment-runs/[id]/generate-files, /accounting/payment-runs/[id]/post-journal, /accounting/payment-runs/[id]/submit-for-approval, /accounting/payment-runs/[id]/upload-confirmation
- **خدمات / Engines:** لا يوجد

#### period-close
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/period-close
- **مسارات API:** /accounting/period-close
- **خدمات / Engines:** لا يوجد

#### period-lock
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/period-lock
- **مسارات API:** /accounting/period-lock
- **خدمات / Engines:** لا يوجد

#### prepayments
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/prepayments
- **مسارات API:** /accounting/prepayments
- **خدمات / Engines:** لا يوجد

#### profit-centers
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/profit-centers
- **مسارات API:** /accounting/profit-centers
- **خدمات / Engines:** لا يوجد

#### profit-loss
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/profit-loss
- **مسارات API:** /accounting/profit-loss
- **خدمات / Engines:** لا يوجد

#### revenue-recognition
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/revenue-recognition
- **مسارات API:** /accounting/revenue-recognition/amortize, /accounting/revenue-recognition
- **خدمات / Engines:** لا يوجد

#### segments
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/segments
- **مسارات API:** /accounting/segments
- **خدمات / Engines:** لا يوجد

#### trial-balance
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/trial-balance
- **مسارات API:** /accounting/trial-balance
- **خدمات / Engines:** لا يوجد

#### vat-return
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/vat-return
- **مسارات API:** /accounting/vat-return
- **خدمات / Engines:** لا يوجد

#### vendor-statements
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /accounting/vendor-statements/bulk, /accounting/vendor-statements
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### year-end-close
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/year-end-close
- **مسارات API:** /accounting/year-end-close/close-period, /accounting/year-end-close
- **خدمات / Engines:** لا يوجد

#### consolidation
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/consolidation
- **مسارات API:** /accounting/consolidation/commit, /accounting/consolidation/eliminations/dry-run, /accounting/consolidation/eliminations/requests, /accounting/consolidation/eliminations/requests/[id]/approve, /accounting/consolidation/eliminations/requests/[id]/post, /accounting/consolidation/eliminations/requests/[id]/posting-preview, /accounting/consolidation/eliminations/requests/[id]/reject, /accounting/consolidation/eliminations/requests/[id]/reverse, /accounting/consolidation/preview, /accounting/consolidation/run
- **خدمات / Engines:** لا يوجد

#### financial-report-audit
- **الحالة:** مكتمل
- **واجهات UI:** /accounting/financial-report-audit
- **مسارات API:** /accounting/financial-report-audit
- **خدمات / Engines:** لا يوجد

#### accounts
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/accounts/init, /accounting/accounts
- **خدمات / Engines:** لا يوجد

#### accruals
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/accruals
- **خدمات / Engines:** لا يوجد

#### aging
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/aging
- **خدمات / Engines:** لا يوجد

#### audit-export
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/audit-export
- **خدمات / Engines:** لا يوجد

#### balance-sheet
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/balance-sheet
- **خدمات / Engines:** لا يوجد

#### bank-feed
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/bank-feed
- **خدمات / Engines:** لا يوجد

#### bank-recon
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/bank-recon/auto-match, /accounting/bank-recon
- **خدمات / Engines:** لا يوجد

#### bank-statements
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/bank-statements, /accounting/bank-statements/upload
- **خدمات / Engines:** لا يوجد

#### books
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/books
- **خدمات / Engines:** لا يوجد

#### budget
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/budget/check, /accounting/budget/variance
- **خدمات / Engines:** لا يوجد

#### cashflow
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/cashflow/forecast
- **خدمات / Engines:** لا يوجد

#### chart-of-accounts-import
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/chart-of-accounts-import
- **خدمات / Engines:** لا يوجد

#### closing
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/closing
- **خدمات / Engines:** لا يوجد

#### coa
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/coa/reset-to-socpa
- **خدمات / Engines:** لا يوجد

#### cost-center-report
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/cost-center-report
- **خدمات / Engines:** لا يوجد

#### cost-centers
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/cost-centers
- **خدمات / Engines:** لا يوجد

#### customers
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/customers/[id]/statement
- **خدمات / Engines:** لا يوجد

#### deferred-tax
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/deferred-tax
- **خدمات / Engines:** لا يوجد

#### depreciation
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/depreciation
- **خدمات / Engines:** لا يوجد

#### ecl
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/ecl/run
- **خدمات / Engines:** لا يوجد

#### financial-statements
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/financial-statements
- **خدمات / Engines:** لا يوجد

#### fiscal-periods
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/fiscal-periods
- **خدمات / Engines:** لا يوجد

#### fiscal-years
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/fiscal-years
- **خدمات / Engines:** لا يوجد

#### fx-revaluation
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/fx-revaluation/bank/post, /accounting/fx-revaluation/bank/preview, /accounting/fx-revaluation/post, /accounting/fx-revaluation/preview, /accounting/fx-revaluation/run
- **خدمات / Engines:** لا يوجد

#### governance-violations
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/governance-violations
- **خدمات / Engines:** لا يوجد

#### gr-ir-clearing
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/gr-ir-clearing
- **خدمات / Engines:** لا يوجد

#### income-statement
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/income-statement
- **خدمات / Engines:** لا يوجد

#### intercompany
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/intercompany
- **خدمات / Engines:** لا يوجد

#### inventory-valuation-snapshot
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/inventory-valuation-snapshot
- **خدمات / Engines:** لا يوجد

#### ledger
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/ledger
- **خدمات / Engines:** لا يوجد

#### month-end-close
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/month-end-close
- **خدمات / Engines:** لا يوجد

#### opening-balances
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/opening-balances
- **خدمات / Engines:** لا يوجد

#### payroll-gl
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/payroll-gl
- **خدمات / Engines:** لا يوجد

#### reversal
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/reversal
- **خدمات / Engines:** لا يوجد

#### statement
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/statement
- **خدمات / Engines:** لا يوجد

#### year-end
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounting/year-end/initiate, /accounting/year-end/reopen, /accounting/year-end/[runId]/finalize, /accounting/year-end/[runId]/reports, /accounting/year-end/[runId]/tasks, /accounting/year-end/[runId]/tasks/[taskCode]/complete, /accounting/year-end/[runId]/tasks/[taskCode]/execute
- **خدمات / Engines:** لا يوجد

---

## قسم: الإدارة العامة (admin)
- **الهدف العام:** إدارة قسم الإدارة العامة وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### bi-builder
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /admin/bi-builder
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### chains
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /admin/chains
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### compliance
- **الحالة:** مكتمل
- **واجهات UI:** /admin/compliance
- **مسارات API:** /admin/compliance
- **خدمات / Engines:** لا يوجد

#### compliance-dashboard
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /admin/compliance-dashboard
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### e2e-tester
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /admin/e2e-tester
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### feature-flags
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /admin/feature-flags
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### grc
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /admin/grc/audit-log, /admin/grc, /admin/grc/policies, /admin/grc/risks
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### knowledge
- **الحالة:** مكتمل
- **واجهات UI:** /admin/knowledge
- **مسارات API:** /admin/knowledge
- **خدمات / Engines:** لا يوجد

#### llm-costs
- **الحالة:** مكتمل
- **واجهات UI:** /admin/llm-costs
- **مسارات API:** /admin/llm-costs
- **خدمات / Engines:** لا يوجد

#### migration
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /admin/migration
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### orchestration
- **الحالة:** مكتمل
- **واجهات UI:** /admin/orchestration
- **مسارات API:** /admin/orchestration
- **خدمات / Engines:** لا يوجد

#### outbox
- **الحالة:** مكتمل
- **واجهات UI:** /admin/outbox
- **مسارات API:** /admin/outbox/diagnostics
- **خدمات / Engines:** لا يوجد

#### prompts
- **الحالة:** مكتمل
- **واجهات UI:** /admin/prompts/cost, /admin/prompts
- **مسارات API:** /admin/prompts
- **خدمات / Engines:** لا يوجد

#### rag-cost
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /admin/rag-cost
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### security
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /admin/security/mfa-audit, /admin/security/mfa-policy
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### siem
- **الحالة:** مكتمل
- **واجهات UI:** /admin/siem
- **مسارات API:** /admin/siem
- **خدمات / Engines:** لا يوجد

#### sprint-progress
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /admin/sprint-progress
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### stories
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /admin/stories
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### test-coverage
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /admin/test-coverage
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### training-compliance
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /admin/training-compliance
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### audit-logs
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /admin/audit-logs
- **خدمات / Engines:** لا يوجد

#### backups
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /admin/backups
- **خدمات / Engines:** لا يوجد

#### bi
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /admin/bi/query
- **خدمات / Engines:** لا يوجد

#### e2e-test
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /admin/e2e-test
- **خدمات / Engines:** لا يوجد

#### nodes
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /admin/nodes/backup, /admin/nodes/billing, /admin/nodes, /admin/nodes/sync
- **خدمات / Engines:** لا يوجد

#### system-audit
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /admin/system-audit
- **خدمات / Engines:** لا يوجد

---

## قسم: affiliates (affiliates)
- **الهدف العام:** إدارة قسم affiliates وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /affiliates
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: ai (ai)
- **الهدف العام:** إدارة قسم ai وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### bank-fraud
- **الحالة:** مكتمل
- **واجهات UI:** /ai/bank-fraud
- **مسارات API:** /ai/bank-fraud
- **خدمات / Engines:** لا يوجد

#### demand-forecast
- **الحالة:** مكتمل
- **واجهات UI:** /ai/demand-forecast
- **مسارات API:** /ai/demand-forecast
- **خدمات / Engines:** لا يوجد

#### nlq
- **الحالة:** مكتمل
- **واجهات UI:** /ai/nlq
- **مسارات API:** /ai/nlq
- **خدمات / Engines:** لا يوجد

#### sales-coach
- **الحالة:** مكتمل
- **واجهات UI:** /ai/sales-coach
- **مسارات API:** /ai/sales-coach
- **خدمات / Engines:** لا يوجد

#### bank-reconciliation
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /ai/bank-reconciliation
- **خدمات / Engines:** لا يوجد

#### cfo
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /ai/cfo
- **خدمات / Engines:** لا يوجد

#### chat
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /ai/chat
- **خدمات / Engines:** لا يوجد

#### copilot
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /ai/copilot/chat, /ai/copilot
- **خدمات / Engines:** لا يوجد

#### fraud-monitoring
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /ai/fraud-monitoring
- **خدمات / Engines:** لا يوجد

#### ingest
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /ai/ingest
- **خدمات / Engines:** لا يوجد

#### predictive-scm
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /ai/predictive-scm
- **خدمات / Engines:** لا يوجد

#### rag
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /ai/rag
- **خدمات / Engines:** لا يوجد

---

## قسم: ai-auditor (ai-auditor)
- **الهدف العام:** إدارة قسم ai-auditor وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /ai-auditor
- **مسارات API:** /ai-auditor
- **خدمات / Engines:** لا يوجد

---

## قسم: ai-bank (ai-bank)
- **الهدف العام:** إدارة قسم ai-bank وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /ai-bank
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: ai-cfo (ai-cfo)
- **الهدف العام:** إدارة قسم ai-cfo وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /ai-cfo
- **مسارات API:** /ai-cfo
- **خدمات / Engines:** لا يوجد

#### report
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /ai-cfo/report
- **خدمات / Engines:** لا يوجد

---

## قسم: ai-copilot (ai-copilot)
- **الهدف العام:** إدارة قسم ai-copilot وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /ai-copilot
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: ai-scm (ai-scm)
- **الهدف العام:** إدارة قسم ai-scm وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /ai-scm
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: ap (ap)
- **الهدف العام:** إدارة قسم ap وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### capture
- **الحالة:** مكتمل
- **واجهات UI:** /ap/capture
- **مسارات API:** /ap/capture
- **خدمات / Engines:** لا يوجد

#### match
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /ap/match
- **خدمات / Engines:** لا يوجد

#### three-way-match
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /ap/three-way-match
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** Service only
- **واجهات UI:** لا يوجد
- **مسارات API:** لا يوجد
- **خدمات / Engines:** payment-run.service.ts, three-way-match.service.ts

---

## قسم: approvals (approvals)
- **الهدف العام:** إدارة قسم approvals وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### inbox
- **الحالة:** مكتمل
- **واجهات UI:** /approvals/inbox
- **مسارات API:** /approvals/inbox
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** مكتمل
- **واجهات UI:** /approvals
- **مسارات API:** /approvals
- **خدمات / Engines:** لا يوجد

#### [id]
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /approvals/[id]/approve, /approvals/[id]/reject, /approvals/[id]
- **خدمات / Engines:** لا يوجد

---

## قسم: assets (assets)
- **الهدف العام:** إدارة قسم assets وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /assets
- **مسارات API:** /assets
- **خدمات / Engines:** fixed-asset-depreciation.service.ts, impairment.service.ts, lease.service.ts, lifecycle.service.ts, maintenance.service.ts, revaluation.service.ts, verification.service.ts

#### depreciate
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /assets/depreciate
- **خدمات / Engines:** لا يوجد

#### leases
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /assets/leases/post-monthly, /assets/leases/[id]/post-inception
- **خدمات / Engines:** لا يوجد

---

## قسم: attendance (attendance)
- **الهدف العام:** إدارة قسم attendance وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /attendance
- **مسارات API:** /attendance
- **خدمات / Engines:** لا يوجد

#### face-id
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /attendance/face-id
- **خدمات / Engines:** لا يوجد

---

## قسم: audit (audit)
- **الهدف العام:** إدارة قسم audit وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### field-trail
- **الحالة:** مكتمل
- **واجهات UI:** /audit/field-trail
- **مسارات API:** /audit/field-trail
- **خدمات / Engines:** لا يوجد

---

## قسم: audit-logs (audit-logs)
- **الهدف العام:** إدارة قسم audit-logs وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /audit-logs
- **مسارات API:** /audit-logs
- **خدمات / Engines:** لا يوجد

---

## قسم: banks (banks)
- **الهدف العام:** إدارة قسم banks وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /banks
- **مسارات API:** /banks
- **خدمات / Engines:** لا يوجد

#### import
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /banks/import
- **خدمات / Engines:** لا يوجد

#### reconciliation
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /banks/reconciliation
- **خدمات / Engines:** لا يوجد

#### [id]
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /banks/[id], /banks/[id]/transactions
- **خدمات / Engines:** لا يوجد

---

## قسم: barcode (barcode)
- **الهدف العام:** إدارة قسم barcode وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /barcode
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: batches (batches)
- **الهدف العام:** إدارة قسم batches وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /batches
- **مسارات API:** /batches
- **خدمات / Engines:** لا يوجد

#### expiry
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /batches/expiry
- **خدمات / Engines:** لا يوجد

#### [id]
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /batches/[id]
- **خدمات / Engines:** لا يوجد

---

## قسم: bi (bi)
- **الهدف العام:** إدارة قسم bi وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### dashboard
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /bi/dashboard
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### budget-variance
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /bi/budget-variance
- **خدمات / Engines:** لا يوجد

#### cube
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /bi/cube
- **خدمات / Engines:** لا يوجد

#### kpis
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /bi/kpis
- **خدمات / Engines:** لا يوجد

---

## قسم: bookings (bookings)
- **الهدف العام:** إدارة قسم bookings وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### calendar
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /bookings/calendar
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** مكتمل
- **واجهات UI:** /bookings
- **مسارات API:** /bookings
- **خدمات / Engines:** لا يوجد

#### invoice
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /bookings/invoice
- **خدمات / Engines:** لا يوجد

---

## قسم: branches (branches)
- **الهدف العام:** إدارة قسم branches وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /branches
- **مسارات API:** /branches
- **خدمات / Engines:** لا يوجد

---

## قسم: calendar (calendar)
- **الهدف العام:** إدارة قسم calendar وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /calendar
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: clinic (clinic)
- **الهدف العام:** إدارة قسم clinic وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### appointments
- **الحالة:** مكتمل
- **واجهات UI:** /clinic/appointments
- **مسارات API:** /clinic/appointments
- **خدمات / Engines:** لا يوجد

#### erx
- **الحالة:** مكتمل
- **واجهات UI:** /clinic/erx
- **مسارات API:** /clinic/erx
- **خدمات / Engines:** لا يوجد

#### lab
- **الحالة:** مكتمل
- **واجهات UI:** /clinic/lab
- **مسارات API:** /clinic/lab
- **خدمات / Engines:** لا يوجد

---

## قسم: cmms (cmms)
- **الهدف العام:** إدارة قسم cmms وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /cmms
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### work-orders
- **الحالة:** مكتمل
- **واجهات UI:** /cmms/work-orders
- **مسارات API:** /cmms/work-orders
- **خدمات / Engines:** لا يوجد

#### schedules
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cmms/schedules
- **خدمات / Engines:** لا يوجد

---

## قسم: com (com)
- **الهدف العام:** إدارة قسم com وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### rules
- **الحالة:** مكتمل
- **واجهات UI:** /com/rules
- **مسارات API:** /com/rules
- **خدمات / Engines:** لا يوجد

---

## قسم: compliance (compliance)
- **الهدف العام:** إدارة قسم compliance وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### audits
- **الحالة:** مكتمل
- **واجهات UI:** /compliance/audits
- **مسارات API:** /compliance/audits
- **خدمات / Engines:** لا يوجد

#### pdpl
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /compliance/pdpl/breaches, /compliance/pdpl/dsr
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### risks
- **الحالة:** مكتمل
- **واجهات UI:** /compliance/risks
- **مسارات API:** /compliance/risks
- **خدمات / Engines:** لا يوجد

#### rules
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /compliance/rules
- **خدمات / Engines:** لا يوجد

---

## قسم: contracts (contracts)
- **الهدف العام:** إدارة قسم contracts وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /contracts
- **مسارات API:** /contracts
- **خدمات / Engines:** لا يوجد

#### templates
- **الحالة:** مكتمل
- **واجهات UI:** /contracts/templates
- **مسارات API:** /contracts/templates
- **خدمات / Engines:** لا يوجد

#### alerts
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /contracts/alerts
- **خدمات / Engines:** لا يوجد

#### renewals
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /contracts/renewals
- **خدمات / Engines:** لا يوجد

---

## قسم: copa (copa)
- **الهدف العام:** إدارة قسم copa وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /copa
- **مسارات API:** /copa
- **خدمات / Engines:** لا يوجد

#### allocations
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /copa/allocations
- **خدمات / Engines:** لا يوجد

#### characteristics
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /copa/characteristics
- **خدمات / Engines:** لا يوجد

#### value-fields
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /copa/value-fields
- **خدمات / Engines:** لا يوجد

---

## قسم: coupons (coupons)
- **الهدف العام:** إدارة قسم coupons وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /coupons
- **مسارات API:** /coupons
- **خدمات / Engines:** لا يوجد

#### validate
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /coupons/validate
- **خدمات / Engines:** لا يوجد

#### [id]
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /coupons/[id]
- **خدمات / Engines:** لا يوجد

---

## قسم: cpq (cpq)
- **الهدف العام:** إدارة قسم cpq وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /cpq
- **مسارات API:** /cpq
- **خدمات / Engines:** لا يوجد

---

## قسم: credit-check (credit-check)
- **الهدف العام:** إدارة قسم credit-check وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /credit-check
- **مسارات API:** /credit-check
- **خدمات / Engines:** لا يوجد

---

## قسم: crm (crm)
- **الهدف العام:** إدارة قسم crm وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### campaigns
- **الحالة:** مكتمل
- **واجهات UI:** /crm/campaigns
- **مسارات API:** /crm/campaigns
- **خدمات / Engines:** لا يوجد

#### customer360
- **الحالة:** مكتمل
- **واجهات UI:** /crm/customer360
- **مسارات API:** /crm/customer360
- **خدمات / Engines:** لا يوجد

#### cx-nps
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /crm/cx-nps
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### kanban
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /crm/kanban
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### key-accounts
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /crm/key-accounts
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### leads
- **الحالة:** مكتمل
- **واجهات UI:** /crm/leads
- **مسارات API:** /crm/leads, /crm/leads/[id]/convert
- **خدمات / Engines:** لا يوجد

#### opportunities
- **الحالة:** مكتمل
- **واجهات UI:** /crm/opportunities
- **مسارات API:** /crm/opportunities, /crm/opportunities/[id]/win
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /crm
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### tickets
- **الحالة:** مكتمل
- **واجهات UI:** /crm/tickets
- **مسارات API:** /crm/tickets
- **خدمات / Engines:** لا يوجد

#### accounts
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /crm/accounts
- **خدمات / Engines:** لا يوجد

#### activities
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /crm/activities
- **خدمات / Engines:** لا يوجد

#### customer-health
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /crm/customer-health
- **خدمات / Engines:** لا يوجد

#### forecast
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /crm/forecast
- **خدمات / Engines:** لا يوجد

#### help-desk
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /crm/help-desk
- **خدمات / Engines:** لا يوجد

#### kb
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /crm/kb
- **خدمات / Engines:** لا يوجد

#### marketing
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /crm/marketing
- **خدمات / Engines:** لا يوجد

#### omnichannel
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /crm/omnichannel
- **خدمات / Engines:** لا يوجد

#### portal
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /crm/portal
- **خدمات / Engines:** لا يوجد

#### sla
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /crm/sla
- **خدمات / Engines:** لا يوجد

#### surveys
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /crm/surveys
- **خدمات / Engines:** لا يوجد

#### territory
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /crm/territory
- **خدمات / Engines:** لا يوجد

#### whatsapp
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /crm/whatsapp/broadcast, /crm/whatsapp, /crm/whatsapp/sessions, /crm/whatsapp/webhook
- **خدمات / Engines:** لا يوجد

---

## قسم: customers (customers)
- **الهدف العام:** إدارة قسم customers وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /customers
- **مسارات API:** /customers
- **خدمات / Engines:** لا يوجد

#### [id]
- **الحالة:** مكتمل
- **واجهات UI:** /customers/[id]
- **مسارات API:** /customers/[id]/credit, /customers/[id]/gdpr-delete, /customers/[id]/hold, /customers/[id], /customers/[id]/statement
- **خدمات / Engines:** لا يوجد

---

## قسم: لوحة التحكم (dashboard)
- **الهدف العام:** إدارة قسم لوحة التحكم وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /dashboard
- **مسارات API:** /dashboard
- **خدمات / Engines:** لا يوجد

---

## قسم: dms (dms)
- **الهدف العام:** إدارة قسم dms وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /dms
- **مسارات API:** /dms
- **خدمات / Engines:** لا يوجد

---

## قسم: docs (docs)
- **الهدف العام:** إدارة قسم docs وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /docs
- **مسارات API:** /docs
- **خدمات / Engines:** لا يوجد

#### [slug]
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /docs/[slug]
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### openapi.json
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /docs/openapi.json
- **خدمات / Engines:** لا يوجد

---

## قسم: documents (documents)
- **الهدف العام:** إدارة قسم documents وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /documents
- **مسارات API:** /documents
- **خدمات / Engines:** لا يوجد

#### transition
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /documents/transition
- **خدمات / Engines:** لا يوجد

#### [id]
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /documents/[id]
- **خدمات / Engines:** لا يوجد

---

## قسم: ecommerce (ecommerce)
- **الهدف العام:** إدارة قسم ecommerce وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### dashboard
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /ecommerce/dashboard
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### stores
- **الحالة:** مكتمل
- **واجهات UI:** /ecommerce/stores
- **مسارات API:** /ecommerce/stores
- **خدمات / Engines:** لا يوجد

#### orders
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /ecommerce/orders
- **خدمات / Engines:** لا يوجد

#### sync
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /ecommerce/sync
- **خدمات / Engines:** لا يوجد

---

## قسم: employees (employees)
- **الهدف العام:** إدارة قسم employees وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /employees
- **مسارات API:** /employees
- **خدمات / Engines:** لا يوجد

#### [id]
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /employees/[id]
- **خدمات / Engines:** لا يوجد

---

## قسم: enterprise (enterprise)
- **الهدف العام:** إدارة قسم enterprise وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### fleet
- **الحالة:** مكتمل
- **واجهات UI:** /enterprise/fleet
- **مسارات API:** /enterprise/fleet
- **خدمات / Engines:** لا يوجد

#### legal
- **الحالة:** مكتمل
- **واجهات UI:** /enterprise/legal
- **مسارات API:** /enterprise/legal
- **خدمات / Engines:** لا يوجد

#### mrp
- **الحالة:** مكتمل
- **واجهات UI:** /enterprise/mrp, /enterprise/mrp/recipes
- **مسارات API:** /enterprise/mrp
- **خدمات / Engines:** لا يوجد

#### portfolio
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /enterprise/portfolio
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### projects
- **الحالة:** مكتمل
- **واجهات UI:** /enterprise/projects/evm, /enterprise/projects, /enterprise/projects/[id]/gantt, /enterprise/projects/[id]
- **مسارات API:** /enterprise/projects/budget, /enterprise/projects, /enterprise/projects/tasks
- **خدمات / Engines:** لا يوجد

#### property
- **الحالة:** مكتمل
- **واجهات UI:** /enterprise/property
- **مسارات API:** /enterprise/property
- **خدمات / Engines:** لا يوجد

#### quality
- **الحالة:** مكتمل
- **واجهات UI:** /enterprise/quality
- **مسارات API:** /enterprise/quality
- **خدمات / Engines:** لا يوجد

#### quality-management
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /enterprise/quality-management
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### wms
- **الحالة:** مكتمل
- **واجهات UI:** /enterprise/wms
- **مسارات API:** /enterprise/wms
- **خدمات / Engines:** لا يوجد

---

## قسم: esign (esign)
- **الهدف العام:** إدارة قسم esign وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /esign
- **مسارات API:** /esign
- **خدمات / Engines:** لا يوجد

---

## قسم: events (events)
- **الهدف العام:** إدارة قسم events وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /events
- **مسارات API:** /events
- **خدمات / Engines:** لا يوجد

#### registrations
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /events/registrations
- **خدمات / Engines:** لا يوجد

---

## قسم: expenses (expenses)
- **الهدف العام:** إدارة قسم expenses وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /expenses
- **مسارات API:** /expenses
- **خدمات / Engines:** لا يوجد

---

## قسم: field-service (field-service)
- **الهدف العام:** إدارة قسم field-service وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /field-service
- **مسارات API:** /field-service
- **خدمات / Engines:** لا يوجد

#### orders
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /field-service/orders
- **خدمات / Engines:** لا يوجد

---

## قسم: finance (finance)
- **الهدف العام:** إدارة قسم finance وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### allocation
- **الحالة:** مكتمل
- **واجهات UI:** /finance/allocation
- **مسارات API:** /finance/allocation
- **خدمات / Engines:** لا يوجد

#### assets
- **الحالة:** مكتمل
- **واجهات UI:** /finance/assets
- **مسارات API:** /finance/assets
- **خدمات / Engines:** لا يوجد

#### bad-debt
- **الحالة:** مكتمل
- **واجهات UI:** /finance/bad-debt
- **مسارات API:** /finance/bad-debt
- **خدمات / Engines:** لا يوجد

#### balance-sheet
- **الحالة:** مكتمل
- **واجهات UI:** /finance/balance-sheet
- **مسارات API:** /finance/balance-sheet
- **خدمات / Engines:** لا يوجد

#### bank-recon
- **الحالة:** مكتمل
- **واجهات UI:** /finance/bank-recon/rules
- **مسارات API:** /finance/bank-recon/rules, /finance/bank-recon/rules/simulate
- **خدمات / Engines:** لا يوجد

#### budget-control
- **الحالة:** مكتمل
- **واجهات UI:** /finance/budget-control, /finance/budget-control/variance
- **مسارات API:** /finance/budget-control
- **خدمات / Engines:** لا يوجد

#### budget-planning
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /finance/budget-planning
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### budget-scenarios
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /finance/budget-scenarios
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### cash-flow
- **الحالة:** مكتمل
- **واجهات UI:** /finance/cash-flow/forecast, /finance/cash-flow
- **مسارات API:** /finance/cash-flow/forecast, /finance/cash-flow
- **خدمات / Engines:** لا يوجد

#### cfo
- **الحالة:** مكتمل
- **واجهات UI:** /finance/cfo
- **مسارات API:** /finance/cfo
- **خدمات / Engines:** لا يوجد

#### cfo-ai
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /finance/cfo-ai
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### cfo-dashboard
- **الحالة:** مكتمل
- **واجهات UI:** /finance/cfo-dashboard
- **مسارات API:** /finance/cfo-dashboard
- **خدمات / Engines:** لا يوجد

#### consolidation
- **الحالة:** مكتمل
- **واجهات UI:** /finance/consolidation/elimination, /finance/consolidation
- **مسارات API:** /finance/consolidation/elimination, /finance/consolidation
- **خدمات / Engines:** لا يوجد

#### copa
- **الحالة:** مكتمل
- **واجهات UI:** /finance/copa, /finance/copa/rules
- **مسارات API:** /finance/copa
- **خدمات / Engines:** لا يوجد

#### credit-check
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /finance/credit-check
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### deferred-tax
- **الحالة:** مكتمل
- **واجهات UI:** /finance/deferred-tax
- **مسارات API:** /finance/deferred-tax
- **خدمات / Engines:** لا يوجد

#### ecl
- **الحالة:** مكتمل
- **واجهات UI:** /finance/ecl
- **مسارات API:** /finance/ecl
- **خدمات / Engines:** لا يوجد

#### financial-health
- **الحالة:** مكتمل
- **واجهات UI:** /finance/financial-health
- **مسارات API:** /finance/financial-health
- **خدمات / Engines:** لا يوجد

#### fx-revaluation
- **الحالة:** مكتمل
- **واجهات UI:** /finance/fx-revaluation
- **مسارات API:** /finance/fx-revaluation
- **خدمات / Engines:** لا يوجد

#### impairment
- **الحالة:** مكتمل
- **واجهات UI:** /finance/impairment
- **مسارات API:** /finance/impairment
- **خدمات / Engines:** لا يوجد

#### payment-run
- **الحالة:** مكتمل
- **واجهات UI:** /finance/payment-run
- **مسارات API:** /finance/payment-run/propose, /finance/payment-run, /finance/payment-run/[id]/approve, /finance/payment-run/[id]/confirm, /finance/payment-run/[id], /finance/payment-run/[id]/send-bank
- **خدمات / Engines:** لا يوجد

#### period-close
- **الحالة:** مكتمل
- **واجهات UI:** /finance/period-close
- **مسارات API:** /finance/period-close, /finance/period-close/[id]/step
- **خدمات / Engines:** لا يوجد

#### rebates
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /finance/rebates
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### transfer-pricing
- **الحالة:** مكتمل
- **واجهات UI:** /finance/transfer-pricing
- **مسارات API:** /finance/transfer-pricing
- **خدمات / Engines:** لا يوجد

#### variance
- **الحالة:** مكتمل
- **واجهات UI:** /finance/variance
- **مسارات API:** /finance/variance
- **خدمات / Engines:** لا يوجد

#### vat
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /finance/vat/categories
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### wht
- **الحالة:** مكتمل
- **واجهات UI:** /finance/wht/form14, /finance/wht
- **مسارات API:** /finance/wht
- **خدمات / Engines:** لا يوجد

#### aging
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/aging
- **خدمات / Engines:** لا يوجد

#### ap-aging
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/ap-aging
- **خدمات / Engines:** لا يوجد

#### aro
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/aro
- **خدمات / Engines:** لا يوجد

#### asset-lifecycle
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/asset-lifecycle
- **خدمات / Engines:** لا يوجد

#### auto-ecl
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/auto-ecl
- **خدمات / Engines:** لا يوجد

#### budget
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/budget, /finance/budget/variance
- **خدمات / Engines:** لا يوجد

#### budget-upload
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/budget-upload
- **خدمات / Engines:** لا يوجد

#### cash-flow-forecast
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/cash-flow-forecast
- **خدمات / Engines:** لا يوجد

#### cash-flow-indirect
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/cash-flow-indirect
- **خدمات / Engines:** لا يوجد

#### cashflow
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/cashflow
- **خدمات / Engines:** لا يوجد

#### checks
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/checks, /finance/checks/[id]/process
- **خدمات / Engines:** لا يوجد

#### commitments
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/commitments
- **خدمات / Engines:** لا يوجد

#### contract-assets
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/contract-assets
- **خدمات / Engines:** لا يوجد

#### controls
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/controls
- **خدمات / Engines:** لا يوجد

#### dunning
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/dunning/history, /finance/dunning, /finance/dunning/run
- **خدمات / Engines:** لا يوجد

#### equity-statement
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/equity-statement
- **خدمات / Engines:** لا يوجد

#### fs-notes
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/fs-notes
- **خدمات / Engines:** لا يوجد

#### hedge
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/hedge
- **خدمات / Engines:** لا يوجد

#### ifrs16
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/ifrs16
- **خدمات / Engines:** لا يوجد

#### ifrs16-lease
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/ifrs16-lease
- **خدمات / Engines:** لا يوجد

#### match
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/match/queue, /finance/match/[id]/resolve
- **خدمات / Engines:** لا يوجد

#### multi-gaap
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/multi-gaap
- **خدمات / Engines:** لا يوجد

#### notes-to-fs
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/notes-to-fs
- **خدمات / Engines:** لا يوجد

#### payment-runs
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/payment-runs/propose, /finance/payment-runs, /finance/payment-runs/[id]/approve, /finance/payment-runs/[id]/execute, /finance/payment-runs/[id]/submit-for-approval
- **خدمات / Engines:** لا يوجد

#### payment-schedule
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/payment-schedule
- **خدمات / Engines:** لا يوجد

#### period-reports
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/period-reports
- **خدمات / Engines:** لا يوجد

#### petty-cash
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/petty-cash, /finance/petty-cash/[id]/process
- **خدمات / Engines:** لا يوجد

#### reconciliations
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/reconciliations, /finance/reconciliations/[id]
- **خدمات / Engines:** لا يوجد

#### rolling-forecast
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/rolling-forecast
- **خدمات / Engines:** لا يوجد

#### segments
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/segments
- **خدمات / Engines:** لا يوجد

#### treasury
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /finance/treasury
- **خدمات / Engines:** لا يوجد

---

## قسم: fiscal-periods (fiscal-periods)
- **الهدف العام:** إدارة قسم fiscal-periods وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /fiscal-periods
- **مسارات API:** /fiscal-periods
- **خدمات / Engines:** لا يوجد

---

## قسم: fixed-assets (fixed-assets)
- **الهدف العام:** إدارة قسم fixed-assets وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /fixed-assets
- **مسارات API:** /fixed-assets
- **خدمات / Engines:** لا يوجد

#### [id]
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /fixed-assets/[id]/depreciate, /fixed-assets/[id]
- **خدمات / Engines:** لا يوجد

---

## قسم: fleet (fleet)
- **الهدف العام:** إدارة قسم fleet وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### fuel
- **الحالة:** مكتمل
- **واجهات UI:** /fleet/fuel
- **مسارات API:** /fleet/fuel
- **خدمات / Engines:** لا يوجد

#### maintenance
- **الحالة:** مكتمل
- **واجهات UI:** /fleet/maintenance
- **مسارات API:** /fleet/maintenance
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /fleet
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### tracking
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /fleet/tracking
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### trips
- **الحالة:** مكتمل
- **واجهات UI:** /fleet/trips
- **مسارات API:** /fleet/trips
- **خدمات / Engines:** لا يوجد

#### advanced
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /fleet/advanced
- **خدمات / Engines:** لا يوجد

---

## قسم: fng (fng)
- **الهدف العام:** إدارة قسم fng وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### allocations
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /fng/allocations
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### budgets
- **الحالة:** مكتمل
- **واجهات UI:** /fng/budgets
- **مسارات API:** /fng/budgets
- **خدمات / Engines:** لا يوجد

#### petty-cash-funds
- **الحالة:** مكتمل
- **واجهات UI:** /fng/petty-cash-funds
- **مسارات API:** /fng/petty-cash-funds
- **خدمات / Engines:** لا يوجد

---

## قسم: fsm (fsm)
- **الهدف العام:** إدارة قسم fsm وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### dispatch
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /fsm/dispatch
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /fsm
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### tasks
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /fsm/tasks
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### complete
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /fsm/complete
- **خدمات / Engines:** لا يوجد

#### tickets
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /fsm/tickets
- **خدمات / Engines:** لا يوجد

---

## قسم: fx (fx)
- **الهدف العام:** إدارة قسم fx وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /fx
- **مسارات API:** /fx
- **خدمات / Engines:** لا يوجد

---

## قسم: gift-cards (gift-cards)
- **الهدف العام:** إدارة قسم gift-cards وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /gift-cards
- **مسارات API:** /gift-cards
- **خدمات / Engines:** لا يوجد

#### [id]
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /gift-cards/[id]
- **خدمات / Engines:** لا يوجد

---

## قسم: الموارد البشرية (hr)
- **الهدف العام:** إدارة قسم الموارد البشرية وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### ai-enrollment
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /hr/ai-enrollment
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### attendance
- **الحالة:** مكتمل
- **واجهات UI:** /hr/attendance
- **مسارات API:** /hr/attendance/punch, /hr/attendance
- **خدمات / Engines:** لا يوجد

#### documents
- **الحالة:** مكتمل
- **واجهات UI:** /hr/documents
- **مسارات API:** /hr/documents/expiry, /hr/documents/expiry/[id]
- **خدمات / Engines:** لا يوجد

#### eos
- **الحالة:** مكتمل
- **واجهات UI:** /hr/eos
- **مسارات API:** /hr/eos, /hr/eos/[id]
- **خدمات / Engines:** لا يوجد

#### evaluations
- **الحالة:** مكتمل
- **واجهات UI:** /hr/evaluations
- **مسارات API:** /hr/evaluations
- **خدمات / Engines:** لا يوجد

#### expense-reports
- **الحالة:** مكتمل
- **واجهات UI:** /hr/expense-reports
- **مسارات API:** /hr/expense-reports
- **خدمات / Engines:** لا يوجد

#### gosi
- **الحالة:** مكتمل
- **واجهات UI:** /hr/gosi
- **مسارات API:** /hr/gosi/calculate, /hr/gosi/file, /hr/gosi/file/submit, /hr/gosi
- **خدمات / Engines:** لا يوجد

#### jobs
- **الحالة:** مكتمل
- **واجهات UI:** /hr/jobs
- **مسارات API:** /hr/jobs
- **خدمات / Engines:** لا يوجد

#### leaves
- **الحالة:** مكتمل
- **واجهات UI:** /hr/leaves
- **مسارات API:** /hr/leaves/accrual, /hr/leaves/balance, /hr/leaves, /hr/leaves/[id]
- **خدمات / Engines:** لا يوجد

#### loans
- **الحالة:** مكتمل
- **واجهات UI:** /hr/loans
- **مسارات API:** /hr/loans
- **خدمات / Engines:** لا يوجد

#### mudad
- **الحالة:** مكتمل
- **واجهات UI:** /hr/mudad
- **مسارات API:** /hr/mudad/compliance, /hr/mudad/wps/submit/[batchId]
- **خدمات / Engines:** لا يوجد

#### nitaqat-simulator
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /hr/nitaqat-simulator
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### org-chart
- **الحالة:** مكتمل
- **واجهات UI:** /hr/org-chart
- **مسارات API:** /hr/org-chart
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /hr
- **مسارات API:** لا يوجد
- **خدمات / Engines:** leave.service.ts, onboarding.service.ts, payroll.service.ts, performance.service.ts, recruitment.service.ts, saudization.service.ts, time-attendance.service.ts

#### payroll
- **الحالة:** مكتمل
- **واجهات UI:** /hr/payroll/config, /hr/payroll/run
- **مسارات API:** /hr/payroll/calculate, /hr/payroll/config, /hr/payroll/generate, /hr/payroll/multi-country, /hr/payroll/run
- **خدمات / Engines:** لا يوجد

#### payroll-process
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /hr/payroll-process
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### payslip
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /hr/payslip/[id]
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### performance
- **الحالة:** مكتمل
- **واجهات UI:** /hr/performance
- **مسارات API:** /hr/performance
- **خدمات / Engines:** لا يوجد

#### qiwa
- **الحالة:** مكتمل
- **واجهات UI:** /hr/qiwa/contracts, /hr/qiwa
- **مسارات API:** /hr/qiwa/contracts, /hr/qiwa
- **خدمات / Engines:** لا يوجد

#### recruitment
- **الحالة:** مكتمل
- **واجهات UI:** /hr/recruitment
- **مسارات API:** /hr/recruitment
- **خدمات / Engines:** لا يوجد

#### saudization
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /hr/saudization
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### self-service
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /hr/self-service
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### succession
- **الحالة:** مكتمل
- **واجهات UI:** /hr/succession
- **مسارات API:** /hr/succession
- **خدمات / Engines:** لا يوجد

#### timesheet
- **الحالة:** مكتمل
- **واجهات UI:** /hr/timesheet
- **مسارات API:** /hr/timesheet
- **خدمات / Engines:** لا يوجد

#### training
- **الحالة:** مكتمل
- **واجهات UI:** /hr/training
- **مسارات API:** /hr/training
- **خدمات / Engines:** لا يوجد

#### wps
- **الحالة:** مكتمل
- **واجهات UI:** /hr/wps
- **مسارات API:** /hr/wps
- **خدمات / Engines:** لا يوجد

#### comp-review
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /hr/comp-review
- **خدمات / Engines:** لا يوجد

#### competency
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /hr/competency
- **خدمات / Engines:** لا يوجد

#### employees
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /hr/employees
- **خدمات / Engines:** لا يوجد

#### ess
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /hr/ess
- **خدمات / Engines:** لا يوجد

#### lms
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /hr/lms
- **خدمات / Engines:** لا يوجد

#### okrs
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /hr/okrs
- **خدمات / Engines:** لا يوجد

#### safety
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /hr/safety
- **خدمات / Engines:** لا يوجد

---

## قسم: installments (installments)
- **الهدف العام:** إدارة قسم installments وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /installments
- **مسارات API:** /installments
- **خدمات / Engines:** لا يوجد

---

## قسم: inv (inv)
- **الهدف العام:** إدارة قسم inv وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### serials
- **الحالة:** مكتمل
- **واجهات UI:** /inv/serials
- **مسارات API:** /inv/serials
- **خدمات / Engines:** لا يوجد

---

## قسم: المخزون (inventory)
- **الهدف العام:** إدارة قسم المخزون وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### abc-analysis
- **الحالة:** مكتمل
- **واجهات UI:** /inventory/abc-analysis
- **مسارات API:** /inventory/abc-analysis
- **خدمات / Engines:** لا يوجد

#### ai-vision
- **الحالة:** مكتمل
- **واجهات UI:** /inventory/ai-vision
- **مسارات API:** /inventory/ai-vision
- **خدمات / Engines:** لا يوجد

#### delivery-notes
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /inventory/delivery-notes
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### movements
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /inventory/movements
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /inventory
- **مسارات API:** لا يوجد
- **خدمات / Engines:** cycle-count.service.ts, demand-forecast.service.ts, inventory-analytics.service.ts, landed-cost.service.ts, lot-serial.service.ts, quality-inspection.service.ts, reorder.service.ts, warehouse-transfer.service.ts

#### picking
- **الحالة:** مكتمل
- **واجهات UI:** /inventory/picking/[id]
- **مسارات API:** /inventory/picking/[id]/confirm, /inventory/picking/[id]
- **خدمات / Engines:** لا يوجد

#### quality-control
- **الحالة:** مكتمل
- **واجهات UI:** /inventory/quality-control
- **مسارات API:** /inventory/quality-control
- **خدمات / Engines:** لا يوجد

#### reorder-rules
- **الحالة:** مكتمل
- **واجهات UI:** /inventory/reorder-rules
- **مسارات API:** /inventory/reorder-rules
- **خدمات / Engines:** لا يوجد

#### stocktake
- **الحالة:** مكتمل
- **واجهات UI:** /inventory/stocktake/cycle
- **مسارات API:** /inventory/stocktake, /inventory/stocktake/[id]/approve
- **خدمات / Engines:** لا يوجد

#### traceability
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /inventory/traceability
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### wms
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /inventory/wms, /inventory/wms/putaway
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### zones
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /inventory/zones
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### analytics
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /inventory/analytics
- **خدمات / Engines:** لا يوجد

#### batches
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /inventory/batches/expiring, /inventory/batches/[id]/quarantine, /inventory/batches/[id]/recall, /inventory/batches/[id]/release
- **خدمات / Engines:** لا يوجد

#### clear-all
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /inventory/clear-all
- **خدمات / Engines:** لا يوجد

#### costing
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /inventory/costing
- **خدمات / Engines:** لا يوجد

#### products
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /inventory/products/[id]/variants
- **خدمات / Engines:** لا يوجد

#### putaway
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /inventory/putaway/suggest
- **خدمات / Engines:** لا يوجد

#### reorder
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /inventory/reorder
- **خدمات / Engines:** لا يوجد

---

## قسم: knowledge (knowledge)
- **الهدف العام:** إدارة قسم knowledge وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### articles
- **الحالة:** مكتمل
- **واجهات UI:** /knowledge/articles
- **مسارات API:** /knowledge/articles
- **خدمات / Engines:** لا يوجد

#### categories
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /knowledge/categories
- **خدمات / Engines:** لا يوجد

---

## قسم: learn (learn)
- **الهدف العام:** إدارة قسم learn وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /learn
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### courses
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /learn/courses
- **خدمات / Engines:** لا يوجد

---

## قسم: lms (lms)
- **الهدف العام:** إدارة قسم lms وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### courses
- **الحالة:** مكتمل
- **واجهات UI:** /lms/courses
- **مسارات API:** /lms/courses
- **خدمات / Engines:** لا يوجد

---

## قسم: logistics (logistics)
- **الهدف العام:** إدارة قسم logistics وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### carriers
- **الحالة:** مكتمل
- **واجهات UI:** /logistics/carriers
- **مسارات API:** /logistics/carriers
- **خدمات / Engines:** لا يوجد

#### freight
- **الحالة:** مكتمل
- **واجهات UI:** /logistics/freight
- **مسارات API:** /logistics/freight
- **خدمات / Engines:** لا يوجد

---

## قسم: loyalty (loyalty)
- **الهدف العام:** إدارة قسم loyalty وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /loyalty
- **مسارات API:** /loyalty
- **خدمات / Engines:** لا يوجد

#### [customerId]
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /loyalty/[customerId]/transactions
- **خدمات / Engines:** لا يوجد

---

## قسم: maintenance (maintenance)
- **الهدف العام:** إدارة قسم maintenance وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /maintenance
- **مسارات API:** /maintenance
- **خدمات / Engines:** لا يوجد

#### preventive
- **الحالة:** مكتمل
- **واجهات UI:** /maintenance/preventive
- **مسارات API:** /maintenance/preventive
- **خدمات / Engines:** لا يوجد

---

## قسم: manufacturing (manufacturing)
- **الهدف العام:** إدارة قسم manufacturing وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### aps
- **الحالة:** مكتمل
- **واجهات UI:** /manufacturing/aps
- **مسارات API:** /manufacturing/aps
- **خدمات / Engines:** لا يوجد

#### blockchain-trace
- **الحالة:** مكتمل
- **واجهات UI:** /manufacturing/blockchain-trace
- **مسارات API:** /manufacturing/blockchain-trace
- **خدمات / Engines:** لا يوجد

#### bom
- **الحالة:** مكتمل
- **واجهات UI:** /manufacturing/bom
- **مسارات API:** /manufacturing/bom
- **خدمات / Engines:** لا يوجد

#### boms
- **الحالة:** مكتمل
- **واجهات UI:** /manufacturing/boms, /manufacturing/boms/[id]/versions
- **مسارات API:** /manufacturing/boms/versions/[versionId]/activate, /manufacturing/boms/[id]/versions
- **خدمات / Engines:** لا يوجد

#### capa
- **الحالة:** مكتمل
- **واجهات UI:** /manufacturing/capa
- **مسارات API:** /manufacturing/capa
- **خدمات / Engines:** لا يوجد

#### capacity
- **الحالة:** مكتمل
- **واجهات UI:** /manufacturing/capacity
- **مسارات API:** /manufacturing/capacity
- **خدمات / Engines:** لا يوجد

#### digital-twin
- **الحالة:** مكتمل
- **واجهات UI:** /manufacturing/digital-twin
- **مسارات API:** /manufacturing/digital-twin
- **خدمات / Engines:** لا يوجد

#### labor-efficiency
- **الحالة:** مكتمل
- **واجهات UI:** /manufacturing/labor-efficiency
- **مسارات API:** /manufacturing/labor-efficiency
- **خدمات / Engines:** لا يوجد

#### lean-kanban
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /manufacturing/lean-kanban
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### mes-oee
- **الحالة:** مكتمل
- **واجهات UI:** /manufacturing/mes-oee
- **مسارات API:** /manufacturing/mes-oee
- **خدمات / Engines:** لا يوجد

#### mrp-dashboard
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /manufacturing/mrp-dashboard
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### mrp-engine
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /manufacturing/mrp-engine
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### oee
- **الحالة:** مكتمل
- **واجهات UI:** /manufacturing/oee
- **مسارات API:** /manufacturing/oee
- **خدمات / Engines:** لا يوجد

#### orders
- **الحالة:** مكتمل
- **واجهات UI:** /manufacturing/orders
- **مسارات API:** /manufacturing/orders, /manufacturing/orders/[id], /manufacturing/orders/[id]/schedule
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** مكتمل
- **واجهات UI:** /manufacturing
- **مسارات API:** /manufacturing
- **خدمات / Engines:** bom.service.ts, capacity-planning.service.ts, mrp.service.ts, routing.service.ts, shop-floor.service.ts, subcontracting.service.ts, wip.service.ts, yield.service.ts

#### plm
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /manufacturing/plm
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### qc
- **الحالة:** مكتمل
- **واجهات UI:** /manufacturing/qc
- **مسارات API:** /manufacturing/qc
- **خدمات / Engines:** لا يوجد

#### quality
- **الحالة:** مكتمل
- **واجهات UI:** /manufacturing/quality
- **مسارات API:** /manufacturing/quality
- **خدمات / Engines:** لا يوجد

#### routing
- **الحالة:** مكتمل
- **واجهات UI:** /manufacturing/routing
- **مسارات API:** /manufacturing/routing
- **خدمات / Engines:** لا يوجد

#### scheduler
- **الحالة:** مكتمل
- **واجهات UI:** /manufacturing/scheduler
- **مسارات API:** /manufacturing/scheduler
- **خدمات / Engines:** لا يوجد

#### scrap
- **الحالة:** مكتمل
- **واجهات UI:** /manufacturing/scrap
- **مسارات API:** /manufacturing/scrap
- **خدمات / Engines:** لا يوجد

#### standard-cost
- **الحالة:** مكتمل
- **واجهات UI:** /manufacturing/standard-cost
- **مسارات API:** /manufacturing/standard-cost
- **خدمات / Engines:** لا يوجد

#### subcontracting
- **الحالة:** مكتمل
- **واجهات UI:** /manufacturing/subcontracting
- **مسارات API:** /manufacturing/subcontracting
- **خدمات / Engines:** لا يوجد

#### variance
- **الحالة:** مكتمل
- **واجهات UI:** /manufacturing/variance
- **مسارات API:** /manufacturing/variance
- **خدمات / Engines:** لا يوجد

#### work-centers
- **الحالة:** مكتمل
- **واجهات UI:** /manufacturing/work-centers
- **مسارات API:** /manufacturing/work-centers
- **خدمات / Engines:** لا يوجد

#### work-orders
- **الحالة:** مكتمل
- **واجهات UI:** /manufacturing/work-orders
- **مسارات API:** /manufacturing/work-orders
- **خدمات / Engines:** لا يوجد

#### eco
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /manufacturing/eco
- **خدمات / Engines:** لا يوجد

#### kanban
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /manufacturing/kanban
- **خدمات / Engines:** لا يوجد

#### mes
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /manufacturing/mes
- **خدمات / Engines:** لا يوجد

#### mps
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /manufacturing/mps/generate
- **خدمات / Engines:** لا يوجد

#### mrp
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /manufacturing/mrp
- **خدمات / Engines:** لا يوجد

#### mrp-run
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /manufacturing/mrp-run
- **خدمات / Engines:** لا يوجد

#### quality-control
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /manufacturing/quality-control
- **خدمات / Engines:** لا يوجد

#### quality-management
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /manufacturing/quality-management
- **خدمات / Engines:** لا يوجد

#### recipes
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /manufacturing/recipes, /manufacturing/recipes/[id]
- **خدمات / Engines:** لا يوجد

#### shopfloor
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /manufacturing/shopfloor
- **خدمات / Engines:** لا يوجد

#### sop
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /manufacturing/sop
- **خدمات / Engines:** لا يوجد

#### spc
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /manufacturing/spc
- **خدمات / Engines:** لا يوجد

#### stats
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /manufacturing/stats
- **خدمات / Engines:** لا يوجد

#### wip-valuation
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /manufacturing/wip-valuation
- **خدمات / Engines:** لا يوجد

---

## قسم: marketing (marketing)
- **الهدف العام:** إدارة قسم marketing وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### analytics
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /marketing/analytics
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: payments (payments)
- **الهدف العام:** إدارة قسم payments وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /payments
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### charge
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /payments/charge
- **خدمات / Engines:** لا يوجد

---

## قسم: payroll (payroll)
- **الهدف العام:** إدارة قسم payroll وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /payroll
- **مسارات API:** /payroll
- **خدمات / Engines:** advances.service.ts, loans.service.ts, multi-bank-wps.service.ts, payroll-posting.service.ts, payslip.service.ts, provisions.service.ts, reconciliation.service.ts, salary-structure.service.ts, variable-pay.service.ts

#### wps
- **الحالة:** مكتمل
- **واجهات UI:** /payroll/wps
- **مسارات API:** /payroll/wps/generate, /payroll/wps/history, /payroll/wps, /payroll/wps/[batchId]/download, /payroll/wps/[batchId]/mark-uploaded
- **خدمات / Engines:** لا يوجد

#### calculate
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /payroll/calculate
- **خدمات / Engines:** لا يوجد

#### provisions
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /payroll/provisions/run
- **خدمات / Engines:** لا يوجد

#### runs
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /payroll/runs/[id]/post
- **خدمات / Engines:** لا يوجد

#### [id]
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /payroll/[id]
- **خدمات / Engines:** لا يوجد

---

## قسم: pdpl (pdpl)
- **الهدف العام:** إدارة قسم pdpl وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /pdpl
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### breach
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /pdpl/breach, /pdpl/breach/[id]
- **خدمات / Engines:** لا يوجد

#### dsr
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /pdpl/dsr, /pdpl/dsr/[id]/fulfill, /pdpl/dsr/[id]
- **خدمات / Engines:** لا يوجد

---

## قسم: pharmacy (pharmacy)
- **الهدف العام:** إدارة قسم pharmacy وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### drug-interact
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /pharmacy/drug-interact
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### manager
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /pharmacy/manager
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /pharmacy
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### drug-interactions
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /pharmacy/drug-interactions
- **خدمات / Engines:** لا يوجد

#### drugs
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /pharmacy/drugs
- **خدمات / Engines:** لا يوجد

#### insurance
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /pharmacy/insurance/journal, /pharmacy/insurance
- **خدمات / Engines:** لا يوجد

#### patients
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /pharmacy/patients
- **خدمات / Engines:** لا يوجد

#### prescriptions
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /pharmacy/prescriptions
- **خدمات / Engines:** لا يوجد

---

## قسم: planning (planning)
- **الهدف العام:** إدارة قسم planning وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /planning
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### slots
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /planning/slots
- **خدمات / Engines:** لا يوجد

---

## قسم: portal (portal)
- **الهدف العام:** إدارة قسم portal وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /portal
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### customer
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /portal/customer
- **خدمات / Engines:** لا يوجد

#### messages
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /portal/messages
- **خدمات / Engines:** لا يوجد

#### users
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /portal/users
- **خدمات / Engines:** لا يوجد

#### vendor
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /portal/vendor/rfq/[id]/bid
- **خدمات / Engines:** لا يوجد

---

## قسم: نقاط البيع (pos)
- **الهدف العام:** إدارة قسم نقاط البيع وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### accountant
- **الحالة:** مكتمل
- **واجهات UI:** /pos/accountant
- **مسارات API:** /pos/accountant
- **خدمات / Engines:** لا يوجد

#### offline
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /pos/offline
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** مكتمل
- **واجهات UI:** /pos
- **مسارات API:** /pos
- **خدمات / Engines:** لا يوجد

#### bnpl
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /pos/bnpl, /pos/bnpl/status
- **خدمات / Engines:** لا يوجد

#### checkout
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /pos/checkout
- **خدمات / Engines:** لا يوجد

#### pending-orders
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /pos/pending-orders
- **خدمات / Engines:** لا يوجد

#### products
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /pos/products
- **خدمات / Engines:** لا يوجد

#### restaurant
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /pos/restaurant/floor, /pos/restaurant/kds, /pos/restaurant/tables
- **خدمات / Engines:** لا يوجد

#### sessions
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /pos/sessions/close, /pos/sessions/movement, /pos/sessions/open
- **خدمات / Engines:** لا يوجد

#### sync
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /pos/sync
- **خدمات / Engines:** لا يوجد

---

## قسم: pos-dashboard (pos-dashboard)
- **الهدف العام:** إدارة قسم pos-dashboard وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /pos-dashboard
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: pos-demo (pos-demo)
- **الهدف العام:** إدارة قسم pos-demo وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /pos-demo
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: price-quotes (price-quotes)
- **الهدف العام:** إدارة قسم price-quotes وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /price-quotes
- **مسارات API:** /price-quotes
- **خدمات / Engines:** لا يوجد

---

## قسم: procurement (procurement)
- **الهدف العام:** إدارة قسم procurement وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### contracts
- **الحالة:** مكتمل
- **واجهات UI:** /procurement/contracts
- **مسارات API:** /procurement/contracts
- **خدمات / Engines:** لا يوجد

#### price-comparison
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /procurement/price-comparison
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### rfq
- **الحالة:** مكتمل
- **واجهات UI:** /procurement/rfq/[id]
- **مسارات API:** /procurement/rfq/[id]/award, /procurement/rfq/[id]/comparison, /procurement/rfq/[id]/invite, /procurement/rfq/[id]
- **خدمات / Engines:** لا يوجد

#### spend-analytics
- **الحالة:** مكتمل
- **واجهات UI:** /procurement/spend-analytics
- **مسارات API:** /procurement/spend-analytics
- **خدمات / Engines:** لا يوجد

#### supplier-contracts
- **الحالة:** مكتمل
- **واجهات UI:** /procurement/supplier-contracts
- **مسارات API:** /procurement/supplier-contracts
- **خدمات / Engines:** لا يوجد

#### vendor-portal
- **الحالة:** مكتمل
- **واجهات UI:** /procurement/vendor-portal
- **مسارات API:** /procurement/vendor-portal
- **خدمات / Engines:** لا يوجد

#### vendor-scorecard
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /procurement/vendor-scorecard
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### vendors
- **الحالة:** مكتمل
- **واجهات UI:** /procurement/vendors/scorecard
- **مسارات API:** /procurement/vendors/scorecard
- **خدمات / Engines:** لا يوجد

#### ap-ocr
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /procurement/ap-ocr
- **خدمات / Engines:** لا يوجد

#### auto-draft
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /procurement/auto-draft
- **خدمات / Engines:** لا يوجد

#### blanket-po
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /procurement/blanket-po
- **خدمات / Engines:** لا يوجد

#### dropship
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /procurement/dropship
- **خدمات / Engines:** لا يوجد

#### reverse-auction
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /procurement/reverse-auction
- **خدمات / Engines:** لا يوجد

#### rma
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /procurement/rma
- **خدمات / Engines:** لا يوجد

#### supplier-portal
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /procurement/supplier-portal
- **خدمات / Engines:** لا يوجد

#### vendor-onboarding
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /procurement/vendor-onboarding
- **خدمات / Engines:** لا يوجد

---

## قسم: products (products)
- **الهدف العام:** إدارة قسم products وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /products
- **مسارات API:** /products
- **خدمات / Engines:** لا يوجد

#### export
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /products/export
- **خدمات / Engines:** لا يوجد

#### import
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /products/import
- **خدمات / Engines:** لا يوجد

#### [id]
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /products/[id]
- **خدمات / Engines:** لا يوجد

---

## قسم: profile (profile)
- **الهدف العام:** إدارة قسم profile وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### security
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /profile/security
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: projects (projects)
- **الهدف العام:** إدارة قسم projects وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /projects
- **مسارات API:** لا يوجد
- **خدمات / Engines:** construction.service.ts, costing.service.ts, profitability.service.ts, resource.service.ts, revenue.service.ts, timesheet.service.ts, wbs.service.ts

#### advanced
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /projects/advanced
- **خدمات / Engines:** لا يوجد

#### evm
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /projects/evm
- **خدمات / Engines:** لا يوجد

#### milestones
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /projects/milestones
- **خدمات / Engines:** لا يوجد

#### phases
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /projects/phases
- **خدمات / Engines:** لا يوجد

#### resources
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /projects/resources
- **خدمات / Engines:** لا يوجد

#### risks
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /projects/risks
- **خدمات / Engines:** لا يوجد

#### time-entries
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /projects/time-entries
- **خدمات / Engines:** لا يوجد

---

## قسم: promotions (promotions)
- **الهدف العام:** إدارة قسم promotions وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /promotions
- **مسارات API:** /promotions
- **خدمات / Engines:** لا يوجد

---

## قسم: purchase-orders (purchase-orders)
- **الهدف العام:** إدارة قسم purchase-orders وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /purchase-orders
- **مسارات API:** /purchase-orders
- **خدمات / Engines:** لا يوجد

#### [id]
- **الحالة:** مكتمل
- **واجهات UI:** /purchase-orders/[id]/landed-costs
- **مسارات API:** /purchase-orders/[id]/landed-costs, /purchase-orders/[id]
- **خدمات / Engines:** لا يوجد

---

## قسم: purchase-returns (purchase-returns)
- **الهدف العام:** إدارة قسم purchase-returns وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /purchase-returns
- **مسارات API:** /purchase-returns
- **خدمات / Engines:** لا يوجد

---

## قسم: المشتريات (purchases)
- **الهدف العام:** إدارة قسم المشتريات وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### grn
- **الحالة:** مكتمل
- **واجهات UI:** /purchases/grn
- **مسارات API:** /purchases/grn
- **خدمات / Engines:** لا يوجد

#### landed-cost
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /purchases/landed-cost/[poId]
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### letters-of-credit
- **الحالة:** مكتمل
- **واجهات UI:** /purchases/letters-of-credit
- **مسارات API:** /purchases/letters-of-credit/landed-costs, /purchases/letters-of-credit, /purchases/letters-of-credit/[id]
- **خدمات / Engines:** لا يوجد

#### matching
- **الحالة:** مكتمل
- **واجهات UI:** /purchases/matching
- **مسارات API:** /purchases/matching, /purchases/matching/[id]/resolve
- **خدمات / Engines:** لا يوجد

#### options
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /purchases/options
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### orders
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /purchases/orders
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** مكتمل
- **واجهات UI:** /purchases
- **مسارات API:** /purchases
- **خدمات / Engines:** catalog.service.ts, contract.service.ts, p2p.service.ts, rfq.service.ts, spend-analysis.service.ts, vendor-scorecard.service.ts

#### requisitions
- **الحالة:** مكتمل
- **واجهات UI:** /purchases/requisitions
- **مسارات API:** /purchases/requisitions
- **خدمات / Engines:** لا يوجد

#### rfq
- **الحالة:** مكتمل
- **واجهات UI:** /purchases/rfq
- **مسارات API:** /purchases/rfq
- **خدمات / Engines:** لا يوجد

#### three-way-match
- **الحالة:** مكتمل
- **واجهات UI:** /purchases/three-way-match
- **مسارات API:** /purchases/three-way-match
- **خدمات / Engines:** لا يوجد

#### drop-ship
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /purchases/drop-ship
- **خدمات / Engines:** لا يوجد

#### gr-ir-clear
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /purchases/gr-ir-clear/preview
- **خدمات / Engines:** لا يوجد

#### ocr
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /purchases/ocr
- **خدمات / Engines:** لا يوجد

#### po
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /purchases/po/[id]/landed-costs, /purchases/po/[id]/landed-costs/[costId]/allocate, /purchases/po/[id]
- **خدمات / Engines:** لا يوجد

#### [id]
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /purchases/[id]/receive
- **خدمات / Engines:** لا يوجد

---

## قسم: quality (quality)
- **الهدف العام:** إدارة قسم quality وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### inspections
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /quality/inspections
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### ncrs
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /quality/ncrs
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /quality
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### calibration
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /quality/calibration
- **خدمات / Engines:** لا يوجد

#### stats
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /quality/stats
- **خدمات / Engines:** لا يوجد

---

## قسم: rebates (rebates)
- **الهدف العام:** إدارة قسم rebates وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /rebates
- **مسارات API:** /rebates
- **خدمات / Engines:** لا يوجد

---

## قسم: receipt-vouchers (receipt-vouchers)
- **الهدف العام:** إدارة قسم receipt-vouchers وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /receipt-vouchers
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: recurring-invoices (recurring-invoices)
- **الهدف العام:** إدارة قسم recurring-invoices وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /recurring-invoices
- **مسارات API:** /recurring-invoices
- **خدمات / Engines:** لا يوجد

---

## قسم: rem (rem)
- **الهدف العام:** إدارة قسم rem وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### installments
- **الحالة:** مكتمل
- **واجهات UI:** /rem/installments
- **مسارات API:** /rem/installments
- **خدمات / Engines:** لا يوجد

#### leases
- **الحالة:** مكتمل
- **واجهات UI:** /rem/leases
- **مسارات API:** /rem/leases
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /rem
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: rent (rent)
- **الهدف العام:** إدارة قسم rent وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /rent
- **مسارات API:** /rent
- **خدمات / Engines:** لا يوجد

---

## قسم: rental (rental)
- **الهدف العام:** إدارة قسم rental وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### agreements
- **الحالة:** مكتمل
- **واجهات UI:** /rental/agreements
- **مسارات API:** /rental/agreements
- **خدمات / Engines:** لا يوجد

#### returns
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /rental/returns
- **خدمات / Engines:** لا يوجد

---

## قسم: التقارير (reports)
- **الهدف العام:** إدارة قسم التقارير وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### 104-modules
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /reports/104-modules
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### 73-modules
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /reports/73-modules
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### aging
- **الحالة:** مكتمل
- **واجهات UI:** /reports/aging
- **مسارات API:** /reports/aging
- **خدمات / Engines:** لا يوجد

#### allocations
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /reports/allocations
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### bi-cube
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /reports/bi-cube
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### budget-variance
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /reports/budget-variance
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### builder
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /reports/builder
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### cashflow
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /reports/cashflow
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### consolidation
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /reports/consolidation
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### customer-statement
- **الحالة:** مكتمل
- **واجهات UI:** /reports/customer-statement
- **مسارات API:** /reports/customer-statement
- **خدمات / Engines:** لا يوجد

#### expiry
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /reports/expiry
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### footnotes
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /reports/footnotes
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### fraud-ai
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /reports/fraud-ai
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### kpi-builder
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /reports/kpi-builder
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### manual-purchases
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /reports/manual-purchases
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /reports
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### pivot
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /reports/pivot
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### returns
- **الحالة:** مكتمل
- **واجهات UI:** /reports/returns
- **مسارات API:** /reports/returns
- **خدمات / Engines:** لا يوجد

#### segments
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /reports/segments
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### zatca-vat
- **الحالة:** مكتمل
- **واجهات UI:** /reports/zatca-vat
- **مسارات API:** /reports/zatca-vat
- **خدمات / Engines:** لا يوجد

#### bi-export
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /reports/bi-export
- **خدمات / Engines:** لا يوجد

#### cash-flow
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /reports/cash-flow
- **خدمات / Engines:** لا يوجد

#### dimensional-gl
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /reports/dimensional-gl
- **خدمات / Engines:** لا يوجد

#### export
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /reports/export
- **خدمات / Engines:** لا يوجد

#### financial-statements
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /reports/financial-statements/generate
- **خدمات / Engines:** لا يوجد

#### what-if
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /reports/what-if
- **خدمات / Engines:** لا يوجد

#### [type]
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /reports/[type]
- **خدمات / Engines:** لا يوجد

---

## قسم: restaurant-pos (restaurant-pos)
- **الهدف العام:** إدارة قسم restaurant-pos وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /restaurant-pos
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: restaurant-tables (restaurant-tables)
- **الهدف العام:** إدارة قسم restaurant-tables وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /restaurant-tables
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: salaries (salaries)
- **الهدف العام:** إدارة قسم salaries وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /salaries
- **مسارات API:** /salaries
- **خدمات / Engines:** لا يوجد

---

## قسم: المبيعات (sales)
- **الهدف العام:** إدارة قسم المبيعات وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### analytics
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /sales/analytics
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### atp-simulator
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /sales/atp-simulator
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### cash-application
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /sales/cash-application
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### commissions
- **الحالة:** مكتمل
- **واجهات UI:** /sales/commissions
- **مسارات API:** /sales/commissions/calculate, /sales/commissions, /sales/commissions/rules, /sales/commissions/run
- **خدمات / Engines:** لا يوجد

#### cpq
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /sales/cpq
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### debit-notes
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /sales/debit-notes
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### delivery-notes
- **الحالة:** مكتمل
- **واجهات UI:** /sales/delivery-notes
- **مسارات API:** /sales/delivery-notes
- **خدمات / Engines:** لا يوجد

#### forecast
- **الحالة:** مكتمل
- **واجهات UI:** /sales/forecast
- **مسارات API:** /sales/forecast
- **خدمات / Engines:** لا يوجد

#### history
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /sales/history
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### options
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /sales/options
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### orders
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /sales/orders/create, /sales/orders
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** مكتمل
- **واجهات UI:** /sales
- **مسارات API:** /sales
- **خدمات / Engines:** commission.service.ts, commissions.service.ts, crm.service.ts, invoice.service.ts, loyalty.service.ts, multi-store.service.ts, pos.service.ts, pricing.service.ts, promotions.service.ts, quote-to-cash.service.ts, returns.service.ts

#### pricing
- **الحالة:** مكتمل
- **واجهات UI:** /sales/pricing
- **مسارات API:** /sales/pricing/calculate, /sales/pricing
- **خدمات / Engines:** لا يوجد

#### returns
- **الحالة:** مكتمل
- **واجهات UI:** /sales/returns/rma
- **مسارات API:** /sales/returns, /sales/returns/[id]/[action]
- **خدمات / Engines:** لا يوجد

#### routes
- **الحالة:** مكتمل
- **واجهات UI:** /sales/routes
- **مسارات API:** /sales/routes
- **خدمات / Engines:** لا يوجد

#### smart-map
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /sales/smart-map
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### statements
- **الحالة:** مكتمل
- **واجهات UI:** /sales/statements
- **مسارات API:** /sales/statements/bulk
- **خدمات / Engines:** لا يوجد

#### targets
- **الحالة:** مكتمل
- **واجهات UI:** /sales/targets
- **مسارات API:** /sales/targets
- **خدمات / Engines:** لا يوجد

#### terminal
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /sales/terminal
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### atp
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /sales/atp/check
- **خدمات / Engines:** لا يوجد

#### invoices
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /sales/invoices
- **خدمات / Engines:** لا يوجد

#### quotes
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /sales/quotes/[id]/accept, /sales/quotes/[id]/convert-to-so, /sales/quotes/[id]/revise
- **خدمات / Engines:** لا يوجد

#### rma
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /sales/rma, /sales/rma/[id]/approve
- **خدمات / Engines:** لا يوجد

---

## قسم: sales-returns (sales-returns)
- **الهدف العام:** إدارة قسم sales-returns وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /sales-returns
- **مسارات API:** /sales-returns
- **خدمات / Engines:** لا يوجد

---

## قسم: school (school)
- **الهدف العام:** إدارة قسم school وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### attendance
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /school/attendance
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### dashboard
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /school/dashboard
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### exams
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /school/exams
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** مكتمل
- **واجهات UI:** /school
- **مسارات API:** /school
- **خدمات / Engines:** لا يوجد

#### schedule
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /school/schedule
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### stages
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /school/stages
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### transport
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /school/transport
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: scm (scm)
- **الهدف العام:** إدارة قسم scm وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /scm
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: الإعدادات (settings)
- **الهدف العام:** إدارة قسم الإعدادات وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### approvals
- **الحالة:** مكتمل
- **واجهات UI:** /settings/approvals
- **مسارات API:** /settings/approvals, /settings/approvals/[id]
- **خدمات / Engines:** لا يوجد

#### bpm
- **الحالة:** مكتمل
- **واجهات UI:** /settings/bpm
- **مسارات API:** /settings/bpm
- **خدمات / Engines:** لا يوجد

#### company
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /settings/company
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### currencies
- **الحالة:** مكتمل
- **واجهات UI:** /settings/currencies
- **مسارات API:** /settings/currencies, /settings/currencies/[id]
- **خدمات / Engines:** لا يوجد

#### custom-fields
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /settings/custom-fields
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### dashboard-builder
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /settings/dashboard-builder
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### import-export
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /settings/import-export
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### number-sequences
- **الحالة:** مكتمل
- **واجهات UI:** /settings/number-sequences
- **مسارات API:** /settings/number-sequences
- **خدمات / Engines:** لا يوجد

#### numbering
- **الحالة:** مكتمل
- **واجهات UI:** /settings/numbering
- **مسارات API:** /settings/numbering
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** مكتمل
- **واجهات UI:** /settings
- **مسارات API:** /settings
- **خدمات / Engines:** لا يوجد

#### permissions
- **الحالة:** مكتمل
- **واجهات UI:** /settings/permissions/fields
- **مسارات API:** /settings/permissions/fields
- **خدمات / Engines:** لا يوجد

#### print-templates
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /settings/print-templates
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### roles
- **الحالة:** مكتمل
- **واجهات UI:** /settings/roles
- **مسارات API:** /settings/roles
- **خدمات / Engines:** لا يوجد

#### security
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /settings/security
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### sso
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /settings/sso
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### state-machine
- **الحالة:** مكتمل
- **واجهات UI:** /settings/state-machine
- **مسارات API:** /settings/state-machine
- **خدمات / Engines:** لا يوجد

#### webhooks
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /settings/webhooks
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### whatsapp
- **الحالة:** مكتمل
- **واجهات UI:** /settings/whatsapp
- **مسارات API:** /settings/whatsapp
- **خدمات / Engines:** لا يوجد

#### workflow-builder
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /settings/workflow-builder
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### zatca
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /settings/zatca
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### api-keys
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /settings/api-keys, /settings/api-keys/[id]
- **خدمات / Engines:** لا يوجد

#### email-templates
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /settings/email-templates
- **خدمات / Engines:** لا يوجد

#### exchange-rates
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /settings/exchange-rates, /settings/exchange-rates/[id]
- **خدمات / Engines:** لا يوجد

#### generate-barcode
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /settings/generate-barcode
- **خدمات / Engines:** لا يوجد

#### generate-keys
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /settings/generate-keys
- **خدمات / Engines:** لا يوجد

#### scheduled-actions
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /settings/scheduled-actions
- **خدمات / Engines:** لا يوجد

#### upload-logo
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /settings/upload-logo
- **خدمات / Engines:** لا يوجد

#### zatca-onboard
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /settings/zatca-onboard
- **خدمات / Engines:** لا يوجد

#### [key]
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /settings/[key]
- **خدمات / Engines:** لا يوجد

---

## قسم: shifts (shifts)
- **الهدف العام:** إدارة قسم shifts وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### monitor
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /shifts/monitor
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** مكتمل
- **واجهات UI:** /shifts
- **مسارات API:** /shifts
- **خدمات / Engines:** لا يوجد

---

## قسم: shipping (shipping)
- **الهدف العام:** إدارة قسم shipping وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /shipping
- **مسارات API:** /shipping
- **خدمات / Engines:** لا يوجد

---

## قسم: shl (shl)
- **الهدف العام:** إدارة قسم shl وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### classes
- **الحالة:** مكتمل
- **واجهات UI:** /shl/classes
- **مسارات API:** /shl/classes
- **خدمات / Engines:** لا يوجد

#### students
- **الحالة:** مكتمل
- **واجهات UI:** /shl/students
- **مسارات API:** /shl/students
- **خدمات / Engines:** لا يوجد

---

## قسم: shopfloor (shopfloor)
- **الهدف العام:** إدارة قسم shopfloor وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /shopfloor
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: smart-transfers (smart-transfers)
- **الهدف العام:** إدارة قسم smart-transfers وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /smart-transfers
- **مسارات API:** /smart-transfers
- **خدمات / Engines:** لا يوجد

---

## قسم: stock (stock)
- **الهدف العام:** إدارة قسم stock وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### adjustments
- **الحالة:** مكتمل
- **واجهات UI:** /stock/adjustments
- **مسارات API:** /stock/adjustments
- **خدمات / Engines:** لا يوجد

#### movements
- **الحالة:** مكتمل
- **واجهات UI:** /stock/movements
- **مسارات API:** /stock/movements
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** مكتمل
- **واجهات UI:** /stock
- **مسارات API:** /stock
- **خدمات / Engines:** لا يوجد

---

## قسم: stock-transfers (stock-transfers)
- **الهدف العام:** إدارة قسم stock-transfers وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /stock-transfers
- **مسارات API:** /stock-transfers
- **خدمات / Engines:** لا يوجد

---

## قسم: stocktake (stocktake)
- **الهدف العام:** إدارة قسم stocktake وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /stocktake
- **مسارات API:** /stocktake
- **خدمات / Engines:** لا يوجد

#### vision
- **الحالة:** مكتمل
- **واجهات UI:** /stocktake/vision
- **مسارات API:** /stocktake/vision
- **خدمات / Engines:** لا يوجد

---

## قسم: subscriptions (subscriptions)
- **الهدف العام:** إدارة قسم subscriptions وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /subscriptions
- **مسارات API:** /subscriptions
- **خدمات / Engines:** لا يوجد

#### plans
- **الحالة:** مكتمل
- **واجهات UI:** /subscriptions/plans
- **مسارات API:** /subscriptions/plans
- **خدمات / Engines:** لا يوجد

#### cancel
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /subscriptions/cancel
- **خدمات / Engines:** لا يوجد

#### process-renewals
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /subscriptions/process-renewals
- **خدمات / Engines:** لا يوجد

#### subscribe
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /subscriptions/subscribe
- **خدمات / Engines:** لا يوجد

---

## قسم: supply-chain (supply-chain)
- **الهدف العام:** إدارة قسم supply-chain وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### rfx-auction
- **الحالة:** مكتمل
- **واجهات UI:** /supply-chain/rfx-auction
- **مسارات API:** /supply-chain/rfx-auction
- **خدمات / Engines:** لا يوجد

#### vendor-onboarding
- **الحالة:** مكتمل
- **واجهات UI:** /supply-chain/vendor-onboarding
- **مسارات API:** /supply-chain/vendor-onboarding
- **خدمات / Engines:** لا يوجد

---

## قسم: support (support)
- **الهدف العام:** إدارة قسم support وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### help-desk
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /support/help-desk
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### sla
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /support/sla
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: sys (sys)
- **الهدف العام:** إدارة قسم sys وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### alerts
- **الحالة:** مكتمل
- **واجهات UI:** /sys/alerts
- **مسارات API:** /sys/alerts
- **خدمات / Engines:** لا يوجد

#### health
- **الحالة:** مكتمل
- **واجهات UI:** /sys/health
- **مسارات API:** /sys/health
- **خدمات / Engines:** لا يوجد

#### desktop-crash
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /sys/desktop-crash
- **خدمات / Engines:** لا يوجد

---

## قسم: tax (tax)
- **الهدف العام:** إدارة قسم tax وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /tax
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### vat-returns
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /tax/vat-returns
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### wht
- **الحالة:** مكتمل
- **واجهات UI:** /tax/wht
- **مسارات API:** /tax/wht
- **خدمات / Engines:** لا يوجد

#### zakat
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /tax/zakat
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### zatca-onboard
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /tax/zatca-onboard
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: treasury (treasury)
- **الهدف العام:** إدارة قسم treasury وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### bank-recon
- **الحالة:** مكتمل
- **واجهات UI:** /treasury/bank-recon
- **مسارات API:** /treasury/bank-recon
- **خدمات / Engines:** لا يوجد

#### bank-reconciliation
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /treasury/bank-reconciliation
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### cash-flow
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /treasury/cash-flow
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### cash-forecast
- **الحالة:** مكتمل
- **واجهات UI:** /treasury/cash-forecast
- **مسارات API:** /treasury/cash-forecast
- **خدمات / Engines:** لا يوجد

#### cash-position
- **الحالة:** مكتمل
- **واجهات UI:** /treasury/cash-position
- **مسارات API:** /treasury/cash-position, /treasury/cash-position/snapshot
- **خدمات / Engines:** لا يوجد

#### checks
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /treasury/checks
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### liquidity
- **الحالة:** مكتمل
- **واجهات UI:** /treasury/liquidity
- **مسارات API:** /treasury/liquidity/forecast/generate, /treasury/liquidity/forecast
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** مكتمل
- **واجهات UI:** /treasury
- **مسارات API:** /treasury
- **خدمات / Engines:** bank-reconciliation.service.ts, cash-flow-forecast.service.ts, cash-flow.service.ts, cash-pooling.service.ts, cheque.service.ts, lc-bg.service.ts, statement-import.service.ts

#### petty-cash
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /treasury/petty-cash
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### balance
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /treasury/balance
- **خدمات / Engines:** لا يوجد

#### bank-import
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /treasury/bank-import
- **خدمات / Engines:** لا يوجد

#### bank-statement
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /treasury/bank-statement
- **خدمات / Engines:** لا يوجد

#### bank-statements
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /treasury/bank-statements
- **خدمات / Engines:** لا يوجد

#### dashboard
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /treasury/dashboard
- **خدمات / Engines:** لا يوجد

#### recon-exceptions
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /treasury/recon-exceptions
- **خدمات / Engines:** لا يوجد

---

## قسم: v3 (v3)
- **الهدف العام:** إدارة قسم v3 وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### clinic
- **الحالة:** مكتمل
- **واجهات UI:** /v3/clinic/appointments, /v3/clinic/emr, /v3/clinic/erx, /v3/clinic/lab, /v3/clinic
- **مسارات API:** /v3/clinic/appointments, /v3/clinic/emr, /v3/clinic/erx, /v3/clinic/lab
- **خدمات / Engines:** لا يوجد

#### construction
- **الحالة:** مكتمل
- **واجهات UI:** /v3/construction/boq, /v3/construction, /v3/construction/progress-billing, /v3/construction/variations
- **مسارات API:** /v3/construction/boq, /v3/construction/progress-billing, /v3/construction/variations
- **خدمات / Engines:** لا يوجد

#### distribution
- **الحالة:** مكتمل
- **واجهات UI:** /v3/distribution, /v3/distribution/picking/wave, /v3/distribution/routes, /v3/distribution/wms
- **مسارات API:** /v3/distribution/picking/wave, /v3/distribution/routes, /v3/distribution/wms
- **خدمات / Engines:** لا يوجد

#### manufacturing
- **الحالة:** مكتمل
- **واجهات UI:** /v3/manufacturing/mrp, /v3/manufacturing, /v3/manufacturing/shopfloor
- **مسارات API:** /v3/manufacturing/mrp, /v3/manufacturing/shopfloor
- **خدمات / Engines:** لا يوجد

#### master
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /v3/master
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### realestate
- **الحالة:** مكتمل
- **واجهات UI:** /v3/realestate/cam, /v3/realestate/leases, /v3/realestate
- **مسارات API:** /v3/realestate/leases
- **خدمات / Engines:** لا يوجد

#### restaurant
- **الحالة:** مكتمل
- **واجهات UI:** /v3/restaurant/kds, /v3/restaurant, /v3/restaurant/tables
- **مسارات API:** /v3/restaurant/kds
- **خدمات / Engines:** لا يوجد

#### retail
- **الحالة:** مكتمل
- **واجهات UI:** /v3/retail/loyalty, /v3/retail, /v3/retail/pos
- **مسارات API:** /v3/retail/pos
- **خدمات / Engines:** لا يوجد

#### school
- **الحالة:** مكتمل
- **واجهات UI:** /v3/school/gradebook, /v3/school, /v3/school/sis, /v3/school/transcripts
- **مسارات API:** /v3/school/sis
- **خدمات / Engines:** لا يوجد

#### services
- **الحالة:** مكتمل
- **واجهات UI:** /v3/services, /v3/services/sla, /v3/services/timesheet, /v3/services/workorders
- **مسارات API:** /v3/services/timesheet
- **خدمات / Engines:** لا يوجد

---

## قسم: vacations (vacations)
- **الهدف العام:** إدارة قسم vacations وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /vacations
- **مسارات API:** /vacations
- **خدمات / Engines:** لا يوجد

---

## قسم: vat (vat)
- **الهدف العام:** إدارة قسم vat وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /vat
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### categories
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /vat/categories
- **خدمات / Engines:** لا يوجد

---

## قسم: vendor-portal (vendor-portal)
- **الهدف العام:** إدارة قسم vendor-portal وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /vendor-portal
- **مسارات API:** /vendor-portal
- **خدمات / Engines:** لا يوجد

---

## قسم: vendor-ratings (vendor-ratings)
- **الهدف العام:** إدارة قسم vendor-ratings وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /vendor-ratings
- **مسارات API:** /vendor-ratings
- **خدمات / Engines:** لا يوجد

---

## قسم: warehouses (warehouses)
- **الهدف العام:** إدارة قسم warehouses وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### alerts
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /warehouses/alerts
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### fifo
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /warehouses/fifo
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### map
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /warehouses/map
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### options
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /warehouses/options
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** مكتمل
- **واجهات UI:** /warehouses
- **مسارات API:** /warehouses
- **خدمات / Engines:** لا يوجد

#### analytics
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /warehouses/analytics
- **خدمات / Engines:** لا يوجد

#### wms
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /warehouses/wms
- **خدمات / Engines:** لا يوجد

#### [id]
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /warehouses/[id]
- **خدمات / Engines:** لا يوجد

---

## قسم: warranty (warranty)
- **الهدف العام:** إدارة قسم warranty وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /warranty
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### check
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /warranty/check
- **خدمات / Engines:** لا يوجد

---

## قسم: whatsapp-hub (whatsapp-hub)
- **الهدف العام:** إدارة قسم whatsapp-hub وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /whatsapp-hub
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: wht (wht)
- **الهدف العام:** إدارة قسم wht وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /wht
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### calculate
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /wht/calculate
- **خدمات / Engines:** لا يوجد

#### form14
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /wht/form14/generate, /wht/form14
- **خدمات / Engines:** لا يوجد

---

## قسم: wms (wms)
- **الهدف العام:** إدارة قسم wms وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### waves
- **الحالة:** مكتمل
- **واجهات UI:** /wms/waves
- **مسارات API:** /wms/waves
- **خدمات / Engines:** لا يوجد

---

## قسم: zakat (zakat)
- **الهدف العام:** إدارة قسم zakat وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /zakat
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### assessments
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /zakat/assessments, /zakat/assessments/[id]/adjustments, /zakat/assessments/[id]/file, /zakat/assessments/[id]/finalize, /zakat/assessments/[id]
- **خدمات / Engines:** لا يوجد

---

## قسم: ZATCA (zatca)
- **الهدف العام:** إدارة قسم ZATCA وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /zatca
- **مسارات API:** /zatca
- **خدمات / Engines:** archive.service.ts, certificate-renewal.service.ts, compliance-test.service.ts, icv-chain.service.ts, late-submissions.service.ts, onboarding.service.ts, phase2-mode.service.ts, qr-validation.service.ts

#### generate-request
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /zatca/generate-request
- **خدمات / Engines:** لا يوجد

#### late-submissions
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /zatca/late-submissions
- **خدمات / Engines:** لا يوجد

#### onboard
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /zatca/onboard
- **خدمات / Engines:** لا يوجد

#### qr
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /zatca/qr
- **خدمات / Engines:** لا يوجد

#### reverse-charge
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /zatca/reverse-charge
- **خدمات / Engines:** لا يوجد

#### test
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /zatca/test
- **خدمات / Engines:** لا يوجد

#### xml
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /zatca/xml
- **خدمات / Engines:** لا يوجد

---

## قسم: _ice_archive (_ice_archive)
- **الهدف العام:** إدارة قسم _ice_archive وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /_ice_archive
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: accounts (accounts)
- **الهدف العام:** إدارة قسم accounts وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /accounts
- **خدمات / Engines:** لا يوجد

---

## قسم: adjustments (adjustments)
- **الهدف العام:** إدارة قسم adjustments وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /adjustments
- **خدمات / Engines:** لا يوجد

---

## قسم: ar (ar)
- **الهدف العام:** إدارة قسم ar وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### credit
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /ar/credit
- **خدمات / Engines:** لا يوجد

#### dunning
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /ar/dunning
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** Service only
- **واجهات UI:** لا يوجد
- **مسارات API:** لا يوجد
- **خدمات / Engines:** credit-management.service.ts

---

## قسم: المصادقة (auth)
- **الهدف العام:** إدارة قسم المصادقة وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### 2fa
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /auth/2fa/backup-codes, /auth/2fa/login, /auth/2fa/setup, /auth/2fa/verify
- **خدمات / Engines:** لا يوجد

#### auto-login
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /auth/auto-login
- **خدمات / Engines:** لا يوجد

#### find-tenant-by-email
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /auth/find-tenant-by-email
- **خدمات / Engines:** لا يوجد

#### login
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /auth/login
- **خدمات / Engines:** لا يوجد

#### login-by-email
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /auth/login-by-email
- **خدمات / Engines:** لا يوجد

#### me
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /auth/me
- **خدمات / Engines:** لا يوجد

#### mfa
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /auth/mfa/audit-log, /auth/mfa/backup-verify, /auth/mfa/confirm, /auth/mfa/disable, /auth/mfa/enroll, /auth/mfa/qr-code, /auth/mfa/recovery, /auth/mfa/regenerate-codes, /auth/mfa/status, /auth/mfa/trust-device, /auth/mfa/trusted-devices/[id], /auth/mfa/verify
- **خدمات / Engines:** لا يوجد

#### sso
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /auth/sso
- **خدمات / Engines:** لا يوجد

#### sso-redirect
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /auth/sso-redirect
- **خدمات / Engines:** لا يوجد

#### sync
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /auth/sync
- **خدمات / Engines:** لا يوجد

#### routing
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /auth/routing
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: b2b (b2b)
- **الهدف العام:** إدارة قسم b2b وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### checkout
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /b2b/checkout
- **خدمات / Engines:** لا يوجد

#### login
- **الحالة:** مكتمل
- **واجهات UI:** /b2b/login
- **مسارات API:** /b2b/login
- **خدمات / Engines:** لا يوجد

#### shop
- **الحالة:** مكتمل
- **واجهات UI:** /b2b/shop
- **مسارات API:** /b2b/shop
- **خدمات / Engines:** لا يوجد

---

## قسم: bnpl (bnpl)
- **الهدف العام:** إدارة قسم bnpl وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### create-session
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /bnpl/create-session
- **خدمات / Engines:** لا يوجد

#### status
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /bnpl/status
- **خدمات / Engines:** لا يوجد

#### tabby
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /bnpl/tabby
- **خدمات / Engines:** لا يوجد

#### tamara
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /bnpl/tamara
- **خدمات / Engines:** لا يوجد

---

## قسم: budgeting (budgeting)
- **الهدف العام:** إدارة قسم budgeting وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### encumbrance
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /budgeting/encumbrance
- **خدمات / Engines:** لا يوجد

#### variance
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /budgeting/variance
- **خدمات / Engines:** لا يوجد

---

## قسم: budgets (budgets)
- **الهدف العام:** إدارة قسم budgets وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /budgets
- **خدمات / Engines:** لا يوجد

#### scenarios
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /budgets/scenarios
- **خدمات / Engines:** لا يوجد

---

## قسم: categories (categories)
- **الهدف العام:** إدارة قسم categories وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /categories
- **خدمات / Engines:** لا يوجد

#### [id]
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /categories/[id]
- **خدمات / Engines:** لا يوجد

---

## قسم: chains (chains)
- **الهدف العام:** إدارة قسم chains وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### [chain]
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /chains/[chain]
- **خدمات / Engines:** لا يوجد

---

## قسم: check-env (check-env)
- **الهدف العام:** إدارة قسم check-env وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /check-env
- **خدمات / Engines:** لا يوجد

---

## قسم: cron (cron)
- **الهدف العام:** إدارة قسم cron وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### approval-sla
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/approval-sla
- **خدمات / Engines:** لا يوجد

#### ar-collection-dunning
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/ar-collection-dunning
- **خدمات / Engines:** لا يوجد

#### backup
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/backup
- **خدمات / Engines:** لا يوجد

#### contract-expiry
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/contract-expiry
- **خدمات / Engines:** لا يوجد

#### contracts
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/contracts
- **خدمات / Engines:** لا يوجد

#### cycle-count
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/cycle-count
- **خدمات / Engines:** لا يوجد

#### daily-audit
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/daily-audit
- **خدمات / Engines:** لا يوجد

#### debts
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/debts
- **خدمات / Engines:** لا يوجد

#### depreciation-monthly
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/depreciation-monthly
- **خدمات / Engines:** لا يوجد

#### document-expiry
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/document-expiry
- **خدمات / Engines:** لا يوجد

#### ecl
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/ecl
- **خدمات / Engines:** لا يوجد

#### fx-revaluation
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/fx-revaluation
- **خدمات / Engines:** لا يوجد

#### hr
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/hr
- **خدمات / Engines:** لا يوجد

#### ifrs16-monthly
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/ifrs16-monthly
- **خدمات / Engines:** لا يوجد

#### payment-reminders
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/payment-reminders
- **خدمات / Engines:** لا يوجد

#### payroll-monthly
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/payroll-monthly
- **خدمات / Engines:** لا يوجد

#### predictive-po
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/predictive-po
- **خدمات / Engines:** لا يوجد

#### prepayments-amortization
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/prepayments-amortization
- **خدمات / Engines:** لا يوجد

#### rag-reindex
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/rag-reindex
- **خدمات / Engines:** لا يوجد

#### recurring-billing
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/recurring-billing
- **خدمات / Engines:** لا يوجد

#### rem-leases
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/rem-leases
- **خدمات / Engines:** لا يوجد

#### reorder-alerts
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/reorder-alerts
- **خدمات / Engines:** لا يوجد

#### scheduled-reports
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/scheduled-reports
- **خدمات / Engines:** لا يوجد

#### self-healer
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/self-healer
- **خدمات / Engines:** لا يوجد

#### shifts
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/shifts
- **خدمات / Engines:** لا يوجد

#### trigger-invoices
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/trigger-invoices
- **خدمات / Engines:** لا يوجد

#### vat-return-reminder
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/vat-return-reminder
- **خدمات / Engines:** لا يوجد

#### vendor-scoring
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/vendor-scoring
- **خدمات / Engines:** لا يوجد

#### zatca-batch-submit
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/zatca-batch-submit
- **خدمات / Engines:** لا يوجد

#### zatca-worker
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /cron/zatca-worker
- **خدمات / Engines:** لا يوجد

---

## قسم: customer (customer)
- **الهدف العام:** إدارة قسم customer وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### table
- **الحالة:** مكتمل
- **واجهات UI:** /customer/table/[qrToken]
- **مسارات API:** /customer/table/[qrToken]
- **خدمات / Engines:** لا يوجد

---

## قسم: delivery-platforms (delivery-platforms)
- **الهدف العام:** إدارة قسم delivery-platforms وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /delivery-platforms
- **خدمات / Engines:** لا يوجد

---

## قسم: desktop (desktop)
- **الهدف العام:** إدارة قسم desktop وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### trial
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /desktop/trial/verify
- **خدمات / Engines:** لا يوجد

#### verify-license
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /desktop/verify-license
- **خدمات / Engines:** لا يوجد

---

## قسم: email (email)
- **الهدف العام:** إدارة قسم email وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /email
- **خدمات / Engines:** لا يوجد

---

## قسم: explain (explain)
- **الهدف العام:** إدارة قسم explain وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /explain
- **خدمات / Engines:** لا يوجد

---

## قسم: gaps (gaps)
- **الهدف العام:** إدارة قسم gaps وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### abc-costing
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /gaps/abc-costing
- **خدمات / Engines:** لا يوجد

#### anomaly
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /gaps/anomaly
- **خدمات / Engines:** لا يوجد

#### esg
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /gaps/esg
- **خدمات / Engines:** لا يوجد

#### evm
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /gaps/evm
- **خدمات / Engines:** لا يوجد

#### forecast-v2
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /gaps/forecast-v2
- **خدمات / Engines:** لا يوجد

---

## قسم: grn (grn)
- **الهدف العام:** إدارة قسم grn وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /grn
- **خدمات / Engines:** لا يوجد

---

## قسم: health (health)
- **الهدف العام:** إدارة قسم health وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /health
- **خدمات / Engines:** لا يوجد

---

## قسم: help (help)
- **الهدف العام:** إدارة قسم help وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /help
- **خدمات / Engines:** لا يوجد

---

## قسم: ice (ice)
- **الهدف العام:** إدارة قسم ice وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### admin
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /ice/admin/2fa/disable, /ice/admin/2fa/enable, /ice/admin/2fa/generate
- **خدمات / Engines:** لا يوجد

#### auth
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /ice/auth/2fa/verify, /ice/auth/login, /ice/auth
- **خدمات / Engines:** لا يوجد

#### backup
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /ice/backup/download, /ice/backup/list, /ice/backup/upload
- **خدمات / Engines:** لا يوجد

#### desktop-licenses
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /ice/desktop-licenses
- **خدمات / Engines:** لا يوجد

#### desktop-register
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /ice/desktop-register
- **خدمات / Engines:** لا يوجد

#### license
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /ice/license/verify
- **خدمات / Engines:** لا يوجد

#### subscriptions
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /ice/subscriptions
- **خدمات / Engines:** لا يوجد

#### tenant-features
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /ice/tenant-features
- **خدمات / Engines:** لا يوجد

#### tenants
- **الحالة:** مكتمل
- **واجهات UI:** /ice/tenants
- **مسارات API:** /ice/tenants
- **خدمات / Engines:** لا يوجد

#### toggle
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /ice/toggle
- **خدمات / Engines:** لا يوجد

#### admins
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /ice/admins
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### audit
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /ice/audit
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### billing
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /ice/billing
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### health
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /ice/health
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### licenses
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /ice/licenses
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### login
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /ice/login/2fa, /ice/login
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### modules
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /ice/modules
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /ice
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### settings
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /ice/settings
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### support
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /ice/support
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: integrations (integrations)
- **الهدف العام:** إدارة قسم integrations وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### mudad
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /integrations/mudad
- **خدمات / Engines:** لا يوجد

---

## قسم: license (license)
- **الهدف العام:** إدارة قسم license وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### verify
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /license/verify
- **خدمات / Engines:** لا يوجد

---

## قسم: manifest (manifest)
- **الهدف العام:** إدارة قسم manifest وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /manifest
- **خدمات / Engines:** لا يوجد

---

## قسم: master (master)
- **الهدف العام:** إدارة قسم master وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** مكتمل
- **واجهات UI:** /master
- **مسارات API:** /master
- **خدمات / Engines:** لا يوجد

---

## قسم: master-panel (master-panel)
- **الهدف العام:** إدارة قسم master-panel وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### auth
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /master-panel/auth
- **خدمات / Engines:** لا يوجد

#### deploy
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /master-panel/deploy
- **خدمات / Engines:** لا يوجد

#### licenses
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /master-panel/licenses
- **خدمات / Engines:** لا يوجد

#### servers
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /master-panel/servers
- **خدمات / Engines:** لا يوجد

#### login
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /master-panel/login
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /master-panel
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: master-panel-data (master-panel-data)
- **الهدف العام:** إدارة قسم master-panel-data وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /master-panel-data
- **خدمات / Engines:** لا يوجد

---

## قسم: metrics (metrics)
- **الهدف العام:** إدارة قسم metrics وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /metrics
- **خدمات / Engines:** لا يوجد

---

## قسم: migration (migration)
- **الهدف العام:** إدارة قسم migration وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### start
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /migration/start
- **خدمات / Engines:** لا يوجد

---

## قسم: notifications (notifications)
- **الهدف العام:** إدارة قسم notifications وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### stream
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /notifications/stream
- **خدمات / Engines:** لا يوجد

---

## قسم: open-items (open-items)
- **الهدف العام:** إدارة قسم open-items وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### allocate
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /open-items/allocate/customer-allocation, /open-items/allocate/reversal, /open-items/allocate/supplier-allocation
- **خدمات / Engines:** لا يوجد

#### preview
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /open-items/preview/customer-allocation, /open-items/preview/reversal, /open-items/preview/supplier-allocation
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /open-items
- **خدمات / Engines:** لا يوجد

---

## قسم: openapi (openapi)
- **الهدف العام:** إدارة قسم openapi وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /openapi
- **خدمات / Engines:** لا يوجد

---

## قسم: packaging-units (packaging-units)
- **الهدف العام:** إدارة قسم packaging-units وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /packaging-units
- **خدمات / Engines:** لا يوجد

---

## قسم: platform (platform)
- **الهدف العام:** إدارة قسم platform وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### dms
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /platform/dms
- **خدمات / Engines:** لا يوجد

#### encryption
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /platform/encryption
- **خدمات / Engines:** لا يوجد

#### esignature
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /platform/esignature
- **خدمات / Engines:** لا يوجد

#### forms
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /platform/forms
- **خدمات / Engines:** لا يوجد

#### ipaas
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /platform/ipaas
- **خدمات / Engines:** لا يوجد

#### localization
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /platform/localization
- **خدمات / Engines:** لا يوجد

#### reports
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /platform/reports
- **خدمات / Engines:** لا يوجد

#### sso
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /platform/sso
- **خدمات / Engines:** لا يوجد

#### webhooks
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /platform/webhooks
- **خدمات / Engines:** لا يوجد

---

## قسم: portals (portals)
- **الهدف العام:** إدارة قسم portals وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### parent
- **الحالة:** مكتمل
- **واجهات UI:** /portals/parent
- **مسارات API:** /portals/parent
- **خدمات / Engines:** لا يوجد

#### tenant
- **الحالة:** مكتمل
- **واجهات UI:** /portals/tenant
- **مسارات API:** /portals/tenant
- **خدمات / Engines:** لا يوجد

---

## قسم: product-stocks (product-stocks)
- **الهدف العام:** إدارة قسم product-stocks وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### location
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /product-stocks/location
- **خدمات / Engines:** لا يوجد

---

## قسم: public (public)
- **الهدف العام:** إدارة قسم public وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### call-waiter
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /public/call-waiter
- **خدمات / Engines:** لا يوجد

#### menu
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /public/menu
- **خدمات / Engines:** لا يوجد

#### order
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /public/order
- **خدمات / Engines:** لا يوجد

#### table
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /public/table
- **خدمات / Engines:** لا يوجد

---

## قسم: purchasing (purchasing)
- **الهدف العام:** إدارة قسم purchasing وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### three-way-match
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /purchasing/three-way-match
- **خدمات / Engines:** لا يوجد

---

## قسم: restaurant (restaurant)
- **الهدف العام:** إدارة قسم restaurant وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### pos
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /restaurant/pos/resolve, /restaurant/pos/status
- **خدمات / Engines:** لا يوجد

#### table
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /restaurant/table/call, /restaurant/table/info
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /restaurant
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: sales-orders (sales-orders)
- **الهدف العام:** إدارة قسم sales-orders وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /sales-orders
- **خدمات / Engines:** لا يوجد

#### [id]
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /sales-orders/[id]/process
- **خدمات / Engines:** لا يوجد

---

## قسم: saudi (saudi)
- **الهدف العام:** إدارة قسم saudi وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### mudad
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /saudi/mudad/compliance
- **خدمات / Engines:** لا يوجد

#### nitaqat
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /saudi/nitaqat/projection
- **خدمات / Engines:** لا يوجد

#### qiwa
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /saudi/qiwa/contracts/[employeeId], /saudi/qiwa/sync
- **خدمات / Engines:** لا يوجد

#### saudization
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /saudi/saudization/snapshot
- **خدمات / Engines:** لا يوجد

---

## قسم: search (search)
- **الهدف العام:** إدارة قسم search وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### semantic
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /search/semantic
- **خدمات / Engines:** لا يوجد

---

## قسم: service (service)
- **الهدف العام:** إدارة قسم service وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### sla
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /service/sla
- **خدمات / Engines:** لا يوجد

---

## قسم: shipments (shipments)
- **الهدف العام:** إدارة قسم shipments وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### delivery-notes
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /shipments/delivery-notes
- **خدمات / Engines:** لا يوجد

#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /shipments
- **خدمات / Engines:** لا يوجد

---

## قسم: stock-movements (stock-movements)
- **الهدف العام:** إدارة قسم stock-movements وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /stock-movements
- **خدمات / Engines:** لا يوجد

---

## قسم: subscription-status (subscription-status)
- **الهدف العام:** إدارة قسم subscription-status وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /subscription-status
- **خدمات / Engines:** لا يوجد

---

## قسم: system (system)
- **الهدف العام:** إدارة قسم system وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### comments
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /system/comments
- **خدمات / Engines:** لا يوجد

#### dashboard-builder
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /system/dashboard-builder
- **خدمات / Engines:** لا يوجد

#### dms
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /system/dms
- **خدمات / Engines:** لا يوجد

#### import-export
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /system/import-export
- **خدمات / Engines:** لا يوجد

#### kanban
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /system/kanban
- **خدمات / Engines:** لا يوجد

#### notifications
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /system/notifications
- **خدمات / Engines:** لا يوجد

#### numbering
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /system/numbering
- **خدمات / Engines:** لا يوجد

#### pivot
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /system/pivot
- **خدمات / Engines:** لا يوجد

#### print-templates
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /system/print-templates
- **خدمات / Engines:** لا يوجد

#### reset
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /system/reset
- **خدمات / Engines:** لا يوجد

#### search
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /system/search
- **خدمات / Engines:** لا يوجد

#### workflow
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /system/workflow
- **خدمات / Engines:** لا يوجد

---

## قسم: telegram (telegram)
- **الهدف العام:** إدارة قسم telegram وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### process
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /telegram/process
- **خدمات / Engines:** لا يوجد

#### webhook
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /telegram/webhook
- **خدمات / Engines:** لا يوجد

---

## قسم: tenant (tenant)
- **الهدف العام:** إدارة قسم tenant وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### check-status
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /tenant/check-status
- **خدمات / Engines:** لا يوجد

#### create
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /tenant/create
- **خدمات / Engines:** لا يوجد

#### hidden-modules
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /tenant/hidden-modules
- **خدمات / Engines:** لا يوجد

#### provision
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /tenant/provision
- **خدمات / Engines:** لا يوجد

#### seed-company
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /tenant/seed-company
- **خدمات / Engines:** لا يوجد

#### status
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /tenant/status
- **خدمات / Engines:** لا يوجد

#### trial-status
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /tenant/trial-status
- **خدمات / Engines:** لا يوجد

---

## قسم: test (test)
- **الهدف العام:** إدارة قسم test وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /test
- **خدمات / Engines:** لا يوجد

---

## قسم: test-runs (test-runs)
- **الهدف العام:** إدارة قسم test-runs وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /test-runs
- **خدمات / Engines:** لا يوجد

---

## قسم: test-tenant (test-tenant)
- **الهدف العام:** إدارة قسم test-tenant وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /test-tenant
- **خدمات / Engines:** لا يوجد

---

## قسم: test-translation (test-translation)
- **الهدف العام:** إدارة قسم test-translation وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /test-translation
- **خدمات / Engines:** لا يوجد

---

## قسم: translate (translate)
- **الهدف العام:** إدارة قسم translate وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /translate
- **خدمات / Engines:** لا يوجد

---

## قسم: transliterate (transliterate)
- **الهدف العام:** إدارة قسم transliterate وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /transliterate
- **خدمات / Engines:** لا يوجد

---

## قسم: units (units)
- **الهدف العام:** إدارة قسم units وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /units
- **خدمات / Engines:** لا يوجد

---

## قسم: upload (upload)
- **الهدف العام:** إدارة قسم upload وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /upload
- **خدمات / Engines:** لا يوجد

---

## قسم: المستخدمون والصلاحيات (users)
- **الهدف العام:** إدارة قسم المستخدمون والصلاحيات وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /users
- **خدمات / Engines:** لا يوجد

---

## قسم: v2 (v2)
- **الهدف العام:** إدارة قسم v2 وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### sales
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /v2/sales/invoices
- **خدمات / Engines:** لا يوجد

---

## قسم: vendors (vendors)
- **الهدف العام:** إدارة قسم vendors وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### scorecard
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /vendors/scorecard
- **خدمات / Engines:** لا يوجد

#### [id]
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /vendors/[id]/statement
- **خدمات / Engines:** لا يوجد

---

## قسم: version (version)
- **الهدف العام:** إدارة قسم version وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /version
- **خدمات / Engines:** لا يوجد

---

## قسم: warehouse (warehouse)
- **الهدف العام:** إدارة قسم warehouse وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### cross-dock
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /warehouse/cross-dock
- **خدمات / Engines:** لا يوجد

#### slotting
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /warehouse/slotting
- **خدمات / Engines:** لا يوجد

---

## قسم: webhooks (webhooks)
- **الهدف العام:** إدارة قسم webhooks وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /webhooks
- **خدمات / Engines:** manager.ts

#### salla
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /webhooks/salla
- **خدمات / Engines:** لا يوجد

#### zid
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /webhooks/zid
- **خدمات / Engines:** لا يوجد

#### [id]
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /webhooks/[id]/rotate-secret, /webhooks/[id]
- **خدمات / Engines:** لا يوجد

---

## قسم: whatsapp (whatsapp)
- **الهدف العام:** إدارة قسم whatsapp وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### interactive
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /whatsapp/interactive
- **خدمات / Engines:** لا يوجد

---

## قسم: work-shifts (work-shifts)
- **الهدف العام:** إدارة قسم work-shifts وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Backend only
- **واجهات UI:** لا يوجد
- **مسارات API:** /work-shifts
- **خدمات / Engines:** لا يوجد

---

## قسم: api-docs (api-docs)
- **الهدف العام:** إدارة قسم api-docs وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /api-docs
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: auto-login (auto-login)
- **الهدف العام:** إدارة قسم auto-login وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /auto-login
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: billing-expired (billing-expired)
- **الهدف العام:** إدارة قسم billing-expired وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /billing-expired
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: company-info (company-info)
- **الهدف العام:** إدارة قسم company-info وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /company-info
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: company-setup (company-setup)
- **الهدف العام:** إدارة قسم company-setup وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /company-setup
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: design1 (design1)
- **الهدف العام:** إدارة قسم design1 وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /design1
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: design2 (design2)
- **الهدف العام:** إدارة قسم design2 وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /design2
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: design3 (design3)
- **الهدف العام:** إدارة قسم design3 وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /design3
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: design4 (design4)
- **الهدف العام:** إدارة قسم design4 وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /design4
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: factory (factory)
- **الهدف العام:** إدارة قسم factory وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /factory
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: features (features)
- **الهدف العام:** إدارة قسم features وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /features
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: invoice (invoice)
- **الهدف العام:** إدارة قسم invoice وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### [id]
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /invoice/[id]
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: kiosk (kiosk)
- **الهدف العام:** إدارة قسم kiosk وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### attendance
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /kiosk/attendance
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: login (login)
- **الهدف العام:** إدارة قسم login وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /login
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: menu (menu)
- **الهدف العام:** إدارة قسم menu وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### [tableId]
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /menu/[tableId]
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: home (home)
- **الهدف العام:** إدارة قسم home وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: pricing (pricing)
- **الهدف العام:** إدارة قسم pricing وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /pricing
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: qr-menu (qr-menu)
- **الهدف العام:** إدارة قسم qr-menu وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### [token]
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /qr-menu/[token]
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: retail (retail)
- **الهدف العام:** إدارة قسم retail وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /retail
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: sentry-example-page (sentry-example-page)
- **الهدف العام:** إدارة قسم sentry-example-page وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /sentry-example-page
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: shop (shop)
- **الهدف العام:** إدارة قسم shop وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /shop
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: sign-in (sign-in)
- **الهدف العام:** إدارة قسم sign-in وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### [[...sign-in]]
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /sign-in/[[...sign-in]]
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: sign-up (sign-up)
- **الهدف العام:** إدارة قسم sign-up وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### [[...sign-up]]
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /sign-up/[[...sign-up]]
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: sso-callback (sso-callback)
- **الهدف العام:** إدارة قسم sso-callback وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /sso-callback
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: test-i18n (test-i18n)
- **الهدف العام:** إدارة قسم test-i18n وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /test-i18n
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: trust (trust)
- **الهدف العام:** إدارة قسم trust وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /trust
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: ~offline (~offline)
- **الهدف العام:** إدارة قسم ~offline وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** UI only (يحتاج ربط API)
- **واجهات UI:** /~offline
- **مسارات API:** لا يوجد
- **خدمات / Engines:** لا يوجد

---

## قسم: fa (fa)
- **الهدف العام:** إدارة قسم fa وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Service only
- **واجهات UI:** لا يوجد
- **مسارات API:** لا يوجد
- **خدمات / Engines:** fixed-asset.service.ts

---

## قسم: gl (gl)
- **الهدف العام:** إدارة قسم gl وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Service only
- **واجهات UI:** لا يوجد
- **مسارات API:** لا يوجد
- **خدمات / Engines:** account-determination.service.ts

---

## قسم: gosi (gosi)
- **الهدف العام:** إدارة قسم gosi وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Service only
- **واجهات UI:** لا يوجد
- **مسارات API:** لا يوجد
- **خدمات / Engines:** api.service.ts, onboarding.service.ts, rates-calculator.service.ts, reconciliation.service.ts

---

## قسم: index (index)
- **الهدف العام:** إدارة قسم index وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Service only
- **واجهات UI:** لا يوجد
- **مسارات API:** لا يوجد
- **خدمات / Engines:** index.ts

---

## قسم: payables (payables)
- **الهدف العام:** إدارة قسم payables وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Service only
- **واجهات UI:** لا يوجد
- **مسارات API:** لا يوجد
- **خدمات / Engines:** payment-run.service.ts, ppv-analysis.service.ts, three-way-match.service.ts, vendor-aging.service.ts, wht.service.ts

---

## قسم: receivables (receivables)
- **الهدف العام:** إدارة قسم receivables وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Service only
- **واجهات UI:** لا يوجد
- **مسارات API:** لا يوجد
- **خدمات / Engines:** aging-dunning.service.ts, auto-cash-application.service.ts, bad-debt.service.ts, credit-management.service.ts, customer-statement.service.ts

---

## قسم: reporting (reporting)
- **الهدف العام:** إدارة قسم reporting وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Service only
- **واجهات UI:** لا يوجد
- **مسارات API:** لا يوجد
- **خدمات / Engines:** budget-vs-actual.service.ts, budget.service.ts, cashflow-indirect.service.ts, comparative.service.ts, custom-builder.service.ts, equity-changes.service.ts, notes-fs.service.ts, scheduled.service.ts, segment.service.ts, vat-return.service.ts, xbrl.service.ts, zakat-calculator.service.ts

---

## قسم: shared (shared)
- **الهدف العام:** إدارة قسم shared وما يتعلق به من عمليات.
- **مخصص لـ:** الإدارة والموظفين المختصين.

### الأقسام الفرعية المكتشفة:
#### main
- **الحالة:** Service only
- **واجهات UI:** لا يوجد
- **مسارات API:** لا يوجد
- **خدمات / Engines:** base.service.ts, event-bus.service.ts, pdpl.service.ts

---

