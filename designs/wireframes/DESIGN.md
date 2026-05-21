# Nama Invest ERP - Design System & Tokens

## Core Tokens

- **Direction**: RTL (Right-to-Left) for Arabic primary interface.
- **Typography**: `IBM Plex Sans Arabic` for primary font, falling back to `sans-serif`.
- **Primary Color**: Teal `#0F766E`
- **Secondary Color**: Slate `#64748B`
- **Density**: Compact (for high data density ERP screens).
- **Mode**: Light mode by default, dark mode supported via `dark:` Tailwind variants.

## Screen Layout Principles

1. **Sidebar Navigation**: Fixed right sidebar with collapsible module categories.
2. **Top App Bar**: Breadcrumbs, global search, tenant switcher, and user profile.
3. **Main Content Area**:
   - Header with title and primary actions (e.g., Save, Export).
   - Filter/Search bar for lists.
   - Data Table / Grid for content.
4. **Forms**: 
   - 2-column or 3-column grid for standard inputs.
   - Labels positioned above inputs.

## Component Library (shadcn/ui + Tailwind)

- Buttons: Rounded-lg, slight shadow.
- Cards: White background, subtle border, no shadow by default.
- Inputs: Gray-50 background, blue ring on focus.

## Empty States

All empty states should use the `<EmptyState>` component with the corresponding unDraw SVG illustration.
