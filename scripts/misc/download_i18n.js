const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();
conn.on('ready', () => {
    console.log('Downloading i18n.tsx from N1 (known working base)...');
    conn.sftp((err, sftp) => {
        if (err) { console.error(err); conn.end(); return; }
        sftp.fastGet('/www/wwwroot/n1.namainvist.com/src/lib/i18n.tsx', 'src/lib/i18n_from_server.tsx', (err) => {
            if (err) console.error('Download error:', err.message);
            else console.log('Downloaded to src/lib/i18n_from_server.tsx');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
