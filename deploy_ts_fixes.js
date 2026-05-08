/**
 * Deploy KICKOFF Day 2-5: TypeScript fixes + decimal utils to fleet
 */
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
const ARCHIVE_NAME = 'ts_fixes.tar.gz';
const LOCAL_ARCHIVE = path.join(__dirname, ARCHIVE_NAME);
const REMOTE_ARCHIVE = `/root/${ARCHIVE_NAME}`;

const FILES = [
    'src/lib/decimal-utils.ts',
    'src/app/api/reports/what-if/route.ts',
    'src/app/api/reports/[type]/route.ts',
    'src/app/api/purchases/po/[id]/landed-costs/[costId]/allocate/route.ts',
    'src/app/api/purchases/letters-of-credit/landed-costs/route.ts',
    'src/app/api/purchases/matching/route.ts',
    'src/app/api/bi/kpis/route.ts',
];

const NODES = [
    { path: '/www/wwwroot/namainvist.com', pm2: 'main-site' },
    { path: '/www/wwwroot/n1.namainvist.com', pm2: 'n1-main' },
    { path: '/www/wwwroot/n11.namainvist.com', pm2: 'saas-app' },
];

function execCommand(conn, cmd, timeout = 300000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => resolve({ code: -1, stdout: '', stderr: 'TIMEOUT' }), timeout);
        conn.exec(cmd, (err, stream) => {
            if (err) { clearTimeout(timer); return reject(err); }
            let stdout = '', stderr = '';
            stream.on('data', d => { stdout += d; });
            stream.stderr.on('data', d => { stderr += d; });
            stream.on('close', (code) => { clearTimeout(timer); resolve({ code, stdout, stderr }); });
        });
    });
}

async function uploadFile(sftp, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        sftp.fastPut(localPath, remotePath, (err) => err ? reject(err) : resolve());
    });
}

async function run() {
    console.log('📦 Creating archive...');
    const existing = FILES.filter(f => fs.existsSync(path.join(__dirname, f)));
    execSync(`tar -czf ${ARCHIVE_NAME} ${existing.join(' ')}`, { cwd: __dirname });
    console.log(`   ${existing.length} files, ${(fs.statSync(LOCAL_ARCHIVE).size / 1024).toFixed(1)} KB`);

    const conn = new Client();
    conn.on('ready', () => {
        conn.sftp(async (err, sftp) => {
            try {
                await uploadFile(sftp, LOCAL_ARCHIVE, REMOTE_ARCHIVE);
                console.log('✅ Uploaded\n');

                for (const node of NODES) {
                    console.log(`🖥️  ${node.path}`);
                    await execCommand(conn, `cd ${node.path} && tar -xzf ${REMOTE_ARCHIVE}`);
                    console.log('  📂 Extracted');
                    const res = await execCommand(conn, `cd ${node.path} && rm -rf .next && npm run build 2>&1 | tail -3`);
                    console.log('  ' + res.stdout.trim().split('\n').pop());
                    await execCommand(conn, `pm2 restart ${node.pm2}`);
                    console.log(`  ✅ ${node.pm2} restarted\n`);
                }

                await execCommand(conn, `rm ${REMOTE_ARCHIVE}`);
                fs.unlinkSync(LOCAL_ARCHIVE);
                console.log('🎉 Done!');
            } catch (e) { console.error('❌', e); }
            finally { conn.end(); }
        });
    });
    conn.on('error', e => console.error('❌', e));
    conn.connect(SERVER);
}

run();
