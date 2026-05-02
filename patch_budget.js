const fs = require('fs');
let code = fs.readFileSync('src/lib/budget-control.ts', 'utf8');

code = code.replace(/this\.prisma\.encumbrance/g, '(this.prisma as any).encumbrance');

fs.writeFileSync('src/lib/budget-control.ts', code);
console.log('Fixed TS errors in budget-control');
