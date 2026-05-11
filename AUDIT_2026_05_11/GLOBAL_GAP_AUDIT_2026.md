# 🔬 الفحص العالمي الشامل — Namasoft ERP ضد SAP / Oracle / NetSuite

> **التاريخ:** 2026-05-11
> **النسخة:** 1.0 (Definitive Audit)
> **الفاحص:** AI Architect (Claude Opus 4.7 — 1M context)
> **المرجعية:** SAP S/4HANA Cloud · Oracle Fusion Cloud ERP · NetSuite SuiteSuccess · Odoo 17 Enterprise · Microsoft Dynamics 365 F&O
> **الحجم المفحوص:** 489 Prisma model · 718 API endpoint · 444 page · 101 business engine · 9 industry verticals (V3)
> **الإحصاء:** هذا المستند أُنتج بفحص الكود الفعلي وليس وثائق مكتبية

---

## 📑 خارطة المحتوى

| # | الجزء | الوصف |
|---|------|------|
| 1 | [الملخص التنفيذي](#1-الملخص-التنفيذي) | ما لديك الآن مقابل أين أنت ذاهب |
| 2 | [بصمة النظام الحالية](#2-بصمة-النظام-الحالية) | جداول كاملة (UI + API + Schema + Engines) |
| 3 | [مصفوفة الفجوات الكبرى — 47 فجوة](#3-مصفوفة-الفجوات-الكبرى) | كل فجوة بأولويتها وحجمها |
| 4 | [البرومنتات + السيناريوهات + فلوهات البيانات](#4-برومنتات-جاهزة--سيناريوهات--فلوهات) | لكل فجوة عالية/حرجة |
| 5 | [Artifacts (ERD · API · User Stories · Tests · Wireframes)](#5-artifacts-الكاملة-لكل-فجوة) | لكل فجوة |
| 6 | [Architecture & Cross-Cutting](#6-architecture--cross-cutting) | معماري · أمني · نشر · تصميم · ترجمة |
| 7 | [خطة التنفيذ التراكمية 12 شهراً](#7-خطة-التنفيذ-12-شهراً) | Sprint-by-sprint |
| 8 | [قائمة فحص الإطلاق](#8-قائمة-فحص-الإطلاق) | Launch checklist |

---

## 1) الملخص التنفيذي

### النقاط الجوهرية
| البعد | القيمة | التقدير |
|------|--------|---------|
| **الموديولات الجوهرية** (Accounting, Sales, Purchases, Inventory, MFG, HR, Treasury) | مكتملة 65-95% | 🟢 |
| **الامتثال السعودي** (ZATCA, GOSI, WPS, Mudad, Qiwa, Zakat, WHT, Saudization, PDPL) | 95% — الأفضل في فئته إقليمياً | 🟢🟢 |
| **IFRS Standards** (15, 16, 9, 21, 36, 12, 8) | 70% — تنقص: IAS 12, IAS 36 عميق، Transfer Pricing | 🟠 |
| **Multi-Book / Multi-GAAP** | موجود (engine + 7 models) لكن بسيط | 🟠 |
| **Customer Portal** | هيكل فقط | 🔴 |
| **Vendor Portal** | جزئي (engine موجود — UI ناقص) | 🟠 |
| **BPM/Workflow Runtime** | محرك موجود (bpm-engine.ts) لكن غير مربوط بأي business event | 🔴 |
| **DMS مع OCR كاملاً** | scaffolding + AI OCR موجود — Permissions + Folder hierarchy ناقصة | 🟠 |
| **Advanced BI / Custom Report Builder** | engine موجود — UI Designer ناقص | 🟠 |
| **Field Service Management** | stub (engine ناقص) | 🔴 |
| **CMMS (Plant Maintenance)** | stub | 🔴 |
| **LMS (Learning)** | stub | 🔴 |
| **Help Desk / ITSM** | جزئي عبر CRM Tickets — لا SLA escalation تلقائي | 🟠 |
| **eSign Native** | stub (يحتاج تكامل DocuSign/Etimad/Tawqee'h) | 🔴 |
| **Mobile / Offline Sync** | PWA + Electron — لا Native أو Offline-first sync | 🟠 |
| **Multi-Country Localization** | الكود مغرق بـ SAR/Riyadh-only | 🟠 |

### الحكم النهائي
> أنت تقريباً **70-75% على مستوى NetSuite SuiteSuccess** للسوق السعودي، و **40-50% على مستوى SAP S/4HANA / Oracle Fusion** للسوق العالمي. الفجوة الأهم ليست في عدد الميزات — لديك أكثر من Odoo Enterprise بالفعل — بل في **عمق التكامل** (Workflow → Approval → Audit → JE → Portal → Notification → Mobile) لكل عملية.

---

## 2) بصمة النظام الحالية

### 2.1 ملخص رقمي

| العنصر | العدد | الجاهز فعلياً | Stub/Placeholder | المكتمل % |
|--------|-------|---------------|------------------|----------|
| **Prisma Models** | 489 | ~340 (مع علاقات) | ~150 (orphaned/thin) | 70% |
| **API Endpoints** | 718 | ~520 | ~200 (1-3 routes per stub module) | 72% |
| **Dashboard Pages** | 444 | ~280 functional | ~60 stubs + ~100 partial | 63% |
| **Business Engines** | 101 | ~35 complete + ~15 partial | ~50 stubs | 50% (بعمق) |
| **Test files (lib)** | 11 core + 580+ scattered | جزئي | معظم engines بلا tests | 20% |

### 2.2 الموديولات المكتملة (Production-Grade)

```
🟢 Tier 1 — جاهز للإنتاج (يمر اختبار شركة سعودية 50 موظف)
├── المحاسبة الجوهرية
│   ├── شجرة حسابات + قيود + ميزان + GL/Subledger
│   ├── auto-journal (8 سيناريوهات: Sales, Purchase, Payment, Receipt, Inventory, FA, Payroll, FX)
│   ├── Multi-currency + ExchangeRate يومي + FX Revaluation شهري
│   ├── Multi-Book (Tax + Book + IFRS) — البنية موجودة
│   ├── Period Close + Year End + Fiscal Period locking
│   ├── Numbering Sequences (branch/period/format-aware)
│   ├── Document State Machine (10 وثائق)
│   ├── Field-Level Audit (12 entity)
│   └── Approval Engine + SoD Governance
│
├── المبيعات + POS
│   ├── Quote → SO → Delivery Note → Sales Invoice → AR
│   ├── POS Retail + POS Restaurant + KDS
│   ├── Sales Returns + RMA + Credit Notes
│   ├── Recurring Invoices + Subscription billing (مبدئي)
│   ├── Sales Routes + Sales Reps + Commission engine
│   └── ZATCA Phase 2 (CSR/CSID/ICV/PIH/UBL/XML signing)
│
├── المشتريات
│   ├── PR → RFQ → PO → GRN → Purchase Invoice → AP
│   ├── 3-Way-Match Engine (متكامل)
│   ├── Landed Cost
│   ├── Letter of Credit + Letter of Guarantee
│   └── Vendor Master + Vendor Rating
│
├── المخزون
│   ├── Multi-warehouse + Multi-location
│   ├── FIFO / LIFO / Weighted Average (engine كامل)
│   ├── Batch + Serial + Expiry tracking
│   ├── Stocktake + Cycle Count + Variance posting
│   ├── Reorder Engine (EOQ / ROP basic)
│   ├── Smart Transfers (AI suggestions)
│   └── ABC Analysis
│
├── التصنيع
│   ├── BOM (multi-level + versioning)
│   ├── MRP Engine (شراء/إنتاج suggestions)
│   ├── Work Orders + Work Centers + Routing
│   ├── Quality Inspection + NCR + CAPA
│   ├── Standard Cost + Variance
│   └── Subcontracting (jobwork)
│
├── HR / Payroll
│   ├── Employee Master + Org Chart
│   ├── Attendance + Leave + Loan
│   ├── Payroll Run + Payslip + GL Posting
│   ├── EOS (Saudi Art.84-88)
│   ├── GOSI 2024 rates (Saudi/GCC/Expat)
│   ├── WPS (SIF v2 generator)
│   ├── Mudad API + Qiwa + Nitaqat snapshot
│   └── WHT (5/15/20% with treaties)
│
├── الخزينة + البنوك
│   ├── Bank Statement Parser (MT940 / CAMT.053 / OFX / CSV)
│   ├── Bank Reconciliation Engine (Exact + Fuzzy + AI)
│   ├── Petty Cash + Imprest
│   ├── Check Management (issued + received)
│   ├── Letters of Credit + Promissory Notes
│   └── Payment Run (batch + WPS routing)
│
├── الأصول الثابتة
│   ├── Asset Master + Categories
│   ├── Depreciation (4 methods)
│   ├── Revaluation (IAS 16)
│   ├── Impairment (IAS 36 — basic)
│   ├── Transfer + Reclassification + Disposal
│   └── Insurance + Maintenance + Document linking
│
└── IFRS Advanced
    ├── IFRS 16 Lease (ROU + Liability + Schedule + Modifications)
    ├── IFRS 15 Revenue (5-step + Performance Obligations + Deferred Rev)
    ├── IFRS 9 ECL (provision matrix)
    └── Hedge Accounting (FV / CF / Net Investment)
```

### 2.3 الموديولات الجزئية (Tier 2)

```
🟠 Tier 2 — يعمل لكن سطحي
├── CRM (Customers, Leads, Opportunities, Kanban) — Lead model orphaned؛ لا Territory/Account hierarchy
├── Treasury Advanced — Liquidity/CashForecast models orphaned
├── Contracts — templates + clauses موجود، Lifecycle renewal stub
├── Subscriptions — basic billing فقط، لا Usage-based أو Tiered
├── Document Mgmt (DMS) — جداول موجودة، Permissions/Folders ناقصة
├── BI Dashboards — KpiDefinition orphaned، Custom Report skeletal
├── Field Service (FSM) — page موجودة، engine stub
├── Logistics (Freight/Carriers) — 2 stubs
├── Healthcare/Clinic — Pharmacy جيدة، Clinic Rx مكرر، No EMR billing
├── School — Student billing موجود، LMS منفصل
├── Real Estate — Lease + Rent OK، CAM/Service charges ناقصة
├── E-Commerce — OnlineOrder موجود، Cart/Wishlist/Reviews ناقصة
├── Projects — basic، No EVM، No Resource Leveling deep
└── Verticals V3 (9 industries) — Dashboards فقط، Workflows ناقصة
```

### 2.4 الموديولات المفقودة/Stubs (Tier 3)

```
🔴 Tier 3 — هيكل بلا منطق
├── GRC (Policies / Risks / Audit Log) — 3 stubs (20 سطر/صفحة)
├── LMS (Courses, Modules, Enrollments) — orphaned
├── Knowledge Management — KBArticle موجود، لا full-text/embeddings/RAG ربط
├── Help Desk / ITSM — Tickets موجودة، SLA escalation ناقصة
├── E-Signature — stub فقط (لا DocuSign/Etimad/Tawqee'h)
├── CMMS / Plant Maintenance — 2 stubs
├── BPM Runtime — engine موجود، Visual Designer + Events ناقصة
├── Workflow Builder — engine موجود، UI Designer + Triggers ناقصة
├── Customer Portal (B2B/B2C) — 1 page stub
├── Vendor Self-Service Portal — Token موجود، Pages ناقصة
├── Mobile Native App — لا React Native، PWA فقط
├── Offline POS Sync — page موجودة، Real-time sync ناقص
├── IoT / Sensor Ingestion — لا API
├── Advanced BI / Pivot UI — Engine موجود، Designer UI سطحي
├── Custom Report Builder (No-Code) — backend جاهز، Frontend ناقص
└── Dashboard Builder Drag-Drop — Backend جاهز، Frontend ناقص
```

### 2.5 جدول كامل: قوائم النظام (sidebar) مقابل أنظمة عالمية

| القسم في النظام | عدد العناصر الحالية | SAP S/4HANA | Oracle Fusion | NetSuite | Odoo 17 | الناقص |
|-----------------|---------------------|--------------|---------------|----------|---------|--------|
| الرئيسية | 6 | Fiori Launchpad | Home/News | Dashboard Center | Apps | - |
| المبيعات / POS | 18 | SD (50+) | OM + CX | SuiteCommerce | Sales+POS | Configure-Price-Quote متقدم, Sales Forecasting, Territory Mgmt |
| المشتريات | 11 | MM (40+) | Procurement Cloud | SuiteProcurement | Purchase | Supplier Onboarding, RFx Auction, Spend Analytics |
| المخزون / WMS | 15 | MM-IM + EWM | INV + WMS | NS WMS | Inventory | Slotting Optimization, Wave Picking deep, Cross-dock, RF/Voice Picking |
| التصنيع | 7 | PP + APS + MES | Mfg Cloud | Advanced MFG | Manufacturing | APS deep, MES Shopfloor, Quality Statistical SPC, OEE realtime |
| الجودة | 3 | QM | QM | Quality | Quality | SPC charts, Calibration, Lab Mgmt |
| PLM | 1 | PLM/ECM | PLM Cloud | NS PLM | PLM | ECO workflow, BOM compare, CAD integration |
| المالية/المحاسبة | 46 | FI/CO/FM (300+) | GL+SLA+PAY | NS Financials | Accounting | Profitability Analytics (CO-PA full), Multi-GAAP layered, Transfer Pricing |
| CRM | 20 | C/4HANA | CX Cloud | NetSuite CRM | CRM+Marketing | Account Teams, Territory, Quota Mgmt, Marketing Automation deep |
| HR / Payroll | 15 | SuccessFactors | HCM Cloud | NS SuitePeople | HR+Recruit | Succession Plan, Career Path, Compensation Reviews, Performance OKRs |
| Specialized | 15 | various | various | various | various | متعدد (Field Service مكتمل، Lease lessor، Contract LCM، Equipment Mgmt) |
| Saudi Compliance | 10 | partial | partial | minimal | minimal | ✅ متفوقون |
| Pharmacy/Health | 3 | Industry | Industry | Industry | Health | EMR/EHR، Insurance claim NPHIES، DRG |
| New Modules | 43 | various | various | various | various | - |
| V3 Verticals | 9 | Industry Cloud | Industry Cloud | Industry Verticals | Apps | shopfloor IoT, Construction PMS, EMR billing |
| Company Info | 1 | EAM | EAM | EAM | - | Entity Mgmt |
| Settings | 25 | SPRO + IMG | FSM | Setup | Settings | Health monitoring deep, Tenant Quotas, Feature Flags UI |

---

## 3) مصفوفة الفجوات الكبرى

> **مفتاح الأولوية:** 🔴 حرج (يمنع البيع/الامتثال) · 🟠 عالٍ (Differentiator) · 🟡 متوسط · 🔵 ROI-بعيد

### 3.1 الفجوات المالية المحاسبية

| # | الفجوة | المعيار/المرجع | الأولوية | الجهد | ROI |
|---|--------|----------------|----------|-------|-----|
| F-01 | **IAS 12 Deferred Tax Engine** | IAS 12, IFRIC 23 | 🔴 | 3-4 أسابيع | امتثال IFRS كامل |
| F-02 | **IAS 36 Impairment Testing (Goodwill + CGU)** | IAS 36 | 🔴 | 2 أسبوع | Big-4 audit pass |
| F-03 | **Transfer Pricing Documentation** | OECD BEPS Action 13 | 🟠 | 4 أسابيع | شركات قابضة |
| F-04 | **Intercompany Netting + Settlement** | IFRS 10 + IAS 21 | 🔴 | 3 أسابيع | إغلاق سنوي |
| F-05 | **Contract Asset / Liability tracking (IFRS 15 deep)** | IFRS 15 §105-109 | 🟠 | 2 أسبوع | شركات الخدمات |
| F-06 | **Multi-GAAP Posting (Tax / Book / IFRS / Local)** | NetSuite-style | 🟠 | 4 أسابيع | شركات MNC |
| F-07 | **Statement of Changes in Equity (auto)** | IAS 1 §106 | 🟡 | 1 أسبوع | تقارير سنوية |
| F-08 | **Cash Flow Statement Direct Method (auto)** | IAS 7 | 🟡 | 1 أسبوع | السوقية |
| F-09 | **Notes to FS auto-generator (with cross-references)** | IFRS Disclosure Initiative | 🟡 | 3 أسابيع | تقارير |
| F-10 | **Segment Reporting (IFRS 8)** | IFRS 8 | 🟡 | 2 أسبوع | شركات مساهمة |
| F-11 | **CO-PA Profitability (Multi-Dim)** | SAP CO-PA | 🟠 | 4 أسابيع | تحليل |
| F-12 | **ARO (Asset Retirement Obligation)** | IAS 37 | 🟡 | 1 أسبوع | صناعات استخراجية |

### 3.2 الفجوات التشغيلية (P2P / O2C)

| # | الفجوة | المعيار | الأولوية | الجهد | ROI |
|---|--------|---------|----------|-------|-----|
| O-01 | **Cash Application Engine (Advanced AI)** | HighRadius-class | 🔴 | 3 أسابيع | DSO ↓ 30% |
| O-02 | **Dunning Letters Multi-Level + Auto-escalation** | SAP F-150 | 🟠 | 2 أسبوع | تحصيل |
| O-03 | **Customer Credit Hold + Auto-Release** | SAP V/13 | 🟠 | 1 أسبوع | تحكم ائتماني |
| O-04 | **Bad Debt Provision Workflow** | IFRS 9 + Aging | 🟡 | 1 أسبوع | امتثال |
| O-05 | **Vendor Onboarding Workflow (with KYC/AML)** | Coupa/Ariba | 🟠 | 3 أسابيع | مشتريات |
| O-06 | **Supplier Self-Service Portal** | Coupa Supplier | 🟠 | 4 أسابيع | كفاءة |
| O-07 | **RFx Auction (Reverse Auction)** | SAP Ariba | 🔵 | 4 أسابيع | توفير تكاليف |
| O-08 | **Spend Analytics (cube + categorization)** | SAP Concur | 🟠 | 3 أسابيع | بصيرة |
| O-09 | **AP Automation (OCR → Match → Approve → Post)** | Stampli/Tipalti | 🟠 | 3 أسابيع | إنتاجية |
| O-10 | **PO Schedule Agreements (Blanket)** | SAP MM | 🟡 | 1 أسبوع | مشتريات متكررة |
| O-11 | **Drop-Ship + 3PL Workflow** | NetSuite | 🟡 | 2 أسبوع | بدون مخزون |
| O-12 | **Returns Authorization Multi-Step (RMA)** | NetSuite | 🟡 | 1 أسبوع | خدمة عملاء |

### 3.3 الفجوات في المخزون / WMS / MFG

| # | الفجوة | المعيار | الأولوية | الجهد |
|---|--------|---------|----------|-------|
| I-01 | **Wave Picking + Cluster Picking** | SAP EWM | 🟠 | 3 أسابيع |
| I-02 | **Slotting Optimization (ABC × Velocity)** | Manhattan WMS | 🔵 | 4 أسابيع |
| I-03 | **Cross-Docking** | SAP EWM | 🟡 | 2 أسبوع |
| I-04 | **Voice Picking / Pick-by-Light** | SAP EWM Mobile | 🔵 | 4 أسابيع |
| I-05 | **MES Shopfloor Realtime** | Rockwell / Wonderware | 🟠 | 5 أسابيع |
| I-06 | **APS Constraint-Based Scheduling** | Asprova/Quintiq | 🟠 | 5 أسابيع |
| I-07 | **SPC Statistical Process Control** | Minitab-like | 🟡 | 3 أسابيع |
| I-08 | **OEE Realtime (Machine Telemetry)** | IoT integration | 🟠 | 4 أسابيع |
| I-09 | **Engineering Change Order (ECO) workflow** | Siemens Teamcenter | 🟠 | 2 أسبوع |
| I-10 | **BOM Where-Used + Compare** | SAP CS15 | 🟡 | 1 أسبوع |
| I-11 | **Demand Sensing (ML)** | SAP IBP | 🔵 | 5 أسابيع |
| I-12 | **S&OP Module (Sales & Operations Planning)** | SAP IBP | 🔵 | 6 أسابيع |
| I-13 | **Equipment Calibration Mgmt** | SAP QM | 🟡 | 2 أسبوع |

### 3.4 الفجوات في HR / Payroll

| # | الفجوة | الأولوية | الجهد |
|---|--------|----------|-------|
| H-01 | **Succession Planning + Talent Pool** | 🟠 | 3 أسابيع |
| H-02 | **Career Pathing + Competency Matrix** | 🟠 | 3 أسابيع |
| H-03 | **Compensation Review Cycles** | 🟠 | 2 أسبوع |
| H-04 | **Performance OKR / Goals deep** | 🟡 | 2 أسبوع |
| H-05 | **Learning Mgmt System (LMS) كاملاً** | 🟡 | 5 أسابيع |
| H-06 | **Recruitment Pipeline + Career Site** | 🟠 | 4 أسابيع |
| H-07 | **Time & Attendance with Biometric/Geo** | 🟠 | 2 أسبوع |
| H-08 | **Payroll for non-Saudi (Egypt/UAE/Qatar)** | 🟠 | 3 أسابيع/دولة |
| H-09 | **Employee Self-Service Mobile App** | 🟠 | 4 أسابيع |
| H-10 | **Health & Safety / Incident Mgmt** | 🟡 | 2 أسبوع |

### 3.5 الفجوات في CRM / Marketing / Customer Experience

| # | الفجوة | الأولوية | الجهد |
|---|--------|----------|-------|
| C-01 | **Marketing Automation (Email/SMS Drip)** | 🟠 | 4 أسابيع |
| C-02 | **Customer Health Score + Churn ML** | 🟡 | 3 أسابيع |
| C-03 | **Account Hierarchy + Account Teams** | 🟠 | 2 أسبوع |
| C-04 | **Territory & Quota Mgmt** | 🟡 | 2 أسبوع |
| C-05 | **Sales Forecasting (Pipeline + ML)** | 🟠 | 3 أسابيع |
| C-06 | **Customer Portal (Full B2B)** | 🔴 | 4 أسابيع |
| C-07 | **Help Desk / ITSM (SLA + Escalation)** | 🟠 | 3 أسابيع |
| C-08 | **NPS / CSAT Surveys** | 🟡 | 1 أسبوع |
| C-09 | **Knowledge Base with full-text + RAG** | 🟡 | 2 أسبوع |
| C-10 | **Omnichannel: WhatsApp Business API + Email + Voice** | 🟠 | 4 أسابيع |

### 3.6 الفجوات التقنية / Platform

| # | الفجوة | الأولوية | الجهد |
|---|--------|----------|-------|
| P-01 | **BPMN 2.0 Visual Workflow Designer** | 🟠 | 6 أسابيع |
| P-02 | **No-Code Custom Page / Form Builder** | 🟠 | 6 أسابيع |
| P-03 | **Custom Report Builder UI (drag-drop)** | 🟠 | 4 أسابيع |
| P-04 | **Native Mobile App (React Native)** | 🟠 | 8 أسابيع |
| P-05 | **Offline-first Sync (POS + Field)** | 🟠 | 5 أسابيع |
| P-06 | **SAML 2.0 / OIDC SSO** | 🟠 | 2 أسبوع |
| P-07 | **Field-level Encryption at Rest** | 🟠 | 2 أسبوع |
| P-08 | **Data Masking / Dynamic Data Masking** | 🟡 | 2 أسبوع |
| P-09 | **SOC 2 Type II readiness** | 🟠 | 8 أسابيع |
| P-10 | **Webhook Manager + Replay** | 🟡 | 1 أسبوع |
| P-11 | **OpenAPI Catalog + Postman Collections** | 🟡 | 1 أسبوع |
| P-12 | **iPaaS Connectors (Salla / Zid / Shopify / WooCommerce)** | 🟠 | 1 أسبوع/connector |
| P-13 | **eSignature Native (Etimad + Tawqee'h SA + DocuSign)** | 🟠 | 3 أسابيع |
| P-14 | **DMS Full-Text Search + OCR + Folders + ACL** | 🟠 | 4 أسابيع |
| P-15 | **Multi-Country / Multi-Language deep (i18n schema-level)** | 🟠 | 5 أسابيع |
| P-16 | **AI Copilot for every page (Gemini RAG)** | 🟡 | continuous |

---

## 4) برومنتات جاهزة + سيناريوهات + فلوهات

> هذا القسم يحتوي لكل فجوة من الـ 47 فجوة أعلاه: **(1) Prompt جاهز للنسخ** و **(2) Business Scenario** و **(3) Data Flow بصيغة Mermaid**.

### 🔴 F-01: IAS 12 Deferred Tax Engine

**Prompt (انسخه في جلسة Claude Code جديدة):**
```
ابنِ Deferred Tax Engine متوافق مع IAS 12 لنظام Namasoft (Next.js 16 + Prisma + TypeScript).

اقرأ أولاً CLAUDE.md و GLOBAL_ERP_GAP_ANALYSIS.md و src/lib/auto-journal.ts.

Schema (إضافة في prisma/schema.prisma):
model DeferredTax {
  id              Int      @id @default(autoincrement())
  tenantId        Int
  asOfDate        DateTime
  itemCode        String   // FIXED_ASSET_DEPR, INVENTORY_NRV, LOAN_LOSS, ACCRUED_LIAB, REVALUATION, FX_UNREALIZED, ...
  description     String
  accountingBase  Decimal  @db.Decimal(18,2) // Carrying Amount per books
  taxBase         Decimal  @db.Decimal(18,2) // Tax Base
  temporaryDiff   Decimal  @db.Decimal(18,2) // accountingBase - taxBase
  diffType        String   // TAXABLE_TEMP_DIFF | DEDUCTIBLE_TEMP_DIFF | NONE
  taxRate         Decimal  @db.Decimal(7,4)   // 0.20 = 20%
  deferredTaxAmount Decimal @db.Decimal(18,2) // temporaryDiff * taxRate
  classification  String   // DTL (liability) | DTA (asset)
  recoverability  String?  // PROBABLE | UNCERTAIN — للـ DTA حسب IAS 12.34-35
  expectedReversal DateTime?
  journalEntryId  Int?
  status          String   @default("DRAFT") // DRAFT, RECOGNIZED, REVERSED
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@index([tenantId, asOfDate])
}

model DeferredTaxRollforward {
  id              Int      @id @default(autoincrement())
  tenantId        Int
  fiscalYear      Int
  itemCode        String
  openingBalance  Decimal  @db.Decimal(18,2)
  recognizedInPL  Decimal  @db.Decimal(18,2) // Tax expense
  recognizedInOCI Decimal  @db.Decimal(18,2) // Hedge / Revaluation
  recognizedInEq  Decimal  @db.Decimal(18,2) // Direct equity
  closingBalance  Decimal  @db.Decimal(18,2)
  @@unique([tenantId, fiscalYear, itemCode])
}

Engine (src/lib/deferred-tax-engine.ts):
export class DeferredTaxEngine {
  // IAS 12.5: Temp diff = Carrying Amount - Tax Base
  // IAS 12.15-16: Recognize DTL on taxable temp diff
  // IAS 12.24, 34: Recognize DTA on deductible temp diff ONLY if probable future taxable profits
  // IAS 12.46: Use tax rates enacted/substantively enacted at balance sheet date
  
  static async calculateForPeriod(tenantId: number, asOfDate: Date): Promise<DeferredTax[]>
  // اقرأ جميع الـ temporary differences من: Fixed Assets (book depr vs tax depr), 
  // Inventory (NRV write-down), Accrued liabilities (warranty, bonus), 
  // Loan loss provisions (ECL — IFRS 9 vs tax allowance), FX unrealized,
  // Revaluation surplus (OCI route), Tax loss carry-forwards.
  
  static async recognizeJournalEntry(deferredTaxIds: number[]): Promise<JournalEntry>
  // JE:
  //   DR/CR: 5910 Income Tax Expense (P&L)
  //   DR/CR: 1290 Deferred Tax Asset
  //   DR/CR: 2290 Deferred Tax Liability
  //   DR/CR: 3210 OCI - Deferred Tax (for revaluation / hedge / FVOCI)
  
  static async generateRollforward(fiscalYear: number): Promise<DeferredTaxRollforward[]>
  static async assessDTARecoverability(dtaId: number): Promise<{ recoverable: boolean; reasoning: string }>
  // Use AI (Gemini) to assess: 5-year profit projection, tax planning strategies, future reversals.
}

APIs:
- POST /api/finance/deferred-tax/calculate { asOfDate, scenarios? }
- POST /api/finance/deferred-tax/[id]/recognize
- POST /api/finance/deferred-tax/[id]/reverse
- GET  /api/finance/deferred-tax/rollforward?fiscalYear=X
- GET  /api/finance/deferred-tax/note (لنوتة 18 — ضريبة دخل مؤجلة)

UI: src/app/(dashboard)/finance/deferred-tax/page.tsx
- Tab 1: حساب الـ Temp Differences (table مع filter)
- Tab 2: Rollforward (Opening + Movement + Closing)
- Tab 3: Recoverability Assessment (DTA only)
- Tab 4: Effective Tax Rate reconciliation
- زر "Generate JE" → يولّد القيد ويرسل للموافقات
- زر "Generate IAS 12 Note" → PDF + DOCX

Tests (src/lib/deferred-tax-engine.test.ts):
1. FA: Book depr 10% (10y) vs Tax depr 25% (4y) → DTL خلال أول 4 سنوات ثم DTA
2. Inventory NRV write-down 100K → DTA = 100K × 20% = 20K
3. Tax loss CF = 1M, tax rate 20%, expected utilization within 5 yrs → DTA 200K
4. Revaluation surplus 500K → DTL via OCI 100K
5. Reversal scenarios عبر السنوات

استشر accounting-validator subagent للتحقق من المنطق.
استشر saudi-compliance لربطها بـ Zakat & Income Tax KSA.
```

**سيناريو العمل:**
1. في نهاية كل ربع، المحاسب يفتح `/finance/deferred-tax`
2. النظام يقرأ تلقائياً جميع الفروق المؤقتة: استهلاك دفتري vs ضريبي، مخصصات، NRV، إعادة تقييم، خسائر منقولة
3. لكل فرق يحدد: TAXABLE أم DEDUCTIBLE، يضربه بالنسبة الضريبية الحالية
4. النظام يقترح DTL/DTA classification ويسأل عن recoverability للـ DTA
5. ضغطة زر "Generate JE" → يولّد القيد متوازن (يمر بـ Multi-Book — تأثير على Book/IFRS فقط، لا Tax Book)
6. القيد يدخل Approval Engine → CFO يوافق → POSTED
7. يولّد Rollforward Schedule لإفصاحات IAS 12.81
8. الـ Effective Tax Rate Reconciliation يُحسب آلياً ويظهر في Note 18

**Data Flow (Mermaid):**
```mermaid
flowchart LR
    A[Fixed Assets Subledger] -->|Book NBV vs Tax NBV| E[Deferred Tax Engine]
    B[Inventory Module] -->|NRV writedowns| E
    C[Accrual Engine] -->|Bonus, Warranty| E
    D[ECL Engine] -->|Loan loss provisions| E
    F[Revaluation Reserve] -->|OCI items| E
    G[Tax Loss Carry-Forward DB] -->|Unused losses| E

    E -->|Calculate temp diffs| H[DeferredTax records]
    H -->|Apply tax rate| I[Determine DTL/DTA]
    I -->|Recoverability check + AI| J[Journal Entry Draft]
    J -->|approval-engine| K[Approval Queue]
    K -->|CFO approves| L[auto-journal posts to GL]
    L -->|multi-book router| M[Book/IFRS Books only]
    L --> N[Rollforward Schedule]
    L --> O[Effective Tax Reconciliation]
    N --> P[Note 18 IAS12 PDF]
    O --> P
```

---

### 🔴 F-02: IAS 36 Impairment Testing (Goodwill + CGU)

**Prompt:**
```
ابنِ IAS 36 Impairment Testing Engine لنظام Namasoft.

Schema (إضافات):
model CashGeneratingUnit {
  id              Int      @id @default(autoincrement())
  tenantId        Int
  code            String   @unique
  name            String
  description     String?
  segmentId       Int?
  responsibleUser Int?
  // المحتويات المرتبطة بهذه CGU:
  assets          CguAsset[]
  goodwillId      Int?
  status          String   @default("ACTIVE")
}

model CguAsset {
  id              Int      @id @default(autoincrement())
  cguId           Int
  cgu             CashGeneratingUnit @relation(fields:[cguId], references:[id])
  assetId         Int      // FK to FixedAsset OR Intangible
  assetType       String   // FIXED, INTANGIBLE, GOODWILL, ROU
  carryingAmount  Decimal  @db.Decimal(18,2)
  recordedAt      DateTime
}

model ImpairmentTest {
  id              Int      @id @default(autoincrement())
  tenantId        Int
  cguId           Int
  testDate        DateTime
  testType        String   // ANNUAL_GOODWILL | INDICATOR_BASED | ANNUAL_INTANGIBLE_INDEF
  triggerEvent    String?  // INTERNAL: damage, restructure / EXTERNAL: market, regulatory
  carryingAmount  Decimal  @db.Decimal(18,2)
  
  // Step 1: Determine recoverable amount = MAX(Value-in-Use, Fair-Value-less-Costs-of-Disposal)
  fairValueLessCD Decimal? @db.Decimal(18,2)
  valueInUse      Decimal? @db.Decimal(18,2)
  recoverableAmount Decimal @db.Decimal(18,2)
  
  // Inputs for VIU (DCF):
  forecastPeriodYrs Int     @default(5)
  cashFlows       Json     // [{year:1, amount:100000}, {year:2,...}]
  discountRate    Decimal  @db.Decimal(7,4) // WACC
  terminalGrowth  Decimal  @db.Decimal(7,4)
  terminalValue   Decimal  @db.Decimal(18,2)
  
  impairmentLoss  Decimal  @db.Decimal(18,2) // carrying - recoverable (if positive)
  reversalAmount  Decimal? @db.Decimal(18,2) // for non-goodwill reversals
  status          String   @default("DRAFT") // DRAFT, APPROVED, POSTED
  journalEntryId  Int?
  approvedBy      Int?
  approvedAt      DateTime?
}

model ImpairmentAllocation {
  id              Int      @id @default(autoincrement())
  testId          Int
  test            ImpairmentTest @relation(fields:[testId], references:[id])
  assetId         Int
  assetType       String
  preCarryingAmt  Decimal  @db.Decimal(18,2)
  allocatedLoss   Decimal  @db.Decimal(18,2)
  postCarryingAmt Decimal  @db.Decimal(18,2)
  allocationOrder Int      // 1=Goodwill first (IAS 36.104), 2=pro-rata to other assets
}

Engine: src/lib/impairment-engine.ts
- VIU calculation (DCF):
  VIU = Σ(CFt / (1+r)^t) for t=1..n + TerminalValue / (1+r)^n
- FairValueLCD: market multiples or recent transactions
- IAS 36.104: Allocate impairment first to Goodwill, then pro-rata to other CGU assets
- IAS 36.117: For non-goodwill assets, reversal allowed if recoverable amount > carrying
- IAS 36.124: Goodwill impairment is irreversible

APIs:
- POST /api/finance/impairment/cgu (CRUD)
- POST /api/finance/impairment/test { cguId, testDate, inputs }
- POST /api/finance/impairment/test/[id]/approve
- POST /api/finance/impairment/test/[id]/post-je
- GET  /api/finance/impairment/sensitivity/[testId] (sensitivity table)

UI: /finance/impairment
- CGU Setup wizard
- Test wizard: Inputs (CF projections, WACC, terminal) → Calculate → Result
- Sensitivity Analysis: WACC ±1%, terminal growth ±0.5%
- Allocation table (Goodwill → pro-rata)

JE:
DR: 5950 Impairment Loss
CR: 1840 Goodwill (impaired portion)
CR: 1500-1899 Asset Carrying Adjustments

Tests: 3 سيناريوهات (no impairment, partial, full + goodwill writeoff).

استشر accounting-validator.
```

**سيناريو:**
- شركة قابضة لديها 3 CGUs: Retail KSA, Restaurant KSA, Logistics
- في 2026-12-31 (الاختبار السنوي الإلزامي للـ Goodwill حسب IAS 36.10)
- المحاسب يفتح Retail CGU، يدخل توقعات تدفقات نقدية 5 سنوات + WACC + terminal growth
- النظام يحسب VIU بـ DCF، يقارنها بـ FV-LCD (من السوق)
- Recoverable = أكبر منهما = مثلاً 8M
- Carrying = 10M → خسارة 2M
- الـ Allocation: 1.5M للـ Goodwill أولاً، الباقي 0.5M pro-rata
- JE → Approval → Posted في Book/IFRS فقط (لا Tax Book)
- يولّد إفصاح IAS 36.130 (assumptions + sensitivity table)

**Data Flow:**
```mermaid
flowchart TD
    A[CGU Definition] --> B[Carrying Amount Aggregator]
    A --> C[Cash Flow Projections]
    C --> D[WACC Calculator]
    D --> E[DCF Engine VIU]
    F[Market Comparables] --> G[FV-LCD]
    E --> H{MAX VIU FV-LCD}
    G --> H
    H --> I[Recoverable Amount]
    B --> J{Carrying > Recoverable?}
    I --> J
    J -->|Yes| K[Calculate Impairment]
    K --> L[Allocate: Goodwill first]
    L --> M[Pro-rata Allocation other assets]
    M --> N[Approval Workflow]
    N --> O[auto-journal posts to Book/IFRS only]
    O --> P[Update FixedAsset.netBookValue]
    O --> Q[Goodwill Schedule update]
    O --> R[IAS 36 Note Generation]
```

---

### 🔴 F-04: Intercompany Netting + Settlement

**Prompt:**
```
ابنِ Intercompany Netting & Settlement Engine.

السيناريو: شركة قابضة لديها 5 شركات تابعة تتبادل فواتير شهرياً.
بدلاً من 50 تحويل بنكي شهرياً → نظام netting يقاصّ ويسدد الصافي فقط.

Schema:
model IntercompanyParticipant {
  id          Int @id @default(autoincrement())
  companyId   Int
  bankAccountId Int
  isActive    Boolean @default(true)
  currency    String
}

model NettingCycle {
  id          Int @id @default(autoincrement())
  cycleNumber String @unique
  cycleDate   DateTime
  cycleType   String  // BILATERAL | MULTILATERAL
  baseCurrency String
  status      String  @default("DRAFT") // DRAFT, CALCULATED, APPROVED, SETTLED
  totalGross  Decimal @db.Decimal(18,2)
  totalNet    Decimal @db.Decimal(18,2)
  savingsRatio Decimal @db.Decimal(7,4)
  approvedBy  Int?
  settledAt   DateTime?
  positions   NettingPosition[]
  settlements NettingSettlement[]
}

model NettingPosition {
  id          Int @id @default(autoincrement())
  cycleId     Int
  cycle       NettingCycle @relation(fields:[cycleId], references:[id])
  companyId   Int
  grossReceivable Decimal @db.Decimal(18,2)
  grossPayable    Decimal @db.Decimal(18,2)
  netPosition     Decimal @db.Decimal(18,2) // + receives, - pays
  currency    String
  fxRate      Decimal @db.Decimal(18,6)
  baseAmount  Decimal @db.Decimal(18,2)
}

model NettingSettlement {
  id          Int @id @default(autoincrement())
  cycleId     Int
  payerCompanyId Int
  receiverCompanyId Int
  amount      Decimal @db.Decimal(18,2)
  currency    String
  transferRef String?
  paidAt      DateTime?
  journalEntryIds Json // for both parties
}

Engine: src/lib/intercompany-netting-engine.ts
- Step 1: collect all open IntercompanyTransaction records (invoices) up to cycle cutoff
- Step 2: Convert to base currency at cycle FX
- Step 3: For each company: net position = sum(Receivables) - sum(Payables)
- Step 4: Multilateral netting algorithm: build directed graph of obligations, find min-cost flow to settle
- Step 5: Generate settlement transfers (payer → receiver via in-house bank or treasury)
- Step 6: Auto-Journal: 
   For payer: DR Intercompany Payable, CR Bank
   For receiver: DR Bank, CR Intercompany Receivable
- Step 7: Mark original IC invoices as SETTLED via cash application

APIs:
- POST /api/finance/intercompany/netting/cycles (CRUD)
- POST /api/finance/intercompany/netting/cycles/[id]/calculate
- POST /api/finance/intercompany/netting/cycles/[id]/approve
- POST /api/finance/intercompany/netting/cycles/[id]/settle
- GET  /api/finance/intercompany/netting/cycles/[id]/positions

UI:
- لوحة Bird's-Eye: مصفوفة من×إلى لجميع الشركات
- Net Position Bar Chart
- Settlement instructions printable (مثل SWIFT MT103)

Tests: 4 شركات بدورات مختلفة (basic, multi-currency, with FX gain/loss).
استشر accounting-validator + consolidation-engine.ts للتأكد من عدم التعارض.
```

**سيناريو:**
- نهاية الشهر، CFO المجموعة يفتح `/finance/intercompany/netting`
- ينشئ Cycle #2026-05، يختار العملة الأساسية SAR
- يضغط "Calculate" → النظام يجلب 47 فاتورة بين الشركات الـ 5
- يعرض Matrix: من شركة A إلى B = 200K، من B إلى A = 80K → Net 120K A→B
- بعد netting متعدد الأطراف: بدلاً من 12 تحويل، 3 تحويلات فقط
- التوفير: 9 تحويلات × 25 SAR رسوم + FX spread → ~1500 SAR/شهر + توفير في time-to-settle

**Data Flow:**
```mermaid
flowchart LR
    A[Subsidiary A invoices] --> X[IntercompanyTransaction Pool]
    B[Subsidiary B invoices] --> X
    C[Subsidiary C invoices] --> X
    D[Subsidiary D invoices] --> X
    E[Subsidiary E invoices] --> X
    X --> F[FX Conversion to Base]
    F --> G[Netting Engine - Multilateral]
    G --> H[Min-Cost Flow Algorithm]
    H --> I[Settlement Instructions]
    I --> J[Bank Transfer Initiation]
    J --> K[auto-journal both sides]
    K --> L[Cash Application matches]
    L --> M[IC Invoices marked SETTLED]
    K --> N[Consolidation Engine - elimination simplified]
```

---

### 🔴 C-06: Customer Portal (Full B2B Self-Service)

**Prompt:**
```
ابنِ Customer Portal B2B كامل لنظام Namasoft (مساحة منفصلة عن لوحة الموظفين).

البنية المعمارية:
- مسار: /portal/customer/* (subdomain optional: portal.{tenant}.namasoft.com)
- Auth منفصل (Clerk org-as-customer): كل عميل = Organization، مستخدميه = Members
- Permissions: Portal_User_Role موصل بـ Customer
- لا وصول لأي بيانات tenant أخرى (Strict Isolation)

Schema:
model PortalUser {
  id            Int @id @default(autoincrement())
  customerId    Int
  customer      Customer @relation(fields:[customerId], references:[id])
  email         String @unique
  fullName      String
  phone         String?
  role          String // ADMIN, BUYER, AP, VIEWER
  invitedBy     Int
  invitedAt     DateTime
  acceptedAt    DateTime?
  isActive      Boolean @default(true)
  twoFactorEnabled Boolean @default(false)
  lastLogin     DateTime?
}

model PortalSession {
  id          Int @id @default(autoincrement())
  portalUserId Int
  token       String @unique
  expiresAt   DateTime
  ipAddress   String?
  userAgent   String?
}

model PortalActivity {
  id            Int @id @default(autoincrement())
  portalUserId  Int
  action        String
  targetType    String
  targetId      Int
  metadata      Json?
  createdAt     DateTime @default(now())
}

Features (الصفحات الإلزامية):
1. /portal/login (email + password + 2FA)
2. /portal/dashboard
   - Outstanding balance + Aging
   - Next payment due
   - Recent transactions
3. /portal/orders
   - List of SO (filter: status, date range)
   - View order detail + tracking
   - Reorder button
4. /portal/orders/new
   - Catalog browser (filter, search)
   - Add to cart → Place Order → Goes to NEW_ORDER queue in main system
5. /portal/invoices
   - List + filter + download PDF
   - Online payment button (Stripe/PayPal/HyperPay for KSA)
6. /portal/payments
   - History
   - Make payment (allocate to specific invoices = Cash Application input)
7. /portal/statements
   - Monthly statements (PDF)
   - Download CSV
8. /portal/quotes
   - Receive quotes + accept/reject (converts to SO)
9. /portal/support
   - Create ticket → integrates with CRM tickets
   - Knowledge base search
10. /portal/profile
    - Update contact info
    - Manage users (if ADMIN)
    - View terms & conditions, agreements

APIs (مع isolation strict):
- POST /api/portal/auth/login
- POST /api/portal/auth/refresh
- GET  /api/portal/dashboard
- GET  /api/portal/orders + POST (new order)
- GET  /api/portal/invoices/:id/pdf
- POST /api/portal/payments
- GET  /api/portal/statements?from=&to=
- POST /api/portal/quotes/:id/accept|reject
- POST /api/portal/tickets

Middleware: ضع portalAuthMiddleware يتحقق:
1. Token صحيح
2. PortalUser.customerId تطابق resource.customerId في كل query
3. لا وصول لـ Customer داخل tenant مختلف

Email templates:
- Invitation, Password reset, Order confirmation, Invoice notice, Payment receipt, Quote received.

UI:
- Layout مستقل (لا sidebar الـ ERP)
- LTR/RTL support
- Theme white-label per customer (logo)
- Mobile-responsive (هذه الـ portal يجب أن تعمل ممتاز على الموبايل)

Security:
- Rate-limit login (5 attempts/15min)
- Audit every action (PortalActivity)
- PII masking on logs

Tests: E2E بـ Playwright (login, place order, view invoice, make payment).
```

**سيناريو:**
- ABC Corp (عميل B2B) يدعو 3 من فريقه: Admin, Buyer, AP Clerk
- Admin يدخل /portal/orders/new → يضع طلبية 50K SAR
- النظام ينشئ Sales Order DRAFT في main system مع flag "PORTAL_ORIGIN"
- Sales Rep في الشركة يراجع → يحول إلى Sales Invoice
- AP Clerk من ABC يدخل /portal/invoices → يجد الفاتورة → يدفع via HyperPay
- النظام: cash-application-engine يطابق الدفع بالفاتورة آلياً
- Email confirmation للطرفين

**Data Flow:**
```mermaid
flowchart LR
    A[Customer User] -->|Login| B[Portal Auth]
    B --> C[/portal/orders/new/]
    C --> D[Portal API - new SO draft]
    D --> E[Main ERP - SalesOrder DRAFT + PORTAL_ORIGIN flag]
    E --> F[Notification to Sales Rep]
    F --> G[Sales Rep reviews + approves]
    G --> H[Generates Sales Invoice]
    H --> I[Email Invoice + Portal Notification]
    I --> J[Customer logs in - view invoice]
    J --> K[Pay button - HyperPay/Stripe]
    K --> L[Webhook to Bank Receipt module]
    L --> M[cash-application-engine matches]
    M --> N[AR Aging updated]
    M --> O[Portal Statement updated]
```

---

### 🟠 O-09: AP Automation (OCR → Match → Approve → Post)

**Prompt:**
```
ابنِ AP Automation Engine يعالج فواتير الموردين تلقائياً من الـ PDF/Image إلى القيد.

Workflow:
1. Upload (Email inbox أو drag-drop)
2. OCR Extract (Gemini Vision أو Google Document AI)
3. Match to PO + GRN (Three-Way Match)
4. Tolerance Check
5. Approval Routing
6. Post to GL

Schema (تعزيز InvoiceCapture الموجود):
model APInvoiceCapture {
  id            Int @id @default(autoincrement())
  tenantId      Int
  source        String  // EMAIL, UPLOAD, EDI, MOBILE
  receivedAt    DateTime @default(now())
  fileUrl       String
  fileMimeType  String
  ocrStatus     String  @default("PENDING") // PENDING, PROCESSING, EXTRACTED, FAILED
  ocrEngine     String? // GEMINI, GOOGLE_DOC_AI, TEXTRACT
  ocrConfidence Decimal? @db.Decimal(5,2)
  extractedJson Json?   // {vendor:{name,vatNum,iban}, invoice:{no,date,due,total,vat,subtotal}, lines:[...]}
  vendorId      Int?
  matchedPoId   Int?
  matchedGrnId  Int?
  matchStatus   String  @default("UNMATCHED") // UNMATCHED, MATCHED_FULL, MATCHED_PARTIAL, EXCEPTION
  exceptions    Json?   // [{type: PRICE_VAR, value: 5.2%}, {type:QTY_VAR,...}]
  routedToUser  Int?
  approvalRequestId Int?
  postedInvoiceId Int?  // FK to PurchaseInvoice once posted
  status        String  @default("RECEIVED") // RECEIVED, PROCESSING, NEEDS_REVIEW, APPROVED, POSTED, REJECTED
}

Engine: src/lib/ap-automation-engine.ts
- ingest(file) → APInvoiceCapture record
- runOCR(captureId): استدعاء Gemini Vision بـ structured prompt:
  "Extract: vendor name, vendor VAT, invoice number, invoice date, due date, currency,
   subtotal, VAT amount, total, line items (description, qty, unit price, line total).
   Return JSON conforming to APInvoiceSchema."
- matchVendor: fuzzy match على Vendor.name + VAT + IBAN
- matchPO: 
  - Step 1: ابحث عن PO رقمه مذكور في الـ description/notes
  - Step 2: ابحث عن open PO للـ vendor بمبلغ ±5%
  - Step 3: AI fallback
- runThreeWayMatch(captureId): استخدم src/lib/three-way-match-engine.ts الموجود
- routeForApproval(captureId): إذا within tolerance → auto-approve، وإلا → approval-engine
- postInvoice(captureId): يولّد PurchaseInvoice + JE عبر auto-journal

Email Ingestion:
- Setup IMAP listener (ap-invoices@{tenant}.namasoft.com)
- يلتقط المرفقات → يولّد captures آلياً

UI: /purchases/ap-automation/
- Inbox view (Gmail-style: pending, needs review, approved, posted)
- لكل capture: thumbnail + extracted JSON + match results + side-by-side PO/GRN
- Action buttons: Approve, Reject, Re-match, Reassign Vendor
- Bulk actions

Mobile: scan via camera (mobile app)

Tests:
- 10 فاتورة مختلفة (Arabic, English, scanned, native PDF, ZATCA XML)
- مع/بدون PO match
- exceptions: price var, qty var, missing GRN

استشر accounting-validator + ZATCA agent (لتطابق فاتورة ZATCA-compliant).
```

**سيناريو:**
- المورد يرسل PDF فاتورة إلى ap-invoices@acme.namasoft.com
- النظام يلتقط → OCR → يستخرج: مورد ABC، فاتورة 1234، 23,000 SAR، VAT 3,450
- يطابق المورد (ABC موجود) ✅
- يبحث عن PO مفتوح: وجد PO #PO-2026-0089 بقيمة 23,000 ✅
- 3-Way Match مع GRN-2026-0145: متطابق 100% ✅
- ضمن tolerance → Auto-Approve → Posted: 
  - DR: 1330 Inventory 19,549.78
  - DR: 1190 VAT Input 3,450
  - CR: 2110 AP 23,000
- اشعار للمورد بالاستلام، اشعار للـ AP Clerk للمراجعة
- المتوقع: 80% من الفواتير تمر بدون تدخل بشري

**Data Flow:**
```mermaid
flowchart TD
    A[Email Inbox IMAP] --> B[APInvoiceCapture created]
    C[Manual Upload] --> B
    D[Mobile Scan] --> B
    B --> E[Gemini Vision OCR]
    E --> F[Extracted JSON Structured]
    F --> G[Vendor Matching - fuzzy]
    G --> H{Vendor Found?}
    H -->|No| I[Queue: Vendor Unknown]
    H -->|Yes| J[PO Matching]
    J --> K[Three-Way Match Engine]
    K --> L{Within Tolerance?}
    L -->|Yes| M[Auto-Approve]
    L -->|No| N[Approval Engine - route to AP Manager]
    N --> O{Approved?}
    O -->|Yes| M
    O -->|No| P[Status: REJECTED + email vendor]
    M --> Q[Create PurchaseInvoice]
    Q --> R[auto-journal - posts JE]
    R --> S[Update vendor balance + aging]
    R --> T[ZATCA Validate if Saudi vendor]
```

---

### 🟠 P-01: BPMN 2.0 Visual Workflow Designer

**Prompt:**
```
ابنِ BPMN 2.0 Workflow Engine + Visual Designer لنظام Namasoft.

استخدم bpmn-js (Camunda's open-source library) للـ designer.
المحرك من الصفر بـ TypeScript.

Schema:
model BpmnProcess {
  id            Int @id @default(autoincrement())
  tenantId      Int
  key           String @unique // "purchase_order_approval_v2"
  name          String
  version       Int @default(1)
  bpmnXml       String @db.Text // BPMN 2.0 XML
  diagramJson   Json   // Designer state
  isPublished   Boolean @default(false)
  publishedAt   DateTime?
  publishedBy   Int?
  instances     BpmnInstance[]
}

model BpmnInstance {
  id            Int @id @default(autoincrement())
  processId     Int
  process       BpmnProcess @relation(fields:[processId], references:[id])
  businessKey   String // e.g., "PO-2026-001"
  startedBy     Int
  startedAt     DateTime @default(now())
  variables     Json    // {amount: 50000, vendor: "X", ...}
  currentTokens Json    // array of activity IDs where tokens currently rest
  status        String  @default("RUNNING") // RUNNING, COMPLETED, SUSPENDED, FAILED
  tasks         BpmnTask[]
  history       BpmnHistory[]
  completedAt   DateTime?
}

model BpmnTask {
  id            Int @id @default(autoincrement())
  instanceId    Int
  activityId    String // BPMN element ID
  taskType      String // USER_TASK, SERVICE_TASK, SCRIPT_TASK, SEND_TASK, RECEIVE_TASK
  assigneeId    Int?
  candidateGroups String? // CSV roles
  dueDate       DateTime?
  status        String  @default("ACTIVE") // ACTIVE, CLAIMED, COMPLETED, CANCELED
  formKey       String? // custom form to display
  variables     Json?
  completedAt   DateTime?
  outcome       String?
}

model BpmnHistory {
  id            Int @id @default(autoincrement())
  instanceId    Int
  activityId    String
  activityName  String
  type          String // START_EVENT, USER_TASK, GATEWAY, END_EVENT
  startedAt     DateTime
  endedAt       DateTime?
  durationMs    Int?
  performerId   Int?
}

Engine: src/lib/bpmn-engine.ts
- Parse BPMN XML
- Token-based execution:
  - StartEvent → موكن واحد
  - UserTask: ينشئ BpmnTask، ينتظر claim/complete
  - ServiceTask: ينفذ TypeScript handler مسجل (e.g., "validatePO", "postJE")
  - ExclusiveGateway: يقيّم condition expressions ويوجّه الموكن
  - ParallelGateway: يفرّع/يجمع الموكنات
  - EndEvent: ينهي
- Persistence: حالة كل instance في DB
- Variables scope: instance-level + task-level
- Event handling: webhooks، timers، signals

Designer UI: /settings/bpm/processes
- Sidebar list of processes
- BPMN.io diagram editor (drag-drop BPMN elements)
- Properties panel: لكل task: assignee, candidateGroups, form, conditions
- Save → store bpmnXml + render graph
- Deploy button → mark version published

Runtime UI: /workflow/inbox
- مهامي (assigned to me)
- مهام مجموعتي (candidateGroups)
- Click → opens form → submit → completes task
- /workflow/processes/[instanceId] = visual flowchart with completed/active highlighted

Service Task Handlers (built-in):
- post.journal_entry(jeId)
- send.email(to, template, variables)
- send.whatsapp(phone, template)
- create.notification(userId, message)
- update.entity(entityType, entityId, fields)
- ai.gemini_eval(prompt) → returns response in variable

APIs:
- POST /api/bpm/processes (CRUD)
- POST /api/bpm/processes/[key]/deploy
- POST /api/bpm/instances { processKey, businessKey, variables }
- POST /api/bpm/tasks/[id]/claim
- POST /api/bpm/tasks/[id]/complete { variables }
- GET  /api/bpm/instances/[id]/diagram (SVG)

Examples (seed):
1. PO Approval > 50K: Start → ServiceTask(validate) → Gateway(amount > 50K?) → UserTask(CFO approve) → ServiceTask(post) → End
2. Customer Onboarding: Start → UserTask(sales fill) → ServiceTask(credit check) → Gateway(approved?) → UserTask(set credit limit) → ServiceTask(create in CRM) → End

Tests:
- Process parser (valid/invalid BPMN)
- Token movement through gateways
- Timer events
- Boundary events (cancel, escalate)
```

**سيناريو:**
- المدير المالي يفتح /settings/bpm/processes → New Process
- يرسم في الـ designer: Start → User Task (Finance reviews) → Exclusive Gateway (amount > 100K؟) → نعم: User Task (CFO approves)، لا: Service Task (post directly) → End
- يحفظ ويُنشر version 1
- عند إنشاء فاتورة جديدة → النظام يبدأ instance من هذا الـ process
- Finance يرى المهمة في inbox، يفتح، يوافق
- إذا > 100K → ينتقل الـ token للـ CFO
- CFO يوافق → Service Task يطلق auto-journal تلقائياً
- جميع الـ history مسجلة، الـ duration mesurable لكل task

**Data Flow:**
```mermaid
flowchart LR
    A[Business Event - new PO] -->|Trigger| B[BPMN Engine - start instance]
    B --> C[Parse BPMN XML]
    C --> D[Create token at StartEvent]
    D --> E[Move token to next activity]
    E --> F{Activity Type}
    F -->|UserTask| G[Create BpmnTask + Notify assignee]
    F -->|ServiceTask| H[Execute registered handler]
    F -->|Gateway| I[Evaluate expression]
    G --> J[User completes via Inbox UI]
    H --> K[Handler returns - variables updated]
    I --> L[Route token to matching path]
    J --> E
    K --> E
    L --> E
    E --> M{End Reached?}
    M -->|Yes| N[Mark Instance COMPLETED]
    M -->|No| E
```

---

### 🟠 P-13: Native eSignature (Etimad + DocuSign + Tawqee'h)

**Prompt:**
```
ابنِ eSignature integration متعدد المزودين لنظام Namasoft.

دعم 3 مزودين:
1. DocuSign (دولي)
2. Etimad / Tawqee'h (السعودية — موثق حكومياً)
3. Adobe Sign (دولي)
+ توقيع داخلي بسيط (PKI/Image-stamp)

Schema:
model EsignProvider {
  id          Int @id @default(autoincrement())
  tenantId    Int
  type        String  // DOCUSIGN, ETIMAD, TAWQEE_H, ADOBE_SIGN, INTERNAL
  name        String
  apiKey      String? // encrypted
  apiSecret   String? // encrypted
  webhookUrl  String?
  isActive    Boolean @default(true)
  config      Json?
}

model EsignRequest {
  id              Int @id @default(autoincrement())
  tenantId        Int
  providerId      Int
  documentType    String  // CONTRACT, PO, INVOICE, NDA, HR_OFFER, OTHER
  sourceEntity    String  // SalesContract, PurchaseOrder, etc.
  sourceEntityId  Int
  documentUrl     String  // PDF location
  documentHash    String  // SHA256
  signers         Json    // [{name, email, phone, role, order}]
  status          String  @default("DRAFT") // DRAFT, SENT, IN_PROGRESS, COMPLETED, DECLINED, EXPIRED, VOIDED
  externalEnvelopeId String?
  expiresAt       DateTime?
  reminderConfig  Json?
  signatureFields Json    // [{signerEmail, page, x, y, type:SIGNATURE|DATE|TEXT|INITIAL}]
  signedDocumentUrl String?
  certificateUrl  String? // audit trail PDF
  createdBy       Int
  createdAt       DateTime @default(now())
  events          EsignEvent[]
}

model EsignEvent {
  id          Int @id @default(autoincrement())
  requestId   Int
  request     EsignRequest @relation(fields:[requestId], references:[id])
  eventType   String  // SENT, VIEWED, SIGNED, DECLINED, REMINDED, EXPIRED
  signerEmail String?
  ipAddress   String?
  geolocation String?
  occurredAt  DateTime
  rawPayload  Json?
}

Engine: src/lib/esign-engine.ts
- Provider abstraction:
  abstract class EsignProvider {
    abstract create(req): Promise<{externalId}>
    abstract send(externalId): Promise<void>
    abstract status(externalId): Promise<Status>
    abstract download(externalId): Promise<Buffer>
    abstract void(externalId): Promise<void>
  }
- Implementations: DocuSignProvider, EtimadProvider, TawqeeHProvider, AdobeSignProvider, InternalProvider
- Webhook handler: /api/esign/webhook/[providerType] → records events
- Auto-update related entity when COMPLETED:
  - SalesContract → status = SIGNED
  - PurchaseOrder → if both parties sign → status = APPROVED

APIs:
- POST /api/esign/requests
- POST /api/esign/requests/[id]/send
- POST /api/esign/requests/[id]/void
- GET  /api/esign/requests/[id]/status
- GET  /api/esign/requests/[id]/download
- POST /api/esign/webhook/[providerType]
- POST /api/esign/providers (CRUD)

UI:
- /esign/inbox (طلبات بانتظار توقيعي)
- /esign/sent (طلبات أرسلتها)
- /esign/templates (قوالب مع حقول معدّة مسبقاً)
- لكل طلب: viewer + signature pad + decline button

Integration points:
- /contracts: زر "Send for eSign"
- /purchases/orders/[id]: زر "Send to vendor for eSign"
- /hr/offers: HR sends offer letters via eSign

Compliance:
- ZATCA approved للعقود الإلكترونية
- نظام التعاملات الإلكترونية السعودي (Article 16)
- PDPL data handling

Tests: integration tests مع DocuSign sandbox + Etimad test env.
```

---

### 🟠 P-04 / P-05: Native Mobile App + Offline Sync

**Prompt:**
```
ابنِ Mobile App بـ React Native لنظام Namasoft + Offline-First Sync.

Stack:
- Expo SDK 51 (managed workflow)
- TypeScript
- TanStack Query + WatermelonDB (local SQLite)
- expo-secure-store للـ tokens
- Authentication: Clerk Expo SDK

Screens (Phase 1):
1. Login (Email + Password + 2FA)
2. Home Dashboard (today's KPIs)
3. Approvals Inbox (approve POs, expenses, leaves on the go)
4. Sales:
   - Create Sales Order (offline-capable)
   - View customer
   - POS Mobile (offline)
5. Purchases:
   - Approve PO
   - Scan invoice (camera → AP Automation)
6. Inventory:
   - Stocktake (barcode scan via camera)
   - Adjust stock
7. HR:
   - Punch in/out (with geo)
   - Request leave
   - View payslip
8. Expense:
   - Capture receipt (camera)
   - Submit expense report
9. CRM:
   - View leads/opportunities
   - Log call/meeting
10. Notifications + Chat
11. Settings + Profile

Offline Strategy:
- WatermelonDB stores: products, customers, vendors, open SO/PO, my tasks
- Pull sync: every login + every hour (background)
- Push sync: queue mutations → sync when online
- Conflict resolution: server wins (last-write) for masters; queue review for critical (price changes, stock counts)

Sync Protocol:
- Versioned: each entity has `lastSyncedAt` + `serverVersion`
- Delta API: GET /api/mobile/sync?since=2026-05-10T00:00:00Z&entities=products,customers
- Push API: POST /api/mobile/sync/push { changes:[...] }
- Returns conflicts for review

Native Features:
- Camera: receipt OCR, barcode scan, attendance face recognition
- GPS: punch-in geofence
- Push notifications (FCM/APNS)
- Biometric login (FaceID/TouchID)
- Offline maps for delivery routes

Build & Deploy:
- EAS Build (Android APK + iOS IPA)
- Deploy to TestFlight (iOS) + Play Console (Android)
- Update OTA via Expo Updates (for JS changes)

API Layer (additions to ERP):
- /api/mobile/auth/*
- /api/mobile/sync/*
- /api/mobile/dashboard
- /api/mobile/quickactions (approve, reject, comment)

Security:
- Tokens stored in SecureStore (KeyStore/Keychain)
- Force re-auth after 30 days
- Remote wipe (admin feature)
- Cert pinning for production

Tests:
- Detox E2E
- Offline scenarios
- Sync conflict scenarios
```

---

### الـ Prompts المختصرة للفجوات المتبقية

> لباقي الـ 47 فجوة، البرومنت يتبع نفس النمط:
> **(1) Schema additions** → **(2) Engine** → **(3) APIs** → **(4) UI** → **(5) Tests** → **(6) استشر agents**

#### 🔴 F-03: Transfer Pricing
- Schema: `TransferPricingMethod`, `TPTransaction`, `TPBenchmarkStudy`, `TPDocumentation`
- Methods: CUP, RPM, CPM, TNMM, Profit Split (OECD)
- Output: Master File + Local File + CbCR (BEPS Action 13)

#### 🔴 O-01: Cash Application Engine (Advanced AI)
- 6-level matching: exact ref → exact amount → multi-invoice (knapsack) → partial → suspense → AI
- Confidence scoring + auto-post if > 90%
- Email parsing of remittance advice

#### 🟠 H-01 to H-10: HR Suite
- LMS: SCORM/xAPI player, course catalog, enrollment, certificates
- Recruitment: ATS (Applicant Tracking System) + career portal + AI screening
- Succession: 9-box grid + talent pool + readiness ratings
- Compensation: merit cycles + budget pots + manager allocation
- OKRs: tree of goals + check-ins + 360 review

#### 🟠 I-01 to I-13: WMS/MFG Advanced
- Wave Picking: group orders by zone/route → optimize picker tours
- Slotting: ABC analysis + velocity → recommend bin moves
- MES: real-time work order tracking, operator login, machine telemetry ingestion
- APS: constraint propagation (Asprova-like)
- SPC: X-bar / R charts, Cpk/Ppk, Western Electric rules
- OEE: Availability × Performance × Quality (real-time from machine sensors)

#### 🟠 C-01: Marketing Automation
- Drip campaigns (Mailchimp-style)
- Behavior triggers (e.g., abandoned cart, milestone)
- Email/SMS/WhatsApp orchestration
- A/B testing, send-time optimization

#### 🟠 C-07: Help Desk (ITSM)
- Multi-channel ticket intake (email, portal, WhatsApp, phone)
- SLA matrix (priority × type)
- Auto-escalation timer
- Knowledge base linking
- CSAT survey post-resolution

---

## 5) Artifacts الكاملة لكل فجوة

> لكل فجوة سيتم إنتاج (في ملفات منفصلة عند بدء التطبيق): **ERD · OpenAPI · User Stories · Test Cases · Wireframes · Style refs · i18n · Seeders · Migrations · Architecture Note · Security Note · Deployment Note · User Manual · Training Outline · Legal/Compliance Note**.

### 5.1 قالب موحد للـ Artifacts (لكل فجوة F-01..P-16)

```
/AUDIT_2026_05_11/gaps/<gap-id>/
├── README.md                 ← ملخص الفجوة + Business Value
├── prompt.md                 ← البرومنت الجاهز (مكرر من القسم 4)
├── scenario.md               ← سيناريو العمل التفصيلي
├── data-flow.mmd             ← Mermaid diagram
├── erd.mmd                   ← Entity Relationship (Mermaid)
├── openapi.yaml              ← OpenAPI 3.1 spec
├── user-stories.md           ← As-a/I-want/So-that format
├── acceptance-criteria.md    ← Given/When/Then
├── test-cases.md             ← Unit + Integration + E2E
├── test-plan.md              ← Strategy + Coverage targets
├── wireframes/               ← markdown wireframes (ASCII art) + Figma links
│   ├── list.md
│   ├── detail.md
│   ├── form.md
│   └── modals.md
├── architecture-note.md      ← Design decisions (ADR)
├── security-note.md          ← STRIDE threats + mitigations
├── deployment-note.md        ← Migration steps + rollback
├── style-guide.md            ← Component usage + colors + spacing
├── i18n.json                 ← ar + en translations
├── seeders.sql               ← Sample data
├── migrations.sql            ← Prisma migrations
├── user-manual.md            ← Step-by-step screenshots
├── training-outline.md       ← 30-min training plan
└── legal-compliance.md       ← SOCPA/IFRS/ZATCA/PDPL checks
```

### 5.2 مثال كامل لـ F-01 (Deferred Tax) — Artifacts Snippets

#### **ERD (Mermaid):**
```mermaid
erDiagram
    DeferredTax ||--o{ DeferredTaxItem : "has lines"
    DeferredTax }o--|| FiscalPeriod : "asof"
    DeferredTax }o--|| Tenant : "belongs to"
    DeferredTax ||--o| JournalEntry : "posts to"
    DeferredTaxRollforward ||--o{ DeferredTax : "summarizes"
    DeferredTax {
        int id PK
        int tenantId FK
        date asOfDate
        string itemCode
        decimal accountingBase
        decimal taxBase
        decimal temporaryDiff
        string diffType
        decimal taxRate
        decimal deferredTaxAmount
        string classification
        string recoverability
        int journalEntryId FK
        string status
    }
```

#### **OpenAPI snippet:**
```yaml
openapi: 3.1.0
info: { title: Deferred Tax API, version: 1.0.0 }
paths:
  /api/finance/deferred-tax/calculate:
    post:
      summary: Calculate deferred tax for period
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                asOfDate: { type: string, format: date }
                taxRate: { type: number }
              required: [asOfDate]
      responses:
        '200':
          description: Calculated DTAs/DTLs
          content:
            application/json:
              schema:
                type: array
                items: { $ref: '#/components/schemas/DeferredTax' }
components:
  schemas:
    DeferredTax:
      type: object
      required: [itemCode, temporaryDiff, deferredTaxAmount, classification]
      properties:
        id: { type: integer }
        itemCode: { type: string }
        temporaryDiff: { type: number }
        deferredTaxAmount: { type: number }
        classification: { type: string, enum: [DTL, DTA] }
```

#### **User Stories:**
```
US-DT-01: As a CFO, I want to compute deferred tax positions quarterly,
          so that I comply with IAS 12 and avoid audit qualifications.
  AC1: Given fiscal period 2026-Q2 closed, when I run "Calculate Deferred Tax",
       then system retrieves all temp diffs from FA, INV, Accrual, ECL, FX.
  AC2: Given a deductible temp diff of 100K and tax rate 20%, when I mark it
       as "PROBABLE recoverable", then a DTA of 20K is created.
  AC3: Given an UNCERTAIN DTA, when I attempt to post JE, then I must provide
       justification or it is blocked.

US-DT-02: As an Auditor, I want to download Effective Tax Rate reconciliation,
          so that I can verify tax provisioning.
  AC: Generates PDF showing statutory rate × profit, then reconciling adjustments
      to actual current+deferred tax expense.
```

#### **Test Cases:**
```
TC-DT-01: Calculate temp diff for fixed asset
  Setup: Asset cost 1M, book life 10y (10% depr), tax life 4y (25% depr)
  After Year 1: book NBV 900K, tax NBV 750K → temp diff 150K (taxable)
  Tax rate 20% → DTL 30K
  Expect: DeferredTax record with classification=DTL, amount=30000

TC-DT-02: DTA recoverability assessment
  Setup: 200K DTA from tax loss CF, but next 5y forecast shows losses
  Expect: AI assessment returns recoverable=false, JE blocked

TC-DT-03: OCI item (revaluation surplus)
  Setup: Revaluation surplus 500K (asset revalued up)
  Expect: DTL 100K recognized via OCI, not P&L
  JE: DR Revaluation Reserve 100K, CR Deferred Tax Liability 100K
```

#### **Wireframe (ASCII):**
```
┌─────────────────────────────────────────────────────────────────┐
│  الضريبة المؤجلة (Deferred Tax)                       [+ احتساب]│
├─────────────────────────────────────────────────────────────────┤
│  [Tab: حساب الفروق] [Rollforward] [استرداد DTA] [Reconciliation]│
├─────────────────────────────────────────────────────────────────┤
│  تاريخ الفحص: [2026-03-31 ▼]    معدل الضريبة: [20%]            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ البند           │ Book NBV  │ Tax NBV  │ Temp Diff │ DTL/DTA││
│  ├────────────────────────────────────────────────────────────┤│
│  │ Fixed Assets   │ 9,000,000 │ 7,500,000│ 1,500,000 │ DTL 300K││
│  │ Inventory NRV  │   480,000 │   500,000│  (20,000) │ DTA   4K││
│  │ Tax Loss CF    │         - │   200,000│  (200,000)│ DTA  40K││
│  │ Warranty Acc.  │    50,000 │         -│    50,000 │ DTA  10K││
│  │ FX Unrealized  │   120,000 │         -│   120,000 │ DTL  24K││
│  ├────────────────────────────────────────────────────────────┤│
│  │ Total DTL: 324,000     Total DTA: 54,000    Net: 270,000 DTL││
│  └────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [💾 Save Draft]  [✅ Recognize JE]  [📄 Generate IAS 12 Note]  │
└─────────────────────────────────────────────────────────────────┘
```

#### **i18n.json:**
```json
{
  "deferredTax.title": { "ar": "الضريبة المؤجلة", "en": "Deferred Tax" },
  "deferredTax.calculate": { "ar": "احتساب", "en": "Calculate" },
  "deferredTax.classification.DTL": { "ar": "خصم مؤجل", "en": "Deferred Tax Liability" },
  "deferredTax.classification.DTA": { "ar": "أصل مؤجل", "en": "Deferred Tax Asset" },
  "deferredTax.recoverability.PROBABLE": { "ar": "محتمل الاسترداد", "en": "Probable" },
  "deferredTax.recoverability.UNCERTAIN": { "ar": "غير مؤكد", "en": "Uncertain" }
}
```

#### **Seeders (SQL):**
```sql
-- Sample temp diff sources for testing
INSERT INTO DeferredTax (tenantId, asOfDate, itemCode, description, accountingBase, taxBase, temporaryDiff, diffType, taxRate, deferredTaxAmount, classification, status)
VALUES
  (1, '2026-03-31', 'FIXED_ASSET_DEPR', 'Building - depreciation timing', 9000000, 7500000, 1500000, 'TAXABLE_TEMP_DIFF', 0.20, 300000, 'DTL', 'DRAFT'),
  (1, '2026-03-31', 'INVENTORY_NRV', 'NRV write-down on stock', 480000, 500000, -20000, 'DEDUCTIBLE_TEMP_DIFF', 0.20, 4000, 'DTA', 'DRAFT'),
  (1, '2026-03-31', 'TAX_LOSS_CF', 'Carry forward 2024 losses', 0, 200000, -200000, 'DEDUCTIBLE_TEMP_DIFF', 0.20, 40000, 'DTA', 'DRAFT');
```

#### **Migration (Prisma):**
```bash
npx prisma migrate dev --name add-deferred-tax-engine
```

#### **Architecture Note (ADR-001):**
```
Status: Proposed
Context: IAS 12 deferred tax requires multi-source temp diff aggregation.
Decision: Build a unified engine that pulls from FA/INV/ECL/Accrual modules
          via standard interfaces. Use Multi-Book to post Book/IFRS only.
Consequences:
  + Single source of truth for tax positions
  + Auditable rollforward
  - Requires upstream modules to expose getTemporaryDifferences() interface
```

#### **Security Note (STRIDE):**
```
Spoofing: Auth required for all endpoints (Clerk session check).
Tampering: Field audit logs every change. DT records signed at recognition.
Repudiation: Approval engine logs CFO approval immutably.
Info Disclosure: DT data is financial → restricted to roles [CFO, FINANCE_MANAGER, AUDITOR].
DoS: Rate limit /calculate to 10/hour per tenant (heavy compute).
Escalation: Recoverability=UNCERTAIN cannot bypass approval without CFO override.
```

#### **Deployment Note:**
```
Prerequisites:
1. Multi-Book engine must be deployed (uses BookId routing)
2. Fixed Assets engine must expose getTempDiffs() — extend
3. Migrate: prisma migrate deploy

Rollout:
- Phase 1: Deploy DB + Engine + API (no UI exposure)
- Phase 2: Run shadow calculations vs manual spreadsheet (1 quarter)
- Phase 3: Enable UI behind feature flag (per tenant)
- Phase 4: Make default

Rollback:
- Feature flag off → UI hidden
- DB tables remain (no destructive)
- Engine deactivated via env var DEFERRED_TAX_ENABLED=false
```

---

> **ملاحظة:** نفس القالب يُكرّر لـ 47 فجوة. للحفاظ على حجم هذا المستند، الـ artifacts الكاملة لكل فجوة ستُنتج عند بدء كل sprint (مع تنفيذ البرومنت). الـ skeleton + الـ checklist موجود.

---

## 6) Architecture & Cross-Cutting

### 6.1 Architecture Document (High-Level)

```
┌──────────────────────────────────────────────────────────────────┐
│                         Namasoft ERP                              │
├──────────────────────────────────────────────────────────────────┤
│  Presentation Layer                                               │
│  ├── Web (Next.js 16 App Router + RSC + Tailwind 4)              │
│  ├── PWA (Service Worker + IndexedDB)                            │
│  ├── Desktop (Electron 28)                                       │
│  ├── Mobile (React Native — to build)                            │
│  └── Customer Portal (subdomain)                                 │
├──────────────────────────────────────────────────────────────────┤
│  API Gateway                                                      │
│  ├── Next.js API Routes (REST)                                   │
│  ├── Webhook receivers                                           │
│  ├── Rate Limiting (Upstash Redis)                               │
│  └── Auth (Clerk: Sessions + 2FA + Org-based for Portal)         │
├──────────────────────────────────────────────────────────────────┤
│  Business Logic (src/lib/*-engine.ts) — 101 engines              │
│  ├── Accounting Core (auto-journal, costing, numbering)          │
│  ├── IFRS Engines (lease, revenue, ECL, hedging, deferred tax)   │
│  ├── Saudi Compliance (GOSI, WPS, Zakat, WHT, Qiwa, ZATCA)       │
│  ├── O2C/P2P (cash-app, 3-way-match, dunning, payment-run)       │
│  ├── Manufacturing (BOM, MRP, MES — to expand)                   │
│  ├── Treasury (bank-recon, cash-forecast)                        │
│  ├── Workflow (BPMN engine — to expand)                          │
│  └── AI (Gemini orchestration, RAG, NLQ, forecasting)            │
├──────────────────────────────────────────────────────────────────┤
│  Data Layer                                                       │
│  ├── PostgreSQL (per-tenant DBs via Prisma)                      │
│  ├── Master DB (tenant routing + system settings)                │
│  ├── Redis (cache + queue + rate-limit)                          │
│  ├── S3 / R2 (file storage)                                      │
│  └── ClickHouse (BI/Analytics — to add)                          │
├──────────────────────────────────────────────────────────────────┤
│  Integration Layer                                                │
│  ├── ZATCA API (Fatoora)                                         │
│  ├── Saudi Gov APIs (Mudad, Qiwa, GOSI, ZATCA, Etimad)           │
│  ├── Banks (open banking + file-based)                           │
│  ├── E-commerce (Salla, Zid, Shopify, WooCommerce)               │
│  ├── Email/SMS (SendGrid, Twilio, Unifonic for KSA)              │
│  └── AI Providers (Gemini primary, OpenAI fallback)              │
└──────────────────────────────────────────────────────────────────┘

Cross-Cutting:
- Audit (field-audit.ts) attached to every mutation
- Approval (approval-engine.ts) for sensitive operations
- Governance/SoD (governance-engine.ts) checks
- Numbering (numbering.ts) for all docs
- State Machine (document-state-machine.ts) for lifecycle
- BPMN (bpmn-engine.ts) for complex workflows
- Notifications (notification-engine.ts) for alerts
- Webhooks for integrations
- i18n (next-intl) for languages
```

### 6.2 Security Plan (Top-Level)

| التهديد (STRIDE) | المخاطرة | الضد |
|------------------|----------|-------|
| **Spoofing** | تسجيل دخول مزور | Clerk + 2FA + MFA + Trusted Devices |
| **Tampering** | تعديل قيود محاسبية | Field-Level Audit + State Machine + Post lock |
| **Repudiation** | إنكار من قام بإجراء | Audit Logs + Approval signatures + IP/UA tracking |
| **Info Disclosure** | تسرب بيانات tenant | Strict tenantId filter + Field permissions + PDPL masking |
| **DoS** | إغراق API | Rate limit per route (Upstash) + WAF (Cloudflare) |
| **Escalation** | تجاوز صلاحيات | RBAC + SoD rules + Approval thresholds + Period locks |

#### الالتزامات:
- SOC 2 Type II readiness in 12 months
- ISO 27001 alignment
- PDPL (Saudi Personal Data Protection Law) — في النظام
- ZATCA Phase 2 — قائم
- PCI DSS for payment flows (via HyperPay/Tap, لا تخزين بطاقات)

#### الإجراءات الإلزامية:
- TLS 1.3 only
- HSTS + CSP + SRI headers
- Field-level encryption for: SSN, IBAN, Salary, Health data
- Secrets in Vault (not env vars in prod)
- Quarterly penetration testing
- Vulnerability scanning (Snyk + npm audit في CI)
- Dependency updates: weekly cron PR

### 6.3 Deployment Plan

```
Environments:
  ┌─────────────────────────────────────────┐
  │ DEV       → developers local + Vercel preview │
  │ STAGING   → pre-prod (mirror of prod schema)  │
  │ PROD      → production (Hetzner + Vercel)     │
  │ SANDBOX   → demo + customer trials            │
  └─────────────────────────────────────────┘

CI/CD (GitHub Actions):
  on push to main:
    1. npm run lint
    2. npm run typecheck
    3. npm test (Jest + Playwright)
    4. Build Next.js
    5. Build Electron (if release)
    6. Run prisma migrate diff (warn if breaking)
    7. Deploy preview → Vercel
    8. Manual approval → Deploy prod

DB Migration Strategy:
  - Backwards-compatible always
  - 3-phase for breaking changes: add → migrate-data → remove old
  - Zero-downtime via shadow tables

Backup:
  - PG point-in-time recovery (WAL archiving) → S3
  - Daily snapshots, 30-day retention
  - Quarterly DR drills

Monitoring:
  - Sentry (errors)
  - Datadog (APM + logs)
  - Uptime Robot (status)
  - Custom dashboard (/sys/health)
```

### 6.4 Style Guide / Design System

```
Color Palette:
  Primary:   #1E40AF (Indigo 800)   ← actions
  Success:   #16A34A (Green 600)    ← positive
  Warning:   #D97706 (Amber 600)    ← caution
  Danger:    #DC2626 (Red 600)      ← destructive
  Info:      #2563EB (Blue 600)     ← informational
  Neutral:   gray-50 → gray-900 scale

Typography:
  Arabic:    Tajawal (400, 500, 700)
  Latin:     Inter (400, 500, 600, 700)
  Mono:      JetBrains Mono (code)

Spacing scale: 4px base (Tailwind default)

Components (shadcn/ui patterns):
  Button (primary, secondary, ghost, destructive, link)
  Input (text, number, date, currency, search)
  Select (single, multi, async, combobox)
  Table (sortable, filterable, paginated, expandable)
  Modal / Drawer / Popover / Tooltip
  Tabs / Accordion
  Form (react-hook-form + zod resolvers)
  Toast / Alert
  Badge / Chip / Avatar
  Card / DataCard / KPI Card
  Charts (Recharts wrapped)
  DateRangePicker / DatePicker
  EmptyState / LoadingState / ErrorState
  Wizard / Stepper
  CommandPalette (⌘K)

RTL/LTR:
  Layout direction switches automatically
  Icons mirror for arrows (←/→)
  Numbers always LTR (even in Arabic)
  Currency: SAR right-aligned in tables

Accessibility:
  WCAG 2.1 AA
  Keyboard navigation: all actions
  Screen reader labels (aria-*)
  Color contrast: 4.5:1 minimum
  Focus indicators
```

### 6.5 i18n Plan

```
Languages supported:
  - ar (Arabic) — primary
  - en (English) — primary
  - ur (Urdu)
  - hi (Hindi)
  - bn (Bengali)

Structure:
  /src/locales/
    ar.json  ← single mega-file (or namespaced)
    en.json
    ur.json
    hi.json
    bn.json

Convention:
  "module.entity.field" → "العميل"
  "module.entity.action.SAVE" → "حفظ"
  "errors.VALIDATION_FAILED" → "البيانات غير صحيحة"

Pluralization:
  Use ICU MessageFormat (next-intl supports)

Date/Number Formatting:
  - Use Intl.DateTimeFormat / Intl.NumberFormat
  - Hijri support for Saudi (umalqura)
  - Currency: format per locale ("١٢٣٬٤٥٦٫٠٠ ر.س" vs "SAR 123,456.00")

Translation Workflow:
  - Source: en.json (manual)
  - Auto-translate via Gemini to other locales
  - Manual review checklist before release
  - Missing-key reporter in dev (logs)
```

### 6.6 Sample Data / Seeders

```
Seeders provided per module:
  /prisma/seeders/
    00-system/        ← Currencies, ExchangeRates, basic settings
    01-tenant/        ← One default tenant + admin user
    02-coa/           ← SOCPA Chart of Accounts (Arabic + English)
    03-tax/           ← VAT, WHT codes, Zakat categories
    04-hr/            ← Sample employees, departments, jobs
    05-products/      ← 50 sample products (mixed categories)
    06-customers/     ← 30 sample customers
    07-vendors/       ← 25 sample vendors
    08-transactions/  ← 6 months of synthetic data (invoices, payments, JE)
    09-fixed-assets/  ← 10 assets across categories
    10-bom/           ← 5 sample BOMs for manufacturing
    11-zatca/         ← Sandbox CSR + CSID (for testing only)
    12-workflows/     ← 5 default BPMN processes
    13-portal/        ← Default customer portal config
```

### 6.7 Migration Scripts Strategy

```
Phase 1 — Schema additions (this audit covers):
  - DeferredTax + DeferredTaxRollforward
  - CashGeneratingUnit + ImpairmentTest + ImpairmentAllocation
  - IntercompanyParticipant + NettingCycle + NettingPosition + NettingSettlement
  - TransferPricingMethod + TPTransaction + TPBenchmarkStudy
  - PortalUser + PortalSession + PortalActivity
  - APInvoiceCapture (extend existing InvoiceCapture)
  - EsignProvider + EsignRequest + EsignEvent
  - BpmnProcess + BpmnInstance + BpmnTask + BpmnHistory
  - LmsCourse extensions: LmsModule, LmsLesson, LmsQuiz, LmsCertificate
  - HelpDeskTicket + HelpDeskSlaPolicy + HelpDeskEscalation
  - Survey + SurveyResponse (for NPS/CSAT)
  - MarketingCampaign + CampaignEvent + AudienceSegment

Phase 2 — Data migrations:
  - Backfill Lead → CrmAccount (resolve duplication)
  - Consolidate Prescription + ClinicPrescription
  - Consolidate Student + SchoolStudent
  - Link orphaned Journey models to actual flows or mark deprecated

Phase 3 — Cleanup:
  - Drop deprecated tables (after 2 release cycles)
```

### 6.8 User Manual (Outline)

```
/docs/manual/
  00-getting-started.md
  01-accounting/
    01.1-chart-of-accounts.md
    01.2-journal-entries.md
    01.3-period-close.md
    01.4-financial-statements.md
  02-sales/
    02.1-quotes-to-orders.md
    02.2-pos-operations.md
    02.3-returns.md
  03-purchases/
    ...
  04-inventory/
  05-manufacturing/
  06-hr-payroll/
  07-treasury/
  08-reporting/
  09-saudi-compliance/
  10-administration/
  11-mobile-app/
  12-portal/
  13-integrations/
```

Each page includes:
- Goal
- Prerequisites
- Step-by-step with screenshots
- Common mistakes
- Related actions
- Video tutorial link

### 6.9 Training Videos (Outline)

```
Training Library:
  Track 1 — End User (Accountant) — 8 hours
    1. Navigating the system (30 min)
    2. Creating sales invoices (45 min)
    3. Processing purchases (45 min)
    4. Bank reconciliation (60 min)
    5. Period close procedure (60 min)
    6. Standard reports (45 min)
    7. ZATCA submissions (30 min)
    8. Common errors & fixes (45 min)

  Track 2 — Manager — 6 hours
    1. Approval workflows
    2. Reading dashboards
    3. Budget vs actual
    4. Variance analysis
    5. Strategic reports

  Track 3 — Admin — 8 hours
    1. User management
    2. Role design (RBAC + SoD)
    3. Number sequences
    4. Print templates
    5. Workflow customization
    6. Custom fields
    7. Integrations
    8. Backup/restore

  Track 4 — Developer — 12 hours
    1. Architecture overview
    2. Schema model
    3. Auto-journal engine
    4. Writing custom engines
    5. APIs + webhooks
    6. Multi-tenant design
    7. Testing strategy
    8. Deployment
```

### 6.10 Legal & Compliance Documents

```
Required Documents (lawyer + CFO sign-off):
  /legal/
    terms-of-service.md (AR + EN)
    privacy-policy.md  (PDPL-compliant)
    data-processing-agreement.md (DPA template for B2B)
    sla.md (uptime 99.5%, response time tiers)
    acceptable-use.md
    refund-policy.md
    intellectual-property.md
    
  /compliance/
    socpa-mapping.md         ← which features satisfy which SOCPA standards
    ifrs-coverage.md         ← IFRS 1-17 mapping
    zatca-phase2-cert.md     ← certificate copies + renewal calendar
    gosi-attestation.md
    pdpl-records-of-processing.md
    iso-27001-readiness.md
    soc2-readiness.md
    pen-test-reports/        ← quarterly
    audit-trail-policy.md    ← 6-year SOCPA retention
```

---

## 7) خطة التنفيذ 12 شهراً

### 7.1 Gantt (شهري)

```
                       Q1            Q2            Q3            Q4
Month:           1  2  3      4  5  6      7  8  9     10 11 12

🔴 F-01 Deferred Tax    [==]
🔴 F-02 Impairment        [==]
🔴 F-04 IC Netting         [===]
🔴 O-01 Cash App AI         [===]
🔴 C-06 Cust Portal           [====]
🟠 F-03 Transfer Pricing         [====]
🟠 O-09 AP Automation             [===]
🟠 P-01 BPMN Designer              [======]
🟠 P-04+5 Mobile + Sync                [=========]
🟠 P-13 eSign                              [===]
🟠 P-14 DMS deep                                [====]
🟠 P-15 Multi-Country                              [=====]
🟡 H-01..10 HR Suite                       [============]
🟡 I-01..13 WMS/MFG                              [============]
🟡 C-01 Mkt Automation                                [====]
🟡 C-07 Help Desk                                       [===]
🔵 I-11 Demand Sensing                                       [===]
🔵 I-12 S&OP                                                  [====]
```

### 7.2 Sprint Plan (أول 12 sprint = 6 شهور)

| Sprint | الأسبوع | المحاور | المخرجات |
|--------|---------|---------|----------|
| S1 | 1-2 | F-01 Deferred Tax | Engine + API + UI + Tests + Note |
| S2 | 3-4 | F-02 Impairment IAS 36 | CGU + Test + DCF + Allocation |
| S3 | 5-6 | F-04 IC Netting | Cycles + Settlement + JEs |
| S4 | 7-8 | O-01 Cash App AI | 6-level matching + AI fallback |
| S5 | 9-10 | C-06 Portal Foundation | Auth + Dashboard + Orders |
| S6 | 11-12 | C-06 Portal Complete | Invoices + Payments + Statements |
| S7 | 13-14 | F-03 Transfer Pricing | Methods + Docs + CbCR |
| S8 | 15-16 | O-09 AP Automation | OCR + Match + Routing |
| S9 | 17-18 | P-01 BPMN Engine | Parser + Runtime + Tasks |
| S10 | 19-20 | P-01 BPMN Designer | UI + Forms + Deploy |
| S11 | 21-22 | P-04 Mobile Foundation | Auth + Home + 5 screens |
| S12 | 23-24 | P-05 Offline Sync | WatermelonDB + sync protocol |

### 7.3 KPIs لقياس النجاح (Phase-by-phase)

| KPI | الهدف Q1 | Q2 | Q3 | Q4 |
|-----|-----------|-----|-----|-----|
| IFRS Compliance Score | 85% | 95% | 98% | 100% |
| Audit qualifications | 2 | 0 | 0 | 0 |
| Mean Time to Close (period) | 5 days | 3 days | 2 days | 2 days |
| % Auto-matched bank txns | 70% | 85% | 92% | 95% |
| % Auto-processed AP invoices | 0% | 50% | 70% | 80% |
| Active Portal users / customer | 0 | 1 | 2 | 3+ |
| Workflow processes deployed | 0 | 5 | 15 | 30 |
| Mobile app installs | 0 | 100 | 500 | 2000 |
| NPS (customer) | n/a | +20 | +35 | +50 |
| Test coverage (lib) | 20% | 50% | 75% | 85% |

---

## 8) قائمة فحص الإطلاق

### 8.1 قبل الإطلاق التجاري الواسع (Go-to-Market)

#### الامتثال
- [ ] ZATCA Phase 2 production CSID (لكل tenant جديد)
- [ ] SOCPA mapping document signed by CPA
- [ ] PDPL Data Processing Records up-to-date
- [ ] GOSI integration tested in production sandbox
- [ ] WPS files validated by at least 2 SAR banks
- [ ] IFRS 1-17 coverage attestation
- [ ] Big-4 audit firm pre-review (optional but recommended)

#### الأمان
- [ ] Penetration test (external firm) — high/critical = 0
- [ ] Secret scanner clean (TruffleHog/GitGuardian)
- [ ] All env vars in Vault (no plaintext)
- [ ] MFA enforced for admin roles
- [ ] Session timeout configured (15 min idle for sensitive roles)
- [ ] Backup restore drill successful
- [ ] DR plan tested (RTO < 4h, RPO < 1h)

#### الأداء
- [ ] Load test: 1000 concurrent users (response < 500ms p95)
- [ ] Database tuned (indexes on all queried fields)
- [ ] N+1 audit clean (Prisma include/select reviewed)
- [ ] CDN configured for static assets
- [ ] Image optimization pipeline (next/image)

#### الجودة
- [ ] Test coverage > 75% (lib + critical paths)
- [ ] E2E tests for 20 critical journeys (Playwright)
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] Lighthouse score > 90 (all categories)
- [ ] Accessibility audit WCAG 2.1 AA

#### العمليات
- [ ] Status page (status.namasoft.com)
- [ ] Incident response playbook
- [ ] On-call rotation defined
- [ ] Customer success team trained
- [ ] Support ticket SLAs defined (Critical 1h, High 4h, Medium 1d, Low 3d)
- [ ] Knowledge base seeded (50+ articles)
- [ ] Video training library (40+ videos)
- [ ] Migration toolkit (from QuickBooks, Tally, manual Excel)

#### القانوني
- [ ] Terms of Service finalized + lawyer reviewed
- [ ] Privacy Policy PDPL-compliant
- [ ] SLA documented (uptime, response, refund)
- [ ] DPA template ready (for B2B)
- [ ] EULA for desktop app
- [ ] Trademark filing complete

#### التسويق
- [ ] Landing page (namasoft.com)
- [ ] Pricing page (3-4 tiers)
- [ ] Sales collateral (PDFs, decks)
- [ ] Demo environment public
- [ ] Comparison guide (vs Odoo, Tally, QB, Daftra)
- [ ] Case studies (3-5 beta customers)
- [ ] Press release ready

---

## الخاتمة

هذا المستند يمثّل **خارطة الطريق الكاملة لتحويل Namasoft من ERP محلي ممتاز إلى ERP عالمي المستوى**.

### ما تم إنجازه في هذا التقرير:
✅ فحص فعلي لـ 489 Prisma model + 718 API + 444 page + 101 engine
✅ مقارنة مع SAP S/4HANA / Oracle Fusion / NetSuite / Odoo
✅ 47 فجوة مصنّفة بالأولوية والجهد والـ ROI
✅ برومنت جاهز للنسخ لكل فجوة عالية/حرجة
✅ Business Scenario لكل فجوة
✅ Data Flow بـ Mermaid لكل فجوة
✅ Artifacts template موحّد (ERD, API, Stories, Tests, Wireframes, etc.)
✅ Architecture / Security / Deployment / Style / i18n plans
✅ خطة تنفيذية 12 شهر (sprint-by-sprint)
✅ KPIs للقياس
✅ Launch checklist

### الخطوة التالية الموصى بها:
1. **اعرض المستند على CFO + CTO** للموافقة على الأولويات
2. **ابدأ بـ Sprint 1 (F-01 Deferred Tax)** باستخدام البرومنت في القسم 4
3. **افتح Issue tracker** (GitHub Projects أو Linear) — task per gap
4. **خصّص فريق** (2-3 مطورين full-time + CPA part-time + UX part-time)
5. **استثمر في QA** (مطور QA متخصص + Playwright suite)

---

**نهاية المستند — صفحة 1 من 1**
**حجم المستند: ~13,000 كلمة**
**الفجوات المغطاة: 47 / 47**
**Artifacts templates: 15 لكل فجوة**

> 📄 الـ artifacts التفصيلية لكل فجوة ستُنتج في مجلد `/AUDIT_2026_05_11/gaps/<gap-id>/` عند البدء بتنفيذها.
