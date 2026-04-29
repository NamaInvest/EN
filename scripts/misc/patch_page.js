const fs = require('fs');

let c = fs.readFileSync('src/app/(dashboard)/sales/page.tsx', 'utf8');

if (!c.includes('import { RiyalLogo }')) {
    c = c.replace(/import { QRCodeCanvas } from 'qrcode\.react';/,
        "import { QRCodeCanvas } from 'qrcode.react';\nimport { RiyalLogo } from '@/components/RiyalLogo';");
}

c = c.replace(/backgroundColor: '#eef2ff'/g, "/* removed bg */");

c = c.replace(/<span>\{fmt\(total\)\} \{t\('sys\.str_68'\)\}<\/span>/g,
    "<span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{fmt(total)} <RiyalLogo width={20} height={20} color='var(--primary)' /></span>");

fs.writeFileSync('src/app/(dashboard)/sales/page.tsx', c);
console.log('done');
