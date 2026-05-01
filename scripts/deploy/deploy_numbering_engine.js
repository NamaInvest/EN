/**
 * One-time deploy: Numbering Sequences Engine (Foundation 0.1)
 * Target: n11.namainvist.com (n11_db only)
 *
 * Approach:
 *   - Uses an EXPLICIT, REVIEWABLE SQL migration file (not `prisma db push`)
 *   - Migration is idempotent (CREATE TABLE IF NOT EXISTS, ON CONFLICT DO NOTHING)
 *   - Each step logged separately for audit trail
 */

const { Client } = require('ssh2');
const fs = require('fs');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
const REMOTE_BASE = '/www/wwwroot/n11.namainvist.com';

// Code files to upload
const CODE_FILES = [
    'prisma/schema.prisma',
    'prisma/seed.ts',
    'src/lib/numbering.ts',
    'src/app/api/system/numbering/route.ts',
    'src/app/api/manufacturing/work-orders/route.ts',
];

// Migration SQL file (explicit, reviewed, committed)
const MIGRATION_SQL = 'prisma/migrations/20260501_add_numbering_sequences/migration.sql';

const conn = new Client();
conn.on('error', e => { console.error('❌ SSH error:', e.message); process.exit(1); });

conn.on('ready', async () => {
    console.log(`🔌 Connected to ${SERVER.host}\n`);
    try {
        const sftp = await new Promise((res, rej) => conn.sftp((e, s) => e ? rej(e) : res(s)));

        // ─── Step 1: Upload migration SQL FIRST ─────────────────────────
        console.log('━━━ Step 1/5: Upload migration SQL ━━━');
        await uploadFile(sftp, MIGRATION_SQL);
        console.log('');

        // ─── Step 2: Apply SQL migration via psql (n11_db) ──────────────
        console.log('━━━ Step 2/5: Apply SQL migration to n11_db ━━━');
        const psqlCmd = `cd ${REMOTE_BASE} && psql "$(grep '^DATABASE_URL' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")" -f ${MIGRATION_SQL} 2>&1`;
        const psqlOut = await runCommand(psqlCmd);
        console.log(psqlOut.trim());
        if (psqlOut.toLowerCase().includes('error') && !psqlOut.includes('already exists')) {
            throw new Error('SQL migration failed');
        }
        console.log('✅ Migration applied (or already present)\n');

        // ─── Step 3: Upload code files ──────────────────────────────────
        console.log('━━━ Step 3/5: Upload code files ━━━');
        for (const f of CODE_FILES) {
            await uploadFile(sftp, f);
        }
        console.log('');

        // ─── Step 4: Regenerate Prisma client + build ───────────────────
        console.log('━━━ Step 4/5: prisma generate + build ━━━');
        const buildOut = await runCommand(
            `cd ${REMOTE_BASE} && npx prisma generate 2>&1 | tail -3 && npm run build 2>&1 | tail -8`
        );
        console.log(buildOut.trim());
        if (buildOut.toLowerCase().includes('failed to compile') || buildOut.toLowerCase().includes('build failed')) {
            throw new Error('Build failed — refusing to restart pm2');
        }
        console.log('');

        // ─── Step 5: Restart ────────────────────────────────────────────
        console.log('━━━ Step 5/5: pm2 restart ━━━');
        const restartOut = await runCommand(
            `pm2 restart saas-app && sleep 2 && pm2 list | grep saas-app`
        );
        console.log(restartOut.trim());
        console.log('');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('=== ✅ DEPLOY COMPLETE ===');
        console.log('🔗 https://n11.namainvist.com');
        console.log('🧪 Verify: GET https://n11.namainvist.com/api/system/numbering?peek=WO');
        conn.end();
    } catch (e) {
        console.error('\n❌ Deploy failed:', e.message || e);
        conn.end();
        process.exit(1);
    }
});

async function uploadFile(sftp, localPath) {
    const remotePath = `${REMOTE_BASE}/${localPath.replace(/\\/g, '/')}`;
    const remoteDir = remotePath.split('/').slice(0, -1).join('/');
    await runCommand(`mkdir -p "${remoteDir}"`);
    await new Promise((res, rej) => {
        const data = fs.readFileSync(localPath);
        const ws = sftp.createWriteStream(remotePath);
        ws.on('close', () => { console.log(`  ✅ ${localPath}`); res(); });
        ws.on('error', rej);
        ws.write(data); ws.end();
    });
}

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
