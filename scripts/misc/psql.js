const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('sudo -u postgres psql -d namadb -c "\\d products"', (err, stream) => {
        stream.on('data', d => process.stdout.write(d)).on('close', () => conn.end());
    });
}).connect({ host: '185.197.195.202', port: 22, username: 'root', password: 'VmJUML2LuezRSws' });
