const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let englishPages = [];

walkDir('src/app/(dashboard)', function(filePath) {
    if (filePath.endsWith('page.tsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        // Check if the page contains English H1 and some generic button like +...
        if (content.match(/<h1[^>]*>.*?[a-zA-Z].*?<\/h1>/) && content.match(/<button[^>]*>[\s\S]*?\+[\s\S]*?<\/button>/)) {
            englishPages.push(filePath);
        }
    }
});

console.log('Found ' + englishPages.length + ' English placeholder pages:');
englishPages.forEach(p => console.log(p));
