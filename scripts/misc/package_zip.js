const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

const zip = new JSZip();

function addDirToZip(baseDir, currentPath) {
    const fullPath = path.join(baseDir, currentPath);
    const files = fs.readdirSync(fullPath);

    for (const file of files) {
        if (file === 'node_modules' || file === '.next' || file === '.git' || file === '.gemini') continue;

        const p = path.join(fullPath, file);
        const stat = fs.statSync(p);
        
        const relPath = path.join(currentPath, file);
        const zipPath = path.posix.join(...relPath.split(path.sep));

        if (stat.isDirectory()) {
            addDirToZip(baseDir, relPath);
        } else {
            zip.file(zipPath, fs.readFileSync(p));
        }
    }
}

console.log('Packaging src folder...');
addDirToZip(__dirname, 'src');
console.log('Packaging prisma folder...');
addDirToZip(__dirname, 'prisma');
console.log('Packaging public folder...');
addDirToZip(__dirname, 'public');

zip.file('package.json', fs.readFileSync(path.join(__dirname, 'package.json')));
zip.file('tsconfig.json', fs.readFileSync(path.join(__dirname, 'tsconfig.json')));
if (fs.existsSync(path.join(__dirname, 'next.config.ts'))) zip.file('next.config.ts', fs.readFileSync(path.join(__dirname, 'next.config.ts')));
if (fs.existsSync(path.join(__dirname, 'postcss.config.mjs'))) zip.file('postcss.config.mjs', fs.readFileSync(path.join(__dirname, 'postcss.config.mjs')));

console.log('Generating ZIP...');
zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }).then((content) => {
    fs.writeFileSync('src.zip', content);
    console.log('src.zip created successfully.');
});
