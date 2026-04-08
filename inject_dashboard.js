const fs = require('fs');

const missingKeys = {
  ar: {
    'dashboard.title': 'لوحة القيادة',
    'dashboard.refresh': 'تحديث',
    'common.sar': 'ر.س',
    'common.print': 'طباعة',
    'dashboard.today_sales': 'مبيعات اليوم',
    'dashboard.today_purchases': 'مشتريات اليوم',
    'dashboard.today_profit': 'أرباح اليوم',
    'dashboard.today_expenses': 'مصروفات اليوم',
    'dashboard.total_products': 'إجمالي المنتجات',
    'dashboard.low_stock': 'نواقص المخزون',
    'dashboard.treasury_balance': 'رصيد الخزينة',
    'dashboard.total_customers': 'إجمالي العملاء',
    'dashboard.top_selling': 'الأكثر مبيعاً',
    'dashboard.recent_invoices': 'أحدث المبيعات',
    'dashboard.no_data': 'لا توجد بيانات',
    'dashboard.refreshing': 'جاري التحديث...',
    'dashboard.sold': 'مباع',
    'dashboard.sales_chart': 'رسم بياني للمبيعات'
  },
  en: {
    'dashboard.title': 'Dashboard',
    'dashboard.refresh': 'Refresh',
    'common.sar': 'SAR',
    'common.print': 'Print',
    'dashboard.today_sales': 'Today Sales',
    'dashboard.today_purchases': 'Today Purchases',
    'dashboard.today_profit': 'Today Profit',
    'dashboard.today_expenses': 'Today Expenses',
    'dashboard.total_products': 'Total Products',
    'dashboard.low_stock': 'Low Stock',
    'dashboard.treasury_balance': 'Treasury Balance',
    'dashboard.total_customers': 'Total Customers',
    'dashboard.top_selling': 'Top Selling',
    'dashboard.recent_invoices': 'Recent Invoices',
    'dashboard.no_data': 'No Data',
    'dashboard.refreshing': 'Refreshing...',
    'dashboard.sold': 'Sold',
    'dashboard.sales_chart': 'Sales Chart'
  },
  hi: {
    'dashboard.title': 'डैशबोर्ड',
    'dashboard.refresh': 'रीफ्रेश',
    'common.sar': 'SAR',
    'common.print': 'प्रिंट करें',
    'dashboard.today_sales': 'आज की बिक्री',
    'dashboard.today_purchases': 'आज की खरीदारी',
    'dashboard.today_profit': 'आज का मुनाफा',
    'dashboard.today_expenses': 'आज का खर्च',
    'dashboard.total_products': 'कुल उत्पाद',
    'dashboard.low_stock': 'कम स्टॉक',
    'dashboard.treasury_balance': 'खजाना शेष',
    'dashboard.total_customers': 'कुल ग्राहक',
    'dashboard.top_selling': 'सबसे अधिक बिकने वाला',
    'dashboard.recent_invoices': 'हाल के चालान',
    'dashboard.no_data': 'कोई डेटा नहीं',
    'dashboard.refreshing': 'ताज़ा हो रहा है...',
    'dashboard.sold': 'बिका हुआ',
    'dashboard.sales_chart': 'बिक्री चार्ट'
  },
  bn: {
    'dashboard.title': 'ড্যাশবোর্ড',
    'dashboard.refresh': 'রিফ্রেশ',
    'common.sar': 'SAR',
    'common.print': 'মুদ্রণ',
    'dashboard.today_sales': 'আজকের বিক্রয়',
    'dashboard.today_purchases': 'আজকের ক্রয়',
    'dashboard.today_profit': 'আজকের লাভ',
    'dashboard.today_expenses': 'আজকের খরচ',
    'dashboard.total_products': 'মোট পণ্য',
    'dashboard.low_stock': 'কম স্টক',
    'dashboard.treasury_balance': 'কোষাগারের ভারসাম্য',
    'dashboard.total_customers': 'মোট গ্রাহক',
    'dashboard.top_selling': 'সবচেয়ে বেশি বিক্রি হওয়া',
    'dashboard.recent_invoices': 'সাম্প্রতিক চালান',
    'dashboard.no_data': 'কোনো তথ্য নেই',
    'dashboard.refreshing': 'রিফ্রেশ হচ্ছে...',
    'dashboard.sold': 'বিক্রি',
    'dashboard.sales_chart': 'বিক্রয় চার্ট'
  },
  ur: {
    'dashboard.title': 'ڈیش بورڈ',
    'dashboard.refresh': 'ریفریش کریں',
    'common.sar': 'SAR',
    'common.print': 'پرنٹ کریں',
    'dashboard.today_sales': 'آج کی فروخت',
    'dashboard.today_purchases': 'آج کی خریداری',
    'dashboard.today_profit': 'آج کا منافع',
    'dashboard.today_expenses': 'آج کے اخراجات',
    'dashboard.total_products': 'کل مصنوعات',
    'dashboard.low_stock': 'کم اسٹاک',
    'dashboard.treasury_balance': 'خزانہ کا بیلنس',
    'dashboard.total_customers': 'کل گاہک',
    'dashboard.top_selling': 'سب سے زیادہ فروخت ہونے والا',
    'dashboard.recent_invoices': 'حالیہ رسیدیں',
    'dashboard.no_data': 'کوئی ڈیٹا نہیں',
    'dashboard.refreshing': 'تازہ کیا جا رہا ہے...',
    'dashboard.sold': 'فروخت ہوا',
    'dashboard.sales_chart': 'سیلز چارٹ'
  }
};

let code = fs.readFileSync('src/lib/translations.ts', 'utf8');

function inject(langTag, dict, codeStr) { // Avoid variable shadowing
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

for (const lang of Object.keys(missingKeys)) {
    code = inject(lang, missingKeys[lang], code);
}

fs.writeFileSync('src/lib/translations.ts', code);
console.log('Successfully injected dashboard keys into translations.ts');
