const { Client } = require('ssh2');
const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
const REMOTE = '/www/wwwroot/n11.namainvist.com';
const conn = new Client();
conn.on('ready', () => {
    const cmd = `cd ${REMOTE} && psql "$(grep '^DATABASE_URL' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | sed 's/?.*$//')" -c "SELECT code, name, prefix, current, reset_frequency FROM numbering_sequences ORDER BY id LIMIT 25;"`;
    conn.exec(cmd, (e, s) => {
        let out = '';
        s.on('data', d => out += d);
        s.stderr.on('data', d => out += d);
        s.on('close', () => { console.log(out); conn.end(); });
    });
});
conn.connect(SERVER);
