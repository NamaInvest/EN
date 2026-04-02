const fs = require('fs');

const code = fs.readFileSync('src/lib/i18n.tsx', 'utf8');

// We want to extract the translations object. Since it's TSX, we can compile it quickly or regex it.
// Let's just Regex out the en block
const enIndex = code.indexOf('\n    en: {');
const arIndex = code.indexOf('    ar: {');
const bnIndex = code.indexOf('\n    bn: {');

if (enIndex > -1) {
    const enBlock = code.substring(enIndex, bnIndex > enIndex ? bnIndex : code.length);
    console.log("English block contains 'الرئيسية'?", enBlock.includes('الرئيسية'));
    console.log("English block contains 'فواتير'?", enBlock.includes('فواتير'));
    
    // Let's print the actual dictionary if possible
} else {
    console.log("EN block not found!");
}
