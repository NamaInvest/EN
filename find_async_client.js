const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

const targetDirs = ['src/app', 'src/components'];
let issues = [];

targetDirs.forEach(dir => {
    if(!fs.existsSync(dir)) return;
    walkDir(dir, (filepath) => {
        if (!filepath.endsWith('.tsx') && !filepath.endsWith('.ts')) return;
        let content = fs.readFileSync(filepath, 'utf8');
        
        // Find async function that contains useTranslation
        if(content.includes('async function') && content.includes('useTranslation()')) {
            issues.push(filepath);
        }
    });
});

console.log('Found async components using client hook:');
console.log(issues);
