# 14 - خريطة الموديولات الكاملة (Complete Modules Map)

> 167 قسم API + 109 موديول Dashboard + سيناريو الاستخدام

---

## 📊 الإحصائيات الفعلية (محسوبة من النظام)

| النوع | العدد |
|---|---|
| أقسام API | **167** |
| ملفات route.ts | **848** |
| موديولات Dashboard | **109** |
| صفحات (page.tsx) | **491** |

---

## 📚 الموديولات حسب القطاع الأعمالي

### الركيزة 1: المالية والمحاسبة (17 موديول)

| الموديول | المسار | الوصف | الحالة |
|---|---|---|---|
| **شجرة الحسابات** | `/accounting/accounts` | إنشاء وإدارة 88+ حساب SOCPA | ✅ |
| **القيود اليومية** | `/accounting/journal` | إنشاء قيود يدوية + تلقائية + موافقات | ✅ |
| **ميزان المراجعة** | `/accounting/trial-balance` | TB مفصل + مصغر + فترات | ✅ |
| **قائمة الدخل** | `/accounting/profit-loss` | P&L شهري/ربعي/سنوي + مقارنات | ✅ |
| **الميزانية العمومية** | `/finance/balance-sheet` | Assets/Liabilities/Equity | ✅ |
| **التدفقات النقدية** | `/finance/cash-flow` + `/forecast` | فعلي + توقعات (Direct/Indirect) | ✅ |
| **الميزانيات** | `/accounting/budget` + `/finance/budget-planning` | BudgetVsActual | ✅ |
| **مراكز التكلفة** | `/accounting/profit-centers` + `/segments` | Cost/Profit centers | ✅ |
| **الأصول الثابتة** | `/fixed-assets`, `/assets` | الإهلاك + الصيانة + التخريد | 🟡 |
| **العملات المتعددة** | `/finance/fx-revaluation` | FX rates + revaluation | ✅ |
| **الموازنة البنكية** | `/accounting/bank-recon` | Auto-match + manual | ✅ |
| **الخزينة** | `/treasury` | Cash position + petty cash | ✅ |
| **الشيكات** | `/treasury/checks` | Received/issued + clearing | ✅ |
| **اعتمادات بنكية (LC)** | `/accounting/lc` + `/purchases/letters-of-credit` | LC management | 🟡 |
| **AI CFO** | `/ai-cfo` | تحليل مالي ذكي بـ Gemini | ✅ |
| **AI Bank** | `/ai-bank` | تصنيف معاملات بنكية | ✅ |
| **AI Auditor** | `/admin/grc` + `/api/ai-auditor` | تدقيق آلي يومي | ✅ |

### الركيزة 2: المبيعات والـ POS (13 موديول)

| الموديول | المسار | الوصف | الحالة |
|---|---|---|---|
| **POS** | `/pos` | نقطة بيع شاملة (Retail) | ✅ |
| **POS مطعم** | `/restaurant-pos`, `/restaurant-tables` | KDS + Table Map | ✅ |
| **عروض الأسعار** | `/price-quotes`, `/sales/cpq` | Quote → Convert to Order | ✅ |
| **أوامر البيع** | `/sales/orders` | SO → DN → Invoice | ✅ |
| **فواتير المبيعات** | `/sales` | B2B + B2C + ZATCA | ✅ |
| **مرتجعات البيع** | `/sales-returns`, `/sales/returns/rma` | RMA workflow | ✅ |
| **إشعارات مدينة/دائنة** | `/sales/debit-notes` | Credit/Debit Notes + ZATCA | ✅ |
| **العمولات** | `/sales/commissions` | حساب عمولات المندوبين | ✅ |
| **الفواتير المتكررة** | `/recurring-invoices` | Subscriptions + Auto-billing | ✅ |
| **التقسيط** | `/installments`, `/bnpl` | Internal + Tabby + Tamara | ✅ |
| **برامج الولاء** | `/loyalty` | Points + Tiers | ✅ |
| **القسائم** | `/coupons` | Discount codes | ✅ |
| **بطاقات الهدايا** | `/gift-cards` | Gift cards management | ✅ |
| **الترويج** | `/promotions` | Promo rules | ✅ |
| **التجارة الإلكترونية** | `/ecommerce/dashboard` + `/stores` | Salla + Zid integration | ✅ |
| **CRM** | `/crm` (8+ sub-pages) | Leads + Opportunities + 360 View | ✅ |

### الركيزة 3: المشتريات (8 موديول)

| الموديول | المسار | الوصف | الحالة |
|---|---|---|---|
| **طلبات الشراء (PR)** | `/purchases/requisitions` | Internal request → Approval | ✅ |
| **عروض الموردين (RFQ)** | `/procurement/rfq` | RFx auction | ✅ |
| **أوامر الشراء (PO)** | `/purchase-orders`, `/purchases/orders` | PO management | ✅ |
| **استلام البضائع (GRN)** | `/grn`, `/purchases/grn` | Receipt + Quality | ✅ |
| **فواتير الشراء** | `/purchases` | + AI OCR | ✅ |
| **مرتجعات الشراء** | `/purchase-returns` | Return to vendor | ✅ |
| **بوابة الموردين** | `/vendor-portal`, `/procurement/vendor-portal` | Self-service portal | 🟡 |
| **تقييم الموردين** | `/procurement/vendor-scorecard` | KPI scoring | ✅ |
| **عقود الموردين** | `/procurement/supplier-contracts`, `/contracts` | Contract lifecycle | ✅ |
| **مطابقة ثلاثية** | `/purchases/three-way-match` | PO ↔ GRN ↔ Invoice | ✅ |

### الركيزة 4: المخزون والمستودعات (14 موديول)

| الموديول | المسار | الوصف | الحالة |
|---|---|---|---|
| **المنتجات** | `/products` | Master + Variants + Units | ✅ |
| **التصنيفات** | `/products/categories` (via products) | شجرة الفئات | ✅ |
| **وحدات القياس** | إعدادات | Base + Multi-pack | ✅ |
| **المستودعات** | `/warehouses`, `/inventory/wms` | مناطق + Bins | ✅ |
| **حركات المخزون** | `/stock/movements`, `/inventory/movements` | كل حركة بمصدر | ✅ |
| **التسويات** | `/stock/adjustments` | Adjust + reason | ✅ |
| **التحويلات** | `/stock-transfers`, `/inventory/picking` | Inter-warehouse | ✅ |
| **الجرد** | `/stocktake`, `/inventory/stocktake/cycle` | Full + Cycle count | ✅ |
| **AI Vision Stocktake** | `/stocktake/vision`, `/inventory/ai-vision` | جرد بصري | ✅ |
| **الباركود** | `/barcode` | Print + Scan | ✅ |
| **الباتشات (Lots)** | `/batches` | FEFO + Expiry tracking | ✅ |
| **الأرقام التسلسلية** | `/inv/serials` | Serial tracking | ✅ |
| **التحويلات الذكية** | `/smart-transfers` | AI suggestions | ✅ |
| **تنبيهات النقص** | `/warehouses/alerts` | Reorder alerts | ✅ |

### الركيزة 5: التصنيع (13 موديول)

| الموديول | المسار | الوصف | الحالة |
|---|---|---|---|
| **BOM** | `/manufacturing/boms`, `/bom` | Recipe + Operations | ✅ |
| **أوامر التصنيع (MO)** | `/manufacturing/orders` | MO lifecycle | ✅ |
| **MRP** | `/manufacturing/mrp-engine`, `/mrp-dashboard` | Material planning | 🟡 |
| **القدرات (Capacity)** | `/manufacturing/capacity` | Resource planning | 🟡 |
| **مراكز العمل** | `/manufacturing/work-centers` | Machine scheduling | ✅ |
| **التوجيه (Routing)** | `/manufacturing/routing` | Operation flow | ✅ |
| **OEE** | `/manufacturing/oee`, `/mes-oee` | Equipment efficiency | 🟡 |
| **Shopfloor** | `/shopfloor` | Real-time floor view | 🟡 |
| **الإهدار** | `/manufacturing/scrap` | Wastage tracking | ✅ |
| **التكلفة المعيارية** | `/manufacturing/standard-cost`, `/variance` | Std vs Actual | 🟡 |
| **مراقبة الجودة (QC)** | `/manufacturing/quality`, `/qc`, `/quality` | Inspections | ✅ |
| **CAPA** | `/manufacturing/capa` | Corrective Actions | 🟡 |
| **الصيانة (CMMS)** | `/cmms`, `/maintenance`, `/maintenance/preventive` | PM/CM/PdM | ✅ |

### الركيزة 6: الموارد البشرية والرواتب (21 موديول)

| الموديول | المسار | الوصف | الحالة |
|---|---|---|---|
| **الموظفون** | `/hr` (35+ pages), `/employees` | Master + Org chart | ✅ |
| **شجرة المنشأة** | `/hr/org-chart` | تنظيمي | ✅ |
| **الحضور** | `/hr/attendance`, `/attendance` | Face-ID + Manual | ✅ |
| **AI Face-ID** | `/hr/ai-enrollment`, `/api/attendance/face-id` | Auto recognition | ✅ |
| **الورديات** | `/shifts`, `/shifts/monitor` | Shift scheduling | ✅ |
| **الإجازات** | `/hr/leaves`, `/vacations` | Approval workflow | ✅ |
| **السلف والقروض** | `/hr/loans` | Employee loans | ✅ |
| **الرواتب** | `/payroll`, `/salaries`, `/hr/payroll` | Calc + Run | ✅ |
| **تكوين الرواتب** | `/hr/payroll/config` | Salary structure | ✅ |
| **قسائم الرواتب** | `/hr/payslip` | PDF + Email | ✅ |
| **WPS** | `/hr/wps`, `/payroll/wps` | SIF generation | ✅ |
| **GOSI** | `/hr/gosi` | Monthly file | ✅ |
| **EOS** | `/hr/eos` | Article 84-85 | ✅ |
| **مدد** | `/hr/mudad` | Wage Protection Portal | 🟡 |
| **قوى (Qiwa)** | `/hr/qiwa` | Labor Ministry | 🟡 |
| **السعودة** | `/hr/saudization`, `/nitaqat-simulator` | Nitaqat compliance | 🟡 |
| **التدريب** | `/hr/training`, `/lms`, `/lms/courses` | Training + LMS | 🟡 |
| **الأداء** | `/hr/performance`, `/evaluations` | KPI evaluation | 🟡 |
| **التوظيف** | `/hr/recruitment`, `/jobs` | Job postings | 🟡 |
| **الخدمة الذاتية** | `/hr/self-service`, `/portal` | Employee portal | 🟡 |
| **تقارير الوقت** | `/hr/timesheet` | Time tracking | ✅ |

### الركيزة 7: الأصول الثابتة (4 موديول)

| الموديول | المسار | الوصف | الحالة |
|---|---|---|---|
| **سجل الأصول** | `/fixed-assets`, `/assets` | Asset register | ✅ |
| **الإهلاك** | `/finance/assets` | SL/DDB/Units | ✅ |
| **النقل والإيجار** | `/fixed-assets` | Transfer + Lease | 🟡 |
| **التخريد والبيع** | (via finance) | Disposal + Gain/Loss | 🟡 |

### الركيزة 8: الخزينة والبنوك (8 موديول)

| الموديول | المسار | الوصف | الحالة |
|---|---|---|---|
| **حسابات البنوك** | `/accounting/banks`, `/treasury/bank-recon` | Bank accounts | ✅ |
| **المعاملات البنكية** | `/treasury/bank-statements` | Transactions | ✅ |
| **الموازنة البنكية** | `/treasury/bank-reconciliation`, `/finance/bank-recon` | Auto-match | ✅ |
| **التدفق النقدي** | `/treasury/cash-flow`, `/cash-position` | Position view | ✅ |
| **التوقعات النقدية** | `/treasury/cash-forecast`, `/finance/cash-flow/forecast` | Forecasting | ✅ |
| **العهد (Petty Cash)** | `/treasury/petty-cash`, `/fng/petty-cash-funds` | Petty cash | ✅ |
| **الشيكات** | `/treasury/checks` | Check management | ✅ |
| **السيولة** | `/treasury/liquidity` | Liquidity ratios | ✅ |

### الركيزة 9: الإدارة والإعدادات (12 موديول)

| الموديول | المسار | الوصف | الحالة |
|---|---|---|---|
| **الإعدادات العامة** | `/settings` (15+ pages) | Company + Branding | ✅ |
| **الأدوار** | `/settings/roles`, `/permissions/fields` | RBAC | ✅ |
| **سير الموافقات** | `/settings/approvals`, `/settings/bpm` | Workflow | ✅ |
| **القوالب** | `/settings/print-templates` | Invoice templates | ✅ |
| **التسلسلات** | `/settings/number-sequences`, `/numbering` | Document numbering | ✅ |
| **الحقول المخصصة** | `/settings/custom-fields` | Custom attributes | 🟡 |
| **استيراد/تصدير** | `/settings/import-export` | Excel import | ✅ |
| **ZATCA** | `/settings/zatca`, `/tax/zatca-onboard` | CSID onboarding | ✅ |
| **WhatsApp** | `/settings/whatsapp` | Bot config | ✅ |
| **SSO** | `/settings/sso` | SSO config | ✅ |
| **الأمان** | `/settings/security`, `/admin/security/mfa-audit` | MFA + Audit | ✅ |
| **الأتمتة** | `/settings/workflow-builder`, `/settings/state-machine` | No-code workflows | 🟡 |

### الركيزة 10: الذكاء الاصطناعي (9 ميزات)

| الميزة | المسار | الوظيفة | النموذج |
|---|---|---|---|
| **AI Copilot** | `/ai-copilot`, `AICopilotButton` | مساعد ذكي شامل | Gemini 2.0-flash |
| **AI CFO** | `/ai-cfo`, `/api/ai-cfo` | تحليل مالي يومي | Gemini 2.5-flash |
| **AI Bank Analyzer** | `/ai-bank`, `/api/ai/bank-reconciliation` | تصنيف معاملات | Gemini |
| **AI Auditor** | `/api/ai-auditor` (cron) | تدقيق آلي يومي + Telegram | Gemini 2.5-flash |
| **AI OCR Purchases** | `/purchases` + OCR | استخراج فواتير | Gemini Vision |
| **AI Vision Inventory** | `/inventory/ai-vision` | جرد بصري | Gemini Vision |
| **AI Fraud Detection** | `/api/ai/fraud-monitoring`, `/api/ai/bank-fraud` | كشف الشذوذ | Gemini |
| **AI NLQ** | `/api/ai/nlq` | استعلام بالعربي | Regex + LLM |
| **AI Sales Coach** | `/api/ai/sales-coach` | تدريب المندوبين | Rule-based + LLM |
| **AI Demand Forecast** | `/api/ai/demand-forecast` | توقع الطلب | Statistical |
| **AI SCM** | `/ai-scm`, `/api/ai/predictive-scm` | سلسلة إمداد ذكية | Predictive |

### الركيزة 11: التقارير والـ BI (10 موديول)

| الموديول | المسار | الوصف | الحالة |
|---|---|---|---|
| **مركز التقارير** | `/reports` (20+ reports) | جميع التقارير | ✅ |
| **بناء التقارير** | `/reports/builder`, `/reports/kpi-builder` | Custom reports | 🟡 |
| **Pivot Tables** | `/reports/pivot` | Pivot analysis | 🟡 |
| **BI Dashboard** | `/bi/dashboard`, `/reports/bi-cube` | Interactive dashboards | ✅ |
| **التقارير المجدولة** | `/api/cron/scheduled-reports` | Auto-email reports | ✅ |
| **تقارير المبيعات** | جزء من /reports | Sales analytics | ✅ |
| **تقارير الأعمار** | `/reports/aging` | AR/AP aging | ✅ |
| **تقرير الفوترة المتأخرة** | `/reports/cashflow` | Overdue invoices | ✅ |
| **تقرير الانحرافات** | `/reports/budget-variance` | Budget variance | ✅ |
| **تقارير الامتثال** | `/reports/zatca-vat` | ZATCA + VAT | ✅ |

### الركيزة 12: الحلول القطاعية (Vertical Solutions) — 11 قطاع

| القطاع | المسار | المميزات | الحالة |
|---|---|---|---|
| **الصيدلية** | `/pharmacy`, `/pharmacy/manager`, `/drug-interact` | Drugs + Prescriptions + Drug interactions | ✅ |
| **العيادة** | `/clinic`, `/clinic/appointments`, `/erx`, `/lab`, `/v3/clinic` | EMR + Appointments + eRx + Lab | ✅ |
| **المدرسة** | `/school` (6+ pages), `/v3/school` | SIS + Gradebook + Attendance | ✅ |
| **المطعم** | `/restaurant-pos`, `/restaurant-tables` | Table Map + KDS | ✅ |
| **التجزئة** | `/pos`, `/v3/retail` | POS + Loyalty | ✅ |
| **التصنيع** | `/manufacturing`, `/v3/manufacturing` | كما أعلاه | ✅ |
| **التوزيع** | `/v3/distribution` | Picking waves + Routes | 🟡 |
| **العقارات** | `/rem`, `/rent`, `/rental`, `/v3/realestate` | Leases + CAM | 🟡 |
| **الإنشاءات** | `/v3/construction` | BOQ + Progress billing | 🟡 |
| **الخدمات** | `/v3/services`, `/field-service`, `/fsm` | SLA + Timesheet + Workorders | ✅ |
| **الأسطول** | `/fleet`, `/fleet/fuel`, `/maintenance`, `/trips` | Vehicle tracking | ✅ |

### الركيزة 13: التكاملات (12+ تكامل)

| التكامل | المسار | الوصف | الحالة |
|---|---|---|---|
| **ZATCA** | `/api/zatca/**` (8 routes) | E-invoicing Phase 2 | ✅ |
| **Salla** | `/api/webhooks/salla` | E-commerce | ✅ |
| **Zid** | `/api/webhooks/zid` | E-commerce | ✅ |
| **WhatsApp Web** | `/api/whatsapp`, worker | Customer service | ✅ |
| **WhatsApp Business** | `/api/whatsapp/interactive` | Approvals via WA | ✅ |
| **Telegram Bot** | `/api/telegram` | Admin commands | ✅ |
| **Tabby** | `/api/bnpl/tabby` | BNPL | 🟡 |
| **Tamara** | `/api/bnpl/tamara` | BNPL | 🟡 |
| **Mudad** | `/api/saudi/mudad` | WPS portal | 🟡 |
| **Qiwa** | `/api/saudi/qiwa` | Labor portal | 🟡 |
| **GOSI** | `/api/payroll/gosi` | Social Insurance | 🟡 |
| **Clerk** | Various | Identity provider | ✅ |
| **Sentry** | `next.config.ts` | Error tracking | ✅ |
| **Gemini AI** | كل الـ AI features | LLM | ✅ |

### الركيزة 14: الإدارة المركزية (Master) — 4 موديول

| الموديول | المسار | الوصف | الوصول |
|---|---|---|---|
| **Master Panel** | `/master-panel`, `/api/master-panel-data` | لوحة مالك المنصة | owner فقط |
| **ICE Admin** | `/ice` (super admin), `/api/ice/**` (16 routes) | إدارة المستأجرين | super admin |
| **Tenant Provisioning** | `/api/tenant/provision` | إنشاء مستأجرين | public (مع clerkUserId) |
| **License Manager** | `/api/master-panel/licenses` | تراخيص الديسكتوب | owner |

### الركيزة 15: الديسكتوب والـ Mobile (Electron + PWA)

| الميزة | الوصف | الحالة |
|---|---|---|
| **Desktop App** | Electron app + embedded PostgreSQL | ✅ |
| **License Heartbeat** | يتحقق كل 24 ساعة | ✅ |
| **Hardware Binding** | Hardware ID lock | ✅ |
| **Auto-update** | electron-updater | ✅ |
| **Code Protection** | obfuscation + ASAR + integrity | ✅ |
| **PWA** | manifest + service worker | ✅ |
| **Offline POS** | `/pos/offline` | 🟡 |

---

## 🎯 الموديولات الأكثر استخداماً (Top 20 by sub-pages)

| الترتيب | الموديول | عدد الصفحات الفرعية |
|---|---|---|
| 1 | accounting | 99 |
| 2 | finance | 72 |
| 3 | manufacturing | 40 |
| 4 | hr | 39 |
| 5 | cron | 29 |
| 6 | crm | 23 |
| 7 | auth | 23 |
| 8 | settings | 23 |
| 9 | sales | 21 |
| 10 | inventory | 18 |
| 11 | procurement | 17 |
| 12 | v3 | 17 |
| 13 | ice | 16 |
| 14 | purchases | 16 |
| 15 | pos | 13 |
| 16 | ai | 13 |
| 17 | system | 12 |
| 18 | treasury | 12 |
| 19 | admin | 12 |
| 20 | reports | 11 |

---

## 🎁 ميزات إضافية متناثرة

| الميزة | المسار | الوصف |
|---|---|---|
| **التوقيع الإلكتروني** | `/esign` | E-signatures |
| **DMS** | `/dms` | Document management |
| **Knowledge Base** | `/knowledge`, `/knowledge/articles` | Internal wiki |
| **Help Desk** | `/support`, `/support/help-desk` | Ticketing |
| **التقويم** | `/calendar` | Events + scheduling |
| **الحجوزات** | `/bookings`, `/bookings/calendar` | Service bookings |
| **Marketing** | `/marketing`, `/marketing/analytics` | Campaigns |
| **GRC** | `/admin/grc` | Governance, Risk, Compliance |
| **SIEM** | `/admin/siem` | Security monitoring |
| **PDPL** | `/compliance/pdpl/breaches`, `/dsr` | Data protection |

---

## 📐 معايير التصنيف

- ✅ **منفذ بالكامل** — جاهز للإنتاج
- 🟡 **جزئي** — يعمل لكن يحتاج تحسينات أو ميزات إضافية
- ❌ **ناقص** — placeholder أو غير منفذ
- 🚧 **قيد التطوير** — قيد الإنشاء حالياً

> **ملاحظة:** هذه التقديرات استرشادية ومستندة على وجود الـ routes والـ pages، وليست بالضرورة تعكس جودة كل ميزة.
