# 🌐 Namasoft ERP — Exhaustive Per-Domain Gap Analysis

> **403 فجوة** عبر **28 نطاق** مقارنة بالأنظمة العالمية الرائدة.
> Generated: 2026-05-06 | Codebase: 376 Prisma models, ~330 API routes, ~95 lib engines.
> Legend: S = ≤2 weeks, M = 2–8 weeks, L = >8 weeks

---

## SUMMARY TOTALS

| Block | Domains | Total Gaps |
|-------|---------|-----------|
| Finance Core (1–4) | 4 | 62 |
| Asset & Tax (5–6) | 2 | 33 |
| Cost & Plan (7–8) | 2 | 24 |
| Supply Chain (9–10) | 2 | 36 |
| Customer-Facing (11–12) | 2 | 29 |
| Mfg & Project (13–14) | 2 | 31 |
| HR (15–17) | 3 | 39 |
| Verticals (18–20) | 3 | 39 |
| Quality & GRC (21–22) | 2 | 23 |
| Reporting (23) | 1 | 12 |
| Industry (24) | 1 | 21 |
| Platform (25–28) | 4 | 54 |
| **TOTAL** | **28** | **403 gaps** |

---

## Critical Path — Top 10 Closeable in 6 Months

1. **Domain 1.1 + 1.2** — Universal Journal + Parallel Ledgers (يفتح IFRS dual reporting)
2. **Domain 4.4 + 4.10** — Payment factory + SWIFT GPI (مصداقية الخزينة)
3. **Domain 6.1 + 6.4** — Tax engine abstraction + VAT return (audit-ready)
4. **Domain 9.7 + 9.11** — ATP/CTP + demand forecasting (ربحية العمليات)
5. **Domain 16.1 + 16.2** — Qiwa + Mudad full (تفويض سعودي)
6. **Domain 22.1 + 22.4** — Continuous SoD + Internal Audit (board-ready)
7. **Domain 23.1 + 23.5** — Semantic layer + FS designer (CFO self-service)
8. **Domain 25.1 + 25.2** — API gateway + webhooks (partner ecosystem)
9. **Domain 27.2 + 27.4** — Cache + queue with DLQ (scale ×10 tenants)
10. **Domain 28.2 + 28.7** — SCIM/SSO + UEBA (enterprise-ready)

---

## Domain 1: General Ledger

### Status
GL exists (`Account`, `JournalEntry`, `JournalLine`, `auto-journal.ts`, `FiscalPeriod`, `FiscalYear`, `ConsolidationGroup`, `IntercompanyTransaction`, `FxRevaluationRun`, `AccountingBook`, `AllocationRule`). Universal Journal-style dimensions partially present.

### Gaps (19 — most foundational)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 1.1 | No "Universal Journal" single-table design | SAP S/4 ACDOCA | L |
| 1.2 | No parallel ledgers per accounting principle (Local GAAP vs IFRS vs Tax) | SAP S/4 Parallel Ledgers / Oracle Multi-Book | L |
| 1.3 | No document splitting | SAP New GL Document Splitting | L |
| 1.4 | No segment reporting per IFRS 8 | Oracle Fusion Segments | M |
| 1.5 | No journal entry approval workflow with thresholds and SoD | Oracle Fusion JE Approvals | M |
| 1.6 | No recurring journal scheduler with calendar/frequency | NetSuite Memorized Transactions | M |
| 1.7 | No reversal-on-date journal type | SAP F-65 Reverse Posting | S |
| 1.8 | No statistical/non-financial accounts (units, hours, headcount) | SAP S/4 Statistical Accounts | M |
| 1.9 | No multi-currency triangulation (transaction → group → reporting 3-tier) | Oracle Fusion Reporting Currency | M |
| 1.10 | FX revaluation lacks unrealized-gain reversal next period + monetary classification | SAP FAGL_FCV | M |
| 1.11 | No intercompany matching/elimination automation | Oracle Fusion Intercompany | L |
| 1.12 | Consolidation lacks NCI, CTA, goodwill calculation | Oracle HFM / OneStream | L |
| 1.13 | No journal entry templates with formula-driven amounts | SAP S/4 Recurring Entries | M |
| 1.14 | No "post-with-reference" copy-from-prior-period | SAP FB50/F-02 | S |
| 1.15 | No mass reversal of batch postings | Oracle GL Mass Reversal | S |
| 1.16 | No average daily balance for banking/regulatory | Oracle GL ADB | M |
| 1.17 | No ledger close lock by sub-ledger source | Oracle Fusion Period Close | M |
| 1.18 | No immutable hash-chained postings (tamper-evident GL) | Oracle Cloud Hyperledger | L |
| 1.19 | No drill-down from balance to source document via universal `sourceDocType+Id` | NetSuite GL Impact | M |

---

## Domain 2: Accounts Receivable

### Status
Solid foundation: `OpenItem`, `ItemApplication`, `DisputeCase`, `DunningCampaign`, `PromiseToPay`, `CollectionAgency`, `CustomerCreditScore`, `CashApplicationBatch`, `ECLAssessment`, `dunning-engine.ts`, `cash-application.ts`, `open-items.ts`.

### Gaps (18)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 2.1 | No multi-bucket aging with customer-specific definitions | Oracle Fusion AR Aging | S |
| 2.2 | No customer hierarchy (parent-child, bill-to/ship-to/sold-to/payer) | SAP SD Partner Functions | M |
| 2.3 | No deductions/short-pay management with reason codes | Oracle Fusion AR | M |
| 2.4 | No ML-based remittance parsing for BAI2/lockbox | HighRadius / BlackLine | L |
| 2.5 | No factoring/AR financing module | SAP FSCM / Oracle Securitization | L |
| 2.6 | No receivables securitization SPV accounting | Oracle ARCS | L |
| 2.7 | No on-account credits / unapplied receipt aging | NetSuite | S |
| 2.8 | No customer credit application workflow | D&B integration / SAP FSCM Credit | M |
| 2.9 | ECL exists but no IFRS 9 stage transitions with PD/LGD/EAD | Oracle FCCS / Moody's | L |
| 2.10 | No collection scoring & worklist prioritization | HighRadius Collections | M |
| 2.11 | No dispute root-cause analytics & MTTR | HighRadius DDM | M |
| 2.12 | No installment auto-renegotiation for delinquent | SAP FSCM Dispute | M |
| 2.13 | No customer self-service portal | NetSuite Customer Portal | L |
| 2.14 | No write-off approval workflow with VAT bad debt relief | Oracle | M |
| 2.15 | No AR↔AP netting workflow | SAP FSCM In-House Cash | M |
| 2.16 | No customer profitability with allocated SG&A | Oracle Fusion Profitability | L |
| 2.17 | No cash app tolerance-band auto-write-off | Oracle Fusion AR | S |
| 2.18 | No revenue contract → AR invoice schedule auto-gen | NetSuite ARM / Oracle RMCS | M |

---

## Domain 3: Accounts Payable

### Status
Most advanced module: `PurchaseInvoice`, `ThreeWayMatch`, `TolerancePolicy`, `PaymentRun`, `PaymentRunBankFile`, `DiscountOpportunity`, `WHTRule`, `VendorPortalUser`, `VendorBid`, `three-way-match.ts`.

### Gaps (18)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 3.1 | No invoice OCR with learning loop, vendor-template detection | SAP Concur / Tipalti / Stampli | L |
| 3.2 | No "touchless invoice" auto-post when 3WM passes | Oracle Fusion AP / SAP Ariba | M |
| 3.3 | No vendor self-billing / ERS | SAP MM ERS | M |
| 3.4 | No e-invoice ingestion (PEPPOL/ZATCA-receive) | Pagero / Tradeshift | M |
| 3.5 | No buyer-driven dynamic discounting auction | C2FO / Taulia | L |
| 3.6 | No supply-chain finance (SCF) program | Taulia / PrimeRevenue | L |
| 3.7 | No live vendor portal UI for invoice submission | SAP Ariba Network / Coupa | L |
| 3.8 | No PO flip from vendor portal | Coupa Supplier Portal | M |
| 3.9 | No AP analytics: cost per invoice, % first-time match | NetSuite SuiteAnalytics AP | M |
| 3.10 | No 1099/WHT annual reporting (Saudi WHT statement Form-Z) | Oracle Fusion 1099 / GAZT WHT | M |
| 3.11 | No vendor risk monitoring (sanctions, OFAC, beneficial owner) | Refinitiv World-Check | M |
| 3.12 | No AP-specific approval routing with parallel approvers, OOO | Coupa Approval Chains | S |
| 3.13 | No PO-less invoice with cost allocation templates | Oracle Fusion AP | S |
| 3.14 | No GR/IR clearing report and aging | SAP MR11 | M |
| 3.15 | No payment proposal optimization (discount, due-date, FX) | SAP F110 enhancements | M |
| 3.16 | No virtual card payment integration | Bill.com / AvidXchange | M |
| 3.17 | No vendor master deduplication & merge | D&B Optimizer | M |
| 3.18 | No spend visibility (committed vs accrued vs paid) | Coupa Spend Analysis | M |

---

## Domain 4: Cash Management & Treasury

### Status
`BankAccount`, `BankTransaction`, `BankStatement`, `BankReconRule`, `OutstandingCheck`, `CashFlowForecast`, `bank-recon-engine.ts`, `mt940.ts`. Solid engine, weak treasury.

### Gaps (15)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 4.1 | No In-House Bank (IHB) module | SAP S/4 IHB | L |
| 4.2 | No physical/notional cash pooling | SAP CM Cash Pooling | L |
| 4.3 | No multi-bank connectivity (SWIFT MT/MX, EBICS) | Kyriba / FIS Quantum | L |
| 4.4 | No payment-factory architecture (ISO 20022 pain.001) | Kyriba Payment Factory | L |
| 4.5 | No FX hedging with hedge accounting (IFRS 9) | SAP TRM / FIS Front Arena | L |
| 4.6 | No money market fund / short-term investment tracking | Oracle Treasury | M |
| 4.7 | No debt management (loans, bonds, covenant tracking) | SAP TRM Debt Module | L |
| 4.8 | No rolling 13-week cash forecast with driver-based variance | Kyriba CashFlow / Oracle ARCS | M |
| 4.9 | No bank fee analysis (BSB / EDI 822) | Treasury Strategies / Redbridge | M |
| 4.10 | No SWIFT GPI tracking | Kyriba SWIFT GPI | M |
| 4.11 | No bank account signatory management with KYC | GTreasury BAM | M |
| 4.12 | No cash position what-if simulation by date/entity/currency | Kyriba Cash Position | M |
| 4.13 | No ML-suggested matches with confidence scoring | BlackLine Smart Match | M |
| 4.14 | No "in-flight" payment status state machine | Kyriba Payments | M |
| 4.15 | No payment fraud detection (Positive Pay, payee verification) | Bottomline / Trustpair | M |

---

## Domain 5: Fixed Assets

### Status
Schema is broad; engine logic for parallel books appears thin.

### Gaps (18)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 5.1 | No componentization (per IAS 16.43) | Oracle Fusion FA Components | M |
| 5.2 | No parallel depreciation areas per book (Local, IFRS, Tax, Group, Insurance) | SAP FI-AA Depreciation Areas | L |
| 5.3 | Limited methods (no units-of-production, sum-of-years-digits, declining w/switchover) | Oracle Fusion FA Methods | M |
| 5.4 | No mid-month/mid-quarter/half-year convention | Oracle FA Prorate Conventions | S |
| 5.5 | No bonus depreciation / Section-179-equivalent tax book | Oracle Fusion Tax Book | M |
| 5.6 | No mass additions from AP invoices to CIP to capitalization | SAP CIP / Oracle FA Mass Additions | M |
| 5.7 | No asset retirement obligation (ARO/IAS 37) with discount unwinding | Oracle FA ARO | M |
| 5.8 | No recoverable-amount calc (FVLCD vs VIU) automated | Oracle FA Impairment | M |
| 5.9 | No revaluation reserve / OCI booking with subsequent depreciation transfer | SAP FI-AA Revaluation | M |
| 5.10 | No group depreciation (asset pool) for low-value assets | Oracle FA Group Assets | M |
| 5.11 | No physical inventory / barcode/RFID asset count cycle | Oracle FA Physical Inventory | L |
| 5.12 | No insurance valuation report (replacement cost vs book) | Workday FA / Oracle FA | S |
| 5.13 | No asset book transfer between cost centers/branches with split-month | SAP FI-AA Transfer | M |
| 5.14 | No CIP sub-ledger with project links | SAP IM/CIP | M |
| 5.15 | No leased-asset auto-link to `IfrsLeaseContract` ROU asset | Oracle FA + Lease Accounting | M |
| 5.16 | No asset disposal flows distinct (partial, scrap, sale, trade-in) | Oracle FA Disposal | M |
| 5.17 | No depreciation projections / forecast for budgeting | SAP FI-AA Projections | S |
| 5.18 | No GPS tracking for fleet/heavy assets | Oracle FA + Maintenance | M |

---

## Domain 6: Tax

### Status
ZATCA Phase 2 ✅, basic VAT, WHT, Zakat. Strong KSA core but narrow tax breadth.

### Gaps (15)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 6.1 | No tax engine abstraction (rate by jurisdiction × product × customer × date) | Avalara / Vertex / Sovos | L |
| 6.2 | No reverse-charge VAT for cross-border services | EU Reverse Charge / GAZT | M |
| 6.3 | No partial-exemption / input-VAT pro-rata | UK HMRC Partial Exemption | M |
| 6.4 | No VAT return draft generator with adjustment workflow | HMRC MTD / GAZT VAT-201 | M |
| 6.5 | No automated Saudi Zakat base + form filing | ZATCA Zakat-202 | L |
| 6.6 | No corporate income tax provision with deferred-tax (DTA/DTL) | Onesource Tax Provision | L |
| 6.7 | No transfer pricing docs (Local File, Master File, CbCR) | Thomson Reuters ONESOURCE TP | L |
| 6.8 | No customs declaration integration (FASAH, Bayan) | FASAH / Bayan | L |
| 6.9 | No certificate-of-residence handling, treaty rate lookup | Oracle Fusion WHT | M |
| 6.10 | No US-style sales tax with nexus (blocks UAE corp-tax expansion) | Avalara | M |
| 6.11 | No e-way bill / shipment-to-customs document linkage | India GST / KSA TAMM | M |
| 6.12 | No excise tax module (tobacco, sweetened drinks, energy drinks) | ZATCA Excise | M |
| 6.13 | No tax audit defense file with source IDs | SAP Tax Compliance | M |
| 6.14 | No periodic tax close engine (lock VAT-relevant docs, reconcile) | SAP Tax Compliance / Sovos | M |
| 6.15 | No tax-sensitive PO/Invoice posting (auto-determine tax code) | SAP Tax Procedure (TAXSA) | M |

---

## Domain 7: Cost Accounting & Profitability

### Status
`CostCenter`, `AllocationRule`, `BudgetLine`, `Encumbrance`, `StandardCostVersion`, `VarianceTransaction`, `costing.ts`. Bare-bones.

### Gaps (12)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 7.1 | No profit-center hierarchy distinct from cost-center | SAP CO Profit Centers | M |
| 7.2 | No internal orders (CO orders) | SAP CO Internal Orders | M |
| 7.3 | No Activity-Based Costing (ABC) | SAP CO-ABC / Oracle ABM | L |
| 7.4 | No CO-PA multi-dimensional segments | SAP CO-PA | L |
| 7.5 | No transfer pricing between cost/profit centers | SAP Transfer Pricing | M |
| 7.6 | No statistical key figures (headcount, sqm, kWh) | SAP CO Statistical Key Figures | M |
| 7.7 | No assessment vs distribution distinction (primary vs secondary) | SAP CO Assessment/Distribution | M |
| 7.8 | No standard-cost rollup engine across multi-level BOM | SAP CO-PC Standard Cost | M |
| 7.9 | No actual costing | SAP Material Ledger | L |
| 7.10 | No variance analysis breakdown (price/qty/mix/yield/efficiency) | SAP CO-PC Variance Categories | M |
| 7.11 | No segment reporting (IFRS 8) independent of legal entity | Oracle Fusion Segments | M |
| 7.12 | No cost-center planning interface | SAP CO Planning Layouts | M |

---

## Domain 8: Budgeting & Planning

### Status
`Budget`, `BudgetLine`, `Encumbrance`, `budget-control.ts`. Simple budget vs actual.

### Gaps (12)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 8.1 | No top-down + bottom-up reconciliation | Anaplan / Oracle EPBCS | L |
| 8.2 | No driver-based planning chains | Anaplan / Workday Adaptive | L |
| 8.3 | No scenario manager (Best/Base/Worst) | Oracle EPBCS / SAP IBP | M |
| 8.4 | No rolling 18-month forecast with auto-roll-forward | Oracle EPBCS | M |
| 8.5 | No workforce planning module (FTE, attrition, salary inflation) | Workday Adaptive | L |
| 8.6 | No capex planning with project approval thresholds | Oracle EPBCS Capital | M |
| 8.7 | No variance commentary capture | Oracle EPBCS Comments / SAP BPC | M |
| 8.8 | No commitment accounting hierarchy (commit → obligate → expend) | Oracle Public Sector | M |
| 8.9 | No budget transfer / supplemental budget / virement workflow | Oracle Public Sector Budget | M |
| 8.10 | No S&OP module integrating sales forecast → production plan | Oracle DBI / SAP IBP | L |
| 8.11 | No flexible budget (auto-flex by activity volume) | SAP CO Planning / Hyperion | M |
| 8.12 | No KPI tree / strategic plan linkage (BSC) | Workday Adaptive / Oracle Strategic Modeling | M |

---

## Domain 9: Inventory

### Status
Strong base: `Stock`, `ProductBatch`, `ProductSerialNumber`, `StockReservation`, `LandedCost`, `costing.ts`, `inventory-engine.ts`, `lot-engine.ts`, `picking-fefo.ts`.

### Gaps (20)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 9.1 | No costing per accounting book (FIFO IFRS + WAvg tax) | SAP Material Ledger Multi-Valuation | L |
| 9.2 | No standard cost vs actual cost variance posting at goods movement | SAP Material Ledger | M |
| 9.3 | No vendor-managed consignment | SAP MM Consignment | M |
| 9.4 | No customer-consignment outbound | SAP SD Consignment | M |
| 9.5 | No kitting / virtual-kit BOM at sales-time | NetSuite Kits / Odoo Kit BOM | M |
| 9.6 | No allocation rules for partial fulfillment by priority | Oracle Order Mgmt ATP | M |
| 9.7 | No ATP/CTP real-time | SAP gATP / Oracle ATP | L |
| 9.8 | No drop-ship / cross-dock workflows distinct | NetSuite Drop Ship | M |
| 9.9 | No FEFO enforcement at sales/transfer (only picking helper) | SAP IM Batch + Shelf Life | M |
| 9.10 | No multi-echelon replenishment optimization | Manhattan WMS / RELEX | L |
| 9.11 | No demand forecasting engine (Croston, Holt-Winters, ML) | Oracle Demand Mgmt / SAP IBP | L |
| 9.12 | No safety-stock per service-level + lead-time variability | Oracle ASCP | M |
| 9.13 | No quality-hold inventory status at lot level | SAP Batch Mgmt Status | M |
| 9.14 | No serial-number genealogy reporting tied to recall | SAP Batch Genealogy | M |
| 9.15 | No E&O reserve calculation with auto-write-down at age | SAP MM Slow-Moving / Oracle FA E&O | M |
| 9.16 | No landed cost apportionment by weight/volume/value with true-up | Oracle Cost Mgmt Landed Cost | M |
| 9.17 | No item attribute groups & variants matrix (size/color/style) | NetSuite Matrix Items | M |
| 9.18 | No lot/serial-level cost (weighted-avg per lot) | NetSuite Lot Numbered Costing | M |
| 9.19 | No inter-warehouse Stock Transport Order with transit account | SAP STO | M |
| 9.20 | No physical-count adjustment approval with thresholds | Oracle Cost Mgmt | S |

---

## Domain 10: Procurement

### Status
Mid-market depth: `PurchaseRequisition`, `RequestForQuotation`, `PurchaseOrder`, `GoodsReceiptNote`, `SupplierContract`, `VendorRating`, `VendorBid`, `vendor-scoring.ts`. No e-auction / category mgmt.

### Gaps (16)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 10.1 | No e-auction (English/Dutch/Japanese) with countdown | SAP Ariba Sourcing / Coupa | L |
| 10.2 | No sourcing event with multi-round, weighted award optimization | SAP Ariba / Jaggaer | L |
| 10.3 | No category management with strategy docs and savings tracker | Coupa Category Mgmt | M |
| 10.4 | No spend analytics with auto-classification (UNSPSC) | Coupa Spend / SAP Ariba Spend Visibility | L |
| 10.5 | No clause library, e-signature, contract obligation tracking | Icertis / DocuSign CLM | L |
| 10.6 | No catalog / punchout (cXML/OCI) | SAP Ariba Catalog / Coupa | L |
| 10.7 | No PO with line-level account distribution | Oracle Fusion PO Distributions | S |
| 10.8 | No blanket PO / call-off order workflow | SAP Outline Agreements | M |
| 10.9 | No vendor onboarding portal (registration, KYC, certificates, ZATCA TIN, NCAR) | SAP Ariba SLP / Coupa Risk Aware | L |
| 10.10 | No vendor performance KPIs with quarterly review cycle | SAP SLP Performance | M |
| 10.11 | No supplier diversity/local content (Saudization, IKTVA Aramco) | Aramco IKTVA portal / NCEI | M |
| 10.12 | No purchase price variance (PPV) report by buyer | Coupa Savings | M |
| 10.13 | No procurement guided buying with policy enforcement | Coupa Guided Buying | M |
| 10.14 | No tail-spend automation / catalog routing | SAP Ariba Tail Spend | M |
| 10.15 | No contract-price compliance check at PO/invoice time | SAP Contract Compliance | S |
| 10.16 | No long-term agreement / framework agreement linkage | SAP Outline Agreement | M |

---

## Domain 11: Sales / Q2C

### Status
Decent breadth: `SalesInvoice`, `SalesOrder`, `DeliveryNote`, `PriceQuote`, `PriceList`, `Promotion`, `Coupon`, `LoyaltyPoint`, `SalesReturn`, `RMA`, `WarrantyClaim`, `CommissionRule`, `PerformanceObligation`, `DeferredRevenueSchedule`.

### Gaps (15)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 11.1 | No CPQ for complex configurable products | Salesforce CPQ / Oracle CPQ | L |
| 11.2 | No quote-to-cash full state machine cross-document | Salesforce Revenue Cloud | L |
| 11.3 | No volume rebate accrual & settlement | SAP S/4 Settlement Mgmt | L |
| 11.4 | No tiered/matrix pricing (qty × tier × period) | Oracle Fusion Pricing | M |
| 11.5 | No price-book versioning with effectivity + approval | SAP CRM Pricing | M |
| 11.6 | No customer-specific contract pricing override | Oracle Fusion Pricing Profile | M |
| 11.7 | No commission split (multi-rep, manager override, partner) | Xactly / Varicent | L |
| 11.8 | No RMA disposition codes (repair/refurbish/scrap) | Oracle SCM Returns | M |
| 11.9 | No SSP allocation engine for ASC 606 / IFRS 15 bundles | NetSuite ARM / Oracle RMCS | L |
| 11.10 | No sales forecast with pipeline weighting | Salesforce Forecasting / Clari | L |
| 11.11 | No territory management (geo + product + segment) | SAP CRM Territory / Salesforce | M |
| 11.12 | No deal desk / discount approval matrix tied to margin floor | Salesforce Approvals + CPQ | M |
| 11.13 | No metered-usage rating for subscriptions | Zuora / Stripe Billing | L |
| 11.14 | No customer rebate redemption portal | SAP S/4 Rebates | M |
| 11.15 | No sales literature / collateral linked to opp stage | Salesforce CMS | S |

---

## Domain 12: CRM

### Status
Basic: `Lead`, `CrmAccount`, `Contact`, `Opportunity`, `PipelineStage`, `Activity`, `crm-engine.ts`, WhatsApp routes.

### Gaps (14)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 12.1 | No marketing automation (drip campaigns, nurture flows) | HubSpot / Marketo / Pardot | L |
| 12.2 | No campaign ROI tracking with attribution | Salesforce Campaign Influence | M |
| 12.3 | No customer journey designer | Salesforce Marketing Cloud | L |
| 12.4 | No social listening / sentiment analytics | Sprinklr / Khoros | L |
| 12.5 | No web visitor tracking / form-to-lead | HubSpot / Marketo | M |
| 12.6 | No lead scoring (demographic + behavioral) | Marketo / HubSpot | M |
| 12.7 | No NPS/CSAT survey + closed-loop feedback | Qualtrics / Medallia | M |
| 12.8 | No funnel analytics with stage conversion benchmarks | Clari / Gong | M |
| 12.9 | No call-recording / conversation intelligence | Gong / Chorus | L |
| 12.10 | No service-cloud-style case mgmt distinct from `ServiceTicket` | Salesforce Service Cloud | M |
| 12.11 | No 360° customer view | Salesforce Customer 360 | M |
| 12.12 | No partner/dealer portal with deal registration | Salesforce PRM | L |
| 12.13 | No mobile CRM offline sync | Salesforce Mobile / Dynamics 365 | L |
| 12.14 | No event mgmt (webinars/exhibitions) tied to lead capture | Cvent / Eventbrite | M |

---

## Domain 13: Manufacturing

### Status
Best-developed after AR/AP: `ManufacturingOrder`, `Recipe`, `BOMVersion`, `EngineeringChangeOrder`, `WorkCenter`, `Machine`, `MachineTelemetry`, `QualityCheck`, `ScheduledOperation`, `SubcontractingPO`, `mrp-engine.ts`, `mps-engine.ts`, `bom-engine.ts`.

### Gaps (18)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 13.1 | No MES (shop-floor terminals, real-time labor & machine reporting) | Siemens Opcenter Execution / Rockwell | L |
| 13.2 | No APS finite-capacity scheduler | Siemens Opcenter APS / Asprova | L |
| 13.3 | No OEE engine with downtime reasons, micro-stops, speed loss | Siemens Opcenter / GE Plant Apps | M |
| 13.4 | No e-kanban with min-max signals | Plex / Infor LN | M |
| 13.5 | No process-industry features (recipe yield, batch genealogy, scale-up) | SAP PP-PI / Aspen Plus | L |
| 13.6 | No sub-component-level subcontracting with vendor inventory ownership | SAP MM Subcontracting Stock | M |
| 13.7 | No ECO full lifecycle (ECR→ECN→implement) | Siemens Teamcenter / Oracle Agile | L |
| 13.8 | No PLM (item revision, CAD, ECO routing) | Siemens Teamcenter / PTC Windchill | L |
| 13.9 | No serialization & track-and-trace per regulation | TraceLink / SAP ATTP | L |
| 13.10 | No co-product / by-product yield allocation methods | SAP CO-PC Co-Product | M |
| 13.11 | No labor tracking per operation (start/stop, idle, setup) | Siemens Opcenter Execution | M |
| 13.12 | No tool & die management with usage counter | SAP PM / Infor EAM | M |
| 13.13 | No production confirmation backflushing rules | SAP PP Backflush | S |
| 13.14 | No shop-floor dashboard (Andon, KPI walls) | Rockwell FactoryTalk / Siemens MindSphere | L |
| 13.15 | No SPC (X-bar/R, Cpk) | InfinityQS / Minitab | L |
| 13.16 | No NCR root-cause taxonomy + CAPA effectiveness | Siemens Opcenter Quality / MasterControl | M |
| 13.17 | No discrete vs flow vs project mfg strategy switching | Oracle Mfg Cloud | M |
| 13.18 | No MRP exception messages with priority & follow-up | SAP MRP Exceptions / Oracle ASCP | M |

---

## Domain 14: Project Mgmt & Job Costing

### Status
`Project`, `ProjectTask`, `ProjectBudgetLine`, `SalesContract`, `RevenueMilestone`, `ServiceTimesheet`. Lacks WBS depth.

### Gaps (13)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 14.1 | No multi-level WBS tree | Primavera P6 / MS Project | M |
| 14.2 | No critical path / Gantt with FS/SS/FF/SF + lags | Primavera P6 / MS Project | L |
| 14.3 | No Earned Value Management (CPI/SPI, EAC, ETC) | Deltek Cobra / Primavera EVM | L |
| 14.4 | No resource histogram / leveling | Primavera P6 Resource Mgmt | M |
| 14.5 | No project revenue methods (POC, completed-contract, milestone) | Oracle PPM / SAP PS | M |
| 14.6 | No retention/retainage on customer billings | Oracle PPM / Sage 300 CRE | M |
| 14.7 | No project profitability with cost-to-complete forecasting | Oracle PPM | M |
| 14.8 | No subcontract on project with backcharges + pay-when-paid | Sage 300 CRE / Procore | M |
| 14.9 | No issue/risk/change-request log per project | MS Project / Oracle Primavera Risk | M |
| 14.10 | No mobile timesheet with GPS clock-in | Sage Field Operations / FieldEdge | M |
| 14.11 | No expense report linkage to project | Concur / Oracle iExpense | M |
| 14.12 | No project-based purchasing (PR/PO with project + WBS) | SAP PS-PO Integration | M |
| 14.13 | No interim payment certificate (IPC) for construction | Procore / Sage 300 CRE | L |

---

## Domain 15: HR Core

### Status
Adequate breadth: `Employee`, `Attendance`, `Salary`, `Vacation`, `LeaveRequest`, `EmployeeEvaluation`, `TrainingCourse`, `EmployeeLoan`, `JobPosting`.

### Gaps (12)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 15.1 | No position management distinct from employee | Oracle HCM Position Mgmt | M |
| 15.2 | No org-chart effective dating | Workday Effective Dating | M |
| 15.3 | No employee self-service portal | Workday ESS / Oracle HCM | L |
| 15.4 | No manager self-service | Workday MSS | L |
| 15.5 | No employee document repository with version control | Workday Documents | M |
| 15.6 | No auto-renewal workflow on document expiry | Oracle HCM Person Documents | S |
| 15.7 | No competency framework | Workday Skills Cloud | L |
| 15.8 | No 9-box performance matrix and calibration | Workday Performance / SuccessFactors | M |
| 15.9 | No goal cascade with check-in cadence | Workday Performance / Lattice | M |
| 15.10 | No HR analytics (turnover, time-to-hire, span-of-control) | Workday Prism / Visier | M |
| 15.11 | No multi-jurisdiction labor law engine | Workday Multi-Country | L |
| 15.12 | No headcount planning approval workflow | Workday Workforce Planning | M |

---

## Domain 16: Payroll & Saudi Compliance

### Status
Strong KSA focus: `PayrollRun`, `WPSBatch`, `GOSIContribution`, `EndOfServiceCalculation`, `gosi-engine.ts`, `wps-generator.ts`, `saudi-eos-engine.ts`, `mudad.ts` (stub).

### Gaps (16)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 16.1 | No Qiwa integration | Qiwa portal API | M |
| 16.2 | No Mudad full integration (only stub) | Mudad API | M |
| 16.3 | No Nitaqat color/category calculation with projection | Nitaqat / Tanseeq | M |
| 16.4 | No Absher integration (Iqama renewal, exit-reentry visa) | Absher API | M |
| 16.5 | No Muqeem integration | Muqeem | M |
| 16.6 | No HRSD / MOL contract upload & e-signature | HRSD portal | M |
| 16.7 | No GOSI dispute / reconciliation report | GOSI portal | M |
| 16.8 | No IFRS-19 actuarial valuation for EOS liability | Mercer / WTW / Aon | L |
| 16.9 | No payroll cost variance report (budget vs actual w/drivers) | Workday Payroll Variance | M |
| 16.10 | No multi-payroll-cycle support (weekly + monthly + project) | Oracle Payroll | M |
| 16.11 | No retroactive payroll calc engine | SAP Payroll Retro / ADP | L |
| 16.12 | No leave encashment auto-calc on termination | Oracle Fusion HCM | S |
| 16.13 | No housing/transport allowance KSA-specific rules | Oracle Fusion ME Localization | S |
| 16.14 | No timesheet → payroll feed for hourly | Oracle HCM Time & Labor | M |
| 16.15 | No GOSI contribution reconciliation with GL (auto-clear) | SAP HR-FI Integration | S |
| 16.16 | No statutory year-end statements (income certificate) | KSA HRSD format | S |

---

## Domain 17: Recruitment & Talent

### Status
Stub-level: `JobPosting`, `JobApplicant`.

### Gaps (12)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 17.1 | No JD library with competencies and salary band linkage | Workday Talent / SuccessFactors | M |
| 17.2 | No candidate ATS pipeline with scorecards, offer-letter | Greenhouse / Lever / Workday Recruiting | L |
| 17.3 | No interview scheduling with calendar integration | Greenhouse / Lever | M |
| 17.4 | No structured interview kits | Greenhouse | M |
| 17.5 | No background check integration | HireRight / Checkr | M |
| 17.6 | No offer-letter e-sign + onboarding checklist | Workday / DocuSign | M |
| 17.7 | No referral program tracking | LeverTRM / Greenhouse | S |
| 17.8 | No LMS (SCORM/xAPI, quizzes, certifications) | Cornerstone / Docebo / SuccessFactors | L |
| 17.9 | No succession planning | Workday Talent / SuccessFactors | M |
| 17.10 | No skills inventory & skill-based talent matching | Workday Skills Cloud / Eightfold | L |
| 17.11 | No internal mobility / gig marketplace | Workday Opportunity Graph | L |
| 17.12 | No 360° feedback tool | Workday Performance / Culture Amp | M |

---

## Domain 18: Real Estate / Property

### Status
Lessor weak, lessee (IFRS-16) strong: `Property`, `LeaseContract`, `RentInstallment`, `IfrsLeaseContract`, `IfrsLeaseSchedule`, `IfrsLeaseModification`, `IfrsSublease`, `lease-accounting-engine.ts`.

### Gaps (12)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 18.1 | No tenant portal | Yardi RentCafe / AppFolio | L |
| 18.2 | No CAM charge calculation and reconciliation | Yardi / MRI | M |
| 18.3 | No utility billing (sub-meter reading) | Yardi / RealPage | M |
| 18.4 | No vacancy/occupancy reporting with LTM trend | Yardi BI | M |
| 18.5 | No broker commission tracking on lease execution | Yardi Voyager | M |
| 18.6 | No rent escalation auto-computation (CPI/fixed%/step-up) | Yardi Voyager / MRI | M |
| 18.7 | No lease abstract & critical-date alerts | Yardi Voyager / Visual Lease | M |
| 18.8 | No property-level P&L with NOI calculation | Yardi BI / Argus | M |
| 18.9 | No work-order / service-request workflow for tenants | Yardi Maintenance / AppFolio | M |
| 18.10 | No security-deposit tracking with refund reconciliation | Yardi / AppFolio | S |
| 18.11 | No vacancy listing / Saudi Ejar integration | Ejar API | M |
| 18.12 | No fair-value revaluation for IAS 40 investment property | Argus Enterprise | M |

---

## Domain 19: Service & Field Mgmt

### Status
Limited: `ServiceTicket`, `ServiceTimesheet`, `Maintenance`, `MachineMaintenance`.

### Gaps (12)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 19.1 | No SLA matrix with auto-escalation | ServiceNow / Salesforce Service Cloud | M |
| 19.2 | No dispatch board with map + technician availability + skills | ServiceMax / FieldEdge | L |
| 19.3 | No mobile technician app (offline, photo, signature, parts) | ServiceMax / Salesforce Field Service Mobile | L |
| 19.4 | No PM scheduling with calendar + meter triggers | IBM Maximo / Infor EAM | M |
| 19.5 | No service contract / warranty entitlement check | Oracle Service / Salesforce Service Cloud | M |
| 19.6 | No truck-stock / van inventory replenishment | ServiceMax Mobile | M |
| 19.7 | No FTFR and MTTR analytics | ServiceMax Insights | S |
| 19.8 | No remote-diagnostics / IoT ticket creation | ServiceMax Connected Field Service | L |
| 19.9 | No knowledge base with article suggestion at ticket | Salesforce Service / Zendesk Guide | M |
| 19.10 | No service revenue recognition tied to entitlements | Zuora RevPro / Oracle RMCS | M |
| 19.11 | No customer comm thread (email/WhatsApp/SMS) on ticket | Zendesk / Freshdesk | M |
| 19.12 | No 3rd-party contractor dispatch with rate cards | ServiceChannel / Building Engines | M |

---

## Domain 20: WMS

### Status
Schema rich, engine very thin: `WarehouseZone`, `WarehouseRack`, `WarehouseBin`, `PutawayRule`, `PickList`, `PhysicalCountSession`, `wms-engine.ts` (stub), `picking-fefo.ts`.

### Gaps (15)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 20.1 | No directed putaway with multi-rule chain + capacity check | Manhattan WMS / Blue Yonder | L |
| 20.2 | No multi-strategy picking (wave/batch/cluster/zone/discrete) | Manhattan WMS | L |
| 20.3 | No wave planning (carrier cut-off, tote/pallet build) | Manhattan WMS / SAP EWM | L |
| 20.4 | No slotting optimization (velocity-based, ABC) | Manhattan Slotting / JDA | L |
| 20.5 | No cross-docking workflow | SAP EWM Cross-Docking | M |
| 20.6 | No yard management (gates, doors, dock scheduling) | Manhattan Yard Mgmt | L |
| 20.7 | No voice picking integration | Vocollect / Honeywell / Lucas Voice | L |
| 20.8 | No RF-gun mobile UI for receive/pick/count | Manhattan / SAP EWM RF | L |
| 20.9 | No license-plate (LPN) with hierarchical packaging | SAP EWM HU Mgmt | M |
| 20.10 | No cycle-count strategy (ABC frequency, blind/non-blind, zero-bin) | SAP IM Cycle Count / Oracle WMS | M |
| 20.11 | No labor management (engineered standards, productivity) | Manhattan WMS Labor | L |
| 20.12 | No replenishment trigger (min-max bin) auto-task | SAP EWM Replenishment | M |
| 20.13 | No carton/pallet build optimization | SAP EWM / Logility | M |
| 20.14 | No 3PL multi-client warehouse support | Manhattan SCALE / 3PL Central | L |
| 20.15 | No shipping label / manifest with carrier integration (Aramex, SMSA, DHL) | ShipStation / EasyPost | M |

---

## Domain 21: Quality Management

### Status
Light: `QualityCheck`, `QualityInspection`, `QualitySpec`, `NonConformanceReport`, `CorrectiveAction`, `quality-management.ts`.

### Gaps (10)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 21.1 | No inspection plan / sampling plan (AQL ANSI/ASQ Z1.4) | SAP QM Inspection Lots | M |
| 21.2 | No SPC charts (X-bar/R, p-chart, c-chart) with control limits | InfinityQS / Minitab | L |
| 21.3 | No instrument calibration management | SAP QM Test Equipment / Beamex | M |
| 21.4 | No supplier quality (incoming inspection per vendor, SCAR) | SAP QM Supplier / ETQ Reliance | M |
| 21.5 | No CoA / certificate of conformance generation per batch | SAP QM CoA | M |
| 21.6 | No FMEA docs linked to processes/products | iAuditor / ETQ Reliance | L |
| 21.7 | No 8D / Pareto / Ishikawa / 5-Why structured RCA tools | ETQ Reliance / MasterControl | M |
| 21.8 | No CAPA effectiveness review with verification step | MasterControl / Veeva Vault QMS | M |
| 21.9 | No ISO 9001 / 22000 / GMP audit checklist & cert tracking | iAuditor / Intelex | M |
| 21.10 | No deviation / change-control workflow distinct from NCR | Veeva Vault QMS | L |

---

## Domain 22: Compliance, Audit & Risk

### Status
Decent foundation: `AuditLog`, `FieldAuditLog`, `ComplianceAuditLog`, `SegregationOfDutiesRule`, `RoleFieldPermission`, `governance-engine.ts`, `field-audit.ts`, `ImmutableReport`.

### Gaps (13)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 22.1 | No continuous SoD violation analytics (daily run, exceptions) | SAP GRC Access Control / SailPoint | L |
| 22.2 | No risk register with likelihood × impact methodology | RSA Archer / ServiceNow GRC | M |
| 22.3 | No control library mapped to risks with test schedule | RSA Archer / Workiva | M |
| 22.4 | No internal audit module (audit plan, findings, remediation) | TeamMate+ / AuditBoard | L |
| 22.5 | No policy management (lifecycle, attestation tracking) | NAVEX Policy Tech / RSA Archer | M |
| 22.6 | No regulatory change management | Thomson Reuters Connected Risk | M |
| 22.7 | No whistleblower / hotline system | NAVEX EthicsPoint | M |
| 22.8 | No SIEM-friendly export (CEF/LEEF) | Splunk / IBM QRadar | M |
| 22.9 | No PDPL DSAR workflow (KSA Data Subject Access Request) | OneTrust / TrustArc | M |
| 22.10 | No data residency / cross-border-transfer log for PDPL Article 29 | OneTrust | M |
| 22.11 | No SOX-style ICFR documentation | Workiva Wdesk / AuditBoard | L |
| 22.12 | No fraud detection rule engine (Benford, duplicate vendor bank, ghost emp) | ACL / Galvanize / Oversight | L |
| 22.13 | No blockchain-anchored evidence pack for regulators | Guardtime / Provenance | L |

---

## Domain 23: Reporting & BI

### Status
Reports are bespoke per route, no semantic layer.

### Gaps (12)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 23.1 | No semantic layer / BI metadata model | LookML / Power BI Semantic / SAP SAC | L |
| 23.2 | No persona dashboards (CFO/Controller/AR Mgr) with drill | Workday Adaptive / Power BI | M |
| 23.3 | No ad-hoc query / pivot tool for end-users | Power BI / Tableau / Sigma | L |
| 23.4 | No mobile-first reports with offline cache | Tableau Mobile / Power BI Mobile | M |
| 23.5 | No financial-statement designer (rows/cols/parameters, drill to JE) | Oracle Hyperion FR / SAP SAC FS Designer | L |
| 23.6 | No regulatory XBRL filing generator (CMA-listed companies) | Workiva Wdesk XBRL | L |
| 23.7 | No data warehouse separation (OLTP queries hit live Postgres) | Snowflake / BigQuery / Databricks | L |
| 23.8 | No scheduled report distribution with filter param per recipient | SSRS / Power BI Subscriptions | S |
| 23.9 | No predictive analytics / what-if integrated to GL | Workday Adaptive Predict / SAP SAC | L |
| 23.10 | No board-pack PDF compiler with executive narrative AI | Workiva Wdesk Reports / Datarails | M |
| 23.11 | No anomaly detection on KPIs (alert when DSO > +2σ) | Sisense Pulse / Tableau Anomaly | M |
| 23.12 | No row-level security on reports | Power BI RLS / Tableau RLS | M |

---

## Domain 24: Industry Verticals

### Status
Coverage is shallow per vertical.

### Gaps (21)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 24.1 | Clinic: no full EMR (SOAP, ICD-10/11, CPT, allergy/problem list, vitals) | Epic / Cerner / OpenEMR | L |
| 24.2 | Clinic: no NPHIES/CHI insurance claim with eligibility check | NPHIES API | L |
| 24.3 | Clinic: no DICOM image / radiology integration | OpenMRS / Orthanc PACS | L |
| 24.4 | Clinic: no telemedicine module | Doxy.me / Teladoc | M |
| 24.5 | School: no gradebook with weighted assessments + report card | PowerSchool / Infinite Campus | L |
| 24.6 | School: no per-period attendance + tardy tracking | PowerSchool | M |
| 24.7 | School: no transport route assignment / parent pickup | Tyler Versatrans / Edulog | M |
| 24.8 | School: no parent portal | PowerSchool Parent / ClassDojo | L |
| 24.9 | School: no LMS integration | Canvas / Schoology / Google Classroom | L |
| 24.10 | School: no MOE NOOR / Madrasati integration | NOOR / Madrasati API | M |
| 24.11 | Restaurant: no KDS routing per station with prep times | Toast KDS / Square KDS | M |
| 24.12 | Restaurant: no recipe-cost auto-update with menu engineering | Restaurant365 / MarketMan | M |
| 24.13 | Restaurant: no table-turn analytics, void/comp tracking | Toast Analytics | M |
| 24.14 | Restaurant: no online ordering (Hungerstation, ToYou, Jahez) | Otter / Deliverect | M |
| 24.15 | Retail: no markdown/clearance lifecycle with margin calc | Oracle Retail Pricing / SAP CAR | M |
| 24.16 | Retail: no multi-store transfer with sales-velocity reasoning | Oracle Retail / NetSuite SuiteCommerce | M |
| 24.17 | Retail: no clienteling app | Salesforce Retail / Tulip | L |
| 24.18 | Retail: no BOPIS, endless aisle, ship-from-store | Manhattan Active Omni / Salesforce OMS | L |
| 24.19 | Construction: no measurement book, IPC generator | Procore / Sage 300 CRE | L |
| 24.20 | Construction: no equipment costing & internal-rental rates | Sage 300 CRE / Viewpoint Vista | M |
| 24.21 | Construction: no submittal / RFI / drawings register | Procore / PlanGrid | L |

---

## Domain 25: Integration & API Mgmt

### Status
Foundation: `ApiKey`, `EventLog`, `SagaTransaction`, `event-bus.ts`, `saga-orchestrator.ts`.

### Gaps (12)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 25.1 | No public API gateway (rate limit, key-per-tenant, throttling, plans) | Kong / Apigee / AWS API Gateway | M |
| 25.2 | No webhook subscription mgmt (retry, signing, replay) | Stripe Webhooks / Shopify Webhooks | M |
| 25.3 | No GraphQL endpoint / unified BFF | Hasura / Apollo / Salesforce GraphQL | L |
| 25.4 | No OpenAPI/Swagger docs per route | SwaggerHub / Stripe Docs | M |
| 25.5 | No integration partner portal / app marketplace | Salesforce AppExchange / NetSuite SuiteApp | L |
| 25.6 | No iPaaS adapter library (Salesforce, HubSpot, Salla, Zid, Aramex, SMSA) | MuleSoft / Boomi / Workato | L |
| 25.7 | No ETL/ELT pipelines (CSV, S3, Postgres CDC) | Airbyte / Fivetran / Stitch | L |
| 25.8 | No bulk import wizard with column mapping & validation | NetSuite CSV Import | M |
| 25.9 | No outbound EDI (X12, EDIFACT) | SPS Commerce / TrueCommerce | L |
| 25.10 | No event sourcing replay / projection rebuild | EventStoreDB / Axon | L |
| 25.11 | No SDK for partners (Node, .NET, Python) | Stripe SDKs | M |
| 25.12 | No sandbox tenant with seed data | NetSuite Sandbox / Salesforce Sandbox | M |

---

## Domain 26: Mobile & UX

### Status
PWA + Electron desktop. No native mobile.

### Gaps (12)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 26.1 | No native iOS/Android app | NetSuite / Workday / Dynamics 365 mobile | L |
| 26.2 | No offline-first sync for field reps | Salesforce Mobile Offline / Outsystems | L |
| 26.3 | No biometric login (FaceID/TouchID) | Workday Mobile | M |
| 26.4 | No deep-linking + push-notifications (Firebase, OneSignal) | Salesforce Mobile / Workday | M |
| 26.5 | No WCAG 2.1 AA + ARIA coverage | Workday / Salesforce Lightning Accessibility | L |
| 26.6 | No voice commands | Salesforce Einstein Voice / Workday Assistant | L |
| 26.7 | No keyboard-driven power-user shortcuts | NetSuite shortcuts / Linear keyboard nav | S |
| 26.8 | No theming / branding per tenant (white-label) | NetSuite OneWorld Branding | M |
| 26.9 | No print-template designer (drag-drop invoice/SO layouts) | NetSuite PDF/HTML Templates / SAP SmartForms | L |
| 26.10 | No multi-language UI beyond AR/EN | Workday Translation Tools | M |
| 26.11 | No in-app guided tours / feature adoption tracking | Pendo / WalkMe | M |
| 26.12 | No dark-mode | Linear / Notion | S |

---

## Domain 27: Performance & Scalability

### Status
DB-per-tenant Postgres, no read-replica/cache layer observed.

### Gaps (14)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 27.1 | No read replica routing for reports/dashboards | Postgres + PgBouncer / Aurora | M |
| 27.2 | No application cache layer (Redis/Memcached) for hot lookups | Redis Enterprise / Upstash | M |
| 27.3 | No CDN for static assets | Cloudflare / CloudFront | S |
| 27.4 | No async job queue with retry/dead-letter and dashboard | BullMQ / Sidekiq / Hangfire | M |
| 27.5 | No background job for heavy reports with email-when-ready | NetSuite Saved Search Schedule | M |
| 27.6 | No tenant-level resource quotas (CPU, query rate, storage) | Snowflake Resource Monitors / NetSuite Concurrency | M |
| 27.7 | No DB sharding strategy beyond single Postgres per tenant | Citus / Vitess / CockroachDB | L |
| 27.8 | No materialized views for trial-balance/aging/inventory | Postgres mat views / Snowflake Materialized | M |
| 27.9 | No server-side cursor pagination strategy | GraphQL Connections / Stripe Cursor | M |
| 27.10 | No query plan monitoring & slow-query alerting | pgBadger / Datadog APM | M |
| 27.11 | No backpressure on bulk imports | NetSuite SuiteScript Governance | M |
| 27.12 | No load test baseline / capacity planning runbook | k6 / Gatling | M |
| 27.13 | No connection pool sizing per tenant | PgBouncer / Prisma Data Proxy | M |
| 27.14 | No archival strategy for old documents | Oracle ILM / Postgres partitioning | L |

---

## Domain 28: Security

### Status
Strong start: MFA suite (`UserBackupCode`, `MfaAttempt`, `TrustedDevice`, `MfaPolicy`, `totp.ts`, `encryption.ts`), `ApiKey`, `RoleFieldPermission`, `SegregationOfDutiesRule`, `privacy-filter.ts`, Clerk auth.

### Gaps (16)
| # | Gap | Reference | Effort |
|---|-----|-----------|--------|
| 28.1 | RBAC exists but no ABAC for row/column conditions | Oracle Fusion Data Security / Salesforce Sharing Rules | L |
| 28.2 | No SAML 2.0 / SCIM provisioning for enterprise SSO | Okta / Azure AD / Auth0 | M |
| 28.3 | No PIM/PAM for break-glass admins with session recording | CyberArk / BeyondTrust | L |
| 28.4 | No data masking on lower environments | Delphix / Informatica DM | M |
| 28.5 | No field-level encryption for PII | NetSuite Token Vault / Salesforce Shield | M |
| 28.6 | No DLP on outbound exports | Microsoft Purview / Symantec DLP | M |
| 28.7 | No UEBA (anomaly detection on user behavior) | Microsoft Sentinel / Splunk UBA | L |
| 28.8 | No CAPTCHA / bot protection on public endpoints | hCaptcha / Cloudflare Turnstile | S |
| 28.9 | No CSRF + CSP + HSTS verification per release | OWASP ASVS | S |
| 28.10 | No secret-rotation automation | HashiCorp Vault / AWS Secrets Mgr | M |
| 28.11 | No vulnerability scanning in CI (Snyk, Trivy) | Snyk / GitHub Advanced Security | S |
| 28.12 | No pen-test cadence and remediation tracker | HackerOne / Bugcrowd | M |
| 28.13 | No customer-managed encryption keys (BYOK) | AWS KMS BYOK / Salesforce Shield | L |
| 28.14 | No 4-eyes / 2-person integrity on sensitive admin actions | Oracle Fusion Privileged Actions | M |
| 28.15 | No security audit dashboard for tenant admin | Salesforce Health Check / Okta Reports | M |
| 28.16 | No data classification engine driving downstream policies | OneTrust / BigID | L |

---

## REFERENCED ENGINES & FILES

- `prisma\schema.prisma` (376 models)
- `src\lib\auto-journal.ts` — أساس كل القيود
- `src\lib\wms-engine.ts` — WMS (يحتاج توسعة كبيرة)
- `src\lib\bank-recon-engine.ts`
- `src\lib\dunning-engine.ts`
- `src\lib\open-items.ts`
- `src\lib\three-way-match.ts`
- `src\lib\fx-revaluation.ts`
- `src\lib\consolidation-engine.ts`
- `src\lib\lease-accounting-engine.ts`
- `src\lib\saudi-eos-engine.ts`
- `src\lib\gosi-engine.ts`
- `src\lib\wps-generator.ts`
- `src\lib\saudi-gov\mudad.ts` (stub — يحتاج توسعة)
- `src\lib\zatca.ts`, `src\lib\zatca-signer.ts`, `src\lib\zatca-fatoora.ts`
- `src\lib\mrp-engine.ts`, `src\lib\mps-engine.ts`, `src\lib\bom-engine.ts`
- `src\lib\subcontracting-engine.ts`
- `src\lib\standard-cost-engine.ts`
- `src\lib\ifrs-engines.ts`
- `src\lib\saga-orchestrator.ts`, `src\lib\event-bus.ts`
- `src\lib\zakat-engine.ts` (تم بناؤه في الجلسة الحالية)

---

**Bottom line:** 403 فجوة موثقة. الأنظمة العالمية الرائدة لها مسار واضح للتنفيذ. أهم 10 فجوات (Critical Path) قابلة للإنجاز خلال 6 أشهر بالعمل الموجه.
