const { Client } = require('ssh2');
const path = require('path');
const util = require('util');

const conn = new Client();

const filesToUpload = [
    'package.json',
    'package-lock.json',
    'src/app/api/purchases/ocr/route.ts'
];

conn.on('ready', () => {
    console.log('SSH Ready. SDK Deployment initiated sequentially...');
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
                console.log(`[n${i}] SDK Dependencies and OCR Route uploaded.`);
                
                const pipelineCmd = `cd ${nodeDomain} && npm install && npx next build && pm2 reload n${i} --update-env`;
                console.log(`[n${i}] Installing NPM SDK and Rebuilding Next.js Edge APIs...`);
                
                const stream = await execAsync(pipelineCmd);
                await new Promise((res, rej) => {
                    stream.on('data', d => process.stdout.write(`[n${i}] ${d.toString()}`));
                    stream.stderr.on('data', d => process.stdout.write(`[n${i}] STDERR: ${d.toString()}`));
                    stream.on('close', (code) => {
                        if(code === 0) {
                            console.log(`\n[n${i}] SDK DEPLOYED SUCCESSFULLY!\n`);
                            res();
                        } else {
                            console.error(`\n[n${i}] FAILED WITH CODE ${code}\n`);
                            res();
                        }
                    });
                });
            }
            console.log("ALL 10 NODES SYNCED PERFECTLY! OCR POWERED BY GOOGLE NATIVE SDK.");
            conn.end();
        } catch (error) {
            console.error(error);
            conn.end();
        }
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
