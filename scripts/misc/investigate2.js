const fs = require('fs');

// The pattern for all these files is the same - they have module-level constants using t().
// The fix for all is the same: convert them to functions that accept t as param.

// Instead of fixing each individually, let's just add a "safe t" function at the top of each file.
// Actually the REAL fix is to make these arrays be computed inside the component function.

// Strategy: for each bad file, find the top-level constant arrays using t() and wrap them in:
// const CONST_NAME = useMemo(() => [...], [t]); inside the component.
// OR: make them functions.

// Let's go file by file, auto-replacing with static Arabic text for the most common ones like types.

const fixes = [
    {
        file: 'src/app/(dashboard)/reports/page.tsx',
        // Will handle by wrapping in a function
        action: 'inspect'
    },
    {
        file: 'src/app/(dashboard)/fixed-assets/page.tsx',
        action: 'inspect'
    },
];

['src/app/(dashboard)/reports/page.tsx', 'src/app/(dashboard)/fixed-assets/page.tsx', 'src/app/invoice/[id]/page.tsx', 'src/app/(dashboard)/reports/73-modules/page.tsx'].forEach(p => {
    const code = fs.readFileSync(p, 'utf8');
    const lines = code.split('\n');
    const funcLine = lines.findIndex(l => l.match(/^export default function|^function [A-Z]/));
    const badLines = [];
    for (let i = 0; i < Math.min(funcLine < 0 ? 200 : funcLine, lines.length); i++) {
        if (lines[i].includes("t('") && !lines[i].trim().startsWith('//')) {
            badLines.push(`  ${i+1}: ${lines[i].substring(0, 80)}`);
        }
    }
    console.log(`\n${p} (funcLine=${funcLine}):\n${badLines.join('\n')}`);
});
