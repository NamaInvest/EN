const fs = require('fs');

const arBatch = fs.existsSync('batch1_extracted.json') ? JSON.parse(fs.readFileSync('batch1_extracted.json', 'utf8')) : {};
const enBatch = fs.existsSync('batch1_en.json') ? JSON.parse(fs.readFileSync('batch1_en.json', 'utf8')) : {};
const hiBatch = fs.existsSync('batch1_hi.json') ? JSON.parse(fs.readFileSync('batch1_hi.json', 'utf8')) : {};
const urBatch = fs.existsSync('batch1_ur.json') ? JSON.parse(fs.readFileSync('batch1_ur.json', 'utf8')) : {};
const bnBatch = fs.existsSync('batch1_bn.json') ? JSON.parse(fs.readFileSync('batch1_bn.json', 'utf8')) : {};

let i18nCode = fs.readFileSync('src/lib/i18n.tsx', 'utf8');

function injectTranslations(dictName, jsonDict, isArabic = false) {
    const regex = new RegExp(`const ${dictName} = {([\\s\\S]*?)};`);
    
    // We only want to inject keys that are NOT ALREADY in the dictionary
    let existingKeys = new Set();
    const existingMatch = i18nCode.match(regex);
    if(existingMatch) {
       const keyExtractor = /'([^']+)'\s*:/g;
       let kMatch;
       while((kMatch = keyExtractor.exec(existingMatch[1])) !== null) {
           existingKeys.add(kMatch[1]);
       }
    }

    i18nCode = i18nCode.replace(regex, (match, contents) => {
        let newEntries = [];
        for (const [key, val] of Object.entries(jsonDict)) {
            if(existingKeys.has(key)) continue;
            
            const textValue = isArabic ? val.ar : (val || arBatch[key]?.ar || '');
            if(!textValue) continue;
            newEntries.push(`        '${key}': \`${textValue.toString().replace(/`/g, '\\`')}\``);
        }
        
        if (newEntries.length === 0) return match;

        let cleanContents = contents.trimEnd();
        if(cleanContents.endsWith(',')) {
            cleanContents = cleanContents.slice(0, -1);
        }
        
        return `const ${dictName} = {\n${cleanContents},\n${newEntries.join(',\n')}\n};`;
    });
}

// Ensure pos and sales keys are injected correctly if missing
injectTranslations('arMappings', arBatch, true);
injectTranslations('enMappings', enBatch);
injectTranslations('hiMappings', hiBatch);
injectTranslations('urMappings', urBatch);
injectTranslations('bnMappings', bnBatch);

fs.writeFileSync('src/lib/i18n.tsx', i18nCode, 'utf8');
console.log('Successfully injected missing Batch 1 translations into src/lib/i18n.tsx');
