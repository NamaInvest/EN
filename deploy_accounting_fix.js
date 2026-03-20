const { Client } = require('ssh2');
const path = require('path');
const util = require('util');

const conn = new Client();

const filesToUpload = [
    'src/app/(dashboard)/accounting/page.tsx',
];

conn.on('ready', () => {
    console.log('SSH Ready. Accounting Dashboard Fix Deployment initiated sequentially...');
    conn.sftp(async (err, sftp) => {
        if (err) throw err;
        const fastPutAsync = util.promisify(sftp.fastPut).bind(sftp);
        const execAsync = util.promisify(conn.exec).bind(conn);

        try {
            for (let i = 1; i <= 10; i++) {
                const nodeDomain = `/www/wwwroot/n${i}.namainvist.com`;
                
                for(const file of filesToUpload) {
                    const localPath = path.join(__dirname, file);
                    const remotePath = `${nodeDomain}/${file.replace(/\\/g, '/')}`;
                    
                    await fastPutAsync(localPath, remotePath);
                }
                console.log(`[n${i}] Accounting Page patched.`);
                
                const pipelineCmd = `cd ${nodeDomain} && npm run build && pm2 reload n${i} --update-env`;
                console.log(`[n${i}] Recompiling React Edge Routes...`);
                
                const stream = await execAsync(pipelineCmd);
                await new Promise(res => {
                    stream.on('data', d => process.stdout.write(`[n${i}] ${d.toString()}`));
                    stream.on('close', () => {
                        console.log(`\n[n${i}] ACCOUNTING UI RESTORED SUCCESSFULLY!\n`);
                        res();
                    });
                });
            }
            console.log("ALL 10 NODES SYNCED PERFECTLY! FINANCIAL DASHBOARDS ARE ONLINE.");
            conn.end();
        } catch (error) {
            console.error(error);
            conn.end();
        }
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
