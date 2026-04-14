const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ SSH Connected');

    const cmd = `cd /www/wwwroot/n1.namainvist.com && npm install pg @types/pg --save && npm run build && pm2 restart n1 && pm2 save && echo "DONE"`;

    conn.exec(cmd, (err, stream) => {
        if (err) { console.error('Error:', err); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
            console.log('\n🚀 Done!');
            conn.end();
        });
    });
}).on('error', err => {
    console.error('SSH error:', err.message);
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 15000
});
