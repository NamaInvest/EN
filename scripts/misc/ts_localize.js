const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');

const project = new Project();
const filesToProcess = [
    'src/app/(dashboard)/sales/page.tsx',
    'src/app/pos/page.tsx',
    'src/app/restaurant-pos/page.tsx'
];

filesToProcess.forEach(f => {
    if(fs.existsSync(f)) {
        project.addSourceFileAtPath(f);
    } else {
        console.error(`File not found: ${f}`);
    }
});

const isArabic = (str) => /[\u0600-\u06FF]/.test(str);
let dictionary = {};
let keyCounter = 1;

function getOrCreateKey(modulePrefix, text) {
    let cleanText = text.trim();
    if (!cleanText) return null;
    let exists = Object.entries(dictionary).find(([_, v]) => v.ar === cleanText);
    if (exists) return exists[0];
    
    let newKey = `${modulePrefix}.str_${keyCounter++}`;
    dictionary[newKey] = { ar: cleanText };
    return newKey;
}

for (const file of project.getSourceFiles()) {
    const filePath = file.getFilePath();
    let modulePrefix = 'sales';
    if(filePath.includes('pos/page.tsx')) modulePrefix = 'pos';
    if(filePath.includes('restaurant-pos/page.tsx')) modulePrefix = 'rest_pos';
    console.log(`Processing ${filePath}...`);
    
    const imports = file.getImportDeclarations();
    const hasI18nImport = imports.some(imp => imp.getModuleSpecifierValue() === '@/lib/i18n');
    if (!hasI18nImport) {
        file.addImportDeclaration({
            namedImports: ['useTranslation'],
            moduleSpecifier: '@/lib/i18n'
        });
    }

    let modified = false;

    // We must find out if the component has `const { t, lang } = useTranslation();`
    // If not, inject it inside the default export function
    const defaultExport = file.getDefaultExportSymbol()?.getDeclarations()[0];
    if (defaultExport && defaultExport.isKind(SyntaxKind.FunctionDeclaration)) {
        const statements = defaultExport.getBody().getStatements();
        const hasUseTranslation = statements.some(s => s.getText().includes('useTranslation()'));
        if (!hasUseTranslation) {
            defaultExport.insertStatements(0, 'const { t, lang } = useTranslation();');
            modified = true;
        }
    }

    file.getDescendantsOfKind(SyntaxKind.JsxText).forEach(node => {
        const text = node.getLiteralText();
        if (isArabic(text) && !text.includes('{')) {
            const key = getOrCreateKey(modulePrefix, text);
            if(key) { node.replaceWithText(`{t('${key}')}`); modified = true; }
        }
    });

    file.getDescendantsOfKind(SyntaxKind.StringLiteral).forEach(node => {
        const parent = node.getParent();
        if (parent.getKind() === SyntaxKind.ImportDeclaration || parent.getKind() === SyntaxKind.PropertyAssignment && !parent.getText().includes("label:") && !parent.getText().includes("title:")) return;
        
        const text = node.getLiteralValue();
        if (isArabic(text)) {
            const key = getOrCreateKey(modulePrefix, text);
            if(key) {
                if (parent.getKind() === SyntaxKind.JsxAttribute) {
                    node.replaceWithText(`{t('${key}')}`);
                    modified = true;
                } else if (parent.getKind() === SyntaxKind.CallExpression || parent.getKind() === SyntaxKind.ObjectLiteralExpression || parent.getKind() === SyntaxKind.ArrayLiteralExpression || parent.getKind() === SyntaxKind.PropertyAssignment || parent.getKind() === SyntaxKind.EqualityChecker || parent.getKind() === SyntaxKind.BinaryExpression) {
                    node.replaceWithText(`t('${key}')`);
                    modified = true;
                }
            }
        }
    });

    file.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral).forEach(node => {
        const text = node.getLiteralValue();
        if (isArabic(text)) {
            const key = getOrCreateKey(modulePrefix, text);
            if(key) { node.replaceWithText(`t('${key}')`); modified = true; }
        }
    });
}

project.saveSync();
fs.writeFileSync('batch1_extracted.json', JSON.stringify(dictionary, null, 2), 'utf8');
console.log(`Successfully extracted ${Object.keys(dictionary).length} strings.`);
