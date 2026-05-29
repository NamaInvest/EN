const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmds = `
        cat /www/wwwroot/n2.namainvist.com/.env > /tmp/debug.txt
        echo "===" >> /tmp/debug.txt
        cat /www/wwwroot/n2.namainvist.com/prisma_push.log >> /tmp/debug.txt
        echo "===" >> /tmp/debug.txt
        cat /www/wwwroot/n1.namainvist.com/.env >> /tmp/debug.txt
        echo "===" >> /tmp/debug.txt
        sudo -u postgres psql -c "\\du n1_db" >> /tmp/debug.txt
        sudo -u postgres psql -c "\\du n2_db" >> /tmp/debug.txt
        cat /tmp/debug.txt
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
