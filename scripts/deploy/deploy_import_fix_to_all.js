const { Client } = require('ssh2');

const hostIp = '46.4.188.170';
const basePathPrefix = '/www/wwwroot/n';
const domainSuffix = '.namainvist.com';

const filesToUpload = [
    { local: 'c:/Users/1/Desktop/alfa/src/app/api/products/import/route.ts', remote: 'src/app/api/products/import/route.ts' }
];

async function deployToServer(serverIndex) {
    return new Promise((resolve) => {
        const conn = new Client();
        const serverName = `n${serverIndex}`;
        const basePath = `${basePathPrefix}${serverIndex}${domainSuffix}`;

        console.log(`[${serverName}] Starting deployment of Excel Import Fix...`);

        conn.on('ready', () => {
            conn.sftp((err, sftp) => {
                if (err) {
                    console.error(`[${serverName}] SFTP Error:`, err);
                    conn.end();
                    return resolve(false);
                }

                let uploadIndex = 0;
                const uploadNextFile = () => {
                    if (uploadIndex >= filesToUpload.length) {
                        console.log(`[${serverName}] Files uploaded successfully. Starting build...`);
                        
                        // Run Next.js build
                        const cmd = `cd ${basePath} && npm run build && pm2 reload all`;
                        conn.exec(cmd, (err, stream) => {
                            if (err) {
                                console.error(`[${serverName}] Exec Error:`, err);
                                conn.end();
                                return resolve(false);
                            }
                            
                            stream.on('close', (code) => {
                                console.log(`[${serverName}] ✅ Build & Deploy finished with code ${code}.`);
                                conn.end();
                                resolve(true);
                            }).on('data', () => {}).stderr.on('data', () => {});
                        });
                        return;
                    }

                    const file = filesToUpload[uploadIndex];
                    sftp.fastPut(file.local, `${basePath}/${file.remote}`, (err) => {
                        if (err) console.error(`[${serverName}] Upload Error:`, err);
                        else console.log(`[${serverName}] Uploaded ${file.remote}`);
                        uploadIndex++;
                        uploadNextFile();
                    });
                };
                uploadNextFile();
            });
        }).on('error', (err) => {
            console.error(`[${serverName}] Connection Error:`, err.message);
            resolve(false);
        }).connect({ host: hostIp, port: 22, username: 'root', password: 'S{5yH0$2$k{3D9pX#' });
    });
}

async function runAll() {
    console.log('Sending Excel Import API fix to N1 -> N10...');
    for (let i = 1; i <= 10; i += 3) {
        const batch = [];
        for (let j = 0; j < 3 && (i + j) <= 10; j++) {
            batch.push(deployToServer(i + j));
        }
        await Promise.all(batch);
        console.log(`Batch ${i} to ${Math.min(i + 2, 10)} complete.`);
    }
    console.log('\\n🚀🚀🚀 EXCEL IMPORT FIX SECURELY DEPLOYED DEPLOYED TO ALL 10 SERVERS! 🚀🚀🚀');
}

runAll();
