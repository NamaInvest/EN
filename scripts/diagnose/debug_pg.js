const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmds = `
        echo "=== PostgreSQL Roles ==="
        sudo -u postgres psql -c "\\du"
        echo "=== PostgreSQL Databases ==="
        sudo -u postgres psql -c "\\l"
        echo "=== Testing psql connection using n2_db credentials ==="
        sudo -u postgres psql -d n2_db -c "\\dn+"
        echo "=== Connection String Test ==="
        psql "postgresql://n2_db:n2_pass123@localhost:5432/n2_db?schema=public" -c "SELECT 1;" || echo "Failed!"
        echo "=== Raw .env file for n2 ==="
        cat /www/wwwroot/n2.namainvist.com/.env | hexdump -c
    `;
    conn.exec(cmds, (err, stream) => {
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
