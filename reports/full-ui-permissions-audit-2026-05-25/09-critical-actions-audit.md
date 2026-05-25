# Critical UI Actions Static Audit

This report flags pages with static code signals for destructive, financial, approval, export, ZATCA, period, or payment actions. It is not runtime proof; these pages need click-level browser testing.

## Counts
- Pages with critical action signals: 470

| route | riskSignals | buttons | onClicks | forms | fetches | file |
| --- | --- | --- | --- | --- | --- | --- |
| /_ice_archive | export | 0 | 0 | 0 |  | src/app\(dashboard)\_ice_archive\page.tsx |
| /accounting | delete, post, export, period | 18 | 21 | 0 | /api/accounting/accounts \| /api/accounting/cost-centers \| /api/accounting/fiscal-periods \| /api/accounting/governance-violations \| /api/accounting/journal \| /api/accounting/ledger?accountId=${accountId} \| /api/accounting/trial-balance \| /api/accounting/income-statement \| /api/accounting/balance-sheet \| /api/accounting/accounts/init \| /api/accounting/journal/${id} \| /api/accounting/reversal | src/app\(dashboard)\accounting\page.tsx |
| /accounting/aging-report | export | 3 | 3 | 0 | /api/finance/aging?type=${type}&date=${asOfDate} | src/app\(dashboard)\accounting\aging-report\page.tsx |
| /accounting/allocations/rules | save, export | 3 | 0 | 0 |  | src/app\(dashboard)\accounting\allocations\rules\page.tsx |
| /accounting/bank-reconciliation | export, period | 3 | 3 | 0 |  | src/app\(dashboard)\accounting\bank-reconciliation\page.tsx |
| /accounting/banks | delete, save, post, export, period | 6 | 7 | 2 | /api/banks \| /api/branches \| /api/banks/${id} | src/app\(dashboard)\accounting\banks\page.tsx |
| /accounting/banks/:id | save, post, export, period | 6 | 8 | 0 | /api/banks \| /api/banks/${params.id}/transactions | src/app\(dashboard)\accounting\banks\[id]\page.tsx |
| /accounting/banks/imports | post, export | 2 | 0 | 0 | /api/accounting/banks/imports | src/app\(dashboard)\accounting\banks\imports\page.tsx |
| /accounting/banks/recon | save, export, zatca, period, payment | 4 | 0 | 0 |  | src/app\(dashboard)\accounting\banks\recon\page.tsx |
| /accounting/collection-workflow | save, post, export, zatca, period, payment | 3 | 3 | 0 | /api/accounting/collection-workflow?tenantId=default \| /api/accounting/collection-workflow | src/app\(dashboard)\accounting\collection-workflow\page.tsx |
| /accounting/customer-statements | export, period | 0 | 0 | 0 |  | src/app\(dashboard)\accounting\customer-statements\page.tsx |
| /accounting/customer-statements/bulk | post, export, period | 3 | 3 | 0 | /api/accounting/customer-statements/templates \| /api/accounting/customer-statements/bulk/history \| /api/accounting/customer-statements/bulk/preview?segment=${segment} \| /api/accounting/customer-statements/bulk/run | src/app\(dashboard)\accounting\customer-statements\bulk\page.tsx |
| /accounting/customer-statements/templates | delete, save, post, export, zatca, period | 6 | 5 | 2 | /api/accounting/customer-statements/templates \| /api/accounting/customer-statements/templates/${id} | src/app\(dashboard)\accounting\customer-statements\templates\page.tsx |
| /accounting/deferred | save, post, export, zatca, period | 5 | 5 | 0 | /api/accounting/deferred \| /api/accounting/deferred?view=pending | src/app\(dashboard)\accounting\deferred\page.tsx |
| /accounting/dunning | export, zatca, period, payment | 3 | 0 | 0 |  | src/app\(dashboard)\accounting\dunning\page.tsx |
| /accounting/dunning/letters | export | 0 | 0 | 0 |  | src/app\(dashboard)\accounting\dunning\letters\page.tsx |
| /accounting/dunning/promises | export, payment | 0 | 0 | 0 |  | src/app\(dashboard)\accounting\dunning\promises\page.tsx |
| /accounting/financial-close | post, export, period | 0 | 1 | 0 | /api/accounting/financial-close?period=${period} \| /api/accounting/financial-close?period=${period}&view=progress \| /api/accounting/financial-close | src/app\(dashboard)\accounting\financial-close\page.tsx |
| /accounting/fixed-assets | export | 2 | 0 | 0 | /api/accounting/fixed-assets | src/app\(dashboard)\accounting\fixed-assets\page.tsx |
| /accounting/inter-company | export, payment | 0 | 0 | 0 | /api/accounting/inter-company?view=summary | src/app\(dashboard)\accounting\inter-company\page.tsx |
| /accounting/journal | post, export, period | 1 | 1 | 0 | /api/accounting/journal | src/app\(dashboard)\accounting\journal\page.tsx |
| /accounting/journal/new | delete, save, post, export, period | 3 | 2 | 2 | /api/accounting/journal | src/app\(dashboard)\accounting\journal\new\page.tsx |
| /accounting/lc | save, post, export, period | 3 | 3 | 0 | /api/accounting/lc | src/app\(dashboard)\accounting\lc\page.tsx |
| /accounting/leases | post, export, payment | 2 | 0 | 0 | /api/accounting/leases | src/app\(dashboard)\accounting\leases\page.tsx |
| /accounting/multi-book | post, export, zatca | 3 | 0 | 0 |  | src/app\(dashboard)\accounting\multi-book\page.tsx |
| /accounting/open-items | export, zatca, payment | 3 | 0 | 0 | /api/accounting/open-items | src/app\(dashboard)\accounting\open-items\page.tsx |
| /accounting/payment-runs | save, approve, export, zatca, period, payment | 4 | 0 | 0 |  | src/app\(dashboard)\accounting\payment-runs\page.tsx |
| /accounting/payment-runs/create | save, approve, export, zatca, period, payment | 5 | 2 | 2 |  | src/app\(dashboard)\accounting\payment-runs\create\page.tsx |
| /accounting/period-close | post, export, period, payment | 4 | 4 | 0 | /api/accounting/period-close | src/app\(dashboard)\accounting\period-close\page.tsx |
| /accounting/period-lock | post, export, period | 4 | 4 | 0 | /api/accounting/period-lock?tenantId=${tenantId} \| /api/accounting/period-lock | src/app\(dashboard)\accounting\period-lock\page.tsx |
| /accounting/prepayments | save, post, export, period, payment | 3 | 3 | 0 | /api/accounting/prepayments?tenantId=default&status=ACTIVE \| /api/accounting/prepayments | src/app\(dashboard)\accounting\prepayments\page.tsx |
| /accounting/profit-centers | save, post, export, period | 2 | 1 | 3 | /api/accounting/profit-centers | src/app\(dashboard)\accounting\profit-centers\page.tsx |
| /accounting/profit-loss | export, period | 2 | 2 | 0 | /api/accounting/profit-loss?tenantId=default&from=${from}&to=${to} | src/app\(dashboard)\accounting\profit-loss\page.tsx |
| /accounting/revenue-recognition | post, export | 2 | 0 | 0 | /api/accounting/revenue-recognition | src/app\(dashboard)\accounting\revenue-recognition\page.tsx |
| /accounting/segments | save, post, export, period | 2 | 1 | 3 | /api/accounting/segments | src/app\(dashboard)\accounting\segments\page.tsx |
| /accounting/trial-balance | delete, export, period | 1 | 2 | 0 | /api/accounting/trial-balance?${param.toString()} | src/app\(dashboard)\accounting\trial-balance\page.tsx |
| /accounting/vat-return | post, export, zatca, period, payment | 3 | 3 | 0 | /api/accounting/vat-return?tenantId=default&period=${period} \| /api/accounting/vat-return | src/app\(dashboard)\accounting\vat-return\page.tsx |
| /accounting/vendor-statements | export, zatca | 5 | 0 | 0 |  | src/app\(dashboard)\accounting\vendor-statements\page.tsx |
| /accounting/vendor-statements/bulk | export, zatca, period | 3 | 0 | 0 |  | src/app\(dashboard)\accounting\vendor-statements\bulk\page.tsx |
| /accounting/year-end-close | post, export, period | 5 | 0 | 0 |  | src/app\(dashboard)\accounting\year-end-close\page.tsx |
| /admin/bi-builder | save, post, export, zatca | 2 | 2 | 0 | /api/admin/bi/query | src/app\(dashboard)\admin\bi-builder\page.tsx |
| /admin/chains | save, export | 0 | 0 | 0 |  | src/app\(dashboard)\admin\chains\page.tsx |
| /admin/compliance | save, export, zatca | 0 | 0 | 0 | /api/admin/compliance | src/app\(dashboard)\admin\compliance\page.tsx |
| /admin/compliance-dashboard | save, post, export, period | 1 | 0 | 0 |  | src/app\(dashboard)\admin\compliance-dashboard\page.tsx |
| /admin/e2e-tester | save, post, export, zatca, period, payment | 1 | 1 | 0 | /api/admin/e2e-test | src/app\(dashboard)\admin\e2e-tester\page.tsx |
| /admin/feature-flags | save, export, period | 1 | 0 | 0 |  | src/app\(dashboard)\admin\feature-flags\page.tsx |
| /admin/grc | export, period | 3 | 0 | 0 |  | src/app\(dashboard)\admin\grc\page.tsx |
| /admin/grc/audit-log | export | 0 | 0 | 0 |  | src/app\(dashboard)\admin\grc\audit-log\page.tsx |
| /admin/grc/policies | export | 0 | 0 | 0 |  | src/app\(dashboard)\admin\grc\policies\page.tsx |
| /admin/grc/risks | export | 0 | 0 | 0 |  | src/app\(dashboard)\admin\grc\risks\page.tsx |
| /admin/knowledge | save, post, export, period | 1 | 0 | 2 | /api/admin/knowledge | src/app\(dashboard)\admin\knowledge\page.tsx |
| /admin/llm-costs | save, export | 0 | 0 | 0 | /api/admin/llm-costs | src/app\(dashboard)\admin\llm-costs\page.tsx |
| /admin/migration | export, period | 1 | 0 | 1 |  | src/app\(dashboard)\admin\migration\page.tsx |
| /admin/orchestration | save, approve, export, zatca, period | 0 | 0 | 0 | /api/admin/orchestration | src/app\(dashboard)\admin\orchestration\page.tsx |
| /admin/outbox | save, export, period | 1 | 1 | 0 | /api/admin/outbox/diagnostics | src/app\(dashboard)\admin\outbox\page.tsx |
| /admin/prompts | save, post, export, period | 1 | 0 | 2 | /api/admin/prompts | src/app\(dashboard)\admin\prompts\page.tsx |
| /admin/prompts/cost | export | 0 | 0 | 0 |  | src/app\(dashboard)\admin\prompts\cost\page.tsx |
| /admin/rag-cost | export | 1 | 0 | 0 |  | src/app\(dashboard)\admin\rag-cost\page.tsx |
| /admin/security/mfa-audit | export, period | 0 | 0 | 0 |  | src/app\(dashboard)\admin\security\mfa-audit\page.tsx |
| /admin/security/mfa-policy | save, export, period | 4 | 0 | 0 |  | src/app\(dashboard)\admin\security\mfa-policy\page.tsx |
| /admin/siem | delete, save, export, period | 6 | 6 | 0 | /api/admin/siem?${qs.toString()} | src/app\(dashboard)\admin\siem\page.tsx |
| /admin/sprint-progress | export | 0 | 0 | 0 |  | src/app\(dashboard)\admin\sprint-progress\page.tsx |
| /admin/stories | post, export | 1 | 0 | 0 |  | src/app\(dashboard)\admin\stories\page.tsx |
| /admin/test-coverage | export | 0 | 0 | 0 |  | src/app\(dashboard)\admin\test-coverage\page.tsx |
| /admin/training-compliance | export | 1 | 0 | 0 |  | src/app\(dashboard)\admin\training-compliance\page.tsx |
| /affiliates | export, zatca | 2 | 2 | 0 |  | src/app\(dashboard)\affiliates\page.tsx |
| /ai-auditor | export | 0 | 0 | 0 | /api/ai-auditor | src/app\(dashboard)\ai-auditor\page.tsx |
| /ai-bank | export | 1 | 1 | 0 | /api/ai/bank-reconciliation | src/app\(dashboard)\ai-bank\page.tsx |
| /ai-cfo | export | 4 | 0 | 0 |  | src/app\(dashboard)\ai-cfo\page.tsx |
| /ai-copilot | save, export | 7 | 3 | 2 |  | src/app\(dashboard)\ai-copilot\page.tsx |
| /ai-scm | export | 1 | 1 | 0 | /api/ai/predictive-scm | src/app\(dashboard)\ai-scm\page.tsx |
| /ai/bank-fraud | save, post, export, period, payment | 3 | 2 | 0 | /api/ai/bank-fraud | src/app\(dashboard)\ai\bank-fraud\page.tsx |
| /ai/demand-forecast | export, period | 0 | 0 | 0 | /api/ai/demand-forecast?productId=1 | src/app\(dashboard)\ai\demand-forecast\page.tsx |
| /ai/nlq | post, export | 1 | 1 | 0 | /api/ai/nlq | src/app\(dashboard)\ai\nlq\page.tsx |
| /ai/sales-coach | post, export, zatca, period | 0 | 0 | 0 | /api/ai/sales-coach | src/app\(dashboard)\ai\sales-coach\page.tsx |
| /ap/capture | delete, save, post, export, zatca, period | 30 | 18 | 4 | /api/ap/capture?status=${filter} \| /api/ap/capture \| /api/ap/capture?id=${activeCapture.id} | src/app\(dashboard)\ap\capture\page.tsx |
| /approvals | save, post, approve, export, period | 3 | 3 | 0 | /api/approvals \| /api/approvals/${stepId} | src/app\(dashboard)\approvals\page.tsx |
| /approvals/inbox | save, post, approve, export | 4 | 4 | 0 | /api/approvals/inbox?status=pending | src/app\(dashboard)\approvals\inbox\page.tsx |
| /assets | save, post, export, period | 4 | 4 | 0 | /api/assets \| /api/assets/depreciate | src/app\(dashboard)\assets\page.tsx |
| /attendance | post, export | 2 | 2 | 0 | /api/attendance \| /api/employees | src/app\(dashboard)\attendance\page.tsx |
| /audit-logs | delete, save, export, zatca | 2 | 1 | 0 |  | src/app\(dashboard)\audit-logs\page.tsx |
| /audit/field-trail | delete, save, post, export, zatca, period | 7 | 7 | 0 | /api/audit/field-trail?${p} | src/app\(dashboard)\audit\field-trail\page.tsx |
| /banks | export | 3 | 1 | 0 | /api/banks | src/app\(dashboard)\banks\page.tsx |
| /barcode | save, export, period | 4 | 5 | 0 | /api/products \| /api/settings \| /api/products/${selectedProduct.id} | src/app\(dashboard)\barcode\page.tsx |
| /batches | delete, save, post, export, period | 6 | 7 | 1 | /api/batches \| /api/products \| /api/batches/${id} | src/app\(dashboard)\batches\page.tsx |
| /bi/dashboard | export, payment | 0 | 0 | 0 | /api/bi/kpis | src/app\(dashboard)\bi\dashboard\page.tsx |
| /bookings | save, post, export, zatca, period | 8 | 8 | 0 | /api/bookings \| /api/customers \| /api/bookings/invoice | src/app\(dashboard)\bookings\page.tsx |
| /bookings/calendar | export, zatca | 4 | 4 | 0 | /api/bookings | src/app\(dashboard)\bookings\calendar\page.tsx |
| /branches | delete, save, post, export, zatca, period | 6 | 7 | 1 | /api/branches \| /api/branches?id=${b.id} | src/app\(dashboard)\branches\page.tsx |
| /calendar | export | 2 | 2 | 0 |  | src/app\(dashboard)\calendar\page.tsx |
| /clinic/appointments | save, post, export, period | 4 | 3 | 2 | /api/clinic/appointments?date=${selectedDate} \| /api/clinic/appointments | src/app\(dashboard)\clinic\appointments\page.tsx |
| /clinic/erx | delete, save, post, export, period | 7 | 6 | 0 | /api/clinic/erx | src/app\(dashboard)\clinic\erx\page.tsx |
| /clinic/lab | save, post, export, period | 8 | 8 | 2 | /api/clinic/lab | src/app\(dashboard)\clinic\lab\page.tsx |
| /cmms | save, post, export | 4 | 3 | 2 | /api/cmms/schedules | src/app\(dashboard)\cmms\page.tsx |
| /cmms/work-orders | save, post, export | 4 | 3 | 2 | /api/cmms/work-orders | src/app\(dashboard)\cmms\work-orders\page.tsx |
| /com/rules | export | 1 | 0 | 0 | /api/com/rules | src/app\(dashboard)\com\rules\page.tsx |
| /compliance/audits | save, post, export, period | 4 | 3 | 2 | /api/compliance/audits | src/app\(dashboard)\compliance\audits\page.tsx |
| /compliance/pdpl/breaches | delete, save, post, export, period, payment | 15 | 15 | 4 | /api/pdpl/breach?${qs.toString()} \| /api/pdpl/breach \| /api/pdpl/breach/${breach.id} | src/app\(dashboard)\compliance\pdpl\breaches\page.tsx |
| /compliance/pdpl/dsr | delete, save, post, approve, export, period, payment | 20 | 20 | 2 | /api/pdpl/dsr?${qs.toString()} \| /api/pdpl/dsr \| /api/pdpl/dsr/${dsr.id} \| /api/pdpl/dsr/${dsr.id}/fulfill | src/app\(dashboard)\compliance\pdpl\dsr\page.tsx |
| /compliance/risks | save, post, export | 5 | 4 | 2 | /api/compliance/risks | src/app\(dashboard)\compliance\risks\page.tsx |
| /contracts | export | 1 | 1 | 0 | /api/contracts?view=summary \| /api/contracts | src/app\(dashboard)\contracts\page.tsx |
| /contracts/templates | delete, save, post, export | 6 | 5 | 2 | /api/contracts/templates \| /api/contracts/templates?id=${id} | src/app\(dashboard)\contracts\templates\page.tsx |
| /copa | export | 0 | 0 | 0 | /api/copa | src/app\(dashboard)\copa\page.tsx |
| /coupons | delete, save, post, export, zatca, period | 9 | 12 | 1 | /api/coupons \| /api/coupons/${c.id} \| /api/coupons/${id} | src/app\(dashboard)\coupons\page.tsx |
| /cpq | export | 0 | 0 | 0 | /api/cpq | src/app\(dashboard)\cpq\page.tsx |
| /credit-check | export | 0 | 0 | 0 | /api/credit-check | src/app\(dashboard)\credit-check\page.tsx |
| /crm/campaigns | delete, save, post, export, period, payment | 6 | 5 | 3 | /api/crm/campaigns \| /api/crm/campaigns?id=${id} | src/app\(dashboard)\crm\campaigns\page.tsx |
| /crm/customer360 | export, zatca, payment | 1 | 1 | 0 | /api/crm/customer360?id=${customerId} | src/app\(dashboard)\crm\customer360\page.tsx |
| /crm/cx-nps | export | 0 | 0 | 0 |  | src/app\(dashboard)\crm\cx-nps\page.tsx |
| /crm/kanban | save, post, export | 0 | 0 | 0 | /api/system/kanban?preset=crm_leads \| /api/system/kanban | src/app\(dashboard)\crm\kanban\page.tsx |
| /crm/key-accounts | export | 0 | 0 | 0 |  | src/app\(dashboard)\crm\key-accounts\page.tsx |
| /crm/leads | save, post, export, period, payment | 5 | 4 | 2 | /api/crm/leads | src/app\(dashboard)\crm\leads\page.tsx |
| /crm/opportunities | save, post, export, period, payment | 5 | 3 | 6 | /api/crm/opportunities | src/app\(dashboard)\crm\opportunities\page.tsx |
| /crm/tickets | save, post, export, period | 7 | 7 | 3 | /api/crm/tickets${q} \| /api/crm/tickets | src/app\(dashboard)\crm\tickets\page.tsx |
| /customers | delete, save, post, export, period | 7 | 8 | 1 | /api/customers?${params} \| /api/sales/routes \| /api/customers/${id} \| /api/crm/whatsapp | src/app\(dashboard)\customers\page.tsx |
| /customers/:id | save, post, export | 2 | 1 | 0 | /api/customers/${(await params).id} \| /api/customers/${(await params).id}/credit \| /api/customers/${(await params).id}/hold | src/app\(dashboard)\customers\[id]\page.tsx |
| /dashboard | post, export, zatca, payment | 2 | 2 | 0 | /api/dashboard \| /api/ai-cfo | src/app\(dashboard)\dashboard\page.tsx |
| /dms | save, export | 2 | 2 | 0 |  | src/app\(dashboard)\dms\page.tsx |
| /docs | export | 0 | 0 | 0 |  | src/app\(dashboard)\docs\page.tsx |
| /docs/:slug | export | 1 | 0 | 0 | /api/docs/${(await params).slug} | src/app\(dashboard)\docs\[slug]\page.tsx |
| /documents | export | 0 | 0 | 0 | /api/documents | src/app\(dashboard)\documents\page.tsx |
| /ecommerce/dashboard | save, export, period, payment | 5 | 5 | 0 | /api/ecommerce/orders${q} \| /api/ecommerce/orders | src/app\(dashboard)\ecommerce\dashboard\page.tsx |
| /ecommerce/stores | save, post, export | 5 | 4 | 2 | /api/ecommerce/stores | src/app\(dashboard)\ecommerce\stores\page.tsx |
| /employees | delete, save, post, export, period | 6 | 5 | 2 | /api/employees \| /api/branches \| /api/employees/${id} | src/app\(dashboard)\employees\page.tsx |
| /enterprise/fleet | save, post, export, period | 4 | 4 | 0 | /api/enterprise/fleet | src/app\(dashboard)\enterprise\fleet\page.tsx |
| /enterprise/legal | save, post, export, period, payment | 7 | 6 | 2 | /api/enterprise/legal?type=${activeTab}&search=${search} \| /api/customers \| /api/banks \| /api/enterprise/legal | src/app\(dashboard)\enterprise\legal\page.tsx |
| /enterprise/mrp | save, post, export, period | 7 | 6 | 2 | /api/enterprise/mrp \| /api/manufacturing/recipes \| /api/stock | src/app\(dashboard)\enterprise\mrp\page.tsx |
| /enterprise/mrp/recipes | delete, save, post, export | 7 | 6 | 2 | /api/manufacturing/recipes \| /api/products | src/app\(dashboard)\enterprise\mrp\recipes\page.tsx |
| /enterprise/portfolio | export | 0 | 0 | 0 |  | src/app\(dashboard)\enterprise\portfolio\page.tsx |
| /enterprise/projects | delete, save, post, export, period | 8 | 6 | 2 | /api/enterprise/projects?search=${search} \| /api/customers \| /api/enterprise/projects \| /api/enterprise/projects?id=${id} | src/app\(dashboard)\enterprise\projects\page.tsx |
| /enterprise/projects/:id | save, post, export, period | 9 | 8 | 2 | /api/enterprise/projects/tasks?projectId=${id} \| /api/enterprise/projects/tasks | src/app\(dashboard)\enterprise\projects\[id]\page.tsx |
| /enterprise/projects/:id/gantt | export, period | 2 | 2 | 0 | /api/projects/advanced?projectId=${(await params).id} \| /api/projects/phases?projectId=${(await params).id} \| /api/projects/milestones?projectId=${(await params).id} \| /api/projects/risks?projectId=${(await params).id} \| /api/projects/resources?projectId=${(await params).id} | src/app\(dashboard)\enterprise\projects\[id]\gantt\page.tsx |
| /enterprise/projects/evm | export | 0 | 0 | 0 |  | src/app\(dashboard)\enterprise\projects\evm\page.tsx |
| /enterprise/property | save, post, export, period | 4 | 4 | 0 | /api/enterprise/property | src/app\(dashboard)\enterprise\property\page.tsx |
| /enterprise/quality | save, post, approve, export, period | 4 | 4 | 0 | /api/enterprise/quality | src/app\(dashboard)\enterprise\quality\page.tsx |
| /enterprise/quality-management | export, period | 1 | 1 | 0 | /api/manufacturing/quality-management | src/app\(dashboard)\enterprise\quality-management\page.tsx |
| /enterprise/wms | save, post, export | 9 | 11 | 2 | /api/enterprise/wms | src/app\(dashboard)\enterprise\wms\page.tsx |
| /esign | save, post, export, period | 4 | 3 | 2 | /api/esign | src/app\(dashboard)\esign\page.tsx |
| /events | save, post, export | 4 | 3 | 2 | /api/events | src/app\(dashboard)\events\page.tsx |
| /expenses | delete, save, post, export, period, payment | 7 | 8 | 1 | /api/expenses?${params} \| /api/accounting/cost-centers \| /api/expenses \| /api/expenses?id=${e.id} \| /api/expenses?all=true | src/app\(dashboard)\expenses\page.tsx |
| /field-service | save, post, export | 4 | 3 | 2 | /api/field-service/orders | src/app\(dashboard)\field-service\page.tsx |
| /finance/allocation | post, export, period | 1 | 1 | 0 | /api/finance/allocation | src/app\(dashboard)\finance\allocation\page.tsx |
| /finance/assets | save, post, export, period | 4 | 2 | 3 | /api/finance/assets | src/app\(dashboard)\finance\assets\page.tsx |
| /finance/bad-debt | post, approve, export, zatca, period, payment | 9 | 5 | 0 | /api/finance/bad-debt | src/app\(dashboard)\finance\bad-debt\page.tsx |
| /finance/balance-sheet | export | 0 | 0 | 0 | /api/finance/balance-sheet?asOfDate=${asOfDate} | src/app\(dashboard)\finance\balance-sheet\page.tsx |
| /finance/bank-recon/rules | delete, save, post, export, period | 6 | 5 | 2 | /api/finance/bank-recon/rules \| /api/finance/bank-recon/rules?id=${id} \| /api/finance/bank-recon/rules/simulate | src/app\(dashboard)\finance\bank-recon\rules\page.tsx |
| /finance/budget-control | post, approve, export, period | 2 | 2 | 0 | /api/finance/budget-control?year=${year} \| /api/finance/budget-control | src/app\(dashboard)\finance\budget-control\page.tsx |
| /finance/budget-control/variance | export | 0 | 0 | 0 | /api/finance/budget/variance | src/app\(dashboard)\finance\budget-control\variance\page.tsx |
| /finance/budget-planning | save, post, export, period | 4 | 2 | 2 | /api/finance/budget | src/app\(dashboard)\finance\budget-planning\page.tsx |
| /finance/budget-scenarios | delete, save, post, export, period | 6 | 5 | 3 | /api/budgets/scenarios \| /api/budgets/scenarios?id=${id} | src/app\(dashboard)\finance\budget-scenarios\page.tsx |
| /finance/cash-flow | post, export, period | 2 | 2 | 0 | /api/finance/cash-flow?action=latest \| /api/finance/cash-flow | src/app\(dashboard)\finance\cash-flow\page.tsx |
| /finance/cash-flow/forecast | save, post, export, period | 1 | 1 | 0 | /api/finance/cash-flow/forecast?weeks=${weeks} \| /api/finance/cash-flow/forecast | src/app\(dashboard)\finance\cash-flow\forecast\page.tsx |
| /finance/cfo | post, export | 2 | 2 | 0 | /api/finance/cfo-dashboard \| /api/finance/auto-ecl | src/app\(dashboard)\finance\cfo\page.tsx |
| /finance/cfo-ai | save, approve, export | 2 | 2 | 0 | /api/finance/cfo | src/app\(dashboard)\finance\cfo-ai\page.tsx |
| /finance/cfo-dashboard | save, export, period | 5 | 5 | 0 | /api/finance/cfo-dashboard | src/app\(dashboard)\finance\cfo-dashboard\page.tsx |
| /finance/consolidation | save, post, export, period | 6 | 6 | 0 | /api/finance/consolidation \| /api/finance/consolidation?action=summary&runId=${runId} | src/app\(dashboard)\finance\consolidation\page.tsx |
| /finance/consolidation/elimination | save, post, export, period, payment | 1 | 1 | 0 | /api/finance/consolidation/elimination | src/app\(dashboard)\finance\consolidation\elimination\page.tsx |
| /finance/copa | export, zatca, period | 2 | 2 | 0 | /api/copa?${params} | src/app\(dashboard)\finance\copa\page.tsx |
| /finance/copa/rules | save, post, export, period | 3 | 3 | 0 | /api/copa/allocations | src/app\(dashboard)\finance\copa\rules\page.tsx |
| /finance/credit-check | save, post, export, zatca, period | 6 | 9 | 0 | /api/credit-check?action=at-risk&threshold=${threshold} \| /api/credit-check?customerId=${id} \| /api/credit-check | src/app\(dashboard)\finance\credit-check\page.tsx |
| /finance/deferred-tax | export, period | 1 | 1 | 0 | /api/finance/deferred-tax?date=${asOfDate}&rate=${taxRate / 100} | src/app\(dashboard)\finance\deferred-tax\page.tsx |
| /finance/ecl | post, export | 1 | 1 | 0 | /api/finance/ecl | src/app\(dashboard)\finance\ecl\page.tsx |
| /finance/financial-health | export | 1 | 1 | 0 | /api/finance/financial-health?tenantId=default | src/app\(dashboard)\finance\financial-health\page.tsx |
| /finance/fx-revaluation | post, export, period | 1 | 1 | 0 | /api/finance/fx-revaluation | src/app\(dashboard)\finance\fx-revaluation\page.tsx |
| /finance/impairment | export, period | 1 | 1 | 0 | /api/finance/impairment?date=${asOfDate} | src/app\(dashboard)\finance\impairment\page.tsx |
| /finance/payment-run | save, post, approve, export, period, payment | 9 | 8 | 2 | /api/finance/payment-run \| /api/finance/payment-run/propose \| /api/finance/payment-run/${id}/${action} | src/app\(dashboard)\finance\payment-run\page.tsx |
| /finance/period-close | save, post, export, period | 4 | 3 | 0 | /api/finance/period-close?periodId=${periodId} \| /api/finance/period-close \| /api/finance/period-close/${id}/step | src/app\(dashboard)\finance\period-close\page.tsx |
| /finance/rebates | save, post, export, period | 4 | 4 | 0 | /api/rebates | src/app\(dashboard)\finance\rebates\page.tsx |
| /finance/transfer-pricing | post, export, zatca, period | 1 | 1 | 0 | /api/finance/transfer-pricing?date=${asOfDate}&min=${minMarkup / 100}&max=${maxMarkup / 100} | src/app\(dashboard)\finance\transfer-pricing\page.tsx |
| /finance/variance | save, post, export | 1 | 1 | 0 | /api/finance/variance | src/app\(dashboard)\finance\variance\page.tsx |
| /finance/vat/categories | save, post, approve, export, zatca, period, payment | 9 | 9 | 0 | /api/vat/categories \| /api/vat/categories?${qs.toString()} | src/app\(dashboard)\finance\vat\categories\page.tsx |
| /finance/wht | post, export, zatca, payment | 1 | 1 | 0 | /api/finance/wht | src/app\(dashboard)\finance\wht\page.tsx |
| /finance/wht/form14 | delete, save, post, approve, export, zatca, period | 11 | 11 | 0 | /api/wht/form14 \| /api/wht/form14/generate \| /api/wht/form14?period=${period} | src/app\(dashboard)\finance\wht\form14\page.tsx |
| /fiscal-periods | post, export, period | 3 | 3 | 0 | /api/fiscal-periods | src/app\(dashboard)\fiscal-periods\page.tsx |
| /fixed-assets | delete, save, post, export, period | 10 | 13 | 1 | /api/fixed-assets \| /api/fixed-assets/${id} \| /api/fixed-assets/${id}/depreciate | src/app\(dashboard)\fixed-assets\page.tsx |
| /fleet | export | 1 | 1 | 0 | /api/fleet/advanced?view=dashboard | src/app\(dashboard)\fleet\page.tsx |
| /fleet/fuel | export | 1 | 0 | 0 | /api/fleet/fuel | src/app\(dashboard)\fleet\fuel\page.tsx |
| /fleet/maintenance | export | 1 | 0 | 0 | /api/fleet/maintenance | src/app\(dashboard)\fleet\maintenance\page.tsx |
| /fleet/tracking | export | 0 | 0 | 0 |  | src/app\(dashboard)\fleet\tracking\page.tsx |
| /fleet/trips | export | 1 | 0 | 0 | /api/fleet/trips | src/app\(dashboard)\fleet\trips\page.tsx |
| /fng/allocations | export | 3 | 0 | 0 |  | src/app\(dashboard)\fng\allocations\page.tsx |
| /fng/budgets | approve, export, period | 3 | 0 | 0 |  | src/app\(dashboard)\fng\budgets\page.tsx |
| /fng/petty-cash-funds | delete, save, post, export | 6 | 5 | 2 | /api/fng/petty-cash-funds \| /api/employees \| /api/fng/petty-cash-funds?id=${id} | src/app\(dashboard)\fng\petty-cash-funds\page.tsx |
| /fsm | export, period | 1 | 0 | 0 | /api/fsm/tickets | src/app\(dashboard)\fsm\page.tsx |
| /fsm/dispatch | save, export | 0 | 0 | 0 | /api/fsm/tickets | src/app\(dashboard)\fsm\dispatch\page.tsx |
| /fsm/tasks | post, export, period | 2 | 1 | 0 | /api/fsm/tickets \| /api/fsm/complete | src/app\(dashboard)\fsm\tasks\page.tsx |
| /fx | export | 3 | 1 | 0 | /api/fx | src/app\(dashboard)\fx\page.tsx |
| /gift-cards | save, export, period | 4 | 0 | 0 |  | src/app\(dashboard)\gift-cards\page.tsx |
| /hr | save, post, approve, export | 3 | 0 | 0 |  | src/app\(dashboard)\hr\page.tsx |
| /hr/ai-enrollment | save, export, period | 4 | 4 | 0 | /api/employees | src/app\(dashboard)\hr\ai-enrollment\page.tsx |
| /hr/attendance | post, export, period | 2 | 2 | 0 | /api/hr/attendance \| /api/employees | src/app\(dashboard)\hr\attendance\page.tsx |
| /hr/documents | save, post, export, period | 6 | 6 | 0 | /api/hr/documents/expiry \| /api/hr/documents/expiry/${renewModal.alertId} \| /api/hr/documents/expiry/${alertId} | src/app\(dashboard)\hr\documents\page.tsx |
| /hr/eos | post, approve, export, period, payment | 4 | 4 | 0 | /api/hr/eos \| /api/hr/eos/${id} | src/app\(dashboard)\hr\eos\page.tsx |
| /hr/evaluations | save, post, export, period | 4 | 3 | 3 | /api/hr/evaluations \| /api/employees | src/app\(dashboard)\hr\evaluations\page.tsx |
| /hr/expense-reports | delete, save, post, approve, export | 7 | 7 | 0 | /api/hr/expense-reports | src/app\(dashboard)\hr\expense-reports\page.tsx |
| /hr/gosi | save, post, export, payment | 1 | 1 | 0 | /api/hr/gosi?year=${year} \| /api/hr/gosi | src/app\(dashboard)\hr\gosi\page.tsx |
| /hr/jobs | post, export, period | 3 | 3 | 0 | /api/hr/jobs | src/app\(dashboard)\hr\jobs\page.tsx |
| /hr/leaves | save, post, approve, export, period | 6 | 6 | 0 | /api/hr/leaves?${params} \| /api/hr/leaves \| /api/hr/leaves/${id} \| /api/hr/leaves/accrual | src/app\(dashboard)\hr\leaves\page.tsx |
| /hr/loans | save, post, export, period | 3 | 2 | 3 | /api/hr/loans \| /api/employees | src/app\(dashboard)\hr\loans\page.tsx |
| /hr/mudad | delete, save, post, export, period, payment | 11 | 11 | 0 | /api/hr/mudad/compliance?view=dashboard \| /api/hr/mudad/compliance \| /api/hr/mudad/compliance?view=report&month=${reportMonth} | src/app\(dashboard)\hr\mudad\page.tsx |
| /hr/nitaqat-simulator | post, export, period | 7 | 7 | 0 | /api/saudi/nitaqat/projection | src/app\(dashboard)\hr\nitaqat-simulator\page.tsx |
| /hr/org-chart | export | 0 | 0 | 0 | /api/hr/employees?limit=200 | src/app\(dashboard)\hr\org-chart\page.tsx |
| /hr/payroll-process | delete, save, post, export, zatca, period, payment | 5 | 4 | 2 | /api/employees \| /api/payroll/calculate \| /api/payroll | src/app\(dashboard)\hr\payroll-process\page.tsx |
| /hr/payroll/config | save, post, export, period, payment | 1 | 0 | 2 | /api/hr/payroll/config | src/app\(dashboard)\hr\payroll\config\page.tsx |
| /hr/payroll/run | post, export, payment | 1 | 1 | 0 | /api/hr/payroll/run?month=${month}&year=${year} \| /api/hr/payroll/run | src/app\(dashboard)\hr\payroll\run\page.tsx |
| /hr/payslip/:id | save, export, zatca, period, payment | 2 | 2 | 0 | /api/payroll/${id} | src/app\(dashboard)\hr\payslip\[id]\page.tsx |
| /hr/performance | save, post, export, period | 3 | 2 | 3 | /api/hr/performance | src/app\(dashboard)\hr\performance\page.tsx |
| /hr/qiwa | post, export, period | 3 | 3 | 0 | /api/hr/qiwa \| /api/saudi/qiwa/sync | src/app\(dashboard)\hr\qiwa\page.tsx |
| /hr/qiwa/contracts | delete, save, post, export, period, payment | 11 | 10 | 2 | /api/hr/qiwa/contracts?${qs.toString()} \| /api/hr/qiwa/contracts | src/app\(dashboard)\hr\qiwa\contracts\page.tsx |
| /hr/recruitment | approve, export | 0 | 1 | 0 | /api/hr/recruitment \| /api/hr/recruitment?jobId=${jobId} | src/app\(dashboard)\hr\recruitment\page.tsx |
| /hr/saudization | save, post, export, period | 4 | 4 | 0 | /api/saudi/saudization/snapshot | src/app\(dashboard)\hr\saudization\page.tsx |
| /hr/self-service | save, approve, export, zatca, period, payment | 11 | 9 | 0 |  | src/app\(dashboard)\hr\self-service\page.tsx |
| /hr/succession | export | 1 | 11 | 0 | /api/hr/succession | src/app\(dashboard)\hr\succession\page.tsx |
| /hr/timesheet | save, export | 2 | 0 | 0 | /api/hr/timesheet?employeeId=1&weekStart=${weekStart.toISOString().split( | src/app\(dashboard)\hr\timesheet\page.tsx |
| /hr/training | save, post, export, period | 4 | 3 | 3 | /api/hr/training | src/app\(dashboard)\hr\training\page.tsx |
| /hr/wps | save, post, approve, export, period, payment | 8 | 9 | 2 | /api/hr/wps | src/app\(dashboard)\hr\wps\page.tsx |
| /installments | export, payment | 0 | 1 | 0 | /api/installments | src/app\(dashboard)\installments\page.tsx |
| /inv/serials | save, export | 1 | 0 | 0 | /api/inv/serials | src/app\(dashboard)\inv\serials\page.tsx |
| /inventory/abc-analysis | save, post, export, period | 1 | 1 | 0 | /api/inventory/abc-analysis?period=${period} \| /api/inventory/abc-analysis | src/app\(dashboard)\inventory\abc-analysis\page.tsx |
| /inventory/ai-vision | save, post, export, period | 3 | 2 | 0 | /api/inventory/ai-vision | src/app\(dashboard)\inventory\ai-vision\page.tsx |
| /inventory/delivery-notes | save, export, zatca | 5 | 1 | 0 | /api/shipments/delivery-notes | src/app\(dashboard)\inventory\delivery-notes\page.tsx |
| /inventory/movements | export | 1 | 0 | 0 |  | src/app\(dashboard)\inventory\movements\page.tsx |
| /inventory/picking/:id | save, export | 1 | 1 | 0 | /api/inventory/picking/${(await params).id} | src/app\(dashboard)\inventory\picking\[id]\page.tsx |
| /inventory/quality-control | save, post, export | 4 | 4 | 0 | /api/inventory/quality-control | src/app\(dashboard)\inventory\quality-control\page.tsx |
| /inventory/reorder-rules | save, export | 3 | 2 | 0 | /api/inventory/reorder-rules \| /api/inventory/reorder-rules?view=alerts | src/app\(dashboard)\inventory\reorder-rules\page.tsx |
| /inventory/stocktake/cycle | save, post, approve, export | 3 | 2 | 0 | /api/inventory/stocktake \| /api/cron/cycle-count \| /api/inventory/stocktake/${id}/approve | src/app\(dashboard)\inventory\stocktake\cycle\page.tsx |
| /inventory/traceability | export, zatca, period | 1 | 1 | 0 |  | src/app\(dashboard)\inventory\traceability\page.tsx |
| /inventory/wms | export, payment | 2 | 0 | 0 |  | src/app\(dashboard)\inventory\wms\page.tsx |
| /inventory/wms/putaway | delete, save, export | 3 | 0 | 0 |  | src/app\(dashboard)\inventory\wms\putaway\page.tsx |
| /inventory/zones | save, export | 3 | 0 | 0 |  | src/app\(dashboard)\inventory\zones\page.tsx |
| /knowledge/articles | save, post, export | 4 | 4 | 2 | /api/knowledge/articles | src/app\(dashboard)\knowledge\articles\page.tsx |
| /learn | export, zatca, payment | 2 | 0 | 0 |  | src/app\(dashboard)\learn\page.tsx |
| /lms/courses | save, post, export | 4 | 3 | 2 | /api/lms/courses | src/app\(dashboard)\lms\courses\page.tsx |
| /logistics/carriers | save, post, export | 4 | 3 | 2 | /api/logistics/carriers | src/app\(dashboard)\logistics\carriers\page.tsx |
| /logistics/freight | save, post, export | 4 | 3 | 2 | /api/logistics/freight | src/app\(dashboard)\logistics\freight\page.tsx |
| /loyalty | save, post, export, zatca, period | 7 | 11 | 0 | /api/loyalty \| /api/settings \| /api/loyalty/${l.customerId}/transactions | src/app\(dashboard)\loyalty\page.tsx |
| /maintenance | save, post, export, period | 6 | 6 | 0 | /api/maintenance | src/app\(dashboard)\maintenance\page.tsx |
| /maintenance/preventive | export | 0 | 0 | 0 | /api/maintenance/preventive | src/app\(dashboard)\maintenance\preventive\page.tsx |
| /manufacturing | export | 2 | 0 | 0 | /api/manufacturing/stats | src/app\(dashboard)\manufacturing\page.tsx |
| /manufacturing/aps | export | 0 | 0 | 0 |  | src/app\(dashboard)\manufacturing\aps\page.tsx |
| /manufacturing/blockchain-trace | post, export, period | 1 | 1 | 0 |  | src/app\(dashboard)\manufacturing\blockchain-trace\page.tsx |
| /manufacturing/bom | delete, save, post, approve, export, period | 8 | 9 | 0 | /api/manufacturing/bom \| /api/products | src/app\(dashboard)\manufacturing\bom\page.tsx |
| /manufacturing/boms | save, export | 2 | 0 | 0 |  | src/app\(dashboard)\manufacturing\boms\page.tsx |
| /manufacturing/boms/:id/versions | save, post, export, period | 6 | 5 | 2 | /api/manufacturing/boms/${resolvedId}/versions \| /api/manufacturing/boms/versions/${versionId}/activate | src/app\(dashboard)\manufacturing\boms\[id]\versions\page.tsx |
| /manufacturing/capa | save, post, export, period | 7 | 5 | 4 | /api/manufacturing/capa \| /api/manufacturing/quality-control | src/app\(dashboard)\manufacturing\capa\page.tsx |
| /manufacturing/capacity | save, export | 0 | 0 | 0 | /api/manufacturing/capacity | src/app\(dashboard)\manufacturing\capacity\page.tsx |
| /manufacturing/digital-twin | post, export, period | 2 | 1 | 0 | /api/manufacturing/digital-twin | src/app\(dashboard)\manufacturing\digital-twin\page.tsx |
| /manufacturing/labor-efficiency | export, period | 0 | 0 | 0 | /api/manufacturing/labor-efficiency | src/app\(dashboard)\manufacturing\labor-efficiency\page.tsx |
| /manufacturing/lean-kanban | save, post, export, period | 2 | 2 | 0 | /api/manufacturing/kanban | src/app\(dashboard)\manufacturing\lean-kanban\page.tsx |
| /manufacturing/mes-oee | export | 1 | 1 | 0 | /api/manufacturing/mes-oee | src/app\(dashboard)\manufacturing\mes-oee\page.tsx |
| /manufacturing/mrp-dashboard | save, export, period | 7 | 5 | 2 |  | src/app\(dashboard)\manufacturing\mrp-dashboard\page.tsx |
| /manufacturing/mrp-engine | export | 3 | 1 | 0 | /api/manufacturing/mrp-run | src/app\(dashboard)\manufacturing\mrp-engine\page.tsx |
| /manufacturing/oee | export, period | 0 | 0 | 0 |  | src/app\(dashboard)\manufacturing\oee\page.tsx |
| /manufacturing/orders | save, export, period | 2 | 0 | 0 |  | src/app\(dashboard)\manufacturing\orders\page.tsx |
| /manufacturing/plm | export | 0 | 0 | 0 |  | src/app\(dashboard)\manufacturing\plm\page.tsx |
| /manufacturing/qc | save, post, export, period | 3 | 2 | 3 | /api/manufacturing/work-orders \| /api/manufacturing/quality-control | src/app\(dashboard)\manufacturing\qc\page.tsx |
| /manufacturing/quality | save, export | 0 | 0 | 0 | /api/manufacturing/quality?view=dashboard \| /api/manufacturing/quality | src/app\(dashboard)\manufacturing\quality\page.tsx |
| /manufacturing/routing | delete, save, post, export, period | 6 | 6 | 0 | /api/manufacturing/routing | src/app\(dashboard)\manufacturing\routing\page.tsx |
| /manufacturing/scheduler | export, period | 0 | 0 | 0 | /api/manufacturing/scheduler | src/app\(dashboard)\manufacturing\scheduler\page.tsx |
| /manufacturing/scrap | save, post, export, period | 3 | 2 | 3 | /api/manufacturing/scrap | src/app\(dashboard)\manufacturing\scrap\page.tsx |
| /manufacturing/standard-cost | save, post, export, period | 2 | 2 | 0 | /api/manufacturing/standard-cost | src/app\(dashboard)\manufacturing\standard-cost\page.tsx |
| /manufacturing/subcontracting | save, post, export, period | 4 | 4 | 0 | /api/manufacturing/subcontracting | src/app\(dashboard)\manufacturing\subcontracting\page.tsx |
| /manufacturing/variance | post, export | 1 | 0 | 0 | /api/manufacturing/variance | src/app\(dashboard)\manufacturing\variance\page.tsx |
| /manufacturing/work-centers | save, post, export | 3 | 2 | 2 | /api/manufacturing/work-centers | src/app\(dashboard)\manufacturing\work-centers\page.tsx |
| /manufacturing/work-orders | save, post, export, period | 6 | 4 | 4 | /api/manufacturing/work-orders \| /api/manufacturing/bom | src/app\(dashboard)\manufacturing\work-orders\page.tsx |
| /marketing/analytics | export | 0 | 0 | 0 |  | src/app\(dashboard)\marketing\analytics\page.tsx |
| /payments | export, payment | 0 | 0 | 0 | /api/payments | src/app\(dashboard)\payments\page.tsx |
| /payroll/wps | save, post, export, period, payment | 3 | 3 | 0 | /api/payroll/wps/history \| /api/payroll/wps/generate \| /api/payroll/wps/${batchId}/mark-uploaded | src/app\(dashboard)\payroll\wps\page.tsx |
| /pdpl | export | 0 | 0 | 0 | /api/pdpl | src/app\(dashboard)\pdpl\page.tsx |
| /pharmacy | save, post, export, period | 4 | 4 | 0 | /api/pharmacy/drugs \| /api/pharmacy/prescriptions \| /api/pharmacy/drug-interactions | src/app\(dashboard)\pharmacy\page.tsx |
| /pharmacy/drug-interact | export | 0 | 0 | 0 |  | src/app\(dashboard)\pharmacy\drug-interact\page.tsx |
| /pharmacy/manager | delete, save, post, export, period, payment | 8 | 7 | 2 | /api/pharmacy/drugs | src/app\(dashboard)\pharmacy\manager\page.tsx |
| /planning | save, post, export | 4 | 3 | 2 | /api/planning/slots | src/app\(dashboard)\planning\page.tsx |
| /portal | save, post, export | 4 | 3 | 2 | /api/portal/users | src/app\(dashboard)\portal\page.tsx |
| /pos | delete, save, post, approve, export, zatca, period, payment | 13 | 20 | 0 | /api/pos/restaurant/floor \| /api/settings \| /api/pos/pending-orders \| /api/sales?limit=15 \| /api/pos/products \| /api/customers?search=${query} \| /api/coupons/validate | src/app\(dashboard)\pos\page.tsx |
| /pos-dashboard | export, period, payment | 3 | 0 | 0 |  | src/app\(dashboard)\pos-dashboard\page.tsx |
| /pos-demo | post, export, zatca, payment | 8 | 0 | 0 |  | src/app\(dashboard)\pos-demo\page.tsx |
| /pos/accountant | export, period | 0 | 0 | 0 | /api/pos/accountant | src/app\(dashboard)\pos\accountant\page.tsx |
| /pos/offline | delete, save, post, export | 3 | 3 | 0 | /api/pos/sync | src/app\(dashboard)\pos\offline\page.tsx |
| /price-quotes | delete, save, post, approve, export, zatca, period, payment | 10 | 14 | 0 | /api/price-quotes \| /api/products \| /api/settings \| /api/auth/me \| /api/sales \| /api/price-quotes?id=${quote.id} | src/app\(dashboard)\price-quotes\page.tsx |
| /procurement/contracts | save, post, export, zatca, period, payment | 4 | 3 | 3 | /api/procurement/contracts \| /api/cron/contracts | src/app\(dashboard)\procurement\contracts\page.tsx |
| /procurement/price-comparison | save, export | 1 | 0 | 0 |  | src/app\(dashboard)\procurement\price-comparison\page.tsx |
| /procurement/rfq/:id | post, export, period | 2 | 2 | 0 | /api/procurement/rfq/${id}/comparison \| /api/procurement/rfq/${id}/award \| /api/procurement/rfq/${id}/invite | src/app\(dashboard)\procurement\rfq\[id]\page.tsx |
| /procurement/spend-analytics | export | 0 | 0 | 0 | /api/procurement/spend-analytics | src/app\(dashboard)\procurement\spend-analytics\page.tsx |
| /procurement/supplier-contracts | export | 0 | 0 | 0 | /api/procurement/supplier-contracts?expiringSoon=true | src/app\(dashboard)\procurement\supplier-contracts\page.tsx |
| /procurement/vendor-portal | save, post, approve, export, zatca, period | 3 | 2 | 0 | /api/procurement/vendor-portal | src/app\(dashboard)\procurement\vendor-portal\page.tsx |
| /procurement/vendor-scorecard | export | 0 | 0 | 0 |  | src/app\(dashboard)\procurement\vendor-scorecard\page.tsx |
| /procurement/vendors/scorecard | save, post, export, period | 8 | 7 | 2 | /api/procurement/vendors/scorecard \| /api/cron/vendor-scoring | src/app\(dashboard)\procurement\vendors\scorecard\page.tsx |
| /products | delete, save, post, export, period | 11 | 11 | 0 | /api/settings/hidden_modules \| /api/products?${params} \| /api/categories \| /api/units \| /api/products/${id} \| /api/products/export \| /api/products/import \| /api/products \| /api/products?action=delete_all \| /api/categories?action=delete_all | src/app\(dashboard)\products\page.tsx |
| /profile/security | delete, post, export, period | 4 | 4 | 0 | /api/auth/2fa/setup \| /api/auth/2fa/verify \| /api/auth/2fa/backup-codes | src/app\(dashboard)\profile\security\page.tsx |
| /promotions | save, export | 4 | 0 | 0 |  | src/app\(dashboard)\promotions\page.tsx |
| /purchase-orders | delete, save, post, approve, export, zatca, period, payment | 20 | 21 | 2 | /api/customers?type=1 \| /api/purchase-orders \| /api/purchase-orders/${id} | src/app\(dashboard)\purchase-orders\page.tsx |
| /purchase-orders/:id/landed-costs | delete, save, post, export, period | 3 | 2 | 2 | /api/purchase-orders/${orderId} \| /api/purchase-orders/${orderId}/landed-costs \| /api/accounts \| /api/settings/currencies \| /api/purchase-orders/${orderId}/landed-costs/${id} | src/app\(dashboard)\purchase-orders\[id]\landed-costs\page.tsx |
| /purchase-returns | save, post, export, zatca | 3 | 2 | 1 | /api/purchase-returns | src/app\(dashboard)\purchase-returns\page.tsx |
| /purchases | save, approve, export, zatca, payment | 0 | 0 | 0 |  | src/app\(dashboard)\purchases\page.tsx |
| /purchases/grn | delete, save, post, approve, export, period, payment | 7 | 4 | 2 | /api/purchases/grn \| /api/customers?type=1 \| /api/products \| /api/warehouses | src/app\(dashboard)\purchases\grn\page.tsx |
| /purchases/landed-cost/:poId | save, post, export, period | 4 | 5 | 2 | /api/purchases/po/${poId} \| /api/purchases/po/${poId}/landed-costs \| /api/purchases/po/${poId}/landed-costs/${costId}/allocate | src/app\(dashboard)\purchases\landed-cost\[poId]\page.tsx |
| /purchases/letters-of-credit | delete, save, post, export, period | 6 | 7 | 2 | /api/purchases/letters-of-credit \| /api/banks \| /api/customers?type=1 \| /api/settings/currencies \| /api/purchases/letters-of-credit/${id} | src/app\(dashboard)\purchases\letters-of-credit\page.tsx |
| /purchases/matching | post, export, zatca, period, payment | 7 | 7 | 0 | /api/purchases/matching \| /api/purchases/matching/${selectedMatch.id}/resolve | src/app\(dashboard)\purchases\matching\page.tsx |
| /purchases/options | export | 0 | 0 | 0 |  | src/app\(dashboard)\purchases\options\page.tsx |
| /purchases/orders | save, approve, export, period, payment | 4 | 0 | 0 |  | src/app\(dashboard)\purchases\orders\page.tsx |
| /purchases/requisitions | save, approve, export, period | 7 | 0 | 0 |  | src/app\(dashboard)\purchases\requisitions\page.tsx |
| /purchases/rfq | delete, save, post, export, period | 8 | 4 | 2 | /api/purchases/rfq \| /api/customers?type=1 \| /api/products | src/app\(dashboard)\purchases\rfq\page.tsx |
| /purchases/three-way-match | save, approve, export, zatca, payment | 4 | 3 | 0 | /api/purchases/three-way-match | src/app\(dashboard)\purchases\three-way-match\page.tsx |
| /quality | export | 1 | 0 | 0 | /api/quality/stats | src/app\(dashboard)\quality\page.tsx |
| /quality/inspections | export | 3 | 0 | 0 |  | src/app\(dashboard)\quality\inspections\page.tsx |
| /quality/ncrs | save, export | 3 | 0 | 0 |  | src/app\(dashboard)\quality\ncrs\page.tsx |
| /rebates | export | 0 | 0 | 0 | /api/rebates | src/app\(dashboard)\rebates\page.tsx |
| /receipt-vouchers | export, zatca, period, payment | 2 | 2 | 0 | /api/sales | src/app\(dashboard)\receipt-vouchers\page.tsx |
| /recurring-invoices | save, export, zatca, period | 2 | 2 | 0 | /api/recurring-invoices \| /api/cron/trigger-invoices | src/app\(dashboard)\recurring-invoices\page.tsx |
| /rem | save, export, period | 11 | 5 | 2 |  | src/app\(dashboard)\rem\page.tsx |
| /rem/installments | export | 1 | 1 | 0 | /api/rem/installments | src/app\(dashboard)\rem\installments\page.tsx |
| /rem/leases | export, payment | 1 | 1 | 0 | /api/rem/leases | src/app\(dashboard)\rem\leases\page.tsx |
| /rent | delete, save, post, export, zatca, period, payment | 3 | 2 | 2 | /api/rent | src/app\(dashboard)\rent\page.tsx |
| /rental/agreements | save, post, export | 4 | 3 | 2 | /api/rental/agreements | src/app\(dashboard)\rental\agreements\page.tsx |
| /reports | export, period | 17 | 17 | 0 | /api/reports/users-list \| /api/branches \| /api/reports/${key}?${params} | src/app\(dashboard)\reports\page.tsx |
| /reports/104-modules | approve, export, zatca, period, payment | 3 | 6 | 0 |  | src/app\(dashboard)\reports\104-modules\page.tsx |
| /reports/73-modules | approve, export, zatca, period, payment | 3 | 6 | 0 |  | src/app\(dashboard)\reports\73-modules\page.tsx |
| /reports/aging | export, payment | 2 | 2 | 0 | /api/reports/aging?type=${type} | src/app\(dashboard)\reports\aging\page.tsx |
| /reports/allocations | post, export, period | 5 | 1 | 0 | /api/accounting/allocations/simulate | src/app\(dashboard)\reports\allocations\page.tsx |
| /reports/bi-cube | export | 0 | 0 | 0 |  | src/app\(dashboard)\reports\bi-cube\page.tsx |
| /reports/budget-variance | export | 0 | 0 | 0 | /api/budgeting/variance | src/app\(dashboard)\reports\budget-variance\page.tsx |
| /reports/builder | save, post, export, zatca, period | 6 | 0 | 0 |  | src/app\(dashboard)\reports\builder\page.tsx |
| /reports/cashflow | export, period, payment | 3 | 0 | 0 | /api/accounting/cashflow/forecast?days=30 | src/app\(dashboard)\reports\cashflow\page.tsx |
| /reports/consolidation | post, export, period, payment | 2 | 2 | 0 |  | src/app\(dashboard)\reports\consolidation\page.tsx |
| /reports/customer-statement | export | 2 | 2 | 0 | /api/customers \| /api/reports/customer-statement?${query.toString()} | src/app\(dashboard)\reports\customer-statement\page.tsx |
| /reports/expiry | export, period | 1 | 1 | 0 | /api/batches/expiry?days=${days} | src/app\(dashboard)\reports\expiry\page.tsx |
| /reports/footnotes | delete, export | 4 | 0 | 0 |  | src/app\(dashboard)\reports\footnotes\page.tsx |
| /reports/fraud-ai | export | 1 | 1 | 0 | /api/ai/fraud-monitoring | src/app\(dashboard)\reports\fraud-ai\page.tsx |
| /reports/kpi-builder | save, export | 2 | 0 | 0 |  | src/app\(dashboard)\reports\kpi-builder\page.tsx |
| /reports/manual-purchases | export, zatca, payment | 1 | 1 | 0 |  | src/app\(dashboard)\reports\manual-purchases\page.tsx |
| /reports/pivot | save, post, export, zatca, period | 1 | 1 | 0 | /api/system/pivot | src/app\(dashboard)\reports\pivot\page.tsx |
| /reports/returns | export, zatca | 1 | 1 | 0 | /api/reports/returns?${query.toString()} | src/app\(dashboard)\reports\returns\page.tsx |
| /reports/segments | export, zatca | 2 | 0 | 0 |  | src/app\(dashboard)\reports\segments\page.tsx |
| /reports/zatca-vat | export, zatca, period | 2 | 1 | 0 | /api/reports/zatca-vat?period=${period} | src/app\(dashboard)\reports\zatca-vat\page.tsx |
| /restaurant-pos | delete, save, post, approve, export, zatca, period, payment | 18 | 25 | 0 | /api/pos/restaurant/floor \| /api/settings \| /api/pos/pending-orders \| /api/sales?limit=15 \| /api/pos/products \| /api/customers?search=${query} \| /api/coupons/validate | src/app\(dashboard)\restaurant-pos\page.tsx |
| /restaurant-tables | save, export | 3 | 0 | 0 |  | src/app\(dashboard)\restaurant-tables\page.tsx |
| /salaries | post, export, period, payment | 1 | 1 | 0 | /api/salaries \| /api/employees \| /api/hr/payroll/generate | src/app\(dashboard)\salaries\page.tsx |
| /sales | delete, save, post, approve, export, zatca, period, payment | 41 | 56 | 0 | /api/settings \| /api/pos/bnpl/status?provider=${bnplProvider.toLowerCase()}&sessionId=${bnplOrderId} \| /api/warehouses \| /api/settings/currencies \| /api/customers \| /api/products \| /api/customers?type=0 \| /api/coupons/validate \| /api/pos/bnpl \| /api/crm/whatsapp \| /api/sales \| /api/sales?id=${inv.id} | src/app\(dashboard)\sales\page.tsx |
| /sales-returns | save, post, export, zatca, period, payment | 4 | 4 | 0 | /api/sales-returns \| /api/warehouses \| /api/sales?invoiceNo=${searchInvoiceNo} | src/app\(dashboard)\sales-returns\page.tsx |
| /sales/analytics | export | 2 | 1 | 0 |  | src/app\(dashboard)\sales\analytics\page.tsx |
| /sales/atp-simulator | save, post, export, period | 3 | 0 | 2 | /api/sales/atp/check | src/app\(dashboard)\sales\atp-simulator\page.tsx |
| /sales/cash-application | delete, save, post, export, zatca, period, payment | 7 | 1 | 0 |  | src/app\(dashboard)\sales\cash-application\page.tsx |
| /sales/commissions | save, post, approve, export, period, payment | 2 | 2 | 0 | /api/sales/commissions/rules \| /api/sales/commissions?month=${selectedMonth}&year=${selectedYear} \| /api/sales/commissions/calculate | src/app\(dashboard)\sales\commissions\page.tsx |
| /sales/cpq | delete, save, post, export | 5 | 7 | 0 | /api/cpq | src/app\(dashboard)\sales\cpq\page.tsx |
| /sales/debit-notes | save, post, export, zatca, period, payment | 4 | 4 | 0 | /api/sales \| /api/sales?invoiceNo=${searchInvoiceNo} | src/app\(dashboard)\sales\debit-notes\page.tsx |
| /sales/delivery-notes | delete, save, post, export | 6 | 4 | 2 | /api/sales/delivery-notes \| /api/customers?type=0 \| /api/products | src/app\(dashboard)\sales\delivery-notes\page.tsx |
| /sales/forecast | export, period | 2 | 1 | 0 | /api/sales/forecast?period=${period} | src/app\(dashboard)\sales\forecast\page.tsx |
| /sales/history | delete, export, zatca, payment | 0 | 0 | 0 |  | src/app\(dashboard)\sales\history\page.tsx |
| /sales/options | delete, save, post, export, period, payment | 5 | 5 | 0 | /api/categories \| /api/settings | src/app\(dashboard)\sales\options\page.tsx |
| /sales/orders | delete, save, post, approve, export, zatca | 8 | 7 | 2 | /api/sales-orders \| /api/customers?type=0 \| /api/hr/employees \| /api/products \| /api/sales-orders/${id}/process | src/app\(dashboard)\sales\orders\page.tsx |
| /sales/orders/create | delete, save, post, export, period | 5 | 4 | 2 | /api/customers?type=0 \| /api/products \| /api/sales-orders | src/app\(dashboard)\sales\orders\create\page.tsx |
| /sales/pricing | save, post, export, period | 8 | 4 | 4 | /api/sales/pricing \| /api/sales/pricing/calculate | src/app\(dashboard)\sales\pricing\page.tsx |
| /sales/returns/rma | post, approve, export, zatca, period | 11 | 10 | 0 | /api/sales/returns \| /api/sales/returns/${id}/${action} | src/app\(dashboard)\sales\returns\rma\page.tsx |
| /sales/routes | save, post, export, period | 3 | 2 | 3 | /api/sales/routes \| /api/hr/employees | src/app\(dashboard)\sales\routes\page.tsx |
| /sales/smart-map | export | 0 | 0 | 0 |  | src/app\(dashboard)\sales\smart-map\page.tsx |
| /sales/statements | post, export | 5 | 1 | 0 | /api/sales/statements/bulk | src/app\(dashboard)\sales\statements\page.tsx |
| /sales/targets | save, post, export | 3 | 2 | 2 | /api/sales/targets?year=${year}&month=${month} \| /api/hr/employees \| /api/sales/targets | src/app\(dashboard)\sales\targets\page.tsx |
| /school | delete, save, post, export, zatca, period | 3 | 2 | 2 | /api/school | src/app\(dashboard)\school\page.tsx |
| /school/attendance | export, period | 13 | 0 | 0 |  | src/app\(dashboard)\school\attendance\page.tsx |
| /school/dashboard | export, period | 10 | 0 | 0 |  | src/app\(dashboard)\school\dashboard\page.tsx |
| /school/exams | export | 7 | 0 | 0 |  | src/app\(dashboard)\school\exams\page.tsx |
| /school/schedule | export, period | 3 | 0 | 0 |  | src/app\(dashboard)\school\schedule\page.tsx |
| /school/stages | export | 5 | 0 | 0 |  | src/app\(dashboard)\school\stages\page.tsx |
| /school/transport | export | 6 | 0 | 0 |  | src/app\(dashboard)\school\transport\page.tsx |
| /scm | export | 3 | 0 | 0 |  | src/app\(dashboard)\scm\page.tsx |
| /settings | delete, save, post, approve, export, zatca, period, payment | 13 | 13 | 0 | /api/settings/hidden_modules \| /api/users \| /api/branches \| /api/users?id=${u.id} \| /api/sales?action=delete_all \| /api/settings \| /api/settings/${key} \| /api/settings/upload-logo \| /api/settings/company_logo \| /api/settings/generate-keys \| /api/telegram/webhook?action=set \| /api/system/reset | src/app\(dashboard)\settings\page.tsx |
| /settings/approvals | delete, save, post, approve, export, zatca, period | 6 | 7 | 1 | /api/settings/approvals \| /api/settings/approvals/${editId} \| /api/settings/approvals/${r.id} | src/app\(dashboard)\settings\approvals\page.tsx |
| /settings/bpm | save, post, approve, export, zatca | 3 | 0 | 0 |  | src/app\(dashboard)\settings\bpm\page.tsx |
| /settings/company | delete, save, post, export, zatca, period, payment | 6 | 6 | 0 | /api/auth/login \| /api/settings \| /api/zatca?type=status \| https://namainvist.com/api/ice/desktop-register \| /api/settings/${key} \| /api/settings/upload-logo \| /api/zatca \| /api/settings/company_logo \| /api/settings/POS_TAX_ENABLED \| /api/settings/POS_TAX_INCLUSIVE | src/app\(dashboard)\settings\company\page.tsx |
| /settings/currencies | delete, save, post, export, period | 6 | 7 | 1 | /api/settings/currencies \| /api/settings/currencies/${editId} \| /api/settings/currencies/${c.id} | src/app\(dashboard)\settings\currencies\page.tsx |
| /settings/custom-fields | save, post, export, zatca | 4 | 3 | 1 | /api/settings/custom-fields?entity=${selectedEntity} \| /api/settings/custom-fields | src/app\(dashboard)\settings\custom-fields\page.tsx |
| /settings/dashboard-builder | delete, post, export | 4 | 4 | 0 | /api/system/dashboard-builder?view=defaults \| /api/system/dashboard-builder | src/app\(dashboard)\settings\dashboard-builder\page.tsx |
| /settings/import-export | post, export, period | 9 | 9 | 0 | /api/system/import-export | src/app\(dashboard)\settings\import-export\page.tsx |
| /settings/number-sequences | save, post, export, period | 4 | 3 | 1 | /api/settings/number-sequences | src/app\(dashboard)\settings\number-sequences\page.tsx |
| /settings/numbering | export | 0 | 0 | 0 | /api/settings/numbering | src/app\(dashboard)\settings\numbering\page.tsx |
| /settings/permissions/fields | save, post, export, period | 0 | 0 | 0 | /api/settings/permissions/fields | src/app\(dashboard)\settings\permissions\fields\page.tsx |
| /settings/print-templates | save, export, zatca, period | 1 | 1 | 0 | /api/system/print-templates?model=${model} | src/app\(dashboard)\settings\print-templates\page.tsx |
| /settings/roles | save, post, approve, export, zatca, period, payment | 5 | 5 | 0 | /api/settings/roles | src/app\(dashboard)\settings\roles\page.tsx |
| /settings/security | save, export | 0 | 0 | 0 |  | src/app\(dashboard)\settings\security\page.tsx |
| /settings/sso | save, post, export, period | 9 | 8 | 2 | /api/auth/sso | src/app\(dashboard)\settings\sso\page.tsx |
| /settings/state-machine | export | 0 | 0 | 0 | /api/settings/state-machine | src/app\(dashboard)\settings\state-machine\page.tsx |
| /settings/webhooks | delete, save, post, export, zatca, period, payment | 12 | 11 | 2 | /api/webhooks \| /api/webhooks/${sub.id} \| /api/webhooks/${sub.id}/rotate-secret | src/app\(dashboard)\settings\webhooks\page.tsx |
| /settings/whatsapp | save, export | 0 | 0 | 0 | /api/settings/whatsapp | src/app\(dashboard)\settings\whatsapp\page.tsx |
| /settings/workflow-builder | delete, save, post, approve, export, zatca, period | 5 | 8 | 0 | /api/system/workflow | src/app\(dashboard)\settings\workflow-builder\page.tsx |
| /settings/zatca | post, export, zatca, payment | 3 | 3 | 0 |  | src/app\(dashboard)\settings\zatca\page.tsx |
| /shifts | delete, save, post, export, period | 9 | 11 | 2 | /api/shifts \| /api/shifts?id=${s.id} | src/app\(dashboard)\shifts\page.tsx |
| /shifts/monitor | export, period | 0 | 0 | 0 |  | src/app\(dashboard)\shifts\monitor\page.tsx |
| /shipping | save, post, export | 2 | 2 | 0 | /api/shipping?view=shipments \| /api/shipping | src/app\(dashboard)\shipping\page.tsx |
| /shl/classes | export | 1 | 0 | 0 | /api/shl/classes | src/app\(dashboard)\shl\classes\page.tsx |
| /shl/students | export | 1 | 0 | 0 | /api/shl/students | src/app\(dashboard)\shl\students\page.tsx |
| /shopfloor | save, post, export, period | 9 | 7 | 4 | /api/manufacturing/shopfloor?action=active \| /api/manufacturing/shopfloor?action=andon \| /api/manufacturing/shopfloor | src/app\(dashboard)\shopfloor\page.tsx |
| /smart-transfers | save, post, export, period | 5 | 4 | 2 | /api/products?limit=5000 \| /api/warehouses \| /api/smart-transfers | src/app\(dashboard)\smart-transfers\page.tsx |
| /stock | save, post, export | 2 | 2 | 0 | /api/products \| /api/stock-movements \| /api/product-stocks/location | src/app\(dashboard)\stock\page.tsx |
| /stock-transfers | export | 0 | 1 | 0 | /api/stock-transfers \| /api/products | src/app\(dashboard)\stock-transfers\page.tsx |
| /stock/adjustments | save, post, export | 3 | 2 | 2 | /api/stock/adjustments \| /api/products | src/app\(dashboard)\stock\adjustments\page.tsx |
| /stock/movements | export | 1 | 1 | 0 | /api/stock/movements | src/app\(dashboard)\stock\movements\page.tsx |
| /stocktake | save, post, export | 4 | 5 | 0 | /api/stocktake \| /api/products | src/app\(dashboard)\stocktake\page.tsx |
| /stocktake/vision | save, post, export | 5 | 6 | 0 | /api/stocktake/vision | src/app\(dashboard)\stocktake\vision\page.tsx |
| /subscriptions | save, export, period | 4 | 0 | 0 |  | src/app\(dashboard)\subscriptions\page.tsx |
| /subscriptions/plans | save, post, export, period | 5 | 4 | 2 | /api/subscriptions/plans | src/app\(dashboard)\subscriptions\plans\page.tsx |
| /supply-chain/rfx-auction | save, export, period | 9 | 7 | 0 | /api/supply-chain/rfx-auction | src/app\(dashboard)\supply-chain\rfx-auction\page.tsx |
| /supply-chain/vendor-onboarding | save, approve, export, zatca, period | 9 | 7 | 0 | /api/supply-chain/vendor-onboarding | src/app\(dashboard)\supply-chain\vendor-onboarding\page.tsx |
| /support/help-desk | export | 0 | 0 | 0 |  | src/app\(dashboard)\support\help-desk\page.tsx |
| /support/sla | export | 0 | 0 | 0 |  | src/app\(dashboard)\support\sla\page.tsx |
| /sys/alerts | save, export | 1 | 0 | 0 | /api/sys/alerts | src/app\(dashboard)\sys\alerts\page.tsx |
| /sys/health | export | 1 | 1 | 0 | /api/sys/health | src/app\(dashboard)\sys\health\page.tsx |
| /tax | save, export, zatca, period, payment | 3 | 0 | 0 |  | src/app\(dashboard)\tax\page.tsx |
| /tax/vat-returns | save, export, zatca, period | 2 | 0 | 0 |  | src/app\(dashboard)\tax\vat-returns\page.tsx |
| /tax/wht | save, export, payment | 1 | 0 | 0 |  | src/app\(dashboard)\tax\wht\page.tsx |
| /tax/zakat | save, post, export, zatca, period | 2 | 2 | 0 | /api/zakat/assessments \| /api/accounting/fiscal-years \| /api/zakat/assessments/${id}/finalize | src/app\(dashboard)\tax\zakat\page.tsx |
| /tax/zatca-onboard | save, export, zatca | 4 | 0 | 0 |  | src/app\(dashboard)\tax\zatca-onboard\page.tsx |
| /treasury | export | 0 | 0 | 0 | /api/treasury | src/app\(dashboard)\treasury\page.tsx |
| /treasury/bank-recon | export, payment | 4 | 2 | 0 | /api/treasury/bank-recon | src/app\(dashboard)\treasury\bank-recon\page.tsx |
| /treasury/bank-reconciliation | delete, save, post, export | 3 | 3 | 2 | /api/accounting/accounts \| /api/finance/reconciliations \| /api/finance/reconciliations/${session.reconciliation.id} | src/app\(dashboard)\treasury\bank-reconciliation\page.tsx |
| /treasury/cash-flow | post, export, zatca, payment | 1 | 0 | 0 |  | src/app\(dashboard)\treasury\cash-flow\page.tsx |
| /treasury/cash-forecast | export, period | 0 | 0 | 0 | /api/treasury/cash-forecast | src/app\(dashboard)\treasury\cash-forecast\page.tsx |
| /treasury/cash-position | post, export | 2 | 2 | 0 | /api/treasury/cash-position \| /api/treasury/cash-position/snapshot | src/app\(dashboard)\treasury\cash-position\page.tsx |
| /treasury/checks | save, post, export, period, payment | 9 | 8 | 2 | /api/finance/checks?type=${tab} \| /api/finance/checks \| /api/finance/checks/${id}/process | src/app\(dashboard)\treasury\checks\page.tsx |
| /treasury/liquidity | post, export, payment | 3 | 2 | 0 | /api/treasury/liquidity/forecast \| /api/treasury/liquidity/forecast/generate | src/app\(dashboard)\treasury\liquidity\page.tsx |
| /treasury/petty-cash | save, export, payment | 5 | 0 | 0 |  | src/app\(dashboard)\treasury\petty-cash\page.tsx |
| /v3/clinic | export | 2 | 0 | 0 |  | src/app\(dashboard)\v3\clinic\page.tsx |
| /v3/clinic/appointments | export | 3 | 0 | 0 | /api/v3/clinic/appointments | src/app\(dashboard)\v3\clinic\appointments\page.tsx |
| /v3/clinic/emr | save, post, export, period | 5 | 1 | 0 | /api/v3/clinic/emr | src/app\(dashboard)\v3\clinic\emr\page.tsx |
| /v3/clinic/erx | save, export | 3 | 0 | 0 | /api/v3/clinic/erx | src/app\(dashboard)\v3\clinic\erx\page.tsx |
| /v3/clinic/lab | export | 3 | 0 | 0 | /api/v3/clinic/lab | src/app\(dashboard)\v3\clinic\lab\page.tsx |
| /v3/construction | export | 2 | 0 | 0 |  | src/app\(dashboard)\v3\construction\page.tsx |
| /v3/construction/boq | post, export, zatca | 4 | 1 | 0 | /api/v3/construction/boq | src/app\(dashboard)\v3\construction\boq\page.tsx |
| /v3/construction/progress-billing | export, period, payment | 3 | 0 | 0 | /api/v3/construction/progress-billing | src/app\(dashboard)\v3\construction\progress-billing\page.tsx |
| /v3/construction/variations | save, approve, export | 3 | 0 | 0 | /api/v3/construction/variations | src/app\(dashboard)\v3\construction\variations\page.tsx |
| /v3/distribution | export | 2 | 0 | 0 |  | src/app\(dashboard)\v3\distribution\page.tsx |
| /v3/distribution/picking/wave | export | 3 | 0 | 0 | /api/v3/distribution/picking/wave | src/app\(dashboard)\v3\distribution\picking\wave\page.tsx |
| /v3/distribution/routes | export | 3 | 0 | 0 | /api/v3/distribution/routes | src/app\(dashboard)\v3\distribution\routes\page.tsx |
| /v3/distribution/wms | post, export | 4 | 1 | 0 | /api/v3/distribution/wms | src/app\(dashboard)\v3\distribution\wms\page.tsx |
| /v3/manufacturing | export | 2 | 0 | 0 |  | src/app\(dashboard)\v3\manufacturing\page.tsx |
| /v3/manufacturing/mrp | save, post, export | 5 | 1 | 0 | /api/v3/manufacturing/mrp | src/app\(dashboard)\v3\manufacturing\mrp\page.tsx |
| /v3/manufacturing/shopfloor | export, period | 3 | 0 | 0 | /api/v3/manufacturing/shopfloor | src/app\(dashboard)\v3\manufacturing\shopfloor\page.tsx |
| /v3/master | export, zatca | 1 | 0 | 0 | /api/v3/retail/pos \| /api/v3/restaurant/kds \| /api/v3/manufacturing/mrp \| /api/v3/construction/boq | src/app\(dashboard)\v3\master\page.tsx |
| /v3/realestate | export | 2 | 0 | 0 |  | src/app\(dashboard)\v3\realestate\page.tsx |
| /v3/realestate/cam | export, period | 3 | 0 | 0 |  | src/app\(dashboard)\v3\realestate\cam\page.tsx |
| /v3/realestate/leases | save, post, export, period | 4 | 1 | 0 | /api/v3/realestate/leases | src/app\(dashboard)\v3\realestate\leases\page.tsx |
| /v3/restaurant | export | 2 | 0 | 0 |  | src/app\(dashboard)\v3\restaurant\page.tsx |
| /v3/restaurant/kds | save, post, export, zatca | 2 | 2 | 0 | /api/pos/restaurant/kds | src/app\(dashboard)\v3\restaurant\kds\page.tsx |
| /v3/restaurant/tables | post, export | 6 | 2 | 0 | /api/restaurant/pos/status \| /api/restaurant/pos/resolve | src/app\(dashboard)\v3\restaurant\tables\page.tsx |
| /v3/retail | export | 2 | 0 | 0 |  | src/app\(dashboard)\v3\retail\page.tsx |
| /v3/retail/loyalty | export | 4 | 0 | 0 |  | src/app\(dashboard)\v3\retail\loyalty\page.tsx |
| /v3/retail/pos | save, post, export, payment | 7 | 1 | 0 | /api/v3/retail/pos | src/app\(dashboard)\v3\retail\pos\page.tsx |
| /v3/school | export | 2 | 0 | 0 |  | src/app\(dashboard)\v3\school\page.tsx |
| /v3/school/gradebook | save, export | 1 | 0 | 0 |  | src/app\(dashboard)\v3\school\gradebook\page.tsx |
| /v3/school/sis | post, export | 5 | 1 | 0 | /api/v3/school/sis | src/app\(dashboard)\v3\school\sis\page.tsx |
| /v3/school/transcripts | export | 2 | 0 | 0 |  | src/app\(dashboard)\v3\school\transcripts\page.tsx |
| /v3/services | export | 2 | 0 | 0 |  | src/app\(dashboard)\v3\services\page.tsx |
| /v3/services/sla | export | 1 | 0 | 0 |  | src/app\(dashboard)\v3\services\sla\page.tsx |
| /v3/services/timesheet | approve, export, zatca | 3 | 0 | 0 |  | src/app\(dashboard)\v3\services\timesheet\page.tsx |
| /v3/services/workorders | save, export | 3 | 0 | 0 |  | src/app\(dashboard)\v3\services\workorders\page.tsx |
| /vacations | save, post, approve, export, period | 5 | 5 | 0 | /api/vacations \| /api/employees | src/app\(dashboard)\vacations\page.tsx |
| /vat | export, zatca, period | 3 | 1 | 0 | /api/vat | src/app\(dashboard)\vat\page.tsx |
| /vendor-portal | save, export, zatca, payment | 2 | 1 | 0 |  | src/app\(dashboard)\vendor-portal\page.tsx |
| /vendor-ratings | export | 0 | 0 | 0 | /api/vendor-ratings | src/app\(dashboard)\vendor-ratings\page.tsx |
| /warehouses | delete, save, post, export, zatca, period, payment | 6 | 5 | 2 | /api/warehouses \| /api/branches \| /api/warehouses/analytics \| /api/warehouses/${currentWarehouse.id} \| /api/warehouses/${id} | src/app\(dashboard)\warehouses\page.tsx |
| /warehouses/alerts | post, export | 2 | 2 | 0 | /api/warehouses/analytics \| /api/procurement/auto-draft | src/app\(dashboard)\warehouses\alerts\page.tsx |
| /warehouses/fifo | delete, export, period | 9 | 5 | 0 |  | src/app\(dashboard)\warehouses\fifo\page.tsx |
| /warehouses/map | export, period | 12 | 11 | 0 |  | src/app\(dashboard)\warehouses\map\page.tsx |
| /warehouses/options | delete, save, post, export, period, payment | 4 | 4 | 0 | /api/units \| /api/units?id=${id} \| /api/settings | src/app\(dashboard)\warehouses\options\page.tsx |
| /warranty | export | 0 | 0 | 0 | /api/warranty | src/app\(dashboard)\warranty\page.tsx |
| /whatsapp-hub | save, post, export, period | 1 | 2 | 0 | /api/crm/whatsapp/sessions \| /api/crm/whatsapp/broadcast | src/app\(dashboard)\whatsapp-hub\page.tsx |
| /wht | export, period, payment | 3 | 1 | 0 | /api/wht?period=${period} | src/app\(dashboard)\wht\page.tsx |
| /wms/waves | export | 0 | 0 | 0 | /api/wms/waves | src/app\(dashboard)\wms\waves\page.tsx |
| /zakat | export, period | 2 | 1 | 0 | /api/zakat?year=${year} | src/app\(dashboard)\zakat\page.tsx |
| /zatca | export, zatca, payment | 6 | 1 | 0 | /api/zatca | src/app\(dashboard)\zatca\page.tsx |

