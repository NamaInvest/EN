const { Client } = require('ssh2');
const fs = require('fs');
const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' };
const REMOTE = '/www/wwwroot/n11.namainvist.com';
const F = 'prisma/migrations/20260501_add_numbering_sequences/migration.sql';
const conn = new Client();
conn.on('ready', async () => {
    const sftp = await new Promise((r, j) => conn.sftp((e, s) => e ? j(e) : r(s)));
    const remote = `${REMOTE}/${F}`;
    const dir = remote.split('/').slice(0, -1).join('/');
    await new Promise(r => conn.exec(`mkdir -p "${dir}"`, (_, s) => s.on('close', r)));
    await new Promise((r, j) => {
        const ws = sftp.createWriteStream(remote);
        ws.on('close', () => { console.log('✅ Uploaded migration SQL'); r(); });
        ws.on('error', j);
        ws.write(fs.readFileSync(F)); ws.end();
    });
    conn.end();
});
conn.connect(SERVER);
