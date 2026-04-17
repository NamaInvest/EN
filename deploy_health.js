const { Client } = require('ssh2');
const conn = new Client();
const N11 = '/www/wwwroot/n11.namainvist.com';

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) { console.error(err); conn.end(); return; }
        
        sftp.fastPut('d:/namasoft9-3-main/src/app/api/health/route.ts', `${N11}/src/app/api/health/route.ts`, {}, (e) => {
            if (e) {
                console.error("FAIL", e);
                conn.end();
                return;
            }
            conn.exec(`
cd ${N11}
npm run build 2>&1 | tail -6
pm2 restart saas-app
`, (e2, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => { console.log('🎉 Done Updating Health API'); conn.end(); });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 });
