# NamaSoft ERP — API Reference

> Auto-generated from 681 route files | Version 9.3.0

## Authentication
All endpoints require `Authorization: Bearer <JWT>` header.

## Rate Limits
| Tier | Limit | Used For |
|------|-------|---------|
| DEFAULT   | 100/min | General reads |
| FINANCIAL | 30/min  | Financial mutations |
| AI        | 10/min  | AI/LLM calls |
| AUTH      | 5/min   | Login attempts |
| UPLOAD    | 10/min  | File uploads |

## Endpoints by Module

### AI
- `POST /ai/bank-fraud`
- `POST /ai/bank-reconciliation`
- `POST /ai/cfo`
- `POST /ai/copilot`
- `GET, POST /ai/copilot/chat`
- `GET, POST /ai/demand-forecast`
- `GET /ai/fraud-monitoring`
- `POST /ai/nlq`
- `POST /ai/predictive-scm`
- `POST /ai/rag`
- `POST /ai/sales-coach`

### Accounting
- `GET, POST, PUT, DELETE /accounting/accounts`
- `POST /accounting/accounts/init`
- `POST /accounting/allocations`
- `POST /accounting/allocations/run`
- `POST /accounting/allocations/simulate`
- `GET /accounting/balance-sheet`
- `GET, POST /accounting/bank-feed`
- `POST /accounting/bank-recon/auto-match`
- `GET /accounting/bank-statements`
- `POST /accounting/bank-statements/upload`
- `POST /accounting/banks/imports`
- `POST /accounting/banks/recon/create-je`
- `POST /accounting/banks/recon/match`
- `GET, POST /accounting/books`
- `POST /accounting/budget/check`
- `GET /accounting/budget/variance`
- `GET /accounting/cashflow/forecast`
- `POST /accounting/closing`
- `GET, POST /accounting/coa/reset-to-socpa`
- `POST /accounting/consolidation/commit`
- `POST /accounting/consolidation/run`
- `GET, POST, PUT, DELETE /accounting/cost-centers`
- `GET /accounting/customer-statements/bulk/history`
- `POST /accounting/customer-statements/bulk/preview`
- `POST /accounting/customer-statements/bulk/run`
- `POST /accounting/customer-statements/generate-pdf`
- `POST /accounting/customer-statements/preview`
- `POST /accounting/customer-statements/send-email`
- `GET, POST /accounting/customer-statements/templates`
- `PUT, DELETE /accounting/customer-statements/templates/{id}`
- `GET /accounting/customers/{id}/statement`
- `GET, POST /accounting/deferred`
- `POST /accounting/dunning/daily-run`
- `POST /accounting/dunning/promise-to-pay`
- `POST /accounting/ecl/run`
- `GET, POST /accounting/financial-close`
- `GET, POST /accounting/fiscal-periods`
- `GET, POST /accounting/fiscal-years`
- `POST /accounting/fixed-assets/depreciate`
- `POST /accounting/fx-revaluation/run`
- `GET /accounting/governance-violations`
- `GET /accounting/income-statement`
- `GET, POST /accounting/intercompany`
- `GET, POST /accounting/journal`
- `PUT, PATCH /accounting/journal/{id}`
- `GET, POST /accounting/lc`
- `GET, POST /accounting/leases`
- `POST /accounting/leases/amortize`
- `GET /accounting/ledger`
- `POST /accounting/multi-book/adjustments`
- `GET, POST /accounting/open-items`
- `POST /accounting/open-items/apply-payment`
- `POST /accounting/open-items/auto-clear`
- `POST /accounting/open-items/disputes`
- `POST /accounting/open-items/promise-to-pay`
- `POST /accounting/payment-runs/propose`
- `POST /accounting/payment-runs/{id}/approve`
- `POST /accounting/payment-runs/{id}/generate-files`
- `POST /accounting/payment-runs/{id}/post-journal`
- `POST /accounting/payment-runs/{id}/submit-for-approval`
- `POST /accounting/payment-runs/{id}/upload-confirmation`
- `GET, POST /accounting/period-close`
- `GET, POST /accounting/profit-centers`
- `GET, POST /accounting/revenue-recognition`
- `POST /accounting/revenue-recognition/amortize`
- `POST /accounting/reversal`
- `GET, POST /accounting/segments`
- `GET /accounting/trial-balance`
- `GET, POST /accounting/year-end-close`
- `POST /accounting/year-end-close/close-period`
- `POST /accounting/year-end/initiate`
- `POST /accounting/year-end/reopen`
- `POST /accounting/year-end/{runId}/finalize`
- `POST /accounting/year-end/{runId}/reports`
- `GET /accounting/year-end/{runId}/tasks`
- `POST /accounting/year-end/{runId}/tasks/{taskCode}/complete`
- `POST /accounting/year-end/{runId}/tasks/{taskCode}/execute`

### Adjustments
- `GET, POST /adjustments`

### Auth
- `POST /auth/2fa/backup-codes`
- `POST /auth/2fa/login`
- `POST, DELETE /auth/2fa/setup`
- `POST /auth/2fa/verify`
- `GET /auth/auto-login`
- `POST /auth/find-tenant-by-email`
- `POST /auth/login`
- `POST /auth/login-by-email`
- `GET /auth/mfa/audit-log`
- `POST /auth/mfa/backup-verify`
- `POST /auth/mfa/confirm`
- `POST /auth/mfa/disable`
- `POST /auth/mfa/enroll`
- `GET /auth/mfa/qr-code`
- `POST /auth/mfa/regenerate-codes`
- `GET /auth/mfa/status`
- `POST /auth/mfa/trust-device`
- `DELETE /auth/mfa/trusted-devices/{id}`
- `POST /auth/mfa/verify`
- `GET, POST /auth/sso`
- `GET /auth/sso-redirect`
- `POST /auth/sync`

### Customers
- `GET, POST, DELETE /customers`
- `GET, PUT, DELETE /customers/{id}`
- `GET /customers/{id}/credit`
- `DELETE /customers/{id}/gdpr-delete`
- `POST /customers/{id}/hold`
- `POST /customers/{id}/statement`

### Expenses
- `GET, POST, PUT, DELETE /expenses`

### GRN
- `GET, POST /grn`

### HR
- `GET, POST /hr/attendance`
- `GET, POST /hr/documents/expiry`
- `POST /hr/documents/expiry/{id}`
- `GET, POST /hr/employees`
- `GET, POST /hr/eos`
- `POST /hr/eos/{id}`
- `GET /hr/evaluations`
- `GET, POST /hr/expense-reports`
- `GET, POST /hr/gosi`
- `POST /hr/gosi/calculate`
- `GET /hr/gosi/file`
- `POST /hr/gosi/file/submit`
- `GET, POST /hr/jobs`
- `GET, POST /hr/leaves`
- `POST /hr/leaves/accrual`
- `GET /hr/leaves/balance`
- `POST /hr/leaves/{id}`
- `GET, POST /hr/loans`
- `POST /hr/mudad/wps/submit/{batchId}`
- `GET /hr/org-chart`
- `GET, POST /hr/payroll/calculate`
- `GET, POST /hr/payroll/config`
- `POST /hr/payroll/generate`
- `GET, POST /hr/payroll/run`
- `GET, POST /hr/performance`
- `GET, POST /hr/recruitment`
- `GET, POST /hr/timesheet`
- `GET, POST /hr/training`
- `GET, POST /hr/wps`

### Inventory
- `GET, POST /inventory/abc-analysis`
- `POST /inventory/ai-vision`
- `GET /inventory/batches/expiring`
- `POST /inventory/batches/{id}/quarantine`
- `POST /inventory/batches/{id}/recall`
- `POST /inventory/batches/{id}/release`
- `GET /inventory/costing`
- `GET /inventory/picking/{id}`
- `POST /inventory/picking/{id}/confirm`
- `GET, POST /inventory/products/{id}/variants`
- `GET /inventory/putaway/suggest`
- `GET, POST /inventory/quality-control`
- `GET, POST /inventory/reorder-rules`
- `POST /inventory/stocktake/{id}/approve`

### Manufacturing
- `GET, POST, PUT /manufacturing`
- `GET /manufacturing/aps`
- `GET /manufacturing/blockchain-trace`
- `GET, POST /manufacturing/bom`
- `POST /manufacturing/boms/versions/{versionId}/activate`
- `GET, POST /manufacturing/boms/{id}/versions`
- `GET, POST, PUT /manufacturing/capa`
- `GET, PUT /manufacturing/capacity`
- `GET /manufacturing/digital-twin`
- `GET, POST /manufacturing/kanban`
- `GET /manufacturing/labor-efficiency`
- `POST /manufacturing/mps/generate`
- `GET, POST /manufacturing/mrp`
- `GET /manufacturing/mrp-run`
- `GET /manufacturing/oee`
- `GET, POST, PUT /manufacturing/orders`
- `PUT, DELETE /manufacturing/orders/{id}`
- `POST /manufacturing/orders/{id}/schedule`
- `GET, POST /manufacturing/qc`
- `GET, POST /manufacturing/quality`
- `GET, POST /manufacturing/quality-control`
- `GET /manufacturing/quality-management`
- `GET, POST /manufacturing/recipes`
- `PUT, DELETE /manufacturing/recipes/{id}`
- `GET, POST /manufacturing/routing`
- `GET /manufacturing/scheduler`
- `GET, POST /manufacturing/scrap`
- `GET, POST /manufacturing/shopfloor`
- `GET /manufacturing/variance`
- `GET /manufacturing/wip-valuation`
- `GET, POST /manufacturing/work-centers`
- `GET, POST, PUT /manufacturing/work-orders`

### Payroll
- `GET, POST /payroll`
- `POST /payroll/calculate`
- `GET, POST /payroll/provisions/run`
- `POST /payroll/runs/{id}/post`
- `POST /payroll/wps/generate`
- `GET /payroll/wps/history`
- `GET /payroll/wps/{batchId}/download`
- `POST /payroll/wps/{batchId}/mark-uploaded`
- `GET /payroll/{id}`

### Products
- `GET, POST, DELETE /products`
- `GET /products/export`
- `POST /products/import`
- `GET, PUT, DELETE /products/{id}`

### Purchase Returns
- `GET, POST /purchase-returns`

### Purchases
- `GET, POST, PUT, DELETE /purchases`
- `POST /purchases/drop-ship`
- `GET, POST /purchases/grn`
- `GET, POST /purchases/letters-of-credit`
- `POST /purchases/letters-of-credit/landed-costs`
- `PUT, DELETE /purchases/letters-of-credit/{id}`
- `GET, POST /purchases/matching`
- `POST /purchases/matching/{id}/resolve`
- `POST /purchases/ocr`
- `GET /purchases/po/{id}`
- `GET, POST /purchases/po/{id}/landed-costs`
- `POST /purchases/po/{id}/landed-costs/{costId}/allocate`
- `GET, POST /purchases/requisitions`
- `GET, POST /purchases/rfq`
- `GET, PUT /purchases/three-way-match`
- `PUT /purchases/{id}/receive`

### Reports
- `GET /reports/aging`
- `GET /reports/bi-export`
- `GET /reports/cash-flow`
- `GET /reports/customer-statement`
- `GET /reports/dimensional-gl`
- `GET /reports/export`
- `GET, POST /reports/financial-statements/generate`
- `GET /reports/returns`
- `GET /reports/what-if`
- `GET /reports/zatca-vat`
- `GET /reports/{type}`

### Sales Returns
- `GET, POST /sales-returns`

### Sales
- `GET, POST, DELETE /sales`
- `POST /sales/atp/check`
- `GET /sales/commissions`
- `POST /sales/commissions/calculate`
- `GET /sales/commissions/rules`
- `POST /sales/commissions/run`
- `GET, POST /sales/delivery-notes`
- `GET /sales/forecast`
- `POST /sales/invoices`
- `GET, POST /sales/pricing`
- `POST /sales/pricing/calculate`
- `POST /sales/quotes/{id}/accept`
- `POST /sales/quotes/{id}/convert-to-so`
- `POST /sales/quotes/{id}/revise`
- `GET, POST /sales/returns`
- `POST /sales/returns/{id}/{action}`
- `POST /sales/rma`
- `PUT /sales/rma/{id}/approve`
- `GET, POST /sales/routes`
- `POST /sales/statements/bulk`
- `GET, POST /sales/targets`

### Settings
- `GET, POST, DELETE /settings`
- `GET, POST /settings/approvals`
- `PUT, DELETE /settings/approvals/{id}`
- `GET /settings/bpm`
- `GET, POST /settings/currencies`
- `PUT, DELETE /settings/currencies/{id}`
- `GET, POST /settings/email-templates`
- `GET, POST /settings/exchange-rates`
- `DELETE /settings/exchange-rates/{id}`
- `POST /settings/generate-barcode`
- `POST /settings/generate-keys`
- `GET, POST, PUT /settings/number-sequences`
- `GET /settings/numbering`
- `GET, POST /settings/permissions/fields`
- `GET, POST /settings/roles`
- `GET, POST /settings/scheduled-actions`
- `GET, POST /settings/state-machine`
- `POST /settings/upload-logo`
- `GET /settings/whatsapp`
- `POST /settings/zatca-onboard`
- `GET, PUT /settings/{key}`

### Stock Transfers
- `GET, POST /stock-transfers`

### Treasury
- `GET, POST /treasury`
- `GET /treasury/balance`
- `GET, POST /treasury/bank-import`
- `GET, PUT /treasury/bank-recon`
- `GET /treasury/cash-position`
- `POST /treasury/cash-position/snapshot`
- `GET /treasury/liquidity/forecast`
- `POST /treasury/liquidity/forecast/generate`
- `GET, POST /treasury/recon-exceptions`

### Users
- `GET, POST, PUT, PATCH, DELETE /users`

### ZATCA
- `POST /zatca`
- `POST /zatca/generate-request`
- `POST /zatca/onboard`
- `POST /zatca/qr`
- `GET /zatca/test`
- `GET /zatca/xml`

### admin
- `GET, POST /admin/backups`
- `POST /admin/bi/query`
- `GET /admin/compliance`
- `POST /admin/e2e-test`
- `GET, POST /admin/knowledge`
- `GET /admin/llm-costs`
- `GET, POST /admin/nodes`
- `POST /admin/nodes/backup`
- `POST /admin/nodes/billing`
- `POST /admin/nodes/sync`
- `GET /admin/orchestration`
- `GET, POST /admin/prompts`

### ai-auditor
- `GET /ai-auditor`

### ai-cfo
- `POST /ai-cfo`
- `GET /ai-cfo/report`

### ap
- `GET, POST /ap/capture`
- `GET, POST /ap/match`

### approvals
- `GET /approvals`
- `GET /approvals/inbox`
- `POST /approvals/{id}`
- `POST /approvals/{id}/approve`
- `POST /approvals/{id}/reject`

### ar
- `GET, POST /ar/credit`
- `GET, POST /ar/dunning`

### assets
- `GET, POST /assets`
- `POST /assets/depreciate`
- `POST /assets/leases/post-monthly`
- `POST /assets/leases/{id}/post-inception`

### attendance
- `GET, POST, PUT /attendance`
- `POST /attendance/face-id`

### audit
- `GET /audit/field-trail`

### audit-logs
- `GET /audit-logs`

### b2b
- `POST /b2b/checkout`
- `POST /b2b/login`
- `GET /b2b/shop`

### banks
- `GET, POST /banks`
- `POST /banks/import`
- `POST /banks/reconciliation`
- `PUT, DELETE /banks/{id}`
- `GET, POST /banks/{id}/transactions`

### batches
- `GET, POST /batches`
- `GET /batches/expiry`
- `PUT, DELETE /batches/{id}`

### bi
- `GET /bi/cube`
- `GET /bi/kpis`

### bnpl
- `POST /bnpl/create-session`
- `GET /bnpl/status`
- `POST /bnpl/tabby`
- `POST /bnpl/tamara`

### bookings
- `GET, POST, PUT /bookings`
- `POST /bookings/invoice`

### branches
- `GET, POST, PUT, DELETE /branches`

### budgeting
- `POST /budgeting/encumbrance`
- `GET /budgeting/variance`

### budgets
- `GET, POST /budgets`
- `GET, POST, PUT, DELETE /budgets/scenarios`

### categories
- `GET, POST, DELETE /categories`
- `PUT, DELETE /categories/{id}`

### check-env
- `GET, POST /check-env`

### clinic
- `GET, POST /clinic/appointments`
- `GET, POST /clinic/erx`
- `GET, POST, PUT /clinic/lab`

### cmms
- `GET, POST /cmms/schedules`
- `GET, POST, PUT /cmms/work-orders`

### com
- `GET /com/rules`

### compliance
- `GET, POST /compliance/audits`
- `GET, POST, PUT /compliance/risks`
- `GET, POST /compliance/rules`

### contracts
- `GET, POST /contracts`
- `GET, POST /contracts/alerts`
- `GET, POST, PUT /contracts/renewals`
- `GET, POST, PUT, DELETE /contracts/templates`

### copa
- `GET, POST /copa`
- `GET, POST /copa/allocations`
- `GET, POST /copa/characteristics`
- `GET /copa/value-fields`

### coupons
- `GET, POST /coupons`
- `POST /coupons/validate`
- `PUT, DELETE /coupons/{id}`

### cpq
- `POST /cpq`

### credit-check
- `GET, POST /credit-check`

### crm
- `GET, POST /crm/activities`
- `GET, POST, PUT, DELETE /crm/campaigns`
- `GET /crm/customer360`
- `GET /crm/forecast`
- `GET, POST /crm/leads`
- `POST /crm/leads/{id}/convert`
- `GET, POST /crm/opportunities`
- `POST /crm/opportunities/{id}/win`
- `GET, POST, PUT /crm/sla`
- `GET, POST, PUT /crm/tickets`
- `POST /crm/whatsapp`
- `POST /crm/whatsapp/broadcast`
- `GET /crm/whatsapp/sessions`
- `GET, POST /crm/whatsapp/webhook`

### cron
- `GET /cron/backup`
- `GET /cron/contract-expiry`
- `GET /cron/contracts`
- `GET /cron/cycle-count`
- `POST /cron/debts`
- `GET /cron/ecl`
- `POST /cron/hr`
- `POST /cron/predictive-po`
- `POST /cron/rem-leases`
- `GET /cron/reorder-alerts`
- `GET /cron/scheduled-reports`
- `POST /cron/self-healer`
- `POST /cron/shifts`
- `GET /cron/trigger-invoices`
- `GET /cron/vendor-scoring`
- `GET /cron/zatca-worker`

### delivery-platforms
- `GET, POST /delivery-platforms`

### dms
- `GET, POST /dms`

### docs
- `GET /docs/openapi.json`

### documents
- `GET, POST /documents`
- `POST /documents/transition`
- `DELETE /documents/{id}`

### ecommerce
- `GET, PUT /ecommerce/orders`
- `GET, POST, PUT /ecommerce/stores`
- `POST /ecommerce/sync`

### email
- `GET, POST /email`

### employees
- `GET, POST, PUT /employees`
- `PUT, DELETE /employees/{id}`

### enterprise
- `GET, POST /enterprise/fleet`
- `GET, POST, PUT /enterprise/legal`
- `GET, POST, PUT /enterprise/mrp`
- `GET, POST, PUT, DELETE /enterprise/projects`
- `GET, POST, PUT /enterprise/projects/budget`
- `GET, POST, PUT, DELETE /enterprise/projects/tasks`
- `GET, POST /enterprise/property`
- `GET, POST /enterprise/quality`
- `GET, POST /enterprise/wms`

### esign
- `GET, POST /esign`

### events
- `GET, POST /events`
- `GET, POST /events/registrations`

### explain
- `POST /explain`

### field-service
- `GET, POST, PATCH /field-service`
- `GET, POST, PUT /field-service/orders`

### finance
- `GET, POST /finance/allocation`
- `GET, POST /finance/assets`
- `POST /finance/auto-ecl`
- `GET /finance/balance-sheet`
- `GET, POST, PUT, DELETE /finance/bank-recon/rules`
- `POST /finance/bank-recon/rules/simulate`
- `GET, POST /finance/budget`
- `GET, POST /finance/budget-control`
- `GET /finance/budget/variance`
- `GET, POST /finance/cash-flow`
- `GET, POST /finance/cash-flow/forecast`
- `GET /finance/cfo`
- `GET /finance/cfo-dashboard`
- `GET, POST /finance/checks`
- `PUT /finance/checks/{id}/process`
- `GET, POST /finance/consolidation`
- `GET, POST /finance/consolidation/elimination`
- `GET /finance/dunning/history`
- `POST /finance/dunning/run`
- `GET, POST /finance/ecl`
- `GET, POST /finance/fx-revaluation`
- `GET /finance/match/queue`
- `POST /finance/match/{id}/resolve`
- `GET /finance/payment-run`
- `POST /finance/payment-run/propose`
- `GET /finance/payment-run/{id}`
- `POST /finance/payment-run/{id}/approve`
- `POST /finance/payment-run/{id}/confirm`
- `POST /finance/payment-run/{id}/send-bank`
- `GET, POST /finance/payment-runs`
- `POST /finance/payment-runs/propose`
- `POST /finance/payment-runs/{id}/approve`
- `POST /finance/payment-runs/{id}/execute`
- `POST /finance/payment-runs/{id}/submit-for-approval`
- `GET, POST /finance/period-close`
- `PATCH /finance/period-close/{id}/step`
- `GET, POST /finance/petty-cash`
- `PUT /finance/petty-cash/{id}/process`
- `GET, POST /finance/reconciliations`
- `PUT /finance/reconciliations/{id}`
- `GET, POST /finance/variance`
- `GET, POST /finance/wht`

### fiscal-periods
- `GET, POST /fiscal-periods`

### fixed-assets
- `GET, POST /fixed-assets`
- `GET, PUT, DELETE /fixed-assets/{id}`
- `POST /fixed-assets/{id}/depreciate`

### fleet
- `GET, POST /fleet/advanced`
- `GET, POST /fleet/fuel`
- `GET /fleet/maintenance`
- `GET, POST /fleet/trips`

### fng
- `GET, POST, PUT, DELETE /fng/budgets`
- `GET, POST, PUT, DELETE /fng/petty-cash-funds`

### fsm
- `POST /fsm/complete`
- `GET, POST /fsm/tickets`

### fx
- `GET, POST /fx`

### gift-cards
- `GET, POST /gift-cards`
- `PUT, DELETE /gift-cards/{id}`

### health
- `GET /health`

### ice
- `GET, POST, DELETE /ice/auth`
- `GET /ice/backup/download`
- `GET /ice/backup/list`
- `POST /ice/backup/upload`
- `GET, POST /ice/desktop-licenses`
- `POST /ice/desktop-register`
- `GET /ice/license/verify`
- `GET, PUT /ice/tenant-features`
- `GET /ice/tenants`
- `POST, PATCH, DELETE /ice/toggle`

### installments
- `GET, POST /installments`

### inv
- `GET /inv/serials`

### knowledge
- `GET, POST, PUT /knowledge/articles`
- `GET, POST /knowledge/categories`

### lms
- `GET, POST /lms/courses`

### logistics
- `GET, POST /logistics/carriers`
- `GET, POST /logistics/freight`

### loyalty
- `GET /loyalty`
- `GET /loyalty/{customerId}/transactions`

### maintenance
- `GET, POST, PUT /maintenance`
- `GET, POST /maintenance/preventive`

### manifest
- `GET /manifest`

### master
- `POST /master`

### master-panel
- `POST /master-panel/deploy`

### master-panel-data
- `GET /master-panel-data`

### metrics
- `GET /metrics`

### openapi
- `GET /openapi`

### payments
- `POST /payments/charge`

### pdpl
- `GET, POST /pdpl/breach`
- `GET, POST /pdpl/dsr`
- `POST /pdpl/dsr/{id}/fulfill`

### pharmacy
- `GET, POST /pharmacy/drug-interactions`
- `GET, POST /pharmacy/drugs`
- `GET, POST, PUT /pharmacy/insurance`
- `POST /pharmacy/insurance/journal`
- `GET, POST /pharmacy/patients`
- `GET, POST, PUT /pharmacy/prescriptions`

### planning
- `GET, POST, DELETE /planning/slots`

### portal
- `GET /portal/customer`
- `GET, POST /portal/messages`
- `GET, POST /portal/users`
- `POST /portal/vendor/rfq/{id}/bid`

### portals
- `POST /portals/parent`
- `POST /portals/tenant`

### pos
- `POST /pos`
- `POST /pos/bnpl`
- `GET /pos/bnpl/status`
- `POST /pos/checkout`
- `GET, POST /pos/pending-orders`
- `GET /pos/products`
- `GET, POST /pos/restaurant/floor`
- `POST /pos/sessions/close`
- `POST /pos/sessions/movement`
- `POST /pos/sessions/open`
- `GET, POST /pos/sync`

### price-quotes
- `GET, POST /price-quotes`

### procurement
- `POST /procurement/auto-draft`
- `GET, POST /procurement/contracts`
- `GET /procurement/rfq/{id}`
- `POST /procurement/rfq/{id}/award`
- `GET /procurement/rfq/{id}/comparison`
- `POST /procurement/rfq/{id}/invite`
- `GET /procurement/spend-analytics`
- `GET, POST /procurement/supplier-contracts`
- `GET, POST /procurement/vendors/scorecard`

### product-stocks
- `POST /product-stocks/location`

### projects
- `GET /projects/advanced`
- `GET /projects/evm`
- `GET, POST, PUT, DELETE /projects/milestones`
- `GET, POST, PUT, DELETE /projects/phases`
- `GET, POST, DELETE /projects/resources`
- `GET, POST, PUT, DELETE /projects/risks`
- `GET, POST, DELETE /projects/time-entries`

### promotions
- `GET, POST, PUT /promotions`

### public
- `POST /public/call-waiter`
- `GET /public/menu`
- `POST /public/order`
- `GET /public/table`

### purchase-orders
- `GET, POST /purchase-orders`
- `GET, PUT /purchase-orders/{id}`
- `GET, POST /purchase-orders/{id}/landed-costs`

### purchasing
- `GET, POST /purchasing/three-way-match`

### rebates
- `POST /rebates`

### recurring-invoices
- `GET, POST /recurring-invoices`

### rem
- `GET /rem/installments`
- `GET, POST /rem/leases`

### rent
- `POST /rent`

### rental
- `GET, POST, PUT /rental/agreements`
- `GET, POST /rental/returns`

### salaries
- `GET, POST /salaries`

### sales-orders
- `GET, POST /sales-orders`
- `PUT /sales-orders/{id}/process`

### saudi
- `GET /saudi/mudad/compliance`
- `POST /saudi/nitaqat/projection`
- `GET, POST /saudi/qiwa/contracts/{employeeId}`
- `POST /saudi/qiwa/sync`
- `GET, POST /saudi/saudization/snapshot`

### school
- `POST /school`

### search
- `GET /search/semantic`

### service
- `GET /service/sla`

### shifts
- `GET, POST, PUT, DELETE /shifts`

### shipments
- `GET, POST /shipments`
- `GET, POST /shipments/delivery-notes`

### shipping
- `GET, POST /shipping`

### shl
- `GET /shl/classes`
- `GET /shl/students`

### smart-transfers
- `GET, POST, PUT /smart-transfers`

### stock
- `GET, POST /stock/adjustments`
- `GET /stock/movements`

### stock-movements
- `GET, POST /stock-movements`

### stocktake
- `GET, POST /stocktake`
- `POST /stocktake/vision`

### subscription-status
- `GET /subscription-status`

### subscriptions
- `POST /subscriptions`
- `POST /subscriptions/cancel`
- `GET, POST, PUT /subscriptions/plans`
- `POST /subscriptions/process-renewals`
- `POST /subscriptions/subscribe`

### sys
- `GET /sys/alerts`
- `POST /sys/desktop-crash`
- `GET /sys/health`

### system
- `GET, POST /system/comments`
- `GET, POST /system/dashboard-builder`
- `GET, POST /system/dms`
- `GET, POST /system/import-export`
- `GET, POST /system/kanban`
- `GET, POST /system/notifications`
- `GET, POST, PATCH, DELETE /system/numbering`
- `POST /system/pivot`
- `GET, POST /system/print-templates`
- `GET, POST, PUT, DELETE /system/reset`
- `GET /system/search`
- `GET, POST /system/workflow`

### telegram
- `POST /telegram/process`
- `GET, POST /telegram/webhook`

### tenant
- `GET, POST /tenant/check-status`
- `POST /tenant/create`
- `GET /tenant/hidden-modules`
- `POST /tenant/provision`
- `GET, POST /tenant/seed-company`
- `GET /tenant/status`
- `GET /tenant/trial-status`

### test
- `GET, POST /test`

### test-translation
- `GET /test-translation`

### transliterate
- `POST /transliterate`

### units
- `GET, POST, DELETE /units`

### upload
- `POST /upload`

### v2
- `POST /v2/sales/invoices`

### v3
- `GET, POST /v3/clinic/appointments`
- `GET, POST /v3/clinic/emr`
- `GET /v3/clinic/erx`
- `GET /v3/clinic/lab`
- `GET, POST /v3/construction/boq`
- `GET /v3/construction/progress-billing`
- `GET /v3/construction/variations`
- `GET /v3/distribution/picking/wave`
- `GET /v3/distribution/routes`
- `GET, POST /v3/distribution/wms`
- `GET, POST /v3/manufacturing/mrp`
- `GET /v3/manufacturing/shopfloor`
- `GET, POST /v3/realestate/leases`
- `GET, POST /v3/restaurant/kds`
- `GET, POST /v3/retail/pos`
- `GET, POST /v3/school/sis`
- `GET, POST /v3/services/timesheet`

### vacations
- `GET, POST, PUT /vacations`

### vat
- `GET, POST /vat/categories`

### vendor-portal
- `GET, POST /vendor-portal`

### vendor-ratings
- `GET, POST /vendor-ratings`

### vendors
- `GET /vendors/scorecard`
- `POST /vendors/{id}/statement`

### version
- `GET /version`

### warehouses
- `GET, POST /warehouses`
- `GET /warehouses/analytics`
- `GET, POST /warehouses/wms`
- `GET, PUT, DELETE /warehouses/{id}`

### warranty
- `GET /warranty/check`

### webhooks
- `GET, POST /webhooks`
- `POST /webhooks/salla`
- `POST /webhooks/zid`

### whatsapp
- `POST /whatsapp/interactive`

### wht
- `POST /wht/calculate`
- `POST /wht/form14/generate`

### wms
- `POST /wms/waves`

### work-shifts
- `GET, POST /work-shifts`

### zakat
- `GET, POST /zakat/assessments`
- `GET /zakat/assessments/{id}`
- `POST /zakat/assessments/{id}/adjustments`
- `POST /zakat/assessments/{id}/file`
- `POST /zakat/assessments/{id}/finalize`

---
*Generated: 2026-05-09T22:27:49.049Z*