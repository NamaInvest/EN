# 🌐 خطة التعريب — Namasoft ERP

> **130+ نص إنجليزي** يجب تعريبه عبر **15 ملف**.
> **الهدف:** كل النصوص المعروضة للمستخدم بالعربية مع fallback إنجليزي.

---

## الملفات بالأولوية

### 🔴 أولوية عالية (12 ملف، 100+ نص)

| # | الملف | عدد النصوص | السبب |
|---|------|-----------|-------|
| 1 | `v3/construction/boq/page.tsx` | 12 | فواتير مشاريع البناء — يصدر فواتير ZATCA |
| 2 | `admin/grc/page.tsx` | 12 | لوحة الامتثال — تقارير تنظيمية |
| 3 | `v3/distribution/wms/page.tsx` | 10 | إدارة مستودعات — عمليات يومية |
| 4 | `admin/bi-builder/page.tsx` | 9 | منشئ تقارير BI |
| 5 | `v3/clinic/lab/page.tsx` | 8 | عيادة + مختبر — مرضى |
| 6 | `admin/e2e-tester/page.tsx` | 8 | بيئة QA |
| 7 | `v3/master/page.tsx` | 8 | لوحة V3 الرئيسية |
| 8 | `v3/clinic/appointments/page.tsx` | 7 | مواعيد عيادة |
| 9 | `v3/clinic/page.tsx` | 6 | عرض عيادة |
| 10 | `v3/distribution/page.tsx` | 6 | عرض توزيع |
| 11 | `v3/construction/page.tsx` | 6 | عرض إنشاءات |
| 12 | `v3/manufacturing/page.tsx` | 6 | عرض تصنيع |

### 🟡 أولوية متوسطة (3 ملفات)

| # | الملف | عدد النصوص |
|---|------|-----------|
| 13 | `v3/realestate/page.tsx` | 6 |
| 14 | `admin/compliance/page.tsx` | 5 |
| 15 | `admin/grc/audit-log/page.tsx` | 3 |

---

## النمط المقترح للتعريب

### الخطوة 1: أضف الترجمات في `src/locales/ar.json`

```json
{
  "v3.construction.boq.title": "الفاتورة الكميّة وفواتير التقدّم",
  "v3.construction.boq.project_label": "المشروع",
  "v3.construction.boq.total_budget": "إجمالي الميزانية",
  "v3.construction.boq.bill_of_quantities": "بيان الكميات",
  "v3.construction.boq.site_excavation": "أعمال الحفر والتسوية",
  "v3.construction.boq.reinforced_concrete": "خرسانة مسلحة (الأساسات)",
  "v3.construction.boq.generate_invoice": "توليد فاتورة تقدّم",
  ...
}
```

### الخطوة 2: استبدل النص الثابت بـ `t()`

**قبل:**
```tsx
<h1>BOQ &amp; Progress Billing</h1>
<button>Generate Progress Invoice</button>
```

**بعد:**
```tsx
import { useTranslation } from '@/lib/translations';
const { t } = useTranslation();

<h1>{t('v3.construction.boq.title')}</h1>
<button>{t('v3.construction.boq.generate_invoice')}</button>
```

### الخطوة 3: تأكد من الـ RTL

كل صفحة يجب أن تكون داخل layout بـ `dir="rtl"`. تحقق من `src/app/(dashboard)/layout.tsx`.

---

## برومت جاهز للتنفيذ

```
عرّب الملفات الـ 15 المذكورة في I18N_PLAN.md. لكل ملف:

1. اقرأ الملف وحدد كل النصوص الثابتة في JSX (نصوص داخل tags + placeholder + title + button labels).
2. أضف مفاتيح ترجمة في src/locales/ar.json بالنمط: "{module}.{page}.{key}".
3. أضف نفس المفاتيح في src/locales/en.json (الإنجليزي الأصلي).
4. استورد useTranslation في الملف.
5. استبدل كل نص ثابت بـ t('key').
6. اختبر بصرياً: شغل /dashboard/{page} وتأكد أن النص العربي يظهر.

لا تترجم:
- console.log
- التعليقات
- أسماء المتغيرات
- attributes تقنية (key, id, className)

ابدأ بـ admin/grc/page.tsx لأنه الأكثر حرجاً (لوحة امتثال).
```

---

## الإحصائيات

| البُعد | القيمة |
|-------|--------|
| **إجمالي الملفات** | 15 |
| **إجمالي النصوص** | ~130 |
| **مفاتيح ترجمة جديدة** | ~150 |
| **الوقت المتوقع** | 2-3 أيام عمل |
| **الأثر:** | 130+ نص تنتقل من EN-only إلى AR/EN |

---

## ملاحظات خاصة

✅ **مترجم بالفعل:**
- Sidebar.tsx (مترجم بالكامل)
- AI modules (ai-cfo, ai-bank, ai-copilot, ai-scm)
- accounting/* (معظمه)
- sales/*, purchases/*, hr/* (معظمه)

❌ **يحتاج عمل إضافي:**
- v3/* (8 من 12 صفحة فيها مشكلة) — هذه صفحات قوالب جديدة
- admin/* (4 صفحات) — أدوات داخلية لكنها مهمة

🎯 **الأولوية القصوى:** ابدأ بـ `admin/grc/page.tsx` و `v3/construction/boq/page.tsx` لأنهما يصدران تقارير تنظيمية.
