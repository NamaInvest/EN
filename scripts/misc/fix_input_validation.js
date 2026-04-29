/**
 * fix_input_validation.js
 * يُضيف التحقق من القيم المالية في المسارات الحرجة
 * يُصلح: amount, quantity, price — لا تقبل سالب أو NaN
 */
const fs   = require('fs');
const path = require('path');

// ── المسارات الحرجة التي نريد تأمينها ──
const TARGETS = [
    // مالية مباشرة
    'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\expenses\\route.ts',
    'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\treasury\\route.ts',
    'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\sales\\route.ts',
    'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\purchases\\route.ts',
    'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\purchase-returns\\route.ts',
    'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\sales-returns\\route.ts',
    'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\price-quotes\\route.ts',
    'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\banks\\[id]\\transactions\\route.ts',
    'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\salaries\\route.ts',
    'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\assets\\route.ts',
    'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\fixed-assets\\route.ts',
];

let fixed = 0;

for (const filePath of TARGETS) {
    if (!fs.existsSync(filePath)) { console.log(`⏭  لا يوجد: ${path.basename(path.dirname(filePath))}/${path.basename(filePath)}`); continue; }

    let content = fs.readFileSync(filePath, 'utf8');

    // تجاهل الملفات التي لديها التحقق مسبقاً
    if (content.includes('validateAmount') || content.includes('isNaN') || content.includes('< 0')) {
        // إضافة فحص < 0 إن لم يكن موجوداً فعلاً
        const hasNegCheck = content.includes('< 0') || content.includes('<= 0') || content.includes('validateAmount');
        if (hasNegCheck) {
            console.log(`⏭  محمي مسبقاً: ${path.basename(path.dirname(filePath))}/route.ts`);
            continue;
        }
    }

    const original = content;

    // ── أضف import من api-error ──
    if (!content.includes("from '@/lib/api-error'")) {
        const lastImport = content.lastIndexOf('\nimport ');
        const nextLine   = content.indexOf('\n', lastImport + 1);
        if (nextLine >= 0) {
            content = content.slice(0, nextLine + 1)
                + "import { apiError, validateAmount, requireFields } from '@/lib/api-error';\n"
                + content.slice(nextLine + 1);
        }
    } else if (!content.includes('validateAmount')) {
        // أضف validateAmount للـ import الموجود
        content = content.replace(
            "import { apiError } from '@/lib/api-error';",
            "import { apiError, validateAmount, requireFields } from '@/lib/api-error';"
        );
    }

    // ── أضف التحقق بعد const body = await request.json(); ──
    // نبحث عن POST handlers
    const postPattern = /export async function POST[^{]*\{[\s\S]*?const body = await request\.json\(\);/;
    const postMatch = postPattern.exec(content);

    if (postMatch) {
        const insertPos = postMatch.index + postMatch[0].length;

        // تحديد الحقول المالية بناءً على محتوى الملف
        let validation = '\n\n        // ── التحقق من صحة المدخلات المالية ──\n';

        if (content.includes('body.amount')) {
            validation += `        if (body.amount !== undefined) {
            const amount = parseFloat(String(body.amount));
            if (isNaN(amount) || amount < 0) return NextResponse.json({ error: 'المبلغ يجب أن يكون رقماً موجباً' }, { status: 400 });
            body.amount = amount;
        }\n`;
        }

        if (content.includes('body.quantity')) {
            validation += `        if (body.quantity !== undefined) {
            const qty = parseFloat(String(body.quantity));
            if (isNaN(qty) || qty < 0) return NextResponse.json({ error: 'الكمية يجب أن تكون رقماً موجباً' }, { status: 400 });
            body.quantity = qty;
        }\n`;
        }

        if (content.includes('body.price') || content.includes('body.sellPrice') || content.includes('body.unitPrice')) {
            validation += `        if (body.price !== undefined) {
            const price = parseFloat(String(body.price));
            if (isNaN(price) || price < 0) return NextResponse.json({ error: 'السعر يجب أن يكون رقماً موجباً' }, { status: 400 });
            body.price = price;
        }\n`;
        }

        // أضف التحقق فقط إذا فيه شيء لنتحقق منه
        if (validation.includes('body.amount') || validation.includes('body.quantity') || validation.includes('body.price')) {
            content = content.slice(0, insertPos) + validation + content.slice(insertPos);
        }
    }

    if (content === original) { console.log(`⏭  لا تغيير: ${path.basename(path.dirname(filePath))}/route.ts`); continue; }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ محمي: ${path.basename(path.dirname(filePath))}/route.ts`);
    fixed++;
}

console.log(`\n📊 تم تأمين: ${fixed} مسار مالي`);
