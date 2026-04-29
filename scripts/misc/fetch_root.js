const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmds = `
        cd /www/wwwroot/n2.namainvist.com
        npx prisma db push --accept-data-loss > /tmp/root_test.log 2>&1
        cat /tmp/root_test.log
    `;
    conn.exec(cmds, (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log("=== ROOT PRISMA LOG ===");
            console.log(out);
            console.log("=======================");
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
