const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmds = `
        echo "=== N9 PM2 WHATSAPP ERROR LOG ==="
        pm2 logs n9-whatsapp --nostream --lines 50
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
    password: '_ee4SWbxLVfH9b',
    keepaliveInterval: 10000
});
