const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/app/(dashboard)/affiliates/page.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/ًں’¸/g, '💸');
content = content.replace(/ًں–±ï¸ڈ/g, '🖱️');
content = content.replace(/ًںڈھ/g, '🏪');
content = content.replace(/ًں’°/g, '💰');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed emojis in affiliates page');
