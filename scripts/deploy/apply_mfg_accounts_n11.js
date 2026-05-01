/**
 * Apply manufacturing accounts migration to n11_db (already authorized).
 * Idempotent — uses WHERE NOT EXISTS so safe to re-run.
 */
const { Client } = require('ssh2');
const fs = require('fs');
const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
const REMOTE = '/www/wwwroot/n11.namainvist.com';
const F = 'prisma/migrations/20260501_add_manufacturing_accounts/migration.sql';
const conn = new Client();
conn.on('ready', async () => {
    const sftp = await new Promise((r, j) => conn.sftp((e, s) => e ? j(e) : r(s)));
    const remote = `${REMOTE}/${F}`;
    const dir = remote.split('/').slice(0, -1).join('/');
    await new Promise(r => conn.exec(`mkdir -p "${dir}"`, (_, s) => s.on('close', r)));
    await new Promise((r, j) => {
        const ws = sftp.createWriteStream(remote);
        ws.on('close', () => { console.log('✅ Uploaded SQL'); r(); });
        ws.on('error', j);
        ws.write(fs.readFileSync(F)); ws.end();
    });

    const cmd = `cd ${REMOTE} && psql "$(grep '^DATABASE_URL' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | sed 's/?.*$//')" -f ${F} 2>&1`;
    const out = await new Promise(r => conn.exec(cmd, (_, s) => {
        let o = ''; s.on('data', d => o += d); s.stderr.on('data', d => o += d); s.on('close', () => r(o));
    }));
    console.log(out.trim());

    // Verify
    const verify = await new Promise(r => conn.exec(
        `cd ${REMOTE} && psql "$(grep '^DATABASE_URL' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | sed 's/?.*$//')" -t -c "SELECT code, name FROM accounts WHERE code IN ('1310','1330','1340','5120','5130') ORDER BY code;"`,
        (_, s) => { let o=''; s.on('data', d=>o+=d); s.on('close', ()=>r(o)); }
    ));
    console.log('\nVerification:');
    console.log(verify.trim());
    conn.end();
});
conn.connect(SERVER);
