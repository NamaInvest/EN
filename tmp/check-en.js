const fs = require('fs');
const path = require('path');
function walk(dir) {
  let res = [];
  const list = fs.readdirSync(dir);
  for (let file of list) {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) res = res.concat(walk(file));
    else if (file.endsWith('.tsx')) res.push(file);
  }
  return res;
}
const files = walk('src/app/(dashboard)');
let count = 0;
const englishRegex = /[a-zA-Z]/;
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  // very rough check for raw english text not inside tags
  const matches = content.match(/>([^<]+)</g);
  if (matches) {
     let hasEnglish = false;
     for (const m of matches) {
        if (/[a-zA-Z]/.test(m) && !m.includes('{')) {
           hasEnglish = true;
           break;
        }
     }
     if (hasEnglish) count++;
  }
}
console.log('Files with hardcoded English text in JSX:', count);
