const fs = require('fs');

const extract = JSON.parse(fs.readFileSync('all_extracted_strings.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('all_en.json', 'utf8'));
const hi = JSON.parse(fs.readFileSync('all_hi.json', 'utf8'));
const bn = JSON.parse(fs.readFileSync('all_bn.json', 'utf8'));
const ur = JSON.parse(fs.readFileSync('all_ur.json', 'utf8'));

let i18n = fs.readFileSync('src/lib/i18n.tsx', 'utf8');

// Build string blocks for each language
let arLines = '';
for(let k in extract) {
    let val = extract[k].ar || '';
    val = val.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
    arLines += `        '${k}': '${val}',\n`;
}

let enLines = '';
for(let k in en) {
    let val = en[k] || '';
    val = val.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
    enLines += `        '${k}': '${val}',\n`;
}

let hiLines = '';
for(let k in hi) {
    let val = hi[k] || '';
    val = val.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
    hiLines += `        '${k}': '${val}',\n`;
}

let bnLines = '';
for(let k in bn) {
    let val = bn[k] || '';
    val = val.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
    bnLines += `        '${k}': '${val}',\n`;
}

let urLines = '';
for(let k in ur) {
    let val = ur[k] || '';
    val = val.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
    urLines += `        '${k}': '${val}',\n`;
}

// Inject into existing blocks
i18n = i18n.replace('ar: {', 'ar: {\n' + arLines);
i18n = i18n.replace('en: {', 'en: {\n' + enLines);
i18n = i18n.replace('hi: {', 'hi: {\n' + hiLines);
i18n = i18n.replace('bn: {', 'bn: {\n' + bnLines);
i18n = i18n.replace('ur: {', 'ur: {\n' + urLines);

fs.writeFileSync('src/lib/i18n.tsx', i18n);
console.log('Successfully merged all new translations while preserving original ones!');
