const fs = require('fs');
const path = require('path');

console.log('🔄 جاري إصلاح السلاسل النصية متعددة الأسطر...');

const transPath = path.join(__dirname, 'src', 'lib', 'translations.ts');
if (fs.existsSync(transPath)) {
    let content = fs.readFileSync(transPath, 'utf8');
    
    // Replace the problematic multiline string around sys.str_4138
    // Since lines might have different spaces or CR/LF, we match the key and the general structure
    content = content.replace(/"sys\.str_4138"\s*:\s*"هذا النظام المتطور يقوم بمراقبة أرصدة مستودعاتك في الخلفية\.\s*عندما تقترب كمية أي منتج من النفاذ، سيقوم العقل الاصطناعي بإنشاء \(أمر شراء\) تلقائياً من المورد الافتراضي\.",/m, '"sys.str_4138": `هذا النظام المتطور يقوم بمراقبة أرصدة مستودعاتك في الخلفية. عندما تقترب كمية أي منتج من النفاذ، سيقوم العقل الاصطناعي بإنشاء (أمر شراء) تلقائياً من المورد الافتراضي.`,');

    fs.writeFileSync(transPath, content, 'utf8');
    console.log(`✅ تم تصحيح ترجمة 4138 في src/lib/translations.ts`);
}

console.log('🛠️ جاري التحقق من عملية البناء محلياً مجدداً...');
const { exec } = require('child_process');
exec('npx next build', (err, stdout, stderr) => {
    if (err) {
        console.error('❌ لا يزال هناك خطأ في البناء:', stderr);
    } else {
        console.log('🌟 نجح البناء تماماً وبدون أية أخطاء!! 🥳');
        console.log('الآن قم بتشغيل الأمر: node deploy_n11.js لرفع كود النواة النظيف وتفعيل السيرفر.');
    }
});
