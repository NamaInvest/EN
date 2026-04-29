const fs = require('fs');
const lines = fs.readFileSync('src/lib/translations.ts', 'utf8').split('\n');
for (let i = 3645; i >= 0; i--) { 
    const trim = lines[i].trim();
    if (!trim.startsWith('"sys') && trim.length > 0) { 
        console.log(`Line ${i}: ${trim}`); 
        if (trim.includes(': {') || trim.includes(':{') || trim.includes('"ar"') || trim.includes('"en"')) break;
    } 
}
