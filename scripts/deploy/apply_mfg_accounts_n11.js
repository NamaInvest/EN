/**
 * Apply manufacturing accounts SQL to n11_db.
 * Uses the same proven pattern as deploy_numbering_engine.js
 */
const { Client } = require('ssh2');
const fs = require('fs');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
const REMOTE_BASE = '/www/wwwroot/n11.namainvist.com';
const SQL = 'prisma/migrations/20260501_add_manufacturing_accounts/migration.sql';

const conn = new Client();
conn.on('error', e => { console.error('❌ SSH error:', e.message); process.exit(1); });

conn.on('ready', async () => {
    console.log('🔌 Connected\n');
    try {
        const sftp = await new Promise((res, rej) => conn.sftp((e, s) => e ? rej(e) : res(s)));

        // Upload SQL
        const remote = `${REMOTE_BASE}/${SQL}`;
        const dir = remote.split('/').slice(0, -1).join('/');
        await runCommand(`mkdir -p "${dir}"`);
        await new Promise((res, rej) => {
            const ws = sftp.createWriteStream(remote);
            ws.on('close', () => { console.log(`✅ Uploaded: ${SQL}`); res(); });
            ws.on('error', rej);
            ws.write(fs.readFileSync(SQL)); ws.end();
        });

        // Apply SQL
        const out = await runCommand(
            `cd ${REMOTE_BASE} && psql "$(grep '^DATABASE_URL' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | sed 's/?.*$//')" -f ${SQL} 2>&1`
        );
        console.log(out.trim());

        // Verify
        const verify = await runCommand(
            `cd ${REMOTE_BASE} && psql "$(grep '^DATABASE_URL' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | sed 's/?.*$//')" -c "SELECT code, name FROM accounts WHERE code IN ('1310','1330','1340','5120','5130') ORDER BY code;" 2>&1`
        );
        console.log('\n=== Verification ===');
        console.log(verify.trim());
        conn.end();
    } catch (e) {
        console.error('❌ Failed:', e.message || e);
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
