---
version: 1.0
last_updated: 2026-05-12
---

# Internationalization (i18n) Strategy

## اللغات المدعومة

| Locale | Direction | Status |
|---|---|---|
| `ar-SA` | RTL | Primary (default) |
| `en` | LTR | Full support |
| `ur` | RTL | Partial (for South Asian workforce) |
| `bn` | LTR | Partial |
| `hi` | LTR | Partial |
| `fr` | LTR | Planned |
| `es` | LTR | Planned |

## التطبيق

### Library
- **react-i18next** + **i18next-http-backend**
- **ICU MessageFormat** for plurals/genders
- **date-fns-jalali** + **moment-hijri** for calendars
- **Intl.NumberFormat / RelativeTimeFormat** native APIs

### Structure
```
public/locales/
├── ar/
│   ├── common.json
│   ├── sales.json
│   ├── accounting.json
│   ├── inventory.json
│   ├── hr.json
│   ├── manufacturing.json
│   ├── procurement.json
│   ├── crm.json
│   ├── pos.json
│   └── ... (per module)
├── en/
│   └── ... (mirror)
└── ...
```

## File Format (ICU)

```json
// public/locales/ar/sales.json
{
  "invoices": {
    "title": "فواتير المبيعات",
    "new": "فاتورة جديدة",
    "count": "{count, plural, zero {لا توجد فواتير} one {فاتورة واحدة} two {فاتورتان} few {{count} فواتير} many {{count} فاتورة} other {{count} فاتورة}}",
    "totalDue": "المستحق: {amount, number, ::currency/SAR}",
    "created_at": "أنشئت {date, date, ::yyyyMMMMd HH:mm}",
    "createdAgo": "أنشئت {time, relativeTime}",
    "form": {
      "customer": "العميل",
      "customer.placeholder": "اختر العميل",
      "date": "التاريخ",
      "lines": "البنود",
      "subtotal": "المجموع",
      "vat": "الضريبة",
      "grandTotal": "الإجمالي",
      "save": "حفظ",
      "save.loading": "جاري الحفظ...",
      "saved": "تم الحفظ ✓"
    },
    "errors": {
      "creditLimitExceeded": "تجاوز حد الائتمان للعميل {customer} بمبلغ {over, number, ::currency/SAR}",
      "stockInsufficient": "المخزون غير كافٍ من {product} (متاح: {available}, مطلوب: {needed})",
      "periodLocked": "الفترة مقفلة. التاريخ {date, date} يقع في فترة مقفلة."
    }
  }
}
```

```json
// public/locales/en/sales.json
{
  "invoices": {
    "title": "Sales Invoices",
    "new": "New Invoice",
    "count": "{count, plural, =0 {No invoices} one {One invoice} other {{count} invoices}}",
    "totalDue": "Due: {amount, number, ::currency/SAR}",
    "created_at": "Created on {date, date, ::yMMMMd HH:mm}",
    "createdAgo": "Created {time, relativeTime}",
    "form": {
      "customer": "Customer",
      "customer.placeholder": "Select customer",
      "date": "Date",
      "lines": "Items",
      "subtotal": "Subtotal",
      "vat": "VAT",
      "grandTotal": "Grand Total",
      "save": "Save",
      "save.loading": "Saving...",
      "saved": "Saved ✓"
    },
    "errors": {
      "creditLimitExceeded": "Credit limit exceeded for {customer} by {over, number, ::currency/SAR}",
      "stockInsufficient": "Insufficient stock for {product} (available: {available}, needed: {needed})",
      "periodLocked": "Period is locked. Date {date, date} falls in a closed period."
    }
  }
}
```

## Usage in Components

```tsx
'use client';
import { useTranslation, Trans } from 'react-i18next';

export function InvoicesHeader({ count }: { count: number }) {
  const { t } = useTranslation('sales');
  
  return (
    <div>
      <h1>{t('invoices.title')}</h1>
      <p>{t('invoices.count', { count })}</p>
      <button>{t('invoices.new')}</button>
      
      <Trans
        i18nKey="invoices.errors.creditLimitExceeded"
        ns="sales"
        values={{ customer: 'ABC', over: 5000 }}
        components={{ strong: <strong /> }}
      />
    </div>
  );
}
```

```tsx
// Server Component
import { getServerTranslation } from '@/lib/i18n-server';

export default async function InvoicesPage() {
  const t = await getServerTranslation('sales');
  return <h1>{t('invoices.title')}</h1>;
}
```

## Locale Detection

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { match } from '@formatjs/intl-localematcher';

const SUPPORTED = ['ar', 'en', 'ur', 'bn', 'hi'];
const DEFAULT = 'ar';

export function middleware(req: NextRequest) {
  // Priority:
  // 1. URL prefix /ar/... or /en/...
  // 2. Cookie 'NEXT_LOCALE'
  // 3. Accept-Language header
  // 4. Default
  
  const pathLocale = req.nextUrl.pathname.split('/')[1];
  if (SUPPORTED.includes(pathLocale)) {
    return; // pass-through
  }
  
  const cookieLocale = req.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && SUPPORTED.includes(cookieLocale)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${cookieLocale}${url.pathname}`;
    return NextResponse.redirect(url);
  }
  
  const acceptLang = req.headers.get('accept-language') ?? '';
  const langs = acceptLang.split(',').map(l => l.split(';')[0].trim());
  const detected = match(langs, SUPPORTED, DEFAULT);
  
  const url = req.nextUrl.clone();
  url.pathname = `/${detected}${url.pathname}`;
  return NextResponse.redirect(url);
}
```

## Calendar Support

```typescript
// src/lib/calendar.ts
import { format as formatGregorian } from 'date-fns';
import { ar } from 'date-fns/locale';
import moment from 'moment-hijri';
moment.locale('ar-sa');

export function formatDate(date: Date, options: { calendar: 'gregorian' | 'hijri'; locale: string }) {
  if (options.calendar === 'hijri') {
    return moment(date).format('iYYYY/iMM/iDD');  // e.g., 1446/11/04
  }
  return formatGregorian(date, 'yyyy/MM/dd', {
    locale: options.locale === 'ar' ? ar : undefined,
  });
}

export function hijriToGregorian(hijriDate: string): Date {
  return moment(hijriDate, 'iYYYY/iMM/iDD').toDate();
}
```

## Number Formatting

```typescript
// src/lib/format.ts
export function formatMoney(amount: number, currency = 'SAR', locale = 'ar-SA'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

// Examples:
formatMoney(1234.5678, 'SAR', 'ar-SA') // → "١٬٢٣٤٫٥٧ ر.س." or "1,234.57 ر.س." per locale
formatMoney(1234.5678, 'USD', 'en')    // → "$1,234.57"

// Override to use Western numerals always:
export function formatMoneyWestern(amount: number, currency = 'SAR'): string {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
  }).format(amount);
}
```

## Locale Preferences (per-user)

```typescript
// User can override defaults via /settings/locale
interface UserLocalePrefs {
  language: 'ar' | 'en' | 'ur' | 'bn' | 'hi';
  calendar: 'gregorian' | 'hijri';
  numerals: 'western' | 'arabic-indic';
  weekStart: 'saturday' | 'sunday' | 'monday';
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
  timezone: string;  // IANA, e.g., 'Asia/Riyadh'
  currency: string;  // ISO 4217, e.g., 'SAR'
}
```

## Translation Workflow

### Source of Truth
- English (`en/`) is source
- Arabic (`ar/`) is reviewed by Arabic linguist
- Other languages are AI-translated then human-reviewed

### Tool: Lokalise or Crowdin
- GitHub integration: push branch → translations pulled
- Webhooks: translation update → PR to develop

### CLI helpers
```bash
# Find missing keys
npm run i18n:check

# Extract new keys from code
npm run i18n:extract

# Generate types from JSON
npm run i18n:gen-types

# Show unused keys
npm run i18n:unused
```

### Key naming convention
- `module.section.key` (e.g., `sales.invoices.new`)
- camelCase for keys
- `.placeholder`, `.error`, `.loading`, `.success` for state suffixes
- `.<role>` for role-specific phrasing if needed

### Anti-patterns
- ❌ Concatenating translations: `t('hello') + ' ' + t('world')`
- ❌ Hard-coded strings: `<button>Save</button>` → must be `<button>{t('save')}</button>`
- ❌ Translation in tests: tests use English-only fixtures
- ❌ Translations in DB-level data (model names, status codes)

## Specific Saudi UX Considerations

### Gender
Arabic has masculine and feminine forms. For greetings:
```json
{
  "welcome": "{gender, select, male {أهلاً وسهلاً} female {أهلاً وسهلاً}}, {name}"
}
```
Most ERP terms are gender-neutral (avoid where possible).

### Formal vs informal
Use formal "أنت" not informal "انت" in customer-facing copy. Use first-person plural ("نقوم بـ..." = "we do...") for system actions.

### Saudi-specific terms
| Concept | Translation |
|---|---|
| VAT | ضريبة القيمة المضافة |
| Tax invoice | فاتورة ضريبية |
| Simplified tax invoice | فاتورة ضريبية مبسطة |
| Iqama | إقامة |
| GOSI | التأمينات الاجتماعية |
| WPS | حماية الأجور |
| Zakat | زكاة |
| CR (Commercial Registration) | السجل التجاري |
| Mada | مدى |
| ZATCA | هيئة الزكاة والضريبة والجمارك |
| SOCPA | الهيئة السعودية للمحاسبين القانونيين |

### Address Format
```
{recipient}
{building_number} {street_name}
حي {district}
{city}, {postal_code}
المملكة العربية السعودية
```

## Quality Assurance

- **Visual QA:** test all critical pages in AR + EN side-by-side
- **Length checks:** Arabic 20-40% longer than English — ensure layouts handle
- **Pseudo-locale:** wrap English in Arabic markers `⟬⟭` to find untranslated strings
- **Right-truncation:** test long names don't break grids
- **Mixed content:** test LTR snippets in RTL pages (account codes, English product names)
