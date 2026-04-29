const fs = require('fs');
const content = fs.readFileSync('src/lib/translations.ts', 'utf8');

const enBlockStr = content.split('"en": {')[1].split('"hi": {')[0];
console.log('--- Matches in EN block ---');
const matches = enBlockStr.match(/sidebar\.section\.dashboard[^,]*/g);
if (matches) {
    matches.forEach(m => console.log(m));
} else {
    console.log('No matches');
}
