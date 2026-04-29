const fs = require('fs');

try {
    const file = fs.readFileSync('src/lib/translations.ts', 'utf8');
    const lines = file.split('\n');
    const seenAr = new Set();
    const seenEn = new Set();
    
    let currentLang = null;
    let newLines = [];
    
    // Header
    newLines.push(`// Auto-generated statically compiled dictionary - cleaned on ${new Date().toISOString()}`);
    newLines.push(`export type Language = 'ar' | 'en';`);
    newLines.push(`const translations: Record<Language, Record<string, string>> = {`);
    
    let inAr = false;
    let inEn = false;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let trimmed = line.trim();
        
        if (trimmed.includes('"ar": {')) {
            currentLang = 'ar';
            inAr = true;
            newLines.push('  "ar": {');
            continue;
        } else if (trimmed.includes('"en": {')) {
            currentLang = 'en';
            inEn = true;
            newLines.push('  },');
            newLines.push('  "en": {');
            continue;
        } else if (trimmed.includes('"hi": {') || trimmed.includes('"bn": {') || trimmed.includes('"ur": {')) {
            currentLang = 'skip';
            continue;
        }
        
        if (currentLang === 'ar' || currentLang === 'en') {
            const match = line.match(/"([^"]+)"\s*:/);
            if (match) {
                const key = match[1];
                const seenSet = currentLang === 'ar' ? seenAr : seenEn;
                
                if (seenSet.has(key)) {
                    // Duplicate! Skip it entirely
                    continue;
                } else {
                    seenSet.add(key);
                    
                    // We must ensure the line is valid and has a trailing comma if needed (though TS accepts missing comma on last line)
                    // Just push it as is, but remove any duplicate commas
                    if (!trimmed.endsWith(',')) {
                        line = line + ',';
                    }
                    newLines.push(line);
                }
            } else if (trimmed === '},' || trimmed === '}') {
                // Ignore closing braces, we handle them manually.
            }
        }
    }
    
    // Clean up the trailing comma on the very last item of 'en' block if we want, but TS allows dangling commas.
    newLines.push(`  }`);
    newLines.push(`};`);
    newLines.push(``);
    newLines.push(`export function translate(key: string, lang: Language): string {`);
    newLines.push(`  if (translations[lang] && translations[lang][key]) return translations[lang][key];`);
    newLines.push(`  if (translations['ar'] && translations['ar'][key]) return translations['ar'][key];`);
    newLines.push(`  return key;`);
    newLines.push(`}`);
    newLines.push(``);
    newLines.push(`export default translations;`);
    
    fs.writeFileSync('src/lib/translations.ts', newLines.join('\n'));
    console.log(`✅ File reconstructed. Arabic keys: ${seenAr.size}, English keys: ${seenEn.size}`);
    
} catch(e) {
    console.error(e);
}
