const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if(err) { conn.end(); return console.error(err); }
        sftp.fastPut('src/components/LanguageSwitcher.tsx', '/www/wwwroot/n2.namainvist.com/src/components/LanguageSwitcher.tsx', (err) => {
            if(err) { conn.end(); return console.error(err); }
            console.log("Uploaded LanguageSwitcher. Rebuilding...");
            conn.exec('export PATH=/www/server/nodejs/v22.11.0/bin:$PATH && cd /www/wwwroot/n2.namainvist.com && npm run build', (err, stream) => {
                stream.on('close', (code) => {
                    console.log("Build Exit code:", code);
                    if (code === 0) {
                        conn.exec('export PATH=/www/server/nodejs/v22.11.0/bin:$PATH && pm2 restart n2', (e, s) => {
                            s.on('close', () => conn.end());
                        });
                    } else {
                        conn.end();
                    }
                })
                .on('data', d => process.stdout.write(d.toString()))
                .stderr.on('data', d => process.stderr.write(d.toString()));
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
