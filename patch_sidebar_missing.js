const fs = require('fs');

let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

const newLabels = {
  ar: `    'i.ai_bank': 'البنك الذكي',
    'i.fleet_fuel': 'وقود الأودت',
    'i.prop_inst': 'أقساط العقارات',
    'i.bookings': 'الحجوزات والمواعيد',
    'i.book_cal': 'تقويم الحجوزات',
    'i.affiliates': 'التسويق بالعمولة',
    'i.bank_recon': 'مذكرات التسوية البنكية',
    'i.fraud_ai': 'كشف الاحتيال الذكي',
    'i.73mod': 'تقرير الـ 73 نموذج',
    'i.sys_health': 'حالة النظام',
    'i.mrp_recipes': 'وصفات التصنيع (Recipes)',
    'i.stocktake': 'عمليات الجرد المخزني',
`,
  en: `    'i.ai_bank': 'AI Bank Reconciliation',
    'i.fleet_fuel': 'Fleet Fuel & Oil',
    'i.prop_inst': 'Property Installments',
    'i.bookings': 'Bookings & Appointments',
    'i.book_cal': 'Booking Calendar',
    'i.affiliates': 'Affiliates Marketing',
    'i.bank_recon': 'Bank Reconciliation',
    'i.fraud_ai': 'AI Fraud Detection',
    'i.73mod': '73-Modules Report',
    'i.sys_health': 'System Health',
    'i.mrp_recipes': 'Manufacturing Recipes',
    'i.stocktake': 'Stocktake Operations',
`,
  hi: `    'i.ai_bank': 'AI बैंक',
    'i.fleet_fuel': 'बेड़ा ईंधन',
    'i.prop_inst': 'संपत्ति किश्तें',
    'i.bookings': 'बुकिंग और अपॉइंटमेंट',
    'i.book_cal': 'बुकिंग कैलेंडर',
    'i.affiliates': 'सहबद्ध विपणन',
    'i.bank_recon': 'बैंक समाधान',
    'i.fraud_ai': 'AI धोखाधड़ी का पता लगाना',
    'i.73mod': '73-मॉड्यूल रिपोर्ट',
    'i.sys_health': 'सिस्टम स्वास्थ्य',
    'i.mrp_recipes': 'विनिर्माण नुस्खे',
    'i.stocktake': 'स्टॉक जांच कार्य',
`,
  bn: `    'i.ai_bank': 'AI ব্যাংক',
    'i.fleet_fuel': 'বহর জ্বালানী',
    'i.prop_inst': 'সম্পত্তি কিস্তি',
    'i.bookings': 'বুকিং এবং অ্যাপয়েন্টমেন্ট',
    'i.book_cal': 'বুকিং ক্যালেন্ডার',
    'i.affiliates': 'অ্যাফিলিয়েট মার্কেটিং',
    'i.bank_recon': 'ব্যাংক সমন্বয়',
    'i.fraud_ai': 'AI জালিয়াতি সনাক্তকরণ',
    'i.73mod': '73-মডিউল রিপোর্ট',
    'i.sys_health': 'সিস্টেম স্বাস্থ্য',
    'i.mrp_recipes': 'উত্পাদন রেসিপি',
    'i.stocktake': 'স্টকটেক অপারেশন',
`,
  ur: `    'i.ai_bank': 'AI بینک',
    'i.fleet_fuel': 'فلیٹ فیول',
    'i.prop_inst': 'جائیداد کی اقساط',
    'i.bookings': 'بکنگز',
    'i.book_cal': 'بکنگ کیلنڈر',
    'i.affiliates': 'ملحقہ مارکیٹنگ',
    'i.bank_recon': 'بینک مفاہمت',
    'i.fraud_ai': 'AI فراڈ کا پتہ لگانا',
    'i.73mod': '73-ماڈیولز رپورٹ',
    'i.sys_health': 'سسٹم کی صحت',
    'i.mrp_recipes': 'مینوفیکچرنگ ترکیبیں',
    'i.stocktake': 'اسٹاک ٹیک آپریشنز',
`
};

for(const lang of ['ar', 'en', 'hi', 'bn', 'ur']) {
    const searchString = `'logout': '${lang === 'ar' ? 'تسجيل الخروج' : lang === 'en' ? 'Logout' : lang === 'hi' ? 'लॉगआउट' : lang === 'bn' ? 'লগআউট' : 'لاگ آؤٹ'}',\n  },`;
    
    if (content.includes(searchString)) {
        content = content.replace(searchString, newLabels[lang] + searchString);
    }
}

// Now insert into menuItems
content = content.replace(`    { icon: '📊', lk: 'i.dashboard', href: '/dashboard', module: 'dashboard' },`, `    { icon: '📊', lk: 'i.dashboard', href: '/dashboard', module: 'dashboard' },
    { icon: '🏦', lk: 'i.ai_bank', href: '/ai-bank', module: 'ai_bank' },`);

content = content.replace(`    { icon: '🎯', lk: 'i.promotions', href: '/promotions', module: 'promotions' },`, `    { icon: '🎯', lk: 'i.promotions', href: '/promotions', module: 'promotions' },
    { icon: '📅', lk: 'i.bookings', href: '/bookings', module: 'bookings' },
    { icon: '📆', lk: 'i.book_cal', href: '/bookings/calendar', module: 'bookings' },
    { icon: '🤝', lk: 'i.affiliates', href: '/affiliates', module: 'affiliates' },`);

content = content.replace(`    { icon: '📈', lk: 'i.fin_reports', href: '/reports', module: 'reports' },`, `    { icon: '📈', lk: 'i.fin_reports', href: '/reports', module: 'reports' },
    { icon: '📋', lk: 'i.73mod', href: '/reports/73-modules', module: 'reports' },
    { icon: '🕵️', lk: 'i.fraud_ai', href: '/reports/fraud-ai', module: 'reports' },
    { icon: '🔄', lk: 'i.bank_recon', href: '/treasury/bank-reconciliation', module: 'treasury' },`);

content = content.replace(`    { icon: '🚚', lk: 'i.fleet', href: '/enterprise/fleet', module: 'legal' },`, `    { icon: '🚚', lk: 'i.fleet', href: '/enterprise/fleet', module: 'legal' },
    { icon: '⛽', lk: 'i.fleet_fuel', href: '/fleet/fuel', module: 'legal' },`);

content = content.replace(`    { icon: '📝', lk: 'i.leases', href: '/rem/leases', module: 'legal' },`, `    { icon: '📝', lk: 'i.leases', href: '/rem/leases', module: 'legal' },
    { icon: '💵', lk: 'i.prop_inst', href: '/rem/installments', module: 'legal' },`);

content = content.replace(`    { icon: '🔧', lk: 'i.support', href: '/maintenance', module: 'maintenance' },`, `    { icon: '🔧', lk: 'i.support', href: '/maintenance', module: 'maintenance' },
    { icon: '💓', lk: 'i.sys_health', href: '/sys/health', module: 'maintenance' },`);

content = content.replace(`    { icon: '📸', lk: 'i.vision', href: '/stocktake/vision', module: 'vision_inventory' },`, `    { icon: '📸', lk: 'i.vision', href: '/stocktake/vision', module: 'vision_inventory' },
    { icon: '📋', lk: 'i.stocktake', href: '/stocktake', module: 'stock' },`);

content = content.replace(`    { icon: '🏭', lk: 'i.mrp', href: '/enterprise/mrp', module: 'mrp' },`, `    { icon: '🏭', lk: 'i.mrp', href: '/enterprise/mrp', module: 'mrp' },
    { icon: '📚', lk: 'i.mrp_recipes', href: '/enterprise/mrp/recipes', module: 'mrp' },`);

fs.writeFileSync('src/components/Sidebar.tsx', content);
console.log('Sidebar patched successfully!');

