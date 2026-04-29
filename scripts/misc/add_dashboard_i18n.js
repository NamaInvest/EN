const fs = require('fs');

const missingI18n = {
    'en': {
        'dashboard.title': '📊 Dashboard',
        'dashboard.refresh': 'Refresh',
        'dashboard.refreshing': 'Refreshing...',
        'dashboard.today_sales': 'Today Sales',
        'dashboard.today_purchases': 'Today Purchases',
        'dashboard.today_profit': 'Today Profit',
        'dashboard.today_expenses': 'Today Expenses',
        'dashboard.total_products': 'Total Products',
        'dashboard.low_stock': 'Low Stock',
        'dashboard.treasury_balance': 'Treasury Balance',
        'dashboard.total_customers': 'Total Customers',
        'dashboard.sales_chart': 'Sales Chart',
        'dashboard.top_selling': 'Top Selling',
        'dashboard.no_data': 'No Data',
        'dashboard.sold': 'Sold',
        'dashboard.recent_invoices': 'Recent Invoices',
        'common.sar': 'SAR',
        'payment.cash': 'Cash',
        'payment.card': 'Card',
        'payment.transfer': 'Transfer',
        'payment.credit': 'Credit',
        'payment.installment': 'Installment'
    },
    'hi': {
        'dashboard.title': '📊 डैशबोर्ड',
        'dashboard.refresh': 'रीफ्रेश',
        'dashboard.refreshing': 'रीफ्रेश हो रहा है...',
        'dashboard.today_sales': 'आज की बिक्री',
        'dashboard.today_purchases': 'आज की खरीद',
        'dashboard.today_profit': 'आज का लाभ',
        'dashboard.today_expenses': 'आज का खर्च',
        'dashboard.total_products': 'कुल उत्पाद',
        'dashboard.low_stock': 'कम स्टॉक',
        'dashboard.treasury_balance': 'ट्रेजरी बैलेंस',
        'dashboard.total_customers': 'कुल ग्राहक',
        'dashboard.sales_chart': 'बिक्री चार्ट',
        'dashboard.top_selling': 'शीर्ष बिक्री',
        'dashboard.no_data': 'कोई डेटा नहीं',
        'dashboard.sold': 'बिक गया',
        'dashboard.recent_invoices': 'हाल के चालान',
        'common.sar': 'सार (SAR)',
        'payment.cash': 'नकद',
        'payment.card': 'कार्ड',
        'payment.transfer': 'स्थानांतरण',
        'payment.credit': 'उधार',
        'payment.installment': 'किस्त'
    },
    'bn': {
        'dashboard.title': '📊 ড্যাশবোর্ড',
        'dashboard.refresh': 'রিফ্রেশ',
        'dashboard.refreshing': 'রিফ্রেশ হচ্ছে...',
        'dashboard.today_sales': 'আজকের বিক্রি',
        'dashboard.today_purchases': 'আজকের ক্রয়',
        'dashboard.today_profit': 'আজকের লাভ',
        'dashboard.today_expenses': 'আজকের খরচ',
        'dashboard.total_products': 'মোট পণ্য',
        'dashboard.low_stock': 'কম স্টক',
        'dashboard.treasury_balance': 'ট্রেজারি ব্যালেন্স',
        'dashboard.total_customers': 'মোট গ্রাহক',
        'dashboard.sales_chart': 'বিক্রয় চার্ট',
        'dashboard.top_selling': 'শীর্ষ বিক্রি',
        'dashboard.no_data': 'কোনো তথ্য নেই',
        'dashboard.sold': 'বিক্রি হয়েছে',
        'dashboard.recent_invoices': 'সাম্প্রতিক চালান',
        'common.sar': 'সার (SAR)',
        'payment.cash': 'নগদ',
        'payment.card': 'কার্ড',
        'payment.transfer': 'ট্রান্সফার',
        'payment.credit': 'বাকি',
        'payment.installment': 'কিস্তি'
    },
    'ur': {
        'dashboard.title': '📊 ڈیش بورڈ',
        'dashboard.refresh': 'ریفریش',
        'dashboard.refreshing': 'ریفریش ہو رہا ہے...',
        'dashboard.today_sales': 'آج کی سیلز',
        'dashboard.today_purchases': 'آج کی خریداری',
        'dashboard.today_profit': 'آج کا منافع',
        'dashboard.today_expenses': 'آج کے اخراجات',
        'dashboard.total_products': 'کل پروڈکٹس',
        'dashboard.low_stock': 'کم اسٹاک',
        'dashboard.treasury_balance': 'ٹریژری بیلنس',
        'dashboard.total_customers': 'کل کسٹمرز',
        'dashboard.sales_chart': 'سیلز چارٹ',
        'dashboard.top_selling': 'سب سے زیادہ فروخت',
        'dashboard.no_data': 'کوئی ڈیٹا نہیں',
        'dashboard.sold': 'فروخت شدہ',
        'dashboard.recent_invoices': 'حالیہ انوائسز',
        'common.sar': 'سار (SAR)',
        'payment.cash': 'نقد',
        'payment.card': 'کارڈ',
        'payment.transfer': 'ٹرانسفر',
        'payment.credit': 'ادھار',
        'payment.installment': 'قسط'
    }
};

let i18n = fs.readFileSync('src/lib/i18n.tsx', 'utf8');

for (const lang of Object.keys(missingI18n)) {
    const langKey = `    ${lang}: {`;
    const startIndex = i18n.indexOf(langKey);
    if (startIndex !== -1) {
        const nextLineIndex = i18n.indexOf('\n', startIndex) + 1;
        let keysToAdd = '';
        const searchSlice = i18n.slice(startIndex, i18n.indexOf('}', startIndex));
        for (const [k, v] of Object.entries(missingI18n[lang])) {
            if (!searchSlice.includes(`'${k}'`) && !searchSlice.includes(`"${k}"`)) {
                keysToAdd += `        '${k}': '${v.replace(/'/g, "\\'")}',\n`;
            }
        }
        i18n = i18n.slice(0, nextLineIndex) + keysToAdd + i18n.slice(nextLineIndex);
    }
}

fs.writeFileSync('src/lib/i18n.tsx', i18n, 'utf8');
console.log('Dashboard translations injected successfully.');
