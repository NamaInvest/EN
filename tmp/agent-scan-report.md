# Phase 1.5.2A — Purchase GRNI Accounting Model Audit
**Date:** 2026-05-15
**Focus:** Purchase Invoice, GRN, and GL Synchronization.

## 📊 1. القيد الحالي عند إنشاء فاتورة مشتريات (`postPurchaseInvoice`)
يُبنى القيد بناءً على شرط `hasGRN`:
* **إذا كانت الفاتورة Pending (`hasGRN=false`):** 
  من حـ/ المخزون (`INVENTORY`)
  من حـ/ القيمة المضافة (`VAT`)
  إلى حـ/ الموردين (`AP`)
* **إذا كانت الفاتورة Received (`hasGRN=true`):** 
  من حـ/ استحقاق فواتير غير مستلمة (`GRNI`)
  من حـ/ القيمة المضافة (`VAT`)
  إلى حـ/ الموردين (`AP`)

## 📦 2. القيد الحالي عند استلام البضاعة `postGRN`
  من حـ/ المخزون (`INVENTORY`)
  إلى حـ/ استحقاق الاستلام (`GRNI`)

## ⚖️ 3. الفرق بين الفاتورة Pending و Received
* **Pending:** لا يتم تحديث المخزون الفيزيائي. يتم رفع المخزون الدفتري في الـ GL مباشرة.
* **Received:** يتم تحديث المخزون الفيزيائي فوراً. القيد المالي للفاتورة يذهب إلى حساب وسيط (`GRNI`)، لكن المصيبة أنه لا يتم إنشاء قيد الاستلام (`postGRN`)!

## 🔄 4. دور دالة `postGRN`
دالة `postGRN` تنشئ رصيداً دفترياً جديداً في حساب المخزون (`Dr INVENTORY`) وتقابله كالتزام مؤقت في حساب (`Cr GRNI`). فهي لا تعكس الـ GRNI للصفر، بل تمثل الجانب الفيزيائي (الاستلام) الذي يجب أن تصفيه الفاتورة المالية لاحقاً.

## 💥 5. أين يحدث خطر Double Journal والتضخم المحاسبي؟
**السيناريو الأول (Double Journal):**
إذا أنشأنا فاتورة `pending`:
1. الفاتورة تسجل (Dr INVENTORY / Cr AP).
2. لاحقاً عند استلام البضاعة عبر مسار الـ `receive`، إذا أضفنا `postGRN`: سيسجل (Dr INVENTORY / Cr GRNI).
3. **النتيجة:** تضخم حساب المخزون مرتين للعملية نفسها! وحساب GRNI وحساب AP متضخمان دائنان.

**السيناريو الثاني (Ghost Balances):**
إذا أنشأنا فاتورة `received`:
1. يتم رفع المخزون المادي.
2. الفاتورة تسجل (Dr GRNI / Cr AP). ولا يتم استدعاء `postGRN` إطلاقاً.
3. **النتيجة:** حساب المخزون المالي (`INVENTORY`) فارغ، وحساب الـ `GRNI` مدين إلى الأبد دون تصفية!

## 🏗️ 6. النموذج المحاسبي الصحيح المقترح (3-Way Matching)
للتخلص من جميع المخاطر وتوحيد النظام المعماري:
* **فاتورة المشتريات (`postPurchaseInvoice`) دائماً تضرب الـ GRNI:**
  Dr GRNI
  Dr VAT
  Cr AP
* **أي استلام لبضاعة (`postGRN` سواء فوري أو لاحق) دائماً يضرب المخزون ويصفر الـ GRNI:**
  Dr INVENTORY
  Cr GRNI

*بهذا الشكل:* 
- إذا فاتورة + استلام معاً = `Dr GRNI / Cr AP` ثم `Dr INVENTORY / Cr GRNI`. المحصلة: حساب `GRNI` يصبح صفر، و`INVENTORY` ارتفع بشكل سليم.
- إذا فاتورة ثم استلام = الفاتورة ترفع التزام المورد وتفتح `GRNI` مدين. لاحقاً الاستلام يرفع المخزون ويغلق `GRNI`.

## 🛠️ 7. أقل تعديل آمن (Minimal Safe Implementation)
1. **في `auto-journal.ts` (`postPurchaseInvoice`):** إزالة تأثير الـ `hasGRN`، وجعل الفاتورة **دائماً** تسجل الجانب المدين على حساب `GRNI`.
2. **في `POST /api/purchases/route.ts`:** إذا كانت الفاتورة `received` فوراً، يتم استدعاء `postGRN` مباشرة كجزء من المعاملة لإغلاق الـ `GRNI` المفتوح.
3. **في `PUT /api/purchases/[id]/receive/route.ts`:** يتم لف الاستلام الفيزيائي بـ `transaction` واستدعاء `postGRN` لعمل الإغلاق وتحديث المخزون بشكل آمن (Phase 1.5.2).

## 📁 8. الملفات المتأثرة
* **المطلوب تعديله:**
  * `src/lib/auto-journal.ts` (تبسيط `postPurchaseInvoice`)
  * `src/app/api/purchases/route.ts` (إضافة `postGRN` عند الاستلام الفوري)
  * `src/app/api/purchases/[id]/receive/route.ts` (إضافة `prisma.$transaction` و `postGRN`)
* **الملفات التي يجب عدم لمسها:**
  * `src/app/api/grn/route.ts` (تم إصلاحها ومستقرة)
  * كل ما يتعلق بالمبيعات أو المرتجعات.
