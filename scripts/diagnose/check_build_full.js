const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Search the file for what happened RIGHT AFTER "Route (app)" on N1
    conn.exec('grep -A 50 "=== Building on N1 ===" /root/safe_unified_sidebar_deploy.log', (err, stream) => {
        if (err) throw err;
        let d = '';
        stream.on('close', () => { console.log(d.slice(-2000)); conn.end(); }).on('data', data => d+=data).stderr.on('data', data => process.stderr.write(data));
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
