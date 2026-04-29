const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const servers = [
    { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', name: 'N1' },
    { host: '46.4.188.136', port: 22, username: 'root', password: '5gK>G9b4S5t8hO_', name: 'N2' },
    { host: '46.4.188.172', port: 22, username: 'root', password: '7hJ<F2b8L9q6wP=', name: 'N3' },
    { host: '46.4.188.174', port: 22, username: 'root', password: '2mN+R4c5T1x8yZ*', name: 'N4' },
    { host: '46.4.188.175', port: 22, username: 'root', password: '9pQ!V6d3W7k4mA-', name: 'N5' },
    { host: '46.4.188.176', port: 22, username: 'root', password: '4sT#B8f1X2n5cH&', name: 'N6' },
    { host: '46.4.188.188', port: 22, username: 'root', password: '1vY$M3g7C9l6jD@', name: 'N7' },
    { host: '46.4.188.225', port: 22, username: 'root', password: '8wZ%H2k4P5v9rE^', name: 'N8' },
    { host: '46.4.188.232', port: 22, username: 'root', password: '6xA^L1m9Q3b7tF~', name: 'N9' },
    { host: '46.4.188.135', port: 22, username: 'root', password: '3yB&N5p8S2c4uG|', name: 'N10' }
];

const basePath = process.cwd();

const fileTasks = [
    { local: 'src/app/(dashboard)/layout.tsx', remote: 'src/app/(dashboard)/layout.tsx' },
    { local: 'src/app/(dashboard)/master-panel/page.tsx', remote: 'src/app/(dashboard)/master-panel/page.tsx' },
    { local: 'src/app/api/master-panel-data/route.ts', remote: 'src/app/api/master-panel-data/route.ts' },
    { local: 'src/app/api/subscriptions/route.ts', remote: 'src/app/api/subscriptions/route.ts' },
    { local: 'src/app/api/subscription-status/route.ts', remote: 'src/app/api/subscription-status/route.ts' },
    { local: 'src/app/billing-expired/page.tsx', remote: 'src/app/billing-expired/page.tsx' },
    { local: 'src/components/SubscriptionGuard.tsx', remote: 'src/components/SubscriptionGuard.tsx' },
    { local: 'src/components/Sidebar.tsx', remote: 'src/components/Sidebar.tsx' }
];

function ensureLocalFileExists(localPath) {
    if (!fs.existsSync(path.join(basePath, localPath))) {
        throw new Error(`Local file missing: ${localPath}`);
    }
}
fileTasks.forEach(t => ensureLocalFileExists(t.local));

async function deployToServer(server) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        
        conn.on('ready', () => {
            console.log(`[${server.name}] Connected via SSH...`);
            conn.sftp((err, sftp) => {
                if (err) return reject(`SFTP Error on ${server.name}: ${err}`);

                const remoteBase = `/www/wwwroot/${server.name.toLowerCase()}.namainvist.com`;

                const uploadNextFile = (index) => {
                    if (index >= fileTasks.length) {
                        console.log(`[${server.name}] Uploads complete! Compiling and Restarting via PM2...`);
                        conn.exec(`cd ${remoteBase} && npm run build && pm2 restart all`, (err, stream) => {
                            if (err) return reject(err);
                            stream.on('close', () => {
                                console.log(`[${server.name}] ✔️ Master Panel & SaaS Guard Deployed!`);
                                conn.end();
                                resolve();
                            });
                        });
                        return;
                    }

                    const task = fileTasks[index];
                    const localFull = path.join(basePath, task.local);
                    const remoteFull = `${remoteBase}/${task.remote.replace(/\\/g, '/')}`;

                    // Create remote directory if not exists
                    const remoteDir = path.dirname(remoteFull);
                    conn.exec(`mkdir -p ${remoteDir}`, () => {
                        sftp.fastPut(localFull, remoteFull, (err) => {
                            if (err) console.error(`[${server.name}] Failed to upload ${task.local}`, err);
                            else console.log(`[${server.name}] Uploaded ${task.local}`);
                            uploadNextFile(index + 1);
                        });
                    });
                };

                uploadNextFile(0);
            });
        }).on('error', (err) => {
            console.error(`[${server.name}] Connection Error:`, err);
            resolve();
        }).connect(server);
    });
}

async function runAll() {
    console.log(`Deploying SaaS Engine Phase 11 to 10 nodes...`);
    const promises = servers.map(server => deployToServer(server));
    await Promise.allSettled(promises);
    console.log(`\n🎉 ALL SERVERS UPDATED WITH MASTER PANEL AND SUBSCRIPTION GUARD!`);
}

runAll();
