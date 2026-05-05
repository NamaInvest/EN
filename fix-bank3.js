const fs = require('fs');

let code = fs.readFileSync('src/lib/bank-reconciliation.ts', 'utf8');

// Replace closingBalance, with closingBalance, fileFormat: 'CSV', importMethod: 'MANUAL', currency: 'SAR',
code = code.replace(/closingBalance,\n/g, "closingBalance,\n                fileFormat: 'CSV',\n                importMethod: 'MANUAL',\n                currency: 'SAR',\n");

fs.writeFileSync('src/lib/bank-reconciliation.ts', code);
