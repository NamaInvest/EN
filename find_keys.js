const fs = require('fs');
const path = require('path');

function walk(dir, cb) {
    fs.readdirSync(dir).forEach(f => {
        let p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) walk(p, cb);
        else cb(p);
    });
}

let keys = new Set();
walk('src', (p) => {
    if (p.endsWith('.tsx') || p.endsWith('.ts')) {
        let c = fs.readFileSync(p, 'utf8');
        let m = c.match(/sys\.str_\d+/g);
        if (m) m.forEach(k => keys.add(k));
    }
});

let t = fs.readFileSync('src/lib/translations.ts', 'utf8');
let missing = [];
for (let k of keys) {
    if (!t.includes('"' + k + '":') && !t.includes("'" + k + "':")) {
        missing.push(k);
    }
}
console.log(missing.length, 'missing keys:', missing.join(', '));
