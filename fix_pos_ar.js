const fs = require('fs');

const posPath = 'src/app/pos/page.tsx';
const resPath = 'src/app/restaurant-pos/page.tsx';

let posCode = fs.readFileSync(posPath, 'utf8');
let resCode = fs.readFileSync(resPath, 'utf8');

const keysToAdd = {
  ar: {
    'pos.all': 'الكل',
    'pos.coupon_success': 'تم تطبيق الكوبون بنجاح بخصم',
    'pos.linked_customer': 'العميل المربوط: ',
    'resto.company_name': 'نمـا إنفست للأنظمـة',
    'resto.invoice_title': 'طلب نقاط البيع - مطاعم',
    'resto.invoice_no': 'رقم الإيصال: ',
    'resto.date': 'التاريخ: ',
    'resto.item': 'الصنف',
    'resto.qty': 'الكمية',
    'resto.value': 'القيمة',
    'resto.total': 'الإجمالي:',
    'resto.discount': 'الخصم:',
    'resto.tax': 'ضريبة (15%):',
    'resto.net': 'الصافي (SAR):',
    'resto.thanks': 'شكراً لزيارتكم!',
    'resto.customer_linked': 'العميل: ',
    'resto.input': 'المدخل: ',
  },
  en: {
    'pos.all': 'All',
    'pos.coupon_success': 'Coupon applied successfully with discount',
    'pos.linked_customer': 'Linked Customer: ',
    'resto.company_name': 'Nama Invest Systems',
    'resto.invoice_title': 'Restaurant POS Order',
    'resto.invoice_no': 'Receipt No: ',
    'resto.date': 'Date: ',
    'resto.item': 'Item',
    'resto.qty': 'Qty',
    'resto.value': 'Value',
    'resto.total': 'Total:',
    'resto.discount': 'Discount:',
    'resto.tax': 'Tax (15%):',
    'resto.net': 'Net (SAR):',
    'resto.thanks': 'Thank you for your visit!',
    'resto.customer_linked': 'Customer: ',
    'resto.input': 'Input: ',
  },
  hi: {
    'pos.all': 'सभी',
    'pos.coupon_success': 'कूपन सफलतापूर्वक लागू हुआ कूपन छूट के साथ',
    'pos.linked_customer': 'जुड़ा हुआ ग्राहक: ',
    'resto.company_name': 'नामा इन्वेस्ट सिस्टम्स',
    'resto.invoice_title': 'रेस्टोरेंट पीओएस ऑर्डर',
    'resto.invoice_no': 'रसीद संख्या: ',
    'resto.date': 'तारीख: ',
    'resto.item': 'आइटम',
    'resto.qty': 'मात्रा',
    'resto.value': 'मूल्य',
    'resto.total': 'कुल:',
    'resto.discount': 'छूट:',
    'resto.tax': 'कर (15%):',
    'resto.net': 'शुद्ध (SAR):',
    'resto.thanks': 'आपकी यात्रा के लिए धन्यवाद!',
    'resto.customer_linked': 'ग्राहक: ',
    'resto.input': 'इनपुट: ',
  },
  bn: {
    'pos.all': 'সব',
    'pos.coupon_success': 'কুপন সফলভাবে ছাড়ের সাথে প্রয়োগ করা হয়েছে',
    'pos.linked_customer': 'সংযুক্ত গ্রাহক: ',
    'resto.company_name': 'নামা ইনভেস্ট সিস্টেমস',
    'resto.invoice_title': 'রেস্টুরেন্ট পিওএস অর্ডার',
    'resto.invoice_no': 'রসিদ নং: ',
    'resto.date': 'তারিখ: ',
    'resto.item': 'আইটেম',
    'resto.qty': 'পরিমাণ',
    'resto.value': 'মান',
    'resto.total': 'মোট:',
    'resto.discount': 'ছাড়:',
    'resto.tax': 'কর (১৫%):',
    'resto.net': 'নেট (SAR):',
    'resto.thanks': 'আপনার দর্শনের জন্য ধন্যবাদ!',
    'resto.customer_linked': 'গ্রাহক: ',
    'resto.input': 'ইনপুট: ',
  },
  ur: {
    'pos.all': 'سب',
    'pos.coupon_success': 'کوپن کامیابی کے ساتھ لاگو کیا گیا',
    'pos.linked_customer': 'منسلک کسٹمر: ',
    'resto.company_name': 'نما انویسٹ سسٹمز',
    'resto.invoice_title': 'ریستوراں POS آرڈر',
    'resto.invoice_no': 'رسید نمبر: ',
    'resto.date': 'تاریخ: ',
    'resto.item': 'آئٹم',
    'resto.qty': 'مقدار',
    'resto.value': 'قیمت',
    'resto.total': 'کل:',
    'resto.discount': 'رعایت:',
    'resto.tax': 'ٹیکس (15%):',
    'resto.net': 'خالص (SAR):',
    'resto.thanks': 'آپ کی آمد کا شکریہ!',
    'resto.customer_linked': 'کسٹمر: ',
    'resto.input': 'ان پٹ: ',
  }
};

// POS Replacements
posCode = posCode.replace(/'الكل'/g, "t('pos.all')");
posCode = posCode.replace(/تم تطبيق الكوبون بنجاح بخصم/g, "${t('pos.coupon_success')} ");
posCode = posCode.replace(/العميل المربوط: /g, "${t('pos.linked_customer')}");

// Restaurant POS Replacements
resCode = resCode.replace(/'الكل'/g, "t('pos.all')");
resCode = resCode.replace(/نمـا إنفست للأنظمـة/g, "${t('resto.company_name')}");
resCode = resCode.replace(/طلب نقاط البيع - مطاعم/g, "${t('resto.invoice_title')}");
resCode = resCode.replace(/رقم الإيصال: /g, "${t('resto.invoice_no')}");
resCode = resCode.replace(/التاريخ: /g, "${t('resto.date')}");
resCode = resCode.replace(/>الصنف</g, ">{t('resto.item')}<");
resCode = resCode.replace(/>الكمية</g, ">{t('resto.qty')}<");
resCode = resCode.replace(/>القيمة</g, ">{t('resto.value')}<");
resCode = resCode.replace(/>الإجمالي:</g, ">{t('resto.total')}<");
resCode = resCode.replace(/>الخصم:</g, ">{t('resto.discount')}<");
resCode = resCode.replace(/>ضريبة \(15%\):</g, ">{t('resto.tax')}<");
resCode = resCode.replace(/>الصافي \(SAR\):</g, ">{t('resto.net')}<");
resCode = resCode.replace(/شكراً لزيارتكم!/g, "${t('resto.thanks')}");
resCode = resCode.replace(/العميل: /g, "${t('resto.customer_linked')}");
resCode = resCode.replace(/المدخل: /g, "${t('resto.input')}");
resCode = resCode.replace(/تم تطبيق الكوبون بنجاح بخصم/g, "${t('pos.coupon_success')} ");

fs.writeFileSync(posPath, posCode);
fs.writeFileSync(resPath, resCode);

// Inject keys to translations.ts
let transCode = fs.readFileSync('src/lib/translations.ts', 'utf8');

function inject(langTag, dict, codeStr) { 
  const target1 = `"${langTag}": {`;
  const target2 = `  ${langTag}: {`;
  let idx = codeStr.indexOf(target1);
  if (idx !== -1) {
      idx += target1.length;
  } else {
      idx = codeStr.indexOf(target2);
      if (idx !== -1) idx += target2.length;
  }
  if (idx === -1) {
    console.log("Could not find", langTag);
    return codeStr;
  }
  let strToInsert = "\n";
  for(const k in dict) {
     strToInsert += `    "${k}": ${JSON.stringify(dict[k])},\n`;
  }
  return codeStr.slice(0, idx) + strToInsert + codeStr.slice(idx);
}

for (const lang of Object.keys(keysToAdd)) {
    transCode = inject(lang, keysToAdd[lang], transCode);
}

fs.writeFileSync('src/lib/translations.ts', transCode);
console.log('Successfully replaced hardcoded strings and injected new pos/resto keys.');
