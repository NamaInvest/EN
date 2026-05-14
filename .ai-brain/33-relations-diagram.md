# 33 - علاقات الجداول الرئيسية (Database Relations Diagram)

> خرائط العلاقات بين 607 جدول — تركيز على الـ Core domains

---

## 🌐 العلاقات الكبرى

### مخطط شامل:
```
        ┌─────────────────┐
        │  TenantAccount   │ (Master DB)
        └────────┬────────┘
                 │
                 │ ينشئ
                 ▼
        ┌─────────────────┐
        │  Tenant DB       │ (Per-tenant)
        └────────┬────────┘
                 │
        ┌────────┼────────┬────────┬────────┐
        ▼        ▼        ▼        ▼        ▼
     ┌─────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
     │User │ │Branch│ │Setting│ │Stock │ │ ... │
     └──┬──┘ └───┬──┘ └──────┘ └──┬───┘ └──────┘
        │       │                  │
        │       │                  │
        ▼       ▼                  ▼
     ┌─────┐ ┌────────┐         ┌────────┐
     │Audit│ │Customer│         │Product │
     │ Log │ │        │         │        │
     └─────┘ └───┬────┘         └───┬────┘
                 │                  │
        ┌────────┼──────────────────┘
        ▼        ▼
   ┌──────┐ ┌──────────┐
   │ Sales│ │ Purchase │
   │Invoice│ │ Invoice  │
   └───┬──┘ └────┬─────┘
       │        │
       ▼        ▼
   ┌──────────────┐
   │ JournalEntry │
   │     ↓        │
   │ JournalLine  │
   └──────────────┘
```

---

## 💰 المحاسبة (Accounting Relations)

```
Account (Chart of Accounts)
   ├── parentId → Account (Hierarchy)
   ├── 1:N JournalLine.accountId
   └── controlAccount: Boolean

JournalEntry
   ├── 1:N JournalLine
   ├── createdById → User
   ├── source: SalesInvoice | PurchaseInvoice | Payroll | ...
   ├── fiscalPeriodId → FiscalPeriod
   └── status: DRAFT | POSTED | REVERSED

JournalLine
   ├── entryId → JournalEntry (Cascade Delete)
   ├── accountId → Account
   ├── costCenterId → CostCenter
   ├── profitCenterId → ProfitCenter
   ├── projectId → Project
   ├── segmentId → Segment
   ├── customerId → Customer
   ├── supplierId → Customer (type=1)
   ├── employeeId → Employee
   ├── assetId → FixedAsset
   ├── productId → Product
   └── currencyId → Currency

FiscalYear
   └── 1:N FiscalPeriod

FiscalPeriod
   ├── fiscalYearId → FiscalYear
   ├── locked: Boolean
   └── 1:N JournalEntry
```

---

## 🛒 المبيعات (Sales Relations)

```
Customer (type=0)
   ├── balance, creditLimit, taxNumber
   ├── 1:N SalesInvoice
   ├── 1:N SalesOrder
   ├── 1:N PriceQuote
   ├── 1:N DeliveryNote
   ├── 1:N SalesReturn
   ├── 1:N PaymentTransaction
   ├── 1:N LoyaltyMember
   └── 1:N GiftCard

PriceQuote
   ├── customerId → Customer
   ├── status: DRAFT | SENT | ACCEPTED | EXPIRED
   ├── validUntil
   └── 1:N QuotationItem
         └── productId → Product

SalesOrder
   ├── customerId → Customer
   ├── quoteId → PriceQuote (اختياري)
   ├── status
   └── 1:N SalesOrderDetail
         └── productId → Product

DeliveryNote
   ├── salesOrderId → SalesOrder
   ├── customerId → Customer
   └── 1:N DeliveryNoteDetail

SalesInvoice
   ├── customerId → Customer
   ├── salesOrderId → SalesOrder (اختياري)
   ├── deliveryNoteId → DeliveryNote (اختياري)
   ├── 1:N SalesInvoiceDetail
   ├── 1:1 ZATCARecord (or fields inline)
   ├── posSessionId → PosSession (إذا POS)
   ├── 1:N PaymentTransaction (allocations)
   └── 1:N SalesReturn (مرتجعات)

SalesInvoiceDetail
   ├── invoiceId → SalesInvoice
   ├── productId → Product
   ├── unitId → ProductUnit
   └── batchNo → ProductBatch (اختياري)

SalesReturn
   ├── originalInvoiceId → SalesInvoice
   ├── customerId → Customer
   └── 1:N SalesReturnDetail
```

---

## 🛍 المشتريات (Purchase Relations)

```
Customer (type=1)  // المورد
   ├── isForeignVendor, whtCountryCode
   ├── 1:N PurchaseRequisition (requesterId)
   ├── 1:N PurchaseOrder (supplierId)
   ├── 1:N PurchaseInvoice (supplierId)
   ├── 1:N GoodsReceiptNote (supplierId)
   ├── 1:N SupplierContract
   └── 1:1 VendorScorecard

PurchaseRequisition
   ├── requesterId → Employee/User
   ├── status, approvalRequestId → ApprovalRequest
   └── 1:N PurchaseRequisitionDetail

RequestForQuotation (RFQ)
   ├── 1:N RFQSupplier
   ├── 1:N RFQItem
   └── selected → SupplierContract or PO

PurchaseOrder
   ├── supplierId → Customer (type=1)
   ├── requisitionId → PurchaseRequisition
   ├── rfqId → RequestForQuotation
   ├── approvedBy → User
   ├── 1:N PurchaseOrderDetail
   └── 1:N GoodsReceiptNote (deliveries)

GoodsReceiptNote (GRN)
   ├── poId → PurchaseOrder
   ├── supplierId → Customer
   ├── warehouseId → Stock
   ├── status: PENDING | RECEIVED | INSPECTED
   └── 1:N GoodsReceiptNoteDetail
         ├── productId → Product
         └── batchNo → ProductBatch

PurchaseInvoice
   ├── supplierId → Customer
   ├── poId → PurchaseOrder
   ├── grnId → GoodsReceiptNote
   ├── threeWayMatchStatus
   └── 1:N PurchaseInvoiceDetail
```

---

## 📦 المخزون (Inventory Relations)

```
Category
   ├── parentId → Category (Hierarchy)
   └── 1:N Product

Product
   ├── categoryId → Category
   ├── 1:N ProductUnit
   ├── 1:N ProductVariant
   ├── 1:N ProductSerialNumber
   ├── 1:N ProductBatch
   ├── 1:N ProductStock (per warehouse)
   ├── 1:N SalesInvoiceDetail
   ├── 1:N PurchaseInvoiceDetail
   └── 1:N StockMovement

ProductUnit
   ├── productId → Product
   ├── unitId → Unit (base)
   ├── parentUnitId → ProductUnit (hierarchy)
   └── factor, isBase

ProductStock
   ├── productId → Product
   ├── stockId → Stock (Warehouse)
   ├── binId → WarehouseBin (اختياري)
   └── quantity, averageCost

Stock (Warehouse)
   ├── branchId → Branch
   ├── 1:N WarehouseZone
   ├── 1:N ProductStock
   └── 1:N StockMovement (source/destination)

WarehouseZone
   ├── stockId → Stock
   └── 1:N WarehouseBin

StockMovement
   ├── sourceStockId → Stock
   ├── destinationStockId → Stock (transfer)
   ├── productId → Product
   └── reference (PO/Invoice/Transfer)
```

---

## 🏭 التصنيع (Manufacturing Relations)

```
Recipe (BOM)
   ├── productId → Product (المنتج النهائي)
   ├── 1:N RecipeIngredient
   ├── 1:N RecipeOperation
   ├── 1:N RecipeByProduct
   └── 1:N ManufacturingOrder (تستخدمه)

RecipeIngredient
   ├── recipeId → Recipe
   ├── rawProductId → Product
   └── quantity, wastagePercent

RecipeOperation
   ├── recipeId → Recipe
   ├── workCenterId → WorkCenter
   └── duration, setupTime

ManufacturingOrder (MO)
   ├── productId → Product
   ├── recipeId → Recipe
   ├── status
   ├── sourceStockId → Stock (materials)
   ├── destinationStockId → Stock (finished goods)
   ├── 1:N WorkOrder
   ├── 1:N ManufacturingWastage
   ├── 1:N ManufacturingCost
   └── 1:N QualityCheck

WorkOrder
   ├── moId → ManufacturingOrder
   ├── workCenterId → WorkCenter
   ├── machineId → Machine
   └── operatorId → Employee

WorkCenter
   ├── 1:N Machine
   └── 1:N WorkOrder

Machine
   ├── workCenterId → WorkCenter
   ├── assetId → FixedAsset (link)
   └── 1:N MachineMaintenance, MachineTelemetry
```

---

## 👥 الموارد البشرية (HR Relations)

```
Employee
   ├── managerId → Employee (Org chart)
   ├── branchId → Branch
   ├── userAccountId → User (إذا له حساب نظام)
   ├── 1:N Attendance
   ├── 1:N Vacation
   ├── 1:N Salary
   ├── 1:N EmployeeLoan
   ├── 1:N PayrollInvoice
   ├── 1:N PerformanceReview
   ├── 1:N TrainingEnrollment
   └── 1:1 EndOfServiceCalculation (when terminated)

PayrollRun
   ├── 1:N PayrollInvoice
   ├── 1:N WPSBatch (linked)
   └── status, approvedBy → User

PayrollInvoice
   ├── runId → PayrollRun
   ├── employeeId → Employee
   └── components (deductions, allowances, GOSI)

WPSBatch
   ├── payrollRunId → PayrollRun
   ├── 1:N WPSBatchItem
   └── status, bankCode

WPSBatchItem
   ├── batchId → WPSBatch
   ├── employeeId → Employee
   └── iban, netSalary

GOSIContribution
   ├── batchId → GOSIMonthlyFile
   ├── employeeId → Employee
   └── employeeContribution, employerContribution

GOSIMonthlyFile
   ├── 1:N GOSIContribution
   └── month, year, status

EndOfServiceCalculation
   ├── employeeId → Employee
   └── exitDate, totalAmount
```

---

## 🏗 الأصول (Assets Relations)

```
FixedAsset
   ├── assetCategoryId → FixedAssetCategory
   ├── locationId → Stock (مكان الأصل)
   ├── custodianEmployeeId → Employee
   ├── purchaseInvoiceId → PurchaseInvoice
   ├── 1:N AssetDepreciationLog
   ├── 1:N AssetMaintenanceRecord
   ├── 1:N AssetTransferRecord
   ├── 1:N AssetImpairmentRecord
   ├── 1:N AssetReclassification
   ├── 1:N AssetInsuranceClaim
   ├── 1:N AssetDocument
   └── 1:1 Machine (إذا machinery)

FixedAssetCategory
   ├── accountId → Account (الأصل)
   ├── accumDepAccountId → Account (الإهلاك المتراكم)
   └── 1:N FixedAsset
```

---

## 🏦 الخزينة (Treasury Relations)

```
Bank
   └── 1:N BankAccount

BankAccount
   ├── bankId → Bank
   ├── glAccountId → Account (في GL)
   ├── branchId → Branch
   ├── 1:N BankTransaction
   ├── 1:N BankStatement
   └── 1:N BankReconciliation

BankStatement
   ├── bankAccountId → BankAccount
   └── 1:N BankStatementLine

BankReconciliation
   ├── bankAccountId → BankAccount
   ├── statementId → BankStatement
   └── 1:N BankReconMatch

BankReconMatch
   ├── reconciliationId → BankReconciliation
   ├── journalLineId → JournalLine
   └── statementLineId → BankStatementLine

CheckTransaction
   ├── customerId → Customer (received)
   ├── supplierId → Customer (issued)
   ├── bankAccountId → BankAccount
   └── relatedInvoiceId → SalesInvoice or PurchaseInvoice

PettyCashFund
   ├── custodianEmployeeId → Employee
   ├── branchId → Branch
   └── 1:N PettyCashTransaction
```

---

## ✅ الموافقات (Approvals Relations)

```
ApprovalRule
   ├── documentType (PR/PO/JE/...)
   ├── approverUserId → User
   └── condition (amount > X)

ApprovalRequest
   ├── documentId (polymorphic)
   ├── documentType
   ├── requesterId → User
   ├── status
   └── 1:N ApprovalStep

ApprovalStep
   ├── requestId → ApprovalRequest
   ├── approverUserId → User
   ├── stepNo, status
   └── decidedAt
```

---

## 🇸🇦 ZATCA Relations

```
SalesInvoice  // مع zatca fields inline
   ├── zatcaStatus, zatcaHash, zatcaQr, zatcaXml
   ├── zatcaSignedXml, zatcaUuid, zatcaIcv, zatcaPih
   ├── clearanceUuid, cleared, clearedAt
   └── (للأنواع غير العادية:) 1:1 ZATCARecord

ZATCARecord  // للـ types الأخرى (POS, Rent, School, Payroll)
   ├── invoiceId (polymorphic)
   ├── invoiceType
   └── zatca fields
```

---

## 🤖 AI Relations

```
AICfoReport
   ├── tenantId
   ├── generatedAt
   ├── content: Json
   └── deliveredTo

AIAuditReport
   ├── period
   ├── riskScore
   ├── findings: Json
   └── sentToTelegram

AIRequestLog
   ├── userId → User
   ├── feature (Copilot/CFO/NLQ/...)
   ├── model (gemini-2.0-flash/...)
   ├── inputTokens, outputTokens, cost
   └── createdAt

AITokensUsage  // aggregated
   ├── tenantId, feature, model
   └── month, totalTokens, totalCost
```

---

## 🔔 Events & Webhooks Relations

```
EventLog
   ├── eventType, sourceModule
   ├── payload: Json
   └── status, processedAt

WebhookSubscription
   ├── tenantId
   ├── url, secret
   ├── events: Json
   └── 1:N WebhookDeliveryLog

WebhookDeliveryLog
   ├── subscriptionId → WebhookSubscription
   ├── event
   └── statusCode, deliveredAt
```

---

## 🛡 الأمان (Security Relations)

```
User
   ├── branchId → Branch
   ├── 1:N UserPermission
   ├── 1:N Session
   ├── 1:N MfaAttempt
   ├── 1:N UserBackupCode
   ├── 1:N TrustedDevice
   ├── 1:N UserDelegation (grantor/grantee)
   ├── 1:N AuditLog (created by)
   └── 1:N ApiKey

UserPermission
   ├── userId → User
   └── module, canView/Add/Edit/Delete/Print

ApiKey
   ├── createdByUserId → User
   ├── keyHash (SHA-256)
   └── scopes: Json

AuditLog  // الأهم
   ├── tenantId
   ├── userId → User (NULL إذا system)
   ├── action: AuditAction enum
   ├── tableName, recordId
   └── diff: Json (before/after)
```

---

## 🏢 المستأجر (Master DB Relations)

```
TenantAccount
   ├── userEmail (unique)
   ├── clerkUserId
   ├── subdomain
   ├── 1:N TenantFeatureFlag
   ├── 1:N Subscription
   ├── 1:N DesktopLicense
   └── status

DesktopLicense
   ├── tenantId → TenantAccount
   ├── licenseKey, hardwareId
   └── 1:N DesktopCrashReport

TenantFeatureFlag
   ├── tenantId → TenantAccount
   └── moduleName, isEnabled
```

---

## 🔗 العلاقات الـ Polymorphic

بعض الجداول تربط بأنواع متعددة (لا FK مباشر):

### JournalEntry.source:
```
source = 'SalesInvoice' + sourceId = 123
source = 'PurchaseInvoice' + sourceId = 456
source = 'PayrollRun' + sourceId = 789
```

### ApprovalRequest:
```
documentType = 'PurchaseOrder' + documentId
documentType = 'JournalEntry' + documentId
```

### StockMovement:
```
referenceType = 'PURCHASE_INVOICE' + reference
referenceType = 'SALES_INVOICE' + reference
referenceType = 'STOCK_TRANSFER' + reference
```

---

## 📊 الإحصاء النهائي

- **607 جدول** إجمالي
- **561 جدول** يحتوي `tenantId`
- **41+ جدول** يدعم Soft Delete
- **3 جداول** أساسية (User, Setting, Account)
- **آلاف العلاقات (FKs)**

---

## 🎯 ملاحظات للمطورين

### عند إضافة جدول جديد:
1. ✅ أضف `tenantId String @default("default") @map("tenant_id")`
2. ✅ أضف `@@index([tenantId])`
3. ✅ إذا حساس مالياً: أضف `deletedAt DateTime?`
4. ✅ أضف للقائمة في `prisma-soft-delete.ts` (إذا needed)
5. ✅ FKs بـ `onDelete: Restrict` أو `Cascade` بحكمة
6. ✅ Audit يُضاف تلقائياً (لا حاجة لشيء)

### قواعد ذهبية:
- ❌ **لا FK بدون index**
- ❌ **لا حذف مالي** (استخدم soft delete)
- ✅ **Decimal(18,4)** للمال
- ✅ **String للأرقام الكبيرة** (مثل barcodes طويلة)
- ✅ **Json للهيكل المرن** (مثل JournalLine extras)
