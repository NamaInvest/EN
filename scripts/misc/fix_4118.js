const fs = require('fs');

let content = fs.readFileSync('src/lib/translations.ts', 'utf8');

// Fix sys.str_4118 spanning across multiple lines
content = content.replace(/"sys\.str_4118": "يقوم هذا المحرك بربط الحوالات البنكية الواردة بفواتير المبيعات آلياً\.(?:\r?\n|.)*?لن تحتاج بعد اليوم لمراجعة الكشوفات يدوياً للبحث عن صاحب الحوالة\.",/g, '"sys.str_4118": `يقوم هذا المحرك بربط الحوالات البنكية الواردة بفواتير المبيعات آلياً. لن تحتاج بعد اليوم لمراجعة الكشوفات يدوياً للبحث عن صاحب الحوالة.`,');

fs.writeFileSync('src/lib/translations.ts', content, 'utf8');
console.log('✅ تم تصحيح السطر المكسور المتبقي!');

const { exec } = require('child_process');
console.log('⏳ جاري رفع التحديث الأخير وتفعيل النواة...');
const child = exec('node deploy5.js');
child.stdout.on('data', data => process.stdout.write(data.toString()));
child.stderr.on('data', data => process.stderr.write(data.toString()));
