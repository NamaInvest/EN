const fs = require('fs');
const path = require('path');

function walkSync(dir, r = []) {
    for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f);
        const s = fs.statSync(p);
        if (s.isDirectory()) walkSync(p, r);
        else if (p.endsWith('page.tsx')) r.push(p);
    }
    return r;
}

const pages = walkSync('src/app');
const bad = [];

pages.forEach(p => {
    const code = fs.readFileSync(p, 'utf8');
    const lines = code.split('\n');
    
    // Find first function/component start
    let funcLine = lines.findIndex(l => l.match(/^export default function|^function [A-Z]/));
    if (funcLine < 0) funcLine = lines.length;
    
    for (let i = 0; i < funcLine; i++) {
        const l = lines[i];
        if (l.includes("t('") && !l.trim().startsWith('//') && !l.trim().startsWith('*')) {
            bad.push(`${p}:${i + 1}`);
        }
    }
});

bad.forEach(b => console.log(b));
if (bad.length === 0) console.log('ALL CLEAR!');
