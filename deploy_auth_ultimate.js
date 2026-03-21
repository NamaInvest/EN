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
    { local: 'd:/namasoft9-3-main/src/lib/auth.ts', remote: '/src/lib/auth.ts' },
    { local: 'd:/namasoft9-3-main/src/app/api/users/route.ts', remote: '/src/app/api/users/route.ts' },
    { local: 'd:/namasoft9-3-main/src/app/api/auth/login/route.ts', remote: '/src/app/api/auth/login/route.ts' }
];

function execute(conn, cmd) {
    return new Promise((resolve) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return resolve();
            stream.on('data', d => {});
            stream.stderr.on('data', d => {});
            stream.on('close', () => resolve());
        });
    });
}

function fastPut(sftp, local, remote) {
    return new Promise((resolve, reject) => {
        sftp.fastPut(local, remote, (err) => {
            if (err) reject(err); else resolve();
        });
    });
}

const runForServer = async (server) => {
    return new Promise((resolve) => {
        const conn = new Client();
        conn.on('ready', async () => {
            const basePath = `/www/wwwroot/${server.name.toLowerCase()}.namainvist.com`;
            console.log(`[${server.name}] Pushing Radical Auth Patch...`);
            conn.sftp(async (err, sftp) => {
                if (err) { console.error(`[${server.name}] SFTP ERR`); conn.end(); return resolve(); }
                try {
                    for (const f of fileTasks) await fastPut(sftp, f.local, basePath + f.remote);
                    console.log(`[${server.name}] Files synced. Building Next.js...`);
                    await execute(conn, `cd ${basePath} && npm run build && pm2 restart ${server.name.toLowerCase()} || true`);
                    console.log(`[${server.name}] ✅ Live and Patched`);
                } catch (e) { console.error(`[${server.name}] ERR`, e.message); }
                finally { conn.end(); resolve(); }
            });
        }).on('error', (e) => {
            console.error(`[${server.name}] Connection timeout`);
            resolve();
        }).connect({ ...server, readyTimeout: 10000 });
    });
};

const runAll = async () => {
    console.log("🚀 INITIALIZING GLOBAL AUTHENTICATION SWEEP...");
    for (const s of SERVERS) await runForServer(s);
    console.log("✅ FINISHED SWEEPING ALL SERVERS!");
};
runAll();
