const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Read the current username from the SQLite database and set the password again just in case
    const cmd = `
        echo "=== Current Username ==="
        sqlite3 /www/server/panel/data/default.db "SELECT username FROM users;"
        echo "=== Setting Password ==="
        cd /www/server/panel && /www/server/panel/pyenv/bin/python tools.py panel Namaa2026
    `;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log(out);
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    keepaliveInterval: 10000
});
