const fs = require('fs');

// Fix barcode page - find the constant using t()
{
    const p = 'src/app/(dashboard)/barcode/page.tsx';
    let code = fs.readFileSync(p, 'utf8');
    // Find the line number of the first t( before function
    const lines = code.split('\n');
    const funcLine = lines.findIndex(l => l.match(/^export default function/));
    for (let i = 0; i < Math.min(funcLine, lines.length); i++) {
        if (lines[i].includes("t('")) {
            console.log(`barcode line ${i+1}: ${lines[i]}`);
        }
    }
}

// Fix settings page
{
    const p = 'src/app/(dashboard)/settings/page.tsx';
    let code = fs.readFileSync(p, 'utf8');
    const lines = code.split('\n');
    const funcLine = lines.findIndex(l => l.match(/^export default function/));
    for (let i = 0; i < Math.min(funcLine, lines.length); i++) {
        if (lines[i].includes("t('")) {
            console.log(`settings line ${i+1}: ${lines[i]}`);
        }
    }
}
