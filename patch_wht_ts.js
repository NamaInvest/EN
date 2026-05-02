const fs = require('fs');

// Fix wht-engine.ts
let engineCode = fs.readFileSync('src/lib/wht-engine.ts', 'utf8');
engineCode = engineCode.replace(/this\.prisma\.wHTRule/g, '(this.prisma as any).wHTRule');
engineCode = engineCode.replace(/this\.prisma\.wHTTransaction/g, '(this.prisma as any).wHTTransaction');
fs.writeFileSync('src/lib/wht-engine.ts', engineCode);

// Fix route.ts
let routeCode = fs.readFileSync('src/app/api/finance/wht/route.ts', 'utf8');
routeCode = routeCode.replace('pending.reduce((sum, tx)', 'pending.reduce((sum: number, tx: any)');
fs.writeFileSync('src/app/api/finance/wht/route.ts', routeCode);

console.log('Fixed TS errors in WHT module');
