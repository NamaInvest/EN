const fs = require('fs');

// 1. Fix finance/assets — still has raw jwt.verify
let c = fs.readFileSync('src/app/api/finance/assets/route.ts', 'utf8');
// Replace both jwt.verify blocks (GET + POST)
c = c.split(
  "        const authHeader = req.headers.get('Authorization');\r\n        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });\r\n        const decoded = jwt.verify(authHeader.split(' ')[1], (process.env.JWT_SECRET as string));\r\n        if (!decoded) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });"
).join(
  "        const auth = getUserFromRequest(req as any);\r\n        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });\r\n        const decoded = auth;"
);
// Fix require → static (dynamic is fine too, but this avoids ts-expect-error)
c = c.replace("        const { getNextNumber } = require('@/lib/numbering');", "        const { getNextNumber } = require('@/lib/numbering'); // eslint-disable-line @typescript-eslint/no-var-requires");
fs.writeFileSync('src/app/api/finance/assets/route.ts', c);
console.log('Fixed: finance/assets');

// 2. delivery-notes — missing import
c = fs.readFileSync('src/app/api/sales/delivery-notes/route.ts', 'utf8');
if (!c.includes('getUserFromRequest')) {
  c = "import { getUserFromRequest } from '@/lib/auth';\n" + c;
  fs.writeFileSync('src/app/api/sales/delivery-notes/route.ts', c);
  console.log('Fixed: delivery-notes');
} else {
  console.log('SKIP delivery-notes (already has import)');
}

// 3. stock/movements — missing import
c = fs.readFileSync('src/app/api/stock/movements/route.ts', 'utf8');
if (!c.includes('getUserFromRequest')) {
  c = "import { getUserFromRequest } from '@/lib/auth';\n" + c;
  fs.writeFileSync('src/app/api/stock/movements/route.ts', c);
  console.log('Fixed: stock/movements');
} else {
  console.log('SKIP stock/movements (already has import)');
}
