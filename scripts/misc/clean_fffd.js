const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            walkDir(file);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            let content = fs.readFileSync(file, 'utf8');
            if (content.includes('\uFFFD')) {
                content = content.replace(/\uFFFD/g, '');
                fs.writeFileSync(file, content, 'utf8');
                console.log('Cleaned U+FFFD from:', file);
            }
        }
    });
}

walkDir(path.join(__dirname, 'src'));
