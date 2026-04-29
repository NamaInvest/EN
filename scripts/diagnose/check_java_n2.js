const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('java -version', (err, stream) => {
        if (err) throw err;
        let o = '';
        stream.on('close', () => {
             console.log('N2 JAVA VERSION:', o);
             conn.end();
        }).on('data', d => o += d).stderr.on('data', d => o+= d);
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
