# 57 - ترحيل البيانات من أنظمة أخرى (Data Migration)

> Excel + SAP B1 + Oracle + Onyx Pro + QuickBooks + Custom Systems

---

## 🎯 Migration Strategy

### المراحل:

```
1. Discovery       (فهم المصدر)
        ↓
2. Mapping         (ربط الحقول)
        ↓
3. Cleansing       (تنظيف البيانات)
        ↓
4. Test Migration  (اختبار)
        ↓
5. Reconciliation  (مطابقة)
        ↓
6. Cutover         (التبديل)
        ↓
7. Validation      (تأكيد)
        ↓
8. Post-Migration  (دعم)
```

---

## 📊 1. Migration من Excel

### الـ Use Case:
- شركات صغيرة تستخدم Excel
- بيانات أساسية (عملاء، منتجات، أرصدة افتتاحية)

### الـ Templates:
```
Excel Templates مُعدّة:
├── customers.xlsx
├── vendors.xlsx
├── products.xlsx
├── inventory-opening.xlsx
├── chart-of-accounts.xlsx
├── opening-balances.xlsx
└── employees.xlsx
```

### مثال: customers.xlsx
| Name | NameEn | Phone | Email | Tax Number | CR Number | Type | Balance |
|---|---|---|---|---|---|---|---|
| شركة الجاسم | Aljassim Co | 0501234567 | info@x.com | 300012345678903 | 7012345678 | B2B | 0 |

### الـ Import Process:
```typescript
// /api/import/customers
POST /api/import/customers
FormData: { file: customers.xlsx }

1. Parse XLSX (using exceljs)
2. Validate headers
3. For each row:
   - Validate VAT number (15 digits, starts/ends with 3)
   - Validate CR number (10 digits, starts with 7)
   - Validate phone format
4. Detect duplicates (by VAT or phone)
5. Show preview (5 rows + count + errors)
6. User confirms
7. Bulk insert (transactions)
8. Report:
   - Imported: 500
   - Skipped (duplicate): 12
   - Errors: 3 (list)
```

### النموذج:
```typescript
async function importCustomers(file: Buffer) {
    const workbook = await ExcelJS.readFromBuffer(file);
    const sheet = workbook.worksheets[0];
    
    const customers = [];
    const errors = [];
    
    sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // header
        
        try {
            const customer = {
                name: row.getCell(1).value,
                nameEn: row.getCell(2).value,
                phone: validatePhone(row.getCell(3).value),
                email: validateEmail(row.getCell(4).value),
                taxNumber: validateVAT(row.getCell(5).value),
                crNo: validateCR(row.getCell(6).value),
                type: row.getCell(7).value === 'B2B' ? 1 : 0,
                balance: Number(row.getCell(8).value) || 0
            };
            customers.push(customer);
        } catch (e) {
            errors.push({ row: rowNumber, error: e.message });
        }
    });
    
    if (errors.length > 0) {
        return { preview: customers.slice(0, 5), errors, status: 'preview' };
    }
    
    await prisma.customer.createMany({ data: customers });
    return { imported: customers.length, status: 'success' };
}
```

---

## 🏢 2. Migration من SAP Business One

### الـ Approach:
- Export from SAP via Service Layer (REST API)
- Or DI Server (older method)
- Convert SAP entities → NamaInvest entities

### الـ Mapping:
| SAP B1 | NamaInvest |
|---|---|
| OCRD (Business Partners) | Customer (type=0 or 1) |
| OITM (Items) | Product |
| OACT (Chart of Accounts) | Account |
| OJDT (Journal Entries) | JournalEntry |
| OINV (Sales Invoices) | SalesInvoice |
| OPCH (Purchase Invoices) | PurchaseInvoice |
| OWHS (Warehouses) | Stock |
| ORCT (Incoming Payments) | PaymentTransaction (incoming) |
| OVPM (Outgoing Payments) | PaymentTransaction (outgoing) |
| OHEM (Employees) | Employee |

### النماذج الفرعية:
| SAP | NamaInvest |
|---|---|
| RDR1 (Sales Order Lines) | SalesOrderDetail |
| INV1 (Invoice Lines) | SalesInvoiceDetail |
| JDT1 (Journal Lines) | JournalLine |

### الـ Script Example:
```typescript
// scripts/migrate-from-sap-b1.ts
async function migrateFromSAPB1() {
    // Connect to SAP Service Layer
    const sap = await sapLogin({
        url: process.env.SAP_SL_URL,
        username, password, companyDB
    });
    
    // 1. Customers
    const sapCustomers = await sap.get('/BusinessPartners');
    for (const sc of sapCustomers) {
        await prisma.customer.create({
            data: {
                name: sc.CardName,
                taxNumber: sc.FederalTaxID,
                crNo: sc.AdditionalID,
                type: sc.CardType === 'cCustomer' ? 0 : 1,
                balance: sc.CurrentAccountBalance,
                creditLimit: sc.CreditLimit,
                paymentTerms: sc.PaymentMethodCode,
                // ...
            }
        });
    }
    
    // 2. Products
    // 3. Chart of Accounts
    // 4. Opening Balances
    // 5. Open Invoices (AR/AP)
    // 6. Historical transactions (optional, can be summarized)
    
    log.info('SAP migration completed');
}
```

### Challenges:
- ⚠️ SAP له ICV/numbering مختلف
- ⚠️ Tax codes غير متطابقة 100%
- ⚠️ COA structure مختلف
- ⚠️ بعض الحقول لا يوجد لها equivalent

### Best Practice:
- Migrate كل entity على حدة
- ابدأ بـ master data (customers, products)
- ثم opening balances
- ثم open transactions
- ثم historical (إن needed)

---

## 💼 3. Migration من Oracle EBS / Oracle Cloud

### الـ Approach:
- Oracle REST APIs (NetSuite-like)
- أو direct DB query (إذا access)
- أو CSV export from Oracle

### Common Issues:
- Oracle uses Date format MM/DD/YYYY (US)
- NamaInvest uses DD/MM/YYYY أو ISO
- Decimal points vs commas
- Account hierarchy عميق (Segment-based)

---

## 🧾 4. Migration من Onyx Pro (شائع في السعودية)

### الـ Approach:
- Onyx يخزن في MS Access أو SQL Server
- استخدم Excel export
- Or direct DB query

### الـ Mapping:
| Onyx | NamaInvest |
|---|---|
| Customers | Customer (type=0) |
| Suppliers | Customer (type=1) |
| Items | Product |
| Stocks | Stock (warehouse) |
| Sales Invoices | SalesInvoice |
| Purchase Invoices | PurchaseInvoice |
| Receipt Vouchers | PaymentTransaction (incoming) |
| Payment Vouchers | PaymentTransaction (outgoing) |
| Journal Vouchers | JournalEntry |

### تفاصيل سعودية:
- Onyx يدعم ZATCA Phase 1 فقط
- النقل لـ Phase 2 يحتاج CSID onboarding جديد
- ICV reset أو continue من Onyx

---

## 📚 5. Migration من QuickBooks

### الـ Approach:
- QuickBooks Online: REST API
- QuickBooks Desktop: IIF files أو SDK

### Notable:
- QuickBooks مش مصمم للسعودية (لا ZATCA)
- يحتاج setup VAT manually
- COA يحتاج تعديل لـ SOCPA

---

## ⚙️ 6. Migration من نظام مخصص (Custom System)

### الـ Approach الكامل:

#### Phase 1: Discovery (1-2 أسبوع)
```
1. مقابلات مع المستخدمين
2. فهم الـ schema الحالي
3. توثيق الـ business rules
4. تحديد الـ data quality issues
5. تحديد الـ scope (full vs partial)
```

#### Phase 2: Mapping (1 أسبوع)
```
1. Field-by-field mapping
2. Data type conversions
3. Default values for missing
4. Handling of edge cases
5. تطوير الـ migration scripts
```

#### Phase 3: Cleansing (1-2 أسبوع)
```
- إزالة duplicates
- توحيد التنسيقات (phone, IBAN, dates)
- ملء الـ null values
- إصلاح الـ broken references
- تنظيف الـ unused records
```

#### Phase 4: Test Migration (1 أسبوع)
```
1. Run in staging
2. تحقق من الأعداد:
   - Customers count
   - Products count
   - Balance reconciliation
3. Random sample testing
4. Performance testing
```

#### Phase 5: Reconciliation
```
1. AR Reconciliation:
   - Old system AR balance == New system AR balance
2. AP Reconciliation
3. Inventory:
   - Quantity matches per product per warehouse
4. Cash:
   - Bank balances match
   - Petty cash matches
5. Trial Balance:
   - Total Dr = Total Cr in new system
6. P&L:
   - Revenue matches
   - Expenses match
```

#### Phase 6: Cutover (3-5 أيام)
```
Day 1:
- إيقاف النظام القديم (read-only)
- Final backup
- Run final migration script

Day 2:
- Validation
- User acceptance testing
- Fix issues

Day 3:
- Go-live in new system
- Old system available for read-only reference

Day 4-5:
- Support team standby
- Monitor for issues
- Quick fixes
```

#### Phase 7: Validation (أسبوع)
```
- Daily reconciliation
- User feedback
- Performance monitoring
```

#### Phase 8: Post-Migration (3 شهور)
```
- Old system retired
- Users trained
- Support cases
- Issue resolution
```

---

## 🎯 Common Challenges

### 1. حقول مفقودة في المصدر
```typescript
// إذا VAT number مفقود:
if (!customer.taxNumber) {
    // Option A: Skip (manual review)
    skipped.push(customer);
    
    // Option B: Use default
    customer.taxNumber = '300000000000003'; // placeholder
    customer.notes = 'TAX_NUMBER_PENDING_VERIFICATION';
}
```

### 2. Format Differences
```typescript
// Old: "0501234567"
// New: "+966501234567"
function normalizePhone(phone) {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('966')) return `+${cleaned}`;
    if (cleaned.startsWith('0')) return `+966${cleaned.slice(1)}`;
    return `+966${cleaned}`;
}
```

### 3. Currency Conversion
```typescript
// إذا النظام القديم بـ USD، النظام الجديد بـ SAR:
const rate = 3.75;
newAmount = oldAmount * rate;
// + حفظ معلومات السعر الأصلي
```

### 4. Date Format
```typescript
// US: "12/31/2025"
// ISO: "2025-12-31"
function parseDate(dateStr, format = 'US') {
    if (format === 'US') {
        const [m, d, y] = dateStr.split('/');
        return new Date(`${y}-${m}-${d}`);
    }
    return new Date(dateStr);
}
```

### 5. Historical Data
**Option A:** Full migration (5 سنوات)
- ✅ Complete reporting
- ❌ Slow migration, large DB

**Option B:** Opening Balances only
- ✅ Fast
- ❌ No history in new system
- البديل: keep old system for read-only

**Option C:** Summarized history
- شهري summary بدلاً من yearly detail
- يوازن بين الخيارين

---

## 🇸🇦 Saudi-Specific Considerations

### ZATCA Compliance:
- ⚠️ الفواتير القديمة (قبل Phase 2): تبقى كما هي
- ⚠️ الفواتير الجديدة: لازم ZATCA Phase 2
- ⚠️ ICV: ابدأ من 1 في النظام الجديد (لكل tenant)

### VAT Transitional:
- Beginning balances تشمل VAT Output/Input
- Open invoices: VAT يبقى كما هو
- New invoices: VAT يُحسب بـ Phase 2

### GOSI Continuity:
- موظفون مسجلون → ابقَ الاشتراك مستمر
- يحدّث في GOSI portal (مفصول عن النظام)
- في النظام: bring forward EOS provision

### WPS:
- نفس الـ Mudad employer ID
- لا تأثير

---

## 📋 Migration Checklist

### Pre-Migration:
- [ ] Discovery completed
- [ ] Mapping document approved
- [ ] Templates prepared
- [ ] Test environment ready
- [ ] Stakeholder communication plan
- [ ] Rollback plan defined
- [ ] Training plan for users

### During Migration:
- [ ] Final backup of old system
- [ ] Old system in read-only mode
- [ ] Migration scripts executed
- [ ] Data validation passed
- [ ] Reconciliation completed
- [ ] User acceptance testing done

### Post-Migration:
- [ ] Old system archived
- [ ] Users trained
- [ ] Support team ready
- [ ] Monitoring in place
- [ ] Documentation updated
- [ ] Lessons learned captured

---

## 🛠 Tools & Scripts

### الـ Migration Scripts:
```
/scripts/migrations/
├── from-excel.ts
├── from-sap-b1.ts
├── from-oracle.ts
├── from-onyx-pro.ts
├── from-quickbooks.ts
├── from-custom-db.ts
├── reconciliation.ts
├── validation.ts
└── rollback.ts
```

### الـ Endpoints:
```
POST /api/import/customers
POST /api/import/products
POST /api/import/accounts
POST /api/import/opening-balances
POST /api/import/employees
POST /api/import/journal-entries (historical)
```

### الـ Tools:
- **ExcelJS** — for XLSX
- **Papaparse** — for CSV
- **node-mssql** — for MS SQL Server (Onyx)
- **mysql2** — for MySQL
- **pg** — for PostgreSQL
- **node-firebird** — for Firebird

---

## 💰 Pricing Strategy

### Migration as Service:
- **Small (Excel only):** Free (self-service)
- **Medium (Onyx/QB):** 10,000-25,000 SAR
- **Large (SAP/Oracle):** 50,000-150,000 SAR
- **Custom Enterprise:** Custom quote

### What's Included:
- Discovery + Mapping
- Cleansing
- Test migration (×2)
- Production migration
- Validation + Reconciliation
- User training
- 30-day post-migration support

---

## 🎯 Best Practices

1. ✅ **ابدأ بـ small** (2-3 entities) قبل الـ full
2. ✅ **Reconciliation أهم** من السرعة
3. ✅ **Test في staging** كاملاً
4. ✅ **Old system available** for 3+ months
5. ✅ **User training** قبل go-live
6. ✅ **Document everything**
7. ✅ **Rollback plan** جاهز دائماً
8. ❌ **لا تـ rush** الـ migration
9. ❌ **لا تنسى GOSI/ZATCA** continuity
10. ✅ **Communicate transparently** مع العميل
