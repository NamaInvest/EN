const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('find /root/zatca-sdk -name "fatoora" -type f', (err, stream) => {
        if (err) throw err;
        stream.on('data', data => {
            const path = data.toString().trim();
            console.log('Found:', path);
            if (path) {
                conn.exec(`chmod +x ${path} && ln -sf ${path} /usr/local/bin/fatoora && /usr/local/bin/fatoora -help | head -n 5`, (e, s) => {
                    s.on('data', d => console.log(d.toString()));
                    s.on('close', () => conn.end());
                });
            }
        }).stderr.on('data', data => console.error(data.toString()));
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
