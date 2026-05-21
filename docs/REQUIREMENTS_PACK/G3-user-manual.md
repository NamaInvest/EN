# G3 — User Manual

## الحالة الحالية
- `docs/user-manual/admin-manual.md` ✓
- `docs/user-manual/pharmacist/manual.md` ✓ (built this session)
- `docs/user-manual/integration_manager/manual.md` ✓ (built this session)
- `docs/MASTER_PACK/21-user-manual/` (9 nodes في graphify)
- لا manual لـ 11+ دور آخر

## الفجوة (مقابل NetSuite Help — 10,000+ صفحة)
- 13 دور بدون manual
- لا in-app help integration
- لا context-aware tooltips
- لا search عبر الـ manuals

## 🎯 Ready Prompt

```
المهمة: User manuals كاملة لكل دور + in-app help.

السياق:
- 14 دور رئيسي في النظام
- Phase A+B+C+D+E+F صفحات جديدة تحتاج documentation
- اللغة الأساسية: عربي

المخرجات:
1) Per-role manuals:
   docs/user-manual/<role>/manual.md
   roles needed (14 total):
   - cashier (POS)
   - restaurant_waiter
   - accountant
   - ar_clerk
   - ap_clerk
   - hr_officer
   - payroll_officer
   - warehouse_keeper
   - sales_rep
   - manager
   - cfo
   - owner
   - master_admin
   - tax_officer
   - security_officer (uses /admin/siem)
   - compliance_officer (uses /pdpl, /mudad, /saudization)
   - pharmacist (DONE)
   - integration_manager (DONE)

   كل manual 8 sections:
   1. تسجيل الدخول + الإعداد الأولي
   2. المهام اليومية (مع screenshots)
   3. المهام الأسبوعية
   4. المهام الشهرية
   5. أخطاء شائعة + التعافي
   6. اختصارات لوحة المفاتيح
   7. متى تتواصل مع X (escalation)
   8. الأسئلة الشائعة (15 Q&A)

   For each role, include:
   - Routes they use (from .ai-brain/14-modules-map.md)
   - Permissions (from .ai-brain/03-auth-permissions.md)
   - Realistic scenarios (from .ai-brain/49-scenarios-real-world.md)
   - Compliance gotchas (PDPL/ZATCA/GOSI if relevant)

2) In-app Help integration:
   src/components/HelpButton.tsx:
   - Floating "?" button on every page
   - Click → opens drawer
   - Shows relevant manual section based on:
     - Current route
     - Current user role
   - Search bar (searches across all manuals)
   - Link to full manual

   src/app/api/help/route.ts:
   - GET /api/help?route=<path>&role=<role>
   - Returns relevant manual section markdown
   - Cached aggressively

3) Context tooltips:
   src/components/InfoTooltip.tsx:
   - Used inline next to complex fields
   - Hover shows explanation + link to manual section
   - Example:
     ```jsx
     <label>Saudization % <InfoTooltip topic="nitaqat-band" /></label>
     ```
   - Backed by: docs/user-manual/_tooltips/<topic>.md

4) Search index:
   scripts/build-help-search-index.ts:
   - Crawl all docs/user-manual/**/*.md
   - Extract sections + content
   - Build inverted index
   - Output: public/help-search-index.json
   - Updated on each build

5) Print-friendly PDF:
   Per role: docs/user-manual/<role>/manual.pdf (auto-generated)
   - Includes screenshots
   - Formatted for A4
   - Cover page + TOC + index
   - For new employee onboarding packets

6) Tutorial videos integration (link to G4):
   Each manual section ends with:
   "🎥 شاهد الفيديو التوضيحي [link to /help/video/<id>]"

القيود:
- Arabic-first (English summary at end of each section)
- Screenshots updated when UI changes (in CI)
- max 30 pages per role manual
- search results < 200ms
```

## السيناريو

شركة سعودية توظف Tax Officer جديد:

**يوم 1 (Onboarding)**:
1. HR يطبع `docs/user-manual/tax_officer/manual.pdf` (30 صفحة)
2. Tax Officer يقرأها في 2 ساعة
3. يفهم:
   - Routes that uses: /finance/vat/categories, /finance/wht/form14, /finance/zakat
   - متى يقدم VAT return (15 من الشهر)
   - متى يقدم WHT Form 14 (10 من الشهر)
   - كيف يصدّر للـ ZATCA portal

**اليوم الأول من العمل**:
4. يدخل النظام
5. يفتح `/finance/vat/categories`
6. يحتار في معنى "Zero-rated vs Exempt"
7. يضغط زر "?" في أعلى الصفحة
8. Help drawer يفتح → يعرض القسم المتعلق بـ VAT categories
9. يقرأ التوضيح + مثال
10. يكمل العمل

**يحتاج مساعدة في حقل**:
11. حقل "ZATCA Code" غير مفهوم
12. Hover على ⓘ icon
13. tooltip: "رمز معتمد من ZATCA (مثل VATEX-SA-29) للإعفاءات"
14. Link: "اقرأ المزيد"
15. يضغط → manual section detail

## Data Flow

```
[Help button flow]
User on /finance/vat/categories
   ↓
Clicks "?" button
   ↓
HelpDrawer component opens
   ↓
fetch /api/help?route=/finance/vat/categories&role=tax_officer
   ↓
Backend:
   - Look up route → manual section
   - Look up role → relevant context
   - Combine + render markdown
   ↓
Drawer shows:
   - Section title
   - Markdown content
   - Embedded video (if available)
   - "Read full manual" link

[Search flow]
User types in help drawer search: "WHT"
   ↓
public/help-search-index.json loaded once
   ↓
Fuse.js fuzzy search
   ↓
Top 10 results sorted by:
   1. role match (tax_officer relevant)
   2. exact match
   3. fuzzy match
   ↓
Click result → navigate within drawer

[Manual update flow]
Developer modifies UI for /finance/vat/categories
   ↓
Pre-commit hook detects route changes
   ↓
Reminder: "Update docs/user-manual/tax_officer/manual.md section 2.3"
   ↓
Optional: screenshot CI auto-updates
   ↓
PR review checks manual is updated

[Onboarding flow]
New tax officer hired
   ↓
HR fires automation:
   POST /api/onboarding/start
   { email, role: 'tax_officer' }
   ↓
System:
   - Creates user account
   - Assigns role
   - Generates PDF manual (latest version)
   - Sends welcome email with PDF + login
   ↓
On first login:
   - Wizard tour through 5 main pages
   - Each page: "Press ? for help anytime"
   - Track completion
```

## ملفات المُنتَج

- `docs/user-manual/<role>/manual.md` × 14 (11 new + 3 done)
- `docs/user-manual/<role>/manual.pdf` × 14 (auto-generated)
- `docs/user-manual/_tooltips/<topic>.md` × ~50
- `src/components/HelpButton.tsx`
- `src/components/HelpDrawer.tsx`
- `src/components/InfoTooltip.tsx`
- `src/app/api/help/route.ts`
- `scripts/build-help-search-index.ts`
- `scripts/generate-manual-pdfs.ts`
- `public/help-search-index.json` (auto)
