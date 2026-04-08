const fs = require('fs');

const tPath = 'src/lib/translations.ts';
let t = fs.readFileSync(tPath, 'utf8');
const newKeys = JSON.parse(fs.readFileSync('new_global_keys.json', 'utf8'));

// First remove any previously appended Object.assign block we did earlier
t = t.replace(/\/\/ Automatic Inject[\s\S]*/, '');

let languages = ['ar', 'en', 'hi', 'ur', 'bn'];
let replacedContent = t;

// We will inject keys into every language directly
languages.forEach(lang => {
    // Basic regex to find start of language block: `lang: {`
    const regex = new RegExp(lang + ':\\s*\\{');
    let parts = replacedContent.split(regex);
    if (parts.length > 1) {
        let before = parts[0];
        let rem = parts.slice(1).join(lang + ': {'); // rebuild the rest if multiple matches (though mostly 1)
        
        let injectStr = '';
        for (let k in newKeys) {
            // Check if key already exists natively
            if (!rem.includes("'" + k + "'") && !rem.includes('"' + k + '"')) {
                injectStr += `    "${k}": ${JSON.stringify(newKeys[k])},\n`;
            }
        }
        
        replacedContent = before + lang + ': {\n' + injectStr + rem;
    }
});

fs.writeFileSync(tPath, replacedContent, 'utf8');
console.log('Successfully injected natively to translations.ts');
