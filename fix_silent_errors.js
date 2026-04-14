/**
 * fix_silent_errors.js
 * يصلح الأخطاء الصامتة في كل صفحات الـ dashboard:
 * 1. يضيف import { useToast } from '@/components/Toast'
 * 2. يضيف const { error: toastError, success: toastSuccess } = useToast();
 * 3. يستبدل catch(e){console.error(e)} بـ catch(e){toastError(e.message || 'حدث خطأ')}
 * 4. يستبدل .catch(console.error) بـ .catch(e => toastError(e.message || 'حدث خطأ'))
 */

const fs   = require('fs');
const path = require('path');

const dashDir = 'd:\\namasoft9-3-main\\src\\app\\(dashboard)';
let fixed = 0, skipped = 0;

function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) scanDir(full);
        else if (e.name === 'page.tsx') fixPage(full);
    }
}

function fixPage(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // تجاهل الصفحات التي لا تستخدم fetch (لا تحتاج toast)
    if (!content.includes('fetch(')) { skipped++; return; }
    // تجاهل الصفحات التي ليس فيها console.error أو catch صامتة
    if (!content.includes('console.error') && !content.includes('.catch(console.error)')) { skipped++; return; }
    // تجاهل الصفحات التي معها toast مسبقاً
    if (content.includes('useToast')) { skipped++; return; }
    // تجاهل الصفحات غير الـ client components
    if (!content.includes("'use client'")) { skipped++; return; }

    const pageName = filePath.split(path.sep).slice(-2).join('/');

    // ── 1. أضف import useToast ──
    // بعد آخر import
    const lastImportIdx = content.lastIndexOf('\nimport ');
    const afterLastImport = content.indexOf('\n', lastImportIdx + 1);
    if (afterLastImport === -1) { skipped++; return; }

    content = content.slice(0, afterLastImport + 1)
        + "import { useToast } from '@/components/Toast';\n"
        + content.slice(afterLastImport + 1);

    // ── 2. أضف const { error, success } = useToast(); داخل الـ component ──
    // نبحث عن أول دالة export default function أو function مع useState
    const hookInsertPattern = /const\s+\{[^}]*\}\s*=\s*useTranslation\(\)|const\s+\[[^\]]+,\s*set[A-Z][^\]]*\]\s*=\s*useState/;
    const hookMatch = hookInsertPattern.exec(content);
    if (hookMatch) {
        const insertPos = content.indexOf('\n', hookMatch.index) + 1;
        // تحقق ما فيه بعدها مباشرة
        if (!content.slice(insertPos, insertPos + 60).includes('useToast')) {
            content = content.slice(0, insertPos)
                + "    const { error: toastError, success: toastSuccess } = useToast();\n"
                + content.slice(insertPos);
        }
    }

    // ── 3. استبدل .catch(console.error) ──
    content = content.replace(/\.catch\(\s*console\.error\s*\)/g, ".catch((e: any) => toastError(e?.message || 'حدث خطأ غير متوقع'))");

    // ── 4. استبدل catch(e) { console.error(e); } المفردة ──
    content = content.replace(
        /}\s*catch\s*\(\s*(\w+)\s*\)\s*\{\s*console\.error\(\s*\1\s*\);\s*\}/g,
        '} catch ($1: any) { toastError($1?.message || \'حدث خطأ\'); }'
    );

    // ── 5. استبدل catch(e) { console.error('...', e); } ──
    content = content.replace(
        /}\s*catch\s*\(\s*(\w+)\s*\)\s*\{\s*console\.error\([^)]+\);\s*\}/g,
        '} catch ($1: any) { toastError($1?.message || \'حدث خطأ\'); }'
    );

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${pageName}`);
    fixed++;
}

scanDir(dashDir);
console.log(`\n📊 تم إصلاح: ${fixed} صفحة | تم تجاهل: ${skipped} صفحة`);
