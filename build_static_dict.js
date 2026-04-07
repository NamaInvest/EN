const fs = require('fs');

// Extract all AR strings from current translations.ts
const currentTransCode = fs.readFileSync('src/lib/translations.ts', 'utf8');
const arMatch = currentTransCode.match(/"ar":\s*\{([\s\S]*?)\n\s*\},/);
const arContent = arMatch ? arMatch[1].trim() : '';

// Map into JSON properly
let arDict = {};
arContent.split('\n').forEach(line => {
    let m = line.match(/"([^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (!m) m = line.match(/'([^']+)'\s*:\s*'((?:[^'\\]|\\.)*)'/);
    if (m) arDict[m[1]] = m[2];
});

// Extract EN string from bypass_sidebar_dict.js and rewrite_inline_lang.js
let enDict = {};
const enScriptCode = fs.readFileSync('rewrite_inline_lang.js', 'utf8');
const enMatch = enScriptCode.match(/const enMappings = \{([\s\S]*?)\};/);
if (enMatch) {
    enMatch[1].split('\n').forEach(line => {
        let m = line.match(/"([^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (!m) m = line.match(/'([^']+)'\s*:\s*'((?:[^'\\]|\\.)*)'/);
        if (m) enDict[m[1]] = m[2];
    });
}

// Extract HI, BN, UR from inject_languages.js
let hiDict = {}, bnDict = {}, urDict = {};
const oldInjectCode = fs.readFileSync('inject_languages.js', 'utf8');
['hi', 'bn', 'ur'].forEach(lang => {
    const langMatch = oldInjectCode.match(new RegExp(`const ${lang}Mappings = \\{([\\s\\S]*?)\\};`));
    if (langMatch) {
        langMatch[1].split('\n').forEach(line => {
            let m = line.match(/"([^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/);
            if (!m) m = line.match(/'([^']+)'\s*:\s*'((?:[^'\\]|\\.)*)'/);
            if (m) eval(`${lang}Dict[m[1]] = "${m[2].replace(/"/g, '\\"')}"`); // unescaped eval to handle strange unicodes in raw string properly if needed, but safer string extraction is fine:
            if (m) {
                if (lang === 'hi') hiDict[m[1]] = m[2];
                if (lang === 'bn') bnDict[m[1]] = m[2];
                if (lang === 'ur') urDict[m[1]] = m[2];
            }
        });
    }
});

// Build the giant dictionary!
const buildDictString = (dictObj) => {
    return Object.entries(dictObj)
        .map(([k, v]) => `    "${k}": "${v.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`)
        .join(',\n');
};

const finalTsCode = `// Auto-generated statically compiled dictionary built on ${new Date().toISOString()}

export type Language = 'ar' | 'en' | 'hi' | 'bn' | 'ur';

const translations: Record<Language, Record<string, string>> = {
  "ar": {
${buildDictString(arDict)}
  },
  "en": {
${buildDictString(enDict)}
  },
  "hi": {
${buildDictString(hiDict)}
  },
  "bn": {
${buildDictString(bnDict)}
  },
  "ur": {
${buildDictString(urDict)}
  }
};

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
