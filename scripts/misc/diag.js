const fs = require('fs');

// We bypass TS require by just regexing it directly
const content = fs.readFileSync('src/lib/translations.ts', 'utf8');

const s4339 = content.match(/"sys\.str_4339"\s*:\s*[`"']([^`"']+)[`"']/);
const s4390 = content.match(/"sys\.str_4390"\s*:\s*[`"']([^`"']+)[`"']/);

console.log("Locally Found 4339 ->", s4339 ? s4339[1] : "NOT FOUND");
console.log("Locally Found 4390 ->", s4390 ? s4390[1] : "NOT FOUND");

// Let's also check if there is an early closing of the `ar` object!
const arObjStart = content.indexOf('ar: {');
const firstEnObj = content.indexOf('en: {');
console.log("ar is between", arObjStart, "and", firstEnObj);
const _4390Index = content.indexOf('sys.str_4390');
console.log("sys.str_4390 is at index", _4390Index);
if (_4390Index > firstEnObj) {
    console.log("CRITICAL ERROR: sys.str_4390 is placed AFTER the en object starts! It is probably in another language object or syntax is broken!");
} else {
    console.log("OK: sys.str_4390 is inside the ar block.");
}
