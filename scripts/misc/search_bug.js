const fs = require('fs');
const path = require('path');

function search(dir) {
    fs.readdirSync(dir).forEach(file => {
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory()) {
            search(p);
        } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
            const code = fs.readFileSync(p, 'utf8');
            if (code.includes('theme-light')) {
                console.log('FOUND IN', p);
            }
        }
    });
}
search('src');
