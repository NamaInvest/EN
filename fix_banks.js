const fs = require('fs');

function fix(filePath) {
    if (!fs.existsSync(filePath)) return;
    let code = fs.readFileSync(filePath, 'utf8');
    
    // Instead of messing with the internal code, let's wrap the default export in next/dynamic
    if (code.includes('next/dynamic')) return;
    
    // We just rename the default export and add dynamic at the bottom
    code = code.replace(/export default function (\w+)/, "function $1");
    code = "import dynamic from 'next/dynamic';\n" + code;
    
    const funcNameMatch = code.match(/function (BanksPage|AcademicClassesPage|([a-zA-Z0-9_]+Page))/);
    if (funcNameMatch) {
       const funcName = funcNameMatch[1];
       code += `\nexport default dynamic(() => Promise.resolve(${funcName}), { ssr: false });\n`;
       fs.writeFileSync(filePath, code);
       console.log('Fixed', filePath);
    }
}

fix('src/app/(dashboard)/accounting/banks/page.tsx');
fix('src/app/(dashboard)/shl/classes/page.tsx');
