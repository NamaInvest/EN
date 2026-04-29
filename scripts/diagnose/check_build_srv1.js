const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('tail -n 20 /tmp/build_sync.log', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).on('error', (err) => console.error(err)).connect({
    host: '185.197.195.202', port: 22, username: 'root', password: 'VmJUML2LuezRSws'
});
