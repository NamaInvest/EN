const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ متصل - جاري جلب السجلات...');
    // fetch last 100 lines of main-site logs
    conn.exec('pm2 logs main-site --lines 50 --nostream', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
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
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 30000
});
