# B2 — Database ERD

## الحالة الحالية
- `prisma/schema.prisma` — 607 model × 11,922 سطر
- ERD يدوي في `BUILD_PACK/05-DATABASE_ERD_GUIDE.md`
- لا توجد diagrams آلية

## الفجوة (مقابل dbdiagram.io / Lucidchart Enterprise)
- لا diagrams بـ SVG تُحدّث آلياً
- لا تقسيم حسب الموديول (607 model في صورة واحدة = غير قابل للقراءة)
- لا CI gate على schema changes

## 🎯 Ready Prompt

```
المهمة: ERD مولّد آلياً مع تقسيم حسب الموديول.

السياق:
- 607 model في prisma/schema.prisma
- بعض الـ models لها prefix مودولاري (Sales*, Purchase*, Hr*)

المخرجات:
1) أضف لـ prisma/schema.prisma:
   generator dbml {
     provider = "prisma-dbml-generator"
     output = "../docs/database/erd"
     outputName = "schema.dbml"
   }

2) Install:
   npm i -D prisma-dbml-generator @softwaretechnik/dbml-renderer

3) scripts/split-erd.ts:
   - يقرأ docs/database/erd/schema.dbml
   - يقسم حسب prefix إلى:
     accounting.dbml, sales.dbml, purchases.dbml,
     inventory.dbml, manufacturing.dbml, hr.dbml,
     fa.dbml (fixed assets), treasury.dbml, ai.dbml,
     zatca.dbml, master_tenant.dbml
   - render كل dbml إلى .svg
   - يُضيف badges:
     - 🔴 tenantId FK (red border)
     - 🟡 controlled accounts (yellow)
     - [SD] soft-delete enabled

4) docs/database/erd/index.md:
   - embed كل 11 SVG
   - links لكل model
   - cross-module relations highlighted

5) CI workflow .github/workflows/erd.yml:
   on: pull_request paths: ['prisma/schema.prisma']
   - npx prisma generate
   - node scripts/split-erd.ts
   - commit if diff
   - upload SVG artifacts

6) Pre-commit hook:
   .husky/pre-commit: regenerate ERD if schema changed

القيود:
- لا تكسر prisma generate الموجود
- SVG files تحت 500KB لكل واحد
- relations بين modules تظهر بـ dashed lines
```

## السيناريو

معماري جديد ينضم للفريق:
1. يفتح `docs/database/erd/index.md`
2. يضغط على "Sales Module ERD"
3. يرى صورة SVG تفاعلية:
   - 26 model في Sales
   - علاقات مرسومة + cardinalities
   - tenantId FK باللون الأحمر
   - controlled accounts بالأصفر
   - hover على أي table يعرض الـ fields
4. يفهم Sales schema في 5 دقائق بدلاً من قراءة 1200 سطر

عند PR يغيّر `schema.prisma`:
1. CI يكتشف التغيير
2. يولّد ERD جديد
3. يعرض diff: "+ added field X to SalesInvoice"
4. Reviewer يرى التغيير بصرياً قبل الموافقة

## Data Flow

```
[Generation flow]
prisma/schema.prisma (modified)
   ↓
npx prisma generate
   ↓
prisma-dbml-generator
   ↓
docs/database/erd/schema.dbml (full)
   ↓
node scripts/split-erd.ts
   ├→ Read schema.dbml
   ├→ Group tables by prefix
   ├→ Write per-module .dbml files
   └→ For each:
      dbml-renderer → .svg
   ↓
docs/database/erd/
   ├── schema.dbml (full)
   ├── schema.svg (full - large)
   ├── accounting.dbml + .svg
   ├── sales.dbml + .svg
   ├── inventory.dbml + .svg
   ├── ... (8 more modules)
   └── index.md (embeds all SVGs)

[CI flow]
PR opened with schema.prisma changes
   ↓
.github/workflows/erd.yml triggered
   ↓
Run generation flow above
   ↓
git diff docs/database/erd/
   ↓
If diff exists:
   ├→ git add docs/database/erd/
   ├→ git commit -m "chore: regenerate ERD"
   └→ git push (or comment on PR)
   ↓
PR reviewer sees:
   - "ERD updated" comment
   - link to side-by-side diff
   - download SVG artifact

[Pre-commit local flow]
git commit -m "feat: add WhtTransaction.category"
   ↓
.husky/pre-commit
   ↓
git diff --cached --name-only | grep schema.prisma
   ↓ (yes)
node scripts/split-erd.ts
   ↓
git add docs/database/erd/
   ↓
commit proceeds with regenerated ERD
```

## ملفات المُنتَج

- `prisma/schema.prisma` (generator block added)
- `scripts/split-erd.ts`
- `docs/database/erd/schema.dbml` (auto)
- `docs/database/erd/<module>.{dbml,svg}` × 11 (auto)
- `docs/database/erd/index.md`
- `.github/workflows/erd.yml`
- `.husky/pre-commit` (updated)
