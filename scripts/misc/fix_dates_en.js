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
    
    // Change any 'ar-SA' or empty toLocaleDateString back to 'en-GB' to force English numerals 1, 2, 3
    // But preserve the dd/mm/yyyy format that Saudi/UK uses.
    let newContent = content.replace(/\.toLocaleDateString\('ar-SA'\)/g, ".toLocaleDateString('en-GB')");
    newContent = newContent.replace(/\.toLocaleTimeString\('ar-SA'/g, ".toLocaleTimeString('en-GB'");
    newContent = newContent.replace(/\.toLocaleString\('ar-SA'/g, ".toLocaleString('en-GB'");
    
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        modifiedFiles++;
    }
});

console.log(`Reverted dates to en-GB (English numerals) in ${modifiedFiles} files.`);
