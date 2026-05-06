// Comprehensive deploy: upload only diff+missing files per site, update .env, build, restart.
// Reads sync_diff_report.json from previous sync run.

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 };
const SITE_PM2 = {
    'namainvist.com': 'main-site',
    'n1.namainvist.com': 'n1-main',
    'n11.namainvist.com': 'saas-app',
};

function exec(conn, cmd) {
    return new Promise((resolve) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return resolve({ code: -1, stdout: '', stderr: String(err) });
            let stdout = '', stderr = '';
            stream.on('data', d => { stdout += d; });
            stream.stderr.on('data', d => { stderr += d; });
            stream.on('close', (code) => resolve({ code, stdout, stderr }));
        });
    });
}

function uploadFile(sftp, localPath, remotePath) {
    return new Promise((resolve) => {
        sftp.fastPut(localPath, remotePath, {}, (err) => {
            if (err) return resolve({ ok: false, err: err.message });
            resolve({ ok: true });
        });
    });
}

function ensureRemoteDir(conn, dir) {
    return exec(conn, `mkdir -p '${dir.replace(/'/g, "'\\''")}'`);
}

async function uploadFilesBatch(conn, files, remoteRoot, label) {
    return new Promise((resolve) => {
        conn.sftp(async (err, sftp) => {
            if (err) {
                console.log(`  SFTP error: ${err.message}`);
                return resolve({ ok: 0, fail: 0 });
            }
            let ok = 0, fail = 0;
            const dirsCreated = new Set();
            for (let i = 0; i < files.length; i++) {
                const f = files[i];
                const local = path.join(__dirname, f);
                if (!fs.existsSync(local)) { fail++; continue; }
                const remote = `${remoteRoot}/${f}`;
                const remoteDir = path.posix.dirname(remote);
                if (!dirsCreated.has(remoteDir)) {
                    await ensureRemoteDir(conn, remoteDir);
                    dirsCreated.add(remoteDir);
                }
                const r = await uploadFile(sftp, local, remote);
                if (r.ok) ok++;
                else { fail++; if (fail < 5) console.log(`    ❌ ${f}: ${r.err}`); }
                if ((i + 1) % 25 === 0) {
                    console.log(`    ${label}: ${i + 1}/${files.length} (ok=${ok}, fail=${fail})`);
                }
            }
            console.log(`    ${label}: DONE ok=${ok}, fail=${fail}`);
            resolve({ ok, fail });
        });
    });
}

async function ensureEnvVars(conn, site) {
    const envPath = `/www/wwwroot/${site}/.env`;
    const r = await exec(conn, `cat ${envPath} 2>/dev/null`);
    const env = r.stdout;
    const additions = [];

    if (!/^MASTER_DB_URL=/m.test(env)) {
        additions.push('MASTER_DB_URL="postgresql://n11_db:n11_pass123@localhost:5432/n11_db"');
    }
    if (!/^POSTGRES_ROOT_PASSWORD=/m.test(env)) {
        additions.push('POSTGRES_ROOT_PASSWORD="RootPassNama123"');
    }
    if (site === 'namainvist.com') {
        if (!/^PROVISION_SSH_HOST=/m.test(env)) {
            additions.push('PROVISION_SSH_HOST="46.4.188.170"');
            additions.push('PROVISION_SSH_USER="root"');
            additions.push('PROVISION_SSH_PASS="_ee4SWbxLVfH9b"');
        }
    }

    if (additions.length > 0) {
        await exec(conn, `cp ${envPath} ${envPath}.bak.$(date +%Y%m%d%H%M%S)`);
        const content = additions.join('\n');
        await exec(conn, `printf '%s\\n' ${additions.map(a => `'${a.replace(/'/g, "'\\''")}'`).join(' ')} >> ${envPath}`);
        return additions.length;
    }
    return 0;
}

async function run() {
    console.log('========== COMPREHENSIVE DEPLOY ==========\n');

    const reportPath = path.join(__dirname, 'sync_diff_report.json');
    if (!fs.existsSync(reportPath)) {
        console.error('FATAL: sync_diff_report.json missing. Run sync first.');
        process.exit(1);
    }
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

    const conn = new Client();
    conn.on('ready', async () => {
        try {
            for (const [site, data] of Object.entries(report)) {
                const filesToUpload = [...data.differ, ...data.onlyLocal];
                console.log(`\n=== ${site} ===`);
                console.log(`  Files to upload: ${filesToUpload.length} (${data.differ.length} diff + ${data.onlyLocal.length} new)`);

                if (filesToUpload.length === 0) {
                    console.log('  No changes — skipping upload');
                } else {
                    console.log('  Creating backup tarball of existing files...');
                    const remoteRoot = `/www/wwwroot/${site}`;
                    // Tar existing files (only those that exist) before overwriting
                    const existingFiles = data.differ; // onlyLocal don't exist on remote
                    if (existingFiles.length > 0) {
                        const tarList = existingFiles.map(f => `"${f}"`).join(' ');
                        const ts = `$(date +%Y%m%d_%H%M%S)`;
                        await exec(conn, `cd ${remoteRoot} && tar -czf /tmp/${site}_predeploy_${ts}.tar.gz ${tarList} 2>/dev/null && echo BACKUP_OK`);
                    }

                    console.log('  Uploading files...');
                    const result = await uploadFilesBatch(conn, filesToUpload, remoteRoot, site);
                    console.log(`  Upload result: ${result.ok} OK, ${result.fail} FAILED`);
                }

                console.log('  Updating .env vars...');
                const added = await ensureEnvVars(conn, site);
                console.log(`  Added ${added} env vars`);

                console.log('  Clearing .next cache...');
                await exec(conn, `rm -rf /www/wwwroot/${site}/.next 2>/dev/null`);
            }

            console.log('\n\n========== INSTALL DEPS + BUILD ==========');
            for (const site of Object.keys(report)) {
                console.log(`\n--- ${site}: npm install ---`);
                const installR = await exec(conn, `cd /www/wwwroot/${site} && timeout 300 npm install --no-audit --no-fund 2>&1 | tail -20`);
                console.log(installR.stdout);

                console.log(`\n--- ${site}: prisma generate ---`);
                const genR = await exec(conn, `cd /www/wwwroot/${site} && npx prisma generate 2>&1 | tail -5`);
                console.log(genR.stdout);

                console.log(`\n--- ${site}: npm run build ---`);
                // Capture build exit code properly: redirect output to file, check $?
                const buildR = await exec(conn, `cd /www/wwwroot/${site} && timeout 900 bash -c 'npm run build > /tmp/${site.replace(/\./g, '_')}_build.log 2>&1; echo "BUILD_EXIT=$?"' && tail -30 /tmp/${site.replace(/\./g, '_')}_build.log`);
                console.log(buildR.stdout);

                const exitCheck = await exec(conn, `grep -c 'Compiled successfully\\|✓ Compiled' /tmp/${site.replace(/\./g, '_')}_build.log || echo 0`);
                const success = parseInt(exitCheck.stdout.trim()) > 0;
                console.log(`  ${success ? '✅ Build SUCCESS' : '❌ BUILD FAILED'} for ${site}`);
            }

            console.log('\n\n========== RESTART PM2 ==========');
            for (const [site, pm2Name] of Object.entries(SITE_PM2)) {
                const r = await exec(conn, `pm2 restart ${pm2Name} --update-env 2>&1 | tail -3`);
                console.log(`${pm2Name}: ${r.stdout.trim()}`);
            }
            await exec(conn, 'pm2 reset all 2>&1');
            await exec(conn, 'pm2 save 2>&1');

            console.log('\nWaiting 15s for apps to stabilize...');
            await new Promise(r => setTimeout(r, 15000));

            console.log('\n\n========== VERIFICATION ==========');
            // 1. Hardcoded creds gone?
            for (const site of Object.keys(report)) {
                const r = await exec(conn, `grep -lE 'n11_pass123|n1_pass123|RootPassNama123|_ee4SWbxLVfH9b' /www/wwwroot/${site}/src/ -r 2>/dev/null | wc -l`);
                const count = parseInt(r.stdout.trim());
                console.log(`  ${site}: ${count === 0 ? '✅' : '⚠️'} ${count} files with hardcoded creds`);
            }

            // 2. PM2 status
            const pm2 = await exec(conn, 'pm2 jlist 2>/dev/null | python3 -c "import sys,json; [print(p[\\"name\\"], p[\\"pm2_env\\"][\\"status\\"], \\"restarts:\\"+str(p[\\"pm2_env\\"][\\"restart_time\\"]) ) for p in json.load(sys.stdin)]"');
            console.log('\n  PM2:');
            console.log(pm2.stdout);

            // 3. HTTP health
            console.log('\n  HTTP health:');
            for (const [site, pm2Name] of Object.entries(SITE_PM2)) {
                const port = pm2Name === 'main-site' ? 3000 : pm2Name === 'n1-main' ? 3001 : 3500;
                const r = await exec(conn, `curl -s -o /dev/null -w '%{http_code}' --max-time 8 http://localhost:${port}`);
                console.log(`    ${site} (port ${port}): HTTP ${r.stdout.trim()}`);
            }

            // 4. Recent ECONNREFUSED count (Redis-related)
            console.log('\n  Recent Redis errors (last 50 log lines):');
            for (const pm2Name of Object.values(SITE_PM2)) {
                const r = await exec(conn, `pm2 logs ${pm2Name} --err --lines 50 --nostream 2>/dev/null | grep -c '6379\\|ECONNREFUSED' | tr -d '\\n'`);
                console.log(`    ${pm2Name}: ${r.stdout} ECONNREFUSED errors`);
            }

            console.log('\n\n========== DONE ==========');
        } catch (err) {
            console.error('FATAL:', err);
        }
        conn.end();
        process.exit(0);
    });
    conn.on('error', e => { console.error('SSH ERROR:', e.message); process.exit(1); });
    conn.connect(SERVER);
}

run();
