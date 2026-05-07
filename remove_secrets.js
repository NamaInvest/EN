const fs = require('fs');
const path = require('path');

const files = [
    'src/lib/auth.ts',
    'src/lib/b2b-auth.ts',
    'src/app/api/auth/mfa/qr-code/route.ts',
    'src/lib/mfa-engine.ts',
    'src/app/api/ice/auth/route.ts',
    'src/app/api/ice/tenants/route.ts',
    'src/app/api/ice/toggle/route.ts'
];

for (const file of files) {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) continue;

    let content = fs.readFileSync(fullPath, 'utf8');

    // Replace JWT_SECRET
    content = content.replace(
        /const JWT_SECRET = process\.env\.JWT_SECRET;\nif \(!JWT_SECRET\) console\.error\('CRITICAL: JWT_SECRET is not set in environment variables! Security risk!'\);/g,
        `const JWT_SECRET = process.env.JWT_SECRET;\nif (!JWT_SECRET) throw new Error('CRITICAL: JWT_SECRET is not set in environment variables! Security risk!');`
    );

    // Replace ENCRYPTION_KEY
    content = content.replace(
        /const ENCRYPTION_KEY = process\.env\.ENCRYPTION_KEY;\nif \(!ENCRYPTION_KEY \|\| Buffer\.from\(ENCRYPTION_KEY\)\.length !== 32\) console\.error\('CRITICAL: ENCRYPTION_KEY must be exactly 32 bytes in environment variables!'\);/g,
        `const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;\nif (!ENCRYPTION_KEY || Buffer.from(ENCRYPTION_KEY).length !== 32) throw new Error('CRITICAL: ENCRYPTION_KEY must be exactly 32 bytes in environment variables!');`
    );

    // Replace ICE_SECRET
    content = content.replace(
        /const ICE_SECRET = process\.env\.ICE_SECRET;\nif \(!ICE_SECRET\) console\.error\('CRITICAL: ICE_SECRET is not set in environment variables!'\);/g,
        `const ICE_SECRET = process.env.ICE_SECRET;\nif (!ICE_SECRET) throw new Error('CRITICAL: ICE_SECRET is not set in environment variables!');`
    );

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Patched secrets to throw errors in ${file}`);
}
