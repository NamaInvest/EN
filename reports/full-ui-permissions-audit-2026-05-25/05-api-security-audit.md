# API Security / Tenant Boundary Audit

## APIs Missing withRoute
| route | methods | withRoute | withGuard | getUser | defaultTenant | newPrisma | rawUnsafe | file |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /api/accounts |  | false | false | false | false | false | false | src/app/api\accounts\route.ts |
| /api/admin/audit-logs |  | false | false | true | false | false | false | src/app/api\admin\audit-logs\route.ts |
| /api/admin/system-audit | GET | false | true | false | false | false | false | src/app/api\admin\system-audit\route.ts |
| /api/ai/copilot |  | false | false | false | false | false | false | src/app/api\ai\copilot\route.ts |
| /api/auth/sso |  | false | false | false | true | false | false | src/app/api\auth\sso\route.ts |
| /api/chains/:chain |  | false | false | false | false | false | false | src/app/api\chains\[chain]\route.ts |
| /api/crm/accounts |  | false | false | false | true | false | false | src/app/api\crm\accounts\route.ts |
| /api/crm/customer-health |  | false | false | false | false | false | false | src/app/api\crm\customer-health\route.ts |
| /api/crm/forecast |  | false | false | false | false | false | false | src/app/api\crm\forecast\route.ts |
| /api/crm/help-desk |  | false | false | false | false | false | false | src/app/api\crm\help-desk\route.ts |
| /api/crm/kb |  | false | false | false | false | false | false | src/app/api\crm\kb\route.ts |
| /api/crm/marketing |  | false | false | false | false | false | false | src/app/api\crm\marketing\route.ts |
| /api/crm/omnichannel |  | false | false | false | false | false | false | src/app/api\crm\omnichannel\route.ts |
| /api/crm/portal |  | false | false | false | false | false | false | src/app/api\crm\portal\route.ts |
| /api/crm/surveys |  | false | false | false | false | false | false | src/app/api\crm\surveys\route.ts |
| /api/crm/territory |  | false | false | false | false | false | false | src/app/api\crm\territory\route.ts |
| /api/cron/approval-sla |  | false | false | false | false | false | false | src/app/api\cron\approval-sla\route.ts |
| /api/cron/ar-collection-dunning |  | false | false | false | false | false | false | src/app/api\cron\ar-collection-dunning\route.ts |
| /api/cron/daily-audit |  | false | false | false | false | false | false | src/app/api\cron\daily-audit\route.ts |
| /api/cron/depreciation-monthly |  | false | false | false | false | false | false | src/app/api\cron\depreciation-monthly\route.ts |
| /api/cron/fx-revaluation |  | false | false | false | false | false | false | src/app/api\cron\fx-revaluation\route.ts |
| /api/cron/ifrs16-monthly |  | false | false | false | false | false | false | src/app/api\cron\ifrs16-monthly\route.ts |
| /api/cron/payment-reminders |  | false | false | false | false | false | false | src/app/api\cron\payment-reminders\route.ts |
| /api/cron/payroll-monthly |  | false | false | false | false | false | false | src/app/api\cron\payroll-monthly\route.ts |
| /api/cron/prepayments-amortization |  | false | false | false | false | false | false | src/app/api\cron\prepayments-amortization\route.ts |
| /api/cron/rag-reindex |  | false | false | false | false | true | false | src/app/api\cron\rag-reindex\route.ts |
| /api/cron/recurring-billing |  | false | false | false | false | false | false | src/app/api\cron\recurring-billing\route.ts |
| /api/cron/vat-return-reminder |  | false | false | false | false | false | false | src/app/api\cron\vat-return-reminder\route.ts |
| /api/cron/zatca-batch-submit |  | false | false | false | false | false | false | src/app/api\cron\zatca-batch-submit\route.ts |
| /api/customer/table/:qrToken |  | false | false | false | false | false | false | src/app/api\customer\table\[qrToken]\route.ts |
| /api/desktop/verify-license |  | false | false | false | false | false | false | src/app/api\desktop\verify-license\route.ts |
| /api/docs |  | false | false | false | false | false | false | src/app/api\docs\route.ts |
| /api/gaps/abc-costing |  | false | false | false | false | false | false | src/app/api\gaps\abc-costing\route.ts |
| /api/gaps/anomaly |  | false | false | false | false | false | false | src/app/api\gaps\anomaly\route.ts |
| /api/gaps/esg |  | false | false | false | false | false | false | src/app/api\gaps\esg\route.ts |
| /api/gaps/evm |  | false | false | false | false | false | false | src/app/api\gaps\evm\route.ts |
| /api/gaps/forecast-v2 |  | false | false | false | false | false | false | src/app/api\gaps\forecast-v2\route.ts |
| /api/health |  | false | false | false | false | false | false | src/app/api\health\route.ts |
| /api/help |  | false | false | false | false | false | false | src/app/api\help\route.ts |
| /api/ice/admin/2fa/disable |  | false | false | false | false | false | false | src/app/api\ice\admin\2fa\disable\route.ts |
| /api/ice/admin/2fa/enable |  | false | false | false | false | false | false | src/app/api\ice\admin\2fa\enable\route.ts |
| /api/ice/admin/2fa/generate |  | false | false | false | false | false | false | src/app/api\ice\admin\2fa\generate\route.ts |
| /api/ice/auth/2fa/verify |  | false | false | false | false | false | false | src/app/api\ice\auth\2fa\verify\route.ts |
| /api/ice/auth/login |  | false | false | false | false | false | false | src/app/api\ice\auth\login\route.ts |
| /api/ice/subscriptions |  | false | false | false | false | false | false | src/app/api\ice\subscriptions\route.ts |
| /api/integrations/mudad |  | false | false | true | false | false | false | src/app/api\integrations\mudad\route.ts |
| /api/learn/courses |  | false | false | false | false | true | false | src/app/api\learn\courses\route.ts |
| /api/license/verify |  | false | false | false | false | false | false | src/app/api\license\verify\route.ts |
| /api/master-panel/auth |  | false | false | false | false | false | false | src/app/api\master-panel\auth\route.ts |
| /api/migration/start |  | false | false | false | false | true | false | src/app/api\migration\start\route.ts |
| /api/notifications/stream |  | false | false | false | false | false | false | src/app/api\notifications\stream\route.ts |
| /api/openapi |  | false | false | false | false | false | false | src/app/api\openapi\route.ts |
| /api/packaging-units |  | false | false | false | false | false | false | src/app/api\packaging-units\route.ts |
| /api/platform/dms |  | false | false | false | true | false | false | src/app/api\platform\dms\route.ts |
| /api/platform/encryption |  | false | false | false | false | false | false | src/app/api\platform\encryption\route.ts |
| /api/platform/esignature |  | false | false | false | false | false | false | src/app/api\platform\esignature\route.ts |
| /api/platform/forms |  | false | false | false | false | false | false | src/app/api\platform\forms\route.ts |
| /api/platform/ipaas |  | false | false | false | false | false | false | src/app/api\platform\ipaas\route.ts |
| /api/platform/localization |  | false | false | false | false | false | false | src/app/api\platform\localization\route.ts |
| /api/platform/reports |  | false | false | false | false | false | false | src/app/api\platform\reports\route.ts |
| /api/platform/sso |  | false | false | false | false | false | false | src/app/api\platform\sso\route.ts |
| /api/platform/webhooks |  | false | false | false | false | false | false | src/app/api\platform\webhooks\route.ts |
| /api/quality/calibration |  | false | false | false | false | false | false | src/app/api\quality\calibration\route.ts |
| /api/restaurant/pos/resolve |  | false | false | true | true | false | false | src/app/api\restaurant\pos\resolve\route.ts |
| /api/restaurant/pos/status |  | false | false | true | true | false | false | src/app/api\restaurant\pos\status\route.ts |
| /api/restaurant/table/call |  | false | false | false | false | false | false | src/app/api\restaurant\table\call\route.ts |
| /api/restaurant/table/info |  | false | false | false | false | false | false | src/app/api\restaurant\table\info\route.ts |
| /api/supply-chain/rfx-auction |  | false | false | false | true | false | false | src/app/api\supply-chain\rfx-auction\route.ts |
| /api/supply-chain/vendor-onboarding |  | false | false | false | true | false | false | src/app/api\supply-chain\vendor-onboarding\route.ts |
| /api/test-runs |  | false | false | false | false | true | false | src/app/api\test-runs\route.ts |
| /api/translate |  | false | false | false | false | false | false | src/app/api\translate\route.ts |
| /api/zatca/late-submissions |  | false | false | false | false | false | false | src/app/api\zatca\late-submissions\route.ts |


## APIs With Default Tenant Fallback
| route | methods | withRoute | defaultTenant | file |
| --- | --- | --- | --- | --- |
| /api/accounting/accruals | GET,POST | true | true | src/app/api\accounting\accruals\route.ts |
| /api/accounting/aging | GET | true | true | src/app/api\accounting\aging\route.ts |
| /api/accounting/allocations | POST | true | true | src/app/api\accounting\allocations\route.ts |
| /api/accounting/audit-export | GET | true | true | src/app/api\accounting\audit-export\route.ts |
| /api/accounting/bank-recon | GET | true | true | src/app/api\accounting\bank-recon\route.ts |
| /api/accounting/chart-of-accounts-import | GET,POST | true | true | src/app/api\accounting\chart-of-accounts-import\route.ts |
| /api/accounting/coa/reset-to-socpa | GET,POST | true | true | src/app/api\accounting\coa\reset-to-socpa\route.ts |
| /api/accounting/collection-workflow | GET,POST | true | true | src/app/api\accounting\collection-workflow\route.ts |
| /api/accounting/cost-center-report | GET | true | true | src/app/api\accounting\cost-center-report\route.ts |
| /api/accounting/deferred-tax | GET,POST | true | true | src/app/api\accounting\deferred-tax\route.ts |
| /api/accounting/depreciation | GET,POST | true | true | src/app/api\accounting\depreciation\route.ts |
| /api/accounting/financial-statements | GET | true | true | src/app/api\accounting\financial-statements\route.ts |
| /api/accounting/gr-ir-clearing | GET,POST | true | true | src/app/api\accounting\gr-ir-clearing\route.ts |
| /api/accounting/inventory-valuation-snapshot | GET | true | true | src/app/api\accounting\inventory-valuation-snapshot\route.ts |
| /api/accounting/journal | GET,POST | true | true | src/app/api\accounting\journal\route.ts |
| /api/accounting/opening-balances | GET,POST | true | true | src/app/api\accounting\opening-balances\route.ts |
| /api/accounting/payroll-gl | GET,POST | true | true | src/app/api\accounting\payroll-gl\route.ts |
| /api/accounting/period-lock | GET,POST | true | true | src/app/api\accounting\period-lock\route.ts |
| /api/accounting/prepayments | GET,POST | true | true | src/app/api\accounting\prepayments\route.ts |
| /api/accounting/profit-loss | GET | true | true | src/app/api\accounting\profit-loss\route.ts |
| /api/accounting/statement | GET | true | true | src/app/api\accounting\statement\route.ts |
| /api/accounting/trial-balance | GET | true | true | src/app/api\accounting\trial-balance\route.ts |
| /api/accounting/vat-return | GET,POST | true | true | src/app/api\accounting\vat-return\route.ts |
| /api/accounting/year-end/:runId/reports | GET | true | true | src/app/api\accounting\year-end\[runId]\reports\route.ts |
| /api/ai/ingest | POST | true | true | src/app/api\ai\ingest\route.ts |
| /api/ap/match | GET,POST | true | true | src/app/api\ap\match\route.ts |
| /api/ar/credit | GET,POST | true | true | src/app/api\ar\credit\route.ts |
| /api/assets/leases/:id/post-inception | POST | true | true | src/app/api\assets\leases\[id]\post-inception\route.ts |
| /api/assets/leases/post-monthly | POST | true | true | src/app/api\assets\leases\post-monthly\route.ts |
| /api/auth/sso |  | false | true | src/app/api\auth\sso\route.ts |
| /api/bi/budget-variance | GET | true | true | src/app/api\bi\budget-variance\route.ts |
| /api/bi/kpis | GET | true | true | src/app/api\bi\kpis\route.ts |
| /api/cmms/schedules | GET,POST | true | true | src/app/api\cmms\schedules\route.ts |
| /api/cmms/work-orders | GET,POST,PUT | true | true | src/app/api\cmms\work-orders\route.ts |
| /api/compliance/audits | GET,POST | true | true | src/app/api\compliance\audits\route.ts |
| /api/compliance/risks | GET,POST,PUT | true | true | src/app/api\compliance\risks\route.ts |
| /api/compliance/rules | GET,POST | true | true | src/app/api\compliance\rules\route.ts |
| /api/crm/accounts |  | false | true | src/app/api\crm\accounts\route.ts |
| /api/dms | GET,POST | true | true | src/app/api\dms\route.ts |
| /api/ecommerce/stores | GET,POST,PUT | true | true | src/app/api\ecommerce\stores\route.ts |
| /api/esign | GET,POST | true | true | src/app/api\esign\route.ts |
| /api/events | GET,POST | true | true | src/app/api\events\route.ts |
| /api/expenses | GET,POST,PUT,DELETE | true | true | src/app/api\expenses\route.ts |
| /api/field-service/orders | GET,POST,PUT | true | true | src/app/api\field-service\orders\route.ts |
| /api/finance/ap-aging | GET,POST | true | true | src/app/api\finance\ap-aging\route.ts |
| /api/finance/budget-upload | GET,POST | true | true | src/app/api\finance\budget-upload\route.ts |
| /api/finance/cash-flow-indirect | GET | true | true | src/app/api\finance\cash-flow-indirect\route.ts |
| /api/finance/commitments | GET | true | true | src/app/api\finance\commitments\route.ts |
| /api/finance/controls | GET,POST | true | true | src/app/api\finance\controls\route.ts |
| /api/finance/financial-health | GET | true | true | src/app/api\finance\financial-health\route.ts |
| /api/finance/ifrs16 | GET,POST | true | true | src/app/api\finance\ifrs16\route.ts |
| /api/finance/period-reports | GET | true | true | src/app/api\finance\period-reports\route.ts |
| /api/finance/petty-cash/:id/process | PUT | true | true | src/app/api\finance\petty-cash\[id]\process\route.ts |
| /api/finance/rolling-forecast | GET,POST | true | true | src/app/api\finance\rolling-forecast\route.ts |
| /api/finance/treasury | GET,POST | true | true | src/app/api\finance\treasury\route.ts |
| /api/inventory/stocktake/:id/approve | POST | true | true | src/app/api\inventory\stocktake\[id]\approve\route.ts |
| /api/knowledge/articles | GET,POST,PUT | true | true | src/app/api\knowledge\articles\route.ts |
| /api/knowledge/categories | GET,POST | true | true | src/app/api\knowledge\categories\route.ts |
| /api/lms/courses | GET,POST | true | true | src/app/api\lms\courses\route.ts |
| /api/logistics/carriers | GET,POST | true | true | src/app/api\logistics\carriers\route.ts |
| /api/logistics/freight | GET,POST | true | true | src/app/api\logistics\freight\route.ts |
| /api/manufacturing | GET,POST,PUT | true | true | src/app/api\manufacturing\route.ts |
| /api/manufacturing/work-orders | GET,POST,PUT | true | true | src/app/api\manufacturing\work-orders\route.ts |
| /api/payroll | GET,POST | true | true | src/app/api\payroll\route.ts |
| /api/payroll/provisions/run | GET,POST | true | true | src/app/api\payroll\provisions\run\route.ts |
| /api/payroll/runs/:id/post | POST | true | true | src/app/api\payroll\runs\[id]\post\route.ts |
| /api/planning/slots | GET,POST,DELETE | true | true | src/app/api\planning\slots\route.ts |
| /api/platform/dms |  | false | true | src/app/api\platform\dms\route.ts |
| /api/portal/messages | GET,POST | true | true | src/app/api\portal\messages\route.ts |
| /api/portal/users | GET,POST | true | true | src/app/api\portal\users\route.ts |
| /api/pos/sync | GET,POST | true | true | src/app/api\pos\sync\route.ts |
| /api/procurement/vendor-portal | GET,POST | true | true | src/app/api\procurement\vendor-portal\route.ts |
| /api/products | GET,POST,DELETE | true | true | src/app/api\products\route.ts |
| /api/purchase-orders | GET,POST | true | true | src/app/api\purchase-orders\route.ts |
| /api/purchases | GET,POST,PUT,DELETE | true | true | src/app/api\purchases\route.ts |
| /api/purchases/:id/receive | PUT | true | true | src/app/api\purchases\[id]\receive\route.ts |
| /api/purchases/grn | GET,POST | true | true | src/app/api\purchases\grn\route.ts |
| /api/rental/agreements | GET,POST,PUT | true | true | src/app/api\rental\agreements\route.ts |
| /api/reports/financial-statements/generate | GET,POST | true | true | src/app/api\reports\financial-statements\generate\route.ts |
| /api/restaurant/pos/resolve |  | false | true | src/app/api\restaurant\pos\resolve\route.ts |
| /api/restaurant/pos/status |  | false | true | src/app/api\restaurant\pos\status\route.ts |
| /api/sales | GET,POST,PUT,DELETE | true | true | src/app/api\sales\route.ts |
| /api/sales/commissions/run | POST | true | true | src/app/api\sales\commissions\run\route.ts |
| /api/sales/delivery-notes | GET,POST | true | true | src/app/api\sales\delivery-notes\route.ts |
| /api/sales/rma | POST | true | true | src/app/api\sales\rma\route.ts |
| /api/smart-transfers | GET,POST,PUT | true | true | src/app/api\smart-transfers\route.ts |
| /api/supply-chain/rfx-auction |  | false | true | src/app/api\supply-chain\rfx-auction\route.ts |
| /api/supply-chain/vendor-onboarding |  | false | true | src/app/api\supply-chain\vendor-onboarding\route.ts |
| /api/system/dms | GET,POST | true | true | src/app/api\system\dms\route.ts |
| /api/treasury | GET,POST | true | true | src/app/api\treasury\route.ts |
| /api/v2/sales/invoices | POST | true | true | src/app/api\v2\sales\invoices\route.ts |
| /api/vendors/scorecard | GET | true | true | src/app/api\vendors\scorecard\route.ts |
| /api/warranty/check | GET | true | true | src/app/api\warranty\check\route.ts |
| /api/zatca/reverse-charge | GET,POST | true | true | src/app/api\zatca\reverse-charge\route.ts |


## APIs With Direct PrismaClient
| route | methods | withRoute | newPrisma | file |
| --- | --- | --- | --- | --- |
| /api/admin/nodes | GET,POST | true | true | src/app/api\admin\nodes\route.ts |
| /api/admin/nodes/billing | POST | true | true | src/app/api\admin\nodes\billing\route.ts |
| /api/admin/nodes/sync | POST | true | true | src/app/api\admin\nodes\sync\route.ts |
| /api/ai/bank-reconciliation | POST | true | true | src/app/api\ai\bank-reconciliation\route.ts |
| /api/ai/predictive-scm | POST | true | true | src/app/api\ai\predictive-scm\route.ts |
| /api/clinic/appointments | GET,POST | true | true | src/app/api\clinic\appointments\route.ts |
| /api/clinic/erx | GET,POST | true | true | src/app/api\clinic\erx\route.ts |
| /api/clinic/lab | GET,POST,PUT | true | true | src/app/api\clinic\lab\route.ts |
| /api/cron/rag-reindex |  | false | true | src/app/api\cron\rag-reindex\route.ts |
| /api/desktop/trial/verify | POST | true | true | src/app/api\desktop\trial\verify\route.ts |
| /api/finance/match/queue | GET | true | true | src/app/api\finance\match\queue\route.ts |
| /api/ice/backup/download | GET | true | true | src/app/api\ice\backup\download\route.ts |
| /api/ice/backup/list | GET | true | true | src/app/api\ice\backup\list\route.ts |
| /api/ice/desktop-register | POST | true | true | src/app/api\ice\desktop-register\route.ts |
| /api/learn/courses |  | false | true | src/app/api\learn\courses\route.ts |
| /api/master-panel-data | GET | true | true | src/app/api\master-panel-data\route.ts |
| /api/migration/start |  | false | true | src/app/api\migration\start\route.ts |
| /api/settings/numbering | GET | true | true | src/app/api\settings\numbering\route.ts |
| /api/subscription-status | GET | true | true | src/app/api\subscription-status\route.ts |
| /api/subscriptions | POST | true | true | src/app/api\subscriptions\route.ts |
| /api/sys/health | GET | true | true | src/app/api\sys\health\route.ts |
| /api/tenant/create | POST | true | true | src/app/api\tenant\create\route.ts |
| /api/tenant/hidden-modules | GET | true | true | src/app/api\tenant\hidden-modules\route.ts |
| /api/tenant/provision | POST | true | true | src/app/api\tenant\provision\route.ts |
| /api/tenant/status | GET | true | true | src/app/api\tenant\status\route.ts |
| /api/test-runs |  | false | true | src/app/api\test-runs\route.ts |


## APIs With Raw Unsafe SQL
| route | methods | withRoute | rawUnsafe | file |
| --- | --- | --- | --- | --- |
| /api/ice/backup/download | GET | true | true | src/app/api\ice\backup\download\route.ts |
| /api/ice/backup/list | GET | true | true | src/app/api\ice\backup\list\route.ts |
| /api/ice/backup/upload | POST | true | true | src/app/api\ice\backup\upload\route.ts |
| /api/ice/desktop-register | POST | true | true | src/app/api\ice\desktop-register\route.ts |
| /api/products | GET,POST,DELETE | true | true | src/app/api\products\route.ts |
| /api/settings | GET,POST,DELETE | true | true | src/app/api\settings\route.ts |

