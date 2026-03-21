const { Client } = require('ssh2');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

const fileTasks = [
    { local: 'd:/namasoft9-3-main/src/components/Sidebar.tsx', remote: '/src/components/Sidebar.tsx' },
    { local: 'd:/namasoft9-3-main/src/app/(dashboard)/settings/page.tsx', remote: '/src/app/(dashboard)/settings/page.tsx' }
];

function execute(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', (code) => {
                if (code !== 0) reject(new Error('Exit code ' + code));
                else resolve();
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
            console.log(`[N${i}] Commencing SSH Sync...`);
            conn.sftp(async (err, sftp) => {
                if (err) {
                    console.error(`[N${i}] SFTP Error`, err);
                    conn.end();
                    return resolve();
                }
                
                try {
                    const basePath = `/www/wwwroot/n${i}.namainvist.com`;
                    
                    console.log(`[N${i}] Uploading UI Files...`);
                    for (const f of fileTasks) {
                        await fastPut(sftp, f.local, basePath + f.remote);
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
    // Process N1 first to seal the Admin bypass logic, then loop sequentially to avoid max-conn limits.
    for (let i = 1; i <= 10; i++) {
        await rebuildServer(i);
    }
    console.log('Master synchronization complete across all 10 servers.');
}

run();
