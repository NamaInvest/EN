const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/lib/featuresList.json', 'utf8'));

const labels = new Set();
const modules = new Set();

data.forEach(item => {
    // Check if it has non-standard ascii/arabic mix which is characteristic of mojibake
    // specifically we look for these common corrupted sequences: ظ, ط, ً, â, ں
    if (/ظ|â|ً|ں|ط¬|ط§|ط±|طھ|ط؛|ظٹ|ط±|ط·|ط¨/.test(item.label) && !/تعديل|حذف|حفظ|طباعة|فتح|تفاعل|إغلاق|تحميل/.test(item.label.split('(')[0])) {
         labels.add(item.label);
    }
    if (/ظ|â|ً|ں|ط¬|ط§|ط±|طھ|ط؛|ظٹ|ط±|ط·|ط¨/.test(item.module) && !/التحكم|البشرية|المخزون|التسويق|المطاعم|المبيعات|التصنيع|عام|الإعدادات/.test(item.module)) {
         modules.add(item.module);
    }
});

console.log("Garbled Modules:");
Array.from(modules).forEach(m => console.log(m));

console.log("\nGarbled Labels:");
Array.from(labels).forEach(l => console.log(l));
