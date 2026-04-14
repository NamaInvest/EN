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

const FILES = [
    'src/components/Sidebar.tsx',
    'src/app/(dashboard)/settings/page.tsx',
    'src/app/(dashboard)/warehouses/options/page.tsx',
];

function deployNode(node) {
    return new Promise((resolve) => {
        const conn = new Client();
        const base = `/www/wwwroot/${node.dir}`;
        conn.on('ready', () => {
            conn.exec(`mkdir -p "${base}/src/app/(dashboard)/warehouses/options"`, (e, s) => {
                s.on('close', () => {
                    conn.sftp((err, sftp) => {
                        if (err) { conn.end(); resolve(); return; }
                        let idx = 0;
                        const next = () => {
                            if (idx >= FILES.length) {
                                sftp.end();
                                conn.exec(`cd "${base}" && npm run build 2>&1 | tail -2 && pm2 restart ${node.pm2} 2>/dev/null || true && echo "✅ ${node.dir} DONE"`, (e, s2) => {
                                    s2.on('data', d => process.stdout.write(`[${node.pm2}] ${d}`));
                                    s2.stderr.on('data', d => process.stderr.write(`[${node.pm2}] ${d}`));
                                    s2.on('close', () => { conn.end(); resolve(); });
                                });
                                return;
                            }
                            const f = FILES[idx++];
                            sftp.fastPut(path.join(__dirname, f), `${base}/${f}`, (e) => {
                                if (e) console.error(`  ❌ [${node.pm2}] ${f}`);
                                else console.log(`  📤 [${node.pm2}] ${f}`);
                                next();
                            });
                        };
                        next();
                    });
                });
                s.resume();
            });
        }).on('error', (e) => { console.error(`❌ ${node.dir}:`, e.message); resolve(); })
          .connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
    });
}

async function main() {
    console.log('🚀 Deploying warehouse opts to N1-N10...\n');
    for (const node of NODES) {
        console.log(`\n=== ${node.dir} ===`);
        await deployNode(node);
    }
    console.log('\n🎉 ALL DONE!');
}
main();
