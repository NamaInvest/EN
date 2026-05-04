# تقرير فحص الموديولات التجارية والصناعية — Namasoft ERP

**تاريخ:** 2026-05-04 | **عدد الملفات المفحوصة:** 118 ملف API/Engine/Page

---

## 1. المبيعات (Sales)
**API:** `/api/sales/`, `/api/sales-orders/`, `/api/sales-returns/`
**الحالة:** ✅ FULL

**الجاهز:**
- فواتير المبيعات + Soft Delete + عكس
- Stock Depletion تلقائي عند البيع
- Auto-Journal Entries
- ZATCA Phase 1 & 2 (QR + Signing)
- Credit Limit Enforcement
- Tax Inclusive/Exclusive
- Split Payment (نقد + شبكة)
- Treasury Integration
- Sales Orders + تحويل تلقائي للمشتريات (Drop Shipping)
- مرتجعات + RMA Validation
- Kitchen Printer (ESC/POS)
- Offline Sync

**الفجوات:**
- لا Subscription Billing / Recurring Invoices مكتمل
- لا Quote-to-Invoice Conversion
- لا Pro-forma Invoices
- لا Batch Invoice Generation/Email
- لا Cash Application Matching متقدم

---

## 2. المشتريات (Purchases)
**API:** `/api/purchase-orders/`, `/api/purchases/`, `/api/purchase-returns/`
**الحالة:** ✅ FULL

**الجاهز:**
- PR + Approval Routing
- Purchase Invoice + PO Matching
- Purchase Price Variance (PPV)
- Landed Costs
- Treasury + Auto-Journal
- مرتجعات
- Letters of Credit (LC)
- OCR Invoice (تجريبي)
- GRN

**الفجوات:**
- لا Blanket POs / Framework Agreements
- لا Invoice Tolerance Settings قابلة للتكوين
- لا QC Gate إلزامي
- لا Two-way Matching منفصل
- لا Supplier Scorecards كاملة

---

## 3. المخزون (Inventory)
**API:** `/api/inventory/`, `/api/stock/`, `/api/product-stocks/`, `/api/stock-transfers/`, `/api/stocktake/`
**الحالة:** ✅ FULL

**الجاهز:**
- Stock Movements (In/Out/Adjustment)
- Stock Transfers + Validation
- Stocktake + Variance
- Multi-warehouse
- Reorder Point Monitoring
- Stock Reservations
- Batch/Serial (ProductUnit)
- FIFO/LIFO/WAC
- Smart Auto-decompose
- Salla Sync

**الفجوات:**
- لا Lot Lifecycle (Expiry/Quarantine)
- لا Bin-level Tracking
- لا Inventory Aging Report
- لا Automatic Reorder Generation
- لا Putaway Rules / Pick Strategies

---

## 4. التصنيع (Manufacturing)
**API:** `/api/manufacturing/{orders,recipes,mrp,bom}`
**Engines:** `mrp-engine.ts`, `bom-engine.ts`, `material-issuance.ts`
**الحالة:** ✅ FULL

**الجاهز:**
- MOs + Recipes
- BOM Explosion متعدد المستويات + Where-Used
- MRP: حساب الاحتياج + توليد PRs
- Backflushing + Picklist
- By-Products + Scrap %
- Work Center Routing
- Auto-deduct من Sales Invoice (لو للمنتج وصفة)

**الفجوات:**
- لا Production Scheduling / Capacity Planning
- لا QC Gates إلزامية
- لا Job Costing بطريقة منفصلة
- لا Rework / Scrap Orders
- لا WIP Valuation default
- لا Kanban / Pull Planning

---

## 5. المنتجات (Products & Categories)
**API:** `/api/products/`, `/api/categories/`, `/api/packaging-units/`
**الحالة:** ✅ FULL

**الفجوات:**
- لا Product Attributes (Size/Color)
- لا Product Variants / SKU Master
- لا Product Substitutions
- لا Genealogy / Traceability

---

## 6. العملاء والموردين (Customers & Vendors)
**API:** `/api/customers/`, `/api/vendor-ratings/`
**الحالة:** ✅ FULL

**الفجوات:**
- لا Customer Statements PDF محسن
- لا Dunning Run إنتاجي
- لا Customer Hierarchies / Groups
- لا Vendor Performance Metrics متقدمة

---

## 7. POS — نقاط البيع
**API:** `/api/pos/{checkout,products,bnpl}` | **Page:** `/sales/`
**الحالة:** 🟡 PARTIAL

**الجاهز:**
- POS موحد مع Sales Invoice
- Real-time search
- Cart + Discount
- Multi-warehouse selection
- Cash/Card/Split
- Kitchen Printer
- Offline Sync
- Unit Conversion
- Held Invoices
- BNPL (Tamara/Tabby)

**الفجوات:**
- لا Table Management كامل (للمطاعم)
- لا Employee Clock-In Integration
- لا Loyalty Points integration مع البيع
- لا Advanced Promotions (BOGO)
- لا Shift Management / Daily Settlement

---

## 8. التجارة الإلكترونية (E-Commerce & B2B)
**API:** `/api/b2b/`, `/api/ecommerce/`, `/api/delivery-platforms/`
**الحالة:** 🟡 PARTIAL

**الجاهز:**
- B2B Shop API + Auth + Checkout
- Delivery Platform Webhooks (stub)
- Salla Sync

**الفجوات الحرجة:**
- 🔴 لا Product Catalog Management UI
- 🔴 لا Cart State management
- 🔴 لا Checkout Flow
- 🔴 لا Order Management Portal
- 🔴 لا Customer Portal
- 🔴 لا Reviews / Ratings

---

## 9. الولاء والعروض (Loyalty/Promotions/Coupons/Gift Cards)
**API:** `/api/loyalty/`, `/api/coupons/`, `/api/promotions/`, `/api/gift-cards/`
**الحالة:** ✅ FULL (Basic)

**الفجوات:**
- لا Tiered Promotions
- لا Bundle Deals
- لا Customer-specific Coupons
- لا Loyalty Tier Management

---

## 10. التمويل (BNPL & Installments)
**API:** `/api/bnpl/`, `/api/rem/installments/`
**الحالة:** ✅ FULL

**الفجوات:**
- لا Installment Accounting JE تلقائياً
- لا Payment Schedule Reminders

---

## 11. الشحن (Shipments)
**API:** `/api/shipments/`, `/api/delivery-platforms/`
**الحالة:** 🟡 PARTIAL

**الفجوات:**
- 🔴 لا Shipping Label Generation
- 🔴 لا Rate Shopping
- 🔴 لا Proof of Delivery

---

## Engines

| Engine | الحالة |
|--------|-------|
| `mrp-engine.ts` | ✅ FULL |
| `bom-engine.ts` | ✅ FULL |
| `inventory-engine.ts` | ✅ FULL |
| `costing.ts` | ✅ FULL |
| `material-issuance.ts` | ✅ FULL |
| `standard-cost-engine.ts` | ✅ FULL |
| `variance-engine.ts` | ✅ FULL |
| `allocation-engine.ts` | 🟡 PARTIAL |
| `dunning-engine.ts` | 🟡 PARTIAL |
| `approval-engine.ts` | ✅ FULL |

---

## ملخص

| الحالة | العدد |
|------|------|
| ✅ FULL | 18 |
| 🟡 PARTIAL | 6 |
| 🔴 STUB | 4 |

**الفجوات الحرجة:**
- E-Commerce Frontend غير موجود
- Capacity Planning للتصنيع غير موجود
- QC Integration ضعيف
- Dunning غير منتج إنتاجياً
- Product Variants غير موجود
