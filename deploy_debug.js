const { Client } = require('ssh2');
const path = require('path');
const util = require('util');

const conn = new Client();

conn.on('ready', () => {
    console.log('SSH Ready. Querying Live DB for API Key...');
    conn.sftp(async (err, sftp) => {
        if (err) throw err;
        const fastPutAsync = util.promisify(sftp.fastPut).bind(sftp);
        const execAsync = util.promisify(conn.exec).bind(conn);

        try {
            const nodeDomain = '/www/wwwroot/n1.namainvist.com';
            const localPath = path.join(__dirname, 'debug_key.ts');
            const remotePath = `${nodeDomain}/debug_key.ts`;

            await fastPutAsync(localPath, remotePath);
            
            const stream = await execAsync(`cd ${nodeDomain} && npx tsx debug_key.ts`);
            await new Promise(res => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => {
                    res();
                });
            });
            conn.end();
        } catch (error) {
            console.error(error);
            conn.end();
        }
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
