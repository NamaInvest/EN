const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`cd /www/wwwroot/n2.namainvist.com && npx tsc --noEmit src/components/Sidebar.tsx 2>&1 | head -30`, (err, stream) => {
        let data = '';
        stream.on('data', d => data += d);
        stream.stderr.on('data', d => data += d);
        stream.on('close', () => {
            console.log(data);
            conn.end();
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
