const fs = require('fs');
const g = require('glob');
let c = [];
g.sync('src/{app,components}/**/*.tsx').forEach(f => {
    let text = fs.readFileSync(f, 'utf8');
    if(text.includes('useTranslation') && !text.includes('use client') && !text.includes('"use client"')) c.push(f);
});
console.log('Server components with hook:', c);
