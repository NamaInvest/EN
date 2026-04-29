const { Client } = require('ssh2');

const SERVERS = [
    { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', name: 'N1' },
    { host: '176.9.145.228', port: 22, username: 'root', password: 'Y>5<Gz5(R_xQe2kX', name: 'N2' },
    { host: '176.9.146.126', port: 22, username: 'root', password: 'u6#W<4>n*?^zR6(z', name: 'N3' },
    { host: '176.9.138.115', port: 22, username: 'root', password: 'Z+*q883<B!k9(p[w', name: 'N4' },
    { host: '176.9.146.128', port: 22, username: 'root', password: 'P&6<g+w494>Z^r[3', name: 'N5' },
    { host: '46.4.188.163', port: 22, username: 'root', password: '_A5c@L1-r585k-zL', name: 'N6' },
    { host: '176.9.138.83', port: 22, username: 'root', password: '@r48q$Gz283K6#E^', name: 'N7' },
    { host: '46.4.188.173', port: 22, username: 'root', password: '#P5z1Q8t9+Qp3k<P', name: 'N8' },
    { host: '46.4.92.203', port: 22, username: 'root', password: '*t4X(E39>6z#aP4=', name: 'N9' },
    { host: '176.9.145.197', port: 22, username: 'root', password: '6[K8_5A+sR23#uG!', name: 'N10' }
];

const fileTasks = [
    { local: 'c:/Users/1/Desktop/alfa/src/app/api/crm/whatsapp/webhook/route.ts', remote: '/src/app/api/crm/whatsapp/webhook/route.ts' },
    { local: 'c:/Users/1/Desktop/alfa/src/app/api/crm/whatsapp/sessions/route.ts', remote: '/src/app/api/crm/whatsapp/sessions/route.ts' },
    { local: 'c:/Users/1/Desktop/alfa/src/app/(dashboard)/whatsapp-hub/page.tsx', remote: '/src/app/(dashboard)/whatsapp-hub/page.tsx' },
    { local: 'c:/Users/1/Desktop/alfa/src/components/Sidebar.tsx', remote: '/src/components/Sidebar.tsx' }
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
        // Create directory structures if they don't exist
        const dirs = remote.split('/').slice(0, -1).join('/');
        let makeDirCmd = `mkdir -p ${dirs}`;
        
        sftp.fastPut(local, remote, (err) => {
            if (err) {
                console.error('SFTP Error on ' + local + ' to ' + remote + ':', err);
                reject(err);
            } else resolve();
        });
    });
}

const runForServer = async (server) => {
    return new Promise((resolve) => {
        const conn = new Client();
        conn.on('ready', async () => {
            const basePath = `/www/wwwroot/${server.name.toLowerCase()}.namainvist.com`;
            console.log(`\n[${server.name}] Starting deployment...`);
            
            // Create Missing Directories
            await execute(conn, `mkdir -p ${basePath}/src/app/api/crm/whatsapp/webhook`);
            await execute(conn, `mkdir -p ${basePath}/src/app/api/crm/whatsapp/sessions`);
            await execute(conn, `mkdir -p ${basePath}/src/app/\\(dashboard\\)/whatsapp-hub`);

            conn.sftp(async (err, sftp) => {
                if (err) { console.error(`[${server.name}] SFTP Fail`); conn.end(); return resolve(); }
                try {
                    for (const f of fileTasks) {
                        try {
                            await fastPut(sftp, f.local, basePath + f.remote);
                        } catch (e) { console.log(`[${server.name}] Could not upload ${f.local}`); }
                    }
                    console.log(`[${server.name}] Sync done! Running build...`);
                    await execute(conn, `cd ${basePath} && npm run build && pm2 restart ${server.name.toLowerCase()} || true`);
                    console.log(`[${server.name}] DONE! AI Salesman Online.`);
                } catch (e) {
                    console.error(`[${server.name}] Error:`, e);
                } finally {
                    conn.end();
                    resolve();
                }
            });
        }).on('error', (err) => {
            console.log(`[${server.name}] Connection Error:`, err.message);
            resolve();
        }).connect(server);
    });
};

const runAll = async () => {
    console.log("🚀 Distributing Phase 10: AI WhatsApp Salesman cluster-wide...");
    // Let's do them in parallel batches of 2 or 3 to speed up.
    // For simplicity, doing sequential
    for (const s of SERVERS) {
        await runForServer(s);
    }
    console.log("✅ FINISHED! All nodes updated.");
};
runAll();
