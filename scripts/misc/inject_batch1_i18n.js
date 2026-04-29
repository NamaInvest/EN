const fs = require('fs');

const arDict = JSON.parse(fs.readFileSync('batch1_extracted.json', 'utf8'));
const enDict = JSON.parse(fs.readFileSync('batch1_en.json', 'utf8'));
const hiDict = JSON.parse(fs.readFileSync('batch1_hi.json', 'utf8'));
const urDict = JSON.parse(fs.readFileSync('batch1_ur.json', 'utf8'));
const bnDict = JSON.parse(fs.readFileSync('batch1_bn.json', 'utf8'));

let i18nCode = fs.readFileSync('src/lib/i18n.tsx', 'utf8');

function injectTranslations(dictName, jsonDict, isArabic = false) {
    // We want to insert the keys before the closing brace of the dictionary
    const regex = new RegExp(`const ${dictName} = {([\\s\\S]*?)};`);
    
    i18nCode = i18nCode.replace(regex, (match, contents) => {
        let newEntries = [];
        for (const [key, val] of Object.entries(jsonDict)) {
            // For Arabic, the value is nested `{ ar: "..." }` in the extracted format
            const textValue = isArabic ? val.ar : val;
            newEntries.push(`        '${key}': \`${textValue.replace(/`/g, '\\`')}\``);
        }
        
        // Remove trailing commas if any, then append
        let cleanContents = contents.trimEnd();
        if(cleanContents.endsWith(',')) {
            cleanContents = cleanContents.slice(0, -1);
        }
        
        return `const ${dictName} = {\n${cleanContents},\n${newEntries.join(',\n')}\n};`;
    });
}

injectTranslations('arMappings', arDict, true);
injectTranslations('enMappings', enDict);
injectTranslations('hiMappings', hiDict);
injectTranslations('urMappings', urDict);
injectTranslations('bnMappings', bnDict);

fs.writeFileSync('src/lib/i18n.tsx', i18nCode, 'utf8');
console.log('Successfully injected Batch 1 translations into src/lib/i18n.tsx');
