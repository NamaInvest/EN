const fs = require('fs');
const path = require('path');

// Collect ALL t() calls from all tsx/ts files in src/
function walkSync(dir, results = []) {
    for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f);
        const s = fs.statSync(p);
        if (s.isDirectory()) walkSync(p, results);
        else if (p.endsWith('.tsx') || p.endsWith('.ts')) results.push(p);
    }
    return results;
}

const files = walkSync('src');
const usedKeys = new Set();

files.forEach(f => {
    const code = fs.readFileSync(f, 'utf8');
    const matches = [...code.matchAll(/t\('([^']+)'\)/g), ...code.matchAll(/t\("([^"]+)"\)/g)];
    matches.forEach(m => usedKeys.add(m[1]));
});

// Now load existing translations to find which are missing
const transCode = fs.readFileSync('src/lib/translations.ts', 'utf8');
const existingKeys = new Set();
const keyMatches = [...transCode.matchAll(/"([\w.]+)":/g)];
keyMatches.forEach(m => existingKeys.add(m[1]));

const missing = [...usedKeys].filter(k => !existingKeys.has(k)).sort();
console.log(`Total used: ${usedKeys.size}, Existing: ${existingKeys.size}, Missing: ${missing.length}`);
console.log('\nMissing keys:');
missing.forEach(k => console.log(`  "${k}"`));

// Write missing keys to a file for reference
fs.writeFileSync('missing_keys.txt', missing.join('\n'));
console.log('\nSaved to missing_keys.txt');
