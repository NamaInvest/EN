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
    "src/lib/import-export-engine.ts",
    "src/lib/workflow-builder-engine.ts",
    "src/lib/print-template-engine.ts",
    "src/lib/dashboard-builder-engine.ts",
    "src/app/api/system/import-export/route.ts",
    "src/app/api/system/workflow/route.ts",
    "src/app/api/system/print-templates/route.ts",
    "src/app/api/system/dashboard-builder/route.ts",
];

function exec(c, cmd) { return new Promise((ok) => { c.exec(cmd, (e, s) => { if (e) return ok(''); let o = ''; s.on('data', d => o += d); s.stderr.on('data', d => {}); s.on('close', () => ok(o)); }); }); }

async function run() {
    const conn = new Client();
    conn.on('ready', async () => {
        console.log('Connected');
        const sftp = await new Promise((ok, no) => conn.sftp((e, s) => e ? no(e) : ok(s)));
        const mkd = (d) => new Promise(ok => sftp.mkdir(d, () => ok()));

        for (const t of TARGETS) {
            const dirs = new Set();
            for (const f of FILES) {
                let c = t.base;
                f.split('/').slice(0, -1).forEach(p => { c += '/' + p; dirs.add(c); });
            }
            for (const d of [...dirs].sort()) await mkd(d);

            let ok = 0;
            for (const f of FILES) {
                const lp = path.join(LOCAL, f.replace(/\//g, '\\'));
                try {
                    const content = fs.readFileSync(lp);
                    await new Promise((resolve, reject) => {
                        sftp.writeFile(t.base + '/' + f, content, (err) => err ? reject(err) : resolve());
                    });
                    ok++;
                    console.log('  OK ' + f.split('/').pop());
                } catch (e) { console.log('  ERR ' + f); }
            }
            console.log(t.pm2 + ': ' + ok + '/' + FILES.length);
        }

        for (const t of TARGETS) {
            console.log('Building ' + t.pm2 + '...');
            await exec(conn, 'cd ' + t.base + ' && rm -rf .next && npm run build 2>&1 | tail -3');
            await exec(conn, 'pm2 restart ' + t.pm2);
            console.log(t.pm2 + ' DONE');
        }
        console.log('ALL DEPLOYED');
        conn.end();
    });
    conn.connect(SERVER);
}
run();
