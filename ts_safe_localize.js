const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');
const glob = require('glob');

const project = new Project();
const filesToProcess = glob.sync('src/{app,components}/**/*.tsx', {
    ignore: [
        '**/node_modules/**', 
        '**/.next/**',
        '**/login/page.tsx',
        '**/restaurant-pos/page.tsx',
        '**/barcode/page.tsx',
        '**/expenses/page.tsx',
        '**/fixed-assets/page.tsx',
        '**/reports/page.tsx',
        '**/settings/page.tsx',
        '**/settings/permissions/page.tsx',
        '**/~offline/page.tsx',
        '**/invoice/[id]/page.tsx'
    ]
});

console.log(`Found ${filesToProcess.length} .tsx files to scan.`);

filesToProcess.forEach(f => {
    project.addSourceFileAtPath(f);
});

const isArabic = (str) => /[\u0600-\u06FF]/.test(str);
let dictionary = JSON.parse(fs.readFileSync('all_extracted_strings.json', 'utf8'));

// Reverse lookup map to find keys by arabic value
let reverseMap = {};
for(let k in dictionary) {
    reverseMap[dictionary[k].ar] = k;
}

function getOrCreateKey(filePath, text) {
    let cleanText = text.trim();
    if (!cleanText) return null;
    if (reverseMap[cleanText]) return reverseMap[cleanText];
    return null; // Do not create new keys, we only want to map back to the ones we translated!
}

for (const file of project.getSourceFiles()) {
    const filePath = file.getFilePath();
    if (filePath.endsWith('i18n.tsx') || filePath.endsWith('layout.tsx')) continue; // Exclude layout to prevent SSR errors inside Metadata
    
    let localEdits = 0;
    const hasJsx = file.getDescendantsOfKind(SyntaxKind.JsxElement).length > 0 || file.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).length > 0;
    const defaultExport = file.getDefaultExportSymbol()?.getDeclarations()[0];
    let needsI18nHook = false;

    file.getDescendantsOfKind(SyntaxKind.JsxText).forEach(node => {
        const text = node.getLiteralText();
        if (isArabic(text) && !text.includes('{')) {
            const key = getOrCreateKey(filePath, text);
            if(key) { node.replaceWithText(`{t('${key}')}`); localEdits++; needsI18nHook = true; }
        }
    });

    file.getDescendantsOfKind(SyntaxKind.StringLiteral).forEach(node => {
        const parent = node.getParent();
        if (parent.getKind() === SyntaxKind.ImportDeclaration || parent.getKind() === SyntaxKind.PropertyAssignment && !parent.getText().includes("label:") && !parent.getText().includes("title:")) return;
        
        const text = node.getLiteralValue();
        if (isArabic(text)) {
            const key = getOrCreateKey(filePath, text);
            if(key) {
                if (parent.getKind() === SyntaxKind.JsxAttribute) {
                    node.replaceWithText(`{t('${key}')}`);
                    localEdits++; needsI18nHook = true;
                } else if ([SyntaxKind.CallExpression, SyntaxKind.ObjectLiteralExpression, SyntaxKind.ArrayLiteralExpression, SyntaxKind.PropertyAssignment, SyntaxKind.EqualityChecker, SyntaxKind.BinaryExpression, SyntaxKind.ReturnStatement].includes(parent.getKind())) {
                    node.replaceWithText(`t('${key}')`);
                    localEdits++; needsI18nHook = true;
                }
            }
        }
    });

    file.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral).forEach(node => {
        const text = node.getLiteralValue();
        if (isArabic(text)) {
            const key = getOrCreateKey(filePath, text);
            if(key) { node.replaceWithText(`t('${key}')`); localEdits++; needsI18nHook = true; }
        }
    });

    if (needsI18nHook && hasJsx && defaultExport && defaultExport.isKind(SyntaxKind.FunctionDeclaration)) {
        const imports = file.getImportDeclarations();
        const hasI18nImport = imports.some(imp => imp.getModuleSpecifierValue() === '@/lib/i18n' || imp.getModuleSpecifierValue() === '../../lib/i18n'); 
        
        if (!hasI18nImport) {
            file.addImportDeclaration({
                namedImports: ['useTranslation'],
                moduleSpecifier: '@/lib/i18n'
            });
        }
        
        const statements = defaultExport.getBody()?.getStatements();
        if(statements) {
             const hasUseTranslation = statements.some(s => s.getText().includes('useTranslation('));
             if (!hasUseTranslation) {
                 defaultExport.insertStatements(0, 'const { t } = useTranslation();');
             }
        }
    }
}

project.saveSync();
console.log(`RE-LOCALIZATION COMPLETE! Ignored broken/server files.`);
