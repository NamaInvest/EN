const { Client } = require('ssh2');

const hostIp = '185.197.195.202';
const conn = new Client();

conn.on('ready', () => {
    console.log('Connected');
    conn.exec('cd /var/www/namasoft && npx prisma db push --schema=prisma/schema.prisma --accept-data-loss', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => console.log('OUT:', d.toString()));
        stream.stderr.on('data', d => console.error('ERR:', d.toString()));
        stream.on('close', (code) => {
            console.log('Exit code:', code);
            conn.end();
        });
    });
}).connect({
    host: hostIp, port: 22, username: 'root', password: 'VmJUML2LuezRSws', keepaliveInterval: 10000
});
