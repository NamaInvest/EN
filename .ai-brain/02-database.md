# 02 - قاعدة البيانات الكاملة (Database Rules & Models)

> مستخرج من: `prisma.ts` (306 سطر, محدّث 2026-06-02), `prisma-soft-delete.ts`, `prisma-audit.ts`, `schema.prisma` (12,326 سطر, 627 جدول)

---

## 📊 إحصائيات الـ Schema الفعلية (مدققة برمجياً - VERIFIED_BY_SCHEMA)

| المقياس | القيمة |
|---|---|
| **الجداول (Models)** | **627** |
| **التعدادات (Enums)** | **1** (AuditAction) |
| **أسطر Schema** | **12,326** |
| **النماذج بـ `tenantId`** | **561+** (العزل المنطقي والفيزيائي) |
| **النماذج بـ `deletedAt` (الحذف الناعم)** | **41** |
| **حقول Decimal الحسابية** | **781** (635 محددة الدقة، 146 غير محددة) |
| **حقول Float العلمية** | **10** (0 مخالفات مالية) |
| **الجداول بمؤشرات مركبة** | **129** |

### الـ Enum الوحيد:
```prisma
enum AuditAction {
    CREATE  UPDATE  DELETE
    APPROVE REJECT  POST  REVERSE  CANCEL  VOID
    PRINT   EXPORT
    LOGIN   LOGOUT
}
```

> **ملاحظة مهمة:** معظم حقول الحالة (status) في النظام تستخدم `String` بدلاً من Enums لمرونة أعلى، مع توثيق القيم المسموحة في التعليقات.

---

## 🏗 العزل متعدد المستويات (Hybrid Multi-Tenancy)

> **النظام في Phase 2 الآن** (محدّث 2026-05-14)

### Tier 1: Master Database (`n11_db`)
- **يحتوي على:**
  - `TenantAccount` — سجل كل المستأجرين
  - `DesktopLicense` — تراخيص النسخ المكتبية
  - `TenantFeatureFlag` — أعلام الميزات
  - بيانات النظام الأساسية المشتركة
- **يستخدمه:** Provisioning, ICE Admin, Master Panel فقط

### Tier 2: Tenant Databases (واحدة لكل مستأجر — Phase 2)
- **التسمية:** `{subdomain}_db` (مثل `aljassim_db`)
- **المحتوى:** كل بيانات الـ ERP الخاصة بالمستأجر (607 جدول كاملاً)
- **العزل:** فيزيائي 100% — قاعدة منفصلة لكل عميل
- **داخلياً:** كل البيانات لها `tenantId='default'` (لأن العزل فيزيائي أصلاً)

### Tier 3: Legacy Tenants (`n11`, `default`)
- **يستخدمون:** قاعدة `n11_db` نفسها مع RLS
- **العزل:** منطقي عبر فلترة `tenantId` تلقائياً في كل query

### كود الـ Resolver (`prisma.ts` سطر 39-81):
```typescript
export function getDbUrl(tenant: string, isRead = false): string {
    const base = process.env.DATABASE_URL || '';
    if (process.env.DESKTOP_MODE === 'true') return base;
    
    const legacyTenants = ['n11', 'default'];
    if (legacyTenants.includes(tenant)) return base;
    
    // Phase 2: Physical DB per Tenant
    return base.replace(/\/([^/?]+)(\?|$)/, `/${tenant}_db$1`);
}
```

---

## 🔐 Connection Pool — تصحيح أمني حرج

### قبل التصحيح (مشكلة أمان):
```typescript
const poolKey = isRead ? 'SHARED_DB_INSTANCE_READ' : 'SHARED_DB_INSTANCE';
// ↑ كل المستأجرين يستخدمون نفس الـ Client → خطر تسريب البيانات
```

### بعد التصحيح (آمن):
```typescript
const dbUrl = getDbUrl(tenant, isRead);
const poolKey = isRead ? `READ_${dbUrl}` : `WRITE_${dbUrl}`;
// ↑ لكل قاعدة بيانات Client مستقل
```

### إعدادات الـ Pool:
- **الحد الأقصى للاتصالات:** 5 لكل tenant (`connection_limit=5`)
- **timeout الـ Pool:** 10 ثوانٍ (`pool_timeout=10`)
- **PgBouncer:** مفعّل (`pgbouncer=true`)
- **التخزين:** عبر `globalThis` لمنع تسريب الذاكرة عند Hot Reload

---

## 🛡 Middleware Pipeline (بالترتيب الفعلي)

```
PrismaClient (new instance per DB URL)
    │
    ├── 1. applySoftDeleteMiddleware(client)
    │       ↓ يحول delete → update {deletedAt: now()}
    │       ↓ يفلتر deletedAt: null تلقائياً في القراءة
    │
    ├── 2. applyAuditMiddleware(client)
    │       ↓ يسجل كل CREATE/UPDATE/DELETE في AuditLog
    │       ↓ يتجاوز: AuditLog, Session, UserBackupCode, MfaAttempt, PosSession
    │
    └── 3. withRLS(client, tenantId)
            ↓ يحقن tenantId='default' للـ Phase 2
            ↓ يحقن tenantId الحقيقي للـ Legacy (n11)
            ↓ يتجاوز System models: Tenant, User, Session, SystemSetting
```

---

## 🗑 Soft Delete — القائمة الكاملة

من `prisma-soft-delete.ts` (سطر 17-32):

```
المالية:
  SalesInvoice, SalesInvoiceDetail, SalesReturn, SalesReturnDetail
  PurchaseInvoice, PurchaseInvoiceDetail, PurchaseOrder, PurchaseOrderDetail
  PurchaseRequisition
  JournalEntry, JournalLine
  Treasury
  
العملاء والموردين:
  Customer
  
الموظفين:
  Employee, Salary, EmployeeLoan
  PayrollInvoice, PayrollInvoiceDetail
  
المنتجات والمخزون:
  Product, ProductUnit, StockMovement
  Branch, Account, User
  
الأصول:
  Asset, FixedAsset
  
الإيجار والأقساط:
  RentInvoice, RentInvoiceDetail
  InstallmentPayment
  PriceQuote, Booking
  
المدفوعات:
  PaymentRun, PaymentRunLine, PaymentTransaction
```

### كيف يعمل (`prisma-soft-delete.ts`):
- **عند READ:** يحول `findUnique` → `findFirst` ويضيف `deletedAt: null`
- **عند DELETE:** يحول `delete` → `update {deletedAt: new Date()}`
- **للوصول للسجلات المحذوفة:** مرر `deletedAt` صراحة في `where`

---

## 📝 Audit Log — التدقيق التلقائي

### الجدول `AuditLog`:
```prisma
model AuditLog {
    id        String   @id @default(cuid())
    tenantId  String   @default("default")
    userId    Int?
    action    AuditAction  // CREATE / UPDATE / DELETE / APPROVE / ...
    tableName String
    recordId  String
    details   String?
    diff      Json?    // before/after values
    ipAddress String?
    userAgent String?
    createdAt DateTime @default(now())
}
```

### النماذج المستثناة من Audit:
```
AuditLog        ← لمنع loop
Session         ← تتغير كثيراً
UserBackupCode  ← حساس
MfaAttempt      ← تتغير كثيراً
PosSession      ← تتغير لحظياً
```

### النماذج المستثناة من العمليات:
- `findMany`, `findFirst`, `count`, `aggregate`, `groupBy` (Read-only) → لا تُسجل

---

## 🔑 النماذج الأساسية (Top 50)

### 👤 المستخدمين والأمان:
```prisma
User { id, username, passwordHash, role, branchId, sessionToken, totpSecretEncrypted, permissions[] }
UserPermission { userId, module, canView, canAdd, canEdit, canDelete, canPrint }
Session { userId, token, expiresAt }
ApiKey { keyHash, scopes[], expiresAt, lastUsedAt }
MfaAttempt { userId, success, method, ipAddress, attemptedAt }
MfaPolicy { requireForRoles[], requireForActions[], allowedMethods[] }
TrustedDevice { userId, deviceFingerprint, trustedUntil }
UserBackupCode { userId, codeHash, usedAt }
UserDelegation { grantor, grantee, permissions, validFrom, validTo }
```

### 🏢 المستأجر والإعدادات:
```prisma
TenantAccount { userEmail, subdomain, orgName, vatNumber, status, clerkUserId, plan }
DesktopLicense { tenantId, licenseKey, hardwareId, status, trialEndsAt, expiresAt }
TenantFeatureFlag { tenantId, moduleName, isEnabled }
Setting { key, value }
Branch { name, address, manager }
```

### 💰 المحاسبة:
```prisma
Account { code, name, type, parentId, balance, zakatCategory, controlAccount }
JournalEntry { entryNumber, entryDate, totalDebit, totalCredit, status, source, deletedAt }
JournalLine { entryId, accountId, debit, credit, foreignDebit, foreignCredit, 
              costCenterId, profitCenterId, projectId, segmentId,
              customerId, supplierId, employeeId, assetId, productId, quantity, uom }
CostCenter { code, name, manager }
ProfitCenter { code, name, parentId }
Segment { code, type, name }
Currency { code, rate, active }
ExchangeRate { fromCurrencyId, toCurrencyId, rate, effectiveDate }
FxRevaluationRun { period, status, totalGain, totalLoss }
```

### 📈 CO-PA (محاسبة الأرباح):
```prisma
CopaCharacteristic { code, name, type } // Customer/Product/Region/Segment/Custom
CopaValueField { code, name, aggregation } // SUM/AVG/COUNT
CopaDocument { profitCenterId, characteristicValues }
CopaAllocationRule { fromCenter, toCenter, allocationKey, percentage }
```

### 🛒 المبيعات:
```prisma
SalesInvoice {
    invoiceNo, date, customerId, subtotal, discountValue, taxValue, total,
    zatcaStatus, zatcaHash, zatcaQr, zatcaXml, zatcaUuid, zatcaIcv, zatcaPih,
    zatcaSignedXml, zatcaReportedAt, cleared, clearedAt, clearanceUuid,
    deletedAt
}
SalesInvoiceDetail { invoiceId, productId, quantity, price, discountValue, taxValue }
SalesReturn { returnNo, originalInvoiceId, status, restockingFee, zatcaStatus }
SalesReturnDetail { returnId, productId, quantity, reason, condition }
SalesOrder { orderNo, customerId, date, status }
DeliveryNote { salesOrderId, customerId, deliveryDate }
PriceQuote { quoteNo, customerId, validUntil, status }
QuotationItem { quotationId, productId, quantity, price }
```

### 🛍 المشتريات:
```prisma
PurchaseRequisition { requisitionNo, requesterId, status, totalAmount }
RequestForQuotation { rfqNo, supplierId, status }
PurchaseOrder { orderNo, supplierId, date, status, approvedBy }
PurchaseInvoice { invoiceNo, supplierId, date, subtotal, taxValue, total, zatcaStatus }
PurchaseReturn { returnNo, originalInvoiceId, status }
GoodsReceiptNote { grnNo, supplierId, warehouseId, status }
SupplierContract { supplierId, contractNo, startDate, endDate, status }
```

### 📦 المخزون:
```prisma
Product { name, barcode, categoryId, buyPrice, sellPrice, taxRate, minQuantity, currentStock, deletedAt }
ProductUnit { productId, unitId, sellPrice, factor, isBase, parentUnitId }
ProductVariant { productId, variantName, sku, price }
ProductSerialNumber { productId, serialNumber, stockId, binId, status }
ProductBatch { productId, batchNo, expiryDate, quantity }
Category { name, parentId }
Unit { name }
Stock { warehouse, name, address, active } // هذا هو الـ Warehouse
ProductStock { productId, stockId, binId, quantity } // مخزون لكل مستودع
StockMovement { sourceStockId, destinationStockId, productId, quantity, reference }
StockTransfer { sourceStockId, destinationStockId, date, status }
Stocktake { warehouseId, status, countedDate }
StocktakeItem { stocktakeId, productId, quantity, variance }
WarehouseZone { stockId, zoneName }
WarehouseBin { zoneId, binCode, capacity }
```

### 🏭 التصنيع:
```prisma
Recipe { productId, recipeNo, status } // BOM
RecipeIngredient { recipeId, rawProductId, quantity }
RecipeOperation { recipeId, operationNo, workCenterId, duration }
RecipeByProduct { recipeId, byProductId, quantity }
ManufacturingOrder { moNo, productId, quantity, status, createdDate }
ManufacturingWastage { moId, productId, quantity, reason }
ManufacturingCost { moId, costType, amount }
WorkCenter { workCenterNo, name, capacity }
Machine { machineNo, status, location }
MachineMaintenance { machineId, maintenanceType, status }
MachineTelemetry { machineId, metric, value, recordedAt }
QualityCheck { moId, status, checkedDate }
```

### 👥 الموارد البشرية:
```prisma
Employee { employeeNo, fullName, email, department, position, salary, status, deletedAt }
Salary { employeeId, month, baseSalary, deductions, netSalary }
Attendance { employeeId, date, checkIn, checkOut, status }
Vacation { employeeId, type, startDate, endDate, daysRequested }
EmployeeLoan { employeeId, loanAmount, installments, status }
EndOfServiceCalculation { employeeId, exitDate, severanceDays, totalAmount }
PayrollRun { payrollMonth, status, totalAmount }
PayrollInvoice { invoiceNo, status, total }
WPSBatch { batchNo, status, totalAmount }
WPSBatchItem { batchId, employeeId, grossSalary }
GOSIContribution { batchId, employeeId, gosiAmount }
GOSIMonthlyFile { fileNo, month, status, submittedAt, paidAt }
```

### 🏗 الأصول الثابتة:
```prisma
FixedAsset { assetNo, assetCategoryId, purchaseDate, cost, quantity, depreciationMethod, status, deletedAt }
FixedAssetCategory { categoryName, depreciationRate }
AssetDepreciationLog { assetId, depreciationAmount, depreciationDate }
AssetImpairmentRecord { assetId, impairmentAmount, reason }
AssetTransferRecord { assetId, fromLocationId, toLocationId }
AssetMaintenanceRecord { assetId, maintenanceDate, cost }
AssetInsuranceClaim { assetId, claimNo, amount, status }
AssetReclassification { assetId, fromCategoryId, toCategoryId }
AssetDocument { assetId, documentType, fileUrl }
```

### 🏦 الخزينة والبنوك:
```prisma
BankAccount { accountNo, accountHolderName, balance, bankId, accountType, currency, status }
BankTransaction { bankAccountId, date, amount, description, reference, type }
BankStatement { bankAccountId, statementNo, fromDate, toDate, status }
BankStatementLine { statementId, reference, amount, description, lineNo }
BankReconciliation { bankAccountId, status, reconciledAmount, reconciledDate }
BankReconMatch { journalLineId, statementLineId }
Treasury { userId, amount, date, narration }
CheckTransaction { customerId, supplierId, checkNo, amount, status }
PettyCashFund { fundName, currentBalance }
PettyCashTransaction { fundId, amount, description, date }
```

### 👤 العملاء والموردين (نموذج واحد):
```prisma
Customer { 
    name, phone, email,
    type, // 0=customer, 1=supplier, 2=both
    balance, creditLimit, taxNumber, crNo, status,
    // ائتمان وتحصيل:
    dunningCurrentLevel, dunningLastRunAt, dunningSnoozeUntil, creditHold,
    // الكشوف:
    emailStatementsEnabled, statementFrequency, statementChannel,
    // ضريبة المصدر (للموردين الأجانب):
    isForeignVendor, whtCountryCode, whtTaxResidencyCert,
    deletedAt
}
```

### 🇸🇦 ZATCA:
```prisma
ZATCARecord { 
    invoiceId, invoiceType, // POS/RENT/SCHOOL/PAYROLL
    zatcaHash, zatcaQr, zatcaResponse, zatcaXml,
    tenantAccountId 
}
```

### ✅ الموافقات:
```prisma
ApprovalRule { documentType, approverUserId, requiresApproval }
ApprovalRequest { documentId, requesterId, status, requestedAt }
ApprovalStep { requestId, stepNo, approverId, status }
```

---

## 🛑 قواعد صارمة (Strict Rules)

### ❌ ممنوع:
1. **`new PrismaClient()` مباشرة** — استخدم `getPrisma(req)` أو `getClient(tenant)` فقط
2. **`prisma migrate dev`** — استخدم `prisma db push` فقط (قواعد متعددة)
3. **Hard Delete للسجلات المالية** — استخدم Soft Delete
4. **استخدام Float للمبالغ** — استخدم `Decimal` (scale ≥ 4)
5. **استدعاء قاعدة Master من API tenant** — استخدم قاعدة الـ tenant
6. **تخطي Audit Middleware** — كل تغيير يجب أن يُسجل
7. **N+1 Queries** — استخدم `include` و `select` بحكمة

### ✅ مطلوب:
1. **استخدام Transactions** للعمليات متعددة الجداول:
   ```typescript
   await prisma.$transaction(async (tx) => {
       await tx.salesInvoice.create({...});
       await tx.journalEntry.create({...});
       await tx.product.update({...}); // تخفيض المخزون
   }, { isolationLevel: 'Serializable' }); // للترقيم
   ```

2. **Pagination إجبارية:**
   ```typescript
   prisma.product.findMany({ skip, take: 50, orderBy: {...} })
   ```

3. **Indexes للحقول المُفلترة:**
   ```prisma
   @@index([tenantId, status])
   @@index([customerId, invoiceDate])
   ```

4. **Decimal للأرقام المالية:**
   ```prisma
   amount Decimal @db.Decimal(18, 4)
   ```

5. **SERIALIZABLE للترقيم:**
   ```typescript
   prisma.$transaction(async (tx) => {
       const counter = await tx.counter.findUnique({where:{key}, ...});
       await tx.counter.update({where:{key}, data:{value: counter.value + 1}});
   }, { isolationLevel: 'Serializable' });
   ```

---

## 🔄 سيناريوهات حسابية شائعة

### إضافة سجل (Create):
```
1. النموذج يصل → Zod validation
2. getPrisma(req) → Client للـ tenant الحالي
3. prisma.model.create({data})
4. Soft Delete middleware: لا شيء (CREATE)
5. Audit middleware: يكتب AuditLog (action: CREATE, diff: data)
6. RLS Extension: يحقن tenantId='default' (Phase 2) أو tenantId='n11' (Legacy)
7. PostgreSQL INSERT
8. NextResponse.json(result)
```

### قراءة قائمة (Read):
```
1. prisma.model.findMany({where, take: 50, skip})
2. Soft Delete middleware: يضيف where.deletedAt = null
3. Audit: يتجاوز (read only)
4. RLS Extension: يضيف where.tenantId
5. PostgreSQL SELECT ... WHERE tenant_id=... AND deleted_at IS NULL LIMIT 50
6. NextResponse.json([results])
```

### حذف (Soft Delete):
```
1. prisma.salesInvoice.delete({where:{id}})
2. Soft Delete middleware: يحول إلى:
   prisma.salesInvoice.update({where:{id}, data:{deletedAt: new Date()}})
3. Audit middleware: يسجل action=DELETE
4. PostgreSQL UPDATE
```

### Transaction معقد (إنشاء فاتورة):
```typescript
await prisma.$transaction(async (tx) => {
    // 1. إنشاء الفاتورة
    const invoice = await tx.salesInvoice.create({...});
    
    // 2. إنشاء بنود الفاتورة
    await tx.salesInvoiceDetail.createMany({...});
    
    // 3. تخفيض المخزون
    for (const item of items) {
        await tx.productStock.update({
            where: { productId_stockId: {...} },
            data: { quantity: { decrement: item.quantity } }
        });
    }
    
    // 4. إنشاء قيد محاسبي تلقائي
    await postSalesInvoice(invoice.id, tx);  // من auto-journal.ts
    
    return invoice;
});
```

---

## ⚙️ توليد Client

```bash
npx prisma generate           # توليد Prisma Client
npx prisma db push            # تحديث الـ schema بدون migration
npx prisma db push --schema=prisma/schema.prisma --accept-data-loss
npx prisma studio             # واجهة الـ Browser
```

**ملاحظة:** عند التحديث للمستأجرين، يجب تنفيذ `prisma db push` على كل قاعدة. سكريبت `deploy.js --db-push` يقوم بذلك تلقائياً.
