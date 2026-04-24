const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            const content = fs.readFileSync(file, 'utf8');
            if (content.includes('\uFFFD')) {
                results.push(file);
            }
        }
    });
    return results;
}

const corruptedFiles = walkDir(path.join(__dirname, 'src'));
console.log('Files with U+FFFD:', corruptedFiles);
