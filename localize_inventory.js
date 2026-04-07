const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');
const glob = require('glob');

const project = new Project();
const filesToProcess = [
    ...glob.sync('src/app/**/stock/**/*.tsx'),
    ...glob.sync('src/app/**/stock-transfers/**/*.tsx')
];

console.log(`Found ${filesToProcess.length} .tsx files for Inventory to scan.`);

filesToProcess.forEach(f => {
    project.addSourceFileAtPath(f);
});

// FIXED REGEX!
const isArabic = (str) => /[\u0600-\u06FF]/.test(str);

let transFile = fs.readFileSync('src/lib/translations.ts', 'utf8');

const newKeys = {};
let maxIndex = 3500;

const matchCount = transFile.match(/'sys\.str_(\d+)'/g);
if (matchCount) {
    const nums = matchCount.map(m => parseInt(m.match(/\d+/)[0]));
    maxIndex = Math.max(...nums) + 1;
}

const reverseMap = {};
let arBlockMatch = transFile.match(/ar:\s*\{([\s\S]*?)\}/);
if (arBlockMatch) {
    let lines = arBlockMatch[1].split('\n');
    lines.forEach(l => {
        let parts = l.split("': '");
        if(parts.length === 2) {
            let k = parts[0].replace(/'/g, '').trim();
            let v = parts[1].replace(/',/g, '').replace(/'/g, '').trim();
            reverseMap[v] = k;
        }
    });
}

function getOrCreateKey(text) {
    let cleanText = text.trim();
    if (!cleanText) return null;
    if (reverseMap[cleanText]) return reverseMap[cleanText];
    
    maxIndex++;
    const key = `sys.str_${maxIndex}`;
    reverseMap[cleanText] = key;
    newKeys[key] = cleanText;
    return key;
}

for (const file of project.getSourceFiles()) {
    const filePath = file.getFilePath();
    let localEdits = 0;
    const hasJsx = file.getDescendantsOfKind(SyntaxKind.JsxElement).length > 0 || file.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).length > 0;
    const defaultExport = file.getDefaultExportSymbol()?.getDeclarations()[0];
    let needsI18nHook = false;

    file.getDescendantsOfKind(SyntaxKind.JsxText).forEach(node => {
        const text = node.getLiteralText();
        if (isArabic(text) && !text.includes('{')) {
            const key = getOrCreateKey(text);
            if(key) { node.replaceWithText(`{t('${key}')}`); localEdits++; needsI18nHook = true; }
        }
    });

    file.getDescendantsOfKind(SyntaxKind.StringLiteral).forEach(node => {
        const parent = node.getParent();
        if (parent.getKind() === SyntaxKind.ImportDeclaration || parent.getKind() === SyntaxKind.PropertyAssignment && !parent.getText().includes("label:") && !parent.getText().includes("title:") && !parent.getText().includes("name:")) return;
        
        const text = node.getLiteralValue();
        if (isArabic(text)) {
            const key = getOrCreateKey(text);
            if(key) {
                if (parent.getKind() === SyntaxKind.JsxAttribute) {
                    node.replaceWithText(`{t('${key}')}`);
                    localEdits++; needsI18nHook = true;
                } else if ([SyntaxKind.CallExpression, SyntaxKind.ObjectLiteralExpression, SyntaxKind.ArrayLiteralExpression, SyntaxKind.PropertyAssignment, SyntaxKind.EqualityChecker, SyntaxKind.BinaryExpression, SyntaxKind.ReturnStatement, SyntaxKind.ConditionalExpression, SyntaxKind.JsxExpression].includes(parent.getKind())) {
                    node.replaceWithText(`t('${key}')`);
                    localEdits++; needsI18nHook = true;
                }
            }
        }
    });

    file.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral).forEach(node => {
        const text = node.getLiteralValue();
        if (isArabic(text)) {
            const key = getOrCreateKey(text);
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
console.log(`Replaced all Arabic strings in Inventory files.`);
console.log(`Found ${Object.keys(newKeys).length} new strings!`);

if(Object.keys(newKeys).length > 0) {
    fs.writeFileSync('new_inventory_keys.json', JSON.stringify(newKeys, null, 2));
    console.log('Saved to new_inventory_keys.json');
}
