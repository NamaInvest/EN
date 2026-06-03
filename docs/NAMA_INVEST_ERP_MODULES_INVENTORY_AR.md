# جرد الأقسام الرئيسية والفرعية في نظام Nama Invest ERP

> **المصدر:** مستخرج من ملفات المشروع الفعلية — READ ONLY  
> **التاريخ:** 2026-06-03  
> **Commit المرجعي:** c3b50b7c7e7fd802c5d65e081843158bc8eaa549  
> **الحالة:** PRODUCTION_STABLE

---

## ملاحظة منهجية

تم استخراج هذا الجرد بشكل مباشر من:
- مجلدات `src/app/(dashboard)/`
- مجلدات `src/app/api/`
- ملفات الـ Services والـ Engines في `src/lib/`
- ملفات الصفحات `page.tsx`
- ملفات المسارات `route.ts`

---

## 1. لوحة التحكم الرئيسية (Dashboard)

| العنصر | التفاصيل |
|--------|---------|
| **الهدف الوظيفي** | نظرة عامة على مؤشرات الأداء الرئيسية للشركة |
| **المسار** | `/dashboard` |
| **API** | `/api/dashboard` |
| **الحالة** | Active |
| **المستخدمون** | جميع المستخدمين حسب الصلاحيات |
| **أثر مالي** | لا (عرض فقط) |

**الأقسام الفرعية:**
- BI Dashboard: `/bi/dashboard`
- Admin Siem: `/admin/siem`
- System Health: `/sys/health`
- System Alerts: `/sys/alerts`

---

## 2. المبيعات (Sales)

| العنصر | التفاصيل |
|--------|---------|
| **الهدف الوظيفي** | إدارة دورة المبيعات من عروض الأسعار حتى التحصيل |
| **المسار الرئيسي** | `/sales` |
| **APIs** | `/api/sales`, `/api/sales-orders`, `/api/sales-returns`, `/api/price-quotes`, `/api/v2/sales/invoices` |
| **Services/Engines** | `sales.service.ts`, `sales-forecast-engine.ts`, `quote-engine.ts`, `pricing-rule-engine.ts`, `promotions-engine.ts` |
| **الحالة** | Active |
| **المستخدمون** | مسؤول المبيعات، المحاسب، المدير |
| **أثر مالي** | ✅ نعم — قيود مالية تلقائية |

**الأقسام الفرعية:**
- عروض الأسعار (Price Quotes): `/sales` — `/api/price-quotes`
- أوامر البيع (Sales Orders): `/sales/orders` — `/api/sales-orders`
- فواتير المبيعات: `/sales` — `/api/sales`
- مرتجعات المبيعات: `/sales/returns`, `/sales-returns` — `/api/sales-returns`
- إيصالات التسليم: `/sales/delivery-notes`
- مذكرات الخصم: `/sales/debit-notes`
- تحليلات المبيعات: `/sales/analytics`
- توقعات المبيعات: `/sales/forecast`
- عمولات المبيعات: `/sales/commissions`
- خريطة التوزيع الذكية: `/sales/smart-map`
- مسارات المبيعات: `/sales/routes`
- أهداف المبيعات: `/sales/targets`
- طرفية المبيعات: `/sales/terminal`
- CPQ (تسعير وتكوين): `/sales/cpq`, `/cpq`
- تطبيق النقد: `/sales/cash-application`
- ATP Simulator: `/sales/atp-simulator`
- تاريخ المبيعات: `/sales/history`
- فواتير متكررة: `/api/recurring-invoices`
- بوابة الدفع: `/api/payments` — `payment-gateway-engine.ts`

---

## 3. نقاط البيع (POS)

| العنصر | التفاصيل |
|--------|---------|
| **الهدف الوظيفي** | بيع مباشر في نقطة البيع مع دعم وضع عدم الاتصال |
| **APIs** | `/api/pos`, `/api/pos/sessions`, `/api/pos/checkout` |
| **Services/Engines** | `pos-session-engine.ts`, `pos-sync-engine.ts`, `pos-accountant.service.ts` |
| **الحالة** | Active |
| **المستخدمون** | الكاشير، مشرف الوردية |
| **أثر مالي** | ✅ نعم — قيود نقدية وإيرادات |

**الأقسام الفرعية:**
- إدارة الورديات: `/shifts`, `/shifts/monitor` — `/api/shifts`, `/api/work-shifts`
- بار كود وطباعة: `/barcode` — `print-barcode-engine.ts`
- هدايا وكوبونات: `/coupons`, `/api/gift-cards`
- برامج الولاء: `/api/loyalty` — `loyalty-points-engine.ts`
- تطبيقات التوصيل: `/api/delivery-platforms`
- POS المطعم: `/restaurant-pos`, `/restaurant-tables`
- قائمة QR: `/qr-menu/[token]`, `/menu/[tableId]`

---

## 4. المشتريات (Purchases)

| العنصر | التفاصيل |
|--------|---------|
| **الهدف الوظيفي** | إدارة دورة الشراء من طلب الشراء حتى السداد |
| **المسار** | `/purchases` |
| **APIs** | `/api/purchases`, `/api/purchase-orders`, `/api/purchase-returns`, `/api/grn`, `/api/procurement` |
| **Services/Engines** | `three-way-match-engine.ts`, `three-way-match-tolerance-engine.ts`, `spend-analysis-engine.ts`, `rfq-vendor-comparison-engine.ts` |
| **الحالة** | Active |
| **المستخدمون** | مسؤول المشتريات، المحاسب |
| **أثر مالي** | ✅ نعم — فواتير وسدادات ومخزون |

**الأقسام الفرعية:**
- طلبات الشراء: `/purchases`
- أوامر الشراء: `/purchase-orders`
- استلام البضاعة GRN: `/grn` — `/api/grn`
- مرتجعات المشتريات: `/purchase-returns` — `/api/purchase-returns`
- بوابة الموردين: `/vendor-portal` — `vendor-portal-engine.ts`
- تقييم الموردين: `/vendor-ratings` — `/api/vendor-ratings`
- سلسلة التوريد: `/scm`, `/supply-chain` — `/api/supply-chain`
- RFX والمناقصات: `/supply-chain/rfx-auction` — `rfx-auction-engine.ts`
- تأهيل الموردين: `/supply-chain/vendor-onboarding` — `vendor-onboarding-engine.ts`
- تحليل الإنفاق: `spend-analytics-engine.ts`
- AP Capture (OCR): `/ap/capture`

---

## 5. الموردون (Vendors)

| العنصر | التفاصيل |
|--------|---------|
| **الهدف الوظيفي** | إدارة بيانات الموردين وتحليل أدائهم |
| **APIs** | `/api/vendors`, `/api/vendors/[id]`, `/api/vendors/scorecard` |
| **Engines** | `vendor-contract-engine.ts`, `vendor-portal-v2-engine.ts` |
| **الحالة** | Active |
| **المستخدمون** | مسؤول المشتريات |
| **أثر مالي** | ✅ كشوف حساب وتسويات |

---

## 6. العملاء (Customers / CRM)

| العنصر | التفاصيل |
|--------|---------|
| **الهدف الوظيفي** | إدارة بيانات العملاء والعلاقات التجارية |
| **APIs** | `/api/customers`, `/api/crm` |
| **Engines** | `marketing-engine.ts`, `territory-engine.ts`, `nps-engine.ts`, `omnichannel-engine.ts` |
| **الحالة** | Active |
| **المستخدمون** | مسؤول المبيعات، مسؤول CRM |
| **أثر مالي** | ✅ حد ائتمان ومديونيات |

**الأقسام الفرعية:**
- Leads وفرص البيع: `/crm/leads`, `/crm/opportunities`
- العملاء الرئيسيون: `/crm/key-accounts`
- 360 درجة للعميل: `/crm/customer360`
- NPS ومتابعة الرضا: `/crm/cx-nps`
- تذاكر الدعم: `/crm/tickets`
- حملات التسويق: `/crm/campaigns`
- Kanban المبيعات: `/crm/kanban`
- الشركاء والتسويق: `partner-program-engine.ts`
- الخصومات والمكافآت: `rebate-engine.ts`

---

## 7. المخزون (Inventory)

| العنصر | التفاصيل |
|--------|---------|
| **الهدف الوظيفي** | إدارة حركات المخزون والجرد والتقييم |
| **المسار** | `/stock` |
| **APIs** | `/api/inventory`, `/api/stock`, `/api/stock-transfers`, `/api/stock-movements`, `/api/stocktake` |
| **Services/Engines** | `inventory.service.ts`, `inventory-engine.ts`, `inventory-analytics-engine.ts`, `lot-engine.ts`, `serial-batch-tracking-engine.ts`, `landed-cost-engine.ts`, `standard-cost-engine.ts` |
| **الحالة** | Active |
| **المستخدمون** | مسؤول المستودع، المحاسب |
| **أثر مالي** | ✅ تقييم مخزون وكلفة بضاعة مباعة |

**الأقسام الفرعية:**
- تعديلات المخزون: `/stock/adjustments`
- حركات المخزون: `/stock/movements`
- تحويلات بين مستودعات: `/stock-transfers`, `/smart-transfers`
- جرد المخزون: `/stocktake`, `/stocktake/vision` (AI)
- مستودعات متعددة: `/warehouses`, `/warehouses/map`, `/warehouses/fifo`
- WMS موجات الانتقاء: `/wms`, `/wms/waves` — `wms-wave-engine.ts`
- إدارة Bins: `inventory-bin-engine.ts`
- Lots & Serial: `lot-engine.ts`, `serial-batch-tracking-engine.ts`
- الشحن: `/shipping` — `shipping-engine.ts`
- الرمز الشريطي: `/barcode`
- تحليل المستودعات: `/warehouses/analytics`
- Cross-Docking: `/api/warehouse/cross-dock`
- Slotting: `/api/warehouse/slotting`

---

## 8. المنتجات والأصناف (Products)

| العنصر | التفاصيل |
|--------|---------|
| **الهدف الوظيفي** | كتالوج المنتجات والتصنيف والتسعير |
| **APIs** | `/api/products`, `/api/units`, `/api/packaging-units` |
| **Engines** | `product-variant-engine.ts`, `pricing-billing-engine.ts`, `reorder-engine.ts` |
| **الحالة** | Active |

---

## 9. التصنيع (Manufacturing)

| العنصر | التفاصيل |
|--------|---------|
| **الهدف الوظيفي** | إدارة أوامر الإنتاج وتخطيط الموارد |
| **APIs** | `/api/manufacturing`, `/api/v3/manufacturing` |
| **Services/Engines** | `manufacturing.service.ts`, `manufacturing-aps.service.ts`, `mrp-engine.ts`, `mps-engine.ts`, `mes-engine.ts`, `mes-oee-engine.ts`, `wip-production-tracking-engine.ts` |
| **الحالة** | Partial (Backend Active, UI Partial) |
| **أثر مالي** | ✅ كلفة إنتاج |

**الأقسام الفرعية:**
- Shopfloor: `/shopfloor` — `mes-engine.ts`
- APS التخطيط: `manufacturing-aps.service.ts`
- MRP: `/api/v3/manufacturing/mrp`
- OEE الكفاءة: `oee-engine.ts`
- المقاولات: `/v3/construction`
- BOQ وفواتير التقدم: `/api/v3/construction`

---

## 10. الموارد البشرية (HR / Payroll)

| العنصر | التفاصيل |
|--------|---------|
| **الهدف الوظيفي** | إدارة الموظفين والحضور والرواتب والإجازات |
| **APIs** | `/api/hr`, `/api/employees`, `/api/payroll`, `/api/vacations`, `/api/salaries`, `/api/work-shifts` |
| **Services/Engines** | `hr.service.ts`, `payroll.service.ts`, `leave-engine.ts`, `gosi-engine.ts`, `saudi-eos-engine.ts`, `qiwa-engine.ts`, `mudad-integration-engine.ts`, `shift-schedule-engine.ts`, `tna-engine.ts`, `recruitment-engine.ts`, `training-engine.ts`, `succession-engine.ts` |
| **الحالة** | Active |
| **المستخدمون** | مسؤول HR، المدير المالي |
| **أثر مالي** | ✅ رواتب وتكاليف موارد بشرية |

**الأقسام الفرعية:**
- الموظفون: `/employees`
- الحضور والانصراف: `/attendance`, `/kiosk/attendance`
- الإجازات: `/vacations`
- مسير الرواتب: `/salaries`
- الورديات: `/shifts`, `/shifts/monitor`
- GOSI: `gosi-engine.ts`
- نهاية الخدمة EOS: `saudi-eos-engine.ts`
- قيوة: `qiwa-engine.ts`
- مدد: `mudad-integration-engine.ts`
- التوظيف: `recruitment-engine.ts`
- التدريب والتطوير: `training-engine.ts`, `/admin/training-compliance`
- التخطيط الوظيفي: `succession-engine.ts`
- KPIs الأداء: `performance-engine.ts`
- OKR: `okr-engine.ts`

---

## 11. الخزينة والبنوك (Treasury & Banks)

| العنصر | التفاصيل |
|--------|---------|
| **الهدف الوظيفي** | إدارة التدفقات النقدية والبنوك والمطابقة البنكية |
| **APIs** | `/api/treasury`, `/api/treasury/bank-recon`, `/api/treasury/cash-position`, `/api/treasury/cash-forecast` |
| **Services/Engines** | `treasury-posting.service.ts`, `treasury-cash-position-engine.ts`, `treasury-forecast.service.ts`, `sama-open-banking-engine.ts` |
| **الحالة** | Active |
| **المستخدمون** | أمين الصندوق، المدير المالي |
| **أثر مالي** | ✅ سندات قبض وصرف وبنكية |

**الأقسام الفرعية:**
- البنوك: `/accounting/banks`, `/banks`
- المطابقة البنكية: `/treasury/bank-recon`, `/treasury/bank-reconciliation`, `/accounting/bank-reconciliation`
- استيراد كشف بنكي: `/accounting/banks/imports`
- الموقف النقدي: `/treasury/cash-position`
- التوقعات النقدية: `/treasury/cash-forecast`
- السيولة: `/treasury/liquidity`
- Petty Cash: `/treasury/petty-cash`
- الشيكات: `/treasury/checks`
- دفعات جماعية: `/accounting/payment-runs`
- SAMA Open Banking: `sama-open-banking-engine.ts`

---

## 12. المحاسبة (Accounting)

| العنصر | التفاصيل |
|--------|---------|
| **الهدف الوظيفي** | القيود المحاسبية والتقارير المالية وإغلاق الفترات |
| **APIs** | `/api/accounting/*`, `/api/fiscal-periods`, `/api/open-items` |
| **Services/Engines** | `period-lock-engine.ts`, `period-close-engine.ts`, `month-end-close-engine.ts`, `year-end-engine.ts`, `open-items-engine.ts`, `fx-revaluation-engine.ts`, `intercompany-engine.ts`, `multi-book-engine.ts`, `ifrs-engines.ts`, `segment-reporting-engine.ts` |
| **الحالة** | Active |
| **المستخدمون** | المحاسب، المدير المالي |
| **أثر مالي** | ✅ الأثر المالي الأساسي |

**الأقسام الفرعية:**
- القيود اليومية: `/accounting/journal`, `/accounting/journal/new`
- ميزان المراجعة: `/accounting/trial-balance`
- قائمة الدخل: `/accounting/profit-loss`
- قفل الفترات: `/accounting/period-lock`
- إغلاق الفترة: `/accounting/period-close`
- إغلاق نهاية السنة: `/accounting/year-end-close`
- الإغلاق المالي: `/accounting/financial-close`
- Open Items: `/accounting/open-items`
- بنود المشتركة بين الشركات: `/accounting/inter-company`
- تقرير التقادم: `/accounting/aging-report`
- Dunning: `/accounting/dunning`, `/accounting/dunning/letters`, `/accounting/dunning/promises`
- كشوف العملاء: `/accounting/customer-statements`
- كشوف الموردين: `/accounting/vendor-statements`
- المدفوعات المؤجلة: `/accounting/deferred`
- الدخل المؤجل والتنبؤ: `revenue-recognition-engine.ts`, `/accounting/revenue-recognition`
- الأصول الثابتة المحاسبية: `/accounting/fixed-assets`
- الإيجارات IFRS16: `/accounting/leases` — `ifrs16-lease-engine.ts`
- LC اعتمادات مستندية: `/accounting/lc`
- متعدد الدفاتر: `/accounting/multi-book`
- مراكز الربح: `/accounting/profit-centers`
- الشرائح التقارير: `/accounting/segments`
- مخطط تحصيل: `/accounting/collection-workflow`
- قواعد التوزيع: `/accounting/allocations/rules`
- الدفعات المقدمة: `/accounting/prepayments`

---

## 13. الأصول الثابتة (Fixed Assets)

| العنصر | التفاصيل |
|--------|---------|
| **الهدف الوظيفي** | إدارة الأصول الثابتة والإهلاك |
| **APIs** | `/api/fixed-assets` |
| **Engines** | `impairment-engine.ts`, `standard-cost-engine.ts` |
| **الحالة** | Active |
| **الصفحات** | `/assets`, `/accounting/fixed-assets` |
| **أثر مالي** | ✅ إهلاك وتقييم |

---

## 14. الفترات والسنوات المالية

| العنصر | التفاصيل |
|--------|---------|
| **APIs** | `/api/fiscal-periods` |
| **Engines** | `period-lock-engine.ts`, `year-end-processing-engine.ts` |
| **الحالة** | Active |
| **أثر مالي** | ✅ حماية البيانات المالية |

---

## 15. الضرائب (Tax / ZATCA / VAT / WHT / Zakat)

| العنصر | التفاصيل |
|--------|---------|
| **الهدف الوظيفي** | الامتثال الضريبي السعودي |
| **APIs** | `/api/zatca/*`, `/api/vat`, `/api/wht`, `/api/zakat`, `/api/tax` |
| **Engines** | `zatca-qr-engine.ts`, `zatca-onboarding-engine.ts`, `wht-engine.ts`, `zakat-engine.ts`, `zakat-tax-engine.ts`, `tax-regime-engine.ts`, `statutory-reports-engine.ts` |
| **الحالة** | Active (ZATCA Phase 2) |
| **الصفحات** | `/tax/vat-returns`, `/tax/wht`, `/tax/zakat`, `/tax/zatca-onboard`, `/zatca`, `/wht`, `/vat`, `/zakat`, `/accounting/vat-return` |
| **أثر مالي** | ✅ ضريبي وحكومي |

---

## 16. العملات وإعادة التقييم (FX)

| العنصر | التفاصيل |
|--------|---------|
| **APIs** | `/api/fx`, `/api/settings/exchange-rates` |
| **Engines** | `fx-revaluation-engine.ts`, `realized-fx-engine.ts`, `hedge-accounting-engine.ts`, `transfer-pricing-engine.ts` |
| **الحالة** | Active |
| **أثر مالي** | ✅ فروق العملة |

---

## 17. الميزانية التقديرية (Budgeting)

| العنصر | التفاصيل |
|--------|---------|
| **Engines** | `rolling-budget-engine.ts`, `variance-engine.ts`, `forecasting-engine.ts` |
| **الحالة** | Partial (Backend موجود) |
| **أثر مالي** | ✅ تخطيط مالي |

---

## 18. توحيد القوائم المالية (Consolidation)

| العنصر | التفاصيل |
|--------|---------|
| **APIs** | `/api/accounting/consolidation/*` |
| **Engines** | `intercompany-engine.ts`, `ic-elimination-engine.ts`, `ic-netting-engine.ts` |
| **DB Tables** | `consolidation_elimination_requests/approvals/snapshots/postings` |
| **الحالة** | Active (تم إضافة الجداول 2026-06-03) |
| **أثر مالي** | ✅ مرتفع جداً |

---

## 19. Open Items (الأرصدة المفتوحة)

| العنصر | التفاصيل |
|--------|---------|
| **APIs** | `/api/open-items` |
| **Services** | `open-items.service.ts`, `open-items-engine.ts` |
| **الصفحات** | `/accounting/open-items` |
| **الحالة** | Active |
| **أثر مالي** | ✅ مقاصة ومطابقة |

---

## 20. التقارير المالية (Reports)

| العنصر | التفاصيل |
|--------|---------|
| **APIs** | `/api/reports` |
| **Engines** | `reporting-engine.ts`, `report-builder-engine.ts`, `olap-cube-engine.ts`, `pivot-engine.ts`, `notes-to-fs-engine.ts` |
| **الصفحات** | `/reports/*` — Balance Sheet, P&L, Cash Flow, Segments, Returns, ZATCA VAT |
| **الحالة** | Active |
| **أثر مالي** | عرض فقط |

---

## 21. الإعدادات (Settings)

| العنصر | التفاصيل |
|--------|---------|
| **APIs** | `/api/settings/*` |
| **الحالة** | Active |

**الأقسام الفرعية:**
- بيانات الشركة: `/settings/company`
- الأدوار والصلاحيات: `/settings/roles`, `/settings/permissions`
- العملات: `/settings/currencies`
- الترقيم التلقائي: `/settings/numbering`, `/settings/number-sequences`
- قوالب الطباعة: `/settings/print-templates`
- ZATCA: `/settings/zatca`
- الاعتمادات: `/settings/approvals`
- SSO: `/settings/sso`
- الـ Webhooks: `/settings/webhooks`
- WhatsApp: `/settings/whatsapp`
- حقول مخصصة: `/settings/custom-fields`
- لوحة التحكم المخصصة: `/settings/dashboard-builder`
- استيراد/تصدير: `/settings/import-export`
- آلة الحالة: `/settings/state-machine`
- BPM Workflow: `/settings/bpm`, `/settings/workflow-builder`
- الأمان: `/settings/security`

---

## 22. المستخدمون والصلاحيات

| العنصر | التفاصيل |
|--------|---------|
| **APIs** | `/api/users`, `/api/settings/roles`, `/api/settings/permissions` |
| **الحالة** | Active |
| **الأمان** | Multi-tenant isolation ✅ |

---

## 23. الفروع والشركات

| العنصر | التفاصيل |
|--------|---------|
| **الصفحات** | `/branches` |
| **APIs** | `/api/tenant/*`, `/api/master/*` |
| **Engines** | `tenant-onboarding-engine.ts` |
| **الحالة** | Active |

---

## 24. الذكاء الاصطناعي (AI)

| العنصر | التفاصيل |
|--------|---------|
| **الصفحات** | `/ai/demand-forecast`, `/ai/nlq`, `/ai/sales-coach`, `/ai/bank-fraud`, `/ai-copilot`, `/ai-cfo`, `/ai-auditor`, `/ai-scm`, `/ai-bank` |
| **APIs** | `/api/explain`, `/api/planning` |
| **Engines** | `nlq-engine.ts`, `sales-forecast-engine.ts`, `kb-rag-engine.ts`, `multi-agent-engine.ts` |
| **الحالة** | Partial |

---

## 25. الدعم الفني (Support / Help Desk)

| العنصر | التفاصيل |
|--------|---------|
| **الصفحات** | `/support/help-desk`, `/support/sla` |
| **Engines** | `help-desk-engine.ts`, `sla-slo-engine.ts`, `support-engine.ts` |
| **الحالة** | Partial |
| **APIs** | `/api/service` |

---

## 26. المشاريع (Projects)

| العنصر | التفاصيل |
|--------|---------|
| **APIs** | `/api/projects` |
| **Engines** | `project-costing-engine.ts`, `project-profitability-engine.ts`, `wbs-engine.ts`, `project-revenue-recognition-engine.ts`, `timesheet-engine.ts` |
| **الحالة** | Partial |
| **أثر مالي** | ✅ |

---

## 27. الأسطول (Fleet)

| العنصر | التفاصيل |
|--------|---------|
| **APIs** | `/api/fleet` |
| **الحالة** | Partial |

---

## 28. التكاملات والـ Webhooks

| العنصر | التفاصيل |
|--------|---------|
| **APIs** | `/api/webhooks`, `/api/integrations`, `/api/whatsapp`, `/api/telegram` |
| **Engines** | `webhook-engine.ts`, `ipaas-engine.ts`, `omnichannel-engine.ts` |
| **الصفحات** | `/settings/webhooks`, `/whatsapp-hub` |
| **الحالة** | Active |

---

## 29. SSO والمصادقة

| العنصر | التفاصيل |
|--------|---------|
| **APIs** | `/api/auth/*` |
| **Engines** | `sso-engine.ts`, `mfa-engine.ts` |
| **الصفحات** | `/login`, `/settings/sso`, `/settings/security`, `/admin/security/mfa-policy` |
| **الحالة** | Active |

---

## 30. ICE Panel (لوحة المشغل الرئيسي)

| العنصر | التفاصيل |
|--------|---------|
| **الصفحات** | `/ice/*` — tenants, billing, licenses, support, audit, health, modules |
| **الحالة** | Active |
| **المستخدمون** | مشغّل النظام (SaaS Admin) |

---

## 31. سطح المكتب (Desktop / Offline)

| العنصر | التفاصيل |
|--------|---------|
| **APIs** | `/api/desktop`, `/api/version` |
| **Engines** | `offline-sync-engine.ts`, `mobile-sync-engine.ts`, `pos-sync-engine.ts` |
| **الحالة** | Active |

---

## 32. أقسام صناعية متخصصة (v3)

| القسم | المسار | الحالة |
|-------|--------|--------|
| العيادة والمستشفى | `/v3/clinic` | Partial |
| المطعم | `/v3/restaurant`, `/restaurant-pos` | Partial |
| البيع بالتجزئة | `/v3/retail` | Partial |
| التشييد والمقاولات | `/v3/construction` | Partial |
| التوزيع والنقل | `/v3/distribution` | Partial |
| العقارات | `/v3/realestate` | Partial |
| التعليم والمدارس | `/v3/school`, `/school/*` | Partial |
| الخدمات والأعمال الحرة | `/v3/services` | Partial |
| الصيدليات | `/api/pharmacy` | Backend Only |

---

## 33. الامتثال والحوكمة (GRC / PDPL / Compliance)

| العنصر | التفاصيل |
|--------|---------|
| **الصفحات** | `/admin/grc/*`, `/compliance/*`, `/audit-logs`, `/admin/siem` |
| **Engines** | `governance-engine.ts`, `pdpl-engine.ts`, `incident-response-engine.ts` |
| **APIs** | `/api/admin/siem`, `/api/pdpl` |
| **الحالة** | Partial |

---

## 34. BI وذكاء الأعمال

| العنصر | التفاصيل |
|--------|---------|
| **الصفحات** | `/bi/dashboard`, `/admin/bi-builder` |
| **Engines** | `olap-cube-engine.ts`, `pivot-engine.ts`, `report-builder-engine.ts` |
| **الحالة** | Partial |

---

## 35. الاشتراكات والفوترة (SaaS)

| العنصر | التفاصيل |
|--------|---------|
| **APIs** | `/api/subscriptions`, `/api/subscription-status` |
| **Engines** | `subscription-engine.ts`, `pricing-billing-engine.ts`, `recurring-billing-engine.ts` |
| **الصفحات** | `/subscriptions`, `/subscriptions/plans`, `/ice/billing` |
| **الحالة** | Active |

---

## 36. إدارة المستندات (DMS)

| العنصر | التفاصيل |
|--------|---------|
| **APIs** | `/api/dms`, `/api/system/dms` |
| **الصفحات** | `/dms` |
| **الحالة** | Partial |

---

## 37. التعاقدات والعقود

| العنصر | التفاصيل |
|--------|---------|
| **الصفحات** | `/contracts`, `/contracts/templates` |
| **Engines** | `vendor-contract-engine.ts` |
| **الحالة** | Partial |

---

## 38. الجودة (Quality)

| العنصر | التفاصيل |
|--------|---------|
| **APIs** | `/api/quality` |
| **Engines** | `quality-inspection-engine.ts`, `spc-engine.ts` |
| **الحالة** | Backend Only |

---

## 39. الضمان (Warranty)

| العنصر | التفاصيل |
|--------|---------|
| **APIs** | `/api/warranty` |
| **الصفحات** | `/warranty` |
| **الحالة** | Partial |

---

## 40. التجارة الإلكترونية

| العنصر | التفاصيل |
|--------|---------|
| **APIs** | `/api/ecommerce`, `/api/webhooks/salla`, `/api/webhooks/zid` |
| **الصفحات** | `/b2b/shop`, `/shop` |
| **الحالة** | Partial |

---

## ملحق سريع — Engines المكتشفة (أكثر من 150 engine/service)

تم اكتشاف أكثر من 150 ملف engine أو service في `src/lib/`، أبرزها:

| التصنيف | عدد الـ Engines |
|---------|--------------|
| المالية والمحاسبة | 25+ |
| الموارد البشرية | 20+ |
| المبيعات والتسويق | 15+ |
| المخزون والمستودعات | 12+ |
| التصنيع | 10+ |
| الضرائب والامتثال | 10+ |
| الذكاء الاصطناعي | 8+ |
| التكاملات | 10+ |
| الخزينة | 8+ |
| إدارة السحابة/SaaS | 6+ |

**الإجمالي:** 35 قسماً رئيسياً، 200+ قسم فرعي، 150+ Engine/Service
