const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Get the actual sk value from sidebar - to confirm menuItems uses sk not sectionKey
    conn.exec(`grep -n "s\\.dashboard\\|s\\.sales\\|sectionKey\\|sk:" /www/wwwroot/n2.namainvist.com/src/components/Sidebar.tsx | head -20`, (err, stream) => {
        let data = '';
        stream.on('data', d => data += d);
        stream.stderr.on('data', d => data += d);
        stream.on('close', () => {
            console.log(data);
            conn.end();
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
