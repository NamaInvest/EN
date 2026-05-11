# 📦 كل الـ 47 برومنت — جاهزة للنسخ مباشرة

> **استخدم:** انسخ البرومنت كاملاً في جلسة Claude Code جديدة. كل برومنت مكتفٍ ذاتياً.
> **قبل النسخ:** ضع في البداية برومنت Master من `GLOBAL_GAP_AUDIT_2026.md` القسم 4.

---

## القسم F: المالية المحاسبية

### F-01 — Deferred Tax (IAS 12)
👉 موجود كاملاً في `GLOBAL_GAP_AUDIT_2026.md` § 4

### F-02 — Impairment IAS 36
👉 موجود كاملاً في `GLOBAL_GAP_AUDIT_2026.md` § 4

### F-03 — Transfer Pricing (OECD BEPS Action 13)
```
ابنِ Transfer Pricing Engine متوافق مع OECD BEPS Action 13.

Schema (أضف للـ prisma/schema.prisma):
model TPMethod { id Int @id @default(autoincrement()) code String @unique // CUP, RPM, CPM, TNMM, PROFIT_SPLIT name String description String @db.Text whenToUse String @db.Text }

model TPTransaction {
  id Int @id @default(autoincrement())
  tenantId Int
  fromCompanyId Int
  toCompanyId Int
  transactionType String  // SALE_GOODS, SALE_SERVICES, ROYALTY, INTEREST, COST_SHARE, IP_LICENSE
  description String
  amount Decimal @db.Decimal(18,2)
  currency String
  taxYear Int
  methodId Int
  arm sLengthRange Json   // {min, median, max}
  actualPrice Decimal @db.Decimal(18,4)
  withinRange Boolean
  benchmarkStudyId Int?
  documentationStatus String @default("PENDING") // PENDING, IN_PROGRESS, COMPLETE
}

model TPBenchmarkStudy {
  id Int @id @default(autoincrement())
  studyName String
  industryCode String
  comparables Json  // [{name, country, ratio, source}]
  resultStatistic String  // INTERQUARTILE_RANGE
  studyDate DateTime
  validUntil DateTime
  preparedBy String
  fileUrl String?
}

model TPDocumentation {
  id Int @id @default(autoincrement())
  taxYear Int
  documentType String  // MASTER_FILE, LOCAL_FILE, CBCR
  companyId Int
  generatedAt DateTime
  generatedBy Int
  fileUrl String
  contentJson Json  // structured data
}

Engine: src/lib/transfer-pricing-engine.ts
- benchmark(method, transaction): retrieves comparable studies, computes ARM's length range
- testTransaction(tpTransactionId): tests if actualPrice within range
- generateMasterFile(taxYear): OECD Master File template (group overview, intangibles, financial activities)
- generateLocalFile(companyId, taxYear): Local entity, controlled transactions, financial info
- generateCbCR(parentCompanyId, taxYear): Country-by-Country Report (15+ jurisdictions)

APIs:
- POST /api/finance/transfer-pricing/transactions (CRUD)
- POST /api/finance/transfer-pricing/test/[txId]
- POST /api/finance/transfer-pricing/documents/generate { type, year }
- GET /api/finance/transfer-pricing/cbcr/[taxYear]/export (XML for ZATCA/OECD)

UI: /finance/transfer-pricing
- Transactions list (with within-range badge)
- Studies library
- Documentation generator (Master/Local/CbCR)

Tests: 4 scenarios (within range, above, below, no comparables).
استشر saudi-compliance subagent — Saudi adopted BEPS via Royal Decree.
```

### F-04 — Intercompany Netting
👉 موجود كاملاً في `GLOBAL_GAP_AUDIT_2026.md` § 4

### F-05 — Contract Assets/Liabilities (IFRS 15 deep)
```
وسّع revenue-recognition-engine.ts ليشمل Contract Assets & Contract Liabilities (IFRS 15.105-109).

Schema additions:
model ContractAsset { id Int @id @default(autoincrement()) contractId Int amount Decimal @db.Decimal(18,2) recognizedAt DateTime expectedBillingDate DateTime status String @default("ACTIVE") }
model ContractLiability { id Int @id @default(autoincrement()) contractId Int amount Decimal @db.Decimal(18,2) advanceReceivedAt DateTime expectedRecognitionDate DateTime status String @default("ACTIVE") }

Engine:
- evaluateContract(contractId): for each invoice/payment vs performance obligation completion:
  if recognized > billed → ContractAsset (unbilled receivable)
  if billed > recognized → ContractLiability (deferred revenue)
- waterfall(): track movement period over period
- discloseContractBalances(): IFRS 15.116-118 disclosure auto-generator

APIs: /api/finance/contracts/[id]/balances, /api/finance/contracts/waterfall?period=
UI: /accounting/revenue-recognition → tab "Contract Balances"
JE: DR Contract Asset / CR Revenue (recognition without billing) | DR Cash / CR Contract Liability (advance)
```

### F-06 — Multi-GAAP Layered Posting
```
عزّز multi-book-engine.ts ليدعم Multi-GAAP posting كامل (Tax + Book + IFRS + Local + Stat).

Schema:
model GaapLayer { id Int @id @default(autoincrement()) code String @unique // TAX, BOOK, IFRS, US_GAAP, LOCAL name String parentLayerId Int? // derivation chain isPrimary Boolean @default(false) }
model GaapAdjustment { id Int @id @default(autoincrement()) sourceJeId Int targetLayerId Int adjustmentType String  // ELIMINATE, ADD, MODIFY description String journalLines Json }

Engine: 
- postToLayers(je, layers[]): primary post, then propagate via mapping rules
- generateGaapAdjustments(period, fromLayer, toLayer): identifies differences (e.g., Book→IFRS = capitalize leases)
- runReconciliation(period, layers): RU file (Reconciliation Workspaces)

APIs: /api/accounting/multi-book/layers, /api/accounting/multi-book/adjustments, /api/accounting/multi-book/reconcile

Layered Reports:
- Trial balance per layer
- Side-by-side comparison
- Differences explanation
```

### F-07 — Statement of Changes in Equity (auto)
```
ابنِ Statement of Changes in Equity auto-generator (IAS 1.106).
استخدم equity-statement-engine.ts الموجود — وسّعه.

Inputs: fiscal period, layer (Book/IFRS)
Outputs:
  Columns: Share Capital | Share Premium | Retained Earnings | Revaluation Reserve | Hedging Reserve | FCTR | OCI | Total | NCI
  Rows: Opening Balance | Total Comprehensive Income | Dividends | Share Issuance | Share Buyback | Other Movements | Closing Balance

APIs: GET /api/reports/equity-statement?period=2026-Q1
UI: /reports/financial-statements → tab "Equity Statement"
Export: PDF + Excel + iXBRL (for ZATCA submission)
```

### F-08 — Cash Flow Statement Direct Method
```
أكمل cashflow-engine.ts ليدعم Direct Method (IAS 7) كاملاً.

Direct Method requires actual cash receipts/payments by category:
- Cash receipts from customers (CR Cash, DR AR — extract from bank txns + cash receipts)
- Cash payments to suppliers (DR AP, CR Cash — extract from bank txns + cash payments)
- Cash payments to employees (payroll runs paid)
- Cash payments for taxes
- Cash payments for interest
- ...

Engine:
- classify(cashTransaction): map to OPERATING/INVESTING/FINANCING + sub-category
- aggregate(period): roll up to direct-method statement
- reconcileToIndirect(): also provide indirect method as supplementary

APIs: GET /api/reports/cashflow-direct?period=
```

### F-09 — Notes to FS Auto-Generator
```
وسّع notes-to-fs-engine.ts ليولّد كل الـ 30+ نوتة (IFRS Disclosure Initiative).

كل نوتة لها:
- template (Word + PDF)
- data fetcher (which entities/aggregations)
- cross-references (to other notes)

Notes covered (auto):
1. Basis of preparation
2. Significant accounting policies
3. Critical estimates & judgments
4. Revenue (IFRS 15 breakdown)
5. Cost of sales
6. Operating expenses
7. Finance costs
8. Income tax expense + Effective Tax Rate Reconciliation (IAS 12)
9. Earnings per share
10. Property, plant & equipment
11. Intangible assets + Goodwill
12. Investment property
13. Right-of-use assets (IFRS 16 lessee)
14. Inventory
15. Trade receivables + ECL (IFRS 9)
16. Cash & equivalents
17. Borrowings
18. Deferred tax
19. Provisions
20. Trade payables
21. Lease liabilities
22. Share capital
23. Reserves
24. Related party transactions
25. Commitments & contingencies
26. Financial risk management
27. Segment reporting (IFRS 8)
28. Subsequent events
29. Approval of financial statements
30. Going concern

UI: /reports/notes → wizard (select period, layer) → generates DOCX + PDF.
```

### F-10 — Segment Reporting (IFRS 8)
```
ابنِ Segment Reporting Engine.

Schema:
model OperatingSegment { id Int @id @default(autoincrement()) code String @unique name String managerId Int aggregation String  // GEOGRAPHIC, PRODUCT, CUSTOMER_TYPE isReportable Boolean }
model SegmentResult { id Int @id @default(autoincrement()) segmentId Int period String revenue Decimal opex Decimal segmentResult Decimal assets Decimal liabilities Decimal capex Decimal depreciation Decimal }

Engine:
- aggregateSegmentResults(period): roll up JournalLines by segment dimension
- testReportability(segment): 10% threshold tests (revenue, result, assets) per IFRS 8.13
- reconcileToFS(): segments sum should reconcile to total entity (unallocated bucket)

APIs: /api/reports/segments?period=
```

### F-11 — CO-PA Profitability (Multi-Dim)
```
ابنِ Multi-Dimensional Profitability Analysis (SAP CO-PA style).

Dimensions: Customer, Product, Region, Channel, Salesperson, Period.
Measures: Revenue, COGS, Gross Margin, Direct Costs, Allocated Costs, Operating Margin, EBITDA, EBIT.

Schema (extend copa-engine.ts):
model CopaCharacteristic { ... already exists, populate }
model CopaValueField { ... already exists, populate }
model CopaDocument { ... already exists - this is the cube fact table }
model CopaAllocation { id Int @id sourceCC Int targetDim String allocationKey String  // headcount, revenue, sqm percent Decimal @db.Decimal(7,4) }

Engine:
- captureFromTransaction(jeLine): writes to CopaDocument when JE involves rev/cost
- allocateOverhead(period): spreads cost centers to characteristics via allocationKey
- slice(dimensions, measures, filters): returns aggregated cube data

UI: /finance/copa
- Pivot Table (drag-drop dimensions)
- Drill-down to JE lines
- Save as report
```

### F-12 — ARO (Asset Retirement Obligation)
```
ابنِ ARO Engine (IAS 37 + ASC 410).

Schema:
model AssetRetirementObligation { id Int @id @default(autoincrement()) assetId Int  // FixedAsset estimatedSettlementCost Decimal @db.Decimal(18,2) estimatedSettlementDate DateTime discountRate Decimal @db.Decimal(7,4) presentValue Decimal @db.Decimal(18,2) accretionAccount String // 5970 Accretion Expense liabilityAccount String // 2280 ARO Liability assetCapitalizationAccount String  // adds to FA cost recordedAt DateTime status String @default("ACTIVE")  // ACTIVE, SETTLED, REMEASURED }
model AROAccretion { id Int @id @default(autoincrement()) aroId Int period DateTime accretionAmount Decimal @db.Decimal(18,2) journalEntryId Int? }

Engine:
- record(asset, settlementCost, settlementDate, rate): PV calc, capitalizes to asset, books liability
- accrue(period): each period unwinds PV (interest method) → accretion expense
- remeasure(aroId, newEstimate): recalculates PV, adjusts asset + liability
- settle(aroId, actualCost): gain/loss vs liability

JEs:
- Recognition: DR FA, CR ARO Liability (PV)
- Accretion: DR Accretion Expense, CR ARO Liability (each period)
- Settlement: DR ARO Liability, CR Cash; gain/loss to P&L

APIs: /api/finance/aro/* (CRUD + accrue + settle)
UI: /finance/aro
```

---

## القسم O: التشغيل (O2C + P2P)

### O-01 — Cash Application AI Engine
```
ابنِ Cash Application Engine متعدد المراحل (6 مستويات).

Schema:
model RemittanceAdvice { id Int @id source String  // EMAIL_PARSE, MANUAL, EDI, BANK_FEED rawText String @db.Text parsedJson Json receivedAt DateTime processedAt DateTime? }

Engine: src/lib/cash-application-engine.ts (وسّع الموجود)
6 مستويات matching:
1. EXACT_REFERENCE: bank txn reference exactly matches invoice number → 100% confidence
2. EXACT_AMOUNT: amount matches single open invoice for customer → 95%
3. EXACT_AMOUNT_MULTI: amount = sum of N open invoices (knapsack solver) → 85%
4. PARTIAL: amount < single invoice (record as partial payment) → 70%
5. REMITTANCE_EMAIL: parse customer remittance email (Gemini) to extract invoice list → 90%
6. AI_FALLBACK: Gemini decision with full context → 50-80% (requires review)
7. SUSPENSE: post to suspense account, queue for review

Output: CashApplication record with confidence + matched invoices + JE.

Email Parser:
- IMAP listener on payments@{tenant}.namasoft.com
- Gemini prompts: "Extract invoice numbers and amounts paid from this email"
- Match parsed list to bank deposit

APIs:
- POST /api/sales/cash-application/auto-match { bankTxnId }
- POST /api/sales/cash-application/manual-match { bankTxnId, invoiceIds[] }
- POST /api/sales/cash-application/bulk-run { fromDate, toDate }

UI: /sales/cash-application
- Bank deposits left, open invoices right
- Auto-match button (runs all 6 levels)
- Confidence color (green/yellow/red)
- One-click confirm, edit, reject
```

### O-02 — Dunning Multi-Level
```
وسّع dunning-engine.ts ليدعم Multi-Level escalation كاملاً.

Schema (DunningLevel & DunningPolicy موجودة — املأها):
DunningLevel:
  level 1: 7 days overdue, friendly reminder email
  level 2: 14 days, firm email + SMS
  level 3: 30 days, formal letter (PDF), credit hold flag
  level 4: 45 days, WhatsApp escalation + call task
  level 5: 60 days, legal letter, assign to collection agency

Engine:
- runDunningCycle(date): for each open invoice past due:
  - determine current level
  - if cooldown passed → escalate to next level
  - generate communication (email/SMS/WhatsApp/PDF)
  - create CRM activity for follow-up
  - update customer credit status

- promiseToPayHandler: when customer commits to date, pause dunning until that date
- collectionAgencyAssign: at level 5, hand off to external agency (webhook)

APIs:
- POST /api/finance/dunning/run-cycle (cron)
- POST /api/finance/dunning/promises (customer commitment)
- GET /api/finance/dunning/letters?level=

UI: /accounting/dunning
- Calendar view of due actions
- Letter templates editor (i18n)
- Promise tracker
- Agency assignment workflow
```

### O-03 — Customer Credit Hold + Auto-Release
```
ابنِ Credit Hold/Release automation.

Trigger conditions for HOLD:
- Customer aging > X days (configurable)
- Open balance > credit limit
- Dunning level >= 3
- Manual hold (user-initiated)

When held:
- Block new SO creation for customer (UI + API guard)
- Send notification to sales rep
- Log to CustomerCreditAction

Release conditions:
- Payment received that brings balance under threshold
- Dunning level reset
- Manager manual release (with reason + approval)

Engine: src/lib/credit-check-engine.ts (موجود — وسّعه)
APIs: 
- POST /api/credit-check/hold { customerId, reason }
- POST /api/credit-check/release { customerId, reason, approver }
- GET /api/credit-check/status/[customerId]

UI integration:
- /sales/orders create: warning banner if customer on hold
- /customers/[id]: credit panel with history
- /accounting/credit-monitor: dashboard
```

### O-04 — Bad Debt Provision Workflow
```
أتمت bad debt provision عبر integrate ECL + Aging + Approval.

Workflow:
1. Cron monthly: ecl-engine.ts calculates provisions per customer
2. Compare to current GL provision balance
3. Generate adjustment JE (top-up or release)
4. Route through Approval Engine (CFO sign-off)
5. Post on approval
6. Document in Note 15 (Trade Receivables)

Specific provision (per-customer):
- Triggered when customer specific event (bankruptcy, default)
- Manual entry with justification
- Approval required regardless of amount

Write-off process:
- After 180+ days uncollected + collection agency exhausted
- DR Provision, CR AR (eliminate)
- Audit trail mandatory

APIs:
- POST /api/finance/bad-debt/specific-provision
- POST /api/finance/bad-debt/write-off
- GET /api/finance/bad-debt/movement?period=
```

### O-05 — Vendor Onboarding (KYC/AML)
```
ابنِ Vendor Onboarding workflow.

Stages:
1. Initial application (vendor self-registers OR procurement initiates)
2. KYC documents upload (CR, VAT cert, bank cert, owner ID)
3. KYB check (Saudi vendor: extract CR data via Wathq API; international: D&B/RefinitivWorldCheck)
4. AML screening (sanctions lists: UN, OFAC, EU, SAMA)
5. Risk scoring (auto + manual override)
6. Bank account validation (IBAN check, micro-deposit verification)
7. Approval routing (Procurement → Finance → CFO if high-risk)
8. Vendor master activation

Schema:
model VendorOnboarding { id Int @id @default(autoincrement()) vendorId Int? // becomes set on approval applicationData Json kycDocuments Json riskScore Decimal @db.Decimal(5,2) sanctionsMatch Boolean amlChecks Json status String currentStage String approvalRequestId Int? createdAt DateTime updatedAt DateTime }

Integrations:
- Wathq API (Saudi CR data)
- ZATCA VAT lookup
- Refinitiv World-Check / Dow Jones (sanctions)
- Bank IBAN validation (Mod 97)

UI: /procurement/onboarding/inbox + /procurement/onboarding/new
```

### O-06 — Supplier Self-Service Portal
```
ابنِ Vendor Self-Service Portal (مماثل لـ Customer Portal C-06).

Auth: VendorPortalUser (موجود في schema — أكمله)

Features:
1. /vendor-portal/dashboard
   - Open POs, ASN status, Invoice status, Payment status
2. /vendor-portal/pos
   - View POs assigned to me, acknowledge, propose changes
3. /vendor-portal/asn (Advance Shipment Notice)
   - Submit ASN for upcoming delivery → integrates with GRN module
4. /vendor-portal/invoices
   - Submit invoice (with PO reference) → goes to AP Automation queue
   - View payment status, due date
5. /vendor-portal/payments
   - Payment history, expected payments, remittance advice download
6. /vendor-portal/catalog
   - Submit/update product catalog (with images, specs, prices)
7. /vendor-portal/rfq
   - View open RFQs, submit quotes
8. /vendor-portal/contracts
   - View active contracts, blanket POs, schedules
9. /vendor-portal/performance
   - Vendor scorecard: on-time delivery %, quality rejects, response time
10. /vendor-portal/support

Token-based auth (VendorPortalToken)
Strict isolation: vendor sees only their data
```

### O-07 — RFx Reverse Auction
```
ابنِ Reverse Auction module (SAP Ariba-style).

Schema:
model ReverseAuction { id Int @id @default(autoincrement()) rfqId Int title String startTime DateTime endTime DateTime status String @default("DRAFT") // DRAFT, OPEN, CLOSED currentLowBid Decimal? winnerId Int? autoExtendMinutes Int @default(5) bidDecrementMin Decimal? @db.Decimal(18,2) }
model AuctionBid { id Int @id @default(autoincrement()) auctionId Int vendorId Int amount Decimal @db.Decimal(18,2) submittedAt DateTime @default(now()) isWinner Boolean @default(false) }

Engine: src/lib/reverse-auction-engine.ts
- Real-time bid acceptance (validate decrement, current rank)
- Anti-sniping: auto-extend if bid received in last 5 min
- Notify all participants on each new bid (anonymized)
- Award on close

Realtime: use Server-Sent Events (SSE) for bid updates

UI: /procurement/auctions
- Bidder side (in Vendor Portal): live bid form + countdown + rank
- Buyer side: spectator dashboard, manual award button
```

### O-08 — Spend Analytics
```
ابنِ Spend Analytics cube + categorization.

Schema:
model SpendCategory { id Int @id @default(autoincrement()) code String @unique parentId Int? name String costCenterMappingDefault Int? approvalThreshold Decimal? }
model SpendClassification { id Int @id @default(autoincrement()) transactionType String  // PURCHASE_INVOICE, EXPENSE_REPORT, CARD_TRANSACTION transactionId Int categoryId Int classifiedBy String  // AI, USER, RULE confidence Decimal? }

Engine:
- autoClassify(transaction): Gemini prompt: "Given description + vendor + amount, classify into category"
- cubeBuild(period): aggregate by category × vendor × cost center × period
- savingsOpportunities(): identify maverick spending, off-contract vendors, price variances

UI: /finance/spend-analytics
- Treemap (category drill-down)
- Top vendors
- Maverick spend report (PO bypassed)
- Off-contract spend report
- Vendor consolidation opportunities
```

### O-09 — AP Automation (OCR)
👉 موجود كاملاً في `GLOBAL_GAP_AUDIT_2026.md` § 4

### O-10 — PO Schedule Agreements (Blanket POs)
```
ابنِ Blanket PO / Schedule Agreement (SAP MM-style).

Schema:
model BlanketPO { id Int @id @default(autoincrement()) poNumber String @unique vendorId Int validFrom DateTime validTo DateTime totalValue Decimal @db.Decimal(18,2) consumedValue Decimal @db.Decimal(18,2) remainingValue Decimal @db.Decimal(18,2) status String @default("ACTIVE") }
model BlanketPORelease { id Int @id @default(autoincrement()) blanketPoId Int releaseNumber String releaseDate DateTime quantity Decimal amount Decimal status String  // RELEASED, RECEIVED }

Engine: validate releases don't exceed total, track consumption
UI: /purchases/blanket-pos
Use case: Office supplies, MRO consumables, annual service contracts
```

### O-11 — Drop-Ship + 3PL Workflow
```
ابنِ Drop-Ship workflow.

Flow:
1. Customer places SO with drop-ship flag
2. Auto-create PO to vendor with ship-to = customer address
3. Vendor confirms shipment + provides tracking
4. GRN logical (no physical receipt) + auto-bill customer
5. AP processes vendor invoice

Schema:
model DropShipLink { soId Int poId Int trackingNumber String? carrierId Int? }

Engine: src/lib/dropship-engine.ts
- On SO creation with dropship flag: auto-PO
- On vendor ship confirmation: create logical GRN + create SI
- Margin protection: validate sell price > vendor cost + minimum margin
```

### O-12 — RMA Multi-Step
```
أكمل rma-engine.ts ليدعم workflow كامل.

States: REQUESTED → AUTHORIZED → IN_TRANSIT → RECEIVED → INSPECTED → CREDIT_ISSUED | REJECTED
Each state has actions:
  REQUESTED: customer creates via portal
  AUTHORIZED: CS rep approves, issues RMA number + return label
  RECEIVED: warehouse logs receipt
  INSPECTED: QC checks condition, decides resaleable/scrap/return-to-vendor
  CREDIT_ISSUED: credit memo + refund OR replacement SO

Integrations: shipping carriers for return labels (Saudi Post, Aramex, SMSA)
```

---

## القسم I: المخزون / المستودعات / التصنيع

### I-01 — Wave Picking + Cluster Picking
```
ابنِ Wave Picking + Cluster Picking in WMS.

Schema:
model PickWave { id Int @id @default(autoincrement()) waveNumber String startedAt DateTime? completedAt DateTime? totalOrders Int totalLines Int status String @default("PLANNED") }
model WaveOrder { waveId Int orderId Int orderType String  // SO, TRANSFER, RETURN priority Int sequence Int }

Engine: src/lib/wave-picking-engine.ts
- planWave(criteria): groups orders by:
  - same zone (minimize travel)
  - same carrier cutoff (ship-by-time)
  - same customer (consolidate)
- optimizePickPath: TSP-lite (nearest neighbor / 2-opt) on warehouse layout
- assignToPickers: balance workload
- generatePickLists: per picker, per zone, sorted by location

Cluster Picking:
- One picker, multiple orders in same tour, split at packing station

UI: /inventory/wms/waves
- Wave planner (filter orders, group, optimize)
- Picker dashboard (mobile-first)
- Real-time progress
```

### I-02 — Slotting Optimization
```
ابنِ Slotting Optimization Engine.

Inputs: pick velocity (last 90 days), product size/weight, picker ergonomics, current bin map.

Algorithm:
- A-class (top 20% velocity) → golden zone (waist height, front of aisle)
- B-class → middle zone
- C-class → upper shelves / back
- Heavy items → ground level
- Pair complementary items (often picked together) adjacent

Output: Move tickets (current bin → suggested bin)

Schedule: Run quarterly, validate during slow periods.

Engine: src/lib/slotting-engine.ts
UI: /inventory/wms/slotting
```

### I-03 — Cross-Docking
```
ابنِ Cross-Docking workflow.

Use case: Inbound shipment → directly to outbound dock (no storage).

Trigger: GRN created AND open SO exists for same items.

Flow:
1. PO arrives, GRN inspector flags as cross-dock candidate
2. System reserves quantity to matching SO
3. Putaway suggestion = "DOCK_OUT_LANE_3" instead of regular bin
4. Pick/pack happens at staging area
5. Outbound ASN to customer

Schema: extend GRN with crossDockSoId
Engine: src/lib/cross-dock-engine.ts
```

### I-04 — Voice Picking / Pick-by-Light
```
ابنِ Voice Picking interface (for mobile + headset).

Integration: Web Speech API (initial) + native iOS/Android speech in mobile app.

Flow:
- Picker logs in, scans wave
- Headset: "Go to aisle 5, bin 23, pick 4 units"
- Picker: "Confirm" (audio) or scan barcode
- Headset: "Next: aisle 5, bin 27..."

Pick-by-Light: integrate with PTL devices via REST API (KBS, Lightning Pick)

Engine: src/lib/voice-picking-engine.ts
- Text-to-speech (TTS) for instructions
- Speech-to-text (STT) for confirmations
- Fallback: scan barcode or tap screen

UI: /inventory/wms/voice-picker (web prototype)
Mobile: dedicated PWA + native app screens
```

### I-05 — MES Shopfloor Realtime
```
ابنِ Manufacturing Execution System (MES) realtime.

Schema:
model ShopfloorStation { id Int @id @default(autoincrement()) workCenterId Int code String operatorId Int? currentWoId Int? status String  // IDLE, RUNNING, DOWN, SETUP, BREAK lastHeartbeat DateTime }
model ShopfloorEvent { id Int @id @default(autoincrement()) stationId Int eventType String  // START, STOP, PAUSE, RESUME, COUNT, REJECT, BREAKDOWN quantity Int? rejectReason String? occurredAt DateTime }

Engine: src/lib/mes-engine.ts (وسّع الموجود)
- Realtime tracking via WebSocket
- Operator login (RFID/barcode)
- Quantity counter + reject reasons
- Andon system (alerts)
- Auto-update WO progress
- Trigger preventive maintenance on hours run

Integration: IoT sensors (PLC via MQTT/OPC-UA → REST gateway → MES API)

UI: /manufacturing/shopfloor
- Big screen for floor: real-time station status
- Operator HMI: large buttons, scan inputs
- Supervisor dashboard: KPIs, exceptions
```

### I-06 — APS Constraint-Based Scheduling
```
ابنِ Advanced Planning & Scheduling (Asprova/Quintiq-style).

Inputs:
- Demand: SO + MPS
- Resources: Work Centers + Calendars + Operator availability
- Constraints: setup times, maintenance windows, material availability, due dates

Algorithm: 
- Backward scheduling from due date
- Forward from earliest start
- Constraint propagation (CP)
- What-if simulation

Schema:
model ScheduleRun { id Int @id @default(autoincrement()) runDate DateTime horizonDays Int objectiveScore Decimal status String }
model ScheduledOperation { runId Int operationId Int resourceId Int startTime DateTime endTime DateTime priority Int }

Engine: src/lib/aps-engine.ts (موجود stub — أكمله)
- Use jsLPSolver / glpk.js for LP/MIP problems
- Heuristics: dispatch rules (SPT, EDD, Critical Ratio)

UI: /manufacturing/aps
- Gantt chart (interactive)
- What-if: drag operation → see impact
- Optimization runs history
```

### I-07 — SPC (Statistical Process Control)
```
ابنِ SPC charts + analysis.

Charts:
- X-bar R chart (continuous data, subgroups)
- X-bar S chart (large subgroups)
- I-MR chart (individual data)
- p chart (proportion defective)
- np chart (number defective)
- c chart (count defects)
- u chart (defects per unit)

Capability indices: Cp, Cpk, Pp, Ppk

Schema:
model SpcChart { id Int @id @default(autoincrement()) processCode String chartType String parameterMeasured String unitOfMeasure String UCL Decimal LCL Decimal target Decimal subgroupSize Int }
model SpcMeasurement { chartId Int subgroupNumber Int measurements Json mean Decimal range Decimal stdDev Decimal occurredAt DateTime outOfControl Boolean violationType String? }

Rules: Western Electric (8 rules) — detect non-random patterns
APIs: /api/quality/spc/charts, /api/quality/spc/measurements
UI: /quality/spc — chart viewer + violation alerts
```

### I-08 — OEE Realtime (Machine Telemetry)
```
ابنِ OEE realtime monitoring.

OEE = Availability × Performance × Quality

Inputs (from MES + IoT):
- Planned production time
- Run time
- Stop time (planned vs unplanned)
- Total count
- Reject count
- Ideal cycle time

Schema (extend MachineTelemetry):
model OEERecord { id Int @id @default(autoincrement()) machineId Int shiftId Int? availability Decimal performance Decimal quality Decimal oee Decimal totalCount Int rejectCount Int plannedTime Int actualRunTime Int recordedAt DateTime }

Engine: realtime calc on machine event
WebSocket push to dashboard
UI: /manufacturing/oee
- Big screen: current OEE per machine
- Trends (24h, 7d, 30d)
- Pareto of stop reasons
```

### I-09 — Engineering Change Order (ECO)
```
ابنِ ECO workflow.

Schema:
model EngineeringChangeOrder { id Int @id @default(autoincrement()) ecoNumber String reason String  // IMPROVEMENT, COST_REDUCTION, QUALITY_ISSUE, REGULATORY originator Int affectedProducts Json affectedBoms Json proposedChange String @db.Text effectiveDate DateTime status String  // DRAFT, REVIEW, APPROVED, IMPLEMENTED, CLOSED approvalRequestId Int? oldBomVersionId Int newBomVersionId Int? impactAssessment Json  // {cost, inventory, customer, regulatory} }

Workflow:
DRAFT → ECO review board → APPROVED → BOM new version → Inventory impact (use old material first?) → effective date reached → ACTIVE

Engine: src/lib/eco-engine.ts
UI: /manufacturing/eco
```

### I-10 — BOM Where-Used + Compare
```
وسّع bom-engine.ts: where-used + compare two BOMs.

whereUsed(materialId): find all BOMs that reference this material (recursive — find sub-assemblies)
compareBoms(bom1Id, bom2Id): diff: added/removed/changed materials, qty deltas, cost impact

UI: /manufacturing/boms/[id]
- Tab "Where Used"
- Tab "Compare with..." → side-by-side diff
```

### I-11 — Demand Sensing (ML)
```
ابنِ Demand Sensing (short-term forecasting with ML).

Inputs: 
- Historical sales (3 years daily)
- POS realtime
- Promotion calendar
- Weather data (for retail)
- External signals (Google Trends, social media)

Algorithm: 
- Phase 1: SARIMA / Prophet for baseline
- Phase 2: LSTM / Transformer for non-linear patterns
- Phase 3: Hybrid + Reinforcement Learning for promo lift

Schema:
model DemandForecast { id Int @id @default(autoincrement()) productId Int locationId Int? forecastDate DateTime horizonDays Int forecastedDemand Decimal confidenceLow Decimal confidenceHigh Decimal modelVersion String modelAccuracyMAPE Decimal createdAt DateTime }

Engine: src/lib/demand-sensing-engine.ts
- Train via Python (Vertex AI / SageMaker) → save model
- Predict via API (TF Serving / TorchServe)
- Auto-update reorder points

UI: /ai/demand-forecast → existing page, deepen
```

### I-12 — S&OP (Sales & Operations Planning)
```
ابنِ S&OP module.

Stages (monthly cycle):
1. Product Review (NPD, EOL, lifecycle stage)
2. Demand Review (forecast consensus across Sales/Marketing/Finance)
3. Supply Review (capacity, materials, labor)
4. Pre-S&OP (gap analysis, scenarios)
5. Executive S&OP (CFO decisions on trade-offs)

Schema:
model SopCycle { id Int @id @default(autoincrement()) cycleMonth DateTime status String  // STAGE1..5, FINALIZED stageOutputs Json executiveDecisions Json }
model SopForecastConsensus { cycleId Int productFamily String salesForecast Decimal marketingAdjustment Decimal financeTarget Decimal consensus Decimal }

UI: /enterprise/sop
- Cycle dashboard
- Each stage has dedicated workspace
- Approval checkpoints
- Output: aligned demand plan → MRP
```

### I-13 — Equipment Calibration Mgmt
```
ابنِ Calibration Management (SAP QM-style).

Schema:
model CalibratableEquipment { id Int @id @default(autoincrement()) equipmentNumber String description String calibrationFrequencyDays Int lastCalibrated DateTime nextCalibrationDue DateTime tolerance Decimal certificateUrl String? }
model CalibrationRecord { id Int @id @default(autoincrement()) equipmentId Int calibrationDate DateTime performedBy Int result String  // PASS, FAIL, ADJUSTED beforeReading Decimal? afterReading Decimal? certificateUrl String? nextDueDate DateTime }

Engine: 
- Cron: alert 30/15/7 days before due
- Auto-block equipment if overdue (configurable)
- Pull data from calibration vendor APIs

UI: /quality/calibration
```

---

## القسم H: HR / Payroll

### H-01 — Succession Planning
```
ابنِ Succession Planning module.

Schema:
model SuccessionPlan { id Int @id @default(autoincrement()) positionId Int  // critical position incumbentId Int? riskOfLoss String  // LOW, MEDIUM, HIGH retirementDate DateTime? }
model SuccessionCandidate { planId Int employeeId Int readiness String  // READY_NOW, READY_1_2_YEARS, READY_3_5_YEARS gaps Json  // {skill: needed level vs current} developmentPlan Json @db.Json }
model NineBoxRating { employeeId Int reviewCycle String performance Int  // 1-3 potential Int  // 1-3 box Int  // 1-9 quadrant }

Engine: assess readiness, recommend development, alert HR on key vacancies
UI: /hr/succession + 9-box grid visual
```

### H-02 — Career Pathing + Competency Matrix
```
ابنِ Competency Framework + Career Path.

Schema:
model Competency { id Int @id @default(autoincrement()) code String category String  // TECHNICAL, LEADERSHIP, FUNCTIONAL name String levels Json  // [{level:1, descriptor:"..."}, {level:5, ...}] }
model JobCompetencyRequirement { jobId Int competencyId Int requiredLevel Int }
model EmployeeCompetency { employeeId Int competencyId Int currentLevel Int assessedAt DateTime assessedBy Int evidence String? }
model CareerPath { fromJobId Int toJobId Int requiredYears Int requiredCompetencies Json }

UI: /hr/competencies + /hr/career-paths
```

### H-03 — Compensation Reviews
```
ابنِ Compensation Review Cycles.

Schema:
model CompReviewCycle { id Int @id @default(autoincrement()) name String fiscalYear Int budgetPool Decimal status String }
model CompReviewAllocation { cycleId Int managerId Int budgetAllocated Decimal budgetUsed Decimal }
model EmployeeCompProposal { cycleId Int employeeId Int currentSalary Decimal proposedIncrease Decimal proposedNewSalary Decimal justification String? approverId Int approvalStatus String }

UI: /hr/compensation-review → manager allocation tool
```

### H-04 — Performance OKRs / Goals
```
ابنِ OKR module.

Schema:
model Objective { id Int @id ownerEmpId Int title String description String period String  // 2026-Q1 parentObjectiveId Int? alignmentType String  // PARENT, DEPENDENCY level String  // COMPANY, DEPARTMENT, TEAM, INDIVIDUAL }
model KeyResult { objectiveId Int title String targetValue Decimal currentValue Decimal unitOfMeasure String confidence Int  // 1-5 lastUpdate DateTime updateNotes String? }
model CheckIn { objectiveId Int checkInDate DateTime userId Int notes String confidence Int }

UI: /hr/okrs — tree view + check-in cadence
```

### H-05 — LMS Complete
```
ابنِ Full LMS (Learning Management System) — Moodle/SCORM-style.

Schema:
model LmsCourse (موجود — وسّع) + LmsModule + LmsLesson + LmsQuiz + LmsQuestion + LmsAttempt + LmsCertificate

Features:
- SCORM 1.2 & 2004 player
- xAPI (Tin Can) statement tracking
- Quiz engine (multi-choice, T/F, drag-drop, essay)
- Assignment submissions
- Discussion forums per course
- Certificates with QR verification
- Compliance training tracking (mandatory courses)
- Learning paths

APIs: /api/lms/courses, /api/lms/enroll, /api/lms/scorm/[id]
UI: /lms/* (learner portal + admin portal)
Integrations: LinkedIn Learning, Coursera API for content
```

### H-06 — Recruitment / ATS
```
ابنِ Full ATS (Applicant Tracking System).

Schema:
model JobRequisition (link to JobPosting موجود)
model Candidate { id Int @id name String email String phone String resumeUrl String linkedinUrl String? source String  // CAREER_PAGE, REFERRAL, LINKEDIN, INDEED }
model Application { candidateId Int requisitionId Int stage String  // APPLIED, SCREENED, INTERVIEWED, OFFERED, HIRED, REJECTED screenScore Decimal? rejectionReason String? }
model Interview { applicationId Int round Int interviewerIds Json scheduledAt DateTime feedback Json overall String  // STRONG_YES, YES, MAYBE, NO, STRONG_NO }
model Offer { applicationId Int proposedSalary Decimal startDate DateTime status String  // SENT, ACCEPTED, DECLINED, EXPIRED }

Career site (public): /careers
- Job listings, filters
- Apply form (with resume upload)
- AI resume parser → auto-fill

AI screening: Gemini scores resume vs JD, ranks candidates

UI: /hr/recruitment — Kanban pipeline (drag candidates between stages)
```

### H-07 — Time & Attendance (Biometric + Geo)
```
ابنِ T&A with biometric face + geofencing.

Schema:
model AttendanceDevice { id Int @id @default(autoincrement()) deviceCode String location String type String  // BIOMETRIC, MOBILE_APP, KIOSK, RFID lastSync DateTime? }
model BiometricTemplate { employeeId Int templateData String @db.Text  // encrypted modality String  // FACE, FINGERPRINT }
model AttendancePunch { employeeId Int deviceId Int? punchType String  // IN, OUT, BREAK_IN, BREAK_OUT punchTime DateTime geoLatitude Decimal? geoLongitude Decimal? geoAccuracy Decimal? selfieUrl String? matchConfidence Decimal? }

Engine:
- Face recognition via Gemini Vision OR self-hosted (face-api.js)
- Geofence validation: only allow punch from approved locations
- Anomaly detection: punches outside pattern → flag

Mobile: capture selfie + GPS → API
Integration: ZKTeco / Hikvision devices via push API

UI: /hr/attendance (already exists — enrich)
```

### H-08 — Multi-Country Payroll
```
ابنِ Payroll engines for: Egypt, UAE, Qatar, Bahrain, Kuwait, Oman.

Each country: own engine in src/lib/payroll/<country>.ts implementing IPayrollEngine interface.

Egypt:
- Tax brackets (progressive)
- Social insurance: ~14% employee + ~26% employer
- EOSB at termination

UAE:
- No income tax
- DEWS (Dubai Employee Workplace Savings) optional
- End of Service Gratuity (21 days/year first 5, 30 days/year after)

Qatar:
- No income tax
- WPS through Qatar Central Bank

Bahrain:
- 1% employee + 12% employer (SIO)
- Unemployment 1% each
- EOS gratuity

Kuwait:
- 7.5% employee + 11.5% employer (PIFSS — Kuwaitis only)
- Indemnity for expats

Oman:
- PASI 7% + 10.5% (Omanis)
- EOSB for expats

Common: leave laws, public holidays, currency, wage protection (where applicable).

Localization: i18n strings + country-specific reports.
```

### H-09 — Employee Self-Service Mobile
👉 جزء من P-04 Mobile App

### H-10 — Health & Safety / Incident Mgmt
```
ابنِ EHS (Environment, Health & Safety) module.

Schema:
model SafetyIncident { id Int @id @default(autoincrement()) incidentNumber String reportedBy Int occurredAt DateTime location String severity String  // NEAR_MISS, FIRST_AID, RECORDABLE, LOST_TIME, FATALITY description String @db.Text injuredEmployees Json witnesses Json rootCause String? correctiveActions Json status String  // REPORTED, INVESTIGATING, RESOLVED }
model SafetyInspection { id Int @id @default(autoincrement()) scheduledDate DateTime location String inspectorId Int findings Json nonConformities Int correctiveActions Json }
model SafetyTraining { employeeId Int courseCode String completedAt DateTime expiresAt DateTime certificateUrl String }

KPIs: TRIR (Total Recordable Incident Rate), LTIR (Lost Time), Near Miss frequency

UI: /hr/safety — incident reporter (mobile-friendly), inspection scheduler, training tracker
```

---

## القسم C: CRM / Marketing

### C-01 — Marketing Automation
```
ابنِ Marketing Automation (Drip / Trigger campaigns).

Schema:
model AudienceSegment { id Int @id @default(autoincrement()) name String filterJson Json  // Mongo-like query estimatedSize Int lastRefreshed DateTime }
model Campaign (موجود — وسّع)
model CampaignJourney { id Int @id @default(autoincrement()) campaignId Int journeyJson Json  // flowchart of steps: send-email, wait-7d, branch (opened?), send-sms, etc. }
model CampaignExecution { campaignId Int subscriberId Int currentStep String stepHistory Json status String }

Triggers:
- Time-based (drip every X days)
- Behavior (clicked link, opened email, visited page)
- Lifecycle (signup anniversary, birthday)
- Transactional (abandoned cart, post-purchase upsell)

Channels: Email (SendGrid), SMS (Twilio/Unifonic), WhatsApp Business, Push, In-App

Engine: src/lib/marketing-automation-engine.ts
- Cron: every 5 min check pending executions
- Step processor: send → wait → branch

UI: /crm/campaigns/builder → visual journey designer (drag-drop)
A/B testing: test subjects, content, send times
Analytics: open rate, CTR, conversion, revenue attribution
```

### C-02 — Customer Health Score (Churn ML)
```
ابنِ Customer Health Score + Churn Prediction.

Schema:
model CustomerHealth { id Int @id @default(autoincrement()) customerId Int score Decimal  // 0-100 churnRisk String  // LOW, MEDIUM, HIGH factors Json  // {recencyScore, freqScore, valueScore, sentimentScore, supportScore} computedAt DateTime }

ML model: 
- Features: RFM (Recency, Frequency, Monetary), AVG order size, payment delays, support tickets, NPS, social mentions
- Target: churned within next 90 days (boolean)
- Algorithm: Gradient Boosting (XGBoost)
- Retrain monthly

UI: /crm/customer360 → health gauge + factor breakdown
Alerts: when score drops below threshold → assign to CS rep
```

### C-03 — Account Hierarchy + Teams
```
ابنِ Account Hierarchy + Account Teams.

Schema:
model Customer (already has parent) — وسّع: hierarchyLevel, fullPath
model AccountTeam { customerId Int userId Int role String  // ACCOUNT_OWNER, AE, CS, SE, AE_OVERLAY commissionShare Decimal }

Engine:
- Roll-up reports across hierarchy (consolidated AR, sales, etc.)
- Permission propagation: child account access if parent access (configurable)

UI: /customers/[id] → tree view + team panel
```

### C-04 — Territory & Quota Mgmt
```
ابنِ Territory & Quota.

Schema:
model SalesTerritory { id Int @id @default(autoincrement()) code String name String managerId Int regions Json  // {countries, cities, zipcodes} industries Json customerSegments Json }
model TerritoryAssignment { territoryId Int customerId Int validFrom DateTime validTo DateTime? }
model SalesQuota { userId Int territoryId Int? period String quotaAmount Decimal actualAmount Decimal attainmentPercent Decimal }

Engine: auto-assign new customers to territory based on rules
UI: /sales/territories — map view (Leaflet)
```

### C-05 — Sales Forecasting Pipeline + ML
```
ابنِ Sales Forecasting.

Two methods:
1. Pipeline-based: sum(Opportunity.amount × Stage.probability)
2. ML-based: time series + opportunity features

Schema:
model ForecastCommit { userId Int period String commitAmount Decimal bestCaseAmount Decimal pipelineAmount Decimal mlForecast Decimal? actualAmount Decimal? submittedAt DateTime }

UI: /crm/forecasting
- Rep view: submit forecast
- Manager view: aggregate + override
- Roll-up to leadership
```

### C-06 — Customer Portal
👉 موجود كاملاً في `GLOBAL_GAP_AUDIT_2026.md` § 4

### C-07 — Help Desk (ITSM)
```
ابنِ Help Desk module (Freshdesk/Zendesk-style).

Schema (وسّع SupportTicket الموجود):
SupportTicket: + priority + slaPolicyId + dueAt + resolvedAt + firstResponseAt
model SlaPolicy: + responseTime + resolutionTime per priority
model TicketEscalation { ticketId Int level Int escalatedTo Int reason String escalatedAt DateTime }
model SatisfactionSurvey { ticketId Int score Int  // 1-5 comment String? submittedAt DateTime }

Engine: src/lib/help-desk-engine.ts
- SLA timer: starts on ticket creation, pauses during "waiting for customer"
- Auto-escalate when timer crosses threshold (50% warning, 100% breach)
- Auto-assign via round-robin or skill-based routing
- AI suggested replies (Gemini RAG on KB)

Channels: 
- Email-to-ticket (IMAP)
- Portal form (customer)
- WhatsApp (chat → ticket)
- Phone (CTI integration optional)
- Chat widget

UI: /crm/tickets → enhanced inbox
- /support/help-desk → public portal
```

### C-08 — NPS / CSAT Surveys
```
ابنِ Survey engine (NPS + CSAT + custom).

Schema:
model SurveyTemplate { id Int @id @default(autoincrement()) name String type String  // NPS, CSAT, CES, CUSTOM questions Json  // [{type, text, options}] }
model SurveyInvite { templateId Int customerId Int contactEmail String sentAt DateTime respondedAt DateTime? linkToken String }
model SurveyResponse { inviteId Int answers Json npsScore Int? csatScore Int? }

Triggers:
- Post-purchase (X days after invoice)
- Post-ticket-resolution
- Quarterly (relationship NPS)

Analytics: NPS = %Promoters - %Detractors; trend over time; cohorts

UI: /crm/surveys (admin) + public response page
```

### C-09 — Knowledge Base with RAG
```
ابنِ KB with embedding-based search + RAG for AI suggestions.

Schema (وسّع KBArticle + KBCategory):
+ embeddings field (vector — pgvector)
+ status (DRAFT, PUBLISHED, ARCHIVED)
+ helpfulYes/No counts
+ relatedArticles[]

Engine:
- onSave: generate embedding via Gemini text-embedding-004
- search(query): cosine similarity in pgvector
- ragAnswer(query): retrieve top-K → Gemini synthesizes answer

UI: /knowledge/articles — search-as-you-type + AI answer panel
Public portal: /support/kb
```

### C-10 — Omnichannel Communication
```
ابنِ Omnichannel Inbox.

Schema:
model Conversation { id Int @id @default(autoincrement()) channelType String  // EMAIL, WHATSAPP, SMS, CHAT, PHONE, FACEBOOK customerId Int? contactEmail String? contactPhone String? assignedTo Int? status String  // OPEN, ASSIGNED, WAITING, CLOSED tags Json messages ConversationMessage[] }
model ConversationMessage { conversationId Int direction String  // INBOUND, OUTBOUND content String @db.Text mediaUrls Json sentAt DateTime sentBy Int? channelMessageId String }

Integrations:
- Email (IMAP/SMTP)
- WhatsApp Business API (via Meta or Twilio)
- SMS (Twilio/Unifonic for KSA)
- Facebook Messenger
- Web chat widget (embed JS)
- Instagram DM
- Telegram

Engine: unified routing, response templates, AI auto-reply (Gemini)

UI: /crm/omnichannel — Gmail-like unified inbox
```

---

## القسم P: Platform / Cross-Cutting

### P-01 — BPMN 2.0 Designer
👉 موجود كاملاً في `GLOBAL_GAP_AUDIT_2026.md` § 4

### P-02 — No-Code Custom Page / Form Builder
```
ابنِ Visual Form / Page Builder.

Inputs: drag-drop components, field bindings to schema, conditional logic.

Schema:
model CustomPage { id Int @id @default(autoincrement()) slug String @unique title String layout Json  // [{type:row, columns:[...]}] permissions Json publishedAt DateTime? }
model CustomForm { id Int @id @default(autoincrement()) name String entityBinding String  // which Prisma model this form creates fields Json  // [{name, type, label, validation, defaultValue, visibleIf, requiredIf}] submitAction Json  // {type:CREATE_RECORD|API_CALL|WORKFLOW_TRIGGER, target} }
model CustomFormSubmission { formId Int data Json submittedBy Int submittedAt DateTime status String }

Engine:
- form-renderer.ts: takes JSON schema → React Hook Form + Zod runtime
- conditional logic engine
- access control per field

UI: /settings/page-builder + /settings/form-builder
Use case: Custom CRM forms, ad-hoc data collection, surveys
```

### P-03 — Custom Report Builder UI
```
ابنِ Drag-Drop Report Builder.

Inputs: 
- Data source (entity + relations)
- Filters
- Group by
- Aggregations (sum, count, avg, min, max)
- Display: table, chart, pivot, KPI
- Schedule + delivery (email PDF/Excel)

Schema: CustomReport (موجود — أكمله)

Engine: src/lib/custom-report-engine.ts (موجود — أكمله)
- buildQuery(reportDef): generates Prisma query
- execute(query, params): returns data
- render(data, displayConfig): returns chart-ready format

UI: /reports/builder — Tableau-like designer
- Side panel: fields drag from
- Center: canvas (table/chart preview)
- Properties: filters, sorting, formatting

Schedule UI: send daily/weekly/monthly to email list.
```

### P-04 — Native Mobile App
👉 موجود كاملاً في `GLOBAL_GAP_AUDIT_2026.md` § 4

### P-05 — Offline-First Sync
👉 موجود كاملاً في `GLOBAL_GAP_AUDIT_2026.md` § 4 (مع P-04)

### P-06 — SAML 2.0 / OIDC SSO
```
ابنِ SSO via SAML 2.0 + OIDC (extend Clerk).

Schema:
model SsoProvider { id Int @id @default(autoincrement()) tenantId Int type String  // SAML, OIDC name String  // "Azure AD", "Okta", "Google Workspace" metadataUrl String? entityId String? certificate String? @db.Text issuerUrl String? clientId String? clientSecret String? attributeMapping Json  // {email:"emailAddress", firstName:"givenName"} isActive Boolean defaultRoleId Int? }
model SsoLoginAttempt { providerId Int email String success Boolean errorMessage String? loggedAt DateTime ipAddress String? }

Implementation:
- Use passport-saml + openid-client
- Clerk has SSO support — leverage if pricing allows
- JIT (Just-In-Time) user provisioning: create user on first SAML login

UI: /settings/sso → provider config + test login button
```

### P-07 — Field-Level Encryption
```
ابنِ Field-Level Encryption for sensitive fields.

Sensitive fields (mark in schema):
- Employee.salary
- Employee.iban
- Customer.nationalId
- PatientRecord.* (healthcare)
- Tax fields (TIN, VAT cert details)

Implementation:
- Prisma middleware: encrypt on write, decrypt on read (for authorized roles only)
- Key management: AWS KMS / GCP KMS / Azure Key Vault
- DEK (Data Encryption Key) per tenant, encrypted with master KEK
- Rotation: monthly KEK, weekly DEK

Schema:
model EncryptedField { entityType String entityId Int fieldName String ciphertext String @db.Text dekId String iv String authTag String }

Engine: src/lib/field-encryption.ts
- AES-256-GCM
- Audit access (who decrypted what when)
```

### P-08 — Data Masking
```
ابنِ Dynamic Data Masking.

Use case: lower-environment users see masked PII; production roles see real data.

Implementation:
- Prisma middleware checks user role
- If unauthorized for unmasked: apply mask
  - Email: a***@gmail.com
  - Phone: ***-****-1234
  - National ID: ******1234
  - IBAN: SA**...**1234

Configuration:
- Per-field masking rule
- Per-role bypass
- Environment-level (always mask in DEV/STAGING)

UI: /admin/security/data-masking (config)
```

### P-09 — SOC 2 Readiness
```
ابنِ SOC 2 Type II readiness program.

5 Trust Service Criteria:
1. Security
2. Availability
3. Processing Integrity
4. Confidentiality
5. Privacy

Controls (~100 controls):
- Access management
- Change management
- Risk assessment
- Vendor management
- Incident response
- Business continuity
- Data backup
- Encryption
- Logging & monitoring
- Personnel security
- Logical access
- Physical access (data centers)

Implementation:
- Map each control to existing or new feature
- Evidence collection automation (logs, screenshots, configs)
- Use Vanta / Drata / Tugboat Logic for evidence platform
- Annual audit + 12-month observation period

Outputs:
- SOC 2 Type II report (annual)
- Customer-shareable bridge letter
- Trust center page
```

### P-10 — Webhook Manager + Replay
```
ابنِ Webhook Manager.

Schema:
WebhookSubscription (موجود)
WebhookDeliveryLog (موجود)
+ retry logic: 1m → 5m → 30m → 2h → 24h (5 attempts)
+ HMAC signature for verification
+ Replay UI: re-send failed deliveries

UI: /settings/webhooks
- Subscription list (events + URL + active/paused)
- Delivery log (filter by status)
- Replay button
- Stats: success rate per webhook
```

### P-11 — OpenAPI Catalog + Postman
```
ابنِ OpenAPI specs for all 718 endpoints.

Tooling:
- Use next-openapi-gen / zodios
- Annotate each route handler with JSDoc + Zod schemas
- Generate openapi.yaml at build time
- Serve at /api/openapi
- Render via Swagger UI at /api/docs

Postman: auto-import from openapi.yaml
Outputs: Postman collection + client SDKs (TS, Python, PHP)
```

### P-12 — iPaaS Connectors
```
ابنِ pre-built connectors:
- Salla (Saudi e-commerce)
- Zid (Saudi e-commerce)
- Shopify
- WooCommerce
- Stripe / Tap / Moyasar (KSA)
- DoorDash / HungerStation / Jahez (food delivery)
- Aramex / SMSA / DHL (shipping)
- HRDF (Saudi training reimbursement)

Each connector:
- OAuth setup
- Sync schedule (products, orders, customers, payments)
- Mapping config (field translation)
- Error handling + retry
- Sync history view

UI: /settings/integrations → marketplace style
```

### P-13 — eSignature Native
👉 موجود كاملاً في `GLOBAL_GAP_AUDIT_2026.md` § 4

### P-14 — DMS Deep (Full-Text + ACL)
```
أكمل DMS (Document Management System).

Features:
1. Folder hierarchy (unlimited depth)
2. Permissions (read/write/delete per user/role per folder)
3. Document versioning (V1, V2, V3 with diff)
4. Full-text search (PostgreSQL tsvector + pgvector for semantic)
5. OCR pipeline (auto-OCR on upload via Gemini Vision)
6. Document expiry alerts (e.g., contracts, licenses)
7. Audit log (who viewed/downloaded what)
8. Watermarking (per-viewer watermark on download)
9. Storage: S3/R2 with signed URLs
10. Mobile scan + upload

Schema: DmsFolder + DmsDocument + DmsVersion + DmsPermission + DmsView + DmsTag

Engine: src/lib/dms-engine.ts (موجود — أكمله)
APIs: /api/dms/* (folders, docs, search, versions)
UI: /dms — file explorer + preview pane
```

### P-15 — Multi-Country Localization
```
أتمت Multi-Country support.

Levels:
1. Currency (already supported)
2. Language (i18n — already supported)
3. Date/Number formats (Intl APIs)
4. Tax engines (VAT/Sales Tax per country)
5. Payroll engines (per country — H-08)
6. Chart of Accounts (template per country)
7. Statutory reports (e.g., Egypt eta tax invoicing, UAE FTA)
8. Public holidays (per country)
9. Address formats (city/state/postal vs governorate)
10. Phone validation (per country)

Schema:
model Country { code String  // ISO 3166-1 alpha-2 name Json  // {ar, en} currency String fiscalYearStart String  // MM-DD vatRate Decimal taxAuthorityName String holidaysJson Json addressFormat String phoneRegex String publicHolidays PublicHoliday[] }

Engine: src/lib/localization-engine.ts
- formatCurrency(amount, countryCode)
- formatDate(date, countryCode, locale)
- getCoA(countryCode): returns template
- getTaxRules(countryCode)

Setup wizard per tenant: select country → applies template.
```

### P-16 — AI Copilot RAG Everywhere
```
ابنِ AI Copilot in every page.

Architecture:
- Sidebar drawer (toggle via ⌘K or floating button)
- Context-aware: knows current page + selected record
- RAG over: 
  - KB articles (KBArticle embeddings)
  - User manual
  - Schema documentation
  - Recent transactions (for context)

Engine: src/lib/copilot-engine.ts
- buildContext(currentPage, selectedRecord, recentActions)
- Gemini chat with system prompt + retrieved chunks
- Tool calling: can execute approved actions ("create a journal entry for...", "show me top 10 customers")

Safety:
- Action confirmation required for mutations
- Permission check before execution
- Audit log of every AI-suggested + executed action

Tools available to Copilot:
- search_records(entityType, query)
- create_record(entityType, data) — requires user confirmation
- generate_report(reportType, params)
- explain_record(entityType, id)
- suggest_journal_entry(description, amount)
- post_journal_entry(jeId) — high friction confirm

UI: floating button bottom-right + ⌘K
```

---

## ملاحظات ختامية

### كيفية الاستخدام:
1. اختر الفجوة المطلوبة من القائمة
2. انسخ البرومنت كاملاً
3. افتح جلسة Claude Code جديدة
4. الصق Master Prompt (من القسم 4 في `GLOBAL_GAP_AUDIT_2026.md`)
5. الصق برومنت الفجوة
6. اتبع المنهجية: Schema → Engine → API → Tests → UI

### مدة كل فجوة (تقديري):
- 🔴 حرج: 2-4 أسابيع
- 🟠 عالٍ: 3-5 أسابيع
- 🟡 متوسط: 1-3 أسابيع
- 🔵 منخفض: 4-6 أسابيع (لـ ML/IoT)

**إجمالي الجهد للفجوات الـ 47:** ~150-200 sprint-week × developer = ~30-40 شهر-مطور تراكمياً. مع فريق 3 مطورين متوازي = **10-13 شهر للوصول لمستوى عالمي**.

**نهاية ملف البرومنتات.**
