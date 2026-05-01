---
description: التحقق من الامتثال السعودي لميزة معينة
argument-hint: [feature description or code path]
---

# التحقق السعودي: $ARGUMENTS

## الخطوات:

### 1. حدد نطاق الفحص
بناءً على `$ARGUMENTS`، حدد أي أنظمة تنطبق:
- ZATCA (الفواتير)
- GOSI (الموظفين)
- WPS (الرواتب)
- Mudad/Qiwa (العقود/التوظيف)
- نظام العمل (الإجازات، EOS، ساعات)
- PDPL (البيانات الشخصية)
- VAT/Zakat (الضرائب)
- SAMA (المدفوعات)

### 2. استدع وكيل `saudi-compliance`
أرسل له تفاصيل الميزة + اطلب فحص الامتثال لكل نظام منطبق.

### 3. افحص الكود (إن وجد)
- ابحث عن الحقول المطلوبة (CR, VAT number, IBAN, Iqama)
- تأكد من معالجة Saudi vs Non-Saudi differently
- تحقق من Arabic support
- تحقق من Hijri calendar (إن لزم)

### 4. قدم التقرير

```markdown
# تقرير الامتثال السعودي

## الميزة: $ARGUMENTS

## الأنظمة المنطبقة
- [ ] ZATCA
- [ ] GOSI
- [ ] WPS
- [ ] نظام العمل
- [ ] PDPL
- [ ] VAT
- [ ] Zakat

## نتائج الفحص

### ZATCA (إن انطبق)
- VAT Rate: ✓/✗
- QR Code: ✓/✗
- XML signing (Phase 2): ✓/✗
- ICV/PIH: ✓/✗
- Sandbox/Production switch: ✓/✗

### GOSI (إن انطبق)
- Saudi rate (9%+9%+1%): ✓/✗
- Non-Saudi rate (2%): ✓/✗
- Salary base (basic + housing): ✓/✗

### نظام العمل (إن انطبق)
- EOS calculation: ✓/✗
- Annual leave (21/30): ✓/✗
- Maternity (10 weeks): ✓/✗
- Probation period: ✓/✗
- Working hours: ✓/✗

### PDPL (إن انطبق)
- User consent: ✓/✗
- Data encryption: ✓/✗
- Right to erasure: ✓/✗
- Audit logging: ✓/✗
- Breach notification: ✓/✗

## المخالفات
[قائمة بالمخالفات إن وجدت]

## الإصلاحات المطلوبة
[خطوات محددة]

## المراجع
[الإشارة للمواد القانونية والمصادر]
```
