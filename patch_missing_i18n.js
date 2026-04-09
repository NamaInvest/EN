const fs = require('fs');

const tsCode = fs.readFileSync('translations_git.ts', 'utf8');

const tmpTs = `
${tsCode.replace(/export type Language.*?;/g, '')
        .replace(/export function translate.*}/gs, '')
        .replace(/export default translations;/g, 'module.exports = translations;')
        .replace(/const translations:.*=/g, 'const translations =')}
`;

fs.writeFileSync('temp_git_trans.js', tmpTs);
console.log("Transpiled git file");

try {
    const data = require('./temp_git_trans.js');
    let added = 0;
    
    // We want to merge data['ar'] into src/locales/ar.json
    for (const [lang, strings] of Object.entries(data)) {
        if (!fs.existsSync(`src/locales/${lang}.json`)) continue;
        const current = JSON.parse(fs.readFileSync(`src/locales/${lang}.json`, 'utf8'));
        
        let fileAdded = 0;
        for (let k in strings) {
            if (!current[k]) {
                current[k] = strings[k];
                fileAdded++;
                added++;
            }
        }
        
        if (fileAdded > 0) {
            fs.writeFileSync(`src/locales/${lang}.json`, JSON.stringify(current, null, 2), 'utf8');
            console.log(`Added ${fileAdded} keys to ${lang}.json`);
        }
    }
} catch(e) {
    console.error(e);
}
