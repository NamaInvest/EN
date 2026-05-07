const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
const TARGETS = [
    { base: '/www/wwwroot/namainvist.com', pm2: 'main-site' },
    { base: '/www/wwwroot/n1.namainvist.com', pm2: 'n1-main' },
    { base: '/www/wwwroot/n11.namainvist.com', pm2: 'saas-app' }
];
const LOCAL = 'd:\\namasoft9-3-main';
const FILES = [
    "prisma/schema.prisma",
    "src/lib/dms-engine.ts",
];

function exec(c, cmd) { return new Promise((ok) => { c.exec(cmd, (e, s) => { if (e) return ok(''); let o = ''; s.on('data', d => o += d); s.stderr.on('data', () => {}); s.on('close', () => ok(o)); }); }); }

async function run() {
    const conn = new Client();
    conn.on('ready', async () => {
        console.log('Connected — Schema + DMS deploy');
        const sftp = await new Promise((ok, no) => conn.sftp((e, s) => e ? no(e) : ok(s)));
        for (const t of TARGETS) {
            let ok = 0;
            for (const f of FILES) {
                const lp = path.join(LOCAL, f.replace(/\//g, '\\'));
                try {
                    await new Promise((resolve, reject) => sftp.writeFile(t.base + '/' + f, fs.readFileSync(lp), e => e ? reject(e) : resolve()));
                    ok++; console.log('  OK ' + t.pm2 + '/' + f.split('/').pop());
                } catch { console.log('  ERR ' + f); }
            }
        }
        console.log('\nRunning prisma generate + db push + build on all servers...');
        for (const t of TARGETS) {
            console.log('\n' + t.pm2 + ':');
            const gen = await exec(conn, 'cd ' + t.base + ' && npx prisma generate 2>&1 | tail -2');
            console.log('  generate: ' + gen.trim().split('\n').pop());
            const push = await exec(conn, 'cd ' + t.base + ' && npx prisma db push --accept-data-loss 2>&1 | tail -3');
            console.log('  db push: ' + push.trim().split('\n').pop());
            await exec(conn, 'cd ' + t.base + ' && rm -rf .next && npm run build 2>&1 | tail -2');
            await exec(conn, 'pm2 restart ' + t.pm2);
            console.log('  ' + t.pm2 + ' DONE');
        }
        console.log('\n🎉 SCHEMA DEPLOYED!');
        conn.end();
    });
    conn.connect(SERVER);
}
run();
