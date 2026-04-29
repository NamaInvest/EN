const fs = require('fs');

const content = fs.readFileSync('src/lib/translations.ts', 'utf8');
const lines = content.split('\n');

let inEn = false;
console.log('--- EN SIDEBAR ITEMS ---');
for (const line of lines) {
    if (line.includes('"en": {')) {
        inEn = true;
    }
    if (line.includes('"hi": {') || line.includes('"ar": {') && inEn) {
        inEn = false;
    }
    
    if (inEn && line.includes('sidebar.')) {
        console.log(line);
    }
}
