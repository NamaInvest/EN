const { Client } = require('ssh2');

const file = { local: 'c:\\Users\\1\\Desktop\\alfa\\src\\lib\\i18n.tsx', remotePath: 'src/lib/i18n.tsx' };
const conn = new Client();

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        console.log('Uploading i18n.tsx to n2...');
        sftp.fastPut(file.local, '/www/wwwroot/n2.namainvist.com/' + file.remotePath, (err) => {
            if (err) throw err;
            console.log('Rebuilding n2...');
            conn.exec('cd /www/wwwroot/n2.namainvist.com && rm -rf .next && npm run build && pm2 restart n2', (execErr, execStream) => {
                execStream.on('data', d => process.stdout.write(d));
                execStream.on('close', (code) => {
                    console.log('n2 rebuild complete:', code);
                    conn.end();
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
