const fs = require('fs');
const path = require('path');
function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}
const files = walk('src/app/(dashboard)');
let changedFiles = 0;
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    // Replace -[var(--border)] with -(--border)
    let newContent = content.replace(/-\[var\(--([a-zA-Z0-9-]+)\)\]/g, (match, p1) => {
        return '-(--' + p1 + ')';
    });

    if (content !== newContent) {
        fs.writeFileSync(f, newContent);
        console.log('Fixed', f);
        changedFiles++;
    }
});
console.log('Total files fixed:', changedFiles);
