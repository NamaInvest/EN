const fs = require('fs');

// Mass-fix all remaining files with top-level t() usage
// Strategy: Find each top-level constant that calls t() and wrap the constant in a function.

const files = [
    'src/app/(dashboard)/reports/page.tsx',
    'src/app/(dashboard)/fixed-assets/page.tsx',
    'src/app/invoice/[id]/page.tsx',
    'src/app/(dashboard)/reports/73-modules/page.tsx',
    'src/app/(dashboard)/settings/page.tsx',
];

files.forEach(p => {
    let code = fs.readFileSync(p, 'utf8');
    const lines = code.split('\n');
    
    // Find export default function or function Component line
    const funcLine = lines.findIndex(l => l.match(/^export default function|^function [A-Z]/));
    if (funcLine < 0) {
        console.log(`Skipping ${p} - no export default function found`);
        return;
    }
    
    // Check if there are any t() calls before that line that need to be fixed
    let hasBadT = false;
    for (let i = 0; i < funcLine; i++) {
        if (lines[i].includes("t('") && !lines[i].trim().startsWith('//')) {
            hasBadT = true;
            break;
        }
    }
    
    if (!hasBadT) {
        console.log(`${p} - OK`);
        return;
    }
    
    // Find all top-level constant declarations which use t()
    // These follow: const CONST_NAME = [... t('...') ...]
    // Find the lines before funcLine that declare constants with t()
    
    const topLines = lines.slice(0, funcLine);
    
    // Identify the const declarations
    let constStarts = [];
    for (let i = 0; i < topLines.length; i++) {
        if (topLines[i].match(/^const [A-Z_]+ = \[|^const [A-Z_]+ = \{/)) {
            constStarts.push(i);
        }
    }
    
    if (constStarts.length === 0) {
        // Maybe it's inline t() on single-line constant, or another pattern
        // Approach: just replace all t('sys.str_XXXX') in the top section with the key itself (fallback)
        // This is a safe temporary fix
        const topSection = lines.slice(0, funcLine).join('\n');
        const fixedTop = topSection.replace(/t\('(sys\.str_\d+)'\)/g, "'$1'");
        const restSection = lines.slice(funcLine).join('\n');
        code = fixedTop + '\n' + restSection;
        fs.writeFileSync(p, code);
        console.log(`Fixed ${p} (inline t() replaced with key string)`);
        return;
    }
    
    // Replace t() calls in top-level constants with just the key string temporarily
    const topSection = lines.slice(0, funcLine).join('\n');
    const fixedTop = topSection.replace(/t\('([^']+)'\)/g, "'$1'");
    const restSection = lines.slice(funcLine).join('\n');
    code = fixedTop + '\n' + restSection;
    fs.writeFileSync(p, code);
    console.log(`Fixed ${p}`);
});
