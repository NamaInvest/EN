const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else if (dirPath.endsWith('.ts') || dirPath.endsWith('.tsx') || dirPath.endsWith('.js')) {
            callback(dirPath);
        }
    });
}

let modifiedFiles = 0;

walkDir(path.join(__dirname, 'src'), (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern to match .toLocaleDateString(...) and replace with .toLocaleDateString('ar-SA')
    // We want to avoid replacing if it's already 'ar-SA' exactly, but it's harmless to overwrite
    // Wait, what about .toLocaleDateString('en-GB')?
    const newContent = content.replace(/\.toLocaleDateString\s*\([^)]*\)/g, ".toLocaleDateString('ar-SA')");
    
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        modifiedFiles++;
    }
});

console.log(`Updated dates in ${modifiedFiles} files.`);
