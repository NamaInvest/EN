const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.next')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.json')) {
                const content = fs.readFileSync(file, 'utf8');
                if (content.includes('\u0638\u02C6\u0637') || content.includes('\u0637\u0627\u0638\u201e')) {
                    results.push(file);
                }
            }
        }
    });
    return results;
}

console.log(walk('src'));
