const fs = require('fs');
const path = require('path');

function extractTranslationsFromFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find the translations object declaration
    const match = content.match(/const translations[^=]*=\s*({[\s\S]*?});\s*export/);
    if (!match) {
        console.error("Could not find translations in " + filePath);
        return null;
    }
    
    let objectString = match[1];
    
    // Clean up TypeScript specific things and comments if needed before evaluating
    // But evaluating an object structure safely requires a sandbox or parsing.
    // Instead of parsing manually, we can transpile to CommonJS and require it!
    return objectString;
}

const tsCode = fs.readFileSync('src/lib/translations.ts', 'utf8');
const i18nServerCode = fs.readFileSync('src/lib/i18n_from_server.tsx', 'utf8');

// The easiest way to get the object out is to compile the literal string to JSON if possible.
// Or we can just use `tsc` to create a compiled js, but that takes time.
// Since the object is relatively clean, let's write a temporary script that strips typescript and exports it, then dynamic import.

const tmpTs = `
${tsCode.replace(/export type Language.*?;/g, '')
        .replace(/export function translate.*}/gs, '')
        .replace(/export default translations;/g, 'module.exports = translations;')
        .replace(/const translations:.*=/g, 'const translations =')}
`;

fs.writeFileSync('temp_trans.js', tmpTs);
console.log("Written temp transpiled TS to temp_trans.js");

try {
    const data = require('./temp_trans.js');
    const localesDir = path.join(__dirname, 'src', 'locales');
    if (!fs.existsSync(localesDir)) {
        fs.mkdirSync(localesDir);
    }
    
    for (const [lang, strings] of Object.entries(data)) {
        fs.writeFileSync(
            path.join(localesDir, `${lang}.json`), 
            JSON.stringify(strings, null, 2),
            'utf8'
        );
        console.log(`Wrote ${lang}.json with ${Object.keys(strings).length} keys.`);
    }
} catch(e) {
    console.error("Failed to require temp file:", e);
}

// Similarly for i18n_from_server.tsx to catch 'hi', 'bn', etc.
const tmpServer = `
${i18nServerCode.replace(/import {.*} from 'react';?/g, '')
            .replace(/export type Language.*?;/g, '')
            .replace(/export interface.*?}/gs, '')
            .replace(/export const languages.*?];/gs, '')
            .replace(/export function.*?}/gs, '')
            .replace(/export default.*?}/gs, '')
            .replace(/const translations:.*=/g, 'const translations =')}
module.exports = translations;
`;

fs.writeFileSync('temp_server_trans.js', tmpServer);
try {
    const dataServer = require('./temp_server_trans.js');
    const localesDir = path.join(__dirname, 'src', 'locales');
    for (const [lang, strings] of Object.entries(dataServer)) {
        const filePath = path.join(localesDir, `${lang}.json`);
        let existing = {};
        if (fs.existsSync(filePath)) {
            existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        
        // Merge them
        const merged = { ...existing };
        let added = 0;
        for(let k in strings) {
            if(!merged[k] || merged[k] !== strings[k]) {
                merged[k] = strings[k];
                added++;
            }
        }
        
        fs.writeFileSync(
            filePath, 
            JSON.stringify(merged, null, 2),
            'utf8'
        );
        console.log(`Merged ${lang}.json from i18n_from_server.tsx (added/updated ${added} keys). Total: ${Object.keys(merged).length}`);
    }
} catch (e) {
    console.error("Failed to parse i18n_from_server.tsx:", e.message);
}

fs.unlinkSync('temp_trans.js');
// fs.unlinkSync('temp_server_trans.js');
