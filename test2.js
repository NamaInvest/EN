const fs = require('fs');
const code = fs.readFileSync('src/lib/translations.ts', 'utf8');
const lines = code.split('\n');

let currentLang = null;
let found = null;
for (const line of lines) {
    if (line.includes('"ar": {')) currentLang = 'ar';
    else if (line.includes('"en": {')) currentLang = 'en';
    else if (line.includes('"hi": {')) currentLang = 'hi';
    
    if (currentLang === 'en' && line.includes('sidebar.section.inventory')) {
        found = line;
        break;
    }
}
console.log('Result for English sidebar.section.inventory:', found);
