const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

// List of all fleet nodes that need this middleware fix
const FLEET_NODES = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'n10', 'n11', 'namainvist.com'];

const middlewareLocal = path.join(__dirname, 'src/middleware.ts');
const middlewareContent = fs.readFileSync(middlewareLocal, 'utf8');

function deployToFleet() {
    return new Promise((resolve) => {
        const conn = new Client();
        conn.on('ready', () => {
            console.log('✅ Fleet server connected...');
            conn.sftp((err, sftp) => {
                if (err) { conn.end(); resolve(); return; }

                let idx = 0;
                const uploadNext = () => {
                    if (idx >= FLEET_NODES.length) {
                        sftp.end();
                        // Now rebuild all nodes
                        console.log('\nBuilding all nodes...');
                        const buildCmds = FLEET_NODES.map(n => {
                            const dir = n === 'namainvist.com'
                                ? '/www/wwwroot/namainvist.com'
                                : `/www/wwwroot/${n}.namainvist.com`;
                            const pm2 = n === 'namainvist.com' ? 'main-site' : (n === 'n1' ? 'n1-main' : n);
                            return `[ -d "${dir}" ] && cd "${dir}" && npm run build 2>&1 | tail -2 && pm2 restart ${pm2} 2>/dev/null || true && echo "✅ ${n} done"`;
                        }).join('\n');

                        conn.exec(buildCmds + '\npm2 save\necho "ALL_DONE"', (err, stream) => {
                            if (err) { conn.end(); resolve(); return; }
                            stream.on('data', d => process.stdout.write(d));
                            stream.stderr.on('data', d => process.stderr.write(d));
                            stream.on('close', () => { conn.end(); resolve(); });
                        });
                        return;
                    }

                    const n = FLEET_NODES[idx++];
                    const dir = n === 'namainvist.com'
                        ? '/www/wwwroot/namainvist.com'
                        : `/www/wwwroot/${n}.namainvist.com`;
                    const remote = `${dir}/src/middleware.ts`;

                    sftp.fastPut(middlewareLocal, remote, (err) => {
                        if (err) console.error(`❌ ${n}:`, err.message);
                        else console.log(`📤 ${n}`);
                        uploadNext();
                    });
                };
                uploadNext();
            });
        }).on('error', e => { console.error('Fleet error:', e.message); resolve(); })
        .connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
    });
}

function deployToSshServer(label, host, keyPath, appPath, pm2Name) {
    return new Promise((resolve) => {
        if (!fs.existsSync(keyPath)) { console.log(`⚠️ [${label}] Key not found, skipping`); resolve(); return; }
        const conn = new Client();
        conn.on('ready', () => {
            console.log(`✅ [${label}] Connected...`);
            conn.sftp((err, sftp) => {
                if (err) { conn.end(); resolve(); return; }
                sftp.fastPut(middlewareLocal, `${appPath}/src/middleware.ts`, (err) => {
                    sftp.end();
                    if (err) { console.error(`❌ [${label}]:`, err.message); conn.end(); resolve(); return; }
                    console.log(`📤 [${label}] Uploaded, building...`);
                    conn.exec(`cd ${appPath} && npm run build 2>&1 | tail -3 && pm2 restart ${pm2Name} && echo "✅ ${label} done"`, (err, stream) => {
                        if (err) { conn.end(); resolve(); return; }
                        stream.on('data', d => process.stdout.write(`[${label}] ${d}`));
                        stream.stderr.on('data', d => process.stderr.write(`[${label} ERR] ${d}`));
                        stream.on('close', () => { conn.end(); resolve(); });
                    });
                });
            });
        }).on('error', e => { console.error(`[${label}] Error:`, e.message); resolve(); })
        .connect({ host, port: 22, username: 'root', privateKey: fs.readFileSync(keyPath) });
    });
}

async function main() {
    console.log('🚀 Deploying middleware fix to ALL servers...\n');
    await Promise.all([
        deployToFleet(),
        deployToSshServer('SERVER1', '95.217.187.44', 'C:\\Users\\1\\.ssh\\hetzner_key', '/var/www/namasoft', 'namasoft'),
        deployToSshServer('SERVER2', '204.168.144.74', 'C:\\Users\\1\\Desktop\\namasoftkey\\namasoft_key', '/var/www/namasoft', 'namasoft'),
        deployToSshServer('SERVER3', '185.197.195.202', 'C:\\Users\\1\\.ssh\\id_ed25519_deploy', '/var/www/namasoft', 'namasoft'),
    ]);
    console.log('\n🎉 ALL SERVERS UPDATED!');
}

main().catch(console.error);
