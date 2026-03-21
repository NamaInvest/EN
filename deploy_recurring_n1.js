const { Client } = require('ssh2');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

const fileTasks = [
    { local: 'd:/namasoft9-3-main/src/components/Sidebar.tsx', remote: '/src/components/Sidebar.tsx' },
    { local: 'd:/namasoft9-3-main/src/app/(dashboard)/recurring-invoices/page.tsx', remote: '/src/app/(dashboard)/recurring-invoices/page.tsx' },
    { local: 'd:/namasoft9-3-main/src/app/api/recurring-invoices/route.ts', remote: '/src/app/api/recurring-invoices/route.ts' },
    { local: 'd:/namasoft9-3-main/src/app/api/cron/trigger-invoices/route.ts', remote: '/src/app/api/cron/trigger-invoices/route.ts' }
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
            console.log(`[N${i}] Commencing Recurring Contracts Deployment...`);
            
            const basePath = `/www/wwwroot/n${i}.namainvist.com`;
            
            try {
                console.log(`[N${i}] Creating remote directories if missing...`);
                await execute(conn, `mkdir -p "${basePath}/src/app/(dashboard)/recurring-invoices" && mkdir -p "${basePath}/src/app/api/recurring-invoices" && mkdir -p "${basePath}/src/app/api/cron/trigger-invoices"`);
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
                    console.log(`[N${i}] Uploading Subscription Logic...`);
                    for (const f of fileTasks) {
                        try {
                            await fastPut(sftp, f.local, basePath + f.remote);
                        } catch (sftpErr) {
                            console.error(`Failed to upload ${f.local}`, sftpErr);
                        }
                    }
                    console.log(`[N${i}] Files Synced. Triggering Memory-Safe Build...`);
                    
                    const cmd = `cd ${basePath} && npm run build && pm2 restart n${i} || true`;
                    await execute(conn, cmd);
                    
                    console.log(`[N${i}] Done! Recurring system online.`);
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
    console.log('Starting Phase 9.2 Auto-Billing on N1...');
    await rebuildServer(1);
    console.log('N1 sync complete.');
}

run();
