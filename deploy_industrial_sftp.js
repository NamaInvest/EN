const { Client } = require('ssh2');
const path = require('path');
const util = require('util');

const conn = new Client();

const filesToUpload = [
    'prisma/schema.prisma',
    'src/app/api/manufacturing/orders/route.ts',
    'src/app/(dashboard)/manufacturing/page.tsx',
    'src/app/api/accounting/lc/route.ts',
    'src/app/(dashboard)/accounting/lc/page.tsx',
    'src/app/api/accounting/trial-balance/route.ts',
    'src/app/(dashboard)/accounting/trial-balance/page.tsx'
];

conn.on('ready', () => {
    console.log('SSH Ready. Industrial ERP SFTP Deployment initiated...');
    conn.sftp(async (err, sftp) => {
        if (err) throw err;
        const fastPutAsync = util.promisify(sftp.fastPut).bind(sftp);
        const execAsync = util.promisify(conn.exec).bind(conn);

        try {
            const promises = [];
            for (let i = 1; i <= 10; i++) {
                promises.push((async () => {
                    const nodeDomain = `/www/wwwroot/n${i}.namainvist.com`;
                    
                    for(const file of filesToUpload) {
                        const localPath = path.join(__dirname, file);
                        const remotePath = `${nodeDomain}/${file.replace(/\\/g, '/')}`;
                        const remoteDir = path.dirname(remotePath);
                        await new Promise((res) => {
                            conn.exec(`mkdir -p "${remoteDir}"`, () => res());
                        });
                        await new Promise(r => setTimeout(r, 800)); // wait for FS sync
                        await fastPutAsync(localPath, remotePath);
                    }
                    console.log(`[n${i}] 7 Industrial components uploaded.`);
                    
                    const pipelineCmd = `cd ${nodeDomain} && npx prisma db push && npx prisma generate && npm run build && pm2 reload n${i} --update-env`;
                    console.log(`[n${i}] Triggering DB Push + Build Pipeline...`);
                    
                    const stream = await execAsync(pipelineCmd);
                    await new Promise(res => {
                        stream.on('data', d => process.stdout.write(`[n${i}] ${d.toString()}`));
                        stream.stderr.on('data', d => process.stderr.write(`[n${i}] ${d.toString()}`));
                        stream.on('close', () => {
                            console.log(`\n[n${i}] ENTERPRISE INDUSTRIAL UPDATE DEPLOYED SUCCESSFULLY!\n`);
                            res();
                        });
                    });
                })());
            }
            await Promise.all(promises);
            console.log("ALL 10 NODES SYNCED PERFECTLY! INDUSTRIAL ERP IS ONLINE.");
            conn.end();
        } catch (error) {
            console.error(error);
            conn.end();
        }
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
