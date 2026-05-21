# C2 — Wireframes & Mockups (مع Shutterstock/Unsplash assets)

## الحالة الحالية
- `docs/MASTER_PACK/09-wireframes/page-templates.md` (1 node فقط في graphify)
- `BUILD_PACK/wireframes/` — فارغ
- لا توجد Figma/Stitch outputs
- لا توجد assets images

## الفجوة (مقابل Figma Community / Material Design)
- لا hi-fi mockups
- لا illustrations معتمدة
- لا empty-state images
- لا onboarding visuals

## 🎯 Ready Prompt

```
المهمة: توليد wireframes + mockups + assets للصفحات الحرجة.

السياق:
- Stitch skill متاح في Claude Code
- react-components skill متاح
- Tailwind v4 + shadcn/ui موجودان
- اللغة الأساسية: عربي RTL

المخرجات:
1) Wireframes للصفحات الـ 12 الحرجة:
   استخدم stitch-design skill:

   1. POS Restaurant Table Map + KDS sidebar
   2. Journal Entry creation (with auto-balance hint)
   3. Bank Reconciliation 3-pane (statement | rules | matched)
   4. Period Close Wizard (16 steps with blockers)
   5. ZATCA Submission timeline + retry CTA
   6. Payment Run Approval matrix
   7. Shop Floor MO Board (drag-drop)
   8. AI Copilot (chat + citations + JE preview pane)
   9. PDPL Breaches dashboard (built but needs polished mockup)
   10. Mudad Compliance status
   11. Nitaqat Simulator (before/after comparison)
   12. CFO Dashboard (KPI grid + trend chart)

   Design tokens:
   - dir=rtl
   - font=IBM Plex Sans Arabic
   - primary=#0F766E
   - density=compact
   - mode=light (with dark variant)

   Save: designs/wireframes/<screen>.png + DESIGN.md
   ثم: react-components skill scaffolds → src/components/<feature>/

2) Asset library:
   لا Shutterstock (commercial license costly).
   البدائل المجانية:
   - undraw.co (free SVG illustrations)
   - unsplash.com (free photos)
   - heroicons.com (icons - already using lucide-react)

   Download + store: public/assets/
   ├── empty-states/  (no-data, no-results illustrations)
   ├── onboarding/    (welcome, setup illustrations)
   ├── errors/        (404, 500, network error)
   └── icons/         (SAR symbol, Saudi flag, etc.)

3) Empty State component محسّن:
   src/components/ui/EmptyState.tsx:
   - illustration prop (from public/assets)
   - title + message + CTA
   - variant prop (no-data | no-results | error)

4) Storybook stories:
   src/stories/EmptyState.stories.tsx (showcases all variants)

5) Asset usage doc:
   docs/MASTER_PACK/09-wireframes/asset-library.md
   - كل asset مع licensing info
   - usage examples
   - download script (refreshes monthly)

القيود:
- كل asset مُرخّص للاستخدام التجاري
- max 500KB per image (optimize via squoosh)
- RTL-friendly compositions
- لا صور AI-generated بدون موافقة legal
```

## السيناريو

مصمم خارجي ينضم للفريق:

1. يفتح `designs/wireframes/`
2. يرى 12 PNG hi-fi mockup
3. يستورد كلها لـ Figma
4. PM يفتح `src/components/<feature>/` ويجد React scaffold لكل واحد
5. Dev يضيف logic بناء على الـ scaffold (الـ UI جاهز 80%)
6. Empty states في كل الصفحات تستخدم illustrations من `public/assets/`
7. Storybook (لو فُعِّل في E1) يعرض كل variants

## Data Flow

```
[Design generation flow]
Claude Code session:
   /stitch-design with prompts above
   ↓
Stitch API generates hi-fi designs
   ↓
designs/wireframes/<screen>.png saved
designs/wireframes/DESIGN.md (tokens used)
   ↓
react-components skill consumes designs
   ↓
src/components/<feature>/<Screen>.tsx scaffolded
   ↓ (AST validation)
src/app/(dashboard)/<route>/page.tsx imports the scaffold

[Asset download flow]
scripts/download-assets.sh (monthly cron)
   ↓
For each asset in assets-manifest.json:
   curl <undraw|unsplash url> -o public/assets/<path>
   ↓
squoosh-cli auto-optimize
   ↓
Update assets-manifest.json with new hash
   ↓
git add public/assets/ assets-manifest.json
   ↓
PR auto-generated

[Empty state usage]
src/app/(dashboard)/finance/credit-check/page.tsx
   ↓
import { EmptyState } from '@/components/ui/EmptyState'
   ↓
<EmptyState
  variant="no-data"
  illustration="/assets/empty-states/no-customers.svg"
  title={_t('لا توجد بيانات', 'No data')}
  message={...}
  cta={{ label: 'إضافة', onClick: ... }}
/>
   ↓
Renders illustration + content
```

## ملفات المُنتَج

- `designs/wireframes/<screen>.png` × 12
- `designs/wireframes/DESIGN.md`
- `src/components/<feature>/<Screen>.tsx` × 12
- `public/assets/empty-states/` (10-20 SVGs)
- `public/assets/onboarding/`
- `src/components/ui/EmptyState.tsx` (enhanced)
- `src/stories/EmptyState.stories.tsx`
- `docs/MASTER_PACK/09-wireframes/asset-library.md`
- `scripts/download-assets.sh`
