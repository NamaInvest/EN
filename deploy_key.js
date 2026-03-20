const { Client } = require('ssh2');
const path = require('path');
const util = require('util');

const conn = new Client();

conn.on('ready', () => {
    console.log('SSH Ready for API Key Injection...');
    conn.sftp(async (err, sftp) => {
        if (err) throw err;
        const fastPutAsync = util.promisify(sftp.fastPut).bind(sftp);
        const execAsync = util.promisify(conn.exec).bind(conn);

        try {
            const nodeDomain = '/www/wwwroot/n1.namainvist.com';
            const localPath = path.join(__dirname, 'update_key.ts');
            const remotePath = `${nodeDomain}/update_key.ts`;

            await fastPutAsync(localPath, remotePath);
            console.log(`[n1] update_key.ts uploaded.`);
            
            console.log(`[n1] Running direct database injection...`);
            
            const stream = await execAsync(`cd ${nodeDomain} && npx tsx update_key.ts`);
            await new Promise(res => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => {
                    console.log(`\n[n1] API KEY SUCCESSFULLY INJECTED INTO CLOUD POSTGRESQL!\n`);
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
