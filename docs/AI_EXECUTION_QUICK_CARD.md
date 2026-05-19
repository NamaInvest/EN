# Namasoft AI Execution — Quick Reference Card

> النسخة المختصرة. للنسخة الكاملة: `docs/AI_EXECUTION_STANDARD.md`

## بدء جلسة جديدة
```
TARGET = <module/page>
```

## 4 بوابات (Gates) — جميعها إلزامية
| Gate | الغرض | عند الفشل |
|--:|---|---|
| 1 | Architecture Verification (API checks) | أوقف الـ UI، أصلح الـ API |
| 2 | Enterprise UX (15 ميزة لكل صفحة) | كمّل الميزات الناقصة |
| 3 | Observability hooks (trace كل mutation) | أضف traces |
| 4 | Definition of Done (15 بنداً) | لا تعتبر "خلصت" |

## القواعد الذهبية
- ✅ withRoute + requireTenantId + RBAC في كل route
- ✅ auto-journal.ts للمال · n() للـ Decimal · transactions للتغييرات المالية
- ✅ كل نص → i18n key في ar.json + en.json
- ✅ Vertical Completion: صفحة كاملة قبل التالية (max 5 ملفات/جلسة)
- ❌ no `any`, no Prisma in client, no Float for money
- ❌ no edit POSTED JE, no edit ZATCA-cleared invoice

## الترتيب الاستراتيجي
**Phase A** Compliance → **B** Financial → **C** Saudi Gov → **D** Operational → **E** Sector

## نمط الجلسة
1. اقرأ TARGET
2. Gate 1 (architecture check)
3. خطة 7 خطوات + موافقة
4. تنفيذ ملف-بملف
5. DoD checklist ✅/❌
