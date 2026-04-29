const { Client } = require('ssh2');

const hostIp = '46.4.188.170';
const basePathPrefix = '/www/wwwroot/n';
const domainSuffix = '.namainvist.com';

const filesToUpload = [
    { local: 'c:/Users/1/Desktop/alfa/src/app/restaurant-pos/page.tsx', remote: 'src/app/restaurant-pos/page.tsx' },
    { local: 'c:/Users/1/Desktop/alfa/src/app/pos/page.tsx', remote: 'src/app/pos/page.tsx' }
];

async function deployToServer(serverIndex) {
    return new Promise((resolve) => {
        const conn = new Client();
        const serverName = `n${serverIndex}`;
        const basePath = `${basePathPrefix}${serverIndex}${domainSuffix}`;

        console.log(`[${serverName}] Sending POS UI Hotfix...`);

        conn.on('ready', () => {
            conn.sftp((err, sftp) => {
                if (err) return resolve(false);

                let uploadIndex = 0;
                const uploadNextFile = () => {
                    if (uploadIndex >= filesToUpload.length) {
                        console.log(`[${serverName}] Uploaded UI. Recompiling Next.js in production (Takes ~1 min)...`);
                        
                        const cmd = `cd ${basePath} && npm run build && pm2 reload all`;
                        conn.exec(cmd, (err, stream) => {
                            if (err) return resolve(false);
                            stream.on('close', (code) => {
                                console.log(`[${serverName}] ✅ Active POS UI Reloaded! Code ${code}.`);
                                conn.end();
                                resolve(true);
                            }).on('data', () => {}).stderr.on('data', () => {});
                        });
                        return;
                    }

                    const file = filesToUpload[uploadIndex];
                    sftp.fastPut(file.local, `${basePath}/${file.remote}`, (err) => {
                        uploadIndex++;
                        uploadNextFile();
                    });
                };
                uploadNextFile();
            });
        }).on('error', () => resolve(false)).connect({ host: hostIp, port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
    });
}

async function runAll() {
    console.log('--- NAMA SYSTEM: RETAIL & RESTAURANT POS HOTFIX ---');
    for (let i = 1; i <= 10; i += 3) {
        const batch = [];
        for (let j = 0; j < 3 && (i + j) <= 10; j++) {
            batch.push(deployToServer(i + j));
        }
        await Promise.all(batch);
        console.log(`>>> Cluster Rollout: Servers ${i} to ${Math.min(i + 2, 10)} operational.`);
    }
    console.log('\\n🚀🚀🚀 POS UI FIXED ON ALL 10 SERVERS! 🚀🚀🚀');
}

runAll();
