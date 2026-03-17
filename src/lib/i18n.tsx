'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'ar' | 'en' | 'hi' | 'bn' | 'ur';

export interface LanguageInfo {
    code: Language;
    name: string;
    nativeName: string;
    dir: 'rtl' | 'ltr';
    flag: string;
}

export const languages: LanguageInfo[] = [
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇸🇦' },
    { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr', flag: '🇮🇳' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', dir: 'ltr', flag: '🇧🇩' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl', flag: '🇵🇰' },
];

// ============ TRANSLATIONS ============

const translations: Record<Language, Record<string, string>> = {
    ar: {
        // Sidebar sections
        'sidebar.main': 'الرئيسية',
        'sidebar.sales_purchases': 'المبيعات والمشتريات',
        'sidebar.inventory': 'المخزون',
        'sidebar.parties': 'الأطراف',
        'sidebar.finance': 'المالية',
        'sidebar.hr': 'الموارد البشرية',
        'sidebar.integrations': 'التكاملات',
        'sidebar.extras': 'إضافية',

        // Sidebar items
        'sidebar.dashboard': 'لوحة التحكم',
        'sidebar.sales': 'المبيعات',
        'sidebar.purchases': 'المشتريات',
        'sidebar.sales_returns': 'مرتجع مبيعات',
        'sidebar.purchase_returns': 'مرتجع مشتريات',
        'sidebar.bookings': 'فواتير الحجز',
        'sidebar.price_quotes': 'عرض سعر',
        'sidebar.products': 'المنتجات',
        'sidebar.stock': 'المخزون',
        'sidebar.stock_transfers': 'تحويل أصناف',
        'sidebar.barcode': 'إنشاء باركود',
        'sidebar.customers': 'العملاء والموردين',
        'sidebar.banks': 'البنوك',
        'sidebar.treasury': 'الخزينة',
        'sidebar.expenses': 'المصروفات',
        'sidebar.reports': 'التقارير',
        'sidebar.installments': 'الأقساط',
        'sidebar.employees': 'الموظفين',
        'sidebar.attendance': 'حضور وانصراف',
        'sidebar.salaries': 'الرواتب',
        'sidebar.vacations': 'الإجازات',
        'sidebar.whatsapp': 'واتساب API',
        'sidebar.salla': 'سلة API',
        'sidebar.coupons': 'الكوبونات',
        'sidebar.loyalty': 'برنامج الولاء',
        'sidebar.gift_cards': 'بطاقات الهدايا',
        'sidebar.batches': 'التشغيلات والصلاحية',
        'sidebar.audit_logs': 'سجل الحركات',
        'sidebar.maintenance': 'الصيانة',
        'sidebar.promotions': 'العروض والخصومات',
        'sidebar.purchase_orders': 'أوامر الشراء',
        'sidebar.stocktake': 'الجرد',
        'sidebar.accounting': 'المحاسبة',
        'sidebar.manufacturing': 'التصنيع',
        'sidebar.fixed_assets': 'الأصول الثابتة',
        'sidebar.shifts': 'الورديات',
        'sidebar.branches': 'الفروع',
        'sidebar.settings': 'الإعدادات',
        'sidebar.logout': 'تسجيل خروج',

        // Roles
        'role.admin': '👑 مدير',
        'role.cashier': '💰 كاشير',
        'role.accountant': '📊 محاسب',
        'role.data_entry': '📝 مدخل بيانات',

        // Dashboard
        'dashboard.title': '📊 لوحة التحكم',
        'dashboard.today_sales': 'مبيعات اليوم',
        'dashboard.today_purchases': 'مشتريات اليوم',
        'dashboard.today_profit': 'ربح اليوم',
        'dashboard.today_expenses': 'مصروفات اليوم',
        'dashboard.total_products': 'إجمالي المنتجات',
        'dashboard.low_stock': 'أصناف تحت الحد',
        'dashboard.treasury_balance': 'رصيد الخزينة',
        'dashboard.total_customers': 'إجمالي العملاء',
        'dashboard.sales_chart': '📈 المبيعات (آخر 7 أيام)',
        'dashboard.top_selling': '🏆 الأكثر مبيعاً',
        'dashboard.recent_invoices': '🧾 آخر الفواتير',
        'dashboard.no_data': 'لا توجد بيانات بعد',
        'dashboard.refresh': 'تحديث',
        'dashboard.refreshing': 'جاري التحديث...',
        'dashboard.sold': 'مبيع',

        // Payment types
        'payment.cash': '💵 نقداً',
        'payment.card': '💳 بطاقة',
        'payment.transfer': '🏦 تحويل',
        'payment.credit': '📝 آجل',
        'payment.installment': '💳 تقسيط',

        // Common
        'common.sar': 'ر.س',
        'common.language': 'اللغة',
    },

    en: {
        'sidebar.main': 'Main',
        'sidebar.sales_purchases': 'Sales & Purchases',
        'sidebar.inventory': 'Inventory',
        'sidebar.parties': 'Parties',
        'sidebar.finance': 'Finance',
        'sidebar.hr': 'Human Resources',
        'sidebar.integrations': 'Integrations',
        'sidebar.extras': 'Extras',

        'sidebar.dashboard': 'Dashboard',
        'sidebar.sales': 'Sales',
        'sidebar.purchases': 'Purchases',
        'sidebar.sales_returns': 'Sales Returns',
        'sidebar.purchase_returns': 'Purchase Returns',
        'sidebar.bookings': 'Bookings',
        'sidebar.price_quotes': 'Price Quotes',
        'sidebar.products': 'Products',
        'sidebar.stock': 'Stock',
        'sidebar.stock_transfers': 'Stock Transfers',
        'sidebar.barcode': 'Barcode Creator',
        'sidebar.customers': 'Customers & Suppliers',
        'sidebar.banks': 'Banks',
        'sidebar.treasury': 'Treasury',
        'sidebar.expenses': 'Expenses',
        'sidebar.reports': 'Reports',
        'sidebar.installments': 'Installments',
        'sidebar.employees': 'Employees',
        'sidebar.attendance': 'Attendance',
        'sidebar.salaries': 'Salaries',
        'sidebar.vacations': 'Vacations',
        'sidebar.whatsapp': 'WhatsApp API',
        'sidebar.salla': 'Salla API',
        'sidebar.coupons': 'Coupons',
        'sidebar.loyalty': 'Loyalty Program',
        'sidebar.gift_cards': 'Gift Cards',
        'sidebar.batches': 'Batches & Expiry',
        'sidebar.audit_logs': 'Audit Logs',
        'sidebar.maintenance': 'Maintenance',
        'sidebar.promotions': 'Promotions & Discounts',
        'sidebar.purchase_orders': 'Purchase Orders',
        'sidebar.stocktake': 'Stocktake',
        'sidebar.accounting': 'Accounting',
        'sidebar.manufacturing': 'Manufacturing',
        'sidebar.fixed_assets': 'Fixed Assets',
        'sidebar.shifts': 'Shifts',
        'sidebar.branches': 'Branches',
        'sidebar.settings': 'Settings',
        'sidebar.logout': 'Logout',

        'role.admin': '👑 Admin',
        'role.cashier': '💰 Cashier',
        'role.accountant': '📊 Accountant',
        'role.data_entry': '📝 Data Entry',

        'dashboard.title': '📊 Dashboard',
        'dashboard.today_sales': 'Today\'s Sales',
        'dashboard.today_purchases': 'Today\'s Purchases',
        'dashboard.today_profit': 'Today\'s Profit',
        'dashboard.today_expenses': 'Today\'s Expenses',
        'dashboard.total_products': 'Total Products',
        'dashboard.low_stock': 'Low Stock Items',
        'dashboard.treasury_balance': 'Treasury Balance',
        'dashboard.total_customers': 'Total Customers',
        'dashboard.sales_chart': '📈 Sales (Last 7 Days)',
        'dashboard.top_selling': '🏆 Top Selling',
        'dashboard.recent_invoices': '🧾 Recent Invoices',
        'dashboard.no_data': 'No data yet',
        'dashboard.refresh': 'Refresh',
        'dashboard.refreshing': 'Refreshing...',
        'dashboard.sold': 'sold',

        'payment.cash': '💵 Cash',
        'payment.card': '💳 Card',
        'payment.transfer': '🏦 Transfer',
        'payment.credit': '📝 Credit',
        'payment.installment': '💳 Installment',

        'common.sar': 'SAR',
        'common.language': 'Language',
    },

    hi: {
        'sidebar.main': 'मुख्य',
        'sidebar.sales_purchases': 'बिक्री और खरीद',
        'sidebar.inventory': 'इन्वेंटरी',
        'sidebar.parties': 'पार्टियां',
        'sidebar.finance': 'वित्त',
        'sidebar.hr': 'मानव संसाधन',
        'sidebar.integrations': 'एकीकरण',
        'sidebar.extras': 'अतिरिक्त',

        'sidebar.dashboard': 'डैशबोर्ड',
        'sidebar.sales': 'बिक्री',
        'sidebar.purchases': 'खरीद',
        'sidebar.sales_returns': 'बिक्री वापसी',
        'sidebar.purchase_returns': 'खरीद वापसी',
        'sidebar.bookings': 'बुकिंग',
        'sidebar.price_quotes': 'मूल्य कोटेशन',
        'sidebar.products': 'उत्पाद',
        'sidebar.stock': 'स्टॉक',
        'sidebar.stock_transfers': 'स्टॉक ट्रांसफर',
        'sidebar.barcode': 'बारकोड बनाएं',
        'sidebar.customers': 'ग्राहक और आपूर्तिकर्ता',
        'sidebar.banks': 'बैंक',
        'sidebar.treasury': 'खजाना',
        'sidebar.expenses': 'खर्च',
        'sidebar.reports': 'रिपोर्ट',
        'sidebar.installments': 'किस्तें',
        'sidebar.employees': 'कर्मचारी',
        'sidebar.attendance': 'उपस्थिति',
        'sidebar.salaries': 'वेतन',
        'sidebar.vacations': 'छुट्टियां',
        'sidebar.whatsapp': 'WhatsApp API',
        'sidebar.salla': 'Salla API',
        'sidebar.coupons': 'कूपन',
        'sidebar.loyalty': 'लॉयल्टी प्रोग्राम',
        'sidebar.gift_cards': 'गिफ्ट कार्ड',
        'sidebar.batches': 'बैच और समाप्ति',
        'sidebar.audit_logs': 'ऑडिट लॉग',
        'sidebar.maintenance': 'रखरखाव',
        'sidebar.promotions': 'ऑफर और छूट',
        'sidebar.purchase_orders': 'क्रय आदेश',
        'sidebar.stocktake': 'स्टॉकटेक',
        'sidebar.accounting': 'लेखांकन',
        'sidebar.manufacturing': 'मैन्युफैक्चरिंग',
        'sidebar.fixed_assets': 'अचल संपत्ति',
        'sidebar.shifts': 'शिफ्ट',
        'sidebar.branches': 'शाखाएँ',
        'sidebar.settings': 'सेटिंग्स',
        'sidebar.logout': 'लॉग आउट',

        'role.admin': '👑 प्रबंधक',
        'role.cashier': '💰 कैशियर',
        'role.accountant': '📊 लेखाकार',
        'role.data_entry': '📝 डेटा एंट्री',

        'dashboard.title': '📊 डैशबोर्ड',
        'dashboard.today_sales': 'आज की बिक्री',
        'dashboard.today_purchases': 'आज की खरीद',
        'dashboard.today_profit': 'आज का लाभ',
        'dashboard.today_expenses': 'आज के खर्च',
        'dashboard.total_products': 'कुल उत्पाद',
        'dashboard.low_stock': 'कम स्टॉक',
        'dashboard.treasury_balance': 'खजाना शेष',
        'dashboard.total_customers': 'कुल ग्राहक',
        'dashboard.sales_chart': '📈 बिक्री (पिछले 7 दिन)',
        'dashboard.top_selling': '🏆 सबसे ज़्यादा बिकने वाले',
        'dashboard.recent_invoices': '🧾 हालिया इनवॉइस',
        'dashboard.no_data': 'अभी तक कोई डेटा नहीं',
        'dashboard.refresh': 'रीफ्रेश',
        'dashboard.refreshing': 'रीफ्रेश हो रहा है...',
        'dashboard.sold': 'बिक्री',

        'payment.cash': '💵 नकद',
        'payment.card': '💳 कार्ड',
        'payment.transfer': '🏦 ट्रांसफर',
        'payment.credit': '📝 उधार',
        'payment.installment': '💳 किस्त',

        'common.sar': 'ر.س',
        'common.language': 'भाषा',
    },

    bn: {
        'sidebar.main': 'প্রধান',
        'sidebar.sales_purchases': 'বিক্রয় ও ক্রয়',
        'sidebar.inventory': 'ইনভেন্টরি',
        'sidebar.parties': 'পার্টি',
        'sidebar.finance': 'অর্থ',
        'sidebar.hr': 'মানব সম্পদ',
        'sidebar.integrations': 'ইন্টিগ্রেশন',
        'sidebar.extras': 'অতিরিক্ত',

        'sidebar.dashboard': 'ড্যাশবোর্ড',
        'sidebar.sales': 'বিক্রয়',
        'sidebar.purchases': 'ক্রয়',
        'sidebar.sales_returns': 'বিক্রয় ফেরত',
        'sidebar.purchase_returns': 'ক্রয় ফেরত',
        'sidebar.bookings': 'বুকিং',
        'sidebar.price_quotes': 'মূল্য কোটেশন',
        'sidebar.products': 'পণ্য',
        'sidebar.stock': 'স্টক',
        'sidebar.stock_transfers': 'স্টক ট্রান্সফার',
        'sidebar.barcode': 'বারকোড তৈরি',
        'sidebar.customers': 'গ্রাহক ও সরবরাহকারী',
        'sidebar.banks': 'ব্যাংক',
        'sidebar.treasury': 'কোষাগার',
        'sidebar.expenses': 'খরচ',
        'sidebar.reports': 'রিপোর্ট',
        'sidebar.installments': 'কিস্তি',
        'sidebar.employees': 'কর্মচারী',
        'sidebar.attendance': 'উপস্থিতি',
        'sidebar.salaries': 'বেতন',
        'sidebar.vacations': 'ছুটি',
        'sidebar.whatsapp': 'WhatsApp API',
        'sidebar.salla': 'Salla API',
        'sidebar.coupons': 'কুপন',
        'sidebar.loyalty': 'লয়ালটি প্রোগ্রাম',
        'sidebar.gift_cards': 'গিফট কার্ড',
        'sidebar.batches': 'ব্যাচ এবং মেয়াদ',
        'sidebar.audit_logs': 'অডিট লগ',
        'sidebar.maintenance': 'রক্ষণাবেক্ষণ',
        'sidebar.promotions': 'অফার ও ছাড়',
        'sidebar.purchase_orders': 'ক্রয় আদেশ',
        'sidebar.stocktake': 'স্টকটেক',
        'sidebar.accounting': 'হিসাবরক্ষণ',
        'sidebar.manufacturing': 'ম্যানুফ্যাকচারিং',
        'sidebar.fixed_assets': 'স্থায়ী সম্পদ',
        'sidebar.shifts': 'শিফট',
        'sidebar.branches': 'শাখা',
        'sidebar.settings': 'সেটিংস',
        'sidebar.logout': 'লগ আউট',

        'role.admin': '👑 ম্যানেজার',
        'role.cashier': '💰 ক্যাশিয়ার',
        'role.accountant': '📊 হিসাবরক্ষক',
        'role.data_entry': '📝 ডেটা এন্ট্রি',

        'dashboard.title': '📊 ড্যাশবোর্ড',
        'dashboard.today_sales': 'আজকের বিক্রয়',
        'dashboard.today_purchases': 'আজকের ক্রয়',
        'dashboard.today_profit': 'আজকের লাভ',
        'dashboard.today_expenses': 'আজকের খরচ',
        'dashboard.total_products': 'মোট পণ্য',
        'dashboard.low_stock': 'কম স্টক',
        'dashboard.treasury_balance': 'কোষাগার ব্যালেন্স',
        'dashboard.total_customers': 'মোট গ্রাহক',
        'dashboard.sales_chart': '📈 বিক্রয় (শেষ ৭ দিন)',
        'dashboard.top_selling': '🏆 সর্বাধিক বিক্রিত',
        'dashboard.recent_invoices': '🧾 সাম্প্রতিক ইনভয়েস',
        'dashboard.no_data': 'এখনো কোনো তথ্য নেই',
        'dashboard.refresh': 'রিফ্রেশ',
        'dashboard.refreshing': 'রিফ্রেশ হচ্ছে...',
        'dashboard.sold': 'বিক্রিত',

        'payment.cash': '💵 নগদ',
        'payment.card': '💳 কার্ড',
        'payment.transfer': '🏦 ট্রান্সফার',
        'payment.credit': '📝 বাকি',
        'payment.installment': '💳 কিস্তি',

        'common.sar': 'ر.س',
        'common.language': 'ভাষা',
    },

    ur: {
        'sidebar.main': 'مین',
        'sidebar.sales_purchases': 'فروخت اور خریداری',
        'sidebar.inventory': 'انوینٹری',
        'sidebar.parties': 'فریقین',
        'sidebar.finance': 'مالیات',
        'sidebar.hr': 'انسانی وسائل',
        'sidebar.integrations': 'انضمام',
        'sidebar.extras': 'اضافی',

        'sidebar.dashboard': 'ڈیش بورڈ',
        'sidebar.sales': 'فروخت',
        'sidebar.purchases': 'خریداری',
        'sidebar.sales_returns': 'فروخت واپسی',
        'sidebar.purchase_returns': 'خریداری واپسی',
        'sidebar.bookings': 'بکنگ',
        'sidebar.price_quotes': 'قیمت کوٹیشن',
        'sidebar.products': 'مصنوعات',
        'sidebar.stock': 'اسٹاک',
        'sidebar.stock_transfers': 'اسٹاک ٹرانسفر',
        'sidebar.barcode': 'بارکوڈ بنائیں',
        'sidebar.customers': 'صارفین اور سپلائرز',
        'sidebar.banks': 'بینک',
        'sidebar.treasury': 'خزانہ',
        'sidebar.expenses': 'اخراجات',
        'sidebar.reports': 'رپورٹس',
        'sidebar.installments': 'قسطیں',
        'sidebar.employees': 'ملازمین',
        'sidebar.attendance': 'حاضری',
        'sidebar.salaries': 'تنخواہیں',
        'sidebar.vacations': 'چھٹیاں',
        'sidebar.whatsapp': 'WhatsApp API',
        'sidebar.salla': 'Salla API',
        'sidebar.coupons': 'کوپن',
        'sidebar.loyalty': 'لائلٹی پروگرام',
        'sidebar.gift_cards': 'گفٹ کارڈز',
        'sidebar.batches': 'بیچ اور میعاد',
        'sidebar.audit_logs': 'آڈٹ لاگز',
        'sidebar.maintenance': 'دیکھ بھال',
        'sidebar.promotions': 'آفرز اور چھوٹ',
        'sidebar.purchase_orders': 'خرید آرڈرز',
        'sidebar.stocktake': 'اسٹاک ٹیک',
        'sidebar.accounting': 'حسابداری',
        'sidebar.manufacturing': 'مینوفیکچرنگ',
        'sidebar.fixed_assets': 'مستقل اثاثے',
        'sidebar.shifts': 'شفتیں',
        'sidebar.branches': 'شاخیں',
        'sidebar.settings': 'ترتیبات',
        'sidebar.logout': 'لاگ آؤٹ',

        'role.admin': '👑 منتظم',
        'role.cashier': '💰 کیشیئر',
        'role.accountant': '📊 حسابدار',
        'role.data_entry': '📝 ڈیٹا انٹری',

        'dashboard.title': '📊 ڈیش بورڈ',
        'dashboard.today_sales': 'آج کی فروخت',
        'dashboard.today_purchases': 'آج کی خریداری',
        'dashboard.today_profit': 'آج کا منافع',
        'dashboard.today_expenses': 'آج کے اخراجات',
        'dashboard.total_products': 'کل مصنوعات',
        'dashboard.low_stock': 'کم اسٹاک',
        'dashboard.treasury_balance': 'خزانہ بیلنس',
        'dashboard.total_customers': 'کل صارفین',
        'dashboard.sales_chart': '📈 فروخت (آخری 7 دن)',
        'dashboard.top_selling': '🏆 سب سے زیادہ فروخت',
        'dashboard.recent_invoices': '🧾 حالیہ انوائسز',
        'dashboard.no_data': 'ابھی تک کوئی ڈیٹا نہیں',
        'dashboard.refresh': 'ریفریش',
        'dashboard.refreshing': 'ریفریش ہو رہا ہے...',
        'dashboard.sold': 'فروخت',

        'payment.cash': '💵 نقد',
        'payment.card': '💳 کارڈ',
        'payment.transfer': '🏦 ٹرانسفر',
        'payment.credit': '📝 ادھار',
        'payment.installment': '💳 قسط',

        'common.sar': 'ر.س',
        'common.language': 'زبان',
    },
};

// ============ CONTEXT ============

interface I18nContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: (key: string) => string;
    dir: 'rtl' | 'ltr';
    langInfo: LanguageInfo;
}

const I18nContext = createContext<I18nContextType>({
    lang: 'ar',
    setLang: () => { },
    t: (key: string) => key,
    dir: 'rtl',
    langInfo: languages[0],
});

export function I18nProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Language>('ar');

    useEffect(() => {
        const saved = localStorage.getItem('app_lang') as Language;
        if (saved && translations[saved]) {
            setLangState(saved);
        }
    }, []);

    const setLang = (newLang: Language) => {
        setLangState(newLang);
        localStorage.setItem('app_lang', newLang);
        // Update document direction
        const info = languages.find(l => l.code === newLang)!;
        document.documentElement.dir = info.dir;
        document.documentElement.lang = newLang;
    };

    const t = (key: string): string => {
        return translations[lang]?.[key] || translations['ar']?.[key] || key;
    };

    const langInfo = languages.find(l => l.code === lang)!;

    return (
        <I18nContext.Provider value={{ lang, setLang, t, dir: langInfo.dir, langInfo }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslation() {
    return useContext(I18nContext);
}
