/**
 * One-time deploy: Numbering Sequences Engine (Foundation 0.1)
 * Target: n11.namainvist.com (n11_db only)
 *
 * Steps:
 *   1. Upload 5 files via SCP
 *   2. Run prisma db push (additive — adds numbering_sequences table)
 *   3. Run prisma generate
 *   4. Run npm run build
 *   5. Restart pm2
 */

const { Client } = require('ssh2');
const fs = require('fs');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
const REMOTE_BASE = '/www/wwwroot/n11.namainvist.com';

const FILES = [
    'prisma/schema.prisma',
    'prisma/seed.ts',
    'src/lib/numbering.ts',
    'src/app/api/system/numbering/route.ts',
    'src/app/api/manufacturing/work-orders/route.ts',
];

const conn = new Client();
conn.on('error', e => { console.error('❌ SSH error:', e.message); process.exit(1); });

conn.on('ready', async () => {
    console.log(`🔌 Connected to ${SERVER.host}\n`);
    try {
        // 1. Upload files
        const sftp = await new Promise((res, rej) => conn.sftp((e, s) => e ? rej(e) : res(s)));
        for (const f of FILES) {
            const remote = `${REMOTE_BASE}/${f}`;
            const dir = remote.split('/').slice(0, -1).join('/');
            await runCommand(`mkdir -p "${dir}"`, null);
            await new Promise((res, rej) => {
                const data = fs.readFileSync(f);
                const ws = sftp.createWriteStream(remote);
                ws.on('close', () => { console.log(`✅ Uploaded: ${f}`); res(); });
                ws.on('error', rej);
                ws.write(data); ws.end();
            });
        }
        console.log('');

        // 2. Prisma db push (n11_db — uses default DATABASE_URL on server)
        console.log('📊 Running: npx prisma db push (n11_db)');
        const pushOut = await runCommand(
            `cd ${REMOTE_BASE} && npx prisma db push --skip-generate 2>&1 | tail -20`,
            null
        );
        console.log(pushOut.trim());
        console.log('');

        // 3. Prisma generate
        console.log('⚙️  Running: npx prisma generate');
        const genOut = await runCommand(
            `cd ${REMOTE_BASE} && npx prisma generate 2>&1 | tail -5`,
            null
        );
        console.log(genOut.trim());
        console.log('');

        // 4. Build
        console.log('📦 Running: npm run build');
        const buildOut = await runCommand(
            `cd ${REMOTE_BASE} && npm run build 2>&1 | tail -8`,
            null
        );
        console.log(buildOut.trim());
        console.log('');

        // 5. Restart
        console.log('🚀 Restarting pm2');
        const restartOut = await runCommand(
            `pm2 restart saas-app && sleep 2 && pm2 list | grep saas-app`,
            null
        );
        console.log(restartOut.trim());
        console.log('');

        console.log('=== ✅ DEPLOY COMPLETE ===');
        console.log('🔗 Verify: https://n11.namainvist.com');
        console.log('🧪 Test endpoint: GET https://n11.namainvist.com/api/system/numbering?peek=WO');
        conn.end();
    } catch (e) {
        console.error('❌ Deploy failed:', e.message || e);
        conn.end();
        process.exit(1);
    }
});

function runCommand(cmd, label) {
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
