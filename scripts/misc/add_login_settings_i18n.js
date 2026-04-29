const fs = require('fs');

const loginI18n = {
    'ar': {
        'login.welcome': 'مرحباً بك',
        'login.subtitle': 'نظام إداري ونقاط بيع متكامل',
        'login.username': 'اسم المستخدم',
        'login.password': 'كلمة المرور',
        'login.button': 'تسجيل الدخول',
        'login.loading': 'جاري الدخول...',
        'login.error': 'فشل تسجيل الدخول، يرجى المحاولة مرة أخرى',
        'settings.title': '⚙️ الإعدادات',
        'settings.save': '💾 حفظ الإعدادات',
        'settings.saving': '⏳ جاري الحفظ...'
    },
    'en': {
        'login.welcome': 'Welcome',
        'login.subtitle': 'Integrated POS & ERP System',
        'login.username': 'Username',
        'login.password': 'Password',
        'login.button': 'Login',
        'login.loading': 'Logging in...',
        'login.error': 'Login failed, please try again',
        'settings.title': '⚙️ Settings',
        'settings.save': '💾 Save Settings',
        'settings.saving': '⏳ Saving...'
    },
    'hi': {
        'login.welcome': 'स्वागत है',
        'login.subtitle': 'एकीकृत पीओएस (POS/ERP)',
        'login.username': 'उपयोगकर्ता नाम (Username)',
        'login.password': 'पासवर्ड (Password)',
        'login.button': 'लॉग इन करें',
        'login.loading': 'लॉग इन हो रहा है...',
        'login.error': 'लॉगिन विफल, कृपया पुनः प्रयास करें',
        'settings.title': '⚙️ सेटिंग्स',
        'settings.save': '💾 सेटिंग्स सहेजें',
        'settings.saving': '⏳ सहेजा जा रहा है...'
    },
    'bn': {
        'login.welcome': 'স্বাগতম',
        'login.subtitle': 'সমন্বিত পিওএস (POS/ERP)',
        'login.username': 'ব্যবহারকারীর নাম',
        'login.password': 'পাসওয়ার্ড',
        'login.button': 'লগইন করুন',
        'login.loading': 'লগইন হচ্ছে...',
        'login.error': 'লগইন ব্যর্থ হয়েছে',
        'settings.title': '⚙️ সেটিংস',
        'settings.save': '💾 সেটিংস সেভ করুন',
        'settings.saving': '⏳ সেভ হচ্ছে...'
    },
    'ur': {
        'login.welcome': 'خوش آمدید',
        'login.subtitle': 'انٹیگریٹڈ پی او ایس سسٹم',
        'login.username': 'یوزر نیم',
        'login.password': 'پاس ورڈ',
        'login.button': 'لاگ ان کریں',
        'login.loading': 'لاگ ان ہو رہا ہے...',
        'login.error': 'لاگ ان ناکام، دوبارہ کوشش کریں',
        'settings.title': '⚙️ ترتیبات',
        'settings.save': '💾 محفوظ کریں',
        'settings.saving': '⏳ محفوظ ہو رہا ہے...'
    }
};

let i18n = fs.readFileSync('src/lib/i18n.tsx', 'utf8');

// For each language, find its block and add the new keys
for (const lang of Object.keys(loginI18n)) {
    const langKey = `    ${lang}: {`;
    const startIndex = i18n.indexOf(langKey);
    if (startIndex !== -1) {
        const nextLineIndex = i18n.indexOf('\n', startIndex) + 1;
        let keysToAdd = '';
        for (const [k, v] of Object.entries(loginI18n[lang])) {
            keysToAdd += `        '${k}': '${v.replace(/'/g, "\\'")}',\n`;
        }
        i18n = i18n.slice(0, nextLineIndex) + keysToAdd + i18n.slice(nextLineIndex);
    }
}

fs.writeFileSync('src/lib/i18n.tsx', i18n, 'utf8');
console.log('Login and settings translations injected successfully.');
