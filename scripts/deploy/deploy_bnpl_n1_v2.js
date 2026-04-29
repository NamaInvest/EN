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
            console.log(`[N${i}] Commencing BNPL SSH Sync...`);
            
            const basePath = `/www/wwwroot/n${i}.namainvist.com`;
            
            try {
                // 1. Create missing directories for BNPL route.ts files
                console.log(`[N${i}] Creating remote directories if missing...`);
                await execute(conn, `mkdir -p ${basePath}/src/app/api/bnpl/tabby && mkdir -p ${basePath}/src/app/api/bnpl/tamara`);
            } catch (e) {
                console.warn('Mkdir warning:', e);
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
                            console.error(`Failed to upload ${f.local}`, sftpErr);
                        }
                    }
                    console.log(`[N${i}] Files Synced. Triggering Memory-Safe Build...`);
                    
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
    console.log('Starting BNPL Phase 8 Deployment specifically for N1...');
    await rebuildServer(1);
    console.log('N1 sync complete.');
}

run();
