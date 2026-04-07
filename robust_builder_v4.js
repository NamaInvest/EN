const fs = require('fs');
const ts = require('typescript');

const tsCode = fs.readFileSync('src/lib/translations.ts', 'utf8')
    .replace('export default translations;', 'module.exports = translations;')
    .replace(/export /g, '');

const jsCode = ts.transpile(tsCode);
fs.writeFileSync('temp_base.js', jsCode);
const baseTrans = require('./temp_base');

const arDictOrig = baseTrans['ar'] || {};
let enDictOrig = baseTrans['en'] || {};
let hiDictOrig = baseTrans['hi'] || {};
let bnDictOrig = baseTrans['bn'] || {};
let urDictOrig = baseTrans['ur'] || {};

// Load EN mappings - THE COMPLETE ONE
const enDictSidebar = require('./complete_en_sidebar.js');

// Load HI, BN, UR mappings (Optional injection from previous attempts, keep it to be safe)
let hiDictInject = {}, bnDictInject = {}, urDictInject = {};
const oldInjectCode = fs.readFileSync('inject_languages.js', 'utf8');
['hi', 'bn', 'ur'].forEach(lang => {
    const langMatch = oldInjectCode.match(new RegExp(`const ${lang}Mappings = (\\{[\\s\\S]*?\\});`));
    if (langMatch) {
        fs.writeFileSync(`temp_${lang}.js`, 'module.exports = ' + langMatch[1], 'utf8');
        if (lang === 'hi') hiDictInject = require('./temp_hi');
        if (lang === 'bn') bnDictInject = require('./temp_bn');
        if (lang === 'ur') urDictInject = require('./temp_ur');
    }
});

// MERGE intelligently - giving precedence to our complete English sidebar map!
const enDict = { ...enDictOrig, ...enDictSidebar };
const hiDict = Object.keys(hiDictOrig).length > 0 ? { ...hiDictOrig, ...hiDictInject } : hiDictInject;
const bnDict = Object.keys(bnDictOrig).length > 0 ? { ...bnDictOrig, ...bnDictInject } : bnDictInject;
const urDict = Object.keys(urDictOrig).length > 0 ? { ...urDictOrig, ...urDictInject } : urDictInject;

// Auto-fill omissions from AR so there are NO MISSING KEYS that cause crashes
for(let key in arDictOrig) {
    if (!enDict[key]) enDict[key] = arDictOrig[key];
    if (!hiDict[key]) hiDict[key] = arDictOrig[key];
    if (!bnDict[key]) bnDict[key] = arDictOrig[key];
    if (!urDict[key]) urDict[key] = arDictOrig[key];
}

const fullDict = {
    "ar": arDictOrig,
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
console.log('Successfully generated pure static translations.ts WITH FULL ENGLISH SIDEBAR DICTIONARY!');

// Cleanup
fs.unlinkSync('temp_base.js');
try{ fs.unlinkSync('temp_hi.js'); }catch(e){}
try{ fs.unlinkSync('temp_bn.js'); }catch(e){}
try{ fs.unlinkSync('temp_ur.js'); }catch(e){}
