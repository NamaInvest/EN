const fs = require('fs');
const content = fs.readFileSync('src/lib/translations.ts', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
    if (line.includes('sys.str_4390')) {
        console.log(`Line ${i + 1}: ${line}`);
    }
});
