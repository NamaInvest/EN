const fs = require('fs');
let c = fs.readFileSync('src/components/InvoiceReceipt.tsx', 'utf8');

if (!c.includes('import { RiyalLogo }')) {
    c = c.replace(/import React, \{ useRef, useEffect, useState \} from 'react';/,
        "import React, { useRef, useEffect, useState } from 'react';\nimport { RiyalLogo } from '@/components/RiyalLogo';");
}


// Replace t('sys.str_68') in A4 template with SVG logo explicitly at the GrandTotal
// In A4 it is: <span>${formatCurrency(data.grandTotal)} ${t('sys.str_68')}</span>
const a4Svg = `<svg width="16" height="16" viewBox="0 0 100 100" fill="currentColor" style="display:inline-block;vertical-align:middle;margin-right:4px"><path d="M42.5 10 L42.5 50 L20 55 L20 40 L30 37.5 L30 10 Z"></path><path d="M42.5 58 L42.5 75 C 42.5 85, 30 90, 15 90 L 15 78 C 25 78, 30 75, 30 65 L 30 60 L 20 62 L 20 48 Z"></path><path d="M57.5 10 L57.5 60 L80 55 L80 40 L67.5 42.5 L67.5 10 Z"></path><path d="M57.5 68 L57.5 90 L85 85 L85 75 L67.5 78 L67.5 68 Z"></path></svg>`;

c = c.replace(/<span>\$\{formatCurrency\(data\.grandTotal\)\} \$\{t\('sys\.str_68'\)\}<\/span>/g,
    `<span>\${formatCurrency(data.grandTotal)} ${a4Svg}</span>`);


// In Thermal it is: {formatCurrency(data.grandTotal)} {t('sys.str_68')} --> Wait, earlier I deleted `{t('sys.str_68')}` for Thermal?
// Let's replace the whole cell containing data.grandTotal
c = c.replace(/<td style=\{\{ padding: '8px', textAlign: 'center', fontSize: '14px', fontWeight: '900', border: '1px solid #000', borderWidth: '1px', background: '#f9f9f9', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' \}\}>\s*\{formatCurrency\(data\.grandTotal\)\}\s*<\/td>/g,
    `<td style={{ padding: '8px', textAlign: 'center', fontSize: '14px', fontWeight: '900', border: '1px solid #000', borderWidth: '1px', background: '#f9f9f9', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>{formatCurrency(data.grandTotal)} <RiyalLogo width={12} height={12} color="#000" /></td>`);


// Wait! For A4, I actually used "flex" in the GrandTotal inside the split-total earlier? Let me do a flexible replace.
c = c.replace(/\{formatCurrency\(data\.grandTotal\)\}\s*<\/td>/, "{formatCurrency(data.grandTotal)} <RiyalLogo width={12} height={12} color=\"#000\" /></td>");

fs.writeFileSync('src/components/InvoiceReceipt.tsx', c);
console.log('done');
