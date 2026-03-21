const { Client } = require('ssh2');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

const fileTasks = [
    { local: 'd:/namasoft9-3-main/src/app/(dashboard)/settings/page.tsx', remote: '/src/app/(dashboard)/settings/page.tsx' },
    { local: 'd:/namasoft9-3-main/src/app/pos/page.tsx', remote: '/src/app/pos/page.tsx' },
    { local: 'd:/namasoft9-3-main/src/app/api/pos/checkout/route.ts', remote: '/src/app/api/pos/checkout/route.ts' },
    { local: 'd:/namasoft9-3-main/src/app/api/bnpl/tabby/route.ts', remote: '/src/app/api/bnpl/tabby/route.ts' },
    { local: 'd:/namasoft9-3-main/src/app/api/bnpl/tamara/route.ts', remote: '/src/app/api/bnpl/tamara/route.ts' }
];

function execute(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', (code) => resolve(code));
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
            
            // 1. Create missing directories for BNPL route.ts files
            console.log(`[N${i}] Creating remote directories if missing...`);
            await execute(conn, `mkdir -p ${basePath}/src/app/api/bnpl/tabby`);
            await execute(conn, `mkdir -p ${basePath}/src/app/api/bnpl/tamara`);

            conn.sftp(async (err, sftp) => {
                if (err) {
                    console.error(`[N${i}] SFTP Error`, err);
                    conn.end();
                    return resolve();
                }
                
                try {
                    console.log(`[N${i}] Uploading BNPL Interface & Logic Files...`);
                    for (const f of fileTasks) {
                        await fastPut(sftp, f.local, basePath + f.remote);
                    }
                    console.log(`[N${i}] Files Synced. Triggering Memory-Safe Build...`);
                    
                    // Kill heavy pm2 instances temporarily to free memory for compilation, then restart
                    const cmd = `pm2 stop n${i} n9 n10 || true && cd ${basePath} && npm run build && pm2 restart n${i} n9 n10 || true`;
                    await execute(conn, cmd);
                    
                    console.log(`[N${i}] Done!`);
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
    console.log('Starting BNPL Phase 8 Global Deployment...');
    for (let i = 1; i <= 10; i++) {
        await rebuildServer(i);
    }
    console.log('Master Phase 8 synchronization complete across all 10 servers.');
}

run();
