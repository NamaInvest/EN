const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🔄 جاري تطبيق الاسترداد الآمن لملف الترجمة...');
const transPath = path.join(__dirname, 'src', 'lib', 'translations.ts');

if (fs.existsSync(transPath)) {
    let content = fs.readFileSync(transPath, 'utf8');

    // 1. Fix the multiline error safely inside sys.str_4138
    content = content.replace(/"sys\.str_4138"\s*:\s*"هذا النظام المتطور يقوم بمراقبة أرصدة مستودعاتك في الخلفية\.\s*عندما تقترب كمية أي منتج من النفاذ، سيقوم العقل الاصطناعي بإنشاء \(أمر شراء\) تلقائياً من المورد الافتراضي\.",/m, '"sys.str_4138": `هذا النظام المتطور يقوم بمراقبة أرصدة مستودعاتك في الخلفية. عندما تقترب كمية أي منتج من النفاذ، سيقوم العقل الاصطناعي بإنشاء (أمر شراء) تلقائياً من المورد الافتراضي.`,');

    // Remove all wandering solitary commas safely (^\s*,\s*$) without touching anything else!
    content = content.replace(/^\s*,\s*$/gm, '');

    // Write it back to file so we can run the quote-fixing tool
    fs.writeFileSync(transPath, content, 'utf8');
}

console.log('✅ تم إزالة الفواصل والأسطر المتعددة المكسورة.');
console.log('🛠️ جاري إطلاق البناء الشامل والنشر...');

// Run the safe 109 internal quotes fixer
exec('node fix_build_errors_3.js', (err, stdout, stderr) => {
    console.log(stdout);
    if (!err) {
        console.log('🚀 الآن سيتم نشر النظام ورفع المجلدات المفقودة (Hooks/Components)...');
        const deployChild = exec('node deploy_n11.js');
        deployChild.stdout.on('data', data => process.stdout.write(data));
        deployChild.stderr.on('data', data => process.stderr.write(data));
    } else {
        console.error(stderr);
    }
});
