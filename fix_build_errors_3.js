const fs = require('fs');
const path = require('path');

console.log('🔄 جاري فحص ملفات الترجمة لتصحيح جميع علامات التنصيص العالقة...');

const filesToFix = [
    'src/lib/translations.ts',
    'src/lib/i18n_from_server.tsx'
];

filesToFix.forEach(relPath => {
    const fullPath = path.join(__dirname, relPath);
    if (!fs.existsSync(fullPath)) return;
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let lines = content.split('\n');
    let fixedLines = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Match the pattern: [whitespace] "[Key]" : "[Value]" [,] [whitespace]
        // This captures everything between the FIRST value quote and the LAST value quote as $2.
        const regex = /^(\s*"[^"]+"\s*:\s*)"(.*)"(,?)\s*$/;
        const match = line.match(regex);
        
        if (match) {
            let innerText = match[2];
            // If innerText still contains double quotes, it means there were unescaped quotes inside!
            if (innerText.includes('"')) {
                // Replace them with single quotes to safely preserve JSON/TS string syntax without breaking
                const safeInner = innerText.replace(/"/g, "'");
                lines[i] = `${match[1]}"${safeInner}"${match[3]}`;
                fixedLines++;
            }
        }
    }

    if (fixedLines > 0) {
        fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
        console.log(`✅ تم تصحيح ${fixedLines} أخطاء في ${relPath}`);
    } else {
        console.log(`✨ ملف ${relPath} سليم ولا يحتاج تصحيح.`);
    }
});

console.log('🛠️ جاري التحقق من عملية البناء محلياً للضربة القاضية...');
const { exec } = require('child_process');
exec('npx next build', (err, stdout, stderr) => {
    if (err) {
        console.error('❌ لا يزال هناك خطأ في البناء:', stderr);
    } else {
        console.log('🌟 عظيم! نجح البناء تماماً بدون أي خطأ!');
        console.log('الآن قم بتشغيل الأمر: node deploy_n11.js لرفع النظام فوراً.');
    }
});
