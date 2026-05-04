# النقص #21: Products Master + Variants + UoM + Categories — مواصفات تفصيلية

> **المرجعيات:** SAP MM Material Master، Oracle Product Hub、NetSuite Item Records、Akeneo PIM、Salsify、inRiver

---

## 1. البرومنت

```
وسّع Product Master لمستوى enterprise PIM:

موجود: Product, ProductVariant, ProductBatch, ProductSerialNumber, Category, Unit, ProductUnit, PackagingUnit

النواقص:
A) Master data:
   - Multi-level categories (tree)
   - Multi-language names (ar/en/+)
   - Brand + manufacturer
   - GTIN/UPC/EAN/ISBN
   - HS code (customs)
   - Country of origin
   - Tax category
   - Product family
   - Product type (PHYSICAL/SERVICE/DIGITAL/SUBSCRIPTION/BUNDLE/KIT)
B) Variants & Attributes:
   - Configurable attributes (size, color, etc.)
   - Variant matrix
   - Attribute sets per category
   - Cross-sell / Up-sell links
   - Substitutes / Equivalents
   - Bundles / Kits
C) UoM:
   - Multiple UoMs per product
   - Conversion factors
   - Per-context UoM (purchase/sales/stock)
   - Packaging units (carton, pallet)
D) Pricing:
   - Multiple price lists
   - Customer-specific pricing
   - Volume tiers
   - Time-based pricing
   - Markup rules
E) Lifecycle:
   - New / Active / End-of-life / Discontinued
   - Replacement product link
F) Compliance:
   - Hazmat classification
   - Drug class (SFDA)
   - FDA / CE marks
   - Storage conditions
G) Media:
   - Images (multi)
   - Documents (manuals, datasheets)
   - 3D models
   - Videos

APIs (40+), UI (15 pages), Tests 50+
```

---

## 2. السيناريوهات (8)

### A — New Product Setup
```
1. /products → [+ Product]
2. Wizard:
   - Type: PHYSICAL
   - Name (ar+en), Brand, Category
   - GTIN/SKU
   - HS code (auto-suggest from category)
   - Tax category: Standard 15%
   - Variants: T-shirt with sizes (S/M/L/XL) × colors (Red/Blue/Black) = 12 variants
   - Auto-generated SKUs: TSH-S-RED, TSH-S-BLUE, ...
   - UoMs: Each (sales), Box of 12 (purchase), Pallet of 144 (storage)
   - Prices: Cost 50, Sell 100
3. Media: 5 images uploaded
4. Documents: spec sheet PDF
5. Save → published to catalog
```

### B — Variant Configurator
```
- Customer building custom shoe
- Selects size, color, material, embroidery
- System: validates compatibility
- Computes price: base + each option
- Generates unique SKU on confirmation
- Triggers MO if not in stock
```

### C — Bundle / Kit
```
- "Camera Starter Kit" = Camera + Lens + Bag + SD Card + Strap
- Bundle price 999 (vs sum 1250 → savings 251)
- Sale of bundle:
  - Reduces stock of each component
  - Single line invoice "Kit" + breakdown details
  - Each component traced for warranty
```

### D — Cross-sell / Up-sell
```
- Customer adds laptop to cart
- System suggests:
  - Cross-sell: laptop bag, mouse
  - Up-sell: extended warranty
  - Frequently bought: cables
- POS shows on customer screen
```

### E — Multi-tier Pricing
```
- Product X has price lists:
  - Retail: 100
  - Wholesale: 80
  - VIP: 70
  - Distributor: 60
- Customer "ABC Distributor" auto-uses Distributor list
- Order 100+ units → volume discount → 55
```

### F — End-of-Life Replacement
```
- Product Y end-of-life
- Replacement: Product Y2
- System:
  - Block new orders for Y
  - Suggest Y2 in cart
  - Migrate customer subscriptions
  - Archive after stock depleted
```

### G — Hazmat Compliance
```
- Chemical product flagged hazmat (UN class 8)
- Storage: only hazmat-allowed bins
- Shipping: requires special carrier + paperwork
- Sale: customer must accept compliance form
- Documentation auto-attached
```

### H — Bulk Import
```
- 5,000 products in CSV
- Mapping: SKU, name, category, prices, attributes
- Validation: unique SKU, valid category, price > 0
- Errors flagged → fix and re-import
- Preview before commit
```

---

## 3. تدفق البيانات

```
[Create Product]
POST /products → master record
   ↓ if variants → generate matrix → create ProductVariant[]
   ↓ if UoMs → create ProductUnit[]
   ↓ media uploaded to S3

[Bulk Import]
POST /products/import (CSV)
   ↓ validate row by row
   ↓ on commit → batch create

[Pricing Lookup]
GET /products/:id/price?customerId=X&qty=Y
   ↓ check customer-specific
   ↓ check segment price list
   ↓ check volume tier
   ↓ return final price + breakdown
```

---

## 4. Schema (إضافات)

```prisma
model Product {
  // ... existing
  type            String    @default("PHYSICAL")  // PHYSICAL | SERVICE | DIGITAL | SUBSCRIPTION | BUNDLE | KIT
  productCode     String    @unique
  
  // Identifiers
  gtin            String?   // EAN/UPC
  isbn            String?
  asin            String?
  manufacturerPartNumber String?
  
  // Classification
  brandId         Int?
  brand           Brand?    @relation(fields: [brandId], references: [id])
  manufacturer    String?
  countryOfOrigin String?
  hsCode          String?
  
  // Family
  productFamilyId Int?
  
  // Localization
  nameAr          String?
  nameEn          String
  nameOther       Json?     // {fr: ..., de: ...}
  descriptionAr   String?   @db.Text
  descriptionEn   String?   @db.Text
  
  // Tax
  taxCategoryId   Int?
  
  // Lifecycle
  lifecycleStatus String    @default("ACTIVE")  // NEW | ACTIVE | END_OF_LIFE | DISCONTINUED
  introducedDate  DateTime?
  endOfLifeDate   DateTime?
  replacementProductId Int?
  
  // Compliance
  hazmatClass     String?
  storageConditions String?
  drugClass       String?   // SFDA: 'OTC' | 'Rx' | 'Controlled'
  certifications  String[]  // CE, FDA, ISO
  
  // Bundle/Kit
  bundleComponents BundleComponent[]
  isBundle        Boolean   @default(false)
  bundleType      String?   // FIXED | DYNAMIC
  
  // Cross-sell
  crossSellProducts ProductRelation[] @relation("CrossSell")
  upSellProducts  ProductRelation[] @relation("UpSell")
  
  // Substitutes
  substitutes     ProductSubstitute[]
  
  // Media
  primaryImageUrl String?
  images          ProductImage[]
  documents       ProductDocument[]
  videos          ProductVideo[]
  
  // Variants
  hasVariants     Boolean   @default(false)
  attributeSetId  Int?
  attributeSet    AttributeSet? @relation(fields: [attributeSetId], references: [id])
  variants        ProductVariant[]
  
  // Custom fields
  customFields    Json?
  tags            String[]
}

model Brand {
  id              Int       @id @default(autoincrement())
  name            String    @unique
  logoUrl         String?
  websiteUrl      String?
  active          Boolean   @default(true)
  products        Product[]
}

model AttributeSet {
  id              Int       @id @default(autoincrement())
  name            String
  description     String?
  applicableCategoryIds Int[]
  attributes      Attribute[]
}

model Attribute {
  id              Int       @id @default(autoincrement())
  attributeSetId  Int
  attributeSet    AttributeSet @relation(fields: [attributeSetId], references: [id])
  
  code            String    // 'size' | 'color' | 'material'
  nameAr          String
  nameEn          String
  type            String    // 'TEXT' | 'NUMBER' | 'SELECT' | 'MULTISELECT' | 'BOOLEAN' | 'DATE'
  
  values          Json?     // for SELECT/MULTISELECT
  defaultValue    String?
  
  required        Boolean   @default(false)
  filterable      Boolean   @default(true)
  variantAxis     Boolean   @default(false)  // creates variant matrix
  
  validationRules Json?     // {min, max, regex}
}

model ProductVariant {
  // ... existing
  variantSku      String    @unique
  attributeValues Json      // {size: "M", color: "Red"}
  
  pricingOverride Decimal?  @db.Decimal(20,4)
  imageUrl        String?
  
  active          Boolean   @default(true)
  endOfLife       Boolean   @default(false)
  
  @@index([productId, active])
}

model BundleComponent {
  id              Int       @id @default(autoincrement())
  bundleProductId Int
  bundle          Product   @relation("BundleParent", fields: [bundleProductId], references: [id])
  
  componentProductId Int
  quantity        Decimal   @db.Decimal(20,4)
  
  isOptional      Boolean   @default(false)
  isSubstituteAllowed Boolean @default(false)
  
  pricingMethod   String    @default("FIXED")  // FIXED | PROPORTIONAL | LIST
}

model ProductRelation {
  id              Int       @id @default(autoincrement())
  productId       Int
  relatedProductId Int
  type            String    // 'CROSS_SELL' | 'UP_SELL' | 'BOUGHT_TOGETHER' | 'ALTERNATIVE'
  weight          Decimal?  @db.Decimal(5,2)
  
  product         Product   @relation("CrossSell", fields: [productId], references: [id])
}

model ProductSubstitute {
  id              Int       @id @default(autoincrement())
  productId       Int
  product         Product   @relation(fields: [productId], references: [id])
  substituteProductId Int
  conditions      String?   // when to substitute
  preference      Int       @default(1)
}

model ProductImage {
  id              Int       @id @default(autoincrement())
  productId       Int
  product         Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  variantId       Int?
  
  url             String
  altText         String?
  position        Int       @default(0)
  isPrimary       Boolean   @default(false)
  
  uploadedAt      DateTime  @default(now())
}

model ProductDocument {
  id              Int       @id @default(autoincrement())
  productId       Int
  product         Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  type            String    // 'MANUAL' | 'DATASHEET' | 'CERTIFICATION' | 'WARRANTY' | 'SAFETY'
  url             String
  fileName        String
  language        String    @default("ar")
  
  uploadedAt      DateTime  @default(now())
}

model ProductVideo {
  id              Int       @id @default(autoincrement())
  productId       Int
  url             String
  thumbnailUrl    String?
  type            String    // 'PRODUCT_DEMO' | 'TUTORIAL' | 'UNBOXING'
  language        String    @default("ar")
}

model Category {
  // ... existing
  parentCategoryId Int?
  parentCategory  Category? @relation("CategoryTree", fields: [parentCategoryId], references: [id])
  childCategories Category[] @relation("CategoryTree")
  
  level           Int       @default(0)
  path            String?   // /electronics/computers/laptops
  
  attributeSetId  Int?
  
  imageUrl        String?
  iconUrl         String?
  
  // Default GL accounts (override per category)
  inventoryAccountId Int?
  cogsAccountId   Int?
  revenueAccountId Int?
  
  // Default tax
  defaultTaxCategoryId Int?
  
  // SEO
  slug            String    @unique
  metaTitle       String?
  metaDescription String?
  
  active          Boolean   @default(true)
  position        Int       @default(0)
}

model Unit {
  // ... existing
  type            String    // 'COUNT' | 'WEIGHT' | 'VOLUME' | 'LENGTH' | 'AREA' | 'TIME'
  baseUnit        Boolean   @default(false)
  conversionToBase Decimal? @db.Decimal(20,8)
}

model ProductUnit {
  // ... existing
  context         String    // 'PURCHASE' | 'SALES' | 'STOCK' | 'PACKAGING' | 'SHIPPING'
  isDefault       Boolean   @default(false)
}

model PriceList {
  id              Int       @id @default(autoincrement())
  code            String    @unique
  name            String
  
  type            String    // 'STANDARD' | 'CUSTOMER_SEGMENT' | 'CUSTOMER_SPECIFIC' | 'TIER_BASED' | 'PROMOTIONAL'
  
  currency        String    @default("SAR")
  effectiveFrom   DateTime
  effectiveTo     DateTime?
  
  customerSegmentIds Int[]
  customerIds     Int[]
  
  active          Boolean   @default(true)
  
  prices          ProductPrice[]
}

model ProductPrice {
  id              Int       @id @default(autoincrement())
  priceListId     Int
  priceList       PriceList @relation(fields: [priceListId], references: [id], onDelete: Cascade)
  productId       Int
  variantId       Int?
  
  unitPrice       Decimal   @db.Decimal(20,4)
  currency        String
  
  // Volume tiers
  tiers           Json?     // [{minQty, price}]
  
  // Time-based
  effectiveFrom   DateTime?
  effectiveTo     DateTime?
  
  @@unique([priceListId, productId, variantId])
}

model TaxCategory {
  id              Int       @id @default(autoincrement())
  code            String    @unique
  name            String
  defaultRate     Decimal   @db.Decimal(5,4)
  countryCode     String?
  
  rates           TaxRate[]
}

model TaxRate {
  id              Int       @id @default(autoincrement())
  categoryId      Int
  category        TaxCategory @relation(fields: [categoryId], references: [id])
  rate            Decimal   @db.Decimal(5,4)
  effectiveFrom   DateTime
  effectiveTo     DateTime?
  countryCode     String?
}
```

---

## 5. Forms (8)

A: Product Master Wizard (multi-step)
B: Variant Generator (attribute combinations)
C: Bundle Composer
D: Bulk Import (CSV mapping)
E: Price List Editor
F: Attribute Set Definition
G: Category Tree Editor
H: Media Upload + Tagging

---

## 6. Tables (8 grids)

A: Products (with filters by type, category, brand, status)
B: Variants Matrix (visual)
C: Categories Tree
D: Price Lists
E: Brands
F: Attribute Sets
G: Bundles
H: Substitutes / Cross-sell

---

## 7. Buttons (35+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-product-create | + product | 🟢 catalog mgr |
| btn-product-clone | استنساخ | ⬜ catalog |
| btn-product-end-of-life | EoL | 🟡 catalog mgr |
| btn-product-discontinue | تعطيل | 🔴 catalog mgr |
| btn-product-bulk-import | استيراد جماعي | 🟦 catalog mgr |
| btn-product-bulk-export | تصدير جماعي | ⬜ catalog |
| btn-variants-generate | توليد المتغيرات | 🟦 catalog |
| btn-variants-bulk-update | تحديث جماعي | ⬜ catalog mgr |
| btn-bundle-create | + حزمة | 🟢 catalog |
| btn-bundle-add-component | + مكون | 🟢 catalog |
| btn-substitute-add | + بديل | 🟢 catalog |
| btn-cross-sell-add | + cross-sell | 🟢 catalog |
| btn-price-list-create | + قائمة أسعار | 🟢 sales mgr |
| btn-price-bulk-update | تحديث الأسعار | 🟦 sales mgr |
| btn-price-import | استيراد أسعار | ⬜ sales mgr |
| btn-attribute-set-create | + مجموعة سمات | 🟢 catalog mgr |
| btn-attribute-create | + سمة | 🟢 catalog mgr |
| btn-category-create | + فئة | 🟢 catalog |
| btn-category-move | نقل في الشجرة | 🟦 catalog mgr |
| btn-image-upload | رفع صور | 🟢 catalog |
| btn-image-set-primary | تعيين رئيسية | 🟦 catalog |
| btn-document-upload | رفع وثيقة | 🟢 catalog |
| btn-uom-add | + وحدة | 🟢 catalog |
| btn-uom-set-conversion | معامل التحويل | 🟦 catalog |
| btn-tax-category-assign | تعيين فئة ضريبية | ⬜ catalog |
| btn-hazmat-classify | تصنيف خطير | 🟡 compliance |
| btn-replacement-link | ربط بديل | 🟦 catalog |
| btn-search-by-gtin | بحث بـ GTIN | ⬜ any |
| btn-product-360 | عرض 360 | ⬜ viewer |
| btn-print-barcode-label | طباعة Label | ⬜ catalog |
| btn-product-syndicate | نشر للقنوات | 🟦 marketing |

---

## 8. Search & Filters

- Type, Category (tree), Brand, Active/EoL, Has variants, Has bundle, Hazmat, GTIN, Tags, Price range

---

## 9. Reports

- Catalog Listing
- Variant Matrix
- Slow Movers (link to inventory)
- Price List Comparison
- Margin by Category
- Bundle Performance
- Product Search Analytics
- New / EoL Products

---

## 10. Dashboards

- KPIs: Total SKUs / Active / EoL / New This Month / With Issues (no image, no price)
- Charts: Category mix, Brand distribution
- Lists: Products without images, Missing prices, EoL approaching

---

## 11. Notifications

- Product end-of-life approaching
- Substitute auto-suggested
- Price change requires approval
- Hazmat classification needs review
- Image missing for active product

---

## 12. Permissions Matrix

| Action | Catalog | Catalog Mgr | Sales Mgr | Compliance |
|--------|---------|-------------|-----------|------------|
| Create | ✓ | ✓ | ✗ | ✗ |
| Edit basic | ✓ | ✓ | ✗ | ✗ |
| EoL | ✗ | ✓ | ✗ | ✗ |
| Bulk import | ✗ | ✓ | ✗ | ✗ |
| Edit prices | ✗ | ✗ | ✓ | ✗ |
| Hazmat classify | ✗ | ✗ | ✗ | ✓ |

---

## 13. Integrations

- Akeneo PIM / Salsify
- GS1 (GTIN registry)
- Customs (HS code lookup)
- Translation services (multi-language)
- Image CDN (Cloudinary/Cloudflare)
- E-commerce platforms (Salla/Zid/Shopify)

---

## 14. Shortcuts

- `Ctrl+P` New product
- `Ctrl+B` Bundle
- `Ctrl+/` Search

---

## 15. Mobile / Print

- Mobile: barcode scan + lookup
- Print: barcode labels (Avery), price tags, datasheets

---

## 16. Audit

- Master changes versioned
- Price changes audit
- EoL decisions logged

---

## 17. Tests

```typescript
describe('Variants', () => { /* matrix gen, SKU uniqueness */ })
describe('Bundles', () => { /* component reduction, pricing */ })
describe('Pricing', () => { /* customer-specific, volume tiers */ })
describe('Bulk Import', () => { /* validation, rollback on error */ })
describe('Substitutes', () => { /* suggestion, auto-replace */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| Variant SKU conflict | reject + suggest pattern |
| Bundle component out of stock | partial fulfillment toggle |
| Price 0 | warn, allow with reason |
| Negative margin | warn, require approval |
| Hazmat without storage | block sale |
| Discontinued in active SO | finish open, block new |

---

**نهاية #21** • 8 سيناريوهات • 13 جداول • 8 forms • 8 grids • 35 button • 8 reports
