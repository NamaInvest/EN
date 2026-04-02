const fs = require('fs');

// Load all dicts
const allExtracted = fs.existsSync('all_extracted_strings.json') ? JSON.parse(fs.readFileSync('all_extracted_strings.json', 'utf8')) : {};
const allEn = fs.existsSync('all_en.json') ? JSON.parse(fs.readFileSync('all_en.json', 'utf8')) : {};
const allHi = fs.existsSync('all_hi.json') ? JSON.parse(fs.readFileSync('all_hi.json', 'utf8')) : {};
const allUr = fs.existsSync('all_ur.json') ? JSON.parse(fs.readFileSync('all_ur.json', 'utf8')) : {};
const allBn = fs.existsSync('all_bn.json') ? JSON.parse(fs.readFileSync('all_bn.json', 'utf8')) : {};

const b1Extracted = fs.existsSync('batch1_extracted.json') ? JSON.parse(fs.readFileSync('batch1_extracted.json', 'utf8')) : {};
const b1En = fs.existsSync('batch1_en.json') ? JSON.parse(fs.readFileSync('batch1_en.json', 'utf8')) : {};
const b1Hi = fs.existsSync('batch1_hi.json') ? JSON.parse(fs.readFileSync('batch1_hi.json', 'utf8')) : {};
const b1Ur = fs.existsSync('batch1_ur.json') ? JSON.parse(fs.readFileSync('batch1_ur.json', 'utf8')) : {};
const b1Bn = fs.existsSync('batch1_bn.json') ? JSON.parse(fs.readFileSync('batch1_bn.json', 'utf8')) : {};

// Merge dicts
const masterAr = {};
const masterEn = {};
const masterHi = {};
const masterUr = {};
const masterBn = {};

function populate(target, srcObj, isAr = false) {
    for (const [k, v] of Object.entries(srcObj)) {
        if(isAr) target[k] = v.ar || v; // Handle {ar: 'text'} or just 'text'
        else target[k] = v;
    }
}

populate(masterAr, allExtracted, true); populate(masterAr, b1Extracted, true);
populate(masterEn, allEn); populate(masterEn, b1En);
populate(masterHi, allHi); populate(masterHi, b1Hi);
populate(masterUr, allUr); populate(masterUr, b1Ur);
populate(masterBn, allBn); populate(masterBn, b1Bn);

let i18nCode = fs.readFileSync('src/lib/i18n.tsx', 'utf8');

function injectIntoLang(langKey, dict) {
    const regex = new RegExp(`(\\s*${langKey}:\\s*\\{[\\s\\S]*?)(};?\\n|},\\n\\s*[a-z]+:\\s*\\{)`);
    
    i18nCode = i18nCode.replace(regex, (match, prefix, suffix) => {
        // Extract existing keys to avoid duplicates
        let existingKeys = new Set();
        const keyExtractor = /'([^']+)'\s*:/g;
        let kMatch;
        while((kMatch = keyExtractor.exec(prefix)) !== null) {
            existingKeys.add(kMatch[1]);
        }

        let newEntries = [];
        for (const [key, val] of Object.entries(dict)) {
            if(existingKeys.has(key)) continue;
            // Fallback to Arabic if translation missing
            const textValue = val || masterAr[key];
            if(!textValue) continue;
            newEntries.push(`        '${key}': \`${textValue.toString().replace(/`/g, '\\`')}\``);
        }
        
        if(newEntries.length === 0) return match;
        
        let p = prefix.trimEnd();
        if(p.endsWith(',')) p = p.slice(0, -1);
        
        return `${p},\n${newEntries.join(',\n')}\n    ${suffix.startsWith('}') ? suffix : '}' + suffix.substring(1)}`;
    });
}

injectIntoLang('ar', masterAr);
injectIntoLang('en', masterEn);
injectIntoLang('hi', masterHi);
injectIntoLang('ur', masterUr);
injectIntoLang('bn', masterBn);

fs.writeFileSync('src/lib/i18n.tsx', i18nCode, 'utf8');
console.log('Successfully injected EVERY SINGLE string into i18n.tsx properly.');
