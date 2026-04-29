const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');
const glob = require('glob');

const project = new Project();
// Find all tsx files in src/app and src/components
const filesToProcess = glob.sync('src/{app,components}/**/*.tsx', {
    ignore: ['**/node_modules/**', '**/.next/**']
});

console.log(`Found ${filesToProcess.length} .tsx files to scan.`);

filesToProcess.forEach(f => {
    project.addSourceFileAtPath(f);
});

const isArabic = (str) => /[\u0600-\u06FF]/.test(str);
let dictionary = {};
let keyCounter = 1;

function getOrCreateKey(filePath, text) {
    let cleanText = text.trim();
    if (!cleanText) return null;
    let exists = Object.entries(dictionary).find(([_, v]) => v.ar === cleanText);
    if (exists) return exists[0];
    
    // Create a generic prefix based on filename or just 'sys'
    let prefix = 'sys';
    if(filePath.includes('sales')) prefix = 'sales';
    else if(filePath.includes('pos')) prefix = 'pos';
    else if(filePath.includes('purchases')) prefix = 'purchases';
    else if(filePath.includes('stock')) prefix = 'stock';
    else if(filePath.includes('hr') || filePath.includes('employees')) prefix = 'hr';
    else if(filePath.includes('accounting') || filePath.includes('finance')) prefix = 'fin';
    
    let newKey = `${prefix}.str_${keyCounter++}`;
    dictionary[newKey] = { ar: cleanText };
    return newKey;
}

for (const file of project.getSourceFiles()) {
    const filePath = file.getFilePath();
    
    // Skip already heavily localized files
    if (filePath.endsWith('i18n.tsx')) continue;
    
    let localEdits = 0;

    // Check if it's a React component by checking if it exports something that returns JSX
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
        const hasI18nImport = imports.some(imp => imp.getModuleSpecifierValue() === '@/lib/i18n' || imp.getModuleSpecifierValue() === '../../lib/i18n'); // Simplification
        
        // Add import safely using relative path heuristic if needed, or alias
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
fs.writeFileSync('all_extracted_strings.json', JSON.stringify(dictionary, null, 2), 'utf8');
console.log(`SCAN COMPLETE: Extracted ${Object.keys(dictionary).length} strings globally.`);
