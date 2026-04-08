const fs = require('fs');
const path = require('path');

function walkSync(dir, results = []) {
    for (const file of fs.readdirSync(dir)) {
        const p = path.join(dir, file);
        const stat = fs.statSync(p);
        if (stat.isDirectory()) walkSync(p, results);
        else if (p.endsWith('page.tsx')) results.push(p);
    }
    return results;
}

const pages = walkSync('src/app');
const bad = [];

pages.forEach(p => {
    const code = fs.readFileSync(p, 'utf8');
    const lines = code.split('\n');
    
    let insideFunc = false;
    let braceDepth = 0;
    
    lines.forEach((line, i) => {
        if (!insideFunc) {
            if (line.match(/^export default function|^function /) ) {
                insideFunc = true;
                braceDepth = 0;
            }
            // Check for t() outside function
            if (line.includes("t('") && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
                bad.push({file: p, line: i+1, content: line.trim()});
            }
        }
    });
});

if (bad.length === 0) {
    console.log('ALL CLEAR - No top-level t() calls found!');
} else {
    bad.forEach(b => console.log(`FIX NEEDED: ${b.file}:${b.line}\n  => ${b.content}\n`));
}
