# 01 — الوضع الراهن (Current State Inventory)

تم فحص: **366 صفحة Dashboard + 645 API route + 468 Prisma model**.

---

## 1. الصفحات (Dashboard Pages) — 366 صفحة

### المحاسبة (Accounting) — 31 صفحة

| Path | الغرض | UI Elements | الحالة |
|---|---|---|---|
| `accounting` | Hub رئيسي | Tree, Journal, Ledger, TB, IS/BS, Cost Centers | READY |
| `accounting/journal` | بحث + قائمة قيود | Search Form, Table, Print | READY |
| `accounting/banks` | البنوك | Table, Form, CRUD | READY |
| `accounting/banks/imports` | استيراد كشوف | Upload, Preview, Import | PARTIAL |
| `accounting/banks/recon` | تسوية بنكية | Recon Table, Matching | PARTIAL |
| `accounting/bank-reconciliation` | لوحة تسوية | Tabs, Transactions | PARTIAL |
| `accounting/trial-balance` | ميزان مراجعة | Table, Export | READY |
| `accounting/allocations/rules` | قواعد توزيع | Rule Builder | PARTIAL |
| `accounting/customer-statements` | كشف حساب عميل | List, Generate, Export | PARTIAL |
| `accounting/customer-statements/bulk` | إنشاء جماعي | Batch UI, Progress | STUB |
| `accounting/customer-statements/templates` | قوالب الكشوف | Builder, Preview | PARTIAL |
| `accounting/deferred` | مدخولات/مصروفات مؤجلة | Schedule, Charts | STUB |
| `accounting/dunning` | إنذارات الديون | Letter List, Send | PARTIAL |
| `accounting/dunning/letters` | قوالب الإنذارات | Templates | STUB |
| `accounting/dunning/promises` | تعهدات السداد | Tracker | STUB |
| `accounting/financial-close` | الإقفال المالي | Checklist, Tracker | PARTIAL |
| `accounting/fixed-assets` | الأصول الثابتة | List, Depreciation | READY |
| `accounting/lc` | اعتمادات مستندية | LC List, Form, Status | STUB |
| `accounting/leases` | محاسبة الإيجارات IFRS16 | Schedule, ROU | STUB |
| `accounting/multi-book` | تعدد الدفاتر | Books, Consolidation | STUB |
| `accounting/open-items` | بنود مفتوحة | Aging, Drill-down | PARTIAL |
| `accounting/payment-runs` | جولات السداد | List, Wizard, Approval | READY |
| `accounting/payment-runs/create` | إنشاء جولة سداد | Vendor Selection, Amount | READY |
| `accounting/period-close` | إقفال الفترة | Tasks, Status | PARTIAL |
| `accounting/profit-centers` | مراكز الربح | Tree, Allocation | STUB |
| `accounting/revenue-recognition` | الاعتراف بالإيراد ASC606 | Schedule, Deferral | STUB |
| `accounting/segments` | تقارير الشرائح | Dimensions, Charts | STUB |
| `accounting/vendor-statements` | كشف مورد | List, Generate | PARTIAL |
| `accounting/vendor-statements/bulk` | كشوف موردين جماعي | Batch UI | STUB |
| `accounting/year-end-close` | إقفال نهاية السنة | Multi-step Wizard | PARTIAL |

### المبيعات (Sales) — 15 صفحة

| Path | الغرض | الحالة |
|---|---|---|
| `sales` | Hub | READY |
| `sales/orders` | طلبات بيع | READY |
| `sales/orders/create` | إنشاء طلب | READY |
| `sales/delivery-notes` | إشعارات تسليم | PARTIAL |
| `sales/debit-notes` | إشعارات مدينة | STUB |
| `sales/returns/rma` | RMA | PARTIAL |
| `sales/commissions` | عمولات | STUB |
| `sales/forecast` | توقعات | STUB |
| `sales/history` | سجل المبيعات | PARTIAL |
| `sales/options` | خيارات المنتجات | STUB |
| `sales/pricing` | قواعد التسعير | STUB |
| `sales/routes` | خطوط البيع | STUB |
| `sales/statements` | كشوف العملاء | STUB |
| `sales/targets` | مستهدفات | STUB |

### المشتريات (Purchases) — 10 صفحات

| Path | الغرض | الحالة |
|---|---|---|
| `purchases` | Hub | READY |
| `purchases/orders` | أوامر شراء | READY |
| `purchases/requisitions` | طلبات شراء | READY |
| `purchases/rfq` | طلبات عروض أسعار | PARTIAL |
| `purchases/grn` | إشعارات استلام | PARTIAL |
| `purchases/three-way-match` | المطابقة الثلاثية | PARTIAL |
| `purchases/matching` | مطابقة PO/Invoice | PARTIAL |
| `purchases/landed-cost/[poId]` | التكلفة المحملة | STUB |
| `purchases/letters-of-credit` | اعتمادات | STUB |
| `purchases/options` | خيارات الموردين | STUB |

### التصنيع (Manufacturing) — 25 صفحة

| Path | الحالة |
|---|---|
| `manufacturing` (Hub) | READY |
| `manufacturing/orders` (أوامر تشغيل) | READY |
| `manufacturing/bom` (قائمة المواد) | READY |
| `manufacturing/boms` (قائمة بديلة) | PARTIAL |
| `manufacturing/boms/[id]/versions` | STUB |
| `manufacturing/mrp-engine` | PARTIAL |
| `manufacturing/mrp-dashboard` | PARTIAL |
| `manufacturing/scheduler` | PARTIAL |
| `manufacturing/work-centers` | PARTIAL |
| `manufacturing/qc` | PARTIAL |
| `manufacturing/quality` | STUB |
| `manufacturing/capa` | STUB |
| `manufacturing/routing` | STUB |
| `manufacturing/variance` | STUB |
| `manufacturing/standard-cost` | STUB |
| `manufacturing/subcontracting` | STUB |
| `manufacturing/lean-kanban` | STUB |
| `manufacturing/labor-efficiency` | STUB |
| `manufacturing/oee` | STUB |
| `manufacturing/capacity` | STUB |
| `manufacturing/scrap` | STUB |
| `manufacturing/plm` | STUB |
| `manufacturing/digital-twin` | STUB |
| `manufacturing/blockchain-trace` | STUB |

### الموارد البشرية (HR) — 22 صفحة

| Path | الحالة |
|---|---|
| `hr` (Hub) | READY |
| `hr/attendance` | READY |
| `hr/leaves` | READY |
| `hr/payroll-process` | READY |
| `hr/payslip/[id]` | READY |
| `hr/employees` | READY |
| `hr/jobs` | PARTIAL |
| `hr/loans` | PARTIAL |
| `hr/documents` | PARTIAL |
| `hr/evaluations` | PARTIAL |
| `hr/gosi` | PARTIAL |
| `hr/wps` | PARTIAL |
| `hr/training` | STUB |
| `hr/ai-enrollment` | STUB |
| `hr/eos` | STUB |
| `hr/recruitment` | STUB |
| `hr/payroll/config` | STUB |
| `hr/payroll/run` | PARTIAL |
| `hr/org-chart` | STUB |
| `hr/performance` | STUB |
| `hr/timesheet` | STUB |
| `hr/self-service` | STUB |

### المالية (Finance) — 21 صفحة

| Path | الحالة |
|---|---|
| `finance/cfo` | READY |
| `finance/cfo-ai` | STUB |
| `finance/cash-flow` | PARTIAL |
| `finance/cash-flow/forecast` | PARTIAL |
| `finance/budget-control` | PARTIAL |
| `finance/budget-control/variance` | STUB |
| `finance/budget-scenarios` | STUB |
| `finance/allocation` | STUB |
| `finance/variance` | STUB |
| `finance/assets` | PARTIAL |
| `finance/fx-revaluation` | STUB |
| `finance/wht` | STUB |
| `finance/consolidation` | STUB |
| `finance/consolidation/elimination` | STUB |
| `finance/period-close` | STUB |
| `finance/ecl` | STUB |
| `finance/copa` | STUB |
| `finance/copa/rules` | STUB |
| `finance/balance-sheet` | STUB |
| `finance/bank-recon/rules` | STUB |
| `finance/payment-run` | STUB |

### المخازن (Inventory) — 12 صفحة

| Path | الحالة |
|---|---|
| `inventory/wms` | READY |
| `inventory/wms/putaway` | READY |
| `inventory/stocktake` | READY |
| `inventory/stocktake/cycle` | READY |
| `inventory/movements` | PARTIAL |
| `inventory/quality-control` | PARTIAL |
| `inventory/reorder-rules` | PARTIAL |
| `inventory/picking/[id]` | PARTIAL |
| `inventory/traceability` | STUB |
| `inventory/zones` | STUB |
| `inventory/delivery-notes` | STUB |
| `inventory/abc-analysis` | STUB |
| `inventory/ai-vision` | STUB |

### مؤسسات (Enterprise) — 11 صفحة

| Path | الحالة |
|---|---|
| `enterprise/projects` | PARTIAL |
| `enterprise/projects/[id]` | PARTIAL |
| `enterprise/projects/[id]/gantt` | PARTIAL |
| `enterprise/mrp` | STUB |
| `enterprise/mrp/recipes` | STUB |
| `enterprise/wms` | STUB |
| `enterprise/fleet` | STUB |
| `enterprise/property` | STUB |
| `enterprise/quality` | STUB |
| `enterprise/quality-management` | STUB |
| `enterprise/legal` | STUB |

### التقارير (Reports) — 19 صفحة

| Path | الحالة |
|---|---|
| `reports` | READY |
| `reports/builder` | READY |
| `reports/aging` | READY |
| `reports/kpi-builder` | PARTIAL |
| `reports/pivot` | PARTIAL |
| `reports/cashflow` | PARTIAL |
| `reports/consolidation` | STUB |
| `reports/customer-statement` | STUB |
| `reports/expiry` | STUB |
| `reports/footnotes` | STUB |
| `reports/fraud-ai` | STUB |
| `reports/manual-purchases` | STUB |
| `reports/returns` | STUB |
| `reports/segments` | STUB |
| `reports/zatca-vat` | STUB |
| `reports/allocations` | STUB |
| `reports/budget-variance` | STUB |
| `reports/73-modules`, `reports/104-modules` | STUB |

### الإعدادات (Settings) — 17 صفحة

| Path | الحالة |
|---|---|
| `settings`, `settings/company`, `settings/roles` | READY |
| `settings/currencies`, `settings/number-sequences`, `settings/numbering`, `settings/custom-fields`, `settings/print-templates`, `settings/approvals`, `settings/import-export` | PARTIAL |
| `settings/permissions/fields`, `settings/bpm`, `settings/dashboard-builder`, `settings/workflow-builder`, `settings/zatca`, `settings/security`, `settings/whatsapp` | STUB |

### بقية الموديولات

| الموديول | الإجمالي | READY | PARTIAL | STUB | ملاحظات رئيسية |
|---|---:|---:|---:|---:|---|
| Tax & Compliance | 5 | 1 | 2 | 2 | tax/zakat, tax/zatca-onboard مازالا STUB |
| Treasury | 6 | 2 | 4 | 0 | تسوية بنكية وشيكات يعملان |
| Administration / GRC | 10 | 0 | 2 | 8 | كل GRC تقريباً Stub |
| CRM | 6 | 0 | 2 | 4 | leads/opportunities جزئي فقط |
| Quality | 3 | 1 | 2 | 0 | inspection و NCR جزئي |
| Fleet | 4 | 1 | 3 | 0 | fuel/trips/maintenance جزئي |
| Field Service | 3 | 1 | 2 | 0 | dispatch/tasks جزئي |
| School | 7 | 1 | 0 | 6 | كل وحدات SIS Stub |
| Clinic | 3 | 0 | 1 | 2 | appointments جزئي |
| Procurement | 4 | 0 | 2 | 3 | rfq, contracts, vendor-portal |
| Logistics | 2 | 0 | 0 | 2 | carriers, freight Stub |
| Stock | 3 | 1 | 2 | 0 | movements/adjustments جزئي |
| Ecommerce | 2 | 0 | 0 | 2 | كله Stub |
| Hospitality | 3 | 2 | 0 | 1 | bookings/calendar يعملان |
| **V3 (Verticals)** | 34 | 7 (Hubs only) | 0 | 27 | كل تفاصيل V3 stub — Hubs فقط جاهزة |
| Misc (products, customers, etc.) | 70+ | 12 | 9 | 49 | المنتجات/العملاء/الموظفين/الفروع/المخازن/الموافقات READY |

---

## 2. APIs (Backend Routes) — 645 route

### بأرقام مختصرة

| الموديول | عدد الـ routes | يعمل (READY) |
|---|---:|---:|
| Accounting | 73 | 73 (جميعها READY) |
| Sales | 41 | 38 |
| Purchases | 42 | 36 |
| Inventory & Stock | 32 | 28 |
| Manufacturing | 39 | 26 |
| HR & Payroll | 36 | 32 |
| Finance | 42 | 42 |
| WHT/Tax/ZATCA | 13 | 13 |
| Settings | 19 | 17 |
| CRM | 16 | 13 |
| Procurement | 9 | 9 |
| Customers/Vendors/Portals | 12 | 9 |
| Projects | 11 | 9 |
| Fleet/Assets | 8 | 7 |
| Warehousing/Logistics | 10 | 9 |
| POS & Retail | 10 | 8 |
| Ecommerce/B2B/Subscriptions | 9 | 7 |
| Treasury/Payments/BNPL | 8 | 4 |
| Real Estate/Rental | 5 | 5 |
| AI/Analytics/BI | 15 | 3 (PARTIAL/STUB) |
| Reports | 14 | 13 |
| System/Admin | 38 | 35 |
| Cron Jobs | 16 | 14 |
| Webhooks/Integrations | 9 | 6 |
| State machines/Approvals | 8 | 8 |
| Master data (Products/Categories/Units) | 7 | 7 |
| Specialized (Clinic/Pharmacy/School) | 18 | 4 |
| Saudi Regulatory | 5 | 5 |
| V3 (new arch) | 14 | 0 (كلها STUB) |
| Misc (Coupons/Loyalty/Events) | 8 | 8 |

### Routes تستخدم محرك القيود (`auto-journal.ts`)

29 route مؤكد:
- Sales: `sales/*`, `pos/checkout`
- Purchases: `purchases/grn`, `purchases/matching`, `purchases/[id]/receive`
- Manufacturing: `manufacturing/work-orders`, `manufacturing/scrap`
- Finance: `finance/checks/[id]/process`, `finance/petty-cash/[id]/process`, `finance/wht`
- HR: `hr/payroll/*`, `salaries`
- Accounting: `accounting/journal`, `accounting/reversal`, `accounting/fixed-assets/depreciate`, `accounting/revenue-recognition`
- Inventory: `stock/adjustments`, `smart-transfers`
- Webhooks: `webhooks/salla`

### Routes تستخدم محركات أخرى

- **Period Close Engine:** 2 (`accounting/period-close`, `finance/period-close`)
- **WHT Engine:** 3 (`wht/calculate`, `finance/wht`, `wht/form14/generate`)
- **Prisma Transactions:** 50+ route

---

## 3. Prisma Schema — 468 model

### حسب المجال

| المجال | عدد الموديلات |
|---|---:|
| Accounting & GL | 52 |
| Inventory & Warehouse | 48 |
| Sales & Distribution | 42 |
| Tax & Compliance | 40 |
| Manufacturing | 29 |
| HR & Payroll | 29 |
| Purchasing & Vendors | 28 |
| Treasury & Cash | 24 |
| System & Integration | 21 |
| Fixed Assets | 20 |
| CRM & Customer Engagement | 18 |
| Project Management | 15 |
| Reporting & BI | 14 |
| Fleet & Transportation | 13 |
| E-commerce & Retail | 13 |
| Specialized (Clinic/Pharmacy/School/Restaurant) | 62 |

### نمط Header → Detail (37 زوج)

PurchaseOrder/Detail، SalesOrder/Detail، DeliveryNote/Detail، GoodsReceiptNote/Detail، PriceQuote/Detail، StockTransfer/Detail، RentInvoice/Detail، SchoolInvoice/Detail، Budget/BudgetLine، JournalTemplate/Line، Subscription/Payment، VendorBid/Detail، ThreeWayMatch/Line، MaintenanceSchedule/WorkOrder، PayrollInvoice/Detail، PickList/Line، RequestForQuotation/Detail، PurchaseRequisition/Detail، PurchaseReturn/Detail، PurchaseInvoice/Detail، SalesInvoice/Detail، SalesReturn/Detail، Installment/InstallmentPayment، OnlineOrder/Line، Expense/Line، StatementSchedule/Template، PaymentRun/Line، AssetImpairment/Record، BankStatement/Line، Medication/Log، IfrsLeaseSchedule/Line، PeriodCloseTask/Template، Account/MappingTemplate، Event/EventLog (وأخرى).

### ملاحظات مهمة على الـ schema

1. **عدم استخدام enums اسمية** — كل الحالات `String` مع تعليق (DRAFT|APPROVED|...). هذا يتطلب validation في كل API.
2. **Multi-tenant عبر `tenantId`** في 150+ model.
3. **Audit-heavy:** جداول `FieldAuditTrail`, `FieldAuditLog`, `ComplianceAuditLog`, `EventLog`, `AuditLog`.
4. **Saudi compliance built-in:** ZATCA, GOSI, Qiwa, PDPL, WPS موديلات موجودة.
5. **IFRS:** نماذج لـ IFRS 15 (PerformanceObligation), IFRS 16 (IfrsLeaseContract/Schedule/Modification), IFRS 9 (ECL).
6. **Multi-currency:** `ExchangeRate`, `FxRevaluationRun`.
7. **Custom fields:** `CustomFieldDefinition`/`CustomFieldValue` على أي entity.
8. **Workflow:** `WorkflowDefinition`/`WorkflowInstance` + `BpmWorkflow`/`BpmTask`.

---

## 4. مكتبات الكود الأساسية (Core Libraries)

| الملف | الغرض | المستخدمون |
|---|---|---|
| `src/lib/auto-journal.ts` | محرك القيود التلقائية | 29 API |
| `src/lib/period-close-engine.ts` | إقفال الفترات | 2 API |
| `src/lib/wht-engine.ts` | ضريبة الاستقطاع | 3 API |
| `src/lib/costing.ts` | FIFO/LIFO/Average | غير معروف عدد المستهلكين |

---

## 5. تشخيص العام

### ✅ نقاط القوة

1. **محاسبة قوية:** Auto-journal يعمل عبر 29 نقطة، Period close، Year-end، Reversal، FX revaluation، Allocations، Consolidation، ECL، Revenue recognition (ASC 606)، Fixed assets، IFRS 16 leases.
2. **ZATCA Phase 2** يعمل: QR، XML، Onboarding، Java adapter.
3. **Saudi compliance backbone:** GOSI، WPS via Mudad، Qiwa، Nitaqat، Zakat، WHT — APIs موجودة.
4. **Multi-tenant solid:** 468 model، أغلبها مع `tenantId`.
5. **Workflow engine:** State machines, approvals, BPM.
6. **AI integration:** Gemini-based CFO, NLQ, fraud detection (لكن مازالت في البداية).

### ⚠️ نقاط الضعف الحاسمة

1. **Front-end backlog هائل:** 56% من الصفحات Stub. المنطق موجود لكن المستخدم لا يصل إليه.
2. **V3 modules كلها Stub:** Construction, Distribution, Real Estate, Restaurant, Services, School v3, Clinic v3 — ما عدا الـ Hubs.
3. **GRC/Compliance UI:** فارغة بالكامل تقريباً (10 صفحات، 8 stub).
4. **AI/BI pages:** كلها stub، رغم وجود APIs.
5. **CRM ضعيف:** 0 صفحات READY من 6.
6. **Specialized verticals:** Clinic, Pharmacy, School، Hotel — UIs ناقصة جداً.
7. **عدم وجود Enums اسمية:** Type safety ضعيف، خطأ تسجيل حالة أمر عادي.
8. **لا يوجد UI Component Library واضح:** لكل صفحة UI خاص (مما يفسر الاختلاف الحاد في الجاهزية).

### 🔴 مخاطر مفصلية يجب حلها فوراً

1. **PIH Chain Integrity Monitor مفقود** — أي خطأ في تسلسل ZATCA = إعادة تسجيل كاملة + غرامات.
2. **B.72 Field-Level Audit Trail** — مذكور كـ STUB رغم أنه أساسي للـ SOX/SOCPA.
3. **B.73 Universal Approval Engine** — Workflow engine موجود لكن UI الـ inbox محدود.
4. **AP Invoice Capture (OCR + AI Match)** — مفقود تماماً، رغم أنه أكبر توفير في AP.
5. **Real-time Credit Check at Order Entry** — غير مفعّل، يهدد التدفقات النقدية.
6. **Group Reporting / IFRS Consolidation** — APIs موجودة لكن لا يوجد محرك elimination حقيقي.

---

## 6. ملخص رقمي للقراءة السريعة

**أنت لديك:**
- 480 API يعمل بكامل المنطق المحاسبي.
- 68 صفحة جاهزة للاستخدام.
- 468 جدول قاعدة بيانات.
- 29 نقطة قيد تلقائي.
- ZATCA + GOSI + Qiwa + WPS تعمل.

**أنت تحتاج:**
- ربط 206 صفحة stub بالـ APIs الموجودة (الأسهل والأسرع).
- بناء 162 ميزة عالمية مفقودة (الأصعب).
- سد 88 فجوة سعودية (الأخطر، غرامات).

**الترتيب المنطقي:**
1. اربط الـ stubs الموجودة بالـ APIs (أسبوعان عمل لكل 50 صفحة).
2. سد فجوات P0 السعودية (شهر).
3. ابن أهم 38 ميزة P0 العالمية (3-4 شهور).
4. ميزات P1 على دفعات (6 شهور).
5. P2/P3 حسب الطلب من العملاء.

→ تابع في `02_GLOBAL_GAPS_P0_P1.md`
