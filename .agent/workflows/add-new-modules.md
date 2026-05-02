---
description: "إضافة روابط الوحدات الجديدة (WPS, GOSI, البنوك، وغيرها) إلى الشريط الجانبي وملفات الترجمة"
---

# Workflow: إضافة وتفعيل الوحدات المحاسبية والرواتب في الواجهة

هذا الـ Workflow مخصص لإضافة الشاشات الجديدة التي تم إنشاؤها مؤخراً (WPS، GOSI، مذكرات التسوية، محرك الائتمان) إلى القائمة الجانبية للنظام (`Sidebar.tsx`) وضمان توافر ترجماتها باللغة العربية والإنجليزية.

## الخطوة 1: تحديث ملف `Sidebar.tsx` لإضافة الروابط
يجب إضافة الروابط التالية داخل مجموعة `s.new_modules` أو المجموعات المناسبة في ملف `src/components/Sidebar.tsx`:

```javascript
    // أمثلة على الروابط التي يجب إضافتها:
    { icon: '🏦', lk: 'i.wps', href: '/hr/wps', module: 'salaries' },
    { icon: '🏛️', lk: 'i.gosi', href: '/hr/gosi', module: 'salaries' },
    { icon: '🔄', lk: 'i.bank_recon_auto', href: '/treasury/bank-reconciliation', module: 'treasury' },
    { icon: '💰', lk: 'i.dunning', href: '/finance/dunning', module: 'accounting' },
    { icon: '✅', lk: 'i.three_way', href: '/procurement/three-way-match', module: 'purchases' },
    { icon: '⚙️', lk: 'i.bpm', href: '/settings/bpm', module: 'approvals' },
```

## الخطوة 2: تحديث قواميس الترجمة `LABELS`
يجب البحث عن الكائن `LABELS` داخل نفس الملف (`Sidebar.tsx`) وإضافة المفاتيح الجديدة للغتين:

**للغة العربية (`ar`):**
```javascript
    'i.wps': 'نظام حماية الأجور (WPS)',
    'i.gosi': 'التأمينات الاجتماعية GOSI',
    'i.bank_recon_auto': 'المطابقة البنكية الآلية',
    'i.dunning': 'محرك متابعة المديونيات',
    'i.three_way': 'المطابقة الثلاثية للمشتريات',
    'i.bpm': 'محرك سير العمل (BPM)',
```

**للغة الإنجليزية (`en`):**
```javascript
    'i.wps': 'Wage Protection System (WPS)',
    'i.gosi': 'GOSI Social Insurance',
    'i.bank_recon_auto': 'Auto Bank Reconciliation',
    'i.dunning': 'Dunning & Collections',
    'i.three_way': '3-Way Matching',
    'i.bpm': 'BPM Engine',
```

## الخطوة 3: التحقق من عدم وجود تكرار في الروابط (`href`)
بعد الإضافة، تأكد من عدم وجود أي عنصرين في نفس القائمة (نفس الـ `group.items`) يمتلكان نفس رابط الـ `href`، لأن هذا يسبب خطأ `duplicate key` ويؤدي إلى تجمد أزرار الواجهة ورجوعها للغة الافتراضية.

## الخطوة 4: إعادة تحميل النظام
قم بالذهاب إلى المتصفح واضغط `Ctrl + F5` أو قم بحذف الكاش لتتأكد من قراءة اللغة بشكل سليم وتفعيل الأزرار الجديدة.
