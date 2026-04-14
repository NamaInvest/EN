const { Client } = require('ssh2');
const path = require('path');

const NODES = [
    { dir: 'n1.namainvist.com', pm2: 'n1-main', port: 3001 },
    { dir: 'n2.namainvist.com', pm2: 'n2', port: 3002 },
    { dir: 'n3.namainvist.com', pm2: 'n3', port: 3003 },
    { dir: 'n4.namainvist.com', pm2: 'n4', port: 3004 },
    { dir: 'n5.namainvist.com', pm2: 'n5', port: 3005 },
    { dir: 'n6.namainvist.com', pm2: 'n6', port: 3006 },
    { dir: 'n7.namainvist.com', pm2: 'n7', port: 3007 },
    { dir: 'n8.namainvist.com', pm2: 'n8', port: 3008 },
    { dir: 'n9.namainvist.com', pm2: 'n9', port: 3009 },
    { dir: 'n10.namainvist.com', pm2: 'n10', port: 3010 },
];

// Files to upload (local path → relative server path)
const FILES = [
    'src/components/Sidebar.tsx',
    'src/components/StockNotificationBell.tsx',
    'src/app/(dashboard)/settings/page.tsx',
    'src/app/(dashboard)/company-info/page.tsx',
];

function deployNode(node) {
    return new Promise((resolve) => {
        const conn = new Client();
        const base = `/www/wwwroot/${node.dir}`;

        conn.on('ready', () => {
            // 1. Create company-info dir first
            conn.exec(`mkdir -p "${base}/src/app/(dashboard)/company-info"`, (err, stream) => {
                stream.on('close', () => {
                    // 2. Upload files via SFTP
                    conn.sftp((err, sftp) => {
                        if (err) { console.error(`❌ SFTP error ${node.dir}:`, err.message); conn.end(); resolve(); return; }

                        let idx = 0;
                        const next = () => {
                            if (idx >= FILES.length) {
                                sftp.end();
                                // 3. Build & restart
                                const buildCmd = `cd "${base}" && npm run build 2>&1 | tail -3 && pm2 restart ${node.pm2} 2>/dev/null || pm2 start node_modules/next/dist/bin/next --name "${node.pm2}" --cwd "${base}" -- start -p ${node.port} && echo "✅ ${node.dir} DONE"`;
                                conn.exec(buildCmd, (err, s) => {
                                    s.on('data', d => process.stdout.write(`[${node.pm2}] ${d}`));
                                    s.stderr.on('data', d => process.stderr.write(`[${node.pm2}] ${d}`));
                                    s.on('close', () => { conn.end(); resolve(); });
                                });
                                return;
                            }
                            const local = FILES[idx++];
                            const remote = `${base}/${local}`;
                            sftp.fastPut(path.join(__dirname, local), remote, (e) => {
                                if (e) console.error(`  ❌ [${node.pm2}] ${local}: ${e.message}`);
                                else console.log(`  📤 [${node.pm2}] ${local}`);
                                next();
                            });
                        };
                        next();
                    });
                });
                stream.resume();
            });
        }).on('error', (err) => {
            console.error(`❌ Connect error ${node.dir}:`, err.message);
            resolve();
        }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
    });
}

async function main() {
    console.log('🚀 Deploying to N1-N10 (sequential to avoid server overload)...\n');
    for (const node of NODES) {
        console.log(`\n=== ${node.dir} ===`);
        await deployNode(node);
    }
    console.log('\n🎉 ALL DONE — N1 to N10 updated!');
}

main();
