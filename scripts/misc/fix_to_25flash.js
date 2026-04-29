const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const WORKING_MODEL = 'gemini-2.5-flash';

// Fix all local files
const FILES = [
    'src/app/api/purchases/ocr/route.ts',
    'src/app/api/stocktake/vision/route.ts',
    'src/app/api/ai-cfo/route.ts',
    'src/app/api/ai-cfo/report/route.ts',
    'src/app/api/ai-auditor/route.ts',
];

for (const f of FILES) {
    const full = path.join(__dirname, f);
    if (!fs.existsSync(full)) continue;
    let content = fs.readFileSync(full, 'utf8');
    // Replace any gemini model reference
    content = content.replace(/gemini-[\d\.]+-flash(-lite)?(-\d+)?/g, WORKING_MODEL);
    content = content.replace(/gemini-[\d\.]+-pro(-\d+)?/g, WORKING_MODEL);
    content = content.replace(/gemini-2\.0-flash-lite/g, WORKING_MODEL);
    fs.writeFileSync(full, content, 'utf8');
    console.log('✅ Local fixed:', f);
}

// Fix and rebuild on N11
const conn = new Client();
conn.on('ready', () => {
    console.log('\nConnected to N11, fixing server-side...');

    const serverCmd = `
echo "Replacing model names with ${WORKING_MODEL}..."
find /www/wwwroot/n11.namainvist.com/src -name "*.ts" -exec sed -i \\
  -e 's/gemini-2\\.0-flash-lite/gemini-2.5-flash/g' \\
  -e 's/gemini-1\\.5-flash/gemini-2.5-flash/g' \\
  -e 's/gemini-2\\.0-flash-001/gemini-2.5-flash/g' \\
  {} \\;

echo "Verifying OCR route..."
grep "gemini" /www/wwwroot/n11.namainvist.com/src/app/api/purchases/ocr/route.ts

cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -5
pm2 restart n11 && pm2 save
echo "FINAL_DONE"
`;

    conn.exec(serverCmd, (err, stream) => {
        if (err) { conn.end(); return; }
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
            console.log('\n🚀 N11 now uses', WORKING_MODEL);
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170', port: 22,
    username: 'root', password: '_ee4SWbxLVfH9b'
});
