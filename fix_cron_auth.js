const fs = require('fs');
const path = require('path');

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

const targetFiles = getFilesRecursively('src/app/api/cron');

const cronGuardCode = `    // Cron security guard
    const authHeader = request.headers.get('authorization');
    if (authHeader !== \`Bearer \${process.env.CRON_SECRET || 'nama-super-secret-cron-key'}\`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
`;

let fixedCount = 0;

for (const file of targetFiles) {
    let code = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Check if it already has security
    if (code.includes('CRON_SECRET')) continue;

    const regexStr = "export(?:\\\\s+async)?\\\\s+function\\\\s+GET\\\\(request\\\\s*:\\\\s*Request(?:[^\\\\)]*)\\\\)\\\\s*\\{";
    const regex = new RegExp(regexStr, 'g');
    
    let match;
    while ((match = regex.exec(code)) !== null) {
        const blockStart = match.index + match[0].length;
        code = code.substring(0, blockStart) + '\n' + cronGuardCode + code.substring(blockStart);
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, code);
        console.log('Fixed cron auth in: ' + file);
        fixedCount++;
    }
}

console.log('Total cron files secured: ' + fixedCount);
