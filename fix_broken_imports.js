/**
 * fix_broken_imports.js
 * يصلح الـ imports المكسورة التي أُضيفت بشكل خاطئ داخل import {} متعدد الأسطر
 */
const fs   = require('fs');
const path = require('path');

const dashDir = 'd:\\namasoft9-3-main\\src\\app\\(dashboard)';
let fixed = 0;

function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) scanDir(full);
        else if (e.name === 'page.tsx') fixFile(full);
    }
}

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // كشف المشكلة: import { useToast وسط import آخر
    // النمط: import {\nimport { useToast from '@/components/Toast';\n    SomeComponent...
    const badPattern = /^(import\s*\{[^}]*?)\nimport \{ useToast \} from '@\/components\/Toast';\n/gm;
    
    if (!badPattern.test(content)) return;
    
    const pageName = filePath.split(path.sep).slice(-3).join('/');
    
    // أعد قراءة (test يحرك الـ pointer)
    content = fs.readFileSync(filePath, 'utf8');
    
    // 1. احذف الـ import المدموج الخاطئ
    content = content.replace(/^(import\s*\{[^}]*?)\nimport \{ useToast \} from '@\/components\/Toast';\n/gm, '$1\n');
    
    // 2. تأكد أن useToast import موجود بشكل صحيح بعد كل الـ imports
    if (!content.includes("from '@/components/Toast'")) {
        // أضفه بعد آخر import statement كامل
        const lines = content.split('\n');
        let lastImportLine = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import ') && !lines[i].includes('{')) lastImportLine = i;
            if (lines[i].includes("from '") || lines[i].includes('from "')) lastImportLine = i;
        }
        if (lastImportLine >= 0) {
            lines.splice(lastImportLine + 1, 0, "import { useToast } from '@/components/Toast';");
            content = lines.join('\n');
        }
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${pageName}`);
    fixed++;
}

scanDir(dashDir);
console.log(`\n📊 تم إصلاح: ${fixed} ملف`);
