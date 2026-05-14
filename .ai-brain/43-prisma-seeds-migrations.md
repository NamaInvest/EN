# 43 - بذور وترحيلات Prisma (Seeds & Migrations)

> seed.ts + seed-accounts.ts + migrations + schema versioning

---

## 📁 هيكل `prisma/`

```
prisma/
├── schema.prisma                       ← الـ Schema الرئيسي (11,922 سطر, 607 جدول)
├── schema_decimal_migration.prisma     ← Migration للأنواع العشرية
├── seed.ts                              ← Seed الرئيسي
├── seed-accounts.ts                     ← Seed لشجرة الحسابات
├── seeds/                               ← Seed data files
│   ├── socpa-coa.json                   ← 88 SOCPA account
│   ├── industries.json
│   ├── cities.json
│   ├── countries.json
│   ├── currencies.json
│   ├── banks.json
│   ├── vat-categories.json
│   ├── default-permissions.json
│   ├── sample-products.json (dev only)
│   └── ...
└── migrations/                          ← Prisma migrations (تاريخية)
    ├── 20240101_initial/
    ├── 20240301_add_zatca_fields/
    ├── 20240501_phase2_multitenancy/
    └── ...
```

---

## 🌱 Seed Strategy

### الـ npm scripts:
```bash
npm run db:seed
# = npx tsx prisma/seed.ts

npm run db:setup
# = npx prisma db push && npx tsx prisma/seed.ts
```

### الـ Seed الرئيسي (`prisma/seed.ts`):
```typescript
async function main() {
    console.log('🌱 Seeding...');
    
    // 1. System-wide data
    await seedCurrencies();           // SAR, USD, EUR, AED, KWD, etc.
    await seedBanks();                // RJHI, SNB, BSFR, etc.
    await seedCountries();            // Saudi + GCC + global
    await seedCities();               // Saudi cities
    await seedIndustries();           // الصيدلة، التجزئة، إلخ
    
    // 2. Tenant-specific (for default tenant)
    await seedSocpaCoA();             // 88 حساب
    await seedVatCategories();        // S, Z, E, O, RC
    await seedDefaultPermissions();   // الصلاحيات الافتراضية
    await seedNumberSequences();      // INV-, PO-, PR-, etc.
    
    // 3. Admin user (default)
    await seedAdminUser();
    
    // 4. Sample data (development only)
    if (process.env.NODE_ENV === 'development') {
        await seedSampleProducts();
        await seedSampleCustomers();
        await seedSampleInvoices();
    }
    
    console.log('✅ Done');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
```

---

## 📊 Seed Files Detail

### 1. `seed-accounts.ts` (SOCPA Chart of Accounts):
```typescript
import { socpaCoA } from './seeds/socpa-coa.json';

export async function seedSocpaCoA() {
    for (const account of socpaCoA) {
        await prisma.account.upsert({
            where: { code: account.code },
            create: {
                code: account.code,
                name: account.nameAr,
                nameEn: account.nameEn,
                type: account.type,
                parentCode: account.parentCode,
                zakatCategory: account.zakatCategory,
                controlAccount: account.isControl
            },
            update: {}
        });
    }
}

// 88 حساب in socpa-coa.json:
// [
//   { "code": "1110", "nameAr": "النقدية في الصندوق", "nameEn": "Cash on Hand", "type": "ASSET", "parentCode": "1100", "zakatCategory": null, "isControl": false },
//   ...
// ]
```

### 2. `seeds/banks.json`:
```json
[
    { "code": "RJHI", "nameAr": "مصرف الراجحي", "nameEn": "Al Rajhi Bank", "swift": "RJHISARI" },
    { "code": "SNB", "nameAr": "البنك الأهلي السعودي", "nameEn": "Saudi National Bank", "swift": "NCBKSAJE" },
    { "code": "BSFR", "nameAr": "البنك السعودي الفرنسي", "nameEn": "Banque Saudi Fransi", "swift": "BSFRSARI" },
    { "code": "ANB", "nameAr": "البنك العربي الوطني", "nameEn": "Arab National Bank", "swift": "ARNBSARI" },
    { "code": "ALBI", "nameAr": "مصرف الإنماء", "nameEn": "Alinma Bank", "swift": "INMASARI" },
    { "code": "RIBL", "nameAr": "بنك الرياض", "nameEn": "Riyad Bank", "swift": "RIBLSARI" },
    // ... (10 بنوك سعودية)
]
```

### 3. `seeds/currencies.json`:
```json
[
    { "code": "SAR", "name": "Saudi Riyal", "symbol": "ر.س", "decimals": 2, "isBase": true },
    { "code": "USD", "name": "US Dollar", "symbol": "$", "decimals": 2, "isBase": false },
    { "code": "EUR", "name": "Euro", "symbol": "€", "decimals": 2, "isBase": false },
    { "code": "AED", "name": "UAE Dirham", "symbol": "د.إ", "decimals": 2, "isBase": false },
    // ...
]
```

### 4. `seeds/vat-categories.json`:
```json
[
    { "code": "S", "name": "Standard 15%", "rate": 0.15, "isDefault": true },
    { "code": "Z", "name": "Zero-rated", "rate": 0, "description": "Exports, intl transport" },
    { "code": "E", "name": "Exempt", "rate": 0, "description": "Financial services" },
    { "code": "O", "name": "Out of scope", "rate": 0 },
    { "code": "RC", "name": "Reverse Charge", "rate": 0.15, "description": "Foreign services" }
]
```

### 5. `seeds/default-permissions.json`:
```json
[
    { "role": "admin", "module": "*", "canView": true, "canAdd": true, "canEdit": true, "canDelete": true, "canPrint": true },
    { "role": "accountant", "module": "accounting", "canView": true, "canAdd": true, "canEdit": true, "canDelete": false, "canPrint": true },
    { "role": "cashier", "module": "pos", "canView": true, "canAdd": true, "canEdit": false, "canDelete": false, "canPrint": true },
    // ...
]
```

---

## 🔄 Provisioning Seed

### للـ Tenant الجديد (`provision/route.ts`):
عند إنشاء tenant جديد، يُزرع:

```typescript
const SETTINGS_KEYS = [
    'company_name', 'company_name_en',
    'tax_number', 'zatca_crn',
    'company_phone', 'company_address',
    'posFooterText',
    'zatca_industry', 'zatca_city_en', 'zatca_city',
    'zatca_district', 'zatca_street',
    'zatca_building', 'zatca_postal_code',
    'trialActive', 'trialEndsAt', 'maxTrialInvoices',
    'tax_rate',
    'POS_TAX_ENABLED', 'POS_TAX_INCLUSIVE',
    'branch_name_en'
];

async function seedTenantData(prisma) {
    // 21+ Settings
    await prisma.setting.createMany({
        data: SETTINGS_KEYS.map(key => ({ key, value: '...' }))
    });
    
    // مستخدم admin
    const adminUser = await prisma.user.create({
        data: {
            username: 'admin',
            passwordHash: await bcrypt.hash('admin7773', 10),
            role: 'admin'
        }
    });
    
    // الشركة + الفرع + المستودع + العميل النقدي + الوحدات
    const branch = await prisma.branch.create({
        data: { name: 'الفرع الرئيسي', address: '...' }
    });
    
    const stock = await prisma.stock.create({
        data: { warehouse: 'WH-001', name: 'المستودع الرئيسي', branchId: branch.id }
    });
    
    const cashCustomer = await prisma.customer.create({
        data: { name: 'عميل نقدي', type: 0, balance: 0 }
    });
    
    // وحدات أساسية
    await prisma.unit.createMany({
        data: [
            { name: 'حبة' }, { name: 'علبة' }, { name: 'كرتون' }, { name: 'كيلو' }, { name: 'لتر' }, { name: 'متر' }
        ]
    });
    
    // SOCPA CoA
    await seedSocpaCoA(prisma);
    
    // VAT categories
    await seedVatCategories(prisma);
}
```

---

## 🗄 Migrations Strategy

### القاعدة: **`prisma db push` فقط**

#### السبب:
- النظام multi-tenant مع قواعد فيزيائية متعددة
- `prisma migrate dev` لا تعمل مع DB-per-tenant
- نحتاج تطبيق نفس schema على عشرات/مئات القواعد

#### النشر:
```bash
node deploy.js --db-push
```

### السكريبت:
```javascript
// deploy.js (excerpt)
async function pushSchemaToAllTenants() {
    const tenants = await getAllTenants();
    
    for (const tenant of tenants) {
        const dbUrl = getDbUrl(tenant.subdomain);
        
        await ssh.exec(`
            cd ${MASTER_APP_PATH}
            DATABASE_URL="${dbUrl}" npx prisma@5.22.0 db push \\
                --schema=prisma/schema.prisma \\
                --accept-data-loss
        `);
    }
}
```

### `--accept-data-loss`:
- **خطير!** يقبل فقدان البيانات إذا كان التغيير breaking
- لكن مع Prisma، معظم التغييرات NON-breaking
- للـ breaking changes: استخدم migration يدوي

---

## ⚠️ Breaking Changes Handling

### عندما يلزم migration يدوي:
1. **حذف column مع بيانات:** `prisma db push --accept-data-loss` يحذفها
2. **تغيير type:** قد يفشل (مثلاً String → Int)
3. **إضافة NOT NULL field بدون default:** سيفشل

### الـ Workflow:
```sql
-- 1. أضف column nullable
ALTER TABLE customer ADD COLUMN new_field VARCHAR(255);

-- 2. املأ القيم القديمة
UPDATE customer SET new_field = 'default' WHERE new_field IS NULL;

-- 3. اجعلها NOT NULL
ALTER TABLE customer ALTER COLUMN new_field SET NOT NULL;

-- 4. الآن update schema.prisma:
-- new_field String   ← بدون ?

-- 5. ثم
npx prisma db push
```

### Schema Versioning:
```prisma
// في schema.prisma:
generator client {
    provider = "prisma-client-js"
    binaryTargets = ["native"]
}

datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
}
```

### الـ Decimal Migration (`schema_decimal_migration.prisma`):
- نسخة سابقة من schema
- توثّق التحول من Float → Decimal
- لا يُستخدم في الإنتاج (للمرجعية)

---

## 🌍 Multi-Tenant Migration Scenario

### عند إضافة column جديد:
```
1. Developer:
   - يعدّل schema.prisma
   - npx prisma generate (تحديث Client)
   - يكتب الكود الجديد
   - يختبر محلياً

2. PR + Code Review

3. الـ Master Owner:
   - يفتح Master Panel
   - يختار "Deploy with DB Push"
   - يحدد الـ tenants المتأثرة (default: الكل)

4. السيرفر:
   - git pull
   - npm run build (إذا UI)
   - لكل tenant:
     - prisma db push على قاعدته
   - pm2 restart

5. Verification:
   - Health check لكل tenant
   - Smoke tests
```

---

## 🔄 Rollback Strategy

### Schema Rollback:
```bash
# 1. عودة Git
git revert <commit-hash>

# 2. تطبيق schema القديم
node deploy.js --db-push

# ⚠️ لكن: بعض البيانات قد تُفقد!
# لذلك:
# - استخدم schema additive (إضافة فقط)
# - تجنب الحذف
```

### Data Backup قبل Migration:
```bash
# في cron yesterday:
pg_dump $TENANT_DB | gzip > backup-$TENANT-$(date +%Y%m%d).sql.gz

# للاستعادة:
gunzip < backup-$TENANT-$(date +%Y%m%d).sql.gz | psql $TENANT_DB
```

---

## 🧪 Testing Migrations

### Local Test:
```bash
# 1. Create test DB
createdb test_migration_db

# 2. Apply current production schema
DATABASE_URL=postgresql://localhost:5432/test_migration_db npx prisma db push

# 3. Seed sample data
DATABASE_URL=... npm run db:seed

# 4. Apply new schema
DATABASE_URL=... npx prisma db push --force-reset

# 5. Test if data preserved/migrated correctly
```

### Staging Test:
```bash
# على staging server:
node deploy.js --db-push --target staging-only

# تحقق من:
# - عدم فقدان بيانات
# - الـ API يعمل
# - الـ UI يعمل
# - JE تظل صحيحة
```

---

## 📋 Schema Best Practices

### ✅ Best Practices:
1. **Additive Changes:** أضف فقط، لا تحذف
2. **Nullable First:** field جديد nullable، ثم backfill، ثم NOT NULL
3. **Indexes Defaults:** `@@index([tenantId])` لكل جدول
4. **Decimal للأموال:** `@db.Decimal(18, 4)` دائماً
5. **Soft Delete:** `deletedAt DateTime?` للحساس
6. **CreatedAt / UpdatedAt:** للتدقيق
7. **Cascade مدروس:** `onDelete: Restrict` للـ FKs الحرجة
8. **No Floats:** لا تستخدم Float للأموال
9. **Unique constraints واضحة:** `@@unique([tenantId, code])`
10. **Comments:** علّق على الحقول الغامضة

### ❌ Anti-Patterns:
1. **Renaming columns:** ينتج عنه فقدان بيانات
2. **Type changes:** يفشل إذا البيانات غير compatible
3. **Removing NOT NULL:** غير ضروري عادة
4. **Renaming models:** Prisma يعتبره حذف + إضافة

---

## 🎯 الـ Seeds للـ Development

### مثال: Sample Products
```typescript
// prisma/seeds/sample-products.json
[
    {
        "name": "بيبسي 330مل",
        "barcode": "6281007028012",
        "buyPrice": 1.5,
        "sellPrice": 2.0,
        "categoryName": "مشروبات غازية"
    },
    // ... 100+ منتج
]
```

### Sample Customers:
```typescript
[
    { "name": "أحمد محمد", "phone": "0501234567", "balance": 0 },
    { "name": "شركة الأمل", "phone": "0501234568", "taxNumber": "300012345678903" },
    // ... 50+ عميل
]
```

### Sample Invoices:
- 100+ فاتورة بيع متنوعة
- 50+ فاتورة شراء
- 20+ مرتجع
- للاختبار + Demo

---

## 🎬 First-Time Setup

### للمشروع الجديد (Dev):
```bash
# 1. Clone
git clone <repo>
cd namasoft9-3-main

# 2. Install
npm install

# 3. Setup .env
cp .env.example .env
# Edit .env

# 4. Setup DB
createdb namasoft_dev
npm run db:push    # أو: npx prisma db push
npm run db:seed    # seed initial data

# 5. Start
npm run dev
```

### للـ Tenant الجديد (Production):
```
يحدث آلياً عبر /api/tenant/provision
```

---

## 🎯 Best Practices

1. ✅ **db push فقط** (لا migrate dev)
2. ✅ **Prisma 5.22.0** ثابت (no auto-update)
3. ✅ **Additive schema changes**
4. ✅ **Backup قبل أي migration**
5. ✅ **اختبر على staging أولاً**
6. ✅ **Seed data للـ defaults**
7. ✅ **Multi-tenant مع batch**
8. ❌ **لا --force-reset في production**
9. ❌ **لا تعديل migrations applied**
10. ✅ **Schema validation قبل deploy**
