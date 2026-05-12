---
version: 1.0
last_updated: 2026-05-12
---

# Design System — Namasoft

## Design Tokens

```typescript
// src/lib/design-tokens.ts
export const tokens = {
  // === COLORS ===
  color: {
    // Brand
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',   // Default
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    // Saudi green accent
    accent: {
      500: '#006c35',  // Saudi national green
    },
    // Semantic
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#0ea5e9',
    // Neutrals
    neutral: {
      0: '#ffffff',
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      1000: '#000000',
    },
  },
  
  // === TYPOGRAPHY ===
  font: {
    family: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      arabic: ['IBM Plex Sans Arabic', 'Noto Sans Arabic', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    size: {
      xs: ['12px', { lineHeight: '16px' }],
      sm: ['14px', { lineHeight: '20px' }],
      base: ['16px', { lineHeight: '24px' }],
      lg: ['18px', { lineHeight: '28px' }],
      xl: ['20px', { lineHeight: '28px' }],
      '2xl': ['24px', { lineHeight: '32px' }],
      '3xl': ['30px', { lineHeight: '36px' }],
      '4xl': ['36px', { lineHeight: '40px' }],
      '5xl': ['48px', { lineHeight: '1' }],
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  
  // === SPACING (4px scale) ===
  spacing: {
    0: '0',
    0.5: '2px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
  },
  
  // === BORDER RADIUS ===
  radius: {
    none: '0',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    full: '9999px',
  },
  
  // === SHADOWS ===
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  // === MOTION ===
  motion: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '400ms',
    },
    ease: {
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  // === BREAKPOINTS ===
  screen: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // === Z-INDEX ===
  z: {
    base: 0,
    dropdown: 100,
    sticky: 200,
    fixed: 300,
    modalBackdrop: 400,
    modal: 500,
    popover: 600,
    tooltip: 700,
    toast: 800,
  },
};
```

## Color Usage

### Semantic palette mapping

| Token | Use |
|---|---|
| `primary-600` | Primary buttons, links, focus rings |
| `accent-500` | Saudi-specific badges, ZATCA cleared badge |
| `success-500` | Posted/Cleared/Paid statuses |
| `warning-500` | Due/Pending/Overdue (early) |
| `danger-500` | Failed/Rejected/Overdue (late) |
| `info-500` | Informational messages |
| `neutral-900` | Primary text |
| `neutral-600` | Secondary text |
| `neutral-400` | Disabled, placeholders |
| `neutral-100` | Subtle backgrounds, hovers |

### Dark mode
- Light: `neutral-0` background, `neutral-900` text
- Dark: `neutral-900` background, `neutral-50` text
- Both modes maintain 4.5:1 contrast minimum

## Typography Scale

| Use | Class | Size |
|---|---|---|
| Page title (h1) | `text-3xl font-bold` | 30px |
| Section title (h2) | `text-2xl font-semibold` | 24px |
| Subsection (h3) | `text-xl font-semibold` | 20px |
| Card title | `text-lg font-medium` | 18px |
| Body | `text-base` | 16px |
| Caption | `text-sm text-neutral-600` | 14px |
| Helper | `text-xs text-neutral-500` | 12px |

## Component States

كل interactive component يجب أن يدعم:

- **Default**
- **Hover** (cursor pointer + slight color shift)
- **Focus** (ring 2px primary-600)
- **Active** (pressed state)
- **Disabled** (opacity 50% + cursor not-allowed)
- **Loading** (spinner + text "جاري...")
- **Error** (red border + error text)
- **Success** (green checkmark for forms)

## Form Components

### Input
```tsx
<Input
  label="اسم العميل"
  placeholder="أدخل الاسم"
  required
  error={errors.name}
  helper="3-50 حرف"
  prefix="🔍"
  suffix=".sa"
/>
```

States: empty, filled, focused, error, disabled, with-icon, with-prefix/suffix.

### DatePicker
- Default: Gregorian
- Toggle: Hijri (التقويم الهجري)
- Range mode for filters
- Quick presets: اليوم، أمس، هذا الأسبوع، هذا الشهر، هذا الربع، هذه السنة

### Select / Combobox
- Single + multi
- Search (debounced 200ms)
- Async load (with pagination)
- Group headers
- Custom render (e.g., customer with VAT number badge)

## Data Display

### Tables
- Sortable column headers (clear arrow icon)
- Selectable rows (checkbox column)
- Row actions (dropdown menu trigger)
- Bulk actions (top bar when selection > 0)
- Empty state: illustration + CTA
- Loading: skeleton rows
- Sticky header
- Resizable columns
- Density: compact / default / comfortable
- Column visibility toggle
- Export current view (CSV, Excel, PDF)

### Cards
- Padding: 24px default
- Header: title + actions
- Footer: optional metadata
- Shadow: md (elevated) or none (flat)

### Charts (Recharts)
- Tooltip: themed
- Numbers: locale-formatted (currency, thousands separator)
- Colors: from semantic palette
- Hover/click interactivity
- Export as PNG

## Iconography

- **Library:** Lucide React (موجود)
- **Size:** 16px default in body, 20px in buttons, 24px in nav
- **Stroke:** 2px default
- **Custom Saudi icons:** Hijri calendar, Riyal symbol, Qiblah arrow (in `public/icons/sa/`)

## Accessibility

### WCAG 2.1 AA Compliance

- [x] Color contrast 4.5:1 minimum (text), 3:1 (UI components)
- [x] Keyboard navigation full
- [x] Focus indicators visible (2px ring)
- [x] Skip to content link
- [x] Form labels associated
- [x] Error messages descriptive
- [x] Screen reader friendly (aria-* attributes)
- [x] Heading hierarchy (h1 → h2 → h3)
- [x] Image alt text required
- [x] Form errors announced
- [x] Modal focus trap
- [x] Animations respect prefers-reduced-motion

### Testing
- axe DevTools in CI (per PR)
- Manual screen reader test (NVDA + JAWS) before release
- Keyboard-only navigation walk-through

## RTL (Right-to-Left)

### Strategy
- `dir="rtl"` على `<html>` للعربية
- Tailwind logical properties: `ms-*` بدلاً من `ml-*`
- Icons: mirror selectively (arrows yes, logos no)
  - `rtl:rotate-180` للأسهم
- Numbers: Western numerals (1,2,3) كافتراضي؛ Arabic-Hindi (١٢٣) خيار
- Charts: x-axis direction reversed for time

### Examples
```tsx
// Margin start (logical)
<div className="ms-4">     // ml-4 in LTR, mr-4 in RTL

// Text alignment
<p className="text-start"> // text-left in LTR, text-right in RTL

// Icon mirror
<ChevronRight className="rtl:rotate-180" />

// Conditional class
import { useLocale } from '@/lib/i18n';
const { isRTL } = useLocale();
<div className={isRTL ? 'flex-row-reverse' : 'flex-row'}>
```

## Patterns Library

Reusable UI patterns built on tokens:

### Empty State
```tsx
<EmptyState
  illustration="/illustrations/empty-invoices.svg"
  title="لا توجد فواتير بعد"
  description="ابدأ بإنشاء أول فاتورة بيع"
  action={{
    label: 'فاتورة جديدة',
    href: '/sales/invoices/new',
    icon: <Plus />,
  }}
  secondaryAction={{
    label: 'استيراد من Excel',
    href: '/sales/invoices/import',
  }}
/>
```

### Status Badge
```tsx
<StatusBadge status="POSTED" />       // green
<StatusBadge status="DRAFT" />        // gray
<StatusBadge status="DISPUTED" />     // red
<StatusBadge status="PARTIALLY_PAID" /> // amber
<StatusBadge status="CLEARED" icon={<ZatcaIcon />} />
```

### Money Display
```tsx
<Money amount={1234.5678} currency="SAR" />
// Renders: 1,234.57 ر.س

<Money amount={1234.5678} currency="USD" exchangeRate={3.75} showOriginal />
// Renders: $1,234.57 ($) — 4,629.59 ر.س
```

### Confirmation Dialog
```tsx
<ConfirmDialog
  title="حذف الفاتورة"
  description="هل أنت متأكد؟ لا يمكن التراجع."
  confirmText="حذف"
  confirmVariant="destructive"
  onConfirm={handleDelete}
/>
```

## Storybook

```bash
npm run storybook
```

Every component has:
- Default story
- All variant stories
- Edge case stories (long text, empty, loading, error)
- Dark mode story
- RTL story
- Mobile story
- a11y story (with axe)

## Brand Assets

Located in `public/brand/`:
- Logo PNG (light + dark, full + icon-only)
- Logo SVG (scalable)
- Favicon (16x16, 32x32, 48x48, 256x256)
- Apple touch icons
- OpenGraph image (1200x630)
- Twitter card

## Maintenance

- Token changes: require design lead approval + version bump
- New components: must include Storybook + accessibility audit
- Deprecation: 2-release notice (warning logs)
- A/B testing: via feature flags, not branches
