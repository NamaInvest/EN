const fs = require('fs');
const path = require('path');

function searchFiles(dir, keyword) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        if (file === 'node_modules' || file === '.next' || file === '.git') continue;
        
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            searchFiles(fullPath, keyword);
        } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js'))) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes(keyword)) {
                console.log(`FOUND in ${fullPath}`);
                const lines = content.split('\n');
                lines.forEach((line, i) => {
                    if (line.includes(keyword)) {
                        console.log(`Line ${i + 1}: ${line.trim()}`);
                    }
                });
                console.log('---');
            }
        }
    }
}

console.log('--- SEARCHING FOR REDIRECTS ---');
searchFiles(path.join(__dirname, 'src'), 'redirect(');
