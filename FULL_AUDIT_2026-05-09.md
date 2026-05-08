# Namasoft ERP — Full Audit & Build Pack
**Date:** 2026-05-09
**Author:** AI ERP Architect
**Scope:** Audit شامل لكل ما هو موجود + قائمة الفجوات vs SAP / Oracle / NetSuite + برومنت جاهز + سيناريو + فلو بيانات لكل فجوة.

> **هذا الملف يلغي كل التقييمات السابقة.** هو القاعدة الجديدة لخطة البناء حتى الإنتاج.

---

## 0. ملخص تنفيذي (Executive Summary)

| المؤشر | القيمة |
|--------|--------|
| نماذج Prisma | 489 |
| API Routes | 200+ موديول |
| Engines / Services | 200+ |
| Dashboard Pages | 100+ |
| نسبة الجاهزية الإجمالية | **~62%** |
| الفجوات الحرجة (P0/P1) | 27 |
| تقدير الوصول للإنتاج SAP-grade | 12-16 أسبوع |

### مخطط النضج بالموديول (نسب الجاهزية الفعلية)

| الموديول | جاهز ✅ | Scaffold ⚠️ | مفقود ❌ | الإجمالي | النسبة |
|---------|--------|------------|----------|----------|--------|
| Core Accounting + GL | 13 | 8 | 2 | 23 | **57%** |
| AR / AP + Treasury | 33 | 6 | 2 | 41 | **80%** |
| Inventory | 5 | 5 | 2 | 12 | **42%** |
| Manufacturing | 7 | 6 | 0 | 13 | **54%** |
| Procurement | 2 | 7 | 1 | 10 | **20%** |
| Sales / O2C | 9 | 8 | 1 | 18 | **50%** |
| CRM | 3 | 4 | 4 | 11 | **27%** |
| POS / Retail | 6 | 4 | 0 | 10 | **60%** |
| E-commerce | 0 | 6 | 2 | 8 | **0%** |
| HR Core | 4 | 6 | 4 | 14 | **29%** |
| Attendance / Leave | 5 | 4 | 1 | 10 | **50%** |
| Payroll | 5 | 2 | 1 | 8 | **63%** |
| Saudi Compliance | 8 | 5 | 2 | 15 | **53%** |
| Reporting + BI | 7 | 4 | 0 | 11 | **64%** |
| Platform / Workflow | 18 | 1 | 0 | 19 | **95%** |
| Master Data | 7 | 2 | 0 | 9 | **78%** |
| Integration | 4 | 3 | 0 | 7 | **57%** |
| AI / Copilot | 2 | 3 | 1 | 6 | **33%** |

---

## 1. القسم الأول — الموجود فعلياً (✅ READY)

### 1.1 Accounting Core
- [auto-journal.ts](src/lib/auto-journal.ts) — محرك القيود (debit=credit، dimensions، multi-tenant) — جاهز
- [period-close-engine.ts](src/lib/period-close-engine.ts) — قائمة 14 خطوة SOCPA + lock states — جاهز
- [year-end-engine.ts](src/lib/year-end-engine.ts) — 28 مهمة close run — جاهز
- [fx-revaluation.ts](src/lib/fx-revaluation.ts) — month-end revaluation — جاهز
- [multi-book-engine.ts](src/lib/multi-book-engine.ts) — IFRS/Tax parallel ledgers — جاهز
- [budget-engine.ts](src/lib/budget-engine.ts) + [budget-control.ts](src/lib/budget-control.ts) — encumbrance — جاهز
- [allocation-engine.ts](src/lib/allocation-engine.ts) — cascading + dryRun/execute — جاهز
- [recurring-journal-runner.ts](src/lib/recurring-journal-runner.ts) — جاهز
- [standard-cost-engine.ts](src/lib/standard-cost-engine.ts) — PPV — جاهز
- [copa-engine.ts](src/lib/copa-engine.ts) — CO-PA متعدد الأبعاد — جاهز
- [numbering-engine.ts](src/lib/numbering-engine.ts) — ZATCA-compliant zero-gap — جاهز
- [document-state-machine.ts](src/lib/document-state-machine.ts) — 10 doc types FSM — جاهز

### 1.2 AR / AP / Treasury
- [cash-application.ts](src/lib/cash-application.ts) — FIFO/LIFO/LARGEST_FIRST — جاهز
- [customer-statement.ts](src/lib/customer-statement.ts) + scheduler + email + PDF — جاهز
- [aging-engine.ts](src/lib/aging-engine.ts) — AR/AP بـ 5 buckets — جاهز
- [dunning-engine.ts](src/lib/dunning-engine.ts) — multi-level + holds — جاهز
- [three-way-match.ts](src/lib/three-way-match.ts) — PO↔GR↔Invoice — جاهز
- [payment-run-engine.ts](src/lib/payment-run-engine.ts) — proposal→approval→execute — جاهز (لكن ينقصه ملفات بنوك سعودية)
- [wht-engine.ts](src/lib/wht-engine.ts) — 40+ tax treaties — جاهز
- [vendor-statement.ts](src/lib/vendor-statement.ts) + scorecard — جاهز
- [bank-statement-engine.ts](src/lib/bank-statement-engine.ts) — MT940/CAMT/CSV — جاهز
- [bank-recon-engine.ts](src/lib/bank-recon-engine.ts) — auto-match — جاهز
- [cash-flow-forecasting.ts](src/lib/cash-flow-forecasting.ts) — IAS 7 13-week — جاهز
- [expense-report-engine.ts](src/lib/expense-report-engine.ts) — جاهز

### 1.3 Inventory + Manufacturing
- [costing.ts](src/lib/costing.ts) — Standard/Average/FIFO/LIFO/Batch — جاهز
- [picking-fefo.ts](src/lib/picking-fefo.ts) + [lot-engine.ts](src/lib/lot-engine.ts) — جاهز
- [bom-engine.ts](src/lib/bom-engine.ts) — multi-level + ECO + where-used — جاهز
- [material-issuance.ts](src/lib/material-issuance.ts) — backflushing — جاهز
- [manufacturing-accounting.ts](src/lib/manufacturing-accounting.ts) — WIP variance — جاهز
- [quality-management.ts](src/lib/quality-management.ts) + inspection — جاهز
- [subcontracting-engine.ts](src/lib/subcontracting-engine.ts) — جاهز
- [rebate-engine.ts](src/lib/rebate-engine.ts) — VOLUME/VALUE/GROWTH — جاهز
- [spend-analytics.ts](src/lib/spend-analytics.ts) + maverick spend — جاهز
- [inventory-engine.ts](src/lib/inventory-engine.ts) — جاهز
- [product-variant-engine.ts](src/lib/product-variant-engine.ts) — جاهز

### 1.4 Sales / CRM / POS
- [quote-engine.ts](src/lib/quote-engine.ts) — Quote→Order — جاهز
- [pos-session-engine.ts](src/lib/pos-session-engine.ts) — open/close + variance JE — جاهز
- POS Terminal UI — touch + ESC/POS + ZATCA QR + offline PWA — جاهز
- [customer360-engine.ts](src/lib/customer360-engine.ts) — جاهز
- [crm-engine.ts](src/lib/crm-engine.ts) — Lead→Opp + Kanban — جاهز
- [rma-engine.ts](src/lib/rma-engine.ts) — REFUND/REPLACE/REPAIR/CN — جاهز
- [subscription-engine.ts](src/lib/subscription-engine.ts) — recurring + trials — جاهز
- [sales-forecast.ts](src/lib/sales-forecast.ts) — moving avg + smoothing — جاهز

### 1.5 HR / Payroll / Saudi
- [saudi-eos-engine.ts](src/lib/saudi-eos-engine.ts) — Art. 84-85 + resignation factor — جاهز
- [gosi-engine.ts](src/lib/gosi-engine.ts) — Saudi/GCC/Expat rates — جاهز
- [wps-generator.ts](src/lib/wps-generator.ts) — SIF v3 Mudad 2026 — جاهز
- [zakat-engine.ts](src/lib/zakat-engine.ts) — ZATCA formula + Hijri — جاهز
- [zatca-*.ts](src/lib/) — Phase 2 XML/signing/QR/clearance — جاهز
- [document-expiry.ts](src/lib/document-expiry.ts) — Iqama/Visa alerts — جاهز
- [leave-engine.ts](src/lib/leave-engine.ts) — 14 types Art. 109-116 — جاهز

### 1.6 Platform / Workflow / Reporting
- Multi-tenant (489 models بـ tenantId) — جاهز
- RBAC + Field permissions — جاهز
- SSO SAML 2.0 + SCIM 2.0 — جاهز
- MFA TOTP + backup codes + trusted devices — جاهز
- API Keys + Rate limit + Idempotency — جاهز
- [field-audit.ts](src/lib/field-audit.ts) — جاهز
- [webhook-engine.ts](src/lib/webhook-engine.ts) — 14 events HMAC — جاهز
- [approval-engine.ts](src/lib/approval-engine.ts) — multi-step + escalation — جاهز
- [bpm-engine.ts](src/lib/bpm-engine.ts) — visual node DAG — جاهز
- [custom-fields-engine.ts](src/lib/custom-fields-engine.ts) — جاهز
- [dms-engine.ts](src/lib/dms-engine.ts) — versioning — جاهز
- [global-search-engine.ts](src/lib/global-search-engine.ts) — جاهز
- [nlq-engine.ts](src/lib/nlq-engine.ts) — Arabic + English — جاهز
- [bi-cube-engine.ts](src/lib/bi-cube-engine.ts) + pivot + dashboard builder — جاهز
- [rag-pipeline.ts](src/lib/rag-pipeline.ts) + embeddings + vector store — جاهز

---

## 2. القسم الثاني — Scaffold (⚠️ موجود لكن ناقص المنطق)

| # | البند | الملف | ما الموجود | ما الناقص |
|---|-------|--------|-----------|-----------|
| S01 | Lease Accounting IFRS 16 | [lease-accounting-engine.ts](src/lib/lease-accounting-engine.ts) | PV + amortization | ROU JE + liability reclass + remeasurement |
| S02 | Consolidation | [consolidation-engine.ts](src/lib/consolidation-engine.ts) | aggregation + CTA | NCI + goodwill + IC profit elimination |
| S03 | Intercompany | [intercompany-engine.ts](src/lib/intercompany-engine.ts) | rules + transactions | Auto-mirror invoice + IC reconciliation |
| S04 | Revenue Recognition IFRS 15 | [revenue-recognition-ifrs15.ts](src/lib/revenue-recognition-ifrs15.ts) | 5-step + perf obligations | GL hook + deferred revenue schedule |
| S05 | ECL IFRS 9 | [ifrs9-ecl.ts](src/lib/ifrs9-ecl.ts) | stages 1/2/3 hardcoded | PD calibration + reversals |
| S06 | Fixed Assets | [fixed-assets-engine.ts](src/lib/fixed-assets-engine.ts) | SL + DDB | Units-of-Production + disposal G/L + CWIP |
| S07 | GL Inquiry & TB | API stubs | journal listing | TB aggregation + drill-down UI |
| S08 | Multi-currency rate types | schema | currency + rate | SPOT/AVG/CLOSING type selector |
| S09 | Cash Application AI | [cash-application.ts](src/lib/cash-application.ts) | exact match ±3 days | NLP/fuzzy + ML + exception queue |
| S10 | Bank Feed (Open Banking) | [bank-feed-engine.ts](src/lib/bank-feed-engine.ts) | CSV manual | Saudi bank APIs (Rajhi/SNB/ANB) |
| S11 | Letters of Credit / BG | schema + stub | model | LC issuance + amendment + presentation |
| S12 | Check writing | schema + stub | model | Numbering + CLEARED/BOUNCED + PDC schedule |
| S13 | Multi-warehouse + bin | [wms-engine.ts](src/lib/wms-engine.ts) | basic putaway | Location hierarchy + cross-WH transfer |
| S14 | Stocktake / Cycle Count | API route | route exists | ABC engine + count execution |
| S15 | Reorder Min-Max | [reorder-engine.ts](src/lib/reorder-engine.ts) | rule eval | Auto-PO + safety stock + exceptions |
| S16 | Wave/Cluster Picking | [wave-picking.ts](src/lib/wave-picking.ts) | sequence opt | wave release + cluster + slotting rules |
| S17 | Pack/Ship + Carton | [shipping-engine.ts](src/lib/shipping-engine.ts) | carrier + AWB | Cartonization + dimensions + pack slip |
| S18 | RMA Sales / Return-to-Vendor | API only | routes | Workflow + disposition + auto credit memo |
| S19 | Routing | API only | route | Operation sequencing + setup/run time |
| S20 | MRP Gross-to-Net | [mrp-engine.ts](src/lib/mrp-engine.ts) | BOM explode + PR | Gross-to-net + planned buckets + exceptions |
| S21 | MPS / APS | mps + aps engines | basic | ATP + period buckets + pegging |
| S22 | MO Lifecycle | API | model | Engine for release/dispatch/complete |
| S23 | Production Reporting | [mes-engine.ts](src/lib/mes-engine.ts) | OEE | Operation completion + scrap + rework |
| S24 | Preventive Maintenance | [preventive-maintenance.ts](src/lib/preventive-maintenance.ts) | due check | Actual maintenance + parts consumption |
| S25 | PR (Purchase Requisition) | API only | route | PR engine + approval matrix + budget check |
| S26 | RFQ | API only | route | Quote aggregation + comparison + award |
| S27 | PO Lifecycle | API | landed cost | Blanket PO + contract + split shipment |
| S28 | GRN | API | route | Tolerance rules + 3-way match trigger |
| S29 | 3-Way Match (procurement) | API | route | Reconciliation engine (وفي AP موجود!) |
| S30 | Vendor Master | schema + scoring | basic | KYC + multi-bank routing + WHT validation |
| S31 | Vendor Portal | [vendor-portal-engine.ts](src/lib/vendor-portal-engine.ts) | view PO + payments | Invoice submit + shipment + feedback |
| S32 | CPQ | [cpq-engine.ts](src/lib/cpq-engine.ts) | hardcoded tiers | Dynamic rule builder + bundle modeler + PDF |
| S33 | Sales Order ATP/CTP | API | model | ATP/CTP check + allocation engine |
| S34 | Picking → DN → Shipment | [delivery-note-engine.ts](src/lib/delivery-note-engine.ts) | engine | Pick list UI + bin tracking + carrier sync |
| S35 | Contracts | [contract-engine.ts](src/lib/contract-engine.ts) | template + clause | Milestone + rev rec schedule + approval |
| S36 | Pricing | CPQ | customer-specific | Price list versions + effective dates + bundles |
| S37 | Commission Calculation | [commission-engine.ts](src/lib/commission-engine.ts) | flat 5% | Tiered + hierarchy splits + payout |
| S38 | CRM Activities | [activity-engine.ts](src/lib/activity-engine.ts) | engine | UI + email/calendar sync + task assign |
| S39 | Campaign Management | dashboard | page | Builder + email sequence + segmentation + ROI |
| S40 | WhatsApp/SMS Marketing | settings | Twilio config | Template UI + bulk send + opt-in tracking |
| S41 | POS Multi-tender | API | splitCash/Card | Gift card + loyalty + Mada/ApplePay gateway |
| S42 | POS Coupons/Loyalty | models | Coupon/Loyalty | Validation engine + earn/burn UI |
| S43 | Cashier Shift | model | Shift | Handover UI + manager approval + recon |
| S44 | Pharmacy POS | models | Prescription | Rx validation + insurance claim + drug check |
| S45 | Salla Integration | [salla.ts](src/lib/salla.ts) | product/stock sync | Order webhook + customer sync + ship push |
| S46 | Online Catalog | API | route | Storefront UI + filters + SEO + i18n |
| S47 | Cart/Checkout/Payment | [bnpl.ts](src/lib/bnpl.ts) | Tabby/Tamara | Cart persist + address + payment UI |
| S48 | Order Fulfillment from ERP | API | model | Pick-pack-ship workflow + tracking |
| S49 | Customer Portal | API folders | routes | Order history + invoice + tracking UI |
| S50 | Org Structure (HR) | fields | dept + position | Hierarchy tree + manager assign + visualization |
| S51 | Letters & Contracts (HR) | template | model | Arabic NOC/Salary Cert/Offer PDF |
| S52 | Onboarding Workflow | stub | service | Checklist + state machine + asset request |
| S53 | Offboarding & EOS workflow | EOS engine ✅ | calc only | Exit checklist + GL post + asset recovery |
| S54 | Recruitment | [recruitment-engine.ts](src/lib/recruitment-engine.ts) | pipeline | Job-desc store + skills matrix + offer letter |
| S55 | ESS (Self-service) | API | routes | Dashboard pages + payslip/leave/profile |
| S56 | MSS (Manager) | API | routes | Manager queue + bulk approve + delegation |
| S57 | Time Clock | route | face-id | Device SDK (Suprema/ZKTeco) + sync daemon |
| S58 | Shift Schedules + Rotations | API | routes | Master + rotation + swap + holiday |
| S59 | Overtime Rules | timesheet | hours log | Saudi rules (8h, Fri 100%, Ramadan reduced) |
| S60 | Timesheet Project | engine | grid | Mobile app + project link + GPS check-in |
| S61 | Leave Carry-over | type | fields | Carry-over rules + forfeit + accrual rounding |
| S62 | Loans/Advances | service | loan | Advance request workflow + auto-deduction JE |
| S63 | Payslip PDF | data type | schema | PDF generation Arabic + dual Hijri/Greg |
| S64 | Mudad Real API | [mudad.ts](src/lib/saudi-gov/mudad.ts) | OAuth mock | Real contract submit + WP status sync |
| S65 | Qiwa Real API | [qiwa-engine.ts](src/lib/qiwa-engine.ts) | calc | OAuth + contract attest + Nitaqat sync |
| S66 | GOSI Portal | [gosi api.service.ts](src/services/gosi/api.service.ts) | stub | File upload + reconciliation + member query |
| S67 | WHT Forms | engine ✅ | calc | Form 14 PDF + ZATCA upload + cert |
| S68 | PDPL | [pdpl-engine.ts](src/lib/pdpl-engine.ts) | DSR types | Breach 72h + consent + retention |
| S69 | Nitaqat Reporting | [qiwa-engine.ts](src/lib/qiwa-engine.ts) | classify | Daily/weekly band reports + alerts |
| S70 | Standard Financial Reports | API | sales/stock | BS + IS + CF builders from JournalLine |
| S71 | Scheduled Reports | model | ReportSchedule | Email/FTP delivery via NotificationEngine |
| S72 | Embedded BI | dashboard | widgets | Record-page embedding + drill |
| S73 | Multi-currency Consol Reports | API | model | Translation + CTA routing report |
| S74 | OAuth/OIDC | SSO ✅ SAML | SAML | OAuth 2.0 + OIDC providers |
| S75 | SMS/WhatsApp/Telegram delivery | engine | template | Provider integration + delivery tracking |
| S76 | Per-tenant Backup | API | route | Schedule + restore UI + verification |
| S77 | Saudi Gov Integrations Hub | partial | ZATCA/GOSI | GOVQA + Absher + Labor Ministry hub |
| S78 | AI CFO | engine files | personas | Dedicated chat module + KPI analysis |
| S79 | AI Quota Guardrails | API | costs page | Per-tenant caps + model-specific quotas |
| S80 | Country/City Master | fields | text only | Master tables + GASTAT industry codes |

---

## 3. القسم الثالث — مفقود تماماً (❌ MISSING)

| # | البند | الأولوية | السبب |
|---|-------|---------|-------|
| M01 | Chart of Accounts SOCPA Template seed | 🔴 P0 | تأخير go-live |
| M02 | Financial Statement Generator (BS/IS/CF) | 🔴 P0 | تقارير قانونية مفقودة |
| M03 | ASN (Advanced Shipping Notice) | 🟠 P1 | Receiving بطيء |
| M04 | Inventory Valuation Report by date | 🟠 P1 | إقفال الفترة لا يكتمل |
| M05 | Vendor Returns / Debit Memo | 🟠 P1 | استرداد من الموردين |
| M06 | Backorder Management | 🟡 P2 | تجربة عميل |
| M07 | Email Integration (Outlook/Gmail) | 🟡 P2 | CRM ناقص |
| M08 | NPS / CSAT Surveys | 🟡 P2 | قياس رضا |
| M09 | Marketing Automation | 🟡 P2 | nurture sequences |
| M10 | Performance Management | 🟠 P1 | KPI/appraisal مطلوب |
| M11 | Training & Development (LMS) | 🟡 P2 | تطوير الموظفين |
| M12 | Succession Planning | 🟡 P2 | talent pool |
| M13 | Payroll → GL Auto-Journal | 🔴 P0 | مخاطر مالية |
| M14 | Provisions (EOS + Leave monthly) | 🔴 P0 | IFRS مخالف |
| M15 | Madar Integration | 🟡 P2 | Ministry of Commerce |
| M16 | Treasury Investments + Hedging | 🟡 P2 | أدوات مالية |
| M17 | Shopify / WooCommerce Sync | 🟡 P2 | omnichannel |
| M18 | Return Portal (customer self-service) | 🟡 P2 | تجربة |
| M19 | AI Auditor | 🟡 P2 | كشف الشذوذ |
| M20 | XBRL Export | 🟢 P3 | اختياري للتقارير الحكومية |

---

## 4. خارطة الطريق المرتبة (Priority Roadmap)

### 🔴 P0 — لا go-live بدونها (4-6 أسابيع)
1. M01 — CoA SOCPA seed
2. M02 — Financial Statements Generator
3. M13 — Payroll GL Posting
4. M14 — EOS + Leave Monthly Provisions
5. S07 — TB + GL Inquiry UI
6. S64 — Mudad real API
7. S70 — Standard Financial Reports

### 🟠 P1 — حرجة قبل تجاري كامل (6-10 أسابيع)
8. S04 — Rev Rec GL hook
9. S01 — Lease IFRS 16 GL hook
10. S06 — Fixed Assets disposal + UoP + CWIP
11. S29 — 3-Way Match procurement reconciliation
12. M03 — ASN
13. M04 — Inventory Valuation Report
14. M05 — Vendor Returns / Debit Memo
15. S25/S26/S27/S28 — PR/RFQ/PO/GRN engines
16. S15 — Auto-reorder + Safety Stock
17. S33 — ATP/CTP Sales Order
18. S34 — Picking → DN → Shipment workflow
19. S37 — Commission tiers + payout
20. M10 — Performance Management
21. S65 — Qiwa real API
22. S66 — GOSI Portal upload
23. S67 — WHT Form 14 PDF + ZATCA
24. S69 — Nitaqat reporting
25. S68 — PDPL breach + consent
26. S08 — Multi-currency rate types
27. S05 — IFRS 9 ECL real PD calibration

### 🟡 P2 — تحسينات قوية (10-16 أسبوع)
28. S02 — Consolidation NCI + goodwill
29. S03 — Intercompany auto-mirror
30. S09 — AI Cash Application
31. S10 — Saudi bank open banking
32. S11/S12 — LC + Check writing
33. S13/S16 — Bin hierarchy + Wave release
34. S19/S20/S21/S22/S23 — Routing + MRP G2N + APS + MO + MES
35. S35/S36 — Contracts milestones + Price lists
36. S38/S39 — CRM Activities UI + Campaigns
37. M07/M08/M09 — Email sync + NPS + Marketing automation
38. S45/S46/S47/S48/S49 — Salla orders + storefront + cart + portal
39. S50-S63 — HR full stack
40. S78/S79 — AI CFO + quotas
41. M16/M17/M18 — Treasury investments + Shopify + Return portal

### 🟢 P3 — Optional polish
42. M19 — AI Auditor
43. M20 — XBRL
44. S80 — Country/City masters

---

# 5. القسم الرابع — Build Pack Ready Prompts
> **لكل بند ⚠️ أو ❌:** برومنت جاهز للنسخ + سيناريو عمل كامل + فلو بيانات.

---

## P0-1 / M01 — CoA SOCPA Template Seed

### السيناريو
عند إنشاء tenant جديد، يجب أن يحصل على شجرة حسابات سعودية كاملة معتمدة من SOCPA تشمل: 1xxx Assets, 2xxx Liabilities, 3xxx Equity, 4xxx Revenue, 5xxx Expenses بـ ≥80 حساب جاهز للاستخدام، مع ربط بحسابات رقابية (AR control = 1210, AP control = 2110, GR/IR = 2150, Inventory = 1310, VAT Output = 2310, VAT Input = 1330, GOSI Payable = 2340, WHT Payable = 2350, EOS Provision = 2410).

### فلو البيانات
```
Tenant Created → Hook: seedSocpaCoA(tenantId)
  → Read prisma/seeds/socpa-coa.json
  → For each account: Account.create({ tenantId, code, nameAr, nameEn, type, parent, isControl, controlType })
  → Map control accounts in Settings.controlAccounts JSON
  → Emit AuditLog 'COA_SEEDED'
```

### Tables Touched
- `Account` (insert ~80 rows)
- `Settings` (update controlAccounts JSON)
- `AuditLog` (insert)

### UI Required
- صفحة `/settings/chart-of-accounts` بها: tree-view, search, drag to reorder, button "Reset to SOCPA template", بحث برقم/اسم/نوع.

### Prompt (نسخ واستخدم)
```
Create file `prisma/seeds/socpa-coa.json` with the SOCPA-compliant Saudi Chart of Accounts (≥80 accounts, 4-digit codes, Arabic + English names, hierarchy via parentCode, type ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE, isControl flag for AR/AP/GRIR/Inventory/VAT/GOSI/WHT/EOS). Then create `src/lib/seed-socpa-coa.ts` exposing `seedSocpaCoA(tenantId, prisma)` that:
1) Inserts all accounts in topological order (parents first) with tenantId.
2) Updates Settings row with controlAccountsMap = { AR_CONTROL:'1210', AP_CONTROL:'2110', GRIR:'2150', INVENTORY:'1310', VAT_OUTPUT:'2310', VAT_INPUT:'1330', GOSI_PAYABLE:'2340', WHT_PAYABLE:'2350', EOS_PROVISION:'2410', LEAVE_PROVISION:'2420', RETAINED_EARNINGS:'3210', CURRENT_YEAR_EARNINGS:'3220' }.
3) Logs to AuditLog action='COA_SEEDED'.
Then wire it into the tenant-creation flow at `src/app/api/master/tenants/route.ts` (POST). Add UI page `src/app/(dashboard)/settings/chart-of-accounts/page.tsx` with Arabic-first tree view, search, and a "Reset to SOCPA Template" button calling `POST /api/accounting/coa/reset-to-socpa`. Use SERIALIZABLE transaction. Add Vitest in `src/lib/__tests__/seed-socpa-coa.test.ts` verifying account count ≥ 80 and control accounts mapped. Show me the diff before commit.
```

---

## P0-2 / M02 — Financial Statements Generator (BS / IS / CF)

### السيناريو
المحاسب يفتح `/reports/financial-statements`، يختار الفترة (شهر/ربع/سنة)، الكتاب (IFRS/Tax)، والشركة (لو consolidation). يضغط Generate → يرى Balance Sheet + Income Statement + Cash Flow كـ tree هرمي قابل للـ drill-down على كل سطر للوصول للقيود الأصلية. يصدر PDF + Excel + يحفظ كـ snapshot.

### فلو البيانات
```
User → /reports/financial-statements → POST /api/reports/financial-statements/generate
  Params: { period, bookId, companyId, currency }
  ↓
  Step 1: Build Trial Balance via aggregating JournalLine for period (closed JEs only)
  Step 2: Map each Account.code → FS line (config in fs-templates/socpa-bs.json + socpa-is.json)
  Step 3: Roll up subtotals (Current Assets, Non-Current Assets, ...)
  Step 4: Income Statement → calc Gross Profit, Operating Profit, Net Profit
  Step 5: Cash Flow (indirect) = Net Profit ± Non-cash + ΔWC + Investing + Financing
  Step 6: Save FsSnapshot { id, period, bookId, payloadJson, hash, generatedAt }
  Step 7: Return JSON tree for UI rendering
  ↓
User clicks line → drill API: GET /api/accounting/journal?accountCode=X&period=Y → JE list
```

### Tables Touched
- `JournalLine` (read, aggregate)
- `Account` (read, mapping)
- `FsSnapshot` (insert) — جديد
- `FsTemplate` (read, optional override) — جديد

### UI Required
- صفحة `/reports/financial-statements` بها: filters (period/book/company/currency), tabs [Balance Sheet | Income Statement | Cash Flow | Equity Movement], Tree component مع toggle expand-all, كل صف فيه: nameAr | nameEn | currentPeriod | priorPeriod | %Change. Buttons: Generate, Export PDF, Export Excel, Save Snapshot, Compare Periods.

### Prompt
```
Implement Financial Statements Generator:

1. New Prisma models: FsTemplate { id, tenantId, type (BS|IS|CF|EQUITY), nameAr, nameEn, configJson, isDefault } and FsSnapshot { id, tenantId, period, bookId, type, payloadJson, hash (SHA256), generatedAt, generatedBy }. Add migration.

2. Seed two default templates from `prisma/seeds/fs-templates/socpa-bs.json` and `socpa-is.json` mapping account ranges (e.g., 11xx → CurrentAssets/Cash, 12xx → CurrentAssets/Receivables, 13xx → CurrentAssets/Inventory).

3. New file `src/lib/financial-statements-engine.ts` exposing:
   - generateBalanceSheet(tenantId, period, bookId, currency)
   - generateIncomeStatement(tenantId, period, bookId, currency)  
   - generateCashFlow(tenantId, period, bookId, currency, method='indirect')
   - generateEquityMovement(tenantId, period, bookId)
   Each returns { tree: FsLine[], totals: {…}, hash, generatedAt }. Aggregate from JournalLine (only POSTED state, only matching bookId).

4. API: POST /api/reports/financial-statements/generate (params period, bookId, type, currency) returns FS tree. POST /api/reports/financial-statements/snapshot to save. GET /api/reports/financial-statements/snapshots to list.

5. UI page src/app/(dashboard)/reports/financial-statements/page.tsx with Arabic-first RTL tree view (use shadcn Accordion or recursive component), expand/collapse all, drill-down on click → navigates to /accounting/journal?accountCode=X&period=Y.

6. PDF export via puppeteer using src/lib/print-template-engine.ts. Excel via exceljs.

7. Add Vitest tests in src/lib/__tests__/financial-statements-engine.test.ts seeding test JEs and asserting BS balance (Assets = Liab + Equity), IS net profit calc, CF reconciles to cash change.

Strict: only POSTED JEs, only matching bookId, exclude reversed unless includeReversed=true. Multi-currency = translate at period closing rate. SERIALIZABLE for snapshot insert. Show diff before commit.
```

---

## P0-3 / M13 — Payroll → GL Auto-Journal

### السيناريو
بعد موافقة المدير على PayrollRun، يضغط Post to GL → النظام يُنشئ قيد محاسبي كامل:
- DR مصروف رواتب (5110) إجمالي الراتب لكل موظف
- DR مصروف GOSI شركة (5120)
- CR GOSI Payable (2340) (الجزء على الموظف + الجزء على الشركة)
- CR WHT Payable (2350) لو موظفين أجانب
- CR Salary Payable (2330) صافي الراتب (الذي سيُدفع لاحقاً عبر WPS)
ثم تتحدث حالة PayrollRun = POSTED ولا يمكن تعديله.

### فلو البيانات
```
PayrollRun (status=APPROVED) → User clicks "Post to GL"
  → API: POST /api/payroll/runs/[id]/post
  → service: payroll-posting.service.postPayrollRun(runId)
    1. Load PayrollRun + lines + components
    2. Group by: salary expense by department/cost-center, GOSI emp/co, WHT, deductions
    3. Build JE payload via auto-journal.ts
    4. CreateJournalEntry({ date, description: 'Payroll YYYY-MM', source: 'PAYROLL', sourceId: runId, lines: [...] })
    5. Validate balanced (sum debits = sum credits)
    6. Update PayrollRun.status='POSTED', glJournalId=jeId
    7. Insert AuditLog
  → Return { jeId, totalDebit, totalCredit }
```

### Tables Touched
- `PayrollRun` (update status, glJournalId)
- `PayrollRunLine` (read)
- `JournalEntry` + `JournalLine` (insert)
- `AuditLog` (insert)

### UI Required
- زر "Post to GL" في صفحة PayrollRun details (يظهر فقط لو status=APPROVED)
- بعد النقر: Modal يعرض preview للقيد قبل التأكيد
- بعد POST: يظهر link "View Journal Entry"

### Prompt
```
Implement Payroll → GL auto-posting:

1. Add new file `src/services/payroll/payroll-posting.service.ts` exposing `postPayrollRun(tenantId, runId)`. Logic:
   - Load PayrollRun with lines, components, employees, departments.
   - Group lines by department/cost-center.
   - Build JournalLine[] with these debits/credits (codes from Settings.controlAccountsMap):
     * DR 5110 Salary Expense per cost-center (sum gross by dept)
     * DR 5120 GOSI Company Expense
     * DR 5121 SANED Company Expense
     * CR 2340 GOSI Payable (employee + company portions)
     * CR 2341 SANED Payable (employee + company portions)
     * CR 2350 WHT Payable (if expat WHT applies)
     * CR 2360 Loan Receivable (if loan deductions reduced)
     * CR 2330 Salary Payable Net (final cash to be paid via WPS)
   - Use auto-journal.ts createJournalEntry with source='PAYROLL', sourceId=runId, description='Payroll {nameAr month/year}'.
   - SERIALIZABLE transaction.

2. API: `POST /api/payroll/runs/[id]/post` calling the service. Verify run.status='APPROVED'. On success update run.status='POSTED', run.glJournalId. Return { jeId, totals }.

3. API: `POST /api/payroll/runs/[id]/preview-je` returns the JE preview without committing.

4. UI: Add to `src/app/(dashboard)/payroll/runs/[id]/page.tsx` a "Post to GL" button (visible only when status=APPROVED) opening a modal with preview JE table. Confirm button calls POST. Show success toast + link to JE.

5. After posting: prevent edits to PayrollRun (state machine).

6. Vitest in `src/services/payroll/__tests__/payroll-posting.test.ts`:
   - Seeded payroll run with 3 employees (1 Saudi + 1 Egyptian + 1 Filipino).
   - Assert JE balanced.
   - Assert correct GOSI calc (Saudi 9+1, expat 2 only).
   - Assert WHT only for expat per treaty rate.

7. SOCPA validator: call accounting-validator agent to verify the JE structure before commit.
```

---

## P0-4 / M14 — EOS + Leave Monthly Provisions

### السيناريو
في آخر يوم من كل شهر، النظام يحسب لكل موظف:
- مخصص EOS = (1/12 من الـ EOS Liability المتراكم بناءً على الراتب الحالي وعدد سنوات الخدمة بفرض إنهاء عند نهاية الشهر)
- مخصص الإجازة = (الأيام المتبقية × معدل الراتب اليومي)
ويُسجل قيد:
- DR 5130 EOS Expense
- DR 5140 Leave Expense
- CR 2410 EOS Provision
- CR 2420 Leave Provision

### فلو البيانات
```
Cron daily at month-end → /api/cron/payroll-provisions
  → For each tenant, for each active employee:
    1. eos = saudi-eos-engine.calcLiability(employee, asOfDate)
    2. leave = leave-engine.calcLiabilityValue(employee, asOfDate)
    3. delta_eos = eos - prior_eos_balance
    4. delta_leave = leave - prior_leave_balance
  → Aggregate by department/cost-center
  → createJournalEntry source='PROVISION', sourceId=monthYYYYMM
  → Insert ProvisionLog table
  → Send notification to HR Manager
```

### Tables Touched
- `Employee` (read)
- `LeaveBalance` (read)
- `ProvisionLog` (new — insert)
- `JournalEntry` + `JournalLine` (insert)

### UI Required
- صفحة `/payroll/provisions` تعرض شهور سابقة + status + JE link + breakdown per employee
- زر "Run Now" للتشغيل اليدوي
- زر "Reverse" لعكس آخر شهر

### Prompt
```
Implement monthly EOS + Leave provisions:

1. Add Prisma model `ProvisionLog { id, tenantId, period (YYYY-MM), type (EOS|LEAVE), totalDeltaAmount, employeeCount, glJournalId, computedAt, computedBy, status (PENDING|POSTED|REVERSED) }`. Migration.

2. New file `src/services/payroll/provisions.service.ts`:
   - calcEosProvision(tenantId, asOfDate): for each active employee, eos = saudi-eos-engine.calcLiability(emp, asOfDate); delta = eos - lastEosProvision.balance.
   - calcLeaveProvision(tenantId, asOfDate): for each active employee, daysOutstanding × dailyRate; delta vs last.
   - postProvisions(tenantId, period): builds JE via auto-journal.ts (DR 5130 EOS Exp, DR 5140 Leave Exp, CR 2410 EOS Prov, CR 2420 Leave Prov, grouped by cost center). Inserts ProvisionLog. Returns { jeId, eosTotal, leaveTotal, employeeCount }.
   - reverseProvision(tenantId, logId): create reversal JE, set log.status='REVERSED'.

3. API:
   - POST /api/payroll/provisions/run { period } → calc + post
   - POST /api/payroll/provisions/[id]/reverse
   - GET /api/payroll/provisions → list with filters

4. Cron job: src/lib/queue/payroll-provisions.cron.ts runs last day of each month 23:00 (Saudi time) for all tenants.

5. UI page src/app/(dashboard)/payroll/provisions/page.tsx with:
   - Filter by period
   - Table: period | type | totalDelta | employeeCount | status | JE link | actions
   - "Run Now" button (HR Manager role only)
   - "Reverse" button (CFO role only) with confirm dialog
   - Drill-down per employee per period

6. Vitest:
   - Seed 5 employees: tenure 1y/3y/5y/7y/10y
   - Assert EOS calc per Saudi Art. 84-85
   - Assert delta computation correct over 3 consecutive months
   - Assert JE balanced

7. Permissions: only HR Manager can run, only CFO can reverse, all can view.

Use accounting-validator agent before commit.
```

---

## P0-5 / S07 — TB + GL Inquiry UI

### السيناريو
المحاسب يفتح `/accounting/general-ledger`، يختار: الفترة، الحساب (مع autocomplete)، البُعد (cost center / project)، العملة. يرى Trial Balance أولاً (Account | OpeningDr | Dr | Cr | EndingDr/Cr) ثم drill على أي حساب → list of journal entries → click on entry → full JE view.

### فلو البيانات
```
User → /accounting/general-ledger
  → GET /api/accounting/trial-balance?period=&bookId=&dimensions=
    → Aggregate JournalLine by accountId
    → Return [{ accountCode, nameAr, openingDr, debits, credits, endingDr, endingCr }]
  → User clicks row → /accounting/general-ledger/[accountId]?period=
    → GET /api/accounting/gl-inquiry?accountId=&period=&dimensions=
    → Return JE lines paginated
  → User clicks JE → /accounting/journal/[id]
```

### Tables Touched
- `JournalLine` (read, aggregate)
- `Account` (read)

### UI Required
- صفحة TB: filters bar + table مع virtualization + export
- صفحة GL Inquiry: filters + table + paging + drill to JE
- صفحة JE View: header + lines + state badge + reverse button

### Prompt
```
Implement Trial Balance + GL Inquiry:

1. API GET /api/accounting/trial-balance with params: period (YYYY-MM or range), bookId, costCenterId?, projectId?, segmentId?, currency? Returns:
   [{ accountId, accountCode, nameAr, nameEn, openingDr, openingCr, debits, credits, endingDr, endingCr, currency }]
   sorted by accountCode. Include opening balance from prior periods aggregated.

2. API GET /api/accounting/gl-inquiry?accountId=&period=&page=&pageSize= returns paginated JournalLine with parent JE info: { id, jeNumber, date, description, debit, credit, runningBalance, dimensions }.

3. UI page src/app/(dashboard)/accounting/general-ledger/page.tsx:
   - Filters bar (period range, book, cost center search, project search, currency)
   - Table with virtualization (react-virtual)
   - Columns: code, nameAr, openingDr, debits, credits, endingDr, endingCr, balance
   - Click row → navigate to /accounting/general-ledger/[accountId]?period=
   - Export: PDF + Excel + CSV
   - Summary footer: total debits, total credits, must equal

4. UI page src/app/(dashboard)/accounting/general-ledger/[accountId]/page.tsx:
   - Header: account info + opening balance + ending balance
   - Filters: period, dimensions
   - Table: date, jeNumber, description, debit, credit, running balance
   - Click JE number → navigate to JE view
   - Pagination

5. UI page src/app/(dashboard)/accounting/journal/[id]/page.tsx (if not exists):
   - JE header (number, date, description, source, source link, state badge)
   - Lines table (account, description, debit, credit, dimensions, currency)
   - Footer: total debit, total credit
   - Buttons: Print, Reverse (creates reverse JE per state machine), Export

6. Vitest tests for TB aggregation (3 JEs across 2 periods, validate openings carry).

7. RTL Arabic-first. Use shadcn DataTable. Add server-side pagination.
```

---

## P0-6 / S64 — Mudad Real API Integration

### السيناريو
عند توقيع عقد عمل في Namasoft، يُرفع تلقائياً لـ Mudad للتسجيل وحماية الأجور. بعد ذلك، عند كل WPS run، نتحقق من حالة "Wage Protection" في Mudad أن المنشأة مُمتثلة. أي تعليق يصل كـ alert.

### فلو البيانات
```
EmployeeContract.create → triggers /api/saudi-gov/mudad/contracts/submit
  → Mudad OAuth2 token (cached 1h)
  → POST /v1/contracts { contractData, signatures }
  → Save mudadContractId on EmployeeContract
  
WPS Run cron:
  → GET /v1/wps/status → { status, lastSubmission, complianceLevel }
  → Insert MudadComplianceLog
  → If status != ACTIVE → create Notification + block WPS

Daily cron: poll /v1/wps/violations → MudadViolation table
```

### Tables Touched
- `EmployeeContract` (update mudadContractId, mudadStatus)
- `MudadComplianceLog` (new)
- `MudadViolation` (new)
- `Settings.mudadCredentials` (encrypted)

### Prompt
```
Implement real Mudad API integration:

1. Update src/lib/saudi-gov/mudad.ts to use real Mudad endpoints (https://api.mudad.com.sa/v1/...) per spec at https://mudad.com.sa/developers (request from user if needed). Implement:
   - getAccessToken(tenantId) with OAuth2 client_credentials, cache in Redis 50min.
   - submitContract(tenantId, contract) → POST /v1/contracts → returns { mudadContractId, status }.
   - getWpsStatus(tenantId) → GET /v1/wps/status.
   - getContractStatus(tenantId, mudadContractId).
   - listViolations(tenantId, dateRange).

2. Add Prisma models: MudadComplianceLog, MudadViolation. Add fields to EmployeeContract: mudadContractId, mudadStatus, mudadSubmittedAt.

3. Webhook on EmployeeContract creation: src/app/api/hr/contracts/route.ts POST → after insert → trigger mudad.submitContract async via BullMQ queue.

4. Cron: src/lib/queue/mudad-status.cron.ts runs daily 06:00 polling status + violations for all tenants.

5. UI page src/app/(dashboard)/compliance/mudad/page.tsx:
   - Dashboard: Compliance level, last sync, # active contracts, # violations
   - Tab Contracts: Employee | Contract # | Mudad Status | Submitted | Action (resubmit)
   - Tab Violations: Date | Type | Severity | Description | Resolved
   - Buttons: Sync Now, Download Report

6. Settings page src/app/(dashboard)/settings/mudad/page.tsx for credentials (client_id, client_secret encrypted).

7. Block WPS run if Mudad status != ACTIVE (in src/lib/wps-generator.ts add precheck).

8. Vitest with mocked Mudad responses (use msw).

9. Saudi-compliance agent must validate Mudad compliance flow before commit.
```

---

## P1-1 / S04 — Revenue Recognition GL Hook (IFRS 15)

### السيناريو
عند إنشاء عقد خدمة بقيمة 120,000 SAR لمدة 12 شهر، يتم اعتراف 10,000 شهرياً كإيراد، والباقي Deferred Revenue. النظام يُنشئ Schedule + يُنفذ JE شهري تلقائي.

### فلو البيانات
```
Contract.create with revenueRecognitionEnabled=true
  → revenue-recognition-ifrs15.allocatePerformanceObligations(contract)
  → Generate RevenueSchedule rows (date, amount)
  → Initial JE: DR Cash/AR, CR Deferred Revenue (2510)
  
Cron monthly first day:
  → For each due RevenueSchedule:
    JE: DR Deferred Revenue (2510), CR Revenue (4110)
    Mark schedule.recognized=true, glJournalId
```

### Prompt
```
Wire GL posting into revenue-recognition-ifrs15.ts:

1. Add Prisma model RevenueSchedule { id, tenantId, contractId, performanceObligationId, scheduledDate, amount, status (PENDING|RECOGNIZED|REVERSED), glJournalId, recognizedAt }.

2. Extend revenue-recognition-ifrs15.ts:
   - createScheduleForContract(contractId): allocates transaction price to PObs, generates schedule rows.
   - recognizeDue(tenantId, asOfDate): finds all PENDING with scheduledDate <= asOfDate, posts JE (DR Deferred Revenue, CR Revenue), updates status.
   - reverseRecognition(scheduleId): reversal JE, status=REVERSED.
   Use auto-journal.ts. Account codes from Settings (deferredRevenue=2510, revenue=4110).

3. Hook into Contract creation API.

4. Cron: src/lib/queue/revenue-recognition.cron.ts daily at 02:00.

5. UI src/app/(dashboard)/accounting/revenue-recognition/page.tsx:
   - Table: contract | total | recognizedToDate | remaining | nextRecognition
   - Drill: schedule per contract with status and JE link
   - "Recognize Now" manual trigger
   - "Reverse" admin only

6. Vitest covering point-in-time vs over-time, contract modifications, partial recognition.

7. Use accounting-validator agent for JE structure verification.
```

---

## P1-2 / S01 — Lease Accounting IFRS 16 GL Hook

### السيناريو
شركة تستأجر مكتب 60 شهر بإيجار 5,000/شهر. النظام يحسب ROU asset + lease liability حالياً (amortization موجود)، الناقص: قيد إنشاء + قيد شهري + reclass current/non-current.

### Prompt
```
Wire GL posting into lease-accounting-engine.ts:

1. Add fields to Lease model: glRouAssetAccount, glLeaseLiabilityCurrentAccount, glLeaseLiabilityNonCurrentAccount, glInterestExpenseAccount, glDepreciationExpenseAccount, glRouAccumDepreciationAccount.

2. Extend lease-accounting-engine.ts:
   - postLeaseInception(leaseId): JE DR ROU Asset (1410), CR Lease Liability (current 2520 + non-current 2530 split).
   - postMonthlyLeasePayment(leaseId, period): JE DR Lease Liability (current portion), DR Interest Expense (5210), CR Cash/Bank.
   - postMonthlyROUDepreciation(leaseId, period): JE DR Depreciation Expense (5220), CR Accumulated ROU Depreciation (1411).
   - reclassCurrentNonCurrent(leaseId, asOfDate): year-end reclass next 12 months from non-current to current.
   - postLeaseModification(leaseId, modificationData): remeasurement JE.

3. Cron monthly: src/lib/queue/lease-monthly.cron.ts runs day 1 of month for all active leases.

4. UI src/app/(dashboard)/assets/leases/page.tsx + /assets/leases/[id]/schedule:
   - List of leases with ROU + liability balances
   - Schedule view (month, payment, principal, interest, ROU dep, balances)
   - Buttons: Post Now, Reclass Year-End, Modify Lease (opens form for term/payment changes)

5. Vitest with sample lease, validate amortization, JE balanced, year-end reclass correct.

6. Use accounting-validator agent.
```

---

## P1-3 / S06 — Fixed Assets Disposal + UoP + CWIP

### Prompt
```
Complete Fixed Assets engine:

1. In src/lib/fixed-assets-engine.ts add:
   - depreciateUnitsOfProduction(assetId, period, unitsProduced): rate per unit × units; JE DR Dep Expense (5230), CR Accum Dep (1421).
   - disposeAsset(assetId, disposalDate, salePrice, method='SALE'|'SCRAP'|'TRANSFER'): 
     calc NBV = cost - accumDep; gain/loss = salePrice - NBV.
     JE: DR Cash/AR (salePrice), DR Accum Dep (full), DR Loss on Disposal (5240) IF loss, CR Asset Cost (1420), CR Gain on Disposal (4910) IF gain.
     Update asset.status='DISPOSED', disposedAt, disposalJeId.
   - capitalizeFromCWIP(cwipId): JE DR Asset (1420), CR CWIP (1430). Updates status.
   - addCwipCost(cwipId, amount, costType): JE DR CWIP (1430), CR AP/Cash. Track running total.
   - revaluation(assetId, newCarryingValue): JE per IAS 16 (revaluation surplus to OCI 3310).

2. UI:
   - /assets/fixed-assets/[id]/dispose with form (date, method, salePrice, buyer); preview JE; confirm.
   - /assets/cwip page listing in-progress CWIP with running costs; "Capitalize" button when complete.
   - /assets/fixed-assets/[id]/depreciation-schedule with method selector (SL/DDB/UoP) and run history.
   - Add UoP fields to Asset model: usefulUnits, unitsUsedToDate.

3. Vitest:
   - SL/DDB/UoP correctness over 5 years
   - Disposal at year 3 with gain
   - Disposal at year 8 with loss
   - CWIP → capitalize chain

4. Saudi tax depreciation: add taxBookDepreciation parallel calc (multi-book aware).

5. accounting-validator agent.
```

---

## P1-4 / S29 — 3-Way Match Procurement Reconciliation

### السيناريو
بعد إنشاء PO ثم استلام GRN ثم استلام Vendor Invoice → النظام يقارن: الكميات + الأسعار + الإجماليات ضمن tolerance. لو متطابق → status=MATCHED → الفاتورة جاهزة للدفع. لو فيه فرق → HOLD مع reason → workflow لتسوية.

### فلو البيانات
```
VendorInvoice.create → trigger 3wm
  → For each line, find PO + GRN with same itemId
  → Compare: invoiceQty vs grnQty (within tolerance), invoicePrice vs poPrice
  → If all match → status=MATCHED
  → If qty out of tolerance → status=HOLD_QTY
  → If price out of tolerance → status=HOLD_PRICE
  → Notify AP clerk
  → Insert MatchException with reason
```

### Prompt
```
Implement 3-Way Match procurement reconciliation:

1. Reuse existing src/lib/three-way-match.ts (which has PO↔GRN↔Invoice). Add:
   - autoTriggerOnInvoice(invoiceId): runs match on new vendor invoice.
   - bulkMatchPending(tenantId): processes all pending matches.
   - resolveException(exceptionId, action: 'ACCEPT'|'REJECT'|'PARTIAL', reasonNote, approvedBy): creates correction JE if needed.

2. Update Settings: matchTolerancePercent (default 2%), matchToleranceAmount (default 100 SAR). Per-vendor overrides in Vendor.matchTolerance.

3. UI src/app/(dashboard)/purchases/three-way-match/page.tsx:
   - Filter: status, vendor, date range
   - Table: PO# | GRN# | Invoice# | PO Total | GRN Total | Invoice Total | Variance | Status | Action
   - Click row → details modal with line-by-line comparison
   - "Resolve" button for exceptions with workflow

4. UI src/app/(dashboard)/purchases/three-way-match/[id]/page.tsx for full reconciliation view.

5. API:
   - POST /api/purchases/three-way-match/run-bulk
   - POST /api/purchases/three-way-match/[id]/resolve
   - GET /api/purchases/three-way-match (paginated)

6. Block payment of vendor invoice if status != MATCHED in Payment Run engine.

7. Vitest for tolerance edge cases.

8. accounting-validator + saudi-compliance agents.
```

---

## P1-5 / M03 — ASN (Advanced Shipping Notice)

### السيناريو
المورد يُرسل ASN عبر EDI/portal/email قبل الشحنة الفعلية. النظام يستقبله، ويُنشئ Receipt مُعد مسبقاً برقم ASN + باركود. عند وصول الشحنة، الموظف يمسح ASN barcode → كل البيانات تظهر → يؤكد الكميات → GRN يُنشأ تلقائياً.

### فلو البيانات
```
Vendor sends ASN (EDI 856 / Portal upload / API)
  → POST /api/asn/inbound → parse → AsnReceipt.create
  → Notify warehouse manager
  → Print ASN barcode
  
On dock:
  → Scanner reads ASN → /api/asn/[id]/start-receiving
  → Show expected items with qty
  → Worker confirms each line
  → POST /api/asn/[id]/complete → creates GRN with all matched lines
```

### Prompt
```
Implement ASN (Advanced Shipping Notice):

1. Prisma models:
   - AsnReceipt { id, tenantId, asnNumber, vendorId, expectedDate, status (PENDING|IN_RECEIVING|COMPLETED|CANCELLED), totalLines, sourcePoId, createdAt, sourceType (EDI|PORTAL|MANUAL|API) }
   - AsnLine { id, asnReceiptId, productId, expectedQty, receivedQty, lotNumber, expiryDate, location, notes }
   Migration.

2. Engine src/lib/asn-engine.ts:
   - createAsn(data) — from POST API or vendor portal
   - parseEdi856(xml) — for EDI input
   - startReceiving(asnId) — sets status, generates pick list
   - confirmLine(asnId, lineId, actualQty) — partial receive support
   - completeAsn(asnId) — creates GRN via existing GRN engine
   - cancelAsn(asnId, reason)

3. APIs:
   - POST /api/asn (manual create)
   - POST /api/asn/inbound-edi (EDI 856 endpoint, for vendor systems)
   - GET /api/asn (paginated)
   - GET /api/asn/[id]
   - POST /api/asn/[id]/confirm-line
   - POST /api/asn/[id]/complete
   - POST /api/asn/[id]/cancel

4. Vendor portal page src/app/(portal)/vendor/asn/new/page.tsx for vendor self-service ASN upload.

5. UI src/app/(dashboard)/inventory/asn/page.tsx:
   - List with filter (status, vendor, date)
   - Table: ASN# | Vendor | Expected Date | Lines | Status
   - Buttons: Create Manual ASN, Print Barcode
   
6. UI src/app/(dashboard)/inventory/asn/[id]/receive/page.tsx:
   - Touch-friendly receiving screen
   - Barcode scanner input
   - List of expected lines with [Confirmed Qty] input
   - "Complete" button creates GRN

7. Print template for ASN barcode (Code128 with ASN number).

8. Vitest for create/receive/complete cycle.
```

---

## P1-6 / M04 — Inventory Valuation Report by Date

### Prompt
```
Implement Inventory Valuation Report:

1. Engine src/lib/inventory-valuation-engine.ts:
   - valuationByDate(tenantId, asOfDate, warehouseId?, productId?, method?): returns [{ productId, sku, nameAr, qty, avgCost, totalValue, costingMethod, lastMovementDate }].
   - Logic: rebuild StockBalance state at asOfDate by walking StockMovement.
   - Support all methods (Standard / Average / FIFO / LIFO / Batch).
   - Aggregate variance vs current GL Inventory account balance.

2. API GET /api/reports/inventory-valuation?asOfDate=&warehouseId=&productId=&method= returns paginated results + summary totals + GL reconciliation block.

3. UI src/app/(dashboard)/reports/inventory-valuation/page.tsx:
   - Filters: as-of date, warehouse, product category, costing method
   - Table virtualized
   - Summary cards: total qty, total value, # SKUs, GL match status
   - Export PDF + Excel
   - Save snapshot button

4. Snapshot model InventoryValuationSnapshot { id, tenantId, asOfDate, payloadJson, totalValue, hash, generatedAt }.

5. Vitest with seeded movements over 12 months, validate FIFO/LIFO/Avg correctness.

6. accounting-validator agent (Inventory account reconciliation).
```

---

## P1-7 / M05 — Vendor Returns / Debit Memo

### Prompt
```
Implement Vendor Returns + Debit Memo:

1. Prisma models:
   - VendorReturn { id, tenantId, returnNumber, vendorId, originalGrnId, originalInvoiceId, returnDate, reason, status (DRAFT|SENT|ACCEPTED|REJECTED|REFUNDED), totalAmount, currency }
   - VendorReturnLine { id, returnId, productId, qty, unitPrice, totalPrice, reason }
   - VendorDebitMemo { id, tenantId, memoNumber, vendorId, returnId, amount, currency, status (DRAFT|ISSUED|APPLIED|CANCELLED), glJournalId }

2. Engine src/lib/vendor-return-engine.ts:
   - createReturn(data, lines) — DRAFT
   - submitReturn(id) — SENT (notify vendor)
   - markAccepted(id) — generate Debit Memo
   - generateDebitMemo(returnId) — JE: DR AP (2110), CR Inventory/Expense, sets memo
   - applyDebitMemoToInvoice(memoId, invoiceId, amount) — credit applied to AP

3. APIs full CRUD + lifecycle endpoints.

4. UI:
   - /purchases/vendor-returns list + create form
   - /purchases/vendor-returns/[id] detail with status timeline
   - /purchases/debit-memos list + apply-to-invoice action

5. Hook with original GRN reversal: when accepted, deduct stock back.

6. Vitest cycle test.

7. accounting-validator.
```

---

## P1-8 / S25-S28 — PR / RFQ / PO / GRN Engines

### السيناريو
Procure-to-Pay كامل:
1. موظف ينشئ PR للمواد
2. مدير يوافق
3. مشتري يحول لـ RFQ ويرسل لـ 3 موردين
4. يستلم quotes ويختار الأفضل
5. PO يصدر للمورد المختار
6. عند الاستلام: GRN يُسجل
7. Invoice + 3-way match
8. Payment

### Prompt (واحد لكل المنظومة)
```
Implement P2P engines (PR + RFQ + PO + GRN):

1. PR Engine src/lib/pr-engine.ts:
   - createPr(data) — DRAFT
   - submitPr(id) — triggers approval workflow (uses approval-engine.ts)
   - approvePr(id, approverId) / rejectPr(id, reason)
   - convertToRfq(id) / convertToPo(id) (skip RFQ for known vendors)
   - cancelPr(id)
   Add budget-control.ts hook: validate budget on submit.
   States: DRAFT → PENDING_APPROVAL → APPROVED → CLOSED|CANCELLED

2. RFQ Engine src/lib/rfq-engine.ts:
   - createRfqFromPr(prId, vendorIds[]) — creates RFQ + sends notifications
   - submitVendorQuote(rfqId, vendorId, quoteData) — vendor portal entry
   - compareQuotes(rfqId) — returns matrix [vendor x line] with totals
   - awardRfq(rfqId, vendorId) — creates PO
   States: DRAFT → SENT → QUOTING → AWARDED|CANCELLED

3. PO Engine src/lib/po-engine.ts:
   - createPo(data, lines)
   - submitPo(id) — triggers approval matrix per amount
   - sendToVendor(id) — email PO + portal notification
   - confirmAck(id) — vendor acknowledged
   - createBlanketPo(vendorId, items, periodStart, periodEnd, totalCommit) — for repeating purchases
   - releaseFromBlanket(blanketId, qty)
   - close(id)
   States: DRAFT → PENDING_APPROVAL → APPROVED → SENT → CONFIRMED → PARTIALLY_RECEIVED → CLOSED|CANCELLED
   Auto-journal on receipt: DR GR/IR (2150), CR Inventory.

4. GRN Engine src/lib/grn-engine.ts:
   - createFromPo(poId, lines) — partial allowed
   - addQualityCheck(grnId) — triggers quality-inspection-engine if required
   - completeReceipt(grnId) — JE: DR Inventory (1310), CR GR/IR (2150)
   - rejectLine(grnId, lineId, reason, qty) — creates return-to-vendor
   States: DRAFT → INSPECTING → ACCEPTED|PARTIALLY_ACCEPTED|REJECTED → COMPLETED

5. APIs full lifecycle for each.

6. UI:
   - /purchases/pr (list + create)
   - /purchases/pr/[id] (detail + approval timeline)
   - /purchases/rfq (list + comparison view)
   - /purchases/po (list + create + blanket)
   - /purchases/grn (list + receive form, mobile-friendly)
   - Approval queue at /approvals integrated

7. Vendor portal (existing) extended for: view PR, submit quote, confirm PO, view GRN status.

8. Vitest covering full P2P cycle (PR → RFQ → PO → GRN → Invoice).

9. accounting-validator agent.

10. Use saudi-compliance for WHT applicability check on PO.
```

---

## P1-9 / S15 — Reorder + Safety Stock + Auto-PO

### Prompt
```
Enhance reorder-engine.ts:

1. Add fields to Product: minQty, maxQty, reorderPoint, safetyStock, leadTimeDays, preferredVendorId, autoCreatePr (bool).

2. Engine extension:
   - calcSafetyStock(productId, methodology='ZSCORE'|'PERCENT'): based on demand variability over last 90 days.
   - calcReorderPoint(productId): avgDailyDemand * leadTimeDays + safetyStock.
   - evaluateAndCreatePr(tenantId): for each product where currentQty <= reorderPoint, create PR with qty = maxQty - currentQty (or EOQ formula if configured).
   - generateExceptions(): list "expedite" / "de-expedite" recommendations.

3. Cron daily: run evaluateAndCreatePr for all tenants 04:00.

4. UI src/app/(dashboard)/inventory/reorder/page.tsx:
   - List products with qty, ROP, safety stock, status (OK / WARNING / CRITICAL / OUT)
   - Per product: history chart, demand trend, supplier lead time
   - Buttons: Create PR Now, Adjust ROP, Exclude from auto

5. Vitest with synthetic demand + lead times.
```

---

## P1-10 / S33 — ATP / CTP for Sales Order

### Prompt
```
Implement ATP/CTP:

1. Engine src/lib/atp-ctp-engine.ts:
   - checkAtp(productId, requestedQty, requestedDate, warehouseId?): computes available = onHand - allocated - reserved + scheduled receipts (PO/MO due before requestedDate). Returns { atpQty, availableDate, alternatives[] }.
   - checkCtp(productId, requestedQty, requestedDate): if no inventory, check if can be MANUFACTURED in time (BOM availability + capacity from APS) or PURCHASED in time (vendor lead time).
   - reserveStock(soLineId, qty) — creates StockReservation.
   - releaseReservation(soLineId).

2. Hook into Sales Order create/edit: validate each line via ATP, return promised date.

3. UI in SalesOrder form: real-time ATP indicator per line (green/yellow/red); show suggestion if not available.

4. Backorder model: when ATP fails, offer split (partial now, partial later).

5. Vitest with multi-warehouse scenarios.
```

---

## P1-11 / S37 — Commission Engine Tiered + Payout

### Prompt
```
Rewrite commission-engine.ts to support enterprise tiers:

1. New models:
   - CommissionPlan { id, tenantId, name, salesPersonRoleType, calcMethod (TIERED|FLAT|MIXED), tiers[], effectiveFrom, effectiveTo }
   - CommissionTier { planId, fromAmount, toAmount, ratePercent }
   - CommissionRule { id, planId, productCategoryId?, customerSegmentId?, multiplier }
   - CommissionRecord { id, tenantId, salesPersonId, sourceType (INVOICE|PAYMENT), sourceId, baseAmount, calculatedAmount, status (PENDING|APPROVED|PAID|CLAWBACK), period }
   - CommissionSplit { recordId, partyId, percent, amount } (for manager + rep splits)
   - CommissionPayout { id, period, salesPersonId, totalAmount, status, jeId }

2. Engine:
   - calcOnInvoice(invoiceId): finds applicable plan + rules + tiers, creates CommissionRecord(s) + Splits.
   - approveCommissions(period, approverId)
   - generatePayout(period): aggregates approved → CommissionPayout → JE (DR Commission Expense, CR Salary Payable).
   - clawback(recordId, reason): when invoice voided.

3. UI:
   - /sales/commission/plans (CRUD)
   - /sales/commission/records (list + filter)
   - /sales/commission/payouts (run + history)
   - /sales/commission/approvals (manager review queue)

4. Hook into Sales Invoice POSTED → calc commission auto.

5. Hook into Invoice voided → clawback.

6. Vitest covering tier transitions, splits, clawback.
```

---

## P1-12 / M10 — Performance Management

### Prompt
```
Build Performance Management module:

1. Models:
   - KpiTemplate { id, tenantId, name, description, measureType (NUMERIC|PERCENT|RATING), target, weight }
   - ReviewCycle { id, tenantId, name, type (ANNUAL|SEMI_ANNUAL|QUARTERLY|360), startDate, endDate, status (PLANNED|ACTIVE|CLOSED) }
   - Appraisal { id, cycleId, employeeId, reviewerId, status (PENDING|SELF_DONE|MANAGER_DONE|FINALIZED), overallRating, comments }
   - AppraisalKpi { appraisalId, kpiTemplateId, target, actual, weight, score }
   - DevelopmentPlan { id, employeeId, cycleId, goals[], status }

2. Engine src/lib/performance-engine.ts:
   - createCycle, addParticipants
   - submitSelfReview, submitManagerReview, finalize
   - calcOverallScore(appraisalId)
   - generateDevelopmentPlan(employeeId, gaps[])

3. UI:
   - /hr/performance/cycles (list + create)
   - /hr/performance/cycles/[id] (overview)
   - /hr/performance/my-review (employee self-service)
   - /hr/performance/team-reviews (manager queue)
   - /hr/performance/development-plans

4. Notifications at each stage.

5. PDF export of appraisal.

6. Vitest.
```

---

## P1-13 / S65 — Qiwa Real API Integration

### Prompt
```
Implement Qiwa real integration:

1. Update src/lib/qiwa-engine.ts:
   - getAccessToken with OAuth2.
   - syncCompanyData() — pulls Nitaqat band, Saudization rate, color (Platinum/Green/Yellow/Red).
   - submitContractAttestation(contractId) — uploads PDF + metadata.
   - listExpatTransfers() — track visa transfers.
   - listLaborViolations(dateRange) — labor ministry violations.

2. Models: QiwaSnapshot, QiwaAttestation, QiwaViolation.

3. APIs in /api/saudi-gov/qiwa/* mirroring engine.

4. Cron daily 06:30: sync Nitaqat band, alert if degraded.

5. UI /compliance/qiwa:
   - Current band + Saudization%
   - Sync history
   - Attestation log
   - Violations
   - Required actions (e.g., "Hire 2 Saudis to maintain Green")

6. Vitest with mocked endpoints.

7. saudi-compliance agent.
```

---

## P1-14 / S66 — GOSI Portal Upload

### Prompt
```
Implement GOSI Portal integration:

1. Update src/services/gosi/api.service.ts:
   - getAccessToken(tenantId) — OAuth2.
   - uploadMonthlyContributions(period, payrollRunId) — generates GOSI XML + uploads.
   - getMemberStatus(iqamaOrIdNumber) — verify subscription.
   - getContributionSummary(period) — for reconciliation.
   - listMemberDisputes() — flagged contributions.

2. After payroll posting, auto-trigger GOSI upload per period.

3. UI /compliance/gosi:
   - Period | Status | Upload Date | Total Contributions | GL JE Link | Dispute count
   - Buttons: Upload Now, Reconcile, Download Receipt

4. Vitest with mocked endpoints.

5. saudi-compliance agent.
```

---

## P1-15 / S67 — WHT Form 14 PDF + ZATCA Upload

### Prompt
```
Complete WHT compliance:

1. In src/lib/wht-engine.ts add:
   - generateForm14Pdf(period, withholdingTransactions): Arabic PDF per ZATCA spec.
   - uploadForm14ToZatca(form14Id): submission via ZATCA API.
   - generateWhtCertificate(transactionId): Arabic + English PDF for vendor.
   - bulkSendCertificatesToVendors(period).

2. Models: WhtForm14, WhtCertificate.

3. Cron monthly day 5: prepare Form 14 for prior month, notify finance.

4. UI /tax/wht:
   - Transactions list (vendor, amount, rate, withheld)
   - Form 14 history (period, status, ZATCA ack)
   - Buttons: Generate Form 14, Upload, Download, Send Certificates

5. Vitest.

6. saudi-compliance + accounting-validator.
```

---

## P1-16 / S69 — Nitaqat Reporting

### Prompt
```
Build Nitaqat dashboard + automation:

1. Engine extension qiwa-engine.ts:
   - dailyClassify(tenantId): calc Saudization%, lookup Nitaqat band based on activity + size.
   - alertOnBandChange(): if band degrades, notify HR Manager + create task.
   - recommendActions(currentBand, targetBand): list of action items (hire X Saudis, terminate Y expats, etc).

2. Cron daily 07:00.

3. UI /compliance/nitaqat:
   - Current band gauge (color-coded)
   - Saudization% over time chart
   - Band thresholds for activity
   - Required actions
   - Hire vs Resign trend
   - Forecast Saudization% next 30/60/90 days

4. Notifications.

5. Vitest.
```

---

## P1-17 / S68 — PDPL Breach Notification + Consent Tracking

### Prompt
```
Complete PDPL compliance:

1. Models:
   - PdplConsent { id, tenantId, dataSubjectId, consentType (DATA_PROCESSING|MARKETING|HEALTH|BIOMETRIC), grantedAt, revokedAt, source }
   - PdplBreach { id, tenantId, detectedAt, type, severity (LOW|MEDIUM|HIGH|CRITICAL), affectedRecords, description, status (DETECTED|REPORTED|RESOLVED), reportedToSdaiaAt, resolvedAt }
   - PdplDsr (existing) — extend with auto-fulfillment for ACCESS/PORTABILITY.

2. Engine pdpl-engine.ts:
   - recordConsent(subjectId, type, source) / revokeConsent.
   - reportBreach(breachData): auto-email SDAIA within 72 hours; log.
   - bulkExportData(subjectId): for portability requests.
   - bulkEraseData(subjectId, retentionExceptions[]): for erasure.
   - retentionPolicyEnforce(): cron daily, delete records past retention.

3. APIs full CRUD.

4. UI:
   - /compliance/pdpl/consent (records by subject)
   - /compliance/pdpl/breach (incident management with SLA timer)
   - /compliance/pdpl/dsr (existing, extended)
   - /settings/pdpl/retention-policies (per-table policies)

5. Hook into Customer create: capture consent at registration.

6. Vitest with breach scenario + 72h SLA simulation.

7. saudi-compliance agent.
```

---

## P1-18 / S05 — IFRS 9 ECL Real PD Calibration

### Prompt
```
Improve IFRS 9 ECL:

1. Engine ifrs9-ecl.ts extension:
   - calibratePD(tenantId): for each customer segment, compute PD from historical default rate over 24 months.
   - calcEcl(receivableId, asOfDate): PD × LGD × EAD (where LGD default 50%, configurable per segment; EAD = outstanding).
   - assignStage(receivable): Stage 1 (performing, 12-month ECL), Stage 2 (significant credit deterioration, lifetime ECL), Stage 3 (credit-impaired, lifetime ECL).
   - postEclProvision(period): JE DR Bad Debt Expense, CR ECL Allowance.
   - reverseEclOnPayment(receivableId).

2. Cron monthly: re-calibrate + post.

3. UI /accounting/ecl:
   - Aging by stage
   - Allowance balance
   - Stage migration matrix
   - Manual override (CFO only)

4. Vitest with synthetic customer histories.

5. accounting-validator.
```

---

## P1-19 / S08 — Multi-currency Rate Types

### Prompt
```
Add exchange rate types:

1. Add to Currency: defaultSpotRate, defaultAvgRate, defaultClosingRate.
2. Extend ExchangeRate model: rateType enum (SPOT|AVG|CLOSING|HISTORICAL|TRANSACTION), validFromDate, validToDate.
3. Engine src/lib/fx-rate-engine.ts:
   - getRate(currencyFrom, currencyTo, date, rateType): returns rate or interpolates.
   - bulkImportRates(source, dateRange): from SAMA API or bank feed.
   - revaluation now uses CLOSING rate.
   - Translation P&L uses AVG rate.
   - Translation BS uses CLOSING rate.

4. Cron daily 09:00: pull SPOT from SAMA.

5. UI /settings/exchange-rates:
   - Filter by date range, currency pair
   - Manual entry + bulk import + delete
   - Chart of rates over time
   - Rate type selector

6. Update fx-revaluation.ts and consolidation-engine.ts to use rate types.

7. Vitest.
```

---

## P2-1 / S02 — Consolidation NCI + Goodwill + IC Profit Elimination

### Prompt
```
Complete consolidation engine:

1. New models:
   - ConsolidationGroup { id, tenantId, name, parentCompanyId }
   - ConsolidationMember { groupId, companyId, ownershipPercent, methodOfConsolidation (FULL|EQUITY|PROPORTIONAL), acquisitionDate, acquisitionCost }
   - GoodwillAsset { groupId, memberId, originalGoodwill, accumImpairment }
   - NciBalance { groupId, memberId, period, nciAmount } 
   - IcEliminationRule { groupId, fromCompanyId, toCompanyId, accountCode, eliminationType (FULL|PARTIAL) }

2. Engine consolidation-engine.ts:
   - calcNci(groupId, period): for each member with <100% ownership, calc NCI portion of equity + profit.
   - calcGoodwill(groupId, memberId): on acquisition, plus annual impairment test.
   - eliminateIcTransactions(groupId, period): zero-out IC sales/purchases/receivables/payables.
   - eliminateUnrealizedProfit(groupId, period): IC sales remaining in inventory at period-end.
   - generateConsolidatedFs(groupId, period): full BS + IS with NCI line, eliminations applied.

3. UI /accounting/consolidation:
   - Group definition
   - Member ownership matrix
   - Goodwill register
   - Period close: trigger consolidation
   - View consolidated FS with drill to entity

4. Vitest with parent + 80% subsidiary + 50% JV scenarios.

5. accounting-validator.
```

---

## P2-2 / S03 — Intercompany Auto-Mirror

### Prompt
```
Implement IC auto-mirror:

1. Engine intercompany-engine.ts:
   - createIcInvoice(fromCompanyId, toCompanyId, lines): creates SalesInvoice on from + auto-creates PurchaseInvoice on to + auto-creates IC Settlement record.
   - reconcileIc(period): match all open IC items, flag mismatches.
   - settleIc(periodId, method='NETTING'|'CASH'): generates settlement JE.

2. Mark IC transactions with isIntercompany=true + counterCompanyId.

3. UI /accounting/intercompany:
   - Open IC items by entity
   - Reconciliation matrix
   - Settlement run

4. Vitest.
```

---

## P2-3 / S09 — AI-assisted Cash Application

### Prompt
```
Build AI cash matching:

1. Engine extension cash-application.ts:
   - aiMatch(bankLineId): uses LLM (Gemini) to score top 5 candidate invoices based on amount + date + customer name + reference text.
   - Suggestions stored in CashApplicationSuggestion { bankLineId, invoiceId, score, reason }.
   - User approves → applies; rejects → trains negative example.
   - Pattern learning: store accepted matches as embeddings in vector-store.ts.

2. UI /finance/cash-application:
   - Inbox of unmatched bank lines
   - Per line: AI suggestions with scores
   - Approve / Reject / Manual match
   - Bulk approve high-confidence

3. Vitest with mocked LLM responses.

4. AI cost guardrails per quotaGuard.ts.
```

---

## P2-4 / S10 — Saudi Bank Open Banking

### Prompt
```
Integrate Saudi banks via SAMA Open Banking:

1. Adapters per bank in src/lib/bank-feed/:
   - alrajhi.ts (OAuth + account info + transactions)
   - snb.ts (Saudi National Bank)
   - anb.ts (Arab National Bank)
   - albilad.ts
   - alinma.ts
   - riyad-bank.ts

2. Each adapter: getBalances(), getTransactions(dateRange), initiatePayment(SARIE).

3. Engine bank-feed-engine.ts orchestrates.

4. Daily cron: pull statements per bank.

5. Auto-feed into bank-statement-engine for reconciliation.

6. UI /accounting/banks/feeds:
   - Connected banks list
   - Connect new bank (OAuth flow)
   - Last sync time
   - Manual sync button

7. Vitest with mocked SAMA endpoints.
```

---

## P2-5 / S11 — Letters of Credit + Bank Guarantees

### Prompt
```
Build LC + BG module:

1. Models (extend existing):
   - LetterOfCredit + LcAmendment + LcPresentation + LcDrawdown
   - BankGuarantee + BgClaim + BgRelease

2. Engine src/lib/lc-bg-engine.ts:
   - createLc, amend, present, drawdown, expire
   - createBg, claim, release, expire

3. Lifecycle states.

4. UI /finance/lc-bg:
   - LC list + detail
   - BG list + detail
   - Expiry alerts dashboard

5. Auto-journal on issuance: contra accounts.

6. Vitest.

7. accounting-validator.
```

---

## P2-6 / S12 — Check Writing + PDC

### Prompt
```
Build check writing + PDC:

1. Models:
   - Check { id, tenantId, checkNumber, bankAccountId, payeeName, amount, currency, issuedDate, postDate, status (DRAFT|ISSUED|CLEARED|BOUNCED|VOID|STALE), clearedDate, glJournalId }
   - PostdatedCheck { id, checkId, scheduledDate, currentStatus (PENDING|DEPOSITED|RETURNED) }

2. Engine src/lib/check-engine.ts:
   - issueCheck, voidCheck, markCleared, markBounced
   - cron daily: list checks with postDate=today → ready to deposit

3. Auto-numbering per BankAccount.

4. UI /finance/checks:
   - List + filter
   - Create check (manual or batch from payment run)
   - Print check (template per bank)
   - PDC calendar view

5. Vitest.
```

---

## P2-7 / S13 — Bin Hierarchy + Cross-Warehouse Transfers

### Prompt
```
Complete WMS bin structure:

1. Models extend:
   - Warehouse → Zone → Aisle → Rack → Shelf → Bin (hierarchy)
   - Each level: capacity, restrictions (temp range, hazmat, weight)

2. Engine wms-engine.ts:
   - suggestBin(productId, qty): per slotting rules + capacity + ABC.
   - transferStock(fromBinId, toBinId, qty)
   - bulkTransferBetweenWarehouses(fromWhId, toWhId, lines): creates TransferOrder.

3. UI /inventory/warehouses/[id]/layout:
   - Visual layout (zones grid)
   - Per bin: occupancy, items, value
   - Drag-drop transfers

4. Mobile screen for warehouse staff.

5. Vitest.
```

---

## P2-8 / S16 — Wave Picking Release

### Prompt
```
Complete wave picking:

1. Engine wave-picking.ts extension:
   - createWave(orderIds, picker, releaseTime): groups orders.
   - releaseWave(waveId): generates pick lists per zone, dispatches to pickers (mobile).
   - confirmPick(waveId, pickerId, item, qty): updates progress.
   - completeWave(waveId): triggers shipment creation.

2. Mobile UI /wms/picker for handheld:
   - Login pin
   - Active wave + next pick
   - Scan + confirm
   - Exception (short, damaged, wrong location)

3. UI /wms/waves: planner view, release, monitor.

4. Vitest.
```

---

## P2-9 / S19-S23 — Manufacturing Execution

### Prompt (combined)
```
Complete Manufacturing execution:

1. Routing engine src/lib/routing-engine.ts: model Routing + Operation (workCenter, setupTime, runTime, queueTime, moveTime). Calc total lead time.

2. MRP gross-to-net: enhance mrp-engine.ts with proper netting, planned order generation, exception messages (RESCHEDULE, CANCEL, EXPEDITE).

3. APS finite scheduling: aps-scheduler.ts with capacity check per workCenter + lot-for-lot vs period-batch.

4. MO lifecycle engine src/lib/mo-engine.ts:
   - releasePlannedOrder(plannedOrderId)
   - dispatch(moId)
   - reportOperation(moId, operationId, qtyComplete, qtyScrap, qtyRework, durationMinutes)
   - completeMo(moId): triggers backflushing + JE
   States: PLANNED → RELEASED → DISPATCHED → IN_PROCESS → COMPLETED → CLOSED.

5. MES enhance mes-engine.ts: real-time operation events, downtime reasons.

6. UI:
   - /manufacturing/routings (master)
   - /manufacturing/mrp (planning view)
   - /manufacturing/aps (gantt)
   - /manufacturing/mo (work order list + detail)
   - /shopfloor (touchscreen for operators)

7. Vitest covering full mfg cycle.

8. accounting-validator.
```

---

## P2-10 / S35 — Contracts Milestones + Rev Rec Schedule

### Prompt
```
Enhance contract-engine.ts:

1. Models extend Contract + ContractMilestone + ContractDeliverable.

2. Engine:
   - createContractWithMilestones
   - completeMilestone(milestoneId): triggers invoice + revenue recognition.
   - scheduleRevRecFromContract(contractId): generates RevenueSchedule based on milestones or time-based.
   - amendContract: with revision.

3. UI /sales/contracts/[id]:
   - Milestones gantt
   - Status per milestone
   - Mark complete button
   - Linked invoices + JEs

4. Vitest.
```

---

## P2-11 / S36 — Pricing Engine: Price Lists + Effective Dates + Bundles

### Prompt
```
Build advanced pricing:

1. Models:
   - PriceList { id, tenantId, name, currency, effectiveFrom, effectiveTo, customerSegmentId? }
   - PriceListItem { listId, productId, price, minQty, maxQty }
   - PriceBundle { id, name, items[], bundlePrice }
   - PriceRule { trigger, action, priority }

2. Engine src/lib/pricing-engine.ts:
   - lookupPrice(productId, customerId, qty, date): walks price lists by priority.
   - applyBundle(cartLines): substitute eligible items with bundle price.
   - applyPromotions(cart, promoCodes).

3. Hook into Quote, Sales Order, Invoice creation: auto-fill price.

4. UI /sales/pricing:
   - Price lists CRUD
   - Bundles CRUD
   - Rules editor
   - Test pricing tool

5. Vitest with overlapping lists.
```

---

## P2-12 / S38-S39 — CRM Activities UI + Campaign Management

### Prompt
```
Build CRM Activities + Campaigns:

1. UI /crm/activities:
   - Calendar + list view
   - Activity types (call, email, meeting, task, note)
   - Per record (lead, contact, opportunity) timeline
   - Quick log activity form

2. UI /crm/campaigns:
   - Campaign builder (audience + steps + emails)
   - A/B testing
   - Send schedule
   - Analytics (sent, opened, clicked, converted)

3. Engine:
   - activity-engine.ts complete with calendar sync (Google/Outlook OAuth).
   - campaign-engine.ts new with sequence runner cron.

4. Email template editor (drag-drop).

5. Vitest.
```

---

## P2-13 / M07 — Email Integration (Outlook/Gmail)

### Prompt
```
Build email integration:

1. OAuth2 connector for Gmail + Outlook (per user).

2. Engine src/lib/email-integration.ts:
   - syncInbox(userId, since): pulls new emails.
   - matchToCrm(email): finds contact/deal by email address.
   - logActivity(email, recordId): creates Activity.
   - sendFromCrm(toAddress, body, recordContext): tracks reply.

3. Cron every 10 min for connected users.

4. UI /settings/integrations/email:
   - Connect Gmail/Outlook
   - Sync status
   - Mapping rules

5. Inline in CRM: "Email" button + thread view.

6. Vitest with mocked Gmail API.
```

---

## P2-14 / M08-M09 — NPS/CSAT + Marketing Automation

### Prompt
```
Build NPS/CSAT + Marketing Automation:

1. NPS module:
   - SurveyTemplate, SurveyDistribution, SurveyResponse models.
   - Engine: sendNps(customerId, channel='email'|'sms'|'whatsapp').
   - Auto-trigger on order delivered, ticket closed, etc.
   - UI /crm/nps with score chart, detractors list, follow-up tasks.

2. Marketing Automation:
   - WorkflowAutomation { trigger, conditions, steps[] }
   - Engine workflow-automation-engine.ts: event-driven trigger runner.
   - Steps: send email, send sms, wait, branch, update field, create task.
   - UI /marketing/automation drag-drop builder.

3. Vitest.
```

---

## P2-15 / S45-S49 — E-commerce Full Stack (Salla + Storefront + Cart + Portal)

### Prompt
```
Build e-commerce full stack:

1. Salla:
   - Webhook listener /api/webhooks/salla for orders/customers/products.
   - Order import → Customer + SalesOrder + ZATCA invoice.
   - Stock sync bidirectional.
   - Shipment status push to Salla.

2. Storefront /shop (Next.js public route):
   - Product catalog with filters, search, i18n.
   - SEO-optimized.
   - Cart (persistent via cookie/account).
   - Checkout flow (address, shipping method, payment).

3. Payment gateways: Mada (HyperPay), Apple Pay, STC Pay, Tabby/Tamara.

4. Customer Portal /portal:
   - Order history
   - Invoice download
   - Shipment tracking
   - Return request (RMA)
   - Address book
   - Wishlist

5. Vitest covering order import + fulfillment cycle.
```

---

## P2-16 / S50-S60 — HR Full Stack

### Prompt (combined)
```
Build complete HR stack:

1. Org structure: Position model with parent (hierarchy). Visualization with react-flow.

2. Letters/Contracts: Arabic PDF templates (NOC, Salary Cert, Offer, Contract, Transfer). Engine letter-engine.ts using Handlebars + puppeteer + RTL fonts (Cairo, Tajawal).

3. Onboarding: OnboardingChecklist model + tasks + state. UI /hr/onboarding/[empId].

4. Offboarding: ExitChecklist + asset return + EOS calc + final settlement JE + email/badge deactivation. UI /hr/offboarding/[empId].

5. Recruitment full: JobDescription, ApplicantTracking, Interview scheduling, Offer letter.

6. ESS /portal/employee:
   - View payslip (current + past)
   - Request leave (with balance display)
   - View attendance
   - Update profile (with HR approval)
   - Download tax docs (annual statement)

7. MSS /portal/manager:
   - Pending approvals queue (leaves, expenses, timesheets)
   - Team view (attendance, leaves)
   - Bulk approve
   - Delegation setup

8. Time clock: device adapters (Suprema, ZKTeco, Hikvision SDK abstraction).

9. Shift schedules + rotations: ShiftPattern model + assign + swap workflow.

10. OT rules: Saudi rules in src/lib/overtime-engine.ts.

11. Timesheet mobile (PWA + offline).

12. Leave carry-over rules engine.

13. Loans/Advances workflow.

14. Vitest.
```

---

## P2-17 / S78-S79 — AI CFO + Quota Guardrails

### Prompt
```
Build AI CFO module:

1. Page /ai-cfo with chat interface.

2. Engine src/lib/ai-cfo.ts:
   - Tools (function calling): getBalanceSheet, getIncomeStatement, getRatios, getTopVariances, getCashForecast, getCustomerProfit, etc.
   - System prompt: Saudi CFO persona, Arabic + English bilingual, IFRS/SOCPA aware.
   - RAG over recent reports + transactions.

3. Quotas:
   - Per tenant monthly token budget in Settings.aiQuota.
   - Per user daily token budget.
   - Hard cap with alert.

4. Cost tracking per call → AiCostLog → /admin/ai-costs dashboard.

5. Vitest with mocked LLM.
```

---

## P2-18 / S77 — Saudi Gov Hub

### Prompt
```
Centralize Saudi Gov integrations:

1. UI /compliance/saudi-gov:
   - Status dashboard for: ZATCA, GOSI, Mudad, Qiwa, Madar (when added)
   - Last sync, errors, next required action
   - Compliance score (composite of all)

2. Common adapter pattern src/lib/saudi-gov/base-adapter.ts: token cache, retry, error standardization.

3. Notifications on critical issues (Nitaqat degrade, GOSI mismatch, ZATCA rejection, etc).
```

---

## P2-19 / M11-M12 — Training/LMS + Succession

### Prompt
```
Build LMS + Succession:

1. LMS:
   - Course, Lesson, Enrollment, Quiz, Certificate models.
   - Engine course-engine.ts.
   - UI /hr/lms/courses (catalog), /hr/lms/my-learning, /hr/lms/my-certificates.
   - SCORM import optional.

2. Succession:
   - TalentPool, SuccessorCandidate, ReadinessAssessment models.
   - Engine succession-engine.ts.
   - UI /hr/succession with talent grid (9-box).

3. Vitest.
```

---

## P2-20 / S43-S44 — Cashier Shift + Pharmacy POS

### Prompt
```
Complete Shift + Pharmacy:

1. Shift handover:
   - HandoverDocument model (open shift snapshot, close shift snapshot, variance, manager approval).
   - UI /pos/shift-handover.
   
2. Pharmacy:
   - Prescription validation against patient record.
   - Insurance claim submission (Tawuniya, Bupa, MedGulf APIs).
   - Drug interaction check (RxNorm DB).
   - Controlled drug log (compliance).
   - UI /pharmacy/prescriptions.

3. Vitest.
```

---

## P2-21 / M16 — Treasury Investments + FX Hedging

### Prompt
```
Build Treasury Investments:

1. Models:
   - Investment { id, type (DEPOSIT|BOND|EQUITY|FX_FORWARD|OPTION), amount, currency, startDate, maturityDate, expectedYield, status }
   - InvestmentValuation (mark-to-market history)
   - HedgeRelationship (item + instrument + effectiveness test)

2. Engine investment-engine.ts.

3. Cron daily: mark-to-market via market data API.

4. UI /treasury/investments + /treasury/hedging.

5. JE on initial recognition + monthly fair value changes (OCI for cash flow hedges, P&L for fair value hedges).

6. Vitest.

7. accounting-validator.
```

---

## P2-22 / M17 — Shopify / WooCommerce Sync

### Prompt
```
Build Shopify + WooCommerce adapters:

1. src/lib/shopify-adapter.ts: products, orders, customers, fulfillments, refunds via Admin API.
2. src/lib/woocommerce-adapter.ts: same via WC REST API.
3. Engine omnichannel-engine.ts: orchestrates per channel.
4. Webhook listeners.
5. UI /settings/integrations/shopify (connect + status), /settings/integrations/woocommerce.
6. Vitest.
```

---

## P2-23 / M18 — Customer Return Portal

### Prompt
```
Build self-service return portal:

1. UI /portal/returns:
   - List past orders (last 6 months)
   - Per order: select items + reason for return
   - Generate return label (carrier API)
   - Track refund status

2. Engine extension rma-engine.ts to accept portal-initiated returns.

3. Email confirmations.

4. Vitest.
```

---

## P3 — Polish (Optional)

### M19 — AI Auditor
```
Build AI Auditor:

1. Engine ai-auditor.ts:
   - Detect duplicate JEs (same amount + date + parties).
   - Detect segregation of duties violations (creator = approver).
   - Detect benford's law anomalies in expenses.
   - Detect unusual journal patterns (round numbers, off-hours, weekends).
   - Detect vendor/employee bank account match (fraud risk).

2. Cron weekly + on-demand.

3. UI /audit/ai-findings with severity and explanation.

4. Vitest.
```

### M20 — XBRL Export
```
Add XBRL export for financial statements per SOCPA/IFRS taxonomy.
1. Use python xbrl lib via subprocess or JS xbrl-js.
2. UI button "Export XBRL" in /reports/financial-statements.
```

### S80 — Country/Industry Masters
```
Add Country, City, IndustryCode (GASTAT) master tables.
Migrate Customer.city/country to FK references.
Add seed data for Saudi cities (13 governorates) + GASTAT industry codes.
```

---

## 6. خطة التنفيذ (Execution Plan)

### الفريق المطلوب
- 2 Senior Backend Engineers (TS + Prisma)
- 1 Frontend Engineer (Next.js + React)
- 1 SOCPA/IFRS Accountant (consultant)
- 1 QA Engineer
- 1 DevOps (نصف وقت)

### الميزانية الزمنية
| المرحلة | الأسابيع | المخرجات |
|---------|---------|---------|
| P0 (7 بنود) | 6 | CoA + FS Generator + Payroll GL + Provisions + TB + Mudad + Standard Reports |
| P1 (20 بنداً) | 10 | كل الفجوات الحرجة |
| P2 (23 بنداً) | 14 | المنظومة الكاملة بمستوى enterprise |
| P3 (4 بنود) | 4 | Polish |
| **الإجمالي** | **34 أسبوع** | **SAP/Oracle/NetSuite parity** |

### معايير الجودة لكل مهمة
1. Vitest coverage ≥ 80%
2. Schema migration mandatory
3. Multi-tenant isolation verified
4. accounting-validator agent approval (للمحاسبة)
5. saudi-compliance agent approval (للسعودية)
6. Diff للمستخدم قبل commit

---

## 7. ملحق — مكتبات و adapters مطلوبة

```bash
# دوال مالية
npm i decimal.js dinero.js currency.js

# تواريخ
npm i date-fns date-fns-tz hijri-date

# PDF + Excel
npm i puppeteer exceljs jspdf

# AI
# (Google Gemini موجود)

# OAuth
npm i passport passport-saml passport-google-oauth20 passport-microsoft

# Bank file formats
npm i mt940-parser camt-parser

# Email
npm i nodemailer @sendgrid/mail mailgun.js

# WhatsApp
npm i twilio whatsapp-web.js

# Salla
# REST direct

# Mudad / Qiwa / GOSI / ZATCA
# REST direct (يحتاج onboarding عند الجهات)
```

---

## 8. خاتمة

**النظام الحالي قاعدة قوية جداً (62% جاهزية)** بنماذج Prisma 489 و engines متخصصة 200+. القفزة المتبقية للوصول لمستوى SAP/Oracle/NetSuite تتطلب:
- إكمال السيناريوهات النصف-مكتملة (Scaffold)
- إغلاق فجوات السعودية (Mudad/Qiwa/GOSI real APIs + Form 14 + PDPL breach)
- بناء Manufacturing execution + Procurement workflows
- إكمال HR stack (Performance, LMS, Succession, ESS/MSS)
- إنشاء Financial Statement Generator + Payroll GL

**الترتيب المقترح:** P0 ثم P1 ثم P2. كل مرحلة تنتهي بـ acceptance test محاسبي + امتثال سعودي.

---

**نهاية التقرير.** جميع البرومنتات في القسم 5 جاهزة للنسخ المباشر في Claude Code.
