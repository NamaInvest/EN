const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.ts*');
for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    if (text.includes('الحدود') || text.includes('الاقامة') || text.includes('الجواز') || text.includes('iqama') || text.includes('Iqama') || text.includes('border') || text.includes('nationality')) {
        console.log(`Found in: ${file}`);
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('الحدود') || lines[i].includes('الاقامة') || lines[i].includes('الجواز') || lines[i].includes('iqama') || lines[i].includes('Iqama')) {
                console.log(`  Line ${i + 1}: ${lines[i].trim()}`);
            }
        }
    }
}
