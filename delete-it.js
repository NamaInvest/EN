const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    // Note: use single quotes in the bash command so that bash receives the exact string
    const cmd = `
    rm -f '/www/wwwroot/namainvist.com/src/app/(dashboard)/v3/page.tsx'
    rm -f '/www/wwwroot/n1.namainvist.com/src/app/(dashboard)/v3/page.tsx'
    rm -f '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/v3/page.tsx'
    echo "Files deleted"
    `;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
});
