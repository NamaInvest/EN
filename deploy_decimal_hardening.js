/**
 * Deploy: Decimal Hardening - All n() wrapper fixes to fleet
 * Syncs all modified files from the hardening branch to production servers
 */
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' };
const ARCHIVE_NAME = 'decimal_hardening.tar.gz';
const LOCAL_ARCHIVE = path.join(__dirname, ARCHIVE_NAME);
const REMOTE_ARCHIVE = `/root/${ARCHIVE_NAME}`;

// All files modified during the hardening session
const FILES = [
    'src/lib/decimal-utils.ts',
    'src/lib/auto-decompose.ts',
    'src/lib/telegram-bot.ts',
    'src/lib/customer-statement.ts',
    'src/lib/pos-session-engine.ts',
    'src/lib/subscription-engine.ts',
    'src/lib/saudi-eos-engine.ts',
    'src/lib/credit-check.ts',
    'src/lib/fx-revaluation.ts',
    'src/lib/ifrs9-ecl.ts',
    'src/lib/wht-engine.ts',
    'src/app/api/finance/petty-cash/[id]/process/route.ts',
    'src/app/api/hr/gosi/route.ts',
    'src/app/api/hr/payroll/run/route.ts',
    'src/app/api/cron/hr/route.ts',
    'src/app/api/cron/scheduled-reports/route.ts',
    'src/app/api/reports/customer-statement/route.ts',
    'src/app/api/manufacturing/mrp/route.ts',
    'src/app/api/purchase-orders/[id]/route.ts',
    'src/app/api/purchase-returns/route.ts',
    'src/app/api/sales-returns/route.ts',
    'src/app/api/treasury/balance/route.ts',
    'src/app/api/bookings/invoice/route.ts',
    'src/app/api/smart-transfers/route.ts',
    'src/app/api/procurement/rfq/[id]/award/route.ts',
    'src/app/api/procurement/rfq/[id]/comparison/route.ts',
    'src/app/api/finance/checks/[id]/process/route.ts',
    'src/app/api/finance/cfo/route.ts',
    'src/app/api/finance/cfo-dashboard/route.ts',
    'src/app/api/payroll/calculate/route.ts',
    'src/app/invoice/[id]/page.tsx',
];

const NODES = [
    { path: '/www/wwwroot/namainvist.com', pm2: 'main-site' },
    { path: '/www/wwwroot/n1.namainvist.com', pm2: 'n1-main' },
    { path: '/www/wwwroot/n11.namainvist.com', pm2: 'saas-app' },
];

function execCommand(conn, cmd, timeout = 600000) {
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
    console.log('📦 Creating archive of hardened files...');
    const existing = FILES.filter(f => fs.existsSync(path.join(__dirname, f)));
    console.log(`   Found ${existing.length}/${FILES.length} files`);
    execSync(`tar -czf ${ARCHIVE_NAME} ${existing.join(' ')}`, { cwd: __dirname });
    console.log(`   Archive: ${(fs.statSync(LOCAL_ARCHIVE).size / 1024).toFixed(1)} KB`);

    const conn = new Client();
    conn.on('ready', () => {
        conn.sftp(async (err, sftp) => {
            try {
                await uploadFile(sftp, LOCAL_ARCHIVE, REMOTE_ARCHIVE);
                console.log('✅ Uploaded to server\n');

                for (const node of NODES) {
                    console.log(`🖥️  Deploying to ${node.path} (${node.pm2})`);
                    await execCommand(conn, `cd ${node.path} && tar -xzf ${REMOTE_ARCHIVE}`);
                    console.log('  📂 Files extracted');
                    
                    console.log('  🔨 Building...');
                    const res = await execCommand(conn, `cd ${node.path} && rm -rf .next && npm run build 2>&1 | tail -5`);
                    console.log('  ' + (res.stdout || res.stderr).trim().split('\n').pop());
                    
                    await execCommand(conn, `pm2 restart ${node.pm2}`);
                    console.log(`  ✅ ${node.pm2} restarted\n`);
                }

                await execCommand(conn, `rm ${REMOTE_ARCHIVE}`);
                fs.unlinkSync(LOCAL_ARCHIVE);
                console.log('🎉 Decimal Hardening deployed to all fleet nodes!');
            } catch (e) { console.error('❌', e); }
            finally { conn.end(); }
        });
    });
    conn.on('error', e => console.error('❌', e));
    conn.connect(SERVER);
}

run();
