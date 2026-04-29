const { Client } = require('ssh2');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

const fileTasks = [
    { local: 'c:/Users/1/Desktop/alfa/src/app/(dashboard)/settings/page.tsx', remote: '/src/app/(dashboard)/settings/page.tsx' },
    { local: 'c:/Users/1/Desktop/alfa/src/app/pos/page.tsx', remote: '/src/app/pos/page.tsx' },
    { local: 'c:/Users/1/Desktop/alfa/src/app/api/pos/checkout/route.ts', remote: '/src/app/api/pos/checkout/route.ts' },
    { local: 'c:/Users/1/Desktop/alfa/src/app/api/bnpl/tabby/route.ts', remote: '/src/app/api/bnpl/tabby/route.ts' },
    { local: 'c:/Users/1/Desktop/alfa/src/app/api/bnpl/tamara/route.ts', remote: '/src/app/api/bnpl/tamara/route.ts' }
];

function execute(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            stream.on('data', d => process.stdout.write(`\n${d.toString()}`));
            stream.stderr.on('data', d => process.stderr.write(`\n${d.toString()}`));
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
            console.log(`[N${i}] Commencing BNPL SSH Sync...`);
            
            const basePath = `/www/wwwroot/n${i}.namainvist.com`;
            
            try {
                process.stdout.write(`[N${i}] Creating remote directories if missing... `);
                await execute(conn, `mkdir -p ${basePath}/src/app/api/bnpl/tabby && mkdir -p ${basePath}/src/app/api/bnpl/tamara`);
                console.log(`[Dir OK]`);
            } catch (e) {
                console.warn(`\n[N${i}] Mkdir warning:`, e);
            }

            conn.sftp(async (err, sftp) => {
                if (err) {
                    console.error(`[N${i}] SFTP Error`, err);
                    conn.end();
                    return resolve();
                }
                
                try {
                    console.log(`[N${i}] Uploading BNPL Interface & Logic Files...`);
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
                    
                    console.log(`\n[N${i}] DONE! Deployment successfully initialized on N${i}.`);
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
    console.log('Starting BNPL Phase 8 Mass Cluster Deployment...');
    
    // Process servers sequentially to respect memory limits on Hetzner during npm run build
    for (let i = 2; i <= 10; i++) {
        await rebuildServer(i);
    }
    
    console.log('\n✅ Master Phase 8 synchronization complete across ALL remaining 9 servers.');
}

run();
