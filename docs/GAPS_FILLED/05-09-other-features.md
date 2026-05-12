# 05-09 — ABC Costing, OLAP, Portals, Document AI

> الميزات الباقية باختصار مع prompt + scenario + flow.

---

# 05 — ABC Costing + Backflushing

## الكود
- [src/lib/gaps/abc-costing-engine.ts](../../src/lib/gaps/abc-costing-engine.ts)
- [src/app/api/gaps/abc-costing/route.ts](../../src/app/api/gaps/abc-costing/route.ts)

## ما يضيفه
- **Traditional ABC** (Activity-Based Costing) — pools + drivers + rates
- **Time-Driven ABC** — time equations لتعقيد أقل
- **Joint Product Allocation** — 3 methods (Physical Qty / Sales Value / NRV)
- **Backflushing** — لـ repetitive manufacturing
- **Variance Analysis** — Material + Labor (Price + Usage variances)

## البرومنت
```text
You are the ABC Costing engine. Allocate overhead to products via activity drivers.

Workflow:
1. Define ActivityPool (name, total_cost, driver, total_driver_units)
2. Compute ActivityRate = total_cost / total_driver_units
3. For each product, record ProductActivityConsumption (driver_consumed per activity)
4. Allocate: cost = driver_consumed × ActivityRate
5. Sum per product → ABC cost

For joint products:
- Method = PHYSICAL_QTY | SALES_VALUE | NRV
- Allocate total_joint_cost in proportion

For repetitive manufacturing:
- Backflush: deduct materials × qty + scrap

For variance analysis:
- Material price = (std - actual) × actual_qty
- Material usage = (std - actual_qty) × std_price
- Labor rate = (std - actual_rate) × actual_hours
- Labor efficiency = (std - actual_hours) × std_rate
```

## السيناريو
> مصنع عصير يخرج عصير + برش (by-product). عند إنتاج 1000 لتر عصير و 50 كيلو برش بتكلفة فاكهة 10,000 SAR، النظام يوزع التكلفة بطريقة Sales Value: عصير 95% (9,500) والبرش 5% (500). COGS أدق بـ 18%.

## فلو البيانات
```
ManufacturingOrder closes → WorkOrder operations logged
        ↓
ActivityConsumption auto-calc per MO
        ↓
ABCCostEngine.allocate(MO_id)
        ↓
ProductCost.standard vs actual → VarianceTransaction
        ↓
auto-journal: WIP DR / RawMat+Labor+Overhead CR / FG DR / WIP CR
```

---

# 06 — OLAP Cube + Excel/PowerBI Connectivity

## الكود
- [src/lib/gaps/olap-cube-engine.ts](../../src/lib/gaps/olap-cube-engine.ts)
- Materialized views SQL embedded

## ما يضيفه
- 5 fact tables (sales, gl, inventory, procurement, hr) as Postgres materialized views
- Pivot query builder with SQL injection guard
- Refresh schedules via pg_cron
- OData v4 endpoint for Excel/PowerBI external connection
- Drill-back to source documents

## البرومنت
```text
You are the OLAP Cube engine. Provide multi-dimensional aggregation over transactional facts.

Workflow:
1. Build SQL from CubeQuery (rows × columns × measures × filters)
2. Validate every field against allow-list (CUBE_SCHEMA)
3. Execute against materialized view (fact_sales, fact_gl, ...)
4. Return CubeResult with row/column groupings
5. Provide drill-back URL to source document
6. Expose OData v4 feed for Excel pivot tables

Security:
- tenantId always in WHERE
- Reject unknown dimensions/measures (SQL injection guard)
- Read-only — never INSERT/UPDATE/DELETE
```

## السيناريو
> CFO يفتح Excel → يضيف "Data → From OData" → URL: `https://app.namasoft.sa/api/odata/v4/sales` → يبني pivot رئيسي يومياً. Drill-down → drill-back إلى invoice.

## فلو البيانات
```
SalesInvoice + JE → trigger → refresh fact_sales matview (every 15 min)
        ↓
CubeQueryEngine validates → builds safe SQL
        ↓
Result → JSON / OData feed → Excel/PowerBI / Web pivot
        ↓
Click cell → drill-back to /sales/invoices/{id}
```

---

# 07 — Customer Portal v2

## الكود
- [src/lib/gaps/customer-portal-v2-engine.ts](../../src/lib/gaps/customer-portal-v2-engine.ts)

## ما يضيفه
- `getPortalDashboard()` — KPIs العميل
- `browsePortalCatalog()` — catalog مع pricelist خاص بالعميل
- `placePortalOrder()` — order مع credit check + auto-approve
- `submitDispute()` — dispute حول فاتورة
- `savePaymentMethod()` — tokenized card storage

## البرومنت
```text
You are Customer Portal v2 backend. Provide B2B self-service Quote-to-Cash.

Capabilities:
- Dashboard: outstanding invoices, credit available/used, loyalty points
- Catalog browsing with customer-specific pricing (from PriceList)
- Order placement: auto-approve if within credit limit, else PENDING_APPROVAL
- Invoice download + Pay-Now (saved card or new card)
- Dispute submission with attachments
- Subscription self-manage (pause/resume/cancel)
- Statement download
- Saved payment methods (tokenized via gateway)

Constraints:
- PortalUser auth (JWT separate from Clerk)
- Multi-tenant scoping enforced
- Credit check before order acceptance
- ZATCA clearance on auto-generated invoices
```

## السيناريو
> عميل B2B يدخل بـ portal → يرى رصيد ائتمان 50,000 ر.س متاح → ينشئ طلب 30,000 ر.س (auto-approved لأنه ضمن الحد) → يدفع ببطاقة محفوظة → يستلم الشحنة → يفتح dispute على فاتورة سابقة → ينسحب على الفور والـ AR يعرض حالة DISPUTED.

## فلو البيانات
```
PortalUser login → load customer + creditLimit + openInvoices
        ↓
Browse catalog → apply pricelist + stock check
        ↓
Cart → placeOrder → credit check
        ├── within limit → SalesOrder AUTO_APPROVED → SalesInvoice
        └── over limit → SalesOrder PENDING_APPROVAL → notify sales mgr
        ↓
PaymentTransaction (saved card) → captureFlow
        ↓
SalesInvoice + ZATCA clearance
        ↓
Shipment + tracking webhook → customer notification
```

---

# 08 — Vendor Portal v2 / SRM

## الكود
- [src/lib/gaps/vendor-portal-v2-engine.ts](../../src/lib/gaps/vendor-portal-v2-engine.ts)

## ما يضيفه
- `acknowledgePO()` — PO acknowledgment with promised date
- `submitASN()` — Advance Ship Notice creates expected-GRN
- `submitVendorInvoice()` — Invoice upload + OCR + 3-way match
- `getVendorScorecard()` — performance metrics (delivery, quality, accuracy)
- `recordOnboardingStep()` — 8-step onboarding wizard

## البرومنت
```text
You are Vendor Portal v2 backend. Implement full SRM (Supplier Relationship Management).

Capabilities:
- PO Acknowledgment with promised date
- ASN (Advance Ship Notice) — creates expected GRN placeholder
- Invoice submission with OCR extraction
- Auto 3-way match triggering
- Payment status visibility
- Performance scorecard (weighted: delivery 40% + quality 35% + invoice 15% + price 10%)
- Vendor onboarding: 8 steps (legal, banking, tax, capabilities, certs, products, references, agreement)
- RFQ response submission
- Q&A on RFQs

Multi-tenant + per-vendor scoping enforced.
```

## السيناريو
> مورد يستلم PO #1023 → يضغط Acknowledge مع تاريخ شحن متوقع → يجهز الشحنة → ينشئ ASN مع container number → عند الوصول، GRN auto-creates و qty مطابق → المورد يرفع فاتورة → OCR يستخرج البيانات → 3-way match يطابق → AP entry → payment run يوم 30 → المورد يرى "Paid" في الـ dashboard.

## فلو البيانات
```
PO emailed to vendor → VendorPortal.po list
        ↓
Vendor ACK → PoAcknowledgment → PO.status=ACKNOWLEDGED
        ↓
Vendor creates ASN → AdvanceShipNotice → expected GRN placeholder
        ↓
Goods arrive → warehouse confirms → GRN status=RECEIVED
        ↓
Vendor uploads invoice PDF → OCR → extractInvoice
        ↓
3-way match (PO ↔ GRN ↔ Invoice) → within tolerance? → AP created
        ↓
PaymentRun → SARIE → Vendor.payment_status=PAID
```

---

# 09 — Document AI Extraction

## الكود
- [src/lib/gaps/document-ai-extraction.ts](../../src/lib/gaps/document-ai-extraction.ts)

## ما يضيفه
- `extractInvoice()` — multimodal LLM extracts structured invoice
- `extractReceipt()` — POS receipt to JSON
- `extractIqama()` — Saudi Iqama ID to fields
- Zod validation of extracted JSON
- Cross-validation against ZATCA vendor registry

## البرومنت
```text
You are Document AI Extraction. Use vision LLM to extract structured data from PDF/image.

Documents supported:
- Tax invoice (Saudi format): vendor info, lines, VAT, totals, PO refs
- POS receipt: merchant, items, total
- Iqama / National ID: number, name, DOB, nationality, expiry
- Contracts: parties, dates, value, terms (TODO)

Pipeline:
1. Send image + prompt to vision LLM
2. Strip markdown code fences
3. Parse JSON
4. Validate against Zod schema (catches malformed responses)
5. Cross-check totals: sum(lines) == subtotal; subtotal + vat == grandTotal
6. Cross-check vendor against ZATCA registry (if VAT number provided)
7. Return ExtractedInvoice + warnings[]

If extraction fails: queue for human review.

Saudi specifics:
- VAT number format: 15 digits starting with 3
- Iqama: 10 digits starting with 1 or 2
- Hijri dates: convert to Gregorian when storing
- Currency default: SAR
```

## السيناريو
> موظف AP يرفع 50 فاتورة PDF صباحاً → النظام يعالجها بـ vision LLM → 45 منها يستخرج بياناتها كاملة → 4 بحاجة مراجعة بسيطة → 1 رفض (صورة سيئة) → AP clerk يراجع 5 يدوياً → 3-way match auto-triggers على المطابقات → AP postings جاهزة قبل الغداء.

## فلو البيانات
```
PDF/Image upload → S3
        ↓
extractInvoice(fileUrl)
        ↓
Vision LLM call (Claude / GPT-4-Vision / Gemini)
        ↓
Raw text response
        ↓
Strip code fence → JSON parse
        ↓
InvoiceExtractionSchema.parse (Zod) → validate
        ↓
Cross-check totals (lines sum, subtotal+VAT=total)
        ↓
Cross-check vendor in ZATCA registry
        ↓
ExtractedInvoice + warnings[]
        ↓
InvoiceCapture record (status = EXTRACTED)
        ↓
Optional: trigger 3-way match if PO ref present
        ↓
Display in /ap/captures for AP clerk review/approval
```

---

# الـ Top 10 المتبقية (لم تُبنى لأنها تحتاج dependencies خارجية)

| # | الميزة | السبب |
|---|---|---|
| 11 | Mobile Native Apps (React Native) | يحتاج repo منفصل + Expo |
| 12 | SARIE / Open Banking | يحتاج اتفاق مع بنك |
| 13 | NPHIES (Health) | يحتاج CCHI credentials |
| 14 | IFRS 17 Insurance | لا حاجة الآن إلا لعميل تأمين |
| 15 | Najiz / Etimad / Balady | يحتاج government API credentials |
| 16 | IoT + Predictive Maintenance | يحتاج TimescaleDB + ML service |
| 17 | Marketing Journey Builder UI | يحتاج React Flow + design |
| 18 | Blockchain Traceability | يحتاج Hyperledger / Polygon |
| 19 | Voice Copilot (Arabic Whisper) | يحتاج Whisper + STT pipeline |
| 20 | Subscription Billing v2 (ARR/MRR cohorts) | يحتاج توسعة للـ subscription-engine موجود |

> هذه يمكن تنفيذها لاحقاً بنفس النمط في `src/lib/gaps/`.

---

## كيف تستخدم AI Builder لإكمال الباقي

استخدم Master System Prompt من `docs/MASTER_PACK/01-prompts/master-system-prompt.md` + الـ Context Pack المناسب من `context-packs.md`. كل ميزة جديدة:

1. Engine pure TS في `src/lib/gaps/`
2. Unit tests في `__tests__/`
3. API route في `src/app/api/gaps/`
4. Doc في `docs/GAPS_FILLED/`
5. Schema delta في `SCHEMA_DELTA_PROPOSAL.md`
