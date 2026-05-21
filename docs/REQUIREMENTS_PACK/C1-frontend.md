# C1 — Frontend / UI-UX

## الحالة الحالية
- 491 صفحة page.tsx
- 63 component + 17 shadcn primitive
- 1,755 UI nodes في graphify
- placeholders: 0 (تم تنظيف كل ComingSoonModule + FeatureDisabledPanel)
- 13 صفحة Enterprise بُنيت في الجلسة (PDPL/SIEM/Finance/HR)

## الفجوة (مقابل Salesforce Lightning / SAP Fiori)
- لا UX audit آلي
- بعض الصفحات بدون empty state / skeleton متسق
- لا A/B testing infrastructure
- لا analytics للـ user flows

## 🎯 Ready Prompt

```
المهمة: UX audit + توحيد للـ 491 صفحة.

السياق:
- 491 page.tsx + 63 component
- AI_EXECUTION_STANDARD v2.0 يحدد 15 ميزة UX إلزامية

المخرجات:
1) scripts/ux-audit.ts:
   لكل page.tsx + component، فحص:
   - dir="rtl" مُحدّد؟
   - empty state component مُستخدم؟
   - error boundary يلفّ الصفحة؟
   - skeleton loading (لا spinner عشوائي)؟
   - useToast للـ feedback؟
   - keyboard nav (tabIndex + focus-visible)؟
   - ARIA labels على الأزرار المهمة؟
   - mobile breakpoints (sm/md/lg)؟
   - permission-aware (usePermission)؟
   - i18n keys (no hardcoded Arabic strings)؟
   - logical margins (ms-/me- بدل ml-/mr-)؟

   Output: tmp/ux-audit.csv + tmp/ux-audit-summary.md
   Score: A (≥9/11) / B (≥7/11) / C (≥5/11) / F (<5/11)

2) Auto-fix common issues:
   - مفتاح i18n مفقود → استبدل بـ _t() helper
   - missing aria-label → اقترح بناءً على lucide-react icon
   - hardcoded color → استبدل بـ Tailwind token

3) UX best-practices doc:
   docs/MASTER_PACK/05-frontend/ux-checklist.md
   - كل ميزة بمثال code do/don't
   - links لـ shadcn components
   - Saudi RTL gotchas (Arabic numerals, calendar)

4) Analytics infrastructure:
   src/lib/analytics/page-tracker.ts
   - track page view + duration
   - track action button clicks
   - send to /api/analytics/events
   - privacy-aware (no PII sent)

القيود:
- لا تعديل في layout الصفحات إلا بـ approval
- backward compat — لا تكسر URLs
- accessibility ≥ WCAG AA target
```

## السيناريو

PM يفتح `tmp/ux-audit-summary.md`:

```
=== UX AUDIT — 491 PAGES ===

A (excellent): 87 pages (18%)
B (good):      213 pages (43%)
C (needs work): 142 pages (29%)
F (refactor):   49 pages (10%)

Top issues:
1. 234 pages missing empty state
2. 187 pages use spinner instead of skeleton
3. 156 pages have hardcoded Arabic strings
4. 89 pages missing keyboard nav

Recommended:
- Sprint 1: Fix all F-grade pages (49)
- Sprint 2: Add empty states (234)
- Sprint 3: Migrate to skeletons (187)
```

PM ينشئ tickets في Jira من القائمة → Sprint Planning.

## Data Flow

```
[Audit flow]
scripts/ux-audit.ts (run manually or CI)
   ↓
Walk src/app/(dashboard)/**/*.tsx
   ↓
For each file:
   AST parse (typescript)
   ↓
   Check 11 criteria:
   ├→ has dir="rtl"?
   ├→ imports EmptyState?
   ├→ uses ErrorBoundary?
   ├→ uses Skeleton (not Spinner)?
   ├→ imports useToast?
   ├→ has tabIndex on interactives?
   ├→ has aria-labels on icon-buttons?
   ├→ has responsive classes?
   ├→ uses usePermission()?
   ├→ uses _t() or t()?
   └→ uses logical CSS properties?
   ↓
   Score → A/B/C/F
   ↓
Aggregate → tmp/ux-audit.csv
   ↓
Generate summary md with sprint recommendations

[Analytics flow]
User opens /finance/cfo-dashboard
   ↓
PageTracker component mounts
   ↓
src/lib/analytics/page-tracker.ts
   ├→ Record: { event: 'page_view', path, ts, sessionId }
   └→ Buffer locally
   ↓
On unload OR 30s interval
   ↓
POST /api/analytics/events
   {
     events: [
       { event: 'page_view', path: '/finance/cfo-dashboard', duration: 14500 },
       { event: 'button_click', target: 'export_csv' },
     ]
   }
   ↓
Server stores in AnalyticsEvent table
   ↓
Daily rollup job → AnalyticsRollup table
   ↓
/admin/analytics dashboard
```

## ملفات المُنتَج

- `scripts/ux-audit.ts`
- `tmp/ux-audit.csv` + `tmp/ux-audit-summary.md`
- `docs/MASTER_PACK/05-frontend/ux-checklist.md`
- `src/lib/analytics/page-tracker.ts`
- `src/app/api/analytics/events/route.ts`
- `prisma/schema.prisma` — AnalyticsEvent model (new)
