const fs = require('fs');
let content = fs.readFileSync('src/app/design1/page.tsx', 'utf8');

content = content.replace(/نظام نماء للاستثمار/g, 'نظام نما إنفست');
content = content.replace(/© 2024 نماء للاستثمار/g, '© 2024 نما إنفست');

fs.writeFileSync('src/app/design1/page.tsx', content);
console.log('Text replaced.');
