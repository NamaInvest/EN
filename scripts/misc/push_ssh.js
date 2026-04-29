const { Client } = require('ssh2');
const fs = require('fs');

const servers = [
    { id: 1, ip: '95.216.59.87', pass: 'Namasoft2024$' },
    { id: 3, ip: '65.21.203.204', pass: '_ee4SWbxLVfH9b' },
    { id: 4, ip: '65.21.203.116', pass: '_ee4SWbxLVfH9b' },
    { id: 5, ip: '95.217.202.247', pass: 'Namasoft2024$' },
    { id: 6, ip: '135.181.185.197', pass: 'Namasoft2025$$' },
    { id: 7, ip: '37.27.189.155', pass: 'Namasoft2025$$' },
    { id: 8, ip: '195.201.200.78', pass: 'Namasoft2025$$' },
    { id: 9, ip: '195.201.202.131', pass: 'Namasoft2025$$' },
    { id: 10, ip: '195.201.203.48', pass: 'Namasoft2025$$' }
];

const deployToNode = (svr) => {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
             console.log('[n' + svr.id + '] Connected. Uploading i18n.tsx...');
             conn.sftp((err, sftp) => {
                 if(err) { conn.end(); return reject(err); }
                 const remotePath = '/www/wwwroot/n' + svr.id + '.namainvist.com/src/lib/i18n.tsx';
                 const readStream = fs.createReadStream('src/lib/i18n.tsx');
                 const writeStream = sftp.createWriteStream(remotePath);
                 writeStream.on('close', () => {
                     console.log('[n' + svr.id + '] Uploaded. Triggering build...');
                     // Trigger async script so we don't hang SSH sessions globally
                     const cmd = "echo 'cd /www/wwwroot/n" + svr.id + ".namainvist.com && /www/server/nodejs/v22.11.0/bin/npm run build && /www/server/nodejs/v22.11.0/bin/pm2 restart n" + svr.id + "' > /root/deploy_n" + svr.id + ".sh && bash /root/deploy_n" + svr.id + ".sh > /root/deploy_n" + svr.id + ".log 2>&1 &";
                     conn.exec(cmd, (err, stream) => {
                         if(err) { conn.end(); return reject(err); }
                         stream.on('close', () => {
                             console.log('[n' + svr.id + '] Build started in background. Deploy logged to /root/deploy_n' + svr.id + '.log');
                             conn.end();
                             resolve();
                         }).on('data', d => process.stdout.write(d.toString()));
                     });
                 });
                 writeStream.on('error', reject);
                 readStream.pipe(writeStream);
             });
        }).on('error', (err) => { console.log('[n' + svr.id + '] ERROR: ' + err.message); resolve(); }).connect({
            host: svr.ip, port: 22, username: 'root', password: svr.pass, readyTimeout: 20000
        });
    });
};

(async () => {
   for (let s of servers) {
       await deployToNode(s);
   }
   console.log('All nodes triggered for completely static language deployment!');
})();
