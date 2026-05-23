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
const words = {};
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.match(/>([^<]+)</g);
  if (matches) {
     for (const m of matches) {
        const text = m.replace(/[><]/g, '').trim();
        if (/[a-zA-Z]/.test(text) && !text.includes('{') && text.length > 2) {
           words[text] = (words[text] || 0) + 1;
        }
     }
  }
}
const sorted = Object.entries(words).sort((a,b) => b[1] - a[1]).slice(0, 100);
console.log(sorted);
