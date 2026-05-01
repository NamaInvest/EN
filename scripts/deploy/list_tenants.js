const { Client } = require('ssh2');
const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
const REMOTE = '/www/wwwroot/n11.namainvist.com';
const conn = new Client();
conn.on('ready', () => {
    // List all DBs ending with _db (tenant convention from prisma.ts)
    const cmd = `cd ${REMOTE} && psql "$(grep '^DATABASE_URL' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | sed 's|/[^/?]*\\(?.*\\)*$|/postgres|' | sed 's/?.*$//')" -t -c "SELECT datname FROM pg_database WHERE datname LIKE '%_db' ORDER BY datname;"`;
    conn.exec(cmd, (e, s) => {
        let out = '';
        s.on('data', d => out += d);
        s.stderr.on('data', d => out += d);
        s.on('close', () => { console.log(out); conn.end(); });
    });
});
conn.connect(SERVER);
