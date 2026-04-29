const fs = require('fs');
try {
    const file = fs.readFileSync('src/lib/translations.ts', 'utf8');
    const lines = file.split('\n');
    const seenAr = new Set();
    const seenEn = new Set();
    let currentLang = null;
    let newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        if (line.includes('"ar": {')) currentLang = 'ar';
        else if (line.includes('"en": {')) currentLang = 'en';
        else if (line.includes('"hi": {')) currentLang = 'hi';
        else if (line.includes('"bn": {')) currentLang = 'bn';
        else if (line.includes('"ur": {')) currentLang = 'ur';
        
        const match = line.match(/"([^"]+)"\s*:/);
        if (match && currentLang) {
            const key = match[1];
            // Skip checking non-sys keys or known safe keys
            if (key.startsWith('sys.str_') || key.startsWith('pos.') || key.startsWith('resto.') || key.startsWith('sales.') || key.startsWith('hr.')) {
                const seenSet = currentLang === 'ar' ? seenAr : currentLang === 'en' ? seenEn : null;
                if (seenSet) {
                    if (seenSet.has(key)) {
                        console.log(`Removed duplicate in ${currentLang}: ${key}`);
                        continue; // SKIP this line!
                    } else {
                        seenSet.add(key);
                    }
                }
            }
        }
        newLines.push(line);
    }
    
    fs.writeFileSync('src/lib/translations.ts', newLines.join('\n'));
    console.log("Cleanup complete!");
} catch(e) {
    console.error(e);
}
