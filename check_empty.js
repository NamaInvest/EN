const fs = require('fs');
const text = fs.readFileSync('src/locales/ar.json', 'utf8');
const lines = text.split('\n');
for(let i=0; i<lines.length; i++) {
    if(lines[i].includes('4390') || lines[i].includes('4391') || lines[i].includes('4400')) {
        console.log(`Line ${i+1}: ${lines[i]}`);
    }
}
