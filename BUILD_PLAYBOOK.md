# 🛠️ Namasoft ERP — Build Playbook

> Self-contained build packages for the 15 highest-value gaps in Namasoft ERP.
> Generated 2026-05-06. References real models in `prisma/schema.prisma` and engines in `src/lib/`.

---

## Gap 1: Universal Journal Dimensions on JE Lines

### الهدف
كل سطر قيد محاسبي يحمل dimensions كاملة (CC/PC/Project/Segment/Product) كنمط SAP S/4HANA Universal Journal.

### Schema Changes (Prisma)
```prisma
model JournalLine {
  // ... existing fields
  profitCenterId  Int?    @map("profit_center_id")
  projectId       Int?    @map("project_id")
  segmentId       Int?    @map("segment_id")
  productId       Int?    @map("product_id")
  customerId      Int?    @map("customer_id")
  vendorId        Int?    @map("vendor_id")
  employeeId      Int?    @map("employee_id")
  assetId         Int?    @map("asset_id")
  bookId          Int?    @map("book_id")
  fxRate          Decimal? @db.Decimal(18,8)
  quantity        Decimal? @db.Decimal(20,4)
  uom             String?

  profitCenter    ProfitCenter? @relation(fields:[profitCenterId], references:[id])
  project         Project?      @relation(fields:[projectId], references:[id])
  segment         Segment?      @relation(fields:[segmentId], references:[id])

  @@index([profitCenterId,accountId])
  @@index([projectId,accountId])
  @@index([bookId, entryId])
}

model ProfitCenter { id Int @id @default(autoincrement()) code String @unique name String parentId Int? active Boolean @default(true) }
model Segment      { id Int @id @default(autoincrement()) code String @unique name String type String /* GEO|PRODUCT_LINE|CHANNEL */ }
```

### API Endpoints
- `GET    /api/accounting/profit-centers`
- `POST   /api/accounting/profit-centers`
- `GET    /api/accounting/segments`
- `POST   /api/accounting/journal-entries` (extend to accept dimensions per line)
- `GET    /api/accounting/reports/by-dimension?dim=profitCenter&from=&to=`

### Engine File
- File: `src/lib/auto-journal.ts` (extend — DO NOT replace)
- New helpers: `inheritDimensions(sourceDoc)`, `validateDimensionRules(line)`, `buildDimensionalJE()`

### UI Pages
- `src/app/(dashboard)/accounting/profit-centers/page.tsx`
- `src/app/(dashboard)/accounting/segments/page.tsx`
- Extend journal-entries page — add dimension columns
- Components: `DimensionPicker.tsx`, `DimensionalGLReport.tsx`

### Data Flow
```
Source Doc (Invoice/PO/GRN) → auto-journal.ts
    ↓ inheritDimensions(): copies CC/PC/Project from header+lines
    ↓ validateDimensionRules(): checks mandatory dims per account
Prisma transaction: JournalEntry + JournalLine[] (with all dim FKs)
    ↓ DimensionalGL view aggregates by any combo
Audit log + return JE id
```

### Estimated Effort: L

### Ready Prompt
```
Build Universal Journal dimensions per CLAUDE.md sections 3.1, 3.4. Steps:
1) Add ProfitCenter, Segment models + extend JournalLine in prisma/schema.prisma with profitCenterId, projectId, segmentId, productId, customerId, vendorId, employeeId, assetId, bookId, fxRate, quantity, uom (all nullable). Run migration: 'add_universal_journal_dimensions'.
2) Extend src/lib/auto-journal.ts: inheritDimensions(sourceDoc) and validateDimensionRules(accountId, dims) using Account.requiredDimensions JSON column.
3) Update every caller of postJournalEntry() to pass dims. Audit src/app/api/sales/route.ts, purchases, grn, payments.
4) Build CRUD pages for profit-centers and segments. Add DimensionPicker reusable component.
5) Add report endpoint /api/reports/dimensional-gl with multi-dim group-by.
6) Tests: extend src/lib/auto-journal.test.ts with 4 cases (each dim type).
```

---

## Gap 2: Profitability Analysis (CO-PA)

### الهدف
حساب الربحية بأبعاد متعددة (Customer × Product × Channel × Region) باستخدام allocations.

### Schema Changes
```prisma
model CopaCharacteristic { id Int @id @default(autoincrement()) code String @unique name String type String }
model CopaValueField    { id Int @id @default(autoincrement()) code String @unique name String aggregation String glAccountId Int? }
model CopaDocument {
  id Int @id @default(autoincrement())
  postingDate DateTime
  sourceType String
  sourceId   Int
  customerId Int? productId Int? channelCode String? regionCode String?
  profitCenterId Int? segmentId Int?
  revenue Decimal @default(0) @db.Decimal(20,4)
  cogs    Decimal @default(0) @db.Decimal(20,4)
  discount Decimal @default(0) @db.Decimal(20,4)
  freight Decimal @default(0) @db.Decimal(20,4)
  contributionMargin Decimal @default(0) @db.Decimal(20,4)
  @@index([postingDate,customerId])
  @@index([postingDate,productId])
}
model CopaAllocationRule { id Int @id @default(autoincrement()) name String basis String srcAccount String dstChars Json active Boolean @default(true) }
```

### API Endpoints
- `POST /api/copa/post`
- `POST /api/copa/run-allocation`
- `GET  /api/copa/report?dims=customer,product&from=&to=`
- `GET  /api/copa/characteristics`
- `POST /api/copa/value-fields`

### Engine File
- File: `src/lib/copa-engine.ts` (new)
- Methods: `derivCharacteristics(invoice)`, `postCopaDocument(je)`, `runAllocation(ruleId, period)`, `slice(dimsArr, filters)`

### UI Pages
- `src/app/(dashboard)/finance/copa/page.tsx` (multi-dim pivot)
- `src/app/(dashboard)/finance/copa/rules/page.tsx`
- Components: `CopaPivot.tsx`, `WaterfallCM.tsx`

### Data Flow
```
SalesInvoice posted → auto-journal.ts hook
   ↓ copa-engine.postCopaDocument() derives chars from invoice + customer + product
   ↓ writes CopaDocument row (mirror of JE with dims)
Allocation cron (monthly) → copa-engine.runAllocation()
   ↓ spreads overhead via basis (REVENUE/HEADCOUNT)
Report query → /api/copa/report → grouped aggregates
```

### Estimated Effort: L

### Ready Prompt
```
Build CO-PA module per Gap 2. Steps:
1) Add CopaCharacteristic, CopaValueField, CopaDocument, CopaAllocationRule models. Migration 'add_copa'.
2) Create src/lib/copa-engine.ts with postCopaDocument, runAllocation, slice. Hook into src/lib/auto-journal.ts after SALES_INVOICE/SALES_RETURN/COGS posting.
3) Build endpoints under src/app/api/copa/.
4) UI page with pivot using existing patterns (no new chart libs — use Recharts already in repo).
5) Seed 5 default characteristics (CUSTOMER, PRODUCT, CHANNEL, REGION, SEGMENT) and 4 value fields.
6) Tests: copa-engine.test.ts validates derivation + allocation math.
```

---

## Gap 3: Real-Time Credit Check on Sales Orders

### الهدف
رفض/تجميد أي SalesOrder يتجاوز حد الائتمان ديناميكياً قبل الترحيل.

### Schema Changes
```prisma
model Customer {
  // ... existing
  creditLimit       Decimal  @default(0) @db.Decimal(20,4)
  creditCurrency    String   @default("SAR")
  creditHoldEnabled Boolean  @default(true)
  creditExposure    Decimal  @default(0) @db.Decimal(20,4)
  paymentTermsDays  Int      @default(0)
  riskCategory      String   @default("MEDIUM")
}
model SalesOrder {
  // ... existing
  creditStatus      String   @default("PENDING")
  creditCheckedAt   DateTime?
  creditOverrideBy  Int?
  creditOverrideReason String?
}
model CreditCheckLog { id Int @id @default(autoincrement()) customerId Int orderId Int? exposure Decimal @db.Decimal(20,4) limit Decimal @db.Decimal(20,4) decision String reason String? checkedAt DateTime @default(now()) checkedBy Int? }
```

### API Endpoints
- `POST /api/sales/orders/[id]/credit-check`
- `POST /api/sales/orders/[id]/credit-release`
- `GET  /api/customers/[id]/exposure`
- `GET  /api/credit/dashboard`
- `POST /api/credit/recompute-exposure`

### Engine File
- File: `src/lib/credit-check-engine.ts` (new)
- Uses existing `src/lib/open-items.ts`
- Methods: `computeExposure(customerId)`, `checkOrder(orderId)`, `releaseHold(orderId, userId)`, `nightlyRecompute()`

### UI Pages
- `src/app/(dashboard)/sales/credit/page.tsx`
- Modify `src/app/(dashboard)/sales-orders/page.tsx` — credit badge per order
- Components: `CreditBadge.tsx`, `ExposureDrillModal.tsx`, `OverrideDialog.tsx`

### Data Flow
```
SalesOrder create/update → POST /api/sales/orders/[id]/credit-check
   ↓ credit-check-engine.computeExposure(): sum OpenItem.balance + SO.openValue + DN.notInvoiced
   ↓ if exposure+orderTotal > customer.creditLimit → status=HOLD + log
   ↓ else PASSED
   ↓ HOLD → triggers approval-engine.ts (existing) for manager override
Audit: CreditCheckLog row + AuditLog
```

### Saudi Compliance Note
PDPL: customer credit data is "personal data" — restrict UI to roles with credit-view permission. Hash idNumber before logging.

### Estimated Effort: M

### Ready Prompt
```
Build real-time credit check per Gap 3. Steps:
1) Extend Customer + SalesOrder fields per schema. Add CreditCheckLog. Migration 'add_credit_check'.
2) Create src/lib/credit-check-engine.ts wired to src/lib/open-items.ts for AR balance.
3) Hook into src/app/api/sales/orders/route.ts POST/PUT — block if HOLD with 409.
4) Add override flow via existing src/lib/approval-engine.ts.
5) Nightly recompute exposure: add cron src/app/api/cron/credit-recompute/route.ts.
6) UI badge + dashboard. Tests: credit-check-engine.test.ts for 4 scenarios (under/over/blocked/override).
```

---

## Gap 4: AP OCR + Auto Three-Way Match

### الهدف
رفع PDF فاتورة مورد → OCR → مطابقة تلقائية مع PO + GRN ضمن tolerance.

### Schema Changes
```prisma
model ApOcrJob {
  id Int @id @default(autoincrement())
  fileUrl String
  uploadedBy Int
  status String @default("PENDING")
  extractedJson Json?
  vendorId Int?
  invoiceNumber String?
  invoiceDate DateTime?
  totalAmount Decimal? @db.Decimal(20,4)
  vatAmount Decimal? @db.Decimal(20,4)
  matchedPoId Int?
  matchedGrnId Int?
  threeWayMatchId Int?
  purchaseInvoiceId Int?
  confidence Decimal? @db.Decimal(5,4)
  reviewerId Int? reviewNotes String?
  createdAt DateTime @default(now())
  @@index([status, createdAt])
}
model ApOcrLineSuggestion { id Int @id @default(autoincrement()) jobId Int productId Int? description String quantity Decimal @db.Decimal(20,4) price Decimal @db.Decimal(20,4) matchedPoLineId Int? matchedGrnLineId Int? }
```

### API Endpoints
- `POST /api/ap/ocr/upload`
- `GET  /api/ap/ocr/[id]`
- `POST /api/ap/ocr/[id]/match`
- `POST /api/ap/ocr/[id]/post`
- `GET  /api/ap/ocr/queue?status=REVIEW`

### Engine File
- File: `src/lib/ap-ocr-engine.ts` (new)
- Uses existing Gemini integration + `src/lib/three-way-match.ts`
- Methods: `extractInvoice(fileBuffer)`, `findCandidatePO(extracted)`, `autoMatch(jobId)`, `promoteToInvoice(jobId)`

### UI Pages
- `src/app/(dashboard)/purchases/ocr-inbox/page.tsx`
- `src/app/(dashboard)/purchases/ocr-inbox/[id]/page.tsx` (PDF + extracted side-by-side)
- Components: `OcrUploader.tsx`, `MatchCandidates.tsx`, `LineMatchTable.tsx`

### Data Flow
```
User uploads PDF → /api/ap/ocr/upload
   ↓ stored to cloud-storage.ts; ApOcrJob row created status=EXTRACTING
   ↓ ap-ocr-engine.extractInvoice(): Gemini Vision → JSON
   ↓ findCandidatePO(): matches by vendor+amount+date window
   ↓ autoMatch() invokes three-way-match.ts existing logic
   ↓ if confidence>0.95 + within tolerance → auto-create PurchaseInvoice
   ↓ else status=REVIEW → human in inbox
Posted PurchaseInvoice → auto-journal.ts existing flow
```

### Estimated Effort: L

### Ready Prompt
```
Build AP OCR per Gap 4. Steps:
1) Add ApOcrJob, ApOcrLineSuggestion models. Migration 'add_ap_ocr'.
2) Create src/lib/ap-ocr-engine.ts. Reuse Gemini client from src/app/api/ai/* and existing src/lib/three-way-match.ts.
3) Endpoints under src/app/api/ap/ocr/. Use src/lib/cloud-storage.ts for PDF persistence.
4) Build inbox UI with PDF viewer.
5) Tests: ap-ocr-engine.test.ts mocking Gemini with 3 sample fixtures.
6) DO NOT modify three-way-match.ts internals.
```

---

## Gap 5: Driver-Based Budgeting + Rolling Forecast

### الهدف
موازنات تُحتسب من drivers (Headcount × AvgSalary, Units × Price) مع rolling forecast 18 شهر.

### Schema Changes
```prisma
model BudgetDriver {
  id Int @id @default(autoincrement())
  code String @unique
  name String
  unit String
  values Json
  source String?
}
model DriverBudgetLine {
  id Int @id @default(autoincrement())
  budgetId Int
  accountId Int
  formula String
  driverIds Int[]
  costCenterId Int? profitCenterId Int?
  amounts Json
  @@index([budgetId, accountId])
}
model RollingForecast {
  id Int @id @default(autoincrement())
  forecastDate DateTime
  horizonMonths Int @default(18)
  scenario String @default("BASE")
  status String @default("DRAFT")
  ownerUserId Int?
  createdAt DateTime @default(now())
}
model RollingForecastLine { id Int @id @default(autoincrement()) forecastId Int accountId Int month String amount Decimal @db.Decimal(20,4) }
```

### API Endpoints
- `POST /api/budgets/drivers`
- `POST /api/budgets/driver-lines/recalc`
- `POST /api/forecasts/rolling`
- `POST /api/forecasts/rolling/[id]/regenerate`
- `GET  /api/forecasts/variance?period=`

### Engine File
- File: `src/lib/driver-budget-engine.ts` (new)
- Methods: `evaluateFormula(formula, drivers, period)`, `recalculate(budgetId)`, `rollForward(forecastId)`, `varianceAgainstActual(period)`

### UI Pages
- `src/app/(dashboard)/finance/budgets/drivers/page.tsx`
- `src/app/(dashboard)/finance/budgets/[id]/builder/page.tsx`
- `src/app/(dashboard)/finance/forecasts/rolling/page.tsx`

### Data Flow
```
User defines drivers + formulas → POST /api/budgets/drivers
   ↓ driver-budget-engine.recalculate() evaluates per-month
Monthly cron → /api/forecasts/rolling/[id]/regenerate
   ↓ pulls actuals from JournalLine, drops oldest month, adds new month
Variance dashboard joins RollingForecastLine + actuals
```

### Estimated Effort: L

### Ready Prompt
```
Build driver-based budgets + rolling forecast per Gap 5. Steps:
1) Add BudgetDriver, DriverBudgetLine, RollingForecast, RollingForecastLine. Migration.
2) src/lib/driver-budget-engine.ts: safe formula eval (whitelist tokens — NO eval()). Integrate with src/lib/budget-control.ts encumbrance checks.
3) Endpoints + cron at src/app/api/cron/rolling-forecast/route.ts.
4) UI formula builder; reuse existing budget pages style.
5) Tests: formula edge cases (division-by-zero, missing driver, negative values).
```

---

## Gap 6: Fixed-Asset Componentization (IFRS) + Parallel Tax/Book Books

### الهدف
استهلاك مكونات الأصل المركّب بشكل منفصل + كتب موازية (IFRS / TAX / ZAKAT).

### Schema Changes
```prisma
model AssetBookDepreciation {
  id Int @id @default(autoincrement())
  assetId Int
  bookId Int
  method String
  usefulLifeMonths Int
  salvageValue Decimal @db.Decimal(20,4)
  startDate DateTime
  netBookValue Decimal @db.Decimal(20,4)
  accumulatedDepreciation Decimal @default(0) @db.Decimal(20,4)
  asset FixedAsset @relation(fields:[assetId], references:[id])
  book  AccountingBook @relation(fields:[bookId], references:[id])
  @@unique([assetId, bookId])
}
model AssetDepreciationLog {
  // ... existing
  bookId Int?
  @@index([bookId, period])
}
```

### API Endpoints
- `POST /api/fixed-assets/[id]/components`
- `POST /api/fixed-assets/[id]/books`
- `POST /api/fixed-assets/depreciation/run`
- `GET  /api/fixed-assets/[id]/comparison`
- `POST /api/fixed-assets/[id]/componentize`

### Engine File
- File: `src/lib/fixed-asset-engine.ts` (new)
- Wraps existing `src/lib/multi-book-engine.ts`
- Methods: `componentize(parentId, components[])`, `depreciatePerBook(assetId, period)`, `compareBooks(assetId)`, `disposalCascadeToComponents()`

### UI Pages
- `src/app/(dashboard)/fixed-assets/[id]/components/page.tsx`
- `src/app/(dashboard)/fixed-assets/[id]/books/page.tsx`
- Components: `ComponentTree.tsx`, `BookComparisonTable.tsx`

### Data Flow
```
Composite asset → componentize(): splits cost across components
Monthly cron → depreciatePerBook() iterates AssetBookDepreciation rows
   ↓ posts JE per book via auto-journal.ts (bookId on JournalLine — Gap 1)
   ↓ AssetDepreciationLog rows written per book
Dispose parent → cascade to components in same transaction
```

### Saudi Compliance Note
ZATCA/Zakat use TAX book; IFRS book for statutory reports. SOCPA aligned with IFRS.

### Estimated Effort: L

### Ready Prompt
```
Build component depreciation + parallel books per Gap 6. Steps:
1) Add AssetBookDepreciation. Extend AssetDepreciationLog with bookId. Migration.
2) src/lib/fixed-asset-engine.ts orchestrates src/lib/multi-book-engine.ts.
3) Endpoints under src/app/api/fixed-assets/.
4) Componentize UI: tree drag-drop + cost split validation (sum=parent).
5) Tests: 3 scenarios — componentize, parallel-book divergence, disposal cascade.
```

---

## Gap 7: Zakat 2.5% Engine (Saudi Mandatory)

### الهدف
محرك حساب الزكاة الشرعية 2.5% على الوعاء الزكوي وفق دليل ZATCA.

### Schema Changes
```prisma
model ZakatAssessment {
  id Int @id @default(autoincrement())
  fiscalYearId Int
  assessmentDate DateTime
  status String @default("DRAFT")
  hijriYear String?

  equity Decimal @db.Decimal(20,4)
  longTermLiabilities Decimal @db.Decimal(20,4)
  netProfit Decimal @db.Decimal(20,4)
  adjustments Decimal @default(0) @db.Decimal(20,4)
  fixedAssetsBookValue Decimal @db.Decimal(20,4)
  longTermInvestments Decimal @db.Decimal(20,4)

  zakatableBase Decimal @db.Decimal(20,4)
  zakatRate Decimal @default(0.025) @db.Decimal(5,4)
  zakatDue Decimal @db.Decimal(20,4)

  zatcaTransactionId String?
  filingReference String?
  attachments Json?
  fiscalYear FiscalYear @relation(fields:[fiscalYearId], references:[id])
}
model ZakatAdjustment { id Int @id @default(autoincrement()) assessmentId Int category String description String amount Decimal @db.Decimal(20,4) glAccountId Int? }
```

### API Endpoints
- `POST /api/zakat/assessments`
- `GET  /api/zakat/assessments/[id]`
- `POST /api/zakat/assessments/[id]/adjustments`
- `POST /api/zakat/assessments/[id]/file`
- `GET  /api/zakat/preview?fiscalYearId=`

### Engine File
- File: `src/lib/zakat-engine.ts` (new)
- Methods: `computeBase(fiscalYearId)`, `applyAdjustments(assessmentId)`, `generateForm(assessmentId)`, `fileToZatca(assessmentId)`, `convertHijri(date)` (use existing `src/lib/hijri.ts`)

### UI Pages
- `src/app/(dashboard)/zakat/page.tsx`
- `src/app/(dashboard)/zakat/[id]/page.tsx` (wizard with TB drilldown)

### Data Flow
```
End of fiscal year → POST /api/zakat/assessments
   ↓ zakat-engine.computeBase(): pulls Equity + LT Liabilities + Net Profit – LT Investments – Fixed Assets NBV
   ↓ apply ZakatAdjustment rows
   ↓ zakatDue = base × 0.025
   ↓ generateForm() → ZATCA Zakat XML/JSON
   ↓ fileToZatca() via existing src/lib/zatca.ts pattern
   ↓ on success → auto-journal.ts posts: Dr Zakat Expense / Cr Zakat Payable
```

### Saudi Compliance Note
- 2.5% only for Saudi/GCC owned portion; mixed companies → prorate by ownership %.
- Hijri year mandatory on filing.
- Settings: `zakat_payer_type` (PURE|MIXED), `zakat_certificate_no`.

### Estimated Effort: M

### Ready Prompt
```
Build Zakat engine per Gap 7 + CLAUDE.md section 9.4. Steps:
1) Add ZakatAssessment, ZakatAdjustment models. Migration 'add_zakat'.
2) src/lib/zakat-engine.ts with computeBase pulling from JournalLine grouped by Account.zakatCategory (add this enum field to Account model: NONE|EQUITY|LT_LIAB|LT_INV|FIXED_ASSET|NET_PROFIT|ADJ).
3) Endpoints under src/app/api/zakat/. Filing endpoint follows pattern of src/app/api/zatca/onboard/route.ts.
4) Wizard UI with TB drilldown.
5) Auto-journal hook on FILED status: Dr 5xxx Zakat Expense / Cr 2xxx Zakat Payable.
6) Tests: zakat-engine.test.ts — pure Saudi co, mixed ownership 60/40, with adjustments.
```

---

## Gap 8: Qiwa Integration + Saudization/Nitaqat

### الهدف
ربط Qiwa لجلب بيانات العمالة وحساب نسبة السعودة + تصنيف Nitaqat.

### Schema Changes
```prisma
model SaudizationSnapshot {
  id Int @id @default(autoincrement())
  snapshotDate DateTime
  totalEmployees Int
  saudiEmployees Int
  saudiPct Decimal @db.Decimal(5,4)
  activityCode String
  sizeBracket String
  nitaqatBand String
  nitaqatThresholds Json
  qiwaSyncId String?
  source String
  createdAt DateTime @default(now())
}
model QiwaContract {
  id Int @id @default(autoincrement())
  employeeId Int
  contractNo String @unique
  contractType String
  qiwaStatus String
  startDate DateTime
  endDate DateTime?
  position String?
  syncedAt DateTime?
  employee Employee @relation(fields:[employeeId], references:[id])
}
model Employee { /* ... */ qiwaWageProtectionId String? mudadStatus String? }
```

### API Endpoints
- `POST /api/saudi/qiwa/sync`
- `POST /api/saudi/qiwa/contracts/[employeeId]`
- `GET  /api/saudi/saudization/snapshot`
- `POST /api/saudi/saudization/recompute`
- `GET  /api/saudi/nitaqat/projection`

### Engine File
- File: `src/lib/qiwa-engine.ts` (new)
- Pattern of existing `src/lib/gosi-engine.ts`
- Methods: `syncWorkforce()`, `computeSaudizationPct()`, `classifyNitaqat(pct, sizeBracket)`, `projectImpact(hires)`, `pushContract(employeeId)`

### UI Pages
- `src/app/(dashboard)/hr/saudization/page.tsx`
- `src/app/(dashboard)/hr/qiwa/contracts/page.tsx`
- Components: `NitaqatGauge.tsx`, `SaudizationTrend.tsx`

### Data Flow
```
Daily cron → qiwa-engine.syncWorkforce()
   ↓ writes QiwaContract rows + updates Employee.qiwaWageProtectionId
Monthly cron → computeSaudizationPct() = saudis/total
   ↓ classifyNitaqat() against thresholds Json
   ↓ writes SaudizationSnapshot
   ↓ if band drops to YELLOW/RED → SystemAlert + email HR manager
```

### Saudi Compliance Note
- Nitaqat thresholds depend on activity_code + size_bracket — load from settings.
- Qiwa OAuth via `GovApiCredentials` (provider=QIWA).
- PDPL: encrypt iqamaNumber, passportNumber.

### Estimated Effort: L

### Ready Prompt
```
Build Qiwa + Nitaqat per Gap 8 + CLAUDE.md 9.3. Steps:
1) Add SaudizationSnapshot, QiwaContract models. Extend Employee. Migration.
2) src/lib/qiwa-engine.ts mirroring src/lib/gosi-engine.ts pattern. OAuth tokens via existing GovApiCredentials.
3) Endpoints + daily cron src/app/api/cron/qiwa-sync/route.ts.
4) Nitaqat thresholds JSON seeded for top 10 activity codes.
5) Tests: classification edge cases + projectImpact math.
6) Encrypt iqama/passport via src/lib/encryption.ts when storing/syncing.
```

---

## Gap 9: PDPL Compliance — Data Subject Rights + Breach Module

### الهدف
حق الوصول/الحذف/التصحيح + سجل الاختراقات (غرامة 5M SAR — إلزامي).

### Schema Changes
```prisma
model PdplDataSubjectRequest {
  id Int @id @default(autoincrement())
  requestType String
  subjectType String
  subjectId Int
  subjectIdentifier String
  status String @default("RECEIVED")
  receivedAt DateTime @default(now())
  dueDate DateTime
  completedAt DateTime?
  evidenceUrl String?
  handledByUserId Int?
  rejectionReason String?
  @@index([status, dueDate])
}
model PdplConsent {
  id Int @id @default(autoincrement())
  subjectType String
  subjectId Int
  purpose String
  granted Boolean
  grantedAt DateTime?
  revokedAt DateTime?
  legalBasis String
  evidenceHash String?
}
model PdplBreachIncident {
  id Int @id @default(autoincrement())
  detectedAt DateTime
  reportedAt DateTime?
  category String
  severity String
  affectedRecords Int
  affectedDataCategories Json
  rootCause String?
  containmentActions String?
  notificationToSdaia Boolean @default(false) sdaiaRefNo String?
  notificationToSubjects Boolean @default(false)
  status String @default("DETECTED")
  ownerUserId Int?
}
```

### API Endpoints
- `POST /api/pdpl/dsr`
- `GET  /api/pdpl/dsr/queue`
- `POST /api/pdpl/dsr/[id]/fulfill`
- `POST /api/pdpl/breach`
- `POST /api/pdpl/breach/[id]/notify-sdaia`
- `GET  /api/pdpl/consent/[subjectType]/[subjectId]`

### Engine File
- File: `src/lib/pdpl-engine.ts` (new)
- Uses existing `src/lib/privacy-filter.ts`
- Methods: `fulfillAccess(requestId)`, `eraseSubject(requestId)` (anonymizes — keeps invoices for ZATCA retention), `recordBreach()`, `notifySdaiaWithin72h()`, `consentCheck(subjectId, purpose)`

### UI Pages
- `src/app/(dashboard)/compliance/pdpl/dsr/page.tsx`
- `src/app/(dashboard)/compliance/pdpl/breaches/page.tsx`
- `src/app/(dashboard)/compliance/pdpl/consent/page.tsx`
- Public: `src/app/dsr-portal/page.tsx`

### Data Flow
```
Subject submits DSR → PdplDataSubjectRequest row
   ↓ verify identity (OTP via src/lib/sms.ts)
   ↓ pdpl-engine.fulfillAccess() iterates registered tables (dataMap config)
   ↓ generates ZIP via src/lib/cloud-storage.ts → email link
ERASE: anonymizes name/phone/iqama BUT keeps invoice headers (ZATCA 6yr retention)
Breach detected → PdplBreachIncident; if HIGH/CRITICAL → 72h timer → notify SDAIA
```

### Saudi Compliance Note
- 30-day deadline on DSR (PDPL Art 12).
- 72-hour breach notification to SDAIA (Art 20).
- Cannot fully erase invoices — anonymize PII only, retain financial records 6 years.
- Fine up to 5M SAR.

### Estimated Effort: L

### Ready Prompt
```
Build PDPL compliance per Gap 9. Steps:
1) Add PdplDataSubjectRequest, PdplConsent, PdplBreachIncident. Migration.
2) src/lib/pdpl-engine.ts with dataMap registry of PII fields per table. Reuse src/lib/privacy-filter.ts.
3) Endpoints + public DSR portal (rate-limited via src/lib/rate-limit.ts).
4) Anonymize via update name='[ERASED]', phone=null, idNumber=null — keep invoice/JE intact.
5) Breach 72h SLA cron — escalation to SystemAlert.
6) Tests: dsr-fulfillment finds all records, erase preserves financial integrity.
```

---

## Gap 10: VAT Classification per Line (Zero/Exempt/Reverse-Charge)

### الهدف
تصنيف ضريبي دقيق لكل سطر (15%/0%/معفى/عكس التحميل) لـ ZATCA Phase 2.

### Schema Changes
```prisma
model SalesInvoiceDetail {
  // ... existing
  vatCategoryCode String @default("S")
  vatExemptionReason String?
  vatReverseCharge Boolean @default(false)
  customsDutyAmount Decimal? @db.Decimal(20,4)
}
model PurchaseInvoiceDetail {
  vatCategoryCode String @default("S")
  vatExemptionReason String?
  vatReverseCharge Boolean @default(false)
}
model VatCategory { id Int @id @default(autoincrement()) code String @unique nameAr String nameEn String rate Decimal @db.Decimal(5,4) zatcaCode String exemptionReasonRequired Boolean @default(false) }
```

### API Endpoints
- `GET  /api/vat/categories`
- `POST /api/vat/categories`
- `GET  /api/vat/return?period=`
- `POST /api/vat/return/[id]/submit`

### Engine File
- File: `src/lib/vat-classifier.ts` (new) + extend existing `src/lib/zatca.ts`
- Methods: `classifyLine(productId, customer, country)`, `computeVatPerCategory(period)`, `buildVatReturn(period)`, `validateZatcaXml(invoice)`

### UI Pages
- `src/app/(dashboard)/finance/vat/categories/page.tsx`
- `src/app/(dashboard)/finance/vat/returns/page.tsx`
- Modify invoice details — add VAT category dropdown per line

### Data Flow
```
Invoice line creation → vat-classifier.classifyLine() suggests category
   ↓ user can override (with permission)
   ↓ if vatCategoryCode != 'S' → exemptionReason mandatory
ZATCA XML build → src/lib/zatca-signer.ts uses vatCategoryCode + exemption code
Period close → vat-classifier.buildVatReturn(period)
   ↓ groups by category → fills ZATCA VAT return
```

### Saudi Compliance Note
- ZATCA codes: VATEX-SA-29 (medical), VATEX-SA-32 (financial), VATEX-SA-29-7 (real-estate)
- Reverse charge: foreign supplier of services → buyer self-assesses VAT.
- Zero-rated: exports + intl transport.

### Estimated Effort: M

### Ready Prompt
```
Build VAT classification per Gap 10. Steps:
1) Extend SalesInvoiceDetail + PurchaseInvoiceDetail. Add VatCategory. Migration.
2) Seed 8 VatCategory rows with ZATCA codes.
3) src/lib/vat-classifier.ts. Hook into src/lib/zatca-signer.ts XML builder — replace hardcoded 'S' with line.vatCategoryCode.
4) VAT return endpoint + UI.
5) Reverse-charge: when applied, auto-journal posts both Dr & Cr Output VAT Self-Assessed.
6) Tests: 5 categories × XML validation + reverse-charge JE check.
```

---

## Gap 11: WHT Foreign-Vendor Flag + Monthly Form 14

### الهدف
حجب ضريبة استقطاع 5-20% للموردين الأجانب + توليد نموذج 14 الشهري لـ ZATCA.

### Schema Changes
```prisma
model Customer {
  // ... existing
  isForeignVendor Boolean @default(false)
  whtCountryCode String?
  whtTaxResidencyCert String?
  whtTaxResidencyExpiry DateTime?
  defaultWhtRuleId Int?
}
model WHTTransaction {
  // ... existing
  serviceCategory String?
  treatyApplied Boolean @default(false)
  treatyCountry String?
  form14BatchId Int?
}
model WhtForm14Batch {
  id Int @id @default(autoincrement())
  period String
  totalGross Decimal @db.Decimal(20,4)
  totalWht Decimal @db.Decimal(20,4)
  status String @default("DRAFT")
  zatcaRef String?
  filedAt DateTime?
  xmlPayload String? @db.Text
  transactions WHTTransaction[]
}
```

### API Endpoints
- `POST /api/wht/calculate`
- `GET  /api/wht/transactions?period=`
- `POST /api/wht/form14/generate?period=YYYY-MM`
- `POST /api/wht/form14/[id]/file`

### Engine File
- File: `src/lib/wht-engine.ts` (extends existing)
- Methods: `lookupRate(vendorId, serviceCategory)`, `applyTreaty(rate, country)`, `applyOnInvoice(invoiceId)`, `generateForm14(period)`, `fileToZatca(batchId)`

### UI Pages
- `src/app/(dashboard)/finance/wht/transactions/page.tsx`
- `src/app/(dashboard)/finance/wht/form14/page.tsx`
- Modify purchase invoice — show WHT preview if vendor.isForeignVendor

### Data Flow
```
PurchaseInvoice posted with foreign vendor → wht-engine.applyOnInvoice()
   ↓ lookupRate() from WHTRule by service category
   ↓ applyTreaty() reduces if tax-residency cert valid + treaty country
   ↓ writes WHTTransaction
   ↓ auto-journal: Dr Vendor (gross) / Cr Cash (net) / Cr WHT Payable (whtAmount)
Monthly cron → generateForm14()
   ↓ aggregates WHTTransaction by category → ZATCA XML
   ↓ fileToZatca() → batch.status=FILED
```

### Saudi Compliance Note
- Rates: 5% rent, 5% royalty, 15% technical services, 20% dividends, 5% mgmt fees.
- Tax treaties (40+ countries) reduce rates — require valid certificate.
- Form 14 due by 10th of following month.

### Estimated Effort: M

### Ready Prompt
```
Build WHT engine per Gap 11. Steps:
1) Extend Customer with isForeignVendor + tax residency fields. Extend WHTTransaction. Add WhtForm14Batch. Migration.
2) Seed default WHTRule rows (5/15/20%) per service category.
3) src/lib/wht-engine.ts. Hook into PurchaseInvoice posting in src/app/api/purchases/route.ts.
4) auto-journal for WHT: separate JE template (Dr 2xxx vendor / Cr 2xxx WHT payable / Cr 1xxx cash net).
5) Form 14 generator + ZATCA filing endpoint.
6) Tests: rate-lookup, treaty discount, form14 aggregation.
```

---

## Gap 12: APS Finite-Capacity Scheduler

### الهدف
جدول تصنيع متقدم يحترم سعة آلات (finite capacity) و alternative routings.

### Schema Changes
```prisma
model ScheduledOperation {
  // ... existing
  alternativeMachineIds Int[]
  setupTimeMin Int @default(0)
  runTimeMin Int
  queueTimeMin Int @default(0)
  schedulingDirection String
  bottleneck Boolean @default(false)
  pegging Json?
}
model ApsRun {
  id Int @id @default(autoincrement())
  runDate DateTime @default(now())
  horizonDays Int @default(30)
  algorithm String
  totalOps Int
  feasibleOps Int
  delayedOps Int
  status String @default("RUNNING")
  logs Json?
}
model MachineLoadSnapshot { id Int @id @default(autoincrement()) machineId Int date DateTime utilizationPct Decimal @db.Decimal(5,4) loadHours Decimal @db.Decimal(10,2) capacityHours Decimal @db.Decimal(10,2) }
```

### API Endpoints
- `POST /api/manufacturing/aps/run`
- `GET  /api/manufacturing/aps/gantt?from=&to=&machineId=`
- `POST /api/manufacturing/aps/reschedule`
- `GET  /api/manufacturing/aps/load-snapshot`
- `POST /api/manufacturing/aps/what-if`

### Engine File
- File: `src/lib/aps-engine.ts` (new)
- Extends `src/lib/mps-engine.ts` and `src/lib/mrp-engine.ts`
- Methods: `forwardSchedule(orders[])`, `backwardSchedule(orders[])`, `findBottleneck()`, `tryAlternativeMachine(opId)`, `pegDemand()`

### UI Pages
- `src/app/(dashboard)/manufacturing/aps/page.tsx`
- `src/app/(dashboard)/manufacturing/aps/gantt/page.tsx`
- Components: `MachineGantt.tsx`, `LoadHeatmap.tsx`

### Data Flow
```
Manufacturing orders queued → /api/manufacturing/aps/run
   ↓ aps-engine.forwardSchedule() walks ScheduledOperation graph
   ↓ checks CapacityCalendar (existing) + machine load
   ↓ if conflict → tryAlternativeMachine() or push to next slot
   ↓ writes/updates ScheduledOperation.startTime/endTime
   ↓ MachineLoadSnapshot rows for dashboard
Drag-drop on Gantt → reschedule endpoint → respects constraints
```

### Estimated Effort: L

### Ready Prompt
```
Build APS scheduler per Gap 12. Steps:
1) Extend ScheduledOperation. Add ApsRun, MachineLoadSnapshot. Migration.
2) src/lib/aps-engine.ts integrates with src/lib/mrp-engine.ts (pulls demand) and src/lib/mps-engine.ts.
3) Forward + backward algorithms. Bottleneck = drum-buffer-rope.
4) Gantt UI: use react-gantt-task or fall back to custom Recharts timeline.
5) Tests: aps-engine.test.ts — capacity overflow, alt-machine, bottleneck detection.
6) DO NOT change ManufacturingOrder state machine — APS only schedules timestamps.
```

---

## Gap 13: Project WBS + EVM (CPI/SPI)

### الهدف
تفصيل مشاريع بهيكل WBS هرمي + قياس Earned Value (CPI, SPI, EAC, ETC).

### Schema Changes
```prisma
model ProjectWbs {
  id Int @id @default(autoincrement())
  projectId Int
  parentId Int?
  code String
  name String
  level Int @default(0)
  plannedValue Decimal @default(0) @db.Decimal(20,4)
  earnedValue Decimal @default(0) @db.Decimal(20,4)
  actualCost Decimal @default(0) @db.Decimal(20,4)
  budgetAtCompletion Decimal @default(0) @db.Decimal(20,4)
  pctComplete Decimal @default(0) @db.Decimal(5,4)
  startDate DateTime? endDate DateTime?
  responsibleEmployeeId Int?
  project Project @relation(fields:[projectId], references:[id])
  parent  ProjectWbs? @relation("WbsTree", fields:[parentId], references:[id])
  children ProjectWbs[] @relation("WbsTree")
  @@index([projectId, parentId])
  @@unique([projectId, code])
}
model EvmSnapshot {
  id Int @id @default(autoincrement())
  projectId Int
  wbsId Int?
  snapshotDate DateTime @default(now())
  pv Decimal @db.Decimal(20,4) ev Decimal @db.Decimal(20,4) ac Decimal @db.Decimal(20,4)
  cpi Decimal @db.Decimal(8,4)
  spi Decimal @db.Decimal(8,4)
  eac Decimal @db.Decimal(20,4)
  etc Decimal @db.Decimal(20,4)
  vac Decimal @db.Decimal(20,4)
}
```

### API Endpoints
- `POST /api/projects/[id]/wbs`
- `GET  /api/projects/[id]/wbs/tree`
- `POST /api/projects/[id]/wbs/[wbsId]/progress`
- `POST /api/projects/[id]/evm/snapshot`
- `GET  /api/projects/[id]/evm/dashboard`

### Engine File
- File: `src/lib/project-evm-engine.ts` (new)
- Methods: `computeEarnedValue(wbsId, asOfDate)`, `aggregateUpward(wbsId)`, `pullActualsFromGL(projectId)` (via JournalLine.projectId — needs Gap 1), `forecastEac()`, `snapshot()`

### UI Pages
- `src/app/(dashboard)/projects/[id]/wbs/page.tsx`
- `src/app/(dashboard)/projects/[id]/evm/page.tsx`
- Components: `WbsTree.tsx`, `EvmKpiCard.tsx`, `SCurveChart.tsx`

### Data Flow
```
PM defines WBS → ProjectWbs hierarchy
   ↓ assigns plannedValue + BAC per node
Daily cron /api/cron/evm → pullActualsFromGL via JournalLine.projectId (Gap 1)
   ↓ computeEarnedValue: EV = BAC × pctComplete
   ↓ aggregateUpward(): rolls up children to parent
   ↓ writes EvmSnapshot with CPI, SPI, EAC
Dashboard: S-curve PV vs EV vs AC; KPI cards.
```

### Estimated Effort: M

### Ready Prompt
```
Build WBS + EVM per Gap 13. Depends on Gap 1 (Universal Journal projectId on JournalLine). Steps:
1) Add ProjectWbs, EvmSnapshot. Migration.
2) src/lib/project-evm-engine.ts. pullActualsFromGL groups JournalLine by projectId+wbsId.
3) Endpoints + cron.
4) WBS tree UI with drag-drop reorder + level enforcement.
5) Dashboard with CPI/SPI traffic-light + S-curve via Recharts.
6) Tests: aggregation correctness, EAC formula, pctComplete cap at 100.
```

---

## Gap 14: Semantic BI Cubes + Persona Dashboards

### الهدف
طبقة BI دلالية + لوحات حسب الدور (CFO, Sales Manager, COO).

### Schema Changes
```prisma
model BiCube {
  id Int @id @default(autoincrement())
  code String @unique
  name String
  refreshIntervalMin Int @default(60)
  lastRefreshedAt DateTime?
  rowCount Int @default(0)
  definition Json
}
model BiCubeRow { id BigInt @id @default(autoincrement()) cubeId Int periodKey String dimensions Json measures Json @@index([cubeId, periodKey]) }
model BiDashboard { id Int @id @default(autoincrement()) name String persona String layout Json widgets Json visibilityRoles String[] }
model BiDashboardSubscription { id Int @id @default(autoincrement()) dashboardId Int userId Int }
```

### API Endpoints
- `POST /api/bi/cubes/[code]/refresh`
- `GET  /api/bi/cubes/[code]/query?dims=&measures=&filter=`
- `GET  /api/bi/dashboards?persona=CFO`
- `POST /api/bi/dashboards`

### Engine File
- File: `src/lib/bi-engine.ts` (new)
- Methods: `refreshCube(code)`, `query(cubeCode, dims, measures, filter)`, `materialize()`, `serveDashboard(id)`

### UI Pages
- `src/app/(dashboard)/bi/page.tsx`
- `src/app/(dashboard)/bi/[id]/page.tsx`
- `src/app/(dashboard)/bi/builder/page.tsx`

### Data Flow
```
Cron /api/cron/bi-refresh → bi-engine.refreshCube() per cube
   ↓ runs aggregate query (Prisma raw or aggregate) → writes BiCubeRow batch
User opens dashboard → /api/bi/cubes/[code]/query
   ↓ filters BiCubeRow.dimensions JSON path → returns rolled-up
   ↓ < 200ms response (vs minutes if hitting transactions)
```

### Estimated Effort: M

### Ready Prompt
```
Build BI cubes per Gap 14. Steps:
1) Add BiCube, BiCubeRow (BigInt id), BiDashboard, BiDashboardSubscription. Migration.
2) src/lib/bi-engine.ts. Seed 4 cubes: SALES_FACT, GL_FACT (uses Universal Journal dims from Gap 1), INVENTORY_FACT, HR_FACT.
3) Persona dashboards seed: CFO (cash, AR aging, EBITDA, CPI), Sales Mgr (pipeline, won, target), COO (utilization, OEE, OTIF), HR (saudization, turnover, headcount).
4) Refresh cron. Dashboard renderer reuses Recharts.
5) Tests: cube refresh idempotent, query filters JSON correctly.
```

---

## Gap 15: Service SLA + Field Mobile + PM Scheduler

### الهدف
نظام تذاكر مع SLA + تطبيق فني الميدان + جدولة صيانة وقائية.

### Schema Changes
```prisma
model ServiceTicket {
  // ... existing
  slaPolicyId Int?
  slaResponseDue DateTime?
  slaResolveDue DateTime?
  slaResponseBreached Boolean @default(false)
  slaResolveBreached Boolean @default(false)
  assignedTechnicianId Int?
  customerAssetId Int?
  geoLat Decimal? @db.Decimal(10,7)
  geoLng Decimal? @db.Decimal(10,7)
  signatureUrl String?
}
model SlaPolicy {
  id Int @id @default(autoincrement())
  name String
  priorityLevel String
  responseMinutes Int
  resolveMinutes Int
  businessHoursOnly Boolean @default(true)
  active Boolean @default(true)
}
model PmSchedule {
  id Int @id @default(autoincrement())
  assetId Int
  frequency String
  thresholdValue Decimal? @db.Decimal(20,4)
  nextDueDate DateTime
  lastGeneratedTicketId Int?
  active Boolean @default(true)
}
model FieldServiceVisit { id Int @id @default(autoincrement()) ticketId Int technicianId Int checkInAt DateTime? checkOutAt DateTime? notes String partsUsed Json signatureUrl String? }
```

### API Endpoints
- `POST /api/service/tickets`
- `POST /api/service/tickets/[id]/assign`
- `POST /api/service/tickets/[id]/check-in`
- `POST /api/service/tickets/[id]/check-out`
- `POST /api/service/pm-schedules`
- `GET  /api/service/sla/dashboard`

### Engine File
- File: `src/lib/service-sla-engine.ts` (new)
- Methods: `applySla(ticketId)`, `escalate()`, `recordBreach()`, `generatePmTickets()`, `checkInTechnician(ticketId, geo)`, `consumeParts(visitId, items[])`

### UI Pages
- `src/app/(dashboard)/service/tickets/page.tsx`
- `src/app/(dashboard)/service/sla/page.tsx`
- `src/app/(dashboard)/service/pm/page.tsx`
- Mobile (PWA): `src/app/(field)/visits/page.tsx`

### Data Flow
```
Ticket created → service-sla-engine.applySla()
   ↓ computes slaResponseDue + slaResolveDue (business hours aware)
   ↓ assigns technician via skill+geo proximity
Cron every 5 min → check breaches → SystemAlert + escalate manager
Field tech (PWA): check-in → captures geo + photo → consume parts (StockMovement)
   ↓ check-out + signature → ticket CLOSED
PM cron daily → for each PmSchedule due → auto-create ServiceTicket linked to FixedAsset
Parts used → auto-journal: Dr Service COGS / Cr Inventory
```

### Saudi Compliance Note
ZATCA: if service is billable, generate simplified e-invoice on close.

### Estimated Effort: L

### Ready Prompt
```
Build Service SLA + field + PM per Gap 15. Steps:
1) Extend ServiceTicket. Add SlaPolicy, PmSchedule, FieldServiceVisit. Migration.
2) src/lib/service-sla-engine.ts with business-hours math (use existing src/lib/hijri.ts for KSA calendar weekend Fri-Sat).
3) Endpoints + breach cron every 5 min.
4) PWA pages with offline IndexedDB cache. Reuse existing PWA setup.
5) Parts consumption integrates with src/lib/inventory-engine.ts.
6) PM auto-ticketing cron generates from FixedAsset.maintenanceFrequencyMonths.
7) Tests: SLA breach detection, PM date math, parts → JE chain.
```

---

# Cross-Cutting Notes

**Dependencies between gaps:**
- Gap 1 (Universal Journal) is foundational — Gaps 2 (CO-PA), 13 (EVM), 14 (BI) depend on it.
- Gap 4 (AP OCR) depends on existing `src/lib/three-way-match.ts`.
- Gap 6 (Componentization) requires `src/lib/multi-book-engine.ts`.
- Gap 11 (WHT) leverages existing `WHTRule` and `WHTTransaction`.

**Migration order recommended:** 1 → 7 → 9 → 10 → 11 → 8 → 3 → 6 → 4 → 5 → 2 → 13 → 14 → 12 → 15

**Common rules per CLAUDE.md:**
- Every JE through `src/lib/auto-journal.ts` (no direct SQL).
- Decimal(20,4) for monetary fields (NEVER Float in new code).
- `tenantId` filter on every query.
- Zod validation on every API route.
- Field audit via `src/lib/field-audit.ts`.

---

**Generated:** 2026-05-06
**Reference docs:** `MASTER_AUDIT_REPORT.md`, `I18N_PLAN.md`, `DEAD_BUTTONS_REPORT.md`
