const fs = require('fs');
const path = require('path');

function upgrade(dir) {
    const files = fs.readdirSync(dir);
    let changed = false;
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (upgrade(fullPath)) changed = true;
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const original = content;
            content = content.replace(/gemini-1\.5-flash/g, 'gemini-2.0-flash');
            content = content.replace(/gemini-1\.5-pro/g, 'gemini-2.0-flash');
            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Upgraded:', fullPath);
                changed = true;
            }
        }
    }
    return changed;
}

upgrade('c:\\Users\\1\\Desktop\\alfa\\src\\app\\api');
