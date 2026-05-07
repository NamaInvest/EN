const fs = require('fs');

const file = 'src/app/api/fixed-assets/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
`    const { getUserFromRequest: _getAuth } = require('@/lib/auth');
    if (!_getAuth(request)) return NextResponse.json({ error: 'UnauthorizedUnauthorizedUnauthorized UnauthorizedUnauthorizedUnauthorizedUnauthorized' }, { status: 401 });
    const { getUserFromRequest: _getAuth } = require('@/lib/auth');
    const _auth = _getAuth(request);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });`,

`    const { getUserFromRequest: _getAuth } = require('@/lib/auth');
    if (!_getAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });`
);

// also handle carriage returns just in case
content = content.replace(/const \{ getUserFromRequest: _getAuth \} = require\('@\/lib\/auth'\);\r?\n\s*if \(!_getAuth\(request\)\) return NextResponse\.json\(\{ error: 'UnauthorizedUnauthorizedUnauthorized UnauthorizedUnauthorizedUnauthorizedUnauthorized' \}, \{ status: 401 \}\);\r?\n\s*const \{ getUserFromRequest: _getAuth \} = require\('@\/lib\/auth'\);\r?\n\s*const _auth = _getAuth\(request\);\r?\n\s*if \(!_auth\) return NextResponse\.json\(\{ error: 'غير مصرح' \}, \{ status: 401 \}\);/, 
`    const { getUserFromRequest: _getAuth } = require('@/lib/auth');\n    if (!_getAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });`);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed fixed-assets/route.ts');
