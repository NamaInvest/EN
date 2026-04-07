const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cat /root/safe_unified_sidebar_deploy.log | head -n 30', (err, stream) => {
        if (err) throw err;
        let d = '';
        stream.on('close', () => { console.log(d); conn.end(); }).on('data', data => d+=data).stderr.on('data', data => process.stderr.write(data));
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
