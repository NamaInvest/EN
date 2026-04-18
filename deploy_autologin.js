const { Client } = require('ssh2');
const conn = new Client();
const N11 = '/www/wwwroot/n11.namainvist.com';

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) { console.error(err); conn.end(); return; }
        sftp.fastPut('d:/namasoft9-3-main/src/app/auto-login/page.tsx', `${N11}/src/app/auto-login/page.tsx`, {}, (e) => {
            if (e) { console.error('Upload failed:', e.message); conn.end(); return; }
            console.log('✅ auto-login/page.tsx uploaded');
            conn.exec(`
cd ${N11}
echo "🔨 Building saas-app..."
npm run build 2>&1 | tail -5
pm2 restart saas-app
echo "✅ saas-app restarted"
pm2 list | grep -E "saas|main"
            `, (err2, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => { console.log('\n🎉 Done!'); conn.end(); });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
