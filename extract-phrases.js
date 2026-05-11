const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'app');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function(file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });
    return arrayOfFiles;
}

const files = getAllFiles(dir);
const uniquePhrases = new Set();

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    // Match _t('Something', 'Something') or _t("Something", "Something")
    // or even _t(`Something`, `Something`)
    const regex = /_t\(\s*(['"`])(.*?)\1\s*,\s*(['"`])(.*?)\3\s*\)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        const arg1 = match[2];
        const arg2 = match[4];
        if (arg1 === arg2 && arg1.match(/[a-zA-Z]/)) {
            uniquePhrases.add(arg1);
        }
    }
});

fs.writeFileSync('unique_phrases.json', JSON.stringify(Array.from(uniquePhrases), null, 2));
console.log(`Found ${uniquePhrases.size} unique phrases to translate.`);
