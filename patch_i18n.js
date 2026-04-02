const fs = require('fs');

const filePath = 'src/lib/i18n.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Find the useTranslation function and replace it
const lines = content.split('\n');
let startLine = -1;
let endLine = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('export function useTranslation()')) {
        startLine = i;
    }
    if (startLine >= 0 && i > startLine && lines[i].trim() === '}') {
        endLine = i;
        break;
    }
}

if (startLine >= 0 && endLine >= 0) {
    console.log(`Found useTranslation at lines ${startLine+1} to ${endLine+1}`);
    
    const newLines = [
        'export function useTranslation() {',
        '    const ctx = useContext(I18nContext);',
        '    const lang = ctx.lang || \'ar\';',
        '    const safeT = (key: string): string => {',
        '        return translations[lang]?.[key] || translations[\'ar\']?.[key] || key;',
        '    };',
        '    return { ...ctx, t: safeT };',
        '}',
    ];
    
    // Detect line ending
    const useCRLF = content.includes('\r\n');
    const lineEnding = useCRLF ? '\r\n' : '\n';
    console.log('Using CRLF:', useCRLF);
    
    // Replace the lines
    lines.splice(startLine, endLine - startLine + 1, ...newLines);
    
    const newContent = lines.join('\n');
    fs.writeFileSync(filePath, newContent, 'utf-8');
    
    // Verify
    const verify = fs.readFileSync(filePath, 'utf-8');
    console.log('File has safeT:', verify.includes('safeT'));
    console.log('File has translations[lang]:', verify.includes("translations[lang]?.[key]"));
    console.log('File lines:', verify.split('\n').length);
    console.log('SUCCESS!');
} else {
    console.log('ERROR: Could not find useTranslation function boundaries');
}
