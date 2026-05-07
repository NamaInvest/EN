const fs = require('fs');

const files = [
    'src/app/api/employees/route.ts',
    'src/app/api/salaries/route.ts',
    'src/app/api/banks/route.ts',
    'src/app/api/banks/[id]/transactions/route.ts',
    'src/app/api/tenant/create/route.ts',
    'src/app/api/auth/sync/route.ts',
    'src/app/api/webhooks/zid/route.ts',
    'src/app/api/fixed-assets/route.ts',
    'src/app/api/fixed-assets/[id]/route.ts',
    'src/app/api/fixed-assets/[id]/depreciate/route.ts',
    'src/app/api/settings/route.ts',
    'src/app/api/purchases/route.ts',
    'src/app/api/sales-returns/route.ts'
];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    
    // Read the raw buffer
    const buf = fs.readFileSync(file);
    
    // Check if it has UTF-16 LE BOM (FF FE) or UTF-16 BE BOM (FE FF)
    if (buf.length >= 2 && ((buf[0] === 0xFF && buf[1] === 0xFE) || (buf[0] === 0xFE && buf[1] === 0xFF))) {
        // It's UTF-16! Let's convert to UTF-8.
        console.log(`${file} is UTF-16, converting to UTF-8...`);
        const content = buf.toString('utf16le');
        fs.writeFileSync(file, content, 'utf8');
        continue;
    }

    // Try reading as utf8
    let content = buf.toString('utf8');
    // Re-write as utf8 to ensure proper encoding and strip any weird BOMs
    fs.writeFileSync(file, content, 'utf8');
    console.log(`${file} checked and written as UTF-8.`);
}
