const fs = require('fs');
const path = require('path');

console.log('🔄 جاري تطبيق الحل الشامل العميق لملفات الترجمة...');

const transPath = path.join(__dirname, 'src', 'lib', 'translations.ts');

if (fs.existsSync(transPath)) {
    let content = fs.readFileSync(transPath, 'utf8');
    
    // We split by exactly the translation key format: "prefix.str_XXX": 
    // This allows us to capture the entire broken value string even if it spans multiple lines or has unescaped quotes!
    const keyRegex = /^(\s*"(?:sys|fin|stock|pos)\.str_\d+"\s*:\s*)/m;
    const parts = content.split(keyRegex);
    
    let newContent = parts[0];
    let fixedMultiLines = 0;
    let fixedInternalQuotes = 0;

    for (let i = 1; i < parts.length; i += 2) {
        const keyPart = parts[i];
        let valPart = parts[i + 1];
        
        // valPart should start with a quote and end with a quote before comma.
        // E.g., `"Value with "quotes" and \n newlines",\n`
        const firstQuote = valPart.indexOf('"');
        const lastQuote = valPart.lastIndexOf('"');
        
        if (firstQuote !== -1 && lastQuote !== -1 && firstQuote !== lastQuote) {
            let innerText = valPart.substring(firstQuote + 1, lastQuote);
            
            // Fix unescaped double quotes by turning them into single quotes softly
            if (innerText.includes('"')) {
                innerText = innerText.replace(/"/g, "'");
                fixedInternalQuotes++;
            }
            
            // Fix multiline strings safety: Typescript evaluates backticks for multiline.
            if (innerText.includes('\n') || innerText.includes('\r')) {
                fixedMultiLines++;
            }

            // Escape backticks and dollars so ${} doesn't execute JS variables 
            innerText = innerText.replace(/`/g, "\\`").replace(/\$/g, "\\$");

            // Reconstruct value using Backticks ` ` instead of " " so ALL Typescript errors disappear
            valPart = valPart.substring(0, firstQuote) + '`' + innerText + '`' + valPart.substring(lastQuote + 1);
        }
        
        newContent += keyPart + valPart;
    }

    fs.writeFileSync(transPath, newContent, 'utf8');
    console.log(`✅ تم تطبيق الحل الشامل!`);
    console.log(`🔧 تم حماية ${fixedInternalQuotes} نص يحتوي على تنصيص داخلي.`);
    console.log(`🔧 تم حماية ${fixedMultiLines} نص متعدد الأسطر معطوب.`);
}

console.log('🛠️ جاري إطلاق البناء الشامل الأخير...');
const { exec } = require('child_process');
exec('npx next build', (err, stdout, stderr) => {
    if (err) {
        console.error('❌ لا يزال هناك خطأ في البناء:', stderr);
    } else {
        console.log('🌟 عظيم جداً! نجح البناء 100% وأصبح النظام خالياً تماماً من الأخطاء النحوية!');
        console.log('حان الوقت الآن لرفع الملفات للخادم الحيعبر: node deploy_n11.js');
    }
});
