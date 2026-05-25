# Reports Inventory

## Report Pages
| route | file |
| --- | --- |
| /accounting/aging-report | src/app\(dashboard)\accounting\aging-report\page.tsx |
| /hr/expense-reports | src/app\(dashboard)\hr\expense-reports\page.tsx |
| /reports | src/app\(dashboard)\reports\page.tsx |
| /reports/104-modules | src/app\(dashboard)\reports\104-modules\page.tsx |
| /reports/73-modules | src/app\(dashboard)\reports\73-modules\page.tsx |
| /reports/aging | src/app\(dashboard)\reports\aging\page.tsx |
| /reports/allocations | src/app\(dashboard)\reports\allocations\page.tsx |
| /reports/bi-cube | src/app\(dashboard)\reports\bi-cube\page.tsx |
| /reports/budget-variance | src/app\(dashboard)\reports\budget-variance\page.tsx |
| /reports/builder | src/app\(dashboard)\reports\builder\page.tsx |
| /reports/cashflow | src/app\(dashboard)\reports\cashflow\page.tsx |
| /reports/consolidation | src/app\(dashboard)\reports\consolidation\page.tsx |
| /reports/customer-statement | src/app\(dashboard)\reports\customer-statement\page.tsx |
| /reports/expiry | src/app\(dashboard)\reports\expiry\page.tsx |
| /reports/footnotes | src/app\(dashboard)\reports\footnotes\page.tsx |
| /reports/fraud-ai | src/app\(dashboard)\reports\fraud-ai\page.tsx |
| /reports/kpi-builder | src/app\(dashboard)\reports\kpi-builder\page.tsx |
| /reports/manual-purchases | src/app\(dashboard)\reports\manual-purchases\page.tsx |
| /reports/pivot | src/app\(dashboard)\reports\pivot\page.tsx |
| /reports/returns | src/app\(dashboard)\reports\returns\page.tsx |
| /reports/segments | src/app\(dashboard)\reports\segments\page.tsx |
| /reports/zatca-vat | src/app\(dashboard)\reports\zatca-vat\page.tsx |


## Report APIs
| route | methods | withRoute | defaultTenant | file |
| --- | --- | --- | --- | --- |
| /api/accounting/cost-center-report | GET | true | true | src/app/api\accounting\cost-center-report\route.ts |
| /api/accounting/year-end/:runId/reports | GET | true | true | src/app/api\accounting\year-end\[runId]\reports\route.ts |
| /api/ai-cfo/report | GET | true | false | src/app/api\ai-cfo\report\route.ts |
| /api/cron/scheduled-reports | GET | true | false | src/app/api\cron\scheduled-reports\route.ts |
| /api/finance/period-reports | GET | true | true | src/app/api\finance\period-reports\route.ts |
| /api/hr/expense-reports | GET,POST | true | false | src/app/api\hr\expense-reports\route.ts |
| /api/platform/reports |  | false | false | src/app/api\platform\reports\route.ts |
| /api/reports/:type | GET | true | false | src/app/api\reports\[type]\route.ts |
| /api/reports/aging | GET | true | false | src/app/api\reports\aging\route.ts |
| /api/reports/bi-export | GET | true | false | src/app/api\reports\bi-export\route.ts |
| /api/reports/cash-flow | GET | true | false | src/app/api\reports\cash-flow\route.ts |
| /api/reports/customer-statement | GET | true | false | src/app/api\reports\customer-statement\route.ts |
| /api/reports/dimensional-gl | GET | true | false | src/app/api\reports\dimensional-gl\route.ts |
| /api/reports/export | GET | true | false | src/app/api\reports\export\route.ts |
| /api/reports/financial-statements/generate | GET,POST | true | true | src/app/api\reports\financial-statements\generate\route.ts |
| /api/reports/returns | GET | true | false | src/app/api\reports\returns\route.ts |
| /api/reports/what-if | GET | true | false | src/app/api\reports\what-if\route.ts |
| /api/reports/zatca-vat | GET,POST | true | false | src/app/api\reports\zatca-vat\route.ts |


## Report Menu Links Missing Matching Page
| group | labelKey | href | cleanHref | module |
| --- | --- | --- | --- | --- |


