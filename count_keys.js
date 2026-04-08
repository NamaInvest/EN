const fs = require('fs');
const code = fs.readFileSync('src/lib/translations.ts', 'utf8');

// Focus only on the "ar": { ... } block to avoid multiplying by 5 languages
const arStart = code.indexOf('"ar": {');
const enStart = code.indexOf('"en": {');

const arBlock = code.substring(arStart, enStart);

const sysMatches = arBlock.match(/"sys\.str_\d+":/g) || [];
const stockMatches = arBlock.match(/"stock\.str_\d+":/g) || [];

console.log('Total sys.str_ keys in Arabic dictionary:', sysMatches.length);
console.log('Total stock.str_ keys in Arabic dictionary:', stockMatches.length);
console.log('Grand Total unique translation keys in the project:', sysMatches.length + stockMatches.length);
