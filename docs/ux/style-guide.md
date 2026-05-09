# Style Guide / Design System — Namasoft ERP

> **آخر تحديث:** 2026-05-10
> **Stack:** Tailwind 4 + shadcn/ui patterns + Radix primitives

---

## 1. Brand Foundations

### 1.1 Color Palette

| Token | HEX | Use |
|-------|-----|-----|
| `--brand-primary` | `#0F4C81` | actions, active nav, primary buttons |
| `--brand-accent` | `#E8B339` | highlights, KPI dots |
| `--brand-success` | `#16A34A` | posted, paid, balanced |
| `--brand-warning` | `#F59E0B` | drafts, pending |
| `--brand-danger` | `#DC2626` | errors, voided, overdue |
| `--brand-info` | `#0EA5E9` | system messages |
| `--neutral-50..950` | gray scale | backgrounds, text |

### 1.2 Typography

| Role | Family | Weight | Size |
|------|--------|--------|------|
| Arabic body | `Tajawal`, `IBM Plex Sans Arabic` | 400 | 14/22 |
| Arabic display | `Cairo` | 700 | 24-48 |
| Latin body | `Inter`, `system-ui` | 400 | 14/22 |
| Mono (numbers) | `JetBrains Mono`, `Roboto Mono` | 500 | 13/20 |

> Numbers (totals, codes) ALWAYS in mono for vertical alignment in tables.

### 1.3 Spacing & Radius

- Base spacing: `4px` units (Tailwind `1` = 4px).
- Card radius: `--radius-card: 12px`.
- Button radius: `--radius-btn: 8px`.
- Input radius: `--radius-input: 6px`.

---

## 2. Direction (RTL/LTR Mirroring)

- All layouts use **logical properties** (`ms-*`, `me-*`, `start-*`, `end-*`).
- Direction toggled at root: `<html dir="rtl" lang="ar">` or `dir="ltr" lang="en"`.
- Icons that imply direction (chevrons, arrows) **MUST flip in RTL**:

```tsx
<ChevronRight className="rtl:rotate-180" />
```

- Numbers stay LTR even in RTL: wrap in `<bdi dir="ltr">{number}</bdi>`.

---

## 3. Component Catalog (shadcn/ui)

| Component | File | Notes |
|-----------|------|-------|
| `Button` | `src/components/ui/button.tsx` | variants: default, secondary, ghost, destructive |
| `Input`, `Textarea` | `src/components/ui/input.tsx` | RTL-aware |
| `Select` | Radix-based | search built-in for >10 options |
| `Dialog` | Radix Dialog | escape closes; click outside dismisses |
| `Dropdown` | Radix DropdownMenu | role-based menu items |
| `Tabs` | Radix Tabs | URL-synced tabs preferred |
| `Toast` | react-hot-toast | top-right (LTR) / top-left (RTL) |
| `DataTable` | `@tanstack/react-table` | server-side sort/filter |
| `Switch`, `Label` | Radix | form-control standards |

> **Rule:** never inline-style; use Tailwind classes + design tokens.

---

## 4. Layout Patterns

### 4.1 Page Shell

```
┌─────────────────────────────────────────────┐
│ Top Bar (logo · breadcrumbs · search · user)│
├──────────┬──────────────────────────────────┤
│ Side     │  Page Header                     │
│ Nav      │ ─────────────────────────────────│
│ (RTL:    │  Content area                    │
│ on right)│  · Filters                       │
│          │  · Data table / forms            │
│          │  · Footer actions                │
└──────────┴──────────────────────────────────┘
```

### 4.2 Form Standards

- Labels above inputs (not floating).
- Required marker: red asterisk `*` after label.
- Errors directly under field (red, 12px).
- Hints / examples in muted gray below field.
- Currency / number fields right-aligned numbers (in RTL still right-aligned by direction).

### 4.3 Empty States

- Always include: icon + heading + 1-line description + primary action button.
- Example: "لا توجد فواتير بعد. ابدأ بإنشاء أول فاتورة لعميلك." [+ زر "إضافة فاتورة"]

### 4.4 Loading States

- Skeleton blocks (not spinners) for known-shape content.
- Spinner for unknown duration ops.
- Optimistic UI for fast actions (POS, line edits).

---

## 5. Iconography

- Library: `lucide-react`.
- 16/20/24px sizes.
- Stroke width 1.5 (matches Inter's stroke feel).
- Don't mix lucide with other libraries.

---

## 6. Data Density Modes

| Mode | Row height | Use |
|------|-----------|-----|
| Comfortable | 56px | onboarding / forms |
| Standard | 44px | default |
| Compact | 32px | accountants reviewing many rows |
| Dense | 24px | trial balance / GL listing |

User preference saved per role.

---

## 7. Accessibility

- WCAG 2.1 AA target.
- All form fields associated with `<label htmlFor>`.
- Focus-visible ring: `focus:ring-2 focus:ring-brand-primary`.
- Tab order matches visual order in both RTL and LTR.
- Color is never the sole indicator (also use icons + text).
- Tested with screen reader (NVDA, JAWS, VoiceOver) on golden paths.

---

## 8. Print Styles

```css
@media print {
  .no-print { display: none; }
  body { font-size: 11pt; color: #000; background: #fff; }
  table { page-break-inside: auto; }
  tr { page-break-inside: avoid; page-break-after: auto; }
  thead { display: table-header-group; }
}
```

- Invoice prints: A4 portrait, 15mm margins, header on each page (legal req).
- Bilingual print (Arabic + English columns) for export-grade invoices.

---

## 9. Motion Guidelines

| Element | Duration | Easing |
|---------|----------|--------|
| micro-feedback (hover) | 150ms | `ease-out` |
| dialog open | 200ms | `ease-out` |
| toast slide | 250ms | `ease-out` |
| route transition | 0 (instant) — avoid in ERP |
| skeleton shimmer | 1.6s loop | linear |

> **Rule:** no motion on routine ERP interactions (data tables, filters). Reserve animation for confirmation moments only.

---

## 10. Responsive Breakpoints

| Bp | Width | Devices |
|----|-------|---------|
| `sm` | 640px | mobile portrait |
| `md` | 768px | tablet portrait |
| `lg` | 1024px | tablet landscape / small laptop |
| `xl` | 1280px | desktop |
| `2xl` | 1536px | large desktop |
| `pos` | n/a | dedicated POS layout (touch-first) |

- POS UI is its own layout: large buttons (≥48px), no sidebar, optimized for portrait tablet.

---

## 11. Forbidden Patterns

- ❌ inline `style={{ ... }}` (use Tailwind)
- ❌ `<div onClick>` (use `<button>`)
- ❌ free-form colors (always use tokens)
- ❌ hardcoded Arabic/English text in components (use i18n keys)
- ❌ `position: absolute` for layout (only for popovers)
- ❌ font-size in px (use Tailwind size scale)
- ❌ `console.log` left in production components

---

## 12. References

- [Wireframes](./wireframes.md)
- [i18n Plan](../i18n/translation-plan.md)
- [shadcn/ui docs](https://ui.shadcn.com/)
- [Tailwind 4 docs](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
