const fs = require('fs');

const i18nPath = 'd:\\namasoft9-3-main\\src\\lib\\i18n.tsx';
let i18n = fs.readFileSync(i18nPath, 'utf-8');

const arKeys = `
        'rest.title': 'نقطة البيع (مطاعم)',
        'rest.search': 'البحث بالاسم أو الباركود...',
        'rest.loading': 'جاري تحميل الطلبات...',
        'rest.empty': 'لا توجد أصناف',
        'rest.customer': 'تحديد العميل',
        'rest.unlink': 'إلغاء',
        'rest.coupon': 'رمز الكوبون',
        'rest.apply': 'تطبيق',
        'rest.hold_order': 'تعليق الفاتورة',
        'rest.cash_pay': 'دفع نقدي',
        'rest.mada_pay': 'دفع شبكة',
        'rest.ready': 'جاهز',
        'rest.cashier': 'الكاشير',
`;
const enKeys = `
        'rest.title': 'Restaurant POS',
        'rest.search': 'Search items...',
        'rest.loading': 'Loading menu...',
        'rest.empty': 'No items found',
        'rest.customer': 'Select Customer',
        'rest.unlink': 'Unlink',
        'rest.coupon': 'Coupon Code',
        'rest.apply': 'Apply',
        'rest.hold_order': 'Hold Order',
        'rest.cash_pay': 'Cash Pay',
        'rest.mada_pay': 'Card Pay',
        'rest.ready': 'Ready',
        'rest.cashier': 'Cashier',
`;

const hiKeys = `
        'rest.title': 'रेस्टोरेंट पीओएस',
        'rest.search': 'खोजें...',
        'rest.loading': 'लोड हो रहा है...',
        'rest.empty': 'कोई आइटम नहीं मिला',
        'rest.customer': 'ग्राहक चुनें',
        'rest.unlink': 'अनलिंक',
        'rest.coupon': 'कूपन कोड',
        'rest.apply': 'लागू करें',
        'rest.hold_order': 'ऑर्डर होल्ड करें',
        'rest.cash_pay': 'नकद भुगतान',
        'rest.mada_pay': 'कार्ड भुगतान',
        'rest.ready': 'तैयार',
        'rest.cashier': 'कैशियर',
`;

const bnKeys = `
        'rest.title': 'রেস্টুরেন্ট পিওএস',
        'rest.search': 'খুঁজুন...',
        'rest.loading': 'লোড হচ্ছে...',
        'rest.empty': 'কোনো আইটেম পাওয়া যায়নি',
        'rest.customer': 'গ্রাহক নির্বাচন করুন',
        'rest.unlink': 'আনলিংক',
        'rest.coupon': 'কুপন কোড',
        'rest.apply': 'প্রয়োগ করুন',
        'rest.hold_order': 'অর্ডার হোল্ড করুন',
        'rest.cash_pay': 'নগদ পেমেন্ট',
        'rest.mada_pay': 'কার্ড পেমেন্ট',
        'rest.ready': 'প্রস্তুত',
        'rest.cashier': 'ক্যাশিয়ার',
`;

const urKeys = `
        'rest.title': 'ریستوران کا POS',
        'rest.search': 'تلاش کریں...',
        'rest.loading': 'مینو لوڈ ہو رہا ہے...',
        'rest.empty': 'کوئی آئٹم نہیں ملا',
        'rest.customer': 'صارف منتخب کریں',
        'rest.unlink': 'ان لنک کریں',
        'rest.coupon': 'کوپن کوڈ',
        'rest.apply': 'لاگو کریں',
        'rest.hold_order': 'آرڈر ہولڈ کریں',
        'rest.cash_pay': 'نقد ادائیگی',
        'rest.mada_pay': 'کارڈ ادائیگی',
        'rest.ready': 'تیار',
        'rest.cashier': 'کیشیئر',
`;

// Insert keys into i18n
i18n = i18n.replace("'dashboard.title': '📊 لوحة التحكم',", arKeys + "        'dashboard.title': '📊 لوحة التحكم',");
i18n = i18n.replace("'dashboard.title': '📊 Dashboard',", enKeys + "        'dashboard.title': '📊 Dashboard',");
i18n = i18n.replace("'dashboard.title': '📊 डैशबोर्ड',", hiKeys + "        'dashboard.title': '📊 डैशबोर्ड',");
i18n = i18n.replace("'dashboard.title': '📊 ড্যাশবোর্ড',", bnKeys + "        'dashboard.title': '📊 ড্যাশবোর্ড',");
i18n = i18n.replace("'dashboard.title': '📊 ڈیش بورڈ',", urKeys + "        'dashboard.title': '📊 ڈیش بورڈ',");
fs.writeFileSync(i18nPath, i18n);

// Process Restaurant POS Phase 1 Fixes
const posPath = 'd:\\namasoft9-3-main\\src\\app\\restaurant-pos\\page.tsx';
let pos = fs.readFileSync(posPath, 'utf-8');

if (!pos.includes('useTranslation')) {
    pos = pos.replace(
        "import { ShoppingCart, Search, User, CreditCard, Banknote, Save, ArrowRight, Trash2, Printer, Clock, History, CheckCircle2 } from 'lucide-react';",
        "import { ShoppingCart, Search, User, CreditCard, Banknote, Save, ArrowRight, Trash2, Printer, Clock, History, CheckCircle2 } from 'lucide-react';\nimport { useTranslation } from '@/lib/i18n';"
    );
    pos = pos.replace(
        "const isRTL = true;",
        "const { t, dir } = useTranslation();\n    const isRTL = dir === 'rtl';"
    );
    pos = pos.replace(
        /<div className="restaurant-pos" dir="rtl">/g,
        "<div className=\"restaurant-pos\" dir={dir}>"
    );

    // Swap Texts
    pos = pos.replace("نقطة البيع (مطاعم)", "{t('rest.title')}");
    pos = pos.replace("البحث بالاسم أو الباركود...", "{t('rest.search')}");
    pos = pos.replace("جاري تحميل قائمة الطعام...", "{t('rest.loading')}");
    pos = pos.replace("لا توجد أصناف", "{t('rest.empty')}");
    pos = pos.replace("تحديد العميل (ولاء)", "{t('rest.customer')}");
    pos = pos.replace("إلغاء ربط العميل", "{t('rest.unlink')}");
    pos = pos.replace("رمز الكوبون", "{t('rest.coupon')}");
    pos = pos.replace("الفواتير المعلقة", "{t('sidebar.installments')}");
    pos = pos.replace("رجوع", "{t('common.cancel')}");
    
    // Numpad text replacements (handle inline properly)
    pos = pos.replace(">دفع نقدي<", ">{t('rest.cash_pay')}<");
    pos = pos.replace(">دفع شبكة<", ">{t('rest.mada_pay')}<");
    pos = pos.replace(">تعليق الفاتورة<", ">{t('rest.hold_order')}<");
    pos = pos.replace("'جاهز للطلب'", "t('rest.ready')");
    pos = pos.replace("'الكاشير: admin'", "`${t('rest.cashier')}: admin`");
    pos = pos.replace(">الصنف<", ">{t('pos.item_name')}<");
    pos = pos.replace(">الكمية<", ">{t('pos.qty')}<");
    pos = pos.replace(">السعر<", ">{t('pos.price')}<");
    pos = pos.replace(">الإجمالي<", ">{t('common.total')}<");
    
    pos = pos.replace("'الكل'", "t('sidebar.main')");
    pos = pos.replace("id: 'الكل', name: 'الكل'", "id: 'الكل', name: t('sidebar.main')");
    pos = pos.replace(">المجموع:<", ">{t('common.subtotal')}:<");
    pos = pos.replace(/>الخصم:</g, ">{t('common.discount')}:<");
    pos = pos.replace(">الضريبة (15%):<", ">{t('common.tax')} (15%):<");
    pos = pos.replace(">الصافي<", ">{t('common.total')}<");
    
    fs.writeFileSync(posPath, pos);
    console.log("Restaurant POS localization injected successfully.");
} else {
    console.log("Restaurant POS already localized.");
}
