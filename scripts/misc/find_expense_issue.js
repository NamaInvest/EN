const fs = require('fs');
const path = require('path');

// Search specifically in expenses page
const expPath = 'src/app/(dashboard)/expenses/page.tsx';
if (!fs.existsSync(expPath)) {
    console.log('expenses page does not exist!');
} else {
    const code = fs.readFileSync(expPath, 'utf8');
    const lines = code.split('\n');
    lines.forEach((l, i) => {
        if (l.includes('t(') && i < 30) console.log(i, l);
    });
}

// Also scan all pages for top-level t()
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
pages.forEach(p => {
    const code = fs.readFileSync(p, 'utf8');
    // Check if there is any t( usage before the first 'function' keyword
    const firstFunc = code.indexOf('function');
    const firstT = code.indexOf('t(');
    if (firstT !== -1 && firstT < firstFunc) {
        console.log('POTENTIAL ISSUE:', p, '- t() at char', firstT, '< function at char', firstFunc);
        console.log('  Context:', code.substring(Math.max(0,firstT-30), firstT+50));
        console.log();
    }
});
