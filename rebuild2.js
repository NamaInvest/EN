const { Client } = require('ssh2');
const conn = new Client();
const MASTER = '/www/wwwroot/n11.namainvist.com';

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        sftp.fastPut('d:/namasoft9-3-main/src/lib/prisma.ts', `${MASTER}/src/lib/prisma.ts`, {}, (e) => {
            if (e) { console.error('Upload error:', e.message); conn.end(); return; }
            console.log('✅ prisma.ts uploaded');

            const cmd = `
cd ${MASTER}
rm -rf .next
echo "🔨 Building..."
npm run build 2>&1 | grep -E "error|warn|Error|✓|✗|Route|compiled" | tail -20
echo "=== BUILD_ID check ==="
ls .next/BUILD_ID 2>/dev/null && echo "✅ Build SUCCESS" || echo "❌ Build FAILED"
`;
            conn.exec(cmd, (execErr, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => {
                    console.log('Build phase done');
                    conn.end();
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
