const { Client } = require('ssh2');
const conn = new Client();
const N11 = '/www/wwwroot/n11.namainvist.com';

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) { console.error(err); conn.end(); return; }
        sftp.fastPut('c:/Users/1/Desktop/alfa/src/lib/prisma.ts', `${N11}/src/lib/prisma.ts`, {}, (e3) => {
             console.log('🎉 Done uploading prisma.ts');
             conn.exec(`cd ${N11} && npm run build && pm2 reload saas-app`, (err2, stream) => {
                 stream.on('data', d => process.stdout.write(d.toString()));
                 stream.stderr.on('data', d => process.stderr.write(d.toString()));
                 stream.on('close', () => { console.log('🎉 Done restarting saas-app'); conn.end(); });
             });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
