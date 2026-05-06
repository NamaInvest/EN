// Final i18n batch deploy.
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 };

const FILES = [
    'src/app/(dashboard)/v3/master/page.tsx',
    'src/app/(dashboard)/v3/construction/boq/page.tsx',
    'src/app/(dashboard)/v3/distribution/wms/page.tsx',
    'src/app/(dashboard)/v3/clinic/lab/page.tsx',
    'src/app/(dashboard)/v3/clinic/appointments/page.tsx',
];
const SITES = ['namainvist.com', 'n1.namainvist.com', 'n11.namainvist.com'];
const PM2_NAMES = { 'namainvist.com': 'main-site', 'n1.namainvist.com': 'n1-main', 'n11.namainvist.com': 'saas-app' };

function exec(conn, cmd) {
    return new Promise(r => {
        conn.exec(cmd, (err, stream) => {
            if (err) return r({ code: -1, stdout: '', stderr: String(err) });
            let stdout = '', stderr = '';
            stream.on('data', d => { stdout += d; });
            stream.stderr.on('data', d => { stderr += d; });
            stream.on('close', code => r({ code, stdout, stderr }));
        });
    });
}
const log = (...a) => console.log(...a);

async function run() {
    log('========== FINAL I18N BATCH DEPLOY ==========\n');
    const conn = new Client();
    conn.on('ready', async () => {
        try {
            for (const site of SITES) {
                log(`\n=== ${site} ===`);
                await new Promise(resolve => {
                    conn.sftp(async (err, sftp) => {
                        if (err) { log('sftp:', err); return resolve(null); }
                        for (const f of FILES) {
                            const local = path.join(__dirname, f);
                            const remote = `/www/wwwroot/${site}/${f}`;
                            await exec(conn, `mkdir -p '${path.posix.dirname(remote)}'`);
                            await new Promise(res => sftp.fastPut(local, remote, {}, e => {
                                log(`  ${e ? '❌' : '✅'} ${f}`);
                                res(null);
                            }));
                        }
                        resolve(null);
                    });
                });

                log('  Building...');
                await exec(conn, `rm -rf /www/wwwroot/${site}/.next 2>&1`);
                const buildR = await exec(conn, `cd /www/wwwroot/${site} && timeout 900 bash -c 'npm run build > /tmp/${site.replace(/\./g, '_')}_i18n_final_build.log 2>&1; echo EXIT=$?'`);
                log(`  ${buildR.stdout.trim()}`);
                const success = await exec(conn, `grep -c 'Compiled successfully\\|✓ Compiled' /tmp/${site.replace(/\./g, '_')}_i18n_final_build.log || echo 0`);
                log(`  Build: ${parseInt(success.stdout.trim()) > 0 ? '✅' : '❌'}`);
                if (parseInt(success.stdout.trim()) === 0) {
                    log('  Last 10 lines of build log:');
                    log((await exec(conn, `tail -10 /tmp/${site.replace(/\./g, '_')}_i18n_final_build.log`)).stdout);
                }

                await exec(conn, `pm2 restart ${PM2_NAMES[site]} --update-env 2>&1`);
                log(`  Restarted ${PM2_NAMES[site]}`);
            }
            await exec(conn, 'pm2 reset all 2>&1');

            await new Promise(r => setTimeout(r, 8000));

            log('\n========== VERIFICATION ==========');
            log((await exec(conn, "pm2 jlist 2>/dev/null | python3 -c \"import sys,json; [print(p['name'].ljust(15), p['pm2_env']['status'], 'restarts:'+str(p['pm2_env']['restart_time'])) for p in json.load(sys.stdin)]\"")).stdout);

            log('HTTP:');
            for (const [site, pm2] of Object.entries(PM2_NAMES)) {
                const port = pm2 === 'main-site' ? 3000 : pm2 === 'n1-main' ? 3001 : 3500;
                const r = await exec(conn, `curl -s -o /dev/null -w '%{http_code}' --max-time 8 http://localhost:${port}`);
                log(`  ${site}: ${r.stdout.trim()}`);
            }

            log('\nfiscal-years endpoint:');
            for (const [site, pm2] of Object.entries(PM2_NAMES)) {
                const port = pm2 === 'main-site' ? 3000 : pm2 === 'n1-main' ? 3001 : 3500;
                const r = await exec(conn, `curl -s -o /dev/null -w '%{http_code}' --max-time 8 http://localhost:${port}/api/accounting/fiscal-years`);
                log(`  ${site}/api/accounting/fiscal-years: ${r.stdout.trim()}`);
            }

            log('\n========== ALL DONE ==========');
        } catch (err) {
            console.error('FATAL:', err);
        }
        conn.end();
        process.exit(0);
    });
    conn.on('error', e => { console.error('SSH:', e.message); process.exit(1); });
    conn.connect(SERVER);
}

run();
