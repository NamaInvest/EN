const fs   = require('fs');
const path = require('path');

const apiDir = 'd:\\namasoft9-3-main\\src\\app\\api';
let anyCount = 0, negCheck = 0, txCount = 0, totalFiles = 0, errLeak = 0;

function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) { scan(full); continue; }
        if (!e.name.endsWith('.ts')) continue;
        totalFiles++;
        const c = fs.readFileSync(full, 'utf8');
        anyCount  += (c.match(/:\s*any\b/g) || []).length;
        if (c.includes('prisma.$transaction')) txCount++;
        if (c.includes('error.message') && !c.includes('|| \'')) errLeak++;
        if ((c.includes('parseFloat') || c.includes('parseInt')) && 
            !c.includes('Math.abs') && !c.includes('> 0') && !c.includes('positive')) negCheck++;
    }
}
scan(apiDir);

console.log('=== تقرير جودة الكود ===');
console.log('الملفات المفحوصة:', totalFiles);
console.log(':any usage count:', anyCount);
console.log('ملفات تستخدم transactions:', txCount);
console.log('ملفات تكشف error.message:', errLeak);
console.log('ملفات بدون فحص القيم السالبة:', negCheck);
