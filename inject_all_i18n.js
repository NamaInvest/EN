const fs = require('fs');

const arDict = fs.existsSync('all_extracted_strings.json') ? JSON.parse(fs.readFileSync('all_extracted_strings.json', 'utf8')) : {};
const enDict = fs.existsSync('all_en.json') ? JSON.parse(fs.readFileSync('all_en.json', 'utf8')) : {};
const hiDict = fs.existsSync('all_hi.json') ? JSON.parse(fs.readFileSync('all_hi.json', 'utf8')) : {};
const urDict = fs.existsSync('all_ur.json') ? JSON.parse(fs.readFileSync('all_ur.json', 'utf8')) : {};
const bnDict = fs.existsSync('all_bn.json') ? JSON.parse(fs.readFileSync('all_bn.json', 'utf8')) : {};

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
            
            const textValue = isArabic ? val.ar : (val || arDict[key]?.ar || '');
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

injectTranslations('arMappings', arDict, true);
injectTranslations('enMappings', enDict);
injectTranslations('hiMappings', hiDict);
injectTranslations('urMappings', urDict);
injectTranslations('bnMappings', bnDict);

fs.writeFileSync('src/lib/i18n.tsx', i18nCode, 'utf8');
console.log('Successfully injected ALL translations into src/lib/i18n.tsx');
