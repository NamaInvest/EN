const fs = require('fs');
const ts = require('typescript');

// 1. Safely load current Arabic translations
const tsCode = fs.readFileSync('src/lib/translations.ts', 'utf8')
    .replace('export default translations;', 'module.exports = translations;')
    .replace(/export /g, '');

const jsCode = ts.transpile(tsCode);
fs.writeFileSync('temp_ar.js', jsCode);
const baseTrans = require('./temp_ar');
const arDict = baseTrans['ar'] || Object.values(baseTrans)[0] || baseTrans;

// 2. Load EN mappings
let enDict = {};
const enScriptCode = fs.readFileSync('rewrite_inline_lang.js', 'utf8');
const enMatch = enScriptCode.match(/const enMappings = (\{[\s\S]*?\});/);
if (enMatch) {
    fs.writeFileSync('temp_en.js', 'module.exports = ' + enMatch[1], 'utf8');
    enDict = require('./temp_en');
}

// 3. Load HI, BN, UR mappings
let hiDict = {}, bnDict = {}, urDict = {};
const oldInjectCode = fs.readFileSync('inject_languages.js', 'utf8');
['hi', 'bn', 'ur'].forEach(lang => {
    const langMatch = oldInjectCode.match(new RegExp(`const ${lang}Mappings = (\\{[\\s\\S]*?\\});`));
    if (langMatch) {
        fs.writeFileSync(`temp_${lang}.js`, 'module.exports = ' + langMatch[1], 'utf8');
        if (lang === 'hi') hiDict = require('./temp_hi');
        if (lang === 'bn') bnDict = require('./temp_bn');
        if (lang === 'ur') urDict = require('./temp_ur');
    }
});

// Sync any missing English translations with Arabic to prevent crashes, and log them!
for(let key in arDict) {
    if (!enDict[key]) enDict[key] = arDict[key];
    if (!hiDict[key]) hiDict[key] = arDict[key];
    if (!bnDict[key]) bnDict[key] = arDict[key];
    if (!urDict[key]) urDict[key] = arDict[key];
}

const fullDict = {
    "ar": arDict,
    "en": enDict,
    "hi": hiDict,
    "bn": bnDict,
    "ur": urDict
};

const finalTsCode = `// Auto-generated statically compiled dictionary built on ${new Date().toISOString()}

export type Language = 'ar' | 'en' | 'hi' | 'bn' | 'ur';

const translations: Record<Language, Record<string, string>> = ${JSON.stringify(fullDict, null, 2)};

export default translations;

// Direct translation function - works without React context
export function translate(key: string, lang: Language = 'ar'): string {
    return translations[lang]?.[key] || translations['ar']?.[key] || key;
}

// Get the full translations object
export function getTranslations(): Record<Language, Record<string, string>> {
    return translations;
}
`;

fs.writeFileSync('src/lib/translations.ts', finalTsCode, 'utf8');
console.log('Successfully generated pure static translations.ts!');

fs.unlinkSync('temp_ar.js');
fs.unlinkSync('temp_en.js');
fs.unlinkSync('temp_hi.js');
fs.unlinkSync('temp_bn.js');
fs.unlinkSync('temp_ur.js');
