const { Client } = require('ssh2');

const hostIp = '46.4.188.170';
const targetDir = '/www/wwwroot/n1.namainvist.com';

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected via SSH.');
    conn.exec(`cd ${targetDir} && pm2 list && cat src/components/Sidebar.tsx | grep "إدارة العملات" && ls -la .next`, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', code => {
            console.log('DONE with code: ' + code);
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error('SSH Error', err);
}).connect({
    host: hostIp, port: 22, username: 'root',
    password: '_ee4SWbxLVfH9b'
});
ك