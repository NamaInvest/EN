// This script:
// 1. Reads the existing i18n.tsx from server
// 2. Extracts all translations into a separate JSON file
// 3. Creates a new lightweight i18n.tsx that imports from JSON
// 4. Deploys to N3 and tests

const { Client } = require('ssh2');
const fs = require('fs');

// Step 1: Read the clean server i18n.tsx
const content = fs.readFileSync('src/lib/i18n_from_server.tsx', 'utf-8');
const lines = content.split('\n');

// Step 2: Extract translations for each language
// Find the translations object boundaries
let transStart = -1, transEnd = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("const translations: Record<Language, Record<string, string>> = {")) {
        transStart = i;
    }
    if (lines[i].trim() === '};' && transStart >= 0 && transEnd < 0 && i > transStart + 100) {
        transEnd = i;
    }
}

console.log(`Translations found: lines ${transStart + 1} to ${transEnd + 1}`);

// Parse each language section
const langSections = {};
let currentLang = null;
let currentKeys = {};
let braceDepth = 0;

for (let i = transStart + 1; i < transEnd; i++) {
    const line = lines[i].replace('\r', '');
    
    // Detect language section start: "    ar: {" or "    en: {"
    const langMatch = line.match(/^\s+(ar|en|hi|bn|ur):\s*\{/);
    if (langMatch) {
        if (currentLang) {
            langSections[currentLang] = { ...currentKeys };
        }
        currentLang = langMatch[1];
        currentKeys = {};
        continue;
    }
    
    // Detect section end
    if (line.trim() === '},' && currentLang) {
        langSections[currentLang] = { ...currentKeys };
        currentLang = null;
        currentKeys = {};
        continue;
    }
    
    // Parse key-value pairs
    if (currentLang) {
        const kvMatch = line.match(/^\s+'([^']+)':\s*'(.*)'/);
        if (kvMatch) {
            currentKeys[kvMatch[1]] = kvMatch[2];
        }
    }
}

// Save last section if needed
if (currentLang) {
    langSections[currentLang] = currentKeys;
}

// Count keys per language
for (const [lang, keys] of Object.entries(langSections)) {
    console.log(`  ${lang}: ${Object.keys(keys).length} keys`);
}

// Step 3: Write translations as a standalone TypeScript file
const transFileContent = `// Auto-generated translations file - DO NOT EDIT MANUALLY
// Generated: ${new Date().toISOString()}

export type Language = 'ar' | 'en' | 'hi' | 'bn' | 'ur';

const translations: Record<Language, Record<string, string>> = ${JSON.stringify(langSections, null, 2)};

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

fs.writeFileSync('src/lib/translations.ts', transFileContent, 'utf-8');
console.log(`\nWrote src/lib/translations.ts (${(transFileContent.length / 1024).toFixed(0)} KB)`);

// Step 4: Create a new lightweight i18n.tsx
const i18nContent = `'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import translations, { translate, type Language } from './translations';

export type { Language };

export interface LanguageInfo {
    code: Language;
    name: string;
    nativeName: string;
    dir: 'rtl' | 'ltr';
    flag: string;
}

export const languages: LanguageInfo[] = [
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇸🇦' },
    { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr', flag: '🇮🇳' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', dir: 'ltr', flag: '🇧🇩' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl', flag: '🇵🇰' },
];

interface I18nContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: (key: string) => string;
    dir: 'rtl' | 'ltr';
    langInfo: LanguageInfo;
}

const I18nContext = createContext<I18nContextType>({
    lang: 'ar',
    setLang: () => { },
    t: (key: string) => translate(key, 'ar'),
    dir: 'rtl',
    langInfo: { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇸🇦' },
});

export function I18nProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Language>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('app_lang') as Language;
            if (saved && translations[saved]) return saved;
        }
        return 'ar';
    });

    useEffect(() => {
        const saved = localStorage.getItem('app_lang') as Language;
        if (saved && translations[saved] && saved !== lang) {
            setLangState(saved);
        }
    }, []);

    const setLang = (newLang: Language) => {
        setLangState(newLang);
        localStorage.setItem('app_lang', newLang);
        const info = languages.find(l => l.code === newLang)!;
        document.documentElement.dir = info.dir;
        document.documentElement.lang = newLang;
    };

    const t = (key: string): string => {
        return translate(key, lang);
    };

    const langInfo = languages.find(l => l.code === lang)!;

    return (
        <I18nContext.Provider value={{ lang, setLang, t, dir: langInfo.dir, langInfo }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslation() {
    const ctx = useContext(I18nContext);
    // Direct reference to translations ensures bundler includes the dictionary
    const lang = ctx.lang || 'ar';
    const t = (key: string): string => translate(key, lang);
    return { ...ctx, t };
}
`;

fs.writeFileSync('src/lib/i18n.tsx', i18nContent, 'utf-8');
console.log(`Wrote src/lib/i18n.tsx (${(i18nContent.length / 1024).toFixed(1)} KB)`);

// Step 5: Deploy to N3
console.log('\nDeploying to N3...');

const conn = new Client();
const BASE = '/www/wwwroot/n3.namainvist.com';

conn.on('ready', () => {
    console.log('Connected!');
    conn.sftp((err, sftp) => {
        if (err) { console.error(err); conn.end(); return; }
        
        const files = [
            'src/lib/translations.ts',
            'src/lib/i18n.tsx',
            'src/app/(dashboard)/layout.tsx',
        ];
        
        let uploaded = 0;
        files.forEach(f => {
            sftp.fastPut(f, `${BASE}/${f}`, (err) => {
                if (err) console.log(`❌ ${f}: ${err.message}`);
                else console.log(`📦 ${f}`);
                uploaded++;
                if (uploaded === files.length) {
                    console.log('\n🔨 Clean build...');
                    conn.exec(`cd ${BASE} && rm -rf .next && npm run build 2>&1 | tail -5 && pm2 restart n3 2>&1 | head -3 && echo DONE`, (err, stream) => {
                        if (err) { conn.end(); return; }
                        let out = '';
                        const t = setTimeout(() => { console.log('Timeout'); conn.end(); }, 180000);
                        stream.on('data', d => { out += d.toString(); process.stdout.write(d); });
                        stream.on('close', () => {
                            clearTimeout(t);
                            console.log(out.includes('DONE') ? '\n\n🎉 N3 DEPLOYED!' : '\n\n❌ Build issue');
                            conn.end();
                        });
                    });
                }
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
