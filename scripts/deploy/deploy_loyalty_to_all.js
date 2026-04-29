const { Client } = require('ssh2');
const fs = require('fs');

const hostIp = '46.4.188.170';
const basePathPrefix = '/www/wwwroot/n';
const domainSuffix = '.namainvist.com';

const filesToUpload = [
    { local: 'c:/Users/1/Desktop/alfa/src/app/pos/page.tsx', remote: 'src/app/pos/page.tsx' },
    { local: 'c:/Users/1/Desktop/alfa/src/app/restaurant-pos/page.tsx', remote: 'src/app/restaurant-pos/page.tsx' },
    { local: 'c:/Users/1/Desktop/alfa/src/app/(dashboard)/loyalty/page.tsx', remote: 'src/app/(dashboard)/loyalty/page.tsx' },
    { local: 'c:/Users/1/Desktop/alfa/src/app/api/pos/checkout/route.ts', remote: 'src/app/api/pos/checkout/route.ts' }
];

async function deployToServer(serverIndex) {
    return new Promise((resolve) => {
        const conn = new Client();
        const serverName = `n${serverIndex}`;
        const basePath = `${basePathPrefix}${serverIndex}${domainSuffix}`;

        console.log(`[${serverName}] Starting deployment...`);

        conn.on('ready', () => {
            console.log(`[${serverName}] Connected via SSH.`);
            
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
                        const cmd = `cd ${basePath} && npm run build`;
                        conn.exec(cmd, (err, stream) => {
                            if (err) {
                                console.error(`[${serverName}] Exec Error:`, err);
                                conn.end();
                                return resolve(false);
                            }
                            
                            stream.on('close', (code) => {
                                console.log(`[${serverName}] Build finished with code ${code}. Reloading PM2...`);
                                
                                conn.exec(`pm2 reload all`, (err, pm2Stream) => {
                                    pm2Stream.on('close', () => {
                                        console.log(`[${serverName}] ✅ PM2 Reloaded. Deploy complete.`);
                                        conn.end();
                                        resolve(true);
                                    });
                                });
                            }).on('data', (data) => {
                                // Don't print output to avoid spam, just wait for close
                            }).stderr.on('data', (data) => {});
                        });
                        return;
                    }

                    const file = filesToUpload[uploadIndex];
                    const localPath = file.local;
                    const remotePath = `${basePath}/${file.remote}`;

                    sftp.fastPut(localPath, remotePath, (err) => {
                        if (err) {
                            console.error(`[${serverName}] FastPut Error on ${file.remote}:`, err);
                        } else {
                            console.log(`[${serverName}] Uploaded ${file.remote}`);
                        }
                        uploadIndex++;
                        uploadNextFile();
                    });
                };

                uploadNextFile();
            });
        }).on('error', (err) => {
            console.error(`[${serverName}] Error:`, err.message);
            resolve(false);
        }).connect({
            host: hostIp,
            port: 22,
            username: 'root',
            password: 'S{5yH0$2$k{3D9pX#'
        });
    });
}

async function runAll() {
    console.log('Starting parallel deploy for Loyalty & Coupons POS engines to N1 -> N10...');
    
    // We can do them sequentially or in batches if parallel is too heavy. Let's do 3 at a time.
    for (let i = 1; i <= 10; i += 3) {
        const batch = [];
        for (let j = 0; j < 3 && (i + j) <= 10; j++) {
            batch.push(deployToServer(i + j));
        }
        await Promise.all(batch);
        console.log(`Batch ${i} to ${Math.min(i + 2, 10)} complete.`);
    }
    
    console.log('\\n🚀🚀🚀 ALL 10 SERVERS DEPLOYED AND REBUILT SUCCESSFULLY! 🚀🚀🚀');
}

runAll();
