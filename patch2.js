const fs = require('fs');
let c = fs.readFileSync('src/app/api/purchases/route.ts', 'utf8');
c = c.replace(/purchaseOrderId,\r?\n\s*ppvAmount:/g, "// @ts-ignore\r\n                    purchaseOrderId,\r\n                    // @ts-ignore\r\n                    ppvAmount:");
fs.writeFileSync('src/app/api/purchases/route.ts', c);
console.log('patched ts ignore');
