const fs = require('fs');

const extracted = JSON.parse(fs.readFileSync('all_extracted_strings.json', 'utf8'));

const langs = ['ar', 'en', 'hi', 'bn', 'ur'];
const dict = {};

langs.forEach(l => {
    dict[l] = {};
    if (l === 'ar') {
        for (let k in extracted) { dict['ar'][k] = extracted[k].ar; }
    } else {
        if(fs.existsSync(`all_${l}.json`)) {
            const data = JSON.parse(fs.readFileSync(`all_${l}.json`, 'utf8'));
            for (let k in extracted) {
                // VERY IMPORTANT: Use the translated one. If it doesn't exist, ONLY THEN fallback to Arabic.
                dict[l][k] = (data[k] && data[k].trim() !== '') ? data[k] : extracted[k].ar;
            }
        } else {
            console.warn(`Warning: all_${l}.json not found! Falling back to Arabic!`);
            for (let k in extracted) { dict[l][k] = extracted[k].ar; }
        }
    }
});

let output = `// Auto-generated statically compiled dictionary built on ${new Date().toISOString()}

export type Language = 'ar' | 'en' | 'hi' | 'bn' | 'ur';

const translations: Record<Language, Record<string, string>> = {\n`;

langs.forEach((l, i) => {
    output += `  "${l}": {\n`;
    const keys = Object.keys(dict[l]);
    keys.forEach((k, j) => {
        // Escape double quotes and newlines safely
        const val = dict[l][k].replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '');
        output += `    "${k}": "${val}"${j < keys.length - 1 ? ',' : ''}\n`;
    });
    output += `  }${i < langs.length - 1 ? ',' : ''}\n`;
});

output += `};

export function translate(key: string, lang: Language): string {
  // Try to find the exact key in the target language
  if (translations[lang] && translations[lang][key]) {
      return translations[lang][key];
  }
  
  // Fallback to Arabic if English/Hindi/etc fails
  if (translations['ar'] && translations['ar'][key]) {
      return translations['ar'][key];
  }
  
  // Ultimate Fallback: just return the key itself so developer knows it's missing
  return key;
}

export default translations;
`;

fs.writeFileSync('src/lib/translations.ts', output);
console.log('✅ src/lib/translations.ts successfully compiled with NEW languages!');
