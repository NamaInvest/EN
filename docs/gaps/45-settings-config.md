# النقص #45: Settings + Custom Fields + Currencies + Localization — مواصفات

> **المرجعيات:** SAP Business Configuration、Oracle Setup Manager、NetSuite Setup、Salesforce Setup

---

## 1. البرومنت

```
وسّع Settings لمستوى Setup Center:

موجود: Settings, Currencies, ExchangeRate, custom-fields-engine, BPM, Approvals, Roles, Branches

النواقص:
A) Centralized setup with categories
B) Configuration profiles (per industry)
C) Custom Fields Engine (any entity)
D) Currency master + exchange rates (auto-update)
E) Multi-language (Ar/En/+) translations
F) Number/date formatting per locale
G) Numbering sequences (per doc type, per branch)
H) Print templates editor
I) Email/SMS template editor
J) Branch / Cost Center / Project hierarchy
K) Tax categories
L) Payment terms
M) Reasons catalog (returns, voids, etc.)
N) Workflows + approvals
O) System parameters (toggles)
P) API keys + integrations
Q) Backup configuration
R) Localization data (ZATCA, GOSI, etc.)

APIs (50+), UI (25 pages), Tests 70+
```

---

## 2. السيناريوهات (8)

### A — Initial Setup Wizard
```
- New tenant first login
- Wizard:
  - Company info (name, CR, VAT, logo)
  - COA template (SOCPA recommended)
  - Currency (SAR base + others)
  - Fiscal calendar
  - Branches
  - Roles + Permissions
  - First user
  - ZATCA onboard
  - Email/SMS providers
  - Done
```

### B — Custom Field
```
- Want to add "License Plate" field to Customer
- /settings/custom-fields → [+ Field]
- Entity: Customer, Type: text, Required: no
- Visible in: form + list + reports
- Saved → field appears immediately
```

### C — Multi-language
```
- Default: Arabic
- Add English (full translation)
- Add Urdu (for expat workforce)
- User selects language in profile
- All UI + emails translate
```

### D — Currency Setup
```
- Base: SAR
- Add: USD, EUR, AED, GBP
- Exchange rates: auto from SAMA daily
- Override option for manual
- Historical rates tracked
```

### E — Numbering Sequence
```
- Sales invoices: prefix=INV-, padding=6, reset=YEARLY
- INV-2026-000001
- Per branch: BR1-INV-2026-000001
- Configurable per document type
```

### F — Approval Workflow Setup
```
- /settings/approvals → [+ Rule]
- Document: Purchase Order
- Conditions: amount > 50,000
- Steps: Manager → Department Head → CFO
- Active from: today
```

### G — Print Template
```
- Customize invoice template
- Drag-drop fields
- Logo, colors, fonts
- Header + footer
- Multi-language toggle
- VAT-compliant format auto-checked
```

### H — Email Template
```
- "Order Confirmation" template
- Variables: {{customerName}}, {{orderNumber}}, {{total}}
- HTML + plain text
- Multi-language
- Preview before save
```

---

## 3. تدفق البيانات

```
[Setting Get/Set]
GET /settings/:key
POST /settings/:key { value }
   ↓ validate type
   ↓ apply scope (global, tenant, user)
   ↓ cache
   ↓ broadcast change

[Custom Field Apply]
On entity form load:
   ↓ fetch custom fields for entity
   ↓ inject into form schema
   ↓ render dynamically

On save:
   ↓ validate custom field values
   ↓ store in CustomFieldValues
```

---

## 4. Schema

```prisma
model Setting {
  id              Int       @id @default(autoincrement())
  key             String    @unique
  value           String?   @db.Text
  valueJson       Json?
  
  scope           String    @default("GLOBAL")  // GLOBAL | TENANT | USER | BRANCH
  scopeId         Int?
  
  category        String?
  description     String?
  
  type            String    // 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ENCRYPTED'
  validation      Json?     // {min, max, regex}
  defaultValue    String?
  
  isSystem        Boolean   @default(false)
  isSensitive     Boolean   @default(false)  // encrypted in DB + masked in UI
  
  updatedByUserId String?
  updatedAt       DateTime  @updatedAt
  
  @@unique([key, scope, scopeId])
}

model SettingHistory {
  id              Int       @id @default(autoincrement())
  settingId       Int
  oldValue        String?   @db.Text
  newValue        String?   @db.Text
  changedByUserId String
  changedAt       DateTime  @default(now())
}

model CustomField {
  id              Int       @id @default(autoincrement())
  fieldCode       String    @unique
  
  entityType      String    // 'Customer' | 'Vendor' | 'Product' | etc.
  
  nameAr          String
  nameEn          String
  helpText        String?
  
  type            String    // 'TEXT' | 'NUMBER' | 'DATE' | 'DATETIME' | 'BOOLEAN' | 'SELECT' | 'MULTISELECT' | 'FILE' | 'TEXTAREA'
  
  options         Json?     // for SELECT
  validation      Json?     // {required, min, max, regex}
  defaultValue    String?
  
  visibleInForm   Boolean   @default(true)
  visibleInList   Boolean   @default(false)
  searchable      Boolean   @default(false)
  required        Boolean   @default(false)
  
  position        Int       @default(0)
  sectionLabel    String?
  
  permissions     Json?     // who can see/edit
  
  active          Boolean   @default(true)
}

model CustomFieldValue {
  id              Int       @id @default(autoincrement())
  fieldId         Int
  field           CustomField @relation(fields: [fieldId], references: [id])
  
  entityId        Int       // ID of the entity (Customer, etc.)
  
  textValue       String?   @db.Text
  numberValue     Decimal?  @db.Decimal(20,4)
  dateValue       DateTime?
  booleanValue    Boolean?
  jsonValue       Json?
  
  @@unique([fieldId, entityId])
  @@index([entityId])
}

model Currency {
  // ... existing
  code            String    @unique  // ISO 4217: SAR, USD, EUR
  symbol          String    // ﷼, $, €
  nameAr          String
  nameEn          String
  decimals        Int       @default(2)
  
  isBase          Boolean   @default(false)
  active          Boolean   @default(true)
}

model NumberingSequence {
  id              Int       @id @default(autoincrement())
  documentType    String    // 'SALES_INVOICE' | 'PURCHASE_ORDER' | etc.
  branchId        Int?      // null = global
  
  prefix          String?   // 'INV-'
  suffix          String?
  padLength       Int       @default(6)
  
  resetFrequency  String    @default("YEARLY")  // NEVER | YEARLY | MONTHLY
  
  currentNumber   Int       @default(0)
  lastResetAt     DateTime?
  
  // Derived (e.g., INV-2026-000001)
  format          String    @default("{prefix}{year}-{number}")
  
  active          Boolean   @default(true)
  
  @@unique([documentType, branchId])
}

model PrintTemplate {
  id              Int       @id @default(autoincrement())
  templateCode    String    @unique
  
  documentType    String
  name            String
  
  pageSize        String    @default("A4")
  orientation     String    @default("PORTRAIT")
  
  htmlTemplate    String    @db.Text
  cssStyles       String?   @db.Text
  
  language        String    @default("ar")
  
  isDefault       Boolean   @default(false)
  
  // Compliance
  zatcaCompliant  Boolean?
  
  variables       Json
}

model Translation {
  id              Int       @id @default(autoincrement())
  language        String    // 'ar' | 'en' | 'ur' | 'fr' | etc.
  namespace       String    // 'common' | 'sales' | 'errors' | etc.
  key             String
  value           String    @db.Text
  
  @@unique([language, namespace, key])
}

model Locale {
  id              Int       @id @default(autoincrement())
  code            String    @unique  // 'ar-SA' | 'en-US'
  name            String
  
  dateFormat      String    // 'DD/MM/YYYY'
  timeFormat      String    // 'HH:mm'
  numberFormat    String    // {decimal: '.', thousands: ','}
  currency        String
  firstDayOfWeek  Int       @default(0)  // Sunday
  weekendDays     Int[]     // [5, 6] for Fri/Sat
  
  active          Boolean   @default(true)
}

model Branch {
  id              Int       @id @default(autoincrement())
  branchCode      String    @unique
  nameAr          String
  nameEn          String
  
  parentBranchId  Int?
  
  type            String    // 'HQ' | 'BRANCH' | 'WAREHOUSE' | 'POS' | 'VIRTUAL'
  
  address         String
  city            String
  countryCode     String
  
  phone           String?
  email           String?
  
  vatNumber       String?
  zatcaCsr        String?
  
  active          Boolean   @default(true)
  
  managerEmployeeId Int?
}

model CostCenter {
  id              Int       @id @default(autoincrement())
  code            String    @unique
  name            String
  
  parentCostCenterId Int?
  
  type            String    // 'OPERATIONAL' | 'ADMIN' | 'PROFIT'
  managerEmployeeId Int?
  branchId        Int?
  
  active          Boolean   @default(true)
}

model ReasonCatalog {
  id              Int       @id @default(autoincrement())
  category        String    // 'RETURN_REASON' | 'VOID_REASON' | 'CANCELLATION' | 'WRITE_OFF'
  code            String
  
  nameAr          String
  nameEn          String
  description     String?
  
  active          Boolean   @default(true)
  
  @@unique([category, code])
}

model PaymentTerm {
  id              Int       @id @default(autoincrement())
  code            String    @unique
  name            String
  
  netDays         Int       // 30, 45, 60
  
  // Discount
  discountPercent Decimal?  @db.Decimal(5,2)
  discountDays    Int?
  
  // EOM
  isEndOfMonth    Boolean   @default(false)
  eomGraceDays    Int?
  
  active          Boolean   @default(true)
}

model TaxCategory {
  // ... covered in #27
}

model SystemParameter {
  id              Int       @id @default(autoincrement())
  key             String    @unique
  value           String
  category        String
  description     String?
  type            String
  isVisible       Boolean   @default(true)
}
```

---

## 5. Forms (10)

A: Initial Setup Wizard
B: Custom Field Editor
C: Currency + Exchange Rate
D: Numbering Sequence
E: Print Template Designer
F: Email/SMS Template
G: Branch / Cost Center
H: Reason Catalog
I: Payment Terms
J: Localization

---

## 6. Tables (10)

A: All Settings (categorized)
B: Custom Fields per Entity
C: Currencies + Rates
D: Numbering Sequences
E: Print Templates
F: Email Templates
G: SMS Templates
H: Branches Tree
I: Cost Centers Tree
J: System Parameters

---

## 7. Buttons (32+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-setup-wizard | بدء التهيئة | 🟢 first user |
| btn-setting-edit | تعديل إعداد | 🟢 admin |
| btn-setting-reset | استعادة الافتراضي | 🟡 admin |
| btn-setting-import | استيراد | ⬜ super admin |
| btn-setting-export | تصدير | ⬜ super admin |
| btn-custom-field-add | + حقل مخصص | 🟢 admin |
| btn-custom-field-reorder | إعادة الترتيب | 🟦 admin |
| btn-custom-field-deactivate | تعطيل | 🔴 admin |
| btn-currency-add | + عملة | 🟢 admin |
| btn-fx-rate-update | تحديث الأسعار | 🟦 admin |
| btn-fx-rate-auto-config | تكوين تلقائي | 🟦 admin |
| btn-numbering-create | + تسلسل | 🟢 admin |
| btn-numbering-reset | إعادة تعيين | 🔴 super admin |
| btn-template-create | + قالب | 🟢 admin |
| btn-template-clone | استنساخ | ⬜ admin |
| btn-template-test-print | طباعة اختبار | 🟦 admin |
| btn-template-delete | حذف | 🔴 admin |
| btn-language-add | + لغة | 🟢 super admin |
| btn-translation-edit | تعديل الترجمة | 🟢 admin |
| btn-translation-bulk-import | استيراد جماعي | 🟦 admin |
| btn-locale-add | + locale | 🟢 super admin |
| btn-branch-add | + فرع | 🟢 admin |
| btn-branch-deactivate | تعطيل | 🔴 admin |
| btn-cost-center-add | + مركز تكلفة | 🟢 cfo |
| btn-payment-term-add | + شروط دفع | 🟢 cfo |
| btn-tax-category-add | + فئة ضريبية | 🟢 cfo |
| btn-reason-add | + سبب | 🟢 admin |
| btn-system-param-edit | تعديل معامل | 🟢 super admin |
| btn-backup-restore-config | استعادة الإعدادات | 🔴 super admin |
| btn-config-validation | فحص الإعدادات | 🟦 admin |
| btn-print-preview | معاينة الطباعة | ⬜ user |
| btn-language-switch | تبديل اللغة | 🟢 user |

---

## 8. Search & Filters

- Settings: category, scope, modified
- Custom fields: entity, type, active
- Currencies: active
- Numbering: doc type, branch
- Templates: type, language
- Branches: type, active

---

## 9. Reports

- Configuration Audit
- Custom Fields Usage
- Translation Coverage
- Numbering Sequence Status
- Setup Completeness Score

---

## 10. Dashboards

- KPIs: Setup Complete % / Custom Fields / Branches / Currencies
- Charts: Configuration changes trend
- Lists: Recently changed, Pending setup steps

---

## 11. Notifications

- Configuration changed (audit)
- FX rate update failed
- Setup incomplete reminder
- Numbering sequence near max
- Translation gap detected
- Print template error

---

## 12. Permissions

| Action | User | Admin | Super Admin |
|--------|------|-------|-------------|
| View settings | own | ✓ | ✓ |
| Edit own profile | ✓ | ✓ | ✓ |
| Edit settings | ✗ | ✓ | ✓ |
| Edit sensitive | ✗ | ✗ | ✓ |
| Custom fields | ✗ | ✓ | ✓ |
| Numbering | ✗ | ✓ | ✓ |
| System params | ✗ | ✗ | ✓ |
| Branch master | ✗ | ✓ | ✓ |
| Languages | ✗ | ✗ | ✓ |

---

## 13. Integrations

- SAMA (FX rates)
- Translation services (Google Translate API)
- DNS providers
- Email/SMS providers
- ZATCA / GOSI (configuration sync)

---

## 14. Shortcuts

- `Ctrl+,` Open settings
- `Ctrl+L` Language switch
- `Ctrl+P` Print preview

---

## 15. Mobile / Print

- Mobile: language switch, profile
- Print: configuration backup

---

## 16. Audit

- Every setting change logged
- Custom field additions/changes
- Numbering changes audit
- Print template versions

---

## 17. Tests

```typescript
describe('Custom Fields', () => { /* CRUD, validation */ })
describe('Numbering', () => { /* unique, padding, reset */ })
describe('FX Rates', () => { /* auto-update, fallback */ })
describe('Multi-language', () => { /* fallback, RTL */ })
describe('Print Templates', () => { /* render, ZATCA */ })
describe('Setup Wizard', () => { /* validation per step */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| Custom field deleted with data | warn, archive instead |
| FX rate stale | use last + alert |
| Numbering exhausted | extend padding |
| Translation missing | fall back to English/key |
| Setting change requires restart | warn user |
| Two admins editing same setting | optimistic lock |

---

**نهاية #45** • 8 سيناريوهات • 13 جداول • 10 forms • 10 grids • 32 button • 5 reports
