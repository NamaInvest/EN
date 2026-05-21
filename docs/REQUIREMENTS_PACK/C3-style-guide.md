# C3 — Style Guide / Design System

## الحالة الحالية
- Tailwind v4 + shadcn/ui patterns
- 17 primitive في `src/components/ui/`
- 63 component مخصص
- `BUILD_PACK/04-DESIGN_SYSTEM.md` (465 سطر)
- لا tokens.json قابل للاستيراد
- لا Storybook

## الفجوة (مقابل Material UI / Ant Design)
- لا design tokens موحّدة
- لا visual regression testing
- لا dark mode tokens موثقة
- لا Figma library متطابقة

## 🎯 Ready Prompt

```
المهمة: design system كامل قابل للمشاركة مع المصممين.

السياق:
- Tailwind v4 config في tailwind.config.ts
- shadcn primitives في src/components/ui/
- IBM Plex Sans Arabic كـ default font
- primary color #0F766E

المخرجات:
1) src/design-system/tokens.json (W3C Design Tokens format):
   {
     "color": {
       "primary": { "value": "#0F766E", "type": "color" },
       "primary-hover": { "value": "#0E6B62", "type": "color" },
       "danger": { "value": "#DC2626", "type": "color" },
       ...
     },
     "spacing": {
       "xs": { "value": "4px" },
       "sm": { "value": "8px" },
       ...
     },
     "typography": {
       "font-family-primary": { "value": "IBM Plex Sans Arabic, sans-serif" },
       "font-size-base": { "value": "14px" },
       ...
     },
     "border-radius": { "sm": "4px", "md": "8px", "lg": "12px" },
     "shadow": { "card": "0 1px 3px rgba(0,0,0,0.1)", ... }
   }

2) Storybook setup:
   npx storybook@latest init
   Stories لكل من الـ 17 + 63 component
   src/stories/<Component>.stories.tsx
   Include variants:
   - default, hover, disabled, focus, error
   - RTL + LTR
   - light + dark mode

3) Figma Tokens plugin import:
   design-tokens.figma.json
   (تحويل من tokens.json — script: tokens-to-figma.ts)

4) Token enforcement:
   scripts/audit-hardcoded-styles.ts
   Walk src/**/*.tsx — تكشف:
   - hardcoded colors (#hex, rgb())
   - hardcoded sizes (px, em)
   - hardcoded fonts
   Output: tmp/style-violations.csv

5) docs/MASTER_PACK/17-style-guide/:
   - components.md — كل 80 component موثق
   - colors.md — palette + usage
   - typography.md — scale + RTL rules
   - spacing.md — 8pt grid system
   - dark-mode.md — strategy + tokens
   - accessibility.md — WCAG AA compliance

6) Visual regression tests:
   chromatic.com integration (via Storybook)
   .github/workflows/visual-regression.yml
   على كل PR: snapshot كل components

القيود:
- لا breaking changes في الـ APIs الموجودة
- backward compat: classes القديمة تبقى تعمل
- dark mode: كل token له dark variant
```

## السيناريو

مصمم Figma خارجي ينضم للمشروع:

1. PM يرسل له `design-tokens.figma.json`
2. مصمم يفتح Figma → plugin Tokens Studio → Import
3. كل colors/spacing/typography تظهر كـ Figma styles
4. مصمم ينشئ mockup جديد → كل العناصر تستخدم الـ tokens المعتمدة
5. Dev يفتح Figma → ينسخ classes Tailwind المطابقة (نفس الـ tokens)
6. Storybook يعرض الـ component → screenshot يطابق Figma 100%
7. Chromatic يكتشف أي تغيير بصري في PR

## Data Flow

```
[Design token flow]
src/design-system/tokens.json (source of truth)
   ↓
   ├→ scripts/tokens-to-tailwind.ts → tailwind.config.ts (CSS vars)
   ├→ scripts/tokens-to-figma.ts → design-tokens.figma.json
   └→ scripts/tokens-to-css.ts → src/app/globals.css (CSS variables)

[Storybook flow]
Developer adds new component
   ↓
Creates src/stories/<Component>.stories.tsx
   ↓
npm run storybook (dev)
   ↓
Browser shows component variants
   ↓
On PR push
   ↓
chromatic CI uploads snapshots
   ↓
chromatic.com compares with baseline
   ↓
PR comment: "X visual changes — review here"

[Audit flow]
Daily cron OR PR check
   ↓
scripts/audit-hardcoded-styles.ts
   ↓
Walk src/**/*.tsx
   ↓
Regex/AST find:
   - color: #hex
   - rgb()
   - font-family: hardcoded
   - inline styles with hardcoded values
   ↓
tmp/style-violations.csv
   ↓
If count > threshold (e.g. 20):
   create GitHub Issue with list
```

## ملفات المُنتَج

- `src/design-system/tokens.json`
- `design-tokens.figma.json`
- `scripts/tokens-to-tailwind.ts`
- `scripts/tokens-to-figma.ts`
- `scripts/audit-hardcoded-styles.ts`
- `.storybook/` (Storybook config)
- `src/stories/*.stories.tsx` × ~80
- `docs/MASTER_PACK/17-style-guide/*.md` × 6
- `.github/workflows/visual-regression.yml`
