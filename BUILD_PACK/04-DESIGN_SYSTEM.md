# 04 — Design System / Style Guide
**Direction:** RTL-first (Arabic) + LTR (English) | **Theme:** Light + Dark

---

## 1. Brand Identity

- **Name:** Namasoft (نماسوفت)
- **Tagline AR:** نظام تخطيط موارد المؤسسات السعودي
- **Tagline EN:** Saudi Enterprise Resource Planning
- **Personality:** Professional, trustworthy, modern, regional

---

## 2. Color Palette

### 2.1 Primary
| Token | Hex | Usage |
|-------|-----|-------|
| primary-50 | #EFF6FF | backgrounds light |
| primary-100 | #DBEAFE | hover light |
| primary-500 | #3B82F6 | default |
| primary-600 | #2563EB | hover |
| primary-700 | #1D4ED8 | active |
| primary-900 | #1E3A8A | dark accent |

### 2.2 Neutral (Slate)
| Token | Hex | Usage |
|-------|-----|-------|
| neutral-50 | #F8FAFC | page bg light |
| neutral-100 | #F1F5F9 | card bg |
| neutral-200 | #E2E8F0 | borders |
| neutral-500 | #64748B | secondary text |
| neutral-700 | #334155 | body text |
| neutral-900 | #0F172A | primary text |

### 2.3 Semantic
| Token | Hex | Usage |
|-------|-----|-------|
| success | #10B981 | confirmed, paid, cleared |
| warning | #F59E0B | pending, hold |
| danger | #EF4444 | error, overdue, rejected |
| info | #06B6D4 | tips, neutral notice |

### 2.4 Saudi Identity Accent
| Token | Hex | Usage |
|-------|-----|-------|
| saudi-green | #006C35 | gov compliance markers |
| zatca-blue | #00538B | ZATCA badge |

### 2.5 Dark Mode
- Invert neutrals: bg #0F172A, text #F1F5F9
- Slightly desaturate primary
- Borders #1E293B

---

## 3. Typography

### 3.1 Font Families
- **Arabic:** "Cairo", "Tajawal", system-ui (load from Google Fonts)
- **English:** "Inter", system-ui
- **Numbers:** Latin digits always (better readability for finance)
- **Monospace (code, numbers in tables):** "JetBrains Mono"

### 3.2 Type Scale
| Token | Size | Weight | Use |
|-------|------|--------|-----|
| display | 48px | 700 | hero titles |
| h1 | 32px | 700 | page title |
| h2 | 24px | 600 | section title |
| h3 | 20px | 600 | card title |
| h4 | 18px | 600 | sub-section |
| body | 16px | 400 | body text |
| body-sm | 14px | 400 | secondary |
| caption | 12px | 400 | captions, labels |
| micro | 11px | 500 | tags, badges |

### 3.3 Line Height
- Display/H1: 1.2
- H2-H4: 1.3
- Body: 1.6
- Caption: 1.4

### 3.4 Letter Spacing
- Arabic: 0 (leave native)
- English: -0.01em for headings, 0 for body

---

## 4. Spacing System (8px base)

| Token | Value |
|-------|-------|
| 0 | 0 |
| 1 | 4px |
| 2 | 8px |
| 3 | 12px |
| 4 | 16px |
| 5 | 20px |
| 6 | 24px |
| 8 | 32px |
| 10 | 40px |
| 12 | 48px |
| 16 | 64px |
| 20 | 80px |

Tailwind's default applies (`p-4`, `gap-6`, etc).

---

## 5. Layout

### 5.1 Container Max-Width
- App content: max-w-7xl (1280px)
- Forms: max-w-2xl
- Reports: max-w-screen-2xl

### 5.2 Grid
- 12-column responsive
- Breakpoints (Tailwind defaults):
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px
  - 2xl: 1536px

### 5.3 Sidebar
- Width: 256px (desktop), collapsible to 64px icon-only
- Mobile: drawer pattern
- Dark navigation by default (better focus on content)

### 5.4 Topbar
- Height: 56px
- Sticky
- Contains: tenant switcher, search, notifications, user menu

---

## 6. Components

### 6.1 Button
| Variant | Use |
|---------|-----|
| primary | main action (Save, Submit) |
| secondary | secondary action (Cancel) |
| outline | tertiary |
| ghost | inline action |
| destructive | delete, void |
| link | inline navigation |

| Size | Padding | Height |
|------|---------|--------|
| sm | px-3 py-1.5 | 32px |
| md | px-4 py-2 | 40px |
| lg | px-6 py-3 | 48px |

States: default, hover, focus (ring), active, disabled, loading (spinner inside)

### 6.2 Input
- Height md: 40px
- Border: neutral-200, focus ring primary-500
- Error: border-danger + helper text below
- RTL: text-align right for Arabic, LTR enforced for numbers/IBAN

### 6.3 Select / Combobox
- Use shadcn Combobox pattern
- Always include search for > 7 items
- Group large lists (e.g., accounts by type)

### 6.4 Date Picker
- Default: Gregorian
- Toggle: show Hijri equivalent below
- Range picker for reports
- Quick picks: Today, This Week, This Month, This Quarter, This Year, Last Year

### 6.5 Table
- Use @tanstack/react-table
- Virtualization for > 100 rows
- Sortable columns
- Filterable (per column + global)
- Inline edit for some
- Bulk actions toolbar
- Sticky header
- Footer with totals
- Export buttons (CSV, Excel, PDF)
- Save view (filters + columns)

### 6.6 Form
- Vertical layout (label above input)
- Required: red asterisk after label
- Helper text in neutral-500
- Error in danger-500
- Submit button bottom-left (RTL: bottom-right)
- Cancel button next to submit

### 6.7 Card
- bg-white (light) / neutral-900 (dark)
- border-neutral-200 / 700
- p-6
- shadow-sm
- rounded-lg

### 6.8 Modal / Dialog
- Center, max-w-lg default
- Backdrop blur
- ESC closes
- Focus trap
- Slide-in for mobile

### 6.9 Drawer
- Right (LTR) or Left (RTL)
- Use for filters, side details

### 6.10 Toast / Notification
- Top-right (LTR) / Top-left (RTL)
- Auto-dismiss 5s
- Types: success, error, warning, info
- Action button optional ("Undo")

### 6.11 Badge / Status Pill
| Status | Color |
|--------|-------|
| DRAFT | neutral |
| PENDING | warning |
| APPROVED | success-light |
| POSTED | success |
| REJECTED | danger |
| CANCELLED | neutral-dark |
| OVERDUE | danger |
| PAID | success |

### 6.12 Skeleton Loading
- Show for any data > 200ms loading
- Match content shape

### 6.13 Empty States
- Illustration (use undraw.co or custom SVG)
- Headline + description
- Primary action button
- Avoid blank screens

### 6.14 Charts (Recharts)
- Color palette consistent with semantic colors
- Always show tooltip
- Accessible (ARIA labels)
- Mobile responsive

---

## 7. Iconography

- **Library:** lucide-react (default)
- **Sizes:** 16, 20, 24, 32
- **Stroke:** 1.5 (default)
- **Custom:** save in `public/icons/` for Saudi-specific (ZATCA logo, GOSI logo, riyal symbol)
- Always provide aria-label

---

## 8. RTL Considerations

### 8.1 Direction
- `<html dir="rtl">` for Arabic locale
- Use logical properties: `start/end` instead of `left/right`
- Tailwind: use `ms-/me-` instead of `ml-/mr-`

### 8.2 Icons That Mirror
- Arrows, undo/redo, list-toggle, breadcrumb chevron → mirror via `[dir=rtl]:scale-x-[-1]`

### 8.3 Icons That Don't Mirror
- Numbers, clock, search, settings, person, calendar → never mirror

### 8.4 Numbers
- Always Latin digits (1234567890)
- Keep numbers in LTR even in RTL context (using `<bdi>` or `dir="ltr"`)

### 8.5 Bidi
- Mixed Arabic + English in same field: use `<bdi>` to isolate runs
- Tables with numeric columns: explicit dir="ltr" on number cells

---

## 9. Accessibility (WCAG 2.1 AA)

- Color contrast: 4.5:1 for text, 3:1 for UI components
- Focus visible always (2px ring offset 2px)
- Keyboard navigation: all interactive elements reachable
- ARIA labels for icon-only buttons
- Live regions for toasts and updates
- Skip-to-content link
- Form labels associated explicitly
- Error messages announced
- Heading hierarchy correct
- Language attribute on bilingual content

---

## 10. Stock Images / Illustrations

- **Source priority:** custom > undraw.co (free) > Shutterstock (paid for hero) > Unsplash
- **Avoid:** generic stock business photos
- **Saudi context:** prefer images showing Saudi locations, attire, and business contexts
- **Optimization:** WebP/AVIF + Next.js Image component
- **Sizes:** generate responsive (320, 640, 1280, 1920)

---

## 11. Component Patterns Library

### 11.1 List + Detail
- Master-detail split: list left (1/3), detail right (2/3)
- Mobile: full-screen list → tap → full-screen detail with back

### 11.2 Wizard (multi-step form)
- Top stepper (1-2-3-4)
- Save as draft on each step
- Validate per step before next
- Back to any prior step
- Summary on final step

### 11.3 Approval Card
- Header: title + amount + requestor
- Body: key fields
- Footer: Approve, Reject (with reason modal), Delegate

### 11.4 Filters Bar
- Date range
- Status pills (multi-select)
- Free-text search
- Saved filters dropdown
- Clear all button
- Result count

### 11.5 Confirmation Modal
- Required for: delete, void, post, cancel
- Type DELETE for hard-delete (extra safe)
- Show what will happen + cascading effects

### 11.6 Bulk Actions
- Checkbox column
- Sticky toolbar appears when > 0 selected
- Show count: "X selected — Approve / Export / Delete"
- Confirm modal for destructive

---

## 12. Motion / Animation

- Use sparingly
- Easing: ease-out for enter, ease-in for exit
- Duration: 150-250ms typical, 400ms max
- Reduce motion: respect `prefers-reduced-motion`
- Examples:
  - Modal: scale + fade in 200ms
  - Toast: slide in 200ms
  - Page transitions: subtle fade
  - Skeleton shimmer: 1.5s infinite

---

## 13. Tailwind Configuration

```js
// tailwind.config.js (extends)
theme: {
  extend: {
    colors: {
      primary: { 50:'#EFF6FF', ..., 900:'#1E3A8A' },
      neutral: { 50:'#F8FAFC', ..., 900:'#0F172A' },
      success: '#10B981', warning: '#F59E0B', danger: '#EF4444', info: '#06B6D4',
      saudi: '#006C35', zatca: '#00538B'
    },
    fontFamily: {
      sans: ['Cairo', 'Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace']
    },
    borderRadius: {
      sm: '4px', DEFAULT: '6px', md: '8px', lg: '12px', xl: '16px'
    }
  }
}
```

---

## 14. Component Library Folder Structure

```
src/components/
├── ui/                    # primitive (shadcn-based)
│   ├── button.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── modal.tsx
│   ├── data-table.tsx
│   ├── date-picker.tsx
│   ├── ...
├── layouts/
│   ├── dashboard-layout.tsx
│   ├── public-layout.tsx
│   ├── pos-layout.tsx
├── shared/                # cross-module
│   ├── currency-input.tsx
│   ├── account-picker.tsx
│   ├── customer-picker.tsx
│   ├── product-picker.tsx
│   ├── tax-code-picker.tsx
│   ├── status-badge.tsx
│   ├── audit-log-viewer.tsx
│   ├── attachments-panel.tsx
│   ├── workflow-history.tsx
├── accounting/
├── sales/
├── ...                    # per-module components
```

---

## 15. Icons / Imagery Don'ts

- ❌ No flag emojis for countries (use SVG flags from flag-icons npm)
- ❌ No religious or political imagery
- ❌ No alcohol or pork in restaurant POS demos
- ❌ No mixed-gender stock photos for HR if conservative tenant requests filter
- ❌ No "before/after" weight loss imagery in clinic module

---

## 16. Tone of Voice

### 16.1 Arabic
- Standard Arabic (الفصحى)
- Avoid colloquialisms
- Polite imperatives ("اضغط هنا" not "اضغط")
- Active voice
- Short sentences

### 16.2 English
- Plain, professional
- Active voice
- Sentence-case for buttons ("Save changes" not "Save Changes")
- Title-case for navigation and page titles

### 16.3 Errors
- Empathetic ("نعتذر، حدث خطأ ما")
- Actionable ("حاول مرة أخرى" / "تواصل مع الدعم")
- Specific when possible (avoid "An error occurred")

### 16.4 Money / Numbers
- Always show currency code/symbol
- Thousand separator: comma
- Decimal: dot (Arabic users use dot for currencies)
- Negative: parentheses (1,234.56) or minus sign per accounting context

---

## 17. Print Templates

- See `print-template-engine.ts`
- A4 portrait default (some Saudi forms A4 landscape)
- Header: company logo + ZATCA QR (if invoice)
- Footer: page X of Y + generation timestamp
- Bilingual: Arabic right, English left for B2B
- Always include CR + VAT number in invoice header
