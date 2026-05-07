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

const FILE = 'src/lib/field-audit.ts';
const LOCAL = path.join('d:\\namasoft9-3-main', FILE);

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
    const data = fs.readFileSync(LOCAL);

    for (const t of TARGETS) {
        const remote = `${t.base}/${FILE}`;
        console.log(`📤 Uploading field-audit.ts to ${t.base}...`);
        await new Promise((res, rej) => sftp.writeFile(remote, data, e => e ? rej(e) : res()));
        console.log('  ✅ Uploaded\n');

        console.log(`🏗️  Rebuilding ${t.base}...`);
        await execCommand(conn, `cd ${t.base} && rm -rf .next && npm run build 2>&1 | tail -5`);
        
        console.log(`\n🔄 Restarting ${t.pm2}...`);
        await execCommand(conn, `pm2 restart ${t.pm2}`);
        console.log('');
    }

    console.log('\n📊 Final PM2 Status:');
    await execCommand(conn, 'pm2 status');
    conn.end();
});

conn.on('error', err => console.error('❌', err.message));
conn.connect(SERVER);
