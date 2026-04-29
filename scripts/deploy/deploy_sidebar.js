const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        sftp.fastPut(
            'c:/Users/1/Desktop/alfa/src/components/Sidebar.tsx',
            '/www/wwwroot/n11.namainvist.com/src/components/Sidebar.tsx',
            {},
            putErr => {
                if (putErr) { console.error('Failed:', putErr.message); conn.end(); return; }
                console.log('✅ Uploaded: Sidebar.tsx');
                conn.exec(
                    'cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -15 && pm2 restart saas-app && echo "✅ DONE"',
                    (buildErr, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.stderr.on('data', d => process.stderr.write(d.toString()));
                        stream.on('close', () => { conn.end(); });
                    }
                );
            }
        );
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
