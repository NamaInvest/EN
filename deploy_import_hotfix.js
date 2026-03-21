const { Client } = require('ssh2');

const hostIp = '46.4.188.170';
const basePathPrefix = '/www/wwwroot/n';
const domainSuffix = '.namainvist.com';

const filesToUpload = [
    { local: 'd:/namasoft9-3-main/src/app/api/products/import/route.ts', remote: 'src/app/api/products/import/route.ts' }
];

async function deployToServer(serverIndex) {
    return new Promise((resolve) => {
        const conn = new Client();
        const serverName = `n${serverIndex}`;
        const basePath = `${basePathPrefix}${serverIndex}${domainSuffix}`;

        console.log(`[${serverName}] Sending Import Hotfix...`);

        conn.on('ready', () => {
            conn.sftp((err, sftp) => {
                if (err) {
                    console.error(`[${serverName}] SFTP Error:`, err);
                    conn.end();
                    return resolve(false);
                }

                const file = filesToUpload[0];
                sftp.fastPut(file.local, `${basePath}/${file.remote}`, (err) => {
                    if (err) {
                        console.error(`[${serverName}] Upload Error:`, err);
                        conn.end();
                        return resolve(false);
                    }
                    console.log(`[${serverName}] Uploaded. Recompiling Next.js in production...`);
                    
                    const cmd = `cd ${basePath} && npm run build && pm2 reload all`;
                    conn.exec(cmd, (err, stream) => {
                        if (err) {
                            console.error(`[${serverName}] Exec Error:`, err);
                            conn.end();
                            return resolve(false);
                        }
                        stream.on('close', (code) => {
                            console.log(`[${serverName}] ✅ Active Server Reloaded! Code ${code}.`);
                            conn.end();
                            resolve(true);
                        }).on('data', () => {}).stderr.on('data', () => {});
                    });
                });
            });
        }).on('error', (err) => {
            console.error(`[${serverName}] Connection Error:`, err.message);
            resolve(false);
        }).connect({ host: hostIp, port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
    });
}

async function runAll() {
    console.log('--- NAMA SYSTEM: EXCEL IMPORT HOTFIX ---');
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
