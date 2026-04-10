const fs = require('fs');
let c = fs.readFileSync('src/components/InvoiceReceipt.tsx', 'utf8');
c = c.replace(/\\\${/g, '${').replace(/\\\`/g, '`');
fs.writeFileSync('src/components/InvoiceReceipt.tsx', c);
