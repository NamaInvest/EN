const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🔄 جاري تحضير ملفات الربط الجديدة وتنظيف الترجمة...');

// 1. Clean translations.ts from stray commas
const transPath = path.join(__dirname, 'src', 'lib', 'translations.ts');
if (fs.existsSync(transPath)) {
    let content = fs.readFileSync(transPath, 'utf8');
    // Remove lines that only contain a comma (and optional spaces)
    const fixedContent = content.replace(/^\s*,\s*$/gm, '');
    if (content !== fixedContent) {
        fs.writeFileSync(transPath, fixedContent, 'utf8');
        console.log('✅ تم تنظيف الفواصل الزائدة من ملف الترجمة لجميع اللغات.');
    }
}

// 2. Update deploy_n11.js to include missing components
const deployPath = path.join(__dirname, 'deploy_n11.js');
if (fs.existsSync(deployPath)) {
    let deployContent = fs.readFileSync(deployPath, 'utf8');
    
    const missingFile1 = "'src/hooks/useMadaTerminal.ts'";
    const missingFile2 = "'src/components/PosReturnsModal.tsx'";
    
    if (!deployContent.includes(missingFile1)) {
        deployContent = deployContent.replace(
            /(filesToUpload\s*=\s*\[[^\]]+)/,
            `$1,\n    ${missingFile1},\n    ${missingFile2}`
        );
        fs.writeFileSync(deployPath, deployContent, 'utf8');
        console.log('✅ تم تحديث أداة الرفع لتشمل حزمة المرتجعات ومدى الجديدة.');
    }
}

// 3. Chain execution locally first to definitely confirm
console.log('🛠️ جاري إطلاق البناء الشامل الأخير...');
exec('npx next build', (err, stdout, stderr) => {
    if (err) {
        console.error('❌ لا يزال هناك خطأ في البناء:', stderr);
    } else {
        console.log('🌟 التأكيد الأخير: تم البناء 100%...');
        console.log('🚀 جاري الرفع للسيرفر السحابي تلقائياً...');
        const child = exec('node deploy_n11.js');
        child.stdout.on('data', data => process.stdout.write(data));
        child.stderr.on('data', data => process.stderr.write(data));
    }
});
