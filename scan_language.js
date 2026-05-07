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

const targetDirs = ['src/app/(dashboard)', 'src/components'];
let allFiles = [];
targetDirs.forEach(d => {
    if(fs.existsSync(d)) allFiles = allFiles.concat(walk(d));
});

const report = [];

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check if file uses translation
    const hasTranslation = content.includes('useTranslation') || content.includes('t(');
    
    // Look for english text between tags
    const englishRegex = />\s*([A-Za-z][A-Za-z\s]{4,})\s*</g;
    let match;
    const matches = new Set();
    
    while ((match = englishRegex.exec(content)) !== null) {
        const text = match[1].trim();
        if(text.length > 3 && !text.includes('className') && !text.includes('flex')) {
            matches.add(text);
        }
    }

    // Also look for hardcoded titles like title="English"
    const titleRegex = /title="([A-Za-z][A-Za-z\s]{3,})"/g;
    while ((match = titleRegex.exec(content)) !== null) {
        matches.add(match[1].trim());
    }

    if (matches.size > 0 && !hasTranslation) {
        report.push({
            file: file.replace(/\\/g, '/').replace('src/app/(dashboard)/', ''),
            strings: Array.from(matches)
        });
    }
});

let md = '# 🌐 تقرير شامل للغة الإنجليزية الثابتة (Hardcoded English)\n\n';
md += '> هذا التقرير يوضح جميع الأقسام والصفحات التي تحتوي على نصوص باللغة الإنجليزية ولا تستخدم محرك الترجمة، مما يعني أنها ستظهر بالإنجليزية حتى لو كان النظام باللغة العربية.\n\n';

report.forEach(r => {
    md += `### 📄 \`${r.file}\`\n`;
    md += `- **النصوص الإنجليزية:** ${r.strings.slice(0, 5).join(', ')}${r.strings.length > 5 ? ' ...' : ''}\n\n`;
});

fs.writeFileSync('language_audit_report.md', md, 'utf8');
console.log(`Generated report with ${report.length} files.`);
