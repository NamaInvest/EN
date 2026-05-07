const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'src'));

let fixedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // This regex matches `.findMany({` optionally followed by whitespace, then captures the rest until the next line or bracket.
    // It's a bit tricky. A safer way is to replace `.findMany({` with `.findMany({ take: 100,` 
    // BUT only if `take:` is not already in that specific findMany block.
    // Because parsing AST is hard in pure JS, we can use a simpler heuristic:
    // Split by `.findMany({`, check if the segment before the next `})` contains `take:`.
    
    const parts = content.split('.findMany({');
    if (parts.length > 1) {
        for (let i = 1; i < parts.length; i++) {
            const segment = parts[i];
            const endMatch = segment.indexOf('});');
            const endMatch2 = segment.indexOf('})');
            const endIndex = endMatch !== -1 ? endMatch : (endMatch2 !== -1 ? endMatch2 : 1000);
            
            const insideQuery = segment.substring(0, endIndex);
            if (!insideQuery.includes('take:')) {
                // Prepend take: 100
                parts[i] = '\n            take: 100,' + segment;
                changed = true;
                fixedCount++;
            }
        }
    }

    if (changed) {
        fs.writeFileSync(file, parts.join('.findMany({'), 'utf8');
    }
}

console.log(`Injected take: 100 into ${fixedCount} findMany queries to prevent OOM.`);
