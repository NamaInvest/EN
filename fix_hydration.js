const fs = require('fs');
const f = 'd:\\namasoft9-3-main\\src\\app\\layout.tsx';
let c = fs.readFileSync(f, 'utf8');
if (c.includes('suppressHydrationWarning')) {
    console.log('⚠️ suppressHydrationWarning موجود مسبقاً');
} else {
    c = c.replace(/(<html[^>]*lang="ar"[^>]*dir="rtl"[^>]*)>/, '$1 suppressHydrationWarning>');
    fs.writeFileSync(f, c, 'utf8');
    console.log('✅ تم إضافة suppressHydrationWarning');
}
