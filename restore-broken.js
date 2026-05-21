const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('src/app/(dashboard)');
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    if (content.includes('-(--)')) {
        console.log('Restoring ' + f);
        execSync(`git checkout 49424b1f -- "${f}"`);
    }
});
