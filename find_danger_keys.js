const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/lib/featuresList.json', 'utf8'));

const keywords = ["الخطر", "فرمتة", "تصفير", "المخزون", "حذف كل المنتجات", "حذف كل التصنيفات"];

const matches = data.filter(item => {
    return keywords.some(kw => item.label.includes(kw) || item.module.includes(kw) || item.key.includes("zero") || item.key.includes("reset"));
});

console.log(JSON.stringify(matches, null, 2));
