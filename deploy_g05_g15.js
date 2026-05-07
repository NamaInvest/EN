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
    "src/lib/kanban-engine.ts",
    "src/lib/recruitment-engine.ts",
    "src/lib/timesheet-engine.ts",
    "src/lib/dms-engine.ts",
    "src/lib/contract-engine.ts",
    "src/lib/quality-inspection-engine.ts",
    "src/app/api/system/kanban/route.ts",
    "src/app/api/hr/recruitment/route.ts",
    "src/app/api/hr/timesheet/route.ts",
    "src/app/api/contracts/route.ts",
    "src/app/api/manufacturing/quality/route.ts",
];

function exec(c, cmd) { return new Promise((ok) => { c.exec(cmd, (e, s) => { if (e) return ok(''); let o = ''; s.on('data', d => o += d); s.stderr.on('data', () => {}); s.on('close', () => ok(o)); }); }); }

async function run() {
    const conn = new Client();
    conn.on('ready', async () => {
        console.log('Connected — G-05 to G-15 deploy');
        const sftp = await new Promise((ok, no) => conn.sftp((e, s) => e ? no(e) : ok(s)));
        const mkd = (d) => new Promise(ok => sftp.mkdir(d, () => ok()));

        for (const t of TARGETS) {
            const dirs = new Set();
            for (const f of FILES) { let c = t.base; f.split('/').slice(0, -1).forEach(p => { c += '/' + p; dirs.add(c); }); }
            for (const d of [...dirs].sort()) await mkd(d);
            let ok = 0;
            for (const f of FILES) {
                const lp = path.join(LOCAL, f.replace(/\//g, '\\'));
                try {
                    await new Promise((resolve, reject) => sftp.writeFile(t.base + '/' + f, fs.readFileSync(lp), e => e ? reject(e) : resolve()));
                    ok++; console.log('  OK ' + f.split('/').pop());
                } catch { console.log('  ERR ' + f); }
            }
            console.log(t.pm2 + ': ' + ok + '/' + FILES.length + '\n');
        }
        for (const t of TARGETS) {
            console.log('Build ' + t.pm2 + '...');
            await exec(conn, 'cd ' + t.base + ' && rm -rf .next && npm run build 2>&1 | tail -3');
            await exec(conn, 'pm2 restart ' + t.pm2);
            console.log(t.pm2 + ' DONE');
        }
        console.log('\n🎉 ALL G-05 to G-15 DEPLOYED!');
        conn.end();
    });
    conn.connect(SERVER);
}
run();
