const fs = require('fs');
const path = require('path');

const targetFiles = [
    'src/app/api/employees/route.ts',
    'src/app/api/salaries/route.ts',
    'src/app/api/banks/route.ts',
    'src/app/api/banks/[id]/transactions/route.ts',
    'src/app/api/tenant/create/route.ts',
    'src/app/api/auth/sync/route.ts'
];

function getFilesRecursively(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFilesRecursively(file));
        } else {
            if (file.endsWith('route.ts')) results.push(file);
        }
    });
    return results;
}

try {
    const fixedAssetsFiles = getFilesRecursively('src/app/api/fixed-assets');
    targetFiles.push(...fixedAssetsFiles);
} catch (e) {}

const authGuardCode = `    // Auth guard
    const { getUserFromRequest: _getAuth } = require('@/lib/auth');
    const _auth = _getAuth(request);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
`;

let fixedCount = 0;

for (const file of targetFiles) {
    if (!fs.existsSync(file)) continue;
    let code = fs.readFileSync(file, 'utf8');
    let modified = false;

    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    
    for (const method of methods) {
        // [\\s\\S]*? matches any characters including newlines non-greedily up to the next {
        const regexStr = "export(?:\\\\s+async)?\\\\s+function\\\\s+" + method + "\\\\s*\\\\([^)]*\\\\)[\\\\s\\\\S]*?\\\\{";
        const regex = new RegExp(regexStr, 'g');
        
        let match;
        while ((match = regex.exec(code)) !== null) {
            const blockStart = match.index + match[0].length;
            const nextCode = code.substring(blockStart, blockStart + 200);
            if (!nextCode.includes('_getAuth') && !nextCode.includes('auth()') && !nextCode.includes('getServerSession')) {
                // Ensure it's not a generic file
                if (file.includes('auth/sync') || file.includes('tenant/create') || file.includes('fixed-assets') || file.includes('banks') || file.includes('salaries') || file.includes('employees')) {
                    code = code.substring(0, blockStart) + '\n' + authGuardCode + code.substring(blockStart);
                    modified = true;
                }
            }
        }
    }

    if (modified) {
        fs.writeFileSync(file, code);
        console.log('Fixed auth in: ' + file);
        fixedCount++;
    }
}

console.log('Total files fixed: ' + fixedCount);
