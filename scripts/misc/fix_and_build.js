const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const fn1 = 'src/app/(dashboard)/accounting/banks/page.tsx';
        const fn2 = 'src/app/(dashboard)/shl/classes/page.tsx';
        sftp.fastPut(fn1, `/www/wwwroot/n1.namainvist.com/${fn1}`, (err1) => {
            sftp.fastPut(fn2, `/www/wwwroot/n1.namainvist.com/${fn2}`, (err2) => {
                console.log('Files uploaded. Building...');
                conn.exec('cd /www/wwwroot/n1.namainvist.com && npm run build && pm2 restart nama-main', (err, stream) => {
                    stream.on('data', d => process.stdout.write(d)).stderr.on('data', d => process.stderr.write(d)).on('close', () => {
                        console.log('Done!');
                        conn.end();
                    });
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
