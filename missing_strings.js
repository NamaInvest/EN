const fs = require('fs');

let content = fs.readFileSync('src/lib/translations.ts', 'utf8');

const missingStrings = {
    "sys.str_4390": "🏢 معلومات الشركة",
    "sys.str_4391": "اسم الشركة",
    "sys.str_4392": "اسم الشركة بالإنجليزي",
    "sys.str_4393": "هاتف الشركة",
    "sys.str_4394": "عنوان الشركة",
    "sys.str_4395": "الرقم الضريبي (VAT)",
    "sys.str_4396": "العملة",
    "sys.str_4397": "💰 الضريبة",
    "sys.str_4398": "نسبة الضريبة %",
    "sys.str_4399": "تفعيل ZATCA",
    "sys.str_4400": "🔐 ربط الزكاة - المرحلة الثانية",
    "sys.str_4401": "رقم السجل التجاري (CRN)",
    "sys.str_4402": "نوع النشاط (مثل: Technology, Retail)",
    "sys.str_4403": "اسم الفرع بالإنجليزي (Organization Unit)",
    "sys.str_4404": "اسم الشارع",
    "sys.str_4405": "رقم المبنى",
    "sys.str_4406": "الحي",
    "sys.str_4407": "المدينة بالعربي",
    "sys.str_4408": "المدينة بالإنجليزي (للشهادة)",
    "sys.str_4409": "الرمز البريدي",
    "sys.str_4410": "🖨️ الطباعة",
    "sys.str_4411": "مقاس ورق الفواتير",
    "sys.str_4412": "🧾 حرارية 58mm (صغيرة)",
    "sys.str_4413": "🧾 حرارية 76mm (متوسطة)",
    "sys.str_4414": "🧾 حرارية 80mm (قياسية)",
    "sys.str_4415": "رأس الفاتورة",
    "sys.str_4416": "تذييل الفاتورة",
    "sys.str_4417": "مقاس ملصق الباركود",
    "sys.str_4418": "📱 واتساب API",
    "sys.str_4419": "تفعيل واتساب API",
    "sys.str_4420": "✉️ بوابات الـ SMS (رسائل نصية)",
    "sys.str_4421": "تفعيل إرسال الفواتير عبر رقم الجوال",
    "sys.str_4422": "مزود الخدمة (Taqnyat أو Unifonic)",
    "sys.str_4423": "Taqnyat (تقنيات)",
    "sys.str_4424": "Unifonic (يونيفونك)",
    "sys.str_4425": "مفتاح الـ API (Access Token)",
    "sys.str_4426": "اسم المرسل (Sender ID)",
    "sys.str_4427": "🛒 سلة API",
    "sys.str_4428": "تفعيل ربط سلة",
    "sys.str_4429": "معرف المتجر (Merchant ID)",
    "sys.str_4430": "Webhook URL (للقراءة فقط)",
    "sys.str_4431": "🛍️ زد API",
    "sys.str_4432": "تفعيل ربط زد",
    "sys.str_4433": "معرف المتجر (Store ID)",
    "sys.str_4434": "🌐 ربط منصة فاتورة (OTA)",
    "sys.str_4435": "البيئة",
    "sys.str_4436": "OTP من بوابة فاتورة",
    "sys.str_4437": "💳 بوابات الدفع والتقسيط (BNPL)",
    "sys.str_4438": "مفتاح Tabby Secret Key",
    "sys.str_4439": "كود التاجر (Merchant Code) لتابي",
    "sys.str_4440": "مفتاح Tamara Bearer Token",
    "sys.str_4441": "🤖 الذكاء الاصطناعي وبوت تلجرام",
    "sys.str_4442": "مفتاح Gemini API (لقارئ الفواتير الذكي)",
    "sys.str_4443": "مفتاح بوت تلجرام (Bot Token)",
    "sys.str_4444": "معرف دردشة المدير (Chat ID للمدقق الآلي)",
    "sys.str_4445": "📊 لوحة التحكم الرئيسية",
    "sys.str_4446": "💻 شاشة نقطة البيع (POS)",
    "sys.str_4447": "🍔 نقطة بيع المطاعم",
    "sys.str_4448": "🕒 ورديات الكاشير",
    "sys.str_4449": "📦 أوامر البيع"
};

let modified = false;

for (const [key, value] of Object.entries(missingStrings)) {
    // If the key is truly missing from the ENTIRE file (even commented out)
    if (!content.includes(`"${key}"`)) {
        // Insert it right before sys.str_2889 which marks the start of some other language region
        // actually insert it right at the end of the arabic section!
        content = content.replace(/("sys\.str_4795": "مسجل ومنتظم",?\n)/, `$1        "${key}": "${value}",\n`);
        modified = true;
        console.log(`+ Injected ${key}`);
    } else {
        // Maybe it exists but is overwritten by an empty string or it's duplicated?
        // Let's force replace it if it's there but broken!
        const keyPattern = new RegExp(`"${key}"\\s*:\\s*".*?"`, 'g');
        const matches = content.match(keyPattern);
        if (matches) {
            content = content.replace(keyPattern, `"${key}": "${value}"`);
            modified = true;
        }
    }
}

if (modified) {
    fs.writeFileSync('src/lib/translations.ts', content, 'utf8');
    console.log('✅ تم دمج كل نصوص الإعدادات המفقودة بنجاح.');
} else {
    console.log('✨ النصوص موجودة بالكامل ولا ينقصها شيء.');
}

// 2. Clear .next completely since NEXT.js chunks the dictionary and caches it fiercely
try {
    const { execSync } = require('child_process');
    console.log('⏳ جاري رفع الملف وتحديث السيرفر السحابي (مع تنظيف الكاش)...');
    execSync('node clean_n11.js', { stdio: 'inherit' });
} catch (e) {
    console.log('❌ Error during execution');
}
