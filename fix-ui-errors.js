const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('src/app/(dashboard)');
let fixedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Pattern 1: info(_t('ميزة تحت التطوير', 'Feature in development'))
    content = content.replace(/onClick=\{\s*\(\)\s*=>\s*info\(_t\('ميزة تحت التطوير',\s*'Feature in development'\)\)\s*\}/g, '');
    
    // Pattern 2: info(_t('قريباً', 'Coming Soon'))
    content = content.replace(/onClick=\{\s*\(\)\s*=>\s*info\(_t\('قريباً',\s*'Coming Soon'\)\)\s*\}/g, '');
    
    // Pattern 3: general info(_t(...))
    content = content.replace(/onClick=\{\s*\(\)\s*=>\s*info\(_t\([^)]+\)\)\s*\}/g, '');
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        fixedCount++;
        console.log('Fixed', file);
    }
});

console.log('Total files fixed:', fixedCount);
