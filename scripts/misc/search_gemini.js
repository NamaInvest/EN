const fs = require('fs');
const path = require('path');

function search(dir, query) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            search(fullPath, query);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.toLowerCase().includes(query.toLowerCase())) {
                console.log(`Found in: ${fullPath}`);
            }
        }
    }
}

search('c:\\Users\\1\\Desktop\\alfa\\src\\app\\api', 'gemini');
