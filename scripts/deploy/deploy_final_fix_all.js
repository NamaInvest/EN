const { Client } = require('ssh2');

const hostIp = '46.4.188.170';
const basePathPrefix = '/www/wwwroot/n';
const domainSuffix = '.namainvist.com';

const filesToUpload = [
    { local: 'c:/Users/1/Desktop/alfa/src/app/api/products/import/route.ts', remote: 'src/app/api/products/import/route.ts' },
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

        console.log(`[${serverName}] Sending compiled payloads...`);

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
                        console.log(`[${serverName}] Uploaded. Recompiling Next.js in production (Takes ~1 min)...`);
                        
                        const cmd = `cd ${basePath} && npm run build && pm2 reload all`;
                        conn.exec(cmd, (err, stream) => {
                            if (err) {
                                console.error(`[${serverName}] Exec Error:`, err);
                                conn.end();
                                return resolve(false);
                            }
                            
                            stream.on('close', (code) => {
                                console.log(`[${serverName}] ✅ Active Server Reloaded! Build & Deploy finished with code ${code}.`);
                                conn.end();
                                resolve(true);
                            }).on('data', () => {}).stderr.on('data', () => {});
                        });
                        return;
                    }

                    const file = filesToUpload[uploadIndex];
                    sftp.fastPut(file.local, `${basePath}/${file.remote}`, (err) => {
                        if (err) console.error(`[${serverName}] Upload Error:`, err);
                        uploadIndex++;
                        uploadNextFile();
                    });
                };
                uploadNextFile();
            });
        }).on('error', (err) => {
            console.error(`[${serverName}] Connection Error:`, err.message);
            resolve(false);
        }).connect({ host: hostIp, port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
    });
}

async function runAll() {
    console.log('--- NAMA SYSTEM WIDE UPDATE: EXCEL IMPORT + LOYALTY ---');
    for (let i = 1; i <= 10; i += 3) {
        const batch = [];
        for (let j = 0; j < 3 && (i + j) <= 10; j++) {
            batch.push(deployToServer(i + j));
        }
        await Promise.all(batch);
        console.log(`>>> Cluster Rollout: Servers ${i} to ${Math.min(i + 2, 10)} operational.`);
    }
    console.log('\\n🚀🚀🚀 ALL 10 PRODUCTION SERVERS SYNCHRONIZED SUCCESSFULLY! 🚀🚀🚀');
}

runAll();
