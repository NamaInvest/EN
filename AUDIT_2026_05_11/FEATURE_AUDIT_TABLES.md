# 📊 جداول فحص الميزات التفصيلية

> فحص ميزة بميزة لكل قسم — أعمدة، أزرار، حقول، Hidden gaps

---

## 1. وحدة المحاسبة (Accounting)

### 1.1 شجرة الحسابات (/accounting/coa)

| الميزة | الحالة | عالمي ينقصه | ملاحظة |
|--------|--------|---------------|--------|
| Tree view متعدد المستويات | ✅ | - | - |
| إضافة/تعديل/حذف حساب | ✅ | - | - |
| تصنيف (Asset/Liability/Equity/Rev/Exp) | ✅ | - | - |
| ربط بـ Account Mapping | ✅ | - | - |
| Multi-currency designation | ✅ | - | - |
| Dimension required (CC/PC/Project/Segment) | ✅ | - | - |
| Account lock (no posting) | ✅ | - | - |
| Account aliases (per book) | 🟠 | Multi-GAAP per-account mapping | جزئي |
| Account hierarchy snapshots (per fiscal year) | 🔴 | لا يوجد | F-06 |
| Account inactivation with audit | ✅ | - | - |
| Bulk import/export | ✅ | - | - |
| SOCPA template restore | ✅ | - | - |
| **Action Buttons:** New, Edit, Delete, Lock, Import, Export, Print Tree |
| **Hidden Buttons Needed:** Compare books, History timeline, AI suggest dimension |

### 1.2 القيود اليومية (/accounting/journal)

| الميزة | الحالة | عالمي | ملاحظة |
|--------|--------|--------|--------|
| Manual JE entry | ✅ | - | - |
| Multi-line with debit/credit | ✅ | - | - |
| Validation: balanced | ✅ | - | - |
| Multi-currency lines | ✅ | - | - |
| Auto-numbering | ✅ | - | - |
| Dimensions per line (CC/PC/Project) | ✅ | - | - |
| State machine (DRAFT/POSTED/REVERSED) | ✅ | - | - |
| Reverse JE | ✅ | - | - |
| Recurring JE | 🟠 | جزئي | يحتاج enhancement |
| JE Templates | ✅ | - | - |
| Attachment upload | ✅ | - | - |
| Approval routing | ✅ | - | - |
| Mass JE creation (Excel paste) | 🟡 | جزئي | UX needs improvement |
| Reverse Charge VAT auto | ✅ | - | - |
| **Buttons:** New, Save Draft, Post, Reverse, Print, Duplicate, Template, Attach |
| **Missing Buttons:** Schedule recurrence, Convert to template, AI suggest accounts, Compare with similar |

### 1.3 ميزان المراجعة (/accounting/trial-balance)

| الميزة | الحالة |
|--------|--------|
| As of date filter | ✅ |
| Multi-period comparison | ✅ |
| Drill-down to GL → JE | ✅ |
| Export to Excel | ✅ |
| Multi-currency consolidated | ✅ |
| By Cost Center / Profit Center / Project | ✅ |
| **Missing:** Subledger reconciliation toggle, Period-end vs adjusted, Side-by-side books comparison |

### 1.4 إغلاق الفترات (/accounting/period-close)

| الميزة | الحالة |
|--------|--------|
| Soft close (allow adjusting) | ✅ |
| Hard close (full lock) | ✅ |
| Checklist | ✅ |
| Period lock log | ✅ |
| Reverse temp accounts | 🟠 (basic) |
| Generate adjusting entries (Accruals, Prepaids, Depreciation, FX Revaluation) | 🟠 جزئي |
| Inter-company elimination | 🟠 |
| Variance analysis | 🟠 |
| Roll forward to next period | ✅ |
| **Missing:** Multi-entity simultaneous close, Cascade lock to consolidation, Pre-close validation report |

---

## 2. وحدة المبيعات (Sales)

### 2.1 فواتير المبيعات (/sales)

| الميزة | الحالة |
|--------|--------|
| Create from scratch | ✅ |
| Create from Sales Order | ✅ |
| Create from Delivery Note | ✅ |
| Multi-currency | ✅ |
| Multi-tax (VAT, WHT, sub-totals) | ✅ |
| Discount: line + invoice | ✅ |
| Installments (payment terms) | ✅ |
| Recurring billing | ✅ |
| ZATCA Phase 2 XML | ✅ |
| QR code | ✅ |
| Email + WhatsApp send | ✅ |
| Credit note | ✅ |
| **Missing:** Embedded payment link (HyperPay), Multi-language invoice PDF, Custom template per customer, Auto-attach delivery proof |

### 2.2 POS (/pos)

| الميزة | الحالة |
|--------|--------|
| Touch-friendly UI | ✅ |
| Barcode scan | ✅ |
| Multiple payment methods | ✅ |
| Split payment | 🟠 جزئي |
| Discount + promotion | ✅ |
| Customer lookup | ✅ |
| Hold/recall sale | ✅ |
| Refund | ✅ |
| Cashier shift open/close | ✅ |
| Offline mode | 🟠 جزئي |
| **Missing:** Customer-facing display, Receipt customization deep, Loyalty redemption inline, Gift card sell/redeem, Pre-orders, Layaway |

### 2.3 العمولات (/sales/commissions)

| الميزة | الحالة |
|--------|--------|
| Commission rules per rep | ✅ |
| Tiered rates | ✅ |
| Multi-product rates | ✅ |
| Calculation engine | ✅ |
| Accrual JE | ✅ |
| **Missing:** Spiff/SPIFF bonuses, Quota-based multipliers, Team commissions, Commission disputes workflow, Salesman cockpit |

---

## 3. وحدة المشتريات (Purchases)

### 3.1 طلبات الشراء (/purchases/requisitions)

| الميزة | الحالة |
|--------|--------|
| Create PR | ✅ |
| Approval workflow | ✅ |
| Convert to RFQ or PO | ✅ |
| **Missing:** Catalog ordering (punch-out), Auto-pop from MRP, Budget check inline, Smart vendor suggestion |

### 3.2 RFQ (/purchases/rfq)

| الميزة | الحالة |
|--------|--------|
| Create + send to multiple vendors | ✅ |
| Track responses | ✅ |
| Compare quotes side-by-side | ✅ |
| Award winner | ✅ |
| **Missing:** Reverse auction (O-07), Sealed bids, e-Bidding portal access for vendors, Bid analytics |

### 3.3 أوامر الشراء (/purchase-orders)

| الميزة | الحالة |
|--------|--------|
| Standard PO | ✅ |
| Blanket / Contract PO | 🟠 (basic) |
| Drop-ship PO | 🟠 |
| Subcontracting PO | ✅ |
| Multi-line + multi-delivery date | ✅ |
| Send to vendor (Email + Portal) | ✅ |
| Vendor acknowledgment | 🟠 |
| Amendment with version | 🟠 |
| **Missing:** Schedule lines (O-10), EDI integration (810/850/856), Vendor confirmation auto-import |

### 3.4 GRN + 3-Way Match (/purchases/three-way-match)

| الميزة | الحالة |
|--------|--------|
| GRN creation | ✅ |
| 3-Way Match engine | ✅ |
| Tolerance check | ✅ |
| Exception routing | ✅ |
| **Missing:** Inspection step (4-way match), Quality hold post-GRN, Receipt scanning via mobile, Cross-dock identification |

---

## 4. المخزون (Inventory)

### 4.1 الأصناف (/products)

| الميزة | الحالة |
|--------|--------|
| SKU master | ✅ |
| Categories, brands, units | ✅ |
| Multi-UOM (units conversion) | ✅ |
| Variants (size/color/style) | ✅ |
| Batch tracking | ✅ |
| Serial tracking | ✅ |
| Expiry tracking | ✅ |
| Costing method (FIFO/LIFO/Avg) | ✅ |
| Pricing tiers | ✅ |
| Multi-language descriptions | ✅ |
| Images + attachments | ✅ |
| **Missing:** Configurable products (BTO), Bundles/kits deep, Substitutes/alternates auto-swap, Lifecycle (NPI/Active/EOL), Compliance attributes (HS code, country of origin), Specs PDF |

### 4.2 WMS (/inventory/wms)

| الميزة | الحالة |
|--------|--------|
| Warehouse + zones + bins | ✅ |
| Putaway rules | 🟠 |
| Pick lists | ✅ |
| FIFO/FEFO picking | ✅ |
| Stocktake + cycle count | ✅ |
| Mobile barcode scan | 🟠 |
| **Missing:** Wave/cluster picking (I-01), Slotting opt (I-02), Cross-dock (I-03), Voice picking (I-04), Yard management, Container tracking, Cartonization, Pack station with weight verification |

---

## 5. التصنيع (Manufacturing)

### 5.1 BOMs (/manufacturing/boms)

| الميزة | الحالة |
|--------|--------|
| Multi-level BOM | ✅ |
| Versions + Effective dates | ✅ |
| Yield + scrap | ✅ |
| Phantom BOM | 🟠 |
| Where-used | 🟠 (I-10) |
| Compare versions | 🟠 (I-10) |
| **Missing:** ECO workflow (I-09), CAD/PLM integration, Engineering BOM vs Manufacturing BOM, By-product recipes deep |

### 5.2 Work Orders (/manufacturing/orders)

| الميزة | الحالة |
|--------|--------|
| WO creation | ✅ |
| Routing | ✅ |
| Material consumption | ✅ |
| Labor tracking | 🟠 |
| Machine assignment | ✅ |
| Backflushing | 🟠 |
| WIP valuation | 🟠 |
| **Missing:** Rework WO workflow, Subcontracting WO deep, Standard cost variance posting per WO close, Genealogy/traceability (lot-to-lot), Operator portal (shopfloor I-05) |

### 5.3 Quality (/quality)

| الميزة | الحالة |
|--------|--------|
| Inspection plans | ✅ |
| NCR | ✅ |
| CAPA | ✅ |
| **Missing:** SPC charts (I-07), Calibration (I-13), Vendor quality scorecard auto, Quality holds inventory automation |

---

## 6. HR (Human Resources)

### 6.1 الموظفون (/hr)

| الميزة | الحالة |
|--------|--------|
| Master data | ✅ |
| Org chart | ✅ |
| Documents (CR/Iqama/Passport) with expiry alerts | ✅ |
| Family/dependents | ✅ |
| Banking details | ✅ |
| **Missing:** Multi-position assignment, Career history visualization, Competency matrix (H-02), 9-box (H-01), Mood/sentiment surveys |

### 6.2 الحضور (/hr/attendance)

| الميزة | الحالة |
|--------|--------|
| Manual punch | ✅ |
| Roster + shifts | ✅ |
| Overtime calc | ✅ |
| Leave deductions | ✅ |
| **Missing:** Biometric integration deep (H-07), Geofencing strict, Selfie-based punch, Anomaly detection ML |

### 6.3 الرواتب (/hr/payroll)

| الميزة | الحالة |
|--------|--------|
| Run + post to GL | ✅ |
| GOSI calc (KSA) | ✅ |
| WPS file (KSA) | ✅ |
| Loan deductions | ✅ |
| Adjustments | ✅ |
| Multi-country | 🔴 (H-08) |
| **Missing:** Off-cycle runs deep, Garnishments, Court orders, Multi-currency payroll, Year-end T4/W2 equivalents |

---

## 7. الخزينة (Treasury)

### 7.1 البنوك (/accounting/banks)

| الميزة | الحالة |
|--------|--------|
| Bank account master | ✅ |
| Bank statement import | ✅ |
| Reconciliation engine | ✅ |
| Multi-currency accounts | ✅ |
| **Missing:** In-house bank (central treasury), Notional pooling, Intra-day balances real-time feed, FX hedging integration, Cash concentration sweeps |

### 7.2 الشيكات (/treasury/checks)

| الميزة | الحالة |
|--------|--------|
| Issue checks | ✅ |
| Receive checks | ✅ |
| Check register | ✅ |
| Print on check stock | ✅ |
| **Missing:** Positive pay file generation, MICR encoding deep, Check void workflow, Stale check handling |

---

## 8. التقارير المالية (Reports)

### 8.1 الأساسية

| التقرير | الحالة |
|---------|--------|
| Trial Balance | ✅ |
| Income Statement | ✅ |
| Balance Sheet | ✅ |
| Cash Flow (Indirect) | ✅ |
| Cash Flow (Direct) | 🔴 (F-08) |
| Equity Statement | 🟠 (F-07) |
| Notes to FS auto | 🟠 (F-09) |
| Aging (AR/AP) | ✅ |
| GL Detail | ✅ |
| Subledger Reconciliation | 🟠 |
| Segment Report (IFRS 8) | 🔴 (F-10) |
| **Missing:** XBRL/iXBRL tagged output for ZATCA/Tadawul, IFRS Taxonomy mapping, Multi-period comparison standard |

---

## 9. CRM

### 9.1 العملاء (/customers)

| الميزة | الحالة |
|--------|--------|
| Master + 360 view | ✅ |
| Activities timeline | ✅ |
| Documents | ✅ |
| Credit limit + hold | ✅ |
| Statements | ✅ |
| **Missing:** Account hierarchy deep (C-03), Health score (C-02), Customer lifecycle stage, Account team (C-03) |

### 9.2 Leads + Opportunities (/crm/leads, /crm/opportunities)

| الميزة | الحالة |
|--------|--------|
| Lead capture | ✅ |
| Lead scoring | 🟠 |
| Opp pipeline + Kanban | ✅ |
| Win/loss reasons | ✅ |
| Forecasting | 🟠 (C-05) |
| **Missing:** Territory rules (C-04), Quotas (C-04), Marketing automation (C-01), Sequences (cadence), Activity intelligence |

---

## 10. الإعدادات (Settings)

### 10.1 المستخدمون والأدوار (/settings/roles)

| الميزة | الحالة |
|--------|--------|
| RBAC | ✅ |
| Field-level perms | ✅ |
| SoD rules | ✅ |
| Delegation | 🟠 |
| MFA enforcement | ✅ |
| Trusted devices | ✅ |
| **Missing:** Attribute-based access (ABAC), Time-bound roles, Just-in-time elevation, Detailed permission audit |

### 10.2 الأرقام التسلسلية (/settings/number-sequences)

| الميزة | الحالة |
|--------|--------|
| Format templates ({YYYY}, {MM}, etc.) | ✅ |
| Per-branch sequences | ✅ |
| Auto-reset (annual, monthly) | ✅ |
| Locking (concurrency) | ✅ |
| **Missing:** Reservation pool (claim numbers), Preview next |

### 10.3 BPM (/settings/bpm)

| الميزة | الحالة |
|--------|--------|
| Workflow definitions | 🟠 (skeleton) |
| Visual designer | 🔴 (P-01) |
| Runtime | 🟠 |
| **Missing:** Full BPMN 2.0 designer + engine (P-01) |

---

## ✨ Master List من الـ Hidden Buttons المطلوبة

> أزرار/ميزات صغيرة لكن مهمة، يحتاجها كل مستخدم محاسب لكن غير موجودة بشكل ظاهر

### في كل List Page:
- [ ] **Bulk Actions** (Approve all, Send to email, Export selected)
- [ ] **Saved Views** (My filters with names)
- [ ] **Column Customization** (drag-drop + save per user)
- [ ] **Quick Filter Chips** (recent, mine, this month)
- [ ] **Inline Edit** (double-click cell)
- [ ] **Multi-Sort** (Shift+click columns)
- [ ] **Density Toggle** (compact/comfortable/spacious)
- [ ] **Export Variants** (CSV, Excel, PDF, JSON)
- [ ] **Print List**
- [ ] **Share Link** (state-encoded URL)
- [ ] **Subscribe** (email me when X changes)
- [ ] **AI Filter** (NLQ: "show me overdue invoices for ABC over 50K")

### في كل Detail Page:
- [ ] **Chatter** (in-app comments thread on every record) — موجود لكن غير ظاهر
- [ ] **Activity Log Sidebar** (audit trail visible)
- [ ] **Related Records** (chips: linked SO/PO/JE)
- [ ] **Print/Email PDF**
- [ ] **Duplicate Record**
- [ ] **Workflow Status Badge** (with click → progress)
- [ ] **Versions/History** (diff between versions)
- [ ] **Watchers** (users who get notified on change)
- [ ] **Tags / Labels** (color-coded)
- [ ] **Pin to Dashboard**
- [ ] **AI Assist Sidebar** (P-16)

### في كل Form:
- [ ] **Auto-save Draft** (every 30s)
- [ ] **Validate Now** (without submit)
- [ ] **Save & New** / **Save & Close** / **Save & Continue Editing**
- [ ] **Field-level Help** (tooltips with examples)
- [ ] **Conditional Fields** (show/hide based on selections)
- [ ] **Inline Calc** (e.g., total auto-updated)
- [ ] **Smart Defaults** (last used, AI suggested)
- [ ] **Bulk Paste** (Excel-like into table fields)
- [ ] **AI Suggest** for description fields

### في كل Report:
- [ ] **Drill-Down** (every cell clickable → source records)
- [ ] **Drill-Through** (cell → related report)
- [ ] **Compare Periods** (Y-o-Y, Q-o-Q)
- [ ] **Schedule** (daily/weekly/monthly email)
- [ ] **Subscriptions** (alert if KPI breaches threshold)
- [ ] **What-If** (change assumption → see impact)
- [ ] **Save As Template**
- [ ] **Share with Team**
- [ ] **Annotation** (comment on data point)
- [ ] **Export to BI Tools** (PowerBI, Tableau)

---

## 📋 Quick Reference: ما يجب إضافته لكل وحدة (Top 5 لكل)

### Accounting
1. F-01 Deferred Tax Engine
2. F-02 IAS 36 Impairment
3. F-06 Multi-GAAP Layered Posting
4. F-09 Notes Auto-Generator
5. Subledger reconciliation report

### Sales / O2C
1. O-01 Cash Application AI
2. O-02 Dunning Multi-Level
3. C-06 Customer Portal
4. C-05 Pipeline ML Forecast
5. Split payment + Loyalty inline

### Purchases / P2P
1. O-09 AP Automation (OCR)
2. O-05 Vendor Onboarding KYC
3. O-06 Vendor Portal Self-Service
4. O-07 RFx Auction
5. O-10 Schedule Agreements

### Inventory / WMS
1. I-01 Wave Picking
2. I-02 Slotting Optimization
3. I-05 MES Realtime
4. I-08 OEE Realtime
5. I-04 Voice Picking

### Manufacturing
1. I-06 APS Scheduling
2. I-09 ECO Workflow
3. I-07 SPC
4. I-13 Calibration Mgmt
5. Genealogy/Traceability deep

### HR / Payroll
1. H-08 Multi-Country Payroll
2. H-05 Full LMS
3. H-06 ATS Complete
4. H-01 Succession Planning
5. H-07 Biometric + Geo deep

### Treasury
1. In-House Bank
2. FX Hedging integration
3. Notional pooling
4. Intra-day liquidity dashboards
5. Cash forecasting ML

### Reports/BI
1. F-08 Direct Cash Flow
2. F-09 Notes Auto
3. F-10 Segment Reporting
4. P-03 Custom Report Builder UI
5. XBRL/iXBRL output

### Platform
1. P-01 BPMN Designer
2. P-04+5 Mobile + Sync
3. P-13 eSign Native
4. P-14 DMS Deep
5. P-16 AI Copilot Everywhere

---

**نهاية ملف Feature Tables.**
