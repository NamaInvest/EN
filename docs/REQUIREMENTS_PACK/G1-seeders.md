# G1 — Sample Data / Seeders

## الحالة الحالية
- `prisma/seed.ts` ✓
- `prisma/seed-accounts.ts` ✓ (SOCPA COA)
- `prisma/seeds/socpa-coa.json` ✓
- لا seeds قطاعية (11 vertical بدون بيانات)
- لا demo data لـ Phase A+B+C+D+E+F الجديدة

## الفجوة (مقابل SAP S/4 demo datasets — آلاف الصفوف)
- لا data لكل قطاع
- لا data للصفحات الجديدة (PDPL, SIEM, Mudad, Qiwa)
- لا reproducibility (random seeds)

## 🎯 Ready Prompt

```
المهمة: seeders قطاعية شاملة + demo data للصفحات الجديدة.

السياق:
- 607 Prisma model
- 11 vertical (pharmacy, clinic, school, restaurant, retail, manufacturing,
   fleet, realestate, construction, services, distribution)
- Phase A+B+C+D+E+F صفحات جديدة بحاجة لـ demo data

المخرجات:
1) Per-vertical seed packs:
   prisma/seeds/verticals/<vertical>/
   ├── 01-company.ts (Saudi entity)
   │   - VAT number 311xxxxxxx00003 format
   │   - GOSI registration
   │   - CR number
   │   - Realistic Saudi address (city/district/postal)
   │
   ├── 02-coa.ts (SOCPA chart adapted to vertical)
   │   - Pharmacy: "Drug Inventory", "DEA-Controlled"
   │   - Clinic: "Medical Supplies", "Patient AR"
   │   - Construction: "WIP", "Project Costs"
   │
   ├── 03-products.ts (100+ realistic SKUs)
   │   - Arabic names
   │   - Realistic prices (Pareto distribution)
   │   - Stock levels
   │   - Barcode (EAN-13)
   │
   ├── 04-customers.ts (50+, mix B2B+individual)
   │   - VAT/CR for B2B
   │   - Iqama for individuals
   │   - Phone +9665xxx
   │   - Credit limits varying (8 at 90%+ for at-risk demo!)
   │
   ├── 05-suppliers.ts (20+)
   │   - SARIE IBAN format
   │   - 3-4 foreign for WHT scenarios
   │
   ├── 06-employees.ts (15+)
   │   - Mix of Saudi/Expat
   │   - GOSI registered
   │   - Iqama numbers
   │   - **Mudad status mix**: ACTIVE/PENDING/SUSPENDED for demo
   │
   ├── 07-historical-txns.ts (12 months)
   │   - Invoices (sales + purchase)
   │   - Stock movements
   │   - Payroll runs
   │   - All via auto-journal.ts
   │
   └── 08-open-balances.ts
       - AR/AP aging buckets populated
       - Bank balances
       - Cash position

2) Phase A+B+C+D+E+F demo data:
   prisma/seeds/feature-demo.ts:
   - **3 PdplDataSubjectRequest**:
     - 1 RECEIVED (10 days ago)
     - 1 IN_PROGRESS (25 days ago, close to deadline)
     - 1 OVERDUE (35 days ago, red flag)
   - **2 PdplBreachIncident**:
     - 1 LOW severity, status CONTAINED
     - 1 CRITICAL, status DETECTED, **SDAIA notification PENDING** (demo 72h alert)
   - **5 audit events** for SIEM (various types/severities)
   - **5 WhtTransaction** with rates 5% / 15% / 20% / treaty-applied
   - **10 VatCategory** with proper ZATCA codes
   - **12 QiwaContract** mix (UNLIMITED/FIXED/EXPIRED + 3 expiring within 30 days)
   - **3 SaudizationSnapshot** (current + 2 historical for trend chart)
   - **5 webhook subscriptions** (1 with failCount=10 for demo alert)

3) Scenario seeds:
   prisma/seeds/scenarios/
   ├── full-month-pharmacy.ts (typical pharmacy month)
   ├── construction-project.ts (BoQ + progress billing)
   ├── restaurant-day.ts (table turnover + tips)
   └── manufacturing-mo.ts (full MO lifecycle)

4) Anonymized production data (optional):
   scripts/anonymize-prod.ts:
   - Pull prod backup
   - Replace PII: names → "User_<id>", emails → "<id>@test.local"
   - Replace amounts: scale × 0.7 (for confidentiality)
   - Generate prisma/seeds/anonymized-prod.dump

5) Reproducibility:
   كل seed function يأخذ seed string:
   ```typescript
   seed('namasoft-pharmacy-2026', async (rng) => {
     for (let i = 0; i < 100; i++) {
       await createProduct({ name: rng.pickProduct() });
     }
   });
   ```
   نفس الـ seed = نفس البيانات (مهم للـ testing)

6) Seed runner:
   ```bash
   npx prisma db seed -- --vertical=pharmacy --tenantId=demo-1
   npx prisma db seed -- --features-only --tenantId=demo-1
   npx prisma db seed -- --scenario=full-month-pharmacy
   ```

القيود:
- VAT 15% calculated correctly
- ZATCA Phase 2 fields complete
- auto-journal.ts used for ALL transactions
- TB must balance after seed (debit==credit)
- soft-delete a few records for filter testing
- backward compat: existing seed.ts still works
```

## السيناريو

عميل جديد يجرّب النظام (صيدلية):

1. Sales rep يفتح حساب trial: `tenant-pharmacy-trial-001`
2. SQL:
   ```bash
   npx prisma db seed -- --vertical=pharmacy --tenantId=tenant-pharmacy-trial-001
   ```
3. 30 ثانية لاحقاً:
   - شركة "صيدلية النور" مُسجّلة
   - 100 دواء مع أسعار + باركود
   - 50 عميل (مزيج VAT + بدون)
   - 20 مورد (3 منهم خارج المملكة - للـ WHT)
   - 15 موظف (5 سعوديين + 10 وافدين، Mudad mix)
   - 12 شهر معاملات كاملة
   - فواتير + قيود + رواتب
4. عميل يفتح:
   - **`/finance/cfo-dashboard`** → KPIs مع 12 شهر trend
   - **`/finance/credit-check`** → 8 عملاء "at risk"
   - **`/finance/wht/form14`** → 3 شهور WHT جاهزة للتقديم
   - **`/compliance/pdpl/breaches`** → حادثة CRITICAL مع SDAIA pending
   - **`/admin/siem`** → 5 events + brute-force pattern
   - **`/hr/mudad`** → 8 موظف موقوف (يحتاجون متابعة)
   - **`/hr/saudization`** → نطاق أصفر مع trend chart
5. عميل يقتنع → اشتراك ✓

## Data Flow

```
[Seed execution]
CLI: npx prisma db seed -- --vertical=pharmacy --tenantId=X
   ↓
prisma/seed.ts router
   ↓
Detect --vertical=pharmacy
   ↓
import('./seeds/verticals/pharmacy')
   ↓
Run in order:
   01-company.ts → tenant + company info
   02-coa.ts → chart of accounts
   03-products.ts → 100 SKUs
   04-customers.ts → 50 customers
   05-suppliers.ts → 20 suppliers
   06-employees.ts → 15 employees + Mudad mix
   07-historical-txns.ts → 12 months data
   08-open-balances.ts → set opening balances
   ↓
At each step:
   - Use Prisma transactions
   - Call auto-journal for any financial entry
   - Verify referential integrity
   ↓
prisma/seeds/feature-demo.ts (always runs):
   - PDPL data
   - SIEM events
   - WHT transactions
   - VAT categories
   - Qiwa contracts
   - Mudad statuses
   - Saudization snapshots
   - Webhook subs
   ↓
Final verification:
   - TB balanced (sum debit == sum credit)
   - No orphan FKs
   - All required indexes
   ↓
✅ Seed complete (30-60s typical)
```

## ملفات المُنتَج

- `prisma/seeds/verticals/<v>/01-08.ts` × 11 verticals × 8 = 88 files
- `prisma/seeds/feature-demo.ts`
- `prisma/seeds/scenarios/*.ts` × 4
- `prisma/seed.ts` (router updated)
- `scripts/anonymize-prod.ts` (optional)
- `docs/MASTER_PACK/19-sample-data/USAGE.md`
