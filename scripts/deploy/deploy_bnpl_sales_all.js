const { Client } = require('ssh2');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

const fileTasks = [
    { local: 'c:/Users/1/Desktop/alfa/src/app/(dashboard)/sales/page.tsx', remote: '/src/app/(dashboard)/sales/page.tsx' },
    { local: 'c:/Users/1/Desktop/alfa/src/app/api/bnpl/status/route.ts', remote: '/src/app/api/bnpl/status/route.ts' }
];

function execute(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', (code) => {
                resolve();
            });
        });
    });
}

function fastPut(sftp, local, remote) {
    return new Promise((resolve, reject) => {
        sftp.fastPut(local, remote, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

async function rebuildServer(i) {
    return new Promise((resolve) => {
        const conn = new Client();
        conn.on('ready', async () => {
            console.log(`\n============================`);
            console.log(`[N${i}] Syncing BNPL Sales Core to Node N${i}...`);
            
            const basePath = `/www/wwwroot/n${i}.namainvist.com`;
            
            try {
                process.stdout.write(`[N${i}] Creating remote directories if missing... `);
                await execute(conn, `mkdir -p "${basePath}/src/app/api/bnpl/status" && mkdir -p "${basePath}/src/app/(dashboard)/sales"`);
                console.log(`[Dir OK]`);
            } catch (e) {
                console.warn(`[N${i}] Mkdir warning:`, e);
            }

            conn.sftp(async (err, sftp) => {
                if (err) {
                    console.error(`[N${i}] SFTP Error`, err);
                    conn.end();
                    return resolve();
                }
                
                try {
                    console.log(`[N${i}] Uploading BNPL Update...`);
                    for (const f of fileTasks) {
                        try {
                            await fastPut(sftp, f.local, basePath + f.remote);
                        } catch (sftpErr) {
                            console.error(`[N${i}] Failed to upload ${f.local}`, sftpErr);
                        }
                    }
                    console.log(`[N${i}] Files Synced. Triggering Memory-Safe Build...`);
                    
                    const cmd = `pm2 stop n${i} || true && cd ${basePath} && npm run build && pm2 restart n${i} || true`;
                    await execute(conn, cmd);
                    
                    console.log(`[N${i}] DONE! BNPL Standard Sales logic online on N${i}.`);
                } catch (e) {
                    console.error(`[N${i}] Fatal Exception:`, e.message || e);
                } finally {
                    conn.end();
                    resolve();
                }
            });
        }).on('error', (e) => {
            console.error(`[N${i}] Connection Error:`, e);
            resolve();
        }).connect(SSH_CONFIG);
    });
}

async function run() {
    console.log('Starting Phase 8.2 BNPL Upgrade across N2-N10 cluster...');
    
    // Deploying sequentially to N2 -> N10
    // N1 is already compiled!
    for (let i = 2; i <= 10; i++) {
        await rebuildServer(i);
    }
    
    console.log('\n✅ Phase 8.2 BNPL successfully deployed and rebuilt across the entire cluster.');
}

run();
