const { Client } = require('ssh2');
const conn = new Client();
const fs = require('fs');

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const localPath = 'c:/Users/1/Desktop/alfa/src/app/login/page.tsx';
        const remotePath = '/www/wwwroot/n1.namainvist.com/src/app/login/page.tsx';
        sftp.fastPut(localPath, remotePath, (err) => {
            if (err) throw err;
            console.log("File uploaded successfully via SFTP to n1!");
            
            const buildCmd = `
                cd /www/wwwroot/n1.namainvist.com
                npm run build > build_login.log 2>&1
                pm2 restart n1
                echo "Done updating n1 bypass!"
            `;
            conn.exec(buildCmd, (err, stream) => {
                if (err) throw err;
                let out = '';
                stream.on('data', d => out += d.toString());
                stream.stderr.on('data', d => out += d.toString());
                stream.on('close', () => {
                    console.log(out);
                    conn.end();
                });
            });
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    keepaliveInterval: 10000
});
