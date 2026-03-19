const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('gemini-2.5-flash')) {
                console.log('Fixing:', fullPath);
                content = content.replace(/gemini-2\.5-flash/g, 'gemini-1.5-flash');
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

processDir('d:/namasoft9-3-main/src');
console.log('Done!');
