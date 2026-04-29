const fs = require('fs');
const path = require('path');

function walkSync(dir, results = []) {
    for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f);
        if (p.includes('node_modules') || p.includes('.next')) continue;
        const s = fs.statSync(p);
        if (s.isDirectory()) walkSync(p, results);
        else if (p.endsWith('.js') || p.endsWith('.ts') || p.endsWith('.tsx')) results.push(p);
    }
    return results;
}

const files = walkSync('src');
const keys = new Set();
files.forEach(f => {
    const code = fs.readFileSync(f, 'utf8');
    const m = [...code.matchAll(/t\(['"]([^'"]+)['"]\)/g)];
    m.forEach(match => {
        if (!match[1].startsWith('sys.str_') && !match[1].startsWith('stock.str_')) {
            keys.add(match[1]);
        }
    });
});

const keyArray = Array.from(keys).sort();
console.log(`Found ${keyArray.length} non-sys keys`);
fs.writeFileSync('dot_keys.json', JSON.stringify(keyArray, null, 2));
