const fs = require('fs');

const targetFile = 'src/app/(dashboard)/sales/page.tsx';
let code = fs.readFileSync(targetFile, 'utf8');

const isArabic = (str) => /[\u0600-\u06FF]/.test(str);

const dictionary = {};
let keyCounter = 1;

// Regex to find JSX text nodes containing Arabic
code = code.replace(/>([^<]*[\u0600-\u06FF][^<]*)<\//g, (match, p1) => {
    let cleanText = p1.trim();
    if(!cleanText) return match;
    
    // Check if we already have a key for this exact string
    let exists = Object.entries(dictionary).find(([_, v]) => v.ar === cleanText);
    let newKey = exists ? exists[0] : `sales.str_${keyCounter++}`;
    
    if(!exists) {
        dictionary[newKey] = { ar: cleanText };
    }
    
    return `>{t('${newKey}')}</`;
});

// Regex to find JSX attributes containing Arabic (like placeholder="...", title="...", etc)
code = code.replace(/([a-zA-Z]+)="([^"]*[\u0600-\u06FF][^"]*)"/g, (match, p1, p2) => {
    let cleanText = p2.trim();
    if(!cleanText) return match;
    
    let exists = Object.entries(dictionary).find(([_, v]) => v.ar === cleanText);
    let newKey = exists ? exists[0] : `sales.str_${keyCounter++}`;
    
    if(!exists) {
        dictionary[newKey] = { ar: cleanText };
    }
    
    return `${p1}={t('${newKey}')}`;
});

// Regex to find generic string literals containing Arabic (like alert('...') or showToast('...'))
// Be careful with JS string concats, this is basic.
code = code.replace(/'([^']*[\u0600-\u06FF][^']*)'/g, (match, p1) => {
    // Only replace if it's purely Arabic/number text, avoiding complex template strings or concatenated strings if possible
    let cleanText = p1.trim();
    if(!cleanText || match.includes("${")) return match;

    let exists = Object.entries(dictionary).find(([_, v]) => v.ar === cleanText);
    let newKey = exists ? exists[0] : `sales.str_${keyCounter++}`;
    
    if(!exists) {
        dictionary[newKey] = { ar: cleanText };
    }
    
    return `t('${newKey}')`;
});

// Handle template literals containing Arabic (like `...`)
code = code.replace(/`([^`]*[\u0600-\u06FF][^`]*)`/g, (match, p1) => {
    // If it contains interpolation ${}, it's harder. Let's just output it to console to handle manually if any
    if (match.includes('${')) {
        console.log("Found complex template literal:", match);
        return match;
    }
    
    let cleanText = p1.trim();
    if(!cleanText) return match;

    let exists = Object.entries(dictionary).find(([_, v]) => v.ar === cleanText);
    let newKey = exists ? exists[0] : `sales.str_${keyCounter++}`;
    
    if(!exists) {
        dictionary[newKey] = { ar: cleanText };
    }
    
    return `t('${newKey}')`;
});

fs.writeFileSync(targetFile.replace('.tsx', '_localized.tsx'), code, 'utf8');
fs.writeFileSync('sales_extracted_strings.json', JSON.stringify(dictionary, null, 2), 'utf8');

console.log(`Extracted ${Object.keys(dictionary).length} strings.`);
