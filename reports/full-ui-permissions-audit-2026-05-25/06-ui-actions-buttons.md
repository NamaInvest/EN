# UI Actions / Buttons Static Inventory

Counts are static code signals, not proof of runtime click success.

| route | buttons | onClicks | forms | hasPermissionText | fetches | hrefs | file |
| --- | --- | --- | --- | --- | --- | --- | --- |
| /accounting | 18 | 21 | 0 | false | /api/accounting/accounts \| /api/accounting/cost-centers \| /api/accounting/fiscal-periods \| /api/accounting/governance-violations \| /api/accounting/journal \| /api/accounting/ledger?accountId=${accountId} \| /api/accounting/trial-balance \| /api/accounting/income-statement \| /api/accounting/balance-sheet \| /api/accounting/accounts/init \| /api/accounting/journal/${id} \| /api/accounting/reversal |  | src/app\(dashboard)\accounting\page.tsx |
| /accounting/aging-report | 3 | 3 | 0 | false | /api/finance/aging?type=${type}&date=${asOfDate} |  | src/app\(dashboard)\accounting\aging-report\page.tsx |
| /accounting/allocations/rules | 3 | 0 | 0 | false |  |  | src/app\(dashboard)\accounting\allocations\rules\page.tsx |
| /accounting/bank-reconciliation | 3 | 3 | 0 | false |  |  | src/app\(dashboard)\accounting\bank-reconciliation\page.tsx |
| /accounting/banks | 6 | 7 | 2 | false | /api/banks \| /api/branches \| /api/banks/${id} | /accounting/banks/${b.id} | src/app\(dashboard)\accounting\banks\page.tsx |
| /accounting/banks/:id | 6 | 8 | 0 | false | /api/banks \| /api/banks/${params.id}/transactions | /accounting/banks | src/app\(dashboard)\accounting\banks\[id]\page.tsx |
| /accounting/banks/imports | 2 | 0 | 0 | false | /api/accounting/banks/imports | /accounting/banks/recon | src/app\(dashboard)\accounting\banks\imports\page.tsx |
| /accounting/banks/recon | 4 | 0 | 0 | false |  |  | src/app\(dashboard)\accounting\banks\recon\page.tsx |
| /accounting/collection-workflow | 3 | 3 | 0 | false | /api/accounting/collection-workflow?tenantId=default \| /api/accounting/collection-workflow |  | src/app\(dashboard)\accounting\collection-workflow\page.tsx |
| /accounting/customer-statements/bulk | 3 | 3 | 0 | false | /api/accounting/customer-statements/templates \| /api/accounting/customer-statements/bulk/history \| /api/accounting/customer-statements/bulk/preview?segment=${segment} \| /api/accounting/customer-statements/bulk/run |  | src/app\(dashboard)\accounting\customer-statements\bulk\page.tsx |
| /accounting/customer-statements/templates | 6 | 5 | 2 | false | /api/accounting/customer-statements/templates \| /api/accounting/customer-statements/templates/${id} |  | src/app\(dashboard)\accounting\customer-statements\templates\page.tsx |
| /accounting/deferred | 5 | 5 | 0 | false | /api/accounting/deferred \| /api/accounting/deferred?view=pending |  | src/app\(dashboard)\accounting\deferred\page.tsx |
| /accounting/dunning | 3 | 0 | 0 | false |  | /accounting/dunning/letters \| /accounting/dunning/promises | src/app\(dashboard)\accounting\dunning\page.tsx |
| /accounting/financial-close | 0 | 1 | 0 | false | /api/accounting/financial-close?period=${period} \| /api/accounting/financial-close?period=${period}&view=progress \| /api/accounting/financial-close |  | src/app\(dashboard)\accounting\financial-close\page.tsx |
| /accounting/fixed-assets | 2 | 0 | 0 | false | /api/accounting/fixed-assets |  | src/app\(dashboard)\accounting\fixed-assets\page.tsx |
| /accounting/journal | 1 | 1 | 0 | false | /api/accounting/journal | /accounting \| /accounting/journal/new | src/app\(dashboard)\accounting\journal\page.tsx |
| /accounting/journal/new | 3 | 2 | 2 | false | /api/accounting/journal | /accounting/journal | src/app\(dashboard)\accounting\journal\new\page.tsx |
| /accounting/lc | 3 | 3 | 0 | false | /api/accounting/lc |  | src/app\(dashboard)\accounting\lc\page.tsx |
| /accounting/leases | 2 | 0 | 0 | false | /api/accounting/leases |  | src/app\(dashboard)\accounting\leases\page.tsx |
| /accounting/multi-book | 3 | 0 | 0 | false |  |  | src/app\(dashboard)\accounting\multi-book\page.tsx |
| /accounting/open-items | 3 | 0 | 0 | false | /api/accounting/open-items |  | src/app\(dashboard)\accounting\open-items\page.tsx |
| /accounting/payment-runs | 4 | 0 | 0 | false |  | /accounting/payment-runs/create | src/app\(dashboard)\accounting\payment-runs\page.tsx |
| /accounting/payment-runs/create | 5 | 2 | 2 | false |  | /accounting/payment-runs | src/app\(dashboard)\accounting\payment-runs\create\page.tsx |
| /accounting/period-close | 4 | 4 | 0 | false | /api/accounting/period-close |  | src/app\(dashboard)\accounting\period-close\page.tsx |
| /accounting/period-lock | 4 | 4 | 0 | false | /api/accounting/period-lock?tenantId=${tenantId} \| /api/accounting/period-lock |  | src/app\(dashboard)\accounting\period-lock\page.tsx |
| /accounting/prepayments | 3 | 3 | 0 | false | /api/accounting/prepayments?tenantId=default&status=ACTIVE \| /api/accounting/prepayments |  | src/app\(dashboard)\accounting\prepayments\page.tsx |
| /accounting/profit-centers | 2 | 1 | 3 | false | /api/accounting/profit-centers | /accounting | src/app\(dashboard)\accounting\profit-centers\page.tsx |
| /accounting/profit-loss | 2 | 2 | 0 | false | /api/accounting/profit-loss?tenantId=default&from=${from}&to=${to} |  | src/app\(dashboard)\accounting\profit-loss\page.tsx |
| /accounting/revenue-recognition | 2 | 0 | 0 | false | /api/accounting/revenue-recognition |  | src/app\(dashboard)\accounting\revenue-recognition\page.tsx |
| /accounting/segments | 2 | 1 | 3 | false | /api/accounting/segments |  | src/app\(dashboard)\accounting\segments\page.tsx |
| /accounting/trial-balance | 1 | 2 | 0 | false | /api/accounting/trial-balance?${param.toString()} |  | src/app\(dashboard)\accounting\trial-balance\page.tsx |
| /accounting/vat-return | 3 | 3 | 0 | false | /api/accounting/vat-return?tenantId=default&period=${period} \| /api/accounting/vat-return |  | src/app\(dashboard)\accounting\vat-return\page.tsx |
| /accounting/vendor-statements | 5 | 0 | 0 | false |  | /accounting/vendor-statements/bulk | src/app\(dashboard)\accounting\vendor-statements\page.tsx |
| /accounting/vendor-statements/bulk | 3 | 0 | 0 | false |  | /accounting/vendor-statements | src/app\(dashboard)\accounting\vendor-statements\bulk\page.tsx |
| /accounting/year-end-close | 5 | 0 | 0 | false |  |  | src/app\(dashboard)\accounting\year-end-close\page.tsx |
| /admin/bi-builder | 2 | 2 | 0 | false | /api/admin/bi/query |  | src/app\(dashboard)\admin\bi-builder\page.tsx |
| /admin/compliance-dashboard | 1 | 0 | 0 | false |  |  | src/app\(dashboard)\admin\compliance-dashboard\page.tsx |
| /admin/e2e-tester | 1 | 1 | 0 | false | /api/admin/e2e-test |  | src/app\(dashboard)\admin\e2e-tester\page.tsx |
| /admin/feature-flags | 1 | 0 | 0 | false |  |  | src/app\(dashboard)\admin\feature-flags\page.tsx |
| /admin/grc | 3 | 0 | 0 | false |  | /admin/grc/audit-log \| /admin/grc/risks \| /admin/grc/policies | src/app\(dashboard)\admin\grc\page.tsx |
| /admin/knowledge | 1 | 0 | 2 | false | /api/admin/knowledge |  | src/app\(dashboard)\admin\knowledge\page.tsx |
| /admin/migration | 1 | 0 | 1 | false |  |  | src/app\(dashboard)\admin\migration\page.tsx |
| /admin/outbox | 1 | 1 | 0 | false | /api/admin/outbox/diagnostics |  | src/app\(dashboard)\admin\outbox\page.tsx |
| /admin/prompts | 1 | 0 | 2 | false | /api/admin/prompts |  | src/app\(dashboard)\admin\prompts\page.tsx |
| /admin/rag-cost | 1 | 0 | 0 | false |  |  | src/app\(dashboard)\admin\rag-cost\page.tsx |
| /admin/security/mfa-policy | 4 | 0 | 0 | false |  |  | src/app\(dashboard)\admin\security\mfa-policy\page.tsx |
| /admin/siem | 6 | 6 | 0 | true | /api/admin/siem?${qs.toString()} |  | src/app\(dashboard)\admin\siem\page.tsx |
| /admin/stories | 1 | 0 | 0 | false |  |  | src/app\(dashboard)\admin\stories\page.tsx |
| /admin/training-compliance | 1 | 0 | 0 | false |  |  | src/app\(dashboard)\admin\training-compliance\page.tsx |
| /affiliates | 2 | 2 | 0 | false |  |  | src/app\(dashboard)\affiliates\page.tsx |
| /ai-bank | 1 | 1 | 0 | false | /api/ai/bank-reconciliation |  | src/app\(dashboard)\ai-bank\page.tsx |
| /ai-cfo | 4 | 0 | 0 | false |  |  | src/app\(dashboard)\ai-cfo\page.tsx |
| /ai-copilot | 7 | 3 | 2 | false |  |  | src/app\(dashboard)\ai-copilot\page.tsx |
| /ai-scm | 1 | 1 | 0 | false | /api/ai/predictive-scm |  | src/app\(dashboard)\ai-scm\page.tsx |
| /ai/bank-fraud | 3 | 2 | 0 | false | /api/ai/bank-fraud |  | src/app\(dashboard)\ai\bank-fraud\page.tsx |
| /ai/nlq | 1 | 1 | 0 | false | /api/ai/nlq |  | src/app\(dashboard)\ai\nlq\page.tsx |
| /ap/capture | 30 | 18 | 4 | false | /api/ap/capture?status=${filter} \| /api/ap/capture \| /api/ap/capture?id=${activeCapture.id} |  | src/app\(dashboard)\ap\capture\page.tsx |
| /approvals | 3 | 3 | 0 | false | /api/approvals \| /api/approvals/${stepId} |  | src/app\(dashboard)\approvals\page.tsx |
| /approvals/inbox | 4 | 4 | 0 | true | /api/approvals/inbox?status=pending |  | src/app\(dashboard)\approvals\inbox\page.tsx |
| /assets | 4 | 4 | 0 | false | /api/assets \| /api/assets/depreciate |  | src/app\(dashboard)\assets\page.tsx |
| /attendance | 2 | 2 | 0 | false | /api/attendance \| /api/employees |  | src/app\(dashboard)\attendance\page.tsx |
| /audit-logs | 2 | 1 | 0 | false |  |  | src/app\(dashboard)\audit-logs\page.tsx |
| /audit/field-trail | 7 | 7 | 0 | false | /api/audit/field-trail?${p} |  | src/app\(dashboard)\audit\field-trail\page.tsx |
| /banks | 3 | 1 | 0 | false | /api/banks |  | src/app\(dashboard)\banks\page.tsx |
| /barcode | 4 | 5 | 0 | false | /api/products \| /api/settings \| /api/products/${selectedProduct.id} |  | src/app\(dashboard)\barcode\page.tsx |
| /batches | 6 | 7 | 1 | false | /api/batches \| /api/products \| /api/batches/${id} |  | src/app\(dashboard)\batches\page.tsx |
| /bookings | 8 | 8 | 0 | false | /api/bookings \| /api/customers \| /api/bookings/invoice |  | src/app\(dashboard)\bookings\page.tsx |
| /bookings/calendar | 4 | 4 | 0 | false | /api/bookings |  | src/app\(dashboard)\bookings\calendar\page.tsx |
| /branches | 6 | 7 | 1 | false | /api/branches \| /api/branches?id=${b.id} |  | src/app\(dashboard)\branches\page.tsx |
| /calendar | 2 | 2 | 0 | false |  |  | src/app\(dashboard)\calendar\page.tsx |
| /clinic/appointments | 4 | 3 | 2 | false | /api/clinic/appointments?date=${selectedDate} \| /api/clinic/appointments |  | src/app\(dashboard)\clinic\appointments\page.tsx |
| /clinic/erx | 7 | 6 | 0 | false | /api/clinic/erx |  | src/app\(dashboard)\clinic\erx\page.tsx |
| /clinic/lab | 8 | 8 | 2 | false | /api/clinic/lab |  | src/app\(dashboard)\clinic\lab\page.tsx |
| /cmms | 4 | 3 | 2 | false | /api/cmms/schedules |  | src/app\(dashboard)\cmms\page.tsx |
| /cmms/work-orders | 4 | 3 | 2 | false | /api/cmms/work-orders |  | src/app\(dashboard)\cmms\work-orders\page.tsx |
| /com/rules | 1 | 0 | 0 | false | /api/com/rules |  | src/app\(dashboard)\com\rules\page.tsx |
| /compliance/audits | 4 | 3 | 2 | false | /api/compliance/audits |  | src/app\(dashboard)\compliance\audits\page.tsx |
| /compliance/pdpl/breaches | 15 | 15 | 4 | true | /api/pdpl/breach?${qs.toString()} \| /api/pdpl/breach \| /api/pdpl/breach/${breach.id} |  | src/app\(dashboard)\compliance\pdpl\breaches\page.tsx |
| /compliance/pdpl/dsr | 20 | 20 | 2 | true | /api/pdpl/dsr?${qs.toString()} \| /api/pdpl/dsr \| /api/pdpl/dsr/${dsr.id} \| /api/pdpl/dsr/${dsr.id}/fulfill |  | src/app\(dashboard)\compliance\pdpl\dsr\page.tsx |
| /compliance/risks | 5 | 4 | 2 | false | /api/compliance/risks |  | src/app\(dashboard)\compliance\risks\page.tsx |
| /contracts | 1 | 1 | 0 | false | /api/contracts?view=summary \| /api/contracts |  | src/app\(dashboard)\contracts\page.tsx |
| /contracts/templates | 6 | 5 | 2 | false | /api/contracts/templates \| /api/contracts/templates?id=${id} |  | src/app\(dashboard)\contracts\templates\page.tsx |
| /coupons | 9 | 12 | 1 | false | /api/coupons \| /api/coupons/${c.id} \| /api/coupons/${id} |  | src/app\(dashboard)\coupons\page.tsx |
| /crm/campaigns | 6 | 5 | 3 | false | /api/crm/campaigns \| /api/crm/campaigns?id=${id} |  | src/app\(dashboard)\crm\campaigns\page.tsx |
| /crm/customer360 | 1 | 1 | 0 | false | /api/crm/customer360?id=${customerId} |  | src/app\(dashboard)\crm\customer360\page.tsx |
| /crm/leads | 5 | 4 | 2 | false | /api/crm/leads |  | src/app\(dashboard)\crm\leads\page.tsx |
| /crm/opportunities | 5 | 3 | 6 | false | /api/crm/opportunities |  | src/app\(dashboard)\crm\opportunities\page.tsx |
| /crm/tickets | 7 | 7 | 3 | false | /api/crm/tickets${q} \| /api/crm/tickets |  | src/app\(dashboard)\crm\tickets\page.tsx |
| /customers | 7 | 8 | 1 | false | /api/customers?${params} \| /api/sales/routes \| /api/customers/${id} \| /api/crm/whatsapp |  | src/app\(dashboard)\customers\page.tsx |
| /customers/:id | 2 | 1 | 0 | false | /api/customers/${(await params).id} \| /api/customers/${(await params).id}/credit \| /api/customers/${(await params).id}/hold |  | src/app\(dashboard)\customers\[id]\page.tsx |
| /dashboard | 2 | 2 | 0 | false | /api/dashboard \| /api/ai-cfo |  | src/app\(dashboard)\dashboard\page.tsx |
| /dms | 2 | 2 | 0 | false |  |  | src/app\(dashboard)\dms\page.tsx |
| /docs/:slug | 1 | 0 | 0 | false | /api/docs/${(await params).slug} | /docs | src/app\(dashboard)\docs\[slug]\page.tsx |
| /ecommerce/dashboard | 5 | 5 | 0 | false | /api/ecommerce/orders${q} \| /api/ecommerce/orders |  | src/app\(dashboard)\ecommerce\dashboard\page.tsx |
| /ecommerce/stores | 5 | 4 | 2 | false | /api/ecommerce/stores |  | src/app\(dashboard)\ecommerce\stores\page.tsx |
| /employees | 6 | 5 | 2 | false | /api/employees \| /api/branches \| /api/employees/${id} |  | src/app\(dashboard)\employees\page.tsx |
| /enterprise/fleet | 4 | 4 | 0 | false | /api/enterprise/fleet |  | src/app\(dashboard)\enterprise\fleet\page.tsx |
| /enterprise/legal | 7 | 6 | 2 | false | /api/enterprise/legal?type=${activeTab}&search=${search} \| /api/customers \| /api/banks \| /api/enterprise/legal |  | src/app\(dashboard)\enterprise\legal\page.tsx |
| /enterprise/mrp | 7 | 6 | 2 | false | /api/enterprise/mrp \| /api/manufacturing/recipes \| /api/stock |  | src/app\(dashboard)\enterprise\mrp\page.tsx |
| /enterprise/mrp/recipes | 7 | 6 | 2 | false | /api/manufacturing/recipes \| /api/products |  | src/app\(dashboard)\enterprise\mrp\recipes\page.tsx |
| /enterprise/projects | 8 | 6 | 2 | false | /api/enterprise/projects?search=${search} \| /api/customers \| /api/enterprise/projects \| /api/enterprise/projects?id=${id} |  | src/app\(dashboard)\enterprise\projects\page.tsx |
| /enterprise/projects/:id | 9 | 8 | 2 | false | /api/enterprise/projects/tasks?projectId=${id} \| /api/enterprise/projects/tasks |  | src/app\(dashboard)\enterprise\projects\[id]\page.tsx |
| /enterprise/projects/:id/gantt | 2 | 2 | 0 | false | /api/projects/advanced?projectId=${(await params).id} \| /api/projects/phases?projectId=${(await params).id} \| /api/projects/milestones?projectId=${(await params).id} \| /api/projects/risks?projectId=${(await params).id} \| /api/projects/resources?projectId=${(await params).id} |  | src/app\(dashboard)\enterprise\projects\[id]\gantt\page.tsx |
| /enterprise/property | 4 | 4 | 0 | false | /api/enterprise/property |  | src/app\(dashboard)\enterprise\property\page.tsx |
| /enterprise/quality | 4 | 4 | 0 | false | /api/enterprise/quality |  | src/app\(dashboard)\enterprise\quality\page.tsx |
| /enterprise/quality-management | 1 | 1 | 0 | false | /api/manufacturing/quality-management |  | src/app\(dashboard)\enterprise\quality-management\page.tsx |
| /enterprise/wms | 9 | 11 | 2 | false | /api/enterprise/wms |  | src/app\(dashboard)\enterprise\wms\page.tsx |
| /esign | 4 | 3 | 2 | false | /api/esign |  | src/app\(dashboard)\esign\page.tsx |
| /events | 4 | 3 | 2 | false | /api/events |  | src/app\(dashboard)\events\page.tsx |
| /expenses | 7 | 8 | 1 | true | /api/expenses?${params} \| /api/accounting/cost-centers \| /api/expenses \| /api/expenses?id=${e.id} \| /api/expenses?all=true |  | src/app\(dashboard)\expenses\page.tsx |
| /field-service | 4 | 3 | 2 | false | /api/field-service/orders |  | src/app\(dashboard)\field-service\page.tsx |
| /finance/allocation | 1 | 1 | 0 | false | /api/finance/allocation |  | src/app\(dashboard)\finance\allocation\page.tsx |
| /finance/assets | 4 | 2 | 3 | false | /api/finance/assets |  | src/app\(dashboard)\finance\assets\page.tsx |
| /finance/bad-debt | 9 | 5 | 0 | false | /api/finance/bad-debt |  | src/app\(dashboard)\finance\bad-debt\page.tsx |
| /finance/bank-recon/rules | 6 | 5 | 2 | false | /api/finance/bank-recon/rules \| /api/finance/bank-recon/rules?id=${id} \| /api/finance/bank-recon/rules/simulate |  | src/app\(dashboard)\finance\bank-recon\rules\page.tsx |
| /finance/budget-control | 2 | 2 | 0 | false | /api/finance/budget-control?year=${year} \| /api/finance/budget-control |  | src/app\(dashboard)\finance\budget-control\page.tsx |
| /finance/budget-planning | 4 | 2 | 2 | false | /api/finance/budget |  | src/app\(dashboard)\finance\budget-planning\page.tsx |
| /finance/budget-scenarios | 6 | 5 | 3 | false | /api/budgets/scenarios \| /api/budgets/scenarios?id=${id} |  | src/app\(dashboard)\finance\budget-scenarios\page.tsx |
| /finance/cash-flow | 2 | 2 | 0 | false | /api/finance/cash-flow?action=latest \| /api/finance/cash-flow |  | src/app\(dashboard)\finance\cash-flow\page.tsx |
| /finance/cash-flow/forecast | 1 | 1 | 0 | false | /api/finance/cash-flow/forecast?weeks=${weeks} \| /api/finance/cash-flow/forecast |  | src/app\(dashboard)\finance\cash-flow\forecast\page.tsx |
| /finance/cfo | 2 | 2 | 0 | false | /api/finance/cfo-dashboard \| /api/finance/auto-ecl |  | src/app\(dashboard)\finance\cfo\page.tsx |
| /finance/cfo-ai | 2 | 2 | 0 | false | /api/finance/cfo |  | src/app\(dashboard)\finance\cfo-ai\page.tsx |
| /finance/cfo-dashboard | 5 | 5 | 0 | false | /api/finance/cfo-dashboard |  | src/app\(dashboard)\finance\cfo-dashboard\page.tsx |
| /finance/consolidation | 6 | 6 | 0 | false | /api/finance/consolidation \| /api/finance/consolidation?action=summary&runId=${runId} |  | src/app\(dashboard)\finance\consolidation\page.tsx |
| /finance/consolidation/elimination | 1 | 1 | 0 | false | /api/finance/consolidation/elimination |  | src/app\(dashboard)\finance\consolidation\elimination\page.tsx |
| /finance/copa | 2 | 2 | 0 | false | /api/copa?${params} | /finance/copa/rules | src/app\(dashboard)\finance\copa\page.tsx |
| /finance/copa/rules | 3 | 3 | 0 | false | /api/copa/allocations |  | src/app\(dashboard)\finance\copa\rules\page.tsx |
| /finance/credit-check | 6 | 9 | 0 | true | /api/credit-check?action=at-risk&threshold=${threshold} \| /api/credit-check?customerId=${id} \| /api/credit-check |  | src/app\(dashboard)\finance\credit-check\page.tsx |
| /finance/deferred-tax | 1 | 1 | 0 | false | /api/finance/deferred-tax?date=${asOfDate}&rate=${taxRate / 100} |  | src/app\(dashboard)\finance\deferred-tax\page.tsx |
| /finance/ecl | 1 | 1 | 0 | false | /api/finance/ecl |  | src/app\(dashboard)\finance\ecl\page.tsx |
| /finance/financial-health | 1 | 1 | 0 | false | /api/finance/financial-health?tenantId=default |  | src/app\(dashboard)\finance\financial-health\page.tsx |
| /finance/fx-revaluation | 1 | 1 | 0 | false | /api/finance/fx-revaluation |  | src/app\(dashboard)\finance\fx-revaluation\page.tsx |
| /finance/impairment | 1 | 1 | 0 | false | /api/finance/impairment?date=${asOfDate} |  | src/app\(dashboard)\finance\impairment\page.tsx |
| /finance/payment-run | 9 | 8 | 2 | false | /api/finance/payment-run \| /api/finance/payment-run/propose \| /api/finance/payment-run/${id}/${action} |  | src/app\(dashboard)\finance\payment-run\page.tsx |
| /finance/period-close | 4 | 3 | 0 | false | /api/finance/period-close?periodId=${periodId} \| /api/finance/period-close \| /api/finance/period-close/${id}/step |  | src/app\(dashboard)\finance\period-close\page.tsx |
| /finance/rebates | 4 | 4 | 0 | false | /api/rebates |  | src/app\(dashboard)\finance\rebates\page.tsx |
| /finance/transfer-pricing | 1 | 1 | 0 | false | /api/finance/transfer-pricing?date=${asOfDate}&min=${minMarkup / 100}&max=${maxMarkup / 100} |  | src/app\(dashboard)\finance\transfer-pricing\page.tsx |
| /finance/variance | 1 | 1 | 0 | false | /api/finance/variance |  | src/app\(dashboard)\finance\variance\page.tsx |
| /finance/vat/categories | 9 | 9 | 0 | true | /api/vat/categories \| /api/vat/categories?${qs.toString()} |  | src/app\(dashboard)\finance\vat\categories\page.tsx |
| /finance/wht | 1 | 1 | 0 | false | /api/finance/wht |  | src/app\(dashboard)\finance\wht\page.tsx |
| /finance/wht/form14 | 11 | 11 | 0 | true | /api/wht/form14 \| /api/wht/form14/generate \| /api/wht/form14?period=${period} |  | src/app\(dashboard)\finance\wht\form14\page.tsx |
| /fiscal-periods | 3 | 3 | 0 | false | /api/fiscal-periods |  | src/app\(dashboard)\fiscal-periods\page.tsx |
| /fixed-assets | 10 | 13 | 1 | false | /api/fixed-assets \| /api/fixed-assets/${id} \| /api/fixed-assets/${id}/depreciate |  | src/app\(dashboard)\fixed-assets\page.tsx |
| /fleet | 1 | 1 | 0 | false | /api/fleet/advanced?view=dashboard |  | src/app\(dashboard)\fleet\page.tsx |
| /fleet/fuel | 1 | 0 | 0 | false | /api/fleet/fuel |  | src/app\(dashboard)\fleet\fuel\page.tsx |
| /fleet/maintenance | 1 | 0 | 0 | false | /api/fleet/maintenance |  | src/app\(dashboard)\fleet\maintenance\page.tsx |
| /fleet/trips | 1 | 0 | 0 | false | /api/fleet/trips |  | src/app\(dashboard)\fleet\trips\page.tsx |
| /fng/allocations | 3 | 0 | 0 | false |  |  | src/app\(dashboard)\fng\allocations\page.tsx |
| /fng/budgets | 3 | 0 | 0 | false |  |  | src/app\(dashboard)\fng\budgets\page.tsx |
| /fng/petty-cash-funds | 6 | 5 | 2 | false | /api/fng/petty-cash-funds \| /api/employees \| /api/fng/petty-cash-funds?id=${id} |  | src/app\(dashboard)\fng\petty-cash-funds\page.tsx |
| /fsm | 1 | 0 | 0 | false | /api/fsm/tickets | /fsm/dispatch | src/app\(dashboard)\fsm\page.tsx |
| /fsm/tasks | 2 | 1 | 0 | false | /api/fsm/tickets \| /api/fsm/complete |  | src/app\(dashboard)\fsm\tasks\page.tsx |
| /fx | 3 | 1 | 0 | false | /api/fx |  | src/app\(dashboard)\fx\page.tsx |
| /gift-cards | 4 | 0 | 0 | false |  |  | src/app\(dashboard)\gift-cards\page.tsx |
| /hr | 3 | 0 | 0 | false |  | /hr/employees/create | src/app\(dashboard)\hr\page.tsx |
| /hr/ai-enrollment | 4 | 4 | 0 | false | /api/employees |  | src/app\(dashboard)\hr\ai-enrollment\page.tsx |
| /hr/attendance | 2 | 2 | 0 | false | /api/hr/attendance \| /api/employees |  | src/app\(dashboard)\hr\attendance\page.tsx |
| /hr/documents | 6 | 6 | 0 | false | /api/hr/documents/expiry \| /api/hr/documents/expiry/${renewModal.alertId} \| /api/hr/documents/expiry/${alertId} |  | src/app\(dashboard)\hr\documents\page.tsx |
| /hr/eos | 4 | 4 | 0 | false | /api/hr/eos \| /api/hr/eos/${id} |  | src/app\(dashboard)\hr\eos\page.tsx |
| /hr/evaluations | 4 | 3 | 3 | false | /api/hr/evaluations \| /api/employees |  | src/app\(dashboard)\hr\evaluations\page.tsx |
| /hr/expense-reports | 7 | 7 | 0 | false | /api/hr/expense-reports |  | src/app\(dashboard)\hr\expense-reports\page.tsx |
| /hr/gosi | 1 | 1 | 0 | false | /api/hr/gosi?year=${year} \| /api/hr/gosi |  | src/app\(dashboard)\hr\gosi\page.tsx |
| /hr/jobs | 3 | 3 | 0 | false | /api/hr/jobs |  | src/app\(dashboard)\hr\jobs\page.tsx |
| /hr/leaves | 6 | 6 | 0 | false | /api/hr/leaves?${params} \| /api/hr/leaves \| /api/hr/leaves/${id} \| /api/hr/leaves/accrual |  | src/app\(dashboard)\hr\leaves\page.tsx |
| /hr/loans | 3 | 2 | 3 | false | /api/hr/loans \| /api/employees |  | src/app\(dashboard)\hr\loans\page.tsx |
| /hr/mudad | 11 | 11 | 0 | true | /api/hr/mudad/compliance?view=dashboard \| /api/hr/mudad/compliance \| /api/hr/mudad/compliance?view=report&month=${reportMonth} | https://mudad.com.sa/ | src/app\(dashboard)\hr\mudad\page.tsx |
| /hr/nitaqat-simulator | 7 | 7 | 0 | true | /api/saudi/nitaqat/projection |  | src/app\(dashboard)\hr\nitaqat-simulator\page.tsx |
| /hr/payroll-process | 5 | 4 | 2 | false | /api/employees \| /api/payroll/calculate \| /api/payroll |  | src/app\(dashboard)\hr\payroll-process\page.tsx |
| /hr/payroll/config | 1 | 0 | 2 | false | /api/hr/payroll/config |  | src/app\(dashboard)\hr\payroll\config\page.tsx |
| /hr/payroll/run | 1 | 1 | 0 | false | /api/hr/payroll/run?month=${month}&year=${year} \| /api/hr/payroll/run | /hr/payroll/config | src/app\(dashboard)\hr\payroll\run\page.tsx |
| /hr/payslip/:id | 2 | 2 | 0 | false | /api/payroll/${id} |  | src/app\(dashboard)\hr\payslip\[id]\page.tsx |
| /hr/performance | 3 | 2 | 3 | false | /api/hr/performance |  | src/app\(dashboard)\hr\performance\page.tsx |
| /hr/qiwa | 3 | 3 | 0 | true | /api/hr/qiwa \| /api/saudi/qiwa/sync | https://www.qiwa.sa/ \| /hr/qiwa/contracts | src/app\(dashboard)\hr\qiwa\page.tsx |
| /hr/qiwa/contracts | 11 | 10 | 2 | true | /api/hr/qiwa/contracts?${qs.toString()} \| /api/hr/qiwa/contracts | /hr/qiwa | src/app\(dashboard)\hr\qiwa\contracts\page.tsx |
| /hr/recruitment | 0 | 1 | 0 | false | /api/hr/recruitment \| /api/hr/recruitment?jobId=${jobId} |  | src/app\(dashboard)\hr\recruitment\page.tsx |
| /hr/saudization | 4 | 4 | 0 | true | /api/saudi/saudization/snapshot | https://www.qiwa.sa/ \| /hr/nitaqat-simulator | src/app\(dashboard)\hr\saudization\page.tsx |
| /hr/self-service | 11 | 9 | 0 | false |  |  | src/app\(dashboard)\hr\self-service\page.tsx |
| /hr/succession | 1 | 11 | 0 | false | /api/hr/succession |  | src/app\(dashboard)\hr\succession\page.tsx |
| /hr/timesheet | 2 | 0 | 0 | false | /api/hr/timesheet?employeeId=1&weekStart=${weekStart.toISOString().split( |  | src/app\(dashboard)\hr\timesheet\page.tsx |
| /hr/training | 4 | 3 | 3 | false | /api/hr/training |  | src/app\(dashboard)\hr\training\page.tsx |
| /hr/wps | 8 | 9 | 2 | false | /api/hr/wps |  | src/app\(dashboard)\hr\wps\page.tsx |
| /installments | 0 | 1 | 0 | false | /api/installments |  | src/app\(dashboard)\installments\page.tsx |
| /inv/serials | 1 | 0 | 0 | false | /api/inv/serials |  | src/app\(dashboard)\inv\serials\page.tsx |
| /inventory/abc-analysis | 1 | 1 | 0 | false | /api/inventory/abc-analysis?period=${period} \| /api/inventory/abc-analysis |  | src/app\(dashboard)\inventory\abc-analysis\page.tsx |
| /inventory/ai-vision | 3 | 2 | 0 | false | /api/inventory/ai-vision |  | src/app\(dashboard)\inventory\ai-vision\page.tsx |
| /inventory/delivery-notes | 5 | 1 | 0 | false | /api/shipments/delivery-notes |  | src/app\(dashboard)\inventory\delivery-notes\page.tsx |
| /inventory/movements | 1 | 0 | 0 | false |  | /inventory/wms | src/app\(dashboard)\inventory\movements\page.tsx |
| /inventory/picking/:id | 1 | 1 | 0 | false | /api/inventory/picking/${(await params).id} |  | src/app\(dashboard)\inventory\picking\[id]\page.tsx |
| /inventory/quality-control | 4 | 4 | 0 | false | /api/inventory/quality-control |  | src/app\(dashboard)\inventory\quality-control\page.tsx |
| /inventory/reorder-rules | 3 | 2 | 0 | false | /api/inventory/reorder-rules \| /api/inventory/reorder-rules?view=alerts |  | src/app\(dashboard)\inventory\reorder-rules\page.tsx |
| /inventory/stocktake/cycle | 3 | 2 | 0 | false | /api/inventory/stocktake \| /api/cron/cycle-count \| /api/inventory/stocktake/${id}/approve |  | src/app\(dashboard)\inventory\stocktake\cycle\page.tsx |
| /inventory/traceability | 1 | 1 | 0 | false |  |  | src/app\(dashboard)\inventory\traceability\page.tsx |
| /inventory/wms | 2 | 0 | 0 | false |  | /inventory/movements \| /inventory/zones | src/app\(dashboard)\inventory\wms\page.tsx |
| /inventory/wms/putaway | 3 | 0 | 0 | false |  |  | src/app\(dashboard)\inventory\wms\putaway\page.tsx |
| /inventory/zones | 3 | 0 | 0 | false |  | /inventory/wms | src/app\(dashboard)\inventory\zones\page.tsx |
| /knowledge/articles | 4 | 4 | 2 | false | /api/knowledge/articles |  | src/app\(dashboard)\knowledge\articles\page.tsx |
| /learn | 2 | 0 | 0 | false |  | # | src/app\(dashboard)\learn\page.tsx |
| /lms/courses | 4 | 3 | 2 | false | /api/lms/courses |  | src/app\(dashboard)\lms\courses\page.tsx |
| /logistics/carriers | 4 | 3 | 2 | false | /api/logistics/carriers |  | src/app\(dashboard)\logistics\carriers\page.tsx |
| /logistics/freight | 4 | 3 | 2 | false | /api/logistics/freight |  | src/app\(dashboard)\logistics\freight\page.tsx |
| /loyalty | 7 | 11 | 0 | false | /api/loyalty \| /api/settings \| /api/loyalty/${l.customerId}/transactions |  | src/app\(dashboard)\loyalty\page.tsx |
| /maintenance | 6 | 6 | 0 | false | /api/maintenance |  | src/app\(dashboard)\maintenance\page.tsx |
| /manufacturing | 2 | 0 | 0 | false | /api/manufacturing/stats | /manufacturing/boms \| /manufacturing/orders | src/app\(dashboard)\manufacturing\page.tsx |
| /manufacturing/blockchain-trace | 1 | 1 | 0 | false |  |  | src/app\(dashboard)\manufacturing\blockchain-trace\page.tsx |
| /manufacturing/bom | 8 | 9 | 0 | false | /api/manufacturing/bom \| /api/products |  | src/app\(dashboard)\manufacturing\bom\page.tsx |
| /manufacturing/boms | 2 | 0 | 0 | false |  | /manufacturing | src/app\(dashboard)\manufacturing\boms\page.tsx |
| /manufacturing/boms/:id/versions | 6 | 5 | 2 | false | /api/manufacturing/boms/${resolvedId}/versions \| /api/manufacturing/boms/versions/${versionId}/activate |  | src/app\(dashboard)\manufacturing\boms\[id]\versions\page.tsx |
| /manufacturing/capa | 7 | 5 | 4 | false | /api/manufacturing/capa \| /api/manufacturing/quality-control |  | src/app\(dashboard)\manufacturing\capa\page.tsx |
| /manufacturing/digital-twin | 2 | 1 | 0 | false | /api/manufacturing/digital-twin |  | src/app\(dashboard)\manufacturing\digital-twin\page.tsx |
| /manufacturing/lean-kanban | 2 | 2 | 0 | false | /api/manufacturing/kanban |  | src/app\(dashboard)\manufacturing\lean-kanban\page.tsx |
| /manufacturing/mes-oee | 1 | 1 | 0 | false | /api/manufacturing/mes-oee |  | src/app\(dashboard)\manufacturing\mes-oee\page.tsx |
| /manufacturing/mrp-dashboard | 7 | 5 | 2 | false |  |  | src/app\(dashboard)\manufacturing\mrp-dashboard\page.tsx |
| /manufacturing/mrp-engine | 3 | 1 | 0 | false | /api/manufacturing/mrp-run |  | src/app\(dashboard)\manufacturing\mrp-engine\page.tsx |
| /manufacturing/orders | 2 | 0 | 0 | false |  | /manufacturing | src/app\(dashboard)\manufacturing\orders\page.tsx |
| /manufacturing/qc | 3 | 2 | 3 | false | /api/manufacturing/work-orders \| /api/manufacturing/quality-control |  | src/app\(dashboard)\manufacturing\qc\page.tsx |
| /manufacturing/routing | 6 | 6 | 0 | false | /api/manufacturing/routing |  | src/app\(dashboard)\manufacturing\routing\page.tsx |
| /manufacturing/scrap | 3 | 2 | 3 | false | /api/manufacturing/scrap |  | src/app\(dashboard)\manufacturing\scrap\page.tsx |
| /manufacturing/standard-cost | 2 | 2 | 0 | false | /api/manufacturing/standard-cost |  | src/app\(dashboard)\manufacturing\standard-cost\page.tsx |
| /manufacturing/subcontracting | 4 | 4 | 0 | false | /api/manufacturing/subcontracting |  | src/app\(dashboard)\manufacturing\subcontracting\page.tsx |
| /manufacturing/variance | 1 | 0 | 0 | false | /api/manufacturing/variance |  | src/app\(dashboard)\manufacturing\variance\page.tsx |
| /manufacturing/work-centers | 3 | 2 | 2 | false | /api/manufacturing/work-centers |  | src/app\(dashboard)\manufacturing\work-centers\page.tsx |
| /manufacturing/work-orders | 6 | 4 | 4 | false | /api/manufacturing/work-orders \| /api/manufacturing/bom |  | src/app\(dashboard)\manufacturing\work-orders\page.tsx |
| /payroll/wps | 3 | 3 | 0 | false | /api/payroll/wps/history \| /api/payroll/wps/generate \| /api/payroll/wps/${batchId}/mark-uploaded |  | src/app\(dashboard)\payroll\wps\page.tsx |
| /pharmacy | 4 | 4 | 0 | true | /api/pharmacy/drugs \| /api/pharmacy/prescriptions \| /api/pharmacy/drug-interactions | /pharmacy/manager \| /drug-interact | src/app\(dashboard)\pharmacy\page.tsx |
| /pharmacy/manager | 8 | 7 | 2 | true | /api/pharmacy/drugs | /pharmacy | src/app\(dashboard)\pharmacy\manager\page.tsx |
| /planning | 4 | 3 | 2 | false | /api/planning/slots |  | src/app\(dashboard)\planning\page.tsx |
| /portal | 4 | 3 | 2 | false | /api/portal/users |  | src/app\(dashboard)\portal\page.tsx |
| /pos | 13 | 20 | 0 | true | /api/pos/restaurant/floor \| /api/settings \| /api/pos/pending-orders \| /api/sales?limit=15 \| /api/pos/products \| /api/customers?search=${query} \| /api/coupons/validate | /dashboard | src/app\(dashboard)\pos\page.tsx |
| /pos-dashboard | 3 | 0 | 0 | false |  | /restaurant-tables \| /pos | src/app\(dashboard)\pos-dashboard\page.tsx |
| /pos-demo | 8 | 0 | 0 | false |  |  | src/app\(dashboard)\pos-demo\page.tsx |
| /pos/offline | 3 | 3 | 0 | false | /api/pos/sync |  | src/app\(dashboard)\pos\offline\page.tsx |
| /price-quotes | 10 | 14 | 0 | false | /api/price-quotes \| /api/products \| /api/settings \| /api/auth/me \| /api/sales \| /api/price-quotes?id=${quote.id} |  | src/app\(dashboard)\price-quotes\page.tsx |
| /procurement/contracts | 4 | 3 | 3 | false | /api/procurement/contracts \| /api/cron/contracts |  | src/app\(dashboard)\procurement\contracts\page.tsx |
| /procurement/price-comparison | 1 | 0 | 0 | false |  |  | src/app\(dashboard)\procurement\price-comparison\page.tsx |
| /procurement/rfq/:id | 2 | 2 | 0 | false | /api/procurement/rfq/${id}/comparison \| /api/procurement/rfq/${id}/award \| /api/procurement/rfq/${id}/invite |  | src/app\(dashboard)\procurement\rfq\[id]\page.tsx |
| /procurement/vendor-portal | 3 | 2 | 0 | false | /api/procurement/vendor-portal |  | src/app\(dashboard)\procurement\vendor-portal\page.tsx |
| /procurement/vendors/scorecard | 8 | 7 | 2 | false | /api/procurement/vendors/scorecard \| /api/cron/vendor-scoring |  | src/app\(dashboard)\procurement\vendors\scorecard\page.tsx |
| /products | 11 | 11 | 0 | true | /api/settings/hidden_modules \| /api/products?${params} \| /api/categories \| /api/units \| /api/products/${id} \| /api/products/export \| /api/products/import \| /api/products \| /api/products?action=delete_all \| /api/categories?action=delete_all |  | src/app\(dashboard)\products\page.tsx |
| /profile/security | 4 | 4 | 0 | false | /api/auth/2fa/setup \| /api/auth/2fa/verify \| /api/auth/2fa/backup-codes |  | src/app\(dashboard)\profile\security\page.tsx |
| /promotions | 4 | 0 | 0 | false |  |  | src/app\(dashboard)\promotions\page.tsx |
| /purchase-orders | 20 | 21 | 2 | false | /api/customers?type=1 \| /api/purchase-orders \| /api/purchase-orders/${id} |  | src/app\(dashboard)\purchase-orders\page.tsx |
| /purchase-orders/:id/landed-costs | 3 | 2 | 2 | false | /api/purchase-orders/${orderId} \| /api/purchase-orders/${orderId}/landed-costs \| /api/accounts \| /api/settings/currencies \| /api/purchase-orders/${orderId}/landed-costs/${id} |  | src/app\(dashboard)\purchase-orders\[id]\landed-costs\page.tsx |
| /purchase-returns | 3 | 2 | 1 | false | /api/purchase-returns |  | src/app\(dashboard)\purchase-returns\page.tsx |
| /purchases/grn | 7 | 4 | 2 | false | /api/purchases/grn \| /api/customers?type=1 \| /api/products \| /api/warehouses |  | src/app\(dashboard)\purchases\grn\page.tsx |
| /purchases/landed-cost/:poId | 4 | 5 | 2 | false | /api/purchases/po/${poId} \| /api/purchases/po/${poId}/landed-costs \| /api/purchases/po/${poId}/landed-costs/${costId}/allocate |  | src/app\(dashboard)\purchases\landed-cost\[poId]\page.tsx |
| /purchases/letters-of-credit | 6 | 7 | 2 | false | /api/purchases/letters-of-credit \| /api/banks \| /api/customers?type=1 \| /api/settings/currencies \| /api/purchases/letters-of-credit/${id} |  | src/app\(dashboard)\purchases\letters-of-credit\page.tsx |
| /purchases/matching | 7 | 7 | 0 | false | /api/purchases/matching \| /api/purchases/matching/${selectedMatch.id}/resolve |  | src/app\(dashboard)\purchases\matching\page.tsx |
| /purchases/orders | 4 | 0 | 0 | false |  | /purchases/requisitions | src/app\(dashboard)\purchases\orders\page.tsx |
| /purchases/requisitions | 7 | 0 | 0 | false |  | /purchases/orders | src/app\(dashboard)\purchases\requisitions\page.tsx |
| /purchases/rfq | 8 | 4 | 2 | false | /api/purchases/rfq \| /api/customers?type=1 \| /api/products |  | src/app\(dashboard)\purchases\rfq\page.tsx |
| /purchases/three-way-match | 4 | 3 | 0 | false | /api/purchases/three-way-match |  | src/app\(dashboard)\purchases\three-way-match\page.tsx |
| /quality | 1 | 0 | 0 | false | /api/quality/stats | /quality/inspections | src/app\(dashboard)\quality\page.tsx |
| /quality/inspections | 3 | 0 | 0 | false |  | /quality | src/app\(dashboard)\quality\inspections\page.tsx |
| /quality/ncrs | 3 | 0 | 0 | false |  | /quality | src/app\(dashboard)\quality\ncrs\page.tsx |
| /receipt-vouchers | 2 | 2 | 0 | false | /api/sales |  | src/app\(dashboard)\receipt-vouchers\page.tsx |
| /recurring-invoices | 2 | 2 | 0 | false | /api/recurring-invoices \| /api/cron/trigger-invoices | /sales/orders/create | src/app\(dashboard)\recurring-invoices\page.tsx |
| /rem | 11 | 5 | 2 | false |  |  | src/app\(dashboard)\rem\page.tsx |
| /rem/installments | 1 | 1 | 0 | false | /api/rem/installments |  | src/app\(dashboard)\rem\installments\page.tsx |
| /rem/leases | 1 | 1 | 0 | false | /api/rem/leases |  | src/app\(dashboard)\rem\leases\page.tsx |
| /rent | 3 | 2 | 2 | false | /api/rent |  | src/app\(dashboard)\rent\page.tsx |
| /rental/agreements | 4 | 3 | 2 | false | /api/rental/agreements |  | src/app\(dashboard)\rental\agreements\page.tsx |
| /reports | 17 | 17 | 0 | false | /api/reports/users-list \| /api/branches \| /api/reports/${key}?${params} |  | src/app\(dashboard)\reports\page.tsx |
| /reports/104-modules | 3 | 6 | 0 | false |  |  | src/app\(dashboard)\reports\104-modules\page.tsx |
| /reports/73-modules | 3 | 6 | 0 | false |  |  | src/app\(dashboard)\reports\73-modules\page.tsx |
| /reports/aging | 2 | 2 | 0 | false | /api/reports/aging?type=${type} |  | src/app\(dashboard)\reports\aging\page.tsx |
| /reports/allocations | 5 | 1 | 0 | false | /api/accounting/allocations/simulate |  | src/app\(dashboard)\reports\allocations\page.tsx |
| /reports/builder | 6 | 0 | 0 | false |  |  | src/app\(dashboard)\reports\builder\page.tsx |
| /reports/cashflow | 3 | 0 | 0 | false | /api/accounting/cashflow/forecast?days=30 |  | src/app\(dashboard)\reports\cashflow\page.tsx |
| /reports/consolidation | 2 | 2 | 0 | false |  |  | src/app\(dashboard)\reports\consolidation\page.tsx |
| /reports/customer-statement | 2 | 2 | 0 | false | /api/customers \| /api/reports/customer-statement?${query.toString()} |  | src/app\(dashboard)\reports\customer-statement\page.tsx |
| /reports/expiry | 1 | 1 | 0 | false | /api/batches/expiry?days=${days} |  | src/app\(dashboard)\reports\expiry\page.tsx |
| /reports/footnotes | 4 | 0 | 0 | false |  |  | src/app\(dashboard)\reports\footnotes\page.tsx |
| /reports/fraud-ai | 1 | 1 | 0 | false | /api/ai/fraud-monitoring |  | src/app\(dashboard)\reports\fraud-ai\page.tsx |
| /reports/kpi-builder | 2 | 0 | 0 | false |  |  | src/app\(dashboard)\reports\kpi-builder\page.tsx |
| /reports/manual-purchases | 1 | 1 | 0 | false |  | /reports | src/app\(dashboard)\reports\manual-purchases\page.tsx |
| /reports/pivot | 1 | 1 | 0 | false | /api/system/pivot |  | src/app\(dashboard)\reports\pivot\page.tsx |
| /reports/returns | 1 | 1 | 0 | false | /api/reports/returns?${query.toString()} |  | src/app\(dashboard)\reports\returns\page.tsx |
| /reports/segments | 2 | 0 | 0 | false |  |  | src/app\(dashboard)\reports\segments\page.tsx |
| /reports/zatca-vat | 2 | 1 | 0 | false | /api/reports/zatca-vat?period=${period} |  | src/app\(dashboard)\reports\zatca-vat\page.tsx |
| /restaurant-pos | 18 | 25 | 0 | true | /api/pos/restaurant/floor \| /api/settings \| /api/pos/pending-orders \| /api/sales?limit=15 \| /api/pos/products \| /api/customers?search=${query} \| /api/coupons/validate | /dashboard | src/app\(dashboard)\restaurant-pos\page.tsx |
| /restaurant-tables | 3 | 0 | 0 | false |  | /pos-dashboard | src/app\(dashboard)\restaurant-tables\page.tsx |
| /salaries | 1 | 1 | 0 | false | /api/salaries \| /api/employees \| /api/hr/payroll/generate |  | src/app\(dashboard)\salaries\page.tsx |
| /sales | 41 | 56 | 0 | true | /api/settings \| /api/pos/bnpl/status?provider=${bnplProvider.toLowerCase()}&sessionId=${bnplOrderId} \| /api/warehouses \| /api/settings/currencies \| /api/customers \| /api/products \| /api/customers?type=0 \| /api/coupons/validate \| /api/pos/bnpl \| /api/crm/whatsapp \| /api/sales \| /api/sales?id=${inv.id} |  | src/app\(dashboard)\sales\page.tsx |
| /sales-returns | 4 | 4 | 0 | false | /api/sales-returns \| /api/warehouses \| /api/sales?invoiceNo=${searchInvoiceNo} |  | src/app\(dashboard)\sales-returns\page.tsx |
| /sales/analytics | 2 | 1 | 0 | false |  |  | src/app\(dashboard)\sales\analytics\page.tsx |
| /sales/atp-simulator | 3 | 0 | 2 | false | /api/sales/atp/check |  | src/app\(dashboard)\sales\atp-simulator\page.tsx |
| /sales/cash-application | 7 | 1 | 0 | false |  |  | src/app\(dashboard)\sales\cash-application\page.tsx |
| /sales/commissions | 2 | 2 | 0 | false | /api/sales/commissions/rules \| /api/sales/commissions?month=${selectedMonth}&year=${selectedYear} \| /api/sales/commissions/calculate |  | src/app\(dashboard)\sales\commissions\page.tsx |
| /sales/cpq | 5 | 7 | 0 | false | /api/cpq |  | src/app\(dashboard)\sales\cpq\page.tsx |
| /sales/debit-notes | 4 | 4 | 0 | false | /api/sales \| /api/sales?invoiceNo=${searchInvoiceNo} |  | src/app\(dashboard)\sales\debit-notes\page.tsx |
| /sales/delivery-notes | 6 | 4 | 2 | false | /api/sales/delivery-notes \| /api/customers?type=0 \| /api/products |  | src/app\(dashboard)\sales\delivery-notes\page.tsx |
| /sales/forecast | 2 | 1 | 0 | false | /api/sales/forecast?period=${period} |  | src/app\(dashboard)\sales\forecast\page.tsx |
| /sales/options | 5 | 5 | 0 | false | /api/categories \| /api/settings |  | src/app\(dashboard)\sales\options\page.tsx |
| /sales/orders | 8 | 7 | 2 | false | /api/sales-orders \| /api/customers?type=0 \| /api/hr/employees \| /api/products \| /api/sales-orders/${id}/process |  | src/app\(dashboard)\sales\orders\page.tsx |
| /sales/orders/create | 5 | 4 | 2 | false | /api/customers?type=0 \| /api/products \| /api/sales-orders |  | src/app\(dashboard)\sales\orders\create\page.tsx |
| /sales/pricing | 8 | 4 | 4 | false | /api/sales/pricing \| /api/sales/pricing/calculate |  | src/app\(dashboard)\sales\pricing\page.tsx |
| /sales/returns/rma | 11 | 10 | 0 | false | /api/sales/returns \| /api/sales/returns/${id}/${action} |  | src/app\(dashboard)\sales\returns\rma\page.tsx |
| /sales/routes | 3 | 2 | 3 | false | /api/sales/routes \| /api/hr/employees |  | src/app\(dashboard)\sales\routes\page.tsx |
| /sales/statements | 5 | 1 | 0 | false | /api/sales/statements/bulk |  | src/app\(dashboard)\sales\statements\page.tsx |
| /sales/targets | 3 | 2 | 2 | false | /api/sales/targets?year=${year}&month=${month} \| /api/hr/employees \| /api/sales/targets |  | src/app\(dashboard)\sales\targets\page.tsx |
| /school | 3 | 2 | 2 | false | /api/school |  | src/app\(dashboard)\school\page.tsx |
| /school/attendance | 13 | 0 | 0 | false |  |  | src/app\(dashboard)\school\attendance\page.tsx |
| /school/dashboard | 10 | 0 | 0 | false |  |  | src/app\(dashboard)\school\dashboard\page.tsx |
| /school/exams | 7 | 0 | 0 | false |  |  | src/app\(dashboard)\school\exams\page.tsx |
| /school/schedule | 3 | 0 | 0 | false |  |  | src/app\(dashboard)\school\schedule\page.tsx |
| /school/stages | 5 | 0 | 0 | false |  |  | src/app\(dashboard)\school\stages\page.tsx |
| /school/transport | 6 | 0 | 0 | false |  |  | src/app\(dashboard)\school\transport\page.tsx |
| /scm | 3 | 0 | 0 | false |  |  | src/app\(dashboard)\scm\page.tsx |
| /settings | 13 | 13 | 0 | true | /api/settings/hidden_modules \| /api/users \| /api/branches \| /api/users?id=${u.id} \| /api/sales?action=delete_all \| /api/settings \| /api/settings/${key} \| /api/settings/upload-logo \| /api/settings/company_logo \| /api/settings/generate-keys \| /api/telegram/webhook?action=set \| /api/system/reset | /settings/roles | src/app\(dashboard)\settings\page.tsx |
| /settings/approvals | 6 | 7 | 1 | false | /api/settings/approvals \| /api/settings/approvals/${editId} \| /api/settings/approvals/${r.id} |  | src/app\(dashboard)\settings\approvals\page.tsx |
| /settings/bpm | 3 | 0 | 0 | false |  |  | src/app\(dashboard)\settings\bpm\page.tsx |
| /settings/company | 6 | 6 | 0 | false | /api/auth/login \| /api/settings \| /api/zatca?type=status \| https://namainvist.com/api/ice/desktop-register \| /api/settings/${key} \| /api/settings/upload-logo \| /api/zatca \| /api/settings/company_logo \| /api/settings/POS_TAX_ENABLED \| /api/settings/POS_TAX_INCLUSIVE |  | src/app\(dashboard)\settings\company\page.tsx |
| /settings/currencies | 6 | 7 | 1 | false | /api/settings/currencies \| /api/settings/currencies/${editId} \| /api/settings/currencies/${c.id} |  | src/app\(dashboard)\settings\currencies\page.tsx |
| /settings/custom-fields | 4 | 3 | 1 | false | /api/settings/custom-fields?entity=${selectedEntity} \| /api/settings/custom-fields |  | src/app\(dashboard)\settings\custom-fields\page.tsx |
| /settings/dashboard-builder | 4 | 4 | 0 | false | /api/system/dashboard-builder?view=defaults \| /api/system/dashboard-builder |  | src/app\(dashboard)\settings\dashboard-builder\page.tsx |
| /settings/import-export | 9 | 9 | 0 | false | /api/system/import-export |  | src/app\(dashboard)\settings\import-export\page.tsx |
| /settings/number-sequences | 4 | 3 | 1 | false | /api/settings/number-sequences | /settings | src/app\(dashboard)\settings\number-sequences\page.tsx |
| /settings/print-templates | 1 | 1 | 0 | false | /api/system/print-templates?model=${model} |  | src/app\(dashboard)\settings\print-templates\page.tsx |
| /settings/roles | 5 | 5 | 0 | true | /api/settings/roles |  | src/app\(dashboard)\settings\roles\page.tsx |
| /settings/sso | 9 | 8 | 2 | false | /api/auth/sso |  | src/app\(dashboard)\settings\sso\page.tsx |
| /settings/webhooks | 12 | 11 | 2 | false | /api/webhooks \| /api/webhooks/${sub.id} \| /api/webhooks/${sub.id}/rotate-secret |  | src/app\(dashboard)\settings\webhooks\page.tsx |
| /settings/workflow-builder | 5 | 8 | 0 | false | /api/system/workflow |  | src/app\(dashboard)\settings\workflow-builder\page.tsx |
| /settings/zatca | 3 | 3 | 0 | false |  |  | src/app\(dashboard)\settings\zatca\page.tsx |
| /shifts | 9 | 11 | 2 | false | /api/shifts \| /api/shifts?id=${s.id} |  | src/app\(dashboard)\shifts\page.tsx |
| /shipping | 2 | 2 | 0 | false | /api/shipping?view=shipments \| /api/shipping |  | src/app\(dashboard)\shipping\page.tsx |
| /shl/classes | 1 | 0 | 0 | false | /api/shl/classes |  | src/app\(dashboard)\shl\classes\page.tsx |
| /shl/students | 1 | 0 | 0 | false | /api/shl/students |  | src/app\(dashboard)\shl\students\page.tsx |
| /shopfloor | 9 | 7 | 4 | false | /api/manufacturing/shopfloor?action=active \| /api/manufacturing/shopfloor?action=andon \| /api/manufacturing/shopfloor |  | src/app\(dashboard)\shopfloor\page.tsx |
| /smart-transfers | 5 | 4 | 2 | false | /api/products?limit=5000 \| /api/warehouses \| /api/smart-transfers |  | src/app\(dashboard)\smart-transfers\page.tsx |
| /stock | 2 | 2 | 0 | false | /api/products \| /api/stock-movements \| /api/product-stocks/location |  | src/app\(dashboard)\stock\page.tsx |
| /stock-transfers | 0 | 1 | 0 | false | /api/stock-transfers \| /api/products |  | src/app\(dashboard)\stock-transfers\page.tsx |
| /stock/adjustments | 3 | 2 | 2 | false | /api/stock/adjustments \| /api/products |  | src/app\(dashboard)\stock\adjustments\page.tsx |
| /stock/movements | 1 | 1 | 0 | false | /api/stock/movements |  | src/app\(dashboard)\stock\movements\page.tsx |
| /stocktake | 4 | 5 | 0 | false | /api/stocktake \| /api/products |  | src/app\(dashboard)\stocktake\page.tsx |
| /stocktake/vision | 5 | 6 | 0 | false | /api/stocktake/vision |  | src/app\(dashboard)\stocktake\vision\page.tsx |
| /subscriptions | 4 | 0 | 0 | false |  | /subscriptions/plans | src/app\(dashboard)\subscriptions\page.tsx |
| /subscriptions/plans | 5 | 4 | 2 | false | /api/subscriptions/plans |  | src/app\(dashboard)\subscriptions\plans\page.tsx |
| /supply-chain/rfx-auction | 9 | 7 | 0 | false | /api/supply-chain/rfx-auction |  | src/app\(dashboard)\supply-chain\rfx-auction\page.tsx |
| /supply-chain/vendor-onboarding | 9 | 7 | 0 | false | /api/supply-chain/vendor-onboarding |  | src/app\(dashboard)\supply-chain\vendor-onboarding\page.tsx |
| /sys/alerts | 1 | 0 | 0 | false | /api/sys/alerts |  | src/app\(dashboard)\sys\alerts\page.tsx |
| /sys/health | 1 | 1 | 0 | false | /api/sys/health |  | src/app\(dashboard)\sys\health\page.tsx |
| /tax | 3 | 0 | 0 | false |  | /tax/vat-returns | src/app\(dashboard)\tax\page.tsx |
| /tax/vat-returns | 2 | 0 | 0 | false |  |  | src/app\(dashboard)\tax\vat-returns\page.tsx |
| /tax/wht | 1 | 0 | 0 | false |  |  | src/app\(dashboard)\tax\wht\page.tsx |
| /tax/zakat | 2 | 2 | 0 | false | /api/zakat/assessments \| /api/accounting/fiscal-years \| /api/zakat/assessments/${id}/finalize |  | src/app\(dashboard)\tax\zakat\page.tsx |
| /tax/zatca-onboard | 4 | 0 | 0 | false |  |  | src/app\(dashboard)\tax\zatca-onboard\page.tsx |
| /treasury/bank-recon | 4 | 2 | 0 | false | /api/treasury/bank-recon |  | src/app\(dashboard)\treasury\bank-recon\page.tsx |
| /treasury/bank-reconciliation | 3 | 3 | 2 | false | /api/accounting/accounts \| /api/finance/reconciliations \| /api/finance/reconciliations/${session.reconciliation.id} |  | src/app\(dashboard)\treasury\bank-reconciliation\page.tsx |
| /treasury/cash-flow | 1 | 0 | 0 | false |  |  | src/app\(dashboard)\treasury\cash-flow\page.tsx |
| /treasury/cash-position | 2 | 2 | 0 | false | /api/treasury/cash-position \| /api/treasury/cash-position/snapshot |  | src/app\(dashboard)\treasury\cash-position\page.tsx |
| /treasury/checks | 9 | 8 | 2 | false | /api/finance/checks?type=${tab} \| /api/finance/checks \| /api/finance/checks/${id}/process |  | src/app\(dashboard)\treasury\checks\page.tsx |
| /treasury/liquidity | 3 | 2 | 0 | false | /api/treasury/liquidity/forecast \| /api/treasury/liquidity/forecast/generate |  | src/app\(dashboard)\treasury\liquidity\page.tsx |
| /treasury/petty-cash | 5 | 0 | 0 | false |  | /treasury | src/app\(dashboard)\treasury\petty-cash\page.tsx |
| /v3/clinic | 2 | 0 | 0 | false |  |  | src/app\(dashboard)\v3\clinic\page.tsx |
| /v3/clinic/appointments | 3 | 0 | 0 | false | /api/v3/clinic/appointments |  | src/app\(dashboard)\v3\clinic\appointments\page.tsx |
| /v3/clinic/emr | 5 | 1 | 0 | false | /api/v3/clinic/emr |  | src/app\(dashboard)\v3\clinic\emr\page.tsx |
| /v3/clinic/erx | 3 | 0 | 0 | false | /api/v3/clinic/erx |  | src/app\(dashboard)\v3\clinic\erx\page.tsx |
| /v3/clinic/lab | 3 | 0 | 0 | false | /api/v3/clinic/lab |  | src/app\(dashboard)\v3\clinic\lab\page.tsx |
| /v3/construction | 2 | 0 | 0 | false |  |  | src/app\(dashboard)\v3\construction\page.tsx |
| /v3/construction/boq | 4 | 1 | 0 | false | /api/v3/construction/boq |  | src/app\(dashboard)\v3\construction\boq\page.tsx |
| /v3/construction/progress-billing | 3 | 0 | 0 | false | /api/v3/construction/progress-billing |  | src/app\(dashboard)\v3\construction\progress-billing\page.tsx |
| /v3/construction/variations | 3 | 0 | 0 | false | /api/v3/construction/variations |  | src/app\(dashboard)\v3\construction\variations\page.tsx |
| /v3/distribution | 2 | 0 | 0 | false |  |  | src/app\(dashboard)\v3\distribution\page.tsx |
| /v3/distribution/picking/wave | 3 | 0 | 0 | false | /api/v3/distribution/picking/wave |  | src/app\(dashboard)\v3\distribution\picking\wave\page.tsx |
| /v3/distribution/routes | 3 | 0 | 0 | false | /api/v3/distribution/routes |  | src/app\(dashboard)\v3\distribution\routes\page.tsx |
| /v3/distribution/wms | 4 | 1 | 0 | false | /api/v3/distribution/wms |  | src/app\(dashboard)\v3\distribution\wms\page.tsx |
| /v3/manufacturing | 2 | 0 | 0 | false |  |  | src/app\(dashboard)\v3\manufacturing\page.tsx |
| /v3/manufacturing/mrp | 5 | 1 | 0 | false | /api/v3/manufacturing/mrp |  | src/app\(dashboard)\v3\manufacturing\mrp\page.tsx |
| /v3/manufacturing/shopfloor | 3 | 0 | 0 | false | /api/v3/manufacturing/shopfloor |  | src/app\(dashboard)\v3\manufacturing\shopfloor\page.tsx |
| /v3/master | 1 | 0 | 0 | false | /api/v3/retail/pos \| /api/v3/restaurant/kds \| /api/v3/manufacturing/mrp \| /api/v3/construction/boq | # | src/app\(dashboard)\v3\master\page.tsx |
| /v3/realestate | 2 | 0 | 0 | false |  |  | src/app\(dashboard)\v3\realestate\page.tsx |
| /v3/realestate/cam | 3 | 0 | 0 | false |  |  | src/app\(dashboard)\v3\realestate\cam\page.tsx |
| /v3/realestate/leases | 4 | 1 | 0 | false | /api/v3/realestate/leases |  | src/app\(dashboard)\v3\realestate\leases\page.tsx |
| /v3/restaurant | 2 | 0 | 0 | false |  |  | src/app\(dashboard)\v3\restaurant\page.tsx |
| /v3/restaurant/kds | 2 | 2 | 0 | false | /api/pos/restaurant/kds |  | src/app\(dashboard)\v3\restaurant\kds\page.tsx |
| /v3/restaurant/tables | 6 | 2 | 0 | false | /api/restaurant/pos/status \| /api/restaurant/pos/resolve |  | src/app\(dashboard)\v3\restaurant\tables\page.tsx |
| /v3/retail | 2 | 0 | 0 | false |  |  | src/app\(dashboard)\v3\retail\page.tsx |
| /v3/retail/loyalty | 4 | 0 | 0 | false |  |  | src/app\(dashboard)\v3\retail\loyalty\page.tsx |
| /v3/retail/pos | 7 | 1 | 0 | false | /api/v3/retail/pos |  | src/app\(dashboard)\v3\retail\pos\page.tsx |
| /v3/school | 2 | 0 | 0 | false |  |  | src/app\(dashboard)\v3\school\page.tsx |
| /v3/school/gradebook | 1 | 0 | 0 | false |  |  | src/app\(dashboard)\v3\school\gradebook\page.tsx |
| /v3/school/sis | 5 | 1 | 0 | false | /api/v3/school/sis |  | src/app\(dashboard)\v3\school\sis\page.tsx |
| /v3/school/transcripts | 2 | 0 | 0 | false |  |  | src/app\(dashboard)\v3\school\transcripts\page.tsx |
| /v3/services | 2 | 0 | 0 | false |  |  | src/app\(dashboard)\v3\services\page.tsx |
| /v3/services/sla | 1 | 0 | 0 | false |  |  | src/app\(dashboard)\v3\services\sla\page.tsx |
| /v3/services/timesheet | 3 | 0 | 0 | false |  |  | src/app\(dashboard)\v3\services\timesheet\page.tsx |
| /v3/services/workorders | 3 | 0 | 0 | false |  |  | src/app\(dashboard)\v3\services\workorders\page.tsx |
| /vacations | 5 | 5 | 0 | false | /api/vacations \| /api/employees |  | src/app\(dashboard)\vacations\page.tsx |
| /vat | 3 | 1 | 0 | false | /api/vat | # | src/app\(dashboard)\vat\page.tsx |
| /vendor-portal | 2 | 1 | 0 | false |  |  | src/app\(dashboard)\vendor-portal\page.tsx |
| /warehouses | 6 | 5 | 2 | false | /api/warehouses \| /api/branches \| /api/warehouses/analytics \| /api/warehouses/${currentWarehouse.id} \| /api/warehouses/${id} | /warehouses/alerts | src/app\(dashboard)\warehouses\page.tsx |
| /warehouses/alerts | 2 | 2 | 0 | false | /api/warehouses/analytics \| /api/procurement/auto-draft | /purchase-orders | src/app\(dashboard)\warehouses\alerts\page.tsx |
| /warehouses/fifo | 9 | 5 | 0 | false |  |  | src/app\(dashboard)\warehouses\fifo\page.tsx |
| /warehouses/map | 12 | 11 | 0 | false |  |  | src/app\(dashboard)\warehouses\map\page.tsx |
| /warehouses/options | 4 | 4 | 0 | false | /api/units \| /api/units?id=${id} \| /api/settings |  | src/app\(dashboard)\warehouses\options\page.tsx |
| /whatsapp-hub | 1 | 2 | 0 | false | /api/crm/whatsapp/sessions \| /api/crm/whatsapp/broadcast |  | src/app\(dashboard)\whatsapp-hub\page.tsx |
| /wht | 3 | 1 | 0 | false | /api/wht?period=${period} |  | src/app\(dashboard)\wht\page.tsx |
| /zakat | 2 | 1 | 0 | false | /api/zakat?year=${year} |  | src/app\(dashboard)\zakat\page.tsx |
| /zatca | 6 | 1 | 0 | false | /api/zatca |  | src/app\(dashboard)\zatca\page.tsx |

