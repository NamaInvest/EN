# Namasoft ERP — AI Execution Standard (v2.0)

> الدستور الهندسي الداخلي. أي AI agent يعمل على المشروع يبدأ من هذا الملف.
> آخر تحديث: 2026-05-19

## السياق العام
- المشروع: Namasoft ERP — Mid-to-Large Enterprise Platform
- Stack: Next.js 16 + Prisma 5.22 + TypeScript strict + Tailwind v4 + shadcn
- Region: Saudi Arabia (primary), GCC (secondary)
- Compliance: ZATCA Phase 2 · SOCPA · PDPL · GOSI · WPS · Saudi Labor Law
- اللغة: عربي RTL أساسي + إنجليزي

## الوثائق الإلزامية القراءة (قبل أي تنفيذ)
1. CLAUDE.md
2. .ai-brain/19-claude-rules.md
3. .ai-brain/04-api-routes.md
4. .ai-brain/15-saudi-compliance.md
5. .ai-brain/20-accounting-domain.md (للمحاسبة)
6. graphify-out/GRAPH_REPORT_FRESH.md (لفهم الـ architectural debt)

---

## 🎯 TARGET
[ضع هنا اسم الصفحة، مثال: compliance/pdpl/breaches]

---

## 🚦 GATE 1 — Architecture Verification (إلزامي قبل أي UI)

قبل لمس أي كود UI، نفّذ الفحص التالي على الـ API المرتبط:

### فحوصات الـ API
| البند | الفحص | إن فشل |
|---|---|---|
| `withRoute` | كل route.ts يلفّ handler به | ARCHITECTURE_WARNING |
| `requireTenantId` | يُستدعى داخل كل handler | ARCHITECTURE_WARNING |
| RBAC | يفحص permission المناسب | ARCHITECTURE_WARNING |
| N+1 queries | لا `for ... await prisma.x.find` | إصلاح فوري |
| `any` type | صفر استخدام | إصلاح فوري |
| PII masking | لا تعيد iqama/IBAN/phone خام بلا مبرر | إصلاح فوري |
| Financial mutations | داخل `prisma.$transaction` فقط | ARCHITECTURE_WARNING |
| Auto-Journal | أي مال يدخل/يخرج → `src/lib/auto-journal.ts` | إصلاح فوري |
| Decimal | `n()` من `src/lib/decimal-utils.ts` للمبالغ، لا Float | إصلاح فوري |

### قاعدة القرار
- ✅ كل الفحوصات تمر → ابدأ بناء الـ UI
- ⚠️ مشكلة معمارية موجودة → **أوقف الـ UI**، أنشئ `tmp/ARCHITECTURE_WARNING_<target>.md` يحتوي:
  - الملفات المتأثرة (path:line)
  - الانتهاك بدقة
  - الإصلاح المقترح
- ثم أصلح الـ API أولاً، ثم أكمل الـ UI

---

## 🎨 GATE 2 — Enterprise UX Rules (إلزامي لكل صفحة)

كل صفحة list/CRUD يجب أن تدعم:

| الميزة | المصدر | إلزامية |
|---|---|:--:|
| Filters متعددة | `<DataTable filters={...}>` | ✅ |
| Search (debounced 300ms) | useState + useDeferredValue | ✅ |
| Pagination (server-side) | API يستقبل `?page&pageSize` | ✅ |
| Export CSV + XLSX | `src/lib/export/{csv,xlsx}.ts` | ✅ |
| Column visibility toggle | DataTable built-in | ✅ |
| Sort per column | DataTable built-in | ✅ |
| Responsive: mobile/tablet/desktop | Tailwind sm/md/lg breakpoints | ✅ |
| Keyboard navigation | tabIndex + focus-visible | ✅ |
| Retry on failed load | Button "إعادة المحاولة" | ✅ |
| Permission-aware UI hiding | `usePermission('<perm>')` | ✅ |
| Status badges (Posted/Draft/Pending) | `<StateBadge>` من ui | ✅ |
| Audit trail link | يفتح drawer جانبي بآخر 20 حدث | ✅ |
| Empty state واضح | `<EmptyState>` مع CTA | ✅ |
| Error boundary | يلفّ الصفحة | ✅ |
| Loading skeleton (ليس spinner) | `<Skeleton>` | ✅ |

**ممنوع:** صفحة CRUD بسيطة بدون هذي العناصر = رفض المراجعة.

---

## 📊 GATE 3 — Observability Hooks (لأي عملية حرجة)

كل mutation أو عملية تأخذ > 200ms يجب أن تُسجل:

```typescript
import { trace } from '@/lib/observability/financial-trace';

await trace({
  traceId: req.headers.get('x-trace-id') ?? crypto.randomUUID(),
  actorId: session.userId,
  tenantId: session.tenantId,
  module: '<MODULE>',  // 'pdpl' | 'finance' | 'hr' | ...
  action: '<ACTION>',  // 'create' | 'approve' | 'export' | ...
  duration: performance.now() - start,
  errorState: error ? { code, message } : null,
}, async () => {
  // العملية الفعلية
});
```

**الإلزام:**
- كل route.ts لـ mutation → يستخدم trace
- كل export action → يُسجّل مع عدد الصفوف المُصدَّرة
- كل approval → يُسجّل مع approver chain
- كل rejection/error → يُسجّل مع full stack

---

## ✅ GATE 4 — Enterprise Definition of Done (15 بنداً)

لا تعتبر الصفحة "خلصت" إلا بعد:

| # | الفحص | الأمر |
|--:|---|---|
| 1 | TypeScript يمر بدون errors | `npx tsc --noEmit` |
| 2 | ESLint يمر بدون warnings | `npm run lint` |
| 3 | RTL صحيح (تحقق visually في المتصفح) | افتح بـ `dir="rtl"` |
| 4 | Dark mode يعمل | toggle theme + تحقق |
| 5 | Mobile (375px) responsive | DevTools mobile view |
| 6 | Tablet (768px) responsive | DevTools |
| 7 | Permission matrix يعمل (admin/user/viewer) | جرّب 3 أدوار |
| 8 | Tenant isolation (تنانت B لا يرى تنانت A) | جرّب tenant آخر |
| 9 | Empty state يظهر عند 0 records | احذف البيانات مؤقتاً |
| 10 | Error state يظهر عند فشل API | افصل النت |
| 11 | Skeleton يظهر أثناء التحميل | throttle network |
| 12 | API latency < 500ms للقوائم، < 1s للتقارير | DevTools Network |
| 13 | لا console warnings (hydration/key/etc.) | افتح DevTools Console |
| 14 | i18n كامل (ar + en، صفر `t('key')` بدون مفتاح) | grep |
| 15 | Audit logging يكتب عند كل mutation | تحقق من `audit_logs` table |

**الـ AI يجب يطبع checklist بـ ✅/❌ لكل بند في نهاية الجلسة.**

---

## 📐 ترتيب التنفيذ الاستراتيجي (Vertical Completion)

❌ لا تبني 60 صفحة سطحية.
✅ ابني **عمودياً** — صفحة واحدة كاملة (API + UI + audit + exports + permissions + tests) قبل التالية.

### Phase A — Compliance & Legal (أعلى مخاطر) 🔴
| # | الصفحة | السبب |
|--:|---|---|
| 1 | `compliance/pdpl/breaches` | إلزام قانوني — تبليغ 72 ساعة |
| 2 | `compliance/pdpl/dsr` | حق الوصول/الحذف للبيانات |
| 3 | `admin/siem` | Security incident monitoring |

### Phase B — Financial Control 🟠
| # | الصفحة | السبب |
|--:|---|---|
| 4 | `finance/credit-check` | منع الديون المعدومة |
| 5 | `finance/cfo-dashboard` | رؤية تنفيذية يومية |
| 6 | `finance/vat/categories` | إدارة فئات VAT |
| 7 | `finance/wht/form14` | نموذج WHT للضريبة |
| 8 | `finance/rebates` | خصومات الموردين |

### Phase C — Saudi Government Integrations 🟠
| # | الصفحة | السبب |
|--:|---|---|
| 9 | `hr/mudad` | WPS portal — إلزامي |
| 10 | `hr/qiwa` + `hr/qiwa/contracts` | Qiwa labor — إلزامي |
| 11 | `hr/saudization` + `hr/nitaqat-simulator` | Nitaqat compliance |

### Phase D — Operational Intelligence 🟡
| # | الصفحة | السبب |
|--:|---|---|
| 12 | `procurement/spend-analytics` | تحليل مشتريات |
| 13 | `procurement/price-comparison` | مقارنة أسعار |
| 14 | `manufacturing/aps` | تخطيط متقدم |
| 15 | `crm/cx-nps` + `crm/key-accounts` | تجربة عملاء |
| 16 | `enterprise/projects/evm` | Earned Value Mgmt |

### Phase E — Sector Modules 🟡
| # | الصفحة | السبب |
|--:|---|---|
| 17 | `pharmacy` + `pharmacy/manager` | صيدلية |
| 18 | `pos/accountant` | كاشير محاسبي |
| 19 | `ai/demand-forecast` + `ai/nlq` + `ai/sales-coach` | AI ميزات |
| 20 | `marketing/analytics` + `fleet/tracking` + `maintenance/preventive` | متفرقة |

---

## 🚫 ممنوعات صارمة

- ❌ Prisma queries في صفحات client (`'use client'`)
- ❌ تجاوز `withRoute` أو `requireTenantId`
- ❌ إضافة npm dependency جديدة بلا موافقة صريحة
- ❌ تعديل > 5 ملفات في جلسة واحدة (Vertical Completion)
- ❌ ترك أي نص بدون i18n key
- ❌ استخدام `any` (استخدم `unknown` + type guard)
- ❌ تعديل قيد POSTED (أنشئ reversal)
- ❌ كتابة JE يدوياً (استخدم `auto-journal.ts`)
- ❌ تعديل ZATCA-cleared invoice (أصدر credit note)
- ❌ استخدام `Float` للمال (استخدم `Decimal(18,4)`)
- ❌ بدء صفحة بدون Gate 1 verification

---

## 📋 نمط بدء العمل (إلزامي)

1. **اقرأ الـ TARGET** أعلاه
2. **نفّذ Gate 1** (Architecture Verification) — أنشئ تقرير
3. **أعطني خطة 7 خطوات** قبل أي كتابة:
   - الملفات التي سأنشئها/أعدّلها
   - الـ API endpoints التي سأستهلكها
   - الـ components التي سأبنيها/أعيد استخدامها
   - الـ permissions المطلوبة
   - الـ audit events التي ستُسجَّل
   - مفاتيح i18n الجديدة
   - خطة الاختبار اليدوي
4. **انتظر موافقتي بكلمة "تمام"**
5. **نفّذ خطوة خطوة**، اعرض كل ملف قبل التالي
6. **بعد كل ملف**: شغّل `tsc --noEmit` على الملف
7. **في النهاية**: اطبع DoD checklist (15 بنداً) مع ✅/❌

---

## 📤 الـ Output النهائي المطلوب

في نهاية كل جلسة، أعطني:

### ✅ ملخص الإنجاز
- الملفات المضافة/المعدلة (مع المسارات الكاملة)
- عدد أسطر الكود الجديدة
- مفاتيح i18n المضافة (ar + en)
- الـ menu entry المضاف لـ Sidebar.tsx (لو الصفحة جديدة)

### 🧪 خطة الاختبار اليدوي
1. افتح <URL>
2. تحقق من <X>
3. اضغط <Button>
4. تحقق من <Y>
5. سجّل خروج كـ <Role>، أعد الدخول كـ <OtherRole>، تحقق من permission hiding

### 🔗 التبعيات والربط
- الـ API endpoints المُستهلكة
- الـ Prisma models المتأثرة
- الـ audit events المُسجَّلة
- الـ outbox events المُرسلة (إن وجدت)

### ⚠️ أي blockers/تحذيرات
- مشاكل معمارية مكتشفة (Gate 1 warnings)
- تبعيات ناقصة (missing icon, API, permission)
- اقتراحات تحسين للجلسة التالية

### ✔ DoD Checklist
| البند | ✅/❌ | ملاحظة |
|---|:--:|---|
| TypeScript passes | | |
| ESLint passes | | |
| RTL verified | | |
| Dark mode verified | | |
| Mobile responsive | | |
| Tablet responsive | | |
| Permission matrix verified | | |
| Tenant isolation verified | | |
| Empty state shown | | |
| Error state shown | | |
| Skeleton state shown | | |
| API latency < 500ms | | |
| No console warnings | | |
| i18n complete (ar+en) | | |
| Audit logging verified | | |

---

## 🎯 الفلسفة الحاكمة

> "Vertical Completion over Horizontal Coverage"
> "Architecture before Aesthetics"
> "Observable, Auditable, Reversible — أو لا تُبنى أصلاً"
> "Compliance Surfaces First, Convenience Last"

---

ابدأ الآن:
TARGET = [اكتب اسم الصفحة من Phase A أولاً، مثال: compliance/pdpl/breaches]
