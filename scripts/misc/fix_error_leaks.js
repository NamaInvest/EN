/**
 * fix_error_leaks.js
 * يُصلح تلقائياً كل ملفات API التي تُسرّب error.message للمستخدم
 * ويُضيف import { apiError } من @/lib/api-error
 */
const fs   = require('fs');
const path = require('path');

const apiDir = 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api';
let fixed = 0, skipped = 0;

// أنماط تركيب error.message في الـ response (بدون || ، يعني مكشوف مباشرة)
// مثال: return NextResponse.json({ error: error.message }, { status: 500 });
const LEAK_PATTERN = /return NextResponse\.json\(\s*\{\s*error:\s*error\.message\s*\}\s*,\s*\{\s*status:\s*500\s*\}\s*\)/g;

// مثال مع نص قبله
const LEAK_PATTERN2 = /return NextResponse\.json\(\s*\{\s*error:\s*error\.message\s*\}\s*,\s*\{\s*status:\s*500\s*\}\s*\)/g;

function scanDir(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) { scanDir(full); continue; }
        if (!e.name.endsWith('.ts')) continue;
        fixFile(full);
    }
}

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (!content.includes('error.message')) { skipped++; return; }
    
    const rel = filePath.replace('c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\', '');
    const context = rel.replace(/\\/g, '/').replace('/route.ts', '');
    
    let changed = false;

    // ── 1. استبدل: return NextResponse.json({ error: error.message }, { status: 500 }) ──
    const before = content;
    content = content.replace(
        /return NextResponse\.json\(\s*\{\s*error:\s*error\.message\s*\}\s*,\s*\{\s*status:\s*500\s*\}\s*\)/g,
        `return apiError(error, 'حدث خطأ في المعالجة', { context: '${context}' })`
    );

    // ── 2. استبدل: return NextResponse.json({ error: error.message || '...' }, { status: 500 }) ──
    content = content.replace(
        /return NextResponse\.json\(\s*\{\s*error:\s*error\.message\s*\|\|\s*'([^']*)'\s*\}\s*,\s*\{\s*status:\s*500\s*\}\s*\)/g,
        (_, fallback) => `return apiError(error, '${fallback}', { context: '${context}' })`
    );

    // ── 3. استبدل: NextResponse.json({ error: error.message, ... }, { status: 500 }) ──
    content = content.replace(
        /return NextResponse\.json\(\s*\{\s*error:\s*error\.message\s*,\s*([^}]+)\}\s*,\s*\{\s*status:\s*500\s*\}\s*\)/g,
        `return apiError(error, 'حدث خطأ في المعالجة', { context: '${context}' })`
    );

    if (content === before) { skipped++; return; }

    // ── 4. أضف import إذا لم يكن موجوداً ──
    if (!content.includes("from '@/lib/api-error'") && !content.includes('from "@/lib/api-error"')) {
        // بعد آخر import
        const importEnd = content.lastIndexOf('\nimport ');
        if (importEnd >= 0) {
            const nextLine = content.indexOf('\n', importEnd + 1);
            content = content.slice(0, nextLine + 1)
                + "import { apiError } from '@/lib/api-error';\n"
                + content.slice(nextLine + 1);
        }
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${rel}`);
    fixed++;
    changed = true;
}

scanDir(apiDir);
console.log(`\n📊 تم إصلاح: ${fixed} ملف | تجاهُل: ${skipped} ملف`);
