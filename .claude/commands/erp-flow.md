---
description: عرض فلو معين من BUSINESS_FLOWS_GUIDE
argument-hint: [flow name like "Quote-to-Cash" or "Period Close" or "Three-Way Match"]
---

# عرض الفلو: $ARGUMENTS

## الخطوات:

### 1. ابحث عن الفلو
افتح `BUSINESS_FLOWS_GUIDE.md` وابحث عن `$ARGUMENTS` ضمن الـ 18 فلو الموجودة:

1. Quote-to-Cash
2. Procure-to-Pay
3. Hire-to-Retire
4. Record-to-Report
5. Plan-to-Produce
6. Acquire-to-Retire (Assets)
7. POS Flow
8. JE Approval
9. Period Close
10. ZATCA E-Invoice
11. WPS Salary
12. Invoice State Machine
13. Manufacturing Order States
14. Bank Reconciliation
15. Customer Onboarding
16. Approval Routing
17. Three-Way Match
18. Architecture Flow

### 2. اعرض الفلو
- اعرض الـ Mermaid diagram
- اشرح كل خطوة باللغة العربية
- اذكر:
  - الـ trigger (متى يبدأ)
  - الـ actors (من يشارك)
  - الـ documents المنتجة
  - الـ JE المتولدة
  - الـ states المختلفة
  - الـ exits/errors

### 3. اربط بالكود الموجود
- ابحث في `src/app/api/` عن الملفات المتعلقة
- ابحث في `src/lib/` عن business logic
- اربط كل خطوة من الفلو بالكود

### 4. حدد الفجوات
- ما الخطوات المطبقة فعلاً؟
- ما الخطوات الناقصة؟
- ما الخطوات الجزئية؟

### 5. اقترح الخطوة التالية
إذا وجدت فجوة، اقترح:
```
استخدم /erp-build-feature [feature-name] لتطبيق الجزء الناقص.
```
