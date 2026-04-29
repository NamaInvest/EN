const fs = require('fs');
const path = require('path');

function walkSync(dir, results = []) {
    for (const file of fs.readdirSync(dir)) {
        const p = path.join(dir, file);
        const stat = fs.statSync(p);
        if (stat.isDirectory()) walkSync(p, results);
        else if (p.endsWith('.tsx') || p.endsWith('.ts')) results.push(p);
    }
    return results;
}

const files = walkSync('src');
const bad = [];

files.forEach(f => {
    const code = fs.readFileSync(f, 'utf8');
    
    // Look for t() used before or in module scope (outside functions)
    // Pattern: t( appears before 'export default function' or before any 'function'
    const lines = code.split('\n');
    let inFunction = 0;
    let hasTopLevelT = false;
    
    lines.forEach((line, i) => {
        const opens = (line.match(/\{/g) || []).length;
        const closes = (line.match(/\}/g) || []).length;
        
        if (line.match(/^export default function|^function |^const .* = \(\) =>/)) inFunction++;
        if (inFunction < 1 && line.includes('t(') && !line.includes('//') && !line.trim().startsWith('//')) {
            hasTopLevelT = true;
            console.log(`TOP-LEVEL t() in: ${f}:${i+1} => ${line.trim()}`);
        }
    });
});

console.log('\nDone scanning. If no output above, no top-level t() found.');
