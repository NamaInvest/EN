const fs = require('fs');

let content = fs.readFileSync('src/lib/translations.ts', 'utf8');
const lines = content.split(/\r?\n/);

const newLines = [];
const seenKeys = new Set();
let duplicatesRemoved = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect language block headers like: ar: { or "ar": {
    if (line.match(/^\s*['"]?(ar|en|hi|bn|ur)['"]?\s*:\s*\{\s*$/)) {
        seenKeys.clear(); // Reset seen keys for the new language
        newLines.push(line);
        continue;
    }

    // Match translation keys: "sys.str_4390": "..."
    // Specifically looking for the key part
    const match = line.match(/^\s*"([^"]+)"\s*:/);
    
    if (match) {
        const key = match[1];
        
        // If the key is already in our Set for this language block, it's a duplicate!
        if (seenKeys.has(key)) {
            duplicatesRemoved++;
            // We gently skip this line, effectively removing it.
            // Note: because of our previous fix_all_multiline.js, all multiline strings are on a single line!
            continue;
        } else {
            // First time seeing this key, keep it!
            seenKeys.add(key);
            newLines.push(line);
        }
    } else {
        // Not a key-value line (could be a comment or brace)
        newLines.push(line);
    }
}

// Write the pristine, deduplicated dictionary back
fs.writeFileSync('src/lib/translations.ts', newLines.join('\n'), 'utf8');

console.log(`🧹 تمت عملية التنظيف بنجاح!`);
console.log(`🚀 تم حذف ${duplicatesRemoved} سطر مكرر من جميع اللغات.`);

if (duplicatesRemoved > 0) {
    const { execSync } = require('child_process');
    try {
        console.log('⏳ جاري رفع القاموس النظيف إلى السيرفر الحي...');
        execSync('node deploy5.js', { stdio: 'inherit' });
        console.log('✅ اكتمل التنظيف والتحديث السحابي بسلام!');
    } catch (e) {
        console.log('❌ خطأ في الرفع للسيرفر.');
    }
}
