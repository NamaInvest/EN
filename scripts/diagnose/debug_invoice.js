const fs = require('fs');
const p = 'src/app/invoice/[id]/page.tsx';
let code = fs.readFileSync(p, 'utf8');

// This is a server component (async function) - it uses useTranslation which is incorrect for SSR
// t() here is inside the return/JSX but the scanner catches it because funcLine checking is wrong for async components
// Let's check if it's actually in JSX (which is fine) or in module scope

// Find the async function
const asyncFuncIdx = code.indexOf('export default async function');
const firstT = code.indexOf("t('");

if (firstT < asyncFuncIdx) {
    console.log('t() appears before export default async function at index', firstT);
    console.log('Context:', code.substring(Math.max(0, firstT-50), firstT+100));
} else {
    console.log('t() appears INSIDE the function (OK for Next.js server component if t is a local var).');
    // This is fine, the scanner was wrong
    console.log('t first appears at index', firstT, 'function at', asyncFuncIdx);
    
    // But wait - useTranslation hook can't be used in server components!
    // Find how t is defined in this file
    const tDef = code.indexOf('const { t }');
    console.log('t defined at index:', tDef);
    console.log('Context:', code.substring(tDef-10, tDef+100));
}
