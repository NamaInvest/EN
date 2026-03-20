const { Client } = require('ssh2');
const path = require('path');
const util = require('util');

const conn = new Client();
const filesToUpload = ['src/app/api/sales/route.ts'];

conn.on('ready', () => {
    console.log('SSH Ready. Fast SFTP Rescue initiated...');
    conn.sftp(async (err, sftp) => {
        if (err) throw err;
        const fastPutAsync = util.promisify(sftp.fastPut).bind(sftp);
        const execAsync = util.promisify(conn.exec).bind(conn);

        try {
            const promises = [];
            for (let i = 1; i <= 10; i++) {
                promises.push((async () => {
                    const localPath = path.join(__dirname, filesToUpload[0]);
                    const remotePath = `/www/wwwroot/n${i}.namainvist.com/${filesToUpload[0].replace(/\\/g, '/')}`;
                    await fastPutAsync(localPath, remotePath);
                    console.log(`[n${i}] Uploaded route.ts`);
                    
                    const stream = await execAsync(`cd /www/wwwroot/n${i}.namainvist.com && npm run build && pm2 reload n${i} --update-env`);
                    await new Promise(res => {
                        stream.on('data', d => console.log(`[n${i}] ${d.toString().trim()}`));
                        stream.on('close', () => {
                            console.log(`[n${i}] REPAIRED & ONLINE!`);
                            res();
                        });
                    });
                })());
            }
            await Promise.all(promises);
            console.log("FAST RESCUE COMPLETE! ALL 10 NODES REBUILT PARALLELLY.");
            conn.end();
        } catch (error) {
            console.error(error);
            conn.end();
        }
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
