# UI Component Library — موحدة عبر النظام

> **المرجعيات:** SAP Fiori Design System、Salesforce Lightning、Material Design、Atlassian Design System、Ant Design
> **الهدف:** مكتبة components موحدة تُستخدم عبر كل الصفحات الـ290 في النظام

---

## 1) لماذا library موحد؟

لو كل صفحة بنت UI خاص بها → 290 implementation مختلفة → maintenance hell.

الحل: **Component Library** يضمن:
- Visual consistency
- Behavioral consistency
- Accessibility (a11y) موحدة
- RTL support موحد
- Performance optimization مركزية
- Faster development (use existing vs build new)

موجود حالياً: `src/components/ui/*` (shadcn/ui base)
**النواقص:** components متخصصة لـ ERP

---

## 2) Components الأساسية (موجودة حالياً)

| Component | الحالة | الموقع |
|-----------|--------|---------|
| Button | ✅ | components/ui/Button.tsx |
| Input | ✅ | components/ui/Input.tsx |
| Select | ✅ | components/ui/Select.tsx |
| Dialog/Modal | ✅ | components/ui/Dialog.tsx |
| Card | ✅ | components/ui/Card.tsx |
| Switch | ✅ | components/ui/Switch.tsx |

---

## 3) Components الناقصة (يجب بناؤها)

### A) Data Display (15 components)

#### `<DataTable>`
- Server-side pagination
- Sorting (multi-column)
- Filtering (column filters + global search)
- Row selection (single + multi)
- Inline editing (optional)
- Column resizing + reordering
- Sticky header + first column
- Row expansion (sub-rows)
- Cell formatters (money, date, status, link)
- Export (CSV/Excel/PDF)
- Density (compact/normal/comfortable)
- Empty state (no data)
- Loading skeleton
- Error state
- RTL-aware
- Virtual scrolling for >1000 rows

```tsx
<DataTable
  columns={columns}
  fetchData={({ page, pageSize, sort, filters }) => api.getInvoices(...)}
  rowKey="id"
  selectionMode="multi"
  onRowClick={handleRowClick}
  density="normal"
  exportable
  toolbar={<CustomToolbar />}
/>
```

#### `<KanbanBoard>`
- Drag-drop columns
- Drag-drop cards between columns
- Custom card renderer
- Column WIP limits
- Filtering
- Used for: SO pipeline, Tickets, Tasks

#### `<Timeline>`
- Vertical or horizontal
- Custom node renderer
- Date markers
- Connecting lines
- Used for: customer activity, employee lifecycle, audit trail

#### `<TreeView>`
- Hierarchical data
- Expand/collapse
- Search/filter
- Drag-drop reordering
- Selection (single/multi)
- Used for: COA, Categories, Org Chart, Folders

#### `<FlowDiagram>`
- BPMN-style
- Steps + connections
- Status per step
- Click for details
- Used for: BPF visualization, Approval workflows

#### `<KpiCard>`
- Big number + label
- Comparison (vs previous)
- Trend indicator
- Sparkline
- Click for drill-down
- Used in: every dashboard

#### `<Chart>` (wraps Recharts)
- Line / Bar / Pie / Area / Scatter / Heatmap
- Multi-series
- Tooltips
- Legends
- RTL-aware axes
- Drill-down on click

#### `<Gauge>`
- Radial
- Color zones
- Target marker
- Used in: KPIs, health scores

#### `<Calendar>`
- Month/week/day views
- Events with custom rendering
- Drag to create
- Click for details
- Used for: leaves, bookings, schedules

#### `<Gantt>`
- Tasks with dates
- Dependencies
- Resource view
- Used for: project planning, production scheduling

#### `<Map>`
- Markers + clustering
- Polygons (geofences)
- Routes
- Used for: fleet tracking, customer locations, branches

#### `<Stepper>`
- Linear or non-linear
- Step status (pending/active/done/error)
- Used for: wizards, workflows

#### `<Badge>`
- Status colors (success/warning/danger/info)
- Sizes
- With icon
- Used everywhere for status

#### `<Avatar>`
- Image or initials
- Sizes
- Status indicator
- Used for: users, customers, employees

#### `<Tag>`
- Removable
- Colors
- Used for: tags, custom fields, filters

---

### B) Data Entry (12 components)

#### `<DateRangePicker>`
- Single + range
- Presets (today, this month, etc.)
- Hijri calendar option
- RTL-aware
- Validation
- Used in: every report filter

#### `<MoneyInput>`
- Currency selector
- Locale formatting
- Negative support
- Used for: all amounts

#### `<EntityAutocomplete>`
- Customer, Vendor, Product, Employee, Account, etc.
- Async fetch
- Recent + favorites
- Quick add (+ create new)
- Used in: every entity link

#### `<SearchInput>`
- Debounced
- Clear button
- Search history
- Used in: every search

#### `<RichTextEditor>`
- Tiptap or similar
- Variables/merge tags
- Image embed
- Tables
- Used for: email templates, document templates

#### `<FileUpload>`
- Drag-drop
- Multiple files
- Progress
- Preview (images, PDF)
- Used everywhere for attachments

#### `<MultiSelect>`
- Tags-style selection
- Search within
- Add new (create on the fly)
- Used for: tags, categories, recipients

#### `<DynamicTable>` (table input)
- Add/remove rows
- Inline edit
- Validation per row
- Auto-totals at bottom
- Used for: invoice lines, JE lines, BOM ingredients

#### `<AddressInput>`
- Country dropdown
- City autocomplete
- Postal code validation
- Geo lookup (optional)
- Saudi-specific (national address)

#### `<PhoneInput>`
- Country code prefix
- Format validation
- WhatsApp/SMS verification
- Used for contacts

#### `<IbanInput>`
- Mod-97 validation
- Country prefix
- Auto-format (groups of 4)
- Bank lookup
- Used for: bank info

#### `<SignaturePad>`
- Touch-friendly
- Save as base64/image
- Used for: PoD, e-signing

---

### C) Feedback (6 components)

#### `<Toast>`
- Success/error/warning/info
- Auto-dismiss
- Action button
- Stacking
- Used everywhere for non-blocking feedback

#### `<ConfirmDialog>`
- Type-to-confirm (for destructive)
- Async action
- Multi-step (confirmation + password + MFA)
- Used for: deletes, posts, cancels

#### `<ProgressBar>`
- Determinate + indeterminate
- Steps mode
- Used for: long operations

#### `<Spinner>`
- Sizes
- With text
- Used for loading states

#### `<EmptyState>`
- Icon + title + description + action
- Customizable per context
- Used in: empty grids, no results

#### `<ErrorBoundary>`
- Catches React errors
- Friendly message
- Report bug button
- Reload action

---

### D) Navigation (8 components)

#### `<AppShell>`
- Sidebar + header + content
- Responsive (collapsible sidebar)
- Multi-tenant context
- Language switcher
- User menu
- Notifications bell
- Quick actions

#### `<Breadcrumbs>`
- Auto-generated from route
- Click to navigate

#### `<Tabs>`
- Horizontal + vertical
- Closable tabs (for documents)
- Lazy loading content
- Used for: detail pages with multiple sections

#### `<Sidebar>` (collapsible)
- Tree navigation
- Search within
- Pinned items
- Recent items

#### `<CommandPalette>` (Ctrl+K)
- Search across system
- Quick actions
- Recent items
- Keyboard-first
- Used as: primary navigation aid

#### `<NotificationsPanel>`
- Real-time
- Categories
- Mark read
- Action buttons inline

#### `<Wizard>`
- Multi-step form
- Progress indicator
- Validation per step
- Save progress (resume)
- Used for: setup wizards, complex forms

#### `<DrillDownPath>`
- Shows: GL → Account → JE → Source Doc
- Clickable each level
- Used for: financial drill-downs

---

### E) Layout (5 components)

#### `<SplitPane>`
- Resizable panes
- Used for: master-detail views

#### `<Grid>` (CSS Grid wrapper)
- Responsive columns
- Gap control

#### `<Stack>`
- Horizontal/vertical with gap
- Responsive

#### `<DescriptionList>`
- Key-value pairs
- Multi-column
- Used for: detail summaries

#### `<Section>`
- Title + actions + content
- Collapsible
- Used for: form sections

---

## 4) ERP-Specific Components (15)

### `<JournalEntryEditor>`
- DR/CR auto-balancing
- Account picker per line
- Cost center / project / branch
- Multi-currency
- FX rate preview
- Validation: balanced
- Used in: manual JE, recurring template

### `<InvoiceLineGrid>`
- Product picker
- Qty + UoM + price
- Discount + tax auto-calc
- Total at bottom
- Used in: sales invoice, PO, quote

### `<BomTreeEditor>`
- Multi-level
- Drag-drop ingredients
- Phantom flag
- By-products
- Used in: manufacturing recipes

### `<ApprovalChainViewer>`
- Visual chain (linear/parallel)
- Status per step
- Avatars + names
- Comments
- Used in: any document with approvals

### `<ZatcaQrPreview>`
- Generates ZATCA TLV QR
- Renders preview
- Validates per spec
- Used in: invoice preview

### `<AgingReport>`
- Customer/vendor with buckets (0-30, 31-60, etc.)
- Drill-down to invoices
- Color-coded

### `<TrialBalanceGrid>`
- Account hierarchy (tree)
- Period comparison
- DR/CR columns
- Drill-down to JEs
- Auto-totals

### `<DepreciationScheduleTable>`
- Per asset
- Period × method
- NBV after each period
- Editable for adjustments

### `<LeaseScheduleTable>`
- Period × interest × principal × ROU dep × balances
- Used in: IFRS 16

### `<EmployeePicker>`
- With photo + dept + role
- Org chart popover

### `<ShiftCalendar>`
- Multi-employee weekly view
- Drag-drop shift assignment
- Coverage indicators

### `<StockBinSelector>`
- Warehouse → Zone → Rack → Bin tree
- Available qty inline

### `<PaymentTermsBuilder>`
- Net days
- Discount terms (2/10 Net 30)
- EOM
- Custom installments

### `<TaxBreakdown>`
- Subtotal + tax components + total
- Multi-tax (VAT + Excise)
- ZATCA-compliant

### `<MultiCurrencyDisplay>`
- Original + functional
- FX rate shown
- Hover for details

---

## 5) Mobile Components (8)

### `<MobileBottomNav>`
- 4-5 main tabs
- Badges
- Active state

### `<MobileSwipeableCard>`
- Swipe left/right for actions
- Used in: ticket lists, todo

### `<MobileBarcode>`
- Camera scanner
- Manual entry fallback
- Used for: pick, count, scan items

### `<MobileSignature>`
- Touch-optimized signing
- Used for: PoD

### `<MobileCamera>`
- Photo capture
- Multiple photos
- Used for: maintenance, inspections, evidence

### `<MobileCheckIn>`
- GPS + photo + face
- One-tap

### `<MobileVoiceInput>`
- Voice-to-text
- Used for: quick notes, search

### `<MobilePullToRefresh>`
- Standard mobile pattern

---

## 6) Print Components (5)

### `<PrintInvoice>`
- ZATCA-compliant layout
- Multi-language (AR/EN/bilingual)
- QR + signature
- A4 portrait

### `<PrintReceipt>`
- POS receipt format
- 80mm thermal printer optimized
- Compact layout

### `<PrintReport>`
- Generic report wrapper
- Header + footer
- Page numbers
- Print-only styles

### `<PrintLabel>`
- Avery-compatible
- Barcode
- Multiple per sheet

### `<PrintCheck>`
- Bank check format
- MICR line

---

## 7) Accessibility (a11y) Standards

كل component يجب أن يدعم:
- Keyboard navigation (Tab, Enter, Escape, arrows)
- Focus visible
- ARIA labels
- Screen reader compatibility
- Color contrast (WCAG AA minimum)
- Reduced motion support
- Custom themes (light/dark/high-contrast)

---

## 8) RTL Support

كل component RTL-aware:
- Margin/padding flip
- Icons flip when directional
- Text alignment
- Number formatting
- Chart axes
- Calendar week start

`dir="rtl"` support throughout.

---

## 9) i18n

- Translation hook `useT()` available everywhere
- Date/number formatting per locale
- Pluralization rules
- Currency formatting
- Hijri calendar support

---

## 10) Theme System

```ts
const theme = {
  colors: {
    primary: { 50, 100, ..., 900 },
    secondary, success, warning, danger, info,
    neutral: { 50, ..., 900 },
  },
  spacing: { 0, 1, 2, ..., 24 },
  fontSize: { xs, sm, base, lg, xl, ...},
  borderRadius: { sm, md, lg, full },
  shadow: { sm, md, lg, xl },
  animation: { ... }
}
```

Per tenant white-label override.

---

## 11) Performance Patterns

- Memoization (React.memo)
- Code splitting (dynamic imports per route)
- Lazy load heavy components (charts, editors)
- Virtual scrolling for lists > 100
- Debounced inputs
- Optimistic UI updates
- Suspense boundaries

---

## 12) Testing Standards

كل component:
- Unit tests (rendering, interactions)
- Visual regression (Storybook + Chromatic)
- a11y tests (jest-axe)
- E2E happy paths

---

## 13) Documentation

كل component في Storybook:
- Props table
- Examples (default + variants)
- Code snippets
- Usage guidelines
- a11y notes
- Don'ts

---

## 14) Component Inventory Status

| Category | Components | الحالة |
|----------|-----------|--------|
| Data Display | 15 | 6 موجودة • 9 ناقصة |
| Data Entry | 12 | 8 موجودة • 4 ناقصة |
| Feedback | 6 | 4 موجودة • 2 ناقصة |
| Navigation | 8 | 5 موجودة • 3 ناقصة |
| Layout | 5 | 4 موجودة • 1 ناقص |
| ERP-Specific | 15 | 0 موجودة • 15 ناقصة |
| Mobile | 8 | 1 موجود • 7 ناقصة |
| Print | 5 | 1 موجود • 4 ناقصة |

**الإجمالي: 74 component • 29 موجودة • 45 ناقصة**

---

## 15) خطة التنفيذ

| الأسبوع | المجموعة |
|---------|---------|
| 1-2 | DataTable + KanbanBoard + Timeline + Stepper |
| 3-4 | TreeView + FlowDiagram + Calendar + Gantt |
| 5-6 | ERP-Specific batch 1 (JE editor, Invoice lines, BOM tree) |
| 7-8 | ERP-Specific batch 2 (Approval chain, ZATCA QR, Aging) |
| 9-10 | Mobile components |
| 11-12 | Print templates + a11y audit |

---

**الناتج:** Library موحد يُسرّع التطوير 5x ويضمن consistency عبر الـ290 صفحة.
