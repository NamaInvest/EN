# خريطة الصفحات والمسارات — نظام Nama Invest ERP

> **المصدر:** مستخرج من ملفات المشروع الفعلية — READ ONLY  
> **التاريخ:** 2026-06-03 | **Commit:** c3b50b7c7

---

## المحور الأول: صفحات لوحة التحكم (Dashboard Pages)

| القسم الرئيسي | القسم الفرعي | نوع العنصر | المسار | API مرتبط | Service/Engine | الحالة | وصف |
|---|---|---|---|---|---|---|---|
| لوحة التحكم | الرئيسية | UI Page | `/dashboard` | `/api/dashboard` | — | Active | مؤشرات الأداء الرئيسية |
| لوحة التحكم | BI Dashboard | UI Page | `/bi/dashboard` | `/api/system/dashboard-builder` | `olap-cube-engine.ts` | Partial | تحليلات متقدمة |
| لوحة التحكم | الصحة | UI Page | `/sys/health` | `/api/sys/health` | — | Active | صحة النظام |
| لوحة التحكم | التنبيهات | UI Page | `/sys/alerts` | `/api/sys/alerts` | — | Active | تنبيهات النظام |

---

## المحور الثاني: المبيعات

| القسم الرئيسي | القسم الفرعي | نوع العنصر | المسار | API مرتبط | Service/Engine | الحالة | وصف |
|---|---|---|---|---|---|---|---|
| المبيعات | عروض الأسعار | UI Page | `/sales` | `/api/price-quotes` | `quote-engine.ts` | Active | إنشاء عروض وتحويلها لأوامر |
| المبيعات | أوامر البيع | UI Page | `/sales/orders` | `/api/sales-orders` | `sales.service.ts` | Active | تتبع وإدارة أوامر البيع |
| المبيعات | فواتير البيع | UI Page | `/sales` | `/api/sales` | `sales.service.ts` | Active | إصدار وإدارة الفواتير |
| المبيعات | مرتجعات البيع | UI Page | `/sales/returns`, `/sales-returns` | `/api/sales-returns` | — | Active | إصدار مذكرات إحسان |
| المبيعات | إيصالات التسليم | UI Page | `/sales/delivery-notes` | — | `shipping-engine.ts` | Active | تتبع تسليم البضاعة |
| المبيعات | مذكرات الخصم | UI Page | `/sales/debit-notes` | — | — | Active | خصومات وتسويات |
| المبيعات | التحليلات | UI Page | `/sales/analytics` | `/api/reports` | `reporting-engine.ts` | Active | تحليل أداء المبيعات |
| المبيعات | التوقعات | UI Page | `/sales/forecast` | — | `sales-forecast-engine.ts` | Partial | توقع مبيعات مستقبلية |
| المبيعات | العمولات | UI Page | `/sales/commissions` | — | — | Partial | حساب عمولات فريق البيع |
| المبيعات | الخريطة الذكية | UI Page | `/sales/smart-map` | — | `territory-engine.ts` | Partial | توزيع جغرافي للعملاء |
| المبيعات | المسارات | UI Page | `/sales/routes` | — | — | Partial | مسارات التوزيع |
| المبيعات | الأهداف | UI Page | `/sales/targets` | — | — | Partial | أهداف المبيعات |
| المبيعات | CPQ | UI Page | `/sales/cpq`, `/cpq` | — | `quote-engine.ts` | Disabled | تكوين وتسعير العروض |
| المبيعات | ATP Simulator | UI Page | `/sales/atp-simulator` | — | — | Partial | توفر المنتجات |
| المبيعات | تطبيق النقد | UI Page | `/sales/cash-application` | — | `payment-run-engine.ts` | Partial | مقاصة المدفوعات |
| المبيعات | فواتير متكررة | API Route | — | `/api/recurring-invoices` | `recurring-billing-engine.ts` | Active | فواتير دورية تلقائية |
| المبيعات | كشف العميل | UI Page | `/sales/statements` | — | `open-items.service.ts` | Active | كشف حساب العميل |
| المبيعات | خيارات | UI Page | `/sales/options` | — | — | Partial | خيارات المبيعات |
| المبيعات | الطرفية | UI Page | `/sales/terminal` | — | — | Partial | طرفية تحصيل |

---

## المحور الثالث: نقاط البيع (POS)

| القسم الرئيسي | القسم الفرعي | نوع العنصر | المسار | API مرتبط | Service/Engine | الحالة | وصف |
|---|---|---|---|---|---|---|---|
| POS | واجهة البيع | API Route | — | `/api/pos` | `pos-session-engine.ts` | Active | معالجة عمليات البيع |
| POS | الجلسات | API Route | — | `/api/pos/sessions` | `pos-session-engine.ts` | Active | فتح وإغلاق الورديات |
| POS | Checkout | API Route | — | `/api/pos/checkout` | `pos-session-engine.ts` | Active | إتمام عملية الدفع |
| POS | مزامنة الأوفلاين | Service | — | — | `pos-sync-engine.ts` | Active | عمل بدون إنترنت |
| POS | المحاسب | Service | — | — | `pos-accountant.service.ts` | Active | قيود المبيعات النقدية |
| POS | الورديات | UI Page | `/shifts`, `/shifts/monitor` | `/api/shifts`, `/api/work-shifts` | `shift-schedule-engine.ts` | Active | إدارة ورديات الكاشير |
| POS | الرمز الشريطي | UI Page | `/barcode` | `/api/settings/generate-barcode` | `print-barcode-engine.ts` | Active | طباعة وقراءة الباركود |
| POS | الكوبونات | UI Page | `/coupons` | `/api/promotions` | `promotions-engine.ts` | Partial | خصومات وكوبونات |
| POS | بطاقات الهدايا | API Route | — | `/api/gift-cards` | — | Partial | إدارة بطاقات الهدايا |
| POS | برامج الولاء | API Route | — | `/api/loyalty` | `loyalty-points-engine.ts` | Partial | نقاط المكافآت |
| POS | تطبيقات التوصيل | API Route | — | `/api/delivery-platforms` | — | Partial | إدارة تطبيقات الدليفري |
| POS | مطعم POS | UI Page | `/restaurant-pos` | — | `restaurant-core-engine.ts` | Partial | نقطة بيع المطعم |
| POS | طاولات المطعم | UI Page | `/restaurant-tables` | — | — | Partial | إدارة طاولات المطعم |
| POS | قائمة QR | UI Page | `/qr-menu/[token]` | — | — | Partial | قائمة إلكترونية بالـ QR |
| POS | كشك الحضور | UI Page | `/kiosk/attendance` | `/api/hr` | `tna-engine.ts` | Active | تسجيل حضور موظفين |

---

## المحور الرابع: المشتريات

| القسم الرئيسي | القسم الفرعي | نوع العنصر | المسار | API مرتبط | Service/Engine | الحالة | وصف |
|---|---|---|---|---|---|---|---|
| المشتريات | طلبات الشراء | UI Page | `/purchases` | `/api/purchases` | — | Active | إنشاء وإدارة طلبات الشراء |
| المشتريات | أوامر الشراء | UI Page | `/purchase-orders` | `/api/purchase-orders` | — | Active | إصدار أوامر الشراء |
| المشتريات | GRN | UI Page | `/grn` | `/api/grn` | `inventory.service.ts` | Active | استلام البضاعة والتحقق |
| المشتريات | مرتجعات الشراء | UI Page | `/purchase-returns` | `/api/purchase-returns` | — | Active | إرجاع بضاعة للمورد |
| المشتريات | ثلاثي المطابقة | Service | — | — | `three-way-match-engine.ts` | Active | مطابقة PO/GRN/فاتورة |
| المشتريات | RFQ ومقارنة | Service | — | `/api/supply-chain/rfx-auction` | `rfq-vendor-comparison-engine.ts` | Partial | طلب عروض الأسعار |
| المشتريات | تحليل الإنفاق | Service | — | — | `spend-analytics-engine.ts` | Partial | تحليل مصروفات الشراء |
| المشتريات | OCR الفواتير | UI Page | `/ap/capture` | — | — | Partial | استخراج بيانات الفواتير |
| المشتريات | سلسلة التوريد | UI Page | `/scm`, `/supply-chain` | `/api/supply-chain` | — | Partial | إدارة سلسلة التوريد |
| المشتريات | تأهيل الموردين | UI Page | `/supply-chain/vendor-onboarding` | `/api/supply-chain/vendor-onboarding` | `vendor-onboarding-engine.ts` | Partial | تسجيل وتقييم موردين |

---

## المحور الخامس: المخزون والمستودعات

| القسم الرئيسي | القسم الفرعي | نوع العنصر | المسار | API مرتبط | Service/Engine | الحالة | وصف |
|---|---|---|---|---|---|---|---|
| المخزون | تعديلات المخزون | UI Page | `/stock/adjustments` | `/api/stock/adjustments` | `inventory-adjustment.service.ts` | Active | ضبط الكميات |
| المخزون | حركات المخزون | UI Page | `/stock/movements` | `/api/stock/movements` | — | Active | تتبع كل الحركات |
| المخزون | تحويلات بين مستودعات | UI Page | `/stock-transfers` | `/api/stock-transfers` | `transfer.service.ts` | Active | نقل بضاعة بين مستودعات |
| المخزون | التحويلات الذكية | UI Page | `/smart-transfers` | `/api/smart-transfers` | — | Active | تحويلات تلقائية ذكية |
| المخزون | جرد المخزون | UI Page | `/stocktake` | `/api/stocktake` | — | Active | جرد دوري وتسوية |
| المخزون | جرد بالذكاء الاصطناعي | UI Page | `/stocktake/vision` | `/api/stocktake/vision` | — | Partial | جرد بالكاميرا |
| المستودعات | إدارة المستودعات | UI Page | `/warehouses` | `/api/warehouses` | `wms-engine.ts` | Active | بيانات وإعداد المستودعات |
| المستودعات | خريطة المستودع | UI Page | `/warehouses/map` | — | `inventory-bin-engine.ts` | Partial | خريطة Bin تفاعلية |
| المستودعات | FIFO | UI Page | `/warehouses/fifo` | — | — | Partial | طريقة FIFO |
| المستودعات | WMS موجات الانتقاء | UI Page | `/wms`, `/wms/waves` | `/api/wms/waves` | `wms-wave-engine.ts`, `wms-waves.service.ts` | Active | تنظيم عمليات الانتقاء |
| المستودعات | Cross-Docking | API Route | — | `/api/warehouse/cross-dock` | — | Partial | شحن مباشر بدون تخزين |
| المستودعات | Slotting | API Route | — | `/api/warehouse/slotting` | `slotting-engine.ts` | Partial | تحسين مواقع الأصناف |
| المخزون | Lots & Serial | Service | — | — | `lot-engine.ts`, `serial-batch-tracking-engine.ts` | Active | تتبع بالدفعات والأرقام التسلسلية |
| المخزون | التكلفة الموحدة | Service | — | — | `landed-cost-engine.ts` | Partial | تكلفة الشحن والاستيراد |

---

## المحور السادس: الموارد البشرية

| القسم الرئيسي | القسم الفرعي | نوع العنصر | المسار | API مرتبط | Service/Engine | الحالة | وصف |
|---|---|---|---|---|---|---|---|
| الموارد البشرية | الموظفون | UI Page | `/employees` | `/api/employees` | `hr.service.ts` | Active | بيانات الموظفين |
| الموارد البشرية | الحضور | UI Page | `/attendance` | `/api/hr` | `tna-engine.ts` | Active | تسجيل وتقارير الحضور |
| الموارد البشرية | الإجازات | UI Page | `/vacations` | `/api/vacations` | `leave-engine.ts` | Active | طلبات واعتماد الإجازات |
| الموارد البشرية | مسير الرواتب | UI Page | `/salaries` | `/api/payroll`, `/api/salaries` | `payroll.service.ts` | Active | حساب الرواتب والاستقطاعات |
| الموارد البشرية | الورديات | UI Page | `/shifts`, `/shifts/monitor` | `/api/work-shifts` | `shift-schedule-engine.ts` | Active | جدول ورديات العمل |
| الموارد البشرية | GOSI | Service | — | — | `gosi-engine.ts` | Active | تسجيل ودفع التأمينات |
| الموارد البشرية | نهاية الخدمة | Service | — | — | `saudi-eos-engine.ts` | Active | احتساب مكافأة نهاية الخدمة |
| الموارد البشرية | قيوة | Service | — | — | `qiwa-engine.ts` | Partial | تكامل منصة قيوة |
| الموارد البشرية | مدد | Service | — | — | `mudad-integration-engine.ts` | Partial | تكامل نظام مدد |
| الموارد البشرية | التوظيف | Service | — | — | `recruitment-engine.ts` | Partial | إدارة التوظيف |
| الموارد البشرية | التدريب | UI Page | `/admin/training-compliance` | — | `training-engine.ts` | Partial | تتبع التدريب والشهادات |
| الموارد البشرية | الأداء | Service | — | — | `performance-engine.ts` | Partial | تقييم الأداء |
| الموارد البشرية | التخطيط الوظيفي | Service | — | — | `succession-engine.ts` | Partial | خطة التعاقب الوظيفي |

---

## المحور السابع: الخزينة والبنوك

| القسم الرئيسي | القسم الفرعي | نوع العنصر | المسار | API مرتبط | Service/Engine | الحالة | وصف |
|---|---|---|---|---|---|---|---|
| الخزينة | البنوك | UI Page | `/accounting/banks`, `/banks` | `/api/treasury` | — | Active | إدارة حسابات بنكية |
| الخزينة | المطابقة البنكية | UI Page | `/treasury/bank-recon` | `/api/treasury/bank-recon` | — | Active | مطابقة كشف الحساب |
| الخزينة | استيراد كشف بنكي | UI Page | `/accounting/banks/imports` | `/api/treasury/bank-import` | — | Active | استيراد معاملات البنك |
| الخزينة | الموقف النقدي | UI Page | `/treasury/cash-position` | `/api/treasury/cash-position` | `treasury-cash-position-engine.ts` | Active | موقف نقدي فوري |
| الخزينة | التوقعات النقدية | UI Page | `/treasury/cash-forecast` | `/api/treasury/cash-forecast` | `treasury-forecast.service.ts` | Active | تخطيط التدفق النقدي |
| الخزينة | السيولة | UI Page | `/treasury/liquidity` | `/api/treasury/liquidity` | — | Partial | تحليل السيولة |
| الخزينة | Petty Cash | UI Page | `/treasury/petty-cash` | — | — | Active | صندوق النثريات |
| الخزينة | الشيكات | UI Page | `/treasury/checks` | — | — | Active | إدارة الشيكات |
| الخزينة | دفعات جماعية | UI Page | `/accounting/payment-runs`, `/accounting/payment-runs/create` | — | `payment-run-engine.ts` | Active | تسوية دفعات الموردين |
| الخزينة | SAMA Open Banking | Service | — | — | `sama-open-banking-engine.ts` | Partial | تكامل مع بنوك سعودية |

---

## المحور الثامن: المحاسبة

| القسم الرئيسي | القسم الفرعي | نوع العنصر | المسار | API مرتبط | Service/Engine | الحالة | وصف |
|---|---|---|---|---|---|---|---|
| المحاسبة | القيد اليومي | UI Page | `/accounting/journal`, `/accounting/journal/new` | `/api/accounting/journal` | — | Active | تسجيل وعرض القيود |
| المحاسبة | ميزان المراجعة | UI Page | `/accounting/trial-balance` | `/api/finance` | — | Active | ميزان المراجعة |
| المحاسبة | قائمة الدخل | UI Page | `/accounting/profit-loss` | `/api/reports` | `reporting-engine.ts` | Active | P&L statement |
| المحاسبة | قفل الفترات | UI Page | `/accounting/period-lock` | `/api/fiscal-periods` | `period-lock-engine.ts` | Active | قفل شهر مالي |
| المحاسبة | إغلاق الفترة | UI Page | `/accounting/period-close` | — | `period-close-engine.ts` | Active | إجراءات الإغلاق |
| المحاسبة | إغلاق نهاية السنة | UI Page | `/accounting/year-end-close` | — | `year-end-engine.ts` | Active | إقفال السنة المالية |
| المحاسبة | الإغلاق المالي | UI Page | `/accounting/financial-close` | — | `month-end-close-engine.ts` | Active | إغلاق شامل |
| المحاسبة | Open Items | UI Page | `/accounting/open-items` | `/api/open-items` | `open-items-engine.ts` | Active | الأرصدة المفتوحة |
| المحاسبة | الشركات المتصلة | UI Page | `/accounting/inter-company` | — | `intercompany-engine.ts` | Partial | معاملات بين شركات |
| المحاسبة | تقرير التقادم | UI Page | `/accounting/aging-report` | — | — | Active | تقادم المديونيات |
| المحاسبة | Dunning | UI Page | `/accounting/dunning` | — | — | Partial | متابعة التحصيل |
| المحاسبة | إعادة تقييم العملة | Service | — | `/api/fx` | `fx-revaluation-engine.ts` | Active | FX Revaluation |
| المحاسبة | IFRS16 | Service | — | — | `ifrs16-lease-engine.ts` | Partial | محاسبة عقود الإيجار |
| المحاسبة | متعدد الدفاتر | UI Page | `/accounting/multi-book` | — | `multi-book-engine.ts` | Partial | دفاتر موازية |
| المحاسبة | توحيد القوائم | API Route | — | `/api/accounting/consolidation` | `intercompany-engine.ts` | Active | Consolidation |
| المحاسبة | الإيرادات المؤجلة | UI Page | `/accounting/revenue-recognition` | — | `revenue-recognition-engine.ts` | Partial | توزيع الإيرادات |
| المحاسبة | مراكز الربح | UI Page | `/accounting/profit-centers` | — | `segment-reporting-engine.ts` | Partial | ربحية حسب مركز |

---

## المحور التاسع: الأصول الثابتة

| القسم الرئيسي | القسم الفرعي | نوع العنصر | المسار | API مرتبط | Service/Engine | الحالة | وصف |
|---|---|---|---|---|---|---|---|
| الأصول الثابتة | إدارة الأصول | UI Page | `/assets` | `/api/fixed-assets` | — | Active | قاعدة بيانات الأصول |
| الأصول الثابتة | الأصول (محاسبة) | UI Page | `/accounting/fixed-assets` | `/api/fixed-assets` | — | Active | الإهلاك والتقييم |
| الأصول الثابتة | انخفاض القيمة | Service | — | — | `impairment-engine.ts` | Partial | اختبار الانخفاض |

---

## المحور العاشر: الضرائب والامتثال

| القسم الرئيسي | القسم الفرعي | نوع العنصر | المسار | API مرتبط | Service/Engine | الحالة | وصف |
|---|---|---|---|---|---|---|---|
| الضرائب | ZATCA Phase 2 | UI Page | `/zatca`, `/tax/zatca-onboard` | `/api/zatca` | `zatca-qr-engine.ts`, `zatca-onboarding-engine.ts` | Active | إصدار فواتير إلكترونية |
| الضرائب | ضريبة القيمة المضافة | UI Page | `/tax/vat-returns`, `/vat`, `/accounting/vat-return` | `/api/vat` | — | Active | الإقرار الضريبي الدوري |
| الضرائب | WHT ضريبة الاستقطاع | UI Page | `/tax/wht`, `/wht` | `/api/wht` | `wht-engine.ts` | Active | حساب وتقارير الاستقطاع |
| الضرائب | الزكاة | UI Page | `/tax/zakat`, `/zakat` | `/api/zakat` | `zakat-engine.ts` | Active | احتساب وإقرار الزكاة |
| الضرائب | الاسترداد الضريبي | API Route | — | `/api/zatca/reverse-charge` | — | Active | الضريبة العكسية |
| الامتثال | PDPL | UI Page | `/compliance/pdpl/breaches`, `/compliance/pdpl/dsr` | `/api/pdpl` | `pdpl-engine.ts` | Partial | حماية البيانات الشخصية |
| الامتثال | GRC | UI Page | `/admin/grc/*` | — | `governance-engine.ts` | Partial | الحوكمة والمخاطر |
| الامتثال | SIEM | UI Page | `/admin/siem` | `/api/admin/siem` | — | Active | مراقبة الأمن |
| الامتثال | سجل التدقيق | UI Page | `/audit-logs`, `/admin/grc/audit-log`, `/audit/field-trail` | — | — | Active | سجل كل العمليات |

---

## المحور الحادي عشر: الإعدادات

| القسم الرئيسي | القسم الفرعي | نوع العنصر | المسار | API مرتبط | الحالة | وصف |
|---|---|---|---|---|---|---|
| الإعدادات | بيانات الشركة | UI Page | `/settings/company` | `/api/settings` | Active | بيانات الشركة الأساسية |
| الإعدادات | الأدوار | UI Page | `/settings/roles` | `/api/settings/roles` | Active | تعريف الأدوار |
| الإعدادات | الصلاحيات | UI Page | `/settings/permissions` | `/api/settings/permissions` | Active | إسناد الصلاحيات |
| الإعدادات | العملات | UI Page | `/settings/currencies` | `/api/settings/currencies` | Active | إدارة العملات |
| الإعدادات | الترقيم | UI Page | `/settings/numbering` | `/api/settings/numbering` | Active | تسلسل الأرقام |
| الإعدادات | قوالب الطباعة | UI Page | `/settings/print-templates` | `/api/system/print-templates` | Active | تخصيص الطباعة |
| الإعدادات | ZATCA | UI Page | `/settings/zatca` | `/api/settings/zatca-onboard` | Active | إعداد ZATCA |
| الإعدادات | SSO | UI Page | `/settings/sso` | — | `sso-engine.ts` | Active | تسجيل دخول موحد |
| الإعدادات | Webhooks | UI Page | `/settings/webhooks` | `/api/webhooks` | `webhook-engine.ts` | Active | تكاملات خارجية |
| الإعدادات | WhatsApp | UI Page | `/settings/whatsapp` | `/api/whatsapp` | — | Active | إشعارات واتساب |
| الإعدادات | الأمان / MFA | UI Page | `/settings/security`, `/admin/security/mfa-policy` | — | `mfa-engine.ts` | Active | أمان الحسابات |
| الإعدادات | BPM | UI Page | `/settings/bpm`, `/settings/workflow-builder` | `/api/system/workflow` | `workflow-builder-engine.ts` | Partial | بناء سير العمل |
| الإعدادات | استيراد/تصدير | UI Page | `/settings/import-export` | `/api/system/import-export` | `import-export-engine.ts` | Active | استيراد بيانات |

---

## المحور الثاني عشر: الذكاء الاصطناعي

| القسم الرئيسي | القسم الفرعي | نوع العنصر | المسار | API مرتبط | Service/Engine | الحالة | وصف |
|---|---|---|---|---|---|---|---|
| الذكاء الاصطناعي | توقع الطلب | UI Page | `/ai/demand-forecast` | — | `sales-forecast-engine.ts` | Partial | تنبؤ المبيعات والمخزون |
| الذكاء الاصطناعي | الاستعلام الطبيعي | UI Page | `/ai/nlq` | `/api/explain` | `nlq-engine.ts` | Partial | استعلام بالعربية |
| الذكاء الاصطناعي | مدرب المبيعات | UI Page | `/ai/sales-coach` | — | — | Partial | نصائح فريق البيع |
| الذكاء الاصطناعي | كشف احتيال بنكي | UI Page | `/ai/bank-fraud` | — | — | Partial | كشف معاملات مشبوهة |
| الذكاء الاصطناعي | AI CFO | UI Page | `/ai-cfo` | — | — | Partial | مساعد المدير المالي |
| الذكاء الاصطناعي | AI Copilot | UI Page | `/ai-copilot` | — | `multi-agent-engine.ts` | Partial | مساعد ERP ذكي |
| الذكاء الاصطناعي | AI Auditor | UI Page | `/ai-auditor` | — | — | Partial | مراجعة عمليات تلقائية |
| الذكاء الاصطناعي | AI SCM | UI Page | `/ai-scm` | — | — | Partial | ذكاء سلسلة التوريد |

---

## المحور الثالث عشر: التكاملات الخارجية

| القسم الرئيسي | القسم الفرعي | نوع العنصر | المسار | API مرتبط | Service/Engine | الحالة | وصف |
|---|---|---|---|---|---|---|---|
| التكاملات | Webhooks | UI Page | `/settings/webhooks` | `/api/webhooks` | `webhook-engine.ts` | Active | إشعارات للتطبيقات الخارجية |
| التكاملات | سلة (Salla) | API Route | — | `/api/webhooks/salla` | — | Active | تكامل متجر سلة |
| التكاملات | زد (Zid) | API Route | — | `/api/webhooks/zid` | — | Active | تكامل متجر زد |
| التكاملات | واتساب | UI Page | `/whatsapp-hub` | `/api/whatsapp` | — | Active | إشعارات واتساب |
| التكاملات | تيليجرام | API Route | — | `/api/telegram` | — | Active | بوت تيليجرام للتقارير |
| التكاملات | iPaaS | Service | — | — | `ipaas-engine.ts` | Partial | ربط أنظمة خارجية |

---

## المحور الرابع عشر: سطح المكتب (Desktop)

| القسم الرئيسي | القسم الفرعي | نوع العنصر | المسار | API مرتبط | Service/Engine | الحالة | وصف |
|---|---|---|---|---|---|---|---|
| سطح المكتب | الإصدارات | UI Page | `/updates/desktop` | `/api/version` | — | Active | تحديثات تطبيق الكمبيوتر |
| سطح المكتب | العمل الأوفلاين | Service | — | `/api/desktop` | `offline-sync-engine.ts` | Active | مزامنة البيانات |
| سطح المكتب | POS أوفلاين | Service | — | — | `pos-sync-engine.ts` | Active | بيع بدون إنترنت |
| سطح المكتب | الطباعة QZ | Service | — | — | `print-barcode-engine.ts` | Active | طباعة مباشرة |
| سطح المكتب | الرخصة | API Route | — | `/api/license` | — | Active | فحص وإدارة الترخيص |

---

## المحور الخامس عشر: ICE Panel (لوحة المشغل)

| القسم الرئيسي | القسم الفرعي | نوع العنصر | المسار | الحالة | وصف |
|---|---|---|---|---|---|
| ICE | المستأجرون | UI Page | `/ice/tenants` | Active | إدارة شركات العملاء |
| ICE | الفوترة | UI Page | `/ice/billing` | Active | اشتراكات وفوترة |
| ICE | التراخيص | UI Page | `/ice/licenses` | Active | إدارة تراخيص الوحدات |
| ICE | الدعم | UI Page | `/ice/support` | Active | تذاكر دعم العملاء |
| ICE | التدقيق | UI Page | `/ice/audit` | Active | سجلات المشغل |
| ICE | الصحة | UI Page | `/ice/health` | Active | مراقبة صحة الأنظمة |
| ICE | الوحدات | UI Page | `/ice/modules` | Active | تفعيل وإلغاء الوحدات |
| ICE | الإعدادات | UI Page | `/ice/settings` | Active | إعدادات المشغل |

---

## ملخص إحصائي

| البيان | العدد |
|--------|-------|
| **أقسام رئيسية** | 35+ |
| **أقسام فرعية** | 200+ |
| **صفحات UI (page.tsx)** | 180+ |
| **API Routes** | 150+ |
| **Services/Engines** | 155+ |
| **Active** | ~60% |
| **Partial** | ~30% |
| **Backend Only / Disabled** | ~10% |
