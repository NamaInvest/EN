const fs = require('fs');
const path = require('path');

const dir = 'src/app/(dashboard)';
const folders = fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isDirectory());

const results = [];

for (const folder of folders) {
    const pagePath = path.join(dir, folder, 'page.tsx');
    if (fs.existsSync(pagePath)) {
        const content = fs.readFileSync(pagePath, 'utf8');
        const size = Buffer.byteLength(content, 'utf8');
        
        let status = 'OK';
        if (size < 500) status = 'EMPTY_SHELL';
        if (content.includes('قريباً') || content.includes('Coming soon') || content.includes('تحت الإنشاء')) {
            status = 'PLACEHOLDER';
        }
        
        results.push({ folder, size, status });
    } else {
        results.push({ folder, size: 0, status: 'MISSING_PAGE' });
    }
}

results.sort((a, b) => a.size - b.size);
console.table(results);
