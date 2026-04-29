const { Client } = require('ssh2');
const path = require('path');

const NODES = [
    { dir: 'n1.namainvist.com', pm2: 'n1-main' },
    { dir: 'n2.namainvist.com', pm2: 'n2' },
    { dir: 'n3.namainvist.com', pm2: 'n3' },
    { dir: 'n4.namainvist.com', pm2: 'n4' },
    { dir: 'n5.namainvist.com', pm2: 'n5' },
    { dir: 'n6.namainvist.com', pm2: 'n6' },
    { dir: 'n7.namainvist.com', pm2: 'n7' },
    { dir: 'n8.namainvist.com', pm2: 'n8' },
    { dir: 'n9.namainvist.com', pm2: 'n9' },
    { dir: 'n10.namainvist.com', pm2: 'n10' },
    { dir: 'n11.namainvist.com', pm2: 'n11' },
];

const FILES = [
    'src/app/(dashboard)/products/page.tsx',
    'src/app/api/products/route.ts',
    'src/app/api/products/[id]/route.ts',
];

function deployNode(node) {
    return new Promise((resolve) => {
        const conn = new Client();
        const base = `/www/wwwroot/${node.dir}`;
        conn.on('ready', () => {
            conn.sftp((err, sftp) => {
                if (err) { conn.end(); resolve(); return; }
                const uploadNext = (idx) => {
                    if (idx >= FILES.length) {
                        sftp.end();
                        const cmd = `cd "${base}" && npm run build 2>&1 | tail -3 && pm2 restart ${node.pm2} && echo "✅ ${node.pm2} DONE"`;
                        conn.exec(cmd, (e, s) => {
                            s.on('data', d => process.stdout.write(`[${node.pm2}] ${d}`));
                            s.stderr.on('data', d => process.stderr.write(`[${node.pm2}] ${d}`));
                            s.on('close', () => { conn.end(); resolve(); });
                        });
                        return;
                    }
                    const f = FILES[idx];
                    sftp.fastPut(path.join(__dirname, f), `${base}/${f}`, (e) => {
                        if (e) console.error(`❌ [${node.pm2}] ${f}:`, e.message);
                        else console.log(`📤 [${node.pm2}] ${f}`);
                        uploadNext(idx + 1);
                    });
                };
                uploadNext(0);
            });
        }).on('error', (e) => { console.error(`❌ ${node.dir}:`, e.message); resolve(); })
          .connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
    });
}

async function main() {
    console.log('🚀 Deploying Unit Form UI fix to N1-N11...\n');
    for (const node of NODES) {
        console.log(`\n=== ${node.dir} ===`);
        await deployNode(node);
    }
    console.log('\n🎉 ALL DONE!');
}
main();
