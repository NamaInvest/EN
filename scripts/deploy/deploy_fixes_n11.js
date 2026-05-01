/**
 * Deploy code-quality fixes to n11 (already authorized).
 * No DB schema changes — code-only deploy.
 *
 * Files:
 *   - auto-journal.ts (added postManufacturingCompletion, postMaterialIssueToWIP)
 *   - work-orders/route.ts (now uses auto-journal — no hardcoded account IDs)
 *   - reversal/route.ts (uses createJournalEntry — no manual balance mutation)
 *   - seed-accounts.ts (added 1310/1330/1340/5120/5130 accounts)
 */

const { Client } = require('ssh2');
const fs = require('fs');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
const REMOTE_BASE = '/www/wwwroot/n11.namainvist.com';

const FILES = [
    'src/lib/auto-journal.ts',
    'src/app/api/manufacturing/work-orders/route.ts',
    'src/app/api/accounting/reversal/route.ts',
    'prisma/seed-accounts.ts',
];

const conn = new Client();
conn.on('error', e => { console.error('❌ SSH error:', e.message); process.exit(1); });

conn.on('ready', async () => {
    console.log(`🔌 Connected to ${SERVER.host}\n`);
    try {
        const sftp = await new Promise((res, rej) => conn.sftp((e, s) => e ? rej(e) : res(s)));

        console.log('━━━ Upload code files ━━━');
        for (const f of FILES) {
            const remote = `${REMOTE_BASE}/${f}`;
            const dir = remote.split('/').slice(0, -1).join('/');
            await runCommand(`mkdir -p "${dir}"`);
            await new Promise((res, rej) => {
                const ws = sftp.createWriteStream(remote);
                ws.on('close', () => { console.log(`  ✅ ${f}`); res(); });
                ws.on('error', rej);
                ws.write(fs.readFileSync(f)); ws.end();
            });
        }
        console.log('');

        console.log('━━━ Build ━━━');
        const buildOut = await runCommand(`cd ${REMOTE_BASE} && npm run build 2>&1 | tail -8`);
        console.log(buildOut.trim());
        if (buildOut.toLowerCase().includes('failed to compile') || buildOut.toLowerCase().includes('build failed')) {
            throw new Error('Build failed');
        }
        console.log('');

        console.log('━━━ Restart pm2 ━━━');
        const restart = await runCommand(`pm2 restart saas-app && sleep 2 && pm2 list | grep saas-app`);
        console.log(restart.trim());
        console.log('');

        console.log('=== ✅ FIXES DEPLOYED ===');
        conn.end();
    } catch (e) {
        console.error('\n❌ Deploy failed:', e.message || e);
        conn.end();
        process.exit(1);
    }
});

function runCommand(cmd) {
    return new Promise((res, rej) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return rej(err);
            let out = '';
            stream.on('data', d => out += d);
            stream.stderr.on('data', d => out += d);
            stream.on('close', () => res(out));
        });
    });
}

conn.connect(SERVER);
