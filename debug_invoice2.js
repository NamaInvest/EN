const fs = require('fs');
const p = 'src/app/invoice/[id]/page.tsx';
let code = fs.readFileSync(p, 'utf8');

// invoice/[id]/page.tsx uses useTranslation() hook in an async server component.
// This is a React Hook violations - hooks can't be used in async functions.
// The fix: replace useTranslation with a simple dictionary lookup function.

// First let's see what t() is used for in this file
const matches = [...code.matchAll(/t\('([^']+)'\)/g)];
const uniqueKeys = [...new Set(matches.map(m => m[1]))];
console.log('Unique keys used:', uniqueKeys);
