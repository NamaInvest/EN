const fs = require('fs');
const path = require('path');

const FILES = [
    'src/app/api/purchases/ocr/route.ts',
    'src/app/api/stocktake/vision/route.ts',
    'src/app/api/ai-cfo/route.ts',
    'src/app/api/ai-cfo/report/route.ts',
    'src/app/api/ai-auditor/route.ts',
];

const OLD = 'gemini-2.0-flash';
const NEW = 'gemini-1.5-flash';

let changed = 0;
for (const rel of FILES) {
    const full = path.join(__dirname, rel);
    if (!fs.existsSync(full)) { console.log(`SKIP (not found): ${rel}`); continue; }
    const content = fs.readFileSync(full, 'utf8');
    if (!content.includes(OLD)) { console.log(`SKIP (no match): ${rel}`); continue; }
    const updated = content.split(OLD).join(NEW);
    fs.writeFileSync(full, updated, 'utf8');
    console.log(`✅ Updated: ${rel}`);
    changed++;
}
console.log(`\nDone. ${changed} files updated.`);
