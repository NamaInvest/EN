const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const conn = new Client();

// Fix locally first
const FILES = [
    'src/app/api/purchases/ocr/route.ts',
    'src/app/api/stocktake/vision/route.ts',
    'src/app/api/ai-cfo/route.ts',
    'src/app/api/ai-cfo/report/route.ts',
    'src/app/api/ai-auditor/route.ts',
];

// Update locally
let localFixed = 0;
for (const f of FILES) {
    const full = path.join(__dirname, f);
    if (!fs.existsSync(full)) continue;
    const content = fs.readFileSync(full, 'utf8');
    const updated = content
        .split('gemini-1.5-flash').join('gemini-2.0-flash-lite')
        .split('gemini-2.0-flash"').join('gemini-2.0-flash-lite"')  // don't change gemini-2.0-flash-lite
        .split('gemini-1.5-pro').join('gemini-2.0-flash-lite');
    if (updated !== content) {
        fs.writeFileSync(full, updated, 'utf8');
        console.log('✅ Local fixed:', f);
        localFixed++;
    }
}
console.log(`Fixed ${localFixed} files locally`);

// Deploy to N11
conn.on('ready', () => {
    console.log('\nConnected to N11...');

    // On server: sed replace all models, then rebuild
    const serverCmd = `
echo "Fixing model names on N11..."
find /www/wwwroot/n11.namainvist.com/src -name "*.ts" -exec sed -i \\
    -e 's/gemini-1\\.5-flash/gemini-2.0-flash-lite/g' \\
    -e 's/gemini-1\\.5-pro/gemini-2.0-flash-lite/g' \\
    -e 's/models\\/gemini-1\\.5-flash/models\\/gemini-2.0-flash-lite/g' \\
    {} \\;

echo "Verifying fix..."
grep -r "gemini-" /www/wwwroot/n11.namainvist.com/src/app/api/ --include="*.ts" | grep -v "node_modules"

cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -5
pm2 restart n11
pm2 save
echo "DONE_OK"
`;

    conn.exec(serverCmd, (err, stream) => {
        if (err) { conn.end(); return; }
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
            console.log('\n✅ N11 updated to gemini-2.0-flash-lite');
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170', port: 22,
    username: 'root', password: '_ee4SWbxLVfH9b'
});
