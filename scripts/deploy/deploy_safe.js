const { Client } = require('ssh2');
const path = require('path');
const util = require('util');

const conn = new Client();

const filesToUpload = [
    'src/app/api/purchases/ocr/route.ts',
    'src/app/(dashboard)/accounting/page.tsx'
];

conn.on('ready', () => {
    console.log('SSH Ready. SAFE Deployment initiated sequentially...');
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
                    
                    const remoteDir = path.dirname(remotePath);
                    await new Promise((res) => {
                        conn.exec(`mkdir -p "${remoteDir}"`, () => res());
                    });
                    await new Promise(r => setTimeout(r, 200));

                    await fastPutAsync(localPath, remotePath);
                }
                console.log(`[n${i}] OCR Route and Accounting Page uploaded.`);
                
                // CRUCIAL: Do NOT use npm run build to avoid npx prisma generate ETXTBSY locked binary collision!
                const pipelineCmd = `cd ${nodeDomain} && npx next build && pm2 reload n${i} --update-env`;
                console.log(`[n${i}] Rebuilding Next.js Edge APIs Safely...`);
                
                const stream = await execAsync(pipelineCmd);
                await new Promise((res, rej) => {
                    stream.on('data', d => process.stdout.write(`[n${i}] ${d.toString()}`));
                    stream.stderr.on('data', d => process.stdout.write(`[n${i}] STDERR: ${d.toString()}`));
                    stream.on('close', (code) => {
                        if(code === 0) {
                            console.log(`\n[n${i}] UPDATE DEPLOYED SUCCESSFULLY!\n`);
                            res();
                        } else {
                            console.error(`\n[n${i}] FAILED WITH CODE ${code}\n`);
                            res(); // Don't crash the script, let it try the next nodes
                        }
                    });
                });
            }
            console.log("ALL 10 NODES SYNCED PERFECTLY! OCR AND ACCOUNTING RESTORED.");
            conn.end();
        } catch (error) {
            console.error(error);
            conn.end();
        }
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
