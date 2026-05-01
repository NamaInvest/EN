---
description: التحقق من صحة المنطق المحاسبي لقيد أو دالة auto-journal
argument-hint: [path/to/code or description of JE]
---

# التحقق من المنطق المحاسبي: $ARGUMENTS

## الخطوات:

### 1. اقرأ الكود
إذا `$ARGUMENTS` مسار ملف:
- اقرأ الملف بالكامل
- ركز على الدوال التي تنشئ JournalEntry / JournalLine

إذا `$ARGUMENTS` وصف معاملة:
- ارسم القيد المتوقع

### 2. استدع وكيل `accounting-validator`
أرسل له:
- الكود/الوصف
- اطلب التحقق من:
  - ✓ توازن القيد (DR = CR)
  - ✓ صحة الحسابات المستخدمة
  - ✓ معاملة VAT
  - ✓ Multi-currency
  - ✓ Cost centers/dimensions
  - ✓ Reversal logic
  - ✓ Period validity
  - ✓ Control accounts protection

### 3. استدع وكيل `saudi-compliance`
للتحقق من:
- ZATCA fields (إذا فاتورة)
- WHT (إذا مورد أجنبي)
- VAT rate (15%)
- Zakat implications

### 4. قدم التقرير

```markdown
# تقرير التحقق المحاسبي

## ملخص
[3 جمل عن صحة المنطق]

## التفاصيل
- ✓ توازن القيد: [نعم/لا]
- ✓ الحسابات: [قائمة]
- ✓ VAT: [الحالة]
- ✓ Saudi compliance: [الحالة]

## القيد المتوقع
```
DR: [Account] [Amount]
DR: [Account] [Amount]
    CR: [Account] [Amount]
    CR: [Account] [Amount]
```

## المخالفات (إن وجدت)
[قائمة بالمشاكل + الحلول]

## التوصيات
[تحسينات مقترحة]
```
