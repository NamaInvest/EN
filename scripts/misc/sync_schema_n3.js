const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const BASE = '/www/wwwroot/n3.namainvist.com';
const schemaB64 = Buffer.from(fs.readFileSync('c:/Users/1/Desktop/alfa/prisma/schema.prisma')).toString('base64');

conn.on('ready', () => {
    console.log('Connected to N3...');
    const cmd = `
        echo "Pushing new schema..."
        echo "${schemaB64}" | base64 -d > ${BASE}/prisma/schema.prisma
        cd ${BASE}
        export DATABASE_URL="postgresql://namainvest:nmpass@127.0.0.1:5432/namainvest"
        npx prisma db push --accept-data-loss
        npx prisma generate
    `;
    conn.exec(cmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('done.');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
