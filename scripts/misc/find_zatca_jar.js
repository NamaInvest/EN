const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('find /usr/local -name "*zatca*.jar"', (err, stream) => {
        if (err) throw err;
        let o = '';
        stream.on('close', () => {
            console.log('JAR LOCATION:\\n', o);
            conn.end();
        }).on('data', d => o += d).stderr.on('data', d => o += d);
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD'});
