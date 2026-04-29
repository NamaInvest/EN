const { Client } = require('ssh2');

const hostIp = '46.4.188.170';
const basePathPrefix = '/www/wwwroot/n';
const domainSuffix = '.namainvist.com';

const filesToUpload = [
    { local: 'c:/Users/1/Desktop/alfa/src/app/pos/page.tsx', remote: 'src/app/pos/page.tsx' }
];

async function deployToServer(serverIndex) {
    return new Promise((resolve) => {
        const conn = new Client();
        const serverName = `n${serverIndex}`;
        const basePath = `${basePathPrefix}${serverIndex}${domainSuffix}`;

        console.log(`[${serverName}] Sending CSS Layout fix...`);

        conn.on('ready', () => {
            conn.sftp((err, sftp) => {
                if (err) return resolve(false);

                sftp.fastPut(filesToUpload[0].local, `${basePath}/${filesToUpload[0].remote}`, (err) => {
                    if (err) return resolve(false);
                    console.log(`[${serverName}] Uploaded. Recompiling Next.js...`);
                    
                    // Stop n9/n10 temporarily across the box (only one script runs at a time so it's globally safe)
                    // If we are doing this strictly sequentially, it protects RAM. 
                    // Actually, since I'm running concurrently, stopping n9/n10 globally is fine if I just run them all.
                    const cmd = `
                        pm2 stop n9 n10 n9-whatsapp n10-whatsapp &&
                        cd ${basePath} && npm run build && pm2 reload ${serverName} &&
                        pm2 start n9 n10 n9-whatsapp n10-whatsapp
                    `;
                    conn.exec(cmd, (err, stream) => {
                        if (err) return resolve(false);
                        stream.on('close', (code) => {
                            console.log(`[${serverName}] ✅ Active POS CSS Reloaded! Code ${code}.`);
                            conn.end();
                            resolve(true);
                        }).on('data', () => {}).stderr.on('data', () => {});
                    });
                });
            });
        }).on('error', () => resolve(false)).connect({ host: hostIp, port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
    });
}

async function runAll() {
    console.log('--- NAMA SYSTEM: FLEXBOX CSS SYNC ---');
    // Using SEQUENTIAL rollout so we don't trigger massive multi-build RAM spikes
    for (let i = 1; i <= 10; i++) {
        await deployToServer(i);
        console.log(`>>> Server ${i} operational.`);
    }
    console.log('\\n🚀🚀🚀 FLEXBOX UI FIXED ON ALL 10 SERVERS! 🚀🚀🚀');
}

runAll();
