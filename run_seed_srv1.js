const { Client } = require('ssh2');

const hostIp = '185.197.195.202';
const conn = new Client();

conn.on('ready', () => {
    console.log('Connected to ' + hostIp);
    const script = `#!/bin/bash
cd /var/www/namasoft
npx prisma generate --schema=prisma/schema.prisma
npx prisma db push --schema=prisma/schema.prisma --accept-data-loss
npx tsx scripts/seed-warehouses.ts
`;
    conn.exec('cat > /tmp/seed.sh && bash /tmp/seed.sh', (err, stream) => {
        if (err) throw err;
        stream.write(script);
        stream.end();
        stream.on('close', (code, signal) => {
            console.log('Execution finished with code ' + code);
            conn.end();
        }).on('data', (data) => {
            console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
            console.log('STDERR: ' + data);
        });
    });
}).connect({
    host: hostIp,
    port: 22,
    username: 'root',
    password: 'VmJUML2LuezRSws'
});
