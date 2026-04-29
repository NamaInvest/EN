const fs = require('fs');
const path = require('path');

console.log('🔄 جاري إصلاح أخطاء البناء البرمجية...');

const filesToFix = [
    'src/app/pos/page.tsx',
    'src/app/restaurant-pos/page.tsx',
    'src/app/(dashboard)/sales/page.tsx'
];

filesToFix.forEach(relPath => {
    const fullPath = path.join(__dirname, relPath);
    if (!fs.existsSync(fullPath)) return;
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix the broken use effect return statement
    content = content.replace(/return\s*\(\s*<>\s*<PosReturnsModal isOpen=\{showReturnsModal\} onClose=\{\(\) => setShowReturnsModal\(false\)\} \/>\s*\)\s*=>/g, 'return () =>');
    
    // Also remove any remaining PosReturnsModal that might have been incorrectly inserted
    content = content.replace(/<PosReturnsModal isOpen=\{showReturnsModal\} onClose=\{\(\) => setShowReturnsModal\(false\)\} \/>/g, '');

    // Properly insert ONE PosReturnsModal before the final closing </div>
    const modalComponent = '<PosReturnsModal isOpen={showReturnsModal} onClose={() => setShowReturnsModal(false)} />';
    
    // Find the last </div> in the file since that's enclosing the React component's return
    const lastDivMatch = content.lastIndexOf('</div>');
    if (lastDivMatch !== -1) {
        content = content.slice(0, lastDivMatch) + '    ' + modalComponent + '\n        ' + content.slice(lastDivMatch);
    } else {
        // Fallback: append before the last brace or parenthesis just in case
        content += '\n' + modalComponent + '\n';
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ تم إصلاح ${relPath}`);
});

const transPath = path.join(__dirname, 'src', 'lib', 'translations.ts');
if (fs.existsSync(transPath)) {
    let content = fs.readFileSync(transPath, 'utf8');
    content = content.replace(/"sys.str_4113"\s*:\s*"<html>([^"]*)<body style="margin:0;">",/g, '"sys.str_4113": "<html>$1<body style=\\"margin:0;\\">",');
    fs.writeFileSync(transPath, content, 'utf8');
    console.log(`✅ تم إصلاح src/lib/translations.ts`);
}

console.log('🛠️ جاري التحقق من عملية البناء محلياً...');
const { exec } = require('child_process');
exec('npx prisma generate && npx next build', (err, stdout, stderr) => {
    if (err) {
        console.error('❌ لا يزال هناك خطأ في البناء:', stderr);
    } else {
        console.log('🌟 نجح البناء! يمكنك الآن تشغيل: node deploy_n11.js لرفع التعديلات للسيرفر.');
    }
});
