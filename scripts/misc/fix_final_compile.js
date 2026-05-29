const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        const files = [
            'src/app/pos/page.tsx',
            'src/app/restaurant-pos/page.tsx',
            'src/app/(dashboard)/sales/page.tsx'
        ];
        
        let pending = files.length;
        files.forEach(f => {
            sftp.fastPut(f, `/www/wwwroot/n1.namainvist.com/${f}`, err => {
                console.log('Uploaded', f);
                if (--pending === 0) finish();
            });
        });
        
        function finish() {
            console.log('All files uploaded. Rebuilding...');
            conn.exec('cd /www/wwwroot/n1.namainvist.com && npm run build && fuser -k 3001/tcp ; pm2 restart nama-main', (err, stream) => {
                stream.on('data', d => process.stdout.write(d)).stderr.on('data', d => process.stderr.write(d)).on('close', (c) => {
                    console.log(`Done! Exit code: ${c}`);
                    conn.end();
                });
            });
        }
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
