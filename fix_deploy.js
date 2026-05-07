const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const TARGETS = [
    { base: '/www/wwwroot/namainvist.com', pm2: 'main-site' },
    { base: '/www/wwwroot/n1.namainvist.com', pm2: 'n1-main' },
    { base: '/www/wwwroot/n11.namainvist.com', pm2: 'saas-app' }
];

const FILES = [
    'src/lib/vector-store.ts',
    'src/lib/langchain-orchestrator.ts',
    'src/lib/field-audit.ts',
];

const LOCAL_BASE = 'd:\\namasoft9-3-main';

function execCommand(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let out = '';
            stream.on('data', d => { out += d; process.stdout.write(d.toString()); });
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => resolve(out));
        });
    });
}

const conn = new Client();
conn.on('ready', async () => {
    console.log('✅ Connected\n');
    const sftp = await new Promise((res, rej) => conn.sftp((e, s) => e ? rej(e) : res(s)));

    for (const t of TARGETS) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`🚀 FIX DEPLOY → ${t.base}`);
        console.log(`${'='.repeat(50)}\n`);

        for (const file of FILES) {
            const local = path.join(LOCAL_BASE, file);
            const remote = `${t.base}/${file}`;
            if (!fs.existsSync(local)) { console.log(`  ⚠️ SKIP: ${file}`); continue; }
            const data = fs.readFileSync(local);
            await new Promise((res, rej) => sftp.writeFile(remote, data, e => e ? rej(e) : res()));
            console.log(`  ✅ ${file}`);
        }

        console.log('\n🗑️  Clearing cache & rebuilding...');
        await execCommand(conn, `cd ${t.base} && rm -rf .next && npm run build 2>&1 | tail -10`);
        
        console.log(`\n🔄 Restarting ${t.pm2}...`);
        await execCommand(conn, `pm2 restart ${t.pm2}`);
    }

    console.log('\n\n📊 Final PM2 Status:');
    await execCommand(conn, 'pm2 status');
    conn.end();
});

conn.on('error', err => console.error('❌', err.message));
conn.connect(SERVER);
