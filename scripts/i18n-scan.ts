import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve(process.cwd(), 'src');
const LOCALES_DIR = path.resolve(process.cwd(), 'src/locales');
const REPORT_FILE = path.resolve(process.cwd(), 'tmp/i18n-report.md');

// We search for t('key'), t("key"), _t('ar', 'en')
const T_REGEX = /\bt\(\s*['"]([^'"]+)['"]/g;
const _T_REGEX = /\b_t\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]/g;

function walkDir(dir: string, fileList: string[] = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            walkDir(filePath, fileList);
        } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
            if (!filePath.endsWith('.d.ts')) {
                fileList.push(filePath);
            }
        }
    }
    return fileList;
}

interface TranslationMap {
    [key: string]: any;
}

function flattenKeys(obj: any, prefix = ''): string[] {
    let keys: string[] = [];
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            keys = keys.concat(flattenKeys(obj[key], `${prefix}${key}.`));
        } else {
            keys.push(`${prefix}${key}`);
        }
    }
    return keys;
}

async function scan() {
    console.log('Scanning for i18n keys...');
    
    // Load existing locales
    const arPath = path.join(LOCALES_DIR, 'ar.json');
    const enPath = path.join(LOCALES_DIR, 'en.json');
    
    let arKeys: string[] = [];
    let enKeys: string[] = [];
    
    if (fs.existsSync(arPath)) {
        arKeys = flattenKeys(JSON.parse(fs.readFileSync(arPath, 'utf8')));
    } else {
        console.warn('ar.json not found!');
    }
    
    if (fs.existsSync(enPath)) {
        enKeys = flattenKeys(JSON.parse(fs.readFileSync(enPath, 'utf8')));
    } else {
        console.warn('en.json not found!');
    }

    const arSet = new Set(arKeys);
    const enSet = new Set(enKeys);

    // Scan source files
    const tsxFiles = walkDir(SRC_DIR);
    
    const usedKeys = new Set<string>();
    const inlineTranslations: { ar: string, en: string }[] = [];

    for (const filePath of tsxFiles) {
        const content = fs.readFileSync(filePath, 'utf8');

        let match;
        while ((match = T_REGEX.exec(content)) !== null) {
            usedKeys.add(match[1]);
        }

        while ((match = _T_REGEX.exec(content)) !== null) {
            inlineTranslations.push({ ar: match[1], en: match[2] });
        }
    }

    const missingInAr = Array.from(usedKeys).filter(k => !arSet.has(k));
    const missingInEn = Array.from(usedKeys).filter(k => !enSet.has(k));
    
    const unusedInBoth = arKeys.filter(k => !usedKeys.has(k)).filter(k => enSet.has(k));

    // For inline translations, we could auto-generate keys, but for now we just count them
    
    const reportLines = [
        '=== i18n SCAN RESULT ===',
        `ar.json: ${arKeys.length} keys`,
        `en.json: ${enKeys.length} keys`,
        `Missing in en: ${missingInEn.length} keys`,
        `Missing in ar: ${missingInAr.length} keys`,
        `Unused (both): ${unusedInBoth.length} keys`,
        `Inline _t() calls: ${inlineTranslations.length}`,
        '',
        '### Missing in English:',
        ...missingInEn.slice(0, 100).map(k => `- ${k}`),
        missingInEn.length > 100 ? `...and ${missingInEn.length - 100} more` : '',
        '',
        '### Missing in Arabic:',
        ...missingInAr.slice(0, 100).map(k => `- ${k}`),
        missingInAr.length > 100 ? `...and ${missingInAr.length - 100} more` : '',
    ];

    const reportContent = reportLines.join('\n');
    
    if (!fs.existsSync(path.dirname(REPORT_FILE))) {
        fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
    }
    
    fs.writeFileSync(REPORT_FILE, reportContent);
    console.log(`Report generated at ${REPORT_FILE}`);
    
    if (missingInEn.length > 0 || missingInAr.length > 0) {
        console.log('There are missing keys. Check the report for details.');
        process.exit(1);
    } else {
        console.log('All used keys have translations.');
        process.exit(0);
    }
}

scan().catch(console.error);
