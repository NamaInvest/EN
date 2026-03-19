const { Client } = require('ssh2');

const hostIp = '46.4.188.170';
const sshUser = 'root';
const sshPass = '_ee4SWbxLVfH9b';

console.log('Patching package.json on n1 Server...');

const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        sftp.fastPut('d:/namasoft9-3-main/package.json', '/www/wwwroot/n1.namainvist.com/package.json', (e) => {
            if (e) throw e;
            console.log('package.json uploaded. Restarting whatsapp-worker...');
            
            const cmd = `export PATH=$PATH:/www/server/nvm/versions/node/v24.14.0/bin && cd /www/wwwroot/n1.namainvist.com && pm2 restart whatsapp-worker && sleep 2 && pm2 logs whatsapp-worker --lines 20 --nostream`;
            conn.exec(cmd, (e2, stream) => {
                if (e2) throw e2;
                stream.on('data', d => process.stdout.write(`[${hostIp}] ${d.toString()}`));
                stream.stderr.on('data', d => process.stderr.write(`[${hostIp}] ERR: ${d.toString()}`));
                stream.on('close', (code) => {
                    console.log(`[${hostIp}] Done with code ${code}`);
                    conn.end();
                });
            });
        });
    });
}).connect({host: hostIp, port: 22, username: sshUser, password: sshPass});
