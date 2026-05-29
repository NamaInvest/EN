const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        sftp.fastGet('/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/sales/page.tsx', 'src/app/(dashboard)/sales/page.tsx', (err) => {
            if (err) throw err;
            console.log('Successfully recovered page.tsx from N11!');
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD'
});
