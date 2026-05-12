---
version: 1.0
last_updated: 2026-05-12
---

# Sample Data & Seeders

## استراتيجية البيانات التجريبية

كل tenant جديد يستلم:
1. **Mandatory seed:** SOCPA Chart of Accounts، Saudi VAT codes، locale settings
2. **Optional industry pack:** يختار من 8 packs حسب نشاط الشركة
3. **Stress test data:** للـ staging فقط (مليون+ سجل)

## Industry Packs

| Pack | الوصف | Tables seeded | الحجم |
|---|---|---|---|
| `retail` | متجر تجزئة | 200 products, 4 branches, 30 staff | medium |
| `restaurant` | مطاعم | menu, recipes, tables, KDS | medium |
| `clinic` | عيادة | doctors, services, rooms | small |
| `pharmacy` | صيدلية | drugs, batches, controlled-substance | medium |
| `school` | مدرسة | students, classes, fees | small |
| `manufacturing` | تصنيع SME | BOMs, work centers, machines | large |
| `trading` | تجارة عامة | suppliers, products, multi-currency | medium |
| `services` | خدمات | projects, milestones, time tracking | small |

## Seed Script Architecture

```
scripts/seed/
├── _base/
│   ├── currencies.ts        # SAR, USD, EUR, AED, ...
│   ├── countries.ts          # countries.json
│   ├── account-types.ts      # SOCPA categories
│   ├── tax-codes.ts          # VAT codes
│   ├── unit-of-measure.ts    # UOM library
│   └── permissions.ts        # role→permission mapping
├── _socpa-coa.ts             # full SOCPA chart of accounts
├── _saudi-locale.ts          # holidays, weekend, calendar settings
├── industry/
│   ├── retail.ts
│   ├── restaurant.ts
│   ├── clinic.ts
│   └── ...
├── demo-tenants/
│   ├── ahmed-restaurant.ts   # full demo tenant
│   ├── alkhairat-pharmacy.ts
│   └── ...
└── stress-test/
    ├── million-invoices.ts
    ├── thousand-tenants.ts
    └── ...
```

## SOCPA Chart of Accounts (Sample)

```typescript
// scripts/seed/_socpa-coa.ts
export const SOCPA_COA = [
  // ==== ASSETS (1xxx) ====
  { code: '1000', name: 'Assets', nameAr: 'الأصول', type: 'ASSET', isHeader: true },
  
  // Current Assets
  { code: '1100', name: 'Current Assets', nameAr: 'الأصول المتداولة', parent: '1000', isHeader: true },
  { code: '1101', name: 'Cash on Hand', nameAr: 'النقدية في الصندوق', parent: '1100', type: 'ASSET', subType: 'CASH' },
  { code: '1102', name: 'Bank Accounts', nameAr: 'الحسابات البنكية', parent: '1100', type: 'ASSET', subType: 'BANK' },
  { code: '1103', name: 'Petty Cash', nameAr: 'العهد', parent: '1100', type: 'ASSET', subType: 'CASH' },
  { code: '1110', name: 'Accounts Receivable', nameAr: 'الذمم المدينة', parent: '1100', type: 'ASSET', subType: 'AR', isControl: true },
  { code: '1111', name: 'AR - Trade', nameAr: 'ذمم تجارية', parent: '1110', type: 'ASSET', subType: 'AR' },
  { code: '1112', name: 'AR - Notes', nameAr: 'أوراق قبض', parent: '1110', type: 'ASSET', subType: 'AR' },
  { code: '1113', name: 'AR - Allowance for Doubtful Accounts', nameAr: 'مخصص الديون المشكوك بها', parent: '1110', type: 'ASSET', isContra: true },
  { code: '1120', name: 'Inventory', nameAr: 'المخزون', parent: '1100', type: 'ASSET', subType: 'INVENTORY', isControl: true },
  { code: '1121', name: 'Raw Materials', nameAr: 'مواد خام', parent: '1120', type: 'ASSET' },
  { code: '1122', name: 'WIP', nameAr: 'تحت التشغيل', parent: '1120', type: 'ASSET' },
  { code: '1123', name: 'Finished Goods', nameAr: 'منتج تام', parent: '1120', type: 'ASSET' },
  { code: '1124', name: 'Stock Adjustment', nameAr: 'تسوية مخزون', parent: '1120', type: 'ASSET' },
  { code: '1130', name: 'Prepaid Expenses', nameAr: 'مصاريف مدفوعة مقدماً', parent: '1100', type: 'ASSET' },
  { code: '1131', name: 'Prepaid Rent', nameAr: 'إيجار مدفوع مقدماً', parent: '1130', type: 'ASSET' },
  { code: '1132', name: 'Prepaid Insurance', nameAr: 'تأمين مدفوع مقدماً', parent: '1130', type: 'ASSET' },
  { code: '1140', name: 'Input VAT', nameAr: 'ضريبة قيمة مضافة قابلة للاسترداد', parent: '1100', type: 'ASSET' },
  
  // Non-Current Assets
  { code: '1200', name: 'Non-Current Assets', nameAr: 'الأصول غير المتداولة', parent: '1000', isHeader: true },
  { code: '1210', name: 'Fixed Assets', nameAr: 'الأصول الثابتة', parent: '1200', type: 'ASSET' },
  { code: '1211', name: 'Land', nameAr: 'أراضي', parent: '1210', type: 'ASSET' },
  { code: '1212', name: 'Buildings', nameAr: 'مباني', parent: '1210', type: 'ASSET' },
  { code: '1213', name: 'Machinery', nameAr: 'آلات ومعدات', parent: '1210', type: 'ASSET' },
  { code: '1214', name: 'Vehicles', nameAr: 'سيارات ومركبات', parent: '1210', type: 'ASSET' },
  { code: '1215', name: 'Furniture', nameAr: 'أثاث ومفروشات', parent: '1210', type: 'ASSET' },
  { code: '1216', name: 'Computers', nameAr: 'أجهزة كمبيوتر', parent: '1210', type: 'ASSET' },
  { code: '1219', name: 'Accumulated Depreciation', nameAr: 'مجمع الإهلاك', parent: '1210', type: 'ASSET', isContra: true },
  { code: '1220', name: 'Intangible Assets', nameAr: 'الأصول غير الملموسة', parent: '1200', type: 'ASSET' },
  { code: '1221', name: 'Software', nameAr: 'برامج', parent: '1220', type: 'ASSET' },
  { code: '1222', name: 'Trademarks', nameAr: 'علامات تجارية', parent: '1220', type: 'ASSET' },
  { code: '1223', name: 'Goodwill', nameAr: 'شهرة', parent: '1220', type: 'ASSET' },
  { code: '1229', name: 'Accumulated Amortization', nameAr: 'مجمع الإطفاء', parent: '1220', type: 'ASSET', isContra: true },
  
  // ==== LIABILITIES (2xxx) ====
  { code: '2000', name: 'Liabilities', nameAr: 'الخصوم', type: 'LIABILITY', isHeader: true },
  
  // Current Liabilities
  { code: '2100', name: 'Current Liabilities', nameAr: 'الخصوم المتداولة', parent: '2000', isHeader: true },
  { code: '2110', name: 'Accounts Payable', nameAr: 'الذمم الدائنة', parent: '2100', type: 'LIABILITY', subType: 'AP', isControl: true },
  { code: '2111', name: 'AP - Trade', nameAr: 'ذمم تجارية دائنة', parent: '2110', type: 'LIABILITY' },
  { code: '2112', name: 'AP - Notes', nameAr: 'أوراق دفع', parent: '2110', type: 'LIABILITY' },
  { code: '2120', name: 'Accrued Expenses', nameAr: 'مصاريف مستحقة', parent: '2100', type: 'LIABILITY' },
  { code: '2121', name: 'Accrued Wages', nameAr: 'أجور مستحقة', parent: '2120', type: 'LIABILITY' },
  { code: '2122', name: 'Accrued GOSI', nameAr: 'تأمينات مستحقة', parent: '2120', type: 'LIABILITY' },
  { code: '2130', name: 'Output VAT', nameAr: 'ضريبة قيمة مضافة مستحقة', parent: '2100', type: 'LIABILITY' },
  { code: '2140', name: 'WHT Payable', nameAr: 'ضريبة استقطاع', parent: '2100', type: 'LIABILITY' },
  { code: '2150', name: 'Wages Payable', nameAr: 'رواتب مستحقة', parent: '2100', type: 'LIABILITY' },
  { code: '2160', name: 'GR/IR Clearing', nameAr: 'استلام بضائع/فواتير', parent: '2100', type: 'LIABILITY', isControl: true },
  { code: '2170', name: 'Customer Advances', nameAr: 'دفعات مقدمة من العملاء', parent: '2100', type: 'LIABILITY' },
  { code: '2180', name: 'Deferred Revenue', nameAr: 'إيرادات مؤجلة', parent: '2100', type: 'LIABILITY' },
  { code: '2190', name: 'Loyalty Liability', nameAr: 'التزامات ولاء', parent: '2100', type: 'LIABILITY' },
  
  // Non-Current Liabilities
  { code: '2200', name: 'Non-Current Liabilities', nameAr: 'الخصوم غير المتداولة', parent: '2000', isHeader: true },
  { code: '2210', name: 'Long-term Loans', nameAr: 'قروض طويلة الأجل', parent: '2200', type: 'LIABILITY' },
  { code: '2220', name: 'End of Service Provision', nameAr: 'مخصص نهاية الخدمة', parent: '2200', type: 'LIABILITY' },
  { code: '2230', name: 'Deferred Tax Liability', nameAr: 'ضرائب مؤجلة', parent: '2200', type: 'LIABILITY' },
  { code: '2240', name: 'Zakat Provision', nameAr: 'مخصص الزكاة', parent: '2200', type: 'LIABILITY' },
  
  // ==== EQUITY (3xxx) ====
  { code: '3000', name: 'Equity', nameAr: 'حقوق الملكية', type: 'EQUITY', isHeader: true },
  { code: '3100', name: 'Share Capital', nameAr: 'رأس المال', parent: '3000', type: 'EQUITY' },
  { code: '3200', name: 'Reserves', nameAr: 'الاحتياطيات', parent: '3000', type: 'EQUITY' },
  { code: '3210', name: 'Statutory Reserve', nameAr: 'احتياطي نظامي', parent: '3200', type: 'EQUITY' },
  { code: '3220', name: 'General Reserve', nameAr: 'احتياطي عام', parent: '3200', type: 'EQUITY' },
  { code: '3230', name: 'Revaluation Surplus (OCI)', nameAr: 'فائض إعادة التقييم', parent: '3200', type: 'EQUITY' },
  { code: '3300', name: 'Retained Earnings', nameAr: 'الأرباح المحتجزة', parent: '3000', type: 'EQUITY' },
  { code: '3400', name: 'Current Year Profit/Loss', nameAr: 'ربح/خسارة السنة الجارية', parent: '3000', type: 'EQUITY' },
  
  // ==== REVENUE (4xxx) ====
  { code: '4000', name: 'Revenue', nameAr: 'الإيرادات', type: 'REVENUE', isHeader: true },
  { code: '4100', name: 'Sales Revenue', nameAr: 'إيرادات المبيعات', parent: '4000', type: 'REVENUE' },
  { code: '4110', name: 'Goods Sales', nameAr: 'مبيعات بضاعة', parent: '4100', type: 'REVENUE' },
  { code: '4120', name: 'Service Revenue', nameAr: 'إيرادات خدمات', parent: '4100', type: 'REVENUE' },
  { code: '4190', name: 'Sales Returns & Allowances', nameAr: 'مردودات ومسموحات', parent: '4100', type: 'REVENUE', isContra: true },
  { code: '4200', name: 'Other Revenue', nameAr: 'إيرادات أخرى', parent: '4000', type: 'REVENUE' },
  { code: '4210', name: 'Interest Income', nameAr: 'إيرادات فوائد', parent: '4200', type: 'REVENUE' },
  { code: '4220', name: 'FX Gain', nameAr: 'أرباح فروقات عملة', parent: '4200', type: 'REVENUE' },
  { code: '4230', name: 'Gain on Disposal', nameAr: 'أرباح بيع أصول', parent: '4200', type: 'REVENUE' },
  
  // ==== EXPENSES (5xxx) ====
  { code: '5000', name: 'Expenses', nameAr: 'المصاريف', type: 'EXPENSE', isHeader: true },
  { code: '5100', name: 'Cost of Goods Sold', nameAr: 'تكلفة البضاعة المباعة', parent: '5000', type: 'EXPENSE' },
  { code: '5101', name: 'COGS - Goods', nameAr: 'تكلفة بضاعة', parent: '5100', type: 'EXPENSE' },
  { code: '5102', name: 'COGS - Services', nameAr: 'تكلفة خدمات', parent: '5100', type: 'EXPENSE' },
  { code: '5200', name: 'Operating Expenses', nameAr: 'المصاريف التشغيلية', parent: '5000', type: 'EXPENSE' },
  { code: '5210', name: 'Wage Expense', nameAr: 'مصاريف رواتب', parent: '5200', type: 'EXPENSE' },
  { code: '5211', name: 'Salaries', nameAr: 'رواتب', parent: '5210', type: 'EXPENSE' },
  { code: '5212', name: 'Allowances', nameAr: 'بدلات', parent: '5210', type: 'EXPENSE' },
  { code: '5213', name: 'Overtime', nameAr: 'إضافي', parent: '5210', type: 'EXPENSE' },
  { code: '5214', name: 'Employer GOSI', nameAr: 'حصة الشركة في التأمينات', parent: '5210', type: 'EXPENSE' },
  { code: '5215', name: 'End of Service Expense', nameAr: 'نهاية الخدمة', parent: '5210', type: 'EXPENSE' },
  { code: '5220', name: 'Rent', nameAr: 'إيجار', parent: '5200', type: 'EXPENSE' },
  { code: '5230', name: 'Utilities', nameAr: 'مرافق', parent: '5200', type: 'EXPENSE' },
  { code: '5231', name: 'Electricity', nameAr: 'كهرباء', parent: '5230', type: 'EXPENSE' },
  { code: '5232', name: 'Water', nameAr: 'مياه', parent: '5230', type: 'EXPENSE' },
  { code: '5233', name: 'Internet & Phone', nameAr: 'إنترنت وهاتف', parent: '5230', type: 'EXPENSE' },
  { code: '5240', name: 'Depreciation', nameAr: 'إهلاك', parent: '5200', type: 'EXPENSE' },
  { code: '5250', name: 'Bad Debt Expense', nameAr: 'ديون معدومة', parent: '5200', type: 'EXPENSE' },
  { code: '5260', name: 'Marketing & Advertising', nameAr: 'تسويق وإعلان', parent: '5200', type: 'EXPENSE' },
  { code: '5270', name: 'Travel & Entertainment', nameAr: 'سفر وضيافة', parent: '5200', type: 'EXPENSE' },
  { code: '5280', name: 'Bank Charges', nameAr: 'عمولات بنكية', parent: '5200', type: 'EXPENSE' },
  { code: '5290', name: 'Professional Fees', nameAr: 'أتعاب مهنية', parent: '5200', type: 'EXPENSE' },
  { code: '5300', name: 'Variance Accounts', nameAr: 'حسابات الانحرافات', parent: '5000', type: 'EXPENSE' },
  { code: '5310', name: 'Material Variance', nameAr: 'انحراف مواد', parent: '5300', type: 'EXPENSE' },
  { code: '5320', name: 'Labor Variance', nameAr: 'انحراف عمالة', parent: '5300', type: 'EXPENSE' },
  { code: '5330', name: 'Overhead Variance', nameAr: 'انحراف غير مباشر', parent: '5300', type: 'EXPENSE' },
  { code: '5400', name: 'Other Expenses', nameAr: 'مصاريف أخرى', parent: '5000', type: 'EXPENSE' },
  { code: '5410', name: 'FX Loss', nameAr: 'خسائر فروقات عملة', parent: '5400', type: 'EXPENSE' },
  { code: '5420', name: 'Interest Expense', nameAr: 'فوائد', parent: '5400', type: 'EXPENSE' },
  { code: '5430', name: 'Loss on Disposal', nameAr: 'خسائر بيع أصول', parent: '5400', type: 'EXPENSE' },
  { code: '5440', name: 'Zakat Expense', nameAr: 'مصاريف الزكاة', parent: '5400', type: 'EXPENSE' },
  { code: '5450', name: 'Income Tax Expense', nameAr: 'ضريبة دخل', parent: '5400', type: 'EXPENSE' },
];
```

## Sample Industry Pack: Restaurant

```typescript
// scripts/seed/industry/restaurant.ts
export async function seedRestaurantPack(tenantId: string) {
  // 1. Categories
  const categories = await prisma.category.createMany({
    data: [
      { tenantId, code: 'FOOD-HOT', name: 'Hot Food', nameAr: 'طعام ساخن' },
      { tenantId, code: 'FOOD-COLD', name: 'Cold Food', nameAr: 'طعام بارد' },
      { tenantId, code: 'BEV-HOT', name: 'Hot Beverages', nameAr: 'مشروبات ساخنة' },
      { tenantId, code: 'BEV-COLD', name: 'Cold Beverages', nameAr: 'مشروبات باردة' },
      { tenantId, code: 'DESSERT', name: 'Desserts', nameAr: 'حلويات' },
      { tenantId, code: 'SIDE', name: 'Sides', nameAr: 'إضافات' },
    ],
  });
  
  // 2. Products (50 items)
  const products = [
    { code: 'P001', name: 'Margherita Pizza', nameAr: 'بيتزا مارجريتا', price: 45, cost: 18, category: 'FOOD-HOT' },
    { code: 'P002', name: 'Pepperoni Pizza', nameAr: 'بيتزا بيبروني', price: 55, cost: 22, category: 'FOOD-HOT' },
    { code: 'P003', name: 'Cheeseburger', nameAr: 'تشيز برغر', price: 35, cost: 14, category: 'FOOD-HOT' },
    // ... 47 more
  ];
  // Insert with batches
  
  // 3. Restaurant tables
  await prisma.restaurantTable.createMany({
    data: Array.from({ length: 20 }, (_, i) => ({
      tenantId,
      number: i + 1,
      name: `طاولة ${i + 1}`,
      capacity: i < 10 ? 4 : 6,
      zoneId: i < 10 ? 'ground' : 'first',
      status: 'AVAILABLE',
    })),
  });
  
  // 4. Recipes (BOM for kitchen)
  // Margherita: 1 dough + 50g cheese + 30g sauce + 5 basil leaves
  // ...
  
  // 5. Staff
  await prisma.employee.createMany({
    data: [
      { tenantId, code: 'E001', name: 'Ahmed Ali', nameAr: 'أحمد علي', role: 'MANAGER', basicSalary: 8000 },
      { tenantId, code: 'E002', name: 'Khaled Ali', nameAr: 'خالد علي', role: 'CASHIER', basicSalary: 4500 },
      { tenantId, code: 'E003', name: 'Mohammed Sayed', nameAr: 'محمد سيد', role: 'CHEF', basicSalary: 7000 },
      // ...
    ],
  });
  
  // 6. Sample 30 days of POS transactions
  await seedPOSHistory(tenantId, { days: 30, transactionsPerDay: 150 });
}
```

## Stress Test Data

```typescript
// scripts/seed/stress-test/million-invoices.ts
export async function seedMillionInvoices(tenantId: string) {
  console.log('Generating 1M invoices over 3 years...');
  
  const customers = await seedCustomers(tenantId, 5000);
  const products = await seedProducts(tenantId, 500);
  
  const batchSize = 1000;
  const total = 1_000_000;
  const startDate = new Date('2023-01-01');
  const endDate = new Date();
  
  for (let i = 0; i < total; i += batchSize) {
    const batch = Array.from({ length: batchSize }, (_, j) => {
      const idx = i + j;
      const date = randomDateBetween(startDate, endDate);
      const lines = randomLines(products, randomInt(1, 8));
      return {
        tenantId,
        code: `INV-${String(idx).padStart(7, '0')}`,
        customerId: customers[idx % customers.length].id,
        invoiceDate: date,
        currency: 'SAR',
        subtotal: sumLines(lines, 'subtotal'),
        vatTotal: sumLines(lines, 'vat'),
        grandTotal: sumLines(lines, 'total'),
        status: 'POSTED',
        details: { create: lines },
      };
    });
    
    await prisma.salesInvoice.createMany({ data: batch });
    
    if (i % 10000 === 0) console.log(`${i} / ${total}`);
  }
  
  console.log('Done. Running ANALYZE...');
  await prisma.$executeRaw`ANALYZE`;
}
```

## CLI

```bash
# Seed a fresh tenant with industry pack
npm run seed -- --tenant=demo --pack=restaurant

# Reset and reseed development DB
npm run db:reset

# Stress test data (DEV ONLY)
npm run seed:stress

# Specific seeds
npm run seed:coa
npm run seed:permissions
npm run seed:countries-currencies
```
